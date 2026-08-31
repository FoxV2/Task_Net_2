// =============================================
// script.js - TaskNet (versão final limpa)
// =============================================

const DB_USERS = 'tasknet_users';
const DB_TASKS = 'tasknet_tasks';
const SESSION_KEY = 'tasknet_userLogged';

// ======================
// FUNÇÕES DE USUÁRIO
// ======================
function getUsers() {
    return JSON.parse(localStorage.getItem(DB_USERS)) || [];
}

function saveUsers(users) {
    localStorage.setItem(DB_USERS, JSON.stringify(users));
}

function cadastrarUsuario(nome, email, senha) {
    const users = getUsers();
    if (users.some(u => u.email === email)) {
        alert("❌ Este e-mail já está cadastrado!");
        return false;
    }
    const novoUsuario = {
        id: Date.now(),
        nome,
        email,
        senha // Em produção: hash + backend
    };
    users.push(novoUsuario);
    saveUsers(users);
    return true;
}

function login(email, senha) {
    const users = getUsers();
    const usuario = users.find(u => u.email === email && u.senha === senha);
    if (usuario) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
        return true;
    }
    return false;
}

function getUsuarioLogado() {
    const user = localStorage.getItem(SESSION_KEY);
    return user ? JSON.parse(user) : null;
}

function isLogado() {
    return !!getUsuarioLogado();
}

function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
}

// ======================
// FUNÇÕES DE TAREFAS
// ======================
function getTodasTarefas() {
    return JSON.parse(localStorage.getItem(DB_TASKS)) || [];
}

function getTarefas() {
    const todas = getTodasTarefas();
    const usuario = getUsuarioLogado();
    if (!usuario) return [];
    return todas.filter(t => t.idUsuario === usuario.id);
}

function salvarTarefas(tarefas) {
    localStorage.setItem(DB_TASKS, JSON.stringify(tarefas));
}

function adicionarTarefa(tarefa) {
    const usuario = getUsuarioLogado();
    if (!usuario) {
        alert("Você precisa estar logado para adicionar tarefas.");
        window.location.href = 'login.html';
        return;
    }

    const todas = getTodasTarefas();
    const novaTarefa = {
        id: Date.now(),
        idUsuario: usuario.id,
        titulo: tarefa.titulo,
        descricao: tarefa.descricao || '',
        status: tarefa.status || 'pendente',
        dataVencimento: tarefa.dataVencimento
    };
    todas.push(novaTarefa);
    salvarTarefas(todas);
}

function atualizarTarefa(id, dadosAtualizados) {
    let todas = getTodasTarefas();
    todas = todas.map(t => {
        if (t.id === id) {
            return { ...t, ...dadosAtualizados };
        }
        return t;
    });
    salvarTarefas(todas);
}

function atualizarStatus(id, novoStatus) {
    atualizarTarefa(id, { status: novoStatus });
}

function deletarTarefa(id) {
    if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
        let todas = getTodasTarefas();
        todas = todas.filter(t => t.id !== id);
        salvarTarefas(todas);
        carregarListaTarefas();
        mostrarEstatisticas();
    }
}

function marcarComoConcluida(id) {
    atualizarStatus(id, 'concluida');
    carregarListaTarefas();
    mostrarEstatisticas();
}

function editarTarefa(id) {
    localStorage.setItem('tarefaEmEdicao', id);
    window.location.href = 'nova-tarefa.html';
}

// ======================
// INTERFACE
// ======================
function getBadgeClass(status) {
    const map = {
        'pendente': 'badge-pendente',
        'em_andamento': 'badge-em_andamento',
        'concluida': 'badge-concluida'
    };
    return map[status] || 'badge-secondary';
}

function formatarStatus(status) {
    const map = {
        'pendente': 'Pendente',
        'em_andamento': 'Em andamento',
        'concluida': 'Concluída'
    };
    return map[status] || status;
}

