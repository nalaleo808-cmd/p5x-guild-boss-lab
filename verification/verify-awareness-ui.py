from playwright.sync_api import sync_playwright
from pathlib import Path
import json
import os, shutil
import offline_browser_fixture as fixture
out=Path(__file__).resolve().parent;out.mkdir(exist_ok=True)
results={'execution':'offline browser renderer; serialized storage adapter; no navigation or network','errors':[], 'roster_count':0, 'rank_selections_checked':0, 'checks':[]}
with sync_playwright() as p:
 browser_path=os.environ.get('CHROMIUM_BINARY') or shutil.which('chromium') or shutil.which('chromium-browser')
 browser=p.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':browser_path} if browser_path else {}))
 page=browser.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
 page.on('pageerror',lambda error:results['errors'].append(str(error)))
 fixture.init(page)
 assert page.locator('[data-awareness-select]').count()==5
 # Team picker must render existing identities and no ReferenceError.
 page.locator('[data-open-team-picker]').first.click()
 assert page.locator('[data-pick-teammate]').count()==22
 page.locator('[data-close-team-picker]').click()
 page.locator('[data-nav="builds"]').click()
 ids=page.locator('[data-build-character]').evaluate_all('(buttons)=>buttons.map(b=>b.dataset.buildCharacter)')
 assert len(ids)==26 and len(set(ids))==26
 results['roster_count']=len(ids)
 results['rank_selections_checked']=page.evaluate('''ids=>{
   let checked=0;
   for(const uid of ids){
     document.querySelector(`[data-build-character="${uid}"]`).click();
     if(document.querySelectorAll('[data-awareness-rank]').length!==7)throw Error(uid+' missing ranks');
     for(let rank=0;rank<7;rank++){
       document.querySelector(`[data-awareness-rank="${rank}"]`).click();
       const pressed=document.querySelector(`[data-awareness-rank="${rank}"]`).getAttribute('aria-pressed');
       const saved=JSON.parse(localStorage.getItem('p5x-loadouts-v3'))[uid].awareness;
       if(pressed!=='true'||saved!==rank)throw Error(uid+' A'+rank+' mismatch');
       checked++;
     }
   }
   return checked;
 }''',ids)
 print('All rank button/serialization checks passed',flush=True)
 results['checks'].append('Every A0–A6 button for all 26 entries saves the correct numeric rank (182 selections).')
 # Legacy nested Cosmic setting must survive migration.
 page.evaluate('''()=>localStorage.setItem('p5x-loadouts-v3',JSON.stringify({
   'lufel-recent-bui-cosmic':{cosmicYui:{awareness:2,sourceTier:1,weapon:'signature',refinement:4}},
   'lufel-recent-berry':{awareness:1,baseStats:{attack:6543,maxHp:12345}},
   'navigator-miku':{awareness:0}
 }))''')
 fixture.reload(page)
 page.locator('[data-nav="builds"]').click()
 page.locator('[data-build-character="lufel-recent-bui-cosmic"]').click()
 assert page.locator('[data-awareness-rank="2"]').get_attribute('aria-pressed')=='true'
 assert page.locator('[data-cosmic-option="weapon"]').input_value()=='signature'
 page.locator('[data-awareness-rank="0"]').click()
 assert page.evaluate('()=>JSON.parse(localStorage.getItem("p5x-loadouts-v3"))["lufel-recent-bui-cosmic"].cosmicYui.awareness')==0
 print('Migration passed',flush=True)
 results['checks'].append('Old Cosmic Yui nested awareness migrates, preserving weapon/refinement options.')
 # Manual inputs are left intact; auto stats are blank rather than silently pinned.
 page.locator('[data-build-character="lufel-recent-berry"]').click()
 assert page.locator('[data-base-stat="attack"]').input_value()=='6543'
 page.locator('[data-awareness-rank="6"]').click()
 assert page.locator('[data-base-stat="attack"]').input_value()=='6543'
 page.locator('[data-build-character="lufel-recent-noir"]').click()
 assert page.locator('[data-base-stat="attack"]').input_value()==''
 a6=float(page.locator('[data-base-stat="attack"]').get_attribute('placeholder'))
 page.locator('[data-awareness-rank="0"]').click()
 a0=float(page.locator('[data-base-stat="attack"]').get_attribute('placeholder'))
 assert a0<a6
 assert page.locator('[data-base-stat="attack"]').input_value()==''
 results['checks'].append('Manual stats are unchanged by rank switches; blank stats track rank-specific source defaults.')
 # Build search retains access to all existing names, including navigators.
 page.locator('[data-build-search]').fill('miku')
 assert page.locator('[data-build-character]:visible').count()==1
 page.locator('[data-build-search]').fill('')
 assert page.locator('[data-build-character]').count()==26
 # Make a team with clearly distinct ranks. J&C off-party A0 must remove the
 # previously forced account-wide A6 flag from the actual new battle config.
 page.locator('[data-build-character="lufel-recent-j-c"]').click()
 page.locator('[data-awareness-rank="0"]').click()
 page.locator('nav [data-nav="setup"]').click()
 page.locator('[data-open-team-picker="1"]').click()
 page.locator('[data-pick-teammate="lufel-recent-bui-cosmic"]').click()
 page.locator('[data-awareness-select="wonder"]').select_option('3')
 page.locator('[data-awareness-select="lufel-recent-bui-cosmic"]').select_option('0')
 page.locator('[data-awareness-select="lufel-recent-berry"]').select_option('2')
 page.locator('[data-awareness-select="lufel-recent-puppet-wavecatcher"]').select_option('4')
 page.locator('[data-open-navigator-picker]').click()
 page.locator('[data-pick-navigator="navigator-miku"]').click()
 page.locator('[data-awareness-select="navigator-miku"]').select_option('0')
 # Reload through the real persistence path before launching.
 fixture.reload(page)
 assert page.locator('[data-awareness-select="wonder"]').input_value()=='3'
 assert page.locator('[data-awareness-select="navigator-miku"]').input_value()=='0'
 # Instrument the existing exported class only in the verification browser;
 # no test hook is added to the distributed app.
 page.evaluate('''()=>{const {BattleEngine}=window.__offlineRequire('src/engine.js');const reset=BattleEngine.prototype.reset;BattleEngine.prototype.reset=function(){reset.call(this);window.__verifiedEngine=this;};}''')
 page.locator('[data-start-battle]').click()
 state=page.evaluate('''()=>({
   party:__verifiedEngine.state.party.map(u=>({id:u.id,rank:u.awareness})),
   navigator:{id:__verifiedEngine.state.navigator.id,rank:__verifiedEngine.state.navigator.awareness},
   jcA6Unlocked:__verifiedEngine.config.jcA6Unlocked,
   cosmicPermanent:__verifiedEngine.state.party.find(u=>u.slug==='bui-cosmic').cosmicYui.permanentHarvest
 })''')
 assert [unit['rank'] for unit in state['party']]==[3,0,2,4],state
 assert state['navigator']['rank']==0 and state['jcA6Unlocked'] is False
 assert state['cosmicPermanent'] is False
 results['battle_state']=state
 results['checks'].append('Rendered app launches an engine with independent party/navigator ranks after a simulated storage reload; J&C A6 is no longer forced.')
 # Verify changing a build invalidates the previous battle and reset rebuilds.
 page.locator('[data-nav="builds"]').click()
 page.locator('[data-build-character="lufel-recent-bui-cosmic"]').click()
 page.locator('[data-awareness-rank="6"]').click()
 assert page.locator('[data-nav="battle"]').is_disabled()
 page.locator('[data-build-to-battle]').click()
 assert page.evaluate("()=>__verifiedEngine.state.party.find(u=>u.slug==='bui-cosmic').cosmicYui.permanentHarvest") is True
 results['checks'].append('Changing a rank invalidates the old battle; the next battle uses the new awareness mechanics.')
 # Final verified desktop capture, no mockup.
 page.locator('[data-nav="builds"]').click()
 page.locator('[data-build-character="lufel-recent-bui-cosmic"]').click()
 page.evaluate('window.scrollTo(0,0)')
 page.screenshot(path=str(out/'awareness-desktop.png'),full_page=False)
 desktop_overflow=page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 1')
 assert not desktop_overflow
 # All character images referenced by the actual current DOM must be local and loaded.
 broken=page.locator('img').evaluate_all('(imgs)=>imgs.filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src)')
 assert not broken,broken
 # Compact viewport: control targets and page must remain reachable.
 page.set_viewport_size({'width':390,'height':844})
 page.evaluate('window.scrollTo(0,0)')
 page.screenshot(path=str(out/'awareness-mobile.png'),full_page=False)
 mobile_overflow=page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 1')
 results['mobile_overflow']=mobile_overflow
 assert not mobile_overflow
 page.locator('[data-awareness-rank="5"]').click()
 assert page.locator('[data-awareness-rank="5"]').get_attribute('aria-pressed')=='true'
 results['checks'].append('Desktop and 390px mobile layouts have no horizontal page overflow; all referenced artwork loads.')
 page.locator('nav [data-nav="setup"]').click()
 page.locator('[data-awareness-select="navigator-miku"]').select_option('0')
 page.locator('[data-load-recorded-benchmark]').click()
 assert page.locator('[data-awareness-select]').evaluate_all('(inputs)=>inputs.every(input=>input.value==="6")')
 page.locator('[data-boss="hachiman"]').click()
 page.locator('[data-awareness-select="navigator-miku"]').select_option('1')
 page.locator('[data-load-hachiman-recorded]').click()
 assert page.locator('[data-awareness-select]').evaluate_all('(inputs)=>inputs.every(input=>input.value==="6")')
 results['checks'].append('Both recorded A6 presets explicitly restore all party and navigator ranks to A6.')
 assert not results['errors'],results['errors']
 results['passed']=True
 browser.close()
(out/'awareness-browser-results.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results,indent=2))
