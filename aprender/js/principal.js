// ==================================================
// ACORDEÃO PRINCIPAL — ETAPAS INTERNAS DOS MÓDULOS
// Todas começam recolhidas. Dentro de cada módulo, no máximo
// uma etapa (APRENDA, FAÇA, INTERPRETE ou DECIDA) fica aberta.
// A etapa aberta também pode ser fechada.
// ==================================================

const botoesAcordeao = document.querySelectorAll(".acordeao-titulo");

// Estado inicial: todas as etapas internas recolhidas.
document.querySelectorAll(".acordeao").forEach(function (etapa) {
    etapa.classList.remove("aberto");
    const conteudo = etapa.querySelector(":scope > .acordeao-conteudo");
    const seta = etapa.querySelector(":scope > .acordeao-titulo .seta");
    if (conteudo) conteudo.style.display = "none";
    if (seta) seta.textContent = "▼";
});

botoesAcordeao.forEach(function (botao) {
    botao.addEventListener("click", function () {
        const etapaAtual = botao.parentElement;
        const moduloAtual = etapaAtual.closest("section.modulo");
        const conteudoAtual = etapaAtual.querySelector(":scope > .acordeao-conteudo");
        const setaAtual = botao.querySelector(".seta");
        const estavaAberto = etapaAtual.classList.contains("aberto");

        // Fecha somente as etapas irmãs do mesmo módulo.
        // Assim a regra se repete de forma independente em cada módulo.
        if (moduloAtual) {
            moduloAtual.querySelectorAll(":scope > .modulo-corpo > .acordeao").forEach(function (etapa) {
                etapa.classList.remove("aberto");
                const conteudo = etapa.querySelector(":scope > .acordeao-conteudo");
                const seta = etapa.querySelector(":scope > .acordeao-titulo .seta");
                if (conteudo) conteudo.style.display = "none";
                if (seta) seta.textContent = "▼";
            });
        }

        // Se clicou em uma etapa que estava fechada, abre-a.
        // Se clicou na que já estava aberta, todas permanecem fechadas.
        if (!estavaAberto) {
            etapaAtual.classList.add("aberto");
            if (conteudoAtual) conteudoAtual.style.display = "block";
            if (setaAtual) setaAtual.textContent = "▲";
        }
    });
});


// ==================================================
// SUBTÓPICOS DO APRENDA
// ==================================================

const botoesSubtopico =
    document.querySelectorAll(".subtopico-titulo");

document
    .querySelectorAll(".subtopico-conteudo")
    .forEach(function (conteudo) {

        conteudo.style.display = "none";
    });

botoesSubtopico.forEach(function (botao) {

    botao.addEventListener("click", function () {

        const subtopicoAtual =
            botao.parentElement;

        const conteudoAtual =
            subtopicoAtual.querySelector(
                ".subtopico-conteudo"
            );

        const setaAtual =
            botao.querySelector(
                ".subtopico-seta"
            );

        const estavaAberto =
            subtopicoAtual.classList.contains(
                "subtopico-aberto"
            );

        document
            .querySelectorAll(".subtopico")
            .forEach(function (subtopico) {

                subtopico.classList.remove(
                    "subtopico-aberto"
                );

                const conteudo =
                    subtopico.querySelector(
                        ".subtopico-conteudo"
                    );

                const seta =
                    subtopico.querySelector(
                        ".subtopico-seta"
                    );

                conteudo.style.display = "none";
                seta.textContent = "▼";
            });

        if (!estavaAberto) {

            subtopicoAtual.classList.add(
                "subtopico-aberto"
            );

            conteudoAtual.style.display = "block";
            setaAtual.textContent = "▲";
        }
    });
});


// ==================================================
// PROGRESSO COMPACTO INDEPENDENTE
// ==================================================

const trilhaPrincipal =
    document.querySelector(".trilha-progresso");

const progressoCompacto =
    document.getElementById("progressoCompacto");

if (trilhaPrincipal && progressoCompacto) {

    const observadorTrilha =
        new IntersectionObserver(function (entradas) {

            const trilhaVisivel =
                entradas[0].isIntersecting;

            progressoCompacto.hidden =
                trilhaVisivel;

            progressoCompacto.setAttribute(
                "aria-hidden",
                trilhaVisivel ? "true" : "false"
            );

        }, {
            threshold: 0
        });

    observadorTrilha.observe(trilhaPrincipal);
}