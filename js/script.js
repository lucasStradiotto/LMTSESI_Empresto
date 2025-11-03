/* Helpers globais compartilhados por todas as páginas
   - Detecta base dos endpoints (php/ ou ../php/)
   - API wrapper
   - Modal base + Modais padrão (confirmModal / notifyModal)
   - Utils de data / hash
   - Loader robusto OFFLINE-FIRST (jsPDF / AutoTable / QRCode)
   - Geração de PDF com logo + QR (empréstimo e devolução)
   - Modal de QR com botão "Baixar PDF"
*/
(function () {
  'use strict';

  // Detecta se estamos em /views/
  const IN_VIEWS = location.pathname.includes('/views/');
  const API_BASE = IN_VIEWS ? '../php/' : 'php/';
  const ASSETS_BASE = IN_VIEWS ? '../assets/' : 'assets/';
  const VENDOR = (IN_VIEWS ? '../' : '') + 'assets/vendor/';

  // Converte qualquer URL (até relativa) em ABSOLUTA, baseada na página atual
  function toAbsoluteURL(u) {
    try {
      // Se você tiver um domínio/IP público estável, pode setar:
      // window.PUBLIC_BASE_URL = 'http://192.168.0.50/LMTSESI_EMPRESTO/';
      if (window.PUBLIC_BASE_URL && !/^https?:\/\//i.test(u)) {
        return new URL(u, window.PUBLIC_BASE_URL).href;
      }
      return new URL(u, location.href).href; // fallback: resolve relativo contra a página atual
    } catch { return u; }
  }


  // ---------------------- Fetch JSON helper ----------------------
  // SUBSTITUA sua função j() por esta versão “JSON-only”
  async function j(url, options = {}) {
    const r = await fetch(API_BASE + url, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });

    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      const preview = (await r.text()).slice(0, 300);
      throw new Error(`Resposta não-JSON de ${url}. Prévia: ${preview}`);
    }

    const d = await r.json();
    if (!r.ok || (d && d.ok === false)) {
      throw new Error(d?.error || `HTTP ${r.status}`);
    }
    return d;
  }

  // --------------------------- API -------------------------------
  window.API = {
    snapshot() { return j('api_snapshot.php'); },
    counts() { return j('api_counts.php'); },
    getItems(recurso) { return j(`api_get_items.php?recurso=${encodeURIComponent(recurso)}`); },
    loan(recurso, codigos, form) { return j('api_loan.php', { method: 'POST', body: JSON.stringify({ recurso, codigos, form }) }); },
    devolver(recurso, codigos) { return j('api_return.php', { method: 'POST', body: JSON.stringify({ recurso, codigos }) }); },
    toggleManut(recurso, codigo, ativo) { return j('api_toggle_manut.php', { method: 'POST', body: JSON.stringify({ recurso, codigo, ativo }) }); },
    relatorioURL(params) { const qs = new URLSearchParams(params).toString(); return API_BASE + 'api_relatorio.php?' + qs; },
    activeLoans() { return j('api_active_loans.php'); }  // grupos por req_id
  };

  // --------------------------- Modal base ------------------------
  window.openModal = function (html) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';
    backdrop.innerHTML = html;
    document.body.appendChild(backdrop);
    document.body.classList.add('modal-open');

    const modal = backdrop.querySelector('.modal');
    const btnCancel = backdrop.querySelector('.m-cancel');

    // offset 50px no topo + altura útil
    modal.style.marginTop = '50px';
    modal.style.maxHeight = 'calc(100vh - 50px - 24px)';

    const close = () => {
      backdrop.remove();
      document.body.classList.remove('modal-open');
    };

    // Fechar ao clicar fora
    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
    // Fechar no botão cancelar
    btnCancel?.addEventListener('click', close);
    // ESC
    const esc = (e) => { if (e.key === 'Escape') { document.removeEventListener('keydown', esc); close(); } };
    document.addEventListener('keydown', esc);

    // Foco inicial
    setTimeout(() => {
      const focusable = modal.querySelector('[autofocus], .btn-primary, .btn-confirm, button, [href], input, select, textarea');
      (focusable || modal).focus?.();
    }, 0);

    return { backdrop, modal, close };
  };

  // Ícones SVG por tipo (cores via CSS)
  function iconSVG(type) {
    const base = 'width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false"';
    switch (type) {
      case 'success': return `<svg ${base}><path d="M22 11a10 10 0 1 1-10-10"></path><path d="M7 12l3 3 7-7"></path></svg>`;
      case 'warning': return `<svg ${base}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3H20.47a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
      case 'danger': return `<svg ${base}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
      case 'info':
      default: return `<svg ${base}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }
  }
  window.iconSVG = iconSVG;

  // --------------------- Modal de Confirmação --------------------
  window.confirmModal = function ({ title = 'Confirmar', text = '', html = '', confirmText = 'Confirmar', cancelText = 'Cancelar', type = 'info' } = {}) {
    return new Promise(resolve => {
      const { backdrop, modal, close } = openModal(`
        <div class="modal is-${type}" role="dialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-desc" tabindex="-1">
          <div class="modal-header">
            <span class="modal-icon">${iconSVG(type)}</span>
            <h3 id="dlg-title" class="modal-title">${title}</h3>
          </div>
          <div id="dlg-desc" class="modal-body">
            ${html || `<p>${String(text || '')}</p>`}
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost m-cancel">${cancelText}</button>
            <button type="button" class="btn btn-primary btn-confirm">${confirmText}</button>
          </div>
        </div>
      `);

      const btnOk = backdrop.querySelector('.btn-confirm');
      const btnCancel = backdrop.querySelector('.m-cancel');
      const done = (val) => { close(); resolve(val); };

      btnOk.addEventListener('click', () => done(true));
      btnCancel.addEventListener('click', () => done(false));
      backdrop.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); done(true); } }, { once: true });
    });
  };

  // ----------------------- Modal de Aviso ------------------------
  async function notifyModal({ title = 'Aviso', text = '', html = '', type = 'info', okText = 'OK', autoCloseMs = 0 } = {}) {
    return new Promise(resolve => {
      const { backdrop, modal, close } = openModal(`
        <div class="modal is-${type}" role="dialog" aria-modal="true" aria-labelledby="ntf-title" aria-describedby="ntf-desc" tabindex="-1">
          <div class="modal-header">
            <span class="modal-icon">${iconSVG(type)}</span>
            <h3 id="ntf-title" class="modal-title">${title}</h3>
          </div>
          <div id="ntf-desc" class="modal-body">
            ${html || `<p>${String(text || '')}</p>`}
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-primary m-ok">${okText}</button>
          </div>
        </div>
      `);
      const ok = backdrop.querySelector('.m-ok');
      const done = () => { close(); resolve(true); };
      ok.addEventListener('click', done);

      if (autoCloseMs && Number(autoCloseMs) > 0) setTimeout(done, Number(autoCloseMs));
      backdrop.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); done(); } }, { once: true });
    });
  }
  window.notifyModal = notifyModal;

  // Substitui alert() global por notifyModal (padrão do sistema)
  window.alert = function (message) {
    return notifyModal({ title: 'Aviso', text: String(message || ''), type: 'info', okText: 'OK' });
  };

  // ---------------------------- Utils -----------------------------
  window.formatDateTimeBr = function (iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const p = n => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  window.sha256Hex = async function (text) {
    if (crypto?.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // fallback simples (não-criptográfico)
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0; }
    return ('00000000' + h.toString(16)).slice(-8);
  };

  window.loadLogoDataURL = function (url, maxW = 140, maxH = 60) {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img;
        const ratio = Math.min(maxW / w, maxH / h, 1);
        const cw = Math.round(w * ratio), ch = Math.round(h * ratio);
        const c = document.createElement('canvas');
        c.width = cw; c.height = ch;
        c.getContext('2d').drawImage(img, 0, 0, cw, ch);
        resolve({ dataURL: c.toDataURL('image/png'), w: cw, h: ch });
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  function recursoSingular(rec) {
    return rec === 'notebooks' ? 'Notebook' : (rec === 'celulares' ? 'Celular' : 'Câmera');
  }

  // -------------------- Loaders (jsPDF / AutoTable / QR) ----------
  function alreadyLoaded(sub) {
    return Array.from(document.scripts).some(s => s.src && s.src.includes(sub));
  }
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (alreadyLoaded(src)) return resolve(true);
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.onload = () => resolve(true);
      s.onerror = () => reject(new Error('Falha ao carregar ' + src));
      document.head.appendChild(s);
    });
  }

  async function ensureQRReady() {
    // Se já tem (com adaptador), ok
    if (window.QRCode?.toDataURL) return true;

    const sources = [
      VENDOR + 'qrcode.min.js',                                            // local (recomendado)
      'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
      'https://cdn.jsdelivr.net/npm/qrcodejs/qrcode.min.js'
    ];

    for (const src of sources) {
      try {
        await loadScript(src);
        // se for QRCode.js (DavidShim), instalar adaptador .toDataURL()
        if (!window.QRCode?.toDataURL && window.QRCode) {
          window.QRCode.toDataURL = (text, { width = 220, margin = 1, errorCorrectionLevel = 'M' } = {}) => {
            return new Promise((resolve) => {
              const tmp = document.createElement('div');
              tmp.style.position = 'fixed';
              tmp.style.left = '-99999px';
              document.body.appendChild(tmp);
              const qropts = {
                text,
                width, height: width,
                correctLevel: window.QRCode.CorrectLevel?.[errorCorrectionLevel] ?? window.QRCode.CorrectLevel.M
              };
              // eslint-disable-next-line no-new
              new window.QRCode(tmp, qropts);
              setTimeout(() => {
                const canvas = tmp.querySelector('canvas');
                let dataURL = '';
                try { dataURL = canvas?.toDataURL('image/png') || ''; } catch { }
                tmp.remove();
                resolve(dataURL);
              }, 0);
            });
          };
        }
        if (window.QRCode?.toDataURL) return true;
      } catch (e) { /* tenta próximo */ }
    }
    throw new Error('QRCode lib indisponível');
  }

  async function ensurePdfReady() {
    // jsPDF (local-first)
    if (!window.jspdf?.jsPDF) {
      try { await loadScript(VENDOR + 'jspdf.umd.min.js'); } catch { }
    }
    if (!window.jspdf?.jsPDF) {
      try { await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'); } catch { }
    }
    if (!window.jspdf?.jsPDF) throw new Error('jsPDF não disponível');

    // AutoTable
    if (!window.jspdf.jsPDF.API?.autoTable) {
      try { await loadScript(VENDOR + 'jspdf.plugin.autotable.min.js'); } catch { }
    }
    if (!window.jspdf.jsPDF.API?.autoTable) {
      try { await loadScript('https://unpkg.com/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js'); } catch { }
    }

    // QR (opcional no PDF)
    try { await ensureQRReady(); } catch { }
  }

  // --------- Fallback caso autoTable não esteja disponível --------
  function drawItemsListFallback(doc, startY, tipoSing, itens) {
    let y = startY + 8;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('Itens', 40, startY);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11);

    const lineH = 14, bottom = 800;
    (itens || []).forEach((n) => {
      if (y > bottom) { doc.addPage(); y = 60; }
      doc.text(`• ${tipoSing} ${n}`, 48, y);
      y += lineH;
    });
    return y + 4;
  }

  // ---------------------- PDF: Empréstimo -------------------------
  window.generateLoanPDF = async function (mov) {
    try {
      await ensurePdfReady();
    } catch (e) {
      await notifyModal({ title: 'PDF', text: 'Não foi possível carregar a biblioteca de PDF. Verifique a internet e tente novamente.', type: 'danger' });
      console.error(e);
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const tipoSing = recursoSingular(mov.recurso);
    const safe = v => (v == null ? '' : String(v));

    let yPos = 40;
    const logo = await loadLogoDataURL(ASSETS_BASE + 'icons/owl_244352.png', 140, 60);
    if (logo) {
      const xRight = 555;
      doc.addImage(logo.dataURL, 'PNG', xRight - logo.w, yPos - 20, logo.w, logo.h);
    }

    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text('Comprovante de Empréstimo', 40, yPos);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(`Data do registro: ${formatDateTimeBr(mov.at)}`, 40, yPos + 16);

    yPos += 28;
    doc.setDrawColor(229, 231, 235); doc.line(40, yPos, 555, yPos);

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

    if (safe(mov.obs)) {
      yPos += 22;
      doc.setFont('helvetica', 'bold'); doc.text('Observações:', 40, yPos);
      doc.setFont('helvetica', 'normal');
      const maxW = 515;
      const lines = doc.splitTextToSize(safe(mov.obs), maxW);
      yPos += 16;
      lines.forEach(line => { doc.text(line, 40, yPos); yPos += 14; });
      yPos -= 6;
    }

    // Tabela de itens (usa AutoTable se disponível)
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
    }

    // Hash simples (sem QR no PDF)
    const payload = {
      at: mov.at, cat: mov.categoria, nome: mov.nome, rec: mov.recurso, itens: mov.itens,
      turma: mov.turma || '', disc: mov.disciplina || '', ativ: mov.atividade || '',
      cargo: mov.cargoSetor || '', email: mov.email || ''
    };
    const canonical = JSON.stringify(payload);
    const hash = await sha256Hex(canonical);

    // Assinaturas
    yPos += 30;
    const signY = Math.min(yPos, 720);
    doc.setDrawColor(0, 0, 0);
    doc.line(60, signY, 260, signY);
    doc.text('Assinatura do Solicitante', 60, signY + 14);
    doc.line(340, signY, 540, signY);
    doc.text('Assinatura do Responsável', 340, signY + 14);

    // Rodapé: Hash + mensagem
    doc.setFontSize(9); doc.setTextColor(100);
    doc.text(`Hash: ${hash.slice(0, 16)}…`, 40, 810);
    doc.text('Gerado automaticamente pelo sistema de empréstimos', 160, 810);

    const d = mov.at ? new Date(mov.at) : new Date();
    const p2 = n => String(n).padStart(2, '0');
    const fname = `comprovante_emprestimo_${tipoSing.toLowerCase()}_${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}_${p2(d.getHours())}-${p2(d.getMinutes())}.pdf`;
    doc.save(fname);
  };


  // ---------------------- PDF: Devolução --------------------------
  window.generateReturnPDF = async function (mov) {
    try {
      await ensurePdfReady();
    } catch (e) {
      await notifyModal({ title: 'PDF', text: 'Não foi possível carregar a biblioteca de PDF. Verifique a internet e tente novamente.', type: 'danger' });
      console.error(e);
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const tipoSing = recursoSingular(mov.recurso);
    const safe = v => (v == null ? '' : String(v));

    let yPos = 40;
    const logo = await loadLogoDataURL(ASSETS_BASE + 'icons/owl_244352.png', 140, 60);
    if (logo) {
      const xRight = 555;
      doc.addImage(logo.dataURL, 'PNG', xRight - logo.w, yPos - 20, logo.w, logo.h);
    }

    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text('Comprovante de Devolução', 40, yPos);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(`Devolvido em: ${formatDateTimeBr(mov.at)}`, 40, yPos + 16);
    if (mov.retirada_at) doc.text(`Retirado em: ${formatDateTimeBr(mov.retirada_at)}`, 200, yPos + 16);

    yPos += 28;
    doc.setDrawColor(229, 231, 235); doc.line(40, yPos, 555, yPos);

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
    if (safe(mov.obs)) {
      yPos += 22;
      doc.setFont('helvetica', 'bold'); doc.text('Observações:', 40, yPos);
      doc.setFont('helvetica', 'normal');
      const maxW = 515;
      const lines = doc.splitTextToSize(safe(mov.obs), maxW);
      yPos += 16;
      lines.forEach(line => { doc.text(line, 40, yPos); yPos += 14; });
      yPos -= 6;
    }

    // Itens devolvidos (AutoTable ou fallback)
    yPos += 20;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('Itens Devolvidos', 40, yPos);
    if (doc.autoTable) {
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
      yPos = drawItemsListFallback(doc, yPos + 20, tipoSing, mov.itens);
    }

    // Hash simples
    const payload = {
      at: mov.at, rec: mov.recurso, itens: mov.itens,
      ret: mov.retirada_at || null, cat: mov.categoria, nome: mov.nome
    };
    const canonical = JSON.stringify(payload);
    const hash = await sha256Hex(canonical);

    yPos += 30;
    const signY = Math.min(yPos, 720);
    doc.setDrawColor(0, 0, 0);
    doc.line(60, signY, 260, signY);
    doc.text('Assinatura do Solicitante', 60, signY + 14);
    doc.line(340, signY, 540, signY);
    doc.text('Assinatura do Responsável', 340, signY + 14);

    doc.setFontSize(9); doc.setTextColor(100);
    doc.text(`Hash: ${hash.slice(0, 16)}…`, 40, 810);
    doc.text('Gerado automaticamente pelo sistema de empréstimos', 160, 810);

    const d = mov.at ? new Date(mov.at) : new Date();
    const p2 = n => String(n).padStart(2, '0');
    const fname = `comprovante_devolucao_${tipoSing.toLowerCase()}_${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}_${p2(d.getHours())}-${p2(d.getMinutes())}.pdf`;
    doc.save(fname);
  };

  // ---------------- Modal com QR (link + botão Baixar PDF) -------
  window.showQRCodeModal = async function ({
    url,
    title = 'Comprovante',
    subtitle = 'Escaneie para abrir o PDF',
    copyHint = 'Toque para copiar o link',
    onDownload = null // callback opcional que gera/baixa o PDF
  }) {
    const target = toAbsoluteURL(url);
    try { await ensureQRReady(); } catch (e) {
      await alert('Não foi possível carregar a biblioteca de QR Code.');
      console.error(e); return;
    }

    let dataURL = '';
    try {
      dataURL = await window.QRCode.toDataURL(target, { errorCorrectionLevel: 'M', margin: 1, width: 220 });
    } catch (e) { console.error(e); }

    const { backdrop } = openModal(`
      <div class="modal is-info" role="dialog" aria-modal="true" tabindex="-1">
        <div class="modal-header">
          <span class="modal-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 focusable="false" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <path d="M3 14h7v7H3z"></path>
            </svg>
          </span>
          <h3 class="modal-title">${title}</h3>
        </div>
        <div class="modal-body" style="display:grid; gap:12px; text-align:center">
          <div>${subtitle}</div>
          <div style="display:flex; justify-content:center">
            <img src="${dataURL}" alt="QR Code" style="width:220px;height:220px;border-radius:8px;box-shadow:0 6px 16px rgba(0,0,0,.12); background:#fff; padding:6px">
          </div>
          <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap">
            <a href="${target}" target="_blank" class="btn btn-primary">Abrir relatório agora</a>
            ${onDownload ? `<button type="button" class="btn" id="btn-download-pdf">Baixar PDF</button>` : ``}
          </div>
          <button type="button" class="btn btn-ghost" id="copy-link" title="${copyHint}" style="justify-self:center; max-width:90%; overflow:hidden; text-overflow:ellipsis">${target}</button>
          <small class="muted">Compartilhe este QR/link para acessar o PDF em outro dispositivo.</small>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary m-cancel">Fechar</button>
        </div>
      </div>
    `);

    backdrop.querySelector('#copy-link')?.addEventListener('click', async () => {
      const el = backdrop.querySelector('#copy-link');
      const text = el?.textContent?.trim() || '';

      // 1) Tenta Clipboard API moderna (funciona em HTTPS / localhost)
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          await notifyModal({ title: 'Link copiado', text: 'O link do relatório foi copiado para a área de transferência.', type: 'success', autoCloseMs: 1200 });
          return;
        }
      } catch (e) {
        // continua pro fallback
      }

      // 2) Fallback clássico: textarea temporário + execCommand
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.top = '-2000px';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand('copy'); // alguns browsers antigos ainda permitem
        document.body.removeChild(ta);
        if (ok) {
          await notifyModal({ title: 'Link copiado', text: 'Copiado via fallback.', type: 'success', autoCloseMs: 1200 });
          return;
        }
      } catch (e) {
        // continua
      }

      // 3) Último recurso: seleciona o próprio botão para o usuário copiar manualmente
      try {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch { }
      await alert('Não foi possível copiar automaticamente. O link foi selecionado; use Ctrl/Cmd+C.');
    });


    // Baixar PDF (callback)
    const btnDl = backdrop.querySelector('#btn-download-pdf');
    if (btnDl && typeof onDownload === 'function') {
      btnDl.addEventListener('click', async () => {
        try { await onDownload(); }
        catch (e) {
          console.error('Falha ao gerar/baixar o PDF:', e);
          await alert('Não foi possível gerar o PDF. Tente novamente.');
        }
      });
    }
  };

  // Diagnóstico rápido (opcional)
  window.pdfDiagnostics = async function () {
    const hasJ = !!(window.jspdf?.jsPDF);
    const hasT = !!(window.jspdf?.jsPDF?.API?.autoTable);
    const hasQ = !!(window.QRCode && (window.QRCode.toDataURL || window.QRCode.CorrectLevel));
    await notifyModal({
      title: 'Diagnóstico PDF',
      type: hasJ ? (hasT ? 'success' : 'warning') : 'danger',
      html: `
        <div style="display:grid;gap:8px">
          <div><strong>jsPDF:</strong> ${hasJ ? 'OK ✅' : 'NÃO ❌'}</div>
          <div><strong>AutoTable:</strong> ${hasT ? 'OK ✅' : 'AUSENTE ⚠️'}</div>
          <div><strong>QRCode:</strong> ${hasQ ? 'OK ✅' : 'AUSENTE ⚠️'}</div>
          <div><small>Preferência local: <code>${VENDOR}</code></small></div>
        </div>
      `
    });
  };

})();
