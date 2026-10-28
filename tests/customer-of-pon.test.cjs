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
for(const value of [null,undefined,'','  ','None','NONE','null',' Null ','N/a',' n/A '])assert.equal(M.text(value),'-','Missing value displays as a hyphen');
assert.equal(M.text(0),'0');assert.equal(M.text(false),'false');assert.equal(M.location({olt_name:'None',port:'N/a',slot:'',onu_index:null}),'-');
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
const sharedMac='00:11:22:33:44:55';
const grouped={status:true,result:{olt:response.result.olt,ports:response.result.ports,count:{total:2},pon_results:[
  {pon_port:'g0/1',customers:groups({observed_on_requested_pon:[{contract:'SAME',onu_mac:sharedMac}],conflicts:[{type:'customer_data_mismatch',matched_by:'mac',onu_mac:sharedMac,sources:['olt_device','cdp_csoc'],different_fields:[{field:'onu_index',device_value:'0/1/1',csoc_value:'0/1/2',conflicting_source:'cdp_csoc'}]}]})},
  {pon_port:'g0/2',customers:groups({observed_on_requested_pon:[{contract:'SAME',onu_mac:sharedMac}]})},
]}};
const parsedGrouped=M.parse(grouped);assert.equal(parsedGrouped.rows.length,2);assert.equal(parsedGrouped.rows[0].conflicts.length,1);assert.equal(parsedGrouped.rows[1].conflicts.length,0,'A matching MAC on another PON must not inherit a conflict');
assert.equal(M.filter(parsedGrouped.rows,{port:'g0/2'}).length,1,'Grouped PON filters work without customer requested_location');
assert(!Object.hasOwn(grouped.result,'customers'),'Do not add a fabricated flat section to the grouped response');
assert.throws(()=>M.parse({...grouped,result:{...grouped.result,pon_results:{}}}));
assert.throws(()=>M.parse({...grouped,result:{...grouped.result,pon_results:[{pon_port:'g0/1',customers:{}}]}}));

