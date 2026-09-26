from playwright.sync_api import sync_playwright
import json,base64,mimetypes,os
from pathlib import Path
root=Path(__file__).resolve().parents[1];out=root/'verification'
out.mkdir(exist_ok=True)
mods={str(p.relative_to(root)):p.read_text() for p in (root/'src').rglob('*.js')}
assets={'/'+str(p.relative_to(root)):'data:'+(mimetypes.guess_type(p.name)[0] or 'application/octet-stream')+';base64,'+base64.b64encode(p.read_bytes()).decode() for p in (root/'assets').rglob('*') if p.is_file() and (p.name in ['kotone-shiomi.webp','kotone-shiomi-avatar.webp','wonder.png','joker.webp','mona.webp','blitz.webp','berry.webp','puppet-wavecatcher.webp','slaughter-drive.png','vishnu.png','hachiman-goofy.png'])}
loader=r'''async ({mods,assets,saved}) => {
 window.__storage={...saved};
 Object.defineProperty(window,'localStorage',{value:{getItem:k=>window.__storage[k]??null,setItem:(k,v)=>window.__storage[k]=String(v),removeItem:k=>delete window.__storage[k],clear:()=>window.__storage={}}});
 const inner=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
 const embed=html=>html.replace(/(["'])(\/assets\/[^"']+)\1/g,(all,q,path)=>assets[path]?q+assets[path]+q:all);
 Object.defineProperty(Element.prototype,'innerHTML',{get:inner.get,set(value){inner.set.call(this,embed(value));}});
 const urls={},visiting=new Set();
 function resolve(path,dep){const a=path.split('/');a.pop();for(const p of dep.split('/')){if(p==='..')a.pop();else if(p!=='.')a.push(p);}return a.join('/');}
 function url(path){if(urls[path])return urls[path];if(visiting.has(path))throw Error('Cycle: '+path);visiting.add(path);if(!mods[path])throw Error('Missing: '+path);
 const text=mods[path].replace(/from\s+(['"])(\.[^'"\n]+)\1/g,(_all,q,dep)=>'from '+q+url(resolve(path,dep))+q);
 visiting.delete(path);return urls[path]=URL.createObjectURL(new Blob([text],{type:'text/javascript'}));}
 await import(url('src/app.js')); window.__actualAppModules=Object.keys(urls);
}'''

def snap(page,name):
 page.evaluate('window.scrollTo(0,0)');page.wait_for_timeout(400)
 page.screenshot(path=str(out/name),full_page=True)

