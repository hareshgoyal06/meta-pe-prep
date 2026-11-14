/* ===== PE Prep shared runtime ===== */
const PAGES=[
  ["index.html","Home"],["system-design.html","System Design"],["case-studies.html","Case Studies"],
  ["os.html","Operating Systems"],["linux.html","Linux & Troubleshooting"],["networking.html","Networking"],
  ["interview.html","Interview Kit"]
];
function buildTopbar(){
  const here=location.pathname.split("/").pop()||"index.html";
  const bar=document.createElement("header");bar.className="topbar";
  bar.innerHTML=`<div class="logo"><i></i>PE Prep</div><nav>${PAGES.map(([h,t])=>`<a href="${h}" class="${h===here?'active':''}">${t}</a>`).join("")}</nav>`;
  document.body.prepend(bar);
  const pb=document.createElement("div");pb.className="progressbar";document.body.prepend(pb);
  addEventListener("scroll",()=>{const h=document.documentElement;pb.style.width=(h.scrollTop/(h.scrollHeight-h.clientHeight)*100)+"%"},{passive:true});
}
function buildSidebar(){
  const sb=document.querySelector(".sidebar");if(!sb)return;
  const hs=[...document.querySelectorAll("main h2, main h3")];
  const key="done:"+location.pathname;
  const done=new Set(JSON.parse(localStorage.getItem(key)||"[]"));
  let n=0;
  hs.forEach(h=>{
    if(!h.id)h.id=h.textContent.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    if(h.tagName==="H2"){n++;const s=document.createElement("span");s.className="num";s.textContent=String(n).padStart(2,"0");h.prepend(s);}
    const a=document.createElement("a");a.href="#"+h.id;const cl=h.cloneNode(true);cl.querySelectorAll(".badge,.num").forEach(x=>x.remove());a.textContent=cl.textContent.trim();
    if(h.tagName==="H3")a.className="sub";
    if(h.tagName==="H2"){const t=document.createElement("span");t.className="done-toggle";t.title="mark as done";t.textContent=done.has(h.id)?"✓":"○";
      t.onclick=e=>{e.preventDefault();if(done.has(h.id))done.delete(h.id);else done.add(h.id);localStorage.setItem(key,JSON.stringify([...done]));t.textContent=done.has(h.id)?"✓":"○";h.classList.toggle("done")};
      a.appendChild(t);if(done.has(h.id))h.classList.add("done");}
    sb.appendChild(a);
  });
  const links=[...sb.querySelectorAll("a")];
  const obs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){links.forEach(l=>l.classList.toggle("active",l.getAttribute("href")==="#"+e.target.id));}})},{rootMargin:"-70px 0px -70% 0px"});
  hs.forEach(h=>obs.observe(h));
}
function initComponents(){
  // reveal details
  document.querySelectorAll("details.reveal").forEach(d=>{const kids=[...d.children].filter(c=>c.tagName!=="SUMMARY");if(kids.length&&!d.querySelector(".body")){const b=document.createElement("div");b.className="body";kids.forEach(k=>b.appendChild(k));d.appendChild(b)}});
  // tabs
  document.querySelectorAll(".tabs").forEach(t=>{const tabs=[...t.querySelectorAll(":scope > .tab")];const bar=document.createElement("div");bar.className="tabbar";
    tabs.forEach((tab,i)=>{const b=document.createElement("button");b.textContent=tab.dataset.title||("Tab "+(i+1));b.onclick=()=>{tabs.forEach(x=>x.classList.remove("active"));[...bar.children].forEach(x=>x.classList.remove("active"));tab.classList.add("active");b.classList.add("active")};bar.appendChild(b);if(i===0){tab.classList.add("active");b.classList.add("active")}});
    t.prepend(bar)});
  // quiz
  document.querySelectorAll(".quiz .q").forEach(q=>{const b=document.createElement("button");b.className="btn sm ghost";b.textContent="Show answer";b.onclick=()=>{q.classList.toggle("open");b.textContent=q.classList.contains("open")?"Hide answer":"Show answer"};q.insertBefore(b,q.querySelector(".ans"))});
  // flashcards
  document.querySelectorAll(".flash").forEach(f=>f.onclick=()=>f.classList.toggle("flipped"));
  // checklists persist
  document.querySelectorAll(".checklist input[type=checkbox]").forEach((c,i)=>{const k="chk:"+location.pathname+":"+(c.dataset.k||i);c.checked=localStorage.getItem(k)==="1";c.onchange=()=>localStorage.setItem(k,c.checked?"1":"0")});
  // in-view animations
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in-view");if(e.target.classList.contains("bars"))e.target.querySelectorAll(".fill").forEach(f=>f.style.width=f.dataset.w);io.unobserve(e.target)}}),{threshold:.15});
  document.querySelectorAll(".card,.diagram,.bars,.sim").forEach(el=>io.observe(el));
  // steppers
  document.querySelectorAll(".stepper").forEach(initStepper);
  // code copy
  document.querySelectorAll("pre").forEach(p=>{const b=document.createElement("button");b.textContent="copy";b.className="btn sm ghost";b.style.cssText="position:absolute;top:6px;right:6px;opacity:.6";b.onclick=()=>{navigator.clipboard.writeText(p.innerText.replace(/copy$/,""));b.textContent="copied";setTimeout(()=>b.textContent="copy",1000)};p.appendChild(b)});
}
/* Stepper: element with data-steps JSON list of {t:text, show:[ids]} and an svg inside. */
function initStepper(el){
  const steps=JSON.parse(el.dataset.steps);let i=0;
  const txt=el.querySelector(".step-text"),prev=el.querySelector(".prev"),next=el.querySelector(".next"),cnt=el.querySelector(".count");
  const all=[...el.querySelectorAll("[data-step]")];
  function render(){all.forEach(n=>{const s=n.dataset.step.split(",").map(Number);n.style.opacity=s.includes(i)?"1":(s.some(x=>x<i)&&n.dataset.keep!==undefined?"1":"0.08");n.style.transition="opacity .4s"});
    txt.innerHTML=steps[i];cnt.textContent=(i+1)+"/"+steps.length}
  prev.onclick=()=>{i=(i-1+steps.length)%steps.length;render()};next.onclick=()=>{i=(i+1)%steps.length;render()};
  render();
}

