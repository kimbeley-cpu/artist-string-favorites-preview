/* Preview Stage E: image-only soft deletion. No cloud requests or new storage key. */
(function(root){
"use strict";
function list(item,key){return Array.isArray(item[key])?item[key]:[]}
function uid(){return "pic-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,12)}
function move(item,indices,newId,now){
  if(!item||!Array.isArray(item.imgs)||!Array.isArray(indices))return 0;
  var unique=Array.from(new Set(indices.filter(function(n){return Number.isInteger(n)&&n>=0&&n<item.imgs.length}))).sort(function(a,b){return b-a});
  if(!unique.length)return 0;
  if(!Array.isArray(item.metas))item.metas=[];
  while(item.metas.length<item.imgs.length)item.metas.push(null);
  if(!Array.isArray(item.trashImgs))item.trashImgs=[];
  var makeId=typeof newId==="function"?newId:uid;
  var timestamp=typeof now==="number"?now:Date.now();
  unique.forEach(function(i){
    var src=item.imgs.splice(i,1)[0],meta=item.metas.splice(i,1)[0];
    item.trashImgs.push({id:makeId(),src:src,meta:meta==null?null:meta,originalIndex:i,deletedAt:timestamp})
  });
  return unique.length
}
function restore(item,ids){
  if(!item||!Array.isArray(item.trashImgs)||!Array.isArray(ids))return 0;
  var wanted=new Set(ids),removed=item.trashImgs.filter(function(e){return e&&wanted.has(e.id)});
  if(!removed.length)return 0;
  if(!Array.isArray(item.imgs))item.imgs=[];
  if(!Array.isArray(item.metas))item.metas=[];
  while(item.metas.length<item.imgs.length)item.metas.push(null);
  removed.sort(function(a,b){return (a.originalIndex||0)-(b.originalIndex||0)});
  removed.forEach(function(e){
    var i=Math.max(0,Math.min(item.imgs.length,Number.isInteger(e.originalIndex)?e.originalIndex:item.imgs.length));
    item.imgs.splice(i,0,e.src);item.metas.splice(i,0,e.meta==null?null:e.meta)
  });
  item.trashImgs=item.trashImgs.filter(function(e){return !(e&&wanted.has(e.id))});
  return removed.length
}
function purge(item,ids){
  if(!item||!Array.isArray(item.trashImgs)||!Array.isArray(ids))return 0;
  var wanted=new Set(ids),old=item.trashImgs.length;
  item.trashImgs=item.trashImgs.filter(function(e){return !(e&&wanted.has(e.id))});
  return old-item.trashImgs.length
}
var api={move:move,restore:restore,purge:purge};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.ASFImageRecycle=api
})(typeof window!=="undefined"?window:typeof globalThis!=="undefined"?globalThis:this);
