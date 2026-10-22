// Presentation state is additive; course-specific answer storage stays unchanged.
state.translated=Array.isArray(state.translated)?[...new Set(state.translated.filter(id=>questions.some(q=>q.id===id)))]:[];
function optionContent(q,text,i){const identical=q.zh.options[i].trim()===text.trim();return `<span lang="en">${format(text)}</span><span class="option-translation" data-zh-option="${i}" data-translation-identical="${identical}" lang="zh-CN" ${state.translated.includes(q.id)&&!identical?'':'hidden'}>${format(q.zh.options[i])}</span>`;}
function translationMarkup(q){return `<details id="question-translation" class="translation-panel" ${state.translated.includes(q.id)?'open':''}><summary><span class="translation-label">${state.translated.includes(q.id)?'收起中文释义':'查看中文释义'}</span><small>题干${q.options.length?'与选项':''}</small></summary><div class="translation-body" lang="zh-CN"><p class="translation-stem">${format(q.zh.text)}</p></div></details>`;}
function bindTranslation(q){
 const panel=$('question-translation');if(!panel)return;
 const sync=()=>{if(!panel.isConnected)return;document.querySelectorAll('[data-zh-option]').forEach(el=>el.hidden=!panel.open||el.dataset.translationIdentical==='true');const wasOpen=state.translated.includes(q.id);if(panel.open!==wasOpen){state.translated=panel.open?[...state.translated,q.id]:state.translated.filter(id=>id!==q.id);save();}panel.querySelector('.translation-label').textContent=panel.open?'收起中文释义':'查看中文释义';};
 panel.querySelector('summary').onclick=e=>{e.preventDefault();panel.open=!panel.open;sync();};
 panel.ontoggle=sync;
}
function coverageText(n,total){const percent=100*n/total;return percent>0&&percent<1?percent.toFixed(1):String(Math.round(percent));}
const courseSwitch=$('course-switch'),courseTrigger=$('course-trigger');
courseSwitch.addEventListener('toggle',()=>courseTrigger.setAttribute('aria-expanded',String(courseSwitch.open)));
courseSwitch.addEventListener('keydown',e=>{const entries=[...courseSwitch.querySelectorAll('a')];if(e.key==='Escape'){e.preventDefault();e.stopPropagation();courseSwitch.open=false;courseTrigger.focus();}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();courseSwitch.open=true;const index=entries.indexOf(document.activeElement),delta=e.key==='ArrowDown'?1:-1;entries[index<0?(delta>0?0:entries.length-1):(index+delta+entries.length)%entries.length].focus();}else if(courseSwitch.open&&(e.key==='Home'||e.key==='End')){e.preventDefault();entries[e.key==='Home'?0:entries.length-1].focus();}});
document.addEventListener('click',e=>{if(!courseSwitch.contains(e.target))courseSwitch.open=false;});
courseSwitch.addEventListener('focusout',()=>requestAnimationFrame(()=>{if(!courseSwitch.contains(document.activeElement))courseSwitch.open=false;}));
courseSwitch.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{save();}));
