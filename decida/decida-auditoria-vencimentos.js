'use strict';
// Etapa 168: auditoria factual, sem modificar a rubrica.
function auditarVencimentosConcorrentesEtapa168(escolhas=[], historico=[]){
 const registros=Array.isArray(escolhas)?escolhas:[];
 const movimentos=[]; const lacunas=[];
 for(const e of registros){
  const d=e?.detalhes||{};
  if(!Array.isArray(d.operacoesCredito))continue;
  for(const op of d.operacoesCredito){
   if(!op || typeof op!=='object'){lacunas.push({escolha:e?.id??null,motivo:'operacao_invalida'});continue;}
   if(!Array.isArray(op.vencimentos)||!op.vencimentos.length){lacunas.push({escolha:e?.id??null,motivo:'vencimentos_ausentes'});continue;}
   for(const v of op.vencimentos){
    if(!v || typeof v!=='object' || !Number.isInteger(v.mes)||v.mes<1||!Number.isFinite(v.valor)||v.valor<0){lacunas.push({escolha:e?.id??null,motivo:'vencimento_invalido'});continue;}
    movimentos.push({mes:v.mes,valor:v.valor,escolha:e?.id??null,origem:op.origem});
   }
  }
 }
 const meses=[...new Set(movimentos.map(v=>v.mes))].sort((a,b)=>a-b);
 const quadro=meses.map(mes=>{
  const devidos=movimentos.filter(x=>x.mes===mes), total=Math.round(devidos.reduce((s,x)=>s+x.valor,0)*100)/100;
  // Só é possível comprovar margem de um mês se o próprio histórico a documenta.
  const h=(Array.isArray(historico)?historico:[]).find(x=>x && typeof x==='object' && x.mes===mes);
  const margem=h&&typeof h.margemMes==='number'&&Number.isFinite(h.margemMes)?h.margemMes:null;
  return {mes,total,quantidade:devidos.length,margemDocumentada:margem,
   status:margem===null?'margem_futura_nao_documentada':total<=margem?'cabe_na_margem':'excede_margem',
   origemEscolhas:devidos.map(x=>x.escolha)};
 });
 return {quadro,lacunas,maiorCompromisso:quadro.length?Math.max(...quadro.map(x=>x.total)):0,
  mesesExcedidos:quadro.filter(x=>x.status==='excede_margem').map(x=>x.mes),
  mesesIndeterminados:quadro.filter(x=>x.status==='margem_futura_nao_documentada').map(x=>x.mes),
  observacao:'Inclui apenas obrigações rastreadas por operações de crédito. Outros compromissos podem existir; meses futuros sem margem registrada são inconclusivos. Sem efeito na pontuação.'};
}
