const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'../service_checking'),M=require(path.join(base,'service-model.js'));
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(base,'responses.js'),'utf8'),context);const fixtures=JSON.parse(JSON.stringify(context.window.NETAUTO_SERVICE_RESPONSES)),original=JSON.stringify(fixtures);
assert.deepEqual(Object.keys(fixtures),['hw24','cv52','ha58','gc16','hw67']);
for(const response of Object.values(fixtures))assert.equal(M.validate(response),null);
for(const [key,total,portCount] of [['gc16',46,16],['ha58',84,32]]){
  const d=fixtures[key],index=M.index(d);assert.equal(index.rows.length,total);assert.equal(index.ports.length,portCount);assert.strictEqual(M.index(d),index,'Index is cached once per immutable response');assert.equal(index.signals.ip,3);assert(index.signals.any<10,'Missing transceiver MAC must not become a customer error');
  for(const row of index.rows){assert.strictEqual(row.source,d.result.ports[row.port.id].onu_data[row.position]);assert(M.filter(index,{query:row.source.onu_sn}).rows.includes(row));assert(M.filter(index,{query:row.source.contract}).rows.includes(row));}
  assert.equal(M.filter(index,{attention:'ip'}).rows.length,3);assert.equal(M.filter(index,{query:'not-a-real-onu'}).rows.length,0);
  const empty=index.ports.find(p=>!p.rows.length);if(empty){assert(M.filter(index).ports.some(p=>p.port===empty));assert(M.filter(index,{query:empty.name}).ports.some(p=>p.port===empty));}
  assert(M.filter(index,{scope:0}).rows.every(r=>r.port.id===0));assert(M.filter(index,{oper:'DOWN'}).ports.every(r=>r.port.source.oper_stt==='DOWN'));
}
assert.equal(M.flags({onu_ipwan:null,contract:null,drop_point:null,net_status:null}).length,4);
assert.equal(M.flags({onu_ipwan:'1.2.3.4',contract:'X',drop_point:'Y',net_status:'Bình thường'}).length,0);
assert.equal(M.flags({onu_ipwan:'1.2.3.4',contract:'X',drop_point:'Y',net_status:'Ngung vi ly do thanh toan'})[0].key,'contract');
assert.equal(M.paginate([1,2,3],999,25).page,0);assert.equal(M.paginate([],3,25).total,0);assert.equal(M.paginate(Array(1000),3,25).rows.length,25);
const sourceRows=M.index(fixtures.gc16).rows,csv=M.csv(sourceRows);assert.equal(csv.split('\r\n').length,47);assert(csv.includes('Serial ONU')&&csv.includes(sourceRows.at(-1).source.onu_sn));assert(!M.csv(sourceRows,{identity:false}).includes('Serial ONU'));
const injected={...sourceRows[0],source:{...sourceRows[0].source,contract:'=HYPERLINK("bad")',onu_rx:'-19.2'}};assert(M.csv([injected]).includes("'=HYPERLINK"));assert(M.csv([injected]).includes('"-19.2"'));
assert(M.validate(null));assert(M.validate({device_type:'OLT',status:true,result:{ports:'bad'}}));assert.equal(M.validate({device_type:'OLT',status:false,error:'timeout',result:null}),null);


