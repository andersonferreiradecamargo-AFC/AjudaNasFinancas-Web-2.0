// ==================================================
// JUROS SIMPLES — PROGRESSO DO MÓDULO
// Arquivo isolado para não conflitar com o progresso de Porcentagem.
// ==================================================

(function () {
    "use strict";

    const modulo = document.getElementById("juros-simples");
    if (!modulo) return;

    const concluidasJS = new Set();

    function atualizarProgressoJS() {
        const progresso = concluidasJS.size * 25;

        const texto = document.getElementById("progressoTexto");
        const preenchimento = document.getElementById("trilhaPreenchimento");
        const acessivel = document.querySelector(".trilha-acessivel");
        const mensagem = document.getElementById("mensagemConclusao");
        const compacto = document.getElementById("progressoCompacto");
        const compactoTexto = document.getElementById("progressoCompactoTexto");
        const compactoPreenchimento = document.getElementById("progressoCompactoPreenchimento");
        const compactoRotulo = document.getElementById("progressoCompactoRotulo");
        const compactoMensagem = document.getElementById("progressoCompactoMensagem");

        if (texto) texto.textContent = `${progresso}%`;
        if (compactoTexto) compactoTexto.textContent = `${progresso}%`;
        if (compactoPreenchimento) compactoPreenchimento.style.width = `${progresso}%`;

        const larguras = { 0: 0, 25: 0, 50: 33.333, 75: 66.666, 100: 100 };
        if (preenchimento) preenchimento.style.width = `${larguras[progresso]}%`;
        if (acessivel) acessivel.setAttribute("aria-valuenow", String(progresso));

        document.querySelectorAll(".trilha-passo").forEach(function (passo) {
            passo.classList.toggle("concluido", concluidasJS.has(passo.dataset.etapa));
        });

        const terminou = progresso === 100;

        if (mensagem) {
            mensagem.hidden = !terminou;
            if (terminou) {
                mensagem.innerHTML = "🏆 <strong>Juros Simples concluído!</strong> Você aprendeu, calculou, interpretou e tomou decisões usando juros simples.";
            }
        }

        if (compacto) compacto.classList.toggle("concluido", terminou);
        if (compactoRotulo) compactoRotulo.textContent = terminou ? "🏆 Juros Simples concluído!" : "Progresso — Juros Simples";
        if (compactoMensagem) {
            compactoMensagem.hidden = !terminou;
            if (terminou) compactoMensagem.textContent = "Você aprendeu, calculou, interpretou e tomou decisões usando juros simples.";
        }
    }

    function concluirJS(etapa) {
        if (concluidasJS.has(etapa)) return;
        concluidasJS.add(etapa);
        atualizarProgressoJS();
    }

    // APRENDA: ao interagir com um subtópico do Juros Simples.
    modulo.querySelectorAll(".aprenda .subtopico-titulo").forEach(function (botao) {
        botao.addEventListener("click", function () { concluirJS("aprenda"); });
    });

    // FAÇA: somente depois de um cálculo válido gerar resultado.
    const formulario = document.getElementById("jsFormularioFaca");
    const resultado = document.getElementById("jsResultadoFaca");
    if (formulario && resultado) {
        formulario.addEventListener("submit", function () {
            setTimeout(function () {
                if (!resultado.hidden && resultado.textContent.trim() !== "") concluirJS("faca");
            }, 0);
        });
    }

    // INTERPRETE: as duas respostas precisam estar corretas.
    function conferirInterprete() {
        const juros = document.querySelector('input[name="jsInterpreteJuros"]:checked');
        const tempo = document.querySelector('input[name="jsInterpreteTempo"]:checked');
        if (juros && juros.value === "juros" && tempo && tempo.value === "dobram") {
            concluirJS("interprete");
        }
    }

    const verificarJuros = document.getElementById("jsVerificarInterpreteJuros");
    const verificarTempo = document.getElementById("jsVerificarInterpreteTempo");
    if (verificarJuros) verificarJuros.addEventListener("click", conferirInterprete);
    if (verificarTempo) verificarTempo.addEventListener("click", conferirInterprete);

    // DECIDA: as três situações precisam estar corretas.
    function conferirDecida() {
        const q1 = document.querySelector('input[name="jsDecisaoEmprestimo"]:checked');
        const q2 = document.querySelector('input[name="jsDecisaoPrazo"]:checked');
        const q3 = document.querySelector('input[name="jsDecisaoVista"]:checked');
        if (q1 && q1.value === "a" && q2 && q2.value === "4" && q3 && q3.value === "vista") concluirJS("decida");
    }
    ["jsVerificarDecisao","jsVerificarDecisaoPrazo","jsVerificarDecisaoVista"].forEach(function(id){
        const b=document.getElementById(id); if(b) b.addEventListener("click", conferirDecida);
    });
})();
