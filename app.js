/* Dayline — a no-build, mobile-first itinerary dashboard.
 * 100% static: plain HTML + CSS + JavaScript. No server, no API keys, no build step.
 * All schedules are in Europe/Brussels on 2026-11-07 (UTC+01:00).
 */
'use strict';
const TRIP_DATE='2026-11-07';
const BE_TIME='Europe/Brussels';
const BASE='2026-11-07T';
const LOCAL_OFFSET='+01:00';
const timeAt=t=>new Date(`${BASE}${t}:00${LOCAL_OFFSET}`).getTime();
const pad=n=>String(n).padStart(2,'0');
const escapeHtml=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
const TABS=['plan','map','flights','checklist'];

/* Edit stops here. `coords` is only a fallback: exact pins are looked up from `address`. */
const STOPS=[
 {id:'arrive',time:'08:50',end:'09:30',name:'Arrive at Brussels Airport',description:'Land in Brussels. Allow time to disembark and exit the terminal before breakfast.',address:'Brussels Airport, 1930 Zaventem, Belgium',coords:[50.9009,4.4856],kind:'FLIGHT',stage:'morning',count:false,icon:'✈'},
 {id:'olea',time:'09:45',end:'10:35',name:'Olea — Breakfast',description:'Sit-down Turkish/Mediterranean breakfast. Aim to finish around 10:35 to protect your next stops.',address:'Kerkplein 25, 1930 Zaventem, Belgium',coords:[50.8848,4.4730],kind:'FOOD',stage:'morning',count:true,icon:'☕'},
 {id:'lier',time:'11:15',end:'11:35',name:'Lier (optional)',description:'Only if needed; allow about 20 minutes. Grote Markt is a placeholder: change the address in app.js if you know the exact location.',address:'Grote Markt, 2500 Lier, Belgium',coords:[51.1312,4.5694],kind:'OPTIONAL',stage:'morning',count:true,optional:true,icon:'📍'},
 {id:'biss',time:'12:10',end:'12:30',name:'Bisschoppenhoflaan 638',description:'Your fixed 20-minute visit, immediately before Matiate. Use the timer if you want a reminder.',address:'Bisschoppenhoflaan 638, 2100 Antwerpen, Belgium',coords:[51.2400,4.4740],kind:'MUST VISIT',stage:'morning',count:true,icon:'📍'},
 {id:'matiate',time:'12:55',end:'14:00',name:'Matiate Antwerpen',description:'Main lunch stop. Arrive around 12:55–13:00, allowing for driving and parking.',address:'Groenendaallaan 414, 2030 Antwerpen, Belgium',website:'https://www.matiate.be/matiate-antwerpen/',coords:[51.2549,4.4200],kind:'FOOD',stage:'morning',count:true,icon:'🍽'},
 {id:'parking',time:'14:25',end:'14:35',name:'Park near Antwerp Central',description:'Use Q-Park Astridplein as your central base. Leave the car here for the afternoon.',address:'Koningin Astridplein 41, 2018 Antwerpen, Belgium',website:'https://www.q-park.be/en-gb/cities/antwerp/astridplein/',coords:[51.2186,4.4218],kind:'PARKING',stage:'afternoon',count:false,icon:'🅿️'},
 {id:'chocotale',time:'14:55',end:'15:15',name:'Chocotale',description:'Chocolate-covered strawberries and dessert at your must-visit Nationalestraat address.',address:'Nationalestraat 86, 2000 Antwerpen, Belgium',coords:[51.2143,4.4009],kind:'MUST VISIT',stage:'afternoon',count:true,icon:'🍓'},
 {id:'meir',time:'15:35',end:'16:05',name:'Shopping Stadsfeestzaal',description:'Enjoy the historic shopping gallery and browse the shops at Meir 78.',address:'Meir 78, 2000 Antwerpen, Belgium',coords:[51.2181,4.4105],kind:'MUST VISIT',stage:'afternoon',count:true,icon:'🛍'},
 {id:'gyo',time:'16:20',end:'16:55',name:'Gyojasang × Takumi',description:'Korean × Japanese collaboration for your final meal. This is De Keyserlei 1, not standalone Takumi at number 13.',address:'De Keyserlei 1, 2018 Antwerpen, Belgium',website:'https://gyojasang.com/antwerp-keyserlei/',coords:[51.2176,4.4174],kind:'FOOD',stage:'afternoon',count:true,icon:'🍜'},
 {id:'leave',time:'17:10',end:'18:10',name:'Leave Antwerp for the airport',description:'Return to your car and drive to Brussels Airport. Driving times are estimates and traffic is not tracked live.',address:'Koningin Astridplein 41, 2018 Antwerpen, Belgium',coords:[51.2186,4.4218],kind:'CRITICAL',stage:'return',count:false,icon:'🚗'},
 {id:'back',time:'18:10',end:'21:10',name:'Brussels Airport — check in & security',description:'Target airport arrival. London is outside Schengen; allow time for security and passport control.',address:'Brussels Airport, 1930 Zaventem, Belgium',coords:[50.9009,4.4856],kind:'CRITICAL',stage:'return',count:true,icon:'✈'},
 {id:'flight',time:'21:10',end:'21:10',name:'Flight to London departs',description:'Brussels Airlines, hand luggage only. Flight number still needs to be entered for tracking.',address:'Brussels Airport, 1930 Zaventem, Belgium',coords:[50.9009,4.4856],kind:'FLIGHT',stage:'return',count:false,icon:'✈'}
];
const CHECKS=[
 {name:'Before you travel',items:[
  ['boarding','Check in online with Brussels Airlines and save your boarding pass'],
  ['passport','Bring your passport and check UK entry permission / visa / ETA requirements'],
  ['car','Arrange your car and confirm parking / rental return arrangements'],
  ['reservations','Check Olea and Matiate opening hours / book if desired']
 ]},
 {name:'On the day',items:[
  ['gps','Allow browser location access for the GPS map'],
  ['lier','Decide whether the optional Lier visit is needed'],
  ['biss','Start the 20-minute Bisschoppenhoflaan timer'],
  ['chocolate','Visit Nationalestraat 86 and Meir 78'],
  ['dinner','Eat at Gyojasang × Takumi, De Keyserlei 1']
 ]},
 {name:'Before the London flight',items:[
  ['leave','Aim to leave central Antwerp by 17:10'],
  ['airport','Reach Brussels Airport around 18:10'],
  ['pass','Have your boarding pass and passport ready for control'],
  ['gate','Check live departure displays and proceed to the correct gate']
 ]}
];
const STORE='dayline-belgium-20261107-v2';
const GEO_STORE='dayline-geocache-v1';
let persisted={};try{persisted=JSON.parse(localStorage.getItem(STORE)||'{}')||{}}catch{}
let geoCache={};try{geoCache=JSON.parse(localStorage.getItem(GEO_STORE)||'{}')||{}}catch{}
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:null;
const state={
 includeLier:persisted.includeLier!==false,
 completed:obj(persisted.completed)||{},
 checks:obj(persisted.checks)||{},
 flights:obj(persisted.flights)||{inbound:'',outbound:''},
 timer:obj(persisted.timer)||{remaining:1200,deadline:null,running:false},
 selectedTab:'plan',gps:null,
 map:null,mapMarkers:[],userMarker:null,gpsWatchId:null,
 mapStyle:['liberty','bright','positron','osm'].includes(persisted.mapStyle)?persisted.mapStyle:'liberty',
 activeStopId:null
};
const persist=()=>{
 try{localStorage.setItem(STORE,JSON.stringify({includeLier:state.includeLier,completed:state.completed,checks:state.checks,flights:state.flights,timer:state.timer,mapStyle:state.mapStyle}))}catch(e){console.warn('Local storage unavailable:',e)}
};
const saveGeo=()=>{try{localStorage.setItem(GEO_STORE,JSON.stringify(geoCache))}catch{}};

