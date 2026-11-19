(()=>{'use strict';
const modulo=document.getElementById('educacao-financeira');if(!modulo)return;
// Progresso exclusivo do módulo 4. A trilha com IDs sem prefixo pertence ao módulo 1.
const chave='ajuda-financas-educacao-financeira-progresso-v2';
const etapas=['aprenda','faca','interprete','decida'];
let concluidas=new Set();
try{const dados=JSON.parse(localStorage.getItem(chave)||'[]');if(Array.isArray(dados))concluidas=new Set(dados.filter(x=>etapas.includes(x)));}catch(e){}
function salvar(){try{localStorage.setItem(chave,JSON.stringify([...concluidas]));}catch(e){}}
function ativo(){return modulo.classList.contains('modulo-aberto')||modulo.classList.contains('ativo')||modulo.querySelector('.modulo-acordeao-titulo')?.getAttribute('aria-expanded')==='true'||Array.from(modulo.querySelectorAll('.etapa.acordeao')).some(el=>el.classList.contains('aberto')||el.classList.contains('ativo'));}
function atualizar(){if(!ativo())return;
const pct=concluidas.size*25,terminou=pct===100;
const ct=document.getElementById('progressoCompactoTexto'),cf=document.getElementById('progressoCompactoPreenchimento'),cr=document.getElementById('progressoCompactoRotulo'),cm=document.getElementById('progressoCompactoMensagem'),compacto=document.getElementById('progressoCompacto');
if(ct)ct.textContent=pct+'%';if(cf)cf.style.width=pct+'%';if(cr)cr.textContent=terminou?'🏆 Educação Financeira concluída!':'Progresso — Educação Financeira';if(cm){cm.hidden=!terminou;if(terminou)cm.textContent='Você concluiu as quatro etapas.';}if(compacto)compacto.classList.toggle('concluido',terminou);
// Não modificar progressoTexto, trilhaPreenchimento, trilha-passo ou mensagemConclusao: pertencem ao Módulo 1.
}
function marcar(etapa,concluida){if(!etapas.includes(etapa))return;const anterior=concluidas.has(etapa);if(concluida)concluidas.add(etapa);else concluidas.delete(etapa);if(anterior!==concluidas.has(etapa))salvar();atualizar();}
document.addEventListener('ef:progresso',e=>{const d=e.detail||{};marcar(d.etapa,!!d.concluida)});
// Somente interação com um tema dentro do APRENDA; abrir/fechar a etapa não conta.
modulo.querySelectorAll('#efEtapaAPRENDA .subtopico-titulo').forEach(b=>b.addEventListener('click',()=>marcar('aprenda',true)));
modulo.querySelectorAll('.acordeao-titulo,.modulo-acordeao-titulo').forEach(b=>b.addEventListener('click',()=>setTimeout(atualizar,60)));
setTimeout(atualizar,100);
})();
