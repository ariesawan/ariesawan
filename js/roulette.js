// Roulette Game Logic
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!userManager.checkAuth()) {
        return;
    }

    const rouletteWheel = document.getElementById('rouletteWheel');
    const resultNumberEl = document.getElementById('resultNumber');
    const betAmountInput = document.getElementById('betAmount');
    const spinBtn = document.getElementById('spinBtn');
    const clearBetBtn = document.getElementById('clearBetBtn');
    const currentBetEl = document.getElementById('currentBet');
    const betBtns = document.querySelectorAll('.bet-btn');

    let currentBet = null;
    let isSpinning = false;

    // Red and black numbers on roulette
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

    // Bet button click handlers
    betBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (isSpinning) return;

            // Remove previous selection
            betBtns.forEach(b => b.classList.remove('selected'));

            // Select this bet
            this.classList.add('selected');

            currentBet = {
                type: this.dataset.bet,
                payout: parseInt(this.dataset.payout)
            };

            updateCurrentBetDisplay();
            spinBtn.disabled = false;
        });
    });

    function updateCurrentBetDisplay() {
        if (currentBet) {
            const betAmount = parseInt(betAmountInput.value);
            const potentialWin = betAmount * currentBet.payout;
            currentBetEl.innerHTML = `
                <strong>Taruhan Saat Ini:</strong><br>
                Jenis: ${getBetName(currentBet.type)}<br>
                Jumlah: Rp ${userManager.formatCurrency(betAmount)}<br>
                Potensi Menang: Rp ${userManager.formatCurrency(potentialWin)} (${currentBet.payout}x)
            `;
        } else {
            currentBetEl.innerHTML = '<em>Pilih jenis taruhan terlebih dahulu</em>';
        }
    }

    function getBetName(betType) {
        const names = {
            'red': 'Merah',
            'black': 'Hitam',
            'even': 'Genap',
            'odd': 'Ganjil',
            'low': '1-18',
            'high': '19-36',
            'dozen1': '1-12',
            'dozen2': '13-24',
            'dozen3': '25-36'
        };
        return names[betType] || 'Angka ' + betType;
    }

    clearBetBtn.addEventListener('click', function() {
        if (isSpinning) return;

        betBtns.forEach(b => b.classList.remove('selected'));
        currentBet = null;
        currentBetEl.innerHTML = '<em>Pilih jenis taruhan terlebih dahulu</em>';
        spinBtn.disabled = true;
    });

    betAmountInput.addEventListener('input', updateCurrentBetDisplay);

    spinBtn.addEventListener('click', function() {
        if (isSpinning || !currentBet) return;

        const betAmount = parseInt(betAmountInput.value);

        if (betAmount < 10000) {
            showResult('Minimal taruhan adalah Rp 10,000', 'lose');
            return;
        }

        if (userManager.getBalance() < betAmount) {
            showResult('Saldo tidak mencukupi!', 'lose');
            return;
        }

        // Deduct bet
        userManager.updateBalance(-betAmount);

        isSpinning = true;
        spinBtn.disabled = true;
        spinBtn.textContent = 'MEMUTAR...';

        // Spin the wheel
        rouletteWheel.classList.add('spinning');

        // Random result number (0-36)
        const resultNumber = Math.floor(Math.random() * 37);

        // Show spinning numbers
        let counter = 0;
        const spinInterval = setInterval(() => {
            resultNumberEl.textContent = Math.floor(Math.random() * 37);
            counter++;

            if (counter > 30) {
                clearInterval(spinInterval);
                finishSpin(resultNumber, betAmount);
            }
        }, 100);
    });

    function finishSpin(resultNumber, betAmount) {
        setTimeout(() => {
            rouletteWheel.classList.remove('spinning');
            resultNumberEl.textContent = resultNumber;

            // Determine result color
            let resultColor = 'green';
            if (redNumbers.includes(resultNumber)) {
                resultColor = 'red';
            } else if (blackNumbers.includes(resultNumber)) {
                resultColor = 'black';
            }

            // Check if bet won
            const won = checkBetWin(currentBet.type, resultNumber, resultColor);

            if (won) {
                const winAmount = betAmount * currentBet.payout;
                userManager.updateBalance(winAmount);
                userManager.updateStats(true);
                playSound('win');
                showResult(`🎉 MENANG! Nomor ${resultNumber} (${resultColor}). Anda menang Rp ${userManager.formatCurrency(winAmount)}!`, 'win');
            } else {
                userManager.updateStats(false);
                playSound('lose');
                showResult(`Nomor ${resultNumber} (${resultColor}). Coba lagi!`, 'lose');
            }

            isSpinning = false;
            spinBtn.disabled = false;
            spinBtn.textContent = 'PUTAR RODA';

        }, 2000);
    }

    function checkBetWin(betType, number, color) {
        // Check specific number
        if (!isNaN(betType)) {
            return parseInt(betType) === number;
        }

        switch(betType) {
            case 'red':
                return color === 'red';
            case 'black':
                return color === 'black';
            case 'even':
                return number !== 0 && number % 2 === 0;
            case 'odd':
                return number !== 0 && number % 2 === 1;
            case 'low':
                return number >= 1 && number <= 18;
            case 'high':
                return number >= 19 && number <= 36;
            case 'dozen1':
                return number >= 1 && number <= 12;
            case 'dozen2':
                return number >= 13 && number <= 24;
            case 'dozen3':
                return number >= 25 && number <= 36;
            default:
                return false;
        }
    }
});
