(() => {
  'use strict';
  const M=window.NETAUTO_CUSTOMER_PON,$=id=>document.getElementById(id),E=M.esc;
  const MAX_BYTES=8*1024*1024;
  const filled=value=>value!==null&&value!==undefined&&!(typeof value==='string'&&['','—','-','none','null','unknown','n/a','unavailable'].includes(value.trim().toLowerCase()));
  function contractTag(c){
    const value=c.net_status??c.contract_status;
    return filled(value)?`<span class="cp-contract-tag" aria-label="Trạng thái hợp đồng: ${E(value)}">${E(value)}</span>`:'';
  }
  const optionalLine=(label,value,unit='')=>filled(value)?`<small>${E(label)} · ${E(value)}${unit?' '+E(unit):''}</small>`:'';
  function onuMetrics(onu){
    const metrics=[['rx','Rx',onu?.onu_rx,'dBm'],['tx','Tx',onu?.onu_tx,'dBm'],['temperature','Nhiệt độ',onu?.onu_temp,'°C'],['distance','Khoảng cách',onu?.onu_olt_distance,'m']].filter(([, ,value])=>filled(value));
    return metrics.length?`<dl class="cp-onu-metrics">${metrics.map(([key,label,value,unit])=>`<div data-onu-metric="${key}"><dt>${label}</dt><dd>${E(value)} <small>${unit}</small></dd></div>`).join('')}</dl>`:'<small class="cp-row-muted">chưa có thông tin</small>';
  }
  function issueTags(row){
    const labels=[];
    if(row.conflicts.some(({record})=>M.list(record.different_fields).some(d=>d?.field==='contract')))labels.push('HĐ không khớp');
    const m=row.customer.move_check||{};
    if(m.device_index_check?.identity_match===false)labels.push('Index của ONU khác');
    if(m.location_conflict===true)labels.push('Khác vị trí giữa các nguồn');
    if(M.list(m.conflicts).some(c=>c?.type==='customer_state'))labels.push('Khác trạng thái giữa các nguồn');
    if(M.rowHasConflict(row)&&!labels.length)labels.push('Thông tin cần đối chiếu');
    return labels.map(label=>`<span class="cp-issue-tag">${E(label)}</span>`).join('');
  }
  let current=null,group='all',importTicket=0,evidenceTrigger=null;
  let selectedPorts=[],draftDevice='';
  let manualDevice=false;
  const samples=()=>M.list(window.NETAUTO_PON_SAMPLES??(window.NETAUTO_PON_SAMPLE?[window.NETAUTO_PON_SAMPLE]:[]));
  const sampleFor=value=>{const key=String(value).trim().toLowerCase();return samples().find(sample=>[sample.result?.olt?.olt_name,sample.result?.olt?.olt_ip].some(v=>v&&String(v).toLowerCase()===key));};
  function renderOltSelect(){
    const value=$('oltInput').value.trim(),sample=sampleFor(value);
    const devices=samples().map(item=>({value:item.result.olt.olt_name,label:`${item.result.olt.olt_name} · ${item.result.olt.olt_ip}`}));
    if(value&&!sample)devices.push({value,label:value});
    $('oltSelect').innerHTML='<option value="">Chọn OLT</option>'+devices.map(item=>`<option value="${E(item.value)}">${E(item.label)}</option>`).join('')+'<option value="__manual__">Nhập OLT khác…</option>';
    $('oltSelect').value=manualDevice?'__manual__':sample?.result.olt.olt_name??value;
    $('oltInput').hidden=!manualDevice;
  }
  const source=value=>Array.isArray(value)?value.map(M.sourceLabel).join(' · ')||'—':M.sourceLabel(value);
  function error(message){$('inputError').hidden=!message;$('inputError').textContent=message||'';}
  const catalog=()=>M.portCatalog(current?.result,$('oltInput').value);
  const visiblePorts=()=>catalog().ports.filter(port=>port.toLowerCase().includes($('ponSearch').value.trim().toLowerCase()));
  function pickerOpen(open){$('ponPanel').hidden=!open;$('ponToggle').setAttribute('aria-expanded',String(open));if(open)$('ponSearch').focus();}
  function renderPickerOptions(){
    const ports=visiblePorts();
    $('ponOptions').innerHTML=ports.map(port=>`<label><input type="checkbox" data-pick-port="${E(port)}"${selectedPorts.includes(port)?' checked':''}><span>${E(port)}</span></label>`).join('')||'<p class="cp-note">Chưa có Port khớp. Nạp phản hồi đúng thiết bị hoặc dùng nhập thủ công.</p>';
    $('selectVisiblePorts').disabled=!ports.length;
    $('clearSelectedPorts').disabled=!selectedPorts.length;
    $('ponOptionsCount').textContent=`${ports.length} / ${catalog().ports.length} Port · Đã chọn ${selectedPorts.length}`;
  }
  function renderPicker(){
    const focusedPort=document.activeElement?.dataset?.pickPort;
    const c=catalog();
    $('portsInput').value=selectedPorts.join('\n');
    $('ponSelectionLabel').textContent=selectedPorts.length?`${selectedPorts.length} Port đã chọn`:'Chọn một hoặc nhiều Port';
    $('selectedPorts').innerHTML=selectedPorts.map(port=>`<span class="cp-port-chip${c.ports.includes(port)?'':' is-unverified'}"><span>${E(port)}</span>${c.ports.includes(port)?'':'<small>Chưa xác minh</small>'}<button type="button" data-remove-port="${E(port)}" aria-label="Bỏ Port ${E(port)}">×</button></span>`).join('');
    $('ponCatalogNote').textContent=c.matches?(c.kind==='available'?`${c.ports.length} Port theo dữ liệu thiết bị.`:`Có ${c.ports.length} Port đã kiểm tra, chưa có danh sách đầy đủ.`):'Chưa có danh sách Port. Bạn có thể nhập thủ công hoặc nạp dữ liệu thiết bị.';
    renderPickerOptions();
    if(focusedPort)Array.from($('ponOptions').querySelectorAll('[data-pick-port]')).find(input=>input.dataset.pickPort===focusedPort)?.focus();
  }
  function closeEvidence(){if($('evidenceDialog').open)$('evidenceDialog').close();}
  function resetFilters(){group='all';$('customerSearch').value='';$('portFilter').value='';$('moveFilter').value='';$('conflictFilter').checked=false;}
  function renderRows(){
    if(!current)return;
    const conflictView=group==='conflicts';
    $('customerTable').hidden=conflictView;$('conflictTable').hidden=!conflictView;
    $('moveFilter').disabled=conflictView;$('conflictFilter').disabled=conflictView;
    document.querySelectorAll('[data-group]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.group===group)));
    if(conflictView){renderConflictRows();return;}
    const rows=M.filter(current.rows,{group,query:$('customerSearch').value,port:$('portFilter').value,move:$('moveFilter').value,conflict:$('conflictFilter').checked});
    $('customerRows').innerHTML=rows.map(row=>{
      const {id,group:membership,customer:c}=row,conflicted=M.rowHasConflict(row);
      const m=c.move_check||{},state=c.customer_state??c.onu_status??m.customer_state;
      const requested=c.requested_location??(c.port_name?{port_name:c.port_name}:null),location=m.current_location;
      const differentLocation=m.same_pon===false||(m.same_pon!==true&&M.object(location)&&M.object(requested)&&['olt_name','port_name'].some(key=>filled(location[key])&&filled(requested[key])&&String(location[key]).toLowerCase()!==String(requested[key]).toLowerCase()));
      const currentLocation=differentLocation&&M.location(location)!=='—'?`<small class="cp-mini-label">Port hiện tại</small><b>${E(M.location(location))}</b>`:'';
      const move=filled(m.status)&&m.status!=='not_checked'?`<small>${E(M.moveLabel(m.status))}</small>`:'';
      const stateLabel=state==='Unknown'?'Chưa xác nhận':state;
      const stateTone=state==='Online'?'online':state==='Offline'?'offline':'unknown';
      const membershipLabels={observed_on_requested_pon:'Trên PON',confirmed_offline:'Không thấy trên PON',online_elsewhere:'Online nơi khác',unconfirmed:'Chưa đủ dữ liệu',unclassified:'Chưa phân loại'};
      return `<tr data-customer="${id}" data-conflict="${conflicted}">
        <td><div class="cp-customer-top"><strong>${filled(c.contract)?E(c.contract):'Chưa có hợp đồng'}</strong>${filled(stateLabel)?`<span class="cp-state-tag is-${stateTone}">${E(stateLabel)}</span>`:''}</div><div class="cp-customer-meta">${contractTag(c)}${optionalLine('IP WAN',c.ipwan)}</div></td>
        <td><div class="cp-onu-identity">${filled(c.onu?.onu_model)?`<b>${E(c.onu.onu_model)}</b>`:''}${optionalLine('SN',c.onu_sn)}${optionalLine('MAC',c.onu_mac)}</div></td>
        <td><div class="cp-port-top">${filled(requested?.olt_name??requested?.olt_ip)?`<b>${E(requested.olt_name??requested.olt_ip)}</b>`:''}<span class="cp-membership-tag" title="${E(M.groupLabels[membership])}">${E(membershipLabels[membership])}</span></div><div class="cp-port-meta">${filled(requested?.port_name??requested?.port)?`<span class="cp-port-name">${E(requested.port_name??requested.port)}</span>`:''}${filled(c.onu_index)?`<small>Index <b>${E(c.onu_index)}</b></small>`:''}</div>${currentLocation}${move}<div class="cp-issue-tags">${issueTags(row)}</div></td>
        <td>${onuMetrics(c.onu)}</td>
        <td class="cp-row-action"><button class="na-button" type="button" data-evidence="${id}" aria-haspopup="dialog" aria-controls="evidenceDialog" aria-label="Xem bằng chứng cho ${E(c.contract??c.onu_sn??'khách chưa rõ hợp đồng')}">Chi tiết</button></td>
      </tr>`;
    }).join('')||'<tr><td colspan="5">Không có khách hàng khớp bộ lọc.</td></tr>';
    $('viewCount').textContent=`${rows.length} bản ghi khớp / ${current.rows.length} bản ghi đã nạp · tổng nguồn ${M.text(current.result?.count?.total)}`;
  }
  function overview(name){
    const {raw,result:r,rows}=current;
    $('sourceName').textContent=`Nguồn: ${name}`;
    $('resultState').textContent=raw.status?'Đã nhận kết quả':'Kiểm tra chưa hoàn tất / có lỗi';
    $('resultState').className='cp-badge'+(raw.status?'':' is-warning');
    $('resultDevice').textContent=M.text(r?.olt?.olt_name??r?.olt?.name);
    $('resultMeta').textContent=r?[r.olt.olt_ip??r.olt.ip,r.olt.vendor,r.olt.model,r.duration_ms!=null?`${M.text(r.duration_ms)} ms`:null].filter(v=>v!=null&&v!=='').join(' · '):'Phản hồi không có kết quả';
    $('customerWorkspace').hidden=!r;
    $('conflictRows').innerHTML='';
    const stats=[['Tổng Khách hàng ghi nhận trên PON',r?.count?.total],...M.customerGroups.map(key=>[M.groupLabels[key],r?.count?.[key]]),['Conflict data',current.conflicts.length]];
    if(M.list(r?.unclassified_customers).length||r?.count?.unclassified!=null)stats.push(['Chưa phân loại',r?.count?.unclassified]);
    const metricKeys=['total',...M.customerGroups,'conflicts','unclassified'];
    $('sourceStats').innerHTML=r?stats.map(([label,value],index)=>`<article data-stat="${metricKeys[index]}" class="cp-stat${index===0?' is-total':''}"><div class="cp-stat-label"><span>${E(label)}</span></div><b>${E(value)}</b></article>`).join(''):'';
    $('conflictLeftLabel').textContent='Giá trị phía System Radius';
    $('conflictRightLabel').textContent='Giá trị phía CDP';
    document.querySelectorAll('[data-group]').forEach(button=>{const key=button.dataset.group,count=key==='all'?r?.count?.total:key==='conflicts'?current.conflicts.length:r?.count?.[key];button.textContent=`${key==='all'?'Tất cả khách':M.groupLabels[key]} · ${M.text(count)}`;button.hidden=key==='unclassified'&&!M.list(r?.unclassified_customers).length&&r?.count?.unclassified==null;});
    const ports=r?.ports||{};
    $('portsSummary').innerHTML=r?['requested_ports','invalid_ports'].filter(key=>M.list(ports[key]).length).map(key=>`<div class="cp-scope-item"><span>${key==='requested_ports'?'Port kiểm tra':'Port bị loại'}</span>${M.list(ports[key]).map(port=>`<b>${E(port)}</b>`).join('')}</div>`).join(''):'';
    const failure=[raw.status===false?raw.message:null,raw.error].filter(filled);
    $('resultError').hidden=!failure.length;
    $('resultError').textContent=failure.map(M.text).join(' · ');
    const options=values=>[...new Set(values.filter(v=>v!=null&&v!==''))];
    $('portFilter').innerHTML='<option value="">Tất cả Port</option>'+options([...M.list(ports.valid_ports),...rows.map(({customer:c})=>c.requested_location?.port_name??c.port_name)]).map(v=>`<option value="${E(v)}">${E(v)}</option>`).join('');
    $('moveFilter').innerHTML='<option value="">Mọi kết luận đối chiếu</option>'+options(rows.map(({customer:c})=>c.move_check?.status)).map(v=>`<option value="${E(v)}">${E(M.moveLabel(v))}</option>`).join('');
    // Do not write response fields into the request form: it may describe a different draft.
    renderRows();
  }
  function load(raw,name='Dữ liệu đã mở'){
    try{
      if(typeof raw==='string'&&raw.length>MAX_BYTES)throw Error('Nội dung vượt giới hạn 8 MB.');
      const parsed=M.parse(raw);
      closeEvidence();current=parsed;resetFilters();overview(name);
      if(!$('oltInput').value.trim()&&parsed.result){$('oltInput').value=M.text(parsed.result.olt.olt_name??parsed.result.olt.name??parsed.result.olt.olt_ip??parsed.result.olt.ip).replace(/^—$/,'');draftDevice=$('oltInput').value.trim().toLowerCase();}
      renderPicker();renderOltSelect();
      $('emptyState').hidden=true;$('resultSection').hidden=false;
      $('importStatus').textContent=`Đã nạp ${parsed.rows.length} khách và ${parsed.conflicts.length} cảnh báo từ ${name}. ${name.startsWith('Phản hồi người dùng')?'Dữ liệu cung cấp ngày 26/10/2026, không phải kết quả kiểm tra mới.':'Chưa xác minh độ mới của dữ liệu.'}`;
      error('');return true;
    }catch(e){error(`Không nạp được phản hồi: ${e.message}${current?' Kết quả trước đó vẫn được giữ, chưa thay bằng tệp lỗi.':''}`);return false;}
  }
  function evidence(id,trigger){
    const row=current?.rows.find(row=>row.id===id);if(!row)return;
    const c=row.customer,m=c.move_check||{},check=m.device_index_check||{};
    const state=c.customer_state??c.onu_status??m.customer_state;
    const tone=state==='Online'?'online':state==='Offline'?'offline':'unknown';
    const requested=c.requested_location??(c.port_name?{port_name:c.port_name}:null);
    const stateSource=filled(m.customer_state_source)?`<small>Theo ${E(source(m.customer_state_source))}</small>`:'';
    const moved=m.same_pon===false||(m.same_pon!==true&&M.object(m.current_location)&&M.object(requested)&&['olt_name','port_name'].some(key=>filled(m.current_location[key])&&filled(requested[key])&&String(m.current_location[key]).toLowerCase()!==String(requested[key]).toLowerCase()));
    const facts=[['Port kiểm tra',M.location(requested)],...(moved?[['Port hiện tại',M.location(m.current_location)]]:[]),['ONU',c.onu?.onu_model],['MAC',c.onu_mac],['SN',c.onu_sn],['ONU index',c.onu_index],['IP WAN',c.ipwan],['Hợp đồng',c.contract_status]];
    if(filled(c.onu?.onu_rx)||filled(c.onu?.onu_tx))facts.push(['Rx / Tx',`${M.text(c.onu?.onu_rx)} / ${M.text(c.onu?.onu_tx)} dBm`]);
    if(filled(m.system_radius?.ipwan)&&m.system_radius.ipwan!==c.ipwan)facts.push(['IP WAN · System Radius',m.system_radius.ipwan]);
    const reason=filled(m.status)&&m.status!=='not_checked'?M.moveLabel(m.status):M.groupLabels[row.group];
    $('evidenceTitle').textContent=M.text(c.contract??c.onu_sn??c.onu_mac);
    const reuse=check.identity_match===false||check.status==='index_reused';
    $('evidenceContent').innerHTML=`<section class="cp-detail-status is-${tone}"><span class="cp-detail-dot" aria-hidden="true"></span><div><h3>${E(tone==='unknown'?'Chưa xác nhận kết nối':state)}</h3><p>${E(reason)}</p>${stateSource}</div></section>`
      +detailFacts(facts)+conflictEvidence(row.conflicts)+moveDifferences(m)
      +(reuse?`<section class="cp-detail-alert"><h3>Index đang thuộc ONU khác</h3><p>Không lấy công suất tại index này cho khách đang xem.</p>${detailFacts([['Index',check.target_onu_index],['MAC đang dùng',check.observed_identity?.mac],['SN đang dùng',check.observed_identity?.serial]])}</section>`:'');
    evidenceTrigger=trigger;$('evidenceDialog').showModal();$('closeEvidence').focus();
  }
  function detailFacts(rows){
    const facts=rows.filter(([,value])=>filled(value));
    return facts.length?`<dl class="cp-detail-facts">${facts.map(([label,value])=>`<div><dt>${E(label)}</dt><dd>${E(value)}</dd></div>`).join('')}</dl>`:'';
  }
  function differenceCard(title,leftSource,leftValue,rightSource,rightValue){
    const value=v=>Array.isArray(v)?v.map(M.text).join(' · '):v;
    return `<section class="cp-difference"><h3>${E(title)}</h3><div class="cp-difference-values"><div><span>${E(leftSource)}</span><strong>${E(value(leftValue))}</strong></div><span class="cp-difference-mark" aria-label="khác nhau">≠</span><div><span>${E(rightSource)}</span><strong>${E(value(rightValue))}</strong></div></div></section>`;
  }
  function conflictEvidence(records){
    const fields={contract:'Hợp đồng',mac:'MAC',onu_mac:'MAC',serial:'SN',onu_sn:'SN',onu_index:'ONU index',location:'Vị trí',olt_name:'OLT',port_name:'Port',port:'Port'};
    return M.list(records).flatMap(({record:c})=>M.list(c.different_fields).filter(M.object).map(d=>{
      const field=Object.hasOwn(fields,d.field)?fields[d.field]:M.text(d.field);
      return differenceCard(`${field} không khớp`,'Giá trị phía System Radius',d.device_value,'Giá trị phía CDP',d.csoc_value);
    })).join('');
  }
  function moveDifferences(m){
    const conflicts=M.list(m.conflicts).filter(M.object),alternatives=M.list(m.location_alternatives).filter(M.object);
    const readable=value=>Array.isArray(value)?value.map(item=>Array.isArray(item)?item.join(' / '):M.object(item)?M.location(item):M.text(item)).join(' · '):M.object(value)?M.location(value):value;
    const cards=conflicts.filter(c=>c.type!=='current_location').map(c=>differenceCard(c.type==='customer_state'?'Trạng thái khác nhau':'Thông tin khác nhau',source(c.selected_source),readable(c.selected_value),source(c.conflicting_source),readable(c.conflicting_value??c.alternatives)));
    if(alternatives.length)for(const location of alternatives)cards.push(differenceCard('Vị trí khác nhau',source(m.current_location?.source),M.location(m.current_location),source(location.sources??location.source),M.location(location)));
    else for(const c of conflicts.filter(c=>c.type==='current_location'))cards.push(differenceCard('Vị trí khác nhau',source(c.selected_source),readable(c.selected_value),'Nguồn khác',readable(c.alternatives)));
    if(m.location_conflict===true&&!alternatives.length&&!conflicts.some(c=>c.type==='current_location'))cards.push('<section class="cp-detail-alert"><h3>Vị trí giữa các nguồn chưa khớp</h3><p>Phản hồi chưa cung cấp vị trí còn lại để so sánh.</p></section>');
    return cards.join('');
  }
  function renderConflictRows(){
    const q=$('customerSearch').value.trim().toLowerCase(),port=$('portFilter').value;
    const records=current.conflicts.filter(({id,record})=>(!q||JSON.stringify(record).toLowerCase().includes(q))&&(!port||current.rows.some(row=>row.conflicts.some(c=>c.id===id)&&(row.customer.requested_location?.port_name??row.customer.port_name)===port)));
    $('conflictRows').innerHTML=records.map(({id,record:c})=>{
      const differences=M.list(c.different_fields).filter(M.object);
      return `<tr><td><strong>${E(c.contract)}</strong><small>MAC · ${E(c.onu_mac)}</small><small>SN · ${E(c.onu_sn)}</small></td><td><b>${E(c.matched_by==='mac'?'MAC':c.matched_by)}</b><small>${E(c.severity==='warning'?'Chú ý':c.severity)}</small><small>${E(c.type==='multiple_contracts_for_mac'?'Một MAC có nhiều HĐ':c.type)}</small></td><td>${differences.map(d=>`<span>${E(d.field==='contract_history'?'Lịch sử hợp đồng':d.field==='contract'?'Hợp đồng':d.field)}</span>`).join('')||'—'}</td><td>${differences.map(d=>`<span>${E(d.device_value)}</span>`).join('')||'—'}<small>${E(source(c.sources))}</small></td><td>${differences.map(d=>`<span>${E(Array.isArray(d.csoc_value)?d.csoc_value.join(' · '):d.csoc_value)}</span><small>${E(source(d.conflicting_source))}</small>`).join('')||'—'}</td><td><button class="na-button" type="button" data-conflict-evidence="${id}" aria-haspopup="dialog" aria-controls="evidenceDialog" aria-label="Xem mâu thuẫn cho ${E(c.contract)}">Chi tiết</button></td></tr>`;
    }).join('')||'<tr><td colspan="6">Không có cảnh báo mâu thuẫn khớp bộ lọc.</td></tr>';
    $('viewCount').textContent=`${records.length} / ${current.conflicts.length} cảnh báo đối chiếu · không cộng vào ${M.text(current.result?.count?.total)} khách`;
  }
  function conflictDetails(id,trigger){
    const item=current?.conflicts.find(c=>c.id===id);if(!item)return;
    const c=item.record,linked=current.rows.filter(row=>row.conflicts.some(x=>x.id===id));
    $('evidenceTitle').textContent=M.text(c.contract);
    $('evidenceContent').innerHTML=conflictEvidence([item])+detailFacts([['MAC',c.onu_mac],['SN',c.onu_sn],['Khách đã có trong kết quả',linked.map(row=>M.text(row.customer.contract)).join(' / ')]]);
    evidenceTrigger=trigger;$('evidenceDialog').showModal();$('closeEvidence').focus();
  }
  $('ponToggle').addEventListener('click',()=>pickerOpen($('ponPanel').hidden));
  $('ponSearch').addEventListener('input',renderPickerOptions);
  $('ponOptions').addEventListener('change',event=>{const port=event.target.dataset.pickPort;if(!catalog().ports.includes(port))return;selectedPorts=event.target.checked?[...new Set([...selectedPorts,port])]:selectedPorts.filter(v=>v!==port);renderPicker();});
  $('selectVisiblePorts').addEventListener('click',()=>{selectedPorts=[...new Set([...selectedPorts,...visiblePorts()])];renderPicker();});
  $('clearSelectedPorts').addEventListener('click',()=>{selectedPorts=[];renderPicker();});
  $('selectedPorts').addEventListener('click',event=>{const button=event.target.closest('[data-remove-port]');if(!button)return;selectedPorts=selectedPorts.filter(port=>port!==button.dataset.removePort);renderPicker();$('ponToggle').focus();});
  $('addManualPorts').addEventListener('click',()=>{try{const ports=M.request($('oltInput').value,$('manualPorts').value).pon_ports;selectedPorts=[...new Set([...selectedPorts,...ports])];$('manualPorts').value='';renderPicker();error('');}catch(e){error(e.message);}});
  $('oltInput').addEventListener('input',()=>{const next=$('oltInput').value.trim().toLowerCase();if(next!==draftDevice){selectedPorts=[];$('ponSearch').value='';$('manualPorts').value='';draftDevice=next;}renderPicker();});
  $('oltSelect').addEventListener('change',()=>{
    const value=$('oltSelect').value,sample=sampleFor(value);
    if(sample){loadSample(sample);return;}
    if(value!=='__manual__'&&value===$('oltInput').value)return;
    ++importTicket;closeEvidence();current=null;resetFilters();selectedPorts=[];draftDevice='';
    manualDevice=value==='__manual__';$('oltInput').value=manualDevice?'':value;
    $('ponSearch').value='';$('manualPorts').value='';pickerOpen(false);renderPicker();renderOltSelect();
    $('resultSection').hidden=true;$('customerWorkspace').hidden=true;$('emptyState').hidden=false;error('');
    if(manualDevice)$('oltInput').focus();
  });
  $('ponPicker').addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('ponPanel').hidden){event.preventDefault();pickerOpen(false);$('ponToggle').focus();}});
  document.addEventListener('click',event=>{if(!$('ponPicker').contains(event.target))pickerOpen(false);});
  $('responseFile').addEventListener('change',async()=>{
    const file=$('responseFile').files?.[0];if(!file)return;
    const ticket=++importTicket;$('importStatus').textContent='Đang đọc tệp…';
    try{
      if(file.size>MAX_BYTES)throw Error('Tệp vượt giới hạn 8 MB.');
      const raw=await file.text();if(ticket!==importTicket)return;
      if(!load(raw,file.name))$('importStatus').textContent='Nạp tệp không thành công; xem thông báo lỗi.';
    }catch(e){if(ticket===importTicket){error(e.message);$('importStatus').textContent='Không đọc được tệp.';}}
    finally{if(ticket===importTicket)$('responseFile').value='';}
  });
  $('groupTabs').addEventListener('click',event=>{const button=event.target.closest('[data-group]');if(!button)return;group=button.dataset.group;renderRows();});
  for(const [id,event] of [['customerSearch','input'],['portFilter','change'],['moveFilter','change'],['conflictFilter','change']])$(id).addEventListener(event,renderRows);
  $('resetFilters').addEventListener('click',()=>{resetFilters();renderRows();});
  $('customerRows').addEventListener('click',event=>{const button=event.target.closest('[data-evidence]');if(button)evidence(Number(button.dataset.evidence),button);});
  $('conflictRows').addEventListener('click',event=>{const button=event.target.closest('[data-conflict-evidence]');if(button)conflictDetails(Number(button.dataset.conflictEvidence),button);});
  $('closeEvidence').addEventListener('click',closeEvidence);
  $('evidenceDialog').addEventListener('close',()=>{$('evidenceContent').innerHTML='';const trigger=evidenceTrigger;evidenceTrigger=null;if(trigger?.isConnected)trigger.focus({preventScroll:true});});
  $('evidenceDialog').addEventListener('click',event=>{if(event.target!==$('evidenceDialog'))return;const r=$('evidenceDialog').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeEvidence();});
  $('themeToggle').addEventListener('click',()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';});
  const params=new URLSearchParams(window.location.search);
  $('oltInput').value=params.get('olt')||'';draftDevice=$('oltInput').value.trim().toLowerCase();selectedPorts=[...new Set(params.getAll('pon').filter(v=>v.trim()))];renderPicker();renderOltSelect();
  function loadSample(sample){
    sample=sample?.result?sample:sampleFor($('oltInput').value)??samples()[0];if(!sample)return;
    ++importTicket;manualDevice=false;$('oltInput').value=sample.result.olt.olt_name;draftDevice=$('oltInput').value.toLowerCase();selectedPorts=M.list(sample.result.ports.requested_ports).slice();
    $('ponSearch').value='';$('manualPorts').value='';pickerOpen(false);
    load(sample,`Phản hồi người dùng · ${sample.result.olt.olt_name} / ${selectedPorts.join(' · ')}`);
  }
  $('loadSample').hidden=!samples().length;$('loadSample').addEventListener('click',()=>loadSample());
  // Only the supplied real response is previewed; never generate customer data or query devices.
  if(samples().length&&!params.has('olt'))loadSample();
  window.NETAUTO_CUSTOMER_PON_UI={load};
})();
