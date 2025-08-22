// nav.js — corrige rotas quando index.html está fora de /views
(() => {
  // ====== Menu mobile ======
  const header = document.querySelector('.site-header');
  const btn = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-menu');

  if (btn && header && nav) {
    btn.addEventListener('click', () => {
      const open = header.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', (e) => {
      if (e.target.matches('a')) {
        header.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ====== Reescrita de rotas e destaque ======
  const pathname = window.location.pathname;
  const inViews = /\/views(\/|$)/i.test(pathname);

  // Reescreve os hrefs com base na pasta atual
  const links = document.querySelectorAll('.site-nav a');
  links.forEach(a => {
    const orig = (a.getAttribute('href') || '').trim();
    if (!orig) return;

    // arquivo alvo (ex.: "emp_note.html")
    const file = orig.split('/').pop().toLowerCase();
    let newHref = orig;

    if (file === 'index.html') {
      // Se estou dentro de /views, voltar um nível; senão, fica na raiz
      newHref = inViews ? '../index.html' : 'index.html';
      a.dataset.page = 'index';
    } else {
      // Demais páginas ficam em /views
      newHref = (inViews ? '' : 'views/') + file;
      a.dataset.page = file.replace(/\.html$/i,'');
    }

    a.setAttribute('href', newHref);
  });

  // Define qual link destacar como página atual
  let activeKey = 'index';
  if (inViews) {
    const file = pathname.split('/').pop() || '';
    activeKey = file.toLowerCase().replace(/\.html$/i,'') || 'index';
  } else {
    const file = pathname.split('/').pop() || '';
    if (file === '' || file.toLowerCase() === 'index.html') {
      activeKey = 'index';
    } else if (/\.html$/i.test(file)) {
      activeKey = file.toLowerCase().replace(/\.html$/i,'');
    }
  }

  links.forEach(a => {
    if ((a.dataset.page || '') === activeKey) {
      a.setAttribute('aria-current', 'page');
    } else {
      a.removeAttribute('aria-current');
    }
  });
})();
