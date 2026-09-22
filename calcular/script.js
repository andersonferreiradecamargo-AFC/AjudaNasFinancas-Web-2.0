const capital = document.getElementById("capital");
const taxa = document.getElementById("taxa");
const tempo = document.getElementById("tempo");
const juros = document.getElementById("juros");
const montante = document.getElementById("montante");

const calcular = document.getElementById("calcular");
const limpar = document.getElementById("limpar");

const simples = document.getElementById("simples");
const compostos = document.getElementById("compostos");


// =====================================================
// PRECISÃƒÆ’O INTERNA
// =====================================================

// Guarda o ÃƒÂºltimo resultado completo calculado.
// O valor mostrado na tela pode estar arredondado,
// mas o cÃƒÂ¡lculo seguinte pode usar o valor completo.

let memoria = {
    capital: null,
    taxa: null,
    tempo: null,
    juros: null,
    montante: null
};


// =====================================================
// FUNÃƒâ€¡ÃƒÆ’O PARA MOSTRAR RESULTADOS
// =====================================================

function arredondar(valor) {
    return Number(valor.toFixed(2));
}


// =====================================================
// FUNÃƒâ€¡ÃƒÆ’O PARA IDENTIFICAR VALORES
// =====================================================

function numero(campo) {

    if (campo.value === "") {
        return null;
    }

    return Number(campo.value);
}


// =====================================================
// LIMPAR
// =====================================================

limpar.addEventListener("click", function () {

    capital.value = "";
    taxa.value = "";
    tempo.value = "";
    juros.value = "";
    montante.value = "";

    memoria.capital = null;
    memoria.taxa = null;
    memoria.tempo = null;
    memoria.juros = null;
    memoria.montante = null;

});


// =====================================================
// CALCULAR
// =====================================================

