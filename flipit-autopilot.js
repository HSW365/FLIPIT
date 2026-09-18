/* FLIPIT AUTOPILOT — PRODUCTION
   No demo records. Discovery runs against the configured FLIPIT backend.
   The backend keeps provider credentials off the browser.
*/
(function(){
  const KEY="flipit_autopilot_v2";
  const defaults={enabled:false,location:"NJ",filters:{maxPrice:20000,minValue:150000,auctionDays:30,strategy:"Tax Deed"},queue:[],runs:0,lastRun:null,deals:[]};
  let state=JSON.parse(localStorage.getItem(KEY)||JSON.stringify(defaults));
  const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
  const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(Number(n)||0);
  const esc=s=>String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
  function workspace(){try{return JSON.parse(localStorage.getItem("flipit_workspace_v2")||'{"deals":[],"buyers":[],"docs":[],"settings":{}}')}catch{return {deals:[],buyers:[],docs:[],settings:{}}}}
  function writeWorkspace(w){localStorage.setItem("flipit_workspace_v2",JSON.stringify(w))}
  function backend(){const w=workspace();return (w.settings?.apiUrl||window.location.origin).replace(/\/$/,"")}
  function upsertDeal(d){
    const w=workspace();w.deals=w.deals||[];
    const i=w.deals.findIndex(x=>x.address===d.address);
    const a={arv:d.estimatedValue,price:d.openingBid,rep:0,cost:0,profit:0,rent:0,opex:0,down:0,rate:0,basis:d.openingBid,margin:d.estimatedValue-d.openingBid,mao:d.estimatedValue};
    const deal={address:d.address,url:d.sourceUrl||"",strategy:d.strategy,status:"Autopilot candidate",analysis:a,autopilot:d,date:Date.now()};
    if(i>=0)w.deals[i]={...w.deals[i],...deal};else w.deals.unshift(deal);
    writeWorkspace(w);
  }
  async function discover(){
    const base=backend();
    if(!base) throw new Error("FLIPIT backend is not reachable.");
    const r=await fetch(base+"/api/autopilot/discover",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      location:state.location,...state.filters
    })});
    const data=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(data.error||"FLIPIT property data provider is unavailable.");
    state.deals=data.deals||[];state.runs++;state.lastRun=new Date().toISOString();
    state.queue.push(...state.deals.map(d=>({type:"review",address:d.address,status:"Needs approval",created:Date.now()})));
    state.deals.forEach(upsertDeal);save();render();return state.deals;
  }
  function matchBuyers(deal){
    const buyers=workspace().buyers||[];
    return buyers.map(b=>{
      let s=0;if((+b.max||0)>=(+deal.openingBid||0))s+=45;
      if(b.strategy==="Any"||b.strategy===deal.strategy)s+=30;
      const area=(b.area||"").toLowerCase(),addr=(deal.address||"").toLowerCase();
      s+=!area?25:(area.split(/[,\s]+/).some(x=>x.length>2&&addr.includes(x))?25:10);
      return {...b,matchScore:Math.min(100,s)};
    }).sort((a,b)=>b.matchScore-a.matchScore);
  }
  function draftContract(deal){
    const w=workspace();w.docs=w.docs||[];
    w.docs.unshift({type:"Purchase Agreement Draft",body:"PURCHASE AGREEMENT DRAFT\n\nProperty: "+deal.address+"\nSeller: [VERIFY OWNER]\nBuyer: [YOUR LLC]\nPurchase Price: "+money(deal.openingBid)+"\nStrategy: "+deal.strategy+"\nSource: "+(deal.sourceUrl||"")+'\n\nDRAFT ONLY — attorney/title review required before signature or use.',date:Date.now()});
    writeWorkspace(w); if(window.render)window.render();
  }
  function panel(){
    if(document.getElementById("autopilot"))return;
    const tabs=document.querySelector(".tabs"),btn=document.createElement("button");btn.className="tab";btn.dataset.tab="autopilot";btn.textContent="Autopilot";tabs.appendChild(btn);
    const section=document.createElement("section");section.id="autopilot";section.className="panel";
    section.innerHTML='<div class="grid"><div class="card span8"><h2>FLIPIT Autopilot</h2><p class="muted">Production discovery uses your connected FLIPIT backend and property-data provider. No sample or demo opportunities are inserted.</p><div class="formgrid"><div><label>Search location (ZIP, city, county or state)</label><input id="apLocation" value="'+esc(state.location)+'"></div><div><label>Max opening bid</label><input id="apMax" type="number" value="'+state.filters.maxPrice+'"></div><div><label>Minimum estimated value</label><input id="apMin" type="number" value="'+state.filters.minValue+'"></div><div><label>Auction within days</label><input id="apDays" type="number" value="'+state.filters.auctionDays+'"></div><div><label>Strategy</label><select id="apStrategy"><option>Tax Deed</option><option>Foreclosure</option><option>Off-Market</option><option>REO</option><option>Auction</option></select></div></div><br><div class="actions"><button class="btn good" id="apRun">Run Live Discovery</button><button class="btn ghost" id="apEnable">'+(state.enabled?"Disable":"Enable")+" Autopilot</button></div></div><div class="card span4"><h2>Automation status</h2><div class="row"><span>Enabled</span><b id="apEnabled">'+(state.enabled?"YES":"NO")+'</b></div><div class="row"><span>Runs</span><b id="apRuns">'+state.runs+'</b></div><div class="row"><span>Last run</span><b id="apLast">'+(state.lastRun?new Date(state.lastRun).toLocaleString():"Never")+'</b></div><div class="notice">Owner contact, contracts, assignments, payments and closing remain approval-gated.</div></div><div class="card span12"><h2>Live opportunity queue</h2><div id="apResults" class="empty">No live discovery run yet.</div></div></div>';
    document.querySelector("main").appendChild(section);btn.onclick=()=>showTab("autopilot");
    document.getElementById("apRun").onclick=async()=>{state.location=apLocation.value.trim()||"NJ";state.filters={maxPrice:+apMax.value||20000,minValue:+apMin.value||150000,auctionDays:+apDays.value||30,strategy:apStrategy.value};try{await discover()}catch(e){alert(e.message)}};
    document.getElementById("apEnable").onclick=()=>{state.enabled=!state.enabled;save();render()};
  }
  function render(){
    panel();const en=document.getElementById("apEnabled");if(!en)return;
    en.textContent=state.enabled?"YES":"NO";document.getElementById("apRuns").textContent=state.runs;document.getElementById("apLast").textContent=state.lastRun?new Date(state.lastRun).toLocaleString():"Never";document.getElementById("apEnable").textContent=(state.enabled?"Disable":"Enable")+" Autopilot";
    const box=document.getElementById("apResults");if(!state.deals.length){box.textContent="No live opportunities matched the current filters.";return}
    box.innerHTML=state.deals.map((d,i)=>'<div class="row"><div><b>'+esc(d.address)+'</b><div class="muted">'+esc(d.strategy)+' · Opening bid '+money(d.openingBid)+' · Est. value '+money(d.estimatedValue)+'</div></div><div class="actions"><span class="tag">'+d.score+'% score</span><button class="btn small ghost" data-draft="'+i+'">Draft Contract</button><button class="btn small good" data-buyers="'+i+'">Find Buyers</button></div></div>').join("");
    box.querySelectorAll("[data-draft]").forEach(b=>b.onclick=()=>{draftContract(state.deals[+b.dataset.draft]);alert("Draft created for review.")});
    box.querySelectorAll("[data-buyers]").forEach(b=>b.onclick=()=>{const d=state.deals[+b.dataset.buyers],m=matchBuyers(d);alert(m[0]?"Top buyer match: "+m[0].name+" ("+m[0].matchScore+"%)":"No saved buyer matches this deal yet.")});
  }
  window.FLIPIT_AUTOPILOT={state,discover,matchBuyers,draftContract};
  document.addEventListener("DOMContentLoaded",render);
})();