const html=fs.readFileSync(path.join(base,'mockup.html'),'utf8'),nodes=new Map(),groupButtons=[];
let document;
function element(id){return {id,innerHTML:'',textContent:'',value:'',scrollLeft:0,hidden:false,disabled:false,checked:false,dataset:{},attrs:{},listeners:{},isConnected:true,
  addEventListener(event,fn){this.listeners[event]=fn;},setAttribute(k,v){this.attrs[k]=v;},focus(){document.activeElement=this;},
  querySelectorAll(){return [];},contains(target){return target===this;},showModal(){this.open=true;},close(){this.open=false;this.listeners.close?.();},
  getBoundingClientRect(){return {left:100,right:900,top:100,bottom:700};},click(){this.listeners.click?.({target:this});},remove(){},
};}
for(const m of html.matchAll(/id="([^"]+)"/g)){assert(!nodes.has(m[1]));nodes.set(m[1],element(m[1]));}
for(const m of html.matchAll(/data-group="([^"]+)"/g)){const n=element('');n.dataset.group=m[1];groupButtons.push(n);}
const get=id=>{assert(nodes.has(id),'Missing real ID '+id);return nodes.get(id);};
for(const prefix of ['customer','conflict'])get(prefix+'HeadSource').innerHTML=html.match(new RegExp('<thead id="'+prefix+'HeadSource"[^>]*>([\\s\\S]*?)</thead>'))[1];
get('resultSection').hidden=true;
document={activeElement:null,documentElement:{dataset:{theme:'light'}},getElementById:get,querySelectorAll:()=>groupButtons,addEventListener(){},body:{append(){}},createElement(){const a=element('');a.click=()=>{document.download=a.download;};return a;}};
let networkCalls=0;
const ctx={document,window:{NETAUTO_CUSTOMER_PON:M,location:{search:'?olt=TEST-OLT&pon=g0%2F1&pon=g0%2F2&pon=g0%2F3'}},URLSearchParams,setTimeout(fn){fn();},fetch(){networkCalls++;throw Error('Network forbidden');}};
vm.runInNewContext(fs.readFileSync(path.join(base,'app.js'),'utf8'),ctx);
const UI=ctx.window.NETAUTO_CUSTOMER_PON_UI;
assert.equal(get('portsInput').value,'g0/1\ng0/2','URL prefill is capped at two Ports');assert(get('selectedPorts').innerHTML.includes('Chưa xác minh'));
assert(html.indexOf('id="oltSelect"')<html.indexOf('class="cp-form"'),'OLT selection is above the full-width Port grid');
assert.equal(get('customerRows').innerHTML,'','No invented initial customer rows');
assert(UI.load(response,'REAL-FILE.json'));assert(get('importStatus').textContent.includes('REAL-FILE.json'));assert(!html.includes('id="sourceName"'));
for(const label of ['Tổng khách hàng','Kh.H có MAC trên port PON','Khách hàng Offline','Cần kiểm tra'])assert(get('sourceStats').innerHTML.includes(label),'Use the requested summary label: '+label);
for(const label of ['Khách hàng kết nối nơi khác','Chưa đủ dữ liệu'])assert(!get('sourceStats').innerHTML.includes(label),'Remove only the unwanted overview cards: '+label);
assert(!html.includes('Phân biệt khách đang thấy trên Port, khách đã chuyển vị trí và dữ liệu cần xác minh.'));
assert.equal((get('customerVisualHead').innerHTML.match(/scope="col"/g)||[]).length,15,'Split visual header retains the fifteen visible column labels');
assert(!get('conflictVisualHead').innerHTML.includes('id="'),'Visual header must not duplicate IDs from the semantic header');
get('customerTable').scrollLeft=350;get('customerTable').listeners.scroll();assert.equal(get('customerFixedHeader').scrollLeft,350);
get('customerFixedHeader').scrollLeft=90;get('customerFixedHeader').listeners.scroll();assert.equal(get('customerTable').scrollLeft,90,'Header and body stay aligned when scrolled from either area');
get('conflictTable').scrollLeft=240;get('conflictTable').listeners.scroll();assert.equal(get('conflictFixedHeader').scrollLeft,240);
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
assert.equal((compactRows.match(/<td(?:\s|>)/g)||[]).length,4*15,'Each customer uses fifteen single-value columns');
for(const key of ['current-location','move','comparison'])assert(!compactRows.includes(`data-column="${key}"`),'Location and difference information belongs in the comparison dialog');
assert(compactRows.includes('>Đối chiếu</button>')&&!compactRows.includes('>Chi tiết</button>'),'Customer action is named Đối chiếu');
for(const key of ['rx','tx','temperature','distance'])assert(new RegExp('data-onu-metric="'+key+'">0</td>').test(compactRows),'Zero measurement remains visible as a plain table value: '+key);
const liveCells=compactRows.match(/<tr data-customer="0"[\s\S]*?<\/tr>/)[0].match(/<td[^>]*>[\s\S]*?<\/td>/g);
assert(liveCells[0].includes('LIVE')&&!liveCells[0].includes('cp-state-tag'),'Customer identity is separate from connection state');
assert(liveCells[7].includes('MAC')&&liveCells[7].includes('<code>'),'MAC has its own column');
assert(liveCells[5].includes('data-column="index"')&&liveCells[5].includes('>0</td>'),'ONU index is a single plain value');
assert(liveCells[1].includes('cp-contract-tag')&&liveCells[2].includes('cp-state-tag'),'Contract and ONU statuses are tagged in separate columns');
for(const key of ['customer','contract-state','state','presence','port','index','model','mac','serial','ipwan','rx','tx','temperature','distance'])assert(compactRows.includes(`data-column="${key}"`));
assert(liveCells[3].includes('cp-presence is-seen')&&liveCells[3].includes('aria-label="Có MAC trên Port PON"'));
const absentCells=compactRows.match(/<tr data-customer="1"[\s\S]*?<\/tr>/)[0].match(/<td[^>]*>[\s\S]*?<\/td>/g);
assert(absentCells[3].includes('cp-presence is-absent')&&!absentCells[3].includes('cp-state-tag'),'MAC presence is independent from the ONU connection state');
assert(!/<(?:div|dl|dt|dd|small)\b/.test(compactRows),'No stacked information blocks inside customer rows');
assert(!compactRows.includes('cp-port-name')&&!compactRows.includes('cp-issue-tag'),'Only contract and ONU states use tags');
assert.equal((get('customerRows').innerHTML.match(/data-customer=/g)||[]).length,4);
const sourceStats=get('sourceStats').innerHTML;
get('conflictFilter').checked=true;get('conflictFilter').listeners.change();assert.equal((get('customerRows').innerHTML.match(/data-customer=/g)||[]).length,1);assert.equal(get('sourceStats').innerHTML,sourceStats);
get('resetFilters').click();
get('customerRows').listeners.click({target:{closest:()=>({dataset:{evidence:'2'},isConnected:true,focus(){}})}});
assert(get('evidenceDialog').open);const evidence=get('evidenceContent').innerHTML;
for(const value of ['Inside','CDP','OTHER-OLT','G0/8/1','Port hiện tại','Port g0/2','Hợp đồng không khớp','Trạng thái khác nhau','Vị trí khác nhau','Giá trị phía System Radius','Giá trị phía CDP','OLD-CONTRACT',M.moveLabel('moved_to_other_pon')])assert(evidence.includes(value),'Comparison retains location, conclusion and actionable differences: '+value);
for(const removed of ['Lỗi nguồn và dữ liệu gốc','Không có lỗi nguồn được liệt kê','Xem nguyên bản ghi khách hàng','SOURCE_ERR','Kết luận và nguồn quyết định','Độ tin cậy','Vào / Ra','2026-10-26T10:00:00+07:00','<pre>','cp-evidence-grid'])assert(!evidence.includes(removed),'Customer summary omits technical clutter: '+removed);
assert(!evidence.includes('MOVED<&>'));get('closeEvidence').click();assert.equal(get('evidenceContent').innerHTML,'');
get('customerRows').listeners.click({target:{closest:()=>({dataset:{evidence:'0'},isConnected:true,focus(){}})}});
const ordinaryDetail=get('evidenceContent').innerHTML;
assert(ordinaryDetail.includes('Online')&&ordinaryDetail.includes('Port kiểm tra')&&ordinaryDetail.includes('0 / 0 dBm'),'Ordinary customer shows key status, Port and genuine zero values');
assert(!ordinaryDetail.includes('cp-difference')&&!ordinaryDetail.includes('cp-detail-alert')&&!ordinaryDetail.includes('<dd>—</dd>'),'No empty warnings or placeholder facts for a normal customer');
get('closeEvidence').click();
assert(!html.includes('id="ponToggle"')&&!html.includes('id="ponPanel"'),'Port selection is an always-visible simulator');
assert(!get('ponOptions').innerHTML.includes('cp-fiber-socket')&&get('ponOptions').innerHTML.includes('cp-pon-port is-selected'),'Compact rectangular Ports have no socket illustration');
assert(!html.includes('id="ponSearch"'),'The Port search input is removed');
get('ponOptions').listeners.change({target:{dataset:{pickPort:'g0/2'},checked:true}});assert.equal(get('portsInput').value,'g0/1\ng0/2');
get('oltInput').value='OTHER-OLT';get('oltInput').listeners.input();assert.equal(get('portsInput').value,'');assert(!get('ponOptions').innerHTML.includes('data-pick-port='));
const oldRows=get('customerRows').innerHTML;assert.equal(UI.load('{broken'),false);assert.equal(get('customerRows').innerHTML,oldRows);assert(get('inputError').textContent.includes('Kết quả trước đó'));
assert.equal(JSON.stringify(response),before,'No source mutations');
const allMoves={...response,result:{...response.result,customers:groups({unconfirmed:Object.keys(M.moves).map(status=>({contract:status,move_check:{status,confidence:'low'}}))}),unclassified_customers:[],count:{total:Object.keys(M.moves).length,observed_on_requested_pon:0,confirmed_offline:0,online_elsewhere:0,unconfirmed:Object.keys(M.moves).length,conflicts:0}}};
UI.load(allMoves);for(const [id,[key,label]] of Object.entries(M.moves).entries())if(key!=='not_checked'){
  get('customerRows').listeners.click({target:{closest:()=>({dataset:{evidence:String(id)},isConnected:true,focus(){}})}});
  assert(get('evidenceContent').innerHTML.includes(label),'Every meaningful move outcome remains available inside comparison: '+label);get('closeEvidence').click();
}
assert(!get('customerRows').innerHTML.includes('Chưa đối chiếu'),'Omit a non-result instead of filling the table with placeholder explanations');
assert(!get('customerRows').innerHTML.includes('is-online'),'Missing connection state is never inferred from a move outcome');
const unsafePort='g0/1"><img src=x>';
UI.load({...response,result:{...response.result,olt:{olt_name:'OTHER-OLT'},ports:{available_pon_ports:[unsafePort]},customers:groups(),unclassified_customers:[],count:{total:0}}});
assert(!get('ponOptions').innerHTML.includes('<img'));assert(get('ponOptions').innerHTML.includes('&lt;img'));
get('ponOptions').listeners.change({target:{dataset:{pickPort:unsafePort},checked:true}});assert(!get('selectedPorts').innerHTML.includes('<img'));
const many={...response,result:{...response.result,count:{total:61},customers:groups({observed_on_requested_pon:Array.from({length:61},(_,i)=>({contract:'CONTRACT-'+i,requested_location:{port_name:'g0/1'}}))}),unclassified_customers:[]}};
UI.load(many);assert.equal((get('customerRows').innerHTML.match(/data-customer=/g)||[]).length,61,'All customers render continuously without pagination');
get('customerSearch').value='CONTRACT-60';get('customerSearch').listeners.input();assert(get('customerRows').innerHTML.includes('CONTRACT-60'));assert(get('sourceStats').innerHTML.includes('<b>61</b>'));
const unknown={status:false,message:'Cannot read device',error:'FAILED<&>',result:{...response.result,customers:groups(),unclassified_customers:[{contract:'UNCLASSIFIED'}],count:{total:1,observed_on_requested_pon:0,confirmed_offline:0,online_elsewhere:0,unconfirmed:0,unclassified:1,conflicts:0}}};
UI.load(unknown);assert(get('resultState').textContent.includes('có lỗi'));assert(get('customerRows').innerHTML.includes('UNCLASSIFIED'));assert(!get('customerRows').innerHTML.includes('is-online'));assert(get('resultError').textContent.includes('FAILED<&>'));
UI.load({status:false,result:null,message:'No OLT',error:'No device'});assert(get('customerWorkspace').hidden);assert.equal(get('sourceStats').innerHTML,'');assert(get('resultError').textContent.includes('No OLT'),'Keep actual failures without the removed generic warning panel');
UI.load({...response,result:{...response.result,customers:groups(),unclassified_customers:[],count:{total:0,observed_on_requested_pon:0,confirmed_offline:0,online_elsewhere:0,unconfirmed:0,conflicts:0}}});assert(get('sourceStats').innerHTML.includes('<b>0</b>'));
assert.equal(networkCalls,0);
const tagged=JSON.parse(JSON.stringify(response));tagged.result.customers.observed_on_requested_pon[0].net_status='Tạm ngưng<&>';
UI.load(tagged);assert(get('customerRows').innerHTML.includes('class="cp-contract-tag" aria-label="Trạng thái hợp đồng: Tạm ngưng&lt;&amp;&gt;">Tạm ngưng&lt;&amp;&gt;</span>'),'Raw net_status takes priority, is tagged and safely escaped');
UI.load(mixed);assert(get('sourceStats').innerHTML.includes('<b>1</b>'));get('groupTabs').listeners.click({target:{closest:()=>({dataset:{group:'conflicts'}})}});
assert.equal((get('conflictRows').innerHTML.match(/data-conflict-evidence=/g)||[]).length,1,'Mixed imported response retains its genuine CDP warning');

