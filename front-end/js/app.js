const API_URL = "https://localhost:7063";

const DATA_MINIMA = "0001-01-01";
const DATA_MAXIMA = "9999-12-30";

const estado = {
    pagina: 1,
    totalPaginas: 1,
    ordem: "DataCadastro",
    direcao: "DESC"
};

const $ = id => document.getElementById(id);

const formulario = $("formulario");
const formLembrete = $("formLembrete");
const lembreteId = $("lembreteId");
const descricao = $("descricao");
const erroDescricao = $("erroDescricao");
const contador = $("contador");
const btnSalvar = $("btnSalvar");
const tituloFormulario = $("tituloFormulario");

const listaLembretes = $("listaLembretes");
const mensagemVazia = $("mensagemVazia");
const carregando = $("carregando");
const totalRegistros = $("totalRegistros");
const paginaAtualElemento = $("paginaAtual");

const filtroDescricao = $("filtroDescricao");
const filtroCadastroInicial = $("filtroCadastroInicial");
const filtroCadastroFinal = $("filtroCadastroFinal");
const filtroAtualizacaoInicial = $("filtroAtualizacaoInicial");
const filtroAtualizacaoFinal = $("filtroAtualizacaoFinal");
const tamanhoPagina = $("tamanhoPagina");
const erroFiltro = $("erroFiltro");

const erroApi = $("erroApi");
const erroApiTexto = $("erroApiTexto");

const btnImprimir = $("btnImprimir");
const btnNovo = $("btnNovo");
const btnCancelar = $("btnCancelar");
const btnFiltrar = $("btnFiltrar");
const btnLimpar = $("btnLimpar");
const btnTentarNovamente = $("btnTentarNovamente");
const btnPrimeira = $("btnPrimeira");
const btnAnterior = $("btnAnterior");
const btnProximo = $("btnProximo");
const btnUltima = $("btnUltima");

document.addEventListener("DOMContentLoaded", () => {
    atualizarIndicadoresOrdenacao();
    filtrarLembretes();
});

function formatarData(data) {
    if (!data) {
        return "-";
    }

    return new Date(data).toLocaleString("pt-BR");
}

let temporizadorToast;

function mostrarToast(mensagem, tipo = "sucesso") {
    const toast = $("toast");

    toast.textContent = mensagem;
    toast.classList.toggle("toast-erro", tipo === "erro");
    toast.classList.remove("hidden");

    clearTimeout(temporizadorToast);
    temporizadorToast = setTimeout(() => toast.classList.add("hidden"), 3500);
}

function mensagemDeErro(error, acao) {
    if (error instanceof TypeError) {
        return "Não foi possível se comunicar com a API. Verifique se ela está em execução e se o endereço está correto.";
    }

    return `${acao} ${error.message}`.trim();
}

function mostrarErroApi(texto) {
    erroApiTexto.textContent = texto;
    erroApi.classList.remove("hidden");
}

function esconderErroApi() {
    erroApi.classList.add("hidden");
}

