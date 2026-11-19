"use strict";
// DECIDA 1.20 EXPERIMENTAL: rubrica 4 × 250. Fórmulas legadas ainda sob revisão; não publicar.
const PESOS={
 planejamento:{orcamento:80,compromissos:70,futuro:60,objetivo:40},
 decisoes:{viabilidade:70,dividas:80,consequencias:60,oportunidades:40},
 recursos:{essenciais:80,custos:70,credito:60,equilibrio:40},
 adaptacao:{imprevistos:90,recuperacao:80,reorganizacao:50,futuro:30}
};
const ROTULOS={planejamento:"Planejamento financeiro",decisoes:"Tomada de decisões",recursos:"Uso consciente dos recursos",adaptacao:"Adaptação e visão de futuro"};
const SUBROTULOS={planejamento:{orcamento:"Organização das contas essenciais",compromissos:"Planejamento dos pagamentos e parcelas",futuro:"Controle dos compromissos futuros",objetivo:"Reserva e objetivos"},decisoes:{viabilidade:"Avaliação das alternativas",dividas:"Crédito e renegociação",consequencias:"Consequências das escolhas",oportunidades:"Decisões diante de imprevistos"},recursos:{essenciais:"Prioridade às necessidades essenciais",custos:"Controle dos gastos adicionais",credito:"Uso responsável do crédito",equilibrio:"Equilíbrio entre consumo e orçamento"},adaptacao:{imprevistos:"Enfrentamento de imprevistos",recuperacao:"Reorganização e recuperação financeira",reorganizacao:"Evolução das decisões",futuro:"Sustentabilidade após o sexto mês"}};
const LIMITAR=(n,min=0,max=1)=>Math.max(min,Math.min(max,n));
// Etapa 132: margem zero/negativa não é transformada em capacidade de pagamento.
// Sem parcela a pressão é zero; com parcela e margem não positiva, é máxima.
function pressaoParcelaSobreMargem(parcela,margem){
 const p=Number(parcela),m=Number(margem);
 if(!Number.isFinite(p)||p<=0)return 0;
 if(!Number.isFinite(m)||m<=0)return 1.5;
 return Math.min(1.5,p/m);
}
// Etapa 139: evidencia observada de contas essenciais em seis meses completos.
// A ausência de uma decisão explícita em meses sem pergunta não é um adiamento.
// Só conclui cumprimento integral quando todos os fechamentos documentam
// o acumulado de contas não pagas e nenhum mês tem déficit observado.
function evidenciasEssenciaisEtapa139(historico=[]){
 const completo=Array.isArray(historico)&&historico.length===6&&historico.every((h,i)=>
  h&&Number(h.mes)===i+1&&((typeof h.essenciaisNaoPagas==='number'&&Number.isFinite(h.essenciaisNaoPagas))||
  (typeof h.essenciaisNaoPagas==='string'&&h.essenciaisNaoPagas.trim()!==''&&Number.isFinite(Number(h.essenciaisNaoPagas))))&&
  Number(h.essenciaisNaoPagas)>=0&&
  typeof h.deficit==='boolean');
 if(!completo)return {completo:false,regularidadeComprovada:false,motivo:'historico incompleto ou sem evidencias explicitas'};
 const semPendencias=historico.every(h=>Number(h.essenciaisNaoPagas)===0);
 const semDeficit=historico.every(h=>h.deficit===false);
 return {completo:true,regularidadeComprovada:semPendencias&&semDeficit,semPendencias,semDeficit,
  motivo:semPendencias&&semDeficit?'seis meses sem contas essenciais pendentes ou deficit':'ha pendencias ou deficit documentados'};
}
// Etapa 140: seis meses completos sem credito ou parcelas nao devem sofrer
// teto de 75% apenas porque o jogador nao precisou contratar credito.
// Exige divida e parcelas explicitamente registradas em TODOS os meses;
// zero ausente ou valor invalido nao pode ser interpretado como evidencia.
// Etapa 141: saldo zerado no fechamento nao comprova ausencia de uso de credito.
// O historico real tambem registra credito contratado e parcelas baixadas no mes.
// Campos ausentes tornam a conclusao inconclusiva, nunca automaticamente positiva.
function evidenciasSemCreditoEtapa140(historico=[]){
 const completo=Array.isArray(historico)&&historico.length===6&&historico.every((h,i)=>
  h&&Number.isInteger(h.mes)&&h.mes===i+1&&
  ['dividas','parcelaProxima','creditoConsumo','creditoNecessidade','dividaEssencial'].every(k=>
   typeof h[k]==='number'&&Number.isFinite(h[k])&&h[k]>=0)&&
  Array.isArray(h.parcelasBaixadasMes)&&
  h.parcelasBaixadasMes.every(p=>p&&typeof p.valor==='number'&&Number.isFinite(p.valor)&&p.valor>=0)&&
  typeof h.deficit==='boolean');
 if(!completo)return {completo:false,semCreditoComprovado:false,motivo:'historico incompleto ou evidencias de credito ausentes/invalidas'};
 const semCredito=historico.every(h=>h.dividas===0&&h.parcelaProxima===0&&
  h.creditoConsumo===0&&h.creditoNecessidade===0&&h.dividaEssencial===0&&
  h.parcelasBaixadasMes.length===0&&h.deficit===false);
 return {completo:true,semCreditoComprovado:semCredito,
  motivo:semCredito?'nenhum uso de credito, divida ou baixa de parcela nos seis meses':'credito, obrigacao ou deficit documentado'};
}
// Etapa 142: auditar uso de credito sem confundir quitacao com ausencia de credito.
// Um saldo mensal nao comprova sozinho juros, finalidade, sustentabilidade ou pagamento externo.
// Resultado diagnostico: nao atribui nem retira pontos da rubrica.
function auditarCreditoUtilizadoEtapa142(historico=[]){
 const sem=evidenciasSemCreditoEtapa140(historico);
 if(!sem.completo)return {completo:false,estado:'inconclusivo',usoDetectado:false,
  motivos:['seis fechamentos com campos de credito validos sao necessarios'],avaliacaoResponsabilidade:'nao_avaliada'};
 const eventos=[];
 for(const h of historico){
  const fontes=['creditoConsumo','creditoNecessidade','dividaEssencial','dividas','parcelaProxima'];
  for(const campo of fontes)if(h[campo]>0)eventos.push({mes:h.mes,tipo:campo,valor:h[campo]});
  for(const baixa of h.parcelasBaixadasMes)eventos.push({mes:h.mes,tipo:'parcelaBaixada',valor:baixa.valor,
   confirmacaoExterna:baixa.confirmacaoExterna===true,origemEscolhaId:baixa.origemEscolhaId??null});
 }
 const usoDetectado=eventos.length>0;
 const deficits=historico.filter(h=>h.deficit).map(h=>h.mes);
 const margensInvalidas=historico.filter(h=>typeof h.margemMes!=='number'||!Number.isFinite(h.margemMes)).map(h=>h.mes);
 const mesesSemMargem=historico.filter(h=>typeof h.margemMes==='number'&&h.margemMes<=0).map(h=>h.mes);
 const pagamentosSemConfirmacao=eventos.filter(e=>e.tipo==='parcelaBaixada'&&!e.confirmacaoExterna).length;
 // Deficit isolado nao comprova credito; tampouco autoriza declarar ausencia de obrigacoes.
 const estado=usoDetectado?'credito_ou_obrigacao_detectada':sem.semCreditoComprovado?'sem_credito_comprovado':'sem_credito_nao_comprovado';
 return {completo:true,estado,
  usoDetectado,eventos,mesesComDeficit:deficits,mesesSemMargem,mesesComMargemIndeterminada:margensInvalidas,
  pagamentosSemConfirmacaoExterna:pagamentosSemConfirmacao,
  avaliacaoResponsabilidade:usoDetectado?'pendente_contexto_decisoes_juros_capacidade':'nao_se_aplica',
  aviso:'Baixa automatica nao confirma pagamento externo; saldo zero nao comprova ausencia de credito. Nenhuma nota foi alterada.'};
}
function auditarCreditoDecisoesEtapa143(escolhas=[],historico=[]){
 const credito=auditarCreditoUtilizadoEtapa142(historico);
 const registros=Array.isArray(escolhas)?escolhas:[];
 const itens=registros.filter(e=>e&&typeof e==='object').map(e=>{
  const d=e.detalhes||{}, contexto=d.contextoNoMomento||{}, op=d.alternativaEscolhida;
  const alternativas=Array.isArray(d.alternativasDisponiveis)?d.alternativasDisponiveis:[];
  const escolhida=alternativas.find(a=>a&&((a.id===op)||(a.id===op?.id)));
  const parcelas=escolhida&&Number.isFinite(escolhida.valorMensal)?escolhida.valorMensal:null;
  const custo=escolhida&&Number.isFinite(escolhida.custoTotal)?escolhida.custoTotal:null;
  const margem=Number.isFinite(contexto.renda)&&Number.isFinite(contexto.despesas)&&Number.isFinite(contexto.parcelasExistentes)?contexto.renda-contexto.despesas-contexto.parcelasExistentes:null;
  // Etapa 144: pagamento a vista possui valorMensal para fins de comparacao,
  // mas nao representa contratacao de credito. Credito emergencial e explicitamente registrado.
  const emergencial=d.creditoEmergencial;
  const creditoEmergencialValido=!!(emergencial&&typeof emergencial.principal==='number'&&Number.isFinite(emergencial.principal)&&emergencial.principal>0);
  const parcelamento=!!(escolhida&&Number.isInteger(escolhida.quantidadeParcelas)&&escolhida.quantidadeParcelas>1);
  // Etapa 145: credito emergencial e parcelamento podem coexistir; a soma
  // dos compromissos exigiveis importa mais que cada obrigacao isolada.
  const compromissoParcelado=parcelamento&&Number.isFinite(parcelas)&&parcelas>=0?parcelas:null;
  const compromissoEmergencial=creditoEmergencialValido&&Number.isFinite(emergencial.total)&&emergencial.total>=0?emergencial.total:null;
  const compromissoConjunto=(parcelamento&&!Number.isFinite(compromissoParcelado))||(creditoEmergencialValido&&!Number.isFinite(compromissoEmergencial))?null:(compromissoParcelado||0)+(compromissoEmergencial||0);
  const vencimentoEmergencial=creditoEmergencialValido&&Number.isInteger(emergencial.mesVencimento)?emergencial.mesVencimento:null;
  // Etapa 155: nao presumir que a primeira parcela vence no mes da escolha.
  const primeiroVencimento=parcelamento&&Number.isInteger(escolhida.primeiroVencimento)&&escolhida.primeiroVencimento>=1?escolhida.primeiroVencimento:null;
  const mesesParcelamento=parcelamento&&primeiroVencimento!==null?Array.from({length:escolhida.quantidadeParcelas},(_,i)=>primeiroVencimento+i):[];
  const coincideVencimento=parcelamento&&creditoEmergencialValido&&vencimentoEmergencial!==null&&mesesParcelamento.includes(vencimentoEmergencial);
  const compromissoNoPico=parcelamento&&creditoEmergencialValido&&primeiroVencimento===null?null:(coincideVencimento?compromissoConjunto:(parcelamento&&creditoEmergencialValido?Math.max(compromissoParcelado||0,compromissoEmergencial||0):compromissoConjunto));
  const relevante=parcelamento||creditoEmergencialValido;
  const faltantes=[];
  if(relevante){
   if(!Number.isFinite(custo))faltantes.push('custo_total');
   if(parcelamento&&!Number.isFinite(parcelas))faltantes.push('valor_parcela');
   if(parcelamento&&primeiroVencimento===null)faltantes.push('primeiro_vencimento');
   if(creditoEmergencialValido&&(!Number.isFinite(emergencial.total)||!Number.isInteger(emergencial.mesVencimento)))faltantes.push('credito_emergencial_incompleto');
   if(margem===null)faltantes.push('margem_no_momento');
   if(compromissoNoPico===null)faltantes.push('compromisso_no_pico');
   if(parcelamento&&!alternativas.some(a=>a&&a!==escolhida&&Number.isFinite(a.custoTotal)))faltantes.push('comparacao_custos');
   if(!d.finalidade&&!d.justificativaNecessidade)faltantes.push('finalidade');
  }
  return {id:e.id??null,mes:e.mes??null,relevante,tipoCredito:parcelamento&&creditoEmergencialValido?'parcelamento_e_credito_emergencial':(parcelamento?'parcelamento':(creditoEmergencialValido?'credito_emergencial':'nenhum')),alternativaEncontrada:!!escolhida,
   custoTotal:custo,valorMensal:parcelas,primeiroVencimento,mesesParcelamento,margemDocumentada:margem,compromissoNoPico,coincideVencimento,
   capacidadeParcela:relevante&&margem!==null&&compromissoNoPico!==null?(compromissoNoPico<=margem?'cabe_na_margem_documentada':'excede_margem_documentada'):'inconclusiva',
   faltantes,aptoParaAvaliacaoContextual:relevante&&faltantes.length===0};
 });
 const relevantes=itens.filter(i=>i.relevante);
 return {etapa:143,estadoCredito:credito.estado,decisoes:itens,contratacoesIdentificadas:relevantes.length,
  contratacoesComEvidenciaCompleta:relevantes.filter(i=>i.aptoParaAvaliacaoContextual).length,
  semVinculoDeEscolha:credito.usoDetectado&&relevantes.length===0,
  aviso:'Avaliacao diagnostica: caber na margem nao basta para demonstrar responsabilidade; nao altera pontos.'};
}
// Etapa 292: demonstracao positiva de controle de gastos adicionais, nao ausencia de registro.
// Exige seis fechamentos sequenciais com acumulado de consumo explicitamente zerado,
// margem documentada nao negativa, contas essenciais em dia e nenhuma operacao de credito.
// Compras adicionais efetivas continuam sujeitas a avaliacao contextual, sem atalho.
function evidenciasControleGastosSemCompraEtapa292(historico=[]){
 const semCredito=evidenciasSemCreditoEtapa140(historico);
 const essenciais=evidenciasEssenciaisEtapa139(historico);
 const dadosValidos=semCredito.completo&&essenciais.completo&&historico.every(h=>
  typeof h.gastosConsumo==='number'&&Number.isFinite(h.gastosConsumo)&&h.gastosConsumo>=0&&
  typeof h.margemMes==='number'&&Number.isFinite(h.margemMes));
 const comprovado=dadosValidos&&semCredito.semCreditoComprovado&&essenciais.regularidadeComprovada&&
  historico.every(h=>h.gastosConsumo===0&&h.margemMes>=0);
 return {completo:!!dadosValidos,controleComprovado:!!comprovado,
  motivo:!dadosValidos?'faltam seis fechamentos e campos financeiros explicitos':
   comprovado?'seis meses com gastos adicionais zero, contas em dia, margem nao negativa e sem credito':
   'ha gastos adicionais, pendencias, credito ou margem negativa'};
}
function notaSemRegistro(cat,chave,historico){
 if(cat==='decisoes'&&chave==='dividas'&&evidenciasSemCreditoEtapa140(historico).semCreditoComprovado&&evidenciasEssenciaisEtapa139(historico).regularidadeComprovada)return 1;
 if(cat==='recursos'&&chave==='custos'&&evidenciasControleGastosSemCompraEtapa292(historico).controleComprovado)return 1;
 if((cat==='planejamento'&&chave==='orcamento')||(cat==='recursos'&&chave==='essenciais')){
  if(evidenciasEssenciaisEtapa139(historico).regularidadeComprovada)return 1;
 }
 if((cat==='planejamento'&&chave==='futuro')||(cat==='recursos'&&chave==='credito')){
  if(evidenciasSemCreditoEtapa140(historico).semCreditoComprovado)return 1;
 }
 if(!historico.length)return .5;
 const ult=historico.at(-1),meses=historico.length;
 const atraso=historico.filter(h=>h.essenciaisDecisao==="adiar").length/meses;
 const margem=historico.map(h=>(h.margemMes!=null&&Number.isFinite(Number(h.margemMes))?Number(h.margemMes):(h.despesas!=null&&Number.isFinite(Number(h.despesas))?3500-Number(h.despesas):580)));
 const parcelas=historico.map((h,i)=>h.parcelaProxima!=null?Number(h.parcelaProxima):0);
 // Etapa 198: parcela documentada dentro da margem nao e risco por si so.
 // Sem margem explicita, preservar estimativa conservadora.
 const pressao=parcelas.reduce((a,p,i)=>{
  const h=historico[i],m=Number(h.margemMes);
  const completo=h.parcelaProxima!=null&&h.margemMes!=null&&Number.isFinite(p)&&p>=0&&Number.isFinite(m);
  if(completo&&p<=m)return a;
  return a+pressaoParcelaSobreMargem(p,margem[i]);
 },0)/meses;
 const dividas=historico.map(h=>Number(h.dividas)||0),pico=Math.max(...dividas,0),final=dividas.at(-1)||0;
 const melhora=pico>0?(pico-final)/pico:1;
 if(cat==="planejamento"&&chave==="futuro")return LIMITAR(1-.45*pressao-.45*atraso);
 if(cat==="recursos"&&chave==="credito")return LIMITAR(1-.42*pressao-.30*atraso);
 if(cat==="adaptacao"&&chave==="reorganizacao")return LIMITAR((1-atraso)*.50+.50*melhora);
 if(cat==="adaptacao"&&chave==="recuperacao")return LIMITAR(.40+.60*melhora-.25*atraso);
 return .75;
}
// Etapa 137: somente notas numericas explicitas e normalizadas (0..1) sao evidencias diretas.
// Valores ausentes, strings, NaN e notas fora da escala sao rejeitados, nao transformados em zero.
function notaDiretaValidaEtapa137(r){
 return r!=null&&typeof r.nota==='number'&&Number.isFinite(r.nota)&&r.nota>=0&&r.nota<=1;
}
// Etapa 136: distinguir origem de cada ponto, inclusive na categoria Adaptacao.
// Registros incompletos nao viram automaticamente avaliacao direta.
function auditarProvenienciaEtapa136(registros=[],historico=[]){
 const resultado=pontuar(registros,historico), itens=[];
 const aliases={
  planejamento:{orcamento:['orcamento'],compromissos:['compromissos'],futuro:['futuro','compromissosFuturos'],objetivo:['objetivo','reserva']},
  decisoes:{viabilidade:['viabilidade'],dividas:['dividas'],consequencias:['consequencias'],oportunidades:['oportunidades']},
  recursos:{essenciais:['essenciais'],custos:['custos'],credito:['credito'],equilibrio:['equilibrio']}
 };
 for(const [categoria,sub] of Object.entries(PESOS))for(const [chave,maximo] of Object.entries(sub)){
  const observada=categoria==='adaptacao'?({imprevistos:'imprevistos',recuperacao:'reorganizacao',reorganizacao:'evolucao',futuro:'sustentabilidade'}[chave]):chave;
  const o=resultado.observacoes?.[categoria]?.[observada]||{};
  const registrosCorrespondentes=categoria==='adaptacao'?[]:registros.filter(r=>r.categoria===categoria&&(aliases[categoria]?.[chave]||[]).includes(r.comportamento));
  const validos=registrosCorrespondentes.filter(r=>notaDiretaValidaEtapa137(r));
  const pontuacao=Number.isFinite(o.pontos)?o.pontos:null;
  const origem=categoria==='adaptacao'?'estimativa_historico':validos.length?'registro_direto_com_ajustes':'aproximacao_sem_avaliacao_direta';
  itens.push({categoria,chave,maximo,pontos:pontuacao,origem,registrosCorrespondentes:registrosCorrespondentes.length,avaliacoesValidas:validos.length,
   requerEvidencia:origem!=='registro_direto_com_ajustes',observacao:categoria==='adaptacao'?'Adaptacao ainda calculada por prototipo de trajetoria, nao por avaliacao direta do subcriterio':
   validos.length?'Nota direta ainda sujeita a fatores experimentais':'Ausencia de avaliacao direta; nao equivale a erro do jogador'});
 }
 const totalItens=itens.reduce((a,i)=>a+(i.pontos||0),0);
 return {etapa:136,total:resultado.total,subcriterios:itens,
  semEvidenciaDireta:itens.filter(i=>i.requerEvidencia).length,
  conciliado:itens.length===16&&totalItens===resultado.total&&itens.reduce((a,i)=>a+i.maximo,0)===1000,
  aviso:'Auditoria de proveniencia, nao atribui pontos nem valida a rubrica.'};
}
// Etapa 134: diagnostico explicito de tetos implicitos e ausencia de evidencias.
// Nao concede pontos nem altera a pontuacao; separa insuficiencia de dados de erro do jogador.
function auditarTetosPontuacaoEtapa134(registros=[],historico=[]){
 const resultado=pontuar(registros,historico);
 const itens=[];
 for(const [categoria,subitens] of Object.entries(resultado.observacoes||{})){
  for(const [chave,item] of Object.entries(subitens||{})){
   const maximo=Number(item.maximo)||0,pontos=Number(item.pontos)||0;
   const avaliacoes=Number(item.avaliacoes)||0;
   const origem=String(item.origem||'');
   const semAvaliacaoDireta=avaliacoes===0 || /sem avalia[cç][aã]o direta|trajet[oó]ria/i.test(origem);
   itens.push({categoria,chave,maximo,pontos,perda:maximo-pontos,avaliacoes,semAvaliacaoDireta,
    perdaSemEvidenciaDireta:semAvaliacaoDireta?maximo-pontos:0,
    diagnostico:semAvaliacaoDireta?'pontuacao provisoria baseada em aproximacao; nao comprova erro do jogador':
      (pontos<maximo?'exige revisao contextual':'pontuacao maxima observada')});
  }
 }
 const soma=itens.reduce((a,x)=>a+x.pontos,0);
 const maximo=itens.reduce((a,x)=>a+x.maximo,0);
 return {total:resultado.total,maximo,perda:maximo-resultado.total,
  subcriterios:itens,semEvidenciaDireta:itens.filter(x=>x.semAvaliacaoDireta).length,
  perdaSemEvidenciaDireta:itens.reduce((a,x)=>a+x.perdaSemEvidenciaDireta,0),
  reconciliado:soma===resultado.total && maximo===1000,
  aviso:'Diagnostico, nao uma nova rubrica. Ausencia de avaliacao direta nao prova comportamento inadequado.'};
}
// Etapa 158: candidato documental dos 70 pontos de alternativas.
// Só apresenta nota quando TODAS as decisões elegíveis têm avaliação fundamentada.
// Não presume que ausência de registro equivale a erro ou acerto.
function candidatoAlternativasEtapa158(escolhas=[],margensBasePorMes={}){
 if(typeof validarNotasFundamentadasEtapa116V120!=="function")return {estado:"avaliador_indisponivel",nota70:null};
 const a=validarNotasFundamentadasEtapa116V120(escolhas,margensBasePorMes);
 const validas=a.prontoParaValidacao&&a.quantidade>0&&a.avaliadas===a.quantidade;
 return {estado:validas?"documentado_candidato":"evidencias_insuficientes",nota70:validas?a.nota70Candidata:null,
  quantidade:a.quantidade,avaliadas:a.avaliadas,pendencias:a.pendencias,
  aviso:"Candidato não altera a nota oficial; exige avaliação pedagógica fundamentada de cada decisão."};
}
// Etapa 227: indicador conservador e nao mutavel de atraso para dois subcriterios.
// Mantem saldo contabil e demais indicadores intactos. Sem conciliacao, usa valor antigo.
function atrasoConciliadoParaPressao227(h){
 const bruto=Number(h?.dividas), essencial=Number(h?.dividaEssencial), mes=Number(h?.mes);
 const os=h?.obrigacoesPendentesFechamento, origens=h?.origensDividasEssenciais;
 if(!Number.isInteger(mes)||mes<1||!Number.isFinite(bruto)||bruto<0||
    !Number.isFinite(essencial)||essencial<0||!Array.isArray(os)||!Array.isArray(origens))return null;
 let origem=0, futuro=0, vencido=0, atual=0;
 for(const o of origens){const v=Number(o?.saldo);if(!Number.isFinite(v)||v<0)return null;origem+=v;}
 if(Math.abs(origem-essencial)>.011)return null;
 for(const o of os){const v=Number(o?.valor);if(!Number.isFinite(v)||v<0||!Array.isArray(o?.pendentes))return null;
  for(const p of o.pendentes){const n=Number(p);if(!Number.isInteger(n)||n<1)return null;
   if(n>mes)futuro+=v;else if(n<mes)vencido+=v;else atual+=v;
  }
 }
 if(Math.abs(essencial+futuro+vencido+atual-bruto)>.011)return null;
 return Math.max(0,Math.round((essencial+vencido+atual)*100)/100);
}
// Etapa 275: contrato de evidencias independente da nota. Nunca converte
// ausencia de registros em nota maxima; distingue comprovado de inconclusivo.
function auditarAusenciasResponsaveisEtapa275(historico=[],escolhas=[]){
 const credito=typeof evidenciasSemCreditoEtapa140==='function'?evidenciasSemCreditoEtapa140(historico):{completo:false,semCreditoComprovado:false};
 const trilha=typeof auditarTrilhasIndependentesV120==='function'?auditarTrilhasIndependentesV120(historico,escolhas,[]):null;
 const gastos=trilha&&Array.isArray(trilha.gastos)?trilha.gastos:[];
 const meses=[1,2,3,4,5,6];
 const semGasto=!!trilha&&trilha.auditavel===true&&gastos.length===6&&
  meses.every(m=>gastos.filter(g=>g.mes===m).length===1)&&
  gastos.every(g=>g.valor===0&&g.finalidade==='sem_compra'&&g.justificativa==='sem_compra'&&g.desembolso===0);
 const semCredito=credito.completo===true&&credito.semCreditoComprovado===true&&!!trilha&&trilha.auditavel===true&&
  Array.isArray(trilha.contratos)&&trilha.contratos.length===0;
 return {etapa:275,semCreditoComprovado:semCredito,semGastoAdicionalComprovado:semGasto,
  trilhaAuditavel:!!trilha&&trilha.auditavel===true,
  pendencias:trilha&&Array.isArray(trilha.pendencias)?trilha.pendencias:['trilha_indisponivel'],
  aviso:'Evidencia diagnostica, nao equivale automaticamente a nota maxima.'};
}
function pontuar(registros=[],historico=[],escolhasMensais=[]){
 const indicadores=typeof indicadoresMensais==="function"?indicadoresMensais(historico,registros):[];
 const renda=3500, meses=Math.max(1,historico.length),ultimo=historico.at(-1)||{};
 const dividas=historico.map(h=>Math.max(0,Number(h.dividas)||0));
 const pico=Math.max(0,...dividas),final=dividas.at(-1)||0,media=dividas.reduce((a,b)=>a+b,0)/meses;
 const consumo=Math.max(0,Number(ultimo.creditoConsumo)||0),necessidade=Math.max(0,Number(ultimo.creditoNecessidade)||0);
 const recorrencias=historico.reduce((n,h)=>n+(Number(h.renegociacoesMes)||0),0);
 const atrasoEssencial=historico.filter(h=>h.essenciaisDecisao==="adiar").length/meses;
 const margemMensal=historico.map(h=>(h.margemMes!=null&&Number.isFinite(Number(h.margemMes))?Number(h.margemMes):renda-(h.despesas!=null&&Number.isFinite(Number(h.despesas))?Number(h.despesas):2920)));
 const pressaoParcelas=historico.reduce((a,h,i)=>a+pressaoParcelaSobreMargem(h.parcelaProxima,margemMensal[i]),0)/meses;
 // Etapa 164: prestação dentro da margem não equivale, por si só, a crédito arriscado.
 // Sem dados de margem/vencimento, preserva a pressão anterior por prudência.
 const pressaoParcelasRisco=historico.reduce((soma,h,i)=>{
  const p=Number(h.parcelaProxima), m=Number(h.margemMes);
  if(h.parcelaProxima==null||h.margemMes==null||!Number.isFinite(p)||!Number.isFinite(m)||p<0)
   return soma+pressaoParcelaSobreMargem(h.parcelaProxima,margemMensal[i]);
  if(p===0)return soma;
  return soma+(m>=p?0:pressaoParcelaSobreMargem(p,m));
 },0)/meses;
 const gastoAdicional=Math.max(0,Number(ultimo.gastosConsumo)||0);
 const consumoSemReserva=gastoAdicional>0 && Number(ultimo.reserva||0)===0;

 const mesesDeficit=historico.filter(h=>h.deficit).length;
 const mesesPesados=dividas.filter(d=>d>renda).length;
 const recuperacao=pico>0?LIMITAR((pico-final)/pico):1;
 // Necessidade não é sinônimo de má decisão. Consumo e rolagem sem quitação têm peso maior.
 const consumoRel=LIMITAR(consumo/(renda*2));
 // Apenas os ajustes de planejamento.compromissos e recursos.equilibrio usam
 // o saldo vencido/atual conciliado; demais metricas continuam com dividas originais.
 const saldosPressao227=historico.map((h,i)=>{
  const auditado=atrasoConciliadoParaPressao227(h);
  return auditado===null?dividas[i]:auditado;
 });
 const mediaPressao227=saldosPressao227.reduce((a,b)=>a+b,0)/meses;
 const pressao227=LIMITAR((mediaPressao227/renda-.15)/2.2);
 const pressao=LIMITAR((media/renda-.15)/2.2);
 const dividaFutura=LIMITAR((final/renda-.15)/2.5);
 const rolamento=LIMITAR(Math.max(0,recorrencias-1)/4);
 const necessidadeRel=LIMITAR(necessidade/(renda*4));
 const persistencia=LIMITAR(mesesPesados/6);
 const melhora=LIMITAR(recuperacao);
 // Um indicador é usado em cada subitem; não existe desconto global duplicado.
 const ajustes={
  planejamento:{compromissos:LIMITAR(1-.32*pressao227-.20*rolamento-.12*mesesDeficit/6-.18*pressaoParcelasRisco),futuro:LIMITAR(1-.35*dividaFutura-.25*rolamento-.20*pressaoParcelasRisco)},
  decisoes:{dividas:LIMITAR(1-.43*consumoRel-.30*rolamento-.15*necessidadeRel-.20*pressaoParcelasRisco),consequencias:LIMITAR(1-.35*persistencia-.25*rolamento)},
  recursos:{custos:LIMITAR(1-.50*consumoRel-.12*(consumoSemReserva?1:0)),credito:LIMITAR(1-.40*consumoRel-.25*rolamento-.20*pressaoParcelasRisco),equilibrio:LIMITAR(1-.38*pressao227)},
  adaptacao:{reorganizacao:LIMITAR(1-.40*rolamento-.18*persistencia+.18*melhora-.20*atrasoEssencial),recuperacao:LIMITAR(1-.45*dividaFutura-.30*rolamento+.18*melhora),futuro:LIMITAR(1-.48*dividaFutura-.20*rolamento-.18*pressaoParcelas),imprevistos:LIMITAR(1-.20*mesesDeficit/6+.12*melhora)}
 };
 const correspondencia={
  planejamento:{orcamento:["orcamento"],compromissos:["compromissos"],futuro:["futuro","compromissosFuturos"],objetivo:["objetivo","reserva"]},
  decisoes:{viabilidade:["viabilidade"],dividas:["dividas"],consequencias:["consequencias"],oportunidades:["oportunidades"]},
  recursos:{essenciais:["essenciais"],custos:["custos"],equilibrio:["equilibrio"],credito:["credito"]},
  adaptacao:{reorganizacao:["reorganizacao"],recuperacao:["recuperacao"],imprevistos:["imprevistos"],futuro:["futuro"]}
 };
 const criterios={},observacoes={};
 for(const [cat,sub] of Object.entries(PESOS)){
  // Adaptação é calculada exclusivamente no protótipo específico abaixo.
  // Evita cálculo legado com chaves semanticamente incompatíveis.
  if(cat==="adaptacao")continue;
  observacoes[cat]={};let pontos=0;
  for(const [chave,peso] of Object.entries(sub)){
   const aliases=correspondencia[cat]?.[chave]||[];
   const correspondentes=registros.filter(r=>r.categoria===cat&&aliases.includes(r.comportamento));
   const notas=correspondentes.filter(notaDiretaValidaEtapa137).map(r=>r.nota);
   const registrosInvalidos=correspondentes.length-notas.length;
   // Sem avaliação direta, ainda existem aproximações legadas; exigir validação.
   const mediaNotas=notas.length?notas.reduce((a,b)=>a+b,0)/notas.length:notaSemRegistro(cat,chave,historico);
   const fator=ajustes[cat]?.[chave]??1;
   // A trajetória contextualiza os registros: guardar pouco enquanto se acumulam
   // obrigações não equivale a planejamento sustentável.
   const atraso=LIMITAR(mesesDeficit/meses);
   const excesso=LIMITAR(media/(renda*1.6));
   const semMeta=LIMITAR(1-(Number(ultimo.meta)||0)/Math.max(1,Number(ultimo.metaValor)||1200));
   let contexto=1;
   // Etapa 129: não descontar a mesma evidência indiscriminadamente de toda uma categoria.
   // Meta não atingida diz respeito ao objetivo, não ao pagamento de contas essenciais.
   // Consumo opcional não deve reduzir automaticamente avaliação de imprevistos ou alternativas.
   if(cat==="planejamento"){
    if(chave==="orcamento")contexto=1-.28*atraso;
    else if(chave==="objetivo")contexto=1; // Etapa 130: meta avaliada em coerencia; evitar dupla penalizacao
    else contexto=1;
   }
   if(cat==="recursos"){
    if(chave==="essenciais")contexto=1-.22*atraso;
    else if(chave==="custos")contexto=1; // Etapa 131: consumoRel ja integra ajustes.recursos.custos; evitar dupla penalizacao
    else contexto=1;
   }
   // Etapa 138: atraso essencial ja entra na trajetoria financeira (deficit e persistencia);
   // nao descontar novamente a mesma decisao no criterio de consequencias.
   if(cat==="decisoes"){
    if(chave==="consequencias")contexto=1;
    else contexto=1;
   }
   if(cat==="adaptacao")contexto=1-.16*atraso-.18*excesso+.08*melhora;
   // Avaliar o esforço real de poupança sem ignorar contas e obrigações.
   const metaAtingida=LIMITAR((Number(ultimo.meta)||0)/Math.max(1,Number(ultimo.metaValor)||1200));
   const poupanca=LIMITAR(((Number(ultimo.meta)||0)+(Number(ultimo.reserva)||0))/Math.max(1,Number(ultimo.metaValor)||1200));
   // Etapa 135: limiar fixo de 25% da renda causava salto artificial na nota.
   // Divida, custo e capacidade ja sao considerados nos fatores contextuais especificos.
   let coerencia=1;
   if(cat==="planejamento" && chave==="objetivo")coerencia=.30+.70*metaAtingida;
   if(cat==="adaptacao" && chave==="reorganizacao")coerencia=pico===0?1:.80+.20*recuperacao;
   // Reserva isolada não compensa automaticamente compromissos acumulados.
   const nota=LIMITAR(mediaNotas*fator*LIMITAR(contexto)*coerencia);
   const componentes411=cat==="decisoes"&&chave==="consequencias"&&typeof componentesConsequencias411==="function"?componentesConsequencias411(registros,historico,escolhasMensais):null;
   const pontosItem=componentes411?.aplicavel?componentes411.total:Math.round(peso*nota);
   const evidenciaSemCredito=!notas.length&&((cat==='planejamento'&&chave==='futuro')||(cat==='recursos'&&chave==='credito'))&&evidenciasSemCreditoEtapa140(historico).semCreditoComprovado;
   const evidenciaSemDivida=!notas.length&&cat==='decisoes'&&chave==='dividas'&&evidenciasSemCreditoEtapa140(historico).semCreditoComprovado&&evidenciasEssenciaisEtapa139(historico).regularidadeComprovada;
   const evidenciaSemGasto=!notas.length&&cat==='recursos'&&chave==='custos'&&evidenciasControleGastosSemCompraEtapa292(historico).controleComprovado;
   const origem=notas.length?"registros e trajetória":evidenciaSemGasto?"seis meses com controle de gastos adicionais comprovado":evidenciaSemDivida?"seis meses sem credito e com essenciais em dia":evidenciaSemCredito?"seis meses documentados sem credito ou parcelas":"trajetória (sem avaliação direta)";
   // Diagnostico auditavel, estritamente observacional: nao altera o calculo.
   const trilhaCalculo={versao:'diagnostico_componentes_09nov',metodo:componentes411?.aplicavel?'componentes_especificos_411':'media_ajustes_legados',
    evidencias:{registrosCorrespondentes:correspondentes.length,notasValidas:notas.length,notasInvalidas:registrosInvalidos,
     registros:correspondentes.map(r=>({mes:r.mes??null,comportamento:r.comportamento,nota:notaDiretaValidaEtapa137(r)?r.nota:null,
      origemEscolhaId:r.origemEscolhaId??r.escolhaId??null})),historicoMeses:historico.map(h=>h.mes??null)},
    calculoGeral:{mediaNotas,fatorAjuste:fator,fatorContexto:LIMITAR(contexto),fatorCoerencia:coerencia,
     notaNormalizada:nota,pontosPelaFormulaGeral:Math.round(peso*nota)},
    componentesEspecificos:componentes411?.aplicavel?componentes411:null,
    pontosFinais:pontosItem,limite:peso,
    aviso:'Fatores gerais nao demonstram, por si, a divisao pedagogica interna aprovada.'};
   observacoes[cat][chave]={rotulo:SUBROTULOS[cat][chave],maximo:peso,pontos:pontosItem,avaliacoes:notas.length,registrosInvalidos,origem,evidenciaSemCreditoEtapa140:evidenciaSemCredito,evidenciaSemDividaEtapa292:evidenciaSemDivida,evidenciaSemGastoEtapa292:evidenciaSemGasto,media:nota,trilhaCalculo,...(componentes411?.aplicavel?{componentes411}:{} )};
   pontos+=pontosItem;
  }
  criterios[cat]=Math.min(250,pontos);
 }
 // v1.20: mantém protótipo de adaptação da 1.19 como hipótese, ainda sem validação.
 const adaptacaoAnterior=null; // cálculo legado removido: pesos e semântica divergentes
 const adaptacaoExperimental=pontuarAdaptacaoV19(registros,historico);
 criterios.adaptacao=adaptacaoExperimental.total;
 observacoes.adaptacao=adaptacaoExperimental.observacoes;
 const total=Object.values(criterios).reduce((a,b)=>a+b,0);
 const auditoriaLacunas=auditarLacunasPontuacaoEtapa128({total,criterios,observacoes},historico);
 return {total,criterios,observacoes,evidenciasAusenciasEtapa275:auditarAusenciasResponsaveisEtapa275(historico,escolhasMensais),auditoriaLacunasEtapa128:auditoriaLacunas,auditoriaCreditoEtapa142:auditarCreditoUtilizadoEtapa142(historico),provisorio:true,comparacaoV19:{adaptacaoAnterior,adaptacaoExperimental:criterios.adaptacao,totalAnterior:null,limitacoes:adaptacaoExperimental.limitacoes},diagnostico:{pico,media,final,consumo,necessidade,recorrencias,melhora,atrasoEssencial,pressaoParcelas,indicadoresMensais:indicadores.length,coberturaRubrica:typeof auditarCoberturaV120==="function"?auditarCoberturaV120(registros,historico):null,mediaDecisoesIndividuais:typeof mediaIndividualDecisoes==="function"?mediaIndividualDecisoes(registros):null}};
}

