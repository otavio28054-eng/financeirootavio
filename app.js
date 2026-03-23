// ── CATEGORIES ─────────────────────────────────────────────────────────
const CATS=[
  {k:'salario',l:'Salário',c:'#4ade80',t:'income'},
  {k:'investimento',l:'Investimento',c:'#c084fc',t:'investment'},
  {k:'academia',l:'Academia',c:'#60a5fa',t:'expense'},
  {k:'agua',l:'Água',c:'#38bdf8',t:'expense'},
  {k:'cabelo',l:'Cabelo e Estética',c:'#f472b6',t:'expense'},
  {k:'carro_compra',l:'Compras Carro e Moto',c:'#fb923c',t:'expense'},
  {k:'casa_compra',l:'Compras p/ Casa',c:'#a78bfa',t:'expense'},
  {k:'condominio',l:'Condomínio',c:'#94a3b8',t:'expense'},
  {k:'consorcio',l:'Consórcio',c:'#fbbf24',t:'expense'},
  {k:'medico',l:'Despesas Médicas',c:'#34d399',t:'expense'},
  {k:'dizimo',l:'Dízimo',c:'#f0abfc',t:'expense'},
  {k:'educacao',l:'Educação',c:'#818cf8',t:'expense'},
  {k:'emprestimo',l:'Empréstimo',c:'#f87171',t:'expense'},
  {k:'emp_familiar',l:'Empréstimo Familiar',c:'#fca5a5',t:'expense'},
  {k:'estacionamento',l:'Estacionamento',c:'#d1d5db',t:'expense'},
  {k:'farmacia',l:'Farmácia',c:'#6ee7b7',t:'expense'},
  {k:'financiamento',l:'Financiamento',c:'#fda4af',t:'expense'},
  {k:'gas',l:'Gás de Cozinha',c:'#fdba74',t:'expense'},
  {k:'gasolina',l:'Gasolina',c:'#fcd34d',t:'expense'},
  {k:'impostos',l:'Impostos',c:'#d97706',t:'expense'},
  {k:'internet_casa',l:'Internet Casa',c:'#7dd3fc',t:'expense'},
  {k:'internet_cel',l:'Internet Celular',c:'#93c5fd',t:'expense'},
  {k:'lazer',l:'Lazer',c:'#f9a8d4',t:'expense'},
  {k:'lanche',l:'Lanche',c:'#fde68a',t:'expense'},
  {k:'luz',l:'Luz',c:'#fef08a',t:'expense'},
  {k:'manut_carro',l:'Manutenção Carro/Moto',c:'#fb923c',t:'expense'},
  {k:'manut_casa',l:'Manutenção Casa',c:'#c4b5fd',t:'expense'},
  {k:'mercado',l:'Mercado',c:'#4ade80',t:'expense'},
  {k:'missao',l:'Missão',c:'#e9d5ff',t:'expense'},
  {k:'outros',l:'Outros',c:'#6b7280',t:'expense'},
  {k:'panificadora',l:'Panificadora',c:'#fef3c7',t:'expense'},
  {k:'presentes',l:'Presentes',c:'#fbcfe8',t:'expense'},
  {k:'refeicoes',l:'Refeições',c:'#a7f3d0',t:'expense'},
  {k:'saque',l:'Saque',c:'#d1d5db',t:'expense'},
  {k:'seguro',l:'Seguro',c:'#bfdbfe',t:'expense'},
  {k:'streaming',l:'Streaming',c:'#8b5cf6',t:'expense'},
  {k:'transporte',l:'Transporte',c:'#67e8f9',t:'expense'},
  {k:'vestuario',l:'Vestuário e Acessórios',c:'#fda4af',t:'expense'},
  {k:'viagens',l:'Viagens',c:'#34d399',t:'expense'},
];
const catMap={};CATS.forEach(c=>{catMap[c.k]=c;});

function buildSel(elId,selKey='outros'){
  const el=document.getElementById(elId);if(!el)return;
  const groups=[
    {label:'── Renda',cats:CATS.filter(c=>c.t==='income')},
    {label:'── Investimento',cats:CATS.filter(c=>c.t==='investment')},
    {label:'── Despesas',cats:CATS.filter(c=>c.t==='expense')},
  ];
  el.innerHTML=groups.map(g=>`<optgroup label="${g.label}">${g.cats.map(c=>`<option value="${c.k}"${c.k===selKey?' selected':''}>${c.l}</option>`).join('')}</optgroup>`).join('');
}

// ── GLOBALS ────────────────────────────────────────────────────────────
const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const todayDate=new Date();
let viewY=todayDate.getFullYear(),viewM=todayDate.getMonth(),annualYear=todayDate.getFullYear();
const fmt=v=>'R$ '+Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const uid=()=>Math.random().toString(36).slice(2,9);
const mKey=(y,m)=>`${y}-${String(m+1).padStart(2,'0')}`;
const todayStr=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const fmtDate=s=>{if(!s)return'';const[y,m,d]=s.split('-');return`${d}/${m}/${y}`;};

let userCode='';
let D={fixed:[],card:[],months:{},investments:[]};
let saveTimer=null;

// ── LOGIN ──────────────────────────────────────────────────────────────
function doLogin(){
  const code=document.getElementById('loginCode').value.trim().toUpperCase().replace(/\s+/g,'');
  if(code.length<3){document.getElementById('loginErr').textContent='Código muito curto (mínimo 3 caracteres).';return;}
  userCode=code;
  localStorage.setItem('fin_code',code);
  startApp();
}

