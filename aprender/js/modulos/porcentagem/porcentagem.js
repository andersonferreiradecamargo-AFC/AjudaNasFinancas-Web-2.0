const campoPercentual = document.getElementById("percentual");
const campoValorBase = document.getElementById("valorBase");
const botaoCalcular = document.getElementById("calcularPorcentagem");
const botaoLimpar = document.getElementById("limparPorcentagem");
const areaResultado = document.getElementById("resultadoPorcentagem");


// ==================================================
// SEGUNDA CALCULADORA
// ==================================================

const campoValorParte = document.getElementById("valorParte");
const campoValorTotal = document.getElementById("valorTotal");

const botaoCalcularRepresentacao =
    document.getElementById("calcularRepresentacao");

const botaoLimparRepresentacao =
    document.getElementById("limparRepresentacao");

const areaResultadoRepresentacao =
    document.getElementById("resultadoRepresentacao");


// ==================================================
// TERCEIRA CALCULADORA
// AUMENTO E DESCONTO
// ==================================================

const campoValorInicialAjuste =
    document.getElementById("valorInicialAjuste");

const campoPercentualAjuste =
    document.getElementById("percentualAjuste");

const botaoCalcularAjuste =
    document.getElementById("calcularAjuste");

const botaoLimparAjuste =
    document.getElementById("limparAjuste");

const areaResultadoAjuste =
    document.getElementById("resultadoAjuste");


// ==================================================
// FUNÇÕES DE FORMATAÇÃO
// ==================================================

function formatarDinheiro(numero) {
    return numero.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


function formatarPorcentagem(numero) {
    return numero.toLocaleString("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4
    });
}


