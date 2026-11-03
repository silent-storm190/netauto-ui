/* Read-only response projection. Never replace source counters or status. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('../shared/customer-status.js'):root.NETAUTO_CUSTOMER_STATUS);if(typeof module==='object'&&module.exports)module.exports=api;else root.NETAUTO_SERVICE_MODEL=api;})(typeof window==='object'?window:globalThis,function(customerStatus){
  'use strict';
  const list=v=>Array.isArray(v)?v:[];
  const blank=v=>v==null||['','none','null','n/a','—','-'].includes(String(v).trim().toLowerCase());
  const contractStatus=customerStatus.format;
  const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d').trim();
  const scalar=v=>typeof v==='string'||typeof v==='number'?String(v).trim():'';
  function onuLayout(columns,availableWidth){
    const weights={net_status:1,drop_point:1.6,onu_sn:1,onu_mac:1.2,onu_model:1.2,attention:1};
    const minimumWidth=columns.reduce((sum,c)=>sum+c.width,0),width=Math.max(minimumWidth,Math.floor(Number(availableWidth))||0);
    const flexible=columns.filter(c=>weights[c.key]),totalWeight=flexible.reduce((sum,c)=>sum+weights[c.key],0);
    let remainder=width-minimumWidth;
    const extra=remainder;
    return {width,minimumWidth,columns:columns.map(c=>{
      const share=weights[c.key]?(c===flexible.at(-1)?remainder:Math.floor(extra*weights[c.key]/totalWeight)):0;
      remainder-=share;
      return {key:c.key,width:c.width+share};
    })};
  }
  function deviceContext(d,inventory={}){
    const r=d?.result||{},meta=inventory&&typeof inventory==='object'&&!Array.isArray(inventory)?inventory:{};
    const type=scalar(d?.device_type||r.device_type||meta.deviceType).toUpperCase();
    const roleText=scalar(r.function||meta.function).toUpperCase(),tokens=roleText.split(/[^A-Z0-9]+/);
    const role=type==='OLT'?'OLT':type==='SWITCH_CE'?'CE':type==='SWITCH_DI'?'DI':tokens.includes('CE')?'CE':tokens.includes('DI')?'DI':null;
    const rawTopology=scalar(meta.topology?.type??meta.topology??r.topology?.type??r.topology??r.topology_type);
    const topology=['ring','star','ospf'].includes(normalize(rawTopology))?normalize(rawTopology):null;
    const hasChecks=!!r.checks&&typeof r.checks==='object'&&Object.keys(r.checks).length>0;
    return {type,role,kind:role==='OLT'?'olt':role==='CE'?'ce':role==='DI'?'di':'switch',label:role==='OLT'?'OLT':role?'Switch '+role:type==='SWITCH'?'Switch':'Thiết bị',
      name:scalar(r.nameDev||meta.nameDev),ip:scalar(r.ipDev||meta.ipDev),vendor:scalar(r.vendor||meta.vendor),model:scalar(r.model||meta.modelDev),
      topology,rawTopology,profile:scalar(r.profile),hasChecks,unavailable:['SWITCH_DI','SWITCH'].includes(type)&&role!=='CE'&&!hasChecks};
  }
  const cache=new WeakMap();
  function parsePayload(value){
    if(typeof value==='string'){
      const limit=20*1024*1024;
      if(value.length>limit||new TextEncoder().encode(value).length>limit)throw new Error('Nội dung vượt giới hạn 20 MB.');
      let text=value.replace(/^\uFEFF/,'').trim();
      const fenced=text.match(/^```(?:json)?\s*\n([\s\S]*?)\n?```$/i);if(fenced)text=fenced[1].trim();
      if(!text)throw new Error('Bạn chưa dán phản hồi.');
      try{value=JSON.parse(text);}catch{throw new Error('JSON chưa hợp lệ. Hãy dán nguyên object phản hồi, gồm tên trường trong dấu ngoặc kép.');}
    }
    const invalid=validate(value);if(invalid)throw new Error(invalid);
    return value;
  }
  function flags(o){
    const out=[];
    if(blank(o.onu_ipwan))out.push({key:'ip',label:'Thiếu IP WAN'});
    else if(String(o.onu_ipwan).trim()==='0.0.0.0')out.push({key:'ip',label:'IP WAN 0.0.0.0'});
    if(blank(o.contract))out.push({key:'data',label:'Thiếu hợp đồng'});
    if(blank(o.drop_point))out.push({key:'data',label:'Thiếu tập điểm'});
    if(blank(o.net_status))out.push({key:'data',label:'Thiếu trạng thái HĐ'});
    else if(normalize(o.net_status)!=='binh thuong')out.push({key:'contract',label:'HĐ: '+contractStatus(o.net_status)});
    const issues=[...list(o.data_quality?.issues),...list(o.service_quality?.issues)];
    if(o.data_quality?.needs_review&&issues.length===0)out.push({key:'data',label:'Dữ liệu CDP cần kiểm tra'});
    if(o.service_quality?.needs_review&&issues.length===0)out.push({key:'data',label:'Dữ liệu dịch vụ cần kiểm tra'});
    for(const issue of issues)if(!out.some(f=>f.label===issue.message))out.push({key:'data',label:issue.message||issue.code||'Dữ liệu CDP cần kiểm tra'});
    return out;
  }
  function validate(d){
    if(!d||typeof d!=='object'||Array.isArray(d)||typeof d.status!=='boolean')return 'Response phải là object có status kiểu boolean.';
    if(!['OLT','SWITCH_CE','SWITCH_DI','SWITCH'].includes(d.device_type)&&!(d.status===false&&d.result==null&&d.device_type==null))return 'Loại thiết bị chưa có bộ hiển thị; hỗ trợ OLT và Switch CE / DI.';
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
    if(d.device_type!=='OLT'&&r.checks!=null){
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
    // Review only ONU rows returned after mac_limit, including for historical JSON.
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
    {key:'contract',label:'Hợp đồng',group:'customer',value:r=>r.source.contract},{key:'net_status',label:'Trạng thái HĐ',group:'customer',value:r=>contractStatus(r.source.net_status)},{key:'drop_point',label:'Tập điểm',group:'customer',value:r=>r.source.drop_point},{key:'onu_ipwan',label:'IP WAN',group:'customer',value:r=>r.source.onu_ipwan},
    {key:'onu_sn',label:'Serial ONU',group:'identity',value:r=>r.source.onu_sn},{key:'onu_mac',label:'MAC ONU',group:'identity',value:r=>r.source.onu_mac},{key:'onu_model',label:'Model',group:'identity',value:r=>r.source.onu_model},
    {key:'onu_rx',label:'RX (dBm)',group:'optics',numeric:true,value:r=>r.source.onu_rx},{key:'onu_tx',label:'TX (dBm)',group:'optics',numeric:true,value:r=>r.source.onu_tx},
    {key:'onu_temp',label:'Nhiệt độ (°C)',group:'operation',numeric:true,value:r=>r.source.onu_temp},{key:'onu_olt_distance',label:'OLT–ONU (m)',group:'operation',numeric:true,value:r=>r.source.onu_olt_distance},
    {key:'attention',label:'Đối chiếu',value:r=>r.flags.map(f=>f.label).join('; ')}
  ];
  function csv(rows,groups={}){
    const selected=columns.filter(c=>!c.group||groups[c.group]!==false);
    const quote=v=>{let s=String(v??'');if((/^[\s]*[=+@-]/.test(s)&&!/^\s*-?\d+(?:\.\d+)?\s*$/.test(s))||/^[\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
    return '\uFEFF'+[selected.map(c=>quote(c.label)).join(','),...rows.map(row=>selected.map(c=>quote(c.value(row))).join(','))].join('\r\n');
  }
  return {list,blank,normalize,flags,validate,index,filter,paginate,columns,csv,deviceContext,parsePayload,contractStatus,onuLayout};
});