/* ===== Simulators ===== */
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0)}

function initConsistentHash(root){
  const cv=root.querySelector("canvas"),ctx=cv.getContext("2d"),log=root.querySelector(".log");
  let nodes=["A","B","C"],vnodes=1,keys=Array.from({length:40},(_,i)=>"key"+i);
  const colors={A:"#5b8cff",B:"#2fd48a",C:"#ffc857",D:"#ff6ad5",E:"#38d9f5",F:"#ff9f43",G:"#ff5c7a",H:"#b8ff57"};
  function ring(){const r=[];nodes.forEach(n=>{for(let v=0;v<vnodes;v++)r.push({n,pos:hashStr(n+"#"+v)/2**32})});r.sort((a,b)=>a.pos-b.pos);return r}
  function owner(r,k){const p=hashStr(k)/2**32;for(const x of r)if(x.pos>=p)return x.n;return r[0].n}
  let prevMap=null;
  function draw(){const r=ring();const W=cv.width,H=cv.height,cx=W/2,cy=H/2,R=Math.min(W,H)/2-40;ctx.clearRect(0,0,W,H);
    ctx.strokeStyle="#273146";ctx.lineWidth=10;ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.stroke();
    // arcs owned
    for(let i=0;i<r.length;i++){const a=r[(i-1+r.length)%r.length].pos,b=r[i].pos;ctx.strokeStyle=colors[r[i].n]+"55";ctx.beginPath();if(a<b)ctx.arc(cx,cy,R,a*Math.PI*2-Math.PI/2,b*Math.PI*2-Math.PI/2);else{ctx.arc(cx,cy,R,a*Math.PI*2-Math.PI/2,Math.PI*2-Math.PI/2);ctx.arc(cx,cy,R,-Math.PI/2,b*Math.PI*2-Math.PI/2)}ctx.stroke()}
    const map={},counts={};keys.forEach(k=>{const o=owner(r,k);map[k]=o;counts[o]=(counts[o]||0)+1;const p=hashStr(k)/2**32,ang=p*Math.PI*2-Math.PI/2;ctx.fillStyle=colors[o];ctx.beginPath();ctx.arc(cx+Math.cos(ang)*(R-22),cy+Math.sin(ang)*(R-22),4,0,7);ctx.fill()});
    r.forEach(x=>{const ang=x.pos*Math.PI*2-Math.PI/2;ctx.fillStyle=colors[x.n];ctx.beginPath();ctx.arc(cx+Math.cos(ang)*R,cy+Math.sin(ang)*R,9,0,7);ctx.fill();ctx.fillStyle="#fff";ctx.font="bold 11px monospace";ctx.textAlign="center";ctx.fillText(x.n,cx+Math.cos(ang)*(R+22),cy+Math.sin(ang)*(R+22)+4)});
    ctx.fillStyle="#dfe6ff";ctx.font="12px monospace";ctx.textAlign="left";let y=18;nodes.forEach(n=>{ctx.fillStyle=colors[n];ctx.fillText(`${n}: ${counts[n]||0} keys`,10,y);y+=16});
    if(prevMap){let moved=0;keys.forEach(k=>{if(prevMap[k]!==map[k])moved++});log.textContent=`Keys remapped after change: ${moved}/${keys.length} (${(moved/keys.length*100).toFixed(0)}%)\nWith naive mod-N hashing nearly ALL keys would move.\n`+log.textContent}
    prevMap=map}
  root.querySelector(".add").onclick=()=>{const next="ABCDEFGH"[nodes.length];if(next){nodes.push(next);draw()}};
  root.querySelector(".rm").onclick=()=>{if(nodes.length>1){nodes.pop();draw()}};
  const vr=root.querySelector(".vn");vr.oninput=()=>{vnodes=+vr.value;root.querySelector(".vnv").textContent=vnodes;prevMap=null;draw()};
  draw();
}

