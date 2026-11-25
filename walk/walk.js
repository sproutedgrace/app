/* Daily Walk — a simple daily devotional checklist for Sprouted Grace.
   Morning: read, pray, meditate, journal. Evening: a Psalm or Proverb, thanks, and rest.
   The reading plan follows the Saturday Red Letters sermon series (Preacher's Prep doc). */
(function(){
'use strict';
// ---------- The Red Letters in Ninety Days: weekday reading (Mon–Fri), Saturday LIVE ----------
// Week 1 starts Monday, Nov 23, 2026. Refs: [book, chapter, fromVerse?, toVerse?]  (books: Matthew 39, Mark 40, Luke 41, John 42, Acts 43, 1 Cor 45, 2 Cor 46, Rev 65)
const START = CONFIG.WALK_START || '2026-11-23';
const W = [
 {t:'Servant of All', live:[40,10,35,45], key:'Mark 10:45', days:[[[40,1],[40,2],[40,3]],[[40,4],[40,5],[40,6]],[[40,7],[40,8],[40,9]],[[40,10],[40,11],[40,12]],[[40,13],[40,14],[40,15],[40,16]]]},
 {t:'Salt and Light', live:[39,5,1,16], key:'Matthew 5:16', days:[[[39,3],[39,4]],[[39,5,1,26]],[[39,5,27,48]],[[39,6]],[[39,7]]]},
 {t:'Ears to Hear', live:[39,13,1,23], key:'Matthew 13:9', days:[[[39,8],[39,9]],[[39,10]],[[39,11],[39,12]],[[39,13,1,30]],[[39,13,31,58]]]},
 {t:'Whom Say Ye That I Am?', live:[39,16,13,26], key:'Matthew 16:24', days:[[[39,14],[39,15]],[[39,16],[39,17]],[[39,18]],[[39,19]],[[39,20]]]},
 {t:'The Least of These', live:[39,25,31,46], key:'Matthew 25:40', days:[[[39,21],[39,22]],[[39,23]],[[39,24]],[[39,25]],[[39,26],[39,27],[39,28]]]},
 {t:'Love Your Enemies', live:[41,6,27,38], key:'Luke 6:31', days:[[[41,2],[41,3],[41,4],[41,5]],[[41,6]],[[41,7]],[[41,8]],[[41,9]]]},
 {t:'Lost and Found', live:[41,15,11,32], key:'Luke 15:24', days:[[[41,10]],[[41,11]],[[41,12]],[[41,13],[41,14]],[[41,15]]]},
 {t:'To Seek and to Save', live:[41,19,1,10], key:'Luke 19:10', days:[[[41,16],[41,17]],[[41,18],[41,19]],[[41,20],[41,21]],[[41,22]],[[41,23],[41,24]]]},
 {t:'Born Again', live:[42,3,1,21], key:'John 3:16', days:[[[42,1],[42,2],[42,3]],[[42,4]],[[42,5]],[[42,6,1,40]],[[42,6,41,71]]]},
 {t:'The Good Shepherd', live:[42,10,1,18], key:'John 10:11', days:[[[42,7]],[[42,8]],[[42,9],[42,10]],[[42,11]],[[42,12]]]},
 {t:'The Vine and the Branches', live:[42,15,1,17], key:'John 15:5', days:[[[42,13]],[[42,14]],[[42,15]],[[42,16]],[[42,17]]]},
 {t:'So Send I You', live:[42,20,19,31], key:'John 20:21', days:[[[42,18],[42,19]],[[42,20]],[[42,21]],[[43,1],[43,9]],[[43,10],[43,11],[43,18],[43,20],[43,22],[43,23],[43,26]]]},
 {t:'Behold, I Stand at the Door', live:[65,3,14,22], key:'Revelation 3:20', days:[[[45,11],[46,12]],[[65,1]],[[65,2]],[[65,3]],[[65,16],[65,22]]]}
];
const DAY = 864e5;
const dkey = d => d.toLocaleDateString('en-CA');
const parse = s => { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); };
const addDays = (s,n) => { const d=parse(s); d.setDate(d.getDate()+n); return dkey(d); };
const diff = (a,b) => Math.round((parse(a)-parse(b))/DAY);
const nice = s => parse(s).toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
const refTxt = r => `${refName(r[0],r[1])}${r[2]?`:${r[2]}–${r[3]}`:''}`;
// "Mark 1, Mark 2, Mark 3" -> "Mark 1–3"
function group(refs){
  const out=[]; let i=0;
  while(i<refs.length){ const r=refs[i]; let j=i;
    if(!r[2]) while(j+1<refs.length && refs[j+1][0]===r[0] && !refs[j+1][2] && refs[j+1][1]===refs[j][1]+1) j++;
    out.push(j>i ? `${refName(r[0],r[1])}–${refs[j][1]}` : refTxt(r)); i=j+1; }
  return out.join(', ');
}
function planFor(date){
  const k = diff(date, START);
  if(k<0) return {before:true, days:-k};
  const w = Math.floor(k/7), wd = k%7;            // wd 0=Mon … 5=Sat, 6=Sun
  if(w>=W.length) return {after:true};
  const wk = W[w];
  if(wd<5) return {week:w+1, wk, refs:wk.days[wd], label:group(wk.days[wd])};
  if(wd===5) return {week:w+1, wk, refs:[wk.live], live:true, label:`${refTxt(wk.live)} (today's LIVE passage)`};
  return {week:w+1, wk, refs:[], sunday:true, label:'Rest day. Catch up on any reading you missed this week.'};
}
const satOf = w => addDays(START, (w-1)*7+5);
const psalmFor = date => ((Math.max(0,diff(date,START)) % 150) + 1);
const proverbFor = date => parse(date).getDate();

// ---------- Saving: Supabase for members, this device in preview ----------
const cache = {};
async function load(date){
  if(cache[date]) return cache[date];
  if(S.preview){ return (cache[date] = store('sg.walk.'+date) || {}); }
  const { data } = await S.sb.from('walk_days').select('data').eq('day',date).maybeSingle();
  return (cache[date] = data?.data || {});
}
let saveT=null, saveDate=null;
function save(date, d, quiet){
  cache[date]=d; saveDate=date;
  const el=document.getElementById('wkSaved'); if(el) el.textContent='Saving…';
  clearTimeout(saveT);
  saveT=setTimeout(async()=>{
    let ok=true;
    if(S.preview) store('sg.walk.'+date, d);
    else { const { error } = await S.sb.from('walk_days').upsert({user_id:S.user.id, day:date, data:d, updated_at:new Date().toISOString()}); if(error){ ok=false; toast('Not saved: '+error.message); } }
    const e2=document.getElementById('wkSaved'); if(e2) e2.textContent = ok ? 'Saved ✓' : 'Not saved';
  }, quiet?0:700);
}
const STEPS=['read','prayed','meditated','journaled','evening'];
const doneCount = d => STEPS.filter(k=>d && d[k]).length;
async function history(){
  if(S.preview){ const out=[]; for(let i=0;i<400;i++){ const k=addDays(dkey(new Date()),-i), v=store('sg.walk.'+k); if(v) out.push({day:k,data:v}); } return out; }
  const { data } = await S.sb.from('walk_days').select('day,data').order('day',{ascending:false}).limit(400);
  return data||[];
}
function streakOf(rows){
  const set=new Set(rows.filter(r=>doneCount(r.data)>0).map(r=>r.day));
  let d=dkey(new Date()); if(!set.has(d)) d=addDays(d,-1);
  let n=0; while(set.has(d)){ n++; d=addDays(d,-1); }
  return n;
}
let notes=null;
async function sermonNotes(){
  if(notes) return notes;
  if(S.preview) return (notes = store('sg.walk.notes') || {});
  const { data } = await S.sb.from('sermon_weeks').select('week,notes_url');
  notes={}; (data||[]).forEach(r=>notes[r.week]=r.notes_url); return notes;
}

// ---------- A soft chime (no sound files needed) ----------
let AC=null;
function chime(times=1){
  try{
    AC ||= new (window.AudioContext||window.webkitAudioContext)();
    if(AC.state==='suspended') AC.resume();
    for(let k=0;k<times;k++){
      const t0=AC.currentTime+k*1.6;
      [528,792,1056].forEach((f,i)=>{ const o=AC.createOscillator(), g=AC.createGain(); o.type='sine'; o.frequency.value=f;
        g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime([0.16,0.06,0.03][i],t0+0.03); g.gain.exponentialRampToValueAtTime(0.0001,t0+4.5);
        o.connect(g).connect(AC.destination); o.start(t0); o.stop(t0+4.6); });
    }
  }catch(e){}
}
const timer = {total:15*60, left:15*60, run:false, h:null, lock:null};
function tfmt(s){ return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }

// ---------- Reminder: a daily calendar event the phone will ring for ----------
function reminderICS(time){
  const [h,m]=time.split(':'); const t=dkey(new Date()).replace(/-/g,'');
  const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Sprouted Grace//Daily Walk//EN','BEGIN:VEVENT',
    `UID:dailywalk-${Date.now()}@sproutedgrace.net`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').slice(0,15)}Z`,
    `DTSTART:${t}T${h}${m}00`,`DURATION:PT50M`,'RRULE:FREQ=DAILY','SUMMARY:Daily Walk 🌱',
    'DESCRIPTION:Time for your Daily Walk: read\\, pray\\, be still\\, and journal. https://app.sproutedgrace.net/#/walk',
    'URL:https://app.sproutedgrace.net/#/walk','BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:Daily Walk','TRIGGER:PT0M','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'})); a.download='daily-walk-reminder.ics'; document.body.appendChild(a); a.click(); a.remove();
}

