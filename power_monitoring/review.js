(function () {
  "use strict";

  const API = {
    oltOptions: "/netauto/ops_flow/power_monitoring/olt-options",
    allocate: "/netauto/ops_flow/power_monitoring/allocate",
    precheck: "/netauto/ops_flow/power_monitoring/precheck",
    config: "/netauto/ops_flow/power_monitoring/config"
  };

  const CASES = {
    "01_tao_ke_hoach_thanh_cong.html": { stage: 0, title: "Case 1 — Tạo kế hoạch thành công", state: "plan_created" },
    "02_cap_phat_thanh_cong.html": { stage: 1, title: "Case 2 — Cấp phát thông tin thành công", state: "allocation_succeeded" },
    "03_cap_phat_khong_thanh_cong.html": { stage: 1, title: "Case 3 — Cấp phát thông tin không thành công", state: "allocation_failed", failure: "allocation" },
    "04_precheck_khong_thanh_cong.html": { stage: 2, title: "Case 4 — Kiểm tra vật lý không thành công", state: "precheck_failed", failure: "precheck" },
    "05_precheck_thanh_cong.html": { stage: 2, title: "Case 5 — Kiểm tra vật lý thành công", state: "precheck_succeeded" },
    "06_config_khong_thanh_cong.html": { stage: 3, title: "Case 6 — Cấu hình không thành công", state: "config_failed", failure: "config" },
    "07_config_thanh_cong.html": { stage: 3, title: "Case 7 — Cấu hình thành công", state: "config_succeeded", finished: true }
  };

  // Fixture giữ nguyên từ Allocate response thực tế do DevNet cung cấp.
  const ALLOCATE_RESULT = {
    data: {
      area: "MN",
      branch: "AGG",
      olt_candidates: [{
        eligible_ports: [
          { admin_status: "UP", description: "", oper_status: "DOWN", port: "e1/4" },
          { admin_status: "UP", description: "", oper_status: "DOWN", port: "e1/3" },
          { admin_status: "UP", description: "", oper_status: "DOWN", port: "e1/2" },
          { admin_status: "UP", description: "", oper_status: "DOWN", port: "e1/1" }
        ],
        hostname: "AGGP01304GC16",
        ip_address: "11.67.228.24",
        model: "GC16"
      }],
      POP: "AGGP013",
      power_device: {
        community: "FPTHCM", function: "POWER", gateway: "11.67.248.1", group: "ACCESS",
        hostname: "AGGP01302PWDE1U", ip_address: "11.67.248.15", model: "DE1U",
        opsview_name: "INF-AGGP01302PWDE1U-11.67.248.15", position: "02",
        subnet_mask: "255.255.255.0", type: "POWER", vlan_id: 44
      },
      province: "AGG",
      reservation: { expires_at: "2026-09-28T05:25:56.154000", owner: "1375f93312b14f788e23519bbe906ced" },
      selected_olt: { hostname: "AGGP01304GC16", ip_address: "11.67.228.24", model: "GC16", port: "e1/4" },
      switch_path: {
        downlink_aggregation: "Eth-Trunk4", hostname: "CE701003AGGP01301HW63", ip_address: "11.67.68.21",
        management_gateway: { hostname: "DI701001AGGM00103HS64", ip_address: "11.67.11.3", source: "lldp_upstream" },
        model: "HW63", uplink_aggregation: "Eth-Trunk32", vendor: "HUAWEI"
      },
      zone: "V7"
    },
    duration: 14.52,
    error: null,
    message: "Cấp phát cấu hình giám sát nguồn thành công.",
    status: true
  };

  const DATA = ALLOCATE_RESULT.data;
  const POWER = DATA.power_device;
  const OLT = DATA.selected_olt;
  const SWITCH = DATA.switch_path;
  const GATEWAY = SWITCH.management_gateway;
  const PORTS = DATA.olt_candidates[0].eligible_ports;

  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const pill = (label, tone) => `<span class="status-pill ${tone}">${esc(label)}</span>`;
  const info = (label, value) => `<div class="info-item"><div class="info-label">${esc(label)}</div><div class="info-value">${value}</div></div>`;
  const detail = (label, value, wide = false) => `<div class="detail-box ${wide ? "wide-detail" : ""}"><div class="info-label">${esc(label)}</div><div class="info-value">${value}</div></div>`;

  function stepMarkup(state) {
    const steps = [
      ["Tạo Kế hoạch", "Bởi DevNet · 28/09/2026"],
      ["Cấp phát", state.stage >= 1 ? "Allocate hoàn tất" : "Chờ thực hiện"],
      ["Kiểm tra vật lý", state.stage >= 2 ? "SNMP · SSH · LLDP" : "Chờ thực hiện"],
      ["Cấu hình", state.stage >= 3 ? "Switch → verify path → OLT" : "Chờ thực hiện"]
    ];
    return steps.map(([name, description], index) => {
      const done = state.finished || index < state.stage || (index === state.stage && !state.failure && state.stage > 0);
      const failed = index === state.stage && Boolean(state.failure);
      const current = index === state.stage;
      return `<div class="progress-step ${done ? "done" : ""} ${failed ? "failed" : ""} ${current ? "current" : ""}">
        <div class="step-dot">${done ? "✓" : failed ? "×" : index + 1}</div>
        <div class="step-name">${name}</div><div class="step-detail">${description}</div>
        ${index === 1 && state.stage >= 1 ? `<span class="step-time">${ALLOCATE_RESULT.duration} giây</span>` : ""}
      </div>`;
    }).join("");
  }

  function timelineMarkup(state) {
    const rows = [
      ["Tạo Kế hoạch", "Tạo kế hoạch thành công"],
      ["Cấp phát", state.failure === "allocation" ? "Cấp phát không thành công" : state.stage >= 1 ? ALLOCATE_RESULT.message : "Chưa thực hiện"],
      ["Kiểm tra vật lý", state.failure === "precheck" ? "LLDP live không khớp allocation" : state.stage >= 2 ? "Kiểm tra vật lý thành công" : "Chưa thực hiện"],
      ["Cấu hình", state.failure === "config" ? "Post-check OLT không đạt" : state.stage >= 3 ? "Cấu hình thành công" : "Chưa thực hiện"]
    ];
    return rows.map(([label, value], index) => {
      const failed = index === state.stage && Boolean(state.failure);
      const pending = index > state.stage || (index === state.stage && state.stage === 0);
      return `<div class="timeline-row"><span class="mini-dot ${failed ? "fail" : pending ? "pending" : ""}">${failed ? "×" : pending ? "" : "✓"}</span><span class="timeline-label">${label}</span><span class="timeline-value">${value}</span></div>`;
    }).join("");
  }

  function topologyMarkup() {
    return `<svg class="topology-svg" viewBox="0 0 700 420" role="img" aria-labelledby="topology-title topology-desc">
      <title id="topology-title">Kết nối OLT tới thiết bị nguồn</title>
      <desc id="topology-desc">Port ${OLT.port} trên OLT ${OLT.hostname} kết nối trực tiếp tới thiết bị nguồn ${POWER.hostname} bằng VLAN ${POWER.vlan_id}.</desc>
      <defs><filter id="nodeShadow" x="-20%" y="-30%" width="140%" height="170%"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#274568" flood-opacity=".12"/></filter></defs>
      <g filter="url(#nodeShadow)"><rect x="155" y="42" width="390" height="84" rx="10" fill="#fff8ed" stroke="#f1a61d" stroke-width="2"/><text x="350" y="75" text-anchor="middle" font-size="16" font-weight="800" fill="#a55a00">${OLT.hostname}</text><text x="350" y="100" text-anchor="middle" font-size="12" fill="#7d6948">${OLT.ip_address} · GCOM ${OLT.model} · POP ${DATA.POP}</text></g>
      <line x1="350" y1="126" x2="350" y2="260" stroke="#e58a00" stroke-width="3" stroke-dasharray="7 5"/><rect x="262" y="178" width="176" height="30" rx="15" fill="#fff" stroke="#e58a00"/><text x="350" y="198" text-anchor="middle" font-size="10" font-weight="800" fill="#986000">${OLT.port} · ACCESS VLAN ${POWER.vlan_id}</text>
      <g filter="url(#nodeShadow)"><rect x="155" y="260" width="390" height="100" rx="10" fill="#effaf4" stroke="#0ca65a" stroke-width="2"/><text x="350" y="296" text-anchor="middle" font-size="16" font-weight="800" fill="#087a44">${POWER.hostname}</text><text x="350" y="322" text-anchor="middle" font-size="12" fill="#4d7864">${POWER.ip_address} · ${POWER.model} · Vị trí ${POWER.position}</text><text x="350" y="344" text-anchor="middle" font-size="10" fill="#4d7864">Gateway ${POWER.gateway} · ${POWER.subnet_mask}</text></g>
    </svg>`;
  }

  function allocationMarkup(state) {
    if (state.stage === 0 || state.failure === "allocation") {
      const failed = state.failure === "allocation";
      return `<div class="allocation-empty ${failed ? "error" : ""}">${failed ? `OLT ${OLT.hostname} không còn port phù hợp; hệ thống không tự chuyển sang OLT khác.` : "Kế hoạch đã tạo. Chọn đúng OLT và model nguồn, sau đó thực hiện Allocate."}</div>`;
    }
    const eligible = PORTS.map(item => `<span class="tag ${item.port === OLT.port ? "green" : "gray"}">${item.port} · ${item.oper_status}${item.port === OLT.port ? " · SELECTED" : ""}</span>`).join("");
    return `<div class="allocation-grid">
      <div class="allocation-data">
        <article class="device-card gateway-card"><div class="device-title"><div><div class="device-name">${GATEWAY.hostname}</div><div class="device-ip">${GATEWAY.ip_address}</div></div><span class="tag blue">MANAGEMENT GATEWAY</span></div><div class="detail-grid">${detail("VLAN quản trị", `<span class="tag blue">${POWER.vlan_id}</span>`)}${detail("Gateway nguồn", POWER.gateway)}${detail("Subnet mask", POWER.subnet_mask)}</div></article>
        <article class="device-card switch-card"><div class="device-title"><div><div class="device-name">${SWITCH.hostname}</div><div class="device-ip">${SWITCH.ip_address} · ${SWITCH.vendor} Switch · ${SWITCH.model}</div></div><span class="tag device-badge">SWITCH PATH</span></div><div class="detail-grid">${detail("Uplink aggregate", SWITCH.uplink_aggregation)}${detail("Downlink aggregate", SWITCH.downlink_aggregation)}${detail("Vai trò", "ACCESS / CE")}</div></article>
        <article class="device-card olt-card"><div class="device-title"><div><div class="device-name">${OLT.hostname}</div><div class="device-ip">${OLT.ip_address} · GCOM OLT · ${OLT.model}</div></div><span class="tag amber">OLT ĐÃ CHỌN</span></div><div class="detail-grid">${detail("POP / Zone", `${DATA.POP} · ${DATA.zone}`)}${detail("Port cấp phát", `<span class="tag amber">${OLT.port}</span>`)}${detail("Branch", DATA.branch)}${detail("Eligible ports", `<div class="port-list">${eligible}</div>`, true)}</div></article>
        <article class="device-card power-card"><div class="device-title"><div><div class="device-name">${POWER.hostname}</div><div class="device-ip">${POWER.ip_address} · ${POWER.model} · ${POWER.group}</div></div><span class="tag green">POWER MONITORING</span></div><div class="detail-grid">${detail("Opsview name", POWER.opsview_name, true)}${detail("Vị trí", POWER.position)}${detail("Community", POWER.community)}${detail("Trạng thái tài nguyên", `<span class="tag green">ĐÃ GIỮ</span>`)}${detail("Phạm vi", "IP · vị trí · port OLT")}</div></article>
      </div>
      <div class="topology-panel"><div class="panel-title"><strong>Kết nối OLT tới thiết bị nguồn</strong><div class="panel-tools"><button class="icon-btn" data-demo="zoom" title="Phóng to">↗</button><button class="icon-btn" data-demo="fit" title="Căn vừa">⌗</button></div></div><div class="topology-canvas">${topologyMarkup()}</div></div>
    </div>`;
  }

  function checkRow(name, detailText, failed) {
    return `<div class="check-row"><span class="check-mark ${failed ? "fail" : ""}">${failed ? "×" : "✓"}</span><div class="check-copy"><strong>${name}</strong><small>${detailText}</small></div>${pill(failed ? "FAILED" : "PASS", failed ? "error" : "success")}</div>`;
  }

  function resultMarkup(state) {
    const precheckVisible = state.stage >= 2;
    const configVisible = state.stage >= 3;
    const precheckFailed = state.failure === "precheck";
    const configFailed = state.failure === "config";
    const precheckBody = precheckVisible ? `<div class="result-banner ${precheckFailed ? "error" : ""}">${precheckFailed ? "LLDP live trên switch không còn nhìn thấy đúng OLT đã cấp phát." : "Tài nguyên đã giữ, kết nối SNMP, SSH và topology đều đủ điều kiện cấu hình."}</div><div class="result-context"><div class="context-device"><span>Switch path</span><strong>${SWITCH.hostname}</strong><small>${SWITCH.uplink_aggregation} → ${SWITCH.downlink_aggregation}</small></div><div class="context-device"><span>OLT đã chọn</span><strong>${OLT.hostname}</strong><small>${OLT.port} · VLAN ${POWER.vlan_id}</small></div></div><div class="check-list">${checkRow("Tài nguyên đã giữ", "IP, vị trí và port OLT vẫn thuộc kế hoạch này", false)}${checkRow("SNMP / SSH", "Core/device kết nối thành công", false)}${checkRow("LLDP topology", precheckFailed ? `Không tìm thấy ${OLT.hostname} qua ${SWITCH.downlink_aggregation}` : `Nhìn thấy đúng ${OLT.hostname} qua ${SWITCH.downlink_aggregation}`, precheckFailed)}${checkRow("OLT live-state", `${OLT.port} DOWN, không LAG, không service xung đột`, false)}</div>` : `<div class="result-empty">Chưa chạy Pre-check.</div>`;
    const configBody = configVisible ? `<div class="result-banner ${configFailed ? "error" : ""}">${configFailed ? "Post-check chưa xác nhận VLAN/description MGNT-PWR trên OLT; cần rollback theo snapshot." : "VLAN 44 đã được trunk và xác nhận trên switch trước khi cấu hình OLT; tài nguyên đã được ghi nhận chính thức."}</div><div class="config-groups"><div class="config-group"><div class="config-group-head"><strong>config.switch · Config VLAN on switch</strong>${pill("SUCCESS", "success")}</div><div class="config-summary">Tạo VLAN ${POWER.vlan_id}, allow trên ${SWITCH.uplink_aggregation} và ${SWITCH.downlink_aggregation}, sau đó save.</div></div><div class="config-group"><div class="config-group-head"><strong>config.switch_verify · Verify trước OLT</strong>${pill("VERIFIED", "success")}</div><div class="config-summary">Đã đọc lại VLAN và hai trunk; chỉ sau bước này workflow mới gửi command xuống ${OLT.hostname}.</div></div><div class="config-group ${configFailed ? "error" : ""}"><div class="config-group-head"><strong>config.olt · OLT service</strong>${pill(configFailed ? "VERIFY FAILED" : "VERIFIED", configFailed ? "error" : "success")}</div><div class="config-summary">${configFailed ? `Chưa xác nhận VLAN ${POWER.vlan_id} có description MGNT-PWR hoặc cấu hình port ${OLT.port}.` : `VLAN ${POWER.vlan_id} có description MGNT-PWR và port ${OLT.port} đã được xác nhận.`}</div></div><div class="config-group"><div class="config-group-head"><strong>config.verify → config.commit</strong>${pill(configFailed ? "BLOCKED" : "COMMITTED", configFailed ? "error" : "success")}</div><div class="config-summary">Kiểm tra lại hai phía và ghi nhận tài nguyên chính thức theo đúng section logging của OLT Init.</div></div></div>` : `<div class="result-empty">Chưa chạy Config.</div>`;
    return `<div class="results-grid"><section class="card result-card"><div class="card-header"><div class="result-heading"><span class="result-icon ${precheckFailed ? "error" : ""}">${precheckFailed ? "×" : "✓"}</span><strong>Kết quả kiểm tra trước cấu hình</strong></div>${pill(precheckVisible ? precheckFailed ? "KHÔNG THÀNH CÔNG" : "THÀNH CÔNG" : "CHƯA THỰC HIỆN", precheckVisible ? precheckFailed ? "error" : "success" : "warning")}</div><div class="card-body">${precheckBody}</div></section><section class="card result-card"><div class="card-header"><div class="result-heading"><span class="result-icon ${configFailed ? "error" : ""}">${configFailed ? "×" : "✓"}</span><strong>Kết quả cấu hình</strong></div>${pill(configVisible ? configFailed ? "KHÔNG THÀNH CÔNG" : "THÀNH CÔNG" : "CHƯA THỰC HIỆN", configVisible ? configFailed ? "error" : "success" : "warning")}</div><div class="card-body">${configBody}</div></section></div>`;
  }

  function renderCase(state, options = {}) {
    const failed = Boolean(state.failure);
    const overall = failed ? ["× Không thành công", "error"] : state.finished ? ["● Hoàn thành", "success"] : ["● Đang thực hiện", "info"];
    const allocationOk = state.stage >= 1 && state.failure !== "allocation";
    document.querySelector("#app").innerHTML = `
      <header class="topbar"><div class="brand"><div class="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect></svg></div>NetAuto <small>Operations Flow</small></div><div class="top-actions"><span class="review-label">UI REVIEW</span><span class="environment">STAGING</span><span class="kbd">⌕ &nbsp; Ctrl+K</span><span class="avatar">M</span></div></header>
      <main class="page-shell"><div class="page-toolbar"><div class="page-heading"><h1>Cấu hình giám sát thiết bị Nguồn</h1><p>Power Device Monitoring · OLT ${OLT.hostname}</p></div><div class="toolbar-actions"><button class="btn" data-demo="back">← Quay lại danh sách</button><button class="btn" data-demo="reload">↻ Tải lại</button></div></div>
      ${options.switcher || ""}
      <section class="card progress-card"><div class="card-header"><div class="section-title"><span class="section-icon">◉</span>Tiến trình thực hiện</div>${pill(overall[0], overall[1])}</div><div class="card-body"><div class="progress-track">${stepMarkup(state)}</div></div></section>
      <section class="card"><div class="card-header"><div class="section-title"><span class="section-icon">▤</span>Thông tin chung ${pill(failed ? "● Có lỗi" : "● Hợp lệ", failed ? "error" : "success")}</div><span style="color:var(--muted);font-size:10px">↻ Allocate duration <strong style="color:var(--text)">${ALLOCATE_RESULT.duration} giây</strong></span></div><div class="card-body"><div class="info-layout"><div><div class="subsection-title">ⓘ Thông tin Job</div><div class="info-list">${info("Trạng thái cấp phát", pill("Đã giữ tài nguyên", "success"))}${info("Tên kế hoạch", `Giám sát nguồn ${POWER.hostname}`)}${info("Loại Job", pill("Power Device Monitoring", "info"))}${info("Khu vực / Chi nhánh", `${DATA.area} · ${DATA.branch}`)}${info("OLT được chọn", `${OLT.hostname} · ${OLT.ip_address}`)}${info("POP suy ra", `${DATA.POP} · Zone ${DATA.zone}`)}</div></div><div><div class="subsection-title">◷ Tiến trình &amp; Thời gian</div><div class="timeline-mini">${timelineMarkup(state)}</div></div></div></div></section>
      <section class="card control-card"><div class="control-inner"><div class="control-copy"><strong>Bảng điều khiển vận hành</strong><span>Thao tác mô phỏng cho bản duyệt UI — không gọi API hoặc thiết bị thật</span></div><div class="button-row"><button class="btn btn-info" data-action="allocate">▦ Cấp phát (Allocate)</button><button class="btn btn-success" data-action="precheck" ${allocationOk ? "" : "disabled"}>◈ Kiểm tra vật lý (Pre-check)</button><button class="btn btn-primary" data-action="config" ${state.stage >= 2 && !failed ? "" : "disabled"}>⌁ Cấu hình (Config)</button><button class="btn btn-danger" data-demo="cancel">× Hủy Kế hoạch (Cancel)</button></div></div></section>
      <section class="card"><div class="card-header"><div class="section-title"><span class="section-icon">▦</span>Thông tin cấp phát</div><div class="status-line" style="gap:7px">${pill(state.failure === "allocation" ? "× THẤT BẠI" : allocationOk ? "✓ ĐÃ CẤP PHÁT" : "• CHỜ CẤP PHÁT", state.failure === "allocation" ? "error" : allocationOk ? "success" : "warning")}<span class="small-pill">${ALLOCATE_RESULT.duration} giây</span></div></div>${allocationMarkup(state)}</section>
      ${resultMarkup(state)}
      <div class="prototype-note"><strong>Bản duyệt UI theo layout OLT Initialize:</strong> fixture lấy từ Allocate response thực tế cho ${OLT.hostname}. Endpoint: <code>${API.allocate}</code>, <code>${API.precheck}</code>, <code>${API.config}</code>; selector dùng <code>${API.oltOptions}</code>.</div></main>
      <dialog class="allocate-dialog" id="allocate-dialog"><form method="dialog" id="allocate-form"><header class="allocate-head"><div class="allocate-title"><span class="allocate-icon">▦</span><div><h2>Cấp phát thiết bị Nguồn</h2><p>CHỌN OLT TRỰC TIẾP · backend tự suy ra POP, switch và gateway</p></div></div><button class="allocate-close" value="cancel" aria-label="Đóng">×</button></header><div class="allocate-body"><div class="allocate-plan"><div><span>OLT đang chọn</span><strong>${OLT.hostname} · ${OLT.ip_address}</strong></div><div><span>Scope suy ra</span><strong>${DATA.area} · ${DATA.branch} · ${DATA.POP}</strong></div></div><div class="allocate-form-grid"><div class="allocate-field"><label>OLT GCOM</label><select class="allocate-input" name="olt_device"><option selected>${OLT.hostname} · ${OLT.ip_address} · ${OLT.model}</option></select><p class="allocate-hint">Dữ liệu từ ${API.oltOptions}; FE không cho chọn POP.</p></div><div class="allocate-field"><label>Model thiết bị nguồn</label><select class="allocate-input" name="power_model"><option selected>${POWER.model}</option><option>EN1U</option><option>EN3U</option><option>EN4U</option><option>EN6U</option></select><p class="allocate-hint">Port chỉ được cấp trên đúng OLT đã chọn.</p></div></div></div><footer class="allocate-foot"><button class="btn" value="cancel">Hủy</button><button class="btn btn-primary" value="default" id="allocate-submit">Cấp phát</button></footer></form></dialog>`;

    const dialog = document.querySelector("#allocate-dialog");
    document.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => {
      if (button.dataset.action === "allocate" && dialog && typeof dialog.showModal === "function") dialog.showModal();
      else showToast("Mockup không gọi API thật.");
    }));
    document.querySelectorAll("[data-demo]").forEach(button => button.addEventListener("click", () => showToast("Thao tác mô phỏng theo OLT Initialize.")));
    const form = document.querySelector("#allocate-form");
    if (form) form.addEventListener("submit", () => showToast(`Payload preview: olt_device=${OLT.hostname}, power_model=${POWER.model}`));
  }

  function showToast(message) {
    const old = document.querySelector(".toast");
    if (old) old.remove();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1800);
  }

  window.PowerMonitoringReview = { API, CASES, ALLOCATE_RESULT, DATA, renderCase };
  document.addEventListener("DOMContentLoaded", () => {
    const filename = location.pathname.split("/").pop();
    if (CASES[filename]) renderCase(CASES[filename]);
  });
})();
