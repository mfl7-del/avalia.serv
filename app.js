// Carregar profissionais do localStorage
const storedProfessionals = localStorage.getItem('professionals');
if (storedProfessionals) {
    professionals.push(...JSON.parse(storedProfessionals));
}

// UTILITÁRIOS DE SEGURANÇA
const SecurityUtils = {
    // Sanitização básica contra XSS
    sanitizeInput: (input) => {
        if (typeof input !== 'string') return input;
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    },

    // Validação de email
    validateEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Validação de telefone brasileiro
    validatePhone: (phone) => {
        const phoneRegex = /^\(?(\d{2})\)?\s?9?\d{4}-?\d{4}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
    },

    // Validação de senha (mínimo 8 caracteres, pelo menos uma letra e um número)
    validatePassword: (password) => {
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
        return passwordRegex.test(password);
    },

    // Limitação de tentativas (simulado)
    rateLimit: (() => {
        const attempts = {};
        return (key, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
            const now = Date.now();
            if (!attempts[key]) {
                attempts[key] = { count: 1, resetTime: now + windowMs };
                return true;
            }

            if (now > attempts[key].resetTime) {
                attempts[key] = { count: 1, resetTime: now + windowMs };
                return true;
            }

            if (attempts[key].count >= maxAttempts) {
                return false;
            }

            attempts[key].count++;
            return true;
        };
    })(),

    // Log de segurança
    logSecurityEvent: (event, details) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event,
            details,
            userAgent: navigator.userAgent,
            ip: 'simulated' // Em produção, seria obtido do servidor
        };
        console.warn('🔒 SECURITY LOG:', logEntry);

        // Em produção, enviaria para um serviço de logging
        const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
        logs.push(logEntry);
        localStorage.setItem('security_logs', JSON.stringify(logs.slice(-100))); // Manter apenas os últimos 100 logs
    },

    // Verificação de sessão
    validateSession: () => {
        const sessionStart = localStorage.getItem('session_start');
        const maxSessionTime = 24 * 60 * 60 * 1000; // 24 horas

        if (!sessionStart) return false;

        const sessionAge = Date.now() - parseInt(sessionStart);
        if (sessionAge > maxSessionTime) {
            SecurityUtils.logSecurityEvent('SESSION_EXPIRED', { sessionAge });
            logout();
            return false;
        }

        return true;
    }
};

const professionals = [
    {
        id: 1,
        name: "João Silva",
        specialty: "Eletricista",
        category: "Manutenção",
        function: "Instalação Elétrica",
        status: "online",
        photo: "",
        gender: "Masculino",
        age: 35,
        phone: "(11) 99999-9999",
        whatsapp: "5511999999999",
        documents: ["Carteira de Eletricista", "Certificado de Segurança"],
        formations: ["Curso Técnico em Eletricidade", "Especialização em Instalações Residenciais"],
        portfolio: ["trabalho1.jpg", "trabalho2.jpg"],
        description: "Especialista em instalações elétricas residenciais e comerciais.",
        location: "São Paulo, SP",
        experience: "5 anos",
        reviews: [
            { user: "Maria", text: "Excelente trabalho, muito profissional!", date: "2023-10-01", rating: 5 },
            { user: "Pedro", text: "Chegou no horário e resolveu tudo rapidamente.", date: "2023-09-15", rating: 4 }
        ],
        messages: [
            { type: "system", text: "Olá! Como posso ajudar?", time: "10:00" }
        ]
    },
    {
        id: 2,
        name: "Ana Costa",
        specialty: "Encanadora",
        category: "Manutenção",
        function: "Reparos Hidráulicos",
        status: "offline",
        photo: "",
        gender: "Feminino",
        age: 28,
        phone: "(21) 98888-8888",
        whatsapp: "5521988888888",
        documents: ["Registro Profissional de Encanador"],
        formations: ["Curso de Encanamento Básico", "Treinamento em Emergências"],
        portfolio: ["encanamento1.jpg"],
        description: "Serviços de encanamento para emergências e manutenções.",
        location: "Rio de Janeiro, RJ",
        experience: "8 anos",
        reviews: [
            { user: "Carlos", text: "Muito atenciosa e eficiente.", date: "2023-09-20", rating: 5 }
        ],
        messages: []
    },
    {
        id: 3,
        name: "Carlos Mendes",
        specialty: "Pintor",
        category: "Construção",
        function: "Pintura Interna/Externa",
        status: "online",
        photo: "",
        gender: "Masculino",
        age: 42,
        phone: "(31) 97777-7777",
        whatsapp: "5531977777777",
        documents: ["Licença de Pintor", "Certificado de Qualidade"],
        formations: ["Curso de Pintura Decorativa", "Especialização em Tintas Ecológicas"],
        portfolio: ["pintura1.jpg", "pintura2.jpg", "pintura3.jpg"],
        description: "Pintura interna e externa, com materiais de qualidade.",
        location: "Belo Horizonte, MG",
        experience: "10 anos",
        reviews: [
            { user: "Laura", text: "Resultado impecável!", date: "2023-08-30", rating: 5 }
        ],
        messages: []
    }
];

let selectedProfessional = null;
let currentTab = 'chat';

