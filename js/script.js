/* Helpers globais compartilhados por todas as páginas
   - Detecta base dos endpoints (php/ ou ../php/)
   - API wrapper
   - Modal/confirm
   - Utils de data / hash
   - Geração de PDF com logo + QR (empréstimo e devolução)
*/
(function(){
  // Detecta se estamos em /views/
  const IN_VIEWS = location.pathname.includes('/views/');
  const API_BASE = IN_VIEWS ? '../php/' : 'php/';
  const ASSETS_BASE = IN_VIEWS ? '../assets/' : 'assets/';

  async function j(url, options={}){
    const r = await fetch(API_BASE + url, {
      headers: {'Content-Type':'application/json', ...(options.headers||{})},
      ...options
    });
    const ct = r.headers.get('content-type') || '';
    const parse = ct.includes('application/json') ? r.json() : r.text();
    const d = await parse;
    if (!r.ok || (d && d.ok===false)) throw new Error(d?.error || `HTTP ${r.status}`);
    return d;
  }

  // API pública
  window.API = {
    snapshot(){ return j('api_snapshot.php'); },
    counts(){ return j('api_counts.php'); },
    getItems(recurso){ return j(`api_get_items.php?recurso=${encodeURIComponent(recurso)}`); },
    loan(recurso, codigos, form){ return j('api_loan.php',{method:'POST',body:JSON.stringify({recurso,codigos,form})}); },
    devolver(recurso, codigos){ return j('api_return.php',{method:'POST',body:JSON.stringify({recurso,codigos})}); },
    toggleManut(recurso, codigo, ativo){ return j('api_toggle_manut.php',{method:'POST',body:JSON.stringify({recurso,codigo,ativo})}); },
    relatorioURL(params){ const qs = new URLSearchParams(params).toString(); return API_BASE+'api_relatorio.php?'+qs; },
    activeLoans(){ return j('api_active_loans.php'); }  // grupos por req_id
  };

  // Modal base
  window.openModal = function(html){
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';
    backdrop.innerHTML = html;
    document.body.appendChild(backdrop);
    document.body.classList.add('modal-open');
    const close = () => { backdrop.remove(); document.body.classList.remove('modal-open'); };
    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
    backdrop.querySelector('.m-cancel')?.addEventListener('click', close);
    document.addEventListener('keydown', function esc(e){ if(e.key==='Escape'){ document.removeEventListener('keydown', esc); close(); }});
    return { backdrop, close };
  };

  window.confirmModal = function({title, text, confirmText='Confirmar', cancelText='Cancelar'}){
    return new Promise(resolve=>{
      const {backdrop, close} = openModal(`
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="c-title">
          <h3 id="c-title">${title}</h3>
          <p style="margin:10px 0 18px">${text}</p>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline m-cancel">${cancelText}</button>
            <button type="button" class="btn btn-outline m-ok">${confirmText}</button>
          </div>
        </div>
      `);
      const cleanup = (v)=>{ close(); resolve(v); };
      backdrop.querySelector('.m-cancel').addEventListener('click', ()=>cleanup(false));
      backdrop.querySelector('.m-ok').addEventListener('click', ()=>cleanup(true));
    });
  };

  // Utils
  window.formatDateTimeBr = function(iso){
    if (!iso) return '';
    const d = new Date(iso);
    const p = n => String(n).padStart(2,'0');
    return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  window.sha256Hex = async function(text){
    if (crypto?.subtle){
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
    }
    // fallback simples
    let h = 0x811c9dc5;
    for (let i=0;i<text.length;i++){ h ^= text.charCodeAt(i); h = (h + ((h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24))) >>> 0; }
    return ('00000000'+h.toString(16)).slice(-8);
  };

  window.loadLogoDataURL = function(url, maxW=140, maxH=60){
    return new Promise(resolve=>{
      const img = new Image();
      img.onload = () => {
        const {naturalWidth:w, naturalHeight:h} = img;
        const ratio = Math.min(maxW / w, maxH / h, 1);
        const cw = Math.round(w * ratio), ch = Math.round(h * ratio);
        const c = document.createElement('canvas');
        c.width = cw; c.height = ch;
        c.getContext('2d').drawImage(img,0,0,cw,ch);
        resolve({dataURL:c.toDataURL('image/png'), w:cw, h:ch});
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  function recursoSingular(rec){
    return rec==='notebooks'?'Notebook':(rec==='celulares'?'Celular':'Câmera');
  }

  // ---------- PDF: Empréstimo ----------
  window.generateLoanPDF = async function(mov){
    const wjspdf = window.jspdf;
    if (!wjspdf || !wjspdf.jsPDF){ alert('jsPDF não carregado.'); return; }
    const { jsPDF } = wjspdf;
    const doc = new jsPDF({unit:'pt', format:'a4'});

    const tipoSing = recursoSingular(mov.recurso);
    const safe = v => (v==null ? '' : String(v));

    let yPos = 40;
    const logo = await loadLogoDataURL(ASSETS_BASE+'icons/logo.png', 140, 60);
    if (logo){
      const xRight = 555;
      doc.addImage(logo.dataURL, 'PNG', xRight - logo.w, yPos - 20, logo.w, logo.h);
    }

    doc.setFont('helvetica','bold'); doc.setFontSize(16);
    doc.text('Comprovante de Empréstimo', 40, yPos);
    doc.setFont('helvetica','normal'); doc.setFontSize(10);
    doc.text(`Data do registro: ${formatDateTimeBr(mov.at)}`, 40, yPos+16);

    yPos += 28;
    doc.setDrawColor(229,231,235); doc.line(40, yPos, 555, yPos);

    yPos += 22;
    doc.setFont('helvetica','bold'); doc.setFontSize(12);
    doc.text('Dados do Solicitante', 40, yPos);

    const addLine = (label, value, x=40, yInc=18) => {
      if (!value) return;
      yPos += yInc;
      doc.setFont('helvetica','bold'); doc.text(`${label}:`, x, yPos);
      doc.setFont('helvetica','normal'); doc.text(safe(value), x+120, yPos);
    };

    doc.setFont('helvetica','normal'); doc.setFontSize(11);
    addLine('Categoria', mov.categoria);
    addLine('Nome', mov.nome);
    if (mov.categoria === 'aluno'){
      addLine('Turma', mov.turma);
      addLine('Atividade', mov.atividade);
    }
    if (mov.categoria === 'professor'){
      addLine('Disciplina', mov.disciplina);
      addLine('Turma', mov.turma);
      addLine('Atividade', mov.atividade);
      addLine('E-mail', mov.email);
    }
    if (mov.categoria === 'colaborador'){
      addLine('Cargo/Setor', mov.cargoSetor);
      addLine('Turma', mov.turma);
      addLine('Atividade', mov.atividade);
      addLine('E-mail', mov.email);
    }

    if (safe(mov.obs)){
      yPos += 22;
      doc.setFont('helvetica','bold'); doc.text('Observações:', 40, yPos);
      doc.setFont('helvetica','normal');
      const maxW = 515;
      const lines = doc.splitTextToSize(safe(mov.obs), maxW);
      yPos += 16;
      lines.forEach(line => { doc.text(line, 40, yPos); yPos += 14; });
      yPos -= 6;
    }

    // Tabela itens
    yPos += 20;
    if (doc.autoTable){
      doc.setFont('helvetica','bold'); doc.setFontSize(12);
      doc.text('Itens Emprestados', 40, yPos);
      doc.autoTable({
        startY: yPos + 8,
        styles: { font: 'helvetica', fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: [241,245,249], textColor:[15,23,42] },
        head: [['Recurso','Número','Rótulo']],
        body: (mov.itens||[]).map(n=>[tipoSing,n,`${tipoSing} ${n}`]),
        margin: {left:40, right:40}
      });
      yPos = doc.lastAutoTable.finalY || (yPos + 30);
    }

    // QR + hash
    const payload = {
      at: mov.at, cat: mov.categoria, nome: mov.nome, rec: mov.recurso, itens: mov.itens,
      turma: mov.turma||'', disc: mov.disciplina||'', ativ: mov.atividade||'',
      cargo: mov.cargoSetor||'', email: mov.email||''
    };
    const canonical = JSON.stringify(payload);
    const hash = await sha256Hex(canonical);

    let qrDataURL = null;
    try{
      if (window.QRCode?.toDataURL){
        qrDataURL = await window.QRCode.toDataURL(`EMPRESTIMO:${hash}`, { errorCorrectionLevel:'M', margin: 1, width: 140 });
      }
    }catch(e){}

    yPos += 30;
    const signY = Math.min(yPos, 720);
    doc.setDrawColor(0,0,0);
    doc.line(60, signY, 260, signY);
    doc.text('Assinatura do Solicitante', 60, signY+14);
    doc.line(340, signY, 540, signY);
    doc.text('Assinatura do Responsável', 340, signY+14);

    if (qrDataURL){
      const qrSize = 110;
      const qrX = 555 - qrSize;
      const qrY = signY - qrSize - 10;
      doc.addImage(qrDataURL, 'PNG', qrX, qrY, qrSize, qrSize);
      doc.setFontSize(9); doc.setTextColor(80);
      doc.text(`Hash: ${hash.slice(0,16)}…`, qrX, qrY + qrSize + 12);
    }

    doc.setFontSize(9); doc.setTextColor(100);
    doc.text('Gerado automaticamente pelo sistema de empréstimos', 40, 810);

    const d = mov.at ? new Date(mov.at) : new Date();
    const p2 = n => String(n).padStart(2,'0');
    const fname = `comprovante_emprestimo_${tipoSing.toLowerCase()}_${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}_${p2(d.getHours())}-${p2(d.getMinutes())}.pdf`;
    doc.save(fname);
  };

  // ---------- PDF: Devolução ----------
  window.generateReturnPDF = async function(mov){
    const wjspdf = window.jspdf;
    if (!wjspdf || !wjspdf.jsPDF){ alert('jsPDF não carregado.'); return; }
    const { jsPDF } = wjspdf;
    const doc = new jsPDF({unit:'pt', format:'a4'});

    const tipoSing = recursoSingular(mov.recurso);
    const safe = v => (v==null ? '' : String(v));

    let yPos = 40;
    const logo = await loadLogoDataURL(ASSETS_BASE+'icons/logo.png', 140, 60);
    if (logo){
      const xRight = 555;
      doc.addImage(logo.dataURL, 'PNG', xRight - logo.w, yPos - 20, logo.w, logo.h);
    }

    doc.setFont('helvetica','bold'); doc.setFontSize(16);
    doc.text('Comprovante de Devolução', 40, yPos);
    doc.setFont('helvetica','normal'); doc.setFontSize(10);
    doc.text(`Devolvido em: ${formatDateTimeBr(mov.at)}`, 40, yPos+16);
    if (mov.retirada_at) doc.text(`Retirado em: ${formatDateTimeBr(mov.retirada_at)}`, 200, yPos+16);

    yPos += 28;
    doc.setDrawColor(229,231,235); doc.line(40, yPos, 555, yPos);

    yPos += 22;
    doc.setFont('helvetica','bold'); doc.setFontSize(12);
    doc.text('Dados do Solicitante', 40, yPos);

    const addLine = (label, value, x=40, yInc=18) => {
      if (!value) return;
      yPos += yInc;
      doc.setFont('helvetica','bold'); doc.text(`${label}:`, x, yPos);
      doc.setFont('helvetica','normal'); doc.text(safe(value), x+120, yPos);
    };

    doc.setFont('helvetica','normal'); doc.setFontSize(11);
    addLine('Categoria', mov.categoria);
    addLine('Nome', mov.nome);
    if (mov.categoria === 'aluno'){
      addLine('Turma', mov.turma);
      addLine('Atividade', mov.atividade);
    }
    if (mov.categoria === 'professor'){
      addLine('Disciplina', mov.disciplina);
      addLine('Turma', mov.turma);
      addLine('Atividade', mov.atividade);
      addLine('E-mail', mov.email);
    }
    if (mov.categoria === 'colaborador'){
      addLine('Cargo/Setor', mov.cargoSetor);
      addLine('Turma', mov.turma);
      addLine('Atividade', mov.atividade);
      addLine('E-mail', mov.email);
    }
    if (safe(mov.obs)){
      yPos += 22;
      doc.setFont('helvetica','bold'); doc.text('Observações:', 40, yPos);
      doc.setFont('helvetica','normal');
      const maxW = 515;
      const lines = doc.splitTextToSize(safe(mov.obs), maxW);
      yPos += 16;
      lines.forEach(line => { doc.text(line, 40, yPos); yPos += 14; });
      yPos -= 6;
    }

    // Tabela itens devolvidos
    yPos += 20;
    if (doc.autoTable){
      doc.setFont('helvetica','bold'); doc.setFontSize(12);
      doc.text('Itens Devolvidos', 40, yPos);
      doc.autoTable({
        startY: yPos + 8,
        styles: { font: 'helvetica', fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: [241,245,249], textColor:[15,23,42] },
        head: [['Recurso','Número','Rótulo']],
        body: (mov.itens||[]).map(n=>[tipoSing,n,`${tipoSing} ${n}`]),
        margin: {left:40, right:40}
      });
      yPos = doc.lastAutoTable.finalY || (yPos + 30);
    }

    // Hash simples do recibo
    const payload = {
      at: mov.at, rec: mov.recurso, itens: mov.itens,
      ret: mov.retirada_at || null, cat: mov.categoria, nome: mov.nome
    };
    const canonical = JSON.stringify(payload);
    const hash = await sha256Hex(canonical);

    yPos += 30;
    const signY = Math.min(yPos, 720);
    doc.setDrawColor(0,0,0);
    doc.line(60, signY, 260, signY);
    doc.text('Assinatura do Solicitante', 60, signY+14);
    doc.line(340, signY, 540, signY);
    doc.text('Assinatura do Responsável', 340, signY+14);

    doc.setFontSize(9); doc.setTextColor(100);
    doc.text(`Hash: ${hash.slice(0,16)}…`, 40, 810);
    doc.text('Gerado automaticamente pelo sistema de empréstimos', 160, 810);

    const d = mov.at ? new Date(mov.at) : new Date();
    const p2 = n => String(n).padStart(2,'0');
    const fname = `comprovante_devolucao_${tipoSing.toLowerCase()}_${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}_${p2(d.getHours())}-${p2(d.getMinutes())}.pdf`;
    doc.save(fname);
  };
})();
