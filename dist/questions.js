'use strict';
/* Model Questions page (#questions, or #questions-q3 to jump to a question).
   Each part: think-first prompt → reveal model answer → self-rating. Each question ends with a hands-on activity. */

/* ── Chen-notation drawing helpers (the notation used in exam answers) ── */
const chen={
  ent:(x,y,label,{w=110,weak=false}={})=>`<g class="ch-ent"><rect x="${x-w/2}" y="${y-20}" width="${w}" height="40"/>${weak?`<rect x="${x-w/2+5}" y="${y-15}" width="${w-10}" height="30"/>`:''}<text x="${x}" y="${y+5}">${label}</text></g>`,
  rel:(x,y,label,{w=120}={})=>`<g class="ch-rel"><polygon points="${x-w/2},${y} ${x},${y-30} ${x+w/2},${y} ${x},${y+30}"/><text x="${x}" y="${y+4}">${label}</text></g>`,
  attr:(x,y,label,{key=false,multi=false,derived=false}={})=>{const rx=Math.max(38,label.length*4.3+12);return `<g class="ch-attr${derived?' derived':''}"><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="18"/>${multi?`<ellipse cx="${x}" cy="${y}" rx="${rx-5}" ry="13"/>`:''}<text x="${x}" y="${y+4}">${label}</text>${key?`<line class="ch-key" x1="${x-label.length*3.4}" y1="${y+7}" x2="${x+label.length*3.4}" y2="${y+7}"/>`:''}</g>`;},
  line:(x1,y1,x2,y2,cls='')=>`<line class="ch-line ${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`,
  label:(x,y,t)=>`<text class="ch-card" x="${x}" y="${y}">${t}</text>`,
  svg:(w,h,body,title)=>`<svg class="ch" viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}">${body}</svg>`
};
const SYMBOLS={
  entity:{name:'Entity',shape:'Rectangle',svg:chen.svg(300,90,chen.ent(150,45,'STUDENT',{w:130}),'Rectangle labelled STUDENT')},
  relationship:{name:'Relationship',shape:'Diamond',svg:chen.svg(300,90,chen.ent(48,45,'STUDENT',{w:86})+chen.line(91,45,100,45)+chen.rel(150,45,'ENROLLS',{w:100})+chen.line(200,45,209,45)+chen.ent(252,45,'COURSE',{w:86}),'Diamond ENROLLS between STUDENT and COURSE')},
  key:{name:'Key attribute',shape:'Ellipse with the name underlined',svg:chen.svg(300,90,chen.line(90,45,190,45)+chen.ent(70,45,'STUDENT',{w:110})+chen.attr(220,45,'RollNo',{key:true}),'STUDENT connected to underlined ellipse RollNo')},
  multi:{name:'Multivalued attribute',shape:'Double ellipse',svg:chen.svg(300,90,chen.line(90,45,180,45)+chen.ent(70,45,'STUDENT',{w:110})+chen.attr(215,45,'PhoneNo',{multi:true}),'STUDENT connected to double ellipse PhoneNo')},
  composite:{name:'Composite attribute',shape:'Ellipse connected to smaller ellipses',svg:chen.svg(300,130,chen.line(70,95,150,40)+chen.line(150,40,90,40)+chen.line(150,40,230,95)+chen.line(150,40,250,40)+chen.ent(70,100,'STUDENT',{w:110})+chen.attr(150,40,'Name')+chen.attr(230,100,'LastName')+chen.attr(250,40,'FirstName'),'Name ellipse split into FirstName and LastName ellipses')}
};
/* STUDENT —M— ENROLLS —N— PROJECT, drawn in five steps */
const Q6_DIAGRAM=[
  chen.ent(120,190,'STUDENT',{w:120})+chen.ent(520,190,'PROJECT',{w:120}),
  chen.line(120,170,60,85)+chen.line(120,170,140,65)+chen.line(120,170,215,95)+chen.line(520,170,465,85)+chen.line(520,170,585,85)+chen.attr(60,85,'StudentID')+chen.attr(140,50,'Name')+chen.attr(220,95,'Dept')+chen.attr(450,85,'ProjectID')+chen.attr(590,85,'Title'),
  chen.attr(60,85,'StudentID',{key:true})+chen.attr(450,85,'ProjectID',{key:true}),
  chen.line(180,190,260,190)+chen.line(380,190,460,190)+chen.rel(320,190,'ENROLLS_IN',{w:130}),
  chen.label(205,178,'M')+chen.label(430,178,'N')
];
const Q6_STEPS=['Step 1 · Draw each entity as a rectangle: STUDENT and PROJECT.','Step 2 · Attach each attribute as an ellipse.','Step 3 · Underline the primary key of each entity: StudentID and ProjectID.','Step 4 · Join the entities through a diamond for the relationship: ENROLLS_IN.','Step 5 · Write the cardinality on the lines: M on the STUDENT side, N on the PROJECT side.'];

const write=html=>`<div class="mq-write"><b>Write this in the exam</b>${html}</div>`;
const why=html=>`<div class="mq-why"><b>Understand it</b>${html}</div>`;