// Função para renderizar a lista de profissionais com filtros
function renderProfessionals() {
    const categoryFilter = document.getElementById('category-filter').value;
    const functionFilter = document.getElementById('function-filter').value;
    const cityFilter = document.getElementById('city-filter').value;
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const grid = document.getElementById('professionals-list');
    grid.innerHTML = '';

    const filtered = professionals.filter(prof => {
        const matchesCategory = !categoryFilter || prof.category === categoryFilter;
        const matchesFunction = !functionFilter || prof.function === functionFilter;
        const matchesCity = !cityFilter || prof.location.includes(cityFilter);
        const matchesSearch = !searchTerm ||
            prof.name.toLowerCase().includes(searchTerm) ||
            prof.specialty.toLowerCase().includes(searchTerm) ||
            prof.description.toLowerCase().includes(searchTerm);
        return matchesCategory && matchesFunction && matchesCity && matchesSearch;
    });

    filtered.forEach(prof => {
        const avgRating = prof.reviews.length > 0
            ? (prof.reviews.reduce((sum, r) => sum + r.rating, 0) / prof.reviews.length).toFixed(1)
            : 0;

        const card = document.createElement('div');
        card.className = 'professional-card';
        card.onclick = () => openProfessionalModal(prof.id);
        card.innerHTML = `
            <div class="professional-header">
                <div class="status-indicator status-${prof.status}"></div>
                <div class="professional-avatar">${prof.name.charAt(0)}</div>
                <div class="professional-name">${prof.name}</div>
                <div class="professional-specialty">${prof.specialty}</div>
                <div class="professional-rating">
                    <div class="rating-stars">${'⭐'.repeat(Math.floor(avgRating))}</div>
                    <span class="rating-score">${avgRating} (${prof.reviews.length})</span>
                </div>
            </div>
            <div class="professional-body">
                <div class="professional-info">
                    <div class="info-item">
                        <div class="info-label">Categoria</div>
                        <div class="info-value">${prof.category}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Localização</div>
                        <div class="info-value">${prof.location}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Experiência</div>
                        <div class="info-value">${prof.experience}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Função</div>
                        <div class="info-value">${prof.function}</div>
                    </div>
                </div>
                <div class="professional-description">${prof.description}</div>
                <div class="professional-actions">
                    <button class="btn-primary" onclick="event.stopPropagation(); openProfessionalModal(${prof.id})">Ver Perfil</button>
                    <button class="btn-outline" onclick="event.stopPropagation(); startChat(${prof.id})">Conversar</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Função para selecionar um profissional
function selectProfessional(id) {
    selectedProfessional = professionals.find(p => p.id === id);
    updateProfileHeader();
    updateDetailedProfile();
    updateChat();
    updateReviews();
    showTab('profile');

    // Destacar item selecionado
    document.querySelectorAll('.professional-item').forEach(item => item.classList.remove('selected'));
    event.currentTarget.classList.add('selected');

    // Modo tela cheia para o perfil
    document.getElementById('main-content').classList.add('fullscreen-mode');
}

// Função para atualizar o header do perfil
function updateProfileHeader() {
    const header = document.getElementById('profile-header');
    const backBtn = document.getElementById('back-btn');
    if (selectedProfessional) {
        header.querySelector('h3').textContent = selectedProfessional.name;
        header.querySelector('.profile-photo-large').textContent = selectedProfessional.name.charAt(0);
        header.querySelector('.status').className = `status ${selectedProfessional.status}`;
        header.querySelector('small').textContent = selectedProfessional.status === 'online' ? 'Online' : 'Offline';
        backBtn.style.display = 'block';
    } else {
        header.querySelector('h3').textContent = 'Selecione um profissional';
        header.querySelector('.profile-photo-large').textContent = '?';
        header.querySelector('.status').className = 'status offline';
        header.querySelector('small').textContent = 'Offline';
        backBtn.style.display = 'none';
    }
}
    const details = document.getElementById('profile-details');
    if (selectedProfessional) {
        const avgRating = selectedProfessional.reviews.length > 0 
            ? (selectedProfessional.reviews.reduce((sum, r) => sum + r.rating, 0) / selectedProfessional.reviews.length).toFixed(1)
            : 0;
        details.innerHTML = `
            <h3>${selectedProfessional.name}</h3>
            <p><strong>Gênero:</strong> ${selectedProfessional.gender}</p>
            <p><strong>Idade:</strong> ${selectedProfessional.age} anos</p>
            <p><strong>Especialidade:</strong> ${selectedProfessional.specialty}</p>
            <p><strong>Categoria:</strong> ${selectedProfessional.category}</p>
            <p><strong>Função:</strong> ${selectedProfessional.function}</p>
            <p><strong>Localização:</strong> ${selectedProfessional.location}</p>
            <p><strong>Experiência:</strong> ${selectedProfessional.experience}</p>
            <p><strong>Avaliação Média:</strong> ${avgRating} ⭐ (${selectedProfessional.reviews.length} avaliações)</p>
            <p><strong>Descrição:</strong> ${selectedProfessional.description}</p>
            <h4>Documentos</h4>
            <ul>${selectedProfessional.documents.map(doc => `<li>${doc}</li>`).join('')}</ul>
            <h4>Formações Profissionalizantes</h4>
            <ul>${selectedProfessional.formations.map(form => `<li>${form}</li>`).join('')}</ul>
            <h4>Portfólio de Trabalhos</h4>
            <div class="portfolio">${selectedProfessional.portfolio.map(img => `<img src="${img}" alt="Trabalho" style="width: 100px; margin: 5px;">`).join('')}</div>
        `;
    } else {
        details.innerHTML = '<p>Selecione um profissional para ver o perfil detalhado.</p>';
    }


// Função para atualizar o chat
function updateChat() {
    const chatWindow = document.getElementById('chat-window');
    if (selectedProfessional) {
        chatWindow.innerHTML = selectedProfessional.messages.map(msg => `
            <div class="chat-message ${msg.type}">
                ${msg.text}
                <small>${msg.time}</small>
            </div>
        `).join('');
        chatWindow.scrollTop = chatWindow.scrollHeight;
    } else {
        chatWindow.innerHTML = '<p>Selecione um profissional para iniciar o chat.</p>';
    }
}

// Função para enviar mensagem
function sendMessage(event) {
    event.preventDefault();
    if (!selectedProfessional) return;

    const input = event.target.querySelector('input');
    const text = input.value.trim();
    if (!text) return;

    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    selectedProfessional.messages.push({ type: 'user', text, time });
    input.value = '';

    // Simular resposta do sistema
    setTimeout(() => {
        const responses = [
            "Obrigado pela mensagem! Em que posso ajudar?",
            "Entendi. Vou verificar a disponibilidade.",
            "Pode deixar, cuido disso para você."
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];
        selectedProfessional.messages.push({ type: 'system', text: response, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) });
        updateChat();
    }, 1000);
}

// Função para mostrar aba
function showTab(tab) {
    currentTab = tab;
    document.getElementById('profile-tab').classList.toggle('hidden', tab !== 'profile');
    document.getElementById('chat-tab').classList.toggle('hidden', tab !== 'chat');
    document.getElementById('reviews-tab').classList.toggle('hidden', tab !== 'reviews');
    document.querySelectorAll('.tabs button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

// Função para atualizar avaliações
function updateReviews() {
    const list = document.getElementById('review-list');
    if (selectedProfessional) {
        list.innerHTML = selectedProfessional.reviews.map(review => `
            <div class="review-item">
                <strong>${review.user}</strong> - ${'⭐'.repeat(review.rating)}
                <p>${review.text}</p>
                <small>${review.date}</small>
            </div>
        `).join('');
    } else {
        list.innerHTML = '<p>Selecione um profissional para ver as avaliações.</p>';
    }
}

// Função para adicionar avaliação
function addReview(event) {
    event.preventDefault();
    if (!selectedProfessional) return;

    const text = document.getElementById('review-text').value.trim();
    if (!text) return;

    selectedProfessional.reviews.push({
        user: "Você",
        text,
        date: new Date().toLocaleDateString()
    });
    document.getElementById('review-text').value = '';
    updateReviews();
}

// Função para alternar tema
function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.toggle('theme-dark');
    const btn = document.getElementById('theme-toggle');

    // Salvar preferência no localStorage
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Atualizar texto e ícone do botão
    if (isDark) {
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
            Tema Claro
        `;
    } else {
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
            </svg>
            Tema Escuro
        `;
    }
}

// Verificar se usuário está logado ao carregar
// Verificar se usuário está logado ao carregar
document.addEventListener('DOMContentLoaded', () => {
    // Log de inicialização
    SecurityUtils.logSecurityEvent('APP_INITIALIZED', {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
    });

    // Carregar tema salvo
    const savedTheme = localStorage.getItem('theme');
    const btn = document.getElementById('theme-toggle');

    if (savedTheme === 'dark') {
        document.body.classList.add('theme-dark');
        if (btn) {
            btn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
                Tema Claro
            `;
        }
    } else if (btn) {
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
            </svg>
            Tema Escuro
        `;
    }

    // Verificar sessão válida
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
    const sessionValid = SecurityUtils.validateSession();

    if (isLoggedIn && sessionValid) {
        SecurityUtils.logSecurityEvent('SESSION_VALID', {
            userId: JSON.parse(localStorage.getItem('current_user') || '{}').id
        });
        showMainContent();
    } else {
        if (isLoggedIn && !sessionValid) {
            SecurityUtils.logSecurityEvent('SESSION_EXPIRED_ON_LOAD');
            logout(); // Logout automático se sessão expirou
        }
        showLoginModal();
    }

    // Adicionar event listeners para botões que existem sempre
    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', loginWithGoogle);
    }

    // Event listener para formulário de cadastro
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', signupUser);
    }

    // Event listener para seleção de tipo de conta
    const accountTypeRadios = document.querySelectorAll('input[name="account-type"]');
    accountTypeRadios.forEach(radio => {
        radio.addEventListener('change', toggleProfessionalFields);
    });

    // Verificação periódica de sessão (a cada 5 minutos)
    setInterval(() => {
        if (localStorage.getItem('loggedIn') === 'true' && !SecurityUtils.validateSession()) {
            SecurityUtils.logSecurityEvent('SESSION_EXPIRED_PERIODIC_CHECK');
            logout();
        }
    }, 5 * 60 * 1000);
});

// Inicialização do app (apenas se logado)
function initApp() {
    // Atualizar informações do perfil do usuário
    const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
    if (currentUser.name) {
        document.querySelector('.profile-name').textContent = currentUser.name;
        document.querySelector('.profile-email').textContent = currentUser.email;
        document.querySelector('.profile-type').textContent = currentUser.type === 'professional' ? 'Profissional' : 'Cliente';

        // Atualizar avatar com inicial do nome
        const avatar = document.querySelector('.profile-avatar');
        if (avatar) {
            avatar.textContent = currentUser.name.charAt(0).toUpperCase();
        }
    }

    renderProfessionals();
    document.getElementById('theme-toggle').onclick = toggleTheme;
    document.getElementById('category-filter').onchange = renderProfessionals;
    document.getElementById('function-filter').onchange = renderProfessionals;
    document.getElementById('city-filter').onchange = renderProfessionals;
    document.getElementById('search-input').oninput = renderProfessionals;

    // Event listeners para perfil e doação
    document.getElementById('user-profile-card').onclick = openProfileModal;
}

// Função para mostrar modal de login
function showLoginModal() {
    document.getElementById('signup-modal').classList.add('hidden');
    document.getElementById('login-modal').classList.remove('hidden');
    document.getElementById('main-content').classList.add('hidden');
}

// Função para mostrar modal de cadastro
function showSignupModal() {
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('signup-modal').classList.remove('hidden');

    // Garantir que "Cliente" esteja selecionado por padrão e campos profissionais ocultos
    const clientRadio = document.querySelector('input[name="account-type"][value="client"]');
    if (clientRadio) {
        clientRadio.checked = true;
        toggleProfessionalFields();
    }
}

// Função para alternar campos profissionais baseado no tipo de conta
function toggleProfessionalFields() {
    const accountType = document.querySelector('input[name="account-type"]:checked').value;
    const professionalFields = document.querySelector('.professional-fields');

    if (accountType === 'professional') {
        professionalFields.style.display = 'block';
        professionalFields.style.maxHeight = professionalFields.scrollHeight + 'px';
        professionalFields.style.opacity = '1';
    } else {
        professionalFields.style.maxHeight = '0';
        professionalFields.style.opacity = '0';
        setTimeout(() => {
            professionalFields.style.display = 'none';
        }, 300);
    }
}

// Função para mostrar conteúdo principal
function showMainContent() {
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('signup-modal').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    initApp();

    // Adicionar event listeners para os controles do header
    document.getElementById('logout-btn').addEventListener('click', logout);
}

// Função de login com e-mail e senha (com validações de segurança)
async function loginWithEmail(event) {
    event.preventDefault();

    const email = SecurityUtils.sanitizeInput(document.getElementById('email').value.trim());
    const password = document.getElementById('password').value;
    const btn = event.target.querySelector('.login-btn');
    const spinner = btn.querySelector('.spinner');
    const btnText = btn.querySelector('.btn-text');
    const message = document.getElementById('login-message');

    // Limpar mensagens anteriores
    message.textContent = '';
    message.className = 'message';

    // Validações de segurança
    if (!email || !password) {
        message.textContent = 'Por favor, preencha todos os campos.';
        message.classList.add('error');
        SecurityUtils.logSecurityEvent('LOGIN_ATTEMPT_FAILED', { reason: 'Empty fields' });
        return;
    }

    if (!SecurityUtils.validateEmail(email)) {
        message.textContent = 'Por favor, insira um e-mail válido.';
        message.classList.add('error');
        SecurityUtils.logSecurityEvent('LOGIN_ATTEMPT_FAILED', { reason: 'Invalid email format', email: email.substring(0, 3) + '***' });
        return;
    }

    if (password.length < 6) {
        message.textContent = 'A senha deve ter pelo menos 6 caracteres.';
        message.classList.add('error');
        SecurityUtils.logSecurityEvent('LOGIN_ATTEMPT_FAILED', { reason: 'Password too short' });
        return;
    }

    // Rate limiting
    const rateLimitKey = `login_${email.toLowerCase()}`;
    if (!SecurityUtils.rateLimit(rateLimitKey, 5, 15 * 60 * 1000)) { // 5 tentativas por 15 minutos
        message.textContent = 'Muitas tentativas de login. Tente novamente em 15 minutos.';
        message.classList.add('error');
        SecurityUtils.logSecurityEvent('LOGIN_RATE_LIMITED', { email: email.substring(0, 3) + '***' });
        return;
    }

    // Mostrar loading
    btn.disabled = true;
    btnText.style.opacity = '0.5';
    spinner.classList.remove('hidden');

    try {
        SecurityUtils.logSecurityEvent('LOGIN_ATTEMPT', { email: email.substring(0, 3) + '***' });

        // Simular verificação de credenciais (em produção, seria uma chamada segura para o servidor)
        const storedUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
        const user = storedUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        // Em produção, a senha seria hasheada e verificada no servidor
        // Aqui simulamos uma verificação simples
        if (user.password !== password) {
            throw new Error('Senha incorreta');
        }

        // Simulação de delay de processamento
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Login bem-sucedido
        localStorage.setItem('loggedIn', 'true');
        localStorage.setItem('session_start', Date.now().toString());
        localStorage.setItem('current_user', JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            type: user.type || 'cliente'
        }));

        SecurityUtils.logSecurityEvent('LOGIN_SUCCESS', { userId: user.id, email: email.substring(0, 3) + '***' });

        showMainContent();

    } catch (error) {
        console.error('Erro no login:', error);
        message.classList.add('error');

        if (error.message === 'Usuário não encontrado') {
            message.textContent = 'E-mail não cadastrado. Verifique ou cadastre-se.';
        } else if (error.message === 'Senha incorreta') {
            message.textContent = 'Senha incorreta. Tente novamente.';
        } else {
            message.textContent = 'Erro no login. Tente novamente mais tarde.';
        }

        SecurityUtils.logSecurityEvent('LOGIN_FAILED', {
            reason: error.message,
            email: email.substring(0, 3) + '***'
        });

    } finally {
        // Esconder loading
        btn.disabled = false;
        btnText.style.opacity = '1';
        spinner.classList.add('hidden');
    }
}

// Função de login com Google
async function loginWithGoogle() {
    const btn = document.getElementById('google-login-btn');
    const message = document.getElementById('login-message');
    
    btn.disabled = true;
    message.textContent = '';
    
    try {
        // Descomente para usar Firebase em produção:
        // const result = await signInWithPopup(window.firebaseAuth, window.provider);
        // console.log('Login com Google bem-sucedido:', result.user);
        
        // Simulação de login com Google
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simular sucesso
        localStorage.setItem('loggedIn', 'true');
        localStorage.setItem('session_start', Date.now().toString());
        localStorage.setItem('current_user', JSON.stringify({
            id: 'google_' + Date.now(),
            name: 'Usuário Google',
            email: 'google@example.com',
            type: 'cliente'
        }));

        SecurityUtils.logSecurityEvent('GOOGLE_LOGIN_SUCCESS', { userId: 'google_' + Date.now() });

        showMainContent();
    } catch (error) {
        console.error('Erro ao fazer login com Google:', error);
        message.textContent = 'Erro ao fazer login com Google. Tente novamente.';
        btn.disabled = false;
    }
}

// Função de logout segura
function logout() {
    try {
        // Log do evento de segurança
        SecurityUtils.logSecurityEvent('USER_LOGOUT', {
            userId: JSON.parse(localStorage.getItem('current_user') || '{}').id,
            reason: 'Normal logout'
        });

        // Limpar todos os dados de sessão
        const keysToRemove = [
            'loggedIn',
            'session_start',
            'current_user',
            'theme'
        ];

        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Limpar campos dos formulários
        const emailField = document.getElementById('email');
        const passwordField = document.getElementById('password');
        const loginMessage = document.getElementById('login-message');
        const signupMessage = document.getElementById('signup-message');

        if (emailField) emailField.value = '';
        if (passwordField) passwordField.value = '';
        if (loginMessage) loginMessage.textContent = '';
        if (signupMessage) signupMessage.textContent = '';

        // Limpar campos do formulário de cadastro
        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.reset();
        }

        // Limpar campos do formulário de perfil
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.reset();
        }

        // Fechar modais abertos
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.add('hidden'));

        // Limpar qualquer estado da aplicação
        selectedProfessional = null;
        currentTab = 'chat';

        // Voltar para a tela de login
        showLoginModal();

        showToast('Logout realizado com segurança.', 'success');

    } catch (error) {
        console.error('Erro durante logout:', error);
        SecurityUtils.logSecurityEvent('LOGOUT_ERROR', { error: error.message });

        // Fallback: forçar reload da página
        window.location.reload();
    }
}

// Função de logout de emergência (limpa tudo imediatamente)
function emergencyLogout() {
    try {
        SecurityUtils.logSecurityEvent('EMERGENCY_LOGOUT', {
            userId: JSON.parse(localStorage.getItem('current_user') || '{}').id,
            reason: 'Emergency logout triggered'
        });

        // Limpar TODO o localStorage (medida extrema de segurança)
        localStorage.clear();

        // Limpar sessionStorage também
        sessionStorage.clear();

        // Mostrar feedback
        showToast('Logout de emergência realizado. Todos os dados foram limpos.', 'error');

        // Recarregar a página completamente
        setTimeout(() => {
            window.location.href = window.location.pathname;
        }, 1000);

    } catch (error) {
        console.error('Erro no logout de emergência:', error);
        // Forçar reload como último recurso
        window.location.reload();
    }
}

// Função para mostrar logs de segurança (apenas para desenvolvimento)
function showSecurityLogs() {
    const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');

    if (logs.length === 0) {
        alert('Nenhum log de segurança encontrado.');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal security-logs-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>🔒 Logs de Segurança</h2>
                <p>Últimos eventos de segurança registrados</p>
            </div>
            <div class="modal-body">
                <div class="security-logs-list">
                    ${logs.slice(-20).reverse().map(log => `
                        <div class="security-log-entry">
                            <div class="security-log-timestamp">${new Date(log.timestamp).toLocaleString('pt-BR')}</div>
                            <div class="security-log-event">${log.event}</div>
                            <div class="security-log-details">${JSON.stringify(log.details, null, 2)}</div>
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top: 1rem; text-align: center;">
                    <button onclick="clearSecurityLogs()" class="btn-outline" style="margin-right: 1rem;">Limpar Logs</button>
                    <button onclick="this.closest('.modal').remove()" class="btn-secondary">Fechar</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Fechar modal ao clicar fora
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

// Função para limpar logs de segurança
function clearSecurityLogs() {
    if (confirm('Tem certeza que deseja limpar todos os logs de segurança?')) {
        localStorage.removeItem('security_logs');
        showToast('Logs de segurança limpos.', 'info');
        document.querySelector('.security-logs-modal').remove();
    }
}

// Função de cadastro de usuário (cliente ou profissional) com validações de segurança
function signupUser(event) {
    event.preventDefault();

    const message = document.getElementById('signup-message');
    message.textContent = '';
    message.className = 'message';

    // Verificar tipo de conta selecionado
    const accountType = document.querySelector('input[name="account-type"]:checked');
    if (!accountType) {
        message.textContent = 'Por favor, selecione o tipo de conta.';
        message.classList.add('error');
        return;
    }

    const userType = accountType.value;

    // Coletar e sanitizar dados básicos
    const rawData = {
        name: document.getElementById('signup-name').value.trim(),
        gender: document.getElementById('signup-gender').value,
        age: document.getElementById('signup-age').value.trim(),
        email: document.getElementById('signup-email').value.trim().toLowerCase(),
        password: document.getElementById('signup-password').value
    };

    // Sanitizar inputs básicos
    const data = {
        ...rawData,
        name: SecurityUtils.sanitizeInput(rawData.name)
    };

    // Validações básicas de segurança
    if (!data.name || data.name.length < 2) {
        message.textContent = 'Nome deve ter pelo menos 2 caracteres.';
        message.classList.add('error');
        return;
    }

    if (!data.email || !SecurityUtils.validateEmail(data.email)) {
        message.textContent = 'Por favor, insira um e-mail válido.';
        message.classList.add('error');
        return;
    }

    if (!SecurityUtils.validatePassword(data.password)) {
        message.textContent = 'Senha deve ter pelo menos 8 caracteres, com letras e números.';
        message.classList.add('error');
        return;
    }

    if (!data.age || parseInt(data.age) < 18 || parseInt(data.age) > 100) {
        message.textContent = 'Idade deve ser entre 18 e 100 anos.';
        message.classList.add('error');
        return;
    }

    // Verificar se e-mail já existe
    const storedUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
    if (storedUsers.some(u => u.email === data.email)) {
        message.textContent = 'Este e-mail já está cadastrado.';
        message.classList.add('error');
        SecurityUtils.logSecurityEvent('SIGNUP_DUPLICATE_EMAIL', { email: data.email.substring(0, 3) + '***' });
        return;
    }

    // Rate limiting para cadastros
    const rateLimitKey = `signup_${data.email}`;
    if (!SecurityUtils.rateLimit(rateLimitKey, 3, 60 * 60 * 1000)) { // 3 cadastros por hora por e-mail
        message.textContent = 'Muitos cadastros com este e-mail. Tente novamente em 1 hora.';
        message.classList.add('error');
        SecurityUtils.logSecurityEvent('SIGNUP_RATE_LIMITED', { email: data.email.substring(0, 3) + '***' });
        return;
    }

    try {
        // Criar novo usuário
        const newUser = {
            id: Date.now().toString(),
            name: data.name,
            email: data.email,
            password: data.password, // Em produção, seria hasheada
            type: userType,
            createdAt: new Date().toISOString()
        };

        // Se for profissional, coletar dados adicionais
        if (userType === 'professional') {
            // Coletar métodos de pagamento selecionados
            const paymentMethods = [];
            ['dinheiro', 'pix', 'cartao', 'transferencia', 'cheque'].forEach(method => {
                if (document.getElementById(`payment-${method}`).checked) {
                    paymentMethods.push(method);
                }
            });

            // Coletar idiomas selecionados
            const languages = [];
            ['portuguese', 'english', 'spanish', 'other'].forEach(lang => {
                if (document.getElementById(`lang-${lang}`).checked) {
                    languages.push(lang);
                }
            });

            const professionalData = {
                category: document.getElementById('signup-category').value,
                func: document.getElementById('signup-function').value.trim(),
                specialty: document.getElementById('signup-specialty').value.trim(),
                location: document.getElementById('signup-location').value.trim(),
                experience: document.getElementById('signup-experience').value.trim(),
                description: document.getElementById('signup-description').value.trim(),
                documents: document.getElementById('signup-documents').value.trim(),
                formations: document.getElementById('signup-formations').value.trim(),
                portfolio: document.getElementById('signup-portfolio').value.trim(),
                phone: document.getElementById('signup-phone').value.trim(),
                hourlyRate: document.getElementById('signup-hourly-rate').value.trim(),
                serviceRadius: document.getElementById('signup-service-radius').value,
                availability: document.getElementById('signup-availability').value,
                paymentMethods: paymentMethods,
                professionalRegister: document.getElementById('signup-professional-register').value.trim(),
                insurance: document.getElementById('signup-insurance').value,
                languages: languages,
                website: document.getElementById('signup-website').value.trim(),
                socialMedia: document.getElementById('signup-social-media').value.trim(),
                emergencyContact: document.getElementById('signup-emergency-contact').value.trim(),
                transport: document.getElementById('signup-transport').value
            };

            // Sanitizar dados profissionais
            const sanitizedProfessionalData = {
                ...professionalData,
                specialty: SecurityUtils.sanitizeInput(professionalData.specialty),
                func: SecurityUtils.sanitizeInput(professionalData.func),
                location: SecurityUtils.sanitizeInput(professionalData.location),
                experience: SecurityUtils.sanitizeInput(professionalData.experience),
                description: SecurityUtils.sanitizeInput(professionalData.description)
            };

            // Criar novo profissional
            const newProfessional = {
                id: professionals.length + 1,
                name: data.name,
                specialty: sanitizedProfessionalData.specialty,
                category: sanitizedProfessionalData.category,
                function: sanitizedProfessionalData.func,
                status: "online",
                photo: "",
                gender: data.gender,
                age: parseInt(data.age),
                phone: sanitizedProfessionalData.phone,
                whatsapp: sanitizedProfessionalData.phone, // Usar o mesmo telefone como WhatsApp por padrão
                documents: sanitizedProfessionalData.documents ? sanitizedProfessionalData.documents.split(',').map(d => d.trim()) : [],
                formations: sanitizedProfessionalData.formations ? sanitizedProfessionalData.formations.split(',').map(f => f.trim()) : [],
                portfolio: sanitizedProfessionalData.portfolio ? sanitizedProfessionalData.portfolio.split(',').map(p => p.trim()) : [],
                description: sanitizedProfessionalData.description,
                location: sanitizedProfessionalData.location,
                experience: sanitizedProfessionalData.experience,
                hourlyRate: parseFloat(sanitizedProfessionalData.hourlyRate) || 0,
                serviceRadius: sanitizedProfessionalData.serviceRadius,
                availability: sanitizedProfessionalData.availability,
                paymentMethods: sanitizedProfessionalData.paymentMethods,
                professionalRegister: SecurityUtils.sanitizeInput(sanitizedProfessionalData.professionalRegister),
                insurance: sanitizedProfessionalData.insurance,
                languages: sanitizedProfessionalData.languages,
                website: SecurityUtils.sanitizeInput(sanitizedProfessionalData.website),
                socialMedia: SecurityUtils.sanitizeInput(sanitizedProfessionalData.socialMedia),
                emergencyContact: SecurityUtils.sanitizeInput(sanitizedProfessionalData.emergencyContact),
                transport: sanitizedProfessionalData.transport,
                reviews: []
            };

            professionals.push(newProfessional);
            localStorage.setItem('professionals', JSON.stringify(professionals));
        }

        // Salvar usuário
        storedUsers.push(newUser);
        localStorage.setItem('registered_users', JSON.stringify(storedUsers));

        SecurityUtils.logSecurityEvent('SIGNUP_SUCCESS', {
            userId: newUser.id,
            email: data.email.substring(0, 3) + '***',
            type: userType
        });

        message.textContent = `Cadastro realizado com sucesso! Você se cadastrou como ${userType === 'client' ? 'cliente' : 'profissional'}. Faça login.`;
        message.classList.add('success');

        // Limpar formulário
        event.target.reset();

        // Redirecionar para login
        setTimeout(() => showLoginModal(), 2000);

    } catch (error) {
        console.error('Erro no cadastro:', error);
        message.textContent = 'Erro no cadastro. Tente novamente.';
        message.classList.add('error');
        SecurityUtils.logSecurityEvent('SIGNUP_FAILED', {
            error: error.message,
            email: data.email.substring(0, 3) + '***'
        });
    }
}

// Função para abrir modal do profissional
function openProfessionalModal(id) {
    const professional = professionals.find(p => p.id === id);
    if (!professional) return;

    const avgRating = professional.reviews.length > 0
        ? (professional.reviews.reduce((sum, r) => sum + r.rating, 0) / professional.reviews.length).toFixed(1)
        : 0;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'professional-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${professional.name}</h2>
                <p>${professional.specialty} • ${professional.category}</p>
            </div>
            <div class="modal-body">
                <div style="display: grid; grid-template-columns: 120px 1fr; gap: 1.5rem; margin-bottom: 2rem;">
                    <div style="width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: 600; color: white; margin: 0 auto;">
                        ${professional.name.charAt(0)}
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                            <div style="color: #fbbf24; font-size: 1.2rem;">${'⭐'.repeat(Math.floor(avgRating))}</div>
                            <span style="font-weight: 600; color: var(--text-primary);">${avgRating} (${professional.reviews.length} avaliações)</span>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div>
                                <div style="font-size: 0.8rem; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px;">Gênero</div>
                                <div style="font-weight: 600;">${professional.gender}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.8rem; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px;">Idade</div>
                                <div style="font-weight: 600;">${professional.age} anos</div>
                            </div>
                            <div>
                                <div style="font-size: 0.8rem; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px;">Localização</div>
                                <div style="font-weight: 600;">${professional.location}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.8rem; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px;">Experiência</div>
                                <div style="font-weight: 600;">${professional.experience}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 2rem;">
                    <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">Sobre</h3>
                    <p style="color: var(--text-secondary); line-height: 1.6;">${professional.description}</p>
                </div>

                <div style="margin-bottom: 2rem;">
                    <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;">Documentos</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${professional.documents.map(doc => `<span style="background: #f1f5f9; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">${doc}</span>`).join('')}
                    </div>
                </div>

                <div style="margin-bottom: 2rem;">
                    <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;">Formações</h3>
                    <ul style="list-style: none; padding: 0;">
                        ${professional.formations.map(form => `<li style="padding: 0.5rem 0; border-bottom: 1px solid #e2e8f0; color: var(--text-secondary);">${form}</li>`).join('')}
                    </ul>
                </div>

                ${professional.portfolio.length > 0 ? `
                <div style="margin-bottom: 2rem;">
                    <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;">Portfólio</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem;">
                        ${professional.portfolio.map(img => `<img src="${img}" alt="Trabalho" style="width: 100%; height: 120px; object-fit: cover; border-radius: 0.5rem; box-shadow: var(--shadow);">`).join('')}
                    </div>
                </div>
                ` : ''}

                <div style="margin-bottom: 2rem;">
                    <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;">Avaliações (${professional.reviews.length})</h3>
                    ${professional.reviews.length > 0 ?
                        professional.reviews.map(review => `
                            <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                    <strong style="color: var(--text-primary);">${review.user}</strong>
                                    <div style="color: #fbbf24;">${'⭐'.repeat(review.rating)}</div>
                                </div>
                                <p style="color: var(--text-secondary); margin: 0;">${review.text}</p>
                                <small style="color: var(--text-light); margin-top: 0.5rem; display: block;">${new Date(review.date).toLocaleDateString('pt-BR')}</small>
                            </div>
                        `).join('') :
                        '<p style="color: var(--text-secondary); font-style: italic;">Nenhuma avaliação ainda.</p>'
                    }
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-primary" onclick="startChat(${professional.id}); document.getElementById('professional-modal').remove();">Iniciar Conversa</button>
                <button class="btn-outline" onclick="document.getElementById('professional-modal').remove();">Fechar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Fechar modal ao clicar fora
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

// Função para iniciar chat via WhatsApp
function startChat(id) {
    const professional = professionals.find(p => p.id === id);
    if (!professional) {
        SecurityUtils.logSecurityEvent('CHAT_ATTEMPT_FAILED', { professionalId: id, reason: 'Professional not found' });
        alert('Profissional não encontrado.');
        return;
    }

    if (!professional.whatsapp) {
        SecurityUtils.logSecurityEvent('CHAT_ATTEMPT_FAILED', { professionalId: id, reason: 'No WhatsApp number' });
        alert('Este profissional não possui WhatsApp configurado.');
        return;
    }

    // Validar e limpar o número do WhatsApp
    const whatsappNumber = professional.whatsapp.replace(/\D/g, '');
    if (whatsappNumber.length < 10 || whatsappNumber.length > 15) {
        SecurityUtils.logSecurityEvent('CHAT_ATTEMPT_FAILED', { professionalId: id, reason: 'Invalid WhatsApp number' });
        alert('Número do WhatsApp inválido.');
        return;
    }

    // Log do evento de segurança
    SecurityUtils.logSecurityEvent('WHATSAPP_CHAT_INITIATED', {
        professionalId: id,
        professionalName: professional.name,
        whatsappNumber: whatsappNumber
    });

    // Criar mensagem inicial
    const message = encodeURIComponent(`Olá ${professional.name}! Vi seu perfil no Avalia.Serv e gostaria de conversar sobre seus serviços.`);

    // Tentar abrir WhatsApp Web primeiro, depois app
    const whatsappWebUrl = `https://web.whatsapp.com/send?phone=${whatsappNumber}&text=${message}`;
    const whatsappAppUrl = `whatsapp://send?phone=${whatsappNumber}&text=${message}`;

    // Detectar se está em mobile
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    try {
        if (isMobile) {
            // Tentar abrir app primeiro
            window.location.href = whatsappAppUrl;
        } else {
            // Desktop: abrir WhatsApp Web
            window.open(whatsappWebUrl, '_blank');
        }

        // Feedback visual
        showToast(`Abrindo WhatsApp para conversar com ${professional.name}...`, 'success');

    } catch (error) {
        SecurityUtils.logSecurityEvent('WHATSAPP_OPEN_FAILED', {
            professionalId: id,
            error: error.message,
            userAgent: navigator.userAgent
        });

        // Fallback: tentar a outra opção
        try {
            if (isMobile) {
                window.open(whatsappWebUrl, '_blank');
            } else {
                window.location.href = whatsappAppUrl;
            }
            showToast(`Abrindo WhatsApp para conversar com ${professional.name}...`, 'success');
        } catch (fallbackError) {
            SecurityUtils.logSecurityEvent('WHATSAPP_FALLBACK_FAILED', {
                professionalId: id,
                error: fallbackError.message
            });
            alert(`Não foi possível abrir o WhatsApp. Você pode entrar em contato diretamente pelo número: ${professional.phone}`);
        }
    }
}

// Função para mostrar toast notifications
function showToast(message, type = 'info') {
    // Remover toast existente
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    // Criar novo toast
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;

    document.body.appendChild(toast);

    // Animação de entrada
    setTimeout(() => toast.classList.add('show'), 100);

    // Remover automaticamente
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Função para abrir modal de perfil
function openProfileModal() {
    const modal = document.getElementById('profile-modal');
    const form = document.getElementById('profile-form');

    // Preencher dados atuais (simulados)
    document.getElementById('profile-name').value = 'Usuário';
    document.getElementById('profile-email').value = 'usuario@email.com';
    document.getElementById('profile-phone').value = '';
    document.getElementById('profile-city').value = '';
    document.getElementById('profile-bio').value = '';

    modal.classList.remove('hidden');
}

// Função para atualizar perfil
function updateProfile(event) {
    event.preventDefault();

    const name = document.getElementById('profile-name').value;
    const email = document.getElementById('profile-email').value;
    const phone = document.getElementById('profile-phone').value;
    const city = document.getElementById('profile-city').value;
    const bio = document.getElementById('profile-bio').value;

    // Simular atualização (em produção, enviaria para o servidor)
    document.querySelector('.profile-name').textContent = name;
    document.querySelector('.profile-email').textContent = email;

    // Fechar modal
    document.getElementById('profile-modal').classList.add('hidden');

    // Mostrar mensagem de sucesso
    alert('Perfil atualizado com sucesso!');
}

// Função para abrir modal de doação
function openDonationModal() {
    const modal = document.getElementById('donation-modal');
    modal.classList.remove('hidden');

    // Selecionar opção padrão de R$ 5,00
    selectDonationOption(5);
}

// Função para selecionar opção de doação
function selectDonationOption(amount) {
    // Remover seleção anterior
    document.querySelectorAll('.donation-option').forEach(option => {
        option.classList.remove('selected');
    });

    // Selecionar nova opção
    const selectedOption = document.querySelector(`[data-amount="${amount}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
}

// Função para processar doação
function processDonation() {
    const selectedAmount = document.querySelector('.donation-option.selected');
    if (!selectedAmount) {
        alert('Selecione um valor para doar.');
        return;
    }

    const amount = selectedAmount.getAttribute('data-amount');
    alert(`Obrigado pela doação de R$ ${amount},00! ❤️\n\nEm breve você receberá instruções para completar a doação via PIX.`);

    // Fechar modal
    document.getElementById('donation-modal').classList.add('hidden');
}

// Adicionar event listeners para os novos elementos
document.addEventListener('DOMContentLoaded', () => {
    // ... código existente ...

    // Event listeners para opções de doação
    document.querySelectorAll('.donation-option').forEach(option => {
        option.addEventListener('click', () => {
            const amount = parseInt(option.getAttribute('data-amount'));
            selectDonationOption(amount);
        });
    });

    // Fechar modais ao clicar fora
    document.getElementById('profile-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('profile-modal')) {
            document.getElementById('profile-modal').classList.add('hidden');
        }
    });

    document.getElementById('donation-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('donation-modal')) {
            document.getElementById('donation-modal').classList.add('hidden');
        }
    });
});