async function startApp(){
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('mainApp').style.display='';
  document.getElementById('syncBadge').style.display='flex';
  document.getElementById('userCodeBadge').textContent=userCode+' · sair';
  buildSel('qCat','mercado');buildSel('fCat','outros');
  document.getElementById('qDate').value=todayStr();
  document.getElementById('fDate').value=todayStr();
  document.getElementById('iMonth').value=mKey(todayDate.getFullYear(),todayDate.getMonth());

  // 1. Show local data immediately (instant UI)
  const local=localStorage.getItem('fin_'+userCode);
  if(local){try{D=JSON.parse(local);}catch(e){D=seedData();}}
  else{D=seedData();}
  renderAll();

  // 2. Load from Firebase (source of truth)
  setSyncStatus('saving');
  try{
    const cloud=await window._cloud.load(userCode);
    if(cloud&&cloud.fixed){
      D=cloud;
      localStorage.setItem('fin_'+userCode,JSON.stringify(D));
      renderAll();
      setSyncStatus('ok');
    } else {
      // First time: push local/seed data to Firebase
      const ok=await window._cloud.save(userCode,D);
      setSyncStatus(ok?'ok':'offline');
    }
  }catch(e){
    setSyncStatus('offline');
  }

  // 3. Subscribe to real-time changes (other devices)
  window._cloud.listen(userCode,(payload)=>{
    // Only update if data is actually different (avoid loop)
    if(JSON.stringify(payload)!==JSON.stringify(D)){
      D=payload;
      localStorage.setItem('fin_'+userCode,JSON.stringify(D));
      renderAll();
    }
    setSyncStatus('ok');
  });
}

function seedData(){
  const cm=mKey(todayDate.getFullYear(),todayDate.getMonth());
  return{
    fixed:[
      {id:'f1',name:'Aluguel',value:400,cat:'condominio',day:1},
      {id:'f2',name:'Energia elétrica',value:151.17,cat:'luz',day:10},
      {id:'f3',name:'Internet',value:61.19,cat:'internet_casa',day:15},
    ],
    card:[
      {id:'c1',name:'Academia',value:79.90,cat:'academia',tipo:'fixa'},
      {id:'c2',name:'Unisociesc',value:272.52,cat:'educacao',tipo:'fixa'},
      {id:'c3',name:'Pix Gabi',value:1230.06,cat:'emp_familiar',tipo:'parcelada',pa:1,pt:2,startMonth:cm},
      {id:'c4',name:"Show Gun's",value:67.67,cat:'lazer',tipo:'parcelada',pa:1,pt:10,startMonth:cm},
      {id:'c5',name:'Polo Wear',value:64.99,cat:'vestuario',tipo:'parcelada',pa:1,pt:4,startMonth:cm},
      {id:'c6',name:'C&A',value:39.90,cat:'vestuario',tipo:'parcelada',pa:1,pt:2,startMonth:cm},
      {id:'c7',name:'Torneira e ralo',value:15.04,cat:'manut_casa',tipo:'parcelada',pa:1,pt:12,startMonth:cm},
    ],
    months:{[cm]:{
      income:[
        {id:'i1',name:'Salário dia 15',value:1367.28,cat:'salario',date:cm+'-15',ts:Date.now()-200},
        {id:'i2',name:'Salário dia 30',value:1538.95,cat:'salario',date:cm+'-30',ts:Date.now()-100},
      ],
      variable:[
        {id:'v1',name:'Mercado mensal',value:750,cat:'mercado',date:todayStr(),ts:Date.now()-70},
        {id:'v2',name:'Lazer mensal',value:300,cat:'lazer',date:todayStr(),ts:Date.now()-60},
      ]
    }},
    investments:[]
  };
}

function logout(){
  if(!confirm('Sair da conta '+userCode+'?'))return;
  // Close real-time listener
  if(window._fbSse){window._fbSse.close();window._fbSse=null;}
  userCode='';
  localStorage.removeItem('fin_code');
  D={fixed:[],card:[],months:{},investments:[]};
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('mainApp').style.display='none';
  document.getElementById('syncBadge').style.display='none';
  document.getElementById('loginCode').value='';
  document.getElementById('loginErr').textContent='';
}

function setSyncStatus(s){
  const dot=document.getElementById('syncDot');
  const lbl=document.getElementById('syncLabel');
  dot.className='sync-dot';
  if(s==='saving'){dot.classList.add('saving');lbl.textContent='salvando...';}
  else if(s==='ok'){lbl.textContent='sincronizado';}
  else{dot.classList.add('offline');lbl.textContent='offline (local)';}
}

function persist(){
  // Save locally immediately — never lose data
  localStorage.setItem('fin_'+userCode,JSON.stringify(D));
  // Debounce cloud save by 1.5s to avoid hammering API
  setSyncStatus('saving');
  clearTimeout(saveTimer);
  saveTimer=setTimeout(cloudSave,1500);
}

async function cloudSave(){
  if(!userCode)return;
  try{
    const ok=await window._cloud.save(userCode,D);
    setSyncStatus(ok?'ok':'offline');
  }catch(e){
    setSyncStatus('offline');
  }
}

// Check saved code on load
window.addEventListener('load',()=>{
  const saved=localStorage.getItem('fin_code');
  if(saved){userCode=saved;document.getElementById('loginCode').value=saved;startApp();}
});
document.getElementById('loginCode').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});

