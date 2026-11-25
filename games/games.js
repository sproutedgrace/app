/* Sprouted Grace Fun Room.
   Nine classic-style games with their own names, rules text, boards, and art.
   Play online with others (Supabase) or pass one phone around ("Play on this phone").
   This file is loaded by index.html only when someone opens the Fun Room. */
(function(){
'use strict';
const R = n => Math.floor(Math.random()*n);
const die = () => 1 + R(6);
const shuffle = a => { a = a.slice(); for(let i=a.length-1;i>0;i--){ const j=R(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const clone = o => JSON.parse(JSON.stringify(o));
const COLORS = ['#239E46','#D4A017','#2F6FB0','#9A5B2E','#7A4FB0','#2F8F8F'];
const CNAMES = ['Green','Gold','Blue','Brown','Purple','Teal'];
const pn = (ctx,i) => esc(ctx.players[i]?.name || `Player ${i+1}`);
const chip = (ctx,i,extra='') => `<span class="gchip"><i style="background:${COLORS[i]}"></i>${pn(ctx,i)}${extra}</span>`;
const nextOf = (i,n) => (i+1)%n;
function bar(st, me, ctx, a, extra=''){
  if(st.over){
    const w = st.winners || (st.winner!=null ? [st.winner] : []);
    return `<div class="gbar done">${w.length ? w.map(i=>pn(ctx,i)).join(' and ') + (w.length>1?' tie!':' wins!') : 'Game over.'} ${extra}</div>`;
  }
  return `<div class="gbar"><i style="background:${COLORS[a]}"></i>${a===me ? '<b>Your turn.</b>' : `${pn(ctx,a)}'s turn.`} ${extra}</div>`;
}
const GAMES = {};

/* ---------------- FOUR IN A ROW ---------------- */
GAMES.four = {
  name:'Four in a Row', icon:'●', min:2, max:2,
  line:'Drop your pieces. Line up four to win.',
  rules:'<p>Take turns. Tap a column to drop a piece. It falls to the lowest open space.</p><p>Line up four of your pieces across, up and down, or on a slant to win.</p>',
  init:()=>({b:Array(42).fill(-1), turn:0, over:false, winner:null, last:-1}),
  render(st, me, ctx){
    return bar(st,me,ctx,st.turn) + `<div class="c4">${st.b.map((v,i)=>`<button class="c4c ${i===st.last?'last':''}" data-col="${i%7}" aria-label="Column ${i%7+1}">${v>=0?`<i style="background:${COLORS[v]}"></i>`:''}</button>`).join('')}</div>`;
  },
  bind(el, st, me, ctx){
    el.querySelectorAll('[data-col]').forEach(b=>b.onclick=()=>{
      if(st.over || st.turn!==me) return;
      const c=+b.dataset.col; let r=5; while(r>=0 && st.b[r*7+c]>=0) r--;
      if(r<0) return ctx.toast('That column is full.');
      const s=clone(st); const i=r*7+c; s.b[i]=me; s.last=i;
      if(four(s.b,i)){ s.over=true; s.winner=me; }
      else if(s.b.every(x=>x>=0)){ s.over=true; s.winner=null; s.winners=[]; }
      else s.turn=nextOf(me,2);
      ctx.move(s);
    });
  }
};
function four(b,i){
  const r=Math.floor(i/7), c=i%7, p=b[i];
  for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){
    let n=1;
    for(const s of [1,-1]){ let rr=r+dr*s, cc=c+dc*s; while(rr>=0&&rr<6&&cc>=0&&cc<7&&b[rr*7+cc]===p){ n++; rr+=dr*s; cc+=dc*s; } }
    if(n>=4) return true;
  }
  return false;
}

/* ---------------- CHECKERS ---------------- */
function ckMoves(st, p){
  const b=st.b, out=[], jumps=[];
  const dirs = pc => pc.k ? [[-1,-1],[-1,1],[1,-1],[1,1]] : (pc.p===0 ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]]);
  for(let i=0;i<64;i++){
    const pc=b[i]; if(!pc || pc.p!==p) continue;
    if(st.chain!=null && st.chain!==i) continue;
    const r=Math.floor(i/8), c=i%8;
    for(const [dr,dc] of dirs(pc)){
      const r1=r+dr, c1=c+dc, r2=r+2*dr, c2=c+2*dc;
      if(r1<0||r1>7||c1<0||c1>7) continue;
      const m=b[r1*8+c1];
      if(!m){ out.push({f:i,t:r1*8+c1}); continue; }
      if(m.p!==p && r2>=0&&r2<=7&&c2>=0&&c2<=7 && !b[r2*8+c2]) jumps.push({f:i,t:r2*8+c2,x:r1*8+c1});
    }
  }
  if(st.chain!=null) return jumps;
  return jumps.length ? jumps : out;
}
GAMES.checkers = {
  name:'Checkers', icon:'⛀', min:2, max:2,
  line:'Jump your way across the board.',
  rules:'<p>Move one piece forward on a slant. Jump over the other player\'s piece to take it. If you can jump, you must. Keep jumping if you can.</p><p>Reach the far side to become a king. Kings move both ways. Take every piece, or leave the other player with no moves, to win.</p>',
  init(){ const b=Array(64).fill(null); for(let i=0;i<64;i++){ const r=Math.floor(i/8), c=i%8; if((r+c)%2===1){ if(r<3) b[i]={p:1,k:false}; if(r>4) b[i]={p:0,k:false}; } } return {b, turn:0, chain:null, over:false, winner:null}; },
  render(st, me, ctx){
    const ui=ctx.ui, mv = (!st.over && st.turn===me) ? ckMoves(st,me) : [];
    const from = new Set(mv.map(m=>m.f)), to = new Set(mv.filter(m=>m.f===ui.sel).map(m=>m.t));
    const flip = me===1;
    let h='';
    for(let k=0;k<64;k++){
      const i = flip ? 63-k : k, r=Math.floor(i/8), c=i%8, pc=st.b[i], dark=(r+c)%2===1;
      h += `<button class="ck ${dark?'dk':''} ${ui.sel===i?'sel':''} ${to.has(i)?'to':''}" data-i="${i}" ${dark?'':'tabindex="-1"'} aria-label="${pc?CNAMES[pc.p]+(pc.k?' king':''):'square'}">${pc?`<i class="pc ${from.has(i)?'can':''}" style="background:${COLORS[pc.p]}">${pc.k?'♛':''}</i>`:''}</button>`;
    }
    const cnt=p=>st.b.filter(x=>x&&x.p===p).length;
    return bar(st,me,ctx,st.turn, st.chain!=null && st.turn===me ? 'Keep jumping!' : '') + `<div class="ckb">${h}</div><p class="gnote">${chip(ctx,0,` · ${cnt(0)} pieces`)} ${chip(ctx,1,` · ${cnt(1)} pieces`)}</p>`;
  },
  bind(el, st, me, ctx){
    el.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{
      if(st.over || st.turn!==me) return;
      const i=+b.dataset.i, mv=ckMoves(st,me);
      const m=mv.find(x=>x.f===ctx.ui.sel && x.t===i);
      if(!m){ if(mv.some(x=>x.f===i)){ ctx.ui.sel=i; ctx.redraw(); } else if(st.b[i]?.p===me) ctx.toast(mv.some(x=>x.x!=null)?'You must jump.':'That piece cannot move.'); return; }
      const s=clone(st), pc=s.b[m.f]; s.b[m.t]=pc; s.b[m.f]=null;
      const r=Math.floor(m.t/8); let kinged=false;
      if(!pc.k && ((pc.p===0&&r===0)||(pc.p===1&&r===7))){ pc.k=true; kinged=true; }
      if(m.x!=null){ s.b[m.x]=null; s.chain=m.t; if(!kinged && ckMoves(s,me).length){ ctx.ui.sel=m.t; return ctx.move(s,true); } }
      s.chain=null; s.turn=nextOf(me,2); ctx.ui.sel=null;
      if(!ckMoves(s,s.turn).length){ s.over=true; s.winner=me; }
      ctx.move(s);
    });
  }
};

/* ---------------- DOTS AND BOXES ---------------- */
const DN=5;
GAMES.dots = {
  name:'Dots and Boxes', icon:'⊡', min:2, max:4,
  line:'Draw lines. Close a box to claim it.',
  rules:'<p>Take turns drawing one line between two dots. If your line closes a box, the box is yours and you go again.</p><p>When every box is closed, the player with the most boxes wins.</p>',
  init:n=>({h:Array((DN+1)*DN).fill(0), v:Array(DN*(DN+1)).fill(0), box:Array(DN*DN).fill(-1), score:Array(n).fill(0), n, turn:0, over:false, winner:null}),
  render(st, me, ctx){
    let h='';
    for(let R2=0;R2<=2*DN;R2++) for(let C2=0;C2<=2*DN;C2++){
      const er=R2%2===0, ec=C2%2===0, r=R2>>1, c=C2>>1;
      if(er&&ec) h+='<span class="dd"></span>';
      else if(er){ const k=r*DN+c, on=st.h[k]; h+=`<button class="dl hz ${on?'on':''}" data-l="h${k}" aria-label="line" ${on?`style="--lc:${COLORS[on-1]}"`:''}></button>`; }
      else if(ec){ const k=r*(DN+1)+c, on=st.v[k]; h+=`<button class="dl vt ${on?'on':''}" data-l="v${k}" aria-label="line" ${on?`style="--lc:${COLORS[on-1]}"`:''}></button>`; }
      else { const o=st.box[r*DN+c]; h+=`<span class="db" ${o>=0?`style="background:${COLORS[o]}33;color:${COLORS[o]}"`:''}>${o>=0?(/^Player \d+$/.test(ctx.players[o]?.name||'')?o+1:esc((ctx.players[o]?.name||'?')[0].toUpperCase())):''}</span>`; }
    }
    return bar(st,me,ctx,st.turn) + `<div class="dbx" style="grid-template-columns:repeat(${DN},12px 1fr) 12px">${h}</div><p class="gnote">${st.score.map((s,i)=>chip(ctx,i,` · ${s}`)).join(' ')}</p>`;
  },
  bind(el, st, me, ctx){
    el.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{
      if(st.over || st.turn!==me) return;
      const t=b.dataset.l[0], k=+b.dataset.l.slice(1);
      if(st[t][k]) return;
      const s=clone(st); s[t][k]=me+1;
      const done = (r,c) => r>=0&&r<DN&&c>=0&&c<DN && s.box[r*DN+c]<0 && s.h[r*DN+c] && s.h[(r+1)*DN+c] && s.v[r*(DN+1)+c] && s.v[r*(DN+1)+c+1];
      const cand = t==='h' ? [[Math.floor(k/DN)-1,k%DN],[Math.floor(k/DN),k%DN]] : [[Math.floor(k/(DN+1)),k%(DN+1)-1],[Math.floor(k/(DN+1)),k%(DN+1)]];
      let got=0; cand.forEach(([r,c])=>{ if(done(r,c)){ s.box[r*DN+c]=me; s.score[me]++; got++; } });
      if(!got) s.turn=nextOf(me,s.n);
      if(s.box.every(x=>x>=0)){ s.over=true; const m=Math.max(...s.score); s.winners=s.score.map((x,i)=>x===m?i:-1).filter(i=>i>=0); }
      ctx.move(s);
    });
  }
};

