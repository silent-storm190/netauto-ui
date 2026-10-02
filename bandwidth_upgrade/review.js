(() => {
  const allocations = [
    { device_name: "DI503089HCMP08901HS64", device_ip: "11.53.12.1", vendor: "HUAWEI", agg_port: "Eth-Trunk8", current_ports: ["XGigabitEthernet0/0/8", "XGigabitEthernet1/0/8"], new_ports: ["XGigabitEthernet0/0/34", "XGigabitEthernet1/0/34"] },
    { device_name: "CE502089HCMP48901HW48", device_ip: "11.53.42.81", vendor: "HUAWEI", agg_port: "Eth-Trunk16", current_ports: ["XGigabitEthernet0/0/23", "XGigabitEthernet0/0/24"], new_ports: ["XGigabitEthernet0/0/47", "XGigabitEthernet0/0/48"] }
  ];
  const cases = {
    created: { step: 0, allocation: "waiting", precheck: "waiting", config: "waiting", status: "MỚI TẠO", tone: "neutral" },
    allocation_success: { step: 1, allocation: "success", precheck: "waiting", config: "waiting", status: "ĐÃ CẤP PHÁT", tone: "success" },
    allocation_failed: { step: 0, allocation: "failed", precheck: "waiting", config: "waiting", status: "CẤP PHÁT THẤT BẠI", tone: "error" },
    precheck_failed: { step: 2, allocation: "success", precheck: "failed", config: "waiting", status: "PRECHECK KHÔNG ĐẠT", tone: "error" },
    precheck_success: { step: 2, allocation: "success", precheck: "success", config: "waiting", status: "ĐÃ PRECHECK", tone: "success" },
    config_failed: { step: 3, allocation: "success", precheck: "success", config: "failed", status: "CẤU HÌNH THẤT BẠI", tone: "error" },
    config_success: { step: 3, allocation: "success", precheck: "success", config: "success", status: "THÀNH CÔNG", tone: "success" }
  };
  const active = cases[document.body.dataset.case] || cases.config_failed;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const badge = (label, tone = "neutral") => `<span class="badge ${tone}">${esc(label)}</span>`;
  const port = (name, isNew = false) => `<span class="port ${isNew ? "new" : ""}">${esc(name)}</span>`;
  const deviceCard = (device, index) => `<article class="device-card ${index ? "accent" : ""}">
    <div class="device-head"><div><div class="device-name">${esc(device.device_name)}</div><div class="device-ip">${esc(device.device_ip)} · ${esc(device.vendor)}</div></div><span class="small-pill agg-label">${esc(device.agg_port)}</span></div>
    <div class="port-flow"><div class="port-box"><div class="port-label">Port hiện tại</div><div class="ports">${device.current_ports.map(p => port(p)).join("")}</div></div><div class="flow-arrow">›</div><div class="port-box new"><div class="port-label">Port mới cấp phát</div><div class="ports">${device.new_ports.map(p => port(p, true)).join("")}</div></div></div>
  </article>`;

  const allocationBody = () => {
    if (active.allocation === "waiting") return `<div class="empty-state"><div><span>i</span><strong>Chưa có dữ liệu cấp phát</strong><br>Thực hiện cấp phát để chọn port mới cho hai thiết bị.</div></div>`;
    if (active.allocation === "failed") return `<div class="empty-state"><div><span>!</span><strong>Không đủ port trống phù hợp</strong><br>Thiết bị CE502089HCMP48901HW48 thiếu 2 port 10G cùng loại.</div></div>`;
    return allocations.map(deviceCard).join("");
  };

  const precheckItems = [
    ["physical_link", "Tín hiệu vật lý", "4/4 port mới ở trạng thái UP"],
    ["reservation_description", "Giữ tài nguyên", "Description Tool-Bandwidth-Upgrade hợp lệ"],
    ["trunk_mode", "Cấu hình trunk", "Link-type trunk và rule VLAN 1 hợp lệ"],
    ["aggregation_free", "Kiểm tra aggregation", "Port chưa thuộc aggregation group khác"],
    ["transceiver_power", "Công suất quang", "4/4 transceiver có RX/TX trong ngưỡng"]
  ];
  const configItems = [
    ["DI503089HCMP08901HS64", "Eth-Trunk8", "XGE0/0/34, XGE1/0/34", true],
    ["CE502089HCMP48901HW48", "Eth-Trunk16", "XGE0/0/47, XGE0/0/48", active.config === "success"]
  ];
  const rows = (items, failedIndex = -1) => `<div class="check-list">${items.map((item, index) => {
    const failed = index === failedIndex;
    return `<div class="check-row ${failed ? "failed" : ""}"><span class="check-mark">${failed ? "×" : "✓"}</span><div><strong>${esc(item[1] || item[0])}</strong><p>${esc(item[2] || "")}</p></div></div>`;
  }).join("")}</div>`;
  const resultContent = kind => {
    const state = active[kind];
    if (state === "waiting") return `<div class="empty-state"><div><span>i</span><strong>Chưa thực hiện</strong><br>Kết quả sẽ hiển thị tại đây sau khi chạy ${kind === "precheck" ? "precheck" : "cấu hình"}.</div></div>`;
    if (kind === "precheck") {
      const failed = state === "failed";
      const items = failed ? precheckItems.map((x, i) => i === 4 ? [x[0], x[1], "CE502089HCMP48901HW48 · XGE0/0/48 không đọc được RX"] : x) : precheckItems;
      return `<div class="result-body"><div class="result-banner ${failed ? "error" : ""}">${failed ? "× Chưa đủ điều kiện nâng cấp bandwidth" : "✓ Đủ điều kiện nâng cấp bandwidth"}</div>${rows(items, failed ? 4 : -1)}<div class="compat-note">Nguồn: <b>pre_check.details.checks</b> · Legacy <b>pre_check.data</b> vẫn được giữ nguyên.</div></div>`;
    }
    const failed = state === "failed";
    const items = configItems.map(item => [item[0], `${item[0]} · ${item[1]}`, item[3] ? `${item[2]} · membership OK · Selected` : `${item[2]} · thiếu XGE0/0/48 trong ${item[1]}`]);
    return `<div class="result-body"><div class="result-banner ${failed ? "error" : ""}">${failed ? "× Cấu hình chưa hoàn tất trên cả hai thiết bị" : "✓ Cấu hình nâng cấp bandwidth thành công"}</div>${rows(items, failed ? 1 : -1)}<div class="compat-note">Nguồn: <b>result.details.verification</b> · Có riêng membership, oper status và Selected.</div></div>`;
  };

  const steps = [["Tạo kế hoạch", "Đã ghi nhận"], ["Cấp phát", "Chọn port"], ["Precheck", "Xác minh"], ["Cấu hình", "Join LACP"]];
  document.getElementById("app").innerHTML = `<div class="page">
    <header class="topbar"><button class="button" type="button">‹ <span>Quay lại danh sách Kế hoạch</span></button><button class="button" type="button">↻ <span>Tải lại</span></button><span class="plan-code">BW_UPG.2809260003</span></header>
    <main class="content">
      <section class="hero"><div><div class="eyebrow">Nâng cấp băng thông</div><h1>DI503089HCMP08901HS64 ↔ CE502089HCMP48901HW48</h1><p>Hai thiết bị · 2 liên kết mới · 10 Gbps mỗi liên kết</p></div>${badge(active.status, active.tone)}</section>
      <section class="card progress-wrap"><div class="progress">${steps.map((item, i) => `<div class="step ${i < active.step ? "done" : i === active.step ? "active" : ""}"><div class="step-dot">${i < active.step ? "✓" : i + 1}</div><strong>${item[0]}</strong><span>${item[1]}</span></div>`).join("")}</div></section>
      <section class="card"><header class="card-head"><div class="section-title"><span class="section-icon">▦</span><strong>Thông tin cấp phát</strong></div><div class="status-line">${active.allocation === "success" ? badge("ĐÃ CẤP PHÁT", "success") : active.allocation === "failed" ? badge("THẤT BẠI", "error") : badge("CHỜ CẤP PHÁT", "warning")}<span class="small-pill">56.9 giây</span></div></header><div class="allocation-grid"><div class="allocation-data">${allocationBody()}</div><div class="topology"><div class="topology-inner"><div class="topology-device"><strong>DI503089HCMP08901HS64</strong><span>11.53.12.1</span></div><div class="topology-agg">Eth-Trunk8 · 2 + 2 ports</div><div class="topology-links"><i class="topology-link"></i><i class="topology-link"></i></div><div class="topology-agg">Eth-Trunk16 · 2 + 2 ports</div><div class="topology-device bottom"><strong>CE502089HCMP48901HW48</strong><span>11.53.42.81</span></div></div></div></div></section>
      <div class="results-grid"><section class="card result-card"><header class="card-head"><div class="result-title"><span class="result-icon ${active.precheck === "failed" ? "error" : "success"}">${active.precheck === "failed" ? "×" : "✓"}</span><strong>Kết quả kiểm tra trước cấu hình</strong></div>${active.precheck === "success" ? badge("THÀNH CÔNG", "success") : active.precheck === "failed" ? badge("KHÔNG ĐẠT", "error") : badge("CHƯA CHẠY", "neutral")}</header>${resultContent("precheck")}</section>
      <section class="card result-card"><header class="card-head"><div class="result-title"><span class="result-icon ${active.config === "failed" ? "error" : "success"}">${active.config === "failed" ? "×" : "✓"}</span><strong>Kết quả cấu hình</strong></div>${active.config === "success" ? badge("THÀNH CÔNG", "success") : active.config === "failed" ? badge("THẤT BẠI", "error") : badge("CHƯA CHẠY", "neutral")}</header>${resultContent("config")}</section></div>
    </main></div>`;
})();
