let gameState = {
    katzName: '',
    mausName: '',
    gameType: '',
    katzPosition: 0,
    mausPosition: 0,
    currentPlayer: 'maus',  // Changed to start with mouse
    gameOver: false,
    diceValue: 0,
    turnCount: 0,
    maxTurns: 30,  // Add game length limit
    currentDice: 0,
    waitingForMove: false,
    selectedPiece: null
};

function selectGameType(type) {
    // Get names or use defaults
    gameState.katzName = document.getElementById('katzName').value || 'Katze';
    gameState.mausName = document.getElementById('mausName').value || 'Maus';
    
    gameState.gameType = type;
    
    // Set initial positions
    if (type === 'plus') {
        gameState.katzPosition = 1;
        gameState.mausPosition = 4;
    } else {
        gameState.katzPosition = 20;
        gameState.mausPosition = 17;
    }

    startGame();
}

function startGame() {
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    
    createGameBoard();
    updatePlayerInfo();
    updateBoard();
    updateDiceDisplay();  // Show initial dice placeholder
}

function createGameBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    
    // For minus game, add cheese at position 0
    if (gameState.gameType === 'minus') {
        const cheeseCell = document.createElement('div');
        cheeseCell.className = 'cell cheese-target';
        cheeseCell.id = 'cell-0';
        cheeseCell.addEventListener('click', () => handleCellClick(0));
        board.appendChild(cheeseCell);
    }
    
    // Create numbered cells 1-20
    for (let i = 1; i <= 20; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.id = `cell-${i}`;
        cell.textContent = i;
        cell.addEventListener('click', () => handleCellClick(i));
        board.appendChild(cell);
    }
    
    // For plus game, add cheese at position 21
    if (gameState.gameType === 'plus') {
        const cheeseCell = document.createElement('div');
        cheeseCell.className = 'cell cheese-target';
        cheeseCell.id = 'cell-21';
        cheeseCell.addEventListener('click', () => handleCellClick(21));
        board.appendChild(cheeseCell);
    }
}

function updateBoard() {
    // Clear all cells
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('katz', 'maus', 'selected');
    });

    // Update positions
    document.getElementById(`cell-${gameState.katzPosition}`).classList.add('katz');
    document.getElementById(`cell-${gameState.mausPosition}`).classList.add('maus');

    // Restore selection if there is a selected piece
    if (gameState.selectedPiece) {
        document.getElementById(`cell-${gameState.selectedPiece}`).classList.add('selected');
    }
}

function updatePlayerInfo() {
    const katzInfo = document.getElementById('katz-info');
    const mausInfo = document.getElementById('maus-info');
    
    // Create cat icon and name elements
    katzInfo.innerHTML = `
        <div class="turn-indicator" style="visibility: ${gameState.currentPlayer === 'katz' ? 'visible' : 'hidden'}">
            <img src="runningman.png" alt="Turn">
        </div>
        <img src="cat.png" class="player-icon" alt="Katze"> 
        ${gameState.katzName}
    `;
    
    // Create mouse icon and name elements
    mausInfo.innerHTML = `
        <div class="turn-indicator" style="visibility: ${gameState.currentPlayer === 'maus' ? 'visible' : 'hidden'}">
            <img src="runningman.png" alt="Turn">
        </div>
        <img src="mouse.png" class="player-icon" alt="Maus">
        ${gameState.mausName}
    `;
    
    updateMathOperation();
}

function updateDiceDisplay(value = null) {
    const diceDisplay = document.getElementById('dice-value');
    const turnDisplay = document.getElementById('current-turn');
    
    if (value) {
        diceDisplay.textContent = `🎲 ${value}`;
    } else {
        diceDisplay.textContent = `🎲 _`;  // Placeholder
    }
}

