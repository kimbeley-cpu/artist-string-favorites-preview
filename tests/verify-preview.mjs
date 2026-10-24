import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import assert from 'node:assert/strict';
const html=readFileSync('index.html','utf8');
const sw=readFileSync('sw.js','utf8');
const manifest=JSON.parse(readFileSync('manifest.webmanifest','utf8'));
function check(ok,msg){assert.ok(ok,msg);console.log('PASS',msg)}
check(html.includes('indexedDB.open("artist-box-web-preview",1)'), 'Independent IndexedDB');
check(html.includes('localStorage.getItem("artist-box-preview:"+k)'), 'Independent localStorage reads');
check(html.includes('localStorage.setItem("artist-box-preview:"+k'), 'Independent localStorage writes');
check(html.includes('id="cld" type="button" disabled'), 'Cloud sync visibly disabled');
check(html.includes('function clTouch(){}'), 'Local save preserved; sync is a no-op');
check(html.includes('asfPreviewBlocks(input)') && html.includes('asfPreviewBlocks(url)'), 'Both fetch and XHR block Supabase requests');
const forbidden=[
  /https?:\/\/[a-z0-9-]+\.supabase\.(?:co|in)(?:\/|$)/i,
  /\bsb_(?:publishable|secret)_[A-Za-z0-9_-]{8,}/,
  /\beyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{20,}\./,
  /\bpst-[A-Za-z0-9_-]{12,}/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{12,}/,
  /(?:CLOUD_URL|CLOUD_KEY|function clSync\(|\/rest\/v1\/asf_records|cloudInit\(\))/
];
check(forbidden.every(re=>!re.test(html)),'No credentials or production Supabase config');

check(html.includes('kvSet("token",tk)') && html.includes('kvGet("token")'),'NovelAI token remains browser-local');
check(html.includes('image.novelai.net/ai/generate-image'),'NovelAI generation still present');
check(html.includes('id="gcl"') && html.includes('id="gv"') && html.includes('id="grid"'),'Existing artist, character and Vibe UI retained');
check(sw.includes('asf-preview-shell-v1'),'Preview-only service worker cache');
check(manifest.name.includes('测试版'),'Preview PWA name');
const script=html.match(/<script>([\s\S]*?)<\/script>/);
check(!!script,'Application inline JS present');
new Script(script[1],{filename:'index.html'});
console.log('PASS Main JavaScript syntax');

check(html.includes('class="gen-layout"') && html.includes('class="gen-settings"') && html.includes('class="gen-preview"'), 'Stage B independent settings and preview columns');
check(html.includes('grid-template-columns:minmax(0,1fr) minmax(0,1.05fr)'), 'Stage B desktop two-column grid');
check(html.includes('@media(max-width:900px)') && html.includes('#gd .gen-layout{display:flex;flex-direction:column'), 'Stage B mobile stacked layout');
check((html.match(/<details class="gen-section"/g)||[]).length === 10, 'Stage F ten collapsible parameter groups');
const panel=html.slice(html.indexOf('<dialog id="gd">'),html.indexOf('<dialog id="bd">'));
for (const id of ['gs','gch','gcl','ge','gn','gv','gm','gz','gp','gc','gd2','gt','gauto','gg','gres','gdb','gsv']) {
  check((panel.match(new RegExp('id="' + id + '"','g'))||[]).length === 1, 'Existing generation control retained: '+id);
}
check((panel.match(/<details class="gen-section"/g)||[]).length === (panel.match(new RegExp('</details>', 'g'))||[]).length, 'Collapsible elements are paired');


const tokenDlg=html.slice(html.indexOf('<dialog id="tokenDialog"'),html.indexOf('<dialog id="gd">'));
const ordered=Array.from(panel.matchAll(/<summary>([^<]*)<\/summary>/g), x=>x[1]);
assert.deepEqual(ordered, ['画师串','角色栏','提示词','服装外观（预留）','负面提示词','模型与基础参数','Vibe Transfer（可选）','读取 NovelAI PNG 参数','图生图（Image to Image）','保存与下载设置']);
check((html.match(/id="gk"/g)||[]).length===1 && tokenDlg.includes('id="gk"') && !panel.includes('id="gk"'), 'Token input moved to header dialog');
for(const id of ['tokenSettings','tokenDialog','tokenSave','tokenClear','tokenClose','tokenStatus']){
  check(html.includes('id="'+id+'"'),'Token setting control present: '+id);
}
check(html.includes('kvSet("token",null)') && html.includes('kvSet("token",token)'), 'Original token key retained for save and clear');
check(html.includes('请先到顶栏「令牌设置」填写 NovelAI 令牌'),'Generation missing-token guidance updated');
check(html.includes('服装外观（预留）') && !html.includes('id="wardrobeActive"'),'Wardrobe placeholder is nonfunctional');

// Static checks do not establish live browser usability or API compatibility.

check(html.includes('id="gmanual"'),'Stage D manual placement switch');
check(html.includes('src="nai-character-positions.js"'),'Stage D coordinate mapper loaded');
check(html.includes('className="position-grid"'),'Stage D position grid generated');
check(html.includes('manual:$("gmanual").checked'),'Stage D mode persists in settings and metadata');

check(!panel.includes('<summary>多角色控制（阶段 D）</summary>'),'Duplicate character help panel removed');
check(html.includes('c.checked=vibeSelection[selectionKey]===true'),'Vibe checkbox state restored per item');
check(html.includes('vibeSelection:o')||html.includes('vibeSelection:vibeSelection'),'Vibe checkbox states persisted locally');
check(html.includes('resetNewVibeSelection(added)'),'New Vibes default unchecked');
check(html.includes('if(!c||!c.checked||!c.dataset.src)return'),'Only selected Vibes sent to generation');
