(()=>{
  'use strict';
  const M=window.NETAUTO_SERVICE_MODEL,samples=window.NETAUTO_SERVICE_RESPONSES||{},root=document.getElementById('serviceApp'),get=id=>document.getElementById(id);
  const esc=v=>String(v==null||v===''?'—':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>M.blank(v)?'—':Number.isFinite(Number(v))?Number(v).toLocaleString('en-US',{maximumFractionDigits:2}):esc(v);
  const pill=(v,tone='')=>`<span class="svc-pill ${tone}">${esc(v)}</span>`;
  const td=(v,cls='')=>`<td class="${cls}">${v}</td>`;
  const table=(heads,rows,cls='')=>`<div class="svc-table-scroll"><table class="svc-table ${cls}"><thead><tr>${heads.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.join(''):`<tr><td colspan="${heads.length}"><div class="svc-empty"><b>Không có dữ liệu phù hợp</b><span>Thử bỏ lọc hoặc chọn hạng mục khác.</span></div></td></tr>`}</tbody></table></div>`;
  const stateLabel=c=>c?.skipped?pill('Bỏ qua'):c?.status===true?pill('Đạt','good'):c?.status===false?pill(c.optional?'Chưa đạt · Tùy chọn':'Không đạt',c.optional?'warn':'fail'):pill('Chưa có dữ liệu');
  const fact=(label,value)=>`<div><small>${esc(label)}</small><b>${value}</b></div>`;
  const diagnosticFact=(label,value,tone='neutral',message=false)=>`<div class="svc-diagnostic-card is-${tone}${message?' is-message':''}"><small>${esc(label)}</small><b>${value}</b></div>`;
  const onuOptionLabels={onuMac:'MAC',onuModel:'Model',onuOltDistance:'Khoảng cách',onuRx:'Rx',onuTx:'Tx',onuSn:'SN',onuTemp:'Nhiệt độ'};
  const optionValue=v=>v==null?'-':v===true?'Có':v===false?'Không':String(v);
  const optionIndicator=value=>typeof value==='boolean'?`<span class="svc-option-icon ${value?'is-yes':'is-no'}" role="img" aria-label="${value?'Có':'Không'}"><span aria-hidden="true">${value?'✓':'✕'}</span></span>`:`<span class="svc-option-unknown">${esc(optionValue(value))}</span>`;
  function requestOptionsHtml(value){
    const options=value&&typeof value==='object'&&!Array.isArray(value)?value:{},known=Object.keys(onuOptionLabels),hasOnu=known.some(k=>typeof options[k]==='boolean'),selected=known.filter(k=>options[k]===true).length;
    const extra=Object.entries(options).filter(([k])=>!['mac_limit','multicast_check','multicast_only',...known].includes(k));
    const list=Object.entries(onuOptionLabels).map(([key,label])=>`<div class="svc-onu-option" data-request-option="${key}"><span>${esc(label)}</span>${optionIndicator(options[key])}</div>`).join('');
    return `<div class="svc-param-strip"><span class="svc-request-param"><span>Giới hạn MAC/PON:</span><b>${esc(optionValue(options.mac_limit))}</b></span><span class="svc-request-param"><span>Multicast</span>${optionIndicator(options.multicast_check)}</span><details class="svc-onu-options"><summary aria-label="Thông số ONU yêu cầu thu thập"><span>ONU:</span><b>${hasOnu?selected+' thông số đã chọn':'Chưa có dữ liệu'}</b><span class="svc-options-chevron" aria-hidden="true">⌄</span></summary><div class="svc-onu-options-panel"><div class="svc-onu-options-grid">${list}</div></div></details>${extra.length?`<details class="svc-extra-options"><summary>Tham số khác (${extra.length})</summary><dl>${extra.map(([key,v])=>`<div><dt>${esc(key)}</dt><dd>${optionIndicator(v)}</dd></div>`).join('')}</dl></details>`:''}</div>`;
  }
  const statCard=(label,value,tone='blue')=>`<div class="svc-stat-card tone-${tone}"><small>${esc(label)}</small><b>${num(value)}</b></div>`;
  const reasonLabels={empty_aggregation:'Nhóm rỗng',eth_trunk_down:'Aggregation DOWN',aggregation_down:'Aggregation DOWN',member_down:'Member DOWN',interface_down:'Interface DOWN',vlan_interface:'VLAN interface',copper_transceiver:'Module đồng',copper_module:'Module đồng',missing_optical_values:'Thiếu dữ liệu quang',missing_required_prefix:'Thiếu prefix bắt buộc',no_loopback_source_pull_configuration:'LoopBack không cấu hình source-pull'};
  const reason=v=>reasonLabels[v]||v;
  const checkNames={interface_status:'Trạng thái port',optical_power:'Công suất quang',counters:'CRC / discard',lacp:'LACP',pim_neighbors:'PIM neighbor',routes:'Định tuyến',multicast_routing:'Multicast routing',l2_multicast:'L2 multicast'};
  const baseGroups={identity:true,customer:true,optics:true,operation:true};
  const onuColumns=[{key:'pon',label:'PON',width:88},{key:'onu_id',label:'ONU index',width:96},{key:'customer',label:'Khách hàng',group:'customer',width:140},{key:'connection',label:'Kết nối',group:'customer',width:180},{key:'identity',label:'Thiết bị ONU',group:'identity',width:216},{key:'optics',label:'Rx / Tx (dBm)',group:'optics',width:112,numeric:true},{key:'operation',label:'Nhiệt độ',subLabel:'Kh.cách OLT-ONU',group:'operation',width:164,numeric:true},{key:'attention',label:'Chú ý khách hàng',width:156}];
  const onuCellClass=c=>['svc-col-'+c.key,c.key==='pon'?'svc-sticky-pon':c.key==='onu_id'?'svc-sticky-onu':c.numeric?'number':''].filter(Boolean).join(' ');
  let groups={...baseGroups};try{const saved=JSON.parse(localStorage.getItem('netauto-service-columns-v1'));for(const key of Object.keys(groups))if(typeof saved?.[key]==='boolean')groups[key]=saved[key];}catch{}
  let response=null,index=null,origin='',filtered={ports:[],rows:[]},searchTimer=0,noticeTimer=0,importRevision=0;
  let state=fresh();
  function fresh(){return {tab:'onu',mode:'pon',query:'',attention:'all',oper:'all',scope:null,page:0,onuSize:50,openPon:null,innerPage:0,innerSize:25,checkPage:0,warnings:false};}
  const olt=()=>response?.device_type==='OLT';
  const result=()=>response?.result||{};
  function json(value){const text=JSON.stringify(value,null,2)??'null',limit=24000;return `<pre>${esc(text.slice(0,limit))}</pre>`+(text.length>limit?'<p>Bản xem rút gọn. Xuất JSON gốc để lấy đủ nội dung.</p>':'');}
  function error(message){get('requestError').textContent=message;get('requestError').hidden=!message;}
  function notice(message){clearTimeout(noticeTimer);get('svcNotice').textContent=message;get('svcNotice').hidden=false;noticeTimer=setTimeout(()=>get('svcNotice').hidden=true,3500);}
  function clear(){importRevision++;clearTimeout(searchTimer);response=null;index=null;filtered={ports:[],rows:[]};state=fresh();get('resultSection').hidden=true;get('resultEmpty').hidden=false;get('onuTableHost').innerHTML='';get('checkContent').innerHTML='';get('onuSearch').value='';get('backendWarnings').innerHTML='';get('backendWarnings').hidden=true;error('');}
  function loadResponse(value,source='JSON đã nạp'){
    const invalid=M.validate(value);if(invalid){error(invalid+' Kết quả đang mở được giữ nguyên.');return false;}
    importRevision++;clearTimeout(searchTimer);response=value;index=M.index(value);origin=source;state=fresh();state.tab=olt()?'onu':'overview';
    error('');get('resultSection').hidden=false;get('resultEmpty').hidden=true;get('deviceInput').value=result().nameDev||result().ipDev||'';
    get('sampleSelect').value=Object.keys(samples).find(key=>samples[key]===value)||'';get('onuSearch').value='';get('attentionFilter').value='all';get('ponStatusFilter').value='all';
    renderHeader();renderTabs();renderWorkspace();return true;
  }
  function renderHeader(){
    const r=result();get('deviceKind').textContent=olt()?'OLT':'SWITCH CE';get('deviceName').textContent=r.nameDev||'Thiết bị chưa xác định';get('deviceMeta').textContent=[r.ipDev,r.vendor,r.model,origin].filter(Boolean).join(' · ');
    get('resultStatus').textContent=olt()?(response.status?'Thu thập thành công':'Thu thập không thành công'):(response.status?'Đạt theo response':'Không đạt');get('resultStatus').className='svc-pill '+(response.status?'good':'fail');
    get('resultMessage').textContent=(response.message||'Response không có message.')+(olt()?' Thu thập thành công không đồng nghĩa tất cả ONU Online.':'');
    const count=r.count||{};get('sourceStats').innerHTML=olt()?[['Port PON',count.device_total_ports,'blue'],['ONU',index.rows.length,'cyan'],['MAC',count.device_total_mac,'purple'],['SN',count.device_total_sn,'blue'],['IP WAN',count.device_total_ipwan,'cyan']].map(([k,v,t])=>statCard(k,v,t)).join(''):[['Port được chọn',M.list(r.selected_ports).length],['Hạng mục không đạt',M.list(r.failures).length],['Cảnh báo backend',M.list(r.warnings).length]].map(([k,v])=>statCard(k,v)).join('');
    get('requestOptions').innerHTML=olt()?requestOptionsHtml(r.options):'<span>Luồng CE đầy đủ · '+esc(r.checks?.counters?.sample_count)+' mẫu counters · Cách nhau '+esc(r.checks?.counters?.interval_seconds)+' giây</span>';
  }
  function tabs(){return olt()?[['onu','PON & ONU'],['multicast','Multicast'],['diagnostics','Chẩn đoán']]:[['overview','Tổng quan'],['ports','Port & quang'],['counters','CRC / discard'],['lacp','LACP'],['routing','Định tuyến'],['multicast','Multicast'],['diagnostics','Chẩn đoán']];}
  function renderTabs(){
    const c=result().checks||{},keys={ports:['interface_status','optical_power'],counters:['counters'],lacp:['lacp'],routing:['pim_neighbors','routes'],multicast:['multicast_routing','l2_multicast']};
    get('resultTabs').innerHTML=tabs().map(([key,label])=>{const items=(keys[key]||[]).map(k=>c[k]).filter(Boolean),bad=items.some(v=>v.status===false&&!v.optional&&!v.skipped),skip=items.length&&items.every(v=>v.skipped);return `<button type="button" role="tab" id="svc-tab-${key}" data-tab="${key}" tabindex="${state.tab===key?'0':'-1'}" aria-selected="${state.tab===key}" aria-controls="${key==='onu'?'onuWorkspace':'checkWorkspace'}"><span class="svc-tab-dot ${bad?'fail':skip||!items.length?'skip':''}" aria-hidden="true">${bad?'!':skip?'–':items.length?'✓':'·'}</span>${label}</button>`;}).join('');
    get(state.tab==='onu'?'onuWorkspace':'checkWorkspace').setAttribute('aria-labelledby','svc-tab-'+state.tab);
  }
  function renderWorkspace(){get('onuWorkspace').hidden=!(olt()&&state.tab==='onu');get('checkWorkspace').hidden=olt()&&state.tab==='onu';if(olt()&&state.tab==='onu')renderData();else renderChecks();}
  function chosenColumns(nested=false){return onuColumns.filter(c=>(!nested||c.key!=='pon')&&(!c.group||groups[c.group]));}
  function onuLine(key,label,value,{numeric=false,unit='',mono=false,secondary=false,attention=false,hiddenLabel=false}={}){
    return `<span class="svc-cell-line${secondary?' is-secondary':''}${attention?' attention':''}" data-onu-field="${key}">${label?`<span class="${hiddenLabel?'svc-visually-hidden':'svc-cell-label'}">${esc(label)}${hiddenLabel?': ':''}</span>`:''}<span class="svc-cell-value${mono?' svc-cell-mono':''}">${numeric?num(value):esc(value)}${unit&&!M.blank(value)?` <span class="svc-cell-unit">${esc(unit)}</span>`:''}</span></span>`;
  }
  function cell(column,row){
    const o=row.source,cls=onuCellClass(column);let value='';
    if(column.key==='attention')return td(row.flags.length?row.flags.map(f=>pill(f.label,'warn')).join(' '):'—',cls+' svc-issue-cell');
    if(column.key==='pon')return td(esc(row.port.name),cls);
    if(column.key==='onu_id')return td(pill(o.onu_id),cls);
    if(column.key==='customer')value=onuLine('contract','',o.contract)+onuLine('net_status','',o.net_status,{secondary:true,attention:row.flags.some(f=>f.key==='contract')});
    else if(column.key==='connection')value=onuLine('drop_point','',o.drop_point)+onuLine('onu_ipwan','IP',o.onu_ipwan,{secondary:true,attention:row.flags.some(f=>f.key==='ip')});
    else if(column.key==='identity')value=onuLine('onu_model','',o.onu_model)+onuLine('onu_sn','SN',o.onu_sn,{mono:true,secondary:true})+onuLine('onu_mac','MAC',o.onu_mac,{mono:true,secondary:true});
    else if(column.key==='optics')value=onuLine('onu_rx','Rx',o.onu_rx,{numeric:true})+onuLine('onu_tx','Tx',o.onu_tx,{numeric:true});
    else if(column.key==='operation')value=onuLine('onu_temp','Nhiệt độ',o.onu_temp,{numeric:true,unit:'°C',hiddenLabel:true})+onuLine('onu_olt_distance','Kh.cách OLT-ONU',o.onu_olt_distance,{numeric:true,unit:'m',hiddenLabel:true});
    return td(`<span class="svc-cell-stack">${value}</span>`,cls);
  }
  function onuTable(rows,nested=false){
    const columns=chosenColumns(nested),width=columns.reduce((sum,c)=>sum+c.width,0),pinned=c=>['pon','onu_id'].includes(c.key),pinnedWidth=columns.filter(pinned).reduce((sum,c)=>sum+c.width,0),fluidWidth=width-pinnedWidth;
    const columnWidth=c=>pinned(c)?`${c.width}px`:`calc(${(100*c.width/fluidWidth).toFixed(6)}% - ${(pinnedWidth*c.width/fluidWidth).toFixed(6)}px)`;
    return `<div class="svc-table-scroll" role="region" aria-label="Bảng thông số ONU gom nhóm, có thể cuộn ngang" tabindex="0"><table class="svc-table svc-onu-table svc-onu-grouped" style="--svc-onu-width:${width}px;--svc-pon-width:88px"><colgroup>${columns.map(c=>`<col data-onu-column="${c.key}" style="width:${columnWidth(c)}">`).join('')}</colgroup><thead><tr>${columns.map(c=>`<th scope="col" class="${onuCellClass(c)}">${c.subLabel?`<span class="svc-heading-stack"><span>${esc(c.label)}</span><span>${esc(c.subLabel)}</span></span>`:esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(row=>`<tr data-onu-row="${row.uid}" class="${row.flags.length?'svc-flagged':''}">${columns.map(c=>cell(c,row)).join('')}</tr>`).join(''):`<tr><td colspan="${columns.length}"><div class="svc-empty"><b>Không có ONU phù hợp</b><span>${state.query||state.attention!=='all'?'Thử bỏ bớt bộ lọc.':'Response không có bản ghi ONU trên PON này.'}</span></div></td></tr>`}</tbody></table></div>`;
  }
  function pageText(p,label){return `${p.total?p.start+1:0}–${Math.min(p.start+p.size,p.total)} / ${p.total.toLocaleString('en-US')} ${label} · Trang ${p.page+1}/${p.pages}`;}
  function detail(entry){
    const p=entry.port,view=M.paginate(entry.rows,state.innerPage,state.innerSize);state.innerPage=view.page;
    const pager=view.total>25?`<div class="svc-data-footer svc-inner-footer"><label>ONU / trang <select data-inner-size aria-label="Số ONU mỗi trang trong PON">${[25,50,100].map(n=>`<option value="${n}" ${state.innerSize===n?'selected':''}>${n}</option>`).join('')}</select></label><span>${pageText(view,'ONU')}</span>${view.pages>1?`<div><button class="na-button" type="button" data-inner-page="-1" ${view.page===0?'disabled':''}>← Trước</button><button class="na-button" type="button" data-inner-page="1" ${view.page===view.pages-1?'disabled':''}>Sau →</button></div>`:''}</div>`:`<div class="svc-detail-count">${view.total} ONU${entry.rows.length!==p.rows.length?' khớp lọc':''}</div>`;
    return `<section class="svc-onu-detail" id="svc-detail-${p.id}" aria-label="ONU thuộc ${esc(p.name)}"><header><b>${esc(p.name)} · Thông tin ONU</b><span>${p.rows.length} ONU chi tiết · ${esc(p.source.available_onu)} có sẵn ${p.source.truncated?'· Đã giới hạn':''}</span></header>${onuTable(view.rows,true)}${pager}</section>`;
  }
  function backendNotices(){return [...(M.blank(response?.error)?[]:[{label:'Lỗi backend',value:response.error}]),...M.list(result().warnings).map(value=>({label:'Cảnh báo',value}))];}
  function signals(){
    const count=backendNotices().length;
    get('customerSignals').innerHTML=`<button type="button" class="svc-signal ${index.signals.any?'has-items':''}" data-signal="any" aria-pressed="${state.attention==='any'}">Chú ý KH <b>${index.signals.any}</b></button><button type="button" class="svc-signal ${count?'has-items':''}" data-warnings aria-controls="backendWarnings" aria-expanded="${state.warnings}">Lỗi / cảnh báo backend <b>${count}</b></button>`;
  }
  function renderData(){
    if(!response||!olt())return;
    filtered=M.filter(index,{query:state.query,attention:state.attention,oper:state.oper,scope:state.scope});signals();
    get('attentionFilter').value=state.attention;get('ponStatusFilter').value=state.oper;
    root.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
    root.querySelectorAll('[data-column]').forEach(b=>b.checked=groups[b.dataset.column]);
    const nested=state.mode==='pon';get('viewTitle').textContent=nested?'Bảng port PON':'Toàn bộ ONU';get('viewCount').textContent=`${filtered.ports.length} / ${index.ports.length} PON · ${filtered.rows.length.toLocaleString('en-US')} / ${index.rows.length.toLocaleString('en-US')} ONU đã trả khớp bộ lọc`;
    get('scopeChip').innerHTML=state.scope!=null?`<button type="button" class="svc-scope" data-clear-scope>Phạm vi: ${esc(index.ports[state.scope]?.name)} ×</button>`:'';
    const notices=backendNotices();get('backendWarnings').hidden=!state.warnings;get('backendWarnings').innerHTML=state.warnings?(notices.length?'<b>Lỗi / cảnh báo backend · Mức lượt chạy</b>'+notices.map(n=>`<p>${n.label}: ${esc(typeof n.value==='object'?JSON.stringify(n.value):n.value)}</p>`).join(''):'<p>Không có lỗi / cảnh báo backend trong response.</p>'):'';
    get('onuPager').hidden=nested;
    if(nested){
      state.page=0;get('pageInfo').textContent='';get('prevPage').disabled=true;get('nextPage').disabled=true;
      if(!filtered.ports.some(e=>e.port.id===state.openPon))state.openPon=null;
      const body=filtered.ports.map(entry=>{const p=entry.port,open=p.id===state.openPon,s=p.source;return `<tr class="${open?'svc-open-row':''}">${td(`<button type="button" class="svc-link" data-open-pon="${p.id}" aria-expanded="${open}" ${open?`aria-controls="svc-detail-${p.id}"`:''}><span aria-hidden="true">${open?'▾':'▸'}</span> ${esc(p.name)}</button>`)}${td(pill(`${s.admin_stt??'—'} / ${s.oper_stt??'—'}`,s.oper_stt==='UP'?'good':s.oper_stt==='DOWN'?'warn':''))}${td(`${p.rows.length} / ${num(s.total_mac)}`,'number')}${td(`${num(s.total_mac)} / ${num(s.total_sn)} / ${num(s.total_ipwan)}`,'number')}${td(p.attention?`<button type="button" class="svc-link warn" data-port-attention="${p.id}">${p.attention} ONU cần xem →</button>`:'—')}</tr>`+(open?`<tr class="svc-detail-row"><td colspan="5">${detail(entry)}</td></tr>`:'');});
      get('onuTableHost').innerHTML=table(['Port PON','Admin / Oper','ONU chi tiết / Total MAC','MAC / SN / IP WAN','Chú ý KH'],body,'svc-pon-table');
    }else{
      const view=M.paginate(filtered.rows,state.page,state.onuSize);state.page=view.page;
      get('pageSize').value=String(state.onuSize);get('onuTableHost').innerHTML=onuTable(view.rows);
      get('pageInfo').textContent=pageText(view,'ONU');get('prevPage').disabled=view.page===0;get('nextPage').disabled=view.page===view.pages-1;
    }
  }
  function checkPage(rows,headers,make){const p=M.paginate(rows,state.checkPage,25);state.checkPage=p.page;get('checkPager').hidden=rows.length<=25;get('checkPageInfo').textContent=pageText(p,'bản ghi');get('checkPrev').disabled=p.page===0;get('checkNext').disabled=p.page===p.pages-1;return table(headers,p.rows.map(make));}
  function renderChecks(){
    const r=result(),c=r.checks||{},tab=state.tab;get('checkPager').hidden=true;let html='';
    if(tab==='overview')html='<h2>Tổng quan kiểm tra dịch vụ</h2>'+table(['Hạng mục','Kết quả','Ghi chú'],Object.entries(checkNames).map(([key,name])=>`<tr>${td(esc(name))}${td(stateLabel(c[key]))}${td(c[key]?.optional?'Tùy chọn; không tự quyết định kết quả tổng':c[key]?.skipped?esc(reason(c[key].skip_reason)):'Theo kết quả backend')}</tr>`))+M.list(r.failures).map(f=>`<article class="svc-check-card fail"><h3>${esc(checkNames[f.check]||f.check)} · ${esc(f.scope)}</h3><details><summary>Yêu cầu, dữ liệu quan sát & lệnh đối chiếu</summary>${json(f)}</details></article>`).join('');
    else if(tab==='ports')html='<h2>Trạng thái port & công suất quang</h2>'+checkPage(M.list(c.interface_status?.ports),['Interface / Description','Admin / Oper','RX (dBm)','Low / High','Đánh giá'],p=>{const o=M.list(c.optical_power?.ports).find(v=>v.port===p.port)||{};return `<tr>${td(esc(p.port)+`<small>${esc(p.description)}</small>`)}${td(esc(p.admin_status)+' / '+esc(p.oper_status))}${td(num(o.rx),'number')}${td(num(o.low_alarm_threshold)+' / '+num(o.high_alarm_threshold),'number')}${td(stateLabel(o)+`<small>${esc(reason(o.skip_reason||o.reason))}</small>`)}</tr>`;});
    else if(tab==='counters')html=`<h2>CRC / discard · ${esc(c.counters?.sample_count)} mẫu · Cách nhau ${esc(c.counters?.interval_seconds)} giây</h2>`+checkPage(M.list(c.counters?.ports),['Interface','CRC','InDiscard','OutDiscard','Kết quả'],p=>`<tr>${td(esc(p.port))}${['crc','in_discard','out_discard'].map(k=>td(M.list(p[k]).map(num).join(' → ')||'—','mono')).join('')}${td(stateLabel(p))}</tr>`)+`<p>Counter khác 0 là số tích lũy, không đồng nghĩa đang phát sinh lỗi. Giữ đủ mẫu và null; không reset counter.</p>`;
    else if(tab==='lacp')html='<h2>LACP · Aggregation & member</h2>'+checkPage(M.list(c.lacp?.trunks),['Aggregation','Member / Local state','Kết quả'],t=>`<tr>${td(esc(t.trunk))}${td(M.list(t.members).map(m=>`${esc(m.port)} ${pill(m.skipped?'Bỏ qua':m.selection_status,m.status&&!m.skipped?'good':'')}<br>`).join('')||'—')}${td(stateLabel(t)+`<small>${esc(reason(t.skip_reason))}</small>`)}</tr>`);
    else if(tab==='routing'){
      const rt=c.routes||{},p=rt.pim_routes||{},rows=[...M.list(p.matched).map(v=>({v,matched:true})),...M.list(p.missing).map(v=>({v,matched:false}))];
      html='<h2>PIM & định tuyến</h2><div class="svc-check-facts">'+fact('PIM neighbors',M.list(c.pim_neighbors?.neighbors).map(esc).join(' · ')||'—')+fact('Management default · Next-hop',M.list(rt.management_default?.next_hops).map(esc).join(' · ')||'—')+fact('Route PIM khớp / Yêu cầu',`${M.list(p.matched).length} / ${esc(p.required)} ${stateLabel(p)}`)+'</div>'+checkPage(rows,['Prefix / Mask','Next-hop cấu hình','Kết quả'],({v,matched})=>`<tr>${td(esc(v.prefix||[v.destination,v.mask].filter(Boolean).join(' ')))}${td(esc(v.next_hop||M.list(v.configured_next_hops).join(' · ')))}${td(pill(matched?'Khớp':'Thiếu / Sai',matched?'good':'fail'))}</tr>`);
    }else if(tab==='multicast')html=olt()?oltMulticast(r.multicast):switchMulticast(c);
    else{
      const commandErrors=M.list(c.counters?.command_errors).length,hasError=!M.blank(response.error);
      html='<h2>Chẩn đoán</h2><div class="svc-check-facts svc-diagnostic-facts">'+diagnosticFact('Kết quả thành công',esc(optionValue(response.status)),response.status?'good':'warn')+diagnosticFact('Lỗi thực thi',response.error==null?'-':esc(typeof response.error==='object'?JSON.stringify(response.error):optionValue(response.error)),hasError?'fail':'neutral',hasError)+diagnosticFact('Lỗi lệnh ghi nhận',String(commandErrors),commandErrors?'warn':'neutral')+'</div>'+M.list(r.warnings).map(v=>`<p>${esc(typeof v==='object'?JSON.stringify(v):v)}</p>`).join('');
    }
    get('checkContent').innerHTML=html;
  }
  function oltMulticast(m){
    if(!m)return '<h2>Multicast</h2><div class="svc-empty">Response không có dữ liệu multicast.</div>';
    const card=(label,v)=>`<div class="svc-multicast-card ${v===true?'is-ok':v===false?'is-nok':'is-unknown'}"><small>${esc(label)}</small><b>${v===true?'OK':v===false?'NOK':'-'}</b></div>`;
    const rows=Object.entries(m.checks||{}),hasFlags=['multicast_stream','igmp_request'].some(k=>Object.prototype.hasOwnProperty.call(m,k));
    const cards=!hasFlags&&Object.prototype.hasOwnProperty.call(m,'overall_ok')?card('overall_ok',m.overall_ok):card('Multicast Stream',m.multicast_stream)+card('IGMP Request',m.igmp_request);
    return '<h2>Multicast OLT</h2>'+(m.message?'<p>'+esc(m.message)+'</p>':'')+'<div class="svc-multicast-grid">'+cards+'</div>'+(rows.length?table(['Bước','Trạng thái gốc','Dữ liệu ghi nhận'],rows.map(([key,v])=>`<tr>${td(esc(key))}${td(pill(v.status,v.status==='OK'?'good':'warn'))}${td(json(v))}</tr>`)):'')+(m.overall_ok===true&&rows.some(([,v])=>v.status==='NOT_OK')?'<p>Bước NOT_OK và overall_ok=true cùng tồn tại trong nguồn. UI giữ cả hai, không thay rule tổng của backend.</p>':'');
  }
  function switchMulticast(c){const m=c.multicast_routing||{},l=c.l2_multicast||{};return '<h2>Multicast routing '+stateLabel(m)+'</h2>'+(m.sampled_flow?json(m.sampled_flow):'<div class="svc-check-facts">'+fact('Multicast entries',num(m.multicast_entries))+fact('PIM (S,G) entries',num(m.pim_sg_entries))+fact('Yêu cầu tối thiểu',num(m.minimum_entries))+'</div>')+(m.skipped?'<p>Bỏ qua có điều kiện: '+esc(reason(m.skip_reason))+'</p>':'')+'<p>L2 multicast · VLAN '+esc(l.vlan)+' · '+esc(l.total_groups)+' group '+stateLabel(l)+(l.optional?' · Tùy chọn':'')+'</p>';}
  function resetFilters(){clearTimeout(searchTimer);state.query='';state.attention='all';state.oper='all';state.scope=null;state.page=0;state.openPon=null;state.innerPage=0;get('onuSearch').value='';renderData();}
  function filteredChanged(){state.page=0;state.openPon=null;state.innerPage=0;clearTimeout(searchTimer);renderData();}
  function download(content,type,name){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  const filename=()=>String(result().nameDev||'service-response').replace(/[^\w.-]/g,'_');
  get('deviceForm').addEventListener('submit',e=>{e.preventDefault();const q=M.normalize(get('deviceInput').value),entry=Object.entries(samples).find(([,d])=>q&&[d.result?.nameDev,d.result?.ipDev].some(v=>M.normalize(v)===q));if(entry)loadResponse(entry[1],'Response mẫu thật');else error('Chưa có response mẫu cho thiết bị này. Hãy nạp JSON; UI chưa kết nối API.');});
  get('sampleSelect').addEventListener('change',e=>{if(samples[e.target.value])loadResponse(samples[e.target.value],'Response mẫu thật');});
  get('responseFile').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;const revision=++importRevision;try{if(file.size>20*1024*1024)throw new Error('File vượt giới hạn 20 MB.');const text=await file.text();if(revision!==importRevision)return;const data=JSON.parse(text.replace(/^\uFEFF/,''));if(loadResponse(data,'JSON: '+file.name))notice('Đã nạp response. Chỉ xử lý trên trình duyệt.');}catch(err){if(revision===importRevision)error('Không nạp được JSON: '+(err instanceof SyntaxError?'Sai cú pháp JSON.':err.message));}finally{e.target.value='';}});
  get('resultTabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b||!tabs().some(([k])=>k===b.dataset.tab))return;state.tab=b.dataset.tab;state.checkPage=0;renderTabs();renderWorkspace();get('svc-tab-'+state.tab)?.focus?.({preventScroll:true});});
  get('resultTabs').addEventListener('keydown',e=>{if(!response||!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();const items=tabs(),at=items.findIndex(([k])=>k===state.tab),next=e.key==='Home'?0:e.key==='End'?items.length-1:(at+(e.key==='ArrowRight'?1:-1)+items.length)%items.length;state.tab=items[next][0];state.checkPage=0;renderTabs();renderWorkspace();get('svc-tab-'+state.tab)?.focus?.({preventScroll:true});});
  get('onuSearch').addEventListener('input',e=>{state.query=e.target.value;state.page=0;state.openPon=null;state.innerPage=0;clearTimeout(searchTimer);searchTimer=setTimeout(renderData,160);});
  get('attentionFilter').addEventListener('change',e=>{state.attention=e.target.value;filteredChanged();});get('ponStatusFilter').addEventListener('change',e=>{state.oper=e.target.value;filteredChanged();});get('resetFilters').addEventListener('click',resetFilters);
  get('pageSize').addEventListener('change',e=>{if(state.mode!=='onu')return;state.onuSize=Number(e.target.value);state.page=0;state.openPon=null;renderData();});
  for(const [id,step] of [['prevPage',-1],['nextPage',1]])get(id).addEventListener('click',()=>{if(state.mode!=='onu'||get(id).disabled)return;state.page+=step;state.openPon=null;renderData();});
  for(const [id,step] of [['checkPrev',-1],['checkNext',1]])get(id).addEventListener('click',()=>{state.checkPage+=step;renderChecks();});
  root.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||b.disabled||!response)return;const d=b.dataset;let focus='';
    if(d.mode!==undefined){state.mode=d.mode==='onu'?'onu':'pon';state.page=0;state.openPon=null;renderData();focus=`[data-mode="${state.mode}"]`;}
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
  window.NETAUTO_SERVICE_CHECK_UI={loadResponse,clear,getResponse:()=>response,getView:()=>({mode:state.mode,tab:state.tab,query:state.query,attention:state.attention,scope:state.scope,page:state.page,openPon:state.openPon,filteredOnu:filtered.rows.length,filteredPorts:filtered.ports.length})};
  loadResponse(samples.gc16||Object.values(samples)[0],'Response mẫu thật');
})();
