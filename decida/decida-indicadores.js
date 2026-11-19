"use strict";
// Camada compartilhada de evidências. Não atribui nem harmoniza notas.
// Cada subcritério consulta fatos comuns, mas mantém avaliação independente.
function indicadoresMensais(historico=[],registros=[]){
 const numero=x=>Number.isFinite(Number(x))?Number(x):0;
 return historico.map((h,i)=>{
  const mes=numero(h.mes)||i+1;
  const margem=numero(h.margemMes);
  const parcelaAtual=numero(h.parcelasMes);
  const parcelaSeguinte=numero(h.parcelaProxima);
  const avaliacoes=registros.filter(r=>Number(r.mes)===mes);
  const porCategoria={};
  for(const r of avaliacoes){(porCategoria[r.categoria]??=[]).push(r);}
  return {
   mes,financeiro:{margem,parcelaAtual,parcelaSeguinte,
    comprometimentoProximo:margem>0?parcelaSeguinte/margem:null,
    dividas:numero(h.dividas),reserva:numero(h.reserva),objetivo:numero(h.meta),
    metaValor:numero(h.metaValor),livre:numero(h.livre),
    gastosAdicionais:numero(h.gastosConsumo),creditoConsumo:numero(h.creditoConsumo),
    creditoNecessidade:numero(h.creditoNecessidade)},
   comportamento:{essenciaisDecisao:h.essenciaisDecisao??null,
    essenciaisNaoPagas:numero(h.essenciaisNaoPagas),deficit:Boolean(h.deficit),
    renegociacoes:numero(h.renegociacoesMes)},
   evidencias:{quantidade:avaliacoes.length,porCategoria,
    decisoes:avaliacoes.map(r=>({...r}))}
  };
 });
}
function notaDiretaValidaIndicadoresV120(r){
 return r!=null&&typeof r.nota==='number'&&Number.isFinite(r.nota)&&r.nota>=0&&r.nota<=1;
}
function mediaIndividualDecisoes(registros=[]){
 const notas=registros.filter(r=>r.categoria==='decisoes'&&r.comportamento==='viabilidade'&&notaDiretaValidaIndicadoresV120(r));
 return notas.length?notas.reduce((a,r)=>a+r.nota,0)/notas.length:null;
}

// Auditoria independente da rubrica aprovada. Não atribui pontos por ausência de evidência.
const RUBRICA_V120={
 planejamento:{orcamento:80,compromissos:70,futuro:60,objetivo:40},
 decisoes:{viabilidade:70,dividas:80,consequencias:60,oportunidades:40},
 recursos:{essenciais:80,custos:70,credito:60,equilibrio:40},
 adaptacao:{imprevistos:90,reorganizacao:80,evolucao:50,futuro:30}
};
const VINCULOS_V120={
 'planejamento.orcamento':['planejamento.orcamento'],
 'planejamento.compromissos':['planejamento.compromissos'],
 'planejamento.futuro':[],
 'planejamento.objetivo':['planejamento.objetivo','planejamento.reserva'],
 'decisoes.viabilidade':['decisoes.viabilidade'],
 'decisoes.dividas':['decisoes.dividas'],
 'decisoes.consequencias':['decisoes.consequencias'],
 'decisoes.oportunidades':['decisoes.oportunidades'],
 'recursos.essenciais':['recursos.essenciais'],
 'recursos.custos':['recursos.custos'],
 'recursos.credito':['recursos.credito'],
 'recursos.equilibrio':['recursos.equilibrio'],
 'adaptacao.imprevistos':['adaptacao.imprevistos','adaptacao.oportunidades'],
 'adaptacao.reorganizacao':['adaptacao.reorganizacao'],
 'adaptacao.evolucao':['adaptacao.recuperacao'],
 'adaptacao.futuro':['adaptacao.futuro']
};
function auditarCoberturaV120(registros=[],historico=[]){
 const meses=indicadoresMensais(historico,registros);
 const itens=[];
 for(const [categoria,sub] of Object.entries(RUBRICA_V120))for(const [chave,maximo] of Object.entries(sub)){
  const id=categoria+'.'+chave, vinculos=VINCULOS_V120[id]||[];
  const evidencias=registros.filter(r=>vinculos.includes(r.categoria+'.'+r.comportamento)&&notaDiretaValidaIndicadoresV120(r));
  const media=evidencias.length?evidencias.reduce((s,r)=>s+r.nota,0)/evidencias.length:null;
  itens.push({id,maximo,registros:evidencias.length,meses:[...new Set(evidencias.map(r=>r.mes))].sort(),media,estado:evidencias.length?'evidencia_parcial':'sem_avaliacao_direta',
   observacao:'Cobertura de registros apenas; não é pontuação final nem prova de aplicabilidade.'});
 }
 return {versao:'1.20',meses:meses.length,itens,semAvaliacaoDireta:itens.filter(i=>!i.registros).map(i=>i.id),
  totalPesos:itens.reduce((s,i)=>s+i.maximo,0),aviso:'Não aplicar média de cobertura como nota; exigem-se contexto e regras específicas para os 16 indicadores.'};
}

// Etapa 3: cálculo paralelo e auditável. Ausência de evidência não vira nota estimada.
// Esta função NÃO substitui a nota apresentada ao jogador até validação completa.
function pontuacaoAuditavelV120(registros=[],historico=[]){
 const cobertura=auditarCoberturaV120(registros,historico);
 const itens=cobertura.itens.map(item=>{
  const media=item.id==='decisoes.viabilidade'?mediaIndividualDecisoes(registros):item.media;
  const pontos=media===null?null:Math.round(item.maximo*media);
  return {...item,media,pontos,pendente:pontos===null,
   motivo:pontos===null?'Sem evidência suficiente: exige regra contextual ou registro específico.':'Média dos registros disponíveis; cobertura ainda requer validação contextual.'};
 });
 const porGrupo={};
 for(const [grupo,sub] of Object.entries(RUBRICA_V120)){
  const grupoItens=itens.filter(i=>i.id.startsWith(grupo+'.'));
  porGrupo[grupo]={maximo:250,pontosVerificados:grupoItens.reduce((a,i)=>a+(i.pontos??0),0),
   completo:grupoItens.every(i=>!i.pendente),pendentes:grupoItens.filter(i=>i.pendente).map(i=>i.id)};
 }
 return {versao:'1.20-etapa3',status:'diagnostico_paralelo_nao_validado',itens,porGrupo,
  totalVerificado:itens.reduce((a,i)=>a+(i.pontos??0),0),
  totalFinal:itens.every(i=>!i.pendente)?itens.reduce((a,i)=>a+i.pontos,0):null,
  observacao:'Pontuação parcial não é nota final. Não compensar subcritérios nem inventar 0,75 para ausência de evidência.'};
}

// Etapa 4: diagnóstico de integridade, sem substituir a rubrica nem inferir notas.
function diagnosticarRegistrosV120(registros=[],historico=[]){
 const meses=indicadoresMensais(historico,registros);
 const problemas=[];
 const ids=new Set();
 for(const [indice,r] of registros.entries()){
  if(!Number.isInteger(Number(r.mes))||Number(r.mes)<1||Number(r.mes)>6)
   problemas.push({tipo:'mes_invalido',indice});
  if(!Number.isFinite(Number(r.nota))||Number(r.nota)<0||Number(r.nota)>1)
   problemas.push({tipo:'nota_fora_intervalo',indice});
  if(!r.contexto||!Number.isFinite(Number(r.contexto.margem)))
   problemas.push({tipo:'contexto_incompleto',indice});
  if(r.id!=null){if(ids.has(r.id))problemas.push({tipo:'id_duplicado',indice});ids.add(r.id);}
 }
 const decisoesAgrupadas={};
 for(const r of registros){if(!r.escolhaId)continue;
  (decisoesAgrupadas[r.escolhaId]??=[]).push({categoria:r.categoria,comportamento:r.comportamento,nota:r.nota,mes:r.mes});
 }
 return {versao:'1.20-etapa4',mesesRegistrados:meses.length,totalRegistros:registros.length,
  escolhasIdentificadas:Object.keys(decisoesAgrupadas).length,decisoesAgrupadas,
  problemas,mesesSemRegistros:meses.filter(m=>m.evidencias.quantidade===0).map(m=>m.mes),
  notaFinalValidada:false,
  aviso:'Diagnóstico técnico; a pontuação final continua dependente da validação dos 16 subcritérios.'};
}


