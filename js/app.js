// User Management System
class UserManager {
    constructor() {
        this.currentUser = this.loadUser();
        this.initBalance();
    }

    loadUser() {
        const userData = localStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    }

    saveUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUser = user;
    }

    register(username, email, password) {
        // Check if user already exists
        const users = JSON.parse(localStorage.getItem('users') || '[]');

        if (users.find(u => u.username === username)) {
            return { success: false, message: 'Username sudah digunakan!' };
        }

        const newUser = {
            username,
            email,
            password, // In production, this should be hashed!
            balance: 10000000, // Starting balance: 10 juta
            stats: {
                totalWins: 0,
                totalLosses: 0,
                totalPlayed: 0
            },
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        return { success: true, message: 'Pendaftaran berhasil!' };
    }

    login(username, password) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            this.saveUser(user);
            return { success: true, message: 'Login berhasil!' };
        }

        return { success: false, message: 'Username atau password salah!' };
    }

    logout() {
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        window.location.href = '../index.html';
    }

    updateBalance(amount) {
        if (this.currentUser) {
            this.currentUser.balance += amount;
            this.saveUserData();
            this.updateBalanceDisplay();
        }
    }

    getBalance() {
        return this.currentUser ? this.currentUser.balance : 0;
    }

    updateStats(won) {
        if (this.currentUser) {
            this.currentUser.stats.totalPlayed++;
            if (won) {
                this.currentUser.stats.totalWins++;
            } else {
                this.currentUser.stats.totalLosses++;
            }
            this.saveUserData();
        }
    }

    saveUserData() {
        // Update user in users array
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const index = users.findIndex(u => u.username === this.currentUser.username);
        if (index !== -1) {
            users[index] = this.currentUser;
            localStorage.setItem('users', JSON.stringify(users));
            this.saveUser(this.currentUser);
        }
    }

    initBalance() {
        // Update balance display on page load
        setTimeout(() => this.updateBalanceDisplay(), 100);
    }

    updateBalanceDisplay() {
        const balanceElements = document.querySelectorAll('#userBalance, #mainBalance');
        const balance = this.getBalance();
        balanceElements.forEach(el => {
            if (el) {
                el.textContent = this.formatCurrency(balance);
            }
        });

        // Update username display
        const usernameEl = document.getElementById('currentUser');
        if (usernameEl && this.currentUser) {
            usernameEl.textContent = this.currentUser.username;
        }

        // Update stats if on dashboard
        if (this.currentUser && this.currentUser.stats) {
            const totalWinsEl = document.getElementById('totalWins');
            const totalLossesEl = document.getElementById('totalLosses');
            const winRateEl = document.getElementById('winRate');

            if (totalWinsEl) totalWinsEl.textContent = this.currentUser.stats.totalWins;
            if (totalLossesEl) totalLossesEl.textContent = this.currentUser.stats.totalLosses;

            if (winRateEl) {
                const total = this.currentUser.stats.totalPlayed;
                const winRate = total > 0 ? ((this.currentUser.stats.totalWins / total) * 100).toFixed(1) : 0;
                winRateEl.textContent = winRate + '%';
            }
        }
    }

    formatCurrency(amount) {
        return amount.toLocaleString('id-ID');
    }

    checkAuth() {
        if (!this.currentUser) {
            window.location.href = '../index.html';
            return false;
        }
        return true;
    }
}

// Initialize user manager globally
const userManager = new UserManager();

// Auth page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if on auth page
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            const result = userManager.login(username, password);

            if (result.success) {
                alert(result.message);
                window.location.href = 'dashboard.html';
            } else {
                alert(result.message);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const username = document.getElementById('regUsername').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;
            const ageConfirm = document.getElementById('ageConfirm').checked;

            if (password !== confirmPassword) {
                alert('Password tidak cocok!');
                return;
            }

            if (!ageConfirm) {
                alert('Anda harus berusia 18+ tahun untuk mendaftar!');
                return;
            }

            const result = userManager.register(username, email, password);

            if (result.success) {
                alert(result.message + ' Silakan login.');
                document.getElementById('registerBox').classList.add('hidden');
                document.getElementById('loginBox').classList.remove('hidden');
                registerForm.reset();
            } else {
                alert(result.message);
            }
        });
    }

    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('loginBox').classList.add('hidden');
            document.getElementById('registerBox').classList.remove('hidden');
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('registerBox').classList.add('hidden');
            document.getElementById('loginBox').classList.remove('hidden');
        });
    }

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Yakin ingin keluar?')) {
                userManager.logout();
            }
        });
    }
});

// Utility function to show result message
function showResult(message, type) {
    const resultEl = document.getElementById('resultMessage');
    if (resultEl) {
        resultEl.textContent = message;
        resultEl.className = 'result-message ' + type;

        setTimeout(() => {
            resultEl.textContent = '';
            resultEl.className = 'result-message';
        }, 5000);
    }
}

// Sound effects (simple beep simulation)
function playSound(type) {
    // In a real application, you would play actual sound files
    console.log('Playing sound:', type);
}
