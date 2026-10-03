(function () {
    const botao = document.getElementById("jsVerificarDecisao");
    const feedback = document.getElementById("jsFeedbackDecisao");
    if (!botao || !feedback) return;
    botao.addEventListener("click", function () {
        const resposta = document.querySelector('input[name="jsDecisaoEmprestimo"]:checked');
        feedback.hidden = false;
        if (!resposta) { feedback.innerHTML = "<strong>Atenção:</strong> escolha uma alternativa antes de verificar."; return; }
        if (resposta.value === "a") {
            feedback.innerHTML = `<strong><span class="feedback-sinal feedback-correto" aria-hidden="true">✓</span> Boa decisão!</strong><p><strong>Banco A:</strong> juros = R$ 240,00 → total = <strong>R$ 2.240,00</strong>.</p><p><strong>Banco B:</strong> juros = R$ 180,00 + taxa de R$ 80,00 → total = <strong>R$ 2.260,00</strong>.</p><p>Embora o Banco B anuncie uma taxa de juros menor, a taxa fixa faz seu custo total ficar R$ 20,00 maior. Por isso, nesta situação, o <strong>Banco A tem o menor custo total</strong>.</p><p><strong>Importante:</strong> ao comparar propostas financeiras, observe todos os custos, e não apenas a taxa de juros.</p>`;
        } else {
            feedback.innerHTML = `<strong><span class="feedback-sinal feedback-erro" aria-hidden="true">✕</span> Antes de decidir, compare todos os custos.</strong><p>Banco A: R$ 2.000,00 + R$ 240,00 de juros = <strong>R$ 2.240,00</strong>.</p><p>Banco B: R$ 2.000,00 + R$ 180,00 de juros + R$ 80,00 de taxa = <strong>R$ 2.260,00</strong>.</p><p>A menor taxa de juros nem sempre significa o menor custo final.</p>`;
        }
    });
})();
