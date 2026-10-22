async page => {
 const ctx=await page.context().browser().newContext(),checks=[],errors=[];
 const assert=(ok,name)=>{if(!ok)throw new Error(name);checks.push(name);};
 const plain=s=>s.replace(/\[\[([^\]]+)\]\]/g,(_,cells)=>cells.split(/[;,]/).join(''));
 try{
  const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(page.url());
  const data=JSON.parse(await p.locator('#quiz-data').textContent()),cps=data.course.code==='CPS2390',key=data.course.storage_key,id=cps?'cps':'math';
  const read=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  await p.evaluate(({key,data})=>{const s=JSON.parse(localStorage.getItem(key));s.answers={1:{choice:data.questions[0].answer,correct:true,attempts:3}};s.favorites=[1];s.drafts={2:'B'};s.index=4;delete s.translated;localStorage.setItem(key,JSON.stringify(s));},{key,data});await p.reload();
  assert((await read()).answers[1].attempts===3&&(await read()).favorites.includes(1)&&(await read()).drafts[2]==='B'&&(await read()).order[(await read()).index]===5,'Existing answers, favorites, drafts and position survive the UI upgrade');
  assert(await p.locator('#course-switch').getAttribute('data-current-course')===id&&await p.locator('#course-select').count()===0,'Current course is identified without a native course select');
  assert(await p.locator('.course-entry').count()===3&&await p.locator('.course-entry[aria-current="page"]').getAttribute('data-course')===id,'Course panel lists the three real courses and an accessible current-course marker');
  await p.locator('#course-trigger').click();await p.waitForFunction(()=>document.getElementById('course-trigger').getAttribute('aria-expanded')==='true');
  assert(await p.locator('.course-panel').isVisible(),'Course panel opens with consistent inline styling');
  await p.keyboard.press('ArrowDown');assert(await p.locator('[data-course="math"]').evaluate(e=>e===document.activeElement),'Down arrow focuses first course');
  await p.keyboard.press('ArrowDown');assert(await p.locator('[data-course="cps"]').evaluate(e=>e===document.activeElement),'Down arrow moves to next course');
  const oldIndex=(await read()).index;await p.keyboard.press('a');await p.keyboard.press('ArrowRight');
  assert((await read()).index===oldIndex&&!(await read()).drafts[5],'Quiz shortcuts do not fire while browsing courses');
  await p.keyboard.press('Escape');assert(!(await p.locator('#course-switch').evaluate(e=>e.open))&&await p.locator('#course-trigger').evaluate(e=>e===document.activeElement),'Escape closes course panel and restores focus');
  await p.locator('#course-trigger').click();await p.locator('.study-name').click();assert(!(await p.locator('#course-switch').evaluate(e=>e.open)),'Outside click dismisses the course panel');
  assert(!(await p.locator('#question-translation').evaluate(e=>e.open)),'Chinese meaning starts collapsed for an untouched question');
  await p.locator('#question-translation>summary').click();await p.waitForFunction(()=>document.getElementById('question-translation').open);
  assert(await p.locator('.translation-stem').textContent()===plain(data.questions[4].zh.text)&&await p.locator('.explanation').count()===0,'Chinese meaning opens without revealing the answer');
  await p.locator('#bookmark').click();await p.reload();assert(await p.locator('#question-translation').evaluate(e=>e.open),'Translation remains open through bookmark changes and refresh');
  const before=Object.keys((await read()).answers).length;
  for(const q of data.questions){
   await p.locator('#search').fill(q.label);
   if(!(await p.locator('#question-translation').evaluate(e=>e.open)))await p.locator('#question-translation>summary').click();
   if(await p.locator('.translation-stem').textContent()!==plain(q.zh.text))throw new Error(`Chinese stem mismatch ${q.label}`);
   const opts=await p.locator('[data-zh-option]').allTextContents();
   if(opts.length!==q.options.length||opts.some((v,i)=>v!==plain(q.zh.options[i])))throw new Error(`Chinese option mismatch ${q.label}`);
   if(await p.locator('#question-stem').textContent()!==plain(q.text))throw new Error(`English source changed ${q.label}`);
  }
  assert(true,`All ${data.questions.length} Chinese stems and ${data.questions.reduce((n,q)=>n+q.options.length,0)} option translations render correctly alongside unchanged English`);
  assert(Object.keys((await read()).answers).length===before,'Opening translations never submits or changes grades');
  await p.reload();assert(await p.locator('#question-translation').evaluate(e=>e.open),'Per-question translation state persists after refresh');
  await p.locator('#question-translation>summary').click();await p.waitForFunction(()=>!document.getElementById('question-translation').open);await p.reload();assert(!(await p.locator('#question-translation').evaluate(e=>e.open)),'Explicitly collapsed meaning stays collapsed');
  await p.locator('#search').fill(cps?'晶体管':'梯度');assert((await read()).order.length>0,'Search finds questions using Chinese meaning');
  assert(await p.locator('#coverage').textContent()===(cps?'0.4':'0.7'),'First completed question shows a visible fractional percentage');
  for(const width of [1440,768,390,320]){
   await p.setViewportSize({width,height:900});await p.locator('#search').fill(cps?'C5-MC20':'V23');
   if(!(await p.locator('#question-translation').evaluate(e=>e.open)))await p.locator('#question-translation>summary').click();
   await p.locator('#course-trigger').click();
   const box=await p.locator('.course-panel').boundingBox();
   assert(box.x>=0&&box.x+box.width<=width+1&&!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),`Open course panel and long translation fit ${width}px`);
   await p.keyboard.press('Escape');
  }
  await p.setViewportSize({width:1280,height:1000});await p.locator('#search').fill(cps?'C2-MC02':'Q13');
  if(!(await p.locator('#question-translation').evaluate(e=>e.open)))await p.locator('#question-translation>summary').click();
  await p.locator('#course-trigger').click();await p.evaluate(()=>window.scrollTo(0,0));
  await p.screenshot({path:`output/playwright/${id}-course-panel.png`,fullPage:true,animations:'disabled'});
  await p.keyboard.press('Escape');await p.setViewportSize({width:390,height:900});await p.evaluate(()=>window.scrollTo(0,0));
  await p.screenshot({path:`output/playwright/${id}-translation-mobile.png`,fullPage:true,animations:'disabled'});
  assert(errors.length===0,'No runtime errors during navigation and translation checks');
  return {course:data.course.code,passed:checks.length,checks,errors};
 }finally{await ctx.close();}
}