/* ---------------- MANCALA ---------------- */
GAMES.mancala = {
  name:'Mancala', icon:'◎', min:2, max:2,
  line:'An old African game of sowing seeds.',
  rules:'<p>Pick one of your cups. Its seeds are dropped one at a time into the next cups, going around to the right. Skip the other player\'s store.</p><p>Last seed in your store? Go again. Last seed in an empty cup on your side? Take it and the seeds across from it.</p><p>When one side is empty, the game ends. Most seeds in your store wins.</p>',
  init:()=>({p:[4,4,4,4,4,4,0,4,4,4,4,4,4,0], turn:0, over:false, winner:null, last:-1}),
  render(st, me, ctx){
    const can = i => !st.over && st.turn===me && st.p[i]>0 && (me===0 ? i<6 : i>6&&i<13);
    const pit = i => `<button class="mp ${can(i)?'can':''} ${st.last===i?'last':''}" data-p="${i}" aria-label="Cup with ${st.p[i]} seeds">${seeds(st.p[i])}<b>${st.p[i]}</b></button>`;
    const top = me===1 ? [5,4,3,2,1,0] : [12,11,10,9,8,7], bot = me===1 ? [7,8,9,10,11,12] : [0,1,2,3,4,5];
    const opp = me===1 ? 0 : 1, mine = me===1 ? 1 : 0, store = p => p===0 ? 6 : 13;
    return bar(st,me,ctx,st.turn) + `<div class="mb">
      <div class="ms" style="border-color:${COLORS[opp]}"><b>${st.p[store(opp)]}</b><small>${pn(ctx,opp)}</small></div>
      <div class="mrow">${top.map(pit).join('')}</div><div class="mrow">${bot.map(pit).join('')}</div>
      <div class="ms r" style="border-color:${COLORS[mine]}"><b>${st.p[store(mine)]}</b><small>${pn(ctx,mine)}</small></div></div>
      <p class="gnote">Your cups are the bottom row. Your store is on the right.</p>`;
  },
  bind(el, st, me, ctx){
    el.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{
      const i=+b.dataset.p; if(st.over||st.turn!==me) return;
      if(!(me===0 ? i<6 : i>6&&i<13) || !st.p[i]) return;
      const s=clone(st); let n=s.p[i], k=i; s.p[i]=0;
      const myStore = me===0?6:13, oppStore = me===0?13:6;
      while(n>0){ k=(k+1)%14; if(k===oppStore) continue; s.p[k]++; n--; }
      s.last=k;
      const mySide = me===0 ? k<6 : k>6&&k<13;
      if(mySide && s.p[k]===1 && s.p[12-k]>0){ s.p[myStore]+=s.p[12-k]+1; s.p[k]=0; s.p[12-k]=0; }
      if(k!==myStore) s.turn=nextOf(me,2);
      const a=s.p.slice(0,6).reduce((x,y)=>x+y,0), b2=s.p.slice(7,13).reduce((x,y)=>x+y,0);
      if(!a || !b2){ s.p[6]+=a; s.p[13]+=b2; for(let j=0;j<14;j++) if(j!==6&&j!==13) s.p[j]=0; s.over=true;
        s.winners = s.p[6]===s.p[13] ? [0,1] : [s.p[6]>s.p[13]?0:1]; }
      ctx.move(s);
    });
  }
};
function seeds(n){ return `<span class="sd">${'<i></i>'.repeat(Math.min(n,12))}</span>`; }

/* ---------------- ROLL FIVE (dice) ---------------- */
const CATS=[['1','Ones'],['2','Twos'],['3','Threes'],['4','Fours'],['5','Fives'],['6','Sixes'],['k3','3 of a kind'],['k4','4 of a kind'],['fh','Full house'],['ss','Short run'],['ls','Long run'],['k5','Five alike'],['ch','Any']];
function catScore(cat, d){
  const cnt=[0,0,0,0,0,0,0]; d.forEach(x=>cnt[x]++); const sum=d.reduce((a,b)=>a+b,0), mx=Math.max(...cnt);
  const has = seq => seq.every(x=>cnt[x]>0);
  if(/^[1-6]$/.test(cat)) return cnt[+cat]*+cat;
  if(cat==='k3') return mx>=3?sum:0; if(cat==='k4') return mx>=4?sum:0;
  if(cat==='fh') return cnt.includes(3)&&cnt.includes(2)?25:0;
  if(cat==='ss') return has([1,2,3,4])||has([2,3,4,5])||has([3,4,5,6])?30:0;
  if(cat==='ls') return has([1,2,3,4,5])||has([2,3,4,5,6])?40:0;
  if(cat==='k5') return mx===5?50:0; return sum;
}
const upper = card => ['1','2','3','4','5','6'].reduce((a,k)=>a+(card[k]||0),0);
const total = card => Object.values(card).reduce((a,b)=>a+b,0) + (upper(card)>=63?35:0);
GAMES.dice = {
  name:'Roll Five', icon:'⚄', min:1, max:4,
  line:'Roll five dice. Fill your score card.',
  rules:'<p>On your turn, roll up to three times. Tap dice to keep them between rolls. Then pick one empty box on your card to score.</p><p>Get 63 or more in Ones to Sixes for a 35-point bonus. After 13 turns each, the highest score wins.</p>',
  init:n=>({dice:[1,1,1,1,1], held:[0,0,0,0,0], rolls:0, cards:Array.from({length:n},()=>({})), n, turn:0, over:false, winner:null}),
  render(st, me, ctx){
    const my = st.turn===me && !st.over;
    const dice = st.dice.map((d,i)=>`<button class="die ${st.held[i]?'held':''}" data-h="${i}" ${my&&st.rolls?'':'disabled'} aria-label="Die ${d}${st.held[i]?', kept':''}">${st.rolls?'⚀⚁⚂⚃⚄⚅'[d-1]:'·'}</button>`).join('');
    const card = st.cards[st.turn];
    const rows = CATS.map(([k,l])=>{ const used = k in card; const sc = used ? card[k] : (my&&st.rolls?catScore(k,st.dice):'');
      return `<tr><td>${l}</td>${st.cards.map((c,i)=>`<td class="${i===st.turn?'cur':''}">${i===st.turn && !used && my && st.rolls ? `<button class="pick" data-c="${k}">${sc}</button>` : (k in c ? c[k] : '')}</td>`).join('')}</tr>`; }).join('');
    return bar(st,me,ctx,st.turn) + `<div class="dice">${dice}</div>
      <div class="row" style="justify-content:center;margin:8px 0 14px">${my?`<button class="btn" id="roll" ${st.rolls>=3?'disabled':''}>${st.rolls?`Roll again (${3-st.rolls} left)`:'Roll'}</button>`:''}</div>
      ${my&&st.rolls?'<p class="gnote">Tap dice to keep them. Tap a green number to score it.</p>':''}
      <div class="sctab"><table><tr><th></th>${st.cards.map((c,i)=>`<th style="color:${COLORS[i]}">${pn(ctx,i)}</th>`).join('')}</tr>${rows}
      <tr><td>Bonus</td>${st.cards.map(c=>`<td>${upper(c)>=63?35:`${upper(c)}/63`}</td>`).join('')}</tr>
      <tr class="tot"><td>Total</td>${st.cards.map(c=>`<td>${total(c)}</td>`).join('')}</tr></table></div>`;
  },
  bind(el, st, me, ctx){
    const r=el.querySelector('#roll'); if(r) r.onclick=()=>{ const s=clone(st); s.dice=s.dice.map((d,i)=>s.held[i]?d:die()); s.rolls++; ctx.move(s); };
    el.querySelectorAll('[data-h]').forEach(b=>b.onclick=()=>{ const s=clone(st); s.held[+b.dataset.h]^=1; ctx.move(s,true); });
    el.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{
      const s=clone(st); s.cards[me][b.dataset.c]=catScore(b.dataset.c,s.dice);
      s.rolls=0; s.held=[0,0,0,0,0]; s.turn=nextOf(me,s.n);
      if(s.cards.every(c=>Object.keys(c).length===CATS.length)){ s.over=true; const t=s.cards.map(total), m=Math.max(...t); s.winners=t.map((x,i)=>x===m?i:-1).filter(i=>i>=0); }
      ctx.move(s);
    });
  }
};