async function verificarResposta(response, mensagemPadrao) {
    if (response.ok) {
        return;
    }

    let detalhe = "";

    try {
        detalhe = (await response.text()).replace(/"/g, "").trim();
    } catch {  }

    const extra = response.status === 404
        ? "Registro não encontrado."
        : (response.status === 400 && detalhe ? detalhe : "");

    throw new Error(`${mensagemPadrao} (HTTP ${response.status}). ${extra}`.trim());
}

function validarFiltros() {
    erroFiltro.classList.add("hidden");

    const pares = [
        [filtroCadastroInicial, filtroCadastroFinal, "cadastro"],
        [filtroAtualizacaoInicial, filtroAtualizacaoFinal, "atualização"]
    ];

    for (const [inicial, final, nome] of pares) {
        inicial.classList.remove("invalido");
        final.classList.remove("invalido");

        if (inicial.value && final.value && inicial.value > final.value) {
            inicial.classList.add("invalido");
            final.classList.add("invalido");
            erroFiltro.textContent = `A data inicial de ${nome} não pode ser maior que a data final.`;
            erroFiltro.classList.remove("hidden");

            return false;
        }
    }

    return true;
}

function montarParametros() {
    const params = new URLSearchParams();

    params.append("NumeroPagina", estado.pagina);
    params.append("TamanhoPagina", tamanhoPagina.value);
    params.append("Ordem", estado.ordem);
    params.append("Direcao", estado.direcao);
    params.append("Descricao", filtroDescricao.value.trim());
    params.append("DataCadastroInicial", filtroCadastroInicial.value || DATA_MINIMA);
    params.append("DataCadastroFinal", filtroCadastroFinal.value || DATA_MAXIMA);
    params.append("DataAtualizacaoInicial", filtroAtualizacaoInicial.value || DATA_MINIMA);
    params.append("DataAtualizacaoFinal", filtroAtualizacaoFinal.value || DATA_MAXIMA);

    return params;
}

function existeFiltroAtivo() {
    return Boolean(
        filtroDescricao.value.trim() ||
        filtroCadastroInicial.value ||
        filtroCadastroFinal.value ||
        filtroAtualizacaoInicial.value ||
        filtroAtualizacaoFinal.value
    );
}

async function filtrarLembretes() {
    if (!validarFiltros()) {
        return;
    }

    carregando.classList.remove("hidden");

    try {
        const params = montarParametros();

        const response = await fetch(`${API_URL}/lembretes/filtro?${params}`);

        await verificarResposta(response, "Erro ao consultar os lembretes");

        const resultado = await response.json();

        esconderErroApi();

        estado.totalPaginas = Math.max(1, Math.ceil(resultado.total / resultado.tamanhoPagina));

        if (resultado.lembretes.length === 0 && resultado.total > 0 && estado.pagina > estado.totalPaginas) {
            estado.pagina = estado.totalPaginas;
            carregando.classList.add("hidden");

            return filtrarLembretes();
        }

        renderizarLembretes(resultado.lembretes);

        totalRegistros.textContent =
            `${resultado.total} ${resultado.total === 1 ? "registro" : "registros"}`;

        atualizarPaginacao();

    } catch (error) {
        console.error(error);

        renderizarLembretes([]);
        totalRegistros.textContent = "0 registros";
        mostrarErroApi(mensagemDeErro(error, ""));
        mostrarToast("Erro ao realizar a consulta.", "erro");

    } finally {
        carregando.classList.add("hidden");
    }
}

async function imprimirLembretes() {
    if (!validarFiltros()) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/lembretes/imprimir?${montarParametros()}`);

        await verificarResposta(response, "Erro ao gerar o relatório");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "relatorio-lembretes.pdf";

        document.body.appendChild(a);
        a.click();
        a.remove();

        setTimeout(() => URL.revokeObjectURL(url), 10000);

        mostrarToast("Relatório gerado com sucesso!");

    } catch (error) {
        console.error(error);

        mostrarToast(mensagemDeErro(error, ""), "erro");
    }
}

async function criarLembrete() {
    try {
        const response = await fetch(`${API_URL}/lembretes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ descricao: descricao.value.trim() })
        });

        await verificarResposta(response, "Erro ao criar o lembrete");

        mostrarToast("Lembrete criado com sucesso!");

        fecharFormulario();

        estado.pagina = 1;
        await filtrarLembretes();

    } catch (error) {
        console.error(error);

        mostrarToast(mensagemDeErro(error, "Não foi possível criar o lembrete."), "erro");
    }
}