// Versão 1.19: protótipo explícito dos 250 pontos aprovados.
// Os pesos são aprovados; as fórmulas abaixo são HIPÓTESES para teste, não regras definitivas.
// Sem informações sobre opções disponíveis e finalidade real do gasto, usa aproximações conservadoras.
// Etapa 163: margemMes ja representa renda menos despesas habituais, antes das parcelas.
// A parcela do mes 7 deve ser comparada com essa margem, nao com o saldo livre
// depois de pagar a parcela do mes 6. Nao presume quitacao externa.
function projetarSustentabilidadeEtapa163(historico=[]){
 const u=Array.isArray(historico)?historico.at(-1)||{}:{};
 const margem=Number(u.margemMes), parcela=Number(u.parcelaProxima);
 // Um campo em branco, booleano ou objeto não constitui evidência financeira.
 // Number('   ') e Number(false) retornam zero, mas não são valores documentados.
 const numeroDocumentado=v=>(typeof v==='number' && Number.isFinite(v)) ||
  (typeof v==='string' && v.trim()!=='' && Number.isFinite(Number(v)));
 const dados=Array.isArray(historico) && historico.length===6 && historico.every((h,i)=>h && typeof h==='object' && Number(h.mes)===i+1 && numeroDocumentado(h.margemMes) && numeroDocumentado(h.parcelaProxima) && Number(h.parcelaProxima)>=0) &&
  numeroDocumentado(u.margemMes) && numeroDocumentado(u.parcelaProxima) &&
  Number.isFinite(margem) && Number.isFinite(parcela) && parcela>=0;
 if(!dados)return {status:'inconclusivo',capacidade:null,margem:null,parcela:null,comprovacao:'historico incompleto'};
 const capacidade=margem-parcela;
 const baixas=historico.flatMap(h=>Array.isArray(h.parcelasBaixadasMes)?h.parcelasBaixadasMes:[]);
 return {status:capacidade>=0?'viavel_na_margem':'insuficiente_na_margem',capacidade,margem,parcela,
  baixasAutomaticas:baixas.filter(b=>b.origemRegistro==='baixa_automatica_do_motor').length,
  confirmacaoExterna:false,comprovacao:'projecao interna; nao prova pagamento externo nem despesas extraordinarias'};
}

