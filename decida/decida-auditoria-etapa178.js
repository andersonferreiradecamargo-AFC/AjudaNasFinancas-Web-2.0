"use strict";
// Conciliação documental das renegociações de contas essenciais e baixas internas.
function auditarAcordosEtapa178(historico=[],escolhas=[]){
 const alertas=[],acordos=[],porId=new Map((escolhas||[]).map(e=>[e.id,e]));
 for(const h of historico||[])for(const ev of h.eventosFinanceirosMes||[]){
  if(ev.tipo!=="renegociacao_contas_essenciais")continue;
  const escolha=porId.get(ev.origemEscolhaId),id=ev.origemEscolhaId;
  if(!id||!escolha||escolha.mes!==h.mes){alertas.push({mes:h.mes,tipo:"escolha_ausente"});continue;}
  const total=Number(ev.novoTotal),origens=ev.origensRenegociadas||[];
  if(!(total>0)||!origens.length||Math.abs(origens.reduce((a,o)=>a+Number(o.valor||0),0)-total)>.011){alertas.push({mes:h.mes,tipo:"origens_inconsistentes"});continue;}
  const parcelas=(escolha.detalhes?.operacoesCredito||[]).flatMap(op=>op.vencimentos||[]);
  if(parcelas.length!==3||parcelas.some((v,i)=>v.mes!==h.mes+i+1)||Math.abs(parcelas.reduce((a,v)=>a+v.valor,0)-total)>.011){alertas.push({mes:h.mes,tipo:"parcelas_inconsistentes"});continue;}
  const baixas=(historico||[]).flatMap(x=>(x.parcelasBaixadasMes||[]).filter(b=>b.origemEscolhaId===id).map(b=>({...b,mes:x.mes})));
  for(const b of baixas){const esperado=parcelas.find(v=>v.mes===b.mes);if(!esperado||Math.abs(b.valor-esperado.valor)>.011)alertas.push({mes:b.mes,tipo:"baixa_inconsistente",acordo:id});}
  const vencidas=parcelas.filter(v=>v.mes<=Math.max(...historico.map(x=>x.mes)));
  for(const v of vencidas)if(!baixas.some(b=>b.mes===v.mes))alertas.push({mes:v.mes,tipo:"baixa_ausente",acordo:id});
  acordos.push({id,mes:h.mes,total,parcelas:parcelas.length,baixas:baixas.length,estado:"registro_interno_sem_comprovacao_externa"});
 }
 return {acordos,alertas,semAlertas:alertas.length===0};
}
if(typeof module!=="undefined")module.exports={auditarAcordosEtapa178};
