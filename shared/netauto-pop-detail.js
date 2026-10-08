(() => {
  const source = window.NETAUTO_POP_DETAIL_DATA;
  const get = id => document.getElementById(id);
  const escape = value => String(value == null || value === '' || value === 'UNKNOWN' ? '—' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const format = value => value == null ? '—' : new Intl.NumberFormat('vi-VN').format(value);
  const groups = [
    {type:'SWITCH',label:'Switch',tone:'blue',icon:'switch'},
    {type:'OLT',label:'OLT',tone:'purple',icon:'server'},
    {type:'POWER',label:'Nguồn',tone:'orange',icon:'battery'},
    {type:'PI',label:'PI',tone:'green',icon:'cpu'},
  ];
  const deviceOrder = new Map(groups.map((group,index) => [group.type,index]));
  const materialLabels = {device:'Chassis',transceiver:'Module quang',card:'Module card',power:'Module nguồn',fan:'Module quạt',rectifier:'Rectifier'};
  const paths = {
    switch:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 9h10M7 13h2m3 0h2m3 0h1M7 16h2m3 0h2m3 0h1"/>',
    server:'<rect x="4" y="3" width="16" height="7" rx="2"/><rect x="4" y="14" width="16" height="7" rx="2"/><path d="M8 6.5h.01M8 17.5h.01M12 6.5h4M12 17.5h4"/>',
    battery:'<rect x="3" y="6" width="17" height="12" rx="2"/><path d="M22 10v4M11 8l-3 5h5l-2 3"/>',
    cpu:'<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/><rect x="10" y="10" width="4" height="4" rx="1"/>',
    fan:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M10 10C3 6 12 2 12 10m2 0c4-7 8 2 0 2m0 2c7 4-2 8-2 0m-2 0c-4 7-8-2 0-2"/>',
    door:'<path d="M4 21h16M6 21V3h12v18M14 12h.01"/>',
    bulb:'<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0l-1 2H9z"/>',
    temperature:'<path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0zM12 10v7"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a17 17 0 0 1 0 18 17 17 0 0 1 0-18z"/>',
    layers:'<path d="m12 3 9 5-9 5-9-5 9-5zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
    pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0z"/><circle cx="12" cy="10" r="2"/>',
    branch:'<circle cx="6" cy="5" r="2"/><circle cx="18" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><path d="M6 7v10M18 7a6 6 0 0 1-6 6H6"/>',
    building:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M10 21v-6h4v6"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2"/>',
    activity:'<path d="M3 12h4l3-7 4 14 3-7h4"/>',
    users:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v2"/>',
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.server}</svg>`;
  let currentPop = null;
  let currentDevices = [];
  let currentTab = 'overview';
  let backHandler = () => {};
  let deviceHandler = () => {};
  let previousBodyOverflow = '';

  function showTab(tab) {
    currentTab = tab;
    for (const [name, tabId, panelId] of [['overview','popOverviewTab','popOverviewPanel'],['materials','popMaterialsTab','popMaterialsPanel']]) {
      const selected = name === tab;
      get(tabId).setAttribute('aria-selected', String(selected));
      get(tabId).setAttribute('tabindex', selected ? '0' : '-1');
      get(panelId).hidden = !selected;
    }
  }

  function renderHeaderStats() {
    get('detailDeviceTotal').textContent = `${currentDevices.length} thiết bị · snapshot đầy đủ`;
    const counts = new Map();
    for (const device of currentDevices) counts.set(device.type,(counts.get(device.type) || 0)+1);
    const types = [...groups];
    const other = currentDevices.filter(device => !deviceOrder.has(device.type)).length;
    if (other) types.push({type:'OTHER',label:'Khác',tone:'slate',icon:'server'});
    get('detailDeviceTypeStats').innerHTML = types.map(group => {
      const count = group.type === 'OTHER' ? other : counts.get(group.type) || 0;
      return `<span class="l1-pop-kind-tag is-${group.tone}" data-kind="${group.type}" role="listitem" aria-label="${escape(group.label)}: ${format(count)} thiết bị"><span class="l1-pop-kind-icon" aria-hidden="true">${icon(group.icon)}</span><span>${group.label}</span><b>${format(count)}</b></span>`;
    }).join('');
  }

  // Presentation-only examples: never overwrite the imported POP/device snapshot.
  function mockPopMetadata(pop) {
    let seed = 0;
    for (const character of pop.code) seed = (seed * 31 + character.charCodeAt(0)) >>> 0;
    return {
      popType:['POP truy nhập','POP tập trung','POP phân phối'][seed % 3],
      deployedAt:`${String(seed % 27 + 1).padStart(2,'0')}/${String((seed >>> 4) % 12 + 1).padStart(2,'0')}/${2020 + seed % 5}`,
      popFunction:['Truy nhập & phân phối','Kết nối thuê bao FTTH','Trung chuyển lưu lượng'][(seed >>> 3) % 3],
      customerCount:400 + (seed % 21) * 40,
      address:`${10 + seed % 170} đường Nội Bộ, khu kỹ thuật ${pop.code}, ${pop.province || 'khu vực POP'}`,
    };
  }

  function renderPopMetadata(pop) {
    const location = [
      ['Miền',({MB:'Miền Bắc',MN:'Miền Nam'})[pop.area],'globe'],['Vùng',pop.zone,'layers'],['Tỉnh',pop.province,'pin'],['Chi nhánh',pop.branch,'branch'],
    ];
    get('detailPopLocation').innerHTML = location.map(([label,value,glyph]) => `<div title="${escape(label)}"><dt>${label}</dt><span class="l1-location-icon" aria-hidden="true">${icon(glyph)}</span><dd>${escape(value)}</dd></div>`).join('');
    const examples = mockPopMetadata(pop);
    const fields = [
      ['popType','Loại POP','building'],['deployedAt','Ngày triển khai','calendar'],['popFunction','Chức năng','activity'],['customerCount','Tổng khách hàng','users'],['address','Địa chỉ','pin'],
    ];
    let demoCount = 0;
    get('detailPopFields').innerHTML = fields.map(([key,label,glyph]) => {
      const demo = pop[key] == null || String(pop[key]).trim() === '' || pop[key] === 'UNKNOWN';
      const value = demo ? examples[key] : pop[key];
      if (demo) demoCount++;
      const shown = key === 'customerCount' && Number.isFinite(Number(value)) ? format(Number(value)) : value;
      return `<div class="${key === 'address' ? 'is-address' : 'l1-pop-field'}" data-field="${key}" data-demo="${demo}"${demo ? ' title="Dữ liệu giả lập để minh hoạ giao diện"' : ''}><dt>${icon(glyph)}<span>${label}</span></dt><dd>${escape(shown)}</dd></div>`;
    }).join('');
    get('detailPopMetadataNote').innerHTML = demoCount ? `<span class="l1-demo-badge">${demoCount} trường giả lập</span><span>Minh hoạ các thông tin còn thiếu; thiết bị và inventory vẫn dùng dữ liệu thật.</span>` : 'Các trường “—” chưa có dữ liệu trong snapshot.';
  }

  function open(pop, preserve = false) {
    closeTopo();
    if (preserve && currentPop?.code === pop.code) return;
    currentPop = pop;
    currentDevices = source.pops[pop.code] || pop.devices;
    get('detailPopName').textContent = pop.code;
    get('detailBreadcrumb').textContent = pop.code;
    get('detailSource').textContent = source.source;
    renderHeaderStats();
    renderPopMetadata(pop);
    get('detailDeviceSearch').value = '';
    get('detailMaterialSearch').value = '';
    get('detailMaterialCategory').value = 'all';
    get('detailMaterialDevice').innerHTML = '<option value="all">Tất cả thiết bị</option>' + currentDevices.map((device,index) => `<option value="${index}">${escape(device.name)}</option>`).join('');
    get('detailMaterialDevice').value = 'all';
    get('detailPiDemo').checked = true;
    get('detailTopoPanel').hidden = true;
    get('detailTopoPanel').innerHTML = '';
    get('detailTopoToggle').setAttribute('aria-expanded','false');
    // Do not carry topology or selected devices to another POP.
    renderDevices();
    renderPi();
    renderMaterials();
    window.NETAUTO_POP_REFERENCES.open(pop,currentDevices);
    showTab('overview');
  }

  function renderDevices() {
    const query = get('detailDeviceSearch').value.trim().toLowerCase();
    const matches = currentDevices.filter(device => [device.name,device.ip,device.model,device.vendor,device.function,device.type].join(' ').toLowerCase().includes(query));
    const groupFor = device => groups.find(group=>group.type === device.type) || {label:'Khác',tone:'slate',icon:'server'};
    const card = device => {const group=groupFor(device);return `<button type="button" class="l1-device-card is-${group.tone}" data-l1-device="${currentDevices.indexOf(device)}" aria-label="Mở trang thiết bị ${escape(device.name)}"><span class="l1-device-card-top"><span class="l1-device-icon">${icon(group.icon)}</span><span class="l1-function">${group.label} · ${escape(device.function)}</span></span><strong title="${escape(device.name)}">${escape(device.name)}</strong><span class="l1-device-ip">${escape(device.ip)}</span><span class="l1-device-card-foot"><span>${escape(device.vendor)} · ${escape(device.model)}</span></span></button>`;};
    const lanes = [{label:'Thiết bị mạng',types:['SWITCH','OLT'],network:true},{label:'Nguồn & Giám sát',types:['POWER','PI'],network:false}];
    get('detailDeviceGroups').innerHTML = lanes.map(lane => {
      // Sort only the display copy; keep source indices for inventory and navigation.
      const devices = matches.filter(device=>lane.types.includes(device.type) || (lane.network && !groups.some(group=>group.type===device.type))).sort((a,b)=>(deviceOrder.get(a.type) ?? groups.length)-(deviceOrder.get(b.type) ?? groups.length));
      if (!devices.length) return '';
      const counters = groups.filter(group=>lane.types.includes(group.type)).map(group=>{
        const total=currentDevices.filter(device=>device.type===group.type).length;
        const shown=devices.filter(device=>device.type===group.type).length;
        return shown ? `<span class="l1-lane-count is-${group.tone}"><i aria-hidden="true"></i>${group.label}<b>${query && shown!==total ? `${shown}/${total}` : shown}</b></span>` : '';
      }).join('');
      return `<section class="l1-device-lane"><header><h3>${lane.label}</h3><div>${counters}</div></header><div class="l1-device-grid">${devices.map(card).join('')}</div></section>`;
    }).join('') || '<div class="l1-empty-state">Không có thiết bị khớp từ khóa.</div>';
    get('detailDeviceCount').textContent = `${matches.length} / ${currentDevices.length} bản ghi thiết bị · ${source.source}.`;
  }

  function renderPi() {
    const pi = currentDevices.filter(device => device.type === 'PI');
    get('detailPiSource').textContent = pi.length ? pi.map(device => `${device.name} · ${device.ip}`).join(' / ') : 'Không có bản ghi thiết bị PI trong snapshot của POP này.';
    if (!get('detailPiDemo').checked) {
      get('detailPiSignals').innerHTML = '<div class="l1-empty-state">Chưa có response telemetry của POP này. Bật “Hiển thị mẫu tham chiếu” để duyệt bố cục.</div>';
      return;
    }
    const alarms = `<article class="l1-pi-block l1-alarm-block"><h3><span class="l1-alarm-icon" aria-hidden="true">△</span> Tổng quan cảnh báo</h3><div class="l1-alert-stats">${[[26,'Normal','green'],[0,'Warning','amber'],[1,'Critical','red'],[0,'Unknown','slate']].map(([value,label,tone]) => `<div class="is-${tone}"><span class="l1-alert-dot" aria-hidden="true"></span><span>${label}</span><b>${value}</b></div>`).join('')}</div><div class="l1-alert-note"><span aria-hidden="true">!</span><p><b>1 Critical trong mẫu tham chiếu</b><small>Chưa có dữ liệu chi tiết sự kiện để xác định nguyên nhân.</small></p></div></article>`;
    const fans = `<article class="l1-pi-block l1-fans"><h3>${icon('fan')} Quạt tản nhiệt</h3>${[58,61,64].map((speed,index) => `<div class="l1-fan-row"><span class="l1-signal-icon is-green">${icon('fan')}</span><div><b>Fan ${index+1}</b><span><strong>${speed}</strong> RPS</span></div><span class="l1-fan-load">100%</span></div>`).join('')}</article>`;
    const doors = `<article class="l1-pi-block"><h3>${icon('door')} Cửa & đèn chiếu sáng</h3><div class="l1-signal-grid">${[['door','Cửa trước','Đóng','green'],['door','Cửa bên hông','Đóng','green'],['bulb','Đèn trước','Tắt','slate'],['bulb','Đèn bên hông','Tắt','slate']].map(([glyph,label,value,tone]) => `<div class="l1-signal-tile"><span class="l1-signal-icon is-${tone}">${icon(glyph)}</span><span>${label}</span><b class="l1-${tone}">${value}</b></div>`).join('')}</div></article>`;
    const sensors = `<article class="l1-pi-block"><h3>${icon('temperature')} Nhiệt độ & độ ẩm</h3><div class="l1-sensor-grid">${[[42,'T1 · Trong tủ','green'],[28,'T2 · Ngoài tủ','green'],[44,'T3 · Khoang quạt','green'],[37,'T4 · Cảm biến phụ','amber']].map(([value,label,tone]) => `<div class="l1-sensor"><span>${label}</span><strong class="l1-${tone}">${value}<small> °C</small></strong></div>`).join('')}</div><div class="l1-humidity"><span>Độ ẩm</span><b>45 <small>%</small></b></div></article>`;
    get('detailPiSignals').innerHTML = `<div class="l1-pi-notice"><span class="l1-demo-badge">Dữ liệu mẫu · ảnh tham chiếu</span><span>Chỉ mô phỏng hiển thị, không phải chỉ số thực của POP ${escape(currentPop.code)}.</span></div><div class="l1-pi-layout">${alarms}${fans}${doors}${sensors}</div><div class="l1-power-states"><span>Nguồn điện lưới <b class="l1-green">ON</b></span><span>Chống sét <b class="l1-green">NORMAL</b></span><span>Máy phát <b>OFF</b></span></div>`;
  }

  function toggleTopo() {
    if (get('popTopoDialog').open) {closeTopo();return;}
    get('detailTopoPanel').hidden = false;
    window.NETAUTO_POP_REFERENCES.renderTopo();
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    get('popTopoDialog').showModal();
    get('detailTopoToggle').setAttribute('aria-expanded','true');
    get('closePopTopo').focus();
  }

  function closeTopo() {
    if (get('popTopoDialog').open) get('popTopoDialog').close();
  }
  get('popTopoDialog').addEventListener('close',()=>{
    get('detailTopoPanel').hidden=true;
    document.body.style.overflow=previousBodyOverflow;
    get('detailTopoToggle').setAttribute('aria-expanded','false');
    get('detailTopoToggle').focus();
  });
  get('popTopoDialog').addEventListener('click',event=>{
    if (event.target!==get('popTopoDialog')) return;
    const bounds=get('popTopoDialog').getBoundingClientRect();
    if (event.clientX<bounds.left || event.clientX>bounds.right || event.clientY<bounds.top || event.clientY>bounds.bottom) closeTopo();
  });
  get('closePopTopo').addEventListener('click',closeTopo);

  function renderMaterials() {
    const known = currentDevices.filter(device => device.inventoryCounts);
    get('detailMaterialStats').innerHTML = ['device','transceiver','card','power','fan'].map(category => {
      const values = known.map(device => device.inventoryCounts[category]).filter(value => value != null && Number.isFinite(Number(value)));
      return `<article><span>${materialLabels[category]}</span><b>${values.length ? format(values.reduce((sum,value) => sum + Number(value),0)) : '—'}</b></article>`;
    }).join('');
    const rows = currentDevices.flatMap((device,index) => (device.materials || []).map(row => ({...row,device:device.name,deviceIndex:String(index)})));
    const query = get('detailMaterialSearch').value.trim().toLowerCase();
    const device = get('detailMaterialDevice').value;
    const category = get('detailMaterialCategory').value;
    const filtered = rows.filter(row => (device === 'all' || device === row.deviceIndex) && (category === 'all' || category === row.category) && (!query || [row.device,row.slot,row.type,row.serial,materialLabels[row.category]].join(' ').toLowerCase().includes(query)));
    const loaded=source.isLoaded(currentPop.code);
    get('detailMaterialRows').innerHTML = filtered.map(row => `<tr><td><span class="l1-material-tag">${escape(materialLabels[row.category] || row.category)}</span></td><td><b>${escape(row.device)}</b></td><td>${escape(row.slot)}</td><td>${escape(row.type)}</td><td><code>${escape(row.serial)}</code></td></tr>`).join('') || `<tr><td colspan="5"><div class="l1-empty-state">${loaded?'Không có bản ghi vật tư phù hợp trong dữ liệu.':source.status(currentPop.code)==='error'?'Không tải được inventory. Mở lại POP để thử lại.':'Đang nạp inventory của POP…'}</div></td></tr>`;
    const totalRows = currentDevices.reduce((sum,entry) => sum + (entry.materialRowsTotal || 0),0);
    get('detailMaterialCount').textContent = `Hiển thị ${filtered.length} / ${totalRows} bản ghi vật tư. Inventory có dữ liệu ở ${known.length} / ${currentDevices.length} thiết bị; số lượng và danh sách giữ nguyên theo nguồn.`;
  }

  get('backToPopList').addEventListener('click',() => backHandler());
  for (const [id,tab] of [['popOverviewTab','overview'],['popMaterialsTab','materials']]) {
    get(id).addEventListener('click',() => showTab(tab));
    get(id).addEventListener('keydown',event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const target = event.key === 'Home' ? 'overview' : event.key === 'End' ? 'materials' : currentTab === 'overview' ? 'materials' : 'overview';
      showTab(target);
      get(target === 'overview' ? 'popOverviewTab' : 'popMaterialsTab').focus();
    });
  }
  get('detailDeviceSearch').addEventListener('input',renderDevices);
  get('detailDeviceGroups').addEventListener('click',event => {const button=event.target.closest('[data-l1-device]');const device=button && currentDevices[Number(button.dataset.l1Device)];if(device)deviceHandler(currentPop,device);});
  get('detailPiDemo').addEventListener('change',renderPi);
  get('detailTopoToggle').addEventListener('click',toggleTopo);
  get('detailMaterialSearch').addEventListener('input',renderMaterials);
  get('detailMaterialDevice').addEventListener('change',renderMaterials);
  get('detailMaterialCategory').addEventListener('change',renderMaterials);
  window.NETAUTO_POP_DETAIL = {open,closeTopo,refreshInventory(code){if(currentPop?.code!==code)return;currentDevices=source.pops[code] || currentPop.devices;renderHeaderStats();renderDevices();renderMaterials();},setBackHandler(handler){backHandler = handler;},setDeviceHandler(handler){deviceHandler=handler;}};
})();