// Etapa 219: distinguir parcelas futuras documentadas de atraso essencial.
// Se houver vencimento anterior, divergencia ou falta de detalhamento,
// preservar a metrica anterior: nao presumir quitacao nem adimplencia.
function dividaRecuperacaoDocumentada219(h){
 const bruto=Math.max(0,Number(h?.dividas)||0);
 const os=h?.obrigacoesPendentesFechamento;
 const mes=Number(h?.mes), essencial=Number(h?.dividaEssencial);
 if(!Array.isArray(os)||!Number.isInteger(mes)||mes<1||
    !((typeof h.dividaEssencial==='number' && Number.isFinite(h.dividaEssencial)) ||
      (typeof h.dividaEssencial==='string' && h.dividaEssencial.trim()!=='' && Number.isFinite(Number(h.dividaEssencial)))) ||
    !Number.isFinite(essencial)||essencial<0)return bruto;
 let total=0;
 for(const o of os){
  const valor=Number(o?.valor);
  const valorDocumentado=(typeof o?.valor==='number' && Number.isFinite(o.valor)) ||
   (typeof o?.valor==='string' && o.valor.trim()!=='' && Number.isFinite(Number(o.valor)));
  if(!valorDocumentado||valor<0||!Array.isArray(o?.pendentes))return bruto;
  for(const venc of o.pendentes){
   const v=Number(venc);
   const vencDocumentado=(typeof venc==='number' && Number.isInteger(venc)) ||
    (typeof venc==='string' && venc.trim()!=='' && Number.isInteger(Number(venc)));
   if(!vencDocumentado||!Number.isInteger(v)||v<=mes)return bruto;
   total+=valor;
  }
 }
 if(Math.abs(total-bruto)>.01)return bruto;
 if(Array.isArray(h.origensDividasEssenciais)){
  const origens=h.origensDividasEssenciais;
  if(origens.some(o=>!o || !((typeof o.saldo==='number' && Number.isFinite(o.saldo)) ||
     (typeof o.saldo==='string' && o.saldo.trim()!=='' && Number.isFinite(Number(o.saldo)))) || Number(o.saldo)<0)||
     Math.abs(origens.reduce((a,o)=>a+Number(o.saldo),0)-essencial)>.01)return bruto;
 }
 return essencial;
}

