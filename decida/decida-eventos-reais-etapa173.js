'use strict';
// Constrói eventos apenas quando há escolha real identificável no mês.
// Alterações sem escolha explícita permanecem lacunas, nunca são justificadas por inferência.
function eventosReaisEtapa173(anterior,atual,escolhas=[]){
 const m=atual?.mes,avisos=[],eventos=[];
 const mapa=h=>{const out=new Map();for(const o of h?.obrigacoesPendentesFechamento||[]){if(!o.origemEscolhaId||!Number.isFinite(o.valor))continue;for(const v of o.pendentes||[]){if(v>m)out.set(`${o.origemEscolhaId}|${v}`,(out.get(`${o.origemEscolhaId}|${v}`)||0)+o.valor);}}return out;};
 const antes=mapa(anterior),depois=mapa(atual),porOrigem=new Map();
 const escolhasValidas=new Set(escolhas.filter(e=>e?.mes===m&&typeof e.id==='string').map(e=>e.id));
 for(const chave of new Set([...antes.keys(),...depois.keys()])){
  const [origem,v]=chave.split('|'),a=antes.get(chave)||0,b=depois.get(chave)||0;
  if(Math.abs(a-b)<.011)continue;
  if(!escolhasValidas.has(origem)){avisos.push({tipo:'alteracao_sem_escolha_documentada',origemEscolhaId:origem,vencimento:+v,antes:a,depois:b});continue;}
  const tipo=a===0?'contratacao':b===0?'quitacao_antecipada':'renegociacao';
  // Uma remoção não comprova quitação: exige evento explícito de pagamento.
  if(tipo==='quitacao_antecipada'){avisos.push({tipo:'quitacao_sem_desembolso_comprovado',origemEscolhaId:origem,vencimento:+v});continue;}
  const k=`${origem}|${tipo}`;if(!porOrigem.has(k))porOrigem.set(k,[]);
  porOrigem.get(k).push({vencimento:+v,valorAnterior:a,valorNovo:b});
 }
 for(const [k,alteracoes] of porOrigem){const [origem,tipo]=k.split('|');eventos.push({id:`m${m}-${origem}-${tipo}`,tipo,mes:m,origemEscolhaId:origem,alteracoes});}
 return {eventos,avisos,observacao:'Registros factuais de escolhas; não comprova pagamentos e não altera pontos.'};
}
if(typeof module!=='undefined')module.exports={eventosReaisEtapa173};
