// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!userManager.checkAuth()) {
        return;
    }

    // Update balance and stats display
    userManager.updateBalanceDisplay();

    // Modal functionality
    const depositModal = document.getElementById('depositModal');
    const withdrawModal = document.getElementById('withdrawModal');
    const depositBtn = document.getElementById('depositBtn');
    const withdrawBtn = document.getElementById('withdrawBtn');
    const closeBtns = document.querySelectorAll('.close');

    depositBtn.addEventListener('click', function() {
        depositModal.classList.add('active');
    });

    withdrawBtn.addEventListener('click', function() {
        withdrawModal.classList.add('active');
    });

    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            depositModal.classList.remove('active');
            withdrawModal.classList.remove('active');
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === depositModal) {
            depositModal.classList.remove('active');
        }
        if (e.target === withdrawModal) {
            withdrawModal.classList.remove('active');
        }
    });

    // Deposit form
    const depositForm = document.getElementById('depositForm');
    depositForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const amount = parseInt(document.getElementById('depositAmount').value);

        if (amount < 50000) {
            alert('Minimal deposit adalah Rp 50,000');
            return;
        }

        userManager.updateBalance(amount);
        alert('Deposit berhasil! Rp ' + userManager.formatCurrency(amount) + ' telah ditambahkan ke saldo Anda.');

        depositModal.classList.remove('active');
        depositForm.reset();
    });

    // Withdraw form
    const withdrawForm = document.getElementById('withdrawForm');
    withdrawForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const amount = parseInt(document.getElementById('withdrawAmount').value);

        if (amount < 50000) {
            alert('Minimal penarikan adalah Rp 50,000');
            return;
        }

        if (amount > userManager.getBalance()) {
            alert('Saldo tidak mencukupi!');
            return;
        }

        userManager.updateBalance(-amount);
        alert('Penarikan berhasil! Rp ' + userManager.formatCurrency(amount) + ' akan segera diproses.');

        withdrawModal.classList.remove('active');
        withdrawForm.reset();
    });
});
