async page => {
 const browser=page.context().browser(),contexts=[],checks=[],requests=[];
 const assert=(ok,name)=>{if(!ok)throw new Error(name);checks.push(name);};
 const read=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('cps2390-testbank-v1')));
 const root=new URL(page.url()).origin;
 try {
  const ca=await browser.newContext(),cb=await browser.newContext();contexts.push(ca,cb);
  const a=await ca.newPage(),b=await cb.newPage();
  for(const p of [a,b])p.on('request',r=>requests.push({method:r.method(),url:r.url()}));
  await Promise.all([a.goto(page.url()),b.goto(page.url())]);
  assert(Object.keys((await read(a)).answers).length===0&&Object.keys((await read(b)).answers).length===0,'Two independent browser profiles start empty');
  await a.locator('[data-choice="B"]').click();await a.locator('#submit').click();await a.locator('#bookmark').click();
  assert((await read(a)).answers[1].correct&&!Object.keys((await read(b)).answers).length,'Answers and bookmarks are isolated between browsers');
  await b.locator('[data-choice="A"]').click();await b.locator('#submit').click();
  assert(!(await read(b)).answers[1].correct&&await a.locator('#wrong-count').textContent()==='0','Wrong books are isolated');
  await a.locator('#search').fill('C1-FB03');await a.locator('[data-blank="0"]').fill('analog');await a.locator('#submit').click();
  assert((await read(a)).revealed.length===1&&(await read(b)).revealed.length===0,'Fill drafts and reveals are isolated');
  await a.reload();assert((await read(a)).revealed.length===1,'Fill reveal state persists');
  await a.locator('#reset').click();await a.locator('#confirm-reset').click();await b.reload();
  assert(Object.keys((await read(a)).answers).length===0&&Object.keys((await read(b)).answers).length===1,'Resetting one browser leaves another browser untouched');
  assert(requests.every(r=>r.method==='GET'&&new URL(r.url).origin===root),'No answer upload or third-party request occurs');
  if(root.startsWith('http://127.0.0.1:')){
   const shared=await browser.newContext();contexts.push(shared);
   const mathUrl='https://wangzeyu2006729-beep.github.io/WKU-MATH3700-26Fall/';
   const cpsUrl='https://wangzeyu2006729-beep.github.io/WKU-CPS2390-26Fall/';
   await shared.route(mathUrl,async route=>route.fulfill({response:await route.fetch({url:root+'/tmp/math-index.html'})}));
   await shared.route(cpsUrl,async route=>route.fulfill({response:await route.fetch({url:root+'/index.html'})}));
   const c=await shared.newPage();await c.goto(mathUrl);
   await c.locator('[data-choice="D"]').click();await c.locator('#submit').click();await c.locator('#bookmark').click();
   const original=await c.evaluate(()=>localStorage.getItem('math3700-practice-v1'));
   await c.locator('#course-trigger').click();await c.locator('[data-course="cps"]').click();await c.waitForURL(cpsUrl);
   assert(await c.locator('#course-switch').getAttribute('data-current-course')==='cps'&&Object.keys((await read(c)).answers).length===0,'Course selector opens CPS2390 with fresh independent progress');
   assert(await c.evaluate(()=>localStorage.getItem('math3700-practice-v1'))===original,'Entering CPS2390 leaves MATH3700 data byte-for-byte intact');
   await c.locator('[data-choice="A"]').click();await c.locator('#submit').click();await c.locator('#bookmark').click();
   const cps=await c.evaluate(()=>localStorage.getItem('cps2390-testbank-v1'));
   await c.locator('#course-trigger').click();await c.locator('[data-course="math"]').click();await c.waitForURL(mathUrl);
   assert((await c.locator('.question-id').textContent()).includes('Q01')&&await c.locator('.option.correct').getAttribute('data-choice')==='D','Switching back restores the original MATH3700 answer');
   assert(await c.evaluate(()=>localStorage.getItem('cps2390-testbank-v1'))===cps,'Switching back retains CPS2390 records');
   await c.locator('#course-trigger').click();await c.locator('[data-course="cps"]').click();await c.waitForURL(cpsUrl);await c.locator('#reset').click();await c.locator('#confirm-reset').click();
   const mathAfter=JSON.parse(await c.evaluate(()=>localStorage.getItem('math3700-practice-v1')));
   assert(mathAfter.answers[1].correct&&mathAfter.favorites.includes(1),'Clearing CPS2390 does not clear MATH3700 answers or bookmarks');
  }
  return {passed:checks.length,checks,url:page.url()};
 } finally {await Promise.all(contexts.map(c=>c.close()));}
}
