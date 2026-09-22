// ==================================================
// ACORDEÃO PRINCIPAL
// ==================================================

const botoesAcordeao =
    document.querySelectorAll(".acordeao-titulo");

const primeiraEtapa =
    document.querySelector(".acordeao");

if (primeiraEtapa) {

    primeiraEtapa.classList.add("aberto");

    const primeiroConteudo =
        primeiraEtapa.querySelector(".acordeao-conteudo");

    const primeiraSeta =
        primeiraEtapa.querySelector(".seta");

    primeiroConteudo.style.display = "block";
    primeiraSeta.textContent = "▲";
}

botoesAcordeao.forEach(function (botao) {

    botao.addEventListener("click", function () {

        const etapaAtual =
            botao.parentElement;

        const conteudoAtual =
            etapaAtual.querySelector(".acordeao-conteudo");

        const setaAtual =
            botao.querySelector(".seta");

        const estavaAberto =
            etapaAtual.classList.contains("aberto");

        document
            .querySelectorAll(".acordeao")
            .forEach(function (etapa) {

                etapa.classList.remove("aberto");

                const conteudo =
                    etapa.querySelector(".acordeao-conteudo");

                const seta =
                    etapa.querySelector(".seta");

                conteudo.style.display = "none";
                seta.textContent = "▼";
            });

        if (!estavaAberto) {

            etapaAtual.classList.add("aberto");

            conteudoAtual.style.display = "block";
            setaAtual.textContent = "▲";
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