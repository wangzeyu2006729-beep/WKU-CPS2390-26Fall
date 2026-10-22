async page => {
 const ctx=await page.context().browser().newContext(),checks=[],errors=[];
 const assert=(ok,name)=>{if(!ok)throw new Error(name);checks.push(name);};
 try {
  const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(page.url());
  const data=JSON.parse(await p.locator('#quiz-data').textContent());
  assert(data.course.review_revision==='2026-10-22.2-source'&&data.course.answer_basis==='source','Deployed page uses the original TestBank answer policy');
  assert(data.questions.length===244&&data.questions.every(q=>q.explanation&&q.references),'All 244 deployed questions have reasoning and references');
  assert(data.questions.reduce((n,q)=>n+(q.option_explanations?.length||0),0)===458,'All 458 option explanations are embedded');
  for(const [label,source,correct] of [['C2-MC02','C','C'],['C3-TF15','A','A'],['C5-MC18','B','B']]){
   await p.locator('#search').fill(label);await p.locator(`[data-choice="${source}"]`).click();await p.locator('#submit').click();
   assert(await p.locator('.option.correct').getAttribute('data-choice')===correct&&await p.locator('.option.incorrect').count()===0,`${label}: original TestBank answer accepted`);
   assert(await p.locator('.review-note').isVisible()&&await p.locator('.option-analysis li').count()===data.questions.find(q=>q.label===label).options.length,`${label}: source caveat and every option explained`);
  }
  await p.locator('#search').fill('C5-MC20');
  assert((await p.locator('#question-stem').textContent()).includes('0000100111111000'),'Original loop keeps BRn #-8');
  await p.locator('[data-choice="B"]').click();await p.locator('#submit').click();
  assert((await p.locator('.review-note').textContent()).includes('x0009'),'Original-loop counterexample is disclosed');
  await p.locator('.source-original summary').click();
  assert((await p.locator('.original-text').textContent()).includes('0000100111111000'),'Original BRn #-8 preserved in source disclosure');
  await p.locator('#search').fill('C1-FB03');await p.locator('#submit').click();
  assert((await p.locator('.answer-reason').textContent()).includes('连续物理量')&&await p.locator('.reference-answers li').count()===2,'Fill question shows both reference answers and conceptual explanation');
  await p.evaluate(({data})=>{
   const key='cps2390-testbank-v1',q=data.questions.find(q=>q.label==='C2-MC02'),s=JSON.parse(localStorage.getItem(key));
   s.answers[q.id]={choice:'C',correct:false,attempts:7};s.query='';s.mode='all';s.bank='all';s.chapter='all';s.order=data.questions.map(q=>q.id);s.index=q.id-1;delete s.review_revision;
   localStorage.setItem(key,JSON.stringify(s));localStorage.setItem('math3700-practice-v1','{"sentinel":"preserve"}');
  },{data});await p.reload();
  const migrated=await p.evaluate(()=>JSON.parse(localStorage.getItem('cps2390-testbank-v1'))),q=data.questions.find(q=>q.label==='C2-MC02');
  assert(migrated.answers[q.id].correct&&migrated.answers[q.id].choice==='C'&&migrated.answers[q.id].attempts===7&&migrated.answers[q.id].previous_correct===false,'Original C is restored as matching the source while retaining seven attempts');
  assert(await p.locator('.regrade-note').isVisible(),'Returning user sees why a cached grade now follows the source');
  await p.locator('#reset').click();await p.locator('#confirm-reset').click();
  assert(await p.evaluate(()=>localStorage.getItem('math3700-practice-v1'))==='{"sentinel":"preserve"}','CPS review and reset leave MATH storage intact');
  assert(errors.length===0,'No browser runtime errors');
  return {passed:checks.length,checks,errors,url:page.url(),revision:data.course.review_revision};
 } finally {await ctx.close();}
}
