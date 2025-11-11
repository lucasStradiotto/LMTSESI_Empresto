// Notebooks — render grade com base no banco + alterna manutenção + atualiza badge (livres/total)
(function () {
  'use strict';

  const IN_VIEWS = location.pathname.includes('/views/');
  const ASSETS_BASE = IN_VIEWS ? '../assets/' : 'assets/';
  const tbody = document.querySelector('#tabela-notebooks tbody');
  const COLS = 7;

  // Atualiza APENAS o badge dos notebooks (id="badge-note")
  async function updateBadgeNote() {
    try {
      const { counts } = await API.counts();
      const el = document.getElementById('badge-note');
      if (el && counts?.notebooks) {
        el.textContent = `${counts.notebooks.livres}/${counts.notebooks.total} livres`;
      }
    } catch (e) {
      console.warn('[badge-note] falha ao atualizar:', e);
    }
  }

  async function load() {
    try {
      const data = await API.getItems('notebooks');
      render(data.data || []);
      await updateBadgeNote();

      // Se existir snapshot/home, também atualiza lá
      if (typeof refreshSnapshot === 'function') {
        try { await refreshSnapshot(); } catch {}
      }
    } catch (e) {
      console.error(e);
      alert('Falha ao carregar notebooks.');
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
          const it = items[idx]; // {id,codigo,patrimonio,status,manutencao,updated_at}

          const label = document.createElement('label');
          label.className = 'notebook';
          label.classList.add(it.manutencao ? 'manutencao' : (it.status === 'ocupado' ? 'ocupado' : 'livre'));
          label.setAttribute('aria-label', `Notebook ${it.codigo}`);

          const input = document.createElement('input');
          input.type = 'checkbox';
          input.className = 'estado';
          input.checked = (it.status === 'ocupado');
          input.disabled = true;

          const img = document.createElement('img');
          img.className = 'nb-icon';
          img.src = ASSETS_BASE + 'icons/notebook.png';
          img.alt = '';

          const span = document.createElement('span');
          span.textContent = `Notebook ${it.codigo}`;

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
                ? `Colocar Notebook ${it.codigo} em manutenção?`
                : `Retirar Notebook ${it.codigo} da manutenção?`
            });
            if (!ok) return;

            manut.disabled = true;
            try {
              await API.toggleManut('notebooks', it.codigo, on);
              await load();            // recarrega a grade
              await updateBadgeNote(); // e garante o badge atualizado
              if (typeof refreshSnapshot === 'function') {
                try { await refreshSnapshot(); } catch {}
              }
            } catch (err) {
              console.error('[manut notebooks] erro:', err);
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
