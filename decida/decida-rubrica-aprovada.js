'use strict';
// Avaliação paralela: a rubrica aprovada NÃO substitui o placar legado.
// Valores null representam evidência insuficiente, jamais zero.
const RUBRICA_APROVADA_V120 = Object.freeze({
 planejamento:{orcamento:80,compromissos:70,futuro:60,objetivo:40},
 decisoes:{viabilidade:70,dividas:80,consequencias:60,oportunidades:40},
 recursos:{essenciais:80,custos:70,credito:60,equilibrio:40},
 adaptacao:{imprevistos:90,recuperacao:80,reorganizacao:50,futuro:30}
});
const COMPONENTES_APROVADOS_V120=Object.freeze({
 'planejamento.futuro':{equilibrio_observado:27,evolucao_observada:27,projecao:6},
 'planejamento.objetivo':{gestao_reserva:15,planejamento_meta:10,realizacao_meta:15},
 'decisoes.dividas':{capacidade:30,juros_custos:20,parcelas:15,renegociacao:15},
 'decisoes.consequencias':{impactos_futuros:25,compromissos:20,correcoes:15},
 'decisoes.oportunidades':{avaliacao:15,solucao:15,consequencias:10},
 'recursos.essenciais':{priorizacao:35,regularidade:25,consequencias:20},
 'recursos.custos':{necessidade:30,margem:20,consistencia:20},
 'recursos.credito':{finalidade:25,custo:20,sustentabilidade:15},
 'recursos.equilibrio':{essenciais_adicionais:15,margem_sustentavel:15,consistencia:10}
});
// Etapa 55: fatos observáveis para a futura pontuação; não são pontos.
// Dados ausentes, não finitos ou meses duplicados não geram indicadores fictícios.
function evidenciasObservadasRubricaV120(historico=[],escolhas=[],movimentosReserva=[]){
 const h=Array.isArray(historico)?historico:[];
 const e=Array.isArray(escolhas)?escolhas:[];
 const r=Array.isArray(movimentosReserva)?movimentosReserva:[];
 const erros=[];
 const numeros=['meta','metaValor','reserva','livre','dividas','margemMes','parcelaProxima','rendaMes','despesasMes'];
 const meses=new Set();
 for(const item of h){
  const mes=item?.mes;
  if(!Number.isInteger(mes)||mes<1||mes>6)erros.push('mes_invalido');
  if(meses.has(mes))erros.push('mes_duplicado');
  meses.add(mes);
  for(const campo of numeros)if(typeof item?.[campo]!=='number'||!Number.isFinite(item[campo]))erros.push(`dado_invalido:${mes}:${campo}`);
 }
 const completa=h.length===6&&[1,2,3,4,5,6].every(m=>meses.has(m));
 if(h.some(x=>typeof x?.mes!=='number'))erros.push('mes_invalido');
 if(h.some(x=>['meta','metaValor','reserva','dividas','parcelaProxima','rendaMes','despesasMes'].some(k=>typeof x?.[k]==='number'&&x[k]<0)))erros.push('saldo_ou_valor_negativo');
 const valido=completa&&erros.length===0;
 const ordenar=[...h].sort((a,b)=>a.mes-b.mes);
 const mesResumo=valido?ordenar.map(x=>({mes:x.mes,meta:x.meta,metaValor:x.metaValor,reserva:x.reserva,livre:x.livre,dividas:x.dividas,margem:x.margemMes,parcelaProxima:x.parcelaProxima,deficit:x.deficit===true,essenciaisNaoPagas:x.essenciaisNaoPagas??null})):[];
 const decisoesOrcamento=e.filter(x=>x?.tipo==='orcamento');
 const mesesOrcamento=new Set(decisoesOrcamento.map(x=>x.mes));
 const orcamentoAuditavel=valido&&decisoesOrcamento.length===6&&mesesOrcamento.size===6&&[1,2,3,4,5,6].every(m=>mesesOrcamento.has(m));
 if(valido&&!orcamentoAuditavel)erros.push('orcamento_incompleto_ou_duplicado');
 if(decisoesOrcamento.some(x=>typeof x?.mes!=='number'||!Number.isInteger(x.mes)||x.mes<1||x.mes>6))erros.push('mes_orcamento_invalido');
 const aportes=orcamentoAuditavel?decisoesOrcamento.map(x=>({mes:x.mes,meta:x.detalhes?.aporteMeta??x.detalhes?.objetivo,reserva:x.detalhes?.aporteReserva??x.detalhes?.reserva})):[];
 if(orcamentoAuditavel&&aportes.some(x=>typeof x.meta!=='number'||!Number.isFinite(x.meta)||x.meta<0||typeof x.reserva!=='number'||!Number.isFinite(x.reserva)||x.reserva<0))erros.push('aportes_invalidos');
 const movimentoInvalido=r.some(x=>typeof x?.valor!=='number'||!Number.isFinite(x.valor)||x.valor<0||!Number.isInteger(x?.mes)||x.mes<1||x.mes>6);
 if(movimentoInvalido)erros.push('movimento_reserva_invalido');
 const movimentosValidos=valido&&!movimentoInvalido;
 const auditoriaValida=valido&&erros.length===0;
 return {partidaCompleta:completa,evidenciasValidas:auditoriaValida,erros:[...new Set(erros)],
  meses:mesResumo,
  equilibrioObservado:valido?{mesesSemDeficit:mesResumo.filter(x=>!x.deficit).length,mesesMargemNaoNegativa:mesResumo.filter(x=>x.margem>=0).length,mesesComDividaEssencial:mesResumo.filter(x=>Number(x.essenciaisNaoPagas)>0).length,dividaFinal:mesResumo[5].dividas}:null,
  objetivo:valido?{valor:mesResumo[5].metaValor,alcancado:mesResumo[5].meta>=mesResumo[5].metaValor,mesAlcance:mesResumo.find(x=>x.meta>=x.metaValor)?.mes??null,metaFinal:mesResumo[5].meta,aportesMensais:orcamentoAuditavel&&!erros.includes('aportes_invalidos')?aportes:null}:null,
  reserva:movimentosValidos?{saldoFinal:mesResumo[5].reserva,movimentos:r.map(x=>({mes:x.mes,tipo:x.tipo,valor:Number(x.valor),origem:x.origem??null,escolhaId:x.escolhaId??null})),temVinculosIncompletos:r.some(x=>x.escolhaId==null)}:null,
  aviso:'Evidências observadas não são pontos. Meta alcançada não comprova, isoladamente, sustentabilidade ou mérito integral.'};
}

// Etapa 60: pontuação candidata, SOMENTE para o subcritério recursos.equilibrio (40).
// Regra explícita e auditável: 15 essenciais vs gastos adicionais, 15 margem,
// 10 consistência. Não avalia juros, reserva, meta ou reação a imprevistos aqui.
// Não publicar nota global até que os 16 subcritérios sejam validados.
function pontuarEquilibrioCandidatoV120(historico=[],escolhas=[],movimentosReserva=[]){
 const ev=evidenciasObservadasRubricaV120(historico,escolhas,movimentosReserva);
 if(!ev.evidenciasValidas)return {estado:'evidencia_insuficiente',pontos:null,componentes:null,erros:ev.erros};
 const porMes=new Map(escolhas.filter(x=>x.tipo==='orcamento').map(x=>[x.mes,x]));
 const meses=[...historico].sort((a,b)=>a.mes-b.mes);
 const detalhes=[];
 for(const h of meses){
  const d=porMes.get(h.mes)?.detalhes;
  const gasto=d?.gastoAdicional;
  // Dados observados do fechamento: parcelas efetivamente vencidas no mês.
  const escolha=porMes.get(h.mes);
  // A quitação retira as parcelas da lista antes do fechamento; recuperar o
  // valor efetivamente devido no início do orçamento, quando disponível.
  const parcelaInicial=escolha?.contextoAntes?.parcelaAtual;
  const parcelas=parcelaInicial===undefined?h.parcelasMes:parcelaInicial;
  const forma=d?.formaPagamento;
  // Para crédito de consumo, a compra não é saída integral de caixa no mês.
  // A parcela devida precisa ser observável no contexto do orçamento futuro.
  // Operações mistas dependem do desembolso efetivo, não registrado aqui.
  if(gasto>0&&forma==='misto')
   return {estado:'pendente_analise_credito',pontos:null,componentes:null,erros:['gasto_misto_sem_desembolso_auditavel']};
  if(gasto>0&&['credito','parcelado'].includes(forma)){
   const total=forma==='credito'?Math.round(gasto*1.05*100)/100:Math.round(gasto*1.09*100)/100;
   const valores=forma==='credito'?[total]:[Math.floor(total/3*100)/100,Math.floor(total/3*100)/100];
   if(forma==='parcelado')valores.push(Math.round((total-valores[0]-valores[1])*100)/100);
   for(let i=0;i<valores.length;i++){
    const mesVencimento=h.mes+i+1;
    if(mesVencimento>6)return {estado:'pendente_analise_credito',pontos:null,componentes:null,erros:['parcelas_fora_da_janela_observada']};
    const futuroContexto=porMes.get(mesVencimento)?.contextoAntes;
    const trilha=futuroContexto?.obrigacoesAtuais;
    // A trilha nova identifica a origem individual: outra dívida não comprova esta compra.
    if(Array.isArray(trilha)){
     const vinculadas=trilha.filter(x=>x?.origemEscolhaId===escolha?.id);
     const totalVinculado=vinculadas.reduce((a,x)=>a+(typeof x.valor==='number'&&Number.isFinite(x.valor)&&x.valor>=0?x.valor:NaN),0);
     if(!vinculadas.length||!Number.isFinite(totalVinculado)||Math.abs(totalVinculado-valores[i])>.005)
      return {estado:'pendente_analise_credito',pontos:null,componentes:null,erros:['parcela_sem_vinculo_individual']};
    }else{
     // Uma soma agregada não identifica a compra que gerou a parcela.
     // Dados legados permanecem consultáveis, mas NÃO comprovam o vínculo.
     return {estado:'pendente_analise_credito',pontos:null,componentes:null,erros:['historico_sem_vinculo_individual']};
    }
   }
  }
  if(typeof gasto!=='number'||!Number.isFinite(gasto)||gasto<0||
     typeof parcelas!=='number'||!Number.isFinite(parcelas)||parcelas<0||
     typeof h.essenciaisNaoPagas!=='number'||!Number.isFinite(h.essenciaisNaoPagas)||h.essenciaisNaoPagas<0)
   return {estado:'evidencia_insuficiente',pontos:null,componentes:null,erros:['detalhamento_mensal_incompleto']};
  const disponivel=h.rendaMes-h.despesasMes-parcelas;
  const desembolsoAtual=gasto>0&&['credito','parcelado'].includes(forma)?0:gasto;
  const saldo=disponivel-desembolsoAtual;
  const essenciaisEmDia=h.essenciaisNaoPagas===0;
  // Dinheiro livre acumulado ou reserva não são contados como renda recorrente.
  // Não há punição pela simples existência de parcelas ou pelo uso da reserva.
  detalhes.push({mes:h.mes,disponivel:Math.round(disponivel*100)/100,gastoAdicional:gasto,desembolsoAtual,formaPagamento:forma,
   saldoAposGasto:Math.round(saldo*100)/100,essenciaisEmDia});
 }
 const n=detalhes.length;
 // Gastos adicionais só são penalizados quando superam a margem disponível.
 // Contas essenciais não pagas impedem o máximo no componente de priorização.
 const essencial=15*detalhes.filter(x=>x.essenciaisEmDia&&x.desembolsoAtual<=Math.max(0,x.disponivel)+.005).length/n;
 // Preservar margem não exige guardar toda a sobra; exige não consumir mais que ela.
 const margem=15*detalhes.filter(x=>x.saldoAposGasto>=-.005).length/n;
 // Consistência de decisões sustentáveis ao longo dos seis meses.
 const consistencia=10*detalhes.filter(x=>x.essenciaisEmDia&&x.saldoAposGasto>=-.005).length/n;
 const arred=x=>Math.round(x*100)/100;
 const componentes={essenciais_adicionais:arred(essencial),margem_sustentavel:arred(margem),consistencia:arred(consistencia)};
 return {estado:'candidato_em_validacao',pontos:arred(Object.values(componentes).reduce((a,b)=>a+b,0)),componentes,detalhes,
  aviso:'Pontuação experimental de 40 pontos. O componente não julga sozinho necessidade, crédito, reserva ou eventos.'};
}