/* ---------------- JOURNEY HOME (race game) ---------------- */
const TRACK = Array.from({length:40},(_,i)=> i<=10?[0,i] : i<=20?[i-10,10] : i<=30?[10,30-i] : [40-i,0]);
const LANES = [[[1,5],[2,5],[3,5],[4,5]], [[5,9],[5,8],[5,7],[5,6]], [[9,5],[8,5],[7,5],[6,5]], [[5,1],[5,2],[5,3],[5,4]]];
const NESTS = [[[1,8],[1,9],[2,8],[2,9]], [[8,8],[8,9],[9,8],[9,9]], [[8,1],[8,2],[9,1],[9,2]], [[1,1],[1,2],[2,1],[2,2]]];
const seatOf = (n,p) => n===2 ? [0,2][p] : p;
const startOf = seat => seat*10+6;
function jLegal(st, p, d){
  const seat=seatOf(st.n,p), out=[];
  st.pw[p].forEach((g,k)=>{
    let t;
    if(g===44) return;
    if(g<0){ if(d!==6) return; t=0; } else t=g+d;
    if(t>44) return;
    if(t<44 && st.pw[p].some((h,j)=>j!==k && h===t)) return;   // your own piece is there
    out.push({k,t});
  });
  return out;
}
GAMES.journey = {
  name:'Journey Home', icon:'⚑', min:2, max:4,
  line:'Race your four pieces around and home.',
  rules:'<p>Roll the die. You need a 6 to bring a piece out. Move one piece the number you rolled. A 6 means roll again.</p><p>Land on another player\'s piece to send it back to the start. After one trip around, go up your path to the center. You need the exact number to get home.</p><p>Get all four pieces home to win.</p>',
  init:n=>({pw:Array.from({length:n},()=>[-1,-1,-1,-1]), n, turn:0, roll:null, msg:'', over:false, winner:null}),
  render(st, me, ctx){
    const cell = {};
    const put = (rc, html) => { const k=rc[0]*11+rc[1]; (cell[k] ||= []).push(html); };
    const legal = (!st.over && st.turn===me && st.roll) ? jLegal(st,me,st.roll) : [];
    st.pw.forEach((arr,p)=>{ const seat=seatOf(st.n,p);
      arr.forEach((g,k)=>{
        const can = p===me && legal.some(m=>m.k===k);
        const dot = `<button class="jp ${can?'can':''}" data-k="${can?k:''}" style="background:${COLORS[p]}" aria-label="${CNAMES[p]} piece${can?' (can move)':''}"></button>`;
        if(g<0) put(NESTS[seat][k], dot); else if(g===44) put([5,5], dot); else if(g>=40) put(LANES[seat][g-40], dot); else put(TRACK[(startOf(seat)+g)%40], dot);
      }); });
    const cls = {};
    TRACK.forEach((rc,i)=>cls[rc[0]*11+rc[1]]='jt');
    for(let p=0;p<st.n;p++){ const seat=seatOf(st.n,p);
      cls[TRACK[startOf(seat)].reduce((r,c)=>r*11+c)]='jt st'+p;
      LANES[seat].forEach(rc=>cls[rc[0]*11+rc[1]]='jl l'+p); NESTS[seat].forEach(rc=>cls[rc[0]*11+rc[1]]='jn n'+p); }
    cls[60]='jh';
    let h=''; for(let k=0;k<121;k++){ const c=cls[k]||''; const m=c.match(/(?:st|l|n)(\d)/); const col=m?COLORS[+m[1]]:null;
      h+=`<div class="jc ${c}" ${col?`style="--pc:${col}"`:''}>${(cell[k]||[]).join('')}</div>`; }
    const my = st.turn===me && !st.over;
    return bar(st,me,ctx,st.turn) + `<div class="jb">${h}</div>
      <div class="row" style="justify-content:center;margin:10px 0"><span class="bigdie" aria-label="Die">${st.roll?'⚀⚁⚂⚃⚄⚅'[st.roll-1]:'🎲'}</span>${my&&!st.roll?'<button class="btn" id="jroll">Roll</button>':''}</div>
      ${st.msg?`<p class="gnote">${esc(st.msg)}</p>`:''}${my&&st.roll?'<p class="gnote"><b>Tap a glowing piece to move it.</b></p>':''}
      <p class="gnote">${st.pw.map((a,i)=>chip(ctx,i,` · ${a.filter(g=>g===44).length} home`)).join(' ')}</p>`;
  },
  bind(el, st, me, ctx){
    const r=el.querySelector('#jroll'); if(r) r.onclick=()=>{
      const s=clone(st); s.roll=die(); s.msg=`${ctx.players[me]?.name||'You'} rolled ${s.roll}.`;
      if(!jLegal(s,me,s.roll).length){ s.msg+=' No move this time.'; s.turn = s.roll===6 ? me : nextOf(me,s.n); s.roll=null; }
      ctx.move(s);
    };
    el.querySelectorAll('.jp.can').forEach(b=>b.onclick=()=>{
      const k=+b.dataset.k, m=jLegal(st,me,st.roll).find(x=>x.k===k); if(!m) return;
      const s=clone(st); s.pw[me][k]=m.t; s.msg='';
      if(m.t<40){ const sq=(startOf(seatOf(s.n,me))+m.t)%40;
        s.pw.forEach((arr,p)=>{ if(p===me) return; arr.forEach((g,j)=>{ if(g>=0&&g<40 && (startOf(seatOf(s.n,p))+g)%40===sq){ arr[j]=-1; s.msg=`${ctx.players[me]?.name||'You'} sent ${ctx.players[p]?.name||'a piece'} back to start!`; } }); }); }
      if(s.pw[me].every(g=>g===44)){ s.over=true; s.winner=me; }
      else if(s.roll!==6) s.turn=nextOf(me,s.n);
      s.roll=null; ctx.move(s);
    });
  }
};