const MODEL_QUESTIONS=[
{id:'q1',title:'Data, databases and the DBMS',topic:'Introduction',
 parts:[
  {id:'a',q:'Define Data and Database.',think:'Is “75” useful on its own? What turns scattered facts into something you can search?',
   ans:write(`<p><b>Data</b> are raw, unorganised facts and figures — numbers, text, dates — that have no meaning until they are processed. Example: <code>Ravi</code>, <code>52000</code>, <code>2013</code>.</p><p><b>Database</b> is an organised collection of logically related data, stored so that it can be easily accessed, managed and updated. Example: a college database holding students, courses and marks.</p>`)
    +why(`<p>Think of a movie app. “Drishyam”, “2013” and “5” are data. Put them into connected tables — movies, genres, reviews — and you have a database. <b>Data + organisation + relationships = database.</b></p>`)},
  {id:'b',q:'What is a DBMS? State its main functions.',think:'Who stores, checks, protects and backs up the database? It is not a person.',
   ans:write(`<p>A <b>Database Management System (DBMS)</b> is software that lets users define, create, maintain and control access to a database. It sits between users/applications and the stored data.</p><p><b>Main functions:</b></p><ol><li><b>Data definition</b> — create and change the structure (tables, columns, constraints).</li><li><b>Data manipulation</b> — insert, update, delete and retrieve data (queries).</li><li><b>Security</b> — allow only authorised users to see or change data.</li><li><b>Integrity</b> — enforce rules such as unique keys and valid values.</li><li><b>Concurrency control</b> — let many users work at the same time safely.</li><li><b>Backup and recovery</b> — restore data after a crash or failure.</li></ol>`)
    +why(`<p>The DBMS is like a librarian: you don’t walk into the stacks yourself. You ask, and the librarian finds the book, checks your card, prevents two people from borrowing the same copy and keeps the records safe. Remember <b>D-M-S-I-C-B</b>: Define, Manipulate, Secure, Integrity, Concurrency, Backup.</p>`)},
  {id:'c',q:'Write any two advantages of a DBMS over traditional file processing systems.',think:'If a student’s address is stored in both the Library file and the Accounts file, what can go wrong?',
   ans:write(`<ol><li><b>Reduced data redundancy and inconsistency</b> — data is stored once and shared, so different copies cannot disagree.</li><li><b>Better data security</b> — the DBMS controls who can see or change which data; files only have basic OS permissions.</li></ol><p class="mq-extra">Other valid points: data integrity through constraints, concurrent access by many users, backup and recovery, easy querying with SQL, data independence.</p>`)
    +why(`<p>In a file system each department keeps its own file, so the same fact is copied many times. Update one copy and forget another → the copies <i>disagree</i>. Try it in the activity below.</p>`)},
  {id:'d',q:'Name any two popular DBMS software.',think:'Which one does CineSuper use through Supabase?',
   ans:write(`<p><b>MySQL</b> and <b>PostgreSQL</b>.</p><p class="mq-extra">Also correct: Oracle Database, Microsoft SQL Server, SQLite, IBM Db2, MS Access, MongoDB (a NoSQL DBMS).</p>`)
    +why(`<p>CineSuper uses <b>PostgreSQL</b>. Note: Excel is a spreadsheet, not a DBMS.</p>`)}],
 activity:'q1'},
{id:'q2',title:'Three-level architecture and data independence',topic:'Architecture',
 parts:[
  {id:'a',q:'List and briefly describe the three levels of DBMS architecture.',think:'A student, a database designer and the hard disk each “see” the data differently. How?',
   ans:write(`<p>The <b>three-schema (ANSI/SPARC) architecture</b> has three levels:</p><ol><li><b>External level (view level)</b> — how individual users see the data. Each user group gets its own view showing only the data it needs. There can be many external views.</li><li><b>Conceptual level (logical level)</b> — describes the whole database for the community of users: entities, attributes, data types, relationships and constraints. It hides physical storage details. There is one conceptual schema.</li><li><b>Internal level (physical level)</b> — describes how data is actually stored: files, records, indexes, storage blocks and access paths.</li></ol><p>Diagram: Users → External views → <i>mapping</i> → Conceptual schema → <i>mapping</i> → Internal schema → Stored database.</p>`)
    +why(`<p>Top to bottom: <b>“what I see” → “what exists” → “how it is stored”</b>. The levels let each group ignore details it does not need. Click through the levels in the activity.</p>`)},
  {id:'b',q:'Which level of architecture does an end user interact with?',think:'Does a student checking marks know which index is used?',
   ans:write(`<p>The <b>External level (view level)</b>. End users see only their own view through an application and never deal with tables or storage directly.</p>`)
    +why(`<p>A student portal shows Name and Marks only. The full STUDENT table and the disk files are hidden from that student.</p>`)},
  {id:'c',q:'What is Data Independence? Briefly distinguish between Physical and Logical data independence.',think:'Can you change how data is stored without rewriting the app? Can you add a column without breaking old views?',
   ans:write(`<p><b>Data independence</b> is the ability to change the schema at one level without having to change the schema at the next higher level.</p><div class="table-wrap"><table class="mq-compare"><thead><tr><th></th><th>Physical data independence</th><th>Logical data independence</th></tr></thead><tbody><tr><td>Meaning</td><td>Change the <b>internal</b> schema without changing the conceptual schema</td><td>Change the <b>conceptual</b> schema without changing external views or programs</td></tr><tr><td>Examples</td><td>Add an index, change file organisation, move to a new disk</td><td>Add a new attribute or table, split a table</td></tr><tr><td>Difficulty</td><td>Easier to achieve</td><td>Harder to achieve</td></tr></tbody></table></div>`)
    +why(`<p>Physical = changes <b>below</b> the tables (storage). Logical = changes <b>to</b> the tables themselves. In both cases the level above keeps working unchanged.</p>`)}],
 activity:'q2'},
{id:'q3',title:'Inside a relational table',topic:'Relational model',
 stem:'Consider the table EMPLOYEE (EmpID, EmpName, Designation, Salary) containing 3 rows.',
 parts:[
  {id:'a',q:'What are the degree and cardinality of this table?',think:'One of them counts columns; the other counts rows.',
   ans:write(`<p><b>Degree = 4</b> (number of attributes/columns).<br><b>Cardinality = 3</b> (number of tuples/rows).</p>`)
    +why(`<p>Memory trick: <b>Degree goes across</b> the header (columns); <b>Cardinality counts down</b> the rows. Adding a row changes cardinality only. Adding a column changes degree only. Try it below.</p>`)},
  {id:'b',q:'Identify the number of tuples and attributes.',think:'Tuple = row, attribute = column.',
   ans:write(`<p><b>Tuples = 3</b> (rows). <b>Attributes = 4</b>: EmpID, EmpName, Designation, Salary.</p>`)
    +why(`<p>Same counts as (a), in different words: tuple ↔ row ↔ record; attribute ↔ column ↔ field.</p>`)},
  {id:'c',q:'Define ‘Domain’ and state two valid values for the domain of Salary.',think:'Could Salary be “abc” or −5000?',
   ans:write(`<p>A <b>domain</b> is the set of all permissible (atomic) values that an attribute can take, including its data type and range.</p><p>Domain of Salary: positive numbers (e.g. decimal values greater than 0). Two valid values: <b>25000</b> and <b>48500.50</b>.</p>`)
    +why(`<p>The domain is the rulebook for one column. “abc” (wrong type) and −5000 (out of range) are outside it, so the DBMS rejects them. Test values in the domain checker below.</p>`)},
  {id:'d',q:'State any two properties/characteristics of a relational table.',think:'Can a cell hold two phone numbers? Can two rows be exactly identical?',
   ans:write(`<ol><li><b>Each cell holds a single (atomic) value</b> — no lists or repeating groups.</li><li><b>No two rows are identical</b> — every tuple is distinct.</li></ol><p class="mq-extra">Also valid: the order of rows does not matter; the order of columns does not matter; each column has a unique name; all values in a column come from the same domain.</p>`)
    +why(`<p>These rules let the DBMS find any single fact by table + key + column, without guessing which item in a list you meant.</p>`)}],
 activity:'q3'},
{id:'q4',title:'Keys and integrity constraints',topic:'Keys',
 stem:'In a table CUSTOMER (CustID, NationalID, Name, Email, City) where CustID, NationalID and Email are unique, but multiple customers have the same Name:',
 parts:[
  {id:'a',q:'What is a Primary Key?',think:'What does a table need to tell two “Priya” rows apart?',
   ans:write(`<p>A <b>primary key</b> is an attribute (or minimal set of attributes) that <b>uniquely identifies</b> each tuple in a table. Its values must be <b>unique</b> and <b>NOT NULL</b>, and a table has only one primary key.</p>`)
    +why(`<p>It is the row’s identity card number. Names repeat; the ID number never does.</p>`)},
  {id:'b',q:'Which attributes can be chosen as the primary key?',think:'Which attributes are guaranteed unique?',
   ans:write(`<p><b>CustID, NationalID and Email</b> are all <b>candidate keys</b>, so any of them can be chosen. <b>CustID</b> is the best choice. The others become <b>alternate keys</b>.</p>`)
    +why(`<p>CustID is short, never changes, and is created by the system. NationalID is sensitive personal data and a foreign customer may not have one. Email can change. Click “Test as key” on each column below.</p>`)},
  {id:'c',q:'Why can ‘Name’ not be selected as the primary key?',think:'Look at the two Priyas.',
   ans:write(`<p>Because <b>Name is not unique</b> — multiple customers share the same name, so Name cannot identify one customer uniquely. Names can also change or be misspelt.</p>`)
    +why(`<p>If Name were the key, “Delete customer Priya” would be ambiguous: which Priya?</p>`)},
  {id:'d',q:'What is a Foreign Key? Give a brief example.',think:'How does an order remember which customer placed it?',
   ans:write(`<p>A <b>foreign key</b> is an attribute in one table that refers to the primary key of another table. It links the two tables and maintains <b>referential integrity</b>.</p><p><b>Example:</b> ORDERS(<u>OrderID</u>, OrderDate, CustID). Here ORDERS.CustID is a foreign key referring to CUSTOMER.CustID.</p>`)
    +why(`<p>The foreign key is a “pointer” to an existing row. The DBMS will not let an order point to customer C09 if C09 does not exist. Try it below.</p>`)},
  {id:'e',q:'Mention any two database integrity constraints.',think:'Rules about keys, references and allowed values.',
   ans:write(`<ol><li><b>Entity integrity</b> — the primary key cannot be NULL.</li><li><b>Referential integrity</b> — a foreign key value must match an existing primary key value (or be NULL).</li></ol><p class="mq-extra">Also valid: domain constraint, key (UNIQUE) constraint, NOT NULL, CHECK constraint.</p>`)
    +why(`<p>Constraints are rules the DBMS checks on every insert, update and delete, so bad data is stopped at the door.</p>`)}],
 activity:'q4'},
{id:'q5',title:'ER diagram symbols',topic:'ER model',
 stem:'Draw the ER diagram symbol and give one example for each. (Chen notation, the one used in exam answers.)',
 parts:Object.entries(SYMBOLS).map(([k,s],i)=>({id:'abcde'[i],q:s.name,think:`What shape represents a ${s.name.toLowerCase()}?`,
   ans:write(`<p><b>Symbol:</b> ${s.shape}.</p>${s.svg}<p><b>Example:</b> ${{entity:'STUDENT (also COURSE, EMPLOYEE).',relationship:'ENROLLS between STUDENT and COURSE.',key:'RollNo of STUDENT — unique for every student.',multi:'PhoneNo — one student may have several phone numbers.',composite:'Name, made of FirstName and LastName (Address = Street, City, PIN is another).'}[k]}</p>`)
    +why({entity:'<p>An <b>entity</b> is a real-world thing we store data about. Its rectangle is the “box” that holds attributes.</p>',relationship:'<p>A <b>relationship</b> is an association between entities. Read the diamond as a verb: STUDENT <i>enrolls in</i> COURSE.</p>',key:'<p>The <b>underline</b> is the clue: it marks the attribute that uniquely identifies each entity.</p>',multi:'<p>Two outlines = can hold <b>many</b> values. In tables, a multivalued attribute becomes a separate table.</p>',composite:'<p>A composite attribute can be <b>split</b> into meaningful parts. The parts hang off the main ellipse.</p>'}[k])})),
 activity:'q5'},
{id:'q6',title:'ER diagram: students and projects',topic:'ER design',
 stem:'A university database tracks STUDENT (StudentID, Name, Dept) and PROJECT (ProjectID, Title). A student can enroll in multiple projects, and a project can have multiple students.',
 parts:[
  {id:'a',q:'Draw the complete ER diagram for this scenario.',think:'Two rectangles, their ellipses and one diamond in the middle.',
   ans:write(`${chen.svg(640,250,Q6_DIAGRAM.join(''),'Complete ER diagram: STUDENT M to N ENROLLS_IN PROJECT')}<p>STUDENT and PROJECT are entities (rectangles) joined by the relationship ENROLLS_IN (diamond). Attributes are ellipses; keys are underlined.</p>`)
    +why(`<p>Build it one step at a time with the step-by-step builder below. The order is entities → attributes → keys → relationship → cardinality.</p>`)},
  {id:'b',q:'Clearly mark the primary key for each entity.',think:'Which attribute is unique for each student? For each project?',
   ans:write(`<p>STUDENT: <b><u>StudentID</u></b>. PROJECT: <b><u>ProjectID</u></b>. Both are underlined in the diagram.</p>`)
    +why(`<p>Names and titles can repeat. IDs are assigned to be unique.</p>`)},
  {id:'c',q:'State the cardinality ratio of the relationship (1:1, 1:N, or M:N).',think:'Ask both directions: one student → how many projects? One project → how many students?',
   ans:write(`<p><b>M:N (many-to-many)</b> — one student can enroll in many projects, and one project can have many students.</p>`)
    +why(`<p>Always ask the question <b>both ways</b>. “Many” in both directions = M:N. When mapped to tables, M:N needs a third table: ENROLLMENT(<u>StudentID, ProjectID</u>).</p>`)}],
 activity:'q6'},
{id:'q7',title:'Mapping 1:N to relational tables',topic:'Mapping',
 stem:'A company has DEPARTMENT (DeptID, DeptName) and EMPLOYEE (EmpID, EmpName). One department employs many employees, but each employee works in only one department.',
 parts:[
  {id:'a',q:'Map this design into relational tables showing all column names.',think:'Each entity becomes a table. Where does the link go?',
   ans:write(`<p>DEPARTMENT(<u>DeptID</u>, DeptName)</p><p>EMPLOYEE(<u>EmpID</u>, EmpName, DeptID)</p>`)
    +why(`<p>Each entity → one table. For a 1:N relationship, copy the primary key of the “1” side into the “N” side as a new column.</p>`)},
  {id:'b',q:'Underline the primary key in each table.',think:'One identifier per table.',
   ans:write(`<p>DEPARTMENT: <u><b>DeptID</b></u>. EMPLOYEE: <u><b>EmpID</b></u>.</p>`)
    +why(`<p>DeptID in EMPLOYEE is <b>not</b> underlined there: in EMPLOYEE it is a foreign key, and it repeats (many employees share one department).</p>`)},
  {id:'c',q:'In which table will the foreign key be placed, and what attribute will it be?',think:'Which side is “many”? Can one cell hold many employee IDs?',
   ans:write(`<p>The foreign key is placed in the <b>EMPLOYEE</b> table (the “many” side). The attribute is <b>DeptID</b>, which refers to DEPARTMENT.DeptID.</p>`)
    +why(`<p>Each employee has exactly one department, so one DeptID per employee row fits perfectly. Putting EmpID inside DEPARTMENT would need a list of employees in one cell, which breaks atomic values. See both options in the activity.</p>`)},
  {id:'d',q:'State the main purpose of using a foreign key in relational databases.',think:'What stops an employee being assigned to a department that does not exist?',
   ans:write(`<p>A foreign key <b>links two tables</b> and enforces <b>referential integrity</b>: every value in the foreign key must match an existing primary key in the referenced table. This prevents orphan records (e.g. an employee in a non-existent department) and allows related data to be joined.</p>`)
    +why(`<p>Try adding an employee to department D9 below. The DBMS refuses, because D9 does not exist.</p>`)}],
 activity:'q7'}
];

