(() => {
  const DATA = window.NETAUTO_DATA;
  const dropPointResponse = window.NETAUTO_DROP_POINT_RESPONSE;
  const escapeHtml = value => String(value ?? '—').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const detailArticle = (label, value) => `<article><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></article>`;
  const formatOnuTemperature = value => {
    if (value == null || String(value).trim() === '') return '—';
    const temperature = Number(value);
    return Number.isFinite(temperature) ? `${Math.round(temperature)} °C` : '—';
  };
  function renderSourceTags(customer) {
    const sources = [...new Set(customer.selected_candidate?.sources ?? customer.sources ?? (customer.candidates || []).flatMap(candidate => candidate.sources || []))];
    const knownSources = {isc_portnet:['ISC','isc'],csoc_contract:['CONTRACT','contract'],csoc_radius:['RADIUS','radius']};
    const orderedSources = ['isc_portnet','csoc_contract','csoc_radius'].filter(source => sources.includes(source));
    orderedSources.push(...sources.filter(source => !knownSources[source]));
    return orderedSources.length ? `<div class="na-source-tags">${orderedSources.map(source => {
      const [label, tone] = knownSources[source] || [source,'other'];
      return `<span class="na-source-tag is-${tone}" title="${escapeHtml(source)}">${escapeHtml(label)}</span>`;
    }).join('')}</div>` : '<span class="na-source-empty">—</span>';
  }
  function renderDropPointResponse() {
    const {result, message} = dropPointResponse;
    document.getElementById('dropPointStats').innerHTML = [
      ['Tổng khách hàng',result.count.total,''],
      ['Xác nhận thành công',result.count.success,'is-success'],
      ['Cần kiểm tra lại',result.count.failed,'is-danger'],
      ['Thời gian xử lý (ms)',result.duration_ms,'is-speed']
    ].map(([label,value,className]) => `<article class="${className}"><span>${label}</span><strong>${escapeHtml(value)}</strong></article>`).join('');
    document.getElementById('dropPointResponseMessage').textContent = message.replace('có công suất ONU hợp lệ.', 'có công suất ONU.');
    document.getElementById('dropPointCustomerRows').innerHTML = result.customers.map(customer => {
      const candidate = customer.selected_candidate || {};
      return `<tr>
        <td class="na-contract-cell"><b>${escapeHtml(customer.contract)}</b><small>Port ${escapeHtml(customer.drop_point_port)}</small><small class="na-bcc-value">${escapeHtml(customer.bcc1)}</small></td>
        <td><span class="na-state-dot ${customer.status ? 'success' : 'warning'}">${escapeHtml(customer.contract_status)}</span></td>
        <td class="na-olt-cell"><b>${escapeHtml(candidate.olt_name)}</b><small>${escapeHtml(candidate.model)} · ${escapeHtml(candidate.port_name)}</small><code>${escapeHtml(customer.onu_index)}</code></td>
        <td class="na-identifier-value">${escapeHtml(customer.ipwan)}</td>
        <td class="na-onu-identity"><b>${escapeHtml(customer.onu?.onu_model)}</b><span class="na-identity-line"><span>SN</span><span>${escapeHtml(customer.onu_sn)}</span></span><span class="na-identity-line"><span>MAC</span><span>${escapeHtml(customer.onu_mac)}</span></span><span class="na-onu-temperature"><span>Nhiệt độ</span><span>${escapeHtml(formatOnuTemperature(customer.onu?.onu_temp))}</span></span></td>
        <td class="na-numeric"><span class="na-optical-values"><b>${escapeHtml(customer.onu?.onu_rx)}</b><span>/</span><span>${escapeHtml(customer.onu?.onu_tx)}</span></span></td>
        <td class="na-numeric">${escapeHtml(customer.onu?.onu_olt_distance)}</td>
        <td class="na-source-cell">${renderSourceTags(customer)}</td>
      </tr>`;
    }).join('');
    document.getElementById('dropPointResultCount').textContent = `Hiển thị ${result.customers.length} / ${result.count.total} khách hàng`;
    const warnings = result.customers.filter(customer => !customer.status || customer.selected_candidate?.resolution_error);
    const warningPanel = document.getElementById('dropPointWarnings');
    warningPanel.hidden = !warnings.length;
    warningPanel.innerHTML = warnings.map(customer => `<span aria-hidden="true">⚠</span><div><b>${escapeHtml(customer.contract)}</b><p>${escapeHtml(customer.selected_candidate?.resolution_error || customer.message)}</p></div>`).join('');
  }
  const root = document.documentElement;
  const portal = document.getElementById('portalWindow');
  const toast = document.getElementById('toast');
  let selectedArea = 'all';
  let selectedProvince = 'all';
  let activePop = null;
  let activeWorkflow = 'olt';

  const formatNumber = value => new Intl.NumberFormat('vi-VN').format(value);
  const showToast = message => {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  };

  function renderProvinceButtons() {
    const render = (area, target) => {
      document.getElementById(target).innerHTML = DATA.provinces[area].map(code => `<button type="button" data-province="${code}" data-area="${area}">${code}</button>`).join('');
    };
    render('MB', 'northProvinces');
    render('MN', 'southProvinces');
  }

  const popTotal = pop => Object.values(pop.counts).reduce((sum, value) => sum + value, 0);
  const searchablePopText = pop => [pop.code,pop.area,pop.province,pop.branch,pop.zone,...pop.devices.flatMap(d => [d.name,d.ip,d.model,d.vendor,d.function])].join(' ').toLowerCase();

  function filteredPops() {
    const query = document.getElementById('popSearch').value.trim().toLowerCase();
    return DATA.pops.filter(pop => (selectedArea === 'all' || pop.area === selectedArea) && (selectedProvince === 'all' || pop.province === selectedProvince) && (!query || searchablePopText(pop).includes(query)));
  }

  function popCard(pop) {
    const c = pop.counts;
    return `<button class="na-pop-card" type="button" data-pop="${pop.code}" aria-label="Xem thiết bị tại POP ${pop.code}">
      <span class="na-pop-head"><strong>${pop.code}</strong><span>${popTotal(pop)} thiết bị</span></span>
      <span class="na-pop-meta">${pop.area === 'MN' ? 'Miền Nam' : 'Miền Bắc'} · ${pop.branch} · ${pop.province} · ${pop.zone}</span>
      <span class="na-pop-metrics"><span><span>Switch</span><b>${c.switch}</b></span><span><span>OLT</span><b>${c.olt}</b></span><span><span>Nguồn</span><b>${c.power}</b></span><span><span>PI</span><b>${c.pi}</b></span></span>
      <span class="na-pop-tags">${c.switch ? `<span>SW ${c.switch}</span>` : ''}${c.olt ? `<span class="is-olt">OLT ${c.olt}</span>` : ''}${c.power ? `<span class="is-power">Nguồn ${c.power}</span>` : ''}${c.pi ? `<span class="is-monitor">PI ${c.pi}</span>` : ''}</span>
    </button>`;
  }

  function updateSummary(pops) {
    const isFiltered = selectedArea !== 'all' || selectedProvince !== 'all' || document.getElementById('popSearch').value.trim();
    if (!isFiltered) {
      const s = DATA.productionStats;
      document.getElementById('popTotal').textContent = formatNumber(s.pops);
      document.getElementById('deviceTotal').textContent = formatNumber(s.devices);
      document.getElementById('networkStats').textContent = `${formatNumber(s.switches)} · ${formatNumber(s.olts)}`;
      document.getElementById('powerStats').textContent = `${formatNumber(s.power)} · ${formatNumber(s.ipms)} · ${formatNumber(s.opms)}`;
      return;
    }
    const stats = pops.reduce((out,pop) => {out.devices += popTotal(pop);out.switches += pop.counts.switch;out.olts += pop.counts.olt;out.power += pop.counts.power;out.pi += pop.counts.pi;return out;},{devices:0,switches:0,olts:0,power:0,pi:0});
    document.getElementById('popTotal').textContent = formatNumber(pops.length);
    document.getElementById('deviceTotal').textContent = formatNumber(stats.devices);
    document.getElementById('networkStats').textContent = `${formatNumber(stats.switches)} · ${formatNumber(stats.olts)}`;
    document.getElementById('powerStats').textContent = `${formatNumber(stats.power)} · ${formatNumber(stats.pi)} · 0`;
  }

  function renderPops() {
    const pops = filteredPops();
    document.getElementById('popGrid').innerHTML = pops.map(popCard).join('');
    document.getElementById('popEmpty').hidden = pops.length !== 0;
    document.getElementById('popResultCount').textContent = `Hiển thị ${pops.length} / ${formatNumber(DATA.productionStats.pops)} POP`;
    updateSummary(pops);
  }

  function selectArea(area) {
    selectedArea = selectedArea === area ? 'all' : area;
    selectedProvince = 'all';
    document.querySelectorAll('.na-region-name').forEach(button => button.classList.toggle('is-selected', button.dataset.area === selectedArea));
    document.querySelectorAll('[data-province]').forEach(button => button.classList.remove('is-selected'));
    renderPops();
  }

  function selectProvince(button) {
    const province = button.dataset.province;
    selectedProvince = selectedProvince === province ? 'all' : province;
    selectedArea = selectedProvince === 'all' ? 'all' : button.dataset.area;
    document.querySelectorAll('.na-region-name').forEach(item => item.classList.toggle('is-selected', item.dataset.area === selectedArea));
    document.querySelectorAll('[data-province]').forEach(item => item.classList.toggle('is-selected', item.dataset.province === selectedProvince));
    renderPops();
  }

  function deviceCard(device) {
    const kind = device.type === 'OLT' ? 'olt' : device.type === 'POWER' ? 'power' : '';
    return `<article class="na-device-card" data-device-search="${[device.name,device.ip,device.model,device.vendor].join(' ').toLowerCase()}"><div><strong>${device.name}</strong><span class="na-device-kind ${kind}">${device.type}</span></div><div class="na-device-details"><div><span>Management IP</span><b>${device.ip}</b></div><div><span>Model / Vendor</span><b>${device.model} · ${device.vendor}</b></div><div><span>Function</span><b>${device.function}</b></div></div></article>`;
  }

  function openPopDrawer(popCode) {
    activePop = DATA.pops.find(pop => pop.code === popCode);
    if (!activePop) return;
    const c = activePop.counts;
    document.getElementById('drawerPopName').textContent = activePop.code;
    document.getElementById('drawerPopMeta').textContent = `${activePop.area === 'MN' ? 'Miền Nam' : 'Miền Bắc'} · ${activePop.branch} · ${activePop.province} · ${activePop.zone}`;
    document.getElementById('drawerStats').innerHTML = [['Switch',c.switch],['OLT',c.olt],['Nguồn',c.power],['PI',c.pi]].map(x => `<div class="na-drawer-stat"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
    document.getElementById('deviceSearch').value = '';
    renderDevices();
    const backdrop = document.getElementById('popDrawerBackdrop');
    backdrop.hidden = false;
    requestAnimationFrame(() => backdrop.classList.add('is-open'));
  }

  function closePopDrawer() {
    const backdrop = document.getElementById('popDrawerBackdrop');
    backdrop.classList.remove('is-open');
    backdrop.hidden = true;
  }

  function renderDevices() {
    if (!activePop) return;
    const query = document.getElementById('deviceSearch').value.trim().toLowerCase();
    const devices = activePop.devices.filter(device => [device.name,device.ip,device.model,device.vendor].join(' ').toLowerCase().includes(query));
    document.getElementById('deviceList').innerHTML = `<div class="na-data-source">Dữ liệu thiết bị từ <b>data_devices_pop.json</b> · snapshot 28/08/2026 · ${devices.length}/${activePop.devices.length} bản ghi</div>${devices.map(deviceCard).join('') || '<div class="na-empty"><b>Không tìm thấy thiết bị</b><span>Thử hostname, IP hoặc model khác.</span></div>'}`;
  }

  function navigateModule(module) {
    document.querySelectorAll('.na-nav-item').forEach(button => button.classList.toggle('is-active', button.dataset.module === module));
    document.querySelectorAll('.na-page').forEach(page => page.hidden = page.dataset.page !== module);
    history.replaceState(null, '', `#${module}`);
    document.querySelector('.na-content').scrollTo({top:0,behavior:'smooth'});
  }

  function openInfoTab(tab) {
    document.querySelectorAll('#infoTabs button').forEach(button => button.classList.toggle('is-active', button.dataset.infoTab === tab));
    document.querySelectorAll('[data-info-view]').forEach(view => view.hidden = view.dataset.infoView !== tab);
  }

  const normalizeDropPoint = value => value.trim().toUpperCase().replace(/\s+/g, '');

  function updateDropPointSuggestions() {
    const input = document.getElementById('dropPointInput');
    const normalized = normalizeDropPoint(input.value);
    const isCompleteBase = /^[A-Z0-9]+\.\d{4}$/.test(normalized);
    document.getElementById('dropPointShell').classList.toggle('has-value', Boolean(normalized));
    document.getElementById('clearDropPoint').hidden = !normalized;
    document.getElementById('dropPointSuggestions').hidden = !isCompleteBase;
    if (isCompleteBase) document.getElementById('dropPointBase').textContent = normalized;
  }

  function resetDropPoint() {
    const input = document.getElementById('dropPointInput');
    input.value = '';
    document.getElementById('dropPointResults').hidden = true;
    document.getElementById('dropPointSummary').hidden = true;
    document.getElementById('dropPointPending').hidden = false;
    document.getElementById('dropPointEmpty').hidden = false;
    updateDropPointSuggestions();
    input.focus();
  }

  function runDropPointCheck() {
    const input = document.getElementById('dropPointInput');
    const value = normalizeDropPoint(input.value);
    if (!/^[A-Z0-9]+\.\d{4}\/(HO|HW|HU|HF)$/.test(value)) {
      updateDropPointSuggestions();
      showToast(/^[A-Z0-9]+\.\d{4}$/.test(value) ? 'Chọn một hậu tố thiết bị để tiếp tục.' : 'Mã tập điểm chưa đúng định dạng. Ví dụ: TQGP008.0045/HO');
      input.focus();
      return;
    }
    if (value !== dropPointResponse.result.drop_point) {
      document.getElementById('dropPointResults').hidden = true;
      document.getElementById('dropPointSummary').hidden = true;
      document.getElementById('dropPointPending').hidden = false;
      document.getElementById('dropPointEmpty').hidden = false;
      showToast('Mockup hiện chỉ hiển thị response thật đã cung cấp cho TQGP008.0045/HO.');
      input.focus();
      return;
    }
    input.value = value;
    const button = document.getElementById('checkDropPoint');
    const original = button.innerHTML;
    button.disabled = true;
    button.innerHTML = 'Đang đối soát…';
    document.getElementById('dropPointSuggestions').hidden = true;
    setTimeout(() => {
      renderDropPointResponse();
      document.getElementById('dropPointResultName').textContent = value;
      document.getElementById('dropPointEmpty').hidden = true;
      document.getElementById('dropPointPending').hidden = true;
      document.getElementById('dropPointSummary').hidden = false;
      document.getElementById('dropPointResults').hidden = false;
      button.disabled = false;
      button.innerHTML = original;
      document.getElementById('dropPointResults').scrollIntoView({behavior:'smooth',block:'start'});
    }, 420);
  }

  function detectCustomerIdentifier(value) {
    const raw = value.trim();
    if (/^[A-Z]{2}[0-9A-Z]{7}$/i.test(raw)) return 'Hợp đồng';
    if (/^[A-Z]{4}[0-9A-F]{8}$/i.test(raw)) return 'Serial ONU';
    if (/^([0-9A-F]{2}[:-]){5}[0-9A-F]{2}$/i.test(raw) || /^([0-9A-F]{4}\.){2}[0-9A-F]{4}$/i.test(raw)) return 'Địa chỉ MAC';
    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(raw) && raw.split('.').every(x => Number(x) <= 255)) return 'IP WAN';
    if (/^\d{1,2}\/\d{1,2}\/\d{1,3}$/.test(raw) || /^\d{1,2}\/\d{1,2}(?:\/\d{1,2})?[:-]\d{1,3}$/.test(raw)) return 'ONU index';
    return raw ? 'Chưa nhận diện' : 'Tự nhận diện';
  }

  function updateCustomerIdentifier() {
    const value = document.getElementById('customerLookupInput').value;
    const type = detectCustomerIdentifier(value);
    const badge = document.getElementById('identifierType');
    badge.textContent = type;
    badge.classList.toggle('is-detected', !['Tự nhận diện','Chưa nhận diện'].includes(type));
  }

  function runCustomerLookup() {
    const input = document.getElementById('customerLookupInput');
    const type = detectCustomerIdentifier(input.value);
    if (['Tự nhận diện','Chưa nhận diện'].includes(type)) {
      showToast('Định danh chưa được hỗ trợ hoặc chưa đúng định dạng.');
      input.focus();
      return;
    }
    const normalized = input.value.trim().toUpperCase();
    const customer = dropPointResponse.result.customers.find(row =>
      [row.contract,row.onu_sn,row.onu_mac,row.ipwan,row.onu_index].some(identifier => String(identifier).toUpperCase() === normalized));
    if (!customer) {
      document.getElementById('customerResult').hidden = true;
      document.getElementById('customerEmpty').hidden = false;
      showToast('Chưa có response thật cho định danh này trong mockup.');
      input.focus();
      return;
    }
    const candidate = customer.selected_candidate || {};
    document.getElementById('customerResult').innerHTML = `
      <header><div class="na-profile-name"><span>KH</span><div><small>HỢP ĐỒNG</small><h2>${escapeHtml(customer.contract)}</h2><p>Được đối chiếu qua ${escapeHtml(type.toLowerCase())} ${escapeHtml(input.value.trim())}</p></div></div><span class="na-state-dot success">${escapeHtml(customer.contract_status)}</span></header>
      <div class="na-profile-grid">${[['Hợp đồng',customer.contract],['IP WAN',customer.ipwan],['MAC',customer.onu_mac],['Serial ONU',customer.onu_sn],['ONU model',customer.onu?.onu_model],['Nhiệt độ ONU',formatOnuTemperature(customer.onu?.onu_temp)],['OLT - ONU (m)',customer.onu?.onu_olt_distance],['OLT IP',candidate.olt_ip]].map(([label,value])=>detailArticle(label,value)).join('')}</div>
      <div class="na-access-path"><div><small>TẬP ĐIỂM</small><b>${escapeHtml(dropPointResponse.result.drop_point)}</b></div><i>→</i><div><small>OLT</small><b>${escapeHtml(candidate.olt_name)}</b></div><i>→</i><div><small>OLT-PORT / ONU</small><b>${escapeHtml(candidate.port_name)} · ${escapeHtml(customer.onu_index)}</b></div><i>→</i><div class="is-online"><small>RX / TX (dBm)</small><b>${escapeHtml(customer.onu?.onu_rx)} / ${escapeHtml(customer.onu?.onu_tx)}</b></div></div>`;
    document.getElementById('customerEmpty').hidden = true;
    document.getElementById('customerResult').hidden = false;
    document.getElementById('customerResult').scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  function renderPlans() {
    const query = document.getElementById('planSearch').value.trim().toLowerCase();
    const type = document.getElementById('typeFilter').value;
    const status = document.getElementById('statusFilter').value;
    const plans = DATA.plans.filter(plan => (!query || [plan.name,plan.code,plan.creator,plan.label].join(' ').toLowerCase().includes(query)) && (type === 'all' || plan.type === type) && (status === 'all' || plan.status === status));
    document.getElementById('planTableBody').innerHTML = plans.map((plan,index) => `<tr><td class="na-plan-name"><button type="button" data-plan-type="${plan.type}" data-plan-status="${plan.status}">${plan.name}</button><small>${plan.code}</small></td><td><span class="na-type-pill ${plan.type}">${plan.label}</span></td><td><b>${plan.date}</b><br><small>${plan.time}</small></td><td>${plan.creator}</td><td><span class="na-status-pill ${plan.status}">● ${plan.statusLabel}</span></td><td><button class="na-row-menu" type="button" data-plan-type="${plan.type}" data-plan-status="${plan.status}" aria-label="Mở chi tiết">•••</button></td></tr>`).join('') || '<tr><td colspan="6"><div class="na-empty"><b>Không tìm thấy kế hoạch</b><span>Thử điều chỉnh bộ lọc.</span></div></td></tr>';
    document.getElementById('planCount').textContent = `${plans.length} kế hoạch`;
  }

  const caseFile = (workflow, state) => {
    if (workflow === 'stack') return 'switch_stack_join/mockup.html';
    const prefixes = {success:'07_config_thanh_cong.html',failed:'06_config_khong_thanh_cong.html',precheck:'05_precheck_thanh_cong.html',allocated:'02_cap_phat_thanh_cong.html',created:'01_tao_ke_hoach_thanh_cong.html'};
    return `${DATA.workflows[workflow].base}/${prefixes[state] || prefixes.success}`;
  };

  function openBusinessPage(key, state='success') {
    document.querySelectorAll('#businessSubnav button').forEach(button => button.classList.toggle('is-active', button.dataset.businessPage === key));
    const plans = key === 'plans';
    document.getElementById('planListView').hidden = !plans;
    document.getElementById('workflowView').hidden = plans;
    document.querySelector('.na-content').scrollTo({top:0,behavior:'auto'});
    if (plans) return;
    activeWorkflow = key;
    const workflow = DATA.workflows[key];
    document.getElementById('workflowMark').textContent = workflow.mark;
    document.getElementById('workflowKicker').textContent = workflow.kicker;
    document.getElementById('workflowTitle').textContent = workflow.title;
    document.getElementById('workflowDescription').textContent = workflow.description;
    const select = document.getElementById('workflowCase');
    select.disabled = key === 'stack';
    select.value = key === 'stack' ? 'success' : state;
    loadWorkflowFrame();
  }

  function loadWorkflowFrame() {
    const loader = document.getElementById('frameLoader');
    const frame = document.getElementById('workflowFrame');
    loader.hidden = false;
    frame.src = caseFile(activeWorkflow, document.getElementById('workflowCase').value);
  }

  function openPlanDetail(type,status) {
    const state = status === 'failed' ? 'failed' : status === 'allocated' ? 'allocated' : status === 'new' ? 'created' : 'success';
    openBusinessPage(type,state);
  }

  const commandItems = () => [
    {icon:'⬡',title:'Quản lý POP và Thiết bị',meta:'Mở trang POP',action:()=>navigateModule('pop')},
    {icon:'⌖',title:'Thông tin Tập điểm & Khách hàng',meta:'Kiểm tra tập điểm và tra cứu thuê bao',action:()=>navigateModule('customer')},
    {icon:'⌖',title:'Kiểm tra tập điểm',meta:'Mở tool check-drop-point',action:()=>{navigateModule('customer');openInfoTab('drop-point')}},
    {icon:'♙',title:'Tra cứu khách hàng',meta:'Hợp đồng, serial, MAC, IP WAN hoặc ONU index',action:()=>{navigateModule('customer');openInfoTab('customer')}},
    {icon:'▣',title:'Quản lý Nghiệp vụ',meta:'Mở danh sách kế hoạch',action:()=>{navigateModule('business');openBusinessPage('plans')}},
    ...Object.entries(DATA.workflows).map(([key,w]) => ({icon:w.mark,title:w.title,meta:'Trang nghiệp vụ',action:()=>{navigateModule('business');openBusinessPage(key)}})),
    ...DATA.pops.map(pop => ({icon:'⬡',title:pop.code,meta:`${pop.branch} · ${pop.province} · ${pop.zone}`,action:()=>{navigateModule('pop');openPopDrawer(pop.code)}}))
  ];

  function renderCommands() {
    const query = document.getElementById('commandInput').value.trim().toLowerCase();
    const items = commandItems().filter(item => `${item.title} ${item.meta}`.toLowerCase().includes(query)).slice(0,12);
    const container = document.getElementById('commandResults');
    container.className = 'na-command-results';
    container.innerHTML = items.map((item,index) => `<button class="na-command-result" type="button" data-command-index="${index}"><span>${item.icon}</span><span><b>${item.title}</b><small>${item.meta}</small></span></button>`).join('') || '<div class="na-empty"><b>Không tìm thấy</b><span>Thử mã POP hoặc tên nghiệp vụ khác.</span></div>';
    container._items = items;
  }

  function openCommand() { document.getElementById('commandPalette').classList.add('is-open'); document.getElementById('commandInput').value=''; renderCommands(); setTimeout(()=>document.getElementById('commandInput').focus(),40); }
  function closeCommand() { document.getElementById('commandPalette').classList.remove('is-open'); }

  renderProvinceButtons();
  renderPops();
  renderPlans();

  document.querySelectorAll('.na-region-name').forEach(button => button.addEventListener('click', () => selectArea(button.dataset.area)));
  document.querySelectorAll('[data-province]').forEach(button => button.addEventListener('click', () => selectProvince(button)));
  document.getElementById('popSearch').addEventListener('input', renderPops);
  document.getElementById('popGrid').addEventListener('click', event => { const card = event.target.closest('[data-pop]'); if (card) openPopDrawer(card.dataset.pop); });
  document.getElementById('deviceSearch').addEventListener('input', renderDevices);
  document.getElementById('closePopDrawer').addEventListener('click', closePopDrawer);
  document.getElementById('popDrawerBackdrop').addEventListener('click', event => { if (event.target.id === 'popDrawerBackdrop') closePopDrawer(); });
  document.getElementById('refreshPop').addEventListener('click', () => { selectedArea='all';selectedProvince='all';document.getElementById('popSearch').value='';document.querySelectorAll('.na-region-name,[data-province]').forEach(x=>x.classList.remove('is-selected'));renderPops();showToast('Đã tải lại dữ liệu POP mô phỏng.'); });
  document.getElementById('registerDevice').addEventListener('click', () => showToast('Form Đăng ký thiết bị sẽ được bổ sung theo screenshot production.'));

  document.querySelectorAll('.na-nav-item').forEach(button => button.addEventListener('click', () => navigateModule(button.dataset.module)));
  document.querySelectorAll('#infoTabs button').forEach(button => button.addEventListener('click', () => openInfoTab(button.dataset.infoTab)));
  document.getElementById('dropPointInput').addEventListener('input', event => { event.target.value = event.target.value.toUpperCase(); updateDropPointSuggestions(); });
  document.getElementById('dropPointInput').addEventListener('keydown', event => { if (event.key === 'Enter') runDropPointCheck(); });
  document.getElementById('dropPointSuggestions').addEventListener('click', event => { const button = event.target.closest('[data-suffix]'); if (!button) return; const input = document.getElementById('dropPointInput'); input.value = `${normalizeDropPoint(input.value)}${button.dataset.suffix}`; updateDropPointSuggestions(); input.focus(); });
  document.getElementById('clearDropPoint').addEventListener('click', resetDropPoint);
  document.getElementById('resetDropPoint').addEventListener('click', resetDropPoint);
  document.getElementById('checkDropPoint').addEventListener('click', runDropPointCheck);
  document.getElementById('exportDropPoint').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(dropPointResponse,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'TQGP008.0045-HO-response.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  });
  document.getElementById('customerLookupInput').addEventListener('input', updateCustomerIdentifier);
  document.getElementById('customerLookupInput').addEventListener('keydown', event => { if (event.key === 'Enter') runCustomerLookup(); });
  document.querySelectorAll('[data-customer-sample]').forEach(button => button.addEventListener('click', () => { document.getElementById('customerLookupInput').value = button.dataset.customerSample; updateCustomerIdentifier(); document.getElementById('customerLookupInput').focus(); }));
  document.getElementById('searchCustomer').addEventListener('click', runCustomerLookup);
  document.querySelectorAll('#businessSubnav button').forEach(button => button.addEventListener('click', () => openBusinessPage(button.dataset.businessPage)));
  document.getElementById('expandFilter').addEventListener('click', event => { const filters=document.getElementById('expandedFilters');filters.hidden=!filters.hidden;event.currentTarget.textContent=filters.hidden?'☷ Mở rộng':'☷ Thu gọn'; });
  document.getElementById('planSearch').addEventListener('input', renderPlans);
  document.getElementById('typeFilter').addEventListener('change', renderPlans);
  document.getElementById('statusFilter').addEventListener('change', renderPlans);
  document.getElementById('searchPlans').addEventListener('click', renderPlans);
  document.getElementById('resetPlans').addEventListener('click', () => {document.getElementById('planSearch').value='';document.getElementById('typeFilter').value='all';document.getElementById('statusFilter').value='all';renderPlans();});
  document.getElementById('planTableBody').addEventListener('click', event => {const button=event.target.closest('[data-plan-type]');if(button)openPlanDetail(button.dataset.planType,button.dataset.planStatus);});
  document.getElementById('calendarHint').addEventListener('click', () => showToast('Dạng Lịch sẽ được gắn lại ở vòng cập nhật tiếp theo.'));
  document.getElementById('createPlanButton').addEventListener('click', () => showToast('Chọn loại nghiệp vụ ở thanh subpage để tạo kế hoạch.'));
  document.getElementById('workflowCase').addEventListener('change', loadWorkflowFrame);
  document.getElementById('workflowFrame').addEventListener('load', () => document.getElementById('frameLoader').hidden = true);
  document.getElementById('openWorkflowTab').addEventListener('click', () => window.open(caseFile(activeWorkflow,document.getElementById('workflowCase').value),'_blank'));

  document.getElementById('sidebarToggle').addEventListener('click', () => portal.classList.toggle('is-sidebar-collapsed'));
  document.getElementById('fullscreenButton').addEventListener('click', event => {portal.classList.toggle('is-fullscreen');event.currentTarget.querySelector('span').textContent=portal.classList.contains('is-fullscreen')?'Thoát Fullscreen':'Mở Fullscreen';});
  const savedTheme = localStorage.getItem('netauto-ui-theme'); if (savedTheme) root.dataset.theme=savedTheme;
  document.getElementById('themeButton').addEventListener('click',()=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';localStorage.setItem('netauto-ui-theme',root.dataset.theme);});

  document.getElementById('commandButton').addEventListener('click', openCommand);
  document.getElementById('commandInput').addEventListener('input', renderCommands);
  document.getElementById('commandResults').addEventListener('click', event => {const button=event.target.closest('[data-command-index]');if(!button)return;const item=event.currentTarget._items[Number(button.dataset.commandIndex)];closeCommand();item.action();});
  document.getElementById('commandPalette').addEventListener('click', event => {if(event.target.id==='commandPalette')closeCommand();});
  document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openCommand();}if(event.key==='/'&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)){event.preventDefault();openCommand();}if(event.key==='Escape'){closeCommand();closePopDrawer();}});

  const initialModule = location.hash.replace('#','');
  if (['pop','customer','business'].includes(initialModule)) navigateModule(initialModule);
})();