let toastTimeout;
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),3600)}
const activeStops=()=>STOPS.filter(s=>!(s.optional&&!state.includeLier));
const doneCount=()=>activeStops().filter(s=>s.count&&state.completed[s.id]).length;
const totalCount=()=>activeStops().filter(s=>s.count).length;
function formatRemaining(ms){if(ms<=0)return '00:00:00';const secs=Math.ceil(ms/1000),days=Math.floor(secs/86400),hours=Math.floor((secs%86400)/3600),mins=Math.floor((secs%3600)/60),seconds=secs%60;return days>0?`${days}d ${pad(hours)}h ${pad(mins)}m`:`${pad(hours)}:${pad(mins)}:${pad(seconds)}`}
function minsUntil(ms){const minutes=Math.round(ms/60000);if(minutes<-1)return `${Math.abs(minutes)} min behind schedule`;if(minutes<=0)return 'Scheduled now';if(minutes>=1440)return `In ${Math.floor(minutes/1440)}d ${Math.floor((minutes%1440)/60)}h`;if(minutes>=60)return `In ${Math.floor(minutes/60)}h ${minutes%60}m`;return `In ${minutes} min`}
const travelMode=s=>s.stage==='afternoon'&&s.id!=='parking'?'walking':'driving';
function navUrl(s,mode=travelMode(s)){
 const p=new URLSearchParams({api:'1',destination:s.address,travelmode:mode});
 if(state.gps)p.set('origin',`${state.gps.lat},${state.gps.lng}`);
 return `https://www.google.com/maps/dir/?${p}`;
}

