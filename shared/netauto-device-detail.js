// Initial Layer 2 page: real metadata and inventory, no simulated port actions.
(() => {
  const get = id => document.getElementById(id);
  const escape = value => String(value == null || value === '' || value === 'UNKNOWN' ? '—' : value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const format = value => value == null ? '—' : new Intl.NumberFormat('vi-VN').format(value);
  const labels = {device:'Chassis',transceiver:'Module quang',card:'Module card',power:'Module nguồn',fan:'Module quạt',rectifier:'Rectifier'};
  const kinds = {SWITCH:'Switch',OLT:'OLT',POWER:'Nguồn',PI:'PI'};
  let pop = null;
  let device = null;
  let backHandler = () => {};
  function renderMaterials() {
    const rows = device.materials || [];
    const query = get('deviceDetailMaterialSearch').value.trim().toLowerCase();
    const filtered = rows.filter(row=>[labels[row.category],row.slot,row.type,row.serial].join(' ').toLowerCase().includes(query));
    const source=window.NETAUTO_POP_DETAIL_DATA;
    get('deviceDetailRows').innerHTML = filtered.map(row=>`<tr><td>${escape(labels[row.category] || row.category)}</td><td>${escape(row.slot)}</td><td>${escape(row.type)}</td><td><code>${escape(row.serial)}</code></td></tr>`).join('') || `<tr><td colspan="4"><div class="l2-empty">${source.isLoaded(pop.code)?'Không có bản ghi inventory phù hợp trong dữ liệu.':source.status(pop.code)==='error'?'Không tải được inventory. Mở lại thiết bị để thử lại.':'Đang nạp inventory thiết bị…'}</div></td></tr>`;
    get('deviceDetailMaterialCount').textContent = `Hiển thị ${filtered.length} / ${device.materialRowsTotal ?? rows.length} bản ghi vật tư. Các chỉ số tổng giữ nguyên theo nguồn.`;
  }
  function open(currentPop,currentDevice,preserve=false) {
    pop = currentPop; device = currentDevice;
    get('deviceDetailPage').dataset.kind = device.type;
    get('deviceDetailName').textContent = device.name;
    get('deviceDetailKind').textContent = kinds[device.type] || 'Thiết bị';
    get('backToPopDetail').textContent = `← Quay lại POP ${pop.code}`;
    get('deviceDetailBreadcrumb').textContent = `Quản lý POP / ${pop.code} / Thiết bị`;
    const serial = device.chassisSerials?.join(' · ') || device.materials?.find(row=>row.category==='device')?.serial;
    get('deviceDetailFields').innerHTML = [['IP quản lý',device.ip],['Vendor',device.vendor],['Model',device.model],['Chức năng',device.function],['Serial chassis',serial],['POP',pop.code],['Tỉnh · Chi nhánh',`${escape(device.province ?? pop.province)} · ${escape(device.branch ?? pop.branch)}`],['Miền · Vùng',`${(device.area ?? pop.area) === 'MB' ? 'Miền Bắc' : 'Miền Nam'} · ${escape(device.zone ?? pop.zone)}`]].map(([label,value])=>`<div><dt>${label}</dt><dd>${label.includes(' · ') ? value : escape(value)}</dd></div>`).join('');
    get('deviceDetailSource').textContent = window.NETAUTO_POP_DETAIL_DATA.source;
    get('deviceDetailStats').innerHTML = Object.entries(labels).map(([key,label])=>`<article><span>${label}</span><b>${format(device.inventoryCounts?.[key])}</b></article>`).join('');
    if(!preserve)get('deviceDetailMaterialSearch').value = '';
    renderMaterials();
  }
  get('deviceDetailMaterialSearch').addEventListener('input',renderMaterials);
  get('backToPopDetail').addEventListener('click',()=>backHandler(pop.code));
  window.NETAUTO_DEVICE_DETAIL = {open,refreshInventory(code){if(pop?.code!==code)return;const record=window.NETAUTO_POP_DETAIL_DATA.pops[code]?.find(entry=>entry.name===device.name&&entry.ip===device.ip);if(record)open(pop,record,true);else renderMaterials();},setBackHandler(handler){backHandler=handler;}};
})();
