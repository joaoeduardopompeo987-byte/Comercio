/* ==================== CONFIG ==================== */
const SENHA_ADMIN = "admin123";

/* ==================== ESTADO / PERSISTÊNCIA ==================== */
function carregar(chave, padrao){
  try{
    const v = localStorage.getItem(chave);
    return v ? JSON.parse(v) : padrao;
  }catch(e){ return padrao; }
}
function salvar(chave, valor){
  localStorage.setItem(chave, JSON.stringify(valor));
}

let produtos = carregar('lv_produtos', null);
if(!produtos){
  produtos = [
    {id:1, nome:"Tênis Esportivo", descricao:"Confortável para o dia a dia", preco:249.90, estoque:12, emoji:"👟"},
    {id:2, nome:"Mochila Urbana", descricao:"Resistente e com vários bolsos", preco:159.90, estoque:8, emoji:"🎒"},
    {id:3, nome:"Fone Bluetooth", descricao:"Som de alta qualidade sem fio", preco:129.90, estoque:0, emoji:"🎧"},
    {id:4, nome:"Relógio Digital", descricao:"À prova d'água, vários modos", preco:89.90, estoque:20, emoji:"⌚"},
  ];
  salvar('lv_produtos', produtos);
}

let pedidos = carregar('lv_pedidos', []);
let contas = carregar('lv_contas', []);
let carrinho = carregar('lv_carrinho', []);

let clienteLogado = carregar('lv_sessao_cliente', null); // {id,nome,email}
let adminLogado = carregar('lv_sessao_admin', false);

let abaAdminAtiva = 'produtos';
let modoModal = 'login'; // login ou cadastro (aba admin embutida)

/* ==================== UTILS ==================== */
function gerarId(){ return Date.now() + Math.floor(Math.random()*1000); }
function formatarPreco(v){ return "R$ " + Number(v).toFixed(2).replace('.', ','); }
function mostrarToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('mostrar');
  setTimeout(()=> t.classList.remove('mostrar'), 2600);
}
function abrirModal(id){ document.getElementById(id).classList.add('aberto'); }
function fecharModal(id){ document.getElementById(id).classList.remove('aberto'); limparErros(); }
function limparErros(){
  document.querySelectorAll('.erro-msg').forEach(e=>{e.classList.remove('mostrar'); e.textContent='';});
}
function mostrarErro(id, msg){
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add('mostrar');
}

/* ==================== NAVEGAÇÃO DE ABAS ==================== */
document.querySelectorAll('.aba-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.aba-btn').forEach(b=>b.classList.remove('ativo'));
    document.querySelectorAll('.secao').forEach(s=>s.classList.remove('ativa'));
    btn.classList.add('ativo');
    document.getElementById('secao-' + btn.dataset.aba).classList.add('ativa');
    if(btn.dataset.aba === 'pedidos') renderizarPedidos();
    if(btn.dataset.aba === 'admin') renderizarAdmin();
  });
});

/* ==================== ÁREA DE CONTA (topo) ==================== */
function renderizarAreaConta(){
  const area = document.getElementById('areaConta');
  if(clienteLogado){
    area.innerHTML = `
      <span class="ola">Olá, <b>${escapeHtml(clienteLogado.nome.split(' ')[0])}</b></span>
      <button class="btn btn-outline btn-sm" onclick="sairCliente()">Sair</button>
    `;
  }else{
    area.innerHTML = `
      <button class="btn btn-primario" onclick="abrirLoginCliente()">Entrar</button>
      <button class="btn btn-secundario" onclick="abrirCadastroCliente()">Criar conta</button>
    `;
  }
}
function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function abrirLoginCliente(){ limparErros(); abrirModal('overlayLogin'); }
function abrirCadastroCliente(){ limparErros(); abrirModal('overlayCadastro'); }
function trocarParaCadastro(){ fecharModal('overlayLogin'); abrirCadastroCliente(); }
function trocarParaLogin(){ fecharModal('overlayCadastro'); abrirLoginCliente(); }

