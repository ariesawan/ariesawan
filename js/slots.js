// Slot Machine Game Logic
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!userManager.checkAuth()) {
        return;
    }

    const symbols = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎', '⭐'];
    const payouts = {
        '🍒': 3,
        '🍋': 5,
        '🍊': 7,
        '🍇': 10,
        '🔔': 15,
        '💎': 50,
        '⭐': 100
    };

    const reel1 = document.getElementById('reel1');
    const reel2 = document.getElementById('reel2');
    const reel3 = document.getElementById('reel3');
    const spinBtn = document.getElementById('spinBtn');
    const betAmountSelect = document.getElementById('betAmount');

    let isSpinning = false;

    spinBtn.addEventListener('click', function() {
        if (isSpinning) return;

        const betAmount = parseInt(betAmountSelect.value);

        // Check if user has enough balance
        if (userManager.getBalance() < betAmount) {
            showResult('Saldo tidak mencukupi!', 'lose');
            return;
        }

        // Deduct bet amount
        userManager.updateBalance(-betAmount);

        isSpinning = true;
        spinBtn.disabled = true;
        spinBtn.textContent = 'MEMUTAR...';

        // Add spinning animation
        reel1.classList.add('spinning');
        reel2.classList.add('spinning');
        reel3.classList.add('spinning');

        // Spin animation
        let spinCount = 0;
        const spinInterval = setInterval(() => {
            reel1.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            reel2.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            reel3.textContent = symbols[Math.floor(Math.random() * symbols.length)];

            spinCount++;
            if (spinCount > 20) {
                clearInterval(spinInterval);
                finishSpin(betAmount);
            }
        }, 100);
    });

    function finishSpin(betAmount) {
        // Remove spinning animation
        reel1.classList.remove('spinning');
        reel2.classList.remove('spinning');
        reel3.classList.remove('spinning');

        // Set final symbols with weighted randomness
        const finalSymbols = getWeightedSymbols();
        reel1.textContent = finalSymbols[0];
        reel2.textContent = finalSymbols[1];
        reel3.textContent = finalSymbols[2];

        // Check for win
        setTimeout(() => {
            checkWin(finalSymbols, betAmount);
            isSpinning = false;
            spinBtn.disabled = false;
            spinBtn.textContent = 'PUTAR';
        }, 500);
    }

    function getWeightedSymbols() {
        // Weighted random selection (higher value symbols are rarer)
        const weights = {
            '🍒': 30,
            '🍋': 25,
            '🍊': 20,
            '🍇': 15,
            '🔔': 7,
            '💎': 2,
            '⭐': 1
        };

        const weightedSymbols = [];
        for (let symbol in weights) {
            for (let i = 0; i < weights[symbol]; i++) {
                weightedSymbols.push(symbol);
            }
        }

        return [
            weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)],
            weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)],
            weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)]
        ];
    }

    function checkWin(symbols, betAmount) {
        if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
            // Win!
            const multiplier = payouts[symbols[0]];
            const winAmount = betAmount * multiplier;

            userManager.updateBalance(winAmount);
            userManager.updateStats(true);

            playSound('win');

            if (multiplier >= 50) {
                showResult(`🎉 JACKPOT! Anda menang Rp ${userManager.formatCurrency(winAmount)}! (${multiplier}x)`, 'win');
            } else {
                showResult(`🎊 MENANG! Anda menang Rp ${userManager.formatCurrency(winAmount)}! (${multiplier}x)`, 'win');
            }
        } else {
            // Loss
            userManager.updateStats(false);
            playSound('lose');
            showResult('Coba lagi! Rp ' + userManager.formatCurrency(betAmount) + ' hilang.', 'lose');
        }
    }
});
