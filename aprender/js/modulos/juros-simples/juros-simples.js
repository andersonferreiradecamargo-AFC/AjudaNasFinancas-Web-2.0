// ==================================================
// MÓDULO 2 — JUROS SIMPLES
// LINHA DO TEMPO INTERATIVA — APRENDA
// ==================================================

const jsCapitalAprenda =
    document.getElementById("jsCapitalAprenda");

const jsTaxaAprenda =
    document.getElementById("jsTaxaAprenda");

const jsTempoAprenda =
    document.getElementById("jsTempoAprenda");

const linhaTempoJuros =
    document.querySelector("#juros-simples .linha-tempo-juros");

const explicacaoLinhaTempo =
    document.querySelector("#juros-simples .linha-tempo-explicacao");


// ==================================================
// FORMATA DINHEIRO
// ==================================================

function formatarDinheiroJS(valor) {

    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}


// ==================================================
// ATUALIZA A LINHA DO TEMPO
// ==================================================

function atualizarLinhaTempoJuros() {

    if (
        !jsCapitalAprenda ||
        !jsTaxaAprenda ||
        !jsTempoAprenda ||
        !linhaTempoJuros
    ) {
        return;
    }

    const capital =
        Number(jsCapitalAprenda.value);

    const taxa =
        Number(jsTaxaAprenda.value);

    const tempo =
        Number(jsTempoAprenda.value);


    // ----------------------------------------------
    // VALIDAÇÃO
    // ----------------------------------------------

    if (
        !Number.isFinite(capital) ||
        !Number.isFinite(taxa) ||
        !Number.isFinite(tempo) ||
        capital < 0 ||
        taxa < 0 ||
        tempo < 1
    ) {
        return;
    }


    const tempoInteiro =
        Math.min(12, Math.floor(tempo));

    const jurosPorMes =
        capital * (taxa / 100);


    // ----------------------------------------------
    // CAPITAL INICIAL
    // ----------------------------------------------

    let html = `
        <div class="linha-tempo-item">
            <span class="linha-tempo-periodo">
                Início
            </span>

            <strong>
                ${formatarDinheiroJS(capital)}
            </strong>

            <small>
                Capital inicial
            </small>
        </div>
    `;


    // ----------------------------------------------
    // PERÍODOS
    // ----------------------------------------------

    for (let mes = 1; mes <= tempoInteiro; mes++) {

        const montante =
            capital + (jurosPorMes * mes);

        html += `
            <span class="linha-tempo-seta">
                →
            </span>

            <div class="linha-tempo-item">

                <span class="linha-tempo-periodo">
                    ${mes}º mês
                </span>

                <strong>
                    ${formatarDinheiroJS(montante)}
                </strong>

                <small>
                    + ${formatarDinheiroJS(jurosPorMes)}
                </small>

            </div>
        `;
    }


    linhaTempoJuros.innerHTML = html;
    // Sempre volta para o início da linha do tempo
    linhaTempoJuros.scrollLeft = 0;

    // ----------------------------------------------
    // EXPLICAÇÃO
    // ----------------------------------------------

    if (explicacaoLinhaTempo) {

        explicacaoLinhaTempo.innerHTML = `
            💡 Nos juros simples, o acréscimo é
            <strong>constante</strong>:
            neste exemplo, são
            <strong>${formatarDinheiroJS(jurosPorMes)}</strong>
            em cada mês.
        `;
    }
}


// ==================================================
// ATUALIZA AUTOMATICAMENTE AO ALTERAR OS CAMPOS
// ==================================================

[
    jsCapitalAprenda,
    jsTaxaAprenda,
    jsTempoAprenda
].forEach(function (campo) {

    if (campo) {

        campo.addEventListener(
            "input",
            atualizarLinhaTempoJuros
        );
    }
});


// ==================================================
// MOSTRA OS VALORES INICIAIS
// ==================================================

atualizarLinhaTempoJuros();