/* Stage D: coordinate/grid mapping for NovelAI V4/V4.5 (V5 accepts these preset points too). */
(function(root){
"use strict";
var GRID=[0.1,0.3,0.5,0.7,0.9];
function indexFor(value){
  if(typeof value!=="number"||!Number.isFinite(value))return 2;
  var index=2,dist=Infinity;
  for(var i=0;i<5;i++){var d=Math.abs(value-GRID[i]);if(d<dist){index=i;dist=d}}
  return index
}
function position(pos){
  return {x:GRID[indexFor(pos&&pos.x)],y:GRID[indexFor(pos&&pos.y)]}
}
function center(column,row){
  if(!Number.isInteger(column)||column<0||column>4||!Number.isInteger(row)||row<0||row>4)throw new RangeError("5×5 站位必须在 0–4 之间");
  return {x:GRID[column],y:GRID[row]}
}
function label(pos){
  var c=position(pos);
  return "ABCDE"[indexFor(c.x)]+(indexFor(c.y)+1)
}
function apply(body,characters,manual){
  if(!body||!body.parameters||!body.parameters.v4_prompt||!body.parameters.v4_negative_prompt)throw new Error("NovelAI 请求缺少角色字段");
  var p=body.parameters,cs=Array.isArray(characters)?characters:[];
  var active=!!manual && cs.length>0;
  p.v4_prompt.caption.char_captions=cs.map(function(c){
    return {char_caption:c.text||"",centers:[active?position(c.pos):{x:0.5,y:0.5}]}
  });
  p.v4_negative_prompt.caption.char_captions=cs.map(function(c){
    return {char_caption:c.uc||"",centers:[active?position(c.pos):{x:0.5,y:0.5}]}
  });
  p.characterPrompts=cs.map(function(c){
    return {prompt:c.text||"",uc:c.uc||"",center:active?position(c.pos):{x:0.5,y:0.5},enabled:true}
  });
  p.use_coords=active;
  p.v4_prompt.use_coords=active;
  p.v4_negative_prompt.use_coords=active;
  p.v4_prompt.use_order=true;
  p.v4_negative_prompt.use_order=true;
  return body
}
var api={center:center,position:position,label:label,apply:apply};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.NaiCharacterPosition=api
})(typeof window!=="undefined"?window:typeof globalThis!=="undefined"?globalThis:this);
