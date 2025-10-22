// Blackjack Game Logic
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!userManager.checkAuth()) {
        return;
    }

    const betSetup = document.getElementById('betSetup');
    const gameArea = document.getElementById('gameArea');
    const dealBtn = document.getElementById('dealBtn');
    const hitBtn = document.getElementById('hitBtn');
    const standBtn = document.getElementById('standBtn');
    const newGameBtn = document.getElementById('newGameBtn');
    const betAmountSelect = document.getElementById('betAmount');
    const dealerCardsEl = document.getElementById('dealerCards');
    const playerCardsEl = document.getElementById('playerCards');
    const dealerScoreEl = document.getElementById('dealerScore');
    const playerScoreEl = document.getElementById('playerScore');

    let deck = [];
    let dealerHand = [];
    let playerHand = [];
    let currentBet = 0;
    let gameActive = false;

    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    dealBtn.addEventListener('click', startGame);
    hitBtn.addEventListener('click', playerHit);
    standBtn.addEventListener('click', playerStand);
    newGameBtn.addEventListener('click', resetGame);

    function createDeck() {
        deck = [];
        for (let suit of suits) {
            for (let value of values) {
                deck.push({ suit, value });
            }
        }
        // Shuffle deck
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    function drawCard() {
        return deck.pop();
    }

    function getCardValue(card) {
        if (card.value === 'A') return 11;
        if (['J', 'Q', 'K'].includes(card.value)) return 10;
        return parseInt(card.value);
    }

    function calculateHandValue(hand) {
        let value = 0;
        let aces = 0;

        for (let card of hand) {
            value += getCardValue(card);
            if (card.value === 'A') aces++;
        }

        // Adjust for aces
        while (value > 21 && aces > 0) {
            value -= 10;
            aces--;
        }

        return value;
    }

    function displayCard(card, hidden = false) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';

        if (hidden) {
            cardDiv.classList.add('hidden');
            cardDiv.innerHTML = '?';
        } else {
            const isRed = ['♥', '♦'].includes(card.suit);
            if (isRed) cardDiv.classList.add('red');

            cardDiv.innerHTML = `
                <div class="card-value">${card.value}</div>
                <div class="card-suit">${card.suit}</div>
            `;
        }

        return cardDiv;
    }

    function updateDisplay() {
        // Clear displays
        dealerCardsEl.innerHTML = '';
        playerCardsEl.innerHTML = '';

        // Display dealer cards (first card hidden if game active)
        dealerHand.forEach((card, index) => {
            const cardEl = displayCard(card, gameActive && index === 0);
            dealerCardsEl.appendChild(cardEl);
        });

        // Display player cards
        playerHand.forEach(card => {
            const cardEl = displayCard(card);
            playerCardsEl.appendChild(cardEl);
        });

        // Update scores
        const playerValue = calculateHandValue(playerHand);
        playerScoreEl.textContent = playerValue;

        if (gameActive) {
            // Show only visible dealer card value during game
            const visibleCards = dealerHand.slice(1);
            const visibleValue = visibleCards.reduce((sum, card) => sum + getCardValue(card), 0);
            dealerScoreEl.textContent = visibleValue;
        } else {
            dealerScoreEl.textContent = calculateHandValue(dealerHand);
        }
    }

    function startGame() {
        currentBet = parseInt(betAmountSelect.value);

        if (userManager.getBalance() < currentBet) {
            showResult('Saldo tidak mencukupi!', 'lose');
            return;
        }

        // Deduct bet
        userManager.updateBalance(-currentBet);

        createDeck();
        dealerHand = [drawCard(), drawCard()];
        playerHand = [drawCard(), drawCard()];
        gameActive = true;

        betSetup.classList.add('hidden');
        gameArea.classList.remove('hidden');
        hitBtn.disabled = false;
        standBtn.disabled = false;
        newGameBtn.classList.add('hidden');

        updateDisplay();

        // Check for blackjack
        if (calculateHandValue(playerHand) === 21) {
            setTimeout(() => {
                gameActive = false;
                checkWinner(true);
            }, 500);
        }
    }

    function playerHit() {
        if (!gameActive) return;

        playerHand.push(drawCard());
        updateDisplay();

        const playerValue = calculateHandValue(playerHand);

        if (playerValue > 21) {
            // Bust
            gameActive = false;
            hitBtn.disabled = true;
            standBtn.disabled = true;

            setTimeout(() => {
                showResult('BUST! Anda kalah. Nilai kartu: ' + playerValue, 'lose');
                userManager.updateStats(false);
                endGame();
            }, 500);
        } else if (playerValue === 21) {
            // Auto stand on 21
            playerStand();
        }
    }

    function playerStand() {
        if (!gameActive) return;

        gameActive = false;
        hitBtn.disabled = true;
        standBtn.disabled = true;

        // Reveal dealer's hidden card
        updateDisplay();

        // Dealer draws
        setTimeout(() => {
            dealerPlay();
        }, 1000);
    }

    function dealerPlay() {
        let dealerValue = calculateHandValue(dealerHand);

        // Dealer must hit on 16 or less, stand on 17 or more
        if (dealerValue < 17) {
            dealerHand.push(drawCard());
            updateDisplay();
            dealerValue = calculateHandValue(dealerHand);

            if (dealerValue > 21) {
                // Dealer bust
                setTimeout(() => {
                    showResult('Dealer BUST! Anda menang! Dealer: ' + dealerValue, 'win');
                    const winAmount = currentBet * 2;
                    userManager.updateBalance(winAmount);
                    userManager.updateStats(true);
                    endGame();
                }, 500);
            } else {
                // Continue dealer play
                setTimeout(dealerPlay, 1000);
            }
        } else {
            // Dealer stands, check winner
            checkWinner();
        }
    }

    function checkWinner(playerBlackjack = false) {
        const playerValue = calculateHandValue(playerHand);
        const dealerValue = calculateHandValue(dealerHand);

        if (playerBlackjack && playerValue === 21 && playerHand.length === 2) {
            // Blackjack pays 2.5x
            const winAmount = currentBet * 2.5;
            userManager.updateBalance(winAmount);
            userManager.updateStats(true);
            showResult(`🃏 BLACKJACK! Anda menang Rp ${userManager.formatCurrency(winAmount)}!`, 'win');
        } else if (playerValue > dealerValue) {
            const winAmount = currentBet * 2;
            userManager.updateBalance(winAmount);
            userManager.updateStats(true);
            showResult(`Anda menang! Player: ${playerValue}, Dealer: ${dealerValue}`, 'win');
        } else if (playerValue < dealerValue) {
            userManager.updateStats(false);
            showResult(`Anda kalah! Player: ${playerValue}, Dealer: ${dealerValue}`, 'lose');
        } else {
            // Push (tie) - return bet
            userManager.updateBalance(currentBet);
            showResult(`SERI! Player: ${playerValue}, Dealer: ${dealerValue}. Taruhan dikembalikan.`, 'push');
        }

        endGame();
    }

    function endGame() {
        newGameBtn.classList.remove('hidden');
    }

    function resetGame() {
        betSetup.classList.remove('hidden');
        gameArea.classList.add('hidden');
        dealerHand = [];
        playerHand = [];
        gameActive = false;

        const resultEl = document.getElementById('resultMessage');
        if (resultEl) {
            resultEl.textContent = '';
            resultEl.className = 'result-message';
        }
    }
});
