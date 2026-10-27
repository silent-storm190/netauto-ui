// Synthetic fixtures are test-only; the UI never seeds results or calls devices.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),base=path.join(root,'customer_of_pon'),M=require(path.join(base,'model.js'));
const response={status:true,message:'Đã đối soát',error:null,result:{olt:{input:'TEST-OLT',olt_name:'TEST-OLT',olt_ip:'192.0.2.1',vendor:'GCOM',model:'GC16'},ports:{requested_ports:['g0/1'],valid_ports:['g0/1'],invalid_ports:['bad-port'],available_pon_ports:['g0/1','g0/2','g0/3','g0/3']},count:{total:4,online:1,offline:2,unclassified:1,seen_on_device:1},data_quality:{complete:false,device:'available',csoc:'partial'},duration_ms:0,warnings:['SOURCE<&>'],customers:{online:[{contract:'LIVE',status:false,seen_on_device:true,customer_state:'Online',requested_location:{olt_name:'TEST-OLT',port_name:'g0/1'},onu_mac:'MAC',onu_index:0,contract_status:'Bình Thường',onu:{onu_rx:0,onu_tx:0,onu_temp:0,onu_olt_distance:0},data_sources:{presence:'olt_device',telemetry:'olt_snmp'}}],offline:[{contract:'MOVED<&>',status:false,seen_on_device:false,customer_state:'Online',onu_status:'Online',requested_location:{olt_name:'TEST-OLT',port_name:'g0/1'},move_check:{status:'moved_to_other_pon',confidence:'medium',customer_state_source:'inside',source:['isc_osp','inside','csoc_contract_lookup'],current_location:{olt_name:'TEST-OLT',port_name:'g0/2',onu_index:0,source:'isc_osp'},location_sources:['isc_osp','csoc_radius'],location_conflict:true,location_alternatives:[{olt_name:'OTHER-OLT',port_name:'G0/8/1',source:'csoc_contract'}],conflicts:[{type:'customer_state',selected_source:'inside',selected_value:'Online',conflicting_source:'csoc_status',conflicting_value:'Offline'},{type:'current_location',selected_source:'isc_osp',selected_value:['TEST-OLT','0','2'],alternatives:[['OTHER-OLT','8','1']]}],connection:{last_logon:'2026-10-26T10:00:00+07:00',last_logout:'',connection_time_source:'inside'},csoc:{customer_state:'Offline',customer_state_source:'csoc_status',raw_statuses:['off'],ipwan:'192.0.2.4',locations:[{olt_name:'OTHER-OLT',slot:8,port:1,source:'csoc_contract'}]},errors:['SOURCE_ERR']},data_sources:{presence:'csoc_radius_history',move_check:['isc_osp','inside']}},{contract:'OFFLINE',customer_state:'Offline',status:false,requested_location:{port_name:'g0/1'},move_check:{status:'confirmed_offline',customer_state_source:'inside',confidence:'low'}}]},unclassified_customers:[{contract:'UNCLASSIFIED',port_name:'g0/1',source:'csoc_radius_history'}]}};
const groups=(values={})=>Object.fromEntries([...M.customerGroups,'conflicts'].map(key=>[key,values[key]??[]]));
response.result.customers=groups({observed_on_requested_pon:response.result.customers.online,confirmed_offline:[response.result.customers.offline[1]],online_elsewhere:[response.result.customers.offline[0]],conflicts:[{type:'customer_data_mismatch',matched_by:'contract',contract:'MOVED<&>',different_fields:[{field:'contract',device_value:'MOVED<&>',csoc_value:'OLD-CONTRACT',conflicting_source:'csoc_radius_history'}],sources:['olt_device','csoc_radius_history']}]});
response.result.count={total:4,observed_on_requested_pon:1,confirmed_offline:1,online_elsewhere:1,unconfirmed:0,unclassified:1,conflicts:1,seen_on_device:1};
const before=JSON.stringify(response),parsed=M.parse(response);
assert.deepEqual(parsed.rows.map(r=>r.group),['observed_on_requested_pon','confirmed_offline','online_elsewhere','unclassified']);
assert.equal(parsed.rows[2].customer.status,false);assert.equal(parsed.rows[2].customer.customer_state,'Online');
assert.equal(M.filter(parsed.rows,{group:'confirmed_offline'}).length,1,'Online elsewhere is separate from confirmed offline');
assert.equal(parsed.conflicts.length,1);assert.equal(parsed.rows.length,4,'Conflicts are references, not additional customers');
assert.equal(M.filter(parsed.rows,{conflict:true}).length,1);
assert.equal(M.filter(parsed.rows,{query:'csoc_contract'}).length,1,'Search includes raw source evidence');
assert.equal(M.filter(parsed.rows,{move:'moved_to_other_pon',port:'g0/1'}).length,1);
assert.equal(M.filter(parsed.rows,{port:'g0/2'}).length,0,'Port filter uses requested membership, not a moved customer location');
assert.equal(M.location({olt_name:'TEST',port:0,slot:0,onu_index:0}),'TEST · Port 0 · Slot 0 · Index 0');
assert.equal(M.sourceLabel('__proto__'),'__proto__');assert.equal(M.moveLabel('constructor'),'constructor');
assert.equal(M.esc('<img src=x>'), '&lt;img src=x&gt;');
assert.deepEqual(M.request(' TEST ','g0/1, g0/1;g0/2\ng0/3'),{olt:'TEST',pon_ports:['g0/1','g0/2','g0/3']});
assert.throws(()=>M.request('','g0/1'));assert.throws(()=>M.request('TEST',' ,\n'));
assert.deepEqual(M.portCatalog(response.result,' 192.0.2.1 ').ports,['g0/1','g0/2','g0/3']);
assert.equal(M.portCatalog(response.result,'OTHER').ports.length,0,'No port catalog leaks between devices');
assert.equal(M.portCatalog({...response.result,ports:{valid_ports:['g0/1']}},'TEST-OLT').kind,'validated');
assert.equal(M.hasConflict({move_check:{location_conflict:true,conflicts:[]}}),true,'An explicit location conflict flag does not require a populated conflict array');
for(const invalid of [{},[],null,{status:'true',result:null},{status:true,result:[]},{status:true,result:{olt:{},ports:{},customers:{online:[null],offline:[]}}}])assert.throws(()=>M.parse(invalid));
assert.equal(M.parse({status:false,message:'failed',result:null,error:'error'}).rows.length,0);
const validDifference={field:'contract',device_value:'VALID-A',csoc_value:'VALID-B',conflicting_source:'csoc_radius_history'};
const mixed=JSON.parse(JSON.stringify(response));
mixed.result.customers.conflicts=[
  {type:'multiple_contracts_for_mac',contract:'LIVE',different_fields:[{...validDifference,conflicting_source:'systemradius_osp_contract_pon'}]},
  {type:'customer_data_mismatch',contract:'LIVE',matched_by:'contract',different_fields:[
    ...[null,'',' None ','null','chưa bind'].flatMap(value=>[{...validDifference,device_value:value},{...validDifference,csoc_value:value}]),
    {...validDifference,csoc_value:' valid-a '},
    {...validDifference,conflicting_source:'systemradius_osp_contract_pon'},
    validDifference,
    {field:'onu_index',device_value:'0/1/1',csoc_value:'0/1/2',conflicting_source:'csoc_radius'},
  ]},
];
const mixedBefore=JSON.stringify(mixed),mixedParsed=M.parse(mixed);
assert.equal(mixedParsed.conflicts.length,1);
assert.deepEqual(mixedParsed.conflicts[0].record.different_fields.map(d=>d.field),['contract','onu_index'],'Keep genuine valid CDP differences while ignoring empty/history-only fields');
assert.equal(mixedParsed.rows[0].conflicts.length,1);assert.equal(JSON.stringify(mixed),mixedBefore,'Filtering warnings must preserve the imported original');