// Etapa 12: prevenção sustentada é um caminho legítimo de nota máxima.
// Não extrapola notas para trajetórias com problemas: essas exigem avaliação contextual.
// Etapa 15: evolução/recuperação observada (27 pontos).
// Mede redução efetiva de pendências entre meses, sem transferir pontos
// de equilíbrio ou de outros subcritérios. Dívida sustentável não é falha.
function avaliarEvolucaoObservadaV120(historico=[],registros=[]){
 const numero=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x))?Number(x):null;
 const diretas=registros.filter(r=>r.categoria==='planejamento'&&r.comportamento==='futuro_evolucao'&&numero(r.nota)!==null&&Number(r.nota)>=0&&Number(r.nota)<=1);
 if(diretas.length)return {nota:diretas.reduce((s,r)=>s+Number(r.nota),0)/diretas.length,metodo:'avaliacoes_diretas',evidencias:diretas.length};
 if(historico.length!==6||new Set(historico.map((h,i)=>Number(h.mes??i+1))).size!==6||![1,2,3,4,5,6].every(m=>historico.some((h,i)=>Number(h.mes??i+1)===m)))return {nota:null,metodo:'historico_incompleto'};
 if(!historico.every(h=>numero(h.margemMes)!==null&&numero(h.parcelaProxima)!==null&&numero(h.essenciaisNaoPagas)!==null&&typeof h.deficit==='boolean'))return {nota:null,metodo:'dados_incompletos'};
 const meses=historico.map((h,i)=>({mes:Number(h.mes??i+1),margem:Number(h.margemMes),parcela:Number(h.parcelaProxima),essenciais:Number(h.essenciaisNaoPagas),deficit:h.deficit})).sort((a,b)=>a.mes-b.mes);
 // Sinais concretos de dificuldade: margem negativa, parcelas acima da
 // margem, essenciais pendentes ou déficit. Dívida isolada não é sinal.
 const carga=h=>Number(h.margem<0)+Number(h.parcela>Math.max(0,h.margem))+Number(h.essenciais>0)+Number(h.deficit);
 const cargas=meses.map(carga);
 if(cargas.every(x=>x===0))return {nota:1,metodo:'manutencao_responsavel_seis_meses',evidencias:6,cargas};
 // Melhorias observadas: cada transição tem peso igual; pioras não recebem
 // crédito. Resolução final é avaliada separadamente. Não apaga o passado.
 const melhorias=cargas.slice(1).map((c,i)=>Math.max(0,cargas[i]-c));
 const pioras=cargas.slice(1).map((c,i)=>Math.max(0,c-cargas[i]));
 const melhoriaLiquida=Math.max(0,melhorias.reduce((a,b)=>a+b,0)-pioras.reduce((a,b)=>a+b,0));
 const resolucao=cargas[5]===0?1:0;
 // Recuperação não é nota de equilíbrio: valoriza a evolução líquida e a
 // resolução; mantém teto inferior a 1 quando houve dificuldade observada.
 const nota=Math.min(0.9,0.6*Math.min(1,melhoriaLiquida/Math.max(1,Math.max(...cargas)))+0.3*resolucao);
 return {nota:Math.round(nota*1000000)/1000000,metodo:'recuperacao_observada_experimental',evidencias:6,cargas,melhoriaLiquida,resolucao,
  observacao:'Regra experimental: precisa de validação pedagógica em partidas completas.'};
}

// Etapa 17: distinguir margem do próprio mês de capacidade do mês seguinte.
// Usa renda/despesas do mês seguinte quando há histórico observado; no mês 6,
// exige projeção explícita ou mantém a margem habitual como estimativa sinalizada.
function capacidadeParcelasV120(historico=[],indice=0){
 const numero=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x))?Number(x):null;
 const atual=historico[indice];if(!atual)return {capacidade:null,fonte:'ausente'};
 const proximo=historico.find(h=>Number(h.mes)===Number(atual.mes)+1);
 if(proximo){
  const renda=numero(proximo.rendaMes),despesas=numero(proximo.despesasMes);
  if(renda!==null&&despesas!==null)return {capacidade:renda-despesas,fonte:'mes_seguinte_observado'};
  const margem=numero(proximo.margemMes);
  if(margem!==null)return {capacidade:margem,fonte:'margem_mes_seguinte_observada'};
 }
 const prevista=numero(atual.margemProximaPrevista);
 if(prevista!==null)return {capacidade:prevista,fonte:'projecao_explicita'};
 const habitual=numero(atual.margemMes);
 return {capacidade:habitual,fonte:'estimativa_margem_habitual'};
}

// Etapa 18: projeção de 6 pontos somente com evidência explícita.
// A projeção não presume inadimplência futura e não usa a margem habitual como fato.
function avaliarProjecaoFuturaV120(historico=[],registros=[]){
 const validas=registros.filter(r=>r.categoria==='planejamento'&&r.comportamento==='futuro_projecao'&&notaDiretaValidaIndicadoresV120(r)&&Number(r.nota)>=0&&Number(r.nota)<=1);
 if(validas.length)return {nota:validas.reduce((s,r)=>s+Number(r.nota),0)/validas.length,metodo:'avaliacoes_diretas',evidencias:validas.length};
 const ultimo=historico.find(h=>Number(h.mes)===6);
 if(!ultimo)return {nota:null,metodo:'sexto_mes_ausente'};
 const numero=x=>x===null||x===undefined||x===''||!Number.isFinite(Number(x))?null:Number(x);
 const margem=numero(ultimo.margemProximaPrevista),parcelas=numero(ultimo.parcelaProxima);
 if(margem===null||parcelas===null)return {nota:null,metodo:'projecao_explicita_ausente'};
 // Apenas um sinal de capacidade, não uma sentença sobre decisões futuras.
 // A projeção negativa exige análise contextual e não vira nota zero automática.
 if(margem<0||parcelas>margem)return {nota:null,metodo:'projecao_requer_analise_contextual',margem,parcelas};
 return {nota:1,metodo:'compromissos_projetados_cabem_na_margem_explicita',evidencias:1,margem,parcelas};
}

// Etapa 13: equilíbrio observado: avaliar obrigações e margem conjuntamente.
// A margem isolada não comprova capacidade de honrar parcelas futuras.
function avaliarEquilibrioObservadoV120(historico=[],registros=[]){
 const numero=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x))?Number(x):null;
 const diretas=registros.filter(r=>r.categoria==='planejamento'&&r.comportamento==='futuro_equilibrio'&&numero(r.nota)!==null&&Number(r.nota)>=0&&Number(r.nota)<=1);
 if(diretas.length)return {nota:diretas.reduce((s,r)=>s+Number(r.nota),0)/diretas.length,metodo:'avaliacoes_diretas',evidencias:diretas.length};
 if(historico.length!==6||new Set(historico.map((h,i)=>Number(h.mes??i+1))).size!==6||![1,2,3,4,5,6].every(m=>historico.some((h,i)=>Number(h.mes??i+1)===m)))return {nota:null,metodo:'historico_incompleto'};
 if(!historico.every(h=>numero(h.margemMes)!==null&&numero(h.parcelaProxima)!==null&&numero(h.dividas)!==null&&numero(h.essenciaisNaoPagas)!==null&&typeof h.deficit==='boolean'))return {nota:null,metodo:'dados_incompletos'};
 // Etapa 16: dívida isolada não é desequilíbrio; obrigações cabíveis e contas em dia podem coexistir com dívida.
 // Etapa 14: a proporção de meses equilibrados é evidência observada,
 // não uma bonificação por recuperação. Cada mês vale 1/6 do indicador.
 // O histórico completo é obrigatório para evitar médias sobre meses selecionados.
 const meses=historico.map(h=>({mes:Number(h.mes),margem:Number(h.margemMes),
  parcela:Number(h.parcelaProxima),divida:Number(h.dividas),
  essenciais:Number(h.essenciaisNaoPagas),deficit:h.deficit})).sort((a,b)=>a.mes-b.mes);
 const avaliados=meses.map((h,i)=>{
  const capacidade=capacidadeParcelasV120(historico,historico.findIndex(original=>Number(original.mes)===h.mes));
  return {mes:h.mes,capacidadeParcelas:capacidade.capacidade,fonteCapacidade:capacidade.fonte,
   equilibrado:h.margem>=0&&capacidade.capacidade!==null&&h.parcela<=capacidade.capacidade&&
   h.essenciais===0&&!h.deficit};
 });
 const equilibrados=avaliados.filter(h=>h.equilibrado).length;
 return {nota:equilibrados/6,metodo:equilibrados===6?'equilibrio_sustentado_seis_meses':'proporcao_meses_equilibrados',
  evidencias:6,meses:avaliados,mesesEquilibrados:equilibrados,
  observacao:'Dívida isolada não reduz a nota; parcelas dentro da margem, contas em dia e ausência de déficit são exigidas. Recuperação avaliada separadamente.'};
}