calcular.addEventListener("click", function () {

    const cCampo = numero(capital);
    const iCampo = numero(taxa);
    const tCampo = numero(tempo);
    const jCampo = numero(juros);
    const mCampo = numero(montante);

// =================================================
// ATUALIZA A MEMÃƒâ€œRIA
// MantÃƒÂ©m a precisÃƒÂ£o completa dos resultados.
// =================================================

function atualizarMemoria(valorCampo, valorMemoria, novoValor) {

    if (valorCampo === null) {
        return valorMemoria;
    }

    // Se o valor que estÃƒÂ¡ na tela ÃƒÂ© exatamente o
    // resultado arredondado anteriormente pelo programa,
    // mantÃƒÂ©m o valor interno completo.
    if (
        valorMemoria !== null &&
        valorCampo === arredondar(valorMemoria)
    ) {
        return valorMemoria;
    }

    return novoValor;
}


memoria.capital =
    atualizarMemoria(
        cCampo,
        memoria.capital,
        cCampo
    );


memoria.taxa =
    atualizarMemoria(
        iCampo,
        memoria.taxa,
        iCampo / 100
    );


memoria.tempo =
    atualizarMemoria(
        tCampo,
        memoria.tempo,
        tCampo
    );


memoria.juros =
    atualizarMemoria(
        jCampo,
        memoria.juros,
        jCampo
    );


memoria.montante =
    atualizarMemoria(
        mCampo,
        memoria.montante,
        mCampo
    );


    // =================================================
    // JUROS SIMPLES
    // =================================================

    if (simples.checked) {

        let c = memoria.capital;
        let i = memoria.taxa;
        let t = memoria.tempo;
        let j = memoria.juros;
        let m = memoria.montante;


        // ---------------------------------------------
        // C + i + t
        // Descobrir J e M
        // ---------------------------------------------

        if (
            cCampo !== null &&
            iCampo !== null &&
            tCampo !== null &&
            jCampo === null &&
            mCampo === null
        ) {

            j = c * i * t;
            m = c + j;

            memoria.juros = j;
            memoria.montante = m;

            juros.value = arredondar(j);
            montante.value = arredondar(m);

            return;
        }


        // ---------------------------------------------
        // C + J + i + t
        // Descobrir M
        // ---------------------------------------------

        if (
            c !== null &&
            j !== null &&
            i !== null &&
            t !== null &&
            mCampo === null
        ) {

            m = c + j;

            memoria.montante = m;

            montante.value = arredondar(m);

            return;
        }


        // ---------------------------------------------
        // C + M
        // Descobrir J
        // ---------------------------------------------

        if (
            c !== null &&
            m !== null &&
            jCampo === null
        ) {

            j = m - c;

            memoria.juros = j;

            juros.value = arredondar(j);

            return;
        }


        // ---------------------------------------------
        // J + i + t
        // Descobrir C e M
        // ---------------------------------------------

        if (
            cCampo === null &&
            j !== null &&
            i !== null &&
            t !== null
        ) {

            c = j / (i * t);
            m = c + j;

            memoria.capital = c;
            memoria.montante = m;

            capital.value = arredondar(c);
            montante.value = arredondar(m);

            return;
        }


        // ---------------------------------------------
        // C + J + t
        // Descobrir i e M
        // ---------------------------------------------

        if (
            c !== null &&
            j !== null &&
            t !== null &&
            iCampo === null
        ) {

            i = j / (c * t);
            m = c + j;

            memoria.taxa = i;
            memoria.montante = m;

            taxa.value = arredondar(i * 100);
            montante.value = arredondar(m);

            return;
        }


        // ---------------------------------------------
        // C + J + i
        // Descobrir t e M
        // ---------------------------------------------

        if (
            c !== null &&
            j !== null &&
            i !== null &&
            tCampo === null
        ) {

            t = j / (c * i);
            m = c + j;

            memoria.tempo = t;
            memoria.montante = m;

            tempo.value = arredondar(t);
            montante.value = arredondar(m);

            return;
        }

    }


    // =================================================
    // JUROS COMPOSTOS
    // =================================================

    else {

        let c = memoria.capital;
        let i = memoria.taxa;
        let t = memoria.tempo;
        let j = memoria.juros;
        let m = memoria.montante;


        // ---------------------------------------------
        // C + i + t
        // Descobrir J e M
        // ---------------------------------------------

        if (
            cCampo !== null &&
            iCampo !== null &&
            tCampo !== null &&
            jCampo === null &&
            mCampo === null
        ) {

            m = c * Math.pow(1 + i, t);
            j = m - c;

            memoria.montante = m;
            memoria.juros = j;

            montante.value = arredondar(m);
            juros.value = arredondar(j);

            return;
        }


        // ---------------------------------------------
        // M + C
        // Descobrir J
        // ---------------------------------------------

        if (
            c !== null &&
            m !== null &&
            jCampo === null
        ) {

            j = m - c;

            memoria.juros = j;

            juros.value = arredondar(j);

            return;
        }


        // ---------------------------------------------
        // J + i + t
        // Descobrir C e M
        // ---------------------------------------------

        if (
            cCampo === null &&
            j !== null &&
            i !== null &&
            t !== null
        ) {

            c =
                j /
                (Math.pow(1 + i, t) - 1);

            m =
                c *
                Math.pow(1 + i, t);

            memoria.capital = c;
            memoria.montante = m;

            capital.value = arredondar(c);
            montante.value = arredondar(m);

            return;
        }


        // ---------------------------------------------
        // M + i + t
        // Descobrir C e J
        // ---------------------------------------------

        if (
            cCampo === null &&
            m !== null &&
            i !== null &&
            t !== null
        ) {

            c =
                m /
                Math.pow(1 + i, t);

            j = m - c;

            memoria.capital = c;
            memoria.juros = j;

            capital.value = arredondar(c);
            juros.value = arredondar(j);

            return;
        }


        // ---------------------------------------------
        // C + M + t
        // Descobrir i e J
        // ---------------------------------------------

        if (
            c !== null &&
            m !== null &&
            t !== null &&
            iCampo === null
        ) {

            i =
                Math.pow(m / c, 1 / t) - 1;

            j = m - c;

            memoria.taxa = i;
            memoria.juros = j;

            taxa.value = arredondar(i * 100);
            juros.value = arredondar(j);

            return;
        }


        // ---------------------------------------------
        // C + M + i
        // Descobrir t e J
        // ---------------------------------------------

        if (
            c !== null &&
            m !== null &&
            i !== null &&
            tCampo === null
        ) {

            t =
                Math.log(m / c) /
                Math.log(1 + i);

            j = m - c;

            memoria.tempo = t;
            memoria.juros = j;

            tempo.value = arredondar(t);
            juros.value = arredondar(j);

            return;
        }


        // ---------------------------------------------
        // C + J + i + t
        // Descobrir M
        // ---------------------------------------------

        if (
            c !== null &&
            j !== null &&
            i !== null &&
            t !== null &&
            mCampo === null
        ) {

            m =
                c *
                Math.pow(1 + i, t);

            memoria.montante = m;

            montante.value = arredondar(m);

            return;
        }


        // ---------------------------------------------
        // C + J + t
        // Descobrir i e M
        // ---------------------------------------------

        if (
            c !== null &&
            j !== null &&
            t !== null &&
            iCampo === null
        ) {

            m = c + j;

            i =
                Math.pow(m / c, 1 / t) - 1;

            memoria.montante = m;
            memoria.taxa = i;

            montante.value = arredondar(m);
            taxa.value = arredondar(i * 100);

            return;
        }


        // ---------------------------------------------
        // C + J + i
        // Descobrir t e M
        // ---------------------------------------------

        if (
            c !== null &&
            j !== null &&
            i !== null &&
            tCampo === null
        ) {

            m = c + j;

            t =
                Math.log(m / c) /
                Math.log(1 + i);

            memoria.montante = m;
            memoria.tempo = t;

            montante.value = arredondar(m);
            tempo.value = arredondar(t);

            return;
        }

    }

});



