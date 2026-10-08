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
    id, dataset, value: '', innerHTML: '', textContent: '', hidden: false, disabled: false,
    attrs: {}, listeners: {}, style: {}, tagName: 'DIV',
    classList: {
      add: name => classes.add(name), remove: name => classes.delete(name),
      contains: name => classes.has(name),
      toggle(name, force = !classes.has(name)) { if (force) classes.add(name); else classes.delete(name); },
    },
    setAttribute(key, value) { this.attrs[key] = value; },
    addEventListener(type, callback) { this.listeners[type] = callback; },
    focus() { document.activeElement = this; }, scrollIntoView() {}, scrollTo() {}, querySelectorAll() { return []; },
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
get('popPageSize').value = '36';
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
  querySelector() { return element(); },
  addEventListener() {},
  createElement(tag) { return {tagName:tag.toUpperCase(),remove(){},click() { document.lastDownload = this.download; }}; },
  head:{appendChild(script){vm.runInNewContext(fs.readFileSync(path.join(mockup,script.src),'utf8'),context,{filename:script.src});script.onload();}},
};
const context = {
  document, window: {listeners: {}, addEventListener(type, callback) { this.listeners[type] = callback; }}, console, Intl,
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
for (const script of ['netauto-data.js','netauto-pop-index.js', 'drop-point-response.js', 'netauto-pop-store.js', 'netauto-pop-reference.js', 'netauto-pop-detail.js', 'huawei-device-layouts.js', 'netauto-device-port-models.js', 'netauto-device-ports.js', 'netauto-device-detail.js', 'netauto-app.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(mockup, 'shared', script), 'utf8'), context, {filename: script});
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
  const card = get('popGrid').innerHTML.match(new RegExp(`data-pop="${pop.code}"[\\s\\S]*?(?=</button>)`))[0];
  for (const [label, key] of [['Switch', 'switch'], ['OLT', 'olt'], ['Nguồn', 'power'], ['PI', 'pi']]) {
    assert(new RegExp(`<span>${label}</span><b[^>]*>${pop.counts[key]}</b>`).test(card), `${pop.code}: ${label} must match source`);
  }
}
assert.equal(initialHues.size,36,'Only the first page of POP cards is rendered');
assert.equal(get('popPrevPage').disabled,true);
assert.equal(get('popNextPage').disabled,false);
assert(get('popPageCount').textContent.includes('Trang 1/109'));
get('popNextPage').listeners.click();
assert(get('popPageCount').textContent.includes('37–72'));
assert.equal(get('popGrid').attrs['data-color-mode'],'province','Color mode is based on all results, not the visible page');
for(const [code,hue] of cardHues()){
  const province=context.window.NETAUTO_DATA.pops.find(pop=>pop.code===code).province;
  if(provinceHues.has(province))assert.equal(hue,provinceHues.get(province));
}
get('popPrevPage').listeners.click();
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
get('popNextPage').listeners.click();
assert.equal(cardHues().size,11);
for(const hue of cardHues().values())assert.equal(hue,visitHue,'Pagination keeps the same single-province color');
get('popPageSize').value='144';get('popPageSize').listeners.change();
assert.equal(get('popRegionFilters').hidden, true);
assert.equal(get('singleBranchScope').hidden, false);
assert.equal(get('resetPopFilters').hidden, true);
search('HCMP'); assert.equal(count(), 0);
get('refreshPop').listeners.click(); assert.equal(count(), 47);
search('AGGP006'); assert.equal(count(), 1);
assert.equal(cardHues().get('AGGP006'), visitHue, 'Search within one province retains the shared visit color');
get('popGrid').listeners.click({target: {closest: () => ({dataset: {pop: 'AGGP006'}})}});
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

const layer0Css = css.slice(css.indexOf('/* Approved POP Layer 0 only.'));
assert(layer0Css.includes('#popPage #popSearch:focus-visible{outline:none;box-shadow:none}'));
assert(layer0Css.includes('.na-pop-metrics>span{display:flex;align-items:center;justify-content:flex-start;gap:7px'));
assert(layer0Css.includes('.na-stat-card>span{font-size:13px;font-weight:650'));
assert(css.includes('.na-pop-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr))'));
console.log('PASS: Layer 0 colors, source counts, 3 scopes, filters/search/reset, full-page detail and return, Light/Dark, unchanged plans and real ONU response.');

// Layer 1: exercise interactions against the actual controller and dataset.
const openDetail = code => get('popGrid').listeners.click({target: {closest: () => ({dataset: {pop: code}})}});
const dataset = context.window.NETAUTO_POP_DETAIL_DATA;
const headerTagCounts=()=>new Map([...get('detailDeviceTypeStats').innerHTML.matchAll(/data-kind="([^"]+)"[^>]*>[\s\S]*?<b>([^<]+)<\/b>/g)].map(match=>[match[1],Number(match[2].replaceAll('.',''))]));
openDetail('AGGP006');
assert.equal(get('popOverviewPanel').hidden, false);
assert.equal(get('popMaterialsPanel').hidden, true);
assert.equal(get('detailDeviceTotal').textContent, '7 thiết bị · snapshot đầy đủ');
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
assert(get('detailPopMetadataNote').innerHTML.includes('5 trường giả lập'));
assert(get('detailPopMetadataNote').innerHTML.includes('dữ liệu thật'));
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
assert(get('detailPiSignals').innerHTML.includes('không phải chỉ số thực của POP AGGP006'));
get('detailPiDemo').checked = false;
get('detailPiDemo').listeners.change();
assert(get('detailPiSignals').innerHTML.includes('Chưa có response telemetry'));
get('detailPiDemo').checked = true; get('detailPiDemo').listeners.change();
assert(get('detailPiSignals').innerHTML.includes('61'));
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
assert(get('detailPiSignals').innerHTML.indexOf('l1-pi-layout')<get('detailPiSignals').innerHTML.indexOf('l1-alert-stats'),'Alerts must live inside the same grid as the sensors');
assert.equal((get('detailPiSignals').innerHTML.match(/<article class="l1-pi-block/g)||[]).length,4);
console.log('PASS: photographed asset rows, no SC column, source distinction, search/pagination, 4 aligned monitoring blocks, topology zoom/toggles/selection and no invented current-POP links.');
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
mode('many');get('popNextPage').listeners.click();
search('AGGP006');
assert(get('popPageCount').textContent.includes('Trang 1/1'),'Search resets the current page');
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
context.window.NETAUTO_POP_DETAIL.open(popForMetadata);
assert.equal(get('detailPopFields').innerHTML,firstSample,'Metadata samples stay stable across visits');
context.window.NETAUTO_POP_DETAIL.open({...popForMetadata,popType:'Loại từ nguồn',deployedAt:'01/01/2024',popFunction:'Chức năng từ nguồn',customerCount:0,address:'12 đường thật <Kiểm tra>'});
assert.equal((get('detailPopFields').innerHTML.match(/data-demo="false"/g)||[]).length,5);
assert(get('detailPopFields').innerHTML.includes('<dd>0</dd>'));
assert(get('detailPopFields').innerHTML.includes('Loại từ nguồn'));
assert(get('detailPopFields').innerHTML.includes('12 đường thật &lt;Kiểm tra&gt;'));
assert(!get('detailPopMetadataNote').innerHTML.includes('trường giả lập'));
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
assert(portCss.includes('border:1px solid color-mix(in srgb,var(--na-muted) 24%,var(--na-line))'),'Port group outlines are slightly stronger without increasing border thickness');
assert(portCss.includes('#devicePortInspector:not([hidden]){animation:na-port-dock-enter 180ms'));
assert(portCss.includes('#devicePortMenu:not([hidden]){animation:na-port-menu-enter 140ms'));
assert(portCss.includes('@media(prefers-reduced-motion:reduce){#devicePortInspector,#devicePortMenu{animation:none}}'));
const detailCss=fs.readFileSync(path.join(mockup,'shared/netauto-pop-detail.css'),'utf8');
assert(detailCss.includes('animation:na-topo-enter 220ms'));
assert(detailCss.includes('animation:na-topo-backdrop-enter 180ms'));
assert(detailCss.includes('@media(prefers-reduced-motion:reduce){#popDetailPage .l1-topo-dialog[open],#popDetailPage .l1-topo-dialog::backdrop{animation:none}}'));
assert(portCss.includes('grid-template-columns:repeat(var(--list-columns,8),minmax(0,1fr))'));
assert(/@media\(max-width:1120px\).*--list-columns:var\(--bank-compact-columns\)/.test(portCss));
assert(/@media\(max-width:650px\).*--list-columns:2;flex-basis:100%/.test(portCss));
assert(get('devicePortBanks').innerHTML.includes('<b>G0/1</b>'),'Port cards show readable interface names');
assert(!get('devicePortBanks').innerHTML.includes('data-port-tools'));
assert(!get('devicePortBanks').innerHTML.includes('⋮'),'No three-dot action on port cards');
assert(!get('devicePortBanks').innerHTML.includes('<small>'),'List cards display only the port name, not status text');
assert(/title="G0\/1 · [^"]+"/.test(get('devicePortBanks').innerHTML),'Status remains available in tooltips and accessible labels');
assert(portCss.includes('min-height:34px'),'Desktop list port buttons stay compact, close to the 35px faceplate ports');
assert(portCss.includes('max-width:calc(var(--list-columns)*116px + 18px)'),'Small and large banks cap port growth equally at 110px');
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
selectPort('G0/1',true);
assert.equal(get('deviceSelectedPortName').textContent,'G0/1');
assert.equal(get('devicePortMenu').hidden,false);
assert(get('devicePortMenu').innerHTML.includes('Khách hàng thuộc PON'));
assert(get('devicePortMenu').innerHTML.includes('Tập điểm thuộc PON'));
assert(/data-port-action="lacp" disabled/.test(get('devicePortMenu').innerHTML));
assert(!get('devicePortMenu').innerHTML.includes('Đổi Port Speed'));
assert(get('devicePortResult').innerHTML.includes('Chọn công cụ để bắt đầu'),'Default action placeholder matches the standalone workspace');
assert(get('devicePortInfo').innerHTML.includes('Rx / Tx (dBm)'));
const revealAnimations=[];
let cancelledReveal=0;
get('devicePortResult').animate=(frames,options)=>{revealAnimations.push({frames,options});};
get('devicePortResult').getAnimations=()=>[{cancel(){cancelledReveal++;}}];
context.window.matchMedia=()=>({matches:false});
runPortTool('transceiver');
assert.equal(revealAnimations.length,1,'Changing a port tool reveals only its result panel');
assert.equal(revealAnimations[0].options.duration,150);
assert.equal(cancelledReveal,1,'Rapid changes cancel stale result reveals');
runPortTool('transceiver');assert.equal(revealAnimations.length,1,'Choosing the same tool does not replay animation');
context.window.matchMedia=()=>({matches:true});
runPortTool('crc');assert.equal(revealAnimations.length,1,'Reduced-motion preference skips result animation');
context.window.matchMedia=()=>({matches:false});
runPortTool('transceiver');assert.equal(revealAnimations.length,2);
assert(get('devicePortResult').innerHTML.includes('Rx (dBm)'));
assert(get('devicePortResult').innerHTML.includes(String(realGcom.ports.find(port=>port.name==='G0/1').module.TX)));
const ponResult=get('devicePortResult').innerHTML;
runPortTool('lacp');assert.equal(get('devicePortResult').innerHTML,ponResult,'PON LACP cannot be activated through a forged click');
runPortTool('crc');assert(get('devicePortResult').innerHTML.includes('chưa có bộ đếm CRC'));
runPortTool('customers');assert(get('devicePortResult').innerHTML.includes('chưa có danh sách khách hàng'));
selectPort('E2/1',true);
assert(get('devicePortMenu').innerHTML.includes('Đổi Port Speed'));
assert(!get('devicePortMenu').innerHTML.includes('Khách hàng thuộc PON'));
assert(!/data-port-action="lacp" disabled/.test(get('devicePortMenu').innerHTML));
runPortTool('speed');assert.equal(get('devicePortSpeedForm').hidden,false);
get('devicePortSpeed').value='10 Gbps';get('devicePortSpeedForm').listeners.submit({preventDefault(){}});
assert(get('devicePortResult').innerHTML.includes('Xem trước'));
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
devicePage.open(popForMetadata,noStatus);selectPort('G0/1');runPortTool('transceiver');
assert(get('devicePortResult').innerHTML.includes('<b>0</b>'),'Zero optical readings are not replaced with dashes');
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
get('devicePortActionSelect').value='transceiver';get('devicePortActionSelect').listeners.change();
assert(get('devicePortResult').innerHTML.includes('Rx (dBm)'));
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
const groupedSwitch={...stackDevice,name:'TEST-PORT-GROUPS',type:'SWITCH',model:'HW57',vendor:'HUAWEI',ports:[
  ...Array.from({length:24},(_,i)=>({name:`XGigabitEthernet0/0/${i+1}`,module:null})),
  ...Array.from({length:2},(_,i)=>({name:`40GE0/0/${i+1}`,module:null}))
]};
devicePage.open(stackPop,groupedSwitch);
const bankMarkup=get('devicePortBanks').innerHTML;
assert.equal((bankMarkup.match(/class="l2-list-banks"/g)||[]).length,1,'Service and uplink banks share a single wrapping row');
assert(bankMarkup.indexOf('data-bank="NNI:XGigabitEthernet0/0"')<bankMarkup.indexOf('data-bank="NNI:40GE0/0"'),'10G precedes 40G, matching the faceplate');
assert(bankMarkup.includes('--bank-columns:8;--bank-compact-columns:4'));
assert(bankMarkup.includes('--bank-columns:2;--bank-compact-columns:2'),'Two uplink ports use two columns, not a full-width eight-column bank');
assert.equal((bankMarkup.match(/data-select-port=/g)||[]).length,26);
assert(bankMarkup.includes('data-list-row="mixed"'),'A small two-port uplink bank can still share a fixed switch row');
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
assert.equal((modularMarkup.match(/class="l2-list-banks is-balanced"/g)||[]).length,2,'Four zones form two equal-width rows, not an uplink inserted beside a PON bank');
assert.equal((modularMarkup.match(/class="l2-port-bank"/g)||[]).length,4);
assert(portCss.includes('grid-template-columns:repeat(2,minmax(0,1fr));max-width:none}'),'Balanced cards use the full available panel width');
assert(portCss.includes('.l2-list-banks.is-balanced .l2-port-bank{--list-columns:var(--bank-columns);max-width:none}'),'Each 16-port PON card keeps eight ports per row, not four');
assert(modularMarkup.includes('--bank-columns:8;--bank-compact-columns:4'));
assert(portCss.includes('grid-template-columns:repeat(var(--list-columns),minmax(0,var(--balanced-port-width)))'),'Uplink tiles use the same compact width as PON tiles');
assert(/@container port-list \(max-width:1300px\).*grid-template-columns:1fr/.test(portCss),'Cards stack based on actual content width before squeezing labels');
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
assert(get('devicePortBanks').innerHTML.includes('class="l2-list-banks is-wide"'),'A dense fixed-switch bank uses the full row, not a capped narrow card');
assert(get('devicePortBanks').innerHTML.includes('--bank-columns:16;--bank-compact-columns:4'),'48 service ports use sixteen columns when there is room');
assert(portCss.includes('.l2-list-banks.is-wide .l2-port-bank{--list-columns:var(--bank-columns);flex-basis:100%;max-width:none}'));
assert(/@container port-list \(max-width:1330px\).*\.l2-list-banks.is-wide.*--list-columns:8/.test(portCss));
assert(/@container port-list \(max-width:800px\).*\.l2-list-banks.is-wide.*--list-columns:4/.test(portCss));
assert(/@container port-list \(max-width:650px\).*\.l2-list-banks.is-wide.*--list-columns:2/.test(portCss));
assert.equal((get('devicePortBanks').innerHTML.match(/data-select-port=/g)||[]).length,50);
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
