'use strict';
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

// Etapa 411: evidencia auditavel. Nao classifica contas individuais nem objetivos pessoais.
function componentesConsequencias411(registros=[],historico=[],escolhas=[]){
 const completas=Array.isArray(historico)&&historico.length===6&&historico.every((h,i)=>h&&h.mes===i+1&&Array.isArray(h.eventosFinanceirosMes));
 const contas=(Array.isArray(escolhas)?escolhas:[]).filter(e=>e&&e.tipo==='contas-essenciais'&&e.detalhes&&e.detalhes.contextoCompromisso409);
 if(!completas||contas.length!==2||!contas.every(e=>typeof e.detalhes.contextoCompromisso409.capacidadePagamentoIntegral==='boolean'))return {aplicavel:false,motivo:'evidencias contextuais ou historico insuficientes'};
 const adiamentos=contas.filter(e=>e.detalhes.decisao==='adiar');
 const voluntarios=adiamentos.filter(e=>e.detalhes.contextoCompromisso409.capacidadePagamentoIntegral);
 const eventos=historico.flatMap(h=>h.eventosFinanceirosMes);
 const juros=eventos.filter(e=>e.tipo==='juros_divida_essencial').reduce((s,e)=>s+(Number(e.valor)||0),0);
 const principal=adiamentos.reduce((s,e)=>s+(Number(e.detalhes.valor)||0),0);
 const pagamentos=eventos.filter(e=>e.tipo==='pagamento_parcial_ou_quitacao').reduce((s,e)=>s+(Number(e.valor)||0),0);
 const acordos=eventos.filter(e=>e.tipo==='renegociacao_contas_essenciais');
 const dividaFinal=Math.max(0,Number(historico[5].dividaEssencial)||0);
 const parcelasAcordosBaixadas=historico.flatMap(h=>h.parcelasBaixadasMes||[]).filter(p=>/Acordo de contas essenciais/i.test(p.descricao||'')).reduce((s,p)=>s+(Number(p.valor)||0),0);
 // Etapa 415: rastreabilidade de solucoes de deficit e compromissos, sem presumir
 // que contratar credito/renegociar seja bom ou ruim por si so.
 const solucoesDeficit=(Array.isArray(escolhas)?escolhas:[]).filter(e=>e&&e.tipo==='resolucao-deficit');
 const alternativasDeficit=solucoesDeficit.map(e=>({mes:e.mes,escolha:e.detalhes?.alternativaEscolhida||e.detalhes?.alternativa||null,
  valor:Number(e.detalhes?.valorOriginal)||0,alternativas:(e.detalhes?.alternativasDisponiveis||[]).map(a=>a.id),
  credito:(e.detalhes?.operacoesCredito||[]).map(o=>({total:o.total,encargo:o.encargo,vencimentos:o.vencimentos}))}));
 const baixasAcordos=historico.flatMap(h=>(h.parcelasBaixadasMes||[]).filter(p=>/acordo|renegocia/i.test(p.descricao||'')).map(p=>({mes:h.mes,valor:Number(p.valor)||0,descricao:p.descricao})));
 const acordosNoHistorico=historico.flatMap(h=>(h.eventosFinanceirosMes||[]).filter(e=>e.tipo==='renegociacao_contas_essenciais').map(e=>({mes:h.mes,valor:e.novoTotal,parcelas:e.parcelas})));
 // Etapa 416: uma baixa automatica de parcela nao comprova desembolso com recursos
 // proprios quando o mesmo mes exigiu financiamento/renegociacao de deficit.
 // O vinculo por origemEscolhaId permite rastrear vencimento e baixa, mas nao
 // autoriza inferir que determinada parcela foi paga com o novo credito.
 const conciliacaoAcordos416=historico.flatMap(h=>{
  const solucoes=(Array.isArray(escolhas)?escolhas:[]).filter(e=>e&&e.mes===h.mes&&e.tipo==='resolucao-deficit'&&['adiar','renegociar'].includes(e.detalhes?.alternativaEscolhida||e.detalhes?.alternativa));
  const financiamentoDeficit=solucoes.reduce((v,e)=>v+(Number(e.detalhes?.valorOriginal)||0),0);
  return (h.parcelasBaixadasMes||[]).filter(p=>/acordo|renegocia/i.test(p.descricao||'')).map(p=>({
   mes:h.mes,origemEscolhaId:p.origemEscolhaId??null,valor:Number(p.valor)||0,
   baixaAutomatica:p.origemRegistro==='baixa_automatica_do_motor',
   financiouDeficitNoMesmoMes:financiamentoDeficit>0,
   financiamentoDeficitMes:financiamentoDeficit,
   comprovacaoPagamentoComRecursosProprios:financiamentoDeficit>0?'indeterminada':'baixa_registrada_sem_financiamento_de_deficit',
   aviso:financiamentoDeficit>0?'Baixa automatica coexistiu com financiamento de deficit: nao atribuir quitacao com recursos proprios sem conciliacao de caixa.':null
  }));
 });
 // Etapa 418: conciliacao por identidade do acordo, sem confundir baixa automatica
 // com pagamento comprovado. Acordos com vencimento apos o sexto mes ficam pendentes,
 // nao inadimplentes. A ausencia de comprovacao externa e explicitamente preservada.
 const acordos418=historico.flatMap(h=>(h.eventosFinanceirosMes||[])
  .filter(e=>e.tipo==='renegociacao_contas_essenciais')
  .map(e=>({mesOrigem:h.mes,valorOriginal:Number(e.novoTotal)||0,parcelasContratadas:Number(e.parcelas)||0})));
 const conciliacaoCumprimento418={
  parcelasBaixadas:conciliacaoAcordos416.length,
  valorBaixado:conciliacaoAcordos416.reduce((v,p)=>v+p.valor,0),
  parcelasComFinanciamentoSimultaneo:conciliacaoAcordos416.filter(p=>p.financiouDeficitNoMesmoMes).length,
  parcelasSemFinanciamentoSimultaneo:conciliacaoAcordos416.filter(p=>!p.financiouDeficitNoMesmoMes).length,
  pagamentosExternamenteConfirmados:conciliacaoAcordos416.filter(p=>p.confirmacaoExterna===true).length,
  acordosCriados:acordos418.length,
  limiteObservacaoMes:6,
  aviso:'Baixa automatica nao demonstra origem dos recursos nem pagamento externo; vencimentos posteriores ao mes 6 nao configuram descumprimento observado.'
 };
 const obrigaçõesFinais=historico[5].obrigacoesPendentesFechamento||[];
 const acordosPendentes=obrigaçõesFinais.filter(o=>/renegocia|contas essenciais|acordo/i.test(o.descricao||''));
 // Impacto: custo adicional efetivo (juros) decorrente do adiamento; nao repete a penalidade pelo principal.
 // A referencia de 5% por mes e a taxa didatica existente no motor, nao uma multa nova.
 // Auditoria de causalidade: encargos efetivamente contratados e vencimentos
 // futuros por decisao. Registro informativo, sem descontar pontos duas vezes.
 const creditosRastreados=(Array.isArray(escolhas)?escolhas:[]).flatMap(e=>(e?.detalhes?.operacoesCredito||[]).map(o=>({
  escolhaId:e.id??null,mesOrigem:e.mes,tipoEscolha:e.tipo,origem:o.origem||null,
  principal:Number(o.principal)||0,encargo:Number(o.encargo)||0,
  vencimentos:(o.vencimentos||[]).map(v=>({mes:Number(v.mes),valor:Number(v.valor)||0}))
 })));
 const impactoFuturoAuditavel={
  contratos:creditosRastreados.length,
  encargosContratados:Math.round(creditosRastreados.reduce((a,c)=>a+c.encargo,0)*100)/100,
  vencimentosAposMes6:Math.round(creditosRastreados.flatMap(c=>c.vencimentos).filter(v=>v.mes>6).reduce((a,v)=>a+v.valor,0)*100)/100,
  creditos:creditosRastreados,
  ressalva:'Encargo contratado nao demonstra dano evitavel; avaliar finalidade, capacidade e causalidade antes de alterar nota. Vencimentos posteriores ao mes 6 nao sao automaticamente inadimplencia.'
 };
 const mesesJuros=principal>0?juros/(principal*.05):0;
 const impacto=Math.round(25*Math.max(0,1-Math.min(1,mesesJuros/6)));
 // Cumprimento: somente adiamento voluntario documentado reduz a regularidade; incapacidade nao e falta voluntaria.
 const cumprimento=Math.round(20*(1-voluntarios.length/contas.length));
 // Prevencao e recuperacao: nao exige criar problemas; reconhecer pagamento efetivo,
 // mas acordo nao quitado nao equivale a quitacao. Nao retirar pontos por incapacidade comprovada.
 const principalVoluntario=voluntarios.reduce((s,e)=>s+(Number(e.detalhes.valor)||0),0);
 // Etapa 417: baixa de acordo simultanea a novo financiamento nao prova
 // reducao sustentavel do endividamento. Nao a contar como recuperacao
 // comprovada em adiamentos voluntarios; a baixa continua registrada
 // para cumprimento do cronograma e a evidencia ambigua permanece visivel.
 const baixasFinanciamentoAmbiguo=conciliacaoAcordos416.filter(b=>b.financiouDeficitNoMesmoMes);
 const valorBaixasAmbiguas=baixasFinanciamentoAmbiguo.reduce((s,b)=>s+b.valor,0);
 const baixasRecuperacaoComprovavel=Math.max(0,parcelasAcordosBaixadas-valorBaixasAmbiguas);
 const recuperacao=principalVoluntario===0?1:Math.max(0,Math.min(1,(pagamentos+baixasRecuperacaoComprovavel)/principalVoluntario));
 const correcao=Math.round(15*recuperacao);
 return {aplicavel:true,impacto,cumprimento,correcao,total:impacto+cumprimento+correcao,
  evidencias:{juros,principal,mesesJuros,impactoFuturoAuditavel,pagamentos,parcelasAcordosBaixadas,dividaFinal,adiamentos:adiamentos.length,adiamentosVoluntarios:voluntarios.length,acordos:acordos.length,acordosPendentes:acordosPendentes.length,solucoesDeficit:alternativasDeficit,baixasAcordos,conciliacaoAcordos416,conciliacaoCumprimento418,conciliacaoCaixa419:conciliarCaixaAcordos419(historico,escolhas),acordosNoHistorico,valorBaixasAmbiguas,baixasRecuperacaoComprovavel},
  ressalvas:['Impacto mede somente juros de divida essencial: outros efeitos ainda nao estao cobertos.', 'Acordos exigem validacao dos pagamentos das parcelas; assinatura isolada nao comprova recuperacao.', 'Nao inferir quais contas individuais foram adiadas.', 'Baixas concomitantes a novo financiamento nao comprovam recuperacao liquida; nao sao contadas nos 15 pontos de recuperacao de adiamentos voluntarios.']};
}
