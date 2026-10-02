(() => {
  const body = document.body;
  const steps = [...document.querySelectorAll('.step')];
  const runBtn = document.getElementById('runBtn');
  const backBtn = document.getElementById('backBtn');
  const phaseTitle = document.getElementById('phaseTitle');
  const phaseHint = document.getElementById('phaseHint');
  const resultList = document.getElementById('resultList');
  const log = document.getElementById('runLog');
  const toast = document.getElementById('toast');
  const phases = (body.dataset.phases || 'Khởi tạo|Cấp phát|Pre-check|Thực thi|Hoàn tất').split('|');
  let phase = Number(body.dataset.start || 1);
  const hints = ['Xác nhận dữ liệu đầu vào và phạm vi tác động.','Giữ tài nguyên cần thiết cho kế hoạch.','Kiểm tra kết nối, topology và dịch vụ.','Thực thi thay đổi và xác minh kết quả.','Ghi nhận bằng chứng và đóng kế hoạch.'];
  const checks = ['Kết nối thiết bị','Kiểm tra dữ liệu inventory','Đối chiếu topology','Xác nhận dịch vụ'];
  const showToast = text => { toast.textContent=text; toast.classList.add('show'); clearTimeout(showToast.t); showToast.t=setTimeout(()=>toast.classList.remove('show'),2200); };
  function render(){
    steps.forEach((s,i)=>{s.classList.toggle('done',i<phase);s.classList.toggle('active',i===phase)});
    phaseTitle.textContent=phases[phase]; phaseHint.textContent=hints[phase] || hints[3];
    runBtn.textContent=phase>=phases.length-1?'Đóng kế hoạch':`Chạy ${phases[phase]}`; backBtn.disabled=phase===0;
    resultList.innerHTML=checks.map((c,i)=>`<div class="check"><i>${i<phase?'✓':'○'}</i><div><b>${c}</b><span>${i<phase?'Đã ghi nhận bằng chứng':'Sẵn sàng kiểm tra'}</span></div><em>${i<phase?'Đạt':'Chờ'}</em></div>`).join('');
    log.innerHTML=`<span class="ok">[ready]</span> ${body.dataset.workflow} đã tải dữ liệu<br><span class="ok">[scope]</span> ${body.dataset.target}<br>${phase>1?'<span class="ok">[allocate]</span> tài nguyên đã được giữ<br>':''}${phase>2?'<span class="ok">[precheck]</span> các điều kiện đầu vào hợp lệ<br>':''}${phase>3?'<span class="wait">[execute]</span> đang đồng bộ kết quả về inventory<br>':''}`;
  }
  runBtn.addEventListener('click',()=>{if(phase<phases.length-1){phase++;render();showToast(`${phases[phase]} đã sẵn sàng`)}else showToast('Đã hoàn tất luồng mô phỏng')});
  backBtn.addEventListener('click',()=>{if(phase>0){phase--;render()}});
  document.querySelectorAll('[data-demo]').forEach(b=>b.addEventListener('click',()=>showToast(b.dataset.demo)));
  render();
})();