function initTokenBucket(root){
  const cv=root.querySelector("canvas"),ctx=cv.getContext("2d");let cap=10,rate=2,tokens=10,acc=0,rej=0,last=performance.now(),flashes=[];
  const cI=root.querySelector(".cap"),rI=root.querySelector(".rate");
  cI.oninput=()=>{cap=+cI.value;root.querySelector(".capv").textContent=cap;tokens=Math.min(tokens,cap)};rI.oninput=()=>{rate=+rI.value;root.querySelector(".ratev").textContent=rate};
  function req(){if(tokens>=1){tokens-=1;acc++;flashes.push({t:performance.now(),ok:true})}else{rej++;flashes.push({t:performance.now(),ok:false})}}
  root.querySelector(".req").onclick=req;root.querySelector(".burst").onclick=()=>{for(let i=0;i<15;i++)req()};
  let auto=false;root.querySelector(".auto").onclick=e=>{auto=!auto;e.target.textContent=auto?"Stop auto traffic":"Auto traffic (5 rps)"};
  let autoAcc=0;
  function loop(now){const dt=(now-last)/1000;last=now;tokens=Math.min(cap,tokens+rate*dt);if(auto){autoAcc+=dt*5;while(autoAcc>=1){autoAcc-=1;req()}}
    const W=cv.width,H=cv.height;ctx.clearRect(0,0,W,H);
    const bx=40,by=30,bw=120,bh=H-70;ctx.strokeStyle="#5b8cff";ctx.lineWidth=3;ctx.strokeRect(bx,by,bw,bh);
    const fillH=bh*(tokens/cap);ctx.fillStyle="#38d9f5";ctx.fillRect(bx+3,by+bh-fillH+3,bw-6,Math.max(0,fillH-6));
    ctx.fillStyle="#fff";ctx.font="13px monospace";ctx.fillText(`tokens: ${tokens.toFixed(2)} / ${cap}`,bx,by-10);ctx.fillText(`refill: ${rate}/s`,bx,H-14);
    ctx.fillStyle="#2fd48a";ctx.fillText(`accepted: ${acc}`,220,60);ctx.fillStyle="#ff5c7a";ctx.fillText(`rejected (429): ${rej}`,220,85);
    flashes=flashes.filter(f=>now-f.t<800);flashes.forEach((f,i)=>{const a=1-(now-f.t)/800;ctx.globalAlpha=a;ctx.fillStyle=f.ok?"#2fd48a":"#ff5c7a";ctx.beginPath();ctx.arc(220+(i%12)*22,130+Math.floor(i/12)*22,8,0,7);ctx.fill();ctx.globalAlpha=1});
    // dripping token animation
    const drip=(now/400)%1;ctx.fillStyle="#38d9f5";ctx.beginPath();ctx.arc(bx+bw/2,by-25+drip*20,4,0,7);ctx.fill();
    requestAnimationFrame(loop)}
  requestAnimationFrame(loop);
}

