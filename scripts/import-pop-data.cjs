// Mechanically generates browser assets from the user-provided source.
// Run: node mockup_ui/scripts/import-pop-data.cjs <source.json>
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const input = path.resolve(process.argv[2] || '');
if (!process.argv[2]) throw new Error('Provide the source JSON path.');
const mockup = path.resolve(__dirname,'..');
const output = path.join(mockup,'shared','pop-data');
if (!output.startsWith(mockup+path.sep)) throw new Error('Output must stay inside mockup_ui.');
const raw = fs.readFileSync(input,'utf8');
let nonFiniteNumbers = 0;
const parsed = JSON.parse(raw.replace(/([:\[,])\s*(?:-?Infinity|NaN)(?=\s*[,}\]])/g,(_match,prefix)=>{nonFiniteNumbers++;return prefix+' null';}));
const records = parsed.result?.data?.devices?.devices || parsed.data?.devices?.devices;
if (!Array.isArray(records) || !records.length) throw new Error('Missing data.devices.devices.');
const grouped = new Map();
const branches = {MB:new Set(),MN:new Set()};
const stats = {pops:0,devices:records.length,switches:0,olts:0,power:0,pi:0,ipms:0,opms:0,piOther:0,other:0};
const labels = {source:path.basename(input),sha256:crypto.createHash('sha256').update(raw).digest('hex'),nonFiniteNumbers,records:records.length};
function typeOf(d) {
  if (d.function==='POWER') return 'POWER';
  if (d.function==='PI') return 'PI';
  if (d.function==='ACN') return 'OLT';
  if (['CE','DI','SWMPLS'].includes(d.function)) return 'SWITCH';
  return ['SWITCH','OLT'].includes(d.deviceType)?d.deviceType:'UNKNOWN';
}
function materialRows(d) {
  const inv=d.inventory;
  if (!inv) return [];
  const rows=(inv.device?.serial || []).map(serial=>({category:'device',slot:'Chassis',type:d.modelDev,serial}));
  for (const [category,items] of Object.entries(inv.modules || {})) {
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (!item || typeof item!=='object') continue;
      const entries=category==='transceiver'?Object.entries(item):[[item.slot ?? null,item]];
      for (const [slot,info] of entries) {
        if (!info || typeof info!=='object') continue;
        rows.push({...info,category,slot,type:info.type || info.transceiver_type || info.module_type || info.model || info.part_number || null,serial:info.serial ?? info.sn ?? null});
      }
    }
  }
  return rows;
}
for (const d of records) {
  if (!d.POP) throw new Error('A device is missing its POP; do not silently drop it.');
  const type=typeOf(d);
  const materials=materialRows(d);
  // Keep explicit null slots: absence of a module is not a DOWN interface.
  const ports=(d.inventory?.modules?.transceiver || []).flatMap(item=>item&&typeof item==='object'?Object.entries(item).map(([name,module])=>({name,module})):[]);
  const device={name:d.nameDev,ip:d.ipDev,type,function:d.function,group:d.group,model:d.modelDev,vendor:d.vendor,area:d.area,province:d.province,branch:d.branch,zone:d.zone,inventoryAvailable:!!d.inventory,inventoryCounts:d.inventory?.count || null,chassisSerials:d.inventory?.device?.serial || [],materialRowsTotal:materials.length};
  if (!grouped.has(d.POP)) grouped.set(d.POP,[]);
  grouped.get(d.POP).push({...device,materials,ports,inventoryStatus:d.inventory?.status??null,inventoryTime:d.inventory?.timeUpdate??null});
  branches[d.area]?.add(d.branch);
  const counter={SWITCH:'switches',OLT:'olts',POWER:'power',PI:'pi',UNKNOWN:'other'}[type];
  stats[counter]++;
  if(type==='PI') stats[/IPMS/i.test(d.nameDev)?'ipms':/OPMS/i.test(d.nameDev)?'opms':'piOther']++;
}
stats.pops=grouped.size;
fs.mkdirSync(output,{recursive:true});
const pops=[];
const files={};
let materialTotal=0;
const unique=(devices,key)=>[...new Set(devices.map(d=>d[key]).filter(v=>v!=null&&v!==''))].sort();
for (const [code,devices] of [...grouped].sort(([a],[b])=>a.localeCompare(b))) {
  const filename='pop-'+crypto.createHash('sha256').update(code).digest('hex').slice(0,20)+'.js';
  const fullPath=path.join(output,filename);
  if (path.dirname(fullPath)!==output) throw new Error('Unsafe generated filename.');
  const areas=unique(devices,'area'),provinces=unique(devices,'province'),popBranches=unique(devices,'branch'),zones=unique(devices,'zone');
  const counts={switch:0,olt:0,power:0,pi:0};
  if(devices.some(d=>d.type==='UNKNOWN'))counts.other=0;
  for (const d of devices) {counts[({SWITCH:'switch',OLT:'olt',POWER:'power',PI:'pi',UNKNOWN:'other'})[d.type]]++;materialTotal+=d.materials.length;}
  pops.push({code,area:areas.join(' · '),province:provinces.join(' · '),branch:popBranches.join(' · '),zone:zones.join(' · '),areas,provinces,branches:popBranches,zones,counts,devices:devices.map(({materials,ports,inventoryStatus,inventoryTime,...metadata})=>metadata)});
  files[code]='shared/pop-data/'+filename;
  fs.writeFileSync(fullPath,'// Generated inventory for '+code+'; do not edit by hand.\nwindow.NETAUTO_POP_DETAIL_DATA.pops['+JSON.stringify(code)+']='+JSON.stringify(devices)+';\n');
}
labels.pops=pops.length;labels.materialRows=materialTotal;labels.inventoryDevices=records.filter(d=>d.inventory).length;
const index={provinces:Object.fromEntries(Object.entries(branches).map(([area,codes])=>[area,[...codes].filter(Boolean).sort()])),productionStats:stats,pops,snapshot:labels,inventoryFiles:files};
fs.writeFileSync(path.join(mockup,'shared','netauto-pop-index.js'),'// Generated from '+path.basename(input)+'; plans/workflows are preserved.\nObject.assign(window.NETAUTO_DATA,'+JSON.stringify(index)+');\n');
console.log(JSON.stringify({pops:stats.pops,devices:stats.devices,stats,materials:materialTotal,normalizedNonFinite:nonFiniteNumbers,indexBytes:fs.statSync(path.join(mockup,'shared','netauto-pop-index.js')).size,inventoryBytes:[...Object.values(files)].reduce((n,file)=>n+fs.statSync(path.join(mockup,file)).size,0)},null,2));