// =====================================================
// QUESTIONÃƒÂRIO
// =====================================================

const botaoQuestoes = document.getElementById("questoes");
const areaQuestionario = document.getElementById("areaQuestionario");
const questoes = document.querySelectorAll(".questao");
const botoesVerificar = document.querySelectorAll(".verificarQuestao");
const botoesProxima = document.querySelectorAll(".proximaQuestao");
const resultadoFinal = document.getElementById("resultadoFinal");
const textoResultadoFinal = document.getElementById("textoResultadoFinal");
const mensagemFinal = document.getElementById("mensagemFinal");
const reiniciarQuestionario = document.getElementById("reiniciarQuestionario");
const numeroQuestao = document.getElementById("numeroQuestao");

let questaoAtual = 1;
let acertos = 0;


// =====================================================
// ABRIR QUESTIONÃƒÂRIO
// =====================================================

botaoQuestoes.addEventListener("click", function () {

    areaQuestionario.style.display = "block";

    questaoAtual = 1;
    acertos = 0;

    resultadoFinal.style.display = "none";

    questoes.forEach(function (questao) {
        questao.classList.remove("ativa");
    });

    document.querySelector('[data-questao="1"]').classList.add("ativa");

    numeroQuestao.textContent = "1";

    areaQuestionario.scrollIntoView({
        behavior: "smooth"
    });

});


// =====================================================
// VERIFICAR RESPOSTA
// =====================================================

botoesVerificar.forEach(function (botao) {

    botao.addEventListener("click", function () {

        const numero = Number(botao.dataset.numero);

        const questao = document.querySelector(
            '[data-questao="' + numero + '"]'
        );

        const respostaSelecionada = questao.querySelector(
            'input[name="q' + numero + '"]:checked'
        );

        const resultado = questao.querySelector(
            "#resultadoQ" + numero
        );

        const proxima = questao.querySelector(".proximaQuestao");


        if (!respostaSelecionada) {

            resultado.textContent =
                "Selecione uma resposta.";

            return;
        }


        // Respostas corretas
        const respostasCorretas = {
            1: "b",
            2: "b",
            3: "b",
            4: "b",
            5: "b",
            6: "b",
            7: "b",
            8: "b",
            9: "b",
            10: "c"
        };


        if (respostaSelecionada.value === respostasCorretas[numero]) {

            resultado.textContent = "Resposta correta!";

            acertos++;

        } else {

            resultado.textContent = "Resposta incorreta.";

        }


        // Impede mudar a resposta depois da verificaÃƒÂ§ÃƒÂ£o
        questao.querySelectorAll(
            'input[type="radio"]'
        ).forEach(function (radio) {

            radio.disabled = true;

        });


        // Esconde o botÃƒÂ£o verificar
        botao.style.display = "none";

        // Mostra o botÃƒÂ£o prÃƒÂ³xima
        proxima.style.display = "inline-block";

    });

});