async function buscarLembrete(id) {
    try {
        const response = await fetch(`${API_URL}/lembretes/${id}`);

        await verificarResposta(response, "Lembrete não encontrado");

        const lembrete = await response.json();

        lembreteId.value = lembrete.id;
        descricao.value = lembrete.descricao;
        limparErroDescricao();
        atualizarContador();

        tituloFormulario.textContent = "Editar lembrete";

        formulario.classList.remove("hidden");
        formulario.scrollIntoView({ behavior: "smooth", block: "center" });
        descricao.focus();

    } catch (error) {
        console.error(error);

        mostrarToast(mensagemDeErro(error, "Não foi possível buscar o lembrete."), "erro");
    }
}

async function atualizarLembrete() {
    try {
        const response = await fetch(`${API_URL}/lembretes/${lembreteId.value}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ descricao: descricao.value.trim() })
        });

        await verificarResposta(response, "Erro ao atualizar o lembrete");

        mostrarToast("Lembrete atualizado com sucesso!");

        fecharFormulario();
        await filtrarLembretes();

    } catch (error) {
        console.error(error);

        mostrarToast(mensagemDeErro(error, "Não foi possível atualizar o lembrete."), "erro");
    }
}

async function excluirLembrete(id) {
    if (!confirm("Deseja realmente excluir este lembrete?")) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/lembretes/${id}`, { method: "DELETE" });

        await verificarResposta(response, "Erro ao excluir o lembrete");

        mostrarToast("Lembrete excluído com sucesso!");

        await filtrarLembretes();

    } catch (error) {
        console.error(error);

        mostrarToast(mensagemDeErro(error, "Não foi possível excluir o lembrete."), "erro");
    }
}

function criarCelula(rotulo, conteudo, classe) {
    const td = document.createElement("td");
    td.dataset.label = rotulo;

    if (classe) {
        td.className = classe;
    }

    if (conteudo instanceof Node) {
        td.appendChild(conteudo);
    } else {
        td.textContent = conteudo;
    }

    return td;
}

function criarBotao(texto, classe, aoClicar) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = `btn ${classe}`;
    botao.textContent = texto;
    botao.addEventListener("click", aoClicar);

    return botao;
}

function renderizarLembretes(lembretes) {
    listaLembretes.innerHTML = "";

    if (!lembretes || lembretes.length === 0) {
        mensagemVazia.textContent = existeFiltroAtivo()
            ? "Nenhum lembrete encontrado para os filtros informados."
            : "Nenhum lembrete cadastrado ainda. Clique em “+ Novo lembrete”.";
        mensagemVazia.classList.remove("hidden");

        return;
    }

    mensagemVazia.classList.add("hidden");

    lembretes.forEach(lembrete => {
        const tr = document.createElement("tr");

        const status = document.createElement("span");
        status.className = `status ${lembrete.isAtivo ? "status-ativo" : "status-inativo"}`;
        status.textContent = lembrete.isAtivo ? "Ativo" : "Inativo";

        const acoes = document.createElement("div");
        acoes.className = "actions";
        acoes.appendChild(criarBotao("Editar", "btn-edit", () => buscarLembrete(lembrete.id)));
        acoes.appendChild(criarBotao("Excluir", "btn-danger", () => excluirLembrete(lembrete.id)));

        tr.appendChild(criarCelula("Descrição", lembrete.descricao, "descricao"));
        tr.appendChild(criarCelula("Cadastro", formatarData(lembrete.dataCadastro)));
        tr.appendChild(criarCelula("Atualização", formatarData(lembrete.dataAtualizacao)));
        tr.appendChild(criarCelula("Status", status));
        tr.appendChild(criarCelula("Ações", acoes));

        listaLembretes.appendChild(tr);
    });
}

function atualizarContador() {
    contador.textContent = `${descricao.value.length}/500`;
}

function limparErroDescricao() {
    erroDescricao.classList.add("hidden");
    descricao.classList.remove("invalido");
}

function abrirFormularioNovo() {
    lembreteId.value = "";
    descricao.value = "";
    limparErroDescricao();
    atualizarContador();

    tituloFormulario.textContent = "Novo lembrete";

    formulario.classList.remove("hidden");
    descricao.focus();
}

