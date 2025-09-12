// Header dinâmico com rotas corretas (index na raiz, inventários em /views)
(function(){
  function isActive(path){ return location.pathname.endsWith(path); }
  const rootPrefix = location.pathname.includes('/views/') ? '..' : '.';

  const header = document.getElementById('site-header');
  if (!header) return;
  header.className = 'site-nav';
  header.innerHTML = `
    <div class="brand">
      <img id="coruja" src="${rootPrefix}/assets/icons/owl_244352.png" alt="Logo">
      <strong>LMT SESI</strong>
    </div>
    <nav class="menu">
      <a href="${rootPrefix}/index.html" class="${isActive('/index.html')?'active':''}">Início</a>
      <a href="${rootPrefix}/views/emp_note.html" class="${isActive('/emp_note.html')?'active':''}">Notebooks</a>
      <a href="${rootPrefix}/views/emp_cel.html" class="${isActive('/emp_cel.html')?'active':''}">Celulares</a>
      <a href="${rootPrefix}/views/emp_cam.html" class="${isActive('/emp_cam.html')?'active':''}">Câmeras</a>
    </nav>
  `;
})();
