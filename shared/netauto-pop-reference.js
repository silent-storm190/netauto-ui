// Explicit screenshot references. These are never assigned to another POP.
(() => {
  const get = id => document.getElementById(id);
  const escape = value => String(value == null || value === '' ? '—' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const format = value => new Intl.NumberFormat('vi-VN').format(value);
  const cable = 'Cáp quang treo 08 sợi (FE 9/125 SM 08C)';
  const optical = 'Module quang GPON SFP_TX2.5G/RX1.25G_Transcom (Class C+)';
  // Only the ten visible rows are transcribed; the other 81 rows are unknown.
  const assetRows = [
    ['20000204',cable,'1776770',105,105,0],
    ['20000204',cable,'1776775',226,226,0],
    ['20000204',cable,'1849822',120,120,0],
    ['20020883',optical,'1676381',15,15,0],
    ['20034069','Cáp quang treo 08 sợi Midspan 02 Fo/ống lỏng (FE 9/125 SM 08C)',null,5040,5040,0],
    ['20034070','Cáp quang treo 12 sợi Midspan 02 Fo/ống lỏng (FE 9/125 SM 12C)',null,3668,3668,0],
    ['20000204',cable,'2058395',1,1,0],
    ['20020883',optical,'1991134',1,1,0],
    ['20020883',optical,'1991135',1,1,0],
    ['20027038','Optical Transceiver_SFP 1GE-T_Huawei compatible_Transcom (TS-SFP-T12-02-1-HW)',null,1,1,0],
  ].map(([code,name,asset,stock,available,held]) => ({code,name,asset,stock,available,held,status:'Hàng đang sử dụng'}));
  const topoNodes = [
    {id:'agg1',name:'HCM-AggPOP-04-01',ip:'172.27.94.120',kind:'POP',tone:'blue',x:165,y:24,ports:['ae12']},
    {id:'agg2',name:'HCM-AggPOP-04-02',ip:'172.27.94.121',kind:'POP',tone:'blue',x:575,y:24,ports:['ae12']},
    {id:'di',name:'DI504000HCMM00402HS64',ip:'10.178.0.4',kind:'DI',tone:'orange',x:370,y:184,ports:['Eth31','Eth32','Eth7']},
    {id:'ce',name:'CE504004HCMP58801HW63',ip:'11.54.62.71',kind:'CE',tone:'purple',x:370,y:324,ports:['Eth32','Eth2']},
    {id:'olt',name:'HCMP58802ZA62',ip:'11.54.122.72',kind:'ACN',tone:'green',x:370,y:464,ports:['smartgroup0']},
  ];
  let pop = null;
  let devices = [];
  let assetPage = 0;
  let visibleAssets = [];
  let topoScale = 1;

  function setMaterialView(view) {
    const assets = view === 'assets';
    get('popAssetView').hidden = !assets;
    get('popInventoryView').hidden = assets;
    get('popAssetViewButton').setAttribute('aria-pressed',String(assets));
    get('popInventoryViewButton').setAttribute('aria-pressed',String(!assets));
  }

  function renderAssets() {
    const reference = get('popAssetSource').value === 'reference';
    const query = get('popAssetSearch').value.trim().toLowerCase();
    visibleAssets = reference ? assetRows.filter(row => [row.code,row.name,row.asset,row.status].join(' ').toLowerCase().includes(query)) : [];
    const size = Number(get('popAssetPageSize').value) || 10;
    assetPage = Math.min(assetPage,Math.max(0,Math.ceil(visibleAssets.length/size)-1));
    const start = assetPage*size;
    const rows = visibleAssets.slice(start,start+size);
    get('popAssetSourceBadge').textContent = reference ? 'Ảnh production · AGGP015' : 'POP đang mở';
    get('popAssetContextTitle').textContent = reference ? 'Tài sản POP AGGP015' : `Tài sản POP ${pop.code}`;
    get('popAssetContextNote').textContent = reference ? `Mẫu trích từ ảnh bạn gửi, không phải tài sản của POP ${pop.code}. Chưa có 81 dòng còn lại.` : 'Snapshot thiết bị chưa có dữ liệu mã tài sản và tồn kho của POP này.';
    get('popAssetRowCount').textContent = `${visibleAssets.length} bản ghi${reference ? ' trong mẫu' : ''}`;
    get('popAssetRows').innerHTML = rows.map(row => `<tr><td><strong class="l1-asset-name">${escape(row.name)}</strong><span class="l1-asset-code">Mã VT <code>${escape(row.code)}</code></span></td><td><code class="l1-asset-id">${escape(row.asset)}</code></td><td class="l1-qty"><b>${format(row.stock)}</b></td><td class="l1-qty"><b class="l1-green">${format(row.available)}</b></td><td class="l1-qty"><span class="l1-held-zero">${format(row.held)}</span></td><td><span class="l1-asset-status"><i aria-hidden="true"></i>${escape(row.status)}</span></td></tr>`).join('') || `<tr><td colspan="6"><div class="l1-empty-state">${reference ? 'Không có tài sản khớp từ khóa.' : 'Chưa có dữ liệu tài sản của POP này. Chọn “Mẫu tài sản AGGP015” để xem Interface với dữ liệu từ ảnh production.'}</div></td></tr>`;
    get('popAssetFooterNote').textContent = reference ? '10 / 91 dòng đã được trích từ ảnh production. Không cộng số lượng giữa các vật tư chưa rõ đơn vị.' : 'Không dùng serial inventory thay cho mã tài sản.';
    get('popAssetPageCount').textContent = visibleAssets.length ? `${start+1}–${start+rows.length} / ${visibleAssets.length}` : '0 / 0';
    get('popAssetPrev').disabled = assetPage === 0;
    get('popAssetNext').disabled = start+size >= visibleAssets.length;
    get('popAssetExport').disabled = !visibleAssets.length;
  }

  function open(currentPop,currentDevices) {
    pop = currentPop;
    devices = currentDevices;
    assetPage = 0;
    get('popAssetSource').value = 'reference';
    get('popAssetSearch').value = '';
    get('popAssetPageSize').value = '10';
    setMaterialView('assets');
    renderAssets();
  }

  function exportAssets() {
    if (!visibleAssets.length) return;
    const quote = value => `"${String(value ?? '').replace(/"/g,'""')}"`;
    const lines = [['Mã vật tư','Tên vật tư','Mã tài sản','Tồn','Khả dụng','Treo','Tình trạng'],...visibleAssets.map(row=>[row.code,row.name,row.asset,row.stock,row.available,row.held,row.status])];
    const url = URL.createObjectURL(new Blob(['\uFEFF'+lines.map(line=>line.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url; link.download = 'tai-san-AGGP015-trich-anh.csv'; link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function renderTopo() {
    const panel = get('detailTopoPanel');
    panel.innerHTML = `<div class="l1-topo-toolbar"><div class="l1-segment" role="group" aria-label="Nguồn topo"><button type="button" data-topo-mode="reference" aria-pressed="true">Mẫu HCMP588</button><button type="button" data-topo-mode="current" aria-pressed="false">POP đang mở</button></div><div class="l1-topo-controls"><label><input type="checkbox" id="topoPorts" checked> Port</label><label><input type="checkbox" id="topoTraffic" checked> Traffic (GB)</label><div class="l1-zoom-controls"><button type="button" class="na-button" data-topo-zoom="out" aria-label="Thu nhỏ topo">−</button><span id="topoScaleLabel">100%</span><button type="button" class="na-button" data-topo-zoom="in" aria-label="Phóng to topo">＋</button><button type="button" class="na-button" data-topo-zoom="fit">Vừa khung</button></div></div></div><div id="topoContent"></div>`;
    // Elements exist after innerHTML in the browser. Tests use the real IDs below.
    topoScale = 1;
    showTopoMode('reference');
  }

  function showTopoMode(mode) {
    get('detailTopoPanel').querySelectorAll('[data-topo-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.topoMode===mode)));
    get('detailTopoPanel').setAttribute('data-topo-mode',mode);
    get('detailTopoPanel').querySelectorAll('.l1-topo-controls').forEach(controls=>controls.hidden = mode!=='reference');
    if (mode === 'current') {
      get('topoContent').innerHTML = `<div class="l1-topo-notice"><b>POP ${escape(pop.code)}</b><span>Chưa có dữ liệu liên kết LLDP. Không tự tạo đường nối giữa thiết bị.</span></div><div class="l1-topo-layout">${['SWITCH','OLT','POWER','PI'].map(type=>`<section class="l1-topo-cluster"><h3>${escape(({SWITCH:'Switch',OLT:'OLT',POWER:'Nguồn',PI:'PI'})[type])}</h3><div>${devices.filter(d=>d.type===type).map(d=>`<span class="l1-topo-node"><span><b>${escape(d.name)}</b><small>${escape(d.ip)}</small></span></span>`).join('') || '<span class="l1-muted">Chưa có bản ghi.</span>'}</div></section>`).join('')}</div>`;
      return;
    }
    get('topoContent').innerHTML = `<div class="l1-topo-reference"><span class="l1-demo-badge">Ảnh production · HCMP588</span><span>Liên kết & traffic từ ảnh, không phải topo của POP ${escape(pop.code)}.</span><div class="l1-topo-legend"><span><i class="is-green"></i>Normal</span><span><i class="is-red"></i>Critical</span></div></div><div class="l1-topo-viewport" id="topoViewport" tabindex="0" role="region" aria-label="Sơ đồ topo tham chiếu, cuộn để xem toàn bộ"><div class="l1-topo-scaled" id="topoScaled"><div class="l1-topo-canvas" id="topoCanvas"><svg class="l1-topo-edges" viewBox="0 0 1000 560" aria-hidden="true"><path class="l1-edge is-red" d="M295 106V139Q295 149 305 149H430Q440 149 440 159V184"/><path class="l1-edge is-red" d="M705 106V139Q705 149 695 149H570Q560 149 560 159V184"/><path class="l1-edge is-green" d="M500 266V324"/><path class="l1-edge is-green" d="M500 406V464"/></svg>${topoNodes.map(node=>`<button type="button" class="l1-topo-device is-${node.tone}" style="left:${node.x}px;top:${node.y}px" data-topo-node="${node.id}"><span class="l1-topo-node-head"><span class="l1-topo-kind">${node.kind}</span><span aria-hidden="true">▤</span></span><strong>${escape(node.name)}</strong><small>${escape(node.ip)}</small></button>`).join('')}<span class="l1-topo-port" style="left:295px;top:112px">ae12</span><span class="l1-topo-port" style="left:705px;top:112px">ae12</span><span class="l1-topo-port" style="left:440px;top:172px">Eth31</span><span class="l1-topo-port" style="left:560px;top:172px">Eth32</span><span class="l1-topo-port" style="left:500px;top:272px">Eth7</span><span class="l1-topo-port" style="left:500px;top:312px">Eth32</span><span class="l1-topo-port" style="left:500px;top:412px">Eth2</span><span class="l1-topo-port" style="left:500px;top:452px">smartgroup0</span><span class="l1-topo-traffic" style="left:610px;top:295px">7.63 <small>GB</small></span><span class="l1-topo-traffic" style="left:610px;top:435px">6.34 <small>GB</small></span></div></div></div><div id="topoSelection" class="l1-topo-selection" hidden aria-live="polite"></div><footer class="l1-section-foot">Chọn thiết bị để xem tên, IP và port kết nối. Dữ liệu tham chiếu chỉ đọc; không điều khiển thiết bị.</footer>`;
    get('topoPorts').checked = true;
    get('topoTraffic').checked = true;
    topoScale = 1;
    updateZoom(); updateTopoLabels();
  }

  function updateTopoLabels() {
    get('topoCanvas').classList.toggle('is-ports-hidden',!get('topoPorts').checked);
    get('topoCanvas').classList.toggle('is-traffic-hidden',!get('topoTraffic').checked);
  }

  function updateZoom() {
    get('topoCanvas').style.transform = `scale(${topoScale})`;
    get('topoScaled').style.width = `${1000*topoScale}px`;
    get('topoScaled').style.height = `${560*topoScale}px`;
    get('topoScaleLabel').textContent = `${Math.round(topoScale*100)}%`;
  }

  get('popAssetViewButton').addEventListener('click',()=>setMaterialView('assets'));
  get('popInventoryViewButton').addEventListener('click',()=>setMaterialView('inventory'));
  get('popAssetSource').addEventListener('change',()=>{assetPage=0;renderAssets();});
  get('popAssetSearch').addEventListener('input',()=>{assetPage=0;renderAssets();});
  get('popAssetPageSize').addEventListener('change',()=>{assetPage=0;renderAssets();});
  get('popAssetPrev').addEventListener('click',()=>{assetPage=Math.max(0,assetPage-1);renderAssets();});
  get('popAssetNext').addEventListener('click',()=>{assetPage++;renderAssets();});
  get('popAssetExport').addEventListener('click',exportAssets);
  get('detailTopoPanel').addEventListener('change',event=>{if(['topoPorts','topoTraffic'].includes(event.target.id))updateTopoLabels();});
  get('detailTopoPanel').addEventListener('click',event=>{
    if (event.target.closest('[data-topo-close]')) {get('topoSelection').hidden=true;return;}
    const mode = event.target.closest('[data-topo-mode]');
    if (mode) {showTopoMode(mode.dataset.topoMode);return;}
    const zoom = event.target.closest('[data-topo-zoom]');
    if (zoom) {
      if (zoom.dataset.topoZoom === 'fit') topoScale=Math.min(1,Math.max(.45,((get('topoViewport').clientWidth || 1000)-24)/1000));
      else topoScale=Math.min(1.6,Math.max(.45,topoScale+(zoom.dataset.topoZoom==='in'?.15:-.15)));
      updateZoom(); return;
    }
    const button = event.target.closest('[data-topo-node]');
    const node = button && topoNodes.find(item=>item.id===button.dataset.topoNode);
    if (!node) return;
    get('topoSelection').hidden=false;
    get('topoSelection').innerHTML=`<span class="l1-material-tag">${node.kind}</span><b>${escape(node.name)}</b><code>${escape(node.ip)}</code><span>Port ${node.ports.map(escape).join(' · ')}</span><button type="button" class="na-button" data-topo-close aria-label="Đóng thông tin topo">×</button>`;
  });
  get('detailTopoPanel').addEventListener('keydown',event=>{if(event.key==='Escape'&&get('topoSelection'))get('topoSelection').hidden=true;});
  window.NETAUTO_POP_REFERENCES={open,setMaterialView,renderTopo};
})();