// ── DATA HELPERS ────────────────────────────────────────────────────────
function getMonth(y,m){
  const k=mKey(y,m);
  if(!D.months[k])D.months[k]={income:[],variable:[]};
  return D.months[k];
}
function activeCards(y,m){
  return D.card.filter(c=>{
    if(c.tipo==='fixa')return true;
    if(!c.startMonth)return true;
    const[sy,sm]=c.startMonth.split('-').map(Number);
    const si=sy*12+(sm-1),ci=y*12+m;
    return ci>=si&&(ci-si)<c.pt;
  });
}
function cardInfo(card,y,m){
  if(card.tipo==='fixa')return'fixa mensal';
  const[sy,sm]=card.startMonth.split('-').map(Number);
  return`${y*12+m-(sy*12+(sm-1))+1}/${card.pt}`;
}
function addMonths(startMonth,pa,pt){
  if(!startMonth||!pa||!pt)return null;
  const[sy,sm]=startMonth.split('-').map(Number);
  let em=sm+(pt-pa),ey=sy;
  while(em>12){em-=12;ey++;}
  return MESES[em-1]+' de '+ey;
}

// ── TOTALS ─────────────────────────────────────────────────────────────
function totalsFor(y,m){
  const md=getMonth(y,m);
  const inc=md.income.reduce((s,x)=>s+x.value,0);
  const varr=md.variable.reduce((s,x)=>s+x.value,0);
  const fix=D.fixed.reduce((s,x)=>s+x.value,0);
  const card=activeCards(y,m).reduce((s,x)=>s+x.value,0);
  const inv=D.investments.filter(x=>x.month===mKey(y,m)).reduce((s,x)=>s+x.value,0);
  const exp=varr+fix+card;
  return{inc,varr,fix,card,inv,exp,bal:inc-exp-inv};
}

// ── NAV ────────────────────────────────────────────────────────────────
function changeMonth(d){viewM+=d;if(viewM<0){viewM=11;viewY--;}if(viewM>11){viewM=0;viewY++;}renderAll();}
function goHome(){viewY=todayDate.getFullYear();viewM=todayDate.getMonth();renderAll();}
function changeYear(d){annualYear+=d;renderAnnual();}
function updateNav(){
  document.getElementById('navMonth').textContent=MESES[viewM];
  document.getElementById('navYear').textContent=viewY;
  document.getElementById('qListLbl').textContent='Lançamentos de '+MESES[viewM]+' '+viewY;
}

// ── TABS ───────────────────────────────────────────────────────────────
let curTab='quick';
function goTab(t){
  document.querySelectorAll('.tab').forEach((el,i)=>el.classList.toggle('active',['quick','detail','charts','annual','invest'][i]===t));
  document.querySelectorAll('.tab-content').forEach(el=>el.classList.remove('active'));
  document.getElementById('tab-'+t).classList.add('active');
  curTab=t;
  if(t==='charts')setTimeout(renderCharts,60);
  if(t==='annual'){annualYear=viewY;setTimeout(renderAnnual,60);}
  if(t==='invest'){renderInvStats();setTimeout(renderInvChart,60);}
}

// ── SUMMARY ────────────────────────────────────────────────────────────
function renderSummary(){
  const{inc,exp,bal,inv}=totalsFor(viewY,viewM);
  document.getElementById('sbInc').textContent=fmt(inc);
  document.getElementById('sbExp').textContent=fmt(exp);
  const bEl=document.getElementById('sbBal');
  bEl.textContent=(bal<0?'- ':'')+fmt(bal);
  bEl.className='sbar-val '+(bal>=0?'a':'r');
  document.getElementById('sbInv').textContent=fmt(inv);
  const pct=inc>0?Math.min(100,Math.round(exp/inc*100)):0;
  document.getElementById('cPct').textContent=pct+'%';
  const bar=document.getElementById('cBar');
  bar.style.width=pct+'%';
  bar.style.background=pct>90?'var(--red)':pct>70?'var(--amber)':'var(--green)';
}

// ── QUICK ──────────────────────────────────────────────────────────────
function updateDivPreview(){
  const on=document.getElementById('qDivCheck').checked;
  const v=parseFloat(document.getElementById('qVal').value);
  const prev=document.getElementById('divPreview');
  if(on&&!isNaN(v)&&v>0){prev.style.display='block';prev.textContent='Valor dividido: '+fmt(v/2)+' (metade de '+fmt(v)+')';}
  else{prev.style.display='none';prev.textContent='';}
}
function toggleParBox(){
  const on=document.getElementById('qParCheck').checked;
  document.getElementById('parBox').classList.toggle('open',on);
  document.getElementById('qAddRow').style.display=on?'none':'flex';
  if(on)calcEndMonth();
}
function calcEndMonth(){
  const pa=parseInt(document.getElementById('qPA').value)||null;
  const pt=parseInt(document.getElementById('qPT').value)||null;
  const end=addMonths(mKey(viewY,viewM),pa,pt);
  document.getElementById('parInfo').textContent=end?'Termina em: '+end:'';
}

