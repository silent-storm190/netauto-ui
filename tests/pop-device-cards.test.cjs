// Run: node mockup_ui/tests/pop-device-cards.test.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const devices=[
  {type:'SWITCH',name:'SWITCH-LONG-NAME',ip:'192.0.2.1',function:'CE',vendor:'HUAWEI',model:'HW57',firmware:{version:'V1<&>',patch:'PATCH<&>',epld:'E1'},totalMac:0},
  {type:'OLT',name:'OLT-STRING',ip:'192.0.2.2',function:'ACN',vendor:'GCOM',model:'GC16',firmware:'R2"<svg>',total_mac:1234},
  {type:'POWER',name:'POWER-MISSING',ip:'192.0.2.3',function:'POWER',model:'EN1U'},
  {type:'PI',name:'PI-INVENTORY',ip:'192.0.2.4',function:'PI',model:'IPMS',inventory:{device:{firmware:{version:'INV-V3'},total_mac:'0'}}},
  {type:'OLT',name:'OLT-INVALID',ip:'192.0.2.5',function:'ACN',model:'TEST',firmware:{},totalMac:false},
  {type:'OLT',name:'OLT-PATCH-ONLY',ip:'192.0.2.6',function:'ACN',model:'TEST',firmware:{patch:'PATCH-ONLY'},totalMac:''},
  {type:'UNLISTED"<svg>',name:'OTHER-DEVICE',ip:'192.0.2.7',function:'OTHER',model:'OTHER'},
];
const original=JSON.stringify(devices),nodes=new Map(),storage=new Map();
const get=id=>{
  if(!nodes.has(id))nodes.set(id,{value:'',innerHTML:'',textContent:'',open:false,listeners:{},dataset:{},
    setAttribute(){},addEventListener(k,f){this.listeners[k]=f;},showModal(){this.open=true;},close(){this.open=false;this.listeners.close?.();},focus(){}});
  return nodes.get(id);
};
const pop={code:'FACTS-TEST',devices},context={Intl,Math,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},document:{getElementById:get,body:{style:{}}},window:{
  NETAUTO_POP_DETAIL_DATA:{source:'source-must-not-show-as-footer',pops:{[pop.code]:devices},isLoaded:()=>true},
  NETAUTO_SMARTPOP:{open(){},render(){}},NETAUTO_POP_REFERENCES:{open(){}},NETAUTO_SMARTPOP_MODAL_SCROLL:{lock(){},unlock(){}},
}};
vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../shared/netauto-motifs.js'),'utf8'),context);
vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../shared/netauto-pop-detail.js'),'utf8'),context);
const controller=context.window.NETAUTO_POP_DETAIL,markup=()=>get('detailDeviceGroups').innerHTML;
const search=query=>{get('detailDeviceSearch').value=query;get('detailDeviceSearch').listeners.input();};
const assertFact=(name,firmware,mac)=>{
  search(name);
  assert.equal((markup().match(/data-l1-device=/g)||[]).length,1);
  assert(markup().includes('<span>Firmware</span><b title='));
  assert(markup().includes('>'+firmware+'</b>'));
  assert(markup().includes('<span>Total MAC</span><b>'+mac+'</b>'));
};
controller.open(pop);
assertFact('SWITCH-LONG-NAME','V1&lt;&amp;&gt;','0');
assert(markup().includes('title="V1&lt;&amp;&gt; · Patch: PATCH&lt;&amp;&gt; · EPLD: E1"'));
assertFact('OLT-STRING','R2&quot;&lt;svg&gt;','1.234');
assertFact('POWER-MISSING','—','—');
assertFact('PI-INVENTORY','INV-V3','0');
assertFact('OLT-INVALID','—','—');
assertFact('OLT-PATCH-ONLY','Patch: PATCH-ONLY','—');
search('PATCH<&>');assert(markup().includes('SWITCH-LONG-NAME'));
search('1234');assert(markup().includes('OLT-STRING'));
search('');const cardIndices=Array.from(markup().matchAll(/data-l1-device="(\d+)"/g),m=>m[1]);
const cardKinds=Array.from(markup().matchAll(/data-device-kind="([^"]+)"/g),m=>m[1]);
const cardMotifs=Array.from(markup().matchAll(/<svg class="na-decor-motif" data-motif-kind="([^"]+)"[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/svg>/g),m=>m[1]);
assert.deepEqual(cardMotifs,cardKinds.map(()=>'CIRCUIT'),'Every device type uses the same abstract PCB/signal artwork rather than a hardware illustration');
const kindByIndex=new Map(Array.from(markup().matchAll(/data-device-kind="([^"]+)"[^>]*data-l1-device="(\d+)"/g),m=>[Number(m[2]),m[1]]));
for(const [index,kind] of [[0,'SWITCH'],[1,'OLT'],[2,'POWER'],[3,'PI'],[6,'OTHER']])assert.equal(kindByIndex.get(index),kind,'Motif kind comes from the fixed device catalog, not untrusted source text');
get('deviceTableMode').listeners.click();
assert.deepEqual(Array.from(markup().matchAll(/data-l1-device="(\d+)"/g),m=>m[1]),cardIndices);
assert.equal((markup().match(/<th scope="col">Firmware<\/th>/g)||[]).length,2);
assert.equal((markup().match(/>Total MAC<\/th>/g)||[]).length,2);
assert.equal((markup().match(/<col class="l1-device-col-firmware">/g)||[]).length,2);
assert.equal((markup().match(/<col class="l1-device-col-mac">/g)||[]).length,2);
search('SWITCH-LONG-NAME');assert(markup().includes('>V1&lt;&amp;&gt;</td>'));assert(markup().includes('class="l1-device-table-number">0</td>'));
let selected;controller.setDeviceHandler((p,d)=>{assert.strictEqual(p,pop);selected=d;});
get('detailDeviceGroups').listeners.click({target:{closest:()=>({dataset:{l1Device:'0'}})}});assert.strictEqual(selected,devices[0]);
controller.preview(pop,{setAttribute(){},focus(){}});
assert.equal(get('popPreviewDevices').dataset.view,'table','Popup defaults to table independently of the other layer preferences');
assert.equal(storage.has('netauto.pop.previewView'),false,'Default opening does not persist a user choice');
get('popPreviewCardsMode').listeners.click();
const preview=get('popPreviewDevices').innerHTML;
assert.deepEqual(Array.from(preview.matchAll(/data-device-kind="([^"]+)"/g),m=>m[1]),cardKinds,'Readonly previews share the same per-type silhouettes as interactive cards');
assert.deepEqual(Array.from(preview.matchAll(/data-motif-kind="([^"]+)"/g),m=>m[1]),cardKinds.map(()=>'CIRCUIT'),'Readonly preview contains the same compact PCB/signal artwork');
assert.equal((preview.match(/<article class="l1-device-card /g)||[]).length,devices.length);
assert.equal((preview.match(/<span>Firmware<\/span>/g)||[]).length,devices.length);
assert.equal((preview.match(/<span>Total MAC<\/span>/g)||[]).length,devices.length);
assert(!preview.includes('<button')&&!preview.includes('data-l1-device='),'Readonly preview keeps the same facts without device launch controls');
assert(!preview.includes('<svg>')&&!preview.includes('[object Object]'),'Firmware is rendered as escaped source text, never markup or a raw object');
assert(!markup().includes('source-must-not-show-as-footer')&&!nodes.has('detailDeviceCount'),'Removed footer is neither created nor updated');
assert.equal(JSON.stringify(devices),original,'Presentation does not mutate the source inventory');
// Popup-only preference survives reopen/reload; invalid or unavailable storage is safe.
controller.closePreview();controller.preview({...pop,code:'ANOTHER-POP'},{setAttribute(){},focus(){}});
assert.equal(get('popPreviewDevices').dataset.view,'cards','User choice applies across POPs');controller.closePreview();
const reloadPreview=()=>{vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../shared/netauto-pop-detail.js'),'utf8'),context);return context.window.NETAUTO_POP_DETAIL;};
let popupController=reloadPreview();popupController.preview(pop);assert.equal(get('popPreviewDevices').dataset.view,'cards','Saved popup preference survives reload');popupController.closePreview();
get('popPreviewTableMode').listeners.click();assert.equal(storage.get('netauto.pop.previewView'),'cards','Closed popup controls cannot overwrite the saved choice');
storage.set('netauto.pop.previewView','invalid');popupController=reloadPreview();popupController.preview(pop);assert.equal(get('popPreviewDevices').dataset.view,'table','Invalid preference falls back to table');popupController.closePreview();
const originalStorage=context.localStorage;context.localStorage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
popupController=reloadPreview();popupController.preview(pop);assert.equal(get('popPreviewDevices').dataset.view,'table','Unreadable storage falls back to table');
get('popPreviewCardsMode').listeners.click();popupController.closePreview();popupController.preview(pop);assert.equal(get('popPreviewDevices').dataset.view,'cards','Blocked storage still retains the explicit choice within the session');popupController.closePreview();context.localStorage=originalStorage;
const motifCSS=fs.readFileSync(path.resolve(__dirname,'../shared/netauto-pop-detail.css'),'utf8'),motifSources=[];
for(const [kind,file] of [['CIRCUIT','circuit'],['TOOLS','tools']]){
  const motif=fs.readFileSync(path.resolve(__dirname,'../shared/device-motifs/'+file+'.svg'),'utf8');
  assert(motif.includes('viewBox="0 0 180 112"'),'Reference accents share a compact coordinate system');
  assert(!/<script\b|<image\b|\bon\w+=|<text\b|href=/i.test(motif),'Decorative vector assets have no scripts, external resources or misleading hardware-count labels');
  const referenceBody=motif.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'').replace(/<!--[\s\S]*?-->/g,'').replace(/stroke="white"/g,'stroke="currentColor"').replace(/fill="white"/g,'fill="currentColor"').replace(/stroke-width="1.4"/g,'stroke-width="1.3"').replace(/>\s+</g,'><').trim();
  const rendered=context.window.NETAUTO_MOTIFS.render(kind);
  assert(rendered.includes(referenceBody)&&rendered.includes('stroke-width="1.3"'),'PCB/signal and wrench/gear accents render with thin, consistent strokes');
  assert(rendered.includes('focusable="false"')&&!rendered.includes('url(')&&!rendered.includes('href='),'Artwork needs no image request and stays outside keyboard navigation');
  motifSources.push(motif);
}
assert.equal(new Set(motifSources).size,2,'Devices use PCB/signal lines; tools use a separate wrench/gear accent');
assert(!motifCSS.includes('--l1-device-motif:')&&motifCSS.includes(' .l1-device-card>svg.na-decor-motif{position:absolute;'),'Device artwork uses direct SVG with stronger scoped sizing, not a file-loaded mask');
assert(context.window.NETAUTO_MOTIFS.render('<svg onload=bad>').includes('data-motif-kind="CIRCUIT"'),'Unknown motif input cannot inject SVG markup');
console.log('PASS: device cards/table/readonly parity, firmware string/object/patch-only/inventory fallback, Total MAC zero/invalid/missing, formatting/search/XSS, original navigation and immutable data; no source footer.');