/* ---------- Itinerary ---------- */
function renderProgress(){
 $('progress-stat').innerHTML=`${doneCount()} <small>/ ${totalCount()}</small>`;
 const open=CHECKS.reduce((n,g)=>n+g.items.filter(([id])=>!state.checks[id]).length,0);
 $('todo-tab-count').textContent=open;
 $('todo-tab-count').hidden=open===0;
}
function stopCard(s){
 const checked=!!state.completed[s.id],important=s.kind==='CRITICAL'||s.kind==='MUST VISIT';
 return `<article class="stop-card ${checked?'completed':''}" data-stop="${s.id}">
 <div class="stop-time"><strong>${escapeHtml(s.time)}</strong><small>${s.end===s.time?'':`to ${escapeHtml(s.end)}`}</small></div>
 <div class="stop-detail"><div class="stop-title-row"><h3><span class="stop-icon" aria-hidden="true">${escapeHtml(s.icon)}</span> ${escapeHtml(s.name)}</h3><span class="stop-type ${important?'important':''}">${escapeHtml(s.kind)}</span></div>
 <p class="stop-description">${escapeHtml(s.description)}</p><p class="stop-address">${escapeHtml(s.address)}</p>
 <div class="stop-actions"><a class="mini-button nav" target="_blank" rel="noopener noreferrer" href="${escapeHtml(navUrl(s))}">↗ Navigate</a>
 <button class="mini-button view-map" data-id="${s.id}" type="button">Map</button>
 ${s.website?`<a class="mini-button" href="${escapeHtml(s.website)}" target="_blank" rel="noopener noreferrer">Website ↗</a>`:''}
 ${s.count?`<button class="mini-button ${checked?'done':''} mark-done" data-id="${s.id}" type="button" aria-pressed="${checked}">${checked?'✓ Done':'Mark done'}</button>`:''}
 </div></div></article>`;
}
function renderTimeline(){
 const labels={morning:'01 · Morning & lunch',afternoon:'02 · The Antwerp afternoon',return:'03 · The flight home'};
 let stage='';
 $('timeline').innerHTML=activeStops().map(s=>{let hdr='';if(s.stage!==stage){stage=s.stage;hdr=`<div class="stage-label">${labels[stage]}</div>`}return hdr+stopCard(s)}).join('');
 $('lier-toggle').checked=state.includeLier;
 $('lier-advice').textContent=state.includeLier?'Skip if the incoming flight is delayed.':'More breathing room before lunch.';
 renderProgress();lastNextHtml='';renderNext();
}
let lastNextHtml='';
function renderNext(){
 const now=Date.now();
 const unfinished=activeStops().filter(s=>!state.completed[s.id]&&s.id!=='leave');
 const upcoming=unfinished.find(s=>timeAt(s.end)>=now)||(now<timeAt('08:50')?unfinished[0]:null);
 let html;
 if(!upcoming)html='<h3>Trip schedule complete</h3><p>Check the latest flight information and enjoy your journey.</p>';
 else html=`<h3>${escapeHtml(upcoming.name)}</h3><div class="mini-next-time">${escapeHtml(upcoming.time)}</div><p>${escapeHtml(minsUntil(timeAt(upcoming.time)-now))} · ${escapeHtml(upcoming.address)}</p><a class="btn-primary" target="_blank" rel="noopener noreferrer" href="${escapeHtml(navUrl(upcoming))}">↗ Navigate there</a>`;
 // Only touch the DOM when something changed, so links keep focus and don't flicker every second.
 if(html!==lastNextHtml){lastNextHtml=html;$('next-stop-panel').innerHTML=html}
}
function renderChecks(){
 const count=CHECKS.reduce((n,g)=>n+g.items.length,0);
 const completed=CHECKS.reduce((n,g)=>n+g.items.filter(([id])=>state.checks[id]).length,0);
 $('checklist-summary').textContent=`${completed} / ${count} complete`;
 $('check-progress-fill').style.width=`${100*completed/count}%`;
 $('checklist-groups').innerHTML=CHECKS.map(g=>`<div class="checklist-group"><h3>${escapeHtml(g.name)}</h3>${g.items.map(([id,label])=>`<label class="checklist-row ${state.checks[id]?'checked':''}"><input type="checkbox" data-check="${id}" ${state.checks[id]?'checked':''}><span>${escapeHtml(label)}</span></label>`).join('')}</div>`).join('');
 renderProgress();
}

