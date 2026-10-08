// Classic scripts deliberately support both file:// previews and static hosting.
(() => {
  const data=window.NETAUTO_DATA;
  const pending=new Map();
  const states=new Map();
  const store={source:`${data.snapshot.source} · dữ liệu người dùng cung cấp`,pops:{},isLoaded:code=>states.get(code)==='loaded',status:code=>states.get(code)||'idle'};
  store.ensurePop=(code,callback)=>{
    if(store.isLoaded(code)){callback(null);return;}
    if(pending.has(code)){pending.get(code).push(callback);return;}
    const file=data.inventoryFiles[code];
    if(!file){callback(new Error('Không có file inventory cho POP '+code));return;}
    pending.set(code,[callback]);states.set(code,'loading');
    const script=document.createElement('script');
    script.src=file;
    let done=false;
    const finish=error=>{
      if(done)return;done=true;clearTimeout(timeout);
      states.set(code,error?'error':'loaded');
      const callbacks=pending.get(code)||[];pending.delete(code);
      script.remove();
      callbacks.forEach(handler=>handler(error));
    };
    const timeout=setTimeout(()=>finish(new Error('Hết thời gian tải inventory')),15000);
    script.onload=()=>finish(Array.isArray(store.pops[code])?null:new Error('Inventory chưa đăng ký dữ liệu'));
    script.onerror=()=>finish(new Error('Không tải được '+file));
    document.head.appendChild(script);
  };
  window.NETAUTO_POP_DETAIL_DATA=store;
})();
