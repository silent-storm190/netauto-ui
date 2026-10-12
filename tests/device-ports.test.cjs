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
assert(models.faceplateGeometry(s5721,500).portWidth>=54,'Narrow views add rows rather than squeeze port labels');
assert(models.faceplateGeometry(s5721,500).units[0].rows.length>1,'Uplinks move below a service bank that no longer fits');
assert.equal(models.faceplateGeometry(s5721,3000).portWidth,86,'Do not create oversized ports on very wide screens');
for(const kind of ['NNI','PON','UNKNOWN'])for(const status of ['UP','DOWN','UNKNOWN'])for(const modulePresent of [true,false,null])for(const vendor of ['HUAWEI','DASAN','H3C','GCOM','ZTE'])for(const type of ['SWITCH','OLT']){
  const device={type,vendor},layout={profile:{vendor}},port={kind,status,modulePresent};
  const tools=models.portTools(device,layout,port),keys=tools.map(tool=>tool.key);
  assert.equal(tools.find(tool=>tool.key==='crc').enabled,modulePresent===true);
  assert.equal(keys.includes('lacp'),kind==='NNI');
  if(kind==='NNI')assert.equal(tools.find(tool=>tool.key==='lacp').enabled,status==='UP');
  assert.equal(keys.includes('speed'),kind==='NNI'&&type==='SWITCH'&&['HUAWEI','DASAN'].includes(vendor));
  assert.equal(keys.includes('clearOffline'),kind==='PON');
}
assert.equal(models.portTools({type:'SWITCH',vendor:'HUAWEI'},{profile:{vendor:'H3C'}},{kind:'NNI',status:'UP',modulePresent:true}).some(tool=>tool.key==='speed'),false,'Canonical H3C profile is not mistaken for Huawei legacy driver bucket');
assert.equal(models.build({model:'TEST',type:'SWITCH',ports:[{name:'GigabitEthernet0/1'}]}).ports[0].modulePresent,null,'Missing module field must not count as a present transceiver');
const compact24=models.build({model:'HW24',type:'SWITCH',ports:Array.from({length:24},(_,i)=>({name:`XGigabitEthernet0/0/${i+1}`,module:null}))});
const compactGeometry=models.faceplateGeometry(compact24,1400);
assert.equal(compactGeometry.portWidth,86);
assert.equal(compactGeometry.chassisWidth,1118,'A single 24-port bank ends at its actual footprint instead of stretching to 1400px');
assert.equal(models.faceplateGeometry(compact24,3000).chassisWidth,1118,'Extra viewport width must not add empty shell space');
const gentlyExpanded=models.faceplateGeometry(compact24,1200);
assert.equal(gentlyExpanded.portWidth,92.8,'A small remaining gap is absorbed by a modest shared expansion');
assert.equal(gentlyExpanded.chassisWidth,1200);
assert(models.faceplateGeometry(compact24,1300).portWidth<=96,'Expansion stays bounded even near the gap threshold');
const singleCard=models.build({model:'ZA62',type:'OLT',ports:Array.from({length:16},(_,i)=>({name:`gpon_olt-1/1/${i+1}`,module:null}))});
assert.equal(models.faceplateGeometry(singleCard,2000).chassisWidth,758,'A modular device with one observed card does not reserve a phantom second track');
assert(models.faceplateGeometry(s5721,500).chassisWidth<=500,'Fixed banks adapt their columns before needing horizontal scrolling');
for(const code of ['HW12','HS12']){
  const device=modelDevice(code),before=JSON.stringify(device),layout=models.build(device);
  assert.equal(layout.hardware.cardTracks,1,'CE12804 cards are arranged vertically in one track');
  for(const unit of layout.hardware.units){
    for(const group of unit.groups){
      assert(group.columns<=12,'Dense CE12804 cards use no more than 12 ports per row');
      if(group.ports.length===48)assert.equal(Math.ceil(group.ports.length/group.columns),4,'A 48-port card is split into four readable rows');
    }
    assert(models.listRows(layout,unit,1400).every(row=>row.banks.length===1),'Mô phỏng follows the same vertical card structure');
  }
  for(const viewport of [400,960,1400,3000]){
    const face=models.faceplateGeometry(layout,viewport);
    assert(face.portWidth>=70);
    assert(face.portWidth>=Math.ceil(Math.max(...layout.ports.map(port=>port.label.length))*5.4+14),'Room for the longest member/slot/subslot/port label at 9px');
    assert(Object.values(face.bankColumns).every(columns=>[8,12,16].includes(columns)));
    if(viewport===1400){
      assert(Object.values(face.bankColumns).every(columns=>columns===16),'Wide CE12804 cards use sixteen ports per row');
      assert(face.chassisWidth>=1399&&face.chassisWidth<=1400,'Dense cards occupy the available width without a large right-hand void');
    }
    if(viewport===400)assert(Object.values(face.bankColumns).every(columns=>columns===8),'Narrow CE12804 cards add rows rather than squeeze names');
  }
  const profile=context.window.HuaweiDeviceLayouts.get(code);
  assert(profile.layoutGroups.every(group=>group.columns===12),'The standalone CE12804 preview shares the twelve-column card layout');
  assert.equal(Math.max(...profile.interfaces.map(port=>port.face.row)),4);
  assert.equal(JSON.stringify(device),before,'Do not replace observed ports or install sample cards from the photo');
}
for(const code of ['GC08','GC16','CH52','CV53','ZA62','HA58']){
  const layout=models.build(modelDevice(code));
  const layoutBefore=JSON.stringify(layout);
  for(const availableWidth of [400,960,1400,2000]){
    const geometry=models.faceplateGeometry(layout,availableWidth);
    assert(geometry.portWidth>=geometry.minPortWidth&&geometry.portWidth<=Math.max(96,geometry.minPortWidth));
    assert.equal(geometry.portHeight,35);
  }
  assert.equal(JSON.stringify(layout),layoutBefore,'Responsive faceplate planning does not mutate the layout or original column counts');
}
for(const code of ['GC08','GC16','CH52','CV53','ZA62','HA58']){
  const layout=models.build(modelDevice(code));
  const narrow=models.faceplateGeometry(layout,400),wide=models.faceplateGeometry(layout,1400);
  assert(narrow.chassisWidth<=400,'All representative fixed/OLT/IRF models adapt to narrow widths');
  if(layout.hardware.modular)assert(narrow.units.every(unit=>unit.tracks===1),'Narrow OLT card layouts collapse their tracks');
  else assert(narrow.units.some(unit=>unit.rows.length>1),'Fixed chassis move banks onto additional rows');
  assert(wide.chassisWidth<=1400,'Wide layouts remain within their container');
}
for(const code of ['GC08','GC16','CH52','CH53','CV52','CV53','ZA62','HA58']){
  const device=modelDevice(code);const before=JSON.stringify(device);const layout=models.build(device);
  for(const unit of layout.hardware.units){
    const rows=models.listRows(layout,unit,1400);
    const groups=rows.flatMap(row=>row.groups);
    assert.equal(groups.length,unit.groups.length,'No fabricated zones or missing banks');
    assert.equal(new Set(groups.map(group=>group.id)).size,unit.groups.length,'No duplicated banks');
    assert.deepEqual(clone(groups.flatMap(group=>group.ports).map(port=>port.name).sort()),clone(unit.groups.flatMap(group=>group.ports).map(port=>port.name).sort()),'No ports cross members or disappear');
    if(code.startsWith('GC')){
      assert.deepEqual(clone(rows.map(row=>row.kind)),['mixed'],'GCOM banks fit together just like Giả lập');
      assert.equal(rows[0].groups.length,3);
    }else if(code.startsWith('C')){
      assert.deepEqual(clone(rows.map(row=>row.kind)),code.endsWith('2')?['mixed']:['service','uplink']);
    }else{
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
assert.deepEqual(clone(multiCardRows.map(row=>row.groups.length)),[2,2],'Additional cards follow the two tracks of Giả lập, without creating cards');
assert.deepEqual(clone(multiCardRows.map(row=>row.kind)),['service','mixed']);

// Audit EVERY switch/OLT, including models that have no port inventory.
// Check each distinct observed geometry, not just a representative screenshot.
const covered=new Set(),shapes=new Set();let devices=0,checks=0;
for(const pop of data.pops){
  const candidates=pop.devices.filter(device=>['SWITCH','OLT'].includes(device.type));
  if(!candidates.length)continue;
  const detail=fullDevices(pop.code);
  for(const indexed of candidates){
    const device=detail.find(device=>device.name===indexed.name)||indexed;
    const before=JSON.stringify(device),layout=models.build(device);
    devices++;covered.add(indexed.model);
    assert.equal(JSON.stringify(device),before,'Planner leaves every source record unchanged');
    const signature=JSON.stringify([layout.model,layout.hardware.modular,layout.hardware.units.map(unit=>unit.groups.map(group=>[group.id,group.columns,group.ports.length,group.uplink,Math.max(...group.ports.map(port=>port.label.length))]))]);
    if(shapes.has(signature))continue;shapes.add(signature);
    for(const width of [280,400,650,960,1400,2000,3000])for(const unit of layout.hardware.units){
      const face=models.faceplateGeometry(layout,width);
      assert(Number.isInteger(face.chassisWidth)&&face.chassisWidth>=280);
      const plan=face.units[layout.hardware.units.indexOf(unit)];
      assert.deepEqual(clone(plan.rows.flatMap(row=>row.banks.map(bank=>bank.id))),clone(unit.groups.map(group=>group.id)),'Every bank remains once, in source order, inside its original member');
      assert(face.portWidth>=face.minPortWidth,'Every model reserves enough width for its longest port label');
      assert(face.portWidth<=Math.max(96,face.minPortWidth),'No oversized ports except when required by an unusually long source name');
      for(const row of plan.rows){
        const footprint=26+row.slots.reduce((sum,bank)=>sum+16+bank.columns*face.portWidth+(bank.columns-1)*4,0)+Math.max(0,row.slots.length-1)*8;
        assert(face.chassisWidth>=footprint-.01,'Every adaptive row fits within the compact chassis');
        for(const bank of row.banks){
          const source=unit.groups.find(group=>group.id===bank.id);
          assert(bank.columns>0&&bank.columns<=source.ports.length);
          assert.equal(face.bankColumns[bank.id],bank.columns);
        }
      }
      const gridTracks=plan.gridColumns.split(' ').map(parseFloat);
      assert(gridTracks.every(track=>Number.isFinite(track)&&track>=0));
      assert(Math.abs(gridTracks.reduce((sum,track)=>sum+track,0)-(face.chassisWidth-26))<.02,'CSS tracks occupy the computed inner chassis width');
      for(const bank of plan.placements){
        const [start,end]=bank.column.split(' / ').map(Number);
        const left=gridTracks.slice(0,start-1).reduce((sum,track)=>sum+track,0);
        const right=gridTracks.slice(0,end-1).reduce((sum,track)=>sum+track,0);
        assert(Math.abs(left-bank.start)<.02&&Math.abs(right-bank.end)<.02,'Rendered CSS placement matches the planner');
        assert(bank.end<=face.chassisWidth-26+.01);
      }
      const rows=models.listRows(layout,unit,width);checks++;
      assert.deepEqual(clone(rows.flatMap(row=>row.groups.map(group=>group.id))),clone(unit.groups.map(group=>group.id)),`${indexed.model}: preserve Giả lập bank/member order`);
      for(const row of rows){
        assert(row.portWidth>0&&row.portWidth<=110);
        assert(row.portWidth>=row.minPortWidth-.11,'Do not squeeze port names to preserve a row');
        assert(Math.abs(row.banks.reduce((sum,bank)=>sum+bank.width,0)+(row.banks.length-1)*10-width)<.01,'Use the full chassis width without overflowing');
        for(const [i,bank] of row.banks.entries()){
          assert(bank.columns>0&&bank.columns<=row.groups[i].columns);
          assert(bank.columns*row.portWidth+(bank.columns-1)*6<=bank.width-24+.01,'Ports fit inside the bank');
        }
      }
      const originalWidth=unit.groups.reduce((sum,group)=>sum+24+group.columns*rows[0].minPortWidth+(group.columns-1)*6,0)+(unit.groups.length-1)*10;
      if(!layout.hardware.modular&&originalWidth<=width){
        assert.equal(rows.length,1,'When Giả lập fits, keep its original horizontal arrangement');
        assert.deepEqual(clone(rows[0].banks.map(bank=>bank.columns)),clone(unit.groups.map(group=>group.columns)));
      }
    }
  }
}
assert.equal(covered.size,54,'All 54 snapshot switch/OLT models are covered');
assert.equal(devices,12083,'All snapshot switches and OLTs are checked');
console.log(`PASS: ${devices} devices / ${covered.size} models / ${shapes.size} observed geometries / ${checks} responsive unit layouts.`);
console.log('PASS: adaptive list layout for GCOM fixed, Huawei fixed, H3C/IRF members and ZTE/Huawei modular cards, no forced four-zone grids or source mutations.');
console.log('PASS: source telemetry, GCOM 8/16 PON + 6 NNI, H3C 30/54/IRF, ZTE/Huawei modular banks, explicit unknown/missing modules, aliases, raw-name normalization and immutable data.');
console.log('PASS: adaptive faceplate bank rows/card tracks for all models, shared dimensions, readable labels, bounded gentle expansion and planner-driven CSS placement.');
