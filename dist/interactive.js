'use strict';
/* Hands-on labs that replace the simpler versions in app.js:
   - labs.architecture: 1/2/3-tier request simulator, scenario sorting, abstraction levels
   - labs.er: cardinality playground with real rows + drag-and-drop ER builder that maps to tables */

const SVG_NS='http://www.w3.org/2000/svg';
const svgEl=(tag,attrs={})=>{const e=document.createElementNS(SVG_NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);return e;};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const reducedMotion=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const saved={get(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v??d;}catch{return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}},del(k){try{localStorage.removeItem(k);}catch{}}};

/* Pointer drag that also works on touch screens. A press without movement is left to the click handler. */
function pointerDrag(el,{onStart,onMove,onDrop}){
  el.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    const sx=e.clientX,sy=e.clientY;let moved=false;
    el.setPointerCapture(e.pointerId);
    const move=ev=>{if(!moved&&Math.hypot(ev.clientX-sx,ev.clientY-sy)<6)return;if(!moved){moved=true;onStart&&onStart(ev);}onMove&&onMove(ev);};
    const end=ev=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',end);el.removeEventListener('pointercancel',end);
      if(moved){el.dataset.dragged='1';setTimeout(()=>delete el.dataset.dragged,0);onDrop&&onDrop(ev,ev.type==='pointerup');}};
    el.addEventListener('pointermove',move);el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
  });
}
function ghostFor(el,ev){const g=el.cloneNode(true);g.classList.add('ix-ghost');g.removeAttribute('id');document.body.appendChild(g);const place=e=>{g.style.left=e.clientX+'px';g.style.top=e.clientY+'px';};place(ev);return {move:place,remove:()=>g.remove()};}
const dropTarget=(ev,selector)=>{const hit=document.elementFromPoint(ev.clientX,ev.clientY);return hit&&hit.closest(selector);};

/* ───────────── Lesson 2 · Architecture ───────────── */

const PARTS={ui:['Presentation','screens and clicks'],logic:['Application logic','rules, builds the query'],db:['DBMS + data','stores and protects rows']};
const TIERS={
  1:{name:'One-tier architecture',tagline:'Screen, logic and database on one machine.',
    example:'A student opens <code>cinesuper.db</code> in DB Browser for SQLite on their own laptop.',
    machines:[{label:'Your laptop',parts:['ui','logic','db']}],wires:[],
    steps:[{m:0,p:'ui',t:'You click “Drishyam” in the desktop program.'},
      {m:0,p:'logic',t:'The same program builds the query: SELECT reviewer_name, rating FROM reviews WHERE movie_id = 1;'},
      {m:0,p:'db',t:'The database file on the same disk returns 2 rows.'},
      {m:0,p:'ui',t:'The reviews appear. Nothing travelled over a network.'}],
    good:'Simple to set up, fast, works offline. Great for learning and personal tools.',
    bad:'One user at a time. The data lives on one laptop. No central security or backup.'},
  2:{name:'Two-tier architecture (client–server)',tagline:'The client talks to the database server directly.',
    example:'The CineSuper box-office desktop app at the theatre sends SQL straight to the central PostgreSQL server.',
    machines:[{label:'Box-office PC · client',parts:['ui','logic']},{label:'Database server',parts:['db']}],wires:['SQL over the theatre network'],
    steps:[{m:0,p:'ui',t:'The cashier clicks “Drishyam”.'},
      {m:0,p:'logic',t:'The client program builds the SQL itself, using a database username and password stored on this PC.'},
      {w:0,dir:'go',t:'SQL travels to the server: SELECT reviewer_name, rating FROM reviews WHERE movie_id = 1;'},
      {m:1,p:'db',t:'PostgreSQL checks permissions, runs the query and finds 2 rows.'},
      {w:0,dir:'back',t:'The rows travel back to the box-office PC.'},
      {m:0,p:'ui',t:'The reviews appear on the counter screen.'}],
    good:'Many counters share one database. The DBMS enforces keys and constraints for everyone.',
    bad:'Every PC needs the app installed and database credentials. Changing a business rule means updating every client.'},
  3:{name:'Three-tier architecture',tagline:'Browser → application/API server → database server.',
    example:'The real CineSuper site: your browser calls the Supabase API, which queries PostgreSQL.',
    machines:[{label:'Browser · presentation tier',parts:['ui']},{label:'Supabase API · application tier',parts:['logic']},{label:'PostgreSQL · data tier',parts:['db']}],wires:['HTTPS request / JSON','SQL'],
    steps:[{m:0,p:'ui',t:'You tap “Drishyam” on the CineSuper website.'},
      {w:0,dir:'go',t:'The browser sends an HTTPS request: GET /rest/v1/reviews?movie_id=eq.1 — no SQL and no database password in the browser.'},
      {m:1,p:'logic',t:'The API checks the key and access rules, then translates the request into SQL.'},
      {w:1,dir:'go',t:'SELECT reviewer_name, rating FROM reviews WHERE movie_id = 1;'},
      {m:2,p:'db',t:'PostgreSQL runs the query and returns 2 rows.'},
      {w:1,dir:'back',t:'The rows go back to the API.'},
      {w:0,dir:'back',t:'The API replies with JSON: [{"reviewer_name":"Anjali","rating":5}, {"reviewer_name":"Ravi","rating":4}]'},
      {m:0,p:'ui',t:'The movie page draws the review cards.'}],
    good:'The browser never touches the database. Rules change in one place. Scales to thousands of users. This is how CineSuper works.',
    bad:'More pieces to build, secure and deploy.'}
};
const SCENARIOS=[
  ['A student practises SQL on a cinesuper.db file in DB Browser for SQLite on their own laptop.',1],
  ['A shop owner keeps stock in an MS Access file with forms, on a single office PC.',1],
  ['The theatre box-office desktop app sends SQL straight to the central PostgreSQL server.',2],
  ['A Java desktop app in the college lab connects to MySQL using JDBC.',2],
  ['The CineSuper website: browser → Supabase API → PostgreSQL.',3],
  ['A food-delivery mobile app calls a REST API, which then queries the database.',3]
];

