/* Simulações do APRENDA — sem dependências externas. */
(function(){'use strict';
const modulo=document.getElementById('educacao-financeira');if(!modulo)return;
const moeda=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
function compras(){const total=[...modulo.querySelectorAll('.ef-compra:checked')].reduce((n,e)=>n+Number(e.dataset.valor||0),0);const out=modulo.querySelector('#ef-total');if(out)out.textContent=moeda.format(total);}
modulo.querySelectorAll('.ef-compra').forEach(el=>el.addEventListener('change',compras));compras();
function objetivo(){const n=id=>Math.max(0,Number(modulo.querySelector(id)?.value)||0);const falta=Math.max(0,n('#ef-objetivo')-n('#ef-guardado'));const aporte=n('#ef-mensal');const meses=falta===0?0:aporte>0?Math.ceil(falta/aporte):null;const prazo=modulo.querySelector('#ef-prazo');const restante=modulo.querySelector('#ef-falta');if(prazo)prazo.textContent=meses===null?'Prazo estimado: ainda não definido':meses===0?'Objetivo alcançado!':`Prazo estimado: ${meses} ${meses===1?'mês':'meses'}`;if(restante)restante.textContent=`Ainda faltam ${moeda.format(falta)}.`;}
['#ef-objetivo','#ef-guardado','#ef-mensal'].forEach(id=>modulo.querySelector(id)?.addEventListener('input',objetivo));objetivo();
})();
