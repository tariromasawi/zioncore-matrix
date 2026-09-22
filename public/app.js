const api=async(p,o)=>{const r=await fetch(p,{headers:{"Content-Type":"application/json"},...o});const d=await r.json();if(!r.ok)throw new Error(d.error||r.statusText);return d;};
const health=document.getElementById("health");
api("/api/health").then(h=>{health.textContent=h.status.toUpperCase()+" v"+h.version+" hallmark "+h.hallmark+" chain " +(h.chain.ok?"verified":"broken");}).catch(e=>health.textContent=e.message);
const casesEl=document.getElementById("cases");
async function loadCases(){const cases=await api("/api/cases");casesEl.innerHTML=cases.map(c=>`<div><button data-id="${c.caseId}">${c.displayName}</button></div>`).join("")||"No cases yet.";casesEl.querySelectorAll("button").forEach(b=>b.onclick=()=>openCase(b.dataset.id));}
async function openCase(id){let recs=await api(`/api/cases/${id}/records`);if(!recs.length){await api(`/api/cases/${id}/discover`,{method:"POST",body:"{}"});recs=await api(`/api/cases/${id}/records`);}document.getElementById("records").innerHTML=recs.map(r=>`<div>${r.status} ${r.title||""} ${r.url||""}</div>`).join("");}
document.getElementById("caseForm").onsubmit=async(e)=>{e.preventDefault();const fd=new FormData(e.target);await api("/api/cases",{method:"POST",body:JSON.stringify({displayName:fd.get("displayName"),publicUrls:String(fd.get("publicUrls")||"").split(",").map(s=>s.trim()).filter(Boolean)})});e.target.reset();loadCases();};
loadCases();