// Etapa 19: contas essenciais (80 pontos). Avaliação mensal baseada em
// fatos observados; não infere pagamento quando o campo está ausente.
function avaliarEssenciaisV120(historico=[],registros=[]){
 const numero=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x))?Number(x):null;
 const diretas=registros.filter(r=>r.categoria==='planejamento'&&r.comportamento==='orcamento'&&numero(r.nota)!==null&&Number(r.nota)>=0&&Number(r.nota)<=1);
 if(diretas.length)return {nota:diretas.reduce((s,r)=>s+Number(r.nota),0)/diretas.length,metodo:'avaliacoes_diretas',evidencias:diretas.length};
 if(historico.length!==6||![1,2,3,4,5,6].every(m=>historico.filter((h,i)=>Number(h.mes??i+1)===m).length===1))return {nota:null,metodo:'historico_incompleto'};
 const meses=historico.map((h,i)=>({mes:Number(h.mes??i+1),pendentes:numero(h.essenciaisNaoPagas),decisao:h.essenciaisDecisao??null})).sort((a,b)=>a.mes-b.mes);
 if(meses.some(m=>m.pendentes===null))return {nota:null,metodo:'pagamentos_nao_documentados'};
 // Pendência positiva é fato observado; a causa precisa de avaliação
 // contextual antes de descontar pontos por decisão irresponsável.
 if(meses.some(m=>m.pendentes>0||m.decisao==='adiar'))return {nota:null,metodo:'pendencias_exigem_analise_contextual',meses};
 return {nota:1,metodo:'essenciais_em_dia_seis_meses',evidencias:6,meses};
}

// Etapa 21: cálculo gradual somente quando há evidência mensal explícita.
// A média não é harmonizada com outros subcritérios. Não presumir a causa
// de atrasos a partir de saldos ou de uma dívida isolada.
function avaliarEssenciaisGradualV120(historico=[],registros=[]){
 const meses=[1,2,3,4,5,6];
 if(!Array.isArray(historico)||historico.length!==6||!meses.every(m=>historico.filter((h,i)=>Number(h.mes??i+1)===m).length===1))
  return {nota:null,metodo:'historico_incompleto'};
 const avaliacoes=[];
 for(const mes of meses){
  const h=historico.find((x,i)=>Number(x.mes??i+1)===mes);
  const diretas=registros.filter(r=>Number(r.mes)===mes&&r.categoria==='planejamento'&&r.comportamento==='orcamento'&&notaDiretaValidaIndicadoresV120(r)&&Number(r.nota)>=0&&Number(r.nota)<=1);
  // Havendo avaliação contextual direta, respeitar a média das decisões do mês.
  if(diretas.length){avaliacoes.push({mes,nota:diretas.reduce((s,r)=>s+Number(r.nota),0)/diretas.length,origem:'decisao_contextual'});continue;}
  // O registro de ausência de pendências só é suficiente se a escolha foi explícita.
  if(h.essenciaisDecisao==='pagar'&&Number(h.essenciaisNaoPagas)===0&&h.essenciaisNaoPagas!==null&&h.essenciaisNaoPagas!==undefined){
   avaliacoes.push({mes,nota:1,origem:'pagamento_confirmado'});continue;
  }
  return {nota:null,metodo:'contexto_mensal_insuficiente',mesPendente:mes,avaliacoes};
 }
 return {nota:avaliacoes.reduce((s,x)=>s+x.nota,0)/6,metodo:'media_mensal_contextual',evidencias:avaliacoes.length,avaliacoes};
}

// Para pagamentos/parcelas, não inferir qualidade da contratação a partir
// da capacidade isolada. Exigir registros contextuais dos meses com decisões.
function avaliarParcelasGradualV120(historico=[],registros=[]){
 if(!Array.isArray(historico)||historico.length!==6||![1,2,3,4,5,6].every(m=>historico.filter((h,i)=>Number(h.mes??i+1)===m).length===1))return {nota:null,metodo:'historico_incompleto'};
 const avaliacoes=[];
 for(let mes=1;mes<=6;mes++){
  const h=historico.find((x,i)=>Number(x.mes??i+1)===mes);
  const notas=registros.filter(r=>Number(r.mes)===mes&&r.categoria==='planejamento'&&r.comportamento==='compromissos'&&notaDiretaValidaIndicadoresV120(r)&&Number(r.nota)>=0&&Number(r.nota)<=1).map(r=>Number(r.nota));
  if(notas.length){avaliacoes.push({mes,nota:notas.reduce((a,b)=>a+b,0)/notas.length,origem:'avaliacoes_contextuais'});continue;}
  // Sem contratação nem obrigação no mês, não atribuir nota fictícia.
  const parcela=Number(h.parcelasMes??h.parcelaProxima);
  if(Number.isFinite(parcela)&&parcela===0){avaliacoes.push({mes,nota:null,origem:'sem_obrigacao_avaliavel'});continue;}
  return {nota:null,metodo:'avaliacao_de_parcelas_pendente',mesPendente:mes,avaliacoes};
 }
 const validas=avaliacoes.filter(a=>a.nota!==null);
 return validas.length?{nota:validas.reduce((s,a)=>s+a.nota,0)/validas.length,metodo:'media_meses_com_evidencia',evidencias:validas.length,avaliacoes}:
  {nota:null,metodo:'nenhuma_oportunidade_avaliavel',avaliacoes};
}

// Etapa 20: pagamentos e parcelas (70 pontos).
// Uma parcela é sustentável quando cabe na capacidade do mês de vencimento.
// Sem dados completos, a ausência de inadimplência não prova nota máxima.
function avaliarPagamentosParcelasV120(historico=[],registros=[]){
 const num=x=>x===null||x===undefined||x===''||!Number.isFinite(Number(x))?null:Number(x);
 const diretas=registros.filter(r=>r.categoria==='planejamento'&&r.comportamento==='compromissos'&&num(r.nota)!==null&&num(r.nota)>=0&&num(r.nota)<=1);
 if(diretas.length)return {nota:diretas.reduce((s,r)=>s+Number(r.nota),0)/diretas.length,metodo:'avaliacoes_contextuais_diretas',evidencias:diretas.length};
 if(historico.length!==6||![1,2,3,4,5,6].every(m=>historico.filter((h,i)=>Number(h.mes??i+1)===m).length===1))return {nota:null,metodo:'historico_incompleto'};
 const meses=historico.map((h,i)=>{
  const parcela=num(h.parcelaProxima),capacidade=capacidadeParcelasV120(historico,i);
  return {mes:Number(h.mes??i+1),parcela,capacidade:capacidade.capacidade,fonte:capacidade.fonte};
 });
 if(meses.some(m=>m.parcela===null||m.capacidade===null))return {nota:null,metodo:'capacidade_ou_parcelas_nao_documentadas',meses};
 if(meses.some(m=>m.parcela>m.capacidade||m.capacidade<0))return {nota:null,metodo:'parcelas_exigem_avaliacao_contextual',meses};
 // Capacidade financeira isolada não comprova qualidade da contratação,
 // juros, pagamento pontual ou renegociação; estes requerem evidência própria.
 return {nota:null,metodo:'capacidade_comprovada_mas_qualidade_da_contratacao_pendente',meses};
}


// Etapa 27 — auditoria factual contextual, sem criar nota a partir de suposições.
// Só classifica como necessidade quando a própria origem/decisão comprova isso.
function auditarGestaoReservaV120(historico=[],movimentos=[],escolhas=[]){
 const meses=[1,2,3,4,5,6];
 const escolhasPorId=new Map((Array.isArray(escolhas)?escolhas:[]).filter(e=>e&&e.id).map(e=>[e.id,e]));
 const movimentosValidos=(Array.isArray(movimentos)?movimentos:[]).filter(m=>m&&meses.includes(Number(m.mes))&&
  ['aporte','uso'].includes(m.tipo)&&Number.isFinite(Number(m.valor))&&Number(m.valor)>0);
 const eventos=movimentosValidos.map(m=>{
  const escolha=escolhasPorId.get(m.escolhaId);
  let finalidade='indeterminada';
  if(m.tipo==='aporte')finalidade='formacao';
  else if(m.origem==='cobertura-deficit'&&escolha?.tipo==='resolucao-deficit'&&escolha.detalhes?.alternativa==='recursos')finalidade='cobertura-deficit';
  else if(m.origem==='pagamento-acontecimento')finalidade='acontecimento-sem-finalidade-comprovada';
  return {id:m.id,mes:Number(m.mes),tipo:m.tipo,valor:Number(m.valor),origem:m.origem,
   escolhaId:m.escolhaId??null,escolhaEncontrada:!!escolha,finalidade,
   classificacao:finalidade==='formacao'?'aporte-documentado':finalidade==='cobertura-deficit'?'uso-para-cobrir-deficit':'requer-contexto',
   // Não inferir erro, emergência ou gasto opcional apenas por haver saque.
   nota:null};
 });
 const resumo=meses.map(mes=>{
  const h=historico.find(h=>Number(h.mes)===mes);
  const doMes=eventos.filter(e=>e.mes===mes);
  const aporte=doMes.filter(e=>e.tipo==='aporte').reduce((a,e)=>a+e.valor,0);
  const uso=doMes.filter(e=>e.tipo==='uso').reduce((a,e)=>a+e.valor,0);
  const anterior=historico.find(h=>Number(h.mes)===mes-1);
  const saldoAnterior=mes===1?null:Number.isFinite(Number(anterior?.reserva))?Number(anterior.reserva):null;
  const saldoFinal=h&&h.reserva!==null&&h.reserva!==undefined&&Number.isFinite(Number(h.reserva))?Number(h.reserva):null;
  const recomposicaoObservada=uso===0&&aporte>0&&eventos.some(e=>e.tipo==='uso'&&e.mes<mes);
  return {mes,aporte,uso,saldoAnterior,saldoFinal,recomposicaoObservada,
   coberturaHistorico:!!h,necessitaContexto:doMes.some(e=>e.classificacao==='requer-contexto')};
 });
 const pendencias=[];
 if(!meses.every(m=>historico.some(h=>Number(h.mes)===m)))pendencias.push('historico-incompleto');
 if(eventos.some(e=>e.classificacao==='requer-contexto'))pendencias.push('finalidade-de-usos-nao-comprovada');
 if(movimentosValidos.some(m=>m.escolhaId&&!escolhasPorId.has(m.escolhaId)))pendencias.push('escolhas-referenciadas-ausentes');
 // A ausência de aporte ou de recomposição não gera penalidade sem oportunidade financeira demonstrada.
 pendencias.push('avaliacao-de-oportunidade-financeira-ainda-necessaria');
 return {metodo:'auditoria-factual-reserva-etapa27',nota:null,meses:resumo,eventos,pendencias,
  regras:['Uso em déficit não é erro automático','Ausência de aporte não é erro automático',
   'Recomposição só pode ser cobrada quando houver oportunidade comprovada']};
}