const html=fs.readFileSync(path.join(base,'mockup.html'),'utf8'),nodes=new Map(),groupButtons=[];
let document;
function element(id){return {id,innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,checked:false,dataset:{},attrs:{},listeners:{},isConnected:true,
  addEventListener(event,fn){this.listeners[event]=fn;},setAttribute(k,v){this.attrs[k]=v;},focus(){document.activeElement=this;},
  querySelectorAll(){return [];},contains(target){return target===this;},showModal(){this.open=true;},close(){this.open=false;this.listeners.close?.();},
  getBoundingClientRect(){return {left:100,right:900,top:100,bottom:700};},click(){this.listeners.click?.({target:this});},remove(){},
};}
for(const m of html.matchAll(/id="([^"]+)"/g)){assert(!nodes.has(m[1]));nodes.set(m[1],element(m[1]));}
for(const m of html.matchAll(/data-group="([^"]+)"/g)){const n=element('');n.dataset.group=m[1];groupButtons.push(n);}
const get=id=>{assert(nodes.has(id),'Missing real ID '+id);return nodes.get(id);};
get('ponPanel').hidden=true;get('resultSection').hidden=true;
document={activeElement:null,documentElement:{dataset:{theme:'light'}},getElementById:get,querySelectorAll:()=>groupButtons,addEventListener(){},body:{append(){}},createElement(){const a=element('');a.click=()=>{document.download=a.download;};return a;}};
let networkCalls=0;
const ctx={document,window:{NETAUTO_CUSTOMER_PON:M,location:{search:'?olt=TEST-OLT&pon=g0%2F1'}},URLSearchParams,setTimeout(fn){fn();},fetch(){networkCalls++;throw Error('Network forbidden');}};
vm.runInNewContext(fs.readFileSync(path.join(base,'app.js'),'utf8'),ctx);
const UI=ctx.window.NETAUTO_CUSTOMER_PON_UI;
assert.equal(get('portsInput').value,'g0/1');assert(get('selectedPorts').innerHTML.includes('Chưa xác minh'));
assert.equal(get('customerRows').innerHTML,'','No invented initial customer rows');
assert(UI.load(response,'REAL-FILE.json'));assert.equal(get('sourceName').textContent,'Nguồn: REAL-FILE.json');
for(const label of ['Tổng Khách hàng ghi nhận trên PON','Khách hàng Offline','Khách hàng kết nối nơi khác','Conflict data'])assert(get('sourceStats').innerHTML.includes(label),'Use the requested summary label: '+label);
assert(!html.includes('id="resultMessage"'),'Successful response summary sentence is removed from the HTML');
for(const removed of ['id="pastePanel"','id="responseInput"','id="backendWarnings"','id="quality"','id="pageSize"','id="pageInfo"','id="prevPage"','id="nextPage"','cp-glossary'])assert(!html.includes(removed),'Remove unwanted controls and technical footer: '+removed);
assert(html.includes('>Xem mẫu</button>')&&html.includes('>Mở tệp dữ liệu<input'),'Use natural action labels');
assert(!get('sourceStats').innerHTML.includes('<i'),'No abstract symbols in overview metrics');
assert(!get('portsSummary').innerHTML.includes('Port PON có sẵn')&&!get('portsSummary').innerHTML.includes('g0/3'),'Available Port list is only in the picker, not repeated in the overview');
assert.equal(get('selectedPorts').innerHTML.includes('Chưa xác minh'),false,'Selected port becomes source-backed only after matching the actual catalog');
assert(get('customerRows').innerHTML.includes('MOVED&lt;&amp;&gt;')&&!get('customerRows').innerHTML.includes('MOVED<&>'));
assert(get('customerRows').innerHTML.includes('data-onu-metric="rx"')&&get('customerRows').innerHTML.includes('data-onu-metric="tx"'));
const compactRows=get('customerRows').innerHTML;
assert(compactRows.includes('class="cp-contract-tag" aria-label="Trạng thái hợp đồng: Bình Thường">Bình Thường</span>'),'net_status/contract_status appears as a compact tag');
for(const label of ['Độ tin cậy','Vị trí được chọn','Có dữ liệu hợp lệ','Nguồn kết nối','Nguồn kết luận','Vào ·','Ra ·','SN · —','IP WAN · —'])assert(!compactRows.includes(label),'Main table omits clutter: '+label);
assert.equal((compactRows.match(/<td(?:\s|>)/g)||[]).length,4*5,'Each customer uses five compact columns');
assert(compactRows.includes('Port hiện tại')&&compactRows.includes('Port g0/2'),'Only a real different location is presented in the main table');
for(const key of ['rx','tx','temperature','distance'])assert(new RegExp('data-onu-metric="'+key+'"[^>]*><dt>[^<]+</dt><dd>0 <small>').test(compactRows),'Zero measurement remains visible in its own metric cell: '+key);
const liveCells=compactRows.match(/<tr data-customer="0"[\s\S]*?<\/tr>/)[0].match(/<td[^>]*>[\s\S]*?<\/td>/g);
assert(liveCells[0].includes('LIVE')&&!liveCells[0].includes('SN ·'),'Customer cell no longer carries all ONU identity fields');
assert(liveCells[1].includes('MAC ·')&&!liveCells[1].includes('IP WAN'),'ONU identity gets its own column');
assert(liveCells[2].includes('Index')&&!liveCells[0].includes('Index'),'ONU index stays next to its PON');
assert(liveCells[0].includes('cp-state-tag')&&liveCells[2].includes('cp-membership-tag'),'Status and membership are subtle corner tags, not a largely empty column');
assert.equal((get('customerRows').innerHTML.match(/data-customer=/g)||[]).length,4);
const sourceStats=get('sourceStats').innerHTML;
get('conflictFilter').checked=true;get('conflictFilter').listeners.change();assert.equal((get('customerRows').innerHTML.match(/data-customer=/g)||[]).length,1);assert.equal(get('sourceStats').innerHTML,sourceStats);
get('resetFilters').click();
get('customerRows').listeners.click({target:{closest:()=>({dataset:{evidence:'2'},isConnected:true,focus(){}})}});
assert(get('evidenceDialog').open);const evidence=get('evidenceContent').innerHTML;
for(const value of ['Inside','CDP','OTHER-OLT','G0/8/1','Hợp đồng không khớp','Trạng thái khác nhau','Vị trí khác nhau','Giá trị phía System Radius','Giá trị phía CDP','OLD-CONTRACT'])assert(evidence.includes(value),'Compact details retain actionable evidence: '+value);
for(const removed of ['Lỗi nguồn và dữ liệu gốc','Không có lỗi nguồn được liệt kê','Xem nguyên bản ghi khách hàng','SOURCE_ERR','Kết luận và nguồn quyết định','Độ tin cậy','Vào / Ra','2026-10-26T10:00:00+07:00','<pre>','cp-evidence-grid'])assert(!evidence.includes(removed),'Customer summary omits technical clutter: '+removed);
assert(!evidence.includes('MOVED<&>'));get('closeEvidence').click();assert.equal(get('evidenceContent').innerHTML,'');
get('customerRows').listeners.click({target:{closest:()=>({dataset:{evidence:'0'},isConnected:true,focus(){}})}});
const ordinaryDetail=get('evidenceContent').innerHTML;
assert(ordinaryDetail.includes('Online')&&ordinaryDetail.includes('Port kiểm tra')&&ordinaryDetail.includes('0 / 0 dBm'),'Ordinary customer shows key status, Port and genuine zero values');
assert(!ordinaryDetail.includes('cp-difference')&&!ordinaryDetail.includes('cp-detail-alert')&&!ordinaryDetail.includes('<dd>—</dd>'),'No empty warnings or placeholder facts for a normal customer');
get('closeEvidence').click();
get('ponToggle').click();assert.equal(get('ponToggle').attrs['aria-expanded'],'true');assert.strictEqual(document.activeElement,get('ponSearch'));
get('ponSearch').value='g0/2';get('ponSearch').listeners.input();assert(get('ponOptions').innerHTML.includes('g0/2')&&!get('ponOptions').innerHTML.includes('g0/1'));
get('selectVisiblePorts').click();assert.equal(get('portsInput').value,'g0/1\ng0/2');get('selectVisiblePorts').click();assert.equal(get('portsInput').value,'g0/1\ng0/2','Bulk select does not duplicate ports');
get('ponPicker').listeners.keydown({key:'Escape',preventDefault(){}});assert.equal(get('ponPanel').hidden,true);assert.strictEqual(document.activeElement,get('ponToggle'));
get('oltInput').value='OTHER-OLT';get('oltInput').listeners.input();assert.equal(get('portsInput').value,'');assert(!get('ponOptions').innerHTML.includes('data-pick-port='));
get('manualPorts').value='G0/1, G0/1\nG0/2';get('addManualPorts').click();assert.equal(get('portsInput').value,'G0/1\nG0/2');assert(get('selectedPorts').innerHTML.includes('Chưa xác minh'));
const oldRows=get('customerRows').innerHTML;assert.equal(UI.load('{broken'),false);assert.equal(get('customerRows').innerHTML,oldRows);assert(get('inputError').textContent.includes('Kết quả trước đó'));
assert.equal(JSON.stringify(response),before,'No source mutations');
const allMoves={...response,result:{...response.result,customers:groups({unconfirmed:Object.keys(M.moves).map(status=>({contract:status,move_check:{status,confidence:'low'}}))}),unclassified_customers:[],count:{total:Object.keys(M.moves).length,observed_on_requested_pon:0,confirmed_offline:0,online_elsewhere:0,unconfirmed:Object.keys(M.moves).length,conflicts:0}}};
UI.load(allMoves);for(const [key,label] of Object.entries(M.moves))if(key!=='not_checked')assert(get('customerRows').innerHTML.includes(label),'Render every meaningful move outcome: '+label);
assert(!get('customerRows').innerHTML.includes('Chưa đối chiếu'),'Omit a non-result instead of filling the table with placeholder explanations');
assert(!get('customerRows').innerHTML.includes('is-online'),'Missing connection state is never inferred from a move outcome');
const unsafePort='g0/1"><img src=x>';
UI.load({...response,result:{...response.result,olt:{olt_name:'OTHER-OLT'},ports:{available_pon_ports:[unsafePort]},customers:groups(),unclassified_customers:[],count:{total:0}}});
get('ponSearch').value='';get('ponSearch').listeners.input();assert(!get('ponOptions').innerHTML.includes('<img'));assert(get('ponOptions').innerHTML.includes('&lt;img'));
get('selectVisiblePorts').click();assert(!get('selectedPorts').innerHTML.includes('<img'));
const many={...response,result:{...response.result,count:{total:61},customers:groups({observed_on_requested_pon:Array.from({length:61},(_,i)=>({contract:'CONTRACT-'+i,requested_location:{port_name:'g0/1'}}))}),unclassified_customers:[]}};
UI.load(many);assert.equal((get('customerRows').innerHTML.match(/data-customer=/g)||[]).length,61,'All customers render continuously without pagination');
get('customerSearch').value='CONTRACT-60';get('customerSearch').listeners.input();assert(get('customerRows').innerHTML.includes('CONTRACT-60'));assert(get('sourceStats').innerHTML.includes('<b>61</b>'));
const unknown={status:false,message:'Cannot read device',error:'FAILED<&>',result:{...response.result,customers:groups(),unclassified_customers:[{contract:'UNCLASSIFIED'}],count:{total:1,observed_on_requested_pon:0,confirmed_offline:0,online_elsewhere:0,unconfirmed:0,unclassified:1,conflicts:0}}};
UI.load(unknown);assert(get('resultState').textContent.includes('có lỗi'));assert(get('customerRows').innerHTML.includes('Chưa phân loại'));assert(!get('customerRows').innerHTML.includes('is-online'));assert(get('resultError').textContent.includes('FAILED<&>'));
UI.load({status:false,result:null,message:'No OLT',error:'No device'});assert(get('customerWorkspace').hidden);assert.equal(get('sourceStats').innerHTML,'');assert(get('resultError').textContent.includes('No OLT'),'Keep actual failures without the removed generic warning panel');
UI.load({...response,result:{...response.result,customers:groups(),unclassified_customers:[],count:{total:0,observed_on_requested_pon:0,confirmed_offline:0,online_elsewhere:0,unconfirmed:0,conflicts:0}}});assert(get('sourceStats').innerHTML.includes('<b>0</b>'));
assert.equal(networkCalls,0);
const tagged=JSON.parse(JSON.stringify(response));tagged.result.customers.observed_on_requested_pon[0].net_status='Tạm ngưng<&>';
UI.load(tagged);assert(get('customerRows').innerHTML.includes('class="cp-contract-tag" aria-label="Trạng thái hợp đồng: Tạm ngưng&lt;&amp;&gt;">Tạm ngưng&lt;&amp;&gt;</span>'),'Raw net_status takes priority, is tagged and safely escaped');
UI.load(mixed);assert(get('sourceStats').innerHTML.includes('<b>1</b>'));get('groupTabs').listeners.click({target:{closest:()=>({dataset:{group:'conflicts'}})}});
assert.equal((get('conflictRows').innerHTML.match(/data-conflict-evidence=/g)||[]).length,1,'Mixed imported response retains its genuine CDP warning');

