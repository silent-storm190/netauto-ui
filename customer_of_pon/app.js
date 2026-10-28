(() => {
  'use strict';
  const M=window.NETAUTO_CUSTOMER_PON,$=id=>document.getElementById(id),E=M.esc;
  const MAX_BYTES=8*1024*1024;
  const MAX_PORTS=2;
  const filled=value=>value!==null&&value!==undefined&&!(typeof value==='string'&&['','—','-','none','null','unknown','n/a','unavailable'].includes(value.trim().toLowerCase()));
  function contractTag(c){
    const value=c.net_status??c.contract_status;
    const key=String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase().trim().replace(/\s+/g,' ');
    const tone=key==='chu thue bao di vang'?' is-away':key==='ngung vi ly do thanh toan'?' is-payment':'';
    return filled(value)?`<span class="cp-contract-tag${tone}" aria-label="Trạng thái hợp đồng: ${E(value)}">${E(value)}</span>`:'';
  }
  const V=value=>filled(value)?E(value):'-';
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
  const source=value=>Array.isArray(value)?value.map(M.sourceLabel).join(' · ')||'-':M.sourceLabel(value);
  function error(message){$('inputError').hidden=!message;$('inputError').textContent=message||'';}
  const catalog=()=>M.portCatalog(current?.result,$('oltInput').value);
  function renderPickerOptions(){
    const ports=catalog().ports;
    $('ponOptions').innerHTML=ports.map(port=>{const checked=selectedPorts.includes(port),disabled=!checked&&selectedPorts.length>=MAX_PORTS;return `<label class="cp-pon-port${checked?' is-selected':''}${disabled?' is-disabled':''}" title="${disabled?'Đã chọn đủ 2 Port. Bỏ một Port trước khi chọn thêm.':E(port)}"><input class="cp-sr" type="checkbox" data-pick-port="${E(port)}" aria-label="Chọn Port ${E(port)}"${checked?' checked':''}${disabled?' disabled':''}><span class="cp-port-number">${E(port)}</span></label>`;}).join('')||'<p class="cp-note">Chưa có danh sách Port. Mở dữ liệu đúng thiết bị.</p>';
  }
  function renderPicker(){
    const focusedPort=document.activeElement?.dataset?.pickPort;
    const c=catalog();
    $('portsInput').value=selectedPorts.join('\n');
    $('ponSelectionLabel').textContent=`${selectedPorts.length} / ${MAX_PORTS} Port đã chọn`;
    $('selectedPorts').innerHTML=selectedPorts.map(port=>`<span class="cp-port-chip${c.ports.includes(port)?'':' is-unverified'}"><span>${E(port)}</span>${c.ports.includes(port)?'':'<small>Chưa xác minh</small>'}<button type="button" data-remove-port="${E(port)}" aria-label="Bỏ Port ${E(port)}">×</button></span>`).join('');
    $('ponCatalogNote').textContent=c.matches?(c.kind==='available'?'':'Chỉ có các Port đã kiểm tra, chưa có danh sách đầy đủ.'):'Chưa có danh sách Port. Hãy nạp dữ liệu thiết bị.';
    renderPickerOptions();
    if(current)renderRows();else{$('portTabs').hidden=true;$('portTabs').innerHTML='';}
    if(focusedPort)Array.from($('ponOptions').querySelectorAll('[data-pick-port]')).find(input=>input.dataset.pickPort===focusedPort)?.focus();
  }
  function closeEvidence(){if($('evidenceDialog').open)$('evidenceDialog').close();}
  function resetFilters(){group='all';$('customerSearch').value='';$('portFilter').value='';$('moveFilter').value='';$('conflictFilter').checked=false;}
  const rowPort=row=>row.ponPort??row.customer.requested_location?.port_name??row.customer.port_name;
  function portScope(){
    const r=current?.result,invalid=M.list(r?.ports?.invalid_ports);
    const known=[...new Set([...M.list(r?.ports?.valid_ports),...M.list(r?.ports?.requested_ports).filter(port=>!invalid.includes(port)),...M.list(current?.rows).map(rowPort)].filter(filled))];
    const ports=selectedPorts.slice(0,MAX_PORTS);
    return {known,ports,invalid};
  }
  function renderPortTabs(){
    const {known,ports,invalid}=portScope();
    if(!ports.includes($('portFilter').value))$('portFilter').value=ports[0]??'';
    const active=$('portFilter').value;
    $('portTabs').hidden=ports.length<=1;
    const tab=(port,label,count)=>`<button type="button" data-port-tab="${E(port)}" aria-pressed="${String(port===active)}" aria-controls="customerTable conflictTable"><span>${E(label)}</span><small>${E(count)}</small></button>`;
    $('portTabs').innerHTML=ports.map(port=>tab(port,port,known.includes(port)?current.rows.filter(row=>rowPort(row)===port).length:invalid.includes(port)?'Port bị loại':'Chưa có dữ liệu')).join('');
  }
  function renderScopedSummary(){
    const r=current.result,port=$('portFilter').value,rows=port?current.rows.filter(row=>rowPort(row)===port):[],known=!!port&&portScope().known.includes(port);
    const section=M.list(r?.pon_results).find(item=>item.pon_port===port);
    const count=known?(section?.count??Object.fromEntries([['total',rows.length],...M.customerGroups.map(key=>[key,rows.filter(row=>row.group===key).length]),['unclassified',rows.filter(row=>row.group==='unclassified').length]])):{};
    const conflicts=known?current.conflicts.filter(item=>item.ponPort===port||!item.ponPort&&rows.some(row=>row.conflicts.some(c=>c.id===item.id))).length:undefined;
    const stats=[['total','Tổng khách hàng',count.total],['observed_on_requested_pon','Kh.H có MAC trên port PON',count.observed_on_requested_pon],['confirmed_offline',M.groupLabels.confirmed_offline,count.confirmed_offline],['conflicts','Cần kiểm tra',conflicts]];
    if(count.unclassified)stats.push(['unclassified','Chưa phân loại',count.unclassified]);
    $('sourceStats').innerHTML=r?stats.map(([key,label,value])=>`<article data-stat="${key}" class="cp-stat${key==='total'?' is-total':''}"><div class="cp-stat-label"><span>${E(label)}</span></div><b>${E(value)}</b></article>`).join(''):'';
    $('portsSummary').innerHTML=port?`<div class="cp-scope-item"><span>Port đang xem</span><b>${E(port)}</b></div>`:'';
    document.querySelectorAll('[data-group]').forEach(button=>{const key=button.dataset.group,value=key==='all'?count.total:key==='conflicts'?conflicts:count[key];button.textContent=`${key==='all'?'Tất cả khách':M.groupLabels[key]} · ${M.text(value)}`;button.hidden=key==='unclassified'&&!count.unclassified;});
  }
  function syncTableHeaders(){
    for(const prefix of ['customer','conflict']){
      const body=$(prefix+'Table'),header=$(prefix+'FixedHeader');
      $(prefix+'VisualHead').innerHTML=$(prefix+'HeadSource').innerHTML.replace(/\s+id="[^"]*"/g,'');
      header.scrollLeft=body.scrollLeft||0;
    }
  }
  function renderRows(){
    if(!current)return;
    renderPortTabs();
    renderScopedSummary();
    const conflictView=group==='conflicts';
    $('customerTable').hidden=conflictView;$('conflictTable').hidden=!conflictView;
    $('customerTableShell').hidden=conflictView;$('conflictTableShell').hidden=!conflictView;
    syncTableHeaders();
    $('moveFilter').disabled=conflictView;$('conflictFilter').disabled=conflictView;
    document.querySelectorAll('[data-group]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.group===group)));
    if(conflictView){renderConflictRows();return;}
    const rows=$('portFilter').value?M.filter(current.rows,{group,query:$('customerSearch').value,port:$('portFilter').value,move:$('moveFilter').value,conflict:$('conflictFilter').checked}):[];
    $('customerRows').innerHTML=rows.map(row=>{
      const {id,group:membership,customer:c}=row,conflicted=M.rowHasConflict(row);
      const m=c.move_check||{},identity=M.identityValues(c),state=c.customer_state??c.onu_status??m.customer_state;
      const requested=c.requested_location??(c.port_name?{port_name:c.port_name}:null);
      const stateLabel=state==='Unknown'?'Chưa xác nhận':state;
      const stateTone=state==='Online'?'online':state==='Offline'?'offline':'unknown';
      const macSeen=membership==='observed_on_requested_pon'&&c.seen_on_device!==false&&identity.source!=='cdp_csoc'&&filled(identity.onu_mac);
      const presenceLabel=macSeen?'Có MAC trên Port PON':'Chưa ghi nhận MAC trên Port PON';
      return `<tr data-customer="${id}" data-conflict="${conflicted}">
        <td data-column="customer"><strong class="cp-contract-name">${filled(c.contract)?E(c.contract):'-'}</strong></td>
        <td data-column="contract-state">${contractTag(c)||'-'}</td>
        <td data-column="state">${filled(stateLabel)?`<span class="cp-state-tag is-${stateTone}">${E(stateLabel)}</span>`:'-'}</td>
        <td data-column="presence"><span class="cp-presence ${macSeen?'is-seen':'is-absent'}" role="img" aria-label="${presenceLabel}" title="${presenceLabel}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${macSeen?'<path d="m5 12 4 4L19 6"/>':'<path d="m6 6 12 12M18 6 6 18"/>'}</svg></span></td>
        <td data-column="port">${E(row.ponPort??requested?.port_name??requested?.port)}</td>
        <td data-column="index" title="${identity.source==='cdp_csoc'?'ONU index từ CDP':identity.source==='olt_device'?'ONU index từ thiết bị OLT':'ONU index theo phản hồi'}">${E(identity.onu_index)}</td>
        <td data-column="model">${E(c.onu?.onu_model)}</td>
        <td data-column="mac"><code>${E(identity.onu_mac)}</code></td>
        <td data-column="serial"><code>${E(identity.onu_sn)}</code></td>
        <td data-column="ipwan"><code>${E(c.ipwan)}</code></td>
        <td data-column="rx" data-onu-metric="rx">${V(c.onu?.onu_rx)}</td>
        <td data-column="tx" data-onu-metric="tx">${V(c.onu?.onu_tx)}</td>
        <td data-column="temperature" data-onu-metric="temperature">${V(c.onu?.onu_temp)}</td>
        <td data-column="distance" data-onu-metric="distance">${V(c.onu?.onu_olt_distance)}</td>
        <td class="cp-row-action"><button class="na-button" type="button" data-evidence="${id}" aria-haspopup="dialog" aria-controls="evidenceDialog" aria-label="Đối chiếu thông tin của ${E(c.contract??c.onu_sn??'khách chưa rõ hợp đồng')}">Đối chiếu</button></td>
      </tr>`;
    }).join('')||`<tr><td colspan="15">${!$('portFilter').value?'Chọn một Port PON để xem khách hàng.':!portScope().known.includes($('portFilter').value)?`Chưa có dữ liệu của Port ${E($('portFilter').value)} trong phản hồi đang mở.`:'Không có khách hàng khớp bộ lọc.'}</td></tr>`;
    const scopedTotal=current.rows.filter(row=>rowPort(row)===$('portFilter').value).length;
    $('viewCount').textContent=rows.length===scopedTotal?`${rows.length} khách hàng`:`${rows.length} / ${scopedTotal} khách hàng`;
  }
  function overview(){
    const {raw,result:r,rows}=current;
    $('resultState').textContent=raw.status?'Đã nhận kết quả':'Kiểm tra chưa hoàn tất / có lỗi';
    $('resultState').className='cp-badge'+(raw.status?'':' is-warning');
    $('resultDevice').textContent=M.text(r?.olt?.olt_name??r?.olt?.name);
    $('resultMeta').textContent=r?[r.olt.olt_ip??r.olt.ip,r.olt.vendor,r.olt.model,r.duration_ms!=null?`${M.text(r.duration_ms)} ms`:null].filter(v=>v!=null&&v!=='').join(' · '):'Phản hồi không có kết quả';
    $('customerWorkspace').hidden=!r;
    $('conflictRows').innerHTML='';
    const deviceFlow=rows.some(({customer})=>M.object(customer.source_values))||current.conflicts.some(({record})=>M.isDeviceConflict(record));
    $('conflictLeftLabel').textContent=deviceFlow?'Thiết bị OLT':'Giá trị phía System Radius';
    $('conflictRightLabel').textContent='Giá trị phía CDP';
    const failure=[raw.status===false?raw.message:null,raw.error].filter(filled);
    $('resultError').hidden=!failure.length;
    $('resultError').textContent=failure.map(M.text).join(' · ');
    const options=values=>[...new Set(values.filter(v=>v!=null&&v!==''))];
    $('moveFilter').innerHTML='<option value="">Mọi kết luận đối chiếu</option>'+options(rows.map(({customer:c})=>c.move_check?.status)).map(v=>`<option value="${E(v)}">${E(M.moveLabel(v))}</option>`).join('');
    renderRows();
  }
  function load(raw,name='Dữ liệu đã mở'){
    try{
      if(typeof raw==='string'&&raw.length>MAX_BYTES)throw Error('Nội dung vượt giới hạn 8 MB.');
      const parsed=M.parse(raw);
      if(parsed.result){
        $('oltInput').value=M.text(parsed.result.olt.olt_name??parsed.result.olt.name??parsed.result.olt.olt_ip??parsed.result.olt.ip).replace(/^[-—]$/,'');
        draftDevice=$('oltInput').value.trim().toLowerCase();manualDevice=false;
        const ports=M.list(parsed.result.ports.valid_ports).length?parsed.result.ports.valid_ports:parsed.result.ports.requested_ports;
        selectedPorts=[...new Set(M.list(ports))].slice(0,MAX_PORTS);
      }
      closeEvidence();current=parsed;resetFilters();overview();
      if(!$('oltInput').value.trim()&&parsed.result){$('oltInput').value=M.text(parsed.result.olt.olt_name??parsed.result.olt.name??parsed.result.olt.olt_ip??parsed.result.olt.ip).replace(/^[-—]$/,'');draftDevice=$('oltInput').value.trim().toLowerCase();}
      renderPicker();renderOltSelect();
      $('emptyState').hidden=true;$('resultSection').hidden=false;
      const suppliedDate=window.NETAUTO_PON_SAMPLE_DATES?.[parsed.result?.olt?.olt_name];
      $('importStatus').textContent=`Đã nạp ${parsed.rows.length} khách và ${parsed.conflicts.length} cảnh báo từ ${name}. ${name.startsWith('Phản hồi người dùng')?`Dữ liệu người dùng cung cấp${suppliedDate?' ngày '+suppliedDate:''}, không phải kết quả kiểm tra mới.`:'Chưa xác minh độ mới của dữ liệu.'}`;
      error('');return true;
    }catch(e){error(`Không nạp được phản hồi: ${e.message}${current?' Kết quả trước đó vẫn được giữ, chưa thay bằng tệp lỗi.':''}`);return false;}
  }
  function evidence(id,trigger){
    const row=current?.rows.find(row=>row.id===id);if(!row)return;
    const c=row.customer,m=c.move_check||{},check=m.device_index_check||{},identity=M.identityValues(c);
    const state=c.customer_state??c.onu_status??m.customer_state;
    const tone=state==='Online'?'online':state==='Offline'?'offline':'unknown';
    const requested=c.requested_location??{olt_name:current.result?.olt?.olt_name,port_name:rowPort(row)};
    const stateSource=filled(m.customer_state_source)?`<small>Theo ${E(source(m.customer_state_source))}</small>`:'';
    const moved=m.same_pon===false||(m.same_pon!==true&&M.object(m.current_location)&&M.object(requested)&&['olt_name','port_name'].some(key=>filled(m.current_location[key])&&filled(requested[key])&&String(m.current_location[key]).toLowerCase()!==String(requested[key]).toLowerCase()));
    const comparison=comparisonFields(c),shown=key=>comparison.some(field=>field.key===key);
    const locationShown=comparison.some(field=>field.key==='location'&&[field.left,field.right].some(value=>filled(value)&&M.text(value)===M.location(requested)));
    const facts=[...(!locationShown?[['Port kiểm tra',M.location(requested)]]:[]),...(moved?[['Port hiện tại',M.location(m.current_location)]]:[]),['ONU',c.onu?.onu_model],...(!shown('onu_mac')?[['MAC',identity.onu_mac]]:[]),...(!shown('onu_sn')?[['SN',identity.onu_sn]]:[]),...(!shown('onu_index')?[['ONU index',identity.onu_index]]:[]),['IP WAN',c.ipwan]];
    if(filled(c.onu?.onu_rx)||filled(c.onu?.onu_tx))facts.push(['Rx / Tx',`${M.text(c.onu?.onu_rx)} / ${M.text(c.onu?.onu_tx)} dBm`]);
    if(filled(m.system_radius?.ipwan)&&m.system_radius.ipwan!==c.ipwan)facts.push(['IP WAN · System Radius',m.system_radius.ipwan]);
    const reason=filled(m.status)&&m.status!=='not_checked'?M.moveLabel(m.status):M.groupLabels[row.group];
    $('evidenceTitle').textContent=`Đối chiếu · ${M.text(c.contract??c.onu_sn??c.onu_mac)}`;
    const reuse=check.identity_match===false||check.status==='index_reused';
    $('evidenceContent').innerHTML=`<section class="cp-detail-status is-${tone}"><span class="cp-detail-dot" aria-hidden="true"></span><h3>${E(tone==='unknown'?'Chưa xác nhận kết nối':state)}</h3>${contractTag(c)}<p>${E(reason)}</p>${stateSource}</section>`
      +detailFacts(facts)+sourceValues(c)+conflictEvidence(row.conflicts)+moveDifferences(m)
      +(reuse?`<section class="cp-detail-alert"><h3>Index đang thuộc ONU khác</h3><p>Không lấy công suất tại index này cho khách đang xem.</p>${detailFacts([['Index',check.target_onu_index],['MAC đang dùng',check.observed_identity?.mac],['SN đang dùng',check.observed_identity?.serial]])}</section>`:'');
    evidenceTrigger=trigger;$('evidenceDialog').showModal();$('closeEvidence').focus();
  }
  function detailFacts(rows){
    const facts=rows.filter(([,value])=>filled(value));
    return facts.length?`<dl class="cp-detail-facts">${facts.map(([label,value])=>`<div><dt>${E(label)}</dt><dd>${E(value)}</dd></div>`).join('')}</dl>`:'';
  }
  function comparisonFields(c){
    if(!M.object(c.source_values))return [];
    const device=c.source_values.olt_device??{},cdp=c.source_values.cdp_csoc??{};
    const fields=[['MAC','onu_mac'],['SN','onu_sn'],['ONU index','onu_index']].map(([label,key])=>({label,key,left:device[key],right:cdp[key]}));
    const location=value=>filled(value.olt_name)||filled(value.pon_port)?M.location({olt_name:value.olt_name,port_name:value.pon_port}):null;
    fields.push({label:'OLT / Port',key:'location',left:location(device),right:location(cdp)});
    return fields.filter(field=>filled(field.left)||filled(field.right));
  }
  function sourceValues(c){
    const fields=comparisonFields(c);
    const normalized=(value,key)=>{const text=M.text(value).trim().toLowerCase();return key==='onu_mac'?text.replace(/[^a-z0-9]/g,''):text;};
    return fields.length?`<section class="cp-source-comparison"><table aria-label="Đối chiếu thiết bị OLT và CDP"><thead><tr><th scope="col">Thông tin</th><th scope="col">Thiết bị OLT</th><th scope="col">CDP</th></tr></thead><tbody>${fields.map(({label,key,left,right})=>{const different=normalized(left,key)!==normalized(right,key);return `<tr${different?' class="is-different"':''}><th scope="row">${label}${different?'<span class="cp-compare-note">Khác nhau</span>':''}</th><td>${E(filled(left)?left:'-')}</td><td>${E(filled(right)?right:'-')}</td></tr>`;}).join('')}</tbody></table></section>`:'';
  }
  function differenceCard(title,leftSource,leftValue,rightSource,rightValue){
    const value=v=>Array.isArray(v)?v.map(M.text).join(' · '):v;
    return `<section class="cp-difference"><h3>${E(title)}</h3><div class="cp-difference-values"><div><span>${E(leftSource)}</span><strong>${E(value(leftValue))}</strong></div><span class="cp-difference-mark" aria-label="khác nhau">≠</span><div><span>${E(rightSource)}</span><strong>${E(value(rightValue))}</strong></div></div></section>`;
  }
  function conflictEvidence(records){
    const fields={contract:'Hợp đồng',mac:'MAC',onu_mac:'MAC',serial:'SN',onu_sn:'SN',onu_index:'ONU index',location:'Vị trí',olt_name:'OLT',pon_port:'Port',port_name:'Port',port:'Port'};
    return M.list(records).flatMap(({record:c})=>M.list(c.different_fields).filter(M.object).map(d=>{
      const field=Object.hasOwn(fields,d.field)?fields[d.field]:M.text(d.field);
      const missing=d.reason==='missing_on_one_source'&&!filled(d.csoc_value);
      return differenceCard(missing?`CDP thiếu ${field}`:`${field} không khớp`,M.isDeviceConflict(c)?'Thiết bị OLT':'Giá trị phía System Radius',d.device_value,'Giá trị phía CDP',missing?'-':d.csoc_value);
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
    const scoped=port?current.conflicts.filter(({id,ponPort})=>ponPort===port||!ponPort&&current.rows.some(row=>row.conflicts.some(c=>c.id===id)&&rowPort(row)===port)):[];
    const records=scoped.filter(({record})=>!q||JSON.stringify(record).toLowerCase().includes(q));
    $('conflictRows').innerHTML=records.map(({id,record:c})=>{
      const differences=M.list(c.different_fields).filter(M.object);
      const names={contract:'Hợp đồng',onu_mac:'MAC',onu_sn:'SN',onu_index:'ONU index',olt_name:'OLT',pon_port:'Port'};
      return `<tr><td><strong>${E(c.contract)}</strong><small>MAC · ${E(c.onu_mac)}</small><small>SN · ${E(c.onu_sn)}</small></td><td><b>${E(c.matched_by==='mac'?'MAC':c.matched_by)}</b><small>${E(c.severity==='warning'?'Chú ý':c.severity)}</small>${c.selected_for_profile===false?'<small>Bản ghi CDP khác</small>':''}</td><td>${differences.map(d=>`<span>${E(names[d.field]??d.field)}</span>`).join('')||'-'}</td><td>${differences.map(d=>`<span>${E(d.device_value)}</span>`).join('')||'-'}<small>${E(M.isDeviceConflict(c)?'Thiết bị OLT':source(c.sources))}</small></td><td>${differences.map(d=>`<span>${E(d.reason==='missing_on_one_source'&&!filled(d.csoc_value)?'-':Array.isArray(d.csoc_value)?d.csoc_value.join(' · '):d.csoc_value)}</span><small>${E(source(d.conflicting_source))}</small>`).join('')||'-'}</td><td><button class="na-button" type="button" data-conflict-evidence="${id}" aria-haspopup="dialog" aria-controls="evidenceDialog" aria-label="Đối chiếu thông tin của ${E(c.contract)}">Đối chiếu</button></td></tr>`;
    }).join('')||'<tr><td colspan="6">Không có cảnh báo mâu thuẫn khớp bộ lọc.</td></tr>';
    $('viewCount').textContent=`${records.length} / ${scoped.length} cảnh báo đối chiếu · không cộng vào ${current.rows.filter(row=>rowPort(row)===port).length} khách`;
  }
  function conflictDetails(id,trigger){
    const item=current?.conflicts.find(c=>c.id===id);if(!item)return;
    const c=item.record,linked=current.rows.filter(row=>row.conflicts.some(x=>x.id===id));
    $('evidenceTitle').textContent=`Đối chiếu · ${M.text(c.contract)}`;
    $('evidenceContent').innerHTML=conflictEvidence([item])+detailFacts([['MAC',c.onu_mac],['SN',c.onu_sn],['Khách đã có trong kết quả',linked.map(row=>M.text(row.customer.contract)).join(' / ')]]);
    evidenceTrigger=trigger;$('evidenceDialog').showModal();$('closeEvidence').focus();
  }
  $('ponOptions').addEventListener('change',event=>{const port=event.target.dataset.pickPort;if(!catalog().ports.includes(port))return;if(event.target.checked&&!selectedPorts.includes(port)&&selectedPorts.length>=MAX_PORTS){error('Chỉ được chọn tối đa 2 Port PON. Bỏ một Port trước khi chọn thêm.');renderPicker();return;}selectedPorts=event.target.checked?[...new Set([...selectedPorts,port])]:selectedPorts.filter(v=>v!==port);error('');renderPicker();});
  $('selectedPorts').addEventListener('click',event=>{const button=event.target.closest('[data-remove-port]');if(!button)return;selectedPorts=selectedPorts.filter(port=>port!==button.dataset.removePort);renderPicker();(Array.from($('ponOptions').querySelectorAll('[data-pick-port]')).find(input=>!input.disabled)??$('oltSelect')).focus();});
  $('oltInput').addEventListener('input',()=>{const next=$('oltInput').value.trim().toLowerCase();if(next!==draftDevice){selectedPorts=[];draftDevice=next;}renderPicker();});
  $('oltSelect').addEventListener('change',()=>{
    const value=$('oltSelect').value,sample=sampleFor(value);
    if(sample){loadSample(sample);return;}
    if(value!=='__manual__'&&value===$('oltInput').value)return;
    ++importTicket;closeEvidence();current=null;resetFilters();selectedPorts=[];draftDevice='';
    manualDevice=value==='__manual__';$('oltInput').value=manualDevice?'':value;
    renderPicker();renderOltSelect();
    $('resultSection').hidden=true;$('customerWorkspace').hidden=true;$('emptyState').hidden=false;error('');
    if(manualDevice)$('oltInput').focus();
  });
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
  $('portTabs').addEventListener('click',event=>{
    const button=event.target.closest('[data-port-tab]');if(!button)return;
    const port=button.dataset.portTab;if(!port||!portScope().ports.includes(port))return;
    closeEvidence();$('portFilter').value=port;renderRows();
    Array.from($('portTabs').querySelectorAll('[data-port-tab]')).find(item=>item.dataset.portTab===port)?.focus({preventScroll:true});
  });
  for(const [id,event] of [['customerSearch','input'],['portFilter','change'],['moveFilter','change'],['conflictFilter','change']])$(id).addEventListener(event,renderRows);
  $('resetFilters').addEventListener('click',()=>{const port=$('portFilter').value;resetFilters();$('portFilter').value=port;renderRows();});
  for(const prefix of ['customer','conflict']){
    const body=$(prefix+'Table'),header=$(prefix+'FixedHeader');
    body.addEventListener('scroll',()=>{if(header.scrollLeft!==body.scrollLeft)header.scrollLeft=body.scrollLeft;},{passive:true});
    header.addEventListener('scroll',()=>{if(body.scrollLeft!==header.scrollLeft)body.scrollLeft=header.scrollLeft;},{passive:true});
  }
  $('customerRows').addEventListener('click',event=>{const button=event.target.closest('[data-evidence]');if(button)evidence(Number(button.dataset.evidence),button);});
  $('conflictRows').addEventListener('click',event=>{const button=event.target.closest('[data-conflict-evidence]');if(button)conflictDetails(Number(button.dataset.conflictEvidence),button);});
  $('closeEvidence').addEventListener('click',closeEvidence);
  $('evidenceDialog').addEventListener('close',()=>{$('evidenceContent').innerHTML='';const trigger=evidenceTrigger;evidenceTrigger=null;if(trigger?.isConnected)trigger.focus({preventScroll:true});});
  $('evidenceDialog').addEventListener('click',event=>{if(event.target!==$('evidenceDialog'))return;const r=$('evidenceDialog').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeEvidence();});
  $('themeToggle').addEventListener('click',()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';});
  const params=new URLSearchParams(window.location.search);
  $('oltInput').value=params.get('olt')||'';draftDevice=$('oltInput').value.trim().toLowerCase();selectedPorts=[...new Set(params.getAll('pon').filter(v=>v.trim()))].slice(0,MAX_PORTS);renderPicker();renderOltSelect();
  function loadSample(sample){
    sample=sample?.result?sample:sampleFor($('oltInput').value)??samples()[0];if(!sample)return;
    ++importTicket;manualDevice=false;$('oltInput').value=sample.result.olt.olt_name;draftDevice=$('oltInput').value.toLowerCase();selectedPorts=M.list(sample.result.ports.requested_ports).slice(0,MAX_PORTS);
    load(sample,`Phản hồi người dùng · ${sample.result.olt.olt_name} / ${selectedPorts.join(' · ')}`);
  }
  $('loadSample').hidden=!samples().length;$('loadSample').addEventListener('click',()=>loadSample());
  // Only the supplied real response is previewed; never generate customer data or query devices.
  if(samples().length&&!params.has('olt'))loadSample();
  window.NETAUTO_CUSTOMER_PON_UI={load};
})();
