/* Projection of recorded messages. No transport, control or driver-side rescaling. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NETAUTO_SMARTPOP_TELEMETRY=api;})(typeof window==='object'?window:globalThis,function(){
  'use strict';
  const labels={
    '01_0_OPMS_Gateway':'Bộ giám sát · Gateway','01_1_OPMS_Fans':'Quạt bộ giám sát',
    '02_0_OPMS_ACC_Status':'Trạng thái điều khiển tủ','02_1_OPMS_ACC_Config':'Cấu hình điều hòa',
    '02_2_OPMS_Air_Conditioner':'Điều hòa tủ','03_0_OPMS_Pop_Fan_Status':'Quạt thông gió POP',
    '04_0_OPMS_TEMPERATURE':'Nhiệt độ tủ','05_0_OPMS_INDOOR_HUMIDITY':'Độ ẩm trong tủ',
    '07_0_OPMS_Front_Door':'Cửa trước','07_1_OPMS_Side_Door':'Cửa bên hông',
    '08_0_OPMS_Front_Lamp':'Đèn trước','08_1_OPMS_Side_Lamp':'Đèn bên hông',
    '09_0_OPMS_AC_Main_Grid':'Điện lưới','09_1_OPMS_Generator':'Máy phát',
    '11_0_OPMS_Console':'Kết nối console','12_0_OPMS_SPD':'Chống sét lan truyền',
    '13_0_OPMS_ACCU_Vision_info':'Pin · VISION · Thông số','13_1_OPMS_ACCU_Vision_status':'Pin · VISION · Trạng thái','13_2_OPMS_ACCU_Vision_alarm':'Pin · VISION · Cảnh báo',
    '13_0_OPMS_ACCU_OSN_info':'Pin · OSN · Thông số','13_1_OPMS_ACCU_OSN_status':'Pin · OSN · Trạng thái','13_2_OPMS_ACCU_OSN_alarm':'Pin · OSN · Cảnh báo',
    '13_0_OPMS_ACCU_Coslight_info':'Pin · COSLIGHT · Thông số','13_1_OPMS_ACCU_Coslight_status':'Pin · COSLIGHT · Trạng thái','13_2_OPMS_ACCU_Coslight_alarm':'Pin · COSLIGHT · Cảnh báo'
  };
  const levels={0:{key:'normal',label:'Bình thường'},1:{key:'warning',label:'Cảnh báo'},2:{key:'critical',label:'Nghiêm trọng'}};
  function parse(input){
    let frames=input?.frames??input;
    if(typeof frames==='string')frames=frames.split(/\r?\n/).filter(l=>l.trim().startsWith('42[')).map(l=>JSON.parse(l.trim().split('\t')[0].slice(2)));
    if(!Array.isArray(frames)||!frames.length)throw new Error('Không có bản tin Socket.IO hợp lệ.');
    const latest=new Map();let accepted=0;
    for(const frame of frames){
      if(!Array.isArray(frame)||frame[0]!=='mqtt_message_response')continue;
      const envelope=frame[1],m=envelope?.message;
      if(typeof m?.cmd!=='string'||!m.contain||!Number.isFinite(m.ts)||m.ts<=0||!Number.isFinite(new Date(m.ts*1000).getTime()))throw new Error('Bản tin thiếu cmd/contain/ts hợp lệ.');
      const prev=latest.get(m.cmd);if(!prev||m.ts>=prev.ts)latest.set(m.cmd,m);accepted++;
    }
    if(!accepted)throw new Error('Không có mqtt_message_response hợp lệ.');
    const info=latest.get('OPMS_REPORT_INFO_POP'),runtime=latest.get('OPMS_REPORT_RS485_RUNTIME'),alarm=latest.get('OPMS_REPORT_ALARM');
    const rawSensor=latest.get('OPMS_REPORT_INFO_SENSOR'),sorted=latest.get('OPMS_REPORT_INFO_SENSOR_SORTED');
    const sensor=sorted&&(!rawSensor||sorted.ts>=rawSensor.ts)?sorted:rawSensor;
    const gateway=info?.contain.informations?.gateway,services=alarm?.contain.service_alarm??[];
    if(!Array.isArray(services)||runtime&&!Array.isArray(runtime.contain.rs485_devices))throw new Error('Danh sách cảnh báo/ngoại vi không hợp lệ.');
    const alarms=services.map(s=>{const level=levels[s.alarm_code]??{key:'unknown',label:'Chưa xác định'};return {source:s,label:labels[s.name]??String(s.name??'Dịch vụ chưa có tên'),level:level.key,levelLabel:level.label};});
    const counts={normal:0,warning:0,critical:0,unknown:0};for(const a of alarms)counts[a.level]++;
    const devices=runtime?.contain.rs485_devices??[],ids=new Set();
    for(const d of devices){if(!d||d.id==null||typeof d.model!=='string'||!Array.isArray(d.regs))throw new Error('Ngoại vi runtime thiếu id/model/regs.');const key=String(d.id)+'|'+d.model;if(ids.has(key))throw new Error('Ngoại vi runtime bị trùng.');ids.add(key);}
    return {source:input,accepted,latest,ip:gateway?.network?.IP??null,gateway,slave:info?.contain.informations?.slave,
      infoTs:info?.ts,deviceTs:runtime?.ts,sensorTs:sensor?.ts,alarmTs:alarm?.ts,consoleTs:latest.get('OPMS_REPORT_TOTAL_CONSOLE')?.ts,
      ts:Math.max(...[...latest.values()].map(m=>m.ts)),sensor:sensor?.contain,console:latest.get('OPMS_REPORT_TOTAL_CONSOLE')?.contain.console,
      devices,alarms,counts};
  }
  function device(snapshot,definition){return snapshot?.devices.find(d=>String(d.id)===String(definition.id)&&d.model===definition.model);}
  function disconnected(snapshot,d){return !!d&&snapshot.alarms.some(a=>String(a.source.msg).includes(String(d.name)+'-[ID:'+d.id+']_DISCONNECTED'));}
  function measurement(snapshot,definition,register){
    const d=device(snapshot,definition);
    if(!d)return {value:null,raw:null,kind:'missing',note:'Chưa có dữ liệu ngoại vi này.'};
    if(d.regs.length!==definition.registers.length)return {value:null,raw:null,kind:'missing',note:'Số thanh ghi không khớp cấu hình; chưa ghép giá trị.'};
    // Arrays follow configuration order, NOT rid: PINCOSLIGHT starts at rid=1.
    const raw=d.regs[Number(register.key)];
    if(disconnected(snapshot,d))return {value:null,raw,kind:'missing',note:'Backend báo ngoại vi mất kết nối.'};
    if(raw==null||raw===65535)return {value:null,raw,kind:'missing',note:raw===65535?'Mã 65535 · chưa xác nhận số đo hợp lệ.':'Chưa có giá trị.'};
    if(typeof raw==='number'&&!Number.isFinite(raw)||!['number','string','boolean'].includes(typeof raw))return {value:null,raw,kind:'missing',note:'Giá trị không hợp lệ.'};
    const suspect=raw===32767||(register.unit==='%'&&typeof raw==='number'&&(raw<0||raw>100))||(definition.model==='CAC'&&register.unit==='°C'&&raw===200);
    return {value:raw,raw,kind:suspect?'suspect':'reported',note:suspect?'Giá trị cần xác minh với driver; không dùng để kết luận sức khỏe thiết bị.':'Giá trị bản tin trả về; không áp dụng lại hệ số unit.'};
  }
  function status(snapshot,definition){const d=device(snapshot,definition);return !d?'Chưa có dữ liệu':disconnected(snapshot,d)?'Mất kết nối':d.connection_status===1?'Có dữ liệu':'Mã kết nối: '+String(d.connection_status);}
  function serviceState(snapshot,name,pattern){const a=snapshot?.alarms.find(a=>a.source.name===name),match=a&&String(a.source.msg).match(pattern);return {value:match?.[1]??null,source:a?.source,level:a?.level??'unknown'};}
  const formatTime=ts=>Number.isFinite(ts)?new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(ts*1000)):'—';
  return {parse,device,measurement,disconnected,status,serviceState,formatTime};
});