function quickAdd(){
  const name=document.getElementById('qName').value.trim();
  const rawVal=parseFloat(document.getElementById('qVal').value);
  const divOn=document.getElementById('qDivCheck').checked;
  const value=divOn?parseFloat((rawVal/2).toFixed(2)):rawVal;
  const cat=document.getElementById('qCat').value;
  const date=document.getElementById('qDate').value||todayStr();
  const parOn=document.getElementById('qParCheck').checked;
  if(!name||isNaN(value)||value<=0){toast('Preencha nome e valor.');return;}
  const c=catMap[cat];
  if(parOn){
    const pa=parseInt(document.getElementById('qPA').value)||1;
    const pt=parseInt(document.getElementById('qPT').value)||1;
    D.card.push({id:uid(),name,value,cat,tipo:'parcelada',pa,pt,startMonth:mKey(viewY,viewM),split:divOn});
  } else if(c&&c.t==='income'){
    getMonth(viewY,viewM).income.unshift({id:uid(),name,value,cat,date,ts:Date.now(),split:divOn});
  } else if(c&&c.t==='investment'){
    D.investments.push({id:uid(),name,value,month:mKey(viewY,viewM),ts:Date.now()});
  } else {
    getMonth(viewY,viewM).variable.unshift({id:uid(),name,value,cat,date,ts:Date.now(),split:divOn});
  }
  document.getElementById('qName').value='';
  document.getElementById('qVal').value='';
  document.getElementById('qParCheck').checked=false;
  document.getElementById('qDivCheck').checked=false;
  document.getElementById('qPA').value='';document.getElementById('qPT').value='';
  document.getElementById('parInfo').textContent='';
  document.getElementById('divPreview').style.display='none';
  toggleParBox();
  persist();renderAll();toast('Lançado!');
  document.getElementById('qName').focus();
}

function renderQuick(){
  const md=getMonth(viewY,viewM);
  const all=[...md.income,...md.variable].sort((a,b)=>{
    const da=a.date||'',db=b.date||'';
    return da<db?1:da>db?-1:b.ts-a.ts;
  });
  const el=document.getElementById('qList');
  if(!all.length){el.innerHTML='<div class="empty">nenhum lançamento neste mês</div>';return;}
  el.innerHTML=all.map(item=>{
    const c=catMap[item.cat]||{l:'?',c:'#888',t:'expense'};
    const isInc=c.t==='income';
    const vc=isInc?'color:var(--green-text)':'color:var(--red-text)';
    const list=isInc?'income':'variable';
    return`<div class="qitem">
      <div class="cdot" style="background:${c.c}"></div>
      <div class="qitem-date">${fmtDate(item.date)}</div>
      <div class="qitem-name">${item.name}</div>
      ${item.split?'<span style="font-family:\'DM Mono\',monospace;font-size:.58rem;padding:2px 6px;border-radius:4px;background:rgba(251,191,36,.15);color:var(--amber-text);">÷2</span>':''}
      <span class="qitem-cat" style="background:${c.c}22;color:${c.c}">${c.l}</span>
      <div class="qitem-val" style="${vc}">${isInc?'+':'-'} ${fmt(item.value)}</div>
      <button class="qitem-del" onclick="delQuick('${item.id}','${list}')">✕</button>
    </div>`;
  }).join('');
}
function delQuick(id,list){const md=getMonth(viewY,viewM);md[list]=md[list].filter(x=>x.id!==id);persist();renderAll();toast('Removido.');}