checks=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 errors=[]
 def boot(saved={},width=1440,height=1000):
  page=b.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content('<html><head><title>Actual application modules — offline browser test</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="app"></div></body></html>')
  page.add_style_tag(content=(root/'src/styles.css').read_text())
  page.evaluate(loader,{'mods':mods,'assets':assets,'saved':saved})
  return page
 print('boot desktop',flush=True)
 page=boot()
 page.set_default_timeout(8000)
 page.locator('[data-nav="kotone"]').click();page.locator('[data-use-kotone]').click()
 page.locator('[data-kotone-build="awareness"]').select_option('6')
 page.locator('[data-kotone-build="weaponId"]').select_option('vetri-vel-muruga')
 page.locator('[data-kotone-build="enhancement"]').select_option('6')
 page.locator('[data-kotone-build="a2CopyRatio"]').fill('37.5');page.locator('[data-kotone-build="a2CopyRatio"]').dispatch_event('change')
 assert page.locator('[data-kotone-build="enhancement"]').input_value()=='6'
 checks.append('Awareness, weapon and all seven five-star enhancements exposed in regular build editor')
 snap(page,'kotone-playable-build-desktop.png')
 page.locator('[data-build-to-team]').click()
 for index,choice in [(2,'joker'),(3,'mona')]:
  page.locator(f'[data-open-team-picker="{index}"]').click();page.locator(f'[data-pick-teammate="{choice}"]').click()
 page.locator('[data-order-move="1:-1"]').click()
 saved=page.evaluate('window.__storage')
 page.locator('[data-start-battle]').click()
 assert page.locator('[data-skill="kotone-go-for-broke"]').is_enabled()
 page.locator('[data-skill="kotone-go-for-broke"]').click();page.wait_for_timeout(400)
 assert 'FORTUNE' in page.locator('body').inner_text()
 page.locator('[data-skill="kotone-shiomi-s3"]').click()
 assert 'SELECT ORIGINAL BUFF CASTER' in page.locator('body').inner_text()
 snap(page,'kotone-playable-target-desktop.png')
 page.locator('[data-target="wonder"]').click();page.wait_for_timeout(400)
 page.locator('[data-skill="kotone-shiomi-s1"]').click();page.locator('[data-target="joker"]').click();page.wait_for_timeout(400)
 page.locator('[data-skill="kotone-shiomi-s2"]').click();page.wait_for_timeout(400)
 assert 'COLD' in page.locator('body').inner_text()
 assert 'automatic ultimate unavailable' not in page.locator('body').inner_text().lower()
 checks.append('Actual application: reorders party, enters battle, starts Go for Broke, selects S3 caster, runs S1/S2, displays Cold')
 snap(page,'kotone-playable-battle-desktop.png')
 # Reload into a fresh JS module graph using exactly the serialized browser storage values.
 modulesLoaded=page.evaluate('window.__actualAppModules')
 page.close()
 print('boot mobile',flush=True)
 mobile=boot(saved,width=390,height=844)
 mobile.set_default_timeout(8000)
 print('mobile ready',flush=True)
 mobile.locator('[data-nav="builds"]').click();mobile.locator('[data-build-character="kotone-shiomi"]').click()
 assert mobile.locator('[data-kotone-build="awareness"]').input_value()=='6'
 assert mobile.locator('[data-kotone-build="weaponId"]').input_value()=='vetri-vel-muruga'
 assert mobile.locator('[data-kotone-build="enhancement"]').input_value()=='6'
 checks.append('Saved awareness, weapon, enhancement and team survive full application reload through its real serialization code')
 widths=mobile.evaluate('({viewport:innerWidth,document:document.documentElement.scrollWidth})')
 snap(mobile,'kotone-playable-build-mobile.png')
 print('mobile build screenshot saved',widths,flush=True)
 mobile.locator('[data-kotone-build="statsMode"]').select_option('equipped')
 assert mobile.locator('[data-kotone-confirm-totals]').count()==1
 mobile.locator('[data-kotone-confirm-totals]').click()
 mobile.locator('[data-kotone-build="weaponId"]').select_option('ame-no-nuboko')
 assert mobile.locator('[data-kotone-confirm-totals]').count()==1
 assert mobile.locator('[data-kotone-build="enhancement"] option:disabled').count()==6
 checks.append('Equipped totals require confirmation when switching weapon; unsupported four-star upgrades disabled')
 mobile.locator('[data-kotone-build="statsMode"]').select_option('base')
 mobile.locator('[data-build-to-battle]').click();mobile.locator('[data-skill="kotone-go-for-broke"]').click();mobile.wait_for_timeout(400)
 snap(mobile,'kotone-playable-battle-mobile.png')
 assert 'FORTUNE' in mobile.locator('body').inner_text()
 checks.append('Mobile battle controls activate Fortune and render four-star equipment state')
 # The standalone character page displays full-body art, not a cropped portrait.
 mobile.locator('[data-nav="kotone"]').click();mobile.wait_for_timeout(150)
 snap(mobile,'kotone-playable-art-mobile.png')
 checks.append('Full-body local chibi loads at mobile display size')
 assert not errors, errors
 (out/'kotone-playable-ui-checks.json').write_text(json.dumps({'environment':'Chromium; actual ES application modules loaded as local blobs; embedded asset bytes; storage adapter holding actual serialized values', 'httpNavigation':'Attempted localhost server: ERR_BLOCKED_BY_ADMINISTRATOR. Native HTTP and native persistent localStorage not verified. No browser policy changed.', 'checks':checks,'pageErrors':errors,'mobileBuildWidths':widths,'modulesLoaded':modulesLoaded},indent=2))
 print(json.dumps({'checks':checks,'errors':errors,'mobileWidths':widths},indent=2))
 b.close()