// =====================================================
// PRÓXIMA QUESTÃO
// =====================================================

botoesProxima.forEach(function (botao) {

    botao.addEventListener("click", function () {

        const proxima = Number(botao.dataset.proxima);

        // Esconde questão atual
        questoes.forEach(function (questao) {
            questao.classList.remove("ativa");
        });


        // Se ainda existem questões
        if (proxima <= 10) {

            questaoAtual = proxima;

            const novaQuestao = document.querySelector(
                '[data-questao="' + proxima + '"]'
            );

            novaQuestao.classList.add("ativa");

            numeroQuestao.textContent = proxima;

            novaQuestao.scrollIntoView({
                behavior: "smooth"
            });

        }

        // QuestionÃƒÂ¡rio terminou
        else {

            numeroQuestao.textContent = "10";

            resultadoFinal.style.display = "block";

            textoResultadoFinal.textContent =
                "Você acertou " +
                acertos +
                " de 10 questões.";

            if (acertos === 10) {

                mensagemFinal.textContent =
                    " Parabéns! Você acertou todas as questões!";

            } else if (acertos >= 7) {

                mensagemFinal.textContent =
                    " Muito bem! Você teve um ótimo resultado!";

            } else if (acertos >= 5) {

                mensagemFinal.textContent =
                    "Bom trabalho! Continue estudando para melhorar ainda mais.";

            } else {

                mensagemFinal.textContent =
                    " Continue estudando! Você pode tentar novamente.";

            }

            resultadoFinal.scrollIntoView({
                behavior: "smooth"
            });

        }

    });

});


// =====================================================
// REFAZER QUESTIONÃƒÂRIO
// =====================================================

reiniciarQuestionario.addEventListener("click", function () {

    questaoAtual = 1;
    acertos = 0;


    // Limpa respostas
    document.querySelectorAll(
        '#areaQuestionario input[type="radio"]'
    ).forEach(function (radio) {

        radio.checked = false;
        radio.disabled = false;

    });


    // Limpa resultados
    document.querySelectorAll(
        ".resultadoQuestao"
    ).forEach(function (resultado) {

        resultado.textContent = "";

    });


    // Esconde todos os botÃƒÂµes prÃƒÂ³xima
    document.querySelectorAll(
        ".proximaQuestao"
    ).forEach(function (botao) {

        botao.style.display = "none";

    });


    // Mostra todos os botÃƒÂµes verificar
    document.querySelectorAll(
        ".verificarQuestao"
    ).forEach(function (botao) {

        botao.style.display = "inline-block";

    });


    // Esconde resultado final
    resultadoFinal.style.display = "none";


    // Mostra questão 1
    questoes.forEach(function (questao) {

        questao.classList.remove("ativa");

    });


    document.querySelector(
        '[data-questao="1"]'
    ).classList.add("ativa");


    numeroQuestao.textContent = "1";


    areaQuestionario.scrollIntoView({
        behavior: "smooth"
    });

});

   


// =====================================================
// INFORMAÃ‡Ã•ES
// =====================================================

const botaoInfo = document.getElementById("info");
const areaInformacoes = document.getElementById("areaInformacoes");

botaoInfo.addEventListener("click", function () {

    if (areaInformacoes.style.display === "none") {

        areaInformacoes.style.display = "block";

        areaInformacoes.scrollIntoView({
            behavior: "smooth"
        });

    } else {

        areaInformacoes.style.display = "none";

    }

});



