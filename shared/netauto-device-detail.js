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
  let materialGroupOpen=new Map(),materialCategoryKeys=new Map(),materialQuery='';
  const glyphs={
    device:'<rect x="4" y="3" width="16" height="7" rx="2"/><rect x="4" y="14" width="16" height="7" rx="2"/><path d="M8 6h.01M8 17h.01M12 6h4M12 17h4"/>',
    transceiver:'<rect x="5" y="3" width="14" height="15" rx="2"/><path d="M8 18v3m4-3v3m4-3v3M9 7h6v5H9z"/>',
    card:'<rect x="4" y="4" width="16" height="15" rx="2"/><rect x="9" y="8" width="6" height="6" rx="1"/><path d="M7 19v2m5-2v2m5-2v2"/>',
    power:'<path d="m13 2-9 12h7l-1 8 10-12h-7z"/>',
    fan:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M10 10C3 6 12 2 12 10m2 0c4-7 8 2 0 2m0 2c7 4-2 8-2 0m-2 0c-4 7-8-2 0-2"/>',
    rectifier:'<rect x="3" y="6" width="17" height="12" rx="2"/><path d="M22 10v4M7 12h4m-2-2v4m6-2h2"/>',
    network:'<rect x="9" y="3" width="6" height="5" rx="1"/><path d="M12 8v5M5 17v-4h14v4"/><rect x="2" y="17" width="6" height="4" rx="1"/><rect x="16" y="17" width="6" height="4" rx="1"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a17 17 0 0 1 0 18 17 17 0 0 1 0-18z"/>',
    layers:'<path d="m12 3 9 5-9 5-9-5 9-5zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
    branch:'<circle cx="6" cy="5" r="2"/><circle cx="18" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><path d="M6 7v10M18 7a6 6 0 0 1-6 6H6"/>',
    pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0z"/><circle cx="12" cy="10" r="2"/>',
    serial:'<path d="M4 5v14M8 5v14m4-14v14m4-14v14m4-14v14"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18M8 15h2m4 0h2"/>',
    activity:'<path d="M3 12h4l3-7 4 14 3-7h4"/>',
  };
  const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${Object.hasOwn(glyphs,name)?glyphs[name]:glyphs.device}</svg>`;
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
    const updated=device.updatedAt??device.updated_at??device.lastUpdated??inventory.updatedAt??inventory.updated_at??device.inventoryTime;
    const profile=window.NETAUTO_PORT_MODELS.build(device).profile;
    const fields=[
      ['Nhận diện',[
        ['Tên thiết bị',escape(device.name)],['IP thiết bị',escape(device.ip)],['Vendor · Model',`${escape(profile.vendor||device.vendor)} · ${escape(device.model)}`],['Serial chassis',escape(serial)]
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
      ]]
    ];
    const fieldIcons=['device','network','device','serial','device','globe','network','pin','network','activity','card','network','calendar'];
    const locationIcons=['device','globe','layers','pin','branch'];
    get('deviceDetailLocation').innerHTML=fields[1][1].map(([label,value],index)=>`<div title="${label}"><dt>${label}</dt><span class="l2-location-icon" aria-hidden="true">${icon(locationIcons[index])}</span><dd>${value}</dd></div>`).join('');
    let fieldIndex=0;
    get('deviceDetailFields').innerHTML=fields.map(([,rows],groupIndex)=>rows.map(([label,value])=>{
      const index=fieldIndex++;
      if(groupIndex===1)return '';
      return `<div class="l2-device-field" data-info-group="${groupIndex}"><dt><span class="l2-meta-icon" aria-hidden="true">${icon(fieldIcons[index])}</span>${label}</dt><dd>${value}</dd></div>`;
    }).join('')).join('');
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
    const host=get('deviceDetailRows');
    const positions=new Map();
    for(const group of host.querySelectorAll('details[data-material-group]')){
      const key=group.dataset.materialGroup;
      if(!materialQuery)materialGroupOpen.set(key,group.open);
      if(query===materialQuery){const list=group.querySelector('.l2-material-list');if(list)positions.set(key,[list.scrollTop,list.scrollLeft]);}
    }
    const filtered = rows.filter(row=>[Object.hasOwn(labels,row.category)?labels[row.category]:'',row.category,row.slot,row.type,row.serial].join(' ').toLowerCase().includes(query));
    const source=window.NETAUTO_POP_DETAIL_DATA;
    const categories=[...new Set(rows.map(row=>String(row.category??'OTHER')))];
    host.innerHTML=categories.map(category=>{
      const all=rows.filter(row=>String(row.category??'OTHER')===category);
      const shown=filtered.filter(row=>String(row.category??'OTHER')===category);
      if(!shown.length)return '';
      if(!materialCategoryKeys.has(category))materialCategoryKeys.set(category,String(materialCategoryKeys.size));
      const key=materialCategoryKeys.get(category),open=query?true:materialGroupOpen.get(key)??(category==='device'||all.length<=4);
      const label=Object.hasOwn(labels,category)?labels[category]:category==='OTHER'?'Khác':category;
      return `<details class="l2-material-group" data-material-group="${key}"${open?' open':''}><summary><span class="l2-material-icon" aria-hidden="true">${icon(category)}</span><strong>${escape(label)}</strong><span class="l2-material-badge">${query&&shown.length!==all.length?`${shown.length}/${all.length}`:shown.length}</span><span class="l2-material-chevron" aria-hidden="true">${icon('activity').replace(glyphs.activity,'<path d="m6 9 6 6 6-6"/>')}</span></summary><ul class="l2-material-list l2-table-wrap" data-material-group="${key}" aria-label="${escape(label)}" tabindex="0">${shown.map(row=>`<li class="l2-material-item"><dl><div><dt>Slot / Port</dt><dd>${escape(row.slot)}</dd></div><div><dt>Model</dt><dd>${escape(row.type)}</dd></div><div class="l2-material-serial"><dt>Serial</dt><dd><code>${escape(row.serial)}</code></dd></div></dl></li>`).join('')}</ul></details>`;
    }).join('') || `<div class="l2-empty">${source.isLoaded(pop.code)?rows.length?'Không có vật tư khớp từ khóa trong dữ liệu.':'Chưa có bản ghi vật tư trong dữ liệu thiết bị.':source.status(pop.code)==='error'?'Không tải được inventory. Mở lại thiết bị để thử lại.':'Đang nạp inventory thiết bị…'}</div>`;
    for(const list of host.querySelectorAll('.l2-material-list')){
      const position=positions.get(list.dataset.materialGroup);
      if(position){list.scrollTop=position[0];list.scrollLeft=position[1];}
    }
    materialQuery=query;
    const total=device.materialRowsTotal ?? rows.length;
    const matchedGroups=new Set(filtered.map(row=>String(row.category??'OTHER'))).size;
    get('deviceDetailMaterialCount').textContent = `${format(filtered.length)} / ${format(total)} vật tư · ${query&&matchedGroups!==categories.length?`${matchedGroups}/${categories.length}`:categories.length} nhóm${rows.length<total?` · Đã tải ${format(rows.length)}`:''}`;
  }
  function open(currentPop,currentDevice,preserve=false) {
    const identity=JSON.stringify([currentPop.code,currentDevice.name,currentDevice.ip]);
    if(identity!==deviceIdentity||!preserve){
      materialGroupOpen=new Map();materialCategoryKeys=new Map();materialQuery='';get('deviceDetailRows').innerHTML='';
      ++moduleRefreshTicket;deviceIdentity=identity;
      get('deviceModulesRefresh').disabled=false;get('deviceModulesRefresh').setAttribute('aria-busy','false');
      get('deviceModuleRefreshStatus').hidden=true;get('deviceModuleRefreshStatus').textContent='';
      window.NETAUTO_CONTEXT_TOOLS?.close();
    }
    pop = currentPop; device = currentDevice;
    get('deviceDetailPage').dataset.kind = device.type;
    get('deviceDetailName').textContent = device.name;
    get('deviceDetailKind').textContent = kinds[device.type] || 'Thiết bị';
    get('deviceDetailIcon').innerHTML=icon(({SWITCH:'network',OLT:'device',POWER:'power',PI:'card'})[device.type]||'device');
    const profile=window.NETAUTO_PORT_MODELS.build(device).profile;
    get('deviceDetailModel').textContent=`${profile.vendor || device.vendor || '—'} · ${profile.name || device.model || '—'} · ${device.ip || '—'}`;
    get('backToPopDetail').textContent = `← Quay lại POP ${pop.code}`;
    get('deviceDetailBreadcrumb').textContent = `Quản lý POP / ${pop.code} / Thiết bị`;
    renderMetadata();
    get('deviceDetailSource').textContent = window.NETAUTO_POP_DETAIL_DATA.source;
    const hasPorts=['SWITCH','OLT'].includes(device.type);
    get('deviceDetailStats').innerHTML = Object.entries(labels).filter(([key])=>!hasPorts||key!=='rectifier').map(([key,label])=>`<article><span>${label}</span><b>${format(device.inventoryCounts?.[key])}</b></article>`).join('');
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
  window.NETAUTO_DEVICE_DETAIL = {open,refreshInventory,setBackHandler(handler){backHandler=handler;}};
})();
