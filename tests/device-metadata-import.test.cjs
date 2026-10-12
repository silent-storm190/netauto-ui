// Exercise the real importer in memory; never overwrite the user's snapshot.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const record={POP:'TEST-POP',nameDev:'TEST-SW',ipDev:'192.0.2.1',function:'CE',modelDev:'HW57',vendor:'HUAWEI',area:'MB',zone:'V1',province:'HN',branch:'HN11'};
const inventoryDevice={serial:['TEST-SERIAL'],firmware:{version:'TEST-V1',patch:'TEST-PATCH',epld:'TEST-EPLD'},total_mac:0,username:'DO-NOT-EXPORT',password:'DO-NOT-EXPORT'};
const opticsFixture={status:'UP',RX:0,TX:0,RXH:-1,RXL:-20,TXH:4,TXL:1,manu_date:'TEST-DATE',extra:{lane:1}};
const fixture={data:{devices:{devices:[
  {...record,inventory:{device:inventoryDevice,count:{device:1,transceiver:1},modules:{transceiver:[{'XGigabitEthernet0/0/1':opticsFixture}]} }},
  {...record,nameDev:'TEST-OLD',ipDev:'192.0.2.2',inventory:{device:{serial:[]},modules:{transceiver:[]}}},
  {...record,nameDev:'TEST-NULL',ipDev:'192.0.2.3',inventory:{device:{serial:[],firmware:null,total_mac:null},modules:{transceiver:[]}}}
]}}};
const before=JSON.stringify(fixture),writes=new Map();
const fakeFs={readFileSync:()=>before,mkdirSync(){},writeFileSync:(name,value)=>writes.set(name,value),statSync:name=>({size:Buffer.byteLength(writes.get(name))})};
vm.runInNewContext(fs.readFileSync(path.join(root,'scripts/import-pop-data.cjs'),'utf8'),{
  require:name=>name==='node:fs'?fakeFs:require(name),process:{argv:['node','import','fixture.json']},__dirname:path.join(root,'scripts'),console:{log(){}}
});
const context={window:{NETAUTO_DATA:{},NETAUTO_POP_DETAIL_DATA:{pops:{}}}};
vm.runInNewContext(writes.get(path.join(root,'shared/netauto-pop-index.js')),context);
const data=context.window.NETAUTO_DATA;
vm.runInNewContext(writes.get(path.join(root,data.inventoryFiles['TEST-POP'])),context);
const rows=JSON.parse(JSON.stringify(context.window.NETAUTO_POP_DETAIL_DATA.pops['TEST-POP']));
assert.deepEqual(rows[0].firmware,inventoryDevice.firmware);
assert.equal(rows[0].totalMac,0,'Zero MAC count survives import');
assert.deepEqual(rows[0].ports[0].module,opticsFixture,'All port/module/optics fields survive import');
assert(!Object.hasOwn(rows[1],'firmware')&&!Object.hasOwn(rows[1],'totalMac'),'Old snapshots do not invent new device metadata');
assert.equal(rows[2].firmware,null);assert.equal(rows[2].totalMac,null);
assert.deepEqual(JSON.parse(JSON.stringify(data.pops[0].devices[0].firmware)),inventoryDevice.firmware,'Summary and inventory carry the same new metadata');
assert.equal(data.pops[0].devices[0].totalMac,0);
assert([...writes.values()].every(text=>!text.includes('DO-NOT-EXPORT')),'Device credentials are never exported into browser assets');
assert.equal(JSON.stringify(fixture),before);
console.log('PASS: new Device_Module_v2 firmware/MAC metadata, zero/null/legacy cases, lossless port fields, immutable import and credential exclusion.');
