async page => {
 const checks=[],errors=[],key='cps2390-testbank-v1';
 const assert=(ok,name)=>{if(!ok)throw new Error(name);checks.push(name);};
 const read=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 const reset=async()=>{await page.evaluate(k=>localStorage.removeItem(k),key);await page.reload();};
 page.on('pageerror',e=>errors.push(e.message));
 await reset();
 const data=JSON.parse(await page.locator('#quiz-data').textContent());
 assert(data.questions.length===244,'All 244 source questions are present');
 assert(data.questions.filter(q=>q.type==='tf').length===78&&data.questions.filter(q=>q.type==='mc').length===77&&data.questions.filter(q=>q.type==='fill').length===89,'Question type totals match the five source documents');
 assert(new Set(data.questions.map(q=>q.label)).size===244,'All labels are unique despite duplicate source numbers');
 assert(await page.locator('#course-switch').getAttribute('data-current-course')==='cps','Course selector identifies CPS2390');
 assert(await page.locator('#submit').isDisabled(),'Choice questions require a selection');
 assert(await page.locator('.answer-reason,.option-analysis').count()===0,'Explanations are hidden before submission');
 await page.locator('[data-choice="A"]').click();await page.locator('#submit').click();
 assert(!(await read()).answers[1].correct&&await page.locator('.option.correct').getAttribute('data-choice')==='B','True/false grading uses the original F key');
 await page.locator('#bookmark').click();await page.reload();
 assert((await read()).favorites.includes(1)&&(await read()).answers[1],'Answers and bookmarks persist across refresh');
 await page.locator('[data-mode="wrong"]').click();
 assert((await read()).order.join()==='1'&&await page.locator('.explanation').count()===0,'Wrong review hides previously revealed answers');
 await page.locator('[data-choice="B"]').click();await page.locator('#submit').click();
 assert((await read()).answers[1].correct&&(await read()).answers[1].attempts===2,'Correct retry clears a mistake and increments attempts');
 await page.locator('[data-mode="all"]').click();
 for(const [type,count] of [['tf',78],['mc',77],['fill',89]]){
  await page.locator(`[data-bank="${type}"]`).click();assert((await read()).order.length===count,`${type} filter has ${count} questions`);
 }
 await page.locator('#chapter-select').selectOption('1');
 assert((await read()).order.length===22,'Chapter and fill filters include all 22 chapter-2 blanks, including duplicate numbers');
 await page.locator('[data-mode="random"]').click();
 assert(new Set((await read()).order).size===22,'Random mode preserves the combined filters without duplicates');
 await page.locator('[data-mode="all"]').click();await page.locator('[data-bank="all"]').click();await page.locator('#chapter-select').selectOption('all');
 await page.locator('#search').fill('C2-FB03b');
 assert((await read()).order.length===1&&(await page.locator('#question-stem').textContent()).includes('00100100'),'Duplicate source labels resolve to distinct questions');
 await page.locator('#search').fill('C3-FB01');
 const stem=await page.locator('#question-stem').textContent();
 assert(stem.includes('(by generalizing')&&stem.includes('____[1]')&&await page.locator('[data-blank]').count()===1,'Contextual parentheses are preserved instead of becoming fake blanks');
 await page.locator('#search').fill('C5-FB12');
 assert((await page.locator('#question-stem').textContent()).includes('a(n)')&&await page.locator('[data-blank]').count()===1,'Grammatical a(n) is preserved');
 await page.locator('#search').fill('C1-FB03');
 assert(await page.locator('[data-blank]').count()===2,'Multi-blank questions provide one field per answer');
 await page.locator('[data-blank="0"]').fill('analog');await page.locator('[data-blank="1"]').fill('digital');await page.reload();
 assert(await page.locator('[data-blank="0"]').inputValue()==='analog'&&await page.locator('[data-blank="1"]').inputValue()==='digital','Typed fill answers persist across refresh');
 const before=Object.keys((await read()).answers).length;
 await page.locator('#submit').click();
 assert(await page.locator('.reference-answers li').count()===2&&Object.keys((await read()).answers).length===before,'Revealing fill reference answers does not auto-grade or inflate progress');
 await page.reload();
 assert(await page.locator('#self-correct').count()===1,'Pending fill self-assessment survives refresh');
 await page.locator('#self-wrong').click();
 const fillId=(await read()).order[0];
 assert((await read()).answers[fillId].correct===false&&(await read()).answers[fillId].given.join()==='analog,digital','Fill self-assessment records the chosen result and typed answers');
 await page.locator('#retry-current').click();
 assert(await page.locator('.reference-answers').count()===0&&await page.locator('[data-blank="0"]').inputValue()==='','Fill retry hides the reference answers and clears previous input');
 await page.locator('#submit').click();await page.locator('#self-correct').click();
 assert((await read()).answers[fillId].correct&&(await read()).answers[fillId].attempts===2,'Fill retry can be corrected');
 await page.locator('#search').fill('C5-MC01');
 assert(await page.locator('[data-choice]').count()===6,'Six-option questions render all choices');
 await page.locator('#question').focus();await page.keyboard.press('f');
 assert(await page.locator('[data-choice="F"]').getAttribute('aria-pressed')==='true','F keyboard shortcut selects the sixth option');
 await page.keyboard.press('Enter');
 assert(await page.locator('.option.correct').getAttribute('data-choice')==='C','Six-option question uses the source key');
 await page.locator('#search').fill('C2-MC02');await page.locator('[data-choice="A"]').click();await page.locator('#submit').click();
 assert(await page.locator('.option.correct').getAttribute('data-choice')==='C'&&(await page.locator('.review-note').textContent()).includes('网页按 C 判分'),'Carry/overflow question grades original C and keeps the conceptual caveat separate');
 assert(await page.locator('.option-analysis li').count()===3,'Correct and incorrect choices all receive explanations');
 await page.locator('.source-original summary').click();
 assert(/Answer\s*:\s*C/i.test(await page.locator('.original-text').textContent()),'Original source key is still available for comparison');
 await reset();
 const oldReviewKeys={'C2-MC02':'A','C3-TF15':'B','C5-MC18':'D'};
 const corrected=data.questions.filter(q=>oldReviewKeys[q.label]).map(q=>({...q,previousKey:oldReviewKeys[q.label]})),fillQ=data.questions.find(q=>q.type==='fill');
 await page.evaluate(({corrected,fillQ,key})=>{const s=JSON.parse(localStorage.getItem(key));for(const q of corrected)s.answers[q.id]={choice:q.previousKey,correct:true,attempts:3};s.answers[fillQ.id]={choice:'self',correct:true,given:['saved answer'],attempts:2};s.favorites=[corrected[0].id];s.index=s.order.indexOf(corrected[0].id);s.drafts[244]=['saved draft'];delete s.review_revision;localStorage.setItem(key,JSON.stringify(s));},{corrected,fillQ,key});
 await page.reload();
 const migrated=await read();
 assert(corrected.every(q=>migrated.answers[q.id].correct===false&&migrated.answers[q.id].choice===q.previousKey&&migrated.answers[q.id].attempts===3&&migrated.answers[q.id].regraded),'Previous editorial keys are regraded against source answers without losing choices or attempts');
 assert(migrated.favorites.includes(corrected[0].id)&&migrated.drafts[244][0]==='saved draft'&&migrated.order[migrated.index]===corrected[0].id&&migrated.answers[fillQ.id].given[0]==='saved answer','Migration preserves bookmarks, drafts, current position and fill self-assessment');
 assert(await page.locator('.regrade-note').isVisible(),'Changed grades are explained to returning users');
 await page.locator(`[data-index="${migrated.order.indexOf(corrected[0].id)}"]`).click();await page.locator('#retry-current').click();await page.locator(`[data-choice="${corrected[0].answer}"]`).click();await page.locator('#submit').click();
 assert((await read()).answers[corrected[0].id].correct&&await page.locator('.regrade-note').count()===0,'New attempt uses source answer and clears old regrade notice');
 await reset();
 for(const q of data.questions){
  if(q.type==='fill'){
   await page.locator('#submit').click();
   const shown=await page.locator('.reference-answers li').allTextContents();
   if(shown.join('\n')!==q.answers.join('\n'))throw new Error(`Reference mismatch ${q.label}`);
   await page.locator('#self-correct').click();
  } else {
   await page.locator(`[data-choice="${q.answer}"]`).click();await page.locator('#submit').click();
   if(await page.locator('.option.correct').getAttribute('data-choice')!==q.answer)throw new Error(`Grading mismatch ${q.label}`);
  }
  if(await page.locator('.answer-reason').textContent()!==q.explanation)throw new Error(`Explanation mismatch ${q.label}`);
  if(q.type!=='fill'){
   const notes=await page.locator('.option-analysis li').allTextContents();
   if(notes.length!==q.options.length||notes.some((t,i)=>!t.endsWith(q.option_explanations[i])))throw new Error(`Option explanation mismatch ${q.label}`);
  }
  if(q.id<data.questions.length)await page.locator('#submit').click();
 }
 assert(Object.keys((await read()).answers).length===244&&Object.values((await read()).answers).every(a=>a.correct),'Every one of the 244 questions completes and grades correctly');
 assert(true,'All 244 explanations and all 458 option explanations render with the authored text');
 assert(await page.locator('#coverage').textContent()==='100'&&await page.locator('#correct-stat').textContent()==='244','Full completion shows 244 answers and 100 percent coverage');
 await page.locator('#submit').click();
 assert(await page.locator('#summary-dialog').isVisible()&&(await page.locator('.summary-number').textContent()).includes('244'),'End-of-round summary uses all 244 questions');
 await page.locator('#summary-next').click();
 assert((await read()).retry.length===244&&(await read()).revealed.length===0,'Restart hides all answers, including fill references');
 await page.locator('#reset').click();await page.locator('[data-close="reset-dialog"]').click();
 assert(Object.keys((await read()).answers).length===244,'Cancel reset preserves progress');
 await page.locator('#reset').click();await page.locator('#confirm-reset').click();
 assert(Object.keys((await read()).answers).length===0,'Confirmed reset clears CPS progress');
 await page.locator('#help').click();assert(await page.locator('#help-dialog').isVisible(),'Help dialog is usable');await page.keyboard.press('Escape');
 for(const width of [1440,1024,768,390,375,320]){
  await page.setViewportSize({width,height:950});
  for(const label of ['C1-TF01','C5-MC01','C1-FB03','C5-MC20']){
   await page.locator('#search').fill(label);
   const q=data.questions.find(q=>q.label===label);
   if(q.type==='fill'){await page.locator('#submit').click();await page.locator('#self-correct').click();}else {await page.locator(`[data-choice="${q.answer}"]`).click();await page.locator('#submit').click();}
   assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),`${label} fits ${width}px width`);
   await page.locator('#retry-current').count()&&await page.locator('#retry-current').click();
  }
 }
 await reset();await page.setViewportSize({width:1440,height:1050});await page.locator('[data-bank="mc"]').click();await page.locator('#chapter-select').selectOption('4');
 await page.locator('#search').fill('C5-MC20');await page.locator('[data-choice="B"]').click();await page.locator('#submit').click();
 await page.evaluate(()=>{document.activeElement.blur();window.scrollTo(0,0);});await page.screenshot({path:'output/playwright/desktop.png',fullPage:true,animations:'disabled'});
 await page.setViewportSize({width:390,height:844});await page.locator('[data-bank="fill"]').click();await page.locator('#chapter-select').selectOption('0');await page.locator('#search').fill('C1-FB03');
 await page.locator('[data-blank="0"]').fill('analog');await page.locator('[data-blank="1"]').fill('digital');await page.locator('#submit').click();
 await page.evaluate(()=>{document.activeElement.blur();window.scrollTo(0,0);});await page.screenshot({path:'output/playwright/mobile-fill.png',fullPage:true,animations:'disabled'});
 const blocked=await page.context().newPage();await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage denied for test');}}));await blocked.goto(page.url());
 assert(await blocked.locator('#storage-warning').isVisible(),'Unavailable local storage displays a warning');await blocked.locator('[data-choice="B"]').click();await blocked.locator('#submit').click();assert(await blocked.locator('.option.correct').count()===1,'Choice practice works when local storage is unavailable');await blocked.close();
 assert(errors.length===0,'No JavaScript errors during all checks');
 await reset();
 return {passed:checks.length,checks,errors};
}
