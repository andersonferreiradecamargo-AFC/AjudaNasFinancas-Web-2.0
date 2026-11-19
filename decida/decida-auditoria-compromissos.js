'use strict';
// Etapa 169: reconciliação conservadora; não modifica pontuação.
function auditarCompromissosIntegradosEtapa169(escolhas=[],historico=[],obrigacoes=[]){
 const credito=typeof auditarVencimentosConcorrentesEtapa168==='function'?auditarVencimentosConcorrentesEtapa168(escolhas,historico):null;
 const lacunas=credito?[...credito.lacunas]:[{motivo:'auditoria_credito_indisponivel'}];
 const registros=[];
 for(const e of (Array.isArray(escolhas)?escolhas:[]))for(const op of (Array.isArray(e?.detalhes?.operacoesCredito)?e.detalhes.operacoesCredito:[]))for(const v of (Array.isArray(op.vencimentos)?op.vencimentos:[]))if(Number.isInteger(v.mes)&&v.mes>0&&Number.isFinite(v.valor)&&v.valor>=0)registros.push({mes:v.mes,valor:v.valor,origemEscolhaId:op.origemEscolhaId||e.id,tipo:'credito'});
 // O estado final contém somente obrigações ainda pendentes: não reconstituir meses já quitados.
 for(const o of (Array.isArray(obrigacoes)?obrigacoes:[])){
  if(!Array.isArray(o?.pendentes)||!Number.isFinite(o.valor)||o.valor<0){lacunas.push({motivo:'obrigacao_invalida',descricao:o?.descricao});continue;}
  for(const mes of o.pendentes){if(!Number.isInteger(mes)||mes<1){lacunas.push({motivo:'mes_obrigacao_invalido'});continue;}
   const id=o.origemEscolhaId||null;
   const igual=registros.find(r=>r.mes===mes&&r.tipo==='credito'&&id&&r.origemEscolhaId===id&&Math.abs(r.valor-o.valor)<0.011&&!r.conciliado);
   if(igual){igual.conciliado=true;continue;}
   // Sem vínculo confiável, não presumir que é a mesma obrigação.
   registros.push({mes,valor:o.valor,origemEscolhaId:id,tipo:'outra_obrigacao'});
  }
 }
 const meses=[...new Set(registros.map(r=>r.mes))].sort((a,b)=>a-b);
 const quadro=meses.map(mes=>{
  const itens=registros.filter(r=>r.mes===mes);
  const creditoTotal=itens.filter(r=>r.tipo==='credito').reduce((s,r)=>s+r.valor,0);
  const outrosTotal=itens.filter(r=>r.tipo==='outra_obrigacao').reduce((s,r)=>s+r.valor,0);
  const h=(Array.isArray(historico)?historico:[]).find(x=>x.mes===mes);
  const margem=h&&Number.isFinite(h.margemMes)?h.margemMes:null;
  const total=Math.round((creditoTotal+outrosTotal)*100)/100;
  return {mes,credito:Math.round(creditoTotal*100)/100,outrasObrigacoes:Math.round(outrosTotal*100)/100,total,margemDocumentada:margem,status:margem===null?'indeterminado_sem_margem':total>margem+0.005?'excede_margem':'cabe_na_margem',quantidade:itens.length};
 });
 return {quadro,lacunas,mesesExcedidos:quadro.filter(x=>x.status==='excede_margem').map(x=>x.mes),mesesIndeterminados:quadro.filter(x=>x.status==='indeterminado_sem_margem').map(x=>x.mes),observacao:'Reconciliação apenas de obrigações documentadas; estado final não representa todas as obrigações já quitadas. Margem futura desconhecida não é presumida. Sem efeito na pontuação.'};
}