// ── DETAIL ─────────────────────────────────────────────────────────────
function renderDetail(){
  const md=getMonth(viewY,viewM);
  const{inc,fix,card,varr}=totalsFor(viewY,viewM);
  // Income
  document.getElementById('dIncT').textContent=fmt(inc);
  const incEl=document.getElementById('dIncL');
  incEl.innerHTML=md.income.length?md.income.map(item=>`<div class="iitem">
    <div class="cdot" style="background:var(--green)"></div>
    <div class="iitem-main"><div class="iitem-name">${item.name}</div>${item.date?`<div class="iitem-sub">${fmtDate(item.date)}</div>`:''}</div>
    <div class="iitem-val g">+ ${fmt(item.value)}</div>
    <div class="iitem-acts">
      <button class="bi ed" onclick="openEdit('${item.id}','income')">✎</button>
      <button class="bi" onclick="delQuick('${item.id}','income')">✕</button>
    </div>
  </div>`).join(''):'<div class="empty">nenhuma renda lançada</div>';
  // Fixed
  document.getElementById('dFixT').textContent=fmt(fix);
  const fixEl=document.getElementById('dFixL');
  fixEl.innerHTML=D.fixed.length?D.fixed.map(item=>{
    const c=catMap[item.cat]||{c:'#888',l:'?'};
    return`<div class="iitem">
      <div class="cdot" style="background:${c.c}"></div>
      <div class="iitem-main"><div class="iitem-name">${item.name}</div><div class="iitem-sub">${c.l}${item.day?' · dia '+item.day:''}</div></div>
      <div class="iitem-val b">- ${fmt(item.value)}</div>
      <div class="iitem-acts">
        <button class="bi ed" onclick="openEditFixed('${item.id}')">✎</button>
        <button class="bi" onclick="delFixed('${item.id}')">✕</button>
      </div>
    </div>`;
  }).join(''):'<div class="empty">nenhuma despesa fixa</div>';
  // Card
  const cards=activeCards(viewY,viewM);
  document.getElementById('dCardT').textContent=fmt(card);
  const cardEl=document.getElementById('dCardL');
  cardEl.innerHTML=cards.length?cards.map(item=>{
    const c=catMap[item.cat]||{c:'#888',l:'?'};
    const info=cardInfo(item,viewY,viewM);
    const end=item.tipo==='parcelada'?addMonths(item.startMonth,item.pa,item.pt):null;
    return`<div class="iitem">
      <div class="cdot" style="background:${c.c}"></div>
      <div class="iitem-main"><div class="iitem-name">${item.name}</div><div class="iitem-sub">${c.l} · ${info}${end?' · até '+end:''}</div></div>
      <div class="iitem-val r">- ${fmt(item.value)}</div>
      <div class="iitem-acts">
        <button class="bi ed" onclick="openEditCard('${item.id}')">✎</button>
        <button class="bi" onclick="delCard('${item.id}')">✕</button>
      </div>
    </div>`;
  }).join(''):'<div class="empty">nenhuma parcela ativa</div>';
  // Variable grouped
  document.getElementById('dVarT').textContent=fmt(varr);
  const groups={};
  md.variable.forEach(item=>{
    if(!groups[item.cat])groups[item.cat]={cat:catMap[item.cat]||{c:'#888',l:'?',k:item.cat},items:[],total:0};
    groups[item.cat].items.push(item);groups[item.cat].total+=item.value;
  });
  const sorted=Object.values(groups).sort((a,b)=>b.total-a.total);
  const grand=sorted.reduce((s,g)=>s+g.total,0);
  let html='';
  if(!sorted.length)html='<div class="ilist"><div class="empty">nenhum gasto variável — use o lançamento rápido</div></div>';
  else sorted.forEach((g,i)=>{
    const pct=grand>0?(g.total/grand*100):0;
    html+=`<div class="vcat-block">
      <div class="vcat-hd" onclick="toggleVcat(this)" style="border-left:3px solid ${g.cat.c}">
        <span style="font-family:'DM Mono',monospace;font-size:.62rem;font-weight:700;color:${g.cat.c}">#${i+1}</span>
        <div class="cdot" style="background:${g.cat.c}"></div>
        <div class="vcat-name">${g.cat.l}</div>
        <div class="vcat-count">${g.items.length}x</div>
        <div class="vcat-pbar-w"><div class="vcat-pbar-f" style="width:${pct.toFixed(0)}%;background:${g.cat.c}"></div></div>
        <div class="vcat-total">- ${fmt(g.total)}</div>
        <span class="vcat-chev open">▼</span>
      </div>
      <div class="vcat-items">${g.items.sort((a,b)=>b.value-a.value).map(item=>`<div class="iitem">
        <div class="cdot" style="background:${g.cat.c}"></div>
        <div class="iitem-main"><div class="iitem-name">${item.name}</div>${item.date?`<div class="iitem-sub">${fmtDate(item.date)}</div>`:''}</div>
        <div class="iitem-val a">- ${fmt(item.value)}</div>
        <div class="iitem-acts">
          <button class="bi ed" onclick="openEdit('${item.id}','variable')">✎</button>
          <button class="bi" onclick="delQuick('${item.id}','variable')">✕</button>
        </div>
      </div>`).join('')}</div>
    </div>`;
  });
  html+=`<button class="btn-add-sec" onclick="openNew('mercado','variable')">+ adicionar gasto variável</button>`;
  document.getElementById('dVarContent').innerHTML=html;
}
function toggleVcat(hd){
  const it=hd.nextElementSibling,ch=hd.querySelector('.vcat-chev');
  if(!it)return;
  const h=it.classList.toggle('hidden');
  if(ch)ch.classList.toggle('open',!h);
}

