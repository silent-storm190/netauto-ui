/* Read-only response projection. Never replace source counters or status. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NETAUTO_SERVICE_MODEL=api;})(typeof window==='object'?window:globalThis,function(){
  'use strict';
  const list=v=>Array.isArray(v)?v:[];
  const blank=v=>v==null||String(v).trim()==='';
  const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d').trim();
  const cache=new WeakMap();
  function flags(o){
    const out=[];
    if(blank(o.onu_ipwan))out.push({key:'ip',label:'Thiếu IP WAN'});
    else if(String(o.onu_ipwan).trim()==='0.0.0.0')out.push({key:'ip',label:'IP WAN 0.0.0.0'});
    if(blank(o.contract))out.push({key:'data',label:'Thiếu hợp đồng'});
    if(blank(o.drop_point))out.push({key:'data',label:'Thiếu tập điểm'});
    if(blank(o.net_status))out.push({key:'data',label:'Thiếu trạng thái HĐ'});
    else if(normalize(o.net_status)!=='binh thuong')out.push({key:'contract',label:'HĐ: '+String(o.net_status)});
    return out;
  }
  function validate(d){
    if(!d||typeof d!=='object'||Array.isArray(d)||typeof d.status!=='boolean')return 'Response phải là object có status kiểu boolean.';
    if(!['OLT','SWITCH_CE'].includes(d.device_type))return 'Chỉ hỗ trợ response OLT hoặc SWITCH_CE theo format hiện tại.';
    if(d.result!=null&&(typeof d.result!=='object'||Array.isArray(d.result)))return 'result phải là object hoặc null.';
    const r=d.result||{};
    if(d.device_type==='OLT'&&r.ports!=null){
      if(!Array.isArray(r.ports)||r.ports.some(p=>!p||typeof p!=='object'||typeof p.port!=='string'||(p.onu_data!=null&&(!Array.isArray(p.onu_data)||p.onu_data.some(o=>!o||typeof o!=='object'||Array.isArray(o))))))return 'Cấu trúc ports / onu_data không hợp lệ.';
      const fields=['onu_id','contract','net_status','drop_point','onu_ipwan','onu_sn','onu_mac','onu_model','onu_rx','onu_tx','onu_temp','onu_olt_distance'];
      if(r.ports.some(p=>list(p.onu_data).some(o=>fields.some(k=>o[k]!=null&&!['string','number'].includes(typeof o[k])))))return 'Trường thông số ONU phải là chuỗi, số hoặc null.';
    }
    if(d.device_type==='OLT'&&r.multicast!=null){
      const m=r.multicast;if(typeof m!=='object'||Array.isArray(m))return 'multicast phải là object hoặc null.';
      if(m.checks!=null&&(typeof m.checks!=='object'||Array.isArray(m.checks)||Object.values(m.checks).some(v=>!v||typeof v!=='object'||Array.isArray(v))))return 'Cấu trúc checks multicast không hợp lệ.';
    }
    if(d.device_type==='SWITCH_CE'&&r.checks!=null){
      if(typeof r.checks!=='object'||Array.isArray(r.checks))return 'checks phải là object.';
      for(const c of Object.values(r.checks)){
        if(!c||typeof c!=='object'||Array.isArray(c))return 'Hạng mục checks không hợp lệ.';
        for(const key of ['ports','trunks','matched','missing','neighbors'])if(c[key]!=null&&!Array.isArray(c[key]))return 'Danh sách trong checks không hợp lệ.';
        for(const key of ['ports','trunks'])if(list(c[key]).some(v=>!v||typeof v!=='object'||Array.isArray(v)))return 'Bản ghi check port / trunk không hợp lệ.';
        if(list(c.trunks).some(t=>t.members!=null&&(!Array.isArray(t.members)||t.members.some(m=>!m||typeof m!=='object'||Array.isArray(m)))))return 'Bản ghi member LACP không hợp lệ.';
      }
    }
    return null;
  }
  function index(d){
    if(cache.has(d))return cache.get(d);
    const ports=[],rows=[];
    for(const [pi,p] of list(d.result?.ports).entries()){
      const projected={source:p,id:pi,name:p.port,text:normalize(p.port),rows:[],attention:0};
      for(const [oi,o] of list(p.onu_data).entries()){
        const f=flags(o),row={source:o,port:projected,uid:pi+':'+oi,position:oi,flags:f,text:normalize([p.port,...Object.values(o).filter(v=>v==null||typeof v!=='object')].join(' '))};
        projected.rows.push(row);rows.push(row);if(f.length)projected.attention++;
      }
      ports.push(projected);
    }
    const signals={any:0,ip:0,data:0,contract:0};
    for(const row of rows){if(row.flags.length)signals.any++;for(const key of ['ip','data','contract'])if(row.flags.some(f=>f.key===key))signals[key]++;}
    const out={ports,rows,signals};cache.set(d,out);return out;
  }
  function filter(data,options={}){
    const query=normalize(options.query),attention=options.attention||'all',oper=options.oper||'all',scope=Number.isInteger(options.scope)?options.scope:null;
    const rows=[],ports=[];
    for(const port of data.ports){
      if(scope!=null&&scope!==port.id||oper!=='all'&&port.source.oper_stt!==oper)continue;
      const selected=port.rows.filter(row=>(!query||row.text.includes(query))&&(attention==='all'||attention==='any'&&row.flags.length||row.flags.some(f=>f.key===attention)));
      if(selected.length||!query&&attention==='all'||query&&attention==='all'&&port.text.includes(query)){ports.push({port,rows:selected});rows.push(...selected);}
    }
    return {ports,rows};
  }
  function paginate(rows,page=0,size=25){size=[8,12,24,25,48,50,100].includes(Number(size))?Number(size):25;const pages=Math.max(1,Math.ceil(rows.length/size)),current=Math.min(Math.max(0,Number.isInteger(page)?page:0),pages-1),start=current*size;return {rows:rows.slice(start,start+size),page:current,pages,start,total:rows.length,size};}
  const columns=[
    {key:'pon',label:'PON',value:r=>r.port.name},{key:'onu_id',label:'ONU index',value:r=>r.source.onu_id},
    {key:'contract',label:'Hợp đồng',group:'customer',value:r=>r.source.contract},{key:'net_status',label:'Trạng thái HĐ',group:'customer',value:r=>r.source.net_status},{key:'drop_point',label:'Tập điểm',group:'customer',value:r=>r.source.drop_point},{key:'onu_ipwan',label:'IP WAN',group:'customer',value:r=>r.source.onu_ipwan},
    {key:'onu_sn',label:'Serial ONU',group:'identity',value:r=>r.source.onu_sn},{key:'onu_mac',label:'MAC ONU',group:'identity',value:r=>r.source.onu_mac},{key:'onu_model',label:'Model',group:'identity',value:r=>r.source.onu_model},
    {key:'onu_rx',label:'RX (dBm)',group:'optics',numeric:true,value:r=>r.source.onu_rx},{key:'onu_tx',label:'TX (dBm)',group:'optics',numeric:true,value:r=>r.source.onu_tx},
    {key:'onu_temp',label:'Nhiệt độ (°C)',group:'operation',numeric:true,value:r=>r.source.onu_temp},{key:'onu_olt_distance',label:'OLT–ONU (m)',group:'operation',numeric:true,value:r=>r.source.onu_olt_distance},
    {key:'attention',label:'Chú ý khách hàng',value:r=>r.flags.map(f=>f.label).join('; ')}
  ];
  function csv(rows,groups={}){
    const selected=columns.filter(c=>!c.group||groups[c.group]!==false);
    const quote=v=>{let s=String(v??'');if((/^[\s]*[=+@-]/.test(s)&&!/^\s*-?\d+(?:\.\d+)?\s*$/.test(s))||/^[\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
    return '\uFEFF'+[selected.map(c=>quote(c.label)).join(','),...rows.map(row=>selected.map(c=>quote(c.value(row))).join(','))].join('\r\n');
  }
  return {list,blank,normalize,flags,validate,index,filter,paginate,columns,csv};
});
