(function () {
    const money = v => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
    function ligar(botaoId, nome, feedbackId, correta, certo, errado) {
        const botao=document.getElementById(botaoId), feedback=document.getElementById(feedbackId);
        if(!botao||!feedback) return;
        botao.addEventListener('click',()=>{
            const r=document.querySelector(`input[name="${nome}"]:checked`);
            feedback.hidden=false;
            if(!r){feedback.innerHTML='<strong>Atenção:</strong> escolha uma alternativa antes de verificar.';return;}
            feedback.innerHTML=r.value===correta?`<strong><span class="feedback-sinal feedback-correto" aria-hidden="true">✓</span> Boa decisão!</strong>${certo}`:`<strong><span class="feedback-sinal feedback-erro" aria-hidden="true">✕</span> Compare os valores novamente.</strong>${errado}`;
        });
    }
    ligar('jsVerificarDecisao','jsDecisaoEmprestimo','jsFeedbackDecisao','a',
      '<p>Banco A: R$ 2.240,00. Banco B: R$ 2.260,00. Mesmo anunciando taxa menor, a tarifa faz o Banco B ficar mais caro.</p>',
      '<p>Banco A totaliza R$ 2.240,00; Banco B totaliza R$ 2.260,00. É preciso considerar também a taxa fixa.</p>');
    ligar('jsVerificarDecisaoPrazo','jsDecisaoPrazo','jsFeedbackDecisaoPrazo','4',
      `<p>Em 4 meses: J = 1.500 × 0,02 × 4 = <strong>${money(120)}</strong>. Em 8 meses: <strong>${money(240)}</strong>. Nos juros simples, aumentar o tempo aumenta os juros proporcionalmente.</p>`,
      '<p>Com a mesma taxa e o mesmo capital, o prazo menor produz menos juros simples.</p>');
    ligar('jsVerificarDecisaoVista','jsDecisaoVista','jsFeedbackDecisaoVista','vista',
      `<p>À vista: <strong>${money(1200)}</strong>. Após 5 meses: 1.200 + (1.200 × 0,015 × 5) = <strong>${money(1290)}</strong>. Se o dinheiro já está disponível, pagar à vista tem menor custo.</p>`,
      '<p>O parcelamento acrescenta juros. Compare o preço à vista com o montante após os 5 meses.</p>');
})();
