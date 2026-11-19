"use strict";
const app=document.getElementById("app"),brl=n=>(Math.round((Number(n)||0)*100)/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:2,maximumFractionDigits:2});
const clean=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let s;
const ILUSTRACOES=["🚗","💻","🧊","📚","💡","🚌"];
function ilustracao(tipo,legenda=""){
 const imagem=tipo==="inicio"?"familia-inicio.jpg":tipo==="final"?"familia-final.jpg":tipo==="conquista"?"familia-conquista.jpg":"familia-meses.jpg";
 return `<figure class="cena"><img src="arte/${imagem}" alt="Família ilustrada do jogo DECIDA" loading="lazy" decoding="async"><figcaption class="sr-only">${clean(legenda)}</figcaption></figure>`;
}
// Escolha visual contextual: não é uma punição por nota, e sim reflexo da trajetória.
function retratoFinanceiro(){
 const margem=Math.max(1,s.renda-s.despesas);
 const parcelaProxima=pendenciasMes(s.mes+1);
 const pressao=parcelaProxima/margem;
 const pendenciaAtual=s.obrigacoes.some(o=>/contas essenciais.*não pagas|energia atrasada/i.test(o.descricao));
 const semCaixa=Math.max(0,s.livre)+Math.max(0,s.reserva)<1;
 const historico=s.historico||[];
 const piora=historico.length>1 && saldoObrigacoes()>Number(historico[historico.length-2].dividas||0)*1.25;
 return {margem,parcelaProxima,pressao,pendenciaAtual,semCaixa,piora};
}
// Expressão proporcional à pressão mensal, não ao total de todas as parcelas futuras.
function situacaoFamilia(final=false){
 const f=retratoFinanceiro(),temAtraso=f.pendenciaAtual || (s.essenciaisDecisao==="adiar" && s.fase!=="fim");
 if((temAtraso && f.semCaixa) || (f.pressao>1.25 && f.semCaixa))return "preocupada";
 if(temAtraso || f.pressao>0.85 || (f.piora && f.pressao>0.60))return "pensativa";
 if(final){
   if(s.meta>=s.metaValor && !temAtraso && f.pressao<=0.65)return "alegre";
   if(f.pressao>0.50 || s.reserva<100)return "pensativa";
   return "futuro";
 }
 if(f.pressao>0.45 || (s.reserva<80 && s.meta<s.metaValor))return "pensativa";
 if(s.meta>=s.metaValor && f.pressao<0.35)return "alegre";
 return "futuro";
}
function familiaContextual(final=false){
 const tipo=situacaoFamilia(final),nomes={alegre:"Família satisfeita com o planejamento",pensativa:"Família refletindo sobre suas escolhas",preocupada:"Família preocupada com as contas",futuro:"Família pensando nos próximos objetivos"};
 return `<figure class="familia-contextual"><img src="arte/familia-${tipo}.webp" alt="${nomes[tipo]}" loading="lazy" decoding="async"></figure>`;
}
function painelHistoria(titulo,descricao,final=false){return `<div class="historia-contextual"><div class="historia-texto"><span class="historia-etiqueta">${final?"RESULTADO FINAL":"RESULTADO DO MÊS "+s.mes}</span><h2>${titulo}</h2><p>${descricao}</p></div>${familiaContextual(final)}</div>`}
function resumoCompacto(){return `<div class="resumo-compacto"><div class="resumo-card"><span>🏠 Despesas habituais</span><strong>${brl(s.despesas)}</strong></div><div class="resumo-card"><span>💰 Dinheiro livre</span><strong>${brl(s.livre)}</strong></div><div class="resumo-card"><span>📅 Compromissos futuros</span><strong>${brl(saldoObrigacoes())}</strong></div><div class="resumo-card"><span>🎯 Meta original</span><strong>${brl(s.meta)} / ${brl(s.metaValor)}</strong></div></div>`}
function estadoFinal(){
 const f=retratoFinanceiro(),divida=saldoObrigacoes();
 if(f.pendenciaAtual || f.pressao>1)return {classe:"atencao",titulo:"Planejar os próximos pagamentos",texto:`As parcelas do próximo mês somam ${brl(f.parcelaProxima)} para uma margem habitual de ${brl(f.margem)}. Reorganizar os compromissos é uma prioridade.`};
 if(divida>0)return {classe:"reflexao",titulo:"Conquistas e próximos passos",texto:`Há ${brl(divida)} em parcelas futuras. ${s.meta>=s.metaValor?"Você alcançou seu objetivo; ":""}continue acompanhando os vencimentos e a reserva.`};
 return {classe:"conquista",titulo:"Uma jornada de aprendizagem",texto:"Você encerrou a partida sem parcelas futuras. Considere também a reserva e as escolhas feitas ao longo dos seis meses."};
}