// Etapa 65: crédito responsável (60) em trilha paralela. Não inventar a
// finalidade de compras nem projetar adimplência após o sexto mês.
function pontuarCreditoCandidatoV120(historico=[],escolhas=[],movimentosReserva=[]){
 const ev=evidenciasObservadasRubricaV120(historico,escolhas,movimentosReserva);
 if(!ev.evidenciasValidas)return {estado:'evidencia_insuficiente',pontos:null,componentes:null,erros:ev.erros};
 const budgets=escolhas.filter(x=>x?.tipo==='orcamento').sort((a,b)=>a.mes-b.mes);
 const meses=[...historico].sort((a,b)=>a.mes-b.mes);
 const registros=[];
 for(let i=0;i<6;i++){
  const b=budgets[i],d=b.detalhes||{},h=meses[i];
  if(b.mes!==h.mes||typeof d.gastoAdicional!=='number'||!Number.isFinite(d.gastoAdicional)||d.gastoAdicional<0)
   return {estado:'evidencia_insuficiente',pontos:null,componentes:null,erros:['gasto_invalido']};
  for(const k of ['creditoConsumo','creditoNecessidade'])if(typeof h[k]!=='number'||!Number.isFinite(h[k])||h[k]<0)
   return {estado:'evidencia_insuficiente',pontos:null,componentes:null,erros:['credito_historico_invalido']};
  const forma=d.formaPagamento;
  if(d.gastoAdicional>0&&['misto','credito','parcelado'].includes(forma))registros.push({mes:h.mes,valor:d.gastoAdicional,forma,escolhaId:b.id,finalidade:d.finalidade??null});
 }
 const operacoesRegistradas=escolhas.flatMap(x=>(Array.isArray(x?.detalhes?.operacoesCredito)?x.detalhes.operacoesCredito:[]).map(o=>({mesDecisao:x.mes,escolhaId:x.id,...o})));
 const saldoCreditoFinal=meses[5].creditoConsumo+meses[5].creditoNecessidade;
 // Os campos creditoConsumo/creditoNecessidade são acumuladores do jogo,
 // não representam automaticamente saldo em aberto ou parcelas quitadas.
 if(!registros.length&&saldoCreditoFinal===0&&!operacoesRegistradas.length){
  return {estado:'candidato_em_validacao',pontos:60,componentes:{finalidade:25,custo:20,sustentabilidade:15},
   operacoes:[],aviso:'Sem crédito contratado: pontuação integral possível sem criar dívida artificial.'};
 }
 // Etapa 66: anexar a trilha factual disponível, sem transformar contrato em
 // pagamento realizado ou presumir finalidade para gastos adicionais.
 const inconsistencias=[];
 for(const o of operacoesRegistradas){
  if(o.origemEscolhaId!==o.escolhaId||!Number.isFinite(o.principal)||o.principal<0||!Number.isFinite(o.total)||o.total<0||!Number.isFinite(o.encargo)||o.encargo<0||!Array.isArray(o.vencimentos)||!o.vencimentos.length||o.vencimentos.some(v=>!Number.isInteger(v.mes)||v.mes<=o.mesDecisao||!Number.isFinite(v.valor)||v.valor<0)||Math.abs(o.total-o.vencimentos.reduce((a,v)=>a+v.valor,0))>0.011||Math.abs(o.total-o.principal-o.encargo)>0.011)inconsistencias.push(o.escolhaId);
 }
 if(inconsistencias.length)return {estado:'evidencia_insuficiente',pontos:null,componentes:null,erros:['operacao_credito_inconsistente'],operacoes:operacoesRegistradas};
 // Componentes independentes: custo contratual conhecido pode ser avaliado
 // mesmo quando a finalidade ainda não foi declarada. Sem trilha completa,
 // o componente fica null, não zero nem nota máxima.
 const semTrilha=registros.some(r=>!operacoesRegistradas.some(o=>o.escolhaId===r.escolhaId));
 if(semTrilha||(!operacoesRegistradas.length&&saldoCreditoFinal>0))
  return {estado:'pendente_analise_credito',pontos:null,componentes:{finalidade:null,custo:null,sustentabilidade:null},operacoes:operacoesRegistradas,erros:['credito_sem_operacao_individual',...(!registros.length?['credito_de_evento_sem_trilha_individual']:[]),...(registros.some(r=>!['necessidade','estudo','opcional'].includes(r.finalidade))?['finalidade_nao_comprovada']:[])]};
 const principal=operacoesRegistradas.reduce((a,o)=>a+o.principal,0);
 const encargos=operacoesRegistradas.reduce((a,o)=>a+o.encargo,0);
 // Escala experimental de custo: taxa efetiva contratada ponderada por principal.
 // Zero juros = 20; 5% = 15; 9% = 11; >=20% = 0.
 const taxa=principal>0?encargos/principal:null;
 const custo=taxa===null?null:Math.round(Math.max(0,20-100*taxa)*100)/100;
 // Finalidade declarada não equivale a prova de necessidade. Só se avalia
 // gasto opcional ou declarado como necessidade/estudo com orçamento observável.
 // Operações de eventos e déficits ficam sem nota de finalidade nesta etapa.
 const origensOrcamento=new Set(['orcamento-misto','orcamento-credito','orcamento-parcelado']);
 const somenteOrcamento=operacoesRegistradas.every(o=>origensOrcamento.has(o.origem));
 const finalidadeCompleta=somenteOrcamento&&operacoesRegistradas.length>0&&operacoesRegistradas.every(o=>['necessidade','estudo','opcional'].includes(o.finalidadeRegistrada));
 let finalidade=null,detalhesFinalidade=[];
 if(finalidadeCompleta){
  detalhesFinalidade=operacoesRegistradas.map(o=>{
   const b=budgets.find(x=>x.id===o.escolhaId),ctx=b?.contextoAntes;
   const margem=ctx&&Number.isFinite(ctx.renda)&&Number.isFinite(ctx.despesas)&&Number.isFinite(ctx.parcelaAtual)?ctx.renda-ctx.despesas-ctx.parcelaAtual:null;
   const mensal=o.vencimentos.reduce((m,v)=>Math.max(m,v.valor),0);
   // Não atribuir mérito à finalidade declarada se já não há margem
   // sequer para a maior parcela; não penalizar automaticamente juros zero.
   const sustentavelNaDecisao=margem!==null&&margem>=mensal-.005;
   const peso=sustentavelNaDecisao?(o.finalidadeRegistrada==='opcional'?.5:1):0;
   return {origemEscolhaId:o.escolhaId,finalidadeDeclarada:o.finalidadeRegistrada,margemNoMomento:margem,maiorParcela:mensal,peso};
  });
  const base=operacoesRegistradas.reduce((a,o)=>a+o.principal,0);
  finalidade=base>0?Math.round(25*detalhesFinalidade.reduce((a,d,i)=>a+d.peso*operacoesRegistradas[i].principal,0)/base*100)/100:null;
 }
 const porMes=new Map(budgets.map(x=>[x.mes,x]));
 const parcelas=[];let incompleto=false;
 for(const o of operacoesRegistradas)for(const v of o.vencimentos){
  if(v.mes>6){incompleto=true;parcelas.push({origemEscolhaId:o.escolhaId,mes:v.mes,valor:v.valor,estado:'fora_da_janela'});continue}
  const b=porMes.get(v.mes),ctx=b?.contextoAntes;
  const vinculadas=ctx?.obrigacoesAtuais?.filter(x=>x.origemEscolhaId===o.escolhaId)||[];
  const valorVinculado=vinculadas.reduce((a,x)=>a+(Number.isFinite(x.valor)?x.valor:NaN),0);
  const comprovada=Array.isArray(ctx?.obrigacoesAtuais)&&Math.abs(valorVinculado-v.valor)<=.011;
  const disponivel=ctx&&Number.isFinite(ctx.renda)&&Number.isFinite(ctx.despesas)&&Number.isFinite(ctx.parcelaAtual)?ctx.renda-ctx.despesas-ctx.parcelaAtual:null;
  if(!comprovada||disponivel===null){incompleto=true;parcelas.push({origemEscolhaId:o.escolhaId,mes:v.mes,valor:v.valor,estado:'sem_evidencia'});continue}
  parcelas.push({origemEscolhaId:o.escolhaId,mes:v.mes,valor:v.valor,estado:disponivel>=-.005?'margem_nao_negativa':'margem_negativa',disponivel:Math.round(disponivel*100)/100});
 }
 // O componente mede a margem observada nos vencimentos, sem presumir quitação
 // e sem tratar uso legítimo da reserva como falta de responsabilidade.
 const sustent=incompleto||!parcelas.length?null:Math.round(15*parcelas.filter(x=>x.estado==='margem_nao_negativa').length/parcelas.length*100)/100;
 return {estado:'componentes_parciais_em_validacao',pontos:null,
  componentes:{finalidade,custo,sustentabilidade:sustent},detalhesFinalidade,operacoes:operacoesRegistradas,parcelas,
  indicadores:{principal:Math.round(principal*100)/100,encargos:Math.round(encargos*100)/100,taxaContratualPonderada:taxa},
  erros:[...new Set([...(registros.some(r=>!['necessidade','estudo','opcional'].includes(r.finalidade))?['finalidade_nao_comprovada']:[]),...(incompleto?['vencimentos_sem_evidencia_completa']:[])])],
  aviso:'Finalidade autodeclarada e margem na decisão são indicadores pedagógicos experimentais, não prova de necessidade nem de quitação. Nota global permanece pendente.'};
}

// Etapa 69: auditoria factual das baixas de parcelas, SEM atribuir nota.
// Baixa no fluxo pode ter sido coberta por novo financiamento: não é prova de
// quitação econômica nem de comportamento responsável.
function auditarPagamentosParcelasV120(historico=[],escolhas=[]){
 const ev=evidenciasObservadasRubricaV120(historico,escolhas,[]);
 if(!ev.partidaCompleta)return {estado:'evidencia_insuficiente',pagamentos:null,erros:['partida_incompleta']};
 const orcamentos=escolhas.filter(x=>x?.tipo==='orcamento');
 if(orcamentos.length!==6||new Set(orcamentos.map(x=>x.mes)).size!==6)
  return {estado:'evidencia_insuficiente',pagamentos:null,erros:['orcamentos_incompletos']};
 const saidas=[];const erros=[];
 for(const h of [...historico].sort((a,b)=>a.mes-b.mes)){
  const b=orcamentos.find(x=>x.mes===h.mes);
  const devido=b?.contextoAntes?.parcelaAtual;
  const baixas=h.parcelasBaixadasMes;
  if(!Number.isFinite(devido)||devido<0||!Array.isArray(baixas)){
   erros.push(`mes_${h.mes}_sem_trilha`);continue;
  }
  if(baixas.some(x=>x.mes!==h.mes||!Number.isFinite(x.valor)||x.valor<0||!Number.isInteger(x.quantidade)||x.quantidade<1)){
   erros.push(`mes_${h.mes}_baixa_invalida`);continue;
  }
  const baixado=baixas.reduce((a,x)=>a+x.valor,0);
  if(Math.abs(baixado-devido)>.011)erros.push(`mes_${h.mes}_valor_nao_confere`);
  saidas.push({mes:h.mes,devido:Math.round(devido*100)/100,baixado:Math.round(baixado*100)/100,
   vinculos:baixas.map(x=>({origemEscolhaId:x.origemEscolhaId,valor:x.valor})),
   alertaFinanciamento:h.deficit===true});
 }
 return {estado:erros.length?'evidencia_inconsistente':'trilha_observada_sem_nota',pontos:null,
  pagamentos:saidas,erros,avisos:['Baixa de obrigação não comprova pagamento com recursos próprios.',
  'Déficit ou refinanciamento requer avaliação contextual independente.',
  'Parcelas após o mês 6 permanecem fora da janela observada.']};
}

// Etapa 70: candidato dos 70 pontos de pagamentos/parcelas. Não é nota publicada.
// Divisão INTERNA PROVISÓRIA (30/20/20), sujeita à validação pedagógica.
// A auditoria de baixas é condição necessária, mas não suficiente: nova dívida
// para cobrir o mês não pode ser tratada como quitação responsável.
function pontuarPagamentosCandidatoV120(historico=[],escolhas=[]){
 const audit=auditarPagamentosParcelasV120(historico,escolhas);
 if(audit.estado!=='trilha_observada_sem_nota')return {estado:'evidencia_insuficiente',pontos:null,componentes:null,erros:audit.erros};
 const h=[...historico].sort((a,b)=>a.mes-b.mes);
 const e=escolhas.filter(x=>x?.tipo==='orcamento');
 const reneg=escolhas.filter(x=>x?.tipo==='resolucao-deficit'&&['adiar','renegociar'].includes(x?.detalhes?.alternativa));
 const eventosReneg=escolhas.filter(x=>x?.tipo==='renegociacao-essenciais');
 const mesesFinanciados=new Set(reneg.map(x=>x.mes));
 const erros=[];
 for(const x of h){
  const b=e.find(y=>y.mes===x.mes),ctx=b?.contextoAntes;
  if(!ctx||![ctx.renda,ctx.despesas,ctx.parcelaAtual,x.essenciaisNaoPagas,x.dividas].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0))erros.push(`mes_${x.mes}_contexto_incompleto`);
  if(typeof x.deficit!=='boolean')erros.push(`mes_${x.mes}_deficit_incompleto`);
 }
 if(erros.length)return {estado:'evidencia_insuficiente',pontos:null,componentes:null,erros};
 const operacoes=escolhas.flatMap(x=>Array.isArray(x?.detalhes?.operacoesCredito)?x.detalhes.operacoesCredito:[]);
 if(operacoes.some(o=>!Array.isArray(o.vencimentos)||o.vencimentos.some(v=>!Number.isFinite(v.valor)||v.valor<0||!Number.isInteger(v.mes))))
  return {estado:'evidencia_insuficiente',pontos:null,componentes:null,erros:['contratos_incompletos']};
 const meses=h.map(x=>{
  const b=e.find(y=>y.mes===x.mes),c=b.contextoAntes;
  const margem=c.renda-c.despesas-c.parcelaAtual;
  const refinanciou=mesesFinanciados.has(x.mes)||x.deficit;
  const contasEmDia=x.essenciaisNaoPagas===0;
  return {mes:x.mes,margem:Math.round(margem*100)/100,refinanciou,contasEmDia,parcela:c.parcelaAtual,
   compromissosSustentaveis:margem>=-.005&&!refinanciou&&contasEmDia};
 });
 // 30: capacidade real de manter as parcelas sem novo financiamento.
 const capacidade=30*meses.filter(x=>x.compromissosSustentaveis).length/6;
 // 20: evitar juros de operações contratadas, sem penalizar parcelamento sem juros.
 // O custo é observado por contrato; sem empréstimos, custo zero recebe máximo.
 const principal=operacoes.reduce((a,o)=>a+(Number.isFinite(o.principal)?o.principal:0),0);
 const encargos=operacoes.reduce((a,o)=>a+(Number.isFinite(o.encargo)?o.encargo:0),0);
 const custo=principal===0?20:20*Math.max(0,1-encargos/principal/0.20);
 // 20: continuidade no período e não transferência artificial do déficit.
 // Recuperação é reconhecida nos meses bons; meses ruins não são apagados.
 const continuidade=20*meses.filter(x=>x.compromissosSustentaveis).length/6;
 const arred=x=>Math.round(x*100)/100;
 const componentes={capacidade:arred(capacidade),custo:arred(custo),continuidade:arred(continuidade)};
 return {estado:'candidato_em_validacao',pontos:arred(Object.values(componentes).reduce((a,v)=>a+v,0)),componentes,
  meses,indicadores:{principal:arred(principal),encargos:arred(encargos),renegociacoes:reneg.length+eventosReneg.length},
  aviso:'Divisão 30/20/20 provisória; baixa contábil conciliada não demonstra, isoladamente, pagamento com recursos próprios. Não publicar como nota final.'};
}

// Etapa 71: quatro candidatos independentes, sem alterar a nota pública.
// Todas as contas são proporcionais aos seis meses observados; projeção limitada a 6 pontos.
function baseCandidatos71(historico=[],escolhas=[],movimentosReserva=[]){
 const ev=evidenciasObservadasRubricaV120(historico,escolhas,movimentosReserva);
 if(!ev.evidenciasValidas)return {erro:{estado:'evidencia_insuficiente',pontos:null,componentes:null,erros:ev.erros}};
 const h=[...historico].sort((a,b)=>a.mes-b.mes);
 const b=escolhas.filter(x=>x?.tipo==='orcamento').sort((a,b)=>a.mes-b.mes);
 const linhas=[];
 for(let i=0;i<6;i++){
  const x=h[i],c=b[i]?.contextoAntes,d=b[i]?.detalhes;
  if(!c||!d||x.mes!==b[i].mes||![c.renda,c.despesas,c.parcelaAtual,d.gastoAdicional,d.aporteMeta??d.objetivo,d.aporteReserva??d.reserva,x.essenciaisNaoPagas,x.dividas].every(v=>Number.isFinite(v)&&v>=0))
   return {erro:{estado:'evidencia_insuficiente',pontos:null,componentes:null,erros:[`mes_${x.mes}_dados_insuficientes`]}};
  const forma=d.formaPagamento;
  if(d.gastoAdicional>0&&forma==='misto')return {erro:{estado:'evidencia_insuficiente',pontos:null,componentes:null,erros:['gasto_misto_sem_desembolso_auditavel']}};
  const desembolso=['credito','parcelado'].includes(forma)?0:d.gastoAdicional;
  const margem=c.renda-c.despesas-c.parcelaAtual-desembolso;
  linhas.push({mes:x.mes,h:x,b:b[i],margem,semDeficit:!x.deficit,essenciais:x.essenciaisNaoPagas===0,
   compromisso:x.dividas,aporteMeta:d.aporteMeta??d.objetivo,aporteReserva:d.aporteReserva??d.reserva,
   saldoLivre:x.livre});
 }
 return {h,b,linhas,ev};
}
function pontuarFuturoCandidatoV120(historico=[],escolhas=[],movimentosReserva=[]){
 const z=baseCandidatos71(historico,escolhas,movimentosReserva);if(z.erro)return z.erro;
 const l=z.linhas;const arred=x=>Math.round(x*100)/100;
 const equilibrio=27*l.filter(x=>x.semDeficit&&x.margem>=-.005&&x.essenciais).length/6;
 // Evolução: valoriza estabilidade desde o começo OU recuperação efetiva;
 // melhorar não pode apagar os meses ruins já computados em equilíbrio.
 const evolucao=27*l.filter((x,i)=>x.semDeficit&&x.margem>=-.005&&x.essenciais).length/6;
 const ultima=l[5];const prox=ultima.h.parcelaProxima;
 if(!Number.isFinite(prox)||prox<0)return {estado:'evidencia_insuficiente',pontos:null,componentes:null,erros:['projecao_invalida']};
 const margemFutura=ultima.h.rendaMes-ultima.h.despesasMes-prox;
 const projecao=6*(margemFutura>=-.005&&ultima.essenciais?1:0);
 const componentes={equilibrio_observado:arred(equilibrio),evolucao_observada:arred(evolucao),projecao:arred(projecao)};
 return {estado:'candidato_em_validacao',pontos:arred(Object.values(componentes).reduce((a,b)=>a+b,0)),componentes,
  meses:l.map(x=>({mes:x.mes,margem:arred(x.margem),essenciaisEmDia:x.essenciais,deficit:!x.semDeficit})),
  aviso:'Estabilidade e recuperação reconhecidas; os 6 pontos de projeção não comprovam o futuro. A métrica de evolução exige calibração independente.'};
}
function pontuarEssenciaisCandidatoV120(historico=[],escolhas=[],movimentosReserva=[]){
 const z=baseCandidatos71(historico,escolhas,movimentosReserva);if(z.erro)return z.erro;
 const l=z.linhas,arred=x=>Math.round(x*100)/100;
 const priorizacao=35*l.filter(x=>x.essenciais).length/6;
 const regularidade=25*l.filter(x=>x.essenciais).length/6;
 // Não penalizar novamente juros e parcelas neste componente; observar dívida essencial remanescente.
 if(l.some(x=>!Number.isFinite(x.h.dividaEssencial)||x.h.dividaEssencial<0))return {estado:'evidencia_insuficiente',pontos:null,componentes:null,erros:['divida_essencial_sem_registro']};
 const consequencias=20*l.filter(x=>x.essenciais&&x.h.dividaEssencial===0).length/6;
 const componentes={priorizacao:arred(priorizacao),regularidade:arred(regularidade),consequencias:arred(consequencias)};
 return {estado:'candidato_em_validacao',pontos:arred(Object.values(componentes).reduce((a,b)=>a+b,0)),componentes,
  aviso:'Somente regularidade de essenciais e dívida essencial observada; custos financeiros avaliados separadamente.'};
}
function pontuarObjetivoCandidatoV120(historico=[],escolhas=[],movimentosReserva=[]){
 const z=baseCandidatos71(historico,escolhas,movimentosReserva);if(z.erro)return z.erro;
 const l=z.linhas,arred=x=>Math.round(x*100)/100;
 const r=Array.isArray(movimentosReserva)?movimentosReserva:[];
 // Não presumir mérito ou demérito do uso da reserva sem conhecer o motivo.
 const usos=r.filter(x=>x.tipo==='uso');
 if(usos.some(x=>!x.origem||!Number.isFinite(x.saldoAntes)||!Number.isFinite(x.saldoDepois)))
  return {estado:'evidencia_insuficiente',pontos:null,componentes:null,erros:['uso_reserva_sem_contexto']};
 const saldoFinal=l[5].h.reserva;
 const gestao=15*(saldoFinal>0||l.some(x=>x.aporteReserva>0)||usos.length>0?1:0);
 const planejar=10*l.filter(x=>x.aporteMeta>=0&&x.margem>=-.005).length/6;
 const fim=l[5].h;const alcancado=fim.metaValor>0&&fim.meta>=fim.metaValor;
 const realizado=15*(alcancado&&l[5].essenciais&&l[5].margem>=-.005?1:0);
 const componentes={gestao_reserva:arred(gestao),planejamento_meta:arred(planejar),realizacao_meta:arred(realizado)};
 return {estado:'candidato_em_validacao',pontos:arred(Object.values(componentes).reduce((a,b)=>a+b,0)),componentes,
  aviso:'Formação e uso da reserva são sinais provisórios; não penalizar quem utiliza reserva legitimamente. Meta alcançada com dívidas requer auditoria posterior.'};
}
function pontuarCustosCandidatoV120(historico=[],escolhas=[],movimentosReserva=[]){
 const z=baseCandidatos71(historico,escolhas,movimentosReserva);if(z.erro)return z.erro;
 const l=z.linhas,arred=x=>Math.round(x*100)/100;
 // Etapa 72: não atribuir pontos por três proxies que repetem equilíbrio mensal.
 // Sem registro independente da finalidade e dos gastos adicionais, não há evidência
 // suficiente para avaliar este critério. Null significa pendente, nunca nota zero.
 return {estado:'evidencia_insuficiente',pontos:null,
  componentes:{necessidade:null,margem:null,consistencia:null},
  erros:['gastos_adicionais_sem_evidencia_independente'],
  aviso:'Suspenso o candidato de 70 pontos: a Etapa 71 repetia equilíbrio mensal em três componentes. Requer decisões e gastos adicionais auditáveis antes de pontuar.'};
}