labs.architecture=()=>{
  const order=[4,2,0,5,3,1];
  $('#lab').innerHTML=`
  <div class="ix-step"><span>1</span><div><h4>Send one request through each architecture</h4><p>Pick an architecture and press <b>Send request</b>. Watch where the screen, the logic and the database live.</p></div></div>
  <div class="chip-row" role="tablist" aria-label="Architecture">${[1,2,3].map(t=>`<button role="tab" data-tier="${t}" aria-selected="false">${t}-Tier</button>`).join('')}</div>
  <div id="tier-stage" class="ix-stage"></div>
  <div class="ix-step"><span>2</span><div><h4>Sort real situations</h4><p>Drag each card into its architecture. On a phone or keyboard: tap a card, then tap a column.</p></div></div>
  <div class="ix-pool" data-bucket="pool" aria-label="Unsorted situations">${order.map(i=>`<button class="ix-card" data-scenario="${i}" aria-pressed="false">${SCENARIOS[i][0]}</button>`).join('')}</div>
  <div class="ix-buckets">${[1,2,3].map(t=>`<div class="ix-bucket" data-bucket="${t}" role="button" tabindex="0" aria-label="Place the selected card in ${t}-tier"><h5>${t}-Tier</h5><div class="ix-drop"></div></div>`).join('')}</div>
  <div class="controls"><button id="sort-check">Check my sorting</button></div>
  <div id="sort-feedback" class="feedback" role="status" aria-live="polite">Sorted 0 of ${SCENARIOS.length}.</div>
  <div class="ix-step"><span>3</span><div><h4>Inside the DBMS: three levels of abstraction</h4><p>Tiers are about <i>where software runs</i>. Abstraction levels are about <i>how the same data is described</i>. Click each level.</p></div></div>
  <div class="flow"><button data-layer="external"><b>Movie card</b><small>External view</small></button><span class="arrow">→</span><button data-layer="logical"><b>Movie relation</b><small>Logical schema</small></button><span class="arrow">→</span><button data-layer="physical"><b>Stored pages</b><small>Physical storage</small></button></div>
  <div id="layer-info" class="formula">Select a level to explore it.</div>
  <label for="level">Where does “adding an index on movies.title” belong?</label>
  <div class="controls"><select id="level"><option value="">Choose a level</option><option>External view</option><option>Logical schema</option><option>Physical storage</option></select><button id="layer-check">Test my choice</button></div>
  <div id="level-feedback" class="feedback" role="status" aria-live="polite">Choose a level, then test it.</div>
  ${statusBox('lab-feedback','Finish the sorting (step 2) and the abstraction question (step 3) to pass this activity.')}`;

  let sortOK=false,levelOK=false,runToken=0;
  const tryPass=()=>{if(sortOK&&levelOK)labPass('lab-feedback','Architecture mastered. Tiers decide where the presentation, logic and data run; abstraction levels describe the same data from the view down to disk.');};

  /* Step 1 · simulator */
  const stage=$('#tier-stage');
  function renderTier(t){
    runToken++;const T=TIERS[t];
    $$('[data-tier]').forEach(b=>{const on=b.dataset.tier==t;b.classList.toggle('selected',on);b.setAttribute('aria-selected',on);});
    stage.innerHTML=`<div class="ix-tier-head"><b>${T.name}</b><span>${T.tagline}</span><p>Example: ${T.example}</p></div>
    <div class="ix-machines ix-n${T.machines.length}">${T.machines.map((m,i)=>`${i?`<div class="ix-wire" data-wire="${i-1}"><i class="ix-packet"></i><span>${T.wires[i-1]}</span></div>`:''}<div class="ix-machine" data-machine="${i}"><div class="ix-machine-label">${m.label}</div>${m.parts.map(p=>`<div class="ix-part ix-${p}" data-part="${p}"><b>${PARTS[p][0]}</b><small>${PARTS[p][1]}</small></div>`).join('')}</div>`).join('')}</div>
    <div class="controls"><button class="primary" id="tier-run">▶ Send request: “Show reviews for Drishyam”</button></div>
    <ol class="ix-log" id="tier-log" aria-live="polite"></ol>
    <div class="ix-proscons"><div><b>Good for</b>${T.good}</div><div><b>Limits</b>${T.bad}</div></div>`;
    $('#tier-run').onclick=()=>run(t);
  }
  async function run(t){
    const token=++runToken,T=TIERS[t],log=$('#tier-log'),btn=$('#tier-run'),pace=reducedMotion()?350:1100;
    btn.disabled=true;log.innerHTML='';
    for(const s of T.steps){
      if(token!==runToken)return;
      $$('.ix-part.active,.ix-wire.go,.ix-wire.back').forEach(e=>e.classList.remove('active','go','back'));
      if(s.w!==undefined){const w=$(`[data-wire="${s.w}"]`);void w.offsetWidth;w.classList.add(s.dir);}
      else $(`[data-machine="${s.m}"] [data-part="${s.p}"]`).classList.add('active');
      log.insertAdjacentHTML('beforeend',`<li>${esc(s.t)}</li>`);
      await sleep(pace);
    }
    if(token!==runToken)return;
    $$('.ix-part.active').forEach(e=>e.classList.remove('active'));
    log.insertAdjacentHTML('beforeend',`<li class="ix-done">Result on screen:${table(reviews.filter(r=>r.movie_id===1).map(({reviewer_name,rating})=>({reviewer_name,rating})))}</li>`);
    btn.disabled=false;btn.textContent='↻ Send it again';
  }
  $$('[data-tier]').forEach(b=>b.onclick=()=>renderTier(+b.dataset.tier));
  renderTier(3);

  /* Step 2 · sorting */
  let picked=null;
  const counter=()=>{const n=$$('.ix-buckets .ix-card').length;$('#sort-feedback').className='feedback';$('#sort-feedback').textContent=`Sorted ${n} of ${SCENARIOS.length}.`;};
  const place=(card,bucket)=>{if(!bucket)return;(bucket.querySelector('.ix-drop')||bucket).appendChild(card);card.classList.remove('right','wrong');pick(null);counter();};
  const pick=card=>{picked=card;$$('.ix-card').forEach(c=>{c.classList.toggle('selected',c===card);c.setAttribute('aria-pressed',c===card);});};
  $$('.ix-card').forEach(card=>{
    let ghost;
    pointerDrag(card,{onStart:ev=>{ghost=ghostFor(card,ev);card.classList.add('ix-lifted');},onMove:ev=>ghost.move(ev),
      onDrop:(ev,ok)=>{ghost.remove();card.classList.remove('ix-lifted');if(ok)place(card,dropTarget(ev,'[data-bucket]'));}});
    card.onclick=e=>{e.stopPropagation();if(card.dataset.dragged)return;
      const home=card.closest('[data-bucket]');
      if(picked&&picked!==card&&home.dataset.bucket!=='pool')place(picked,home);else pick(picked===card?null:card);};
  });
  $$('[data-bucket]').forEach(b=>{const go=()=>picked&&place(picked,b);b.addEventListener('click',go);b.addEventListener('keydown',e=>{if(e.target===b&&(e.key==='Enter'||e.key===' ')){e.preventDefault();go();}});});
  $('#sort-check').onclick=()=>{
    let right=0;
    $$('.ix-card').forEach(c=>{const b=c.closest('[data-bucket]').dataset.bucket;c.classList.remove('right','wrong');if(b==='pool')return;const ok=+b===SCENARIOS[c.dataset.scenario][1];c.classList.add(ok?'right':'wrong');if(ok)right++;});
    const left=$$('.ix-pool .ix-card').length;
    if(right===SCENARIOS.length){sortOK=true;feedback('sort-feedback','All 6 correct. Ask one question: does the user’s program talk to the database directly (2-tier), through a server in the middle (3-tier), or is everything on one machine (1-tier)?',true);tryPass();}
    else feedback('sort-feedback',`${right} of ${SCENARIOS.length} correct${left?`, ${left} still unsorted`:''}. Red cards need another look: is there a server in the middle?`,false);
  };

  /* Step 3 · abstraction levels */
  $$('[data-layer]').forEach(b=>b.onclick=()=>{$$('[data-layer]').forEach(x=>x.classList.toggle('selected',x===b));$('#layer-info').textContent={external:'External view: the viewer sees title and language on a movie card. Internal IDs can be hidden.',logical:'Logical schema: movies(id, title, release_year, language, genre_id) describes the facts and their structure.',physical:'Physical storage: indexes and disk pages organise how records are found. The same logical data can be stored differently.'}[b.dataset.layer];});
  $('#layer-check').onclick=()=>{if($('#level').value==='Physical storage'){levelOK=true;feedback('level-feedback','Yes. The index changes how rows are found; the logical schema and the movie card stay the same. That is physical data independence.',true);tryPass();}else feedback('level-feedback','An index is about storage and access speed. Try the lowest level.',false);};
};

