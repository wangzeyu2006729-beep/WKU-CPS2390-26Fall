async page => {
 const ctx=await page.context().browser().newContext(),checks=[],errors=[];
 const assert=(ok,name)=>{if(!ok)throw new Error(name);checks.push(name);};
 const math='https://wangzeyu2006729-beep.github.io/WKU-MATH3700-26Fall/',cps='https://wangzeyu2006729-beep.github.io/WKU-CPS2390-26Fall/',ds='https://wangzeyu2006729-beep.github.io/WKU-CPS2232-26Fall/';
 const switchTo=async(p,id,url)=>{await p.locator('#course-trigger').click();await p.locator(`[data-course="${id}"]`).click();await p.waitForURL(url);};
 try{
  const origin=new URL(page.url()).origin;
  if(origin.startsWith('http://127.0.0.1:')){
   await ctx.route(math,async route=>route.fulfill({response:await route.fetch({url:origin+'/tmp/math-index.html'})}));
   await ctx.route(cps,async route=>route.fulfill({response:await route.fetch({url:origin+'/index.html'})}));
   await ctx.route(ds,async route=>route.fulfill({response:await route.fetch({url:origin+'/tmp/ds-index.html'})}));
  }
  const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(math);
  const m=JSON.parse(await p.locator('#quiz-data').textContent());
  assert(m.course.ui_version==='2026-10-22.zh1'&&m.questions.length===140,'MATH3700 loads the current interface and all 140 questions');
  await p.locator('#question-translation>summary').click();
  assert(await p.locator('[data-zh-option]:visible').count()===4&&await p.locator('.explanation').count()===0,'Chinese choices appear inside English answer buttons without revealing grading');
  await p.locator('[data-choice="D"] [data-zh-option]').click();await p.locator('#submit').click();await p.locator('#bookmark').click();
  assert(await p.locator('.option.correct').getAttribute('data-choice')==='D','Clicking the Chinese text selects the original English choice');
  const mathState=await p.evaluate(()=>localStorage.getItem('math3700-practice-v1'));
  await switchTo(p,'cps',cps);
  const c=JSON.parse(await p.locator('#quiz-data').textContent());
  assert(c.course.ui_version==='2026-10-22.zh1'&&c.course.answer_basis==='source'&&c.questions.length===244,'CPS2390 loads all 244 original-source questions with the new interface');
  assert(await p.evaluate(()=>localStorage.getItem('math3700-practice-v1'))===mathState,'Entering CPS2390 preserves MATH progress byte-for-byte');
  await p.locator('#question-translation>summary').click();assert(await p.locator('[data-zh-option]:visible').count()===2,'True/false choices have visible Chinese meanings');
  await p.locator('[data-choice="B"] [data-zh-option]').click();await p.locator('#submit').click();
  assert(await p.locator('.option.correct').getAttribute('data-choice')==='B','Chinese-assisted CPS practice still uses the source answer');
  await p.locator('#search').fill('C1-FB03');await p.locator('#question-translation>summary').click();
  assert((await p.locator('.translation-stem').textContent()).includes('____[1]')&&(await p.locator('.translation-stem').textContent()).includes('____[2]')&&await p.locator('.reference-answers').count()===0,'Fill translation keeps both blanks without exposing the answers');
  await p.locator('[data-blank="0"]').fill('analog');await p.locator('[data-blank="1"]').fill('digital');await p.locator('#submit').click();await p.locator('#self-correct').click();
  const cpsState=await p.evaluate(()=>localStorage.getItem('cps2390-testbank-v1'));
  await switchTo(p,'math',math);
  assert(await p.locator('.option.correct').getAttribute('data-choice')==='D'&&await p.locator('#question-translation').evaluate(e=>e.open),'Returning to MATH restores its answer and expanded meaning');
  assert(await p.evaluate(()=>localStorage.getItem('cps2390-testbank-v1'))===cpsState,'Returning to MATH preserves CPS state byte-for-byte');
  await p.locator('#search').fill('Q13');await p.locator('#question-translation>summary').click();
  assert(await p.locator('[data-zh-option]:visible').count()===0&&await p.locator('[data-choice]').count()===4,'Identical numerical choices are shown once instead of duplicated');
  await switchTo(p,'cps',cps);
  assert(await p.locator('#correct-stat').textContent()==='2'&&(await p.locator('.question-id').textContent()).includes('C1-FB03')&&await p.locator('#question-translation').evaluate(e=>e.open),'Returning to CPS restores fill position, self-grade and expanded meaning');
  const mathBeforeReset=await p.evaluate(()=>localStorage.getItem('math3700-practice-v1'));
  await p.locator('#reset').click();await p.locator('#confirm-reset').click();
  assert(await p.evaluate(()=>localStorage.getItem('math3700-practice-v1'))===mathBeforeReset&&!(await p.locator('#question-translation').evaluate(e=>e.open)),'CPS reset clears its own translation state without touching MATH');
  const cpsAfterReset=await p.evaluate(()=>localStorage.getItem('cps2390-testbank-v1'));
  await switchTo(p,'ds',ds);
  const d=JSON.parse(await p.locator('#quiz-data').textContent());
  assert(d.course.code==='CPS2232'&&d.questions.length===193&&Object.keys(d.papers).length===2,'CPS2232 loads all 193 questions and both past papers');
  await p.locator('#paper-select').selectOption('M24');
  assert((await p.locator('.question-id').textContent()).includes('24春期中 第 1 题'),'Past-paper filter starts at original question 1');
  await p.locator('[data-choice="B"]').click();await p.locator('#submit').click();
  assert(await p.locator('.option.correct').getAttribute('data-choice')==='B','CPS2232 grades the past-paper answer');
  assert(await p.evaluate(()=>localStorage.getItem('math3700-practice-v1'))===mathBeforeReset&&await p.evaluate(()=>localStorage.getItem('cps2390-testbank-v1'))===cpsAfterReset,'CPS2232 practice leaves MATH and CPS2390 records untouched');
  const dsState=await p.evaluate(()=>localStorage.getItem('cps2232-practice-v1'));
  await switchTo(p,'cps',cps);
  assert(await p.evaluate(()=>localStorage.getItem('cps2232-practice-v1'))===dsState,'Returning to CPS2390 preserves CPS2232 state byte-for-byte');
  await p.setViewportSize({width:320,height:850});await p.locator('#course-trigger').click();const bounds=await p.locator('.course-panel').boundingBox();
  assert(bounds.x>=0&&bounds.x+bounds.width<=321&&!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'Course panel fits a 320px phone viewport');
  assert(errors.length===0,'No runtime errors during the three-course learning flow');
  return {passed:checks.length,checks,errors,mode:origin.startsWith('http://127.0.0.1:')?'local bridge':'public pages'};
 }finally{await ctx.close();}
}
