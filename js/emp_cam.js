(() => {
  const TOTAL = 2, COLUNAS = 2;
  const tbody = document.querySelector('#tabela-cameras tbody');
  const inViews = /\/views(\/|$)/i.test(location.pathname);
  const ICON_SRC = (inViews ? '../' : '') + 'assets/icons/camera.png';
  const RESUMO = document.getElementById('resumo-cam');
  const KEY = 'estado_cameras';
  const BTN_EXPORT = document.getElementById('export-cam');

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
        label.setAttribute('aria-label', `Câmera ${n}`);

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `cam-${n}`;
        input.className = 'estado sr-only';
        input.setAttribute('aria-label', `Câmera ${n} — marcar como ocupado`);
        input.checked = !!state[n-1];
        aplicaEstado(label, input.checked);

        input.addEventListener('change', () => {
          state[n-1] = input.checked;
          aplicaEstado(label, input.checked);
          save(state); updateResumo(state);
        });

        const img = document.createElement('img');
        img.src = ICON_SRC; img.alt = `Ícone da câmera ${n}`; img.title = `Câmera ${n}`; img.className = 'notebook-icon';
        const caption = document.createElement('span');
        caption.className = 'notebook-id'; caption.textContent = `Câmera ${n}`;

        label.appendChild(input); label.appendChild(img); label.appendChild(caption);
        td.appendChild(label);
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  // ===== Exportar CSV =====
  function downloadCSV(filename, rows){
    const header = ['recurso','numero','rotulo','status'];
    const esc = s => `"${String(s).replace(/"/g,'""')}"`;
    const lines = [header.join(';'), ...rows.map(r => r.map(esc).join(';'))];
    const blob = new Blob(["\ufeff" + lines.join('\n')], {type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(a.href);
  }
  function exportar(){
    const now = new Date();
    const pad = n => String(n).padStart(2,'0');
    const fname = `emprestimos_cameras_${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}.csv`;
    const rows = [];
    for(let i=1;i<=TOTAL;i++){
      const ocupado = !!state[i-1];
      rows.push(['camera', i, `Câmera ${i}`, ocupado ? 'Ocupado' : 'Livre']);
    }
    downloadCSV(fname, rows);
  }
  if (BTN_EXPORT) BTN_EXPORT.addEventListener('click', exportar);
})();
