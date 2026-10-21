// Run: node mockup_ui/tests/pop-layer0.test.cjs
// Exercise Layer 0/1/2, the real mockup scripts and HTML IDs without browser dependencies.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const mockup = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(mockup, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(mockup, 'shared/netauto-shell.css'), 'utf8');
const nodes = new Map();

function element(id = '', dataset = {}) {
  const classes = new Set();
  return {
    id, dataset, value: '', innerHTML: '', textContent: '', hidden: false, disabled: false, scrollTop:0, scrollLeft:0,
    attrs: {}, listeners: {}, style: {}, tagName: 'DIV',
    classList: {
      add: name => classes.add(name), remove: name => classes.delete(name),
      contains: name => classes.has(name),
      toggle(name, force = !classes.has(name)) { if (force) classes.add(name); else classes.delete(name); },
    },
    setAttribute(key, value) { this.attrs[key] = value; },
    insertAdjacentHTML(position, markup) { assert.equal(position,'beforeend');this.appendCalls=(this.appendCalls||0)+1;this.innerHTML+=markup; },
    addEventListener(type, callback) { this.listeners[type] = callback; },
    click() { this.listeners.click?.({target:this,currentTarget:this}); },
    focus() { document.activeElement = this; }, scrollIntoView() {}, scrollTo(position) { this.lastScroll=position;if(position.top!==undefined)this.scrollTop=position.top;if(position.left!==undefined)this.scrollLeft=position.left; }, querySelectorAll() { return []; },
    showModal() { this.open=true; this.attrs.open=''; },
    close() { this.open=false; delete this.attrs.open; this.listeners.close?.(); },
    getBoundingClientRect() { return {left:100,top:100,right:1100,bottom:750}; },
  };
}

for (const match of html.matchAll(/id="([^"]+)"/g)) {
  assert(!nodes.has(match[1]), `Duplicate HTML ID: ${match[1]}`);
  nodes.set(match[1], element(match[1]));
}
// The topology creates its controls lazily; mimic those IDs in the DOM harness.
const referenceScript = fs.readFileSync(path.join(mockup,'shared/netauto-pop-reference.js'),'utf8');
for (const match of referenceScript.matchAll(/id="([^"]+)"/g)) {
  assert(!nodes.has(match[1]), `Duplicate dynamically-created HTML ID: ${match[1]}`);
  nodes.set(match[1],element(match[1]));
}
const get = id => { assert(nodes.has(id), `Missing real HTML element: ${id}`); return nodes.get(id); };
const modes = ['many', 'three', 'one'].map(popScope => element('', {popScope}));
const regions = ['MB', 'MN'].map(area => element('', {area}));
const pages = [...html.matchAll(/<section\b[^>]*id="([^"]+)"[^>]*data-page="([^"]+)"/g)].map(match => {
  const page = get(match[1]); page.dataset.page = match[2]; return page;
});
const root = element();
root.dataset.theme = 'light';
get('typeFilter').value = get('statusFilter').value = 'all';
get('popPageSize').value = '100';
const storage = new Map();
const timers = new Map();
let timerId = 0;
const document = {
  documentElement: root,
  body: element(),
  getElementById: get,
  querySelectorAll(selector) {
    if (selector === '[data-pop-scope]') return modes;
    if (selector === '#popPage .na-region-name') return regions;
    if (selector === '.na-page') return pages;
    return [];
  },
  querySelector(selector) { return selector==='.na-content'?get('portalContent'):element(); },
  addEventListener() {},
  createElement(tag) { return {tagName:tag.toUpperCase(),remove(){},click() { document.lastDownload = this.download; }}; },
  head:{appendChild(script){vm.runInNewContext(fs.readFileSync(path.join(mockup,script.src),'utf8'),context,{filename:script.src});script.onload();}},
};
const context = {
  document, window: {listeners: {}, addEventListener(type, callback) { const previous=this.listeners[type];this.listeners[type]=previous?event=>{previous(event);callback(event);}:callback; }}, console, Intl,
  location: {hash: ''},
  localStorage: {getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value)},
  requestAnimationFrame: callback => callback(),
  setTimeout(callback, delay) { timers.set(++timerId, {callback, delay}); return timerId; },
  clearTimeout: id => timers.delete(id),
  Blob: class { constructor(parts) { this.text = parts.join(''); } },
  URL: {createObjectURL(blob) { document.lastCSV = blob.text; return 'blob:test'; },revokeObjectURL() {}},
};
context.history = {
  pushState(_state, _title, url) { context.location.hash = url; },
  replaceState(_state, _title, url) { context.location.hash = url; },
};
const popScrollObservers=[];
context.window.IntersectionObserver=class {
  constructor(callback,options){this.callback=callback;this.options=options;popScrollObservers.push(this);}
  observe(target){this.target=target;}
  fire(isIntersecting=true){this.callback([{target:this.target,isIntersecting}]);}
};
for (const script of ['netauto-data.js','netauto-pop-index.js', 'drop-point-response.js', 'drop-point-uplink-response.js', 'netauto-pop-store.js', 'netauto-pop-reference.js', 'smartpop-config-responses.js', 'smartpop-model.js', 'smartpop-capture.js', 'smartpop-telemetry.js', 'smartpop-overview.js', 'smartpop-alarm-dialog.js', 'smartpop-workspace.js', 'netauto-pop-detail.js', 'huawei-device-layouts.js', 'netauto-device-port-models.js', 'netauto-device-ports.js', 'netauto-device-detail.js', 'netauto-app.js']) {
  let source=fs.readFileSync(path.join(mockup, 'shared', script), 'utf8');
  // Test-only access to the renderer, without adding a public hook to the app.
  if(script==='netauto-app.js')source=source.replace('  function renderDropPointResponse(', '  window.__testRenderDropPointResponse=renderDropPointResponse;\n  function renderDropPointResponse(');
  if(script==='netauto-app.js')source=source.replace('  function popTableRow(', '  window.__testPopTableRow=popTableRow;\n  function popTableRow(');
  if(script==='netauto-app.js')source=source.replace('  function popCard(', '  window.__testPopCard=popCard;\n  function popCard(');
  vm.runInNewContext(source, context, {filename: script});
}
const count = () => Number(get('popResultCount').textContent.split(' ')[0].replaceAll('.',''));
const mode = value => modes.find(button => button.dataset.popScope === value).listeners.click();
const filter = (kind, value) => {
  const button = element('', kind === 'branch' ? {province: value} : {area: value});
  get('popRegionFilters').listeners.click({target: {closest: selector => selector === (kind === 'branch' ? '[data-province]' : '.na-region-name') ? button : null}});
};
const search = value => { get('popSearch').value = value; get('popSearch').listeners.input(); };
const reset = () => get('resetPopFilters').listeners.click();

