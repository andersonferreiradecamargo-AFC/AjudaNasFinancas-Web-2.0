// ==================================================
// ACORDEÃO DOS MÓDULOS — AMBIENTE DE APRENDIZAGEM
// Permite fechar todos os módulos; ao abrir um, os demais são recolhidos.
// ==================================================
(function () {
    "use strict";

    const main = document.querySelector("main");
    if (!main) return;

    // A barra compacta é global: fica disponível mesmo quando o Módulo 1 fecha.
    const primeiroModulo = document.getElementById("porcentagem");
    const progressoCompacto = document.getElementById("progressoCompacto");
    if (primeiroModulo && progressoCompacto) {
        main.insertBefore(progressoCompacto, primeiroModulo);
    }

    // Cria os módulos futuros apenas como cabeçalhos recolhidos.
    const dadosFuturos = [
        { id: "juros-compostos", titulo: "Módulo 3 — Juros Compostos", texto: "Em breve" },
        { id: "educacao-financeira", titulo: "Módulo 4 — Educação Financeira", texto: "Em breve" }
    ];

    dadosFuturos.forEach(function (dados) {
        if (document.getElementById(dados.id)) return;
        const secao = document.createElement("section");
        secao.className = "modulo modulo-futuro";
        secao.id = dados.id;
        secao.innerHTML = `<h2>${dados.titulo}</h2><p class="modulo-subtitulo">${dados.texto}</p>`;
        main.appendChild(secao);
    });

    const modulos = Array.from(main.querySelectorAll("section.modulo"));

    modulos.forEach(function (modulo, indice) {
        const titulo = modulo.querySelector(":scope > h2");
        if (!titulo) return;

        const subtitulo = modulo.querySelector(":scope > .modulo-subtitulo");
        const textoSubtitulo = subtitulo ? subtitulo.textContent.trim().replace(/\s+/g, " ") : "";
        if (subtitulo) subtitulo.remove();

        const corpo = document.createElement("div");
        corpo.className = "modulo-corpo";

        let atual = titulo.nextSibling;
        while (atual) {
            const proximo = atual.nextSibling;
            corpo.appendChild(atual);
            atual = proximo;
        }
        modulo.appendChild(corpo);

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "modulo-acordeao-titulo";
        botao.setAttribute("aria-expanded", "false");

        const numero = String(indice + 1).padStart(2, "0");
        const nomeModulo = titulo.textContent.trim().replace(/^Módulo\s+\d+\s*[—-]\s*/i, "");
        const descricao = textoSubtitulo || "Conteúdo em preparação";

        botao.innerHTML = `
            <span class="modulo-numero" aria-hidden="true">${numero}</span>
            <span class="modulo-identidade">
                <strong>${nomeModulo}</strong>
                <small>${descricao}</small>
            </span>
            <span class="modulo-seta" aria-hidden="true">▼</span>
        `;
        botao.setAttribute("aria-label", `Módulo ${indice + 1} — ${nomeModulo}`);
        titulo.replaceWith(botao);

        const abrir = false;
        modulo.classList.remove("modulo-aberto");
        corpo.hidden = true;

        botao.addEventListener("click", function () {
            const jaAberto = modulo.classList.contains("modulo-aberto");

            // Se o módulo atual já estiver aberto, permite fechá-lo.
            // Assim, nenhum módulo precisa ficar obrigatoriamente aberto.
            if (jaAberto) {
                modulo.classList.remove("modulo-aberto");
                corpo.hidden = true;
                botao.setAttribute("aria-expanded", "false");
                const setaAtual = botao.querySelector(".modulo-seta");
                if (setaAtual) setaAtual.textContent = "▼";
                return;
            }

            modulos.forEach(function (outro) {
                outro.classList.remove("modulo-aberto");
                const outroCorpo = outro.querySelector(":scope > .modulo-corpo");
                const outroBotao = outro.querySelector(":scope > .modulo-acordeao-titulo");
                if (outroCorpo) outroCorpo.hidden = true;
                if (outroBotao) {
                    outroBotao.setAttribute("aria-expanded", "false");
                    const seta = outroBotao.querySelector(".modulo-seta");
                    if (seta) seta.textContent = "▼";
                }
            });

            modulo.classList.add("modulo-aberto");
            corpo.hidden = false;
            botao.setAttribute("aria-expanded", "true");
            const seta = botao.querySelector(".modulo-seta");
            if (seta) seta.textContent = "▲";
        });
    });
})();
