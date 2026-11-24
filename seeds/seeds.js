/* The Seven Seeds — a Sprouted Grace field guide to the seven hard feelings.
   The guide's words load from Supabase only for people who have it unlocked.
   Each person's garden (check-ins, journal, acts) stays on their device, with an optional backup. */
(function(){
'use strict';
const KEY='sg.seeds';
const today = () => new Date().toLocaleDateString('en-CA');
function G(){ const g=store(KEY)||{}; g.entries ||= []; g.acts ||= {}; g.days ||= []; g.harvest ||= {}; return g; }
function save(g){ g.updated=Date.now(); store(KEY,g); }
let C=null;   // the guide content
async function content(){
  if(C) return C;
  if(window.SEEDS_PREVIEW) return (C=window.SEEDS_PREVIEW);
  if(S.preview) return null;
  const { data, error } = await S.sb.from('seeds_content').select('data').maybeSingle();
  if(error || !data) return null;
  return (C=data.data);
}
const stage = (g,i) => { const es=g.entries.filter(e=>e.seed===i); if(g.acts[i]) return 3; if(es.some(e=>(e.journal||'').trim())) return 2; return es.length ? 1 : 0; };
const STAGE_TXT = ['Not opened yet','Opened','Growing','Bearing fruit'];
function plant(st, i){
  const soil = `<ellipse cx="40" cy="86" rx="30" ry="8" fill="#9C7A4E"/><ellipse cx="40" cy="84" rx="24" ry="5" fill="#B8935F"/>`;
  if(st===0) return `<svg viewBox="0 0 80 96" aria-hidden="true">${soil}<ellipse cx="40" cy="80" rx="6" ry="4" fill="#6B4A2B"/></svg>`;
  const h = [0,22,40,52][st];
  let s = soil + `<path d="M40 82 C40 ${82-h/2} 41 ${82-h+4} 40 ${82-h}" stroke="#17733A" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M40 ${82-h+6} C30 ${82-h+4} 26 ${82-h-4} 28 ${82-h-10} C36 ${82-h-8} 40 ${82-h} 40 ${82-h+6}z" fill="#239E46"/>`;
  s += `<path d="M40 ${82-h+2} C50 ${82-h} 54 ${82-h-8} 52 ${82-h-14} C44 ${82-h-12} 40 ${82-h-4} 40 ${82-h+2}z" fill="#65D916"/>`;
  if(st>=2) s += `<path d="M40 ${82-h/2} C31 ${82-h/2-2} 27 ${82-h/2-9} 29 ${82-h/2-14} C37 ${82-h/2-12} 40 ${82-h/2-5} 40 ${82-h/2}z" fill="#239E46"/><path d="M40 ${82-h/2+4} C49 ${82-h/2+2} 53 ${82-h/2-5} 51 ${82-h/2-10} C43 ${82-h/2-8} 40 ${82-h/2-1} 40 ${82-h/2+4}z" fill="#65D916"/>`;
  if(st===3) s += `<circle cx="29" cy="${82-h-4}" r="5" fill="#D4A017"/><circle cx="52" cy="${82-h-10}" r="5" fill="#D4A017"/><circle cx="46" cy="${82-h/2-4}" r="4.5" fill="#D4A017"/>`;
  return `<svg viewBox="0 0 80 96" aria-hidden="true">${s}</svg>`;
}
const css = `
.sx-hero{background:linear-gradient(160deg,#1E6B34,#239E46 55%,#65D916);color:#fff;border-radius:18px;padding:22px 20px;margin-bottom:16px;position:relative;overflow:hidden}
.sx-hero h1{color:#fff;font-size:34px}.sx-hero p{color:#F1FFF0;margin-top:6px;font-size:16.5px}
.sx-hero .key{font-family:var(--serif);font-style:italic;font-size:20px;color:#FFF3C4;margin-top:10px}
.sx-garden{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));align-items:end;gap:4px;background:linear-gradient(180deg,#EAF6E6,#F7F1E2);border:1px solid var(--edge);border-radius:16px;padding:10px 6px 8px;margin-bottom:6px}
html.night .sx-garden{background:linear-gradient(180deg,#1F2A20,#26231A)}
.sx-plot{min-width:0;border:0;background:none;padding:0;cursor:pointer;display:flex;flex-direction:column;align-items:center;color:var(--text)}
.sx-plot svg{width:100%;max-width:64px;height:auto}
.sx-plot b{font-family:var(--serif);font-size:14px;color:var(--gold-ink)}.sx-plot small{font-size:10.5px;color:var(--muted);text-align:center;line-height:1.2}
.sx-feel{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}
.sx-feel button{background:var(--paper);border:1px solid var(--edge);border-radius:12px;padding:12px;text-align:left;cursor:pointer;color:var(--text);font-size:16px;font-weight:600}
.sx-feel button small{display:block;font-weight:400;color:var(--muted);font-size:12.5px}
.sx-feel button:hover{border-color:var(--green)}
.sx-steps{display:flex;gap:6px;margin:4px 0 14px}
.sx-steps span{flex:1;text-align:center;padding:8px 4px;border-radius:10px;background:var(--paper);border:1px solid var(--edge);font-weight:700;font-size:14px;color:var(--muted)}
.sx-steps span.on{background:var(--green);color:#fff;border-color:var(--green)}.sx-steps span.done{color:var(--green-ink);border-color:var(--green)}
.sx-wchips{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
.sx-wchips button{border:1px solid var(--edge);background:var(--paper);border-radius:999px;padding:7px 14px;font-size:15px;cursor:pointer;color:var(--text)}
.sx-wchips button.on{background:var(--green);color:#fff;border-color:var(--green)}
.sx-msg{font-family:var(--serif);font-size:22px;line-height:1.4;margin:6px 0 12px}
.sx-verse{font-family:var(--serif);font-size:20px;line-height:1.5;border-left:3px solid var(--gold);padding-left:12px;margin:10px 0}
.sx-flip{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}
.sx-card{perspective:800px;border:0;background:none;padding:0;cursor:pointer;min-height:190px}
.sx-in{position:relative;width:100%;height:100%;min-height:190px;transition:transform .5s;transform-style:preserve-3d}
.sx-card.flip .sx-in{transform:rotateY(180deg)}
.sx-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:14px;padding:12px;display:flex;flex-direction:column;justify-content:center;text-align:left;font-size:14px;line-height:1.4}
.sx-face.front{align-items:center;text-align:center;justify-content:center;gap:6px}
.sx-face.back{transform:rotateY(180deg)}
.sx-thorn .sx-face{background:#F3ECE6;border:1px solid #DCCBBB;color:#4A3A2C}
.sx-fruit .sx-face{background:#EAF6E6;border:1px solid #BFE0B8;color:#1F4A26}
html.night .sx-thorn .sx-face{background:#2E2620;color:#E8D8C8}html.night .sx-fruit .sx-face{background:#1F2E21;color:#D5F0D0}
.sx-face .big{font-family:var(--serif);font-size:26px;font-weight:600}
.sx-face .lab{font-size:11.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;opacity:.75}
.sx-face p{margin:4px 0}
.sx-act{display:flex;gap:12px;align-items:center;background:#FFF8E1;border:1px solid #EBD9A2;border-radius:14px;padding:12px 14px;margin:10px 0}
html.night .sx-act{background:#2E2914;border-color:#5A4C12}
.sx-act input{width:26px;height:26px;flex:none;accent-color:var(--gold)}
.sx-entry{border-top:1px solid var(--line);padding:10px 0}.sx-entry:first-child{border-top:0}
.sx-table{width:100%;border-collapse:collapse;font-size:14px}.sx-table td,.sx-table th{border-bottom:1px solid var(--line);padding:7px 6px;text-align:left;vertical-align:top}
.sx-table th{font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-ink)}
.sx-lock{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin:12px 0}
.sx-lock span{min-width:0;overflow:hidden;aspect-ratio:3/4;border-radius:8px;background:#FFF8E1;border:1px solid #EBD9A2;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:var(--serif);color:var(--gold-ink);font-size:16px;font-weight:600}
.sx-lock small{font-family:var(--sans);font-size:8.5px;color:var(--muted);text-align:center;padding:0 2px;line-height:1.1;margin-top:3px}
@media print{.top,.nav,.foot,.reader-head,.noprint{display:none!important}.app{padding:0}.card{box-shadow:none}}
`;
let styled=false;
function style(){ if(styled) return; styled=true; const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s); }
const back = (h='#/seeds', l='My garden') => `<div class="reader-head noprint"><button class="back" onclick="location.hash='${h}'">‹ ${l}</button></div>`;
const NAMES = ['The Buried Seed','The Pruned Branch','The Garden Fence','The Cracked Seed','The Turned Soil','The Fallen Grain','The Mustard Seed'];
const FEELS = ['Fear','Guilt','Anger','Hurt','Frustrated','Let down','Not enough'];

function landing(paid){
  $app.innerHTML = header()+`<div class="sx-hero"><h1>The Seven Seeds</h1><p>A field guide to the seven hard feelings. Every feeling is a seed with a message inside. Ignore it and it grows thorns. Hear it and it bears fruit.</p><p class="key">Name it. Hear it. Heed it.</p></div>
    ${paid?'<div class="card gilt"><h2>Thank you!</h2><p>Your purchase went through. We will email your unlock code within one day. Type it in below to open your garden.</p></div>':''}
    <div class="sx-lock">${NAMES.map((n,i)=>`<span>${['I','II','III','IV','V','VI','VII'][i]}<small>${esc(FEELS[i])}</small></span>`).join('')}</div>
    <div class="card"><h2>What's inside</h2><ul class="ticks">
      <li>Seven seeds, one for each hard feeling: fear, guilt, anger, hurt, frustration, disappointment, and feeling not enough</li>
      <li>The message inside each feeling, and a red-letter saying of Jesus to go with it</li>
      <li>The thorn it grows when ignored, and the fruit it grows when heard</li>
      <li>A private journal and one simple act for each seed</li>
      <li>Your own garden that grows as you go, plus a printable grab sheet</li></ul></div>
    <div class="card"><h2>Get The Seven Seeds</h2><p class="next-live" style="margin:0">${esc(CONFIG.SEEDS_PRICE)}</p><p class="note">One-time purchase. Yours to keep. All sales are final.</p>
      ${CONFIG.SEEDS_STRIPE_URL?`<div class="row"><a class="btn wide" href="${esc(CONFIG.SEEDS_STRIPE_URL)}" target="_blank" rel="noopener">Buy with a card</a></div>`:'<p class="note">Card checkout opens soon.</p>'}
      ${CONFIG.BTC_ADDRESS?`<p class="note" style="margin-top:10px">Paying with Bitcoin? Send ${esc(CONFIG.SEEDS_PRICE)} in BTC to the address on our <a href="#/give">Give</a> page, then email <a href="mailto:${esc(CONFIG.ADMIN_EMAIL)}">${esc(CONFIG.ADMIN_EMAIL)}</a> and we'll send your code.</p>`:''}
      <p class="note" style="margin-top:10px">After you buy, we email you an unlock code within one day.</p></div>
    <div class="card"><h2>Have a code?</h2>${signedIn()?`<label for="sxCode" style="margin-top:0">Unlock code</label><div class="row" style="margin-top:6px"><input id="sxCode" placeholder="SEED-XXXX-XXXX" autocapitalize="characters" style="flex:1;min-width:160px;text-transform:uppercase"><button class="btn" id="sxGo">Unlock</button></div>`
      :`<p>Make a free account or sign in first, then type your code here.</p><div class="row"><a class="btn outline" href="#/account" onclick="authTab='up'">Make a Free Account</a><a class="btn quiet" href="#/account" onclick="authTab='in'">Sign In</a></div>`}</div>
    <p class="note" style="text-align:center">The Seven Seeds is a guide for growth. It is not counseling or medical care. If you are in crisis, call or text 988 (in the US).</p>${footer()}`;
  const go=document.getElementById('sxGo'); if(go) go.onclick=async()=>{
    const code=document.getElementById('sxCode').value.trim(); if(!code) return;
    if(S.preview) return toast('Preview mode: codes work on the live app.');
    go.disabled=true; const { data, error } = await S.sb.rpc('redeem_seeds_code',{p_code:code}); go.disabled=false;
    if(error) return toast(error.message); if(!data) return toast('That code did not work. Check it and try again.');
    await loadProfile(); toast('Unlocked! Welcome to your garden.'); route(['seeds']);
  };
}
function home(c){
  const g=G(), st=[0,1,2,3,4,5,6].map(i=>stage(g,i)), fruit=st.filter(x=>x===3).length;
  const streak = (()=>{ let n=0, d=new Date(); while(g.days.includes(d.toLocaleDateString('en-CA'))){ n++; d.setDate(d.getDate()-1); } return n; })();
  $app.innerHTML = header()+`<div class="sx-hero" style="padding:18px 18px 14px"><h1 style="font-size:28px">My Garden</h1><p>${fruit===7?'All seven seeds bear fruit. Well done, good and faithful gardener.':fruit?`${fruit} of 7 seeds bear fruit.`:'Open a seed to start growing.'}${streak?` · ${streak}-day check-in streak 🌱`:''}</p><p class="key">Name it. Hear it. Heed it.</p></div>
    <div class="sx-garden" role="list">${st.map((s,i)=>`<button class="sx-plot" role="listitem" data-s="${i}" aria-label="Seed ${c.seeds[i].n}, ${esc(c.seeds[i].name)}: ${STAGE_TXT[s]}">${plant(s,i)}<b>${c.seeds[i].n}</b><small>${esc(FEELS[i])}</small></button>`).join('')}</div>
    <p class="note" style="text-align:center;margin-bottom:14px">Open a seed to sprout it. Journal to grow leaves. Do the one act to bear fruit.</p>
    <div class="eyebrow">How are you feeling right now?</div>
    <div class="sx-feel">${c.seeds.map((s,i)=>`<button data-s="${i}">${esc(s.feeling)}<small>${s.n} · ${esc(s.name)}</small></button>`).join('')}</div>
    <div class="eyebrow">The guide</div>
    <div class="row" style="margin-top:0"><a class="btn outline small" href="#/seeds/parable">The Parable & the Key</a><a class="btn outline small" href="#/seeds/harvest">The Harvest</a><a class="btn outline small" href="#/seeds/sheet">Grab sheet</a><a class="btn outline small" href="#/seeds/journal">My journal (${g.entries.length})</a></div>
    ${signedIn()&&!S.preview?`<div class="card" style="margin-top:16px"><h2 style="font-size:20px">Keep your garden safe</h2><p class="note">Your journal stays on this device. Back it up to your account to keep it if you change phones.</p><div class="row"><button class="btn outline small" id="sxUp">Back up</button><button class="btn quiet small" id="sxDown">Bring back</button></div></div>`:''}
    <p class="note" style="text-align:center;margin-top:16px">The Seven Seeds is a guide for growth, not counseling. If you are in crisis, call or text 988 (in the US).</p>${footer()}`;
  $app.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>location.hash='#/seeds/s/'+(+b.dataset.s+1));
  const up=document.getElementById('sxUp'); if(up) up.onclick=async()=>{ const { error } = await S.sb.from('seeds_journal').upsert({user_id:S.user.id, data:G(), updated_at:new Date().toISOString()}); toast(error?error.message:'Garden backed up.'); };
  const dn=document.getElementById('sxDown'); if(dn) dn.onclick=async()=>{ const { data, error } = await S.sb.from('seeds_journal').select('data').maybeSingle(); if(error) return toast(error.message); if(!data) return toast('No backup yet.');
    if(!confirm('Bring back your backup? It will be added to what is on this phone.')) return;
    const g2=G(), b=data.data||{}; const seen=new Set(g2.entries.map(e=>e.id)); (b.entries||[]).forEach(e=>{ if(!seen.has(e.id)) g2.entries.push(e); });
    Object.assign(g2.acts,b.acts||{}); Object.assign(g2.harvest,b.harvest||{}); g2.days=[...new Set([...g2.days,...(b.days||[])])]; save(g2); toast('Your garden is back.'); home(c); };
}
const draft = {};
function seed(c, i){
  const s=c.seeds[i]; if(!s) return home(c);
  const d = draft[i] ||= {step:0, word:'', story:'', journal:''};
  const g=G(); const done=!!g.acts[i];
  const steps = ['Name it','Hear it','Heed it'];
  let body='';
  if(d.step===0) body = `<div class="card"><h2>1 · Name it</h2><p>What am I really feeling? Say the exact word.</p>
      <div class="sx-wchips">${s.words.map(w=>`<button class="${d.word===w?'on':''}" data-w="${esc(w)}">${esc(w)}</button>`).join('')}</div>
      <label for="sxW">Or use your own word</label><input id="sxW" maxlength="40" value="${s.words.includes(d.word)?'':esc(d.word)}" placeholder="My word">
      <div class="row"><button class="btn" id="sxNext">Next: Hear it ›</button></div></div>`;
  if(d.step===1) body = `<div class="card"><h2>2 · Hear it</h2><p class="lab note">The message inside ${esc(s.feeling.toLowerCase())}:</p><p class="sx-msg">${esc(s.message)}</p>
      <div class="sx-verse"><span class="jw">“${esc(s.verse)}”</span><br><span class="meta">${esc(s.ref)}</span>${s.verseNote?`<br><span class="note">${esc(s.verseNote)}</span>`:''}</div>
      <label for="sxStory">Is the story I'm telling myself true? Write what you hear.</label><textarea id="sxStory" maxlength="3000">${esc(d.story)}</textarea>
      <div class="row"><button class="btn quiet" id="sxPrev">‹ Back</button><button class="btn" id="sxNext">Next: Heed it ›</button></div></div>`;
  if(d.step===2) body = `<div class="card"><h2>3 · Heed it</h2><p>Every seed grows one of two ways. Tap each card to turn it over.</p>
      <div class="sx-flip"><button class="sx-card sx-thorn" aria-label="The thorn: ${esc(s.sin)}"><div class="sx-in"><div class="sx-face front"><span class="lab">The thorn</span><span class="big">${esc(s.sin)}</span><span class="note">if I ignore it</span></div>
        <div class="sx-face back"><p><b>${esc(s.sin)}.</b> ${esc(s.sinLine)}</p><p><b>Its lie:</b> “${esc(s.lie)}”</p><p><b>It chokes:</b> ${esc(s.chokes)}</p></div></div></button>
       <button class="sx-card sx-fruit" aria-label="The fruit: ${esc(s.virtue)}"><div class="sx-in"><div class="sx-face front"><span class="lab">The fruit</span><span class="big">${esc(s.virtue)}</span><span class="note">if I hear it</span></div>
        <div class="sx-face back"><p><b>${esc(s.virtue)}.</b> ${esc(s.virtueLine)}</p><p><b>One act:</b> ${esc(s.act)}</p></div></div></button></div>
      <label for="sxJ">${esc(s.prompt)}</label><textarea id="sxJ" maxlength="5000" style="min-height:140px">${esc(d.journal)}</textarea>
      <div class="sx-act"><input type="checkbox" id="sxAct" ${done?'checked':''}><label for="sxAct" style="margin:0"><b>One act:</b> ${esc(s.act)}<br><span class="note">${done?`Done on ${esc(g.acts[i])}. Your seed bears fruit!`:'Check this when you have done it.'}</span></label></div>
      <div class="row"><button class="btn quiet" id="sxPrev">‹ Back</button><button class="btn" id="sxSave">Plant it in my journal</button></div></div>`;
  const mine = g.entries.filter(e=>e.seed===i).slice().reverse();
  $app.innerHTML = header()+back()+`<div class="hero" style="display:flex;gap:12px;align-items:center"><div style="width:74px;flex:none">${plant(stage(g,i),i)}</div><div><p class="eyebrow" style="margin:0 0 4px">Seed ${s.n} · ${esc(s.feeling)}</p><h1 style="font-size:28px">${esc(s.name)}</h1></div></div>
    <p class="tagline" style="font-size:18px;margin-bottom:12px">${esc(s.scene)}</p>
    <div class="sx-steps">${steps.map((t,k)=>`<span class="${k===d.step?'on':k<d.step?'done':''}">${k+1}. ${t}</span>`).join('')}</div>${body}
    ${mine.length?`<div class="eyebrow">My entries for this seed</div><div class="card">${mine.map(e=>`<div class="sx-entry"><p class="meta">${esc(e.date)}${e.word?` · I felt: <b>${esc(e.word)}</b>`:''}</p>${e.story?`<p>${esc(e.story)}</p>`:''}${e.journal?`<p class="note">${esc(e.journal)}</p>`:''}<button class="btn quiet small" data-del="${e.id}">Delete</button></div>`).join('')}</div>`:''}
    <div class="row" style="justify-content:space-between">${i>0?`<a class="btn quiet small" href="#/seeds/s/${i}">‹ Seed ${c.seeds[i-1].n}</a>`:'<span></span>'}${i<6?`<a class="btn quiet small" href="#/seeds/s/${i+2}">Seed ${c.seeds[i+1].n} ›</a>`:'<a class="btn quiet small" href="#/seeds/harvest">The Harvest ›</a>'}</div>${footer()}`;
  const q=id=>document.getElementById(id);
  $app.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{ d.word=b.dataset.w; seed(c,i); });
  const keep=()=>{ if(q('sxW')&&q('sxW').value.trim()) d.word=q('sxW').value.trim(); if(q('sxStory')) d.story=q('sxStory').value; if(q('sxJ')) d.journal=q('sxJ').value; };
  if(q('sxNext')) q('sxNext').onclick=()=>{ keep(); if(d.step===0 && !d.word) return toast('Pick a word, or type your own.'); d.step++; seed(c,i); scrollTo(0,0);
    if(d.step===1){ const g2=G(); if(!g2.days.includes(today())){ g2.days.push(today()); save(g2); } } };
  if(q('sxPrev')) q('sxPrev').onclick=()=>{ keep(); d.step--; seed(c,i); };
  $app.querySelectorAll('.sx-card').forEach(b=>b.onclick=()=>b.classList.toggle('flip'));
  if(q('sxAct')) q('sxAct').onchange=e=>{ keep(); const g2=G(); if(e.target.checked){ g2.acts[i]=today(); g2.harvest[i]=true; toast('Your seed bears fruit! 🌱'); } else { delete g2.acts[i]; } save(g2); seed(c,i); };
  if(q('sxSave')) q('sxSave').onclick=()=>{ keep(); const g2=G();
    g2.entries.push({id:Date.now(), seed:i, date:today(), word:d.word, story:d.story.trim(), journal:d.journal.trim()});
    if(!g2.days.includes(today())) g2.days.push(today()); save(g2); draft[i]=null; toast('Planted in your journal.'); home(c); scrollTo(0,0); };
  $app.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ if(!confirm('Delete this entry?')) return; const g2=G(); g2.entries=g2.entries.filter(e=>e.id!==+b.dataset.del); save(g2); seed(c,i); });
}
function parable(c){
  $app.innerHTML = header()+back()+hero('The Parable','Where the Seven Seeds come from.')+`<div class="card">${c.parable.map(p=>`<p>${p}</p>`).join('')}</div>
    <div class="card gilt"><h2>The Key</h2><p>Three words open every seed: <b>Name it. Hear it. Heed it.</b></p><ol class="steps">${c.key.map(([a,b])=>`<li><b>${esc(a)}</b> ${esc(b)}</li>`).join('')}</ol><p class="note">You don't have to go in order. Open the seed that matches what you feel right now.</p></div>
    <div class="card"><h2>How each seed works</h2><p>${esc(c.smoke)}</p><ul class="ticks"><li><b>The Seed:</b> the feeling and the message inside it.</li><li><b>The Thorn:</b> what grows when you ignore the message.</li><li><b>The Fruit:</b> what grows when you hear it.</li></ul></div>${footer()}`;
}
function harvest(c){
  const g=G();
  $app.innerHTML = header()+back()+hero('The Harvest',esc(c.harvestIntro))+`<div class="card">${c.seeds.map((s,i)=>`<div class="sx-act" style="background:${g.acts[i]?'#EAF6E6':''}"><input type="checkbox" data-h="${i}" ${g.acts[i]?'checked':''} aria-label="${esc(s.virtue)} done"><span><b>Seed ${s.n}, ${esc(s.virtue)}:</b> ${esc(s.harvest)}${g.acts[i]?`<br><span class="note">Done ${esc(g.acts[i])}</span>`:''}</span></div>`).join('')}
    <p class="tagline" style="font-size:18px;margin-top:12px">${esc(c.harvestEnd)}</p></div>${footer()}`;
  $app.querySelectorAll('[data-h]').forEach(x=>x.onchange=()=>{ const g2=G(), i=+x.dataset.h; if(x.checked) g2.acts[i]=today(); else delete g2.acts[i]; save(g2); harvest(c); });
}
function sheet(c){
  $app.innerHTML = header()+back()+hero('Grab Sheet','Keep this where you\'ll see it every day: mirror, phone, wallet.')+`<div class="card"><p class="tagline" style="text-align:center">Name it · Hear it · Heed it.</p>
    <div style="overflow-x:auto"><table class="sx-table"><tr><th>Seed</th><th>Feeling</th><th>Message</th><th>Thorn</th><th>Fruit</th><th>One act</th></tr>
    ${c.seeds.map(s=>`<tr><td><b>${s.n}</b> ${esc(s.name)}</td><td>${esc(s.feeling)}</td><td>${esc(s.short)}</td><td>${esc(s.sin)}</td><td>${esc(s.virtue)}</td><td>${esc(s.act)}</td></tr>`).join('')}</table></div>
    <div class="row noprint"><button class="btn outline" onclick="window.print()">Print it</button></div></div>${footer()}`;
}
function journal(c){
  const g=G(), es=g.entries.slice().reverse();
  $app.innerHTML = header()+back()+hero('My Journal','Everything you have planted. It stays on this device.')+`<div class="card">${es.length?es.map(e=>`<div class="sx-entry"><p class="meta">${esc(e.date)} · Seed ${c.seeds[e.seed].n}, ${esc(c.seeds[e.seed].feeling)}${e.word?` · <b>${esc(e.word)}</b>`:''}</p>${e.story?`<p>${esc(e.story)}</p>`:''}${e.journal?`<p class="note">${esc(e.journal)}</p>`:''}</div>`).join(''):'<p class="empty">Nothing planted yet. Open a seed to begin.</p>'}</div>${footer()}`;
}
async function route(parts){
  style(); renderNav('home');
  const paid = location.hash.includes('paid');
  if(!hasSeeds()) return landing(paid);
  const c = await content();
  if(!c){ $app.innerHTML=header()+'<div class="card"><p>The Seven Seeds did not load. Check your connection and try again.</p></div>'+footer(); return; }
  const p=parts[1]||'';
  if(p==='s') return seed(c, (+parts[2]||1)-1);
  if(p==='parable') return parable(c);
  if(p==='harvest') return harvest(c);
  if(p==='sheet') return sheet(c);
  if(p==='journal') return journal(c);
  return home(c);
}
window.SEEDS = { route };
})();
