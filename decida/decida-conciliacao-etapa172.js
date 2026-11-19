'use strict';
// Eventos auditáveis de contratação, renegociação e quitação antecipada.
// Apenas eventos explícitos autorizam diferenças; nunca presumir pagamentos.
function conciliarObrigacoesEtapa172(historico=[]){
 const alertas=[],meses=[],ids=new Set();let anterior=null;
 const chave=(id,mes)=>String(id)+'|'+mes;
 for(const h of Array.isArray(historico)?historico:[]){
  if(!Number.isInteger(h?.mes)||h.mes<1||h.mes>6||(anterior&&h.mes!==anterior.mes+1)){alertas.push({mes:h?.mes??null,tipo:'sequencia_mensal_invalida'});anterior=null;continue;}
  if(!Array.isArray(h.obrigacoesPendentesFechamento)||!Array.isArray(h.parcelasBaixadasMes)||!Array.isArray(h.eventosObrigacoes)){alertas.push({mes:h.mes,tipo:'dados_insuficientes'});anterior=null;continue;}
  const atual=new Map(),baixas=new Map(),eventos=new Map();
  for(const o of h.obrigacoesPendentesFechamento){
   if(!o||typeof o.origemEscolhaId!=='string'||!o.origemEscolhaId||!Number.isFinite(o.valor)||o.valor<0||!Array.isArray(o.pendentes)){alertas.push({mes:h.mes,tipo:'obrigacao_invalida'});continue;}
   for(const v of o.pendentes){if(!Number.isInteger(v)||v<=h.mes){alertas.push({mes:h.mes,tipo:'vencimento_invalido'});continue;}const k=chave(o.origemEscolhaId,v);if(atual.has(k))alertas.push({mes:h.mes,tipo:'chave_duplicada',chave:k});atual.set(k,o.valor);}
  }
  for(const b of h.parcelasBaixadasMes){if(!b||!b.origemEscolhaId||!Number.isFinite(b.valor)||b.valor<0){alertas.push({mes:h.mes,tipo:'baixa_invalida'});continue;}const k=chave(b.origemEscolhaId,h.mes);baixas.set(k,(baixas.get(k)||0)+b.valor);}
  for(const e of h.eventosObrigacoes){
   if(!e||typeof e.id!=='string'||!e.id||ids.has(e.id)||!['contratacao','renegociacao','quitacao_antecipada'].includes(e.tipo)||typeof e.origemEscolhaId!=='string'||!e.origemEscolhaId||e.mes!==h.mes||!Array.isArray(e.alteracoes)||!e.alteracoes.length){alertas.push({mes:h.mes,tipo:'evento_invalido_ou_duplicado'});continue;}
   ids.add(e.id);
   for(const a of e.alteracoes){
    if(!a||!Number.isInteger(a.vencimento)||a.vencimento<=h.mes||!Number.isFinite(a.valorAnterior)||a.valorAnterior<0||!Number.isFinite(a.valorNovo)||a.valorNovo<0){alertas.push({mes:h.mes,tipo:'alteracao_evento_invalida',evento:e.id});continue;}
    const k=chave(e.origemEscolhaId,a.vencimento);if(eventos.has(k)){alertas.push({mes:h.mes,tipo:'eventos_conflitantes',chave:k});continue;}
    if(e.tipo==='contratacao'&&a.valorAnterior!==0||e.tipo==='quitacao_antecipada'&&a.valorNovo!==0){alertas.push({mes:h.mes,tipo:'tipo_evento_incompativel',evento:e.id});continue;}
    eventos.set(k,{...a,tipo:e.tipo,id:e.id});
   }
  }
  if(anterior){
   for(const [k,v] of anterior.pendentes){const venc=Number(k.split('|').pop());if(venc===h.mes){if(Math.abs((baixas.get(k)||0)-v)>.011)alertas.push({mes:h.mes,tipo:'vencimento_nao_conciliado',chave:k});continue;}}
   const chaves=new Set([...anterior.pendentes.keys(),...atual.keys(),...eventos.keys()]);
   for(const k of chaves){const venc=Number(k.split('|').pop());if(venc<=h.mes)continue;const antes=anterior.pendentes.get(k)||0,depois=atual.get(k)||0,e=eventos.get(k);if(e){if(Math.abs(e.valorAnterior-antes)>.011||Math.abs(e.valorNovo-depois)>.011)alertas.push({mes:h.mes,tipo:'evento_nao_confere',chave:k});}else if(Math.abs(antes-depois)>.011)alertas.push({mes:h.mes,tipo:'mudanca_sem_evento',chave:k});}
  }else if(h.mes!==1){alertas.push({mes:h.mes,tipo:'inicio_sem_mes_um'});}
  meses.push({mes:h.mes,obrigacoesFuturas:atual.size,eventos:h.eventosObrigacoes.length});anterior={mes:h.mes,pendentes:atual};
 }
 return {meses,alertas,conciliado:meses.length===6&&alertas.length===0,observacao:'Eventos documentam mudanças de obrigações futuras; baixas internas não comprovam pagamento externo. Não altera a pontuação.'};
}
if(typeof module!=='undefined')module.exports={conciliarObrigacoesEtapa172};
