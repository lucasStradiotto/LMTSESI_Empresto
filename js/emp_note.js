(() => {
  const TOTAL = 35, COLUNAS = 7;
  const tbody = document.querySelector('#tabela-notebooks tbody');
  const inViews = /\/views(\/|$)/i.test(location.pathname);
  const ICON_SRC  = (inViews ? '../' : '') + 'assets/icons/notebook.png';
  const MAINT_SRC = (inViews ? '../' : '') + 'assets/icons/manutencao.png'; // <- seu ícone
  const RESUMO = document.getElementById('resumo-note');
  const KEY_OCC = 'estado_notebooks';
  const KEY_MAN = 'estado_notebooks_manut';
  const BTN_EXPORT = document.getElementById('export-note');
  const BTN_IMPORT = document.getElementById('import-note');
  const FILE_IMPORT= document.getElementById('import-note-file');

  // Helpers persistência
  const load = (key,total) => {
    try{
      const raw = JSON.parse(localStorage.getItem(key) || '[]');
      const arr = Array.isArray(raw) ? raw.slice(0,total) : [];
      while(arr.length < total) arr.push(false);
      return arr;
    }catch{ return Array.from({length:total},()=>false) }
  };
  const save = (key,arr) => localStorage.setItem(key, JSON.stringify(arr));
  const sum = a => a.reduce((x,y)=>x+(y?1:0),0);

  // Estado
  const occ = load(KEY_OCC, TOTAL);      // ocupados
  const man = load(KEY_MAN, TOTAL);      // manutenção

  // Resumo: livres = total - (ocupados + manut)
  const updateResumo = () => {
    const livres = TOTAL - (sum(occ) + sum(man));
    if (RESUMO) RESUMO.textContent = `${livres}/${TOTAL} livres`;
  };
  updateResumo();

  function confirmModal({title, text, confirmText='Confirmar', cancelText='Cancelar'}){
    return new Promise(resolve => {
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop open';
      backdrop.innerHTML = `...seu HTML do modal...`;
      document.body.appendChild(backdrop);

      // NOVO
      document.body.classList.add('modal-open');

      const cleanup = (val) => {
        backdrop.remove();
        // NOVO
        document.body.classList.remove('modal-open');
        resolve(val);
      };

      backdrop.addEventListener('click', (e)=>{ if(e.target===backdrop) cleanup(false); });
      backdrop.querySelector('.m-cancel').addEventListener('click', ()=>cleanup(false));
      backdrop.querySelector('.m-ok').addEventListener('click', ()=>cleanup(true));
      document.addEventListener('keydown', function esc(e){
        if(e.key==='Escape'){ document.removeEventListener('keydown', esc); cleanup(false); }
      });
    });
  }


  // Aplica classes/disabled conforme estados
  const applyVisual = (box, input, i) => {
    if (man[i]) {
      input.checked = false; input.disabled = true;
      box.classList.remove('livre','ocupado'); box.classList.add('manutencao');
    } else {
      input.disabled = false;
      box.classList.remove('manutencao');
      box.classList.toggle('ocupado',  !!occ[i]);
      box.classList.toggle('livre',   !occ[i]);
    }
  };

  // Montagem da tabela
  const LINHAS = Math.ceil(TOTAL / COLUNAS);
  for (let r = 0; r < LINHAS; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < COLUNAS; c++) {
      const n = r * COLUNAS + c + 1;
      const td = document.createElement('td');
      if (n <= TOTAL) {
        // Wrapper da célula
        const cell = document.createElement('div');
        cell.className = 'cell';

        // Card (label) + checkbox oculto
        const label = document.createElement('label');
        label.className = 'notebook livre';
        label.dataset.nb = String(n);
        label.setAttribute('aria-label', `Notebook ${n}`);

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `nb-${n}`;
        input.className = 'estado sr-only';
        input.setAttribute('aria-label', `Notebook ${n} — marcar como ocupado`);
        input.checked = !!occ[n-1];

        input.addEventListener('change', () => {
          // Se estiver em manutenção, não deixa mudar
          if (man[n-1]) { input.checked = false; return; }
          occ[n-1] = input.checked;
          save(KEY_OCC, occ);
          applyVisual(label, input, n-1);
          updateResumo();
        });

        // Ícone principal (notebook)
        const img = document.createElement('img');
        img.src = ICON_SRC; img.alt = `Ícone do notebook ${n}`; img.title = `Notebook ${n}`;
        img.className = 'notebook-icon';

        // Rótulo
        const caption = document.createElement('span');
        caption.className = 'notebook-id'; caption.textContent = `Notebook ${n}`;

        // Botão manutenção
        const btnMaint = document.createElement('button');
        btnMaint.type = 'button';
        btnMaint.className = 'btn-maint';
        btnMaint.title = 'Marcar como em manutenção';
        const imgMaint = document.createElement('img');
        imgMaint.src = MAINT_SRC; imgMaint.alt = 'Manutenção';
        btnMaint.appendChild(imgMaint);

        btnMaint.addEventListener('click', async (ev) => {
          ev.stopPropagation(); // evita clicar no label
          const emManut = !!man[n-1];
          const ok = await confirmModal({
            title: emManut ? 'Remover manutenção?' : 'Colocar em manutenção?',
            text:  emManut ? `O Notebook ${n} voltará a ficar disponível.` : `O Notebook ${n} ficará indisponível para empréstimo.`,
            confirmText: emManut ? 'Remover' : 'Confirmar'
          });
          if (!ok) return;

          if (emManut) {
            man[n-1] = false; // libera
          } else {
            man[n-1] = true;  // entra em manutenção -> força desocupar
            occ[n-1] = false;
          }
          save(KEY_MAN, man); save(KEY_OCC, occ);
          applyVisual(label, input, n-1);
          updateResumo();
        });

        // Montagem
        label.appendChild(input); label.appendChild(img); label.appendChild(caption);
        cell.appendChild(label);
        cell.appendChild(btnMaint);
        td.appendChild(cell);
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  // Aplicar visual inicial
  document.querySelectorAll('.notebook').forEach((box) => {
    const n = parseInt(box.dataset.nb,10)-1;
    const input = box.querySelector('input.estado');
    applyVisual(box, input, n);
  });

  // ===== Export =====
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
    const now = new Date(); const pad = n => String(n).padStart(2,'0');
    const fname = `emprestimos_notebooks_${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}.csv`;
    const rows = [];
    for(let i=1;i<=TOTAL;i++){
      const status = man[i-1] ? 'Manutenção' : (occ[i-1] ? 'Ocupado' : 'Livre');
      rows.push(['notebook', i, `Notebook ${i}`, status]);
    }
    downloadCSV(fname, rows);
  }
  if (BTN_EXPORT) BTN_EXPORT.addEventListener('click', exportar);

  // ===== Import =====
  function parseCSV(text){
    const lines = text.replace(/\r/g,'').split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return [];
    const delim = lines[0].includes(';') ? ';' : ',';
    const rows = [];
    for (let i=0;i<lines.length;i++){
      const cols = lines[i].split(delim).map(s => s.replace(/^"|"$/g,'').trim());
      if (i===0 && /recurso/i.test(cols[0]) && /numero/i.test(cols[1])) continue; // header
      rows.push(cols);
    }
    return rows;
  }
  const normalizeStatus = s => {
    s = (s||'').toLowerCase();
    if (/manut|indispon/i.test(s)) return 'manut';
    if (/ocup/.test(s) || s==='1' || s==='true') return 'ocup';
    if (/livre/.test(s) || s==='0' || s==='false') return 'livre';
    return null;
  };
  function refreshDOM(){
    document.querySelectorAll('.notebook').forEach(box => {
      const n = parseInt(box.dataset.nb,10)-1;
      const input = box.querySelector('input.estado');
      applyVisual(box, input, n);
    });
    updateResumo();
  }
  function applyRows(rows){
    let updated = false;
    for (const cols of rows){
      if (cols.length >= 4) {
        // Global: recurso;numero;rotulo;status (filtra notebooks)
        const tipo = (cols[0]||'').toLowerCase();
        if (!/note|notebook/.test(tipo)) continue;
        const num = parseInt(cols[1],10);
        const st  = normalizeStatus(cols[3]);
        if (!Number.isInteger(num) || num<1 || num>Total || st===null) continue;
        if (st==='manut'){ man[num-1]=true; occ[num-1]=false; }
        else { man[num-1]=false; occ[num-1]=(st==='ocup'); }
        updated = true;
      } else if (cols.length >= 2) {
        // Simples: numero;status
        const num = parseInt(cols[0].match(/\d+/)?.[0] ?? cols[0], 10);
        const st  = normalizeStatus(cols[cols.length-1]);
        if (!Number.isInteger(num) || num<1 || num>Total || st===null) continue;
        if (st==='manut'){ man[num-1]=true; occ[num-1]=false; }
        else { man[num-1]=false; occ[num-1]=(st==='ocup'); }
        updated = true;
      }
    }
    if (updated){
      save(KEY_OCC, occ); save(KEY_MAN, man);
      refreshDOM();
      alert('Importação concluída (Notebooks).');
    } else {
      alert('Nenhuma linha válida para Notebooks foi encontrada.');
    }
  }
  function handleImport(file){
    const reader = new FileReader();
    reader.onload = () => {
      try{ applyRows(parseCSV(reader.result || '')); }
      catch(e){ console.error(e); alert('Falha ao importar o CSV.'); }
    };
    reader.readAsText(file, 'utf-8');
  }
  if (BTN_IMPORT && FILE_IMPORT){
    BTN_IMPORT.addEventListener('click', () => FILE_IMPORT.click());
    FILE_IMPORT.addEventListener('change', (e) => {
      const f = e.target.files?.[0];
      if (f) handleImport(f);
      e.target.value = '';
    });
  }
})();
