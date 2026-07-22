(function() {
    'use strict';

    // ============================================================
    // CONFIGURAÇÃO – Substitua pela sua URL real do GAS
    // ============================================================
    const API_URL = 'https://script.google.com/macros/s/AKfycbxQ0NMpOH4zOnYYd-QvQd3gORdlJMY1e-egwOuDbHQfFt_6kkNsttLmc-3vC1E-4Wc/exec';

    // ============================================================
    // CONFIGURAÇÃO PIX – SUBSTITUA COM SEUS DADOS
    // ============================================================
    const PIX_CONFIG = {
        chave: 'pixdojosue@gmail.com',
        nomeRecebedor: 'Josue Santos',
        cidade: 'SP'
    };

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
        if (hora >= 5 && hora < 12) saudacao = 'Bom dia';
        else if (hora >= 12 && hora < 18) saudacao = 'Boa tarde';
        else saudacao = 'Boa noite';
        const horario = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
        bloquearZoom();
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
    }

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
            .saudacao-card { animation: slideInRight 0.5s ease; transition: all 0.3s ease; }
            .saudacao-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(102,126,234,0.4) !important; }
            .btn-processing { animation: pulse 1.5s ease infinite; }
            .edit-modal { animation: scaleIn 0.2s ease; }
            .modal-pix { animation: fadeIn 0.3s ease; }
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
                const shortcuts = { '1': 'home', '2': 'estoque', '3': 'vendas', '4': 'clientes' };
                if (shortcuts[e.key]) {
                    e.preventDefault();
                    document.querySelector(`[data-page="${shortcuts[e.key]}"]`)?.click();
                }
            }
        });
    }

    // ============================================================
    // QR CODE PIX – FUNÇÕES
    // ============================================================
    window.gerarQrCodePix = function(valor, descricao = 'Pagamento') {
        if (!valor || valor <= 0) {
            mostrarToast('Valor inválido para gerar QR Code', 'error');
            return;
        }

        const txid = 'VENDA' + Date.now().toString().slice(-8);
        const payload = gerarPayloadPix(
            PIX_CONFIG.chave,
            PIX_CONFIG.nomeRecebedor,
            PIX_CONFIG.cidade,
            valor,
            descricao,
            txid
        );

        mostrarModalPix(payload, valor, descricao);
    };

    function gerarPayloadPix(chave, nome, cidade, valor, descricao, txid) {
        chave = chave.trim();
        nome = removerAcentos(nome.trim()).substring(0, 25);
        cidade = removerAcentos(cidade.trim()).substring(0, 15);
        txid = (txid && txid.trim()) ? txid.trim().substring(0, 25) : '***';

        if (!chave) throw new Error('Chave Pix não configurada');

        let payload = '000201';
        const gui = '0014BR.GOV.BCB.PIX';
        const chaveLen = String(chave.length).padStart(2, '0');
        const merchantAccount = gui + '01' + chaveLen + chave;
        const merchantAccountLen = String(merchantAccount.length).padStart(2, '0');
        payload += '26' + merchantAccountLen + merchantAccount;
        payload += '52040000';
        payload += '5303986';
        if (valor && valor > 0) {
            const valorFormatado = valor.toFixed(2);
            const valorLen = String(valorFormatado.length).padStart(2, '0');
            payload += '54' + valorLen + valorFormatado;
        }
        payload += '5802BR';
        const nomeLen = String(nome.length).padStart(2, '0');
        payload += '59' + nomeLen + nome;
        const cidadeLen = String(cidade.length).padStart(2, '0');
        payload += '60' + cidadeLen + cidade;
        const txidValue = '05' + String(txid.length).padStart(2, '0') + txid;
        const txidLen = String(txidValue.length).padStart(2, '0');
        payload += '62' + txidLen + txidValue;
        payload += '6304';
        const crc = calcularCRC16(payload);
        const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
        payload += crcHex;

        console.log('📤 Payload Pix gerado:', payload);
        return payload;
    }

    function removerAcentos(str) {
        const mapa = {
            'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a',
            'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
            'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
            'ó': 'o', 'ò': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
            'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
            'ç': 'c', 'ñ': 'n'
        };
        return str.replace(/[áàâãäéèêëíìîïóòôõöúùûüçñ]/g, function(match) {
            return mapa[match] || match;
        });
    }

    function calcularCRC16(payload) {
        const polynomial = 0x1021;
        let crc = 0xFFFF;
        for (let i = 0; i < payload.length; i++) {
            crc ^= payload.charCodeAt(i) << 8;
            for (let j = 0; j < 8; j++) {
                if (crc & 0x8000) {
                    crc = (crc << 1) ^ polynomial;
                } else {
                    crc <<= 1;
                }
                crc &= 0xFFFF;
            }
        }
        return crc;
    }

    function mostrarModalPix(payload, valor, descricao) {
        const modalAnterior = document.querySelector('.modal-pix');
        if (modalAnterior) modalAnterior.remove();

        const overlay = document.createElement('div');
        overlay.className = 'modal-pix';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;
            z-index: 10001; animation: fadeIn 0.3s ease;
            padding: 20px;
        `;

        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(payload)}`;

        overlay.innerHTML = `
            <div style="background:white; padding:30px; border-radius:16px; max-width:480px; width:100%; box-shadow:0 20px 60px rgba(0,0,0,0.3); animation: scaleIn 0.3s ease; position:relative;">
                <button onclick="this.closest('.modal-pix').remove()" style="position:absolute; top:10px; right:15px; background:transparent; border:none; font-size:24px; cursor:pointer; color:#999;">✕</button>
                <div style="text-align:center;">
                    <div style="display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:10px;">
                        <span style="font-size:28px;">💳</span>
                        <h2 style="margin:0; color:#2d3748;">Pagar com Pix</h2>
                    </div>
                    <div style="background:#f0f4ff; padding:15px; border-radius:12px; margin-bottom:20px;">
                        <p style="margin:0; font-size:14px; color:#4a5568;">Valor da compra</p>
                        <p style="margin:0; font-size:32px; font-weight:bold; color:#667eea;">R$ ${valor.toFixed(2).replace('.', ',')}</p>
                        ${descricao ? `<p style="margin:5px 0 0 0; font-size:12px; color:#666;">${descricao}</p>` : ''}
                    </div>
                    <div style="background:#f8f9fa; padding:15px; border-radius:12px; margin-bottom:15px;">
                        <img src="${qrCodeUrl}" alt="QR Code Pix" style="width:220px; height:220px; margin:0 auto; display:block; background:white; padding:10px; border-radius:8px; image-rendering:pixelated;">
                    </div>
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <button onclick="copiarPix('${payload.replace(/'/g, "\\'")}')" style="flex:1; background:#667eea; color:white; border:none; padding:12px; border-radius:8px; cursor:pointer; font-weight:500;">
                            📋 Copiar Código Pix
                        </button>
                        <button onclick="this.closest('.modal-pix').remove()" style="flex:1; background:#e2e8f0; color:#4a5568; border:none; padding:12px; border-radius:8px; cursor:pointer; font-weight:500;">
                            Fechar
                        </button>
                    </div>
                    <div style="margin-top:15px; padding:12px; background:#fff3cd; border-radius:8px; font-size:12px; color:#856404;">
                        ⚠️ Após o pagamento, finalize a compra no sistema.
                    </div>
                    <div style="margin-top:10px;">
                        <button onclick="validarPix('${payload.replace(/'/g, "\\'")}')" style="background:transparent; border:1px solid #667eea; color:#667eea; padding:5px 10px; border-radius:4px; font-size:10px; cursor:pointer;">
                            🔍 Validar código Pix
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
    }

    function validarPix(payload) {
        const url = `https://pix.ingressos.etc.br/validador/?pix=${encodeURIComponent(payload)}`;
        window.open(url, '_blank');
    }

    function copiarPix(payload) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(payload).then(() => {
                mostrarToast('✅ Código Pix copiado!', 'success');
            }).catch(() => {
                copiarPixFallback(payload);
            });
        } else {
            copiarPixFallback(payload);
        }
    }

    function copiarPixFallback(payload) {
        const textarea = document.createElement('textarea');
        textarea.value = payload;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            mostrarToast('✅ Código Pix copiado!', 'success');
        } catch (e) {
            mostrarToast('❌ Erro ao copiar. Selecione o código manualmente.', 'error');
        }
        document.body.removeChild(textarea);
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
                <div class="saudacao-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px 30px; border-radius: 15px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(102,126,234,0.3); border: 1px solid rgba(255,255,255,0.2);">
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="background: rgba(255,255,255,0.2); border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                                <img src="img/face.png" alt="Face" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                            </div>
                            <div>
                                <p style="font-size: 16px; margin: 0; opacity: 0.9; font-weight: 300; letter-spacing: 0.5px;">${saudacao},</p>
                                <p style="font-size: 32px; margin: 5px 0 0 0; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">Usuário! 👋</p>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.15); padding: 15px 20px; border-radius: 12px; backdrop-filter: blur(10px);">
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

            let totalProdutos = 0, valorTotalEstoque = 0, produtosBaixoEstoque = 0, produtosEsgotados = 0;
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

            let totalVendasHoje = 0, totalVendasMes = 0, totalVendasGeral = 0;
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
                    <div class="saudacao-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px 30px; border-radius: 15px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(102,126,234,0.3); border: 1px solid rgba(255,255,255,0.2);">
                        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div style="background: rgba(255,255,255,0.2); border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                                    <img src="img/face.png" alt="Face" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                                </div>
                                <div>
                                    <p style="font-size: 16px; margin: 0; opacity: 0.9; font-weight: 300; letter-spacing: 0.5px;">${saudacao},</p>
                                    <p style="font-size: 32px; margin: 5px 0 0 0; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">Usuário! 👋</p>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.15); padding: 15px 20px; border-radius: 12px; backdrop-filter: blur(10px);">
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
                                <div><h3 style="margin:0 0 10px 0; font-size:14px; opacity:0.9;">📦 Total Produtos</h3><p style="font-size:36px; font-weight:bold; margin:0;">${totalProdutos}</p></div>
                                <span style="font-size:32px; opacity:0.5;">📦</span>
                            </div>
                            <small style="opacity:0.8;">Produtos cadastrados</small>
                        </div>
                        <div class="card-dashboard" style="background:linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color:white; padding:25px; border-radius:12px;">
                            <div style="display:flex; justify-content:space-between; align-items:start;">
                                <div><h3 style="margin:0 0 10px 0; font-size:14px; opacity:0.9;">💰 Estoque Total</h3><p style="font-size:36px; font-weight:bold; margin:0;">R$ ${valorTotalEstoque.toFixed(2).replace('.', ',')}</p></div>
                                <span style="font-size:32px; opacity:0.5;">💰</span>
                            </div>
                            <small style="opacity:0.8;">Valor total em estoque</small>
                        </div>
                        <div class="card-dashboard" style="background:linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color:white; padding:25px; border-radius:12px;">
                            <div style="display:flex; justify-content:space-between; align-items:start;">
                                <div><h3 style="margin:0 0 10px 0; font-size:14px; opacity:0.9;">💵 Vendas Hoje</h3><p style="font-size:36px; font-weight:bold; margin:0;">R$ ${totalVendasHoje.toFixed(2).replace('.', ',')}</p></div>
                                <span style="font-size:32px; opacity:0.5;">💵</span>
                            </div>
                            <small style="opacity:0.8;">${hoje.toLocaleDateString('pt-BR')}</small>
                        </div>
                        <div class="card-dashboard" style="background:linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color:white; padding:25px; border-radius:12px;">
                            <div style="display:flex; justify-content:space-between; align-items:start;">
                                <div><h3 style="margin:0 0 10px 0; font-size:14px; opacity:0.9;">📊 Vendas do Mês</h3><p style="font-size:36px; font-weight:bold; margin:0;">R$ ${totalVendasMes.toFixed(2).replace('.', ',')}</p></div>
                                <span style="font-size:32px; opacity:0.5;">📊</span>
                            </div>
                            <small style="opacity:0.8;">Desde ${inicioMes.toLocaleDateString('pt-BR')}</small>
                        </div>
                    </div>
                    ${(produtosBaixoEstoque > 0 || produtosEsgotados > 0) ? `
                        <div style="margin-top:20px; display:grid; grid-template-columns:repeat(auto-fit, minmax(250px,1fr)); gap:15px;">
                            ${produtosBaixoEstoque > 0 ? `<div style="padding:15px; background:#fff3cd; border:2px solid #ffc107; border-radius:8px; color:#856404;"><strong>⚠️ Atenção:</strong> ${produtosBaixoEstoque} produto(s) com estoque baixo (≤ 5 unidades)</div>` : ''}
                            ${produtosEsgotados > 0 ? `<div style="padding:15px; background:#f8d7da; border:2px solid #dc3545; border-radius:8px; color:#721c24;"><strong>🔴 Alerta:</strong> ${produtosEsgotados} produto(s) esgotado(s)</div>` : ''}
                        </div>
                    ` : ''}
                    ${graficoHTML}
                    <div style="margin-top:20px; padding:20px; background:white; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                        <h3 style="margin:0 0 15px 0;">📈 Resumo Geral</h3>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px,1fr)); gap:15px;">
                            <div><p style="color:#666; margin:0;">Total em Vendas</p><p style="font-size:24px; font-weight:bold; color:#667eea; margin:5px 0;">R$ ${totalVendasGeral.toFixed(2).replace('.', ',')}</p></div>
                            <div><p style="color:#666; margin:0;">Ticket Médio</p><p style="font-size:24px; font-weight:bold; color:#667eea; margin:5px 0;">R$ ${vendasResult.vendas && vendasResult.vendas.length > 0 ? (totalVendasGeral / vendasResult.vendas.length).toFixed(2).replace('.', ',') : '0,00'}</p></div>
                        </div>
                    </div>
                </section>
            `;

        } catch (error) {
            app.innerHTML = `
                <section><h2>🏠 Dashboard</h2>
                <div style="text-align:center; padding:40px; color:#e53e3e;">
                    <p style="font-size:48px;">😕</p>
                    <p>❌ Erro ao carregar dados: ${error.message}</p>
                    <button onclick="window.renderHome()" class="btn-primary" style="background:#667eea; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; margin-top:10px;">🔄 Tentar novamente</button>
                </div></section>
            `;
        }
    }

    window.atualizarDashboard = function() {
        mostrarToast('Atualizando dashboard...', 'info');
        Cache.clear();
        renderHome();
    };

    // ============================================================
    // ESTOQUE – COM CADASTRO RÁPIDO E EDIÇÃO CLICÁVEL
    // ============================================================
    async function renderEstoque() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <section>
                <h2>📦 Estoque</h2>
                <!-- Box de cadastro rápido -->
                <div style="background:#f0f4ff; padding:20px; border-radius:12px; margin-bottom:20px; border:2px dashed #667eea;">
                    <h3 style="margin:0 0 15px 0; color:#667eea;">➕ Cadastrar Novo Produto</h3>
                    <form id="formCadastroRapido" style="display:flex; gap:15px; flex-wrap:wrap; align-items:flex-end;">
                        <div style="flex:2; min-width:150px;">
                            <label style="display:block; margin-bottom:5px; color:#4a5568; font-weight:500;">Nome</label>
                            <input type="text" id="nomeRapido" placeholder="Nome do produto" style="width:100%; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                        </div>
                        <div style="flex:1; min-width:100px;">
                            <label style="display:block; margin-bottom:5px; color:#4a5568; font-weight:500;">Preço (R$)</label>
                            <input type="number" id="precoRapido" step="0.01" placeholder="0,00" style="width:100%; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                        </div>
                        <div style="flex:1; min-width:100px;">
                            <label style="display:block; margin-bottom:5px; color:#4a5568; font-weight:500;">Quantidade</label>
                            <input type="number" id="qtdRapido" placeholder="0" style="width:100%; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                        </div>
                        <button type="submit" style="background:#667eea; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:500; height:42px;">
                            ✅ Cadastrar
                        </button>
                    </form>
                    <div id="msgCadastroRapido" style="margin-top:10px;"></div>
                </div>

                <div style="text-align:center; padding:20px;">
                    <div class="loading-spinner" style="font-size:32px;">⏳</div>
                    <p style="color:#667eea;">Carregando produtos...</p>
                </div>
            </section>
        `;

        document.getElementById('formCadastroRapido').addEventListener('submit', cadastrarProdutoRapido);

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
                        <tr onclick="window.abrirEdicaoProduto(${p.id}, '${p.nome.replace(/'/g, "\\'")}', ${preco}, ${qtd})" style="cursor:pointer; ${qtd === 0 ? 'background:#fff5f5;' : ''}">
                            <td>${p.id}</td>
                            <td><strong>${p.nome}</strong></td>
                            <td>${status} ${qtd} <small style="color:#666;">(${statusTexto})</small></td>
                            <td>R$ ${preco.toFixed(2).replace('.', ',')}</td>
                        </tr>
                    `;
                });
            } else {
                html = `<tr><td colspan="4" style="text-align:center; padding:40px;"><p style="font-size:48px;">📭</p><p style="color:#666;">Nenhum produto cadastrado</p></td></tr>`;
            }

            app.innerHTML = `
                <section>
                    <h2>📦 Estoque</h2>
                    <!-- Box de cadastro rápido -->
                    <div style="background:#f0f4ff; padding:20px; border-radius:12px; margin-bottom:20px; border:2px dashed #667eea;">
                        <h3 style="margin:0 0 15px 0; color:#667eea;">➕ Cadastrar Novo Produto</h3>
                        <form id="formCadastroRapido" style="display:flex; gap:15px; flex-wrap:wrap; align-items:flex-end;">
                            <div style="flex:2; min-width:150px;">
                                <label style="display:block; margin-bottom:5px; color:#4a5568; font-weight:500;">Nome</label>
                                <input type="text" id="nomeRapido" placeholder="Nome do produto" style="width:100%; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                            </div>
                            <div style="flex:1; min-width:100px;">
                                <label style="display:block; margin-bottom:5px; color:#4a5568; font-weight:500;">Preço (R$)</label>
                                <input type="number" id="precoRapido" step="0.01" placeholder="0,00" style="width:100%; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                            </div>
                            <div style="flex:1; min-width:100px;">
                                <label style="display:block; margin-bottom:5px; color:#4a5568; font-weight:500;">Quantidade</label>
                                <input type="number" id="qtdRapido" placeholder="0" style="width:100%; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                            </div>
                            <button type="submit" style="background:#667eea; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:500; height:42px;">
                                ✅ Cadastrar
                            </button>
                        </form>
                        <div id="msgCadastroRapido" style="margin-top:10px;"></div>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <div style="display:flex; gap:15px; align-items:center; flex-wrap:wrap;">
                            <span style="font-size:14px;">🟢 Normal | 🟡 Baixo (≤5) | 🔴 Esgotado</span>
                            <span style="font-size:12px; color:#666;">💡 Clique em qualquer linha para editar/excluir</span>
                        </div>
                        <button onclick="window.renderEstoque()" class="btn-primary" style="background:#667eea; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:500;">
                            🔄 Atualizar
                        </button>
                    </div>
                    <div style="background:white; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1); overflow:hidden;">
                        <div style="overflow-x:auto;">
                            <table style="width:100%; border-collapse:collapse;">
                                <thead>
                                    <tr style="background:#3957ed; border-bottom:2px solid #e2e8f0;">
                                        <th style="padding:12px; text-align:left; color:white;">ID</th>
                                        <th style="padding:12px; text-align:left; color:white;">Produto</th>
                                        <th style="padding:12px; text-align:left; color:white;">Quantidade</th>
                                        <th style="padding:12px; text-align:left; color:white;">Preço Unit.</th>
                                    </tr>
                                </thead>
                                <tbody>${html}</tbody>
                            </table>
                        </div>
                    </div>
                </section>
            `;

            document.getElementById('formCadastroRapido').addEventListener('submit', cadastrarProdutoRapido);

        } catch (error) {
            app.innerHTML = `<section><h2>📦 Estoque</h2><p style="color:red;">❌ Erro: ${error.message}</p></section>`;
        }
    }

    async function cadastrarProdutoRapido(e) {
        e.preventDefault();
        const nome = document.getElementById('nomeRapido').value.trim();
        const preco = parseFloat(document.getElementById('precoRapido').value);
        const quantidade = parseInt(document.getElementById('qtdRapido').value);
        const msg = document.getElementById('msgCadastroRapido');
        if (!nome) {
            msg.innerHTML = '<div style="color:#e53e3e;">Nome obrigatório</div>';
            return;
        }
        if (isNaN(preco) || preco < 0) {
            msg.innerHTML = '<div style="color:#e53e3e;">Preço inválido</div>';
            return;
        }
        if (isNaN(quantidade) || quantidade < 0) {
            msg.innerHTML = '<div style="color:#e53e3e;">Quantidade inválida</div>';
            return;
        }
        const result = await callAPI('cadastrarProduto', { nome, preco, quantidade }, false);
        if (result.success) {
            msg.innerHTML = '<div style="color:#38a169;">✅ Produto cadastrado!</div>';
            mostrarToast(`Produto "${nome}" cadastrado!`, 'success');
            document.getElementById('formCadastroRapido').reset();
            Cache.clear();
            renderEstoque();
        } else {
            msg.innerHTML = `<div style="color:#e53e3e;">${result.error}</div>`;
        }
    }

    // ============================================================
    // EDIÇÃO DE PRODUTO (MODAL com botão Excluir)
    // ============================================================
    window.abrirEdicaoProduto = function(id, nome, preco, quantidade) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top:0; left:0; right:0; bottom:0;
            background: rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center;
            z-index: 9999; animation: fadeIn 0.2s ease;
        `;
        overlay.innerHTML = `
            <div class="edit-modal" style="background:white; padding:30px; border-radius:12px; max-width:400px; width:90%; box-shadow:0 10px 25px rgba(0,0,0,0.2); animation: scaleIn 0.2s ease;">
                <h3 style="margin-top:0;">✏️ Editar Produto</h3>
                <p><strong>${nome}</strong> (ID: ${id})</p>
                <div style="margin-bottom:15px;">
                    <label style="display:block; margin-bottom:5px; color:#4a5568; font-weight:500;">Preço (R$)</label>
                    <input type="number" id="editPreco" step="0.01" value="${preco.toFixed(2)}" style="width:100%; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                </div>
                <div style="margin-bottom:15px;">
                    <label style="display:block; margin-bottom:5px; color:#4a5568; font-weight:500;">Quantidade</label>
                    <input type="number" id="editQuantidade" value="${quantidade}" style="width:100%; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <button id="btnSalvarEdicao" style="flex:1; background:#48bb78; color:white; border:none; padding:12px; border-radius:6px; cursor:pointer; font-weight:500;">💾 Salvar</button>
                    <button id="btnExcluirEdicao" style="flex:1; background:#e53e3e; color:white; border:none; padding:12px; border-radius:6px; cursor:pointer; font-weight:500;">🗑️ Excluir</button>
                    <button id="btnCancelarEdicao" style="flex:1; background:#e2e8f0; color:#4a5568; border:none; padding:12px; border-radius:6px; cursor:pointer; font-weight:500;">Cancelar</button>
                </div>
                <div id="msgEdicao" style="margin-top:15px;"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#btnSalvarEdicao').onclick = async () => {
            const novoPreco = parseFloat(overlay.querySelector('#editPreco').value);
            const novaQuantidade = parseInt(overlay.querySelector('#editQuantidade').value);
            if (isNaN(novoPreco) || novoPreco < 0) {
                overlay.querySelector('#msgEdicao').innerHTML = '<div style="color:#e53e3e;">Preço inválido</div>';
                return;
            }
            if (isNaN(novaQuantidade) || novaQuantidade < 0) {
                overlay.querySelector('#msgEdicao').innerHTML = '<div style="color:#e53e3e;">Quantidade inválida</div>';
                return;
            }
            const result = await callAPI('atualizarProduto', { id, preco: novoPreco, quantidade: novaQuantidade }, false);
            if (result.success) {
                mostrarToast(`Produto "${nome}" atualizado!`, 'success');
                overlay.remove();
                renderEstoque();
            } else {
                overlay.querySelector('#msgEdicao').innerHTML = `<div style="color:#e53e3e;">${result.error}</div>`;
            }
        };

        overlay.querySelector('#btnExcluirEdicao').onclick = () => {
            overlay.remove();
            window.confirmarExclusaoProduto(id, nome);
        };

        overlay.querySelector('#btnCancelarEdicao').onclick = () => overlay.remove();
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    };

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
    // VENDAS – COM DESCONTO POR PRODUTO E BOTÃO PAGAR COM PIX (CORRIGIDO)
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

                            <!-- Produtos (4 linhas) com Desconto -->
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
                                        <div style="flex:1.5; min-width:120px;">
                                            <label style="font-size:14px; color:#4a5568;">Desconto</label>
                                            <div style="display:flex; gap:5px; align-items:center;">
                                                <input type="number" id="descValor${i}" class="desc-valor" min="0" step="0.01" placeholder="0" style="flex:1; min-width:60px; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                                                <select id="descTipo${i}" class="desc-tipo" style="padding:10px; border:2px solid #e2e8f0; border-radius:6px; background:white; width:65px;">
                                                    <option value="%">%</option>
                                                    <option value="R$">R$</option>
                                                </select>
                                            </div>
                                            <span id="descAplicado${i}" style="font-size:12px; color:#e53e3e; display:block; min-height:18px;"></span>
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

                            <!-- Botão Pagar com PIX -->
                            <button type="button" id="btnMostrarPix" style="margin-top:10px; background:#1a73e8; color:white; border:none; padding:14px 24px; border-radius:8px; cursor:pointer; font-weight:500; width:100%; font-size:16px;">
                                💳 Pagar com PIX
                            </button>

                            <!-- Box de Pagamento PIX (inicialmente oculta) -->
                            <div id="pixBox" style="display:none; margin-top:10px; padding:15px; background:#f0f4ff; border-radius:8px; border:2px solid #667eea;">
                                <div style="display:flex; flex-direction:column; gap:10px;">
                                    <label style="font-weight:500; color:#2d3748;">Valor a pagar via Pix</label>
                                    <input type="number" id="valorPixVenda" step="0.01" min="0" placeholder="Digite o valor" style="width:100%; padding:12px; border:2px solid #667eea; border-radius:6px; font-size:16px;">
                                    <div style="display:flex; gap:10px;">
                                        <button type="button" id="btnGerarPix" style="flex:1; background:#48bb78; color:white; border:none; padding:12px; border-radius:6px; cursor:pointer; font-weight:500;">📱 Gerar QR Code</button>
                                        <button type="button" id="btnCancelarPix" style="flex:1; background:#e2e8f0; color:#4a5568; border:none; padding:12px; border-radius:6px; cursor:pointer; font-weight:500;">Cancelar</button>
                                    </div>
                                    <div id="msgPixVenda" style="margin-top:5px;"></div>
                                </div>
                            </div>

                            <button type="submit" style="margin-top:10px; background:#48bb78; color:white; border:none; padding:14px 24px; border-radius:8px; cursor:pointer; font-weight:500; width:100%; font-size:16px;">
                                💰 Registrar Venda
                            </button>
                        </form>
                        <div id="msgVenda" style="margin-top:20px;"></div>
                    </div>
                </section>
            `;

            // Função para calcular totais, subtotais e descontos
            function calcularTotais() {
                let totalGeral = 0;
                for (let i = 1; i <= 4; i++) {
                    const select = document.getElementById(`produto${i}`);
                    const qtdInput = document.getElementById(`qtd${i}`);
                    const subtotalSpan = document.getElementById(`subtotal${i}`);
                    const descValorInput = document.getElementById(`descValor${i}`);
                    const descTipoSelect = document.getElementById(`descTipo${i}`);
                    const descAplicadoSpan = document.getElementById(`descAplicado${i}`);

                    const qtd = parseInt(qtdInput.value) || 0;
                    const option = select.options[select.selectedIndex];
                    let subtotal = 0;
                    let descontoAplicado = 0;
                    let descontoTexto = '';
                    let subtotalFinal = 0;

                    if (select.selectedIndex > 0 && option && qtd > 0) {
                        const preco = parseFloat(option.dataset.preco || 0);
                        subtotal = preco * qtd;

                        const descValor = parseFloat(descValorInput.value) || 0;
                        const descTipo = descTipoSelect.value;

                        if (descValor > 0) {
                            if (descTipo === '%') {
                                descontoAplicado = (subtotal * descValor) / 100;
                                if (descontoAplicado > subtotal) descontoAplicado = subtotal;
                                descontoTexto = `-${descValor}% (R$ ${descontoAplicado.toFixed(2).replace('.', ',')})`;
                            } else {
                                descontoAplicado = Math.min(descValor, subtotal);
                                descontoTexto = `- R$ ${descontoAplicado.toFixed(2).replace('.', ',')}`;
                            }
                        }
                        subtotalFinal = subtotal - descontoAplicado;
                    } else if (select.selectedIndex === 0 || !option) {
                        subtotalFinal = 0;
                        descontoTexto = '';
                    }

                    subtotalSpan.textContent = `R$ ${subtotalFinal.toFixed(2).replace('.', ',')}`;
                    descAplicadoSpan.textContent = descontoTexto;
                    if (descontoAplicado > 0) {
                        descAplicadoSpan.style.color = '#e53e3e';
                    } else {
                        descAplicadoSpan.textContent = '';
                    }

                    totalGeral += subtotalFinal;
                }
                document.getElementById('totalVenda').textContent = `R$ ${totalGeral.toFixed(2).replace('.', ',')}`;

                // Atualiza campo de valor Pix com o total (sugestão)
                const valorPixInput = document.getElementById('valorPixVenda');
                if (valorPixInput && !valorPixInput.value) {
                    valorPixInput.value = totalGeral.toFixed(2);
                }

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
            document.querySelectorAll('.produto-select, .qtd-produto, .desc-valor, .desc-tipo').forEach(el => {
                el.addEventListener('change', calcularTotais);
                el.addEventListener('input', calcularTotais);
            });
            document.getElementById('valorPago').addEventListener('input', calcularTotais);

            // Lógica do botão Pagar com PIX (CORRIGIDA)
            const btnMostrarPix = document.getElementById('btnMostrarPix');
            const pixBox = document.getElementById('pixBox');
            const btnGerarPix = document.getElementById('btnGerarPix');
            const btnCancelarPix = document.getElementById('btnCancelarPix');
            const valorPixInput = document.getElementById('valorPixVenda');
            const msgPixVenda = document.getElementById('msgPixVenda');

            btnMostrarPix.addEventListener('click', function() {
                if (pixBox.style.display === 'none') {
                    const totalSpan = document.getElementById('totalVenda');
                    const total = parseFloat(totalSpan.textContent.replace('R$ ', '').replace(',', '.')) || 0;
                    valorPixInput.value = total.toFixed(2);
                    pixBox.style.display = 'block';
                    btnMostrarPix.textContent = 'Ocultar Pix';
                } else {
                    pixBox.style.display = 'none';
                    btnMostrarPix.textContent = '💳 Pagar com PIX';
                }
            });

            // Cancelar apenas fecha a box, sem qualquer confirmação
            btnCancelarPix.addEventListener('click', function() {
                pixBox.style.display = 'none';
                btnMostrarPix.textContent = '💳 Pagar com PIX';
                msgPixVenda.innerHTML = '';
            });

            btnGerarPix.addEventListener('click', function() {
                const valor = parseFloat(valorPixInput.value);
                if (isNaN(valor) || valor <= 0) {
                    msgPixVenda.innerHTML = '<div style="color:#e53e3e;">Valor inválido</div>';
                    return;
                }
                const cliente = document.getElementById('clienteSelect').value || 'Cliente';
                msgPixVenda.innerHTML = '';
                gerarQrCodePix(valor, `Venda para ${cliente}`);
            });

            document.getElementById('formVendaMultipla').addEventListener('submit', registrarVendaMultipla);
            calcularTotais();

        } catch (error) {
            app.innerHTML = `<section><h2>💰 Registrar Venda</h2><p style="color:red;">❌ Erro: ${error.message}</p></section>`;
        }
    }

    // ============================================================
    // REGISTRAR VENDA MÚLTIPLA (com desconto por produto e QR Code)
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
        let resumoItens = [];

        for (let i = 1; i <= 4; i++) {
            const select = document.getElementById(`produto${i}`);
            const qtdInput = document.getElementById(`qtd${i}`);
            const descValorInput = document.getElementById(`descValor${i}`);
            const descTipoSelect = document.getElementById(`descTipo${i}`);

            const qtd = parseInt(qtdInput.value) || 0;
            if (qtd > 0 && select.selectedIndex > 0) {
                const option = select.options[select.selectedIndex];
                const produtoId = option.value;
                const precoOriginal = parseFloat(option.dataset.preco || 0);
                const nomeProduto = option.dataset.nome || '';
                const disponivel = parseInt(option.dataset.quantidade || 0);

                if (qtd > disponivel) {
                    msg.innerHTML = `<div style="padding:12px;background:#fed7d7;color:#9b2c2c;border-radius:6px;">❌ Estoque insuficiente para "${nomeProduto}". Disponível: ${disponivel}</div>`;
                    return;
                }

                const subtotal = precoOriginal * qtd;
                const descValor = parseFloat(descValorInput.value) || 0;
                const descTipo = descTipoSelect.value;
                let descontoAplicado = 0;

                if (descValor > 0) {
                    if (descTipo === '%') {
                        descontoAplicado = (subtotal * descValor) / 100;
                        if (descontoAplicado > subtotal) descontoAplicado = subtotal;
                    } else {
                        descontoAplicado = Math.min(descValor, subtotal);
                    }
                }

                const precoUnitarioFinal = (subtotal - descontoAplicado) / qtd;
                const totalItem = subtotal - descontoAplicado;

                itens.push({
                    produtoId,
                    quantidade: qtd,
                    precoUnitario: precoUnitarioFinal,
                    desconto: descontoAplicado,
                    descontoTipo: descTipo,
                    descontoValor: descValor
                });

                totalVenda += totalItem;
                if (descontoAplicado > 0) {
                    resumoItens.push(`${qtd}x ${nomeProduto} (desc: ${descValor}${descTipo === '%' ? '%' : 'R$'})`);
                } else {
                    resumoItens.push(`${qtd}x ${nomeProduto}`);
                }
            }
        }

        if (itens.length === 0) {
            msg.innerHTML = '<div style="padding:12px;background:#fed7d7;color:#9b2c2c;border-radius:6px;">❌ Adicione pelo menos um produto com quantidade > 0</div>';
            return;
        }

        const troco = valorPago - totalVenda;
        let mensagemConfirmacao;
        if (troco >= 0) {
            mensagemConfirmacao = `Confirmar venda para ${cliente}?<br><br>Itens: ${resumoItens.join(', ')}<br><br>Total com desconto: R$ ${totalVenda.toFixed(2).replace('.', ',')}<br>Valor Pago: R$ ${valorPago.toFixed(2).replace('.', ',')}<br>Troco: R$ ${troco.toFixed(2).replace('.', ',')}`;
        } else {
            mensagemConfirmacao = `Confirmar venda para ${cliente}?<br><br>Itens: ${resumoItens.join(', ')}<br><br>Total com desconto: R$ ${totalVenda.toFixed(2).replace('.', ',')}<br>Valor Pago: R$ ${valorPago.toFixed(2).replace('.', ',')}<br>⚠️ Pendente: R$ ${Math.abs(troco).toFixed(2).replace('.', ',')}`;
        }

        confirmarAcao(
            mensagemConfirmacao,
            async () => {
                try {
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
                            precoUnitario: item.precoUnitario,
                            desconto: item.desconto,
                            descontoTipo: item.descontoTipo,
                            descontoValor: item.descontoValor
                        }, false);
                        if (!result.success) {
                            mostrarToast(`Erro no item: ${result.error}`, 'error');
                            todasOk = false;
                            break;
                        }
                    }

                    if (todasOk) {
                        if (valorPago > 0) {
                            await callAPI('registrarPagamento', {
                                cliente: cliente,
                                valor: valorPago,
                                observacao: `Pagamento da venda de R$ ${totalVenda.toFixed(2)}`
                            }, false);
                        }

                        let msgVenda = `
                            <div style="padding:15px;background:#c6f6d5;color:#22543d;border-radius:6px; animation: slideInRight 0.3s ease;">
                                <strong>✅ Venda registrada com sucesso!</strong><br>
                                Cliente: ${cliente}<br>
                                Total com descontos: R$ ${totalVenda.toFixed(2).replace('.', ',')}<br>
                                Valor Pago: R$ ${valorPago.toFixed(2).replace('.', ',')}
                                ${troco >= 0 ? `<br>Troco: R$ ${troco.toFixed(2).replace('.', ',')}` : `<br>⚠️ Pendente: R$ ${Math.abs(troco).toFixed(2).replace('.', ',')}`}
                            </div>
                            <div style="margin-top:15px; text-align:center; display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
                                <button onclick="gerarQrCodePix(${totalVenda}, 'Venda para ${cliente}')" 
                                        style="background:#1a73e8; color:white; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:500; font-size:14px; flex:1; min-width:200px;">
                                    📱 Gerar QR Code Pix - R$ ${totalVenda.toFixed(2).replace('.', ',')}
                                </button>
                                <button onclick="document.getElementById('msgVenda').innerHTML=''" 
                                        style="background:#667eea; color:white; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:500; font-size:14px; flex:1; min-width:200px;">
                                    ✅ Nova Venda
                                </button>
                            </div>
                        `;
                        msg.innerHTML = msgVenda;
                        mostrarToast(`Venda de R$ ${totalVenda.toFixed(2).replace('.', ',')} registrada!`, 'success');

                        document.querySelectorAll('.qtd-produto').forEach(el => el.value = 0);
                        document.querySelectorAll('.produto-select').forEach(el => el.selectedIndex = 0);
                        document.querySelectorAll('.desc-valor').forEach(el => el.value = '');
                        document.querySelectorAll('.desc-tipo').forEach(el => el.selectedIndex = 0);
                        document.querySelectorAll('#subtotal1, #subtotal2, #subtotal3, #subtotal4').forEach(el => el.textContent = 'R$ 0,00');
                        document.getElementById('totalVenda').textContent = 'R$ 0,00';
                        document.getElementById('trocoOuPendente').textContent = 'R$ 0,00';
                        document.getElementById('valorPago').value = '';
                        document.querySelectorAll('.desc-aplicado').forEach(el => el.textContent = '');
                        document.getElementById('qrCodeValor').textContent = '0,00';

                        Cache.clear();
                        await carregarClientesDropdown();
                    }
                } catch (error) {
                    msg.innerHTML = `<div style="padding:12px;background:#fed7d7;color:#9b2c2c;border-radius:6px;">❌ Erro: ${error.message}</div>`;
                } finally {
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
    // CLIENTES – COM COMPARTILHAMENTO VIA WHATSAPP E PAGAMENTO PIX
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
                                <th style="padding:12px; text-align:left; color:white;">Cliente</th>
                                <th style="padding:12px; text-align:left; color:white;">Total Gasto</th>
                                <th style="padding:12px; text-align:left; color:white;">Total Pago</th>
                                <th style="padding:12px; text-align:left; color:white;">Saldo</th>
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

    // ============================================================
    // DETALHES DO CLIENTE – COMPRAS + PAGAMENTOS + WHATSAPP + PIX
    // ============================================================
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

            let totalGasto = 0, totalPago = 0;
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

                    let nomeProduto = h.produto || '-';
                    let observacao = '';
                    const descRegex = /\(desc:\s*(.*?)\)/;
                    const match = nomeProduto.match(descRegex);
                    if (match) {
                        observacao = match[1].trim();
                        nomeProduto = nomeProduto.replace(descRegex, '').trim();
                    }

                    return `
                        <tr>
                            <td>${dataFormatada}</td>
                            <td>${nomeProduto}</td>
                            <td>${h.quantidade || 1}</td>
                            <td>R$ ${(parseFloat(h.total) || 0).toFixed(2).replace('.', ',')}</td>
                            <td>${observacao || ''}</td>
                        </tr>
                    `;
                }).join('');
            } else {
                comprasHtml = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#666;">Nenhuma compra encontrada</td></tr>`;
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

                    <!-- Botão Compartilhar WhatsApp -->
                    <div style="margin-bottom:15px;">
                        <button onclick="window.compartilharExtrato('${nomeCliente.replace(/'/g, "\\'")}')" style="background:#25D366; color:white; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:500; width:100%;">
                            📱 Compartilhar Extrato via WhatsApp
                        </button>
                    </div>

                    <!-- Abas -->
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
                                        <th style="padding:10px; text-align:left; color:white;">Data</th>
                                        <th style="padding:10px; text-align:left; color:white;">Produto</th>
                                        <th style="padding:10px; text-align:left; color:white;">Qtd</th>
                                        <th style="padding:10px; text-align:left; color:white;">Valor</th>
                                        <th style="padding:10px; text-align:left; color:white;">Observação</th>
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
                                        <th style="padding:10px; text-align:left; color:white;">Data</th>
                                        <th style="padding:10px; text-align:left; color:white;">Valor</th>
                                        <th style="padding:10px; text-align:left; color:white;">Observação</th>
                                    </tr>
                                </thead>
                                <tbody>${pagamentosHtml}</tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Bloco Registrar Pagamento -->
                    <div style="padding:20px; background:#f7fafc; border-radius:8px; border:1px solid #e2e8f0; margin-top:20px;">
                        <h4 style="margin:0 0 15px 0;">💳 Registrar Pagamento (dinheiro/cartão)</h4>
                        <div style="display:flex; gap:10px; flex-wrap:wrap;">
                            <input type="number" id="valorPagamentoDetalhe" placeholder="Valor do pagamento" min="0.01" step="0.01" style="flex:1; padding:12px; border:2px solid #e2e8f0; border-radius:6px; min-width:150px;">
                            <button onclick="window.registrarPagamentoClienteDetalhe('${nomeCliente.replace(/'/g, "\\'")}')" style="background:#48bb78; color:white; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-weight:500; white-space:nowrap;">
                                💵 Registrar Pagamento
                            </button>
                        </div>
                        <div id="msgPagamentoDetalhe" style="margin-top:15px;"></div>
                    </div>

                    <!-- Bloco Pagar via Pix -->
                    <div style="padding:20px; background:#f0f4ff; border-radius:8px; border:1px solid #667eea; margin-top:20px;">
                        <h4 style="margin:0 0 15px 0;">📱 Pagar via Pix</h4>
                        <div style="display:flex; gap:10px; flex-wrap:wrap;">
                            <input type="number" id="valorPixCliente" placeholder="Valor a pagar" min="0.01" step="0.01" style="flex:1; padding:12px; border:2px solid #667eea; border-radius:6px; min-width:150px;">
                            <button onclick="window.gerarPixParaCliente('${nomeCliente.replace(/'/g, "\\'")}')" style="background:#1a73e8; color:white; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-weight:500; white-space:nowrap;">
                                📱 Gerar QR Code Pix
                            </button>
                        </div>
                        <div id="msgPixCliente" style="margin-top:15px;"></div>
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

    // ============================================================
    // GERAR PIX PARA CLIENTE
    // ============================================================
    window.gerarPixParaCliente = function(nomeCliente) {
        const valorInput = document.getElementById('valorPixCliente');
        const msgDiv = document.getElementById('msgPixCliente');
        if (!valorInput || !msgDiv) return;

        const valor = parseFloat(valorInput.value);
        if (isNaN(valor) || valor <= 0) {
            msgDiv.innerHTML = '<div style="padding:10px;background:#fed7d7;color:#9b2c2c;border-radius:4px;">❌ Informe um valor válido</div>';
            return;
        }

        msgDiv.innerHTML = '';
        gerarQrCodePix(valor, `Pagamento de ${nomeCliente}`);
    };

    // ============================================================
    // COMPARTILHAR EXTRATO VIA WHATSAPP
    // ============================================================
    window.compartilharExtrato = async function(nomeCliente) {
        try {
            const [historicoCompras, historicoPagamentos, resumoCliente] = await Promise.all([
                callAPI('listarDetalhesCliente', { cliente: nomeCliente }, false),
                callAPI('listarPagamentosPorCliente', { cliente: nomeCliente }, false),
                callAPI('listarVendasPorCliente', null, false)
            ]);
            let totalGasto = 0, totalPago = 0;
            if (resumoCliente.success && resumoCliente.clientes) {
                const cliente = resumoCliente.clientes.find(c => c.nome.toLowerCase() === nomeCliente.toLowerCase());
                if (cliente) {
                    totalGasto = parseFloat(cliente.totalGasto) || 0;
                    totalPago = parseFloat(cliente.totalPago) || 0;
                }
            }
            const saldo = totalGasto - totalPago;
            let texto = `📋 EXTRATO DO CLIENTE\n\n`;
            texto += `👤 Nome: ${nomeCliente}\n`;
            texto += `💰 Total Gasto: R$ ${totalGasto.toFixed(2).replace('.', ',')}\n`;
            texto += `💵 Total Pago: R$ ${totalPago.toFixed(2).replace('.', ',')}\n`;
            texto += `📊 Saldo: R$ ${Math.abs(saldo).toFixed(2).replace('.', ',')} (${saldo > 0 ? 'A pagar' : saldo < 0 ? 'Crédito' : 'Quitado'})\n\n`;
            texto += `🛒 COMPRAS:\n`;
            if (historicoCompras.success && historicoCompras.historico && historicoCompras.historico.length > 0) {
                historicoCompras.historico.forEach(h => {
                    const data = h.data ? new Date(h.data) : new Date();
                    const dataStr = data.toLocaleDateString('pt-BR');
                    texto += `- ${dataStr}: ${h.produto} (${h.quantidade}x) = R$ ${(parseFloat(h.total)||0).toFixed(2).replace('.', ',')}\n`;
                });
            } else {
                texto += `Nenhuma compra encontrada.\n`;
            }
            texto += `\n💳 PAGAMENTOS:\n`;
            if (historicoPagamentos.success && historicoPagamentos.pagamentos && historicoPagamentos.pagamentos.length > 0) {
                historicoPagamentos.pagamentos.forEach(p => {
                    const data = p.data ? new Date(p.data) : new Date();
                    const dataStr = data.toLocaleDateString('pt-BR');
                    texto += `- ${dataStr}: R$ ${(parseFloat(p.valor)||0).toFixed(2).replace('.', ',')} (${p.observacao || '-'})\n`;
                });
            } else {
                texto += `Nenhum pagamento encontrado.\n`;
            }
            const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
            window.open(url, '_blank');
        } catch (error) {
            mostrarToast('Erro ao gerar extrato: ' + error.message, 'error');
        }
    };

    // ============================================================
    // REGISTRAR PAGAMENTO (dentro dos detalhes do cliente)
    // ============================================================
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
    window.renderEstoque = renderEstoque;
    window.renderVendas = renderVendas;
    window.renderClientes = renderClientes;
    window.carregarTabelaClientes = carregarTabelaClientes;
    window.mostrarToast = mostrarToast;
    window.confirmarAcao = confirmarAcao;
    window.mostrarDetalhesCliente = window.mostrarDetalhesCliente;
    window.cadastrarNovoCliente = window.cadastrarNovoCliente;
    window.abrirEdicaoProduto = window.abrirEdicaoProduto;
    window.confirmarExclusaoProduto = window.confirmarExclusaoProduto;
    window.registrarPagamentoClienteDetalhe = window.registrarPagamentoClienteDetalhe;
    window.compartilharExtrato = window.compartilharExtrato;
    window.gerarQrCodePix = gerarQrCodePix;
    window.gerarPixParaCliente = window.gerarPixParaCliente;

    console.log('🚀 Sistema de Vendas v5.2 – Pagamento Pix com botão e valor personalizado (corrigido)');
})();