// Current OLT/CDP schema: no external connection source; missing CDP fields remain conflicts.
const deviceFacts={olt_name:'TEST-OLT',pon_port:'g0/1',onu_mac:'00:11:22:33:44:55',onu_sn:'DEVICE-SN',onu_index:'0/1/7'};
const cdpFacts={...deviceFacts,contract:'CDP-CUSTOMER',onu_sn:null,onu_index:'0/1/99'};
const currentFlow={status:true,error:null,result:{...response.result,customers:groups({
  observed_on_requested_pon:[{contract:'CDP-CUSTOMER',contract_status:'Bình Thường',customer_state:'Online',onu_mac:deviceFacts.onu_mac,onu_sn:deviceFacts.onu_sn,onu_index:deviceFacts.onu_index,requested_location:{olt_name:'TEST-OLT',port_name:'g0/1'},source_values:{olt_device:deviceFacts,cdp_csoc:cdpFacts},data_sources:{customer_profile:'cdp_csoc',presence:'olt_device'},onu:{onu_rx:0,onu_tx:0}}],
  unconfirmed:[{contract:'CDP-ONLY',customer_state:'Unknown',membership:'cdp_only',requested_location:{olt_name:'TEST-OLT',port_name:'g0/1'},source_values:{olt_device:null,cdp_csoc:{...cdpFacts,contract:'CDP-ONLY',onu_mac:'00:11:22:33:44:66'}},data_sources:{presence:'cdp_csoc'},onu:null}],
  conflicts:[{type:'customer_data_mismatch',matched_by:'mac',contract:'CDP-CUSTOMER',onu_mac:deviceFacts.onu_mac,sources:['olt_device','cdp_csoc'],selected_for_profile:false,different_fields:[
    {field:'onu_sn',device_value:'DEVICE-SN',csoc_value:null,reason:'missing_on_one_source',conflicting_source:'cdp_csoc'},
    {field:'onu_index',device_value:'0/1/7',csoc_value:'0/1/99',reason:'value_mismatch',conflicting_source:'csoc_radius'},
  ]}],
}),unclassified_customers:[],count:{total:2,observed_on_requested_pon:1,confirmed_offline:0,online_elsewhere:0,unconfirmed:1,conflicts:1}}};
const flowBefore=JSON.stringify(currentFlow),parsedFlow=M.parse(currentFlow);
assert.equal(parsedFlow.conflicts[0].record.different_fields.length,2,'Do not discard missing CDP fields from the new workflow');
assert.equal(M.sourceLabel('cdp_csoc'),'CDP');assert.equal(M.identityValues(parsedFlow.rows[0].customer).onu_index,'0/1/7');
assert.equal(M.identityValues({source_values:{olt_device:{onu_index:null},cdp_csoc:{onu_index:'0/1/99'}},onu_index:'0/1/99'}).onu_index,null,'Never substitute a CDP index for an explicitly missing device index');
UI.load(currentFlow);
assert.equal(get('conflictLeftLabel').textContent,'Thiết bị OLT');
const flowRow=get('customerRows').innerHTML.match(/<tr data-customer="0"[\s\S]*?<\/tr>/)[0];
assert(!flowRow.includes('CDP thiếu SN')&&!flowRow.includes('ONU index không khớp'),'Differences do not occupy extra main-table columns');
assert(flowRow.includes('0/1/7')&&!flowRow.includes('0/1/99'),'Main index is the OLT index used for telemetry');
assert(!get('customerRows').innerHTML.includes('is-offline'),'CDP-only membership must not imply Offline');
get('customerRows').listeners.click({target:{closest:()=>({dataset:{evidence:'0'},isConnected:true,focus(){}})}});
assert(get('evidenceContent').innerHTML.includes('cp-source-comparison')&&get('evidenceContent').innerHTML.includes('CDP thiếu SN'));
assert(get('evidenceContent').innerHTML.includes('0/1/7')&&get('evidenceContent').innerHTML.includes('0/1/99'));
for(const label of ['MAC','SN','ONU index'])assert(!get('evidenceContent').innerHTML.includes(`<dt>${label}</dt>`),'Source identities are not repeated in the summary: '+label);
assert(get('evidenceContent').innerHTML.includes('OLT / Port')&&get('evidenceContent').innerHTML.includes('class="is-different"'),'Compact comparison combines location and marks differing source values');
assert(!get('evidenceContent').innerHTML.includes('System Radius')&&!get('evidenceContent').innerHTML.includes('Inside'),'New source facts are labelled OLT/CDP');
get('closeEvidence').click();
get('groupTabs').listeners.click({target:{closest:()=>({dataset:{group:'conflicts'}})}});
assert(get('conflictRows').innerHTML.includes('>-</span>')&&get('conflictRows').innerHTML.includes('Bản ghi CDP khác'));
assert.equal(JSON.stringify(currentFlow),flowBefore,'Keep the complete new response unchanged');