// Etapa 28 — avaliação contextual conservadora (15 pontos).
// Não transforma ausência de evidência em nota, nem exige aporte/recomposição
// quando não há oportunidade financeira documentada.
function avaliarGestaoReservaEtapa28V120(historico=[],movimentos=[],escolhas=[]){
 const auditoria=auditarGestaoReservaV120(historico,movimentos,escolhas);
 const meses=[1,2,3,4,5,6];
 if(!Array.isArray(historico)||historico.length!==6||!meses.every(m=>historico.filter(h=>Number(h.mes)===m).length===1))
  return {nota:null,pontos:null,metodo:'historico-incompleto',auditoria};
 if(auditoria.pendencias.includes('finalidade-de-usos-nao-comprovada')||auditoria.pendencias.includes('escolhas-referenciadas-ausentes'))
  return {nota:null,pontos:null,metodo:'finalidade-ou-escolha-pendente',auditoria};
 const eventos=auditoria.eventos;
 if(!eventos.length)return {nota:null,pontos:null,metodo:'sem-evidencia-de-gestao',auditoria};
 // Validação dos saldos registrados, quando os movimentos documentam início e fim.
 const movimentosValidos=(Array.isArray(movimentos)?movimentos:[]).filter(m=>eventos.some(e=>e.id===m.id));
 for(const m of movimentosValidos){
  const antes=Number(m.saldoAntes),depois=Number(m.saldoDepois),valor=Number(m.valor);
  if(m.saldoAntes===undefined||m.saldoDepois===undefined||![antes,depois,valor].every(Number.isFinite)||antes<0||depois<0||Math.abs(depois-(antes+(m.tipo==='aporte'?valor:-valor)))>0.011)
   return {nota:null,pontos:null,metodo:'movimento-sem-saldo-conciliado',auditoria};
 }
 const temAporte=eventos.some(e=>e.tipo==='aporte');
 const usoResponsavel=eventos.filter(e=>e.tipo==='uso').every(e=>e.finalidade==='cobertura-deficit');
 if(temAporte&&usoResponsavel)
  return {nota:1,pontos:15,metodo:'gestao-responsavel-documentada',auditoria,
   justificativa:'Aportes comprovados e eventuais usos exclusivamente para cobrir déficits documentados; não se exige recomposição automática.'};
 return {nota:null,pontos:null,metodo:'oportunidade-e-conduta-ainda-pendentes',auditoria};
}

// Etapa 29 — composição conservadora: nota factual máxima ou avaliações explícitas
// dos seis meses. Não deduz nota intermediária a partir de saldo ou de saque.
function avaliarGestaoReservaEtapa29V120(historico=[],movimentos=[],escolhas=[],registros=[]){
 const factual=avaliarGestaoReservaEtapa28V120(historico,movimentos,escolhas);
 const completo=Array.isArray(historico)&&historico.length===6&&
  [1,2,3,4,5,6].every(m=>historico.filter(h=>Number(h.mes)===m).length===1);
 if(!completo)return {nota:null,pontos:null,metodo:'historico-incompleto',factual};
 // Evidências conflitantes ou saldos inválidos bloqueiam qualquer nota.
 if(['movimento-sem-saldo-conciliado','finalidade-ou-escolha-pendente'].includes(factual.metodo))
  return {nota:null,pontos:null,metodo:'auditoria-factual-pendente',factual};
 const aval=(Array.isArray(registros)?registros:[]).filter(r=>r&&r.categoria==='planejamento'&&r.comportamento==='reserva');
 const validos=aval.every(r=>Number.isInteger(Number(r.mes))&&Number(r.mes)>=1&&Number(r.mes)<=6&&
  notaDiretaValidaIndicadoresV120(r)&&Number(r.nota)>=0&&Number(r.nota)<=1);
 const cobertura=validos&&[1,2,3,4,5,6].every(m=>aval.some(r=>Number(r.mes)===m));
 const notasMes=cobertura?[1,2,3,4,5,6].map(m=>{
  const rs=aval.filter(r=>Number(r.mes)===m);
  return rs.reduce((a,r)=>a+Number(r.nota),0)/rs.length;
 }):null;
 if(notasMes){
  const nota=notasMes.reduce((a,b)=>a+b,0)/6;
  // Se as avaliações explícitas divergem da conclusão factual máxima, não escolher
  // silenciosamente a maior nota: manter pendente para auditoria.
  if(factual.nota===1&&nota<1-1e-9)
   return {nota:null,pontos:null,metodo:'evidencias-conflitantes',factual,notasMes};
  return {nota,pontos:15*nota,metodo:'media-mensal-contextual-documentada',notasMes,factual};
 }
 if(factual.nota===1)return {nota:1,pontos:15,metodo:'gestao-responsavel-documentada',factual};
 return {nota:null,pontos:null,metodo:'avaliacoes-mensais-incompletas',factual};
}

// Etapa 30: evidências automáticas por mês, independentes das notas legadas.
// Não classificar ausência de aporte como erro: dinheiro livre e prioridades
// pessoais não são necessariamente uma oportunidade perdida.
function gerarAvaliacoesReservaAutomaticasV120(historico=[],movimentos=[],escolhas=[]){
 const meses=[1,2,3,4,5,6],resultados=[];
 for(const mes of meses){
  const h=historico.find(x=>Number(x.mes)===mes);
  if(!h){resultados.push({mes,nota:null,motivo:'mes-nao-concluido'});continue;}
  const ms=(movimentos||[]).filter(x=>Number(x.mes)===mes);
  const auditoria=auditarGestaoReservaV120([h],ms,escolhas);
  const orc=(escolhas||[]).filter(e=>Number(e.mes)===mes&&e.tipo==='orcamento');
  const usos=auditoria.eventos.filter(e=>e.tipo==='uso');
  const aporte=auditoria.eventos.some(e=>e.tipo==='aporte');
  const inconsistentes=ms.some(m=>!Number.isFinite(Number(m.saldoAntes))||!Number.isFinite(Number(m.saldoDepois))||
   !Number.isFinite(Number(m.valor))||Number(m.valor)<=0||
   Math.abs(Number(m.saldoDepois)-Number(m.saldoAntes)-(m.tipo==='aporte'?Number(m.valor):-Number(m.valor)))>.011);
  if(inconsistentes||usos.some(e=>e.classificacao==='requer-contexto')){
   resultados.push({mes,nota:null,motivo:inconsistentes?'movimentos-inconsistentes':'uso-sem-finalidade-comprovada'});continue;
  }
  // Só reconhecer excelência automática quando a escolha é observável,
  // sem gastos opcionais financiados, pendências essenciais ou déficits.
  const essenciais=Number(h.essenciaisNaoPagas);
  const regular=h.essenciaisNaoPagas!==null&&h.essenciaisNaoPagas!==undefined&&
   Number.isFinite(essenciais)&&essenciais===0&&h.deficit===false;
  const escolhasOrcamento=orc.length===1;
  const consumoOpcional=orc.some(e=>Number(e.detalhes?.gastoAdicional)>0);
  if(regular&&escolhasOrcamento&&!consumoOpcional){
   resultados.push({mes,nota:1,motivo:aporte?'aporte-e-prioridades-responsaveis':'prioridades-responsaveis-sem-aporte',origem:'evidencia-automatica'});
  }else{
   resultados.push({mes,nota:null,motivo:!escolhasOrcamento?'orcamento-nao-comprovado':!regular?'contexto-financeiro-a-avaliar':'gasto-opcional-exige-contexto'});
  }
 }
 return {metodo:'avaliacao-automatica-conservadora-etapa30',meses:resultados,
  completos:resultados.filter(x=>x.nota!==null).length,
  nota:resultados.every(x=>x.nota!==null)?resultados.reduce((s,x)=>s+x.nota,0)/6:null,
  pendencias:resultados.filter(x=>x.nota===null).map(x=>({mes:x.mes,motivo:x.motivo}))};
}

