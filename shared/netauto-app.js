(() => {
  const DATA = window.NETAUTO_DATA;
  const contentViewport=document.getElementById('portalContent');
  const floatingBack=document.getElementById('detailFloatingBack');
  // Navigation owns both scroll roots (portal desktop / window on narrow screens).
  // Keep snapshots in memory, separate from persisted display/column preferences.
  const viewScrollMemory=new Map();
  let activeScrollView=null,viewScrollTicket=0;
  if('scrollRestoration' in history)history.scrollRestoration='manual';
  function viewScrollRegions(pageId) {
    return pageId==='popPage'?[document.getElementById('popTableView')]:
      [...document.getElementById(pageId).querySelectorAll('.l1-device-table-scroll,.l1-table-wrap,.l2-table-wrap')];
  }
  function readViewScroll(pageId) {
    const position=node=>({top:Number(node.scrollTop)||0,left:Number(node.scrollLeft)||0});
    return {content:position(contentViewport),window:{top:Number(window.scrollY ?? document.documentElement.scrollTop)||0,left:Number(window.scrollX ?? document.documentElement.scrollLeft)||0},regions:viewScrollRegions(pageId).map(position)};
  }
  function rememberViewScroll() {
    ++viewScrollTicket;
    if(activeScrollView)viewScrollMemory.set(activeScrollView.key,readViewScroll(activeScrollView.pageId));
  }
  function restoreViewScroll(snapshot) {
    const ticket=++viewScrollTicket,view=activeScrollView;
    const position=snapshot||{content:{top:0,left:0},window:{top:0,left:0},regions:[]};
    const apply=()=>{
      if(ticket!==viewScrollTicket||activeScrollView!==view)return;
      const write=(node,value)=>{
        const target=value||{top:0,left:0};
        if(node.scrollTo)node.scrollTo({...target,behavior:'instant'});
        else{node.scrollTop=target.top;node.scrollLeft=target.left;}
      };
      write(contentViewport,position.content);
      viewScrollRegions(view.pageId).forEach((node,index)=>write(node,position.regions[index]));
      window.scrollTo?.({...position.window,behavior:'instant'});
      syncFloatingBack();
    };
    apply();
    const applied=JSON.stringify(readViewScroll(view.pageId));
    // Restore again after the new layout settles, never after a newer navigation.
    requestAnimationFrame(()=>{
      // Do not undo a wheel/touch/keyboard scroll made since the immediate restore.
      if(ticket===viewScrollTicket&&activeScrollView===view&&JSON.stringify(readViewScroll(view.pageId))===applied)apply();
    });
  }
  function activateScrollView(key,pageId,restore=true,fallback=null) {
    activeScrollView={key,pageId};
    restoreViewScroll((restore&&viewScrollMemory.get(key))||fallback);
  }
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
  // Only the explicitly loaded demo response objects may use the standalone
  // uplink fixture. New/live response objects never inherit that fallback.
  const demoDropPointResponses=new WeakSet(window.NETAUTO_DROP_POINT_RESPONSES || [dropPointResponse]);
  const escapeHtml = value => String(value == null || value === '' ? '—' : value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const detailArticle = (label, value) => `<article><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></article>`;
  const formatOnuTemperature = value => {
    if (value == null || String(value).trim() === '') return '—';
    const temperature = Number(value);
    return Number.isFinite(temperature) ? `${Math.round(temperature)} °C` : '—';
  };
  function connectionTime(value) {
    if(typeof value!=='string')return null;
    const raw=value.trim();
    const match=raw.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/);
    if(!match)return null;
    const [,year,month,day,hour,minute,second,fraction='',zone='']=match;
    const y=Number(year),m=Number(month),d=Number(day);
    const days=[31,y%4===0&&(y%100!==0||y%400===0)?29:28,31,30,31,30,31,31,30,31,30,31];
    if(y<=1||m<1||m>12||d<1||d>days[m-1]||Number(hour)>23||Number(minute)>59||Number(second)>59)return null;
    if(zone&&zone!=='Z'&&(Number(zone.slice(1,3))>23||Number(zone.slice(4))>59))return null;
    // Compare absolute instants, interpreting naive source times as UTC+7,
    // while preserving the original timezone and value in the visible text.
    const utc=new Date(0);
    utc.setUTCFullYear(y,m-1,d);
    utc.setUTCHours(Number(hour),Number(minute),Number(second),0);
    const offset=zone==='Z'?0:zone?(zone[0]==='-'?-1:1)*(Number(zone.slice(1,3))*60+Number(zone.slice(4))):420;
    return {datetime:raw.replace(' ','T'),label:`${day}/${month}/${year} ${hour}:${minute}:${second}${fraction}${zone?` ${zone}`:''}`,seconds:utc.getTime()/1000-offset*60,fraction:fraction.slice(1)};
  }
  function compareConnectionTimes(left,right) {
    if(!left||!right)return 0;
    if(left.seconds!==right.seconds)return left.seconds>right.seconds?1:-1;
    // Do not truncate sub-millisecond precision when deciding which is newer.
    const length=Math.max(left.fraction.length,right.fraction.length);
    const a=left.fraction.padEnd(length,'0'),b=right.fraction.padEnd(length,'0');
    return a===b?0:a>b?1:-1;
  }
  function renderOnuStatus(customer) {
    // The old boolean status is SNMP success, NOT Online/Offline.
    const value=typeof customer.onu_status==='string'?customer.onu_status.trim().toLowerCase():'';
    const label=value==='online'?'Online':value==='offline'?'Offline':'—';
    const tone=label==='—'?'unknown':value;
    const reasons={session_times:'Thời gian phiên',csoc_status:'Trạng thái CSOC',ipwan:'IP WAN',snmp_rx:'Công suất RX',default:'Chưa đủ dữ liệu'};
    const hint=label==='—'?'Response chưa có trạng thái ONU hợp lệ.':[
      customer.onu_status_reason,reasons[customer.onu_status_source]
    ].filter(item=>typeof item==='string'&&item.trim()).join(' · ')||`ONU ${label}`;
    return `<span class="na-onu-status is-${tone}" data-field="onu_status" title="${escapeHtml(hint)}">${label}</span>${label!=='—'&&customer.onu_status_source==='default'?'<small class="na-onu-unconfirmed">Chưa xác nhận</small>':''}`;
  }
  function renderConnectionTimes(customer) {
    const logon=connectionTime(customer.last_logon),logout=connectionTime(customer.last_logout);
    const openSession=Boolean(logon)&&customer.connection_time_source==='inside'&&typeof customer.last_logout==='string'&&!customer.last_logout.trim();
    const source=customer.connection_time_source==='csoc'?'CSOC':customer.connection_time_source==='inside'?'Inside':'';
    const hasSource=Boolean(source&&(logon||logout));
    const order=compareConnectionTimes(logon,logout);
    const row=(label,field,time,open=false,showSource=false,tone='')=>`<div class="na-session-event" data-field="${field}"><span class="na-session-label">${label}${showSource?`<small class="na-session-source" title="Nguồn thời gian phiên kết nối">${source}</small>`:''}</span>${time?`<time${tone?` class="${tone}"`:''} datetime="${escapeHtml(time.datetime)}">${escapeHtml(time.label)}</time>`:`<span class="na-session-value${open?' is-open':''}">${open?'Phiên đang mở':'—'}</span>`}</div>`;
    return `<div class="na-session-history">${row('Đăng nhập gần nhất','last_logon',logon,false,hasSource,order>0?'is-latest-logon':'')}${row('Ngắt kết nối gần nhất','last_logout',logout,openSession,false,order<0?'is-latest-logout':'')}</div>`;
  }
  function renderSourceTags(customer) {
    const candidateSources=candidate=>[...(candidate.sources||[]),...(candidate.olt_sources||[]),...(candidate.coordinate_sources||[])];
    const selectedSources=customer.selected_candidate?candidateSources(customer.selected_candidate):[];
    const sources = [...new Set(selectedSources.length?selectedSources:customer.sources ?? (customer.candidates || []).flatMap(candidateSources))];
    const knownSources = {isc_portnet:['ISC','isc'],csoc_contract:['CONTRACT','contract'],csoc_radius:['RADIUS','radius']};
    const orderedSources = ['isc_portnet','csoc_contract','csoc_radius'].filter(source => sources.includes(source));
    orderedSources.push(...sources.filter(source => !knownSources[source]));
    return orderedSources.length ? `<div class="na-source-tags">${orderedSources.map(source => {
      const [label, tone] = knownSources[source] || [source,'other'];
      return `<span class="na-source-tag is-${tone}" title="${escapeHtml(source)}">${escapeHtml(label)}</span>`;
    }).join('')}</div>` : '<span class="na-source-empty">—</span>';
  }
  function renderDropPointUplink(result, {demo=false}={}) {
    const panel=document.getElementById('dropPointUplinkPanel');
    const notice=document.getElementById('dropPointUplinkMessage');
    const hasBackendUplink=Boolean(result)&&Object.prototype.hasOwnProperty.call(result,'uplink');
    const source=hasBackendUplink?result.uplink:demo?window.NETAUTO_DROP_POINT_UPLINK_RESPONSE:null;
    const point=source?.success===true&&Array.isArray(source.payload)?source.payload.find(item=>item?.tap_diem===result?.drop_point):null;
    const routes=Array.isArray(point?.bcc2_and_uplink_parameters)?point.bcc2_and_uplink_parameters.filter(route=>typeof route?.uplink_parameters==='string'&&route.uplink_parameters.split('=>').some(hop=>hop.trim())):[];
    panel.hidden=!routes.length;
    notice.hidden=!result||Boolean(routes.length);
    notice.textContent=notice.hidden?'':(Array.isArray(result.warnings)?result.warnings.find(warning=>typeof warning==='string'&&/uplink/i.test(warning)):'')||(typeof source?.message==='string'&&source.message.trim()?source.message:'Chưa có dữ liệu tuyến uplink cho tập điểm này.');
    if(!routes.length){panel.innerHTML='';return;}
    const routeCards=routes.map(route=>{
      // Display every hop in source order, including repeated cabinet positions.
      const hops=typeof route.uplink_parameters==='string'?route.uplink_parameters.split('=>').map(hop=>hop.trim()).filter(Boolean):[];
      const nodes=hops.map((hop,index)=>{
        const match=hop.match(/^(.*)\/(\d+)$/);
        return `<li class="${index===0||index===hops.length-1?'is-endpoint':''}"><span class="na-route-step" aria-hidden="true">${index+1}</span><div><code title="${escapeHtml(hop)}">${escapeHtml(match?match[1]:hop)}</code>${match?`<small>Port <b>${escapeHtml(match[2])}</b></small>`:''}</div></li>`;
      }).join('');
      return `<details class="na-uplink-route"><summary><span class="na-route-bcc"><small>BCC2</small><code>${escapeHtml(route.bcc2)}</code></span><span class="na-route-count">${hops.length} điểm</span><span class="na-route-chevron" aria-hidden="true">⌄</span></summary><div class="na-route-body"><p>Thứ tự đường đi · giữ nguyên các điểm lặp từ dữ liệu nguồn</p><ol class="na-route-nodes" role="list" aria-label="Đường đi uplink của ${escapeHtml(route.bcc2)}">${nodes}</ol></div></details>`;
    }).join('');
    panel.innerHTML=`<header class="na-uplink-heading"><div><span class="na-uplink-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="15" y="15" width="6" height="6" rx="1.5"/><path d="M6 9v9h9M9 6h9v9"/></svg></span><div><h3>Tuyến uplink</h3><p>${hasBackendUplink?'CSOC · kết quả API':'Dữ liệu demo · snapshot người dùng cung cấp'} · chọn BCC2 để xem đường đi</p></div></div><span class="na-real-data-badge">${routes.length} BCC2</span></header><div class="na-uplink-context">${[['Chi nhánh',point.name_branch],['POP',point.pop]].map(([label,value])=>`<div><span>${label}</span><b>${escapeHtml(value)}</b></div>`).join('')}</div><div class="na-uplink-routes">${routeCards}</div>`;
  }
  function renderDropPointResponse(response = dropPointResponse) {
    const {result, message} = response;
    renderDropPointUplink(result,{demo:demoDropPointResponses.has(response)});
    // The backend can return uplink metadata with an empty PortNet customer
    // list and no count object. Display unavailable aggregates as “—”.
    const count=result.count ?? {total:result.customers.length,success:null,failed:null};
    document.getElementById('dropPointStats').innerHTML = [
      ['Tổng khách hàng',count.total,''],
      ['Xác nhận thành công',count.success,'is-success'],
      ['Cần kiểm tra lại',count.failed,'is-danger'],
      ['Thời gian xử lý (ms)',result.duration_ms == null ? '—' : new Intl.NumberFormat('vi-VN', {maximumFractionDigits:3}).format(result.duration_ms),'is-speed']
    ].map(([label,value,className]) => `<article class="${className}"><span>${label}</span><strong>${escapeHtml(value)}</strong></article>`).join('');
    document.getElementById('dropPointResponseMessage').textContent = message.replace('có công suất ONU hợp lệ.', 'có công suất ONU.');
    const incomplete=result.customers.length<count.total;
    const dataNotice=document.getElementById('dropPointDataNotice');
    dataNotice.hidden=!incomplete;
    dataNotice.textContent=incomplete?`Bản dữ liệu được gửi đang rút gọn: có chi tiết ${result.customers.length}/${count.total} hợp đồng. Các số tổng hợp giữ nguyên theo API; ${count.total-result.customers.length} hợp đồng còn lại chưa có bản ghi chi tiết.`:'';
    document.getElementById('dropPointDataBadge').textContent=incomplete?'Dữ liệu thật · bản rút gọn':'Dữ liệu thật';
    document.getElementById('dropPointCustomerRows').innerHTML = result.customers.map(customer => {
      const candidate = customer.selected_candidate || customer.candidates?.[0] || {};
      const temperatureWarning = String(customer.onu?.onu_temp) === '2147483647';
      const txWarning = customer.onu?.onu_tx === 'OFFLINE';
      return `<tr>
        <td class="na-contract-cell"><b>${escapeHtml(customer.contract)}</b><small>Port ${escapeHtml(customer.drop_point_port)}</small><small class="na-bcc-value">${escapeHtml(customer.bcc1)}</small></td>
        <td class="na-onu-status-cell"><div class="na-combined-status"><div class="na-status-line"><span class="na-status-label">HĐ</span><span class="na-contract-status" data-field="contract_status">${escapeHtml(customer.contract_status)}</span></div><div class="na-status-line"><span class="na-status-label">ONU</span><div>${renderOnuStatus(customer)}</div></div></div></td>
        <td class="na-session-cell">${renderConnectionTimes(customer)}</td>
        <td class="na-olt-cell"><b>${escapeHtml(candidate.olt_name)}</b><small>${escapeHtml(candidate.model)} · ${escapeHtml(candidate.port_name)}</small><code class="na-onu-index" title="ONU index">${escapeHtml(customer.onu_index)}</code></td>
        <td class="na-identifier-value">${escapeHtml(customer.ipwan)}</td>
        <td class="na-onu-identity"><b>${escapeHtml(customer.onu?.onu_model)}</b><span class="na-identity-line"><span>SN</span><span>${escapeHtml(customer.onu_sn)}</span></span><span class="na-identity-line"><span>MAC</span><span>${escapeHtml(customer.onu_mac)}</span></span><span class="na-onu-temperature"><span>Nhiệt độ</span><span class="${temperatureWarning ? 'na-value-warning' : ''}">${temperatureWarning ? '⚠ ' : ''}${escapeHtml(formatOnuTemperature(customer.onu?.onu_temp))}</span></span></td>
        <td class="na-numeric">${customer.onu ? `<span class="na-optical-values"><b>${escapeHtml(customer.onu.onu_rx)}</b><span>/</span><span class="${txWarning ? 'na-value-warning' : ''}">${escapeHtml(customer.onu.onu_tx)}</span></span>` : '—'}</td>
        <td class="na-numeric na-distance-cell">${escapeHtml(customer.onu?.onu_olt_distance)}</td>
        <td class="na-source-cell">${renderSourceTags(customer)}</td>
      </tr>`;
    }).join('');
    document.getElementById('dropPointResultCount').textContent = `Hiển thị ${result.customers.length} / ${count.total} khách hàng`;
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
    const uplinkNotice=document.getElementById('dropPointUplinkMessage');
    if(Array.isArray(result.warnings))warnings.unshift(...result.warnings.filter(item=>typeof item==='string'&&item.trim()&&(uplinkNotice.hidden||item!==uplinkNotice.textContent)).map(message=>({contract:'Thông tin bổ sung',message})));
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
  let popShownCount = 0;
  let popResultRows = [];
  let popColorMode = 'province';
  let popLoadQueued = false;
  let popLoadTicket = 0;
  let popListView = 'cards';
  try { if (localStorage.getItem('netauto.pop.listView') === 'table') popListView = 'table'; } catch { /* Optional display preference. */ }
  const popLocationKeys=['area','zone','province','branch'];
  let popLocationColumns=new Set(['zone','province']);
  try{const saved=JSON.parse(localStorage.getItem('netauto.pop.locationColumns'));if(Array.isArray(saved)&&saved.every(key=>popLocationKeys.includes(key)))popLocationColumns=new Set(saved);}catch{/* Optional column preference. */}
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

  // Decorative Layer 0 accents are cool only, never warning/error colors.
  // Mixed results use stable province colors; one province shares a visit color.
  const popCoolHueStart=165,popCoolHueSpan=100;
  const popProvinceHues = [168,176,184,192,200,208,216,224,232,240,248,256,264];
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
  function normalizeHue(hue) {
    const value=Number(hue),start=popCoolHueStart*1000,span=popCoolHueSpan*1000;
    const ticks=Math.round((Number.isFinite(value)?value:215)*1000);
    // Wrap integer millidegrees inside teal → cyan → blue → blue-violet.
    // Both collision resolution and refresh offsets must stay in this range.
    return (start+((ticks-start)%span+span)%span)/1000;
  }
  for (const province of [...new Set(DATA.pops.map(popProvinceKey))].sort()) {
    let hash = 0;
    for (const character of province) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    let hue = popProvinceHues[hash % popProvinceHues.length];
    // Avoid assigning the exact same hue to two provinces in the snapshot.
    while ([...provinceHueMap.values()].includes(hue)) hue = normalizeHue(hue + 37.508);
    provinceHueMap.set(province, hue);
  }

  // Table colors stay stable while browsing; refresh/reload picks a new palette.
  let tablePaletteOffset = null;
  function renewTablePalette() {
    const key = 'netauto.pop.tablePaletteOffset';
    let previous = tablePaletteOffset;
    try { const saved = localStorage.getItem(key); if (previous === null && saved != null) previous = Number(saved); } catch { /* Storage is optional. */ }
    const choices = [0,11,23,37,49,61,73,83,91].filter(offset => offset !== previous);
    tablePaletteOffset = choices[Math.floor(Math.random()*choices.length)];
    try { localStorage.setItem(key,String(tablePaletteOffset)); } catch { /* Colors still refresh in memory. */ }
  }
  renewTablePalette();

  function popSummaryFields(pop) {
    const metadata=window.NETAUTO_POP_DETAIL.metadata(pop);
    return [['popType','Loại POP'],['popFunction','Chức năng'],['customerCount','Tổng khách hàng']].map(([key,label])=>{
      const field=metadata[key];
      const display=key==='customerCount'&&Number.isFinite(Number(field.value))?formatNumber(Number(field.value)):field.value;
      return {key,label,display,demo:field.demo};
    });
  }
  const popFieldAttrs=field=>`data-pop-field="${field.key}" data-demo="${field.demo}"${field.demo?' title="Dữ liệu giả lập để minh hoạ Interface"':''}`;

  function syncPopLocationColumns() {
    const table=document.getElementById('popTableView');
    document.getElementById('popLocationColumns').hidden=popListView!=='table';
    for(const key of popLocationKeys){
      table.setAttribute('data-hide-'+key,String(!popLocationColumns.has(key)));
      document.getElementById('popColumn-'+key).checked=popLocationColumns.has(key);
    }
    table.setAttribute('data-location-count',String(popLocationColumns.size));
  }

  function popTableRow(pop) {
    const hue = normalizeHue((provinceHueMap.get(popProvinceKey(pop)) ?? 215) + tablePaletteOffset);
    const c = pop.counts;
    const number = (value,tone) => `<td class="na-pop-number"><span class="na-pop-table-metric na-pop-${tone}${value === 0?' is-zero':''}">${formatNumber(value)}</span></td>`;
    const summary = popSummaryFields(pop).map(field=>{
      const value=escapeHtml(field.display);
      return `<td class="na-pop-info-cell" ${popFieldAttrs(field)}>${field.key==='customerCount'?`<span class="na-pop-table-value${Number(field.display)===0?' is-zero':''}">${value}</span>`:value}</td>`;
    }).join('');
    return `<tr data-pop="${escapeHtml(pop.code)}" data-pop-province="${escapeHtml(pop.province)}" style="--na-pop-hue:${hue}"><th scope="row"><button type="button" class="na-pop-row-launch" data-pop-preview="${escapeHtml(pop.code)}" aria-haspopup="dialog" aria-expanded="false" aria-controls="popPreviewDialog" aria-label="Xem thiết bị tại POP ${escapeHtml(pop.code)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="4" y="3" width="16" height="7" rx="2"/><rect x="4" y="14" width="16" height="7" rx="2"/><path d="M8 6.5h.01M8 17.5h.01M12 6.5h4M12 17.5h4"/></svg><span>${escapeHtml(pop.code)}</span></button></th><td data-pop-column="area"><span class="na-pop-area-badge">${escapeHtml(({MB:'Miền Bắc',MN:'Miền Nam'})[pop.area]||pop.area||'—')}</span></td><td data-pop-column="zone">${escapeHtml(pop.zone||'—')}</td><td data-pop-column="province"><span class="na-pop-province-badge">${escapeHtml(pop.province||'—')}</span></td><td data-pop-column="branch" class="na-pop-table-branch">${escapeHtml(popBranches(pop).join(' · '))}</td>${summary}${number(c.switch,'blue')}${number(c.olt,'purple')}${number(c.power,'orange')}${number(c.pi,'green')}<td class="na-pop-number"><b class="na-pop-row-total${popTotal(pop)===0?' is-zero':''}">${formatNumber(popTotal(pop))}</b></td><td class="na-pop-row-actions"><button type="button" class="na-pop-detail-action" data-pop-detail="${escapeHtml(pop.code)}" aria-label="Mở chi tiết POP ${escapeHtml(pop.code)}">Chi tiết</button></td></tr>`;
  }

  function setPopListView(view) {
    if (!['cards','table'].includes(view)||view===popListView) return;
    const visible=!document.getElementById('popPage').hidden;
    const previous=visible?readViewScroll('popPage'):null;
    if(visible)rememberViewScroll();
    popListView = view;
    try { localStorage.setItem('netauto.pop.listView',view); } catch { /* No storage required. */ }
    renderPops(false);
    if(visible)activateScrollView(`pop-list:${view}`,'popPage',true,{...previous,regions:[]});
  }

  function popCard(pop, colorMode) {
    const c = pop.counts;
    const meta = [pop.branch,pop.province !== pop.branch ? pop.province : '',pop.zone].filter(Boolean).join(' · ');
    const hue = colorMode === 'single-province' ? (singleProvinceHue ?? popProvinceHues[0]) : (provinceHueMap.get(popProvinceKey(pop)) ?? 215);
    return `<article class="na-pop-card" style="--na-pop-hue:${hue}" data-pop="${escapeHtml(pop.code)}" data-pop-province="${escapeHtml(pop.province)}">
      <button type="button" class="na-pop-preview" data-pop-preview="${escapeHtml(pop.code)}" aria-haspopup="dialog" aria-expanded="false" aria-controls="popPreviewDialog" aria-label="Xem nhanh thiết bị trong POP ${escapeHtml(pop.code)}"><span class="na-pop-head"><span class="na-pop-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="7" rx="2"/><rect x="4" y="14" width="16" height="7" rx="2"/><path d="M8 6.5h.01M8 17.5h.01M12 6.5h4M12 17.5h4"/></svg></span><span class="na-pop-title-block"><strong class="na-pop-card-name">${escapeHtml(pop.code)}</strong><span class="na-pop-meta">${escapeHtml(meta)}</span></span></span>
      <span class="na-pop-properties">${popSummaryFields(pop).map(field=>`<span ${popFieldAttrs(field)}><small>${field.label}</small><b>${escapeHtml(field.display)}</b></span>`).join('')}</span>
      <span class="na-pop-metrics"><span><span>Switch</span><b class="na-pop-blue">${c.switch}</b></span><span><span>OLT</span><b class="na-pop-purple">${c.olt}</b></span><span><span>Nguồn</span><b class="na-pop-orange">${c.power}</b></span><span><span>PI</span><b class="na-pop-green">${c.pi}</b></span></span>
      <span class="na-pop-foot"><b>${popTotal(pop)}</b> thiết bị<span>${pop.area}</span></span>
    </button><button type="button" class="na-pop-detail-action" data-pop-detail="${escapeHtml(pop.code)}" aria-label="Mở chi tiết POP ${escapeHtml(pop.code)}">Chi tiết</button></article>`;
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
  }

  function popBatchSize() { const size=Number(document.getElementById('popPageSize').value);return [36,72,100,144].includes(size)?size:100; }

  function updatePopLoadState() {
    const remaining = popResultRows.length-popShownCount;
    document.getElementById('popPageCount').textContent = popResultRows.length ? `Đã hiển thị ${formatNumber(popShownCount)} / ${formatNumber(popResultRows.length)} POP${remaining?'':' · Đã hết danh sách'}` : '0 POP';
    const more = document.getElementById('popLoadMore');
    more.hidden = remaining<=0;more.disabled = popLoadQueued;
    more.textContent = popLoadQueued ? 'Đang hiển thị thêm…' : `Xem thêm ${Math.min(popBatchSize(),remaining)} POP`;
    document.getElementById('popCardsSentinel').hidden = remaining<=0 || popListView!=='cards';
    document.getElementById('popTableSentinel').hidden = remaining<=0 || popListView!=='table';
    for (const id of ['popGrid','popTableView']) document.getElementById(id).setAttribute('aria-busy',String(popLoadQueued));
  }

  function loadMorePops() {
    if (popLoadQueued || document.getElementById('popPage').hidden || popShownCount>=popResultRows.length) return;
    popLoadQueued = true;
    const ticket = ++popLoadTicket;updatePopLoadState();
    requestAnimationFrame(()=>{
      if (ticket!==popLoadTicket) return;
      if (!document.getElementById('popPage').hidden) {
        const end = Math.min(popShownCount+popBatchSize(),popResultRows.length);
        const added = popResultRows.slice(popShownCount,end);
        const target = document.getElementById(popListView==='table'?'popTableRows':'popGrid');
        target.insertAdjacentHTML('beforeend',added.map(pop=>popListView==='table'?popTableRow(pop):popCard(pop,popColorMode)).join(''));
        popShownCount = end;
      }
      popLoadQueued = false;updatePopLoadState();
    });
  }

  function renderPops(resetPage = true) {
    ++popLoadTicket;popLoadQueued=false;
    if(resetPage){
      ++viewScrollTicket;
      viewScrollMemory.delete('pop-list:cards');viewScrollMemory.delete('pop-list:table');
    }
    const pops = filteredPops();
    popResultRows = pops;
    popShownCount = Math.min(resetPage?popBatchSize():Math.max(popBatchSize(),popShownCount),pops.length);
    const shown=pops.slice(0,popShownCount);
    const colorMode = new Set(pops.map(popProvinceKey)).size === 1 ? 'single-province' : 'province';
    popColorMode = colorMode;
    const grid = document.getElementById('popGrid');
    grid.setAttribute('data-color-mode', colorMode);
    grid.hidden = popListView !== 'cards';
    grid.innerHTML = popListView === 'cards' ? shown.map(pop => popCard(pop, colorMode)).join('') : '';
    const tableView = document.getElementById('popTableView');
    tableView.hidden = popListView !== 'table' || !pops.length;
    document.getElementById('popTableRows').innerHTML = popListView === 'table' ? shown.map(popTableRow).join('') : '';
    document.getElementById('popCardsMode').setAttribute('aria-pressed',String(popListView === 'cards'));
    document.getElementById('popTableMode').setAttribute('aria-pressed',String(popListView === 'table'));
    syncPopLocationColumns();
    if (resetPage) {tableView.scrollTop=0;tableView.scrollLeft=0;}
    document.getElementById('popEmpty').hidden = pops.length !== 0;
    document.getElementById('popResultCount').textContent = `${formatNumber(pops.length)} POP trong dữ liệu`;
    updatePopLoadState();
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
    const key=`pop:${pop.code}`,sameView=activeScrollView?.key===key;
    rememberViewScroll();
    window.NETAUTO_CONTEXT_TOOLS.close();
    window.NETAUTO_POP_DETAIL.open(pop,preserve);
    popVisitActive = false;
    document.querySelectorAll('.na-nav-item').forEach(button => button.classList.toggle('is-active', button.dataset.module === 'pop'));
    document.querySelectorAll('.na-page').forEach(page => page.hidden = page.dataset.page !== 'pop-detail');
    if (updateRoute && location.hash !== `#pop/${pop.code}`) history.pushState(null, '', `#pop/${pop.code}`);
    loadPopInventory(pop.code);
    activateScrollView(key,'popDetailPage',preserve||sameView);
    return true;
  }

  function openDeviceDetail(popCode, deviceName, updateRoute = true) {
    const pop = DATA.pops.find(entry=>entry.code===popCode);
    if (!pop) return false;
    const records = window.NETAUTO_POP_DETAIL_DATA.pops[popCode] || pop.devices;
    const device = records.find(entry=>entry.name===deviceName);
    if (!device) return false;
    const key=`device:${popCode}:${deviceName}`;
    rememberViewScroll();
    window.NETAUTO_CONTEXT_TOOLS.close();
    window.NETAUTO_POP_DETAIL.closePreview();
    popVisitActive = false;
    window.NETAUTO_POP_DETAIL.closeTopo();
    window.NETAUTO_DEVICE_DETAIL.open(pop,device);
    document.querySelectorAll('.na-nav-item').forEach(button=>button.classList.toggle('is-active',button.dataset.module==='pop'));
    document.querySelectorAll('.na-page').forEach(page=>page.hidden=page.dataset.page!=='device-detail');
    const route=`#pop/${popCode}/device/${encodeURIComponent(deviceName)}`;
    if (updateRoute && location.hash!==route) history.pushState(null,'',route);
    loadPopInventory(pop.code);
    activateScrollView(key,'deviceDetailPage',!updateRoute||activeScrollView?.key===key);
    return true;
  }

  function loadPopInventory(code) {
    const store=window.NETAUTO_POP_DETAIL_DATA;
    store.ensurePop(code,error=>{
      if(error){if(location.hash.startsWith(`#pop/${code}`))showToast('Không tải được inventory. Mở lại POP để thử lại.');}
      const view=activeScrollView;
      const position=view&&(view.key===`pop:${code}`||view.key.startsWith(`device:${code}:`))?readViewScroll(view.pageId):null;
      window.NETAUTO_POP_DETAIL.refreshInventory(code);
      window.NETAUTO_DEVICE_DETAIL.refreshInventory(code);
      if(position&&activeScrollView===view)restoreViewScroll(position);
    });
  }

  function navigateModule(module, updateRoute = true) {
    rememberViewScroll();
    window.NETAUTO_CONTEXT_TOOLS.close();
    window.NETAUTO_POP_DETAIL.closePreview();
    window.NETAUTO_POP_DETAIL.closeTopo();
    if (module === 'pop' && !popVisitActive) renewPopVisitColor();
    popVisitActive = module === 'pop';
    if (module === 'pop') renderPops(false);
    document.querySelectorAll('.na-nav-item').forEach(button => button.classList.toggle('is-active', button.dataset.module === module));
    document.querySelectorAll('.na-page').forEach(page => page.hidden = page.dataset.page !== module);
    if (updateRoute) history.replaceState(null, '', `#${module}`);
    activateScrollView(module==='pop'?`pop-list:${popListView}`:module,module==='pop'?'popPage':module==='customer'?'customerPage':'businessPage');
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
    const invalid = values.find(value => !/^[A-Z0-9]+\.\d{4}\/(HO|HW|HU|HF|HB)$/.test(value));
    if (invalid) {
      showToast(/^[A-Z0-9]+\.\d{4}$/.test(invalid) ? 'Chọn hậu tố /HO, /HW, /HU, /HF hoặc /HB cho mã đang nhập.' : `Mã tập điểm chưa đúng định dạng: ${invalid}`);
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
      const tone = !response ? 'pending' : response.result.count?.failed ? 'warning' : 'success';
      return `<button id="drop-point-tab-${index}" role="tab" type="button" aria-selected="${isSelected}" aria-controls="dropPointResults" tabindex="${isSelected ? 0 : -1}" class="na-drop-result-tab${isSelected ? ' is-active' : ''}" data-result-drop-point="${escapeHtml(value)}"><span class="na-drop-tab-dot is-${tone}" aria-hidden="true"></span><span>${escapeHtml(value)}</span><small>${response ? `${response.result.count?.success ?? '—'}/${response.result.count?.total ?? response.result.customers.length}` : 'Chưa có dữ liệu'}</small></button>`;
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
      renderDropPointUplink(null);
      document.getElementById('dropPointPendingTitle').textContent = value;
      document.getElementById('dropPointPendingDescription').textContent = 'Chưa có response cho tập điểm này.';
      document.getElementById('dropPointUnavailableName').textContent = value;
      document.getElementById('dropPointCustomerRows').innerHTML = '';
      document.getElementById('dropPointStats').innerHTML = '';
    }
  }

  function resetDropPoint() {
    clearTimeout(dropPointCheckTimer);
    renderDropPointUplink(null);
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
    if (workflow === 'service') return 'service_checking/mockup.html';
    if (workflow === 'customerpon') return 'customer_of_pon/mockup.html';
    if (workflow === 'stack') return 'switch_stack_join/mockup.html';
    const prefixes = {success:'07_config_thanh_cong.html',failed:'06_config_khong_thanh_cong.html',precheck:'05_precheck_thanh_cong.html',allocated:'02_cap_phat_thanh_cong.html',created:'01_tao_ke_hoach_thanh_cong.html'};
    return `${DATA.workflows[workflow].base}/${prefixes[state] || prefixes.success}`;
  };

  function openBusinessPage(key, state='success') {
    document.querySelectorAll('#businessSubnav button').forEach(button => button.classList.toggle('is-active', button.dataset.businessPage === key));
    const plans = key === 'plans';
    document.getElementById('createPlanButton').hidden = key === 'service' || key === 'customerpon';
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
    select.disabled = key === 'stack' || key === 'service' || key === 'customerpon';
    select.hidden = key === 'service' || key === 'customerpon';
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
    {icon:'⬡',title:'Quản lý POP & Thiết bị',meta:'Mở trang POP',action:()=>navigateModule('pop')},
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
  function handlePopLaunch(event) {
    const detail=event.target.closest('[data-pop-detail]');
    if(detail){openPopDetail(detail.dataset.popDetail);return;}
    const entry=event.target.closest('[data-pop]');
    if(!entry)return;
    const pop=DATA.pops.find(item=>item.code===entry.dataset.pop);
    const trigger=event.target.closest('[data-pop-preview]')||entry.querySelector?.('[data-pop-preview]')||entry;
    if(pop)window.NETAUTO_POP_DETAIL.preview(pop,trigger);
  }
  document.getElementById('popGrid').addEventListener('click',handlePopLaunch);
  document.getElementById('popTableRows').addEventListener('click',handlePopLaunch);
  document.getElementById('popCardsMode').addEventListener('click',()=>setPopListView('cards'));
  document.getElementById('popTableMode').addEventListener('click',()=>setPopListView('table'));
  document.getElementById('popLocationColumns').addEventListener('change',event=>{
    const key=event.target.dataset.popColumn;
    if(!popLocationKeys.includes(key))return;
    if(event.target.checked)popLocationColumns.add(key);else popLocationColumns.delete(key);
    try{localStorage.setItem('netauto.pop.locationColumns',JSON.stringify([...popLocationColumns]));}catch{/* Optional preference. */}
    syncPopLocationColumns();
  });
  document.getElementById('popPreviewDetails').addEventListener('click',()=>{
    if(document.getElementById('popPreviewDialog').open)openPopDetail(document.getElementById('popPreviewDetails').dataset.popDetail);
  });
  document.getElementById('popPageSize').addEventListener('change',()=>renderPops());
  document.getElementById('popLoadMore').addEventListener('click',loadMorePops);
  if (typeof window.IntersectionObserver === 'function') {
    for (const [id,view,scrollRoot] of [['popCardsSentinel','cards',null],['popTableSentinel','table',document.getElementById('popTableView')]]) {
      new window.IntersectionObserver(entries=>{
        if (popListView===view && entries.some(entry=>entry.isIntersecting)) loadMorePops();
      },{root:scrollRoot,rootMargin:'0px 0px 280px 0px',threshold:0}).observe(document.getElementById(id));
    }
  }
  document.getElementById('refreshPop').addEventListener('click', () => { renewTablePalette(); resetPopFilters(); showToast('Đã tải lại dữ liệu POP mô phỏng.'); });

  document.querySelectorAll('.na-nav-item').forEach(button => button.addEventListener('click', () => navigateModule(button.dataset.module)));
  document.querySelectorAll('#infoTabs button').forEach(button => button.addEventListener('click', () => openInfoTab(button.dataset.infoTab)));
  document.getElementById('dropPointInput').addEventListener('input', event => {
    const input = event.target;
    input.value = input.value.toUpperCase();
    const values = input.value.split(/[,;\r\n]+/).map(normalizeDropPoint).filter(Boolean);
    if (/[,;\r\n]/.test(input.value) && values.length && values.every(value => /^[A-Z0-9]+\.\d{4}\/(HO|HW|HU|HF|HB)$/.test(value))) {
      addDropPoints();
    } else {
      updateDropPointSuggestions();
    }
  });
  document.getElementById('dropPointInput').addEventListener('keydown', event => { if (['Enter',',',';'].includes(event.key)) { event.preventDefault(); addDropPoints(); } });
  document.getElementById('dropPointInput').addEventListener('paste', event => {
    const pasted = event.clipboardData?.getData('text') || '';
    if (!/[,;\r\n]/.test(pasted) && !/^[A-Z0-9]+\.\d{4}\/(HO|HW|HU|HF|HB)$/.test(normalizeDropPoint(pasted))) return;
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