function initLB(root){
  const cv=root.querySelector("canvas"),ctx=cv.getContext("2d");const sel=root.querySelector("select");
  let servers=[{load:0,h:true,w:3},{load:0,h:true,w:2},{load:0,h:true,w:1}],rr=0,pk=[],t=0,counts=[0,0,0],wrr=[];
  root.querySelectorAll(".kill").forEach((b,i)=>b.onclick=()=>{servers[i].h=!servers[i].h;b.textContent=servers[i].h?"Kill S"+(i+1):"Revive S"+(i+1)});
  function pick(ip){const healthy=servers.map((s,i)=>i).filter(i=>servers[i].h);if(!healthy.length)return -1;
    switch(sel.value){case"rr":rr=(rr+1)%healthy.length;return healthy[rr];
      case"wrr":if(!wrr.length)healthy.forEach(i=>{for(let k=0;k<servers[i].w;k++)wrr.push(i)});return wrr.shift();
      case"lc":return healthy.reduce((a,b)=>servers[a].load<=servers[b].load?a:b);
      case"hash":return healthy[hashStr(ip)%healthy.length];
      default:return healthy[Math.floor(Math.random()*healthy.length)]}}
  function loop(){t++;if(t%12===0){const ip="10.0.0."+Math.floor(Math.random()*6);const i=pick(ip);if(i>=0){pk.push({x:60,y:cv.height/2,tx:cv.width-120,ty:40+i*70,p:0,i,ip});counts[i]++;servers[i].load++;setTimeout(()=>servers[i].load--,1500+Math.random()*2500)}}
    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.fillStyle="#151c2c";ctx.strokeStyle="#5b8cff";ctx.lineWidth=2;roundRect(20,cv.height/2-25,80,50);ctx.fillStyle="#fff";ctx.font="12px sans-serif";ctx.textAlign="center";ctx.fillText("Clients",60,cv.height/2+4);
    ctx.fillStyle="#1b2538";ctx.strokeStyle="#ff6ad5";roundRect(cv.width/2-45,cv.height/2-30,90,60);ctx.fillStyle="#fff";ctx.fillText("Load",cv.width/2,cv.height/2-2);ctx.fillText("Balancer",cv.width/2,cv.height/2+14);
    servers.forEach((s,i)=>{const y=40+i*70;ctx.fillStyle=s.h?"#1a2a3a":"#3a1a1a";ctx.strokeStyle=s.h?"#2fd48a":"#ff5c7a";roundRect(cv.width-160,y-22,120,44);ctx.fillStyle="#fff";ctx.textAlign="left";ctx.fillText(`S${i+1} w=${s.w} ${s.h?"":"DOWN"}`,cv.width-150,y-4);ctx.fillStyle="#9aa6bf";ctx.fillText(`in-flight:${s.load} total:${counts[i]}`,cv.width-150,y+12);
      ctx.strokeStyle="#273146";ctx.beginPath();ctx.moveTo(cv.width/2+45,cv.height/2);ctx.lineTo(cv.width-160,y);ctx.stroke()});
    ctx.strokeStyle="#273146";ctx.beginPath();ctx.moveTo(100,cv.height/2);ctx.lineTo(cv.width/2-45,cv.height/2);ctx.stroke();
    pk=pk.filter(p=>p.p<1);pk.forEach(p=>{p.p+=0.012;let x,y;if(p.p<0.5){const q=p.p/0.5;x=100+(cv.width/2-145)*q;y=cv.height/2}else{const q=(p.p-0.5)/0.5;x=cv.width/2+45+(cv.width-160-cv.width/2-45)*q;y=cv.height/2+(p.ty-cv.height/2)*q}
      ctx.fillStyle=["#5b8cff","#2fd48a","#ffc857"][p.i];ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=8;ctx.beginPath();ctx.arc(x,y,5,0,7);ctx.fill();ctx.shadowBlur=0;if(sel.value==="hash"){ctx.fillStyle="#9aa6bf";ctx.font="9px monospace";ctx.fillText(p.ip.slice(-1),x,y-8)}});
    requestAnimationFrame(loop)}
  function roundRect(x,y,w,h){ctx.beginPath();ctx.roundRect(x,y,w,h,8);ctx.fill();ctx.stroke()}
  loop();
}

function initLRU(root){
  let cap=4,cache=[],hits=0,miss=0;const out=root.querySelector(".cells"),stats=root.querySelector(".stats"),inp=root.querySelector("input[type=text]");
  function access(k){const i=cache.indexOf(k);if(i>=0){hits++;cache.splice(i,1);cache.push(k)}else{miss++;if(cache.length>=cap){const ev=cache.shift();flash(ev)}cache.push(k)}render(k)}
  function flash(k){stats.innerHTML+=` <span style="color:#ff5c7a">evicted ${k}</span>`}
  function render(k){out.innerHTML=cache.map((c,i)=>`<div class="pill" style="font-size:1.1em;padding:8px 14px;${c===k?'border-color:#2fd48a;box-shadow:0 0 10px #2fd48a55':''}${i===0?'opacity:.6':''}">${c}</div>`).join("")+`<div class="tag" style="margin-left:10px">← LRU (next to evict) &nbsp;&nbsp; MRU →</div>`;
    stats.innerHTML=`hits: <b style="color:#2fd48a">${hits}</b> misses: <b style="color:#ff5c7a">${miss}</b> hit ratio: <b>${hits+miss?((hits/(hits+miss))*100).toFixed(0):0}%</b>`}
  root.querySelectorAll(".k").forEach(b=>b.onclick=()=>access(b.textContent));
  root.querySelector(".go").onclick=()=>{if(inp.value.trim())access(inp.value.trim());inp.value=""};
  root.querySelector(".capsel").onchange=e=>{cap=+e.target.value;while(cache.length>cap)cache.shift();render()};
  render();
}