// Apenas registros explicitamente contextuais podem avaliar gestão da reserva.
// Os registros legados registram somente a existência de aporte (0/1).
function registrosContextuaisReservaV120(registros=[]){
 return (Array.isArray(registros)?registros:[]).filter(r=>r&&r.categoria==='planejamento'&&r.comportamento==='reserva'&&r.origemAvaliacao==='contextual');
}

// Etapa 31 — integração conservadora das evidências automáticas ao cálculo de 15 pontos.
// Evidência automática só preenche mês sem avaliação explícita; divergências
// com avaliações documentadas são auditadas, não resolvidas escolhendo a maior nota.
function avaliarGestaoReservaEtapa31V120(historico=[],movimentos=[],escolhas=[],registros=[]){
 const auto=gerarAvaliacoesReservaAutomaticasV120(historico,movimentos,escolhas);
 const contextuais=registrosContextuaisReservaV120(registros);
 const manual=avaliarGestaoReservaEtapa29V120(historico,movimentos,escolhas,contextuais);
 const completo=Array.isArray(historico)&&historico.length===6&&[1,2,3,4,5,6].every(m=>historico.filter(h=>Number(h.mes)===m).length===1);
 if(!completo)return {nota:null,pontos:null,metodo:'historico-incompleto',automatico:auto,manual};
 if(['auditoria-factual-pendente','evidencias-conflitantes'].includes(manual.metodo))
  return {nota:null,pontos:null,metodo:'auditoria-pendente',automatico:auto,manual};
 const aval=contextuais;
 const notas=[],origens=[];
 for(let mes=1;mes<=6;mes++){
  const rs=aval.filter(r=>Number(r.mes)===mes);
  const validos=rs.every(r=>notaDiretaValidaIndicadoresV120(r)&&Number(r.nota)>=0&&Number(r.nota)<=1);
  if(!validos)return {nota:null,pontos:null,metodo:'avaliacao-explicita-invalida',mes,automatico:auto,manual};
  const automatica=auto.meses.find(r=>r.mes===mes);
  if(rs.length){
   const n=rs.reduce((sum,r)=>sum+Number(r.nota),0)/rs.length;
   if(automatica.nota!==null&&Math.abs(n-automatica.nota)>1e-9)
    return {nota:null,pontos:null,metodo:'divergencia-manual-automatica',mes,notaManual:n,notaAutomatica:automatica.nota,automatico:auto,manual};
   notas.push(n);origens.push({mes,origem:'avaliacao-documentada',nota:n});
  }else if(automatica.nota!==null){
   notas.push(automatica.nota);origens.push({mes,origem:'evidencia-automatica',nota:automatica.nota});
  }else return {nota:null,pontos:null,metodo:'mes-sem-evidencia-suficiente',mes,motivo:automatica.motivo,automatico:auto,manual};
 }
 const nota=notas.reduce((a,b)=>a+b,0)/6;
 if(manual.factual?.nota===1&&nota<1-1e-9)
  return {nota:null,pontos:null,metodo:'divergencia-factual',automatico:auto,manual};
 return {nota,pontos:15*nota,metodo:'integracao-mensal-auditavel-etapa31',origens,automatico:auto,manual};
}

// Etapa 24 — componentes auditáveis de Reserva e Objetivos (15 + 10 + 15).
// Dados incompletos não viram zero ou nota máxima. Não se presume que ausência
// de aporte seja falha: dinheiro livre pode ser decisão responsável.
function avaliarReservaObjetivosV120(historico=[],registros=[],escolhas=[],movimentos=[]){
 const numero=x=>x===null||x===undefined||x===''?null:(Number.isFinite(Number(x))?Number(x):null);
 const completo=historico.length===6&&[1,2,3,4,5,6].every(m=>historico.some((h,i)=>Number(h.mes??i+1)===m));
 const ordenado=[...historico].sort((a,b)=>Number(a.mes)-Number(b.mes));
 const metas=ordenado.map(h=>({mes:Number(h.mes),valor:numero(h.meta),alvo:numero(h.metaValor),reserva:numero(h.reserva)}));
 const orcamentos=(Array.isArray(escolhas)?escolhas:[]).filter(e=>e.tipo==='orcamento'||e.categoria==='orcamento');
 const dadosObjetivo=completo&&metas.every(m=>m.valor!==null&&m.alvo!==null&&m.alvo>0);
 const ultimo=metas[5];
 // Realização: meta atingida e sustentada, ou progresso parcial documentado.
 // Atingir a meta com contas vencidas não comprova sustentabilidade.
 const sustentavel=completo&&ordenado.every(h=>numero(h.essenciaisNaoPagas)!==null&&numero(h.essenciaisNaoPagas)===0);
 const fracao=dadosObjetivo?Math.max(0,Math.min(1,ultimo.valor/ultimo.alvo)):null;
 const realizacao=fracao===null?null:(fracao===1&&sustentavel?1:fracao===1?null:fracao);
 // Planejamento requer evidência de escolha consciente; só o saldo final não basta.
 const validas=(comportamento)=>registros.filter(r=>r.categoria==='planejamento'&&r.comportamento===comportamento&&
  Number.isInteger(Number(r.mes))&&Number(r.mes)>=1&&Number(r.mes)<=6&&
  notaDiretaValidaIndicadoresV120(r)&&Number(r.nota)>=0&&Number(r.nota)<=1);
 const cobertura=(arr)=>[1,2,3,4,5,6].every(m=>arr.some(r=>Number(r.mes)===m));
 const evidenciasPlanejamento=validas('objetivo');
 const planejamento=completo&&cobertura(evidenciasPlanejamento)?
  evidenciasPlanejamento.reduce((s,r)=>s+Number(r.nota),0)/evidenciasPlanejamento.length:null;
 // A gestão da reserva exige avaliação contextual explícita, inclusive do uso
 // em emergências e eventual recomposição. Saldo alto ou ausência de saque
 // não são evidências suficientes para atribuir 15/15.
 const evidenciasReserva=validas('reserva');
 const usoReserva=(Array.isArray(escolhas)?escolhas:[]).filter(e=>
  /reserva|deficit|imprevisto|resolucao-deficit/.test(String(e.tipo??e.categoria??'')) ||
  (e.tipo==='orcamento'&&Number(e.detalhes?.reserva)>0));
 const gestaoDetalhe=avaliarGestaoReservaEtapa31V120(historico,movimentos,escolhas,registros);
 const gestao=gestaoDetalhe.nota;
 const componentes={reserva:{maximo:15,nota:gestao,motivo:gestao===null?'Faltam avaliações contextuais da reserva nos seis meses, incluindo uso e recomposição quando aplicável':'Média das avaliações contextuais documentadas da reserva'},planejamento:{maximo:10,nota:planejamento,motivo:planejamento===null?'Faltam avaliações contextualizadas dos seis meses':'Média das avaliações documentadas'},realizacao:{maximo:15,nota:realizacao,motivo:realizacao===null?'Faltam dados ou comprovação de sustentabilidade da meta':'Progresso observado em relação à meta'}};
 const pronto=Object.values(componentes).every(c=>c.nota!==null);
 return {nota:pronto?(15*gestao+10*planejamento+15*realizacao)/40:null,componentes,metodo:'componentes_independentes_15_10_15',avaliacaoGestaoReserva:gestaoDetalhe,evidencias:{meses:metas,orcamentos:orcamentos.length,decisoesReserva:usoReserva.length,avaliacoesReserva:evidenciasReserva.length,mesesReserva:[...new Set(evidenciasReserva.map(r=>Number(r.mes)))].sort(),avaliacoesPlanejamento:evidenciasPlanejamento.length},pendencias:Object.entries(componentes).filter(([,v])=>v.nota===null).map(([k])=>k)};
}

