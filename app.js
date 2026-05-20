let trapChart = null,
    flujoChart = null,
    diffErrorChart = null,
    intErrorChart = null;

/* =========================
   TABS
========================= */

function showTab(i){

  document
    .querySelectorAll('.wrap > .panel')
    .forEach((p,idx)=>
      p.classList.toggle('active',idx===i)
    );

  document
    .querySelectorAll('.tabs-main .tab')
    .forEach((b,idx)=>
      b.classList.toggle('active',idx===i)
    );

  if(i===2){
    updateMatrix();
  }

  if(i===3){
    animateError('diff');
    animateError('int');
  }
}

function showTheoryTab(i){

  document
    .querySelectorAll('.theory-panel')
    .forEach((p,idx)=>
      p.classList.toggle('active',idx===i)
    );

  document
    .querySelectorAll('.tabs-sub .tab')
    .forEach((b,idx)=>
      b.classList.toggle('active',idx===i)
    );

  setTimeout(() => {
    animateError(i === 0 ? 'diff' : 'int');
  }, 50);
}

function toggleTheme(){

  const r = document.documentElement;

  r.setAttribute(
    'data-theme',
    r.getAttribute('data-theme') === 'dark'
      ? 'light'
      : 'dark'
  );
}

function toggleAssistant(){

  document
    .getElementById('assistantShell')
    .classList.toggle('open');
}

/* =========================
   REGLA DEL TRAPECIO
========================= */

const defT = {
  tiempo:[0,5,10,15,20],
  caudal:[1.2,2.5,3.1,2.8,1.9]
};

function buildTrap(){

  const n = parseInt(
    document.getElementById('trap-n').value
  );

  const tb =
    document.getElementById('trap-body');

  tb.innerHTML='';

  for(let i=0;i<n;i++){

    const tr = document.createElement('tr');

    tr.innerHTML=`
      <td>${i+1}</td>

      <td>
        <input
          type="number"
          step="any"
          value="${defT.tiempo[i] ?? i*5}"
          id="tt${i}"
        >
      </td>

      <td>
        <input
          type="number"
          step="any"
          value="${defT.caudal[i] ?? 1}"
          id="tc${i}"
        >
      </td>
    `;

    tb.appendChild(tr);
  }
}

function runTrap(){

  const n = parseInt(
    document.getElementById('trap-n').value
  );

  const t = [];
  const c = [];

  for(let i=0;i<n;i++){

    t.push(
      parseFloat(
        document.getElementById(`tt${i}`).value
      ) || 0
    );

    c.push(
      parseFloat(
        document.getElementById(`tc${i}`).value
      ) || 0
    );
  }

  const h = t[1]-t[0];

  for(let i=1;i<n-1;i++){

    if(
      Math.abs((t[i+1]-t[i])-h) > 1e-6
    ){
      alert('Los intervalos deben ser iguales');
      return;
    }
  }

  let s = 0;

  for(let i=1;i<n-1;i++){
    s += c[i];
  }

  const I =
    (h/2)*(c[0]+2*s+c[n-1]);

  const V = I*60;

  document
    .getElementById('trap-results')
    .classList.add('show');

  document
    .getElementById('trap-results')
    .innerHTML = `
      <div class="r">
        <span>Ancho intervalo</span>
        <strong>${h.toFixed(2)} min</strong>
      </div>

      <div class="r">
        <span>Integral</span>
        <strong>${I.toFixed(4)}</strong>
      </div>

      <div class="r">
        <span>Volumen total</span>
        <strong>${V.toFixed(2)} m³</strong>
      </div>
    `;

  document
    .getElementById('trap-chart-wrap')
    .style.display='block';

  if(trapChart) trapChart.destroy();

  trapChart = new Chart(
    document.getElementById('trap-chart'),
    {
      type:'line',

      data:{
        labels:t,

        datasets:[
          {
            label:'Caudal',
            data:c,
            borderColor:'#4f8cff',
            backgroundColor:'rgba(79,140,255,.15)',
            fill:true,
            tension:.3
          }
        ]
      },

      options:{
        responsive:true,
        maintainAspectRatio:false
      }
    }
  );
}

/* =========================
   FLUJO VEHICULAR
========================= */

const H = [6,7,8,9,10,11,12];

const defV = [120,180,350,420,300,250,200];

function buildFlujo(){

  const w =
    document.getElementById('flujo-inputs');

  w.innerHTML='';

  H.forEach((h,i)=>{

    const d = document.createElement('div');

    d.style.marginBottom='10px';

    d.innerHTML=`
      <label class="small">${h}:00</label>

      <input
        type="number"
        id="vh${i}"
        value="${defV[i]}"
      >
    `;

    w.appendChild(d);
  });
}

