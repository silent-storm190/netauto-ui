// Validate every generated POP/device/material; optionally compare the original source.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const context={window:{NETAUTO_DATA:{}}};
vm.runInNewContext(fs.readFileSync(path.join(root,'shared/netauto-pop-index.js'),'utf8'),context);
const data=JSON.parse(JSON.stringify(context.window.NETAUTO_DATA));
assert.equal(data.pops.length,3910);
assert.equal(new Set(data.pops.map(pop=>pop.code)).size,3910);
assert.equal(Object.keys(data.inventoryFiles).length,3910);
assert.equal(new Set(data.pops.map(pop=>pop.province)).size,63);
assert.equal(new Set(Object.values(data.provinces).flat()).size,69);
assert.equal(data.pops.filter(pop=>pop.branches.length>1).length,6);
let source=null;
if(process.argv[2]){
  const raw=fs.readFileSync(process.argv[2],'utf8');
  assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),data.snapshot.sha256,'The snapshot must match the original file');
  let normalized=0;
  const parsed=JSON.parse(raw.replace(/([:\[,])\s*(?:-?Infinity|NaN)(?=\s*[,}\]])/g,(_match,prefix)=>{normalized++;return prefix+' null';}));
  assert.equal(normalized,data.snapshot.nonFiniteNumbers);
  source=new Map();
  for(const device of parsed.data.devices.devices){
    if(!source.has(device.POP))source.set(device.POP,[]);
    source.get(device.POP).push(device);
  }
  assert.equal(source.size,data.pops.length);
}
const stats={pops:0,devices:0,switches:0,olts:0,power:0,pi:0,ipms:0,opms:0,piOther:0,other:0};
let materials=0,inventory=0;
for(const pop of data.pops){
  const file=path.resolve(root,data.inventoryFiles[pop.code]);
  assert(file.startsWith(path.join(root,'shared','pop-data')+path.sep),'All chunks stay inside the data directory');
  const text=fs.readFileSync(file,'utf8');
  const assignment=text.match(/\.pops\[([^\n]+?)\]=([\s\S]+);\s*$/);
  assert(assignment,'Valid classic-script chunk');
  assert.equal(JSON.parse(assignment[1]),pop.code);
  const devices=JSON.parse(assignment[2]);
  assert.equal(devices.length,pop.devices.length);
  const counts={switch:0,olt:0,power:0,pi:0};
  stats.pops++;
  for(const [index,device] of devices.entries()){
    const {materials:rows,...metadata}=device;
    assert.deepEqual(metadata,pop.devices[index],`Index and inventory metadata match: ${pop.code}/${device.name}`);
    assert.equal(rows.length,device.materialRowsTotal);
    materials+=rows.length;inventory+=Number(device.inventoryAvailable);stats.devices++;
    const category={SWITCH:'switch',OLT:'olt',POWER:'power',PI:'pi',UNKNOWN:'other'}[device.type];
    counts[category]=(counts[category]||0)+1;
    stats[{SWITCH:'switches',OLT:'olts',POWER:'power',PI:'pi',UNKNOWN:'other'}[device.type]]++;
    if(device.type==='PI')stats[/IPMS/i.test(device.name)?'ipms':/OPMS/i.test(device.name)?'opms':'piOther']++;
    if(source){
      const original=source.get(pop.code)[index];
      const expectedType={CE:'SWITCH',DI:'SWITCH',SWMPLS:'SWITCH',ACN:'OLT',POWER:'POWER',PI:'PI'}[original.function]||(['SWITCH','OLT'].includes(original.deviceType)?original.deviceType:'UNKNOWN');
      assert.equal(device.type,expectedType);
      for(const [target,key] of Object.entries({name:'nameDev',ip:'ipDev',model:'modelDev',function:'function',group:'group',vendor:'vendor',area:'area',province:'province',branch:'branch',zone:'zone'}))assert.equal(device[target],original[key],`${pop.code}/${device.name}/${target}`);
      assert.deepEqual(device.inventoryCounts,original.inventory?.count||null);
      assert.deepEqual(device.chassisSerials,original.inventory?.device?.serial||[]);
      const chassis=rows.filter(row=>row.category==='device');
      assert.deepEqual(chassis.map(row=>row.serial),original.inventory?.device?.serial||[]);
      for(const [kind,items] of Object.entries(original.inventory?.modules||{})){
        const moduleRows=rows.filter(row=>row.category===kind);
        const expected=[];
        for(const item of Array.isArray(items)?items:[]){
          if(!item||typeof item!=='object')continue;
          if(kind==='transceiver'){
            for(const [slot,info] of Object.entries(item))if(info&&typeof info==='object')expected.push({slot,info});
          }else expected.push({slot:item.slot??null,info:item});
        }
        assert.equal(moduleRows.length,expected.length,`${pop.code}/${device.name}/${kind}: no missing modules`);
        expected.forEach(({slot,info},rowIndex)=>{
          const row=moduleRows[rowIndex];
          assert.equal(row.slot,slot);
          assert.equal(row.serial,info.serial??info.sn??null);
          assert.equal(row.type,info.type||info.transceiver_type||info.module_type||info.model||info.part_number||null);
          for(const [key,value] of Object.entries(info))if(!['category','slot','type','serial'].includes(key))assert.equal(JSON.stringify(row[key]),JSON.stringify(value));
        });
      }
    }
  }
  assert.deepEqual(counts,pop.counts,`${pop.code}: per-type counts match all devices`);
}
assert.deepEqual(stats,data.productionStats);
assert.equal(stats.devices,19070);
assert.equal(materials,data.snapshot.materialRows);
assert.equal(inventory,data.snapshot.inventoryDevices);
assert.equal(materials,240118);
assert.equal(inventory,17190);
console.log(`PASS: ${stats.pops} POPs, ${stats.devices} devices, ${materials} material records; every chunk and count validated${source?' against the original source':''}.`);