function auditarRubricaAprovadaV120(registros=[],historico=[],escolhas=[],movimentosReserva=[]){
 const r=Array.isArray(registros)?registros:[],h=Array.isArray(historico)?historico:[],e=Array.isArray(escolhas)?escolhas:[];
 const contexto=typeof avaliarContextoV120==='function'?avaliarContextoV120(r,h,e):null;
 const mapa=new Map((contexto?.itens||[]).map(i=>[i.id,i]));
 const meses=[...new Set(h.map(x=>x.mes))];
 const partidaCompleta=h.length===6&&[1,2,3,4,5,6].every(m=>meses.includes(m));
 const itens=[];
 for(const [dominio,subcriterios] of Object.entries(RUBRICA_APROVADA_V120))for(const [chave,maximo] of Object.entries(subcriterios)){
  const id=`${dominio}.${chave}`;
  const origem=id;
  const diagnostico=mapa.get(origem);
  const partes=COMPONENTES_APROVADOS_V120[id]||null;
  const componentes=partes?Object.entries(partes).map(([nome,peso])=>({nome,maximo:peso,pontos:null,estado:'pendente_validacao_independente'})):null;
  // Notas experimentais anteriores são somente referências, não se convertem
  // automaticamente em pontos da nova rubrica ou em componentes aprovados.
  itens.push({id,maximo,pontos:null,estado:partidaCompleta?'pendente_validacao_pedagogica':'pendente_partida_completa',
   componentes,diagnosticoAnterior:diagnostico?{metodo:diagnostico.metodo,pendente:diagnostico.pendente===true,notaExperimental:diagnostico.nota??null}:null});
 }
 const evidenciasObservadas=evidenciasObservadasRubricaV120(h,e,movimentosReserva);
 const candidatoEquilibrio=pontuarEquilibrioCandidatoV120(h,e,movimentosReserva);
 const candidatoCredito=pontuarCreditoCandidatoV120(h,e,movimentosReserva);
 const auditoriaParcelas=auditarPagamentosParcelasV120(h,e);
 const candidatoPagamentos=pontuarPagamentosCandidatoV120(h,e);
 const candidatos71={'planejamento.futuro':pontuarFuturoCandidatoV120(h,e,movimentosReserva),'planejamento.objetivo':pontuarObjetivoCandidatoV120(h,e,movimentosReserva),'recursos.essenciais':pontuarEssenciaisCandidatoV120(h,e,movimentosReserva),'recursos.custos':pontuarCustosCandidatoV120(h,e,movimentosReserva)};
 // Etapa 73: diagnóstico da cobertura real, sem confundir candidato com validação.
 const candidatos={'recursos.equilibrio':candidatoEquilibrio,'recursos.credito':candidatoCredito,'planejamento.compromissos':candidatoPagamentos,...candidatos71};
 const cobertura=itens.reduce((acc,item)=>{
  const candidato=candidatos[item.id];
  if(!candidato){acc.semCalculo.push(item.id);acc.pontosSemCalculo+=item.maximo;}
  else if(candidato.pontos===null){acc.suspensosOuSemEvidencia.push(item.id);acc.pontosSuspensos+=item.maximo;}
  else {acc.comCandidato.push(item.id);acc.pontosComCandidato+=item.maximo;}
  return acc;
 },{comCandidato:[],semCalculo:[],suspensosOuSemEvidencia:[],pontosComCandidato:0,pontosSemCalculo:0,pontosSuspensos:0});
 // Cobertura depende da partida: ausência de evidência não equivale a falta de implementação.
 const totalMaximo=itens.reduce((a,i)=>a+i.maximo,0);
 const dominios=Object.entries(RUBRICA_APROVADA_V120).map(([id,partes])=>({id,maximo:Object.values(partes).reduce((a,b)=>a+b,0),pontos:null}));
 return {versao:'1.20-rubrica-aprovada-candidato-etapa73',partidaCompleta,totalMaximo,dominios,itens,
  total:null,notaPublicavel:null,evidenciasObservadas,candidatos,cobertura,auditoriaParcelas,subcriteriosPendentes:itens.map(i=>i.id),
  aviso:'Os pesos estão aprovados, mas os 16 resultados não foram validados. Não usar nota experimental como nota definitiva.'};
}

// Etapa 74: pré-auditoria de rastreabilidade. Não atribui pontos e não
// transforma dados faltantes em escolhas ruins. Prepara a futura validação
// independente de gastos adicionais, sem reaproveitar a margem mensal.
function auditarTrilhasIndependentesV120(historico=[],escolhas=[],movimentosReserva=[]){
 const h=Array.isArray(historico)?historico:[];
 const e=Array.isArray(escolhas)?escolhas:[];
 const r=Array.isArray(movimentosReserva)?movimentosReserva:[];
 const pendencias=new Set(),porMes=new Map();
 if(h.length!==6||new Set(h.map(x=>x?.mes)).size!==6||![1,2,3,4,5,6].every(m=>h.some(x=>x?.mes===m)))pendencias.add('historico_incompleto');
 const orc=e.filter(x=>x?.tipo==='orcamento');
 for(const x of orc){if(!porMes.has(x.mes))porMes.set(x.mes,[]);porMes.get(x.mes).push(x);}
 if(orc.length!==6||![1,2,3,4,5,6].every(m=>porMes.has(m)))pendencias.add('orcamento_incompleto');
 if([...porMes.values()].some(v=>v.length!==1))pendencias.add('orcamento_duplicado');
 const gastos=[];
 for(const x of orc){
  const d=x.detalhes||{},valor=d.gastoAdicional;
  if(!Number.isFinite(valor)||valor<0){pendencias.add('gasto_sem_valor_valido');continue;}
  // A ausência de compra é válida, mas deve ser um registro explícito.
  if(!Object.hasOwn(d,'finalidadeGasto')||!Object.hasOwn(d,'justificativaGasto')||!Object.hasOwn(d,'desembolsoAdicional'))pendencias.add('gastos_sem_trilha_independente');
  if(valor>0&&(!d.finalidadeGasto||d.finalidadeGasto==='nao_informada'||!d.justificativaGasto))pendencias.add('compra_sem_contexto_independente');
  if(valor>0&&(!Number.isFinite(d.desembolsoAdicional)||d.desembolsoAdicional<0||d.desembolsoAdicional>valor))pendencias.add('desembolso_nao_auditavel');
  if(valor>0){
   if(!x.id)pendencias.add('compra_sem_identificador');
   if(!d.formaPagamento)pendencias.add('compra_sem_forma_pagamento');
   if(['credito','parcelado'].includes(d.formaPagamento)){
    const operacoes=Array.isArray(d.operacoesCredito)?d.operacoesCredito:[];
    const vinculos=operacoes.filter(op=>op?.origemEscolhaId===x.id&&Number.isFinite(op.principal)&&op.principal>0&&Array.isArray(op.vencimentos)&&op.vencimentos.length>0);
    if(!vinculos.length)pendencias.add('compra_sem_vinculo_individual');
    if(operacoes.length&&vinculos.length!==operacoes.length)pendencias.add('credito_operacao_inconsistente');
   }
   if(d.formaPagamento==='misto'){
    if(!Number.isFinite(d.desembolsoAdicional)||d.desembolsoAdicional<0)pendencias.add('desembolso_misto_nao_auditavel');
    const principal=Math.round((valor-d.desembolsoAdicional)*100)/100;
    if(principal>0.005){const ops=Array.isArray(d.operacoesCredito)?d.operacoesCredito:[];if(!ops.some(op=>op?.origemEscolhaId===x.id&&Math.abs(op.principal-principal)<0.011))pendencias.add('misto_sem_credito_vinculado');}
   }
  }
  gastos.push({mes:x.mes,escolhaId:x.id??null,valor,finalidade:d.finalidadeGasto??null,justificativa:d.justificativaGasto??null,desembolso:d.desembolsoAdicional??null});
 }
 // Etapa 77: conferir contratos e calendário sem confundir vencimento com pagamento.
 const contratos=[];
 const identificadoresContratos=new Set();
 for(const escolha of e){
  const ops=escolha?.detalhes?.operacoesCredito;
  if(ops===undefined)continue;
  if(!Array.isArray(ops)){pendencias.add('operacoes_credito_formato_invalido');continue;}
  for(const op of ops){
   const validNum=n=>Number.isFinite(n)&&n>=0;
   if(!op||!escolha.id||op.origemEscolhaId!==escolha.id||!validNum(op.principal)||!validNum(op.total)||!Array.isArray(op.vencimentos)||!op.vencimentos.length){pendencias.add('contrato_credito_incompleto');continue;}
   // Um identificador de escolha repetido torna ambígua a conciliação por contrato.
   if(identificadoresContratos.has(escolha.id))pendencias.add('identificador_contrato_duplicado');
   identificadoresContratos.add(escolha.id);
   const venc=op.vencimentos,meses=new Set();let soma=0;
   for(const v of venc){
    if(!v||!Number.isInteger(v.mes)||v.mes<=escolha.mes||!validNum(v.valor)){pendencias.add('vencimento_credito_invalido');continue;}
    if(meses.has(v.mes))pendencias.add('vencimento_credito_duplicado');
    meses.add(v.mes);soma+=v.valor;
   }
   if(Math.abs(soma-op.total)>0.011)pendencias.add('total_parcelas_divergente');
   if(op.total+0.011<op.principal)pendencias.add('total_credito_inferior_principal');
   if(op.encargo!==undefined&&(!validNum(op.encargo)||Math.abs(op.total-op.principal-op.encargo)>0.011))pendencias.add('encargo_credito_inconsistente');
   contratos.push({escolhaId:escolha.id,mesContratacao:escolha.mes,principal:op.principal,total:op.total,vencimentos:venc.map(v=>({mes:v.mes,valor:v.valor})),vencimentosAposJogo:venc.filter(v=>v.mes>6).length});
  }
 }
 // Etapa 78: conciliar vencimentos e baixas observadas, sem equiparar baixa a quitação.
 const conciliacao=[];
 for(const c of contratos){
  for(const v of c.vencimentos){
   if(!Number.isInteger(v.mes)||v.mes<1||v.mes>6)continue;
   const registro=h.find(x=>x?.mes===v.mes);
   const baixas=registro?.parcelasBaixadasMes;
   if(!Array.isArray(baixas)){
    conciliacao.push({escolhaId:c.escolhaId,mes:v.mes,previsto:v.valor,baixado:null,estado:'sem_trilha_de_baixa'});
    continue;
   }
   const ligadas=baixas.filter(b=>b?.origemEscolhaId===c.escolhaId);
   if(ligadas.some(b=>!Number.isFinite(b.valor)||b.valor<0)){
    pendencias.add('baixa_credito_invalida');
    conciliacao.push({escolhaId:c.escolhaId,mes:v.mes,previsto:v.valor,baixado:null,estado:'baixa_invalida'});
    continue;
   }
   const baixado=Math.round(ligadas.reduce((a,b)=>a+b.valor,0)*100)/100;
   const estado=Math.abs(baixado-v.valor)<=0.011?'baixa_conciliada_sem_prova_de_origem':baixado<v.valor?'baixa_inferior_ao_previsto':'baixa_superior_ao_previsto';
   if(estado==='baixa_superior_ao_previsto')pendencias.add('baixa_credito_excedente');
   if(estado==='baixa_inferior_ao_previsto')pendencias.add('baixa_credito_inferior_ao_previsto');
   conciliacao.push({escolhaId:c.escolhaId,mes:v.mes,previsto:v.valor,baixado,estado});
  }
 }
 // Etapa 81: detectar baixas órfãs e repetidas sem presumir inadimplência.
 const idsContratos=new Set(contratos.map(c=>c.escolhaId));
 const baixasSemContrato=[];
 const chavesBaixas=new Set();
 for(const registro of h){
  if(!Array.isArray(registro?.parcelasBaixadasMes))continue;
  for(const baixa of registro.parcelasBaixadasMes){
   if(!baixa||typeof baixa!=='object')continue;
   const id=baixa.origemEscolhaId;
   if(id===null||id===undefined||!idsContratos.has(id)){
    baixasSemContrato.push({mes:registro.mes,escolhaId:id??null,valor:baixa.valor??null});
    pendencias.add('baixa_sem_contrato_vinculado');
   }
   // Não deduplicar por valor: duas parcelas legítimas podem ter o mesmo valor.
   // Apenas IDs explícitos de transação identificam duplicidade verificável.
   if(baixa.transacaoId!==undefined&&baixa.transacaoId!==null){
    const chave=String(baixa.transacaoId);
    if(!chave.trim())pendencias.add('identificador_baixa_vazio');
    else if(chavesBaixas.has(chave))pendencias.add('identificador_baixa_duplicado');
    else chavesBaixas.add(chave);
   }
  }
 }
 // Etapa 79: origem dos recursos é evidência opcional; ausência não prova inadimplência.
 const origens=[];
 const fontesValidas=new Set(['saldo','reserva','credito','misto','nao_informada']);
 for(const registro of h){
  if(!Array.isArray(registro?.parcelasBaixadasMes))continue;
  for(const baixa of registro.parcelasBaixadasMes){
   if(!baixa||typeof baixa!=='object')continue;
   const fonte=baixa.origemRecursos??null;
   const declarada=fonte!==null&&fonte!=='nao_informada';
   // Uma declaração de origem não equivale à comprovação por lançamentos contábeis.
   const comprovada=false;
   if(fonte!==null&&!fontesValidas.has(fonte))pendencias.add('origem_recursos_invalida');
   if(fonte==='misto'){
    const partes=baixa.composicaoRecursos;
    if(!partes||typeof partes!=='object'||!['saldo','reserva','credito'].every(k=>Number.isFinite(partes[k])&&partes[k]>=0)||!Number.isFinite(baixa.valor)||Math.abs(Object.values(partes).reduce((a,b)=>a+b,0)-baixa.valor)>0.011)pendencias.add('composicao_recursos_inconsistente');
   }
   if(fonte==='misto'&&Number.isFinite(baixa.composicaoRecursos?.credito)&&baixa.composicaoRecursos.credito>0&&(typeof baixa.refinanciamentoId!=='string'||!baixa.refinanciamentoId.trim()))pendencias.add('refinanciamento_misto_sem_identificador');
   if(fonte==='credito'&&(typeof baixa.refinanciamentoId!=='string'||!baixa.refinanciamentoId.trim()))pendencias.add('refinanciamento_sem_identificador');
   origens.push({mes:registro.mes,escolhaId:baixa.origemEscolhaId??null,valor:baixa.valor??null,fonte,declarada,comprovada,refinanciamentoId:baixa.refinanciamentoId??null});
  }
 }
 if(r.some(x=>!Number.isInteger(x?.mes)||x.mes<1||x.mes>6||!Number.isFinite(x?.valor)||x.valor<0))pendencias.add('movimento_reserva_invalido');
 return {etapa:81,contratos,conciliacao,origens,baixasSemContrato,calendarioNaoComprovaPagamento:true,parcelasAposJogo:contratos.flatMap(c=>c.vencimentos.filter(v=>v.mes>6).map(v=>({escolhaId:c.escolhaId,mes:v.mes,valor:v.valor}))),auditavel:pendencias.size===0,pendencias:[...pendencias].sort(),gastos,
  aviso:'Auditoria de trilhas: nenhuma nota é atribuída. A origem declarada não comprova a fonte dos recursos; faltam lançamentos vinculados do motor do jogo.'};
}


