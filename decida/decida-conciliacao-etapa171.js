'use strict';
// Reconciliação conservadora: não presume pagamento, contratação ou renegociação.
function conciliarObrigacoesEtapa171(historico=[]){
 const alertas=[],meses=[];let anterior=null;
 for(const h of Array.isArray(historico)?historico:[]){
  if(!Number.isInteger(h?.mes)||h.mes<1|| (anterior&&h.mes!==anterior.mes+1)){
   alertas.push({mes:h?.mes??null,tipo:'sequencia_mensal_invalida'});anterior=null;continue;
  }
  if(!Array.isArray(h.obrigacoesPendentesFechamento)||!Array.isArray(h.parcelasBaixadasMes)){
   alertas.push({mes:h.mes,tipo:'dados_insuficientes'});anterior=null;continue;
  }
  const atual=new Map(),baixas=new Map();
  for(const o of h.obrigacoesPendentesFechamento){
   if(!o||!Number.isFinite(o.valor)||o.valor<0||!Array.isArray(o.pendentes)||!o.origemEscolhaId){alertas.push({mes:h.mes,tipo:'identificador_ou_valor_ausente'});continue;}
   for(const v of o.pendentes){
    if(!Number.isInteger(v)||v<=h.mes){alertas.push({mes:h.mes,tipo:'vencimento_invalido'});continue;}
    const k=String(o.origemEscolhaId)+'|'+v;
    if(atual.has(k))alertas.push({mes:h.mes,tipo:'chave_duplicada',chave:k});
    atual.set(k,o.valor);
   }
  }
  for(const b of h.parcelasBaixadasMes){
   if(!b||!b.origemEscolhaId||!Number.isFinite(b.valor)||b.valor<0){alertas.push({mes:h.mes,tipo:'baixa_sem_rastreabilidade'});continue;}
   const k=String(b.origemEscolhaId)+'|'+h.mes;
   baixas.set(k,(baixas.get(k)||0)+b.valor);
  }
  if(anterior){
   for(const [k,v] of anterior.pendentes){
    const vencimento=Number(k.split('|').pop());
    if(vencimento===h.mes){
     const pago=baixas.get(k)||0;
     if(Math.abs(pago-v)>0.011)alertas.push({mes:h.mes,tipo:'vencimento_nao_conciliado',chave:k,previsto:v,baixa:pago});
    }else if(vencimento>h.mes && (!atual.has(k)||Math.abs(atual.get(k)-v)>0.011)){
     alertas.push({mes:h.mes,tipo:'alteracao_futura_sem_evento_documentado',chave:k});
    }
   }
   for(const [k,v] of atual){if(!anterior.pendentes.has(k))alertas.push({mes:h.mes,tipo:'nova_obrigacao_sem_evento_documentado',chave:k,valor:v});}
  }
  meses.push({mes:h.mes,obrigacoesFuturas:atual.size,baixasRegistradas:h.parcelasBaixadasMes.length});
  anterior={mes:h.mes,pendentes:atual};
 }
 return {meses,alertas,conciliado:meses.length===6&&alertas.length===0,observacao:'Auditoria conservadora. Novas contratações, renegociações e quitações antecipadas exigem eventos identificáveis; ausência de alerta não comprova pagamento externo. Sem efeito na pontuação.'};
}
