'use strict';
// Adapta registros reais do motor para o formato da auditoria 180.
// Nunca inventa juros, origem ou comprovante ausentes: emite lacunas explícitas.
function prepararAuditoriaReal181(historico=[],escolhas=[]){
 const cent=v=>Math.round(Number(v)*100)/100;
 const lacunas=[];let anteriores=new Map();
 // A auditoria de seis meses exige sequência cronológica completa, sem duplicatas.
 if(!Array.isArray(historico)) historico=[];
 if(!Array.isArray(escolhas)) escolhas=[];
 if(historico.length!==6 || historico.some((h,i)=>!h || !Number.isInteger(h.mes) || h.mes!==i+1))
  lacunas.push({tipo:"sequencia_mensal_invalida",mesesRecebidos:historico.map(h=>h?.mes)});
 const meses=historico.map(h=>{
  if(!h || typeof h!=="object") {lacunas.push({tipo:"registro_mensal_ausente"});return {mes:null,eventosFinanceirosMes:[],desembolsosDocumentados:[],saldoDividasEssenciais:null};}
  const mes=h.mes,eventos=[],atuais=new Map();
  for(const o of h.origensDividasEssenciais||[]){
   if(!o.id||!Number.isFinite(Number(o.saldo))){lacunas.push({mes,tipo:'origem_sem_identificador_ou_saldo'});continue}
   atuais.set(o.id,cent(o.saldo));
   if(!anteriores.has(o.id)){
    const escolha=escolhas.find(e=>e.id===o.escolhaId&&Number(e.mes)===mes);
    if(!escolha)lacunas.push({mes,tipo:'origem_sem_escolha',id:o.id});
    else eventos.push({tipo:'origem_divida_essencial',origemDividaId:o.id,valor:cent(o.valorInicial)});
   }
  }
  const originais=h.eventosFinanceirosMes||[];
  // Eventos explícitos do motor têm precedência sobre inferências.
  for(const ev of originais){
   if(ev.tipo==='juros_divida_essencial')eventos.push({...ev});
   else if(ev.tipo==='pagamento_parcial_ou_quitacao')eventos.push({...ev});
   else if(ev.tipo==='renegociacao_contas_essenciais')eventos.push({...ev,tipo:'renegociacao_divida_essencial',valorRenegociado:ev.novoTotal});
  }
  // Reconstrói somente juros compatíveis com saldo anterior e pagamentos explícitos.
  for(const [id,anterior] of anteriores){
   const pagos=originais.filter(e=>e.tipo==='pagamento_parcial_ou_quitacao').flatMap(e=>e.alocacoesOrigens||[]).filter(a=>a.origemDividaId===id).reduce((a,b)=>a+Number(b.valor),0);
   const renegociado=originais.some(e=>e.tipo==='renegociacao_contas_essenciais'&&(e.origensRenegociadas||[]).some(a=>a.origemDividaId===id));
   const atual=atuais.get(id);
   if(atual===undefined){lacunas.push({mes,tipo:'origem_desaparecida',id});continue}
   const juros=cent(atual+pagos-anterior);
   if(originais.some(e=>e.tipo==='juros_divida_essencial'&&e.origemDividaId===id)){
    // Lançamento explícito tem precedência; não inferir juros novamente.
   }else if(renegociado){ // Saldo zerado por acordo; juros não podem ser inferidos do fechamento.
    if(cent(anterior-pagos)!==cent((originais.find(e=>e.tipo==='renegociacao_contas_essenciais'&&(e.origensRenegociadas||[]).some(a=>a.origemDividaId===id))?.origensRenegociadas||[]).find(a=>a.origemDividaId===id)?.valor||0))lacunas.push({mes,tipo:'juros_renegociacao_nao_documentados',id});
   }else if(juros>0)eventos.unshift({tipo:'juros_divida_essencial',origemDividaId:id,valor:juros,fonte:'diferenca_de_saldos_inferida'});
   else if(juros<-.011)lacunas.push({mes,tipo:'reducao_sem_evento',id,valor:juros});
  }
  // Juros incidem antes dos eventos de pagamento/renegociação.
  const linha={mes,eventosFinanceirosMes:eventos,desembolsosDocumentados:h.desembolsosDocumentados||[],saldoDividasEssenciais:h.dividaEssencial};
  if(h.dividaEssencial===undefined)lacunas.push({mes,tipo:'saldo_agregado_ausente'});
  anteriores=atuais;return linha;
 });
 return {meses,lacunas,completo:meses.length===6&&lacunas.length===0,escopo:'registros_internos_do_jogo'};
}
function auditarPartidaReal181(historico=[],escolhas=[]){
 const escolhasValidas=Array.isArray(escolhas)?escolhas:[];
 const adaptado=prepararAuditoriaReal181(historico,escolhasValidas);
 const auditoria=typeof auditarFluxoSeisMeses180==='function'?auditarFluxoSeisMeses180(adaptado.meses,escolhasValidas):
 (typeof require==='function'?require('./decida-auditoria-etapa180.js').auditarFluxoSeisMeses180(adaptado.meses,escolhasValidas):null);
 return {...adaptado,auditoria,aprovado:adaptado.completo&&!!auditoria?.semAlertas};
}
if(typeof module!=='undefined')module.exports={prepararAuditoriaReal181,auditarPartidaReal181};
