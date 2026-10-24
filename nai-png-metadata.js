/* NovelAI PNG metadata reader. Local-only: File.arrayBuffer, no network requests. */
(function(root){
"use strict";
var MAX_FILE=60*1024*1024,MAX_PIXELS=18000000,MAX_TEXT=2*1024*1024,MAX_STEALTH=3*1024*1024;
var utf8=new TextDecoder("utf-8",{fatal:false});
function error(message){throw new Error(message)}
function u32(bytes,offset){return ((bytes[offset]*16777216)+(bytes[offset+1]<<16)+(bytes[offset+2]<<8)+bytes[offset+3])>>>0}
function ascii(bytes){var s="";for(var i=0;i<bytes.length;i++)s+=String.fromCharCode(bytes[i]);return s}
function zlib(bytes,type){
  if(typeof DecompressionStream==="undefined")error("浏览器不支持本地解压 PNG 元数据");
  return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream(type))).arrayBuffer()
    .then(function(b){return new Uint8Array(b)})}
function nul(a,p){var i=a.indexOf(0,p);return i<0?a.length:i}
function decUtf8(a){return utf8.decode(a)}
function validJSON(s){if(typeof s!=="string")return null;try{var v=JSON.parse(s);return v&&typeof v==="object"&&!Array.isArray(v)?v:null}catch(e){return null}}
async function textChunk(type,data){
  var cut=nul(data,0),key=ascii(data.slice(0,cut)),content=data.slice(cut+1);
  if(!key||cut===data.length)return null;
  if(type==="tEXt")return {key:key,value:ascii(content)};
  if(type==="zTXt"){
    if(content[0]!==0||content.length<2)return null;
    var value=await zlib(content.slice(1),"deflate");
    if(value.length>MAX_TEXT)error("PNG 文本元数据太大");
    return {key:key,value:decUtf8(value)}
  }
  if(type==="iTXt"){
    if(content.length<4)return null;
    var compressed=content[0],method=content[1],p=2;
    p=nul(content,p)+1;p=nul(content,p)+1;
    if(p>content.length||method!==0)return null;
    var value2=content.slice(p);
    if(compressed===1)value2=await zlib(value2,"deflate");
    else if(compressed!==0)return null;
    if(value2.length>MAX_TEXT)error("PNG 文本元数据太大");
    return {key:key,value:decUtf8(value2)}
  }
  return null
}
function readPng(bytes){
  var sig=[137,80,78,71,13,10,26,10];
  if(bytes.length<24||sig.some(function(b,i){return bytes[i]!==b}))error("请选择原始 PNG 文件（不是 JPG/WebP）");
  var pos=8,texts=[],idat=[],ihdr=null;
  while(pos+12<=bytes.length){
    var size=u32(bytes,pos),type=ascii(bytes.slice(pos+4,pos+8)),from=pos+8,end=from+size;
    if(size>bytes.length-from-4)error("PNG 文件结构损坏或被截断");
    var data=bytes.subarray(from,end);
    if(type==="IHDR"){
      if(size!==13)error("PNG 文件头无效");
      ihdr={width:u32(data,0),height:u32(data,4),bitDepth:data[8],colorType:data[9],interlace:data[12]};
      if(!ihdr.width||!ihdr.height||ihdr.width*ihdr.height>MAX_PIXELS)error("PNG 图片尺寸超出本地解析安全限制")
    }else if(type==="tEXt"||type==="zTXt"||type==="iTXt"){
      if(size>MAX_TEXT)error("PNG 文本块过大");
      texts.push({type:type,data:data})
    }else if(type==="IDAT"){idat.push(data)}
    pos=end+4;
    if(type==="IEND")break
  }
  if(!ihdr)error("PNG 缺少有效的图片信息");
  return {textChunks:texts,idat:idat,ihdr:ihdr}
}
function choose(o,key){return o&&Object.prototype.hasOwnProperty.call(o,key)?o[key]:undefined}
function str(o){return typeof o==="string"?o:null}
function num(o){return typeof o==="number"&&Number.isFinite(o)?o:null}
function get(o,key){return o&&typeof o==="object"?o[key]:undefined}
function firstString(a){for(var i=0;i<a.length;i++)if(typeof a[i]==="string"&&a[i].trim())return a[i].trim();return null}
function getCharacters(p){
  var positive=get(get(get(p,"v4_prompt"),"caption"),"char_captions");
  var negative=get(get(get(p,"v4_negative_prompt"),"caption"),"char_captions");
  if(Array.isArray(positive)&&positive.length){
    return positive.map(function(c,i){var neg=Array.isArray(negative)?negative[i]:null;
      return {text:str(get(c,"char_caption"))||"",negative:str(get(neg,"char_caption"))||"",
        centers:Array.isArray(get(c,"centers"))?get(c,"centers"):[]}
    }).filter(function(c){return c.text||c.negative})
  }
  var older=get(p,"characterPrompts");
  if(Array.isArray(older)&&older.length)return older.map(function(c){
    return {text:str(get(c,"prompt"))||"",negative:str(get(c,"uc"))||"",centers:get(c,"center")?[get(c,"center")]:[]}
  }).filter(function(c){return c.text||c.negative});
  return null
}
function normalize(meta,ihdr,origin){
  if(!meta||typeof meta!=="object")return null;
  var comment=get(meta,"Comment");
  if(typeof comment==="string")comment=validJSON(comment);
  if(comment&&typeof comment==="object"&&comment.Comment){
    var nested=typeof comment.Comment==="string"?validJSON(comment.Comment):comment.Comment;
    if(nested&&typeof nested==="object")comment=nested
  }
  var p=comment&&typeof comment==="object"?comment:meta;
  if(p.parameters&&typeof p.parameters==="object")p=p.parameters;
  var candidate=Boolean(comment||/(novelai)/i.test([meta.Software,meta.Source].join(" "))||
    (typeof p.steps==="number"&&(p.seed!==undefined||p.sampler!==undefined)));
  if(!candidate)return null;
  var prompt=firstString([get(get(get(p,"v4_prompt"),"caption"),"base_caption"),p.prompt,p.input,meta.Description]);
  var negative=firstString([get(get(get(p,"v4_negative_prompt"),"caption"),"base_caption"),p.uc,p.negative_prompt]);
  var width=num(p.width),height=num(p.height);
  var size=width>0&&height>0?width+"x"+height:null;
  var model=firstString([p.model,meta.Model]);
  var chars=getCharacters(p);
  var reference=get(p,"reference_image_multiple");
  var fields={
    prompt:prompt,negative:negative,model:model,size:size,steps:num(p.steps),scale:num(p.scale),
    seed:num(p.seed),sampler:firstString([p.sampler]),noise_schedule:firstString([p.noise_schedule]),
    characters:chars,referenceCount:Array.isArray(reference)?reference.length:null
  };
  var found=Object.keys(fields).some(function(k){return fields[k]!==null});
  return found?{ok:true,origin:origin,imageSize:ihdr.width+"x"+ihdr.height,fields:fields}:null
}
async function textMeta(chunks,ihdr){
  var m={},errors=[];
  for(var i=0;i<chunks.length;i++){
    try{var t=await textChunk(chunks[i].type,chunks[i].data);if(t)m[t.key]=t.value}
    catch(e){errors.push(e.message)}
  }
  var parsed=normalize(m,ihdr,"PNG 文本元数据");
  if(parsed)return parsed;
  return {found:null,errors:errors}
}
async function alphaMeta(png){
  var h=png.ihdr;if(h.bitDepth!==8||h.colorType!==6||h.interlace!==0||!png.idat.length)return null;
  var total=png.idat.reduce(function(n,a){return n+a.length},0),joint=new Uint8Array(total),p=0;
  png.idat.forEach(function(a){joint.set(a,p);p+=a.length});
  var inflated=await zlib(joint,"deflate"),pitch=h.width*4,expected=(pitch+1)*h.height;
  if(inflated.length!==expected)return null;
  // Reconstruct filtered RGBA rows without Canvas premultiplication (preserves alpha LSB).
  var bitCount=0,byte=0,magic="",lengthBits=0,wanted=-1,payload=[],previous=new Uint8Array(pitch),offset=0;
  function readBit(bit){
    if(wanted===-2)return;
    byte=(byte<<1)|bit;bitCount++;
    if(bitCount!==8)return;
    bitCount=0;var b=byte;byte=0;
    if(magic.length<15){magic+=String.fromCharCode(b);if(magic.length===15){
      if(magic!=="stealth_pngcomp"&&magic!=="stealth_pnginfo")wanted=-2;
    }return}
    if(wanted===-1){
      lengthBits=(lengthBits*256+b)>>>0;
      if(payload.length===0){payload.push(b);if(payload.length===4){
        wanted=lengthBits/8;if(lengthBits%8||wanted<1||wanted>MAX_STEALTH)wanted=-2;
        payload=[];
      }}
      return
    }
    if(wanted>0){payload.push(b);if(payload.length===wanted)wanted=-2}
  }
  // Length header needs exactly four bytes, not a rolling length counter.
  var headerByteCount=0;bitCount=0;byte=0;lengthBits=0;wanted=-1;payload=[];
  function collect(bit){
    if(wanted===-2)return;
    byte=(byte<<1)|bit;if(++bitCount<8)return;
    var b=byte;byte=0;bitCount=0;
    if(magic.length<15){
      magic+=String.fromCharCode(b);
      if(magic.length===15&&magic!=="stealth_pngcomp"&&magic!=="stealth_pnginfo")wanted=-2;
    }else if(headerByteCount<4){
      lengthBits=(lengthBits*256+b)>>>0;headerByteCount++;
      if(headerByteCount===4){
        wanted=lengthBits/8;
        if(lengthBits%8||wanted<1||wanted>MAX_STEALTH)wanted=-2
      }
    }else if(wanted>=0){
      payload.push(b);if(payload.length===wanted)wanted=-2
    }
  }
  for(var y=0;y<h.height&&wanted!==-2;y++){
    var filter=inflated[offset++],row=new Uint8Array(pitch);
    if(filter>4)return null;
    for(var x=0;x<pitch;x++){
      var a=x>=4?row[x-4]:0,b=previous[x],c=x>=4?previous[x-4]:0,v=0;
      if(filter===1)v=a;
      else if(filter===2)v=b;
      else if(filter===3)v=(a+b)>>1;
      else if(filter===4){
        var q=a+b-c,da=Math.abs(q-a),db=Math.abs(q-b),dc=Math.abs(q-c);
        v=da<=db&&da<=dc?a:db<=dc?b:c
      }
      row[x]=(inflated[offset++]+v)&255
    }
    for(var j=3;j<pitch&&wanted!==-2;j+=4)collect(row[j]&1);
    previous=row
  }
  if(wanted!==-2||payload.length<1||lengthBits/8!==payload.length||!magic.startsWith("stealth_png"))return null;
  var bytes=new Uint8Array(payload);
  if(magic==="stealth_pngcomp")bytes=await zlib(bytes,"gzip");
  if(bytes.length>MAX_TEXT)error("隐藏的元数据体积过大");
  var raw=validJSON(decUtf8(bytes));return normalize(raw,h,"PNG Alpha 隐藏元数据")
}
async function read(file){
  if(!file||typeof file.arrayBuffer!=="function")error("请选择 PNG 文件");
  if(file.size>MAX_FILE)error("PNG 超过 60 MB，出于安全原因不读取");
  var bytes=new Uint8Array(await file.arrayBuffer()),png=readPng(bytes);
  var data=await textMeta(png.textChunks,png.ihdr);
  if(data.ok)return data;
  try{var hidden=await alphaMeta(png);if(hidden)return hidden}catch(e){
    return {ok:false,imageSize:png.ihdr.width+"x"+png.ihdr.height,
      message:"没有读取到可用的 NovelAI 生成参数；隐藏元数据读取失败："+e.message}
  }
  return {ok:false,imageSize:png.ihdr.width+"x"+png.ihdr.height,
    message:"没有检测到可用的 NovelAI 生成参数。可能不是 NovelAI 原始 PNG，或元数据已被清除。"}
}
var api={read:read};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.NaiPngMetadata=api
})(typeof window!=="undefined"?window:typeof globalThis!=="undefined"?globalThis:this);
