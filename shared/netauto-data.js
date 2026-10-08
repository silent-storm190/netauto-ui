window.NETAUTO_DATA = {
  plans:[
    {name:"Cấu hình OLT HCMP202",code:"OLT_INIT.0110260003",type:"olt",label:"OLT Initialize",date:"01/10/2026",time:"14:16",creator:"tuanna234@fpt.com",status:"failed",statusLabel:"Thất bại"},
    {name:"Cấu hình Sw DTPP007",code:"SWCE_INIT.0110260001",type:"switchce",label:"SwitchCE Initialize",date:"01/10/2026",time:"11:49",creator:"tuanna234@fpt.com",status:"new",statusLabel:"Mới tạo"},
    {name:"[SW_STACK] CE504000HCMP44803CH52",code:"SW_STACKJ.3009260015",type:"stack",label:"Switch Stack Join",date:"30/09/2026",time:"17:43",creator:"minhbq3@fpt.com",status:"allocated",statusLabel:"Đã cấp phát"},
    {name:"Giám sát nguồn mới AGGP058",code:"PWR_MON.3009260002",type:"power",label:"Power Monitoring",date:"30/09/2026",time:"14:57",creator:"minhbq3@fpt.com",status:"completed",statusLabel:"Hoàn thành"},
    {name:"Cấu hình OLT HCMP279",code:"OLT_INIT.3009260001",type:"olt",label:"OLT Initialize",date:"30/09/2026",time:"09:34",creator:"nguyenbs@fpt.com",status:"completed",statusLabel:"Hoàn thành"},
    {name:"CE HCMP666",code:"BW_UPG.2909260093",type:"bandwidth",label:"Bandwidth Upgrade",date:"29/09/2026",time:"15:57",creator:"phuongdh5@fpt.com",status:"completed",statusLabel:"Hoàn thành"}
  ],
  workflows:{
    olt:{title:"OLT Initialize",mark:"▦",kicker:"Configuration workflow",description:"Cấp phát uplink, khởi tạo OLT mới và xác minh cấu hình.",base:"olt_init"},
    switchce:{title:"SwitchCE Initialize",mark:"▤",kicker:"Configuration workflow",description:"Khởi tạo hoặc thay thế Switch CE, hỗ trợ cutover và rollback.",base:"switchCE_init"},
    bandwidth:{title:"Bandwidth Upgrade",mark:"↗",kicker:"Configuration workflow",description:"Mở rộng aggregate port và đồng bộ hai đầu liên kết.",base:"bandwidth_upgrade"},
    stack:{title:"Switch Stack Join",mark:"⧉",kicker:"Configuration workflow",description:"Kiểm tra khả năng stack, chọn master/slave và join stack.",base:"switch_stack_join"},
    power:{title:"Power Monitoring",mark:"ϟ",kicker:"Configuration workflow",description:"Cấp phát đường giám sát nguồn qua OLT và xác minh topology.",base:"power_monitoring"}
  }
};
