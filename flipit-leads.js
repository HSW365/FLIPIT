/* FLIPIT LEAD HUNTER — free public-record foreclosure, tax-lien and HOA-lien leads.
   Data: county Sheriff sale listings via the FLIPIT backend (/api/leads/*). */
(function(){
  const KEY="flipit_leads_v2";
  const SJ=["cumberland-nj","atlantic-nj","gloucester-nj","salem-nj","camden-nj","capemay-nj","burlington-nj"];
  let st;try{st=JSON.parse(localStorage.getItem(KEY))}catch{}
  st=st||{counties:null,type:"Tax lien foreclosure",withinDays:180,maxJudgment:0,leads:[],ranAt:null,counted:{}};
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st))}catch{}};
  const $=id=>document.getElementById(id);
  const money=n=>n?new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n):"—";
  const esc=s=>String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
  const ws=()=>{try{return JSON.parse(localStorage.getItem("flipit_workspace_v2")||'{"deals":[],"buyers":[],"docs":[],"settings":{}}')}catch{return{deals:[],buyers:[],docs:[],settings:{}}}};
  const wsSave=w=>localStorage.setItem("flipit_workspace_v2",JSON.stringify(w));
  const api=()=>((ws().settings||{}).apiUrl||location.origin).replace(/\/$/,"");
  const cap=s=>String(s||"").split(/[;,]/)[0].replace(/\s+(et al|her heirs|his heirs).*$/i,"").toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()).replace(/ Et Al$/,"");
  let counties=[];

  const css=`.lh-chips{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 14px}.lh-chip{border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 13px;font-size:13px;font-weight:500;cursor:pointer;font-family:var(--sans)}.lh-chip.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.lh-f{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.lh-f label{display:block;font-size:12px;color:var(--muted);font-weight:500;margin-bottom:6px}.lh-f input,.lh-f select{width:100%;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font:15px var(--sans);background:#fff}
.lh-tbl{width:100%;border-collapse:collapse;font-size:14px}.lh-tbl th{text-align:left;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:600;padding:10px 8px;border-bottom:1px solid var(--line);position:sticky;top:0;background:#fff}.lh-tbl td{padding:12px 8px;border-bottom:1px solid var(--line);vertical-align:top}
.lh-sc{font-family:var(--mono);font-weight:600;font-size:15px;display:inline-grid;place-items:center;width:44px;height:30px;border-radius:8px;background:#F1F1EC}.lh-sc.hi{background:var(--brand);color:#fff}.lh-sc.md{background:#FFE7DC;color:var(--brandD)}
.lh-ty{font-size:11px;font-weight:600;border-radius:999px;padding:3px 9px;white-space:nowrap}.lh-ty.t{background:#E4F4EC;color:var(--good)}.lh-ty.h{background:#E8EEFF;color:#2747B8}.lh-ty.b{background:#F1F1EC;color:var(--muted)}.lh-ty.a{background:#FFF1DE;color:#7A4600}
.lh-why{font-size:12px;color:var(--muted);margin-top:4px}.lh-m{font-family:var(--mono);white-space:nowrap}.lh-wrap{max-height:70vh;overflow:auto;border:1px solid var(--line);border-radius:12px}.lh-acts{display:flex;gap:6px;flex-wrap:wrap}
@media(max-width:800px){.lh-f{grid-template-columns:1fr}.lh-tbl .lh-hide{display:none}}`;

  function letter(l){
    const owner=cap(l.defendant)||"Homeowner";
    return `OFFER TO PURCHASE — ${l.address}

Dear ${owner},

Public records show a Sheriff's sale scheduled for ${l.saleDate} (Sheriff #${l.sheriffNo}, ${l.county}). If you would rather sell before that date, I may be able to buy the property as-is, pay closing costs, and close on your timeline so you can walk away with any equity instead of losing it at auction.

There is no obligation. Before you sign anything with anyone, you have the right to speak with an attorney and with a free HUD-approved housing counselor (NJ Foreclosure Mediation / NJ Housing and Mortgage Finance Agency: 1-800-NJ-HOUSE). Any agreement we make will be in writing, will state the price and all terms, and will include every cancellation right New Jersey law gives you.

If you'd like to talk, reply to this letter or contact me:

[YOUR NAME] · [YOUR COMPANY]
[PHONE] · [EMAIL]

Sincerely,
[YOUR NAME]

DRAFT — review with a New Jersey real estate attorney before sending. Purchases from owners in foreclosure are regulated by the NJ Foreclosure Rescue Fraud Prevention Act.`;
  }

  function addDeal(l){const w=ws();w.deals=w.deals||[];const debt=l.approxJudgment||l.upsetAmount||0;const d={address:l.address,url:l.sourceUrl,strategy:l.type,status:"Lead — "+l.type,analysis:{arv:0,price:debt,rep:0,cost:0,profit:0,rent:0,opex:0,down:0,rate:0,basis:debt,margin:0,mao:0},lead:l,date:Date.now()};const i=w.deals.findIndex(x=>x.address===l.address);if(i>=0)w.deals[i]={...w.deals[i],...d};else w.deals.unshift(d);wsSave(w);if(window.render)try{window.render()}catch{}}
  function addLetter(l){const w=ws();w.docs=w.docs||[];w.docs.unshift({type:"Owner Offer Letter",body:letter(l),date:Date.now()});wsSave(w);if(window.render)try{window.render()}catch{}}
  function printLetters(list){const win=window.open("","_blank");if(!win)return alert("Allow pop-ups to print letters.");win.document.write("<title>FLIPIT owner letters</title><style>body{font:15px/1.6 Georgia,serif;margin:0}pre{white-space:pre-wrap;font:inherit;padding:1in;page-break-after:always;margin:0}</style>"+list.map(l=>"<pre>"+esc(letter(l))+"</pre>").join(""));win.document.close();win.print()}

  function panel(){
    if($("leads"))return;
    const tabs=document.querySelector(".tabs");if(!tabs)return;
    const btn=document.createElement("button");btn.className="tab";btn.dataset.tab="leads";btn.textContent="Lead Hunter";tabs.insertBefore(btn,tabs.children[1]||null);
    const s=document.createElement("style");s.textContent=css;document.head.appendChild(s);
    const sec=document.createElement("section");sec.id="leads";sec.className="panel";
    sec.innerHTML=`<div class="grid">
<div class="card span12"><h2 style="margin-top:0">Tax Lien Hunter</h2><p class="muted" style="margin-top:-6px">Properties being foreclosed for unpaid property taxes — filed by towns, school districts and tax-lien certificate holders — pulled free from county Sheriff records. Debt is usually a small slice of the home's value, so the owner has equity to protect and the deal has room. Switch case type to see bank and HOA foreclosures too.</p>
<label class="muted">Counties</label><div class="lh-chips" id="lhC"></div>
<div class="lh-f"><div><label>Case type</label><select id="lhType"><option>Any</option><option>Tax lien foreclosure</option><option>HOA / condo lien</option><option>Bank foreclosure</option><option>Agency mortgage</option></select></div><div><label>Sale within (days)</label><input id="lhDays" type="number" min="1" value="${st.withinDays}"></div><div><label>Max debt owed ($, 0 = any)</label><input id="lhMax" type="number" min="0" step="5000" value="${st.maxJudgment}"></div></div>
<div class="actions" style="margin-top:16px"><button class="btn" id="lhRun">Hunt leads</button><button class="btn ghost" id="lhCsv">Export CSV</button><button class="btn ghost" id="lhPrint">Print owner letters</button></div>
<div class="notice"><b>Buy tax-lien certificates directly:</b> NJ towns auction unpaid-tax liens online at <a href="https://www.newjerseytaxsale.com/" target="_blank" rel="noopener">NewJerseyTaxSale.com</a> (register + deposit per town). Bidding starts at 18% interest and bids down; a certificate earns interest plus up to a 6% penalty when the owner pays, or lets the holder foreclose after 2 years. Each town posts its sale list on its own site before the sale.</div><div class="notice">Owner sellers (FSBO): <a href="https://www.zillow.com/vineland-nj/fsbo/" target="_blank" rel="noopener">Zillow FSBO</a> · <a href="https://www.hudhomestore.gov/" target="_blank" rel="noopener">HUD Homes</a> · <a href="https://www.auction.com/residential/nj/" target="_blank" rel="noopener">Auction.com NJ</a>. Debt shown is the Sheriff's approximate judgment / upset price, not market value — check value before offering.</div></div>
<div class="card span12"><div class="statgrid" id="lhStats"></div></div>
<div class="card span12"><div id="lhOut" class="empty">Pick counties and hit Hunt leads.</div></div></div>`;
    document.querySelector("main").appendChild(sec);
    btn.onclick=()=>window.showTab&&showTab("leads");
    $("lhType").value=st.type;
    $("lhRun").onclick=run;
    $("lhCsv").onclick=()=>{const q=new URLSearchParams({counties:st.counties.join(","),type:st.type,withinDays:st.withinDays});location.href=api()+"/api/leads/hunt.csv?"+q};
    $("lhPrint").onclick=()=>st.leads.length?printLetters(st.leads.slice(0,25)):alert("Run a hunt first.");
    fetch(api()+"/api/leads/counties").then(r=>r.json()).then(d=>{counties=d.counties||[];if(!st.counties)st.counties=counties.map(c=>c.key);chips()}).catch(()=>{counties=SJ.map(k=>({key:k,name:k}));chips()});
    draw();
  }
  function chips(){const box=$("lhC");box.innerHTML=counties.map(c=>`<button class="lh-chip${st.counties.includes(c.key)?" on":""}" data-k="${c.key}">${esc(c.name)}</button>`).join("");box.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{const k=b.dataset.k;st.counties=st.counties.includes(k)?st.counties.filter(x=>x!==k):[...st.counties,k];save();chips()})}
  async function run(){
    st.type=$("lhType").value;st.withinDays=+$("lhDays").value||60;st.maxJudgment=+$("lhMax").value||0;save();
    if(!st.counties.length)return alert("Select at least one county.");
    const b=$("lhRun");b.disabled=true;b.textContent="Hunting…";$("lhOut").className="empty";$("lhOut").textContent="Pulling Sheriff records — first pull of a county takes ~10–20s.";
    try{const r=await fetch(api()+"/api/leads/hunt",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({counties:st.counties,type:st.type,withinDays:st.withinDays,maxJudgment:st.maxJudgment})});const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||"Lead source unavailable");st.leads=d.leads;st.ranAt=new Date().toISOString();st.errors=d.errors;save();draw()}
    catch(e){$("lhOut").textContent="Couldn't reach the lead source: "+e.message}
    finally{b.disabled=false;b.textContent="Hunt leads"}
  }
  function draw(){
    const L=st.leads||[],n=t=>L.filter(l=>l.type===t).length;
    $("lhStats").innerHTML=[["Leads",L.length],["Tax-lien cases",n("Tax lien foreclosure")],["Debt under $50k",L.filter(l=>{const d=l.approxJudgment||l.upsetAmount;return d>0&&d<50000}).length],["Sale ≤ 14 days",L.filter(l=>l.daysToSale<=14).length]].map(([a,b])=>`<div class="stat"><span class="muted">${a}</span><b style="display:block;font:600 28px var(--mono)">${b}</b></div>`).join("");
    const out=$("lhOut");if(!L.length){out.className="empty";if(st.ranAt)out.textContent="No sales match these filters.";return}
    out.className="";
    const tc=t=>t.startsWith("Tax")?"t":t.startsWith("HOA")?"h":t.startsWith("Agency")?"a":"b";
    out.innerHTML=`<p class="muted" style="margin:0 0 10px">Updated ${new Date(st.ranAt).toLocaleString()}${st.errors&&st.errors.length?" · unavailable: "+esc(st.errors.join(", ")):""}</p><div class="lh-wrap"><table class="lh-tbl"><thead><tr><th>Score</th><th>Property</th><th>Sale</th><th>Debt</th><th class="lh-hide">Case</th><th></th></tr></thead><tbody>${L.map((l,i)=>`<tr><td><span class="lh-sc ${l.score>=60?"hi":l.score>=40?"md":""}">${l.score}</span></td><td><b>${esc(l.address)}</b><div class="muted">${esc(l.county)} · Owner: ${esc(cap(l.defendant))}</div><div class="lh-why">${esc((l.why||[]).join(" · "))}</div></td><td class="lh-m">${esc(String(l.saleDate).split(" ")[0])}<div class="muted">${l.daysToSale}d · ${esc(l.currentStatus||"")}</div></td><td class="lh-m">${money(l.approxJudgment||l.upsetAmount)}<div class="muted">upset ${money(l.upsetAmount)}</div></td><td class="lh-hide"><span class="lh-ty ${tc(l.type)}">${esc(l.type)}</span><div class="muted" style="margin-top:4px">${esc(l.plaintiff)}</div></td><td><div class="lh-acts"><a class="btn small ghost" href="${esc(l.zillowUrl)}" target="_blank" rel="noopener">Value</a><a class="btn small ghost" href="${esc(l.sourceUrl)}" target="_blank" rel="noopener">Record</a><button class="btn small" data-add="${i}">Pipeline</button><button class="btn small alt" data-let="${i}">Letter</button><button class="btn small ghost" data-desk="${i}">Start deal</button></div></td></tr>`).join("")}</tbody></table></div>`;
    out.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>{addDeal(L[+b.dataset.add]);b.textContent="Added";b.disabled=true});
    out.querySelectorAll("[data-desk]").forEach(b=>b.onclick=()=>{const l=L[+b.dataset.desk];if(!window.FLIPIT_DESK)return;const parts=String(l.address).match(/^(.*?)\s+([A-Za-z .]+?)\s+(NJ|PA|DE)\s*(\d{5})?$/);const debt=l.approxJudgment||l.upsetAmount||"";window.FLIPIT_DESK.newDeal({property_address:l.address,state:parts?parts[3]:"NJ",county:String(l.county).replace(/ County.*$/,""),seller_name:cap(l.defendant),sheriff_no:l.sheriffNo,sale_date:String(l.saleDate).split(" ")[0],upset:l.upsetAmount||"",tax_owed:l.type.startsWith("Tax")?debt:"",payoff:l.type.startsWith("Tax")?"":debt,strategy:l.type.startsWith("Tax")?"taxforeclosure":"preforeclosure"})});
    out.querySelectorAll("[data-let]").forEach(b=>b.onclick=()=>{addLetter(L[+b.dataset.let]);b.textContent="In Contracts";b.disabled=true});
  }
  window.FLIPIT_LEADS={run,letter,state:st};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",panel);else panel();
})();
