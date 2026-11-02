import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';

const manifest=JSON.parse(await readFile(new URL('../assets/manifest.json',import.meta.url),'utf8'));
const slots=await readFile(new URL('../art-slots.js',import.meta.url),'utf8');
const sprites=await readFile(new URL('../lobby-sprites.js',import.meta.url),'utf8');
const world=await readFile(new URL('../arcade-world.js',import.meta.url),'utf8');

test('asset manifest is valid and every listed file exists as a PNG with a kebab-case slot name',async()=>{
 assert.equal(typeof manifest.version,'number');assert.equal(typeof manifest.files,'object');
 for(const [slot,file] of Object.entries(manifest.files)){
  assert.match(slot,/^[a-z0-9]+(-[a-z0-9]+)*$/,'slot name '+slot);
  assert.match(file,/^[\w.-]+\.png$/,'file '+file);
  await access(new URL('../assets/'+file,import.meta.url));
  const head=(await readFile(new URL('../assets/'+file,import.meta.url))).subarray(0,8);
  assert.deepEqual([...head],[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a],file+' is not a PNG');
 }
});
test('slot registry swaps painted bitmaps in without breaking the code-drawn fallback',()=>{
 assert.match(slots,/assets\/manifest\.json/);assert.match(slots,/img\.onerror=/);assert.match(slots,/slotHook\.fn=registerSlot/);assert.match(slots,/source\.needsUpdate=true/);
 assert.match(slots,/if\(!file\|\|s\.requested\)return/);
});
test('every illustrated family registers a slot',()=>{
 for(const k of ["reg('character-'","reg('cabinet-'","reg('plant-'","reg('poker-'","reg('host-stand'"])assert.ok(sprites.includes(k),k);
 for(const k of ["slot:'marquee-'+id","slot:'floor-parquet'","slot:'carpet'","slot:'back-wall'","slot:'garland'","slot:'counter-front'","slot:'bar-top'","slot:'back-bar'","slot:'welcome-desk'","slot:'prize-counter'","slot:'gallery-facade'","slot:'gallery-floor'","slot:'lucky-wheel'","slot:'jukebox-front'","slot:'poster-'+i","slot:'table-'+(i%3)","slot:'bar-stool'","slot:'sconce'"])assert.ok(world.includes(k),k);
});

test('the artist workflow files exist and agree on the manifest format',async()=>{
 const readme=await readFile(new URL('../assets/README.md',import.meta.url),'utf8');
 const tmpl=await readFile(new URL('../art-templates.html',import.meta.url),'utf8');
 assert.match(readme,/manifest\.json/);assert.match(readme,/art-templates\.html/);assert.match(readme,/"files"/);
 assert.match(tmpl,/__artSlots/);assert.match(tmpl,/Download PNG/);assert.match(tmpl,/toBlob/);
});
