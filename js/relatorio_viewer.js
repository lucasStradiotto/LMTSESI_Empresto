(function(){
  function qs(key){ return new URLSearchParams(location.search).get(key) || ''; }
  function parseList(v){ return (v||'').split(',').map(s => parseInt(s.trim(),10)).filter(n => Number.isFinite(n)); }

  // Aceita tanto "rec" quanto "recurso"
  const tipo = qs('tipo'); // emprestimo | devolucao
  const recurso = qs('rec') || qs('recurso'); // notebooks|celulares|cameras
  const itens = parseList(qs('itens'));

  // Dados do solicitante (se passados na URL — ver patch no index.js abaixo)
  const mov = {
    recurso,
    itens,
    categoria: qs('cat') || qs('categoria') || '',
    nome: qs('nome') || '',
    turma: qs('turma') || '',
    disciplina: qs('disciplina') || '',
    atividade: qs('atividade') || '',
    cargoSetor: qs('cargoSetor') || qs('cargo_setor') || '',
    email: qs('email') || '',
    obs: qs('obs') || '',
    at: qs('at') || new Date().toISOString(),
    retirada_at: qs('retirada_at') || ''
  };

  async function go(){
    const st = document.getElementById('st');
    const sp = document.getElementById('sp');
    try{
      if (tipo === 'emprestimo') {
        await generateLoanPDF(mov);
      } else if (tipo === 'devolucao') {
        await generateReturnPDF(mov);
      } else {
        alert('Parâmetros inválidos no link do comprovante.');
        return;
      }
      st.textContent = 'PDF gerado. Caso o download não inicie, use o botão "Baixar novamente".';
    }catch(e){
      console.error('[relatorio_viewer] erro ao gerar PDF:', e);
      alert('Falha ao gerar o PDF no dispositivo.');
      st.textContent = 'Erro ao gerar PDF.';
    }finally{
      if (sp) sp.style.display='none';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-download')?.addEventListener('click', go);
    // Gera automaticamente ao abrir
    go();
  });
})();