function initQuorum(root){
  const n=root.querySelector(".n"),w=root.querySelector(".w"),r=root.querySelector(".r"),out=root.querySelector(".out");
  function upd(){const N=+n.value,W=+w.value,R=+r.value;w.max=N;r.max=N;root.querySelector(".nv").textContent=N;root.querySelector(".wv").textContent=W;root.querySelector(".rv").textContent=R;
    const strong=W+R>N;out.innerHTML=`<div class="kv"><b>W + R</b><span>${W+R} ${strong?'<span style="color:#2fd48a">&gt; N → strongly consistent reads (read set overlaps write set)</span>':'<span style="color:#ffc857">≤ N → reads may be stale (eventual consistency)</span>'}</span>
    <b>Write availability</b><span>tolerates ${N-W} node failure(s) for writes</span><b>Read availability</b><span>tolerates ${N-R} node failure(s) for reads</span>
    <b>Profile</b><span>${W===N?'Write-all / read-one: fast reads, slow fragile writes':W===1?'Write-one: fastest writes, weakest durability':R===1&&strong?'Read-one strong: heavy writes, light reads':'Balanced'}</span></div>
    <div style="margin-top:10px;display:flex;gap:6px">${Array.from({length:N},(_,i)=>`<div style="width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.8em;font-weight:700;background:${i<W&&i>=N-R?'#2fd48a':i<W?'#5b8cff':i>=N-R?'#ff6ad5':'#273146'}" title="${i<W?'in write set ':''}${i>=N-R?'in read set':''}">${i+1}</div>`).join("")}</div><div class="tag">blue = written to, pink = read from, green = overlap (guarantees fresh read)</div>`}
  [n,w,r].forEach(x=>x.oninput=upd);upd();
}

function initAvail(root){
  const sel=root.querySelector("select"),out=root.querySelector(".out");const chain=root.querySelector(".chain");
  function fmt(s){if(s<60)return s.toFixed(1)+" s";if(s<3600)return (s/60).toFixed(1)+" min";if(s<86400)return (s/3600).toFixed(2)+" h";return (s/86400).toFixed(2)+" days"}
  function upd(){const a=+sel.value;const yr=365.25*86400;out.innerHTML=`<div class="kv"><b>Per year</b><span>${fmt(yr*(1-a))}</span><b>Per month</b><span>${fmt(yr/12*(1-a))}</span><b>Per week</b><span>${fmt(yr/52*(1-a))}</span><b>Per day</b><span>${fmt(86400*(1-a))}</span></div>`;
    const k=+chain.value;root.querySelector(".chainv").textContent=k;const serial=Math.pow(a,k),par=1-Math.pow(1-a,2);
    root.querySelector(".comp").innerHTML=`<div class="kv"><b>${k} components in series</b><span>${(serial*100).toFixed(4)}% → ${fmt(yr*(1-serial))}/yr downtime <span class="tag">(availability multiplies: weakest links compound)</span></span><b>2 redundant copies in parallel</b><span>${(par*100).toFixed(6)}% → ${fmt(yr*(1-par))}/yr <span class="tag">(1 − (1−A)²: redundancy adds nines)</span></span></div>`}
  sel.onchange=upd;chain.oninput=upd;upd();
}

function initEstimator(root){
  const g=id=>root.querySelector("."+id);const out=g("out");
  function fmtN(n){if(n>=1e12)return (n/1e12).toFixed(2)+" T";if(n>=1e9)return (n/1e9).toFixed(2)+" B";if(n>=1e6)return (n/1e6).toFixed(2)+" M";if(n>=1e3)return (n/1e3).toFixed(1)+" K";return n.toFixed(0)}
  function fmtB(b){const u=["B","KB","MB","GB","TB","PB"];let i=0;while(b>=1024&&i<u.length-1){b/=1024;i++}return b.toFixed(2)+" "+u[i]}
  function upd(){const dau=+g("dau").value,rpu=+g("rpu").value,rw=+g("rw").value,size=+g("size").value,years=+g("yrs").value,rep=+g("rep").value;
    const reqDay=dau*rpu,qps=reqDay/86400,peak=qps*3,writes=qps/(rw+1),reads=qps-writes,storeDay=writes*86400*size,total=storeDay*365*years*rep,bw=reads*size;
    out.innerHTML=`<div class="kv"><b>Requests/day</b><span>${fmtN(reqDay)}</span><b>Avg QPS</b><span>${fmtN(qps)} <span class="tag">(÷ 86,400 ≈ ÷ 100k for mental math)</span></span><b>Peak QPS (×3)</b><span>${fmtN(peak)}</span><b>Reads / Writes per sec</b><span>${fmtN(reads)} / ${fmtN(writes)}</span><b>New storage per day</b><span>${fmtB(storeDay)}</span><b>Storage after ${years}y (×${rep} replication)</b><span><span class="big" style="font-size:1.3em">${fmtB(total)}</span></span><b>Read bandwidth</b><span>${fmtB(bw)}/s</span><b>Servers needed (@ ~${g("cap").value} QPS each)</b><span>≈ ${Math.ceil(peak/+g("cap").value)} for peak, ${Math.ceil(qps/+g("cap").value)} average</span><b>Cache 20% of daily reads (80/20 rule)</b><span>${fmtB(reads*86400*size*0.2)}</span></div>`}
  root.querySelectorAll("input,select").forEach(i=>i.oninput=upd);upd();
}