/* ---------- Clock & timer ---------- */
const clockFmt=new Intl.DateTimeFormat('en-GB',{timeZone:BE_TIME,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
function updateClock(){
 const now=Date.now(),clock=clockFmt.format(new Date(now));
 $('local-clock').textContent=`BE · ${clock}`;$('hero-clock').textContent=`BELGIUM · ${clock}`;
 const remaining=timeAt('21:10')-now;
 $('flight-countdown').textContent=remaining>0?formatRemaining(remaining):'DEPARTED';
 let note=remaining>0?'SATURDAY · 21:10 CET':'SCHEDULED DEPARTURE HAS PASSED';
 const leave=timeAt('17:10')-now;
 if(leave<=30*60000&&leave>0)note=`LEAVE ANTWERP IN ${Math.ceil(leave/60000)} MIN · FLIGHT 21:10`;
 $('flight-countdown-note').textContent=note;
 renderNext();updateTimer();
}
let timerNotified=false;
function remainingSeconds(){return state.timer.running&&state.timer.deadline?Math.max(0,Math.ceil((state.timer.deadline-Date.now())/1000)):Math.max(0,Math.round(state.timer.remaining??1200))}
function updateTimer(){
 const secs=remainingSeconds();
 $('stop-timer').textContent=`${pad(Math.floor(secs/60))}:${pad(secs%60)}`;$('stop-timer').classList.toggle('warning',secs<=60);
 $('timer-start').textContent=state.timer.running?'Pause timer':secs===0?'Restart timer':'Start timer';
 if(state.timer.running&&secs===0){
  state.timer.running=false;state.timer.remaining=0;state.timer.deadline=null;persist();
  if(!timerNotified){timerNotified=true;toast('20 minutes are up — time to head to Matiate.');if(navigator.vibrate)navigator.vibrate([150,100,150]);
   if('Notification' in window&&Notification.permission==='granted')new Notification('Dayline — time is up',{body:'Your 20-minute visit is complete. Head to Matiate.'});playBeep();}
 }
}
function playBeep(){try{const ctx=new (window.AudioContext||window.webkitAudioContext)();const osc=ctx.createOscillator(),gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);osc.frequency.value=700;gain.gain.setValueAtTime(.05,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.35);osc.start();osc.stop(ctx.currentTime+.36);setTimeout(()=>ctx.close(),550)}catch{}}
function toggleTimer(){
 if(state.timer.running){state.timer.remaining=remainingSeconds();state.timer.running=false;state.timer.deadline=null;toast('Timer paused')}
 else{
  if(remainingSeconds()===0)state.timer.remaining=1200;
  state.timer.running=true;state.timer.deadline=Date.now()+state.timer.remaining*1000;timerNotified=false;toast('20-minute timer started');
  if('Notification' in window&&Notification.permission==='default')Notification.requestPermission().catch(()=>{});
 }
 persist();updateTimer();
}

/* ---------- Tabs ---------- */
function switchTab(name,{updateHash=true}={}){
 if(!TABS.includes(name))return;
 state.selectedTab=name;
 for(const b of document.querySelectorAll('.tab')){const active=b.dataset.tab===name;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active))}
 for(const p of document.querySelectorAll('.pane')){p.hidden=p.id!==`pane-${name}`;p.classList.toggle('active',!p.hidden)}
 if(updateHash&&location.hash!==`#${name}`)history.replaceState(null,'',`#${name}`);
 if(name==='map')requestAnimationFrame(()=>initMap());
 if(name==='checklist')renderChecks();
 // Bring the pane into view if it's off-screen (above or far below the fold).
 const pane=$(`pane-${name}`);
 const top=pane.getBoundingClientRect().top;
 if(top<0||top>window.innerHeight*.45)pane.scrollIntoView({behavior:'smooth',block:'start'});
}

