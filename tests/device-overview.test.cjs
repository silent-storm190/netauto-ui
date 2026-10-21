// Run: node mockup_ui/tests/device-overview.test.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),nodes=new Map();
function node(id){
  let markup='',groups=null;
  return {id,value:'',dataset:{},hidden:false,disabled:false,attrs:{},listeners:{},textContent:'',
    get innerHTML(){return markup;},set innerHTML(value){markup=value;groups=null;},
    setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,fn){this.listeners[k]=fn;},
    querySelectorAll(selector){
      if(id!=='deviceDetailRows')return [];
      if(!groups)groups=Array.from(markup.matchAll(/<details class="l2-material-group" data-material-group="([^"]+)"( open)?>/g),m=>{
        const list={dataset:{materialGroup:m[1]},scrollTop:0,scrollLeft:0};
        return {dataset:{materialGroup:m[1]},open:!!m[2],querySelector:()=>list,list};
      });
      return selector==='details[data-material-group]'?groups:selector==='.l2-material-list'?groups.map(g=>g.list):[];
    }
  };
}
const get=id=>{if(!nodes.has(id))nodes.set(id,node(id));return nodes.get(id);};
const materials=[
  {category:'device',slot:'Chassis',type:'HS64',serial:'CHASSIS-1'},
  {category:'device',slot:'Chassis',type:'HS64',serial:'CHASSIS-2'},
  ...Array.from({length:6},(_,i)=>({category:'transceiver',slot:'XGigabitEthernet0/0/'+(i+1),type:i===5?'UNKNOWN_SFP':'10GBASE_LR_SFP',serial:i<2?'DUPLICATE-001':'OPTIC-'+i})),
  {category:'power',slot:null,type:'PDC1000S12-DB',serial:'POWER-1'},
  {category:'power',slot:0,type:'PDC1000S12-DB',serial:'POWER-2'},
  {category:'<img src=x>',slot:'<svg onload=x>',type:'MODEL<&>',serial:'SERIAL"<script>'},
];
const device={name:'DEVICE<&>',ip:'192.0.2.1',type:'SWITCH',function:'DI',vendor:'HUAWEI',model:'HS64',firmware:{version:'FW<&>',patch:'P1'},totalMac:0,chassisSerials:['CHASSIS-1','CHASSIS-2'],portCount:0,ports:[],materials,materialRowsTotal:22,inventoryCounts:{device:2,transceiver:6,power:2,fan:0,card:0}};
const original=JSON.stringify(device),pop={code:'TEST-POP',area:'MN',zone:'V7',province:'AGG',branch:'AGG'};
let loaded=true,status='loaded';
const source={source:'SOURCE-FIXTURE',pops:{[pop.code]:[device]},status:()=>status,isLoaded:()=>loaded};
const context={Intl,document:{getElementById:get},window:{NETAUTO_POP_DETAIL_DATA:source,
  NETAUTO_PORT_MODELS:{clean:value=>value,build:()=>({profile:{vendor:'HUAWEI',name:'TEST'}})},
  NETAUTO_DEVICE_PORTS:{open(){},closeMenu(){},setRefreshHandler(){}},
}};
vm.runInNewContext(fs.readFileSync(path.join(root,'shared/netauto-device-detail.js'),'utf8'),context);
const controller=context.window.NETAUTO_DEVICE_DETAIL,host=get('deviceDetailRows');
const groups=()=>host.querySelectorAll('details[data-material-group]');
const search=value=>{get('deviceDetailMaterialSearch').value=value;get('deviceDetailMaterialSearch').listeners.input();};
controller.open(pop,device);
const plain=get('deviceDetailFields').innerHTML.replace(/<span class="l2-meta-icon"[^>]*>[\s\S]*?<\/svg><\/span>/g,'');
assert.equal((plain.match(/class="l2-device-field/g)||[]).length,8);
assert.equal((get('deviceDetailFields').innerHTML.match(/class="l2-meta-icon"/g)||[]).length,8);
assert(plain.includes('<dt>Vendor · Model</dt><dd>HUAWEI · HS64</dd>'));
for(const label of ['Vendor','Model','Số port','Số transceiver','Module nguồn','Module quạt','Card'])assert(!plain.includes(`<dt>${label}</dt>`),'Do not duplicate combined identity or top statistics');
for(const [label,count] of [['Chassis',2],['Module quang',6],['Module nguồn',2],['Module quạt',0],['Module card',0]])assert(get('deviceDetailStats').innerHTML.includes(`<span>${label}</span><b>${count}</b>`),'Top statistics retain source counts, including zero');
const locationHTML=get('deviceDetailLocation').innerHTML;
assert.deepEqual(Array.from(locationHTML.matchAll(/<dt>([^<]+)<\/dt>/g),m=>m[1]),['POP','Miền','Vùng','Tỉnh','Chi nhánh']);
assert(locationHTML.includes('<dd>TEST-POP</dd>')&&locationHTML.includes('<dd>Miền Nam</dd>')&&locationHTML.includes('<dd>V7</dd>'));
for(const label of ['POP','Miền','Vùng','Tỉnh','Chi nhánh'])assert(!plain.includes('<dt>'+label+'</dt>'),'Location is not duplicated in separate information tiles');
assert(plain.includes('<dt>Total MAC</dt><dd>0</dd>'));
assert(plain.includes('FW&lt;&amp;&gt;')&&plain.includes('CHASSIS-1 · CHASSIS-2'));
assert(!plain.includes('is-wide'),'Eight equal-width tiles fill two rows on wide layouts');
assert.equal(get('deviceDetailName').textContent,'DEVICE<&>');assert(get('deviceDetailIcon').innerHTML.includes('<svg '));
assert(!get('deviceDetailStats').innerHTML.includes('Rectifier'),'Switch inventory summary excludes the non-applicable Rectifier statistic');
assert.equal(groups().length,4);assert.equal(groups()[0].open,true);assert.equal(groups()[1].open,false);assert.equal(groups()[2].open,true);
assert.equal((host.innerHTML.match(/class="l2-material-item"/g)||[]).length,materials.length,'All inventory records remain present, including collapsed groups');
assert.equal((host.innerHTML.match(/DUPLICATE-001/g)||[]).length,2,'Duplicate serial records are not deduplicated');
assert(host.innerHTML.includes('UNKNOWN_SFP')&&host.innerHTML.includes('class="l2-material-list l2-table-wrap"'));
assert(!host.innerHTML.includes('<img')&&!host.innerHTML.includes('<svg onload=')&&!host.innerHTML.includes('<script>'));
assert(host.innerHTML.includes('&lt;img src=x&gt;')&&host.innerHTML.includes('MODEL&lt;&amp;&gt;')&&host.innerHTML.includes('SERIAL&quot;&lt;script&gt;'));
assert(host.innerHTML.includes('<dt>Slot / Port</dt><dd>0</dd>'),'Numeric slot zero is not treated as missing');
assert(get('deviceDetailMaterialCount').textContent.includes('11 / 22')&&get('deviceDetailMaterialCount').textContent.includes('Đã tải 11'),'Observed records do not replace source totals');
groups()[0].open=false;groups()[1].open=true;groups()[1].list.scrollTop=93;groups()[1].list.scrollLeft=7;
controller.refreshInventory(pop.code);
assert.equal(groups()[0].open,false);assert.equal(groups()[1].open,true);
assert.equal(groups()[1].list.scrollTop,93);assert.equal(groups()[1].list.scrollLeft,7,'Same-device refresh retains inventory scroll axes');
source.pops[pop.code]=[{...device,materials:[...materials.filter(row=>row.category==='power'),...materials.filter(row=>row.category!=='power')]}];
controller.refreshInventory(pop.code);
assert.equal(groups().find(group=>group.dataset.materialGroup==='0').open,false,'Manual group state follows the category if refreshed source order changes');
assert.equal(groups().find(group=>group.dataset.materialGroup==='1').list.scrollTop,93,'Group scroll follows the same stable key across source reorder');
source.pops[pop.code]=[device];controller.refreshInventory(pop.code);
search('duplicate-001');assert.equal((host.innerHTML.match(/class="l2-material-item"/g)||[]).length,2);assert.equal(groups()[0].open,true);
assert(host.innerHTML.includes('class="l2-material-badge">2/6</span>'));
search('');assert.equal(groups()[0].open,false);assert.equal(groups()[1].open,true,'Clearing search restores manual expansion choices');
search('module nguồn');assert.equal((host.innerHTML.match(/class="l2-material-item"/g)||[]).length,2);
search('UNKNOWN_SFP');assert.equal((host.innerHTML.match(/class="l2-material-item"/g)||[]).length,1);
search('NO-SUCH-ITEM');assert(host.innerHTML.includes('Không có vật tư khớp từ khóa'));
search('');controller.open(pop,{...device,name:'OTHER',materials:materials.slice(0,2)});assert.equal(groups()[0].open,true,'A new device starts with fresh group state');assert.equal(get('deviceDetailMaterialSearch').value,'');
loaded=false;status='loading';controller.open(pop,{...device,materials:[]});assert(host.innerHTML.includes('Đang nạp inventory'));
status='error';controller.open(pop,{...device,materials:[]});assert(host.innerHTML.includes('Không tải được inventory'));
loaded=true;status='loaded';controller.open(pop,{...device,materials:[],firmware:null,totalMac:null});assert(host.innerHTML.includes('Chưa có bản ghi vật tư'));
assert(get('deviceDetailFields').innerHTML.includes('<dd>—</dd>'));
controller.open(pop,{...device,type:'OLT'});assert(!get('deviceDetailStats').innerHTML.includes('Rectifier'),'OLT inventory summary excludes Rectifier even with incomplete port data');
controller.open(pop,{...device,type:'POWER',inventoryCounts:{rectifier:3}});assert(get('deviceDetailStats').innerHTML.includes('<span>Rectifier</span><b>3</b>'),'Power device still shows its source-backed rectifier count');
controller.open(pop,{...device,model:'MODEL<&>'});assert(get('deviceDetailFields').innerHTML.includes('HUAWEI · MODEL&lt;&amp;&gt;</dd>'),'Merged identity uses the canonical vendor and escapes the source model');
controller.open(pop,{...device,model:null});assert(get('deviceDetailFields').innerHTML.includes('HUAWEI · —</dd>'),'Missing model is not replaced by a simulated profile name');
assert.equal(JSON.stringify(device),original,'View changes never mutate source inventory or backend totals');
const css=fs.readFileSync(path.join(root,'shared/netauto-device-overview.css'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(html.includes('shared/netauto-device-overview.css')&&html.indexOf('shared/netauto-device-overview.css')>html.indexOf('shared/netauto-context-tools.css'));
assert(html.includes('<dl class="l2-device-fields" id="deviceDetailFields">')&&html.includes('<div class="l2-material-groups" id="deviceDetailRows">'));
assert(html.includes('Nguồn dữ liệu</summary><p id="deviceDetailSource">'),'Source is retained in an optional disclosure instead of dominating the header');
assert(css.includes('grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;')&&css.includes('overflow-wrap:anywhere'));
assert(css.includes('max-height:360px;overflow:auto')&&css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));
assert(css.includes('@container device-info')&&css.includes('@container device-inventory')&&css.includes('@media(forced-colors:active)')&&css.includes(':focus-visible'));
assert(html.includes('id="deviceDetailLocation"')&&css.includes('.l2-device-location{display:flex;align-items:center;flex-wrap:wrap;'));
assert(!html.includes('id="devicePortsRefresh"')&&!html.includes('Chọn một port để xem thông tin và công cụ. Nhấn lại port đang chọn để đóng.'));
assert(html.includes('<span class="l2-refresh-icon" aria-hidden="true"><svg ')&&html.includes('title="Quét lại các module thuộc thiết bị"'));
assert(css.includes('color:var(--na-cyan)')&&css.includes('#deviceModulesRefresh:disabled{cursor:wait;opacity:.65}'));
const portCSS=fs.readFileSync(path.join(root,'shared/netauto-device-ports.css'),'utf8');
assert(portCSS.includes('--l2-port-up:light-dark(#00cfa5,#35e7bf)')&&portCSS.includes('--l2-port-down:light-dark(#ff775f,#ffa28d)'));
assert(portCSS.includes('var(--l2-port-up) 10%')&&portCSS.includes('var(--l2-port-down) 14%')&&portCSS.includes('var(--l2-port-unknown) 8%'));
assert(portCSS.includes('background-size:8px 8px')&&portCSS.includes('border-style:dashed'),'Empty and unknown retain distinct non-color indicators');
console.log('PASS: 8 source-backed tiles with merged Vendor · Model and no duplicated statistics + compact five-field location, zero/missing/XSS safety, grouped inventory, search/expansion/scroll preservation and semantic port palette.');