function initLatency(root){
  const data=[["L1 cache reference",0.5],["Branch mispredict",5],["L2 cache reference",7],["Mutex lock/unlock",25],["Main memory reference",100],["Compress 1KB with Snappy",3000],["Send 1KB over 1 Gbps network",10000],["Read 4KB randomly from NVMe SSD",20000],["Read 1MB sequentially from memory",250000],["Round trip within same datacenter",500000],["Read 1MB sequentially from SSD",1000000],["HDD disk seek",10000000],["Read 1MB sequentially from HDD",20000000],["Send packet CA→Netherlands→CA",150000000]];
  const fmt=ns=>ns<1000?ns+" ns":ns<1e6?(ns/1000).toFixed(0)+" µs":(ns/1e6).toFixed(0)+" ms";
  root.innerHTML=data.map(([n,v])=>`<div class="bar"><span>${n}</span><div class="track"><div class="fill" data-w="${(Math.log10(v*2)/Math.log10(3e8)*100).toFixed(1)}%"></div></div><span class="v">${fmt(v)}</span></div>`).join("")+`<div class="tag" style="margin-top:8px">Log scale. Memory → SSD → network → disk → cross-continent is each roughly an order of magnitude or more. Source: Jeff Dean / Peter Norvig numbers, updated.</div>`;
}

function initRaft(root){
  const cv=root.querySelector("canvas"),ctx=cv.getContext("2d"),log=root.querySelector(".log");
  const N=5;let nodes=Array.from({length:N},(_,i)=>({id:i,state:"follower",term:1,timeout:1500+Math.random()*1500,elapsed:0,alive:true,votes:0,votedFor:null}));
  let msgs=[],leader=null,lastT=performance.now(),logEntries=0;
  function say(s){log.textContent=`[t=${nodes[0].term}] ${s}\n`+log.textContent.split("\n").slice(0,30).join("\n")}
  function pos(i){const a=i/N*Math.PI*2-Math.PI/2;return [cv.width/2+Math.cos(a)*130,cv.height/2+Math.sin(a)*110]}
  function send(from,to,type,color,cb){const [x1,y1]=pos(from),[x2,y2]=pos(to);msgs.push({x1,y1,x2,y2,p:0,color,cb,type})}
  function startElection(n){n.state="candidate";n.term++;n.votes=1;n.votedFor=n.id;n.elapsed=0;n.timeout=1500+Math.random()*1500;say(`Node ${n.id} timed out → candidate, term ${n.term}, requests votes`);
    nodes.forEach(o=>{if(o.id!==n.id&&o.alive)send(n.id,o.id,"vote-req","#ffc857",()=>{if(o.term<n.term){o.term=n.term;o.votedFor=null;o.state="follower"}if(o.votedFor===null&&o.alive){o.votedFor=n.id;o.elapsed=0;send(o.id,n.id,"vote","#2fd48a",()=>{if(n.state==="candidate"){n.votes++;if(n.votes>N/2){n.state="leader";leader=n;say(`Node ${n.id} wins with ${n.votes} votes → LEADER`);nodes.forEach(z=>{if(z!==n&&z.state==="candidate")z.state="follower"})}}})}})})}
  function loop(now){const dt=now-lastT;lastT=now;
    nodes.forEach(n=>{if(!n.alive)return;if(n.state==="leader"){n.elapsed+=dt;if(n.elapsed>600){n.elapsed=0;nodes.forEach(o=>{if(o!==n&&o.alive)send(n.id,o.id,"hb","#5b8cff",()=>{if(o.term<=n.term){o.term=n.term;o.elapsed=0;if(o.state!=="follower"){o.state="follower"}o.votedFor=n.id}})})}}else{n.elapsed+=dt;if(n.elapsed>n.timeout)startElection(n)}});
    if(leader&&!leader.alive)leader=null;
    ctx.clearRect(0,0,cv.width,cv.height);
    nodes.forEach((n,i)=>{const [x,y]=pos(i);ctx.beginPath();ctx.arc(x,y,26,0,7);ctx.fillStyle=!n.alive?"#3a1a1a":n.state==="leader"?"#2fd48a":n.state==="candidate"?"#ffc857":"#1b2538";ctx.fill();ctx.strokeStyle=n.alive?"#5b8cff":"#ff5c7a";ctx.lineWidth=2;ctx.stroke();
      ctx.fillStyle=n.state==="follower"||!n.alive?"#fff":"#000";ctx.font="bold 12px monospace";ctx.textAlign="center";ctx.fillText("N"+n.id,x,y-2);ctx.font="10px monospace";ctx.fillText("t"+n.term,x,y+11);
      if(n.alive&&n.state!=="leader"){ctx.strokeStyle="#ffc85777";ctx.beginPath();ctx.arc(x,y,32,-Math.PI/2,-Math.PI/2+Math.PI*2*(n.elapsed/n.timeout));ctx.stroke()}
      ctx.fillStyle="#9aa6bf";ctx.fillText(n.alive?n.state:"crashed",x,y+46)});
    msgs=msgs.filter(m=>m.p<1);msgs.forEach(m=>{m.p+=dt/500;if(m.p>=1){m.cb&&m.cb();return}const x=m.x1+(m.x2-m.x1)*m.p,y=m.y1+(m.y2-m.y1)*m.p;ctx.fillStyle=m.color;ctx.shadowColor=m.color;ctx.shadowBlur=8;ctx.beginPath();ctx.arc(x,y,m.type==="hb"?3:5,0,7);ctx.fill();ctx.shadowBlur=0});
    requestAnimationFrame(loop)}
  root.querySelector(".kill-leader").onclick=()=>{if(leader){say(`Leader N${leader.id} crashed! followers will time out...`);leader.alive=false;leader=null}};
  root.querySelector(".revive").onclick=()=>{nodes.filter(n=>!n.alive).forEach(n=>{n.alive=true;n.state="follower";n.elapsed=0;n.votedFor=null;say(`N${n.id} rejoins as follower, learns current term from heartbeats`)})};
  root.querySelector(".partition").onclick=()=>{const dead=nodes.filter(n=>n.alive);if(dead.length>=3){const victims=dead.slice(0,Math.ceil(N/2)+1);victims.forEach(v=>v.alive=false);say(`Crashed ${victims.length} of ${N} nodes → no majority → cluster UNAVAILABLE (CP). Revive to recover.`);leader=null}};
  say("5 nodes start as followers with random election timeouts (ring shows timer)");
  requestAnimationFrame(loop);
}