const css=`
.wk-hero{background:linear-gradient(160deg,#FFFDF8,#F3FAF2);border:1px solid var(--edge);border-top:3px solid var(--gold);border-radius:16px;padding:16px 18px;margin-bottom:14px}
html.night .wk-hero{background:linear-gradient(160deg,#22231E,#1F2A20)}
.wk-hero h1{font-size:28px}.wk-hero .meta{margin-top:2px}
.wk-top{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-top:10px}
.wk-streak{display:flex;align-items:center;gap:8px;font-weight:700;color:var(--green-ink)}
.wk-streak b{font-family:var(--serif);font-size:28px;color:var(--gold-ink)}
.wk-dots{display:flex;gap:6px}.wk-dots i{width:14px;height:14px;border-radius:50%;border:2px solid var(--green);display:block}.wk-dots i.on{background:var(--green)}
.wk-step{background:var(--paper);border:1px solid var(--edge);border-radius:16px;padding:16px 18px;margin-bottom:14px;position:relative}
.wk-step.done{border-color:#BFE0B8;background:linear-gradient(180deg,#F3FAF2,var(--paper))}
html.night .wk-step.done{background:linear-gradient(180deg,#1F2A20,var(--paper))}
.wk-step h2{font-size:22px;display:flex;align-items:center;gap:10px;margin-bottom:6px}
.wk-num{width:30px;height:30px;border-radius:50%;background:var(--green);color:#fff;font-family:var(--sans);font-size:15px;display:inline-flex;align-items:center;justify-content:center;flex:none}
.wk-step.done .wk-num{background:var(--lime);color:#17331C}
.wk-min{font-family:var(--sans);font-size:13px;color:var(--muted);font-weight:600;margin-left:auto}
.wk-check{display:flex;align-items:center;gap:10px;margin-top:12px;padding:10px 12px;border-radius:12px;border:1.5px dashed var(--green);cursor:pointer;font-weight:700;color:var(--green-ink);background:transparent;width:100%;font-size:16px}
.wk-check.on{border-style:solid;background:var(--green);color:#fff}
.wk-check i{width:24px;height:24px;border-radius:7px;border:2px solid currentColor;display:inline-flex;align-items:center;justify-content:center;font-style:normal;flex:none}
.wk-refs{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
.wk-sec{font-family:var(--sans);font-size:12.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--gold-ink);margin:22px 0 10px;display:flex;align-items:center;gap:10px}
.wk-sec::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,var(--gold),transparent);opacity:.7}
.wk-timer{display:flex;flex-direction:column;align-items:center;gap:10px;margin:10px 0}
.wk-ring{position:relative;width:180px;height:180px}
.wk-ring svg{width:100%;height:100%;transform:rotate(-90deg)}
.wk-ring span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:40px;color:var(--text)}
.wk-live{background:linear-gradient(160deg,#1E6B34,#239E46);color:#fff;border-radius:16px;padding:16px 18px;margin-bottom:14px}
.wk-live h2{color:#fff;font-size:22px}.wk-live p{color:#EFFFEF}.wk-live .btn.outline{background:transparent;color:#fff;border-color:#fff}
.wk-live a.btn.gold{background:var(--gold);color:#2B2E28;border-color:var(--gold)}
.gd-bed{margin:12px 0}.gd-lab{display:flex;justify-content:space-between;align-items:baseline;gap:8px}.gd-lab .note{margin:0}.gd-bed label{margin:0;font-weight:700}
.gd-row{display:flex;align-items:center;gap:12px}.gd-row input{flex:1;accent-color:var(--green)}.gd-row b{font-family:var(--serif);font-size:22px;width:28px;text-align:right;color:var(--green-ink)}
.gd-past{display:flex;gap:10px;overflow-x:auto;padding-bottom:8px}.gd-mini{flex:none;display:flex;flex-direction:column;align-items:center;gap:2px;text-decoration:none;color:var(--muted);font-size:13px;font-weight:600}
.gd-card{display:flex;gap:14px;align-items:center;text-decoration:none;color:var(--text)}
.wk-nav{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px}
`;
let styled=false;
function style(){ if(styled) return; styled=true; const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s); }
const checkBtn = (on, key, label) => `<button class="wk-check ${on?'on':''}" data-done="${key}" aria-pressed="${!!on}"><i>${on?'✓':''}</i>${on?'Done':label}</button>`;
const ta = (id, label, val, ph='') => `<label for="${id}">${label}</label><textarea id="${id}" data-f="${id.slice(2)}" maxlength="2000" style="min-height:80px" placeholder="${esc(ph)}">${esc(val||'')}</textarea>`;

