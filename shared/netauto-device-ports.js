(() => {
  'use strict';
  const get=id=>document.getElementById(id);
  const esc=value=>String(value==null||value===''?'—':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const stateLabels={up:'UP',down:'DOWN',empty:'Chưa có module',unknown:'Chưa rõ trạng thái'};
  const actions={crc:['≋','CRC Check'],lacp:['⇄','LACP Check'],speed:['↔','Đổi Port Speed'],clearOffline:['⌫','Clear Offline Index']};
  let layout=null,device=null,selected=null,tool='',loadState='idle',view='face',lastListWidth=0;
  const viewStorageKey='netauto-device-port-view';
  try { const saved=localStorage.getItem(viewStorageKey);if(saved==='face'||saved==='grid')view=saved; } catch { /* Storage is optional; keep the in-memory preference. */ }
  function setMenu(open) {
    get('devicePortMenu').hidden=!open;
    get('devicePortMenuToggle').setAttribute('aria-expanded',String(open));
  }
  function summary() {
    const s=layout.summary;
    get('devicePortSummary').innerHTML=`<span>Port <b>${s.total}</b></span><span class="up">UP <b>${s.up}</b></span><span class="down">DOWN <b>${s.down}</b></span>`;
    get('devicePortLayoutType').textContent=layout.hardware.stack?'Stack':layout.hardware.modular?'Chassis / Card':s.pon?'PON / NNI':'NNI / Link';
    const loading=!Array.isArray(device.ports);
    const note=loading?loadState==='error'?'Không tải được snapshot port. Nhấn Làm mới dữ liệu để thử lại; trạng thái chưa có dữ liệu.':'Đang nạp snapshot port. Trạng thái và module sẽ cập nhật khi có dữ liệu.':`Snapshot: ${s.observed} port được ghi nhận${s.profile?`; ${s.profile} vị trí bổ sung từ profile, chưa có dữ liệu`:''}. ${layout.normalizedNames?'Tên port đã làm sạch ký tự xuống dòng trong nguồn. ':''}Không có module không đồng nghĩa port DOWN.`;
    get('devicePortNote').innerHTML=`${esc(note)}<br>Vị trí giả lập theo bank/slot, không phải sơ đồ mặt trước chính xác.${layout.profile.note?` ${esc(layout.profile.note)}`:''}${layout.profile.source?` <a href="${esc(layout.profile.source)}" target="_blank" rel="noopener noreferrer">Tài liệu model ↗</a>`:''}`;
  }
  function filtered(port) {
    const q=get('devicePortSearch').value.trim().toLowerCase();
    const kind=get('devicePortType').value;
    const state=get('devicePortState').value;
    return (kind==='all'||kind===port.kind)&&(state==='all'||state==='unknown'&&port.status==='UNKNOWN'||state===port.state)&&[port.name,port.module?.vendor,port.module?.serial,port.module?.part_number,port.module?.type].join(' ').toLowerCase().includes(q);
  }
  function renderHardware() {
    const s=layout.summary;
    get('deviceHardwareBadge').textContent=`${layout.groups.length} nhóm port${layout.hardware.stack?` · ${layout.hardware.units.length} member`:''}`;
    get('deviceHardwareSummary').innerHTML=`<span><b>${s.total}</b> port</span><span class="is-up"><b>${s.up}</b> UP</span><span class="is-down"><b>${s.down}</b> DOWN</span><span class="is-empty"><b>${s.empty}</b> không module</span><span class="is-unknown"><b>${s.unknown-s.empty}</b> chưa rõ</span>`;
    get('deviceHardware').innerHTML=layout.hardware.units.map(unit=>`<article class="pw-chassis-unit" data-member="${esc(unit.id)}"><header><span class="pw-huawei-mark" data-vendor="${esc(layout.profile.vendor || device.vendor)}">${esc(layout.profile.vendor || device.vendor)}</span><b>${esc((layout.profile.name || device.model).replace(/ · IRF| Stack/g,''))}</b><small>${esc(unit.label)}</small></header><div class="pw-fixed-panel${layout.hardware.modular?' is-modular-panel':''}">${unit.groups.map(group=>`<section class="pw-face-group${group.uplink?' is-uplink-group':''}" style="--port-columns:${group.columns}"><header><b>${esc(group.media)} <span class="l2-face-bank-label">${esc(group.bank)}</span></b><span>${group.ports.length} port</span></header><div class="pw-face-grid">${group.ports.map(port=>`<button type="button" class="pw-face-port status-${port.state}${port.modulePresent===true?' has-module':port.modulePresent===false?' no-module':' module-unknown'}${/40|100/.test(group.media)?' is-uplink is-large':''}${selected===port.name?' is-selected':''}${filtered(port)?'':' is-filtered-out'}" data-select-port="${esc(port.name)}" aria-label="${esc(port.name)} · ${stateLabels[port.state]}" aria-pressed="${selected===port.name}" title="${esc(port.name)} · ${stateLabels[port.state]}${port.origin==='profile'?' · Profile':''}"${filtered(port)?'':' disabled'}><b aria-hidden="true"></b><span>${esc(port.label)}</span><i aria-hidden="true"></i></button>`).join('')}</div></section>`).join('')}</div><footer><span>SYS —</span><span>PWR —</span><em>${esc(layout.model)} · Snapshot</em></footer></article>`).join('') || '<div class="l2-empty">Chưa có inventory port để dựng mặt trước thiết bị. Không tự tạo card hoặc member chưa được ghi nhận.</div>';
    fitHardware();
    requestAnimationFrame(fitHardware);
  }
  function fitHardware() {
    if(!layout)return;
    const width=get('deviceHardwareScroll').clientWidth || 960;
    const geometry=window.NETAUTO_PORT_MODELS.faceplateGeometry(layout,width);
    const style=get('deviceHardware').style;
    const dimensions={'--face-port-width':`${geometry.portWidth}px`,'--face-chassis-width':layout.hardware.units.length?`${geometry.chassisWidth}px`:'100%'};
    for(const [name,value] of Object.entries(dimensions)){
      if(typeof style.setProperty==='function')style.setProperty(name,value);
      else style[name]=value;
    }
    get('deviceHardware').querySelectorAll('.pw-chassis-unit').forEach((node,index)=>{
      const tracks=geometry.units[index].tracks;
      if(typeof node.style.setProperty==='function')node.style.setProperty('--face-card-tracks',String(tracks));
      else node.style['--face-card-tracks']=String(tracks);
      if(typeof node.style.setProperty==='function')node.style.setProperty('--face-grid-columns',geometry.units[index].gridColumns);
      else node.style['--face-grid-columns']=geometry.units[index].gridColumns;
    });
    const banks=layout.hardware.units.flatMap(unit=>unit.groups);
    const placements=new Map(geometry.units.flatMap(unit=>unit.placements).map(bank=>[bank.id,bank]));
    get('deviceHardware').querySelectorAll('.pw-face-group').forEach((node,index)=>{
      const id=banks[index].id,placement=placements.get(id);
      const properties={'--port-columns':String(geometry.bankColumns[id]),'--face-bank-row':String(placement.row),'--face-bank-column':placement.column};
      for(const [name,value] of Object.entries(properties)){
        if(typeof node.style.setProperty==='function')node.style.setProperty(name,value);
        else node.style[name]=value;
      }
    });
  }
  function setView(next) {
    if(next!=='face'&&next!=='grid')return;
    view=next;get('devicePortWorkspace').dataset.view=view;
    try { localStorage.setItem(viewStorageKey,view); } catch { /* Continue without persistent storage. */ }
    get('deviceHardwarePanel').hidden=view!=='face';get('devicePortGridContent').hidden=view!=='grid';
    get('deviceFaceView').setAttribute('aria-pressed',String(view==='face'));get('deviceGridView').setAttribute('aria-pressed',String(view==='grid'));
    setMenu(false);
    requestAnimationFrame(fitPortViews);
  }
  function listWidth() {
    // Both views occupy the same panel. Hidden views may report zero width.
    return Math.max(1,(get('devicePortBanks').clientWidth || get('deviceHardwareScroll').clientWidth || 960)-26);
  }
  function fitPortViews() {
    fitHardware();
    if(layout&&view==='grid'&&lastListWidth!==listWidth())renderList();
  }
  function renderList() {
    let total=0;
    const width=listWidth();lastListWidth=width;
    get('devicePortBanks').innerHTML=layout.hardware.units.map(unit=>{
      // Geometry uses full banks, never the filtered subset or a model exception.
      const rows=window.NETAUTO_PORT_MODELS.listRows(layout,unit,width);
      const content=rows.map(row=>{
        const banks=row.groups.map((group,index)=>{
        const ports=group.ports.filter(filtered);total+=ports.length;if(!ports.length)return '';
        const bank=row.banks[index];
        return `<section class="l2-port-bank" data-bank="${esc(group.id)}" style="--bank-columns:${bank.columns};--bank-width:${bank.width}px;--list-port-width:${row.portWidth}px"><header class="l2-bank-head"><span class="l2-kind">${esc(group.ports[0].kind)}</span><b title="${esc(group.bank)}">${esc(group.media)}</b><span>${ports.length} port</span></header><div class="l2-port-tiles">${ports.map(port=>`<div class="l2-port-tile${selected===port.name?' is-selected':''}" data-state="${port.state}"><button type="button" class="l2-port-open" data-select-port="${esc(port.name)}" aria-label="${esc(port.name)} · ${stateLabels[port.state]}" aria-pressed="${selected===port.name}" title="${esc(port.name)} · ${stateLabels[port.state]}"><b>${esc(port.label)}</b></button></div>`).join('')}</div></section>`;
        }).join('');
        return banks?`<div class="l2-list-banks" data-list-row="${row.kind}">${banks}</div>`:'';
      }).join('');
      return content?`<section class="l2-list-unit" data-list-member="${esc(unit.id)}"><header class="l2-list-member"><b>${esc(layout.profile.vendor || device.vendor)} · ${esc(layout.profile.name || device.model)}</b><span>${esc(unit.label)}</span></header>${content}</section>`:'';
    }).join('') || `<div class="l2-empty">${layout.summary.total?'Không có port phù hợp bộ lọc.':'Chưa có inventory port cho thiết bị này. Số port và card sẽ được xác định từ dữ liệu thiết bị.'}</div>`;
    get('devicePortCount').textContent=`Hiển thị ${total} / ${layout.summary.total} port · chọn port để xem thông tin và công cụ.`;
  }
  function renderBanks() {
    renderList();renderHardware();
  }
  function speedOptions(port) {
    // Never infer compatible speeds from a model name or transceiver label.
    const speeds=port.snapshot?.capabilities?.speeds ?? device.portCapabilities?.[port.name]?.speeds;
    return Array.isArray(speeds)?[...new Set(speeds.filter(value=>typeof value==='string'&&value.trim()))]:[];
  }
  function toolsFor(port){return window.NETAUTO_PORT_MODELS.portTools(device,layout,port);}
  function portValue(value){return value&&typeof value==='object'?`<code class="l2-value-json">${esc(JSON.stringify(value,null,2))}</code>`:esc(value);}
  function renderPortInfo(port){
    const module=port.module || {},used=new Set();
    const details=rows=>`<dl class="pw-detail-list">${rows.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
    const fields=(definitions)=>definitions.flatMap(([key,label])=>{
      used.add(key);return Object.hasOwn(module,key)?[[label,key==='serial'?`<span class="l2-module-serial">${portValue(module[key])}</span>`:portValue(module[key])]]:[];
    });
    const optical=`<span class="l2-optical-pair"><b>${portValue(module.RX ?? module.rx)}</b> / <b>${portValue(module.TX ?? module.tx)}</b> <small>(dBm)</small></span>`;
    used.add('status');used.add('port_type');used.add('speed');
    used.add(module.RX!=null?'RX':'rx');used.add(module.TX!=null?'TX':'tx');
    const thresholds=fields([['RXH','Rx ngưỡng cao (dBm)'],['RXL','Rx ngưỡng thấp (dBm)'],['TXH','Tx ngưỡng cao (dBm)'],['TXL','Tx ngưỡng thấp (dBm)']]);
    const transceiver=[...fields([
      ['vendor','Vendor module'],['transceiver_type','Transceiver type'],['type','Type'],['module_type','Module type']
    ]),['Speed',portValue(module.speed)],...fields([
      ['part_number','Part number'],['serial','Serial module'],
      ['temperature','Nhiệt độ (°C)'],['wavelength','Bước sóng (nm)'],['connector','Connector'],['transfer_distance','Transfer distance'],['distance','Distance'],
      ['manu_date','Ngày sản xuất'],['manufacture_date','Ngày sản xuất'],['description','Description']
    ])];
    transceiver.push(['Rx / Tx',optical]);
    const extras=[...thresholds,
      ...Object.entries(module).filter(([key])=>!used.has(key)).map(([key,value])=>[key,portValue(value)]),
      ...Object.entries(port.snapshot || {}).filter(([key])=>!['name','module'].includes(key)).map(([key,value])=>[key,portValue(value)])];
    const note=port.modulePresent===false?'Snapshot ghi nhận port không có transceiver.':port.modulePresent!==true?'Chưa có dữ liệu transceiver cho port này.':'';
    get('devicePortInfo').innerHTML=`<div class="pw-port-info-heading"><b>Thông tin port - transceiver</b></div><div class="l2-port-info-fields">${details(transceiver)}</div>${note?`<p class="l2-note">${note}</p>`:''}${extras.length?`<details class="l2-port-extra"><summary>Thông tin bổ sung · ${extras.length} trường</summary>${details(extras)}</details>`:''}`;
  }
  function renderTool(animate=false) {
    const port=layout.ports.find(port=>port.name===selected);
    if(!port)return;
    get('devicePortSpeedForm').hidden=true;
    get('devicePortActionSelect').value=tool;
    get('devicePortActionTitle').textContent=actions[tool]?.[1] || 'Công cụ dành cho port';
    get('devicePortActionDescription').textContent=tool?'Dữ liệu snapshot · công cụ chưa kết nối thiết bị.':'Chọn một công cụ trong danh sách để xem nội dung chi tiết.';
    if(!tool) {
      get('devicePortResult').innerHTML='<div class="pw-tool-placeholder"><svg viewBox="0 0 96 72" aria-hidden="true"><rect x="18" y="14" width="60" height="44" rx="10"></rect><path d="M30 29h36M30 43h24"></path><circle cx="67" cy="43" r="8"></circle><path d="m73 49 8 8"></path></svg><b>Chọn công cụ để bắt đầu</b><p>Kiểm tra trạng thái hoặc thực hiện thao tác phù hợp trên port đang chọn.</p></div>';
    } else {
      const messages={crc:'Snapshot chưa có bộ đếm CRC, thời điểm đo hoặc delta lỗi. Công cụ chưa kết nối thiết bị.',lacp:'Snapshot chưa có nhóm LAG, actor/partner hoặc trạng thái thành viên. Công cụ chưa kết nối thiết bị.',speed:'Chỉ xem trước thao tác. Chưa có kiểm tra compatibility với module/cấu hình đang chạy; không gửi lệnh tới thiết bị.',clearOffline:'Dọn các ONU index Offline trên port PON đang chọn. Cần truy vấn danh sách Offline và xác nhận trước khi thực hiện; mockup chưa kết nối thiết bị.'};
      get('devicePortResult').innerHTML=`<h4>${actions[tool][1]}</h4><p class="l2-note">${messages[tool]}</p>`;
      if(tool==='clearOffline')get('devicePortResult').innerHTML+='<button class="pw-button" type="button" disabled title="Cần dữ liệu Offline và API thiết bị">Xem danh sách Offline</button><p class="l2-note">Chưa xóa ONU index nào.</p>';
      if(tool==='crc'||tool==='lacp') {
        const fields=tool==='crc'?['CRC errors','Input errors','Output errors']:['Eth-Trunk / LAG','Member state','Actor / Partner'];
        get('devicePortResult').innerHTML+=`<dl class="pw-detail-list">${fields.map(label=>`<div><dt>${label}</dt><dd>—</dd></div>`).join('')}</dl><button class="pw-button primary" type="button" disabled title="Công cụ chưa kết nối API thiết bị">Kiểm tra ${tool.toUpperCase()}</button>`;
      }
      if(tool==='speed') {
        const options=speedOptions(port);
        get('devicePortSpeedForm').hidden=!options.length;
        get('devicePortSpeed').innerHTML=options.map(value=>`<option value="${esc(value)}">${esc(value)}</option>`).join('');
        get('devicePortSpeed').value=options[0] || '';
        if(!options.length)get('devicePortResult').innerHTML+='<p class="l2-note">Cần dữ liệu capability theo interface trước khi chọn speed.</p>';
      }
    }
    if(animate&&!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      const result=get('devicePortResult');
      // Cancel only this panel's previous reveal; no delay, scroll or height animation.
      result.getAnimations?.().forEach(animation=>animation.cancel());
      result.animate?.([{opacity:0,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:150,easing:'cubic-bezier(.2,.7,.3,1)'});
    }
  }
  function inspect() {
    const port=layout.ports.find(port=>port.name===selected);
    get('devicePortSelected').hidden=!port;get('devicePortPlaceholder').hidden=!!port;
    get('devicePortInspector').hidden=!port;
    if(!port)return;
    get('devicePortInspector').dataset.status=port.state;
    get('deviceSelectedPortKind').textContent=port.kind==='UNKNOWN'?'Port':port.kind;
    get('deviceSelectedPortName').textContent=port.name;
    get('deviceSelectedPortState').textContent=`${stateLabels[port.state]}${port.origin==='profile'?' · Profile':''}`;
    renderPortInfo(port);
    get('deviceSelectedPortName').setAttribute('tabindex','-1');
    const tools=toolsFor(port);
    if(tool&&!tools.some(item=>item.key===tool&&item.enabled))tool='';
    get('devicePortMenu').innerHTML=tools.map(({key,enabled,reason})=>`<button type="button" data-port-action="${key}"${enabled?'':` disabled title="${esc(reason)}"`}><span aria-hidden="true">${actions[key][0]}</span>${actions[key][1]}${enabled?'':`<small>${esc(reason)}</small>`}</button>`).join('');
    get('devicePortActionSelect').innerHTML='<option value="">Chọn công cụ…</option>'+tools.map(({key,enabled,reason})=>`<option value="${key}"${enabled?'':` disabled title="${esc(reason)}"`}>${actions[key][1]}${enabled?'':` · ${esc(reason)}`}</option>`).join('');
    renderTool();
  }
  function open(record,preserve=false,status='idle') {
    device=record;loadState=status;layout=window.NETAUTO_PORT_MODELS.build(device);
    if(!preserve){selected=null;tool='';get('devicePortSearch').value='';get('devicePortType').value='all';get('devicePortState').value='all';setView(view);}
    if(!layout.ports.some(port=>port.name===selected)){selected=null;tool='';setMenu(false);}
    summary();renderBanks();inspect();
  }
  function selectPort(event,contextMenu=false) {
    const button=event.target.closest('[data-select-port]');if(!button)return;
    const name=button.dataset.selectPort;
    const port=layout.ports.find(port=>port.name===name);if(!port||!filtered(port))return;
    if(contextMenu)event.preventDefault();
    if(selected===name&&!contextMenu){closePort();return;}
    selected=name;tool='';renderBanks();inspect();setMenu(contextMenu);get('deviceSelectedPortName').focus({preventScroll:true});
  }
  function closePort(){selected=null;tool='';setMenu(false);renderBanks();inspect();get(view==='face'?'deviceFaceView':'deviceGridView').focus();}
  get('devicePortBanks').addEventListener('click',selectPort);
  get('devicePortBanks').addEventListener('contextmenu',event=>selectPort(event,true));
  get('deviceHardware').addEventListener('click',selectPort);
  get('deviceHardware').addEventListener('contextmenu',event=>selectPort(event,true));
  get('deviceClosePort').addEventListener('click',closePort);
  get('deviceFaceView').addEventListener('click',()=>setView('face'));
  get('deviceGridView').addEventListener('click',()=>setView('grid'));
  get('devicePortMenuToggle').addEventListener('click',()=>setMenu(get('devicePortMenu').hidden));
  function pickTool(action) {
    const port=layout.ports.find(port=>port.name===selected);if(!port)return;
    if(action&&!toolsFor(port).some(item=>item.key===action&&item.enabled)){get('devicePortActionSelect').value=tool;return;}
    const changed=tool!==action;
    tool=action;setMenu(false);renderTool(changed);
  }
  get('devicePortActionSelect').addEventListener('change',()=>pickTool(get('devicePortActionSelect').value));
  get('devicePortMenu').addEventListener('click',event=>{
    const button=event.target.closest('[data-port-action]');if(!button||button.disabled)return;
    pickTool(button.dataset.portAction);get('devicePortActionSelect').focus();
  });
  get('devicePortSpeedForm').addEventListener('submit',event=>{
    event.preventDefault();const port=layout?.ports.find(port=>port.name===selected);if(!port||tool!=='speed'||!toolsFor(port).some(item=>item.key==='speed'&&item.enabled)||!speedOptions(port).includes(get('devicePortSpeed').value))return;
    get('devicePortResult').innerHTML=`<h4>Xem trước · ${esc(get('devicePortSpeed').value)}</h4><p class="l2-note">Mô phỏng cho ${esc(port.name)}. Chưa áp dụng thay đổi; dữ liệu snapshot giữ nguyên.</p>`;
  });
  for(const [id,event] of [['devicePortSearch','input'],['devicePortType','change'],['devicePortState','change']])get(id).addEventListener(event,()=>{setMenu(false);renderBanks();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!get('devicePortMenu').hidden){setMenu(false);get('devicePortMenuToggle').focus();}});
  document.addEventListener('click',event=>{if(!event.target.closest('#devicePortInspector'))setMenu(false);});
  if(typeof window.ResizeObserver==='function'){
    const observer=new window.ResizeObserver(fitPortViews);
    observer.observe(get('deviceHardwareScroll'));observer.observe(get('devicePortBanks'));
  }
  window.addEventListener('resize',fitPortViews);
  window.NETAUTO_DEVICE_PORTS={open,closeMenu:()=>setMenu(false)};
})();