function formatarPorcentagemDuasCasas(numero) {
    return numero.toLocaleString("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}


function formatarCalculo(numero) {
    return numero.toLocaleString("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6
    });
}


// ==================================================
// CALCULADORA 1
// CALCULAR UMA PORCENTAGEM DE UM VALOR
// ==================================================

botaoCalcular.addEventListener("click", function () {

    const percentual = Number(campoPercentual.value);
    const valorBase = Number(campoValorBase.value);

    if (
        campoPercentual.value === "" ||
        campoValorBase.value === "" ||
        percentual < 0 ||
        valorBase < 0
    ) {
        areaResultado.hidden = false;

        areaResultado.innerHTML = `
            <strong>Atenção:</strong>
            informe uma porcentagem e um valor válidos.
        `;

        return;
    }

    const percentualDecimal = percentual / 100;
    const resultado = percentualDecimal * valorBase;

    areaResultado.hidden = false;

    areaResultado.innerHTML = `
        <h4>Resultado</h4>

        <p>
            <strong>${formatarPorcentagem(percentual)}%</strong>
            de
            <strong>R$ ${formatarDinheiro(valorBase)}</strong>
            é:
        </p>

        <p>
            <strong>R$ ${formatarDinheiro(resultado)}</strong>
        </p>

        <hr>

        <h4>Como chegamos ao resultado?</h4>

        <p>
            <strong>1º passo — Transformar a porcentagem:</strong>
        </p>

        <p>
            ${formatarPorcentagem(percentual)}% =
            <span class="fracao">
                <span>${formatarPorcentagem(percentual)}</span>
                <span>100</span>
            </span>
            = ${formatarCalculo(percentualDecimal)}
        </p>

        <p>
            <em>
                ${formatarPorcentagem(percentual)}% significa
                ${formatarPorcentagem(percentual)} de cada 100.
            </em>
        </p>

        <p>
            <strong>2º passo — Multiplicar pelo valor:</strong>
        </p>

        <p>
            ${formatarCalculo(percentualDecimal)} ×
            ${formatarDinheiro(valorBase)}
            =
            ${formatarDinheiro(resultado)}
        </p>

        <p>
            Portanto,
            <strong>
                ${formatarPorcentagem(percentual)}% de
                R$ ${formatarDinheiro(valorBase)}
                = R$ ${formatarDinheiro(resultado)}
            </strong>
        </p>
    `;
});


botaoLimpar.addEventListener("click", function () {

    campoPercentual.value = "";
    campoValorBase.value = "";

    areaResultado.innerHTML = "";
    areaResultado.hidden = true;

    campoPercentual.focus();
});


// ==================================================
// CALCULADORA 2
// DESCOBRIR QUAL PORCENTAGEM UMA PARTE REPRESENTA
// ==================================================

botaoCalcularRepresentacao.addEventListener("click", function () {

    const valorParte = Number(campoValorParte.value);
    const valorTotal = Number(campoValorTotal.value);

    if (
        campoValorParte.value === "" ||
        campoValorTotal.value === "" ||
        valorParte < 0 ||
        valorTotal <= 0
    ) {
        areaResultadoRepresentacao.hidden = false;

        areaResultadoRepresentacao.innerHTML = `
            <strong>Atenção:</strong>
            informe uma parte e um total válidos.
            O total deve ser maior que zero.
        `;

        return;
    }

    const razao = valorParte / valorTotal;
    const percentualRepresentado = razao * 100;

    const percentualArredondado =
        Math.round(
            (percentualRepresentado + Number.EPSILON) * 100
        ) / 100;

    const precisaAproximacao =
        Math.abs(
            percentualRepresentado - percentualArredondado
        ) > 0.0000001;

    const simboloResultado =
        precisaAproximacao ? "≈" : "=";

    const textoAproximacao = precisaAproximacao
        ? `
            <p>
                <em>
                    O símbolo <strong>≈</strong> significa
                    <strong>“aproximadamente igual”</strong>.
                    Ele é usado quando arredondamos um número que possui
                    mais casas decimais.
                </em>
            </p>
        `
        : "";

    const palavraAproximadamente =
        precisaAproximacao
            ? "aproximadamente "
            : "";

    const reticenciasRazao =
        precisaAproximacao ? "..." : "";

    areaResultadoRepresentacao.hidden = false;

    areaResultadoRepresentacao.innerHTML = `
        <h4>Resultado</h4>

        <p>
            <strong>
                R$ ${formatarDinheiro(valorParte)}
                representa ${palavraAproximadamente}
                ${formatarPorcentagemDuasCasas(percentualRepresentado)}%
                de R$ ${formatarDinheiro(valorTotal)}.
            </strong>
        </p>

        <hr>

        <h4>Como chegamos ao resultado?</h4>

        <p>
            <strong>1º passo — Dividir a parte pelo total:</strong>
        </p>

        <p>
            <span class="fracao">
                <span>${formatarDinheiro(valorParte)}</span>
                <span>${formatarDinheiro(valorTotal)}</span>
            </span>
            =
            ${formatarCalculo(razao)}${reticenciasRazao}
        </p>

        <p>
            <strong>2º passo — Multiplicar por 100:</strong>
        </p>

        <p>
            ${formatarCalculo(razao)}${reticenciasRazao}
            × 100
            ${simboloResultado}

            <strong>
                ${formatarPorcentagemDuasCasas(percentualRepresentado)}%
            </strong>
        </p>

        ${textoAproximacao}

        <p>
            Portanto,
            <strong>
                R$ ${formatarDinheiro(valorParte)}
                representa ${palavraAproximadamente}
                ${formatarPorcentagemDuasCasas(percentualRepresentado)}%
                de R$ ${formatarDinheiro(valorTotal)}.
            </strong>
        </p>
    `;
});


botaoLimparRepresentacao.addEventListener("click", function () {

    campoValorParte.value = "";
    campoValorTotal.value = "";

    areaResultadoRepresentacao.innerHTML = "";
    areaResultadoRepresentacao.hidden = true;

    campoValorParte.focus();
});


// ==================================================
// CALCULADORA 3
// AUMENTO E DESCONTO
// ==================================================

botaoCalcularAjuste.addEventListener("click", function () {

    const valorInicial =
        Number(campoValorInicialAjuste.value);

    const percentual =
        Number(campoPercentualAjuste.value);

    const tipoSelecionado =
        document.querySelector(
            'input[name="tipoAjuste"]:checked'
        );

    if (
        campoValorInicialAjuste.value === "" ||
        campoPercentualAjuste.value === "" ||
        valorInicial < 0 ||
        percentual < 0
    ) {
        areaResultadoAjuste.hidden = false;

        areaResultadoAjuste.innerHTML = `
            <strong>Atenção:</strong>
            informe um valor inicial e uma porcentagem válidos.
        `;

        return;
    }

    if (!tipoSelecionado) {

        areaResultadoAjuste.hidden = false;

        areaResultadoAjuste.innerHTML = `
            <strong>Atenção:</strong>
            escolha se deseja calcular
            <strong>aumento</strong> ou
            <strong>desconto</strong>.
        `;

        return;
    }

    const tipo = tipoSelecionado.value;

    if (tipo === "desconto" && percentual > 100) {

        areaResultadoAjuste.hidden = false;

        areaResultadoAjuste.innerHTML = `
            <strong>Atenção:</strong>
            o desconto não pode ser maior que 100%.
        `;

        return;
    }

    const percentualDecimal = percentual / 100;

    const valorAlteracaoExato =
        valorInicial * percentualDecimal;

    const valorAlteracaoArredondado =
        Math.round(
            (valorAlteracaoExato + 0.000000001) * 100
        ) / 100;

    const precisaAproximacao =
        Math.abs(
            valorAlteracaoExato - valorAlteracaoArredondado
        ) > 0.0000001;

    const simboloMonetario =
        precisaAproximacao ? "≈" : "=";

    const reticenciasDecimal =
        precisaAproximacao ? "..." : "";

    let valorFinalExato;
    let valorFinalArredondado;
    let nomeOperacao;
    let sinalOperacao;
    let textoExplicacao;

    if (tipo === "aumento") {

        valorFinalExato =
            valorInicial + valorAlteracaoArredondado;

        valorFinalArredondado =
            Math.round(
                (valorFinalExato + 0.000000001) * 100
            ) / 100;

        nomeOperacao = "aumento";
        sinalOperacao = "+";
                textoExplicacao =
            "No aumento, somamos o valor calculado ao valor inicial.";

    } else {

        valorFinalExato =
            valorInicial - valorAlteracaoArredondado;

        valorFinalArredondado =
            Math.round(
                (valorFinalExato + 0.000000001) * 100
            ) / 100;

        nomeOperacao = "desconto";
        sinalOperacao = "−";

        textoExplicacao =
            "No desconto, subtraímos o valor calculado do valor inicial.";
    }

    const textoAproximacao = precisaAproximacao
        ? `
            <p>
                <em>
                    O símbolo <strong>≈</strong> significa
                    <strong>“aproximadamente igual”</strong>.
                    Como estamos trabalhando com dinheiro,
                    o resultado foi arredondado para centavos.
                </em>
            </p>
        `
        : "";

    const palavraAproximadamente =
        precisaAproximacao
            ? "aproximadamente "
            : "";

    areaResultadoAjuste.hidden = false;

    areaResultadoAjuste.innerHTML = `
        <h4>Resultado</h4>

        <p>
            Valor inicial:
            <strong>
                R$ ${formatarDinheiro(valorInicial)}
            </strong>
        </p>

        <p>
            ${formatarPorcentagem(percentual)}%
            de ${nomeOperacao}:
            <strong>
                ${palavraAproximadamente}
                R$ ${formatarDinheiro(valorAlteracaoArredondado)}
            </strong>
        </p>

        <p>
            Novo valor:
            <strong>
                ${palavraAproximadamente}
                R$ ${formatarDinheiro(valorFinalArredondado)}
            </strong>
        </p>

        <hr>

        <h4>Como chegamos ao resultado?</h4>

        <p>
            <strong>1º passo — Transformar a porcentagem:</strong>
        </p>

        <p>
            ${formatarPorcentagem(percentual)}% =
            <span class="fracao">
                <span>${formatarPorcentagem(percentual)}</span>
                <span>100</span>
            </span>
            =
            ${formatarCalculo(percentualDecimal)}${reticenciasDecimal}
        </p>

        <p>
            <strong>
                2º passo — Calcular
                ${formatarPorcentagem(percentual)}%
                de R$ ${formatarDinheiro(valorInicial)}:
            </strong>
        </p>

        <p>
            ${formatarCalculo(percentualDecimal)}${reticenciasDecimal}
            ×
            ${formatarDinheiro(valorInicial)}
            ${simboloMonetario}
            ${formatarDinheiro(valorAlteracaoArredondado)}
        </p>

        ${textoAproximacao}

        <p>
            <strong>3º passo — Calcular o valor final:</strong>
        </p>

        <p>
            R$ ${formatarDinheiro(valorInicial)}
            ${sinalOperacao}
            R$ ${formatarDinheiro(valorAlteracaoArredondado)}
            =
            <strong>
                R$ ${formatarDinheiro(valorFinalArredondado)}
            </strong>
        </p>

        <p>
            <em>${textoExplicacao}</em>
        </p>

        <p>
            Portanto, após o
            <strong>${nomeOperacao}</strong>
            de
            <strong>${formatarPorcentagem(percentual)}%</strong>,
            o valor passa de
            <strong>R$ ${formatarDinheiro(valorInicial)}</strong>
            para
            <strong>
                ${palavraAproximadamente}
                R$ ${formatarDinheiro(valorFinalArredondado)}.
            </strong>
        </p>
    `;
});


botaoLimparAjuste.addEventListener("click", function () {

    campoValorInicialAjuste.value = "";
    campoPercentualAjuste.value = "";

    document
        .querySelectorAll('input[name="tipoAjuste"]')
        .forEach(function (opcao) {
            opcao.checked = false;
        });

    areaResultadoAjuste.innerHTML = "";
    areaResultadoAjuste.hidden = true;

    campoValorInicialAjuste.focus();
});


// ==================================================
// INTERPRETE — SITUAÇÃO 1: DESCONTO
// ==================================================

const botaoVerificarInterpretacaoDesconto =
    document.getElementById("verificarInterpretacaoDesconto");

const feedbackInterpretacaoDesconto =
    document.getElementById("feedbackInterpretacaoDesconto");


botaoVerificarInterpretacaoDesconto.addEventListener(
    "click",
    function () {

        const alternativaSelecionada =
            document.querySelector(
                'input[name="interpretacaoDesconto"]:checked'
            );

        feedbackInterpretacaoDesconto.hidden = false;

        if (!alternativaSelecionada) {

            feedbackInterpretacaoDesconto.innerHTML = `
                <strong>Atenção:</strong>
                escolha uma alternativa antes de verificar.
            `;

            return;
        }

        if (alternativaSelecionada.value === "desconto") {

            feedbackInterpretacaoDesconto.innerHTML = `
                <p>
                    ✅ <strong>Muito bem!</strong>
                    R$ 127,50 representa o valor do desconto.
                </p>

                <p>
                    Para descobrir o preço final:
                </p>

                <p>
                    R$ 500,00 − R$ 127,50 =
                    <strong>R$ 372,50</strong>
                </p>
            `;

        } else {

            feedbackInterpretacaoDesconto.innerHTML = `
                <p>
                    ❌ Essa não é a interpretação correta.
                </p>

                <p>
                    Observe que R$ 127,50 foi obtido calculando
                    <strong>25,5% do preço original</strong>.
                    Esse valor ainda precisa ser subtraído
                    do preço inicial.
                </p>
            `;
        }
    }
);


// ==================================================
// INTERPRETE — SITUAÇÃO 2: AUMENTO
// ==================================================

const botaoVerificarInterpretacaoAumento =
    document.getElementById("verificarInterpretacaoAumento");

const feedbackInterpretacaoAumento =
    document.getElementById("feedbackInterpretacaoAumento");


botaoVerificarInterpretacaoAumento.addEventListener(
    "click",
    function () {

        const alternativaSelecionada =
            document.querySelector(
                'input[name="interpretacaoAumento"]:checked'
            );

        feedbackInterpretacaoAumento.hidden = false;

        if (!alternativaSelecionada) {

            feedbackInterpretacaoAumento.innerHTML = `
                <strong>Atenção:</strong>
                escolha uma alternativa antes de verificar.
            `;

            return;
        }

        if (alternativaSelecionada.value === "aumento") {

            feedbackInterpretacaoAumento.innerHTML = `
                <p>
                    ✅ <strong>Muito bem!</strong>
                    R$ 60,00 representa o valor do aumento.
                </p>

                <p>
                    Para descobrir o novo preço:
                </p>

                <p>
                    R$ 400,00 + R$ 60,00 =
                    <strong>R$ 460,00</strong>
                </p>
            `;

        } else {

            feedbackInterpretacaoAumento.innerHTML = `
                <p>
                    ❌ Essa não é a interpretação correta.
                </p>

                <p>
                    Observe que R$ 60,00 foi obtido calculando
                    <strong>15% do preço original</strong>.
                    Esse valor ainda precisa ser somado
                    ao preço inicial.
                </p>
            `;
        }
    }
);


// ==================================================
// DECIDA
// ==================================================

const botaoVerificarDecisao =
    document.getElementById("verificarDecisao");

const feedbackDecisao =
    document.getElementById("feedbackDecisao");


botaoVerificarDecisao.addEventListener(
    "click",
    function () {

        const decisaoSelecionada =
            document.querySelector(
                'input[name="decisaoPorcentagem"]:checked'
            );

        feedbackDecisao.hidden = false;

        if (!decisaoSelecionada) {

            feedbackDecisao.innerHTML = `
                <strong>Atenção:</strong>
                escolha uma alternativa antes de verificar.
            `;

            return;
        }

        if (decisaoSelecionada.value === "b") {

            feedbackDecisao.innerHTML = `
                <p>
                    ✅ <strong>Boa decisão!</strong>
                    A Loja B é mais vantajosa.
                </p>

                <p>
                    <strong>Loja A:</strong><br>
                    20% de R$ 600,00 = R$ 120,00<br>
                    R$ 600,00 − R$ 120,00 =
                    <strong>R$ 480,00</strong>
                </p>

                <p>
                    <strong>Loja B:</strong><br>
                    15% de R$ 550,00 = R$ 82,50<br>
                    R$ 550,00 − R$ 82,50 =
                    <strong>R$ 467,50</strong>
                </p>

                <p>
                    Portanto, mesmo tendo um percentual
                    de desconto menor, a Loja B apresenta
                    o <strong>menor preço final</strong>.
                </p>
            `;

        } else {

            feedbackDecisao.innerHTML = `
                <p>
                    ❌ O maior percentual de desconto
                    nem sempre significa o menor preço final.
                </p>

                <p>
                    Compare o preço original das duas lojas
                    e calcule quanto será pago depois do desconto.
                </p>
            `;
        }
    }
);


// ==================================================
// DECIDA — SITUAÇÃO 2: AUMENTO DE PREÇO
// ==================================================

const botaoVerificarDecisaoAumento =
    document.getElementById("verificarDecisaoAumento");

const feedbackDecisaoAumento =
    document.getElementById("feedbackDecisaoAumento");


botaoVerificarDecisaoAumento.addEventListener(
    "click",
    function () {

        const decisaoAumentoSelecionada =
            document.querySelector(
                'input[name="decisaoAumento"]:checked'
            );

        feedbackDecisaoAumento.hidden = false;

        if (!decisaoAumentoSelecionada) {

            feedbackDecisaoAumento.innerHTML = `
                <strong>Atenção:</strong>
                escolha uma alternativa antes de verificar.
            `;

            return;
        }

        if (decisaoAumentoSelecionada.value === "b") {

            feedbackDecisaoAumento.innerHTML = `
                <p>
                    ✅ <strong>Boa decisão!</strong>
                    A segunda loja tem o menor preço.
                </p>

                <p>
                    <strong>Primeira loja:</strong><br>
                    10% de R$ 400,00 = R$ 40,00<br>
                    R$ 400,00 + R$ 40,00 =
                    <strong>R$ 440,00</strong>
                </p>

                <p>
                    <strong>Segunda loja:</strong><br>
                    Preço final =
                    <strong>R$ 435,00</strong>
                </p>

                <p>
                    Portanto, R$ 435,00 é menor que R$ 440,00.
                    A segunda loja é mais vantajosa.
                </p>
            `;

        } else {

            feedbackDecisaoAumento.innerHTML = `
                <p>
                    ❌ Observe o preço final, e não apenas o percentual.
                </p>

                <p>
                    Na primeira loja, o aumento de 10% faz o preço
                    passar de R$ 400,00 para R$ 440,00.
                    Compare esse valor com R$ 435,00.
                </p>
            `;
        }
    }
);
// ==================================================
// DECIDA — SITUAÇÃO 3: À VISTA OU PARCELADO
// ==================================================

const botaoVerificarDecisaoPagamento =
    document.getElementById("verificarDecisaoPagamento");

const feedbackDecisaoPagamento =
    document.getElementById("feedbackDecisaoPagamento");


botaoVerificarDecisaoPagamento.addEventListener(
    "click",
    function () {

        const decisaoPagamentoSelecionada =
            document.querySelector(
                'input[name="decisaoPagamento"]:checked'
            );

        feedbackDecisaoPagamento.hidden = false;

        if (!decisaoPagamentoSelecionada) {

            feedbackDecisaoPagamento.innerHTML = `
                <strong>Atenção:</strong>
                escolha uma alternativa antes de verificar.
            `;

            return;
        }

        if (decisaoPagamentoSelecionada.value === "a") {

            feedbackDecisaoPagamento.innerHTML = `
                <p>
                    ✅ <strong>Boa decisão!</strong>
                    O pagamento à vista tem o menor preço total.
                </p>

                <p>
                    <strong>Opção A — à vista:</strong><br>
                    8% de R$ 1.200,00 = R$ 96,00<br>
                    R$ 1.200,00 − R$ 96,00 =
                    <strong>R$ 1.104,00</strong>
                </p>

                <p>
                    <strong>Opção B — parcelado:</strong><br>
                    Preço total =
                    <strong>R$ 1.140,00</strong>
                </p>

                <p>
                    Como R$ 1.104,00 é menor que R$ 1.140,00,
                    a opção à vista é mais vantajosa considerando
                    apenas o preço total.
                </p>
            `;

        } else {

            feedbackDecisaoPagamento.innerHTML = `
                <p>
                    ❌ Compare os valores finais das duas opções.
                </p>

                <p>
                    Com 8% de desconto, o preço à vista fica em
                    <strong>R$ 1.104,00</strong>.
                    O preço total parcelado é
                    <strong>R$ 1.140,00</strong>.
                </p>
            `;
        }
    }
);


// ==================================================
// TRILHA DE PROGRESSO DO MÓDULO 1
// ==================================================

const progressoTexto =
    document.getElementById("progressoTexto");

const trilhaPreenchimento =
    document.getElementById("trilhaPreenchimento");

const trilhaAcessivel =
    document.querySelector(".trilha-acessivel");

const mensagemConclusao =
    document.getElementById("mensagemConclusao");

const etapasConcluidas = new Set();


function atualizarTrilhaProgresso() {

    const progresso = etapasConcluidas.size * 25;

    progressoTexto.textContent = `${progresso}%`;


    // ==============================================
    // SINCRONIZA A BARRA COMPACTA
    // ==============================================

    const progressoCompacto =
        document.getElementById("progressoCompacto");

    const progressoCompactoTexto =
        document.getElementById("progressoCompactoTexto");

    const progressoCompactoPreenchimento =
        document.getElementById("progressoCompactoPreenchimento");

    const progressoCompactoRotulo =
        document.getElementById("progressoCompactoRotulo");

    const progressoCompactoMensagem =
        document.getElementById("progressoCompactoMensagem");


    if (progressoCompactoTexto) {

        progressoCompactoTexto.textContent =
            `${progresso}%`;
    }


    if (progressoCompactoPreenchimento) {

        progressoCompactoPreenchimento.style.width =
            `${progresso}%`;
    }


    if (progressoCompacto) {

        const moduloConcluido =
            progresso === 100;

        progressoCompacto.classList.toggle(
            "concluido",
            moduloConcluido
        );


        if (progressoCompactoRotulo) {

            progressoCompactoRotulo.textContent =
                moduloConcluido
                    ? "🏆 Módulo 1 concluído!"
                    : "Progresso";
        }


        if (progressoCompactoMensagem) {

            progressoCompactoMensagem.hidden =
                !moduloConcluido;
        }
    }


    // ==============================================
    // ATUALIZA A TRILHA PRINCIPAL
    // ==============================================

    const preenchimentoLinha = {
        0: 0,
        25: 0,
        50: 33.333,
        75: 66.666,
        100: 100
    };

    trilhaPreenchimento.style.width =
        `${preenchimentoLinha[progresso]}%`;

    trilhaAcessivel.setAttribute(
        "aria-valuenow",
        String(progresso)
    );

    document
        .querySelectorAll(".trilha-passo")
        .forEach(function (passo) {

            const etapa = passo.dataset.etapa;

            passo.classList.toggle(
                "concluido",
                etapasConcluidas.has(etapa)
            );
        });

    mensagemConclusao.hidden =
        progresso !== 100;
}


function concluirEtapa(nomeEtapa) {

    if (etapasConcluidas.has(nomeEtapa)) {
        return;
    }

    etapasConcluidas.add(nomeEtapa);

    atualizarTrilhaProgresso();
}


// ==================================================
// APRENDA
// Conclui quando o aluno abre um conteúdo.
// ==================================================

document
    .querySelectorAll("#porcentagem .aprenda .subtopico-titulo")
    .forEach(function (botao) {

        botao.addEventListener("click", function () {

            concluirEtapa("aprenda");

        });
    });


// ==================================================
// FAÇA
// Conclui quando uma calculadora gera resultado válido.
// ==================================================

[
    {
        botao: botaoCalcular,
        resultado: areaResultado
    },
    {
        botao: botaoCalcularRepresentacao,
        resultado: areaResultadoRepresentacao
    },
    {
        botao: botaoCalcularAjuste,
        resultado: areaResultadoAjuste
    }

].forEach(function (item) {

    item.botao.addEventListener("click", function () {

        setTimeout(function () {

            if (
                item.resultado &&
                item.resultado.innerHTML.includes(
                    "<h4>Resultado</h4>"
                )
            ) {

                concluirEtapa("faca");

            }

        }, 0);
    });
});


// ==================================================
// INTERPRETE
// Conclui quando as DUAS situações estiverem corretas.
// ==================================================

function verificarConclusaoInterprete() {

    const respostaDesconto =
        document.querySelector(
            'input[name="interpretacaoDesconto"]:checked'
        );

    const respostaAumento =
        document.querySelector(
            'input[name="interpretacaoAumento"]:checked'
        );

    const descontoCorreto =
        respostaDesconto &&
        respostaDesconto.value === "desconto";

    const aumentoCorreto =
        respostaAumento &&
        respostaAumento.value === "aumento";

    if (
        descontoCorreto &&
        aumentoCorreto
    ) {

        concluirEtapa("interprete");
    }
}


botaoVerificarInterpretacaoDesconto.addEventListener(
    "click",
    verificarConclusaoInterprete
);

botaoVerificarInterpretacaoAumento.addEventListener(
    "click",
    verificarConclusaoInterprete
);


// ==================================================
// DECIDA
// Conclui quando as TRÊS decisões estiverem corretas.
// ==================================================

function verificarConclusaoDecida() {

    const respostaDesconto =
        document.querySelector(
            'input[name="decisaoPorcentagem"]:checked'
        );

    const respostaAumento =
        document.querySelector(
            'input[name="decisaoAumento"]:checked'
        );

    const respostaPagamento =
        document.querySelector(
            'input[name="decisaoPagamento"]:checked'
        );


    const descontoCorreto =
        respostaDesconto &&
        respostaDesconto.value === "b";

    const aumentoCorreto =
        respostaAumento &&
        respostaAumento.value === "b";

    const pagamentoCorreto =
        respostaPagamento &&
        respostaPagamento.value === "a";


    if (
        descontoCorreto &&
        aumentoCorreto &&
        pagamentoCorreto
    ) {

        concluirEtapa("decida");
    }
}


botaoVerificarDecisao.addEventListener(
    "click",
    verificarConclusaoDecida
);

botaoVerificarDecisaoAumento.addEventListener(
    "click",
    verificarConclusaoDecida
);

botaoVerificarDecisaoPagamento.addEventListener(
    "click",
    verificarConclusaoDecida
);


// ==================================================
// INICIALIZA O PROGRESSO
// ==================================================

atualizarTrilhaProgresso();


// ==================================================
// APRENDA — REPRESENTAÇÃO VISUAL DA PORCENTAGEM
// ==================================================

const campoPercentualVisual =
    document.getElementById("percentualVisual");

const containerGradesPorcentagem =
    document.getElementById("gradePorcentagem");

const fraseVisualPorcentagem =
    document.getElementById("fraseVisualPorcentagem");

const calculoVisualPorcentagem =
    document.getElementById("calculoVisualPorcentagem");


// ==================================================
// CONFIGURAÇÕES DA REPRESENTAÇÃO
// ==================================================



const MAXIMO_QUADROS_VISIVEIS = 6;


// ==================================================
// FORMATAÇÃO DA PORCENTAGEM VISUAL
// ==================================================

function formatarPercentualVisual(numero) {

    return numero.toLocaleString("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });

}
// ==================================================
// CRIA UMA GRADE DE 100 PARTES
// ==================================================

function criarGradeIndividual(percentualDoQuadro) {

    const quadro =
        document.createElement("div");

    quadro.className =
        "grade-porcentagem-quadro";

    const grade =
        document.createElement("div");

    grade.className =
        "grade-porcentagem";

    const partesInteiras =
        Math.floor(percentualDoQuadro);

    const parteDecimal =
        percentualDoQuadro - partesInteiras;


    for (let i = 0; i < 100; i++) {

        const parte =
            document.createElement("span");

        parte.className =
            "grade-porcentagem-parte";


        if (i < partesInteiras) {

            parte.classList.add("ativa");

        } else if (
            i === partesInteiras &&
            parteDecimal > 0
        ) {

            parte.classList.add("parcial");

            parte.style.setProperty(
                "--preenchimento-parcial",
                `${parteDecimal * 100}%`
            );
        }


        parte.setAttribute(
            "aria-hidden",
            "true"
        );

        grade.appendChild(parte);
    }


    quadro.appendChild(grade);

    return quadro;
}
// ==================================================
// ATUALIZA A REPRESENTAÇÃO VISUAL
// ==================================================

function atualizarVisualPorcentagem() {

    if (
        !campoPercentualVisual ||
        !containerGradesPorcentagem
    ) {
        return;
    }


    let percentual =
        Number(campoPercentualVisual.value);


    if (!Number.isFinite(percentual)) {
        percentual = 0;
    }


    percentual =
        Math.max(0, percentual);


    // Mantém o valor digitado com até duas casas decimais
    percentual =
        Number(
            percentual.toFixed(2)
        );


    const quantidadeQuadrosNecessarios =
        percentual === 0
            ? 1
            : Math.ceil(percentual / 100);


    const quantidadeQuadrosMostrar =
        Math.min(
            quantidadeQuadrosNecessarios,
            MAXIMO_QUADROS_VISIVEIS
        );


    containerGradesPorcentagem.innerHTML = "";


    for (
        let indice = 0;
        indice < quantidadeQuadrosMostrar;
        indice++
    ) {

        const inicioQuadro =
            indice * 100;

        let percentualDoQuadro =
            percentual - inicioQuadro;


        percentualDoQuadro =
            Math.max(
                0,
                Math.min(
                    100,
                    percentualDoQuadro
                )
            );


        const quadro =
            criarGradeIndividual(
                percentualDoQuadro
            );


        containerGradesPorcentagem.appendChild(
            quadro
        );
    }


    const percentualFormatado =
        formatarPercentualVisual(percentual);


    const decimal =
        (percentual / 100)
            .toLocaleString(
                "pt-BR",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4
                }
            );


    if (fraseVisualPorcentagem) {

        fraseVisualPorcentagem.textContent =
            `${percentualFormatado}% representa ${percentualFormatado} de cada 100 partes.`;
    }


    if (calculoVisualPorcentagem) {

        calculoVisualPorcentagem.textContent =
            `${percentualFormatado}% = ${percentualFormatado}/100 = ${decimal}`;
    }


    containerGradesPorcentagem.setAttribute(
        "aria-label",
        `Representação gráfica de ${percentualFormatado}%`
    );


    if (
        quantidadeQuadrosNecessarios >
        MAXIMO_QUADROS_VISIVEIS
    ) {

        const aviso =
            document.createElement("p");

        aviso.className =
            "grade-porcentagem-aviso";

        aviso.textContent =
            `Valor muito alto: mostrando apenas os primeiros ${MAXIMO_QUADROS_VISIVEIS} quadros de 100%.`;

        containerGradesPorcentagem.appendChild(
            aviso
        );
    }
}


// ==================================================
// INICIALIZA A REPRESENTAÇÃO VISUAL
// ==================================================

if (
    campoPercentualVisual &&
    containerGradesPorcentagem
) {

    atualizarVisualPorcentagem();


    campoPercentualVisual.addEventListener(
        "input",
        atualizarVisualPorcentagem
    );


    campoPercentualVisual.addEventListener(
        "change",
        function () {

            let percentual =
                Number(
                    campoPercentualVisual.value
                );


            if (!Number.isFinite(percentual)) {
                percentual = 0;
            }


            percentual =
                Math.max(
                    0,
                    percentual
                );


            percentual =
                Number(
                    percentual.toFixed(2)
                );


            campoPercentualVisual.value =
                percentual;


            atualizarVisualPorcentagem();
        }
    );
}