function fazerLoginCliente(){
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const senha = document.getElementById('loginSenha').value;
  if(!email || !senha){
    mostrarErro('erroLogin', 'Preencha e-mail e senha.');
    return;
  }
  const conta = contas.find(c => c.email.toLowerCase() === email && c.senha === senha);
  if(!conta){
    mostrarErro('erroLogin', 'E-mail ou senha incorretos.');
    return;
  }
  clienteLogado = {id: conta.id, nome: conta.nome, email: conta.email};
  salvar('lv_sessao_cliente', clienteLogado);
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginSenha').value = '';
  fecharModal('overlayLogin');
  renderizarAreaConta();
  mostrarToast('Login realizado com sucesso! 👋');
}

function criarConta(){
  const nome = document.getElementById('cadNome').value.trim();
  const email = document.getElementById('cadEmail').value.trim().toLowerCase();
  const senha = document.getElementById('cadSenha').value;
  if(!nome || !email || !senha){
    mostrarErro('erroCadastro', 'Preencha todos os campos.');
    return;
  }
  if(senha.length < 4){
    mostrarErro('erroCadastro', 'A senha deve ter no mínimo 4 caracteres.');
    return;
  }
  if(contas.some(c => c.email.toLowerCase() === email)){
    mostrarErro('erroCadastro', 'Já existe uma conta com este e-mail.');
    return;
  }
  const novaConta = {
    id: gerarId(),
    nome, email, senha,
    dataCadastro: new Date().toISOString()
  };
  contas.push(novaConta);
  salvar('lv_contas', contas);

  clienteLogado = {id: novaConta.id, nome: novaConta.nome, email: novaConta.email};
  salvar('lv_sessao_cliente', clienteLogado);

  document.getElementById('cadNome').value = '';
  document.getElementById('cadEmail').value = '';
  document.getElementById('cadSenha').value = '';
  fecharModal('overlayCadastro');
  renderizarAreaConta();
  mostrarToast('Conta criada com sucesso! 🎉');
  if(document.getElementById('secao-admin').classList.contains('ativa')) renderizarAdmin();
}

function sairCliente(){
  clienteLogado = null;
  localStorage.removeItem('lv_sessao_cliente');
  renderizarAreaConta();
  renderizarPedidos();
  mostrarToast('Você saiu da sua conta.');
}

