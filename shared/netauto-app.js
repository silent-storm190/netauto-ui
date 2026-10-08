(() => {
  const DATA = window.NETAUTO_DATA;
  const contentViewport=document.getElementById('portalContent');
  const floatingBack=document.getElementById('detailFloatingBack');
  function syncFloatingBack() {
    const target=!document.getElementById('deviceDetailPage').hidden?'backToPopDetail':!document.getElementById('popDetailPage').hidden?'backToPopList':null;
    if(!target){floatingBack.hidden=true;delete floatingBack.dataset.backTarget;return;}
    const bounds=contentViewport.getBoundingClientRect();
    const viewportHeight=window.innerHeight || document.documentElement.clientHeight || bounds.bottom;
    const top=Math.max(0,bounds.top),bottom=Math.min(viewportHeight,bounds.bottom);
    const button=document.getElementById(target).getBoundingClientRect();
    floatingBack.hidden=bottom<=top || button.bottom>top+8;
    floatingBack.dataset.backTarget=target;
    floatingBack.textContent=target==='backToPopDetail'?'← Quay lại POP':'← Danh sách POP';
    floatingBack.setAttribute('aria-label',target==='backToPopDetail'?'Quay lại POP':'Quay lại danh sách POP');
    floatingBack.style.left=`${Math.max(12,bounds.left+18)}px`;
    floatingBack.style.top=`${top+12}px`;
    floatingBack.style.bottom='auto';
  }
  let floatingBackFrame=0;
  function scheduleFloatingBack(){if(floatingBackFrame)return;floatingBackFrame=requestAnimationFrame(()=>{floatingBackFrame=0;syncFloatingBack();});}
  contentViewport.addEventListener('scroll',scheduleFloatingBack,{passive:true});
  window.addEventListener('scroll',scheduleFloatingBack,{passive:true});
  window.addEventListener('resize',scheduleFloatingBack);
  if(typeof window.ResizeObserver==='function')new ResizeObserver(scheduleFloatingBack).observe(contentViewport);
  floatingBack.addEventListener('click',()=>{
    const target=floatingBack.dataset.backTarget;
    if(!target||floatingBack.hidden)return;
    document.getElementById(target).click();
    const focusTarget=!document.getElementById('popDetailPage').hidden?'backToPopList':'popSearch';
    document.getElementById(focusTarget).focus({preventScroll:true});
  });
  const dropPointResponse = window.NETAUTO_DROP_POINT_RESPONSE;
  const escapeHtml = value => String(value == null || value === '' ? '—' : value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
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
  function renderDropPointResponse(response = dropPointResponse) {
    const {result, message} = response;
    document.getElementById('dropPointStats').innerHTML = [
      ['Tổng khách hàng',result.count.total,''],
      ['Xác nhận thành công',result.count.success,'is-success'],
      ['Cần kiểm tra lại',result.count.failed,'is-danger'],
      ['Thời gian xử lý (s)',result.duration_ms == null ? '—' : new Intl.NumberFormat('vi-VN', {maximumFractionDigits:3}).format(result.duration_ms / 1000),'is-speed']
    ].map(([label,value,className]) => `<article class="${className}"><span>${label}</span><strong>${escapeHtml(value)}</strong></article>`).join('');
    document.getElementById('dropPointResponseMessage').textContent = message.replace('có công suất ONU hợp lệ.', 'có công suất ONU.');
    document.getElementById('dropPointCustomerRows').innerHTML = result.customers.map(customer => {
      const candidate = customer.selected_candidate || customer.candidates?.[0] || {};
      const temperatureWarning = String(customer.onu?.onu_temp) === '2147483647';
      const txWarning = customer.onu?.onu_tx === 'OFFLINE';
      return `<tr>
        <td class="na-contract-cell"><b>${escapeHtml(customer.contract)}</b><small>Port ${escapeHtml(customer.drop_point_port)}</small><small class="na-bcc-value">${escapeHtml(customer.bcc1)}</small></td>
        <td><span class="na-state-dot ${customer.status ? 'success' : 'warning'}">${escapeHtml(customer.contract_status)}</span></td>
        <td class="na-olt-cell"><b>${escapeHtml(candidate.olt_name)}</b><small>${escapeHtml(candidate.model)} · ${escapeHtml(candidate.port_name)}</small><code>${escapeHtml(customer.onu_index)}</code></td>
        <td class="na-identifier-value">${escapeHtml(customer.ipwan)}</td>
        <td class="na-onu-identity"><b>${escapeHtml(customer.onu?.onu_model)}</b><span class="na-identity-line"><span>SN</span><span>${escapeHtml(customer.onu_sn)}</span></span><span class="na-identity-line"><span>MAC</span><span>${escapeHtml(customer.onu_mac)}</span></span><span class="na-onu-temperature"><span>Nhiệt độ</span><span class="${temperatureWarning ? 'na-value-warning' : ''}">${temperatureWarning ? '⚠ ' : ''}${escapeHtml(formatOnuTemperature(customer.onu?.onu_temp))}</span></span></td>
        <td class="na-numeric">${customer.onu ? `<span class="na-optical-values"><b>${escapeHtml(customer.onu.onu_rx)}</b><span>/</span><span class="${txWarning ? 'na-value-warning' : ''}">${escapeHtml(customer.onu.onu_tx)}</span></span>` : '—'}</td>
        <td class="na-numeric">${escapeHtml(customer.onu?.onu_olt_distance)}</td>
        <td class="na-source-cell">${renderSourceTags(customer)}</td>
      </tr>`;
    }).join('');
    document.getElementById('dropPointResultCount').textContent = `Hiển thị ${result.customers.length} / ${result.count.total} khách hàng`;
    const warnings = result.customers.flatMap(customer => {
      const messages = [];
      if (!customer.status || customer.selected_candidate?.resolution_error) {
        const candidateError = customer.selected_candidate?.resolution_error || (customer.candidates || []).find(candidate => candidate.resolution_error)?.resolution_error;
        messages.push([customer.message,candidateError].filter(Boolean).join(' '));
      }
      if (String(customer.onu?.onu_temp) === '2147483647') messages.push('Nhiệt độ cần kiểm tra: 2147483647 °C.');
      if (customer.onu?.onu_tx === 'OFFLINE') messages.push('Tx được trả về là OFFLINE.');
      return messages.length ? [{contract:customer.contract,message:messages.join(' ')}] : [];
    });
    const warningPanel = document.getElementById('dropPointWarnings');
    warningPanel.hidden = !warnings.length;
    warningPanel.innerHTML = warnings.map(customer => `<div class="na-data-warning-item"><span aria-hidden="true">⚠</span><div><b>${escapeHtml(customer.contract)}</b><p>${escapeHtml(customer.message)}</p></div></div>`).join('');
  }
  const root = document.documentElement;
  const portal = document.getElementById('portalWindow');
  const toast = document.getElementById('toast');
  let selectedArea = 'all';
  let selectedProvinces = [];
  let popScopeMode = 'many';
  let popPageIndex = 0;
  let popVisitActive = false;
  // Mockup scenarios only; these are not authentication or authorization rules.
  const popScopeScenarios = {three:{MB:['QNH'],MN:['AGG','BTHT1']},one:{MN:['AGG']}};
  let activeWorkflow = 'olt';

  const formatNumber = value => new Intl.NumberFormat('vi-VN').format(value);
  const showToast = message => {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  };

  function renderProvinceButtons() {
    const allowed = accessiblePopBranches();
    const single = popScopeMode === 'one';
    const filters = document.getElementById('popRegionFilters');
    filters.hidden = single;
    filters.classList.toggle('is-compact', popScopeMode === 'three');
    document.getElementById('singleBranchScope').hidden = !single;
    document.getElementById('resetPopFilters').hidden = single;
    document.getElementById('popPermissionLabel').textContent = single ? 'Phạm vi của bạn' : popScopeMode === 'three' ? '3 chi nhánh được cấp quyền · 2 miền' : 'Phạm vi chi nhánh được cấp quyền';
    const render = (area, target) => {
      const codes = allowed[area] || [];
      document.getElementById(area === 'MB' ? 'northRegion' : 'southRegion').hidden = !codes.length;
      document.getElementById(area === 'MB' ? 'northBranchCount' : 'southBranchCount').textContent = `${codes.length} chi nhánh`;
      document.getElementById(target).innerHTML = codes.map(code => `<button type="button" data-province="${code}" aria-pressed="${selectedProvinces.includes(code)}" class="${selectedProvinces.includes(code) ? 'is-selected' : ''}">${code}</button>`).join('');
    };
    render('MB', 'northProvinces');
    render('MN', 'southProvinces');
    document.querySelectorAll('#popPage .na-region-name').forEach(button => {
      const selected = button.dataset.area === selectedArea;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    document.querySelectorAll('[data-pop-scope]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.popScope === popScopeMode)));
  }

  function accessiblePopBranches() { return popScopeScenarios[popScopeMode] || DATA.provinces; }

  const popTotal = pop => Object.values(pop.counts).reduce((sum, value) => sum + value, 0);
  const popSearchIndex = new Map(DATA.pops.map(pop=>[pop.code,[pop.code,pop.area,pop.province,pop.branch,pop.zone,...pop.devices.flatMap(d=>[d.name,d.ip,d.model,d.vendor,d.function])].join(' ').toLowerCase()]));
  const searchablePopText = pop => popSearchIndex.get(pop.code);
  const popBranches = pop => pop.branches || [pop.branch];

  function filteredPops() {
    const query = document.getElementById('popSearch').value.trim().toLowerCase();
    const allowed = Object.values(accessiblePopBranches()).flat();
    return DATA.pops.filter(pop => (popScopeMode === 'many' || popBranches(pop).some(branch=>allowed.includes(branch))) && (selectedArea === 'all' || pop.area === selectedArea) && (!selectedProvinces.length || selectedProvinces.some(code => popBranches(pop).includes(code) || pop.province === code)) && (!query || searchablePopText(pop).includes(query)));
  }

  // Mixed results use stable province colors. Single-province results share
  // one accent for this Layer 0 visit, unchanged by search or pagination.
  const popProvinceHues = [8,25,45,155,250,185,320,32,285,215,175,295];
  const popProvinceKey = pop => String(pop.province || pop.branch || '').trim().toUpperCase();
  const provinceHueMap = new Map();
  let singleProvinceHue = null;
  function renewPopVisitColor() {
    let previousHue = singleProvinceHue;
    const storageKey = 'netauto.pop.singleProvinceHue';
    try {
      const saved = localStorage.getItem(storageKey);
      if (previousHue === null && saved != null) previousHue = Number(saved);
    } catch { /* Color selection still works when storage is unavailable. */ }
    const choices = popProvinceHues.filter(hue => hue !== previousHue);
    singleProvinceHue = choices[Math.floor(Math.random() * choices.length)];
    try { localStorage.setItem(storageKey, String(singleProvinceHue)); } catch { /* Optional preference only. */ }
  }
  const normalizeHue = hue => Number(((hue + 360) % 360).toFixed(3));
  for (const province of [...new Set(DATA.pops.map(popProvinceKey))].sort()) {
    let hash = 0;
    for (const character of province) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    let hue = popProvinceHues[hash % popProvinceHues.length];
    // Avoid assigning the exact same hue to two provinces in the snapshot.
    while ([...provinceHueMap.values()].includes(hue)) hue = normalizeHue(hue + 137.508);
    provinceHueMap.set(province, hue);
  }

  function popCard(pop, colorMode) {
    const c = pop.counts;
    const meta = [pop.branch,pop.province !== pop.branch ? pop.province : '',pop.zone].filter(Boolean).join(' · ');
    const hue = colorMode === 'single-province' ? (singleProvinceHue ?? popProvinceHues[0]) : provinceHueMap.get(popProvinceKey(pop));
    return `<button class="na-pop-card" style="--na-pop-hue:${hue}" type="button" data-pop="${escapeHtml(pop.code)}" data-pop-province="${escapeHtml(pop.province)}" aria-label="Xem thiết bị tại POP ${escapeHtml(pop.code)}">
      <span class="na-pop-head"><span class="na-pop-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="7" rx="2"/><rect x="4" y="14" width="16" height="7" rx="2"/><path d="M8 6.5h.01M8 17.5h.01M12 6.5h4M12 17.5h4"/></svg></span><strong>${escapeHtml(pop.code)}</strong></span>
      <span class="na-pop-meta">${escapeHtml(meta)}</span>
      <span class="na-pop-metrics"><span><span>Switch</span><b class="na-pop-blue">${c.switch}</b></span><span><span>OLT</span><b class="na-pop-purple">${c.olt}</b></span><span><span>Nguồn</span><b class="na-pop-orange">${c.power}</b></span><span><span>PI</span><b class="na-pop-green">${c.pi}</b></span></span>
      <span class="na-pop-foot"><b>${popTotal(pop)}</b> thiết bị<span>${pop.area}</span></span>
    </button>`;
  }

  function updateSummary(pops) {
    const isGlobal = popScopeMode === 'many' && selectedArea === 'all' && !selectedProvinces.length && !document.getElementById('popSearch').value.trim();
    const stats = pops.reduce((out,pop) => {out.devices += popTotal(pop);out.switches += pop.counts.switch;out.olts += pop.counts.olt;out.power += pop.counts.power;out.pi += pop.counts.pi;return out;},{devices:0,switches:0,olts:0,power:0,pi:0});
    const s = isGlobal ? DATA.productionStats : {...stats,pops:pops.length};
    const metric = (value,label,tone) => `<span><span class="na-pop-stat-label">${label}</span><strong class="na-pop-${tone}">${formatNumber(value)}</strong></span>`;
    document.getElementById('popTotal').textContent = formatNumber(s.pops);
    document.getElementById('deviceTotal').textContent = formatNumber(s.devices);
    document.getElementById('networkStats').innerHTML = metric(s.switches,'Switch','blue') + metric(s.olts,'OLT','purple');
    document.getElementById('powerStats').innerHTML = metric(s.power,'Nguồn','orange') + (isGlobal ? metric(s.ipms,'IPMS','purple') + metric(s.opms,'OPMS','green') + (s.piOther?metric(s.piOther,'PI khác','cyan'):'') : metric(s.pi,'PI','green'));
    document.getElementById('powerStatsGroup').setAttribute('aria-label',isGlobal?'Nguồn, IPMS, OPMS và PI khác':'Nguồn và PI');
    document.getElementById('popDataNote').textContent = `${DATA.snapshot.source} · toàn bộ ${formatNumber(DATA.pops.length)} POP / ${formatNumber(DATA.snapshot.records)} thiết bị. Thống kê theo toàn bộ kết quả lọc, không chỉ trang đang xem.`;
  }

  function renderPops(resetPage = true) {
    if(resetPage)popPageIndex=0;
    const pops = filteredPops();
    const pageSize=Number(document.getElementById('popPageSize').value)||36;
    const pages=Math.max(1,Math.ceil(pops.length/pageSize));
    popPageIndex=Math.min(popPageIndex,pages-1);
    const start=popPageIndex*pageSize;
    const shown=pops.slice(start,start+pageSize);
    const colorMode = new Set(pops.map(popProvinceKey)).size === 1 ? 'single-province' : 'province';
    const grid = document.getElementById('popGrid');
    grid.setAttribute('data-color-mode', colorMode);
    grid.innerHTML = shown.map(pop => popCard(pop, colorMode)).join('');
    document.getElementById('popEmpty').hidden = pops.length !== 0;
    document.getElementById('popResultCount').textContent = `${formatNumber(pops.length)} POP trong dữ liệu`;
    document.getElementById('popPageCount').textContent = pops.length?`${start+1}–${start+shown.length} / ${formatNumber(pops.length)} POP · Trang ${popPageIndex+1}/${pages}`:'0 POP';
    document.getElementById('popPrevPage').disabled = popPageIndex===0;
    document.getElementById('popNextPage').disabled = popPageIndex===pages-1;
    document.getElementById('popSelectionLabel').textContent = popScopeMode === 'one' ? 'Chi nhánh AGG' : selectedProvinces.length ? selectedProvinces.join(' · ') : selectedArea !== 'all' ? `${selectedArea === 'MB' ? 'Miền Bắc' : 'Miền Nam'} · Trong phạm vi quản lý` : popScopeMode === 'three' ? 'QNH · AGG · BTHT1' : 'Tất cả chi nhánh';
    updateSummary(pops);
  }

  function selectArea(area) {
    if (!accessiblePopBranches()[area]) return;
    selectedArea = selectedArea === area ? 'all' : area;
    selectedProvinces = [];
    renderProvinceButtons();
    renderPops();
  }

  function selectProvince(button) {
    const province = button.dataset.province;
    if (!Object.values(accessiblePopBranches()).flat().includes(province)) return;
    selectedProvinces = selectedProvinces.includes(province) ? selectedProvinces.filter(code => code !== province) : [...selectedProvinces,province];
    selectedArea = 'all';
    renderProvinceButtons();
    renderPops();
  }

  function resetPopFilters() {
    selectedArea = 'all';
    selectedProvinces = [];
    document.getElementById('popSearch').value = '';
    renderProvinceButtons();
    renderPops();
  }

  function openPopDetail(popCode, updateRoute = true, preserve = false) {
    const pop = DATA.pops.find(entry => entry.code === popCode);
    if (!pop) return false;
    window.NETAUTO_POP_DETAIL.open(pop,preserve);
    popVisitActive = false;
    document.querySelectorAll('.na-nav-item').forEach(button => button.classList.toggle('is-active', button.dataset.module === 'pop'));
    document.querySelectorAll('.na-page').forEach(page => page.hidden = page.dataset.page !== 'pop-detail');
    if (updateRoute && location.hash !== `#pop/${pop.code}`) history.pushState(null, '', `#pop/${pop.code}`);
    loadPopInventory(pop.code);
    document.querySelector('.na-content').scrollTo({top:0,behavior:'smooth'});
    syncFloatingBack();
    return true;
  }

  function openDeviceDetail(popCode, deviceName, updateRoute = true) {
    const pop = DATA.pops.find(entry=>entry.code===popCode);
    if (!pop) return false;
    const records = window.NETAUTO_POP_DETAIL_DATA.pops[popCode] || pop.devices;
    const device = records.find(entry=>entry.name===deviceName);
    if (!device) return false;
    popVisitActive = false;
    window.NETAUTO_POP_DETAIL.closeTopo();
    window.NETAUTO_DEVICE_DETAIL.open(pop,device);
    document.querySelectorAll('.na-nav-item').forEach(button=>button.classList.toggle('is-active',button.dataset.module==='pop'));
    document.querySelectorAll('.na-page').forEach(page=>page.hidden=page.dataset.page!=='device-detail');
    const route=`#pop/${popCode}/device/${encodeURIComponent(deviceName)}`;
    if (updateRoute && location.hash!==route) history.pushState(null,'',route);
    loadPopInventory(pop.code);
    document.querySelector('.na-content').scrollTo({top:0,behavior:'smooth'});
    syncFloatingBack();
    return true;
  }

  function loadPopInventory(code) {
    const store=window.NETAUTO_POP_DETAIL_DATA;
    store.ensurePop(code,error=>{
      if(error){if(location.hash.startsWith(`#pop/${code}`))showToast('Không tải được inventory. Mở lại POP để thử lại.');}
      window.NETAUTO_POP_DETAIL.refreshInventory(code);
      window.NETAUTO_DEVICE_DETAIL.refreshInventory(code);
    });
  }

  function navigateModule(module, updateRoute = true) {
    window.NETAUTO_POP_DETAIL.closeTopo();
    if (module === 'pop' && !popVisitActive) renewPopVisitColor();
    popVisitActive = module === 'pop';
    if (module === 'pop') renderPops(false);
    document.querySelectorAll('.na-nav-item').forEach(button => button.classList.toggle('is-active', button.dataset.module === module));
    document.querySelectorAll('.na-page').forEach(page => page.hidden = page.dataset.page !== module);
    if (updateRoute) history.replaceState(null, '', `#${module}`);
    document.querySelector('.na-content').scrollTo({top:0,behavior:'smooth'});
    syncFloatingBack();
  }

  window.NETAUTO_POP_DETAIL.setBackHandler(() => navigateModule('pop'));
  window.NETAUTO_POP_DETAIL.setDeviceHandler((pop,device)=>openDeviceDetail(pop.code,device.name));
  window.NETAUTO_DEVICE_DETAIL.setBackHandler(popCode=>openPopDetail(popCode,true,true));

  function restoreRoute() {
    const route = location.hash.slice(1);
    const parts=route.split('/');
    if (parts[0]==='pop' && parts[2]==='device') {
      try {if(openDeviceDetail(parts[1],decodeURIComponent(parts.slice(3).join('/')),false))return;} catch { /* Invalid URL encoding: fall back to the POP page. */ }
      if(openPopDetail(parts[1],false,true))return;
    }
    if (route.startsWith('pop/') && openPopDetail(route.slice(4), false,true)) return;
    navigateModule(['pop','customer','business'].includes(route) ? route : 'pop', false);
  }

  function openInfoTab(tab) {
    document.querySelectorAll('#infoTabs button').forEach(button => button.classList.toggle('is-active', button.dataset.infoTab === tab));
    document.querySelectorAll('[data-info-view]').forEach(view => view.hidden = view.dataset.infoView !== tab);
  }

  const normalizeDropPoint = value => value.trim().toUpperCase().replace(/\s+/g, '');
  const MAX_DROP_POINTS = 20;
  let queuedDropPoints = [];
  let checkedDropPoints = [];
  let selectedDropPoint = null;
  let dropPointCheckTimer = null;
  const checkDropPointLabel = document.getElementById('checkDropPoint').innerHTML;
  const availableDropPointResponses = new Map(
    (window.NETAUTO_DROP_POINT_RESPONSES || [dropPointResponse])
      .filter(response => response?.result?.drop_point)
      .map(response => [normalizeDropPoint(response.result.drop_point),response])
  );

  function updateDropPointSuggestions() {
    const input = document.getElementById('dropPointInput');
    const normalized = normalizeDropPoint(input.value);
    const isCompleteBase = /^[A-Z0-9]+\.\d{4}$/.test(normalized);
    document.getElementById('dropPointShell').classList.toggle('has-value', Boolean(normalized));
    document.getElementById('clearDropPoint').hidden = !normalized;
    document.getElementById('dropPointSuggestions').hidden = !isCompleteBase || queuedDropPoints.length >= MAX_DROP_POINTS;
    if (isCompleteBase) document.getElementById('dropPointBase').textContent = normalized;
  }

  function renderDropPointQueue() {
    const queue = document.getElementById('dropPointQueue');
    queue.hidden = !queuedDropPoints.length;
    queue.innerHTML = queuedDropPoints.map(value => `<span class="na-drop-chip"><span>${escapeHtml(value)}</span><button type="button" data-remove-drop-point="${escapeHtml(value)}" aria-label="Bỏ tập điểm ${escapeHtml(value)}">×</button></span>`).join('');
    document.getElementById('dropPointQueueCount').textContent = `${queuedDropPoints.length} / ${MAX_DROP_POINTS} tập điểm`;
    document.getElementById('addDropPoint').disabled = queuedDropPoints.length >= MAX_DROP_POINTS;
    updateDropPointSuggestions();
  }

  function addDropPoints(raw = document.getElementById('dropPointInput').value) {
    const input = document.getElementById('dropPointInput');
    const values = raw.split(/[,;\r\n]+/).map(normalizeDropPoint).filter(Boolean);
    if (!values.length) {
      showToast('Nhập mã tập điểm và chọn hậu tố để thêm.');
      input.focus();
      return false;
    }
    const invalid = values.find(value => !/^[A-Z0-9]+\.\d{4}\/(HO|HW|HU|HF)$/.test(value));
    if (invalid) {
      showToast(/^[A-Z0-9]+\.\d{4}$/.test(invalid) ? 'Chọn hậu tố /HO, /HW, /HU hoặc /HF cho mã đang nhập.' : `Mã tập điểm chưa đúng định dạng: ${invalid}`);
      updateDropPointSuggestions();
      input.focus();
      return false;
    }
    const newValues = [...new Set(values)].filter(value => !queuedDropPoints.includes(value));
    if (queuedDropPoints.length + newValues.length > MAX_DROP_POINTS) {
      showToast(`Tối đa ${MAX_DROP_POINTS} tập điểm. Hiện còn ${MAX_DROP_POINTS - queuedDropPoints.length} vị trí.`);
      input.focus();
      return false;
    }
    queuedDropPoints.push(...newValues);
    input.value = '';
    renderDropPointQueue();
    if (!newValues.length) showToast('Tập điểm này đã có trong danh sách.');
    input.focus();
    return true;
  }

  function renderDropPointTabs() {
    const tabs = document.getElementById('dropPointTabs');
    tabs.innerHTML = checkedDropPoints.map((value,index) => {
      const response = availableDropPointResponses.get(value);
      const isSelected = selectedDropPoint === value;
      const tone = !response ? 'pending' : response.result.count.failed ? 'warning' : 'success';
      return `<button id="drop-point-tab-${index}" role="tab" type="button" aria-selected="${isSelected}" aria-controls="dropPointResults" tabindex="${isSelected ? 0 : -1}" class="na-drop-result-tab${isSelected ? ' is-active' : ''}" data-result-drop-point="${escapeHtml(value)}"><span class="na-drop-tab-dot is-${tone}" aria-hidden="true"></span><span>${escapeHtml(value)}</span><small>${response ? `${response.result.count.success}/${response.result.count.total}` : 'Chưa có dữ liệu'}</small></button>`;
    }).join('');
    document.getElementById('dropPointTabsRegion').hidden = !checkedDropPoints.length;
    document.getElementById('dropPointBatchCount').textContent = `${checkedDropPoints.length} tập điểm`;
  }

  function selectDropPointResult(value) {
    if (!checkedDropPoints.includes(value)) return;
    selectedDropPoint = value;
    const response = availableDropPointResponses.get(value);
    renderDropPointTabs();
    document.getElementById('dropPointResults').setAttribute('aria-labelledby', `drop-point-tab-${checkedDropPoints.indexOf(value)}`);
    document.getElementById('dropPointEmpty').hidden = true;
    document.getElementById('dropPointResults').hidden = false;
    document.getElementById('dropPointTablePanel').hidden = !response;
    document.getElementById('dropPointUnavailable').hidden = Boolean(response);
    document.getElementById('dropPointSummary').hidden = !response;
    document.getElementById('dropPointPending').hidden = Boolean(response);
    if (response) {
      renderDropPointResponse(response);
      document.getElementById('dropPointResultName').textContent = value;
    } else {
      document.getElementById('dropPointPendingTitle').textContent = value;
      document.getElementById('dropPointPendingDescription').textContent = 'Chưa có response cho tập điểm này.';
      document.getElementById('dropPointUnavailableName').textContent = value;
      document.getElementById('dropPointCustomerRows').innerHTML = '';
      document.getElementById('dropPointStats').innerHTML = '';
    }
  }

  function resetDropPoint() {
    clearTimeout(dropPointCheckTimer);
    queuedDropPoints = [];
    checkedDropPoints = [];
    selectedDropPoint = null;
    const input = document.getElementById('dropPointInput');
    input.value = '';
    document.getElementById('dropPointTabsRegion').hidden = true;
    document.getElementById('dropPointTabs').innerHTML = '';
    document.getElementById('dropPointResults').hidden = true;
    document.getElementById('dropPointSummary').hidden = true;
    document.getElementById('dropPointPending').hidden = false;
    document.getElementById('dropPointPendingTitle').textContent = 'Kết quả kiểm tra';
    document.getElementById('dropPointPendingDescription').textContent = 'Thông tin tổng hợp sẽ hiển thị tại đây sau khi hoàn tất đối soát.';
    document.getElementById('dropPointEmpty').hidden = false;
    const button = document.getElementById('checkDropPoint');
    button.disabled = false;
    button.innerHTML = checkDropPointLabel;
    renderDropPointQueue();
    input.focus();
  }

  function runDropPointCheck() {
    const input = document.getElementById('dropPointInput');
    const button = document.getElementById('checkDropPoint');
    if (button.disabled) return;
    if (input.value.trim() && !addDropPoints()) return;
    if (!queuedDropPoints.length) {
      showToast('Thêm ít nhất một tập điểm trước khi kiểm tra.');
      input.focus();
      return;
    }
    const batch = [...queuedDropPoints];
    button.disabled = true;
    button.textContent = `Đang kiểm tra ${batch.length} tập điểm…`;
    document.getElementById('dropPointSuggestions').hidden = true;
    dropPointCheckTimer = setTimeout(() => {
      try {
        checkedDropPoints = batch;
        selectDropPointResult(batch[0]);
        document.getElementById('dropPointTabsRegion').scrollIntoView({behavior:'smooth',block:'nearest'});
      } catch (error) {
        console.error('Không thể hiển thị kết quả tập điểm:', error);
        showToast('Không thể hiển thị kết quả. Vui lòng tải lại trang và thử lại.');
      } finally {
        button.disabled = false;
        button.innerHTML = checkDropPointLabel;
        dropPointCheckTimer = null;
      }
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
    const matchesIdentifier = row => [row.contract,row.onu_sn,row.onu_mac,row.ipwan,row.onu_index].some(identifier => identifier != null && identifier !== '' && String(identifier).toUpperCase() === normalized);
    const response = [...availableDropPointResponses.values()].find(item => item.result.customers.some(matchesIdentifier));
    const customer = response?.result.customers.find(matchesIdentifier);
    if (!customer) {
      document.getElementById('customerResult').hidden = true;
      document.getElementById('customerEmpty').hidden = false;
      showToast('Chưa có response thật cho định danh này trong mockup.');
      input.focus();
      return;
    }
    const candidate = customer.selected_candidate || customer.candidates?.[0] || {};
    document.getElementById('customerResult').innerHTML = `
      <header><div class="na-profile-name"><span>KH</span><div><small>HỢP ĐỒNG</small><h2>${escapeHtml(customer.contract)}</h2><p>Được đối chiếu qua ${escapeHtml(type.toLowerCase())} ${escapeHtml(input.value.trim())}</p></div></div><span class="na-state-dot ${customer.status ? 'success' : 'warning'}">${escapeHtml(customer.contract_status)}</span></header>
      <div class="na-profile-grid">${[['Hợp đồng',customer.contract],['IP WAN',customer.ipwan],['MAC',customer.onu_mac],['Serial ONU',customer.onu_sn],['ONU model',customer.onu?.onu_model],['Nhiệt độ ONU',formatOnuTemperature(customer.onu?.onu_temp)],['OLT - ONU (m)',customer.onu?.onu_olt_distance],['OLT IP',candidate.olt_ip]].map(([label,value])=>detailArticle(label,value)).join('')}</div>
      <div class="na-access-path"><div><small>TẬP ĐIỂM</small><b>${escapeHtml(response.result.drop_point)}</b></div><i>→</i><div><small>OLT</small><b>${escapeHtml(candidate.olt_name)}</b></div><i>→</i><div><small>OLT-PORT / ONU</small><b>${escapeHtml(candidate.port_name)} · ${escapeHtml(customer.onu_index)}</b></div><i>→</i><div class="${customer.status ? 'is-online' : ''}"><small>RX / TX (dBm)</small><b>${escapeHtml(customer.onu?.onu_rx)} / ${escapeHtml(customer.onu?.onu_tx)}</b></div></div>`;
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
    ...DATA.pops.map(pop => ({icon:'⬡',title:pop.code,meta:`${pop.branch} · ${pop.province} · ${pop.zone}`,action:()=>{navigateModule('pop');openPopDetail(pop.code)}}))
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

  document.getElementById('popRegionFilters').addEventListener('click', event => {
    if (popScopeMode === 'one') return;
    const province = event.target.closest('[data-province]');
    if (province) { selectProvince(province); return; }
    const area = event.target.closest('.na-region-name');
    if (area) selectArea(area.dataset.area);
  });
  document.querySelectorAll('[data-pop-scope]').forEach(button => button.addEventListener('click', () => { popScopeMode = button.dataset.popScope; resetPopFilters(); }));
  document.getElementById('resetPopFilters').addEventListener('click', resetPopFilters);
  document.getElementById('popSearch').addEventListener('input', renderPops);
  document.getElementById('popGrid').addEventListener('click', event => { const card = event.target.closest('[data-pop]'); if (card) openPopDetail(card.dataset.pop); });
  document.getElementById('popPageSize').addEventListener('change',()=>renderPops());
  document.getElementById('popPrevPage').addEventListener('click',()=>{popPageIndex=Math.max(0,popPageIndex-1);renderPops(false);});
  document.getElementById('popNextPage').addEventListener('click',()=>{popPageIndex++;renderPops(false);});
  document.getElementById('refreshPop').addEventListener('click', () => { resetPopFilters(); showToast('Đã tải lại dữ liệu POP mô phỏng.'); });
  document.getElementById('registerDevice').addEventListener('click', () => showToast('Form Đăng ký thiết bị sẽ được bổ sung theo screenshot production.'));

  document.querySelectorAll('.na-nav-item').forEach(button => button.addEventListener('click', () => navigateModule(button.dataset.module)));
  document.querySelectorAll('#infoTabs button').forEach(button => button.addEventListener('click', () => openInfoTab(button.dataset.infoTab)));
  document.getElementById('dropPointInput').addEventListener('input', event => {
    const input = event.target;
    input.value = input.value.toUpperCase();
    const values = input.value.split(/[,;\r\n]+/).map(normalizeDropPoint).filter(Boolean);
    if (/[,;\r\n]/.test(input.value) && values.length && values.every(value => /^[A-Z0-9]+\.\d{4}\/(HO|HW|HU|HF)$/.test(value))) {
      addDropPoints();
    } else {
      updateDropPointSuggestions();
    }
  });
  document.getElementById('dropPointInput').addEventListener('keydown', event => { if (['Enter',',',';'].includes(event.key)) { event.preventDefault(); addDropPoints(); } });
  document.getElementById('dropPointInput').addEventListener('paste', event => {
    const pasted = event.clipboardData?.getData('text') || '';
    if (!/[,;\r\n]/.test(pasted) && !/^[A-Z0-9]+\.\d{4}\/(HO|HW|HU|HF)$/.test(normalizeDropPoint(pasted))) return;
    event.preventDefault();
    const input = event.target;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const combined = input.value.slice(0,start) + pasted + input.value.slice(end);
    if (!addDropPoints(combined)) {
      input.value = combined.replace(/[\r\n]+/g, ', ').toUpperCase();
      updateDropPointSuggestions();
    }
  });
  document.getElementById('dropPointSuggestions').addEventListener('click', event => { const button = event.target.closest('[data-suffix]'); if (!button) return; addDropPoints(`${normalizeDropPoint(document.getElementById('dropPointInput').value)}${button.dataset.suffix}`); });
  document.getElementById('addDropPoint').addEventListener('click', () => addDropPoints());
  document.getElementById('dropPointQueue').addEventListener('click', event => {
    const button = event.target.closest('[data-remove-drop-point]');
    if (!button) return;
    queuedDropPoints = queuedDropPoints.filter(value => value !== button.dataset.removeDropPoint);
    renderDropPointQueue();
  });
  document.getElementById('dropPointTabs').addEventListener('click', event => {
    const button = event.target.closest('[data-result-drop-point]');
    if (button) { selectDropPointResult(button.dataset.resultDropPoint); document.getElementById(`drop-point-tab-${checkedDropPoints.indexOf(button.dataset.resultDropPoint)}`).focus(); }
  });
  document.getElementById('dropPointTabs').addEventListener('keydown', event => {
    const button = event.target.closest('[data-result-drop-point]');
    if (!button || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const current = checkedDropPoints.indexOf(button.dataset.resultDropPoint);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? checkedDropPoints.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + checkedDropPoints.length) % checkedDropPoints.length;
    selectDropPointResult(checkedDropPoints[next]);
    const selectedTab = document.getElementById(`drop-point-tab-${next}`);
    selectedTab.focus();
    selectedTab.scrollIntoView({behavior:'smooth',block:'nearest',inline:'nearest'});
  });
  document.getElementById('clearDropPoint').addEventListener('click', () => { document.getElementById('dropPointInput').value = ''; updateDropPointSuggestions(); document.getElementById('dropPointInput').focus(); });
  document.getElementById('resetDropPoint').addEventListener('click', resetDropPoint);
  document.getElementById('checkDropPoint').addEventListener('click', runDropPointCheck);
  document.getElementById('exportDropPoint').addEventListener('click', () => {
    const response = availableDropPointResponses.get(selectedDropPoint);
    if (!response) { showToast('Chưa có dữ liệu để xuất cho tập điểm này.'); return; }
    const blob = new Blob([JSON.stringify(response,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedDropPoint.replace('/','-')}-response.json`;
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

  document.getElementById('sidebarToggle').addEventListener('click', () => {portal.classList.toggle('is-sidebar-collapsed');scheduleFloatingBack();});
  document.getElementById('fullscreenButton').addEventListener('click', event => {portal.classList.toggle('is-fullscreen');event.currentTarget.querySelector('span').textContent=portal.classList.contains('is-fullscreen')?'Thoát Fullscreen':'Mở Fullscreen';scheduleFloatingBack();});
  const savedTheme = localStorage.getItem('netauto-ui-theme'); if (savedTheme) root.dataset.theme=savedTheme;
  document.getElementById('themeButton').addEventListener('click',()=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';localStorage.setItem('netauto-ui-theme',root.dataset.theme);});

  document.getElementById('commandButton').addEventListener('click', openCommand);
  document.getElementById('commandInput').addEventListener('input', renderCommands);
  document.getElementById('commandResults').addEventListener('click', event => {const button=event.target.closest('[data-command-index]');if(!button)return;const item=event.currentTarget._items[Number(button.dataset.commandIndex)];closeCommand();item.action();});
  document.getElementById('commandPalette').addEventListener('click', event => {if(event.target.id==='commandPalette')closeCommand();});
  document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openCommand();}if(event.key==='/'&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)){event.preventDefault();openCommand();}if(event.key==='Escape'){closeCommand();}});

  window.addEventListener('popstate', restoreRoute);
  window.addEventListener('hashchange', restoreRoute);
  restoreRoute();
})();