// Etapa 7: avaliador contextual paralelo. Só atribui pontos quando a evidência
// permite a conclusão; ausência de oportunidade não é tratada como falha.
// Não substitui a nota do jogador enquanto houver itens pendentes.
function avaliarContextoV120(registros=[], historico=[], escolhas=[]){
 const base=pontuacaoAuditavelV120(registros,historico);
 const limite=x=>Math.max(0,Math.min(1,x));
 const num=x=>x===null||x===undefined||x===''?null:(Number.isFinite(Number(x))?Number(x):null);
 const media=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
 const meses=indicadoresMensais(historico,registros);
 const eventos=Array.isArray(escolhas)?escolhas:[];
 const aval=(cat,comp)=>registros.filter(r=>r.categoria===cat&&comp.includes(r.comportamento)&&num(r.nota)!==null).map(r=>limite(Number(r.nota)));
 const dados=historico.map((h,i)=>({mes:num(h.mes)??i+1,margem:num(h.margemMes),parcelas:num(h.parcelaProxima),divida:num(h.dividas),deficit:h.deficit===true,essenciais:h.essenciaisDecisao}));
 const completos=historico.length===6&&[1,2,3,4,5,6].every(m=>historico.some((h,i)=>Number(h.mes??i+1)===m));
 const itens=base.itens.map(item=>{
  let nota=null, evidencia=[], metodo='evidencia_contextual_pendente', componentes=null;
  const id=item.id;
  // Avaliações individuais: média de TODAS as decisões, não média de meses.
  if(id==='planejamento.orcamento'){
   const inicial=avaliarEssenciaisV120(historico,registros);
   const gradual=avaliarEssenciaisGradualV120(historico,registros);
   const resultado=gradual.nota!==null?gradual:(inicial.nota!==null&&gradual.metodo!=='contexto_mensal_insuficiente'?inicial:gradual);
   nota=resultado.nota;metodo=resultado.metodo;evidencia=[`${resultado.evidencias??0} meses ou avaliações documentadas`];
  }
  else if(id==='planejamento.compromissos'){
   const inicial=avaliarPagamentosParcelasV120(historico,registros);
   const gradual=avaliarParcelasGradualV120(historico,registros);
   const resultado=gradual.nota!==null?gradual:gradual; // Não usar média parcial direta para encobrir meses pendentes.
   nota=resultado.nota;metodo=resultado.metodo;
   evidencia=[`${resultado.evidencias??0} avaliações contextuais diretas`, 'Capacidade de pagamento não substitui avaliação de juros, necessidade e cumprimento'];
  }
  else if(id==='planejamento.objetivo'){
   const resultado=avaliarReservaObjetivosV120(historico,registros,escolhas);
   nota=resultado.nota;metodo=resultado.metodo;evidencia=[...resultado.pendencias.map(x=>'Pendente: '+x)];
   componentes=resultado.componentes;
  }
  else if(id==='decisoes.viabilidade'){
   const notas=aval('decisoes',['viabilidade']);
   nota=media(notas); evidencia=notas.length?[`${notas.length} decisões individuais avaliadas`]:[];
   metodo='media_decisoes_individuais';
  }
  // Os outros critérios usam avaliações específicas já capturadas, sem fatores globais.
  else if(id!=='planejamento.futuro'){
   const [cat,sub]=id.split('.');
   const vinculos=VINCULOS_V120[id]||[];
   const notas=registros.filter(r=>vinculos.includes(r.categoria+'.'+r.comportamento)&&num(r.nota)!==null).map(r=>limite(Number(r.nota)));
   if(notas.length){nota=media(notas);evidencia=[`${notas.length} avaliações contextuais`];metodo='media_evidencias_diretas';}
  }
  // 54/6 aprovado: dois blocos observados de 27 pontos e projeção de 6.
  // Os resultados são separados para impedir estimativas silenciosas.
  if(id==='planejamento.futuro'){
   const validos=dados.filter(d=>d.margem!==null&&d.parcelas!==null&&d.divida!==null);
   const equilibrioInfo=avaliarEquilibrioObservadoV120(historico,registros);
   const equilibrio=equilibrioInfo.nota;
   // Evolução precisa de comparação temporal e do contexto das decisões;
   // não inferir melhora a partir da inexistência de dívida.
   const evolucaoInfo=avaliarEvolucaoObservadaV120(historico,registros);
   const evolucao=evolucaoInfo.nota;
   const projecaoInfo=avaliarProjecaoFuturaV120(historico,registros);
   const projecao=projecaoInfo.nota;
   componentes={equilibrioMensal:{maximo:27,nota:equilibrio},evolucaoObservada:{maximo:27,nota:evolucao},projecao:{maximo:6,nota:projecao}};
   if(Object.values(componentes).every(c=>c.nota!==null)){
    nota=(27*equilibrio+27*evolucao+6*projecao)/60;
   }
   evidencia=[`${validos.length}/6 meses com dados de margem, parcelas e dívida`,
    `equilíbrio: ${equilibrio===null?'pendente':equilibrioInfo.metodo}`,
    `evolução: ${evolucao===null?'pendente':evolucaoInfo.metodo}`,
    `projeção: ${projecaoInfo.metodo}`];
   metodo='composicao_27_27_6';
  }
  return {...item,media:nota,pontos:nota===null?null:Math.round(item.maximo*nota),
   pendente:nota===null,metodo,evidencia,componentes,
   motivo:nota===null?'Evidência insuficiente: não estimar nem compensar por outro critério.':'Nota independente, sem fator global de harmonização.'};
 });
 const total=itens.every(i=>!i.pendente)?itens.reduce((s,i)=>s+i.pontos,0):null;
 return {versao:'1.20-etapa7',status:total===null?'incompleto_nao_exibir_como_nota':'calculado_experimental_nao_validado',
  meses:meses.length,partidaCompleta:completos,escolhasRegistradas:eventos.length,
  itens,totalParcialAuditado:itens.reduce((s,i)=>s+(i.pontos??0),0),totalFinal:completos?total:null,
  pendentes:itens.filter(i=>i.pendente).map(i=>i.id),
  regra:'Pontuações independentes; dados ausentes não equivalem a zero nem a 75%; não harmonizar.'};
}


// Etapa 8: matriz de oportunidades e evidências, independente das notas.
// Ausência de evento NÃO prova desempenho excelente nem fracasso.
const OPORTUNIDADES_V120={
 'decisoes.dividas':['credito','renegociacao'],
 'decisoes.oportunidades':['imprevisto'],
 'adaptacao.imprevistos':['imprevisto'],
 'adaptacao.reorganizacao':['deficit','renegociacao','recuperacao'],
 'recursos.credito':['credito'],
 'planejamento.compromissos':['credito','parcelamento']
};
function auditarOportunidadesV120(registros=[],historico=[],escolhas=[]){
 const validas=new Set(['apresentada','nao_apresentada','desconhecida']);
 const eventos=Array.isArray(escolhas)?escolhas:[];
 const itens=[];
 for(const [grupo,sub] of Object.entries(RUBRICA_V120))for(const [chave,maximo] of Object.entries(sub)){
  const id=grupo+'.'+chave;
  const tipos=OPORTUNIDADES_V120[id]||[];
  const relacionados=eventos.filter(e=>tipos.includes(String(e.tipo??e.categoria??e.eventoTipo??'')));
  const marcados=relacionados.map(e=>e.oportunidade).filter(v=>validas.has(v));
  const status=!tipos.length?'avaliacao_continua':(relacionados.length>0&&marcados.length===0)?'apresentada_sem_marcador':marcados.includes('apresentada')?'apresentada':
   relacionados.length&&marcados.length===relacionados.length&&marcados.every(v=>v==='nao_apresentada')?'nao_apresentada':'desconhecida';
  itens.push({id,maximo,status,tipos,ocorrencias:relacionados.length,
   caminhoAlternativo:status==='nao_apresentada'?'exige_evidencia_de_prevencao_ou_manutencao':null,
   regra:'O status da oportunidade não atribui pontos; cada subcritério conserva sua avaliação independente.'});
 }
 return {versao:'1.20-etapa8',itens,desconhecidos:itens.filter(i=>i.status==='desconhecida').map(i=>i.id),
  aviso:'Sem oportunidade não significa nota máxima; evidências alternativas devem ser verificadas.'};
}
function diagnosticoEtapa8V120(registros=[],historico=[],escolhas=[]){
 const calculo=avaliarContextoV120(registros,historico,escolhas);
 const oportunidades=auditarOportunidadesV120(registros,historico,escolhas);
 const pendentes=calculo.itens.filter(i=>i.pendente).map(i=>({id:i.id,motivo:i.motivo,
  oportunidade:oportunidades.itens.find(o=>o.id===i.id)?.status??'desconhecida'}));
 return {versao:'1.20-etapa8',calculoExperimental:calculo, oportunidades,
  pendentes,prontoParaSubstituirNota:false,
  testesNecessarios:['partida_real_6_meses','trajetoria_excelente_1000','credito_sem_juros','recuperacao','sem_imprevistos'],
  aviso:'Não publicar nem substituir a pontuação exibida antes da validação de ponta a ponta.'};
}

