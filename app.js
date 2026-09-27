'use strict';
// MealMate browser demo: data and passwords stay in this browser only.
const STORAGE_KEY = 'mealmate-demo-v2';
const SESSION_KEY = 'mealmate-session-v2';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const setText = (selector, value) => { const node=$(selector); if(node)node.textContent=String(value ?? ''); };
const id = () => crypto.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const inDays = n => { const d=new Date();d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const shortDate = date => new Date(`${date}T12:00:00`).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
const money = n => `৳${Number(n||0).toLocaleString('en-BD',{maximumFractionDigits:2})}`;
const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const defaultPrices=()=>({breakfast:60,lunch:120,dinner:70,locked:true});
const categoryNames={food:'Food & grocery',electricity:'Electricity / current bill',wifi:'Wi-Fi bill',other:'Other expenses'};
const newPlanner=()=>days.map(day=>({day,breakfast:'Bread & eggs',lunch:'Rice, dal & vegetables',dinner:'Chicken curry & rice'}));

function sampleMess(){
 const month=today().slice(0,7);
 const users=[
  {id:'u-admin',name:'Amina Rahman',email:'admin@mealmate.demo',password:'Admin123!',role:'admin',status:'active'},
  {id:'u-shahid',name:'Shahid Rahman',email:'user@mealmate.demo',password:'Member123!',role:'user',status:'active'},
  {id:'u-shumi',name:'Sumaya Akter',email:'sumaya@mealmate.demo',password:'Member123!',role:'user',status:'active'},
  {id:'u-toufiq',name:'Toufiq Alam',email:'toufiq@mealmate.demo',password:'Member123!',role:'user',status:'active'}
 ];
 const meals=[];
 for(let d=1;d<=Math.min(new Date().getDate(),24);d++){
  for(const [i,u] of users.entries())meals.push({id:id(),userId:u.id,date:`${month}-${String(d).padStart(2,'0')}`,breakfast:(d+i)%3?1:0,lunch:1,dinner:(d+i)%7?1:0});
 }
 const purchase=[['u-admin',2,'Weekly vegetable market',2850,'food','approved'],['u-shahid',6,'Rice, lentils & oil',4200,'food','approved'],['u-shumi',10,'Fish and spices',2560,'food','approved'],['u-toufiq',16,'Household cleaning supplies',680,'other','approved'],['u-admin',19,'Chicken and vegetables',3030,'food','approved'],['u-shahid',22,'Fresh fruit and eggs',740,'food','pending']];
 return {id:'m-demo',messName:'Green House Mess',inviteCode:'MEAL-2026',users,meals,mealPricing:{[month]:defaultPrices()},
  expenses:purchase.map(([userId,day,description,amount,category,status])=>({id:id(),userId,date:`${month}-${String(day).padStart(2,'0')}`,description,amount,category,status})),
  deposits:[['u-admin',2,4000],['u-shahid',3,3500],['u-shumi',4,3700],['u-toufiq',5,3300]].map(([userId,day,amount])=>({id:id(),userId,date:`${month}-${String(day).padStart(2,'0')}`,amount,method:'Cash',status:'approved'})),
  groceries:[['Rice','5 kg',false],['Eggs','24 pcs',false],['Cooking oil','2 L',true],['Fresh vegetables','3 kg',false]].map(([item,quantity,bought])=>({id:id(),item,quantity,bought,status:'approved',addedBy:'u-admin'})),
  duties:[{id:id(),userId:'u-shahid',date:today(),task:'Vegetable market',done:false},{id:id(),userId:'u-shumi',date:inDays(1),task:'Rice and groceries',done:false},{id:id(),userId:'u-toufiq',date:inDays(2),task:'Fish market',done:false}],planner:newPlanner()};
}
function load(){
 try{
  const raw=localStorage.getItem(STORAGE_KEY);
  if(raw){const data=JSON.parse(raw);if(Array.isArray(data.messes))return data;
   if(data.users&&data.meals&&data.planner){data.id=data.id||'m-demo';return {messes:[data]};}}
 }catch(_){/* Damaged demo data is replaced with a fresh sample. */}
 return {messes:[sampleMess()]};
}
let root=load();
let session=sessionStorage.getItem(SESSION_KEY)||'';
let mess=root.messes.find(m=>m.users.some(u=>u.id===session))||root.messes[0];
let page='dashboard',selectedMonth=today().slice(0,7),editingMealId='',toastTimer;
const user=()=>mess.users.find(u=>u.id===session&&u.status==='active');
const admin=()=>user()?.role==='admin';
const memberName=userId=>mess.users.find(u=>u.id===userId)?.name||'Former member';
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(root));render()}
function notify(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3300)}
function generatedInvite(){
 const alphabet='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';let code;
 do{const bytes=new Uint8Array(8);crypto.getRandomValues(bytes);code='MM-'+[...bytes].map(v=>alphabet[v%alphabet.length]).join('')}
 while(root.messes.some(m=>m.inviteCode===code));
 return code;
}
function totals(month=selectedMonth){
 const meals=mess.meals.filter(x=>x.date.startsWith(month));
 const food=mess.expenses.filter(x=>x.status==='approved'&&x.category==='food'&&x.date.startsWith(month));
 const other=mess.expenses.filter(x=>x.status==='approved'&&x.category!=='food'&&x.date.startsWith(month));
 const deposits=mess.deposits.filter(x=>x.status==='approved'&&x.date.startsWith(month));
 const prices=pricesFor(month);
 const mealCost=x=>['breakfast','lunch','dinner'].reduce((sum,k)=>sum+Number(x[k]||0)*prices[k],0);
 const totalMeals=meals.reduce((n,x)=>n+Number(x.breakfast||0)+Number(x.lunch||0)+Number(x.dinner||0),0);
 const mealBill=meals.reduce((n,x)=>n+mealCost(x),0);
 const foodCost=food.reduce((n,x)=>n+Number(x.amount),0);
 const rate=totalMeals?mealBill/totalMeals:0;
 const rows=mess.users.map(u=>{
  const ownMeals=meals.filter(x=>x.userId===u.id);
  const count=ownMeals.reduce((n,x)=>n+Number(x.breakfast||0)+Number(x.lunch||0)+Number(x.dinner||0),0);
  const paid=deposits.filter(x=>x.userId===u.id).reduce((n,x)=>n+Number(x.amount),0);
  const bill=ownMeals.reduce((n,x)=>n+mealCost(x),0);return {u,count,paid,bill,balance:paid-bill};
 });
 const paid=deposits.reduce((n,x)=>n+Number(x.amount),0);
 return {totalMeals,mealBill,remaining:paid-mealBill,prices,mealCost,foodCost,otherCost:other.reduce((n,x)=>n+Number(x.amount),0),paid,rate,rows};
}
function pricesFor(month){return {...defaultPrices(),...mess.mealPricing?.[month]}}