/* ── Self-rating state ── */
const MQ_KEY='cinesuper-mq-v1';
let mqRatings={};
try{const r=JSON.parse(localStorage.getItem(MQ_KEY));if(r&&typeof r==='object')mqRatings=r;}catch{}
const mqSave=()=>{try{localStorage.setItem(MQ_KEY,JSON.stringify(mqRatings));}catch{}};
const mqAllParts=()=>MODEL_QUESTIONS.flatMap(q=>q.parts.map(p=>q.id+p.id));

function questionsPage(target){
  current=-1;
  $('#app').innerHTML=`<main id="main" class="container mq">
  <div class="eyebrow">Exam practice · Module 1</div>
  <h1>Model questions, <em>explained.</em></h1>
  <p class="lead">Think first, then reveal the model answer. Each answer shows what to write in the exam and why it is true. Every question ends with something to try.</p>
  <div class="mq-toolbar"><div class="mq-progress"><span id="mq-count"></span><div class="progress-track"><span id="mq-bar"></span></div></div>
  <div class="mq-tools"><button id="mq-show-all">Show all answers</button><button id="mq-hide-all">Hide all</button><label class="mq-filter"><input type="checkbox" id="mq-revise-only"> Only “need revision”</label><button id="mq-print">Print</button></div></div>
  <nav class="mq-nav" aria-label="Questions">${MODEL_QUESTIONS.map((q,i)=>`<button data-goto="${q.id}"><b>Q${i+1}</b><span>${q.topic}</span><i class="mq-dot" data-dot="${q.id}"></i></button>`).join('')}</nav>
  ${MODEL_QUESTIONS.map((q,i)=>`<section class="mq-question" id="mq-${q.id}">
    <div class="mq-qhead"><span class="mq-qno">Q${i+1}</span><div><div class="eyebrow">${q.topic}</div><h2>${q.title}</h2></div></div>
    ${q.stem?`<p class="mq-stem">${q.stem}</p>`:''}
    ${q.parts.map(p=>`<article class="mq-part" data-part="${q.id+p.id}">
      <div class="mq-q"><span class="mq-label">${p.id})</span><p>${p.q}</p></div>
      <p class="mq-think"><b>Think first:</b> ${p.think}</p>
      <button class="mq-reveal" aria-expanded="false">Reveal model answer</button>
      <div class="mq-ans" hidden>${p.ans}<div class="mq-rate"><span>How did you do?</span><button data-rate="knew">✓ I knew it</button><button data-rate="revise">↺ Need revision</button></div></div>
    </article>`).join('')}
    <div class="mq-activity"><div class="mq-activity-head"><small>TRY IT YOURSELF</small><span>Q${i+1} activity</span></div><div class="mq-activity-body" id="act-${q.id}"></div></div>
  </section>`).join('')}
  <div class="completion"><h3>Finished the set?</h3><p>Tick “Only need revision” above to see just the parts you marked for another look. Ratings are saved in this browser only.</p></div>
  </main>`;

  const setOpen=(part,open)=>{const b=part.querySelector('.mq-reveal');part.querySelector('.mq-ans').hidden=!open;b.setAttribute('aria-expanded',open);b.textContent=open?'Hide answer':'Reveal model answer';part.classList.toggle('open',open);};
  $$('.mq-part').forEach(part=>{
    part.querySelector('.mq-reveal').onclick=()=>setOpen(part,part.querySelector('.mq-ans').hidden);
    part.querySelectorAll('[data-rate]').forEach(b=>b.onclick=()=>{mqRatings[part.dataset.part]=b.dataset.rate;mqSave();paintRatings();});
  });
  $$('[data-goto]').forEach(b=>b.onclick=()=>document.getElementById('mq-'+b.dataset.goto).scrollIntoView({behavior:reducedMotion()?'auto':'smooth'}));
  $('#mq-show-all').onclick=()=>$$('.mq-part').forEach(p=>setOpen(p,true));
  $('#mq-hide-all').onclick=()=>$$('.mq-part').forEach(p=>setOpen(p,false));
  $('#mq-revise-only').onchange=paintRatings;
  $('#mq-print').onclick=()=>{$$('.mq-part').forEach(p=>setOpen(p,true));window.print();};
  paintRatings();
  MODEL_QUESTIONS.forEach(q=>MQ_ACTIVITIES[q.activity](document.getElementById('act-'+q.id)));
  if(target){const el=document.getElementById('mq-'+target);if(el)setTimeout(()=>el.scrollIntoView(),0);}
}
function paintRatings(){
  const all=mqAllParts(),knew=all.filter(k=>mqRatings[k]==='knew').length,only=$('#mq-revise-only')&&$('#mq-revise-only').checked;
  $('#mq-count').textContent=`${knew} of ${all.length} parts known · ${all.filter(k=>mqRatings[k]==='revise').length} to revise`;
  $('#mq-bar').style.width=`${knew/all.length*100}%`;
  $$('.mq-part').forEach(p=>{const r=mqRatings[p.dataset.part];p.dataset.rating=r||'';p.querySelectorAll('[data-rate]').forEach(b=>b.classList.toggle('selected',b.dataset.rate===r));p.hidden=only&&r!=='revise';});
  $$('.mq-question').forEach(s=>{const parts=[...s.querySelectorAll('.mq-part')];s.hidden=only&&parts.every(p=>p.hidden);});
  MODEL_QUESTIONS.forEach(q=>{const ks=q.parts.map(p=>q.id+p.id),dot=$(`[data-dot="${q.id}"]`);dot.className='mq-dot'+(ks.every(k=>mqRatings[k]==='knew')?' done':ks.some(k=>mqRatings[k]==='revise')?' revise':'');});
}