/* ───────────── Lesson 4 · ER: shared crow's-foot drawing ───────────── */

/* Draws the end markers at point p, with u pointing along the line away from the entity. max: '1'|'N'; min: 0|1 */
function crowEnd(g,p,u,max,min,cls){
  const n={x:-u.y,y:u.x},at=(d,s)=>({x:p.x+u.x*d+n.x*s,y:p.y+u.y*d+n.y*s}),line=(a,b)=>g.appendChild(svgEl('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:cls}));
  if(max==='N'){const tip=at(14,0);line(tip,at(0,8));line(tip,at(0,-8));line(tip,at(0,0));}
  else line(at(8,-8),at(8,8));
  if(min)line(at(21,-8),at(21,8));
  else{const c=at(25,0);g.appendChild(svgEl('circle',{cx:c.x,cy:c.y,r:5,class:cls+' ix-hollow'}));}
}
const legendSvg=(max,min)=>{const s=svgEl('svg',{width:72,height:24,viewBox:'0 0 72 24','aria-hidden':'true'});s.appendChild(svgEl('line',{x1:4,y1:12,x2:72,y2:12,class:'ix-rel-line'}));crowEnd(s,{x:4,y:12},{x:1,y:0},max,min,'ix-rel-line');return s.outerHTML;};

/* ───────────── Lesson 4 · Part A: cardinality with real rows ───────────── */

const gName=id=>genres.find(g=>g.id===id).name;
const PLAYGROUNDS={
  '1:N':{title:'One-to-many · Genre → Movie',note:'Real CineSuper data. Each movie has at most one genre; one genre can have many movies.',
    left:['Genre',genres.map(g=>g.name)],right:['Movie',movies.map(m=>m.title)],maxPerLeft:Infinity,maxPerRight:1,
    links:movies.map(m=>[gName(m.genre_id),m.title]),
    store:links=>({rows:movies.map(m=>{const l=links.find(x=>x[1]===m.title);return {id:m.id,title:m.title,genre_id:l?genres.find(g=>g.name===l[0]).id:null};}),caption:'movies · the FK lives on the many side',cols:['id','title','genre_id']})},
  '1:1':{title:'One-to-one · Reviewer ↔ Profile',note:'Practice extension: each reviewer may have one public profile, and each profile belongs to exactly one reviewer.',
    left:['Reviewer',['Anjali','Ravi','Meera']],right:['Profile',['@anjali_reviews','@ravi_films','@meera_cinema']],maxPerLeft:1,maxPerRight:1,
    links:[['Anjali','@anjali_reviews'],['Ravi','@ravi_films']],
    store:links=>({rows:links.map((l,i)=>({id:i+1,handle:l[1],reviewer_name:l[0]})),caption:'profiles · FK + UNIQUE enforces “at most one”',cols:['id','handle','reviewer_name']})},
  'M:N':{title:'Many-to-many · Movie ↔ Actor',note:'Practice extension: one actor appears in many movies, and one movie has many actors.',
    left:['Movie',['Premam','Bangalore Days','Vikram','Drishyam']],right:['Actor',['Nivin Pauly','Fahadh Faasil','Kamal Haasan','Mohanlal']],maxPerLeft:Infinity,maxPerRight:Infinity,
    links:[['Premam','Nivin Pauly'],['Bangalore Days','Nivin Pauly'],['Bangalore Days','Fahadh Faasil'],['Vikram','Fahadh Faasil'],['Vikram','Kamal Haasan'],['Drishyam','Mohanlal']],
    store:links=>({rows:links.map(l=>({movie:l[0],actor:l[1]})),caption:'movie_cast · a bridge table, one row per pair',cols:['movie','actor']})}
};

function cardinalityPlayground(host){
  let kind='1:N',links,pending=null;
  host.innerHTML=`<div class="chip-row" role="tablist" aria-label="Relationship type">${Object.keys(PLAYGROUNDS).map(k=>`<button role="tab" data-card-kind="${k}">${k.replace(':',' : ')}</button>`).join('')}</div><div id="pg-body"></div>`;
  const body=host.querySelector('#pg-body');
  function render(){
    const P=PLAYGROUNDS[kind];
    host.querySelectorAll('[data-card-kind]').forEach(b=>{b.classList.toggle('selected',b.dataset.cardKind===kind);b.setAttribute('aria-selected',b.dataset.cardKind===kind);});
    body.innerHTML=`<p class="ix-pg-title"><b>${P.title}</b> — ${P.note}</p><p class="micro">Tap an item on one side, then an item on the other side to add or remove a link. Try to break the rule.</p>
      <div class="ix-pg"><svg class="ix-pg-lines" aria-hidden="true"></svg>${[P.left,P.right].map(([name,items],side)=>`<div class="ix-pg-col"><h5>${name}</h5>${items.map(v=>`<button class="ix-pg-item" data-side="${side}" data-val="${esc(v)}">${esc(v)}<span class="ix-pg-count"></span></button>`).join('')}</div>`).join('')}</div>
      <div id="pg-msg" class="feedback" role="status" aria-live="polite">${links.length} links. Notice how many lines touch each item.</div><div id="pg-store"></div>`;
    body.querySelectorAll('.ix-pg-item').forEach(b=>b.onclick=()=>tap(b));
    draw();
  }
  function tap(b){
    const P=PLAYGROUNDS[kind];
    if(!pending||pending.dataset.side===b.dataset.side){pending=pending===b?null:b;body.querySelectorAll('.ix-pg-item').forEach(x=>x.classList.toggle('selected',x===pending));return;}
    const pair=pending.dataset.side==='0'?[pending.dataset.val,b.dataset.val]:[b.dataset.val,pending.dataset.val];
    pending=null;body.querySelectorAll('.ix-pg-item.selected').forEach(x=>x.classList.remove('selected'));
    const i=links.findIndex(l=>l[0]===pair[0]&&l[1]===pair[1]);
    if(i>=0){links.splice(i,1);feedback('pg-msg',`Removed ${pair[0]} — ${pair[1]}.`,true);}
    else{
      const onRight=links.filter(l=>l[1]===pair[1]),onLeft=links.filter(l=>l[0]===pair[0]);
      if(onRight.length>=P.maxPerRight){draw(pair);return feedback('pg-msg',`✗ Rule broken: ${pair[1]} is already linked to ${onRight[0][0]}. In ${kind.replace(':',' : ')}, each ${P.right[0]} connects to at most one ${P.left[0]}. Remove that link first.`,false);}
      if(onLeft.length>=P.maxPerLeft){draw(pair);return feedback('pg-msg',`✗ Rule broken: ${pair[0]} is already linked to ${onLeft[0][1]}. In 1 : 1, each ${P.left[0]} connects to at most one ${P.right[0]}.`,false);}
      links.push(pair);
      feedback('pg-msg',kind==='M:N'?`✓ Added ${pair[0]} — ${pair[1]}. Any number of lines may touch either side. Neither table has one place to store this, so a bridge table gets a new row.`:`✓ Added ${pair[0]} — ${pair[1]}. Still obeys ${kind.replace(':',' : ')}.`,true);
    }
    draw();
  }
  function draw(bad){
    const box=body.querySelector('.ix-pg'),svg=box.querySelector('svg'),r0=box.getBoundingClientRect();
    svg.innerHTML='';svg.setAttribute('viewBox',`0 0 ${r0.width} ${r0.height}`);
    const pos=(side,val)=>{const el=box.querySelector(`.ix-pg-item[data-side="${side}"][data-val="${CSS.escape(val)}"]`),r=el.getBoundingClientRect();return {x:side?r.left-r0.left:r.right-r0.left,y:r.top-r0.top+r.height/2};};
    const seg=(l,cls)=>{const a=pos(0,l[0]),b=pos(1,l[1]);svg.appendChild(svgEl('path',{d:`M${a.x} ${a.y} C${a.x+40} ${a.y} ${b.x-40} ${b.y} ${b.x} ${b.y}`,class:cls}));};
    links.forEach(l=>seg(l,'ix-pg-link'));
    if(bad)seg(bad,'ix-pg-link ix-bad');
    box.querySelectorAll('.ix-pg-item').forEach(el=>{const n=links.filter(l=>l[+el.dataset.side]===el.dataset.val).length;el.querySelector('.ix-pg-count').textContent=n;});
    const s=PLAYGROUNDS[kind].store(links);body.querySelector('#pg-store').innerHTML=table(s.rows,s.caption,s.cols);
  }
  host.querySelectorAll('[data-card-kind]').forEach(b=>b.onclick=()=>{kind=b.dataset.cardKind;links=PLAYGROUNDS[kind].links.map(l=>[...l]);pending=null;render();});
  links=PLAYGROUNDS[kind].links.map(l=>[...l]);render();
  const ro=new ResizeObserver(()=>{if(!host.isConnected)return ro.disconnect();draw();});ro.observe(host);
}

/* ───────────── Lesson 4 · Part B: ER builder ───────────── */

const ER_ATTRS={Genre:['id','name'],Movie:['id','title','language','release_year'],Review:['id','reviewer_name','rating'],Actor:['id','name']};
const ER_TRAPS={Rating:'“Rating” describes a review. It is an attribute of Review, not an entity — it is already inside the Review box.',Language:'“Language” describes a movie. It is an attribute of Movie, not an entity on its own here.'};
const ER_VERBS={'Genre|Movie':'categorises','Movie|Review':'receives','Actor|Movie':'acts in','Movie|Actor':'features'};
const ER_KEY='cinesuper-er-v2'; /* positions: x is a fraction of canvas width, y is pixels */
const tableName=e=>e.toLowerCase()+'s',fkName=e=>e.toLowerCase()+'_id';
const flipCard=c=>({'1:N':'N:1','N:1':'1:N'}[c]||c);
const CARD_WORDS={'1:1':(a,b)=>`Each ${a} has at most one ${b}, and each ${b} has at most one ${a}.`,'1:N':(a,b)=>`One ${a} has many ${b}s; each ${b} has at most one ${a}.`,'N:1':(a,b)=>`Many ${a}s share one ${b}; each ${a} has at most one ${b}.`,'M:N':(a,b)=>`One ${a} has many ${b}s, and one ${b} has many ${a}s.`};

/* Turns the diagram into relations using the standard ER → relational mapping rules. */
function erToTables(st){
  const t={},notes=[];
  Object.keys(ER_ATTRS).filter(e=>st.ents[e]).forEach(e=>t[e]={name:tableName(e),cols:ER_ATTRS[e].map(c=>({name:c,pk:c==='id'}))});
  st.rels.filter(r=>r.card).forEach(r=>{
    if(r.card==='M:N'){
      const name=`${r.a.toLowerCase()}_${r.b.toLowerCase()}`;
      t[name]={name,bridge:true,cols:[{name:fkName(r.a),pk:true,fk:tableName(r.a)},{name:fkName(r.b),pk:true,fk:tableName(r.b)}]};
      notes.push(`${r.a} M : N ${r.b} → new bridge table <code>${name}</code>. Neither side can hold a list, so each pair becomes one row.`);
      return;
    }
    let one,many,need,unique=false;
    if(r.card==='1:N'){one=r.a;many=r.b;need=r.bNeedsA;}
    else if(r.card==='N:1'){one=r.b;many=r.a;need=r.aNeedsB;}
    else{unique=true;if(!r.bNeedsA&&r.aNeedsB){one=r.b;many=r.a;need=true;}else{one=r.a;many=r.b;need=r.bNeedsA;}}
    t[many].cols.push({name:fkName(one),fk:tableName(one),notNull:need,unique});
    notes.push(unique?`${r.a} 1 : 1 ${r.b} → <code>${tableName(many)}.${fkName(one)}</code> with UNIQUE, so it can match at most once.`
      :`${one} 1 : N ${many} → foreign key <code>${tableName(many)}.${fkName(one)}</code> on the many side${need?', NOT NULL because every '+many+' must have a '+one:', nullable because the link is optional'}.`);
  });
  return {tables:Object.values(t).sort((x,y)=>!!x.bridge-!!y.bridge||x.cols.filter(c=>c.fk).length-y.cols.filter(c=>c.fk).length),notes};
}
function tablesToSQL(tables){
  const type=c=>c.pk&&!c.fk?'SERIAL':['release_year','rating'].includes(c.name)||c.fk?'INT':'TEXT';
  return tables.map(t=>{
    const pk=t.cols.filter(c=>c.pk),w=Math.max(...t.cols.map(c=>c.name.length));
    const lines=t.cols.map(c=>`  ${c.name.padEnd(w)} ${type(c)}${pk.length===1&&c.pk?' PRIMARY KEY':''}${c.notNull?' NOT NULL':''}${c.unique?' UNIQUE':''}${c.fk?` REFERENCES ${c.fk}(id)`:''}`);
    if(pk.length>1)lines.push(`  PRIMARY KEY (${pk.map(c=>c.name).join(', ')})`);
    return `CREATE TABLE ${t.name} (\n${lines.join(',\n')}\n);`;
  }).join('\n\n');
}

labs.er=()=>{
  $('#lab').innerHTML=`
  <div class="ix-step"><span>1</span><div><h4>Feel the cardinality with real rows</h4><p>Cardinality is a rule about how many lines may touch each item.</p></div></div>
  <div id="card-playground"></div>
  <div class="ix-step"><span>2</span><div><h4>Build the CineSuper ER diagram</h4><p><b>Drag</b> entities from the tray onto the canvas (or click to add). Drag the <b>orange dot</b> from one entity onto another to connect them, then set the cardinality and participation below.</p></div></div>
  <div class="ix-tray" aria-label="Entity tray">${[...Object.keys(ER_ATTRS),...Object.keys(ER_TRAPS)].map(e=>`<button class="ix-tray-item" data-add="${e}">${e}${e==='Actor'?' <small>optional</small>':''}</button>`).join('')}</div>
  <div class="ix-canvas-wrap"><div id="er-canvas" class="ix-canvas" aria-label="ER diagram canvas"><svg id="er-lines" class="ix-lines" aria-hidden="true"></svg><p class="ix-canvas-empty">Drop entities here</p></div>
  <div id="er-hint" class="ix-hint" role="status" aria-live="polite"></div></div>
  <div class="ix-legend"><span>${legendSvg('1',1)} exactly one</span><span>${legendSvg('1',0)} zero or one</span><span>${legendSvg('N',1)} one or many</span><span>${legendSvg('N',0)} zero or many</span></div>
  <div id="er-rels" class="ix-rels"></div>
  <div class="controls"><button id="er-check" class="primary">Check my diagram →</button><button id="er-tidy">Tidy layout</button><button id="er-reset">Start over</button></div>
  ${statusBox('lab-feedback','Build the diagram, then check it.')}
  <div class="ix-step"><span>3</span><div><h4>Watch it become a database</h4><p>The tables below update live from your diagram. Try changing Genre–Movie to M : N and see a bridge table appear.</p></div></div>
  <div id="er-db"></div>`;
  cardinalityPlayground($('#card-playground'));

  const canvas=$('#er-canvas'),svg=$('#er-lines');
  let st=saved.get(ER_KEY,null);
  if(!st||typeof st.ents!=='object'||!Array.isArray(st.rels))st={ents:{},rels:[]};
  st.ents=Object.fromEntries(Object.entries(st.ents).filter(([e,p])=>ER_ATTRS[e]&&p&&Number.isFinite(p.x)&&Number.isFinite(p.y)));
  st.rels=st.rels.filter(r=>st.ents[r.a]&&st.ents[r.b]);
  let connectFrom=null,passed=false;
  const hint=(t,bad)=>{const h=$('#er-hint');h.textContent=t||'';h.classList.toggle('bad',!!bad);};
  const findRel=(x,y)=>st.rels.find(r=>(r.a===x&&r.b===y)||(r.a===y&&r.b===x));
  const save=()=>saved.set(ER_KEY,st);
  const changed=()=>{passed=false;renderRels();drawLines();renderDB();save();};

  function slot(name){
    const w=canvas.clientWidth,cw=Math.min(160,w*0.3),narrow=w<520;
    const s={Genre:[0.03,narrow?0.05:0.08],Movie:[0.5-cw/2/w,narrow?0.36:0.08],Review:[0.97-cw/w,narrow?0.05:0.08],Actor:[0.5-cw/2/w,narrow?0.7:0.58]}[name];
    return {x:s[0],y:Math.round(s[1]*canvas.clientHeight)};
  }
  function addEntity(name,at){
    if(ER_TRAPS[name])return hint(ER_TRAPS[name],true);
    if(st.ents[name])return hint(`${name} is already on the canvas. Each entity type appears once.`,true);
    st.ents[name]=at||slot(name);renderEntities();changed();
    hint(Object.keys(st.ents).length>1?`${name} added. Drag its orange dot onto another entity to connect them.`:`${name} added. Drag it anywhere. Add the next entity.`);
  }
  function removeEntity(name){delete st.ents[name];st.rels=st.rels.filter(r=>r.a!==name&&r.b!==name);if(connectFrom===name)setConnect(null);renderEntities();changed();}
  function addRel(a,b){
    setConnect(null);
    if(a===b)return hint('Connect two different entities. (Self-relationships exist, like a movie being a sequel of another movie, but are not needed here.)',true);
    if(findRel(a,b))return hint(`${a} and ${b} are already connected. Edit the link in the list below.`,true);
    st.rels.push({a,b,card:'',verb:ER_VERBS[a+'|'+b]||ER_VERBS[b+'|'+a]||'relates to',aNeedsB:false,bNeedsA:false});
    changed();hint(`Connected ${a} — ${b}. Now choose its cardinality below.`);
    const sel=$(`.ix-rel[data-pair="${a}-${b}"] .rel-card`);sel&&sel.focus({preventScroll:true});
  }
  function setConnect(name){connectFrom=name;canvas.classList.toggle('connecting',!!name);$$('.ix-entity').forEach(e=>e.classList.toggle('source',e.dataset.entity===name));if(name)hint(`Now click the entity to connect to ${name}. Press Esc to cancel.`);}

  function renderEntities(){
    canvas.querySelectorAll('.ix-entity').forEach(e=>e.remove());
    canvas.querySelector('.ix-canvas-empty').hidden=Object.keys(st.ents).length>0;
    Object.entries(st.ents).forEach(([name,p])=>{
      const el=document.createElement('div');
      el.className='ix-entity';el.dataset.entity=name;el.tabIndex=0;el.setAttribute('role','button');
      el.setAttribute('aria-label',`${name} entity. Arrow keys move it.`);
      el.innerHTML=`<div class="ix-ent-head">${name}<button class="ix-ent-x" aria-label="Remove ${name}">×</button></div><ul>${ER_ATTRS[name].map(a=>`<li class="${a==='id'?'pk':''}">${a==='id'?'🔑 ':''}${a}</li>`).join('')}</ul><button class="ix-handle" data-connect="${name}" aria-label="Connect ${name} to another entity"></button>`;
      canvas.appendChild(el);
      /* clamp only what is shown, so a temporary resize never loses the saved position */
      const fit=(keep)=>{const cw=canvas.clientWidth,x=clamp(p.x*cw,0,Math.max(0,cw-el.offsetWidth-12)),y=clamp(p.y,0,Math.max(0,canvas.clientHeight-el.offsetHeight));if(keep&&cw){p.x=x/cw;p.y=y;}el.style.left=x+'px';el.style.top=y+'px';};
      fit();
      /* move the entity */
      let off;
      pointerDrag(el.querySelector('.ix-ent-head'),{onStart:ev=>{off={x:ev.clientX-el.offsetLeft,y:ev.clientY-el.offsetTop};el.classList.add('ix-lifted');},
        onMove:ev=>{p.x=(ev.clientX-off.x)/canvas.clientWidth;p.y=ev.clientY-off.y;fit(true);drawLines();},onDrop:()=>{el.classList.remove('ix-lifted');save();}});
      el.addEventListener('keydown',e=>{
        const d={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,-12],ArrowDown:[0,12]}[e.key];
        if(d&&e.target===el){e.preventDefault();p.x+=d[0]/canvas.clientWidth;p.y+=d[1];fit(true);drawLines();save();}
        if((e.key==='Enter'||e.key===' ')&&e.target===el){e.preventDefault();el.click();}
      });
      el.addEventListener('click',e=>{if(e.target.closest('button'))return;if(connectFrom&&connectFrom!==name)addRel(connectFrom,name);});
      el.querySelector('.ix-ent-x').onclick=()=>removeEntity(name);
      /* drag a link from the handle, or click it to start click-to-connect */
      const handle=el.querySelector('.ix-handle');let temp;
      pointerDrag(handle,{onStart:()=>{temp=svgEl('line',{class:'ix-rel-line ix-temp'});svg.appendChild(temp);},
        onMove:ev=>{const r=canvas.getBoundingClientRect(),c=centre(name);temp.setAttribute('x1',c.x);temp.setAttribute('y1',c.y);temp.setAttribute('x2',ev.clientX-r.left);temp.setAttribute('y2',ev.clientY-r.top);},
        onDrop:(ev,ok)=>{temp.remove();const target=ok&&dropTarget(ev,'.ix-entity');if(target)addRel(name,target.dataset.entity);else hint('Drop the line onto another entity to connect.',true);}});
      handle.onclick=e=>{e.stopPropagation();if(handle.dataset.dragged)return;if(connectFrom&&connectFrom!==name)addRel(connectFrom,name);else setConnect(connectFrom===name?null:name);};
    });
  }
  const box=name=>{const el=canvas.querySelector(`[data-entity="${name}"]`);return {x:el.offsetLeft,y:el.offsetTop,w:el.offsetWidth,h:el.offsetHeight};};
  const centre=name=>{const b=box(name);return {x:b.x+b.w/2,y:b.y+b.h/2};};
  function edge(b,toward){
    const c={x:b.x+b.w/2,y:b.y+b.h/2},dx=toward.x-c.x,dy=toward.y-c.y;
    const s=Math.min(dx?b.w/2/Math.abs(dx):Infinity,dy?b.h/2/Math.abs(dy):Infinity);
    return {x:c.x+dx*s,y:c.y+dy*s};
  }
  function drawLines(){
    svg.innerHTML='';
    st.rels.forEach(r=>{
      const A=box(r.a),B=box(r.b),pa=edge(A,centre(r.b)),pb=edge(B,centre(r.a)),len=Math.hypot(pb.x-pa.x,pb.y-pa.y)||1,u={x:(pb.x-pa.x)/len,y:(pb.y-pa.y)/len};
      const g=svgEl('g',{class:'ix-link'+(r.card?'':' ix-unset')});
      g.appendChild(svgEl('line',{x1:pa.x,y1:pa.y,x2:pb.x,y2:pb.y,class:'ix-rel-line'}));
      if(r.card){const [ca,cb]=r.card.split(':').map(v=>v==='1'?'1':'N');crowEnd(g,pa,u,ca,r.bNeedsA?1:0,'ix-rel-line');crowEnd(g,pb,{x:-u.x,y:-u.y},cb,r.aNeedsB?1:0,'ix-rel-line');}
      const mid={x:(pa.x+pb.x)/2,y:(pa.y+pb.y)/2},label=`${r.verb} · ${r.card?r.card.replace(':',' : '):'?'}`;
      const bg=svgEl('rect',{class:'ix-rel-label-bg',rx:10}),tx=svgEl('text',{x:mid.x,y:mid.y+4,class:'ix-rel-label','text-anchor':'middle'});
      tx.textContent=label;g.append(bg,tx);svg.appendChild(g);
      const bb=tx.getBBox();bg.setAttribute('x',bb.x-8);bg.setAttribute('y',bb.y-3);bg.setAttribute('width',bb.width+16);bg.setAttribute('height',bb.height+6);
    });
  }
  function renderRels(){
    const host=$('#er-rels');
    if(!st.rels.length){host.innerHTML='<p class="note">No relationships yet. Connect two entities to define one.</p>';return;}
    host.innerHTML=`<h5>Your relationships</h5>`+st.rels.map((r,i)=>`<div class="ix-rel" data-pair="${r.a}-${r.b}" data-rel="${i}">
      <div class="ix-rel-top"><b>${r.a}</b><select class="rel-card" aria-label="Cardinality of ${r.a} to ${r.b}"><option value="">Cardinality…</option>${['1:1','1:N','N:1','M:N'].map(c=>`<option value="${c}" ${r.card===c?'selected':''}>${c.replace(':',' : ')}</option>`).join('')}</select><b>${r.b}</b>
      <button class="rel-swap" title="Swap sides" aria-label="Swap ${r.a} and ${r.b}">⇄</button><button class="rel-del" aria-label="Remove link ${r.a} to ${r.b}">Remove</button></div>
      <p class="ix-rel-words">${r.card?CARD_WORDS[r.card](r.a,r.b):'How many of each can be connected? Choose a cardinality.'}</p>
      <div class="check-row"><label><input type="checkbox" class="rel-bneeds" ${r.bNeedsA?'checked':''}> Every ${r.b} must have a ${r.a}</label><label><input type="checkbox" class="rel-aneeds" ${r.aNeedsB?'checked':''}> Every ${r.a} must have a ${r.b}</label></div></div>`).join('');
    host.querySelectorAll('.ix-rel').forEach(row=>{
      const r=st.rels[row.dataset.rel];
      row.querySelector('.rel-card').onchange=e=>{r.card=e.target.value;changed();};
      row.querySelector('.rel-bneeds').onchange=e=>{r.bNeedsA=e.target.checked;changed();};
      row.querySelector('.rel-aneeds').onchange=e=>{r.aNeedsB=e.target.checked;changed();};
      row.querySelector('.rel-swap').onclick=()=>{[r.a,r.b]=[r.b,r.a];[r.aNeedsB,r.bNeedsA]=[r.bNeedsA,r.aNeedsB];r.card=flipCard(r.card);changed();};
      row.querySelector('.rel-del').onclick=()=>{st.rels.splice(st.rels.indexOf(r),1);changed();};
    });
  }
  function renderDB(){
    const host=$('#er-db');
    if(!Object.keys(st.ents).length){host.innerHTML='<p class="note">Add entities to see their tables.</p>';return;}
    const {tables,notes}=erToTables(st);
    host.innerHTML=`<div class="ix-tables">${tables.map(t=>`<div class="ix-table${t.bridge?' bridge':''}"><div class="ix-table-head">${t.name}${t.bridge?'<small>bridge</small>':''}</div>${t.cols.map(c=>`<div class="ix-col"><span>${c.name}</span><span>${c.pk?'<i class="b-pk">PK</i>':''}${c.fk?`<i class="b-fk">FK → ${c.fk}</i>`:''}${c.unique?'<i>UNIQUE</i>':''}${c.fk&&!c.pk?`<i>${c.notNull?'NOT NULL':'NULL ok'}</i>`:''}</span></div>`).join('')}</div>`).join('')}</div>
      ${notes.length?`<ul class="ix-notes">${notes.map(n=>`<li>${n}</li>`).join('')}</ul>`:'<p class="note">Entities become tables. Set a cardinality to see where the foreign keys go.</p>'}
      <details class="ix-sql"><summary>Show the SQL</summary><pre>${esc(tablesToSQL(tables))}</pre></details>
      ${passed?`<div class="ix-reveal"><h5>Your diagram matches the real CineSuper database. Here it is with rows:</h5><div class="two-tables">${table(genres,'genres')}${table(reviews.map(({id,movie_id,reviewer_name,rating})=>({id,movie_id,reviewer_name,rating})),'reviews · movie_id → movies.id')}</div>${table(movies.map(({id,title,language,genre_id})=>({id,title,language,genre_id})),'movies · genre_id → genres.id')}<p class="note">Follow a review: review 1 has movie_id 1 → Drishyam, whose genre_id 3 → Thriller.</p></div>`:''}`;
  }

  function check(){
    const missing=['Genre','Movie','Review'].filter(e=>!st.ents[e]);
    if(missing.length)return feedback('lab-feedback',`Add ${missing.join(', ')} to the canvas. CineSuper needs Genre, Movie and Review.`,false);
    const problems=[],side=(r,first)=>r.a===first?{card:r.card,firstNeeds:r.aNeedsB,secondNeeds:r.bNeedsA}:{card:flipCard(r.card),firstNeeds:r.bNeedsA,secondNeeds:r.aNeedsB};
    const gm=findRel('Genre','Movie'),mr=findRel('Movie','Review');
    if(!gm)problems.push('Connect Genre and Movie — a genre categorises movies.');
    else{const s=side(gm,'Genre');
      if(!s.card)problems.push('Choose a cardinality for Genre — Movie.');
      else if(s.card!=='1:N')problems.push(`Genre — Movie is not ${s.card.replace(':',' : ')} (reading Genre first). How many genres can one movie have in CineSuper? At most one. How many movies can one genre have? Many.`);
      else if(s.secondNeeds)problems.push('movies.genre_id may be NULL, so a movie can exist without a genre. Untick “Every Movie must have a Genre”.');
      else if(s.firstNeeds)problems.push('A new genre can exist before any movie uses it. Untick “Every Genre must have a Movie”.');}
    if(!mr)problems.push('Connect Movie and Review — a movie receives reviews.');
    else{const s=side(mr,'Movie');
      if(!s.card)problems.push('Choose a cardinality for Movie — Review.');
      else if(s.card!=='1:N')problems.push(`Movie — Review is not ${s.card.replace(':',' : ')} (reading Movie first). Can one movie receive several reviews? Can one review be about two movies?`);
      else if(!s.secondNeeds)problems.push('A review cannot exist without its movie (reviews.movie_id is NOT NULL). Tick “Every Review must have a Movie”.');
      else if(s.firstNeeds)problems.push('A brand-new movie has zero reviews. Untick “Every Movie must have a Review”.');}
    if(findRel('Genre','Review'))problems.push('Remove the direct Genre — Review link. A review already reaches its genre through its movie; a direct link stores the same fact twice and can disagree.');
    if(st.ents.Actor){const am=findRel('Actor','Movie');
      if(!am)problems.push('Actor is on the canvas but not connected. Connect it to Movie, or remove it.');
      else if(am.card!=='M:N')problems.push('One actor appears in many movies and one movie has many actors: Actor — Movie is M : N.');
      if(st.rels.some(r=>(r.a==='Actor'||r.b==='Actor')&&r!==am))problems.push('Actor only needs a link to Movie in this design.');}
    if(problems.length){passed=false;renderDB();return feedback('lab-feedback',`${problems.length} thing${problems.length>1?'s':''} to fix. ${problems[0]}`,false);}
    passed=true;renderDB();
    labPass('lab-feedback',`Correct ER design! Genre 1 : N Movie (optional genre) and Movie 1 : N Review (every review needs a movie)${st.ents.Actor?', plus Actor M : N Movie through a bridge table':''}. Scroll down to see it as a real database.`);
  }

  $$('.ix-tray-item').forEach(item=>{
    let ghost;
    pointerDrag(item,{onStart:ev=>{ghost=ghostFor(item,ev);},onMove:ev=>ghost.move(ev),
      onDrop:(ev,ok)=>{ghost.remove();if(!ok||!dropTarget(ev,'#er-canvas'))return;const r=canvas.getBoundingClientRect();addEntity(item.dataset.add,{x:(ev.clientX-r.left-60)/r.width,y:ev.clientY-r.top-20});}});
    item.onclick=()=>{if(!item.dataset.dragged)addEntity(item.dataset.add);};
  });
  canvas.addEventListener('keydown',e=>{if(e.key==='Escape'&&connectFrom){setConnect(null);hint('Connection cancelled.');}});
  canvas.addEventListener('click',e=>{if(e.target===canvas||e.target===svg)connectFrom&&(setConnect(null),hint('Connection cancelled.'));});
  $('#er-check').onclick=check;
  $('#er-tidy').onclick=()=>{Object.keys(st.ents).forEach(e=>st.ents[e]=slot(e));renderEntities();drawLines();save();};
  $('#er-reset').onclick=()=>{st={ents:{},rels:[]};saved.del(ER_KEY);setConnect(null);renderEntities();changed();hint('Canvas cleared.');feedback('lab-feedback','Build the diagram, then check it.',true);$('#lab-feedback').className='feedback';};

  renderEntities();renderRels();drawLines();renderDB();
  const ro=new ResizeObserver(()=>{if(!canvas.isConnected)return ro.disconnect();if(!canvas.clientWidth)return;renderEntities();drawLines();});ro.observe(canvas);
};

/* app.js renders the first route before this file runs; re-render if that page uses one of these labs. */
if(current>=0&&['architecture','er'].includes(lessons[current].lab))route();