/* ---------- Locations: exact pins looked up from addresses, cached on device ---------- */
const getCoords=stop=>{const g=geoCache[stop.address];return g?[g.lat,g.lng]:stop.coords};
const coordsForMap=stop=>{const [lat,lng]=getCoords(stop);return [lng,lat]}; // MapLibre uses [lng, lat]
const isExact=stop=>!!geoCache[stop.address];
const activeMapStops=()=>activeStops().filter(s=>s.id!=='leave'&&s.id!=='flight');
function distKm([lat1,lng1],[lat2,lng2]){const R=6371,r=Math.PI/180,dLat=(lat2-lat1)*r,dLng=(lng2-lng1)*r;const a=Math.sin(dLat/2)**2+Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.sqrt(a))}
const geoMisses=new Set();let geocoding=false;
async function geocodeMissing(){
 if(geocoding||navigator.onLine===false)return;
 geocoding=true;
 try{
  const seen=new Set();
  for(const stop of STOPS){
   if(geoCache[stop.address]||geoMisses.has(stop.address)||seen.has(stop.address))continue;
   seen.add(stop.address);
   const q=new URLSearchParams({q:stop.address,format:'jsonv2',limit:'1',countrycodes:'be'});
   const res=await fetch(`https://nominatim.openstreetmap.org/search?${q}`,{headers:{accept:'application/json'}});
   if(!res.ok)break; // rate-limited or blocked: try again next visit
   const [hit]=await res.json();
   const lat=Number(hit?.lat),lng=Number(hit?.lon);
   // Ignore results that land far from where we expect the stop to be.
   if(Number.isFinite(lat)&&Number.isFinite(lng)&&distKm([lat,lng],stop.coords)<=15){geoCache[stop.address]={lat,lng};saveGeo();refreshMapPositions()}
   else geoMisses.add(stop.address);
   await new Promise(r=>setTimeout(r,1100)); // Nominatim allows 1 request per second
  }
 }catch(e){console.debug('Geocoding skipped',e)}
 geocoding=false;
 updateMapStatus();
}

