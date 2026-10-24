import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';
const src=readFileSync('nai-character-positions.js','utf8');new Script(src);
const sandbox={module:{exports:{}}};runInNewContext(src,sandbox);
const {center,position,label,apply}=sandbox.module.exports;
assert.equal(label(center(0,0)),'A1');assert.equal(label(center(4,4)),'E5');assert.equal(label(center(2,2)),'C3');
assert.equal(position(null).x,0.5);assert.equal(position(null).y,0.5);
assert.throws(()=>center(5,0),{name:'RangeError'});
function body(){return {parameters:{v4_prompt:{caption:{char_captions:[]}},v4_negative_prompt:{caption:{char_captions:[]}}}}}
const chars=[{text:'red hair',uc:'blue hair',pos:center(0,1)},{text:'black hair',uc:'white hair',pos:center(4,3)}];
let b=apply(body(),chars,true);assert.equal(b.parameters.use_coords,true);assert.equal(b.parameters.v4_prompt.use_coords,true);assert.equal(b.parameters.v4_negative_prompt.use_coords,true);
assert.equal(b.parameters.v4_prompt.caption.char_captions[0].centers[0].x,0.1);assert.equal(b.parameters.v4_prompt.caption.char_captions[0].centers[0].y,0.3);assert.equal(b.parameters.v4_negative_prompt.caption.char_captions[1].centers[0].x,0.9);
assert.equal(b.parameters.characterPrompts[1].uc,'white hair');assert.equal(b.parameters.characterPrompts[1].center.y,0.7);
b=apply(body(),chars,false);assert.equal(b.parameters.use_coords,false);assert.equal(b.parameters.v4_prompt.caption.char_captions[0].centers[0].x,0.5);
const html=readFileSync('index.html','utf8');assert.match(html,/pos:NaiCharacterPosition.position\(c.pos\)/);assert.match(html,/manual:\$\("gmanual"\)\.checked/);assert.match(html,/setChars\(m.ch\|\|\[\]\);\$\("gmanual"\)\.checked=!!m.manual/);
console.log('PASS 5x5 boundary/coordinate mapping, per-role prompts, auto/manual, persistence and history restoration');
