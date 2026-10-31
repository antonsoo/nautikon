const EDITION="582e41255fddd59639dd", CACHE="nautikon-"+EDITION, BASE="/nautikon/", FILES=["/nautikon/LICENSE.txt","/nautikon/assets/source-CLNDIER7.css","/nautikon/assets/source-Cs4NB_yF.js","/nautikon/assets/testimony-CPl229_9.js","/nautikon/assets/voyage-B0D1yIud.js","/nautikon/fonts/OFL.txt","/nautikon/fonts/gentium-book-plus-400-greek-ext.woff2","/nautikon/fonts/gentium-book-plus-400-greek.woff2","/nautikon/fonts/gentium-book-plus-400-latin-ext.woff2","/nautikon/fonts/gentium-book-plus-400-latin.woff2","/nautikon/index.html","/nautikon/sources/CC-BY-SA-4.0.txt","/nautikon/sources/NOTICE.txt","/nautikon/sources/perseus-eng2.xml","/nautikon/sources/perseus-grc2.xml","/nautikon/sources/provenance.json","/nautikon/sources/rennie-imprint.jpg","/nautikon/sources/rennie-p107.jpg","/nautikon/sources/rennie-p108.jpg","/nautikon/sources/rennie-p109.jpg","/nautikon/sources/rennie-p110.jpg","/nautikon/sources/rennie-p111.jpg","/nautikon/sources/rennie-title.jpg","/nautikon/testimony.html"], INTEGRITY={"/nautikon/LICENSE.txt":"sha256-YhRecDiOm+c5tAT5BN9kNLrKp0jJtYdcFGeRRX+4O4E=","/nautikon/assets/source-CLNDIER7.css":"sha256-4rT2++H0n/rg1/ktj/mGMPKTGIiALWOJwrOew+A5dT4=","/nautikon/assets/source-Cs4NB_yF.js":"sha256-lnx4Gf6eEfGXO9U57hK0Ze0fBZvmyYdmkHen/XS9CbA=","/nautikon/assets/testimony-CPl229_9.js":"sha256-OpF/IkA9DxVFWiWlLWT/fwK8CTEunL6O+9JtRR7ykg4=","/nautikon/assets/voyage-B0D1yIud.js":"sha256-QXssoa9FvNcbeU6faIFlr5Ze+SRxmpCKJ6Z8J8o/Z9U=","/nautikon/fonts/OFL.txt":"sha256-cqb2jocVxN4YgjwuwL1U07DeD4zBQ2FcITHtmYB332A=","/nautikon/fonts/gentium-book-plus-400-greek-ext.woff2":"sha256-9Mu+6EBPcnXN7OYNFw14fWk9+FNFLvQ6e1BNc+yi1lg=","/nautikon/fonts/gentium-book-plus-400-greek.woff2":"sha256-y6JzunoPvoEONTH1zGL9TpY9p8XTK0mBw/MP5WKuo0M=","/nautikon/fonts/gentium-book-plus-400-latin-ext.woff2":"sha256-RriSPHfs64dOG2oozgjVYpNkE4LqA4L3BDE5v/+PI4M=","/nautikon/fonts/gentium-book-plus-400-latin.woff2":"sha256-3V0pAtrJwR06zEKw5Up0tPLbm9Sn1ocsIzOPcN8pyn4=","/nautikon/index.html":"sha256-GaHEwv6gwKR4zIl+JcESJb/RZZSpjTBOzpeei9mJ9IU=","/nautikon/sources/CC-BY-SA-4.0.txt":"sha256-KKlSnH0LtNxR9L9cEWo9Fu8kegUvdZFGZ2jd9WP9HPU=","/nautikon/sources/NOTICE.txt":"sha256-WgnsONospvzJEnDVF8XRBmadbzOiwBGLb7/iddLTC0Y=","/nautikon/sources/perseus-eng2.xml":"sha256-ip9Kf873gr4K0VKJ/b4ivdGI7wCUtCX9FeMyzWmQcjs=","/nautikon/sources/perseus-grc2.xml":"sha256-pDh4WhHXswCkr+VrXTyxHSJ6fKusf8kMoDVfoc60zBo=","/nautikon/sources/provenance.json":"sha256-knbs/dqkxrlldhdYJwQeAPnn8ktcKnB8loGj1dj9tcQ=","/nautikon/sources/rennie-imprint.jpg":"sha256-7dntK6WOUf4XPuZMLJ2d550nbrh3hbkj50QIhAnJXRI=","/nautikon/sources/rennie-p107.jpg":"sha256-w2Ig1ow0h/dksIc7JjDTHgeZn/V8kples4I85rZYdPo=","/nautikon/sources/rennie-p108.jpg":"sha256-jnrk0YERbi99kftaPFaAailYp480U0LK8nIoHJweeQk=","/nautikon/sources/rennie-p109.jpg":"sha256-8IzUiT7Q2IfCE8Zv1HtCBGKxIVtmg/k6qzbO+xTA4e0=","/nautikon/sources/rennie-p110.jpg":"sha256-pPk2jaTjPTk+KSk/Y2SP6D5DR+bdhBKu2BW9QX7IfvY=","/nautikon/sources/rennie-p111.jpg":"sha256-j5G31e3KZm4MnPn5yxaBhBSSAvDh/GvtVvaCMT7Fg6A=","/nautikon/sources/rennie-title.jpg":"sha256-Y9gkPX2jyPCBfJwxErp3gfl58urNlFzNf/jAWTYzjDI=","/nautikon/testimony.html":"sha256-4ZRZEwlBWJCW5prJEuGRAQ65CQmLfertIDrrd5dzCgs="};
self.addEventListener('install', e => {
 const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),15000);
 e.waitUntil((async()=>{
  try {
   const downloaded=await Promise.all(FILES.map(async url=>{
    const r=await fetch(url,{cache:'reload',integrity:INTEGRITY[url],signal:controller.signal});
    if(!r.ok) throw new Error('Incomplete offline edition');
    const body=await r.arrayBuffer(), headers=new Headers(r.headers);
    headers.delete('Content-Encoding'); headers.delete('Content-Length');
    return [url,new Response(body,{status:r.status,statusText:r.statusText,headers})];
   }));
   controller.signal.throwIfAborted();
   const cache=await caches.open(CACHE);
   await Promise.all(downloaded.map(([url,response])=>cache.put(url,response)));
   await self.skipWaiting();
  } finally { clearTimeout(timer); controller.abort(); }
 })());
});
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('nautikon-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('message', e => {
 if(e.data?.type !== 'INSPECT' || !e.ports[0]) return;
 e.waitUntil(Promise.all(FILES.map(u=>caches.match(u,{cacheName:CACHE}))).then(r=>e.ports[0].postMessage({edition:EDITION,complete:r.every(Boolean),count:r.filter(Boolean).length,total:FILES.length})).catch(()=>e.ports[0].postMessage({edition:EDITION,complete:false})));
});
self.addEventListener('fetch', e => {
 const url=new URL(e.request.url), p=url.pathname===BASE ? BASE+'index.html' : url.pathname;
 if(e.request.method!=='GET'||url.origin!==self.location.origin||!FILES.includes(p)) return;
 if(e.request.mode!=='navigate' && e.request.cache==='reload') { e.respondWith(fetch(e.request)); return; }
 if(e.request.mode!=='navigate') { e.respondWith(caches.match(p,{cacheName:CACHE}).then(r=>r||fetch(e.request))); return; }
 e.respondWith((async()=>{
  let timer;
  const network=fetch(e.request).then(async r=>{const body=await r.arrayBuffer(),headers=new Headers(r.headers);headers.delete('Content-Encoding');headers.delete('Content-Length');return new Response(body,{status:r.status,statusText:r.statusText,headers});});
  const outcome=await Promise.race([network.then(r=>({r}),()=>({})),new Promise(resolve=>{timer=setTimeout(()=>resolve({}),2000)})]);
  clearTimeout(timer);
  if(outcome.r && outcome.r.status<500) return outcome.r;
  const saved=await caches.match(p,{cacheName:CACHE});
  return saved||outcome.r||network.catch(()=>Response.error());
 })());
});