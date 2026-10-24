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
// Stage A static tests cannot establish live browser behavior.