// ── MODAL ──────────────────────────────────────────────────────────────
let mCtx=null;
function openNew(defaultCat,type='variable'){
  mCtx={type,id:null};
  document.getElementById('mTitle').textContent='Adicionar — '+{income:'Renda',fixed:'Despesa fixa',card:'Cartão',variable:'Gasto variável'}[type];
  ['fName','fVal','fDay','fPA','fPT'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('fDate').value=todayStr();
  document.getElementById('fTipo').value='fixa';
  buildSel('fCat',defaultCat);
  document.getElementById('fDayW').style.display=type==='fixed'?'':'none';
  document.getElementById('fCatW').style.display=type==='card'?'none':'';
  document.getElementById('cardX').style.display=type==='card'?'':'none';
  document.getElementById('parRow').style.display='none';
  document.getElementById('mParInfo').textContent='';
  document.getElementById('overlay').classList.add('open');
  setTimeout(()=>document.getElementById('fName').focus(),80);
}
function openEdit(id,list){
  const md=getMonth(viewY,viewM);const item=md[list].find(x=>x.id===id);if(!item)return;
  mCtx={type:list,id};
  document.getElementById('mTitle').textContent='Editar lançamento';
  document.getElementById('fName').value=item.name;document.getElementById('fVal').value=item.value;
  document.getElementById('fDate').value=item.date||todayStr();
  buildSel('fCat',item.cat);
  document.getElementById('fDayW').style.display='none';document.getElementById('fCatW').style.display='';
  document.getElementById('cardX').style.display='none';
  document.getElementById('overlay').classList.add('open');
  setTimeout(()=>document.getElementById('fName').focus(),80);
}
function openEditFixed(id){
  const item=D.fixed.find(x=>x.id===id);if(!item)return;
  mCtx={type:'fixed',id};
  document.getElementById('mTitle').textContent='Editar despesa fixa';
  document.getElementById('fName').value=item.name;document.getElementById('fVal').value=item.value;
  document.getElementById('fDay').value=item.day||'';document.getElementById('fDate').value=todayStr();
  buildSel('fCat',item.cat);
  document.getElementById('fDayW').style.display='';document.getElementById('fCatW').style.display='';
  document.getElementById('cardX').style.display='none';
  document.getElementById('overlay').classList.add('open');
  setTimeout(()=>document.getElementById('fName').focus(),80);
}
function openEditCard(id){
  const item=D.card.find(x=>x.id===id);if(!item)return;
  mCtx={type:'card',id};
  document.getElementById('mTitle').textContent='Editar parcela';
  document.getElementById('fName').value=item.name;document.getElementById('fVal').value=item.value;
  document.getElementById('fDate').value=todayStr();
  document.getElementById('fTipo').value=item.tipo||'fixa';
  document.getElementById('fPA').value=item.pa||'';document.getElementById('fPT').value=item.pt||'';
  document.getElementById('parRow').style.display=item.tipo==='parcelada'?'':'none';
  document.getElementById('fDayW').style.display='none';document.getElementById('fCatW').style.display='none';
  document.getElementById('cardX').style.display='';
  calcModalEnd();
  document.getElementById('overlay').classList.add('open');
  setTimeout(()=>document.getElementById('fName').focus(),80);
}
function tglPar(){document.getElementById('parRow').style.display=document.getElementById('fTipo').value==='parcelada'?'':'none';calcModalEnd();}
function calcModalEnd(){
  const pa=parseInt(document.getElementById('fPA').value)||null;
  const pt=parseInt(document.getElementById('fPT').value)||null;
  const end=addMonths(mKey(viewY,viewM),pa,pt);
  document.getElementById('mParInfo').textContent=end?'Termina em: '+end:'';
}
function closeModal(){document.getElementById('overlay').classList.remove('open');mCtx=null;}
function closeBg(e){if(e.target===document.getElementById('overlay'))closeModal();}
function saveModal(){
  const name=document.getElementById('fName').value.trim();
  const value=parseFloat(document.getElementById('fVal').value);
  if(!name||isNaN(value)||value<=0){toast('Preencha nome e valor.');return;}
  const cat=document.getElementById('fCat').value;
  const date=document.getElementById('fDate').value||todayStr();
  const day=parseInt(document.getElementById('fDay').value)||null;
  const tipo=document.getElementById('fTipo').value;
  const pa=parseInt(document.getElementById('fPA').value)||null;
  const pt=parseInt(document.getElementById('fPT').value)||null;
  const{type,id}=mCtx;
  if(type==='fixed'){
    if(id){const i=D.fixed.findIndex(x=>x.id===id);if(i>-1)D.fixed[i]={...D.fixed[i],name,value,cat,day};}
    else D.fixed.push({id:uid(),name,value,cat,day});
  } else if(type==='card'){
    if(id){const i=D.card.findIndex(x=>x.id===id);if(i>-1)D.card[i]={...D.card[i],name,value,tipo,pa,pt};}
    else D.card.push({id:uid(),name,value,cat:'outros',tipo,pa,pt,startMonth:mKey(viewY,viewM)});
  } else {
    const md=getMonth(viewY,viewM);
    if(id){const i=md[type].findIndex(x=>x.id===id);if(i>-1)md[type][i]={...md[type][i],name,value,cat,date};}
    else md[type].unshift({id:uid(),name,value,cat,date,ts:Date.now()});
  }
  persist();renderAll();closeModal();toast(id?'Atualizado!':'Adicionado!');
}
function delFixed(id){D.fixed=D.fixed.filter(x=>x.id!==id);persist();renderAll();toast('Removido.');}
function delCard(id){D.card=D.card.filter(x=>x.id!==id);persist();renderAll();toast('Removido.');}

// ── INVEST ─────────────────────────────────────────────────────────────
function addInv(){
  const name=document.getElementById('iName').value.trim();
  const value=parseFloat(document.getElementById('iVal').value);
  const month=document.getElementById('iMonth').value;
  if(!name||isNaN(value)||value<=0){toast('Preencha nome e valor.');return;}
  D.investments.push({id:uid(),name,value,month,ts:Date.now()});
  document.getElementById('iName').value='';document.getElementById('iVal').value='';
  persist();renderAll();if(curTab==='invest'){renderInvStats();setTimeout(renderInvChart,60);}toast('Aporte registrado!');
}
function renderInvStats(){
  const all=D.investments;const total=all.reduce((s,x)=>s+x.value,0);
  document.getElementById('invTot').textContent=fmt(total);
  document.getElementById('invCnt').textContent=all.length+' aportes';
  const last=all.length?all[all.length-1]:null;
  if(last){const[y,m]=last.month.split('-');document.getElementById('invLst').textContent=fmt(last.value);document.getElementById('invLstD').textContent=MESES[parseInt(m)-1]+' '+y;}
  else{document.getElementById('invLst').textContent='—';document.getElementById('invLstD').textContent='—';}
  const byM={};all.forEach(x=>{byM[x.month]=(byM[x.month]||0)+x.value;});
  const mons=Object.keys(byM);
  document.getElementById('invAvg').textContent=fmt(mons.length?total/mons.length:0);
  const el=document.getElementById('invList');
  if(!all.length){el.innerHTML='<div class="empty">nenhum aporte</div>';return;}
  el.innerHTML=[...all].reverse().map(item=>{
    const[y,m]=item.month.split('-');
    return`<div class="iitem">
      <div class="cdot" style="background:var(--purple)"></div>
      <div class="iitem-main"><div class="iitem-name">${item.name}</div><div class="iitem-sub">${MESES[parseInt(m)-1]} ${y}</div></div>
      <div class="iitem-val p">↗ ${fmt(item.value)}</div>
      <div class="iitem-acts"><button class="bi" onclick="delInv('${item.id}')">✕</button></div>
    </div>`;
  }).join('');
}
function delInv(id){D.investments=D.investments.filter(x=>x.id!==id);persist();renderAll();if(curTab==='invest'){renderInvStats();setTimeout(renderInvChart,60);}toast('Removido.');}

// ── CHARTS ─────────────────────────────────────────────────────────────
function safeChart(id,cfg){
  const existing=Chart.getChart(id);
  if(existing)existing.destroy();
  const canvas=document.getElementById(id);
  if(!canvas)return null;
  try{return new Chart(canvas,cfg);}catch(e){console.warn('chart',id,e);return null;}
}

function renderCharts(){
  const md=getMonth(viewY,viewM);
  const{fix,card}=totalsFor(viewY,viewM);

  // Variable groups
  const groups={};
  md.variable.forEach(item=>{
    if(!groups[item.cat])groups[item.cat]={cat:catMap[item.cat]||{c:'#888',l:'?'},total:0};
    groups[item.cat].total+=item.value;
  });
  const srt=Object.values(groups).sort((a,b)=>b.total-a.total).slice(0,8);

  // ── Donut
  const dL=['Fixas','Cartão',...srt.map(g=>g.cat.l)];
  const dV=[parseFloat(fix.toFixed(2)),parseFloat(card.toFixed(2)),...srt.map(g=>parseFloat(g.total.toFixed(2)))];
  const dC=['#60a5fa','#f87171',...srt.map(g=>g.cat.c)];
  const donutWrap=document.getElementById('donutWrap');
  if(dV.some(v=>v>0)){
    donutWrap.innerHTML='<canvas id="cDonut"></canvas>';
    safeChart('cDonut',{
      type:'doughnut',
      data:{labels:dL,datasets:[{data:dV,backgroundColor:dC,borderWidth:0,hoverOffset:5}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>' '+fmt(ctx.parsed)}}},cutout:'62%'}
    });
    document.getElementById('donutLeg').innerHTML=dL.map((l,i)=>`<div class="leg-i"><div class="leg-dot" style="background:${dC[i]}"></div><span>${l}: ${fmt(dV[i])}</span></div>`).join('');
  } else {
    donutWrap.innerHTML='<div class="chart-empty">sem dados neste mês</div>';
    document.getElementById('donutLeg').innerHTML='';
  }

  // ── Bar — top variáveis (horizontal)
  const barWrap=document.getElementById('barWrap');
  if(srt.length>0){
    // height must accommodate all bars: at least 40px per bar + padding
    const barH=Math.max(200,srt.length*44+60);
    barWrap.style.height=barH+'px';
    barWrap.innerHTML='<canvas id="cBar"></canvas>';
    safeChart('cBar',{
      type:'bar',
      data:{
        labels:srt.map(g=>g.cat.l.length>16?g.cat.l.slice(0,16)+'…':g.cat.l),
        datasets:[{
          data:srt.map(g=>parseFloat(g.total.toFixed(2))),
          backgroundColor:srt.map(g=>g.cat.c+'bb'),
          borderColor:srt.map(g=>g.cat.c),
          borderWidth:1,
          borderRadius:5,
          borderSkipped:false
        }]
      },
      options:{
        indexAxis:'y',
        responsive:true,
        maintainAspectRatio:false,
        plugins:{
          legend:{display:false},
          tooltip:{callbacks:{label:ctx=>' '+fmt(ctx.parsed.x)}}
        },
        scales:{
          x:{
            grid:{color:'rgba(255,255,255,.05)'},
            ticks:{color:'#5a6a5a',font:{family:'DM Mono',size:9},callback:v=>'R$'+v.toLocaleString('pt-BR')},
            beginAtZero:true
          },
          y:{
            grid:{display:false},
            ticks:{color:'#8a9a8a',font:{family:'DM Mono',size:10}},
            afterFit(axis){axis.width=110;}
          }
        },
        layout:{padding:{right:10}}
      }
    });
  } else {
    barWrap.style.height='200px';
    barWrap.innerHTML='<div class="chart-empty">sem gastos variáveis neste mês</div>';
  }

  // ── Flow last 12 months
  const m12=getLast12();
  const flowWrap=document.getElementById('flowWrap');
  flowWrap.innerHTML='<canvas id="cFlow"></canvas>';
  safeChart('cFlow',{
    type:'bar',
    data:{
      labels:m12.map(([y,m])=>MESES[m].slice(0,3)+'/'+String(y).slice(2)),
      datasets:[
        {label:'Renda',data:m12.map(([y,m])=>parseFloat(totalsFor(y,m).inc.toFixed(2))),backgroundColor:'#4ade8055',borderColor:'#4ade80',borderWidth:1,borderRadius:3},
        {label:'Gastos',data:m12.map(([y,m])=>parseFloat(totalsFor(y,m).exp.toFixed(2))),backgroundColor:'#f8717155',borderColor:'#f87171',borderWidth:1,borderRadius:3},
        {label:'Investido',data:m12.map(([y,m])=>parseFloat(totalsFor(y,m).inv.toFixed(2))),backgroundColor:'#c084fc55',borderColor:'#c084fc',borderWidth:1,borderRadius:3},
      ]
    },
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{color:'#8a9a8a',font:{family:'DM Mono',size:9},boxWidth:9,boxHeight:9}},tooltip:{callbacks:{label:ctx=>' '+ctx.dataset.label+': '+fmt(ctx.parsed.y)}}},
      scales:{
        x:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#5a6a5a',font:{family:'DM Mono',size:9},maxRotation:45}},
        y:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#5a6a5a',font:{family:'DM Mono',size:9},callback:v=>'R$'+v.toLocaleString('pt-BR')}}
      }}
  });
}