/* ---------------- WORD BUILDER (crossword tiles) ---------------- */
const VAL={A:1,B:4,C:3,D:2,E:1,F:4,G:3,H:3,I:1,J:9,K:5,L:2,M:3,N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:2,V:5,W:4,X:8,Y:3,Z:10,'?':0};
const CNT={A:9,B:2,C:2,D:4,E:11,F:2,G:3,H:3,I:8,J:1,K:1,L:4,M:2,N:6,O:8,P:2,Q:1,R:6,S:5,T:6,U:4,V:2,W:2,X:1,Y:2,Z:1,'?':2};
const PREM={};
[[0,3],[0,11],[3,0],[3,14],[11,0],[11,14],[14,3],[14,11]].forEach(([r,c])=>PREM[r*15+c]='TW');
[[2,2],[4,4],[10,10],[12,12],[2,12],[4,10],[10,4],[12,2],[7,7]].forEach(([r,c])=>PREM[r*15+c]='DW');
[[1,6],[1,8],[6,1],[8,1],[6,13],[8,13],[13,6],[13,8],[5,5],[5,9],[9,5],[9,9]].forEach(([r,c])=>PREM[r*15+c]='TL');
[[0,7],[7,0],[7,14],[14,7],[3,7],[7,3],[7,11],[11,7],[2,9],[2,5],[5,2],[9,2],[12,5],[12,9],[5,12],[9,12],[6,6],[6,8],[8,6],[8,8]].forEach(([r,c])=>PREM[r*15+c]='DL');
let DICT=null, dictLoading=null;
function loadDict(){ return dictLoading ||= fetch('games/words.txt').then(r=>r.ok?r.text():'').then(t=>{ DICT = t ? new Set(t.split('\n')) : null; }).catch(()=>{ DICT=null; }); }
function wbScore(board, placed){   // placed: [{i,l,b}]  -> {words:[{w,pts}], total} or {err}
  const B = board.slice(); placed.forEach(p=>B[p.i]={l:p.l,b:p.b});
  const isNew = new Set(placed.map(p=>p.i));
  const rows=new Set(placed.map(p=>Math.floor(p.i/15))), cols=new Set(placed.map(p=>p.i%15));
  if(rows.size>1 && cols.size>1) return {err:'Put your tiles in one straight line.'};
  const horiz = rows.size===1 && (cols.size>1 || (placed.length===1 && ((placed[0].i%15>0 && B[placed[0].i-1]) || (placed[0].i%15<14 && B[placed[0].i+1]))));
  const step = horiz?1:15;
  const word = (start, st2) => { let i=start; const ok=j=>j>=0&&j<225&&B[j]&&(st2===1?Math.floor(j/15)===Math.floor(start/15):true);
    while(ok(i-st2)) i-=st2; const cells=[]; while(ok(i)){ cells.push(i); i+=st2; } return cells; };
  const main = word(placed[0].i, step);
  if(!placed.every(p=>main.includes(p.i))) return {err:'Your tiles must touch each other in one line, with no gaps.'};
  const empty = board.every(x=>!x);
  if(empty && !isNew.has(112)) return {err:'The first word must cover the star in the middle.'};
  const groups = [main.length>1?main:null, ...placed.map(p=>{ const w=word(p.i, horiz?15:1); return w.length>1?w:null; })].filter(Boolean);
  if(!groups.length) return {err:'Words need at least two letters.'};
  if(!empty && !groups.some(g=>g.some(i=>!isNew.has(i)))) return {err:'Your word must connect to tiles already on the board.'};
  const words = groups.map(g=>{ let sum=0, mult=1; g.forEach(i=>{ let v=B[i].b?0:VAL[B[i].l]; const pr=isNew.has(i)?PREM[i]:null;
      if(pr==='DL') v*=2; if(pr==='TL') v*=3; if(pr==='DW') mult*=2; if(pr==='TW') mult*=3; sum+=v; });
    return {w:g.map(i=>B[i].l).join(''), pts:sum*mult}; });
  let total2 = words.reduce((a,b)=>a+b.pts,0); if(placed.length===7) total2+=35;
  return {words, total:total2, bingo:placed.length===7};
}
function wbDraw(s, p){ while(s.racks[p].length<7 && s.bag.length) s.racks[p].push(s.bag.pop()); }
function wbEnd(s){
  s.over=true; const left=s.racks.map(r=>r.reduce((a,l)=>a+VAL[l],0));
  const out=s.racks.findIndex(r=>!r.length);
  s.racks.forEach((r,i)=>{ s.score[i]-=left[i]; if(out>=0 && i!==out) s.score[out]+=left[i]; });
  const m=Math.max(...s.score); s.winners=s.score.map((x,i)=>x===m?i:-1).filter(i=>i>=0);
}
GAMES.words = {
  name:'Word Builder', icon:'Aa', min:2, max:4, hidden:true,
  line:'Build crossing words with letter tiles.',
  rules:'<p>Each player has 7 letter tiles. On your turn, place tiles in one straight line to make a word that connects to the board. The first word covers the star.</p><p>Colored squares boost your score: <b>2L</b> and <b>3L</b> double or triple a letter. <b>2W</b> and <b>3W</b> double or triple the word. Use all 7 tiles for 35 bonus points. The two blank tiles can be any letter.</p><p>You can swap tiles or pass. The game ends when the tiles run out and someone empties their rack. Highest score wins.</p>',
  init(n){ let bag=[]; Object.entries(CNT).forEach(([l,c])=>{ for(let i=0;i<c;i++) bag.push(l); }); bag=shuffle(bag);
    const s={board:Array(225).fill(null), bag, racks:Array.from({length:n},()=>[]), score:Array(n).fill(0), n, turn:0, passes:0, last:null, over:false, winner:null};
    for(let p=0;p<n;p++) wbDraw(s,p); return s; },
  render(st, me, ctx){
    loadDict();
    const ui=ctx.ui; ui.pend ||= []; const pend=ui.pend, my=!st.over&&st.turn===me;
    const pendAt = {}; pend.forEach((p,k)=>pendAt[p.i]=k);
    const used = new Set(pend.map(p=>p.r));
    let h='';
    for(let i=0;i<225;i++){ const t=st.board[i], pk=pendAt[i], pr=PREM[i];
      const tile = t ? `<span class="wt ${st.last?.cells?.includes(i)?'recent':''}">${t.l}<sub>${t.b?'':VAL[t.l]}</sub></span>` : pk!=null ? `<span class="wt pend">${pend[pk].l}<sub>${pend[pk].b?'':VAL[pend[pk].l]}</sub></span>` : (i===112?'★':pr?pr.replace('TW','3W').replace('DW','2W').replace('TL','3L').replace('DL','2L'):'');
      h+=`<button class="wc ${pr?'q'+pr.toLowerCase():''} ${i===112?'star':''}" data-c="${i}" aria-label="Square">${tile}</button>`; }
    const rack = (me>=0 ? st.racks[me] : []).map((l,r)=>`<button class="wt rk ${ui.sel===r?'sel':''} ${used.has(r)?'gone':''} ${ui.swap?.includes(r)?'swap':''}" data-r="${r}" ${used.has(r)?'disabled':''}>${l==='?'?'&nbsp;':l}<sub>${l==='?'?'':VAL[l]}</sub></button>`).join('');
    const prev = pend.length ? wbScore(st.board, pend) : null;
    return bar(st,me,ctx,st.turn, `<span class="meta">${st.bag.length} tiles left</span>`) + `<div class="wscroll"><div class="wb">${h}</div></div>
      ${me>=0?`<div class="rack">${rack}</div>`:''}
      ${my?`<p class="gnote">${ui.swap?'Tap the tiles you want to swap.':prev?(prev.err?esc(prev.err):`${prev.words.map(w=>esc(w.w)).join(', ')} · <b>${prev.total} points</b>`):'Tap a tile, then tap a square. Tap a placed tile to take it back.'}</p>
      <div class="row" style="justify-content:center">${ui.swap?`<button class="btn small" id="wSwapGo">Swap ${ui.swap.length}</button><button class="btn quiet small" id="wSwapX">Cancel</button>`:
        `<button class="btn small" id="wPlay" ${pend.length?'':'disabled'}>Play word</button><button class="btn outline small" id="wBack" ${pend.length?'':'disabled'}>Take back</button><button class="btn quiet small" id="wMix">Mix</button><button class="btn quiet small" id="wSwap" ${st.bag.length>=7&&!pend.length?'':'disabled'}>Swap</button><button class="btn quiet small" id="wPass">Pass</button>`}</div>`:''}
      ${st.last?`<p class="gnote">Last turn: ${pn(ctx,st.last.by)} ${st.last.text?esc(st.last.text):''}</p>`:''}
      <p class="gnote">${st.score.map((s,i)=>chip(ctx,i,` · ${s}`)).join(' ')}</p>`;
  },
  bind(el, st, me, ctx){
    const ui=ctx.ui; ui.pend ||= [];
    el.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{ const r=+b.dataset.r;
      if(ui.swap){ ui.swap = ui.swap.includes(r) ? ui.swap.filter(x=>x!==r) : [...ui.swap,r]; return ctx.redraw(); }
      ui.sel = ui.sel===r ? null : r; ctx.redraw(); });
    el.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{
      if(st.over||st.turn!==me) return; const i=+b.dataset.c;
      const k=ui.pend.findIndex(p=>p.i===i); if(k>=0){ ui.pend.splice(k,1); return ctx.redraw(); }
      if(st.board[i] || ui.sel==null) return;
      let l=st.racks[me][ui.sel], blank=false;
      if(l==='?'){ const a=(prompt('This blank tile can be any letter. Which letter?')||'').trim().toUpperCase(); if(!/^[A-Z]$/.test(a)) return; l=a; blank=true; }
      ui.pend.push({i, r:ui.sel, l, b:blank}); ui.sel=null; ctx.redraw();
    });
    const q=id=>el.querySelector(id);
    if(q('#wBack')) q('#wBack').onclick=()=>{ ui.pend=[]; ctx.redraw(); };
    if(q('#wMix')) q('#wMix').onclick=()=>{ ui.pend=[]; ui.sel=null; const s=clone(st); s.racks[me]=shuffle(s.racks[me]); ctx.move(s,true); };
    if(q('#wSwap')) q('#wSwap').onclick=()=>{ ui.swap=[]; ctx.redraw(); };
    if(q('#wSwapX')) q('#wSwapX').onclick=()=>{ ui.swap=null; ctx.redraw(); };
    if(q('#wSwapGo')) q('#wSwapGo').onclick=()=>{ if(!ui.swap.length) return ctx.toast('Pick tiles to swap.');
      const s=clone(st); const give=ui.swap.map(r=>s.racks[me][r]); s.racks[me]=s.racks[me].filter((_,r)=>!ui.swap.includes(r)); wbDraw(s,me);
      s.bag=shuffle([...s.bag,...give]); s.passes++; s.last={by:me,text:`swapped ${give.length} tiles.`}; ui.swap=null; s.turn=nextOf(me,s.n);
      if(s.passes>=2*s.n) wbEnd(s); ctx.move(s); };
    if(q('#wPass')) q('#wPass').onclick=()=>{ if(!confirm('Pass your turn?')) return; ui.pend=[]; const s=clone(st); s.passes++; s.last={by:me,text:'passed.'}; s.turn=nextOf(me,s.n); if(s.passes>=2*s.n) wbEnd(s); ctx.move(s); };
    if(q('#wPlay')) q('#wPlay').onclick=async()=>{
      if(ui.pend.some(p=>st.board[p.i])){ ui.pend=[]; ctx.redraw(); return ctx.toast('The board changed. Place your tiles again.'); }
      const res=wbScore(st.board, ui.pend); if(res.err) return ctx.toast(res.err);
      await loadDict();
      if(DICT){ const bad=res.words.filter(w=>!DICT.has(w.w.toLowerCase())).map(w=>w.w); if(bad.length) return ctx.toast(`Not in our word list: ${bad.join(', ')}.`); }
      const s=clone(st); ui.pend.forEach(p=>s.board[p.i]={l:p.l,b:p.b});
      const rset=new Set(ui.pend.map(p=>p.r)); s.racks[me]=s.racks[me].filter((_,r)=>!rset.has(r)); wbDraw(s,me);
      s.score[me]+=res.total; s.passes=0; s.last={by:me, cells:ui.pend.map(p=>p.i), text:`played ${res.words.map(w=>w.w).join(', ')} for ${res.total}${res.bingo?' (full rack bonus!)':''}.`};
      ui.pend=[]; ui.sel=null; s.turn=nextOf(me,s.n);
      if(!s.racks[me].length && !s.bag.length) wbEnd(s);
      ctx.move(s);
    };
  }
};

