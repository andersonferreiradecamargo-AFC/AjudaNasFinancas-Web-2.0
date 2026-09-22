// ==================================================
// MÓDULO 2 — JUROS SIMPLES
// FAÇA
// Conversão automática entre períodos
// ==================================================

(() => {

    const form = document.getElementById("jsFormularioFaca");
    if (!form) return;

    // ==================================================
    // ELEMENTOS
    // ==================================================

    const capitalCampo = document.getElementById("jsCapitalFaca");
    const taxaCampo = document.getElementById("jsTaxaFaca");
    const tempoCampo = document.getElementById("jsTempoFaca");

    const unidadeTaxa = document.getElementById("jsUnidadeTaxaFaca");
    const unidadeTempo = document.getElementById("jsUnidadeTempoFaca");

    const resultado = document.getElementById("jsResultadoFaca");
    const erro = document.getElementById("jsErroFaca");

    const botaoLimpar = document.getElementById("jsLimparFaca");
    const botaoUsarAprenda = document.getElementById("jsUsarAprenda");

    const campos = [
        capitalCampo,
        taxaCampo,
        tempoCampo
    ];

    // ==================================================
    // CONVERSÃO DOS PERÍODOS
    //
    // Convenção didática/comercial:
    // 1 mês = 30 dias
    // 1 trimestre = 3 meses
    // 1 semestre = 6 meses
    // 1 ano = 12 meses
    // ==================================================

    const mesesPorUnidade = {
        dia: 1 / 30,
        mes: 1,
        trimestre: 3,
        semestre: 6,
        ano: 12
    };

    const nomesTaxa = {
        dia: "ao dia",
        mes: "ao mês",
        trimestre: "ao trimestre",
        semestre: "ao semestre",
        ano: "ao ano"
    };

    const nomesTempoSingular = {
        dia: "dia",
        mes: "mês",
        trimestre: "trimestre",
        semestre: "semestre",
        ano: "ano"
    };

    const nomesTempoPlural = {
        dia: "dias",
        mes: "meses",
        trimestre: "trimestres",
        semestre: "semestres",
        ano: "anos"
    };

    // ==================================================
    // FORMATAÇÃO
    // ==================================================

    const numero = valor =>
        valor.toLocaleString("pt-BR", {
            maximumFractionDigits: 10
        });

    const dinheiro = valor =>
        valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

    function nomeTempo(unidade, quantidade) {
        return Math.abs(quantidade - 1) < 0.000000001
            ? nomesTempoSingular[unidade]
            : nomesTempoPlural[unidade];
    }

    // ==================================================
    // LIMPAR RESULTADO
    // ==================================================

    const ocultar = () => {
        resultado.hidden = true;
        resultado.innerHTML = "";

        erro.hidden = true;
        erro.textContent = "";
    };

    campos.forEach(campo => {
        campo.addEventListener("input", ocultar);
    });

    unidadeTaxa.addEventListener("change", ocultar);
    unidadeTempo.addEventListener("change", ocultar);

    // ==================================================
    // CALCULAR
    // ==================================================

    form.addEventListener("submit", evento => {

        evento.preventDefault();
        ocultar();

        // ----------------------------------------------
        // VALIDAÇÃO
        // ----------------------------------------------

        const invalido = campos.find(campo =>
            campo.value.trim() === "" ||
            !Number.isFinite(campo.valueAsNumber) ||
            campo.valueAsNumber < 0
        );

        if (invalido) {

            erro.textContent =
                "Preencha os três campos com números iguais ou maiores que zero.";

            erro.hidden = false;
            invalido.focus();

            return;
        }

        // ----------------------------------------------
        // VALORES INFORMADOS
        // ----------------------------------------------

        const capital = capitalCampo.valueAsNumber;
        const taxa = taxaCampo.valueAsNumber;
        const tempo = tempoCampo.valueAsNumber;

        const periodoTaxa = unidadeTaxa.value;
        const periodoTempo = unidadeTempo.value;

        // ----------------------------------------------
        // TAXA DECIMAL
        // ----------------------------------------------

        const decimal = taxa / 100;

        // ----------------------------------------------
        // CONVERSÃO DO TEMPO
        //
        // Primeiro transformamos o tempo em meses.
        // Depois descobrimos quantos períodos da taxa
        // existem nesse intervalo.
        // ----------------------------------------------

        const tempoEmMeses =
            tempo * mesesPorUnidade[periodoTempo];

        const quantidadePeriodosTaxa =
            tempoEmMeses / mesesPorUnidade[periodoTaxa];

        // ----------------------------------------------
        // JUROS SIMPLES
        //
        // J = C × i × t
        // ----------------------------------------------

        const jurosPorPeriodo =
            capital * decimal;

        const juros =
            capital *
            decimal *
            quantidadePeriodosTaxa;

        const montante =
            capital + juros;

        // ----------------------------------------------
        // SEGURANÇA
        // ----------------------------------------------

        if (
            ![
                decimal,
                tempoEmMeses,
                quantidadePeriodosTaxa,
                jurosPorPeriodo,
                juros,
                montante
            ].every(Number.isFinite) ||
            Math.max(
                capital,
                jurosPorPeriodo,
                juros,
                montante
            ) > Number.MAX_SAFE_INTEGER / 100
        ) {

            erro.textContent =
                "Os valores são grandes demais para este cálculo. Use valores menores.";

            erro.hidden = false;

            return;
        }

        // ==================================================
        // TEXTO DA CONVERSÃO
        // ==================================================

        let explicacaoConversao = "";

        if (periodoTaxa === periodoTempo) {

            explicacaoConversao = `
                <li>
                    <strong>Confira as unidades.</strong><br>
                    A taxa está ${nomesTaxa[periodoTaxa]}
                    e o tempo está em
                    ${nomesTempoPlural[periodoTempo]}.
                    Portanto, não é necessário converter o tempo.
                    <br>
                    t = ${numero(tempo)}
                </li>
            `;

        } else {

            explicacaoConversao = `
                <li>
                    <strong>Compatibilize a taxa e o tempo.</strong><br>

                    A taxa está
                    <strong>${nomesTaxa[periodoTaxa]}</strong>
                    e o tempo foi informado em
                    <strong>${nomesTempoPlural[periodoTempo]}</strong>.
                    <br><br>

                    ${numero(tempo)}
                    ${nomeTempo(periodoTempo, tempo)}
                    correspondem a
                    <strong>
                        ${numero(quantidadePeriodosTaxa)}
                        ${nomeTempo(
                            periodoTaxa,
                            quantidadePeriodosTaxa
                        )}.</strong>

                    <br>

                    Portanto:
                    <strong>
                        t = ${numero(quantidadePeriodosTaxa)}
                    </strong>
                </li>
            `;
        }

        // ==================================================
        // RESULTADO
        // ==================================================

        resultado.innerHTML = `

            <div class="js-totais">

                <div class="js-total">
                    Juros do período (J)
                    <strong>${dinheiro(juros)}</strong>
                </div>

                <div class="js-total">
                    Montante final (M)
                    <strong>${dinheiro(montante)}</strong>
                </div>

            </div>

            <h4>Veja como calcular</h4>

            <ol>

                <li>
                    <strong>
                        Converta a taxa em número decimal.
                    </strong>
                    <br>

                    ${numero(taxa)}% =
                    ${numero(taxa)} ÷ 100 =
                    ${numero(decimal)}
                </li>

                ${explicacaoConversao}

                <li>
                    <strong>
                        Calcule os juros:
                        J = C × i × t.
                    </strong>
                    <br>

                    ${numero(capital)}
                    ×
                    ${numero(decimal)}
                    ×
                    ${numero(quantidadePeriodosTaxa)}
                    =
                    <strong>${dinheiro(juros)}</strong>
                </li>

                <li>
                    <strong>
                        Calcule o montante:
                        M = C + J.
                    </strong>
                    <br>

                    ${dinheiro(capital)}
                    +
                    ${dinheiro(juros)}
                    =
                    <strong>${dinheiro(montante)}</strong>
                </li>

            </ol>

            <p>
                <strong>O que isso significa?</strong>

                A cada
                ${nomesTempoSingular[periodoTaxa]},
                os juros são
                <strong>${dinheiro(jurosPorPeriodo)}</strong>,
                calculados sempre sobre o capital inicial de
                <strong>${dinheiro(capital)}</strong>.

                Durante
                ${numero(tempo)}
                ${nomeTempo(periodoTempo, tempo)},
                temos
                ${numero(quantidadePeriodosTaxa)}
                ${nomeTempo(
                    periodoTaxa,
                    quantidadePeriodosTaxa
                )}
                de aplicação da taxa.

                Os juros totalizam
                <strong>${dinheiro(juros)}</strong>
                e o valor final é
                <strong>${dinheiro(montante)}</strong>.
            </p>

            <p>
                <small>
                    Para compatibilizar os períodos, esta atividade
                    utiliza a convenção didática/comercial:
                    1 mês = 30 dias,
                    1 trimestre = 3 meses,
                    1 semestre = 6 meses
                    e 1 ano = 12 meses (360 dias).
                    Os cálculos são realizados sem arredondamento
                    intermediário.
                </small>
            </p>
        `;

        resultado.hidden = false;

        // ==================================================
        // RESETAR SELEÇÃO DO LABORATÓRIO
        // ==================================================

        periodoSelecionado.innerHTML = `
            <span>Período selecionado</span>
            <strong>Selecione um ponto do gráfico</strong>
        `;

        tabelaEvolucao.hidden = true;

        botaoMostrarTabela.setAttribute(
            "aria-expanded",
            "false"
        );

        botaoMostrarTabela.textContent =
            "Ver evolução período a período";

        // ==================================================
        // ATUALIZAR LABORATÓRIO FINANCEIRO
        // ==================================================

        const dadosEvolucao =
            gerarEvolucaoJurosSimples(
                capital,
                decimal,
                quantidadePeriodosTaxa
            );
            periodoSelecionado.innerHTML = `
                <span>Período selecionado</span>
                <strong>Selecione um ponto do gráfico</strong>
            `;
        desenharGraficoJurosSimples(dadosEvolucao);
        selecionarPeriodoGrafico(dadosEvolucao);
        criarTabelaEvolucao(dadosEvolucao);
        laboratorioFaca.hidden = false;
            });

    // ==================================================
    // LIMPAR
    // ==================================================

    botaoLimpar.addEventListener("click", () => {

        form.reset();
        ocultar();

        capitalCampo.focus();
    });

    // ==================================================
    // USAR VALORES DO APRENDA
    // ==================================================

    botaoUsarAprenda.addEventListener("click", () => {

        const capitalAprenda =
            document.getElementById("jsCapitalAprenda");

        const taxaAprenda =
            document.getElementById("jsTaxaAprenda");

        const tempoAprenda =
            document.getElementById("jsTempoAprenda");

        if (
            capitalAprenda &&
            taxaAprenda &&
            tempoAprenda
        ) {

            capitalCampo.value =
                capitalAprenda.value;

            taxaCampo.value =
                taxaAprenda.value;

            tempoCampo.value =
                tempoAprenda.value;

            // O APRENDA trabalha atualmente
            // com taxa mensal e tempo em meses.
            unidadeTaxa.value = "mes";
            unidadeTempo.value = "mes";
        }

        ocultar();
        capitalCampo.focus();
         });
        // ==================================================
        // LABORATÓRIO FINANCEIRO — JUROS SIMPLES
        // ==================================================

        const laboratorioFaca =
            document.getElementById("jsLaboratorioFaca");

        const graficoFaca =
            document.getElementById("jsGraficoFaca");

        const periodoSelecionado =
            document.getElementById("jsPeriodoSelecionado");

        const botaoMostrarTabela =
            document.getElementById("jsMostrarTabela");

        const tabelaEvolucao =
            document.getElementById("jsTabelaEvolucao");
            // ==================================================
        // GERAR EVOLUÇÃO DOS JUROS SIMPLES
        // ==================================================

        function gerarEvolucaoJurosSimples(
            capital,
            decimal,
            quantidadePeriodos
        ) {

            const dados = [];

            // Período inicial
            dados.push({
                periodo: 0,
                juros: 0,
                montante: capital
            });

            // Períodos completos
            const periodosCompletos =
                Math.floor(quantidadePeriodos);

            for (let periodo = 1; periodo <= periodosCompletos; periodo++) {

                const jurosAcumulados =
                    capital * decimal * periodo;

                const montantePeriodo =
                    capital + jurosAcumulados;

                dados.push({
                    periodo: periodo,
                    juros: jurosAcumulados,
                    montante: montantePeriodo
                });
            }

            // Se houver uma fração de período,
            // acrescenta o ponto final exato.
            const temFracao =
                Math.abs(
                    quantidadePeriodos - periodosCompletos
                ) > 0.000000001;

            if (temFracao) {

                const jurosFinal =
                    capital * decimal * quantidadePeriodos;

                dados.push({
                    periodo: quantidadePeriodos,
                    juros: jurosFinal,
                    montante: capital + jurosFinal
                });
            }

            return dados;        
            }
            // ==================================================
        // DESENHAR GRÁFICO — JUROS SIMPLES
        // ==================================================

        function desenharGraficoJurosSimples(dados) {

            if (!graficoFaca || dados.length === 0) {
                return;
            }

            const largura = 900;
            const altura = 320;

            const margemEsquerda = 125;
            const margemDireita = 30;
            const margemSuperior = 30;
            const margemInferior = 55;

            const larguraUtil =
                largura - margemEsquerda - margemDireita;

            const alturaUtil =
                altura - margemSuperior - margemInferior;

            const maiorPeriodo =
                Math.max(...dados.map(item => item.periodo), 1);

            const maiorMontante =
                Math.max(...dados.map(item => item.montante), 1);

            const menorMontante =
                Math.min(...dados.map(item => item.montante));

            const intervaloMontante =
                Math.max(maiorMontante - menorMontante, 1);

            const maximoPontosGrafico = 30;

let dadosGrafico = dados;

if (dados.length > maximoPontosGrafico) {

    dadosGrafico = [];

    const ultimoIndice = dados.length - 1;

    for (
        let i = 0;
        i < maximoPontosGrafico;
        i++
    ) {

        const indiceOriginal =
            Math.round(
                (i / (maximoPontosGrafico - 1)) *
                ultimoIndice
            );

        dadosGrafico.push({
            ...dados[indiceOriginal],
            indiceOriginal
        });
    }

} else {

    dadosGrafico = dados.map(
        (item, indiceOriginal) => ({
            ...item,
            indiceOriginal
        })
    );
}

const pontos = dadosGrafico.map(item => {

                const x =
                    margemEsquerda +
                    (item.periodo / maiorPeriodo) * larguraUtil;

                const y =
                    margemSuperior +
                    alturaUtil -
                    (
                        (item.montante - menorMontante) /
                        intervaloMontante
                    ) * alturaUtil;

                return {
                    ...item,
                    x,
                    y
                };
            });

            const linha = pontos
                .map(ponto => `${ponto.x},${ponto.y}`)
                .join(" ");

            const circulos = pontos
                .map((ponto, indice) => `
                    <circle
                        class="js-grafico-ponto"
                        cx="${ponto.x}"
                        cy="${ponto.y}"
                        r="6"
                        data-indice="${ponto.indiceOriginal}"
                        tabindex="0"
                    ></circle>
                `)
                .join("");

            graficoFaca.innerHTML = `
                <svg
                    viewBox="0 0 ${largura} ${altura}"
                    width="100%"
                    role="img"
                    aria-label="Evolução do montante nos juros simples"
                >

                    <line
                        x1="${margemEsquerda}"
                        y1="${margemSuperior}"
                        x2="${margemEsquerda}"
                        y2="${altura - margemInferior}"
                        class="js-grafico-eixo"
                    ></line>

                    <line
                        x1="${margemEsquerda}"
                        y1="${altura - margemInferior}"
                        x2="${largura - margemDireita}"
                        y2="${altura - margemInferior}"
                        class="js-grafico-eixo"
                    ></line>

                    <polyline
                        points="${linha}"
                        class="js-grafico-linha"
                    ></polyline>

                    ${circulos}

                    <circle
                    id="jsMarcadorSelecionado"
                    cx="0"
                    cy="0"
                    r="9"
                    class="js-grafico-marcador-selecionado"
                    visibility="hidden"
                    ></circle>

                    <g id="jsTooltipGrafico" visibility="hidden">
                        <rect
                            id="jsTooltipFundo"
                            x="0"
                            y="0"
                            width="190"
                            height="78"
                            rx="10"
                            ry="10"
                            class="js-grafico-tooltip-fundo"
                        ></rect>

                        <text
                            id="jsTooltipTexto"
                            x="0"
                            y="0"
                            class="js-grafico-tooltip-texto"
                        ></text>
                    </g>

                    <text
                        x="${margemEsquerda}"
                        y="${altura - 18}"
                        class="js-grafico-texto"
                    >
                        Início
                    </text>

                    <text
                        x="${largura - margemDireita}"
                        y="${altura - 18}"
                        text-anchor="end"
                        class="js-grafico-texto"
                    >
                        ${maiorPeriodo.toLocaleString("pt-BR")}
                        período(s)
                    </text>

                    <text
                        x="${margemEsquerda - 12}"
                        y="${margemSuperior + 5}"
                        text-anchor="end"
                        class="js-grafico-texto"
                    >
                        ${dinheiro(maiorMontante)}
                    </text>

                    <text
                        x="${margemEsquerda - 12}"
                        y="${altura - margemInferior + 5}"
                        text-anchor="end"
                        class="js-grafico-texto"
                    >
                        ${dinheiro(menorMontante)}
                    </text>

                </svg>
            `;
        }
// ==================================================
// SELECIONAR PERÍODO NO GRÁFICO
// ==================================================

function selecionarPeriodoGrafico(dados) {

    const pontos =
        graficoFaca.querySelectorAll(".js-grafico-ponto");

    pontos.forEach(ponto => {

        ponto.addEventListener("click", () => {

            const indice =
                Number(ponto.dataset.indice);

            const dado =
                dados[indice];

            if (!dado) {
                return;
            }

            pontos.forEach(outroPonto => {
                outroPonto.classList.remove("selecionado");
            });

            ponto.classList.add("selecionado");
            // Destacar na tabela o mesmo período selecionado no gráfico
            const linhasTabela =
                tabelaEvolucao.querySelectorAll("tbody tr");

            linhasTabela.forEach(linha => {
                linha.classList.remove("selecionada");
            });

            const linhaSelecionada =
                tabelaEvolucao.querySelector(
                    `tbody tr[data-indice="${indice}"]`
                );

                if (linhaSelecionada) {
            linhaSelecionada.classList.add("selecionada");

            const posicaoLinha =
                linhaSelecionada.offsetTop -
                (tabelaEvolucao.clientHeight / 2) +
                (linhaSelecionada.offsetHeight / 2);

            tabelaEvolucao.scrollTo({
                top: posicaoLinha,
                behavior: "smooth"
            });
        }
           
            const tooltip =
            document.getElementById("jsTooltipGrafico");

            const tooltipTexto =
            document.getElementById("jsTooltipTexto");

            const x =
                Number(ponto.getAttribute("cx"));

            const y =
                Number(ponto.getAttribute("cy"));


                if (tooltip && tooltipTexto) {

                    const modoCelular = window.innerWidth <= 600;

                    const larguraTooltip = 190;
                    const alturaTooltip = 78;
                    const distanciaPonto = 16;

                    let tooltipX;
                    let tooltipY;

                    if (modoCelular) {
                        // No celular: fixa o tooltip na faixa inferior do gráfico
                        tooltipX = 355;
                        tooltipY = 170;
                    } else {
                        // No desktop: mantém o tooltip ao lado do ponto
                        tooltipX = x + distanciaPonto;
                        tooltipY = y - (alturaTooltip / 2);
                    }
                                if (!modoCelular) {
                    if (tooltipX + larguraTooltip > 900 - 30) {
                        tooltipX = x - larguraTooltip - distanciaPonto;
                    }

                    tooltipY = Math.max(
                        30,
                        Math.min(tooltipY, 320 - 55 - alturaTooltip)
                    );
                }
                tooltip.setAttribute(
                    "transform",
                    `translate(${tooltipX}, ${tooltipY})`
                );
                tooltipTexto.innerHTML = `
                    <tspan x="12" y="22">
                        Período: ${numero(dado.periodo)}
                    </tspan>
                    <tspan x="12" y="44">
                        Juros: ${dinheiro(dado.juros)}
                    </tspan>
                    <tspan x="12" y="66">
                        Montante: ${dinheiro(dado.montante)}
                    </tspan>
                `;

                tooltip.setAttribute("visibility", "visible");
                }
            });
        });
}
// ==================================================
// CRIAR TABELA DE EVOLUÇÃO
// ==================================================

function criarTabelaEvolucao(dados) {

    if (!tabelaEvolucao || dados.length === 0) {
        return;
    }

    const linhas = dados
        .map((dado, indice) => `
            <tr data-indice="${indice}">
                <td>${numero(dado.periodo)}</td>
                <td>${dinheiro(dado.juros)}</td>
                <td>${dinheiro(dado.montante)}</td>
            </tr>
        `)
        .join("");

    tabelaEvolucao.innerHTML = `
        <table class="js-tabela-financeira">
            <thead>
                <tr>
                    <th>Período</th>
                    <th>Juros acumulados</th>
                    <th>Montante</th>
                </tr>
            </thead>

            <tbody>
                ${linhas}
            </tbody>
        </table>
    `;
        const linhasTabela =
        tabelaEvolucao.querySelectorAll("tbody tr");

    linhasTabela.forEach(linha => {

        linha.addEventListener("click", () => {
            const todasLinhas =
        tabelaEvolucao.querySelectorAll("tbody tr");

    todasLinhas.forEach(outraLinha => {
        outraLinha.classList.remove("selecionada");
    });

    linha.classList.add("selecionada");

            const indice =
                Number(linha.dataset.indice);

            const dado =
                dados[indice];

            if (!dado) {
                return;
            }
            // Move o marcador do gráfico para o período selecionado na tabela
            const marcador =
                document.getElementById("jsMarcadorSelecionado");

            if (marcador) {

                const largura = 900;
                const altura = 320;

                const margemEsquerda = 125;
                const margemDireita = 30;
                const margemSuperior = 30;
                const margemInferior = 55;

                const larguraUtil =
                    largura - margemEsquerda - margemDireita;

                const alturaUtil =
                    altura - margemSuperior - margemInferior;

                const maiorPeriodo =
                    Math.max(...dados.map(item => item.periodo), 1);

                const maiorMontante =
                    Math.max(...dados.map(item => item.montante), 1);

                const menorMontante =
                    Math.min(...dados.map(item => item.montante));

                const intervaloMontante =
                    Math.max(maiorMontante - menorMontante, 1);

                const x =
                    margemEsquerda +
                    (dado.periodo / maiorPeriodo) * larguraUtil;

                const y =
                    margemSuperior +
                    alturaUtil -
                    (
                        (dado.montante - menorMontante) /
                        intervaloMontante
                    ) * alturaUtil;

                marcador.setAttribute("cx", x);
                marcador.setAttribute("cy", y);
                marcador.setAttribute("visibility", "visible");
                const tooltip =
                document.getElementById("jsTooltipGrafico");

            const tooltipFundo =
                document.getElementById("jsTooltipFundo");

            const tooltipTexto =
                document.getElementById("jsTooltipTexto");
                if (tooltip && tooltipFundo && tooltipTexto) {
                const larguraTooltip = 190;
                const alturaTooltip = 78;
                const distanciaPonto = 16;

                let tooltipX = x + distanciaPonto;
                let tooltipY = y - (alturaTooltip / 2);

                if (tooltipX + larguraTooltip > largura - margemDireita) {
                    tooltipX = x - larguraTooltip - distanciaPonto;
                }

                tooltipY = Math.max(
                    margemSuperior,
                    Math.min(tooltipY, altura - margemInferior - alturaTooltip)
                );
                tooltip.setAttribute(
                    "transform",
                    `translate(${tooltipX}, ${tooltipY})`
                );

                tooltipTexto.innerHTML = `
                    <tspan x="12" y="22">
                        Período: ${numero(dado.periodo)}
                    </tspan>
                    <tspan x="12" y="44">
                        Juros: ${formatarDinheiro(dado.juros)}
                    </tspan>
                    <tspan x="12" y="66">
                        Montante: ${formatarDinheiro(dado.montante)}
                    </tspan>
                `;

tooltip.setAttribute("visibility", "visible");
            }
            }
            periodoSelecionado.innerHTML = `
                <span>Período selecionado</span>

                <strong>
                    ${numero(dado.periodo)}
                    ${dado.periodo === 1 ? "período" : "períodos"}
                </strong>

                <div class="js-periodo-valores">

                    <div>
                        <span>Juros acumulados</span>
                        <strong>${dinheiro(dado.juros)}</strong>
                    </div>

                    <div>
                        <span>Montante</span>
                        <strong>${dinheiro(dado.montante)}</strong>
                    </div>

                </div>
            `;
        });
    });
}
// ==================================================
// ABRIR E FECHAR TABELA DE EVOLUÇÃO
// ==================================================

botaoMostrarTabela.addEventListener("click", () => {

    const abrirTabela = tabelaEvolucao.hidden;

    tabelaEvolucao.hidden = !abrirTabela;

    botaoMostrarTabela.setAttribute(
        "aria-expanded",
        String(abrirTabela)
    );

    botaoMostrarTabela.textContent = abrirTabela
        ? "Ocultar evolução período a período"
        : "Ver evolução período a período";
        // Se a tabela estiver sendo aberta,
// leva a rolagem até a linha já selecionada
if (abrirTabela) {

    const linhaSelecionada =
        tabelaEvolucao.querySelector(
            "tbody tr.selecionada"
        );

    if (linhaSelecionada) {

        requestAnimationFrame(() => {

            const posicaoLinha =
                linhaSelecionada.offsetTop -
                (tabelaEvolucao.clientHeight / 2) +
                (linhaSelecionada.offsetHeight / 2);

            tabelaEvolucao.scrollTo({
                top: posicaoLinha,
                behavior: "smooth"
            });

        });
    }
}
});
})();