function pontuarAdaptacaoV19(registros=[], historico=[]){
 const clip=LIMITAR, n=x=>Math.max(0,Number(x)||0);
 const H=historico, N=Math.max(1,H.length), U=H.at(-1)||{};
 const debts=H.map(h=>dividaRecuperacaoDocumentada219(h)), peak=Math.max(0,...debts), end=debts.at(-1)||0;
 // Etapa 133: preservar margem zero/negativa; a capacidade não pode ser inventada.
 // Valores booleanos, espaços e objetos não documentam uma margem financeira.
 // O valor de fallback histórico é mantido apenas para compatibilidade das notas experimentais.
 const numeroFinanceiroDocumentado=v=>(typeof v==='number' && Number.isFinite(v)) ||
  (typeof v==='string' && v.trim()!=='' && Number.isFinite(Number(v)));
 const margins=H.map(h=>numeroFinanceiroDocumentado(h.margemMes) ? Number(h.margemMes) : 580);
 // Etapa 201: a existencia de parcela documentadamente sustentavel nao e
 // sinal de instabilidade na adaptacao. Sem comprovacao, preservar cautela.
 const pressure=H.map((h,i)=>{
  const parcela=Number(h.parcelaProxima), margem=Number(h.margemMes);
  const documentado=numeroFinanceiroDocumentado(h.parcelaProxima) &&
   numeroFinanceiroDocumentado(h.margemMes) &&
   Number.isFinite(parcela) && parcela>=0 && Number.isFinite(margem);
  if(documentado && margem>=0 && parcela<=margem)return 0;
  return pressaoParcelaSobreMargem(h.parcelaProxima,margins[i]);
 });
 const late=H.filter(h=>h.essenciaisDecisao==='adiar').length;
 const deficits=H.filter(h=>h.deficit).length;
 const risky=H.filter((h,i)=>pressure[i]>.8 || (debts[i]>0 && margins[i]<=0 && h.deficit) || (margins[i]>0 && debts[i]>margins[i]*3 && h.deficit)).length;
 const improved=peak===0?1:clip((peak-end)/peak);
 const stable=H.length?H.filter((h,i)=>!h.deficit && pressure[i]<=.8).length/N:0;
 const reserves=H.map(h=>n(h.reserva));
 const reserveEnd=n(U.reserva), reserveStart=reserves[0]||0;
 // Reserva zerada ou ausente não demonstra esforço de poupança.
 // Manter uma reserva positiva documentada conta como preservação responsável.
 const reserveEffort=H.length?H.filter((h,i)=>numeroFinanceiroDocumentado(h.reserva) &&
  Number(h.reserva)>0 && Number(h.reserva)>=(i?reserves[i-1]:0)).length/N:0;
 const projecao163=projetarSustentabilidadeEtapa163(H);
 // A projeção da parcela do mês 7 não demonstra quitação de atrasos essenciais.
 // Expor essa limitação de modo rastreável, sem descontar pontos arbitrariamente.
 const dividaEssencialFinal=(typeof U.dividaEssencial==='number' && Number.isFinite(U.dividaEssencial) && U.dividaEssencial>=0)
  ?U.dividaEssencial:null;
 // Uma margem positiva não comprova quitação das contas essenciais do mês 6.
 // A evidência precisa ser explícita: null/ausência não equivalem a zero.
 const essenciaisFinalDocumentadas=typeof U.essenciaisNaoPagas==='number' &&
  Number.isFinite(U.essenciaisNaoPagas) && U.essenciaisNaoPagas>=0;
 const essenciaisFinalEmDia=essenciaisFinalDocumentadas && U.essenciaisNaoPagas===0 && U.deficit===false;
 const projecaoDocumentada=projecao163.status==='viavel_na_margem' &&
  dividaEssencialFinal===0 && essenciaisFinalEmDia;
 const statusEvidencia=projecao163.status==='inconclusivo'?'pendente_de_comprovacao':
  projecao163.status!=='viavel_na_margem'?'projecao_inviavel':
  dividaEssencialFinal===null?'pendente_divida_essencial':
  dividaEssencialFinal>0?'pendente_analise_divida':
  !essenciaisFinalDocumentadas || typeof U.deficit!=='boolean'?'pendente_contas_essenciais':
  !essenciaisFinalEmDia?'pendente_regularizacao_essenciais':'projecao_documentada';
 const futurePressure=pressaoParcelaSobreMargem(U.parcelaProxima,margins.at(-1));
 const avgPressure=pressure.reduce((a,b)=>a+b,0)/N;
 // Sem margem positiva, reserva e saldo livre não comprovam automaticamente sustentabilidade.
 const futureSafety=H.length&&margins.at(-1)>0?clip((reserveEnd+n(U.livre))/margins.at(-1)):0;
 const noRepeat=clip(1-Math.max(0,risky-1)/Math.max(1,N-1));
 const choices=registros.filter(r=>r.categoria==='adaptacao' && notaDiretaValidaEtapa137(r)).map(r=>r.nota); // Etapa 137: notas invalidas nao entram como zero nem sao convertidas por clip
 const choicesAvg=choices.length?choices.reduce((a,b)=>a+b,0)/choices.length:stable; // ausência de registro não é erro automático
 const values={
  imprevistos:{adequacao:40*clip(.55*choicesAvg+.45*stable),custo:20*clip(1-.25*avgPressure-.2*late/N),equilibrioPosterior:30*clip(.65*stable+.35*improved)},
  reorganizacao:{dividas:30*clip(.5*improved+.5*(1-Math.min(1,end/3500))),equilibrio:30*clip(.4*(1-late/N)+.3*stable+.3*(1-Math.min(1,avgPressure))),reserva:20*clip(.5*reserveEffort+.5*Math.max(reserveEnd>0?0.3:0,clip(reserveEnd/580)))},
  evolucao:{consistencia:25*stable,aprendizado:15*clip(peak===0?stable:.5*improved+.5*stable),evitarRepeticao:10*noRepeat},
  sustentabilidade:{parcelas:15*clip(projecao163.status==='viavel_na_margem'?1:1-futurePressure),margem:10*clip(projecao163.status==='viavel_na_margem'?1:1-futurePressure),seguranca:5*futureSafety}
 };
 const labels={imprevistos:'Enfrentamento de imprevistos',reorganizacao:'Reorganização e recuperação financeira',evolucao:'Evolução das decisões',sustentabilidade:'Sustentabilidade após o sexto mês'};
 const observacoes={};let total=0;
 for(const [group,items] of Object.entries(values)){
  const pts=Math.round(Object.values(items).reduce((a,b)=>a+b,0));
  const trilhaCalculo={versao:'diagnostico_componentes_09nov',metodo:'componentes_explicitos_experimentais',
   componentes:Object.fromEntries(Object.entries(items).map(([nome,valor])=>[nome,{pontosBrutos:valor,pontosExibidos:Math.round(valor*100)/100}])),
   somaAntesArredondamento:Object.values(items).reduce((a,b)=>a+b,0),pontosFinais:pts,
   evidencias:{meses:historico.map(h=>h.mes??null),dividaFinal:end,dividaPico:peak,
    margemFinal:margins.at(-1)??null,parcelaProxima:U.parcelaProxima??null,
    projecaoSustentabilidade:group==='sustentabilidade'?projecao163:null},
   validacaoEvidencia:group==='sustentabilidade'?{status:statusEvidencia,componentesDependentes:['parcelas','margem','dividaEssencial','essenciaisNaoPagas','deficit'],notaDefinitiva:projecaoDocumentada,notaProvisoria:!projecaoDocumentada,projecaoStatus:projecao163.status,sustentabilidadeIntegralComprovada:projecaoDocumentada,dividaEssencialFinal,escopo:'margem menos parcela futura; não verifica quitação de dívidas essenciais vencidas',alertaDividaEssencial:dividaEssencialFinal===null?'saldo de dívida essencial não documentado':dividaEssencialFinal>0?'dívida essencial remanescente exige análise de vencimentos e capacidade de quitação':null,observacao:projecao163.status==='inconclusivo'?'Pontuação experimental não comprovada: não apresentar como nota pedagógica definitiva.':'Projeção documentada não comprova adimplência nem despesas extraordinárias.'}:null,
   aviso:'Componentes experimentais; verificar independencia e pertinencia pedagogica.'};
  observacoes[group]={rotulo:labels[group],maximo:{imprevistos:90,reorganizacao:80,evolucao:50,sustentabilidade:30}[group],pontos:pts,detalhes:Object.fromEntries(Object.entries(items).map(([k,v])=>[k,Math.round(v*100)/100])),origem:'estimativa experimental por histórico',trilhaCalculo};
  total+=pts;
 }
 return {total:Math.min(250,total),observacoes,limitacoes:['Fórmulas ainda não aprovadas; não publicar como avaliação definitiva.','O histórico não registra integralmente a urgência e as alternativas de cada acontecimento.','A pressão de parcelas e a reserva são aproximações; comparar com casos controlados.']};
}