function gardenCard(big, g){
  return `<a class="card gd-card" href="#/walk/garden" style="${big?'border:2px solid var(--gold)':''}"><span style="flex:none">${flower(g?.scores||{god:6,people:5,body:7,heart:5,work:6,money:4,rest:8,serve:5},big?72:52)}</span><span><b style="font-family:var(--serif);font-size:${big?22:19}px;display:block">${big?'Sunday: walk your garden':'The Weekly Garden'}</b><span class="note">${g?.done?'Done this week. 🌻 Tap to look again.':big?'A 10-minute check-in on each part of your life. Pick one small step for the week.':'Your weekly check-in. Best on Sundays.'}</span></span></a>`;
}
async function viewDay(date){
  renderNav('home');
  const td=dkey(new Date()); date = date || td;
  if(!signedIn()){ $app.innerHTML=header()+hero('Daily Walk','Read, pray, be still, and write. About an hour a day with God.')+joinGate('Free account needed','Make a free account so your Daily Walk is saved to you.')+footer(); return; }
  $app.innerHTML=header()+'<div class="empty">Opening your Daily Walk…</div>';
  const [d, rows, nts] = await Promise.all([load(date), history(), sermonNotes()]);
  const p = planFor(date), streak = streakOf(rows.map(r=>r.day===date?{day:date,data:d}:r));
  const tr = bstate().pos.tr || 'kjv';
  const ps = psalmFor(date), pv = proverbFor(date);
  // Saturday LIVE card: this week's Saturday (or next one)
  const wNow = p.week || (p.before ? 1 : null);
  const live = wNow ? `<div class="wk-live"><p class="meta" style="color:#DFF5DF;margin:0">${p.live?'TODAY':esc(nice(satOf(wNow)))} · 11 AM Central</p><h2>Saturday LIVE · Week ${wNow}: ${esc(W[wNow-1].t)}</h2>
      <p>We read ${esc(refTxt(W[wNow-1].live))} together. Key verse: ${esc(W[wNow-1].key)}.</p>
      <div class="row">${nts[wNow]?`<a class="btn gold small" href="${esc(nts[wNow])}" target="_blank" rel="noopener">This week's sermon notes</a>`:''}<a class="btn outline small" href="${esc(CONFIG.TIKTOK_URL)}" target="_blank" rel="noopener">Watch on TikTok</a></div>
      ${admin()?`<details style="margin-top:10px"><summary style="cursor:pointer;color:#fff;font-weight:700">Admin: sermon notes link for Week ${wNow}</summary><div class="row"><input id="wkNotes" type="url" value="${esc(nts[wNow]||'')}" placeholder="https://…" style="flex:1;min-width:180px"><button class="btn gold small" id="wkNotesGo">Save</button></div></details>`:''}</div>` : '';
  let readBody;
  if(p.before) readBody=`<p>The Red Letters reading plan starts ${esc(nice(START))}. Until then, read anywhere you like.</p>`;
  else if(p.after) readBody=`<p>You finished the Red Letters plan. Well done! Keep reading anywhere you like, or start the plan again.</p>`;
  else if(p.sunday) readBody=`<p><b>Week ${p.week}: ${esc(p.wk.t)}.</b> ${esc(p.label)}</p>`;
  else readBody=`<p><b>Week ${p.week}: ${esc(p.wk.t)}</b></p><p>Today: ${esc(p.label)}</p>
      <div class="wk-refs">${p.refs.map(r=>`<a class="btn small" data-go="${r[0]}/${r[1]}${r[2]?'/'+r[2]:''}" href="#/bible/read/${tr}/${r[0]}/${r[1]}${r[2]?'/'+r[2]:''}">Open ${esc(refTxt(r))}</a>`).join('')}</div>`;
  const mins = Math.round(timer.total/60);
  $app.innerHTML = header()+`
  <div class="wk-hero"><h1>Daily Walk</h1><p class="meta">${esc(nice(date))}${date===td?' · today':''}</p>
    <div class="wk-top"><span class="wk-streak">🌱 <b>${streak}</b> ${streak===1?'day':'days'} in a row</span><span class="wk-dots" aria-label="${doneCount(d)} of 5 done">${STEPS.map(k=>`<i class="${d[k]?'on':''}"></i>`).join('')}</span></div>
    <p class="note" style="margin-top:8px">${doneCount(d)===5?'You walked the whole day with God. 🌿':'Take it one step at a time. Every step counts.'} <span id="wkSaved" class="meta"></span></p></div>
  <div class="wk-nav"><button class="btn quiet small" id="wkPrev">‹ ${esc(parse(addDays(date,-1)).toLocaleDateString(undefined,{weekday:'short'}))}</button>${date!==td?'<button class="btn outline small" id="wkToday">Today</button>':''}<button class="btn quiet small" id="wkNext" ${date>=td?'disabled':''}>${esc(parse(addDays(date,1)).toLocaleDateString(undefined,{weekday:'short'}))} ›</button></div>
  ${p.live||p.sunday||p.before?live:''}
  ${parse(date).getDay()===0?gardenCard(true, d.garden):''}
  <div class="wk-sec">Morning</div>
  <div class="wk-step ${d.read?'done':''}"><h2><span class="wk-num">1</span>Read<span class="wk-min">15 min</span></h2>${readBody}
    <label for="wkline">One line that stood out to me</label><input id="wkline" data-f="line" maxlength="300" value="${esc(d.line||'')}" placeholder="Copy a verse or write it in your words">
    ${checkBtn(d.read,'read','I read today')}</div>
  <div class="wk-step ${d.prayed?'done':''}"><h2><span class="wk-num">2</span>Pray<span class="wk-min">5 min</span></h2><p class="note">Talk to God like a friend. Use these to get started.</p>
    ${ta('wkthanks','Thank You for…',d.thanks,'Something good, big or small')}${ta('wkneeds','I need help with…',d.needs,'What is on your heart today')}${ta('wkwho','I am praying for…',d.who,'Names of people')}
    ${checkBtn(d.prayed,'prayed','I prayed')}</div>
  <div class="wk-step ${d.meditated?'done':''}"><h2><span class="wk-num">3</span>Be still<span class="wk-min">${mins} min</span></h2><p class="note">Sit quietly. Breathe slowly. Think on the line that stood out to you. When your mind wanders, gently come back.</p>
    <div class="wk-timer"><div class="wk-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="var(--line)" stroke-width="5"/><circle id="wkArc" cx="50" cy="50" r="45" fill="none" stroke="var(--green)" stroke-width="5" stroke-linecap="round" stroke-dasharray="282.7" stroke-dashoffset="${282.7*(1-timer.left/timer.total)}"/></svg><span id="wkT">${tfmt(timer.left)}</span></div>
      <div class="chips" style="justify-content:center">${[5,10,15,20].map(m=>`<button class="chip ${m===mins?'on':''}" data-min="${m}">${m} min</button>`).join('')}</div>
      <div class="row" style="justify-content:center;margin-top:0"><button class="btn" id="wkGo">${timer.run?'Pause':timer.left<timer.total?'Keep going':'Start'}</button><button class="btn quiet small" id="wkReset">Reset</button></div>
      <p class="note">A soft chime starts and ends your time. Keep this screen open.</p></div>
    ${checkBtn(d.meditated,'meditated','I was still with God')}</div>
  <div class="wk-step ${d.journaled?'done':''}"><h2><span class="wk-num">4</span>Journal<span class="wk-min">15 min</span></h2>
    ${ta('wkgrat','Three things I am grateful for',d.grat,'1. … 2. … 3. …')}${ta('wkaff','What is true about me today',d.aff,'I am loved. I am growing. With God\'s help, I can do hard things.')}${ta('wkwin','Today\'s win',d.win,'One good thing you did or saw')}
    ${checkBtn(d.journaled,'journaled','I wrote in my journal')}</div>
  ${p.live||p.sunday||p.before?'':live}
  <div class="wk-sec">Evening</div>
  <div class="wk-step ${d.evening?'done':''}"><h2><span class="wk-num">5</span>Rest<span class="wk-min">10 min</span></h2><p>Read one: <a href="#/bible/read/${tr}/18/${ps}">Psalm ${ps}</a> or <a href="#/bible/read/${tr}/19/${pv}">Proverbs ${pv}</a>.</p>
    ${ta('wkeve','Before I sleep, I give thanks for…',d.eve,'')}
    <div class="card dash" style="margin:12px 0 0;box-shadow:none"><p class="tagline" style="font-size:18px;margin:0">"Father, thank You for today. I give You what I carried. Give me rest tonight, and new strength in the morning."</p><p class="note" style="margin-top:6px">Pray this, or use your own words.</p></div>
    ${checkBtn(d.evening,'evening','I read, gave thanks, and prayed for rest')}</div>
  ${parse(date).getDay()===0?'':gardenCard(false)}
  <div class="card"><h2 style="font-size:20px">A gentle reminder</h2><p class="note">Add a daily reminder to your phone's calendar. It will nudge you at the time you pick.</p>
    <div class="row"><input id="wkTime" type="time" value="${esc(store('sg.walk.time')||'06:30')}" style="width:auto"><button class="btn outline small" id="wkICS">Add to my calendar</button></div></div>
  ${footer()}`;
  const q=id=>document.getElementById(id);
  const cur = {...d};
  $app.querySelectorAll('[data-f]').forEach(el=>el.addEventListener('input',()=>{ cur[el.dataset.f]=el.value; save(date,cur); }));
  $app.querySelectorAll('[data-done]').forEach(b=>b.onclick=()=>{ const k=b.dataset.done; cur[k]=!cur[k]; save(date,cur,true); if(cur[k]) toast(k==='evening'?'Rest well. 🌙':'Nice. 🌱'); viewDay(date).then(()=>{ const el=document.querySelector(`[data-done="${k}"]`); if(el) el.scrollIntoView({block:'center'}); }); });
  $app.querySelectorAll('a[href^="#/bible"]').forEach(a=>a.addEventListener('click',()=>{ try{ sessionStorage.setItem('sg.fromWalk','1'); }catch(e){} }));
  q('wkPrev').onclick=()=>location.hash='#/walk/d/'+addDays(date,-1);
  q('wkNext').onclick=()=>{ const n=addDays(date,1); location.hash = n===td ? '#/walk' : '#/walk/d/'+n; };
  if(q('wkToday')) q('wkToday').onclick=()=>location.hash='#/walk';
  // timer
  const draw=()=>{ const t=q('wkT'), a=q('wkArc'); if(t) t.textContent=tfmt(timer.left); if(a) a.style.strokeDashoffset=282.7*(1-timer.left/timer.total); };
  $app.querySelectorAll('[data-min]').forEach(b=>b.onclick=()=>{ if(timer.run) return; timer.total=timer.left=+b.dataset.min*60; viewDay(date); });
  q('wkGo').onclick=async()=>{
    if(timer.run){ timer.run=false; clearInterval(timer.h); q('wkGo').textContent='Keep going'; try{ timer.lock?.release(); }catch(e){} return; }
    if(timer.left===timer.total) chime(1);
    timer.run=true; q('wkGo').textContent='Pause';
    try{ timer.lock = await navigator.wakeLock?.request('screen'); }catch(e){}
    let last=Date.now();
    timer.h=setInterval(()=>{ const now=Date.now(); const step=Math.round((now-last)/1000); if(step<1) return; last+=step*1000; timer.left=Math.max(0,timer.left-step); draw();
      if(timer.left===0){ clearInterval(timer.h); timer.run=false; chime(2); try{ timer.lock?.release(); }catch(e){}
        cur.meditated=true; save(date,cur,true); toast('Well done. 🌿'); timer.left=timer.total; if(location.hash.startsWith('#/walk')) viewDay(date); } }, 250);
  };
  q('wkReset').onclick=()=>{ clearInterval(timer.h); timer.run=false; timer.left=timer.total; try{ timer.lock?.release(); }catch(e){} viewDay(date); };
  q('wkICS').onclick=()=>{ const t=q('wkTime').value||'06:30'; store('sg.walk.time',t); reminderICS(t); toast('Open the file to add it to your calendar.'); };
  const ns=q('wkNotesGo'); if(ns) ns.onclick=async()=>{ const url=q('wkNotes').value.trim();
    if(url && !/^https?:\/\//i.test(url)) return toast('Paste the full link, starting with https://');
    if(S.preview){ const n=store('sg.walk.notes')||{}; n[wNow]=url; store('sg.walk.notes',n); notes=null; toast('Preview: saved.'); return viewDay(date); }
    const { error } = await S.sb.from('sermon_weeks').upsert({week:wNow, notes_url:url||null}); if(error) return toast(error.message); notes=null; toast('Saved.'); viewDay(date); };
}

// ---------- The Weekly Garden: a Sunday check-in on each part of life ----------
const BEDS=[['god','With God','🙏'],['people','Family & friends','🏡'],['body','Body & health','🌿'],['heart','Mind & heart','💭'],['work','Work & calling','🛠️'],['money','Money & giving','🤲'],['rest','Rest & joy','☀️'],['serve','Serving others','🤝']];
const bedName = k => (BEDS.find(b=>b[0]===k)||[,''])[1];
const sundayOf = s => { const d=parse(s); return addDays(s,(7-d.getDay())%7); };
const stage = n => n<=3?'Needs water':n<=7?'Growing':'Blooming';
function flower(sc, size=220){
  const n=BEDS.length, c=50; let petals='';
  BEDS.forEach((b,i)=>{ const v=Math.max(1,+sc[b[0]]||0), L=8+v*3.6, a=(i/n)*360-90;
    petals+=`<ellipse cx="${c}" cy="${c-L/2-6}" rx="${4.2+v*0.35}" ry="${L/2}" transform="rotate(${a+90} ${c} ${c})" fill="${v>=8?'var(--lime)':'var(--green)'}" fill-opacity="${0.35+v*0.06}" stroke="var(--green-ink)" stroke-width=".6"/>`; });
  let ticks=''; BEDS.forEach((b,i)=>{ const a=((i/n)*360-90)*Math.PI/180; ticks+=`<text x="${c+47*Math.cos(a)}" y="${c+47*Math.sin(a)+2}" font-size="6" text-anchor="middle">${b[2]}</text>`; });
  return `<svg viewBox="-4 -4 108 108" width="${size}" height="${size}" role="img" aria-label="Your garden flower"><circle cx="50" cy="50" r="44" fill="none" stroke="var(--line)" stroke-dasharray="2 2"/>${petals}<circle cx="50" cy="50" r="7" fill="var(--gold)" stroke="#fff" stroke-width="1.2"/>${size>80?ticks:''}</svg>`;
}
async function viewGarden(wk){
  renderNav('home');
  const td=dkey(new Date()); wk = sundayOf(wk || td);
  if(!signedIn()){ $app.innerHTML=header()+hero('The Weekly Garden','Once a week, look at each part of your life like a garden bed.')+joinGate('Free account needed','Make a free account so your garden is saved to you.')+footer(); return; }
  $app.innerHTML=header()+'<div class="empty">Opening your garden…</div>';
  const prev=addDays(wk,-7);
  const [rec, last, rows] = await Promise.all([load(wk), load(prev), history()]);
  const g = {scores:{}, ...(rec.garden||{})}; const lg = last.garden||null;
  const past = rows.filter(r=>r.data?.garden?.scores && r.day!==wk).slice(0,8);
  const fresh = !Object.keys(g.scores).length;
  if(fresh && lg?.scores) g.scores={...lg.scores};
  BEDS.forEach(b=>{ if(!g.scores[b[0]]) g.scores[b[0]]=5; });
  $app.innerHTML = header()+`<div class="reader-head"><button class="back" onclick="location.hash='#/walk'">‹ Daily Walk</button></div>
  <div class="wk-hero"><h1>The Weekly Garden</h1><p class="meta">Week ending ${esc(nice(wk))}</p>
    <p style="margin-top:8px">Your life is like a garden with many beds. Once a week, walk through it with God. What is growing? What needs water? About 10 minutes. <span id="wkSaved" class="meta"></span></p></div>
  ${lg?.step?`<div class="card" style="border-left:4px solid var(--gold)"><p class="meta" style="margin:0">LAST WEEK YOU PLANNED</p><p style="margin:4px 0"><b>${esc(bedName(lg.bed))}:</b> ${esc(lg.step)}</p>
    <button class="wk-check ${lg.did?'on':''}" id="gdDid"><i>${lg.did?'✓':''}</i>${lg.did?'I did it!':'I did it'}</button><p class="note" style="margin-top:6px">${lg.did?'Well done. Small steps make big gardens. 🌱':'No shame if not. Every week is a fresh start.'}</p></div>`:''}
  <div class="wk-step"><h2><span class="wk-num">1</span>Walk the garden</h2><p class="note">Slide each one. 1 means dry. 10 means full bloom. Be honest. God already knows, and He is kind.</p>
    <div style="display:flex;justify-content:center;margin:6px 0" id="gdFlower">${flower(g.scores)}</div>
    ${BEDS.map(b=>`<div class="gd-bed"><div class="gd-lab"><label for="gd-${b[0]}"><span aria-hidden="true">${b[2]}</span> ${esc(b[1])}</label><span class="note" id="gs-${b[0]}">${stage(g.scores[b[0]])}</span></div><div class="gd-row"><input type="range" min="1" max="10" step="1" id="gd-${b[0]}" data-bed="${b[0]}" value="${g.scores[b[0]]}"><b id="gv-${b[0]}">${g.scores[b[0]]}</b></div></div>`).join('')}</div>
  <div class="wk-step"><h2><span class="wk-num">2</span>Look back with God</h2>
    ${ta('gdsaw','Where did I see God this week?',g.saw,'A moment, a person, an answer to prayer')}${ta('gdthank','What am I thankful for this week?',g.thank,'')}</div>
  <div class="wk-step"><h2><span class="wk-num">3</span>Water one bed</h2><p class="note">Pick just one part of your life. Choose one small step for this week. Small is good.</p>
    <label for="gdbed">This week I will water…</label><select id="gdbed">${BEDS.map(b=>`<option value="${b[0]}" ${g.bed===b[0]?'selected':''}>${b[2]} ${esc(b[1])}</option>`).join('')}</select>
    <label for="gdstep">My one small step</label><input id="gdstep" maxlength="200" value="${esc(g.step||'')}" placeholder="Call my mom on Wednesday">
    <div class="card dash" style="margin:12px 0 0;box-shadow:none"><p class="tagline" style="font-size:18px;margin:0">"Lord, You are the gardener. Help me grow where You planted me this week."</p></div>
    <button class="wk-check ${g.done?'on':''}" id="gdDone"><i>${g.done?'✓':''}</i>${g.done?'Garden checked':'I walked my garden'}</button></div>
  ${past.length?`<div class="wk-sec">Past weeks</div><div class="gd-past">${past.map(r=>`<a href="#/walk/garden/${r.day}" class="gd-mini">${flower(r.data.garden.scores,72)}<span>${esc(parse(r.day).toLocaleDateString(undefined,{month:'short',day:'numeric'}))}</span></a>`).join('')}</div>`:''}
  ${footer()}`;
  const q=id=>document.getElementById(id);
  const put=()=>{ const r={...rec, garden:g}; save(wk,r); };
  const putSoon=()=>{ const r={...rec, garden:g}; save(wk,r); };
  $app.querySelectorAll('[data-bed]').forEach(el=>el.addEventListener('input',()=>{ const k=el.dataset.bed, v=+el.value; g.scores[k]=v; q('gv-'+k).textContent=v; q('gs-'+k).textContent=stage(v); q('gdFlower').innerHTML=flower(g.scores); putSoon(); }));
  q('gdsaw').addEventListener('input',e=>{ g.saw=e.target.value; putSoon(); });
  q('gdthank').addEventListener('input',e=>{ g.thank=e.target.value; putSoon(); });
  q('gdbed').addEventListener('change',e=>{ g.bed=e.target.value; put(); });
  q('gdstep').addEventListener('input',e=>{ g.step=e.target.value; g.bed=q('gdbed').value; putSoon(); });
  q('gdDone').onclick=()=>{ g.done=!g.done; g.bed=q('gdbed').value; const r={...rec,garden:g}; save(wk,r,true); if(g.done) toast('Your garden is tended. 🌻'); viewGarden(wk); };
  const dd=q('gdDid'); if(dd) dd.onclick=()=>{ lg.did=!lg.did; save(prev,{...last,garden:lg},true); viewGarden(wk); };
  if(fresh){ g.bed ||= q('gdbed').value; }
}
// Small card for the Home page
async function homeCard(el){
  if(!el) return;
  const td=dkey(new Date()), p=planFor(td);
  let line = p.before ? `The Red Letters plan starts ${nice(START)}.` : p.after ? 'Read, pray, be still, and journal.' : p.sunday ? 'Rest day. Walk your Weekly Garden today.' : `Today: ${p.label}`;
  let dots='';
  if(signedIn()){ try{ const d=await load(td); dots=`<span class="wk-dots" style="margin-top:8px">${STEPS.map(k=>`<i class="${d[k]?'on':''}"></i>`).join('')}</span>`; }catch(e){} }
  el.innerHTML = `<span style="width:52px;height:52px;flex:none;border-radius:14px;background:linear-gradient(135deg,var(--green),var(--lime));color:#fff;display:flex;align-items:center;justify-content:center;font-size:26px" aria-hidden="true">☀</span>
    <span><b style="font-family:var(--serif);font-size:21px;display:block">Daily Walk</b><span class="note">${esc(line)}</span>${dots}</span>`;
}
window.WALK = { route: async parts => { style(); clearInterval(timer.h); timer.run=false; if(parts[1]==='garden') return viewGarden(parts[2]||null); return viewDay(parts[1]==='d' ? parts[2] : null); }, homeCard: async el => { style(); return homeCard(el); }, stop: ()=>{ clearInterval(timer.h); timer.run=false; } };
})();
