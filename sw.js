const CACHE='dayline-static-v4';
const SHELL=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./assets/icon.svg','./vendor/maplibre-gl.js','./vendor/maplibre-gl.css','./vendor/fonts/outfit-latin-wght-normal.woff2','./vendor/fonts/dm-sans-latin-wght-normal.woff2'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 // Only this site's own static files. Map tiles, geocoding and location traffic always go straight to the network.
 if(req.method!=='GET'||url.origin!==self.location.origin)return;
 event.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res}).catch(()=>caches.match(req).then(hit=>hit||caches.match('./index.html'))));
});