// Regra aprovada na pergunta 50: cada decisão vale o mesmo; meses com mais
// decisões pesam mais. Exige registros por decisão, não notas médias mensais.
function mediaPonderadaDecisoes(decisoes=[]){
 const validas=decisoes.filter(d=>d && typeof d.nota==='number' && Number.isFinite(d.nota) && d.nota>=0 && d.nota<=100 && Number.isInteger(Number(d.mes)) && Number(d.mes)>=1 && Number(d.mes)<=6);
 if(!validas.length)return null;
 return validas.reduce((total,d)=>total+LIMITAR(Number(d.nota),0,100),0)/validas.length;
}

// Etapa 128: explica os pontos não atribuídos, sem transformá-los em penalidade ou mérito.
function auditarLacunasPontuacaoEtapa128(resultado={},historico=[]){
 const itens=[];let totalNaoAtribuido=0;
 for(const [categoria,sub] of Object.entries(PESOS)){
  for(const [chave,maximo] of Object.entries(sub)){
   const chaveObservacao=categoria==="adaptacao"?({imprevistos:"imprevistos",recuperacao:"reorganizacao",reorganizacao:"evolucao",futuro:"sustentabilidade"}[chave]):chave;
   const info=resultado.observacoes?.[categoria]?.[chaveObservacao]||{};
   const pontos=Number(info.pontos);
   const validos=Number.isFinite(pontos)&&pontos>=0&&pontos<=maximo;
   const diferenca=validos?maximo-pontos:null;
   if(diferenca!==null)totalNaoAtribuido+=diferenca;
   itens.push({categoria,subcriterio:chave,maximo,pontos:validos?pontos:null,naoAtribuidos:diferenca,
    origem:info.origem||'nao_documentada',avaliacoes:Number(info.avaliacoes)||0,
    evidenciaDireta:!!(Number(info.avaliacoes)>0),
    exigeRevisao:!validos||!Number(info.avaliacoes),
    observacao:!validos?'Resultado ausente ou invalido':!Number(info.avaliacoes)?'Nota sem avaliacao direta; origem inferida ou nao documentada':'Conferir adequacao pedagogica da formula'});
  }
 }
 const total=Number(resultado.total);
 return {etapa:128,mesesHistorico:historico.length,total:Number.isFinite(total)?total:null,
  pontosNaoAtribuidos:totalNaoAtribuido,conciliacao:totalNaoAtribuido+(Number.isFinite(total)?total:0)===1000,
  itens,pendencias:itens.filter(i=>i.exigeRevisao||i.naoAtribuidos>0).length,
  conclusao:'Diagnostico de lacunas; nao valida a nota nem autoriza completar pontos automaticamente'};
}

