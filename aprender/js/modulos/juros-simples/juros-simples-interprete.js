(function () {
    const botaoJuros = document.getElementById("jsVerificarInterpreteJuros");
    const feedbackJuros = document.getElementById("jsFeedbackInterpreteJuros");
    const botaoTempo = document.getElementById("jsVerificarInterpreteTempo");
    const feedbackTempo = document.getElementById("jsFeedbackInterpreteTempo");
    if (!botaoJuros || !feedbackJuros || !botaoTempo || !feedbackTempo) return;
    botaoJuros.addEventListener("click", function () {
        const resposta = document.querySelector('input[name="jsInterpreteJuros"]:checked');
        feedbackJuros.hidden = false;
        if (!resposta) { feedbackJuros.innerHTML = "<strong>Atenção:</strong> escolha uma alternativa antes de verificar."; return; }
        feedbackJuros.innerHTML = resposta.value === "juros" ? `<strong><span class="feedback-sinal feedback-correto" aria-hidden="true">✓</span> Correto!</strong><p>Os R$ 120,00 são os <strong>juros</strong>: o custo pelo uso dos R$ 1.000,00 durante 6 meses.</p><p>João recebeu R$ 1.000,00 e pagará R$ 1.120,00. A diferença de R$ 120,00 corresponde aos juros.</p>` : `<strong><span class="feedback-sinal feedback-erro" aria-hidden="true">✕</span> Observe novamente.</strong><p>O capital é R$ 1.000,00 e o montante é R$ 1.120,00. Pense no que representa a diferença entre esses dois valores.</p>`;
    });
    botaoTempo.addEventListener("click", function () {
        const resposta = document.querySelector('input[name="jsInterpreteTempo"]:checked');
        feedbackTempo.hidden = false;
        if (!resposta) { feedbackTempo.innerHTML = "<strong>Atenção:</strong> escolha uma alternativa antes de verificar."; return; }
        feedbackTempo.innerHTML = resposta.value === "dobram" ? `<strong><span class="feedback-sinal feedback-correto" aria-hidden="true">✓</span> Correto!</strong><p>Em juros simples, com capital e taxa constantes, os juros crescem proporcionalmente ao tempo.</p><p>6 meses → R$ 120,00 de juros<br>12 meses → <strong>R$ 240,00 de juros</strong></p><p>Ao dobrar o tempo, os juros também dobram.</p>` : `<strong><span class="feedback-sinal feedback-erro" aria-hidden="true">✕</span> Vamos pensar.</strong><p>A cada mês são cobrados 2% de R$ 1.000,00, isto é, R$ 20,00. Em 12 meses: 12 × R$ 20,00 = <strong>R$ 240,00</strong>.</p>`;
    });
})();