/* ---------- Map ---------- */
const RASTER_STYLE={version:8,sources:{osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,maxzoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}},layers:[{id:'osm',type:'raster',source:'osm'}]};
const styleFor=name=>name==='osm'?RASTER_STYLE:`https://tiles.openfreemap.org/styles/${name}`;
const mapBackup={used:false};
function showMapProblem(message){
 $('map-error').hidden=false;
 $('map-error').querySelector('p').textContent=message||'Your addresses and directions links still work below.';
 $('map-status').textContent='Map unavailable';
}
function updateMapStatus(){
 const stops=activeMapStops(),approx=stops.filter(s=>!isExact(s)).length;
 $('map-status').textContent=`${stops.length} stops · tap a pin${approx?(geocoding?' · refining positions…':' · some pins approximate'):''}`;
}
function popupNode(stop,also=[]){
 const root=document.createElement('div');
 const title=document.createElement('h3');title.textContent=`${stop.icon} ${stop.name}`;root.appendChild(title);
 const details=document.createElement('p');details.textContent=`${stop.time} · ${stop.address}`;root.appendChild(details);
 for(const o of also){const p=document.createElement('p');p.className='popup-also';p.textContent=`Also here: ${o.time} · ${o.name}`;root.appendChild(p)}
 const row=document.createElement('div');row.className='popup-links';
 const a=document.createElement('a');a.href=navUrl(stop);a.target='_blank';a.rel='noopener noreferrer';a.textContent='Directions ↗';row.appendChild(a);
 if(stop.website){const w=document.createElement('a');w.href=stop.website;w.target='_blank';w.rel='noopener noreferrer';w.textContent='Website ↗';row.appendChild(w)}
 root.appendChild(row);
 return root;
}
function makeMarkerElement(stop,i){
 const airport=stop.id==='arrive'||stop.id==='back';
 const el=document.createElement('button');el.type='button';
 el.className=`map-marker${stop.optional?' optional':''}${airport?' airport':''}`;
 el.title=`${stop.name} — ${stop.time}`;el.setAttribute('aria-label',el.title);
 const label=document.createElement('span');label.textContent=airport?'✈':String(i+1);el.appendChild(label);
 return el;
}
function setActiveStop(id){
 state.activeStopId=id;
 for(const m of state.mapMarkers)m.marker.getElement().classList.toggle('selected',m.ids.includes(id));
 for(const row of document.querySelectorAll('.map-mini'))row.classList.toggle('active',row.dataset.mapRow===id);
}
function routeGeoJson(){return {type:'Feature',properties:{},geometry:{type:'LineString',coordinates:activeMapStops().map(coordsForMap)}}}
function ensureRouteLine(){
 const map=state.map;if(!map)return;
 try{
  const src=map.getSource('trip-order-line');
  if(src){src.setData(routeGeoJson());return}
  map.addSource('trip-order-line',{type:'geojson',data:routeGeoJson()});
  map.addLayer({id:'trip-order-line-layer',type:'line',source:'trip-order-line',layout:{'line-join':'round'},paint:{'line-color':'#f2683c','line-width':2.5,'line-opacity':.8,'line-dasharray':[2,2]}});
 }catch{/* style not ready yet; style.load will retry */}
}
function refreshMapPositions(){
 renderMapStopList();
 if(!state.map)return;
 for(const m of state.mapMarkers){const stop=STOPS.find(s=>s.id===m.id);if(stop)m.marker.setLngLat(coordsForMap(stop))}
 ensureRouteLine();updateMapStatus();
}
function renderMapStopList(){
 $('map-stops').innerHTML=activeMapStops().map((s,i)=>`<div class="map-mini ${state.activeStopId===s.id?'active':''}" data-map-row="${escapeHtml(s.id)}"><div class="map-mini-text"><strong>${escapeHtml(s.icon)} ${escapeHtml(s.name)}</strong><small>${escapeHtml(s.time)} · ${escapeHtml(s.address)}${isExact(s)?'':' · approx. pin'}</small></div><div class="map-mini-actions"><button class="mini-button map-focus" data-id="${escapeHtml(s.id)}" type="button">Show</button><a class="mini-button nav" href="${escapeHtml(navUrl(s))}" target="_blank" rel="noopener noreferrer">Directions ↗</a></div></div>`).join('');
}
// Stops that share an address (e.g. the airport at arrival and again before the flight) share one pin.
function mapPins(){
 const byAddress=new Map();
 for(const s of activeMapStops()){if(!byAddress.has(s.address))byAddress.set(s.address,[]);byAddress.get(s.address).push(s)}
 return [...byAddress.values()].map(group=>({stop:group[0],also:group.slice(1),ids:group.map(g=>g.id)}));
}
function redrawMap(fit=false){
 renderMapStopList();
 if(!state.map)return;
 state.mapMarkers.forEach(item=>item.marker.remove());state.mapMarkers=[];
 mapPins().forEach(({stop,also,ids},index)=>{
  const popup=new maplibregl.Popup({offset:[0,-40],maxWidth:'270px',closeButton:true}).setDOMContent(popupNode(stop,also));
  popup.on('open',()=>setActiveStop(stop.id));
  const marker=new maplibregl.Marker({element:makeMarkerElement(stop,index),anchor:'bottom',offset:[0,8]}).setLngLat(coordsForMap(stop)).setPopup(popup).addTo(state.map);
  state.mapMarkers.push({id:stop.id,ids,marker});
 });
 ensureRouteLine();
 if(state.gps)addUserMarker();
 setActiveStop(state.activeStopId);
 if(fit)fitMap();
 updateMapStatus();
}
function boundsFor(stops,includeGps){
 const pts=stops.map(coordsForMap);
 // Only include the user's position if they're actually in the area; otherwise the view would zoom out to another country.
 if(includeGps&&state.gps&&distKm([state.gps.lat,state.gps.lng],[51.1,4.45])<60)pts.push([state.gps.lng,state.gps.lat]);
 if(!pts.length)return null;
 return pts.reduce((b,p)=>b.extend(p),new maplibregl.LngLatBounds(pts[0],pts[0]));
}
function fitStops(stops,maxZoom){
 if(!state.map)return;
 const b=boundsFor(stops,true);if(!b)return;
 const narrow=window.innerWidth<720;
 state.map.fitBounds(b,{padding:narrow?{top:50,bottom:60,left:40,right:40}:{top:60,bottom:70,left:60,right:60},maxZoom,duration:600});
}
const fitMap=()=>fitStops(activeMapStops(),13);
const fitAntwerp=()=>fitStops(activeMapStops().filter(s=>s.stage==='afternoon'),16);
function initMap(){
 renderMapStopList();
 if(state.map){state.map.resize();return}
 if(!window.maplibregl){showMapProblem('The map library could not load. Reload the page; addresses and directions still work below.');return}
 $('map-error').hidden=true;$('map-status').textContent='Loading map…';
 mapBackup.used=state.mapStyle==='osm';
 let styleReady=false,tileErrors=0;
 const useBackup=()=>{
  if(mapBackup.used||!state.map)return;
  mapBackup.used=true;tileErrors=0;
  $('map-status').textContent='Switching to backup map…';
  state.map.setStyle(RASTER_STYLE);
  toast('Vector map unavailable — using the classic OpenStreetMap layer.');
 };
 try{
  state.map=new maplibregl.Map({container:'map',style:styleFor(state.mapStyle),center:[4.45,51.1],zoom:9,attributionControl:false,dragRotate:false,pitchWithRotate:false});
 }catch(err){showMapProblem('The map could not start — WebGL may be turned off in this browser. Directions links below still work.');return}
 const map=state.map;
 map.touchZoomRotate.disableRotation();
 map.addControl(new maplibregl.AttributionControl({compact:true}),'bottom-right');
 map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
 map.addControl(new maplibregl.ScaleControl({maxWidth:100,unit:'metric'}),'bottom-left');
 map.on('style.load',()=>{styleReady=true;$('map-error').hidden=true;ensureRouteLine()});
 map.on('load',()=>{redrawMap(true);geocodeMissing()});
 map.on('error',e=>{
  if(!styleReady&&!mapBackup.used){useBackup();return}
  if(e&&(e.sourceId||e.error?.status)){
   tileErrors++;
   if(tileErrors>=8){if(!mapBackup.used)useBackup();else showMapProblem('Map tiles are not loading. Check your connection, then retry.')}
  }
 });
 map.on('data',e=>{if(e.dataType==='source'&&e.isSourceLoaded)tileErrors=Math.max(0,tileErrors-1)});
 // A request that never answers should not leave a silently blank map.
 setTimeout(()=>{if(!styleReady&&state.map===map)useBackup()},9000);
 setTimeout(()=>{if(!styleReady&&state.map===map)showMapProblem('The map did not respond. Check your connection, then retry.')},20000);
 redrawMap();
}
function resetMap(){
 if(state.map){state.map.remove();state.map=null}
 state.mapMarkers=[];state.userMarker=null;
 $('map-error').hidden=true;initMap();
}
function focusStop(id,scroll=true){
 const stop=STOPS.find(s=>s.id===id);if(!stop)return;
 const go=()=>{
  if(!state.map)return;
  state.map.flyTo({center:coordsForMap(stop),zoom:15.5,essential:true});
  const found=state.mapMarkers.find(m=>m.ids.includes(id));
  if(found&&!found.marker.getPopup().isOpen())found.marker.togglePopup();
  setActiveStop(id);
  if(scroll){const r=$('map').getBoundingClientRect();if(r.top<56||r.bottom>window.innerHeight)$('map').scrollIntoView({behavior:'smooth',block:'center'})}
 };
 if(state.selectedTab!=='map')switchTab('map');
 initMap();
 // Markers only exist once the map has loaded.
 if(state.map&&!state.mapMarkers.length)state.map.once('load',()=>setTimeout(go,50));else setTimeout(go,60);
}
function addUserMarker(){
 if(!state.map||!state.gps)return;
 const center=[state.gps.lng,state.gps.lat];
 if(state.userMarker)state.userMarker.setLngLat(center);
 else{
  const dot=document.createElement('div');dot.className='gps-marker';dot.title='Your position';
  state.userMarker=new maplibregl.Marker({element:dot}).setLngLat(center).setPopup(new maplibregl.Popup({offset:15}).setText('You are here')).addTo(state.map);
 }
}
let lastLinkRefresh=0;
function useGps(){
 if(!navigator.geolocation){toast('Your browser does not support GPS location.');return}
 const btn=$('gps-button');
 if(state.gpsWatchId!==null){navigator.geolocation.clearWatch(state.gpsWatchId);state.gpsWatchId=null;btn.textContent='⌖ My location';btn.classList.remove('on');toast('Live location paused.');return}
 btn.disabled=true;btn.textContent='⌖ Locating…';
 state.gpsWatchId=navigator.geolocation.watchPosition(pos=>{
  const first=!state.gps;
  state.gps={lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:pos.coords.accuracy};
  addUserMarker();
  btn.disabled=false;btn.textContent='◉ Live · Stop';btn.classList.add('on');
  if(first){
   if(state.map)state.map.flyTo({center:[state.gps.lng,state.gps.lat],zoom:13});
   toast('Your live position is now on the map.');
  }
  // Navigation links include your position as the start point; refresh them now and then, not on every GPS tick.
  if(first||Date.now()-lastLinkRefresh>30000){lastLinkRefresh=Date.now();renderTimeline();renderMapStopList()}
 },error=>{
  btn.disabled=false;btn.textContent='⌖ My location';btn.classList.remove('on');
  if(state.gpsWatchId!==null)navigator.geolocation.clearWatch(state.gpsWatchId);
  state.gpsWatchId=null;
  toast(error.code===1?'Location permission denied. Allow location access for this site.':'Location unavailable — check that location services are on.');
 },{enableHighAccuracy:true,maximumAge:15000,timeout:16000});
}