// Multiple PONs use tabs; a known empty PON differs from a draft Port with no response.
const multiPon=JSON.parse(JSON.stringify(response));
multiPon.result.ports={requested_ports:['g0/1','g0/2','g0/3'],valid_ports:['g0/1','g0/2','g0/3'],invalid_ports:[],available_pon_ports:['g0/1','g0/2','g0/3','g0/4']};
multiPon.result.customers=groups({observed_on_requested_pon:[{contract:'PORT-ONE',customer_state:'Online',requested_location:{port_name:'g0/1'}},{contract:'PORT-TWO',customer_state:'Online',requested_location:{port_name:'g0/2'}}],unconfirmed:[{contract:'PORT-TWO-UNKNOWN',customer_state:'Unknown',requested_location:{port_name:'g0/2'}}],conflicts:[{type:'customer_data_mismatch',matched_by:'contract',contract:'PORT-TWO',sources:['olt_device','cdp_csoc'],different_fields:[{field:'onu_index',device_value:'0/2/1',csoc_value:'0/2/2',conflicting_source:'cdp_csoc',reason:'value_mismatch'}]}]});
multiPon.result.unclassified_customers=[];multiPon.result.count={total:3,observed_on_requested_pon:2,confirmed_offline:0,online_elsewhere:0,unconfirmed:1,conflicts:1};
get('oltInput').value='TEST-OLT';get('oltInput').listeners.input();UI.load(multiPon);
const choosePort=value=>get('portTabs').listeners.click({target:{closest:()=>({dataset:{portTab:value}})}});
const pickPort=(port,checked)=>get('ponOptions').listeners.change({target:{dataset:{pickPort:port},checked}});
assert.equal(get('portTabs').hidden,false);assert.equal((get('customerRows').innerHTML.match(/data-customer=/g)||[]).length,1);
assert.equal(get('portsInput').value,'g0/1\ng0/2');
assert(!get('portTabs').innerHTML.includes('data-port-tab=""')&&!get('portTabs').innerHTML.includes('Tất cả'),'No merged all-Port tab');
choosePort('g0/2');assert.equal(get('portFilter').value,'g0/2');assert.equal((get('customerRows').innerHTML.match(/data-customer=/g)||[]).length,2);
assert(get('customerRows').innerHTML.includes('PORT-TWO')&&!get('customerRows').innerHTML.includes('PORT-ONE'));
get('customerSearch').value='UNKNOWN';get('customerSearch').listeners.input();assert.equal((get('customerRows').innerHTML.match(/data-customer=/g)||[]).length,1);assert.equal(get('portFilter').value,'g0/2');
get('customerSearch').value='';get('customerSearch').listeners.input();
get('groupTabs').listeners.click({target:{closest:()=>({dataset:{group:'conflicts'}})}});assert.equal((get('conflictRows').innerHTML.match(/data-conflict-evidence=/g)||[]).length,1);
choosePort('g0/1');assert(!get('conflictRows').innerHTML.includes('data-conflict-evidence='),'Port tabs filter the conflict table as well');
get('resetFilters').click();assert.equal(get('portFilter').value,'g0/1','Reset preserves the active Port');
pickPort('g0/3',true);assert.equal(get('portsInput').value,'g0/1\ng0/2');assert(get('inputError').textContent.includes('tối đa 2'));
choosePort('g0/3');assert.equal(get('portFilter').value,'g0/1','An unselected Port cannot become active');
pickPort('g0/1',false);pickPort('g0/3',true);choosePort('g0/3');assert(get('customerRows').innerHTML.includes('Không có khách hàng khớp bộ lọc.')&&!get('customerRows').innerHTML.includes('Chưa có dữ liệu của Port'),'A tested empty Port is not an unqueried Port');
pickPort('g0/2',false);pickPort('g0/4',true);
assert(get('portTabs').innerHTML.includes('Chưa có dữ liệu'));
choosePort('g0/4');assert(get('customerRows').innerHTML.includes('Chưa có dữ liệu của Port g0/4'));
assert(!get('customerRows').innerHTML.includes('data-customer='),'Do not fabricate customers for a newly selected Port');
get('resetFilters').click();assert.equal(get('portFilter').value,'g0/4');assert(!get('customerRows').innerHTML.includes('data-customer='));
assert(get('sourceStats').innerHTML.includes('<b>-</b>'),'Unqueried Port has no fabricated count');
pickPort('g0/3',false);pickPort('g0/4',false);assert.equal(get('portsInput').value,'');assert(get('customerRows').innerHTML.includes('Chọn một Port PON'));assert(!get('customerRows').innerHTML.includes('data-customer='));
const nullRows=[null,'None','null','N/a',''].map(value=>({contract:value,contract_status:value,customer_state:value,onu_mac:value,onu_sn:value,onu_index:value,ipwan:value,requested_location:{port_name:'g0/1'},onu:{onu_model:value,onu_rx:value,onu_tx:value,onu_temp:value,onu_olt_distance:value}}));
UI.load({...response,result:{...response.result,customers:groups({observed_on_requested_pon:nullRows}),unclassified_customers:[],count:{total:nullRows.length,observed_on_requested_pon:nullRows.length,confirmed_offline:0,online_elsewhere:0,unconfirmed:0,conflicts:0}}});
assert.equal((get('customerRows').innerHTML.match(/data-onu-metric="rx">-<\/td>/g)||[]).length,nullRows.length);
assert(!/>\s*(?:None|null|N\/a)\s*</i.test(get('customerRows').innerHTML),'Missing markers are normalized only for display');

