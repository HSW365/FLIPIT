/* FLIPIT AUTOPILOT — HSW365
   Browser-safe orchestration layer. It prepares discovery, scoring, buyer matching,
   document drafts and action queues. It never publishes secrets or executes a
   legally binding contract without an explicit user approval step.
*/
(function(){
  const KEY='flipit_autopilot_v1';
  const state=JSON.parse(localStorage.getItem(KEY)||'{"enabled":false,"filters":{"maxPrice":20000,"minValue":150000,"auctionDays":30,"strategy":"Tax Deed"},"queue":[],"runs":0,"lastRun":null,"deals":[]}');
  const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
  const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n)||0);
  const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  function getDeals(){try{return JSON.parse(localStorage.getItem('flipit_workspace_v2')||'{"deals":[],"buyers":[],"docs":[]}')}catch{return {deals:[],buyers:[],docs:[]}}}
  function upsertDeal(d){
    const w=getDeals(); w.deals=w.deals||[];
    const i=w.deals.findIndex(x=>x.address===d.address);
    if(i>=0) w.deals[i]={...w.deals[i],...d}; else w.deals.unshift(d);
    localStorage.setItem('flipit_workspace_v2',JSON.stringify(w));
  }
  function addDoc(title,body){
    const w=getDeals(); w.docs=w.docs||[];
    w.docs.unshift({title,type:'Autopilot Draft',body,date:Date.now()});
    localStorage.setItem('flipit_workspace_v2',JSON.stringify(w));
  }
  function score(d){
    const f=state.filters, spread=(d.value||0)-(d.openingBid||d.price||0);
    let s=0;
    if((d.openingBid||d.price||Infinity)<=f.maxPrice)s+=30;
    if((d.value||0)>=f.minValue)s+=30;
    if((d.auctionDays??999)<=f.auctionDays)s+=20;
    if((d.strategy||'').toLowerCase().includes(f.strategy.toLowerCase().replace(' deed','')))s+=10;
    if(spread>0)s+=10;
    return Math.min(100,s);
  }
  function sampleDiscovery(){
    /* Demo records make the workflow testable. Production uses a secure backend/provider adapters. */
    return [
      {address:'Demo Tax-Deed Opportunity',owner:'Owner record available after provider lookup',openingBid:19500,value:185000,auctionDays:18,strategy:'Tax Deed',source:'demo'},
      {address:'Demo Off-Market Opportunity',owner:'Owner record available after provider lookup',openingBid:15000,value:165000,auctionDays:12,strategy:'Off-Market',source:'demo'}
    ];
  }
  function discover(){
    const found=sampleDiscovery().map(d=>({...d,score:score(d)})).filter(d=>d.score>=60);
    state.deals=found; state.runs++; state.lastRun=new Date().toISOString();
    found.forEach(d=>upsertDeal({address:d.address,price:d.openingBid,strategy:d.strategy,status:'Autopilot candidate',analysis:{arv:d.value,margin:d.value-d.openingBid}}));
    state.queue.push(...found.map(d=>({type:'review',address:d.address,status:'Needs approval',created:Date.now()})));
    save(); render();
    return found;
  }
  function matchBuyers(deal){
    const buyers=getDeals().buyers||[];
    return buyers.filter(b=>(+b.max||0)>=(deal.contractPrice||deal.price||0))
      .map(b=>({...b,matchScore:Math.min(100,60+((b.strategy||'Any')==='Any'||b.strategy===deal.strategy?25:0)+((b.area||'').toLowerCase().includes((deal.address||'').toLowerCase().split(',')[0])?15:0))}))
      .sort((a,b)=>b.matchScore-a.matchScore);
  }
  function draftContract(deal){
    const price=deal.contractPrice||Math.max(0,Math.round((deal.value||0)*0.65));
    const body='PURCHASE AGREEMENT DRAFT\n\nProperty: '+deal.address+'\nSeller: [VERIFY OWNER]\nBuyer: [YOUR LLC]\nPurchase Price: '+money(price)+'\nStrategy: '+deal.strategy+'\n\nDRAFT ONLY — attorney/title review required before signature or use.';
    addDoc('Autopilot Purchase Agreement — '+deal.address,body);
    return body;
  }
  function enqueueAssignment(deal,buyer){
    state.queue.push({type:'assignment-review',address:deal.address,buyer:buyer?.name||'Buyer',status:'Needs approval',created:Date.now()});
    save(); render();
  }
  function panel(){
    if(document.getElementById('autopilot')) return;
    const tabs=document.querySelector('.tabs'), btn=document.createElement('button');
    btn.className='tab'; btn.dataset.tab='autopilot'; btn.textContent='Autopilot';
    tabs.appendChild(btn);
    const section=document.createElement('section'); section.id='autopilot'; section.className='panel';
    section.innerHTML='<div class="grid"><div class="card span8"><h2>FLIPIT Autopilot</h2><p class="muted">Continuously organize deal discovery, underwriting, owner-research tasks, buyer matching and document preparation. Live government/auction data, messaging, e-sign and title integrations require secure provider credentials.</p><div class="formgrid"><div><label>Max opening bid</label><input id="apMax" type="number" value="'+state.filters.maxPrice+'"></div><div><label>Minimum estimated value</label><input id="apMin" type="number" value="'+state.filters.minValue+'"></div><div><label>Auction within days</label><input id="apDays" type="number" value="'+state.filters.auctionDays+'"></div><div><label>Strategy</label><select id="apStrategy"><option>Tax Deed</option><option>Foreclosure</option><option>Off-Market</option><option>REO</option></select></div></div><br><div class="actions"><button class="btn good" id="apRun">Run Autopilot Now</button><button class="btn ghost" id="apEnable">'+(state.enabled?'Disable':'Enable')+' Autopilot</button></div></div><div class="card span4"><h2>Automation status</h2><div class="row"><span>Enabled</span><b id="apEnabled">'+(state.enabled?'YES':'NO')+'</b></div><div class="row"><span>Runs</span><b id="apRuns">'+state.runs+'</b></div><div class="row"><span>Last run</span><b id="apLast">'+(state.lastRun?new Date(state.lastRun).toLocaleString():'Never')+'</b></div><div class="notice">Approval gates stay on for owner contact, binding contracts, assignments, payments and closing.</div></div><div class="card span12"><h2>Opportunity queue</h2><div id="apResults" class="empty">Run Autopilot to build the queue.</div></div></div>';
    document.querySelector('main').appendChild(section);
    btn.onclick=()=>showTab('autopilot');
    document.getElementById('apRun').onclick=()=>{state.filters.maxPrice=+apMax.value||20000;state.filters.minValue=+apMin.value||150000;state.filters.auctionDays=+apDays.value||30;state.filters.strategy=apStrategy.value;discover()};
    document.getElementById('apEnable').onclick=()=>{state.enabled=!state.enabled;save();render()};
  }
  function render(){
    panel();
    const en=document.getElementById('apEnabled'); if(!en)return;
    en.textContent=state.enabled?'YES':'NO'; document.getElementById('apRuns').textContent=state.runs; document.getElementById('apLast').textContent=state.lastRun?new Date(state.lastRun).toLocaleString():'Never';
    document.getElementById('apEnable').textContent=(state.enabled?'Disable':'Enable')+' Autopilot';
    const box=document.getElementById('apResults');
    if(!state.deals.length){box.textContent='Run Autopilot to build the queue.';return}
    box.innerHTML=state.deals.map((d,i)=>'<div class="row"><div><b>'+esc(d.address)+'</b><div class="muted">'+esc(d.strategy)+' · Opening bid '+money(d.openingBid)+' · Est. value '+money(d.value)+'</div></div><div class="actions"><span class="tag">'+d.score+'% match</span><button class="btn small ghost" data-draft="'+i+'">Draft Contract</button><button class="btn small good" data-buyers="'+i+'">Find Buyers</button></div></div>').join('');
    box.querySelectorAll('[data-draft]').forEach(b=>b.onclick=()=>{draftContract(state.deals[+b.dataset.draft]);alert('Draft created for review.');});
    box.querySelectorAll('[data-buyers]').forEach(b=>{b.onclick=()=>{const d=state.deals[+b.dataset.buyers], m=matchBuyers(d); if(m[0]){enqueueAssignment(d,m[0]);alert('Top buyer match queued for approval: '+m[0].name)}else alert('No saved buyer matches this deal yet.');}});
  }
  window.FLIPIT_AUTOPILOT={state,discover,score,matchBuyers,draftContract,enqueueAssignment};
  document.addEventListener('DOMContentLoaded',render);
})();