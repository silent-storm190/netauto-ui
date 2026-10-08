(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const api = window.HuaweiDeviceLayouts;
  const escape = value => String(value == null || value === '' ? '—' : value).replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
  const statusLabel = status => ({up: 'UP', down: 'DOWN', empty: 'Không có module', unknown: 'Chưa có telemetry'}[status] || status);
  const confidenceLabel = value => ({'manufacturer-and-inventory': 'Đã đối chiếu inventory', 'inventory-template': 'Template từ inventory', 'chassis-only': 'Cần inventory card', unknown: 'Chưa xác minh'}[value] || value);
  const commonActions = [
    {id: 'crc', label: 'CRC Check', description: 'Kiểm tra bộ đếm lỗi của interface.'},
    {id: 'lacp', label: 'LACP Check', description: 'Kiểm tra trạng thái LACP của interface.'},
    {id: 'speed', label: 'Đổi Port Speed', description: 'Thay đổi tốc độ theo capability của port.'}
  ];

  let modelDev = 'HS67';
  let layout = api.get(modelDev);
  let currentView = 'ports';
  let selectedPort = null;
  let activeAction = '';
  let menuPort = null;
  let menuAnchor = null;
  let toastTimer;

  const ports = () => layout.interfaces;
  const empty = (title, text) => `<div class="pw-empty"><span aria-hidden="true">⌁</span><b>${escape(title)}</b><p>${escape(text)}</p></div>`;
  const detailList = items => `<dl class="pw-detail-list">${items.map(([key, value]) => `<div><dt>${escape(key)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>`;
  const toast = text => {
    $('pwToast').textContent = text;
    $('pwToast').classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('pwToast').classList.remove('is-visible'), 3000);
  };

  function initModelPicker() {
    const chassis = api.catalog.filter(item => ['HW12', 'HS12', 'HW93'].includes(item.modelDev));
    const stack = api.catalog.filter(item => item.modelDev.startsWith('HS') && !chassis.includes(item));
    const fixed = api.catalog.filter(item => item.modelDev.startsWith('HW') && !chassis.includes(item));
    const optionGroup = (label, items) => `<optgroup label="${label}">${items.map(item => `<option value="${item.modelDev}">${item.modelDev} · ${escape(item.manufacturerModel)}</option>`).join('')}</optgroup>`;
    $('pwModelSelect').innerHTML = optionGroup('Model fixed', fixed) + optionGroup('Stack', stack) + optionGroup('Chassis / modular', chassis);
    $('pwModelSelect').value = modelDev;
  }

  function portClass(port) {
    const size = port.speedGbps >= 40 ? ' is-large' : '';
    const module = port.modulePresent ? ' has-module' : ' no-module';
    return `${port.role === 'uplink' ? 'is-uplink' : 'is-service'}${size}${module} status-${port.status || 'unknown'}${selectedPort?.id === port.id ? ' is-selected' : ''}`;
  }

  function facePorts(group) {
    return group.interfaceIds.map(id => ports().find(port => port.id === id)).filter(Boolean).map(port => `<button type="button" class="pw-face-port ${portClass(port)}" data-select-port="${escape(port.id)}" title="${escape(port.cliName)} · ${escape(port.type)} · ${escape(statusLabel(port.status))}" aria-label="${escape(port.cliName)}, ${escape(statusLabel(port.status))}" aria-pressed="${selectedPort?.id === port.id}"><b aria-hidden="true"></b><span>${escape(port.label)}</span><i></i></button>`).join('');
  }

  function demoInventory(baseLayout) {
    return baseLayout.interfaces.map((port, index) => {
      const sequence = index + 1;
      const status = sequence % 9 === 0 ? 'empty' : sequence % 7 === 0 ? 'down' : 'up';
      if (status === 'empty') return {cliName: port.cliName, status, modulePresent: false};
      const isHighSpeed = port.speedGbps >= 40;
      return {
        cliName: port.cliName,
        status,
        modulePresent: true,
        vendor: 'HUAWEI',
        moduleType: isHighSpeed ? (port.speedGbps >= 100 ? 'QSFP28-100G-LR4' : 'QSFP+-40G-LR4') : port.speedGbps >= 10 ? 'SFP+-10G-LR' : 'SFP-GE-LX',
        serial: `DEMO${baseLayout.modelDev}${String(sequence).padStart(3, '0')}`,
        rx: status === 'up' ? (-3.1 - (sequence % 5) * 0.4).toFixed(1) : '-40.0',
        tx: (-1.2 - (sequence % 3) * 0.3).toFixed(1),
        crc: status === 'up' ? sequence % 4 : 0,
        inputErrors: status === 'down' ? 12 : 0,
        outputErrors: 0,
        ethTrunk: port.role === 'uplink' && sequence % 2 === 0 ? 'Eth-Trunk10' : null,
        lacpState: port.role === 'uplink' && status === 'up' ? 'Collecting / Distributing' : null
      };
    });
  }

  function renderHardware() {
    const units = [];
    for (let member = 1; member <= layout.members; member += 1) {
      const groups = layout.layoutGroups.filter(group => group.member === member);
      const bays = layout.bays.filter(bay => bay.member === member);
      let body = '';
      if (layout.chassis) {
        body = `<div class="pw-bay-grid">${bays.map(bay => {
          const group = groups.find(item => item.slot === bay.slot);
          return `<section class="pw-line-card${bay.installed ? ' is-installed' : ''}"><header><b>Slot ${bay.slot}</b><span>${escape(bay.cardProfile || 'Chưa có inventory card')}</span></header>${group ? `<div class="pw-face-grid" style="--port-columns:${group.columns}">${facePorts(group)}</div>` : '<div class="pw-vacant-bay"><span>LPU</span><small>Chờ dữ liệu card</small></div>'}</section>`;
        }).join('')}</div>`;
      } else {
        body = `<div class="pw-fixed-panel">${groups.map(group => `<section class="pw-face-group ${group.role === 'uplink' ? 'is-uplink-group' : ''}"><header><b>${escape(group.label)}</b><span>${group.interfaceIds.length} port</span></header><div class="pw-face-grid" style="--port-columns:${group.columns}">${facePorts(group)}</div></section>`).join('')}</div>`;
      }
      units.push(`<article class="pw-chassis-unit"><header><span class="pw-huawei-mark">HUAWEI</span><b>${escape(layout.manufacturerModel.replace(' Stack', ''))}</b><small>${layout.stack ? `Member ${member}` : layout.chassis ? 'Chassis' : '1U fixed'}</small></header>${body}<footer><span>SYS</span><i></i><span>PWR</span><i></i><em>${escape(layout.modelDev)}</em></footer></article>`);
    }
    $('pwHardware').innerHTML = units.join('');
    $('pwLayoutBadge').textContent = layout.chassis ? `${layout.bays.length} khe LPU` : `${layout.layoutGroups.length} nhóm port`;
    const counts = layout.summary.byStatus;
    $('pwHardwareSummary').innerHTML = `<span><b>${layout.summary.total}</b> port</span><span class="is-up"><b>${counts.up || 0}</b> UP</span><span class="is-down"><b>${counts.down || 0}</b> DOWN</span><span class="is-empty"><b>${counts.empty || 0}</b> không module</span>`;
  }

  function renderDataPreview() {
    const preview = {
      modelDev: layout.modelDev,
      typeDev: layout.typeDev,
      typeDevEX: layout.typeDevEX,
      manufacturerModel: layout.manufacturerModel,
      stack: layout.stack,
      members: layout.members,
      requiresInventory: layout.requiresInventory,
      summary: layout.summary,
      layoutGroups: layout.layoutGroups.map(group => ({...group, interfaceIds: group.interfaceIds.slice(0, 4).concat(group.interfaceIds.length > 4 ? [`… +${group.interfaceIds.length - 4}`] : [])})),
      bays: layout.bays,
      interfaces: layout.interfaces.slice(0, 3).concat(layout.interfaces.length > 3 ? [{more: layout.interfaces.length - 3}] : [])
    };
    $('pwDataPreview').textContent = JSON.stringify(preview, null, 2);
  }

  function closeMenu(returnFocus = false) {
    $('pwPortMenu').hidden = true;
    if (menuAnchor) menuAnchor.setAttribute('aria-expanded', 'false');
    if (returnFocus && menuAnchor?.isConnected) menuAnchor.focus();
    menuPort = null;
  }

  function openMenu(port, anchor) {
    closeMenu();
    menuPort = port;
    menuAnchor = anchor;
    $('pwPortMenu').innerHTML = `<header><b>${escape(port.label)}</b><small>${escape(port.type)}</small></header>${commonActions.map(action => `<button type="button" role="menuitem" class="pw-menu-item" data-port-action="${action.id}"><span aria-hidden="true">›</span><span>${escape(action.label)}</span></button>`).join('')}`;
    $('pwPortMenu').hidden = false;
    anchor.setAttribute('aria-expanded', 'true');
    const rect = anchor.getBoundingClientRect();
    const menuRect = $('pwPortMenu').getBoundingClientRect();
    $('pwPortMenu').style.left = `${Math.max(12, Math.min(rect.right - menuRect.width, window.innerWidth - menuRect.width - 12))}px`;
    $('pwPortMenu').style.top = `${Math.max(12, rect.bottom + menuRect.height + 8 > window.innerHeight ? rect.top - menuRect.height - 6 : rect.bottom + 6)}px`;
    $('pwPortMenu').querySelector('[role="menuitem"]')?.focus();
  }

  function selectPort(port, action = '') {
    if (!port) return;
    closeMenu();
    selectedPort = port;
    activeAction = action;
    $('pwInspector').hidden = false;
    $('pwInspector').dataset.status = port.status || 'unknown';
    $('pwLayout').classList.add('has-inspector');
    $('pwSelectedPort').textContent = port.label;
    $('pwSelectedType').textContent = `${port.type} · ${port.role === 'uplink' ? 'UPLINK' : 'SERVICE'}`;
    $('pwSelectedStatus').textContent = statusLabel(port.status);
    $('pwActionSelect').innerHTML = `<option value=""${action ? '' : ' selected'}>Chọn công cụ…</option>` + commonActions.map(item => `<option value="${item.id}"${item.id === action ? ' selected' : ''}>${escape(item.label)}</option>`).join('');
    renderHardware();
    renderInspector();
  }

  function closeInspector() {
    selectedPort = null;
    activeAction = '';
    $('pwInspector').hidden = true;
    $('pwLayout').classList.remove('has-inspector');
    renderHardware();
  }

  function renderInspector() {
    if (!selectedPort) return;
    const action = commonActions.find(item => item.id === activeAction);
    const moduleName = selectedPort.modulePresent ? selectedPort.moduleType : 'Không có module';
    const portFacts = detailList([
      ['Interface đầy đủ', selectedPort.cliName],
      ['Vị trí', `Member ${selectedPort.member} · Slot ${selectedPort.slot} · Port ${selectedPort.port}`],
      ['Media / Tốc độ', `${selectedPort.media} · ${selectedPort.speedGbps} Gbps`],
      ['Module', moduleName],
      ['Hãng module', selectedPort.vendor],
      ['Serial module', selectedPort.serial],
      ['Rx / Tx (dBm)', selectedPort.modulePresent ? `${selectedPort.rx} / ${selectedPort.tx}` : null]
    ]);
    let actionBody = `<div class="pw-tool-placeholder"><svg viewBox="0 0 96 72" aria-hidden="true"><rect x="18" y="14" width="60" height="44" rx="10"></rect><path d="M30 29h36M30 43h24"></path><circle cx="67" cy="43" r="8"></circle><path d="m73 49 8 8"></path></svg><b>Chọn công cụ để bắt đầu</b><p>Kiểm tra trạng thái hoặc thực hiện thao tác phù hợp trên port đang chọn.</p></div>`;
    if (activeAction === 'crc') actionBody = detailList([['CRC errors', selectedPort.crc], ['Input errors', selectedPort.inputErrors], ['Output errors', selectedPort.outputErrors]]) + `<button class="pw-button primary" data-read-port type="button">Kiểm tra CRC</button>`;
    if (activeAction === 'lacp') actionBody = detailList([['Eth-Trunk', selectedPort.ethTrunk], ['Member state', selectedPort.lacpState]]) + `<button class="pw-button primary" data-read-port type="button">Kiểm tra LACP</button>`;
    if (activeAction === 'speed') actionBody = `<label class="pw-speed-field"><span>Tốc độ cấu hình</span><select><option>${selectedPort.speedGbps} Gbps</option></select></label><button class="pw-button primary" disabled type="button">Áp dụng</button>`;
    $('pwPortInfo').innerHTML = `<div class="pw-port-info-heading"><b>Thông tin port</b></div>${portFacts}`;
    $('pwActionTitle').textContent = action ? action.label : 'Công cụ dành cho port';
    $('pwActionDescription').textContent = action ? action.description : 'Chọn một công cụ trong danh sách để xem nội dung chi tiết.';
    $('pwInspectorContent').innerHTML = actionBody;
  }

  function renderDeviceInfo() {
    const notes = layout.notes.map(note => `<li>${escape(note)}</li>`).join('');
    $('pwInfo').innerHTML = `<div class="pw-info-heading"><div><small>MODEL PROFILE</small><h2>${escape(layout.modelDev)} · Huawei ${escape(layout.manufacturerModel)}</h2></div><span class="pw-confidence">${escape(confidenceLabel(layout.confidence))}</span></div><div class="pw-info-grid"><div><small>typeDev</small><b>${escape(layout.typeDev)}</b></div><div><small>Thiết bị logic</small><b>${layout.members} ${layout.stack ? 'member' : 'chassis'}</b></div><div><small>Interface sinh ra</small><b>${layout.interfaces.length}</b></div></div><section class="pw-aliases"><b>typeDevEX</b><div>${layout.typeDevEX.map(alias => `<span>${escape(alias)}</span>`).join('')}</div></section><ul class="pw-model-notes">${notes}</ul><div class="pw-api-example"><b>Cách lấy data</b><code>HuaweiDeviceLayouts.get('${escape(layout.modelDev)}', { inventory })</code></div>`;
    $('pwDeviceTools').innerHTML = commonActions.map(action => `<button class="pw-button" type="button" data-device-action="${action.id}">${escape(action.label)}</button>`).join('');
  }

  function setModel(value) {
    const baseLayout = api.get(value);
    if (!baseLayout) return;
    const next = api.get(value, {inventory: demoInventory(baseLayout)});
    modelDev = value;
    layout = next;
    selectedPort = null;
    closeMenu();
    $('pwInspector').hidden = true;
    $('pwLayout').classList.remove('has-inspector');
    $('pwDeviceName').textContent = `Huawei ${layout.manufacturerModel}`;
    $('pwDeviceMeta').textContent = `${layout.modelDev} · ${layout.stack ? `${layout.members} member` : layout.chassis ? 'Modular chassis' : 'Fixed switch'} · ${layout.interfaces.length} interface`;
    $('pwPortType').textContent = layout.chassis ? 'Chassis / LPU' : layout.stack ? 'Stack' : 'Fixed';
    $('pwModelHint').textContent = layout.typeDevEX[0];
    renderHardware();
    renderDataPreview();
    renderDeviceInfo();
  }

  function setView(view, focus = false) {
    currentView = view;
    ['info', 'inventory', 'ports', 'tools'].forEach(name => {
      const tab = $(`pwTab${name[0].toUpperCase()}${name.slice(1)}`);
      const panel = $(`pw${name[0].toUpperCase()}${name.slice(1)}`);
      const active = name === view;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panel.hidden = !active;
    });
    if (focus) $(`pwTab${view[0].toUpperCase()}${view.slice(1)}`).focus();
  }

  function handlePortClick(event) {
    const menu = event.target.closest('[data-port-menu]');
    if (menu) {
      const port = ports().find(item => item.id === menu.dataset.portMenu);
      if (menuPort?.id === port.id && !$('pwPortMenu').hidden) closeMenu(true); else openMenu(port, menu);
      return;
    }
    const button = event.target.closest('[data-select-port]');
    if (button) {
      const port = ports().find(item => item.id === button.dataset.selectPort);
      if (selectedPort?.id === port?.id) closeInspector(); else selectPort(port);
    }
  }

  $('pwHardware').addEventListener('click', handlePortClick);
  $('pwModelSelect').addEventListener('change', event => setModel(event.target.value));
  $('pwPortMenu').addEventListener('click', event => {
    const button = event.target.closest('[data-port-action]');
    if (button && menuPort) selectPort(menuPort, button.dataset.portAction);
  });
  $('pwActionSelect').addEventListener('change', event => { activeAction = event.target.value; renderInspector(); });
  $('pwInspectorContent').addEventListener('click', event => { if (event.target.closest('[data-read-port]')) toast('Mockup chưa kết nối API telemetry. Hãy merge response vào interfaces[].'); });
  $('pwRefresh').addEventListener('click', () => { setModel(modelDev); toast('Đã đặt lại layout theo modelDev.'); });
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
  $('pwDeviceTools').addEventListener('click', event => {
    const button = event.target.closest('[data-device-action]');
    if (!button) return;
    const action = button.dataset.deviceAction;
    if (!ports().length) { toast('Model chassis cần inventory card trước khi chọn interface.'); return; }
    $('pwDeviceTools').innerHTML = `<div class="pw-port-picker"><label for="pwToolPort">Interface · ${escape(commonActions.find(item => item.id === action).label)}</label><select id="pwToolPort">${ports().map(port => `<option value="${escape(port.id)}">${escape(port.cliName)}</option>`).join('')}</select><button class="pw-button primary" type="button" data-open-tool="${action}">Mở công cụ →</button></div>`;
  });
  $('pwDeviceTools').addEventListener('click', event => {
    const button = event.target.closest('[data-open-tool]');
    if (!button) return;
    const port = ports().find(item => item.id === $('pwToolPort').value);
    setView('ports');
    selectPort(port, button.dataset.openTool);
    renderDeviceInfo();
  });
  $('pwTheme').addEventListener('click', () => { document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; closeMenu(); });
  document.addEventListener('click', event => { if (!event.target.closest('#pwPortMenu') && !event.target.closest('[data-port-menu]')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(true); });
  window.addEventListener('resize', closeMenu);
  window.addEventListener('scroll', closeMenu, true);

  initModelPicker();
  setModel(modelDev);
})();
