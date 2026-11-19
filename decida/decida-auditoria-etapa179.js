"use strict";
// Confere desembolsos internos e alocacoes por origem; nao afirma pagamento externo.
function auditarQuitacoesEtapa179(historico=[],escolhas=[]){
 const alertas=[],pagamentos=[],ids=new Set(),escolhasId=new Map(escolhas.map(e=>[e.id,e]));
 const cent=n=>Math.round(Number(n)*100)/100;
 for(const h of historico)for(const e of h.eventosFinanceirosMes||[]){
  if(e.tipo!=='pagamento_parcial_ou_quitacao')continue;
  const id=e.id,valor=cent(e.valor),antes=cent(e.saldoAntes),depois=cent(e.saldoDepois);
  if(!id||ids.has(id))alertas.push({mes:h.mes,tipo:'evento_duplicado_ou_sem_id',id});
  ids.add(id);
  const escolha=escolhasId.get(e.origemEscolhaId);
  if(!escolha||escolha.mes!==h.mes)alertas.push({mes:h.mes,tipo:'escolha_incompativel',id});
  if(!Number.isFinite(valor)||valor<=0||!Number.isFinite(antes)||antes<valor-.011||Math.abs(cent(antes-valor)-depois)>.011)alertas.push({mes:h.mes,tipo:'saldo_inconsistente',id});
  const aloc=e.alocacoesOrigens||[];
  if(!aloc.length||aloc.some(a=>!a.origemDividaId||!(Number(a.valor)>0))||Math.abs(cent(aloc.reduce((s,a)=>s+Number(a.valor||0),0)+Number(e.naoAlocado||0))-valor)>.011||Number(e.naoAlocado||0)>.011)alertas.push({mes:h.mes,tipo:'alocacao_inconsistente',id});
  const desembolsos=(h.desembolsosDocumentados||[]).filter(d=>d.eventoId===id);
  if(desembolsos.length!==1||Math.abs(cent(desembolsos[0]?.valor)-valor)>.011||desembolsos[0]?.origemEscolhaId!==e.origemEscolhaId||desembolsos[0]?.confirmacaoExterna!==false)alertas.push({mes:h.mes,tipo:'desembolso_inconsistente',id});
  if((depois<=.001)!==(e.tipoLiquidacao==='quitacao_integral'))alertas.push({mes:h.mes,tipo:'classificacao_inconsistente',id});
  pagamentos.push({id,mes:h.mes,valor,tipo:e.tipoLiquidacao,origens:aloc.length});
 }
 return {pagamentos,alertas,semAlertas:alertas.length===0,escopo:'registros_internos_sem_comprovacao_externa'};
}
if(typeof module!=='undefined')module.exports={auditarQuitacoesEtapa179};
