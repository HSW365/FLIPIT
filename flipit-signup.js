/* FLIPIT sign-up popup — opens on #signup (QR codes in ads link here), on ?signup, or via window.FLIPIT_SIGNUP(). */
(function(){
  const KEY="flipit_member_v1";
  const css=`.su-ov{position:fixed;inset:0;z-index:200;background:rgba(10,10,12,.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px}
.su{background:#16171A;color:#fff;border-radius:22px;width:min(520px,100%);max-height:92vh;overflow:auto;padding:30px 28px;font-family:var(--sans);box-shadow:0 30px 80px rgba(0,0,0,.5)}
.su h2{font:700 40px/1 var(--cond);margin:0}.su h2 span{color:var(--brand)}.su p{color:#B9BAC0;margin:10px 0 18px;font-size:15px}
.su label{display:block;font-size:12px;color:#8E9097;margin:12px 0 6px}.su input{width:100%;background:#232428;border:1px solid #3A3B40;border-radius:12px;color:#fff;padding:13px 14px;font:16px var(--sans)}.su input:focus{outline:none;border-color:var(--brand)}
.su-plans{display:grid;gap:8px;margin-top:6px}.su-plan{display:flex;justify-content:space-between;align-items:center;border:1px solid #3A3B40;border-radius:12px;padding:12px 14px;cursor:pointer;background:#1D1E22}.su-plan.on{border-color:var(--brand);box-shadow:inset 0 0 0 1px var(--brand)}.su-plan b{font-family:var(--mono)}.su-plan small{display:block;color:#8E9097}
.su .btn{width:100%;margin-top:18px;padding:14px;font-size:16px}.su-x{float:right;background:none;border:0;color:#8E9097;font-size:26px;cursor:pointer;line-height:1}.su-pay{background:#232428;border-radius:12px;padding:14px;margin-top:14px;font-size:14px;color:#D6D7DB}.su-pay b{color:#fff;font-family:var(--mono)}.su-fine{font-size:11px;color:#6E7077;margin-top:12px}`;
  const PLANS=[["free","Free start","Lead Hunter + Deal Desk on this device","$0"],["pass","Deal Pass","One deal, every form","$19 once"],["pro","Pro","Unlimited deals","$49/mo"],["team","Team","For partners","$99/mo"]];
  function open(){
    if(document.querySelector(".su-ov"))return;
    if(!document.getElementById("su-css")){const s=document.createElement("style");s.id="su-css";s.textContent=css;document.head.appendChild(s)}
    let plan="free";let me={};try{me=JSON.parse(localStorage.getItem(KEY))||{}}catch{}
    const ov=document.createElement("div");ov.className="su-ov";
    ov.innerHTML=`<div class="su" role="dialog" aria-label="Sign up for FLIPIT"><button class="su-x" aria-label="Close">×</button><h2>Start <span>flipping</span>.</h2><p>Find tax-lien and foreclosure deals, then fill every contract from one entry.</p>
<label>Name</label><input id="suName" autocomplete="name" value="${(me.name||"").replace(/"/g,"&quot;")}"><label>Email</label><input id="suEmail" type="email" autocomplete="email" value="${(me.email||"").replace(/"/g,"&quot;")}"><label>Phone (optional)</label><input id="suPhone" type="tel" autocomplete="tel" value="${(me.phone||"").replace(/"/g,"&quot;")}">
<label>Plan</label><div class="su-plans">${PLANS.map(p=>`<div class="su-plan${p[0]===plan?" on":""}" data-p="${p[0]}"><span><b style="font-family:var(--sans)">${p[1]}</b><small>${p[2]}</small></span><b>${p[3]}</b></div>`).join("")}</div>
<div class="su-pay" id="suPay" hidden>Pay with Cash App <b>$hsw365</b> or Zelle <b>856-796-8081</b>. Put your email in the note — your plan is turned on the same day.</div>
<button class="btn" id="suGo">Create my account</button><div class="su-fine">FLIPIT is a deal-finding and paperwork tool, not a broker, lender or law firm. Have an attorney review contracts before signing.</div></div>`;
    document.body.appendChild(ov);
    const close=()=>{ov.remove();if(location.hash==="#signup")history.replaceState(null,"",location.pathname+location.search)};
    ov.querySelector(".su-x").onclick=close;ov.onclick=e=>{if(e.target===ov)close()};
    ov.querySelectorAll("[data-p]").forEach(el=>el.onclick=()=>{plan=el.dataset.p;ov.querySelectorAll("[data-p]").forEach(x=>x.classList.toggle("on",x===el));ov.querySelector("#suPay").hidden=plan==="free"});
    ov.querySelector("#suGo").onclick=async()=>{
      const name=ov.querySelector("#suName").value.trim(),email=ov.querySelector("#suEmail").value.trim(),phone=ov.querySelector("#suPhone").value.trim();
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ov.querySelector("#suEmail").focus();return alert("Enter a valid email.")}
      const rec={name,email,phone,plan,ts:new Date().toISOString(),src:new URLSearchParams(location.search).get("src")||"site"};
      try{localStorage.setItem(KEY,JSON.stringify(rec))}catch{}
      try{await fetch("/api/signup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(rec)})}catch{}
      close();
      const ws=document.getElementById("workspace")||document.querySelector("main");if(ws)ws.scrollIntoView({behavior:"smooth"});
      if(window.showTab)showTab("leads");
    };
  }
  window.FLIPIT_SIGNUP=open;
  const check=()=>{if(location.hash==="#signup"||new URLSearchParams(location.search).has("signup"))open()};
  window.addEventListener("hashchange",check);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",check);else check();
})();