function rollDice() {
    if (gameState.gameOver || gameState.waitingForMove) return;

    const diceDisplay = document.getElementById('dice-value');
    const turnDisplay = document.getElementById('current-turn');
    const rollButton = document.getElementById('rollDice');
    
    rollButton.disabled = true;
    diceDisplay.classList.add('rolling');
    
    setTimeout(() => {
        const dice = Math.floor(Math.random() * 6) + 1;
        gameState.currentDice = dice;
        
        diceDisplay.classList.remove('rolling');
        updateDiceDisplay(dice);
        
        calculatePossibleMoves();
        gameState.waitingForMove = true;
        
        turnDisplay.textContent = `${gameState.currentPlayer === 'katz' ? 
            gameState.katzName : gameState.mausName} muss ${dice} ${gameState.gameType === 'plus' ? 
            'addieren' : 'subtrahieren'}!`;
        
        updateMathOperation();
        updatePlayerInfo();
    }, 500);
}

function calculatePossibleMoves() {
    // Clear previous selections
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('selected');
    });
    gameState.selectedPiece = null;
}

function handleCellClick(clickedPos) {
    if (gameState.gameOver || !gameState.waitingForMove) return;

    const cell = document.getElementById(`cell-${clickedPos}`);
    const currentPos = gameState.currentPlayer === 'katz' ? 
        gameState.katzPosition : gameState.mausPosition;
    
    // If no piece is selected and clicked on current player's piece
    if (!gameState.selectedPiece && 
        ((gameState.currentPlayer === 'katz' && clickedPos === gameState.katzPosition) ||
         (gameState.currentPlayer === 'maus' && clickedPos === gameState.mausPosition))) {
        
        gameState.selectedPiece = clickedPos;
        cell.classList.add('selected');
        return;
    }

    // If piece is selected, try to move
    if (gameState.selectedPiece) {
        const correctPos = gameState.gameType === 'plus' ? 
            currentPos + gameState.currentDice : 
            currentPos - gameState.currentDice;

        // Remove selection
        document.getElementById(`cell-${gameState.selectedPiece}`).classList.remove('selected');
        gameState.selectedPiece = null;

        // Special case for mouse winning move in plus game
        if (gameState.currentPlayer === 'maus' && 
            gameState.gameType === 'plus' && 
            correctPos >= 21 && 
            clickedPos === 21) {
            cell.classList.add('correct-move');  // Add visual feedback
            setTimeout(() => {
                gameState.mausPosition = 21;
                gameState.gameOver = true;
                updateBoard();
                checkGameOver();
            }, 500);
            return;
        }

        // Special case for mouse winning move in minus game
        if (gameState.currentPlayer === 'maus' && 
            gameState.gameType === 'minus' && 
            correctPos <= 0 && 
            clickedPos === 0) {
            cell.classList.add('correct-move');  // Add visual feedback
            setTimeout(() => {
                gameState.mausPosition = 0;
                gameState.gameOver = true;
                updateBoard();
                checkGameOver();
            }, 500);
            return;
        }

        if (clickedPos !== correctPos) {
            // Wrong move
            cell.classList.add('wrong-move');
            setTimeout(() => cell.classList.remove('wrong-move'), 500);
            return;
        }

        // Correct move - add visual feedback
        cell.classList.add('correct-move');
        setTimeout(() => cell.classList.remove('correct-move'), 500);

        // Process the move
        if (gameState.currentPlayer === 'katz') {
            gameState.katzPosition = clickedPos;
            gameState.currentPlayer = 'maus';
            updatePlayerInfo();
        } else {
            gameState.mausPosition = clickedPos;
            gameState.currentPlayer = 'katz';
            gameState.turnCount++;
            updatePlayerInfo();
        }

        // Reset move state
        gameState.waitingForMove = false;
        gameState.currentDice = 0;
        document.getElementById('rollDice').disabled = false;
        
        updateMathOperation();
        updateBoard();
        checkGameOver();
    }
}

