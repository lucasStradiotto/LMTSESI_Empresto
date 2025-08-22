(() => {
  const sum = arr => arr.reduce((a,b)=>a+(b?1:0),0);

  function loadState(key, total){
    try{
      const raw = JSON.parse(localStorage.getItem(key) || '[]');
      const arr = Array.isArray(raw) ? raw.slice(0,total) : [];
      while(arr.length < total) arr.push(false);
      return arr;
    }catch{ return Array.from({length:total},()=>false) }
  }

  // Totais por recurso
  const totals = {
    notebooks: 35,
    celulares: 16,
    cameras:   2
  };

  // Lê estados e atualiza badges
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
})();