/* ---------------- WHO TOOK THE PIE? (mystery) ---------------- */
const MY_P=['Aunt Rose','Deacon Dan','Choir Director Joy','Usher Sam','Organist Grace','Little Timmy'];
const MY_I=['Picnic Basket','Choir Robe','Umbrella','Bible Bag','Lunch Box','Coffee Pot'];
const MY_L=['Fellowship Hall','Kitchen','Choir Loft','Nursery','Parking Lot','Garden','Library','Front Steps','Bell Tower'];
const MYC = id => ({p:MY_P,i:MY_I,l:MY_L})[id[0]][+id.slice(1)];
GAMES.mystery = {
  name:'Who Took the Pie?', icon:'?', min:3, max:6, hidden:true,
  line:'A friendly mystery. Find who, how, and where.',
  rules:'<p>Someone took the prize pie from the church bake sale! One person, one thing they hid it in, and one place are the answer. Those three cards are hidden. Everyone else holds the rest.</p><p>On your turn, ask about a person, a thing, and a place. Going around, the first player holding one of those cards secretly shows you one. Your notes fill in by themselves.</p><p>When you think you know, make a final guess. Right? You win! Wrong? You are out, but you still show cards.</p>',
  init(n){
    const ps=MY_P.map((_,k)=>'p'+k), is=MY_I.map((_,k)=>'i'+k), ls=MY_L.map((_,k)=>'l'+k);
    const sol=[ps[R(6)], is[R(6)], ls[R(9)]];
    const rest=shuffle([...ps,...is,...ls].filter(c=>!sol.includes(c)));
    const hands=Array.from({length:n},()=>[]); rest.forEach((c,k)=>hands[k%n].push(c));
    return {sol, hands, seen:Array.from({length:n},()=>[]), out:Array(n).fill(false), n, turn:0, phase:'ask', ask:null, responder:null, log:[], over:false, winner:null};
  },
  actor: st => st.phase==='show' ? st.responder : st.turn,
  render(st, me, ctx){
    const a=GAMES.mystery.actor(st), my=!st.over && a===me;
    const known = new Set(me>=0 ? [...st.hands[me], ...st.seen[me].map(x=>x.c)] : []);
    const notes = me>=0 ? [['p',MY_P,'Who'],['i',MY_I,'Hidden in'],['l',MY_L,'Where']].map(([k,arr,t])=>`<div class="mn"><b>${t}</b>${arr.map((x,j)=>{ const id=k+j; const src = st.hands[me].includes(id)?'yours': (st.seen[me].find(s=>s.c===id)?`from ${pn(ctx,st.seen[me].find(s=>s.c===id).f)}`:'');
      return `<div class="${known.has(id)?'x':''}">${known.has(id)?'✓':'□'} ${esc(x)}${src?` <small>(${src})</small>`:''}</div>`; }).join('')}</div>`).join('') : '';
    const sel = (id,arr,k) => `<select id="${id}">${arr.map((x,j)=>`<option value="${k}${j}">${esc(x)}</option>`).join('')}</select>`;
    let act='';
    if(st.over) act = `<div class="card dash" style="margin:10px 0"><p><b>The answer:</b> ${st.sol.map(MYC).map(esc).join(' · ')}</p></div>`;
    else if(my && st.phase==='ask') act = `<div class="card" style="margin:10px 0"><h3 style="font-size:19px">Ask a question</h3><label>Who?</label>${sel('mqP',MY_P,'p')}<label>Hidden in?</label>${sel('mqI',MY_I,'i')}<label>Where?</label>${sel('mqL',MY_L,'l')}
      <div class="row"><button class="btn" id="mAsk">Ask</button></div></div>`;
    else if(my && st.phase==='show'){ const match=st.hands[me].filter(c=>st.ask.cards.includes(c));
      act = `<div class="card" style="margin:10px 0"><p>${pn(ctx,st.ask.by)} asked: ${st.ask.cards.map(MYC).map(esc).join(', ')}.</p><p><b>Pick one card to show them secretly:</b></p><div class="row">${match.map(c=>`<button class="btn outline small" data-show="${c}">${esc(MYC(c))}</button>`).join('')}</div></div>`; }
    else if(my && st.phase==='after') act = `<div class="card" style="margin:10px 0"><p>Do you know the answer?</p><label>Who?</label>${sel('mgP',MY_P,'p')}<label>Hidden in?</label>${sel('mgI',MY_I,'i')}<label>Where?</label>${sel('mgL',MY_L,'l')}
      <div class="row"><button class="btn" id="mGuess">Make my final guess</button><button class="btn outline" id="mEnd">Not yet. End my turn.</button></div></div>`;
    return bar(st,me,ctx,a, st.phase==='show'&&!st.over?'(showing a card)':'') + act +
      `${me>=0?`<div class="eyebrow">My notes</div><div class="mnotes">${notes}</div>`:''}
      <div class="eyebrow">What happened</div><div class="mlog">${st.log.slice(-10).reverse().map(l=>`<p>${esc(l)}</p>`).join('')||'<p class="note">Nothing yet.</p>'}</div>
      <p class="gnote">${st.out.map((o,i)=>chip(ctx,i,o?' · out':'')).join(' ')}</p>`;
  },
  bind(el, st, me, ctx){
    const v=id=>el.querySelector(id)?.value, nm=i=>ctx.players[i]?.name||`Player ${i+1}`;
    const ask=el.querySelector('#mAsk'); if(ask) ask.onclick=()=>{
      const cards=[v('#mqP'),v('#mqI'),v('#mqL')], s=clone(st);
      s.ask={by:me,cards}; s.log.push(`${nm(me)} asked about ${cards.map(MYC).join(', ')}.`);
      let r=nextOf(me,s.n); while(r!==me && !s.hands[r].some(c=>cards.includes(c))) r=nextOf(r,s.n);
      if(r===me){ s.log.push('No one could show a card!'); s.phase='after'; } else { s.phase='show'; s.responder=r; }
      ctx.move(s);
    };
    el.querySelectorAll('[data-show]').forEach(b=>b.onclick=()=>{ const s=clone(st); s.seen[s.ask.by].push({c:b.dataset.show, f:me});
      s.log.push(`${nm(me)} showed a card to ${nm(s.ask.by)}.`); s.phase='after'; s.responder=null; ctx.move(s); });
    const end=el.querySelector('#mEnd'); if(end) end.onclick=()=>{ const s=clone(st); let t=nextOf(me,s.n); while(s.out[t]) t=nextOf(t,s.n); s.turn=t; s.phase='ask'; s.ask=null; ctx.move(s); };
    const g=el.querySelector('#mGuess'); if(g) g.onclick=()=>{
      const guess=[v('#mgP'),v('#mgI'),v('#mgL')]; if(!confirm(`Final guess: ${guess.map(MYC).join(', ')}?`)) return;
      const s=clone(st);
      if(guess.every(c=>s.sol.includes(c))){ s.over=true; s.winner=me; s.log.push(`${nm(me)} solved it!`); }
      else { s.out[me]=true; s.log.push(`${nm(me)} guessed wrong and is out.`);
        if(s.out.every(Boolean)){ s.over=true; s.winners=[]; }
        else { let t=nextOf(me,s.n); while(s.out[t]) t=nextOf(t,s.n); s.turn=t; s.phase='ask'; s.ask=null; } }
      ctx.move(s);
    };
  }
};

/* ---------------- MAIN STREET (property game) ---------------- */
const MS = [
  {n:'Start',k:'go'},{n:'Mustard Seed Ln',p:60,g:0},{n:'Blessing',k:'card'},{n:'Fig Tree Row',p:60,g:0},{n:'Olive Grove',p:100,g:1},{n:'Vineyard Way',p:120,g:1},
  {n:'Time Out',k:'jail'},{n:'Shepherd Field',p:140,g:2},{n:'Blessing',k:'card'},{n:'Fisher Wharf',p:160,g:2},{n:'Baker Street',p:180,g:3},{n:'Potter Lane',p:200,g:3},
  {n:'Rest Stop',k:'free'},{n:'Market Square',p:220,g:4},{n:'Blessing',k:'card'},{n:'Well Road',p:240,g:4},{n:'Cedar Hill',p:260,g:5},{n:'Lily Meadow',p:280,g:5},
  {n:'Go to Time Out',k:'gojail'},{n:'Harvest Field',p:300,g:6},{n:'Blessing',k:'card'},{n:'Riverside',p:320,g:6},{n:'Mountain View',p:350,g:7},{n:'Hilltop Manor',p:400,g:7}];
const GCOL=['#8B5E3C','#7FB8D9','#C46FA8','#E39A3B','#C9A227','#4F8A3A','#2F6FB0','#5B4A8A'];
const MSPOS = i => i<=6 ? [6,6-i] : i<=12 ? [12-i,0] : i<=18 ? [0,i-12] : [i-18,6];
const CARDS=[
  ['A neighbor returns your dish with a thank-you gift. Collect $50.', s=>({cash:50})],
  ['You help a friend move. Go to Start and collect $200.', s=>({to:0})],
  ['Flat tire on the way to church. Pay $50.', s=>({cash:-50})],
  ['Potluck! Collect $10 from each player.', s=>({each:10})],
  ['You forgot your Bible at home. Go back 3 spaces.', s=>({back:3})],
  ['Your garden grows too much zucchini. Sell it for $100.', s=>({cash:100})],
  ['Fix up your homes. Pay $25 for each home you own.', s=>({repair:25})],
  ['Take a day of rest. Go to the Rest Stop.', s=>({to:12})],
  ['You win the pie contest! Collect $75.', s=>({cash:75})],
  ['You buy everyone lunch. Pay each player $10.', s=>({each:-10})]
];
const rentOf = (s, sq) => { const o=s.own[sq]; const base=Math.ceil(MS[sq].p/10); if(!o) return 0;
  const full = MS.every((m,i)=>m.g!==MS[sq].g || s.own[i]?.o===o.o);
  return o.h ? base*[1,5,15,40,60][o.h] : base*(full?2:1); };
