"""Render supplied local code entirely in memory; no browser navigation/network.
This test fixture uses a storage adapter to exercise serialization and reloads.
It does not change the Chromium policies or the distributed application.
"""
import re, json, posixpath, base64, io
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parent.parent
def make_bundle():
 modules=[]
 for path in (ROOT/'src').rglob('*.js'):
  module_id=path.relative_to(ROOT).as_posix();source=path.read_text(encoding='utf-8')
  def rewrite(m):
   fields=m.group(1).strip();target=posixpath.normpath(posixpath.join(posixpath.dirname(module_id),m.group(2)))
   fields=re.sub(r'\b(\w+)\s+as\s+(\w+)\b',r'\1: \2',fields)
   return f'const {{ {fields} }} = __require({json.dumps(target)});'
  source=re.sub(r'^import\s*\{([\s\S]*?)\}\s*from\s*[\'"]([^\'"]+)[\'"];',rewrite,source,flags=re.M)
  names=re.findall(r'^export\s+(?:const|let|var|function|class)\s+(\w+)',source,re.M)
  source=re.sub(r'^export\s+(?=const|let|var|function|class)','',source,flags=re.M)
  assert not re.search(r'^import\s|^export\s',source,re.M),module_id
  modules.append(f'{json.dumps(module_id)}: function(__require) {{\n{source}\nreturn {{{", ".join(names)}}};\n}}')
 return '(()=>{const __modules={'+',\n'.join(modules)+'};const __cache={};function __require(id){return __cache[id]||(__cache[id]=__modules[id](__require));}window.__offlineRequire=__require;__require("src/app.js");})()'
def assets():
 result={}
 for path in (ROOT/'assets').rglob('*'):
  if not path.is_file() or path.suffix.lower() not in ['.png','.webp','.svg']:continue
  key='/'+path.relative_to(ROOT).as_posix()
  if path.suffix=='.svg': raw=path.read_bytes();mime='image/svg+xml'
  else:
   image=Image.open(path).convert('RGBA');image.thumbnail((256,256));buf=io.BytesIO();image.save(buf,format='PNG');raw=buf.getvalue();mime='image/png'
  result[key]=f'data:{mime};base64,'+base64.b64encode(raw).decode()
 return result
BUNDLE=make_bundle()
CSS=(ROOT/'src/styles.css').read_text(encoding='utf-8')+'\n*,*::before,*::after{animation:none!important;transition:none!important;}'
ASSETS=assets()
def init(page):
 page.evaluate('''()=>{const backing={};Object.defineProperty(window,'localStorage',{value:{getItem:k=>Object.hasOwn(backing,k)?backing[k]:null,setItem:(k,v)=>{backing[k]=String(v)},removeItem:k=>delete backing[k],clear:()=>Object.keys(backing).forEach(k=>delete backing[k])},configurable:true});}''')
 page.evaluate('''assets=>{window.__fixtureAssets=assets;const d=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');Object.defineProperty(Element.prototype,'innerHTML',{...d,set:function(value){return d.set.call(this,String(value).replace(/src="(\\/assets\\/[^"]+)"/g,(match,path)=>'src="'+(assets[path]||path)+'"'));}});}''',ASSETS)
 reload(page)
def reload(page):
 page.set_content('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>'+CSS+'</style></head><body><div id="app"></div></body></html>')
 page.evaluate(BUNDLE)
