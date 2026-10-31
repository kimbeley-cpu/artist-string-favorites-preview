/* Stage G: browser-local wardrobe vocabulary and pure outfit/tag helpers. */
(function(root){"use strict";
var slots=[{key:"cut",zh:"款式"},{key:"color",zh:"颜色"},{key:"decoration",zh:"装饰"},{key:"accessory",zh:"配饰"}];
var styles={
  sweet:{zh:"甜美",
    cut:[{zh:"连衣裙",en:"dress"},{zh:"夏日连衣裙",en:"sundress"},{zh:"舞会礼服",en:"ball gown"},{zh:"百褶裙",en:"pleated skirt"},{zh:"围裙",en:"apron"},{zh:"短裙",en:"miniskirt"}],
    color:[{zh:"粉色连衣裙",en:"pink dress"},{zh:"白色连衣裙",en:"white dress"},{zh:"蓝色连衣裙",en:"blue dress"},{zh:"黄色连衣裙",en:"yellow dress"},{zh:"红色连衣裙",en:"red dress"},{zh:"紫色连衣裙",en:"purple dress"}],
    decoration:[{zh:"荷叶边",en:"frills"},{zh:"蕾丝边",en:"lace trim"},{zh:"蝴蝶结",en:"bow"},{zh:"丝带",en:"ribbon"},{zh:"圆点花纹",en:"polka dot"},{zh:"花卉印花",en:"floral print"}],
    accessory:[{zh:"发蝴蝶结",en:"hair bow"},{zh:"发带",en:"hairband"},{zh:"发夹",en:"hairclip"},{zh:"项链",en:"necklace"},{zh:"手链",en:"bracelet"},{zh:"及膝袜",en:"kneehighs"}]},
  gothic:{zh:"哥特",
    cut:[{zh:"哥特洛丽塔",en:"gothic lolita"},{zh:"束腰",en:"corset"},{zh:"长连衣裙",en:"long dress"},{zh:"荷叶边连衣裙",en:"frilled dress"},{zh:"披肩",en:"capelet"},{zh:"露肩连衣裙",en:"off-shoulder dress"}],
    color:[{zh:"黑色连衣裙",en:"black dress"},{zh:"白色连衣裙",en:"white dress"},{zh:"红色连衣裙",en:"red dress"},{zh:"紫色连衣裙",en:"purple dress"},{zh:"蓝色连衣裙",en:"blue dress"},{zh:"灰色连衣裙",en:"grey dress"}],
    decoration:[{zh:"蕾丝边",en:"lace trim"},{zh:"交叉系带",en:"cross-laced clothes"},{zh:"荷叶边",en:"frills"},{zh:"丝带",en:"ribbon"},{zh:"条纹",en:"striped clothes"},{zh:"蝴蝶结",en:"bow"}],
    accessory:[{zh:"颈环",en:"choker"},{zh:"十字架项链",en:"cross necklace"},{zh:"蕾丝手套",en:"lace gloves"},{zh:"过膝袜",en:"thighhighs"},{zh:"面纱",en:"veil"},{zh:"头饰",en:"headdress"}]},
  academy:{zh:"学院",
    cut:[{zh:"水手服",en:"serafuku"},{zh:"西式校服",en:"school uniform"},{zh:"西装外套",en:"blazer"},{zh:"开衫",en:"cardigan"},{zh:"毛衣背心",en:"sweater vest"},{zh:"百褶裙",en:"pleated skirt"}],
    color:[{zh:"蓝色裙子",en:"blue skirt"},{zh:"黑色裙子",en:"black skirt"},{zh:"灰色裙子",en:"grey skirt"},{zh:"棕色裙子",en:"brown skirt"},{zh:"白色衬衫",en:"white shirt"},{zh:"红色裙子",en:"red skirt"}],
    decoration:[{zh:"格纹",en:"plaid"},{zh:"条纹",en:"striped clothes"},{zh:"纽扣",en:"buttons"},{zh:"胸袋",en:"breast pocket"},{zh:"领结",en:"bowtie"},{zh:"领带",en:"necktie"}],
    accessory:[{zh:"眼镜",en:"glasses"},{zh:"贝雷帽",en:"beret"},{zh:"及膝袜",en:"kneehighs"},{zh:"乐福鞋",en:"loafers"},{zh:"书包",en:"school bag"},{zh:"发夹",en:"hairclip"}]}
};
function randomOutfit(style,current,locks,rng){
  var pool=styles[style];if(!pool)throw new RangeError("未知服装风格");
  current=current||{};locks=locks||{};rng=rng||Math.random;var result={extra:typeof current.extra==="string"?current.extra:""};
  slots.forEach(function(slot){var key=slot.key,value;
    if(locks[key])value=current[key];
    else{var n=rng();if(!Number.isFinite(n)||n<0||n>=1)throw new RangeError("rng 必须返回 0（含）到 1（不含）之间的数值");value=pool[key][Math.floor(n*pool[key].length)]}
    result[key]=value&&typeof value==="object"?{zh:value.zh,en:value.en}:value
  });return result
}
function appendTags(existing,addition){
  existing=existing==null?"":String(existing);addition=addition==null?"":String(addition);
  var seen=new Set(existing.split(",").map(function(tag){return tag.trim().toLowerCase()})),added=[];
  addition.split(",").forEach(function(tag){tag=tag.trim();var key=tag.toLowerCase();if(tag&&!seen.has(key)){seen.add(key);added.push(tag)}});
  if(!existing.trim())return added.join(", ");
  var tail=existing.trimEnd();
  return added.length?(/,$/.test(tail)?tail+" ":existing+", ")+added.join(", "):existing
}
function outfitToTags(outfit){
  outfit=outfit||{};var tags=slots.map(function(slot){var v=outfit[slot.key];return typeof v==="string"?v:v&&typeof v.en==="string"?v.en:""});
  if(typeof outfit.extra==="string")tags.push(outfit.extra);
  return appendTags("",tags.join(", "))
}
var api={styles:styles,slots:slots,randomOutfit:randomOutfit,outfitToTags:outfitToTags,appendTags:appendTags};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.Wardrobe=api
})(typeof window!=="undefined"?window:typeof globalThis!=="undefined"?globalThis:this);