function initTCP(root){
  const cv=root.querySelector("canvas"),ctx=cv.getContext("2d");let phase=0,pk=[],cwnd=1,ssthresh=16,hist=[],t=0,mode="slow";
  const steps=["SYN →  client: seq=x","← SYN-ACK  server: seq=y, ack=x+1","ACK →  client: ack=y+1  (ESTABLISHED)","Data flows. cwnd grows: slow start doubles each RTT until ssthresh, then +1/RTT (congestion avoidance)","Loss detected (3 dup ACKs) → ssthresh = cwnd/2, cwnd halves (fast recovery) [Reno]","FIN → / ← ACK / ← FIN / ACK →  then TIME_WAIT (2×MSL) on the active closer"];
  const txt=root.querySelector(".step-text");
  function draw(){ctx.clearRect(0,0,cv.width,cv.height);const cx=80,sx=cv.width-80;ctx.strokeStyle="#5b8cff";ctx.lineWidth=2;[cx,sx].forEach(x=>{ctx.beginPath();ctx.moveTo(x,40);ctx.lineTo(x,cv.height-20);ctx.stroke()});
    ctx.fillStyle="#fff";ctx.font="bold 13px sans-serif";ctx.textAlign="center";ctx.fillText("Client",cx,25);ctx.fillText("Server",sx,25);
    pk.forEach(p=>{ctx.strokeStyle=p.c;ctx.beginPath();ctx.moveTo(p.dir>0?cx:sx,p.y);ctx.lineTo(p.dir>0?cx+(sx-cx)*p.p:sx-(sx-cx)*p.p,p.y+30*p.p);ctx.stroke();ctx.fillStyle=p.c;ctx.font="11px monospace";ctx.textAlign=p.dir>0?"left":"right";ctx.fillText(p.l,p.dir>0?cx+10:sx-10,p.y-4)});
    if(phase>=3){const gx=cv.width/2-110,gy=cv.height-30,gw=220,gh=90;ctx.strokeStyle="#273146";ctx.strokeRect(gx,gy-gh,gw,gh);ctx.fillStyle="#9aa6bf";ctx.font="10px monospace";ctx.textAlign="left";ctx.fillText("cwnd over RTTs",gx+4,gy-gh+12);ctx.strokeStyle="#2fd48a";ctx.beginPath();hist.forEach((v,i)=>{const x=gx+i*(gw/40),y=gy-Math.min(gh-4,v*(gh/40));i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();ctx.strokeStyle="#ffc85788";ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(gx,gy-ssthresh*(gh/40));ctx.lineTo(gx+gw,gy-ssthresh*(gh/40));ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#ffc857";ctx.fillText("ssthresh="+ssthresh,gx+gw-90,gy-ssthresh*(gh/40)-3)}}
  function anim(){pk.forEach(p=>p.p=Math.min(1,p.p+0.03));if(phase===3){t++;if(t%20===0&&hist.length<40){hist.push(cwnd);if(cwnd<ssthresh)cwnd*=2;else cwnd+=1;if(cwnd>=40){phase=4;txt.textContent=steps[4];ssthresh=Math.floor(cwnd/2);cwnd=ssthresh;}}}if(phase===4){t++;if(t%20===0&&hist.length<40){hist.push(cwnd);cwnd+=1}}draw();requestAnimationFrame(anim)}
  const seq=[[1,"SYN seq=1000",80,"#ffc857"],[-1,"SYN-ACK seq=5000 ack=1001",120,"#2fd48a"],[1,"ACK ack=5001",160,"#5b8cff"]];
  root.querySelector(".next").onclick=()=>{phase=Math.min(5,phase+1);txt.textContent=steps[phase];if(phase<=2){pk.push({dir:seq[phase-1][0],l:seq[phase-1][1],y:seq[phase-1][2]+ (phase-1)*0,p:0,c:seq[phase-1][3]})}
    if(phase===3){pk.push({dir:1,l:"HTTP GET / (data)",y:210,p:0,c:"#dfe6ff"})}
    if(phase===5){pk.push({dir:1,l:"FIN",y:250,p:0,c:"#ff5c7a"},{dir:-1,l:"ACK",y:275,p:0,c:"#ff5c7a"},{dir:-1,l:"FIN",y:300,p:0,c:"#ff5c7a"},{dir:1,l:"ACK → TIME_WAIT",y:325,p:0,c:"#ff5c7a"})}};
  root.querySelector(".reset").onclick=()=>{phase=0;pk=[];hist=[];cwnd=1;ssthresh=16;txt.textContent="Press Next to start the 3-way handshake."};
  txt.textContent="Press Next to start the 3-way handshake.";anim();
}

function initCAP(root){
  const net=root.querySelector(".net"),out=root.querySelector(".out");let partition=false,choice="C";
  net.onclick=()=>{partition=!partition;net.textContent=partition?"Heal partition":"Cut the network (partition)";upd()};
  root.querySelectorAll("input[name=cap]").forEach(r=>r.onchange=()=>{choice=r.value;upd()});
  function upd(){if(!partition){out.innerHTML=`<div class="callout good"><b>Network healthy</b>Both replicas sync. You get Consistency AND Availability. CAP only forces a choice <i>during</i> a partition. (PACELC: Else, trade Latency vs Consistency.)</div>`;return}
    out.innerHTML=choice==="C"?`<div class="callout bad"><b>CP: refuse to answer rather than be wrong</b>Replica B can't reach the leader → it returns an <b>error / timeout</b> for writes (and possibly reads). Data is never inconsistent. Examples: ZooKeeper, etcd, HBase, Spanner-ish, a bank balance.</div>`:`<div class="callout warn"><b>AP: always answer, maybe stale</b>Both sides accept reads & writes. Replica B may serve stale data; conflicting writes must be reconciled later (last-write-wins, vector clocks, CRDTs). Examples: Cassandra, DynamoDB (default), DNS, shopping cart.</div>`}
  upd();
}

function initBackoff(root){
  const out=root.querySelector(".out"),jit=root.querySelector(".jit");function upd(){const base=100,cap=10000;let s="";for(let i=0;i<7;i++){const exp=Math.min(cap,base*2**i);const v=jit.checked?Math.floor(Math.random()*exp):exp;s+=`<div class="bar"><span>retry ${i+1}</span><div class="track"><div class="fill" style="width:${v/cap*100}%;transition:none"></div></div><span class="v">${v} ms</span></div>`}out.innerHTML=s}
  jit.onchange=upd;root.querySelector(".re").onclick=upd;upd();
}

function initSubnet(root){
  const inp=root.querySelector("input"),out=root.querySelector(".out");
  function upd(){const m=inp.value.trim().match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)\/(\d+)$/);if(!m){out.textContent="format: 10.0.0.0/24";return}
    const o=m.slice(1,5).map(Number),p=+m[5];if(o.some(x=>x>255)||p>32){out.textContent="invalid";return}
    const ip=((o[0]<<24)|(o[1]<<16)|(o[2]<<8)|o[3])>>>0,mask=p===0?0:(~0<<(32-p))>>>0,net=(ip&mask)>>>0,bc=(net|~mask)>>>0;const f=x=>[x>>>24,(x>>>16)&255,(x>>>8)&255,x&255].join(".");
    out.innerHTML=`<div class="kv"><b>Mask</b><span>${f(mask)} &nbsp;<code>${mask.toString(2).padStart(32,"0").replace(/(.{8})/g,"$1 ")}</code></span><b>Network</b><span>${f(net)}</span><b>Broadcast</b><span>${f(bc)}</span><b>Usable hosts</b><span>${p>=31?(p===31?2:1):2**(32-p)-2} &nbsp;(${f(net+1)} – ${f(bc-1)})</span><b>Total addresses</b><span>${2**(32-p)}</span></div>`}
  inp.oninput=upd;upd();
}

/* ===== boot ===== */
document.addEventListener("DOMContentLoaded",()=>{
  buildTopbar();buildSidebar();initComponents();
  document.querySelectorAll("[data-sim]").forEach(el=>{const f={chash:initConsistentHash,token:initTokenBucket,lb:initLB,lru:initLRU,quorum:initQuorum,avail:initAvail,est:initEstimator,latency:initLatency,raft:initRaft,tcp:initTCP,cap:initCAP,backoff:initBackoff,subnet:initSubnet}[el.dataset.sim];f&&f(el)});
});
