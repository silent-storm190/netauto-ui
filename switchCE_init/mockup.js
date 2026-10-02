(() => {
  "use strict";

  const BASE_DATA = Object.freeze({
    job_id: "6ab5e6449a3b0d61eacfb8a0",
    job_name: "Replace CE701001VLGP00301HW57 with CH52",
    plan_code: "SWCE_INIT.2509260001",
    province: "VLG",
    created_by: "minhbq3@fpt.com",
    created_at: "25/09/2026 17:11",
    allocated_at: "25/09/2026 17:34",
    allocation_duration: "62.9s",
    prechecked_at: "25/09/2026 21:19",
    precheck_duration: "74.77s",
    configured_at: "25/09/2026 22:00",
    configuration_duration: "268.51s",
    switch_device: "DI701000VLGM00102HS64",
    switch_ce_pop: "VLGP003",
    link_count: 2,
    link_speed: 10,
    bootstrap_ip: "11.64.151.7",
    management_vlan: 36,
    pim_vlan: 61,
    pim_ip: "192.168.99.6",
    gateway: {
      name: "DI701000VLGM00102HS64",
      device_ip: "11.64.11.2",
      svi_ip: "11.64.61.1",
      vendor: "HUAWEI",
      model: "HS64",
      source: "live default route"
    },
    uplink: {
      name: "DI701000VLGM00102HS64",
      ip: "11.64.11.2",
      vendor: "HUAWEI",
      model: "HS64",
      aggregation: "Eth-Trunk9",
      ports: ["XGE0/0/12", "XGE1/0/12"],
      pim_ip: "192.168.99.5"
    },
    existing: {
      name: "CE701001VLGP00301HW57",
      ip: "11.64.81.31",
      vendor: "HUAWEI",
      model: "HW57",
      uplink_aggregation: "Eth-Trunk6",
      uplink_ports: ["XGE0/0/7", "XGE1/0/7"],
      aggregation: "Eth-Trunk32",
      ports: ["XGE0/0/3", "XGE0/0/4"],
      pppoe_vlan: 1306,
      mac_count: 1393
    },
    lldp_downlinks: [
      {
        name: "VLGP00303GC16",
        ip: "11.64.121.33",
        vendor: "GCOM",
        model: "GC16",
        old_aggregation: "Eth-Trunk1",
        old_physical_port: null,
        new_aggregation: "Bridge-Aggregation1",
        new_physical_port: "Ten-GE1/0/21",
        remote_port: "Uplink 1"
      },
      {
        name: "VLGP00305GC57",
        ip: "11.64.121.35",
        vendor: "GCOM",
        model: "GC57",
        old_aggregation: "Eth-Trunk2",
        old_physical_port: null,
        new_aggregation: "Bridge-Aggregation2",
        new_physical_port: "Ten-GE1/0/22",
        remote_port: "Uplink 1"
      }
    ]
  });

  const TARGETS = Object.freeze({
    huawei: {
      model: "HW63",
      vendor: "HUAWEI",
      name: "CE701001VLGP00302HW63",
      ip: "11.64.61.21",
      aggregation: "Eth-Trunk32",
      ports: ["XGE0/0/23", "XGE0/0/24"],
      firmware: "Không yêu cầu"
    },
    h3c: {
      model: "CH52",
      vendor: "H3C",
      name: "CE701001VLGP00302CH52",
      ip: "11.64.61.21",
      aggregation: "Bridge-Aggregation32",
      ports: ["Ten-GigabitEthernet1/0/23", "Ten-GigabitEthernet1/0/24"],
      firmware: "R8337 · đã là main startup"
    }
  });

  const STAGES = Object.freeze({
    draft: { index: 0, label: "Đã tạo kế hoạch", tone: "info" },
    allocated: { index: 1, label: "Đã cấp phát", tone: "success" },
    prechecked: { index: 2, label: "Precheck thành công", tone: "success" },
    ready_for_cutover: { index: 4, label: "Chờ chuyển Port", tone: "warning" },
    cutover_ready: { index: 4, label: "Sẵn sàng chuyển Port", tone: "warning" },
    finished: { index: 5, label: "Hoàn thành", tone: "success" },
    rolled_back: { index: 5, label: "Đã rollback", tone: "warning" }
  });

  const state = {
    mode: "replacement",
    vendor: "h3c",
    stage: "ready_for_cutover",
    confirmed: false,
    finishedAt: null,
    createPlanModal: false,
    allocateModal: false
  };

  const tag = (value, tone = "gray") => `<span class="tag ${tone}">${value}</span>`;
  const status = (value, tone = "info") => `<span class="status-pill ${tone}">${value}</span>`;
  const btn = (action, label, css = "", enabled = true) =>
    `<button class="btn ${css}" type="button" data-action="${action}" ${enabled ? "" : "disabled"}>${label}</button>`;

  function target() { return TARGETS[state.vendor]; }
  function isReplacement() { return state.mode === "replacement"; }
  function hasValidFinishedAt() {
    return typeof state.finishedAt === "string" && !Number.isNaN(Date.parse(state.finishedAt));
  }
  function isJobComplete() { return state.stage === "finished" && hasValidFinishedAt(); }
  function stageInfo() { return STAGES[state.stage] || STAGES.draft; }
  function compactPortName(portName) {
    return String(portName)
      .replace("Ten-GigabitEthernet", "Ten-GE")
      .replace("XGigabitEthernet", "XGE");
  }

  function headerMarkup() {
    return `<header class="topbar">
      <div class="brand"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect></svg></span>NetAuto <small>SwitchCE Initialize · MN</small></div>
      <div class="top-actions"><span class="review-label">FE + DevNet handoff</span><span class="environment">MOCKUP ONLY</span><span class="kbd">⌕ &nbsp; Ctrl+K</span><span class="avatar">MB</span></div>
    </header>`;
  }

  function conceptMarkup() {
    const stages = isReplacement()
      ? [["draft", "Tạo kế hoạch"], ["allocated", "Đã cấp phát"], ["prechecked", "Đã precheck"], ["ready_for_cutover", "Chờ chuyển Port"], ["cutover_ready", "Đã kiểm tra chuyển Port"], ["finished", "Hoàn thành"], ["rolled_back", "Đã rollback"]]
      : [["draft", "Tạo kế hoạch"], ["allocated", "Đã cấp phát"], ["prechecked", "Đã precheck"], ["finished", "Hoàn thành"]];
    return `<div class="concept-bar">
      <div class="concept-copy"><span class="section-icon">◇</span><div><strong>Bản mô phỏng tương tác</strong><small>Mode, thiết bị và model chỉ được chọn trong form Cấp phát — không gọi API hoặc thiết bị thật.</small></div></div>
      <div class="toolbar-actions">
        ${btn("new-plan", "+ Tạo kế hoạch mới")}
        <select class="btn" data-stage aria-label="Trạng thái mô phỏng">${stages.map(([value, label]) => `<option value="${value}" ${state.stage === value ? "selected" : ""}>${label}</option>`).join("")}</select>
      </div>
    </div>`;
  }

  function optionCard(mode, title, description, note, tone) {
    return `<button class="option-card ${state.mode === mode ? "active" : ""}" type="button" data-mode="${mode}"><span class="radio-mark"></span><strong>${title}</strong><small>${description}</small>${tag(note, tone)}</button>`;
  }

  function formMarkup() {
    const t = target();
    const modeSelection = `<div class="selected-mode"><span class="selected-mode-icon">✓</span><div><span>MODE ĐÃ LƯU TRONG JOB</span><strong>${isReplacement() ? "Thay thế SwitchCE hiện hữu" : "Init mới hoàn toàn"}</strong><small>${isReplacement() ? `Giữ PPPoE VLAN từ ${BASE_DATA.existing.name}; các tài nguyên khác cấp mới.` : "Toàn bộ PPPoE VLAN, PIM, IP, vị trí và tên được cấp mới."}</small></div>${tag(isReplacement() ? "REPLACEMENT" : "NEW", isReplacement() ? "amber" : "green")}</div>`;
    const allocationDetails = `<div class="subsection-title">Mục đích sử dụng</div>
      ${modeSelection}
      <div class="allocation-device-card uplink-device-card">
          <div class="allocation-device-head"><div><strong>${BASE_DATA.uplink.name}</strong><small>${BASE_DATA.uplink.ip} · ${BASE_DATA.uplink.vendor} Switch · ${BASE_DATA.uplink.model}</small></div>${tag("SWITCH UPLINK", "blue")}</div>
          <div class="allocation-device-metrics">
            <div><span>AGGREGATE PORT</span><b>${BASE_DATA.uplink.aggregation}</b></div>
            <div><span>SỐ LINK</span><b>${BASE_DATA.link_count} links</b></div>
            <div><span>TỐC ĐỘ</span><b>${BASE_DATA.link_speed} Gbps / link</b></div>
          </div>
          <div class="allocated-port-row"><span>PHYSICAL PORTS</span><div>${BASE_DATA.uplink.ports.map(port => tag(port, "blue")).join("")}</div></div>
      </div>
      <div class="switchce-allocation-grid ${isReplacement() ? "" : "single-device"}">
        ${isReplacement() ? `<div class="allocation-device-card existing-device-card"><div class="allocation-device-head"><div><strong>${BASE_DATA.existing.name}</strong><small>${BASE_DATA.existing.ip} · ${BASE_DATA.existing.vendor} · ${BASE_DATA.existing.model}</small></div>${tag("SWITCHCE HIỆN HỮU", "amber")}</div><div class="allocation-device-metrics"><div><span>POP</span><b>${BASE_DATA.switch_ce_pop} · Vị trí 01</b></div><div><span>VLAN PPPOE GIỮ LẠI</span><b>${BASE_DATA.existing.pppoe_vlan}</b></div><div><span>MAC LIVE</span><b>${BASE_DATA.existing.mac_count}</b></div></div></div>` : ""}
        <div class="allocation-device-card target-device-card"><div class="allocation-device-head"><div><strong>${t.name}</strong><small>${t.ip} · ${t.vendor} Switch · ${t.model}</small></div>${tag("SWITCHCE MỚI", "green")}</div><div class="allocation-device-metrics"><div><span>POP</span><b>${BASE_DATA.switch_ce_pop} · Vị trí 02</b></div><div><span>AGGREGATE PORT</span><b>${t.aggregation}</b></div><div><span>GATEWAY</span><b>${BASE_DATA.gateway.svi_ip}</b></div><div><span>VLAN MANAGEMENT</span><b>${BASE_DATA.management_vlan}</b></div><div><span>VLAN PIM</span><b>${BASE_DATA.pim_vlan}</b></div><div><span>VLAN PPPOE</span><b>${isReplacement() ? BASE_DATA.existing.pppoe_vlan : 1205}</b></div></div><div class="allocated-port-row"><span>PHYSICAL PORTS</span><div>${t.ports.map(port => tag(compactPortName(port), "green")).join("")}</div></div></div>
      </div>
      <div class="connection-information"><div class="connection-information-head"><strong>Thông tin kết nối</strong>${tag("SSH TỪ SERVER", "gray")}</div><div class="connection-information-grid"><div><span>IP Tạm (DHCP)</span><b>${BASE_DATA.bootstrap_ip}</b></div><div><span>IP quản trị SwitchCE</span><b>${t.ip}</b></div><div><span>PIM SwitchCE / Uplink</span><b>${BASE_DATA.pim_ip} / ${BASE_DATA.uplink.pim_ip}</b></div><div><span>Nguồn gateway</span><b>Default route live</b></div><div><span>Mode</span><b>${isReplacement() ? "Replacement" : "Init mới"}</b></div><div><span>Vùng</span><b>MN · ${BASE_DATA.province}</b></div></div></div>`;
    const allocationHeader = `<div class="card-header"><div class="section-title"><span class="section-icon amber-icon">▦</span>Thông tin cấp phát</div><div class="status-line">${tag("CHỈ ĐỌC", "gray")}${status("ĐÃ CẤP PHÁT", "success")}</div></div>`;
    const topologyHeader = `<div class="embedded-topology-header"><div class="section-title"><span class="section-icon">⌘</span>Sơ đồ kết nối được cấp phát</div><div class="topology-tools"><button type="button" aria-label="Phóng to">＋</button><button type="button" aria-label="Thu nhỏ">−</button><button type="button" aria-label="Căn vừa">⌗</button></div></div>`;
    if (!isReplacement()) {
      return `<section class="card allocation-detail-card new-mode-allocation-card">${allocationHeader}<div class="new-allocation-layout"><div class="new-allocation-information">${allocationDetails}</div><div class="new-allocation-topology">${topologyHeader}<div class="topology-body">${networkMarkup()}</div></div></div></section>`;
    }
    return `<section class="card allocation-detail-card">${allocationHeader}<div class="card-body olt-style-body">${allocationDetails}
      </div>
    </section>
    <section class="card topology-section">${topologyHeader}<div class="topology-body">${networkMarkup()}</div></section>`;
  }

  function planOverviewMarkup() {
    return `<section class="card plan-overview">
      <div class="plan-overview-icon">▤</div>
      <div class="plan-overview-copy"><span>TÊN KẾ HOẠCH</span><strong>${BASE_DATA.job_name}</strong></div>
      <div class="plan-overview-copy"><span>MÃ KẾ HOẠCH</span><strong>${BASE_DATA.plan_code}</strong></div>
      <div class="plan-overview-copy"><span>LOẠI KẾ HOẠCH</span><strong>SwitchCE Initialize · MN</strong></div>
      ${status(stageInfo().label, stageInfo().tone)}
    </section>`;
  }

  function allocationEmptyMarkup() {
    return `<section class="card allocation-empty-card">
      <div class="card-header"><div class="section-title"><span class="section-icon amber-icon">▦</span>Thông tin cấp phát</div>${status("CHỜ CẤP PHÁT", "warning")}</div>
      <div class="allocation-empty-state"><span class="empty-state-icon">▰</span><strong>Kế hoạch đã được tạo. Chưa có dữ liệu cấp phát.</strong><small>Nhấn nút <b>Cấp phát</b> trong Bảng Điều khiển Vận hành để nhập thông tin SwitchCE.</small></div>
    </section>`;
  }

  function createPlanModalMarkup() {
    if (!state.createPlanModal) return "";
    return `<div class="modal-scrim open"><section class="modal-panel plan-modal" role="dialog" aria-modal="true" aria-labelledby="create-plan-title">
      <div class="modal-head"><div class="modal-title"><span class="modal-title-icon">+</span><div><h2 id="create-plan-title">Tạo Kế hoạch mới</h2></div></div></div>
      <div class="modal-body">
        <div class="modal-select-shell"><span>Loại Kế hoạch <b>*</b></span><strong>▤ &nbsp; Cấu Hình Ban Đầu cho Switch CE (SwitchCE Initialize)</strong><i>⌄</i></div>
        <p class="field-caption">Tự động cấp phát và cấu hình SwitchCE Huawei/H3C từ switch đấu nối.</p>
        <div class="modal-divider"></div>
        <div class="modal-section-label">Thông tin cấu hình:</div>
        <label class="modal-field"><span>Tên Kế hoạch <b>*</b></span><input value="${BASE_DATA.job_name}" aria-label="Tên kế hoạch"></label>
      </div>
      <div class="modal-foot"><button class="modal-cancel" type="button" data-action="cancel-create-plan">Hủy Bỏ</button>${btn("create-plan", "Tạo Kế Hoạch", "btn-primary")}</div>
    </section></div>`;
  }

  function allocationModalMarkup() {
    if (!state.allocateModal) return "";
    const t = target();
    return `<div class="modal-scrim open"><section class="modal-panel allocation-modal" role="dialog" aria-modal="true" aria-labelledby="allocate-title">
      <div class="modal-head"><div class="modal-title"><span class="modal-title-icon cyan">▦</span><div><h2 id="allocate-title">Cấp phát thông tin SwitchCE</h2><p>Chọn mục đích sử dụng, thiết bị đấu nối và thông số SwitchCE mới.</p></div></div></div>
      <div class="modal-body allocation-modal-body">
        <div class="allocation-plan-meta"><div><span>TÊN KẾ HOẠCH</span><strong>${BASE_DATA.job_name}</strong></div><div><span>MÃ KẾ HOẠCH</span><strong>${BASE_DATA.plan_code}</strong></div></div>
        <div class="modal-section-label">MỤC ĐÍCH KHỞI TẠO</div>
        <div class="option-grid modal-options">
          ${optionCard("new", "Init mới hoàn toàn", "POP mới hoặc bổ sung SwitchCE tại POP hiện hữu; cấp mới toàn bộ tài nguyên.", "PPPoE VLAN mới", "green")}
          ${optionCard("replacement", "Thay thế SwitchCE", "Giữ PPPoE VLAN của switch cũ; các tài nguyên khác được cấp mới.", "Có bước chuyển Port", "amber")}
        </div>
        <div class="modal-section-label">THÔNG TIN CẤP PHÁT</div>
        <div class="modal-field-grid">
          <label class="modal-field wide"><span>Switch đấu nối vật lý <b>*</b></span><input value="${BASE_DATA.switch_device}" aria-label="Switch đấu nối vật lý"><small>Nhập switch name hoặc IP; backend tự detect.</small></label>
          <label class="modal-field"><span>POP SwitchCE <b>*</b></span><input value="${BASE_DATA.switch_ce_pop}" aria-label="POP SwitchCE"><small>POP thuộc danh sách tỉnh MN.</small></label>
          <label class="modal-field"><span>Model SwitchCE <b>*</b></span><select data-vendor-select aria-label="Model SwitchCE"><option value="huawei" ${state.vendor === "huawei" ? "selected" : ""}>HW63 (Huawei)</option><option value="h3c" ${state.vendor === "h3c" ? "selected" : ""}>CH52 (H3C)</option></select><small>Template và firmware được chọn theo model.</small></label>
          <label class="modal-field"><span>Loại link (Gbps) <b>*</b></span><select aria-label="Tốc độ link"><option>10 Gbps</option></select><small>Tốc độ của mỗi kết nối uplink.</small></label>
          <label class="modal-field"><span>Số lượng link <b>*</b></span><input value="${BASE_DATA.link_count}" aria-label="Số lượng link"><small>Số link vật lý cần cấp phát.</small></label>
          ${isReplacement() ? `<label class="modal-field wide"><span>SwitchCE hiện hữu cần thay <b>*</b></span><input value="${BASE_DATA.existing.name}" aria-label="SwitchCE hiện hữu"><small>Có thể nhập switch name hoặc IP; PPPoE VLAN được đọc live từ thiết bị này.</small></label>` : ""}
        </div>
      </div>
      <div class="modal-foot"><button class="modal-cancel" type="button" data-action="cancel-allocate">Hủy</button>${btn("confirm-allocate", "▦  Xác nhận cấp phát", "btn-primary")}</div>
    </section></div>`;
  }

  function newInitializationTopologyMarkup(t) {
    const linkPositions = [310, 490];
    const uplinkPorts = BASE_DATA.uplink.ports.map((port, index) => {
      const x = linkPositions[index];
      return `<rect x="${x - 68}" y="178" width="136" height="28" rx="6" fill="#fff" stroke="#73a7ff"/><text x="${x}" y="196" text-anchor="middle" font-size="10" font-weight="800" fill="#174ea6">${port}</text>`;
    }).join("");
    const switchCePorts = t.ports.map((port, index) => {
      const x = linkPositions[index];
      return `<rect x="${x - 76}" y="316" width="152" height="28" rx="6" fill="#fff" stroke="#f1a61d"/><text x="${x}" y="334" text-anchor="middle" font-size="10" font-weight="800" fill="#9a5c00">${compactPortName(port)}</text>`;
    }).join("");
    const physicalLinks = linkPositions.map(x => `<line x1="${x}" y1="206" x2="${x}" y2="316" stroke="#12a866" stroke-width="3" stroke-dasharray="7 5"/><rect x="${x - 25}" y="246" width="50" height="23" rx="11" fill="#fff" stroke="#12a866"/><text x="${x}" y="262" text-anchor="middle" font-size="9" font-weight="800" fill="#087a44">${BASE_DATA.link_speed}G</text>`).join("");
    return `<div class="topology-legend"><span><i class="legend-line uplink"></i>Uplink / aggregation</span><span><i class="legend-line active"></i>${BASE_DATA.link_count} link vật lý ${BASE_DATA.link_speed}G</span></div>
      <div class="topology-canvas new-init-canvas"><svg class="topology-svg" viewBox="0 0 800 650" role="img" aria-labelledby="switchce-new-topology-title switchce-new-topology-desc">
        <title id="switchce-new-topology-title">Sơ đồ kết nối SwitchCE init mới</title>
        <desc id="switchce-new-topology-desc">Sơ đồ một trục dọc giống OLT Init, hiển thị switch uplink, aggregation, physical ports, link speed, SwitchCE mới và IP tạm DHCP được cấp trực tiếp trên đường uplink.</desc>
        <defs><filter id="switchceNewNodeShadow"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#274568" flood-opacity=".12"/></filter></defs>
        <g filter="url(#switchceNewNodeShadow)"><rect x="170" y="24" width="460" height="72" rx="12" fill="#eef5ff" stroke="#2563eb" stroke-width="2"/><text x="400" y="53" text-anchor="middle" font-size="16" font-weight="800" fill="#174ea6">${BASE_DATA.uplink.name}</text><text x="400" y="76" text-anchor="middle" font-size="11" fill="#58708f">${BASE_DATA.uplink.ip} · ${BASE_DATA.uplink.vendor} ${BASE_DATA.uplink.model} · SWITCH UPLINK</text></g>
        <rect x="220" y="122" width="360" height="36" rx="18" fill="#f4f8ff" stroke="#2563eb" stroke-width="2"/><text x="400" y="145" text-anchor="middle" font-size="13" font-weight="800" fill="#174ea6">${BASE_DATA.uplink.aggregation}</text>
        ${uplinkPorts}${physicalLinks}${switchCePorts}
        <rect x="338" y="232" width="124" height="52" rx="10" fill="#fff" stroke="#12a866" stroke-width="1.5"/><text x="400" y="250" text-anchor="middle" font-size="9" font-weight="800" fill="#087a44">IP TẠM (DHCP)</text><text x="400" y="266" text-anchor="middle" font-size="10" font-weight="800" fill="#31445c">${BASE_DATA.bootstrap_ip}</text><text x="400" y="278" text-anchor="middle" font-size="8" fill="#527664">TRÊN UPLINK</text>
        <rect x="220" y="370" width="360" height="36" rx="18" fill="#fff8ed" stroke="#f1a61d" stroke-width="2"/><text x="400" y="393" text-anchor="middle" font-size="13" font-weight="800" fill="#9a5c00">${t.aggregation}</text>
        <g filter="url(#switchceNewNodeShadow)"><rect x="170" y="438" width="460" height="112" rx="12" fill="#fff8ed" stroke="#f1a61d" stroke-width="2"/><rect x="518" y="453" width="92" height="22" rx="11" fill="#fff0c7" stroke="#f1a61d"/><text x="564" y="468" text-anchor="middle" font-size="9" font-weight="800" fill="#9a5c00">SWITCHCE MỚI</text><text x="195" y="470" font-size="16" font-weight="800" fill="#8b5500">${t.name}</text><text x="195" y="494" font-size="11" fill="#806d4e">${t.ip} · ${t.vendor} ${t.model} · POP ${BASE_DATA.switch_ce_pop}</text><text x="195" y="522" font-size="10" font-weight="800" fill="#8b5500">MGMT ${BASE_DATA.management_vlan} · PIM ${BASE_DATA.pim_vlan} · PPPoE ${isReplacement() ? BASE_DATA.existing.pppoe_vlan : 1205}</text><text x="195" y="540" font-size="9" fill="#806d4e">Gateway ${BASE_DATA.gateway.svi_ip}</text></g>
      </svg></div>
      <div class="connection-footnote">${tag("NEW", "green")} ${BASE_DATA.uplink.aggregation} nối ${BASE_DATA.uplink.name} với ${t.aggregation} trên ${t.name}; IP tạm DHCP <strong>${BASE_DATA.bootstrap_ip}</strong> được cấp trực tiếp qua đường uplink.</div>`;
  }

  function networkMarkup() {
    const t = target();
    if (state.stage === "draft") {
      return `<div class="network-map pending"><div class="network-pending"><strong>Chưa có dữ liệu cấp phát</strong><small>Eth-Trunk và physical ports sẽ xuất hiện sau khi endpoint allocate trả kết quả thành công.</small></div></div>`;
    }
    if (!isReplacement()) return newInitializationTopologyMarkup(t);
    const cutoverComplete = isJobComplete();
    const downlinkBaseX = cutoverComplete || !isReplacement() ? 650 : 50;
    const activeSwitchName = cutoverComplete || !isReplacement() ? t.name : BASE_DATA.existing.name;
    const downlinkNodes = BASE_DATA.lldp_downlinks.map((device, index) => {
      const center = downlinkBaseX + (index === 0 ? 150 : 350);
      const nodeX = center - 105;
      const aggregation = cutoverComplete ? device.new_aggregation : device.old_aggregation;
      const physicalPort = cutoverComplete ? device.new_physical_port : device.old_physical_port;
      const physicalPortLabel = physicalPort || "CHỜ LIVE SNAPSHOT";
      const physicalStroke = physicalPort ? "#12a866" : "#d79b2e";
      const physicalText = physicalPort ? "#087a44" : "#8a5a00";
      const physicalDash = physicalPort ? "" : ' stroke-dasharray="5 4"';
      return `<rect x="${center - 82}" y="512" width="164" height="28" rx="14" fill="#f4fbf7" stroke="#12a866" stroke-width="1.5"/><text x="${center}" y="530" text-anchor="middle" font-size="9" font-weight="800" fill="#087a44">${aggregation}</text><rect x="${center - 72}" y="556" width="144" height="26" rx="6" fill="#fff" stroke="${physicalStroke}"${physicalDash}/><text x="${center}" y="573" text-anchor="middle" font-size="9" font-weight="800" fill="${physicalText}">${physicalPortLabel}</text><line x1="${center}" y1="582" x2="${center}" y2="640" stroke="#12a866" stroke-width="3"/><rect x="${center - 26}" y="600" width="52" height="22" rx="11" fill="#fff" stroke="#12a866"/><text x="${center}" y="615" text-anchor="middle" font-size="9" font-weight="800" fill="#087a44">10G</text><rect x="${center - 48}" y="640" width="96" height="24" rx="6" fill="#fff" stroke="#8fa6bf"/><text x="${center}" y="656" text-anchor="middle" font-size="9" font-weight="800" fill="#52677f">${device.remote_port}</text><g filter="url(#switchceNodeShadow)"><rect x="${nodeX}" y="686" width="210" height="76" rx="10" fill="#f8fafc" stroke="#8fa6bf" stroke-width="1.5"/><text x="${center}" y="712" text-anchor="middle" font-size="12" font-weight="800" fill="#31445c">${device.name}</text><text x="${center}" y="733" text-anchor="middle" font-size="10" fill="#70839a">${device.ip} · ${device.vendor} ${device.model}</text><text x="${center}" y="751" text-anchor="middle" font-size="9" fill="#70839a">OLT · POP ${BASE_DATA.switch_ce_pop}</text></g>`;
    }).join("");
    const pendingDownlinkX = downlinkBaseX === 50 ? 650 : 50;
    return `<div class="topology-legend"><span><i class="legend-line uplink"></i>Uplink / aggregation</span><span><i class="legend-line active"></i>Link vật lý đang hoạt động</span></div>
      <div class="topology-canvas dual-ce-canvas"><svg class="topology-svg" viewBox="0 0 1200 790" role="img" aria-labelledby="switchce-topology-title switchce-topology-desc">
        <title id="switchce-topology-title">Topology dạng ladder vuông giữa switch uplink, hai SwitchCE và các OLT</title>
        <desc id="switchce-topology-desc">Mỗi nhánh hiển thị riêng Eth-Trunk hoặc Bridge-Aggregation, physical port ở hai đầu và các link vật lý song song.</desc>
        <defs><filter id="switchceNodeShadow"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#274568" flood-opacity=".12"/></filter></defs>
        <g filter="url(#switchceNodeShadow)"><rect x="250" y="18" width="700" height="68" rx="12" fill="#eef5ff" stroke="#2563eb" stroke-width="2"/><text x="600" y="45" text-anchor="middle" font-size="16" font-weight="800" fill="#174ea6">${BASE_DATA.uplink.name}</text><text x="600" y="67" text-anchor="middle" font-size="11" fill="#58708f">${BASE_DATA.uplink.ip} · ${BASE_DATA.uplink.vendor} ${BASE_DATA.uplink.model} · Gateway SVI ${BASE_DATA.gateway.svi_ip}</text></g>
        <rect x="75" y="116" width="450" height="34" rx="17" fill="#f4f8ff" stroke="#2563eb" stroke-width="2"/><text x="300" y="138" text-anchor="middle" font-size="12" font-weight="800" fill="#174ea6">${BASE_DATA.existing.uplink_aggregation}</text>
        <rect x="675" y="116" width="450" height="34" rx="17" fill="#f4f8ff" stroke="#2563eb" stroke-width="2"/><text x="900" y="138" text-anchor="middle" font-size="12" font-weight="800" fill="#174ea6">${BASE_DATA.uplink.aggregation}</text>
        ${BASE_DATA.existing.uplink_ports.map((port, index) => { const x = index === 0 ? 210 : 390; return `<rect x="${x - 62}" y="171" width="124" height="26" rx="6" fill="#fff" stroke="#73a7ff"/><text x="${x}" y="188" text-anchor="middle" font-size="9" font-weight="800" fill="#174ea6">${port}</text><line x1="${x}" y1="197" x2="${x}" y2="252" stroke="#12a866" stroke-width="3"/><rect x="${x - 25}" y="213" width="50" height="22" rx="11" fill="#fff" stroke="#12a866"/><text x="${x}" y="228" text-anchor="middle" font-size="9" font-weight="800" fill="#087a44">10G</text>`; }).join("")}
        ${BASE_DATA.uplink.ports.map((port, index) => { const x = index === 0 ? 810 : 990; return `<rect x="${x - 62}" y="171" width="124" height="26" rx="6" fill="#fff" stroke="#73a7ff"/><text x="${x}" y="188" text-anchor="middle" font-size="9" font-weight="800" fill="#174ea6">${port}</text><line x1="${x}" y1="197" x2="${x}" y2="252" stroke="#12a866" stroke-width="3"/><rect x="${x - 25}" y="213" width="50" height="22" rx="11" fill="#fff" stroke="#12a866"/><text x="${x}" y="228" text-anchor="middle" font-size="9" font-weight="800" fill="#087a44">10G</text>`; }).join("")}
        ${BASE_DATA.existing.ports.map((port, index) => { const x = index === 0 ? 210 : 390; return `<rect x="${x - 62}" y="252" width="124" height="26" rx="6" fill="#fff" stroke="#f1a61d"/><text x="${x}" y="269" text-anchor="middle" font-size="9" font-weight="800" fill="#9a5c00">${port}</text>`; }).join("")}
        ${t.ports.map((port, index) => { const x = index === 0 ? 810 : 990; return `<rect x="${x - 72}" y="252" width="144" height="26" rx="6" fill="#fff" stroke="#12a866"/><text x="${x}" y="269" text-anchor="middle" font-size="9" font-weight="800" fill="#087a44">${compactPortName(port)}</text>`; }).join("")}
        <rect x="75" y="298" width="450" height="34" rx="17" fill="#fff8ed" stroke="#f1a61d" stroke-width="2"/><text x="300" y="320" text-anchor="middle" font-size="12" font-weight="800" fill="#9a5c00">${BASE_DATA.existing.aggregation}</text>
        <rect x="675" y="298" width="450" height="34" rx="17" fill="#f1fbf6" stroke="#12a866" stroke-width="2"/><text x="900" y="320" text-anchor="middle" font-size="12" font-weight="800" fill="#087a44">${t.aggregation}</text>
        <g filter="url(#switchceNodeShadow)"><rect x="50" y="354" width="500" height="136" rx="12" fill="#fff8ed" stroke="#f1a61d" stroke-width="2"/><text x="75" y="380" font-size="9" font-weight="800" fill="#9a5c00">SWITCHCE HIỆN HỮU · ${cutoverComplete ? "STANDBY" : "ACTIVE"}</text><text x="75" y="409" font-size="15" font-weight="800" fill="#8b5500">${BASE_DATA.existing.name}</text><text x="75" y="431" font-size="11" fill="#806d4e">${BASE_DATA.existing.ip} · ${BASE_DATA.existing.vendor} ${BASE_DATA.existing.model}</text><text x="75" y="459" font-size="10" font-weight="800" fill="#8b5500">PPPoE VLAN ${BASE_DATA.existing.pppoe_vlan} · ${BASE_DATA.existing.mac_count} MAC</text><text x="75" y="477" font-size="9" fill="#806d4e">${cutoverComplete ? "Đã hoàn trả vai trò mang lưu lượng" : "Đang mang lưu lượng xuống các OLT"}</text></g>
        <g filter="url(#switchceNodeShadow)"><rect x="650" y="354" width="500" height="136" rx="12" fill="#f1fbf6" stroke="#12a866" stroke-width="2"/><text x="675" y="380" font-size="9" font-weight="800" fill="#087a44">SWITCHCE MỚI · ${cutoverComplete ? "ACTIVE" : "READY FOR CUTOVER"}</text><text x="675" y="409" font-size="15" font-weight="800" fill="#087a44">${t.name}</text><text x="675" y="431" font-size="11" fill="#527664">${t.ip} · ${t.vendor} ${t.model}</text><text x="675" y="459" font-size="10" font-weight="800" fill="#087a44">PPPoE VLAN ${BASE_DATA.existing.pppoe_vlan} · MGMT ${BASE_DATA.management_vlan} · PIM ${BASE_DATA.pim_vlan}</text><text x="675" y="477" font-size="9" fill="#527664">${cutoverComplete ? "Đang mang lưu lượng xuống các OLT" : "Đã cấu hình sẵn, chờ chuyển dây vật lý"}</text></g>
        ${downlinkNodes}
        <rect x="${pendingDownlinkX + 80}" y="520" width="340" height="92" rx="9" fill="#fffdf8" stroke="#d9c28c" stroke-dasharray="6 5"/><text x="${pendingDownlinkX + 250}" y="544" text-anchor="middle" font-size="10" font-weight="800" fill="#856526">${cutoverComplete ? "Nhánh cũ đã ngừng mang downlink" : "Nhánh mới chờ chuyển cáp OLT"}</text><text x="${pendingDownlinkX + 250}" y="566" text-anchor="middle" font-size="9" fill="#8f7a4e">${cutoverComplete ? `${BASE_DATA.lldp_downlinks.map(item => item.old_aggregation).join(" · ")}` : `${BASE_DATA.lldp_downlinks.map(item => item.new_aggregation).join(" · ")}`}</text><text x="${pendingDownlinkX + 250}" y="585" text-anchor="middle" font-size="9" fill="#8f7a4e">${cutoverComplete ? "Không còn mang lưu lượng" : BASE_DATA.lldp_downlinks.map(item => item.new_physical_port).join(" · ")}</text><text x="${pendingDownlinkX + 250}" y="602" text-anchor="middle" font-size="8" fill="#9a8359">Không chạy thêm cấu hình tại thời điểm chuyển dây</text>
      </svg></div>
      <div class="connection-footnote">${tag("LIVE", "green")} <strong>${BASE_DATA.existing.uplink_aggregation}</strong> nối DI với ${BASE_DATA.existing.name}; ${BASE_DATA.lldp_downlinks.map(device => `${device.old_aggregation} nối ${device.name}`).join("; ")}. Member physical port phía SwitchCE cũ sẽ được điền từ live snapshot của cutover precheck.</div>`;
  }

  function progressMarkup() {
    const replacement = isReplacement();
    const current = stageInfo().index;
    const complete = isJobComplete();
    const completedThrough = {
      draft: 0,
      allocated: 1,
      prechecked: 2,
      ready_for_cutover: 3,
      cutover_ready: 3,
      finished: complete ? 5 : 4,
      rolled_back: 3
    }[state.stage];
    const steps = [
      ["Tạo job", BASE_DATA.created_by, BASE_DATA.created_at, ""],
      ["Cấp phát", BASE_DATA.created_by, BASE_DATA.allocated_at, BASE_DATA.allocation_duration],
      ["Kiểm tra vật lý", BASE_DATA.created_by, BASE_DATA.prechecked_at, BASE_DATA.precheck_duration],
      ["Cấu hình", BASE_DATA.created_by, BASE_DATA.configured_at, BASE_DATA.configuration_duration],
      ["Chuyển Port", replacement ? "Chờ đội vật lý xác nhận" : "Không áp dụng", "", ""],
      ["Hoàn tất", complete ? BASE_DATA.created_by : "Chỉ sáng khi job thành công", complete ? new Date(state.finishedAt).toLocaleString("vi-VN") : "finished_at: null", ""]
    ];
    return steps.map(([name, owner, timestamp, duration], index) => {
      const skipped = !replacement && index === 4;
      const done = complete && !replacement ? index !== 4 : index <= completedThrough;
      const isCurrent = !skipped && index === current && index > completedThrough && state.stage !== "finished" && state.stage !== "rolled_back";
      const ready = replacement && ["ready_for_cutover", "cutover_ready"].includes(state.stage) && index === current;
      const classes = ["progress-step", done ? "done" : "", isCurrent ? "current" : "", ready ? "ready" : "", skipped ? "skipped" : ""].filter(Boolean).join(" ");
      const symbol = skipped ? "—" : done ? "✓" : index + 1;
      const detailText = skipped ? "Bỏ qua với init mới" : owner;
      return `<div class="${classes}"><div class="step-dot">${symbol}</div><div class="step-name">${name}</div><div class="step-detail">${detailText ? `♟ ${detailText}` : "Chưa thực hiện"}</div>${timestamp ? `<div class="step-time">▣ ${timestamp}</div>` : ""}${duration ? `<span class="step-duration">◷ ${duration}</span>` : ""}</div>`;
    }).join("");
  }

  function workflowMarkup() {
    const stage = stageInfo();
    const t = target();
    return `<section class="card progress-card">
      <div class="card-header"><div class="section-title"><span class="section-icon">◉</span>Tiến trình thực hiện</div>${status(stage.label, stage.tone)}</div>
      <div class="card-body"><div class="progress-track workflow-track">${progressMarkup()}</div></div>
      <div class="job-summary">
        <div class="summary-cell"><span>Job ID</span><strong>${BASE_DATA.job_id}</strong></div>
        <div class="summary-cell"><span>Mode</span><strong>${isReplacement() ? "Replacement" : "Init mới"}</strong></div>
        <div class="summary-cell"><span>SwitchCE mới</span><strong>${t.name}</strong></div>
        <div class="summary-cell"><span>Vendor / Model</span><strong>${t.vendor} · ${t.model}</strong></div>
        <div class="summary-cell"><span>Gateway SwitchCE</span><strong>${BASE_DATA.gateway.svi_ip}</strong></div>
        <div class="summary-cell"><span>PPPoE VLAN</span><strong>${isReplacement() ? `${BASE_DATA.existing.pppoe_vlan} · reused` : "1205 · new"}</strong></div>
      </div>
    </section>`;
  }

  function actionsMarkup() {
    const replacement = isReplacement();
    let title = "Bắt đầu cấp phát";
    let detail = "Backend sẽ validate quyền chi nhánh trước khi đọc thiết bị.";
    let buttons = btn("allocate", "▦ Cấp phát (Allocate)", "btn-info");
    if (state.stage === "allocated") {
      title = "Dữ liệu đã được cấp phát";
      detail = "Tiếp tục precheck thiết bị và đường uplink.";
      buttons = btn("precheck", "◈ Chạy precheck", "btn-success");
    } else if (state.stage === "prechecked") {
      title = "Đủ điều kiện cấu hình";
      detail = `Renderer sẽ chọn template ${target().vendor} ${target().model}.`;
      buttons = btn("config", "⌁ Cấu hình SwitchCE", "btn-primary");
    } else if (state.stage === "ready_for_cutover") {
      title = "Cấu hình xong — chờ đội vật lý";
      detail = "Chưa đồng bộ Inventory/AutoSync/LLDP cho switch mới.";
      buttons = btn("cutover-precheck", "◇ Kiểm tra trước chuyển Port", "btn-info") + btn("rollback", "↶ Rollback", "btn-danger");
    } else if (state.stage === "cutover_ready") {
      title = "Snapshot hợp lệ — sẵn sàng chuyển Port";
      detail = "Nút chuyển Port chỉ mở sau khi xác nhận cáp đã chuyển vật lý.";
      buttons = btn("cutover", "⇄ Xác nhận chuyển Port", "btn-primary", state.confirmed) + btn("rollback", "↶ Rollback", "btn-danger");
    } else if (state.stage === "finished") {
      title = "Job đã hoàn tất";
      detail = replacement ? "MAC đã sang switch mới; hậu đồng bộ hoàn tất." : "Cấu hình và hậu đồng bộ hoàn tất.";
      buttons = replacement ? btn("rollback", "↶ Rollback", "btn-danger") : "";
    } else if (state.stage === "rolled_back") {
      title = "Đã hoàn trả sang SwitchCE cũ";
      detail = "MAC và dữ liệu đồng bộ đã trở lại thiết bị hiện hữu.";
      buttons = "";
    }
    return `<section class="card control-card"><div class="control-inner action-strip"><div class="action-context"><span class="pulse"></span><div><strong>${title}</strong><small>${detail}</small></div></div><div class="button-row">${buttons}</div></div></section>`;
  }

  function evidenceRow(title, detail, badge, tone = "green") {
    return `<div class="evidence-row"><span class="check-mark">✓</span><div class="evidence-copy"><strong>${title}</strong><small>${detail}</small></div>${tag(badge, tone)}</div>`;
  }

  function resultMarkup() {
    const t = target();
    const precheckDone = !["draft", "allocated"].includes(state.stage);
    const configDone = ["ready_for_cutover", "cutover_ready", "finished", "rolled_back"].includes(state.stage);
    const pppoeVlan = isReplacement() ? BASE_DATA.existing.pppoe_vlan : 1205;
    const pppoeEvidence = isReplacement()
      ? evidenceRow("Xác minh PPPoE VLAN replacement", `VLAN ${pppoeVlan} từ ${BASE_DATA.existing.name} · ${BASE_DATA.existing.mac_count} MAC`, "REUSE", "amber")
      : evidenceRow("Cấp phát PPPoE VLAN mới", `VLAN ${pppoeVlan} được cấp mới cho ${t.name}`, "NEW", "blue");
    const syncDone = isJobComplete();
    return `<div class="olt-result-stack">
      <section class="card olt-result-card precheck-result-card"><div class="card-header"><div class="result-heading"><span class="result-icon">◈</span><strong>Kết quả kiểm tra trước cấu hình</strong></div><div class="status-line">${status(precheckDone ? "THÀNH CÔNG" : "CHƯA CHẠY", precheckDone ? "success" : "warning")}${precheckDone ? tag(BASE_DATA.precheck_duration, "gray") : ""}</div></div><div class="card-body">
        <div class="result-banner ${precheckDone ? "" : "warning"}">${precheckDone ? "✓ Đủ điều kiện cấu hình!" : "• Chờ kiểm tra vật lý và cấp IP tạm DHCP cho SwitchCE"}</div>
        <div class="checked-device-grid"><div><span>SWITCH UPLINK</span><strong>${BASE_DATA.uplink.name}</strong><small>${BASE_DATA.uplink.ip} · ${BASE_DATA.uplink.vendor}</small></div><div><span>SWITCHCE MỚI</span><strong>${t.name}</strong><small>IP tạm ${BASE_DATA.bootstrap_ip} → ${t.ip} · ${t.vendor} ${t.model}</small></div></div>
        <div class="transceiver-panel"><div class="transceiver-title"><strong>⚡ Thông số quang Transceiver (${BASE_DATA.uplink.ports.length} port)</strong><span>⌃</span></div><table><thead><tr><th>Port</th><th>TX (dBm)</th><th>RX (dBm)</th><th>Nhiệt độ (°C)</th><th>Nhà SX / Loại</th></tr></thead><tbody><tr><td>${BASE_DATA.uplink.ports[0]}</td><td>-2.36 [-7.5 0.5]</td><td>-6.73 [-16 0.5]</td><td>35.79</td><td>TRANSCOM · 10GBASE_LR_SFP</td></tr><tr><td>${BASE_DATA.uplink.ports[1]}</td><td>-2.35 [-7.5 0.5]</td><td>-12.39 [-16 0.5]</td><td>36.59</td><td>TRANSCOM · 10GBASE_LR_SFP</td></tr></tbody></table></div>
        <div class="evidence-list olt-check-list">
          ${evidenceRow("Kiểm tra và chuẩn bị uplink switch", `${BASE_DATA.uplink.ports.join(" / ")} · transceiver hiện diện · không có alarm ngưỡng quang`, "PASSED")}
          ${evidenceRow("Xác minh gateway bằng default route", `${BASE_DATA.gateway.name} · SVI ${BASE_DATA.gateway.svi_ip} · đọc trực tiếp từ thiết bị`, "LIVE", "blue")}
          ${pppoeEvidence}
          ${evidenceRow("Đăng nhập SwitchCE qua IP tạm", `SSH ${BASE_DATA.bootstrap_ip} · DHCP cấp qua đường uplink · nhận diện ${t.vendor} ${t.model}`, "PASSED")}
        </div>
      </div></section>
      <section class="card olt-result-card config-result-card"><div class="card-header"><div class="result-heading"><span class="result-icon">⌁</span><strong>Kết quả cấu hình</strong></div><div class="status-line">${status(configDone ? "THÀNH CÔNG" : "CHƯA CHẠY", configDone ? "success" : "warning")}${configDone ? tag(BASE_DATA.configuration_duration, "gray") : ""}</div></div><div class="card-body">
        <div class="result-banner ${configDone ? "" : "warning"}">${configDone ? `✓ Đã nạp cấu hình ${t.vendor} và xác minh SwitchCE mới` : "• Chờ bước cấu hình"}</div>
        <div class="checked-device-grid config-device-grid"><div><span>SWITCH UPLINK</span><strong>${BASE_DATA.uplink.name}</strong><small>${BASE_DATA.uplink.aggregation} · ${BASE_DATA.uplink.ports.join(" / ")}</small></div><div><span>SWITCHCE MỚI</span><strong>${t.name}</strong><small>${t.aggregation} · ${t.ports.map(compactPortName).join(" / ")}</small></div></div>
        <div class="evidence-list olt-check-list">
          ${evidenceRow("Nạp template theo vendor", `${t.vendor} ${t.model} · VLAN MGMT ${BASE_DATA.management_vlan} · PIM ${BASE_DATA.pim_vlan} · PPPoE ${pppoeVlan}`, configDone ? "PASSED" : "PENDING", configDone ? "green" : "amber")}
          ${evidenceRow("Firmware SwitchCE", t.firmware, state.vendor === "h3c" ? "R8337" : "N/A", state.vendor === "h3c" ? "green" : "gray")}
          ${evidenceRow("Aggregation và physical ports", `${BASE_DATA.uplink.aggregation} ↔ ${t.aggregation}; RMON INFMN trên port 21–24`, configDone ? "VERIFIED" : "PENDING", configDone ? "green" : "amber")}
          ${evidenceRow("Backup và lưu cấu hình", "Backup DI trước thay đổi; chỉ save DI sau khi SwitchCE mới verify thành công; không reboot DI", configDone ? "PASSED" : "PENDING", configDone ? "green" : "amber")}
          ${evidenceRow("Hậu đồng bộ", syncDone ? "Inventory · AutoSync · LLDP đã hoàn tất." : isReplacement() ? "Inventory · AutoSync · LLDP chờ hậu kiểm chuyển Port." : "Inventory · AutoSync · LLDP chỉ chạy sau khi cấu hình và xác minh thành công.", syncDone ? "DONE" : isReplacement() ? "DEFERRED" : "PENDING", syncDone ? "green" : "amber")}
        </div>
      </div></section>
    </div>`;
  }

  function cutoverMarkup() {
    if (!isReplacement()) return "";
    const cutoverChecked = ["cutover_ready", "finished", "rolled_back"].includes(state.stage);
    return `<section class="card cutover-card"><div class="card-header"><div class="section-title"><span class="section-icon">⇄</span>Chuyển Port & Rollback</div>${status(stageInfo().label, stageInfo().tone)}</div><div class="card-body"><div class="cutover-grid">
      <div class="snapshot-card"><strong>SwitchCE hiện hữu</strong><small>${BASE_DATA.existing.name} · ${BASE_DATA.existing.ip}</small><div class="snapshot-metrics"><div class="metric"><span>PPPoE VLAN</span><b>${BASE_DATA.existing.pppoe_vlan}</b></div><div class="metric"><span>MAC trước chuyển</span><b>${BASE_DATA.existing.mac_count}</b></div><div class="metric"><span>Vendor</span><b>${BASE_DATA.existing.vendor}</b></div></div></div>
      <div class="snapshot-card"><strong>SwitchCE mới</strong><small>${target().name} · ${target().ip}</small><div class="snapshot-metrics"><div class="metric"><span>PPPoE VLAN</span><b>${BASE_DATA.existing.pppoe_vlan}</b></div><div class="metric"><span>MAC sau chuyển</span><b>${isJobComplete() ? BASE_DATA.existing.mac_count : 0}</b></div><div class="metric"><span>Snapshot</span><b>${cutoverChecked ? "READY" : "PENDING"}</b></div></div></div>
    </div><div class="safety-box"><input id="physical-confirm" type="checkbox" ${state.confirmed ? "checked" : ""} ${state.stage !== "cutover_ready" ? "disabled" : ""}><label for="physical-confirm"><strong>Xác nhận đã chuyển port sang switchCE mới</strong><small>Đây là hard gate. Backend vẫn kiểm tra live PPPoE MAC trên switch mới trước khi kết thúc job.</small></label></div></div></section>`;
  }

  function render() {
    const stage = stageInfo();
    document.title = `SwitchCE Initialize · ${isReplacement() ? "Replacement" : "Init mới"} · ${target().vendor}`;
    document.getElementById("app").innerHTML = `${headerMarkup()}<main class="page-shell mockup-shell">
      <div class="page-toolbar"><div class="page-heading"><h1>${BASE_DATA.job_name}</h1><p>${BASE_DATA.plan_code} · ${BASE_DATA.province} · tạo bởi <strong>${BASE_DATA.created_by}</strong></p></div><div class="toolbar-actions">${status(stage.label, stage.tone)}</div></div>
      ${conceptMarkup()}${workflowMarkup()}${planOverviewMarkup()}${actionsMarkup()}${state.stage === "draft" ? allocationEmptyMarkup() : formMarkup()}${state.stage === "draft" ? "" : resultMarkup()}${cutoverMarkup()}
      <div class="prototype-note"><strong>Mockup only:</strong> mọi nút trên trang chỉ chuyển trạng thái trình diễn. Không gửi request, không đăng nhập thiết bị và không thay đổi job thật.</div>
    </main><div class="toast" id="toast" role="status" aria-live="polite"></div>${createPlanModalMarkup()}${allocationModalMarkup()}`;
    bindEvents();
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function bindEvents() {
    document.querySelectorAll("[data-mode]").forEach(element => element.addEventListener("click", () => {
      state.mode = element.dataset.mode;
      state.stage = "draft";
      state.confirmed = false;
      state.finishedAt = null;
      render();
    }));
    const vendorSelect = document.querySelector("[data-vendor-select]");
    if (vendorSelect) vendorSelect.addEventListener("change", event => {
      state.vendor = event.target.value;
      render();
    });
    const stageSelect = document.querySelector("[data-stage]");
    if (stageSelect) stageSelect.addEventListener("change", event => {
      state.stage = event.target.value;
      state.confirmed = false;
      state.finishedAt = state.stage === "finished" ? "2026-09-26T09:12:00+07:00" : null;
      render();
    });
    const confirmation = document.getElementById("physical-confirm");
    if (confirmation) confirmation.addEventListener("change", event => {
      state.confirmed = event.target.checked;
      render();
    });
    document.querySelectorAll("[data-action]").forEach(element => element.addEventListener("click", event => {
      const action = element.dataset.action;
      if (action === "new-plan") { state.createPlanModal = true; render(); return; }
      if (action === "cancel-create-plan") { state.createPlanModal = false; render(); return; }
      if (action === "create-plan") {
        state.createPlanModal = false;
        state.allocateModal = false;
        state.stage = "draft";
        state.confirmed = false;
        state.finishedAt = null;
        render();
        showToast("Đã mô phỏng tạo kế hoạch SwitchCE Initialize.");
        return;
      }
      if (action === "allocate") { state.allocateModal = true; render(); return; }
      if (action === "cancel-allocate") { state.allocateModal = false; render(); return; }
      if (action === "confirm-allocate") {
        state.allocateModal = false;
        state.stage = "allocated";
        state.confirmed = false;
        state.finishedAt = null;
        render();
        showToast("Đã mô phỏng cấp phát SwitchCE thành công.");
        return;
      }
      const transitions = {
        precheck: ["prechecked", "Đã mô phỏng precheck thành công."],
        config: [isReplacement() ? "ready_for_cutover" : "finished", "Đã mô phỏng cấu hình thành công."],
        "cutover-precheck": ["cutover_ready", "Đã chụp rollback snapshot; chờ xác nhận chuyển Port vật lý."],
        cutover: ["finished", "Đã mô phỏng MAC chuyển sang SwitchCE mới sau chuyển Port."],
        rollback: ["rolled_back", "Đã mô phỏng hoàn trả sang SwitchCE cũ."]
      };
      if (transitions[action]) {
        const [, message] = transitions[action];
        state.stage = transitions[action][0];
        state.confirmed = false;
        state.finishedAt = state.stage === "finished" ? new Date().toISOString() : null;
        render();
        showToast(message);
      }
    }));
  }

  window.SWITCH_CE_INITIALIZE_MOCKUP_CONTRACT = Object.freeze({
    modes: ["new", "replacement"],
    vendors: ["HUAWEI", "H3C"]
  });
  render();
})();
