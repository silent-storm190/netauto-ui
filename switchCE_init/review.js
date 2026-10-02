(() => {
  "use strict";

  const API_ENDPOINTS = Object.freeze({
    allocate: "/netauto/ops_flow/switch_ce_initialize/allocate",
    precheck: "/netauto/ops_flow/switch_ce_initialize/precheck",
    config: "/netauto/ops_flow/switch_ce_initialize/config"
  });

  const ALLOCATION_RESPONSE = Object.freeze({
    status: true,
    message: "Cấp phát SwitchCE thành công!",
    error: null,
    data: {
      allocated_at: "2026-09-15T16:30:54.681967+07:00",
      allocation_duration: 56.9,
      area: "MN",
      branch: "DNI",
      job_id: null,
      link_count: 2,
      link_speed: 10,
      mpop: "01",
      pop: "DNIP040",
      province: "DNI",
      switch_ce_aggregation_port: "Eth-Trunk32",
      switch_ce_gateway: "11.60.68.1",
      switch_ce_ip: "11.60.68.31",
      switch_ce_management_vlan: 36,
      switch_ce_model: "HW63",
      switch_ce_name: "CE601012DNIP04002HW63",
      switch_ce_physical_ports: ["XGigabitEthernet0/0/23", "XGigabitEthernet0/0/24"],
      switch_ce_pim_ip: "192.168.99.14",
      switch_ce_pim_vlan: 63,
      switch_ce_pop: "DNIP040",
      switch_ce_position_in_pop: "02",
      switch_ce_pppoe_vlan: 1321,
      switch_ce_vendor: "HUAWEI",
      uplink_switch_aggregation_port: "Eth-Trunk17",
      uplink_switch_ip: "11.60.18.2",
      uplink_switch_model: "HS64",
      uplink_switch_name: "DI601012DNIP01201HS64",
      uplink_switch_physical_ports: ["XGigabitEthernet0/0/40", "XGigabitEthernet1/0/40"],
      uplink_switch_pim_ip: "192.168.99.13",
      uplink_switch_pop: "DNIP012",
      uplink_switch_vendor: "HUAWEI",
      user_email: "minhbq3@fpt.com",
      zone: "V6"
    }
  });

  const opticalRows = ALLOCATION_RESPONSE.data.uplink_switch_physical_ports.map((port, index) => ({
    port_name: port,
    sfp_present: true,
    admin_status: "UP",
    oper_status: "UP",
    port_speed: 10000,
    RX: index === 0 ? -2.71 : -2.88,
    RXL: -13.9,
    RXH: 1.0,
    TX: index === 0 ? -2.19 : -2.34,
    TXL: -8.2,
    TXH: 1.0
  }));

  const PRECHECK_RESPONSE = Object.freeze({
    status: true,
    message: "Đủ điều kiện cấu hình SwitchCE!",
    error: null,
    duration: 74.21,
    run_id: "7f934e8fc2bd4ef8b1bc9836c2e6d301",
    data: {
      uplink: {
        name: ALLOCATION_RESPONSE.data.uplink_switch_name,
        ip: ALLOCATION_RESPONSE.data.uplink_switch_ip,
        vendor: ALLOCATION_RESPONSE.data.uplink_switch_vendor
      },
      switch_ce: {
        name: ALLOCATION_RESPONSE.data.switch_ce_name,
        target_ip: ALLOCATION_RESPONSE.data.switch_ce_ip,
        bootstrap_ip: "10.20.45.2",
        vendor: ALLOCATION_RESPONSE.data.switch_ce_vendor,
        model: ALLOCATION_RESPONSE.data.switch_ce_model
      },
      checks: {
        ports: {
          management_port: "XGigabitEthernet1/0/40",
          checked_ports: [...ALLOCATION_RESPONSE.data.uplink_switch_physical_ports],
          interfaces: [
            ["XGigabitEthernet0/0/40", "UP", "UP", "BYP-Port"],
            ["XGigabitEthernet1/0/40", "UP", "UP", "BYP-Port"]
          ],
          transceivers: { device: { login_status: true }, transceivers: opticalRows }
        },
        dhcp: {
          vlan: 45,
          candidates: ["10.20.45.2", "10.20.45.3", "10.20.45.4", "10.20.45.5", "10.20.45.6", "10.20.45.7", "10.20.45.8", "10.20.45.9", "10.20.45.10"],
          selected: "10.20.45.2"
        },
        version: "Huawei Versatile Routing Platform Software — model HW63"
      }
    }
  });

  const CONFIG_RESPONSE = Object.freeze({
    status: true,
    message: "Hoàn tất khởi tạo và cấu hình SwitchCE!",
    error: null,
    duration: 328.44,
    run_id: "7f934e8fc2bd4ef8b1bc9836c2e6d301",
    data: {
      precheck: PRECHECK_RESPONSE.data,
      config_file: {
        path: "/storage/DEVNET_LOGS/config_new_switchCE/MN/config_files/ce601012dnip04002hw63.cfg",
        remote_path: "/storage/DEVNET_LOGS/config_new_switchCE/MN/config_files/ce601012dnip04002hw63.cfg",
        line_count: 212
      },
      firmware: { status: "not_required" },
      load: {
        remote_path: "/storage/DEVNET_LOGS/config_new_switchCE/MN/config_files/ce601012dnip04002hw63.cfg",
        startup_file: "flash:/ce601012dnip04002hw63.cfg"
      },
      uplink: {
        aggregation: "Eth-Trunk17",
        lacp: {
          aggregation: "Eth-Trunk17",
          members: [...ALLOCATION_RESPONSE.data.uplink_switch_physical_ports],
          reused: false,
          operational_status: {}
        },
        descriptions: [
          { port: "XGigabitEthernet0/0/40", description: "DWL-XGE0/0/23-CE601012DNIP04002HW63" },
          { port: "XGigabitEthernet1/0/40", description: "DWL-XGE0/0/24-CE601012DNIP04002HW63" }
        ]
      },
      switch_ce: {
        name: ALLOCATION_RESPONSE.data.switch_ce_name,
        ip: ALLOCATION_RESPONSE.data.switch_ce_ip,
        vendor: ALLOCATION_RESPONSE.data.switch_ce_vendor,
        verification: {
          get_interfaces: [
            ["XGigabitEthernet0/0/23", "UP", "UP", "UPL-XGE0/0/40-DI601012DNIP01201HS64"],
            ["XGigabitEthernet0/0/24", "UP", "UP", "UPL-XGE1/0/40-DI601012DNIP01201HS64"]
          ],
          get_agg_port_data: [{ aggPort: "Eth-Trunk32", adminStt: "UP", operStt: "UP" }],
          backup_configuration: "Backup configuration successfully."
        }
      },
      post_sync: {
        status: "ok",
        warnings: [],
        services: {
          inventory: { ok: true, status_code: 200 },
          autosync: { ok: true, status_code: 200 },
          lldp: { ok: true, status_code: 200 }
        }
      },
      sync_warnings: []
    }
  });

  const NOT_RUN_PRECHECK = Object.freeze({ status: null, message: "Chưa thực hiện precheck.", data: null, error: null });
  const NOT_RUN_CONFIG = Object.freeze({ status: null, message: "Chưa thực hiện cấu hình.", data: null, error: null });
  const FAILED_PRECHECK = Object.freeze({
    status: false,
    message: "Port uplink chưa UP/UP: XGigabitEthernet0/0/40.",
    data: null,
    error: "Port uplink chưa UP/UP: XGigabitEthernet0/0/40.",
    duration: 31.08,
    run_id: "7f934e8fc2bd4ef8b1bc9836c2e6d301"
  });
  const FAILED_CONFIG = Object.freeze({
    status: false,
    message: "SwitchCE không kết nối được config FTP server.",
    data: null,
    error: "SwitchCE không kết nối được config FTP server.",
    duration: 96.33,
    run_id: "7f934e8fc2bd4ef8b1bc9836c2e6d301"
  });

  const CASES = Object.freeze({
    "01_tao_ke_hoach_thanh_cong.html": { title: "Case 1 — Tạo Kế hoạch thành công", state: "plan_created", precheck: NOT_RUN_PRECHECK, config: NOT_RUN_CONFIG },
    "02_cap_phat_thanh_cong.html": { title: "Case 2 — Cấp phát thông tin thành công", state: "allocation_succeeded", precheck: NOT_RUN_PRECHECK, config: NOT_RUN_CONFIG },
    "03_cap_phat_khong_thanh_cong.html": { title: "Case 3 — Cấp phát thông tin không thành công", state: "allocation_failed", precheck: NOT_RUN_PRECHECK, config: NOT_RUN_CONFIG },
    "04_precheck_khong_thanh_cong.html": { title: "Case 4 — Precheck không thành công", state: "precheck_failed", precheck: FAILED_PRECHECK, config: NOT_RUN_CONFIG },
    "05_precheck_thanh_cong.html": { title: "Case 5 — Precheck thành công", state: "precheck_succeeded", precheck: PRECHECK_RESPONSE, config: NOT_RUN_CONFIG },
    "06_config_khong_thanh_cong.html": { title: "Case 6 — Cấu hình không thành công", state: "config_failed", precheck: PRECHECK_RESPONSE, config: FAILED_CONFIG },
    "07_config_thanh_cong.html": { title: "Case 7 — Cấu hình thành công", state: "config_succeeded", precheck: PRECHECK_RESPONSE, config: CONFIG_RESPONSE }
  });

  const STATE_RULES = Object.freeze({
    plan_created: { stage: 0, label: "Đã tạo Kế hoạch", tone: "info", allocate: true, precheck: false, config: false, cancel: true },
    allocation_succeeded: { stage: 1, label: "Đã cấp phát", tone: "success", allocate: false, precheck: true, config: true, cancel: true },
    allocation_failed: { stage: 1, label: "Cấp phát không thành công", tone: "error", failed: true, allocate: true, precheck: false, config: false, cancel: true },
    precheck_failed: { stage: 2, label: "Precheck không thành công", tone: "error", failed: true, allocate: false, precheck: true, config: true, cancel: true },
    precheck_succeeded: { stage: 2, label: "Đủ điều kiện cấu hình", tone: "success", allocate: false, precheck: true, config: true, cancel: true },
    config_failed: { stage: 3, label: "Cấu hình thất bại", tone: "error", failed: true, allocate: false, precheck: true, config: true, cancel: true },
    config_succeeded: { stage: 3, label: "Hoàn thành", tone: "success", allocate: false, precheck: false, config: false, cancel: false }
  });

  const compactPort = value => String(value || "")
    .replace(/^XGigabitEthernet/i, "XGE")
    .replace(/^GigabitEthernet/i, "GE")
    .replace(/^Ten-GigabitEthernet/i, "XGE");
  const tag = (value, tone = "gray") => `<span class="tag ${tone}">${value}</span>`;
  const status = (value, tone) => `<span class="status-pill ${tone}">${value}</span>`;
  const info = (label, value, wide = false) => `<div class="detail-box${wide ? " wide-detail" : ""}"><div class="info-label">${label}</div><div class="info-value">${value}</div></div>`;

  function topology() {
    const allocation = ALLOCATION_RESPONSE.data;
    return `
      <svg class="topology-svg" viewBox="0 0 680 430" role="img" aria-label="Hai đường 10G giữa uplink switch và SwitchCE mới">
        <defs><filter id="shadow"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#274568" flood-opacity=".13"/></filter></defs>
        <g filter="url(#shadow)">
          <rect x="110" y="28" width="460" height="68" rx="12" fill="#eef5ff" stroke="#2563eb" stroke-width="2"/>
          <text x="340" y="55" text-anchor="middle" font-size="16" font-weight="800" fill="#174ea6">${allocation.uplink_switch_name}</text>
          <text x="340" y="78" text-anchor="middle" font-size="12" fill="#58708f">${allocation.uplink_switch_ip} · Huawei ${allocation.uplink_switch_model} · ${allocation.uplink_switch_pop}</text>
          <rect x="195" y="112" width="290" height="35" rx="18" fill="#f4f8ff" stroke="#2563eb" stroke-width="2"/>
          <text x="340" y="135" text-anchor="middle" font-size="13" font-weight="800" fill="#174ea6">${allocation.uplink_switch_aggregation_port}</text>
        </g>
        <g font-size="10" font-weight="800" text-anchor="middle">
          <rect x="205" y="166" width="110" height="28" rx="6" fill="#fff" stroke="#73a7ff"/><text x="260" y="184" fill="#174ea6">${compactPort(allocation.uplink_switch_physical_ports[0])}</text>
          <rect x="365" y="166" width="110" height="28" rx="6" fill="#fff" stroke="#73a7ff"/><text x="420" y="184" fill="#174ea6">${compactPort(allocation.uplink_switch_physical_ports[1])}</text>
        </g>
        <g stroke="#12b76a" stroke-width="3" stroke-dasharray="7 5"><line x1="260" y1="194" x2="260" y2="260"/><line x1="420" y1="194" x2="420" y2="260"/></g>
        <g text-anchor="middle" font-size="10" font-weight="900"><rect x="238" y="217" width="44" height="22" rx="11" fill="#fff" stroke="#12b76a"/><text x="260" y="232" fill="#087a44">10G</text><rect x="398" y="217" width="44" height="22" rx="11" fill="#fff" stroke="#12b76a"/><text x="420" y="232" fill="#087a44">10G</text></g>
        <g font-size="10" font-weight="800" text-anchor="middle">
          <rect x="205" y="260" width="110" height="28" rx="6" fill="#fff" stroke="#f6b94a"/><text x="260" y="278" fill="#a55a00">${compactPort(allocation.switch_ce_physical_ports[0])}</text>
          <rect x="365" y="260" width="110" height="28" rx="6" fill="#fff" stroke="#f6b94a"/><text x="420" y="278" fill="#a55a00">${compactPort(allocation.switch_ce_physical_ports[1])}</text>
        </g>
        <g filter="url(#shadow)">
          <rect x="195" y="306" width="290" height="35" rx="18" fill="#fff9eb" stroke="#f1a61d" stroke-width="2"/>
          <text x="340" y="329" text-anchor="middle" font-size="13" font-weight="800" fill="#a55a00">${allocation.switch_ce_aggregation_port}</text>
          <rect x="110" y="357" width="460" height="66" rx="12" fill="#fff8ed" stroke="#f1a61d" stroke-width="2"/>
          <text x="340" y="384" text-anchor="middle" font-size="16" font-weight="800" fill="#a55a00">${allocation.switch_ce_name}</text>
          <text x="340" y="406" text-anchor="middle" font-size="12" fill="#7d6948">${allocation.switch_ce_ip} · Huawei ${allocation.switch_ce_model} · ${allocation.switch_ce_pop}</text>
        </g>
      </svg>`;
  }

  function allocationMarkup(state) {
    if (state === "plan_created") return `<div class="allocation-empty">Kế hoạch đã được tạo. Chưa có dữ liệu cấp phát.</div>`;
    if (state === "allocation_failed") return `<div class="allocation-empty error">Không tìm thấy đủ 2 port BYP-Port tốc độ 10G trên switch uplink. Có thể chạy lại bước Cấp phát.</div>`;
    const a = ALLOCATION_RESPONSE.data;
    return `<div class="allocation-grid">
      <div class="allocation-data">
        <article class="device-card switch-card">
          <div class="device-title"><div class="device-title-main"><div class="device-name">${a.uplink_switch_name}</div><div class="device-ip">${a.uplink_switch_ip} · ${a.uplink_switch_vendor} ${a.uplink_switch_model}</div></div><span class="tag device-badge">SWITCH UPLINK</span></div>
          <div class="detail-grid">
            ${info("POP", `${a.uplink_switch_pop} · MPOP ${a.mpop}`)}
            ${info("Aggregate port", a.uplink_switch_aggregation_port)}
            ${info("Kết nối", `${a.link_count} × ${a.link_speed} Gbps`)}
            ${info("PIM IP", a.uplink_switch_pim_ip)}
            ${info("Physical ports", `<div class="port-list">${a.uplink_switch_physical_ports.map(port => tag(compactPort(port), "blue")).join("")}</div>`, true)}
          </div>
        </article>
        <article class="device-card olt-card">
          <div class="device-title"><div class="device-title-main"><div class="device-name" style="color:#b35d00">${a.switch_ce_name}</div><div class="device-ip">${a.switch_ce_ip} · ${a.switch_ce_vendor} ${a.switch_ce_model}</div></div>${tag("SWITCHCE MỚI", "amber")}</div>
          <div class="detail-grid">
            ${info("POP / Vị trí", `${a.switch_ce_pop} · ${a.switch_ce_position_in_pop}`)}
            ${info("Aggregate port", a.switch_ce_aggregation_port)}
            ${info("Gateway", a.switch_ce_gateway)}
            ${info("VLAN Management", tag(a.switch_ce_management_vlan, "blue"))}
            ${info("VLAN PIM / IP", `${tag(a.switch_ce_pim_vlan, "green")} ${a.switch_ce_pim_ip}`)}
            ${info("VLAN PPPoE", tag(a.switch_ce_pppoe_vlan, "amber"))}
            ${info("Physical ports", `<div class="port-list">${a.switch_ce_physical_ports.map(port => tag(compactPort(port), "amber")).join("")}</div>`, true)}
          </div>
        </article>
      </div>
      <div class="topology-panel"><div class="panel-title"><strong>Sơ đồ kết nối được cấp phát</strong><div class="panel-tools"><button class="icon-btn" type="button" data-action="zoom" title="Phóng to">↗</button><button class="icon-btn" type="button" data-action="fit" title="Căn vừa">⌗</button></div></div><div class="topology-canvas">${topology()}</div></div>
    </div>`;
  }

  function checkRow(title, detail, passed) {
    return `<div class="check-row"><span class="check-mark${passed ? "" : " fail"}">${passed ? "✓" : "×"}</span><div class="check-copy"><strong>${title}</strong><small>${detail}</small></div></div>`;
  }

  function renderPrecheck(response) {
    const notRun = response.status === null;
    const ok = response.status === true;
    if (notRun) return { tone: "warning", badge: "CHƯA CHẠY", body: `<div class="result-banner warning">• ${response.message}</div><div class="result-empty">Chưa có dữ liệu kiểm tra vật lý.</div>` };
    if (!ok) return { tone: "error", badge: "THẤT BẠI", body: `<div class="result-banner error">× ${response.message}</div>${checkRow("Kiểm tra uplink vật lý", "Port XGE0/0/40 chưa đạt trạng thái UP/UP; các port bootstrap ngoài management port đã được shutdown lại.", false)}` };
    const data = response.data;
    const ports = data.checks.ports;
    const sfps = ports.transceivers.transceivers;
    return {
      tone: "success",
      badge: "THÀNH CÔNG",
      body: `<div class="result-banner">✓ ${response.message}</div>
        <div class="result-context"><div class="context-device"><span>UPLINK</span><strong>${data.uplink.name}</strong><small>${data.uplink.ip} · ${data.uplink.vendor}</small></div><div class="context-device"><span>SWITCHCE</span><strong>${data.switch_ce.name}</strong><small>${data.switch_ce.target_ip} · ${data.switch_ce.model}</small></div></div>
        <div class="check-list">
          ${checkRow("Port uplink UP/UP", `${ports.checked_ports.map(compactPort).join(", ")} · management bootstrap: ${compactPort(ports.management_port)}`, true)}
          ${checkRow("SFP và công suất quang", `${sfps.length}/${ports.checked_ports.length} SFP hiện diện · RX/TX đều trong ngưỡng`, sfps.every(row => row.sfp_present))}
          ${checkRow("VLAN45 và DHCP", `VLAN ${data.checks.dhcp.vlan} · chọn ${data.checks.dhcp.selected} trong dải .2–.10`, true)}
          ${checkRow("Đăng nhập factory", `${data.switch_ce.vendor} ${data.switch_ce.model} tại ${data.switch_ce.bootstrap_ip} · credential không trả về UI`, true)}
        </div>`
    };
  }

  function configGroup(title, badge, tone, summary, tags = []) {
    return `<div class="config-group"><div class="config-group-head"><strong>${title}</strong>${tag(badge, tone)}</div><div class="config-summary">${summary}</div><div class="meta-line">${tags.join("")}</div></div>`;
  }

  function renderConfig(response) {
    const notRun = response.status === null;
    if (notRun) return { tone: "warning", badge: "CHƯA CHẠY", body: `<div class="result-banner warning">• ${response.message}</div><div class="result-empty">Chưa có dữ liệu cấu hình.</div>` };
    if (!response.status) return { tone: "error", badge: "THẤT BẠI", body: `<div class="result-banner error">× ${response.message}</div>${configGroup("FTP configuration", "FAILED", "red", "Không tải file config; workflow dừng trước startup/reboot và job chuyển failed.", [tag("Có thể retry", "amber")])}` };
    const data = response.data;
    const verification = data.switch_ce.verification;
    const sync = data.post_sync;
    return {
      tone: "success",
      badge: "THÀNH CÔNG",
      body: `<div class="result-banner">✓ ${response.message}</div><div class="config-groups">
        ${configGroup("File cấu hình", `${data.config_file.line_count} dòng`, "blue", data.config_file.remote_path, [tag(data.load.startup_file, "gray")])}
        ${configGroup("Firmware", "NOT REQUIRED", "gray", "SwitchCE Huawei HW63 không yêu cầu bước nâng firmware H3C.", [tag("Huawei", "blue")])}
        ${configGroup("LACP uplink", data.uplink.aggregation, "green", `${data.uplink.lacp.members.length} member và ${data.uplink.descriptions.length} description đã xác nhận.`, data.uplink.lacp.members.map(port => tag(`✓ ${compactPort(port)}`, "green")))}
        ${configGroup("Xác minh SwitchCE", "BACKUP OK", "green", `${verification.get_interfaces.length} interface · ${verification.get_agg_port_data.length} aggregation · backup thành công.`, [tag(data.switch_ce.ip, "blue"), tag("Eth-Trunk32 UP", "green")])}
        ${configGroup("Đồng bộ hậu cấu hình", sync.status.toUpperCase(), sync.warnings.length ? "amber" : "green", sync.warnings.length ? sync.warnings.join(" · ") : "Inventory, AutoSync và LLDP đều trả HTTP 200.", Object.entries(sync.services).map(([name, item]) => tag(`${item.ok ? "✓" : "×"} ${name}`, item.ok ? "green" : "red")))}
      </div>`
    };
  }

  function progressMarkup(rule) {
    const steps = [
      ["Tạo Kế hoạch", "15/09/2026 16:29", ""],
      ["Cấp phát", "Bởi minhbq3@fpt.com", "56.9 giây"],
      ["Precheck", "Kiểm tra vật lý & DHCP", "74 giây"],
      ["Cấu hình", "Config & đồng bộ", "328 giây"]
    ];
    return steps.map(([name, detail, time], index) => {
      const failed = rule.failed && index === rule.stage;
      const done = failed ? index < rule.stage : index <= rule.stage;
      const classes = ["progress-step", done ? "done" : "", index === rule.stage ? "current" : "", failed ? "failed" : ""].filter(Boolean).join(" ");
      return `<div class="${classes}"><div class="step-dot">${failed ? "×" : done ? "✓" : index + 1}</div><div class="step-name">${name}</div><div class="step-detail">${failed ? `${name} không thành công` : done ? detail : "Chưa thực hiện"}</div>${done && time ? `<span class="step-time">${time}</span>` : ""}</div>`;
    }).join("");
  }

  function timelineMarkup(rule) {
    const labels = ["Tạo Kế hoạch", "Cấp phát", "Precheck", "Cấu hình"];
    return labels.map((label, index) => {
      const failed = rule.failed && index === rule.stage;
      const done = failed ? index < rule.stage : index <= rule.stage;
      return `<div class="timeline-row"><span class="mini-dot${failed ? " fail" : done ? "" : " pending"}">${failed ? "×" : done ? "✓" : "•"}</span><span class="timeline-label">${label}</span><span class="timeline-value">${failed ? "Không thành công" : done ? "Đã hoàn tất" : "Chưa thực hiện"}</span></div>`;
    }).join("");
  }

  function buttonsMarkup(rule) {
    const button = (id, label, css, enabled) => `<button class="btn ${css}" data-action="${id}" ${enabled ? "" : "disabled"}>${label}</button>`;
    return button("allocate", "▦ Cấp phát", "btn-info", rule.allocate) +
      button("precheck", "◈ Precheck", "btn-success", rule.precheck) +
      button("config", "⌁ Cấu hình", "btn-primary", rule.config) +
      button("cancel", "× Hủy Kế hoạch", "btn-danger", rule.cancel);
  }

  const fileName = decodeURIComponent(location.pathname.split("/").pop() || "").toLowerCase();
  const activeCase = CASES[fileName] || CASES["07_config_thanh_cong.html"];
  const rule = STATE_RULES[activeCase.state];
  const allocationVisible = !["plan_created", "allocation_failed"].includes(activeCase.state);
  const allocationTone = activeCase.state === "allocation_failed" ? "error" : allocationVisible ? "success" : "warning";
  const allocationLabel = activeCase.state === "allocation_failed" ? "× THẤT BẠI" : allocationVisible ? "✓ ĐÃ CẤP PHÁT" : "• CHỜ CẤP PHÁT";
  const precheck = renderPrecheck(activeCase.precheck);
  const config = renderConfig(activeCase.config);

  document.title = `${activeCase.title} · SwitchCE Initialize`;
  document.getElementById("app").innerHTML = `
    <header class="topbar"><div class="brand"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect></svg></span>NetAuto <small>SwitchCE Initialize MN</small></div><div class="top-actions"><span class="review-label">${activeCase.title}</span><span class="environment">REVIEW ONLY</span><span class="kbd">⌕ &nbsp; Ctrl+K</span><span class="avatar">MB</span></div></header>
    <main class="page-shell">
      <div class="page-toolbar"><div class="page-heading"><h1>Lắp đặt SwitchCE ${ALLOCATION_RESPONSE.data.switch_ce_name}</h1><p>SwitchCE Initialize · UI review theo trạng thái nghiệp vụ · Feature SWCE_INIT</p></div><div class="toolbar-actions"><button class="btn" data-action="copy">Sao chép run_id</button><button class="btn" data-action="refresh">↻ Làm mới</button></div></div>

      <section class="card progress-card"><div class="card-header"><div class="section-title"><span class="section-icon">◉</span>Tiến trình thực hiện</div>${status(rule.label, rule.tone)}</div><div class="card-body"><div class="progress-track">${progressMarkup(rule)}</div></div></section>

      <section class="card"><div class="card-header"><div class="section-title"><span class="section-icon">▤</span>Thông tin chung ${status(rule.label, rule.tone)}</div><span class="small-pill">Cập nhật 15/09/2026 16:36</span></div><div class="card-body"><div class="info-layout"><div><div class="subsection-title">Thông tin Job</div><div class="info-list"><div class="info-item"><div class="info-label">Mã Job ID</div><div class="info-value">— (job_id: null)</div></div><div class="info-item"><div class="info-label">Loại Job</div><div class="info-value">SwitchCE Initialize</div></div><div class="info-item"><div class="info-label">Khu vực / Chi nhánh</div><div class="info-value">MN · DNI</div></div><div class="info-item"><div class="info-label">Người tạo</div><div class="info-value">${ALLOCATION_RESPONSE.data.user_email}</div></div><div class="info-item"><div class="info-label">POP đích</div><div class="info-value">${ALLOCATION_RESPONSE.data.switch_ce_pop}</div></div><div class="info-item"><div class="info-label">Trạng thái</div><div class="info-value">${status(rule.label, rule.tone)}</div></div></div></div><div><div class="subsection-title">Tiến trình & thời gian</div><div class="timeline-mini">${timelineMarkup(rule)}</div></div></div></div></section>

      <section class="card control-card"><div class="control-inner"><div class="control-copy"><strong>Bảng điều khiển vận hành</strong><span>Thao tác mô phỏng — không gọi API hoặc thiết bị thật</span></div><div class="button-row">${buttonsMarkup(rule)}</div></div></section>

      <section class="card"><div class="card-header"><div class="section-title"><span class="section-icon">▦</span>Thông tin cấp phát</div><div class="status-line">${status(allocationLabel, allocationTone)}${allocationVisible ? `<span class="small-pill">56.9 giây</span>` : ""}</div></div>${allocationMarkup(activeCase.state)}</section>

      <div class="results-grid">
        <section class="card result-card"><div class="card-header"><div class="result-heading"><span class="result-icon">◈</span><strong>Kết quả precheck</strong></div>${status(precheck.badge, precheck.tone)}</div><div class="card-body">${precheck.body}</div></section>
        <section class="card result-card"><div class="card-header"><div class="result-heading"><span class="result-icon">⌁</span><strong>Kết quả cấu hình</strong></div>${status(config.badge, config.tone)}</div><div class="card-body">${config.body}</div></section>
      </div>

      <div class="prototype-note"><strong>Bản duyệt UI:</strong> dùng allocation thực tế lúc 15/09/2026 16:30:54. Các endpoint tích hợp: <code>${API_ENDPOINTS.allocate}</code>, <code>${API_ENDPOINTS.precheck}</code>, <code>${API_ENDPOINTS.config}</code>. Không chứa password factory hoặc FTP.</div>
    </main><div class="toast" id="toast" role="status" aria-live="polite"></div>`;

  let timer;
  document.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => {
    if (button.disabled) return;
    const messages = {
      allocate: "Cấp phát đang available trong case này. Bản review không gọi API.",
      precheck: "Precheck đang available trong case này. Bản review không chạm thiết bị.",
      config: "Config đang available trong case này. Bản review không chạm thiết bị.",
      cancel: "Hủy kế hoạch chỉ được mô phỏng trong bản review.",
      zoom: "Đây là thao tác phóng to mô phỏng của topology.",
      fit: "Topology đang được căn vừa trong khung hiển thị.",
      copy: "Đã mô phỏng sao chép run_id 7f934e8fc2bd4ef8b1bc9836c2e6d301.",
      refresh: "Dữ liệu review đã ở trạng thái mới nhất."
    };
    const toast = document.getElementById("toast");
    clearTimeout(timer);
    toast.textContent = messages[button.dataset.action] || "Thao tác mô phỏng.";
    toast.classList.add("show");
    timer = setTimeout(() => toast.classList.remove("show"), 2400);
  }));

  window.SWITCH_CE_INITIALIZE_UI_CONTRACT = API_ENDPOINTS;
  window.SWITCH_CE_INITIALIZE_ALLOCATION_RESPONSE = ALLOCATION_RESPONSE;
  window.SWITCH_CE_INITIALIZE_REVIEW_CASES = CASES;
})();
