// Run: node mockup_ui/tests/pop-device-vendor.test.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const devices=[
  ['EN1U',null],['EN2U','UNKNOWN'],[' en3u ','OTHER'],
  ['DE01',null],['de02','UNKNOWN'],[' DE03 ','OTHER'],
  ['HW57','HUAWEI'],['OPMS','UNKNOWN'],['CEN1U','KEEP'],
  [null,'KEEP-NULL'],[undefined,'KEEP-UNDEFINED'],['XDE01','<vendor>'],
].map(([model,vendor],i)=>({name:'DEVICE-'+i,ip:'192.0.2.'+(i+1),type:'POWER',function:'RECTIFIER',model,vendor}));
const original=JSON.stringify(devices),nodes=new Map();
const get=id=>{
  if(!nodes.has(id))nodes.set(id,{value:'',innerHTML:'',textContent:'',open:false,listeners:{},
    setAttribute(){},addEventListener(k,f){this.listeners[k]=f;}});
  return nodes.get(id);
};
const pop={code:'VENDOR-TEST',province:'TEST'},context={Intl,document:{getElementById:get},window:{
  NETAUTO_POP_DETAIL_DATA:{source:'test-only',pops:{[pop.code]:devices},isLoaded:()=>true},
  NETAUTO_SMARTPOP:{open(){},render(){}},NETAUTO_POP_REFERENCES:{open(){}},
}};
vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../shared/netauto-motifs.js'),'utf8'),context);
vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../shared/netauto-pop-detail.js'),'utf8'),context);
context.window.NETAUTO_POP_DETAIL.open(pop);
const cards=()=>get('detailDeviceGroups').innerHTML;
const footer=i=>cards().match(new RegExp('data-l1-device="'+i+'"[\\s\\S]*?class="l1-device-card-foot"><span>([\\s\\S]*?)</span>'))?.[1];
for(const i of [0,1,2])assert(footer(i).startsWith('ENATEL · '),'EN prefix maps to ENATEL, independent of case/spaces/source vendor');
for(const i of [3,4,5])assert(footer(i).startsWith('DELTA · '),'DE prefix maps to DELTA');
assert.equal(footer(6),'HUAWEI · HW57');assert.equal(footer(7),'— · OPMS');
assert.equal(footer(8),'KEEP · CEN1U');assert.equal(footer(9),'KEEP-NULL · —');
assert.equal(footer(10),'KEEP-UNDEFINED · —');assert.equal(footer(11),'&lt;vendor&gt; · XDE01');
const search=query=>{get('detailDeviceSearch').value=query;get('detailDeviceSearch').listeners.input();return [...cards().matchAll(/data-l1-device="(\d+)"/g)].map(m=>Number(m[1]));};
assert.deepEqual(search('enatel'),[0,1,2]);assert.deepEqual(search('DELTA'),[3,4,5]);
assert.deepEqual(search('HUAWEI'),[6]);assert.deepEqual(search('DE01'),[3,11]);
assert.deepEqual(search('DEVICE-4'),[4]);assert.deepEqual(search('192.0.2.7'),[6]);
assert.equal(JSON.stringify(devices),original,'Vendor presentation must not mutate imported data');
let selected;context.window.NETAUTO_POP_DETAIL.setDeviceHandler((p,d)=>{selected=d;});
get('detailDeviceGroups').listeners.click({target:{closest:()=>({dataset:{l1Device:'4'}})}});
assert.strictEqual(selected,devices[4],'Navigation retains the original device object/source index');
console.log('PASS: EN→ENATEL and DE→DELTA card/search mapping, case/space handling, other/missing models, escaping, immutable source and original navigation identity.');
