/* Preserve original evidence; display only valid disagreements with CDP. */
((root)=>{
  'use strict';
  const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  const list=v=>Array.isArray(v)?v:[];
  const text=v=>v===null||v===undefined||v===''?'—':typeof v==='object'?JSON.stringify(v):String(v);
  const esc=v=>text(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sources={netauto_inventory:'Kho thiết bị NetAuto',olt_device:'Thiết bị trực tiếp',olt_snmp:'Đo quang từ thiết bị',olt_device_telemetry:'Đo quang tại PON yêu cầu',olt_target_telemetry:'Đo quang tại PON đích',systemradius_osp_contract_pon:'System Radius · Tọa độ theo MAC',systemradius_ipwan:'System Radius · IP đang hoạt động',csoc_radius_history:'CDP · Lịch sử PON',isc_system_radius:'System Radius · Tra khách theo MAC',isc_osp:'ISC · GetOSP',inside:'Inside · Phiên kết nối',csoc_contract_lookup:'CDP · Tra hợp đồng',csoc_radius:'CDP · Radius',csoc_contract:'CDP · PortNet',csoc_status:'CDP · Trạng thái',csoc_ipwan:'CDP · Địa chỉ kết nối',unavailable:'Chưa có nguồn'};
  const moves={moved_to_other_pon:'Chuyển PON · cùng thiết bị',moved_to_other_olt:'Chuyển thiết bị',online_same_pon_conflict:'Cùng PON · dữ liệu mâu thuẫn',online_location_unknown:'Đang kết nối · chưa rõ vị trí',recorded_elsewhere_but_offline:'Vị trí khác · không có phiên kết nối',confirmed_offline:'Đã xác nhận không có phiên kết nối',location_changed_unconfirmed:'Vị trí khác · chưa xác nhận kết nối',unconfirmed:'Chưa đủ bằng chứng',not_checked:'Chưa đối chiếu'};
  const customerGroups=['observed_on_requested_pon','confirmed_offline','online_elsewhere','unconfirmed'];
  const groupLabels={observed_on_requested_pon:'Có MAC/SN trên PON',confirmed_offline:'Khách hàng Offline',online_elsewhere:'Khách hàng kết nối nơi khác',unconfirmed:'Chưa đủ dữ liệu',conflicts:'Conflict data',unclassified:'Chưa phân loại'};
  const sourceLabel=v=>Object.hasOwn(sources,v)?sources[v]:text(v);
  const moveLabel=v=>Object.hasOwn(moves,v)?moves[v]:text(v);
  const validValue=v=>typeof v==='number'?Number.isFinite(v):typeof v==='string'&&!['','none','null','n/a','unknown','unavailable','unbound','chưa bind','—','-'].includes(v.trim().toLowerCase());
  function conflictDifferences(record){
    if(record.type==='multiple_contracts_for_mac')return [];
    return list(record.different_fields).filter(d=>{
      if(!object(d)||!validValue(d.device_value)||!validValue(d.csoc_value))return false;
      const origin=d.conflicting_source??list(record.sources).join(',');
      if(!String(origin).split(',').some(v=>/^(csoc(?:_|$)|cdp(?:_|$))/i.test(v.trim())))return false;
      const normalize=v=>String(v).trim().toUpperCase();
      const normalizeField=v=>['mac','onu_mac'].includes(d.field)?normalize(v).replace(/[:.\-\s]/g,''):normalize(v);
      return normalizeField(d.device_value)!==normalizeField(d.csoc_value);
    });
  }
  function location(v){
    if(!object(v))return '—';
    const port=v.port_name??v.port;
    return [v.olt_name??v.olt_ip,port!=null?`Port ${text(port)}`:null,v.slot!=null?`Slot ${text(v.slot)}`:null,v.onu_index!=null?`Index ${text(v.onu_index)}`:null].filter(x=>x!==null&&x!==undefined&&x!=='').join(' · ')||'—';
  }
  function parse(raw){
    const data=typeof raw==='string'?JSON.parse(raw):raw;
    if(!object(data)||typeof data.status!=='boolean'||!Object.hasOwn(data,'result'))throw Error('Cần phản hồi có status dạng boolean và result từ check-customer-of-pon.');
    if(data.result!==null&&!object(data.result))throw Error('result phải là đối tượng hoặc null.');
    const result=data.result;
    if(result){
      if(!object(result.olt)||!object(result.ports))throw Error('Thiếu thông tin olt hoặc ports trong kết quả.');
      if(!object(result.customers)||[...customerGroups,'conflicts'].some(key=>!Array.isArray(result.customers[key])))throw Error('Cần cấu trúc phẳng mới: observed_on_requested_pon, confirmed_offline, online_elsewhere, unconfirmed và conflicts. Không dùng online/offline cũ.');
      for(const rows of [...customerGroups.map(key=>result.customers[key]),result.customers.conflicts,result.unclassified_customers??[]])if(!Array.isArray(rows)||rows.some(row=>!object(row)))throw Error('Danh sách khách hàng và mâu thuẫn phải gồm các đối tượng hợp lệ.');
    }
    const conflicts=list(result?.customers?.conflicts).map((record,id)=>({id,record:{...record,different_fields:conflictDifferences(record)}})).filter(({record})=>record.different_fields.length),rows=[];
    for(const group of [...customerGroups,'unclassified'])for(const customer of list(group==='unclassified'?result?.unclassified_customers:result?.customers?.[group]))rows.push({id:rows.length,group,customer,conflicts:conflicts.filter(({record})=>matchesConflict(customer,record))});
    return {raw:data,result,rows,conflicts};
  }
  function matchesConflict(c,record){
    const normalize=(v,key)=>v==null?'':key==='mac'?String(v).replace(/[:.\-\s]/g,'').toUpperCase():String(v).trim().toUpperCase();
    const fields={mac:'onu_mac',serial:'onu_sn',contract:'contract'};
    const keys=Object.hasOwn(fields,record.matched_by)?[record.matched_by]:Object.keys(fields);
    return keys.some(key=>{const field=fields[key],a=normalize(c[field],key),b=normalize(record[field],key);return !!a&&!!b&&a===b;});
  }
  const hasConflict=c=>c.move_check?.location_conflict===true||list(c.move_check?.conflicts).length>0||c.move_check?.device_index_check?.identity_match===false;
  const rowHasConflict=row=>list(row.conflicts).length>0||hasConflict(row.customer);
  function filter(rows,{group='all',port='',move='',conflict=false,query=''}={}){
    const needle=query.trim().toLocaleLowerCase('vi');
    return rows.filter(row=>{
      const c=row.customer;
      return (group==='all'||row.group===group)&&(!port||text(c.requested_location?.port_name??c.port_name)===port)&&(!move||c.move_check?.status===move)&&(!conflict||rowHasConflict(row))&&(!needle||[JSON.stringify(c),JSON.stringify(row.conflicts),groupLabels[row.group],moveLabel(c.move_check?.status)].join(' ').toLocaleLowerCase('vi').includes(needle));
    });
  }
  function request(olt,ports){
    const name=olt.trim(),selected=[...new Set(String(ports).split(/[,;\r\n]+/).map(v=>v.trim()).filter(Boolean))];
    if(!name)throw Error('Nhập tên hoặc địa chỉ thiết bị.');
    if(!selected.length)throw Error('Nhập ít nhất một Port PON.');
    return {olt:name,pon_ports:selected};
  }
  function portCatalog(result,olt){
    const device=result?.olt||{},key=String(olt??'').trim().toLowerCase();
    const matches=!!key&&[device.input,device.olt_name,device.name,device.olt_ip,device.ip].some(v=>typeof v==='string'&&v.trim().toLowerCase()===key);
    if(!matches)return {matches:false,ports:[],kind:'unavailable'};
    const full=Array.isArray(result?.ports?.available_pon_ports);
    const ports=[...new Set(list(full?result.ports.available_pon_ports:result?.ports?.valid_ports).filter(v=>typeof v==='string'&&v.trim()).map(v=>v.trim()))];
    return {matches:true,ports,kind:full?'available':'validated'};
  }
  const api={object,list,text,esc,sources,moves,customerGroups,groupLabels,sourceLabel,moveLabel,location,parse,filter,request,hasConflict,rowHasConflict,matchesConflict,portCatalog};
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.NETAUTO_CUSTOMER_PON=api;
})(typeof window==='undefined'?null:window);