function inicial(){return {fase:"inicio",mes:1,essenciaisDecisao:null,essenciaisNaoPagas:0,atrasos:0,origensAtrasos:[],acordos:[],avatar:"jogadora",metaNome:"Projeto da família",metaValor:1200,meta:0,novas:0,reserva:0,livre:0,renda:3500,despesas:2920,obrigacoes:[],registros:[],escolhasMensais:[],movimentosReserva:[],historico:[],reduziu:false,metaTrocada:false,pendente:null,ultima:"",ajusteDeficit:0,dividaAcumulada:0,gastosConsumo:0,creditoConsumo:0,creditoNecessidade:0,renegociacoes:0,renegociacoesMes:0,extraDecidida:false,extraAceita:false,eventosFinanceirosMes:[],desembolsosDocumentadosMes:[],idTeste:"",estrategiaTeste:"",exportado:false}}
function lerProgressoSalvo(){try{return localStorage.getItem("decida-teste-07")}catch(e){return null}}
function salvar(){try{localStorage.setItem("decida-teste-07",JSON.stringify(s))}catch(e){}}
// Etapa 312: dinheiro digitado deve ser finito, nao negativo e representavel em centavos.
function valorMonetarioValido312(v){return Number.isFinite(v)&&v>=0&&Math.abs(v*100-Math.round(v*100))<1e-7;}
// Laboratório local: exportação somente mediante ação do testador; sem envio remoto.
// Evidência de sustentabilidade: separa o estado de comprovação da nota experimental.
// Não modifica pontos e não declara a rubrica pedagógica validada.
function resumoSustentabilidadeV120(pontos){
 const item=pontos?.observacoes?.adaptacao?.sustentabilidade;
 const evidencia=item?.trilhaCalculo?.validacaoEvidencia;
 return {subcriterio:'adaptacao.futuro',maximo:30,pontosExperimentais:item?.pontos??null,
  status:evidencia?.status||'pendente_de_comprovacao',
  notaProvisoria:true,notaPedagogicaDefinitiva:false,
  notaComEvidenciaDocumentada:evidencia?.notaDefinitiva===true,
  projecaoStatus:evidencia?.projecaoStatus||'inconclusivo',
  dividaEssencialFinal:evidencia?.dividaEssencialFinal??null,
  aviso:'Nota experimental; comprovação da margem não valida integralmente os 30 pontos.'};
}
function registroLaboratorio(){
 const pontos=pontuar(s.registros,s.historico,s.escolhasMensais);
 return {formato:"decida-laboratorio-v1",versaoJogo:"1.20-experimental",versaoRegras:"1.20-formulas-em-validacao",id:s.idTeste||"sem-id",estrategia:s.estrategiaTeste||"Não informada",concluidoEm:new Date().toISOString(),mesesConcluidos:s.historico.length,pontuacao:pontos,resumoSustentabilidadeV120:resumoSustentabilidadeV120(pontos),auditoriaProvenienciaEtapa136:typeof auditarProvenienciaEtapa136==="function"?auditarProvenienciaEtapa136(s.registros,s.historico):null,conciliacaoEvidenciasRubricaEtapa156:typeof conciliarEvidenciasRubricaEtapa156==="function"?conciliarEvidenciasRubricaEtapa156(s.registros||[],s.escolhasMensais||[],s.historico||[]):null,auditoriaEvidenciasEscolhasEtapa154:typeof auditarEvidenciasEscolhasEtapa154==="function"?auditarEvidenciasEscolhasEtapa154(s.escolhasMensais||[],s.historico||[]):null,pendenciasRubricaEtapa151:typeof mapearPendenciasRubricaEtapa151==="function"?mapearPendenciasRubricaEtapa151(s.registros||[],s.escolhasMensais||[],s.historico||[]):null,diagnosticoTetoEtapa149:typeof diagnosticarTetoSeisMesesEtapa149==="function"?diagnosticarTetoSeisMesesEtapa149(s.registros||[],s.escolhasMensais||[],s.historico||[]):null,auditoriaPartidaCompletaEtapa148:typeof auditarPartidaCompletaEtapa148==="function"?auditarPartidaCompletaEtapa148(s.registros||[],s.escolhasMensais||[],s.historico||[]):null,auditoriaCoberturaVencimentosEtapa147:typeof auditarCoberturaVencimentosEtapa147==="function"?auditarCoberturaVencimentosEtapa147(s.escolhasMensais||[],s.historico||[]):null,auditoriaVencimentosReaisEtapa146:typeof auditarVencimentosReaisEtapa146==="function"?auditarVencimentosReaisEtapa146(s.escolhasMensais||[],s.historico||[]):null,auditoriaCreditoDecisoesEtapa143:typeof auditarCreditoDecisoesEtapa143==="function"?auditarCreditoDecisoesEtapa143(s.escolhasMensais||[],s.historico||[]):null,contratoPontuacaoEtapa125:typeof conferirContratoPontuacaoEtapa125V120==="function"?conferirContratoPontuacaoEtapa125V120(PESOS,SUBROTULOS,pontos):null,metodoExperimental:"Indicadores e fórmulas sujeitos a testes; escolhas auditadas com alternativas",eventosFinanceirosRegistrados:s.historico.flatMap(h=>h.eventosFinanceirosMes||[]),auditoriaPartidaRealEtapa181:typeof auditarPartidaReal181==="function"?auditarPartidaReal181(s.historico||[],s.escolhasMensais||[]):null,auditoriaQuitacoesEtapa179:typeof auditarQuitacoesEtapa179==="function"?auditarQuitacoesEtapa179(s.historico||[],s.escolhasMensais||[]):null,auditoriaAcordosEtapa178:typeof auditarAcordosEtapa178==="function"?auditarAcordosEtapa178(s.historico||[],s.escolhasMensais||[]):null,auditoriaVinculosEtapa174:typeof auditarVinculosEtapa174==="function"?auditarVinculosEtapa174(s.historico||[],s.escolhasMensais||[]):null,auditoriaHistoricaEtapa170:typeof auditarHistoricoObrigacoesEtapa170==="function"?auditarHistoricoObrigacoesEtapa170(s.historico||[]):null,auditoriaCompromissosEtapa169:typeof auditarCompromissosIntegradosEtapa169==="function"?auditarCompromissosIntegradosEtapa169(s.escolhasMensais||[],s.historico||[],s.obrigacoes||[]):null,estadoFinal:{renda:s.renda,despesas:s.despesas,meta:s.meta,novas:s.novas,reserva:s.reserva,livre:s.livre,obrigacoes:s.obrigacoes,dividasFuturas:saldoObrigacoes(),gastosConsumo:s.gastosConsumo,creditoConsumo:s.creditoConsumo,creditoNecessidade:s.creditoNecessidade,renegociacoes:s.renegociacoes,essenciaisNaoPagas:s.essenciaisNaoPagas},avaliacoes:s.registros,escolhasMensais:s.escolhasMensais||[],movimentosReserva:s.movimentosReserva||[],auditoriaGestaoReservaEtapa27:auditarGestaoReservaV120(s.historico,s.movimentosReserva||[],s.escolhasMensais||[]),avaliacaoGestaoReservaEtapa28:avaliarGestaoReservaEtapa28V120(s.historico,s.movimentosReserva||[],s.escolhasMensais||[]),avaliacaoGestaoReservaEtapa29:avaliarGestaoReservaEtapa29V120(s.historico,s.movimentosReserva||[],s.escolhasMensais||[],s.registros),avaliacoesReservaAutomaticasEtapa30:gerarAvaliacoesReservaAutomaticasV120(s.historico,s.movimentosReserva||[],s.escolhasMensais||[]),avaliacaoGestaoReservaEtapa31:avaliarGestaoReservaEtapa31V120(s.historico,s.movimentosReserva||[],s.escolhasMensais||[],s.registros),avaliacaoReservaObjetivosEtapa29:avaliarReservaObjetivosV120(s.historico,s.registros,s.escolhasMensais||[],s.movimentosReserva||[]),vinculosPartidaEtapa124:typeof auditarVinculosPartidaEtapa124V120==="function"?auditarVinculosPartidaEtapa124V120(s.escolhasMensais||[],s.historico||[]):null,simulacaoSeisMesesEtapa123:typeof simularEvidenciasSeisMesesEtapa123V120==="function"?simularEvidenciasSeisMesesEtapa123V120(s.escolhasMensais||[],s.historico||[]):null,auditoriaBaixasEtapa122:typeof auditarBaixasAutomaticasEtapa122V120==="function"?auditarBaixasAutomaticasEtapa122V120(s.historico||[]):null,evidenciasConsequenciasEtapa121:typeof evidenciasConsequenciasEtapa121V120==="function"?evidenciasConsequenciasEtapa121V120(s.escolhasMensais||[],s.historico||[]):null,conciliacaoPagamentosEtapa120:typeof conciliarParcelasPagasEtapa120V120==="function"?conciliarParcelasPagasEtapa120V120(s.escolhasMensais||[],s.historico||[]):null,historicoMensal:s.historico,indicadoresMensais:indicadoresMensais(s.historico,s.registros),auditoriaPontuacaoV120:pontuacaoAuditavelV120(s.registros,s.historico),avaliacaoContextualEtapa7:avaliarContextoV120(s.registros,s.historico,s.escolhasMensais||[]),diagnosticoEtapa8:diagnosticoEtapa8V120(s.registros,s.historico,s.escolhasMensais||[]),verificacaoEtapa9:verificarProntidaoV120(s.registros,s.historico,s.escolhasMensais||[]),diagnosticoRegistrosV120:diagnosticarRegistrosV120(s.registros,s.historico),auditoriaCoberturaEscolhasEtapa23:auditarCoberturaDecisoesV120(s.registros,s.historico,s.escolhasMensais||[]),diagnosticoEvidenciasEtapa39:diagnosticarEvidenciasEtapa39V120(s.registros,s.historico,s.escolhasMensais||[]),auditoriaVinculosEtapa43:auditarVinculosEtapa43V120(s.registros,s.historico,s.escolhasMensais||[]),triagemVinculosEtapa44:triarVinculosEtapa44V120(s.registros,s.historico,s.escolhasMensais||[]),prontidaoPartidaEtapa46:verificarPartidaEtapa46V120(s.registros,s.historico,s.escolhasMensais||[],s.movimentosReserva||[]),rubricaAprovadaEtapa54:typeof auditarRubricaAprovadaV120==="function"?auditarRubricaAprovadaV120(s.registros,s.historico,s.escolhasMensais||[],s.movimentosReserva||[]):null,evidenciasDecisoesEtapa40:evidenciasDecisoesEtapa40(),auditoriaDecisoesEtapa85:typeof auditarDecisoesContextuaisV120==="function"?auditarDecisoesContextuaisV120(s.escolhasMensais||[]):null,parecerContextualEtapa88:typeof parecerContextualEtapa88V120==="function"?parecerContextualEtapa88V120(s.escolhasMensais||[]):null,parecerContextualEtapa89:typeof parecerContextualEtapa88V120==="function"?parecerContextualEtapa88V120(s.escolhasMensais||[]):null,auditoriaEvidenciasNotaEtapa90:typeof auditarEvidenciasNotaEtapa90V120==="function"?auditarEvidenciasNotaEtapa90V120(s.escolhasMensais||[]):null,projecaoCompromissosEtapa93:typeof projetarCompromissosEtapa93V120==="function"?projetarCompromissosEtapa93V120(s.escolhasMensais||[]):null,diagnosticoCapacidadeEtapa99:typeof diagnosticarCapacidadeParcelasEtapa99V120==="function"?diagnosticarCapacidadeParcelasEtapa99V120(s.escolhasMensais||[]):null,diagnosticoNecessidadeReservaEtapa101:typeof diagnosticarNecessidadeReservaEtapa101V120==="function"?diagnosticarNecessidadeReservaEtapa101V120(s.escolhasMensais||[]):null,auditoriaIntegridadeEtapa103:typeof auditarIntegridadeConciliacaoEtapa103V120==="function"?auditarIntegridadeConciliacaoEtapa103V120(s.escolhasMensais||[]):null,conciliacaoEvidenciasEtapa102:typeof conciliarEvidenciasEtapa102V120==="function"?conciliarEvidenciasEtapa102V120(s.escolhasMensais||[]):null,consolidacaoEvidenciasEtapa100:typeof consolidarEvidenciasAlternativasEtapa100V120==="function"?consolidarEvidenciasAlternativasEtapa100V120(s.escolhasMensais||[]):null,avaliacaoParcialCustosEtapa98:typeof avaliarDominanciaParcelamentoEtapa96V120==="function"?avaliarDominanciaParcelamentoEtapa96V120(s.escolhasMensais||[]):null,projecaoTemporalEtapa109:typeof diagnosticarVencimentosEtapa108V120==="function"?diagnosticarVencimentosEtapa108V120(s.escolhasMensais||[]):null,integracaoCapacidadeTemporalEtapa111:typeof integrarCapacidadeTemporalEtapa111V120==="function"?integrarCapacidadeTemporalEtapa111V120(s.escolhasMensais||[],s.margensDocumentadasPorMes||null):null,capacidadeConjuntaEtapa112:typeof avaliarCapacidadeConjuntaEtapa112V120==="function"?avaliarCapacidadeConjuntaEtapa112V120(s.escolhasMensais||[],s.margensBaseDocumentadasPorMes||{}):null,auditoriaCoberturaCapacidadeEtapa113:typeof auditarCoberturaCapacidadeConjuntaEtapa113V120==="function"?auditarCoberturaCapacidadeConjuntaEtapa113V120(s.escolhasMensais||[],s.margensBaseDocumentadasPorMes||{}):null,auditoriaCoerenciaEtapa117:typeof auditarCoerenciaNotasEtapa117V120==="function"?auditarCoerenciaNotasEtapa117V120(s.escolhasMensais||[],s.margensBaseDocumentadasPorMes||{}):null,validacaoNotasEtapa116:typeof validarNotasFundamentadasEtapa116V120==="function"?validarNotasFundamentadasEtapa116V120(s.escolhasMensais||[],s.margensBaseDocumentadasPorMes||{}):null,matrizEvidenciasEtapa115:typeof matrizEvidenciasAlternativasEtapa115V120==="function"?matrizEvidenciasAlternativasEtapa115V120(s.escolhasMensais||[],s.margensBaseDocumentadasPorMes||{}):null,conciliacaoAlternativasCapacidadeEtapa114:typeof conciliarAlternativasCapacidadeEtapa114V120==="function"?conciliarAlternativasCapacidadeEtapa114V120(s.escolhasMensais||[],s.margensBaseDocumentadasPorMes||{}):null,avaliacaoAlternativasEtapa87:typeof avaliarAlternativasEtapa87V120==="function"?avaliarAlternativasEtapa87V120(s.escolhasMensais||[]):null,classificacoes:s.classificacoes||[]};
}
async function exportarLaboratorio(){
 const msg=document.getElementById("laboratorio-status");
 const setMsg=t=>{if(msg)msg.textContent=t};
 const conteudo=JSON.stringify(registroLaboratorio(),null,2);
 // Etapa 328: cada exportacao recebe nome exclusivo, evitando sobrescrever partidas anteriores.
 const nome=`DECIDA_${(s.idTeste||"teste").replace(/[^a-zA-Z0-9_-]/g,"_")}_${new Date().toISOString().replace(/[^0-9]/g,"")}_${Math.random().toString(36).slice(2,10)}.json`;
 try{
  if(window.showDirectoryPicker){
   const pasta=await window.showDirectoryPicker({id:"decida-laboratorio",mode:"readwrite"});
   const arquivo=await pasta.getFileHandle(nome,{create:true});
   // Etapa 332: uma escrita interrompida deve ser abortada antes do download alternativo.
   // A exportação só é confirmada após close() completar sem erro.
   let escrita=null;
   try{
    escrita=await arquivo.createWritable();
    await escrita.write(conteudo);
    await escrita.close();
   }catch(erroEscrita){
    if(escrita&&typeof escrita.abort==="function")try{await escrita.abort()}catch(ignorado){}
    throw erroEscrita;
   }
   s.exportado=true;salvar();setMsg(`✓ Registro salvo na pasta escolhida: ${nome}`);return;
  }
 }catch(e){if(e.name==="AbortError"){setMsg("Salvamento cancelado. Você pode tentar novamente.");return}setMsg("Não foi possível gravar diretamente. Será feito o download do arquivo.")}
 // Etapa 299: falha de download não pode ser apresentada como solicitação bem-sucedida.
 let url=null;
 try{
  url=URL.createObjectURL(new Blob([conteudo],{type:"application/json;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download=nome;
  document.body.appendChild(a);
  try{a.click()}finally{a.remove()}
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  setMsg("Download solicitado. Confira se o arquivo foi salvo na pasta desejada antes de reiniciar.");
 }catch(e){
  if(url)try{URL.revokeObjectURL(url)}catch(ignorado){}
  setMsg("Não foi possível solicitar o download. O progresso permanece salvo neste navegador, se o armazenamento estiver disponível. Tente novamente antes de reiniciar.");
 }
}
function irAoTopo(){window.scrollTo({top:0,left:0,behavior:"instant"});document.documentElement.scrollTop=0;document.body.scrollTop=0;}
function render(persistir=true){const faseAnterior=app.dataset.fase;const t={inicio:telaInicio,contas:telaContas,orcamento:telaOrcamento,evento:telaEvento,desconto:telaDesconto,fechamento:telaFechamento,fim:telaFim};const html=t[s.fase]();const htmlAnterior=app.innerHTML;try{app.innerHTML=html;app.dataset.fase=s.fase;ligar();if(faseAnterior!==s.fase)irAoTopo();}catch(e){app.innerHTML=htmlAnterior;app.dataset.fase=faseAnterior;try{ligar()}catch(ignorado){}throw e}if(persistir&&s.fase!=="inicio")salvar();}
// Etapa 176: livro auxiliar das origens, sem alterar o saldo contábil agregado.
function cent176(v){return Math.round((Number(v)||0)*100)/100}
function registrarOrigemAtraso176(valor,mes,escolhaId){
 s.origensAtrasos=s.origensAtrasos||[];
 const id=`essencial-m${mes}-${escolhaId}`;
 s.origensAtrasos.push({id,mesOrigem:mes,escolhaId,valorInicial:cent176(valor),saldo:cent176(valor)});
 return id;
}
function distribuirPagamento176(valor){
 let restante=cent176(valor),alocacoes=[];
 for(const origem of (s.origensAtrasos||[])){
  if(restante<=0)break;
  const pago=cent176(Math.min(restante,origem.saldo));
  if(pago>0){origem.saldo=cent176(origem.saldo-pago);restante=cent176(restante-pago);alocacoes.push({origemDividaId:origem.id,valor:pago,tipo:origem.saldo<=0?'quitacao_integral':'pagamento_parcial'});}
 }
 return {alocacoes,naoAlocado:restante};
}
function aplicarJurosOrigens176(){
 const antes=(s.origensAtrasos||[]).map(o=>({id:o.id,saldo:cent176(o.saldo)}));
 for(const origem of (s.origensAtrasos||[]))origem.saldo=cent176(origem.saldo*1.05);
 // Diferenças de centavos são absorvidas na última origem ativa, mantendo o agregado como fonte contábil.
 const ativos=(s.origensAtrasos||[]).filter(o=>o.saldo>0);
 if(ativos.length){const diferenca=cent176(s.atrasos-(s.origensAtrasos||[]).reduce((a,o)=>a+o.saldo,0));ativos[ativos.length-1].saldo=cent176(ativos[ativos.length-1].saldo+diferenca)}
 // Registrar juros efetivamente lançados por origem, após conciliação de centavos.
 s.eventosFinanceirosMes=s.eventosFinanceirosMes||[];
 for(const anterior of antes){const atual=(s.origensAtrasos||[]).find(o=>o.id===anterior.id);const valor=cent176((atual?.saldo||0)-anterior.saldo);if(valor>0)s.eventosFinanceirosMes.push({id:`juros-m${s.mes}-${anterior.id}`,tipo:"juros_divida_essencial",mes:s.mes,origemDividaId:anterior.id,saldoAnterior:anterior.saldo,valor,saldoPosterior:cent176(atual.saldo),taxaDidatica:0.05,fonte:"lancamento_motor"});}
}
function saldoObrigacoes(){return s.obrigacoes.reduce((a,o)=>a+o.valor*o.pendentes.length,0)+(s.atrasos||0)}
function pendenciasMes(m){return s.obrigacoes.reduce((a,o)=>a+o.valor*o.pendentes.filter(n=>n===m).length,0)}
function saldoTotal(){return Math.round((saldoMes()+s.livre)*100)/100}
function saldoMes(){const v=s.renda-s.despesas-pendenciasMes(s.mes)+(s.ajusteDeficit||0);return Math.abs(v)<0.005?0:Math.round(v*100)/100}
// Etapa 97: equivalência explícita limitada a opções de parcelamento do mesmo acontecimento.
// A igualdade do benefício não significa que duas opções tenham igual sustentabilidade.
function grupoComparavelParcelamentoEtapa97V120(evento,alternativa){
 if(!evento||typeof evento.titulo!=='string'||!Array.isArray(evento.opcoes)||!alternativa?.parcelas)return null;
 const p=alternativa.parcelas;
 if(!Number.isFinite(p.valor)||!Number.isInteger(p.quantidade)||p.quantidade<1)return null;
 const pares=evento.opcoes.filter(o=>o?.parcelas&&Number.isFinite(o.parcelas.valor)&&o.parcelas.quantidade===p.quantidade&&o.parcelas.inicio===p.inicio);
 if(pares.length<2||!pares.some(o=>o.id===alternativa.id))return null;
 return `evento:${evento.titulo}:parcelas:${p.quantidade}:inicio:${p.inicio}`;
}
// Trilha factual independente das notas: cada ação é registrada uma única vez.
function registrarEscolhaMensal(tipo,detalhes={}){
 if(!Array.isArray(s.escolhasMensais))s.escolhasMensais=[];
 const id=`m${s.mes}-e${s.escolhasMensais.length+1}`;
 const contextoAntes={renda:s.renda,despesas:s.despesas,livre:s.livre,reserva:s.reserva,
  meta:s.meta,metaValor:s.metaValor,atrasos:s.atrasos||0,
  dividas:saldoObrigacoes(),parcelaAtual:pendenciasMes(s.mes),
  parcelaProxima:pendenciasMes(s.mes+1),parcelasExistentes:pendenciasMes(s.mes+1),
  obrigacoesAtuais:s.obrigacoes.filter(o=>o.origemEscolhaId&&o.pendentes.includes(s.mes)).map(o=>({origemEscolhaId:o.origemEscolhaId,valor:o.valor,mes:s.mes}))};
 // Etapa 85: contrato uniforme de evidências para escolhas com alternativas explícitas.
 // Não inventar alternativas para operações administrativas (quitação, auditoriaDesembolsoEtapa119:typeof auditarDesembolsoImediatoEtapa119V120==="function"?auditarDesembolsoImediatoEtapa119V120(s.escolhasMensais||[]):null,escopoAlertasEtapa118:typeof auditarEscopoAlertasEtapa118V120==="function"?auditarEscopoAlertasEtapa118V120(s.escolhasMensais||[],s.margensBaseDocumentadasPorMes||{}):null, renegociação etc.).
 const d={...detalhes};
 if(tipo==='acontecimento'){
  d.alternativasDisponiveis=(d.alternativas||[]).map(a=>{
   // Registrar somente custos explicitamente informados pela alternativa.
   const n={...a};
   // Parcelas são objetos {valor,inicio,quantidade}, não um número.
   // Acréscimo isolado NÃO é o custo total da compra.
   if(Number.isFinite(a.custo)){
    n.custoTotal=a.custo;
    n.valorMensal=a.custo;
   }
   if(a.parcelas&&typeof a.parcelas==='object'&&Number.isFinite(a.parcelas.valor)&&Number.isInteger(a.parcelas.quantidade)&&a.parcelas.quantidade>0){
    n.custoTotal=Math.round(a.parcelas.valor*a.parcelas.quantidade*100)/100;
    n.valorMensal=a.parcelas.valor;
    n.quantidadeParcelas=a.parcelas.quantidade;
    n.primeiroVencimento=Number.isInteger(a.parcelas.inicio)?a.parcelas.inicio:null;
   }
   if(Number.isFinite(a.acrescimo)){
    n.encargosInformados=a.acrescimo;
    if(Number.isFinite(n.custoTotal))n.precoBaseInferido=Math.round((n.custoTotal-a.acrescimo)*100)/100;
   }
   if(a.futura&&Number.isFinite(a.futura.valor)){
    n.obrigacaoFutura=a.futura.valor;
    n.mesObrigacaoFutura=Number.isInteger(a.futura.mes)?a.futura.mes:null;
   }
   return n;
  });
  d.alternativaEscolhida=d.opcao;
 }else if(tipo==='resolucao-deficit'){
  d.alternativasDisponiveis=[...(Number.isFinite(d.reservaDisponivel)&&Number.isFinite(d.valorOriginal)&&d.reservaDisponivel>=d.valorOriginal?[{id:'recursos',titulo:'Usar reserva'}]:[]),{id:'adiar',titulo:'Financiar déficit'},{id:'renegociar',titulo:'Renegociar déficit'}];
  d.alternativaEscolhida=d.alternativa;
 }else if(tipo==='contas-essenciais'){
  d.alternativasDisponiveis=[{id:'pagar'},{id:'adiar'}];d.alternativaEscolhida=d.decisao;
  if(Number.isFinite(d.valor))d.valorConta=d.valor;
  // Não declarar pagamentoConfirmado: a escolha não comprova a baixa financeira.
 }else if(tipo==='renda-extra'){
  d.alternativasDisponiveis=[{id:'aceitar'},{id:'recusar'}];d.alternativaEscolhida=d.aceitou?'aceitar':'recusar';
  if(Number.isFinite(d.liquido))d.valorRendaExtra=d.liquido;
  d.condicoesVerificadas=false; // dados de esforço/condições não comprovados
 }else if(tipo==='viagem'){
  d.alternativasDisponiveis=[{id:'participar'},{id:'recusar'}];d.alternativaEscolhida=d.participou?'participar':'recusar';
 }
 if(Array.isArray(d.alternativasDisponiveis))d.contextoNoMomento={...contextoAntes};
 const escolha={id,mes:s.mes,tipo,detalhes:d,contextoAntes};
 s.escolhasMensais.push(escolha);
 return escolha;
}
// Etapa 26: fatos da reserva, sem atribuição automática de nota.
function registrarMovimentoReserva(tipo,valor,saldoAntes,saldoDepois,origem,escolhaId=null){
 if(!Number.isFinite(valor)||valor<=0)return null;
 if(!Array.isArray(s.movimentosReserva))s.movimentosReserva=[];
 const movimento={id:`r${s.movimentosReserva.length+1}`,mes:s.mes,tipo,
  valor:Math.round(valor*100)/100,saldoAntes:Math.round(saldoAntes*100)/100,
  saldoDepois:Math.round(saldoDepois*100)/100,origem,escolhaId,
  contexto:{renda:s.renda,despesas:s.despesas,livre:s.livre,
   parcelasMes:pendenciasMes(s.mes),dividas:saldoObrigacoes()}};
 s.movimentosReserva.push(movimento);
 return movimento;
}
function resumoReservaMensal(mes){
 const movimentos=(s.movimentosReserva||[]).filter(x=>x.mes===mes);
 const total=tipo=>Math.round(movimentos.filter(x=>x.tipo===tipo).reduce((a,x)=>a+x.valor,0)*100)/100;
 return {mes,aportes:total('aporte'),usos:total('uso'),movimentos,
  // Saldo registrado no fechamento é a fonte da posição final do mês.
  saldoFinal:s.reserva};
}
function registrar(categoria,comportamento,nota){
 // Evidência capturada no momento da escolha; não reinterpreta retroativamente.
 const contexto={renda:s.renda,despesas:s.despesas,livre:s.livre,reserva:s.reserva,
  meta:s.meta,metaValor:s.metaValor,dividas:saldoObrigacoes(),
  parcelaAtual:pendenciasMes(s.mes),parcelaProxima:pendenciasMes(s.mes+1),
  margem:s.renda-s.despesas};
 s.registros.push({id:s.registros.length+1,mes:s.mes,fase:s.fase,categoria,comportamento,nota,contexto,
  escolhaId:s.escolhaEmRegistro?.id??null,origemEscolhaId:s.escolhaEmRegistro?.id??null,escolhaTitulo:s.escolhaEmRegistro?.titulo??null,
  contextoAntes:s.escolhaEmRegistro?.contextoAntes??null});
}
function registrarMapa(map){for(const [cat,sub] of Object.entries(map||{}))for(const [chave,nota] of Object.entries(sub))registrar(cat,chave,nota)}
function orientador(mensagem,complementos=[]){return `<aside class="orientador"><img src="arte/orientador-referencia.png" alt="Orientador ilustrado" width="76" height="76" loading="lazy"><div class="orientador-conteudo"><strong>💡 Ajuda à reflexão</strong><p>${clean(mensagem)}</p>${complementos.filter(x=>x&&x.texto).map(x=>`<div class="orientador-linha"><strong>${clean(x.titulo)}:</strong> ${clean(x.texto)}</div>`).join("")}</div></aside>`}
function escolhaAvatar(){return `<div class="avatares" role="group" aria-label="Escolha o personagem"><label class="avatar-opcao"><input type="radio" name="avatar-escolha" value="jogadora" ${s.avatar==='jogadora'?'checked':''}><img src="arte/jogadora-referencia.png" alt="Ilustração da jogadora"><strong>Jogadora</strong></label><label class="avatar-opcao"><input type="radio" name="avatar-escolha" value="jogador" ${s.avatar==='jogador'?'checked':''}><img src="arte/jogador-referencia.png" alt="Ilustração do jogador"><strong>Jogador</strong></label></div>`}
function topo(){return `<div class="row"><span class="pill">MÊS ${s.mes} DE 6</span><span class="muted small">${clean(s.avatar)} • ${clean(s.metaNome)}</span></div><div class="step">${Array.from({length:6},(_,i)=>`<i class="${i+1<s.mes?"done":i+1===s.mes?"active":""}"></i>`).join("")}</div>`}
// Categorias didáticas que compõem o orçamento-base de R$ 2.920,00.
// Variações de despesas flexíveis aparecem discriminadas no mês correspondente.
function detalhesDespesas(){
 const itens=[["Moradia",900],["Alimentação",1050],["Energia elétrica",220],["Água",90],["Transporte",450],["Internet e telefone",210]];
 const variacao=Math.round((s.despesas-2920)*100)/100;
 if(Math.abs(variacao)>.005)itens.push([variacao<0?"Ajuste de despesas flexíveis":"Variação de despesas do mês",variacao]);
 return `<details class="despesas-abertas"><summary>🏠 Despesas habituais <strong>${brl(s.despesas)}</strong> <span class="small">(toque para ver as contas)</span></summary><div class="lista-despesas">${itens.map(([nome,valor])=>`<div><span>${nome}</span><strong>${brl(valor)}</strong></div>`).join("")}<div class="total-despesas"><span>Total do mês</span><strong>${brl(s.despesas)}</strong></div></div></details>`;
}
function stats(){return `<div class="grid"><div class="stat yellow"><small>🎯 Objetivo original</small><b>${brl(s.meta)} / ${brl(s.metaValor)}</b></div><div class="stat purple"><small>🌱 Novos objetivos</small><b>${brl(s.novas)}</b></div><div class="stat green"><small>🛟 Reserva</small><b>${brl(s.reserva)}</b></div><div class="stat"><small>💳 Dinheiro livre acumulado</small><b>${brl(s.livre)}</b></div></div><p class="small muted">Parcelas e obrigações registradas (inclusive após o mês 6): <strong>${brl(saldoObrigacoes())}</strong> (não significa atraso).</p>${saldoObrigacoes()>s.renda?`<p class="danger small">Atenção: compromissos acumulados superiores à renda mensal. O jogo continuará, mas novos déficits podem aumentar a dívida.</p>`:""}`}
function ajuda(txt){return `<details><summary>💡 Ajuda à reflexão</summary><p class="help">${txt||"Pense no que é necessário agora, no que pode esperar e em como a decisão afetará os meses seguintes. Não existe uma única resposta para todas as famílias."}</p></details>`}
function telaInicio(){return `<section class="panel hero visual-hero">${ilustracao("inicio","Conheça a família que vai acompanhar suas decisões.")}<h2>DECIDA — Sua história financeira</h2><p class="story">Durante seis meses, você vai ajudar uma família a cuidar do orçamento, enfrentar imprevistos e realizar objetivos. Cada escolha tem consequências.</p><p><strong>Tempo estimado:</strong> 5–8 minutos • <strong>Sem cálculos manuais</strong> • Pontuação só no final</p></section><section class="panel"><h2>Escolha seu personagem e seu objetivo</h2><div class="grid inicio-escolhas"><div class="inicio-personagens"><h3>Escolha seu personagem</h3>${escolhaAvatar()}</div><label class="field">🎯 Escolha um objetivo para a família<select id="objetivo"><option value="Projeto da família">Projeto da família</option><option value="Viagem em família">Viagem em família</option><option value="Equipamento para estudar">Equipamento para estudar</option><option value="Melhoria da casa">Melhoria da casa</option></select></label></div><div class="inicio-orientador">${orientador("Antes de começar, pense: como usar o dinheiro disponível e ainda se preparar para imprevistos?")}</div><p class="notice">A família recebe <strong>R$ 3.500</strong> por mês, tem <strong>R$ 2.920</strong> de despesas habituais e deseja guardar <strong>R$ 1.200</strong> para o objetivo escolhido.</p><label class="field">🧪 Estratégia deste teste (opcional)<input id="estrategia-teste" maxlength="100" placeholder="Ex.: endividamento proposital"></label><div class="actions"><button class="btn green" id="iniciar">Começar a história →</button><button class="btn alt" id="retomar" ${lerProgressoSalvo()?"":"disabled"}>Retomar teste salvo</button></div></section>`}
function pagarObrigacoes(){
 let pagas=[];
 if(!Array.isArray(s.parcelasBaixadasMes))s.parcelasBaixadasMes=[];
 for(const o of s.obrigacoes){
  const q=o.pendentes.filter(n=>n===s.mes).length;
  if(q){
   pagas.push(`${o.descricao}: ${brl(q*o.valor)}`);
   s.parcelasBaixadasMes.push({mes:s.mes,origemEscolhaId:o.origemEscolhaId??null,
    descricao:o.descricao,valor:Math.round(q*o.valor*100)/100,quantidade:q,origemRegistro:"baixa_automatica_do_motor",confirmacaoExterna:false});
   o.pendentes=o.pendentes.filter(n=>n!==s.mes);
  }
 }
 s.obrigacoes=s.obrigacoes.filter(o=>o.pendentes.length);
 return pagas;
}
function telaContas(){return telaOrcamento()}
function blocoContas(){if(s.mes!==1&&s.mes!==3)return `<p class="notice small">Contas habituais consideradas no orçamento deste mês. Se faltar dinheiro, será necessário resolver o déficit.</p>`;
return `<div class="contas-compactas"><h3>⚖️ Pagar ou não pagar as contas essenciais?</h3><p class="small">Decida aqui, sem outra página. As contas não pagas viram dívida com juros didáticos de 5% ao mês até a quitação.</p><div class="options"><label class="option"><input type="radio" name="contas-decisao" value="pagar" ${s.essenciaisDecisao!=='adiar'?'checked':''}> Pagar as contas</label><label class="option"><input type="radio" name="contas-decisao" value="adiar" ${s.essenciaisDecisao==='adiar'?'checked':''}> Deixar pendentes</label></div></div>`}
function blocoDividas(){if(!(s.atrasos>0))return '';return `<section class="credit-box"><h3>🤝 Regularizar contas atrasadas</h3><p>Dívida atual: <strong>${brl(s.atrasos)}</strong>. Os juros de 5% incidem mensalmente sobre o saldo não quitado.</p><label class="field">Quanto deseja pagar agora? (R$)<input id="pagar-atraso" type="number" min="0" step="0.01" value="0"></label><p class="small">Você pode quitar ou pagar parcialmente. Para renegociar, selecione um acordo sem novos juros em 3 parcelas, calculado sobre a dívida atual. Parcelas comprometem os meses seguintes.</p><label class="option"><input type="checkbox" id="renegociar-atraso"> Renegociar o saldo restante em 3 parcelas sem juros adicionais</label><p class="small muted">Acordos não apagam juros já acumulados; o saldo negociado deixa de receber juros enquanto o acordo é cumprido.</p></section>`}
function telaOrcamento(){const pend=pendenciasMes(s.mes),livre=saldoMes();if(saldoTotal() < -0.005)return telaDeficit(pend,saldoTotal());return `${topo()}<section class="panel"><h2>📋 Organize o mês ${s.mes}</h2><p>Organize os recursos, as contas e os compromissos do mês.</p><div class="grid"><div class="stat"><small>Renda</small><b>${brl(s.renda)}</b></div><div class="stat despesas-stat">${detalhesDespesas()}</div><div class="stat"><small>Parcelas do mês</small><b>${brl(pend)}</b></div><div class="stat green"><small>Total disponível (mês + acumulado)</small><b>${brl(Math.max(0,saldoTotal()))}</b></div></div>${blocoContas()}${blocoDividas()}${livre<0?`<p class="danger">As contas do mês ultrapassam a renda em ${brl(-livre)}. ${s.ajusteDeficit>0?`Uma solução para o déficit de ${brl(s.ajusteDeficit)} já foi registrada neste mês.`:"O dinheiro livre acumulado será usado para cobrir parte ou toda a diferença."}</p>`:""}<p class="notice small"><strong>De onde vem o saldo?</strong> Dinheiro livre acumulado: ${brl(s.livre)} + resultado deste mês após contas e parcelas${s.ajusteDeficit?" (incluindo a solução do déficit já registrada)":""}: ${brl(livre)} = <strong>${brl(saldoTotal())}</strong>. Ao gastar ou destinar dinheiro, o total diminui; ele não se renova automaticamente.</p>${s.mes===3?`<div class="notice"><strong>Escolha opcional:</strong> neste mês é possível reduzir R$ 60 de despesas flexíveis (por exemplo, lazer), sem afetar contas essenciais. <label><input id="reduzir" type="checkbox" ${s.reduziu?"checked":""}> Ajustar despesas flexíveis em R$ 60</label></div>`:""}<section class="credit-box"><h3>🛍️ Gastos adicionais e crédito (opcional)</h3><p class="small">Quer testar uma compra ou gasto além das despesas habituais? Esse valor <strong>é gasto de verdade</strong>, não dinheiro guardado. Você pode pagar com o saldo do mês ou assumir uma dívida.</p><div class="alloc" style="grid-template-columns:1fr 1fr"><label class="field">Valor do gasto adicional (R$)<input id="gasto-extra" type="number" min="0" step="10" value="0"></label><label class="field">Forma de pagamento<select id="forma-gasto"><option value="vista">À vista (se faltar, oferecer crédito)</option><option value="misto">À vista + financiar o que faltar (5% didáticos)</option><option value="credito">Crédito: pagar no próximo mês (5% didáticos)</option><option value="parcelado">Crédito: 3 parcelas (9% didáticos no total)</option></select></label></div><label class="field">Finalidade do gasto (para reflexão)<select id="finalidade-gasto"><option value="nao_informada">Não informada</option><option value="necessidade">Necessidade da família</option><option value="estudo">Educação ou formação</option><option value="opcional">Consumo opcional</option></select></label><label class="field">Qual é o principal motivo dessa compra?<select id="justificativa-gasto"><option value="">Selecione um motivo (se houver gasto)</option><option value="necessidade_familia">É uma necessidade importante para mim ou minha família.</option><option value="estudo_trabalho">Vai ajudar nos estudos, no trabalho ou em alguma atividade importante.</option><option value="lazer">É algo que desejo comprar para meu lazer ou satisfação pessoal.</option><option value="promocao">É uma oportunidade de compra por causa do preço ou de uma promoção.</option><option value="impulso">Estou comprando por impulso ou influência de outras pessoas.</option></select></label><p class="small muted">A finalidade declarada será confrontada com o orçamento e os compromissos; não garante pontuação máxima.</p><p id="info-gasto" class="small muted">Sem gasto adicional.</p></section><h3>Como distribuir o disponível?</h3><div class="alloc"><label class="field">🎯 Objetivo / novos objetivos (R$)<input id="al-meta" type="number" min="0" step="10" value="0"></label><label class="field">🛟 Reserva (R$)<input id="al-reserva" type="number" min="0" step="10" value="0"></label><label class="field">💳 Dinheiro livre (automático)<input id="al-livre" type="number" value="0" readonly aria-label="Dinheiro livre calculado automaticamente"></label></div><p id="distribuicao" class="notice small">Comece com zero e escolha livremente. O que não for distribuído continuará como dinheiro livre, sem contar como poupança.</p><div class="actions"><button class="btn green" id="confirmar-orcamento">Confirmar orçamento →</button></div>${ajuda("Distribua os recursos de acordo com suas prioridades. A reserva ajuda nos imprevistos; dinheiro livre pode atender gastos cotidianos. Depois que a meta for atingida, os depósitos seguintes vão para novos objetivos. Também é válido manter saldo livre ou ampliar a reserva. A meta original continua registrada como conquista.")}</section><section class="panel"><h3>📊 Saldos acumulados</h3>${stats()}</section>`}
// Etapa 355: dividir um acordo em centavos sem criar parcela de valor zero
// nem cobrar centavos acima do total contratado.
function parcelasDeficitRenegociado(falta){
 const centavos=Math.round(Math.round(falta*1.04*100));
 const primeira=Math.ceil(centavos/2)/100,segunda=Math.floor(centavos/2)/100;
 return [primeira,segunda].filter(v=>v>0);
}
function telaDeficit(pend,livre){const falta=Math.max(0,Math.round(-livre*100)/100),caixa=s.reserva;return `${topo()}<section class="panel hero visual-hero">${ilustracao("mes","Mesmo diante de dificuldades, é possível buscar alternativas.")}<h2>⚠️ O orçamento ficou negativo</h2>${orientador("É possível continuar mesmo com compromissos acima da renda. Observe as parcelas futuras e escolha como lidar com a diferença.")}<p>A renda do mês é ${brl(s.renda)}, mas despesas habituais (${brl(s.despesas)}) e parcelas (${brl(pend)}) somam ${brl(s.despesas+pend)}.</p>${detalhesDespesas()}<p class="danger"><strong>Faltam ${brl(falta)} neste mês.</strong> Isso não encerra a partida. Você pode assumir a dívida e continuar, mesmo que já tenha outras parcelas.</p><p>Reserva disponível: <strong>${brl(caixa)}</strong>. O dinheiro livre acumulado já foi abatido da falta; a reserva ainda não foi usada.</p></section><section class="panel"><h3>Como a família vai lidar com a diferença?</h3><div class="options">${caixa>=falta?`<label class="option"><input type="radio" name="deficit" value="recursos" checked><strong>Usar dinheiro livre e reserva</strong><small>Cobrir ${brl(falta)} agora; não criar nova dívida.</small></label>`:""}<label class="option"><input type="radio" name="deficit" value="adiar" ${caixa<falta?'checked':''}><strong>Deixar o valor pendente</strong><small>Transferir ${brl(falta)} para o próximo mês, com encargo didático de 5%: ${brl(Math.round(falta*1.05*100)/100)}. A dívida continua mesmo se não puder ser paga depois.</small></label><label class="option"><input type="radio" name="deficit" value="renegociar"><strong>Renegociar em duas parcelas</strong><small>Transferir a diferença para os próximos dois meses, com encargo total didático de 4%. ${(()=>{const parcelas=parcelasDeficitRenegociado(falta);return `Vencimentos: ${parcelas.map(brl).join(" e ")}. Total ${brl(parcelas.reduce((a,b)=>a+b,0))}.`;})()}</small></label></div><button class="btn green" id="resolver-deficit">Registrar decisão e continuar →</button>${ajuda("Um saldo negativo não é dinheiro disponível. Se faltar renda, a família precisa usar recursos já guardados, negociar ou deixar obrigações pendentes. Dívidas acumuladas reduzem a capacidade de escolha nos próximos meses.")}</section><section class="panel">${stats()}</section>`}
function telaEvento(){const ev=EVENTOS[s.mes-1];return `${topo()}${s.mes===3?`<section class="panel"><h3>💼 Oportunidade de renda extra</h3><p>Um serviço temporário no fim de semana paga R$ 250, mas exige R$ 30 de transporte. O ganho líquido seria de <strong>R$ 220</strong>. A família também pode preferir descansar ou cuidar de outros compromissos.</p>${!s.extraDecidida?`<div class="actions"><button class="btn green" id="aceitar-extra">Aceitar trabalho</button><button class="btn alt" id="recusar-extra">Recusar trabalho</button></div>`:`<p class="notice">${s.extraAceita?"Trabalho aceito: R$ 220 líquidos adicionados ao dinheiro livre, disponíveis agora.":"O trabalho foi recusado. Nenhuma penalidade automática."}</p>`}</section>`:""}<section class="panel hero visual-hero">${ilustracao("mes","Uma nova situação para a família.")}<span class="pill">ACONTECIMENTO DO MÊS</span><h2>${ev.icone} ${ev.titulo}</h2><p class="story">${ev.texto}</p></section><section class="panel"><h3>O que a família decide?</h3><div class="options">${ev.opcoes.map((o,i)=>`<label class="option"><input type="radio" name="escolha" value="${o.id}" ${i===0?"checked":""}><strong>${o.titulo}</strong><small>${o.desc}</small></label>`).join("")}</div><div class="actions"><button class="btn green" id="escolher">Confirmar escolha →</button></div>${ajuda()}</section><section class="panel"><h3>Seu orçamento neste momento</h3>${stats()}<details><summary>Ver compromissos futuros</summary>${s.obrigacoes.length?`<ul>${s.obrigacoes.map(o=>`<li>${clean(o.descricao)}: ${o.pendentes.map(m=>`mês ${m}`).join(", ")} — ${brl(o.valor)} por parcela</li>`).join("")}</ul>`:"<p>Nenhuma parcela futura.</p>"}</details></section>`}
function telaDesconto(){const concedido=s.descontoConcedido??(s.descontoConcedido=(Array.from(s.idTeste||"teste").reduce((n,c)=>n+c.charCodeAt(0),0)%2===0));return `${topo()}<section class="panel hero visual-hero">${ilustracao("mes","A família conversa sobre a viagem escolar.")}<h2>🏫 Resposta da escola</h2><p>A família solicitou reduzir o preço da viagem de R$ 350 para R$ 280. <strong>${concedido?"A escola concedeu o desconto: R$ 280.":"A escola não concedeu o desconto: R$ 350."}</strong></p><p>Essa resposta é uma condição do cenário, não uma escolha do jogador. Agora você decide se deseja participar.</p></section><section class="panel"><h3>O que a família fará?</h3><div class="actions"><button class="btn green" id="confirmar-viagem">Confirmar viagem por ${brl(concedido?280:350)}</button><button class="btn alt" id="recusar-viagem">Não participar desta vez</button></div></section><section class="panel">${stats()}</section>`}
function telaFechamento(){const h=s.historico[s.historico.length-1];const tipo=situacaoFamilia();const f=retratoFinanceiro();const mensagem=(s.ultima||"").includes("Não fazer o curso")?"Você pesquisou alternativas e evitou assumir uma nova parcela neste mês. Continue acompanhando os compromissos já existentes.":tipo==="preocupada"?"Há dificuldade para cumprir compromissos. Avalie prioridades e possibilidades de reorganização sem perder de vista as necessidades essenciais.":tipo==="alegre"?"Você avançou em seus objetivos. Continue observando os compromissos que ainda vão vencer.":f.pressao>0.45?`As parcelas do próximo mês comprometem ${Math.round(f.pressao*100)}% da margem habitual. Sua organização e os pagamentos em dia também contam.`:"Você fez escolhas que mudaram seus recursos e compromissos. Observe o que funcionou e o que pode melhorar.";return `${topo()}<section class="panel hero fechamento-novo">${painelHistoria("📊 Resultado do mês "+s.mes,"Veja como as escolhas deste mês afetaram as finanças da família.")}<div class="orientacao-compacta">${orientador(mensagem,[{titulo:"Sua decisão",texto:h.resumo},{titulo:"Para refletir",texto:h.reflexao}])}</div><h3>💰 Resumo das contas do mês</h3>${resumoCompacto()}<details class="movimentos-compactos"><summary>📋 Ver movimentações e saldos detalhados</summary><ul>${h.movimentos.map(x=>`<li>${clean(x)}</li>`).join("")}</ul>${stats()}</details><div class="actions resultado-acoes"><button class="btn green" id="proximo">${s.mes===6?"Ver avaliação final →":"Continuar para o mês "+(s.mes+1)+" →"}</button></div></section>`}

function telaFim(){
 const p=pontuar(s.registros,s.historico,s.escolhasMensais),estado=estadoFinal();
 const sustentabilidade=resumoSustentabilidadeV120(p);
 const icones={planejamento:"🎯",decisoes:"📊",recursos:"📋",adaptacao:"🔄"};
 const avaliacao=Object.entries(p.criterios).map(([cat,pts])=>`<details class="fim-criterio"><summary><span>${icones[cat]||"📈"} ${ROTULOS[cat]}</span><strong>${pts} <small>/ 250</small></strong></summary><div class="fim-criterio-corpo"><div class="bar"><span style="width:${pts/250*100}%"></span></div><p>Detalhamento da avaliação:</p><ul>${Object.values(p.observacoes[cat]).map(item=>`<li>${clean(item.rotulo)}: <strong>${item.pontos}/${item.maximo}</strong>${cat==="adaptacao"&&item===p.observacoes.adaptacao.sustentabilidade?` <small>(nota experimental; ${sustentabilidade.status==="projecao_documentada"?"projeção documentada, avaliação pedagógica pendente":"comprovação financeira pendente"})</small>`:""}</li>`).join("")}</ul><p class="small muted">A avaliação considera escolhas, dívidas futuras e mudanças ao longo dos seis meses.</p></div></details>`).join("");
 return `<section class="panel hero visual-hero fim-painel">${painelHistoria("🏁 Sua história financeira chegou ao fim!","Seis meses de escolhas, planejamento, mudanças e aprendizado.",true)}<div class="fim-resumo"><div class="fim-placar"><div><span class="fim-legenda">🏆 Pontuação final</span><div class="fim-numero">${p.total}<small> / 1.000</small></div><span class="fim-status">${estado.classe==="conquista"?"✓ Jornada concluída":estado.classe==="atencao"?"↗ Hora de reorganizar":"✓ Aprendizado em andamento"}</span></div><img src="arte/orientador-referencia.png" alt="Orientador ilustrado" loading="lazy"></div><div class="fim-reflexao"><strong>💡 Ajuda à reflexão</strong><p>${s.meta>=s.metaValor?"Você alcançou a meta original. ":""}${s.essenciaisNaoPagas?"Houve adiamento de contas essenciais durante a trajetória. ":"Você priorizou as contas essenciais durante a trajetória. "}${saldoObrigacoes()>0?`Restam ${brl(saldoObrigacoes())} em compromissos futuros; acompanhe as parcelas.`:"Não há parcelas futuras registradas."} A nota considera escolhas e consequências, não apenas o saldo final.</p><div class="fim-proximos ${estado.classe}"><strong>🚩 ${estado.titulo}</strong><p>${estado.texto}</p></div></div></div><h3 class="fim-subtitulo">📈 Sua avaliação</h3><div class="fim-criterios">${avaliacao}</div><details class="fim-metodo"><summary>Como a pontuação foi calculada?</summary><p>Quatro áreas de até 250 pontos, divididas em quatro subitens cada. São considerados os pagamentos essenciais, a margem mensal após despesas habituais, o comprometimento por parcelas, os encargos, a finalidade da compra e a recuperação ao longo da partida. Um indicador sem avaliação direta usa evidências da trajetória; não recebe nota máxima automaticamente.</p></details><p class="fim-nota">Avaliação experimental: as regras ainda serão calibradas e testadas com trajetórias diferentes antes da publicação.</p></section><section class="panel"><h2>💰 Situação financeira final</h2>${stats()}<p><strong>Total guardado e disponível:</strong> ${brl(s.meta+s.novas+s.reserva+s.livre)}.</p><p><strong>Compromissos após o jogo:</strong> ${brl(saldoObrigacoes())}. Parcelas futuras continuam existindo mesmo depois do mês 6.</p><p class="success">O importante não é apenas a nota: é perceber as consequências das escolhas e aprender a se reorganizar.</p><div class="actions"><button class="btn green" id="exportar-laboratorio">📁 Salvar registro desta partida</button><button class="btn alt" id="reiniciar">Jogar novamente ↻</button><a class="btn alt" style="text-decoration:none" href="../aprender/index.html#educacao-financeira">Voltar ao portal</a></div><p id="laboratorio-status" class="small muted">Escolha a pasta laboratorio-testes/partidas ao salvar. Cada partida terá um arquivo diferente. Nenhum dado é enviado à internet.</p></section>`;
}
function deduzir(valor,priorizarReserva=false){
 if(valor<=0)return true;
 let falta=valor;
 const reservaAntes=s.reserva;
 if(priorizarReserva){
  const a=Math.min(Math.max(0,s.reserva),falta);s.reserva-=a;falta-=a;
  const b=Math.min(Math.max(0,s.livre),falta);s.livre-=b;falta-=b;
 }else{
  const a=Math.min(Math.max(0,s.livre),falta);s.livre-=a;falta-=a;
  const b=Math.min(Math.max(0,s.reserva),falta);s.reserva-=b;falta-=b;
 }
 const usado=Math.round((reservaAntes-s.reserva)*100)/100;
 if(usado>0)registrarMovimentoReserva('uso',usado,reservaAntes,s.reserva,
  'pagamento-acontecimento',s.escolhaEmRegistro?.id??null);
 return falta===0;
}
// Classificação pedagógica contextual: orientação, não julgamento definitivo.
// Mantém as notas originais e os efeitos financeiros; evita descontos duplicados.
function classificarOpcao(o){
 const margem=Math.max(1,s.renda-s.despesas);
 const proximo=o.parcelas?.inicio??s.mes+1;
 const compromisso=pendenciasMes(proximo)+(o.parcelas?.valor||0);
 const pressao=compromisso/margem;
 const custoExtra=Number(o.acrescimo)||0;
 const disponivel=Math.max(0,s.livre)+Math.max(0,s.reserva);
 const insuficiente=!!o.custo&&disponivel+0.005<o.custo;
 const essencial=o.tipoGasto==='essencial'||s.mes===3||s.mes===5;
 let classe='boa';
 if(o.parcelas){
   if(pressao>1.00001)classe='arriscada';
   else if(custoExtra>0)classe='atencao';
   else classe='boa';
   
 }else if(insuficiente)classe='atencao';
 else if(!o.custo&&!o.futura&&!o.especial)classe='muito-boa';
 if(o.futura&&o.futura.valor>0)classe='atencao';
 // Adiar uma despesa essencial pode trazer dificuldades, mesmo sem gasto imediato.
 if((s.mes===3||s.mes===5)&&['adiar','atrasar'].includes(o.id))classe='atencao';
 return {classe,pressao:Number(pressao.toFixed(3)),compromisso, margem, insuficiente,
   motivo: insuficiente?'O valor à vista supera os recursos disponíveis.':
   o.parcelas&&pressao>1?'As parcelas previstas superam a margem mensal.':
   
   custoExtra?'Há custo adicional de juros.':'A decisão precisa ser considerada junto ao orçamento.'};
}
function aplicarOpcao(o){
 // Etapa 317: preservar a partida se o fechamento visual falhar após uma escolha.
 const estadoAntesEvento=JSON.parse(JSON.stringify(s));
 let tentouRenderizarEvento=false;
 try{const avaliacaoContextual=classificarOpcao(o);if(o.especial==="desconto"){s.fase="desconto";s.pendente={tipo:"desconto"};tentouRenderizarEvento=true;render();return}
 const eventoAtual=EVENTOS[s.mes-1];
 const eventoContexto={renda:s.renda,despesas:s.despesas,livre:s.livre,reserva:s.reserva,dividas:saldoObrigacoes(),parcelaAtual:pendenciasMes(s.mes),parcelaProxima:pendenciasMes(s.mes+1),margem:s.renda-s.despesas};
 // A decisão de contratar crédito pertence à escolha do evento, não a uma avaliação órfã.
 // O registro é feito depois da confirmação e antes da criação da obrigação.
 let creditoEmergencial=null;
 if(o.custo && Math.max(0,s.livre)+Math.max(0,s.reserva)+0.005<o.custo){
  const faltante=Math.round((o.custo-Math.max(0,s.livre)-Math.max(0,s.reserva))*100)/100;
  if(!confirm(`Faltam ${brl(faltante)} para pagar esta escolha. Deseja contratar crédito didático para a diferença, com 5% de encargo e vencimento no próximo mês?`))return;
  creditoEmergencial={principal:faltante,total:Math.round(faltante*1.05*100)/100,mesVencimento:s.mes+1};
 }
 // Registro factual da escolha e das alternativas, sem atribuir nota automaticamente.
 const escolhaEvento=registrarEscolhaMensal("acontecimento",{evento:eventoAtual.titulo,opcao:o.id,titulo:o.titulo,tipoGasto:o.tipoGasto||null,custo:o.custo||0,acrescimo:o.acrescimo||0,parcelas:o.parcelas||null,futura:o.futura||null,alternativas:eventoAtual.opcoes.map(x=>({id:x.id,titulo:x.titulo,tipoGasto:x.tipoGasto||null,custo:x.custo,acrescimo:x.acrescimo,parcelas:x.parcelas,futura:x.futura,grupoComparavel:grupoComparavelParcelamentoEtapa97V120(eventoAtual,x)})),avaliacaoContextual});
 // Etapa 167: registrar finalidade fornecida pelo proprio acontecimento, sem inventar justificativa do jogador.
 if(typeof eventoAtual.finalidade==="string"&&eventoAtual.finalidade.trim())escolhaEvento.detalhes.finalidade=eventoAtual.finalidade.trim();
 if(typeof eventoAtual.justificativaNecessidade==="string"&&eventoAtual.justificativaNecessidade.trim())escolhaEvento.detalhes.justificativaNecessidade=eventoAtual.justificativaNecessidade.trim();
 // Etapa 160: preservar a classificacao contextual efetivamente calculada no momento
 // da escolha. Isto e evidencia qualitativa, NAO nota 0-100 nem pontuacao aprovada.
 escolhaEvento.detalhes.classificacaoContextual={
  classe:avaliacaoContextual.classe,motivo:avaliacaoContextual.motivo,
  pressao:avaliacaoContextual.pressao,compromisso:avaliacaoContextual.compromisso,
  margem:avaliacaoContextual.margem,insuficiente:avaliacaoContextual.insuficiente,
  origem:'classificarOpcao-v120',notaAutomatica:null
 };
 escolhaEvento.contextoAntes=eventoContexto;
 s.escolhaEmRegistro={id:escolhaEvento.id,titulo:o.titulo??"",contextoAntes:eventoContexto};
 if(creditoEmergencial){
  escolhaEvento.detalhes.creditoEmergencial=creditoEmergencial;
  s.obrigacoes.push({descricao:"Crédito para "+o.titulo,valor:creditoEmergencial.total,pendentes:[creditoEmergencial.mesVencimento],origemEscolhaId:escolhaEvento.id});
  escolhaEvento.detalhes.operacoesCredito=[{origemEscolhaId:escolhaEvento.id,finalidadeRegistrada:o.titulo,origem:"acontecimento",principal:creditoEmergencial.principal,total:creditoEmergencial.total,encargo:Math.round((creditoEmergencial.total-creditoEmergencial.principal)*100)/100,vencimentos:[{mes:creditoEmergencial.mesVencimento,valor:creditoEmergencial.total}]}];
  registrar("decisoes","dividas",.5);registrar("recursos","custos",.5);
  // O crédito financia diretamente a compra: não se mistura ao saldo livre negativo.
 }
 const movimentos=[];if(o.custo){deduzir(Math.round((o.custo-(creditoEmergencial?.principal||0))*100)/100,s.mes===6);movimentos.push(`Pagamento de ${brl(o.custo)} — ${o.titulo}.`)}
 if(o.parcelas){const p=o.parcelas;const margem=Math.max(1,s.renda-s.despesas);const antes=pendenciasMes(p.inicio);const depois=antes+p.valor;const proporcao=depois/margem;
 s.obrigacoes.push({descricao:p.descricao,valor:p.valor,pendentes:Array.from({length:p.quantidade},(_,i)=>p.inicio+i),origemEscolhaId:escolhaEvento.id});
 escolhaEvento.detalhes.operacoesCredito=[...(escolhaEvento.detalhes.operacoesCredito||[]),{origemEscolhaId:escolhaEvento.id,finalidadeRegistrada:o.titulo,origem:"acontecimento",principal:Math.round((p.valor*p.quantidade-(o.acrescimo||0))*100)/100,total:Math.round(p.valor*p.quantidade*100)/100,encargo:o.acrescimo||0,vencimentos:Array.from({length:p.quantidade},(_,i)=>({mes:p.inicio+i,valor:p.valor}))}];
 movimentos.push(`${p.quantidade} parcelas de ${brl(p.valor)} contratadas; início no mês ${p.inicio}. ${o.acrescimo?`Acréscimo de ${brl(o.acrescimo)} sobre o preço à vista. `:"Sem acréscimo informado. "}Compromissos previstos no primeiro vencimento: ${brl(depois)} de uma margem habitual de ${brl(margem)}.`);
 // A finalidade e a capacidade de pagamento são avaliadas juntas, sem punir toda dívida.
 const essencial=o.tipoGasto==="essencial";const risco=proporcao>1?0.35:proporcao>0.75?0.55:proporcao>0.50?0.75:1;
 const custo=o.acrescimo? (essencial?.88:.68):1;
 registrar("recursos","credito",Math.max(0,Math.min(1,risco*custo+(essencial?.10:0))));
 registrar("planejamento","compromissos",risco);
 if(o.acrescimo)registrar("recursos","custos",custo);
}
 if(o.futura){s.obrigacoes.push({descricao:o.futura.descricao,valor:o.futura.valor,pendentes:[o.futura.mes],origemEscolhaId:escolhaEvento.id});movimentos.push(`Pagamento futuro de ${brl(o.futura.valor)} no mês ${o.futura.mes}.`)}
 registrarMapa(o.notas);
 // Registro separado: não altera a fórmula 1.15, já sensível a parcelas, juros e trajetória.
 // Permite auditar classificações sem penalizar o mesmo risco duas vezes.
 s.classificacoes=s.classificacoes||[];
 s.classificacoes.push({mes:s.mes,evento:EVENTOS[s.mes-1].titulo,opcao:o.id,titulo:o.titulo,custo:o.custo||0,acrescimo:o.acrescimo||0,parcelas:o.parcelas||null,futura:o.futura||null,alternativas:EVENTOS[s.mes-1].opcoes.map(x=>({id:x.id,custo:x.custo,acrescimo:x.acrescimo,parcelas:x.parcelas,futura:x.futura})),...avaliacaoContextual});
 movimentos.push(`Análise da escolha: ${({'muito-boa':'muito boa',boa:'boa',atencao:'exige atenção',arriscada:'arriscada'})[avaliacaoContextual.classe]}. ${avaliacaoContextual.motivo}`);
 s.ultima=o.titulo;tentouRenderizarEvento=true;fechar(movimentos)
 }catch(erro){if(!tentouRenderizarEvento)throw erro;s=estadoAntesEvento;try{render(false)}catch(ignorado){}alert("Não foi possível concluir a escolha. O estado anterior da partida foi restaurado.");}
}
// Etapa 40: vincula escolhas efetivas ao fechamento do mês, sem criar notas.
function evidenciasDecisoesEtapa40(){
 const escolhas=s.escolhasMensais||[], avaliacoes=s.registros||[], movimentos=s.movimentosReserva||[];
 return escolhas.map(escolha=>{
  const mes=Number(escolha.mes), historico=(s.historico||[]).find(h=>Number(h.mes)===mes);
  const relacionadas=avaliacoes.filter(r=>r.escolhaId===escolha.id);
  const reserva=movimentos.filter(r=>r.escolhaId===escolha.id);
  return {escolhaId:escolha.id,mes,tipo:escolha.tipo,contextoAntes:escolha.contextoAntes||null,
   detalhes:escolha.detalhes||{},fechamento:historico?{
    margemMes:historico.margemMes,dividas:historico.dividas,
    parcelaProxima:historico.parcelaProxima,reserva:historico.reserva,
    meta:historico.meta,livre:historico.livre,essenciaisDecisao:historico.essenciaisDecisao
   }:null,
   registrosRelacionados:relacionadas.map(r=>({id:r.id,categoria:r.categoria,comportamento:r.comportamento,notaLegada:r.nota})),
   movimentosReserva:reserva.map(r=>({tipo:r.tipo,valor:r.valor,origem:r.origem})),
   estado:historico?'fechamento_registrado':'aguardando_fechamento',
   aviso:'Dados factuais; notas legadas não validam a nova rubrica.'};
 });
}
function fechar(movimentos=[]){const reflexoes=["Uma reserva pode ajudar a enfrentar imprevistos sem abandonar seus planos.","Pesquisar alternativas também é uma forma de cuidar do orçamento.","Uma despesa essencial pode exigir ajustes; o importante é buscar soluções possíveis.","Parcelar significa assumir compromissos nos meses seguintes, mesmo sem juros.","Dinheiro livre também pode ser útil para despesas inesperadas.","As escolhas de hoje afetam o que fica disponível para o futuro."];
 s.escolhaEmRegistro=null;
 s.historico.push({mes:s.mes,eventosFinanceirosMes:(s.eventosFinanceirosMes||[]).map(x=>({...x})),desembolsosDocumentados:(s.desembolsosDocumentadosMes||[]).map(x=>({...x})),obrigacoesPendentesFechamento:(s.obrigacoes||[]).map(o=>({descricao:o.descricao,valor:o.valor,origemEscolhaId:o.origemEscolhaId??null,pendentes:[...(o.pendentes||[])]})),parcelasBaixadasMes:(s.parcelasBaixadasMes||[]).map(x=>({...x})),reservaMovimentosMes:resumoReservaMensal(s.mes),escolhasIds:(s.escolhasMensais||[]).filter(x=>x.mes===s.mes).map(x=>x.id),resumo:s.ultima,movimentos:[...s.movimentosMes||[],...movimentos],reflexao:reflexoes[s.mes-1],meta:s.meta,novas:s.novas,reserva:s.reserva,livre:s.livre,dividas:saldoObrigacoes(),parcelaProxima:pendenciasMes(s.mes+1),margemMes:s.renda-s.despesas,rendaMes:s.renda,despesasMes:s.despesas,parcelasMes:Math.round((pendenciasMes(s.mes)+(s.parcelasBaixadasMes||[]).reduce((v,p)=>v+(Number(p.valor)||0),0))*100)/100,gastosConsumo:s.gastosConsumo||0,creditoConsumo:s.creditoConsumo||0,creditoNecessidade:s.creditoNecessidade||0,metaValor:s.metaValor,extraAceita:s.mes===3?s.extraAceita:null,renegociacoesMes:s.renegociacoesMes||0,essenciaisDecisao:s.essenciaisDecisao,essenciaisNaoPagas:s.essenciaisNaoPagas||0,dividaEssencial:s.atrasos||0,origensDividasEssenciais:(s.origensAtrasos||[]).map(o=>({...o})),deficit:(s.escolhasMensais||[]).some(e=>e.mes===s.mes&&e.tipo==='resolucao-deficit'&&Number(e.detalhes?.valorOriginal)>0),resolucoesDeficitMes:(s.escolhasMensais||[]).filter(e=>e.mes===s.mes&&e.tipo==='resolucao-deficit').map(e=>({id:e.id,alternativa:e.detalhes?.alternativaEscolhida||e.detalhes?.alternativa,valorOriginal:Number(e.detalhes?.valorOriginal)||0,operacoesCredito:e.detalhes?.operacoesCredito||[]}))});
 const atual=s.historico[s.historico.length-1];
 if(typeof eventosReaisEtapa173==='function'){
  const anterior=s.historico.length>1?s.historico[s.historico.length-2]:{mes:0,obrigacoesPendentesFechamento:[]};
  const resultado=eventosReaisEtapa173(anterior,atual,s.escolhasMensais||[]);
  atual.eventosObrigacoes=resultado.eventos;
  atual.avisosEventosObrigacoes=resultado.avisos;
 }
 s.fase="fechamento";render()}
function ligar(){
 const on=(id,fn)=>{const e=document.getElementById(id);if(e)e.addEventListener("click",fn)};
 on("iniciar",()=>{
  // Etapa 296: começar uma nova partida não pode apagar silenciosamente uma partida anterior.
  let progressoSalvo=null;
  progressoSalvo=lerProgressoSalvo()
  if(progressoSalvo&&!confirm("Existe uma partida salva. Começar outra partida substituirá esse progresso. Deseja continuar?"))return;
  const anterior=s;
  try{
   s=inicial();s.avatar=document.querySelector('input[name="avatar-escolha"]:checked')?.value||"jogadora";s.metaNome=document.getElementById("objetivo").value;s.estrategiaTeste=document.getElementById("estrategia-teste")?.value.trim()||"Não informada";s.idTeste=new Date().toISOString().replace(/[-:.TZ]/g,"")+"_"+Math.random().toString(36).slice(2,8);s.fase="orcamento";render();
  }catch(e){s=anterior;alert("Não foi possível iniciar a nova partida. O progresso anterior foi preservado.")}
 });
 on("retomar",()=>{const estadoAnterior=s;try{
  const salvo=JSON.parse(localStorage.getItem("decida-teste-07"));
  const fases=["contas","orcamento","evento","desconto","fechamento","fim"];
  if(!salvo||!fases.includes(salvo.fase)||!Number.isInteger(salvo.mes)||salvo.mes<1||salvo.mes>6||
     !Array.isArray(salvo.obrigacoes)||!Array.isArray(salvo.registros)||
     !Array.isArray(salvo.historico)||salvo.historico.length>6||
     salvo.historico.some((h,i)=>!h||h.mes!==i+1)||
     salvo.historico.length>salvo.mes||
     ((salvo.fase==="fechamento"||salvo.fase==="fim")?salvo.historico.length!==salvo.mes:salvo.historico.length!==salvo.mes-1)||
     (salvo.fase==="fim"&&(salvo.mes!==6||salvo.historico.length!==6))||
     !Array.isArray(salvo.escolhasMensais)||
     salvo.escolhasMensais.some((e,i)=>!e||!Number.isInteger(e.mes)||e.mes<1||e.mes>salvo.mes||
       typeof e.id!=="string"||!e.id||salvo.escolhasMensais.findIndex(x=>x&&x.id===e.id)!==i)||
     ![salvo.renda,salvo.despesas,salvo.reserva,salvo.meta,salvo.metaValor].every(v=>Number.isFinite(v)&&v>=0&&Math.abs(v*100-Math.round(v*100))<1e-7)||
     !(Number.isFinite(salvo.livre)&&Math.abs(salvo.livre*100-Math.round(salvo.livre*100))<1e-7)||
     ![salvo.atrasos,salvo.dividaAcumulada,salvo.gastosConsumo,salvo.creditoConsumo,salvo.creditoNecessidade,salvo.novas].every(v=>v===undefined||(Number.isFinite(v)&&v>=0&&Math.abs(v*100-Math.round(v*100))<1e-7))||
     salvo.obrigacoes.some(o=>!o||!Array.isArray(o.pendentes)||!Number.isFinite(o.valor)||o.valor<0||(o.valor===0&&o.pendentes.length>0)||Math.abs(o.valor*100-Math.round(o.valor*100))>1e-7||
       o.pendentes.some((m,i)=>!Number.isInteger(m)||m<salvo.mes||((salvo.fase==="fechamento"||salvo.fase==="fim")&&m===salvo.mes)||m>120||(i>0&&m<=o.pendentes[i-1]))))
    throw new Error("Registro incompleto ou incompatível");
  s=salvo;render(false);
 }catch(e){s=estadoAnterior;alert("Não foi possível retomar o registro salvo. A partida atual foi mantida.")}});
 document.querySelectorAll('input[name="contas-decisao"]').forEach(el=>el.addEventListener('change',()=>{
 const estadoAntesContas=JSON.parse(JSON.stringify(s));
 const escolha=el.value, anterior=s.essenciaisDecisao;
 if(escolha===anterior)return;
 s.essenciaisDecisao=escolha;
 s.ajusteDeficit=Math.round((s.ajusteDeficit||0)+(escolha==='adiar'?s.despesas:-(anterior==='adiar'?s.despesas:0))*100)/100;
 try{render()}catch(erro){s=estadoAntesContas;try{render(false)}catch(ignorado){}alert("Não foi possível atualizar as contas. O estado anterior foi restaurado.");}
 }));
 const inputs=["al-meta","al-reserva","al-livre"].map(id=>document.getElementById(id));
 function gastoAtual(){const e=document.getElementById("gasto-extra"),f=document.getElementById("forma-gasto"),p=document.getElementById("finalidade-gasto");return {valor:e?Number(e.value):0,forma:f?f.value:"vista",finalidade:p&&["necessidade","estudo","opcional"].includes(p.value)?p.value:"nao_informada",justificativa:(()=>{const v=document.getElementById("justificativa-gasto")?.value||"";return ["necessidade_familia","estudo_trabalho","lazer","promocao","impulso"].includes(v)?v:null})()}}
 function validar(){if(!inputs[0])return;const vals=[Number(inputs[0].value),Number(inputs[1].value),0],g=gastoAtual();const valido=valorMonetarioValido312(g.valor)&&vals.every(valorMonetarioValido312)&&valorMonetarioValido312(Number(document.getElementById("pagar-atraso")?.value||0));
 const pgPrev=Number(document.getElementById("pagar-atraso")?.value||0);const saldoAposDivida=saldoTotal()-pgPrev;const faltaVista=g.forma==="vista"&&g.valor>Math.max(0,saldoAposDivida)+.005;const desembolsoPrevisto=(g.forma==="vista"||g.forma==="misto")?Math.min(g.valor,Math.max(0,saldoAposDivida)):0;const disp=saldoAposDivida-desembolsoPrevisto;const rest=disp-vals[0]-vals[1];if(inputs[2])inputs[2].value=brl(Math.max(0,rest));const msg=document.getElementById("distribuicao");msg.textContent=!valido?"Digite valores válidos e não negativos.":disp>=-.005&&disp<.005&&g.valor===0&&vals.every(v=>v===0)?"Não há saldo para distribuir neste mês. Você pode continuar; dívidas futuras permanecem registradas.":disp<-.005?`Não há recursos suficientes para distribuir. Revise o pagamento da dívida ou o orçamento.`:faltaVista?`Este gasto supera o disponível em ${brl(g.valor-desembolsoPrevisto)}. Ao confirmar, você poderá autorizar o crédito de 5% para a diferença ou cancelar a compra.`:Math.abs(rest)<.01?"✓ Saldo disponível conciliado. Se não houver recursos, você pode continuar sem distribuir dinheiro.":rest>0?`Restam ${brl(rest)}: esse valor continuará como dinheiro livre, sem ser contado como reserva.`:`Você ultrapassou o disponível em ${brl(-rest)}. Guardar mais do que existe não gera empréstimo.`;msg.className=Math.abs(rest)<.01&&valido?"success small":"notice small";
 const info=document.getElementById("info-gasto");if(info){const total=g.forma==="credito"?Math.round(g.valor*1.05*100)/100:Math.round(g.valor*1.09*100)/100;info.textContent=!valido?"Informe um gasto válido.":g.valor===0?"Sem gasto adicional.":g.forma==="misto"?`Usa ${brl(Math.min(g.valor,Math.max(0,saldoTotal()-pgPrev)))} do mês e financia ${brl(Math.max(0,g.valor-Math.max(0,saldoTotal()-pgPrev)))}; no mês ${s.mes+1} vencerá ${brl(Math.round(Math.max(0,g.valor-Math.max(0,saldoTotal()-pgPrev))*1.05*100)/100)} (inclui 5% didáticos).`:g.forma==="vista"?(faltaVista?`Gasto de ${brl(g.valor)}: ${brl(desembolsoPrevisto)} do disponível e ${brl(g.valor-desembolsoPrevisto)} sujeitos à confirmação de crédito didático de 5% no próximo mês.`:`Gasto à vista: ${brl(g.valor)} descontados do disponível deste mês.`):g.forma==="credito"?`Crédito: ${brl(g.valor)} gastos agora; dívida de ${brl(total)} vence no mês ${s.mes+1}.`:total<.03?`Crédito: ${brl(g.valor)} gastos agora; ${Math.round(total*100)} parcela(s) de R$ 0,01 a partir do mês ${s.mes+1}. Total devido: ${brl(total)}.`:`Crédito: ${brl(g.valor)} gastos agora; 3 parcelas de aproximadamente ${brl(total/3)} nos meses ${s.mes+1}, ${s.mes+2} e ${s.mes+3}. Total devido: ${brl(total)}.`;}
 }
 inputs.forEach(e=>e&&e.addEventListener("input",validar));["gasto-extra","forma-gasto","pagar-atraso"].forEach(id=>{const el=document.getElementById(id);if(el){el.addEventListener("input",validar);el.addEventListener("change",validar)}});validar();
 const red=document.getElementById("reduzir");if(red)red.addEventListener("change",()=>{const anterior=JSON.parse(JSON.stringify(s));s.reduziu=red.checked;s.despesas=red.checked?2860:2920;try{render()}catch(erro){s=anterior;try{render(false)}catch(ignorado){}alert("Não foi possível atualizar as despesas. O estado anterior foi restaurado.");}});
 on("resolver-deficit",()=>{
   // Etapa 321: a solução do déficit é indivisível se a interface falhar.
   const estadoAntesDeficit=JSON.parse(JSON.stringify(s));
   let tentouRenderizarDeficit=false;
   try{
   const escolha=document.querySelector('input[name="deficit"]:checked')?.value;
   if(!escolha)return;
   const falta=Math.max(0,Math.round(-saldoTotal()*100)/100);
   // Dívida de R$ 0 nunca pode bloquear a partida.
   if(falta<0.01){s.fase="orcamento";tentouRenderizarDeficit=true;render();return;}
   const caixa=s.reserva;
   // Validar antes de criar evidências: tentativa inviável não é decisão executada.
   if(escolha==="recursos" && caixa+0.001<falta){alert("Recursos insuficientes.");return}
   if(!["recursos","adiar","renegociar"].includes(escolha))return;
   const registroDeficit=registrarEscolhaMensal("resolucao-deficit",{alternativa:escolha,valorOriginal:falta,reservaDisponivel:caixa,encargoPercentual:escolha==="adiar"?5:escolha==="renegociar"?4:0});
   s.escolhaEmRegistro={id:registroDeficit.id,titulo:"Resolução de déficit",contextoAntes:registroDeficit.contextoAntes};
   if(escolha==="recursos"){
     const reservaAntes=s.reserva;
     s.reserva=Math.round((s.reserva-falta)*100)/100;
     registrarMovimentoReserva('uso',falta,reservaAntes,s.reserva,
      'cobertura-deficit',registroDeficit.id);
     registrar("adaptacao","imprevistos",1);
     registrar("recursos","dinheiroGuardado",1);
     s.ultima=`Cobriu déficit de ${brl(falta)} com recursos guardados.`;
   }else if(escolha==="adiar"){
     const v=Math.round(falta*1.05*100)/100;
     s.obrigacoes.push({descricao:"Saldo negativo financiado (5% didáticos)",valor:v,pendentes:[s.mes+1],origemEscolhaId:registroDeficit.id});
     registroDeficit.detalhes.operacoesCredito=[{origemEscolhaId:registroDeficit.id,finalidadeRegistrada:"cobertura de déficit",origem:"resolucao-deficit",principal:falta,total:v,encargo:Math.round((v-falta)*100)/100,vencimentos:[{mes:s.mes+1,valor:v}]}];
     s.dividaAcumulada+=v;s.creditoNecessidade=(s.creditoNecessidade||0)+v;
     registrar("planejamento","compromissos",0);
     registrar("decisoes","dividas",0);
     registrar("adaptacao","recuperacao",.5);
     s.ultima=`Não havia caixa para cobrir ${brl(falta)} das contas do mês; a diferença foi financiada. A nova obrigação será de ${brl(v)} no mês ${s.mes+1}.`;
   }else if(escolha==="renegociar"){
     const parcelas=parcelasDeficitRenegociado(falta);
     const total=Math.round(parcelas.reduce((a,b)=>a+b,0)*100)/100;
     parcelas.forEach((v,i)=>s.obrigacoes.push({descricao:`Saldo negativo renegociado (4% didáticos, parcela ${i+1}/${parcelas.length})`,valor:v,pendentes:[s.mes+i+1],origemEscolhaId:registroDeficit.id}));
     registroDeficit.detalhes.operacoesCredito=[{origemEscolhaId:registroDeficit.id,finalidadeRegistrada:"cobertura de déficit",origem:"resolucao-deficit",principal:falta,total,encargo:Math.round((total-falta)*100)/100,vencimentos:parcelas.map((v,i)=>({mes:s.mes+i+1,valor:v}))}];
     s.dividaAcumulada=Math.round((s.dividaAcumulada+total)*100)/100;s.creditoNecessidade=Math.round(((s.creditoNecessidade||0)+total)*100)/100;s.renegociacoes=(s.renegociacoes||0)+1;s.renegociacoesMes=(s.renegociacoesMes||0)+1;
     registrar("planejamento","compromissos",.5);
     registrar("decisoes","dividas",.5);
     registrar("adaptacao","recuperacao",.5);
     s.ultima=`Não havia caixa para cobrir ${brl(falta)} das contas do mês; a diferença foi renegociada em ${parcelas.length} parcela(s): ${parcelas.map(brl).join(" e ")}.`;
   }else return;
   // Resolve UMA vez o déficit deste mês, sem reabrir a tela com R$ 0.
   s.ajusteDeficit=Math.round(((s.ajusteDeficit||0)+falta)*100)/100;
   s.movimentosDeficit=s.movimentosDeficit||[];
   s.movimentosDeficit.push(s.ultima);s.movimentosDeficit.push(`Déficit original coberto por decisão registrada: ${brl(falta)}; este valor não é renda extra e gera obrigação futura quando financiado.`);
   s.escolhaEmRegistro=null;
   s.fase="orcamento";
   tentouRenderizarDeficit=true;render();
    }catch(erro){if(!tentouRenderizarDeficit)throw erro;s=estadoAntesDeficit;try{render(false)}catch(ignorado){}alert("Não foi possível concluir a solução do déficit. O estado anterior foi restaurado.");}
 });
 on("confirmar-orcamento",()=>{
 // Etapa 316: uma falha de renderização não pode deixar o orçamento parcialmente aplicado.
 const estadoAntesConfirmacao=JSON.parse(JSON.stringify(s));
 let tentouRenderizarOrcamento=false;
 try{const [a,b,c]=[Number(inputs[0].value),Number(inputs[1].value),0],g=gastoAtual();let formaEfetiva=g.forma;
 // Etapa 314: uma entrada direta "misto" que gera dívida exige confirmação explícita.
 if(g.valor>0 && !["vista","misto","credito","parcelado"].includes(g.forma)){alert("Forma de pagamento inválida.");return}
 if(g.valor>0 && !g.justificativa){alert("Selecione o principal motivo da compra antes de confirmar o gasto adicional.");return}
 const pgPrev=Number(document.getElementById("pagar-atraso")?.value||0);
 // Etapa 312: rejeitar valores subcentavo antes de qualquer confirmacao ou registro.
 if(![a,b,c,g.valor].every(valorMonetarioValido312)){alert("Informe valores em reais e centavos, sem quantias negativas.");return}
 // Validar a dívida antes de qualquer confirmação de crédito ou mutação financeira.
 if(!Number.isFinite(pgPrev)||pgPrev<0||Math.abs(pgPrev*100-Math.round(pgPrev*100))>1e-7||pgPrev>(s.atrasos||0)+.005){alert("Pagamento da dívida inválido: informe um valor em centavos, sem ultrapassar o saldo da dívida.");return}
 const disponivelAposDivida=Math.max(0,saldoTotal()-pgPrev);
 if(g.forma==="vista" && g.valor>disponivelAposDivida+.005){
   const diferenca=g.valor-disponivelAposDivida;
   if(!confirm(`Este gasto supera o disponível após pagar a dívida em ${brl(diferenca)}. Deseja pagar o que puder agora e assumir a diferença como dívida, com encargo didático de 5% para o próximo mês?`))return;
   formaEfetiva="misto";
 }
 if(g.forma==="misto" && g.valor>disponivelAposDivida+.005){
   const diferenca=Math.round((g.valor-disponivelAposDivida)*100)/100;
   if(!confirm(`Este gasto exige crédito didático de ${brl(diferenca)}, com encargo de 5% e vencimento no próximo mês. Confirma a contratação?`))return;
 }
 const desembolsoCompra=g.valor===0?0:formaEfetiva==="vista"?g.valor:formaEfetiva==="misto"?Math.min(g.valor,Math.max(0,saldoTotal()-pgPrev)):0;
 const disp=saldoTotal()-pgPrev-desembolsoCompra;
 if(![a,b,c,g.valor].every(valorMonetarioValido312)||disp<-.005){alert("Confira os valores informados em reais e centavos.");return}
 if(Math.abs(a+b+c-disp)>.01){
   if(a+b+c>disp+.01){alert(`Você destinou ${brl(a+b+c)} mas só possui ${brl(Math.max(0,disp))}. Reduza os valores destinados ao objetivo ou à reserva. Crédito para consumo não é dinheiro guardado.`);return}
   // Valor não distribuído permanece como dinheiro livre.
 }
 if((s.mes===1||s.mes===3)&&!s.contasRegistradas){
 const adiar=s.essenciaisDecisao==='adiar';
 const inicioRegistrosContas=s.registros.length;
 // Etapa 409: evidência factual da capacidade ANTES de efetivar a escolha.
 // Não presumir motivo subjetivo nem inventar discriminação de contas no agregado.
 const contextoCompromisso409={
  versao:409,escopo:"despesas_habituais_agregadas",natureza:"mista_nao_individualizada",
  finalidade:"manutencao_do_orcamento_familiar",urgencia:"vencimentos_do_mes",
  necessidadeContextual:"avaliacao_individual_indisponivel",
  valorDevido:s.despesas,rendaMes:s.renda,dinheiroLivreAntes:s.livre,
  saldoDisponivelDepoisDeDespesas:saldoTotal(),recursosAntesDeDespesas:Math.round((s.renda+s.livre-pendenciasMes(s.mes))*100)/100,parcelasVencendo:pendenciasMes(s.mes),
  reservaAntes:s.reserva,dividaEssencialAntes:s.atrasos||0,
  capacidadePagamentoIntegral:s.renda+s.livre-pendenciasMes(s.mes)+.005>=s.despesas,
  alternativasRegistradas:["pagar","adiar"],
  composicaoDespesas410:discriminarDespesas410(s.despesas),
  motivoDeclarado:null,fonte:"estado_financeiro_no_momento_da_confirmacao"
 };
 const escolhaContas=registrarEscolhaMensal("contas-essenciais",{decisao:adiar?"adiar":"pagar",valor:s.despesas,mes:s.mes,contextoCompromisso409});
 if(adiar){s.atrasos=Math.round(((s.atrasos||0)+s.despesas)*100)/100;s.essenciaisNaoPagas=(s.essenciaisNaoPagas||0)+1;registrarOrigemAtraso176(s.despesas,s.mes,escolhaContas.id);
 s.movimentosDeficit=[...(s.movimentosDeficit||[]),`Contas essenciais de ${brl(s.despesas)} ficaram pendentes; juros de 5% ao mês sobre o saldo até regularização.`];
 const voluntario=s.renda+s.livre-pendenciasMes(s.mes)>=s.despesas-.01;registrar("recursos","essenciais",voluntario?0:.5);registrar("planejamento","orcamento",voluntario?0:.5);
 }else{registrar("recursos","essenciais",1);registrar("planejamento","orcamento",1);s.movimentosDeficit=[...(s.movimentosDeficit||[]),`Decidiu pagar as contas essenciais: ${brl(s.despesas)}.`]}
 // Vincula somente as avaliações produzidas por esta decisão, sem alterar suas notas.
 s.registros.slice(inicioRegistrosContas).forEach(r=>{r.escolhaId=escolhaContas.id;r.escolhaTitulo="Pagamento de contas essenciais";r.contextoAntes=escolhaContas.contextoAntes});
 s.contasRegistradas=true;
 }
 const pg=Number(document.getElementById('pagar-atraso')?.value||0);
 if(!Number.isFinite(pg)||pg<0||Math.abs(pg*100-Math.round(pg*100))>1e-7||pg>(s.atrasos||0)+.005){alert('Pagamento da dívida inválido: informe um valor em centavos, sem ultrapassar o saldo da dívida.');return}
 let escolhaQuitacao=null,escolhaAcordo=null;
 if(pg>0){escolhaQuitacao=registrarEscolhaMensal('pagamento-atraso',{valor:pg,saldoAntes:s.atrasos,saldoDepois:Math.round((s.atrasos-pg)*100)/100});const eventoId=`m${s.mes}-${escolhaQuitacao.id}-pagamento`;const distribuicao176=distribuirPagamento176(pg);s.eventosFinanceirosMes.push({id:eventoId,tipo:'pagamento_parcial_ou_quitacao',mes:s.mes,origemEscolhaId:escolhaQuitacao.id,valor:pg,saldoAntes:s.atrasos,saldoDepois:Math.round((s.atrasos-pg)*100)/100,origemDivida:'contas_essenciais',alocacoesOrigens:distribuicao176.alocacoes,naoAlocado:distribuicao176.naoAlocado,tipoLiquidacao:Math.round((s.atrasos-pg)*100)/100<=0?'quitacao_integral':'pagamento_parcial'});s.desembolsosDocumentadosMes.push({eventoId,valor:pg,origemEscolhaId:escolhaQuitacao.id,fonte:'registro_interno_orcamento',confirmacaoExterna:false});s.atrasos=Math.round((s.atrasos-pg)*100)/100;s.movimentosDeficit=[...(s.movimentosDeficit||[]),`Pagou ${brl(pg)} da dívida de contas essenciais.`]}
 if(document.getElementById('renegociar-atraso')?.checked && s.atrasos>.005){
 const total=s.atrasos;const centavos=Math.round(total*100);const base=Math.floor(centavos/3);const parcelasAcordo=Array.from({length:3},(_,i)=>(base+(i<centavos%3?1:0))/100).filter(v=>v>0);const origensRenegociadas176=(s.origensAtrasos||[]).filter(o=>o.saldo>0).map(o=>({origemDividaId:o.id,valor:o.saldo}));
 escolhaAcordo=registrarEscolhaMensal('renegociacao-essenciais',{saldoNegociado:total,parcelas:parcelasAcordo.length,jurosNovos:0,mesesVencimento:parcelasAcordo.map((_,i)=>s.mes+i+1)});s.eventosFinanceirosMes.push({id:`m${s.mes}-${escolhaAcordo.id}-acordo`,tipo:'renegociacao_contas_essenciais',mes:s.mes,origemEscolhaId:escolhaAcordo.id,origemDivida:'contas_essenciais',saldoOriginal:total,novoTotal:total,parcelas:parcelasAcordo.length,jurosNovos:0,origensRenegociadas:origensRenegociadas176});
 parcelasAcordo.forEach((v,i)=>s.obrigacoes.push({descricao:`Acordo de contas essenciais (${i+1}/${parcelasAcordo.length})`,valor:v,pendentes:[s.mes+i+1],origemEscolhaId:escolhaAcordo.id}));
 escolhaAcordo.detalhes.operacoesCredito=[{origemEscolhaId:escolhaAcordo.id,finalidadeRegistrada:"renegociação de contas essenciais",origem:"renegociacao-essenciais",principal:total,total,encargo:0,vencimentos:parcelasAcordo.map((v,i)=>({mes:s.mes+i+1,valor:v}))}];
 s.movimentosDeficit=[...(s.movimentosDeficit||[]),`Renegociou ${brl(total)} em ${parcelasAcordo.length} parcela(s) sem novos juros, mantendo encargos anteriores.`];s.atrasos=0;(s.origensAtrasos||[]).forEach(o=>{o.saldo=0});s.renegociacoesMes=(s.renegociacoesMes||0)+1;
 }
 const escolhaOrcamento=registrarEscolhaMensal("orcamento",{objetivo:a,reserva:b,gastoAdicional:g.valor,finalidade:g.finalidade,
  formaPagamento:formaEfetiva,finalidadeGasto:g.valor>0?(g.finalidade||null):"sem_compra",justificativaGasto:g.valor>0?g.justificativa:"sem_compra",desembolsoAdicional:desembolsoCompra,pagamentoAtraso:pg,
  renegociou:(s.renegociacoesMes||0)>0,
  contasEssenciais:s.essenciaisDecisao||"habitual"});
 // Etapa 45: vinculo causal explicito entre o orcamento confirmado e as operacoes
 // realizadas nesta confirmacao. Nao cria avaliacao ou altera os saldos.
 if(typeof escolhaQuitacao!=='undefined' && escolhaQuitacao){
  escolhaQuitacao.detalhes.orcamentoEscolhaId=escolhaOrcamento.id;
  escolhaQuitacao.detalhes.operacao='quitacao_de_atraso';
 }
 if(typeof escolhaAcordo!=='undefined' && escolhaAcordo){
  escolhaAcordo.detalhes.orcamentoEscolhaId=escolhaOrcamento.id;
  escolhaAcordo.detalhes.operacao='renegociacao_de_atraso';
 }
 s.escolhaEmRegistro={id:escolhaOrcamento.id,titulo:"Distribuição do orçamento",contextoAntes:escolhaOrcamento.contextoAntes};
 const livreNaoDistribuido=Math.max(0,Math.round((disp-a-b-c)*100)/100);
 const pagos=pagarObrigacoes();
 if(g.valor>0){s.gastosConsumo=(s.gastosConsumo||0)+g.valor;}
 let detalheGasto="";
 if(g.valor>0){
   if(formaEfetiva==="misto"){
     const pago=desembolsoCompra;
     const emprestimo=Math.round((g.valor-pago)*1.05*100)/100;
     if(emprestimo>0){s.obrigacoes.push({descricao:"Crédito para gasto acima do disponível (5% didáticos)",valor:emprestimo,pendentes:[s.mes+1],origemEscolhaId:escolhaOrcamento.id});
      escolhaOrcamento.detalhes.operacoesCredito=[{origemEscolhaId:escolhaOrcamento.id,finalidadeRegistrada:g.finalidade==="nao_informada"?null:g.finalidade,origem:"orcamento-misto",principal:Math.round((g.valor-pago)*100)/100,total:emprestimo,encargo:Math.round((emprestimo-(g.valor-pago))*100)/100,vencimentos:[{mes:s.mes+1,valor:emprestimo}]}];s.dividaAcumulada=(s.dividaAcumulada||0)+emprestimo;s.creditoConsumo=(s.creditoConsumo||0)+emprestimo;registrar("decisoes","dividas",0);registrar("planejamento","compromissos",0);}
     detalheGasto=`Gasto adicional ${brl(g.valor)}: ${brl(pago)} pagos com renda e ${brl(emprestimo)} de dívida para o próximo mês.`;
   }
   else if(g.forma==="vista"){detalheGasto=`Gasto adicional à vista: ${brl(g.valor)}.`;registrar("recursos","custos",.5)}
   else if(g.forma==="credito"){
     const v=Math.round(g.valor*1.05*100)/100;
     s.obrigacoes.push({descricao:"Gasto adicional no crédito (5% didáticos)",valor:v,pendentes:[s.mes+1],origemEscolhaId:escolhaOrcamento.id});
     escolhaOrcamento.detalhes.operacoesCredito=[{origemEscolhaId:escolhaOrcamento.id,finalidadeRegistrada:g.finalidade==="nao_informada"?null:g.finalidade,origem:"orcamento-credito",principal:g.valor,total:v,encargo:Math.round((v-g.valor)*100)/100,vencimentos:[{mes:s.mes+1,valor:v}]}];
     s.dividaAcumulada=(s.dividaAcumulada||0)+v;s.creditoConsumo=(s.creditoConsumo||0)+v;
     detalheGasto=`Gasto adicional de ${brl(g.valor)} no crédito. Vence ${brl(v)} no mês ${s.mes+1}.`;
     registrar("decisoes","dividas",.5);registrar("recursos","custos",.5);
   }else{
     const total=Math.round(g.valor*1.09*100)/100;
     const parcelas=[Math.floor(total/3*100)/100,Math.floor(total/3*100)/100];parcelas.push(Math.round((total-parcelas[0]-parcelas[1])*100)/100);
     // Etapa 324: para compras de 1 ou 2 centavos, nao registrar parcelas de R$ 0,00.
     if(total<.03){parcelas.splice(0,3,...Array.from({length:Math.round(total*100)},()=>.01));}
     parcelas.forEach((v,i)=>s.obrigacoes.push({descricao:`Gasto adicional no crédito (parcela ${i+1}/${parcelas.length})`,valor:v,pendentes:[s.mes+i+1],origemEscolhaId:escolhaOrcamento.id}));
     escolhaOrcamento.detalhes.operacoesCredito=[{origemEscolhaId:escolhaOrcamento.id,finalidadeRegistrada:g.finalidade==="nao_informada"?null:g.finalidade,origem:"orcamento-parcelado",principal:g.valor,total,encargo:Math.round((total-g.valor)*100)/100,vencimentos:parcelas.map((v,i)=>({mes:s.mes+i+1,valor:v}))}];
     s.dividaAcumulada=(s.dividaAcumulada||0)+total;s.creditoConsumo=(s.creditoConsumo||0)+total;
     detalheGasto=`Gasto adicional de ${brl(g.valor)} parcelado. Total devido ${brl(total)} em ${parcelas.length} ${parcelas.length===1?"mês":"meses"}.`;
     registrar("decisoes","dividas",.5);registrar("recursos","custos",.5);
   }
 }
const reservaAntesAporte=s.reserva;
const antes=s.meta;const paraMeta=Math.min(a,Math.max(0,s.metaValor-s.meta));s.meta+=paraMeta;s.novas+=a-paraMeta;s.reserva+=b;s.livre=Math.round((c+livreNaoDistribuido)*100)/100;
 if(b>0)registrarMovimentoReserva('aporte',b,reservaAntesAporte,s.reserva,
  'distribuicao-orcamento',escolhaOrcamento.id);
 s.movimentosMes=[...(s.movimentosDeficit||[]),...(detalheGasto?[detalheGasto]:[]),...pagos.map(x=>((s.movimentosDeficit||[]).some(v=>/financiada|renegociada|financiou|renegociou/i.test(v))?"Parcela vencida coberta pelo orçamento e/ou por nova obrigação: ":"Parcela do mês quitada: ")+x),`Destinou ${brl(paraMeta)} à meta original, ${brl(a-paraMeta)} a novos objetivos, ${brl(b)} à reserva e manteve ${brl(c+livreNaoDistribuido)} como dinheiro livre.`];
 registrar("planejamento","objetivo",a>0||s.meta>=s.metaValor?1:0);registrar("planejamento","reserva",b>0?1:0);registrar("planejamento","compromissos",(s.ajusteDeficit||0)>0?.5:1);registrar("recursos","equilibrio",(s.ajusteDeficit||0)>0?.5:1);
 if(s.meta>=s.metaValor&&antes<s.metaValor)s.movimentosMes.push("Meta original alcançada! O valor continua guardado.");
 s.escolhaEmRegistro=null;s.fase="evento";tentouRenderizarOrcamento=true;render()
 }catch(erro){if(!tentouRenderizarOrcamento)throw erro;s=estadoAntesConfirmacao;try{render(false)}catch(ignorado){}alert("Não foi possível confirmar o orçamento. Nenhuma decisão desta tentativa foi aplicada.");}
 });
 // Etapa 318: a renda extra e a recusa sao transacoes atomicas, inclusive quando a interface falha.
 function decidirRendaExtraAtomica(aceitar){
  if(s.mes!==3||s.extraDecidida)return;
  const anterior=JSON.parse(JSON.stringify(s));
  try{
   registrarEscolhaMensal("renda-extra",{aceitou:aceitar,liquido:aceitar?220:0});
   s.extraDecidida=true;s.extraAceita=aceitar;
   if(aceitar){s.livre=Math.round((s.livre+220)*100)/100;s.movimentosMes=[...(s.movimentosMes||[]),"Trabalho extra aceito: R$ 250 recebidos menos R$ 30 de transporte; R$ 220 disponíveis imediatamente."]}
   else{s.movimentosMes=[...(s.movimentosMes||[]),"Oportunidade de trabalho extra recusada, sem entrada de dinheiro."]}
   render();
  }catch(erro){s=anterior;try{render(false)}catch(ignorado){}alert("Não foi possível registrar a decisão sobre o trabalho extra. O estado anterior foi restaurado.")}
 }
 on("aceitar-extra",()=>decidirRendaExtraAtomica(true));
 on("recusar-extra",()=>decidirRendaExtraAtomica(false));
 on("escolher",()=>{const id=document.querySelector('input[name="escolha"]:checked')?.value;const o=EVENTOS[s.mes-1].opcoes.find(o=>o.id===id);if(o)aplicarOpcao(o)});
 // Etapa 320: viagem paga ou recusada deve ser confirmada por inteiro.
 function decidirViagemAtomica(participar){
  const anterior=JSON.parse(JSON.stringify(s));
  try{
   const concedido=!!s.descontoConcedido,preco=concedido?280:350;
   if(participar){
    if(Math.max(0,s.livre)+Math.max(0,s.reserva)+0.005<preco){alert("Não há dinheiro livre e reserva suficientes. Você pode não confirmar a viagem.");return}
    const escolha=registrarEscolhaMensal("viagem",{participou:true,preco,desconto:concedido});
    s.escolhaEmRegistro={id:escolha.id,titulo:"Participar da viagem",contextoAntes:escolha.contextoAntes};
    deduzir(preco,true);registrar("decisoes","viabilidade",1);registrar("recursos","equilibrio",1);
    s.ultima=`A família decidiu participar da viagem por ${brl(preco)}. ${concedido?"Desconto concedido pela escola.":"Desconto não concedido pela escola."}`;
    fechar([`Viagem paga: ${brl(preco)}.`]);
   }else{
    const escolha=registrarEscolhaMensal("viagem",{participou:false,preco:0});
    s.escolhaEmRegistro={id:escolha.id,titulo:"Não participar da viagem",contextoAntes:escolha.contextoAntes};
    registrar("decisoes","viabilidade",1);
    s.ultima="A família decidiu não participar da viagem, preservando os recursos para outras prioridades.";
    fechar(["Nenhum pagamento de viagem."]);
   }
  }catch(erro){s=anterior;try{render(false)}catch(ignorado){}alert("Não foi possível registrar a decisão da viagem. O estado anterior foi restaurado.")}
 }
 on("confirmar-viagem",()=>decidirViagemAtomica(true));
 on("recusar-viagem",()=>decidirViagemAtomica(false));
 on("proximo",()=>{const estadoAnterior=JSON.parse(JSON.stringify(s));try{if(s.mes===6)s.fase="fim";else{s.mes++;if(s.atrasos>0){const anterior=s.atrasos;s.atrasos=Math.round(s.atrasos*1.05*100)/100;aplicarJurosOrigens176();s.movimentosJuros=`Juros didáticos de 5%: dívida de ${brl(anterior)} passou a ${brl(s.atrasos)}.`}s.ajusteDeficit=0;s.movimentosDeficit=s.movimentosJuros?[s.movimentosJuros]:[];s.movimentosJuros="";s.renegociacoesMes=0;s.parcelasBaixadasMes=[];s.eventosFinanceirosMes=(s.eventosFinanceirosMes||[]).filter(e=>e.tipo==="juros_divida_essencial"&&e.mes===s.mes);s.desembolsosDocumentadosMes=[];s.movimentosMes=[];s.essenciaisDecisao=null;s.contasRegistradas=false;s.fase="orcamento"}render();irAoTopo()}catch(erro){s=estadoAnterior;try{render(false)}catch(ignorado){}alert("Não foi possível avançar para o próximo mês. O estado anterior foi restaurado.")}});
 on("exportar-laboratorio",exportarLaboratorio);
 on("reiniciar",()=>{
  if(!confirm(s.exportado?"Começar uma nova partida?":"O registro desta partida ainda não foi confirmado como salvo. Deseja reiniciar mesmo assim?"))return;
  // Etapa 304: somente apagar o progresso anterior após a nova tela estar pronta.
  const anterior=s;
  try{s=inicial();render(false)}catch(e){s=anterior;alert("Não foi possível reiniciar. O progresso anterior foi preservado.");return}
  try{localStorage.removeItem("decida-teste-07")}catch(e){}
 });
}
s=inicial();render();
