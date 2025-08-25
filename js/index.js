(() => {
  /* ==================== ESTADO / UTIL ==================== */
  const sumTrue = arr => arr.reduce((a, b) => a + (b ? 1 : 0), 0);

  function loadBoolArray(key, total) {
    try {
      const raw = JSON.parse(localStorage.getItem(key) || '[]');
      const arr = Array.isArray(raw) ? raw.slice(0, total) : [];
      while (arr.length < total) arr.push(false);
      return arr;
    } catch {
      return Array.from({ length: total }, () => false);
    }
  }
  function saveBoolArray(key, arr) { localStorage.setItem(key, JSON.stringify(arr)); }

  function loadJSON(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key) || ''); return v ?? fallback; }
    catch { return fallback; }
  }
  function saveJSON(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  const totals = { notebooks: 35, celulares: 16, cameras: 2 };

  // Estados (ocupado / manutenção)
  let nbOcc = loadBoolArray('estado_notebooks', totals.notebooks);
  let nbMan = loadBoolArray('estado_notebooks_manut', totals.notebooks);
  let ceOcc = loadBoolArray('estado_celulares', totals.celulares);
  let ceMan = loadBoolArray('estado_celulares_manut', totals.celulares);
  let caOcc = loadBoolArray('estado_cameras', totals.cameras);
  let caMan = loadBoolArray('estado_cameras_manut', totals.cameras);

  // Movimentação (log simples)
  let movimentos = loadJSON('registros_movimentos', []); // [{tipo, nome, doc, email, recurso, itens, dataPrev, obs, at}]

  /* ==================== BADGES & FILTRO (HOME) ==================== */
  const cardNote = document.querySelector('.card--note');
  const cardCel = document.querySelector('.card--cel');
  const cardCam = document.querySelector('.card--cam');
  const toggleOnlyManut = document.getElementById('toggle-only-manut');

  function renderBadges() {
    const elNB = document.getElementById('badge-note');
    const elCE = document.getElementById('badge-cel');
    const elCA = document.getElementById('badge-cam');

    const livresNB = totals.notebooks - (sumTrue(nbOcc) + sumTrue(nbMan));
    const livresCE = totals.celulares - (sumTrue(ceOcc) + sumTrue(ceMan));
    const livresCA = totals.cameras - (sumTrue(caOcc) + sumTrue(caMan));

    if (elNB) elNB.textContent = `${livresNB}/${totals.notebooks} livres`;
    if (elCE) elCE.textContent = `${livresCE}/${totals.celulares} livres`;
    if (elCA) elCA.textContent = `${livresCA}/${totals.cameras} livres`;

    const mnNB = document.getElementById('manu-note');
    const mnCE = document.getElementById('manu-cel');
    const mnCA = document.getElementById('manu-cam');
    if (mnNB) mnNB.textContent = `Em manutenção: ${sumTrue(nbMan)}`;
    if (mnCE) mnCE.textContent = `Em manutenção: ${sumTrue(ceMan)}`;
    if (mnCA) mnCA.textContent = `Em manutenção: ${sumTrue(caMan)}`;
  }

  function applyFilter() {
    if (!toggleOnlyManut) return;
    const only = !!toggleOnlyManut.checked;
    const showNote = sumTrue(nbMan) > 0 || !only;
    const showCel = sumTrue(ceMan) > 0 || !only;
    const showCam = sumTrue(caMan) > 0 || !only;
    if (cardNote) cardNote.style.display = showNote ? '' : 'none';
    if (cardCel) cardCel.style.display = showCel ? '' : 'none';
    if (cardCam) cardCam.style.display = showCam ? '' : 'none';
  }

  renderBadges(); applyFilter();
  toggleOnlyManut?.addEventListener('change', applyFilter);

  /* ==================== EXPORT / IMPORT / MODELO ==================== */
  const BTN_EXP = document.getElementById('export-resumo');
  const BTN_MODEL_GLOBAL = document.getElementById('download-modelo-resumo');
  const BTN_IMP = document.getElementById('import-resumo');
  const FILE_IMP = document.getElementById('import-resumo-file');

  function downloadCSV(filename, header, rows) {
    const esc = s => `"${String(s).replace(/"/g, '""')}"`;
    const lines = [header.join(';'), ...rows.map(r => r.map(esc).join(';'))];
    const blob = new Blob(["\ufeff" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(a.href);
  }

  function buildRows(tipo, total, occ, man, labelPrefix) {
    const rows = [];
    for (let i = 1; i <= total; i++) {
      const status = man[i - 1] ? 'Manutenção' : (occ[i - 1] ? 'Ocupado' : 'Livre');
      rows.push([tipo, i, `${labelPrefix} ${i}`, status]);
    }
    return rows;
  }

  function formatDateTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // Reconstrói quem está com cada item agora (último empréstimo não devolvido)
  function computeActiveLoans() {
    const movs = JSON.parse(localStorage.getItem('registros_movimentos') || '[]');
    movs.sort((a, b) => new Date(a.at) - new Date(b.at));

    const map = { notebooks: {}, celulares: {}, cameras: {} };
    for (const m of movs) {
      const tipo = m.recurso;
      const itens = Array.isArray(m.itens) ? m.itens : [];
      if (!tipo) continue;

      if (m.tipo === 'emprestimo') {
        for (const n of itens) {
          map[tipo][n] = {
            categoria: m.categoria || '',
            nome: m.nome || m.responsavel || '',
            turma: m.turma || '',
            disciplina: m.disciplina || '',
            atividade: m.atividade || '',
            cargo_setor: m.cargoSetor || '',  // <— NOVO (colaborador)
            email: m.email || '',
            at: m.at || ''
          };
        }
      } else if (m.tipo === 'devolucao') {
        for (const n of itens) {
          delete map[tipo][n];
        }
      }
    }
    return map;
  }

  function buildRowsDetailed(tipoKey, total, occ, man, labelPrefix, activeMap) {
    const tipoSing = (tipoKey === 'notebooks') ? 'notebook' : (tipoKey === 'celulares' ? 'celular' : 'camera');
    const rows = [];
    for (let i = 1; i <= total; i++) {
      const status = man[i - 1] ? 'Manutenção' : (occ[i - 1] ? 'Ocupado' : 'Livre');
      const a = activeMap?.[tipoKey]?.[i] || {};
      rows.push([
        tipoSing, i, `${labelPrefix} ${i}`, status,
        a.categoria || '', a.nome || '',
        a.cargo_setor || '',           // <— NOVO
        a.turma || '',
        a.disciplina || '',
        a.atividade || '',
        a.email || '',
        formatDateTime(a.at)
      ]);
    }
    return rows;
  }

  function exportResumo() {
    const now = new Date(); const pad = n => String(n).padStart(2, '0');
    const fname = `emprestimos_resumo_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}.csv`;

    const active = computeActiveLoans();
    const header = [
      'recurso', 'numero', 'rotulo', 'status',
      'categoria', 'nome', 'cargo_setor', 'turma', 'disciplina', 'atividade', 'email', 'data_form'
    ];

    const rows = [
      ...buildRowsDetailed('notebooks', totals.notebooks, nbOcc, nbMan, 'Notebook', active),
      ...buildRowsDetailed('celulares', totals.celulares, ceOcc, ceMan, 'Celular', active),
      ...buildRowsDetailed('cameras', totals.cameras, caOcc, caMan, 'Câmera', active),
    ];

    downloadCSV(fname, header, rows);
  }


  BTN_EXP?.addEventListener('click', exportResumo);

  BTN_MODEL_GLOBAL?.addEventListener('click', () => {
    const blob = new Blob(["\ufeffrecurso;numero;rotulo;status\n"], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'modelo_emprestimos_resumo.csv';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(a.href);
  });

  function parseCSV(text) {
    const lines = text.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return [];
    const delim = lines[0].includes(';') ? ';' : ',';
    const rows = [];
    for (let i = 0; i < lines.length; i++) {
      const cols = lines[i].split(delim).map(s => s.replace(/^"|"$/g, '').trim());
      if (i === 0 && /recurso/i.test(cols[0]) && /numero/i.test(cols[1])) continue; // header
      rows.push(cols);
    }
    return rows;
  }
  const normalizeTipo = s => {
    s = (s || '').toLowerCase();
    if (/note|notebook/.test(s)) return 'notebooks';
    if (/cel/.test(s)) return 'celulares';
    if (/cam/.test(s)) return 'cameras';
    return null;
  };
  const normalizeStatus = s => {
    s = (s || '').toLowerCase();
    if (/manut|indispon/i.test(s)) return 'manut';
    if (/ocup/.test(s) || s === '1' || s === 'true') return 'ocup';
    if (/livre/.test(s) || s === '0' || s === 'false') return 'livre';
    return null;
  };
  function applyRows(rows) {
    let updNB = false, updCE = false, updCA = false;
    for (const cols of rows) {
      if (cols.length < 4) continue;
      const tipoKey = normalizeTipo(cols[0]);
      const num = parseInt(cols[1], 10);
      const st = normalizeStatus(cols[3]);
      if (!tipoKey || !Number.isInteger(num) || st === null) continue;

      if (tipoKey === 'notebooks' && num >= 1 && num <= totals.notebooks) {
        if (st === 'manut') { nbMan[num - 1] = true; nbOcc[num - 1] = false; }
        else { nbMan[num - 1] = false; nbOcc[num - 1] = (st === 'ocup'); }
        updNB = true;
      }
      if (tipoKey === 'celulares' && num >= 1 && num <= totals.celulares) {
        if (st === 'manut') { ceMan[num - 1] = true; ceOcc[num - 1] = false; }
        else { ceMan[num - 1] = false; ceOcc[num - 1] = (st === 'ocup'); }
        updCE = true;
      }
      if (tipoKey === 'cameras' && num >= 1 && num <= totals.cameras) {
        if (st === 'manut') { caMan[num - 1] = true; caOcc[num - 1] = false; }
        else { caMan[num - 1] = false; caOcc[num - 1] = (st === 'ocup'); }
        updCA = true;
      }
    }
    if (updNB) { saveBoolArray('estado_notebooks', nbOcc); saveBoolArray('estado_notebooks_manut', nbMan); }
    if (updCE) { saveBoolArray('estado_celulares', ceOcc); saveBoolArray('estado_celulares_manut', ceMan); }
    if (updCA) { saveBoolArray('estado_cameras', caOcc); saveBoolArray('estado_cameras_manut', caMan); }

    renderBadges(); applyFilter();
    const msg = [updNB ? 'Notebooks' : null, updCE ? 'Celulares' : null, updCA ? 'Câmeras' : null].filter(Boolean).join(', ');
    alert(msg ? `Importação concluída: ${msg}.` : 'Nenhuma linha válida encontrada.');
  }
  function handleImport(file) {
    const reader = new FileReader();
    reader.onload = () => { try { applyRows(parseCSV(reader.result || '')); } catch (e) { console.error(e); alert('Falha ao importar o CSV.'); } };
    reader.readAsText(file, 'utf-8');
  }
  if (BTN_IMP && FILE_IMP) {
    BTN_IMP.addEventListener('click', () => FILE_IMP.click());
    FILE_IMP.addEventListener('change', e => {
      const f = e.target.files?.[0];
      if (f) handleImport(f);
      e.target.value = '';
    });
  }

  /* ==================== FORMULÁRIOS (MODAIS) ==================== */
  const BTN_ABRIR_EMP = document.getElementById('abrir-emprestar');
  const BTN_ABRIR_DEV = document.getElementById('abrir-devolver');

  function openModal(html) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';
    backdrop.innerHTML = html;
    document.body.appendChild(backdrop);

    // NOVO: trava rolagem do body enquanto o modal estiver aberto
    document.body.classList.add('modal-open');

    const close = () => {
      backdrop.remove();
      // NOVO: libera rolagem do body
      document.body.classList.remove('modal-open');
    };

    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
    backdrop.querySelector('.m-cancel')?.addEventListener('click', close);
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { document.removeEventListener('keydown', esc); close(); } });
    return { backdrop, close };
  }


  function optionsFor(tipo, mode) {
    // mode: 'loan' => livres (não ocupado e não manutenção)
    //       'return' => ocupados
    const total = totals[tipo];
    const occ = (tipo === 'notebooks') ? nbOcc : (tipo === 'celulares') ? ceOcc : caOcc;
    const man = (tipo === 'notebooks') ? nbMan : (tipo === 'celulares') ? ceMan : caMan;
    const opts = [];
    for (let i = 1; i <= total; i++) {
      const isOcc = !!occ[i - 1], isMan = !!man[i - 1];
      if (mode === 'loan' && (!isOcc && !isMan)) opts.push(i);
      if (mode === 'return' && isOcc) opts.push(i);
    }
    return opts;
  }

  function renderSelectItens(tipo, mode, selectEl) {
    const nums = optionsFor(tipo, mode);
    selectEl.innerHTML = '';
    for (const n of nums) {
      const opt = document.createElement('option');
      opt.value = String(n);
      opt.textContent = `${(tipo === 'notebooks') ? 'Notebook' : (tipo === 'celulares') ? 'Celular' : 'Câmera'} ${n}`;
      selectEl.appendChild(opt);
    }
    selectEl.disabled = nums.length === 0;
  }

  function formatDateTimeBr(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const p = n => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  // Gera e baixa o PDF do empréstimo (com logo e QR code do hash)
  async function generateLoanPDF(mov) {
    const wjspdf = window.jspdf;
    if (!wjspdf || !wjspdf.jsPDF) {
      alert('Não foi possível gerar o PDF (jsPDF não carregado).');
      return;
    }
    const { jsPDF } = wjspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' }); // A4

    const tipoSing = (mov.recurso === 'notebooks') ? 'Notebook' :
      (mov.recurso === 'celulares') ? 'Celular' : 'Câmera';
    const safe = v => (v == null ? '' : String(v));

    // 1) Cabeçalho com LOGO (se existir)
    let yPos = 40;
    // tenta carregar logo
    const logo = await loadLogoDataURL('../assets/icons/logo.png', 140, 60);
    if (logo) {
      // posiciona no topo-direito
      const xRight = 555; // margem dir ~40 (página ~595pt) => 595-40=555
      doc.addImage(logo.dataURL, 'PNG', xRight - logo.w, yPos - 20, logo.w, logo.h);
    }

    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text('Comprovante de Empréstimo', 40, yPos);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(`Data do registro: ${formatDateTimeBr(mov.at)}`, 40, yPos + 16);

    // Linha separadora
    yPos += 28;
    doc.setDrawColor(229, 231, 235); doc.line(40, yPos, 555, yPos);

    // 2) Dados do Solicitante
    yPos += 22;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('Dados do Solicitante', 40, yPos);

    const addLine = (label, value, x = 40, yInc = 18) => {
      if (!value) return;
      yPos += yInc;
      doc.setFont('helvetica', 'bold'); doc.text(`${label}:`, x, yPos);
      doc.setFont('helvetica', 'normal'); doc.text(safe(value), x + 120, yPos);
    };

    doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    addLine('Categoria', mov.categoria);
    addLine('Nome', mov.nome);
    if (mov.categoria === 'aluno') {
      addLine('Turma', mov.turma);
      addLine('Atividade', mov.atividade);
    }
    if (mov.categoria === 'professor') {
      addLine('Disciplina', mov.disciplina);
      addLine('Turma', mov.turma);
      addLine('Atividade', mov.atividade);
      addLine('E-mail', mov.email);
    }
    if (mov.categoria === 'colaborador') {
      addLine('Cargo/Setor', mov.cargoSetor);
      addLine('Turma', mov.turma);
      addLine('Atividade', mov.atividade);
      addLine('E-mail', mov.email);
    }

    // Observações
    if (safe(mov.obs)) {
      yPos += 22;
      doc.setFont('helvetica', 'bold'); doc.text('Observações:', 40, yPos);
      doc.setFont('helvetica', 'normal');
      const maxW = 515; // 555 - 40
      const lines = doc.splitTextToSize(safe(mov.obs), maxW);
      yPos += 16;
      lines.forEach(line => { doc.text(line, 40, yPos); yPos += 14; });
      yPos -= 6;
    }

    // 3) Tabela de Itens
    yPos += 20;
    if (doc.autoTable) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      doc.text('Itens Emprestados', 40, yPos);
      doc.autoTable({
        startY: yPos + 8,
        styles: { font: 'helvetica', fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] },
        head: [['Recurso', 'Número', 'Rótulo']],
        body: (mov.itens || []).map(n => [tipoSing, n, `${tipoSing} ${n}`]),
        margin: { left: 40, right: 40 }
      });
      yPos = doc.lastAutoTable.finalY || (yPos + 30);
    } else {
      doc.setFont('helvetica', 'bold'); doc.text('Itens Emprestados', 40, yPos);
      yPos += 16; doc.setFont('helvetica', 'bold');
      doc.text('Recurso', 40, yPos); doc.text('Número', 200, yPos); doc.text('Rótulo', 280, yPos);
      doc.setFont('helvetica', 'normal');
      (mov.itens || []).forEach(n => { yPos += 16; doc.text(tipoSing, 40, yPos); doc.text(String(n), 200, yPos); doc.text(`${tipoSing} ${n}`, 280, yPos); });
    }

    // 4) QR Code com hash do registro
    // Canonicaliza a carga para hash (somente campos relevantes)
    const payload = {
      at: mov.at, cat: mov.categoria, nome: mov.nome, rec: mov.recurso, itens: mov.itens,
      turma: mov.turma || '', disc: mov.disciplina || '', ativ: mov.atividade || '',
      cargo: mov.cargoSetor || '', email: mov.email || ''
    };
    const canonical = JSON.stringify(payload);
    const hash = await sha256Hex(canonical);
    const qrText = `EMPRESTIMO:${hash}`;
    let qrDataURL = null;
    try {
      if (window.QRCode?.toDataURL) {
        qrDataURL = await window.QRCode.toDataURL(qrText, { errorCorrectionLevel: 'M', margin: 1, width: 140 });
      }
    } catch (e) { /* ignora e segue sem QR */ }

    // Assinaturas + QR
    yPos += 30;
    const signY = Math.min(yPos, 720);
    doc.setDrawColor(0, 0, 0);
    // linhas de assinatura
    doc.line(60, signY, 260, signY);
    doc.text('Assinatura do Solicitante', 60, signY + 14);
    doc.line(340, signY, 540, signY);
    doc.text('Assinatura do Responsável', 340, signY + 14);

    // QR no canto inferior direito
    if (qrDataURL) {
      const qrSize = 110;
      const qrX = 555 - qrSize; // margem dir
      const qrY = signY - qrSize - 10;
      doc.addImage(qrDataURL, 'PNG', qrX, qrY, qrSize, qrSize);
      doc.setFontSize(9); doc.setTextColor(80);
      doc.text(`Hash: ${hash.slice(0, 16)}…`, qrX, qrY + qrSize + 12);
    }

    // Rodapé
    doc.setFontSize(9); doc.setTextColor(100);
    doc.text('Gerado automaticamente pelo sistema de empréstimos', 40, 810);

    // Nome do arquivo
    const d = mov.at ? new Date(mov.at) : new Date();
    const p2 = n => String(n).padStart(2, '0');
    const fname = `comprovante_emprestimo_${tipoSing.toLowerCase()}_${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}_${p2(d.getHours())}-${p2(d.getMinutes())}.pdf`;

    doc.save(fname);
  }


  function formatDateTimeBr(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const p = n => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  // Hash SHA-256 em hex (fallback simples se WebCrypto indisponível)
  async function sha256Hex(text) {
    if (crypto?.subtle) {
      const data = new TextEncoder().encode(text);
      const buf = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // fallback FNV-1a (não-criptográfico; só pra não quebrar)
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0; }
    return ('00000000' + h.toString(16)).slice(-8);
  }

  // Carrega e redimensiona a logo para DataURL (mantendo proporção)
  function loadLogoDataURL(url, maxW = 140, maxH = 60) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img;
        const ratio = Math.min(maxW / w, maxH / h, 1);
        const cw = Math.round(w * ratio), ch = Math.round(h * ratio);
        const c = document.createElement('canvas');
        c.width = cw; c.height = ch;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, cw, ch);
        resolve({ dataURL: c.toDataURL('image/png'), w: cw, h: ch });
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  /* ---- Modal: Emprestar (WIZARD) ---- */
  BTN_ABRIR_EMP?.addEventListener('click', () => {
    // estado do wizard
    const state = {
      categoria: '',                 // 'aluno' | 'professor' | 'colaborador'
      // aluno:
      turma: '', atividade: '',
      // professor:
      disciplina: '',
      // colaborador:
      cargoSetor: '',
      // comuns:
      nome: '', email: '',
      // itens:
      tipo: 'notebooks', itens: [],  // múltiplos
      // sem dataPrev
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

    function styleInputs(scope) {
      scope.querySelectorAll('.inp').forEach(el => {
        el.style.padding = '10px'; el.style.border = '1px solid #e5e7eb';
        el.style.borderRadius = '10px';
      });
    }

    const stepsEl = backdrop.querySelector('#emp-steps');
    const titleNum = backdrop.querySelector('#emp-passos-num');
    const btnBack = backdrop.querySelector('.m-back');
    const btnNext = backdrop.querySelector('.m-next');

    let step = 1; // 1..3
    const prefix = (tipo) => (tipo === 'notebooks') ? 'Notebook' : (tipo === 'celulares') ? 'Celular' : 'Câmera';

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
      styleInputs(stepsEl);
      btnNext.disabled = !state.categoria;
    }

    function renderStep2() {
      if (state.categoria === 'aluno') {
        stepsEl.innerHTML = `
        <form id="emp-step2-aluno">
          <div style="display:grid; gap:10px; margin:10px 0 6px">
            <input required name="nome" class="inp" placeholder="Nome completo do aluno" value="${state.nome || ''}" />
            <input required name="turma" class="inp" placeholder="Turma (ex.: 2ºA, 3ºB)" value="${state.turma || ''}" />
            <input required name="atividade" class="inp" placeholder="Atividade (ex.: pesquisa, trabalho X)" value="${state.atividade || ''}" />
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
        form.addEventListener('input', sync);
        styleInputs(stepsEl);
        sync();
        return;
      }

      if (state.categoria === 'professor') {
        stepsEl.innerHTML = `
        <form id="emp-step2-prof">
          <div style="display:grid; gap:10px; margin:10px 0 6px">
            <input required name="nome" class="inp" placeholder="Nome completo do professor" value="${state.nome || ''}" />
            <input required name="disciplina" class="inp" placeholder="Disciplina (ex.: Matemática)" value="${state.disciplina || ''}" />
            <input required name="turma" class="inp" placeholder="Turma (ex.: 2ºA, 3ºB)" value="${state.turma || ''}" />
            <input required name="atividade" class="inp" placeholder="Atividade (ex.: prova, projeto Y)" value="${state.atividade || ''}" />
            <input required type="email" name="email" class="inp" placeholder="E-mail corporativo" value="${state.email || ''}" />
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
        form.addEventListener('input', sync);
        styleInputs(stepsEl);
        sync();
        return;
      }

      // Colaborador: nome, cargo/setor, turma, atividade, e-mail corporativo (todos obrigatórios)
      stepsEl.innerHTML = `
      <form id="emp-step2-colab">
        <div style="display:grid; gap:10px; margin:10px 0 6px">
          <input required name="nome" class="inp" placeholder="Nome completo do colaborador" value="${state.nome || ''}" />
          <input required name="cargoSetor" class="inp" placeholder="Cargo / Setor" value="${state.cargoSetor || ''}" />
          <input required name="turma" class="inp" placeholder="Turma (ex.: 2ºA, 3ºB)" value="${state.turma || ''}" />
          <input required name="atividade" class="inp" placeholder="Atividade (ex.: atendimento, projeto Z)" value="${state.atividade || ''}" />
          <input required type="email" name="email" class="inp" placeholder="E-mail corporativo" value="${state.email || ''}" />
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
      form.addEventListener('input', sync);
      styleInputs(stepsEl);
      sync();
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

          <textarea name="obs" class="inp" placeholder="Observações (opcional)">${state.obs || ''}</textarea>
        </div>
      </form>
    `;

      const selTipo = stepsEl.querySelector('#emp-tipo');
      const grid = stepsEl.querySelector('#emp-grid');

      selTipo.value = state.tipo || 'notebooks';

      const renderGrid = () => {
        const nums = optionsFor(selTipo.value, 'loan'); // livres
        grid.innerHTML = '';
        const selectedSet = new Set(state.itens.map(Number));
        for (const n of nums) {
          const id = `chk-${selTipo.value}-${n}`;
          const lab = document.createElement('label');
          lab.className = 'toggle';
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.value = String(n);
          input.id = id;
          input.checked = selectedSet.has(n);
          input.addEventListener('change', () => {
            const all = Array.from(grid.querySelectorAll('input[type="checkbox"]:checked')).map(i => parseInt(i.value, 10));
            state.itens = all;
            btnNext.disabled = !(state.itens.length > 0);
          });
          lab.appendChild(input);
          lab.appendChild(document.createTextNode(' ' + `${prefix(selTipo.value)} ${n}`));
          grid.appendChild(lab);
        }
        btnNext.disabled = !(state.itens.length > 0);
      };

      selTipo.addEventListener('change', () => {
        state.tipo = selTipo.value; state.itens = [];
        renderGrid();
      });

      stepsEl.querySelector('textarea[name="obs"]').addEventListener('input', (e) => {
        state.obs = String(e.currentTarget.value || '').trim();
      });

      styleInputs(stepsEl);
      renderGrid();
    }

    function updateButtons() {
      btnBack.disabled = (step === 1);
      btnNext.textContent = (step === 3) ? 'Confirmar empréstimo' : 'Próximo';
    }

    function goTo(n) {
      step = Math.max(1, Math.min(3, n));
      titleNum.textContent = String(step);
      if (step === 1) renderStep1();
      if (step === 2) renderStep2();
      if (step === 3) renderStep3();
      updateButtons();
    }

    // Gera e baixa um CSV com todas as informações do empréstimo atual
    function downloadLoanCSV(mov) {
      const tipoSing = (mov.recurso === 'notebooks') ? 'Notebook' :
        (mov.recurso === 'celulares') ? 'Celular' : 'Câmera';

      const header = [
        'recurso', 'numero', 'rotulo',
        'categoria', 'nome', 'cargo_setor', 'turma', 'disciplina', 'atividade', 'email',
        'obs', 'data_form'
      ];

      const rows = (mov.itens || []).map((n) => ([
        tipoSing.toLowerCase(),
        n,
        `${tipoSing} ${n}`,
        mov.categoria || '',
        mov.nome || '',
        mov.cargoSetor || '',
        mov.turma || '',
        mov.disciplina || '',
        mov.atividade || '',
        mov.email || '',
        mov.obs || '',
        (typeof formatDateTime === 'function') ? formatDateTime(mov.at) : mov.at
      ]));

      const at = mov.at ? new Date(mov.at) : new Date();
      const pad = (x) => String(x).padStart(2, '0');
      const fname = `emprestimo_${tipoSing.toLowerCase()}_${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}_${pad(at.getHours())}-${pad(at.getMinutes())}.csv`;

      // usa a mesma util do export geral (downloadCSV(filename, header[], rows[][]))
      downloadCSV(fname, header, rows);
    }


    async function finalize() {
      const occ = (state.tipo === 'notebooks') ? nbOcc : (state.tipo === 'celulares') ? ceOcc : caOcc;
      const man = (state.tipo === 'notebooks') ? nbMan : (state.tipo === 'celulares') ? ceMan : caMan;
      const total = totals[state.tipo];

      const bloqueados = [], jaOcup = [], sucesso = [];
      for (const n of state.itens) {
        if (n < 1 || n > total) continue;
        if (man[n - 1]) { bloqueados.push(n); continue; }
        if (occ[n - 1]) { jaOcup.push(n); continue; }
        occ[n - 1] = true;
        sucesso.push(n);
      }

      if (state.tipo === 'notebooks') saveBoolArray('estado_notebooks', nbOcc);
      if (state.tipo === 'celulares') saveBoolArray('estado_celulares', ceOcc);
      if (state.tipo === 'cameras') saveBoolArray('estado_cameras', caOcc);

      if (sucesso.length) {
        const movBase = {
          tipo: 'emprestimo',
          categoria: state.categoria,
          nome: state.nome,
          recurso: state.tipo,
          itens: sucesso,
          obs: state.obs,
          at: new Date().toISOString()
        };
        if (state.categoria === 'aluno') {
          movBase.turma = state.turma;
          movBase.atividade = state.atividade;
        } else if (state.categoria === 'professor') {
          movBase.turma = state.turma;
          movBase.disciplina = state.disciplina;
          movBase.atividade = state.atividade;
          movBase.email = state.email; // e-mail corporativo
        } else { // colaborador
          movBase.cargoSetor = state.cargoSetor;
          movBase.turma = state.turma;
          movBase.atividade = state.atividade;
          movBase.email = state.email; // e-mail corporativo
        }
        const movimentos = JSON.parse(localStorage.getItem('registros_movimentos') || '[]');
        movimentos.push(movBase);
        localStorage.setItem('registros_movimentos', JSON.stringify(movimentos));
        async function enviarEmprestimoAoBackend(movBase) {
          const resp = await fetch('/api_loan.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recurso: movBase.recurso,       // notebooks|celulares|cameras
              codigos: movBase.itens,         // [1,2,3]
              form: {
                categoria: movBase.categoria,
                nome: movBase.nome,
                turma: movBase.turma || '',
                disciplina: movBase.disciplina || '',
                atividade: movBase.atividade || '',
                cargoSetor: movBase.cargoSetor || '',
                email: movBase.email || '',
                obs: movBase.obs || ''
              }
            })
          });
          const data = await resp.json();
          if (!data.ok) throw new Error(data.error || 'Falha no empréstimo');
          return data; // { emprestados:[], ocupados:[], manutencao:[], inexistentes:[] }
        }

        await generateLoanPDF(movBase);   // gera e baixa o PDF com logo + QR

      }

      renderBadges(); applyFilter();

      let msg = [];
      if (sucesso.length) msg.push(`Emprestados: ${sucesso.join(', ')}`);
      if (jaOcup.length) msg.push(`Já ocupados: ${jaOcup.join(', ')}`);
      if (bloqueados.length) msg.push(`Em manutenção (bloqueados): ${bloqueados.join(', ')}`);
      alert(msg.join('\n') || 'Nada a registrar.');
      close();
    }

    btnBack.addEventListener('click', () => goTo(step - 1));
    btnNext.addEventListener('click', () => {
      if (step < 3) goTo(step + 1);
      else finalize();
    });

    goTo(1);
  });


  /* ---- Modal: Devolver ---- */
  BTN_ABRIR_DEV?.addEventListener('click', () => {
    const { backdrop, close } = openModal(`
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="dev-title">
        <h3 id="dev-title">Registrar Devolução</h3>
        <form id="form-devolver">
          <div style="display:grid; gap:10px; margin:10px 0 6px">
            <input name="responsavel" placeholder="Responsável pela devolução (opcional)" class="inp" />
            <div style="display:grid; gap:6px">
              <label>Recurso</label>
              <select name="tipo" id="dev-tipo" class="inp" required>
                <option value="notebooks">Notebooks</option>
                <option value="celulares">Celulares</option>
                <option value="cameras">Câmeras</option>
              </select>
            </div>
            <div style="display:grid; gap:6px">
              <label>Itens emprestados (Ctrl/Cmd para múltiplos)</label>
              <select name="itens" id="dev-itens" class="inp" size="6" multiple required></select>
              <small style="color:#475569">Aparecem apenas itens atualmente ocupados.</small>
            </div>
            <textarea name="obs" class="inp" placeholder="Observações (opcional)"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline m-cancel">Cancelar</button>
            <button type="submit" class="btn btn-outline">Confirmar devolução</button>
          </div>
        </form>
      </div>
    `);

    backdrop.querySelectorAll('.inp').forEach(el => {
      el.style.padding = '10px'; el.style.border = '1px solid #e5e7eb';
      el.style.borderRadius = '10px';
    });

    const selTipo = backdrop.querySelector('#dev-tipo');
    const selItens = backdrop.querySelector('#dev-itens');
    const refresh = () => renderSelectItens(selTipo.value, 'return', selItens);
    selTipo.addEventListener('change', refresh);
    refresh();

    backdrop.querySelector('#form-devolver').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const resp = String(fd.get('responsavel') || '').trim();
      const tipo = String(fd.get('tipo'));
      const obs = String(fd.get('obs') || '').trim();

      const itensSel = Array.from(selItens.selectedOptions).map(o => parseInt(o.value, 10));
      if (!itensSel.length) { alert('Selecione ao menos um item.'); return; }

      const occ = (tipo === 'notebooks') ? nbOcc : (tipo === 'celulares') ? ceOcc : caOcc;
      const total = totals[tipo];

      const devolvidos = [], ignorados = [];
      for (const n of itensSel) {
        if (n < 1 || n > total) continue;
        if (!occ[n - 1]) { ignorados.push(n); continue; }
        occ[n - 1] = false;
        devolvidos.push(n);
      }

      if (tipo === 'notebooks') saveBoolArray('estado_notebooks', nbOcc);
      if (tipo === 'celulares') saveBoolArray('estado_celulares', ceOcc);
      if (tipo === 'cameras') saveBoolArray('estado_cameras', caOcc);

      if (devolvidos.length) {
        movimentos.push({
          tipo: 'devolucao', responsavel: resp, recurso: tipo, itens: devolvidos,
          obs, at: new Date().toISOString()
        });
        saveJSON('registros_movimentos', movimentos);
      }

      renderBadges(); applyFilter();

      let msg = [];
      if (devolvidos.length) msg.push(`Devolvidos: ${devolvidos.join(', ')}`);
      if (ignorados.length) msg.push(`Ignorados (já livres): ${ignorados.join(', ')}`);
      alert(msg.join('\n') || 'Nada a registrar.');
      close();
    });
  });

})();