(async()=>{
  let resolveOld;get('responseFile').files=[{name:'old.json',size:10,text:()=>new Promise(resolve=>resolveOld=resolve)}];const oldRead=get('responseFile').listeners.change();
  get('responseFile').files=[{name:'new.json',size:10,text:async()=>JSON.stringify(response)}];await get('responseFile').listeners.change();
  resolveOld(JSON.stringify(unknown));await oldRead;assert.equal(get('sourceName').textContent,'Nguồn: new.json','Late file reads cannot overwrite a newer import');
  get('responseFile').files=[{name:'huge.json',size:9*1024*1024,text:async()=>{throw Error('Should not read');}}];await get('responseFile').listeners.change();assert(get('inputError').textContent.includes('8 MB'));
  // Exact user-provided 103-customer response is bundled, not reconstructed.
  vm.runInNewContext(fs.readFileSync(path.join(base,'sample-response.js'),'utf8'),ctx);
  vm.runInNewContext(fs.readFileSync(path.join(base,'sample-hue-response.js'),'utf8'),ctx);
  vm.runInNewContext(fs.readFileSync(path.join(base,'sample-huep131-response.js'),'utf8'),ctx);
  const real=ctx.window.NETAUTO_PON_SAMPLE,realBefore=JSON.stringify(real),realParsed=M.parse(real);
  assert.equal(realParsed.rows.length,103);assert.equal(realParsed.conflicts.length,0,'History-only warnings are not valid CDP conflicts');
  assert.deepEqual(realParsed.rows.reduce((acc,row)=>(acc[row.group]=(acc[row.group]||0)+1,acc),{}),{observed_on_requested_pon:100,confirmed_offline:3});
  assert(!Object.hasOwn(real.result.customers,'online')&&!Object.hasOwn(real.result.customers,'offline'),'No ambiguous aliases in the new response');
  assert.equal(realParsed.rows.filter(row=>row.conflicts.length>0).length,0,'Old contract histories no longer mark customers as conflicting');
  assert.equal(real.result.count.total,103);assert.equal(real.result.ports.available_pon_ports.length,16);
  ctx.window.location.search='';vm.runInNewContext(fs.readFileSync(path.join(base,'app.js'),'utf8'),ctx);
  assert.equal(get('oltInput').value,'HCMP45608GC16');assert.equal(get('portsInput').value,'g0/1');
  assert(get('importStatus').textContent.includes('không phải kết quả kiểm tra mới'));
  assert.equal((get('ponOptions').innerHTML.match(/data-pick-port=/g)||[]).length,16);
  assert.deepEqual([...get('sourceStats').innerHTML.matchAll(/<b>(\d+)<\/b>/g)].map(m=>Number(m[1])),[103,100,3,0,0,0]);
  assert.equal((get('customerRows').innerHTML.match(/data-customer=/g)||[]).length,103);
  assert(!get('customerRows').innerHTML.includes('Một MAC · nhiều HĐ'));
  assert(get('resultError').hidden,'Successful legacy source warning summary is not displayed');
  const selectGroup=key=>get('groupTabs').listeners.click({target:{closest:()=>({dataset:{group:key}})}});
  selectGroup('conflicts');assert.equal(get('conflictTable').hidden,false);assert.equal(get('customerTable').hidden,true);
  assert.equal((get('conflictRows').innerHTML.match(/data-conflict-evidence=/g)||[]).length,0);
  assert(get('viewCount').textContent.includes('không cộng vào 103 khách'));
  selectGroup('confirmed_offline');assert.equal((get('customerRows').innerHTML.match(/data-customer=/g)||[]).length,3);
  const reused=realParsed.rows.find(row=>row.customer.move_check?.device_index_check?.status==='index_reused');assert(reused);
  const reusedMarkup=get('customerRows').innerHTML.split(`data-customer="${reused.id}"`)[1].split('</tr>')[0];
  assert(reusedMarkup.includes('chưa có thông tin')&&!reusedMarkup.includes('Rx / Tx · — / —'),'Do not borrow optical values or render empty measurement fields');
  get('customerRows').listeners.click({target:{closest:()=>({dataset:{evidence:String(reused.id)},isConnected:true,focus(){}})}});
  assert(get('evidenceContent').innerHTML.includes('Không lấy công suất tại index này'));
  assert(get('evidenceContent').innerHTML.includes('Index đang thuộc ONU khác'));
  get('closeEvidence').click();
  selectGroup('online_elsewhere');assert(get('customerRows').innerHTML.includes('Không có khách hàng'));
  assert.equal(JSON.stringify(real),realBefore,'Viewing and filtering preserve the original data');
  const hue=ctx.window.NETAUTO_PON_SAMPLES[1],hueBefore=JSON.stringify(hue);
  assert.equal(hue.result.olt.olt_name,'HUEP00602GC16');assert.equal(M.parse(hue).rows.length,52);
  assert(get('oltSelect').innerHTML.includes('HUEP00602GC16')&&get('oltSelect').innerHTML.includes('HCMP45608GC16'),'Both supplied OLTs are selectable');
  const chooseOlt=value=>{get('oltSelect').value=value;get('oltSelect').listeners.change();};
  get('customerSearch').value='old-filter';get('customerSearch').listeners.input();
  get('ponSearch').value='g0/2';chooseOlt('HUEP00602GC16');
  assert.equal(get('resultDevice').textContent,'HUEP00602GC16');assert.equal(get('oltInput').value,'HUEP00602GC16');
  assert.equal(get('portsInput').value,'g0/16');assert.equal(get('ponSearch').value,'');assert.equal(get('customerSearch').value,'');
  assert.equal((get('customerRows').innerHTML.match(/data-customer=/g)||[]).length,52);
  assert.deepEqual([...get('sourceStats').innerHTML.matchAll(/<b>(\d+)<\/b>/g)].map(m=>Number(m[1])),[52,49,3,0,0,0]);
  assert(get('portsSummary').innerHTML.includes('g0/16'));assert.equal((get('ponOptions').innerHTML.match(/data-pick-port=/g)||[]).length,16);
  for(const key of ['observed_on_requested_pon','confirmed_offline','conflicts'])assert(get('sourceStats').innerHTML.includes(`data-stat="${key}"`));
  get('loadSample').click();assert.equal(get('resultDevice').textContent,'HUEP00602GC16','View sample reloads the selected OLT');
  chooseOlt('HCMP45608GC16');assert.equal(get('portsInput').value,'g0/1');assert.equal((get('customerRows').innerHTML.match(/data-customer=/g)||[]).length,103);
  let resolvePending;get('responseFile').files=[{name:'pending.json',size:10,text:()=>new Promise(resolve=>resolvePending=resolve)}];const pendingRead=get('responseFile').listeners.change();
  chooseOlt('HUEP00602GC16');resolvePending(JSON.stringify(response));await pendingRead;
  assert.equal(get('resultDevice').textContent,'HUEP00602GC16','A pending file must not overwrite an OLT selection');
  chooseOlt('__manual__');assert.equal(get('oltInput').hidden,false);assert(get('resultSection').hidden&&get('customerWorkspace').hidden,'Manual entry hides the previous OLT result');
  chooseOlt('HCMP45608GC16');assert.equal(get('oltInput').hidden,true);assert(!get('customerWorkspace').hidden);
  assert.equal(JSON.stringify(hue),hueBefore);assert.equal(JSON.stringify(real),realBefore,'Switching OLTs preserves both original responses');
  const huep131=ctx.window.NETAUTO_PON_SAMPLES[2],huep131Before=JSON.stringify(huep131),parsed131=M.parse(huep131);
  assert.equal(ctx.window.NETAUTO_PON_SAMPLES.length,3);
  assert.equal(huep131.result.olt.olt_name,'HUEP13106GC16');assert.equal(parsed131.rows.length,79);assert.equal(parsed131.conflicts.length,1);
  const linked131=parsed131.rows.filter(row=>row.conflicts.length);
  assert.equal(linked131.length,2,'The source repeats this identity across observed and online-elsewhere groups; preserve both source rows');
  assert.equal(new Set(linked131.map(row=>row.customer.onu_mac)).size,1);
  assert.equal(parsed131.conflicts.length,1,'The shared reference must still count as one CDP warning');
  assert(get('oltSelect').innerHTML.includes('HUEP13106GC16'));
  chooseOlt('HUEP13106GC16');
  assert.equal(get('resultDevice').textContent,'HUEP13106GC16');assert.equal(get('portsInput').value,'g0/9');assert.equal(get('oltSelect').value,'HUEP13106GC16');
  assert(get('importStatus').textContent.includes('27/10/2026'));
  assert.equal((get('customerRows').innerHTML.match(/data-customer=/g)||[]).length,79);
  assert.deepEqual([...get('sourceStats').innerHTML.matchAll(/<b>(\d+)<\/b>/g)].map(m=>Number(m[1])),[79,76,1,2,0,1]);
  assert.equal((get('ponOptions').innerHTML.match(/data-pick-port=/g)||[]).length,16);
  selectGroup('confirmed_offline');assert.equal((get('customerRows').innerHTML.match(/data-customer=/g)||[]).length,1);
  selectGroup('online_elsewhere');assert.equal((get('customerRows').innerHTML.match(/data-customer=/g)||[]).length,2);
  assert(get('customerRows').innerHTML.includes('g0/13'),'Keep the actual target PON in the new moved-customer case');
  selectGroup('conflicts');assert.equal((get('conflictRows').innerHTML.match(/data-conflict-evidence=/g)||[]).length,1);
  get('conflictRows').listeners.click({target:{closest:()=>({dataset:{conflictEvidence:String(parsed131.conflicts[0].id)},isConnected:true,focus(){}})}});
  assert(get('evidenceContent').innerHTML.includes('Hợp đồng không khớp'));
  for(const value of [huep131.result.customers.conflicts[0].different_fields[0].device_value,huep131.result.customers.conflicts[0].different_fields[0].csoc_value])assert(get('evidenceContent').innerHTML.includes(M.esc(value)));
  get('closeEvidence').click();
  chooseOlt('HUEP00602GC16');assert.equal((get('customerRows').innerHTML.match(/data-customer=/g)||[]).length,52);
  assert.equal(JSON.stringify(huep131),huep131Before,'New real response is never changed by rendering or selection');
  assert.equal(networkCalls,0);
  assert(!fs.readFileSync(path.join(base,'app.js'),'utf8').includes('localStorage'),'Customer data is never persisted');
  console.log('PASS: switching three real OLT samples (103/52/79 customers), new 1 Offline/2 elsewhere/1 CDP conflict case, source dates, Port/reset/import isolation and no live requests.');
})().catch(e=>{console.error(e);process.exitCode=1;});
