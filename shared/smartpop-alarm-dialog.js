/* Native, read-only alarm dialog. No telemetry transport or external writes. */
(()=>{
  'use strict';
  const T=window.NETAUTO_SMARTPOP_TELEMETRY,M=window.NETAUTO_SMARTPOP_MODEL;
  const esc=v=>String(v??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const levels=[['all','Tất cả'],['normal','Bình thường'],['warning','Cảnh báo'],['critical','Nghiêm trọng'],['unknown','Chưa xác định']];
  const dialog=document.getElementById('smartpopAlarmDialog'),content=document.getElementById('smartpopAlarmContent');
  // Both SmartPOP dialogs share a lock so queued native close events cannot
  // restore body scrolling while the other dialog is already open.
  const scroll=window.NETAUTO_SMARTPOP_MODAL_SCROLL??=(()=>{const owners=new Set();let previous='';return {
    lock(owner){if(!owners.size)previous=document.body.style.overflow;owners.add(owner);document.body.style.overflow='hidden';},
    unlock(owner){if(owners.delete(owner)&&!owners.size)document.body.style.overflow=previous;}
  };})();
  let source=null,level='all',query='',page=0,trigger=null,locked=false;
  const size=10;
  function rows(){const q=M.norm(query);return (source?.alarms??[]).filter(a=>(level==='all'||a.level===level)&&(!q||M.norm([a.label,a.source.name,a.source.msg].join(' ')).includes(q)));}
  function render(){
    if(!source||!content)return;
    const filtered=rows(),pages=Math.max(1,Math.ceil(filtered.length/size));page=Math.max(0,Math.min(page,pages-1));const start=page*size,shown=filtered.slice(start,start+size);
    content.innerHTML=`<div class="sp-dialog-context"><span><b>${esc(source.ip)}</b> · Bản ghi đã thu, không trực tiếp</span><span>Cảnh báo: ${esc(T.formatTime(source.alarmTs))} · giờ Việt Nam</span></div>
      <div class="sp-alarm-filters" role="group" aria-label="Lọc theo mức cảnh báo">${levels.map(([key,label])=>`<button type="button" class="sp-filter-tab sp-tone-${key==='all'?'info':key}" data-sp-alarm-level="${key}" aria-pressed="${key===level}">${label}<span>${key==='all'?source.alarms.length:source.counts[key]}</span></button>`).join('')}</div>
      <div class="sp-dialog-toolbar"><p id="smartpopAlarmCount" role="status" aria-live="polite">${filtered.length} dịch vụ${query?' khớp tìm kiếm':''}</p><label class="sp-dialog-search"><span aria-hidden="true">⌕</span><input type="search" data-sp-alarm-search value="${esc(query)}" placeholder="Tìm dịch vụ hoặc nội dung…" aria-label="Tìm trong nhóm cảnh báo"></label></div>
      ${source.alarms.some(a=>a.source.name.includes('_OSN_'))&&source.devices.some(d=>d.model==='PINCOSLIGHT')?'<p class="sp-dialog-quality">ⓘ Backend đồng thời báo OSN/VISION/COSLIGHT cho pin COSLIGHT. Giữ nguyên từng kết quả; không lấy số trong thông báo OSN thay số đo PIN1.</p>':''}
      <div class="sp-alarm-table-scroll" tabindex="0" role="region" aria-label="Bảng chi tiết cảnh báo"><table class="sp-alarm-table"><colgroup><col class="sp-alarm-service-col"><col class="sp-alarm-status-col"><col class="sp-alarm-time-col"><col></colgroup><thead><tr><th scope="col">Dịch vụ</th><th scope="col">Trạng thái</th><th scope="col">Thời gian</th><th scope="col">Thông tin backend</th></tr></thead><tbody>${shown.map(a=>`<tr class="sp-tone-${a.level}"><th scope="row"><span title="${esc(a.source.name)}">${esc(a.label)}</span><code>${esc(a.source.name)}</code></th><td><span class="sp-alarm-badge">${esc(a.levelLabel)}</span></td><td><span class="sp-time-label">Kiểm tra</span><time>${esc(T.formatTime(a.source.time?.last_check))}</time><span class="sp-time-label">Đổi trạng thái</span><time>${esc(T.formatTime(a.source.time?.last_change))}</time></td><td class="sp-alarm-message">${esc(a.source.msg)}</td></tr>`).join('')||'<tr><td colspan="4"><div class="sp-dialog-empty">Không có dịch vụ trong nhóm này'+(query?' khớp từ khóa':'')+'.</div></td></tr>'}</tbody></table></div>
      <footer class="sp-dialog-footer"><span>${filtered.length?start+1:0}–${Math.min(start+size,filtered.length)} / ${filtered.length} dịch vụ · ${size} dòng/trang</span><div><button type="button" data-sp-alarm-page="-1" ${page===0?'disabled':''} aria-label="Trang cảnh báo trước">← Trước</button><span>${page+1}/${pages}</span><button type="button" data-sp-alarm-page="1" ${page===pages-1?'disabled':''} aria-label="Trang cảnh báo sau">Sau →</button></div></footer>`;
  }
  function close(){if(dialog?.open)dialog.close();}
  function cleanup(){if(locked){scroll.unlock(dialog);locked=false;}const back=trigger;trigger=null;source=null;query='';page=0;if(content)content.innerHTML='';if(back?.isConnected!==false)back?.focus?.({preventScroll:true});}
  if(dialog&&content){
    dialog.addEventListener('close',cleanup);
    dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
    dialog.addEventListener('click',event=>{
      if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();return;}
      const b=event.target.closest('button');if(!b||b.disabled)return;
      if(b.dataset.spAlarmClose!==undefined){close();return;}
      if(b.dataset.spAlarmLevel!==undefined){if(!levels.some(([k])=>k===b.dataset.spAlarmLevel))return;level=b.dataset.spAlarmLevel;page=0;render();content.querySelector(`[data-sp-alarm-level="${level}"]`)?.focus({preventScroll:true});}
      else if(b.dataset.spAlarmPage!==undefined){page+=Number(b.dataset.spAlarmPage);render();content.querySelector('[data-sp-alarm-level][aria-pressed="true"]')?.focus({preventScroll:true});}
    });
    dialog.addEventListener('input',event=>{if(event.target.dataset.spAlarmSearch===undefined)return;query=event.target.value;page=0;const caret=event.target.selectionStart;render();const input=content.querySelector('[data-sp-alarm-search]');input?.focus({preventScroll:true});if(caret!=null)input?.setSelectionRange?.(caret,caret);});
    window.addEventListener?.('hashchange',close);window.addEventListener?.('popstate',close);
  }
  window.NETAUTO_SMARTPOP_ALARMS={
    open(snapshot,selected,button){if(!dialog||!content||!snapshot||!levels.some(([k])=>k===selected))return false;
      source=snapshot;level=selected;query='';page=0;if(!dialog.open)trigger=button;render();
      if(!dialog.open){scroll.lock(dialog);locked=true;dialog.showModal();}
      content.querySelector(`[data-sp-alarm-level="${level}"]`)?.focus({preventScroll:true});return true;
    },close,
    getView(){return {open:!!dialog?.open,level,query,page,total:source?rows().length:0,sourceIP:source?.ip};}
  };
})();