// Etapa 146: concilia vencimentos reais com a projeção do motor, sem inferir pagamento externo.
function auditarVencimentosReaisEtapa146(escolhas=[],historico=[]){
 const c=typeof conciliarParcelasPagasEtapa120V120==='function'?conciliarParcelasPagasEtapa120V120(escolhas,historico):null;
 if(!c)return {etapa:146,estado:'indisponivel',notaAutomatica:null};
 const meses=new Map();
 for(const v of c.porVencimento||[]){
  if(!meses.has(v.mes))meses.set(v.mes,{mes:v.mes,previsto:0,baixado:0,origens:[],situacoes:[]});
  const m=meses.get(v.mes);m.previsto+=v.previsto;m.baixado+=v.pago;m.origens.push(v.origemEscolhaId);m.situacoes.push(v.situacao);
 }
 const resumo=[...meses.values()].sort((a,b)=>a.mes-b.mes).map(m=>({...m,previsto:Math.round(m.previsto*100)/100,baixado:Math.round(m.baixado*100)/100,conciliado:m.situacoes.every(x=>x==='conciliado')}));
 return {etapa:146,estado:c.conciliacaoCompleta?'conciliado':'pendente_ou_inconsistente',porVencimento:c.porVencimento,compromissosConjuntosPorMes:resumo,aposJogo:c.aposJogo,pagamentosSemOrigem:c.pagamentosSemOrigem,pagamentosSemPrevisao:c.pagamentosSemPrevisao,pendencias:c.pendencias,notaAutomatica:null,aviso:'Baixas são registros internos do motor, não confirmação bancária. Não altera a pontuação.'};
}


