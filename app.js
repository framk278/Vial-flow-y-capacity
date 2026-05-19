let trapChart = null, flujoChart = null;

function showTab(i){
  document.querySelectorAll('.panel').forEach((p,idx)=>p.classList.toggle('active',idx===i));
  document.querySelectorAll('.tab').forEach((b,idx)=>b.classList.toggle('active',idx===i));
}

function toggleTheme(){
  const r = document.documentElement;
  r.setAttribute('data-theme', r.getAttribute('data-theme')==='dark'?'light':'dark');
}

function toggleAssistant(){
  document.getElementById('assistantShell').classList.toggle('open');
}

const defT = { tiempo:[0,5,10,15,20], caudal:[1.2,2.5,3.1,2.8,1.9] };

function buildTrap(){
  const n = parseInt(document.getElementById('trap-n').value);
  const tb = document.getElementById('trap-body');
  tb.innerHTML = '';
  for(let i=0;i<n;i++){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td><input type='number' step='any' value='${defT.tiempo[i]??i*5}' id='tt${i}'></td><td><input type='number' step='any' value='${defT.caudal[i]??1}' id='tc${i}'></td>`;
    tb.appendChild(tr);
  }
}

function runTrap(){
  const n = parseInt(document.getElementById('trap-n').value);
  const t = [], c = [];
  for(let i=0;i<n;i++){
    t.push(parseFloat(document.getElementById(`tt${i}`).value)||0);
    c.push(parseFloat(document.getElementById(`tc${i}`).value)||0);
  }
  const h = t[1]-t[0];
  for(let i=1;i<n-1;i++){
    if(Math.abs((t[i+1]-t[i])-h)>1e-6){
      alert('Los intervalos deben ser iguales');
      return;
    }
  }
  let s=0;
  for(let i=1;i<n-1;i++) s += c[i];
  const I = (h/2)*(c[0]+2*s+c[n-1]);
  const V = I*60;
  document.getElementById('trap-results').classList.add('show');
  document.getElementById('trap-results').innerHTML =
    `<div class='r'><span>Ancho del intervalo</span><strong>${h.toFixed(2)} min</strong></div>
     <div class='r'><span>Intervalos</span><strong>${n-1}</strong></div>
     <div class='r'><span>Integral aproximada</span><strong>${I.toFixed(4)} m³/min</strong></div>
     <div class='r'><span>Volumen total</span><strong>${V.toFixed(2)} m³</strong></div>`;
  document.getElementById('trap-chart-wrap').style.display='block';
  if(trapChart) trapChart.destroy();
  trapChart = new Chart(document.getElementById('trap-chart'),{
    type:'line',
    data:{labels:t,datasets:[{label:'Caudal (m³/s)',data:c,borderColor:'#4f8cff',backgroundColor:'rgba(79,140,255,.15)',fill:true,tension:.3}]},
    options:{responsive:true,maintainAspectRatio:false}
  });
}

const H=[6,7,8,9,10,11,12], defV=[120,180,350,420,300,250,200];

function buildFlujo(){
  const w = document.getElementById('flujo-inputs');
  w.innerHTML = '';
  H.forEach((h,i)=>{
    const d = document.createElement('div');
    d.style.marginBottom = '10px';
    d.innerHTML = `<label class='small'>${h}:00</label><input type='number' id='vh${i}' value='${defV[i]}'>`;
    w.appendChild(d);
  });
}

function runFlujo(){
  const v = H.map((_,i)=>parseFloat(document.getElementById(`vh${i}`).value)||0);
  const d = new Array(7).fill(0);
  for(let i=1;i<6;i++) d[i] = (v[i+1]-v[i-1])/2;
  const cls = x => x>40 ? ['Congestión crítica','red'] : x>15 ? ['Incremento moderado','orange'] : ['Flujo estable','green'];
  let html = '';
  for(let i=1;i<6;i++){
    const c = cls(d[i]);
    html += `<div class='der'><strong>${H[i]}:00</strong><span>${d[i].toFixed(1)} veh/h²</span><span class='badge ${c[1]}'>${c[0]}</span></div>`;
  }
  document.getElementById('flujo-results').classList.add('show');
  document.getElementById('flujo-results').innerHTML = html;
  document.getElementById('flujo-chart-wrap').style.display='block';
  if(flujoChart) flujoChart.destroy();
  flujoChart = new Chart(document.getElementById('flujo-chart'),{
    type:'line',
    data:{
      labels:H.map(h=>h+':00'),
      datasets:[
        {label:'Vehículos/hora',data:v,borderColor:'#9b6dff',backgroundColor:'rgba(155,109,255,.12)',fill:true,tension:.3,yAxisID:'y'},
        {label:'Derivada central',data:d,borderColor:'#f5a623',borderDash:[5,4],fill:false,tension:.3,yAxisID:'y1'}
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      scales:{
        y:{position:'left'},
        y1:{position:'right',grid:{drawOnChartArea:false}}
      }
    }
  });
}

const chatBox = document.getElementById('chatBox');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');

const ALLOWED = ['métodos numéricos','trapecio compuesto','flujo vehicular','caudal','derivada central','matlab','integración numérica'];

function addMessage(text, role='bot'){
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function isOnTopic(text){
  const t = text.toLowerCase();
  return ALLOWED.some(k=>t.includes(k));
}

addMessage('Hola, soy tu asistente. Solo respondo preguntas sobre métodos numéricos y los archivos de esta página.','system');

async function askServer(q){
  const res = await fetch('/api/chat',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({question:q})
  });
  const text = await res.text();
  let data = {};
  try{ data = JSON.parse(text); }catch{return {ok:false,error:text||'Respuesta inválida del servidor.'};}
  if(!res.ok) return {ok:false,error:data.error||'Error del servidor.'};
  return {ok:true,answer:data.answer};
}

chatForm.addEventListener('submit',async(e)=>{
  e.preventDefault();
  const q = userInput.value.trim();
  if(!q) return;
  addMessage(q,'user');
  userInput.value='';
  if(!isOnTopic(q)){
    addMessage('No puedo responder eso porque está fuera del tema permitido. Solo atiendo preguntas sobre métodos numéricos y esta página.','bot');
    return;
  }
  addMessage('Pensando...','system');
  try{
    const result = await askServer(q);
    [...chatBox.querySelectorAll('.msg.system')].filter(x=>x.textContent==='Pensando...').forEach(x=>x.remove());
    if(!result.ok){
      addMessage('Puedo explicarte el trapecio compuesto así: se toman los datos de tiempo y caudal, se verifica que el paso sea uniforme, se suman los valores internos con peso 2 y luego se multiplica por h/2. Si quieres, también te explico la derivada central del flujo vehicular.','bot');
      return;
    }
    addMessage(result.answer,'bot');
  }catch{
    [...chatBox.querySelectorAll('.msg.system')].filter(x=>x.textContent==='Pensando...').forEach(x=>x.remove());
    addMessage('Puedo explicarte el trapecio compuesto así: se toman los datos de tiempo y caudal, se verifica que el paso sea uniforme, se suman los valores internos con peso 2 y luego se multiplica por h/2. Si quieres, también te explico la derivada central del flujo vehicular.','bot');
  }
});

function initImageLightbox(){
  const dialog = document.getElementById('imageLightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const closeBtn = dialog.querySelector('.lightbox-close');

  function openLightbox(img){
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    dialog.showModal();
  }

  function closeLightbox(){
    dialog.close();
    lightboxImg.removeAttribute('src');
  }

  document.querySelectorAll('.hero-img').forEach(hero => {
    const img = hero.querySelector('img');
    hero.addEventListener('click', () => openLightbox(img));
    hero.addEventListener('keydown', e => {
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        openLightbox(img);
      }
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  dialog.addEventListener('click', e => {
    if(e.target === dialog) closeLightbox();
  });
  dialog.addEventListener('cancel', closeLightbox);
}

buildTrap();
buildFlujo();
initImageLightbox();