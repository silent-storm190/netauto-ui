// Physical port banks + snapshot telemetry. No inventory presence => no inferred UP/DOWN.
(() => {
  'use strict';
  const catalog = {
    GC08:{vendor:'GCOM',name:'GL5610-08P',aliases:['GL5610-8P'],source:'https://gcom.ge/products/108/f_5f414e132b054.pdf'},
    GC16:{vendor:'GCOM',name:'GL5610-16P',source:'https://gcom.ge/products/108/f_5f414e132b054.pdf'},
    CH52:{vendor:'H3C',name:'S6520X-30HF-EI',aliases:['H3C_S6520X-30HF-EI']},
    CH53:{vendor:'H3C',name:'S6520X-54HF-EI',aliases:['H3C_S6520X-54HF-EI']},
    CV52:{vendor:'H3C',name:'S6520X-30HF-EI · IRF',aliases:['H3C_Stack_S6520X-30HF-EI']},
    CV53:{vendor:'H3C',name:'S6520X-54HF-EI · IRF',aliases:['H3C_Stack_S6520X-54HF-EI']},
    ZA62:{vendor:'ZTE',name:'ZXA10 C620',modular:true},
    ZA61:{vendor:'ZTE',name:'ZXA10 C610',note:'C610 có biến thể 8/16 PON. Chờ inventory để xác định phiên bản và tên interface.',source:'https://www.zte.com.cn/global/product_index/optical_access_en/pon-olt/zxa10/zxa10-c610.html'},
    ZA63:{vendor:'ZTE',name:'ZXA10 C620H',modular:true,note:'Model theo danh mục bạn cung cấp; cấu hình port cần inventory thực tế.'},
    HA58:{vendor:'HUAWEI',name:'MA5800-X2',modular:true,source:'https://carrier.huawei.com/en/products/fixed-network/access/OLT/smart-ng-olt-ma5800'},
    HA51:{vendor:'HUAWEI',name:'MA5801-FL16-H1',source:'https://e.huawei.com/de/products/optical-access/ma5801-fl16',note:'Profile 16 Flex-PON + 4 GE/10GE; tên interface mẫu cần đối chiếu inventory.'}
  };
  for(const code of ['CH52','CH53','CV52','CV53'])catalog[code].source='https://www.h3c.com/en/Products_and_Solutions/InterConnect/Switches/Products/Campus_Network/Aggregation/S6500/H3C_S6520X-EI/';
  const clean = name => String(name || '').replace(/[\s\u0000-\u001f]+/g,'').replace(/^-+(?=[A-Za-z])/,'');
  const compact = name => name.replace('Ten-GigabitEthernet','XGE').replace('HundredGigE','100GE').replace('XGigabitEthernet','XG').replace('GigabitEthernet','GE').replace('gpon_olt-','PON').replace('xgei-','XGE');
  const normalized = name => String(name).toUpperCase().replace(/[\s_-]+/g,'');
  function resolve(model) {
    const value=normalized(model || '');
    return Object.keys(catalog).find(code=>[code,catalog[code].name,...(catalog[code].aliases||[])].some(alias=>normalized(alias)===value)) || window.HuaweiDeviceLayouts?.resolve(model) || String(model || '').toUpperCase();
  }
  function bank(name,kind) {
    const last=name.lastIndexOf('/');
    return `${kind}:${last<0?name.replace(/\d+$/,''):name.slice(0,last)}`;
  }
  function kindOf(name,module,device) {
    if(/PON/i.test(module?.port_type || '') || /^(?:gpon|xgpon|xgspon)_olt-/i.test(name))return 'PON';
    if(device.type==='SWITCH' || /NNI/i.test(module?.port_type || '') || /^(?:E\d|xgei-|gei-|XGigabit|Ten-Gigabit|HundredGig|\d+GE)/i.test(name))return 'NNI';
    if(/^G\d+\//i.test(name)&&device.type==='OLT')return 'PON';
    return 'UNKNOWN';
  }
  function make(name,kind,info,origin='profile') {
    const status=String(info?.status || '').trim().toUpperCase();
    const state=status==='UP'?'up':status==='DOWN'?'down':info===null?'empty':'unknown';
    return {name,label:compact(name),kind,bank:bank(name,kind),module:info??null,modulePresent:origin==='snapshot'?info!==null:null,status:status==='UP'||status==='DOWN'?status:'UNKNOWN',state,origin};
  }
  function hardwareOf(device,model,profile,ports) {
    const huawei=window.HuaweiDeviceLayouts?.get(model);
    const modular=!!profile.modular || !!huawei?.chassis;
    const verticalCards=model==='HW12'||model==='HS12';
    const units=new Map();
    for(const port of ports) {
      const member=port.name.match(/^(?:Ten-GigabitEthernet|HundredGigE|XGigabitEthernet|GigabitEthernet|\d+GE)(\d+)\//)?.[1];
      // OLT card slots and standalone modular-switch slots are not stack members.
      const unitId=device.type==='SWITCH'&&(!modular||huawei?.stack)?member ?? '0':'0';
      if(!units.has(unitId))units.set(unitId,{id:unitId,groups:[]});
      const unit=units.get(unitId);
      let group=unit.groups.find(group=>group.id===port.bank);
      if(!group) {
        let media=port.kind==='PON'?'PON · SFP':'Ethernet';
        let uplink=false;
        if(/^GC(?:08|16)$/.test(model)) {
          media=port.kind==='PON'?'GPON · SFP':/^E1\//.test(port.name)?'GE · Combo':'10GE · SFP+';
          uplink=port.kind==='NNI';
        } else if(/^(CH|CV)5[23]$/.test(model)) {
          uplink=/^HundredGigE/.test(port.name);media=uplink?'40G / 100G · QSFP28':'1G / 10G · SFP+';
        } else if(/^(?:100GE|40GE)/.test(port.name)) {
          uplink=true;media=port.name.startsWith('100GE')?'40G / 100G · QSFP28':'40GE · QSFP+';
        } else if(/^(?:XGigabitEthernet|Ten-GigabitEthernet|10GE|xgei-)/.test(port.name)) {
          // On a GE access switch, the smaller 10GE bank is the uplink region;
          // on an all-10GE switch it remains the main service bank.
          media='10GE · SFP+';uplink=device.type==='OLT'||device.type==='SWITCH'&&ports.some(item=>/^GigabitEthernet/.test(item.name));
        } else if(/^GigabitEthernet/.test(port.name))media='GE';
        else if(device.type==='OLT'&&port.kind==='NNI'){media='NNI · Uplink';uplink=true;}
        group={id:port.bank,bank:port.bank.split(':').slice(1).join(':'),media,uplink,ports:[]};unit.groups.push(group);
      }
      group.ports.push(port);
    }
    const stack=device.type==='SWITCH'&&(units.size>1||!!huawei?.stack||/^CV/.test(model));
    const hardwareUnits=[...units.values()].sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));
    for(const unit of hardwareUnits) {
      unit.label=stack?`Member ${unit.id}`:modular?'Chassis · Card / Slot':'Fixed';
      unit.groups.sort((a,b)=>Number(a.uplink)-Number(b.uplink)||a.id.localeCompare(b.id,undefined,{numeric:true}));
      for(const group of unit.groups) {
        const count=group.ports.length;
        group.columns=group.uplink?Math.min(count,count===6?3:4):count<=16?Math.min(count,8):count<=24?12:24;
        if(verticalCards)group.columns=Math.min(group.columns,12);
      }
    }
    return {stack,modular,cardTracks:verticalCards?1:2,units:hardwareUnits};
  }
  function build(device) {
    const model=resolve(device.model);
    const profile=catalog[model] || {name:window.HuaweiDeviceLayouts?.get(model)?.manufacturerModel || device.model,vendor:device.vendor};
    const observed=new Map();
    let normalizedNames=0;
    for(const entry of device.ports || []) {
      const name=clean(entry.name);if(!name)continue;
      if(name!==entry.name)normalizedNames++;
      const port={...make(name,kindOf(name,entry.module,device),entry.module,'snapshot'),rawName:entry.name};
      if(!observed.has(name)||entry.module)observed.set(name,port);
    }
    const ports=new Map();
    const add=(name,kind)=>ports.set(name,make(name,kind,undefined));
    if(model==='GC08'||model==='GC16') {
      for(let i=1;i<=(model==='GC08'?8:16);i++)add(`G0/${i}`,'PON');
      for(let i=1;i<=4;i++)add(`E1/${i}`,'NNI');
      for(let i=1;i<=2;i++)add(`E2/${i}`,'NNI');
    } else if(/^(CH|CV)5[23]$/.test(model)) {
      // IRF membership is taken from observed names, never invented as two chassis.
      const members=[...new Set([...observed.keys()].map(name=>name.match(/(?:Ethernet|GigE)(\d+)\//)?.[1]).filter(Boolean))];
      if(!members.length && model.startsWith('CH'))members.push('1');
      const service=model.endsWith('2')?24:48;
      for(const member of members) {
        for(let i=1;i<=service;i++)add(`Ten-GigabitEthernet${member}/0/${i}`,'NNI');
        for(let i=service+1;i<=service+6;i++)add(`HundredGigE${member}/0/${i}`,'NNI');
      }
    } else if(model==='HA51'&&!observed.size) {
      for(let i=0;i<16;i++)add(`G0/1/${i}`,'PON');
      for(let i=0;i<4;i++)add(`E0/2/${i}`,'NNI');
    } else if(!observed.size&&device.type==='SWITCH') {
      const huawei=window.HuaweiDeviceLayouts?.get(model);
      // Do not create installed cards/stack members for chassis from sample profiles.
      if(huawei&&!huawei.requiresInventory&&!huawei.stack)for(const port of huawei.interfaces)add(port.cliName,'NNI');
    }
    for(const [name,port] of observed)ports.set(name,port);
    const list=[...ports.values()].sort((a,b)=>a.kind.localeCompare(b.kind)||a.bank.localeCompare(b.bank,undefined,{numeric:true})||a.name.localeCompare(b.name,undefined,{numeric:true}));
    const groups=[];
    for(const port of list) {
      let group=groups.find(group=>group.id===port.bank);
      if(!group){group={id:port.bank,kind:port.kind,label:port.bank.slice(port.bank.indexOf(':')+1),ports:[]};groups.push(group);}
      group.ports.push(port);
    }
    const summary={total:list.length,up:0,down:0,unknown:0,empty:0,pon:0,nni:0,profile:0,observed:observed.size};
    for(const port of list){if(port.status==='UP')summary.up++;else if(port.status==='DOWN')summary.down++;else summary.unknown++;if(port.state==='empty')summary.empty++;if(port.origin==='profile')summary.profile++;if(port.kind==='PON')summary.pon++;if(port.kind==='NNI')summary.nni++;}
    return {model,profile,ports:list,groups,summary,normalizedNames,hardware:hardwareOf(device,model,profile,list)};
  }
  function faceplateGeometry(layout,availableWidth) {
    // Match the shared faceplate CSS: chassis padding+border 26, bank chrome 16,
    // bank gap 8, port gap 4. One port width is shared by every bank/member.
    const available=Math.max(0,Number(availableWidth)||0);
    const denseCards=layout.model==='HW12'||layout.model==='HS12';
    const longest=Math.max(0,...layout.ports.map(port=>port.label.length));
    const minPortWidth=Math.max(denseCards?70:54,Math.ceil(longest*5.4+14));
    const rowSize=(groups,portWidth)=>{
      const columns=groups.reduce((sum,group)=>sum+group.columns,0);
      return {columns,overhead:26+groups.length*16+Math.max(0,groups.length-1)*8+Math.max(0,columns-groups.length)*4,
        width:26+groups.length*16+Math.max(0,groups.length-1)*8+Math.max(0,columns-groups.length)*4+columns*portWidth};
    };
    const fitColumns=(group,space)=>{
      const maximum=denseCards&&group.ports.length>12?16:group.columns;
      const candidates=(denseCards&&group.ports.length>12?[16,12,8]:[maximum,24,16,12,8,4,2,1]).filter((count,index,all)=>
        count<=maximum&&count<=group.ports.length&&all.indexOf(count)===index).sort((a,b)=>b-a);
      return candidates.find(columns=>rowSize([{columns}],minPortWidth).width<=space)||candidates[candidates.length-1];
    };
    // Pure geometry for EVERY model: preserve card/member order, fit banks,
    // then add rows before squeezing names or reserving empty chassis space.
    const plans=layout.hardware.units.map(unit=>{
      let tracks=1;
      const rows=[];
      const make=(group,columns=group.columns)=>({id:group.id,columns});
      if(layout.hardware.modular){
        tracks=Math.min(layout.hardware.cardTracks,Math.max(1,unit.groups.length));
        const minimumColumns=Math.min(4,...unit.groups.map(group=>group.columns));
        if(rowSize(Array.from({length:tracks},()=>({columns:minimumColumns})),minPortWidth).width>available)tracks=1;
        const trackSpace=26+(available-26-(tracks-1)*8)/tracks;
        const banks=unit.groups.map(group=>make(group,fitColumns(group,trackSpace)));
        const columns=Math.max(0,...banks.map(bank=>bank.columns));
        for(let i=0;i<banks.length;i+=tracks)rows.push({banks:banks.slice(i,i+tracks),slots:Array.from({length:tracks},()=>({columns}))});
      }else{
        const original=unit.groups.map(group=>make(group));
        const compact=unit.groups.map(group=>make(group,group.uplink?group.columns:Math.min(8,group.columns)));
        const pack=groups=>{
          let banks=[];
          for(const group of groups){
            const bank=make(group,fitColumns(group,available));
            if(banks.length&&rowSize([...banks,bank],minPortWidth).width>available){rows.push({banks,slots:banks});banks=[];}
            banks.push(bank);
          }
          if(banks.length)rows.push({banks,slots:banks});
        };
        if(rowSize(original,minPortWidth).width<=available)rows.push({banks:original,slots:original});
        else if(unit.groups.every(group=>group.uplink||group.ports.length<=24)&&rowSize(compact,minPortWidth).width<=available)rows.push({banks:compact,slots:compact});
        else{
          // Long service banks stay whole; uplinks get their own next row.
          pack(unit.groups.filter(group=>!group.uplink));pack(unit.groups.filter(group=>group.uplink));
        }
      }
      return {tracks,rows};
    });
    const rows=plans.flatMap(plan=>plan.rows.map(row=>row.slots));
    let width=86;
    for(const groups of rows){
        const {columns,overhead}=rowSize(groups,0);
        if(!columns)continue;
        width=Math.min(width,(available-overhead)/columns);
    }
    let portWidth=Math.max(minPortWidth,Math.floor(width*10)/10);
    const shellWidth=port=>Math.max(280,...rows.map(groups=>rowSize(groups,port).width));
    // Absorb a small remainder with a gentle, shared expansion (max 96px).
    // Large unused areas remain outside a compact chassis, not inside it.
    const naturalWidth=shellWidth(portWidth);
    if(rows.length&&naturalWidth<available&&naturalWidth>=available*.88){
      const expanded=Math.min(...rows.map(groups=>{
        const {columns,overhead}=rowSize(groups,0);
        return columns?(available-overhead)/columns:Infinity;
      }));
      if(expanded<=96)portWidth=Math.max(portWidth,Math.floor(expanded*10)/10);
    }
    // Fit the shell to the actual bank footprint, not the whole viewport.
    // Stack members keep a common width; dense models still scroll when needed.
    const chassisWidth=Math.ceil(shellWidth(portWidth));
    const bankColumns={};
    for(const plan of plans){
      const boundaries=new Set([0,chassisWidth-26]);
      plan.placements=[];
      plan.rows.forEach((row,index)=>{
        let start=0;
        row.banks.forEach((bank,i)=>{
          bankColumns[bank.id]=bank.columns;
          const columns=row.slots[i].columns;
          const end=start+16+columns*portWidth+(columns-1)*4;
          boundaries.add(start);boundaries.add(end);
          plan.placements.push({id:bank.id,row:index+1,start,end});start=end+8;
        });
      });
      const edges=[...boundaries].sort((a,b)=>a-b);
      plan.gridColumns=edges.slice(1).map((edge,i)=>`${Math.round((edge-edges[i])*1000)/1000}px`).join(' ')||'auto';
      plan.placements.forEach(bank=>bank.column=`${edges.indexOf(bank.start)+1} / ${edges.indexOf(bank.end)+1}`);
    }
    return {portWidth,minPortWidth,portHeight:35,chassisWidth,bankColumns,units:plans};
  }
  function listRows(layout,unit,availableWidth=1400) {
    // Pure, framework-independent planner. Input is the SAME ordered banks as
    // Giả lập; only viewport capacity may change their rows/column counts.
    // Width is the inner chassis width (caller subtracts its padding/border).
    if(!unit.groups.length)return [];
    const width=Math.max(1,Number(availableWidth)||1),chrome=24,gap=10,portGap=6;
    const longest=Math.max(0,...unit.groups.flatMap(group=>group.ports.map(port=>port.label.length)));
    // 11px monospace label + button/border/pattern-mask padding.
    const minPortWidth=Math.max(76,Math.ceil(longest*6.6+16));
    const size=columns=>chrome+columns*minPortWidth+(columns-1)*portGap;
    const fitColumns=(group,space)=>[group.columns,24,16,12,8,4,2,1]
      .filter((columns,index,all)=>columns<=group.columns&&columns<=group.ports.length&&all.indexOf(columns)===index)
      .sort((a,b)=>b-a).find(columns=>size(columns)<=space)||1;
    const required=banks=>banks.reduce((sum,bank)=>sum+size(bank.columns),0)+Math.max(0,banks.length-1)*gap;
    const makeBank=group=>({group,columns:group.columns});
    const planned=[];
    function pack(groups) {
      let row=[];
      for(const group of groups) {
        const bank=makeBank(group);
        if(row.length&&required([...row,bank])>width){planned.push(row);row=[];}
        if(!row.length)bank.columns=fitColumns(group,width);
        row.push(bank);
      }
      if(row.length)planned.push(row);
    }
    if(layout.hardware.modular) {
      // Match Giả lập's model-specific card tracks, including missing cards.
      // Preserve those tracks while labels fit; otherwise stack whole cards.
      const tracks=layout.hardware.cardTracks;
      for(let i=0;i<unit.groups.length;i+=tracks) {
        const pair=unit.groups.slice(i,i+tracks);
        const track=(width-gap*(pair.length-1))/pair.length;
        if(pair.length===2&&track<size(Math.min(4,...pair.map(group=>group.columns))))pack(pair);
        else planned.push(pair.map(group=>({group,columns:fitColumns(group,track),equalTrack:true})));
      }
    } else {
      const original=unit.groups.map(makeBank);
      const service=unit.groups.filter(group=>!group.uplink),uplinks=unit.groups.filter(group=>group.uplink);
      // A compact fixed chassis can keep uplinks on the right using eight
      // service ports per row. Dense banks use their own full-width row instead.
      const compact=original.map(bank=>({...bank,columns:bank.group.uplink?bank.columns:Math.min(bank.columns,8)}));
      if(required(original)<=width)planned.push(original);
      else if(service.length===1&&service[0].ports.length<=24&&required(compact)<=width)planned.push(compact);
      else {pack(service);pack(uplinks);}
    }
    const capacity=planned.map(banks=>{
      if(banks[0]?.equalTrack)return Math.min(...banks.map(bank=>((width-gap*(banks.length-1))/banks.length-chrome-(bank.columns-1)*portGap)/bank.columns));
      const columns=banks.reduce((sum,bank)=>sum+bank.columns,0);
      return (width-banks.length*chrome-(banks.length-1)*gap-(columns-banks.length)*portGap)/columns;
    });
    const portWidth=Math.max(1,Math.floor(Math.min(110,...capacity)*10)/10);
    return planned.map(banks=>{
      const columns=banks.reduce((sum,bank)=>sum+bank.columns,0);
      const columnWidth=(width-banks.length*chrome-(banks.length-1)*gap-(columns-banks.length)*portGap)/columns;
      return {
        groups:banks.map(bank=>bank.group),portWidth,minPortWidth,width,
        banks:banks.map(bank=>({id:bank.group.id,columns:bank.columns,
          width:bank.equalTrack?(width-gap*(banks.length-1))/banks.length:
            chrome+bank.columns*columnWidth+(bank.columns-1)*portGap})),
        kind:banks.every(bank=>bank.group.uplink)?'uplink':banks.every(bank=>!bank.group.uplink)?'service':'mixed'
      };
    });
  }
  window.NETAUTO_PORT_MODELS=Object.freeze({catalog,resolve,clean,build,faceplateGeometry,listRows});
})();