const uiSource=fs.readFileSync(path.join(base,'service-checking.js'),'utf8'),html=fs.readFileSync(path.join(base,'mockup.html'),'utf8');
function harness(config={},layoutWidth=null){
  const nodes=new Map(),pending=new Map(),exports=[];let timer=0;const known=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
  const element=id=>({id,value:'',innerHTML:'',textContent:'',hidden:false,disabled:false,open:false,dataset:{},listeners:{},attrs:{},files:[],style:{},addEventListener(k,f){this.listeners[k]=f;},setAttribute(k,v){this.attrs[k]=v;},focus(){},showModal(){this.open=true;},close(){this.open=false;this.listeners.close?.();},click(){exports.push({href:this.href,name:this.download});}});
  const get=id=>{assert(known.has(id)||id.startsWith('svc-tab-'),'Unexpected DOM id '+id);if(!nodes.has(id))nodes.set(id,element(id));return nodes.get(id);};
  const root=get('serviceApp');root.querySelectorAll=()=>[];root.querySelector=()=>({focus(){}});
  let resizeObserver=null,layoutTable=null,layoutColumns=[],layoutWrites=0,columnWrites=0,frameId=0;
  const frames=new Map();
  const flushFrames=()=>{const jobs=[...frames.values()];frames.clear();jobs.forEach(fn=>fn());};
  const wrapper={clientWidth:layoutWidth,querySelector(){return layoutTable;}};
  const host=get('onuTableHost');
  host.querySelectorAll=()=>{
    const group=host.innerHTML.match(/<colgroup>([\s\S]*?)<\/colgroup>/)?.[1];
    if(!host.innerHTML.includes('data-onu-layout')||!group)return [];
    layoutColumns=[...group.matchAll(/data-onu-column="([^"]+)" style="width:([^"]+)"/g)].map(match=>{let width=match[2];return {dataset:{onuColumn:match[1]},style:{get width(){return width;},set width(value){columnWrites++;width=value;}}};});
    const properties={};layoutTable={style:{getPropertyValue:key=>properties[key]||'',setProperty:(key,value)=>{layoutWrites++;properties[key]=value;}},querySelectorAll:()=>layoutColumns};
    return [wrapper];
  };
  const doc={getElementById:get,createElement:()=>element('download')};
  const win={NETAUTO_SERVICE_MODEL:M,NETAUTO_SERVICE_RESPONSES:fixtures,NETAUTO_SERVICE_CHECK_CONFIG:config};
  const ctx={window:win,document:doc,localStorage:{getItem(){return null;},setItem(){}},setTimeout(fn){const id=++timer;pending.set(id,fn);return id;},clearTimeout(id){pending.delete(id);},requestAnimationFrame(fn){const id=++frameId;frames.set(id,fn);return id;},cancelAnimationFrame(id){frames.delete(id);},Blob,URL:{createObjectURL:()=> 'blob:local',revokeObjectURL(){}},console};
  if(layoutWidth!=null)ctx.ResizeObserver=class{constructor(callback){this.callback=callback;}observe(){resizeObserver=this;}disconnect(){if(resizeObserver===this)resizeObserver=null;}};
  vm.runInNewContext(uiSource,ctx);
  const click=dataset=>root.listeners.click({target:{closest:()=>({dataset,disabled:false})}});
  const input=(id,value)=>{get(id).value=value;get(id).listeners.input({target:get(id)});};
  const change=(id,value)=>{get(id).value=value;get(id).listeners.change({target:get(id)});};
  const flush=()=>{const jobs=[...pending.values()];pending.clear();jobs.forEach(fn=>fn());};
  return {get,click,input,change,flush,root,api:win.NETAUTO_SERVICE_CHECK_UI,html:()=>get('onuTableHost').innerHTML,exports,
    resize(width,defer=false){wrapper.clientWidth=Math.round(width);resizeObserver?.callback([{target:wrapper,contentRect:{width}}]);if(!defer)flushFrames();},flushFrames,
    layout:()=>({width:layoutTable?.style.getPropertyValue('--svc-onu-render-width'),columns:Object.fromEntries(layoutColumns.map(col=>[col.dataset.onuColumn,parseInt(col.style.width)])),observed:!!resizeObserver,writes:layoutWrites+columnWrites,frames:frames.size})};
}
function onuWidthsAt(markup,tableWidth){const cols=markup.match(/<colgroup>([\s\S]*?)<\/colgroup>/)?.[1];assert(cols,'Explicit ONU column layout');const result={};for(const m of cols.matchAll(/<col data-onu-column="([^"]+)" style="width:([^"]+)">/g)){const fixed=m[2].match(/^([\d.]+)px$/),fluid=m[2].match(/^calc\(([\d.]+)% - ([\d.]+)px\)$/);assert(fixed||fluid,'Valid column width '+m[2]);result[m[1]]=fixed?Number(fixed[1]):tableWidth*Number(fluid[1])/100-Number(fluid[2]);}return result;}
function assertBalancedOnuColumns(markup){const min=Number(markup.match(/--svc-onu-width:(\d+)px/)[1]),base=onuWidthsAt(markup,min),columns=Object.entries(base).map(([key,width])=>({key,width}));assert.equal(Object.values(base).reduce((a,b)=>a+b,0),min);for(const width of [600,min,min+320,min+800]){const layout=M.onuLayout(columns,width),cols=Object.fromEntries(layout.columns.map(c=>[c.key,c.width]));assert.equal(Object.values(cols).reduce((a,b)=>a+b,0),Math.max(min,width),'Column widths account for the whole table, without one implicit filler');assert.equal(cols.onu_id,96);if(cols.pon!=null)assert.equal(cols.pon,88);for(const key of ['onu_rx','onu_tx','onu_temp','onu_olt_distance','contract','onu_ipwan'])if(base[key]!=null)assert.equal(cols[key],base[key],key+' does not stretch into empty space');for(const [key,value] of Object.entries(cols))assert(value>=base[key],key);}return base;}
const ui=harness();assert.equal(ui.api.getView().filteredOnu,46);assert.equal((ui.html().match(/data-open-pon=/g)||[]).length,16);assert(!ui.html().includes('class="svc-onu-detail"'));assert(ui.get('onuPager').hidden);assert(!html.includes('PON / trang'));assert(!uiSource.includes('ponSize'));
assert.equal((ui.get('customerSignals').innerHTML.match(/<button /g)||[]).length,2);assert(ui.get('customerSignals').innerHTML.includes('data-signal="any"'));for(const key of ['ip','data','contract'])assert(!ui.get('customerSignals').innerHTML.includes('data-signal="'+key+'"'));assert(ui.get('customerSignals').innerHTML.includes('Cần kiểm tra <b>3</b>'));assert(ui.get('customerSignals').innerHTML.includes('Cảnh báo <b>0</b>'));ui.click({warnings:''});assert(!ui.get('backendWarnings').hidden);assert(ui.get('backendWarnings').innerHTML.includes('Không có cảnh báo'));assert.equal(ui.api.getView().filteredOnu,46);ui.click({warnings:''});assert(ui.get('backendWarnings').hidden);
assert(ui.html().includes('<th scope="col">ONU chi tiết / Tổng MAC PON</th>'));assert(!ui.html().includes('Kết quả lọc'));assert.equal((ui.html().match(/<th scope="col">/g)||[]).length,5);assert(ui.html().includes('<td class="number">3 / <span class="svc-pill svc-pon-mac-total">3</span></td>'),'Source counts stay as supplied; do not infer MAC from available_onu=83');
assert.equal((ui.html().match(/class="svc-pill svc-pon-name"/g)||[]).length,16);
assert(ui.html().includes('<span class="svc-pill svc-pon-name">g0/1</span>'));
ui.click({openPon:'0'});assert(ui.html().includes('id="svc-detail-0"'));assert(ui.html().includes('<td colspan="5">'));assert(ui.html().includes('83 có sẵn'));assert.equal((ui.html().match(/data-onu-row=/g)||[]).length,3);assert(!ui.html().includes('data-onu-column="pon"'));const nestedWidths=assertBalancedOnuColumns(ui.html());assert.equal(Object.keys(nestedWidths).length,13);assert(!ui.html().includes('svc-cell-stack'));assert(!ui.html().includes('data-inner-size'));assert(!ui.html().includes('data-inner-page'));assert(ui.html().includes('<div class="svc-detail-count">3 ONU</div>'));
const firstFlatRow=ui.html().match(/<tr data-onu-row="0:0"[\s\S]*?<\/tr>/)[0];for(const c of M.columns.filter(c=>c.key!=='pon'))assert(firstFlatRow.includes('data-onu-field="'+c.key+'"'),c.key);assert.equal((firstFlatRow.match(/svc-onu-tag/g)||[]).length,3);for(const field of ['contract','onu_id','onu_ipwan'])assert(firstFlatRow.includes('data-onu-field="'+field+'"><span class="svc-pill svc-onu-tag '));assert(!firstFlatRow.includes('<small>'));assert(firstFlatRow.includes(M.contractStatus(sourceRows[0].source.net_status)));assert.equal((firstFlatRow.match(/<td /g)||[]).length,13);ui.click({openPon:'0'});assert(!ui.html().includes('class="svc-onu-detail"'));
ui.click({mode:'onu'});assert(!ui.get('onuPager').hidden);assert.equal(ui.get('pageSize').value,'50');assert.equal((ui.html().match(/data-onu-row=/g)||[]).length,46);assert(ui.get('nextPage').disabled);assert(ui.html().includes('data-onu-column="pon" style="width:88px"'));assert.equal((ui.html().match(/data-onu-column=/g)||[]).length,14);
ui.api.loadResponse(fixtures.ha58);assert.equal((ui.html().match(/data-open-pon=/g)||[]).length,32);assert(ui.get('onuPager').hidden);ui.click({openPon:'31'});assert(ui.html().includes('id="svc-detail-31"'));ui.get('nextPage').listeners.click();ui.change('pageSize','100');assert.equal((ui.html().match(/data-open-pon=/g)||[]).length,32);assert.equal(ui.api.getView().page,0);assert.equal(ui.api.getView().openPon,31);ui.click({openPon:'31'});assert(!ui.html().includes('id="svc-detail-31"'));ui.click({mode:'onu'});assert.equal(ui.get('pageSize').value,'50');assert.equal((ui.html().match(/data-onu-row=/g)||[]).length,50);ui.get('nextPage').listeners.click();assert.equal((ui.html().match(/data-onu-row=/g)||[]).length,34);assert(ui.get('nextPage').disabled);ui.click({mode:'pon'});assert.equal((ui.html().match(/data-open-pon=/g)||[]).length,32);assert(ui.get('onuPager').hidden);assert.equal(ui.get('pageInfo').textContent,'');assert.equal(ui.api.getView().page,0);ui.click({mode:'onu'});assert(!ui.get('onuPager').hidden);assert.equal((ui.html().match(/data-onu-row=/g)||[]).length,50);ui.change('pageSize','25');assert.equal((ui.html().match(/data-onu-row=/g)||[]).length,25);ui.get('nextPage').listeners.click();assert.equal((ui.html().match(/data-onu-row=/g)||[]).length,25);ui.change('pageSize','100');assert.equal((ui.html().match(/data-onu-row=/g)||[]).length,84);
ui.api.loadResponse(fixtures.gc16);ui.click({mode:'onu'});assert.equal(ui.get('pageSize').value,'50');const fullWidth=Number(ui.html().match(/--svc-onu-width:(\d+)px/)[1]);assertBalancedOnuColumns(ui.html());
ui.root.listeners.change({target:{dataset:{column:'customer'},checked:false}});assert(!ui.html().includes('data-onu-column="customer"'));assert(!ui.html().includes('data-onu-column="connection"'));assert(!ui.html().includes('data-onu-field="contract"'));assert(!ui.html().includes('data-onu-field="onu_ipwan"'));assert.equal((ui.html().match(/data-onu-column=/g)||[]).length,10);assert(Number(ui.html().match(/--svc-onu-width:(\d+)px/)[1])<fullWidth);assertBalancedOnuColumns(ui.html());ui.root.listeners.change({target:{dataset:{column:'customer'},checked:true}});
for(const group of ['identity','optics','operation','customer']){ui.root.listeners.change({target:{dataset:{column:group},checked:false}});assertBalancedOnuColumns(ui.html());}assert.equal((ui.html().match(/data-onu-column=/g)||[]).length,3);assert(!ui.html().includes('data-onu-field="onu_rx"'));for(const group of ['identity','optics','operation','customer']){ui.root.listeners.change({target:{dataset:{column:group},checked:true}});assertBalancedOnuColumns(ui.html());}assert.equal((ui.html().match(/data-onu-column=/g)||[]).length,14);
ui.input('onuSearch',sourceRows.at(-1).source.onu_sn);ui.flush();assert.equal(ui.api.getView().filteredOnu,1);assert(ui.html().includes(sourceRows.at(-1).source.onu_sn));
ui.get('resetFilters').listeners.click();ui.click({signal:'any'});assert.equal(ui.api.getView().filteredOnu,3);assert(ui.html().includes('IP WAN 0.0.0.0'));assert(!ui.get('resultStatus').hidden);assert.equal(ui.get('resultStatus').textContent,'Dịch vụ: OK');assert(ui.get('customerSignals').innerHTML.includes('aria-pressed="true"'));
ui.click({signal:'any'});assert.equal(ui.api.getView().filteredOnu,46);ui.click({mode:'pon'});ui.click({portAttention:'7'});assert.equal(ui.api.getView().scope,7);assert.equal(ui.api.getView().mode,'onu');assert(ui.html().includes('IP WAN 0.0.0.0'));ui.click({clearScope:''});assert.equal(ui.api.getView().scope,null);
assert.equal(ui.api.loadResponse({wrong:true}),false);assert.equal(ui.api.getResponse(),fixtures.gc16);assert(!ui.get('requestError').hidden);
const backendFixture={...fixtures.gc16,error:{message:'<img src=x onerror=alert(1)>'},result:{...fixtures.gc16.result,warnings:['CSOC timeout',{source:'radius',message:'Partial response'}]}};ui.api.loadResponse(backendFixture);assert(ui.get('customerSignals').innerHTML.includes('Cảnh báo <b>3</b>'));ui.click({signal:'any'});ui.click({warnings:''});assert.equal(ui.api.getView().filteredOnu,3);assert(ui.get('backendWarnings').innerHTML.includes('Lỗi:'));assert(ui.get('backendWarnings').innerHTML.includes('CSOC timeout'));assert(ui.get('backendWarnings').innerHTML.includes('Partial response'));assert(ui.get('backendWarnings').innerHTML.includes('&lt;img'));assert(!ui.get('backendWarnings').innerHTML.includes('<img'));assert(!ui.get('resultStatus').hidden);assert.equal(ui.get('resultStatus').textContent,'Dịch vụ: Chưa đủ dữ liệu');assert.strictEqual(ui.api.getResponse(),backendFixture);ui.click({warnings:''});assert(ui.get('backendWarnings').hidden);ui.api.loadResponse(fixtures.gc16);assert(ui.get('backendWarnings').hidden);assert.equal(ui.get('backendWarnings').innerHTML,'');assert(ui.get('customerSignals').innerHTML.includes('Cảnh báo <b>0</b>'));
for(const key of ['hw24','cv52','hw67']){assert(ui.api.loadResponse(fixtures[key]));for(const tab of ['overview','ports','counters','lacp','routing','multicast']){ui.get('resultTabs').listeners.click({target:{closest:()=>({dataset:{tab}})}});assert(!/undefined|NaN|\[object Object\]/.test(ui.get('checkContent').innerHTML));}}
ui.api.loadResponse(fixtures.ha58);ui.get('resultTabs').listeners.click({target:{closest:()=>({dataset:{tab:'multicast'}})}});assert(ui.get('checkContent').innerHTML.includes('NOT_OK'));assert(ui.get('checkContent').innerHTML.includes('<small>Lưu lượng multicast</small><b>Đạt</b>'));assert.strictEqual(ui.api.getResponse().result.multicast.overall_ok,true);
const multicastTab=()=>ui.get('resultTabs').listeners.click({target:{closest:()=>({dataset:{tab:'multicast'}})}});
ui.api.loadResponse(fixtures.gc16);multicastTab();let multicastHtml=ui.get('checkContent').innerHTML;assert(multicastHtml.includes('<small>Lưu lượng multicast</small>'));assert(multicastHtml.includes('<small>Đối chiếu cấu hình IGMP</small>'));assert.equal((multicastHtml.match(/class="svc-multicast-card is-ok"/g)||[]).length,2);assert.equal((multicastHtml.match(/<b>Đạt<\/b>/g)||[]).length,2);assert(!multicastHtml.split('<details')[0].includes('multicast_stream')&&!multicastHtml.split('<details')[0].includes('igmp_request')&&!multicastHtml.split('<details')[0].includes('overall_ok'));assert(!multicastHtml.includes('<table'),'No empty B1–B4 table for GCOM');
const falseMulticast={...fixtures.gc16,result:{...fixtures.gc16.result,multicast:{overall_ok:true,multicast_stream:false,igmp_request:false}}};ui.api.loadResponse(falseMulticast);multicastTab();assert.equal((ui.get('checkContent').innerHTML.match(/class="svc-multicast-card is-nok"/g)||[]).length,2);assert.equal((ui.get('checkContent').innerHTML.match(/<b>Cần kiểm tra<\/b>/g)||[]).length,2);assert(!ui.get('checkContent').innerHTML.split('<details')[0].includes('overall_ok'),'GCOM flag cards omit overall even when source supplies it');assert.strictEqual(ui.api.getResponse().result.multicast.multicast_stream,false);assert.strictEqual(ui.api.getResponse().result.multicast.overall_ok,true);
ui.api.loadResponse({...falseMulticast,result:{...falseMulticast.result,multicast:{multicast_stream:null}}});multicastTab();assert(!ui.get('checkContent').innerHTML.includes('NOK'));assert(ui.get('checkContent').innerHTML.includes('<small>Lưu lượng multicast</small><b>Chưa có dữ liệu</b>'));assert(ui.get('checkContent').innerHTML.includes('<small>Đối chiếu cấu hình IGMP</small><b>Chưa có dữ liệu</b>'));ui.api.loadResponse(fixtures.ha58);
assert.deepEqual([...ui.get('sourceStats').innerHTML.matchAll(/<small>([^<]+)<\/small>/g)].map(m=>m[1]),['Port PON','Tổng MAC (trên 32 Port PON)','IP WAN (theo tùy chọn)']);
assert.equal((ui.get('sourceStats').innerHTML.match(/class="svc-stat-card tone-/g)||[]).length,3);assert(ui.get('sourceStats').innerHTML.includes('<small>Port PON</small><b>32</b>'));assert(!ui.get('sourceStats').innerHTML.includes('<small>ONU</small>')&&!ui.get('sourceStats').innerHTML.includes('<small>SN</small>'));
const zeroCounts={...fixtures.gc16,result:{...fixtures.gc16.result,count:{device_total_ports:0,device_total_mac:0,device_returned_mac:0,device_total_sn:null,device_total_ipwan:0}}};ui.api.loadResponse(zeroCounts);assert(ui.get('sourceStats').innerHTML.includes('<small>Tổng MAC (trên 0 Port PON)</small><b>0</b>'));
const fullMacResponse={device_type:'OLT',status:true,result:{count:{device_total_ports:1,device_total_mac:64,device_returned_mac:3,device_total_sn:3,device_total_ipwan:3},ports:[{...fixtures.gc16.result.ports[0],total_mac:64,returned_mac:3,total_ipwan:3,available_onu:64,truncated:true}]}};
const fullMacBefore=JSON.stringify(fullMacResponse);ui.api.loadResponse(fullMacResponse);
assert(ui.get('sourceStats').innerHTML.includes('<small>Tổng MAC (trên 1 Port PON)</small><b>64</b>'));
assert(ui.get('sourceStats').innerHTML.includes('<small>IP WAN (theo tùy chọn)</small><b>3</b>'));
assert(ui.html().includes('ONU chi tiết / Tổng MAC PON')&&ui.html().includes('<td class="number">3 / <span class="svc-pill svc-pon-mac-total">64</span></td>'));
assert(!ui.html().includes('MAC / SN / IP WAN'));
ui.click({openPon:'0'});assert.equal((ui.html().match(/data-onu-row=/g)||[]).length,3);
assert.equal(JSON.stringify(fullMacResponse),fullMacBefore);ui.api.loadResponse(fixtures.gc16);
const optionResponse={...fixtures.gc16,result:{...fixtures.gc16.result,options:{mac_limit:3,multicast_check:true,multicast_only:false,online_source:'isc_ipwan_by_mac',onuMac:true,onuModel:false,onuOltDistance:false,onuRx:true,onuSn:true,onuTemp:false,onuTx:false,sampling_policy:'cdp_act_then_olt_mac'}}};
const optionsBefore=JSON.stringify(optionResponse);ui.api.loadResponse(optionResponse);
assert(!ui.get('runOptions').hidden);
assert(ui.get('resultSummary').className.includes('has-options'),'Options form the fourth summary block');
assert.deepEqual([...ui.get('runOptionsContent').innerHTML.matchAll(/<dt>([^<]+)<\/dt>/g)].map(m=>m[1]),['Số mẫu','Check Multicast','Thông tin ONU']);
assert(ui.get('runOptionsContent').innerHTML.includes('<dd>Kiểm tra 3 MAC/Port PON</dd>'));
assert(ui.get('runOptionsContent').innerHTML.includes('<dd>Bật</dd>'));
assert(ui.get('runOptionsContent').innerHTML.includes('<dd>MAC · SN · Công suất thu</dd>'));
for(const hidden of ['online_source','sampling_policy','isc_ipwan_by_mac','cdp_act_then_olt_mac','Model','Công suất phát','Nhiệt độ','Khoảng cách'])assert(!ui.get('runOptionsContent').innerHTML.includes(hidden));
assert(ui.html().includes('<th scope="col">IP WAN (theo tùy chọn)</th>'));
assert(html.indexOf('id="sourceStats"')<html.indexOf('id="runOptions"')&&html.indexOf('id="runOptions"')<html.indexOf('id="resultTabs"'),'Options share the summary row after the three statistics');
ui.api.loadResponse({...optionResponse,result:{...optionResponse.result,options:{...optionResponse.result.options,mac_limit:null,multicast_check:false}}});
assert(ui.get('runOptionsContent').innerHTML.includes('Kiểm tra toàn bộ MAC/Port PON'));
assert(ui.get('runOptionsContent').innerHTML.includes('<dd>Tắt</dd>'));
ui.api.loadResponse({...optionResponse,result:{...optionResponse.result,mode:'multicast_only',options:{...optionResponse.result.options,multicast_only:true}}});
assert(ui.get('runOptionsContent').innerHTML.includes('Chỉ kiểm tra multicast'));
assert(!ui.get('runOptionsContent').innerHTML.includes('MAC/Port PON')&&!ui.get('runOptionsContent').innerHTML.includes('Thông tin ONU'));
ui.api.loadResponse({...optionResponse,result:{...optionResponse.result,options:undefined}});assert(ui.get('runOptions').hidden);assert.equal(ui.get('runOptionsContent').innerHTML,'');assert(!ui.get('resultSummary').className.includes('has-options'));
ui.api.loadResponse({...optionResponse,result:{...optionResponse.result,options:{online_source:'<img src=x>',mac_limit:'<img src=x>',onuMac:'true'}}});assert(ui.get('runOptions').hidden,'Do not invent options or render arbitrary source values');
ui.api.loadResponse(fixtures.hw24);assert(ui.get('runOptions').hidden);assert.equal(ui.get('runOptionsContent').innerHTML,'');
ui.api.loadResponse(optionResponse);ui.api.clear();assert(ui.get('runOptions').hidden);assert.equal(ui.get('runOptionsContent').innerHTML,'');
assert.equal(JSON.stringify(optionResponse),optionsBefore,'Option summary preserves the response and original JSON export');
ui.api.loadResponse(fixtures.gc16);
assert(/class="svc-device-title"><h2 id="deviceName"><\/h2><span id="deviceKind" class="svc-pill svc-device-type"><\/span><\/div>/.test(html),'Device type tag follows the hostname in the same title row');
ui.api.loadResponse({device_type:'OLT',status:false,error:'timeout',message:'Timed out',result:null});assert(!ui.get('resultStatus').hidden,'A failed collection remains visible');
ui.api.loadResponse(fixtures.hw24);assert(!ui.get('resultStatus').hidden,'Switch assessment remains visible');
ui.api.loadResponse(fixtures.gc16);assert(!ui.get('resultStatus').hidden&&ui.get('resultStatus').textContent==='Dịch vụ: OK','Switch status cannot leak into the next OLT title');
const css=fs.readFileSync(path.join(base,'service-checking.css'),'utf8');assert(html.includes('id="resultSummary" class="svc-result-summary"'));assert(css.includes('.svc-result-layout{display:grid;grid-template-columns:minmax(0,1fr);'));assert(css.includes('.svc-result-summary.has-options{grid-template-columns:minmax(0,3fr) minmax(360px,2fr)}'));assert(css.includes('.svc-run-options dl{display:grid;grid-template-columns:90px minmax(0,1fr);'));assert(css.includes('.svc-detail-section>.svc-tabs button{padding:8px 12px;border:1px solid var(--na-line);'));assert(css.includes('.svc-detail-section>.svc-tabs button[aria-selected=true]{border-color:#6e9ee7;'));assert(css.includes('.svc-multicast-card.is-ok{border-color:#a5dec6;background:var(--na-green-soft)'));assert(css.includes('.svc-multicast-card.is-nok{border-color:#f0c59e;background:var(--na-orange-soft)'));
assert(css.includes('.svc-port-state.is-up{color:#fff;background:#087f5b;'));assert(css.includes('.svc-port-state.is-down{color:#fff;background:#bd4b00;'));assert(css.includes('.svc-tab-dot{display:inline-grid;place-items:center;width:17px;height:17px;'));assert(css.includes('.svc-tab-dot.fail{color:#fff;background:#c4324b;'));assert(css.includes('.svc-topology-tag.is-star{color:#fff;background:#087f5b;'));assert(css.includes('.svc-topology-tag.is-sep{'));assert(css.includes('.svc-topology-tag.is-ospf{'));assert(css.includes('.svc-multicast-facts>div{'));
// Diagnostics are removed for every role; old tab actions must be ignored.
for(const payload of [...Object.values(fixtures),diResponseForTest(),{device_type:'SWITCH',status:false,result:null}]){
  ui.api.loadResponse(payload);
  assert(!ui.get('resultTabs').innerHTML.includes('diagnostics')&&!ui.get('resultTabs').innerHTML.includes('Chẩn đoán'));
  const previous=ui.get('checkContent').innerHTML,active=ui.api.getView().tab;
  ui.get('resultTabs').listeners.click({target:{closest:()=>({dataset:{tab:'diagnostics'}})}});
  assert.equal(ui.api.getView().tab,active);assert.equal(ui.get('checkContent').innerHTML,previous);
}
function diResponseForTest(){return {device_type:'SWITCH_DI',status:false,result:null,message:'Chưa triển khai'};}
assert(!uiSource.includes('diagnosticFact')&&!css.includes('svc-diagnostic-card'));
assert(html.includes('id="exportJson"'),'Original JSON export remains available');
ui.api.loadResponse({device_type:'OLT',status:false,error:'timeout',message:'Timed out',result:null});
assert.equal(ui.get('resultStatus').textContent,'Dịch vụ: Chưa đủ dữ liệu');
assert(ui.get('resultMessage').innerHTML.includes('Timed out')&&ui.get('resultMessage').innerHTML.includes('timeout'));
ui.api.clear();assert(ui.get('resultSection').hidden);assert(!ui.get('resultEmpty').hidden);assert.equal(ui.html(),'');
const missingMetrics={device_type:'OLT',status:true,result:{ports:[{port:'g0/zero',available_onu:1,total_mac:0,onu_data:[{...sourceRows[0].source,onu_rx:0,onu_tx:null,onu_temp:0,onu_olt_distance:null,onu_mac:null}]}]}};ui.api.loadResponse(missingMetrics);ui.click({openPon:'0'});for(const [key,value] of Object.entries({onu_rx:'0',onu_tx:'—',onu_temp:'0',onu_olt_distance:'—',onu_mac:'—'}))assert(ui.html().includes('data-onu-field="'+key+'">'+value+'</td>'),key);

// Test-only stress input: never saved as fixture or shown as real device data.
const stress={device_type:'OLT',status:true,result:{nameDev:'TEST-ONLY',ports:Array.from({length:200},(_,p)=>({port:'PON '+p,admin_stt:'UP',oper_stt:'UP',onu_data:Array.from({length:250},(_,i)=>({onu_id:p+'/'+i,onu_sn:'STRESS-'+p+'-'+i,onu_mac:null,onu_model:'TEST',contract:'TEST-'+p+'-'+i,drop_point:'TEST',net_status:'Binh thuong',onu_ipwan:'192.0.2.1',onu_rx:0,onu_tx:0,onu_temp:0,onu_olt_distance:0}))}))}};
const started=performance.now(),large=M.index(stress);assert.equal(large.rows.length,50000);assert.equal(M.filter(large,{query:'STRESS-199-249'}).rows.length,1);ui.api.loadResponse(stress,'Test only');assert.equal((ui.html().match(/data-open-pon=/g)||[]).length,200);assert(ui.get('onuPager').hidden);ui.click({openPon:'199'});assert(ui.html().includes('id="svc-detail-199"'));assert.equal((ui.html().match(/data-onu-row=/g)||[]).length,25);ui.click({openPon:'0'});assert(!ui.html().includes('id="svc-detail-199"'));assert.equal((ui.html().match(/data-onu-row=/g)||[]).length,25);ui.click({mode:'onu'});assert.equal((ui.html().match(/data-onu-row=/g)||[]).length,50);assert(ui.html().length<150000);ui.get('nextPage').listeners.click();assert.equal((ui.html().match(/data-onu-row=/g)||[]).length,50);ui.input('onuSearch','STRESS-199-249');ui.flush();assert.equal(ui.api.getView().filteredOnu,1);assert(ui.html().includes('STRESS-199-249'));ui.click({mode:'pon'});assert.equal((ui.html().match(/data-open-pon=/g)||[]).length,1);assert(ui.get('onuPager').hidden);ui.get('resetFilters').listeners.click();assert.equal((ui.html().match(/data-open-pon=/g)||[]).length,200);
ui.api.loadResponse(stress,'Test only');ui.click({openPon:'0'});assert(ui.html().includes('data-inner-size'));ui.click({innerPage:'1'});assert(ui.html().includes('data-onu-row="0:25"'));ui.root.listeners.change({target:{dataset:{innerSize:''},value:'100'}});assert.equal((ui.html().match(/data-onu-row=/g)||[]).length,100);ui.root.listeners.change({target:{dataset:{innerSize:''},value:'25'}});assert.equal((ui.html().match(/data-onu-row=/g)||[]).length,25);
const singleLargePage={...stress,result:{...stress.result,ports:[{...stress.result.ports[0],onu_data:stress.result.ports[0].onu_data.slice(0,60)}]}};ui.api.loadResponse(singleLargePage,'Test only');ui.click({openPon:'0'});ui.root.listeners.change({target:{dataset:{innerSize:''},value:'100'}});assert.equal((ui.html().match(/data-onu-row=/g)||[]).length,60);assert(ui.html().includes('data-inner-size'));assert(!ui.html().includes('data-inner-page'));ui.root.listeners.change({target:{dataset:{innerSize:''},value:'25'}});assert.equal((ui.html().match(/data-onu-row=/g)||[]).length,25);assert(ui.html().includes('data-inner-page'));
assert.equal(JSON.stringify(fixtures),original,'All user responses remain unchanged');assert(!/fetch\(|XMLHttpRequest|WebSocket/.test(uiSource),'No device/API traffic');assert(html.includes('../shared/netauto-shell.css'));assert(fs.readFileSync(path.join(base,'service-checking.css'),'utf8').includes('prefers-reduced-motion'));
assert(M.validate({device_type:'SWITCH_CE',status:false,result:{checks:{optical_power:{ports:[null]}}}}));
assert(M.validate({device_type:'OLT',status:true,result:{multicast:{checks:{b1:null}}}}));
assert(M.validate({device_type:'OLT',status:true,result:{ports:[{port:'PON',onu_data:[{contract:{bad:true}}]}]}}));
const shell=fs.readFileSync(path.resolve(base,'../index.html'),'utf8'),app=fs.readFileSync(path.resolve(base,'../shared/netauto-app.js'),'utf8');assert(shell.includes('data-business-page="service"'));assert(app.includes("if (workflow === 'service') return 'service_checking/mockup.html'"));
const resources=[...html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css))"/g)].map(m=>m[1]);for(const file of resources)assert(fs.existsSync(path.resolve(base,file)),file);
console.log('PASS: 5 current real responses; 130 ONU; whole-response search/filter, source counts/status, cached immutable index, PON open/close, nested/flat pagination, issue scopes, CSV safety, CE/OLT checks, safe import, clear state and keyboard-ready controls.');
assert(css.includes('.svc-pon-table>thead>tr>th:not(:first-child),.svc-pon-table>tbody>tr:not(.svc-detail-row)>td:not(:first-child){text-align:center}'));assert(css.includes('.svc-pon-table>thead>tr>th,.svc-onu-table th{font-size:12px'));assert(css.includes('min-width:var(--svc-onu-width,1700px)'));assert(css.includes('left:var(--svc-pon-width,88px)'));assert(css.includes('.svc-onu-detail .svc-onu-table .svc-sticky-onu{left:0}'));
assert(!/\.svc-pon-table\s+th\b/.test(css),'PON descendant th selectors must never align or resize headers in the nested ONU table');for(const nth of ['first-child','nth-child(2)','nth-child(3)','nth-child(4)','nth-child(5)'])assert(css.includes('.svc-pon-table>thead>tr>th:'+nth+'{width:'),'Direct PON header sizing: '+nth);assert(css.includes('.svc-onu-flat th,.svc-onu-flat td{text-align:center;'));


console.log('PASS: full 16/32 PON without pagination, uncapped 200-PON test-only response, mode switching, filter/reset and last-PON open/close.');
assert(nestedWidths.drop_point>=150&&nestedWidths.onu_mac>=148&&nestedWidths.onu_model>=136,'Identifiers receive usable space instead of squeezing between numeric cells');
assert(css.includes('.svc-onu-flat .svc-col-drop_point{white-space:nowrap;'),'Drop-point names stay intact');
assert(css.includes('.svc-onu-flat td{height:40px}')&&css.includes('padding:8px 10px;font-size:12px'),'Compact rows retain readable text');
const responsiveUI=harness({},1600);responsiveUI.click({openPon:'0'});
assert.equal(responsiveUI.layout().width,'1600px');assert.equal(responsiveUI.layout().columns.onu_rx,66);assert.equal(responsiveUI.layout().columns.onu_id,96);
responsiveUI.resize(1920);assert.equal(responsiveUI.layout().width,'1920px');assert.equal(responsiveUI.layout().columns.onu_rx,66);assert(responsiveUI.layout().columns.drop_point>152);
responsiveUI.resize(640);assert.equal(responsiveUI.layout().width,'1468px','Narrow containers scroll instead of compressing identifiers');
responsiveUI.root.listeners.change({target:{dataset:{column:'customer'},checked:false}});assert(!Object.hasOwn(responsiveUI.layout().columns,'drop_point'));
responsiveUI.resize(1600);assert.equal(responsiveUI.layout().width,'1600px');
// At 80% zoom one physical pixel can report 1.25 CSS px: repeated notifications
// must not cause alternating column writes or schedule endless frames.
const settled=responsiveUI.layout().writes;
for(let i=0;i<60;i++)responsiveUI.resize(i%2?1601.25:1599.5);
assert.equal(responsiveUI.layout().writes,settled,'Fractional zoom jitter does not rewrite table/column widths');
assert.equal(responsiveUI.layout().frames,0,'Height-only and tiny width notifications schedule no work');
responsiveUI.resize(1750,true);responsiveUI.resize(1800,true);responsiveUI.resize(1900.75,true);
assert.equal(responsiveUI.layout().frames,1,'A resize burst is batched into one paint');
assert.equal(responsiveUI.layout().width,'1600px','Observer callback does not write layout synchronously');
responsiveUI.flushFrames();assert.equal(responsiveUI.layout().width,'1900px','Only the final content-box width is applied');
responsiveUI.resize(1901.25);assert.equal(responsiveUI.layout().width,'1900px');
responsiveUI.resize(1904);assert.equal(responsiveUI.layout().width,'1904px','Small real resize accumulates beyond tolerance');
responsiveUI.resize(2000,true);assert.equal(responsiveUI.layout().frames,1);
responsiveUI.api.loadResponse(fixtures.hw24);assert.equal(responsiveUI.layout().frames,0);assert(!responsiveUI.layout().observed,'Leaving ONU workspace disconnects sizing');
responsiveUI.flushFrames();assert.equal(responsiveUI.layout().width,'1904px','Cancelled updates cannot alter a previous table');
responsiveUI.api.loadResponse(fixtures.gc16);responsiveUI.click({openPon:'0'});responsiveUI.resize(2100,true);
responsiveUI.api.clear();assert(!responsiveUI.layout().observed,'Clear releases the resize observer');
assert.equal(responsiveUI.layout().frames,0,'Clear cancels pending layout writes');
assert(css.includes('.svc-table-scroll[data-onu-layout]{contain:inline-size;min-width:0;overflow-y:hidden}'));
console.log('PASS: test-only 50,000 ONU stress, full PON table / 25 nested or 50 flat ONU, last-row search; '+Math.round(performance.now()-started)+' ms total stress checks.');
console.log('PASS: 5-column PON table, source total_mac, flat ONU fields, distinct contract/index/IP tags, single-page compact footer, hidden-group geometry and 50-row default/reset/pagination.');
// New role/topology metadata is optional; never infer Ring/Star or invent device results.
assert.equal(M.deviceContext(fixtures.hw24).role,'CE');assert.equal(M.deviceContext(fixtures.hw24).topology,null);
const inventory={function:'Switch CE',topology:{type:'Ring'},nameDev:'INVENTORY-CE',ipDev:'192.0.2.20'},inventoryBefore=JSON.stringify(inventory);
ui.api.loadResponse(fixtures.hw24,'Test only',inventory);assert(ui.get('deviceMeta').textContent.includes('Ring'));assert.equal(ui.get('resultSection').dataset.kind,'ce');
assert.equal((ui.get('checkContent').innerHTML.match(/data-check-tab=/g)||[]).length,9,'Switch summary exposes real check categories plus the explicit Topo card');
ui.click({checkTab:'lacp'});assert.equal(ui.api.getView().tab,'lacp');assert(ui.get('checkContent').innerHTML.includes('Aggregation'));
ui.api.loadResponse(fixtures.hw24,'Test only',{topology:'Star'});assert(ui.get('deviceMeta').textContent.includes('Star'));
ui.api.loadResponse(fixtures.hw24);assert(!ui.get('deviceMeta').textContent.includes('Star')&&!ui.get('deviceMeta').textContent.includes('Ring'),'Topology metadata cannot leak into another result');
const diResponse={status:false,device_type:'SWITCH_DI',message:'Chức năng kiểm tra dịch vụ cho Switch DI chưa được triển khai.',error:null,result:null};
assert.equal(M.validate(diResponse),null);ui.api.loadResponse(diResponse,'Test only',{nameDev:'TEST-DI',topology:'Ring'});
assert.equal(ui.get('deviceName').textContent,'TEST-DI');assert.equal(ui.get('deviceKind').textContent,'Switch DI');assert.equal(ui.get('resultStatus').textContent,'Dịch vụ: Chưa đủ dữ liệu');
assert(!ui.get('resultTabs').innerHTML.includes('svc-tab-counters'));assert(!ui.get('checkContent').innerHTML.includes('data-check-tab='),'An unsupported role must not show passing CE checks');
const v2Response=JSON.parse(JSON.stringify(fixtures.hw24));v2Response.result.model='HW61';v2Response.result.profile='huawei_v2';
const v2Counters=v2Response.result.checks.counters;v2Counters.checked_metrics=['CRC','OutDiscards'];v2Counters.not_checked_metrics=['InDiscards'];
for(const p of v2Counters.ports){delete p.in_discard;p.crc=[6,6,6];p.out_discard=[11,11,11];p.not_checked_metrics=['InDiscards'];}
const v2Before=JSON.stringify(v2Response);ui.api.loadResponse(v2Response,'Test only');ui.click({checkTab:'counters'});
assert(ui.get('checkContent').innerHTML.includes('Không kiểm tra'));assert(ui.get('checkContent').innerHTML.includes('6 → 6 → 6'));assert(ui.get('checkContent').innerHTML.includes('11 → 11 → 11'));
assert.equal(JSON.stringify(v2Response),v2Before,'New checked/not-checked metric projection does not alter samples');
const unsafeContext={topology:'<img src=x onerror=alert(1)>'};ui.api.loadResponse(fixtures.hw24,'Test only',unsafeContext);assert(!ui.get('deviceMeta').textContent.includes('<img'),'Unknown topology is omitted from basic device information');
const unsafeSkip=JSON.parse(JSON.stringify(fixtures.hw24));unsafeSkip.result.checks.optical_power.skipped=true;unsafeSkip.result.checks.optical_power.skip_reason='<img src=x>';
ui.api.loadResponse(unsafeSkip,'Test only');assert(!ui.get('checkContent').innerHTML.includes('<img'));assert(ui.get('checkContent').innerHTML.includes('&lt;img'));
ui.api.loadResponse(fixtures.gc16);assert.equal(ui.api.getView().openPon,null);assert(!ui.html().includes('data-onu-row='),'ONU rows are not rendered until a PON is explicitly opened');
ui.click({openPon:'0'});assert(ui.html().includes('data-onu-row='));ui.api.loadResponse(fixtures.ha58);assert.equal(ui.api.getView().openPon,null);assert(!ui.html().includes('data-onu-row='));
assert.equal(JSON.stringify(fixtures),original);assert.equal(JSON.stringify(inventory),inventoryBefore);ui.api.clear();assert.equal(ui.get('checkContent').innerHTML,'');assert(!html.includes('id="serviceContext"')&&!html.includes('id="requestOptions"'),'Removed panels do not occupy the result layout');
console.log('PASS: role-aware OLT/CE/DI workspace, explicit Ring/Star metadata, check-card navigation, Huawei v2 metric omission, neutral unsupported roles, escaped metadata and collapsed ONU groups after device changes.');
// Pasted payloads follow the same renderer, without executing JavaScript or replacing valid data on error.
assert.strictEqual(M.parsePayload(fixtures.gc16),fixtures.gc16,'Programmatic object input preserves the original object');
assert.deepEqual(M.parsePayload('\ufeff```json\n'+JSON.stringify(fixtures.gc16)+'\n```'),fixtures.gc16);
for(const invalid of ['', '{broken', 'null', '[]', '{status:true}', '(()=>{throw Error("must not execute")})()'])assert.throws(()=>M.parsePayload(invalid));
assert.throws(()=>M.parsePayload(' '.repeat(20*1024*1024+1)),/20 MB/);
ui.api.loadResponse(fixtures.gc16);ui.get('openPayload').listeners.click();assert(ui.get('payloadDialog').open);
ui.get('payloadInput').value='{broken';ui.get('payloadForm').listeners.submit({preventDefault(){}});assert.strictEqual(ui.api.getResponse(),fixtures.gc16);assert(ui.get('payloadDialog').open&&!ui.get('payloadError').hidden);
ui.get('payloadInput').value=JSON.stringify({status:true,device_type:'OLT',result:{ports:'bad'}});ui.get('payloadForm').listeners.submit({preventDefault(){}});assert.strictEqual(ui.api.getResponse(),fixtures.gc16);
ui.get('payloadInput').value=JSON.stringify(fixtures.hw24);ui.get('payloadForm').listeners.submit({preventDefault(){}});assert.equal(ui.api.getResponse().result.nameDev,fixtures.hw24.result.nameDev);assert.equal(ui.api.getView().tab,'overview');assert(!ui.get('payloadDialog').open);assert.equal(ui.get('payloadInput').value,'','The editor releases pasted customer data after closing');
ui.get('openPayload').listeners.click();ui.get('payloadInput').value=JSON.stringify(fixtures.gc16);ui.get('payloadInput').listeners.keydown({ctrlKey:true,key:'Enter',preventDefault(){}});assert.equal(ui.api.getView().tab,'onu');assert.equal(ui.api.getView().openPon,null);assert(!ui.html().includes('data-onu-row='));
const pasted=ui.api.getResponse();ui.get('openPayload').listeners.click();ui.get('payloadInput').value=JSON.stringify(fixtures.hw67);ui.get('cancelPayload').listeners.click();assert.strictEqual(ui.api.getResponse(),pasted,'Cancel does not load the editor contents');assert.equal(ui.get('payloadInput').value,'');
assert.equal(ui.api.loadPayload(fixtures.cv52),true);assert.strictEqual(ui.api.getResponse(),fixtures.cv52);assert.equal(ui.api.loadPayload('invalid'),false);assert.strictEqual(ui.api.getResponse(),fixtures.cv52);
console.log('PASS: direct JSON/object import, fenced JSON, inline parse/schema errors, payload size limit, modal submit/cancel, keyboard submit and collapsed PON rendering.');
const prod=harness({mockupTools:false});
assert.equal(prod.api.getResponse(),null,'Production mode never seeds a sample response');assert(prod.get('resultSection').hidden);
for(const id of ['mockupTools','payloadDialog'])assert(prod.get(id).hidden,'Hide mockup-only control: '+id);
prod.change('sampleSelect','gc16');assert.equal(prod.api.getResponse(),null);prod.get('openPayload').listeners.click();assert.equal(prod.get('payloadDialog').open,false);
assert.equal(prod.api.loadResponse(fixtures.hw24,'Kết quả API'),true);assert.strictEqual(prod.api.getResponse(),fixtures.hw24);assert(!prod.get('resultSection').hidden);assert.equal(prod.get('deviceKind').textContent,'Switch CE');assert(prod.get('checkContent').innerHTML.includes('data-check-tab='));assert(!prod.get('deviceMeta').textContent.includes('Kết quả API'),'Mockup source labels stay out of production device information');
prod.click({checkTab:'counters'});assert.equal(prod.api.getView().tab,'counters');prod.api.loadResponse(fixtures.gc16);assert.equal(prod.api.getView().openPon,null);prod.click({openPon:'0'});assert(prod.html().includes('data-onu-row='));
assert(html.indexOf('class="svc-summary-section"')<html.indexOf('class="svc-detail-section"'),'Device information precedes the full-width results');
console.log('PASS: production integration hides mockup controls, starts without samples, and keeps API-driven tabs/ONU rendering working.');

// Test-only Switch cases: a failed SEP check must be visible beyond a message.
const switchUI=harness({mockupTools:false}),sepFailure=JSON.parse(JSON.stringify(fixtures.hw24));
for(const check of Object.values(sepFailure.result.checks))check.status=true;
sepFailure.status=false;sepFailure.message='Kiểm tra dịch vụ Switch CE không đạt: sep.';
sepFailure.result.topology={type:'unknown',status:false};
sepFailure.result.checks.sep={status:false,reason:'unable_to_detect_topology',segment_count:0,local_segment_count:0,expected_pim_count:null,segments:[],expected:'Đọc được mô hình và các segment SEP của thiết bị'};
sepFailure.result.failures=[{check:'sep',scope:'device',expected:'Có dữ liệu SEP hợp lệ',observed:sepFailure.result.checks.sep,command:'display sep topology'}];
const sepBefore=JSON.stringify(sepFailure);switchUI.api.loadResponse(sepFailure);
assert(!switchUI.get('switchAttention').hidden);
assert(switchUI.get('switchAttention').innerHTML.includes('Topo'));
assert(switchUI.get('switchAttention').innerHTML.includes('Chưa xác định được mô hình kết nối từ dữ liệu SEP/PIM'));
assert(/id="svc-tab-topology"[^>]*><span class="svc-tab-dot fail"/.test(switchUI.get('resultTabs').innerHTML));
assert(switchUI.get('checkContent').innerHTML.includes('class="svc-assessment is-fail" data-check-tab="topology" data-check-key="sep"'));
assert(switchUI.get('checkContent').innerHTML.includes('<span class="svc-pill fail">Cần kiểm tra</span>'));
switchUI.click({checkTab:'topology',checkKey:'sep'});assert.equal(switchUI.api.getView().tab,'topology');
assert(switchUI.get('checkContent').innerHTML.includes('Chưa có dữ liệu segment SEP để hiển thị'));
assert(switchUI.get('checkContent').innerHTML.includes('display sep topology'));
assert(switchUI.get('checkContent').innerHTML.includes('Chưa xác định'));
switchUI.click({checkTab:'ports'});
assert(switchUI.get('checkContent').innerHTML.includes('svc-switch-ports'));
assert(switchUI.get('checkContent').innerHTML.includes('Ngưỡng công suất (dBm)'));
assert(switchUI.get('checkContent').innerHTML.includes('svc-port-state is-up'));
assert(!switchUI.get('checkContent').innerHTML.includes('UP / UP'));
assert(switchUI.get('checkContent').innerHTML.includes('svc-optical-range'));
assert(!switchUI.get('checkContent').innerHTML.includes('<small>—</small>'),'Passing rows have no empty reason under the result');
assert(!switchUI.get('checkContent').innerHTML.includes('svc-row-needs-review'),'SEP failure cannot mark passing optics as failed');
switchUI.click({checkTab:'routing'});
assert(switchUI.get('checkContent').innerHTML.includes('svc-routing-facts'));
assert(switchUI.get('checkContent').innerHTML.includes('Management default')&&!switchUI.get('checkContent').innerHTML.includes('Management default · Next-hop'));
assert(switchUI.get('checkContent').innerHTML.includes('Route PIM')&&!switchUI.get('checkContent').innerHTML.includes('Route PIM khớp / Yêu cầu'));
assert(switchUI.get('checkContent').innerHTML.includes('svc-route-prefix')&&switchUI.get('checkContent').innerHTML.includes('svc-route-mask'));
assert(switchUI.get('checkContent').innerHTML.includes('>/23</strong>')||switchUI.get('checkContent').innerHTML.includes('>/24</strong>'));
switchUI.click({checkTab:'multicast'});
assert(switchUI.get('checkContent').innerHTML.includes('svc-switch-multicast'));
assert(switchUI.get('checkContent').innerHTML.includes('svc-multicast-facts'));
assert(switchUI.get('checkContent').innerHTML.includes('svc-l2-multicast'));
switchUI.click({checkTab:'lacp'});
assert(!switchUI.get('checkContent').innerHTML.includes('<small>—</small>'),'Passing LACP has no empty result annotation');
assert.equal(JSON.stringify(sepFailure),sepBefore,'Switch rendering never alters a failed backend result');

const opticalFailure=JSON.parse(JSON.stringify(sepFailure));
opticalFailure.result.checks.sep={status:true,skipped:true,skip_reason:'not_ring_sep'};
opticalFailure.result.topology={type:'star',status:true};
opticalFailure.result.checks.interface_status={status:true,ports:Array.from({length:30},(_,i)=>({port:'XGigabitEthernet0/0/'+(i+1),admin_status:'UP',oper_status:'UP',description:'TEST'}))};
opticalFailure.result.checks.optical_power={status:false,ports:opticalFailure.result.checks.interface_status.ports.map((p,i)=>({port:p.port,rx:i===0?0:i>=26&&i<=27?-12:-3,low_alarm_threshold:-10,high_alarm_threshold:0,status:!(i>=26&&i<=27),reason:i>=26&&i<=27?'rx_outside_thresholds':null}))};
opticalFailure.result.failures=[26,27].map(i=>({check:'optical_power',scope:opticalFailure.result.checks.interface_status.ports[i].port,observed:{reason:'rx_outside_thresholds'},expected:'RX trong ngưỡng'}));
switchUI.api.loadResponse(opticalFailure);
assert(switchUI.get('sourceStats').innerHTML.includes('<small>Hạng mục không đạt</small><b>1</b>'),'Two failing Ports are one failed category');
assert(switchUI.get('checkContent').innerHTML.includes('class="svc-assessment is-good" data-check-tab="topology" data-check-key="sep"'));
assert(switchUI.get('checkContent').innerHTML.includes('<span class="svc-assessment-title">Topo</span><span class="svc-pill svc-topology-tag is-star">Star</span>'));
assert(switchUI.get('checkContent').innerHTML.includes('Đã xác định mô hình Star'));
assert(/id="svc-tab-topology"[^>]*><span class="svc-tab-dot good"[^>]*>✓<\/span>Topo/.test(switchUI.get('resultTabs').innerHTML),'Star topology remains a passing check even when SEP is not applicable');
assert(!switchUI.get('resultTabs').innerHTML.includes('>–</span>'),'Tabs no longer use a dash for skipped checks');
switchUI.click({checkTab:'topology'});
assert(switchUI.get('checkContent').innerHTML.includes('<h2>Topo <span class="svc-pill good">Đạt</span></h2>'));
assert(switchUI.get('checkContent').innerHTML.includes('svc-topology-tag is-star')&&switchUI.get('checkContent').innerHTML.includes('>Star</span>'));
switchUI.click({checkTab:'ports',checkKey:'optical_power'});
assert(switchUI.get('checkPageInfo').textContent.includes('Trang 2/2'),'Problem navigation opens the first failing Port page');
assert(switchUI.get('checkContent').innerHTML.includes('XGigabitEthernet0/0/27'));
assert.equal((switchUI.get('checkContent').innerHTML.match(/<tr class="svc-row-needs-review">/g)||[]).length,2);
assert(switchUI.get('checkContent').innerHTML.includes('RX nằm ngoài ngưỡng công suất'));
switchUI.click({checkTab:'ports'});assert(switchUI.get('checkContent').innerHTML.includes('<td class="number">0</td>'),'RX zero is preserved');

const ring=JSON.parse(JSON.stringify(sepFailure));ring.status=true;ring.result.failures=[];ring.result.topology={type:'ring_sep',status:true};
ring.result.checks.sep={status:true,segment_count:1,local_segment_count:1,expected_pim_count:0,segments:[{segment:10,status:true,reasons:[],directions:[{local:{port:'XGigabitEthernet0/0/1',role:'primary',state:'discarding'},adjacent:[{port:'XGigabitEthernet0/0/2',role:'secondary',state:'forwarding'}],contribution:0}]}]};
ring.result.checks.pim_neighbors.count=0;
switchUI.api.loadResponse(ring);
assert(switchUI.get('checkContent').innerHTML.includes('<span class="svc-assessment-title">Topo</span><span class="svc-pill svc-topology-tag is-sep">SEP</span>'));
switchUI.click({checkTab:'topology'});
assert(switchUI.get('checkContent').innerHTML.includes('svc-topology-tag is-sep'));
assert(switchUI.get('checkContent').innerHTML.includes('>SEP</span>'));
assert(switchUI.get('checkContent').innerHTML.includes('primary · discarding'));
assert(switchUI.get('checkContent').innerHTML.includes('<td class="number">0</td>'),'SEP contribution zero must not be treated as missing or failed');
assert(!switchUI.get('checkContent').innerHTML.includes('svc-row-needs-review'));

const ospf=JSON.parse(JSON.stringify(ring));ospf.result.topology={type:'ospf',status:true};
switchUI.api.loadResponse(ospf);
assert(switchUI.get('checkContent').innerHTML.includes('<span class="svc-assessment-title">Topo</span><span class="svc-pill svc-topology-tag is-ospf">OSPF</span>'));
switchUI.click({checkTab:'topology'});
assert(switchUI.get('checkContent').innerHTML.includes('svc-topology-tag is-ospf')&&switchUI.get('checkContent').innerHTML.includes('>OSPF</span>'));

const skippedSep=JSON.parse(JSON.stringify(opticalFailure));skippedSep.status=true;skippedSep.result.failures=[];skippedSep.result.checks.optical_power.status=true;skippedSep.result.checks.l2_multicast={status:false,optional:true,vlan:99,total_groups:0};
for(const port of skippedSep.result.checks.optical_power.ports){port.status=true;port.reason=null;}
switchUI.api.loadResponse(skippedSep);
assert(switchUI.get('switchAttention').innerHTML.includes('is-optional'));
assert(switchUI.get('switchAttention').className.includes('is-optional-only'));
assert(!switchUI.get('switchAttention').innerHTML.includes('data-check-key="sep"'),'Skipped SEP is not a failed category');
assert(switchUI.get('sourceStats').innerHTML.includes('<small>Hạng mục không đạt</small><b>0</b>'));
assert.equal(switchUI.get('resultStatus').textContent,'Dịch vụ: OK','Optional failure cannot overwrite backend success');

const unknownCheck=JSON.parse(JSON.stringify(sepFailure));delete unknownCheck.result.checks.sep;
unknownCheck.result.checks.custom_check={status:false,reason:'TEST <img src=x onerror=alert(1)>'};
unknownCheck.result.failures=[{check:'custom_check',scope:'device',observed:unknownCheck.result.checks.custom_check}];
switchUI.api.loadResponse(unknownCheck);assert(switchUI.get('resultTabs').innerHTML.includes('Kiểm tra khác'));
assert(switchUI.get('switchAttention').innerHTML.includes('&lt;img')&&!switchUI.get('switchAttention').innerHTML.includes('<img'));
switchUI.click({checkTab:'other',checkKey:'custom_check'});
assert(switchUI.get('checkContent').innerHTML.includes('custom check')&&!switchUI.get('checkContent').innerHTML.includes('<img'));

switchUI.api.loadResponse(fixtures.cv52);switchUI.click({checkTab:'multicast'});
assert(switchUI.get('checkContent').innerHTML.includes('svc-multicast-facts'));
assert(switchUI.get('checkContent').innerHTML.includes('Luồng mẫu (S,G)'));
assert(switchUI.get('checkContent').innerHTML.includes('Interface hướng lên'));
assert(switchUI.get('checkContent').innerHTML.includes('PIM neighbor'));
assert(switchUI.get('checkContent').innerHTML.includes('svc-switch-multicast-technical'));
assert(switchUI.get('checkContent').innerHTML.indexOf('svc-multicast-facts')<switchUI.get('checkContent').innerHTML.indexOf('svc-switch-multicast-technical'),'Operational multicast facts precede collapsed H3C JSON evidence');

const legacyPim=JSON.parse(JSON.stringify(fixtures.hw24));legacyPim.status=false;
legacyPim.result.checks.pim_neighbors={status:false,count:9,expected_count:3,data_valid:true,reason:'pim_neighbor_count_mismatch',neighbors:['192.0.2.1']};
legacyPim.result.failures=[{check:'pim_neighbors',scope:'device',command:'display pim neighbor',observed:legacyPim.result.checks.pim_neighbors}];
switchUI.api.loadResponse(legacyPim);switchUI.click({checkTab:'routing'});
assert(switchUI.get('checkContent').innerHTML.includes('svc-issue-meaning'));
assert(switchUI.get('checkContent').innerHTML.includes('đã bằng hoặc vượt mức tối thiểu 3'));
assert(switchUI.get('checkContent').innerHTML.includes('chạy lại API'));

switchUI.api.loadResponse(fixtures.hw67);switchUI.click({checkTab:'routing'});
assert(switchUI.get('checkContent').innerHTML.includes('Ý nghĩa vận hành'));
assert(switchUI.get('checkContent').innerHTML.includes('Không tìm thấy tuyến đang hoạt động đến 10.0.222.0'));
switchUI.api.loadResponse(fixtures.gc16);assert(switchUI.get('switchAttention').hidden);assert.equal(switchUI.get('switchAttention').innerHTML,'');
switchUI.api.clear();assert(switchUI.get('switchAttention').hidden);
console.log('PASS: visible SEP/unknown/optional issues, direct failure navigation, failed-Port pagination, clean passing ratings, immutable source and OLT isolation.');
(async()=>{
  ui.api.loadResponse(fixtures.gc16);
  ui.get('resultTabs').listeners.keydown({key:'End',preventDefault(){}});assert.equal(ui.api.getView().tab,'multicast');ui.get('resultTabs').listeners.keydown({key:'Home',preventDefault(){}});assert.equal(ui.api.getView().tab,'onu');
  const first=fixtures.gc16.result.ports[0].onu_data[0],malicious=JSON.parse(JSON.stringify(fixtures.gc16));malicious.result.ports[0].onu_data[0].contract='<img src=x onerror=alert(1)>';
  const fileEvent=file=>({target:{files:[file],value:'file'}});
  await ui.get('responseFile').listeners.change(fileEvent({size:100,name:'bad.txt',text:async()=>'{invalid'}));assert.strictEqual(ui.api.getResponse(),fixtures.gc16);assert(!ui.get('requestError').hidden);
  await ui.get('responseFile').listeners.change(fileEvent({size:21*1024*1024,name:'large.json',text:async()=>{throw Error('must not read oversized file');}}));assert.strictEqual(ui.api.getResponse(),fixtures.gc16);
  await ui.get('responseFile').listeners.change(fileEvent({size:1000,name:'response.json',text:async()=>JSON.stringify(malicious)}));ui.click({openPon:'0'});assert(ui.html().includes('&lt;img'));assert(!ui.html().includes('<img'));
  let resolve;const promise=new Promise(r=>resolve=r),pending=ui.get('responseFile').listeners.change(fileEvent({size:1000,name:'slow.json',text:()=>promise}));ui.api.loadResponse(fixtures.hw24);resolve(JSON.stringify(fixtures.ha58));await pending;assert.strictEqual(ui.api.getResponse(),fixtures.hw24,'Late file read cannot overwrite a newer device context');
  ui.api.loadResponse(fixtures.gc16);ui.input('onuSearch',first.onu_sn);ui.get('exportCsv').listeners.click();assert.equal(ui.api.getView().filteredOnu,1,'Export commits pending search before selecting rows');assert(ui.exports.at(-1).name.endsWith('-filtered.csv'));
  assert.equal(JSON.stringify(fixtures),original);console.log('PASS: malformed/oversized/imported JSON, XSS escaping, stale import race, immediate filtered export, keyboard tabs, portal entry and local assets.');
})().catch(e=>{console.error(e);process.exitCode=1;});


const CS=require('../shared/customer-status.js'),statusUI=harness();
for(const [raw,label] of Object.entries({'Binh thuong':'Bình Thường','Chu thue bao di vang':'Chủ thuê bao đi vắng','Ngung vi ly do thanh toan':'Ngưng vì lý do thanh toán','Da cham dut hop dong':'Đã chấm dứt hợp đồng'})){
  assert.equal(M.contractStatus(raw),CS.format(raw));assert.equal(CS.format(raw),label);
  const sample={device_type:'OLT',status:true,result:{ports:[{port:'g0/1',onu_data:[{onu_id:'0/1/1',contract:'CDP-TEST',onu_ipwan:'192.0.2.1',net_status:raw}]}]}};
  statusUI.api.loadResponse(sample);statusUI.click({openPon:'0'});assert(statusUI.html().includes(label));
  assert(M.csv(M.index(sample).rows).includes(label));assert.equal(statusUI.api.getResponse().result.ports[0].onu_data[0].net_status,raw);
}
for(const value of [null,'None','null','N/a',''])assert.equal(CS.format(value),null);
assert.equal(CS.format('Trạng thái chưa biết'),'Trạng thái chưa biết');
console.log('PASS: shared accented contract status in table/CSV, canonical labels, unchanged raw response.');

// CDP findings are authoritative even when all displayed customer fields exist.
const reviewResponse={status:true,device_type:'OLT',result:{ports:[{port:'GPON 0/1/1',onu_data:[
  {onu_id:'1/1/1',contract:'HD-TEST',net_status:'Bình thường',drop_point:'DP',onu_ipwan:'192.0.2.1',
   data_quality:{needs_review:true,matched_by:'mac',cdp_snapshot:{contract:'HD-TEST',mac:'00:11:22:33:44:55',ip:'192.0.2.1'},issues:[{code:'cdp_value_mismatch',message:'MAC CDP sai <script>',device_value:'AA',csoc_value:'BB'},{code:'duplicate_cdp_mac',message:'Trùng MAC CDP'}]}}
]}],cdp_audit:{records:[{kind:'cdp_only',pon_port:'G0/1/1',contract:'HD-EXTRA',snapshot:{mac:'00:11:22:33:44:55'},issues:[{message:'Có trên CDP nhưng không thấy trên thiết bị'}]}],
  hidden_onu_records:[{kind:'observed_not_returned',pon_port:'G0/1/1',snapshot:{onu_index:'1/1/9'},issues:[{message:'Thiếu hồ sơ CDP cho ONU bị giới hạn'}]}]}}};
const reviewBefore=JSON.stringify(reviewResponse),reviewIndex=M.index(reviewResponse);
assert.equal(reviewIndex.rows.length,1,'CDP-only/hidden records cannot inflate physical ONU rows');
assert.equal(reviewIndex.signals.any,1,'Only the returned ONU counts, without standalone CDP or hidden ONU records');
assert.equal(reviewIndex.ports[0].attention,1,'PON scope includes only returned ONU review items');
assert.equal(M.filter(reviewIndex,{attention:'any'}).rows.length,1);
const reviewUI=harness();reviewUI.api.loadResponse(reviewResponse);
assert(reviewUI.get('customerSignals').innerHTML.includes('Cần kiểm tra <b>1</b>'));
assert(!reviewUI.html().includes('HD-EXTRA')&&!reviewUI.html().includes('Bản ghi CDP cần kiểm tra'));
reviewUI.click({signal:'any'});reviewUI.click({openPon:'0'});
assert(reviewUI.html().includes('&lt;script&gt;')&&!reviewUI.html().includes('<script>'));
assert(reviewUI.html().includes('data-onu-review="0:0"'));
assert(/data-onu-field="attention"><button[^>]*class="svc-review-button has-items"/.test(reviewUI.html()));
reviewUI.click({onuReview:'0:0'});assert(reviewUI.get('onuReviewDialog').open);
assert.equal(reviewUI.get('onuReviewTitle').textContent,'Đối chiếu ONU 1/1/1');
assert.equal(reviewUI.get('onuReviewMeta').textContent,'GPON 0/1/1 · Ghép theo MAC');
assert(reviewUI.get('onuReviewContent').innerHTML.includes('00:11:22:33:44:55'));
assert(reviewUI.get('onuReviewContent').innerHTML.includes('<th scope="col">Data CDP</th>'));
assert(!reviewUI.get('onuReviewContent').innerHTML.includes('chưa kèm Data CDP nguồn'));
assert(reviewUI.get('onuReviewContent').innerHTML.includes('&lt;script&gt;')&&!reviewUI.get('onuReviewContent').innerHTML.includes('<script>'));
assert(reviewUI.get('onuReviewContent').innerHTML.includes('AA')&&reviewUI.get('onuReviewContent').innerHTML.includes('BB'));
reviewUI.get('closeOnuReview').listeners.click();assert(!reviewUI.get('onuReviewDialog').open);assert.equal(reviewUI.get('onuReviewContent').innerHTML,'');
reviewUI.input('onuSearch','HD-EXTRA');reviewUI.flush();assert(!reviewUI.html().includes('HD-EXTRA'));assert.equal(reviewUI.api.getView().filteredOnu,0);
assert.equal(JSON.stringify(reviewResponse),reviewBefore,'Review projection preserves the API response');
reviewUI.api.loadResponse(reviewResponse);reviewUI.click({openPon:'0'});reviewUI.click({onuReview:'0:0'});
reviewUI.api.loadResponse(fixtures.gc16);assert(!reviewUI.get('onuReviewDialog').open);assert.equal(reviewUI.get('onuReviewContent').innerHTML,'');
reviewUI.click({mode:'onu'});reviewUI.click({onuReview:'0:0'});assert(reviewUI.get('onuReviewDialog').open);assert(reviewUI.get('onuReviewContent').innerHTML.includes('chưa kèm Data CDP nguồn'));
assert(!reviewUI.get('onuReviewContent').innerHTML.includes('<th scope="col">Data CDP</th>'),'A historical response cannot show an all-empty source column');
reviewUI.api.clear();assert(!reviewUI.get('onuReviewDialog').open);assert.equal(reviewUI.get('onuReviewContent').innerHTML,'');
const healthyReview=JSON.parse(JSON.stringify(reviewResponse));healthyReview.result.ports[0].onu_data[0].data_quality.issues=[];healthyReview.result.ports[0].onu_data[0].data_quality.needs_review=false;
reviewUI.api.loadResponse(healthyReview);reviewUI.click({mode:'onu'});reviewUI.click({onuReview:'0:0'});assert(reviewUI.get('onuReviewContent').innerHTML.includes('Không có mục cần kiểm tra'));
reviewUI.get('onuReviewDialog').close();assert.equal(reviewUI.get('onuReviewContent').innerHTML,'');
const legacyMatched=JSON.parse(JSON.stringify(healthyReview));delete legacyMatched.result.ports[0].onu_data[0].data_quality.cdp_snapshot;
const legacyBefore=JSON.stringify(legacyMatched);
reviewUI.api.loadResponse(legacyMatched);reviewUI.click({mode:'onu'});reviewUI.click({onuReview:'0:0'});
assert(reviewUI.get('onuReviewContent').innerHTML.includes('Thông tin khách hàng đã được lấy từ CDP.'));
assert(reviewUI.get('onuReviewContent').innerHTML.includes('HD-TEST'));
assert.equal((reviewUI.get('onuReviewContent').innerHTML.match(/<th scope="col">/g)||[]).length,2);
assert.equal(JSON.stringify(legacyMatched),legacyBefore,'Legacy source data is never reconstructed or written back');
const missingProfile=JSON.parse(JSON.stringify(legacyMatched));missingProfile.result.ports[0].onu_data[0].data_quality={membership:'device_only',cdp_snapshot:null,issues:[{code:'missing_cdp_record',message:'Không có hồ sơ khớp'}]};
reviewUI.api.loadResponse(missingProfile);reviewUI.click({mode:'onu'});reviewUI.click({onuReview:'0:0'});
assert(reviewUI.get('onuReviewContent').innerHTML.includes('Không tìm thấy hồ sơ CDP khớp ONU này.'));
assert(!reviewUI.get('onuReviewContent').innerHTML.includes('Thông tin khách hàng đã được lấy từ CDP.'));
missingProfile.result.ports[0].onu_data[0].data_quality.issues=[{code:'cdp_lookup_failed',message:'Không lấy được CDP'}];
reviewUI.api.loadResponse(JSON.parse(JSON.stringify(missingProfile)));reviewUI.click({mode:'onu'});reviewUI.click({onuReview:'0:0'});
assert(reviewUI.get('onuReviewContent').innerHTML.includes('Không lấy được dữ liệu CDP trong lần kiểm tra này.'));
assert(!reviewUI.get('onuReviewContent').innerHTML.includes('Không tìm thấy hồ sơ CDP khớp ONU này.'));
const offProfile=JSON.parse(JSON.stringify(healthyReview));
Object.assign(offProfile.result.ports[0].onu_data[0],{contract:null,net_status:null,drop_point:null,onu_ipwan:null});
offProfile.result.ports[0].onu_data[0].data_quality={needs_review:true,severity:'warning',membership:'device_only',cdp_snapshot:null,ignored_cdp_records:[{cdp_row:0,reason:'status_off',snapshot:{status:'off',contract:'OFF-<img src=x>',mac:'00:11:22:33:44:55'}}],issues:[{code:'cdp_status_off',severity:'warning',message:'CDP status=off; không dùng hồ sơ này',device_value:'observed_on_olt',cdp_value:'off'}]};
reviewUI.api.loadResponse(offProfile);reviewUI.click({mode:'onu'});
assert(reviewUI.get('customerSignals').innerHTML.includes('Cần kiểm tra <b>1</b>'));
assert(reviewUI.html().includes('svc-review-button has-items'));
assert(!reviewUI.html().includes('OFF-&lt;img'),'Ignored CDP cannot fill the main ONU customer fields');
reviewUI.click({onuReview:'0:0'});
assert(reviewUI.get('onuReviewContent').innerHTML.includes('Hồ sơ CDP có status=off đã bị loại'));
assert(reviewUI.get('onuReviewContent').innerHTML.includes('Data CDP không sử dụng'));
assert(reviewUI.get('onuReviewContent').innerHTML.includes('OFF-&lt;img')&&!reviewUI.get('onuReviewContent').innerHTML.includes('<img'));
assert(!reviewUI.get('onuReviewContent').innerHTML.includes('Không có mục cần kiểm tra'));
assert(!reviewUI.get('onuReviewContent').innerHTML.includes('Không tìm thấy hồ sơ CDP khớp ONU này.'));
const activeWithIgnored=JSON.parse(JSON.stringify(healthyReview));
Object.assign(activeWithIgnored.result.ports[0].onu_data[0].data_quality,{needs_review:true,severity:'warning',ignored_cdp_records:offProfile.result.ports[0].onu_data[0].data_quality.ignored_cdp_records,issues:offProfile.result.ports[0].onu_data[0].data_quality.issues});
activeWithIgnored.result.ports[0].onu_data[0].data_quality.cdp_snapshot.status='act';
reviewUI.api.loadResponse(activeWithIgnored);reviewUI.click({mode:'onu'});reviewUI.click({onuReview:'0:0'});
assert(reviewUI.get('onuReviewContent').innerHTML.includes('Thông tin khách hàng dùng hồ sơ còn hiệu lực'));
assert(reviewUI.get('onuReviewContent').innerHTML.includes('<th scope="col">Data CDP</th>'));
assert(reviewUI.get('onuReviewContent').innerHTML.includes('Data CDP không sử dụng'));
const iscResponse=JSON.parse(JSON.stringify(healthyReview));
const iscOnu=iscResponse.result.ports[0].onu_data[0];
Object.assign(iscOnu,{onu_ipwan:'203.0.113.81',onu_status:'Online',onu_online:true,online_source:'isc_ipwan_by_mac',sampling_source:'cdp_act',service_quality:{needs_review:true,issues:[{code:'ipwan_source_mismatch',message:'IP WAN ISC khác CDP',isc_value:'203.0.113.81',cdp_value:'192.0.2.1'}]}});
iscResponse.result.ports[0].online_onu=1;
iscResponse.result.ports[0].onu_data.push({...iscOnu,onu_id:'1/1/2',onu_ipwan:null,onu_status:'Unknown',onu_online:false,sampling_source:'olt_fallback',service_quality:{needs_review:true,issues:[{code:'isc_ipwan_not_found',message:'ISC chưa trả IP WAN hợp lệ'}]}});
const iscBefore=JSON.stringify(iscResponse);
reviewUI.api.loadResponse(iscResponse);reviewUI.click({openPon:'0'});
assert(reviewUI.html().includes('1 Online (ISC)'));
assert(reviewUI.html().includes('Chưa xác nhận'));
assert(reviewUI.html().includes('IP WAN xác minh từ ISC · Online'));
assert(reviewUI.get('customerSignals').innerHTML.includes('Cần kiểm tra <b>2</b>'),'CDP/service flags count each ONU once');
reviewUI.click({onuReview:'0:0'});
assert(reviewUI.get('onuReviewContent').innerHTML.includes('<b>ONU Online.</b>'));
assert(reviewUI.get('onuReviewContent').innerHTML.includes('CDP status=act chỉ dùng để ưu tiên chọn mẫu'));
assert(reviewUI.get('onuReviewContent').innerHTML.includes('<h3>Đối chiếu IP WAN</h3>'));
assert(reviewUI.get('onuReviewContent').innerHTML.includes('203.0.113.81')&&reviewUI.get('onuReviewContent').innerHTML.includes('192.0.2.1'));
reviewUI.get('onuReviewDialog').close();reviewUI.click({onuReview:'0:1'});
assert(reviewUI.get('onuReviewContent').innerHTML.includes('<b>Chưa xác nhận ONU Online.</b>'));
assert.equal(JSON.stringify(iscResponse),iscBefore,'ISC evidence never rewrites imported source values');
prod.api.loadResponse(reviewResponse);prod.click({mode:'onu'});prod.click({onuReview:'0:0'});assert(prod.get('onuReviewDialog').open,'ONU review remains available in production');
assert(!uiSource.includes('function cdpRecords('),'No standalone CDP table remains');
const assessmentUI=harness();
for(const [vendor,sample] of [['HUAWEI',fixtures.ha58],['ZTE',fixtures.gc16],['GCOM',fixtures.gc16],['FIBERHOME',fixtures.gc16],['HUAWEI',fixtures.hw24],['H3C',fixtures.cv52]]){
  const payload=JSON.parse(JSON.stringify(sample));payload.result.vendor=vendor;
  const before=JSON.stringify(payload);assessmentUI.api.loadResponse(payload);
  assert.equal(assessmentUI.get('resultStatus').textContent,'Dịch vụ: OK',vendor+' shares the service assessment label');
  assert(!assessmentUI.get('resultStatus').hidden);
  assert(assessmentUI.get('resultStatus').className.includes('good'));
  assert.equal(JSON.stringify(payload),before,'Assessment preserves source response');
}
for(const type of ['SWITCH_CE','SWITCH_DI','SWITCH']){
  const payload=JSON.parse(JSON.stringify(fixtures.hw24));payload.device_type=type;
  assessmentUI.api.loadResponse(payload);assert.equal(assessmentUI.get('resultStatus').textContent,'Dịch vụ: OK');
  payload.status=false;payload.result.checks.routes.status=false;
  assessmentUI.api.loadResponse(payload);assert.equal(assessmentUI.get('resultStatus').textContent,'Cần kiểm tra');
  assert(assessmentUI.get('resultStatus').className.includes('fail'));
}
const multicastFailure={device_type:'OLT',status:false,error:null,message:'B3: 1675 / 1674',result:{ports:[],multicast:{overall_ok:false,igmp_request:false}}};
assessmentUI.api.loadResponse(multicastFailure);
assert.equal(assessmentUI.get('resultStatus').textContent,'Cần kiểm tra');
assert(assessmentUI.get('resultMessage').innerHTML.includes('>1675</strong>')&&assessmentUI.get('resultMessage').innerHTML.includes('>1674</strong>'));
assessmentUI.api.loadResponse({...multicastFailure,status:true});
assert.equal(assessmentUI.get('resultStatus').textContent,'Cần kiểm tra','Explicit failed evidence takes precedence over an inconsistent success flag');
for(const payload of [
  {device_type:'OLT',status:false,error:'timeout',message:'Timed out',result:null},
  {device_type:'OLT',status:true,error:null,result:{ports:[]}},
  {device_type:'SWITCH_CE',status:false,error:null,result:null},
  {device_type:'SWITCH_DI',status:false,error:null,result:null},
  {device_type:'SWITCH',status:false,error:null,result:null},
]){
  assessmentUI.api.loadResponse(payload);
  assert.equal(assessmentUI.get('resultStatus').textContent,'Dịch vụ: Chưa đủ dữ liệu');
  assert(assessmentUI.get('resultStatus').className.includes('warn'));
}
assessmentUI.api.loadResponse(fixtures.gc16);
assert.equal(assessmentUI.get('resultStatus').textContent,'Dịch vụ: OK','A new response replaces the previous assessment');
console.log('PASS: shared service assessment tags across vendors/types, confirmed failures, unknown execution results and immutable source payloads.');
const headerUI=harness(),headerPayload={device_type:'OLT',status:false,error:null,message:'Multicast NOT OK; B3 Total service-port=1675 khác/không đọc được so với IGMP member=1674; B4 có 44 IGMP user online; Đã thu thập dữ liệu 32 Port PON.',result:{nameDev:'TEST-HA58',ipDev:'192.0.2.1',ports:[],multicast:{overall_ok:false}}};
const headerBefore=JSON.stringify(headerPayload);headerUI.api.loadResponse(headerPayload);
const headerMessage=headerUI.get('resultMessage').innerHTML;
assert(headerMessage.includes('<strong class="svc-message-outcome is-review">Multicast: Cần kiểm tra</strong>'));
for(const value of ['1.675','1.674','1','44','32'])assert(headerMessage.includes('<strong class="svc-message-value">'+value+'</strong>'));
assert(headerMessage.includes('Chênh lệch')&&headerMessage.includes('thuê bao IGMP đang hoạt động'));
assert(headerMessage.includes('class="svc-pill svc-message-step">B3</span>')&&headerMessage.includes('class="svc-pill svc-message-step">B4</span>'));
assert.equal((headerMessage.match(/class="svc-result-detail"/g)||[]).length,4);
assert(!headerMessage.includes('—<span')&&!headerMessage.includes('</strong>—'),'Formatting must not inject placeholder dashes around tokens');
assert.equal(JSON.stringify(headerPayload),headerBefore,'Header presentation keeps original message and export intact');
assert(html.indexOf('id="deviceName"')<html.indexOf('id="deviceMeta"')&&html.indexOf('id="deviceMeta"')<html.indexOf('id="resultStatus"')&&html.indexOf('id="resultStatus"')<html.indexOf('id="resultMessage"'),'Identity and IP precede assessment and evidence');
assert(html.includes('<section class="svc-service-verdict" aria-label="Đánh giá dịch vụ">'));
for(const type of ['OLT','SWITCH_CE','SWITCH_DI','SWITCH']){
  const bad={device_type:type,status:false,message:'Lỗi <img src=x onerror="bad()"> 1675; B3 chưa có số liệu',error:{message:'<script>bad()</script>'},result:null};
  headerUI.api.loadResponse(bad);
  assert(!headerUI.get('resultMessage').hidden);
  assert(headerUI.get('resultMessage').innerHTML.includes('&lt;img')&&headerUI.get('resultMessage').innerHTML.includes('&lt;script&gt;'));
  assert(!headerUI.get('resultMessage').innerHTML.includes('<img')&&!headerUI.get('resultMessage').innerHTML.includes('<script>'));
  assert(!headerUI.get('resultTabs').innerHTML.includes('Chẩn đoán'));
}
headerUI.api.loadResponse(fixtures.gc16);
assert(headerUI.get('resultMessage').hidden&&headerUI.get('resultMessage').innerHTML==='','Successful next result clears previous error/evidence');
console.log('PASS: reordered device identity and assessment, highlighted multicast totals/outcomes, safe errors, removed diagnostics and clean reload.');
const mcUI=harness(),mcPayload={device_type:'OLT',status:false,error:null,result:{mode:'multicast_only',multicast:{
  overall_ok:false,multicast_stream:true,igmp_request:false,message:'Multicast NOT OK; raw diagnostic retained',checks:{
    b4_user_online:{status:'OK',valid:true,required:false,online_user_count:44,online_pon_count:19},
    b3_igmp_config:{status:'NOT_OK',valid:false,vlan:99,total_service_port:1675,total_igmp_member:1674},
    b1_prejoin_traffic:{status:'OK',valid:true,indexes:[1,10,18],channels:[{index:1,kbps:8414,valid:true},{index:10,kbps:8414,valid:true},{index:18,kbps:8196,valid:true}]},
    b2_uplink_traffic:{status:'SKIPPED',valid:null,reason:'B1_OK',uplink_port:null,kbps:null},
  }}}};
const showMc=payload=>{mcUI.api.loadResponse(payload);mcUI.get('resultTabs').listeners.click({target:{closest:()=>({dataset:{tab:'multicast'}})}});return mcUI.get('checkContent').innerHTML;};
const mcOriginal=JSON.stringify(mcPayload),mcRendered=showMc(mcPayload),mcMain=mcRendered.split('<details class="svc-mc-technical"')[0];
for(const step of ['B1','B2','B3','B4'])assert(mcMain.includes('class="svc-pill svc-mc-step-tag">'+step+'</span>'));
assert(mcMain.indexOf('>B1</span>')<mcMain.indexOf('>B2</span>')&&mcMain.indexOf('>B2</span>')<mcMain.indexOf('>B3</span>'),'Steps follow operational order without changing source order');
assert(mcMain.includes('<b>3/3</b> kênh có lưu lượng'));
assert(mcMain.includes('8.414')&&mcMain.includes('8.196')&&mcMain.includes('Lưu lượng (kb/s)'));
assert(mcMain.includes('B1 đã xác nhận có lưu lượng, không cần kiểm tra bổ sung.'));
assert(mcMain.includes('chênh lệch <b>1 bản ghi</b>')&&mcMain.includes('1.675')&&mcMain.includes('1.674'));
assert(mcMain.includes('<b>44</b>')&&mcMain.includes('<b>19</b>'));
for(const removed of ['Cần đối chiếu danh sách service-port và thành viên IGMP để xác định bản ghi chênh lệch.','Thông tin tham khảo, không quyết định kết quả multicast chung.','Thông tin ghi nhận'])assert(!mcRendered.includes(removed));
assert(mcMain.includes('<span>Chi tiết</span>')&&mcMain.includes('<div class="svc-mc-detail"><h3>Chi tiết</h3>'));
assert.equal((mcMain.match(/<details class="svc-mc-item/g)||[]).length,4);
assert.equal((mcMain.match(/<summary aria-label=/g)||[]).length,4,'Each complete row is the disclosure control');
assert(!/<details class="svc-mc-item[^"]*"\s+open/.test(mcMain),'Every B1-B4 detail starts collapsed');
assert.equal((mcMain.match(/svc-mc-needs-review/g)||[]).length,1,'Only failed mandatory B3 gets review highlight');
for(const raw of ['<pre>','b1_prejoin_traffic','b2_uplink_traffic','Trạng thái gốc','"channels"','"valid"','SKIPPED','NOT_OK','null','undefined','NaN'])assert(!mcMain.includes(raw),'Readable main view omits '+raw);
assert(mcRendered.includes('<details class="svc-mc-technical"><summary>Xem dữ liệu kỹ thuật</summary>'));
assert(mcRendered.includes('b1_prejoin_traffic')&&mcRendered.includes('raw diagnostic retained'),'Technical evidence is still accessible');
assert(!/<details[^>]*\sopen(?:[=>\s])/.test(mcRendered),'Technical evidence starts collapsed');
assert.equal(JSON.stringify(mcPayload),mcOriginal,'Formatting does not mutate raw payload or export');
const mcEdge=JSON.parse(mcOriginal);mcEdge.result.multicast.checks.b1_prejoin_traffic={status:'NOT_OK',valid:false,indexes:[1,2,3],channels:[{index:1,kbps:0,valid:false},{index:2,kbps:null,valid:false}]};
mcEdge.result.multicast.checks.b2_uplink_traffic={status:'NOT_OK',valid:false,reason:'UPLINK_NOT_FOUND',uplink_port:null,kbps:null};
mcEdge.result.multicast.checks.b3_igmp_config={status:'NOT_OK',valid:false,vlan:99,total_service_port:0,total_igmp_member:null};
let mcEdgeMain=showMc(mcEdge).split('<details class="svc-mc-technical"')[0];
assert(mcEdgeMain.includes('Không có lưu lượng')&&mcEdgeMain.includes('Chưa có số liệu')&&mcEdgeMain.includes('<b>0/3</b> kênh có lưu lượng'));
assert(mcEdgeMain.includes('Chưa xác định được Port hướng lên từ cấu hình thiết bị.'));
assert(mcEdgeMain.includes('<b>0</b>')&&mcEdgeMain.includes('Chưa đủ số liệu để đối chiếu.')&&!mcEdgeMain.includes('0 bản ghi'),'Unknown IGMP count must not be displayed as zero difference');
mcEdge.status=true;Object.assign(mcEdge.result.multicast,{overall_ok:true,multicast_stream:true,igmp_request:true});
mcEdge.result.multicast.checks.b2_uplink_traffic={status:'OK',valid:true,uplink_port:'0/9/0',kbps:321};
mcEdge.result.multicast.checks.b3_igmp_config={status:'OK',valid:true,vlan:99,total_service_port:0,total_igmp_member:0};
mcEdge.result.multicast.checks.b4_user_online={status:'NO_USER_ONLINE',valid:false,required:false,online_user_count:0,online_pon_count:0};
mcEdgeMain=showMc(mcEdge).split('<details class="svc-mc-technical"')[0];
assert(mcEdgeMain.includes('0/9/0')&&mcEdgeMain.includes('321')&&mcEdgeMain.includes('0 bản ghi'));
assert(mcEdgeMain.includes('Chưa ghi nhận thuê bao'));
assert.equal((mcEdgeMain.match(/svc-mc-needs-review/g)||[]).length,1,'B1 failure remains visible while B2 recovers traffic; optional B4 is not a mandatory failure');
assert.equal(mcUI.get('resultStatus').textContent,'Dịch vụ: OK','Successful B2 and optional B4 do not override source global decision');
const mcUnknown={device_type:'OLT',status:true,result:{multicast:{overall_ok:true,checks:{'<img src=x>':{status:'OK',note:'<script>bad()</script>'}}}}};
const mcUnknownHtml=showMc(mcUnknown);
assert(mcUnknownHtml.includes('&lt;img src=x&gt;')&&mcUnknownHtml.includes('&lt;script&gt;')&&!mcUnknownHtml.includes('<img')&&!mcUnknownHtml.includes('<script>'));
assert(mcUnknownHtml.includes('hạng mục bổ sung'));
assert(showMc({device_type:'OLT',status:true,result:{multicast:{overall_ok:true,checks:{b1_prejoin_traffic:{status:'NOT_OK',channels:[],indexes:[]}}}}}).includes('Chưa có số liệu lưu lượng kênh multicast.'));
assert(showMc({device_type:'OLT',status:true,result:{}}).includes('Chưa có thông tin multicast.'));
console.log('PASS: readable OLT multicast B1–B4, channel rates, skipped explanations, IGMP difference, optional users, missing vs zero, collapsed technical evidence and safe immutable legacy responses.');
console.log('PASS: selected-ONU review counts, per-row review dialog in nested/flat/production modes, safe evidence, close/reload/clear and historical payload compatibility.');