function carregarListaTarefas(filtro = 'todos') {
    const tbody = document.getElementById('tabela-tarefas');
    if (!tbody) return;

    let tarefas = getTarefas();

    if (filtro !== 'todos') {
        tarefas = tarefas.filter(t => t.status === filtro);
    }

    tbody.innerHTML = '';

    if (tarefas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">
            Nenhuma tarefa encontrada.
        </td></tr>`;
        return;
    }

    tarefas.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(t.titulo)}</td>
            <td>${escapeHtml(t.descricao || '-')}</td>
            <td><span class="badge badge-status ${getBadgeClass(t.status)}">${formatarStatus(t.status)}</span></td>
            <td>${t.dataVencimento || '-'}</td>
            <td class="text-nowrap">
                <button class="btn btn-success btn-action concluir-btn" aria-label="Marcar como concluída" title="Concluir">
                    <i class="bi bi-check-lg"></i>
                </button>
                <button class="btn btn-warning btn-action editar-btn" aria-label="Editar tarefa" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-danger btn-action excluir-btn" aria-label="Excluir tarefa" title="Excluir">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;

        tr.querySelector('.concluir-btn').addEventListener('click', () => marcarComoConcluida(t.id));
        tr.querySelector('.editar-btn').addEventListener('click', () => editarTarefa(t.id));
        tr.querySelector('.excluir-btn').addEventListener('click', () => deletarTarefa(t.id));

        tbody.appendChild(tr);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function mostrarEstatisticas() {
    const elTotal = document.getElementById('total-tarefas');
    const elConcluidas = document.getElementById('concluidas');
    const elPendentes = document.getElementById('pendentes');
    if (!elTotal) return;

    const tarefas = getTarefas();
    const total = tarefas.length;
    const concluidas = tarefas.filter(t => t.status === 'concluida').length;
    const pendentes = total - concluidas;

    elTotal.textContent = total;
    elConcluidas.textContent = concluidas;
    elPendentes.textContent = pendentes;
}

function atualizarHeaderUsuario() {
    const usuario = getUsuarioLogado();
    const userDiv = document.getElementById('user-info');
    if (!userDiv) return;

    if (usuario) {
        userDiv.innerHTML = `
            <span class="text-white me-2">Olá, <strong>${escapeHtml(usuario.nome)}</strong>!</span>
            <button class="btn btn-outline-light btn-sm" onclick="logout()" aria-label="Sair do sistema">Sair</button>
        `;
    }
}

// ======================
// INICIALIZAÇÃO
// ======================
document.addEventListener('DOMContentLoaded', () => {
    const paginaAtual = window.location.pathname.split('/').pop() || 'index.html';
    const paginasPublicas = ['login.html', 'cadastro.html'];

    // Proteção de rotas
    if (!paginasPublicas.includes(paginaAtual) && !isLogado()) {
        window.location.href = 'login.html';
        return;
    }

    // Se já logado e tenta acessar login/cadastro → redireciona
    if (paginasPublicas.includes(paginaAtual) && isLogado()) {
        window.location.href = 'index.html';
        return;
    }

    atualizarHeaderUsuario();

    // Página Home
    if (paginaAtual === 'index.html' || paginaAtual === '') {
        mostrarEstatisticas();
    }

    // Página de Tarefas + filtro
    if (paginaAtual === 'tarefas.html') {
        carregarListaTarefas();

        const filtroSelect = document.getElementById('filtro-status');
        if (filtroSelect) {
            filtroSelect.addEventListener('change', (e) => {
                carregarListaTarefas(e.target.value);
            });
        }
    }

    // Formulário de Cadastro
    const formCadastro = document.getElementById('form-cadastro');
    if (formCadastro) {
        formCadastro.addEventListener('submit', (e) => {
            e.preventDefault();
            const nome = document.getElementById('nome').value.trim();
            const email = document.getElementById('email').value.trim();
            const senha = document.getElementById('senha').value;

            if (nome && email && senha) {
                if (cadastrarUsuario(nome, email, senha)) {
                    alert("✅ Cadastro realizado com sucesso! Agora faça login.");
                    window.location.href = 'login.html';
                }
            } else {
                alert("❌ Preencha todos os campos!");
            }
        });
    }

    // Formulário de Login
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email-login').value.trim();
            const senha = document.getElementById('senha-login').value;

            if (login(email, senha)) {
                window.location.href = 'index.html';
            } else {
                alert("❌ E-mail ou senha incorretos!");
            }
        });
    }

    // Formulário Nova Tarefa / Edição
    const formNovaTarefa = document.getElementById('form-nova-tarefa');
    if (formNovaTarefa) {
        const idEdicao = localStorage.getItem('tarefaEmEdicao');
        const tituloForm = document.getElementById('titulo-form');
        const btnSubmit = document.getElementById('btn-submit');

        // Se estiver editando, preenche o formulário
        if (idEdicao) {
            const tarefa = getTodasTarefas().find(t => t.id == idEdicao);
            if (tarefa) {
                document.getElementById('titulo').value = tarefa.titulo;
                document.getElementById('descricao').value = tarefa.descricao || '';
                document.getElementById('status').value = tarefa.status;
                document.getElementById('dataVencimento').value = tarefa.dataVencimento;
                if (tituloForm) tituloForm.textContent = 'Editar Tarefa';
                if (btnSubmit) btnSubmit.textContent = 'Atualizar Tarefa';
            }
        }

        formNovaTarefa.addEventListener('submit', (e) => {
            e.preventDefault();

            const dados = {
                titulo: document.getElementById('titulo').value.trim(),
                descricao: document.getElementById('descricao').value.trim(),
                status: document.getElementById('status').value,
                dataVencimento: document.getElementById('dataVencimento').value
            };

            if (!dados.titulo || !dados.dataVencimento) {
                alert("❌ Título e data de vencimento são obrigatórios.");
                return;
            }

            if (idEdicao) {
                atualizarTarefa(parseInt(idEdicao), dados);
                localStorage.removeItem('tarefaEmEdicao');
                alert("✅ Tarefa atualizada com sucesso!");
            } else {
                adicionarTarefa(dados);
                alert("✅ Tarefa adicionada com sucesso!");
            }

            window.location.href = 'tarefas.html';
        });
    }

    // Formulário de Contato (simulado)
    const formContato = document.getElementById('form-contato');
    if (formContato) {
        formContato.addEventListener('submit', (e) => {
            e.preventDefault();
            alert("✅ Mensagem enviada com sucesso! Em breve entraremos em contato.");
            formContato.reset();
        });
    }
});