const worth = (s,p) => s.cash[p] + Object.entries(s.own).filter(([,o])=>o.o===p).reduce((a,[sq,o])=>a+MS[sq].p+o.h*Math.ceil(MS[sq].p/2),0);
function msPay(s, from, to, amt, ctxNames){
  s.cash[from]-=amt; if(to!=null) s.cash[to]+=amt;
  if(s.cash[from]>=0) return;
  for(const [sq,o] of Object.entries(s.own)) while(o.o===from && o.h>0 && s.cash[from]<0){ o.h--; s.cash[from]+=Math.ceil(MS[sq].p/4); }
  if(s.cash[from]<0){ s.broke[from]=true; Object.keys(s.own).forEach(sq=>{ if(s.own[sq].o===from) delete s.own[sq]; });
    s.log.push(`${ctxNames[from]} ran out of money and is out.`);
    const left=s.broke.map((b,i)=>b?-1:i).filter(i=>i>=0); if(left.length===1){ s.over=true; s.winner=left[0]; } }
}
function msLand(s, p, names){
  const sq=s.pos[p], m=MS[sq];
  if(m.p){ const o=s.own[sq];
    if(!o){ s.phase='buy'; return; }
    if(o.o!==p){ const r=rentOf(s,sq); msPay(s,p,o.o,r,names); s.log.push(`${names[p]} paid $${r} rent to ${names[o.o]}.`); } }
  else if(m.k==='card'){ if(!s.deck.length) s.deck=shuffle(CARDS.map((_,i)=>i)); const ci=s.deck.pop(); s.card=CARDS[ci][0]; const e=CARDS[ci][1](s);
    s.log.push(`${names[p]}: ${CARDS[ci][0]}`);
    if(e.cash>0) s.cash[p]+=e.cash; if(e.cash<0) msPay(s,p,null,-e.cash,names);
    if(e.each) s.cash.forEach((_,i)=>{ if(i!==p && !s.broke[i]){ if(e.each>0) msPay(s,i,p,e.each,names); else msPay(s,p,i,-e.each,names); } });
    if(e.repair){ const h=Object.values(s.own).filter(o=>o.o===p).reduce((a,o)=>a+o.h,0); if(h) msPay(s,p,null,h*e.repair,names); }
    if(e.to!=null){ if(e.to<=s.pos[p]) s.cash[p]+=200; s.pos[p]=e.to; return msLand(s,p,names); }
    if(e.back){ s.pos[p]=(s.pos[p]+24-e.back)%24; return msLand(s,p,names); } }
  else if(m.k==='gojail'){ s.pos[p]=6; s.held[p]=0; s.dbl=0; s.log.push(`${names[p]} went to Time Out.`); }
  if(!s.over) s.phase='end';
}
function msNext(s, names){
  let t=s.turn; do { t=nextOf(t,s.n); if(t===0) s.round++; } while(s.broke[t]);
  s.turn=t; s.phase='roll'; s.dbl=0; s.card=null;
  if(s.round>s.maxRound){ s.over=true; const w=s.cash.map((_,i)=>s.broke[i]?-1:worth(s,i)), m=Math.max(...w); s.winners=w.map((x,i)=>x===m?i:-1).filter(i=>i>=0); s.log.push('Time is up! The richest player wins.'); }
}
GAMES.market = {
  name:'Main Street', icon:'$', min:2, max:4,
  line:'Buy streets, build homes, collect rent.',
  rules:'<p>Roll two dice and move. Land on an open street to buy it. Land on someone else\'s street and pay them rent.</p><p>Own both streets of one color to double the rent and build homes. Each home raises the rent. Pass Start to collect $200. Doubles let you roll again.</p><p>Run out of money and you are out. After 20 rounds, the player worth the most wins.</p>',
  init:n=>({pos:Array(n).fill(0), cash:Array(n).fill(1500), own:{}, held:Array(n).fill(-1), broke:Array(n).fill(false), n, turn:0, phase:'roll', dice:[1,1], dbl:0, deck:shuffle(CARDS.map((_,i)=>i)), card:null, round:1, maxRound:20, log:[], over:false, winner:null}),
  render(st, me, ctx){
    const my=!st.over && st.turn===me, cells={};
    st.pos.forEach((q,p)=>{ if(!st.broke[p]) (cells[q] ||= []).push(`<i class="tok" style="background:${COLORS[p]}"></i>`); });
    let h=''; for(let r=0;r<7;r++) for(let c=0;c<7;c++){
      if(r>0&&r<6&&c>0&&c<6) continue;
      const i=MS.findIndex((_,k)=>{ const [rr,cc]=MSPOS(k); return rr===r&&cc===c; }); const m=MS[i], o=st.own[i];
      h+=`<div class="msq ${m.k||''}" style="grid-row:${r+1};grid-column:${c+1}">${m.p?`<span class="band" style="background:${GCOL[m.g]}"></span>`:''}<span class="nm">${esc(m.n)}</span>${m.p?`<span class="pr">${o?`<b style="color:${COLORS[o.o]}">${'⌂'.repeat(o.h)||'owned'}</b>`:'$'+m.p}</span>`:''}<span class="toks">${(cells[i]||[]).join('')}</span></div>`; }
    const sq=MS[st.pos[st.turn]];
    let ctl='';
    if(my){
      if(st.phase==='roll') ctl=`<button class="btn small" id="msRoll">${st.held[me]>=0?'Roll for doubles':'Roll'}</button>${st.held[me]>=0?`<button class="btn outline small" id="msPayOut">Pay $50 to leave</button>`:''}`;
      if(st.phase==='buy') ctl=`<p class="gnote">${esc(sq.n)} costs $${sq.p}.</p><button class="btn small" id="msBuy" ${st.cash[me]>=sq.p?'':'disabled'}>Buy it</button><button class="btn outline small" id="msSkip">No thanks</button>`;
      if(st.phase==='end'){
        const build = Object.entries(st.own).filter(([q,o])=>o.o===me && o.h<4 && MS.every((m2,k)=>m2.g!==MS[q].g || st.own[k]?.o===me));
        ctl=(build.length?`<select id="msB">${build.map(([q])=>`<option value="${q}">${esc(MS[q].n)} (+home $${Math.ceil(MS[q].p/2)})</option>`).join('')}</select><button class="btn outline small" id="msBuild">Build home</button>`:'')
          + `<button class="btn small" id="msEnd">${st.dbl&&st.held[me]<0?'Roll again':'End turn'}</button>`;
      }
    }
    const center = `<div class="msc"><div class="msdice">${'⚀⚁⚂⚃⚄⚅'[st.dice[0]-1]} ${'⚀⚁⚂⚃⚄⚅'[st.dice[1]-1]}</div>
      ${st.card?`<p class="mscard">“${esc(st.card)}”</p>`:''}<div class="row" style="justify-content:center;margin-top:6px">${ctl}</div>
      <p class="meta" style="margin-top:6px">Round ${Math.min(st.round,st.maxRound)} of ${st.maxRound}</p></div>`;
    return bar(st,me,ctx,st.turn) + `<div class="msb">${h}${center}</div>
      <p class="gnote">${st.cash.map((c,i)=>chip(ctx,i,st.broke[i]?' · out':` · $${c}${st.held[i]>=0?' · in Time Out':''}`)).join(' ')}</p>
      <div class="mlog">${st.log.slice(-6).reverse().map(l=>`<p>${esc(l)}</p>`).join('')}</div>`;
  },
  bind(el, st, me, ctx){
    const names=ctx.players.map((p,i)=>p?.name||`Player ${i+1}`), q=id=>el.querySelector(id);
    if(q('#msRoll')) q('#msRoll').onclick=()=>{
      const s=clone(st), a=die(), b=die(); s.dice=[a,b]; s.card=null;
      if(s.held[me]>=0){
        if(a===b){ s.held[me]=-1; s.log.push(`${names[me]} rolled doubles and left Time Out.`); }
        else { s.held[me]++; if(s.held[me]>=3){ msPay(s,me,null,50,names); s.held[me]=-1; s.log.push(`${names[me]} paid $50 to leave Time Out.`); } else { s.phase='end'; s.log.push(`${names[me]} stays in Time Out.`); return ctx.move(s); } }
        s.dbl=0;
      } else if(a===b){ s.dbl++; if(s.dbl>=3){ s.pos[me]=6; s.held[me]=0; s.dbl=0; s.phase='end'; s.log.push(`${names[me]} rolled doubles 3 times and went to Time Out.`); return ctx.move(s); } }
      else s.dbl=0;
      const np=s.pos[me]+a+b; if(np>=24){ s.cash[me]+=200; s.log.push(`${names[me]} passed Start: +$200.`); } s.pos[me]=np%24;
      msLand(s,me,names); ctx.move(s);
    };
    if(q('#msPayOut')) q('#msPayOut').onclick=()=>{ const s=clone(st); msPay(s,me,null,50,names); s.held[me]=-1; s.log.push(`${names[me]} paid $50 to leave Time Out.`); ctx.move(s); };
    if(q('#msBuy')) q('#msBuy').onclick=()=>{ const s=clone(st), sq=s.pos[me]; s.cash[me]-=MS[sq].p; s.own[sq]={o:me,h:0}; s.log.push(`${names[me]} bought ${MS[sq].n}.`); s.phase='end'; ctx.move(s); };
    if(q('#msSkip')) q('#msSkip').onclick=()=>{ const s=clone(st); s.phase='end'; ctx.move(s); };
    if(q('#msBuild')) q('#msBuild').onclick=()=>{ const s=clone(st), sq=q('#msB').value, cost=Math.ceil(MS[sq].p/2);
      if(s.cash[me]<cost) return ctx.toast('Not enough money.'); s.cash[me]-=cost; s.own[sq].h++; s.log.push(`${names[me]} built a home on ${MS[sq].n}.`); ctx.move(s); };
    if(q('#msEnd')) q('#msEnd').onclick=()=>{ const s=clone(st); if(s.dbl && s.held[me]<0 && !s.broke[me]){ s.phase='roll'; s.card=null; } else msNext(s,names); ctx.move(s); };
  }
};

