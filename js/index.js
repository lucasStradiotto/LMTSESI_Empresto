/* Home: snapshot (badges), wizards Emprestar/Devolver e Empréstimos Ativos (compacto por req_id) */
(function () {
  const BTN_ABRIR_EMP = document.getElementById('btn-abrir-emprestar');
  const BTN_ABRIR_DEV = document.getElementById('btn-abrir-devolver');

  let SNAPSHOT = null;

  async function refreshSnapshot() {
    try {
      const data = await API.snapshot();
      SNAPSHOT = data;
      const c = data.counts;

      // Atualiza "livres" (mantemos o texto completo na span: ex. "10/35 livres")
      const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
      setText('badge-note', `${c.notebooks.livres}/${c.notebooks.total} livres`);
      setText('badge-cel', `${c.celulares.livres}/${c.celulares.total} livres`);
      setText('badge-cam', `${c.cameras.livres}/${c.cameras.total} livres`);

      // Atualiza apenas o número de manutenção (o rótulo "Em manutenção:" está no HTML)
      const setManu = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = String(n); };
      setManu('manu-note', c.notebooks.manutencao);
      setManu('manu-cel', c.celulares.manutencao);
      setManu('manu-cam', c.cameras.manutencao);
    } catch (e) {
      console.error(e);
      alert('Falha ao carregar snapshot do servidor.');
    }
  }


  // ---------- Empréstimos Ativos (agrupados) ----------
  const elListNote = document.getElementById('al-notebooks');
  const elListCel = document.getElementById('al-celulares');
  const elListCam = document.getElementById('al-cameras');
  const btnRefreshAtivos = document.getElementById('btn-refresh-ativos');

  function cap(s) { return (s || '').charAt(0).toUpperCase() + (s || '').slice(1); }
  function prefixSing(recurso) {
    return recurso === 'notebooks' ? 'Notebook' : (recurso === 'celulares' ? 'Celular' : 'Câmera');
  }

  function tooltipHTML(g) {
    const sing = prefixSing(g.recurso);
    const info = [];
    if (g.categoria === 'aluno') {
      if (g.turma) info.push(`Turma ${g.turma}`);
      if (g.atividade) info.push(`Atividade: ${g.atividade}`);
    } else if (g.categoria === 'professor') {
      if (g.turma) info.push(`Turma ${g.turma}`);
      if (g.disciplina) info.push(`Disciplina: ${g.disciplina}`);
      if (g.atividade) info.push(`Atividade: ${g.atividade}`);
      if (g.email) info.push(g.email);
    } else if (g.categoria === 'colaborador') {
      if (g.cargo_setor) info.push(`Cargo/Setor: ${g.cargo_setor}`);
      if (g.turma) info.push(`Turma ${g.turma}`);
      if (g.atividade) info.push(`Atividade: ${g.atividade}`);
      if (g.email) info.push(g.email);
    }
    if (g.obs) info.push(`Obs: ${g.obs}`);

    const itens = (g.itens || []).map(it => {
      const pat = it.patrimonio ? ` — Patrimônio ${it.patrimonio}` : '';
      return `<li>${sing} ${it.codigo}${pat}</li>`;
    }).join('');

    return `
      <div class="al-tip-section">
        ${info.length ? `<div class="al-tip-info">${info.join(' • ')}</div>` : ''}
        <div class="al-tip-itens">
          <strong>Itens:</strong>
          <ul>${itens || '<li>(sem itens)</li>'}</ul>
        </div>
      </div>
    `;
  }

  function groupCard(g) {
    const sing = prefixSing(g.recurso);
    const div = document.createElement('div');
    div.className = 'al-card'; // compacto
    div.innerHTML = `
      <div class="al-top">
        <strong class="al-nome">${g.nome || '(sem nome)'}</strong>
        <span class="badge cat-${g.categoria || 'na'}">${cap(g.categoria || '—')}</span>
      </div>
      <div class="al-row">
        <span class="badge item">${sing} × ${g.quantidade || (g.itens?.length || 0)}</span>
        <span class="al-date">Retirado: ${formatDateTimeBr(g.retirada_at)}</span>
      </div>

      <div class="al-tooltip">
        ${tooltipHTML(g)}
      </div>
    `;
    div.tabIndex = 0;
    return div;
  }

  async function refreshActiveLoans() {
    try {
      const data = await API.activeLoans(); // grupos
      const A = data.ativos || { notebooks: [], celulares: [], cameras: [] };

      const render = (el, arr) => {
        if (!el) return;
        el.innerHTML = '';
        if (!arr || !arr.length) {
          const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'Nenhum empréstimo ativo.';
          el.appendChild(p); return;
        }
        arr.forEach(g => el.appendChild(groupCard(g)));
      };

      render(elListNote, A.notebooks);
      render(elListCel, A.celulares);
      render(elListCam, A.cameras);
    } catch (e) {
      console.error(e);
    }
  }
  btnRefreshAtivos?.addEventListener('click', refreshActiveLoans);

  document.addEventListener('DOMContentLoaded', async () => {
    await refreshSnapshot();
    await refreshActiveLoans();
  });

  // ---------- Helpers de seleção (wizard) ----------
  function optionsFor(tipo, mode) {
    if (!SNAPSHOT) return [];
    const arr = SNAPSHOT.items[tipo] || [];
    if (mode === 'loan') {
      return arr.filter(i => i.status === 'disponivel' && !Number(i.manutencao)).map(i => i.codigo);
    }
    if (mode === 'return') {
      return arr.filter(i => i.status === 'ocupado').map(i => i.codigo);
    }
    return [];
  }

  /* ---- Wizard EMPRESTAR ---- */
  BTN_ABRIR_EMP?.addEventListener('click', () => {
    const state = {
      categoria: '',
      turma: '', atividade: '',
      disciplina: '',
      cargoSetor: '',
      nome: '', email: '',
      tipo: 'notebooks', itens: [],
      obs: ''
    };

    const { backdrop, close } = openModal(`
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="emp-title">
        <h3 id="emp-title">Emprestar — Passo <span id="emp-passos-num">1</span> de 3</h3>
        <div id="emp-steps"></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline m-back" disabled>Voltar</button>
          <button type="button" class="btn btn-outline m-next" disabled>Próximo</button>
        </div>
      </div>
    `);

    const stepsEl = backdrop.querySelector('#emp-steps');
    const btnBack = backdrop.querySelector('.m-back');
    const btnNext = backdrop.querySelector('.m-next');

    let step = 1;

    function renderStep1() {
      stepsEl.innerHTML = `
        <div style="display:grid; gap:10px; margin:10px 0 6px">
          <p style="margin:0; color:#475569">Quem está solicitando o empréstimo?</p>
          <label class="toggle"><input type="radio" name="categoria" value="aluno"> Aluno</label>
          <label class="toggle"><input type="radio" name="categoria" value="professor"> Professor</label>
          <label class="toggle"><input type="radio" name="categoria" value="colaborador"> Colaborador</label>
        </div>
      `;
      if (state.categoria) {
        const el = stepsEl.querySelector(`input[name="categoria"][value="${state.categoria}"]`);
        if (el) el.checked = true;
      }
      stepsEl.querySelectorAll('input[name="categoria"]').forEach(r => {
        r.addEventListener('change', () => {
          state.categoria = r.value;
          btnNext.disabled = !state.categoria;
        });
      });
      btnNext.disabled = !state.categoria;
    }

    function renderStep2() {
      if (state.categoria === 'aluno') {
        stepsEl.innerHTML = `
          <form id="emp-step2-aluno">
            <div style="display:grid; gap:10px; margin:10px 0 6px">
              <input required name="nome" class="inp" placeholder="Nome completo do aluno" />
              <input required name="turma" class="inp" placeholder="Turma (ex.: 2ºA, 3ºB)" />
              <input required name="atividade" class="inp" placeholder="Atividade (ex.: pesquisa, trabalho X)" />
            </div>
          </form>
        `;
        const form = stepsEl.querySelector('#emp-step2-aluno');
        const sync = () => {
          state.nome = String(form.nome.value || '').trim();
          state.turma = String(form.turma.value || '').trim();
          state.atividade = String(form.atividade.value || '').trim();
          btnNext.disabled = !(state.nome && state.turma && state.atividade);
        };
        form.addEventListener('input', sync); sync(); return;
      }

      if (state.categoria === 'professor') {
        stepsEl.innerHTML = `
          <form id="emp-step2-prof">
            <div style="display:grid; gap:10px; margin:10px 0 6px">
              <input required name="nome" class="inp" placeholder="Nome completo do professor" />
              <input required name="disciplina" class="inp" placeholder="Disciplina (ex.: Matemática)" />
              <input required name="turma" class="inp" placeholder="Turma (ex.: 2ºA, 3ºB)" />
              <input required name="atividade" class="inp" placeholder="Atividade (ex.: prova, projeto Y)" />
              <input required type="email" name="email" class="inp" placeholder="E-mail corporativo" />
            </div>
          </form>
        `;
        const form = stepsEl.querySelector('#emp-step2-prof');
        const sync = () => {
          state.nome = String(form.nome.value || '').trim();
          state.disciplina = String(form.disciplina.value || '').trim();
          state.turma = String(form.turma.value || '').trim();
          state.atividade = String(form.atividade.value || '').trim();
          state.email = String(form.email.value || '').trim();
          btnNext.disabled = !(state.nome && state.disciplina && state.turma && state.atividade && state.email);
        };
        form.addEventListener('input', sync); sync(); return;
      }

      // Colaborador
      stepsEl.innerHTML = `
        <form id="emp-step2-colab">
          <div style="display:grid; gap:10px; margin:10px 0 6px">
            <input required name="nome" class="inp" placeholder="Nome completo do colaborador" />
            <input required name="cargoSetor" class="inp" placeholder="Cargo / Setor" />
            <input required name="turma" class="inp" placeholder="Turma (ex.: 2ºA, 3ºB)" />
            <input required name="atividade" class="inp" placeholder="Atividade (ex.: atendimento, projeto Z)" />
            <input required type="email" name="email" class="inp" placeholder="E-mail corporativo" />
          </div>
        </form>
      `;
      const form = stepsEl.querySelector('#emp-step2-colab');
      const sync = () => {
        state.nome = String(form.nome.value || '').trim();
        state.cargoSetor = String(form.cargoSetor.value || '').trim();
        state.turma = String(form.turma.value || '').trim();
        state.atividade = String(form.atividade.value || '').trim();
        state.email = String(form.email.value || '').trim();
        btnNext.disabled = !(state.nome && state.cargoSetor && state.turma && state.atividade && state.email);
      };
      form.addEventListener('input', sync); sync();
    }

    function renderStep3() {
      stepsEl.innerHTML = `
        <form id="emp-step3">
          <div style="display:grid; gap:10px; margin:10px 0 6px">
            <div style="display:grid; gap:6px">
              <label>Recurso</label>
              <select name="tipo" id="emp-tipo" class="inp" required>
                <option value="notebooks">Notebooks</option>
                <option value="celulares">Celulares</option>
                <option value="cameras">Câmeras</option>
              </select>
            </div>
            <div style="display:grid; gap:6px">
              <label>Itens disponíveis</label>
              <div id="emp-grid" class="checks-grid" aria-live="polite"></div>
              <small style="color:#475569">Aparecem apenas itens livres (não ocupados e não em manutenção).</small>
            </div>
            <textarea name="obs" class="inp" placeholder="Observações (opcional)"></textarea>
          </div>
        </form>
      `;
      const selTipo = stepsEl.querySelector('#emp-tipo');
      const grid = stepsEl.querySelector('#emp-grid');
      const obs = stepsEl.querySelector('textarea[name="obs"]');
      selTipo.value = state.tipo || 'notebooks';

      const renderGrid = () => {
        const nums = optionsFor(selTipo.value, 'loan');
        grid.innerHTML = '';
        const selected = new Set(state.itens.map(Number));
        const prefix = (t) => t === 'notebooks' ? 'Notebook' : (t === 'celulares' ? 'Celular' : 'Câmera');
        nums.forEach(n => {
          const id = `chk-${selTipo.value}-${n}`;
          const lab = document.createElement('label'); lab.className = 'toggle';
          const input = document.createElement('input'); input.type = 'checkbox'; input.id = id; input.value = String(n); input.checked = selected.has(n);
          input.addEventListener('change', () => {
            state.itens = Array.from(grid.querySelectorAll('input[type="checkbox"]:checked')).map(i => parseInt(i.value, 10));
            btnNext.disabled = !(state.itens.length > 0);
          });
          lab.appendChild(input); lab.appendChild(document.createTextNode(' ' + prefix(selTipo.value) + ' ' + n));
          grid.appendChild(lab);
        });
        btnNext.disabled = !(state.itens.length > 0);
      };
      selTipo.addEventListener('change', () => { state.tipo = selTipo.value; state.itens = []; renderGrid(); });
      obs.addEventListener('input', e => { state.obs = String(e.currentTarget.value || '').trim(); });

      renderGrid();
    }

    function updateButtons() {
      btnBack.disabled = (step === 1);
      btnNext.textContent = (step === 3) ? 'Confirmar empréstimo' : 'Próximo';
    }

    async function finalize() {
      const form = {
        categoria: state.categoria,
        nome: state.nome,
        turma: state.turma || '',
        disciplina: state.disciplina || '',
        atividade: state.atividade || '',
        cargoSetor: state.cargoSetor || '',
        email: state.email || '',
        obs: state.obs || ''
      };
      try {
        const res = await API.loan(state.tipo, state.itens, form);
        const sucesso = res.emprestados || [];
        const jaOcup = res.ocupados || [];
        const bloque = res.manutencao || [];

        if (sucesso.length) {
          const movBase = {
            tipo: 'emprestimo',
            categoria: state.categoria,
            nome: state.nome,
            recurso: state.tipo,
            itens: sucesso,
            turma: state.turma || '',
            disciplina: state.disciplina || '',
            atividade: state.atividade || '',
            cargoSetor: state.cargoSetor || '',
            email: state.email || '',
            obs: state.obs || '',
            at: new Date().toISOString()
          };
          await generateLoanPDF(movBase);
        }

        await refreshSnapshot();
        await refreshActiveLoans();

        let msg = [];
        if (sucesso.length) msg.push(`Emprestados: ${sucesso.join(', ')}`);
        if (jaOcup.length) msg.push(`Já ocupados: ${jaOcup.join(', ')}`);
        if (bloque.length) msg.push(`Em manutenção (bloqueados): ${bloque.join(', ')}`);
        alert(msg.join('\n') || 'Nada a registrar.');
      } catch (e) {
        console.error(e);
        alert('Falha ao registrar empréstimo no servidor.');
      }
    }

    function goTo(n) {
      step = Math.max(1, Math.min(3, n));
      document.getElementById('emp-passos-num').textContent = String(step);
      if (step === 1) renderStep1();
      if (step === 2) renderStep2();
      if (step === 3) renderStep3();
      updateButtons();
    }

    backdrop.querySelector('.m-back').addEventListener('click', () => goTo(step - 1));
    backdrop.querySelector('.m-next').addEventListener('click', () => { if (step < 3) goTo(step + 1); else finalize(); });

    goTo(1);
  });

  /* ---- Wizard DEVOLVER (novo fluxo por req_id) ---- */
  BTN_ABRIR_DEV?.addEventListener('click', async () => {
    // Carrega empréstimos ativos agrupados
    let grupos = [];
    try {
      const data = await API.activeLoans();
      const A = data.ativos || { notebooks: [], celulares: [], cameras: [] };
      grupos = [...A.notebooks, ...A.celulares, ...A.cameras];
    } catch (e) {
      console.error(e);
      alert('Não foi possível carregar empréstimos ativos.');
      return;
    }

    const { backdrop, close } = openModal(`
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="dev-title">
        <style>
          .gsel .al-card{cursor:pointer;margin-bottom:8px}
          .gsel .al-card.selected{box-shadow:0 0 0 3px rgba(14,165,233,.3), var(--shadow); border-color:#0ea5e9}
        </style>
        <h3 id="dev-title">Devolver — Passo <span id="dev-step-num">1</span> de 2</h3>
        <div id="dev-steps"></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline m-cancel">Cancelar</button>
          <button type="button" class="btn btn-outline m-back" disabled>Voltar</button>
          <button type="button" class="btn btn-outline m-next" disabled>Próximo</button>
        </div>
      </div>
    `);

    const stepsEl = backdrop.querySelector('#dev-steps');
    const btnBack = backdrop.querySelector('.m-back');
    const btnNext = backdrop.querySelector('.m-next');
    const stepNum = backdrop.querySelector('#dev-step-num');

    const state = {
      group: null,      // grupo selecionado (req_id + recurso + dados)
      itensSel: []      // itens (códigos) escolhidos para devolver
    };

    function renderStep1() {
      stepsEl.innerHTML = `
        <div class="gsel" style="display:grid; gap:6px; margin:10px 0 6px">
          ${grupos.length ? '' : '<p class="muted">Nenhum empréstimo ativo.</p>'}
        </div>
      `;
      const cont = stepsEl.querySelector('.gsel');

      grupos.forEach((g, idx) => {
        const card = document.createElement('div');
        card.className = 'al-card';
        const sing = g.recurso === 'notebooks' ? 'Notebook' : (g.recurso === 'celulares' ? 'Celular' : 'Câmera');
        card.innerHTML = `
          <div class="al-top">
            <strong>${g.nome || '(sem nome)'}</strong>
            <span class="badge cat-${g.categoria || 'na'}">${cap(g.categoria || '—')}</span>
          </div>
          <div class="al-row">
            <span class="badge item">${sing} × ${g.quantidade || g.itens?.length || 0}</span>
            <span class="al-date">Retirado: ${formatDateTimeBr(g.retirada_at)}</span>
          </div>
          <div class="al-tooltip">${(function () {
            const itens = (g.itens || []).map(it => `${sing} ${it.codigo}${it.patrimonio ? ` — Patrimônio ${it.patrimonio}` : ''}`).join('<br>');
            return `<div style="color:#475569;margin-top:6px">${itens || ''}</div>`;
          })()}</div>
        `;
        card.addEventListener('click', () => {
          stepsEl.querySelectorAll('.al-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          state.group = g;
          btnNext.disabled = false;
        });
        cont.appendChild(card);
      });

      btnBack.disabled = true;
      btnNext.disabled = !state.group;
    }

    function renderStep2() {
      const g = state.group;
      const sing = g.recurso === 'notebooks' ? 'Notebook' : (g.recurso === 'celulares' ? 'Celular' : 'Câmera');
      stepsEl.innerHTML = `
        <div style="display:grid; gap:10px; margin:10px 0 6px">
          <div>
            <strong>${g.nome || '(sem nome)'}</strong>
            <span class="badge cat-${g.categoria || 'na'}" style="margin-left:8px">${cap(g.categoria || '—')}</span>
            <div class="muted" style="margin-top:4px">Retirado: ${formatDateTimeBr(g.retirada_at)}</div>
          </div>
          <div>
            <label>Selecione os itens devolvidos</label>
            <div id="dev-grid" class="checks-grid"></div>
            <small class="muted">Você pode devolver parcialmente. Se a quantidade devolvida for igual ao total do pedido, o empréstimo é encerrado.</small>
          </div>
        </div>
      `;

      const grid = stepsEl.querySelector('#dev-grid');
      grid.innerHTML = '';
      state.itensSel = (g.itens || []).map(it => it.codigo); // por padrão, todos marcados
      const selectedSet = new Set(state.itensSel);

      (g.itens || []).forEach(it => {
        const lab = document.createElement('label'); lab.className = 'toggle';
        const input = document.createElement('input'); input.type = 'checkbox'; input.value = String(it.codigo); input.checked = selectedSet.has(it.codigo);
        input.addEventListener('change', () => {
          state.itensSel = Array.from(grid.querySelectorAll('input[type="checkbox"]:checked')).map(i => parseInt(i.value, 10));
          btnNext.disabled = !(state.itensSel.length > 0);
        });
        lab.appendChild(input);
        lab.appendChild(document.createTextNode(` ${sing} ${it.codigo}${it.patrimonio ? ` — Patrimônio ${it.patrimonio}` : ''}`));
        grid.appendChild(lab);
      });

      btnBack.disabled = false;
      btnNext.textContent = 'Confirmar devolução';
      btnNext.disabled = !(state.itensSel.length > 0);
    }

    async function finalize() {
      const g = state.group;
      const codigos = state.itensSel.slice();
      try {
        const res = await API.devolver(g.recurso, codigos);
        const devolvidos = res.devolvidos || [];
        const ignorados = res.ja_livres || [];
        const at = new Date().toISOString();

        // Gera PDF de devolução (com dados do solicitante e retirada original)
        if (devolvidos.length) {
          await generateReturnPDF({
            recurso: g.recurso,
            itens: devolvidos,
            categoria: g.categoria,
            nome: g.nome,
            turma: g.turma || '',
            disciplina: g.disciplina || '',
            atividade: g.atividade || '',
            cargoSetor: g.cargo_setor || '',
            email: g.email || '',
            obs: g.obs || '',
            retirada_at: g.retirada_at,
            at
          });
        }

        await refreshSnapshot();
        await refreshActiveLoans();

        // Mensagem final
        const total = (g.itens || []).length;
        let msg = [];
        if (devolvidos.length) msg.push(`Devolvidos: ${devolvidos.join(', ')}`);
        if (ignorados.length) msg.push(`Ignorados (já livres): ${ignorados.join(', ')}`);
        if (devolvidos.length === total) msg.push('Pedido encerrado ✔️');
        alert(msg.join('\n') || 'Nada a registrar.');
        close();
      } catch (e) {
        console.error(e);
        alert('Falha ao registrar devolução no servidor.');
      }
    }

    let step = 1;
    function go(n) {
      step = Math.max(1, Math.min(2, n));
      stepNum.textContent = String(step);
      btnNext.textContent = (step === 2) ? 'Confirmar devolução' : 'Próximo';
      if (step === 1) renderStep1();
      if (step === 2) renderStep2();
    }

    btnBack.addEventListener('click', () => go(step - 1));
    btnNext.addEventListener('click', () => { if (step < 2) go(step + 1); else finalize(); });

    go(1);
  });

  // Inicial
  document.addEventListener('DOMContentLoaded', async () => {
    await refreshSnapshot();
    await refreshActiveLoans();
  });

  // Torna os cards da Home clicáveis (e acessíveis via teclado)
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.card.clickable[data-href]').forEach(card => {
      const go = () => {
        const url = card.getAttribute('data-href');
        if (url) window.location.href = url;
      };
      card.addEventListener('click', go);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
      });
    });
  });

})();