/* "Pick a category" rows: each item gets one button per category and instant feedback. */
function classify(host,{intro,cats,items,done}){
  host.insertAdjacentHTML('beforeend',`<p>${intro}</p><div class="mq-classify">${items.map((it,i)=>`<div class="mq-crow" data-i="${i}"><span>${it[0]}</span><div>${cats.map(([k,l])=>`<button data-cat="${k}">${l}</button>`).join('')}</div><p class="mq-cwhy" hidden></p></div>`).join('')}</div><div class="feedback" role="status" aria-live="polite">0 of ${items.length} correct.</div>`);
  const fb=host.lastElementChild,rows=[...host.querySelectorAll('.mq-crow')].slice(-items.length);let right=new Set();
  rows.forEach(row=>row.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{
    const it=items[row.dataset.i],ok=b.dataset.cat===it[1],w=row.querySelector('.mq-cwhy');
    row.querySelectorAll('[data-cat]').forEach(x=>x.classList.remove('right','wrong'));b.classList.add(ok?'right':'wrong');
    w.hidden=false;w.textContent=(ok?'✓ ':'✗ Not quite. ')+it[2];
    ok?right.add(row.dataset.i):right.delete(row.dataset.i);
    fb.className='feedback'+(right.size===items.length?' good':'');fb.textContent=right.size===items.length?done:`${right.size} of ${items.length} correct.`;
  }));
}