// Etapa 84: auditoria independente das decisões, sem pontuar por ausência de dados.
// O histórico mensal não substitui a evidência do contexto disponível NO MOMENTO da escolha.
function auditarDecisoesContextuaisV120(escolhas=[]){
 const e=Array.isArray(escolhas)?escolhas:[];
 const pendencias=new Set(),ids=new Set(),decisoes=[];
 const tiposIgnorados=new Set(['orcamento','pagamento-atraso','renegociacao-essenciais']);
 for(const x of e){
  if(!x||typeof x!=='object'){pendencias.add('escolha_invalida');continue;}
  if(tiposIgnorados.has(x.tipo))continue;
  const problemas=[];
  if(!Number.isInteger(x.mes)||x.mes<1||x.mes>6)problemas.push('mes_decisao_invalido');
  if(typeof x.id!=='string'||!x.id.trim())problemas.push('decisao_sem_id');
  else if(ids.has(x.id))problemas.push('decisao_id_duplicado');
  else ids.add(x.id);
  const d=x.detalhes||{};
  // Dados necessários para comparar alternativas sem viés retrospectivo.
  if(!Array.isArray(d.alternativasDisponiveis)||d.alternativasDisponiveis.length<2)problemas.push('alternativas_nao_registradas');
  if(d.alternativaEscolhida===undefined||d.alternativaEscolhida===null)problemas.push('alternativa_escolhida_ausente');
  if(!d.contextoNoMomento||typeof d.contextoNoMomento!=='object')problemas.push('contexto_da_escolha_ausente');
  if(Array.isArray(d.alternativasDisponiveis)&&d.alternativaEscolhida!==undefined&&!d.alternativasDisponiveis.some(a=>a?.id===d.alternativaEscolhida))problemas.push('alternativa_nao_corresponde');
  if(Array.isArray(d.alternativasDisponiveis)){
   const idsAlternativas=d.alternativasDisponiveis.map(a=>a?.id);
   if(idsAlternativas.some(id=>typeof id!=='string'||!id.trim())||new Set(idsAlternativas).size!==idsAlternativas.length)problemas.push('alternativas_ids_invalidos_ou_duplicados');
  }
  if(x.tipo==='resolucao-deficit'&&Number.isFinite(d.reservaDisponivel)&&Number.isFinite(d.valorOriginal)&&d.reservaDisponivel<d.valorOriginal&&d.alternativasDisponiveis?.some(a=>a?.id==='recursos'))problemas.push('reserva_inviavel_oferecida');
  problemas.forEach(y=>pendencias.add(y));
  decisoes.push({id:x.id??null,mes:x.mes??null,tipo:x.tipo??null,auditavel:problemas.length===0,pendencias:problemas});
 }
 if(!decisoes.length)pendencias.add('nenhuma_decisao_contextual_registrada');
 return {etapa:84,decisoes,quantidade:decisoes.length,auditaveis:decisoes.filter(d=>d.auditavel).length,
  pendencias:[...pendencias].sort(),prontaParaPontuar:decisoes.length>0&&pendencias.size===0,
  pontos:null,aviso:'Auditoria de evidências, não pontuação. Contexto no momento da escolha é obrigatório; não inferir alternativas a partir do saldo final.'};
}


// Etapa 87: candidato estritamente baseado em notas individuais verificáveis.
// Não atribui nota presumida nem substitui a pontuação oficial do jogo.
function avaliarAlternativasEtapa87V120(escolhas=[]){
 const auditoria=auditarDecisoesContextuaisV120(escolhas);
 const validas=[],pendencias=new Set(auditoria.pendencias);
 const indice=new Map(auditoria.decisoes.map(d=>[d.id,d]));
 for(const x of (Array.isArray(escolhas)?escolhas:[])){
  const a=indice.get(x?.id);
  if(!a||!a.auditavel)continue;
  // Uma decisão duplicada não pode aumentar a média por repetição do mesmo ID.
  if(validas.some(v=>v.id===x.id)){pendencias.add('decisao_id_duplicado');continue;}
  const d=x.detalhes||{};
  // A nota só é aceita quando produzida por avaliador identificável e explícito.
  const nota=d.avaliacaoAlternativa?.nota;
  const origem=d.avaliacaoAlternativa?.origem;
  if(typeof nota!=='number'||!Number.isFinite(nota)||nota<0||nota>100||typeof origem!=='string'||!origem.trim()){
   pendencias.add('nota_individual_nao_fundamentada');continue;
  }
  validas.push({id:x.id,mes:x.mes,nota,origem});
 }
 const completo=auditoria.prontaParaPontuar&&validas.length===auditoria.quantidade;
 return {etapa:87,maximo:70,quantidade:auditoria.quantidade,avaliadas:validas.length,
  mediaIndividual:validas.length?validas.reduce((s,d)=>s+d.nota,0)/validas.length:null,
  pontosCandidatos:completo?Math.round(validas.reduce((s,d)=>s+d.nota,0)/validas.length*70)/100:null,
  prontoParaValidacao:completo,pendencias:[...pendencias].sort(),
  decisoes:validas,aviso:'Candidato experimental: exige nota individual fundamentada para cada decisão; não integra a pontuação definitiva.'};
}


// Etapa 88: parecer contextual conservador. Nao transforma heuristica em nota.
// Apenas situacoes demonstraveis sao classificadas; demais exigem evidencia adicional.
function parecerContextualEtapa88V120(escolhas=[]){
 const audit=auditarDecisoesContextuaisV120(escolhas);
 const porId=new Map(audit.decisoes.map(x=>[x.id,x]));
 const pareceres=[];
 for(const x of (Array.isArray(escolhas)?escolhas:[])){
  const a=porId.get(x?.id);
  if(!a)continue;
  if(!a.auditavel){pareceres.push({id:x.id??null,mes:x.mes??null,estado:'evidencia_incompleta',motivos:a.pendencias,nota:null});continue;}
  const d=x.detalhes||{},c=d.contextoNoMomento||{};
  let estado='avaliacao_contextual_pendente',motivos=['necessita_avaliacao_pedagogica_individual'];
  if(x.tipo==='resolucao-deficit'){
   const valor=d.valorOriginal,reserva=d.reservaDisponivel,op=d.alternativaEscolhida;
   if(Number.isFinite(valor)&&valor>0&&Number.isFinite(reserva)&&reserva>=0&&Number.isFinite(c.renda)&&Number.isFinite(c.despesas)){
    if(op==='recursos'&&reserva>=valor){estado='alternativa_viavel';motivos=['reserva_suficiente','avaliar_impacto_na_reserva_e_compromissos'];}
    else if(op==='recursos'&&reserva<valor){estado='escolha_inviavel';motivos=['reserva_insuficiente'];}
    else if(op==='adiar'||op==='renegociar'){
     estado='requer_analise_de_custo_e_prazo';motivos=['faltam_juros_prazos_e_impacto_futuro'];
    }
   }
  }
  // Etapa 89: pareceres adicionais sem atribuir notas ou presumir custos.
  if(x.tipo==='contas-essenciais'){
   const op=d.alternativaEscolhida;
   if(op==='pagar'){
    estado='priorizacao_essenciais_identificada';
    motivos=['verificar_disponibilidade_real_e_pagamento_efetivo'];
   }else if(op==='adiar'){
    estado='adiamento_essenciais_requer_analise';
    motivos=['verificar_insuficiencia_de_recursos_juros_e_recuperacao'];
   }
  }else if(x.tipo==='acontecimento'){
   const op=d.alternativasDisponiveis.find(y=>y?.id===d.alternativaEscolhida);
   if(op){
    estado='acontecimento_requer_comparacao';
    motivos=['avaliar_necessidade_custo_total_parcelas_e_compromissos_no_momento'];
    if(d.alternativasDisponiveis.some(y=>y?.id!==op.id))motivos.push('comparar_opcoes_efetivamente_disponiveis');
   }
  }else if(x.tipo==='renda-extra'){
   estado='renda_extra_requer_analise';
   motivos=['verificar_esforco_condicoes_e_impacto_financeiro'];
  }else if(x.tipo==='viagem'){
   estado='viagem_requer_analise';
   motivos=['verificar_custo_total_essenciais_e_compromissos_futuros'];
  }
  pareceres.push({id:x.id,mes:x.mes,tipo:x.tipo,estado,motivos,nota:null});
 }
 return {etapa:88,pareceres,quantidade:pareceres.length,notasAtribuidas:0,
  prontoParaPontuar:false,pendencias:audit.pendencias,
  aviso:'Pareceres qualitativos experimentais; nao atribuem notas sem avaliacao fundamentada.'};
}


// Etapa 90: auditoria de prontidao para nota contextual, sem inventar pontuacao.
// Identifica evidencias verificaveis e separa campos ausentes de valores zero.
function auditarEvidenciasNotaEtapa90V120(escolhas=[]){
 const auditoria=auditarDecisoesContextuaisV120(escolhas);
 const porId=new Map(auditoria.decisoes.map(d=>[d.id,d]));
 const resultados=[];
 const temNumero=(obj,k)=>typeof obj?.[k]==='number'&&Number.isFinite(obj[k])&&obj[k]>=0;
 for(const x of (Array.isArray(escolhas)?escolhas:[])){
  const a=porId.get(x?.id);
  if(!a)continue;
  const d=x.detalhes||{}, c=d.contextoNoMomento||{};
  const faltantes=[];
  if(!a.auditavel)faltantes.push(...a.pendencias);
  if(!temNumero(c,'renda'))faltantes.push('renda_no_momento_ausente');
  if(!temNumero(c,'despesas'))faltantes.push('despesas_no_momento_ausentes');
  if(!temNumero(c,'reserva'))faltantes.push('reserva_no_momento_ausente');
  if(x.tipo==='acontecimento'||x.tipo==='viagem'){
   const op=d.alternativasDisponiveis?.find(y=>y?.id===d.alternativaEscolhida);
   if(!temNumero(op,'custoTotal'))faltantes.push('custo_total_escolhido_ausente');
   if(!temNumero(op,'valorMensal'))faltantes.push('comprometimento_mensal_ausente');
   if(!temNumero(c,'parcelasExistentes'))faltantes.push('parcelas_existentes_ausentes');
  }else if(x.tipo==='resolucao-deficit'){
   if(!temNumero(d,'valorOriginal'))faltantes.push('valor_deficit_ausente');
   if(!temNumero(d,'reservaDisponivel'))faltantes.push('reserva_disponivel_ausente');
  }else if(x.tipo==='contas-essenciais'){
   if(!temNumero(d,'valorConta'))faltantes.push('valor_conta_ausente');
   if(typeof d.pagamentoConfirmado!=='boolean')faltantes.push('confirmacao_pagamento_ausente');
  }else if(x.tipo==='renda-extra'){
   if(!temNumero(d,'valorRendaExtra'))faltantes.push('valor_renda_extra_ausente');
   if(typeof d.condicoesVerificadas!=='boolean')faltantes.push('condicoes_renda_extra_ausentes');
  }
  resultados.push({id:x.id??null,mes:x.mes??null,tipo:x.tipo??null,prontaParaNota:faltantes.length===0,evidenciasAusentes:[...new Set(faltantes)]});
 }
 return {etapa:90,quantidade:resultados.length,prontas:resultados.filter(x=>x.prontaParaNota).length,
  pendentes:resultados.filter(x=>!x.prontaParaNota).length,decisoes:resultados,
  aviso:'Diagnostico de evidencias: prontidao nao equivale a nota; sem alterar os 70 ou 1000 pontos.'};
}

// Etapa 93: projeção verificável de compromissos na decisão, sem nota presumida.
function projetarCompromissosEtapa93V120(escolhas=[]){
 const resultados=[];
 for(const x of Array.isArray(escolhas)?escolhas:[]){
  if(x?.tipo!=='acontecimento'&&x?.tipo!=='viagem')continue;
  const d=x.detalhes||{},c=d.contextoNoMomento||{};
  const op=Array.isArray(d.alternativasDisponiveis)?d.alternativasDisponiveis.find(a=>a?.id===d.alternativaEscolhida):null;
  const faltantes=[];
  if(!op){faltantes.push('alternativa_escolhida_nao_localizada');resultados.push({id:x.id??null,mes:x.mes??null,pronta:false,faltantes});continue;}
  const valor=(v)=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
  const quantidade=op.quantidadeParcelas, mensal=op.valorMensal, inicio=op.primeiroVencimento;
  const parcelado=valor(mensal)&&Number.isInteger(quantidade)&&quantidade>0&&Number.isInteger(inicio)&&inicio>0;
  const aVista=valor(op.custoTotal)&&!parcelado;
  const totalCalculado=parcelado?Math.round(mensal*quantidade*100)/100:null;
  if(parcelado&&valor(op.custoTotal)&&Math.abs(totalCalculado-op.custoTotal)>0.01)faltantes.push('custo_total_diverge_das_parcelas');
  if(parcelado&&valor(op.custoTotal)&&op.custoTotal===0&&totalCalculado>0)faltantes.push('custo_total_zero_inconsistente');
  // Não comprar, pesquisar, adiar e solicitar desconto não são pagamentos zero comprovados.
  const semObrigacao=op.custoTotal===undefined&&op.valorMensal===undefined&&op.quantidadeParcelas===undefined;
  if(!parcelado&&!aVista&&!semObrigacao)faltantes.push('modalidade_financeira_incompleta');
  if(!valor(c.renda)||!valor(c.despesas)||!valor(c.parcelasExistentes))faltantes.push('contexto_orcamentario_incompleto');
  const vencimentos=parcelado?Array.from({length:quantidade},(_,i)=>({mes:inicio+i,valor:mensal})):[];
  const margem=valor(c.renda)&&valor(c.despesas)&&valor(c.parcelasExistentes)?c.renda-c.despesas-c.parcelasExistentes:null;
  const primeiraParcela=parcelado?mensal:0;
  resultados.push({id:x.id??null,mes:x.mes??null,alternativaId:op.id,modalidade:parcelado?'parcelado':aVista?'avista':semObrigacao?'sem_pagamento_imediato':'indeterminada',
   custoTotal:parcelado?totalCalculado:aVista?op.custoTotal:null,
   custoTotalDeclarado:valor(op.custoTotal)?op.custoTotal:null,
   margemAntesDaEscolha:margem,primeiraParcela,
   // Indicador de capacidade, não julgamento da escolha: uma compra pode ter outras consequências.
   parcelaCabeNaMargem:parcelado&&margem!==null?mensal<=margem:null,
   vencimentosDuranteJogo:vencimentos.filter(v=>v.mes<=6),vencimentosAposJogo:vencimentos.filter(v=>v.mes>6),
   pronta:faltantes.length===0,faltantes});
 }
 return {etapa:93,resultados,quantidade:resultados.length,pendentes:resultados.filter(r=>!r.pronta).length,
  aviso:'Projeção financeira experimental; não prova pagamento, não atribui nota e não penaliza parcelamento sem juros automaticamente.'};
}