/* =================== THE ROOM: lobby, tables, pass-and-play =================== */
const ORDER=['words','journey','mystery','market','checkers','four','dots','mancala','dice'];
const css = `
.gbar{display:flex;align-items:center;gap:8px;padding:10px 14px;border:1px solid var(--edge);border-radius:12px;background:var(--paper);margin-bottom:12px;font-size:16px}
.gbar i,.gchip i{display:inline-block;width:14px;height:14px;border-radius:50%;flex:none}
.gbar.done{border-color:var(--gold);font-weight:700;color:var(--gold-ink)}
.gchip{display:inline-flex;align-items:center;gap:6px;margin:3px 10px 3px 0;font-size:14px;white-space:nowrap}
.gnote{text-align:center;font-size:14.5px;color:var(--muted);margin:8px 0}
.gcards{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.gcard{background:var(--paper);border:1px solid var(--edge);border-radius:14px;padding:14px;text-align:left;cursor:pointer;color:var(--text);display:flex;flex-direction:column;gap:4px}
.gcard:hover{border-color:var(--green)}
.gcard .gi{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,var(--green),var(--lime));color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;font-family:var(--serif)}
.gcard b{font-size:16px}.gcard span{font-size:13.5px;color:var(--muted);line-height:1.35}
.code{font-family:ui-monospace,Menlo,monospace;font-size:28px;letter-spacing:.2em;font-weight:700;color:var(--green-ink)}
.curtain{text-align:center;padding:40px 10px}
.c4{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;background:#1F6B33;padding:8px;border-radius:14px;max-width:420px;margin:0 auto}
.c4c{aspect-ratio:1;border-radius:50%;border:0;background:#FAF6EC;padding:0;display:flex;align-items:center;justify-content:center;cursor:pointer}
.c4c i{width:100%;height:100%;border-radius:50%;box-shadow:inset 0 -3px 0 rgba(0,0,0,.2)}
.c4c.last i{outline:3px solid #fff;outline-offset:-5px}
.ckb{display:grid;grid-template-columns:repeat(8,1fr);max-width:420px;margin:0 auto;border:3px solid #6B4A2B;border-radius:6px;overflow:hidden}
.ck{aspect-ratio:1;border:0;background:#EFE3C8;padding:0;display:flex;align-items:center;justify-content:center}
.ck.dk{background:#7A5A3A;cursor:pointer}.ck.sel{background:#4B7F3A}.ck.to{background:#5E9B4A;box-shadow:inset 0 0 0 3px var(--lime)}
.pc{width:76%;height:76%;border-radius:50%;box-shadow:inset 0 -3px 0 rgba(0,0,0,.25),0 2px 3px rgba(0,0,0,.3);color:#fff;font-style:normal;display:flex;align-items:center;justify-content:center;font-size:18px}
.pc.can{outline:2px solid #fff;outline-offset:1px}
.dbx{display:grid;max-width:380px;margin:0 auto;grid-auto-rows:auto}
.dbx>*{min-width:0;min-height:0}
.dbx .dd{width:12px;height:12px;border-radius:50%;background:var(--text)}
.dl{appearance:none;-webkit-appearance:none;border:0;background:transparent;padding:0;cursor:pointer;position:relative;min-height:12px;min-width:12px}
.dl::after{content:"";position:absolute;background:var(--lc,var(--line));border-radius:3px}
.dl.hz::after{left:0;right:0;top:4px;height:4px}.dl.vt::after{top:0;bottom:0;left:4px;width:4px}
.dl.on.hz::after{top:3px;height:6px}.dl.on.vt::after{left:3px;width:6px}
.dl:not(.on):hover::after{background:var(--lime)}
.db{aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;border-radius:4px}
.mb{display:grid;grid-template-columns:46px minmax(0,1fr) 46px;grid-template-rows:auto auto;gap:6px;background:#8A6239;padding:10px;border-radius:40px;max-width:520px;margin:0 auto}
.ms{grid-row:1/3;background:#6B4A2B;border-radius:26px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;border:3px solid;padding:6px 2px}
.ms.r{grid-column:3}.ms b{font-size:22px}.ms small{font-size:10px;text-align:center;word-break:break-word}
.mrow{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px;grid-column:2;min-width:0}
.mb>*{min-width:0}
.mp{aspect-ratio:1;border-radius:50%;border:0;background:#6B4A2B;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2px}
.mp.can{cursor:pointer;box-shadow:0 0 0 3px var(--lime)}.mp.last{background:#4F7A34}
.mp b{font-size:13px}.sd{display:flex;flex-wrap:wrap;justify-content:center;gap:1px;max-width:30px}.sd i{width:6px;height:6px;border-radius:50%;background:#F2D59B}
.dice{display:flex;justify-content:center;gap:8px}
.die{font-size:46px;line-height:1;background:var(--paper);border:2px solid var(--edge);border-radius:12px;width:58px;height:58px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text);padding:0}
.die.held{border-color:var(--green);background:#E4F3E7;color:var(--green-ink)}
.sctab{overflow-x:auto}.sctab table{width:100%;border-collapse:collapse;font-size:15px}
.sctab td,.sctab th{padding:6px 8px;border-bottom:1px solid var(--line);text-align:center}
.sctab td:first-child{text-align:left;color:var(--muted)}.sctab td.cur{background:rgba(101,217,22,.08)}.sctab tr.tot td{font-weight:700;color:var(--text)}
.pick{border:1px solid var(--green);background:#E4F3E7;color:var(--green-ink);font-weight:700;border-radius:8px;min-width:38px;padding:3px 6px;cursor:pointer}
.jb{display:grid;grid-template-columns:repeat(11,1fr);gap:2px;max-width:440px;margin:0 auto}
.jc{aspect-ratio:1;border-radius:5px;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:1px}
.jt{background:var(--paper);border:1px solid var(--edge)}
.jt.st0,.jt.st1,.jt.st2,.jt.st3{background:var(--pc);opacity:.85}
.jl{background:color-mix(in srgb,var(--pc) 35%,var(--paper))}.jn{background:color-mix(in srgb,var(--pc) 18%,transparent);border-radius:50%}
.jh{background:radial-gradient(circle,var(--gold),#B8860B);border-radius:50%}
.jp{width:62%;height:62%;min-width:10px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 2px rgba(0,0,0,.4);padding:0}
.jc .jp:nth-child(n+2){width:42%;height:42%}
.jp.can{cursor:pointer;animation:glow 1s infinite alternate;outline:2px solid var(--lime)}
@keyframes glow{to{transform:scale(1.18)}}
.bigdie{font-size:52px;line-height:1;margin-right:12px}
.wscroll{overflow-x:auto;margin:0 -4px;padding:0 4px}
.wb{display:grid;grid-template-columns:repeat(15,minmax(22px,1fr));gap:1px;background:#C9BC9B;border:2px solid #A8986F;min-width:345px;max-width:560px;margin:0 auto}
.wc{aspect-ratio:1;border:0;background:#F3EAD3;padding:0;font-size:9px;font-weight:700;color:#7a6a45;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative}
.wc.qtw{background:#E9A13B;color:#fff}.wc.qdw{background:#EFC6A6;color:#7a4a20}.wc.qtl{background:#3F86B8;color:#fff}.wc.qdl{background:#BEDBEC;color:#2a5a7a}.wc.star{background:#EFC6A6;font-size:14px;color:#8A6508}
.wt{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#F7E3B0;color:#3a2a10;font-family:var(--serif);font-size:15px;font-weight:600;border-radius:3px;box-shadow:inset 0 -2px 0 rgba(0,0,0,.15);position:relative}
.wt sub{position:absolute;right:2px;bottom:1px;font-size:7px;font-family:var(--sans)}
.wt.pend{background:#CFEFBF;outline:2px solid var(--green)}.wt.recent{background:#FBE9A8}
.rack{display:flex;justify-content:center;gap:6px;margin:12px 0 4px}
.wt.rk{width:42px;height:46px;font-size:22px;border:0;cursor:pointer;flex:none}
.wt.rk sub{font-size:10px}.wt.rk.sel{transform:translateY(-6px);outline:3px solid var(--green)}.wt.rk.gone{opacity:.25}.wt.rk.swap{outline:3px dashed var(--gold)}
.mnotes{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;font-size:14.5px}
.mn b{display:block;color:var(--gold-ink);font-size:12px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px}
.mn div.x{color:var(--muted);text-decoration:line-through}.mn small{text-decoration:none;font-size:11px}
.mlog{background:var(--paper);border:1px solid var(--edge);border-radius:12px;padding:8px 12px;font-size:14.5px;margin-top:8px}
.mlog p{margin:4px 0;border-bottom:1px dashed var(--line);padding-bottom:4px}.mlog p:last-child{border:0}
.msb{display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:repeat(7,1fr);gap:2px;max-width:560px;margin:0 auto;aspect-ratio:1;background:#CFE3C9;border:2px solid var(--green);border-radius:8px;padding:2px}
.msq{background:var(--paper);border-radius:3px;font-size:8.5px;line-height:1.1;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2px;overflow:hidden}
.msq .band{position:absolute;top:0;left:0;right:0;height:7px}.msq .nm{margin-top:5px;font-weight:600}.msq .pr{color:var(--muted)}
.msq.go,.msq.jail,.msq.free,.msq.gojail{background:#FFF6DA;font-weight:700}.msq.card{background:#E4F3E7}
.toks{display:flex;gap:1px;flex-wrap:wrap;justify-content:center}.tok{width:10px;height:10px;border-radius:50%;border:1.5px solid #fff;box-shadow:0 1px 2px rgba(0,0,0,.4)}
.msc{grid-row:2/7;grid-column:2/7;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px;text-align:center}
.msc select{width:auto;max-width:100%;font-size:13px;padding:6px}.msc .btn{margin:3px}
.msdice{font-size:40px;line-height:1}.mscard{font-family:var(--serif);font-style:italic;font-size:14px;margin-top:4px}
`;
let styled=false;
function style(){ if(styled) return; styled=true; const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s); }

const live = {id:null, ch:null, poll:null, room:null, ui:{}};
function stop(){ if(live.ch && S.sb) S.sb.removeChannel(live.ch); clearInterval(live.poll); live.id=null; live.ch=null; live.poll=null; live.room=null; live.ui={}; }
const LKEY = g => 'sg.fun.local.'+g;
function frame(inner, back='#/fun', label='Fun Room'){ return header()+`<div class="reader-head"><button class="back" onclick="location.hash='${back}'">‹ ${label}</button></div>`+inner+footer(); }

