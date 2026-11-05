(()=>{
"use strict";
const URL="https://fhjarnogglakehaztbbj.supabase.co/functions/v1/jmags-live-tech-location";
const STORE="jmags_trip_share_current_tab";
const $=id=>document.getElementById(id);
let session=null,watchId=null,keepalive=null,pending=false,lastSent=0,latestPosition=null,viewerToken=null,viewTimer=null,loading=false,map=null,pin=null,accuracyCircle=null;
const show=(id,on)=>{$(id).hidden=!on};
const text=(id,val)=>{$(id).textContent=val==null||val===""?"—":String(val)};
const error=(id,msg)=>{text(id,msg||"");show(id,!!msg)};
const state=(id,msg,kind)=>{const el=$(id);el.classList.toggle("warn",kind==="warn");el.classList.toggle("off",kind==="off");text(id+"Text",msg)};
const date=v=>{const d=new Date(v);return v&&!isNaN(d.getTime())?new Intl.DateTimeFormat("en-PH",{timeZone:"Asia/Manila",dateStyle:"medium",timeStyle:"short"}).format(d):"Not available"};
const page=id=>["landing","setup","sharing","customer"].forEach(x=>show(x,x===id));
async function api(body){
 const controller=new AbortController(),time=setTimeout(()=>controller.abort(),16000);
 try{const res=await fetch(URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),cache:"no-store",signal:controller.signal});
 const obj=await res.json().catch(()=>({}));
 if(!res.ok)throw new Error(obj.error||"Could not connect to the JMAGS location server.");
 return obj;
 }finally{clearTimeout(time)}
}
function capture(){return new Promise((resolve,reject)=>{
 if(!navigator.geolocation)return reject(new Error("GPS is not supported by this browser. Open this site in Chrome."));
 navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,maximumAge:8000,timeout:20000});
})}
const point=p=>({latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:Math.round(p.coords.accuracy)});
function gpsError(e){
 if(e&&e.code===1)return"Location permission denied. Allow location for this website in your browser settings.";
 if(e&&e.code===2)return"Your phone cannot determine its location. Turn on GPS and mobile data.";
 if(e&&e.code===3)return"GPS timed out. Try again somewhere with a clearer signal.";
 return e&&e.message?String(e.message):"Unable to get GPS. Check location permission and connection.";
}
function stopGps(){if(watchId!==null){navigator.geolocation.clearWatch(watchId);watchId=null}if(keepalive){clearInterval(keepalive);keepalive=null}}
function customerUrl(){return "https://jmagsappliances.tech/live-location/#view="+session.viewToken}
function updatePanel(paused){
 page("sharing");text("shareUrl",customerUrl());text("expiry",date(session.expiresAt));
 state("myStatus",paused?"GPS paused — select Resume GPS":"Sharing your GPS location",paused?"warn":"live");
 show("resume",paused);show("share",typeof navigator.share==="function");
}
async function send(p){
 if(!session||pending||Date.now()-lastSent<7000)return;
 if(!p||!p.coords||Date.now()-p.timestamp>60000)return;
 pending=true;
 try{
 const d=await api({action:"update",publishToken:session.publishToken,...point(p)});
 lastSent=Date.now();text("myUpdated",date(d.updatedAt));state("myStatus","Sharing your GPS location","live");error("updateError","");
 }catch(e){
 state("myStatus","GPS sharing interrupted","warn");error("updateError",e.message);
 if(/ended|expired/i.test(e.message||""))stopGps();
 }finally{pending=false}
}
function startGps(){
 stopGps();show("resume",false);
 watchId=navigator.geolocation.watchPosition(p=>{latestPosition=p;send(p)},e=>{state("myStatus","Waiting for GPS","warn");error("updateError",gpsError(e));},{enableHighAccuracy:true,maximumAge:8000,timeout:24000});
 keepalive=setInterval(()=>{
  if(!session)return;
  if(latestPosition&&Date.now()-latestPosition.timestamp<45000)send(latestPosition);
  else if(!document.hidden)capture().then(p=>{latestPosition=p;send(p)}).catch(()=>{});
 },17000);
}
$("openTech").addEventListener("click",()=>{page("setup");history.replaceState(null,"",location.pathname+"#share")});
$("back").addEventListener("click",()=>{page("landing");history.replaceState(null,"",location.pathname)});
$("startShare").addEventListener("click",async()=>{
 const btn=$("startShare");btn.disabled=true;text("startShare","Getting GPS position…");error("startError","");
 try{
 const p=await capture();text("startShare","Creating secure link…");
 const d=await api({action:"start",technician:$("techName").value,jobReference:$("jobRef").value,tripType:$("tripType").value,...point(p)});
 session={publishToken:d.publishToken,viewToken:d.viewToken,tripType:d.tripType,expiresAt:d.expiresAt};
 sessionStorage.setItem(STORE,JSON.stringify(session));
 latestPosition=p;lastSent=Date.now();updatePanel(false);text("myUpdated",date(d.updatedAt));startGps();
 }catch(e){error("startError",gpsError(e))}
 finally{btn.disabled=false;text("startShare","Allow GPS and start sharing")}
});
$("copy").addEventListener("click",async()=>{
 if(!session)return;try{await navigator.clipboard.writeText(customerUrl());text("copyMessage","Copied! Send the link privately to your customer.")}
 catch(_){text("copyMessage","Copy the private address shown above and send it to your customer.")}
});
$("share").addEventListener("click",async()=>{
 if(!session||!navigator.share)return;
 try{await navigator.share({title:"JMAGS technician location",text:"Track my current trip location:",url:customerUrl()})}catch(_){}
});
$("resume").addEventListener("click",async()=>{
 error("updateError","");
 try{const p=await capture();lastSent=0;latestPosition=p;await send(p);startGps()}
 catch(e){error("updateError",gpsError(e))}
});
$("stop").addEventListener("click",async()=>{
 if(!session)return;const btn=$("stop");btn.disabled=true;stopGps();
 try{await api({action:"stop",publishToken:session.publishToken});sessionStorage.removeItem(STORE);
 session=null;history.replaceState(null,"",location.pathname);page("landing")}
 catch(e){error("updateError","Could not confirm sharing stopped. Please retry: "+e.message);show("resume",true)}
 finally{btn.disabled=false}
});
function noMap(msg){show("map",false);show("googleMaps",false);text("mapInfo",msg)}
function plot(lat,lng,meters){
 show("map",true);show("googleMaps",true);$("googleMaps").href="https://www.google.com/maps?q="+encodeURIComponent(lat+","+lng);
 text("mapInfo","Pin shows the most recent shared GPS reading. Location is approximate.");
 if(typeof L==="undefined"){show("map",false);text("mapInfo","Embedded map unavailable. Use Open in Google Maps.");return}
 if(!map){
  map=L.map("map");L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
  pin=L.marker([lat,lng]).addTo(map);accuracyCircle=L.circle([lat,lng],{radius:Math.max(10,Math.min(meters||0,3000)),weight:1,fillOpacity:.08}).addTo(map);
 }else{
  pin.setLatLng([lat,lng]);accuracyCircle.setLatLng([lat,lng]);accuracyCircle.setRadius(Math.max(10,Math.min(meters||0,3000)));
 }
 map.setView([lat,lng],15);setTimeout(()=>map.invalidateSize(),200);
}
async function loadView(){
 if(!viewerToken||loading)return;loading=true;
 try{
 const d=await api({action:"view",viewToken:viewerToken});
 text("viewTech",d.technician||"Not supplied");text("viewJob",d.jobReference||"Not supplied");text("viewUpdated",date(d.updatedAt));
 if(d.status==="live"){
  state("viewStatus","GPS location is live","live");text("viewAccuracy",d.accuracyMeters==null?"Not reported":"About "+Math.round(d.accuracyMeters)+" meters");
  plot(d.latitude,d.longitude,d.accuracyMeters);error("viewError","");
 }else if(d.status==="stale"){
  state("viewStatus","Waiting for a fresh GPS reading","warn");text("viewAccuracy","Unavailable");noMap(d.message||"Location is temporarily unavailable");error("viewError","");
 }else{
  state("viewStatus","Sharing has ended","off");noMap("The technician ended sharing or this link has expired.");error("viewError","");
  clearInterval(viewTimer);viewTimer=null;
 }
 }catch(e){
  state("viewStatus","Unable to retrieve GPS","warn");noMap("There is no current GPS reading to show.");error("viewError",e.message||"Connection problem");
 }finally{loading=false}
}
$("refresh").addEventListener("click",loadView);
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&viewerToken)loadView()});
window.addEventListener("pagehide",()=>{stopGps();if(viewTimer)clearInterval(viewTimer)});
function init(){
 const hash=location.hash||"";
 if(hash.startsWith("#view=")){
  viewerToken=hash.slice(6);
  page("customer");
  if(!/^[A-Za-z0-9_-]{43}$/.test(viewerToken)){error("viewError","This is not a valid JMAGS location link.");state("viewStatus","Invalid sharing link","warn");return}
  loadView();viewTimer=setInterval(()=>{if(!document.hidden)loadView()},10000);return;
 }
 const saved=sessionStorage.getItem(STORE);
 if(saved){try{
  const s=JSON.parse(saved);
  if(s.publishToken&&s.viewToken&&Date.parse(s.expiresAt)>Date.now()){session=s;updatePanel(true);return}
 }catch(_){}sessionStorage.removeItem(STORE)}
 if(hash==="#share"){page("setup");return}
 page("landing");
}
init();
})();