const snapshotStats=context.window.NETAUTO_DATA.productionStats;
const totalPops=snapshotStats.pops;
const number=value=>new Intl.NumberFormat('vi-VN').format(value);
assert.equal(count(), totalPops);
assert.equal(get('popTotal').textContent, number(totalPops));
assert.equal(get('deviceTotal').textContent, number(snapshotStats.devices));
assert(get('networkStats').innerHTML.includes(number(snapshotStats.switches)));
assert(get('networkStats').innerHTML.includes(number(snapshotStats.olts)));
assert(get('powerStats').innerHTML.includes(number(snapshotStats.power)));
assert(get('powerStats').innerHTML.includes(number(snapshotStats.ipms)));
assert(get('powerStats').innerHTML.includes(number(snapshotStats.opms)));
assert(get('powerStats').innerHTML.includes('PI khác'));
assert(!get('networkStats').innerHTML.includes('<small>'));
assert(!get('powerStats').innerHTML.includes('<small>'));
for (const [id, labels] of [['networkStats', ['Switch', 'OLT']], ['powerStats', ['Nguồn', 'IPMS', 'OPMS']]]) {
  for (const label of labels) {
    assert.equal((get(id).innerHTML.match(new RegExp(`>${label}<`, 'g')) || []).length, 1);
    assert(new RegExp(`<span class="na-pop-stat-label">${label}</span><strong`).test(get(id).innerHTML));
  }
}
assert(/<section class="na-summary-row"[^>]*>\s*<label class="na-search-card">/.test(html), 'Search must be the first item in the statistics row');
assert(!get('popGrid').innerHTML.includes('na-pop-tags'));
assert(!get('popGrid').innerHTML.includes('AGG · AGG'));
const cardHues = () => new Map([...get('popGrid').innerHTML.matchAll(/style="--na-pop-hue:([\d.]+)"[^>]*data-pop="([^"]+)"/g)].map(match => [match[2], Number(match[1])]));
const initialHues = cardHues();
const provinceHues = new Map();
for (const pop of context.window.NETAUTO_DATA.pops.filter(pop=>initialHues.has(pop.code))) {
  if (provinceHues.has(pop.province)) assert.equal(initialHues.get(pop.code), provinceHues.get(pop.province), 'Same province must share a color');
  provinceHues.set(pop.province, initialHues.get(pop.code));
  const card = get('popGrid').innerHTML.match(new RegExp(`data-pop="${pop.code}"[\\s\\S]*?(?=</article>)`))[0];
  for (const [label, key] of [['Switch', 'switch'], ['OLT', 'olt'], ['Nguồn', 'power'], ['PI', 'pi']]) {
    assert(new RegExp(`<span>${label}</span><b[^>]*>${pop.counts[key]}</b>`).test(card), `${pop.code}: ${label} must match source`);
  }
}
assert.equal(initialHues.size,100,'Default page renders 100 POP cards');
assert(html.includes('<option value="100" selected>100 POP</option>'));
assert(!html.includes('id="popDataNote"'),'Remove the source filename/snapshot note from the POP list');
assert.equal(get('popLoadMore').hidden,false);
assert(get('popPageCount').textContent.includes('100 / 3.898'));
get('popLoadMore').listeners.click();
assert.equal(cardHues().size,200,'More POPs append instead of replacing the previous batch');
assert(get('popPageCount').textContent.includes('200 / 3.898'));
assert.equal(get('popGrid').attrs['data-color-mode'],'province','Color mode is based on all results, not the visible page');
for(const [code,hue] of cardHues()){
  const province=context.window.NETAUTO_DATA.pops.find(pop=>pop.code===code).province;
  if(provinceHues.has(province))assert.equal(hue,provinceHues.get(province));
}
get('popPageSize').value='72';get('popPageSize').listeners.change();
assert.equal(cardHues().size,72);
get('popPageSize').value='144';get('popPageSize').listeners.change();
assert.equal(get('popGrid').attrs['data-color-mode'], 'province');
const plansBefore = get('planTableBody').innerHTML;

const allPops=context.window.NETAUTO_DATA.pops;
const scoped=branches=>allPops.filter(pop=>pop.branches.some(branch=>branches.includes(branch)));
const threePops=scoped(['QNH','AGG','BTHT1']);
const scopedCount=(branches)=>scoped(branches).length;
mode('three');
assert.equal(count(), threePops.length);
for (const [code, hue] of cardHues()) if(initialHues.has(code))assert.equal(hue, initialHues.get(code), 'Scope changes must not recolor POPs');
assert.equal(Number(get('deviceTotal').textContent.replaceAll('.','')),threePops.reduce((sum,pop)=>sum+pop.devices.length,0));
assert.equal(get('powerStatsGroup').attrs['aria-label'], 'Nguồn và PI');
assert(get('powerStats').innerHTML.includes('>PI</span><strong'));
assert(!get('powerStats').innerHTML.includes('IPMS'));
assert.equal((get('northProvinces').innerHTML.match(/data-province=/g) || []).length, 1);
assert.equal((get('southProvinces').innerHTML.match(/data-province=/g) || []).length, 2);
assert.equal(modes[1].attrs['aria-pressed'], 'true');
assert(!get('popGrid').innerHTML.includes('KGGP029'));
filter('area', 'MB'); assert.equal(count(), threePops.filter(pop=>pop.area==='MB').length);
filter('area', 'MN'); assert.equal(count(), threePops.filter(pop=>pop.area==='MN').length);
reset(); assert.equal(count(), threePops.length);
filter('branch', 'AGG');
assert.equal(count(), 47);
assert.equal(get('popGrid').attrs['data-color-mode'], 'single-province');
const aggUniformHues = cardHues();
const visitHue = aggUniformHues.values().next().value;
assert.equal(new Set(aggUniformHues.values()).size, 1, 'All POPs in one province share the visit color');
const mixedProvinceColors=()=>{
  const huesByProvince=new Map();
  for(const [code,hue]of cardHues()){
    const province=allPops.find(pop=>pop.code===code).province;
    if(huesByProvince.has(province))assert.equal(hue,huesByProvince.get(province));
    huesByProvince.set(province,hue);
  }
  assert.equal(new Set(huesByProvince.values()).size,huesByProvince.size,'Different provinces have distinct colors');
};
filter('branch', 'QNH');
assert.equal(count(), scopedCount(['AGG','QNH']));
assert.equal(get('popGrid').attrs['data-color-mode'], 'province');
mixedProvinceColors();
for (const [code, hue] of cardHues()) if(initialHues.has(code))assert.equal(hue, initialHues.get(code), 'Mixed-province results must return to province colors');
reset();
filter('branch', 'QNH'); assert.equal(count(), scopedCount(['QNH']));
filter('branch', 'BTHT1'); assert.equal(count(), scopedCount(['QNH','BTHT1']));
filter('branch', 'KGG'); assert.equal(count(), scopedCount(['QNH','BTHT1']));
reset(); search('KGG'); assert.equal(count(), 0); assert.equal(get('popEmpty').hidden, false);
reset(); assert.equal(count(), threePops.length);

mode('one');
assert.equal(count(), 47);
assert.equal(get('popGrid').attrs['data-color-mode'], 'single-province');
for (const hue of cardHues().values()) assert.equal(hue, visitHue, 'The shared color persists across scope scenarios within a visit');
get('popPageSize').value='36';get('popPageSize').listeners.change();
get('popLoadMore').listeners.click();
assert.equal(cardHues().size,47);
for(const hue of cardHues().values())assert.equal(hue,visitHue,'Pagination keeps the same single-province color');
get('popPageSize').value='144';get('popPageSize').listeners.change();
assert.equal(get('popRegionFilters').hidden, true);
assert.equal(get('singleBranchScope').hidden, false);
assert.equal(get('resetPopFilters').hidden, true);
search('HCMP'); assert.equal(count(), 0);
get('refreshPop').listeners.click(); assert.equal(count(), 47);
search('AGGP006'); assert.equal(count(), 1);
assert.equal(cardHues().get('AGGP006'), visitHue, 'Search within one province retains the shared visit color');
get('popGrid').listeners.click({target: {closest: selector => selector==='[data-pop-detail]'?({dataset: {popDetail: 'AGGP006'}}):null}});
assert.equal(get('detailPopName').textContent, 'AGGP006');
assert(get('detailDeviceGroups').innerHTML.includes('CE701001AGGP00601HW63'));
assert.equal(get('popDetailPage').hidden, false);
assert.equal(get('popPage').hidden, true);
assert.equal(context.location.hash, '#pop/AGGP006');
get('backToPopList').listeners.click();
assert.equal(get('popDetailPage').hidden, true);
assert.equal(get('popPage').hidden, false);
assert.equal(get('popSearch').value, 'AGGP006');
assert.equal(count(), 1, 'Returning from detail must preserve Layer 0 filters');
const returnHue=cardHues().get('AGGP006');
assert.notEqual(returnHue,visitHue,'Returning to Layer 0 chooses a different accent');
search('AGG');
assert.equal(new Set(cardHues().values()).size,1);
for(const hue of cardHues().values())assert.equal(hue,returnHue,'The new visit color applies to all POPs, not just the prior selection');

mode('many');
assert.equal(count(), totalPops);
search('11.67.61.91'); assert.equal(count(), 1);
search('GC16'); assert(count() > 0);
reset(); assert.equal(count(), totalPops);
get('themeButton').listeners.click(); assert.equal(root.dataset.theme, 'dark');
mode('three'); assert.equal(root.dataset.theme, 'dark');
get('themeButton').listeners.click(); assert.equal(root.dataset.theme, 'light');
assert.equal(get('planTableBody').innerHTML, plansBefore, 'POP operations must not change plan results');

// Regression smoke test: the real check-drop-point response still renders.
get('dropPointInput').value = context.window.NETAUTO_DROP_POINT_RESPONSE.result.drop_point;
get('checkDropPoint').listeners.click();
const checkTimer = [...timers.values()].find(timer => timer.delay === 420);
assert(checkTimer, 'Check drop point must schedule rendering');
checkTimer.callback();
assert(get('dropPointCustomerRows').innerHTML.includes('TQAAB2928'));
assert.equal((get('dropPointCustomerRows').innerHTML.match(/<tr>/g) || []).length, 7);
assert.equal(get('checkDropPoint').disabled, false);

// New fields are supplied by the backend, never guessed from old SNMP status.
assert(html.includes('Trạng thái<span class="na-header-sub">HĐ / ONU</span>'));
assert(!html.includes('Trạng thái HĐ</th>')&&!html.includes('Trạng thái ONU</th>'));
assert(html.includes('Phiên kết nối<span'));
let onuRows=[...get('dropPointCustomerRows').innerHTML.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(match=>match[1]);
assert.equal(onuRows.length,7);
assert(onuRows.every(row=>row.includes('na-onu-status is-unknown')),'Legacy responses remain unknown rather than being labelled Online from RX/IP');
assert(onuRows.every(row=>row.includes('data-field="last_logon"')&&row.includes('data-field="last_logout"')));
const connectionResponse=context.window.NETAUTO_DROP_POINT_RESPONSE;
const originalConnectionCustomers=connectionResponse.result.customers;
const originalConnectionJson=JSON.stringify(connectionResponse);
// Synthetic test fixtures only. Do not add invented dates/status to real data.
connectionResponse.result.customers=originalConnectionCustomers.map((customer,i)=>({...customer,...[
  {onu_status:'Offline',last_logon:'2026-10-11 15:04:03',last_logout:'2026-10-12 08:30:40',connection_time_source:'csoc',onu_status_source:'session_times',onu_status_reason:'Ngắt kết nối sau đăng nhập'},
  {onu_status:'Online',status:false,ipwan:null,onu:null,last_logon:null,last_logout:null},
  {onu_status:'Online',last_logon:'2026-10-12 10:20:30',last_logout:'',connection_time_source:'inside'},
  {onu_status:'Offline',onu_status_source:'default',last_logon:'Unknown',last_logout:null,connection_time_source:'unavailable'},
  {onu_status:'<img src=x onerror=alert(1)>',last_logon:'',last_logout:'',connection_time_source:'csoc'},
  {onu_status:null,last_logon:'2026-02-30 10:20:30',last_logout:'0001-01-01 00:00:00',connection_time_source:'inside'},
  {onu_status:'Offline',last_logon:'2026-10-12T03:20:30Z',last_logout:'2026-10-12T11:20:30.123+07:00',connection_time_source:'csoc',onu_status_reason:'<img src=x onerror=alert(1)> "reason"'}
][i]}));
const testConnectionJson=JSON.stringify(connectionResponse);
checkTimer.callback();
onuRows=[...get('dropPointCustomerRows').innerHTML.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(match=>match[1]);
assert(onuRows.every(row=>(row.match(/<td(?:\s|>)/g)||[]).length===9),'Each row matches the nine header columns after combining statuses');
assert(onuRows.every(row=>row.includes('na-combined-status')&&row.includes('data-field="contract_status"')&&row.includes('data-field="onu_status"')),'Both independently labelled states remain in the merged cell');
assert(onuRows.every(row=>row.includes('class="na-onu-index" title="ONU index"')),'ONU index is rendered as its own bordered tag');
assert(css.includes('.na-session-label{display:flex;align-items:center;gap:6px}'),'Source badge stays next to the first label without adding a grid row');
assert(onuRows[0].includes('<span class="na-session-label">Đăng nhập gần nhất<small class="na-session-source"'),'Source badge is inline with the logon label, not anchored to the far edge of the cell');
assert(!css.includes('.na-session-source{position:absolute;'),'Source badge does not leave a large gap or shrink the timestamp');
assert(css.includes('.na-onu-table .na-olt-cell .na-onu-index{border:1px solid'),'ONU index border uses theme-aware tokens');
assert(onuRows.every(row=>row.includes('<td class="na-numeric na-distance-cell">')),'Only OLT-ONU distance values receive the centered-cell class');
assert(css.includes('.na-onu-table .na-distance-cell{text-align:center}'),'OLT-ONU values are centered without changing other numeric columns');
assert(css.includes('.na-onu-table .na-identifier-value{font-size:calc(12px + var(--na-text-increment,0px))}'),'IP WAN values are 2px larger without enlarging SN/MAC');
assert(onuRows[0].includes('na-onu-status is-offline'),'Successful RX/positive IP does not override Offline');
assert(onuRows[0].includes('11/10/2026 15:04:03')&&onuRows[0].includes('12/10/2026 08:30:40'));
assert(onuRows[0].includes('<time class="is-latest-logout" datetime="2026-10-12T08:30:40"')&&!onuRows[0].includes('is-latest-logon'),'Only the newer Logout timestamp is orange');
assert(!onuRows[2].includes('is-latest-logon')&&!onuRows[2].includes('is-latest-logout'),'An open session with no Logout cannot compare two timestamps');
assert(!onuRows[5].includes('is-latest-'),'Invalid/missing dates do not receive recency colors');
assert(onuRows[0].includes('>CSOC</small>'));
assert(onuRows[1].includes('na-onu-status is-online'),'SNMP failure/missing IP does not override Online');
assert(!onuRows[1].includes('<time'));
assert(onuRows[2].includes('Phiên đang mở')&&onuRows[2].includes('>Inside</small>'));
assert(onuRows[3].includes('Chưa xác nhận'),'Default Offline must disclose that evidence is insufficient');
assert(onuRows[4].includes('na-onu-status is-unknown')&&!onuRows[4].includes('Phiên đang mở'),'Empty CSOC time fields are not an open Inside session');
assert(!onuRows[5].includes('<time')&&!onuRows[5].includes('Phiên đang mở'),'Invalid calendar dates/year-0001 placeholders never appear as usable dates');
assert(onuRows[6].includes('datetime="2026-10-12T03:20:30Z"')&&onuRows[6].includes('12/10/2026 03:20:30 Z'),'Do not shift timestamps to the browser timezone');
assert(onuRows[6].includes('12/10/2026 11:20:30.123 +07:00'));
assert(!get('dropPointCustomerRows').innerHTML.includes('<img'));
assert(onuRows[6].includes('&lt;img src=x onerror=alert(1)&gt; &quot;reason&quot;'),'Status explanation is HTML-escaped');
assert.equal(JSON.stringify(connectionResponse),testConnectionJson,'Rendering never mutates the response');
get('exportDropPoint').listeners.click();
assert.equal(JSON.stringify(JSON.parse(document.lastCSV)),testConnectionJson,'JSON export keeps all new fields and their raw values, including an explicitly empty Logout');
connectionResponse.result.customers=originalConnectionCustomers;
assert.equal(JSON.stringify(connectionResponse),originalConnectionJson,'Restore all original source fixtures');
checkTimer.callback();
assert(!get('dropPointCustomerRows').innerHTML.includes('Phiên đang mở'));
assert(css.includes('.na-session-event time.is-latest-logon{color:var(--na-green)}'));
assert(css.includes('.na-session-event time.is-latest-logout{color:var(--na-orange)}'));
for(const [last_logon,last_logout,tone] of [
  ['2026-10-12 10:00:00','2026-10-12 09:59:59','is-latest-logon'],
  ['2026-10-12T09:00:00+07:00','2026-10-12T03:00:00Z','is-latest-logout'],
  ['2026-10-12 10:00:00','2026-10-12T03:00:00Z',''],
  ['2026-10-12T03:00:00.0002Z','2026-10-12T03:00:00.0001Z','is-latest-logon'],
  ['2026-10-12T03:00:00.1Z','2026-10-12T03:00:00.100000Z',''],
  [null,'2026-10-12 10:00:00',''],
  ['2026-02-30 10:00:00','2026-10-12 10:00:00','']
]){
  const fixture=JSON.parse(originalConnectionJson);
  fixture.result.customers=[{...fixture.result.customers[0],last_logon,last_logout,onu_status:'Offline'}];
  const before=JSON.stringify(fixture);
  context.window.__testRenderDropPointResponse(fixture);
  const markup=get('dropPointCustomerRows').innerHTML;
  assert.equal((markup.match(/<time class="is-latest-/g)||[]).length,tone?1:0,'Color exactly one newer timestamp, none on equal/missing/invalid pairs');
  if(tone)assert(markup.includes(`<time class="${tone}"`),'Compare absolute instants and full fractional precision, not lexical dates or browser-local time');
  assert(markup.includes('na-onu-status is-offline'),'Time accents do not change the backend ONU status');
  assert.equal(JSON.stringify(fixture),before);
}
checkTimer.callback();
console.log('PASS: distinct ONU vs SNMP state, grouped session times, CSOC/Inside sources, open sessions, legacy/missing/invalid dates, preserved timezone, escaping and immutable responses.');
console.log('PASS: newer session timestamp colors only, ties/missing/invalid neutral, UTC+7 versus explicit offsets, sub-millisecond precision and unchanged backend status/source.');

// The latest complete user response replaces the earlier 9/10 excerpt.
const hnResponses=context.window.NETAUTO_DROP_POINT_RESPONSES.filter(response=>response.result.drop_point==='HNIP246.0096/HO');
assert.equal(hnResponses.length,1,'No duplicate/obsolete HNIP246 response');
const hnResponse=hnResponses[0],hnBefore=JSON.stringify(hnResponse);
assert.equal(hnResponse.result.customers.length,10);
assert.equal(hnResponse.result.count.success,10);
assert.equal(hnResponse.result.count.failed,0);
assert.equal(hnResponse.result.duration_ms,2634);
assert.deepEqual(Array.from(hnResponse.result.customers,customer=>customer.contract),['HNH646709','HNH260673','HNH704878','HNH709835','HNH234743','HND583266','HNH635550','HNAAG6115','HNAFN5540','HNH924206']);
assert.deepEqual(Array.from(hnResponse.result.customers,customer=>customer.onu_index),['2/12/53','2/12/1','2/12/22','2/12/42','2/12/23','2/12/37','2/12/36','2/12/12','2/12/59','2/12/27']);
for(const customer of hnResponse.result.customers){
  assert.equal(customer.status,true,'All ten RX reads succeeded, including Offline ONU');
  assert.equal(customer.connection_time_source,'csoc');
  assert.equal(customer.selected_candidate.onu_index,customer.onu_index);
  assert.equal(customer.selected_candidate.port_name,'G0/2/12');
  assert.equal(customer.selected_candidate.slot,'2');
  assert.equal(customer.selected_candidate.olt_ip,'10.85.48.67');
  assert.deepEqual(JSON.parse(JSON.stringify(customer.candidates[0])),JSON.parse(JSON.stringify(customer.selected_candidate)));
}
const hnOffline=hnResponse.result.customers.find(customer=>customer.contract==='HNH260673');
assert.equal(hnOffline.onu_status,'Offline');assert.equal(hnOffline.ipwan,null);assert.equal(hnOffline.onu.onu_rx,'-19.83');
const latestOptics=hnResponse.result.customers.find(customer=>customer.contract==='HNAFN5540').onu;
assert.equal(latestOptics.onu_rx,'-18.96');assert.equal(latestOptics.onu_tx,'2.77','Use latest telemetry rather than the earlier excerpt');
get('resetDropPoint').listeners.click();
get('dropPointInput').value='HNIP246.0096/HO';get('checkDropPoint').listeners.click();
[...timers.values()].filter(timer=>timer.delay===420).at(-1).callback();
const hnMarkup=get('dropPointCustomerRows').innerHTML;
const uplinkSource=context.window.NETAUTO_DROP_POINT_UPLINK_RESPONSE;
const uplinkBefore=JSON.stringify(uplinkSource);
const uplinkPoint=uplinkSource.payload[0];
const uplinkMarkup=get('dropPointUplinkPanel').innerHTML;
assert.equal(get('dropPointUplinkPanel').hidden,false);
assert(html.indexOf('id="dropPointUplinkPanel"')<html.indexOf('id="dropPointTablePanel"'),'Uplink context is above the customer table');
assert(uplinkMarkup.includes('Chi nhánh Hà Nội 11 (HN11)')&&uplinkMarkup.includes('HNIP246'));
assert(!uplinkMarkup.includes('Tỉnh / thành phố')&&!uplinkMarkup.includes('Ha Noi'),'Province/city is omitted from the UI, not deleted from the source');
assert(!uplinkMarkup.includes('na-route-preview')&&!uplinkMarkup.includes('Đầu tuyến')&&!uplinkMarkup.includes('Cuối tuyến'),'Remove the redundant start-to-end preview');
assert(css.includes('.na-route-nodes{display:flex;flex-wrap:wrap;gap:6px;'),'Route nodes wrap as compact content-sized tiles');
assert(css.includes('gap:7px;flex:0 0 auto;min-width:0;max-width:100%;padding:7px 9px;'),'Route tiles do not stretch to fill leftover row space');
const routeMarkup=[...uplinkMarkup.matchAll(/<details class="na-uplink-route">([\s\S]*?)<\/details>/g)].map(match=>match[1]);
assert.equal(routeMarkup.length,2,'Each BCC2 gets its own native keyboard-accessible disclosure');
assert(!uplinkMarkup.includes('<details class="na-uplink-route" open'),'Routes are compact and collapsed by default');
for(let i=0;i<2;i++){
  const sourceRoute=uplinkPoint.bcc2_and_uplink_parameters[i];
  const hops=sourceRoute.uplink_parameters.split('=>');
  assert.equal(hops.length,11);
  assert(routeMarkup[i].includes(sourceRoute.bcc2));
  assert(routeMarkup[i].includes('11 điểm'));
  assert(!routeMarkup[i].split('</summary>')[0].includes(hops[0]),'Collapsed summary only shows BCC2 and hop count');
  const expandedRoute=routeMarkup[i].slice(routeMarkup[i].indexOf('<ol class="na-route-nodes"'));
  const displayedHops=[...expandedRoute.matchAll(/<code title="([^"]+)">/g)].map(match=>match[1]);
  assert.deepEqual(displayedHops,hops,'Expanded route retains every hop in order, including repeats and intermediate nodes');
  assert.equal((routeMarkup[i].match(/class="na-route-step"/g)||[]).length,11);
}
assert(css.includes('@media(prefers-reduced-motion:reduce){.na-route-body{animation:none}'),'Route expansion respects reduced-motion preferences');
assert.equal(JSON.stringify(uplinkSource),uplinkBefore,'Uplink rendering never mutates the raw endpoint response');
assert(uplinkMarkup.includes('Dữ liệu demo'),'The standalone fixture is explicitly labelled demo');
const renderLive=context.window.__testRenderDropPointResponse;
const liveResponse=JSON.parse(hnBefore);
liveResponse.result.uplink=JSON.parse(uplinkBefore);
liveResponse.result.uplink.payload.unshift({tap_diem:'OTHER/HO',name_branch:'Wrong branch'});
liveResponse.result.uplink.payload[1].name_branch='Live branch <script>alert(1)</script>';
const liveBefore=JSON.stringify(liveResponse);
renderLive(liveResponse);
assert.equal(get('dropPointUplinkPanel').hidden,false);
assert(get('dropPointUplinkPanel').innerHTML.includes('CSOC · kết quả API'));
assert(get('dropPointUplinkPanel').innerHTML.includes('Live branch &lt;script&gt;alert(1)&lt;/script&gt;'));
assert(!get('dropPointUplinkPanel').innerHTML.includes('Wrong branch'),'Select the payload matching result.drop_point, not the first item');
assert(!get('dropPointUplinkPanel').innerHTML.includes('Dữ liệu demo'),'Live envelope wins over standalone demo');
assert.equal(JSON.stringify(liveResponse),liveBefore);
for(const unavailable of [null,undefined,{success:false,payload:[uplinkPoint]},{success:true,payload:[]},{success:true,payload:[{...uplinkPoint,tap_diem:'OTHER/HO'}]},{success:true,payload:[{...uplinkPoint,bcc2_and_uplink_parameters:[]}]},{success:true,payload:[{...uplinkPoint,bcc2_and_uplink_parameters:[{bcc2:'Empty route',uplink_parameters:' => '}]}]}]){
  liveResponse.result.uplink=unavailable;
  liveResponse.result.warnings=['Chưa lấy được tuyến uplink <img src=x onerror=alert(1)>'];
  renderLive(liveResponse);
  assert.equal(get('dropPointUplinkPanel').hidden,true,'Unavailable live uplink must not fall back to demo');
  assert.equal(get('dropPointUplinkPanel').innerHTML,'');
  assert.equal(get('dropPointUplinkMessage').hidden,false,'Failed/empty uplink only displays a text message');
  assert.equal(get('dropPointUplinkMessage').textContent,liveResponse.result.warnings[0],'Preserve the backend warning as plain text, never HTML');
  assert.equal(get('dropPointUplinkMessage').innerHTML,'');
  assert.equal(get('dropPointWarnings').hidden,true,'Do not duplicate the uplink message in the ONU warning panel');
  assert.equal((get('dropPointCustomerRows').innerHTML.match(/<tr>/g)||[]).length,10,'Uplink warning never removes customer results');
}
delete liveResponse.result.uplink;
delete liveResponse.result.warnings;
renderLive(liveResponse);
assert.equal(get('dropPointUplinkPanel').hidden,true,'A live object without uplink never inherits a demo fixture');
assert.equal(get('dropPointUplinkMessage').hidden,false);
assert.equal(get('dropPointUplinkMessage').textContent,'Chưa có dữ liệu tuyến uplink cho tập điểm này.');
assert.equal(get('dropPointWarnings').hidden,true,'Warnings clear when switching away from a warning response');
liveResponse.result.uplink={success:false,message:'Không lấy được tuyến uplink từ CSOC.',payload:[]};
liveResponse.result.warnings=['Cảnh báo dữ liệu khách hàng khác'];
renderLive(liveResponse);
assert.equal(get('dropPointUplinkMessage').textContent,'Không lấy được tuyến uplink từ CSOC.');
assert(get('dropPointWarnings').innerHTML.includes('Cảnh báo dữ liệu khách hàng khác'),'Keep unrelated backend warnings');
renderLive({...liveResponse,result:{drop_point:'HNIP246.0096/HO',customers:[],uplink:JSON.parse(uplinkBefore)}});
assert.equal(get('dropPointUplinkPanel').hidden,false,'An empty PortNet customer result can still show live uplink');
assert.equal(get('dropPointUplinkMessage').hidden,true,'Successful route clears previous failure message');
assert.equal(get('dropPointCustomerRows').innerHTML,'');
assert(get('dropPointResultCount').textContent.includes('0 / 0'));
// Even a known demo object must honor an explicit backend null.
hnResponse.result.uplink=null;
renderLive(hnResponse);
assert.equal(get('dropPointUplinkPanel').hidden,true);
delete hnResponse.result.uplink;
renderLive(hnResponse);
assert.equal(get('dropPointUplinkPanel').hidden,false);
assert.equal(JSON.stringify(hnResponse),hnBefore);
assert.equal((hnMarkup.match(/<tr>/g)||[]).length,10);
assert.equal((hnMarkup.match(/na-onu-status is-online/g)||[]).length,9);
assert.equal((hnMarkup.match(/na-onu-status is-offline/g)||[]).length,1);
assert.equal((hnMarkup.match(/<time /g)||[]).length,20);
assert.equal((hnMarkup.match(/<time class="is-latest-logon"/g)||[]).length,8,'Eight strictly newer logons are green; the equal pair stays neutral');
assert.equal((hnMarkup.match(/<time class="is-latest-logout"/g)||[]).length,1,'The only strictly newer logout is orange');
assert.equal(get('dropPointDataNotice').hidden,true,'Complete response has no incomplete-data notice');
assert.equal(get('dropPointDataBadge').textContent,'Dữ liệu thật');
assert(get('dropPointResultCount').textContent.includes('10 / 10'));
assert(get('dropPointStats').innerHTML.includes('Thời gian xử lý (ms)'));
assert(get('dropPointStats').innerHTML.includes('<strong>2.634</strong>'),'Processing time displays source milliseconds, not seconds');
get('exportDropPoint').listeners.click();
assert.equal(JSON.stringify(JSON.parse(document.lastCSV)),hnBefore,'Export preserves the entire supplied response');
assert.equal(JSON.stringify(hnResponse),hnBefore);
get('resetDropPoint').listeners.click();
assert.equal(get('dropPointUplinkPanel').hidden,true,'Reset clears supplemental uplink context');
assert.equal(get('dropPointUplinkPanel').innerHTML,'');
assert.equal(get('dropPointUplinkMessage').hidden,true,'Reset also clears the text-only uplink notice');
get('dropPointInput').value=connectionResponse.result.drop_point;get('checkDropPoint').listeners.click();
[...timers.values()].filter(timer=>timer.delay===420).at(-1).callback();
assert.equal(get('dropPointUplinkPanel').hidden,true,'Other real responses never inherit the HNIP246 route');
assert.equal(get('dropPointUplinkPanel').innerHTML,'');
console.log('PASS: complete HNIP246 user snapshot, 10 RX successes vs 9 Online/1 Offline, 20 session timestamps, latest optics, source/candidate integrity and lossless JSON export.');
console.log('PASS: supplemental uplink response, compact BCC2 disclosures, all 22 source-ordered hops including repeats, reduced motion, immutable source and clean reset/other-point isolation.');
console.log('PASS: backend result.uplink priority, exact point matching, null/error/missing envelope isolation, explicit demo label, escaped warnings, empty customer result and unchanged counters/source responses.');

const layer0Css = css.slice(css.indexOf('/* Approved POP Layer 0 only.'));
assert(layer0Css.includes('#popPage #popSearch:focus-visible{outline:none;box-shadow:none}'));
assert(layer0Css.includes('.na-pop-metrics>span{display:flex;align-items:center;justify-content:flex-start;gap:7px'));
assert(layer0Css.includes('.na-stat-card>span{font-size:13px;font-weight:650'));
const popGridCSS=fs.readFileSync(path.join(mockup,'shared/netauto-pop-table.css'),'utf8');
assert(popGridCSS.includes('#popPage .na-pop-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}'));
for(const width of [1099,819,539])assert(popGridCSS.includes(`@container pop-cards (max-width:${width}px)`));
assert(popGridCSS.includes('repeat(3,minmax(0,1fr))')&&popGridCSS.includes('repeat(2,minmax(0,1fr))')&&popGridCSS.includes('grid-template-columns:minmax(0,1fr)'));
assert(popGridCSS.includes('@supports not (container-type:inline-size)'));
assert(html.indexOf('shared/netauto-pop-table.css')>html.indexOf('shared/netauto-shell.css'),'Scoped responsive four-card layout overrides the legacy grid without affecting other layers');
console.log('PASS: Layer 0 colors, source counts, 3 scopes, filters/search/reset, full-page detail and return, Light/Dark, unchanged plans and real ONU response.');

// Layer 1: exercise interactions against the actual controller and dataset.
const openDetail = code => get('popGrid').listeners.click({target: {closest: selector => selector==='[data-pop-detail]'?({dataset: {popDetail: code}}):null}});
const dataset = context.window.NETAUTO_POP_DETAIL_DATA;
const headerTagCounts=()=>new Map([...get('detailDeviceTypeStats').innerHTML.matchAll(/data-kind="([^"]+)"[^>]*>[\s\S]*?<b>([^<]+)<\/b>/g)].map(match=>[match[1],Number(match[2].replaceAll('.',''))]));
openDetail('AGGP006');
assert.equal(get('popOverviewPanel').hidden, false);
assert.equal(get('popMaterialsPanel').hidden, true);
assert(!html.includes('id="detailDeviceTotal"'),'Remove the redundant full-snapshot device-count badge');
assert.deepEqual([...headerTagCounts()],[['SWITCH',1],['OLT',3],['POWER',2],['PI',1]]);
assert.equal([...headerTagCounts().values()].reduce((sum,count)=>sum+count,0),7);
assert.equal((get('detailDeviceGroups').innerHTML.match(/data-l1-device=/g) || []).length, 7);
assert.equal((get('detailDeviceGroups').innerHTML.match(/class="l1-device-lane"/g)||[]).length,2);
assert(!get('detailDeviceGroups').innerHTML.includes('class="l1-device-group'));
assert(!get('detailDeviceGroups').innerHTML.includes('↗'),'Device cards should not have corner arrows');
assert(get('detailDeviceGroups').innerHTML.includes('AGGP00601OPMS'));
assert(get('detailPopFields').innerHTML.includes('<span>Địa chỉ</span>'));
assert(get('detailPopFields').innerHTML.includes('<span>Tổng khách hàng</span>'));
assert.equal((get('detailPopFields').innerHTML.match(/data-demo="true"/g)||[]).length,5);
assert(!get('detailPopFields').innerHTML.includes('<dd>—</dd>'));
assert(!html.includes('id="detailPopMetadataNote"'));
assert(!html.includes('Chọn thiết bị để mở trang chi tiết.'));
assert(!Object.hasOwn(allPops.find(pop=>pop.code==='AGGP006'),'customerCount'),'Sample metadata must never be written into the imported snapshot');
assert.equal((get('detailPopFields').innerHTML.match(/<svg /g)||[]).length,5,'Every additional field has one small icon');
assert.equal((get('detailPopLocation').innerHTML.match(/<svg /g)||[]).length,4);
assert.equal((get('detailPopLocation').innerHTML.match(/<dt>/g)||[]).length,4,'Location is a compact four-field strip below the POP name');
assert(get('detailPopLocation').innerHTML.includes('<dt>Miền</dt>'));
assert(get('detailPopLocation').innerHTML.includes('<dd>Miền Nam</dd>'));
assert(get('detailPopLocation').innerHTML.includes('<dt>Chi nhánh</dt>'));
assert(get('detailPopLocation').innerHTML.includes('<dd>AGG</dd>'));
assert.equal((get('detailPopFields').innerHTML.match(/<dt>/g)||[]).length,5,'All additional metadata and the address remain visible');
assert.equal((get('detailPopFields').innerHTML.match(/class="l1-pop-field"/g)||[]).length,4);
assert(get('detailPopFields').innerHTML.includes('class="is-address"'));
assert(!html.includes('popDrawerBackdrop'), 'Layer 1 must not use the old overlay');
assert.equal(get('smartpopDisclosure').open,false,'SmartPOP starts collapsed on each POP');
assert(!/<details[^>]*id="smartpopDisclosure"[^>]*\bopen\b/.test(html));
assert(!html.includes('id="detailPiDemo"'));
get('smartpopDisclosure').open=true;get('smartpopDisclosure').listeners.toggle();
context.window.NETAUTO_POP_DETAIL.refreshInventory('AGGP006');
assert.equal(get('smartpopDisclosure').open,true,'Refreshing inventory does not collapse the same POP');
get('smartpopDisclosure').open=false;get('smartpopDisclosure').listeners.toggle();
assert(get('detailPiSource').innerHTML.includes('class="sp-controller-tag"'),'Controller name and IP are wrapped in inventory source tags');
context.window.NETAUTO_SMARTPOP.useBoundSource();
assert(get('detailPiSignals').innerHTML.includes('Chưa có cấu hình SmartPOP được ghép với POP này'));
context.window.NETAUTO_SMARTPOP.selectReference('capture:172.18.86.217');
assert(get('detailPiSignals').innerHTML.includes('172.18.86.217'));
assert(!get('detailPiSignals').innerHTML.includes('sp-readiness'));
assert.equal(get('detailTopoPanel').hidden, true);
get('detailTopoToggle').listeners.click();
assert.equal(get('detailTopoPanel').hidden, false);
assert.equal(get('popTopoDialog').open,true);
assert.equal(document.body.style.overflow,'hidden');
assert.equal(document.activeElement.id,'closePopTopo');
assert.equal(get('detailTopoToggle').attrs['aria-expanded'], 'true');
assert(get('topoContent').innerHTML.includes('HCMP58802ZA62'));
assert(get('topoContent').innerHTML.includes('không phải topo của POP AGGP006'));
assert(get('topoContent').innerHTML.includes('7.63'));
const topoAction = (selector,dataset) => get('detailTopoPanel').listeners.click({target:{closest: value => value === selector ? {dataset} : null}});
get('topoPorts').checked=false;
get('detailTopoPanel').listeners.change({target:get('topoPorts')});
assert(get('topoCanvas').classList.contains('is-ports-hidden'));
get('topoTraffic').checked=false;
get('detailTopoPanel').listeners.change({target:get('topoTraffic')});
assert(get('topoCanvas').classList.contains('is-traffic-hidden'));
topoAction('[data-topo-zoom]',{topoZoom:'in'});
assert.equal(get('topoScaleLabel').textContent,'115%');
get('topoViewport').clientWidth=800;
topoAction('[data-topo-zoom]',{topoZoom:'fit'});
assert.equal(get('topoScaleLabel').textContent,'78%');
topoAction('[data-topo-node]',{topoNode:'di'});
assert.equal(get('topoSelection').hidden,false);
assert(get('topoSelection').innerHTML.includes('Eth31 · Eth32 · Eth7'));
topoAction('[data-topo-close]',{});
assert.equal(get('topoSelection').hidden,true);
topoAction('[data-topo-mode]',{topoMode:'current'});
assert(get('topoContent').innerHTML.includes('CE701001AGGP00601HW63'));
assert(get('topoContent').innerHTML.includes('Chưa có dữ liệu liên kết LLDP'));
assert(!get('topoContent').innerHTML.includes('l1-topo-edges'));
get('detailTopoToggle').listeners.click();
assert.equal(get('detailTopoPanel').hidden, true);
assert.equal(get('popTopoDialog').open,false);
assert.equal(document.activeElement.id,'detailTopoToggle');
get('detailTopoToggle').listeners.click();
get('popTopoDialog').listeners.click({target:get('popTopoDialog'),clientX:500,clientY:500});
assert.equal(get('popTopoDialog').open,true,'Clicks inside dialog bounds must not close it');
get('popTopoDialog').listeners.click({target:get('popTopoDialog'),clientX:0,clientY:0});
assert.equal(get('popTopoDialog').open,false,'Backdrop clicks close the topology');
get('detailTopoToggle').listeners.click();
get('closePopTopo').listeners.click();
assert.equal(get('popTopoDialog').open,false);
assert.equal(get('detailTopoToggle').attrs['aria-expanded'],'false');
const switchIndex = dataset.pops.AGGP006.findIndex(device => device.name === 'CE701001AGGP00601HW63');
get('detailDeviceGroups').listeners.click({target: {closest: () => ({dataset: {l1Device: String(switchIndex)}})}});
assert.equal(get('deviceDetailPage').hidden,false);
assert.equal(get('popDetailPage').hidden,true);
assert.equal(context.location.hash,'#pop/AGGP006/device/CE701001AGGP00601HW63');
assert.equal(get('deviceDetailName').textContent,'CE701001AGGP00601HW63');
assert(get('deviceDetailFields').innerHTML.includes('102255807334'));
assert(get('deviceDetailRows').innerHTML.includes('20180105F4575'));
assert(!html.includes('detailDeviceInspector'));
get('deviceDetailMaterialSearch').value='20180105F4575';get('deviceDetailMaterialSearch').listeners.input();
assert.equal((get('deviceDetailRows').innerHTML.match(/<tr>/g)||[]).length,1);
get('backToPopDetail').listeners.click();
assert.equal(get('popDetailPage').hidden,false);
assert.equal(get('deviceDetailPage').hidden,true);
get('popMaterialsTab').listeners.click();
get('popInventoryViewButton').listeners.click();
get('detailMaterialDevice').value=String(switchIndex);get('detailMaterialDevice').listeners.change();
assert.equal(get('popOverviewPanel').hidden, true);
assert.equal(get('popMaterialsPanel').hidden, false);
assert.equal(get('popInventoryView').hidden,false);
assert.equal(get('popAssetView').hidden,true);
assert.equal(get('popMaterialsTab').attrs['aria-selected'], 'true');
assert(get('detailMaterialRows').innerHTML.includes('20180105F4575'));
assert.equal((get('detailMaterialRows').innerHTML.match(/<tr>/g) || []).length, dataset.pops.AGGP006[switchIndex].materials.length);
get('detailMaterialCategory').value = 'transceiver'; get('detailMaterialCategory').listeners.change();
assert.equal((get('detailMaterialRows').innerHTML.match(/<tr>/g) || []).length, 13);
get('detailMaterialSearch').value = '20180105F4575'; get('detailMaterialSearch').listeners.input();
assert.equal((get('detailMaterialRows').innerHTML.match(/<tr>/g) || []).length, 1);
get('popMaterialsTab').listeners.keydown({key: 'Home', preventDefault() {}});
assert.equal(get('popOverviewPanel').hidden, false);
get('detailDeviceSearch').value = '11.67.61.91'; get('detailDeviceSearch').listeners.input();
assert.deepEqual([...headerTagCounts()],[['SWITCH',1],['OLT',3],['POWER',2],['PI',1]],'Header statistics describe the whole POP, not the current device search');
assert.equal((get('detailDeviceGroups').innerHTML.match(/data-l1-device=/g) || []).length, 1);
get('detailDeviceGroups').listeners.click({target:{closest:()=>({dataset:{l1Device:String(switchIndex)}})}});
get('backToPopDetail').listeners.click();
assert.equal(get('detailDeviceSearch').value,'11.67.61.91','Device back must retain the POP device search');
assert.equal((get('detailDeviceGroups').innerHTML.match(/data-l1-device=/g)||[]).length,1);
openDetail('QNHP054');
assert.equal(get('detailTopoPanel').hidden, true);
assert.equal(get('detailMaterialSearch').value, '');
assert.equal(get('detailMaterialDevice').value, 'all');
assert.equal(get('popInventoryView').hidden,true);
assert.equal(get('popAssetView').hidden,false);
assert.equal(get('popOverviewPanel').hidden, false);
assert.equal(get('detailDeviceSearch').value, '');
assert(get('detailPopLocation').innerHTML.includes('Miền Bắc'));
context.location.hash = '#pop/HCMP160'; context.window.listeners.hashchange();
assert.equal(get('detailPopName').textContent, 'HCMP160');
context.location.hash='#pop/AGGP006/device/CE701001AGGP00601HW63';context.window.listeners.hashchange();
assert.equal(get('deviceDetailPage').hidden,false);
assert.equal(get('deviceDetailName').textContent,'CE701001AGGP00601HW63');
context.location.hash='#pop/AGGP006/device/%E0%A4%A';context.window.listeners.hashchange();
assert.equal(get('popDetailPage').hidden,false,'Invalid device URL must safely fall back to its POP');
assert.equal(get('detailPopName').textContent,'AGGP006');
context.location.hash = '#pop'; context.window.listeners.popstate();
assert.equal(get('popPage').hidden, false);
assert.equal(get('popDetailPage').hidden, true);
context.location.hash = '#customer'; context.window.listeners.hashchange();
assert.equal(get('customerPage').hidden, false);
assert.equal(get('popDetailPage').hidden, true);
console.log('PASS: compact 2-lane devices, full Layer 2 navigation/return, real inventory, filtering, modal topology/backdrop/close/focus, tabs, deep-link routes and safe URL fallback.');

// The asset table must retain photographed data and never assign AGGP015 to QNHP054.
openDetail('QNHP054');
assert.equal((get('popAssetRows').innerHTML.match(/<tr>/g)||[]).length,10);
assert.equal(get('popAssetContextTitle').textContent,'Tài sản POP AGGP015');
assert(get('popAssetContextNote').textContent.includes('không phải tài sản của POP QNHP054'));
assert(get('popAssetRows').innerHTML.includes('1776775'));
assert(get('popAssetRows').innerHTML.includes('5.040'));
assert(get('popAssetFooterNote').textContent.includes('10 / 91'));
assert(!html.includes('Mã SC'));
assert(!html.includes('Mã sc'));
get('popAssetSearch').value='1776775';get('popAssetSearch').listeners.input();
assert.equal((get('popAssetRows').innerHTML.match(/<tr>/g)||[]).length,1);
get('popAssetExport').listeners.click();
assert.equal(document.lastDownload,'tai-san-AGGP015-trich-anh.csv');
assert(document.lastCSV.includes('1776775'));
assert(!document.lastCSV.includes('1776770'),'CSV must respect the search filter');
assert(!document.lastCSV.includes('Mã SC'));
get('popAssetSearch').value='';get('popAssetSearch').listeners.input();
get('popAssetPageSize').value='5';get('popAssetPageSize').listeners.change();
assert.equal(get('popAssetPageCount').textContent,'1–5 / 10');
assert.equal(get('popAssetNext').disabled,false);
get('popAssetNext').listeners.click();
assert.equal(get('popAssetPageCount').textContent,'6–10 / 10');
assert.equal(get('popAssetNext').disabled,true);
get('popAssetPrev').listeners.click();
assert.equal(get('popAssetPageCount').textContent,'1–5 / 10');
get('popAssetSource').value='current';get('popAssetSource').listeners.change();
assert.equal(get('popAssetContextTitle').textContent,'Tài sản POP QNHP054');
assert(get('popAssetRows').innerHTML.includes('Chưa có dữ liệu tài sản'));
assert(!get('popAssetRows').innerHTML.includes('1776775'));
assert.equal(get('popAssetExport').disabled,true);
assert(html.includes('Giám sát &amp; Cảnh báo'));
assert(!html.includes('Đánh giá POP'));
assert(!html.includes('l1-rating'));
assert(/<section class="l1-hero"[^>]*>[\s\S]*?<\/article>\s*<\/section>\s*<section class="l1-section l1-pi"/.test(html),'Monitoring must be its own full-width section directly below POP information');
assert(html.indexOf('id="popPiTitle"')<html.indexOf('id="popDevicesTitle"'));
assert(get('detailDeviceGroups').innerHTML.includes('Nguồn &amp; Giám sát') || get('detailDeviceGroups').innerHTML.includes('Nguồn & Giám sát'));
assert(get('detailPiSignals').innerHTML.includes('class="sp-overview-grid sp-monitor-strip"'));
assert(!get('detailPiSignals').innerHTML.includes('sp-reading-panel'),'Peripheral readings are only rendered inside their dialog');
assert.equal((get('detailPiSignals').innerHTML.match(/data-sp-device=/g)||[]).length,3);
assert.equal((get('detailPiSignals').innerHTML.match(/data-sp-alarm-open=/g)||[]).length,4);
assert(!get('detailPiSignals').innerHTML.includes('1 Critical'));
console.log('PASS: photographed asset rows, no SC column, source distinction, search/pagination, real SmartPOP capture with explicit reference source and no live/POP mapping assumptions, topology zoom/toggles/selection and no invented current-POP links.');
openDetail('AGGP000');
assert.deepEqual([...headerTagCounts()],[['SWITCH',1],['OLT',0],['POWER',0],['PI',0]],'Zero counts remain explicit for sparse POPs');
assert.equal((get('detailDeviceGroups').innerHTML.match(/class="l1-device-lane"/g)||[]).length,1,'Sparse POP should not create an empty infrastructure panel');
assert.equal((get('detailDeviceGroups').innerHTML.match(/data-l1-device=/g)||[]).length,1);
get('detailTopoToggle').listeners.click();
context.location.hash='#customer';context.window.listeners.hashchange();
assert.equal(get('popTopoDialog').open,false,'Navigation must close the modal and release background');
assert.notEqual(document.body.style.overflow,'hidden');

// Simulate slower static-file loading; metadata remains available immediately.
// Interleaved source records must render Switch -> OLT and Power -> PI.
const dni=allPops.find(pop=>pop.code==='DNIP010');
const sourceOrder=JSON.stringify(dni.devices);
openDetail(dni.code);
const visibleIndices=[...get('detailDeviceGroups').innerHTML.matchAll(/data-l1-device="(\d+)"/g)].map(match=>Number(match[1]));
assert.deepEqual(visibleIndices.map(index=>dni.devices[index].type),['SWITCH','SWITCH','OLT','OLT','POWER','POWER','PI']);
assert.equal(JSON.stringify(dni.devices),sourceOrder,'Display sorting must not mutate source metadata');
get('detailDeviceGroups').listeners.click({target:{closest:()=>({dataset:{l1Device:String(visibleIndices[1])}})}});
assert.equal(get('deviceDetailName').textContent,dni.devices[visibleIndices[1]].name,'Reordered cards must still open the correct device');
get('backToPopDetail').listeners.click();
get('detailDeviceSearch').value='11.60.';get('detailDeviceSearch').listeners.input();
const filteredIndices=[...get('detailDeviceGroups').innerHTML.matchAll(/data-l1-device="(\d+)"/g)].map(match=>Number(match[1]));
const ranks={SWITCH:0,OLT:1,POWER:2,PI:3};
assert(filteredIndices.every((index,pos)=>!pos||ranks[dni.devices[filteredIndices[pos-1]].type]<=ranks[dni.devices[index].type]),'Filtered cards preserve type ordering');
console.log('PASS: Switch before OLT, Power before PI, stable source data and correct navigation after sorting/filtering.');

const scripts=[];
document.head.appendChild=script=>scripts.push(script);
const flushScript=script=>{vm.runInNewContext(fs.readFileSync(path.join(mockup,script.src),'utf8'),context);script.onload();};
openDetail('BDGP007');
assert.equal(dataset.status('BDGP007'),'loading');
assert.deepEqual([...headerTagCounts()],[['SWITCH',2],['OLT',5],['POWER',2],['PI',1]],'Statistics are available before inventory finishes loading');
assert.equal((get('detailDeviceGroups').innerHTML.match(/data-l1-device=/g)||[]).length,10);
assert(get('detailMaterialRows').innerHTML.includes('Đang nạp inventory'));
const bdg=allPops.find(pop=>pop.code==='BDGP007');
get('detailDeviceGroups').listeners.click({target:{closest:()=>({dataset:{l1Device:'0'}})}});
assert.equal(scripts.length,1,'Concurrent POP/device requests must share one chunk');
assert(get('deviceDetailRows').innerHTML.includes('Đang nạp inventory'));
get('deviceDetailMaterialSearch').value=bdg.devices[0].chassisSerials[0]||'Chassis';
get('deviceDetailMaterialSearch').listeners.input();
get('devicePortSearch').value='G0';
const pendingSearch=get('deviceDetailMaterialSearch').value;
flushScript(scripts.shift());
assert(dataset.isLoaded('BDGP007'));
assert.deepEqual([...headerTagCounts()],[['SWITCH',2],['OLT',5],['POWER',2],['PI',1]],'Loading inventory keeps header statistics accurate');
assert.equal(get('deviceDetailMaterialSearch').value,pendingSearch,'Loading inventory must preserve the active search');
assert.equal(get('devicePortSearch').value,'G0','Loading inventory must preserve the port search');
assert(!get('deviceDetailRows').innerHTML.includes('Đang nạp inventory'));
get('backToPopDetail').listeners.click();
assert.equal(scripts.length,0,'Loaded POPs use the cache');

// Errors / timeouts can be retried; late loads cannot replace a different POP.
openDetail('AGGP015');
scripts.shift().onerror();
assert.equal(dataset.status('AGGP015'),'error');
assert(get('detailMaterialRows').innerHTML.includes('Không tải được inventory'));
openDetail('AGGP015');
assert.equal(dataset.status('AGGP015'),'loading');
const late=scripts.shift();
openDetail('AGGP006');
flushScript(late);
assert.equal(get('detailPopName').textContent,'AGGP006');
assert.equal((get('detailDeviceGroups').innerHTML.match(/data-l1-device=/g)||[]).length,7);
const retryCode=allPops.find(pop=>pop.province==='BDG'&&!dataset.isLoaded(pop.code)).code;
openDetail(retryCode);
const timedOut=scripts.shift();
const loadTimer=[...timers.values()].find(timer=>timer.delay===15000);
assert(loadTimer);
loadTimer.callback();
assert.equal(dataset.status(retryCode),'error');
openDetail(retryCode);
flushScript(scripts.shift());
assert(dataset.isLoaded(retryCode));
timedOut.onerror();
assert(dataset.isLoaded(retryCode),'A stale failure must not overwrite a successful retry');

// POPs belonging to multiple branches must match either assigned branch.
get('backToPopList').listeners.click();
const multiBranchPop=allPops.find(pop=>pop.branches.length>1);
mode('many');search(multiBranchPop.code);assert.equal(count(),1);
for(const branch of multiBranchPop.branches){reset();search(multiBranchPop.code);filter('branch',branch);assert.equal(count(),1,'A multi-branch POP matches either assigned branch');}
reset();
get('popPageSize').value='36';get('popPageSize').listeners.change();
mode('many');get('popLoadMore').listeners.click();
search('AGGP006');
assert(get('popPageCount').textContent.includes('1 / 1 POP · Đã hết danh sách'),'Search resets accumulated rows');
assert.equal(cardHues().size,1);
console.log('PASS: delayed inventory, concurrent request coalescing, preserved search, cache, errors/timeouts/retry, safe late loads, multi-branch POPs and pagination reset.');

// Entering Layer 0 renews its single-province accent, not subsequent renders.
const beforeReentry=cardHues().get('AGGP006');
context.location.hash='#customer';context.window.listeners.hashchange();
assert.equal(Number(storage.get('netauto.pop.singleProvinceHue')),beforeReentry,'Leaving POP must not select an unused color');
context.location.hash='#pop';context.window.listeners.hashchange();
const afterReentry=cardHues().get('AGGP006');
assert.notEqual(afterReentry,beforeReentry,'Returning from another module chooses a new color');
context.window.listeners.popstate();
context.window.listeners.hashchange();
assert.equal(cardHues().get('AGGP006'),afterReentry,'Duplicate history notifications are not additional visits');
get('themeButton').listeners.click();
assert.equal(cardHues().get('AGGP006'),afterReentry,'Changing theme does not randomize the hue');

// Recreate the app controller with retained preferences / form values, as on reload.
context.Math=Object.create(Math);
context.Math.random=()=>0;
vm.runInNewContext(fs.readFileSync(path.join(mockup,'shared/netauto-app.js'),'utf8'),context,{filename:'netauto-app.js (reload)'});
const reloadHue=cardHues().get('AGGP006');
assert.notEqual(reloadHue,afterReentry,'Reload avoids the previous saved accent, even with restored search text');
assert.equal(Number(storage.get('netauto.pop.singleProvinceHue')),reloadHue);
mode('one');
assert.equal(new Set(cardHues().values()).size,1);
for(const hue of cardHues().values())assert.equal(hue,reloadHue);
mode('three');reset();mixedProvinceColors();
for(const [code,hue]of cardHues())if(initialHues.has(code))assert.equal(hue,initialHues.get(code),'Multi-province colors remain stable between visits');
console.log('PASS: uniform single-province color, fresh accents on re-entry/reload, stable pagination/search/theme/history and unchanged distinct multi-province accents.');

// Explicit samples fill only missing metadata; real values, including zero, win.
const popForMetadata=allPops.find(pop=>pop.code==='AGGP006');
context.window.NETAUTO_POP_DETAIL.open(popForMetadata);
const firstSample=get('detailPopFields').innerHTML;
for(const value of ['Outdoor','POP AON+PON','727','Góc Hồ Xuân Hương - Nguyễn Thông','03-11-2003'])assert(firstSample.includes('<dd>'+value+'</dd>'),'Requested POP metadata example: '+value);
context.window.NETAUTO_POP_DETAIL.open(popForMetadata);
assert.equal(get('detailPopFields').innerHTML,firstSample,'Metadata samples stay stable across visits');
context.window.NETAUTO_POP_DETAIL.open({...popForMetadata,popType:'Loại từ nguồn',deployedAt:'01/01/2024',popFunction:'Chức năng từ nguồn',customerCount:0,address:'12 đường thật <Kiểm tra>'});
assert.equal((get('detailPopFields').innerHTML.match(/data-demo="false"/g)||[]).length,5);
assert(get('detailPopFields').innerHTML.includes('<dd>0</dd>'));
assert(get('detailPopFields').innerHTML.includes('Loại từ nguồn'));
assert(get('detailPopFields').innerHTML.includes('12 đường thật &lt;Kiểm tra&gt;'));
assert(!html.includes('id="detailPopMetadataNote"'));
console.log('PASS: compact location strip, five metadata tiles/address, small icons, explicit stable samples, immutable source and real-value/zero precedence.');

// Layer 2 port workspace uses the same snapshot, real controllers and actual HTML IDs.
const devicePage=context.window.NETAUTO_DEVICE_DETAIL;
const realGcom=dataset.pops.AGGP006.find(device=>device.model==='GC16');
const originalGcom=JSON.stringify(realGcom);
devicePage.open(popForMetadata,realGcom);
assert.equal(get('devicePortsPanel').hidden,false);
assert.equal(get('deviceInventoryPanel').hidden,true);
assert.equal(get('deviceHardwarePanel').hidden,false);
assert.equal(get('devicePortGridContent').hidden,true,'Faceplate is the default view, not the replacement port grid');
assert(html.includes('href="shared/device-port-workspace.css"'),'Use the actual standalone workspace stylesheet');
assert(html.includes('class="pw-inspector pw-tool-dock"'),'Use the same full-width below-faceplate tool dock');
assert.equal((html.match(/id="devicePortToolbar"/g)||[]).length,1,'Both views share one toolbar');
assert(html.indexOf('id="devicePortToolbar"')<html.indexOf('id="deviceHardwarePanel"'));
assert(html.indexOf('id="devicePortToolbar"')<html.indexOf('id="devicePortGridContent"'));
assert(/id="deviceFaceView"[^>]*>Giả lập<\/button>/.test(html));
assert(/id="deviceGridView"[^>]*>Mô phỏng<\/button>/.test(html));
assert(!/cổng|giao diện/i.test(html),'Main UI terminology uses port and Interface consistently');
assert(get('devicePortCount').textContent.includes('port'));
assert(!/cổng/i.test(get('devicePortBanks').innerHTML));
assert(!/cổng/i.test(get('deviceHardware').innerHTML));
assert(!html.includes('Lưới Port'));
const portCss=fs.readFileSync(path.join(mockup,'shared/netauto-device-ports.css'),'utf8');
assert(portCss.includes('#deviceDetailPage .pw-hardware{width:var(--face-chassis-width,max-content);min-width:0}'),'Faceplate shell uses its actual bank width instead of stretching across the viewport');
assert(portCss.includes('grid-template-columns:var(--face-grid-columns,max-content)'),'Every faceplate uses its computed responsive bank tracks');
assert(portCss.includes('grid-row:var(--face-bank-row,auto);grid-column:var(--face-bank-column,auto)'),'Banks use planner-owned rows and columns, not model-specific CSS');
assert(portCss.includes('border:1px solid color-mix(in srgb,var(--na-muted) 24%,var(--na-line))'),'Port group outlines are slightly stronger without increasing border thickness');
assert(portCss.includes('#devicePortInspector:not([hidden]){animation:na-port-dock-enter 180ms'));
assert(portCss.includes('.pw-tool-dock{grid-template-columns:minmax(0,1fr) minmax(0,2fr)}'),'Port/module information uses one third of the dock; tools occupy the remaining right side');
assert(portCss.includes('@media(max-width:980px){#deviceDetailPage .pw-tool-dock{grid-template-columns:1fr}'),'Only narrow screens stack the port dock');
assert(portCss.includes('#devicePortMenu:not([hidden]){animation:na-port-menu-enter 140ms'));
assert(portCss.includes('@media(prefers-reduced-motion:reduce){#devicePortInspector,#devicePortMenu{animation:none}}'));
const detailCss=fs.readFileSync(path.join(mockup,'shared/netauto-pop-detail.css'),'utf8');
assert(detailCss.includes('animation:na-topo-enter 220ms'));
assert(detailCss.includes('animation:na-topo-backdrop-enter 180ms'));
assert(detailCss.includes('@media(prefers-reduced-motion:reduce){#popDetailPage .l1-topo-dialog[open],#popDetailPage .l1-topo-dialog::backdrop{animation:none}}'));
assert(portCss.includes('grid-template-columns:repeat(var(--list-columns,8),minmax(0,var(--list-port-width,110px)))'));
assert(portCss.includes('flex:0 1 var(--bank-width)'),'Track width comes from the shared planner');
assert(!portCss.includes('--bank-compact-columns'),'No CSS breakpoint can contradict the responsive planner');
assert(get('devicePortBanks').innerHTML.includes('<b>G0/1</b>'),'Port cards show readable interface names');
assert(!get('devicePortBanks').innerHTML.includes('data-port-tools'));
assert(!get('devicePortBanks').innerHTML.includes('⋮'),'No three-dot action on port cards');
assert(!get('devicePortBanks').innerHTML.includes('<small>'),'List cards display only the port name, not status text');
assert(/title="G0\/1 · [^"]+"/.test(get('devicePortBanks').innerHTML),'Status remains available in tooltips and accessible labels');
assert(portCss.includes('min-height:34px'),'Desktop list port buttons stay compact, close to the 35px faceplate ports');
assert(get('devicePortBanks').innerHTML.includes('--list-port-width:'),'Every bank receives a shared readable port width');
assert(portCss.includes('.l2-port-open{min-height:40px}'),'Narrow/touch layouts retain a larger click target');
assert(portCss.includes('#deviceHardwarePanel,#devicePortWorkspace{overflow-anchor:none}'),'Swapping views excludes the changing content from scroll anchoring');
for(const state of ['up','down','empty','unknown'])assert(portCss.includes(`.l2-port-tile[data-state=${state}]`));
const emptyStyle=portCss.match(/\.l2-port-tile\[data-state=empty\]\{([^}]+)\}/)[1];
assert(emptyStyle.includes('background-image:radial-gradient('),'Empty list ports use a subtle dot pattern');
assert(emptyStyle.includes('background-size:7px 7px'));
assert(emptyStyle.includes('color:var(--na-text)'),'Empty port names retain the high-contrast text color');
assert(portCss.includes('.l2-port-tile[data-state=empty] .l2-port-open b{background:var(--list-empty-bg)'),'Dots are masked directly behind each port name');
assert(portCss.includes('light-dark(#0bbf7b,#52dda7)'),'Fresh list UP palette supports light/dark mode');
assert(portCss.includes('light-dark(#f58b35,#ffad66)'),'Fresh list DOWN palette supports light/dark mode');
assert.equal((get('deviceHardware').innerHTML.match(/class="pw-chassis-unit"/g)||[]).length,1);
assert.equal((get('deviceHardware').innerHTML.match(/data-select-port=/g)||[]).length,22);
assert(get('deviceHardware').style['--face-port-width'],'Every faceplate bank consumes the same port-width token');
assert(get('devicePortSummary').innerHTML.includes('<b>22</b>'));
assert(get('deviceDetailStats').innerHTML.includes('Module card'));
const selectPort=(name,menu=false)=>{
  get('devicePortBanks').listeners.click({target:{closest:selector=>selector==='[data-select-port]'?{dataset:{selectPort:name}}:null}});
  if(menu)get('devicePortMenuToggle').listeners.click();
};
const runPortTool=action=>get('devicePortMenu').listeners.click({target:{closest:()=>({dataset:{portAction:action}})}});
const metadataFixture={...realGcom,type:'SWITCH',model:'HW57',vendor:'HUAWEI',name:'TEST-METADATA',area:'MB',zone:'V1',province:'HN',branch:'HN11',firmware:{version:'TEST-V1',patch:'PATCH<&>',epld:'EPLD-TEST'},totalMac:0,chassisSerials:['CHASSIS-1','CHASSIS-2'],ports:[{name:'XGigabitEthernet0/0/1',capabilities:{speeds:['1 Gbps','10 Gbps']},description:'PORT<&>',module:{status:'UP',vendor:'VENDOR<&>',serial:'SERIAL-TEST',transceiver_type:'SFP+',part_number:'PN-TEST',speed:10000,transfer_distance:0,manu_date:'2026-01-02',temperature:0,wavelength:1310,connector:'LC',port_type:'NNI',RX:0,TX:0,RXH:-1,RXL:-20,TXH:4,TXL:1,description:'DESC<&>',voltage:3.3,channels:[{lane:1,RX:-2,TX:1}]}}]};
const metadataBefore=JSON.stringify(metadataFixture);
devicePage.open(popForMetadata,metadataFixture);
const metadataHtml=get('deviceDetailFields').innerHTML;
const metadataOrder=['IP thiết bị','Model','Vendor','Serial chassis','POP','Tỉnh · Chi nhánh','Miền · Vùng','Chức năng','Firmware','Total MAC'];
assert.deepEqual(Array.from(metadataHtml.matchAll(/<dt>([^<]+)<\/dt>/g),match=>match[1]),metadataOrder,'All ten metadata fields are grouped in a consistent UX order; name remains in the header');
assert.equal(get('deviceDetailName').textContent,'TEST-METADATA');
for(const value of ['TEST-V1','PATCH&lt;&amp;&gt;','EPLD-TEST','CHASSIS-1 · CHASSIS-2','Miền Bắc · V1','<dd>0</dd>'])assert(metadataHtml.includes(value));
selectPort('XGigabitEthernet0/0/1');
const fullPortInfo=get('devicePortInfo').innerHTML;
for(const label of ['Speed','Vendor module','Serial module','Transceiver type','Part number','Nhiệt độ (°C)','Bước sóng (nm)','Connector','Transfer distance','Ngày sản xuất','Rx / Tx','Rx ngưỡng cao (dBm)','Rx ngưỡng thấp (dBm)','Tx ngưỡng cao (dBm)','Tx ngưỡng thấp (dBm)','voltage','channels'])assert(fullPortInfo.includes(label),`Preserve job field: ${label}`);
assert.equal(get('deviceSelectedPortName').textContent,'XGigabitEthernet0/0/1','Selected title uses the full interface name');
for(const removed of ['Interface đầy đủ','Media','Bank / Slot','Trạng thái port','Loại port'])assert(!fullPortInfo.includes(`<dt>${removed}</dt>`),'Remove the specifically boxed redundant fields');
assert(!fullPortInfo.includes('(nguồn)')&&!fullPortInfo.includes('snapshot'),'Omit source qualifiers and the redundant snapshot footnote');
assert(fullPortInfo.includes('<b>Thông tin port - transceiver</b>'),'Use one combined information heading');
assert(!fullPortInfo.includes('<h4>'),'Omit redundant Interface and Transceiver subheadings');
const primaryPortInfo=fullPortInfo.split('<details class="l2-port-extra">')[0];
assert(primaryPortInfo.includes('<dt>Serial module</dt><dd><span class="l2-module-serial">SERIAL-TEST</span></dd>'),'Serial is visible in the main facts as a bordered tag');
assert(!fullPortInfo.match(/<details class="l2-port-extra">([\s\S]*?)<\/details>/)[1].includes('Serial module'),'Do not duplicate serial in additional information');
assert(primaryPortInfo.indexOf('<dt>Speed</dt>')>primaryPortInfo.indexOf('<dt>Transceiver type</dt>'),'Speed follows type in the unified facts list');
assert(portCss.includes('.l2-module-serial{')&&portCss.includes('border:1px solid color-mix(in srgb,var(--na-muted) 40%,var(--na-line))'),'Serial tag has a subtle visible border');
assert(portCss.includes('font-family:"Segoe UI Variable Text","Segoe UI",system-ui,sans-serif'),'Selected full port title uses local sans-serif typography');
assert(fullPortInfo.includes('<b>0</b> / <b>0</b> <small>(dBm)</small>'),'Optical power is one compact Rx / Tx field, preserving zero values');
assert(primaryPortInfo.includes('<dt>Rx / Tx</dt>'),'The compact optical pair remains in the primary port-transceiver facts');
assert(!fullPortInfo.includes('l2-optical-values'),'Do not render separate oversized Rx and Tx cards');
assert(fullPortInfo.includes('VENDOR&lt;&amp;&gt;')&&fullPortInfo.includes('PORT&lt;&amp;&gt;')&&fullPortInfo.includes('DESC&lt;&amp;&gt;'));
assert(fullPortInfo.includes('<b>0</b>')&&fullPortInfo.includes('&quot;lane&quot;: 1'),'Zero values and structured optical data remain readable');
assert(get('devicePortMenu').innerHTML.includes('Đổi Port Speed')&&!get('devicePortMenu').innerHTML.includes('Clear Offline Index'));
runPortTool('speed');assert.equal(get('devicePortSpeedForm').hidden,false);
get('devicePortSpeed').value='10 Gbps';get('devicePortSpeedForm').listeners.submit({preventDefault(){}});
assert(get('devicePortResult').innerHTML.includes('Xem trước'));
assert.equal(JSON.stringify(metadataFixture),metadataBefore,'Viewing all job fields and speed preview leave the source unchanged');
runPortTool('lacp');
devicePage.open(popForMetadata,{...metadataFixture,ports:[{...metadataFixture.ports[0],module:{...metadataFixture.ports[0].module,status:'DOWN'}}]},true);
assert(/data-port-action="lacp" disabled/.test(get('devicePortMenu').innerHTML));
assert.equal(get('devicePortActionSelect').value,'','An inventory refresh to DOWN invalidates an active LACP tool');
const disabledResult=get('devicePortResult').innerHTML;
runPortTool('lacp');assert.equal(get('devicePortResult').innerHTML,disabledResult,'Disabled LACP cannot be bypassed with a forged menu click');
get('devicePortActionSelect').value='lacp';get('devicePortActionSelect').listeners.change();
assert.equal(get('devicePortActionSelect').value,'','Dropdown and menu enforce the same rules');
devicePage.open(popForMetadata,{...metadataFixture,ports:[{name:'XGigabitEthernet0/0/1',module:null}]});selectPort('XGigabitEthernet0/0/1');
assert(/data-port-action="crc" disabled/.test(get('devicePortMenu').innerHTML));
runPortTool('crc');assert.equal(get('devicePortActionSelect').value,'','CRC cannot run without a recorded transceiver');
devicePage.open(popForMetadata,{...metadataFixture,vendor:'DASAN',model:'TEST-DASAN',portCapabilities:undefined,ports:[{name:'GigabitEthernet1/1',module:{status:'UP'}}],firmware:null,totalMac:null,chassisSerials:[],area:'UNKNOWN',zone:null});
selectPort('GigabitEthernet1/1');assert(get('devicePortMenu').innerHTML.includes('Đổi Port Speed'),'Dasan switch exposes the speed tool');
runPortTool('speed');assert.equal(get('devicePortSpeedForm').hidden,true,'Missing capabilities never invent compatible speed choices');
assert(get('devicePortResult').innerHTML.includes('Cần dữ liệu capability'));
assert(!get('deviceDetailFields').innerHTML.includes('Miền Nam'),'Unknown area is not invented as Miền Nam');
assert(get('deviceDetailFields').innerHTML.includes('<dt>Firmware</dt><dd>—</dd>')&&get('deviceDetailFields').innerHTML.includes('<dt>Total MAC</dt><dd>—</dd>'));
devicePage.open(popForMetadata,realGcom);
selectPort('G0/1',true);
assert.equal(get('deviceSelectedPortName').textContent,'G0/1');
assert.equal(get('devicePortMenu').hidden,false);
assert(get('devicePortMenu').innerHTML.includes('Clear Offline Index'));
assert(!get('devicePortMenu').innerHTML.includes('data-port-action="lacp"'));
assert(!get('devicePortMenu').innerHTML.includes('data-port-action="transceiver"'),'Transceiver is information shown first, not a separate tool');
assert(!get('devicePortMenu').innerHTML.includes('Đổi Port Speed'));
assert(get('devicePortResult').innerHTML.includes('Chọn công cụ để bắt đầu'),'Default action placeholder matches the standalone workspace');
assert(get('devicePortInfo').innerHTML.includes('Rx / Tx'));
assert(get('devicePortInfo').innerHTML.includes(String(realGcom.ports.find(port=>port.name==='G0/1').module.TX)));
const revealAnimations=[];
let cancelledReveal=0;
get('devicePortResult').animate=(frames,options)=>{revealAnimations.push({frames,options});};
get('devicePortResult').getAnimations=()=>[{cancel(){cancelledReveal++;}}];
context.window.matchMedia=()=>({matches:false});
runPortTool('crc');
assert.equal(revealAnimations.length,1,'Changing a port tool reveals only its result panel');
assert.equal(revealAnimations[0].options.duration,150);
assert.equal(cancelledReveal,1,'Rapid changes cancel stale result reveals');
runPortTool('crc');assert.equal(revealAnimations.length,1,'Choosing the same tool does not replay animation');
context.window.matchMedia=()=>({matches:true});
runPortTool('clearOffline');assert.equal(revealAnimations.length,1,'Reduced-motion preference skips result animation');
context.window.matchMedia=()=>({matches:false});
runPortTool('crc');assert.equal(revealAnimations.length,2);
assert(get('devicePortInfo').innerHTML.includes('Rx / Tx'),'Optics remain visible while tools change');
const ponResult=get('devicePortResult').innerHTML;
runPortTool('lacp');assert.equal(get('devicePortResult').innerHTML,ponResult,'PON LACP cannot be activated through a forged click');
runPortTool('crc');assert(get('devicePortResult').innerHTML.includes('chưa có bộ đếm CRC'));
runPortTool('clearOffline');assert(get('devicePortResult').innerHTML.includes('Chưa xóa ONU index nào.'));
selectPort('E2/1',true);
assert(!get('devicePortMenu').innerHTML.includes('Đổi Port Speed'),'GCOM OLT does not receive a switch-only speed tool');
assert(!get('devicePortMenu').innerHTML.includes('Khách hàng thuộc PON'));
assert(!/data-port-action="lacp" disabled/.test(get('devicePortMenu').innerHTML));
const gcomNniResult=get('devicePortResult').innerHTML;
runPortTool('speed');assert.equal(get('devicePortResult').innerHTML,gcomNniResult,'A forged speed action cannot bypass the vendor/type policy');
assert.equal(get('devicePortSpeedForm').hidden,true);
get('devicePortSpeed').value='10 Gbps';get('devicePortSpeedForm').listeners.submit({preventDefault(){}});
assert.equal(get('devicePortResult').innerHTML,gcomNniResult);
assert.equal(JSON.stringify(realGcom),originalGcom,'Speed preview never modifies the source or real port speed');
get('devicePortType').value='PON';get('devicePortType').listeners.change();
assert(get('devicePortCount').textContent.includes('16 / 22'));
assert(!get('devicePortBanks').innerHTML.includes('data-select-port="E2/1"'));
assert.equal((get('deviceHardware').innerHTML.match(/data-select-port=/g)||[]).length,22,'Filtering dims faceplate ports but does not remove physical slots');
assert.equal((get('deviceHardware').innerHTML.match(/is-filtered-out/g)||[]).length,6);
get('deviceGridView').listeners.click();assert.equal(get('deviceHardwarePanel').hidden,true);assert.equal(get('devicePortGridContent').hidden,false);
assert.equal(get('devicePortToolbar').hidden,false);assert.equal(get('devicePortType').value,'PON');
get('devicePortSearch').value='G0/1';get('devicePortSearch').listeners.input();
get('devicePortState').value='up';get('devicePortState').listeners.change();
get('deviceFaceView').listeners.click();assert.equal(get('deviceHardwarePanel').hidden,false);assert.equal(get('devicePortGridContent').hidden,true);
assert.equal(get('devicePortToolbar').hidden,false);assert.equal(get('devicePortType').value,'PON');
assert.equal(get('devicePortSearch').value,'G0/1');assert.equal(get('devicePortState').value,'up');
get('devicePortSearch').value='';get('devicePortSearch').listeners.input();
get('devicePortState').value='all';get('devicePortState').listeners.change();
get('deviceInventoryTab').listeners.click();
assert.equal(get('devicePortsPanel').hidden,true);assert.equal(get('deviceInventoryPanel').hidden,false);
devicePage.open(popForMetadata,realGcom,true);
assert.equal(get('deviceInventoryPanel').hidden,false,'An inventory refresh preserves the active tab');
assert.equal(get('devicePortType').value,'PON');
assert.equal(get('deviceSelectedPortName').textContent,'E2/1');
devicePage.open(popForMetadata,dataset.pops.AGGP006.find(device=>device.type==='POWER'));
assert.equal(get('devicePortsPanel').hidden,true);assert.equal(get('devicePortsTab').hidden,true);assert.equal(get('devicePortSummary').hidden,true);
devicePage.open(popForMetadata,realGcom);
assert.equal(get('devicePortType').value,'all');assert.equal(get('devicePortSelected').hidden,true,'A new device entry does not retain the previous selection');
const noStatus={...realGcom,ports:[{name:'G0/1',module:{RX:0,TX:0,status:null}}]};
devicePage.open(popForMetadata,noStatus);selectPort('G0/1');
assert(get('devicePortInfo').innerHTML.includes('<b>0</b>'),'Zero optical readings are not replaced with dashes');
assert.equal(get('deviceSelectedPortState').textContent,'Chưa rõ trạng thái');
devicePage.open(popForMetadata,{...realGcom,ports:undefined});
get('devicePortSearch').value='G0/1';get('devicePortSearch').listeners.input();
get('deviceInventoryTab').listeners.click();
devicePage.open(popForMetadata,realGcom,true);
assert.equal(get('devicePortSearch').value,'G0/1');assert.equal(get('deviceInventoryPanel').hidden,false);
assert(get('devicePortNote').innerHTML.includes('Snapshot: 22 port'));
get('devicePortsRefresh').listeners.click();
assert.equal(get('devicePortSearch').value,'');assert.equal(get('devicePortInspector').hidden,true,'Reset closes the dock and clears filters');
const selectFace=(name,contextMenu=false)=>get('deviceHardware').listeners[contextMenu?'contextmenu':'click']({preventDefault(){},target:{closest:selector=>selector==='[data-select-port]'?{dataset:{selectPort:name}}:null}});
selectFace('G0/1');assert.equal(get('devicePortInspector').hidden,false);
assert.equal(get('devicePortActionSelect').value,'');
get('devicePortActionSelect').value='crc';get('devicePortActionSelect').listeners.change();
assert(get('devicePortInfo').innerHTML.includes('Rx / Tx'));
selectFace('G0/1');assert.equal(get('devicePortInspector').hidden,true,'Clicking the selected faceplate port again closes the dock');
selectFace('G0/1',true);assert.equal(get('devicePortMenu').hidden,false,'Right-click opens type-specific port tools');
get('deviceClosePort').listeners.click();assert.equal(get('devicePortInspector').hidden,true);
get('deviceGridView').listeners.click();
get('devicePortBanks').listeners.contextmenu({preventDefault(){},target:{closest:selector=>selector==='[data-select-port]'?{dataset:{selectPort:'G0/1'}}:null}});
assert.equal(get('devicePortMenu').hidden,false,'List cards expose tools via right-click without a three-dot button');
selectPort('G0/1');assert.equal(get('devicePortInspector').hidden,true,'Clicking the selected list port again closes the dock');
const stackPop=allPops.find(pop=>pop.devices.some(device=>device.model==='CV52'&&device.inventoryAvailable));
vm.runInNewContext(fs.readFileSync(path.join(mockup,context.window.NETAUTO_DATA.inventoryFiles[stackPop.code]),'utf8'),context);
const stackDevice=dataset.pops[stackPop.code].find(device=>device.model==='CV52'&&device.ports.length);
devicePage.open(stackPop,stackDevice);
const stackLayout=context.window.NETAUTO_PORT_MODELS.build(stackDevice);
assert(stackLayout.hardware.units.length>1);
assert.equal((get('deviceHardware').innerHTML.match(/class="pw-chassis-unit"/g)||[]).length,stackLayout.hardware.units.length);
assert.equal((get('deviceHardware').innerHTML.match(/data-select-port=/g)||[]).length,stackLayout.summary.total,'A real stack shows every member exactly once');
assert(get('deviceHardware').innerHTML.includes('H3C'));
assert.equal((get('devicePortBanks').innerHTML.match(/data-list-member=/g)||[]).length,stackLayout.hardware.units.length,'List banks stay grouped by real stack member');
assert.equal((get('devicePortBanks').innerHTML.match(/data-select-port=/g)||[]).length,stackLayout.summary.total,'Every stack port appears exactly once in the compact list');
get('deviceHardwareScroll').clientWidth=1400;
context.window.listeners.resize();
assert.equal(get('deviceHardware').style['--face-port-width'],`${context.window.NETAUTO_PORT_MODELS.faceplateGeometry(stackLayout,1400).portWidth}px`,'Changing available width recalculates one shared size for all members');
assert.equal(get('deviceHardware').style['--face-chassis-width'],`${context.window.NETAUTO_PORT_MODELS.faceplateGeometry(stackLayout,1400).chassisWidth}px`,'Resize also fits the shell to its common stack bank footprint');
const cePop=allPops.find(pop=>pop.devices.some(device=>device.model==='HS12'&&device.inventoryAvailable));
vm.runInNewContext(fs.readFileSync(path.join(mockup,context.window.NETAUTO_DATA.inventoryFiles[cePop.code]),'utf8'),context);
const ceDevice=dataset.pops[cePop.code].find(device=>device.model==='HS12'&&device.ports.length);
const ceLayout=context.window.NETAUTO_PORT_MODELS.build(ceDevice);
const chassisNodes=ceLayout.hardware.units.map(()=>element());
const faceBankNodes=ceLayout.hardware.units.flatMap(unit=>unit.groups.map(()=>element()));
const hardwareQuery=get('deviceHardware').querySelectorAll;
get('deviceHardware').querySelectorAll=selector=>selector==='.pw-chassis-unit'?chassisNodes:selector==='.pw-face-group'?faceBankNodes:[];
devicePage.open(cePop,ceDevice);
assert(chassisNodes.every(node=>node.style['--face-card-tracks']==='1'),'CE12804 stack renderer uses one vertical card track per member');
assert.equal((get('deviceHardware').innerHTML.match(/data-select-port=/g)||[]).length,ceLayout.summary.total,'Every CE12804 stack port remains selectable');
assert.equal((get('deviceHardware').innerHTML.match(/data-member=/g)||[]).length,ceLayout.hardware.units.length,'Do not mix stack members');
assert(!get('deviceHardware').innerHTML.includes('--port-columns:24'),'No dense 24-column cards remain on CE12804');
assert(get('deviceHardware').innerHTML.includes('--port-columns:12'));
assert(faceBankNodes.every(node=>node.style['--port-columns']==='16'),'Wide CE12804 cards update the rendered grid to sixteen columns');
const ceMarkup=get('deviceHardware').innerHTML;
get('deviceHardwareScroll').clientWidth=400;context.window.listeners.resize();
assert(faceBankNodes.every(node=>node.style['--port-columns']==='8'),'Resizing adds port rows without squeezing names');
assert.equal(get('deviceHardware').innerHTML,ceMarkup,'Resize keeps the original selectable buttons and bank order intact');
get('deviceHardwareScroll').clientWidth=1400;context.window.listeners.resize();
assert(faceBankNodes.every(node=>node.style['--port-columns']==='16'),'Widening restores the space-efficient columns');
get('deviceHardware').querySelectorAll=hardwareQuery;
const groupedSwitch={...stackDevice,name:'TEST-PORT-GROUPS',type:'SWITCH',model:'HW57',vendor:'HUAWEI',ports:[
  ...Array.from({length:24},(_,i)=>({name:`XGigabitEthernet0/0/${i+1}`,module:null})),
  ...Array.from({length:2},(_,i)=>({name:`40GE0/0/${i+1}`,module:null}))
]};
devicePage.open(stackPop,groupedSwitch);
const groupedLayout=context.window.NETAUTO_PORT_MODELS.build(groupedSwitch);
const groupedChassis=groupedLayout.hardware.units.map(()=>element());
const groupedFaceBanks=groupedLayout.hardware.units.flatMap(unit=>unit.groups.map(()=>element()));
get('deviceHardware').querySelectorAll=selector=>selector==='.pw-chassis-unit'?groupedChassis:selector==='.pw-face-group'?groupedFaceBanks:[];
get('deviceHardwareScroll').clientWidth=400;context.window.listeners.resize();
const groupedNarrowGeometry=context.window.NETAUTO_PORT_MODELS.faceplateGeometry(groupedLayout,400);
assert.equal(groupedChassis[0].style['--face-grid-columns'],groupedNarrowGeometry.units[0].gridColumns,'Non-CE models receive the same planner-owned CSS tracks');
assert.equal(groupedFaceBanks[0].style['--face-bank-row'],'1');
assert.equal(groupedFaceBanks[1].style['--face-bank-row'],'2','Uplink renders on its own row when the fixed chassis is narrow');
assert.equal(groupedFaceBanks[0].style['--port-columns'],String(groupedNarrowGeometry.bankColumns[groupedLayout.hardware.units[0].groups[0].id]));
get('deviceHardwareScroll').clientWidth=1400;context.window.listeners.resize();
assert(groupedFaceBanks.every(node=>node.style['--face-bank-row']==='1'),'Service/uplink return to one row when space is available');
get('deviceHardware').querySelectorAll=hardwareQuery;
const bankMarkup=get('devicePortBanks').innerHTML;
assert.equal((bankMarkup.match(/class="l2-list-banks"/g)||[]).length,1,'Service and uplink banks share a single wrapping row');
assert(bankMarkup.indexOf('data-bank="NNI:XGigabitEthernet0/0"')<bankMarkup.indexOf('data-bank="NNI:40GE0/0"'),'10G precedes 40G, matching the faceplate');
assert(bankMarkup.includes('--bank-columns:12;'),'24-port fixed switch keeps Giả lập columns when there is room');
assert(bankMarkup.includes('--bank-columns:2;'),'Two uplink ports use two columns, not a full-width eight-column bank');
assert.equal((bankMarkup.match(/data-select-port=/g)||[]).length,26);
assert(bankMarkup.includes('data-list-row="mixed"'),'A small two-port uplink bank can still share a fixed switch row');
const sixUplinkSwitch={...groupedSwitch,name:'TEST-24-PLUS-6',ports:[
  ...groupedSwitch.ports.slice(0,24),
  ...Array.from({length:6},(_,i)=>({name:`40GE0/0/${i+1}`,module:null}))
]};
devicePage.open(stackPop,sixUplinkSwitch);
const compactSwitchMarkup=get('devicePortBanks').innerHTML;
assert.equal((compactSwitchMarkup.match(/data-list-row=/g)||[]).length,1,'24 service + 6 uplink ports share one balanced wrapping row');
assert(compactSwitchMarkup.includes('data-list-row="mixed"'));
assert(compactSwitchMarkup.includes('--bank-columns:3;'),'Six uplink ports are arranged as two rows of three, not a detached row of six');
assert.equal((compactSwitchMarkup.match(/data-select-port=/g)||[]).length,30);
const modularPop=allPops.find(pop=>pop.devices.some(device=>device.model==='ZA62'&&device.inventoryAvailable));
vm.runInNewContext(fs.readFileSync(path.join(mockup,context.window.NETAUTO_DATA.inventoryFiles[modularPop.code]),'utf8'),context);
const modularDevice=dataset.pops[modularPop.code].find(device=>device.model==='ZA62'&&device.ports.length);
const originalModular=JSON.stringify(modularDevice);
const modularLayout=context.window.NETAUTO_PORT_MODELS.build(modularDevice);
devicePage.open(modularPop,modularDevice);
const modularMarkup=get('devicePortBanks').innerHTML;
const serviceBanks=modularLayout.hardware.units[0].groups.filter(group=>!group.uplink);
assert(serviceBanks.length>1,'Real C620 snapshot contains multiple PON banks');
assert.equal((modularMarkup.match(/data-list-row="service"/g)||[]).length,1,'Two PON banks share the upper balanced row');
assert.equal((modularMarkup.match(/class="l2-list-banks"/g)||[]).length,2,'Four zones form two equal-width rows, not an uplink inserted beside a PON bank');
assert.equal((modularMarkup.match(/class="l2-port-bank"/g)||[]).length,4);
assert(modularMarkup.includes('--bank-columns:8;'),'Each 16-port PON card keeps eight ports per row when readable');
const modularWidths=[...modularMarkup.matchAll(/--bank-width:([\d.]+)px/g)].map(match=>Number(match[1]));
assert.equal(new Set(modularWidths).size,1,'Modular card tracks have matching widths');
assert.equal(new Set([...modularMarkup.matchAll(/--list-port-width:([\d.]+)px/g)].map(match=>match[1])).size,1,'Uplink tiles share the same compact width as PON tiles');
assert.equal((modularMarkup.match(/data-list-row="uplink"/g)||[]).length,1,'All uplink banks are grouped into a dedicated row below the PON banks');
assert(!modularMarkup.includes('data-list-row="mixed"'),'No uplink is inserted alongside the second PON bank');
assert(modularMarkup.lastIndexOf('data-list-row="service"')<modularMarkup.indexOf('data-list-row="uplink"'));
assert.equal((modularMarkup.match(/data-select-port=/g)||[]).length,modularLayout.summary.total);
get('devicePortSearch').value='gpon_olt-1/2/';get('devicePortSearch').listeners.input();
assert.equal((get('devicePortBanks').innerHTML.match(/data-list-row="service"/g)||[]).length,1,'Filtered empty service rows are omitted');
assert(!get('devicePortBanks').innerHTML.includes('data-list-row="mixed"'));
get('devicePortSearch').value='xgei-';get('devicePortSearch').listeners.input();
assert.equal((get('devicePortBanks').innerHTML.match(/data-list-row="uplink"/g)||[]).length,1,'Uplink-only search retains its dedicated row');
assert.equal(JSON.stringify(modularDevice),originalModular,'Row grouping never changes real snapshot data');
const longSwitch={...groupedSwitch,name:'TEST-LONG-PORT-GROUPS',ports:[
  ...Array.from({length:48},(_,i)=>({name:`XGigabitEthernet0/0/${i+1}`,module:null})),
  ...Array.from({length:2},(_,i)=>({name:`40GE0/0/${i+1}`,module:null}))
]};
devicePage.open(stackPop,longSwitch);
assert(get('devicePortBanks').innerHTML.includes('data-list-row="uplink"'),'A 48-port service run moves even a small uplink bank onto its own row');
assert(!get('devicePortBanks').innerHTML.includes('data-list-row="mixed"'));
assert(get('devicePortBanks').innerHTML.includes('--bank-width:1374px;'),'A dense bank occupies the complete measured chassis width');
assert(get('devicePortBanks').innerHTML.includes('--bank-columns:16;'),'48 service ports use sixteen columns when there is room');
get('devicePortBanks').clientWidth=600;context.window.listeners.resize();
assert(get('devicePortBanks').innerHTML.includes('--bank-columns:4;'),'Actual panel width controls columns, not the window or sidebar');
get('devicePortBanks').clientWidth=3000;context.window.listeners.resize();
assert(get('devicePortBanks').innerHTML.includes('--bank-columns:24;'),'Wide screens restore Giả lập columns automatically');
assert(get('devicePortBanks').innerHTML.includes('data-list-row="mixed"'),'Wide screens restore service/uplink placement without an unconditional model exception');
get('devicePortBanks').clientWidth=0;context.window.listeners.resize();
assert.equal((get('devicePortBanks').innerHTML.match(/data-select-port=/g)||[]).length,50);
const selectedLongPort='XGigabitEthernet0/0/1';selectPort(selectedLongPort);
get('devicePortSearch').value='0/0/1';get('devicePortSearch').listeners.input();
const beforeResizeCount=(get('devicePortBanks').innerHTML.match(/data-select-port=/g)||[]).length;
get('devicePortBanks').clientWidth=650;context.window.listeners.resize();
assert.equal(get('devicePortSearch').value,'0/0/1','Resize keeps the search');
assert.equal(get('devicePortInspector').hidden,false,'Resize does not dismiss the selected port dock');
assert.equal(get('deviceSelectedPortName').textContent,'XGigabitEthernet0/0/1');
assert.equal((get('devicePortBanks').innerHTML.match(/data-select-port=/g)||[]).length,beforeResizeCount,'Resize preserves filtered results');
assert(get('devicePortBanks').innerHTML.includes('is-selected'),'Selected tile survives replanning');
get('deviceFaceView').listeners.click();get('devicePortBanks').clientWidth=3000;
context.window.listeners.resize();get('deviceGridView').listeners.click();
assert(get('devicePortBanks').innerHTML.includes('--bank-columns:24;'),'Showing the previously hidden view measures its new width');
get('devicePortBanks').clientWidth=0;get('devicePortSearch').value='';
devicePage.open(stackPop,groupedSwitch);
get('deviceGridView').listeners.click();
assert.equal(storage.get('netauto-device-port-view'),'grid');
devicePage.open(popForMetadata,realGcom);
assert.equal(get('deviceHardwarePanel').hidden,true,'List preference survives opening another device');
assert.equal(get('devicePortGridContent').hidden,false);
get('devicePortsRefresh').listeners.click();
assert.equal(get('devicePortGridContent').hidden,false,'Resetting filters does not reset the preferred view');
const portControllerSource=fs.readFileSync(path.join(mockup,'shared/netauto-device-ports.js'),'utf8');
vm.runInNewContext(portControllerSource,context);
devicePage.open(stackPop,groupedSwitch);
assert.equal(get('devicePortGridContent').hidden,false,'Stored list choice is restored after controller reload');
get('deviceFaceView').listeners.click();
assert.equal(storage.get('netauto-device-port-view'),'face');
devicePage.open(popForMetadata,realGcom);
assert.equal(get('deviceHardwarePanel').hidden,false,'Simulation preference also survives device navigation');
vm.runInNewContext(portControllerSource,context);devicePage.open(stackPop,groupedSwitch);
assert.equal(get('deviceHardwarePanel').hidden,false,'Stored simulation choice is restored after reload');
storage.set('netauto-device-port-view','invalid');
vm.runInNewContext(portControllerSource,context);devicePage.open(popForMetadata,realGcom);
assert.equal(get('deviceHardwarePanel').hidden,false,'Invalid stored values safely fall back to simulation');
const workingStorage=context.localStorage;
context.localStorage={getItem(){throw new Error('Storage unavailable');},setItem(){throw new Error('Storage unavailable');}};
vm.runInNewContext(portControllerSource,context);devicePage.open(popForMetadata,realGcom);
get('deviceGridView').listeners.click();devicePage.open(stackPop,groupedSwitch);
assert.equal(get('devicePortGridContent').hidden,false,'In-memory view preference still works when browser storage is unavailable');
context.localStorage=workingStorage;
console.log('PASS: compact side-by-side service/uplink banks, intact stack members, unchanged port counts and persisted view across navigation/reset/reload, including invalid/unavailable storage.');
console.log('PASS: Layer 2 port banks/search/filter, real Rx/Tx including zero, PON/NNI tools, safe speed preview, inventory tabs, preserved asynchronous state and no selection/data leakage.');
console.log('PASS: reused standalone faceplate styles/tool dock, default hardware view, real stack members, preserved slot geometry under filters, dropdown tools, click-again/close/reset and context menu.');
// Floating back uses the existing back controls and actual content viewport.
const viewport=get('portalContent'),floating=get('detailFloatingBack');
const savedViewportRect=viewport.getBoundingClientRect;
const savedPopBackRect=get('backToPopList').getBoundingClientRect;
const savedDeviceBackRect=get('backToPopDetail').getBoundingClientRect;
context.window.innerHeight=900;
viewport.getBoundingClientRect=()=>({left:350,top:120,bottom:840,right:1400});
get('backToPopList').getBoundingClientRect=()=>({top:130,bottom:172});
context.location.hash='#pop/AGGP006';context.window.listeners.hashchange();
assert.equal(floating.hidden,true,'No duplicate floating button while the header back control is visible');
get('backToPopList').getBoundingClientRect=()=>({top:-40,bottom:0});
viewport.listeners.scroll();
assert.equal(floating.hidden,false,'Floating back appears after the POP header scrolls out of view');
assert.equal(floating.dataset.backTarget,'backToPopList');
assert.equal(floating.style.left,'368px');assert.equal(floating.style.top,'132px');
assert.equal(floating.style.bottom,'auto','Back floats near the content header, not above bottom controls');
const searchBeforeFloatingBack=get('popSearch').value;
floating.click();
assert.equal(get('popPage').hidden,false);assert.equal(floating.hidden,true);
assert.equal(get('popSearch').value,searchBeforeFloatingBack,'Floating back preserves Layer 0 filters');
get('backToPopDetail').getBoundingClientRect=()=>({top:130,bottom:172});
context.location.hash=`#pop/AGGP006/device/${encodeURIComponent(realGcom.name)}`;context.window.listeners.hashchange();
assert.equal(get('deviceDetailPage').hidden,false);assert.equal(floating.hidden,true);
get('backToPopDetail').getBoundingClientRect=()=>({top:-40,bottom:0});
viewport.listeners.scroll();
assert.equal(floating.dataset.backTarget,'backToPopDetail');assert.equal(floating.hidden,false);
assert.equal(floating.textContent,'← Quay lại POP');
viewport.getBoundingClientRect=()=>({left:80,top:60,bottom:900,right:1400});
context.window.listeners.resize();
assert.equal(floating.style.left,'98px');assert.equal(floating.style.top,'72px','Top position follows the viewport in fullscreen/collapsed sidebar mode');
assert.equal(floating.style.bottom,'auto');
floating.click();
assert.equal(get('popDetailPage').hidden,false);assert.equal(get('detailPopName').textContent,'AGGP006');
assert.equal(floating.dataset.backTarget,'backToPopList','Back changes from device-to-POP to POP-to-list without stale targets');
assert.equal(document.activeElement,get('backToPopList'),'Keyboard focus returns to the current page back control');
viewport.getBoundingClientRect=()=>({left:350,top:950,bottom:1500,right:1400});viewport.listeners.scroll();
assert.equal(floating.hidden,true,'Do not draw the floating control when the portal is outside the window');
context.location.hash='#customer';context.window.listeners.hashchange();
assert.equal(floating.hidden,true);assert.equal(floating.dataset.backTarget,undefined,'Unrelated modules have no stale floating back action');
viewport.getBoundingClientRect=savedViewportRect;
get('backToPopList').getBoundingClientRect=savedPopBackRect;
get('backToPopDetail').getBoundingClientRect=savedDeviceBackRect;
console.log('PASS: scroll-aware floating back on Layer 1/2, original route/filter preservation, keyboard focus, viewport/sidebar/fullscreen positioning and hidden outside detail pages.');

// Decorative POP hero colors change only on actual entry, not background refreshes.
const heroStyle=()=>get('detailPopCard').attrs.style;
const heroHue=()=>Number(heroStyle().match(/--l1-hero-hue:(\d+)/)[1]);
const heroPop=allPops.find(pop=>pop.code==='AGGP006'),heroOriginal=JSON.stringify(heroPop);
openDetail(heroPop.code);
const firstHeroHue=heroHue();
assert([210,255,165,28,325,188,280,42].includes(firstHeroHue));
assert.equal(Number(storage.get('netauto.pop.detailHeroHue')),firstHeroHue);
get('detailDeviceSearch').value='OPMS';get('detailDeviceSearch').listeners.input();
context.window.NETAUTO_POP_DETAIL.refreshInventory(heroPop.code);
assert.equal(heroHue(),firstHeroHue,'Async inventory refresh does not recolor the hero');
get('themeButton').listeners.click();assert.equal(heroHue(),firstHeroHue,'Theme changes do not count as POP entries');
context.window.listeners.popstate();context.window.listeners.hashchange();
assert.equal(heroHue(),firstHeroHue,'Duplicate route notifications preserve the current visit color');
assert.equal(get('detailDeviceSearch').value,'OPMS');
get('backToPopList').listeners.click();openDetail(heroPop.code);
assert.notEqual(heroHue(),firstHeroHue,'Leaving and re-entering the same POP always selects a different hue');
const secondHeroHue=heroHue();
context.location.hash='#customer';context.window.listeners.hashchange();
context.location.hash='#pop/AGGP006';context.window.listeners.popstate();
assert.notEqual(heroHue(),secondHeroHue,'History re-entry changes the color even with preserved POP state');
const historyHeroHue=heroHue();context.window.listeners.hashchange();assert.equal(heroHue(),historyHeroHue);
openDetail('AGGP015');assert.notEqual(heroHue(),historyHeroHue,'Entering a different POP changes the color');
openDetail('AGGP006');assert.notEqual(heroHue(),historyHeroHue,'Returning after another POP avoids the last color for this POP too');
const beforeHeroReload=heroHue();
vm.runInNewContext(fs.readFileSync(path.join(mockup,'shared/netauto-pop-detail.js'),'utf8'),context,{filename:'netauto-pop-detail.js (hero reload)'});
context.window.NETAUTO_POP_DETAIL.open(heroPop);assert.notEqual(heroHue(),beforeHeroReload,'Optional saved hue prevents an immediate repeat after reload');
const workingHeroStorage=context.localStorage;
context.localStorage={getItem(){throw new Error('Storage denied');},setItem(){throw new Error('Storage denied');}};
const beforeBlockedHeroHue=heroHue();context.window.NETAUTO_POP_DETAIL.open(heroPop);
assert.notEqual(heroHue(),beforeBlockedHeroHue,'Color changes still work when optional storage is blocked');
context.localStorage=workingHeroStorage;
assert.equal(JSON.stringify(heroPop),heroOriginal,'Decorative styling never changes source POP/device data');
const heroCSS=fs.readFileSync(path.join(mockup,'shared/netauto-pop-detail.css'),'utf8');
assert(heroCSS.includes('--l1-hero-accent:hsl(var(--l1-hero-hue)'));
assert(heroCSS.includes('radial-gradient(ellipse at 96% 0%'));
assert(heroCSS.includes('.l1-pop-info:after')&&heroCSS.includes('pointer-events:none'));
assert(html.includes('class="l1-tech-pattern"')&&html.includes('class="l1-rack-icon"'));
assert(/<svg class="l1-tech-pattern"[^>]*aria-hidden="true"[^>]*focusable="false"/.test(html),'Circuit ornament is decorative, not an accessibility/focus target');
assert(!html.includes('aria-hidden="true">⬡</span>'),'Rack icon replaces the abstract hexagon');
assert(!heroCSS.includes('top:-270px')&&!heroCSS.includes('transform:rotate(-18deg)'),'Remove the large ornamental rings');
assert(heroCSS.includes('opacity:.2;pointer-events:none')&&heroCSS.includes('@media(forced-colors:active)'));
assert(heroCSS.includes('html[data-theme="dark"] #popDetailPage .l1-pop-info'));
assert(/\.l1-pop-identity h1\{[^}]*border:1px[^}]*border-radius:10px[^}]*overflow-wrap:anywhere/.test(heroCSS),'POP name is a responsive, readable tag');
console.log('PASS: tagged POP name, subtle CSS-only abstract hero, different hue per entry/re-entry/history/reload, stable inventory/theme/duplicate routes, optional-storage failure and immutable sources.');

// Table is a second projection of the same filtered/paginated POP result.
context.location.hash='#pop';context.window.listeners.hashchange();mode('many');reset();
get('popPageSize').value='36';get('popPageSize').listeners.change();
get('popLoadMore').listeners.click();
const cardPageCodes=[...get('popGrid').innerHTML.matchAll(/data-pop="([^"]+)"/g)].map(m=>m[1]);
const beforeTablePage=get('popPageCount').textContent,beforeTableSummary=get('deviceTotal').textContent;
get('popTableMode').listeners.click();
assert.equal(get('popTableMode').attrs['aria-pressed'],'true');assert.equal(get('popCardsMode').attrs['aria-pressed'],'false');
assert.equal(get('popGrid').hidden,true);assert.equal(get('popGrid').innerHTML,'');
assert.equal(get('popTableView').hidden,false);assert.equal(storage.get('netauto.pop.listView'),'table');
assert.equal(get('popPageCount').textContent,beforeTablePage,'Changing view retains current page');
assert.equal(get('deviceTotal').textContent,beforeTableSummary,'View does not affect summary statistics');
const tableRows=()=>[...get('popTableRows').innerHTML.matchAll(/<tr data-pop="([^"]+)" data-pop-province="([^"]*)" style="--na-pop-hue:([\d.]+)">([\s\S]*?)<\/tr>/g)].map(m=>({code:m[1],province:m[2],hue:Number(m[3]),body:m[4]}));
assert.deepEqual(tableRows().map(r=>r.code),cardPageCodes,'Both modes show exactly the same page and order');
get('popCardsMode').listeners.click();assert.equal(get('popGrid').hidden,false);assert.equal(get('popTableView').hidden,true);assert.equal(get('popTableRows').innerHTML,'');
assert.deepEqual([...get('popGrid').innerHTML.matchAll(/data-pop="([^"]+)"/g)].map(m=>m[1]),cardPageCodes);
get('popTableMode').listeners.click();
const tableSourceBefore=JSON.stringify(allPops),tableByCode=new Map(allPops.map(p=>[p.code,p])),tableProvinceHues=new Map();
get('popPageSize').value='144';get('popPageSize').listeners.change();
let tableSeen=0;
while(true){
  assert(tableRows().length<=allPops.length);
  for(const row of tableRows().slice(tableSeen)){
    const p=tableByCode.get(row.code);assert(p);assert.equal(row.province,p.province);
    const metrics=[...row.body.matchAll(/class="na-pop-table-metric na-pop-(blue|purple|orange|green)(?: is-zero)?">([\d.]+)<\/span>/g)].map(m=>Number(m[2].replaceAll('.','')));
    assert.deepEqual(metrics,[p.counts.switch,p.counts.olt,p.counts.power,p.counts.pi]);
    const total=Number(row.body.match(/class="na-pop-row-total(?: is-zero)?">([\d.]+)<\/b>/)[1].replaceAll('.',''));
    assert.equal(total,Object.values(p.counts).reduce((sum,n)=>sum+n,0));
    assert(row.body.includes('>'+p.zone+'</td>'));
    assert(row.body.includes('>'+p.branches.join(' · ')+'</td>'));
    assert(row.body.includes(p.area==='MB'?'Miền Bắc':'Miền Nam'));
    const locationCells=[...row.body.matchAll(/<td data-pop-column="[^"]+"[^>]*>([\s\S]*?)<\/td>/g)].map(m=>m[1].replace(/<[^>]*>/g,''));
    assert.deepEqual(locationCells,[p.area==='MB'?'Miền Bắc':'Miền Nam',p.zone,p.province,p.branches.join(' · ')],'Location order is Miền, Vùng, Tỉnh, Chi nhánh');
    if(tableProvinceHues.has(row.province))assert.equal(row.hue,tableProvinceHues.get(row.province),'One stable hue per province, across all pages');
    else tableProvinceHues.set(row.province,row.hue);
    tableSeen++;
  }
  if(get('popLoadMore').hidden)break;
  const loadedBefore=tableRows().length;
  get('popLoadMore').listeners.click();
  assert(tableRows().length>loadedBefore,'Each continuation adds rows; never silently spin without progress');
}
assert.equal(tableSeen,allPops.length);assert.equal(new Set(tableProvinceHues.values()).size,tableProvinceHues.size,'No two provinces share an identical hue');
search('AGGP006');assert.equal(tableRows().length,1);assert.equal(tableRows()[0].code,'AGGP006');
assert.equal(tableRows()[0].hue,tableProvinceHues.get(tableRows()[0].province));
assert(get('popPageCount').textContent.includes('1 / 1 POP · Đã hết danh sách'));assert.equal(get('popLoadMore').hidden,true);
get('popCardsMode').listeners.click();assert.equal(get('popSearch').value,'AGGP006');assert.equal(count(),1);
get('popTableMode').listeners.click();assert.equal(tableRows()[0].code,'AGGP006');
const tableThemeHue=tableRows()[0].hue;get('themeButton').listeners.click();assert.equal(tableRows()[0].hue,tableThemeHue);
get('popTableRows').listeners.click({target:{closest:selector=>selector==='[data-pop-detail]'?({dataset:{popDetail:'AGGP006'}}):null}});
assert.equal(get('detailPopName').textContent,'AGGP006');assert.equal(get('popDetailPage').hidden,false);
get('backToPopList').listeners.click();assert.equal(get('popTableView').hidden,false);assert.equal(get('popSearch').value,'AGGP006');
assert.equal(tableRows()[0].hue,tableThemeHue,'Returning to results preserves the table palette');
search('NO-SUCH-POP-__');assert.equal(get('popEmpty').hidden,false);assert.equal(get('popTableView').hidden,true);assert.equal(get('popTableRows').innerHTML,'');
assert.equal(get('popPageCount').textContent,'0 POP');
mode('one');assert(tableRows().every(row=>row.province==='AGG'));assert.equal(new Set(tableRows().map(row=>row.hue)).size,1);
mode('three');assert(tableRows().every(row=>tableByCode.get(row.code).branches.some(b=>['QNH','AGG','BTHT1'].includes(b))));
mode('many');reset();
const tablePaletteBeforeRefresh=Number(storage.get('netauto.pop.tablePaletteOffset'));
get('refreshPop').listeners.click();
assert.notEqual(Number(storage.get('netauto.pop.tablePaletteOffset')),tablePaletteBeforeRefresh);
assert.equal(get('popTableMode').attrs['aria-pressed'],'true','Refresh retains the chosen table mode');
for(const row of tableRows())assert.notEqual(row.hue,tableProvinceHues.get(row.province),'Refresh changes every displayed province hue');
const paletteBeforeReload=Number(storage.get('netauto.pop.tablePaletteOffset')),rowHueBeforeReload=tableRows()[0].hue;
vm.runInNewContext(fs.readFileSync(path.join(mockup,'shared/netauto-app.js'),'utf8'),context,{filename:'netauto-app.js (table reload)'});
assert.equal(get('popTableMode').attrs['aria-pressed'],'true','Table preference survives reload');
assert.notEqual(Number(storage.get('netauto.pop.tablePaletteOffset')),paletteBeforeReload);assert.notEqual(tableRows()[0].hue,rowHueBeforeReload);
const tableStorage=context.localStorage;context.localStorage={getItem(){throw new Error('Denied');},setItem(){throw new Error('Denied');}};
get('popCardsMode').listeners.click();assert.equal(get('popGrid').hidden,false);
get('popTableMode').listeners.click();assert.equal(get('popTableView').hidden,false);
get('refreshPop').listeners.click();assert(tableRows().length>0,'Mode changes/refresh work without optional storage');context.localStorage=tableStorage;
const maliciousTablePop={...allPops[0],code:'"><img src=x>',province:'<script>bad</script>',branches:['<b>branch</b>'],zone:'"><svg onload=bad>',area:'<iframe>'};
const maliciousBefore=JSON.stringify(maliciousTablePop),safeTableRow=context.window.__testPopTableRow(maliciousTablePop);
assert(!safeTableRow.includes('<img')&&!safeTableRow.includes('<script>')&&!safeTableRow.includes('<iframe>')&&!safeTableRow.includes('<svg onload'));
assert(safeTableRow.includes('&lt;img')&&safeTableRow.includes('&lt;script&gt;')&&safeTableRow.includes('&lt;b&gt;branch'));
assert(!safeTableRow.includes('NaN'),'An unindexed province uses a safe fallback hue');
assert.equal(JSON.stringify(maliciousTablePop),maliciousBefore);assert.equal(JSON.stringify(allPops),tableSourceBefore,'Table projection never modifies source data');
storage.set('netauto.pop.listView','invalid-view');
vm.runInNewContext(fs.readFileSync(path.join(mockup,'shared/netauto-app.js'),'utf8'),context,{filename:'netauto-app.js (invalid table preference)'});
assert.equal(get('popCardsMode').attrs['aria-pressed'],'true','Invalid saved view safely falls back to cards');
context.location.hash='#pop';context.window.listeners.hashchange();mode('many');reset();get('popPageSize').value='100';get('popPageSize').listeners.change();
assert.equal(cardHues().size,100);
get('popTableMode').listeners.click();assert.equal(tableRows().length,100,'Table also uses 100 POP per page');
get('popLoadMore').listeners.click();assert.equal(tableRows().length,200);assert(get('popPageCount').textContent.includes('200 / 3.898'));
get('popPageSize').value='';get('popPageSize').listeners.change();assert.equal(tableRows().length,100,'Missing page-size value falls back to 100');
const popTableCSS=fs.readFileSync(path.join(mockup,'shared/netauto-pop-table.css'),'utf8');
assert(html.includes('shared/netauto-pop-table.css'));assert(html.includes('aria-controls="popGrid popTableView"'));
assert(/id="popTableView"[^>]*tabindex="0"[^>]*hidden/.test(html));
assert(popTableCSS.includes('position:sticky;top:0')&&popTableCSS.includes('overflow:auto'));
assert(popTableCSS.includes('light-dark(')&&popTableCSS.includes('@media(pointer:coarse)')&&popTableCSS.includes(':focus-visible'));
console.log('PASS: card/table parity for all POPs/counts/metadata, native accessible launch controls, shared search/scope/pagination, empty/zero/XSS states, province palettes stable during browsing and renewed on refresh/reload, persisted/invalid/blocked-storage view preferences and immutable source.');

// Automatic continuation uses the correct scroll root; appends never reset focus/scroll.
assert(!html.includes('id="registerDevice"'));assert(!html.includes('id="popPrevPage"')&&!html.includes('id="popNextPage"'));
assert(html.includes('<th scope="col" data-pop-column="area">Miền</th><th scope="col" data-pop-column="zone">Vùng</th><th scope="col" data-pop-column="province">Tỉnh</th><th scope="col" data-pop-column="branch">Chi nhánh</th>'));
assert(html.includes('Mỗi lần tải')&&html.includes('id="popLoadMore"'));
const [autoCards,autoTable]=popScrollObservers.slice(-2);
assert.equal(autoCards.target,get('popCardsSentinel'));assert.equal(autoCards.options.root,null);
assert.equal(autoTable.target,get('popTableSentinel'));assert.equal(autoTable.options.root,get('popTableView'));
assert.equal(autoTable.options.rootMargin,'0px 0px 280px 0px');
const nativeFrame=context.requestAnimationFrame,queuedFrames=[];
context.requestAnimationFrame=callback=>{queuedFrames.push(callback);return queuedFrames.length;};
const flushPopFrames=()=>{for(const callback of queuedFrames.splice(0))callback();};
mode('many');reset();get('popPageSize').value='100';get('popPageSize').listeners.change();get('popCardsMode').listeners.click();
flushPopFrames(); // Finish layout restoration before testing observer-only frame counts.
const cardsPrefix=get('popGrid').innerHTML,cardAppendBefore=get('popGrid').appendCalls||0;
autoCards.fire(false);assert.equal(queuedFrames.length,0);
autoTable.fire();assert.equal(queuedFrames.length,0,'Hidden mode observer cannot load rows');
autoCards.fire();autoCards.fire();autoCards.fire();assert.equal(queuedFrames.length,1,'Repeated intersections coalesce to one append per frame');
assert.equal(get('popLoadMore').disabled,true);assert.equal(get('popGrid').attrs['aria-busy'],'true');
get('popCardsMode').focus();const focusBeforeAppend=document.activeElement;
flushPopFrames();assert.equal(cardHues().size,200);assert(get('popGrid').innerHTML.startsWith(cardsPrefix));
assert.equal(get('popGrid').appendCalls,cardAppendBefore+1);assert.equal(document.activeElement,focusBeforeAppend);
assert.equal(get('popGrid').attrs['aria-busy'],'false');assert.equal(get('popLoadMore').disabled,false);
get('popTableMode').listeners.click();assert.equal(tableRows().length,200,'Switching views retains accumulated POPs');
flushPopFrames();
get('popTableView').scrollTop=450;get('popTableView').scrollLeft=72;
const tablePrefix=get('popTableRows').innerHTML,tableAppendBefore=get('popTableRows').appendCalls||0;
autoTable.fire();flushPopFrames();assert.equal(tableRows().length,300);
assert(get('popTableRows').innerHTML.startsWith(tablePrefix));assert.equal(get('popTableRows').appendCalls,tableAppendBefore+1);
assert.equal(get('popTableView').scrollTop,450);assert.equal(get('popTableView').scrollLeft,72,'Appending preserves both scroll axes');
assert.equal(new Set(tableRows().map(r=>r.code)).size,300,'No duplicate rows after automatic continuation');
autoTable.fire();search('AGGP006');flushPopFrames();assert.equal(tableRows().length,1);assert.equal(tableRows()[0].code,'AGGP006','A queued old batch cannot leak after filtering');
autoTable.fire();assert.equal(queuedFrames.length,0,'No more batches after reaching the end');
reset();autoTable.fire();get('popPage').hidden=true;flushPopFrames();assert.equal(tableRows().length,100,'Navigation cancels an already queued append');
autoTable.fire();assert.equal(queuedFrames.length,0,'An inactive POP page never automatically loads');get('popPage').hidden=false;
autoTable.fire();get('popCardsMode').listeners.click();flushPopFrames();assert.equal(cardHues().size,100);assert.equal(get('popTableRows').innerHTML,'','A stale callback cannot append into a changed view');
autoCards.fire();flushPopFrames();assert.equal(cardHues().size,200);
const batchColors=cardHues();autoCards.fire();flushPopFrames();for(const [code,hue]of batchColors)assert.equal(cardHues().get(code),hue);
context.requestAnimationFrame=nativeFrame;
const observerCountBeforeFallback=popScrollObservers.length;
delete context.window.IntersectionObserver;
vm.runInNewContext(fs.readFileSync(path.join(mockup,'shared/netauto-app.js'),'utf8'),context,{filename:'netauto-app.js (no observer fallback)'});
assert.equal(popScrollObservers.length,observerCountBeforeFallback);
assert.equal(cardHues().size,100);get('popLoadMore').listeners.click();assert.equal(cardHues().size,200,'Native load-more button works without IntersectionObserver');
assert.equal(JSON.stringify(allPops),tableSourceBefore);
console.log('PASS: automatic 100-POP append in cards/table, distinct observer roots, duplicate-event coalescing, no focus/scroll reset, end detection, stale search/view/navigation isolation, exact location-column order and removed registration button.');

// Ordinary Layer 0 activation is read-only preview; only explicit details navigates.
const popPreview=get('popPreviewDialog'),previewHost=get('popPreviewDevices');
const previewCode='AGGP006',previewSource=allPops.find(p=>p.code===previewCode);
const previewRecords=dataset.pops[previewCode]||previewSource.devices;
const previewSourceBefore=JSON.stringify(previewRecords),previewPath=context.location.hash;
const previewScriptCount=scripts.length,previewOverflow=document.body.style.overflow;
const previewTrigger={dataset:{popPreview:previewCode},attrs:{},isConnected:true,setAttribute(k,v){this.attrs[k]=v;},focus(){document.activeElement=this;}};
const previewEntry={dataset:{pop:previewCode},querySelector:()=>previewTrigger};
const previewEvent={target:{closest:selector=>selector==='[data-pop]'?previewEntry:selector==='[data-pop-preview]'?previewTrigger:null}};
const beforePreviewCards=get('popGrid').innerHTML;
get('popGrid').listeners.click(previewEvent);
assert.equal(popPreview.open,true);assert.equal(context.location.hash,previewPath,'Preview does not change the route');
assert.equal(get('popPage').hidden,false);assert.equal(scripts.length,previewScriptCount,'Preview uses existing device metadata without loading inventory');
assert.equal(get('popPreviewName').textContent,previewCode);assert.equal(get('popPreviewCount').textContent,`${previewRecords.length} thiết bị`);
assert.equal((previewHost.innerHTML.match(/<article class="l1-device-card /g)||[]).length,previewRecords.length);
assert(!previewHost.innerHTML.includes('<button')&&!previewHost.innerHTML.includes('data-l1-device=')&&!previewHost.innerHTML.includes('tabindex='),'Read-only device cards have no device actions or focus targets');
assert.equal((previewHost.innerHTML.match(/class="l1-device-lane"/g)||[]).length,2);
assert.equal(previewTrigger.attrs['aria-expanded'],'true');assert.equal(document.activeElement,get('popPreviewDetails'));
assert.equal(document.body.style.overflow,'hidden');assert.equal(get('popGrid').innerHTML,beforePreviewCards);
popPreview.listeners.click({target:popPreview,clientX:500,clientY:500});assert.equal(popPreview.open,true,'Clicking modal whitespace is not a backdrop close');
popPreview.listeners.click({target:popPreview,clientX:10,clientY:10});assert.equal(popPreview.open,false);
assert.equal(previewHost.innerHTML,'');assert.equal(previewTrigger.attrs['aria-expanded'],'false');assert.equal(document.activeElement,previewTrigger);assert.equal(document.body.style.overflow,previewOverflow);
get('popTableMode').listeners.click();get('popTableRows').listeners.click(previewEvent);assert.equal(popPreview.open,true,'Table row also opens preview');
let previewCancelled=false;popPreview.listeners.cancel({preventDefault(){previewCancelled=true;}});assert(previewCancelled);assert.equal(popPreview.open,false);
get('popTableRows').listeners.click(previewEvent);popPreview.listeners.click({target:popPreview,clientX:10,clientY:10});assert.equal(popPreview.open,false);
get('popGrid').listeners.click(previewEvent);context.window.listeners.hashchange();assert.equal(popPreview.open,false,'History/navigation releases preview');
const invalidPreviewEvent={target:{closest:selector=>selector==='[data-pop]'?{dataset:{pop:'NO-SUCH-POP'}}:null}};
get('popTableRows').listeners.click(invalidPreviewEvent);assert.equal(popPreview.open,false);
const cardDetailButtons=(get('popCardsMode').listeners.click(),get('popGrid').innerHTML.match(/data-pop-detail=/g)||[]).length;
assert.equal(cardDetailButtons,cardHues().size,'Every POP card has one explicit detail action');
let cardButtonDepth=0;for(const m of get('popGrid').innerHTML.matchAll(/<\/?button\b[^>]*>/g)){cardButtonDepth+=m[0].startsWith('</')?-1:1;assert(cardButtonDepth>=0&&cardButtonDepth<=1,'Preview/detail are sibling controls, never nested buttons');}assert.equal(cardButtonDepth,0);
get('popTableMode').listeners.click();assert.equal((get('popTableRows').innerHTML.match(/data-pop-detail=/g)||[]).length,tableRows().length);
const rowActionCells=get('popTableRows').innerHTML.match(/<td class="na-pop-row-actions">[\s\S]*?<\/td>/g)||[];
assert.equal(rowActionCells.length,tableRows().length);assert(rowActionCells.every(cell=>cell.includes('>Chi tiết</button>')));
get('popTableRows').listeners.click({target:{closest:selector=>selector==='[data-pop-detail]'?{dataset:{popDetail:previewCode}}:previewEntry}});
assert.equal(popPreview.open,false,'Details does not also launch a popup');assert.equal(context.location.hash,'#pop/'+previewCode);assert.equal(get('popDetailPage').hidden,false);
// Layer 1 switches layouts without changing the original device list or search.
const cardDeviceIndices=[...get('detailDeviceGroups').innerHTML.matchAll(/data-l1-device="(\d+)"/g)].map(m=>Number(m[1]));
const firstDeviceCards=get('detailDeviceGroups').innerHTML;
get('deviceTableMode').listeners.click();assert.equal(get('deviceTableMode').attrs['aria-pressed'],'true');assert.equal(storage.get('netauto.pop.deviceListView'),'table');
assert.equal((get('detailDeviceGroups').innerHTML.match(/class="l1-device-table"/g)||[]).length,2);
assert.deepEqual([...get('detailDeviceGroups').innerHTML.matchAll(/data-l1-device="(\d+)"/g)].map(m=>Number(m[1])),cardDeviceIndices,'Device table preserves type ordering and original source indices');
for(const device of previewRecords)for(const value of [device.name,device.ip,device.model])if(value&&value!=='UNKNOWN')assert(get('detailDeviceGroups').innerHTML.includes(value));
get('detailDeviceSearch').value='OPMS';get('detailDeviceSearch').listeners.input();
const filteredDeviceTable=get('detailDeviceGroups').innerHTML;assert.equal((filteredDeviceTable.match(/data-l1-device=/g)||[]).length,1);
get('deviceCardsMode').listeners.click();assert.equal(get('detailDeviceSearch').value,'OPMS');assert.equal((get('detailDeviceGroups').innerHTML.match(/data-l1-device=/g)||[]).length,1);
get('deviceTableMode').listeners.click();assert.equal(get('detailDeviceGroups').innerHTML,filteredDeviceTable);
context.window.NETAUTO_POP_DETAIL.refreshInventory(previewCode);assert.equal(get('detailDeviceGroups').innerHTML,filteredDeviceTable,'Async inventory refresh keeps the table mode and filter');
let launchedDevice=null;context.window.NETAUTO_POP_DETAIL.setDeviceHandler((p,d)=>{assert.equal(p.code,previewCode);launchedDevice=d;});
const filteredDeviceIndex=Number(filteredDeviceTable.match(/data-l1-device="(\d+)"/)[1]);
get('detailDeviceGroups').listeners.click({target:{closest:()=>({dataset:{l1Device:String(filteredDeviceIndex)}})}});
assert.strictEqual(launchedDevice,previewRecords[filteredDeviceIndex],'Table row uses the same Layer 2 handler and exact source object as cards');
get('detailDeviceSearch').value='NO-MATCH-___';get('detailDeviceSearch').listeners.input();assert(!get('detailDeviceGroups').innerHTML.includes('data-l1-device='));
get('detailDeviceSearch').value='';get('detailDeviceSearch').listeners.input();get('deviceCardsMode').listeners.click();assert.equal(get('detailDeviceGroups').innerHTML,firstDeviceCards);
get('deviceTableMode').listeners.click();
vm.runInNewContext(fs.readFileSync(path.join(mockup,'shared/netauto-pop-detail.js'),'utf8'),context,{filename:'netauto-pop-detail.js (device table preference)'});
context.window.NETAUTO_POP_DETAIL.open(previewSource);assert.equal(get('deviceTableMode').attrs['aria-pressed'],'true','Device view preference survives reload');
assert.equal(get('detailDeviceSearch').value,'');
const viewStorage=context.localStorage;context.localStorage={getItem(){throw new Error('Denied');},setItem(){throw new Error('Denied');}};
get('deviceCardsMode').listeners.click();assert.equal(get('deviceCardsMode').attrs['aria-pressed'],'true');context.localStorage=viewStorage;
const previewFixture={code:'TEST-PREVIEW',devices:[{type:'POWER',name:'<img src=x>',ip:'192.0.2.1',model:'EN1U',vendor:'UNKNOWN',function:'<script>bad</script>'},{type:'POWER',name:'DELTA-TEST',ip:'192.0.2.2',model:'DE01',vendor:'UNKNOWN',function:'POWER'}]};
const previewFixtureBefore=JSON.stringify(previewFixture);context.window.NETAUTO_POP_DETAIL.preview(previewFixture,previewTrigger);
assert(previewHost.innerHTML.includes('ENATEL · EN1U')&&previewHost.innerHTML.includes('DELTA · DE01'));
assert(previewHost.innerHTML.includes('&lt;img')&&previewHost.innerHTML.includes('&lt;script&gt;'));assert(!previewHost.innerHTML.includes('<img')&&!previewHost.innerHTML.includes('<script>'));
assert(!previewHost.innerHTML.includes('data-l1-device=')&&!previewHost.innerHTML.includes('<button'));
context.window.NETAUTO_POP_DETAIL.closePreview();assert.equal(JSON.stringify(previewFixture),previewFixtureBefore);assert.equal(JSON.stringify(previewRecords),previewSourceBefore);
const queuedPreviewCloses=[],normalPreviewClose=popPreview.close;
popPreview.close=function(){this.open=false;queuedPreviewCloses.push(()=>this.listeners.close());};
context.window.NETAUTO_POP_DETAIL.preview(previewFixture,previewTrigger);context.window.NETAUTO_POP_DETAIL.closePreview();
context.window.NETAUTO_POP_DETAIL.preview(previewSource,previewTrigger);queuedPreviewCloses.shift()();
assert.equal(popPreview.open,true);assert.equal(get('popPreviewName').textContent,previewCode);assert(previewHost.innerHTML.includes(previewRecords[0].name));
assert.equal(document.body.style.overflow,'hidden','An old queued close cannot clear/unlock a newly opened preview');
popPreview.close=normalPreviewClose;context.window.NETAUTO_POP_DETAIL.closePreview();
context.window.NETAUTO_POP_DETAIL.preview({code:'TEST-EMPTY-PREVIEW',devices:[]},previewTrigger);assert(previewHost.innerHTML.includes('Chưa có thiết bị trong POP này.'));context.window.NETAUTO_POP_DETAIL.closePreview();
assert(html.includes('shared/netauto-pop-device-views.css'));assert(html.indexOf('id="popPreviewDialog"')>html.indexOf('id="popDetailPage"'));
const deviceViewsCSS=fs.readFileSync(path.join(mockup,'shared/netauto-pop-device-views.css'),'utf8');
assert(deviceViewsCSS.includes('::backdrop')&&deviceViewsCSS.includes('overscroll-behavior:contain')&&deviceViewsCSS.includes('@media(pointer:coarse)'));
assert(deviceViewsCSS.includes('cursor:default')&&deviceViewsCSS.includes('grid-template-columns:repeat(4'));
console.log('PASS: explicit Layer 0 detail actions vs read-only native preview, original grouped device cards, route/inventory isolation, close/backdrop/Escape/history/focus/scroll, Layer 1 cards/table parity/search/order/navigation/persistence and EN/DE/XSS/source safety.');

// Table location choices are column visibility controls, never data filters.
context.location.hash='#pop';context.window.listeners.hashchange();mode('many');reset();get('popTableMode').listeners.click();
assert.equal(get('popLocationColumns').hidden,false);
for(const [key,shown]of [['area',false],['zone',true],['province',true],['branch',false]]){
  assert.equal(get('popColumn-'+key).checked,shown);assert.equal(get('popTableView').attrs['data-hide-'+key],String(!shown));
}
const changeColumn=(key,checked)=>get('popLocationColumns').listeners.change({target:{dataset:{popColumn:key},checked}});
const columnsBeforeHTML=get('popTableRows').innerHTML,columnsBeforeCount=get('popPageCount').textContent,columnsBeforeSummary=get('deviceTotal').textContent;
get('popTableView').scrollTop=370;get('popTableView').scrollLeft=52;
changeColumn('area',true);changeColumn('branch',true);
assert.equal(get('popTableView').attrs['data-location-count'],'4');assert.equal(get('popTableRows').innerHTML,columnsBeforeHTML,'Checkboxes do not rerender rows');
assert.equal(get('popPageCount').textContent,columnsBeforeCount);assert.equal(get('deviceTotal').textContent,columnsBeforeSummary);
assert.equal(get('popTableView').scrollTop,370);assert.equal(get('popTableView').scrollLeft,52);
for(const key of ['area','zone','province','branch'])changeColumn(key,false);
assert.equal(get('popTableView').attrs['data-location-count'],'0');assert.equal(storage.get('netauto.pop.locationColumns'),'[]');
get('popLoadMore').listeners.click();assert.equal(tableRows().length,200);
assert(tableRows().every(row=>(row.body.match(/data-pop-column=/g)||[]).length===4),'Appended rows use the same hideable column attributes');
get('popCardsMode').listeners.click();assert.equal(get('popLocationColumns').hidden,true,'Location choices only appear in Table');
assert.equal((get('popGrid').innerHTML.match(/class="na-pop-properties"/g)||[]).length,cardHues().size);
for(const key of ['popType','popFunction','customerCount'])assert.equal((get('popGrid').innerHTML.match(new RegExp('data-pop-field="'+key+'"','g'))||[]).length,cardHues().size);
get('popTableMode').listeners.click();assert.equal(tableRows().length,200);assert.equal(get('popLocationColumns').hidden,false);
for(const row of tableRows())for(const [key,value]of [['popType','Outdoor'],['popFunction','POP AON+PON'],['customerCount','727']])assert(row.body.includes(`data-pop-field="${key}" data-demo="true" title="Dữ liệu giả lập để minh hoạ Interface">${key==='customerCount'?`<span class="na-pop-table-value">${value}</span>`:value}</td>`));
const suppliedMeta={...allPops[0],popType:'Indoor',popFunction:'AON',customerCount:0},suppliedMetaBefore=JSON.stringify(suppliedMeta);
const suppliedFields=context.window.NETAUTO_POP_DETAIL.metadata(suppliedMeta);
assert.equal(suppliedFields.popType.value,'Indoor');assert.equal(suppliedFields.customerCount.value,0);assert.equal(suppliedFields.customerCount.demo,false);
const suppliedRow=context.window.__testPopTableRow(suppliedMeta),suppliedCard=context.window.__testPopCard(suppliedMeta,'province');
for(const [key,value]of [['popType','Indoor'],['popFunction','AON'],['customerCount','0']]){
  assert(suppliedRow.includes(`data-pop-field="${key}" data-demo="false">${key==='customerCount'?`<span class="na-pop-table-value${Number(value)===0?' is-zero':''}">${value}</span>`:value}</td>`));
  assert(new RegExp(`data-pop-field="${key}" data-demo="false"><small>[^<]+</small><b>${value}</b>`).test(suppliedCard));
}
assert.equal(JSON.stringify(suppliedMeta),suppliedMetaBefore);
context.window.NETAUTO_POP_DETAIL.open(suppliedMeta);assert(get('detailPopFields').innerHTML.includes('<dd>Indoor</dd>')&&get('detailPopFields').innerHTML.includes('<dd>AON</dd>')&&get('detailPopFields').innerHTML.includes('<dd>0</dd>'),'Layer 0 and Layer 1 use the same real-value precedence');
const unsafeMeta={...allPops[0],popType:'<img src=x>',popFunction:'"><script>bad</script>',customerCount:'<svg onload=bad>'};
for(const markup of [context.window.__testPopTableRow(unsafeMeta),context.window.__testPopCard(unsafeMeta,'province')]){
  assert(markup.includes('&lt;img')&&markup.includes('&lt;script&gt;')&&markup.includes('&lt;svg'));
  assert(!markup.includes('<img')&&!markup.includes('<script>')&&!markup.includes('<svg onload'));
}
context.location.hash='#pop';context.window.listeners.hashchange();
vm.runInNewContext(fs.readFileSync(path.join(mockup,'shared/netauto-app.js'),'utf8'),context,{filename:'netauto-app.js (empty location preferences)'});
assert.equal(get('popTableView').attrs['data-location-count'],'0','An intentionally empty selection persists');
storage.set('netauto.pop.locationColumns','["area","__proto__"]');
vm.runInNewContext(fs.readFileSync(path.join(mockup,'shared/netauto-app.js'),'utf8'),context,{filename:'netauto-app.js (invalid location preferences)'});
assert.equal(get('popColumn-area').checked,false);assert.equal(get('popColumn-zone').checked,true);assert.equal(get('popColumn-province').checked,true);assert.equal(get('popColumn-branch').checked,false);
const columnsStorage=context.localStorage;context.localStorage={getItem(){throw new Error('Denied');},setItem(){throw new Error('Denied');}};
changeColumn('area',true);assert.equal(get('popTableView').attrs['data-hide-area'],'false');context.localStorage=columnsStorage;
for(const key of ['area','zone','province','branch'])assert(popTableCSS.includes(`[data-hide-${key}=true] [data-pop-column=${key}]`));
assert(popTableCSS.includes('{display:none}')&&popTableCSS.includes('.na-pop-column-picker label:focus-within'));
assert(!html.includes('id="closePopPreview"')&&!html.includes('pop-preview-readonly')&&!html.includes('>Chỉ xem<'));
const popupTargetA=allPops.find(p=>p.code==='AGGM001'),popupTargetB=allPops.find(p=>p.code==='HCMP001')||previewSource;
context.window.NETAUTO_POP_DETAIL.preview(popupTargetA,previewTrigger);assert.equal(get('popPreviewDetails').dataset.popDetail,popupTargetA.code);
context.window.NETAUTO_POP_DETAIL.preview(popupTargetB,previewTrigger);assert.equal(get('popPreviewDetails').dataset.popDetail,popupTargetB.code,'Popup action always follows the latest visible POP');
assert.equal(document.activeElement,get('popPreviewDetails'));
get('popPreviewDetails').listeners.click();assert.equal(popPreview.open,false);assert.equal(context.location.hash,'#pop/'+popupTargetB.code);assert.equal(get('detailPopName').textContent,popupTargetB.code);
assert.equal(get('popDetailPage').hidden,false);assert.equal(get('popPreviewDetails').dataset.popDetail,undefined);
const closedPreviewRoute=context.location.hash;get('popPreviewDetails').listeners.click();assert.equal(context.location.hash,closedPreviewRoute,'A closed popup cannot navigate with a stale action');
assert.equal(JSON.stringify(allPops),tableSourceBefore);
console.log('PASS: Table-only location column picker defaults Vùng/Tỉnh, independent visibility/persistence/append/scroll, shared three-field metadata with real/zero/XSS safety, popup Details targets current POP and no readonly label/close-X.');

// Compact landscape cards: one identity header, horizontal metadata and aligned counters.
const landscapeCard=context.window.__testPopCard(allPops[0],'province');
const previewButtonStart=landscapeCard.indexOf('class="na-pop-preview"'),identityStart=landscapeCard.indexOf('class="na-pop-head"');
assert(previewButtonStart>=0&&identityStart>previewButtonStart&&landscapeCard.includes('class="na-pop-title-block"'));
assert(landscapeCard.indexOf('class="na-pop-card-name"')<landscapeCard.indexOf('class="na-pop-meta"'));
assert(landscapeCard.indexOf('class="na-pop-detail-action"')>landscapeCard.indexOf('</button>'),'Details stays a sibling of the preview button, positioned at the top-right by CSS');
const landscapeCSS=fs.readFileSync(path.join(mockup,'shared/netauto-pop-table.css'),'utf8');
assert(landscapeCSS.includes('#popPage .na-pop-card>.na-pop-detail-action{position:absolute;top:12px;right:12px;z-index:2}'));
assert(landscapeCSS.includes('.na-pop-properties{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr) minmax(0,1.1fr)'));
assert(landscapeCSS.includes('.na-pop-preview .na-pop-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;'));
assert(/\.na-pop-preview \.na-pop-metrics>span\{[^}]*display:flex;flex-direction:column;align-items:center;justify-content:center;/.test(landscapeCSS));
assert(/\.na-pop-preview \.na-pop-metrics b\{[^}]*text-align:center;[^}]*font-variant-numeric:tabular-nums/.test(landscapeCSS));
assert(landscapeCSS.includes('overflow-wrap:anywhere'),'Long source values remain readable without forcing a fixed card height');
console.log('PASS: compact horizontal POP card composition, aligned four-cell device metrics, separate accessible preview/detail actions, same four-card responsive grid and unchanged data.');

// Sparse corner dots and circuit traces replace the rings without an interactive overlay.
const cornerBaseRule=landscapeCSS.match(/#popPage \.na-pop-card:before,#popPage \.na-pop-card:after\{([^}]+)\}/)[1];
const cornerDotsRule=landscapeCSS.match(/#popPage \.na-pop-card:before\{([^}]+)\}/)[1];
const cornerCircuitRule=landscapeCSS.match(/^#popPage \.na-pop-card:after\{([^}]+)\}/m)[1];
assert(cornerBaseRule.includes('top:0;right:0;width:180px;height:112px;'));
assert(cornerBaseRule.includes('pointer-events:none')&&cornerBaseRule.includes('z-index:0;'));
assert(cornerDotsRule.includes('16px 16px')&&cornerDotsRule.includes('mask-image:linear-gradient(225deg,'));
assert(cornerCircuitRule.includes('var(--na-pop-accent) 13%')&&cornerCircuitRule.includes('mask-size:100% 100%'));
const circuitVector=decodeURIComponent(cornerCircuitRule.match(/data:image\/svg\+xml,([^\"]+)/)[1]);
assert(circuitVector.includes('<path d="M180')&&circuitVector.includes('<circle'));
assert(!landscapeCSS.includes('radial-gradient(circle closest-side,'),'Concentric corner arcs are removed');
assert(/\.na-pop-card\{[^}]*isolation:isolate/.test(landscapeCSS));
assert(landscapeCSS.includes('.na-pop-preview{position:relative;z-index:1;'));
assert(landscapeCSS.includes('@media(forced-colors:active){#popPage .na-pop-card:before,#popPage .na-pop-card:after{display:none}}'));
console.log('PASS: sparse fading dot grid and thin vector circuit/node corner motif beneath preview/details, no pointer interference and forced-color fallback.');

// Card-only painterly highlights use one POP tone, never four category colors.
const metricTileCSS=landscapeCSS.match(/#popPage \.na-pop-preview \.na-pop-metrics>span\{([^}]+)\}/)[1];
assert(metricTileCSS.includes('border:0;')&&!metricTileCSS.includes('border-right'));
assert(metricTileCSS.includes('background:transparent'));
assert(!landscapeCSS.includes('--na-metric-tone'),'All four brush marks share the POP accent instead of category colors');
assert(/\.na-pop-preview \.na-pop-metrics>span>span\{[^}]*color:var\(--na-muted\)/.test(landscapeCSS));
const paintedSelector='#popPage .na-pop-preview :is(.na-pop-metrics b,[data-pop-field=customerCount] b)';
const paintedBase=landscapeCSS.split(paintedSelector+'{')[1].split('}')[0];
assert(paintedBase.includes('color:var(--na-text)')&&paintedBase.includes('border:0;')&&paintedBase.includes('background:transparent'),'Customer total and device counts share neutral ink, with no rectangular tag');
const brushBefore=landscapeCSS.split(paintedSelector+':before{')[1].split('}')[0];
assert(brushBefore.includes('pointer-events:none')&&brushBefore.includes('z-index:-1'));
assert(brushBefore.includes('var(--na-pop-accent) 12%')&&!brushBefore.includes('repeating-linear-gradient'));
assert(brushBefore.includes('height:30px;')&&brushBefore.includes('rotate(-3deg)'));
assert(!landscapeCSS.includes('--na-brush-tilt')&&!brushBefore.includes('clip-path:polygon('),'No per-counter rotation or angular polygon edges');
assert.equal((brushBefore.match(/radial-gradient\(/g)||[]).length,5,'Three soft color blooms and just two tiny satellite splashes');
assert(brushBefore.includes('ellipse at 38% 48%')&&brushBefore.includes('ellipse at 68% 55%')&&brushBefore.includes('ellipse at 46% 68%'),'Asymmetric overlapping washes have softly fading edges');
assert(brushBefore.includes('ellipse 1.4px 1.1px')&&brushBefore.includes('ellipse 1px 1.4px'));
assert(!/mask-image|clip-path|border-radius|data:image/.test(brushBefore),'The wash fades naturally, with no hard silhouette, bristle texture or external asset');
assert(paintedBase.includes('isolation:isolate'));
assert(landscapeCSS.includes('@media(forced-colors:active){'+paintedSelector+':before{display:none}}'));
assert(!/<script|<image|href=|<foreignObject/.test(circuitVector),'The retained circuit mask is a self-contained vector without external assets');
const metadataTagCSS=landscapeCSS.match(/#popPage \.na-pop-properties \[data-pop-field=popType\] b\{([^}]+)\}/)[1];
assert(metadataTagCSS.includes('border-radius:6px;')&&metadataTagCSS.includes('currentColor 8%'));
assert(!metadataTagCSS.includes('popFunction'),'Function remains plain text, POP type keeps its original tag');
assert(landscapeCSS.includes('min-height:24px;box-sizing:border-box;max-width:100%'),'Tagged and plain property values remain aligned and can wrap');
console.log('PASS: one identical card watercolor wash for device counts/customer total, three asymmetrical fading blooms plus two faint micro-splashes, neutral readable ink, no external assets and unchanged corner circuits, metadata and data.');

// Table presentation: no action divider, proportional columns and compact watercolor numbers.
const balancedTableCSS=fs.readFileSync(path.join(mockup,'shared/netauto-pop-table.css'),'utf8');
const actionRule=balancedTableCSS.match(/#popPage \.na-pop-table \.na-pop-row-actions\{([^}]+)\}/)[1];
assert(actionRule.includes('position:sticky;right:0;text-align:center;border-left:0;box-shadow:none'));
assert(balancedTableCSS.includes('table-layout:fixed;'));
assert(balancedTableCSS.includes('.na-pop-table .na-pop-number{text-align:center;'));
assert(balancedTableCSS.includes('.na-pop-info-cell[data-pop-field=customerCount]{text-align:center;'));
assert(balancedTableCSS.includes('--na-table-weight:calc(110 + var(--na-area-weight) + var(--na-zone-weight) + var(--na-province-weight) + var(--na-branch-weight))'));
const locationWeights={area:10,zone:7,province:8,branch:12};
for(const [key,weight] of Object.entries(locationWeights)){
  assert(balancedTableCSS.includes(`[data-hide-${key}=true]{--na-${key}-weight:0}`));
  assert(balancedTableCSS.includes(`thead [data-pop-column=${key}]{width:calc(100% / var(--na-table-weight) * ${weight})}`));
}
// All 16 picker combinations preserve the base-column ratios and normalize to 100%.
for(let mask=0;mask<16;mask++){
  const visible=Object.values(locationWeights).filter((_,i)=>mask&(1<<i));
  const weights=[18,10,18,12,8,8,8,8,10,10,...visible];
  const total=110+visible.reduce((sum,n)=>sum+n,0);
  assert(Math.abs(weights.reduce((sum,n)=>sum+100*n/total,0)-100)<1e-10);
}
const tableWashSelector='#popPage .na-pop-table :is(.na-pop-table-metric,.na-pop-table-value,.na-pop-row-total)';
const tableWashBase=balancedTableCSS.split(tableWashSelector+'{')[1].split('}')[0];
assert(tableWashBase.includes('border:0;')&&tableWashBase.includes('background:transparent;')&&tableWashBase.includes('border-radius:0;'));
assert(tableWashBase.includes('--na-table-wash-tone:var(--na-row-accent)')&&tableWashBase.includes('color:var(--na-text)'),'All six numeric values share the POP row hue and neutral theme-aware ink');
assert(tableWashBase.includes('min-height:26px;')&&tableWashBase.includes('font-variant-numeric:tabular-nums'));
assert(tableWashBase.includes('position:relative;isolation:isolate;'));
const tableWashPaint=balancedTableCSS.split(tableWashSelector+':before{')[1].split('}')[0];
assert.equal((tableWashPaint.match(/radial-gradient\(/g)||[]).length,5);
for(const center of ['38% 48%','68% 55%','46% 68%'])assert(tableWashPaint.includes('ellipse at '+center));
assert(tableWashPaint.includes('height:24px;')&&tableWashPaint.includes('var(--na-table-wash-tone) 8%')&&!tableWashPaint.includes(' 12%'),'Table washes are smaller and lighter than card washes');
assert(tableWashPaint.includes('pointer-events:none')&&tableWashPaint.includes('z-index:-1;'));
assert(balancedTableCSS.includes('@media(forced-colors:active){'+tableWashSelector+':before{display:none}}'));
const tableZeroWash=balancedTableCSS.split(tableWashSelector+'.is-zero{')[1].split('}')[0];
assert(tableZeroWash.includes('--na-table-wash-tone:var(--na-muted)')&&tableZeroWash.includes('color:var(--na-muted)'),'Every zero count uses neutral gray ink and wash');
assert(balancedTableCSS.includes('.na-pop-table .na-pop-row-total{font-weight:800}'));
assert(/tbody td,#popPage \.na-pop-table tbody th\{[^}]*var\(--na-row-accent\) 1%/.test(balancedTableCSS));
assert(/tbody tr:nth-child\(even\) td\{[^}]*var\(--na-row-accent\) 2%/.test(balancedTableCSS));
assert(/tbody tr:focus-within th\{[^}]*var\(--na-row-accent\) 5%/.test(balancedTableCSS));
const tableZeroCard={...allPops[0],customerCount:0,counts:{switch:0,olt:0,power:0,pi:0}};
const pastelZeroRow=context.window.__testPopTableRow(tableZeroCard);
assert.equal((pastelZeroRow.match(/na-pop-table-metric na-pop-\w+ is-zero">0<\/span>/g)||[]).length,4);
assert(pastelZeroRow.includes('<span class="na-pop-table-value is-zero">0</span>'));
assert(pastelZeroRow.includes('<b class="na-pop-row-total is-zero">0</b>'));
assert.equal((pastelZeroRow.match(/ is-zero"/g)||[]).length,6,'Zero styling covers customer total, four device types and device total');
assert(!context.window.__testPopCard(tableZeroCard,'province').includes('na-pop-table-value'),'Table-only badge markup does not change cards');
console.log('PASS: compact watercolor washes on all six Table counts, one POP hue per row, neutral zero styling including both totals, centered readable ink, balanced columns, forced-color fallback and unchanged card/navigation behavior.');

// A fresh visit gets only Vùng/Tỉnh; navigation never resets the user's choices.
storage.delete('netauto.pop.locationColumns');storage.delete('netauto.pop.listView');
context.window.listeners={};context.location.hash='#pop';context.history.scrollRestoration='auto';
context.window.scrollX=0;context.window.scrollY=0;
context.window.scrollTo=position=>{context.window.scrollX=position.left;context.window.scrollY=position.top;};
vm.runInNewContext(fs.readFileSync(path.join(mockup,'shared/netauto-pop-detail.js'),'utf8'),context,{filename:'netauto-pop-detail.js (scroll navigation)'});
vm.runInNewContext(fs.readFileSync(path.join(mockup,'shared/netauto-app.js'),'utf8'),context,{filename:'netauto-app.js (scroll navigation)'});
assert.equal(context.history.scrollRestoration,'manual','Browser automatic window scrolling cannot compete with the portal router');
get('popTableMode').click();
for(const [key,shown] of [['area',false],['zone',true],['province',true],['branch',false]]){
  assert.equal(get('popColumn-'+key).checked,shown);assert.equal(get('popTableView').attrs['data-hide-'+key],String(!shown));
}
changeColumn('area',true);changeColumn('zone',false);changeColumn('province',false);changeColumn('branch',true);
const savedColumnChoice=storage.get('netauto.pop.locationColumns');
const assertColumnChoice=()=>{
  assert.equal(storage.get('netauto.pop.locationColumns'),savedColumnChoice);
  for(const [key,shown] of [['area',true],['zone',false],['province',false],['branch',true]])assert.equal(get('popColumn-'+key).checked,shown);
};
const scrollViewport=get('portalContent'),scrollTable=get('popTableView');
const setViewport=(top,left,windowTop,windowLeft)=>{scrollViewport.scrollTop=top;scrollViewport.scrollLeft=left;context.window.scrollY=windowTop;context.window.scrollX=windowLeft;};
const viewportPosition=()=>[scrollViewport.scrollTop,scrollViewport.scrollLeft,context.window.scrollY,context.window.scrollX];
get('popLoadMore').click();assert.equal(tableRows().length,200);
setViewport(380,17,220,11);scrollTable.scrollTop=714;scrollTable.scrollLeft=96;
const rememberedTablePosition=viewportPosition();
openDetail('AGGP006');assert.deepEqual(viewportPosition(),[0,0,0,0],'A new detail page starts at the top, without overwriting its parent position');
const nestedDeviceScrolls=[element('networkTableScroll'),element('powerTableScroll')];
get('popDetailPage').querySelectorAll=selector=>selector==='.l1-device-table-scroll,.l1-table-wrap,.l2-table-wrap'?nestedDeviceScrolls:[];
setViewport(900,7,145,3);nestedDeviceScrolls[0].scrollLeft=220;nestedDeviceScrolls[1].scrollLeft=80;
const rememberedDetailPosition=viewportPosition();
get('detailDeviceGroups').listeners.click({target:{closest:()=>({dataset:{l1Device:'0'}})}});
assert.equal(get('deviceDetailPage').hidden,false);assert.deepEqual(viewportPosition(),[0,0,0,0]);
setViewport(300,0,80,0);get('backToPopDetail').click();
assert.deepEqual(viewportPosition(),rememberedDetailPosition,'Layer 2 back restores the Layer 1 viewport');
assert.equal(nestedDeviceScrolls[0].scrollLeft,220);assert.equal(nestedDeviceScrolls[1].scrollLeft,80);
get('backToPopList').click();
assert.deepEqual(viewportPosition(),rememberedTablePosition,'Layer 1 back restores both portal and responsive window scroll');
assert.equal(scrollTable.scrollTop,714);assert.equal(scrollTable.scrollLeft,96);
assert.equal(tableRows().length,200,'Back retains the accumulated rows needed to restore the original position');assertColumnChoice();

// Each mode owns its own position; a first switch never uses the old footer anchor.
get('popCardsMode').click();assert.deepEqual(viewportPosition(),[0,0,0,0],'Returning to the initial card view uses its own top position, never the table footer');
assert(balancedTableCSS.includes('#popPage{container:pop-cards / inline-size;overflow-anchor:none}'));
setViewport(1700,5,340,4);const rememberedCardPosition=viewportPosition();
openDetail('AGGP006');get('backToPopList').click();assert.deepEqual(viewportPosition(),rememberedCardPosition);assertColumnChoice();
get('popTableMode').click();assert.deepEqual(viewportPosition(),rememberedTablePosition);assert.equal(scrollTable.scrollTop,714);assert.equal(scrollTable.scrollLeft,96);
get('popCardsMode').click();assert.deepEqual(viewportPosition(),rememberedCardPosition);
const cardsMarkupBeforeSameMode=get('popGrid').innerHTML;get('popCardsMode').click();
assert.equal(get('popGrid').innerHTML,cardsMarkupBeforeSameMode);assert.deepEqual(viewportPosition(),rememberedCardPosition);

// Native Back/Forward (including duplicate popstate/hashchange) uses the same memory.
openDetail('AGGP006');setViewport(1120,2,170,1);
const historyDetailPosition=viewportPosition();
const historyDevice=context.window.NETAUTO_POP_DETAIL_DATA.pops.AGGP006[0];
context.location.hash=`#pop/AGGP006/device/${encodeURIComponent(historyDevice.name)}`;context.window.listeners.popstate();
setViewport(240,1,60,2);const historyDevicePosition=viewportPosition();
context.location.hash='#pop/AGGP006';context.window.listeners.popstate();context.window.listeners.hashchange();
assert.deepEqual(viewportPosition(),historyDetailPosition);
context.location.hash='#pop';context.window.listeners.popstate();context.window.listeners.hashchange();
assert.deepEqual(viewportPosition(),rememberedCardPosition);assertColumnChoice();
context.location.hash=`#pop/AGGP006/device/${encodeURIComponent(historyDevice.name)}`;context.window.listeners.popstate();
assert.deepEqual(viewportPosition(),historyDevicePosition,'History forward restores a previously visited device');
get('backToPopDetail').click();get('backToPopList').click();

// Late inventory refresh may rebuild inner tables but cannot reset their offsets.
const scrollStore=context.window.NETAUTO_POP_DETAIL_DATA,realEnsurePop=scrollStore.ensurePop;
let pendingInventory;
scrollStore.ensurePop=(_code,callback)=>{pendingInventory=callback;};
openDetail('AGGP006');setViewport(1500,6,180,2);nestedDeviceScrolls[0].scrollLeft=170;
const beforeLateInventory=viewportPosition(),realRefreshInventory=context.window.NETAUTO_POP_DETAIL.refreshInventory;
context.window.NETAUTO_POP_DETAIL.refreshInventory=code=>{nestedDeviceScrolls.forEach(node=>{node.scrollTop=0;node.scrollLeft=0;});realRefreshInventory(code);};
pendingInventory(null);
assert.deepEqual(viewportPosition(),beforeLateInventory);assert.equal(nestedDeviceScrolls[0].scrollLeft,170);
context.window.NETAUTO_POP_DETAIL.refreshInventory=realRefreshInventory;
get('backToPopList').click();setViewport(1830,0,390,0);pendingInventory(null);
assert.deepEqual(viewportPosition(),[1830,0,390,0],'A late response for an inactive layer cannot scroll the current list');
scrollStore.ensurePop=realEnsurePop;

// Deferred layout repair is canceled by newer navigation and never undoes user scrolling.
const scrollFrames=[],instantScrollFrame=context.requestAnimationFrame;
context.requestAnimationFrame=callback=>{scrollFrames.push(callback);return scrollFrames.length;};
get('popTableMode').click();get('popCardsMode').click();openDetail('AGGP006');
for(const callback of scrollFrames.splice(0))callback();
assert.deepEqual(viewportPosition(),[0,0,0,0]);assert.equal(get('popDetailPage').hidden,false);
get('backToPopList').click();setViewport(2110,0,420,0);
for(const callback of scrollFrames.splice(0))callback();
assert.deepEqual(viewportPosition(),[2110,0,420,0],'A user scroll after the immediate restoration wins over a queued layout frame');
context.requestAnimationFrame=instantScrollFrame;
get('popTableMode').click();search('AGGP006');get('popCardsMode').click();get('popTableMode').click();
assert.equal(scrollTable.scrollTop,0);assert.equal(scrollTable.scrollLeft,0,'New filtered results discard offsets from the old result set');assertColumnChoice();
console.log('PASS: first-use Vùng/Tỉnh defaults, unchanged custom columns across all layers, independent card/table viewport memory, nested scroll offsets, app/browser Back/Forward, retained batches, late inventory, duplicate routes and stale-frame/user-scroll safety.');
