// Câmeras — render grade com base no banco + alterna manutenção + atualiza badge (livres/total)
(function () {
  'use strict';

  const IN_VIEWS = location.pathname.includes('/views/');
  const ASSETS_BASE = IN_VIEWS ? '../assets/' : 'assets/';

  const tbody = document.querySelector('#tabela-itens tbody');
  const COLS = 7;

  async function updateBadgeCam() {
    try {
      const { counts } = await API.counts();
      const el = document.getElementById('badge-cam');
      if (el && counts?.cameras) {
        el.textContent = `${counts.cameras.livres}/${counts.cameras.total} livres`;
      }
    } catch (e) {
      console.warn('[badge-cam] falha ao atualizar:', e);
    }
  }

  async function load() {
    try {
      const data = await API.getItems('cameras');
      render(data.data || []);
      await updateBadgeCam();

      if (typeof refreshSnapshot === 'function') {
        try { await refreshSnapshot(); } catch {}
      }
    } catch (e) {
      console.error(e);
      alert('Falha ao carregar câmeras.');
    }
  }

  function render(items) {
    tbody.innerHTML = '';
    const total = items.length;
    const rows = Math.ceil(total / COLS);

    for (let i = 0; i < rows; i++) {
      const tr = document.createElement('tr');

      for (let j = 0; j < COLS; j++) {
        const idx = i * COLS + j;
        const td = document.createElement('td');

        if (idx < total) {
          const it = items[idx];

          const label = document.createElement('label');
          label.className = 'notebook';
          label.classList.add(it.manutencao ? 'manutencao' : (it.status === 'ocupado' ? 'ocupado' : 'livre'));
          label.setAttribute('aria-label', `Câmera ${it.codigo}`);

          const input = document.createElement('input');
          input.type = 'checkbox';
          input.className = 'estado';
          input.checked = (it.status === 'ocupado');
          input.disabled = true;

          const img = document.createElement('img');
          img.className = 'nb-icon';
          img.src = ASSETS_BASE + 'icons/camera.png';
          img.alt = '';

          const span = document.createElement('span');
          span.textContent = `Câmera ${it.codigo}`;

          const manut = document.createElement('button');
          manut.className = 'btn-manut';
          manut.type = 'button';
          manut.title = it.manutencao ? 'Retirar de manutenção' : 'Colocar em manutenção';
          manut.textContent = '🛠';

          manut.addEventListener('click', async (e) => {
            e.stopPropagation();
            const on = it.manutencao ? 0 : 1;

            const ok = await confirmModal({
              title: on ? 'Confirmar manutenção' : 'Retirar de manutenção',
              text: on
                ? `Colocar Câmera ${it.codigo} em manutenção?`
                : `Retirar Câmera ${it.codigo} da manutenção?`
            });
            if (!ok) return;

            manut.disabled = true;
            try {
              await API.toggleManut('cameras', it.codigo, on);
              await load();
              await updateBadgeCam();
              if (typeof refreshSnapshot === 'function') {
                try { await refreshSnapshot(); } catch {}
              }
            } catch (err) {
              console.error('[manut cameras] erro:', err);
              await alert('Não foi possível alterar manutenção. Tente novamente.');
            } finally {
              manut.disabled = false;
            }
          });

          label.appendChild(input);
          label.appendChild(img);
          label.appendChild(span);
          label.appendChild(manut);
          td.appendChild(label);
        }

        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    }
  }

  load();
})();
