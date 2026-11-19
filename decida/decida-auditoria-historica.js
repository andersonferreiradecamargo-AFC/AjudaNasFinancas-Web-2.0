'use strict';
// Etapa 170: snapshots ao fechamento; baixas são lançamentos internos, não comprovantes externos.
function auditarHistoricoObrigacoesEtapa170(historico=[]){
 const meses=[];const lacunas=[];let anterior=null;
 for(const h of Array.isArray(historico)?historico:[]){
  if(!Number.isInteger(h?.mes)||h.mes<1){lacunas.push({motivo:'mes_invalido'});continue;}
  const snap=h.obrigacoesPendentesFechamento;
  if(!Array.isArray(snap)){lacunas.push({mes:h.mes,motivo:'snapshot_ausente_versao_antiga'});anterior=null;continue;}
  const pendentes=[];
  for(const o of snap){
   if(!Number.isFinite(o?.valor)||o.valor<0||!Array.isArray(o.pendentes)||o.pendentes.some(m=>!Number.isInteger(m)||m<=h.mes)){
    lacunas.push({mes:h.mes,motivo:'obrigacao_snapshot_invalida'});continue;
   }
   for(const vencimento of o.pendentes)pendentes.push({vencimento,valor:o.valor,origemEscolhaId:o.origemEscolhaId??null,descricao:o.descricao??''});
  }
  const baixas=Array.isArray(h.parcelasBaixadasMes)?h.parcelasBaixadasMes:[];
  const totalBaixado=baixas.reduce((s,b)=>s+(Number.isFinite(b.valor)&&b.valor>=0?b.valor:0),0);
  if(baixas.some(b=>!Number.isFinite(b.valor)||b.valor<0))lacunas.push({mes:h.mes,motivo:'baixa_invalida'});
  const totalPendente=pendentes.reduce((s,p)=>s+p.valor,0);
  // Novas contratações podem ocorrer entre fechamentos: não inferir quitação pela variação de saldos.
  meses.push({mes:h.mes,totalPendente:Math.round(totalPendente*100)/100,totalBaixadoInternamente:Math.round(totalBaixado*100)/100,pendentes,baixas:baixas.map(b=>({origemEscolhaId:b.origemEscolhaId??null,valor:b.valor,origemRegistro:b.origemRegistro??null})),comparacaoAnteriorDisponivel:anterior!==null});
  anterior=h;
 }
 return {meses,lacunas,completo:lacunas.length===0&&meses.length>0,observacao:'Snapshots capturados ao fechamento; baixas automáticas não comprovam pagamento externo. Novas obrigações entre meses não são inferidas por diferença de saldos. Sem efeito na pontuação.'};
}