// Etapa 96: avaliação automática PARCIAL e experimental de dominância financeira.
// Só em alternativas comparáveis, com mesmo número de parcelas e ambas cabendo
// na margem. Nunca atribuir zero quando faltam evidências ou há diferenças de finalidade.
function avaliarDominanciaParcelamentoEtapa96V120(escolhas=[]){
 const auditoria=auditarDecisoesContextuaisV120(escolhas);
 const porChave=new Map(auditoria.decisoes.map(x=>[JSON.stringify([x.id,x.mes]),x]));
 const resultados=[];
 const numero=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
 for(const x of Array.isArray(escolhas)?escolhas:[]){
  if(x?.tipo!=='acontecimento'&&x?.tipo!=='viagem')continue;
  const d=x.detalhes||{},c=d.contextoNoMomento||{};
  const base={id:x.id??null,mes:x.mes??null,notaCandidata:null,estado:'evidencia_insuficiente',motivos:[]};
  if(!porChave.get(JSON.stringify([x.id,x.mes]))?.auditavel){base.motivos.push('auditoria_contextual_pendente');resultados.push(base);continue;}
  const ops=d.alternativasDisponiveis||[];
  const escolhida=ops.find(o=>o.id===d.alternativaEscolhida);
  if(!numero(c.renda)||!numero(c.despesas)||!numero(c.parcelasExistentes)){
   base.motivos.push('margem_desconhecida');resultados.push(base);continue;
  }
  const margem=c.renda-c.despesas-c.parcelasExistentes;
  const valido=o=>o&&numero(o.custoTotal)&&numero(o.valorMensal)&&Number.isInteger(o.quantidadeParcelas)&&o.quantidadeParcelas>0&&Math.abs(o.valorMensal*o.quantidadeParcelas-o.custoTotal)<=0.01;
  if(!valido(escolhida)){base.motivos.push('contrato_escolhido_incompleto');resultados.push(base);continue;}
  // Exige grupo explícito de equivalência de finalidade/benefício: preços menores
  // de bens diferentes não são automaticamente decisões melhores.
  const equivalentes=ops.filter(o=>valido(o)&&typeof o.grupoComparavel==='string'&&o.grupoComparavel.trim()&&o.grupoComparavel===escolhida.grupoComparavel&&o.quantidadeParcelas===escolhida.quantidadeParcelas&&o.valorMensal<=margem);
  if(equivalentes.length<2||escolhida.valorMensal>margem){base.motivos.push('alternativas_equivalentes_viaveis_nao_comprovadas');resultados.push(base);continue;}
  const menor=Math.min(...equivalentes.map(o=>o.custoTotal));
  base.estado=escolhida.custoTotal<=menor+0.01?'menor_custo_entre_equivalentes':'custo_maior_que_equivalente';
  base.motivos.push('comparacao_de_custo_contratual_comprovada');
  // Nota 100 somente para a dimensão objetiva de custo. Uma opção mais cara
  // não recebe nota arbitrária: outras dimensões pedagógicas permanecem pendentes.
  if(base.estado==='menor_custo_entre_equivalentes')base.notaCandidata=100;
  resultados.push(base);
 }
 return {etapa:96,carater:'experimental_parcial',resultados,avaliadas:resultados.filter(x=>x.notaCandidata!==null).length,
 aviso:'Nota 100 apenas na dimensão custo entre alternativas explicitamente equivalentes e viáveis; não equivale à nota global da decisão ou aos 70 pontos.'};
}

// Etapa 99: diagnóstico de capacidade por vencimento, sem atribuir pontos.
// A margem atual é somente uma referência: não presume renda/despesas futuras constantes.
function diagnosticarCapacidadeParcelasEtapa99V120(escolhas=[]){
 const base=projetarCompromissosEtapa93V120(escolhas);
 const resultados=base.resultados.map(r=>{
  const retorno={id:r.id,mes:r.mes,alternativaId:r.alternativaId??null,estado:'indeterminado',mesesDuranteJogo:[],mesesAposJogo:[],motivos:[]};
  if(!r.pronta){retorno.motivos.push(...r.faltantes);return retorno;}
  if(r.modalidade!=='parcelado'){retorno.estado='nao_parcelado';return retorno;}
  if(typeof r.margemAntesDaEscolha!=='number'||!Number.isFinite(r.margemAntesDaEscolha)){retorno.motivos.push('margem_nao_verificada');return retorno;}
  const analisar=v=>({mes:v.mes,parcela:v.valor,cabeNaMargemAtual:v.valor<=r.margemAntesDaEscolha});
  retorno.mesesDuranteJogo=r.vencimentosDuranteJogo.map(analisar);
  retorno.mesesAposJogo=r.vencimentosAposJogo.map(analisar);
  retorno.estado=[...retorno.mesesDuranteJogo,...retorno.mesesAposJogo].every(v=>v.cabeNaMargemAtual)?'compativel_com_margem_atual':'excede_margem_atual';
  retorno.motivos.push('projecao_nao_comprova_capacidade_futura_ou_pagamento');
  return retorno;
 });
 return {etapa:99,carater:'diagnostico_sem_pontos',resultados,quantidade:resultados.length,
 aviso:'A margem do momento não garante capacidade nos meses seguintes. Não atribuir nota ou comprovar pagamento com esta projeção.'};
}

// Etapa 100: consolidação de evidências objetivas, SEM criar nota global artificial.
function consolidarEvidenciasAlternativasEtapa100V120(escolhas=[]){
 const custos=avaliarDominanciaParcelamentoEtapa96V120(escolhas).resultados;
 const capacidades=diagnosticarCapacidadeParcelasEtapa99V120(escolhas).resultados;
 const porChave=(lista)=>{const m=new Map();for(const r of lista){const k=JSON.stringify([r.id,r.mes]);if(m.has(k))m.set(k,null);else m.set(k,r);}return m;};
 const custosMap=porChave(custos), capacidadesMap=porChave(capacidades);
 const resultados=[];
 for(const x of Array.isArray(escolhas)?escolhas:[]){
  if(x?.tipo!=='acontecimento'&&x?.tipo!=='viagem')continue;
  const chave=JSON.stringify([x.id,x.mes]),c=custosMap.get(chave),p=capacidadesMap.get(chave);
  const motivos=[];
  if(!c||c.notaCandidata===null)motivos.push('comparacao_objetiva_de_custo_pendente');
  if(!p||!['compativel_com_margem_atual','excede_margem_atual'].includes(p.estado))motivos.push('capacidade_financeira_nao_determinada');
  if(p?.estado==='excede_margem_atual')motivos.push('parcela_excede_margem_no_momento');
  const evidenciasCompletas=motivos.length===0;
  resultados.push({id:x.id??null,mes:x.mes??null,custoComparativo:c?.estado??null,
   capacidadeNoMomento:p?.estado??null,evidenciasCompletas,pendencias:motivos,
   notaGlobalCandidata:null,nota70Candidata:null});
 }
 return {etapa:100,carater:'consolidacao_experimental',resultados,
  completas:resultados.filter(r=>r.evidenciasCompletas).length,
  aviso:'Evidências de custo e capacidade não substituem necessidade, reserva, alternativas e consequências. Nenhuma nota global ou dos 70 pontos foi criada.'};
}


// Etapa 101: evidências de necessidade e preservação da reserva.
// Declarações sem comprovação não geram nota; a ausência de compra não é erro.
function diagnosticarNecessidadeReservaEtapa101V120(escolhas=[]){
 const resultados=[];
 const valido=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
 for(const x of Array.isArray(escolhas)?escolhas:[]){
  if(x?.tipo!=='acontecimento'&&x?.tipo!=='viagem')continue;
  const d=x.detalhes||{},c=d.contextoNoMomento||{};
  const op=Array.isArray(d.alternativasDisponiveis)?d.alternativasDisponiveis.find(a=>a?.id===d.alternativaEscolhida):null;
  const pendencias=[];
  if(!op)pendencias.push('alternativa_nao_identificada');
  if(!valido(c.reserva))pendencias.push('reserva_no_momento_ausente');
  // Não inferir necessidade pela descrição ou pelo preço.
  if(!['essencial','importante','opcional'].includes(d.necessidadeVerificada))pendencias.push('necessidade_nao_verificada');
  // Fonte da despesa precisa ser explícita; parcelar não significa usar reserva.
  if(!['saldo','reserva','credito','sem_desembolso'].includes(d.fonteEscolhida))pendencias.push('fonte_do_desembolso_nao_verificada');
  let reservaApos=null;
  if(op&&valido(c.reserva)&&d.fonteEscolhida==='reserva'){
   if(!valido(op.custoTotal))pendencias.push('desembolso_reserva_nao_determinado');
   else {reservaApos=Math.round((c.reserva-op.custoTotal)*100)/100;
    if(reservaApos<0)pendencias.push('reserva_insuficiente_para_desembolso');}
  }
  if(d.fonteEscolhida==='sem_desembolso'&&op&&valido(op.custoTotal)&&op.custoTotal>0)pendencias.push('fonte_incompativel_com_custo');
  resultados.push({id:x.id??null,mes:x.mes??null,necessidade:d.necessidadeVerificada??null,
   fonte:d.fonteEscolhida??null,reservaAntes:valido(c.reserva)?c.reserva:null,
   reservaApos,pronta:pendencias.length===0,pendencias,notaIndividual:null});
 }
 return {etapa:101,carater:'evidencia_sem_pontos',resultados,
  prontas:resultados.filter(r=>r.pronta).length,
  aviso:'Necessidade, fonte e reserva são evidências para análise contextual; não geram pontuação automática.'};
}


// Etapa 102: conciliação de evidências, sem pontuar dados ausentes.
// Não considerar pronta uma decisão apenas porque o custo e a capacidade foram analisados.
function conciliarEvidenciasEtapa102V120(escolhas=[]){
 const custos=consolidarEvidenciasAlternativasEtapa100V120(escolhas).resultados;
 const necessidades=diagnosticarNecessidadeReservaEtapa101V120(escolhas).resultados;
 const chave=r=>JSON.stringify([r.id??null,r.mes??null]);
 const mapa=new Map();
 for(const r of necessidades){
  const k=chave(r);
  if(!mapa.has(k))mapa.set(k,[]);
  mapa.get(k).push(r);
 }
 const contagemCustos=new Map();
 for(const c of custos){const k=chave(c);contagemCustos.set(k,(contagemCustos.get(k)||0)+1);}
 const resultados=custos.map(c=>{
  const candidatos=mapa.get(chave(c))||[];
  const n=candidatos.length===1?candidatos[0]:null;
  const pendencias=[...(c.pendencias||[]),...(n?.pendencias||['necessidade_reserva_sem_registro'])];
  if(contagemCustos.get(chave(c))>1||candidatos.length>1)pendencias.push('decisao_duplicada_na_conciliacao');
  const unicas=[...new Set(pendencias)];
  return {id:c.id,mes:c.mes,custoComparativo:c.custoComparativo,
   capacidadeNoMomento:c.capacidadeNoMomento,necessidade:n?.necessidade??null,
   reservaAntes:n?.reservaAntes??null,reservaApos:n?.reservaApos??null,
   evidenciasCompletas:unicas.length===0,pendencias:unicas,
   notaIndividual:null,nota70Candidata:null};
 });
 return {etapa:102,carater:'conciliacao_experimental_sem_pontos',resultados,
  completas:resultados.filter(r=>r.evidenciasCompletas).length,
  aviso:'Completude documental não prova decisão responsável. Sem nota automática até validar a rubrica contextual.'};
}


// Etapa 103: integridade de chaves e cobertura das escolhas na conciliação.
// Uma decisão duplicada não pode ser usada duas vezes nem apagada por um Map.
function auditarIntegridadeConciliacaoEtapa103V120(escolhas=[]){
 const lista=Array.isArray(escolhas)?escolhas:[];
 const aplicaveis=lista.filter(x=>x?.tipo==='acontecimento'||x?.tipo==='viagem');
 const conciliacao=conciliarEvidenciasEtapa102V120(lista);
 const contagem=new Map(),pendencias=[];
 for(const x of aplicaveis){
  if(x.id===null||x.id===undefined||String(x.id).trim()===''||!Number.isInteger(x.mes)||x.mes<1||x.mes>6){
   pendencias.push({id:x.id??null,mes:x.mes??null,codigo:'identificador_ou_mes_invalido'});
   continue;
  }
  const chave=JSON.stringify([x.id,x.mes]);
  contagem.set(chave,(contagem.get(chave)||0)+1);
 }
 for(const [chave,n] of contagem){
  if(n>1)pendencias.push({chave,codigo:'decisao_duplicada',ocorrencias:n});
 }
 if(conciliacao.resultados.length!==aplicaveis.length){
  pendencias.push({codigo:'cobertura_incompleta',esperadas:aplicaveis.length,obtidas:conciliacao.resultados.length});
 }
 return {etapa:103,aplicaveis:aplicaveis.length,conciliadas:conciliacao.resultados.length,
  integridadeAprovada:pendencias.length===0,pendencias,
  nota70Candidata:null,aviso:'Integridade da trilha não equivale a mérito financeiro. Nenhuma nota atribuída.'};
}


// Etapa 106: quantificação verificável da diferença de custo entre opções equivalentes.
// Não transforma economia em nota dos 70 pontos sem rubrica contextual completa.
function quantificarDiferencaCustosEtapa106V120(escolhas=[]){
 const lista=Array.isArray(escolhas)?escolhas:[];
 const auditoria=auditarIntegridadeConciliacaoEtapa103V120(lista);
 const contagens=new Map();
 for(const x of lista){const k=JSON.stringify([x?.id,x?.mes]);contagens.set(k,(contagens.get(k)||0)+1);}
 const resultados=[];
 const numero=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
 for(const x of lista){
  if(x?.tipo!=='acontecimento'&&x?.tipo!=='viagem')continue;
  const d=x.detalhes||{},c=d.contextoNoMomento||{},k=JSON.stringify([x.id,x.mes]);
  const r={id:x.id??null,mes:x.mes??null,estado:'nao_comprovado',diferencaReais:null,
   menorCusto:null,custoEscolhido:null,notaIndividual:null,nota70Candidata:null,pendencias:[]};
  if(contagens.get(k)!==1||!Number.isInteger(x.mes)||x.mes<1||x.mes>6||x.id===null||x.id===undefined||String(x.id).trim()==='')r.pendencias.push('chave_invalida_ou_duplicada');
  const ops=Array.isArray(d.alternativasDisponiveis)?d.alternativasDisponiveis:[];
  const escolhidas=ops.filter(o=>o?.id===d.alternativaEscolhida);
  if(escolhidas.length!==1)r.pendencias.push('alternativa_escolhida_ambigua');
  const o=escolhidas[0];
  const valido=a=>a&&numero(a.custoTotal)&&numero(a.valorMensal)&&Number.isInteger(a.quantidadeParcelas)&&a.quantidadeParcelas>0&&Math.abs(a.custoTotal-a.valorMensal*a.quantidadeParcelas)<=0.01;
  if(!valido(o)||typeof o?.grupoComparavel!=='string'||!o.grupoComparavel.trim())r.pendencias.push('contrato_ou_equivalencia_nao_comprovado');
  if(!numero(c.renda)||!numero(c.despesas)||!numero(c.parcelasExistentes))r.pendencias.push('margem_nao_comprovada');
  if(r.pendencias.length){resultados.push(r);continue;}
  const margem=c.renda-c.despesas-c.parcelasExistentes;
  const equivalentes=ops.filter(a=>valido(a)&&a.grupoComparavel===o.grupoComparavel&&a.quantidadeParcelas===o.quantidadeParcelas&&a.valorMensal<=margem);
  if(o.valorMensal>margem||equivalentes.length<2||new Set(equivalentes.map(a=>String(a.id))).size!==equivalentes.length){r.pendencias.push('comparacao_viavel_insuficiente');resultados.push(r);continue;}
  const menor=Math.min(...equivalentes.map(a=>a.custoTotal));
  r.menorCusto=menor;r.custoEscolhido=o.custoTotal;
  r.diferencaReais=Math.round((o.custoTotal-menor)*100)/100;
  r.estado=r.diferencaReais<=0.01?'menor_custo':'custo_adicional_comprovado';
  resultados.push(r);
 }
 return {etapa:106,carater:'diferenca_objetiva_sem_nota',integridadeGeral:auditoria.integridadeAprovada,
  resultados,comparacoesComprovadas:resultados.filter(r=>r.estado!=='nao_comprovado').length,
  aviso:'Diferença contratual não equivale a avaliação integral da escolha; não atribuir nota de 70 pontos.'};
}


