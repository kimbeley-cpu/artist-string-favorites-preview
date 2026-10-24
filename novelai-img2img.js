/* Stage F: NovelAI image-to-image payload and aspect-preserving canvas geometry. */
(function(root){"use strict";
function finite(v,min,max,name){
  var n=Number(v);
  if(!Number.isFinite(n)||n<min||n>max)throw new RangeError(name+" 必须为 "+min+"～"+max);
  return n
}
function containRect(sourceW,sourceH,targetW,targetH){
  [sourceW,sourceH,targetW,targetH].forEach(function(n){if(!Number.isInteger(n)||n<1||n>16384)throw new RangeError("图片尺寸无效")});
  var scale=Math.min(targetW/sourceW,targetH/sourceH),
  width=Math.max(1,Math.min(targetW,Math.round(sourceW*scale))),
  height=Math.max(1,Math.min(targetH,Math.round(sourceH*scale)));
  return {x:Math.floor((targetW-width)/2),y:Math.floor((targetH-height)/2),
    width:width,height:height,targetWidth:targetW,targetHeight:targetH,
    changed:sourceW!==targetW||sourceH!==targetH,
    padded:width!==targetW||height!==targetH,scale:scale}
}
function closestSize(sourceW,sourceH,sizes){
  if(!Number.isInteger(sourceW)||sourceW<1||!Number.isInteger(sourceH)||sourceH<1)throw new RangeError("图片尺寸无效");
  if(!Array.isArray(sizes)||!sizes.length)throw new RangeError("没有可用尺寸");
  var sourceRatio=sourceW/sourceH,best=null,bestDistance=Infinity;
  sizes.forEach(function(size){
    var match=String(size).match(/^(\d+)x(\d+)$/),w=match&&Number(match[1]),h=match&&Number(match[2]);
    if(!w||!h)return;
    var distance=Math.abs(Math.log((w/h)/sourceRatio));
    if(distance<bestDistance){best=String(size);bestDistance=distance}
  });
  if(best===null)throw new RangeError("没有有效尺寸");
  return best
}
function apply(body,base64,strength,noise){
  if(!body||!body.parameters)throw new TypeError("图生图请求参数缺失");
  if(typeof base64!=="string"||!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)||base64.length<4)throw new TypeError("底图必须是 PNG Base64");
  var s=finite(strength,0,1,"重绘强度"),n=finite(noise,0,1,"噪声");
  body.action="img2img";
  body.parameters.image=base64;
  body.parameters.strength=s;
  body.parameters.noise=n;
  return body
}
var api={containRect:containRect,closestSize:closestSize,apply:apply};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.NovelAIImageToImage=api
})(typeof window!=="undefined"?window:typeof globalThis!=="undefined"?globalThis:this);