// Etapa 9: contrato de qualidade dos dados, sem fabricar pontos ou oportunidades.
function verificarProntidaoV120(registros=[],historico=[],escolhas=[]){
 const meses=historico.map((h,i)=>Number(h.mes??i+1));
 const mesesValidos=meses.length===6&&new Set(meses).size===6&&meses.every(m=>Number.isInteger(m)&&m>=1&&m<=6);
 const invalidos=[];
 for(const [i,r] of registros.entries()){
  if(r.nota===null||r.nota===undefined||r.nota===''||!Number.isFinite(Number(r.nota))||Number(r.nota)<0||Number(r.nota)>1)invalidos.push({indice:i,motivo:'nota_invalida'});
  if(!Number.isInteger(Number(r.mes))||Number(r.mes)<1||Number(r.mes)>6)invalidos.push({indice:i,motivo:'mes_invalido'});
 }
 const calculo=avaliarContextoV120(registros,historico,escolhas);
 const oportunidades=auditarOportunidadesV120(registros,historico,escolhas);
 const pendentes=calculo.itens.filter(i=>i.pendente).map(i=>i.id);
 return {versao:'1.20-etapa9',mesesValidos,registrosInvalidos:invalidos,
  subcriterios:calculo.itens.length,pendentes,
  oportunidadesSemClassificacao:oportunidades.desconhecidos,
  notaExperimental:mesesValidos&&invalidos.length===0&&pendentes.length===0?calculo.totalFinal:null,
  prontoParaPublicacao:false,
  motivo:'Ainda faltam fórmulas contextuais completas e validação por partidas reais; nota legada preservada.'};
}

// Etapa 10: inventário verificável das lacunas, sem criar notas substitutas.
function inventariarLacunasV120(registros=[],historico=[],escolhas=[]){
 const pronto=verificarProntidaoV120(registros,historico,escolhas);
 const aval=avaliarContextoV120(registros,historico,escolhas);
 const oportunidades=auditarOportunidadesV120(registros,historico,escolhas);
 const itens=aval.itens.map(i=>{
  const o=oportunidades.itens.find(x=>x.id===i.id);
  const meses=[...new Set(registros.filter(r=>(VINCULOS_V120[i.id]||[]).includes(r.categoria+'.'+r.comportamento)).map(r=>Number(r.mes)).filter(m=>Number.isInteger(m)&&m>=1&&m<=6))].sort((a,b)=>a-b);
  return {id:i.id,maximo:i.maximo,metodo:i.metodo,mesesComRegistro:meses,
   registrosDiretos:i.registros,estado:i.pendente?'evidencia_insuficiente':'calculo_experimental',
   oportunidade:o?.status??'desconhecida',componentes:i.componentes??null,
   proximaAcao:i.pendente?'Instrumentar a evidência contextual específica; não inferir nota por ausência de evento.':'Validar regra e resultado com partida completa.'};
 });
 return {versao:'1.20-etapa10',mesesValidos:pronto.mesesValidos,subcriterios:itens.length,
  pesoTotal:itens.reduce((n,i)=>n+i.maximo,0),itens,
  pendentes:itens.filter(i=>i.estado==='evidencia_insuficiente').map(i=>i.id),
  notaPublicavel:null,prontoParaPublicacao:false,
  aviso:'Inventário técnico, não nota final; não suavizar pontuações nem preencher ausências.'};
}

// Etapa 11: auditoria de qualidade de evidências; nunca converte cobertura em nota.
function auditarQualidadeEvidenciasV120(registros=[],historico=[]){
 const falhas=[];
 const valido=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x));
 for(const [i,r] of registros.entries()){
  if(!valido(r.nota))falhas.push({indice:i,tipo:'nota_ausente'});
  else if(Number(r.nota)<0||Number(r.nota)>1)falhas.push({indice:i,tipo:'nota_fora_intervalo'});
  if(!Number.isInteger(Number(r.mes))||Number(r.mes)<1||Number(r.mes)>6)falhas.push({indice:i,tipo:'mes_invalido'});
 }
 const meses=historico.map((h,i)=>Number(h.mes??i+1));
 const mesesValidos=meses.length===6&&[1,2,3,4,5,6].every(m=>meses.filter(n=>n===m).length===1);
 const cobertura=inventariarLacunasV120(registros,historico);
 return {versao:'1.20-etapa11',mesesValidos,falhas,subcriterios:cobertura.subcriterios,
  pendentes:cobertura.pendentes,prontoParaSubstituirNota:false,
  observacao:'Auditoria de qualidade: não conclui fórmulas nem valida partidas reais.'};
}

// Etapa 22: cobertura por DECISÃO e por mês, sem inventar notas.
// Uma escolha pode sustentar vários subcritérios, mas avaliações repetidas do
// mesmo subcritério para a mesma escolha são sinalizadas para revisão.
function auditarCoberturaDecisoesV120(registros=[],historico=[],escolhas=[]){
 const ids=Object.keys(VINCULOS_V120);
 const linhas=[];
 const valida=r=>notaDiretaValidaIndicadoresV120(r)&&Number(r.nota)>=0&&Number(r.nota)<=1;
 for(const id of ids){
  const vinculos=VINCULOS_V120[id]||[];
  const vinculados=registros.map((r,i)=>({...r,indice:i})).filter(r=>vinculos.includes(r.categoria+'.'+r.comportamento));
  const validos=vinculados.filter(valida);
  const grupos=new Map();
  for(const r of validos){
   if(r.escolhaId===null||r.escolhaId===undefined||r.escolhaId==='')continue;
   const chave=String(r.mes)+'|'+String(r.escolhaId);
   if(!grupos.has(chave))grupos.set(chave,[]);
   grupos.get(chave).push(r.indice);
  }
  const repeticoes=[...grupos.entries()].filter(([,indices])=>indices.length>1).map(([chave,indices])=>({chave,indices}));
  const meses=[...new Set(validos.map(r=>Number(r.mes)).filter(m=>Number.isInteger(m)&&m>=1&&m<=6))].sort((a,b)=>a-b);
  const semIdentificador=validos.filter(r=>!r.escolhaId).map(r=>r.indice);
  linhas.push({id,registros:vinculados.length,validos:validos.length,meses,
   registrosSemNota:vinculados.filter(r=>!valida(r)).map(r=>r.indice),
   semIdentificador,repeticoes,
   observacao:'Cobertura técnica; não indica pontuação merecida nem exige avaliação em todo mês.'});
 }
 const cruzadas=new Map();
 for(const l of linhas)for(const r of registros){
  if(!r.escolhaId||!valida(r)||!(VINCULOS_V120[l.id]||[]).includes(r.categoria+'.'+r.comportamento))continue;
  const k=String(r.mes)+'|'+String(r.escolhaId);
  if(!cruzadas.has(k))cruzadas.set(k,new Set());
  cruzadas.get(k).add(l.id);
 }
 return {versao:'1.20-etapa22',itens:linhas,
  escolhasMulticriterio:[...cruzadas.entries()].filter(([,v])=>v.size>1).map(([escolhaId,v])=>({escolhaId,criterios:[...v]})),
  repeticoesParaRevisar:linhas.flatMap(l=>l.repeticoes.map(r=>({criterio:l.id,...r}))),
  alerta:'Repetição é suspeita, não desconto automático. Evidências distintas da mesma escolha podem ser legítimas.'};
}

// Etapa 39: diagnóstico de instrumentação, sem criar notas ou alterar a rubrica.
function diagnosticarEvidenciasEtapa39V120(registros=[],historico=[],escolhas=[]){
 const avaliacao=avaliarContextoV120(registros,historico,escolhas);
 const cobertura=auditarCoberturaDecisoesV120(registros,historico,escolhas);
 const plano={
  'planejamento.orcamento':'Registrar pagamento, atraso e regularização de essenciais em cada mês.',
  'planejamento.compromissos':'Registrar capacidade, juros, necessidade e cumprimento de cada parcela.',
  'planejamento.futuro':'Conferir margem, dívidas e compromissos após o sexto mês.',
  'planejamento.objetivo':'Registrar reserva, plano da meta e realização sustentável separadamente.',
  'decisoes.viabilidade':'Avaliar cada alternativa escolhida com o contexto financeiro da decisão.',
  'decisoes.dividas':'Registrar capacidade, custos, parcelas e renegociação quando aplicável.',
  'decisoes.consequencias':'Registrar impactos, compromissos e correções posteriores.',
  'decisoes.oportunidades':'Registrar avaliação, solução e consequências dos imprevistos apresentados.',
  'recursos.essenciais':'Registrar priorização de despesas essenciais e consequências.',
  'recursos.custos':'Registrar gastos adicionais, margem e constância.',
  'recursos.credito':'Registrar finalidade, custo e sustentabilidade do crédito.',
  'recursos.equilibrio':'Registrar equilíbrio, margem e consistência ao longo dos meses.',
  'adaptacao.imprevistos':'Registrar decisões diante dos imprevistos realmente apresentados.',
  'adaptacao.reorganizacao':'Registrar reorganização e recuperação quando necessárias.',
  'adaptacao.evolucao':'Registrar trajetória financeira observada ao longo dos seis meses.',
  'adaptacao.futuro':'Registrar compromissos e sustentabilidade após o mês seis.'
 };
 const itens=avaliacao.itens.map(i=>{
  const c=cobertura.itens.find(x=>x.id===i.id);
  return {id:i.id,maximo:i.maximo,estado:i.pendente?'pendente':'calculado_experimental',
   metodo:i.metodo,registrosDiretos:c?c.validos:0,
   mesesComRegistros:c?c.meses:[],
   evidencias:i.evidencia||[],
   proximaInstrumentacao:plano[i.id],
   observacao:i.pendente?'Ausência de nota não é desempenho zero.':'Nota ainda requer validação de trajetória.'};
 });
 return {versao:'1.20-etapa39',meses:historico.length,totalSubcriterios:itens.length,
  pendentes:itens.filter(i=>i.estado==='pendente').map(i=>i.id),itens,
  notaPublicavel:null,alterouPontuacao:false,
  aviso:'Diagnóstico técnico, não avaliação do jogador; não inferir notas nem substituir o placar legado.'};
}


