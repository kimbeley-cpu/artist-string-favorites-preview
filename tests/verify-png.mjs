import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { deflateSync, gzipSync } from "node:zlib";
import { Script, runInNewContext } from "node:vm";
const src=readFileSync("nai-png-metadata.js","utf8");
const html=readFileSync("index.html","utf8");
new Script(src,{filename:"nai-png-metadata.js"});
const sandbox={module:{exports:{}},TextDecoder,Uint8Array,Uint32Array,ArrayBuffer,Blob,Response,DecompressionStream,URL,console};
runInNewContext(src,sandbox,{filename:"nai-png-metadata.js"});
const api=sandbox.module.exports;
assert.equal(typeof api.read,"function");
function chunk(type,body){let b=Buffer.alloc(12+body.length);b.writeUInt32BE(body.length,0);b.write(type,4,4,"ascii");body.copy(b,8);return b}
function png(extra=[]){let head=Buffer.alloc(13);head.writeUInt32BE(1,0);head.writeUInt32BE(height,4);head[8]=8;head[9]=6;
  const raw=Buffer.from([0,20,40,60,255]);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",head),...extra,chunk("IDAT",deflateSync(raw)),chunk("IEND",Buffer.alloc(0))])
}
const parameters={steps:28,seed:12345678,scale:5,width:832,height:1216,sampler:"k_euler_ancestral",noise_schedule:"karras",uc:"bad hands",prompt:"girl",model:"nai-diffusion-4-5-full"};
function file(buf){return {size:buf.length,arrayBuffer:async()=>buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)}}
function textChunk(key,value){return chunk("tEXt",Buffer.from(key+"\0"+value))}
function zChunk(key,value){return chunk("zTXt",Buffer.concat([Buffer.from(key+"\0\0"),deflateSync(Buffer.from(value))]))}
function iChunk(key,value){return chunk("iTXt",Buffer.concat([Buffer.from(key+"\x00\x01\x00\x00\x00"),deflateSync(Buffer.from(value))]))}
async function run(){
  for(const c of [textChunk("Comment",JSON.stringify(parameters)),zChunk("Comment",JSON.stringify(parameters)),iChunk("Comment",JSON.stringify(parameters))]){
    const result=await api.read(file(png([c])));assert.equal(result.ok,true);assert.equal(result.fields.seed,12345678);assert.equal(result.fields.steps,28);assert.equal(result.fields.model,parameters.model)
  }
  const none=await api.read(file(png()));assert.equal(none.ok,false);assert.match(none.message,/没有检测到/);
  await assert.rejects(()=>api.read(file(Buffer.from("bad png"))),/PNG/);
  // Alpha LSB concealment: signature + size in bits + gzipped JSON. Original rgba pixel has alpha 255, create row width to hold bits.
  const payload=gzipSync(Buffer.from(JSON.stringify(parameters)));
  const signature=Buffer.from("stealth_pngcomp");const size=Buffer.alloc(4);size.writeUInt32BE(payload.length*8);
  const message=Buffer.concat([signature,size,payload]);const height=5,width=Math.ceil(message.length*8/height);
  const head=Buffer.alloc(13);head.writeUInt32BE(width,0);head.writeUInt32BE(1,4);head[8]=8;head[9]=6;
  const rgba=Buffer.alloc(height*(1+width*4));
  for(let y=0;y<height;y++)rgba[y*(1+width*4)]=0;
  for(let j=0;j<message.length*8;j++){const x=Math.floor(j/height),y=j%height;rgba[y*(1+width*4)+1+x*4+3]=254|((message[Math.floor(j/8)]>>(7-(j%8)))&1)}
  const stego=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",head),chunk("IDAT",deflateSync(rgba)),chunk("IEND",Buffer.alloc(0))]);
  const hidden=await api.read(file(stego));assert.equal(hidden.ok,true);assert.equal(hidden.fields.seed,12345678);assert.match(hidden.origin,/Alpha/);
  const ids=["pngdrop","pngfile","pngfields","pngresults","pngview","pngapply"];for(const id of ids)assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(html,/src="nai-png-metadata\.js"/);assert.match(html,/function pngApply\(\)/);
  assert.doesNotMatch(html,/yrhefhwmwirohbccoybm|sb_publishable_s_PM8ZRi/);
  console.log("PASS text/zTXt/iTXt PNG, no metadata, malformed PNG, stealth PNG, import UI, no production credentials");
}
run().catch(e=>{console.error(e);process.exitCode=1});
