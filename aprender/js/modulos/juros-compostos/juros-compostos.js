(() => {
  const $ = id => document.getElementById(id);
  const money = v => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const num = v => v.toLocaleString('pt-BR',{maximumFractionDigits:8});
  const meses = {dia:1/30,mes:1,trimestre:3,semestre:6,ano:12};
  const taxaNome = {dia:'ao dia',mes:'ao mês',trimestre:'ao trimestre',semestre:'ao semestre',ano:'ao ano'};

  function serie(C,i,n){
    const rows=[];
    const inteiro=Math.max(0,Math.floor(n));
    for(let k=0;k<=inteiro;k++) rows.push({k, simples:C*(1+i*k), compostos:C*Math.pow(1+i,k)});
    if(n>inteiro+1e-9) rows.push({k:n, simples:C*(1+i*n), compostos:C*Math.pow(1+i,n)});
    return rows;
  }
  function tabela(rows, rotulo='Período'){
    return `<table><thead><tr><th>${rotulo}</th><th>Juros simples</th><th>Juros compostos</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${num(r.k)}</td><td>${money(r.simples)}</td><td><strong>${money(r.compostos)}</strong></td></tr>`).join('')}</tbody></table>`;
  }
  function graficosDuplos(rows){
    const amostra=rows.length>9 ? rows.filter((_,i)=>i===0||i===rows.length-1||i%Math.ceil((rows.length-1)/6)===0) : rows;
    const max=Math.max(...amostra.flatMap(r=>[r.simples,r.compostos]),1);
    function painel(tipo,titulo){
      const classe=tipo==='simples'?'simples':'compostos';
      const linhas=amostra.map(r=>{const v=r[tipo];return `<div class="jc-mini-linha"><span class="jc-mini-periodo">${num(r.k)}</span><div><div class="jc-mini-trilho"><div class="jc-mini-barra ${classe}" style="width:${100*v/max}%"></div></div><div class="jc-mini-valor">${money(v)}</div></div></div>`}).join('');
      const final=amostra[amostra.length-1][tipo];
      return `<section class="jc-mini-grafico"><h5>${titulo}</h5>${linhas}<div class="jc-mini-final">Valor final: ${money(final)}</div></section>`;
    }
    return `<div class="jc-graficos-duplos">${painel('simples','Juros simples')}${painel('compostos','Juros compostos')}</div>`;
  }


  function dadosCompostos(rows, capital){
    return rows.map(r=>({periodo:r.k, montante:r.compostos, juros:r.compostos-capital}));
  }
  function tabelaCompostos(dados){
    return `<table class="jc-tabela-financeira"><thead><tr><th>Período</th><th>Juros acumulados</th><th>Montante</th></tr></thead><tbody>${dados.map((d,i)=>`<tr data-indice="${i}"><td>${num(d.periodo)}</td><td>${money(d.juros)}</td><td>${money(d.montante)}</td></tr>`).join('')}</tbody></table>`;
  }
  function desenharGraficoComposto(dados){
    const el=$('jcGraficoDetalhado'); if(!el||!dados.length)return;
    const W=900,H=320,L=125,R=30,T=30,B=55, uw=W-L-R, uh=H-T-B;
    const maxP=Math.max(...dados.map(d=>d.periodo),1), maxM=Math.max(...dados.map(d=>d.montante),1), minM=Math.min(...dados.map(d=>d.montante)), range=Math.max(maxM-minM,1);
    let amostra=dados.map((d,i)=>({...d,indiceOriginal:i}));
    if(amostra.length>13){ const out=[]; for(let i=0;i<13;i++){const ix=Math.round(i/12*(dados.length-1));out.push({...dados[ix],indiceOriginal:ix});} amostra=out.filter((v,i,a)=>i===0||v.indiceOriginal!==a[i-1].indiceOriginal); }
    const pts=amostra.map(d=>({...d,x:L+(d.periodo/maxP)*uw,y:T+uh-((d.montante-minM)/range)*uh}));
    const poly=pts.map(p=>`${p.x},${p.y}`).join(' ');
    el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Evolução do montante nos juros compostos">
      <line x1="${L}" y1="${T}" x2="${L}" y2="${H-B}" class="jc-grafico-eixo"></line><line x1="${L}" y1="${H-B}" x2="${W-R}" y2="${H-B}" class="jc-grafico-eixo"></line>
      <polyline points="${poly}" class="jc-grafico-linha"></polyline>
      ${pts.map(p=>`<circle class="jc-grafico-ponto" cx="${p.x}" cy="${p.y}" r="6" data-indice="${p.indiceOriginal}" tabindex="0"></circle>`).join('')}
      <circle id="jcMarcadorSelecionado" cx="0" cy="0" r="9" class="jc-grafico-marcador" visibility="hidden"></circle>
      <g id="jcTooltipGrafico" visibility="hidden"><rect x="0" y="0" width="190" height="78" rx="10" class="jc-grafico-tooltip-fundo"></rect><text id="jcTooltipTexto" x="0" y="0" class="jc-grafico-tooltip-texto"></text></g>
      <text x="${L}" y="${H-18}" class="jc-grafico-texto">Início</text><text x="${W-R}" y="${H-18}" text-anchor="end" class="jc-grafico-texto">${num(maxP)} período(s)</text>
      <text x="${L-12}" y="${T+5}" text-anchor="end" class="jc-grafico-texto">${money(maxM)}</text><text x="${L-12}" y="${H-B+5}" text-anchor="end" class="jc-grafico-texto">${money(minM)}</text></svg>`;
    el.querySelectorAll('.jc-grafico-ponto').forEach(p=>{p.addEventListener('click',()=>selecionarComposto(Number(p.dataset.indice),dados,true));p.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selecionarComposto(Number(p.dataset.indice),dados,true);}})});
  }
  function selecionarComposto(indice,dados,rolarTabela=false){
    const d=dados[indice], el=$('jcGraficoDetalhado'), tab=$('jcTabelaEvolucao'); if(!d||!el)return;
    el.querySelectorAll('.jc-grafico-ponto').forEach(p=>p.classList.toggle('selecionado',Number(p.dataset.indice)===indice));
    if(tab){tab.querySelectorAll('tbody tr').forEach(r=>r.classList.toggle('selecionada',Number(r.dataset.indice)===indice)); const row=tab.querySelector(`tbody tr[data-indice="${indice}"]`); if(row&&rolarTabela&&!tab.hidden)row.scrollIntoView({block:'nearest',behavior:'smooth'});}
    const W=900,H=320,L=125,R=30,T=30,B=55,uw=W-L-R,uh=H-T-B,maxP=Math.max(...dados.map(x=>x.periodo),1),maxM=Math.max(...dados.map(x=>x.montante),1),minM=Math.min(...dados.map(x=>x.montante)),range=Math.max(maxM-minM,1);
    const x=L+(d.periodo/maxP)*uw,y=T+uh-((d.montante-minM)/range)*uh, mark=$('jcMarcadorSelecionado'),tip=$('jcTooltipGrafico'),tt=$('jcTooltipTexto');
    if(mark){mark.setAttribute('cx',x);mark.setAttribute('cy',y);mark.setAttribute('visibility','visible');}
    if(tip&&tt){const tw=190,th=78,dist=16;let tx=x+dist,ty=y-th/2;if(tx+tw>W-R)tx=x-tw-dist;tx=Math.max(L,Math.min(tx,W-R-tw));ty=Math.max(T,Math.min(ty,H-B-th));tip.setAttribute('transform',`translate(${tx}, ${ty})`);tt.innerHTML=`<tspan x="12" y="22">Período: ${num(d.periodo)}</tspan><tspan x="12" y="44">Juros: ${money(d.juros)}</tspan><tspan x="12" y="66">Montante: ${money(d.montante)}</tspan>`;tip.setAttribute('visibility','visible');}
    const painel=$('jcPeriodoSelecionado'); if(painel) painel.innerHTML=`<span>Período selecionado</span><strong>${num(d.periodo)} ${d.periodo===1?'período':'períodos'}</strong><div class="jc-periodo-valores"><div><span>Juros acumulados</span><strong>${money(d.juros)}</strong></div><div><span>Montante</span><strong>${money(d.montante)}</strong></div></div>`;
  }
  function ligarTabelaComposto(dados){const tab=$('jcTabelaEvolucao');if(!tab)return;tab.querySelectorAll('tbody tr').forEach(r=>r.addEventListener('click',()=>selecionarComposto(Number(r.dataset.indice),dados,false)));}

  const ca=$('jcCapitalAprenda'), ia=$('jcTaxaAprenda'), ta=$('jcTempoAprenda');
  function atualizarAprenda(){
    if(!ca||!ia||!ta) return;
    const C=Number(ca.value), i=Number(ia.value)/100, n=Math.min(24,Math.max(1,Math.round(Number(ta.value)||1)));
    if(!(C>0)||i<0||!Number.isFinite(i)) return;
    ta.value=n;
    const M=C*Math.pow(1+i,n), J=M-C, S=C*(1+i*n);
    $('jcResumoAprenda').innerHTML=`<strong>Após ${n} ${n===1?'mês':'meses'}:</strong> montante composto = <strong>${money(M)}</strong> e juros = <strong>${money(J)}</strong>.<br>Com juros simples, o montante seria ${money(S)}.`;
    const rows=serie(C,i,n); $('jcComparacaoAprenda').innerHTML=graficosDuplos(rows); $('jcTabelaAprenda').innerHTML=tabela(rows,'Mês');
  }
  [ca,ia,ta].forEach(el=>el&&el.addEventListener('input',atualizarAprenda)); atualizarAprenda();

  const form=$('jcFormularioFaca');
  if(form){
    const C=$('jcCapitalFaca'), I=$('jcTaxaFaca'), T=$('jcTempoFaca'), uI=$('jcUnidadeTaxaFaca'), uT=$('jcUnidadeTempoFaca'), erro=$('jcErroFaca'), res=$('jcResultadoFaca'), lab=$('jcLaboratorioFaca');
    const limparResultado=()=>{erro.hidden=true;erro.textContent='';res.hidden=true;res.innerHTML='';lab.hidden=true;};
    [C,I,T,uI,uT].forEach(el=>el.addEventListener(el.tagName==='SELECT'?'change':'input',limparResultado));
    form.addEventListener('submit',e=>{
      e.preventDefault(); limparResultado();
      const vals=[C.valueAsNumber,I.valueAsNumber,T.valueAsNumber];
      if(vals.some(v=>!Number.isFinite(v)||v<0)){erro.textContent='Preencha os três campos com números iguais ou maiores que zero.';erro.hidden=false;return;}
      const [capital,taxaPct,tempo]=vals, i=taxaPct/100;
      const tempoMeses=tempo*meses[uT.value], n=tempoMeses/meses[uI.value];
      const M=capital*Math.pow(1+i,n), J=M-capital;
      if(![n,M,J].every(Number.isFinite)||M>Number.MAX_SAFE_INTEGER/100){erro.textContent='Os valores são grandes demais para este cálculo. Use valores menores.';erro.hidden=false;return;}
      const conversao=uI.value===uT.value?`Taxa e tempo já estão em períodos compatíveis: t = ${num(n)}.`:`O tempo informado corresponde a <strong>${num(n)} períodos</strong> da taxa ${taxaNome[uI.value]}.`;
      const fator=1+i, potencia=Math.pow(fator,n);
      res.innerHTML=`<h4>Resultado</h4><div class="jc-resultado-grid"><div class="jc-resultado-card">Juros acumulados<strong>${money(J)}</strong></div><div class="jc-resultado-card">Montante final<strong>${money(M)}</strong></div></div><p>${conversao}</p><div class="jc-calculo-detalhado"><p><strong>Cálculo passo a passo:</strong></p><p>M = C × (1 + i)<sup>t</sup></p><p>M = ${money(capital)} × (1 + ${num(i)})<sup>${num(n)}</sup></p><p>M = ${money(capital)} × (${num(fator)})<sup>${num(n)}</sup></p><p>(${num(fator)})<sup>${num(n)}</sup> = <strong>${num(potencia)}</strong></p><p>M = ${money(capital)} × ${num(potencia)}</p><p><strong>M = ${money(M)}</strong></p><p>J = M − C = ${money(M)} − ${money(capital)}</p><p><strong>J = ${money(J)}</strong></p></div>`; res.hidden=false;
      const rows=serie(capital,i,n); $('jcGraficoFaca').innerHTML=graficosDuplos(rows); const dados=dadosCompostos(rows,capital); $('jcTabelaEvolucao').innerHTML=tabelaCompostos(dados); desenharGraficoComposto(dados); ligarTabelaComposto(dados); const painel=$('jcPeriodoSelecionado'); if(painel) painel.innerHTML='<span>Período selecionado</span><strong>Selecione um ponto do gráfico ou uma linha da tabela</strong>'; lab.hidden=false;
    });
    $('jcLimparFaca').addEventListener('click',()=>{form.reset();limparResultado();C.focus();});
    $('jcUsarAprenda').addEventListener('click',()=>{C.value=ca.value;I.value=ia.value;T.value=ta.value;uI.value='mes';uT.value='mes';limparResultado();});
    $('jcMostrarTabela').addEventListener('click',()=>{const t=$('jcTabelaEvolucao');t.hidden=!t.hidden;$('jcMostrarTabela').setAttribute('aria-expanded',String(!t.hidden));$('jcMostrarTabela').textContent=t.hidden?'Ver evolução período a período':'Ocultar evolução período a período';});
  }

  function quiz(btnId,name,feedbackId,correta,ok,erroTxt){
    const b=$(btnId), f=$(feedbackId); if(!b||!f)return;
    b.addEventListener('click',()=>{const r=document.querySelector(`input[name="${name}"]:checked`);f.hidden=false;if(!r){f.innerHTML='<strong>Atenção:</strong> escolha uma alternativa antes de verificar.';return;}f.innerHTML=r.value===correta?`<strong><span class="feedback-sinal feedback-correto" aria-hidden="true">✓</span> Correto!</strong>${ok}`:`<strong><span class="feedback-sinal feedback-erro" aria-hidden="true">✕</span> Observe novamente.</strong>${erroTxt}`;});
  }
  quiz('jcVerificarInterpreteBase','jcInterpreteBase','jcFeedbackInterpreteBase','saldo','<p>A taxa permanece igual, mas é aplicada sobre um saldo maior. Os juros do período anterior entram no saldo e também passam a render.</p>','<p>A taxa não precisa aumentar. O que aumenta é a base sobre a qual ela é aplicada.</p>');
  quiz('jcVerificarInterpreteTempo','jcInterpreteTempo','jcFeedbackInterpreteTempo','nao','<p>Nos compostos, o crescimento não é proporcional ao tempo. Como os juros acumulados também rendem, períodos adicionais têm efeito cada vez maior.</p>','<p>Essa proporcionalidade é característica dos juros simples. Nos compostos, há juros sobre juros.</p>');

  function decisao(btnId,name,feedbackId,correta,htmlCerto,htmlErrado){
    const b=$(btnId), f=$(feedbackId); if(!b||!f)return;
    b.addEventListener('click',()=>{const r=document.querySelector(`input[name="${name}"]:checked`);f.hidden=false;if(!r){f.innerHTML='<strong>Atenção:</strong> escolha uma alternativa antes de verificar.';return;}f.innerHTML=r.value===correta?`<strong><span class="feedback-sinal feedback-correto" aria-hidden="true">✓</span> Boa decisão!</strong>${htmlCerto}`:`<strong><span class="feedback-sinal feedback-erro" aria-hidden="true">✕</span> Compare os valores novamente.</strong>${htmlErrado}`;});
  }
  const A=5000*Math.pow(1.015,12), Bsem=5000*Math.pow(1.013,12), B=Bsem+100;
  decisao('jcVerificarDecisao1','jcDecisao1','jcFeedbackDecisao1','b',`<p><strong>Banco A:</strong> ${money(A)}.</p><p><strong>Banco B:</strong> ${money(Bsem)} + R$ 100,00 de tarifa = <strong>${money(B)}</strong>.</p><p>Mesmo com a tarifa, o Banco B tem o menor custo total.</p>`,`<p>Banco A: <strong>${money(A)}</strong>. Banco B com tarifa: <strong>${money(B)}</strong>. A taxa menor só é vantajosa depois de considerar todos os custos.</p>`);
  const vista=3000*.92, prazo=3000*Math.pow(1.015,6);
  decisao('jcVerificarDecisao2','jcDecisao2','jcFeedbackDecisao2','vista',`<p>À vista com 8% de desconto: <strong>${money(vista)}</strong>. Em 6 meses com juros compostos: <strong>${money(prazo)}</strong>. Para quem já dispõe do dinheiro, o pagamento à vista tem menor custo.</p>`,`<p>Compare ${money(vista)} à vista com ${money(prazo)} após 6 meses. Nesta situação, o desconto à vista vence o parcelamento com juros.</p>`);
  const invS=2000*(1+.01*12), invC=2000*Math.pow(1.01,12);
  decisao('jcVerificarDecisao3','jcDecisao3','jcFeedbackDecisao3','compostos',`<p>Juros simples: <strong>${money(invS)}</strong>. Juros compostos: <strong>${money(invC)}</strong>. Com a mesma taxa e o mesmo prazo, os juros sobre juros fazem o montante composto ficar maior.</p>`,`<p>Nos compostos, os rendimentos acumulados também passam a render. Compare ${money(invS)} com ${money(invC)}.</p>`);

  // Progresso do Módulo 3 — usa a mesma trilha visual dos módulos anteriores.
  const concluidasJC=new Set();
  function atualizarProgressoJC(){
    const progresso=concluidasJC.size*25;
    const texto=$('progressoTexto'), preenchimento=$('trilhaPreenchimento'), acessivel=document.querySelector('.trilha-acessivel');
    const compacto=$('progressoCompacto'), compactoTexto=$('progressoCompactoTexto'), compactoPre=$('progressoCompactoPreenchimento'), rotulo=$('progressoCompactoRotulo'), msg=$('progressoCompactoMensagem'), fim=$('mensagemConclusao');
    if(texto) texto.textContent=`${progresso}%`; if(compactoTexto) compactoTexto.textContent=`${progresso}%`; if(compactoPre) compactoPre.style.width=`${progresso}%`;
    const larguras={0:0,25:0,50:33.333,75:66.666,100:100}; if(preenchimento) preenchimento.style.width=`${larguras[progresso]}%`; if(acessivel) acessivel.setAttribute('aria-valuenow',String(progresso));
    document.querySelectorAll('.trilha-passo').forEach(p=>p.classList.toggle('concluido',concluidasJC.has(p.dataset.etapa)));
    const terminou=progresso===100;
    if(fim){fim.hidden=!terminou;if(terminou)fim.innerHTML='🏆 <strong>Juros Compostos concluído!</strong> Você aprendeu, calculou, interpretou e tomou decisões usando juros compostos.';}
    if(compacto) compacto.classList.toggle('concluido',terminou); if(rotulo) rotulo.textContent=terminou?'🏆 Juros Compostos concluído!':'Progresso — Juros Compostos'; if(msg){msg.hidden=!terminou;if(terminou)msg.textContent='Você concluiu as quatro etapas de Juros Compostos.';}
  }
  function concluirJC(etapa){if(!concluidasJC.has(etapa)){concluidasJC.add(etapa);atualizarProgressoJC();}}
  document.querySelectorAll('#jcEtapaAprenda .subtopico-titulo').forEach(b=>b.addEventListener('click',()=>concluirJC('aprenda')));
  if(form) form.addEventListener('submit',()=>setTimeout(()=>{const r=$('jcResultadoFaca');if(r&&!r.hidden&&r.textContent.trim())concluirJC('faca');},0));
  function conferirInterpreteJC(){const a=document.querySelector('input[name="jcInterpreteBase"]:checked'),b=document.querySelector('input[name="jcInterpreteTempo"]:checked');if(a&&a.value==='saldo'&&b&&b.value==='nao')concluirJC('interprete');}
  ['jcVerificarInterpreteBase','jcVerificarInterpreteTempo'].forEach(id=>{const b=$(id);if(b)b.addEventListener('click',conferirInterpreteJC);});
  function conferirDecidaJC(){const a=document.querySelector('input[name="jcDecisao1"]:checked'),b=document.querySelector('input[name="jcDecisao2"]:checked'),c=document.querySelector('input[name="jcDecisao3"]:checked');if(a&&a.value==='b'&&b&&b.value==='vista'&&c&&c.value==='compostos')concluirJC('decida');}
  ['jcVerificarDecisao1','jcVerificarDecisao2','jcVerificarDecisao3'].forEach(id=>{const b=$(id);if(b)b.addEventListener('click',conferirDecidaJC);});
})();
