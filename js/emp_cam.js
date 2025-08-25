(() => {
  const TOTAL = 2, COLUNAS = 2;
  const tbody = document.querySelector('#tabela-cameras tbody');
  const inViews = /\/views(\/|$)/i.test(location.pathname);
  const ICON_SRC  = (inViews ? '../' : '') + 'assets/icons/camera.png';
  const MAINT_SRC = (inViews ? '../' : '') + 'assets/icons/manutencao.png';
  const RESUMO = document.getElementById('resumo-cam');
  const KEY_OCC = 'estado_cameras';
  const KEY_MAN = 'estado_cameras_manut';
  const BTN_EXPORT = document.getElementById('export-cam');
  const BTN_IMPORT = document.getElementById('import-cam');
  const FILE_IMPORT= document.getElementById('import-cam-file');

  const load=(k,t)=>{try{const r=JSON.parse(localStorage.getItem(k)||'[]');const a=Array.isArray(r)?r.slice(0,t):[]; while(a.length<t)a.push(false); return a;}catch{return Array.from({length:t},()=>false)}};
  const save=(k,a)=>localStorage.setItem(k, JSON.stringify(a));
  const sum=a=>a.reduce((x,y)=>x+(y?1:0),0);
  const occ=load(KEY_OCC,TOTAL);
  const man=load(KEY_MAN,TOTAL);

  const updateResumo=()=>{ const livres=TOTAL-(sum(occ)+sum(man)); if(RESUMO) RESUMO.textContent=`${livres}/${TOTAL} livres`; };
  updateResumo();

  function confirmModal({title,text,confirmText='Confirmar',cancelText='Cancelar'}){
    return new Promise(resolve=>{
      const b=document.createElement('div'); b.className='modal-backdrop open';
      b.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-title">
        <h3 id="m-title">${title}</h3><p>${text}</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline m-cancel">${cancelText}</button>
          <button type="button" class="btn btn-danger m-ok">${confirmText}</button>
        </div></div>`;
      document.body.appendChild(b);
      const done=v=>{ b.remove(); resolve(v); };
      b.addEventListener('click',e=>{ if(e.target===b) done(false); });
      b.querySelector('.m-cancel').addEventListener('click',()=>done(false));
      b.querySelector('.m-ok').addEventListener('click',()=>done(true));
      document.addEventListener('keydown',function esc(e){ if(e.key==='Escape'){document.removeEventListener('keydown',esc); done(false);} });
    });
  }

  const applyVisual=(box,input,i)=>{
    if(man[i]){ input.checked=false; input.disabled=true; box.classList.remove('livre','ocupado'); box.classList.add('manutencao'); }
    else { input.disabled=false; box.classList.remove('manutencao'); box.classList.toggle('ocupado',!!occ[i]); box.classList.toggle('livre',!occ[i]); }
  };

  const LINHAS = Math.ceil(TOTAL / COLUNAS);
  for (let r=0;r<LINHAS;r++){
    const tr=document.createElement('tr');
    for (let c=0;c<COLUNAS;c++){
      const n=r*COLUNAS+c+1;
      const td=document.createElement('td');
      if(n<=TOTAL){
        const cell=document.createElement('div'); cell.className='cell';
        const label=document.createElement('label'); label.className='notebook livre'; label.dataset.item=String(n); label.setAttribute('aria-label',`Câmera ${n}`);

        const input=document.createElement('input'); input.type='checkbox'; input.id=`cam-${n}`; input.className='estado sr-only';
        input.setAttribute('aria-label',`Câmera ${n} — marcar como ocupado`); input.checked=!!occ[n-1];
        input.addEventListener('change',()=>{
          if(man[n-1]){ input.checked=false; return; }
          occ[n-1]=input.checked; save(KEY_OCC,occ); applyVisual(label,input,n-1); updateResumo();
        });

        const img=document.createElement('img'); img.src=ICON_SRC; img.alt=`Ícone da câmera ${n}`; img.title=`Câmera ${n}`; img.className='notebook-icon';
        const caption=document.createElement('span'); caption.className='notebook-id'; caption.textContent=`Câmera ${n}`;

        const btnMaint=document.createElement('button'); btnMaint.type='button'; btnMaint.className='btn-maint'; btnMaint.title='Marcar como em manutenção';
        const imgMaint=document.createElement('img'); imgMaint.src=MAINT_SRC; imgMaint.alt='Manutenção';
        btnMaint.appendChild(imgMaint);
        btnMaint.addEventListener('click', async (ev)=>{
          ev.stopPropagation();
          const emManut=!!man[n-1];
          const ok=await confirmModal({
            title: emManut?'Remover manutenção?':'Colocar em manutenção?',
            text:  emManut?`A Câmera ${n} voltará a ficar disponível.`:`A Câmera ${n} ficará indisponível para empréstimo.`,
            confirmText: emManut?'Remover':'Confirmar'
          });
          if(!ok) return;
          if(emManut){ man[n-1]=false; } else { man[n-1]=true; occ[n-1]=false; }
          save(KEY_MAN,man); save(KEY_OCC,occ);
          applyVisual(label,input,n-1); updateResumo();
        });

        label.appendChild(input); label.appendChild(img); label.appendChild(caption);
        cell.appendChild(label); cell.appendChild(btnMaint); td.appendChild(cell);
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  document.querySelectorAll('.notebook').forEach(box=>{
    const n=parseInt(box.dataset.item,10)-1;
    const input=box.querySelector('input.estado');
    applyVisual(box,input,n);
  });

  // Export
  function downloadCSV(filename, rows){
    const header=['recurso','numero','rotulo','status'];
    const esc=s=>`"${String(s).replace(/"/g,'""')}"`;
    const lines=[header.join(';'), ...rows.map(r=>r.map(esc).join(';'))];
    const blob=new Blob(["\ufeff"+lines.join('\n')],{type:'text/csv;charset=utf-8;'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
  }
  function exportar(){
    const now=new Date(); const pad=n=>String(n).padStart(2,'0');
    const fname=`emprestimos_cameras_${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}.csv`;
    const rows=[];
    for(let i=1;i<=TOTAL;i++){
      const status = man[i-1] ? 'Manutenção' : (occ[i-1] ? 'Ocupado' : 'Livre');
      rows.push(['camera', i, `Câmera ${i}`, status]);
    }
    downloadCSV(fname, rows);
  }
  document.getElementById('export-cam')?.addEventListener('click', exportar);

  // Import
  function parseCSV(text){
    const lines=text.replace(/\r/g,'').split('\n').map(l=>l.trim()).filter(Boolean);
    if(!lines.length) return [];
    const delim=lines[0].includes(';')?';':',';
    const rows=[]; for(let i=0;i<lines.length;i++){
      const cols=lines[i].split(delim).map(s=>s.replace(/^"|"$/g,'').trim());
      if(i===0 && /recurso/i.test(cols[0]) && /numero/i.test(cols[1])) continue;
      rows.push(cols);
    } return rows;
  }
  const normalizeStatus=s=>{
    s=(s||'').toLowerCase();
    if(/manut|indispon/i.test(s)) return 'manut';
    if(/ocup/.test(s)||s==='1'||s==='true') return 'ocup';
    if(/livre/.test(s)||s==='0'||s==='false') return 'livre';
    return null;
  };
  function refreshDOM(){
    document.querySelectorAll('.notebook').forEach(box=>{
      const n=parseInt(box.dataset.item,10)-1;
      const input=box.querySelector('input.estado');
      applyVisual(box,input,n);
    }); updateResumo();
  }
  function applyRows(rows){
    let updated=false;
    for(const cols of rows){
      if(cols.length>=4){
        const tipo=(cols[0]||'').toLowerCase(); if(!/cam/.test(tipo)) continue;
        const num=parseInt(cols[1],10); const st=normalizeStatus(cols[3]);
        if(!Number.isInteger(num)||num<1||num>Total||st===null) continue;
        if(st==='manut'){ man[num-1]=true; occ[num-1]=false; }
        else { man[num-1]=false; occ[num-1]=(st==='ocup'); }
        updated=true;
      } else if (cols.length>=2){
        const num=parseInt(cols[0].match(/\d+/)?.[0] ?? cols[0],10);
        const st=normalizeStatus(cols[cols.length-1]);
        if(!Number.isInteger(num)||num<1||num>Total||st===null) continue;
        if(st==='manut'){ man[num-1]=true; occ[num-1]=false; }
        else { man[num-1]=false; occ[num-1]=(st==='ocup'); }
        updated=true;
      }
    }
    if(updated){ save(KEY_OCC,occ); save(KEY_MAN,man); refreshDOM(); alert('Importação concluída (Câmeras).'); }
    else{ alert('Nenhuma linha válida para Câmeras foi encontrada.'); }
  }
  function handleImport(file){
    const reader=new FileReader();
    reader.onload=()=>{ try{ applyRows(parseCSV(reader.result||'')); } catch(e){ console.error(e); alert('Falha ao importar o CSV.'); } };
    reader.readAsText(file,'utf-8');
  }
  if (BTN_IMPORT && FILE_IMPORT){
    BTN_IMPORT.addEventListener('click', ()=>FILE_IMPORT.click());
    FILE_IMPORT.addEventListener('change', (e)=>{ const f=e.target.files?.[0]; if(f) handleImport(f); e.target.value=''; });
  }
})();
