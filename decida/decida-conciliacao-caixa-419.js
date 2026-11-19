'use strict';
// Etapa 419: rastreio da capacidade de caixa dos vencimentos. Nao altera a pontuacao.
// O financiamento e fungivel: coexistencia nao prova origem individual de pagamento.
function conciliarCaixaAcordos419(historico=[],escolhas=[]){
 const meses=[];const avisos=[];
 for(const h of historico){
  const baixas=(h.parcelasBaixadasMes||[]).filter(p=>/acordo|renegocia/i.test(p.descricao||''));
  const valorBaixado=Math.round(baixas.reduce((s,p)=>s+(Number(p.valor)||0),0)*100)/100;
  const solucoes=(escolhas||[]).filter(e=>e&&e.mes===h.mes&&e.tipo==='resolucao-deficit');
  const financiamentos=solucoes.filter(e=>['adiar','renegociar'].includes(e.detalhes?.alternativaEscolhida||e.detalhes?.alternativa));
  const novoCredito=Math.round(financiamentos.reduce((s,e)=>s+(Number(e.detalhes?.valorOriginal)||0),0)*100)/100;
  const renda=Number(h.rendaMes),despesas=Number(h.despesasMes),parcelas=Number(h.parcelasMes);
  const margemAntesParcelas=Number.isFinite(renda)&&Number.isFinite(despesas)?Math.round((renda-despesas)*100)/100:null;
  const lacunaOrcamentaria=Number.isFinite(parcelas)&&margemAntesParcelas!==null?Math.round(Math.max(0,parcelas-margemAntesParcelas)*100)/100:null;
  const classificacao=valorBaixado===0?'sem_baixa_de_acordo':novoCredito>0?'baixa_com_financiamento_no_mes':'baixa_sem_financiamento_de_deficit_registrado';
  // Uma baixa contabil registrada nao e comprovante externo, mesmo sem novo credito.
  if(valorBaixado>0&&novoCredito>0)avisos.push({mes:h.mes,tipo:'baixa_e_financiamento_concomitantes',valorBaixado,novoCredito});
  meses.push({mes:h.mes,valorBaixado,novoCredito,parcelasTotaisMes:Number.isFinite(parcelas)?parcelas:null,margemAntesParcelas,lacunaOrcamentaria,classificacao,pagamentoExternoComprovado:false});
 }
 return {meses,avisos,mesesAnalisados:meses.length,observacao:'A baixa e automatica; o financiamento simultaneo nao comprova qual recurso pagou cada parcela. O saldo livre acumulado pode alterar a capacidade de caixa. Nao atribuir inadimplencia nem recuperacao comprovada a partir desta conciliacao isolada.'};
}
if(typeof module!=='undefined')module.exports={conciliarCaixaAcordos419};
