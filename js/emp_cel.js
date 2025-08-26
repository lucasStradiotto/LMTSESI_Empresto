(function(){
  const tbody = document.querySelector('#tabela-itens tbody');
  const COLS = 7;

  async function load(){
    try{
      const data = await API.getItems('celulares');
      render(data.data || []);
    }catch(e){ console.error(e); alert('Falha ao carregar celulares.'); }
  }

  function render(items){
    tbody.innerHTML='';
    const total=items.length, rows=Math.ceil(total/COLS);
    for (let i=0;i<rows;i++){
      const tr=document.createElement('tr');
      for (let j=0;j<COLS;j++){
        const idx=i*COLS+j; const td=document.createElement('td');
        if (idx<total){
          const it=items[idx];
          const label=document.createElement('label');
          label.className='notebook';
          label.classList.add(it.manutencao? 'manutencao' : (it.status==='ocupado'?'ocupado':'livre'));
          label.setAttribute('aria-label',`Celular ${it.codigo}`);

          const input=document.createElement('input'); input.type='checkbox'; input.className='estado'; input.checked=(it.status==='ocupado'); input.disabled=true;
          const img=document.createElement('img'); img.className='nb-icon'; img.src='../assets/icons/celular.png'; img.alt='';
          const span=document.createElement('span'); span.textContent=`Celular ${it.codigo}`;

          const manut=document.createElement('button'); manut.className='btn-manut'; manut.type='button'; manut.title= it.manutencao?'Retirar de manutenção':'Colocar em manutenção'; manut.textContent='🛠';
          manut.addEventListener('click', async (e)=>{
            e.stopPropagation();
            const on = it.manutencao?0:1;
            const ok = await confirmModal({ title: on?'Confirmar manutenção':'Retirar de manutenção', text: on?`Colocar Celular ${it.codigo} em manutenção?`:`Retirar Celular ${it.codigo} da manutenção?` });
            if (!ok) return;
            try{ await API.toggleManut('celulares', it.codigo, on); await load(); }catch(err){ console.error(err); alert('Não foi possível alterar manutenção.'); }
          });

          label.appendChild(input); label.appendChild(img); label.appendChild(span); label.appendChild(manut); td.appendChild(label);
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  }

  load();
})();
