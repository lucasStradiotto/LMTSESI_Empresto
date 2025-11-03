/* Home: snapshot (badges), wizards Emprestar/Devolver e Empréstimos Ativos (compacto por req_id) */
(function () {
  const __IN_VIEWS__ = location.pathname.includes('/views/');
  const PHP_BASE = __IN_VIEWS__ ? '../php/' : 'php/';

  const BTN_ABRIR_EMP = document.getElementById('btn-abrir-emprestar');
  const BTN_ABRIR_DEV = document.getElementById('btn-abrir-devolver');

  let SNAPSHOT = null;

  // UUID v4 simples para idempotência de submissão
  function genUUID() {
    if (crypto?.randomUUID) return crypto.randomUUID();
    // fallback
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
  }

  async function refreshSnapshot() {
    try {
      const data = await API.snapshot();
      SNAPSHOT = data;
      const c = data.counts;

      const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
      setText('badge-note', `${c.notebooks.livres}/${c.notebooks.total} livres`);
      setText('badge-cel', `${c.celulares.livres}/${c.celulares.total} livres`);
      setText('badge-cam', `${c.cameras.livres}/${c.cameras.total} livres`);

      const setManu = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = String(n); };
      setManu('manu-note', c.notebooks.manutencao);
      setManu('manu-cel', c.celulares.manutencao);
      setManu('manu-cam', c.cameras.manutencao);
    } catch (e) {
      console.error('[index.js] snapshot erro:', e);
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
    div.className = 'al-card';
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

  // Dedupe por janela (para evitar múltiplos cards “fantasmas” muito próximos)
  function dedupeGroups(arr, windowMs = 60_000) {
    if (!Array.isArray(arr) || !arr.length) return arr || [];
    // chave: recurso|nome|categoria|turma|disciplina|atividade
    const keyOf = (g) => [
      g.recurso || '', g.nome || '', g.categoria || '',
      g.turma || '', g.disciplina || '', g.atividade || ''
    ].join('|');

    const buckets = new Map();
    arr.forEach(g => {
      const k = keyOf(g);
      const list = buckets.get(k) || [];
      list.push(g);
      buckets.set(k, list);
    });

    const out = [];
    buckets.forEach(list => {
      list.sort((a, b) => new Date(b.retirada_at) - new Date(a.retirada_at)); // desc
      const kept = [];
      list.forEach(g => {
        const ts = new Date(g.retirada_at).getTime();
        const clash = kept.some(h => Math.abs(new Date(h.retirada_at).getTime() - ts) <= windowMs);
        if (!clash) kept.push(g);
      });
      out.push(...kept);
    });
    return out;
  }

  async function refreshActiveLoans() {
    try {
      const data = await API.activeLoans(); // grupos
      const A = data.ativos || { notebooks: [], celulares: [], cameras: [] };

      // aplica dedupe por janela
      const N = dedupeGroups(A.notebooks, 60_000);
      const C = dedupeGroups(A.celulares, 60_000);
      const K = dedupeGroups(A.cameras, 60_000);

      const render = (el, arr) => {
        if (!el) return;
        el.innerHTML = '';
        if (!arr || !arr.length) {
          const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'Nenhum empréstimo ativo.';
          el.appendChild(p); return;
        }
        arr.forEach(g => el.appendChild(groupCard(g)));
      };

      render(elListNote, N);
      render(elListCel, C);
      render(elListCam, K);
    } catch (e) {
      console.error('[index.js] ativos erro:', e);
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
    const arr = SNAPSHOT.items?.[tipo] || [];
    if (mode === 'loan') {
      return arr.filter(i => i.status === 'disponivel' && !Number(i.manutencao)).map(i => i.codigo);
    }
    if (mode === 'return') {
      return arr.filter(i => i.status === 'ocupado').map(i => i.codigo);
    }
    return [];
  }

  // ---- Verificações diretas no servidor (anti-stale) ----
  async function fetchDisponiveis(tipo) {
    const data = await API.getItems(tipo);
    const arr = (data && data.data) || [];
    return arr.filter(i => i.status === 'disponivel' && !Number(i.manutencao)).map(i => Number(i.codigo));
  }

  async function fetchOcupados(tipo) {
    const data = await API.getItems(tipo);
    const arr = (data && data.data) || [];
    return arr.filter(i => i.status === 'ocupado').map(i => Number(i.codigo));
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

    const { backdrop, close: closeEmpModal } = openModal(`
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
              <div style="display:flex; align-items:center; justify-content:space-between; gap:10px">
                <label style="margin:0">Itens disponíveis</label>
                <button type="button" id="btn-select-all" class="btn btn-outline" style="padding:6px 10px">Selecionar todos</button>
              </div>
              <div id="emp-grid" class="checks-grid" aria-live="polite"></div>
              <small style="color:#475569">Aparecem apenas itens livres (não ocupados e não em manutenção). A lista é verificada em tempo real.</small>
            </div>

            <textarea name="obs" class="inp" placeholder="Observações (opcional)"></textarea>
          </div>
        </form>
      `;

      const selTipo = stepsEl.querySelector('#emp-tipo');
      const grid = stepsEl.querySelector('#emp-grid');
      const obs = stepsEl.querySelector('textarea[name="obs"]');
      const btnSelectAll = stepsEl.querySelector('#btn-select-all');
      selTipo.value = state.tipo || 'notebooks';

      const prefix = (t) => t === 'notebooks' ? 'Notebook' : (t === 'celulares' ? 'Celular' : 'Câmera');

      const setSelectAllUI = (total, marcados) => {
        if (!btnSelectAll) return;
        btnSelectAll.disabled = total === 0;
        const all = total > 0 && marcados >= total;
        btnSelectAll.textContent = all ? 'Limpar seleção' : 'Selecionar todos';
        btnSelectAll.dataset.mode = all ? 'clear' : 'select';
      };

      const renderGrid = async () => {
        btnNext.disabled = true;
        const disponiveis = await fetchDisponiveis(selTipo.value);
        grid.innerHTML = '';

        const selected = new Set(state.itens.map(Number));
        state.itens = state.itens.filter(n => disponiveis.includes(Number(n)));

        disponiveis.forEach(n => {
          const id = `chk-${selTipo.value}-${n}`;
          const lab = document.createElement('label'); lab.className = 'toggle';
          const input = document.createElement('input'); input.type = 'checkbox';
          input.id = id; input.value = String(n); input.checked = selected.has(n);
          input.addEventListener('change', () => {
            state.itens = Array.from(grid.querySelectorAll('input[type="checkbox"]:checked')).map(i => parseInt(i.value, 10));
            btnNext.disabled = !(state.itens.length > 0);
            setSelectAllUI(disponiveis.length, state.itens.length);
          });

          lab.appendChild(input);
          lab.appendChild(document.createTextNode(` ${prefix(selTipo.value)} ${n}`));
          grid.appendChild(lab);
        });

        setSelectAllUI(disponiveis.length, state.itens.length);

        if (btnSelectAll) {
          btnSelectAll.onclick = () => {
            const mode = btnSelectAll.dataset.mode || 'select';
            if (mode === 'select') {
              // marcar todos
              grid.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
              state.itens = disponiveis.slice();
            } else {
              // limpar
              grid.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
              state.itens = [];
            }
            btnNext.disabled = !(state.itens.length > 0);
            setSelectAllUI(disponiveis.length, state.itens.length);
          };
        }

        btnNext.disabled = !(state.itens.length > 0);
      };

      selTipo.addEventListener('change', async () => {
        state.tipo = selTipo.value;
        state.itens = [];
        await renderGrid();
      });

      obs.addEventListener('input', e => { state.obs = String(e.currentTarget.value || '').trim(); });

      renderGrid();
    }

    function updateButtons() {
      btnBack.disabled = (step === 1);
      btnNext.textContent = (step === 3) ? 'Confirmar empréstimo' : 'Próximo';
    }

    async function finalize() {
      // form ÚNICO com submission_id (idempotência)
      const form = {
        categoria: state.categoria,
        nome: state.nome,
        turma: state.turma || '',
        disciplina: state.disciplina || '',
        atividade: state.atividade || '',
        cargoSetor: state.cargoSetor || '',
        email: state.email || '',
        obs: state.obs || '',
        submission_id: genUUID()
      };
      try {
        // Revalidação final
        const livresAgora = await fetchDisponiveis(state.tipo);
        const perdidos = state.itens.filter(n => !livresAgora.includes(Number(n)));
        if (perdidos.length) {
          await notifyModal({
            title: 'Itens indisponíveis',
            text: `Estes itens deixaram de estar livres: ${perdidos.join(', ')}. Atualizei a lista. Selecione novamente.`,
            type: 'warning'
          });
          renderStep3();
          return;
        }

        // Anti-duplo clique
        btnNext.disabled = true;
        const res = await API.loan(state.tipo, state.itens, form);
        const sucesso = res.emprestados || [];
        const jaOcup = res.ocupados || [];
        const bloque = res.manutencao || [];
        const reqId = res.req_id || '';

        // Atualiza UI
        await refreshSnapshot();
        await refreshActiveLoans();

        // PDF local (download automático)
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

        // Fechar modal principal antes do QR
        closeEmpModal && closeEmpModal();

        // URL absoluta para QR (format=json)
        let reportURL = '#';
        try {
          const params = {
            format: 'json',
            tipo: 'emprestimo',
            rec: state.tipo,
            itens: Array.isArray(sucesso) ? sucesso.join(',') : '',
            req_id: reqId || '',
            // extras p/ viewer:
            cat: state.categoria || '',
            nome: state.nome || '',
            turma: state.turma || '',
            disciplina: state.disciplina || '',
            atividade: state.atividade || '',
            cargoSetor: state.cargoSetor || '',
            email: state.email || '',
            obs: state.obs || '',
            at: new Date().toISOString()
          };
          const urlJson = PHP_BASE + 'api_relatorio.php?' + new URLSearchParams(params).toString();
          const resp = await fetch(urlJson).then(r => r.json());
          reportURL = resp?.url || '#';
        } catch (e) {
          console.warn('[index.js] relatorioURL json fallback:', e);
        }

        // Modal QR + botão baixar PDF
        await showQRCodeModal({
          url: reportURL,
          title: 'Comprovante de Empréstimo',
          subtitle: 'Escaneie para abrir o relatório. Ou baixe o PDF agora:',
          onDownload: async () => {
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
            } else {
              await alert('Nenhum item foi emprestado.');
            }
          }
        });

        // Mensagem final
        let msg = [];
        if (sucesso.length) msg.push(`Emprestados: ${sucesso.join(', ')}`);
        if (jaOcup.length) msg.push(`Já ocupados: ${jaOcup.join(', ')}`);
        if (bloque.length) msg.push(`Em manutenção (bloqueados): ${bloque.join(', ')}`);
        alert(msg.join('\n') || 'Nada a registrar.');
      } catch (e) {
        console.error('[index.js] loan erro:', e);
        alert('Falha ao registrar empréstimo no servidor.');
      } finally {
        btnNext.disabled = false;
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

    btnBack.addEventListener('click', () => goTo(step - 1));
    btnNext.addEventListener('click', () => { if (step < 3) goTo(step + 1); else finalize(); });

    (async () => { try { await refreshSnapshot(); } catch (e) { } })();
    goTo(1);
  });

  /* ---- Wizard DEVOLVER (novo fluxo por req_id) ---- */
  BTN_ABRIR_DEV?.addEventListener('click', async () => {
    let grupos = [];
    try {
      const data = await API.activeLoans();
      const A = data.ativos || { notebooks: [], celulares: [], cameras: [] };
      grupos = [...A.notebooks, ...A.celulares, ...A.cameras];
    } catch (e) {
      console.error('[index.js] activeLoans erro:', e);
      alert('Não foi possível carregar empréstimos ativos.');
      return;
    }

    const { backdrop, close } = openModal(`
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="dev-title">
        <style>
          .gsel .al-card{cursor:pointer;margin-bottom:8px;position:relative}
          .gsel .al-card.selected{box-shadow:0 0 0 3px rgba(14,165,233,.3), var(--shadow); border-color:#0ea5e9}
          /* Desliga tooltip só nesta lista para não atrapalhar clique */
          .gsel .al-card .al-tooltip{display:none !important; visibility:hidden !important; pointer-events:none !important;}
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

    const state = { group: null, itensSel: [] };

    function renderStep1() {
      stepsEl.innerHTML = `
        <div class="gsel" style="display:grid; gap:6px; margin:10px 0 6px">
          ${grupos.length ? '' : '<p class="muted">Nenhum empréstimo ativo.</p>'}
        </div>
      `;
      const cont = stepsEl.querySelector('.gsel');

      grupos.forEach((g) => {
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

      (async () => {
        const ocupadosAgora = await fetchOcupados(g.recurso);
        const itensAtivosDoGrupo = (g.itens || [])
          .map(it => Number(it.codigo))
          .filter(cod => ocupadosAgora.includes(cod));

        state.itensSel = itensAtivosDoGrupo.slice();
        const selectedSet = new Set(state.itensSel);

        itensAtivosDoGrupo.forEach(cod => {
          const lab = document.createElement('label'); lab.className = 'toggle';
          const input = document.createElement('input'); input.type = 'checkbox';
          input.value = String(cod); input.checked = selectedSet.has(cod);
          input.addEventListener('change', () => {
            state.itensSel = Array.from(grid.querySelectorAll('input[type="checkbox"]:checked')).map(i => parseInt(i.value, 10));
            btnNext.disabled = !(state.itensSel.length > 0);
          });
          lab.appendChild(input);
          lab.appendChild(document.createTextNode(` ${sing} ${cod}`));
          grid.appendChild(lab);
        });

        btnNext.disabled = !(state.itensSel.length > 0);

        if (!itensAtivosDoGrupo.length) {
          await notifyModal({
            title: 'Nada a devolver',
            text: 'Todos os itens deste pedido já foram devolvidos.',
            type: 'info'
          });
          btnBack.click();
        }
      })();

      btnBack.disabled = false;
      btnNext.textContent = 'Confirmar devolução';
    }

    async function finalize() {
      const g = state.group;
      const codigos = state.itensSel.slice();
      try {
        // Revalidação final
        const ocupadosAgora = await fetchOcupados(g.recurso);
        const invalidos = state.itensSel.filter(n => !ocupadosAgora.includes(Number(n)));
        if (invalidos.length) {
          await notifyModal({
            title: 'Itens já livres',
            text: `Estes itens já não estão mais ocupados: ${invalidos.join(', ')}. Atualizei a lista.`,
            type: 'warning'
          });
          renderStep2();
          return;
        }

        // Anti-duplo clique
        btnNext.disabled = true;

        const res = await API.devolver(g.recurso, codigos);
        const devolvidos = res.devolvidos || [];
        const ignorados = res.ja_livres || [];
        const at = new Date().toISOString();

        // Atualiza UI
        await refreshSnapshot();
        await refreshActiveLoans();

        // PDF local (download automático)
        if (devolvidos.length) {
          const mov = {
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
          };
          await generateReturnPDF(mov);
        }

        // URL absoluta para QR (format=json)
        let reportURL = '#';
        try {
          const params = {
            format: 'json',
            tipo: 'devolucao',
            rec: g.recurso,
            itens: Array.isArray(devolvidos) ? devolvidos.join(',') : '',
            req_id: g.req_id || '',
            cat: g.categoria || '',
            nome: g.nome || '',
            turma: g.turma || '',
            disciplina: g.disciplina || '',
            atividade: g.atividade || '',
            cargoSetor: g.cargo_setor || '',
            email: g.email || '',
            obs: g.obs || '',
            retirada_at: g.retirada_at || '',
            at
          };
          const urlJson = PHP_BASE + 'api_relatorio.php?' + new URLSearchParams(params).toString();
          const resp = await fetch(urlJson).then(r => r.json());
          reportURL = resp?.url || '#';
        } catch (e) {
          console.warn('[index.js] relatorioURL json fallback (devolucao):', e);
        }

        // Fecha modal de devolução ANTES do QR (evita duplicações)
        close();

        // Modal QR + botão baixar PDF
        await showQRCodeModal({
          url: reportURL,
          title: 'Comprovante de Devolução',
          subtitle: 'Escaneie para abrir o relatório. Ou baixe o PDF agora:',
          onDownload: async () => {
            if (devolvidos.length) {
              const mov = {
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
              };
              await generateReturnPDF(mov);
            } else {
              await alert('Nenhum item foi marcado como devolvido.');
            }
          }
        });

        const total = (g.itens || []).length;
        let msg = [];
        if (devolvidos.length) msg.push(`Devolvidos: ${devolvidos.join(', ')}`);
        if (ignorados.length) msg.push(`Ignorados (já livres): ${ignorados.join(', ')}`);
        if (devolvidos.length === total) msg.push('Pedido encerrado ✔️');
        alert(msg.join('\n') || 'Nada a registrar.');
      } catch (e) {
        console.error('[index.js] devolver erro:', e);
        alert('Falha ao registrar devolução no servidor.');
      } finally {
        btnNext.disabled = false;
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

  // Cards clicáveis (Home)
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