function fecharFormulario() {
    formulario.classList.add("hidden");
    formLembrete.reset();
    lembreteId.value = "";
    limparErroDescricao();
    atualizarContador();
}

btnImprimir.addEventListener("click", imprimirLembretes);
btnNovo.addEventListener("click", abrirFormularioNovo);
btnCancelar.addEventListener("click", fecharFormulario);

descricao.addEventListener("input", () => {
    atualizarContador();

    if (descricao.value.trim()) {
        limparErroDescricao();
    }
});

formLembrete.addEventListener("submit", async event => {
    event.preventDefault();

    if (!descricao.value.trim()) {
        erroDescricao.classList.remove("hidden");
        descricao.classList.add("invalido");
        descricao.focus();
        mostrarToast("Preencha os campos obrigatórios.", "erro");

        return;
    }

    btnSalvar.disabled = true;

    try {
        if (lembreteId.value) {
            await atualizarLembrete();
        } else {
            await criarLembrete();
        }
    } finally {
        btnSalvar.disabled = false;
    }
});

function aplicarFiltros() {
    estado.pagina = 1;
    filtrarLembretes();
}

btnFiltrar.addEventListener("click", aplicarFiltros);

btnLimpar.addEventListener("click", () => {
    [
        filtroDescricao,
        filtroCadastroInicial,
        filtroCadastroFinal,
        filtroAtualizacaoInicial,
        filtroAtualizacaoFinal
    ].forEach(campo => {
        campo.value = "";
        campo.classList.remove("invalido");
    });

    aplicarFiltros();
});

[filtroDescricao, filtroCadastroInicial, filtroCadastroFinal,
 filtroAtualizacaoInicial, filtroAtualizacaoFinal].forEach(campo => {
    campo.addEventListener("keyup", event => {
        if (event.key === "Enter") {
            aplicarFiltros();
        }
    });
});

tamanhoPagina.addEventListener("change", aplicarFiltros);
btnTentarNovamente.addEventListener("click", filtrarLembretes);

function atualizarIndicadoresOrdenacao() {
    document.querySelectorAll("th[data-ordem]").forEach(th => {
        if (th.dataset.ordem === estado.ordem) {
            th.setAttribute("aria-sort", estado.direcao === "ASC" ? "ascending" : "descending");
        } else {
            th.setAttribute("aria-sort", "none");
        }
    });
}

document.querySelectorAll("th[data-ordem]").forEach(th => {
    th.querySelector("button").addEventListener("click", () => {
        const campo = th.dataset.ordem;

        if (estado.ordem === campo) {
            estado.direcao = estado.direcao === "ASC" ? "DESC" : "ASC";
        } else {
            estado.ordem = campo;
            estado.direcao = "ASC";
        }

        estado.pagina = 1;
        atualizarIndicadoresOrdenacao();
        filtrarLembretes();
    });
});

function atualizarPaginacao() {
    paginaAtualElemento.textContent = `Página ${estado.pagina} de ${estado.totalPaginas}`;

    btnPrimeira.disabled = estado.pagina <= 1;
    btnAnterior.disabled = estado.pagina <= 1;
    btnProximo.disabled = estado.pagina >= estado.totalPaginas;
    btnUltima.disabled = estado.pagina >= estado.totalPaginas;
}

function irParaPagina(numero) {
    estado.pagina = Math.min(Math.max(1, numero), estado.totalPaginas);
    filtrarLembretes();
}

btnPrimeira.addEventListener("click", () => irParaPagina(1));
btnAnterior.addEventListener("click", () => irParaPagina(estado.pagina - 1));
btnProximo.addEventListener("click", () => irParaPagina(estado.pagina + 1));
btnUltima.addEventListener("click", () => irParaPagina(estado.totalPaginas));