// DOM helpers: the page and forms live in index.html; JavaScript adds only data rows.
function node(tag,text='',className=''){const el=document.createElement(tag);el.textContent=String(text);if(className)el.className=className;return el}
function clear(el){el.replaceChildren()}
function td(row,value){const cell=node('td');if(value instanceof Node)cell.append(value);else cell.textContent=String(value??'');row.append(cell);return cell}
function person(userId){const u=mess.users.find(x=>x.id===userId),wrap=node('span','','person');wrap.append(avatar(u));wrap.append(node('strong',u?.name||'Former member'));return wrap}
function avatar(u){const el=node('span','','avatar');if(u?.photo){const img=document.createElement('img');img.src=u.photo;img.alt=`${u.name} profile photo`;el.append(img)}else el.textContent=u?.name.split(/\s+/).map(p=>p[0]).slice(0,2).join('').toUpperCase()||'?';return el}
function putAvatar(el,u){el.replaceChildren(...avatar(u).childNodes);if(!u?.photo)el.textContent=avatar(u).textContent}
function status(text){const el=node('span',text[0].toUpperCase()+text.slice(1),`pill ${text}`);return el}
function action(label,type,recordId,style='btn-light'){const b=node('button',label,`btn btn-small ${style}`);b.type='button';b.dataset.action=type;b.dataset.id=recordId;return b}
function actionCell(row,buttons){const c=td(row,''),wrap=node('div','','actions');buttons.forEach(b=>wrap.append(b));c.append(wrap)}
function noRows(body,cols,label='No records for this month.'){if(body.children.length)return;const tr=node('tr'),cell=td(tr,label);cell.colSpan=cols;cell.className='muted';body.append(tr)}
function setStat(i,label,value,hint){setText(`#dash-label-${i}`,label);setText(`#dash-value-${i}`,value);setText(`#dash-hint-${i}`,hint)}
function showTab(mode){
 const headings={login:['Good to see you again.','Sign in to your Admin or Member account.'],admin:['Create your mess.','Create an Admin account. Your invite code will appear automatically.'],member:['Join your mess.','Create a Member account with your Admin’s invite code.']};
 setText('#auth-heading',headings[mode][0]);setText('#auth-description',headings[mode][1]);
 $$('[data-auth-tab]').forEach(btn=>{const on=btn.dataset.authTab===mode;btn.classList.toggle('active',on);btn.setAttribute('aria-selected',on)});
 for(const key of ['login','admin','member'])$(`#${key}-form`).hidden=key!==mode;
}
function showPage(next){if(next==='members'&&!admin())next='dashboard';page=next;$$('.page').forEach(section=>section.hidden=section.id!==`page-${page}`);$$('[data-nav]').forEach(btn=>btn.classList.toggle('active',btn.dataset.nav===page));$('#sidebar').classList.remove('open');$('#mobile-overlay').classList.remove('open');renderPage()}
function login(m,u){mess=m;session=u.id;sessionStorage.setItem(SESSION_KEY,session);page='dashboard';render();notify(`Welcome, ${u.name.split(' ')[0]}!`)}
function render(){
 mess=root.messes.find(m=>m.users.some(u=>u.id===session))||root.messes[0];
 if(session&&!user()){session='';sessionStorage.removeItem(SESSION_KEY)}
 $('#auth-view').hidden=!!user();$('#app-view').hidden=!user();
 if(!user()){showTab('login');return}
 const u=user();setText('#sidebar-mess',mess.messName);setText('#sidebar-code',admin()?`Invite code: ${mess.inviteCode}`:'Your shared home');setText('#sidebar-name',u.name);setText('#sidebar-role',admin()?'Mess admin':'Mess member');setText('#top-mess',mess.messName);setText('#top-role',admin()?'✦ Admin account':'● Member account');setText('#top-date',new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'}));
 for(const sel of ['#sidebar-avatar','#top-avatar'])putAvatar($(sel),u);
 $$('.admin-only').forEach(el=>el.hidden=!admin());
 $$('[data-month]').forEach(input=>input.value=selectedMonth);
 if(page==='members'&&!admin())page='dashboard';showPage(page);
}
function renderPage(){
 if(page==='dashboard')renderDashboard();if(page==='members')renderMembers();if(page==='meals')renderMeals();if(page==='expenses')renderExpenses();if(page==='deposits')renderDeposits();if(page==='groceries')renderGroceries();if(page==='duties')renderDuties();if(page==='planner')renderPlanner();if(page==='reports')renderReports();if(page==='profile')renderProfile();
}
function renderDashboard(){
 const t=totals(),own=t.rows.find(r=>r.u.id===session),pending=mess.expenses.filter(x=>x.status==='pending').length+mess.deposits.filter(x=>x.status==='pending').length;
 setText('#hello-title',`Hello, ${user().name.split(' ')[0]} 👋`);setText('#hello-description',admin()?'Here is what is happening around your mess this month.':'Your meals, expenses and responsibilities at a glance.');setText('#dashboard-code',`Invite code: ${mess.inviteCode}`);
 setText('#banner-title',admin()?'Keep your mess running smoothly.':'Everything in one place.');const due=mess.duties.filter(x=>x.userId===session&&!x.done).sort((a,b)=>a.date.localeCompare(b.date))[0];setText('#banner-message',admin()?'Review new submissions and keep the whole house on track.':due?`Your next shopping duty: ${due.task} on ${shortDate(due.date)}.`:'Check your meal planner and keep your records up to date.');setText('#dashboard-action',admin()?'Review requests →':'Add today’s meals →');
 if(admin()){setStat(1,'Total meals',t.totalMeals,'Recorded this month');setStat(2,'Food spent',money(t.mealBill),'Breakfast + lunch + dinner charges');setStat(3,'Food deposit remaining',money(t.remaining),'Approved deposits − food spent');setStat(4,'Average meal rate',money(t.rate),`${pending} pending reviews`)}
 else{setStat(1,'My meals',own.count,'Recorded this month');setStat(2,'Average meal rate',money(t.rate),'Meal charges ÷ recorded meals');setStat(3,'My food bill',money(own.bill),'Your breakfasts + lunches + dinners');setStat(4,'My balance',money(own.balance),'Approved deposit minus food bill')}
 const recent=$('#recent-expenses');clear(recent);
 const items=mess.expenses.filter(x=>admin()||x.userId===session).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4);
 for(const x of items){const row=node('div','','list-item'),left=node('div'),right=node('div');left.append(node('strong',x.description),node('small',`${shortDate(x.date)} · ${memberName(x.userId)} · ${categoryNames[x.category]||'Other expenses'}`));right.append(node('strong',money(x.amount)),status(x.status));row.append(left,right);recent.append(row)}if(!items.length)recent.append(node('p','No recent expenses.','muted'));
 const upcoming=$('#upcoming-duties');clear(upcoming);const next=mess.duties.filter(x=>dutyState(x)!=='done'&&(admin()||x.userId===session)).sort((a,b)=>(dutyState(a)==='needs-help'?-1:0)-(dutyState(b)==='needs-help'?-1:0)||a.date.localeCompare(b.date)).slice(0,3);
 for(const x of next){const row=node('div','','list-item'),left=node('div');left.append(node('strong',x.task),node('small',`${memberName(x.userId)} · ${shortDate(x.date)}${x.note?` · ${x.note}`:''}`));row.append(left,dutyBadge(x));upcoming.append(row)}if(!next.length)upcoming.append(node('p','No upcoming duties.','muted'));
}
function renderMembers(){const body=$('#members-body');clear(body);setText('#members-code',`Invite code: ${mess.inviteCode}`);setText('#members-subtitle',`${mess.users.filter(u=>u.status==='active').length} active accounts`);
 for(const u of mess.users){const row=node('tr'),member=td(row,person(u.id));member.append(node('small',u.email));td(row,status(u.role));td(row,status(u.status));const buttons=[];
  if(u.id!==session){buttons.push(action(u.status==='active'?'Suspend':'Activate','toggle-user',u.id,u.status==='active'?'btn-danger':'btn-light'));if(u.status==='active')buttons.push(u.role==='user'?action('Make admin','promote-user',u.id,'btn-primary'):action('Make member','demote-user',u.id,'btn-outline'))}
  actionCell(row,buttons);if(u.id===session)row.lastChild.append('Your account');body.append(row)}
}
function renderMeals(){const body=$('#meals-body');clear(body);const t=totals(),list=mess.meals.filter(x=>x.date.startsWith(selectedMonth)&&(admin()||x.userId===session)).sort((a,b)=>b.date.localeCompare(a.date));setText('#meal-entries',list.length);setText('#meal-visible-total',list.reduce((n,x)=>n+Number(x.breakfast||0)+Number(x.lunch||0)+Number(x.dinner||0),0));setText('#meal-rate',money(t.rate));setText('#meal-remaining',money(t.remaining));setText('#meal-spent',`Food spent from approved deposits: ${money(t.mealBill)} · Deposited: ${money(t.paid)}`);
 for(const k of ['breakfast','lunch','dinner'])setText(`#price-${k}`,money(t.prices[k]));setText('#pricing-status',t.prices.locked?'Fixed for this month':'Editable for this month');
 if(admin()){const form=$('#pricing-form');for(const k of ['breakfast','lunch','dinner']){form.elements[k].value=t.prices[k];form.elements[k].disabled=t.prices.locked}form.querySelector('[type="submit"]').disabled=t.prices.locked;setText('#pricing-lock',t.prices.locked?'Unlock prices':'Lock prices');setText('#pricing-help',t.prices.locked?'Unlock to edit this month’s prices.':'Save prices, then lock them to fix this month’s rates.')}
 for(const x of list){const row=node('tr');td(row,shortDate(x.date));const who=td(row,person(x.userId));who.classList.add('admin-only');who.hidden=!admin();for(const k of ['breakfast','lunch','dinner'])td(row,x[k]?`✓ ${money(Number(x[k])*t.prices[k])}`:'—');td(row,Number(x.breakfast||0)+Number(x.lunch||0)+Number(x.dinner||0));td(row,money(t.mealCost(x)));actionCell(row,[action('Edit','edit-meal',x.id),action('Delete','delete-meal',x.id,'btn-danger')]);body.append(row)}noRows(body,8)
}
function renderExpenses(){const body=$('#expenses-body');clear(body);const t=totals(),items=mess.expenses.filter(x=>x.date.startsWith(selectedMonth)&&(admin()||x.userId===session)).sort((a,b)=>b.date.localeCompare(a.date));setText('#expense-food',money(t.foodCost));setText('#expense-other',money(t.otherCost));setText('#expense-pending',mess.expenses.filter(x=>x.status==='pending').length);setText('#expense-rate',money(t.rate));
 for(const x of items){const row=node('tr'),desc=td(row,x.description);desc.append(document.createElement('br'),node('small',shortDate(x.date)));const who=td(row,person(x.userId));who.classList.add('admin-only');who.hidden=!admin();td(row,categoryNames[x.category]||'Other expenses');td(row,money(x.amount));td(row,status(x.status));const buttons=[];if(admin()&&x.status==='pending')buttons.push(action('Approve','approve-expense',x.id),action('Reject','reject-expense',x.id,'btn-danger'));if(x.status!=='approved')buttons.push(action('Delete','delete-expense',x.id,'btn-outline'));actionCell(row,buttons);body.append(row)}noRows(body,6)
}
function renderDeposits(){const body=$('#deposits-body');clear(body);const t=totals(),items=mess.deposits.filter(x=>x.date.startsWith(selectedMonth)&&(admin()||x.userId===session)).sort((a,b)=>b.date.localeCompare(a.date));setText('#deposit-approved',money(t.paid));setText('#deposit-pending',mess.deposits.filter(x=>x.status==='pending').length);setText('#deposit-members',mess.users.filter(u=>u.status==='active').length);setText('#deposit-rate',money(t.rate));
 for(const x of items){const row=node('tr');td(row,shortDate(x.date));const who=td(row,person(x.userId));who.classList.add('admin-only');who.hidden=!admin();td(row,x.method);td(row,money(x.amount));td(row,status(x.status));const buttons=[];if(admin()&&x.status==='pending')buttons.push(action('Confirm','approve-deposit',x.id),action('Reject','reject-deposit',x.id,'btn-danger'));if(x.status!=='approved')buttons.push(action('Delete','delete-deposit',x.id,'btn-outline'));actionCell(row,buttons);body.append(row)}noRows(body,6)
}
function renderGroceries(){const body=$('#groceries-body');clear(body);const items=mess.groceries.filter(x=>admin()||x.status==='approved'||x.addedBy===session);setText('#grocery-count',`${items.filter(x=>!x.bought).length} items to buy`);setText('#grocery-add-label',admin()?'＋ Add item':'＋ Suggest item');
 for(const x of items){const row=node('tr');td(row,x.item);td(row,x.quantity);td(row,status(x.status));td(row,status(x.bought?'purchased':'pending'));const buttons=[];if(admin()){if(x.status==='suggested')buttons.push(action('Add to list','approve-grocery',x.id));if(x.status==='approved')buttons.push(action(x.bought?'Undo':'Mark bought','toggle-grocery',x.id));buttons.push(action('Remove','delete-grocery',x.id,'btn-danger'))}actionCell(row,buttons);body.append(row)}noRows(body,5,'No groceries added yet.')
}
function dutyState(x){return x.status==='needs-help'?'needs-help':x.status==='done'||x.done?'done':'pending'}
function dutyBadge(x){const state=dutyState(x),badge=status(state);badge.textContent=state==='needs-help'?'Cannot do':state==='done'?'Done':'Pending';return badge}
function renderDuties(){
 const body=$('#duties-body'),overview=$('#duty-overview');clear(body);clear(overview);
 const items=mess.duties.filter(x=>admin()||x.userId===session).sort((a,b)=>(dutyState(a)==='needs-help'?-1:0)-(dutyState(b)==='needs-help'?-1:0)||a.date.localeCompare(b.date));
 for(const [state,label] of [['pending','Pending'],['needs-help','Cannot do'],['done','Completed']]){const box=node('div','','duty-count');box.append(node('small',label),node('strong',items.filter(x=>dutyState(x)===state).length));overview.append(box)}
 for(const x of items){
  const state=dutyState(x),row=node('tr');td(row,shortDate(x.date));td(row,person(x.userId));td(row,x.task);td(row,dutyBadge(x));
  const update=td(row,'');if(x.note)update.append(node('div',x.note,'duty-reason'));if(admin()&&x.history?.length){const last=x.history.at(-1);update.append(node('small',`Previously: ${memberName(last.userId)} · ${last.reason||'Reassigned'} (${shortDate(last.date)})`))}if(!update.childNodes.length)update.append(node('span','—','muted'));
  const buttons=[];if(state==='pending'){buttons.push(action('Mark done','toggle-duty',x.id));if(x.userId===session)buttons.push(action('Cannot do','duty-unavailable',x.id,'btn-outline'))}else if(state==='needs-help'){buttons.push(action('Back to pending','duty-retry',x.id,'btn-outline'))}else buttons.push(action('Reopen','toggle-duty',x.id,'btn-outline'));
  if(admin()){if(state!=='done')buttons.push(action('Reassign','duty-reassign',x.id,'btn-primary'));buttons.push(action('Remove','delete-duty',x.id,'btn-danger'))}
  actionCell(row,buttons);body.append(row)
 }noRows(body,6,'No shopping duties assigned.')
}
function renderPlanner(){const container=$('#planner-days');clear(container);const currentDay=(new Date().getDay()+6)%7;for(const [i,p] of mess.planner.entries()){const card=node('article','','day-card');if(i===currentDay)card.classList.add('today');card.append(node('h3',p.day+(i===currentDay?' · Today':'')));for(const k of ['breakfast','lunch','dinner']){const slot=node('div','','meal-slot');slot.append(node('small',k[0].toUpperCase()+k.slice(1)),node('div',p[k]));card.append(slot)}container.append(card)}}
function renderReports(){const body=$('#reports-body');clear(body);const t=totals();setText('#report-meals',t.totalMeals);setText('#report-food',money(t.mealBill));setText('#report-rate',money(t.rate));setText('#report-deposits',money(t.remaining));setText('#report-formula',`Breakfast ${money(t.prices.breakfast)} + lunch ${money(t.prices.lunch)} + dinner ${money(t.prices.dinner)} per recorded meal. Average rate: ${money(t.mealBill)} ÷ ${t.totalMeals} meals = ${money(t.rate)}.`);setText('#report-note',`Approved food deposits: ${money(t.paid)}. Meal charges: ${money(t.mealBill)}. Remaining: ${money(t.remaining)}. Grocery purchases: ${money(t.foodCost)} (tracked separately, never billed twice). Other shared bills: ${money(t.otherCost)} (separate from food balances).`);
 for(const x of t.rows.filter(r=>admin()||r.u.id===session)){const row=node('tr');td(row,person(x.u.id));td(row,x.count);td(row,money(x.bill));td(row,money(x.paid));const balance=td(row,`${x.balance<0?'-':''}${money(Math.abs(x.balance))}`);balance.className=x.balance<0?'money-bad':'money-good';body.append(row)}noRows(body,5)
}
function renderProfile(){const u=user();putAvatar($('#profile-avatar'),u);setText('#profile-display-name',u.name);setText('#profile-email-role',`${u.email} · ${admin()?'Admin':'Member'}`);$('#profile-form').elements.name.value=u.name;$('#profile-form').elements.email.value=u.email;$('#remove-photo').hidden=!u.photo}
function fillMembers(){for(const select of $$('select[data-users]')){clear(select);for(const u of mess.users.filter(x=>x.status==='active')){const option=node('option',u.name);option.value=u.id;select.append(option)}}}
function openDialog(kind,mealId=''){
 if((kind==='duty'||kind==='planner')&&!admin())return;
 editingMealId=kind==='meal'?mealId:'';
 const form=$(`#${kind}-form`);form.reset();fillMembers();
 if(form.elements.date)form.elements.date.value=today();
 if(kind==='meal'&&mealId){const x=mess.meals.find(e=>e.id===mealId);if(!x||(!admin()&&x.userId!==session))return;form.elements.date.value=x.date;form.elements.userId.value=x.userId;for(const k of ['breakfast','lunch','dinner'])form.elements[k].value=String(x[k])}
 if(kind==='planner')fillPlannerForm();
 if(kind==='grocery')setText('#grocery-dialog-title',admin()?'Add grocery item':'Suggest grocery item');
 setText('#meal-dialog-title',editingMealId?'Edit meal entry':'Add daily meals');
 $(`#${kind}-dialog`).showModal();
}
function openDutyUpdate(kind,recordId){
 const x=mess.duties.find(d=>d.id===recordId);if(!x||dutyState(x)==='done'||(kind==='reassign'&&!admin())||(kind==='unavailable'&&x.userId!==session))return;
 if(kind==='unavailable'&&dutyState(x)!=='pending')return;
 const form=$(`#duty-${kind}-form`);form.reset();form.elements.dutyId.value=x.id;setText(`#duty-${kind}-task`,`${x.task} · ${memberName(x.userId)} · ${shortDate(x.date)}`);
 if(kind==='reassign'){fillMembers();const options=[...form.elements.userId.options];for(const option of options)option.disabled=option.value===x.userId;if(!options.some(o=>!o.disabled)){notify('No other active member is available.');return}form.elements.userId.value=options.find(o=>!o.disabled).value;form.elements.date.value=x.date}
 $(`#duty-${kind}-dialog`).showModal();
}
function fillPlannerForm(){const f=$('#planner-form'),p=mess.planner.find(x=>x.day===f.elements.day.value);if(!p)return;for(const k of ['breakfast','lunch','dinner'])f.elements[k].value=p[k]}
function closeDialog(form){form.closest('dialog').close();persist();notify('Saved successfully.')}
function validAmount(v){const n=Number(v);return Number.isFinite(n)&&n>0?n:null}
function submitRecord(form){const v=Object.fromEntries(new FormData(form)),kind=form.id.replace('-form','');
 if(kind==='meal'){
  const userId=admin()?v.userId:session;
  if(editingMealId){const previous=mess.meals.find(x=>x.id===editingMealId);if(!previous||(!admin()&&previous.userId!==session))return}
  if(mess.meals.some(x=>x.id!==editingMealId&&x.userId===userId&&x.date===v.date)){notify('A meal entry already exists for this member and date.');return}
  const x={id:editingMealId||id(),userId,date:v.date,breakfast:Number(v.breakfast),lunch:Number(v.lunch),dinner:Number(v.dinner)};
  if(editingMealId)mess.meals=mess.meals.map(e=>e.id===editingMealId?x:e);else mess.meals.push(x);
 }
 if(kind==='expense'){const amount=validAmount(v.amount);if(!amount||!Object.hasOwn(categoryNames,v.category)){notify('Enter a valid category and amount.');return}mess.expenses.push({id:id(),userId:admin()?v.userId:session,date:v.date,description:v.description.trim(),category:v.category,amount,status:admin()?'approved':'pending'})}
 if(kind==='deposit'){const amount=validAmount(v.amount);if(!amount){notify('Enter a valid amount.');return}mess.deposits.push({id:id(),userId:admin()?v.userId:session,date:v.date,amount,method:v.method,status:admin()?'approved':'pending'})}
 if(kind==='grocery')mess.groceries.push({id:id(),item:v.item.trim(),quantity:v.quantity.trim(),addedBy:session,bought:false,status:admin()?'approved':'suggested'});
 if(kind==='duty'&&admin())mess.duties.push({id:id(),userId:v.userId,date:v.date,task:v.task.trim(),status:'pending',done:false,note:'',history:[]});
 if(kind==='duty-unavailable'){
  const x=mess.duties.find(d=>d.id===v.dutyId),reason=v.reason?.trim();if(!x||dutyState(x)!=='pending'||x.userId!==session||!reason){notify('Enter a reason for the assigned task.');return}x.status='needs-help';x.done=false;x.note=reason.slice(0,300);
 }
 if(kind==='duty-reassign'){
  const x=mess.duties.find(d=>d.id===v.dutyId);if(!admin()||!x||dutyState(x)==='done'||v.userId===x.userId||!mess.users.some(u=>u.id===v.userId&&u.status==='active')||!/^\d{4}-\d{2}-\d{2}$/.test(v.date)){notify('Choose a different active member and a valid date.');return}
  x.history??=[];x.history.push({userId:x.userId,reason:x.note,date:today()});x.userId=v.userId;x.date=v.date;x.status='pending';x.done=false;x.note='';
 }
 if(kind==='planner'&&admin()){const day=mess.planner.find(x=>x.day===v.day);if(!day)return;for(const k of ['breakfast','lunch','dinner'])day[k]=v[k].trim()}
 closeDialog(form);
}
function doAction(action,recordId){
 const item=(collection)=>mess[collection].find(x=>x.id===recordId);
 if(action==='duty-unavailable'||action==='duty-reassign'){openDutyUpdate(action.slice(5),recordId);return}
 if(action==='edit-meal'){openDialog('meal',recordId);return}
 if(action==='delete-meal'){const x=item('meals');if(!x||(!admin()&&x.userId!==session)||!confirm('Delete this meal entry?'))return;mess.meals=mess.meals.filter(e=>e.id!==recordId)}
 else if(action==='toggle-user'&&admin()){const u=item('users');if(!u||u.id===session)return;if(u.role==='admin'&&u.status==='active'&&mess.users.filter(x=>x.role==='admin'&&x.status==='active').length<=1){notify('The mess needs an active Admin.');return}u.status=u.status==='active'?'suspended':'active'}
 else if(action==='promote-user'&&admin()){const u=item('users');if(!u||u.status!=='active'||u.role!=='user'||!confirm(`Make ${u.name} an Admin?`))return;u.role='admin'}
 else if(action==='demote-user'&&admin()){const u=item('users');if(!u||u.id===session||u.role!=='admin'||mess.users.filter(x=>x.role==='admin'&&x.status==='active').length<=1||!confirm(`Change ${u.name} to a Member?`))return;u.role='user'}
 else if(['approve-expense','reject-expense'].includes(action)&&admin()){const x=item('expenses');if(!x||x.status!=='pending')return;x.status=action.startsWith('approve')?'approved':'rejected'}
 else if(action==='delete-expense'){const x=item('expenses');if(!x||x.status==='approved'||(!admin()&&x.userId!==session)||!confirm('Delete this expense request?'))return;mess.expenses=mess.expenses.filter(e=>e.id!==recordId)}
 else if(['approve-deposit','reject-deposit'].includes(action)&&admin()){const x=item('deposits');if(!x||x.status!=='pending')return;x.status=action.startsWith('approve')?'approved':'rejected'}
 else if(action==='delete-deposit'){const x=item('deposits');if(!x||x.status==='approved'||(!admin()&&x.userId!==session)||!confirm('Delete this deposit request?'))return;mess.deposits=mess.deposits.filter(e=>e.id!==recordId)}
 else if(action==='approve-grocery'&&admin()){const x=item('groceries');if(!x)return;x.status='approved'}
 else if(action==='toggle-grocery'&&admin()){const x=item('groceries');if(!x||x.status!=='approved')return;x.bought=!x.bought}
 else if(action==='delete-grocery'&&admin())mess.groceries=mess.groceries.filter(x=>x.id!==recordId);
 else if(action==='toggle-duty'){const x=item('duties');if(!x||(!admin()&&x.userId!==session)||dutyState(x)==='needs-help')return;const next=dutyState(x)==='done'?'pending':'done';x.status=next;x.done=next==='done';x.note=''}
 else if(action==='duty-retry'){const x=item('duties');if(!x||(!admin()&&x.userId!==session)||dutyState(x)!=='needs-help')return;x.status='pending';x.done=false;x.note=''}
 else if(action==='delete-duty'&&admin())mess.duties=mess.duties.filter(x=>x.id!==recordId);
 else return;
 persist();notify('Updated successfully.');
}
function submitAuth(form){const v=Object.fromEntries(new FormData(form)),email=v.email.trim().toLowerCase();
 if(form.id==='login-form'){
  const m=root.messes.find(m=>m.users.some(u=>u.email===email&&u.password===v.password));const u=m?.users.find(x=>x.email===email&&x.password===v.password);
  if(!u){notify('Email or password is incorrect.');return}if(u.status!=='active'){notify('This account is suspended.');return}login(m,u);return;
 }
 if(v.password.length<6){notify('Choose a password of at least 6 characters.');return}
 if(root.messes.some(m=>m.users.some(u=>u.email===email))){notify('This email is already registered.');return}
 let m,role;
 if(form.id==='admin-form'){role='admin';m={id:id(),messName:v.messName.trim(),inviteCode:generatedInvite(),users:[],meals:[],mealPricing:{},expenses:[],deposits:[],groceries:[],duties:[],planner:newPlanner()};if(!m.messName){notify('Enter your mess name.');return}root.messes.push(m)}
 else{role='user';m=root.messes.find(x=>x.inviteCode.toUpperCase()===v.code.trim().toUpperCase());if(!m){notify('Invite code is not valid.');return}}
 const u={id:id(),name:v.name.trim(),email,password:v.password,role,status:'active'};m.users.push(u);localStorage.setItem(STORAGE_KEY,JSON.stringify(root));login(m,u);
 if(role==='admin')notify(`Mess created. Give members your code: ${m.inviteCode}`);
}
function submitProfile(form){const v=Object.fromEntries(new FormData(form));if(form.id==='profile-form'){const name=v.name?.trim();if(!name){notify('Enter a name.');return}user().name=name;persist();notify('Name updated.');return}
 if(v.currentPassword!==user().password){notify('Current password is incorrect.');return}if(v.newPassword.length<6){notify('New password must have at least 6 characters.');return}if(v.newPassword!==v.confirmPassword){notify('New passwords do not match.');return}if(v.newPassword===user().password){notify('Choose a different password.');return}user().password=v.newPassword;form.reset();persist();notify('Password updated.')
}
async function processPhoto(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw Error('Use a JPG, PNG or WebP image under 5 MB.');
 const url=URL.createObjectURL(file);
 try{const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Could not open that photo.'));image.src=url});const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');const side=Math.min(image.naturalWidth,image.naturalHeight);ctx.drawImage(image,(image.naturalWidth-side)/2,(image.naturalHeight-side)/2,side,side,0,0,256,256);return canvas.toDataURL('image/jpeg',.8)}finally{URL.revokeObjectURL(url)}
}

