// ============ ARMAZENAMENTO ============
const CHAVE_PRODUTOS = 'loja_produtos';
const CHAVE_PEDIDOS = 'loja_pedidos';
const CHAVE_CARRINHO = 'loja_carrinho';

// Inicializar com dados de exemplo
function inicializarDados() {
    if (!localStorage.getItem(CHAVE_PRODUTOS)) {
        const produtosExemplo = [
            { id: 1, nome: 'Notebook Dell', preco: 3500.00, estoque: 5 },
            { id: 2, nome: 'Mouse Logitech', preco: 89.90, estoque: 20 },
            { id: 3, nome: 'Teclado Mecânico', preco: 450.00, estoque: 8 }
        ];
        localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(produtosExemplo));
    }
}

// ============ CARRINHO ============
function obterCarrinho() {
    return JSON.parse(localStorage.getItem(CHAVE_CARRINHO) || '[]');
}

function salvarCarrinho(carrinho) {
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho));
    atualizarExibicaoLoja();
}

function adicionarAoCarrinho(produtoId) {
    const carrinho = obterCarrinho();
    const produto = obterProduto(produtoId);

    if (!produto || produto.estoque <= 0) {
        mostrarMensagem('loja', 'Produto fora de estoque', 'error');
        return;
    }

    const itemExistente = carrinho.find(item => item.id === produtoId);
    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({
            id: produtoId,
            nome: produto.nome,
            preco: produto.preco,
            quantidade: 1
        });
    }

    salvarCarrinho(carrinho);
}

function removerDoCarrinho(produtoId) {
    let carrinho = obterCarrinho();
    carrinho = carrinho.filter(item => item.id !== produtoId);
    salvarCarrinho(carrinho);
}

// ============ PRODUTOS ============
function obterProdutos() {
    return JSON.parse(localStorage.getItem(CHAVE_PRODUTOS) || '[]');
}

function obterProduto(id) {
    return obterProdutos().find(p => p.id === id);
}

function adicionarProduto() {
    const nome = document.getElementById('nome-produto').value.trim();
    const preco = parseFloat(document.getElementById('preco-produto').value);
    const estoque = parseInt(document.getElementById('estoque-produto').value);

    if (!nome || isNaN(preco) || isNaN(estoque)) {
        alert('Preencha todos os campos corretamente');
        return;
    }

    const produtos = obterProdutos();
    const novoId = Math.max(...produtos.map(p => p.id), 0) + 1;

    produtos.push({
        id: novoId,
        nome,
        preco,
        estoque
    });

    localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(produtos));
    document.getElementById('nome-produto').value = '';
    document.getElementById('preco-produto').value = '';
}

function deletarProduto(id) {
    if (confirm('Tem certeza que deseja deletar este produto?')) {
        let produtos = obterProdutos();
        produtos = produtos.filter(p => p.id !== id);
        localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(produtos));
    }
}

// ============ PEDIDOS ============
function obterPedidos() {
    return JSON.parse(localStorage.getItem(CHAVE_PEDIDOS) || '[]');
}

function criarPedido(dados) {
    const carrinho = obterCarrinho();
    const pedidos = obterPedidos();
    const total = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);

    const novoPedido = {
        id: 'PED' + Date.now(),
        numero: pedidos.length + 1,
        cliente: dados.nome,
        email: dados.email,
        telefone: dados.tel,
        endereco: dados.endereco,
        pagamento: dados.pagamento,
        itens: carrinho,
        total: total,
        data: new Date().toLocaleDateString('pt-BR'),
        status: 'Pendente de Pagamento'
    };

    // Atualizar estoque
    const produtos = obterProdutos();
    carrinho.forEach(carrinhoItem => {
        const produto = produtos.find(p => p.id === carrinhoItem.id);
        if (produto) {
            produto.estoque -= carrinhoItem.quantidade;
        }
    });
    
    localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(produtos));
    pedidos.push(novoPedido);
    localStorage.setItem(CHAVE_PEDIDOS, JSON.stringify(pedidos));
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify([]));

    return novoPedido;
}

// ============ EXIBIÇÃO ============
function atualizarExibicaoLoja() {
    const produtos = obterProdutos();
    const grid = document.getElementById('produtos-grid');

    grid.innerHTML = produtos.map(p => `
        <div class="product-card">
            <div class="product-name">${p.nome}</div>
            <div class="product-price">R$ ${p.preco.toFixed(2)}</div>
            <div>Estoque: ${p.estoque}</div>
            <button onclick="adicionarAoCarrinho(${p.id})">🛒 Adicionar</button>
        </div>
    `).join('');
}

// ============ CHECKOUT ============
function irParaCheckout() {
    const carrinho = obterCarrinho();
    if (carrinho.length === 0) {
        alert('Carrinho vazio');
        return;
    }
    document.getElementById('checkout-modal').style.display = 'block';
}

function cancelarCheckout() {
    document.getElementById('checkout-modal').style.display = 'none';
}

// ============ NAVEGAÇÃO ============
function mudarAba(tab) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tab).classList.add('active');
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
}

// ============ INICIALIZAÇÃO ============
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => mudarAba(btn.dataset.tab));
});

// ============ SINCRONIZAR ENTRE ABAS ============
window.addEventListener('storage', function(e) {
    if (e.key === CHAVE_PRODUTOS || e.key === CHAVE_CARRINHO || e.key === CHAVE_PEDIDOS) {
        console.log('Sincronizando dados de outra aba...');
        atualizarExibicaoLoja();
        atualizarExibicaoAdmin();
        atualizarExibicaoPedidos();
    }
});

// Notificar outras abas quando há mudanças
function notificarOutrasAbas() {
    window.dispatchEvent(new Event('storage'));
}





function salvarCarrinho(carrinho) {
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho));
    atualizarExibicaoLoja();
    notificarOutrasAbas();
}

function salvarProdutos(produtos) {
    localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(produtos));
    atualizarExibicaoAdmin();
    atualizarExibicaoLoja();
    notificarOutrasAbas();
}

function salvarPedidos(pedidos) {
    localStorage.setItem(CHAVE_PEDIDOS, JSON.stringify(pedidos));
    notificarOutrasAbas();
}

inicializarDados();
atualizarExibicaoLoja();