function showGameOverModal(type) {
    // Remove any existing modal first
    const existingModal = document.querySelector('.game-over-modal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }

    const modal = document.createElement('div');
    modal.className = 'game-over-modal';
    
    const content = document.createElement('div');
    content.className = 'modal-content';
    
    const image = document.createElement('div');
    image.className = type === 'cheese' ? 'big-cheese' : 'big-cat';
    
    const text = document.createElement('p');
    text.textContent = 'Noch einmal spielen?';
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    
    const yesButton = document.createElement('button');
    yesButton.textContent = 'Ja';
    yesButton.onclick = () => {
        document.body.removeChild(modal);
        setTimeout(resetGame, 100); // Add small delay to ensure cleanup
    };
    
    const noButton = document.createElement('button');
    noButton.textContent = 'Nein';
    noButton.onclick = () => {
        document.body.removeChild(modal);
        // Return to main screen
        document.getElementById('game-screen').style.display = 'none';
        document.getElementById('setup-screen').style.display = 'block';
        // Clear inputs
        document.getElementById('katzName').value = '';
        document.getElementById('mausName').value = '';
    };
    
    buttonContainer.appendChild(yesButton);
    buttonContainer.appendChild(noButton);
    content.appendChild(image);
    content.appendChild(text);
    content.appendChild(buttonContainer);
    modal.appendChild(content);
    document.body.appendChild(modal);
}

function updateMathOperation() {
    const mathDisplay = document.getElementById('math-display');
    const currentPos = gameState.currentPlayer === 'katz' ? 
        gameState.katzPosition : gameState.mausPosition;
    
    if (gameState.currentDice) {
        const operation = gameState.gameType === 'plus' ? '+' : '-';
        mathDisplay.textContent = `${currentPos} ${operation} ${gameState.currentDice}`;
    } else {
        // Show placeholder with current position
        const operation = gameState.gameType === 'plus' ? '+' : '-';
        mathDisplay.textContent = `${currentPos} ${operation} _`;
    }
}

function checkGameOver() {
    const message = document.getElementById('message');
    
    // Check if mouse reached or passed cheese in plus game
    if (gameState.gameType === 'plus' && gameState.mausPosition >= 21) {
        gameState.gameOver = true;
        message.textContent = `Spiel vorbei! ${gameState.mausName} hat den Käse erreicht!`;
        showGameOverModal('cheese');
        return;
    }
    
    // Check if mouse reached or passed cheese in minus game
    if (gameState.gameType === 'minus' && gameState.mausPosition <= 0) {
        gameState.gameOver = true;
        message.textContent = `Spiel vorbei! ${gameState.mausName} hat den Käse erreicht!`;
        showGameOverModal('cheese');
        return;
    }

    // Check if cat caught the mouse
    if ((gameState.gameType === 'plus' && gameState.katzPosition >= gameState.mausPosition) ||
        (gameState.gameType === 'minus' && gameState.katzPosition <= gameState.mausPosition)) {
        gameState.gameOver = true;
        message.textContent = 
            `Spiel vorbei! ${gameState.katzName} hat ${gameState.mausName} gefangen!`;
        showGameOverModal('cat');
    }
}

function resetGame() {
    // Reset game state
    gameState = {
        katzName: gameState.katzName, // Keep the names
        mausName: gameState.mausName,
        gameType: gameState.gameType,
        katzPosition: gameState.gameType === 'plus' ? 1 : 20,
        mausPosition: gameState.gameType === 'plus' ? 4 : 17,
        currentPlayer: 'maus',
        gameOver: false,
        diceValue: 0,
        turnCount: 0,
        maxTurns: 30,
        currentDice: 0,
        waitingForMove: false,
        selectedPiece: null
    };

    // Reset UI with placeholders
    document.getElementById('message').textContent = '';
    updateDiceDisplay();  // Show dice placeholder
    document.getElementById('current-turn').textContent = '';
    document.getElementById('rollDice').disabled = false;

    // Reset board
    createGameBoard();
    updatePlayerInfo();
    updateBoard();
    
    // Return to game screen
    document.getElementById('game-screen').style.display = 'block';
}

document.getElementById('rollDice').addEventListener('click', rollDice);

// Add to styles.css
document.head.insertAdjacentHTML('beforeend', `
    <style>
    body.wrong-move {
        background-color: rgba(255, 0, 0, 0.1);
        transition: background-color 0.5s;
    }
    </style>
`); 