// Etapa 107: parecer de sustentabilidade verificável, sem atribuição de pontos.
// Não pressupõe que uma compra é necessária apenas por ser financeiramente possível.
function diagnosticarSustentabilidadeEtapa107V120(escolhas=[]){
 const comparacao=quantificarDiferencaCustosEtapa106V120(escolhas);
 const mapa=new Map();
 for(const r of comparacao.resultados){
  const k=JSON.stringify([r.id,r.mes]);
  if(!mapa.has(k))mapa.set(k,[]);
  mapa.get(k).push(r);
 }
 const resultados=[];
 for(const x of (Array.isArray(escolhas)?escolhas:[])){
  if(x?.tipo!=='acontecimento'&&x?.tipo!=='viagem')continue;
  const k=JSON.stringify([x.id,x.mes]), d=x.detalhes||{},c=d.contextoNoMomento||{};
  const op=(Array.isArray(d.alternativasDisponiveis)?d.alternativasDisponiveis:[]).filter(a=>a?.id===d.alternativaEscolhida);
  const anterior=mapa.get(k)||[];
  const pendencias=[...(anterior.length===1?anterior[0].pendencias:['chave_duplicada'])];
  const n=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
  let margemAntes=null,margemDepois=null;
  if(op.length!==1)pendencias.push('escolha_ambigua');
  if(!n(c.renda)||!n(c.despesas)||!n(c.parcelasExistentes))pendencias.push('contexto_financeiro_incompleto');
  else margemAntes=Math.round((c.renda-c.despesas-c.parcelasExistentes)*100)/100;
  if(op.length===1&&n(op[0].valorMensal)&&margemAntes!==null){
   margemDepois=Math.round((margemAntes-op[0].valorMensal)*100)/100;
  }else pendencias.push('desembolso_nao_comprovado');
  const situacao=margemDepois===null?'indeterminada':margemDepois<0?'compromisso_acima_da_margem':'compromisso_cabe_na_margem_atual';
  if(!Object.prototype.hasOwnProperty.call(d,'necessidade')&&!Object.prototype.hasOwnProperty.call(d,'finalidade'))pendencias.push('necessidade_nao_documentada');
  resultados.push({id:x.id,mes:x.mes,margemAntes,margemDepois,situacao,
   custoComparativo:anterior.length===1?anterior[0].diferencaReais:null,
   pendencias:[...new Set(pendencias)],notaIndividual:null,nota70Candidata:null});
 }
 return {etapa:107,carater:'parecer_experimental_sem_pontuacao',resultados,
  aviso:'Margem mensal isolada não prova sustentabilidade ao longo dos seis meses nem necessidade da compra.'};
}

// Etapa 108: projeção temporal por decisão, sem assumir renda futura constante.
function diagnosticarVencimentosEtapa108V120(escolhas=[]){
 const proj=projetarCompromissosEtapa93V120(escolhas).resultados;
 const contagens=new Map();
 for(const x of (Array.isArray(escolhas)?escolhas:[])){
  if(x?.tipo!=='acontecimento'&&x?.tipo!=='viagem')continue;
  const k=JSON.stringify([x.id,x.mes]);contagens.set(k,(contagens.get(k)||0)+1);
 }
 const resultados=proj.map(r=>{
  const pendencias=[...(r.faltantes||[])];
  if(contagens.get(JSON.stringify([r.id,r.mes]))!==1||r.id===null||!Number.isInteger(r.mes)||r.mes<1||r.mes>6)pendencias.push('identificacao_ambigua');
  const dentro=r.vencimentosDuranteJogo||[],fora=r.vencimentosAposJogo||[];
  const todos=[...dentro,...fora];
  if(todos.some(v=>!Number.isInteger(v.mes)||v.mes<r.mes||typeof v.valor!=='number'||!Number.isFinite(v.valor)||v.valor<0))pendencias.push('vencimento_invalido');
  const total=(a)=>Math.round(a.reduce((s,v)=>s+v.valor,0)*100)/100;
  const capacidade=r.margemAntesDaEscolha;
  return {id:r.id,mes:r.mes,modalidade:r.modalidade,quantidadeDurante:dentro.length,quantidadeDepois:fora.length,
   totalDurante:total(dentro),totalDepois:total(fora),ultimoVencimento:todos.length?Math.max(...todos.map(v=>v.mes)):null,
   margemAtual:capacidade,parcelasAcimaMargemAtual:typeof capacidade==='number'?todos.filter(v=>v.valor>capacidade).map(v=>v.mes):[],
   pendencias:[...new Set(pendencias)],notaIndividual:null,
   observacao:'Projecao contratual, nao comprovacao de pagamentos nem de renda futura.'};
 });
 return {etapa:108,carater:'projecao_temporal_sem_nota',resultados,
 aviso:'Vencimentos apos o sexto mes sao compromissos futuros, nao pagamentos observados. Nenhuma nota foi atribuida.'};
}


// Etapa 110: capacidade projetada por vencimento com dados mensais explícitos.
// Sem extrapolar automaticamente a margem atual, e sem pontuação arbitrária.
function avaliarCapacidadeTemporalEtapa110V120(escolhas=[], margensPorMes={}){
 const lista=Array.isArray(escolhas)?escolhas:[];
 const contagens=new Map();
 for(const x of lista){const k=JSON.stringify([x?.id,x?.mes]);contagens.set(k,(contagens.get(k)||0)+1);}
 const proj=projetarCompromissosEtapa93V120(lista).resultados;
 const resultados=[];
 const numero=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
 for(const r of proj){
  const k=JSON.stringify([r.id,r.mes]);
  const pendencias=[...(r.faltantes||[])];
  if(contagens.get(k)!==1||r.id==null||!Number.isInteger(r.mes)||r.mes<1||r.mes>6)pendencias.push('identificacao_ambigua');
  const vencimentos=[...(r.vencimentosDuranteJogo||[]),...(r.vencimentosAposJogo||[])];
  const porMes=[];
  for(const v of vencimentos){
   const margem=margensPorMes?.[v.mes];
   if(!numero(margem))pendencias.push('margem_mes_'+v.mes+'_nao_comprovada');
   porMes.push({mes:v.mes,valor:v.valor,margemComprovada:numero(margem)?margem:null,
    cabe:numero(margem)&&numero(v.valor)?v.valor<=margem:null});
  }
  // Margem mensal informada deve estar livre de outros compromissos existentes,
  // mas ainda não descontar a própria parcela avaliada.
  const valido=pendencias.length===0;
  resultados.push({id:r.id,mes:r.mes,modalidade:r.modalidade,porMes,
   capacidadeComprovada:valido?porMes.every(v=>v.cabe===true):null,
   pendencias:[...new Set(pendencias)],notaIndividual:null});
 }
 return {etapa:110,carater:'avaliacao_temporal_sem_nota',resultados,
  aviso:'As margens mensais devem ser documentadas e excluir a parcela analisada. Capacidade não prova mérito pedagógico; sem nota automática.'};
}

// Etapa 111: integração segura de evidências temporais. Não fabrica margens futuras.
function integrarCapacidadeTemporalEtapa111V120(escolhas=[], margensDocumentadas=null){
 const entrada=(margensDocumentadas && typeof margensDocumentadas==='object' && !Array.isArray(margensDocumentadas))?margensDocumentadas:{};
 const diagnostico=avaliarCapacidadeTemporalEtapa110V120(escolhas,entrada);
 const resultados=diagnostico.resultados.map(r=>({
  ...r, evidenciaMensalCompleta:r.pendencias.length===0,
  riscoTemporalComprovado:r.capacidadeComprovada===false,
  aptaParaNota:r.pendencias.length===0 && r.capacidadeComprovada!==null,
  notaIndividual:null
 }));
 return {etapa:111,carater:'integracao_experimental_sem_nota',resultados,
  margensFornecidas:Object.keys(entrada).length,
  aviso:'Somente margens explicitamente documentadas. Nenhuma margem futura foi inferida e nenhuma nota atribuída.'};
}


// Etapa 112: capacidade conjunta de compromissos novos no mesmo mês.
// A margem de referência deve excluir TODOS os compromissos presentes nesta avaliação;
// não utilizar a margem já descontada de uma parcela, nem inferir meses ausentes.
function avaliarCapacidadeConjuntaEtapa112V120(escolhas=[], margensBasePorMes={}){
 const lista=Array.isArray(escolhas)?escolhas:[];
 const proj=projetarCompromissosEtapa93V120(lista).resultados;
 const contagens=new Map();
 for(const x of lista){const k=JSON.stringify([x?.id,x?.mes]);contagens.set(k,(contagens.get(k)||0)+1);}
 const pendencias=[]; const compromissos=new Map();
 const numero=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
 for(const r of proj){
  const chave=JSON.stringify([r.id,r.mes]);
  if(r.id==null||!Number.isInteger(r.mes)||r.mes<1||r.mes>6||contagens.get(chave)!==1)pendencias.push('identificacao_ambigua');
  if((r.faltantes||[]).length)pendencias.push('projecao_incompleta');
  for(const v of [...(r.vencimentosDuranteJogo||[]),...(r.vencimentosAposJogo||[])]){
   if(!Number.isInteger(v.mes)||v.mes<1||!numero(v.valor)){pendencias.push('vencimento_invalido');continue;}
   if(!compromissos.has(v.mes))compromissos.set(v.mes,[]);
   compromissos.get(v.mes).push({id:r.id,mesEscolha:r.mes,valor:v.valor});
  }
 }
 const porMes=[...compromissos].sort((a,b)=>a[0]-b[0]).map(([mes,itens])=>{
  const total=Math.round(itens.reduce((a,v)=>a+v.valor,0)*100)/100;
  const margem=margensBasePorMes?.[mes];
  if(!numero(margem))pendencias.push('margem_base_mes_'+mes+'_nao_documentada');
  return {mes,compromissos:itens,totalComprometido:total,margemBase:numero(margem)?margem:null,
   saldoProjetado:numero(margem)?Math.round((margem-total)*100)/100:null,
   cabeConjuntamente:numero(margem)?total<=margem:null};
 });
 const completas=pendencias.length===0;
 return {etapa:112,carater:'diagnostico_conjunto_sem_pontuacao',porMes,
  capacidadeConjuntaComprovada:completas?porMes.every(x=>x.cabeConjuntamente):null,
  pendencias:[...new Set(pendencias)],nota70Candidata:null,
  aviso:'Margem base deve excluir todas as parcelas aqui analisadas. Não prova pagamentos realizados nem determina nota.'};
}


// Etapa 113: cobertura e integridade da capacidade conjunta.
// Não confundir ausência de parcelas com sustentabilidade comprovada de todas as decisões.
function auditarCoberturaCapacidadeConjuntaEtapa113V120(escolhas=[],margensBasePorMes={}){
 const lista=Array.isArray(escolhas)?escolhas:[];
 const tiposProjetaveis=new Set(['acontecimento','viagem']);
 const elegiveis=lista.filter(x=>tiposProjetaveis.has(x?.tipo));
 const diagnostico=avaliarCapacidadeConjuntaEtapa112V120(lista,margensBasePorMes);
 const proj=projetarCompromissosEtapa93V120(lista).resultados;
 const chaves=new Map();
 for(const x of elegiveis){const k=JSON.stringify([x?.id,x?.mes]);chaves.set(k,(chaves.get(k)||0)+1);}
 const pendencias=[...diagnostico.pendencias];
 if(elegiveis.length===0)pendencias.push('nenhuma_decisao_financeira_elegivel');
 if(proj.length!==elegiveis.length)pendencias.push('cobertura_projecao_incompleta');
 if([...chaves.values()].some(n=>n!==1))pendencias.push('decisoes_duplicadas');
 const porDecisao=proj.map(r=>{
  const chave=JSON.stringify([r.id,r.mes]);
  const meses=[...(r.vencimentosDuranteJogo||[]),...(r.vencimentosAposJogo||[])].map(v=>v.mes);
  const duplicada=chaves.get(chave)!==1;
  const faltantes=[...(r.faltantes||[])];
  if(duplicada)faltantes.push('identificacao_ambigua');
  if(r.modalidade==='avista')faltantes.push('pagamento_a_vista_nao_coberto_por_parcelas');
  if(r.modalidade==='sem_pagamento_imediato')faltantes.push('decisao_sem_parcelas_exige_analise_contextual');
  return {id:r.id,mes:r.mes,modalidade:r.modalidade,mesesVencimento:meses,
   coberturaParcelas:meses.length>0&&faltantes.length===0,pendencias:[...new Set(faltantes)],notaIndividual:null};
 });
 const completa=pendencias.length===0&&porDecisao.every(r=>r.coberturaParcelas);
 return {etapa:113,carater:'auditoria_cobertura_sem_nota',quantidadeDecisoes:elegiveis.length,
  quantidadeProjetadas:proj.length,porDecisao,diagnosticoConjunto:diagnostico,
  coberturaCompleta:completa,capacidadeConjuntaComprovada:completa?diagnostico.capacidadeConjuntaComprovada:null,
  pendencias:[...new Set([...pendencias,...porDecisao.flatMap(r=>r.pendencias)])],nota70Candidata:null,
  aviso:'Capacidade conjunta apenas de parcelas; compras a vista e escolhas sem parcelas requerem avaliação própria. Não atribui nota.'};
}


// Etapa 114: concilia cobertura financeira e alternativas, sem inventar nota.
// Chave composta id+mes e dados faltantes são tratados explicitamente.
function conciliarAlternativasCapacidadeEtapa114V120(escolhas=[],margensBasePorMes={}){
 const lista=Array.isArray(escolhas)?escolhas:[];
 const auditoria=auditarDecisoesContextuaisV120(lista);
 const cobertura=auditarCoberturaCapacidadeConjuntaEtapa113V120(lista,margensBasePorMes);
 const contagens=new Map();
 for(const x of lista){if(!x||typeof x!=='object')continue; const k=JSON.stringify([x.id,x.mes]);contagens.set(k,(contagens.get(k)||0)+1);}
 const porChave=new Map(cobertura.porDecisao.map(x=>[JSON.stringify([x.id,x.mes]),x]));
 const porDecisao=[];
 const pendencias=new Set([...auditoria.pendencias,...cobertura.pendencias]);
 for(const x of lista){
  if(!x||typeof x!=='object'||new Set(['orcamento','pagamento-atraso','renegociacao-essenciais']).has(x.tipo))continue;
  const chave=JSON.stringify([x.id,x.mes]);
  const faltantes=[];
  if(contagens.get(chave)!==1)faltantes.push('chave_id_mes_duplicada');
  const detalhes=x.detalhes||{};
  const alternativas=detalhes.alternativasDisponiveis;
  if(!Array.isArray(alternativas)||alternativas.length<2)faltantes.push('alternativas_insuficientes');
  if(!alternativas?.some(a=>a?.id===detalhes.alternativaEscolhida))faltantes.push('escolha_nao_encontrada');
  if(!detalhes.contextoNoMomento||typeof detalhes.contextoNoMomento!=='object')faltantes.push('contexto_nao_documentado');
  const capacidade=porChave.get(chave);
  if(x.tipo==='acontecimento'||x.tipo==='viagem'){
   if(!capacidade)faltantes.push('sem_projecao_financeira');
   else { faltantes.push(...capacidade.pendencias); for(const mes of capacidade.mesesVencimento||[]){ const margem=margensBasePorMes?.[mes]; if(typeof margem!=='number'||!Number.isFinite(margem)||margem<0)faltantes.push('margem_base_mes_'+mes+'_nao_documentada'); } }
  }else faltantes.push('tipo_exige_avaliacao_contextual_especifica');
  for(const f of faltantes)pendencias.add(f);
  porDecisao.push({id:x.id??null,mes:x.mes??null,tipo:x.tipo??null,
   modalidade:capacidade?.modalidade??null,
   capacidadeParcelasDocumentada:capacidade?.coberturaParcelas??false,
   evidenciasSuficientes: faltantes.length===0,pendencias:[...new Set(faltantes)],notaIndividual:null});
 }
 if(!porDecisao.length)pendencias.add('nenhuma_decisao_avaliavel');
 return {etapa:114,carater:'conciliacao_experimental_sem_nota',porDecisao,
  quantidadeDecisoes:porDecisao.length,quantidadeComEvidencia:porDecisao.filter(x=>x.evidenciasSuficientes).length,
  capacidadeConjuntaComprovada:cobertura.capacidadeConjuntaComprovada,
  pendencias:[...pendencias].sort(),nota70Candidata:null,
  aviso:'Cobertura de parcelas não equivale a mérito da decisão. Pagamento à vista, alternativas sem parcelas e necessidade devem ser avaliados separadamente.'};
}


