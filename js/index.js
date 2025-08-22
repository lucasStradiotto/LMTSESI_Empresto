(() => {
  const sum = arr => arr.reduce((a,b)=>a+(b?1:0),0);

  function loadState(key, total){
    try{
      const raw = JSON.parse(localStorage.getItem(key) || '[]');
      const arr = Array.isArray(raw) ? raw.slice(0,total) : [];
      while(arr.length < total) arr.push(false);
      return arr;
    }catch{
      return Array.from({length:total},()=>false);
    }
  }

  // Totais por recurso
  const totals = {
    notebooks: 35,
    celulares: 16,
    cameras:   2
  };

  // ---- Badges (Home) ----
  const nb = loadState('estado_notebooks', totals.notebooks);
  const ce = loadState('estado_celulares', totals.celulares);
  const ca = loadState('estado_cameras',   totals.cameras);

  const livresNB = totals.notebooks - sum(nb);
  const livresCE = totals.celulares - sum(ce);
  const livresCA = totals.cameras   - sum(ca);

  const elNB = document.getElementById('badge-note');
  const elCE = document.getElementById('badge-cel');
  const elCA = document.getElementById('badge-cam');

  if (elNB) elNB.textContent = `${livresNB}/${totals.notebooks} livres`;
  if (elCE) elCE.textContent = `${livresCE}/${totals.celulares} livres`;
  if (elCA) elCA.textContent = `${livresCA}/${totals.cameras} livres`;

  // ---- Exportar Resumo (CSV) ----
  const BTN = document.getElementById('export-resumo');

  function downloadCSV(filename, rows){
    const header = ['recurso','numero','rotulo','status'];
    const esc = s => `"${String(s).replace(/"/g,'""')}"`;
    const lines = [header.join(';'), ...rows.map(r => r.map(esc).join(';'))];
    const blob = new Blob(["\ufeff" + lines.join('\n')], {type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  function buildRows(tipo, total, state, labelPrefix){
    const rows = [];
    for(let i=1;i<=total;i++){
      const ocupado = !!state[i-1];
      rows.push([tipo, i, `${labelPrefix} ${i}`, ocupado ? 'Ocupado' : 'Livre']);
    }
    return rows;
  }

  function exportResumo(){
    const now = new Date();
    const pad = n => String(n).padStart(2,'0');
    const fname = `emprestimos_resumo_${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}.csv`;

    const rows = [
      ...buildRows('notebook', totals.notebooks, nb, 'Notebook'),
      ...buildRows('celular',  totals.celulares, ce, 'Celular'),
      ...buildRows('camera',   totals.cameras,   ca, 'Câmera'),
    ];
    downloadCSV(fname, rows);
  }

  if (BTN) BTN.addEventListener('click', exportResumo);
})();