function renderInvChart(){
  const byM={};D.investments.forEach(x=>{byM[x.month]=(byM[x.month]||0)+x.value;});
  const months=Object.keys(byM).sort();
  const invWrap=document.getElementById('invWrap');
  if(!months.length){invWrap.innerHTML='<div class="chart-empty">nenhum aporte registrado</div>';return;}
  let acc=0;const cumul=months.map(m=>{acc+=byM[m];return parseFloat(acc.toFixed(2));});
  invWrap.innerHTML='<canvas id="cInv"></canvas>';
  safeChart('cInv',{
    type:'line',
    data:{
      labels:months.map(m=>{const[y,mo]=m.split('-');return MESES[parseInt(mo)-1].slice(0,3)+'/'+y.slice(2);}),
      datasets:[
        {label:'Patrimônio acumulado',data:cumul,borderColor:'#c084fc',backgroundColor:'rgba(192,132,252,.1)',borderWidth:2,pointRadius:4,pointBackgroundColor:'#c084fc',fill:true,tension:.35},
        {label:'Aporte mensal',data:months.map(m=>parseFloat((byM[m]||0).toFixed(2))),borderColor:'#4ade80',backgroundColor:'transparent',borderWidth:1.5,pointRadius:3,pointBackgroundColor:'#4ade80',borderDash:[4,3],tension:.35}
      ]
    },
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{color:'#8a9a8a',font:{family:'DM Mono',size:9},boxWidth:9,boxHeight:9}},tooltip:{callbacks:{label:ctx=>' '+ctx.dataset.label+': '+fmt(ctx.parsed.y)}}},
      scales:{
        x:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#5a6a5a',font:{family:'DM Mono',size:9}}},
        y:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#5a6a5a',font:{family:'DM Mono',size:9},callback:v=>'R$'+v.toLocaleString('pt-BR')}}
      }}
  });
}

