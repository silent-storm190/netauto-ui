/* SmartPOP configuration projection. Register definitions are not telemetry. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NETAUTO_SMARTPOP_MODEL=api;})(typeof window==='object'?window:globalThis,function(){
  'use strict';
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').trim().toLowerCase().replace(/[_().%\s]+/g,' ').replace(/\s+/g,' ').trim();
  const translations=new Map(Object.entries({
    'Total_Voltage':'Điện áp tổng','Pack_Voltage':'Điện áp bộ pin','CH(A)':'Dòng sạc','DCH(A)':'Dòng xả',
    'Rated capacity':'Dung lượng định mức','Remaning capacity':'Dung lượng còn lại','Remaining capacity':'Dung lượng còn lại',
    'SOC':'Mức sạc (SOC)','SOH':'Sức khỏe pin (SOH)','T_max':'Nhiệt độ cao nhất','T_min':'Nhiệt độ thấp nhất',
    'Cell_V_max':'Điện áp cell cao nhất','Cell_V_min':'Điện áp cell thấp nhất','Battery mode':'Chế độ pin',
    'backupTIME':'Thời gian dự phòng','100% DOD CH_CYCLE':'Số chu kỳ sạc · DoD 100%','100% DOD DCH_CYCLE':'Số chu kỳ xả · DoD 100%',
    'Voltage of pack':'Điện áp bộ pin','Current':'Dòng điện','BMS cooling fin temperature':'Nhiệt độ tản nhiệt BMS',
    'The maximum cell temperature':'Nhiệt độ cell cao nhất','Battery cycle counts':'Số chu kỳ pin','Full charge Capacity':'Dung lượng khi sạc đầy',
    'Module Remaining AH':'Dung lượng còn lại của module','Status':'Trạng thái','Warning':'Cảnh báo','Protection':'Bảo vệ',
    'Battery module internal temperature':'Nhiệt độ bên trong module pin','Max charging Current Limit':'Giới hạn dòng sạc tối đa',
    'Error Code':'Mã lỗi','Full charge Capacity(Unit AH)':'Dung lượng khi sạc đầy (Ah)',
    'The maximum charging current':'Dòng sạc tối đa','The maximum discharging current':'Dòng xả tối đa',
    'Short circuit protection current':'Dòng bảo vệ ngắn mạch','Protection charging Current':'Dòng bảo vệ khi sạc',
    'Protection discharging Current':'Dòng bảo vệ khi xả','Battery Model':'Model pin','BMS Version':'Phiên bản BMS','Manufacturer':'Nhà sản xuất',
    'Enviroment hight alarm':'Cảnh báo nhiệt độ môi trường cao','Enviroment low alarm':'Cảnh báo nhiệt độ môi trường thấp',
    'Enviroment hight Protection':'Bảo vệ nhiệt độ môi trường cao','Enviroment low Protection':'Bảo vệ nhiệt độ môi trường thấp',
    'Total voltage OV Alarm':'Cảnh báo quá áp tổng','Total voltage UV Alarm':'Cảnh báo thấp áp tổng',
    'Total voltage OV Protection':'Bảo vệ quá áp tổng','Total voltage UV Protection':'Bảo vệ thấp áp tổng',
    'SOC_Low Alarm':'Cảnh báo mức sạc thấp','Short Circuit Protection':'Bảo vệ ngắn mạch','FUSE cut off Alarm':'Cảnh báo cầu chì ngắt',
    'MOSFET_OT_ Alarm Main circuit board high temperature alarm 20171219':'Cảnh báo quá nhiệt mạch MOSFET',
    'MOSFET_OT_Protection':'Bảo vệ quá nhiệt MOSFET','Too much difference of voltage alarm':'Cảnh báo chênh lệch điện áp cell lớn',
    'Temperature sensor break':'Lỗi cảm biến nhiệt độ','Software version':'Phiên bản phần mềm','Unit running status':'Trạng thái vận hành',
    'Internal fan status':'Trạng thái quạt trong','External fan status':'Trạng thái quạt ngoài','Compressor status':'Trạng thái máy nén',
    'Heater status':'Trạng thái bộ sưởi','Emergency fan status':'Trạng thái quạt khẩn cấp',
    'Evaporator Temp':'Nhiệt độ dàn bay hơi','Outdoor Temp':'Nhiệt độ ngoài tủ','Condenser Temp':'Nhiệt độ dàn ngưng',
    'Indoor Temp':'Nhiệt độ trong tủ','Humidity':'Độ ẩm','Discharge Temp':'Nhiệt độ đường đẩy',
    'AC running current':'Dòng vận hành điều hòa','AC input voltage':'Điện áp AC đầu vào','DC input voltage':'Điện áp DC đầu vào',
    'High Temp. alarm':'Cảnh báo nhiệt độ cao','Low Temp. alarm':'Cảnh báo nhiệt độ thấp','High humidity alarm':'Cảnh báo độ ẩm cao',
    'Low humidity alarm':'Cảnh báo độ ẩm thấp','Coil freeze protection':'Bảo vệ đóng băng dàn lạnh',
    'High exhaust Temp. alarm':'Cảnh báo nhiệt độ đường đẩy cao','Evaporator Temp. sensor failure':'Lỗi cảm biến nhiệt độ dàn bay hơi',
    'Outdoor Temp. sensor failure':'Lỗi cảm biến nhiệt độ ngoài tủ','Condenser Temp. sensor failure':'Lỗi cảm biến nhiệt độ dàn ngưng',
    'Indoor Temp. sensor failure':'Lỗi cảm biến nhiệt độ trong tủ','Exhaust Temp sensor failure':'Lỗi cảm biến nhiệt độ đường đẩy',
    'Humidity sensor failure':'Lỗi cảm biến độ ẩm','Internal fan failure alarm':'Cảnh báo lỗi quạt trong',
    'External fan failure alarm':'Cảnh báo lỗi quạt ngoài','Compressor failure alarm':'Cảnh báo lỗi máy nén',
    'Heater failure alarm':'Cảnh báo lỗi bộ sưởi','Emergency fan failure alarm':'Cảnh báo lỗi quạt khẩn cấp',
    'HP. alarm':'Cảnh báo áp suất cao (HP)','LP. alarm':'Cảnh báo áp suất thấp (LP)','Water alarm':'Cảnh báo nước',
    'Fire alarm':'Cảnh báo cháy','HP. lock':'Khóa do áp suất cao (HP)','LP. lock':'Khóa do áp suất thấp (LP)',
    'High exhaust Temp. lock':'Khóa do nhiệt độ đường đẩy cao','AC over voltage alarm':'Cảnh báo quá áp AC',
    'AC under voltage alarm':'Cảnh báo thấp áp AC','AC power supply failure':'Lỗi nguồn AC','Lose phase alarm':'Cảnh báo mất pha',
    'Freq. Fault':'Lỗi tần số','Anti phase alarm':'Cảnh báo đảo pha','DC over voltage alarm':'Cảnh báo quá áp DC',
    'DC under voltage alarm':'Cảnh báo thấp áp DC','Refrigeration stop point':'Điểm dừng làm lạnh',
    'Refrigeration band':'Dải điều chỉnh làm lạnh','Heating stop point':'Điểm dừng sưởi','Heating band':'Dải điều chỉnh sưởi',
    'Reserve':'Dự phòng','High Temp. point':'Ngưỡng nhiệt độ cao','Low Temp. point':'Ngưỡng nhiệt độ thấp',
    'High humidity point':'Ngưỡng độ ẩm cao','Internal fan stop point':'Điểm dừng quạt trong','Remote control':'Điều khiển từ xa',
    'Volt L-N':'Điện áp pha – trung tính','Power Factor':'Hệ số công suất','Frequency':'Tần số','Active Power':'Công suất tác dụng','Total Power':'Điện năng tích lũy'
  }).map(([key,value])=>[norm(key),value]));
  function label(reg){
    const raw=String(reg.rdescription||reg.name||'Thông số chưa có tên').trim(),key=norm(raw);if(translations.has(key))return translations.get(key);
    let m=key.match(/^cell (voltage|temperature) (\d+)$/);if(m)return (m[1]==='voltage'?'Điện áp':'Nhiệt độ')+' cell '+m[2];
    m=key.match(/^(?:4 )?t ([1-4]) dch ut protection$/);if(m)return 'Bảo vệ nhiệt độ thấp khi xả · T'+m[1];
    m=key.match(/^(bb|cell) (ch |dch )?(ov|uv|ot|ut|oc) (alarm|protection)$/);if(m){const issue={ov:'quá áp',uv:'thấp áp',ot:'quá nhiệt',ut:'nhiệt độ thấp',oc:'quá dòng'}[m[3]],phase=m[2]?.trim()==='ch'?' khi sạc':m[2]?' khi xả':'';return (m[4]==='alarm'?'Cảnh báo ':'Bảo vệ ')+issue+' '+(m[1]==='cell'?'cell':'khối pin')+phase;}
    m=key.match(/^(low|over) (cell )?voltage (warning|protection(?: recovery)?) data$/);if(m)return 'Ngưỡng '+(m[3].includes('recovery')?'khôi phục bảo vệ ':m[3]==='warning'?'cảnh báo ':'bảo vệ ')+(m[1]==='low'?'thấp áp':'quá áp')+(m[2]?' cell':'');
    m=key.match(/^(protect|warn|release) (charge|discharge|dischare) (ut|ot)$/);if(m)return 'Ngưỡng '+({protect:'bảo vệ',warn:'cảnh báo',release:'khôi phục'})[m[1]]+' '+(m[3]==='ut'?'nhiệt độ thấp':'quá nhiệt')+' khi '+(m[2]==='charge'?'sạc':'xả');
    return raw; // Unknown/ambiguous descriptions stay verbatim, never guessed.
  }
  function registerGroup(model,rid){
    const id=Number(rid);if(rid==null||!Number.isFinite(id)||id<0)return 'other';if(model==='PINCOSLIGHT')return id>=32?'alarms':id>=17?'cells':'main';
    if(model==='PINVISION')return id>=63?'identity':id>=34?'settings':id>=30&&id<=32||id>=12&&id<=26?'cells':'main';
    if(model==='CAC')return id>=49?'settings':id>=16?'alarms':'main';
    return model==='ENTES_1P'?'main':'other';
  }
  const groupLabels={overview:'Tổng quan',main:'Thông số chính',cells:'Cell pin',alarms:'Cảnh báo & bảo vệ',settings:'Tham số cấu hình',identity:'Định danh',other:'Thông số khác',all:'Tất cả thanh ghi'};
  const featured={PINCOSLIGHT:[1,6,7,8,9,14],PINVISION:[0,1,3,6,7,8],CAC:[1,7,8,9,10,11,13],ENTES_1P:[0,1,2,3,4,5]};
  const unit=value=>['NA','',null,undefined].includes(value)?'—':value==='*C'?'°C':value==='H'?'h':String(value);
  function parse(payload){
    if(!payload||!Array.isArray(payload.data))throw new Error('Payload cấu hình phải có data là mảng.');
    const keys=new Set();return payload.data.map((record,ri)=>{
      if(!record||record.opmsId==null)throw new Error('Thiếu opmsId ở bản ghi '+(ri+1)+'.');
      const key=String(record.opmsId);if(keys.has(key))throw new Error('Trùng opmsId '+key+'.');keys.add(key);
      let devices=record.used_devices;if(typeof devices==='string'){try{devices=JSON.parse(devices);}catch{throw new Error('used_devices của OPMS '+key+' không phải JSON hợp lệ.');}}
      if(!Array.isArray(devices))throw new Error('used_devices của OPMS '+key+' phải là mảng.');
      const projected=devices.map((d,index)=>{
        if(!d||!Array.isArray(d.regs))throw new Error('Thiếu định nghĩa regs ở thiết bị '+(index+1)+'.');
        const registers=d.regs.map((r,position)=>{
          if(!r||typeof r!=='object'||Array.isArray(r))throw new Error('Thanh ghi không hợp lệ ở '+String(d.name||index)+'.');
          return {source:r,key:String(position),code:String(r.name??('reg'+r.rid)),label:label(r),group:registerGroup(d.model,r.rid),unit:unit(r.runit)};
        });
        return {source:d,key:String(index),id:d.id,name:String(d.name||d.model||'Thiết bị chưa có tên'),model:String(d.model||d.model_name||'Chưa rõ'),kind:String(d.model||'').startsWith('PIN')?'battery':d.model==='CAC'?'cooling':d.model==='ENTES_1P'?'energy':'other',registers};
      });
      return {source:record,opmsId:record.opmsId,id:record.id,devices:projected,registerCount:projected.reduce((n,d)=>n+d.registers.length,0)};
    });
  }
  function rows(device,{group='main',query=''}={}){const q=norm(query);return device.registers.filter(r=>(group==='all'||group==='overview'&&(featured[device.model]?.includes(Number(r.source.rid))??r.group==='main')||r.group===group)&&(!q||norm([r.label,r.code,r.source.rdescription,r.source.addr].join(' ')).includes(q)));}
  return {parse,label,unit,rows,norm,groupLabels};
});
