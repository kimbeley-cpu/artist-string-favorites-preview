import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext,Script} from 'node:vm';
const html=readFileSync('index.html','utf8'),src=readFileSync('wardrobe.js','utf8');
const check=(ok,msg)=>{assert.ok(ok,msg);console.log('PASS',msg)};
const plain=x=>JSON.parse(JSON.stringify(x));
new Script(src);const ctx={module:{exports:{}}};runInNewContext(src,ctx);
const api=ctx.module.exports,{styles,slots,randomOutfit,outfitToTags,appendTags}=api;
const browser={window:{}};runInNewContext(src,browser);
assert.equal(typeof browser.window.Wardrobe.appendTags,'function');
assert.equal(typeof createRequire(import.meta.url)('../wardrobe.js').randomOutfit,'function');
check(true,'Wardrobe IIFE supports browser and CommonJS without dependencies');
assert.deepEqual(plain(slots.map(s=>s.key)),['cut','color','decoration','accessory']);
for(const name of ['甜美','哥特','学院'])assert.ok(Object.values(styles).some(s=>s.zh===name));
for(const style of Object.values(styles))for(const slot of slots){
  assert.ok(style[slot.key].length>=6);
  for(const option of style[slot.key]){assert.match(option.zh,/[\u4e00-\u9fff]/);assert.match(option.en,/^[a-z]+(?:[ -][a-z]+)*$/)}
  assert.equal(new Set(style[slot.key].map(o=>o.en)).size,style[slot.key].length);
}
check(true,'Vocabulary complete: three styles, four slots, at least six zh/en options per slot');
function seeded(seed){return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)}
const current=randomOutfit('sweet',{}, {},seeded(42)),before=JSON.stringify(current),locks={cut:true,decoration:true};
let draws=0,rng=seeded(17),out=randomOutfit('gothic',current,locks,()=>{draws++;return rng()});
assert.equal(draws,2);assert.deepEqual(plain(out.cut),plain(current.cut));assert.deepEqual(plain(out.decoration),plain(current.decoration));
assert.deepEqual(plain(out),plain(randomOutfit('gothic',current,locks,seeded(17))));
for(const key of ['color','accessory'])assert.ok(styles.gothic[key].some(x=>x.en===out[key].en));
assert.equal(JSON.stringify(current),before);out.cut.zh='changed';assert.equal(JSON.stringify(current),before);
const allLocked=Object.fromEntries(slots.map(s=>[s.key,true]));
assert.deepEqual(plain(randomOutfit('academy',current,allLocked,()=>assert.fail('Locked slots must not consume rng'))),plain(current));
assert.equal(randomOutfit('sweet',{cut:null},{cut:true},()=>0).cut,null);
assert.equal(randomOutfit('sweet',{}, {},()=>0).cut.en,styles.sweet.cut[0].en);
assert.equal(randomOutfit('sweet',{}, {},()=>0.999999).cut.en,styles.sweet.cut.at(-1).en);
assert.throws(()=>randomOutfit('missing',{}, {},seeded(1)));assert.throws(()=>randomOutfit('sweet',{}, {},()=>1));
check(true,'Seeded random outfits preserve locks across styles, consume only unlocked draws and leave inputs unchanged');
assert.equal(outfitToTags(), '');assert.equal(outfitToTags({cut:null,color:{zh:'空',en:''},reference:'data:image/png;base64,AAAA'}),'');
assert.equal(outfitToTags({cut:{zh:'裙子',en:'dress'},color:null,decoration:{zh:'蝴蝶结',en:'bow'},extra:' lace trim, BOW, white gloves '}),'dress, bow, lace trim, white gloves');
assert.equal(randomOutfit('sweet',{extra:'white gloves'}, {},seeded(1)).extra,'white gloves');
check(true,'Outfit tags contain only nonempty English slots and custom tags; reference images are excluded');
for(const existing of ['  DRESS, dress,\n Bow  ',' {dress}, [bow], 1.2::lace trim::, ','','   ','dress,']){
  const result=appendTags(existing,' dress, DRESS, bow, BOW, choker, Choker, , ');
  assert.ok(result.startsWith(existing.trimEnd()));
  const present=new Set(existing.split(',').map(x=>x.trim().toLowerCase()));
  const additions=['dress','bow','choker'].filter(x=>!present.has(x));
  const prefix=!existing.trim()?'':existing.trimEnd().endsWith(',')?existing.trimEnd()+' ':existing+', ';
  assert.equal(result,additions.length?prefix+additions.join(', '):existing);
  assert.equal(appendTags(result,'dress, BOW, CHOKER'),result);
}
assert.equal(appendTags(' DRESS,\n bow  ','dress, BOW, ,'),' DRESS,\n bow  ');
assert.equal(appendTags('a,, a,\n',''),'a,, a,\n');assert.equal(appendTags(null,null),'');
for(const existing of ['1girl, smile,','1girl, smile, ','1girl, smile,\n','1girl, smile, \r\n\t'])assert.equal(appendTags(existing,'dress'),'1girl, smile, dress');
for(const existing of ['','   ','\r\n\t '])assert.equal(appendTags(existing,'dress, BOW, dress'),'dress, BOW');
assert.equal(appendTags(' \r\n ',''),'');
assert.equal(appendTags('  1girl,\n smile  ','dress'),'  1girl,\n smile  , dress');
check(true,'Tag appending deduplicates, avoids empty tags after trailing commas and preserves the remaining original text');
for(const id of ['wardrobeActive','wardrobeMode','wardrobeStyle','wardrobeRandom','wardrobeCut','wardrobeColor','wardrobeDecoration','wardrobeAccessory','wardrobeLockCut','wardrobeLockColor','wardrobeLockDecoration','wardrobeLockAccessory','wardrobeExtra','wardrobePreview','wardrobeChinese','wardrobeTarget','wardrobeWear','wardrobeName','wardrobeOwner','wardrobeReference','wardrobeReferencePreview','wardrobeReferenceClear','wardrobeReferenceStatus','wardrobeSave','wardrobeArchives','wardrobeRemoved','wardrobeStatus'])assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
assert.match(html,/<script src="wardrobe.js"><\/script>/);
new Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
check(true,'Wardrobe UI controls are unique, module is loaded and application JavaScript parses');
const section=(start,end)=>html.slice(html.indexOf(start),html.indexOf(end,html.indexOf(start)));
for(const [start,end] of [['async function generate(){','$("gen").onclick'],['async function generateGroup(){','function addToLib('],['function mkBody(','async function naiRequest('],['function saveGenCfg(){','function loadGenCfg()'],['function composeExtra(','/* ---- 阶段 G'],['function saveLib(){','function setView(']]){
  assert.ok(html.includes(start)&&html.includes(end),start+' boundary');
  assert.doesNotMatch(section(start,end),/wardrobe|Wardrobe/,start+' excludes wardrobe state and reference images');
}
const ui=section('/* ---- 阶段 G','function renderGenLib(){');
assert.match(ui,/kvSet\("wardrobe",wardrobeRecords\)/);assert.match(ui,/kvGet\("wardrobe"\)/);
assert.doesNotMatch(ui,/fetch\(|XMLHttpRequest|clTouch\(|kvSet\("(?:gen|lib|items)"/);
assert.match(ui,/file\.size>2\*1024\*1024/);assert.match(ui,/reader\.readAsDataURL\(file\)/);
assert.match(html,/updGpv\(\);wardrobeTargets\(\)/);assert.match(html,/renderGenNeg\(\);wardrobeOwners\(\);renderWardrobeArchive\(\)/);
check(true,'Archives use only the wardrobe local key; reference data is absent from both generation paths and settings');
const exportCode=section('$("exp").onclick','$("imp").onclick'),importCode=section('$("impf").onchange','$("add").onclick');
assert.match(exportCode,/if\(wardrobeReady\)data\.wardrobe=wardrobeRecords/);
assert.match(exportCode,/!\(wardrobeReady&&wardrobeRecords\.length\)/);assert.match(exportCode,/JSON\.stringify\(data\)/);
assert.doesNotMatch(exportCode,/\.filter\(/);
assert.match(importCode,/if\(Array\.isArray\(d\.wardrobe\)&&!wardrobeReady\)await loadWardrobe\(\)/);
assert.match(importCode,/d\.wardrobe\.filter\(wardrobeValidRecord\)\.forEach\(function\(x\)\{if\(!wardrobeRecords\.some\(function\(y\)\{return y\.id===x\.id\}\)\)\{/);
assert.match(importCode,/if\(!wardrobeValidReference\(x\.reference\)\)delete x\.reference;wardrobeRecords\.push\(x\);w\+\+/);
assert.match(importCode,/wardrobePersist\(\)/);assert.match(ui,/records\.filter\(wardrobeValidRecord\)/);
assert.doesNotMatch(importCode,/wardrobeRecords\[[^\]]+\]\s*=|Object\.assign|\.splice\(/);
check(true,'Backups include ready wardrobe records including removed outfits; imports share validation and merge by id without overwriting');

// Exercise the actual inline wardrobe controller with a small DOM substitute.
// This verifies state transitions; it does not establish browser layout or image decoding.
class Element{
  constructor(tag='div'){this.tag=tag;this.children=[];this._value='';this._text='';this.hidden=false;this.disabled=false;this.checked=false;this.style={};this.files=[]}
  appendChild(el){this.children.push(el);return el}
  set innerHTML(value){assert.equal(value,'');this.children=[];this._value='';this._text=''}
  get options(){return this.children}
  get selectedIndex(){return this.options.findIndex(x=>x.value===this.value)}
  get value(){if(this.tag==='select')return this.options.some(x=>x.value===this._value)?this._value:(this.options[0]?.value||'');return this._value}
  set value(v){this._value=String(v)}
  get textContent(){return this._text}
  set textContent(v){this._text=String(v);this.children=[]}
  removeAttribute(name){delete this[name]}
  focus(){}
  click(){}
}
const elements=new Map();
for(const match of html.matchAll(/<([a-z]+)\b[^>]*\bid="([^"]+)"[^>]*>/g))elements.set(match[2],new Element(match[1]));
const $=id=>{assert.ok(elements.has(id),id);return elements.get(id)};
for(const match of html.matchAll(/<select[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g))for(const o of match[2].matchAll(/<option value="([^"]*)"[^>]*>([^<]*)<\/option>/g)){const el=new Element('option');el.value=o[1];el.textContent=o[2];$(match[1]).appendChild(el)}
const storage=new Map(),writes=[],readers=[],images=[];let nextId=0,genSaves=0;
const sandbox={Wardrobe:api,$,document:{createElement:tag=>new Element(tag)},lib:{chars:[{id:'alice',name:'爱丽丝'},{id:'bob',name:'鲍勃'}]},gChars:[{lib:'alice',text:'  DRESS, red hair\n'},{lib:'bob',text:'blue eyes'},{lib:'',text:''}],
  toast:()=>{},uid:()=>`outfit-${++nextId}`,kvGet:k=>Promise.resolve(storage.get(k)),kvSet:(k,v)=>{writes.push(k);storage.set(k,plain(v))},saveGenCfg:()=>{genSaves++},updGpv:()=>{},renderGc:()=>sandbox.wardrobeTargets(),
  FileReader:class{readAsDataURL(){readers.push(this)}readAsText(){readers.push(this)}},Image:class{set src(v){this.data=v;images.push(this)}}};
runInNewContext(ui,sandbox);assert.equal($('wardrobeSave').disabled,true);
await sandbox.loadWardrobe();assert.equal(sandbox.wardrobeRecords.length,0);assert.equal($('wardrobeSave').disabled,false);
sandbox.wardrobeOwners();assert.equal($('wardrobeTarget').options.length,4);assert.equal($('wardrobeOwner').options.length,3);
$('wardrobeRandom').onclick();assert.ok($('wardrobePreview').textContent);assert.equal($('wardrobeCut').disabled,true);
const locked=sandbox.wardrobeCurrent.cut.en;$('wardrobeLockCut').checked=true;$('wardrobeStyle').value='academy';$('wardrobeStyle').onchange();$('wardrobeRandom').onclick();assert.equal(sandbox.wardrobeCurrent.cut.en,locked);
$('wardrobeMode').value='detail';$('wardrobeMode').onchange();assert.equal($('wardrobeCut').disabled,false);assert.equal($('wardrobeRandomActions').hidden,true);
$('wardrobeColor').value=styles.academy.color[2].en;$('wardrobeColor').onchange();assert.equal(sandbox.wardrobeCurrent.color.en,styles.academy.color[2].en);
$('wardrobeExtra').value='white gloves';$('wardrobeExtra').oninput();assert.match($('wardrobePreview').textContent,/white gloves/);
check(true,'Legacy empty storage boots; mode switching, style filtering, locks and live preview work');

$('ge').value='  DRESS, original\n';$('wardrobeTarget').value='main';$('wardrobeWear').onclick();const main=$('ge').value;assert.ok(main.startsWith('  DRESS, original\n'));$('wardrobeWear').onclick();assert.equal($('ge').value,main);
$('wardrobeTarget').value='role:0';const roleBefore=sandbox.gChars[0].text;$('wardrobeWear').onclick();assert.ok(sandbox.gChars[0].text.startsWith(roleBefore));assert.equal($('ge').value,main);assert.equal(sandbox.gChars[1].text,'blue eyes');
$('wardrobeTarget').value='role:2';$('wardrobeWear').onclick();assert.ok(sandbox.gChars[2].text.includes('white gloves'));
const chosen=sandbox.gChars[2];sandbox.gChars.splice(0,1);sandbox.wardrobeTargets();assert.equal($('wardrobeTarget').value,'role:1');assert.equal(sandbox.gChars[1],chosen);
sandbox.gChars.splice(1,1);sandbox.wardrobeTargets();assert.equal($('wardrobeTarget').value,'main');
check(true,'Wear appends to the selected main/role prompt, handles blank roles and follows role identity after removal');

const ref='data:image/png;base64,AAAA';
sandbox.wardrobeReadReference({type:'image/svg+xml',size:10});sandbox.wardrobeReadReference({type:'image/png',size:2*1024*1024+1});assert.equal(readers.length,0);
sandbox.wardrobeReadReference({type:'image/png',size:2*1024*1024});assert.equal($('wardrobeSave').disabled,true);readers.at(-1).result=ref;readers.at(-1).onload();images.at(-1).onload();assert.equal(sandbox.wardrobeReference,ref);assert.equal($('wardrobeSave').disabled,false);
sandbox.wardrobeReadReference({type:'image/jpeg',size:20});const late=readers.at(-1);$('wardrobeReferenceClear').onclick();late.result=ref;late.onload();assert.equal(sandbox.wardrobeReference,'');assert.equal($('wardrobeReferencePreview').hidden,true);
sandbox.wardrobeReadReference({type:'image/webp',size:20});readers.at(-1).result='data:image/webp;base64,AAAA';readers.at(-1).onload();images.at(-1).onerror();assert.equal(sandbox.wardrobeReference,'');assert.equal($('wardrobeSave').disabled,false);
sandbox.wardrobeSetReference(ref);assert.equal(sandbox.wardrobeValidReference('https://example.invalid/image.png'),false);
check(true,'Reference files enforce type/2MB limits, validate decoding, block pending saves and ignore stale reads after clearing');

$('wardrobeName').value='套装一';$('wardrobeOwner').value='alice';const editorBeforeSave=JSON.stringify(sandbox.wardrobeCurrent);$('wardrobeSave').onclick();
assert.equal($('wardrobeName').value,'');assert.equal(sandbox.wardrobeReference,'');assert.equal($('wardrobeReferencePreview').hidden,true);assert.equal(JSON.stringify(sandbox.wardrobeCurrent),editorBeforeSave);
$('wardrobeName').value='套装二';$('wardrobeSave').onclick();assert.equal(sandbox.wardrobeRecords[1].reference,'');$('wardrobeName').value='无归属';$('wardrobeOwner').value='';$('wardrobeSave').onclick();
check(true,'Saving a new outfit clears its name and reference image while preserving editor slots');
assert.equal(sandbox.wardrobeRecords.length,3);assert.equal($('wardrobeArchives').children.length,2);assert.equal(storage.get('wardrobe')[0].reference,ref);
const first=plain(sandbox.wardrobeRecords[0]),second=JSON.stringify(sandbox.wardrobeRecords[1]),prompts=JSON.stringify({main:$('ge').value,chars:sandbox.gChars}),savedCount=genSaves;
sandbox.wardrobeLoad(sandbox.wardrobeRecords[0]);$('wardrobeExtra').value='boots';$('wardrobeExtra').oninput();assert.deepEqual(plain(sandbox.wardrobeRecords[0]),first);
sandbox.wardrobeRemove(first.id,true);assert.ok(sandbox.wardrobeRecords[0].removedAt);assert.equal($('wardrobeRemoved').children.length,1);assert.equal(JSON.stringify(sandbox.wardrobeRecords[1]),second);
assert.equal(JSON.stringify({main:$('ge').value,chars:sandbox.gChars}),prompts);assert.equal(genSaves,savedCount);
sandbox.wardrobeRemove(first.id,false);assert.deepEqual(plain(sandbox.wardrobeRecords[0]),first);assert.equal($('wardrobeRemoved').children.length,0);assert.equal(JSON.stringify(sandbox.wardrobeRecords[1]),second);assert.equal(genSaves,savedCount);
sandbox.lib.chars=[];sandbox.wardrobeOwners();sandbox.renderWardrobeArchive();sandbox.wardrobeLoad(sandbox.wardrobeRecords[0]);sandbox.wardrobeLoad(sandbox.wardrobeRecords[0]);assert.equal($('wardrobeOwner').value,'alice');assert.equal($('wardrobeOwner').options.filter(o=>o.value==='alice').length,1);
await sandbox.loadWardrobe();assert.equal(sandbox.wardrobeRecords.length,3);assert.equal(sandbox.wardrobeRecords[0].reference,ref);assert.ok(writes.every(k=>k==='wardrobe'));
check(true,'Named snapshots group by owner, survive reload and missing owners, and soft delete/restore without touching prompts or other archives');

// Execute the backup handlers too, including the not-yet-loaded and legacy paths.
const backups=[],messages=[];
Object.assign(sandbox.lib,{prompts:[],negs:[],vibes:[],marked:[]});
Object.assign(sandbox,{items:[],Blob:class{constructor(parts){this.data=JSON.parse(parts.join(''))}},URL:{createObjectURL(blob){backups.push(blob.data);return 'blob:test'},revokeObjectURL(){}},setTimeout:()=>{},save:()=>{},render:()=>{},saveLib:()=>{},renderGenLib:()=>{},toast:msg=>messages.push(msg)});
runInNewContext(exportCode+importCode,sandbox);
sandbox.wardrobeRemove(first.id,true);const recordsForBackup=plain(sandbox.wardrobeRecords);
$('exp').onclick();const backup=backups.at(-1);assert.deepEqual(backup.wardrobe,recordsForBackup);assert.ok(backup.wardrobe[0].removedAt);
sandbox.wardrobeReady=false;sandbox.items=[{id:'item',str:'artist:test'}];$('exp').onclick();assert.equal(Object.hasOwn(backups.at(-1),'wardrobe'),false);
sandbox.items=[];const exportCount=backups.length;$('exp').onclick();assert.equal(backups.length,exportCount);assert.equal(messages.at(-1),'还没有内容可以导出');
async function importBackup(data){$('impf').files=[{}];$('impf').onchange();const reader=readers.at(-1);reader.result=JSON.stringify(data);await reader.onload()}
sandbox.wardrobeReady=true;sandbox.wardrobeRecords=[];storage.set('wardrobe',[]);
const restoredRecords=plain(recordsForBackup);for(const x of restoredRecords)if(!sandbox.wardrobeValidReference(x.reference))delete x.reference;
await importBackup(backup);assert.deepEqual(plain(sandbox.wardrobeRecords),restoredRecords);assert.deepEqual(storage.get('wardrobe'),restoredRecords);assert.equal($('wardrobeRemoved').children.length,1);assert.equal(messages.at(-1),'导入了 0 条，导入了 3 套服装');
sandbox.wardrobeRecords[0].name='本机名称';const local=plain(sandbox.wardrobeRecords[0]);
await importBackup({wardrobe:[backup.wardrobe[0],{...first,id:'new',reference:'https://example.invalid/image.png'},{...first,id:'new',name:'重复项'},null,{...first,id:42},{...first,name:42},{id:'no-outfit',name:'无服装'}]});
assert.equal(sandbox.wardrobeRecords.length,4);assert.deepEqual(plain(sandbox.wardrobeRecords[0]),local);assert.equal(Object.hasOwn(sandbox.wardrobeRecords[3],'reference'),false);assert.equal(sandbox.wardrobeRecords[3].name,first.name);assert.deepEqual(storage.get('wardrobe'),plain(sandbox.wardrobeRecords));assert.equal(messages.at(-1),'导入了 0 条，导入了 1 套服装');
const beforeLegacy=JSON.stringify(sandbox.wardrobeRecords),writesBeforeLegacy=writes.length;
await importBackup({v:2,items:[{id:'legacy',str:'artist:legacy'}],lib:{}});assert.equal(JSON.stringify(sandbox.wardrobeRecords),beforeLegacy);assert.equal(writes.length,writesBeforeLegacy);assert.equal(sandbox.items.length,1);assert.equal(messages.at(-1),'导入了 1 条');
sandbox.wardrobeReady=false;sandbox.wardrobeRecords=[];
await importBackup({wardrobe:[backup.wardrobe[0],{...first,id:'after-load'}]});assert.equal(sandbox.wardrobeReady,true);assert.deepEqual(plain(sandbox.wardrobeRecords[0]),local);assert.equal(sandbox.wardrobeRecords.length,5);
check(true,'Backup round trips restore removed outfits and references; invalid records/images, duplicate ids, pending loads and legacy imports behave correctly');