(async()=>{
  let resolveOld;get('responseFile').files=[{name:'old.json',size:10,text:()=>new Promise(resolve=>resolveOld=resolve)}];const oldRead=get('responseFile').listeners.change();
  get('responseFile').files=[{name:'new.json',size:10,text:async()=>JSON.stringify(response)}];await get('responseFile').listeners.change();
  resolveOld(JSON.stringify(unknown));await oldRead;assert(get('importStatus').textContent.includes('new.json'),'Late file reads cannot overwrite a newer import');
  get('responseFile').files=[{name:'huge.json',size:9*1024*1024,text:async()=>{throw Error('Should not read');}}];await get('responseFile').listeners.change();assert(get('inputError').textContent.includes('8 MB'));
  // Exact post-conversion response: one OLT, four PON result groups.
  vm.runInNewContext(fs.readFileSync(path.join(base,'sample-current-response.js'),'utf8'),ctx);
  const real=ctx.window.NETAUTO_PON_SAMPLE,realBefore=JSON.stringify(real),realParsed=M.parse(real);
  assert.equal(realParsed.rows.length,310);assert.equal(realParsed.conflicts.length,3);
  assert.equal(ctx.window.NETAUTO_PON_SAMPLES.length,1);
  assert(!Object.hasOwn(real.result,'customers')&&real.result.pon_results.length===4,'The supplied response is grouped by PON');
  assert.deepEqual(realParsed.rows.reduce((acc,row)=>(acc[row.group]=(acc[row.group]||0)+1,acc),{}),{observed_on_requested_pon:306,unconfirmed:4});
  for(const section of real.result.pon_results){
    assert.equal(M.filter(realParsed.rows,{port:section.pon_port}).length,section.count.total);
    assert.equal(realParsed.conflicts.filter(item=>item.ponPort===section.pon_port).length,section.count.conflicts);
  }
  ctx.window.location.search='';vm.runInNewContext(fs.readFileSync(path.join(base,'app.js'),'utf8'),ctx);
  assert.equal(get('oltInput').value,'HUEP13106GC16');assert.equal(get('portsInput').value,'g0/1\ng0/3');
  assert(get('importStatus').textContent.includes('28/10/2026'));
  assert(get('oltSelect').innerHTML.includes('HUEP13106GC16')&&!get('oltSelect').innerHTML.includes('HCMP45608GC16')&&!get('oltSelect').innerHTML.includes('HUEP00602GC16'),'Only the current OLT sample is offered');
  for(const name of ['sample-response.js','sample-hue-response.js','sample-huep131-response.js'])assert(!fs.existsSync(path.join(base,name)),'Remove obsolete packaged data: '+name);
  assert.equal((get('ponOptions').innerHTML.match(/data-pick-port=/g)||[]).length,16);
  assert.equal((get('ponOptions').innerHTML.match(/class="cp-pon-port is-selected"/g)||[]).length,2);
  assert.equal((get('ponOptions').innerHTML.match(/ disabled/g)||[]).length,14);
  assert.deepEqual([...get('sourceStats').innerHTML.matchAll(/<b>(\d+)<\/b>/g)].map(m=>Number(m[1])),[60,60,0,1]);
  assert.equal((get('customerRows').innerHTML.match(/data-customer=/g)||[]).length,60);
  assert.equal(get('conflictLeftLabel').textContent,'Thiết bị OLT');
  const selectGroup=key=>get('groupTabs').listeners.click({target:{closest:()=>({dataset:{group:key}})}});
  for(const section of real.result.pon_results){
    if(!get('portsInput').value.split('\n').includes(section.pon_port)){
      pickPort(get('portsInput').value.split('\n')[0],false);pickPort(section.pon_port,true);
    }
    selectGroup('all');choosePort(section.pon_port);
    assert.equal((get('customerRows').innerHTML.match(/data-customer=/g)||[]).length,section.count.total);
    assert.equal((get('customerRows').innerHTML.match(new RegExp('data-column="port">'+section.pon_port+'</td>','g'))||[]).length,section.count.total);
    selectGroup('conflicts');
    assert.equal((get('conflictRows').innerHTML.match(/data-conflict-evidence=/g)||[]).length,section.count.conflicts);
    assert.deepEqual([...get('sourceStats').innerHTML.matchAll(/<b>(\d+)<\/b>/g)].map(m=>Number(m[1])),[section.count.total,section.count.observed_on_requested_pon,section.count.confirmed_offline,section.count.conflicts]);
  }
  choosePort('');assert.equal(get('portFilter').value,'g0/9','An empty tab cannot show all Ports');
  choosePort('g0/5');selectGroup('conflicts');
  assert.equal((get('conflictRows').innerHTML.match(/data-conflict-evidence=/g)||[]).length,1);
  get('conflictRows').listeners.click({target:{closest:()=>({dataset:{conflictEvidence:'0'},isConnected:true,focus(){}})}});
  assert(get('evidenceContent').innerHTML.includes('MAC không khớp')&&get('evidenceContent').innerHTML.includes('Thiết bị OLT')&&!get('evidenceContent').innerHTML.includes('System Radius'));
  get('closeEvidence').click();
  choosePort('g0/9');selectGroup('unconfirmed');assert.equal((get('customerRows').innerHTML.match(/data-customer=/g)||[]).length,2);
  assert(!get('customerRows').innerHTML.includes('cp-presence is-seen')&&!get('customerRows').innerHTML.includes('is-offline'),'CDP-only records are neither observed MACs nor confirmed Offline');
  selectGroup('all');
  pickPort('g0/5',false);pickPort('g0/2',true);
  assert.equal((get('ponOptions').innerHTML.match(/class="cp-pon-port is-selected"/g)||[]).length,2);
  choosePort('g0/2');assert(get('customerRows').innerHTML.includes('Chưa có dữ liệu của Port g0/2'));
  get('ponOptions').listeners.change({target:{dataset:{pickPort:'g0/2'},checked:false}});
  assert.equal(get('portFilter').value,'g0/9');assert.equal((get('customerRows').innerHTML.match(/data-customer=/g)||[]).length,78);
  const chooseOlt=value=>{get('oltSelect').value=value;get('oltSelect').listeners.change();};
  chooseOlt('__manual__');assert.equal(get('oltInput').hidden,false);assert(get('resultSection').hidden);
  chooseOlt('HUEP13106GC16');assert.equal(get('oltInput').hidden,true);assert.equal((get('customerRows').innerHTML.match(/data-customer=/g)||[]).length,60);
  let resolvePending;get('responseFile').files=[{name:'pending.json',size:10,text:()=>new Promise(resolve=>resolvePending=resolve)}];const pendingRead=get('responseFile').listeners.change();
  get('loadSample').click();resolvePending(JSON.stringify(response));await pendingRead;
  assert.equal(get('resultDevice').textContent,'HUEP13106GC16','A late import must not replace the newly selected sample');
  assert.equal(JSON.stringify(real),realBefore,'Grouping, rendering and Port selection never alter the supplied response');
  assert.equal(networkCalls,0);
  assert(!fs.readFileSync(path.join(base,'app.js'),'utf8').includes('localStorage'),'Customer data is never persisted');
  console.log('PASS: 310-customer source preserved, compact Port cells, maximum two selected Ports, separate Port tabs and counts, scoped conflicts, split headers and no live requests.');
})().catch(e=>{console.error(e);process.exitCode=1;});
