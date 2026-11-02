// Art slots: every illustrated piece in the lobby has a stable name. The game draws each one in code, then, if
// assets/manifest.json lists a PNG for that name, swaps the painted bitmap in. Missing files cost nothing: the
// code-drawn version simply stays. See assets/README.md for the workflow and exact pixel sizes.
import { slotHook } from './lobby-sprites.js';

export const slots=new Map(); // name -> { textures:Set<Texture>, loaded:boolean, size:[w,h] }
let manifest=null,manifestReady=null;

function loadManifest(){
 if(manifestReady)return manifestReady;
 manifestReady=fetch('assets/manifest.json',{cache:'no-cache'}).then(r=>r.ok?r.json():{files:{}}).catch(()=>({files:{}})).then(m=>{manifest=m&&m.files?m:{files:{}};return manifest;});
 return manifestReady;
}
function swap(tex,img){
 tex.image=img;if(tex.source)tex.source.needsUpdate=true;tex.needsUpdate=true;
}
export function registerSlot(name,tex){
 let s=slots.get(name);if(!s){s={textures:new Set(),loaded:false,size:[tex.image&&tex.image.width||0,tex.image&&tex.image.height||0]};slots.set(name,s);}
 s.textures.add(tex);
 if(s.loaded&&s.img){swap(tex,s.img);return tex;}
 loadManifest().then(m=>{
  const file=m.files[name];if(!file||s.requested)return;s.requested=true;
  const img=new Image();img.decoding='async';
  img.onload=()=>{s.loaded=true;s.img=img;s.textures.forEach(t=>swap(t,img));};
  img.onerror=()=>console.warn('[art-slots] could not load assets/'+file+' for slot "'+name+'"');
  img.src='assets/'+file+'?v='+(m.version||1);
 });
 return tex;
}
slotHook.fn=registerSlot;

// Used by the template page: a snapshot of every registered slot's current (code-drawn) bitmap.
export function snapshot(){return[...slots.entries()].map(([name,s])=>{const t=[...s.textures][0];return{name,w:t.image.width,h:t.image.height,image:t.image};}).sort((a,b)=>a.name.localeCompare(b.name));}
window.__artSlots={slots,snapshot};