// Etapa 147: qualidade da conciliação por mês observado; nunca transforma lacuna em inadimplência.
function auditarCoberturaVencimentosEtapa147(escolhas=[],historico=[]){
 const base=auditarVencimentosReaisEtapa146(escolhas,historico);
 if(base.estado==='indisponivel')return {etapa:147,estado:'indisponivel',notaAutomatica:null};
 const contagens=new Map();
 for(const h of Array.isArray(historico)?historico:[]){
  if(Number.isInteger(h?.mes)&&h.mes>=1&&h.mes<=6)contagens.set(h.mes,(contagens.get(h.mes)||0)+1);
 }
 const porMes=(base.compromissosConjuntosPorMes||[]).map(m=>{
  const qtd=contagens.get(m.mes)||0;
  const situacao=qtd===0?'nao_observado':qtd>1?'historico_duplicado':m.conciliado?'conciliado':'divergencia_ou_evidencia_incompleta';
  return {...m,quantidadeRegistrosHistorico:qtd,situacaoObservacao:situacao};
 });
 const mesesObservados=[...contagens.keys()].sort((a,b)=>a-b);
 const mesesSemHistorico=Array.from({length:6},(_,i)=>i+1).filter(m=>!contagens.has(m));
 const temObrigacoes=porMes.length>0||(base.aposJogo||[]).length>0;
 const erros=porMes.filter(m=>m.situacaoObservacao==='divergencia_ou_evidencia_incompleta'||m.situacaoObservacao==='historico_duplicado');
 const pendenciasOrigem=(base.pagamentosSemOrigem||[]).length+(base.pagamentosSemPrevisao||[]).length;
 const estado=erros.length||pendenciasOrigem?'inconsistente':porMes.some(m=>m.situacaoObservacao==='nao_observado')?'incompleto':!temObrigacoes?'sem_parcelas_projetadas':base.estado==='conciliado'?'conciliado':'revisao_necessaria';
 return {etapa:147,estado,porMes,mesesObservados,mesesSemHistorico,temObrigacoes,
  vencimentosAposJogo:base.aposJogo||[],pendenciasOrigem,notaAutomatica:null,
  aviso:'Sem histórico não significa inadimplência; ausência de parcelas não equivale a pagamentos comprovados. Auditoria não pontua.'};
}

// Etapa 148: prontidao de seis meses para validar a rubrica, sem criar nota artificial.
function auditarPartidaCompletaEtapa148(registros=[],escolhas=[],historico=[]){
 const hs=Array.isArray(historico)?historico:[];
 const contagens=Array.from({length:6},(_,i)=>hs.filter(h=>h&&h.mes===i+1).length);
 const ausentes=contagens.flatMap((n,i)=>n===0?[i+1]:[]);
 const duplicados=contagens.flatMap((n,i)=>n>1?[i+1]:[]);
 const foraFaixa=hs.filter(h=>!h||!Number.isInteger(h.mes)||h.mes<1||h.mes>6).length;
 const campos=['rendaMes','despesasMes','livre','reserva','dividas','parcelaProxima','essenciaisNaoPagas','deficit','parcelasBaixadasMes','escolhasIds'];
 const faltantes=[];
 for(const h of hs){
  if(!h||!Number.isInteger(h.mes)||h.mes<1||h.mes>6)continue;
  for(const campo of campos){
   const v=h[campo];
   const valido=campo==='deficit'?typeof v==='boolean':
    campo==='parcelasBaixadasMes'||campo==='escolhasIds'?Array.isArray(v):
    typeof v==='number'&&Number.isFinite(v);
   if(!valido)faltantes.push({mes:h.mes,campo});
  }
 }
 const cobertura=auditarCoberturaVencimentosEtapa147(escolhas,historico);
 const proveniencia=typeof auditarProvenienciaEtapa136==='function'?auditarProvenienciaEtapa136(registros,historico):null;
 const completa=hs.length===6&&ausentes.length===0&&duplicados.length===0&&foraFaixa===0&&faltantes.length===0;
 const conciliacaoAceitavel=cobertura.estado==='conciliado'||cobertura.estado==='sem_parcelas_projetadas';
 const prontaParaRevisao=completa&&conciliacaoAceitavel;
 return {etapa:148,mesesRegistrados:hs.length,ausentes,duplicados,foraFaixa,camposFaltantes:faltantes,
  historicoCompleto:completa,conciliacaoVencimentos:cobertura.estado,prontaParaRevisao,
  provenienciaDisponivel:!!proveniencia,notaAutomatica:null,nota1000Comprovada:false,
  aviso:'Pronta para revisao significa apenas integridade documental; nao comprova justica da rubrica, nem 1000/1000, nem teste de navegador.'};
}

