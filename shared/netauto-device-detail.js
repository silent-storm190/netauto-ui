// Layer 2: snapshot metadata/inventory and a type-aware port workspace.
(() => {
  const get = id => document.getElementById(id);
  const escape = value => String(value == null || value === '' || value === 'UNKNOWN' ? '—' : value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const format = value => (typeof value==='number'||typeof value==='string'&&value.trim())&&Number.isFinite(Number(value)) ? new Intl.NumberFormat('vi-VN').format(Number(value)) : '—';
  const labels = {device:'Chassis',transceiver:'Module quang',card:'Module card',power:'Module nguồn',fan:'Module quạt',rectifier:'Rectifier'};
  const kinds = {SWITCH:'Switch',OLT:'OLT',POWER:'Nguồn',PI:'PI'};
  let pop = null;
  let device = null;
  let backHandler = () => {};
  let activeTab='ports';
  let moduleRefreshTicket=0,deviceIdentity='';
  function firmwareValue(value){
    if(!value||typeof value!=='object')return escape(value);
    const version=escape(value.version);
    const extra=Object.entries(value).filter(([key,item])=>key!=='version'&&item!=null&&item!=='').map(([key,item])=>`${escape(key==='patch'?'Patch':key==='epld'?'EPLD':key)}: ${escape(typeof item==='object'?JSON.stringify(item):item)}`);
    return `<span>${version}</span>${extra.length?`<small>${extra.join(' · ')}</small>`:''}`;
  }
  function renderMetadata(){
    const inventory=device.inventory?.device || {};
    const area=device.area ?? inventory.area ?? pop.area;
    const serials=device.chassisSerials ?? inventory.serial;
    const serial=(Array.isArray(serials)?serials.join(' · '):serials)||device.materials?.find(row=>row.category==='device')?.serial;
    const counts=device.inventoryCounts??device.inventory?.count??{};
    const observedPorts=Array.isArray(device.ports)&&device.ports.length?new Set(device.ports.map(port=>window.NETAUTO_PORT_MODELS.clean(port.name)).filter(Boolean)).size:null;
    const portCount=device.portCount??device.port_count??device.totalPorts??inventory.port_count??counts.port??observedPorts;
    const updated=device.updatedAt??device.updated_at??device.lastUpdated??inventory.updatedAt??inventory.updated_at??device.inventoryTime;
    const profile=window.NETAUTO_PORT_MODELS.build(device).profile;
    const fields=[
      ['Nhận diện',[
        ['Tên thiết bị',escape(device.name)],['IP thiết bị',escape(device.ip)],['Vendor',escape(profile.vendor||device.vendor)],['Model',escape(device.model)],['Serial chassis',escape(serial)]
      ]],
      ['Vị trí',[
        ['POP',escape(device.POP ?? inventory.POP ?? pop.code)],
        ['Miền',escape(({MB:'Miền Bắc',MN:'Miền Nam'})[area]??area)],
        ['Vùng',escape(device.zone??inventory.zone??pop.zone)],
        ['Tỉnh',escape(device.province??inventory.province??pop.province)],
        ['Chi nhánh',escape(device.branch??inventory.branch??pop.branch)]
      ]],
      ['Vận hành',[
        ['Chức năng',escape(device.function ?? inventory.function)],
        ['Firmware',firmwareValue(device.firmware ?? inventory.firmware)],
        ['Total MAC',format(device.totalMac ?? device.total_mac ?? inventory.total_mac)],
        ['Ngày cập nhật',escape(updated)]
      ]],
      ['Phần cứng',[
        ['Số port',format(portCount)],['Số transceiver',format(counts.transceiver)],
        ['Module nguồn',format(counts.power)],['Module quạt',format(counts.fan)],['Card',format(counts.card)]
      ]]
    ];
    get('deviceDetailFields').innerHTML=fields.map(([title,rows])=>`<section class="l2-metadata-group"><h3>${title}</h3><dl>${rows.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl></section>`).join('');
  }
  function showTab(tab) {
    const hasPorts=['SWITCH','OLT'].includes(device?.type);
    activeTab=hasPorts?tab:'inventory';
    get('devicePortsTab').hidden=!hasPorts;
    get('devicePortsPanel').hidden=activeTab!=='ports';
    get('deviceInventoryPanel').hidden=activeTab!=='inventory';
    get('devicePortsTab').setAttribute('aria-pressed',String(activeTab==='ports'));
    get('deviceInventoryTab').setAttribute('aria-pressed',String(activeTab==='inventory'));
    window.NETAUTO_DEVICE_PORTS.closeMenu();
  }
  function renderMaterials() {
    const rows = device.materials || [];
    const query = get('deviceDetailMaterialSearch').value.trim().toLowerCase();
    const filtered = rows.filter(row=>[labels[row.category],row.slot,row.type,row.serial].join(' ').toLowerCase().includes(query));
    const source=window.NETAUTO_POP_DETAIL_DATA;
    get('deviceDetailRows').innerHTML = filtered.map(row=>`<tr><td>${escape(labels[row.category] || row.category)}</td><td>${escape(row.slot)}</td><td>${escape(row.type)}</td><td><code>${escape(row.serial)}</code></td></tr>`).join('') || `<tr><td colspan="4"><div class="l2-empty">${source.isLoaded(pop.code)?'Không có bản ghi inventory phù hợp trong dữ liệu.':source.status(pop.code)==='error'?'Không tải được inventory. Mở lại thiết bị để thử lại.':'Đang nạp inventory thiết bị…'}</div></td></tr>`;
    get('deviceDetailMaterialCount').textContent = `Hiển thị ${filtered.length} / ${device.materialRowsTotal ?? rows.length} bản ghi vật tư. Các chỉ số tổng giữ nguyên theo nguồn.`;
  }
  function open(currentPop,currentDevice,preserve=false) {
    const identity=JSON.stringify([currentPop.code,currentDevice.name,currentDevice.ip]);
    if(identity!==deviceIdentity||!preserve){
      ++moduleRefreshTicket;deviceIdentity=identity;
      get('deviceModulesRefresh').disabled=false;get('deviceModulesRefresh').setAttribute('aria-busy','false');
      get('deviceModuleRefreshStatus').hidden=true;get('deviceModuleRefreshStatus').textContent='';
      window.NETAUTO_CONTEXT_TOOLS?.close();
    }
    pop = currentPop; device = currentDevice;
    get('deviceDetailPage').dataset.kind = device.type;
    get('deviceDetailName').textContent = device.name;
    get('deviceDetailKind').textContent = kinds[device.type] || 'Thiết bị';
    const profile=window.NETAUTO_PORT_MODELS.build(device).profile;
    get('deviceDetailModel').textContent=`${profile.vendor || device.vendor || '—'} · ${profile.name || device.model || '—'} · ${device.ip || '—'}`;
    get('backToPopDetail').textContent = `← Quay lại POP ${pop.code}`;
    get('deviceDetailBreadcrumb').textContent = `Quản lý POP / ${pop.code} / Thiết bị`;
    renderMetadata();
    get('deviceDetailSource').textContent = window.NETAUTO_POP_DETAIL_DATA.source;
    get('deviceDetailStats').innerHTML = Object.entries(labels).map(([key,label])=>`<article><span>${label}</span><b>${format(device.inventoryCounts?.[key])}</b></article>`).join('');
    const hasPorts=['SWITCH','OLT'].includes(device.type);
    get('deviceContextToolsSection').hidden=!hasPorts;
    window.NETAUTO_CONTEXT_TOOLS?.render('deviceContextTools',pop,device);
    get('devicePortSummary').hidden=!hasPorts;
    if(hasPorts)window.NETAUTO_DEVICE_PORTS.open(device,preserve,window.NETAUTO_POP_DETAIL_DATA.status(pop.code));
    showTab(preserve?activeTab:'ports');
    if(!preserve)get('deviceDetailMaterialSearch').value = '';
    renderMaterials();
  }
  get('deviceDetailMaterialSearch').addEventListener('input',renderMaterials);
  get('devicePortsTab').addEventListener('click',()=>showTab('ports'));
  get('deviceInventoryTab').addEventListener('click',()=>showTab('inventory'));
  get('backToPopDetail').addEventListener('click',()=>backHandler(pop.code));
  get('deviceModulesRefresh').addEventListener('click',()=>{
    if(!['SWITCH','OLT'].includes(device?.type)||get('deviceModulesRefresh').disabled)return;
    const ticket=++moduleRefreshTicket,identity=deviceIdentity,code=pop.code;
    const button=get('deviceModulesRefresh'),status=get('deviceModuleRefreshStatus');
    button.disabled=true;button.setAttribute('aria-busy','true');status.hidden=false;status.textContent='Đang tải lại dữ liệu module…';
    window.NETAUTO_POP_DETAIL_DATA.reloadPop(code,error=>{
      if(ticket!==moduleRefreshTicket||identity!==deviceIdentity)return;
      refreshInventory(code);
      button.disabled=false;button.setAttribute('aria-busy','false');
      status.hidden=false;status.textContent=error?'Không tải lại được snapshot module. Dữ liệu trước đó được giữ nguyên.':'Đã tải lại snapshot module từ bộ dữ liệu hiện có; chưa quét trực tiếp thiết bị.';
    });
  });
  function refreshInventory(code){if(pop?.code!==code)return;const record=window.NETAUTO_POP_DETAIL_DATA.pops[code]?.find(entry=>entry.name===device.name&&entry.ip===device.ip);if(record)open(pop,record,true);else {renderMaterials();if(['SWITCH','OLT'].includes(device.type))window.NETAUTO_DEVICE_PORTS.open(device,true,window.NETAUTO_POP_DETAIL_DATA.status(code));}}
  window.NETAUTO_DEVICE_PORTS.setRefreshHandler(()=>{const code=pop.code;window.NETAUTO_POP_DETAIL_DATA.ensurePop(code,()=>refreshInventory(code));if(['SWITCH','OLT'].includes(device.type))window.NETAUTO_DEVICE_PORTS.open(device,true,window.NETAUTO_POP_DETAIL_DATA.status(code));});
  window.NETAUTO_DEVICE_DETAIL = {open,refreshInventory,setBackHandler(handler){backHandler=handler;}};
})();
