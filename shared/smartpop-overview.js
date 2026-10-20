/* Read-only presentation of a recorded capture, not a live health dashboard. */
(()=>{
  'use strict';
  const T=window.NETAUTO_SMARTPOP_TELEMETRY,esc=v=>String(v??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const time=ts=>`<time>${esc(T.formatTime(ts))}</time>`;
  function icon(key){
    const paths={
      temperature:'<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z"/><path d="M12 9v8"/><circle cx="12" cy="18" r="1"/>',
      humidity:'<path d="M12 3s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11Z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
      fan:'<circle cx="12" cy="12" r="2"/><path d="M11 10C5 9 6 3 10 4c3 0 4 3 3 6M14 11c1-6 7-5 6-1 0 3-3 4-6 3M13 14c6 1 5 7 1 6-3 0-4-3-3-6M10 13c-1 6-7 5-6 1 0-3 3-4 6-3"/>',
      infrastructure:'<path d="M5 21V4h14v17M3 21h18M9 8h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1"/>',
      door:'<path d="M5 21V3h14v18M3 21h18M15 12h.01"/>',
      lamp:'<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 .8-1 2-1 2H9s0-1.2-1-2Z"/>',
      power:'<path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z"/>',
      generator:'<rect x="4" y="7" width="16" height="12" rx="2"/><path d="M8 7V4h8v3m-9 9h3m-3-4h3m5-1 2 3-2 3M7 19v2m10-2v2"/>',
      shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9S4 17 4 12V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
      peripherals:'<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 7.5h.01M7 17h.01m4-9.5h6m-6 9.5h6"/>',
      battery:'<rect x="3" y="6" width="17" height="12" rx="2"/><path d="M20 10h2v4h-2M7 12h6m-3-3v6"/>',
      cooling:'<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9 5l3 3 3-3M9 19l3-3 3 3M4.5 11l4-1-1-4M19.5 13l-4 1 1 4M7.5 18l1-4-4-1M16.5 6l-1 4 4 1"/>',
      energy:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="m13 7-5 6h4l-1 4 5-6h-4l1-4Z"/>',
      mode:'<path d="M4 7h9m4 0h3M4 17h3m4 0h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[key]||paths.infrastructure}</svg>`;
  }
  // A visual temperature ramp, not a device alarm threshold or health verdict.
  function temperatureTile(value,index){
    const valid=typeof value==='number'&&Number.isFinite(value)&&value!==255&&value!==65535;
    const hue=valid?(148-126*Math.max(0,Math.min(1,(value-35)/10))).toFixed(1):null;
    const hint='temperature['+index+'] · raw='+String(value)+' · Màu chuyển xanh → cam trong dải 35–45 °C để gợi nhiệt độ; không phải ngưỡng cảnh báo.';
    return `<div class="sp-temperature-tile" data-sp-temperature-tone="${valid?'scaled':'unknown'}"${valid?' style="--sp-temperature-hue:'+hue+'"':''} title="${esc(hint)}"><span class="sp-temperature-label">T${index+1}</span><b>${valid?esc(value):'—'}</b><small>°C</small></div>`;
  }
  function overview(s,peripherals='',sourceTitle=''){
    const a=s.sensor,temps=Array.isArray(a?.temperature)?a.temperature:[],fans=Array.isArray(a?.rps_fan_pop)?a.rps_fan_pop:[];
    const stats=[['normal','✓','Bình thường'],['warning','!','Cảnh báo'],['critical','!','Nghiêm trọng'],['unknown','?','Chưa xác định']];
    const statusSpecs=[
      ['Cửa trước','07_0_OPMS_Front_Door',/FRONT_DOOR_(CLOSED|OPEN)/,{CLOSED:'Đóng',OPEN:'Mở'},'door'],
      ['Cửa bên hông','07_1_OPMS_Side_Door',/SIDE_DOOR_(CLOSED|OPEN)/,{CLOSED:'Đóng',OPEN:'Mở'},'door'],
      ['Đèn trước','08_0_OPMS_Front_Lamp',/FRONT_LAMP:\s*(ON|OFF)/,{ON:'Bật',OFF:'Tắt'},'lamp'],
      ['Đèn bên hông','08_1_OPMS_Side_Lamp',/SIDE_LAMP:\s*(ON|OFF)/,{ON:'Bật',OFF:'Tắt'},'lamp'],
      ['Điện lưới','09_0_OPMS_AC_Main_Grid',/MAIN_GRID:\s*(CONNECTED|DISCONNECTED)/,{CONNECTED:'Có kết nối',DISCONNECTED:'Mất kết nối'},'power'],
      ['Máy phát','09_1_OPMS_Generator',/GEN_1:\s*(ON|OFF)/,{ON:'Bật',OFF:'Tắt'},'generator'],
      ['Chống sét','12_0_OPMS_SPD',/SPD:\s*(OK|NOK)/,{OK:'Bình thường',NOK:'Cần kiểm tra'},'shield'],
      ['Chế độ','02_0_OPMS_ACC_Status',/CONTROL_MODE:\s*(AUTO|MANUAL)/,{AUTO:'Tự động',MANUAL:'Thủ công'},'mode']
    ];
    const states=statusSpecs.map(([label,key,re,values,mark])=>{
      const r=T.serviceState(s,key,re);
      const tone=mark==='mode'?(r.value?'info':'muted'):r.level==='critical'||r.level==='warning'?r.level:['CLOSED','CONNECTED','OK'].includes(r.value)?'normal':r.value==='OFF'||!r.value?'muted':'info';
      return `<div class="sp-infra-tile" data-sp-state="${tone}" title="${esc(key+' · '+(r.source?.msg??'Chưa có dữ liệu'))}"><dt><span class="sp-infra-icon">${icon(mark)}</span>${label}</dt><dd class="sp-state-tag sp-state-${tone}">${esc(values[r.value]??'—')}</dd></div>`;
    }).join('');
    return `<div class="sp-snapshot-context"><div><b title="${esc(sourceTitle||'gateway.network.IP')}" aria-label="${esc(sourceTitle||s.ip)}">${esc(s.ip)}</b><span title="gateway.hw_version / gateway.fw_version">${esc(s.gateway?.hw_version)} · FW ${esc(s.gateway?.fw_version)}</span><span title="slave.hw_version / slave.fw_version">Slave ${esc(s.slave?.hw_version)} · FW ${esc(s.slave?.fw_version)}</span></div><span>Giờ Việt Nam · thời gian do thiết bị báo</span></div>
      <div class="sp-health-strip" aria-label="Thống kê dịch vụ backend">${stats.map(([key,mark,label])=>`<button type="button" class="sp-health-stat sp-tone-${key}" data-sp-alarm-open="${key}" aria-haspopup="dialog" aria-controls="smartpopAlarmDialog" aria-label="Xem chi tiết ${label.toLowerCase()}: ${s.alarmTs?s.counts[key]:'chưa có dữ liệu'} dịch vụ"><span class="sp-health-icon" aria-hidden="true">${mark}</span><b>${s.alarmTs?s.counts[key]:'—'}</b><span>${label}</span></button>`).join('')}</div>
      <div class="sp-overview-grid${peripherals?' sp-monitor-strip':''}"><section class="sp-overview-card sp-environment"><header><h3><span class="sp-section-icon">${icon('temperature')}</span>Môi trường tủ</h3><span title="OPMS_REPORT_INFO_SENSOR / temperature / humidity">Cảm biến</span></header><div class="sp-temperatures">${temps.map(temperatureTile).join('')||'<p>Chưa có số đo.</p>'}</div><div class="sp-inline-reading"><span title="humidity[0]"><span class="sp-humidity-icon">${icon('humidity')}</span>Độ ẩm</span><b>${esc(a?.humidity?.[0]>=0&&a.humidity[0]<=100?a.humidity[0]:'—')} <small>%</small></b></div><footer>${time(s.sensorTs)}</footer></section>
      <section class="sp-overview-card sp-ventilation"><header><h3><span class="sp-section-icon">${icon('fan')}</span>Quạt thông gió</h3><span title="rps_fan_pop / control_fan_pop">RPS · mức điều khiển</span></header><div class="sp-fan-list">${fans.map((v,i)=>`<div class="sp-fan-tile ${v===0?'sp-fan-zero':''}" title="rps_fan_pop[${i}] / control_fan_pop[${i}]"><span class="sp-fan-icon">${icon('fan')}</span><span>Quạt ${i+1}</span><b>${esc(v===65535?'—':v)} <small>RPS</small></b><span class="sp-fan-level">${esc(a?.control_fan_pop?.[i]??'—')}%</span></div>`).join('')||'<p>Chưa có số đo.</p>'}</div><footer>${time(s.sensorTs)}</footer></section>
      <section class="sp-overview-card sp-facilities"><header><h3><span class="sp-section-icon">${icon('infrastructure')}</span>Trạng thái hạ tầng</h3><span>Từ dịch vụ backend</span></header><dl class="sp-infrastructure">${states}</dl><footer>${time(s.alarmTs)}</footer></section>${peripherals}</div>
`;
  }
  function valueCell(snapshot,device,reg){const r=T.measurement(snapshot,device,reg),value=r.value==null?'—':typeof r.value==='boolean'?(r.value?'Có':'Không'):String(r.value);return `<td class="sp-value ${r.kind==='missing'?'sp-unmeasured':r.kind==='suspect'?'sp-suspect-value':'sp-reported-value'}" title="${esc(r.note+' · raw='+String(r.raw))}"${r.kind==='missing'?' aria-label="Chưa có giá trị đo"':''}>${esc(value)}${reg.unit!=='—'?` <span class="sp-inline-unit" title="runit: ${esc(reg.source.runit)}">${esc(reg.unit)}</span>`:''}${r.kind==='suspect'?'<small class="sp-quality-tag">Cần xác minh</small>':''}</td>`;}
  window.NETAUTO_SMARTPOP_PRESENTATION={overview,valueCell,icon};
})();