// Etapa 115: matriz de evidências por decisão. Não converte viabilidade em mérito.
function matrizEvidenciasAlternativasEtapa115V120(escolhas=[],margensBasePorMes={}){
 const lista=Array.isArray(escolhas)?escolhas:[];
 const conciliacao=conciliarAlternativasCapacidadeEtapa114V120(lista,margensBasePorMes);
 const porChave=new Map(conciliacao.porDecisao.map(d=>[JSON.stringify([d.id,d.mes]),d]));
 const decisoes=[];
 for(const x of lista){
  if(!x||['orcamento','pagamento-atraso','renegociacao-essenciais'].includes(x.tipo))continue;
  const d=x.detalhes||{}, base=porChave.get(JSON.stringify([x.id,x.mes]));
  const alternativas=Array.isArray(d.alternativasDisponiveis)?d.alternativasDisponiveis:[];
  const escolhida=alternativas.find(a=>a?.id===d.alternativaEscolhida);
  const contexto=d.contextoNoMomento||{};
  const evidencias={
   alternativasComparaveis:alternativas.length>=2&&!!escolhida,
   custoComparavel:alternativas.length>=2&&alternativas.every(a=>Number.isFinite(a?.custoTotal)&&a.custoTotal>=0),
   capacidadeParcelas:base?.evidenciasSuficientes===true&&base?.modalidade!=='avista',
   contextoRendaDespesas:Number.isFinite(contexto.renda)&&Number.isFinite(contexto.despesas)&&contexto.renda>=0&&contexto.despesas>=0,
   necessidadeJustificada:typeof d.justificativaNecessidade==='string'&&d.justificativaNecessidade.trim().length>0,
   reservaDocumentada:Number.isFinite(d.reservaDisponivel)&&d.reservaDisponivel>=0,
   avaliacaoPedagogicaDocumentada:Number.isFinite(d.avaliacaoAlternativa?.nota)&&d.avaliacaoAlternativa.nota>=0&&d.avaliacaoAlternativa.nota<=100&&typeof d.avaliacaoAlternativa?.origem==='string'&&!!d.avaliacaoAlternativa.origem.trim()
  };
  const pendencias=[...(base?.pendencias||[])];
  if(!evidencias.custoComparavel)pendencias.push('custos_das_alternativas_incompletos');
  if(!evidencias.contextoRendaDespesas)pendencias.push('renda_despesas_nao_documentadas');
  if(!evidencias.necessidadeJustificada)pendencias.push('necessidade_sem_justificativa');
  if(!evidencias.reservaDocumentada)pendencias.push('reserva_nao_documentada');
  const menorCusto=evidencias.custoComparavel?Math.min(...alternativas.map(a=>a.custoTotal)):null;
  const custoExtra=evidencias.custoComparavel?Math.round((escolhida.custoTotal-menorCusto)*100)/100:null;
  decisoes.push({id:x.id??null,mes:x.mes??null,tipo:x.tipo??null,evidencias,
   custoEscolhido:evidencias.custoComparavel?escolhida.custoTotal:null,
   menorCustoDisponivel:menorCusto,custoExtraComparadoAoMenor:custoExtra,
   // O menor custo pode corresponder a adiar/não comprar; não implica opção superior.
   pendencias:[...new Set(pendencias)],notaIndividual:null});
 }
 return {etapa:115,decisoes,quantidade:decisoes.length,
  quantidadeComCustosComparaveis:decisoes.filter(d=>d.evidencias.custoComparavel).length,
  nota70Candidata:null,
  aviso:'Diferença de custos é descritiva, não penalidade. Necessidade, reserva e alternativas exigem julgamento contextual; notas não presumidas.'};
}

// Etapa 116: valida notas fundamentadas por decisão contra evidências e duplicações.
// Não cria nota a partir de custo, margem ou simples viabilidade.
function validarNotasFundamentadasEtapa116V120(escolhas=[],margensBasePorMes={}){
 const lista=Array.isArray(escolhas)?escolhas:[];
 const matriz=matrizEvidenciasAlternativasEtapa115V120(lista,margensBasePorMes);
 const chaves=new Map();
 for(const x of lista){if(!x||['orcamento','pagamento-atraso','renegociacao-essenciais'].includes(x.tipo))continue;
  const chave=JSON.stringify([x.id,x.mes]);chaves.set(chave,(chaves.get(chave)||0)+1);}
 const resultados=[];
 for(const e of matriz.decisoes){
  const chave=JSON.stringify([e.id,e.mes]);
  const x=lista.find(v=>v&&JSON.stringify([v.id,v.mes])===chave);
  const a=x?.detalhes?.avaliacaoAlternativa||{};
  const pendencias=[];
  if(chaves.get(chave)!==1)pendencias.push('decisao_duplicada');
  if(!Number.isFinite(a.nota)||a.nota<0||a.nota>100)pendencias.push('nota_invalida_ou_ausente');
  if(typeof a.origem!=='string'||!a.origem.trim())pendencias.push('origem_ausente');
  if(typeof a.justificativa!=='string'||!a.justificativa.trim())pendencias.push('justificativa_da_nota_ausente');
  // Não converter evidência faltante em nota zero; sinalizar separadamente.
  if(!e.evidencias.alternativasComparaveis)pendencias.push('alternativas_nao_comparaveis');
  if(!e.evidencias.custoComparavel)pendencias.push('custos_incompletos');
  if(!e.evidencias.contextoRendaDespesas)pendencias.push('contexto_financeiro_incompleto');
  if(!e.evidencias.necessidadeJustificada)pendencias.push('necessidade_nao_justificada');
  if(!e.evidencias.reservaDocumentada)pendencias.push('reserva_nao_documentada');
  // Uma nota fundamentada ainda exige capacidade contextual documentada, se parcelada.
  if(e.evidencias.capacidadeParcelas!==true&&e.pendencias.some(p=>p.includes('margem')||p.includes('projecao')||p.includes('capacidade')))pendencias.push('capacidade_parcelas_nao_comprovada');
  resultados.push({id:e.id,mes:e.mes,notaIndividual:pendencias.length?null:a.nota,
   origem:typeof a.origem==='string'?a.origem:null,
   justificativa:typeof a.justificativa==='string'?a.justificativa:null,
   pendencias:[...new Set(pendencias)]});
 }
 const completo=resultados.length>0&&resultados.every(r=>r.notaIndividual!==null);
 const media=completo?resultados.reduce((s,r)=>s+r.notaIndividual,0)/resultados.length:null;
 return {etapa:116,carater:'candidato_experimental_nao_integrado',quantidade:resultados.length,
  avaliadas:resultados.filter(r=>r.notaIndividual!==null).length,
  decisoes:resultados,mediaIndividual:media,nota70Candidata:completo?Math.round(media*70)/100:null,
  prontoParaValidacao:completo,pendencias:[...new Set(resultados.flatMap(r=>r.pendencias))].sort(),
  aviso:'Somente notas documentadas por avaliador identificável e justificativa são agregadas. Não há atribuição automática de mérito nem alteração da pontuação oficial.'};
}


// Etapa 117: auditoria automática de coerência da avaliação pedagógica.
// Não atribui pontos: identifica contradições verificáveis e pede fundamentação.
function auditarCoerenciaNotasEtapa117V120(escolhas=[],margensBasePorMes={}){
 const lista=Array.isArray(escolhas)?escolhas:[];
 const val=validarNotasFundamentadasEtapa116V120(lista,margensBasePorMes);
 const conjunta=avaliarCapacidadeConjuntaEtapa112V120(lista,margensBasePorMes);
 const matriz=matrizEvidenciasAlternativasEtapa115V120(lista,margensBasePorMes);
 const contagem=new Map();
 const projPorChave=new Map(projetarCompromissosEtapa93V120(lista).resultados.map(r=>[JSON.stringify([r.id,r.mes]),r]));
 for(const x of lista){if(x&&x.tipo!=='orcamento'&&x.tipo!=='pagamento-atraso'&&x.tipo!=='renegociacao-essenciais'){
  const k=JSON.stringify([x.id,x.mes]);contagem.set(k,(contagem.get(k)||0)+1);
 }}
 const porDecisao=matriz.decisoes.map(e=>{
  const k=JSON.stringify([e.id,e.mes]);const x=lista.find(v=>v&&JSON.stringify([v.id,v.mes])===k);
  const alt=x?.detalhes?.alternativasDisponiveis||[];
  const escolhida=alt.find(a=>a?.id===x?.detalhes?.alternativaEscolhida);
  const avaliacao=x?.detalhes?.avaliacaoAlternativa||{};
  const alertas=[];
  if(contagem.get(k)!==1)alertas.push('identificacao_duplicada');
  if(!escolhida)alertas.push('alternativa_escolhida_ausente');
  // Alertas financeiros pertencem apenas a escolhas cujas parcelas vencem no mês afetado.
  // Compras à vista e adiamentos não podem herdar alertas de parcelas alheias.
  const proj=projPorChave.get(k);
  const vencimentos=[...(proj?.vencimentosDuranteJogo||[]),...(proj?.vencimentosAposJogo||[])];
  const mesesDaEscolha=new Set(vencimentos.map(v=>v.mes));
  const mesesAfetados=conjunta.porMes.filter(m=>mesesDaEscolha.has(m.mes));
  if(mesesAfetados.some(m=>m.cabeConjuntamente===false))alertas.push('capacidade_conjunta_insuficiente_requer_justificativa');
  if(vencimentos.length>0&&(mesesAfetados.length!==mesesDaEscolha.size||mesesAfetados.some(m=>m.cabeConjuntamente===null)||(proj?.faltantes||[]).length>0))alertas.push('capacidade_conjunta_inconclusiva');
  if(e.custoExtraComparadoAoMenor!==null&&e.custoExtraComparadoAoMenor>0)alertas.push('custo_adicional_requer_analise_de_beneficio');
  if(!e.evidencias.necessidadeJustificada)alertas.push('necessidade_nao_documentada');
  if(!e.evidencias.reservaDocumentada)alertas.push('reserva_nao_documentada');
  if(Number.isFinite(avaliacao.nota)&&avaliacao.nota===100&&alertas.some(a=>a.includes('insuficiente')||a.includes('inconclusiva')))
   alertas.push('nota_maxima_exige_revisao_de_capacidade');
  return {id:e.id,mes:e.mes,notaDocumentada:Number.isFinite(avaliacao.nota)?avaliacao.nota:null,
   custoAdicional:e.custoExtraComparadoAoMenor,mesesParcelas:[...mesesDaEscolha].sort((a,b)=>a-b),alertas:[...new Set(alertas)],
   // Alertas não são penalidades; inclusive a opção mais cara pode ser adequada.
   notaAutomatica:null};
 });
 return {etapa:117,carater:'auditoria_de_coerencia_sem_pontuacao_automatica',
  porDecisao,capacidadeConjuntaComprovada:conjunta.capacidadeConjuntaComprovada,
  validacaoNotasEtapa116:val.prontoParaValidacao,
  nota70Candidata:val.nota70Candidata,
  quantidadeAlertas:porDecisao.reduce((n,d)=>n+d.alertas.length,0),
  aviso:'Alertas solicitam revisão pedagógica e não alteram notas. Não há notas automáticas de mérito.'};
}

// Etapa 118: auditoria de cobertura de alertas por decisão, sem nota automática.
function auditarEscopoAlertasEtapa118V120(escolhas=[],margensBasePorMes={}){
 const auditoria=auditarCoerenciaNotasEtapa117V120(escolhas,margensBasePorMes);
 return {etapa:118,porDecisao:auditoria.porDecisao,quantidadeAlertas:auditoria.quantidadeAlertas,
  nota70Candidata:auditoria.nota70Candidata,
  aviso:'Alertas de capacidade conjunta aplicam-se somente às escolhas parceladas que participam dos vencimentos afetados; não geram penalidades automáticas.'};
}


// Etapa 119: verifica desembolso imediato sem confundir caixa livre com margem futura.
// Não pontua e não considera automaticamente que o jogador usou a reserva.
function auditarDesembolsoImediatoEtapa119V120(escolhas=[]){
 const lista=Array.isArray(escolhas)?escolhas:[];
 const resultados=[];
 const contagens=new Map();
 for(const e of lista){if(!e||['orcamento','pagamento-atraso','renegociacao-essenciais'].includes(e.tipo))continue;
  const k=JSON.stringify([e.id,e.mes]);contagens.set(k,(contagens.get(k)||0)+1);}
 for(const e of lista){if(!e||['orcamento','pagamento-atraso','renegociacao-essenciais'].includes(e.tipo))continue;
  const d=e.detalhes||{},op=(d.alternativasDisponiveis||[]).find(a=>a&&a.id===d.alternativaEscolhida);
  const parcelas=op?.quantidadeParcelas;
  const pagamentoImediato=op&&Number.isFinite(op.custoTotal)&&op.custoTotal>=0&&(!Number.isInteger(parcelas)||parcelas<=0);
  const livre=e.contextoAntes?.livre, reserva=e.contextoAntes?.reserva;
  const pendencias=[];
  if(contagens.get(JSON.stringify([e.id,e.mes]))!==1)pendencias.push('identificacao_duplicada');
  if(!op)pendencias.push('alternativa_sem_metadados');
  if(op&&Number.isInteger(parcelas)&&parcelas>0){resultados.push({id:e.id,mes:e.mes,modalidade:'parcelado',desembolsoImediato:null,livreDocumentado:Number.isFinite(livre)?livre:null,capacidadeCaixa:null,pendencias,notaAutomatica:null});continue;}
  if(!pagamentoImediato)pendencias.push('desembolso_imediato_nao_documentado');
  if(!Number.isFinite(livre)||livre<0)pendencias.push('caixa_livre_nao_documentado');
  const capacidade=pagamentoImediato&&Number.isFinite(livre)&&livre>=0?livre>=op.custoTotal:null;
  if(capacidade===false)pendencias.push('caixa_livre_insuficiente_requer_analise_de_reserva_ou_ajuste');
  resultados.push({id:e.id,mes:e.mes,modalidade:pagamentoImediato?'avista':'indeterminada',
   desembolsoImediato:pagamentoImediato?op.custoTotal:null,livreDocumentado:Number.isFinite(livre)?livre:null,
   reservaDocumentada:Number.isFinite(reserva)?reserva:null,capacidadeCaixa:capacidade,pendencias,notaAutomatica:null});
 }
 return {etapa:119,porDecisao:resultados,quantidade:resultados.length,
  aviso:'Compara compra à vista apenas com caixa livre documentado no momento; reserva não é usada automaticamente. Não calcula notas e não avalia compromissos parcelados.'};
}


