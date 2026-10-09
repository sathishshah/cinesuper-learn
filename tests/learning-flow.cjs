const {chromium}=require('/Users/sathish/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});const page=await browser.newPage({viewport:{width:1440,height:1000}});let errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173');await page.screenshot({path:'/private/tmp/cinesuper-desktop.png',fullPage:true});assert.equal(await page.locator('.module-card').count(),2);
async function lesson(n){await page.goto('http://127.0.0.1:4173/#lesson-'+n);await page.locator('#lab').waitFor();}
async function click(s){await page.locator(s).click();}
async function select(s,v){await page.locator(s).selectOption(v);}
async function passed(){assert.match(await page.locator('#checkpoint-status').innerText(),/Activity: passed/);}
async function quiz(n){const correct=[1,1,1,1,2,1,1,1,0,2,1,1,1,0][n];await click(`[data-answer="${(correct+1)%3}"]`);await click('#check-answer');assert.match(await page.locator('#quiz-feedback').innerText(),/Not quite/);await click(`[data-answer="${correct}"]`);await click('#check-answer');assert.match(await page.locator('#checkpoint-status').innerText(),/Lesson complete/);}
for(let n=0;n<14;n++){await lesson(n);
if(n===0){await click('[data-table="genres"]');await click('[data-table="reviews"]');}
if(n===1){await click('[data-tier="1"]');await click('#tier-run');await page.locator('#tier-log .ix-done').waitFor({timeout:10000});
const answers={0:1,1:1,2:2,3:2,4:3,5:3};
await click('[data-scenario="0"]');await click('[data-bucket="2"]');await click('#sort-check');assert.match(await page.locator('#sort-feedback').innerText(),/0 of 6 correct/);
const card=await page.locator('[data-scenario="0"]').boundingBox(),one=await page.locator('[data-bucket="1"]').boundingBox();
await page.mouse.move(card.x+20,card.y+10);await page.mouse.down();await page.mouse.move(card.x+60,card.y+40,{steps:5});await page.mouse.move(one.x+40,one.y+60,{steps:8});await page.mouse.up();
assert.equal(await page.locator('[data-bucket="1"] [data-scenario="0"]').count(),1,'drag into 1-tier bucket');
for(const k of [1,2,3,4,5]){await click(`[data-scenario="${k}"]`);await click(`[data-bucket="${answers[k]}"]`);}
await click('#sort-check');assert.match(await page.locator('#sort-feedback').innerText(),/All 6 correct/);
await select('#level','Physical storage');await click('#layer-check');await page.screenshot({path:'/private/tmp/cinesuper-architecture.png',fullPage:true});}
if(n===2){await click('button[type="submit"]');assert.match(await page.locator('#lab-feedback').innerText(),/CHECK violation/);await page.fill('#rating','5');await page.fill('#mid','999');await click('button[type="submit"]');assert.match(await page.locator('#lab-feedback').innerText(),/Foreign-key violation/);await page.fill('#mid','1');await page.fill('#rid','1');await click('button[type="submit"]');assert.match(await page.locator('#lab-feedback').innerText(),/Primary-key violation/);await page.fill('#rid','4');await click('button[type="submit"]');assert.equal(await page.locator('#review-table tbody tr').count(),4);}
if(n===3){await click('[data-card-kind="1:N"]');await click('.ix-pg-item[data-val="Vikram"]');await click('.ix-pg-item[data-val="Drama"]');assert.match(await page.locator('#pg-msg').innerText(),/Rule broken/);
await click('[data-card-kind="M:N"]');await click('.ix-pg-item[data-val="Premam"]');await click('.ix-pg-item[data-val="Fahadh Faasil"]');assert.match(await page.locator('#pg-msg').innerText(),/bridge table/);assert.equal(await page.locator('#pg-store tbody tr').count(),7);
await click('[data-add="Rating"]');assert.match(await page.locator('#er-hint').innerText(),/attribute of Review/);
await click('[data-add="Genre"]');await click('[data-add="Movie"]');
const tray=await page.locator('[data-add="Review"]').boundingBox(),cv=await page.locator('#er-canvas').boundingBox();
await page.mouse.move(tray.x+10,tray.y+10);await page.mouse.down();await page.mouse.move(cv.x+cv.width-120,cv.y+60,{steps:10});await page.mouse.up();
assert.equal(await page.locator('[data-entity="Review"]').count(),1,'drag Review onto canvas');
await click('#er-check');assert.match(await page.locator('#lab-feedback').innerText(),/Connect Genre and Movie/);
await click('[data-connect="Genre"]');await page.locator('[data-entity="Movie"] li').first().click();
const h=await page.locator('[data-connect="Movie"]').boundingBox(),rv=await page.locator('[data-entity="Review"]').boundingBox();
await page.mouse.move(h.x+10,h.y+10);await page.mouse.down();await page.mouse.move(rv.x+40,rv.y+40,{steps:10});await page.mouse.up();
assert.equal(await page.locator('.ix-rel').count(),2,'two relationships');
await select('.ix-rel[data-pair="Genre-Movie"] .rel-card','M:N');assert.equal(await page.locator('.ix-table.bridge').count(),1,'M:N creates bridge');
await click('#er-check');assert.match(await page.locator('#lab-feedback').innerText(),/not M : N/);
await select('.ix-rel[data-pair="Genre-Movie"] .rel-card','1:N');await select('.ix-rel[data-pair="Movie-Review"] .rel-card','1:N');
await click('#er-check');assert.match(await page.locator('#lab-feedback').innerText(),/Every Review must have a Movie/);
await page.check('.ix-rel[data-pair="Movie-Review"] .rel-bneeds');await click('#er-check');
assert.match(await page.locator('#er-db').innerText(),/genre_id/);assert.match(await page.locator('#er-db').innerText(),/NOT NULL/);assert.equal(await page.locator('.ix-reveal').count(),1);
await page.screenshot({path:'/private/tmp/cinesuper-er.png',fullPage:true});}
if(n===4){await page.check('[value="series_id"]');await page.check('[value="episode_no"]');await click('#episode-check');}
if(n===5){await select('#genre-home','movies.genre_id');await select('#movie-home','reviews.movie_id');await click('#map-check');}
if(n===6){await select('#project','language');await click('#run-algebra');assert.equal(await page.locator('#algebra-result tbody tr').count(),3);await select('#filter-language','Tamil');await select('#project','title');await click('#run-algebra');assert.equal(await page.locator('#algebra-result tbody tr').count(),1);assert.match(await page.locator('#algebra-result').innerText(),/Vikram/);}
if(n===7){for(const op of ['union','product','join'])await click(`[data-op="${op}"]`);assert.equal(await page.locator('#set-result tbody tr').count(),6);}
if(n===8){await page.check('[value="movie_id"]');await click('#closure-run');assert.match(await page.locator('#closure-result').innerText(),/genre_name/);}
if(n===9){await select('#nf1-choice','rows');await click('#nf1-run');assert.equal(await page.locator('#nf1-result tbody tr').count(),2);}
if(n===10){await select('#nf2-choice','movie');await click('#nf2-run');assert.equal(await page.locator('#nf2-result table').count(),2);}
if(n===11){await select('#nf3-choice','genre');await click('#nf3-run');assert.equal(await page.locator('#nf3-result table').count(),2);}
if(n===12){await select('#split','lossy');await click('#join-back');assert.equal(await page.locator('#split-result table').last().locator('tbody tr').count(),4);await select('#split','safe');await click('#join-back');assert.equal(await page.locator('#split-result table').last().locator('tbody tr').count(),2);await select('#split-judgment','lossless');await click('#judge-split');}
if(n===13){for(let k=1;k<=3;k++)await select('#design'+k,'good');await click('#design-check');}
await passed();await quiz(n);console.log('PASS lesson '+(n+1));}
await page.reload();assert.match(await page.locator('#checkpoint-status').innerText(),/Lesson complete/);await page.goto('http://127.0.0.1:4173/#home');assert.match(await page.locator('.pill').innerText(),/14 \/ 14/);await page.goto('http://127.0.0.1:4173/#glossary');await page.fill('#term-search','zzzz');assert.match(await page.locator('#terms').innerText(),/No matching/);await page.fill('#term-search','foreign');assert.match(await page.locator('#terms').innerText(),/Foreign key/);
for(const h of ['lesson-1','lesson-3']){await page.goto('http://127.0.0.1:4173/#'+h);await page.reload();assert.equal(await page.locator('.ix-step').count()>0,true,'new lab renders on direct load of '+h);}
await page.goto('http://127.0.0.1:4173/#guide');const downloadPromise=page.waitForEvent('download');await click('#export-progress');assert.equal((await downloadPromise).suggestedFilename(),'cinesuper-learning-progress.txt');await click('#reset-progress');await click('#cancel-reset');assert.match(await page.locator('main').innerText(),/14 of 14/);await click('#reset-progress');await click('#confirm-reset');assert.match(await page.locator('main').innerText(),/0 of 14/);
await page.setViewportSize({width:390,height:844});for(const hash of ['home','lesson-1','lesson-3','lesson-2','lesson-7','lesson-12','database','glossary','guide']){await page.goto('http://127.0.0.1:4173/#'+hash);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Mobile horizontal overflow at '+hash);}await page.goto('http://127.0.0.1:4173/#home');await page.screenshot({path:'/private/tmp/cinesuper-mobile.png',fullPage:true});await page.goto('http://127.0.0.1:4173/#lesson-3');await click('#er-tidy');await page.screenshot({path:'/private/tmp/cinesuper-er-mobile.png',fullPage:true});await page.goto('http://127.0.0.1:4173/#lesson-12');await page.screenshot({path:'/private/tmp/cinesuper-lesson.png',fullPage:true});assert.deepEqual(errors,[]);console.log('PASS persistence, glossary, download, reset, mobile layouts and zero browser errors');await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
