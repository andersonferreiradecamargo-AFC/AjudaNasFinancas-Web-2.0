(()=>{'use strict';
const area=document.getElementById('ef-i-questoes');if(!area)return;
const perguntas=[
 {texto:'Qual é a maior despesa da Júlia?',opcoes:['Alimentação','Moradia','Lazer'],certa:1,acerto:'Isso! A moradia representa R$ 900,00, a maior despesa do gráfico.',dica:'Observe qual barra representa o maior valor.'},
 {texto:'O dinheiro que Júlia recebe é suficiente para pagar todas as despesas?',opcoes:['Sim, ainda sobra dinheiro.','Não, faltam R$ 150,00.','Sim, os valores são iguais.'],certa:1,acerto:'Correto! As despesas ultrapassam a renda em R$ 150,00.',dica:'Compare a renda de R$ 2.500,00 com as despesas de R$ 2.650,00.'},
 {texto:'O que Júlia poderia fazer para começar a equilibrar seu orçamento?',opcoes:['Deixar de pagar a moradia.','Analisar os gastos flexíveis e procurar ajustes possíveis.','Ignorar o saldo negativo.'],certa:1,acerto:'Muito bem! Ela pode avaliar suas prioridades e procurar alternativas sem deixar de atender às necessidades essenciais.',dica:'Pense em uma solução que respeite as necessidades essenciais e ajude a reduzir as despesas.'}
];
const respostas=new Map();const conclusao=document.getElementById('ef-i-conclusao');
function atualizarConclusao(){if(respostas.size!==perguntas.length){conclusao.hidden=true;return;}const acertos=[...respostas].filter(([i,v])=>perguntas[i].certa===v).length;conclusao.textContent=acertos===3?'Você interpretou os três pontos! Lembre-se: organizar um orçamento envolve compreender necessidades e possibilidades.':'Você respondeu às três perguntas. Pode observar novamente o gráfico e experimentar outras respostas para aprender mais.';conclusao.hidden=false;}
function montar(){area.replaceChildren();respostas.clear();conclusao.hidden=true;perguntas.forEach((p,i)=>{
const card=document.createElement('details');card.className='ef-i-questao';card.open=i===0;
const titulo=document.createElement('summary');titulo.className='ef-i-titulo';titulo.textContent=(i+1)+'. '+p.texto;
const corpo=document.createElement('div');corpo.className='ef-i-corpo';
const field=document.createElement('fieldset');field.setAttribute('aria-label',p.texto);
const fb=document.createElement('div');fb.className='ef-i-feedback';fb.hidden=true;fb.setAttribute('aria-live','polite');
p.opcoes.forEach((op,j)=>{const label=document.createElement('label');label.className='ef-i-opcao';const radio=document.createElement('input');radio.type='radio';radio.name='ef-i-pergunta-'+i;radio.value=String(j);const span=document.createElement('span');span.textContent=op;label.append(radio,span);field.append(label);radio.addEventListener('change',()=>{fb.hidden=true;respostas.delete(i);atualizarConclusao()})});
const btn=document.createElement('button');btn.type='button';btn.className='ef-i-verificar';btn.textContent='VERIFICAR RESPOSTA';btn.addEventListener('click',()=>{const selecionado=field.querySelector('input:checked');if(!selecionado){fb.textContent='Escolha uma alternativa antes de verificar.';fb.classList.remove('correto');fb.hidden=false;return;}const j=Number(selecionado.value),certo=j===p.certa;respostas.set(i,j);fb.textContent=(certo?'✔ ':'↗ ')+(certo?p.acerto:p.dica);fb.classList.toggle('correto',certo);fb.hidden=false;atualizarConclusao()});
corpo.append(field,btn,fb);card.append(titulo,corpo);area.append(card)})}
document.getElementById('ef-i-reiniciar')?.addEventListener('click',montar);montar();
})();
