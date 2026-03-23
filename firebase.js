// Firebase config — Realtime Database
const FB_URL='https://financeiro-otavio-bf717-default-rtdb.firebaseio.com';

// _cloud: load/save/listen using Firebase REST + SSE
window._cloud={
  // Read once
  async load(code){
    try{
      const r=await fetch(`${FB_URL}/users/${encodeURIComponent(code)}.json`);
      if(!r.ok)return null;
      const data=await r.json();
      return data; // null if not found, object if exists
    }catch(e){console.warn('FB load',e);return null;}
  },

  // Write (PUT replaces the whole node)
  async save(code,data){
    try{
      const r=await fetch(`${FB_URL}/users/${encodeURIComponent(code)}.json`,{
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(data)
      });
      return r.ok;
    }catch(e){console.warn('FB save',e);return false;}
  },

  // Real-time listener via Server-Sent Events (Firebase SSE)
  listen(code,cb){
    try{
      if(window._fbSse){window._fbSse.close();}
      const url=`${FB_URL}/users/${encodeURIComponent(code)}.json`;
      const sse=new EventSource(url);
      window._fbSse=sse;
      sse.addEventListener('put',e=>{
        try{
          const msg=JSON.parse(e.data);
          // msg.path === '/' means full data replaced
          if(msg&&msg.data&&msg.data.fixed){
            cb(msg.data);
          }
        }catch(err){}
      });
      sse.onerror=()=>{}; // silent — we still have local data
    }catch(e){console.warn('FB listen',e);}
  }
};