async function lobby(){
  let mine=[], open=[];
  if(signedIn() && !S.preview){
    const { data } = await S.sb.from('game_rooms').select('id,game,code,status,players,max_players,host,updated_at').neq('status','done').order('updated_at',{ascending:false}).limit(60);
    (data||[]).forEach(r=>{ if((r.players||[]).some(p=>p.id===myId())) mine.push(r); else if(r.status==='open' && r.players.length<r.max_players) open.push(r); });
  }
  const rowOf = r => `<button class="thread" data-room="${r.id}"><h3>${esc(GAMES[r.game]?.name||r.game)}</h3><div class="meta">${r.players.map(p=>esc(p.name)).join(', ')} · ${r.status==='open'?`waiting (${r.players.length}/${r.max_players})`:'playing'}</div></button>`;
  $app.innerHTML = header()+`<div class="reader-head"><button class="back" onclick="location.hash='#/fellowship'">‹ Fellowship</button></div>`+hero('Fun Room','Play classic games with friends from church. Play online, or pass one phone around.')+`
    ${mine.length?`<div class="eyebrow">Your games</div>${mine.map(rowOf).join('')}`:''}
    <div class="eyebrow">Pick a game</div>
    <div class="gcards">${ORDER.map(k=>`<button class="gcard" data-g="${k}"><span class="gi">${GAMES[k].icon}</span><b>${esc(GAMES[k].name)}</b><span>${esc(GAMES[k].line)}</span><span>${GAMES[k].min===GAMES[k].max?`${GAMES[k].min} players`:`${GAMES[k].min}–${GAMES[k].max} players`}</span></button>`).join('')}</div>
    ${CONFIG.CARDS_URL?`<a class="card" href="${esc(CONFIG.CARDS_URL)}" target="_blank" rel="noopener" style="display:flex;gap:14px;align-items:center;text-decoration:none;color:var(--text);border-left:4px solid var(--gold)"><span style="font-size:34px;line-height:1" aria-hidden="true">🂡</span><span style="flex:1"><b style="font-family:var(--serif);font-size:20px;display:block">Looking for card games?</b><span class="note">Pinochle, Hearts, Spades, Canasta and more. Each one has a "teach me" mode. They live on our sister site, with their own free account.</span></span><span style="font-size:22px;color:var(--gold-ink)" aria-hidden="true">›</span></a>`:''}
    <div class="eyebrow">Join a table</div>
    ${signedIn()?`<div class="card"><label for="jcode" style="margin-top:0">Have a table code?</label><div class="row" style="margin-top:6px"><input id="jcode" maxlength="6" placeholder="ABCDE" autocapitalize="characters" style="flex:1;min-width:120px;text-transform:uppercase"><button class="btn" id="jgo">Join</button></div></div>
      ${open.length?open.map(rowOf).join(''):'<p class="note">No open tables right now. Start one!</p>'}`
      : `<div class="card"><p>Make a free account to play online with others. Anyone can play on one phone without an account.</p><div class="row"><a class="btn outline" href="#/account" onclick="authTab='up'">Make a Free Account</a></div></div>`}
    <p class="note" style="margin-top:18px;text-align:center">Be kind and play fair. Have fun!</p>${footer()}`;
  $app.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>location.hash='#/fun/g/'+b.dataset.g);
  $app.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>location.hash='#/fun/r/'+b.dataset.room);
  const jg=document.getElementById('jgo'); if(jg) jg.onclick=async()=>{
    const code=document.getElementById('jcode').value.trim().toUpperCase(); if(!code) return;
    if(S.preview) return toast('Preview mode: online tables work on the live app.');
    const { data, error } = await S.sb.rpc('join_room_code',{p_code:code}); if(error) return toast(error.message); location.hash='#/fun/r/'+data;
  };
}
function gamePage(k){
  const g=GAMES[k]; if(!g){ location.hash='#/fun'; return; }
  const saved=store(LKEY(k));
  $app.innerHTML = frame(`<div class="hero" style="display:flex;gap:14px;align-items:center"><span class="gcard" style="padding:0;border:0;background:none"><span class="gi" style="width:60px;height:60px;font-size:30px">${g.icon}</span></span><div><h1 style="font-size:28px">${esc(g.name)}</h1><p>${esc(g.line)}</p></div></div>
    <div class="card"><h2 style="font-size:20px">How to play</h2>${g.rules}</div>
    <div class="card"><h2 style="font-size:20px">Play online with others</h2><p class="note">Start a table and share the code. Everyone plays from their own phone.</p>
      ${signedIn()?`<label for="maxp">How many players?</label><select id="maxp">${Array.from({length:g.max-g.min+1},(_,i)=>g.min+i).map(n=>`<option ${n===Math.min(g.max,Math.max(g.min,4))?'selected':''}>${n}</option>`).join('')}</select>
        <div class="row"><button class="btn" id="newT">Start a table</button></div>`:`<div class="row"><a class="btn outline" href="#/account" onclick="authTab='up'">Make a free account to play online</a></div>`}</div>
    <div class="card"><h2 style="font-size:20px">Play on this phone</h2><p class="note">Pass the phone around. ${g.hidden?'Each player gets a private screen before their turn.':''}</p>
      <label for="lpn">Players</label><select id="lpn">${Array.from({length:g.max-g.min+1},(_,i)=>g.min+i).map(n=>`<option ${n===Math.max(g.min,2)?'selected':''}>${n}</option>`).join('')}</select>
      <div id="lnames"></div><div class="row"><button class="btn" id="lgo">Start</button>${saved&&!saved.state.over?'<button class="btn outline" id="lres">Keep playing the last game</button>':''}</div></div>`);
  const nm=document.getElementById('lnames'), sel=document.getElementById('lpn');
  const draw=()=>{ nm.innerHTML=Array.from({length:+sel.value},(_,i)=>`<label for="ln${i}">Player ${i+1} <span class="meta">(${CNAMES[i]})</span></label><input id="ln${i}" maxlength="16" value="${i===0&&signedIn()?esc(myName()):''}" placeholder="Name">`).join(''); };
  sel.onchange=draw; draw();
  document.getElementById('lgo').onclick=()=>{ const n=+sel.value; const players=Array.from({length:n},(_,i)=>({name:(document.getElementById('ln'+i).value.trim()||`Player ${i+1}`).slice(0,16)}));
    store(LKEY(k),{players, state:g.init(n), reveal:-1}); location.hash='#/fun/local/'+k; };
  const lr=document.getElementById('lres'); if(lr) lr.onclick=()=>location.hash='#/fun/local/'+k;
  const nt=document.getElementById('newT'); if(nt) nt.onclick=async()=>{
    if(S.preview) return toast('Preview mode: online tables work on the live app.');
    nt.disabled=true; const { data, error } = await S.sb.rpc('create_room',{p_game:k, p_max:+document.getElementById('maxp').value, p_name:myName()});
    nt.disabled=false; if(error) return toast(error.message); location.hash='#/fun/r/'+data;
  };
}
function playArea(g, st, me, ctx){
  const el=document.getElementById('play'); if(!el) return;
  el.innerHTML=g.render(st,me,ctx); g.bind(el,st,me,ctx);
}
function localGame(k){
  const g=GAMES[k], L=store(LKEY(k)); if(!g||!L){ location.hash='#/fun/g/'+k; return; }
  live.ui ||= {};
  const draw=()=>{
    const L2=store(LKEY(k)), st=L2.state, a=(g.actor||(s=>s.turn))(st);
    if(g.hidden && !st.over && L2.reveal!==a){
      document.getElementById('play').innerHTML=`<div class="curtain card"><h2>Pass the phone to</h2><p class="next-live" style="font-size:30px;color:${COLORS[a]}">${esc(L2.players[a].name)}</p><p class="note">Other players, please look away.</p><div class="row" style="justify-content:center"><button class="btn" id="ready">I'm ${esc(L2.players[a].name)}. Show me.</button></div></div>`;
      document.getElementById('ready').onclick=()=>{ L2.reveal=a; store(LKEY(k),L2); draw(); }; return; }
    const ctx={players:L2.players, ui:live.ui, toast, redraw:draw, move:(ns,keep)=>{ const L3=store(LKEY(k)); L3.state=ns; if(!keep){ live.ui={}; ctx.ui=live.ui; } store(LKEY(k),L3); draw(); }};
    playArea(g, st, a, ctx);
  };
  $app.innerHTML = frame(`<h1 class="reader-title">${esc(g.name)}</h1><p class="meta" style="margin-bottom:10px">On this phone · <a href="#/fun/g/${k}">New game</a></p><div id="play"></div>`, '#/fun/g/'+k, 'Back');
  draw();
}
async function room(id){
  if(!signedIn()){ $app.innerHTML=frame(joinGate('Free account needed','Make a free account to play online.')); return; }
  if(S.preview){ $app.innerHTML=frame('<div class="card"><p>Preview mode: online tables work on the live app.</p></div>'); return; }
  const fresh = live.id!==id; if(fresh){ stop(); live.id=id; }
  const { data:r, error } = await S.sb.from('game_rooms').select('*').eq('id',id).maybeSingle();
  if(error||!r){ $app.innerHTML=frame('<div class="empty">This table was closed.</div>'); return; }
  live.room=r;
  const g=GAMES[r.game], meIdx=r.players.findIndex(p=>p.id===myId()), host=r.host===myId();
  const draw=()=>{
    const rr=live.room; if(!rr||live.id!==id) return;
    if(rr.status==='open'){
      $app.innerHTML=frame(`<h1 class="reader-title">${esc(g.name)}</h1><div class="card" style="text-align:center"><p class="note">Table code</p><div class="code">${esc(rr.code)}</div>
        <p class="note">Share this code. Friends join from Fellowship → Fun Room.</p><div class="row" style="justify-content:center"><button class="btn outline small" id="cpy">Copy invite</button></div></div>
        <div class="card"><h2 style="font-size:20px">Players (${rr.players.length}/${rr.max_players})</h2>${rr.players.map((p,i)=>`<p>${chip({players:rr.players},i)}${p.id===rr.host?' <span class="meta">host</span>':''}</p>`).join('')}
        <div class="row">${meIdx<0?`<button class="btn" id="join" ${rr.players.length>=rr.max_players?'disabled':''}>Join this table</button>`:''}
        ${host?`<button class="btn" id="start" ${rr.players.length>=g.min?'':'disabled'}>Start the game</button>`:meIdx>=0?'<p class="note">Waiting for the host to start…</p>':''}
        ${meIdx>=0?`<button class="btn quiet small" id="leave">${host?'Close table':'Leave'}</button>`:''}</div>
        ${host&&rr.players.length<g.min?`<p class="note" style="margin-top:8px">Needs at least ${g.min} players.</p>`:''}</div>`);
      const q=s=>document.getElementById(s);
      q('cpy').onclick=()=>copyText(`Come play ${g.name} with me on Sprouted Grace! Open ${location.origin}/#/fun/r/${rr.id} or use code ${rr.code} in the Fun Room.`,'Invite copied.');
      if(q('join')) q('join').onclick=async()=>{ const { error } = await S.sb.rpc('join_room',{p_id:rr.id, p_name:myName()}); if(error) return toast(error.message); room(id); };
      if(q('start')) q('start').onclick=async()=>{ const st=g.init(rr.players.length); const { error } = await S.sb.rpc('start_room',{p_id:rr.id, p_state:st}); if(error) return toast(error.message); room(id); };
      if(q('leave')) q('leave').onclick=async()=>{ if(!confirm(host?'Close this table for everyone?':'Leave this table?')) return; const { error } = await S.sb.rpc('leave_room',{p_id:rr.id}); if(error) return toast(error.message); stop(); location.hash='#/fun'; };
      return;
    }
    const me=rr.players.findIndex(p=>p.id===myId());
    if(!document.getElementById('play')){
      $app.innerHTML=frame(`<h1 class="reader-title">${esc(g.name)}</h1><p class="meta" style="margin-bottom:10px">Table ${esc(rr.code)} · ${me<0?'watching':'playing'}${host&&rr.status!=='done'?' · <a href="#" id="endT">End game</a>':''}</p><div id="play"></div>
        ${g.hidden?'<p class="note" style="text-align:center;margin-top:10px">Play fair: keep your eyes on your own screen.</p>':''}`);
      const et=document.getElementById('endT'); if(et) et.onclick=async e=>{ e.preventDefault(); if(!confirm('End this game for everyone?')) return; await S.sb.rpc('leave_room',{p_id:rr.id}); stop(); location.hash='#/fun'; };
    }
    const ctx={players:rr.players, ui:live.ui, toast, redraw:draw, move:async(ns,keep)=>{
      if(!keep){ live.ui={}; }
      const ver=live.room.version; live.room={...live.room, state:ns, version:ver+1}; draw();
      const { error } = await S.sb.rpc('game_move',{p_id:rr.id, p_version:ver, p_state:ns, p_done:!!ns.over});
      if(error){ toast(error.message.includes('stale')?'Someone moved first. Updating…':error.message); room(id); }
    }};
    playArea(g, rr.state, me, ctx);
  };
  draw();
  if(fresh){
    live.ch = S.sb.channel('room-'+id).on('postgres_changes',{event:'*',schema:'public',table:'game_rooms',filter:'id=eq.'+id}, pl=>{
      if(live.id!==id) return;
      if(pl.eventType==='DELETE'){ stop(); toast('The host closed this table.'); location.hash='#/fun'; return; }
      const n=pl.new; if(!live.room || n.version>live.room.version || n.status!==live.room.status || (n.players||[]).length!==(live.room.players||[]).length){
        const statusChanged = live.room && n.status!==live.room.status; live.room=n; if(statusChanged) $app.innerHTML=''; draw(); }
    }).subscribe();
    live.poll = setInterval(async()=>{ if(live.id!==id) return; const { data } = await S.sb.from('game_rooms').select('*').eq('id',id).maybeSingle();
      if(!data){ stop(); location.hash='#/fun'; return; }
      if(data.version>live.room.version || data.status!==live.room.status || data.players.length!==live.room.players.length){ const sc=data.status!==live.room.status; live.room=data; if(sc) $app.innerHTML=''; draw(); } }, 8000);
  }
}
window.FUN = {
  GAMES, stop,
  async route(parts){
    style(); renderNav('fellowship');
    if(parts[1]!=='r') stop();
    if(parts[1]==='g') return gamePage(parts[2]);
    if(parts[1]==='local') return localGame(parts[2]);
    if(parts[1]==='r') return room(+parts[2]);
    return lobby();
  }
};
})();
