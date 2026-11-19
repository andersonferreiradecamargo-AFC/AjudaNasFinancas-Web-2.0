'use strict';
// Reconcilia pagamentos e saldos de origens de dividas ao longo de seis meses.
// Escopo: eventos internos; nao comprova movimentacao bancaria.
function auditarFluxoSeisMeses180(historico=[], escolhas=[]){
 const alertas=[],linha=[],origens=new Map(),ids=new Set();
 const cent=x=>Math.round(Number(x)*100)/100;
 const escolhasMap=new Map(escolhas.map(e=>[e.id,e]));
 const meses=[...historico].sort((a,b)=>a.mes-b.mes);
 for(const h of meses){
  const mes=Number(h.mes);
  if(!Number.isInteger(mes)||mes<1||mes>6||ids.has(mes)){alertas.push({mes,tipo:'mes_invalido_ou_duplicado'});continue}
  ids.add(mes);
  for(const ev of h.eventosFinanceirosMes||[]){
   if(ev.tipo==='origem_divida_essencial'){
    const v=cent(ev.valor),id=ev.origemDividaId||ev.id;
    if(!id||origens.has(id)||!Number.isFinite(v)||v<=0)alertas.push({mes,tipo:'origem_invalida',id});
    else origens.set(id,v);
   }
   if(ev.tipo==='juros_divida_essencial'){
    const id=ev.origemDividaId,v=cent(ev.valor);
    if(!origens.has(id)||!Number.isFinite(v)||v<0)alertas.push({mes,tipo:'juros_sem_origem',id});
    else origens.set(id,cent(origens.get(id)+v));
   }
   if(ev.tipo==='pagamento_parcial_ou_quitacao'){
    if(!escolhasMap.has(ev.origemEscolhaId)||Number(escolhasMap.get(ev.origemEscolhaId).mes)!==mes)alertas.push({mes,tipo:'pagamento_sem_escolha',id:ev.id});
    let total=0;
    for(const a of ev.alocacoesOrigens||[]){
     const id=a.origemDividaId,v=cent(a.valor);total=cent(total+v);
     if(!origens.has(id)||!Number.isFinite(v)||v<=0||v>origens.get(id)+.011)alertas.push({mes,tipo:'pagamento_origem_incompativel',id});
     else origens.set(id,cent(origens.get(id)-v));
    }
    if(Math.abs(total-cent(ev.valor))>.011)alertas.push({mes,tipo:'pagamento_total_incompativel',id:ev.id});
    const desemb=(h.desembolsosDocumentados||[]).filter(d=>d.eventoId===ev.id);
    if(desemb.length!==1||Math.abs(cent(desemb[0]?.valor)-cent(ev.valor))>.011)alertas.push({mes,tipo:'desembolso_nao_conciliado',id:ev.id});
   }
   if(ev.tipo==='renegociacao_divida_essencial'){
    const aloc=ev.origensRenegociadas||[];let total=0;
    for(const a of aloc){const id=a.origemDividaId,v=cent(a.valor);total=cent(total+v);
     if(!origens.has(id)||v<0||Math.abs(origens.get(id)-v)>.011)alertas.push({mes,tipo:'renegociacao_origem_incompativel',id});
     else origens.set(id,0);
    }
    if(!aloc.length||Math.abs(total-cent(ev.valorRenegociado))>.011)alertas.push({mes,tipo:'renegociacao_total_incompativel',id:ev.id});
   }
  }
  const saldo=cent([...origens.values()].reduce((a,b)=>a+b,0));
  if(h.saldoDividasEssenciais!==undefined&&Math.abs(cent(h.saldoDividasEssenciais)-saldo)>.011)alertas.push({mes,tipo:'saldo_mensal_incompativel',esperado:saldo,registrado:h.saldoDividasEssenciais});
  linha.push({mes,saldo,origensAbertas:[...origens.values()].filter(v=>v>.001).length});
 }
 return {linha,alertas,semAlertas:alertas.length===0,escopo:'simulacao_interna_seis_meses'};
}
if(typeof module!=='undefined')module.exports={auditarFluxoSeisMeses180};