/* ---------- Flights (static: saved numbers + links to live trackers) ---------- */
const IATA_TO_ICAO={SN:'BEL',BA:'BAW',U2:'EZY',FR:'RYR',LH:'DLH',AF:'AFR',KL:'KLM',TK:'THY',EW:'EWG',W6:'WZZ',LX:'SWR',AZ:'ITY',EI:'EIN',VY:'VLG',IB:'IBE',SK:'SAS',AY:'FIN',TP:'TAP',EK:'UAE',QR:'QTR',EY:'ETD',LS:'EXS',TOM:'TOM',BY:'TOM'};
const flightCode=type=>String(state.flights[type]||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const validFlight=c=>/^[A-Z0-9]{2,3}\d{1,5}[A-Z]?$/.test(c);
function flightUrl(code,site){
 if(site==='fr')return `https://www.flightradar24.com/data/flights/${encodeURIComponent(code.toLowerCase())}`;
 const m=code.match(/^([A-Z0-9]{2})(\d+[A-Z]?)$/);
 const ident=m&&IATA_TO_ICAO[m[1]]?IATA_TO_ICAO[m[1]]+m[2]:code; // FlightAware prefers ICAO airline codes
 return `https://www.flightaware.com/live/flight/${encodeURIComponent(ident)}`;
}
function updateFlightHint(type){
 const code=flightCode(type),el=$(`flight-${type}-hint`);
 el.textContent=!code?(type==='inbound'?'Add your incoming flight number, then open a live tracker.':'Add your outgoing flight number, then open a live tracker.'):validFlight(code)?`${code} saved on this device. Open a tracker for live status.`:'That doesn’t look like a flight number — try something like SN1234.';
 el.classList.toggle('bad',!!code&&!validFlight(code));
}
function setFlightInputs(){for(const type of ['inbound','outbound']){$(`flight-${type}`).value=state.flights[type]||'';updateFlightHint(type)}}

/* ---------- Events ---------- */
function wireEvents(){
 for(const b of document.querySelectorAll('.tab'))b.addEventListener('click',()=>switchTab(b.dataset.tab));
 window.addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(TABS.includes(h)&&h!==state.selectedTab)switchTab(h,{updateHash:false})});
 $('go-flights').addEventListener('click',()=>switchTab('flights'));
 $('lier-toggle').addEventListener('change',e=>{state.includeLier=e.target.checked;persist();renderTimeline();if(state.map)redrawMap(true);toast(state.includeLier?'Lier added to your plan':'Lier removed — more breathing room!')});
 $('reset-progress').addEventListener('click',()=>{if(confirm('Mark all itinerary stops as not completed? (Your checklists stay saved.)')){state.completed={};persist();renderTimeline();toast('Itinerary progress reset')}});
 $('timeline').addEventListener('click',e=>{
  const done=e.target.closest('.mark-done');if(done){const id=done.dataset.id;state.completed[id]=!state.completed[id];persist();renderTimeline();return}
  const view=e.target.closest('.view-map');if(view)focusStop(view.dataset.id,false);
 });
 $('timer-start').addEventListener('click',toggleTimer);
 $('timer-reset').addEventListener('click',()=>{state.timer={remaining:1200,deadline:null,running:false};timerNotified=false;persist();updateTimer();toast('Timer reset to 20 minutes')});
 $('gps-button').addEventListener('click',useGps);
 $('map-fit').addEventListener('click',fitMap);
 $('map-antwerp').addEventListener('click',fitAntwerp);
 $('map-style').value=state.mapStyle;
 $('map-style').addEventListener('change',e=>{
  state.mapStyle=e.target.value;persist();mapBackup.used=state.mapStyle==='osm';
  if(state.map){$('map-error').hidden=true;state.map.setStyle(styleFor(state.mapStyle))}else initMap();
 });
 $('map-retry').addEventListener('click',resetMap);
 $('map-stops').addEventListener('click',e=>{const btn=e.target.closest('.map-focus');if(btn)focusStop(btn.dataset.id)});
 $('checklist-groups').addEventListener('change',e=>{const id=e.target.dataset.check;if(id){state.checks[id]=e.target.checked;persist();renderChecks()}});
 for(const type of ['inbound','outbound']){
  const el=$(`flight-${type}`);
  el.addEventListener('input',e=>{state.flights[type]=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'');e.target.value=state.flights[type];persist();updateFlightHint(type)});
  el.addEventListener('keydown',e=>{if(e.key==='Enter'){const code=flightCode(type);if(validFlight(code))window.open(flightUrl(code,'fa'),'_blank','noopener,noreferrer')}});
 }
 for(const b of document.querySelectorAll('.external-flight'))b.addEventListener('click',()=>{
  const code=flightCode(b.dataset.flight);
  if(!validFlight(code)){toast('Enter a valid flight number such as SN1234.');$(`flight-${b.dataset.flight}`).focus();return}
  window.open(flightUrl(code,b.dataset.site),'_blank','noopener,noreferrer');
 });
 window.addEventListener('online',geocodeMissing);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateClock()});
}
function init(){
 wireEvents();setFlightInputs();renderTimeline();renderChecks();updateClock();setInterval(updateClock,1000);
 const h=location.hash.slice(1);if(TABS.includes(h)&&h!=='plan')switchTab(h,{updateHash:false});
 if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(err=>console.debug('Service worker unavailable',err));
}
init();