function runFlujo(){

  const v = H.map(
    (_,i)=>
      parseFloat(
        document.getElementById(`vh${i}`).value
      ) || 0
  );

  const d = new Array(7).fill(0);

  for(let i=1;i<6;i++){
    d[i]=(v[i+1]-v[i-1])/2;
  }

  let html='';

  for(let i=1;i<6;i++){

    html += `
      <div class="der">
        <strong>${H[i]}:00</strong>
        <span>${d[i].toFixed(1)} veh/h²</span>
      </div>
    `;
  }

  document
    .getElementById('flujo-results')
    .classList.add('show');

  document
    .getElementById('flujo-results')
    .innerHTML = html;

  document
    .getElementById('flujo-chart-wrap')
    .style.display='block';

  if(flujoChart) flujoChart.destroy();

  flujoChart = new Chart(
    document.getElementById('flujo-chart'),
    {
      type:'line',

      data:{
        labels:H.map(h=>h+':00'),

        datasets:[
          {
            label:'Vehículos/hora',
            data:v,
            borderColor:'#9b6dff',
            backgroundColor:'rgba(155,109,255,.12)',
            fill:true,
            tension:.3
          }
        ]
      },

      options:{
        responsive:true,
        maintainAspectRatio:false
      }
    }
  );
}

/* =========================
   MATRICES Y ERRORES
========================= */

const fx = x => x * x;

const INT_EXACT = 1 / 3;

const DER_EXACT = 1;

const DER2_EXACT = 2;

const X0 = 0.5;

function trapInt(n){

  const h = 1 / n;

  let s = 0;

  for(let i = 1; i < n; i++){
    s += fx(i * h);
  }

  return (h / 2) * (fx(0) + 2 * s + fx(1));
}

function simpson13(n){

  const h = 1 / n;

  let s = fx(0) + fx(1);

  for(let i = 1; i < n; i += 2){
    s += 4 * fx(i * h);
  }

  for(let i = 2; i < n - 1; i += 2){
    s += 2 * fx(i * h);
  }

  return (h / 3) * s;
}

function simpson38(n){

  if(n % 3 !== 0){
    return NaN;
  }

  const h = 1 / n;

  let s = fx(0) + fx(1);

  for(let i = 1; i < n; i++){
    s += (i % 3 === 0 ? 2 : 3) * fx(i * h);
  }

  return (3 * h / 8) * s;
}

function relErr(num, exact){

  if(!exact) return 0;

  return Math.abs((num - exact) / exact) * 100;
}

function renderMatrixRows(rows, tbodyId){

  let best = Infinity;

  rows.forEach(r => {

    if(!Number.isNaN(r.num)){

      const e = relErr(r.num, r.exact);

      if(e < best){
        best = e;
      }
    }
  });

  document.getElementById(tbodyId).innerHTML =
    rows.map(r => {

      if(Number.isNaN(r.num)){

        return `
          <tr>
            <td>${r.name}</td>
            <td colspan="4" class="muted">
              n incompatible
            </td>
          </tr>
        `;
      }

      const err = relErr(r.num, r.exact);

      const cls =
        err === best ? ' class="best"' : '';

      return `
        <tr${cls}>
          <td>${r.name}</td>
          <td>${r.num.toFixed(6)}</td>
          <td>${r.exact.toFixed(6)}</td>
          <td>${err.toFixed(4)}%</td>
          <td>${r.evals}</td>
        </tr>
      `;
    }).join('');
}

function updateMatrix(){

  const n = parseInt(
    document.getElementById('matrix-n').value,
    10
  );

  document.getElementById('matrix-n-val')
    .textContent = n;

  const h = 1 / n;

  const intRows = [
    {
      name:'Trapecio compuesto',
      num: trapInt(n),
      exact: INT_EXACT,
      evals: n + 1
    },

    {
      name:'Simpson 1/3',
      num: n % 2 === 0 ? simpson13(n) : NaN,
      exact: INT_EXACT,
      evals: n + 1
    },

    {
      name:'Simpson 3/8',
      num: n % 3 === 0 ? simpson38(n) : NaN,
      exact: INT_EXACT,
      evals: n + 1
    }
  ];

  const derRows = [
    {
      name:'Dif. progresiva',
      num:(fx(X0+h)-fx(X0))/h,
      exact:DER_EXACT,
      evals:2
    },

    {
      name:'Dif. regresiva',
      num:(fx(X0)-fx(X0-h))/h,
      exact:DER_EXACT,
      evals:2
    },

    {
      name:'Dif. centrada',
      num:(fx(X0+h)-fx(X0-h))/(2*h),
      exact:DER_EXACT,
      evals:2
    }
  ];

  renderMatrixRows(intRows,'matrix-body-int');

  renderMatrixRows(derRows,'matrix-body-der');
}

