const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');const {buildAnswerPdf}=require('../pdf.js');
const PDFLib=require('pdf-lib'),fontkit=require('@pdf-lib/fontkit');
const root=path.join(__dirname,'..'),lesson=JSON.parse(fs.readFileSync(path.join(root,'lesson.json'),'utf8'));
const source=fs.readFileSync(path.join(root,'app.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const KEY='cheongju-bio-class:v1';let checks=0;
function pass(name){checks++;console.log('PASS',name);}
async function setup({stored,blocked=false,badFetch=false}={}){
 const dom=new JSDOM(html,{url:'https://sskuld5-alt.github.io/cheongju-bio-class/',runScripts:'outside-only'}),w=dom.window;const errors=[];
 w.console.error=(...x)=>errors.push(x.join(' '));w.fetch=async()=>({ok:!badFetch,json:async()=>lesson});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 if(stored!==undefined)w.localStorage.setItem(KEY,stored);
 if(blocked)Object.defineProperty(w,'localStorage',{get(){throw new Error('storage blocked');}});
 w.eval(source);await new Promise(r=>setImmediate(r));return {dom,w,d:w.document,errors};
}
function input(w,node,value){node.value=value;node.dispatchEvent(new w.Event('input',{bubbles:true}));}
(async()=>{
 let {dom,w,d,errors}=await setup();assert.equal(d.documentElement.dataset.ready,'true');assert.equal(d.querySelectorAll('textarea').length,8);assert.equal(d.querySelectorAll('.quiz-card').length,3);assert.equal(errors.length,0);pass('lesson renders eight fields, three quizzes, no runtime errors');
 input(w,d.getElementById('idea'),'한글 답안 <script>alert(1)</script> & 품질');input(w,d.querySelector('[name="student"]'),'테스트 별칭');const stored=w.localStorage.getItem(KEY);assert.equal(JSON.parse(stored).answers.idea,'한글 답안 <script>alert(1)</script> & 품질');assert.equal(d.getElementById('progress').value,1);pass('Unicode answers save as text and progress updates');
 const restored=await setup({stored});assert.equal(restored.d.getElementById('idea').value,'한글 답안 <script>alert(1)</script> & 품질');assert.equal(restored.d.querySelector('[name="student"]').value,'테스트 별칭');restored.w.close();pass('reload restores answers and identity');
 d.getElementById('check-order').click();assert.match(d.getElementById('order-result').textContent,/다시/);
 for(const id of ['design','culture','purify','check']){const target=lesson.steps.findIndex(s=>s.id===id);while([...d.querySelectorAll('.step-list li strong')].findIndex(e=>e.textContent===lesson.steps[target].title)>target)d.getElementById('move-'+id+'-up').click();}
 d.getElementById('check-order').click();assert.match(d.getElementById('order-result').textContent,/잘 연결/);assert.equal(d.getElementById('move-design-up').disabled,true);assert.equal(d.getElementById('move-check-down').disabled,true);pass('process rearrangement supports boundaries and correct/incorrect feedback');
 d.getElementById('check-quiz').click();assert.match(d.getElementById('quiz-result').textContent,/0문항/);lesson.quizzes.forEach((q,i)=>{const node=d.querySelector(`input[name="quiz-${i}"][value="${q.answer}"]`);node.checked=true;node.dispatchEvent(new w.Event('change'));});d.getElementById('check-quiz').click();assert.match(d.getElementById('quiz-result').textContent,/3 \/ 3/);pass('unanswered and correct quiz results with explanations');
 let printed=false;w.print=()=>printed=true;d.getElementById('print-answer').click();assert.equal(printed,true);assert.match(d.getElementById('print-sheet').textContent,/<script>alert\(1\)<\/script>/);assert.equal(d.getElementById('print-sheet').querySelector('script'),null);pass('print output preserves input without executing HTML');
 d.getElementById('download-answer').click();await new Promise(r=>setImmediate(r));assert.match(d.getElementById('pdf-status').textContent,/답안은 그대로/);assert.equal(d.getElementById('download-answer').disabled,false);assert.match(d.getElementById('idea').value,/한글/);pass('missing PDF library retains answers and allows retry/print');
 d.getElementById('clear-answers').click();d.getElementById('cancel-clear').click();assert.match(d.getElementById('idea').value,/한글/);d.getElementById('clear-answers').click();d.getElementById('confirm-clear').click();assert.equal(d.getElementById('idea').value,'');assert.equal(w.localStorage.getItem(KEY),null);assert.equal(d.getElementById('progress').value,0);pass('clear requires confirmation, cancel preserves, confirm clears');w.close();
 const b=await setup({blocked:true});input(b.w,b.d.getElementById('idea'),'저장 금지 환경');assert.match(b.d.getElementById('save-status').textContent,/저장 불가/);assert.equal(b.d.getElementById('idea').value,'저장 금지 환경');b.w.close();pass('blocked localStorage does not prevent writing');
 const c=await setup({stored:'{broken'});assert.equal(c.d.documentElement.dataset.ready,'true');c.w.close();const malformed=await setup({stored:JSON.stringify({version:1,order:['bad'],answers:{idea:42},quiz:{0:999}})});assert.equal(malformed.d.getElementById('idea').value,'');malformed.w.close();pass('corrupt and malformed saved state recover safely');
 const f=await setup({badFetch:true});assert.equal(f.d.getElementById('load-error').hidden,false);assert.equal(f.d.getElementById('download-answer').disabled,true);f.w.close();pass('failed lesson request offers static PDF fallback');
 const assetDom=new JSDOM(html);for(const e of assetDom.window.document.querySelectorAll('[src],[href]')){const value=e.getAttribute('src')||e.getAttribute('href');if(value.startsWith('#')||/^https?:/.test(value))continue;assert(fs.existsSync(path.join(root,value)),value);}assetDom.window.close();pass('all local assets and download targets exist');
 const font=fs.readFileSync(path.join(root,'assets/NanumGothic-Regular.ttf'));
 const empty=await buildAnswerPdf(lesson,{identity:{},answers:{},order:lesson.steps.map(s=>s.id),quiz:{}},font,PDFLib,fontkit);fs.writeFileSync(path.join(root,'tmp/answer-empty.pdf'),empty);
 const answers=Object.fromEntries(lesson.fields.map(f=>[f.id,('한글 긴 답안: 품질 & 접근성 <생명> 검증.\n').repeat(60)+'끝-'+f.id]));answers.exit+=' 🧬';
 const full=await buildAnswerPdf(lesson,{identity:{student:'검증학생'},answers,order:lesson.steps.map(s=>s.id),quiz:{0:1,1:2,2:0}},font,PDFLib,fontkit);fs.writeFileSync(path.join(root,'tmp/answer-long.pdf'),full);const doc=await PDFLib.PDFDocument.load(full);assert(doc.getPageCount()>4);pass('actual Korean PDF generation with empty, long, special-character answers');
 const successful=await setup();const sw=successful.w,sd=successful.d;let downloadedBlob,downloadName;
 for(const file of ['assets/pdf-lib.min.js','assets/fontkit.umd.min.js','pdf.js'])sw.eval(fs.readFileSync(path.join(root,file),'utf8'));
 sw.fetch=async()=>({ok:true,arrayBuffer:async()=>new sw.Uint8Array(font).buffer});
 sw.URL.createObjectURL=blob=>{downloadedBlob=blob;return 'blob:test';};sw.URL.revokeObjectURL=()=>{};
 sw.HTMLAnchorElement.prototype.click=function(){downloadName=this.download;};
 input(sw,sd.getElementById('idea'),'브라우저 모듈 답안 저장 검증');sd.getElementById('download-answer').click();
 for(let i=0;i<200&&sd.getElementById('download-answer').disabled;i++)await new Promise(r=>setTimeout(r,50));
 assert.equal(downloadName,'중학교3학년_생명기술_내활동지.pdf');assert.equal(downloadedBlob.type,'application/pdf');
 const downloadedBytes=await new Promise((resolve,reject)=>{const r=new sw.FileReader();r.onload=()=>resolve(new Uint8Array(r.result));r.onerror=reject;r.readAsArrayBuffer(downloadedBlob);});
 fs.writeFileSync(path.join(root,'tmp/answer-browser-module.pdf'),downloadedBytes);assert((await PDFLib.PDFDocument.load(downloadedBytes)).getPageCount()>=2);assert.equal(successful.errors.length,0);sw.close();pass('shipped browser libraries generate a valid PDF and trigger a named download');
 console.log(`${checks} checks passed. PDF pages: ${doc.getPageCount()}. Browser visual QA is separate.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
