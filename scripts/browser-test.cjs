const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.REVIEW_URL||'https://sskuld5-alt.github.io/cheongju-bio-class/';
const out=path.resolve(__dirname,'../tmp/browser-review');fs.mkdirSync(out,{recursive:true});
const report={base,date:new Date().toISOString(),browser:'Chrome via Playwright',checks:[],screenshots:[]};
function pass(name){report.checks.push(name);console.log('PASS',name);}
async function ready(page){await page.goto(base,{waitUntil:'networkidle'});await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');await page.evaluate(()=>document.fonts.ready);}
async function shot(page,name,fullPage=false){const file=path.join(out,name+'.png');await page.screenshot({path:file,fullPage,animations:'disabled'});report.screenshots.push(file);}
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});report.version=browser.version();
 try{
  for(const [name,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844],['small-mobile',320,740]]){
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:width<600,hasTouch:width<600,acceptDownloads:true});
   const page=await context.newPage(),errors=[],badResponses=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)badResponses.push(r.url()+':'+r.status());});
   await ready(page);assert.match(await page.title(),/중학교 3학년 생명기술 연구노트/);
   await shot(page,name+'-top');
   const metrics=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth}));assert(metrics.scroll<=metrics.width+1,JSON.stringify({name,...metrics}));
   for(const section of ['learn','system','mission','reflect','downloads']){
    await page.locator('#'+section).scrollIntoViewIfNeeded();
    await page.evaluate(id=>document.getElementById(id).scrollIntoView({block:'start',behavior:'instant'}),section);
    await shot(page,name+'-'+section);
   }
   if(width<600){await page.locator('#idea').fill('모바일 입력 검수');assert.equal(await page.locator('#idea').inputValue(),'모바일 입력 검수');await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');assert.equal(await page.locator('#idea').inputValue(),'모바일 입력 검수');}
   assert.deepEqual(errors,[]);assert.deepEqual(badResponses,[]);pass(name+': layout has no horizontal overflow, title/assets load, all sections captured'+(width<600?', touch-size input saves and restores':''));
   await context.close();
  }
  const context=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.className),'skip');pass('keyboard skip link receives first focus');
  const lesson=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../lesson.json'),'utf8'));
  for(const f of lesson.fields)await page.locator('#'+f.id).fill(f.id==='idea'?('검수답안: 생명기술은 품질과 접근성을 함께 고려해야 합니다.\n').repeat(35)+'마지막표식-실제브라우저':'검수 답안 '+f.id);
  await page.locator('[name="student"]').fill('검수용 가상학생');assert.equal(await page.locator('#progress').getAttribute('value'),'8');
  await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');assert.match(await page.locator('#idea').inputValue(),/마지막표식-실제브라우저$/);assert.equal(await page.locator('[name="student"]').inputValue(),'검수용 가상학생');pass('all eight answers and optional identity persist after reload');
  await page.locator('#check-order').click();assert.match(await page.locator('#order-result').textContent(),/다시/);
  for(let target=0;target<lesson.steps.length;target++){const step=lesson.steps[target];while((await page.locator('.step-list li strong').allTextContents()).indexOf(step.title)>target)await page.locator('#move-'+step.id+'-up').click();}
  await page.locator('#check-order').click();assert.match(await page.locator('#order-result').textContent(),/잘 연결/);pass('real clicks reorder process cards and give correct feedback');
  await page.locator('#check-quiz').click();assert.match(await page.locator('#quiz-result').textContent(),/0문항/);
  for(let i=0;i<lesson.quizzes.length;i++)await page.locator(`input[name="quiz-${i}"][value="${lesson.quizzes[i].answer}"]`).check();
  await page.locator('#check-quiz').click();assert.match(await page.locator('#quiz-result').textContent(),/3 \/ 3/);pass('quiz radio controls, unanswered feedback and explanations work');
  for(const [selector,file] of [['a[href="downloads/bio-learning-kit.pdf"]','learning-kit.pdf'],['a[href="downloads/bio-teacher-guide.pdf"]','teacher-guide.pdf']]){
   const pending=page.waitForEvent('download');await page.locator(selector).first().click();const download=await pending;assert.equal(await download.failure(),null);await download.saveAs(path.join(out,file));assert(fs.readFileSync(path.join(out,file)).subarray(0,5).equals(Buffer.from('%PDF-')));pass('download '+file);
  }
  const pending=page.waitForEvent('download',{timeout:30000});await page.locator('#download-answer').click();const download=await pending;assert.equal(await download.failure(),null);assert.equal(download.suggestedFilename(),'중학교3학년_생명기술_내활동지.pdf');await download.saveAs(path.join(out,'completed-answer.pdf'));pass('actual browser generates and downloads Korean answer PDF');
  await page.evaluate(()=>window.print=()=>{window.__printCalled=true;});await page.locator('#print-answer').click();assert.equal(await page.evaluate(()=>window.__printCalled),true);await page.emulateMedia({media:'print'});await page.pdf({path:path.join(out,'print-fallback.pdf'),preferCSSPageSize:true,printBackground:true});await page.emulateMedia({media:'screen'});pass('print fallback produces paginated PDF');
  await page.locator('#clear-answers').click();assert.equal(await page.locator('#clear-dialog').isVisible(),true);await page.locator('#cancel-clear').click();assert.match(await page.locator('#idea').inputValue(),/마지막표식/);
  await page.locator('#clear-answers').click();await page.locator('#confirm-clear').click();assert.equal(await page.locator('#idea').inputValue(),'');await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');assert.equal(await page.locator('#idea').inputValue(),'');pass('cancel preserves answers; confirmed reset remains cleared after reload');assert.deepEqual(errors,[]);await context.close();
  const blocked=await browser.newContext();await blocked.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Blocked','QuotaExceededError');};});const bp=await blocked.newPage();await ready(bp);await bp.locator('#idea').fill('저장 불가 상황의 보존 답안');assert.match(await bp.locator('#save-status').textContent(),/저장 불가/);const bd=bp.waitForEvent('download');await bp.locator('#download-answer').click();await(await bd).saveAs(path.join(out,'storage-blocked-answer.pdf'));pass('storage denial keeps editing and actual PDF download available');await blocked.close();
  const retry=await browser.newContext();const rp=await retry.newPage();await ready(rp);await rp.locator('#idea').fill('PDF 실패 후 유지할 답안');await rp.route('**/assets/NanumGothic-Regular.ttf',route=>route.abort());await rp.locator('#download-answer').click();await rp.waitForFunction(()=>document.getElementById('pdf-status').textContent.includes('답안은 그대로'));assert.equal(await rp.locator('#idea').inputValue(),'PDF 실패 후 유지할 답안');await rp.unroute('**/assets/NanumGothic-Regular.ttf');const rd=rp.waitForEvent('download');await rp.locator('#download-answer').click();await(await rd).saveAs(path.join(out,'retry-answer.pdf'));pass('PDF font request failure preserves answers and retry succeeds');await retry.close();
  report.result='passed';
 }catch(e){report.result='failed';report.error=e.stack;throw e;}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