function animateError(kind){

  const isDiff = kind === 'diff';

  const canvasId =
    isDiff
      ? 'chart-diff-error'
      : 'chart-int-error';

  const hs = Array.from(
    {length:40},
    (_,i)=>0.01 + (0.49*i)/39
  );

  const datasets = isDiff
    ? [
        {
          label:'Progresiva',
          data:hs.map(h=>({
            x:h,
            y:Math.abs(h)*100
          })),
          borderColor:'#4f8cff'
        }
      ]
    : [
        {
          label:'Trapecio',
          data:hs.map(h=>({
            x:h,
            y:h*h*100
          })),
          borderColor:'#9b6dff'
        }
      ];

  const opts = {

    type:'line',

    data:{datasets},

    options:{
      responsive:true,
      maintainAspectRatio:false,
      parsing:false,

      scales:{
        x:{
          type:'linear'
        },

        y:{
          beginAtZero:true
        }
      }
    }
  };

  if(isDiff){

    if(diffErrorChart){
      diffErrorChart.destroy();
    }

    diffErrorChart =
      new Chart(
        document.getElementById(canvasId),
        opts
      );

  }else{

    if(intErrorChart){
      intErrorChart.destroy();
    }

    intErrorChart =
      new Chart(
        document.getElementById(canvasId),
        opts
      );
  }
}

/* =========================
   CHAT IA
========================= */

const chatBox =
  document.getElementById('chatBox');

const chatForm =
  document.getElementById('chatForm');

const userInput =
  document.getElementById('userInput');

const API_KEY = window.GROQ_API_KEY;

function addMessage(text, role='bot'){

  const div = document.createElement('div');

  div.className = `msg ${role}`;

  div.textContent = text;

  chatBox.appendChild(div);

  chatBox.scrollTop =
    chatBox.scrollHeight;
}

addMessage(
  'Hola, soy tu asistente IA sobre métodos numéricos.',
  'system'
);

chatForm.addEventListener(
  'submit',
  async (e)=>{

    e.preventDefault();

    const q = userInput.value.trim();

    if(!q) return;

    addMessage(q,'user');

    userInput.value='';

    const thinking =
      document.createElement('div');

    thinking.className='msg system';

    thinking.textContent='Pensando...';

    chatBox.appendChild(thinking);

    try{

      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method:'POST',

          headers:{
            'Content-Type':'application/json',
            'Authorization':`Bearer ${API_KEY}`
          },

          body:JSON.stringify({

            model:'llama-3.1-8b-instant',

            messages:[
              {
                role:'system',

                content:`
Eres un tutor especializado
en métodos numéricos.

Solo responde sobre:
- métodos numéricos
- integración numérica
- derivadas numéricas
- regla trapezoidal
- Simpson
- Newton-Raphson
- flujo vehicular
- interpolación
`
              },

              {
                role:'user',
                content:q
              }
            ],

            temperature:0.7,
            max_tokens:500
          })
        }
      );

      const data = await response.json();

      thinking.remove();

      if(data.error){

        addMessage(
          'Error: ' + data.error.message,
          'bot'
        );

        return;
      }

      const answer =
        data.choices?.[0]?.message?.content;

      addMessage(
        answer || 'No hubo respuesta.',
        'bot'
      );

    }catch(err){

      thinking.remove();

      console.error(err);

      addMessage(
        'Error real: ' + err.message,
        'bot'
      );
    }
  }
);

/* =========================
   LIGHTBOX
========================= */

function initImageLightbox(){

  const dialog =
    document.getElementById('imageLightbox');

  const lightboxImg =
    document.getElementById('lightboxImg');

  const closeBtn =
    dialog.querySelector('.lightbox-close');

  function openLightbox(img){

    lightboxImg.src = img.src;

    lightboxImg.alt = img.alt;

    dialog.showModal();
  }

  function closeLightbox(){

    dialog.close();

    lightboxImg.removeAttribute('src');
  }

  document
    .querySelectorAll('.hero-img')
    .forEach(hero=>{

      const img = hero.querySelector('img');

      hero.addEventListener(
        'click',
        ()=>openLightbox(img)
      );
    });

  closeBtn.addEventListener(
    'click',
    closeLightbox
  );
}

buildTrap();
buildFlujo();
updateMatrix();
animateError('diff');
animateError('int');
initImageLightbox();