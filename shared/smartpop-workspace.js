/* SmartPOP read-only configuration and recorded telemetry. No network/control commands. */
(()=>{
  'use strict';
  const M=window.NETAUTO_SMARTPOP_MODEL,fixtures=window.NETAUTO_SMARTPOP_CONFIG_RESPONSES||{},get=id=>document.getElementById(id),host=get('detailPiSignals'),dialog=get('smartpopPeripheralDialog'),dialogContent=get('smartpopPeripheralContent');
  const esc=v=>String(v==null||v===''?'—':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const kinds={battery:'Ắc quy',cooling:'Điều hòa tủ',energy:'Công tơ điện',other:'Ngoại vi'};
  const T=window.NETAUTO_SMARTPOP_TELEMETRY,P=window.NETAUTO_SMARTPOP_PRESENTATION;
  const samples=[],bound=new Map();let sampleError='',pop=null,state=fresh(),popupRecord=null,popupTrigger=null,popupLocked=false;
  function fresh(){return {sample:'',device:null,group:'overview',query:'',page:0};}
  for(const [key,payload] of Object.entries(fixtures)){try{for(const record of M.parse(payload))samples.push({key:key+':'+record.opmsId,record});}catch(err){sampleError=err.message;}}
  if(T&&P&&window.NETAUTO_SMARTPOP_CAPTURE){try{
    const capture=T.parse(window.NETAUTO_SMARTPOP_CAPTURE),schema=samples.find(s=>String(s.record.opmsId)==='2035')?.record;
    if(!schema||!capture.devices.every(d=>schema.devices.some(x=>String(x.id)===String(d.id)&&x.model===d.model&&x.name===d.name&&x.registers.length===d.regs.length)))throw new Error('Runtime không khớp định nghĩa ngoại vi.');
    samples.unshift({key:'capture:'+capture.ip,record:{...schema,capture}});
  }catch(err){sampleError=err.message;}}
  function configuration(){return get('detailPiDemo').checked?(samples.find(s=>s.key===state.sample)||samples[0])?.record:bound.get(pop?.code);}
  function currentDevice(record){return record.devices.find(d=>d.key===state.device)||record.devices.find(d=>d.kind==='battery')||record.devices[0];}
  function tooltip(reg){return esc(reg.code+' · '+String(reg.source.rdescription||'')+' · addr='+reg.source.addr+' · func='+reg.source.func+' · runit='+reg.source.runit);}
  function groupOptions(device){const keys=new Set(device.registers.map(r=>r.group));return ['overview',...Object.keys(M.groupLabels).filter(k=>keys.has(k)),'all'].map(k=>`<option value="${k}"${state.group===k?' selected':''}>${esc(M.groupLabels[k])}</option>`).join('');}
  function sourceToolbar(record){const reference=get('detailPiDemo').checked;return `<div class="sp-source-bar"><div><span class="sp-source-tag">${record?.capture?'Bản ghi đã thu · không trực tiếp':reference?'Payload tham chiếu':'Cấu hình đã ghép POP'}</span>${record?`<b title="${record.capture?'gateway.network.IP':'opmsId'}">${record.capture?'IP '+esc(record.capture.ip):'OPMS '+esc(record.opmsId)}</b><span class="sp-muted" title="id">${record.capture?'Định nghĩa tham chiếu OPMS ':'Cấu hình '}${esc(record.capture?record.opmsId:record.id)}</span>`:''}</div>${reference?`<label class="sp-case-label">Nguồn dữ liệu<select data-sp-case aria-label="Chọn payload cấu hình SmartPOP">${samples.map(s=>`<option value="${esc(s.key)}"${configuration()===s.record?' selected':''}>${s.record.capture?'Bản ghi '+esc(s.record.capture.ip)+' · số đo & cảnh báo':'OPMS '+esc(s.record.opmsId)+' · cấu hình · '+s.record.devices.length+' ngoại vi'}</option>`).join('')}</select></label>`:''}</div>`;}
  function readiness(record){if(record?.capture)return `<div class="sp-readiness sp-captured" role="status" aria-live="polite"><span class="sp-status-symbol" aria-hidden="true">◷</span><div><b>Dữ liệu thực tế đã ghi lại</b><p>${record.capture.devices.length} ngoại vi · ${record.capture.alarms.length} dịch vụ backend. Các nhóm có thời điểm báo cáo riêng; không phải kết nối trực tiếp.</p></div><span class="sp-updated">Bản tin mới nhất: ${esc(T.formatTime(record.capture.ts))}</span></div>`;return `<div class="sp-readiness" role="status" aria-live="polite"><span class="sp-status-symbol" aria-hidden="true">○</span><div><b>Chưa có dữ liệu đo</b><p>${record?`${record.devices.length} ngoại vi · ${record.registerCount} định nghĩa thanh ghi. Payload chưa có giá trị, cảnh báo hoặc thời gian đo.`:'Chưa có cấu hình SmartPOP được ghép với POP này.'}</p></div><span class="sp-updated">Cập nhật: —</span></div>`;}
  function peripheralTabs(record,active){
    return `<div class="sp-peripheral-tabs" role="group" aria-label="Chọn ngoại vi trong popup">${record.devices.map(d=>`<button type="button" class="sp-peripheral-option" data-sp-peripheral-device="${esc(d.key)}" data-sp-kind="${esc(d.kind)}" aria-pressed="${d.key===active.key}" aria-controls="smartpopPeripheralValues" title="${esc(d.name+' · '+d.model)}"><b>${esc(d.name)}</b><small>${esc(kinds[d.kind])} · ${esc(d.model)}</small></button>`).join('')}</div>`;
  }
  function readings(record,device){
    const rows=M.rows(device,{group:state.group,query:state.query}),pages=Math.max(1,Math.ceil(rows.length/25));state.page=Math.min(Math.max(0,state.page),pages-1);const start=state.page*25,shown=rows.slice(start,start+25);
    return `<section id="smartpopPeripheralReadings" class="sp-reading-panel" data-sp-kind="${esc(device.kind)}" aria-label="Thông số ${esc(device.name)}">${peripheralTabs(record,device)}<header class="sp-reading-head"><span class="sp-pending">${record.capture?esc(T.status(record.capture,device))+' · '+esc(T.formatTime(record.capture.deviceTs)):'Chờ telemetry'}</span></header><div class="sp-reading-toolbar"><select data-sp-group aria-label="Nhóm thông số SmartPOP">${groupOptions(device)}</select><label class="sp-search"><span aria-hidden="true">⌕</span><input type="search" data-sp-search value="${state.query?esc(state.query):''}" placeholder="Tìm trong nhóm thông số…" aria-label="Tìm tên tiếng Việt, biến gốc hoặc địa chỉ trong nhóm"></label></div><div id="smartpopPeripheralValues" class="sp-table-scroll"><table class="sp-table sp-values"><colgroup><col><col class="sp-value-col"></colgroup><thead><tr><th scope="col">Thông số</th><th scope="col" class="sp-value">Giá trị</th></tr></thead><tbody>${shown.length?shown.map(r=>`<tr data-sp-register="${esc(r.key)}"><th scope="row"><span class="sp-parameter" title="${tooltip(r)}">${esc(r.label)}</span></th>${record.capture?P.valueCell(record.capture,device,r): `<td class="sp-value sp-unmeasured" aria-label="Chưa có giá trị đo">—${r.unit!=='—'?' <span class="sp-inline-unit" title="runit: '+esc(r.source.runit)+'">'+esc(r.unit)+'</span>':''}</td>`}</tr>`).join(''):'<tr><td colspan="2"><div class="sp-empty">Không có thông số khớp. Thử nhóm khác hoặc xóa từ khóa.</div></td></tr>'}</tbody></table></div><footer class="sp-reading-footer"><span>${rows.length?start+1:0}–${Math.min(start+25,rows.length)} / ${rows.length} ${record.capture?'thông số':'định nghĩa'}${state.group==='all'?'':' trong nhóm'}</span>${pages>1?`<div><button type="button" class="na-button" data-sp-page="-1" ${state.page===0?'disabled':''}>← Trước</button><span>${state.page+1}/${pages}</span><button type="button" class="na-button" data-sp-page="1" ${state.page===pages-1?'disabled':''}>Sau →</button></div>`:`<span>${record.capture?'“—”: chưa có số đo hợp lệ · hover để xem lý do':'Giá trị “—” không đồng nghĩa bằng 0'}</span>`}</footer></section>`;
  }
  function peripherals(record,device,compact=false){
    const buttons=record.devices.map(d=>{
      const lost=!!record.capture&&T.disconnected(record.capture,T.device(record.capture,d));
      const mark=P?.icon?P.icon(d.kind):d.kind==='battery'?'▰':d.kind==='cooling'?'❄':'▤';
      return `<button type="button" class="sp-device-button" data-sp-kind="${esc(d.kind)}" data-sp-connection="${lost?'disconnected':'reported'}" data-sp-device="${esc(d.key)}" aria-haspopup="dialog" aria-expanded="false" aria-controls="smartpopPeripheralDialog" title="${esc(d.name+' · '+d.model+' · '+d.registers.length+' thanh ghi')}"><span class="sp-device-mark" aria-hidden="true">${mark}</span><span><b>${esc(d.name)}</b><small>${esc(kinds[d.kind])} · ${esc(d.model)}</small>${record.capture?`<small class="sp-device-state ${lost?'sp-disconnected':''}">${esc(T.status(record.capture,d))}</small>`:''}</span><span class="sp-register-count">${d.registers.length}<small>thanh ghi</small></span></button>`;
    }).join('')||'<div class="sp-empty">Chưa cấu hình ngoại vi.</div>';
    const title=compact?`<header><h3><span class="sp-section-icon">${P.icon('peripherals')}</span>Ngoại vi đã cấu hình</h3><span class="sp-peripheral-count">${record.devices.length}</span></header>`:`<div class="sp-peripherals-title">Ngoại vi đã cấu hình <span>${record.devices.length}</span></div>`;
    return `<aside class="sp-peripherals${compact?' sp-overview-card sp-peripheral-card':''}" aria-label="Thiết bị ngoại vi đã cấu hình">${title}${compact?'<div class="sp-device-list">'+buttons+'</div>':buttons}${compact?'<footer>Nhấn thiết bị để mở thông số</footer>':record.capture?'':'<details class="sp-cabinet-note"><summary>Cảm biến & trạng thái tủ</summary><p>Payload này chưa có số đo nhiệt độ, độ ẩm, quạt, cửa, đèn, điện lưới hoặc máy phát. Không suy diễn trạng thái từ danh mục thanh ghi.</p></details>'}</aside>`;
  }
  function render(){
    window.NETAUTO_SMARTPOP_ALARMS?.close();closePeripheral();
    if(!pop)return;const record=configuration(),reference=get('detailPiDemo').checked;
    if(!record){host.innerHTML=sourceToolbar(null)+readiness(null)+`<div class="sp-empty">${sampleError?esc(sampleError):'Bật “Payload tham chiếu” để xem cấu hình đã cung cấp. Chưa có dữ liệu SmartPOP của '+esc(pop.code)+'.'}</div>`;return;}
    const device=currentDevice(record);state.device=device?.key??null;
    const navigation=peripherals(record,device,!!record.capture);
    host.innerHTML=sourceToolbar(record)+(reference?`<p class="sp-source-note">${record.capture?'Bản ghi từ IP '+esc(record.capture.ip)+', dùng cấu hình khớp ngoại vi làm định nghĩa tham chiếu. Chưa xác nhận ánh xạ với POP '+esc(pop.code)+'.':'Chưa có ánh xạ OPMS này với POP '+esc(pop.code)+'. Không dùng payload tham chiếu làm dữ liệu của POP đang mở.'}</p>`:'')+readiness(record)
      +(record.capture?P.overview(record.capture,navigation):'<div class="sp-config-peripherals">'+navigation+'</div>');
  }
  function renderPeripheral(){
    if(!popupRecord||!dialogContent)return;
    const device=popupRecord.devices.find(d=>d.key===state.device);if(!device){closePeripheral();return;}
    dialogContent.innerHTML=readings(popupRecord,device);
  }
  function closePeripheral(){if(dialog?.open)dialog.close();}
  function cleanupPeripheral(){
    if(popupLocked){window.NETAUTO_SMARTPOP_MODAL_SCROLL?.unlock(dialog);popupLocked=false;}
    const back=popupTrigger;popupTrigger=null;popupRecord=null;if(dialogContent)dialogContent.innerHTML='';
    back?.setAttribute?.('aria-expanded','false');
    if(back?.isConnected!==false)back?.focus?.({preventScroll:true});
  }
  function openPeripheral(key,button){
    const record=configuration(),device=record?.devices.find(d=>d.key===key);
    if(!device||!dialog||!dialogContent)return false;
    window.NETAUTO_SMARTPOP_ALARMS?.close();
    state.device=key;state.group='overview';state.query='';state.page=0;popupRecord=record;
    if(popupTrigger!==button)popupTrigger?.setAttribute?.('aria-expanded','false');popupTrigger=button;button?.setAttribute?.('aria-expanded','true');renderPeripheral();
    if(!dialog.open){window.NETAUTO_SMARTPOP_MODAL_SCROLL?.lock(dialog);popupLocked=true;dialog.showModal();}
    const selected=dialogContent.querySelector('[data-sp-peripheral-device][aria-pressed="true"]');selected?.focus({preventScroll:true});selected?.scrollIntoView?.({block:'nearest',inline:'nearest'});return true;
  }
  function resetDevice(){state.device=null;state.group='overview';state.query='';state.page=0;}
  host.addEventListener('change',event=>{
    if(event.target.dataset.spCase===undefined||!samples.some(s=>s.key===event.target.value))return;
    state.sample=event.target.value;resetDevice();render();
  });
  host.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.spAlarmOpen!==undefined){closePeripheral();window.NETAUTO_SMARTPOP_ALARMS?.open(configuration()?.capture,b.dataset.spAlarmOpen,b);}
    else if(b.dataset.spDevice!==undefined)openPeripheral(b.dataset.spDevice,b);
  });
  if(dialog&&dialogContent){
    dialog.addEventListener('close',cleanupPeripheral);
    dialog.addEventListener('cancel',event=>{event.preventDefault();closePeripheral();});
    dialog.addEventListener('click',event=>{
      if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closePeripheral();return;}
      const b=event.target.closest('button');if(!b||b.disabled)return;
      if(b.dataset.spPeripheralClose!==undefined){closePeripheral();return;}
      if(b.dataset.spPeripheralDevice!==undefined&&popupRecord){
        if(!popupRecord.devices.some(d=>d.key===b.dataset.spPeripheralDevice))return;
        state.device=b.dataset.spPeripheralDevice;state.group='overview';state.query='';state.page=0;renderPeripheral();
        const selected=dialogContent.querySelector('[data-sp-peripheral-device][aria-pressed="true"]');selected?.focus({preventScroll:true});selected?.scrollIntoView?.({block:'nearest',inline:'nearest'});return;
      }
      if(b.dataset.spPage!==undefined&&popupRecord){state.page+=Number(b.dataset.spPage);renderPeripheral();dialogContent.querySelector('[data-sp-group]')?.focus({preventScroll:true});}
    });
    dialog.addEventListener('change',event=>{if(event.target.dataset.spGroup===undefined||!popupRecord)return;state.group=event.target.value;state.page=0;renderPeripheral();dialogContent.querySelector('[data-sp-group]')?.focus({preventScroll:true});});
    dialog.addEventListener('input',event=>{
      if(event.target.dataset.spSearch===undefined||!popupRecord)return;state.query=event.target.value;state.page=0;const caret=event.target.selectionStart;
      renderPeripheral();const input=dialogContent.querySelector('[data-sp-search]');input?.focus({preventScroll:true});if(caret!=null)input?.setSelectionRange?.(caret,caret);
    });
    window.addEventListener?.('hashchange',closePeripheral);window.addEventListener?.('popstate',closePeripheral);
  }
  window.NETAUTO_SMARTPOP={
    open(currentPop){pop=currentPop;state=fresh();get('detailPiDemo').checked=!bound.has(pop.code);render();},render,closePeripheral,
    loadConfiguration(popCode,payload,opmsId){try{if(typeof popCode!=='string'||!popCode.trim())throw new Error('Cần POP đích rõ ràng.');const records=M.parse(payload),matches=records.filter(r=>opmsId==null||String(r.opmsId)===String(opmsId));if(matches.length!==1)throw new Error('Cần chọn đúng một opmsId để ghép POP.');bound.set(popCode,matches[0]);if(pop?.code===popCode){get('detailPiDemo').checked=false;resetDevice();render();}return {ok:true};}catch(err){return {ok:false,message:err.message};}},
    loadSnapshot(popCode,payload,expectedIP){try{
      if(!T||!P)throw new Error('Chưa nạp adapter telemetry.');
      if(typeof popCode!=='string'||!popCode.trim()||typeof expectedIP!=='string'||!expectedIP.trim())throw new Error('Cần POP và IP đích đã xác nhận.');
      const record=bound.get(popCode);if(!record)throw new Error('Cần ghép cấu hình cho POP trước.');
      const capture=T.parse(payload);if(capture.ip!==expectedIP)throw new Error('IP bản ghi không khớp IP đích.');
      if(!capture.devices.every(d=>record.devices.some(x=>String(x.id)===String(d.id)&&x.model===d.model&&x.name===d.name&&x.registers.length===d.regs.length)))throw new Error('Runtime không khớp định nghĩa ngoại vi.');
      bound.set(popCode,{...record,capture});if(pop?.code===popCode){get('detailPiDemo').checked=false;render();}return {ok:true};
    }catch(err){return {ok:false,message:err.message};}},
    getView(){return {popCode:pop?.code,reference:get('detailPiDemo').checked,opmsId:configuration()?.opmsId,device:state.device,group:state.group,query:state.query,page:state.page,peripheralOpen:!!dialog?.open,snapshot:!!configuration()?.capture,sourceIP:configuration()?.capture?.ip};}
  };
})();
