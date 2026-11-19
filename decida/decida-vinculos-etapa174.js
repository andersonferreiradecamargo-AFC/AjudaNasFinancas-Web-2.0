'use strict';
// Valida vínculos explícitos entre decisões, obrigações e desembolsos.
// Sem comprovante interno identificável, não declara quitação ou renegociação conciliada.
function auditarVinculosEtapa174(historico=[], escolhas=[]){
 const alertas=[],vinculos=[],ids=new Set(),porId=new Map();
 for(const e of escolhas||[])if(e&&typeof e.id==='string')porId.set(e.id,e);
 for(const h of historico||[]){
  for(const ev of h.eventosObrigacoes||[]){
   if(!ev||typeof ev.id!=='string'||ids.has(ev.id)){alertas.push({mes:h.mes,tipo:'evento_duplicado_ou_invalido'});continue;}ids.add(ev.id);
   const escolha=porId.get(ev.origemEscolhaId);
   if(!escolha||escolha.mes!==h.mes){alertas.push({mes:h.mes,tipo:'escolha_nao_localizada',evento:ev.id});continue;}
   if(ev.tipo==='renegociacao'||ev.tipo==='quitacao_antecipada'){
    const origem=escolha.detalhes?.obrigacaoOriginalId;
    if(typeof origem!=='string'||!origem||origem===escolha.id){alertas.push({mes:h.mes,tipo:'obrigacao_original_nao_identificada',evento:ev.id});continue;}
    const conhecida=(historico||[]).some(x=>x.mes<h.mes&&(x.obrigacoesPendentesFechamento||[]).some(o=>o.origemEscolhaId===origem));
    if(!conhecida){alertas.push({mes:h.mes,tipo:'obrigacao_original_nao_encontrada',evento:ev.id});continue;}
    if(ev.tipo==='quitacao_antecipada'){
     const comprovante=(h.desembolsosDocumentados||[]).find(d=>d.eventoId===ev.id&&d.obrigacaoOriginalId===origem&&Number.isFinite(d.valor)&&d.valor>0);
     if(!comprovante){alertas.push({mes:h.mes,tipo:'desembolso_nao_documentado',evento:ev.id});continue;}
     vinculos.push({eventoId:ev.id,origem,escolhaId:escolha.id,desembolso:comprovante.valor,estado:'documentado_nao_verificado_externamente'});
    }else vinculos.push({eventoId:ev.id,origem,escolhaId:escolha.id,estado:'vinculo_documentado'});
   }else vinculos.push({eventoId:ev.id,escolhaId:escolha.id,estado:'contratacao_documentada'});
  }
 }
 return {vinculos,alertas,semAlertas:alertas.length===0,observacao:'Auditoria documental; não comprova pagamentos externos nem altera a pontuação.'};
}
if(typeof module!=='undefined')module.exports={auditarVinculosEtapa174};
