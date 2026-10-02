(() => {
  const DATA = window.NETAUTO_DATA;
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
  if (initialModule === 'business') navigateModule('business');
})();