/* ==================== LOJA / PRODUTOS ==================== */
function renderizarLoja(){
  const grid = document.getElementById('gridProdutos');
  if(produtos.length === 0){
    grid.innerHTML = `<div class="vazio" style="grid-column:1/-1;"><div class="emoji">📦</div>Nenhum produto cadastrado ainda.</div>`;
    return;
  }
  grid.innerHTML = produtos.map(p => {
    let estoqueClasse = '';
    let estoqueTxt = `${p.estoque} em estoque`;
    if(p.estoque === 0){ estoqueClasse='zero'; estoqueTxt='Fora de estoque'; }
    else if(p.estoque <= 3){ estoqueClasse='baixo'; estoqueTxt=`Últimas ${p.estoque} unidades`; }
    return `
      <div class="card-produto">
        <div class="imagem">${p.emoji || '📦'}</div>
        <div class="info">
          <div class="nome">${escapeHtml(p.nome)}</div>
          <div class="desc">${escapeHtml(p.descricao || '')}</div>
          <div class="preco">${formatarPreco(p.preco)}</div>
          <div class="estoque ${estoqueClasse}">${estoqueTxt}</div>
          <button class="btn btn-primario btn-full" ${p.estoque===0?'disabled style="opacity:.5;cursor:not-allowed;"':''}
            onclick="adicionarAoCarrinho(${p.id})">
            ${p.estoque===0 ? 'Indisponível' : '🛒 Adicionar'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/* ==================== CARRINHO ==================== */
function adicionarAoCarrinho(produtoId){
  const produto = produtos.find(p => p.id === produtoId);
  if(!produto || produto.estoque === 0) return;
  const item = carrinho.find(i => i.produtoId === produtoId);
  const qtdAtualCarrinho = item ? item.qtd : 0;
  if(qtdAtualCarrinho + 1 > produto.estoque){
    mostrarToast('Quantidade máxima em estoque atingida.');
    return;
  }
  if(item){ item.qtd += 1; }
  else{ carrinho.push({produtoId, qtd:1}); }
  salvar('lv_carrinho', carrinho);
  atualizarBadgeCarrinho();
  mostrarToast(`${produto.nome} adicionado ao carrinho`);
}

function atualizarBadgeCarrinho(){
  const total = carrinho.reduce((s,i)=>s+i.qtd,0);
  document.getElementById('badgeCarrinho').textContent = total;
}

function abrirCarrinho(){
  renderizarCarrinhoModal();
  abrirModal('overlayCarrinho');
}

function renderizarCarrinhoModal(){
  const cont = document.getElementById('itensCarrinhoModal');
  const vazioMsg = document.getElementById('carrinhoVazioMsg');
  const totalEl = document.getElementById('totalCarrinho');
  const btnFinalizar = document.getElementById('btnFinalizarCompra');

  if(carrinho.length === 0){
    cont.innerHTML = '';
    vazioMsg.style.display = 'block';
    totalEl.innerHTML = '';
    btnFinalizar.style.display = 'none';
    return;
  }
  vazioMsg.style.display = 'none';
  btnFinalizar.style.display = 'block';

  let total = 0;
  cont.innerHTML = carrinho.map(item => {
    const produto = produtos.find(p => p.id === item.produtoId);
    if(!produto) return '';
    const subtotal = produto.preco * item.qtd;
    total += subtotal;
    return `
      <div class="item-carrinho">
        <div class="info-item">
          <div class="nome-item">${produto.emoji || ''} ${escapeHtml(produto.nome)}</div>
          <div class="preco-item">${formatarPreco(produto.preco)} un.</div>
        </div>
        <div class="qtd-control">
          <button onclick="alterarQtdCarrinho(${produto.id}, -1)">−</button>
          <span>${item.qtd}</span>
          <button onclick="alterarQtdCarrinho(${produto.id}, 1)">+</button>
        </div>
      </div>
    `;
  }).join('');
  totalEl.innerHTML = `<span>Total</span><span>${formatarPreco(total)}</span>`;
}

function alterarQtdCarrinho(produtoId, delta){
  const item = carrinho.find(i => i.produtoId === produtoId);
  const produto = produtos.find(p => p.id === produtoId);
  if(!item || !produto) return;
  const novaQtd = item.qtd + delta;
  if(novaQtd <= 0){
    carrinho = carrinho.filter(i => i.produtoId !== produtoId);
  }else if(novaQtd > produto.estoque){
    mostrarToast('Quantidade máxima em estoque atingida.');
    return;
  }else{
    item.qtd = novaQtd;
  }
  salvar('lv_carrinho', carrinho);
  atualizarBadgeCarrinho();
  renderizarCarrinhoModal();
}

function calcularTotalCarrinho(){
  return carrinho.reduce((soma, item) => {
    const p = produtos.find(pr => pr.id === item.produtoId);
    return soma + (p ? p.preco * item.qtd : 0);
  }, 0);
}

/* ==================== PAGAMENTO / CHECKOUT ==================== */
function irParaPagamento(){
  if(carrinho.length === 0) return;
  fecharModal('overlayCarrinho');

  const resumo = document.getElementById('resumoPedidoPagamento');
  let linhas = '';
  carrinho.forEach(item => {
    const p = produtos.find(pr => pr.id === item.produtoId);
    if(!p) return;
    linhas += `<div class="linha"><span>${item.qtd}x ${escapeHtml(p.nome)}</span><span>${formatarPreco(p.preco*item.qtd)}</span></div>`;
  });
  const total = calcularTotalCarrinho();
  linhas += `<div class="linha total"><span>Total</span><span>${formatarPreco(total)}</span></div>`;
  resumo.innerHTML = linhas;

  if(clienteLogado){
    document.getElementById('pagNome').value = clienteLogado.nome;
    document.getElementById('pagEmail').value = clienteLogado.email;
  }

  abrirModal('overlayPagamento');
}

function atualizarMetodoPag(){
  const metodo = document.querySelector('input[name="metodo"]:checked').value;
  document.getElementById('camposCartao').style.display = metodo === 'cartao' ? 'block' : 'none';
  document.getElementById('campoPix').style.display = metodo === 'pix' ? 'block' : 'none';
}
function mascaraCep(input){
  let v = input.value.replace(/\D/g,'').slice(0,8);
  if(v.length > 5) v = v.slice(0,5) + '-' + v.slice(5);
  input.value = v;
}
atualizarMetodoPag();

function confirmarPagamento(){
  const nome = document.getElementById('pagNome').value.trim();
  const email = document.getElementById('pagEmail').value.trim();
  const cep = document.getElementById('pagCep').value.trim();
  const metodo = document.querySelector('input[name="metodo"]:checked').value;

  if(!nome || !email){
    mostrarErro('erroPagamento', 'Preencha nome e e-mail.');
    return;
  }
  if(!cep || cep.replace(/\D/g,'').length !== 8){
    mostrarErro('erroPagamento', 'Informe um CEP válido (8 dígitos).');
    return;
  }
  if(metodo === 'cartao'){
    const num = document.getElementById('cartaoNumero').value.trim();
    const val = document.getElementById('cartaoValidade').value.trim();
    const cvv = document.getElementById('cartaoCvv').value.trim();
    if(!num || !val || !cvv){
      mostrarErro('erroPagamento', 'Preencha os dados do cartão.');
      return;
    }
  }

  // valida estoque novamente
  for(const item of carrinho){
    const p = produtos.find(pr => pr.id === item.produtoId);
    if(!p || item.qtd > p.estoque){
      mostrarErro('erroPagamento', `Estoque insuficiente para ${p ? p.nome : 'um item'}.`);
      return;
    }
  }

  // baixa de estoque
  const itensPedido = carrinho.map(item => {
    const p = produtos.find(pr => pr.id === item.produtoId);
    p.estoque -= item.qtd;
    return {produtoId: p.id, nome: p.nome, qtd: item.qtd, preco: p.preco};
  });
  salvar('lv_produtos', produtos);

  const total = itensPedido.reduce((s,i)=> s + i.preco*i.qtd, 0);

  const novoPedido = {
    id: gerarId(),
    numero: 'PED-' + Math.floor(100000 + Math.random()*900000),
    data: new Date().toISOString(),
    clienteNome: nome,
    clienteEmail: email,
    clienteCep: cep,
    clienteContaId: clienteLogado ? clienteLogado.id : null,
    metodoPagamento: metodo,
    itens: itensPedido,
    total,
    status: 'Pago'
  };
  pedidos.push(novoPedido);
  salvar('lv_pedidos', pedidos);

  // limpa carrinho
  carrinho = [];
  salvar('lv_carrinho', carrinho);
  atualizarBadgeCarrinho();

  fecharModal('overlayPagamento');
  renderizarLoja();
  mostrarToast('Pagamento confirmado! Pedido ' + novoPedido.numero + ' registrado. ✅');

  // limpa formulário de cartão
  document.getElementById('cartaoNumero').value = '';
  document.getElementById('cartaoValidade').value = '';
  document.getElementById('cartaoCvv').value = '';
  document.getElementById('pagCep').value = '';
}

/* ==================== MEUS PEDIDOS ==================== */
function renderizarPedidos(){
  const cont = document.getElementById('listaPedidos');

  if(adminLogado){
    // admin vê todos os pedidos com detalhes
    if(pedidos.length === 0){
      cont.innerHTML = `<div class="vazio"><div class="emoji">📋</div>Nenhum pedido registrado ainda.</div>`;
      return;
    }
    cont.innerHTML = ordenarPedidosDesc(pedidos).map(ped => cardPedido(ped, true)).join('');
    return;
  }

  if(!clienteLogado){
    cont.innerHTML = `
      <div class="restrito">
        <div class="emoji">🔒</div>
        <div style="font-weight:700;margin-bottom:6px;">Acesso restrito</div>
        <div style="margin-bottom:16px;">Entre na sua conta para ver seus pedidos.</div>
        <button class="btn btn-primario" onclick="abrirLoginCliente()">Entrar</button>
      </div>
    `;
    return;
  }

  const meusPedidos = pedidos.filter(p => p.clienteContaId === clienteLogado.id);
  if(meusPedidos.length === 0){
    cont.innerHTML = `<div class="vazio"><div class="emoji">📋</div>Você ainda não fez nenhum pedido.</div>`;
    return;
  }
  cont.innerHTML = ordenarPedidosDesc(meusPedidos).map(ped => cardPedido(ped, false)).join('');
}

function ordenarPedidosDesc(lista){
  return [...lista].sort((a,b)=> new Date(b.data) - new Date(a.data));
}

function cardPedido(ped, comCliente){
  const data = new Date(ped.data).toLocaleString('pt-BR');
  return `
    <div class="pedido-card">
      <div class="pedido-cabecalho">
        <div>
          <div class="id">${ped.numero}</div>
          <div class="data">${data}${comCliente ? ' · ' + escapeHtml(ped.clienteNome) : ''}</div>
        </div>
        <span class="status-tag">${ped.status}</span>
      </div>
      <div class="pedido-corpo">
        ${ped.itens.length} item(ns) · Total: <b style="color:var(--preto)">${formatarPreco(ped.total)}</b>
      </div>
      <button class="btn btn-outline btn-sm" style="margin-top:10px;" onclick="verDetalhesPedido(${ped.id})">Ver detalhes</button>
    </div>
  `;
}

function verDetalhesPedido(pedId){
  const ped = pedidos.find(p => p.id === pedId);
  if(!ped) return;
  const data = new Date(ped.data).toLocaleString('pt-BR');
  const itensHtml = ped.itens.map(i => `
    <div class="linha"><span>${i.qtd}x ${escapeHtml(i.nome)}</span><span>${formatarPreco(i.preco*i.qtd)}</span></div>
  `).join('');
  document.getElementById('detalhesPedidoConteudo').innerHTML = `
    <div class="resumo-pedido" style="margin-top:10px;">
      <div class="linha"><span>Número</span><span>${ped.numero}</span></div>
      <div class="linha"><span>Data</span><span>${data}</span></div>
      <div class="linha"><span>Cliente</span><span>${escapeHtml(ped.clienteNome)}</span></div>
      <div class="linha"><span>E-mail</span><span>${escapeHtml(ped.clienteEmail)}</span></div>
      <div class="linha"><span>CEP</span><span>${escapeHtml(ped.clienteCep || '-')}</span></div>
      <div class="linha"><span>Pagamento</span><span>${rotuloMetodo(ped.metodoPagamento)}</span></div>
      <div class="linha"><span>Status</span><span>${ped.status}</span></div>
      <div style="border-top:1px solid var(--cinza-borda);margin:10px 0;"></div>
      ${itensHtml}
      <div class="linha total"><span>Total</span><span>${formatarPreco(ped.total)}</span></div>
    </div>
  `;
  abrirModal('overlayDetalhesPedido');
}
function rotuloMetodo(m){
  return {pix:'💠 Pix', cartao:'💳 Cartão'}[m] || m;
}

/* ==================== ADMINISTRAÇÃO ==================== */
function renderizarAdmin(){
  const cont = document.getElementById('adminConteudo');
  if(!adminLogado){
    cont.innerHTML = `
      <div class="login-box">
        <div class="icone">🔐</div>
        <h2>Área restrita</h2>
        <div class="sub">Digite a senha de administrador para continuar</div>
        <div class="erro-msg" id="erroAdmin"></div>
        <div class="campo" style="text-align:left;">
          <label>Senha</label>
          <input type="password" id="senhaAdminInput" placeholder="Senha de administrador" onkeydown="if(event.key==='Enter') loginAdmin()">
        </div>
        <button class="btn btn-primario btn-full" onclick="loginAdmin()">Entrar</button>
      </div>
    `;
    return;
  }

  cont.innerHTML = `
    <div class="admin-topbar">
      <h1>Administração</h1>
      <button class="btn btn-outline btn-sm" onclick="logoutAdmin()">Sair</button>
    </div>
    <div class="admin-abas">
      <button class="${abaAdminAtiva==='produtos'?'ativo':''}" onclick="mudarAbaAdmin('produtos')">📦 Produtos</button>
      <button class="${abaAdminAtiva==='pedidos'?'ativo':''}" onclick="mudarAbaAdmin('pedidos')">📋 Pedidos</button>
      <button class="${abaAdminAtiva==='contas'?'ativo':''}" onclick="mudarAbaAdmin('contas')">👥 Contas cadastradas</button>
    </div>
    <div id="adminSubConteudo"></div>
  `;
  renderizarSubAbaAdmin();
}

function mudarAbaAdmin(aba){
  abaAdminAtiva = aba;
  renderizarAdmin();
}

function renderizarSubAbaAdmin(){
  const cont = document.getElementById('adminSubConteudo');
  if(abaAdminAtiva === 'produtos'){
    cont.innerHTML = `
      <div style="margin-bottom:14px;text-align:right;">
        <button class="btn btn-primario" onclick="abrirModalNovoProduto()">+ Novo produto</button>
      </div>
      <div class="tabela-wrap">
        <table>
          <thead><tr><th></th><th>Nome</th><th>Preço</th><th>Estoque</th><th>Ações</th></tr></thead>
          <tbody>
            ${produtos.map(p => `
              <tr>
                <td style="font-size:20px;">${p.emoji || '📦'}</td>
                <td>${escapeHtml(p.nome)}</td>
                <td>${formatarPreco(p.preco)}</td>
                <td>${p.estoque}</td>
                <td class="acoes-tabela">
                  <button class="btn btn-outline btn-sm" onclick="editarProduto(${p.id})">Editar</button>
                  <button class="btn btn-perigo btn-sm" onclick="excluirProduto(${p.id})">Excluir</button>
                </td>
              </tr>
            `).join('') || `<tr><td colspan="5" style="text-align:center;color:var(--cinza-texto);">Nenhum produto cadastrado.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  } else if(abaAdminAtiva === 'pedidos'){
    if(pedidos.length === 0){
      cont.innerHTML = `<div class="vazio"><div class="emoji">📋</div>Nenhum pedido registrado ainda.</div>`;
      return;
    }
    cont.innerHTML = ordenarPedidosDesc(pedidos).map(ped => cardPedido(ped, true)).join('');
  } else if(abaAdminAtiva === 'contas'){
    if(contas.length === 0){
      cont.innerHTML = `<div class="vazio"><div class="emoji">👥</div>Nenhuma conta cadastrada ainda.</div>`;
      return;
    }
    cont.innerHTML = `
      <div class="tabela-wrap">
        <table>
          <thead><tr><th>Nome</th><th>E-mail</th><th>Cadastrado em</th><th>Pedidos</th></tr></thead>
          <tbody>
            ${[...contas].sort((a,b)=> new Date(b.dataCadastro) - new Date(a.dataCadastro)).map(c => {
              const qtdPedidos = pedidos.filter(p => p.clienteContaId === c.id).length;
              return `
                <tr>
                  <td>${escapeHtml(c.nome)}</td>
                  <td>${escapeHtml(c.email)}</td>
                  <td>${new Date(c.dataCadastro).toLocaleDateString('pt-BR')}</td>
                  <td>${qtdPedidos}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}

function loginAdmin(){
  const senha = document.getElementById('senhaAdminInput').value;
  if(senha === SENHA_ADMIN){
    adminLogado = true;
    salvar('lv_sessao_admin', true);
    abaAdminAtiva = 'produtos';
    renderizarAdmin();
    if(document.getElementById('secao-pedidos').classList.contains('ativa')) renderizarPedidos();
    mostrarToast('Bem-vindo(a) à administração! 🔐');
  }else{
    mostrarErro('erroAdmin', 'Senha incorreta.');
  }
}

function logoutAdmin(){
  adminLogado = false;
  localStorage.removeItem('lv_sessao_admin');
  renderizarAdmin();
  if(document.getElementById('secao-pedidos').classList.contains('ativa')) renderizarPedidos();
  mostrarToast('Você saiu da administração.');
}

/* ---- CRUD Produtos ---- */
function abrirModalNovoProduto(){
  document.getElementById('tituloModalProduto').textContent = 'Novo produto';
  document.getElementById('produtoId').value = '';
  document.getElementById('produtoNome').value = '';
  document.getElementById('produtoDesc').value = '';
  document.getElementById('produtoPreco').value = '';
  document.getElementById('produtoEstoque').value = '';
  document.getElementById('produtoEmoji').value = '';
  limparErros();
  abrirModal('overlayProduto');
}

function editarProduto(id){
  const p = produtos.find(pr => pr.id === id);
  if(!p) return;
  document.getElementById('tituloModalProduto').textContent = 'Editar produto';
  document.getElementById('produtoId').value = p.id;
  document.getElementById('produtoNome').value = p.nome;
  document.getElementById('produtoDesc').value = p.descricao || '';
  document.getElementById('produtoPreco').value = p.preco;
  document.getElementById('produtoEstoque').value = p.estoque;
  document.getElementById('produtoEmoji').value = p.emoji || '';
  limparErros();
  abrirModal('overlayProduto');
}

function salvarProduto(){
  const id = document.getElementById('produtoId').value;
  const nome = document.getElementById('produtoNome').value.trim();
  const descricao = document.getElementById('produtoDesc').value.trim();
  const preco = parseFloat(document.getElementById('produtoPreco').value);
  const estoque = parseInt(document.getElementById('produtoEstoque').value);
  const emoji = document.getElementById('produtoEmoji').value.trim() || '📦';

  if(!nome || isNaN(preco) || preco < 0 || isNaN(estoque) || estoque < 0){
    mostrarErro('erroProduto', 'Preencha nome, preço e estoque corretamente.');
    return;
  }

  if(id){
    const p = produtos.find(pr => pr.id === parseInt(id));
    p.nome = nome; p.descricao = descricao; p.preco = preco; p.estoque = estoque; p.emoji = emoji;
    mostrarToast('Produto atualizado com sucesso!');
  }else{
    produtos.push({id: gerarId(), nome, descricao, preco, estoque, emoji});
    mostrarToast('Produto cadastrado com sucesso!');
  }
  salvar('lv_produtos', produtos);
  fecharModal('overlayProduto');
  renderizarSubAbaAdmin();
  renderizarLoja();
}

function excluirProduto(id){
  if(!confirm('Tem certeza que deseja excluir este produto?')) return;
  produtos = produtos.filter(p => p.id !== id);
  salvar('lv_produtos', produtos);
  renderizarSubAbaAdmin();
  renderizarLoja();
  mostrarToast('Produto excluído.');
}

/* ==================== INICIALIZAÇÃO ==================== */
function iniciar(){
  renderizarAreaConta();
  renderizarLoja();
  atualizarBadgeCarrinho();
}
iniciar();
