(function() {
    'use strict';

    // ============================================================
    // CONFIGURAÇÃO – Substitua pela sua URL real
    // ============================================================
    const API_URL = 'https://script.google.com/macros/s/AKfycbxQ0NMpOH4zOnYYd-QvQd3gORdlJMY1e-egwOuDbHQfFt_6kkNsttLmc-3vC1E-4Wc/exec';

    // ============================================================
    // SISTEMA DE CACHE
    // ============================================================
    const Cache = {
        data: {},
        timeout: 5 * 60 * 1000,

        async get(key, fetchFn) {
            const cached = this.data[key];
            if (cached && Date.now() - cached.timestamp < this.timeout) {
                console.log(`📦 Cache hit: ${key}`);
                return cached.data;
            }
            console.log(`🔄 Cache miss: ${key}`);
            const data = await fetchFn();
            this.data[key] = { data, timestamp: Date.now() };
            return data;
        },

        clear() {
            this.data = {};
            console.log('🗑️ Cache limpo');
        }
    };

    // ============================================================
    // FUNÇÃO DE SAUDAÇÃO
    // ============================================================
    function obterSaudacao() {
        const agora = new Date();
        const hora = agora.getHours();
        let saudacao;
        
        if (hora >= 5 && hora < 12) {
            saudacao = 'Bom dia';
        } else if (hora >= 12 && hora < 18) {
            saudacao = 'Boa tarde';
        } else {
            saudacao = 'Boa noite';
        }
        
        const horario = agora.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        return { saudacao, horario };
    }

    // ============================================================
    // NOTIFICAÇÕES TOAST
    // ============================================================
    function mostrarToast(mensagem, tipo = 'success') {
        const cores = {
            success: '#48bb78',
            error: '#e53e3e',
            warning: '#ed8936',
            info: '#4299e1'
        };
        const icones = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const toastAnterior = document.querySelector('.toast-notification');
        if (toastAnterior) toastAnterior.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: ${cores[tipo]}; color: white;
            padding: 15px 20px; border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000; animation: slideInRight 0.3s ease;
            max-width: 400px; display: flex; align-items: center; gap: 10px;
            font-weight: 500;
        `;
        toast.innerHTML = `
            <span style="font-size:20px;">${icones[tipo]}</span>
            <span>${mensagem}</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
        }, 4000);
    }

    // ============================================================
    // MODAL DE CONFIRMAÇÃO
    // ============================================================
    function confirmarAcao(mensagem, callback, textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar') {
        const modalAnterior = document.querySelector('.modal-confirmacao');
        if (modalAnterior) modalAnterior.remove();

        const overlay = document.createElement('div');
        overlay.className = 'modal-confirmacao';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
            z-index: 9999; animation: fadeIn 0.2s ease;
        `;
        overlay.innerHTML = `
            <div style="background:white; padding:30px; border-radius:12px; max-width:450px; box-shadow:0 10px 25px rgba(0,0,0,0.2); animation:scaleIn 0.2s ease;">
                <div style="text-align:center; margin-bottom:20px;">
                    <span style="font-size:48px;">⚠️</span>
                </div>
                <h3 style="margin:0 0 10px 0; color:#2d3748;">Confirmação</h3>
                <p style="color:#4a5568; margin:0 0 20px 0; line-height:1.5;">${mensagem}</p>
                <div style="display:flex; gap:10px; justify-content:flex-end;">
                    <button class="btn-cancelar" style="background:#e2e8f0; color:#4a5568; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:500;">
                        ${textoCancelar}
                    </button>
                    <button class="btn-confirmar" style="background:#e53e3e; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:500;">
                        ${textoConfirmar}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('.btn-confirmar').onclick = () => {
            overlay.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => { overlay.remove(); callback(); }, 200);
        };
        overlay.querySelector('.btn-cancelar').onclick = () => {
            overlay.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => overlay.remove(), 200);
        };
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.animation = 'fadeOut 0.2s ease';
                setTimeout(() => overlay.remove(), 200);
            }
        });
    }

    // ============================================================
    // CHAMADA API – APENAS GET (evita CORS)
    // ============================================================
    async function callAPI(action, data = null, useCache = true) {
        let url = `${API_URL}?action=${action}`;
        if (data) {
            const params = new URLSearchParams(data);
            url += `&${params.toString()}`;
        }

        const fetchFn = async () => {
            try {
                const response = await fetch(url, { method: 'GET' });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const result = await response.json();
                return result;
            } catch (error) {
                console.error(`❌ Erro na API (${action}):`, error);
                return { success: false, error: error.message };
            }
        };

        if (useCache && !data) {
            return await Cache.get(action, fetchFn);
        } else {
            return await fetchFn();
        }
    }

    // ============================================================
    // GERENCIADOR DE ESTADO
    // ============================================================
    const StateManager = {
        currentPage: 'home',
        filtroBusca: '',
        setPage(page) { this.currentPage = page; },
        getPage() { return this.currentPage; },
        setFiltro(filtro) { this.filtroBusca = filtro; },
        getFiltro() { return this.filtroBusca; }
    };

    // ============================================================
    // INICIALIZAÇÃO
    // ============================================================
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 Inicializando Sistema de Vendas...');
        adicionarEstilosCSS();
        inicializarNavegacao();
        renderHome();
        console.log('✅ Sistema inicializado com sucesso!');
    });

    // ============================================================
    // BLOQUEAR ZOOM
    // ============================================================
    function bloquearZoom() {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.appendChild(meta);

        const style = document.createElement('style');
        style.textContent = `
            * {
                touch-action: pan-x pan-y;
                -webkit-user-zoom: none;
                user-zoom: none;
            }
        `;
        document.head.appendChild(style);

        document.addEventListener('wheel', (e) => {
            if (e.ctrlKey) e.preventDefault();
        }, { passive: false });

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '_' || e.key === '0')) {
                e.preventDefault();
            }
        });

        document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

        let lastTouch = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouch <= 300) e.preventDefault();
            lastTouch = now;
        }, { passive: false });

        console.log('🔒 Zoom bloqueado');
    }

    document.addEventListener('DOMContentLoaded', bloquearZoom);

    function adicionarEstilosCSS() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
            @keyframes slideOutRight { from { transform: translateX(0); opacity:1; } to { transform: translateX(100%); opacity:0; } }
            @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
            @keyframes fadeOut { from { opacity:1; } to { opacity:0; } }
            @keyframes scaleIn { from { transform:scale(0.9); opacity:0; } to { transform:scale(1); opacity:1; } }
            @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
            @keyframes pulse { 0% { transform:scale(1); } 50% { transform:scale(1.05); } 100% { transform:scale(1); } }
            .loading-spinner { animation: spin 1s linear infinite; }
            .card-dashboard { transition: all 0.3s ease; }
            .card-dashboard:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,0.2); }
            .btn-primary { transition: all 0.2s ease; }
            .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
            .btn-primary:active { transform: translateY(0); }
            table tbody tr { transition: background 0.2s ease; }
            table tbody tr:hover { background: #f7fafc !important; }
            .produto-item { border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 10px; }
            .produto-item:last-child { border-bottom: none; margin-bottom: 0; }
            .valor-pago-container { transition: all 0.3s ease; }
            .valor-pago-container:focus-within { transform: scale(1.02); }
            .saudacao-card { 
                animation: slideInRight 0.5s ease;
                transition: all 0.3s ease;
            }
            .saudacao-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4) !important;
            }
            .btn-processing {
                animation: pulse 1.5s ease infinite;
            }
        `;
        document.head.appendChild(style);
    }

    function inicializarNavegacao() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const button = e.target.closest('.nav-btn');
                if (!button) return;
                navButtons.forEach(b => b.classList.remove('active'));
                button.classList.add('active');

                const pageMap = {
                    'home': renderHome,
                    'cadastro': renderCadastro,
                    'estoque': renderEstoque,
                    'vendas': renderVendas,
                    'clientes': renderClientes
                };
                const page = button.dataset.page;
                if (pageMap[page]) {
                    StateManager.setPage(page);
                    Cache.clear();
                    pageMap[page]();
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                const shortcuts = { '1': 'home', '2': 'cadastro', '3': 'estoque', '4': 'vendas', '5': 'clientes' };
                if (shortcuts[e.key]) {
                    e.preventDefault();
                    document.querySelector(`[data-page="${shortcuts[e.key]}"]`)?.click();
                }
            }
        });
    }

    // ============================================================
    // HOME / DASHBOARD
    // ============================================================
    async function renderHome() {
        const app = document.getElementById('app');
        if (!app) return;

        const { saudacao, horario } = obterSaudacao();

        app.innerHTML = `
            <section>
                <h2>🏠 Dashboard</h2>
                
                <!-- Saudação Personalizada -->
                <div class="saudacao-card" style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 25px 30px;
                    border-radius: 15px;
                    margin-bottom: 25px;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                ">
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="
                                background: rgba(255, 255, 255, 0.2);
                                border-radius: 50%;
                                width: 60px;
                                height: 60px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 30px;
                            ">
                                👸🏻
                            </div>
                            <div>
                                <p style="font-size: 16px; margin: 0; opacity: 0.9; font-weight: 300; letter-spacing: 0.5px;">
                                    ${saudacao},
                                </p>
                                <p style="font-size: 32px; margin: 5px 0 0 0; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">
                                    Usuário! 👋
                                </p>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="display: flex; align-items: center; gap: 10px; background: rgba(255, 255, 255, 0.15); padding: 15px 20px; border-radius: 12px; backdrop-filter: blur(10px);">
                                <span style="font-size: 28px;">🕐</span>
                                <div>
                                    <p style="font-size: 12px; margin: 0; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px;">Agora são</p>
                                    <p style="font-size: 28px; margin: 0; font-weight: 700; letter-spacing: 1px;">${horario}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="text-align:center; padding:40px;">
                    <div class="loading-spinner" style="font-size:32px;">⏳</div>
                    <p style="color:#667eea; margin-top:10px;">Carregando dados...</p>
                </div>
            </section>
        `;

        try {
            const [produtosResult, vendasResult] = await Promise.all([
                callAPI('listarProdutos', null, false),
                callAPI('listarVendas', null, false)
            ]);

            let totalProdutos = 0;
            let valorTotalEstoque = 0;
            let produtosBaixoEstoque = 0;
            let produtosEsgotados = 0;

            if (produtosResult.success && produtosResult.produtos) {
                totalProdutos = produtosResult.produtos.length;
                produtosResult.produtos.forEach(produto => {
                    const preco = parseFloat(produto.preco) || 0;
                    const quantidade = parseInt(produto.quantidade) || 0;
                    valorTotalEstoque += preco * quantidade;
                    if (quantidade === 0) produtosEsgotados++;
                    else if (quantidade <= 5) produtosBaixoEstoque++;
                });
            }

            let totalVendasHoje = 0;
            let totalVendasMes = 0;
            let totalVendasGeral = 0;
            const hoje = new Date();
            const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

            if (vendasResult.success && vendasResult.vendas) {
                vendasResult.vendas.forEach(venda => {
                    const dataVenda = new Date(venda.data);
                    const total = parseFloat(venda.total) || 0;
                    totalVendasGeral += total;
                    if (dataVenda.toDateString() === hoje.toDateString()) totalVendasHoje += total;
                    if (dataVenda >= inicioMes) totalVendasMes += total;
                });
            }

            // Gráfico simples (últimos 7 dias)
            let graficoHTML = '';
            if (vendasResult.success && vendasResult.vendas && vendasResult.vendas.length > 0) {
                const vendasPorDia = {};
                const ultimos7Dias = [];
                for (let i = 6; i >= 0; i--) {
                    const data = new Date(hoje);
                    data.setDate(data.getDate() - i);
                    const dataStr = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    ultimos7Dias.push(dataStr);
                    vendasPorDia[dataStr] = 0;
                }
                vendasResult.vendas.forEach(v => {
                    const dataVenda = new Date(v.data);
                    const dataStr = dataVenda.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    if (vendasPorDia[dataStr] !== undefined) vendasPorDia[dataStr] += parseFloat(v.total) || 0;
                });
                const valores = ultimos7Dias.map(d => vendasPorDia[d]);
                const maxValor = Math.max(...valores, 1);

                graficoHTML = `
                    <div style="margin-top:20px; background:white; padding:20px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                        <h3 style="margin:0 0 20px 0;">📊 Vendas dos Últimos 7 Dias</h3>
                        <div style="display:flex; align-items:flex-end; gap:8px; height:200px; padding:0 10px;">
                            ${ultimos7Dias.map((dia, i) => {
                                const altura = Math.max((valores[i] / maxValor) * 100, 1);
                                return `
                                    <div style="flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end;">
                                        <span style="font-size:10px; margin-bottom:5px; color:#667eea; font-weight:bold;">
                                            ${valores[i] > 0 ? 'R$ ' + valores[i].toFixed(0) : ''}
                                        </span>
                                        <div style="background:linear-gradient(180deg, #667eea, #764ba2); width:100%; height:${altura}%; border-radius:4px 4px 0 0; transition:all 0.3s ease; cursor:pointer;" 
                                             title="${dia}: R$ ${valores[i].toFixed(2)}"
                                             onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                                        </div>
                                        <span style="font-size:10px; margin-top:8px; color:#666;">${dia}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }

            app.innerHTML = `
                <section>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h2>🏠 Dashboard</h2>
                        <button onclick="window.atualizarDashboard()" class="btn-primary" style="background:#667eea; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:500;">
                            🔄 Atualizar
                        </button>
                    </div>

                    <!-- Saudação Personalizada -->
                    <div class="saudacao-card" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 25px 30px;
                        border-radius: 15px;
                        margin-bottom: 25px;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                    ">
                        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div style="
                                    background: rgba(255, 255, 255, 0.2);
                                    border-radius: 50%;
                                    width: 60px;
                                    height: 60px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 30px;
                                ">
                                    👸🏻
                                </div>
                                <div>
                                    <p style="font-size: 16px; margin: 0; opacity: 0.9; font-weight: 300; letter-spacing: 0.5px;">
                                        ${saudacao},
                                    </p>
                                    <p style="font-size: 32px; margin: 5px 0 0 0; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">
                                        Roberta! 👋
                                    </p>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="display: flex; align-items: center; gap: 10px; background: rgba(255, 255, 255, 0.15); padding: 15px 20px; border-radius: 12px; backdrop-filter: blur(10px);">
                                    <span style="font-size: 28px;">🕐</span>
                                    <div>
                                        <p style="font-size: 12px; margin: 0; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px;">Agora são</p>
                                        <p style="font-size: 28px; margin: 0; font-weight: 700; letter-spacing: 1px;">${horario}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px,1fr)); gap:20px; margin-top:20px;">
                        <div class="card-dashboard" style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white; padding:25px; border-radius:12px;">
                            <div style="display:flex; justify-content:space-between; align-items:start;">
                                <div>
                                    <h3 style="margin:0 0 10px 0; font-size:14px; opacity:0.9;">📦 Total Produtos</h3>
                                    <p style="font-size:36px; font-weight:bold; margin:0;">${totalProdutos}</p>
                                </div>
                                <span style="font-size:32px; opacity:0.5;">📦</span>
                            </div>
                            <small style="opacity:0.8;">Produtos cadastrados</small>
                        </div>

                        <div class="card-dashboard" style="background:linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color:white; padding:25px; border-radius:12px;">
                            <div style="display:flex; justify-content:space-between; align-items:start;">
                                <div>
                                    <h3 style="margin:0 0 10px 0; font-size:14px; opacity:0.9;">💰 Estoque Total</h3>
                                    <p style="font-size:36px; font-weight:bold; margin:0;">R$ ${valorTotalEstoque.toFixed(2).replace('.', ',')}</p>
                                </div>
                                <span style="font-size:32px; opacity:0.5;">💰</span>
                            </div>
                            <small style="opacity:0.8;">Valor total em estoque</small>
                        </div>

                        <div class="card-dashboard" style="background:linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color:white; padding:25px; border-radius:12px;">
                            <div style="display:flex; justify-content:space-between; align-items:start;">
                                <div>
                                    <h3 style="margin:0 0 10px 0; font-size:14px; opacity:0.9;">💵 Vendas Hoje</h3>
                                    <p style="font-size:36px; font-weight:bold; margin:0;">R$ ${totalVendasHoje.toFixed(2).replace('.', ',')}</p>
                                </div>
                                <span style="font-size:32px; opacity:0.5;">💵</span>
                            </div>
                            <small style="opacity:0.8;">${hoje.toLocaleDateString('pt-BR')}</small>
                        </div>

                        <div class="card-dashboard" style="background:linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color:white; padding:25px; border-radius:12px;">
                            <div style="display:flex; justify-content:space-between; align-items:start;">
                                <div>
                                    <h3 style="margin:0 0 10px 0; font-size:14px; opacity:0.9;">📊 Vendas do Mês</h3>
                                    <p style="font-size:36px; font-weight:bold; margin:0;">R$ ${totalVendasMes.toFixed(2).replace('.', ',')}</p>
                                </div>
                                <span style="font-size:32px; opacity:0.5;">📊</span>
                            </div>
                            <small style="opacity:0.8;">Desde ${inicioMes.toLocaleDateString('pt-BR')}</small>
                        </div>
                    </div>

                    ${(produtosBaixoEstoque > 0 || produtosEsgotados > 0) ? `
                        <div style="margin-top:20px; display:grid; grid-template-columns:repeat(auto-fit, minmax(250px,1fr)); gap:15px;">
                            ${produtosBaixoEstoque > 0 ? `
                                <div style="padding:15px; background:#fff3cd; border:2px solid #ffc107; border-radius:8px; color:#856404;">
                                    <strong>⚠️ Atenção:</strong> ${produtosBaixoEstoque} produto(s) com estoque baixo (≤ 5 unidades)
                                </div>
                            ` : ''}
                            ${produtosEsgotados > 0 ? `
                                <div style="padding:15px; background:#f8d7da; border:2px solid #dc3545; border-radius:8px; color:#721c24;">
                                    <strong>🔴 Alerta:</strong> ${produtosEsgotados} produto(s) esgotado(s)
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}

                    ${graficoHTML}

                    <div style="margin-top:20px; padding:20px; background:white; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                        <h3 style="margin:0 0 15px 0;">📈 Resumo Geral</h3>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px,1fr)); gap:15px;">
                            <div>
                                <p style="color:#666; margin:0;">Total em Vendas</p>
                                <p style="font-size:24px; font-weight:bold; color:#667eea; margin:5px 0;">R$ ${totalVendasGeral.toFixed(2).replace('.', ',')}</p>
                            </div>
                            <div>
                                <p style="color:#666; margin:0;">Ticket Médio</p>
                                <p style="font-size:24px; font-weight:bold; color:#667eea; margin:5px 0;">R$ ${vendasResult.vendas && vendasResult.vendas.length > 0 ? (totalVendasGeral / vendasResult.vendas.length).toFixed(2).replace('.', ',') : '0,00'}</p>
                            </div>
                        </div>
                    </div>
                </section>
            `;

        } catch (error) {
            app.innerHTML = `
                <section>
                    <h2>🏠 Dashboard</h2>
                    <div style="text-align:center; padding:40px; color:#e53e3e;">
                        <p style="font-size:48px;">😕</p>
                        <p>❌ Erro ao carregar dados: ${error.message}</p>
                        <button onclick="window.renderHome()" class="btn-primary" style="background:#667eea; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; margin-top:10px;">
                            🔄 Tentar novamente
                        </button>
                    </div>
                </section>
            `;
        }
    }

    window.atualizarDashboard = function() {
        mostrarToast('Atualizando dashboard...', 'info');
        Cache.clear();
        renderHome();
    };

    // ============================================================
    // CADASTRO DE PRODUTOS (via GET)
    // ============================================================
    function renderCadastro() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <section>
                <h2>➕ Cadastrar Produto</h2>
                <div style="background:white; padding:30px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                    <form id="formCadastro">
                        <div style="margin-bottom:20px;">
                            <label style="display:block; margin-bottom:8px; color:#4a5568; font-weight:500;">Nome do Produto *</label>
                            <input type="text" id="nome" required style="width:100%; padding:12px; border:2px solid #e2e8f0; border-radius:6px;">
                        </div>
                        <div style="margin-bottom:20px;">
                            <label style="display:block; margin-bottom:8px; color:#4a5568; font-weight:500;">Preço (R$) *</label>
                            <input type="number" id="preco" step="0.01" required style="width:100%; padding:12px; border:2px solid #e2e8f0; border-radius:6px;">
                        </div>
                        <div style="margin-bottom:20px;">
                            <label style="display:block; margin-bottom:8px; color:#4a5568; font-weight:500;">Quantidade *</label>
                            <input type="number" id="quantidade" required style="width:100%; padding:12px; border:2px solid #e2e8f0; border-radius:6px;">
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button type="submit" class="btn-primary" style="background:#667eea; color:white; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-weight:500; flex:1;">
                                ✅ Cadastrar Produto
                            </button>
                            <button type="button" onclick="document.getElementById('formCadastro').reset(); document.getElementById('msg').innerHTML='';" style="background:#e2e8f0; color:#4a5568; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-weight:500;">
                                🗑️ Limpar
                            </button>
                        </div>
                    </form>
                    <div id="msg" style="margin-top:20px;"></div>
                </div>
            </section>
        `;
        document.getElementById('formCadastro').addEventListener('submit', cadastrarProduto);
    }

    async function cadastrarProduto(e) {
        e.preventDefault();
        const nome = document.getElementById('nome').value.trim();
        const preco = parseFloat(document.getElementById('preco').value);
        const quantidade = parseInt(document.getElementById('quantidade').value);
        const msg = document.getElementById('msg');

        if (!nome) {
            msg.innerHTML = '<div style="padding:12px;background:#fed7d7;color:#9b2c2c;border-radius:6px;">❌ Nome obrigatório</div>';
            return;
        }
        if (isNaN(preco) || preco <= 0) {
            msg.innerHTML = '<div style="padding:12px;background:#fed7d7;color:#9b2c2c;border-radius:6px;">❌ Preço inválido</div>';
            return;
        }
        if (isNaN(quantidade) || quantidade < 0) {
            msg.innerHTML = '<div style="padding:12px;background:#fed7d7;color:#9b2c2c;border-radius:6px;">❌ Quantidade inválida</div>';
            return;
        }

        const result = await callAPI('cadastrarProduto', { nome, preco, quantidade }, false);
        if (result.success) {
            msg.innerHTML = '<div style="padding:12px;background:#c6f6d5;color:#22543d;border-radius:6px;">✅ Produto cadastrado!</div>';
            mostrarToast(`Produto "${nome}" cadastrado!`, 'success');
            document.getElementById('formCadastro').reset();
            Cache.clear();
        } else {
            msg.innerHTML = `<div style="padding:12px;background:#fed7d7;color:#9b2c2c;border-radius:6px;">❌ ${result.error}</div>`;
        }
    }

    // ============================================================
    // ESTOQUE (exclusão via GET)
    // ============================================================
    async function renderEstoque() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <section>
                <h2>📦 Estoque</h2>
                <div style="text-align:center; padding:40px;">
                    <div class="loading-spinner" style="font-size:32px;">⏳</div>
                    <p style="color:#667eea;">Carregando produtos...</p>
                </div>
            </section>
        `;

        try {
            const result = await callAPI('listarProdutos');
            let html = '';
            if (result.success && result.produtos.length > 0) {
                result.produtos.forEach(p => {
                    const qtd = parseInt(p.quantidade) || 0;
                    const preco = parseFloat(p.preco) || 0;
                    const status = qtd === 0 ? '🔴' : qtd <= 5 ? '🟡' : '🟢';
                    const statusTexto = qtd === 0 ? 'Esgotado' : qtd <= 5 ? 'Baixo' : 'Normal';
                    html += `
                        <tr style="${qtd === 0 ? 'background:#fff5f5;' : ''}">
                            <td>${p.id}</td>
                            <td><strong>${p.nome}</strong></td>
                            <td>${status} ${qtd} <small style="color:#666;">(${statusTexto})</small></td>
                            <td>R$ ${preco.toFixed(2).replace('.', ',')}</td>
                            <td>R$ ${(preco * qtd).toFixed(2).replace('.', ',')}</td>
                            <td>
                                <button onclick="window.confirmarExclusaoProduto(${p.id}, '${p.nome.replace(/'/g, "\\'")}')"
                                        style="background:#e53e3e; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px;">
                                    🗑️ Excluir
                                </button>
                            </td>
                        </tr>
                    `;
                });
            } else {
                html = `<tr><td colspan="6" style="text-align:center; padding:40px;"><p style="font-size:48px;">📭</p><p style="color:#666;">Nenhum produto cadastrado</p></td></tr>`;
            }

            app.innerHTML = `
                <section>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h2>📦 Estoque</h2>
                        <button onclick="window.renderEstoque()" class="btn-primary" style="background:#667eea; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:500;">
                            🔄 Atualizar
                        </button>
                    </div>
                    <div style="margin-bottom:15px; display:flex; gap:15px; align-items:center; flex-wrap:wrap;">
                        <span style="font-size:14px;">🟢 Normal | 🟡 Baixo (≤5) | 🔴 Esgotado</span>
                    </div>
                    <div style="background:white; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1); overflow:hidden;">
                        <div style="overflow-x:auto;">
                            <table style="width:100%; border-collapse:collapse;">
                                <thead>
                                    <tr style="background:#f7fafc; border-bottom:2px solid #e2e8f0;">
                                        <th style="padding:12px; text-align:left;">ID</th>
                                        <th style="padding:12px; text-align:left;">Produto</th>
                                        <th style="padding:12px; text-align:left;">Quantidade</th>
                                        <th style="padding:12px; text-align:left;">Preço Unit.</th>
                                        <th style="padding:12px; text-align:left;">Valor Total</th>
                                        <th style="padding:12px; text-align:center;">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>${html}</tbody>
                            </table>
                        </div>
                    </div>
                </section>
            `;
        } catch (error) {
            app.innerHTML = `<section><h2>📦 Estoque</h2><p style="color:red;">❌ Erro: ${error.message}</p></section>`;
        }
    }

    window.confirmarExclusaoProduto = function(id, nome) {
        confirmarAcao(
            `Deseja realmente excluir o produto "${nome}"? Esta ação não pode ser desfeita.`,
            async () => {
                try {
                    const result = await callAPI('excluirProduto', { id }, false);
                    if (result.success) {
                        mostrarToast(`Produto "${nome}" excluído!`, 'success');
                        Cache.clear();
                        renderEstoque();
                    } else {
                        mostrarToast(result.error || 'Erro ao excluir', 'error');
                    }
                } catch (error) {
                    mostrarToast('Erro de conexão: ' + error.message, 'error');
                }
            },
            'Excluir',
            'Cancelar'
        );
    };

    // ============================================================
    // VENDAS – COM VALOR PAGO NA HORA
    // ============================================================
    async function renderVendas() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <section>
                <h2>💰 Registrar Venda</h2>
                <div style="text-align:center; padding:40px;">
                    <div class="loading-spinner" style="font-size:32px;">⏳</div>
                    <p style="color:#667eea;">Carregando dados...</p>
                </div>
            </section>
        `;

        try {
            const [produtosResult, clientesResult] = await Promise.all([
                callAPI('listarProdutos'),
                callAPI('listarClientes')
            ]);

            let produtosOptions = '<option value="">Selecione um produto...</option>';
            if (produtosResult.success && produtosResult.produtos.length > 0) {
                produtosResult.produtos.forEach(p => {
                    const qtd = parseInt(p.quantidade) || 0;
                    const preco = parseFloat(p.preco) || 0;
                    const disabled = qtd === 0 ? 'disabled' : '';
                    produtosOptions += `
                        <option value="${p.id}" data-quantidade="${qtd}" data-preco="${preco}" data-nome="${p.nome}" ${disabled}>
                            ${p.nome} (${qtd} disp.) - R$ ${preco.toFixed(2).replace('.', ',')} ${disabled ? '🔴' : ''}
                        </option>
                    `;
                });
            }

            let clientesOptions = '<option value="">Selecione um cliente...</option>';
            let clientes = [];
            if (clientesResult.success && clientesResult.clientes && clientesResult.clientes.length > 0) {
                clientes = clientesResult.clientes.map(c => c.nome).filter(n => n && n !== 'Cliente não informado');
                clientes.sort();
                clientes.forEach(nome => {
                    clientesOptions += `<option value="${nome}">${nome}</option>`;
                });
            }

            app.innerHTML = `
                <section>
                    <h2>💰 Registrar Venda</h2>
                    <div style="background:white; padding:30px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                        <form id="formVendaMultipla">
                            <!-- Cliente -->
                            <div style="margin-bottom:20px;">
                                <label style="display:block; margin-bottom:8px; color:#4a5568; font-weight:500;">Cliente *</label>
                                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                                    <select id="clienteSelect" required style="flex:3; padding:12px; border:2px solid #e2e8f0; border-radius:6px;">
                                        ${clientesOptions}
                                    </select>
                                    <button type="button" onclick="window.cadastrarNovoCliente()" style="background:#667eea; color:white; border:none; padding:12px 20px; border-radius:6px; cursor:pointer; font-weight:500; white-space:nowrap;">
                                        ➕ Novo Cliente
                                    </button>
                                </div>
                            </div>

                            <!-- Produtos (4 linhas) -->
                            <div id="produtosContainer">
                                ${[1,2,3,4].map(i => `
                                    <div class="produto-item" style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                                        <div style="flex:2; min-width:150px;">
                                            <label style="font-size:14px; color:#4a5568;">Produto ${i}</label>
                                            <select id="produto${i}" class="produto-select" style="width:100%; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                                                ${produtosOptions}
                                            </select>
                                        </div>
                                        <div style="flex:1; min-width:80px;">
                                            <label style="font-size:14px; color:#4a5568;">Qtd</label>
                                            <input type="number" id="qtd${i}" class="qtd-produto" min="0" value="0" style="width:100%; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                                        </div>
                                        <div style="flex:1; min-width:100px;">
                                            <label style="font-size:14px; color:#4a5568;">Subtotal</label>
                                            <span id="subtotal${i}" style="display:block; padding:10px; background:#f7fafc; border-radius:6px; text-align:center; font-weight:bold; color:#667eea;">R$ 0,00</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>

                            <!-- Total geral e Valor Pago -->
                            <div style="margin-top:20px; padding:20px; background:#f7fafc; border-radius:12px; border: 2px solid #e2e8f0;">
                                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:20px;">
                                    <div style="flex:1; min-width:200px;">
                                        <span style="font-size:14px; color:#666;">Total da Venda:</span>
                                        <span id="totalVenda" style="font-size:32px; font-weight:bold; color:#667eea; display:block;">R$ 0,00</span>
                                    </div>
                                    <div class="valor-pago-container" style="flex:1; min-width:200px;">
                                        <label style="display:block; margin-bottom:8px; color:#4a5568; font-weight:500;">💵 Valor Pago na Hora</label>
                                        <input type="number" id="valorPago" step="0.01" min="0" placeholder="Digite o valor pago..." style="width:100%; padding:12px; border:2px solid #48bb78; border-radius:8px; font-size:16px; font-weight:bold; background:#f0fff4;">
                                    </div>
                                    <div style="flex:1; min-width:200px;">
                                        <span style="font-size:14px; color:#666;">Troco / Pendente:</span>
                                        <span id="trocoOuPendente" style="font-size:28px; font-weight:bold; color:#e53e3e; display:block;">R$ 0,00</span>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" style="margin-top:20px; background:#48bb78; color:white; border:none; padding:14px 24px; border-radius:8px; cursor:pointer; font-weight:500; width:100%; font-size:16px;">
                                💰 Registrar Venda
                            </button>
                        </form>
                        <div id="msgVenda" style="margin-top:20px;"></div>
                    </div>
                </section>
            `;

            // Função para calcular totais e troco
            function calcularTotais() {
                let totalGeral = 0;
                for (let i = 1; i <= 4; i++) {
                    const select = document.getElementById(`produto${i}`);
                    const qtdInput = document.getElementById(`qtd${i}`);
                    const subtotalSpan = document.getElementById(`subtotal${i}`);
                    const qtd = parseInt(qtdInput.value) || 0;
                    const option = select.options[select.selectedIndex];
                    let subtotal = 0;
                    if (select.selectedIndex > 0 && option) {
                        const preco = parseFloat(option.dataset.preco || 0);
                        subtotal = preco * qtd;
                    }
                    subtotalSpan.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
                    totalGeral += subtotal;
                }
                document.getElementById('totalVenda').textContent = `R$ ${totalGeral.toFixed(2).replace('.', ',')}`;
                
                // Calcula troco ou pendente
                const valorPago = parseFloat(document.getElementById('valorPago').value) || 0;
                const troco = valorPago - totalGeral;
                const trocoSpan = document.getElementById('trocoOuPendente');
                
                if (troco >= 0) {
                    trocoSpan.textContent = `R$ ${troco.toFixed(2).replace('.', ',')}`;
                    trocoSpan.style.color = '#38a169';
                    document.getElementById('valorPago').style.borderColor = '#48bb78';
                    document.getElementById('valorPago').style.background = '#f0fff4';
                } else {
                    trocoSpan.textContent = `R$ ${Math.abs(troco).toFixed(2).replace('.', ',')} (Pendente)`;
                    trocoSpan.style.color = '#e53e3e';
                    document.getElementById('valorPago').style.borderColor = '#fc8181';
                    document.getElementById('valorPago').style.background = '#fff5f5';
                }
            }

            // Event listeners
            document.querySelectorAll('.produto-select, .qtd-produto').forEach(el => {
                el.addEventListener('change', calcularTotais);
                el.addEventListener('input', calcularTotais);
            });
            document.getElementById('valorPago').addEventListener('input', calcularTotais);

            document.getElementById('formVendaMultipla').addEventListener('submit', registrarVendaMultipla);

            calcularTotais();

        } catch (error) {
            app.innerHTML = `<section><h2>💰 Registrar Venda</h2><p style="color:red;">❌ Erro: ${error.message}</p></section>`;
        }
    }

    // ============================================================
    // CADASTRAR NOVO CLIENTE (via prompt)
    // ============================================================
    window.cadastrarNovoCliente = function() {
        const nome = prompt('Digite o nome do novo cliente:');
        if (!nome || nome.trim() === '') {
            mostrarToast('Nome inválido', 'warning');
            return;
        }
        const select = document.getElementById('clienteSelect');
        if (select) {
            const option = document.createElement('option');
            option.value = nome.trim();
            option.textContent = nome.trim();
            select.appendChild(option);
            select.value = nome.trim();
            mostrarToast(`Cliente "${nome.trim()}" adicionado!`, 'success');
        }
    };

    // ============================================================
    // REGISTRAR VENDA MÚLTIPLA (via GET) – COM VALOR PAGO E PROCESSAMENTO
    // ============================================================
    async function registrarVendaMultipla(e) {
        e.preventDefault();
        const cliente = document.getElementById('clienteSelect').value;
        const msg = document.getElementById('msgVenda');
        const valorPago = parseFloat(document.getElementById('valorPago').value) || 0;
        const botaoSubmit = document.querySelector('#formVendaMultipla button[type="submit"]');

        if (!cliente) {
            msg.innerHTML = '<div style="padding:12px;background:#fed7d7;color:#9b2c2c;border-radius:6px;">❌ Selecione ou cadastre um cliente</div>';
            return;
        }

        const itens = [];
        let totalVenda = 0;
        for (let i = 1; i <= 4; i++) {
            const select = document.getElementById(`produto${i}`);
            const qtdInput = document.getElementById(`qtd${i}`);
            const qtd = parseInt(qtdInput.value) || 0;
            if (qtd > 0 && select.selectedIndex > 0) {
                const option = select.options[select.selectedIndex];
                const produtoId = option.value;
                const preco = parseFloat(option.dataset.preco || 0);
                const nomeProduto = option.dataset.nome || '';
                const disponivel = parseInt(option.dataset.quantidade || 0);
                if (qtd > disponivel) {
                    msg.innerHTML = `<div style="padding:12px;background:#fed7d7;color:#9b2c2c;border-radius:6px;">❌ Estoque insuficiente para "${nomeProduto}". Disponível: ${disponivel}</div>`;
                    return;
                }
                itens.push({ produtoId, quantidade: qtd, preco, nome: nomeProduto });
                totalVenda += preco * qtd;
            }
        }

        if (itens.length === 0) {
            msg.innerHTML = '<div style="padding:12px;background:#fed7d7;color:#9b2c2c;border-radius:6px;">❌ Adicione pelo menos um produto com quantidade > 0</div>';
            return;
        }

        const troco = valorPago - totalVenda;
        let mensagemConfirmacao;
        if (troco >= 0) {
            mensagemConfirmacao = `Confirmar venda para ${cliente}?<br><br>Itens: ${itens.map(item => `${item.quantidade}x ${item.nome}`).join(', ')}<br><br>Total: R$ ${totalVenda.toFixed(2).replace('.', ',')}<br>Valor Pago: R$ ${valorPago.toFixed(2).replace('.', ',')}<br>Troco: R$ ${troco.toFixed(2).replace('.', ',')}`;
        } else {
            mensagemConfirmacao = `Confirmar venda para ${cliente}?<br><br>Itens: ${itens.map(item => `${item.quantidade}x ${item.nome}`).join(', ')}<br><br>Total: R$ ${totalVenda.toFixed(2).replace('.', ',')}<br>Valor Pago: R$ ${valorPago.toFixed(2).replace('.', ',')}<br>⚠️ Pendente: R$ ${Math.abs(troco).toFixed(2).replace('.', ',')}`;
        }

        confirmarAcao(
            mensagemConfirmacao,
            async () => {
                try {
                    // Mostra indicador de processamento no botão
                    const textoOriginal = botaoSubmit.innerHTML;
                    botaoSubmit.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                            <span class="loading-spinner" style="font-size: 20px;">⏳</span>
                            <span>Processando venda...</span>
                        </div>
                    `;
                    botaoSubmit.disabled = true;
                    botaoSubmit.style.opacity = '0.7';
                    botaoSubmit.style.cursor = 'not-allowed';
                    botaoSubmit.classList.add('btn-processing');

                    // Mostra mensagem de processamento
                    msg.innerHTML = `
                        <div style="padding: 15px; background: #e3f2fd; color: #0d47a1; border-radius: 8px; border-left: 4px solid #2196f3;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span class="loading-spinner" style="font-size: 20px;">⏳</span>
                                <span>Processando venda para ${cliente}...</span>
                            </div>
                        </div>
                    `;

                    let todasOk = true;
                    for (const item of itens) {
                        const result = await callAPI('registrarVenda', {
                            produtoId: item.produtoId,
                            quantidade: item.quantidade,
                            cliente: cliente,
                            valorPago: valorPago,
                            totalVenda: totalVenda
                        }, false);
                        if (!result.success) {
                            mostrarToast(`Erro no item ${item.nome}: ${result.error}`, 'error');
                            todasOk = false;
                            break;
                        }
                    }
                    
                    if (todasOk) {
                        // Registra pagamento se valor foi pago
                        if (valorPago > 0) {
                            await callAPI('registrarPagamento', {
                                cliente: cliente,
                                valor: valorPago,
                                observacao: `Pagamento da venda de R$ ${totalVenda.toFixed(2)}`
                            }, false);
                        }
                        
                        let msgVenda = `<div style="padding:15px;background:#c6f6d5;color:#22543d;border-radius:6px; animation: slideInRight 0.3s ease;"><strong>✅ Venda registrada com sucesso!</strong><br>Cliente: ${cliente}<br>Total: R$ ${totalVenda.toFixed(2).replace('.', ',')}<br>Valor Pago: R$ ${valorPago.toFixed(2).replace('.', ',')}`;
                        
                        if (troco >= 0) {
                            msgVenda += `<br>Troco: R$ ${troco.toFixed(2).replace('.', ',')}`;
                        } else {
                            msgVenda += `<br>⚠️ Pendente: R$ ${Math.abs(troco).toFixed(2).replace('.', ',')}`;
                        }
                        
                        msgVenda += '</div>';
                        msg.innerHTML = msgVenda;
                        mostrarToast(`Venda de R$ ${totalVenda.toFixed(2).replace('.', ',')} registrada!`, 'success');
                        
                        // Limpa os campos
                        document.querySelectorAll('.qtd-produto').forEach(el => el.value = 0);
                        document.querySelectorAll('.produto-select').forEach(el => el.selectedIndex = 0);
                        document.getElementById('valorPago').value = '';
                        document.querySelectorAll('#subtotal1, #subtotal2, #subtotal3, #subtotal4').forEach(el => el.textContent = 'R$ 0,00');
                        document.getElementById('totalVenda').textContent = 'R$ 0,00';
                        document.getElementById('trocoOuPendente').textContent = 'R$ 0,00';
                        
                        Cache.clear();
                        await carregarClientesDropdown();
                    }
                } catch (error) {
                    msg.innerHTML = `<div style="padding:12px;background:#fed7d7;color:#9b2c2c;border-radius:6px;">❌ Erro: ${error.message}</div>`;
                } finally {
                    // Restaura o botão
                    botaoSubmit.innerHTML = '💰 Registrar Venda';
                    botaoSubmit.disabled = false;
                    botaoSubmit.style.opacity = '1';
                    botaoSubmit.style.cursor = 'pointer';
                    botaoSubmit.classList.remove('btn-processing');
                }
            },
            'Confirmar Venda',
            'Cancelar'
        );
    }

    async function carregarClientesDropdown() {
        const select = document.getElementById('clienteSelect');
        if (!select) return;
        try {
            const result = await callAPI('listarClientes', null, false);
            let clientes = [];
            if (result.success && result.clientes) {
                clientes = result.clientes.map(c => c.nome).filter(n => n && n !== 'Cliente não informado');
                clientes.sort();
            }
            const currentValue = select.value;
            select.innerHTML = '<option value="">Selecione um cliente...</option>';
            clientes.forEach(nome => {
                const opt = document.createElement('option');
                opt.value = nome;
                opt.textContent = nome;
                select.appendChild(opt);
            });
            if (currentValue && clientes.includes(currentValue)) {
                select.value = currentValue;
            }
        } catch (e) {
            console.error('Erro ao carregar clientes:', e);
        }
    }

    // ============================================================
    // CLIENTES – COM HISTÓRICO DE COMPRAS E PAGAMENTOS
    // ============================================================
    async function renderClientes() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <section>
                <h2>👥 Clientes</h2>
                <div style="background:white; padding:20px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                    <div style="margin-bottom:20px;">
                        <div style="display:flex; gap:10px; align-items:center;">
                            <input type="text" id="buscaCliente" placeholder="🔍 Buscar cliente..." style="flex:1; padding:12px; border:2px solid #e2e8f0; border-radius:6px;">
                            <button onclick="document.getElementById('buscaCliente').value=''; window.carregarTabelaClientes();" style="background:#e2e8f0; color:#4a5568; border:none; padding:12px 16px; border-radius:6px; cursor:pointer;">
                                ✕ Limpar
                            </button>
                        </div>
                    </div>
                    <div id="tabelaClientes">
                        <div style="text-align:center; padding:20px;">
                            <div class="loading-spinner" style="font-size:24px;">⏳</div>
                            <p style="color:#667eea;">Carregando clientes...</p>
                        </div>
                    </div>
                    <div id="detalhesCliente" style="margin-top:20px;"></div>
                </div>
            </section>
        `;

        document.getElementById('buscaCliente').addEventListener('input', (e) => {
            StateManager.setFiltro(e.target.value);
            carregarTabelaClientes(e.target.value);
        });

        await carregarTabelaClientes();
    }

    async function carregarTabelaClientes(filtro = '') {
        const container = document.getElementById('tabelaClientes');
        if (!container) return;

        container.innerHTML = `<div style="text-align:center; padding:20px;"><div class="loading-spinner" style="font-size:24px;">⏳</div><p style="color:#667eea;">Atualizando...</p></div>`;

        try {
            const result = await callAPI('listarVendasPorCliente', null, false);
            let html = '';
            if (result.success && result.clientes && result.clientes.length > 0) {
                let clientesFiltrados = result.clientes.filter(c => c.nome && c.nome !== 'Cliente não informado');
                if (filtro) {
                    clientesFiltrados = clientesFiltrados.filter(c => c.nome.toLowerCase().includes(filtro.toLowerCase()));
                }
                if (clientesFiltrados.length > 0) {
                    clientesFiltrados.sort((a, b) => (parseFloat(b.totalGasto) || 0) - (parseFloat(a.totalGasto) || 0));
                    clientesFiltrados.forEach(cliente => {
                        const totalGasto = parseFloat(cliente.totalGasto) || 0;
                        const totalPago = parseFloat(cliente.totalPago) || 0;
                        const saldo = totalGasto - totalPago;
                        const statusSaldo = saldo > 0.01 ? '🔴' : saldo < -0.01 ? '🟡' : '🟢';
                        const statusTexto = saldo > 0.01 ? 'A pagar' : saldo < -0.01 ? 'Crédito' : 'Quitado';
                        html += `
                            <tr onclick="window.mostrarDetalhesCliente('${cliente.nome.replace(/'/g, "\\'")}')" style="cursor:pointer;" onmouseover="this.style.background='#f7fafc'" onmouseout="this.style.background='white'">
                                <td><strong>${cliente.nome}</strong></td>
                                <td>R$ ${totalGasto.toFixed(2).replace('.', ',')}</td>
                                <td>R$ ${totalPago.toFixed(2).replace('.', ',')}</td>
                                <td>${statusSaldo} <strong>R$ ${Math.abs(saldo).toFixed(2).replace('.', ',')}</strong> <small>(${statusTexto})</small></td>
                            </tr>
                        `;
                    });
                } else {
                    html = `<tr><td colspan="4" style="text-align:center; padding:40px;"><p style="font-size:48px;">🔍</p><p style="color:#666;">Nenhum cliente encontrado</p></td></tr>`;
                }
            } else {
                html = `<tr><td colspan="4" style="text-align:center; padding:40px;"><p style="font-size:48px;">📭</p><p style="color:#666;">Nenhum cliente cadastrado</p></td></tr>`;
            }

            container.innerHTML = `
                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="background:#3957ed; border-bottom:2px solid #e2e8f0;">
                                <th style="padding:12px; text-align:left;">Cliente</th>
                                <th style="padding:12px; text-align:left;">Total Gasto</th>
                                <th style="padding:12px; text-align:left;">Total Pago</th>
                                <th style="padding:12px; text-align:left;">Saldo</th>
                            </tr>
                        </thead>
                        <tbody>${html}</tbody>
                    </table>
                </div>
                <div style="margin-top:10px; padding:10px; background:#f7fafc; border-radius:6px; font-size:12px; color:#666;">
                    🟢 Quitado | 🔴 Em débito | 🟡 Crédito | Clique no cliente para ver detalhes
                </div>
            `;
        } catch (error) {
            container.innerHTML = `<div style="text-align:center; padding:20px; color:#e53e3e;"><p>❌ Erro: ${error.message}</p><button onclick="carregarTabelaClientes()" style="background:#667eea; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">🔄 Tentar novamente</button></div>`;
        }
    }

    window.carregarTabelaClientes = carregarTabelaClientes;

    window.mostrarDetalhesCliente = async function(nomeCliente) {
        const container = document.getElementById('detalhesCliente');
        if (!container) return;

        container.innerHTML = `
            <div style="text-align:center; padding:20px;">
                <div class="loading-spinner" style="font-size:24px;">⏳</div>
                <p style="color:#667eea;">Carregando histórico de ${nomeCliente}...</p>
            </div>
        `;

        try {
            const [historicoCompras, historicoPagamentos, resumoCliente] = await Promise.all([
                callAPI('listarDetalhesCliente', { cliente: nomeCliente }, false),
                callAPI('listarPagamentosPorCliente', { cliente: nomeCliente }, false),
                callAPI('listarVendasPorCliente', null, false)
            ]);

            let totalGasto = 0;
            let totalPago = 0;
            if (resumoCliente.success && resumoCliente.clientes) {
                const cliente = resumoCliente.clientes.find(c => c.nome.toLowerCase() === nomeCliente.toLowerCase());
                if (cliente) {
                    totalGasto = parseFloat(cliente.totalGasto) || 0;
                    totalPago = parseFloat(cliente.totalPago) || 0;
                }
            }

            const saldo = totalGasto - totalPago;
            const statusSaldo = saldo > 0.01 ? 'A pagar' : saldo < -0.01 ? 'Crédito' : 'Quitado';
            const corSaldo = saldo > 0.01 ? '#e53e3e' : saldo < -0.01 ? '#dd6b20' : '#38a169';

            let comprasHtml = '';
            if (historicoCompras.success && historicoCompras.historico && historicoCompras.historico.length > 0) {
                comprasHtml = historicoCompras.historico.map(h => {
                    const data = h.data ? new Date(h.data) : new Date();
                    const dataFormatada = data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    return `
                        <tr>
                            <td>${dataFormatada}</td>
                            <td>${h.produto || '-'}</td>
                            <td>${h.quantidade || 1}</td>
                            <td>R$ ${(parseFloat(h.total) || 0).toFixed(2).replace('.', ',')}</td>
                        </tr>
                    `;
                }).join('');
            } else {
                comprasHtml = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#666;">Nenhuma compra encontrada</td></tr>`;
            }

            let pagamentosHtml = '';
            if (historicoPagamentos.success && historicoPagamentos.pagamentos && historicoPagamentos.pagamentos.length > 0) {
                pagamentosHtml = historicoPagamentos.pagamentos.map(p => {
                    const data = p.data ? new Date(p.data) : new Date();
                    const dataFormatada = data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    return `
                        <tr>
                            <td>${dataFormatada}</td>
                            <td>R$ ${(parseFloat(p.valor) || 0).toFixed(2).replace('.', ',')}</td>
                            <td>${p.observacao || '-'}</td>
                        </tr>
                    `;
                }).join('');
            } else {
                pagamentosHtml = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#666;">Nenhum pagamento encontrado</td></tr>`;
            }

            container.innerHTML = `
                <div style="background:white; padding:25px; border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,0.1);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h3 style="margin:0;">📋 ${nomeCliente}</h3>
                        <button onclick="document.getElementById('detalhesCliente').innerHTML=''" style="background:#e53e3e; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:500;">
                            ✕ Fechar
                        </button>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px,1fr)); gap:15px; margin-bottom:25px;">
                        <div style="background:#f7fafc; padding:15px; border-radius:8px;">
                            <p style="color:#666; margin:0; font-size:14px;">Total de Compras</p>
                            <p style="font-size:28px; font-weight:bold; margin:5px 0; color:#667eea;">${historicoCompras.historico ? historicoCompras.historico.length : 0}</p>
                        </div>
                        <div style="background:#f7fafc; padding:15px; border-radius:8px;">
                            <p style="color:#666; margin:0; font-size:14px;">Total Gasto</p>
                            <p style="font-size:28px; font-weight:bold; margin:5px 0; color:#667eea;">R$ ${totalGasto.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div style="background:#f7fafc; padding:15px; border-radius:8px;">
                            <p style="color:#666; margin:0; font-size:14px;">Total Pago</p>
                            <p style="font-size:28px; font-weight:bold; margin:5px 0; color:#48bb78;">R$ ${totalPago.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div style="background:${saldo > 0.01 ? '#fff5f5' : saldo < -0.01 ? '#fffff0' : '#f0fff4'}; padding:15px; border-radius:8px;">
                            <p style="color:#666; margin:0; font-size:14px;">Saldo</p>
                            <p style="font-size:28px; font-weight:bold; margin:5px 0; color:${corSaldo};">
                                R$ ${Math.abs(saldo).toFixed(2).replace('.', ',')}
                            </p>
                            <small style="color:${corSaldo};">${statusSaldo}</small>
                        </div>
                    </div>

                    <div style="margin-bottom:15px;">
                        <button onclick="window.abrirAba('compras')" id="btnCompras" style="background:#667eea; color:white; border:none; padding:8px 20px; border-radius:6px; cursor:pointer; margin-right:10px;">📦 Compras</button>
                        <button onclick="window.abrirAba('pagamentos')" id="btnPagamentos" style="background:#e2e8f0; color:#4a5568; border:none; padding:8px 20px; border-radius:6px; cursor:pointer;">💳 Pagamentos</button>
                    </div>

                    <div id="abaCompras">
                        <h4 style="margin:0 0 15px 0;">📜 Histórico de Compras</h4>
                        <div style="overflow-x:auto; margin-bottom:25px;">
                            <table style="width:100%; border-collapse:collapse;">
                                <thead>
                                    <tr style="background:#3957ed; border-bottom:2px solid #e2e8f0;">
                                        <th style="padding:10px; text-align:left;">Data</th>
                                        <th style="padding:10px; text-align:left;">Produto</th>
                                        <th style="padding:10px; text-align:left;">Qtd</th>
                                        <th style="padding:10px; text-align:left;">Valor</th>
                                    </tr>
                                </thead>
                                <tbody>${comprasHtml}</tbody>
                            </table>
                        </div>
                    </div>

                    <div id="abaPagamentos" style="display:none;">
                        <h4 style="margin:0 0 15px 0;">💳 Histórico de Pagamentos</h4>
                        <div style="overflow-x:auto; margin-bottom:25px;">
                            <table style="width:100%; border-collapse:collapse;">
                                <thead>
                                    <tr style="background:#3957ed; border-bottom:2px solid #e2e8f0;">
                                        <th style="padding:10px; text-align:left;">Data</th>
                                        <th style="padding:10px; text-align:left;">Valor</th>
                                        <th style="padding:10px; text-align:left;">Observação</th>
                                    </tr>
                                </thead>
                                <tbody>${pagamentosHtml}</tbody>
                            </table>
                        </div>
                    </div>

                    <div style="padding:20px; background:#f7fafc; border-radius:8px; border:1px solid #e2e8f0; margin-top:20px;">
                        <h4 style="margin:0 0 15px 0;">💳 Registrar Pagamento</h4>
                        <div style="display:flex; gap:10px; flex-wrap:wrap;">
                            <input type="number" id="valorPagamentoDetalhe" placeholder="Valor do pagamento" min="0.01" step="0.01" style="flex:1; padding:12px; border:2px solid #e2e8f0; border-radius:6px; min-width:150px;">
                            <button onclick="window.registrarPagamentoClienteDetalhe('${nomeCliente.replace(/'/g, "\\'")}')" style="background:#48bb78; color:white; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-weight:500; white-space:nowrap;">
                                💵 Registrar Pagamento
                            </button>
                        </div>
                        <div id="msgPagamentoDetalhe" style="margin-top:15px;"></div>
                    </div>
                </div>
            `;

            window.abrirAba = function(aba) {
                document.getElementById('abaCompras').style.display = aba === 'compras' ? 'block' : 'none';
                document.getElementById('abaPagamentos').style.display = aba === 'pagamentos' ? 'block' : 'none';
                document.getElementById('btnCompras').style.background = aba === 'compras' ? '#667eea' : '#e2e8f0';
                document.getElementById('btnCompras').style.color = aba === 'compras' ? 'white' : '#4a5568';
                document.getElementById('btnPagamentos').style.background = aba === 'pagamentos' ? '#667eea' : '#e2e8f0';
                document.getElementById('btnPagamentos').style.color = aba === 'pagamentos' ? 'white' : '#4a5568';
            };
            window.abrirAba('compras');

        } catch (error) {
            container.innerHTML = `<div style="background:white; padding:25px; border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,0.1);"><p style="color:#e53e3e;">❌ Erro: ${error.message}</p><button onclick="document.getElementById('detalhesCliente').innerHTML=''" style="background:#e53e3e; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer;">✕ Fechar</button></div>`;
        }
    };

    window.registrarPagamentoClienteDetalhe = async function(nomeCliente) {
        const valorInput = document.getElementById('valorPagamentoDetalhe');
        const msgDiv = document.getElementById('msgPagamentoDetalhe');
        if (!valorInput || !msgDiv) return;

        const valor = parseFloat(valorInput.value);
        if (isNaN(valor) || valor <= 0) {
            msgDiv.innerHTML = '<div style="padding:10px;background:#fed7d7;color:#9b2c2c;border-radius:4px;">❌ Informe um valor válido</div>';
            return;
        }

        confirmarAcao(
            `Confirmar pagamento de R$ ${valor.toFixed(2).replace('.', ',')} de ${nomeCliente}?`,
            async () => {
                msgDiv.innerHTML = '<p style="color:#667eea;">⏳ Registrando pagamento...</p>';
                try {
                    const result = await callAPI('registrarPagamento', { cliente: nomeCliente, valor, observacao: 'Pagamento registrado pelo sistema' }, false);
                    if (result.success) {
                        msgDiv.innerHTML = `<div style="padding:10px;background:#c6f6d5;color:#22543d;border-radius:4px;">✅ Pagamento de R$ ${valor.toFixed(2).replace('.', ',')} registrado!</div>`;
                        mostrarToast(`Pagamento de R$ ${valor.toFixed(2).replace('.', ',')} registrado!`, 'success');
                        valorInput.value = '';
                        Cache.clear();
                        await carregarTabelaClientes(StateManager.getFiltro());
                        setTimeout(() => window.mostrarDetalhesCliente(nomeCliente), 500);
                    } else {
                        msgDiv.innerHTML = `<div style="padding:10px;background:#fed7d7;color:#9b2c2c;border-radius:4px;">❌ ${result.error || 'Erro ao registrar pagamento'}</div>`;
                    }
                } catch (error) {
                    msgDiv.innerHTML = `<div style="padding:10px;background:#fed7d7;color:#9b2c2c;border-radius:4px;">❌ Erro: ${error.message}</div>`;
                }
            },
            'Confirmar Pagamento',
            'Cancelar'
        );
    };

    // ============================================================
    // EXPORTA FUNÇÕES GLOBAIS
    // ============================================================
    window.renderHome = renderHome;
    window.renderCadastro = renderCadastro;
    window.renderEstoque = renderEstoque;
    window.renderVendas = renderVendas;
    window.renderClientes = renderClientes;
    window.carregarTabelaClientes = carregarTabelaClientes;
    window.mostrarToast = mostrarToast;
    window.confirmarAcao = confirmarAcao;
    window.mostrarDetalhesCliente = window.mostrarDetalhesCliente;
    window.cadastrarNovoCliente = window.cadastrarNovoCliente;

    console.log('🚀 Sistema de Vendas v3.4 – Completo com processamento visual de vendas');
})();
