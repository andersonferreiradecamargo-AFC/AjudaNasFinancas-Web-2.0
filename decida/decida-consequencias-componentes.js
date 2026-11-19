"use strict";
// Etapa 408: auditoria por componentes. NÃO substitui a nota oficial.
// Distingue evidência observável de juízo pedagógico; não cria penalizações automáticas.
function auditarConsequenciasComponentes408(historico=[],registros=[]){
 const pesos={impactoFuturo:25,cumprimento:20,correcao:15};
 const completo=Array.isArray(historico)&&historico.length===6&&historico.every((h,i)=>h&&h.mes===i+1);
 const meses=historico.map(h=>({mes:h.mes,decisaoEssencial:h.essenciaisDecisao??null,pendenciasEssenciais:Number.isFinite(h.dividaEssencial)?h.dividaEssencial:null,contasNaoPagas:Number.isFinite(h.essenciaisNaoPagas)?h.essenciaisNaoPagas:null,renegociacoes:Number.isFinite(h.renegociacoesMes)?h.renegociacoesMes:null,deficit:typeof h.deficit==='boolean'?h.deficit:null,margem:Number.isFinite(h.margemMes)?h.margemMes:null,parcelas:Number.isFinite(h.parcelasMes)?h.parcelasMes:null}));
 const adiamentos=meses.filter(h=>h.decisaoEssencial==='adiar').map(h=>h.mes);
 const inadimplencia=meses.filter(h=>(h.pendenciasEssenciais??0)>0).map(h=>h.mes);
 const renegociacoes=meses.filter(h=>(h.renegociacoes??0)>0).map(h=>h.mes);
 const saldoFinal=meses.length?meses.at(-1).pendenciasEssenciais:null;
 const notasRegistradas=(Array.isArray(registros)?registros:[]).filter(r=>r.categoria==='decisoes'&&r.comportamento==='consequencias').map(r=>({mes:r.mes??null,nota:r.nota}));
 const faltas=[];
 if(!completo)faltas.push('historico de seis meses completo');
 if(meses.some(h=>h.pendenciasEssenciais===null))faltas.push('saldo de divida essencial em todos os meses');
 if(adiamentos.length)faltas.push('capacidade financeira real no instante de cada adiamento, e quais contas individuais foram adiadas');
 if(inadimplencia.length)faltas.push('vencimentos, pagamentos efetivos e impactos específicos por obrigação');
 if(renegociacoes.length)faltas.push('condições e cumprimento efetivo de cada acordo, inclusive após o mês 6');
 return {versao:'408',carater:'diagnostico_nao_pontuador',pesos,componentes:{
  impactoFuturo:{maximo:25,nota:null,estado:'pendente_validacao',evidencias:{mesesComPendencias:inadimplencia,saldoFinal},lacuna:'atribuir causalidade entre escolha e impacto futuro sem penalização duplicada'},
  cumprimento:{maximo:20,nota:null,estado:'pendente_validacao',evidencias:{adiamentos,mesesComPendencias:inadimplencia},lacuna:'distinguir falta de recursos, inadimplência voluntária e cumprimento de acordos'},
  correcao:{maximo:15,nota:null,estado:'pendente_validacao',evidencias:{mesesRenegociacao:renegociacoes,variacaoDivida:meses.length>1&&meses[0].pendenciasEssenciais!==null&&saldoFinal!==null?Math.round((saldoFinal-meses[0].pendenciasEssenciais)*100)/100:null},lacuna:'comprovar ações corretivas sustentáveis e permitir 15/15 por prevenção'}
 },notasRegistradas,informacoesPendentes:[...new Set(faltas)],
 alerta:'Não inferir nota numérica de saldos isolados. Não somar desconto automático por dívida já avaliada em outros critérios.'};
}
if(typeof module!=='undefined')module.exports={auditarConsequenciasComponentes408};
