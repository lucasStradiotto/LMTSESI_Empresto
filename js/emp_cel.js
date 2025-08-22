(() => {
  const TOTAL = 16, COLUNAS = 4;
  const tbody = document.querySelector('#tabela-celulares tbody');
  const inViews = /\/views(\/|$)/i.test(location.pathname);
  const ICON_SRC = (inViews ? '../' : '') + '../img/phone.png';
  const RESUMO = document.getElementById('resumo-cel');
  const KEY = 'estado_celulares';

  const load = () => {
    try{
      const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
      const arr = Array.isArray(raw) ? raw.slice(0,TOTAL) : [];
      while(arr.length < TOTAL) arr.push(false);
      return arr;
    }catch{ return Array.from({length:TOTAL},()=>false) }
  };
  const save = (arr) => localStorage.setItem(KEY, JSON.stringify(arr));
  const sum = a => a.reduce((x,y)=>x+(y?1:0),0);
  const updateResumo = (arr) => { if(RESUMO) RESUMO.textContent = `${TOTAL - sum(arr)}/${TOTAL} livres`; };

  const state = load(); updateResumo(state);

  const aplicaEstado = (label, checked) => {
    label.classList.toggle('ocupado', checked);
    label.classList.toggle('livre', !checked);
  };

  const LINHAS = Math.ceil(TOTAL / COLUNAS);
  for (let i = 0; i < LINHAS; i++) {
    const tr = document.createElement('tr');
    for (let j = 0; j < COLUNAS; j++) {
      const n = i * COLUNAS + j + 1;
      const td = document.createElement('td');
      if (n <= TOTAL) {
        const label = document.createElement('label');
        label.className = 'notebook livre';
        label.dataset.item = String(n);
        label.setAttribute('aria-label', `Celular ${n}`);

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `cel-${n}`;
        input.className = 'estado sr-only';
        input.setAttribute('aria-label', `Celular ${n} — marcar como ocupado`);
        input.checked = !!state[n-1];
        aplicaEstado(label, input.checked);

        input.addEventListener('change', () => {
          state[n-1] = input.checked;
          aplicaEstado(label, input.checked);
          save(state); updateResumo(state);
        });

        const img = document.createElement('img');
        img.src = ICON_SRC; img.alt = `Ícone do celular ${n}`; img.title = `Celular ${n}`; img.className = 'notebook-icon';
        const caption = document.createElement('span');
        caption.className = 'notebook-id'; caption.textContent = `Celular ${n}`;

        label.appendChild(input); label.appendChild(img); label.appendChild(caption);
        td.appendChild(label);
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
})();
