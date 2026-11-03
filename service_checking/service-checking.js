(()=>{
  'use strict';
  const mockupTools=window.NETAUTO_SERVICE_CHECK_CONFIG?.mockupTools!==false;
  const M=window.NETAUTO_SERVICE_MODEL,samples=window.NETAUTO_SERVICE_RESPONSES||{},root=document.getElementById('serviceApp'),get=id=>document.getElementById(id);
  const esc=v=>String(M.blank(v)?'—':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>M.blank(v)?'—':Number.isFinite(Number(v))?Number(v).toLocaleString('en-US',{maximumFractionDigits:2}):esc(v);
  const pill=(v,tone='')=>`<span class="svc-pill ${tone}">${esc(v)}</span>`;
  const td=(v,cls='')=>`<td class="${cls}">${v}</td>`;
  const table=(heads,rows,cls='')=>`<div class="svc-table-scroll"><table class="svc-table ${cls}"><thead><tr>${heads.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.join(''):`<tr><td colspan="${heads.length}"><div class="svc-empty"><b>Không có dữ liệu phù hợp</b><span>Thử bỏ lọc hoặc chọn hạng mục khác.</span></div></td></tr>`}</tbody></table></div>`;
  const stateLabel=c=>c?.skipped?pill('Bỏ qua'):c?.status===true?pill('Đạt','good'):c?.status===false?pill(c.optional?'Chưa đạt · Tùy chọn':'Không đạt',c.optional?'warn':'fail'):pill('Chưa có dữ liệu');
  const fact=(label,value)=>`<div><small>${esc(label)}</small><b>${value}</b></div>`;
  const statCard=(label,value,tone='blue')=>`<div class="svc-stat-card tone-${tone}"><small>${esc(label)}</small><b>${num(value)}</b></div>`;
  const portStateTag=value=>{const label=String(M.blank(value)?'—':value).toUpperCase(),tone=label==='UP'?'is-up':label==='DOWN'?'is-down':'is-unknown';return `<span class="svc-port-state ${tone}">${esc(label)}</span>`;};
  const opticalRange=(low,high)=>`<span class="svc-optical-range" aria-label="Ngưỡng thấp ${esc(num(low))}; ngưỡng cao ${esc(num(high))}"><span class="is-low">${num(low)}</span><span class="is-high">${num(high)}</span></span>`;
  const topologyTag=value=>{const raw=String(M.blank(value)?'unknown':value).toLowerCase().replace(/[\s-]+/g,'_'),kind=['ring_sep','ring','sep'].includes(raw)?'sep':raw==='star'?'star':raw==='ospf'?'ospf':'unknown',label={sep:'SEP',star:'Star',ospf:'OSPF',unknown:'Chưa xác định'}[kind];return pill(label,`svc-topology-tag is-${kind}`);};
  function maskSuffix(value){
    if(M.blank(value))return '';
    const raw=String(value).trim(),length=raw.match(/^\/?(\d{1,2})$/);
    if(length&&Number(length[1])<=32)return '/'+Number(length[1]);
    const octets=raw.split('.').map(Number);
    if(octets.length===4&&octets.every(v=>Number.isInteger(v)&&v>=0&&v<=255)){
      const bits=octets.map(v=>v.toString(2).padStart(8,'0')).join('');
      if(/^1*0*$/.test(bits))return '/'+(bits.includes('0')?bits.indexOf('0'):32);
    }
    return raw;
  }
  function routePrefix(v){
    const supplied=M.blank(v.prefix)?'':String(v.prefix).trim();let destination=M.blank(v.destination)?'':String(v.destination).trim(),mask=M.blank(v.mask)?'':String(v.mask).trim();
    const cidr=supplied.match(/^(.+?)\/(\d{1,2})$/);
    if(!destination&&cidr)destination=cidr[1];
    if(!mask&&cidr)mask=cidr[2];
    if(!destination)destination=supplied||'—';
    const suffix=maskSuffix(mask);
    return `<span class="svc-route-prefix">${esc(destination)}</span>${suffix?`<strong class="svc-route-mask">${esc(suffix)}</strong>`:''}`;
  }
  const reasonLabels={empty_aggregation:'Nhóm rỗng',all_members_down:'Tất cả member DOWN',no_selected_ports:'Không có Port thuộc phạm vi kiểm tra',eth_trunk_down:'Aggregation DOWN',aggregation_down:'Aggregation DOWN',member_down:'Member DOWN',interface_down:'Interface DOWN',vlan_interface:'VLAN interface',copper_transceiver:'Module đồng',copper_module:'Module đồng',missing_optical_values:'Thiếu dữ liệu quang',missing_required_prefix:'Thiếu prefix bắt buộc',no_loopback_source_pull_configuration:'LoopBack không cấu hình source-pull'};
  const reason=v=>reasonLabels[v]||v;
  Object.assign(reasonLabels,{rx_outside_thresholds:'RX nằm ngoài ngưỡng công suất',invalid_values:'Số đo hoặc ngưỡng công suất không hợp lệ',sfp_not_present:'Chưa xác nhận có module quang',unable_to_detect_topology:'Chưa xác định được mô hình kết nối từ dữ liệu SEP/PIM',unknown_sep_output:'Chưa đọc được dữ liệu SEP hợp lệ',invalid_sep_evidence:'Dữ liệu SEP thiếu hoặc không hợp lệ',local_device_not_in_sep_topology:'Không tìm thấy thiết bị hiện tại trong mô hình SEP',missing_local_device_identity:'Thiếu tên thiết bị để đối chiếu SEP',sep_not_configured:'Chưa có cấu hình SEP',not_ring_sep:'Không áp dụng SEP cho mô hình này',criterion_not_supported_hw12:'Model này không áp dụng kiểm tra SEP',unknown_adjacent_port:'Chưa xác định được Port liền kề',incomplete_local_common_ports:'Thiếu Port common của thiết bị',unknown_sep_port_state:'Chưa xác định được trạng thái Port SEP',invalid_or_duplicate_sep_rows:'Dữ liệu SEP không hợp lệ hoặc trùng',duplicate_local_port:'Port của thiết bị bị trùng trong SEP',nonadjacent_or_truncated_hops:'Dữ liệu Port liền kề bị thiếu hoặc không liên tục',pim_neighbor_count_mismatch:'Số PIM neighbor thấp hơn kỳ vọng theo SEP hoặc kết quả được tạo bằng rule cũ',pim_neighbor_count_below_expected:'Số PIM neighbor thấp hơn mức tối thiểu theo SEP',invalid_sep_or_pim_data:'Thiếu dữ liệu SEP/PIM hợp lệ',ospf_peer_not_full:'Có OSPF peer chưa ở trạng thái Full',missing_or_invalid_ospf_peer_data:'Không đọc được danh sách OSPF peer hợp lệ',fewer_than_two_ospf_pim_correlations:'Chưa đủ 2 PIM neighbor khớp Neighbor ID và VLAN của OSPF',fewer_than_two_ospf_next_hops:'Tuyến chưa có đủ 2 next-hop thuộc OSPF Neighbor ID'});
  const checkNames={interface_status:'Trạng thái Port',optical_power:'Công suất quang',counters:'CRC / discard',lacp:'LACP',ospf_peers:'OSPF peer',pim_neighbors:'PIM neighbor',routes:'Định tuyến',multicast_routing:'Multicast routing',l2_multicast:'L2 multicast',sep:'Topo'};
  const checkViews={interface_status:'ports',optical_power:'ports',counters:'counters',lacp:'lacp',ospf_peers:'routing',pim_neighbors:'routing',routes:'routing',multicast_routing:'multicast',l2_multicast:'multicast',sep:'topology'};
  const checkName=key=>Object.hasOwn(checkNames,key)?checkNames[key]:String(key).replace(/_/g,' ');
  const checkView=key=>Object.hasOwn(checkViews,key)?checkViews[key]:'other';
  const baseGroups={identity:true,customer:true,optics:true,operation:true};
  const onuWidths={pon:88,onu_id:96,contract:110,net_status:124,drop_point:152,onu_ipwan:126,onu_sn:130,onu_mac:148,onu_model:136,onu_rx:66,onu_tx:66,onu_temp:76,onu_olt_distance:88,attention:150};
  const onuColumns=M.columns.map(c=>({...c,width:onuWidths[c.key]}));
  const onuCellClass=c=>['svc-col-'+c.key,c.key==='pon'?'svc-sticky-pon':c.key==='onu_id'?'svc-sticky-onu':c.numeric?'number':''].filter(Boolean).join(' ');
  let groups={...baseGroups};try{const saved=JSON.parse(localStorage.getItem('netauto-service-columns-v1'));for(const key of Object.keys(groups))if(typeof saved?.[key]==='boolean')groups[key]=saved[key];}catch{}
  let response=null,index=null,deviceMeta={},filtered={ports:[],rows:[]},searchTimer=0,noticeTimer=0,importRevision=0;
  let onuLayoutObserver=null,onuLayoutFrame=0,reviewUid=null;
  let state=fresh();
  function fresh(){return {tab:'onu',mode:'pon',query:'',attention:'all',oper:'all',scope:null,page:0,onuSize:50,openPon:null,innerPage:0,innerSize:25,checkPage:0,warnings:false};}
  const olt=()=>response?.device_type==='OLT';
  const result=()=>response?.result||{};
  const context=()=>M.deviceContext(response,deviceMeta);
  function json(value){const text=JSON.stringify(value,null,2)??'null',limit=24000;return `<pre>${esc(text.slice(0,limit))}</pre>`+(text.length>limit?'<p>Nội dung rút gọn.</p>':'');}
  function error(message){get('requestError').textContent=message;get('requestError').hidden=!message;}
  function notice(message){clearTimeout(noticeTimer);get('svcNotice').textContent=message;get('svcNotice').hidden=false;noticeTimer=setTimeout(()=>get('svcNotice').hidden=true,3500);}
  function clear(){reviewUid=null;if(get('onuReviewDialog').open)get('onuReviewDialog').close();importRevision++;clearTimeout(searchTimer);stopOnuLayouts();response=null;index=null;deviceMeta={};filtered={ports:[],rows:[]};state=fresh();get('resultSection').hidden=true;get('resultEmpty').hidden=false;get('onuTableHost').innerHTML='';get('checkContent').innerHTML='';get('onuSearch').value='';get('backendWarnings').innerHTML='';get('backendWarnings').hidden=true;get('runOptions').hidden=true;get('runOptionsContent').innerHTML='';get('resultSummary').className='svc-result-summary';get('switchAttention').hidden=true;get('switchAttention').innerHTML='';error('');}
  function loadResponse(value,source='JSON đã nạp',inventory={}){
    const invalid=M.validate(value);if(invalid){error(invalid+' Kết quả đang mở được giữ nguyên.');return false;}
    reviewUid=null;if(get('onuReviewDialog').open)get('onuReviewDialog').close();
    importRevision++;clearTimeout(searchTimer);response=value;index=M.index(value);deviceMeta=inventory&&typeof inventory==='object'?inventory:{};state=fresh();state.tab=olt()?'onu':'overview';
    error('');get('resultSection').hidden=false;get('resultEmpty').hidden=true;get('deviceInput').value=context().name||context().ip||'';
    get('sampleSelect').value=Object.keys(samples).find(key=>samples[key]===value)||'';get('onuSearch').value='';get('attentionFilter').value='all';get('ponStatusFilter').value='all';
    if(olt()&&result().mode==='multicast_only')state.tab='multicast';
    get('snapshotPicker').open=false;renderHeader();renderTabs();renderWorkspace();return true;
  }
  function contextGraphic(kind){
    const paths={olt:'<rect x="9" y="5" width="30" height="12" rx="3"/><path d="M15 11h3m8 0h7M24 17v9M8 33v-7h32v7"/><rect x="3" y="33" width="10" height="8" rx="2"/><rect x="19" y="33" width="10" height="8" rx="2"/><rect x="35" y="33" width="10" height="8" rx="2"/>',ring:'<circle cx="24" cy="24" r="16"/><rect x="18" y="4" width="12" height="8" rx="2"/><rect x="4" y="29" width="12" height="8" rx="2"/><rect x="32" y="29" width="12" height="8" rx="2"/>',star:'<path d="m24 23-14 14m14-14 14 14M24 23V9"/><rect x="18" y="18" width="12" height="10" rx="2"/><rect x="19" y="3" width="10" height="7" rx="2"/><rect x="3" y="35" width="12" height="8" rx="2"/><rect x="33" y="35" width="12" height="8" rx="2"/>',switch:'<rect x="5" y="12" width="38" height="24" rx="5"/><path d="M11 19h4m4 0h4m4 0h4m4 0h2M11 28h5m4 0h5m4 0h5"/>'};
    return `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[kind]||paths.switch}</svg>`;
  }
  function loadPayload(value,source='Phản hồi API đã nhập'){
    try{return loadResponse(M.parsePayload(value),source);}catch(err){error(err.message+' Kết quả đang mở được giữ nguyên.');return false;}
  }
  function payloadError(message){get('payloadError').textContent=message;get('payloadError').hidden=!message;get('payloadInput').setAttribute('aria-invalid',String(!!message));}
  function submitPayload(){
    if(loadPayload(get('payloadInput').value)){get('payloadDialog').close();notice('Đã hiển thị kết quả mới.');}
    else{payloadError(get('requestError').textContent);get('payloadInput').focus();}
  }
  function serviceAssessment(){
    const r=result(),ctx=context(),m=r.multicast||{};
    const failedCheck=olt()?['overall_ok','multicast_stream','igmp_request'].some(key=>m[key]===false):switchIssues().some(item=>!item.optional);
    if(failedCheck)return {label:'Cần kiểm tra',tone:'fail'};
    const hasResult=response.result&&typeof response.result==='object';
    const hasEvidence=olt()?M.list(r.ports).length>0||['overall_ok','multicast_stream','igmp_request'].some(key=>typeof m[key]==='boolean'):ctx.hasChecks;
    if(ctx.unavailable||!M.blank(response.error)||!hasResult||!hasEvidence||response.status!==true)return {label:'Dịch vụ: Chưa đủ dữ liệu',tone:'warn'};
    return {label:'Dịch vụ: OK',tone:'good'};
  }
  function resultMessage(){
    const messages=response.status===false&&!M.blank(response.message)?[String(response.message)]:[];
    if(!M.blank(response.error)){
      const error=typeof response.error==='object'?JSON.stringify(response.error):String(response.error);
      if(!messages.includes(error))messages.push('Lỗi thực thi: '+error);
    }
    function emphasize(clause){
      const mismatch=clause.match(/^B3\s+Total service-port=(\d+)\s+khác\/không đọc được so với IGMP member=(\d+)$/i);
      if(mismatch){
        const service=Number(mismatch[1]),members=Number(mismatch[2]);
        clause=`B3 — Service-port ${service.toLocaleString('vi-VN')} · Thành viên IGMP ${members.toLocaleString('vi-VN')} · Chênh lệch ${Math.abs(service-members).toLocaleString('vi-VN')} bản ghi`;
      }
      clause=clause.replace(/^B4 có (\d+) IGMP user online$/i,'B4 — $1 thuê bao IGMP đang hoạt động');
      if(/^Multicast\s+(?:NOT\s+OK|OK)$/i.test(clause)){
        const failed=/NOT/i.test(clause);
        return `<strong class="svc-message-outcome ${failed?'is-review':'is-good'}">Multicast: ${failed?'Cần kiểm tra':'Đạt'}</strong>`;
      }
      const pattern=/\bB[1-4]\b|\b\d+(?:[.,]\d+)*\b/g;let html='',offset=0;
      for(const match of clause.matchAll(pattern)){
        html+=clause.slice(offset,match.index)?esc(clause.slice(offset,match.index)):'';
        html+=/^B/i.test(match[0])?pill(match[0].toUpperCase(),'svc-message-step'):`<strong class="svc-message-value">${esc(match[0])}</strong>`;
        offset=match.index+match[0].length;
      }
      return html+(clause.slice(offset)?esc(clause.slice(offset)):'');
    }
    return messages.flatMap(message=>message.split(';')).map(clause=>clause.trim()).filter(Boolean).map(clause=>`<span class="svc-result-detail">${emphasize(clause)}</span>`).join('');
  }
  function renderHeader(){
    get('resultSection').dataset.kind=context().kind;
    const r=result(),ctx=context(),topologyLabel={ring:'Ring',star:'Star',ospf:'OSPF'}[ctx.topology];get('deviceKind').textContent=ctx.label;get('deviceName').textContent=ctx.name||'Thiết bị chưa xác định';get('deviceMeta').textContent=[ctx.ip,ctx.vendor,ctx.model,topologyLabel].filter(Boolean).join(' · ');
    const assessment=serviceAssessment();get('resultStatus').hidden=false;
    get('resultStatus').textContent=assessment.label;get('resultStatus').className='svc-pill '+assessment.tone;
    get('resultStatus').title=assessment.tone==='good'?'Đánh giá theo kết quả và các tùy chọn kiểm tra của lần chạy này.':assessment.tone==='fail'?'Có hạng mục kiểm tra dịch vụ không đạt; xem lý do và chi tiết bên dưới.':'Chưa có đủ kết quả để kết luận dịch vụ OK hay không; xem thông báo và kết quả từng hạng mục.';
    get('resultMessage').innerHTML=resultMessage();
    get('resultMessage').hidden=!get('resultMessage').innerHTML;
    const count=r.count||{},macLabel=`Tổng MAC (trên ${M.blank(count.device_total_ports)?'—':count.device_total_ports} Port PON)`;get('sourceStats').innerHTML=olt()?[['Port PON',count.device_total_ports,'blue'],[macLabel,count.device_total_mac,'purple'],['IP WAN (theo tùy chọn)',count.device_total_ipwan,'cyan']].map(([k,v,t])=>statCard(k,v,t)).join(''):[['Port được chọn',Array.isArray(r.selected_ports)?r.selected_ports.length:null],['Hạng mục không đạt',ctx.hasChecks||Array.isArray(r.failures)?switchIssues().filter(item=>!item.optional).length:null],['Cảnh báo',Array.isArray(r.warnings)?r.warnings.length:null]].map(([k,v])=>statCard(k,v)).join('');
    renderOptions();
    renderSwitchAttention();
  }
  function renderOptions(){
    const o=result().options,rows=[];
    if(olt()&&o&&typeof o==='object'&&!Array.isArray(o)){
      if(o.multicast_only===true||result().mode==='multicast_only')rows.push(['Chế độ','Chỉ kiểm tra multicast']);
      else{
        if(o.mac_limit===null)rows.push(['Số mẫu','Kiểm tra toàn bộ MAC/Port PON']);
        else if(Number.isInteger(o.mac_limit)&&o.mac_limit>0)rows.push(['Số mẫu',`Kiểm tra ${num(o.mac_limit)} MAC/Port PON`]);
        if(typeof o.multicast_check==='boolean')rows.push(['Check Multicast',o.multicast_check?'Bật':'Tắt']);
        const fields=[['onuMac','MAC'],['onuSn','SN'],['onuModel','Model'],['onuRx','Công suất thu'],['onuTx','Công suất phát'],['onuTemp','Nhiệt độ'],['onuOltDistance','Khoảng cách OLT–ONU']];
        const enabled=fields.filter(([key])=>o[key]===true).map(([,label])=>label);
        if(enabled.length)rows.push(['Thông tin ONU',enabled.join(' · ')]);
      }
    }
    get('runOptionsContent').innerHTML=rows.map(([label,value])=>`<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`).join('');
    get('runOptions').hidden=rows.length===0;
    get('resultSummary').className='svc-result-summary'+(rows.length?' has-options':'');
  }
  function switchCheckKeys(){const c=result().checks||{},failures=M.list(result().failures);return [...new Set([...Object.keys(checkNames).filter(key=>(key!=='sep'||c.sep||failures.some(f=>f.check==='sep')||context().rawTopology)&&(key!=='ospf_peers'||context().role==='DI'||c.ospf_peers||failures.some(f=>f.check==='ospf_peers'))),...Object.keys(c),...failures.map(f=>f.check).filter(key=>typeof key==='string'&&key)])];}
  function switchIssues(){
    if(olt()||context().unavailable)return [];
    const c=result().checks||{},failures=M.list(result().failures);
    return switchCheckKeys().filter(key=>c[key]?.status===false&&!c[key]?.skipped||failures.some(f=>f.check===key)).map(key=>({key,check:c[key],optional:!!c[key]?.optional,failures:failures.filter(f=>f.check===key),tab:checkView(key)}));
  }
  function issueDescription(item){
    const c=item.check||{},observed=item.failures.map(f=>f.observed).find(v=>v&&typeof v==='object')||{},missing=M.list(c.missing_ports).length?c.missing_ports:observed.missing_ports;
    if(M.list(missing).length)return 'Không tìm thấy Port: '+missing.join(' · ');
    if(item.key==='ospf_peers'){
      const bad=M.list(c.non_full||observed.non_full);
      if(bad.length)return `Có ${num(bad.length)} OSPF peer chưa Full: ${bad.slice(0,3).map(v=>`${v.neighbor_id} (${v.state})`).join(' · ')}${bad.length>3?' · …':''}`;
      return 'Không đọc được danh sách OSPF peer đầy đủ để đánh giá.';
    }
    if(item.key==='pim_neighbors'){
      const actual=Number(c.count??observed.count),expected=Number(c.expected_count??observed.expected_count);
      if(Number.isFinite(actual)&&Number.isFinite(expected))return actual>=expected?`Đã ghi nhận ${num(actual)} PIM neighbor, đạt mức tối thiểu ${num(expected)}; cần chạy lại API bằng rule mới.`:`Thiếu ${num(expected-actual)} PIM neighbor: ghi nhận ${num(actual)}, cần tối thiểu ${num(expected)}.`;
    }
    if(item.key==='routes'){
      const routeData=c.pim_routes||observed.pim_routes||{},missingRoutes=M.list(routeData.missing);
      if(c.management_default?.status===false||observed.management_default?.status===false)return 'Không tìm thấy default route quản trị đang hoạt động.';
      if(missingRoutes.length)return context().role==='DI'?`Có ${num(missingRoutes.length)} tuyến chưa đủ 2 next-hop thuộc OSPF Neighbor ID.`:`Có ${num(missingRoutes.length)} tuyến PIM thiếu hoặc có next-hop không thuộc PIM neighbor.`;
    }
    const why=c.reason||observed.reason;if(!M.blank(why))return reason(why);
    const scopes=[...new Set(item.failures.map(f=>f.scope).filter(v=>v&&v!=='device'))];
    return scopes.length?scopes.slice(0,4).join(' · ')+(scopes.length>4?' · và '+(scopes.length-4)+' vị trí khác':''):'Dữ liệu chưa đạt tiêu chí kiểm tra';
  }
  function operationalIssue(item){
    const c=item.check||{},observed=item.failures.map(f=>f.observed).find(v=>v&&typeof v==='object')||{};
    if(item.key==='ospf_peers'){
      const bad=M.list(c.non_full||observed.non_full);
      return `<div class="svc-issue-meaning"><b>Ý nghĩa vận hành</b><p>${bad.length?`Có ${num(bad.length)} OSPF peer chưa lên Full nên quan hệ định tuyến với thiết bị liền kề chưa hội tụ hoàn chỉnh.`:'Không có đủ dữ liệu OSPF để xác nhận các quan hệ định tuyến đã hội tụ.'}</p></div>`;
    }
    if(item.key==='pim_neighbors'){
      const actual=Number(c.count??observed.count),expected=Number(c.expected_count??observed.expected_count);
      if(Number.isFinite(actual)&&Number.isFinite(expected))return `<div class="svc-issue-meaning"><b>Ý nghĩa vận hành</b><p>${actual>=expected?`Thiết bị có ${num(actual)} PIM neighbor, đã bằng hoặc vượt mức tối thiểu ${num(expected)}. Cảnh báo này thuộc phản hồi được tạo bằng rule so sánh cũ; hãy chạy lại API sau khi cập nhật backend.`:`Thiết bị mới có ${num(actual)}/${num(expected)} PIM neighbor tối thiểu. Thiếu ${num(expected-actual)} neighbor nên một hoặc nhiều hướng multicast theo SEP có thể chưa hình thành.`}</p></div>`;
    }
    if(item.key==='routes'){
      const routeData=c.pim_routes||observed.pim_routes||{},rows=M.list(routeData.missing),messages=[];
      if(c.management_default?.status===false||observed.management_default?.status===false)messages.push('Không có default route quản trị đang hoạt động.');
      for(const row of rows){
        const target=row.destination||row.prefix||'đích chưa xác định',hops=M.list(row.active_next_hops).length?row.active_next_hops:M.list(row.configured_next_hops);
        if(row.reason==='fewer_than_two_ospf_next_hops')messages.push(`Tuyến đến ${target} mới có ${num(M.list(row.matched_next_hops).length)}/${num(row.required_next_hops)} next-hop thuộc OSPF Neighbor ID.`);
        else if(['active_next_hop_not_pim_neighbor','next_hop_not_pim_neighbor','missing_prefix_or_pim_next_hop'].includes(row.reason)&&hops.length)messages.push(`Tuyến đến ${target} đang dùng next-hop ${hops.join(' · ')}, không thuộc danh sách PIM neighbor.`);
        else if(['no_active_matching_route','missing_required_prefix','missing_prefix_or_pim_next_hop'].includes(row.reason))messages.push(`Không tìm thấy tuyến đang hoạt động đến ${target}.`);
        else if(row.reason==='invalid_or_rejected_routing_table')messages.push(`Không đọc được bảng định tuyến cho đích ${target}.`);
        else messages.push(`Tuyến đến ${target} chưa đạt tiêu chí PIM.`);
      }
      if(messages.length)return `<div class="svc-issue-meaning"><b>Ý nghĩa vận hành</b><ul>${messages.map(message=>`<li>${esc(message)}</li>`).join('')}</ul></div>`;
    }
    return '';
  }
  function renderSwitchAttention(){
    const items=switchIssues(),optionalOnly=items.length&&items.every(item=>item.optional);get('switchAttention').hidden=items.length===0;
    get('switchAttention').className='svc-switch-attention'+(optionalOnly?' is-optional-only':'');
    get('switchAttention').innerHTML=items.length?`<h3>${optionalOnly?'Hạng mục tùy chọn cần xem':'Hạng mục cần kiểm tra'}</h3>`+items.map(item=>`<button type="button" class="svc-issue-link ${item.optional?'is-optional':''}" data-check-tab="${item.tab}" data-check-key="${esc(item.key)}"><span><b>${esc(checkName(item.key))}</b>${item.optional?' · Tùy chọn':''}<small>${esc(issueDescription(item))}</small></span><span>Xem chi tiết →</span></button>`).join(''):'';
  }
  function tabs(){
    if(olt())return [['onu','PON & ONU'],['multicast','Multicast']];
    if(context().unavailable||!context().hasChecks&&!M.list(result().failures).length)return [['overview','Tổng quan']];
    const keys=switchCheckKeys();return [['overview','Tổng quan'],['ports','Port & quang'],['counters','CRC / discard'],['lacp','LACP'],...(keys.includes('sep')||context().rawTopology?[['topology','Topo']]:[]),['routing','Định tuyến'],['multicast','Multicast'],...(keys.some(key=>checkView(key)==='other')?[['other','Kiểm tra khác']]:[])];
  }
  function renderTabs(){
    const c=result().checks||{},keys={overview:switchCheckKeys(),ports:['interface_status','optical_power'],counters:['counters'],lacp:['lacp'],topology:['sep'],routing:['ospf_peers','pim_neighbors','routes'],multicast:['multicast_routing','l2_multicast'],other:switchCheckKeys().filter(key=>checkView(key)==='other')},issues=switchIssues();
    get('resultTabs').innerHTML=tabs().map(([key,label])=>{
      const relevant=keys[key]||[],items=relevant.map(k=>c[k]).filter(Boolean),oltMulticastIssue=olt()&&key==='multicast'&&result().multicast?.overall_ok===false;
      const bad=oltMulticastIssue||issues.some(item=>!item.optional&&relevant.includes(item.key)),warn=!bad&&issues.some(item=>item.optional&&relevant.includes(item.key));
      const unknown=!bad&&!warn&&context().unavailable&&!items.length,tone=bad?'fail':warn?'warn':unknown?'unknown':'good',symbol=bad||warn?'!':unknown?'?':'✓';
      return `<button type="button" role="tab" id="svc-tab-${key}" data-tab="${key}" tabindex="${state.tab===key?'0':'-1'}" aria-selected="${state.tab===key}" aria-controls="${key==='onu'?'onuWorkspace':'checkWorkspace'}"><span class="svc-tab-dot ${tone}" aria-hidden="true">${symbol}</span>${label}</button>`;
    }).join('');
    get(state.tab==='onu'?'onuWorkspace':'checkWorkspace').setAttribute('aria-labelledby','svc-tab-'+state.tab);
  }
  function renderWorkspace(){get('onuWorkspace').hidden=!(olt()&&state.tab==='onu');get('checkWorkspace').hidden=olt()&&state.tab==='onu';if(olt()&&state.tab==='onu')renderData();else{stopOnuLayouts();renderChecks();}}
  function chosenColumns(nested=false){return onuColumns.filter(c=>(!nested||c.key!=='pon')&&(!c.group||groups[c.group]));}
  function cell(column,row){
    if(column.key==='attention')return `<td class="${onuCellClass(column)}" data-onu-field="attention"><button type="button" class="svc-review-button ${row.flags.length?'has-items':''}" data-onu-review="${row.uid}" aria-haspopup="dialog" aria-controls="onuReviewDialog" aria-label="Đối chiếu ONU ${esc(row.source.onu_id)}${row.flags.length?' · Có chú ý':''}" title="${esc(row.flags.map(f=>f.label).join('; ')||'Xem dữ liệu đối chiếu')}">Đối chiếu${row.flags.length?' <span>!</span>':''}</button></td>`;
    const raw=column.value(row),value=M.blank(raw)?'—':raw,cls=onuCellClass(column);
    const tagTone={contract:'contract',onu_id:'index',onu_ipwan:'ip'};
    if(column.key==='onu_ipwan'&&row.source.online_source==='isc_ipwan_by_mac')return `<td class="${cls}" data-onu-field="onu_ipwan">${M.blank(raw)?'<span class="svc-pill warn" title="Chưa có IP WAN từ ISC để xác nhận Online">Chưa xác nhận</span>':`<span title="IP WAN xác minh từ ISC${row.source.onu_online?' · Online':''}">${pill(value,'svc-onu-tag is-ip')}</span>`}</td>`;
    const content=M.blank(raw)?'—':tagTone[column.key]?pill(value,'svc-onu-tag is-'+tagTone[column.key]):column.numeric?num(value):esc(value);
    return `<td class="${cls}" data-onu-field="${column.key}">${content}</td>`;
  }
  function onuTable(rows,nested=false){
    const columns=chosenColumns(nested),width=columns.reduce((sum,c)=>sum+c.width,0);
    return `<div class="svc-table-scroll" data-onu-layout role="region" aria-label="Bảng thông số ONU, có thể cuộn ngang" tabindex="0"><table class="svc-table svc-onu-table svc-onu-flat" style="--svc-onu-width:${width}px;--svc-pon-width:88px"><colgroup>${columns.map(c=>`<col data-onu-column="${c.key}" style="width:${c.width}px">`).join('')}</colgroup><thead><tr>${columns.map(c=>`<th scope="col" class="${onuCellClass(c)}">${esc(c.label).replace(/ \(/,'<br>(')}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(row=>`<tr data-onu-row="${row.uid}" class="${row.flags.length?'svc-flagged':''}">${columns.map(c=>cell(c,row)).join('')}</tr>`).join(''):`<tr><td colspan="${columns.length}"><div class="svc-empty"><b>Không có ONU phù hợp</b><span>${state.query||state.attention!=='all'?'Thử bỏ bớt bộ lọc.':'Chưa có thông tin ONU trên Port này.'}</span></div></td></tr>`}</tbody></table></div>`;
  }
  function stopOnuLayouts(){
    onuLayoutObserver?.disconnect();onuLayoutObserver=null;
    if(onuLayoutFrame)cancelAnimationFrame(onuLayoutFrame);onuLayoutFrame=0;
  }
  function syncOnuLayouts(){
    stopOnuLayouts();
    if(typeof ResizeObserver==='undefined')return;
    const measured=new WeakMap(),pending=new Map();
    const fit=(wrapper,availableWidth)=>{
      if(availableWidth<=0)return;
      const previous=measured.get(wrapper);
      // Fractional CSS pixels at browser zoom must not feed back into sizing.
      if(previous!==undefined&&Math.abs(previous-availableWidth)<=2)return;
      const table=wrapper.querySelector('.svc-onu-table');if(!table)return;
      const cols=[...table.querySelectorAll('col[data-onu-column]')];
      const layout=M.onuLayout(cols.map(col=>({key:col.dataset.onuColumn,width:onuWidths[col.dataset.onuColumn]})),availableWidth);
      measured.set(wrapper,availableWidth);
      const width=layout.width+'px';if(table.style.getPropertyValue('--svc-onu-render-width')!==width)table.style.setProperty('--svc-onu-render-width',width);
      cols.forEach((col,i)=>{const value=layout.columns[i].width+'px';if(col.style.width!==value)col.style.width=value;});
    };
    onuLayoutObserver=new ResizeObserver(entries=>{
      for(const entry of entries){
        const width=entry.contentRect.width,previous=measured.get(entry.target);
        if(width>0&&(previous===undefined||Math.abs(previous-width)>2))pending.set(entry.target,width);
        else pending.delete(entry.target);
      }
      if(!pending.size||onuLayoutFrame)return;
      onuLayoutFrame=requestAnimationFrame(()=>{
        onuLayoutFrame=0;const updates=[...pending];pending.clear();
        updates.forEach(([wrapper,width])=>fit(wrapper,width));
      });
    });
    const wrappers=[...get('onuTableHost').querySelectorAll('[data-onu-layout]')];
    const widths=wrappers.map(wrapper=>wrapper.clientWidth);
    wrappers.forEach((wrapper,i)=>{fit(wrapper,widths[i]);onuLayoutObserver.observe(wrapper);});
  }
  function pageText(p,label){return `${p.total?p.start+1:0}–${Math.min(p.start+p.size,p.total)} / ${p.total.toLocaleString('en-US')} ${label} · Trang ${p.page+1}/${p.pages}`;}
  function detail(entry){
    const p=entry.port,view=M.paginate(entry.rows,state.innerPage,state.innerSize);state.innerPage=view.page;
    const pager=view.total>25?`<div class="svc-data-footer svc-inner-footer"><label>ONU / trang <select data-inner-size aria-label="Số ONU mỗi trang trong PON">${[25,50,100].map(n=>`<option value="${n}" ${state.innerSize===n?'selected':''}>${n}</option>`).join('')}</select></label><span>${pageText(view,'ONU')}</span>${view.pages>1?`<div><button class="na-button" type="button" data-inner-page="-1" ${view.page===0?'disabled':''}>← Trước</button><button class="na-button" type="button" data-inner-page="1" ${view.page===view.pages-1?'disabled':''}>Sau →</button></div>`:''}</div>`:`<div class="svc-detail-count">${view.total} ONU${entry.rows.length!==p.rows.length?' khớp lọc':''}</div>`;
    return `<section class="svc-onu-detail" id="svc-detail-${p.id}" aria-label="ONU thuộc ${esc(p.name)}"><header><b>${esc(p.name)} · Thông tin ONU</b><span>${p.rows.length} ONU chi tiết · ${esc(p.source.available_onu)} có sẵn ${p.source.truncated?'· Đã giới hạn':''}${typeof p.source.online_onu==='number'?' · '+p.source.online_onu+' Online (ISC)':''}</span></header>${p.source.sampling?.status==='no_valid_mac'?'<p>Không có MAC hợp lệ để chọn mẫu kiểm tra IP WAN.</p>':''}${onuTable(view.rows,true)}${pager}</section>`;
  }
  function backendNotices(){return [...(M.blank(response?.error)?[]:[{label:'Lỗi',value:response.error}]),...M.list(result().warnings).map(value=>({label:'Cảnh báo',value}))];}
  function signals(){
    const count=backendNotices().length;
    get('customerSignals').innerHTML=`<button type="button" class="svc-signal ${index.signals.any?'has-items':''}" data-signal="any" aria-pressed="${state.attention==='any'}">Cần kiểm tra <b>${index.signals.any}</b></button><button type="button" class="svc-signal ${count?'has-items':''}" data-warnings aria-controls="backendWarnings" aria-expanded="${state.warnings}">Cảnh báo <b>${count}</b></button>`;
  }
  function openOnuReview(uid){
    const row=index?.rows.find(r=>r.uid===uid);if(!row)return;
    reviewUid=uid;
    const o=row.source,q=o.data_quality||{},hasSource=q.cdp_snapshot!==null&&typeof q.cdp_snapshot==='object'&&!Array.isArray(q.cdp_snapshot),s=hasSource?q.cdp_snapshot:{},method={mac:'MAC',serial:'SN',onu_index:'ONU index'}[q.matched_by];
    get('onuReviewTitle').textContent='Đối chiếu ONU '+(o.onu_id||'—');
    get('onuReviewMeta').textContent=row.port.name+(method?' · Ghép theo '+method:'');
    const fields=[['Hợp đồng',o.contract,s.contract],['Trạng thái HĐ',M.contractStatus(o.net_status),M.contractStatus(s.net_status)],['Tập điểm',o.drop_point,s.group_point||s.drop_point],['IP WAN',o.onu_ipwan,s.ip||s.ipwan],['MAC ONU',o.onu_mac,s.onu_mac||s.mac],['Serial ONU',o.onu_sn,s.onu_sn||s.serial_number||s.ont_sn],['ONU index',o.onu_id,s.ont_index||s.onu_index||s.index]];
    const reasons=row.flags.length?`<ul class="svc-review-reasons">${row.flags.map(f=>`<li>${esc(f.label)}</li>`).join('')}</ul>`:'<p class="svc-review-ok">Không có mục cần kiểm tra trong dữ liệu ONU này.</p>';
    const differences=M.list(q.issues).filter(i=>'device_value' in i||'cdp_value' in i||'csoc_value' in i);
    const ignored=M.list(q.ignored_cdp_records);
    const lookupFailed=M.list(q.issues).some(i=>i.code==='cdp_lookup_failed'),missingRecord=q.membership==='device_only'||M.list(q.issues).some(i=>i.code==='missing_cdp_record');
    const matched=q.membership==='device_and_cdp'||Number.isInteger(q.selected_cdp_row)&&q.selected_cdp_row>=0||!!method;
    const sourceNote=ignored.length?(hasSource?'Đã bỏ qua hồ sơ CDP status=off. Thông tin khách hàng dùng hồ sơ còn hiệu lực được đối chiếu bên dưới.':'Hồ sơ CDP có status=off đã bị loại khỏi thông tin khách hàng. Dữ liệu bị bỏ qua được giữ bên dưới để kiểm tra.'):hasSource?(M.blank(s.status)?'':'Trạng thái kết nối trong Data CDP: '+s.status+'.'):lookupFailed?'Không lấy được dữ liệu CDP trong lần kiểm tra này.':missingRecord?'Không tìm thấy hồ sơ CDP khớp ONU này.':matched?'Thông tin khách hàng đã được lấy từ CDP. Phản hồi này chưa kèm Data CDP nguồn để hiển thị đối chiếu.':'Phản hồi này chỉ kèm dữ liệu đã ghép, chưa kèm Data CDP nguồn để hiển thị đối chiếu.';
    const sourceTable=hasSource?table(['Thông tin','Kết quả đang hiển thị','Data CDP'],fields.map(([label,a,b])=>`<tr>${td(esc(label))}${td(esc(a))}${td(esc(b))}</tr>`)):table(['Thông tin','Kết quả đang hiển thị'],fields.map(([label,value])=>`<tr>${td(esc(label))}${td(esc(value))}</tr>`));
    const ignoredDetails=ignored.length?'<h3>Data CDP không sử dụng</h3>'+ignored.map(record=>{const raw=record.snapshot||{};return `<details><summary>${esc(raw.contract)} · status=${esc(raw.status)}</summary>${table(['Thông tin','Data CDP'],[['Trạng thái kết nối',raw.status],['Hợp đồng',raw.contract],['Trạng thái HĐ',M.contractStatus(raw.net_status)],['Tập điểm',raw.group_point||raw.drop_point],['IP WAN',raw.ip||raw.ipwan],['MAC ONU',raw.onu_mac||raw.mac],['Serial ONU',raw.onu_sn||raw.serial_number||raw.ont_sn],['ONU index',raw.ont_index||raw.onu_index||raw.index]].map(([label,value])=>`<tr>${td(esc(label))}${td(esc(value))}</tr>`))}</details>`;}).join(''):'';
    const iscNote=o.online_source==='isc_ipwan_by_mac'?`<p class="svc-review-source"><b>${o.onu_online&&!M.blank(o.onu_ipwan)?'ONU Online':'Chưa xác nhận ONU Online'}.</b> IP WAN được kiểm tra qua ISC; CDP status=act chỉ dùng để ưu tiên chọn mẫu.</p>`:'';
    const serviceDifferences=M.list(o.service_quality?.issues).filter(i=>'isc_value' in i||'cdp_value' in i);
    get('onuReviewContent').innerHTML=reasons+iscNote+(sourceNote?`<p class="svc-review-source">${esc(sourceNote)}</p>`:'')+sourceTable+(differences.length?'<h3>Chi tiết chênh lệch / thiếu dữ liệu</h3>'+table(['Thông tin','OLT','CDP'],differences.map(i=>`<tr>${td(esc(i.message||i.field||i.code))}${td(esc(i.device_value))}${td(esc(Object.hasOwn(i,'csoc_value')?i.csoc_value:i.cdp_value))}</tr>`)):'')+(serviceDifferences.length?'<h3>Đối chiếu IP WAN</h3>'+table(['Thông tin','ISC','CDP'],serviceDifferences.map(i=>`<tr>${td(esc(i.message||i.code))}${td(esc(i.isc_value))}${td(esc(i.cdp_value))}</tr>`)):'')+ignoredDetails;
    get('onuReviewDialog').showModal();
  }
  function renderData(){
    if(!response||!olt())return;
    filtered=M.filter(index,{query:state.query,attention:state.attention,oper:state.oper,scope:state.scope});signals();
    get('attentionFilter').value=state.attention;get('ponStatusFilter').value=state.oper;
    root.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
    root.querySelectorAll('[data-column]').forEach(b=>b.checked=groups[b.dataset.column]);
    const nested=state.mode==='pon';get('viewTitle').textContent=nested?'Bảng port PON':'Toàn bộ ONU';get('viewCount').textContent=`${filtered.ports.length} / ${index.ports.length} PON · ${filtered.rows.length.toLocaleString('en-US')} / ${index.rows.length.toLocaleString('en-US')} ONU chi tiết`;
    get('scopeChip').innerHTML=state.scope!=null?`<button type="button" class="svc-scope" data-clear-scope>Phạm vi: ${esc(index.ports[state.scope]?.name)} ×</button>`:'';
    const notices=backendNotices();get('backendWarnings').hidden=!state.warnings;get('backendWarnings').innerHTML=state.warnings?(notices.length?'<b>Thông báo kiểm tra</b>'+notices.map(n=>`<p>${n.label}: ${esc(typeof n.value==='object'?JSON.stringify(n.value):n.value)}</p>`).join(''):'<p>Không có cảnh báo.</p>'):'';
    get('onuPager').hidden=nested;
    if(nested){
      state.page=0;get('pageInfo').textContent='';get('prevPage').disabled=true;get('nextPage').disabled=true;
      if(!filtered.ports.some(e=>e.port.id===state.openPon))state.openPon=null;
      const body=filtered.ports.map(entry=>{const p=entry.port,open=p.id===state.openPon,s=p.source;return `<tr class="${open?'svc-open-row':''}">${td(`<button type="button" class="svc-link svc-pon-toggle" data-open-pon="${p.id}" aria-expanded="${open}" ${open?`aria-controls="svc-detail-${p.id}"`:''}><span aria-hidden="true">${open?'▾':'▸'}</span>${pill(p.name,'svc-pon-name')}</button>`)}${td(pill(`${s.admin_stt??'—'} / ${s.oper_stt??'—'}`,s.oper_stt==='UP'?'good':s.oper_stt==='DOWN'?'warn':''))}${td(`${p.rows.length} / ${pill(num(s.total_mac),'svc-pon-mac-total')}`,'number')}${td(num(s.total_ipwan),'number')}${td(p.attention?`<button type="button" class="svc-link warn" data-port-attention="${p.id}">${p.attention} mục cần kiểm tra →</button>`:'—')}</tr>`+(open?`<tr class="svc-detail-row"><td colspan="5">${detail(entry)}</td></tr>`:'');});
      const macHeading='ONU chi tiết / Tổng MAC PON';
      get('onuTableHost').innerHTML=table(['Port PON','Admin / Oper',macHeading,'IP WAN (theo tùy chọn)','Chú ý KH'],body,'svc-pon-table');
    }else{
      const view=M.paginate(filtered.rows,state.page,state.onuSize);state.page=view.page;
      get('pageSize').value=String(state.onuSize);get('onuTableHost').innerHTML=onuTable(view.rows);
      get('pageInfo').textContent=pageText(view,'ONU');get('prevPage').disabled=view.page===0;get('nextPage').disabled=view.page===view.pages-1;
    }
    syncOnuLayouts();
  }
  function checkPage(rows,headers,make,cls=''){const p=M.paginate(rows,state.checkPage,25);state.checkPage=p.page;get('checkPager').hidden=rows.length<=25;get('checkPageInfo').textContent=pageText(p,'bản ghi');get('checkPrev').disabled=p.page===0;get('checkNext').disabled=p.page===p.pages-1;return table(headers,p.rows.map(make),cls);}
  function ratingCell(check){const why=check?.skip_reason||check?.reason;return '<div class="svc-rating">'+stateLabel(check)+(!M.blank(why)?`<small>${esc(reason(why))}</small>`:'')+'</div>';}
  const reviewRow=check=>check?.status===false&&!check.skipped?' class="svc-row-needs-review"':'';
  function checkPageFor(key){
    const c=result().checks||{};let rows=[],bad=()=>false;
    if(key==='interface_status'||key==='optical_power'){rows=M.list(c.interface_status?.ports);bad=p=>key==='optical_power'?M.list(c.optical_power?.ports).some(o=>o.port===p.port&&o.status===false&&!o.skipped):p.admin_status==='DOWN'||p.oper_status==='DOWN';}
    else if(key==='counters'){rows=M.list(c.counters?.ports);bad=p=>p.status===false&&!p.skipped;}
    else if(key==='lacp'){rows=M.list(c.lacp?.trunks);bad=p=>p.status===false&&!p.skipped;}
    return Math.floor(Math.max(0,rows.findIndex(bad))/25);
  }
  function tabIssues(tab){
    const items=switchIssues().filter(item=>item.tab===tab);
    return items.length?'<section class="svc-tab-issues" aria-label="Vấn đề của hạng mục">'+items.map(item=>`<article class="${item.optional?'is-optional':''}"><b>${esc(checkName(item.key))}${item.optional?' · Tùy chọn':''}</b><p>${esc(issueDescription(item))}</p>${operationalIssue(item)}${item.failures.length?`<details><summary>Bằng chứng và lệnh đối chiếu</summary>${item.failures.map(f=>json(f)).join('')}</details>`:''}</article>`).join('')+'</section>':'';
  }
  function checkCards(checks){
    const views={interface_status:['ports','M3 5h18v14H3z M6 9h2m3 0h2m3 0h2M6 14h2m3 0h2m3 0h2'],optical_power:['ports','M3 12h4l3-7 4 14 3-7h4'],counters:['counters','M4 19V9m5 10V5m6 14v-7m5 7V3'],lacp:['lacp','M8 7h8m-8 10h8M5 9V7a2 2 0 0 1 2-2h2m6 0h2a2 2 0 0 1 2 2v2M5 15v2a2 2 0 0 0 2 2h2m6 0h2a2 2 0 0 0 2-2v-2'],ospf_peers:['routing','M5 5h4v4H5zM15 5h4v4h-4zM10 7h4M7 10v7h10v-7'],pim_neighbors:['routing','M12 7v6m-6 4h12M6 17v3m12-3v3M9 3h6v4H9z'],routes:['routing','M4 6h13l-3-3m3 3-3 3M20 18H7l3-3m-3 3 3 3'],multicast_routing:['multicast','M4 12h7m0 0 7-7m-7 7 7 7M1 9h3v6H1zM18 2h4v5h-4zM18 17h4v5h-4z'],l2_multicast:['multicast','M3 6h18v12H3zM7 10h2m3 0h2m3 0h1M7 14h10'],sep:['topology','M5 5h4v4H5zM15 15h4v4h-4zM9 7h6a2 2 0 0 1 2 2v6M7 9v7h8']};
    const topology=result().topology||{},topoType=topology.type||context().rawTopology,rawTopo=String(M.blank(topoType)?'':topoType).toLowerCase().replace(/[\s-]+/g,'_'),knownTopo=['star','ring','ring_sep','sep','ospf'].includes(rawTopo),issues=switchIssues();
    const summary=(key,c)=>{
      const topoIssue=key==='sep'&&issues.some(item=>item.key==='sep');
      if(key==='sep'&&knownTopo&&!topoIssue)return rawTopo==='star'?'Đã xác định mô hình Star':rawTopo==='ospf'?'Đã xác định mô hình OSPF':`${esc(c?.local_segment_count)} segment của thiết bị · ${esc(c?.expected_pim_count)} PIM kỳ vọng`;
      if(!c)return 'Chưa có dữ liệu';
      if(c.skipped)return esc(reason(c.skip_reason)||'Không thuộc phạm vi lượt kiểm tra');
      if(key==='interface_status'||key==='optical_power')return Array.isArray(c.ports)?`${c.ports.length} Port có dữ liệu`:'Chưa có dữ liệu Port';
      if(key==='counters')return `${esc(c.sample_count)} mẫu · ${esc(c.interval_seconds)} giây / lần`;
      if(key==='lacp')return Array.isArray(c.trunks)?`${c.trunks.length} nhóm ghép đường truyền`:'Chưa có dữ liệu nhóm';
      if(key==='ospf_peers')return `${esc(c.full_count)} / ${esc(c.count)} peer Full`;
      if(key==='pim_neighbors')return Array.isArray(c.neighbors)?`${c.neighbors.length} neighbor`:'Chưa có dữ liệu neighbor';
      if(key==='routes')return `${M.list(c.pim_routes?.matched).length} / ${esc(c.pim_routes?.required)} tuyến ${context().role==='DI'?'qua OSPF':'PIM'}`;
      if(key==='l2_multicast')return `VLAN ${esc(c.vlan)} · ${esc(c.total_groups)} nhóm`;
      if(key==='sep')return !M.blank(c.reason)?esc(reason(c.reason)):`${esc(c.local_segment_count)} segment của thiết bị · ${esc(c.expected_pim_count)} PIM kỳ vọng`;
      return c.sampled_flow?'Đối chiếu luồng được lấy mẫu':`${esc(c.multicast_entries)} luồng multicast`;
    };
    return `<div class="svc-assessment-grid">${switchCheckKeys().map(key=>{const c=checks[key],view=Object.hasOwn(views,key)?views[key]:[checkView(key),'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v6m0 3h.01'],failed=issues.some(item=>item.key===key),topoGood=key==='sep'&&knownTopo&&!failed,tone=failed?c?.optional?'warn':'fail':topoGood?'good':c?.skipped?'skipped':!c?'unknown':c.status===true?'good':'unknown',badge=key==='sep'?(failed?pill('Cần kiểm tra',c?.optional?'warn':'fail'):topoGood?topologyTag(topoType):stateLabel(c)):(failed&&!c?pill('Cần kiểm tra','fail'):stateLabel(c));return `<button type="button" class="svc-assessment is-${tone}" data-check-tab="${view[0]}" data-check-key="${esc(key)}"><span class="svc-assessment-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${view[1]}"/></svg></span><span class="svc-assessment-title">${esc(checkName(key))}</span>${badge}<span class="svc-assessment-note">${summary(key,c)}</span></button>`;}).join('')}</div>`;
  }
  function counterTable(c){
    const check=c||{},notChecked=M.list(check.not_checked_metrics),metricKey=v=>M.normalize(v).replace(/[^a-z]/g,'').replace(/s$/,'');
    const metricValue=(p,key)=>{
      const omitted=[...notChecked,...M.list(p.not_checked_metrics)].some(v=>metricKey(v)===metricKey(key));
      return omitted?'<span class="svc-counter-omitted">Không kiểm tra</span>':M.list(p[key]).map(num).join(' → ')||'—';
    };
    return `<h2>CRC / discard · ${esc(check.sample_count)} mẫu · Cách nhau ${esc(check.interval_seconds)} giây</h2>`+(notChecked.length?`<p class="svc-counter-scope">Không kiểm tra trong lượt này: ${notChecked.map(esc).join(' · ')}.</p>`:'')+checkPage(M.list(check.ports),['Interface','CRC','InDiscard','OutDiscard','Kết quả'],p=>`<tr${reviewRow(p)}>${td(esc(p.port))}${['crc','in_discard','out_discard'].map(k=>td(metricValue(p,k),'mono')).join('')}${td(stateLabel(p))}</tr>`);
  }
  function renderChecks(){
    const r=result(),c=r.checks||{},tab=state.tab;get('checkPager').hidden=true;let html='';
    if(tab==='overview')html=context().unavailable||!context().hasChecks&&!M.list(r.failures).length?`<div class="svc-role-empty">${contextGraphic('switch')}<h2>${context().unavailable?'Chưa triển khai kiểm tra '+esc(context().label):'Chưa có dữ liệu kiểm tra'}</h2><p>${esc(response.message||'Chọn thiết bị có bộ kiểm tra được hỗ trợ hoặc mở kết quả đã lưu.')}</p></div>`:'<h2>Các hạng mục kiểm tra · '+esc(context().label)+'</h2>'+checkCards(c);
    else if(tab==='ports')html='<h2>Trạng thái Port & công suất quang</h2>'+checkPage(M.list(c.interface_status?.ports),['Interface / Mô tả','Admin · Oper','RX (dBm)','Ngưỡng công suất (dBm)','Đánh giá'],p=>{const o=M.list(c.optical_power?.ports).find(v=>v.port===p.port)||{},rating=p.admin_status==='DOWN'||p.oper_status==='DOWN'?{status:false,reason:'interface_down'}:o;return `<tr${reviewRow(rating)}>${td(esc(p.port)+(!M.blank(p.description)?`<small>${esc(p.description)}</small>`:''))}${td(`<span class="svc-port-states">${portStateTag(p.admin_status)}${portStateTag(p.oper_status)}</span>`)}${td(num(o.rx),'number')}${td(opticalRange(o.low_alarm_threshold,o.high_alarm_threshold),'number')}${td(ratingCell(rating))}</tr>`;},'svc-switch-ports');
    else if(tab==='counters')html=counterTable(c.counters);
    else if(tab==='lacp')html='<h2>LACP · Aggregation & member</h2>'+checkPage(M.list(c.lacp?.trunks),['Aggregation','Member / Local state','Kết quả'],t=>`<tr${reviewRow(t)}>${td(esc(t.trunk))}${td(M.list(t.members).map(m=>`${esc(m.port)} ${pill(m.skipped?'Bỏ qua':m.selection_status,m.skipped?'':m.status===false?'fail':m.status?'good':'')}<br>`).join('')||'—')}${td(ratingCell(t))}</tr>`);
    else if(tab==='topology')html=topologyTable(c);
    else if(tab==='other')html='<h2>Các hạng mục kiểm tra khác</h2>'+switchCheckKeys().filter(key=>checkView(key)==='other').map(key=>`<article class="svc-check-card"><h3>${esc(checkName(key))} ${stateLabel(c[key])}</h3>${c[key]?`<details><summary>Dữ liệu ghi nhận</summary>${json(c[key])}</details>`:''}</article>`).join('');
    else if(tab==='routing'){
      const rt=c.routes||{},p=rt.pim_routes||{},rows=[...M.list(p.matched).map(v=>({v,matched:true})),...M.list(p.missing).map(v=>({v,matched:false}))];
      const di=context().role==='DI',ospf=c.ospf_peers,ospfRows=M.list(ospf?.records);
      const ospfTable=ospfRows.length?'<h3>OSPF peers</h3>'+table(['Area','Interface','Neighbor ID','State'],ospfRows.map(v=>`<tr${reviewRow({status:String(v.state).toUpperCase()==='FULL'})}>${td(esc(v.area))}${td(esc(v.interface))}${td(esc(v.neighbor_id))}${td(pill(v.state,String(v.state).toUpperCase()==='FULL'?'good':'fail'))}</tr>`)):'';
      html=`<h2>${di?'OSPF, PIM & định tuyến':'PIM & định tuyến'}</h2><div class="svc-check-facts svc-routing-facts">`+(di?fact('OSPF peer Full',`${num(ospf?.full_count)} / ${num(ospf?.count)} ${stateLabel(ospf)}`):'')+fact('PIM neighbors',M.list(c.pim_neighbors?.neighbors).map(esc).join(' · ')||'—')+(di?fact('PIM khớp OSPF',`${num(c.pim_neighbors?.matched_count)} / tối thiểu ${num(c.pim_neighbors?.expected_count)} ${stateLabel(c.pim_neighbors)}`):fact('Management default',M.list(rt.management_default?.next_hops).map(esc).join(' · ')||'—'))+fact(di?'Route qua OSPF':'Route PIM',`${M.list(p.matched).length} / ${esc(p.required)} ${stateLabel(p)}`)+'</div>'+ospfTable+checkPage(rows,['Prefix · Mask','Next-hop cấu hình','Kết quả'],({v,matched})=>`<tr>${td(routePrefix(v),'svc-route-destination')}${td(esc(M.list(v.configured_next_hops).join(' · ')||v.next_hop))}${td(pill(matched?'Khớp':'Thiếu / Sai',matched?'good':'fail'))}</tr>`);
    }else if(tab==='multicast')html=olt()?oltMulticast(r.multicast):switchMulticast(c);
    get('checkContent').innerHTML=(!olt()&&tab!=='overview'?tabIssues(tab):'')+html;
  }
  function topologyTable(c){
    const source=M.list(result().failures).find(f=>f.check==='sep')?.observed,sep=c.sep||(source&&typeof source==='object'?source:{}),topology=result().topology||{},type=topology.type||context().rawTopology;
    const rawType=String(M.blank(type)?'':type).toLowerCase().replace(/[\s-]+/g,'_'),known=['star','ring','ring_sep','sep','ospf'].includes(rawType),issue=switchIssues().find(item=>item.key==='sep');
    const topoState=issue?pill(issue.optional?'Cần kiểm tra · Tùy chọn':'Cần kiểm tra',issue.optional?'warn':'fail'):known?pill('Đạt','good'):stateLabel(sep);
    if(rawType==='ospf'){
      const ospf=c.ospf_peers||topology.ospf_peers||{},rows=M.list(ospf.records);
      return '<h2>Topo '+topoState+'</h2><div class="svc-check-facts svc-topology-facts">'+fact('Mô hình',topologyTag(type))+fact('OSPF peer Full',num(ospf.full_count)+' / '+num(ospf.count))+fact('PIM khớp OSPF',num(c.pim_neighbors?.matched_count)+' / tối thiểu '+num(c.pim_neighbors?.expected_count))+'</div>'+table(['Area','Interface','Neighbor ID','Trạng thái'],rows.map(v=>`<tr${reviewRow({status:String(v.state).toUpperCase()==='FULL'})}>${td(esc(v.area))}${td(esc(v.interface))}${td(esc(v.neighbor_id))}${td(pill(v.state,String(v.state).toUpperCase()==='FULL'?'good':'fail'))}</tr>`));
    }
    let html='<h2>Topo '+topoState+'</h2><div class="svc-check-facts svc-topology-facts">'+fact('Mô hình',topologyTag(type))+fact('Segment có thiết bị / Tổng segment',num(sep.local_segment_count)+' / '+num(sep.segment_count))+fact('PIM kỳ vọng / Thực tế',num(sep.expected_pim_count)+' / '+num(c.pim_neighbors?.count))+'</div>';
    if(!M.blank(sep.reason||sep.skip_reason))html+='<p>'+esc(reason(sep.skip_reason||sep.reason))+'</p>';
    if(!M.blank(sep.expected))html+='<p>'+esc(sep.expected)+'</p>';
    const rows=M.list(sep.segments).flatMap(segment=>M.list(segment.directions).length?segment.directions.map(direction=>({segment,direction})):[{segment,direction:null}]);
    if(!rows.length)return html+(sep.skipped?'':'<div class="svc-empty"><b>Chưa có dữ liệu segment SEP để hiển thị</b><span>Xem bằng chứng và lệnh đối chiếu của hạng mục phía trên.</span></div>');
    const port=value=>value?esc(value.port)+`<small>${[value.role,value.state].filter(v=>!M.blank(v)).map(esc).join(' · ')}</small>`:'—';
    return html+checkPage(rows,['Segment','Port thiết bị / Vai trò / Trạng thái','Port liền kề / Vai trò / Trạng thái','Đóng góp PIM','Đánh giá'],({segment,direction})=>`<tr${reviewRow(segment)}>${td(esc(segment.segment))}${td(port(direction?.local))}${td(M.list(direction?.adjacent).map(port).join('<br>')||'—')}${td(num(direction?.contribution),'number')}${td(ratingCell({...segment,reason:M.list(segment.reasons).map(reason).join('; ')}))}</tr>`);
  }
  function oltMulticast(m){
    if(!m)return '<h2>Multicast</h2><div class="svc-empty">Chưa có thông tin multicast.</div>';
    const number=v=>typeof v==='number'||typeof v==='string'&&v.trim()!==''?Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null:null;
    const count=v=>number(v)===null?'Chưa có số liệu':number(v).toLocaleString('vi-VN',{maximumFractionDigits:2});
    const failed=c=>c?.status==='NOT_OK'||c?.valid===false&&c?.status!=='SKIPPED';
    const card=(label,v)=>`<div class="svc-multicast-card ${v===true?'is-ok':v===false?'is-nok':'is-unknown'}"><small>${esc(label)}</small><b>${v===true?'Đạt':v===false?'Cần kiểm tra':'Chưa có dữ liệu'}</b></div>`;
    const checks=m.checks||{},definitions={
      b1_prejoin_traffic:['B1','Lưu lượng các kênh multicast cấu hình sẵn'],
      b2_uplink_traffic:['B2','Lưu lượng multicast trên Port hướng lên'],
      b3_igmp_config:['B3','Đối chiếu cấu hình IGMP'],
      b4_user_online:['B4','Thuê bao đang sử dụng multicast'],
    };
    const state=(key,c)=>{
      if(c.status==='SKIPPED'||c.skipped===true)return pill('Bỏ qua');
      if(key==='b4_user_online'){
        if(c.status==='OK'||c.valid===true)return pill('Có thuê bao hoạt động','good');
        if(c.status==='NO_USER_ONLINE')return pill('Chưa ghi nhận thuê bao','warn');
      }
      if(c.status==='OK'||!c.status&&c.valid===true)return pill('Đạt','good');
      if(failed(c))return pill('Cần kiểm tra',key==='b4_user_online'&&c.required!==true?'warn':'fail');
      return pill('Chưa có dữ liệu');
    };
    const metric=(label,value)=>`<div><small>${esc(label)}</small><b>${esc(value)}</b></div>`;
    function evidence(key,c){
      if(key==='b1_prejoin_traffic'){
        const channels=M.list(c.channels).filter(row=>row&&typeof row==='object');
        const rows=channels.map(row=>({...row}));
        for(const index of M.list(c.indexes))if(!rows.some(row=>String(row.index)===String(index)))rows.push({index,kbps:null});
        if(!rows.length)return '<p class="svc-mc-note">Chưa có số liệu lưu lượng kênh multicast.</p>';
        const active=rows.filter(row=>number(row.kbps)!==null&&number(row.kbps)>0).length;
        return `<p class="svc-mc-lead"><b>${active}/${rows.length}</b> kênh có lưu lượng</p>`+table(['Chỉ số kênh','Lưu lượng (kb/s)','Ghi nhận'],rows.map(row=>{
          const kbps=number(row.kbps);
          return `<tr>${td(esc(row.index))}${td(esc(count(row.kbps)),'number')}${td(kbps===null?pill('Chưa có số liệu'):kbps>0?pill('Có lưu lượng','good'):pill('Không có lưu lượng','warn'))}</tr>`;
        }),'svc-mc-channels');
      }
      if(key==='b2_uplink_traffic'){
        if(c.status==='SKIPPED'&&c.reason==='B1_OK')return '<p class="svc-mc-note">B1 đã xác nhận có lưu lượng, không cần kiểm tra bổ sung.</p>';
        const reasons={UPLINK_NOT_FOUND:'Chưa xác định được Port hướng lên từ cấu hình thiết bị.',NO_TRAFFIC_OR_PARSE_FAILED:'Chưa xác nhận được lưu lượng multicast trên Port hướng lên.'};
        const note=Object.hasOwn(reasons,c.reason)?reasons[c.reason]:'';
        return '<div class="svc-mc-metrics">'+metric('Port hướng lên',M.blank(c.uplink_port)?'Chưa xác định':c.uplink_port)+metric('Lưu lượng (kb/s)',count(c.kbps))+'</div>'+(note?`<p class="svc-mc-note">${esc(note)}</p>`:'');
      }
      if(key==='b3_igmp_config'){
        const service=number(c.total_service_port),members=number(c.total_igmp_member),delta=service!==null&&members!==null?Math.abs(service-members):null;
        const note=delta===null?'<p class="svc-mc-note">Chưa đủ số liệu để đối chiếu.</p>':delta===0?'<p class="svc-mc-note">Số lượng service-port và thành viên IGMP khớp nhau.</p>':'';
        return `<p class="svc-mc-lead">VLAN ${esc(c.vlan)}</p><div class="svc-mc-metrics">`+metric('Service-port',count(c.total_service_port))+metric('Thành viên IGMP',count(c.total_igmp_member))+metric('Chênh lệch',delta===null?'Chưa xác định':count(delta)+' bản ghi')+'</div>'+note;
      }
      if(key==='b4_user_online')return '<div class="svc-mc-metrics">'+metric('Thuê bao IGMP đang hoạt động',count(c.online_user_count))+metric('Port PON có thuê bao hoạt động',count(c.online_pon_count))+'</div>';
      return '<p class="svc-mc-note">Xem dữ liệu kỹ thuật bên dưới để đối chiếu hạng mục bổ sung.</p>';
    }
    const rows=Object.entries(checks).sort(([a],[b])=>{
      const order=Object.keys(definitions),rank=k=>order.includes(k)?order.indexOf(k):order.length;
      return rank(a)-rank(b);
    });
    const hasFlags=['multicast_stream','igmp_request'].some(k=>Object.hasOwn(m,k));
    const cards=!hasFlags&&Object.hasOwn(m,'overall_ok')?card('Kết quả multicast',m.overall_ok):card('Lưu lượng multicast',m.multicast_stream)+card('Đối chiếu cấu hình IGMP',m.igmp_request);
    const b3=checks.b3_igmp_config,service=number(b3?.total_service_port),members=number(b3?.total_igmp_member);
    const mismatch=b3&&failed(b3)&&service!==null&&members!==null&&service!==members;
    const summary=mismatch?`B3 — Số service-port và thành viên IGMP trên VLAN ${esc(b3.vlan)} chênh lệch <b>${count(Math.abs(service-members))} bản ghi</b>.`:m.overall_ok===false?'Có hạng mục cần kiểm tra; xem kết quả từng bước bên dưới.':m.overall_ok===true?'Các tiêu chí multicast bắt buộc đã đạt theo kết quả trả về.':'';
    const stepList=rows.length?'<div class="svc-mc-list"><div class="svc-mc-list-head" aria-hidden="true"><span>Hạng mục</span><span>Kết quả</span><span>Chi tiết</span></div>'+rows.map(([key,c])=>{
      const def=Object.hasOwn(definitions,key)?definitions[key]:null,review=failed(c)&&c.status!=='SKIPPED'&&(key!=='b4_user_online'||c.required===true);
      const title=def?def[1]:key.replace(/_/g,' '),step=def?pill(def[0],'svc-mc-step-tag'):'';
      return `<details class="svc-mc-item${review?' svc-mc-needs-review':''}"><summary aria-label="${esc(title)} · mở hoặc đóng chi tiết"><span class="svc-mc-step">${step}<b>${esc(title)}</b></span><span class="svc-mc-state">${state(key,c)}</span><span class="svc-mc-disclosure">Chi tiết <span aria-hidden="true">⌄</span></span></summary><div class="svc-mc-detail"><h3>Chi tiết</h3>${evidence(key,c)}</div></details>`;
    }).join('')+'</div>':'';
    return '<section class="svc-olt-multicast"><h2>Multicast OLT</h2>'+(summary?`<p class="svc-mc-summary${mismatch?' is-review':''}">${summary}</p>`:'')+'<div class="svc-multicast-grid">'+cards+'</div>'+stepList+'<details class="svc-mc-technical"><summary>Xem dữ liệu kỹ thuật</summary>'+json(m)+'</details></section>';
  }
  function switchMulticast(c){
    const m=c.multicast_routing||{},l=c.l2_multicast||{},flow=m.sampled_flow;
    let facts='',note='',technical='';
    if(flow){
      const interfaces=[flow.upstream_interface,flow.pim_upstream_interface].filter((value,index,items)=>!M.blank(value)&&items.indexOf(value)===index),up=flow.upstream_neighbor,rpf=flow.rpf_prime_neighbor;
      facts='<div class="svc-check-facts svc-multicast-facts">'+fact('Luồng mẫu (S,G)',`<span class="svc-flow-pair">${esc(flow.source)} <span aria-hidden="true">→</span> ${esc(flow.group)}</span>`)+fact('Interface hướng lên',interfaces.map(esc).join(' · ')||'—')+fact('PIM neighbor',!M.blank(up)&&up===rpf?`Upstream / RPF · ${esc(up)}`:[!M.blank(up)?`Upstream · ${esc(up)}`:'',!M.blank(rpf)?`RPF · ${esc(rpf)}`:''].filter(Boolean).join('<br>')||'—')+'</div>';
      note=`Nguồn đối chiếu: ${flow.evidence_source==='pim_routing_table'?'Bảng PIM':flow.evidence_source==='multicast_routing_table'?'Bảng multicast kết hợp bảng PIM':'Dữ liệu luồng multicast'}.`;
      technical='<details class="svc-mc-technical svc-switch-multicast-technical"><summary>Xem dữ liệu kỹ thuật</summary>'+json(flow)+'</details>';
    }else facts='<div class="svc-check-facts svc-multicast-facts">'+fact('Multicast entries',num(m.multicast_entries))+fact('PIM (S,G) entries',num(m.pim_sg_entries))+fact('Yêu cầu tối thiểu',num(m.minimum_entries))+'</div>';
    if(m.skipped)note='Bỏ qua có điều kiện: '+reason(m.skip_reason);
    return '<section class="svc-switch-multicast"><header><h2>Multicast routing</h2>'+stateLabel(m)+'</header>'+facts+(note?'<p class="svc-switch-multicast-note">'+esc(note)+'</p>':'')+technical+'<div class="svc-l2-multicast"><strong>L2 multicast</strong><span>VLAN <b>'+esc(l.vlan)+'</b></span><span><b>'+esc(l.total_groups)+'</b> nhóm</span>'+stateLabel(l)+(l.optional?pill('Tùy chọn','info'):'')+'</div></section>';
  }
  function resetFilters(){clearTimeout(searchTimer);state.query='';state.attention='all';state.oper='all';state.scope=null;state.page=0;state.openPon=null;state.innerPage=0;get('onuSearch').value='';renderData();}
  function filteredChanged(){state.page=0;state.openPon=null;state.innerPage=0;clearTimeout(searchTimer);renderData();}
  function download(content,type,name){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  const filename=()=>String(result().nameDev||'service-response').replace(/[^\w.-]/g,'_');
  get('deviceForm').addEventListener('submit',e=>{e.preventDefault();if(!mockupTools)return;const q=M.normalize(get('deviceInput').value),entry=Object.entries(samples).find(([,d])=>q&&[d.result?.nameDev,d.result?.ipDev].some(v=>M.normalize(v)===q));if(entry)loadResponse(entry[1],'Response mẫu thật');else error('Chưa có kết quả của thiết bị này. Hãy dán kết quả hoặc nạp tệp JSON.');});
  get('openPayload').addEventListener('click',()=>{if(!mockupTools)return;payloadError('');get('payloadDialog').showModal();get('payloadInput').focus();});
  for(const id of ['closePayload','cancelPayload'])get(id).addEventListener('click',()=>get('payloadDialog').close());
  get('payloadDialog').addEventListener('close',()=>{get('payloadInput').value='';payloadError('');get('openPayload').focus();});
  get('payloadForm').addEventListener('submit',e=>{e.preventDefault();submitPayload();});
  get('payloadInput').addEventListener('input',()=>payloadError(''));
  get('payloadInput').addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();submitPayload();}});
  get('closeOnuReview').addEventListener('click',()=>get('onuReviewDialog').close());
  get('onuReviewDialog').addEventListener('close',()=>{get('onuReviewContent').innerHTML='';get('onuReviewTitle').textContent='Đối chiếu ONU';get('onuReviewMeta').textContent='';if(reviewUid)root.querySelector(`[data-onu-review="${reviewUid}"]`)?.focus?.();reviewUid=null;});
  get('sampleSelect').addEventListener('change',e=>{if(mockupTools&&samples[e.target.value])loadResponse(samples[e.target.value],'Response mẫu thật');});
  get('responseFile').addEventListener('change',async e=>{if(!mockupTools)return;const file=e.target.files?.[0];if(!file)return;const revision=++importRevision;try{if(file.size>20*1024*1024)throw new Error('File vượt giới hạn 20 MB.');const text=await file.text();if(revision!==importRevision)return;const data=JSON.parse(text.replace(/^\uFEFF/,''));if(loadResponse(data,'JSON: '+file.name))notice('Đã hiển thị kết quả.');}catch(err){if(revision===importRevision)error('Không nạp được JSON: '+(err instanceof SyntaxError?'Sai cú pháp JSON.':err.message));}finally{e.target.value='';}});
  get('resultTabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b||!tabs().some(([k])=>k===b.dataset.tab))return;state.tab=b.dataset.tab;state.checkPage=0;renderTabs();renderWorkspace();get('svc-tab-'+state.tab)?.focus?.({preventScroll:true});});
  get('resultTabs').addEventListener('keydown',e=>{if(!response||!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();const items=tabs(),at=items.findIndex(([k])=>k===state.tab),next=e.key==='Home'?0:e.key==='End'?items.length-1:(at+(e.key==='ArrowRight'?1:-1)+items.length)%items.length;state.tab=items[next][0];state.checkPage=0;renderTabs();renderWorkspace();get('svc-tab-'+state.tab)?.focus?.({preventScroll:true});});
  get('onuSearch').addEventListener('input',e=>{state.query=e.target.value;state.page=0;state.openPon=null;state.innerPage=0;clearTimeout(searchTimer);searchTimer=setTimeout(renderData,160);});
  get('attentionFilter').addEventListener('change',e=>{state.attention=e.target.value;filteredChanged();});get('ponStatusFilter').addEventListener('change',e=>{state.oper=e.target.value;filteredChanged();});get('resetFilters').addEventListener('click',resetFilters);
  get('pageSize').addEventListener('change',e=>{if(state.mode!=='onu')return;state.onuSize=Number(e.target.value);state.page=0;state.openPon=null;renderData();});
  for(const [id,step] of [['prevPage',-1],['nextPage',1]])get(id).addEventListener('click',()=>{if(state.mode!=='onu'||get(id).disabled)return;state.page+=step;state.openPon=null;renderData();});
  for(const [id,step] of [['checkPrev',-1],['checkNext',1]])get(id).addEventListener('click',()=>{state.checkPage+=step;renderChecks();});
  root.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||b.disabled||!response)return;const d=b.dataset;let focus='';
    if(d.onuReview!==undefined){openOnuReview(d.onuReview);return;}
    if(d.checkTab!==undefined){if(!tabs().some(([key])=>key===d.checkTab))return;state.tab=d.checkTab;state.checkPage=checkPageFor(d.checkKey);renderTabs();renderWorkspace();get('svc-tab-'+state.tab)?.focus?.({preventScroll:true});root.querySelector('#checkWorkspace')?.scrollIntoView?.({block:'start'});return;}
    else if(d.mode!==undefined){state.mode=d.mode==='onu'?'onu':'pon';state.page=0;state.openPon=null;renderData();focus=`[data-mode="${state.mode}"]`;}
    else if(d.openPon!==undefined){const id=Number(d.openPon);if(!index.ports[id])return;state.openPon=state.openPon===id?null:id;state.innerPage=0;renderData();focus=`[data-open-pon="${id}"]`;}
    else if(d.portAttention!==undefined){state.scope=Number(d.portAttention);state.mode='onu';state.attention='any';state.page=0;state.openPon=null;renderData();}
    else if(d.signal!==undefined){state.attention=state.attention===d.signal?'all':d.signal;state.scope=null;state.mode='onu';filteredChanged();focus=`[data-signal="${d.signal}"]`;}
    else if(d.warnings!==undefined){state.warnings=!state.warnings;renderData();focus='[data-warnings]';}
    else if(d.clearScope!==undefined){state.scope=null;filteredChanged();}
    else if(d.innerPage!==undefined){state.innerPage+=Number(d.innerPage);renderData();}
    if(focus)root.querySelector(focus)?.focus?.({preventScroll:true});
  });
  root.addEventListener('change',e=>{const d=e.target.dataset;if(d.innerSize!==undefined){state.innerSize=Number(e.target.value);state.innerPage=0;renderData();}else if(d.column&&Object.hasOwn(groups,d.column)){groups[d.column]=e.target.checked;try{localStorage.setItem('netauto-service-columns-v1',JSON.stringify(groups));}catch{}renderData();}});
  get('exportJson').addEventListener('click',()=>{if(response)download(JSON.stringify(response,null,2),'application/json;charset=utf-8',filename()+'.json');});
  get('exportCsv').addEventListener('click',()=>{if(!response)return;clearTimeout(searchTimer);renderData();download(M.csv(filtered.rows,groups),'text/csv;charset=utf-8',filename()+'-filtered.csv');notice('Đã xuất '+filtered.rows.length+' ONU khớp bộ lọc, không chỉ trang hiện tại.');});get('clearResult').addEventListener('click',clear);
  window.NETAUTO_SERVICE_CHECK_UI={loadResponse,loadPayload,clear,getResponse:()=>response,getView:()=>({mode:state.mode,tab:state.tab,query:state.query,attention:state.attention,scope:state.scope,page:state.page,openPon:state.openPon,filteredOnu:filtered.rows.length,filteredPorts:filtered.ports.length})};
  for(const id of ['mockupTools','payloadDialog'])get(id).hidden=!mockupTools;
  if(mockupTools)loadResponse(samples.gc16||Object.values(samples)[0],'Response mẫu thật');else clear();
})();