function renderAnnual(){
  document.getElementById('annualYear').textContent=annualYear;
  document.getElementById('annualGrid').innerHTML=MESES.map((name,m)=>{
    const{inc,exp,bal}=totalsFor(annualYear,m);
    const hasData=inc>0||exp>0;
    const isCur=annualYear===todayDate.getFullYear()&&m===todayDate.getMonth();
    const balCls=bal>0?'pos':bal<0?'neg':'zero';
    return`<div class="ann-card${hasData?' has-data':''}${isCur?' current':''}" onclick="jumpToMonth(${annualYear},${m})">
      <div class="ann-month">${name.slice(0,3)}</div>
      <div class="ann-bal ${balCls}">${bal>=0?'+':'- '}${fmt(bal)}</div>
      <div class="ann-exp">${hasData?'gastos '+fmt(exp):'sem dados'}</div>
    </div>`;
  }).join('');
  const bals=Array.from({length:12},(_,m)=>parseFloat(totalsFor(annualYear,m).bal.toFixed(2)));
  const annWrap=document.getElementById('annWrap');
  annWrap.innerHTML='<canvas id="cAnnual"></canvas>';
  safeChart('cAnnual',{
    type:'line',
    data:{
      labels:MESES.map(m=>m.slice(0,3)),
      datasets:[{label:'Saldo',data:bals,borderColor:'#4ade80',backgroundColor:'rgba(74,222,128,.07)',borderWidth:2,pointRadius:4,pointBackgroundColor:bals.map(v=>v>=0?'#4ade80':'#f87171'),fill:true,tension:.3}]
    },
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>' '+fmt(ctx.parsed.y)}}},
      scales:{
        x:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#5a6a5a',font:{family:'DM Mono',size:9}}},
        y:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#5a6a5a',font:{family:'DM Mono',size:9},callback:v=>'R$'+v.toLocaleString('pt-BR')}}
      }}
  });
}

function jumpToMonth(y,m){viewY=y;viewM=m;goTab('quick');renderAll();}

function getLast12(){
  const r=[];
  for(let i=11;i>=0;i--){let y=viewY,m=viewM-i;while(m<0){m+=12;y--;}r.push([y,m]);}
  return r;
}

function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2000);}

function renderAll(){
  updateNav();renderSummary();renderQuick();renderDetail();
  if(curTab==='charts')setTimeout(renderCharts,60);
  if(curTab==='annual')setTimeout(renderAnnual,60);
}

document.addEventListener('keydown',e=>{
  if(e.key==='Escape')closeModal();
  if(e.key==='Enter'&&document.getElementById('overlay').classList.contains('open'))saveModal();
  if(!document.getElementById('overlay').classList.contains('open')){
    if(e.key==='ArrowLeft')changeMonth(-1);
    if(e.key==='ArrowRight')changeMonth(1);
  }
});
document.getElementById('qVal').addEventListener('keydown',e=>{if(e.key==='Enter')quickAdd();});
document.getElementById('iVal').addEventListener('keydown',e=>{if(e.key==='Enter')addInv();});