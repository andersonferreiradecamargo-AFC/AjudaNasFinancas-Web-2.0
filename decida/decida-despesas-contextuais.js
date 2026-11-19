"use strict";
// Etapa 410: catálogo descritivo das despesas já exibidas na interface.
// Não representa pagamento individual nem define valor moral de um objetivo.
const CATALOGO_DESPESAS_410=Object.freeze([
 {id:'moradia',nome:'Moradia',valorBase:900,natureza:'habitual',finalidade:'abrigo',necessidade:'basica',urgencia:'vencimento_mensal'},
 {id:'alimentacao',nome:'Alimentação',valorBase:1050,natureza:'habitual',finalidade:'alimentacao',necessidade:'basica',urgencia:'continua'},
 {id:'energia',nome:'Energia elétrica',valorBase:220,natureza:'habitual',finalidade:'servico_essencial',necessidade:'basica',urgencia:'vencimento_mensal'},
 {id:'agua',nome:'Água',valorBase:90,natureza:'habitual',finalidade:'servico_essencial',necessidade:'basica',urgencia:'vencimento_mensal'},
 {id:'transporte',nome:'Transporte',valorBase:450,natureza:'habitual',finalidade:'mobilidade',necessidade:'dependente_do_contexto',urgencia:'dependente_do_contexto'},
 {id:'internet_telefone',nome:'Internet e telefone',valorBase:210,natureza:'habitual',finalidade:'comunicacao',necessidade:'dependente_do_contexto',urgencia:'vencimento_mensal'}
]);
function discriminarDespesas410(total){
 if(!Number.isFinite(total)||total<0)throw new Error('Total de despesas invalido');
 const base=CATALOGO_DESPESAS_410.reduce((s,x)=>s+x.valorBase,0);
 const ajuste=Math.round((total-base)*100)/100;
 const itens=CATALOGO_DESPESAS_410.map(x=>({...x,valor:x.valorBase,pagamentoIndividual:'nao_observado',inadimplenciaIndividual:'nao_observada'}));
 if(Math.abs(ajuste)>.005)itens.push({id:'ajuste_flexivel',nome:'Ajuste de despesas flexíveis',valor:ajuste,natureza:'ajuste_orcamentario',finalidade:'ajuste_de_consumo',necessidade:'nao_determinada',urgencia:'nao_determinada',pagamentoIndividual:'nao_observado',inadimplenciaIndividual:'nao_observada'});
 return {versao:410,escopo:'composicao_didatica_do_orcamento',total,ajuste,itens,decisaoPagamento:'somente_agregada',contasIndividuaisPagas:null,contasIndividuaisAtrasadas:null};
}
if(typeof module!=='undefined')module.exports={CATALOGO_DESPESAS_410,discriminarDespesas410};
