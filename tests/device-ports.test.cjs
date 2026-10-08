const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const context={window:{NETAUTO_DATA:{},NETAUTO_POP_DETAIL_DATA:{pops:{}}}};
for(const name of ['netauto-pop-index.js','huawei-device-layouts.js','netauto-device-port-models.js'])vm.runInNewContext(fs.readFileSync(path.join(root,'shared',name),'utf8'),context);
const data=context.window.NETAUTO_DATA;
const models=context.window.NETAUTO_PORT_MODELS;
const clone=value=>JSON.parse(JSON.stringify(value));
const fullDevices=code=>{
  if(!context.window.NETAUTO_POP_DETAIL_DATA.pops[code])vm.runInNewContext(fs.readFileSync(path.join(root,data.inventoryFiles[code]),'utf8'),context);
  return context.window.NETAUTO_POP_DETAIL_DATA.pops[code];
};
const modelDevice=code=>{const pop=data.pops.find(pop=>pop.devices.some(device=>device.model===code&&device.inventoryAvailable));return fullDevices(pop.code).find(device=>device.model===code&&device.ports.length);};
for(const [alias,code]of [['GL5610-8P','GC08'],['GL5610-16P','GC16'],['H3C_Stack_S6520X-54HF-EI','CV53'],['ZXA10 C620H','ZA63'],['MA5801-FL16-H1','HA51']])assert.equal(models.resolve(alias),code);
for(const [code,baseCount] of [['GC08',14],['GC16',22],['CH52',30],['CH53',54],['CV52',30],['CV53',54]]){
  const device=modelDevice(code);const before=JSON.stringify(device);const layout=models.build(device);
  const members=new Set(device.ports.map(port=>models.clean(port.name).match(/(?:Ethernet|GigE)(\d+)\//)?.[1]).filter(Boolean));
  const count=code.startsWith('C')?baseCount*members.size:baseCount;
  assert.equal(layout.summary.total,count,code);
  assert.equal(new Set(layout.ports.map(port=>port.name)).size,count,'No duplicated combo or stack ports');
  assert.equal(layout.summary.up+layout.summary.down+layout.summary.unknown,count);
  const facePorts=layout.hardware.units.flatMap(unit=>unit.groups.flatMap(group=>group.ports));
  assert.equal(facePorts.length,count,'The hardware view includes every port exactly once');
  assert.equal(new Set(facePorts.map(port=>port.name)).size,count);
  for(const unit of layout.hardware.units)for(const group of unit.groups)assert(group.columns>0&&group.columns<=24,'Faceplate column geometry is bounded');
  assert.equal(JSON.stringify(device),before,'Layout never changes source data');
  for(const port of layout.ports){
    if(port.origin==='profile')assert.equal(port.status,'UNKNOWN');
    if(port.module===null)assert.equal(port.status,'UNKNOWN');
    if(port.module&&!port.module.status)assert.equal(port.status,'UNKNOWN','A module is not an UP status');
    assert(!/[\r\n]/.test(port.name));
  }
  if(code.startsWith('GC')){assert.equal(layout.summary.pon,code==='GC08'?8:16);assert.equal(layout.summary.nni,6);}
  if(code.startsWith('C')){assert.equal(layout.summary.pon,0);assert.equal(layout.profile.vendor,'H3C','Driver type HUAWEI does not change the real vendor');assert.equal(layout.hardware.units.length,members.size,'One faceplate per observed IRF member');}
}
for(const code of ['ZA62','HA58']){
  const layout=models.build(modelDevice(code));assert.equal(layout.summary.total,40);assert.equal(layout.summary.pon,32);assert.equal(layout.summary.nni,8);
}
assert.equal(models.build({model:'HA51',type:'OLT'}).summary.total,20);
for(const code of ['ZA61','ZA63','HA58','ZA62','CV52','HS12'])assert.equal(models.build({model:code,type:code.startsWith('C')||code.startsWith('HS')?'SWITCH':'OLT'}).summary.total,0,'Do not invent installed cards, chassis or C610 variants');
const odd=clone(modelDevice('CH52'));odd.ports=[{name:'-\r\r  Ten-GigabitEthernet1/0/13',module:{status:'UP',RX:0,TX:-2}},{name:'Ten-GigabitEthernet1/0/13',module:null}];
const clean=models.build(odd);assert.equal(clean.ports.find(port=>port.name==='Ten-GigabitEthernet1/0/13').status,'UP');assert.equal(clean.ports.find(port=>port.name==='Ten-GigabitEthernet1/0/13').module.RX,0);
const s5721=models.build({model:'HW57',type:'SWITCH'});
assert.deepEqual(clone(s5721.hardware.units[0].groups.map(group=>group.columns)),[12,4],'24 service ports use 12 columns; 4 uplinks use 4 columns');
assert.equal(models.faceplateGeometry(s5721,1400).portWidth,79.8,'Both GE and 10GE share one width instead of stretching each bank equally');
assert.equal(models.faceplateGeometry(s5721,500).portWidth,54,'Narrow views scroll rather than squeeze port labels');
assert.equal(models.faceplateGeometry(s5721,3000).portWidth,86,'Do not create oversized ports on very wide screens');
for(const code of ['GC08','GC16','CH52','CV53','ZA62','HA58']){
  const layout=models.build(modelDevice(code));
  for(const availableWidth of [400,960,1400,2000]){
    const geometry=models.faceplateGeometry(layout,availableWidth);
    assert(geometry.portWidth>=54&&geometry.portWidth<=86);
    assert.equal(geometry.portHeight,35);
  }
}
for(const code of ['GC08','GC16','CH52','CH53','CV52','CV53','ZA62','HA58']){
  const device=modelDevice(code);const before=JSON.stringify(device);const layout=models.build(device);
  for(const unit of layout.hardware.units){
    const rows=models.listRows(layout,unit);
    const groups=rows.flatMap(row=>row.groups);
    assert.equal(groups.length,unit.groups.length,'No fabricated zones or missing banks');
    assert.equal(new Set(groups.map(group=>group.id)).size,unit.groups.length,'No duplicated banks');
    assert.deepEqual(clone(groups.flatMap(group=>group.ports).map(port=>port.name).sort()),clone(unit.groups.flatMap(group=>group.ports).map(port=>port.name).sort()),'No ports cross members or disappear');
    if(code.startsWith('GC')){
      assert.deepEqual(clone(rows.map(row=>row.kind)),['service','uplink']);
      assert.equal(rows[0].groups.length,1);assert.equal(rows[1].groups.length,2);
      assert(rows.every(row=>!row.balanced),'Fixed GCOM is not forced into a four-zone OLT layout');
    }else if(code.startsWith('C')){
      assert.deepEqual(clone(rows.map(row=>row.kind)),['service','uplink']);
      assert(rows.every(row=>!row.balanced),'Fixed and IRF members retain their separate long service/uplink rows');
    }else{
      assert(rows.every(row=>row.balanced));
      assert.deepEqual(clone(rows.map(row=>row.kind)),['service','uplink']);
      assert.equal(rows[0].groups.length,2);assert.equal(rows[1].groups.length,2);
    }
  }
  assert.equal(JSON.stringify(device),before);
}
assert.deepEqual(clone(models.listRows(s5721,s5721.hardware.units[0]).map(row=>row.kind)),['mixed'],'Huawei fixed 24 service + 4 uplink may share a compact row');
const multiCard=models.build({model:'ZA62',type:'OLT',ports:[
  ...[1,2,3].flatMap(slot=>Array.from({length:16},(_,i)=>({name:`gpon_olt-1/${slot}/${i+1}`,module:null}))),
  ...Array.from({length:4},(_,i)=>({name:`xgei-1/4/${i+1}`,module:null}))
]});
const multiCardRows=models.listRows(multiCard,multiCard.hardware.units[0]);
assert.deepEqual(clone(multiCardRows.map(row=>row.groups.length)),[3,1],'Additional cards adapt without forcing exactly four regions');
assert(multiCardRows.every(row=>row.balanced));
console.log('PASS: adaptive list layout for GCOM fixed, Huawei fixed, H3C/IRF members and ZTE/Huawei modular cards, no forced four-zone grids or source mutations.');
console.log('PASS: source telemetry, GCOM 8/16 PON + 6 NNI, H3C 30/54/IRF, ZTE/Huawei modular banks, explicit unknown/missing modules, aliases, raw-name normalization and immutable data.');
console.log('PASS: shared port dimensions across service/uplink banks, stack members and modular cards; responsive sizing with a readable minimum and bounded maximum.');