// Etapa 120: concilia vencimentos projetados com baixas efetivamente registradas.
// Só os meses 1 a 6 possuem histórico observável; parcelas posteriores são projeções.
function conciliarParcelasPagasEtapa120V120(escolhas=[],historico=[]){
 const proj=projetarCompromissosEtapa93V120(escolhas);
 const meses=new Map(),pendencias=[];
 for(const h of Array.isArray(historico)?historico:[]){
  if(!Number.isInteger(h?.mes)||h.mes<1||h.mes>6){pendencias.push('mes_historico_invalido');continue;}
  if(meses.has(h.mes))pendencias.push('mes_historico_duplicado_'+h.mes);
  else meses.set(h.mes,h);
 }
 const esperados=new Map(),ids=new Set(),duplicados=new Set();
 for(const r of proj.resultados){
  const chave=JSON.stringify([r.id,r.mes]);
  if(ids.has(chave))duplicados.add(chave);
  ids.add(chave);
  for(const v of r.vencimentosDuranteJogo||[]){
   const k=JSON.stringify([r.id,v.mes]);
   esperados.set(k,(esperados.get(k)||0)+v.valor);
  }
 }
 const pagos=new Map(),pagamentosSemOrigem=[],pagamentosSemPrevisao=[];
 for(const [mes,h] of meses){
  if(!Array.isArray(h.parcelasBaixadasMes)){pendencias.push('baixas_nao_documentadas_mes_'+mes);continue;}
  for(const b of h.parcelasBaixadasMes){
   if(!b||b.mes!==mes||!Number.isFinite(b.valor)||b.valor<0){pendencias.push('baixa_invalida_mes_'+mes);continue;}
   if(b.origemEscolhaId===null||b.origemEscolhaId===undefined){pagamentosSemOrigem.push({mes,valor:b.valor,descricao:b.descricao||null});continue;}
   const k=JSON.stringify([b.origemEscolhaId,mes]);
   pagos.set(k,(pagos.get(k)||0)+b.valor);
  }
 }
 const porVencimento=[];
 for(const [k,previsto] of esperados){
  const [origemEscolhaId,mes]=JSON.parse(k),h=meses.get(mes);
  const pago=pagos.get(k)||0;
  let situacao='sem_historico';
  if(h&&Array.isArray(h.parcelasBaixadasMes)){
   const delta=Math.round((pago-previsto)*100)/100;
   situacao=Math.abs(delta)<=0.01?'conciliado':delta<0?'baixa_inferior_ao_previsto':'baixa_superior_ao_previsto';
  }
  porVencimento.push({origemEscolhaId,mes,previsto:Math.round(previsto*100)/100,pago:Math.round(pago*100)/100,situacao});
 }
 for(const [k,valor] of pagos){if(!esperados.has(k)){const [origemEscolhaId,mes]=JSON.parse(k);pagamentosSemPrevisao.push({origemEscolhaId,mes,valor:Math.round(valor*100)/100});}}
 const aposJogo=proj.resultados.flatMap(r=>(r.vencimentosAposJogo||[]).map(v=>({origemEscolhaId:r.id,mes:v.mes,previsto:v.valor,status:'projecao_nao_observada'})));
 const inconsistencias=porVencimento.filter(x=>x.situacao!=='conciliado');
 return {etapa:120,porVencimento,aposJogo,pagamentosSemOrigem,pagamentosSemPrevisao,
  escolhasDuplicadas:[...duplicados].map(x=>JSON.parse(x)),pendencias,
  conciliacaoCompleta:pendencias.length===0&&inconsistencias.length===0&&pagamentosSemOrigem.length===0&&pagamentosSemPrevisao.length===0&&duplicados.size===0&&proj.pendentes===0&&porVencimento.length>0,
  notaAutomatica:null,aviso:'Baixa registrada comprova registro de pagamento, não mérito da escolha. Ausência de histórico não comprova inadimplência; vencimentos após o mês 6 não são observados.'};
}


// Etapa 121: evidências de consequências observadas, sem inferir mérito nem inadimplência.
function evidenciasConsequenciasEtapa121V120(escolhas=[],historico=[]){
 const conciliacao=conciliarParcelasPagasEtapa120V120(escolhas,historico);
 const historicosValidos=(Array.isArray(historico)?historico:[]).filter(h=>Number.isInteger(h?.mes)&&h.mes>=1&&h.mes<=6);
 const contagensMes=new Map();
 for(const h of historicosValidos)contagensMes.set(h.mes,(contagensMes.get(h.mes)||0)+1);
 const porEscolha=[];
 for(const e of Array.isArray(escolhas)?escolhas:[]){
  const vencimentos=conciliacao.porVencimento.filter(v=>v.origemEscolhaId===e?.id);
  const futuros=conciliacao.aposJogo.filter(v=>v.origemEscolhaId===e?.id);
  const ambiguos=vencimentos.filter(v=>contagensMes.get(v.mes)>1);
  const observados=vencimentos.filter(v=>v.situacao!=='sem_historico'&&contagensMes.get(v.mes)===1);
  const faltantes=vencimentos.filter(v=>v.situacao==='sem_historico');
  const pendencias=[];
  if(conciliacao.escolhasDuplicadas.some(d=>d[0]===e?.id))pendencias.push('identificacao_de_escolha_duplicada');
  if(ambiguos.length)pendencias.push('historico_mensal_duplicado');
  if(faltantes.length)pendencias.push('pagamentos_sem_historico');
  if(vencimentos.length===0&&futuros.length===0)pendencias.push('sem_parcelas_rastreaveis_na_projecao');
  if(futuros.length)pendencias.push('parcelas_futuras_nao_observadas');
  if(conciliacao.pagamentosSemOrigem.length)pendencias.push('pagamentos_sem_origem_na_partida');
  const valores=observados.reduce((a,v)=>({previsto:a.previsto+v.previsto,registrado:a.registrado+v.pago}),{previsto:0,registrado:0});
  porEscolha.push({id:e?.id??null,mes:e?.mes??null,observados:observados.length,
   conciliados:observados.filter(v=>v.situacao==='conciliado').length,
   divergentes:observados.filter(v=>v.situacao!=='conciliado').length,
   semHistorico:faltantes.length,ambiguos:ambiguos.length,aposJogo:futuros.length,
   valoresObservados:{previsto:Math.round(valores.previsto*100)/100,registrado:Math.round(valores.registrado*100)/100},
   pendencias:[...new Set(pendencias)],notaConsequencias:null});
 }
 return {etapa:121,porEscolha,nota60Candidata:null,
  aviso:'Comprova apenas baixas internas registradas e divergências. Não classifica automaticamente ausência de baixa como inadimplência, nem atribui mérito a compras ou a pagamentos futuros.'};
}

// Etapa 122: distinguir liquidação interna do motor de comprovação externa.
// Não transforma ausência de evidência em inadimplência nem gera nota.
function auditarBaixasAutomaticasEtapa122V120(historico=[]){
 const porMes=[],pendencias=[];
 for(const h of Array.isArray(historico)?historico:[]){
  if(!Number.isInteger(h?.mes)||h.mes<1||h.mes>6){pendencias.push('mes_invalido');continue;}
  if(!Array.isArray(h.parcelasBaixadasMes)){porMes.push({mes:h.mes,estado:'sem_registro',automaticas:0,legadas:0,externas:0});continue;}
  let automaticas=0,legadas=0,externas=0;
  for(const b of h.parcelasBaixadasMes){
   if(!b||b.mes!==h.mes||!Number.isFinite(b.valor)||b.valor<0){pendencias.push('baixa_invalida_mes_'+h.mes);continue;}
   if(b.origemRegistro==='baixa_automatica_do_motor'&&b.confirmacaoExterna===false)automaticas++;
   else if(b.confirmacaoExterna===true&&typeof b.origemRegistro==='string'&&b.origemRegistro!=='baixa_automatica_do_motor')externas++;
   else legadas++;
  }
  porMes.push({mes:h.mes,estado:'registrado',automaticas,legadas,externas});
 }
 return {etapa:122,porMes,pendencias,notaAutomatica:null,
  aviso:'Baixas automáticas são lançamentos internos do jogo, não comprovantes bancários ou externos. Registros legados sem origem explícita permanecem indeterminados.'};
}

// Etapa 123: ensaio de seis meses com evidências registradas, sem pontuação presumida.
function simularEvidenciasSeisMesesEtapa123V120(escolhas=[],historico=[]){
 const meses=Array.from({length:6},(_,i)=>i+1);
 const historicos=Array.isArray(historico)?historico:[];
 const contagens=meses.map(m=>historicos.filter(h=>h?.mes===m).length);
 const conciliacao=conciliarParcelasPagasEtapa120V120(escolhas,historicos);
 const consequencias=evidenciasConsequenciasEtapa121V120(escolhas,historicos);
 const baixas=auditarBaixasAutomaticasEtapa122V120(historicos);
 const avisos=[];
 for(let i=0;i<6;i++){if(contagens[i]===0)avisos.push('historico_ausente_mes_'+meses[i]);if(contagens[i]>1)avisos.push('historico_duplicado_mes_'+meses[i]);}
 if(conciliacao.pagamentosSemOrigem.length)avisos.push('baixas_sem_origem');
 if(conciliacao.pagamentosSemPrevisao.length)avisos.push('baixas_sem_previsao');
 if(conciliacao.escolhasDuplicadas.length)avisos.push('escolhas_duplicadas');
 if(conciliacao.pendencias.length)avisos.push('pendencias_de_conciliacao');
 const observados=conciliacao.porVencimento.filter(v=>v.situacao!=='sem_historico');
 const conciliados=observados.filter(v=>v.situacao==='conciliado');
 const divergentes=observados.filter(v=>v.situacao!=='conciliado');
 const externos=baixas.porMes.reduce((n,m)=>n+m.externas,0);
 const automaticos=baixas.porMes.reduce((n,m)=>n+m.automaticas,0);
 const legados=baixas.porMes.reduce((n,m)=>n+m.legadas,0);
 const resumo={mesesComHistorico:contagens.filter(n=>n===1).length,mesesAusentes:contagens.filter(n=>n===0).length,mesesDuplicados:contagens.filter(n=>n>1).length,
  vencimentosObservados:observados.length,vencimentosConciliados:conciliados.length,vencimentosDivergentes:divergentes.length,
  vencimentosSemHistorico:conciliacao.porVencimento.filter(v=>v.situacao==='sem_historico').length,
  vencimentosAposJogo:conciliacao.aposJogo.length,baixasAutomaticas:automaticos,baixasLegadas:legados,baixasExternas:externos};
 return {etapa:123,resumo,avisos:[...new Set(avisos)],porEscolha:consequencias.porEscolha,nota60Candidata:null,nota1000Candidata:null,
  aviso:'Ensaio observacional dos seis meses: conciliação não comprova mérito, baixa automática não é comprovante externo, parcelas após mês 6 não são observadas.'};
}


// Etapa 124: integridade da trilha de escolhas realmente exportada pelo navegador.
// Evidência de vínculo, não julgamento pedagógico nem comprovação de pagamento.
function auditarVinculosPartidaEtapa124V120(escolhas=[],historico=[]){
 const es=Array.isArray(escolhas)?escolhas:[], hs=Array.isArray(historico)?historico:[];
 const alertas=[], porMes=[], ids=new Map(), mesesHistorico=new Map();
 for(const e of es){
  if(!e||typeof e.id!=='string'||!e.id.trim()){alertas.push({codigo:'escolha_sem_id',mes:e?.mes??null});continue;}
  if(ids.has(e.id))alertas.push({codigo:'id_escolha_duplicado',id:e.id,mes:e.mes});
  else ids.set(e.id,e);
  if(!Number.isInteger(e.mes)||e.mes<1||e.mes>6)alertas.push({codigo:'mes_escolha_invalido',id:e.id,mes:e.mes??null});
 }
 for(const h of hs){
  if(!Number.isInteger(h?.mes)||h.mes<1||h.mes>6){alertas.push({codigo:'mes_historico_invalido',mes:h?.mes??null});continue;}
  if(!mesesHistorico.has(h.mes))mesesHistorico.set(h.mes,[]);
  mesesHistorico.get(h.mes).push(h);
 }
 for(let mes=1;mes<=6;mes++){
  const registros=mesesHistorico.get(mes)||[], esperadas=es.filter(e=>e&&e.mes===mes&&typeof e.id==='string'&&e.id.trim()).map(e=>e.id);
  if(registros.length>1)alertas.push({codigo:'historico_duplicado',mes});
  const h=registros.length===1?registros[0]:null;
  if(!h){porMes.push({mes,estado:registros.length?'ambiguo':'ausente',escolhasEsperadas:esperadas.length});continue;}
  if(!Array.isArray(h.escolhasIds)){
   alertas.push({codigo:'vinculos_nao_registrados',mes});
   porMes.push({mes,estado:'legado_sem_vinculos',escolhasEsperadas:esperadas.length});continue;
  }
  const vistos=new Set();
  for(const id of h.escolhasIds){
   if(typeof id!=='string'||!id.trim()){alertas.push({codigo:'vinculo_invalido',mes});continue;}
   if(vistos.has(id))alertas.push({codigo:'vinculo_duplicado',mes,id});
   vistos.add(id);
   const e=ids.get(id);
   if(!e)alertas.push({codigo:'vinculo_orfao',mes,id});
   else if(e.mes!==mes)alertas.push({codigo:'vinculo_mes_incorreto',mes,id,mesEscolha:e.mes});
  }
  for(const id of esperadas)if(!vistos.has(id))alertas.push({codigo:'escolha_sem_vinculo',mes,id});
  const baixas=Array.isArray(h.parcelasBaixadasMes)?h.parcelasBaixadasMes:[];
  for(const baixa of baixas){
   const origem=baixa?.origemEscolhaId;
   if(origem===undefined||origem===null||origem==='')alertas.push({codigo:'baixa_sem_id_origem',mes});
   else if(!ids.has(origem))alertas.push({codigo:'baixa_origem_desconhecida',mes,id:origem});
   else if(ids.get(origem).mes>mes)alertas.push({codigo:'baixa_antes_da_escolha',mes,id:origem});
  }
  porMes.push({mes,estado:'verificado',escolhasEsperadas:esperadas.length,vinculosRegistrados:h.escolhasIds.length,baixasRegistradas:baixas.length});
 }
 return {etapa:124,porMes,alertas,integridadeConfirmada:alertas.length===0&&porMes.every(x=>x.estado==='verificado'),
  nota60Candidata:null,nota1000Candidata:null,
  aviso:'Integridade dos vínculos de partida não mede qualidade das decisões, nem confirma pagamento externo.'};
}

// Etapa 125: compara o contrato aprovado com a estrutura efetiva do motor experimental.
// Não atribui notas e não considera o protótipo publicado.
function conferirContratoPontuacaoEtapa125V120(pesosMotor,rotulosMotor,resultado){
 const contrato={
  planejamento:{orcamento:80,compromissos:70,futuro:60,objetivo:40},
  decisoes:{viabilidade:70,dividas:80,consequencias:60,oportunidades:40},
  recursos:{essenciais:80,custos:70,credito:60,equilibrio:40},
  adaptacao:{imprevistos:90,recuperacao:80,reorganizacao:50,futuro:30}
 };
 const divergencias=[];
 for(const [categoria,sub] of Object.entries(contrato)){
  for(const [chave,peso] of Object.entries(sub)){
   const atual=pesosMotor?.[categoria]?.[chave];
   if(atual!==peso)divergencias.push({categoria,chave,pesoAprovado:peso,pesoNoMotor:atual??null,codigo:'peso_divergente'});
  }
 }
 const categorias=Object.keys(contrato);
 const totalMotor=resultado?.total;
 const somaCategorias=categorias.every(c=>Number.isFinite(resultado?.criterios?.[c]))?categorias.reduce((n,c)=>n+resultado.criterios[c],0):null;
 if(somaCategorias!==null&&totalMotor!==somaCategorias)divergencias.push({codigo:'total_inconsistente',total:totalMotor,somaCategorias});
 return {contrato,divergencias,estruturaConforme:!divergencias.some(x=>x.codigo==='peso_divergente'),totalCoerente:somaCategorias===null?null:totalMotor===somaCategorias,nota1000Validada:false,alerta:'Motor experimental: fórmulas e subcritérios ainda não validados; não publicar pontuação.'};
}