document.addEventListener('click',event=>{
 if(event.target.closest('#pricing-lock')){if(!admin())return;mess.mealPricing??={};const current=pricesFor(selectedMonth);mess.mealPricing[selectedMonth]={...current,locked:!current.locked};persist();notify(current.locked?'Meal prices unlocked.':'Meal prices fixed for this month.');return}
 const tab=event.target.closest('[data-auth-tab]');if(tab){showTab(tab.dataset.authTab);return}
 const nav=event.target.closest('[data-nav]');if(nav){showPage(nav.dataset.nav);return}
 const opener=event.target.closest('[data-open]');if(opener){openDialog(opener.dataset.open);return}
 const closer=event.target.closest('[data-close]');if(closer){closer.closest('dialog').close();return}
 const action=event.target.closest('[data-action]');if(action){doAction(action.dataset.action,action.dataset.id);return}
 if(event.target.closest('#logout-button')){session='';sessionStorage.removeItem(SESSION_KEY);page='dashboard';render();return}
 if(event.target.closest('#reset-demo')){if(!confirm('Reset all accounts and records in this browser?'))return;root={messes:[sampleMess()]};mess=root.messes[0];session='';sessionStorage.removeItem(SESSION_KEY);persist();notify('Sample data restored.');return}
 if(event.target.closest('#remove-photo')){user().photo='';persist();notify('Profile photo removed.');return}
 if(event.target.closest('#mobile-menu')){$('#sidebar').classList.toggle('open');$('#mobile-overlay').classList.toggle('open');return}
 if(event.target.id==='mobile-overlay'){$('#sidebar').classList.remove('open');event.target.classList.remove('open');return}
 if(event.target.closest('#dashboard-action')){if(admin())showPage('expenses');else openDialog('meal')}
});
document.addEventListener('change',async event=>{
 if(event.target.matches('[data-month]')){selectedMonth=event.target.value||today().slice(0,7);$$('[data-month]').forEach(x=>x.value=selectedMonth);renderPage()}
 if(event.target.id==='profile-photo'&&event.target.files?.[0]){const active=session;try{const photo=await processPhoto(event.target.files[0]);if(active!==session)return;user().photo=photo;persist();notify('Profile photo updated.')}catch(err){notify(err.message)}}
 if(event.target.name==='day'&&event.target.closest('#planner-form'))fillPlannerForm();
});
document.addEventListener('submit',event=>{
 const form=event.target;if(!form.id?.endsWith('-form'))return;event.preventDefault();
 if(form.id==='pricing-form'){if(!admin()||pricesFor(selectedMonth).locked)return;const data=new FormData(form),prices={};for(const k of ['breakfast','lunch','dinner']){const raw=data.get(k);const n=Number(raw);if(raw===''||!Number.isFinite(n)||n<0||n>100000){notify('Enter valid meal prices (৳0–৳100,000).');return}prices[k]=Math.round(n*100)/100}mess.mealPricing??={};mess.mealPricing[selectedMonth]={...prices,locked:false};persist();notify('Meal prices updated for this month.');return}
 if(['login-form','admin-form','member-form'].includes(form.id)){submitAuth(form);return}
 if(['profile-form','password-form'].includes(form.id)){submitProfile(form);return}
 submitRecord(form);
});
localStorage.setItem(STORAGE_KEY,JSON.stringify(root));
render();