// Etapa 149: experimento reproduzivel de teto de pontuacao, sem fabricar notas.
// Um historico sintetico completo NAO equivale a uma partida do motor real.
function diagnosticarTetoSeisMesesEtapa149(registros=[],escolhas=[],historico=[]){
 const integridade=auditarPartidaCompletaEtapa148(registros,escolhas,historico);
 if(!integridade.prontaParaRevisao)return {etapa:149,estado:'evidencias_insuficientes',integridade,nota:null,nota1000Comprovada:false};
 const resultado=pontuar(registros,historico);
 const lacunas=resultado.auditoriaLacunasEtapa128;
 const semAvaliacaoDireta=lacunas.itens.filter(x=>!x.evidenciaDireta).map(x=>({categoria:x.categoria,subcriterio:x.subcriterio,pontos:x.pontos,maximo:x.maximo}));
 const perdas=lacunas.itens.filter(x=>x.naoAtribuidos>0).map(x=>({categoria:x.categoria,subcriterio:x.subcriterio,perda:x.naoAtribuidos,origem:x.origem}));
 return {etapa:149,estado:'diagnostico_experimental',nota:resultado.total,maximo:1000,
  pontosNaoAtribuidos:1000-resultado.total,semAvaliacaoDireta,perdas,
  integridade,nota1000Comprovada:false,
  aviso:'Resultado de formula experimental. Mesmo nota 1000 nao prova justica ou partida real; validar com motor e escolhas efetivas.'};
}

// Etapa 151: separar perda calculada de insuficiencia de evidencia.
// Diagnostico somente: nao redistribui pontos, nao considera 1000 validado.
function mapearPendenciasRubricaEtapa151(registros=[],escolhas=[],historico=[]){
 const base=diagnosticarTetoSeisMesesEtapa149(registros,escolhas,historico);
 if(base.estado!=='diagnostico_experimental')return {etapa:151,estado:'evidencias_insuficientes',integridade:base.integridade,nota1000Comprovada:false};
 const resultado=pontuar(registros,historico);
 const itens=resultado.auditoriaLacunasEtapa128.itens.map(item=>{
  const semDireta=!item.evidenciaDireta;
  const perda=item.naoAtribuidos;
  return {categoria:item.categoria,subcriterio:item.subcriterio,maximo:item.maximo,pontos:item.pontos,
   pontosNaoAtribuidos:perda,origem:item.origem,
   estadoEvidencia:semDireta?'sem_avaliacao_direta':'com_avaliacao_direta',
   prioridade:semDireta?'validar_origem_da_nota':perda>0?'revisar_justificativa_da_perda':'conferir_representatividade'};
 });
 const grupos={};
 for(const item of itens){
  if(!grupos[item.categoria])grupos[item.categoria]={maximo:0,pontos:0,pontosNaoAtribuidos:0,semAvaliacaoDireta:0};
  const g=grupos[item.categoria];g.maximo+=item.maximo;g.pontos+=item.pontos;
  g.pontosNaoAtribuidos+=item.pontosNaoAtribuidos;if(item.estadoEvidencia==='sem_avaliacao_direta')g.semAvaliacaoDireta++;
 }
 return {etapa:151,estado:'mapeamento_experimental',nota:base.nota,pontosNaoAtribuidos:base.pontosNaoAtribuidos,
  totalSubcriterios:itens.length,semAvaliacaoDireta:itens.filter(i=>i.estadoEvidencia==='sem_avaliacao_direta').length,
  grupos,itens,nota1000Comprovada:false,
  aviso:'Perda numerica nao prova erro de pontuacao. Ausencia de nota direta nao prova mau desempenho; validar com escolhas reais e consequencias.'};
}

// Etapa 154: cobertura factual das escolhas do motor; diagnostico, sem pontos artificiais.
function auditarEvidenciasEscolhasEtapa154(escolhas=[],historico=[]){
 const tipos=['acontecimento','resolucao-deficit','contas-essenciais','orcamento','viagem'];
 const meses=new Set((Array.isArray(historico)?historico:[]).map(h=>h&&h.mes).filter(m=>Number.isInteger(m)&&m>=1&&m<=6));
 const itens=(Array.isArray(escolhas)?escolhas:[]).filter(e=>e&&tipos.includes(e.tipo)).map(e=>{
  const d=e.detalhes||{};const faltantes=[];
  if(!Number.isInteger(e.mes)||e.mes<1||e.mes>6)faltantes.push('mes_invalido');
  if(!e.id)faltantes.push('id_ausente');
  if(!e.contextoAntes||!Number.isFinite(e.contextoAntes.livre)||!Number.isFinite(e.contextoAntes.reserva))faltantes.push('contexto_financeiro_ausente');
  if(!Array.isArray(d.alternativasDisponiveis)||!d.alternativasDisponiveis.length)faltantes.push('alternativas_ausentes');
  else if(!d.alternativasDisponiveis.some(a=>a.id===d.alternativaEscolhida))faltantes.push('alternativa_escolhida_sem_vinculo');
  if(!d.avaliacaoAlternativa||!Number.isFinite(d.avaliacaoAlternativa.nota)||d.avaliacaoAlternativa.nota<0||d.avaliacaoAlternativa.nota>100||!d.avaliacaoAlternativa.justificativa||!d.avaliacaoAlternativa.origem)faltantes.push('avaliacao_fundamentada_ausente');
  return {id:e.id||null,mes:e.mes,tipo:e.tipo,faltantes,completa:!faltantes.length};
 });
 const mesesAusentes=[1,2,3,4,5,6].filter(m=>!meses.has(m));
 return {estado:mesesAusentes.length?'historico_incompleto':itens.length&&itens.every(i=>i.completa)?'evidencias_completas':'evidencias_pendentes',mesesAusentes,escolhasAnalisadas:itens.length,completas:itens.filter(i=>i.completa).length,pendentes:itens.filter(i=>!i.completa).length,itens,notaAutomatica:null,observacao:'Diagnostico documental: avaliacao ausente nao implica escolha ruim e nao gera nota.'};
}

// Etapa 156: ponte auditavel entre escolhas documentadas e registros da rubrica.
// Nao converte uma nota de alternativa em nota de criterio sem regra aprovada.
function conciliarEvidenciasRubricaEtapa156(registros=[],escolhas=[],historico=[]){
 const auditoria=auditarEvidenciasEscolhasEtapa154(escolhas,historico);
 const mapa={
  planejamento:{orcamento:['orcamento'],compromissos:['compromissos'],futuro:['futuro','compromissosFuturos'],objetivo:['objetivo','reserva']},
  decisoes:{viabilidade:['viabilidade'],dividas:['dividas'],consequencias:['consequencias'],oportunidades:['oportunidades']},
  recursos:{essenciais:['essenciais'],custos:['custos'],credito:['credito'],equilibrio:['equilibrio']},
  adaptacao:{imprevistos:[],recuperacao:[],reorganizacao:[],futuro:[]}
 };
 const linhas=[];
 for(const [categoria,sub] of Object.entries(PESOS)){
  for(const [criterio,peso] of Object.entries(sub)){
   const aliases=mapa[categoria][criterio];
   const encontrados=(Array.isArray(registros)?registros:[]).filter(r=>r&&r.categoria===categoria&&aliases.includes(r.comportamento));
   const validos=encontrados.filter(notaDiretaValidaEtapa137);
   const vinculados=validos.filter(r=>{const id=r.origemEscolhaId??r.escolhaId;return id!=null && auditoria.itens.some(e=>e.id===id&&e.completa);});
   const estado=categoria==='adaptacao'?'avaliacao_trajetoria_pendente':!validos.length?'sem_avaliacao_direta':vinculados.length===validos.length?'vinculo_documentado':'avaliacao_sem_vinculo_completo';
   linhas.push({categoria,criterio,peso,estado,avaliacoesDiretas:validos.length,avaliacoesVinculadas:vinculados.length,registrosInvalidos:encontrados.length-validos.length,registrosComIdLegado:validos.filter(r=>r.origemEscolhaId==null&&r.escolhaId!=null).length});
  }
 }
 return {etapa:156,criterios:linhas,criteriosTotal:linhas.length,criteriosComVinculo:linhas.filter(l=>l.estado==='vinculo_documentado').length,
  criteriosSemAvaliacao:linhas.filter(l=>l.estado==='sem_avaliacao_direta').length,
  criteriosSemRegraDireta:linhas.filter(l=>l.estado==='avaliacao_trajetoria_pendente').length,
  escolhasDocumentadas:auditoria.completas,escolhasPendentes:auditoria.pendentes,
  notaAutomatica:null,nota1000Comprovada:false,
  aviso:'Avaliacao de alternativa nao equivale a nota dos 16 criterios. Sem vinculo e regra aprovada, nao criar pontuacao.'};
}