const MQ_ACTIVITIES={
  q1(host){
    classify(host,{intro:'<b>Data, Database or DBMS?</b> Classify each item.',cats:[['data','Data'],['db','Database'],['dbms','DBMS']],
      items:[['52000','data','A raw number with no context — data.'],['“Anjali”','data','A single raw fact — data.'],['A college’s organised Students, Courses and Marks tables','db','Related data organised together — a database.'],['CineSuper’s genres, movies and reviews tables','db','Connected tables of related data — a database.'],['PostgreSQL','dbms','Software that manages databases — a DBMS. CineSuper uses it.'],['MySQL','dbms','A DBMS — software, not the data itself.'],['Oracle Database','dbms','A commercial DBMS.']],
      done:'All correct! Data = facts, Database = organised related data, DBMS = the software that manages it.'});
    host.insertAdjacentHTML('beforeend',`<h4 class="mq-sub">File system vs DBMS: why redundancy hurts</h4><p>Student Priya moves from <b>Chennai</b> to <b>Kochi</b>. Only the Accounts office hears about it.</p>
      <div class="chip-row"><button data-mode="file" class="selected">File processing system</button><button data-mode="dbms">DBMS</button></div><div id="q1-sim"></div>`);
    let mode='file',moved=false;
    const render=()=>{
      const city=moved?'Kochi':'Chennai',sim=host.querySelector('#q1-sim');
      sim.innerHTML=mode==='file'
        ?`<div class="two-tables">${table([{RollNo:21,Name:'Priya',City:city}],'accounts.txt · Accounts office')}${table([{RollNo:21,Name:'Priya',City:'Chennai'}],'library.txt · Library')}</div><button id="q1-move">Update Priya’s city in accounts.txt</button><div class="feedback ${moved?'bad':''}" role="status">${moved?'✗ Inconsistent! Accounts says Kochi, Library still says Chennai. The same fact was stored twice (redundancy), so the copies now disagree (inconsistency).':'The same address is stored in two separate files.'}</div>`
        :`${table([{RollNo:21,Name:'Priya',City:city}],'STUDENT table · stored once in the DBMS')}<div class="two-tables"><div class="mq-view"><b>Accounts app sees</b> Priya · ${city}</div><div class="mq-view"><b>Library app sees</b> Priya · ${city}</div></div><button id="q1-move">Update Priya’s city once</button><div class="feedback ${moved?'good':''}" role="status">${moved?'✓ Updated once, correct everywhere. Both applications read the same stored fact: no redundancy, no inconsistency.':'Both applications share one STUDENT table.'}</div>`;
      sim.querySelector('#q1-move').onclick=()=>{moved=true;render();};
    };
    host.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;moved=false;host.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('selected',x===b));render();});
    render();
  },
  q2(host){
    const levels={external:{name:'External level · view',who:'End users (students, accounts staff) through applications',sees:'<div class="two-tables"><div class="mq-view"><b>Student portal view</b>RollNo · Name · Marks</div><div class="mq-view"><b>Accounts view</b>RollNo · Name · FeesDue</div></div>',note:'Many views, each showing only what that user needs.'},
      conceptual:{name:'Conceptual level · logical',who:'Database designers and administrators',sees:'<div class="formula">STUDENT(<u>RollNo</u>, Name, Dept, Marks, FeesDue)<br>DEPARTMENT(<u>DeptID</u>, DeptName)</div>',note:'One schema describing all entities, attributes, relationships and constraints. No storage details.'},
      internal:{name:'Internal level · physical',who:'The DBMS and the storage system',sees:'<div class="formula">student.dat · 4 KB blocks · B+ tree index on RollNo · stored on SSD</div>',note:'How the bytes are actually stored and found.'}};
    host.innerHTML=`<p><b>Click each level</b> to see who works there and what they see.</p><div class="mq-arch">${Object.entries(levels).map(([k,l],i)=>`${i?'<div class="mq-map">↕ mapping</div>':''}<button data-level="${k}"><b>${l.name.split(' · ')[0]}</b><small>${l.name.split(' · ')[1]}</small></button>`).join('')}<div class="mq-disk">🗄 Stored database</div></div><div id="q2-info" class="mq-level-info">Select a level.</div>`;
    host.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{const l=levels[b.dataset.level];host.querySelectorAll('[data-level]').forEach(x=>x.classList.toggle('selected',x===b));host.querySelector('#q2-info').innerHTML=`<b>${l.name}</b><p><i>Who:</i> ${l.who}</p>${l.sees}<p class="note">${l.note}</p>`;});
    host.insertAdjacentHTML('beforeend','<h4 class="mq-sub">Physical or logical data independence?</h4>');
    classify(host,{intro:'Each change is made at one level. Which kind of independence keeps the level above unaffected?',cats:[['phy','Physical'],['log','Logical']],
      items:[['Create an index on STUDENT.RollNo to speed up searches','phy','An index is a storage/access structure: internal level.'],['Move the database files from a hard disk to an SSD','phy','Storage device change: internal level.'],['Add a new attribute Email to STUDENT','log','Changes the table structure: conceptual level. The old views still work.'],['Split STUDENT into STUDENT and ADDRESS tables','log','Conceptual schema change; views can be redefined so applications are unaffected.'],['Change file organisation from heap to hashed','phy','How records are arranged on disk: internal level.']],
      done:'All correct! Physical = storage changes below the tables. Logical = changes to the tables themselves.'});
  },
  q3(host){
    let cols=['EmpID','EmpName','Designation','Salary'],rows=[[101,'Asha','Manager',75000],[102,'Ravi','Developer',52000],[103,'Meera','Tester',41000]];
    const extraRows=[[104,'Kiran','Analyst',60000],[105,'Divya','Designer',47000],[106,'Arun','Intern',18000]];
    host.innerHTML=`<p>Change the table and watch <b>degree</b> and <b>cardinality</b>. Click a column header or a row to name it.</p><div class="mq-stats"><div><strong id="q3-deg"></strong><span>Degree (attributes)</span></div><div><strong id="q3-card"></strong><span>Cardinality (tuples)</span></div></div>
      <div class="controls"><button id="q3-addrow">+ Row</button><button id="q3-delrow">− Row</button><button id="q3-addcol">+ Column (Email)</button><button id="q3-delcol">− Column</button></div><div id="q3-table"></div><div id="q3-pick" class="note">Click a header or a row.</div>
      <h4 class="mq-sub">Domain checker for Salary</h4><p>Domain of Salary: numbers greater than 0. Type a value and check it.</p><div class="controls"><input id="q3-val" placeholder="e.g. 25000" aria-label="Salary value"><button id="q3-check">Check value</button></div><div class="chip-row">${['25000','48500.50','-5000','abc','0'].map(v=>`<button data-try="${v}">${v}</button>`).join('')}</div><div id="q3-dom" class="feedback" role="status" aria-live="polite">Try the sample values too.</div>`;
    const render=()=>{
      host.querySelector('#q3-deg').textContent=cols.length;host.querySelector('#q3-card').textContent=rows.length;
      host.querySelector('#q3-table').innerHTML=`<div class="table-wrap"><table class="mq-emp"><caption>EMPLOYEE</caption><thead><tr>${cols.map((c,i)=>`<th scope="col" data-col="${i}">${c}</th>`).join('')}</tr></thead><tbody>${rows.map((r,i)=>`<tr data-row="${i}">${cols.map((c,j)=>`<td>${esc(r[j]??(c==='Email'?r[1].toLowerCase()+'@co.in':''))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      host.querySelectorAll('[data-col]').forEach(th=>th.onclick=()=>{mark(`[data-col="${th.dataset.col}"]`,null,+th.dataset.col);host.querySelector('#q3-pick').innerHTML=`<b>${cols[th.dataset.col]}</b> is an <b>attribute</b> (column). Degree counts these: ${cols.length}.`;});
      host.querySelectorAll('[data-row]').forEach(tr=>tr.onclick=()=>{mark(null,+tr.dataset.row);host.querySelector('#q3-pick').innerHTML=`This row is one <b>tuple</b> (record): ${rows[tr.dataset.row].slice(0,cols.length).map(esc).join(', ')}. Cardinality counts these: ${rows.length}.`;});
    };
    const mark=(_,row,col)=>{host.querySelectorAll('.mq-emp .hl').forEach(e=>e.classList.remove('hl'));if(row!=null)host.querySelector(`[data-row="${row}"]`).classList.add('hl');if(col!=null)host.querySelectorAll(`.mq-emp tr`).forEach(tr=>tr.children[col]&&tr.children[col].classList.add('hl'));};
    host.querySelector('#q3-addrow').onclick=()=>{if(rows.length<6)rows.push(extraRows[rows.length-3]);render();};
    host.querySelector('#q3-delrow').onclick=()=>{if(rows.length>1)rows.pop();render();};
    host.querySelector('#q3-addcol').onclick=()=>{if(!cols.includes('Email'))cols.push('Email');render();};
    host.querySelector('#q3-delcol').onclick=()=>{if(cols.length>2)cols.pop();render();};
    const check=v=>{v=String(v).trim();const n=Number(v),id='q3-dom';
      if(v==='')return feedback(id,'Type a value first.',false);
      if(!/^-?\d+(\.\d{1,2})?$/.test(v))return feedback(id,`✗ “${v}” is not in the domain: Salary must be a number. The DBMS rejects it (domain constraint).`,false);
      if(n<=0)return feedback(id,`✗ ${v} is a number, but outside the domain: salary must be greater than 0.`,false);
      feedback(id,`✓ ${v} is a valid value in the domain of Salary.`,true);};
    host.querySelector('#q3-check').onclick=()=>check(host.querySelector('#q3-val').value);
    host.querySelectorAll('[data-try]').forEach(b=>b.onclick=()=>{host.querySelector('#q3-val').value=b.dataset.try;check(b.dataset.try);});
    render();
  },
  q4(host){
    const cust=[{CustID:'C01',NationalID:'IN-4521',Name:'Priya',Email:'priya.k@mail.com',City:'Chennai'},{CustID:'C02',NationalID:'IN-7788',Name:'Arjun',Email:'arjun@mail.com',City:'Kochi'},{CustID:'C03',NationalID:'IN-1290',Name:'Priya',Email:'priya.s@mail.com',City:'Kochi'},{CustID:'C04',NationalID:'IN-3345',Name:'Fathima',Email:'fathima@mail.com',City:'Chennai'}];
    let orders=[{OrderID:'O1',OrderDate:'2026-10-01',CustID:'C01'},{OrderID:'O2',OrderDate:'2026-10-03',CustID:'C03'}];
    const cols=Object.keys(cust[0]);
    host.innerHTML=`<p><b>Test each column as a primary key.</b> A key must be unique and never NULL.</p><div class="chip-row">${cols.map(c=>`<button data-key="${c}">Test ${c}</button>`).join('')}</div><div id="q4-cust"></div><div id="q4-key" class="feedback" role="status" aria-live="polite">Pick a column to test.</div>
      <h4 class="mq-sub">Foreign key in action</h4><p>ORDERS.CustID is a foreign key referring to CUSTOMER.CustID. Try adding an order for an existing customer, and one that doesn’t exist.</p><div id="q4-orders"></div>
      <div class="controls"><label>CustID for new order<select id="q4-cid">${['C02','C04','C09','C77'].map(v=>`<option>${v}</option>`).join('')}</select></label><button id="q4-add">Insert order</button><button id="q4-del">Delete customer C01</button></div><div id="q4-fk" class="feedback" role="status" aria-live="polite">The DBMS checks every foreign key.</div>`;
    const renderCust=(col,dups=[])=>{host.querySelector('#q4-cust').innerHTML=`<div class="table-wrap"><table><caption>CUSTOMER</caption><thead><tr>${cols.map(c=>`<th class="${c===col?'hl':''}">${c}</th>`).join('')}</tr></thead><tbody>${cust.map(r=>`<tr>${cols.map(c=>`<td class="${c===col?(dups.includes(r[c])?'dup':'hl'):''}">${esc(r[c])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;};
    const renderOrders=()=>{host.querySelector('#q4-orders').innerHTML=table(orders,'ORDERS · CustID → CUSTOMER.CustID');};
    host.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>{
      const c=b.dataset.key,vals=cust.map(r=>r[c]),dups=vals.filter((v,i)=>vals.indexOf(v)!==i);
      host.querySelectorAll('[data-key]').forEach(x=>x.classList.toggle('selected',x===b));renderCust(c,dups);
      const msg={CustID:'✓ Unique for every customer → candidate key. Best choice for PRIMARY KEY: short, stable, system-generated.',NationalID:'✓ Unique → candidate key. Usually not chosen: it is sensitive personal data and not every customer has one. It becomes an alternate key.',Email:'✓ Unique → candidate key. Usually not chosen: people change email addresses. It becomes an alternate key.'}[c];
      dups.length?feedback('q4-key',`✗ ${c} has duplicates (${[...new Set(dups)].join(', ')} appears more than once), so it cannot identify one customer. Not a key.`,false):feedback('q4-key',msg,true);
    });
    host.querySelector('#q4-add').onclick=()=>{const id=host.querySelector('#q4-cid').value;
      if(!cust.some(c=>c.CustID===id))return feedback('q4-fk',`✗ Rejected: referential integrity violation. No customer ${id} exists, so an order cannot point to it.`,false);
      orders.push({OrderID:'O'+(orders.length+1),OrderDate:'2026-10-12',CustID:id});renderOrders();feedback('q4-fk',`✓ Inserted. ${id} exists in CUSTOMER, so the foreign key is valid.`,true);};
    host.querySelector('#q4-del').onclick=()=>feedback('q4-fk',orders.some(o=>o.CustID==='C01')?'✗ Rejected: order O1 still refers to C01. Deleting C01 would leave an orphan order (referential integrity).':'C01 has no orders now, so it could be deleted.',false);
    renderCust();renderOrders();
  },
  q5(host){
    const keys=Object.keys(SYMBOLS);let order=[],at=0,score=0;
    host.innerHTML=`<p><b>Symbol quiz.</b> Name the symbol in the drawing.</p><div id="q5-quiz"></div>`;
    const start=()=>{order=[...keys].sort(()=>Math.random()-.5);at=0;score=0;ask();};
    const ask=()=>{
      const box=host.querySelector('#q5-quiz');
      if(at===order.length){box.innerHTML=`<div class="feedback ${score===keys.length?'good':''}" role="status">You scored ${score} / ${keys.length}. ${score===keys.length?'All symbols mastered!':'Reveal the answers above and try again.'}</div><button id="q5-again">Play again</button>`;box.querySelector('#q5-again').onclick=start;return;}
      const k=order[at];box.innerHTML=`<div class="mq-quiz-card"><small>Symbol ${at+1} of ${keys.length}</small>${SYMBOLS[k].svg}</div><div class="chip-row">${keys.map(o=>`<button data-sym="${o}">${SYMBOLS[o].name}</button>`).join('')}</div><div class="feedback" role="status" aria-live="polite">Which ER concept does this drawing show?</div>`;
      box.querySelectorAll('[data-sym]').forEach(b=>b.onclick=()=>{
        const ok=b.dataset.sym===k;if(ok)score+=box.dataset.tried?0:1;box.dataset.tried='1';
        b.classList.add(ok?'right':'wrong');
        if(ok){box.querySelector('.feedback').className='feedback good';box.querySelector('.feedback').textContent=`✓ ${SYMBOLS[k].name}: ${SYMBOLS[k].shape.toLowerCase()}.`;setTimeout(()=>{at++;delete box.dataset.tried;ask();},reducedMotion()?300:1100);}
        else{box.querySelector('.feedback').className='feedback bad';box.querySelector('.feedback').textContent=`✗ Not ${SYMBOLS[b.dataset.sym].name.toLowerCase()} (that is a ${SYMBOLS[b.dataset.sym].shape.toLowerCase()}). Try again.`;}
      });
    };
    start();
  },
  q6(host){
    let step=0;
    host.innerHTML=`<p><b>Build the ER diagram step by step</b>, the way you would draw it in the exam.</p><div class="mq-build" id="q6-svg"></div><p id="q6-cap" class="mq-cap" aria-live="polite"></p><div class="controls"><button id="q6-back">← Back</button><button id="q6-next" class="primary">Next step →</button></div>
      <h4 class="mq-sub">Prove the cardinality with real rows</h4><div class="two-tables">${table([{StudentID:'S1',Name:'Anu',Dept:'BCA'},{StudentID:'S2',Name:'Bala',Dept:'BCA'}],'STUDENT')}${table([{ProjectID:'P1',Title:'Library App'},{ProjectID:'P2',Title:'Movie DB'}],'PROJECT')}</div>
      <p>Anu works on P1 and P2. P1 has Anu and Bala. What is the cardinality?</p><div class="chip-row">${['1:1','1:N','M:N'].map(c=>`<button data-card="${c}">${c}</button>`).join('')}</div><div id="q6-fb" class="feedback" role="status" aria-live="polite">Choose one.</div><div id="q6-map"></div>`;
    const render=()=>{
      host.querySelector('#q6-svg').innerHTML=chen.svg(640,250,Q6_DIAGRAM.slice(0,step+1).join(''),'ER diagram, step '+(step+1));
      host.querySelector('#q6-cap').textContent=Q6_STEPS[step];
      host.querySelector('#q6-back').disabled=step===0;host.querySelector('#q6-next').disabled=step===Q6_STEPS.length-1;
    };
    host.querySelector('#q6-next').onclick=()=>{step++;render();};
    host.querySelector('#q6-back').onclick=()=>{step--;render();};
    host.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>{
      host.querySelectorAll('[data-card]').forEach(x=>x.classList.remove('right','wrong'));
      if(b.dataset.card==='M:N'){b.classList.add('right');feedback('q6-fb','✓ M:N. One student → many projects AND one project → many students. In tables this needs a bridge table:',true);
        host.querySelector('#q6-map').innerHTML=table([{StudentID:'S1',ProjectID:'P1'},{StudentID:'S1',ProjectID:'P2'},{StudentID:'S2',ProjectID:'P1'}],'ENROLLMENT (StudentID, ProjectID) · composite primary key');}
      else{b.classList.add('wrong');host.querySelector('#q6-map').innerHTML='';feedback('q6-fb',b.dataset.card==='1:1'?'✗ Anu has two projects, so it is not one-to-one.':'✗ 1:N would mean each project has only one student, but P1 has Anu and Bala.',false);}
    });
    render();
  },
  q7(host){
    const dept=[{DeptID:'D1',DeptName:'Sales'},{DeptID:'D2',DeptName:'IT'}];
    let emp=[{EmpID:'E1',EmpName:'Asha',DeptID:'D1'},{EmpID:'E2',EmpName:'Ravi',DeptID:'D2'},{EmpID:'E3',EmpName:'Meera',DeptID:'D2'}];
    host.innerHTML=`<p><b>Where should the link go?</b> Try both options and compare.</p><div class="chip-row"><button data-place="emp">Put DeptID in EMPLOYEE</button><button data-place="dept">Put EmpID in DEPARTMENT</button></div><div id="q7-out"></div>
      <h4 class="mq-sub">Purpose of the foreign key</h4><p>Add a new employee, Kiran. Choose a department.</p><div class="controls"><label>DeptID<select id="q7-d"><option>D1</option><option>D2</option><option>D9</option></select></label><button id="q7-add">Insert employee</button></div><div id="q7-emp"></div><div id="q7-fb" class="feedback" role="status" aria-live="polite">The DBMS checks DeptID against DEPARTMENT.</div>`;
    const keyTable=(name,cols,rows,pk,fk)=>`<div class="table-wrap"><table><caption>${name}</caption><thead><tr>${cols.map(c=>`<th>${c===pk?`<u>${c}</u> 🔑`:c===fk?`${c} 🔗 FK`:c}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td class="${c===fk?'fk':''}">${esc(r[c])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    const renderEmp=()=>{host.querySelector('#q7-emp').innerHTML=keyTable('EMPLOYEE',['EmpID','EmpName','DeptID'],emp,'EmpID','DeptID');};
    host.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>{
      host.querySelectorAll('[data-place]').forEach(x=>x.classList.toggle('selected',x===b));const out=host.querySelector('#q7-out');
      out.innerHTML=b.dataset.place==='emp'
        ?`<div class="two-tables">${keyTable('DEPARTMENT',['DeptID','DeptName'],dept,'DeptID')}${keyTable('EMPLOYEE',['EmpID','EmpName','DeptID'],emp,'EmpID','DeptID')}</div><div class="feedback good">✓ Correct. Every cell holds one value, and each employee row points to exactly one department. The “1” side’s key goes into the “N” side.</div>`
        :`${keyTable('DEPARTMENT',['DeptID','DeptName','EmpID'],[{DeptID:'D1',DeptName:'Sales',EmpID:'E1'},{DeptID:'D2',DeptName:'IT',EmpID:'E2, E3'}],'DeptID','EmpID')}<div class="feedback bad">✗ Problem: IT has two employees, so one cell must hold “E2, E3” — not atomic, breaking a rule of relational tables. Repeating the IT row instead would duplicate DeptID, which is the primary key. So the foreign key never goes on the “1” side of a 1:N.</div>`;
    });
    host.querySelector('#q7-add').onclick=()=>{const d=host.querySelector('#q7-d').value;
      if(!dept.some(x=>x.DeptID===d))return feedback('q7-fb',`✗ Rejected: referential integrity violation. Department ${d} does not exist, so Kiran cannot be assigned to it. This is exactly what a foreign key prevents.`,false);
      if(emp.some(e=>e.EmpName==='Kiran'))return feedback('q7-fb','Kiran is already added. The foreign key accepted a valid department.',true);
      emp.push({EmpID:'E4',EmpName:'Kiran',DeptID:d});renderEmp();feedback('q7-fb',`✓ Inserted. ${d} exists in DEPARTMENT, so the link is valid. Now you can join EMPLOYEE and DEPARTMENT to show Kiran’s department name.`,true);};
    renderEmp();
  }
};

/* app.js renders the first route before this file loads. */
if(/^#questions/.test(location.hash))route();
