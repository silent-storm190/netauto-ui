// Contextual tool launchers only. No configuration, reboot or live scan transport.
(()=>{
  'use strict';
  const get=id=>document.getElementById(id);
  const esc=value=>String(value??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const catalog={
    reboot:{label:'Reboot Thiết bị',description:'Chọn thiết bị và chuẩn bị lịch khởi động lại an toàn.',icon:'M12 3v9M6.3 5.8a8 8 0 1 0 11.4 0'},
    bandwidth:{label:'Nâng cấp băng thông',description:'Thiết lập mức băng thông và rà soát cấu hình trước khi áp dụng.',icon:'M4 17 10 11l4 4 6-8M14 7h6v6'},
    olt:{label:'Cấu hình mới OLT',description:'Chuẩn bị cấu hình ban đầu, uplink và các dịch vụ cho OLT.',icon:'M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01'},
    switchce:{label:'Cấu hình mới switchCE',description:'Khởi tạo cấu hình switchCE theo mẫu kết nối của POP.',icon:'M3 6h18v12H3zM7 10h2m3 0h2m3 0h1M7 14h2m3 0h2'},
    battery:{label:'Kiểm tra Pin/Accu',description:'Rà soát điện áp, dung lượng và tình trạng bộ Pin/Accu.',icon:'M3 6h17v12H3zM22 10v4M10 8l-3 5h6l-2 3'},
    power:{label:'Cấu hình giám sát nguồn mới',description:'Thiết lập kết nối và các ngưỡng giám sát cho hệ thống nguồn.',icon:'m13 2-9 12h7l-1 8 10-12h-7z'},
    fti:{label:'Cấu hình Kh.hàng FTI trên PON',description:'Chuẩn bị dịch vụ và cấu hình thuê bao FTI trên cổng PON.',icon:'M4 4h16v5H4zM12 9v5M5 20v-6h14v6M9 17h6'},
    pi:{label:'Cấu hình giám sát PI mới',description:'Thiết lập kết nối và nhóm tín hiệu giám sát của bộ PI.',icon:'M6 6h12v12H6zM9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4'},
    replace:{label:'Thay thế switchCE',description:'Chuẩn bị chuyển cấu hình sang thiết bị switchCE thay thế.',icon:'M4 7h14l-3-3M20 17H6l3 3M4 7v5m16 5v-5'},
  };
  const popKeys=['reboot','bandwidth','olt','switchce','battery','power'];
  const hosts=new Map();
  const dialog=get('contextToolDialog');
  let trigger=null,locked=false;
  const isSwitchCE=device=>device?.type==='SWITCH'&&['CE','SWITCHCE'].includes(String(device.function??device.inventory?.device?.function??'').toUpperCase().replace(/[\s_-]/g,''));
  function keysFor(device){
    if(!device)return popKeys;
    if(device.type==='OLT')return ['bandwidth','fti','power','pi','reboot'];
    if(device.type==='SWITCH')return ['bandwidth','reboot',...(isSwitchCE(device)?['replace']:[])];
    return [];
  }
  function labelFor(key,device){return key==='reboot'&&device?'Reboot device':catalog[key].label;}
  function close(){if(dialog.open)dialog.close();}
  function cleanup(){
    if(dialog.open)return;
    if(locked){window.NETAUTO_SMARTPOP_MODAL_SCROLL.unlock(dialog);locked=false;}
    const back=trigger;trigger=null;get('contextToolContext').innerHTML='';
    if(back?.isConnected!==false)back?.focus?.({preventScroll:true});
  }
  function launch(hostId,key,button){
    const context=hosts.get(hostId);
    if(!context||!keysFor(context.device).includes(key))return;
    const {pop,device}=context;
    trigger=button;
    get('contextToolTitle').textContent=labelFor(key,device);
    get('contextToolContext').innerHTML=`<dl><div><dt>POP</dt><dd>${esc(pop.code)}</dd></div>${device?`<div><dt>Thiết bị</dt><dd>${esc(device.name)}</dd></div><div><dt>IP</dt><dd>${esc(device.ip)}</dd></div>`:''}</dl>`;
    if(!dialog.open){
      window.NETAUTO_SMARTPOP_MODAL_SCROLL.lock(dialog);locked=true;dialog.showModal();
    }
    get('contextToolClose').focus({preventScroll:true});
  }
  function render(hostId,pop,device=null){
    const host=get(hostId);
    hosts.set(hostId,{pop,device});
    host.innerHTML=keysFor(device).map(key=>`<button type="button" class="na-context-tool" data-context-tool="${key}" aria-haspopup="dialog" aria-controls="contextToolDialog">${window.NETAUTO_MOTIFS.render('TOOLS')}<span class="na-context-tool-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${catalog[key].icon}"/></svg></span><span class="na-context-tool-copy"><strong>${esc(labelFor(key,device))}</strong><small>${esc(catalog[key].description)}</small></span></button>`).join('');
  }
  for(const id of ['popContextTools','deviceContextTools'])get(id).addEventListener('click',event=>{
    const button=event.target.closest('[data-context-tool]');
    if(button)launch(id,button.dataset.contextTool,button);
  });
  get('contextToolClose').addEventListener('click',close);
  dialog.addEventListener('close',cleanup);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const r=dialog.getBoundingClientRect();
    if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();
  });
  window.addEventListener('hashchange',close);window.addEventListener('popstate',close);
  window.NETAUTO_CONTEXT_TOOLS={render,close};
})();