// Etapa 43: conferir integridade dos vínculos e lacunas reais, sem gerar notas.
function auditarVinculosEtapa43V120(registros=[],historico=[],escolhas=[]){
 const ev=Array.isArray(escolhas)?escolhas:[];
 const ids=new Map(),duplicados=[],orfaos=[],semIdentificador=[],mesesInconsistentes=[];
 for(const [indice,e] of ev.entries()){
  const id=e&&e.id;
  if(typeof id!=='string'||!id.trim()){semIdentificador.push({origem:'escolha',indice});continue;}
  if(ids.has(id))duplicados.push({id,indices:[ids.get(id),indice]});
  else ids.set(id,indice);
 }
 for(const [indice,r] of registros.entries()){
  if(!r||typeof r!=='object')continue;
  const id=r.escolhaId;
  if(id===null||id===undefined||id===''){semIdentificador.push({origem:'avaliacao',indice,categoria:r.categoria,comportamento:r.comportamento});continue;}
  if(!ids.has(id)){orfaos.push({indice,escolhaId:id});continue;}
  const escolha=ev[ids.get(id)];
  if(Number.isInteger(Number(r.mes))&&Number.isInteger(Number(escolha.mes))&&Number(r.mes)!==Number(escolha.mes))
   mesesInconsistentes.push({indice,escolhaId:id,mesAvaliacao:r.mes,mesEscolha:escolha.mes});
 }
 const diagnostico=diagnosticarEvidenciasEtapa39V120(registros,historico,ev);
 const criterios=diagnostico.itens.map(i=>({id:i.id,maximo:i.maximo,estado:i.estado,registrosDiretos:i.registrosDiretos,mesesComRegistros:i.mesesComRegistros,
  proximaInstrumentacao:i.proximaInstrumentacao}));
 return {versao:'1.20-etapa43',escolhas:ev.length,avaliacoes:registros.length,criterios,
  totalSubcriterios:criterios.length,pesoTotal:criterios.reduce((s,i)=>s+i.maximo,0),
  pendentes:criterios.filter(i=>i.estado==='pendente').map(i=>i.id),
  integridade:{duplicados,orfaos,semIdentificador,mesesInconsistentes},
  notaPublicavel:null,alterouPontuacao:false,
  observacao:'Auditoria de rastreabilidade. Avaliações sem escolhaId podem ser legadas ou mensais: investigar, não descartar nem pontuar automaticamente.'};
}

// Etapa 44: triagem conservadora das lacunas de rastreabilidade.
// Nunca altera registros nem associa automaticamente uma escolha a uma avaliação.
function triarVinculosEtapa44V120(registros=[],historico=[],escolhas=[]){
 const base=auditarVinculosEtapa43V120(registros,historico,escolhas);
 const validas=Array.isArray(escolhas)?escolhas:[];
 const avaliadas=Array.isArray(registros)?registros:[];
 const contagem=new Map();
 for(const e of validas){if(e&&typeof e.id==='string'&&e.id.trim())contagem.set(e.id,(contagem.get(e.id)||0)+1);}
 const pendencias=[];
 for(const problema of base.integridade.orfaos){
  const r=avaliadas[problema.indice]||{};
  const candidatos=validas.filter(e=>e&&contagem.get(e.id)===1&&Number.isInteger(Number(r.mes))&&Number(r.mes)===Number(e.mes)).map(e=>e.id);
  pendencias.push({tipo:'avaliacao_orfa',indice:problema.indice,referencia:problema.escolhaId,candidatosMesmoMes:candidatos,acao:'revisar_origem_sem_vincular_automaticamente'});
 }
 for(const problema of base.integridade.semIdentificador){
  if(problema.origem!=='avaliacao')continue;
  const r=avaliadas[problema.indice]||{};
  const candidatos=validas.filter(e=>e&&contagem.get(e.id)===1&&Number.isInteger(Number(r.mes))&&Number(r.mes)===Number(e.mes)).map(e=>e.id);
  pendencias.push({tipo:'avaliacao_sem_id',indice:problema.indice,candidatosMesmoMes:candidatos,acao:'verificar_se_avaliacao_mensal_ou_escolha_especifica'});
 }
 for(const problema of base.integridade.mesesInconsistentes)pendencias.push({tipo:'mes_divergente',indice:problema.indice,referencia:problema.escolhaId,acao:'verificar_se_efeito_financeiro_posterior_ou_erro'});
 for(const problema of base.integridade.duplicados)pendencias.push({tipo:'id_duplicado',referencia:problema.id,indices:problema.indices,acao:'verificar_geracao_de_identificadores'});
 return {versao:'1.20-etapa44',pendencias,quantidade:pendencias.length,integridade:base.integridade,
  cobertura:{totalSubcriterios:base.totalSubcriterios,pesoTotal:base.pesoTotal,pendentes:base.pendentes},
  notaPublicavel:null,alterouPontuacao:false,alterouRegistros:false,
  observacao:'Candidatos do mesmo mes sao apenas pistas; nao constituem prova de vinculo. Nenhuma associacao automatica.'};
}

// Etapa 46: diagnóstico de prontidão baseado em uma partida, sem atribuir notas.
function verificarPartidaEtapa46V120(registros=[],historico=[],escolhas=[],movimentosReserva=[]){
 const h=Array.isArray(historico)?historico:[],e=Array.isArray(escolhas)?escolhas:[],r=Array.isArray(registros)?registros:[];
 const base=auditarVinculosEtapa43V120(r,h,e);
 const meses=[...new Set(h.map(x=>Number(x.mes)).filter(x=>Number.isInteger(x)&&x>=1&&x<=6))].sort((a,b)=>a-b);
 const completos=meses.length===6&&meses.every((m,i)=>m===i+1);
 const ids=new Set(e.map(x=>x&&x.id).filter(x=>typeof x==='string'&&x));
 const vinculadas=r.filter(x=>x&&ids.has(x.escolhaId)).length;
 const escolhasPorTipo={};for(const x of e){const tipo=x&&x.tipo||'nao_informado';escolhasPorTipo[tipo]=(escolhasPorTipo[tipo]||0)+1;}
 const reserva=Array.isArray(movimentosReserva)?movimentosReserva:[];
 const reservaSemVinculo=reserva.filter(x=>x&&x.escolhaId&&!ids.has(x.escolhaId)).map(x=>x.id||null);
 const impeditivos=[];
 if(!completos)impeditivos.push({codigo:'meses_incompletos',detalhe:'É necessário observar o fechamento dos seis meses.',mesesPresentes:meses});
 if(base.integridade.duplicados.length)impeditivos.push({codigo:'ids_duplicados',quantidade:base.integridade.duplicados.length});
 if(base.integridade.orfaos.length)impeditivos.push({codigo:'avaliacoes_orfas',quantidade:base.integridade.orfaos.length});
 if(base.integridade.semIdentificador.length)impeditivos.push({codigo:'registros_sem_identificador',quantidade:base.integridade.semIdentificador.length});
 if(reservaSemVinculo.length)impeditivos.push({codigo:'reserva_sem_escolha',quantidade:reservaSemVinculo.length});
 const criterios=base.criterios.map(x=>({id:x.id,peso:x.maximo,estado:x.estado,registrosDiretos:x.registrosDiretos,
  evidenciasInsuficientes:x.estado==='pendente',
  observacao:x.estado==='pendente'?'Sem evidência suficiente para nota contextual.':'Cálculo experimental não validado em partida completa.'}));
 return {versao:'1.20-etapa46',mesesConcluidos:meses,partidaCompleta:completos,
  escolhasRegistradas:e.length,avaliacoesRegistradas:r.length,avaliacoesVinculadas:vinculadas,
  escolhasPorTipo,movimentosReserva:reserva.length,reservaSemVinculo,
  criterios,totalSubcriterios:criterios.length,pesoTotal:criterios.reduce((a,x)=>a+x.peso,0),
  criteriosPendentes:criterios.filter(x=>x.evidenciasInsuficientes).map(x=>x.id),impeditivos,
  prontaParaPublicar:false,notaPublicavel:null,alterouPontuacao:false,
  aviso:'Prontidão de evidências, não prova de justiça pedagógica nem validação dos 1000 pontos.'};
}
