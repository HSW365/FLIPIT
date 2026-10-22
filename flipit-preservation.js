/* FLIPIT PRESERVATION — property preservation services for foreclosed / bank-owned homes.
   Service catalog, work orders with HUD-style photo checklists, occupancy inspection reports,
   invoices and earnings tracking. Saved in this browser (localStorage).
*/
(function(){
  const KEY="flipit_preservation_v1";
  const SERVICES=[
    {id:"occupancy",name:"Occupancy inspection",unit:"inspection",rate:20,
     what:"Drive-by field visit to confirm whether a property in default is occupied or vacant and report its condition back to the servicer.",
     steps:["Address / house number photo","Front of property photo","Street view both directions","Occupancy indicators recorded","Visible damage or hazards photographed","Door card / contact attempt (if required)","Report submitted in client portal"]},
    {id:"securing",name:"Lock change & securing",unit:"property",rate:65,
     what:"Re-key or replace locks, secure doors and windows, and board openings so the vacant home can’t be entered or damaged further.",
     steps:["Before photos of every entry point","Lock change / re-key on main entry (lockbox installed)","Secondary entries secured","Broken windows / doors boarded","Pools and hazards secured","Posting / notice placed","After photos of every entry point"]},
    {id:"trashout",name:"Trash-out / debris removal",unit:"cubic yard",rate:35,
     what:"Remove personal property and debris left behind, haul it to a disposal site, and broom-sweep the interior.",
     steps:["Before photos of every room, garage and yard","Debris measured in cubic yards (L × W × H ÷ 27)","Personal property / hazardous items documented","Debris removed and hauled","Dump receipt saved","Broom-swept interior","After photos from same angles"]},
    {id:"lawn",name:"Lawn care & maintenance",unit:"cut",rate:55,
     what:"Initial and recurring grass cuts, shrub trimming and exterior upkeep to keep the property code-compliant and marketable.",
     steps:["Before photos (front, back, sides)","Grass height shown with measuring stick","Cut, edge and trim","Shrubs trimmed off structure","Clippings and debris removed","After photos from same angles"]},
    {id:"winterization",name:"Winterization",unit:"property",rate:125,
     what:"Drain the plumbing and heating systems, blow out lines, add antifreeze to traps and post winterization notices so pipes don’t freeze and burst.",
     steps:["Water shut off at main / curb","Water heater and lines drained","Lines blown out with air compressor","Antifreeze in all traps and toilets","Pressure test (dry / wet heat as required)","Winterization stickers posted","Before / after photos of every fixture"]}
  ];
  const STATUSES=["Assigned","In field","Photos done","Submitted","Paid"];
  const defaults={rates:Object.fromEntries(SERVICES.map(s=>[s.id,s.rate])),orders:[],clients:[],proj:{jobs:8,days:5}};
  let st;try{st=JSON.parse(localStorage.getItem(KEY))||defaults}catch{st=defaults}
  st.rates={...defaults.rates,...(st.rates||{})};st.orders=st.orders||[];st.clients=st.clients||[];st.proj=st.proj||defaults.proj;
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st))}catch{}render()};
  const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(Number(n)||0);
  const money2=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(n)||0);
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const svc=id=>SERVICES.find(s=>s.id===id)||SERVICES[0];
  const total=o=>(+o.qty||0)*(+o.rate||0);
  const $=id=>document.getElementById(id);
  function biz(){try{return JSON.parse(localStorage.getItem("flipit_workspace_v2")||"{}").settings||{}}catch{return {}}}

  function css(){
    const s=document.createElement("style");
    s.textContent=`
#preservation .pvhero{background:var(--ink);color:#fff;border-color:var(--ink);display:grid;grid-template-columns:1.3fr 1fr;gap:28px;align-items:end}
#preservation .pvhero h2{font-size:clamp(30px,3.6vw,46px);line-height:.95;margin:0 0 12px;font-weight:700}
#preservation .pvhero h2 span{color:var(--brand)}
#preservation .pvhero p{color:#B9BAC0;margin:0;max-width:560px}
#preservation .pvfacts{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-top:1px solid #3A3B40}
#preservation .pvfacts div{padding:14px 12px 0 0}
#preservation .pvfacts b{display:block;font-family:var(--mono);font-size:22px;color:var(--brand);font-weight:600}
#preservation .pvfacts small{color:#8E9097;font-size:12px}
#preservation .svcgrid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
#preservation .svc{border:1px solid var(--line);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:10px;background:#FAFAF7}
#preservation .svc .n{font-family:var(--mono);font-size:12px;color:var(--brand);font-weight:600}
#preservation .svc h3{margin:0;font-size:18px}
#preservation .svc p{margin:0;font-size:13px;color:var(--muted);flex:1}
#preservation .svc .rate{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)}
#preservation .svc .rate input{width:84px;padding:7px 9px;font-size:14px}
#preservation .wo{border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:12px}
#preservation .wohead{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start}
#preservation .wohead b.amt{font-family:var(--mono);font-size:20px}
#preservation .steps{display:flex;gap:4px;margin:12px 0}
#preservation .steps span{flex:1;height:6px;border-radius:3px;background:var(--line)}
#preservation .steps span.on{background:var(--brand)}
#preservation .steps span.paid{background:var(--good)}
#preservation .wochk{display:grid;grid-template-columns:repeat(2,1fr);gap:0 18px}
#preservation .wochk label{font-weight:500;color:var(--ink);font-size:13px;display:flex;gap:8px;align-items:flex-start;margin:6px 0}
#preservation .wochk input{width:auto;margin-top:3px;accent-color:var(--brand)}
#preservation details summary{cursor:pointer;font-size:13px;font-weight:600;color:var(--muted);margin-top:4px}
#preservation .filters{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
#preservation .chip{border:1px solid var(--line);background:#fff;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--sans);color:var(--muted)}
#preservation .chip.on{background:var(--ink);border-color:var(--ink);color:#fff}
#preservation .occ{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
#preservation .occ label{border:1px solid var(--line);border-radius:10px;padding:10px;display:flex;gap:8px;align-items:center;color:var(--ink);font-weight:600;font-size:13px;cursor:pointer;margin:0}
#preservation .occ input{width:auto;accent-color:var(--brand)}
#preservation .ind{display:grid;grid-template-columns:repeat(2,1fr);gap:0 14px}
#preservation .ind label{display:flex;gap:8px;align-items:center;font-weight:500;color:var(--ink);font-size:13px;margin:6px 0}
#preservation .ind input{width:auto;accent-color:var(--brand)}
#preservation .projout{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
@media(max-width:1100px){#preservation .svcgrid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:900px){#preservation .pvhero{grid-template-columns:1fr}#preservation .wochk,#preservation .ind{grid-template-columns:1fr}#preservation .projout{grid-template-columns:1fr}}
@media(max-width:560px){#preservation .svcgrid,#preservation .occ{grid-template-columns:1fr}#preservation .pvfacts{grid-template-columns:1fr 1fr}}`;
    document.head.appendChild(s);
  }

  function panel(){
    if($("preservation"))return;
    const tabs=document.querySelector(".tabs"),btn=document.createElement("button");
    btn.className="tab";btn.dataset.tab="preservation";btn.textContent="Preservation";
    const settingsTab=tabs.querySelector('[data-tab="settings"]');tabs.insertBefore(btn,settingsTab);
    btn.onclick=()=>showTab("preservation");
    const opts=SERVICES.map(s=>`<option value="${s.id}">${s.name}</option>`).join("");
    const sec=document.createElement("section");sec.id="preservation";sec.className="panel";
    sec.innerHTML=`<div class="grid">
<div class="card span12 pvhero">
 <div><h2>Property preservation. <span>Get paid to protect bank-owned homes.</span></h2>
 <p>When a home goes into foreclosure and the family leaves, the lender has to keep it secured and maintained to HUD standards. Preservation companies hire field vendors to inspect, secure, clean out, cut and winterize those homes. Run that work from here: rates, work orders, photo checklists, inspection reports and invoices.</p></div>
 <div class="pvfacts"><div><b>5</b><small>Core services</small></div><div><b id="pvMonthHero">$0</b><small>Paid this month</small></div><div><b id="pvOpenHero">0</b><small>Open work orders</small></div></div>
</div>

<div class="card span12"><h2>Services</h2><p class="muted" style="margin:-6px 0 14px">Set the rate your client pays you. Rates vary by client, region and order, so match them to your vendor agreement.</p>
 <div class="svcgrid" id="pvServices"></div></div>

<div class="card span4"><h2>New work order</h2>
 <form id="pvForm"><div class="formgrid">
 <div class="full"><label>Service</label><select name="service">${opts}</select></div>
 <div class="full"><label>Property address</label><input name="address" required placeholder="123 Main St, Vineland, NJ"></div>
 <div class="full"><label>Client / preservation company</label><input name="client" list="pvClientList" placeholder="Who assigned the order"><datalist id="pvClientList"></datalist></div>
 <div><label>Order / loan #</label><input name="ref" placeholder="WO-10421"></div>
 <div><label>Due date</label><input name="due" type="date"></div>
 <div><label>Quantity</label><input name="qty" type="number" min="0" step=".5" value="1"></div>
 <div><label>Rate ($)</label><input name="rate" type="number" min="0" step=".01"></div>
 <div class="full"><label>Notes / instructions</label><textarea name="notes" placeholder="Lockbox code, access notes, client instructions"></textarea></div>
 </div><br><button class="btn">Create work order</button></form>
 <div class="notice">Most preservation work doesn’t require a real-estate license, but you may need general liability insurance, a contractor or home-improvement registration, and a waste-hauling permit depending on your state. Confirm local requirements before taking orders.</div>
</div>

<div class="card span8"><h2>Work orders</h2>
 <div class="statgrid" style="margin-bottom:16px">
  <div class="stat"><span class="muted">Open</span><b id="pvOpen">$0</b></div>
  <div class="stat"><span class="muted">Submitted, awaiting pay</span><b id="pvAwait">$0</b></div>
  <div class="stat"><span class="muted">Paid this month</span><b id="pvMonth">$0</b></div>
  <div class="stat"><span class="muted">Paid all time</span><b id="pvAll">$0</b></div>
 </div>
 <div class="filters" id="pvFilters"></div>
 <div id="pvOrders"></div>
</div>

<div class="card span6"><h2>Occupancy inspection report</h2><p class="muted" style="margin:-6px 0 14px">Fill this on site. It attaches to the work order and prints with the invoice.</p>
 <form id="pvOccForm">
 <label>Work order</label><select name="order" id="pvOccOrder"></select><br><br>
 <label>Occupancy status</label>
 <div class="occ"><label><input type="radio" name="status" value="Occupied" required>Occupied</label><label><input type="radio" name="status" value="Vacant">Vacant</label><label><input type="radio" name="status" value="Unable to determine">Unable to tell</label></div><br>
 <label>Indicators observed</label>
 <div class="ind">${["Utilities on (meter running, lights)","Personal property visible","Vehicles in driveway","Window coverings in place","Mail / packages accumulating","Lawn maintained","Contact made with occupant","Door card left"].map((x,i)=>`<label><input type="checkbox" name="ind" value="${esc(x)}">${esc(x)}</label>`).join("")}</div><br>
 <div class="formgrid">
 <div><label>Exterior condition</label><select name="condition"><option>Good</option><option>Fair</option><option>Poor</option><option>Damaged</option></select></div>
 <div><label>Property type</label><select name="ptype"><option>Single family</option><option>Multi-family</option><option>Condo / townhome</option><option>Mobile home</option><option>Vacant land</option></select></div>
 <div class="full"><label>Damage, hazards or code issues</label><textarea name="damage" placeholder="Roof, windows, doors, mold, code violation notices, safety hazards"></textarea></div>
 <div><label>Photos taken</label><input name="photos" type="number" min="0" value="0"></div>
 <div><label>Inspected at</label><input name="at" type="datetime-local"></div>
 </div><br><button class="btn">Save inspection to work order</button></form>
</div>

<div class="card span6"><h2>Earnings planner</h2><p class="muted" style="margin:-6px 0 14px">What your current rates add up to at a given pace.</p>
 <div class="formgrid">
 <div><label>Jobs per day</label><input id="pvJobs" type="number" min="0" step="1"></div>
 <div><label>Work days per week</label><input id="pvDays" type="number" min="0" max="7" step="1"></div>
 <div class="full"><label>Service mix</label><select id="pvMix"><option value="avg">Average of all five services</option>${opts}</select></div>
 </div>
 <div class="projout"><div class="stat"><span class="muted">Per day</span><b id="pvPD">$0</b></div><div class="stat"><span class="muted">Per week</span><b id="pvPW">$0</b></div><div class="stat"><span class="muted">Per month</span><b id="pvPM">$0</b></div></div>
 <p class="muted" style="margin-top:12px">Gross, before gas, dump fees, materials, insurance and helpers. A trash-out is priced per cubic yard, so one large clean-out can outweigh a day of inspections.</p>
 <h3 style="margin-top:22px">Clients</h3>
 <form id="pvClientForm"><div class="formgrid">
 <div><label>Company</label><input name="name" required placeholder="Preservation company"></div>
 <div><label>Contact / email</label><input name="contact"></div>
 <div><label>Vendor portal URL</label><input name="portal" type="url" placeholder="https://"></div>
 <div><label>Pay terms</label><input name="terms" placeholder="Net 30"></div>
 </div><br><button class="btn ghost">Save client</button></form>
 <div id="pvClients" style="margin-top:10px"></div>
</div>
</div>`;
    const footer=document.querySelector("main .footer");
    document.querySelector("main").insertBefore(sec,footer||null);
  }

  let filter="Active";
  function render(){
    if(!$("preservation"))return;
    $("pvServices").innerHTML=SERVICES.map((s,i)=>`<div class="svc"><span class="n">0${i+1}</span><h3>${s.name}</h3><p>${s.what}</p>
      <div class="rate">$<input type="number" min="0" step=".01" data-rate="${s.id}" value="${st.rates[s.id]}" aria-label="${s.name} rate"> per ${s.unit}</div>
      <button class="btn small alt" data-new="${s.id}">New order</button></div>`).join("");
    $("pvServices").querySelectorAll("[data-rate]").forEach(x=>x.onchange=()=>{st.rates[x.dataset.rate]=+x.value||0;save()});
    $("pvServices").querySelectorAll("[data-new]").forEach(x=>x.onclick=()=>{const f=$("pvForm");f.service.value=x.dataset.new;f.rate.value=st.rates[x.dataset.new];f.address.focus()});

    const now=new Date(),m=now.getMonth(),y=now.getFullYear();
    const open=st.orders.filter(o=>STATUSES.indexOf(o.status)<3),sub=st.orders.filter(o=>o.status==="Submitted"),paid=st.orders.filter(o=>o.status==="Paid");
    const paidMonth=paid.filter(o=>{const d=new Date(o.paidAt||0);return d.getMonth()===m&&d.getFullYear()===y});
    const sum=a=>a.reduce((t,o)=>t+total(o),0);
    $("pvOpen").textContent=money(sum(open));$("pvAwait").textContent=money(sum(sub));$("pvMonth").textContent=money(sum(paidMonth));$("pvAll").textContent=money(sum(paid));
    $("pvMonthHero").textContent=money(sum(paidMonth));$("pvOpenHero").textContent=open.length;

    const fs=["Active",...STATUSES,"All"];
    $("pvFilters").innerHTML=fs.map(f=>`<button class="chip${f===filter?" on":""}" data-f="${f}">${f}</button>`).join("");
    $("pvFilters").querySelectorAll("[data-f]").forEach(x=>x.onclick=()=>{filter=x.dataset.f;render()});
    const list=st.orders.map((o,i)=>({o,i})).filter(({o})=>filter==="All"||(filter==="Active"?o.status!=="Paid":o.status===filter));
    $("pvOrders").innerHTML=list.length?list.map(({o,i})=>{
      const s=svc(o.service),si=STATUSES.indexOf(o.status),done=(o.checks||[]).filter(Boolean).length;
      const late=o.due&&si<3&&new Date(o.due+"T23:59")<now;
      return `<div class="wo"><div class="wohead"><div><b>${esc(o.address)}</b><br><small class="muted">${esc(s.name)} · ${esc(o.client||"No client")}${o.ref?" · "+esc(o.ref):""}${o.due?" · due "+esc(o.due):""}</small><br>
        <span class="tag${o.status==="Paid"?"":si>=3?"":" warn"}">${esc(o.status)}</span> ${late?'<span class="tag bad">Past due</span>':""} ${o.inspection?'<span class="tag">Inspection: '+esc(o.inspection.status)+'</span>':""}</div>
        <div style="text-align:right"><b class="amt">${money2(total(o))}</b><br><small class="muted">${o.qty} × ${money2(o.rate)} / ${s.unit}</small></div></div>
        <div class="steps">${STATUSES.map((x,k)=>`<span class="${k<=si?(o.status==="Paid"?"paid":"on"):""}" title="${x}"></span>`).join("")}</div>
        <details><summary>Field checklist · ${done}/${s.steps.length} done</summary><div class="wochk">${s.steps.map((x,k)=>`<label><input type="checkbox" data-chk="${i}:${k}"${(o.checks||[])[k]?" checked":""}>${esc(x)}</label>`).join("")}</div>${o.notes?`<p class="muted">${esc(o.notes)}</p>`:""}</details>
        <div class="actions" style="margin-top:12px">${si<STATUSES.length-1?`<button class="btn small" data-adv="${i}">Mark ${STATUSES[si+1].toLowerCase()}</button>`:""}${si>0?`<button class="btn small ghost" data-back="${i}">Undo</button>`:""}<button class="btn small ghost" data-inv="${i}">Invoice</button><button class="btn small ghost" data-del="${i}">Delete</button></div></div>`}).join(""):`<div class="empty">${st.orders.length?"No work orders in this view.":"No work orders yet. Pick a service and create your first one."}</div>`;
    const O=$("pvOrders");
    O.querySelectorAll("[data-chk]").forEach(x=>x.onchange=()=>{const [i,k]=x.dataset.chk.split(":").map(Number),o=st.orders[i];o.checks=o.checks||[];o.checks[k]=x.checked;save()});
    O.querySelectorAll("[data-adv]").forEach(x=>x.onclick=()=>{const o=st.orders[+x.dataset.adv],si=STATUSES.indexOf(o.status);
      if(STATUSES[si+1]==="Submitted"){const s=svc(o.service),done=(o.checks||[]).filter(Boolean).length;if(done<s.steps.length&&!confirm(`Only ${done} of ${s.steps.length} checklist items are done. Missing photos are the top reason orders get kicked back. Submit anyway?`))return}
      o.status=STATUSES[si+1];if(o.status==="Paid")o.paidAt=Date.now();if(o.status==="Submitted")o.submittedAt=Date.now();save()});
    O.querySelectorAll("[data-back]").forEach(x=>x.onclick=()=>{const o=st.orders[+x.dataset.back];o.status=STATUSES[Math.max(0,STATUSES.indexOf(o.status)-1)];if(o.status!=="Paid")delete o.paidAt;save()});
    O.querySelectorAll("[data-del]").forEach(x=>x.onclick=()=>{if(confirm("Delete this work order?")){st.orders.splice(+x.dataset.del,1);save()}});
    O.querySelectorAll("[data-inv]").forEach(x=>x.onclick=()=>invoice(+x.dataset.inv));

    const occ=st.orders.map((o,i)=>({o,i})).filter(({o})=>o.service==="occupancy"&&o.status!=="Paid");
    const sel=$("pvOccOrder"),cur=sel.value;
    sel.innerHTML=occ.length?occ.map(({o,i})=>`<option value="${i}">${esc(o.address)}${o.ref?" · "+esc(o.ref):""}</option>`).join(""):'<option value="">Create an occupancy inspection work order first</option>';
    if(cur&&occ.some(({i})=>String(i)===cur))sel.value=cur;

    $("pvClientList").innerHTML=st.clients.map(c=>`<option value="${esc(c.name)}">`).join("");
    $("pvClients").innerHTML=st.clients.length?st.clients.map((c,i)=>`<div class="row"><span><b style="font-family:var(--sans)">${esc(c.name)}</b><br><small class="muted">${esc(c.contact||"")}${c.terms?" · "+esc(c.terms):""}</small></span><div class="actions">${c.portal?`<a class="btn small ghost" href="${esc(c.portal)}" target="_blank" rel="noopener">Portal</a>`:""}<button class="btn small ghost" data-cdel="${i}">Delete</button></div></div>`).join(""):'<div class="muted">Banks rarely hire field vendors directly. Work comes through national and regional preservation companies, so save the ones you sign vendor agreements with here.</div>';
    $("pvClients").querySelectorAll("[data-cdel]").forEach(x=>x.onclick=()=>{st.clients.splice(+x.dataset.cdel,1);save()});
    proj();
  }

  function proj(){
    const jobs=+$("pvJobs").value||0,days=+$("pvDays").value||0,mix=$("pvMix").value;
    st.proj={jobs,days,mix};try{localStorage.setItem(KEY,JSON.stringify(st))}catch{}
    const per=mix==="avg"?SERVICES.reduce((t,s)=>t+(+st.rates[s.id]||0),0)/SERVICES.length:(+st.rates[mix]||0);
    const d=jobs*per;$("pvPD").textContent=money(d);$("pvPW").textContent=money(d*days);$("pvPM").textContent=money(d*days*52/12);
  }

  function invoice(i){
    const o=st.orders[i],s=svc(o.service),b=biz(),n="INV-"+String(o.created||Date.now()).slice(-6),w=window.open("","_blank");
    if(!w){alert("Allow pop-ups to open the invoice.");return}
    const ins=o.inspection?`<h3>Occupancy inspection</h3><table><tr><td>Status</td><td><b>${esc(o.inspection.status)}</b></td></tr><tr><td>Indicators</td><td>${esc((o.inspection.indicators||[]).join(", ")||"None recorded")}</td></tr><tr><td>Exterior condition</td><td>${esc(o.inspection.condition)}</td></tr><tr><td>Property type</td><td>${esc(o.inspection.ptype)}</td></tr><tr><td>Damage / hazards</td><td>${esc(o.inspection.damage||"None noted")}</td></tr><tr><td>Photos</td><td>${esc(o.inspection.photos)}</td></tr><tr><td>Inspected</td><td>${esc(o.inspection.at?new Date(o.inspection.at).toLocaleString():"")}</td></tr></table>`:"";
    const done=(o.checks||[]).filter(Boolean).length;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${n} · ${esc(o.address)}</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans+Condensed:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>body{font-family:"IBM Plex Sans",system-ui,sans-serif;color:#16171A;max-width:780px;margin:40px auto;padding:0 24px;font-size:14px;line-height:1.5}
h1{font-family:"IBM Plex Sans Condensed",sans-serif;font-size:40px;margin:0;letter-spacing:-.01em}h3{font-family:"IBM Plex Sans Condensed",sans-serif;font-size:18px;margin:28px 0 8px}
.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:4px solid #FF5A1F;padding-bottom:18px}.logo{font-family:"IBM Plex Sans Condensed",sans-serif;font-weight:700;font-size:22px}
table{width:100%;border-collapse:collapse}td,th{padding:10px 8px;border-bottom:1px solid #DCDCD5;text-align:left;vertical-align:top}th{font-size:12px;color:#5F6168}.r{text-align:right;font-family:"IBM Plex Mono",monospace}
.tot td{border:0;font-size:20px;font-weight:600}.muted{color:#5F6168}.grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:22px 0}
@media print{body{margin:0}button{display:none}}</style></head><body>
<div class="top"><div><div class="logo">FLIPIT · Preservation</div><div class="muted">${esc(b.businessEmail||"")}</div></div><div style="text-align:right"><h1>Invoice</h1><div class="muted">${n}<br>${new Date().toLocaleDateString()}</div></div></div>
<div class="grid"><div><b>Bill to</b><br>${esc(o.client||"Client")}</div><div><b>Property</b><br>${esc(o.address)}${o.ref?"<br>Order / loan #: "+esc(o.ref):""}</div></div>
<table><tr><th>Service</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr>
<tr><td>${esc(s.name)}<br><small class="muted">Checklist ${done}/${s.steps.length} complete${o.submittedAt?" · submitted "+new Date(o.submittedAt).toLocaleDateString():""}</small></td><td class="r">${o.qty} ${esc(s.unit)}</td><td class="r">${money2(o.rate)}</td><td class="r">${money2(total(o))}</td></tr>
<tr class="tot"><td colspan="3" class="r">Total due</td><td class="r">${money2(total(o))}</td></tr></table>
${ins}
<p class="muted" style="margin-top:28px">Payment: ${esc(b.cashApp?"Cash App "+b.cashApp:"per vendor agreement")}. Thank you.</p>
<button onclick="print()" style="margin-top:12px;padding:12px 20px;border:0;border-radius:999px;background:#FF5A1F;color:#fff;font-weight:600;cursor:pointer">Print / save PDF</button>
</body></html>`);
    w.document.close();
  }

  function wire(){
    const f=$("pvForm");
    f.service.onchange=()=>{f.rate.value=st.rates[f.service.value]};f.rate.value=st.rates[f.service.value];
    f.onsubmit=e=>{e.preventDefault();
      st.orders.unshift({service:f.service.value,address:f.address.value.trim(),client:f.client.value.trim(),ref:f.ref.value.trim(),due:f.due.value,qty:+f.qty.value||1,rate:+f.rate.value||0,notes:f.notes.value.trim(),status:"Assigned",checks:[],created:Date.now()});
      const sv=f.service.value;f.reset();f.service.value=sv;f.rate.value=st.rates[sv];filter="Active";save()};
    const c=$("pvClientForm");
    c.onsubmit=e=>{e.preventDefault();st.clients.push({name:c.name.value.trim(),contact:c.contact.value.trim(),portal:c.portal.value.trim(),terms:c.terms.value.trim()});c.reset();save()};
    const q=$("pvOccForm");
    q.onsubmit=e=>{e.preventDefault();const i=q.order.value;if(i===""){alert("Create an occupancy inspection work order first.");return}
      const o=st.orders[+i];o.inspection={status:(q.querySelector('[name=status]:checked')||{}).value,indicators:[...q.querySelectorAll('[name=ind]:checked')].map(x=>x.value),condition:q.condition.value,ptype:q.ptype.value,damage:q.damage.value.trim(),photos:+q.photos.value||0,at:q.at.value||new Date().toISOString()};
      const s=svc("occupancy");o.checks=o.checks||[];o.checks[3]=true;if(o.inspection.damage||o.inspection.photos)o.checks[4]=true;if(o.status==="Assigned")o.status="In field";
      q.reset();save();alert("Inspection saved to "+o.address+".")};
    $("pvJobs").value=st.proj.jobs??8;$("pvDays").value=st.proj.days??5;if(st.proj.mix)$("pvMix").value=st.proj.mix;
    ["pvJobs","pvDays","pvMix"].forEach(id=>$(id).addEventListener("input",proj));
  }

  function init(){if(!document.querySelector(".tabs"))return;css();panel();wire();render()}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
