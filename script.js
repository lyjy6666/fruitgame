class FruitMemoryGame {
    constructor() {
        this.gameBoard = document.getElementById('game-board');
        this.sequenceContainer = document.getElementById('sequence-container');
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.messageElement = document.getElementById('game-message');
        this.levelElement = document.getElementById('level');
        this.targetCountElement = document.getElementById('target-count');
        this.countdownElement = document.getElementById('countdown');
        this.countdownContainer = document.querySelector('.countdown');
        
        // 自定义模式元素
        this.customModeBtn = document.getElementById('custom-mode-btn');
        this.customModal = document.getElementById('custom-modal');
        this.closeModalBtn = document.querySelector('.close');
        this.startCustomBtn = document.getElementById('start-custom-btn');
        this.backBtn = document.getElementById('back-btn');
        
        // 自定义参数元素
        this.boardSizeSelect = document.getElementById('board-size');
        this.sequenceTimeInput = document.getElementById('sequence-time');
        this.level1TimeInput = document.getElementById('level1-time');
        this.level2TimeInput = document.getElementById('level2-time');
        this.level3TimeInput = document.getElementById('level3-time');
        this.level4TimeInput = document.getElementById('level4-time');
        this.fruitTimeInput = document.getElementById('fruit-time');
        this.failureBehaviorSelect = document.getElementById('failure-behavior');
        
        // 教程元素
        this.tutorialBtn = document.getElementById('tutorial-btn');
        this.tutorialModal = document.getElementById('tutorial-modal');
        this.closeTutorialBtn = document.getElementById('close-tutorial-btn');
        
        // 横屏模式元素
        this.orientationBtn = document.getElementById('orientation-btn');
        this.isLandscapeMode = false;
        
        this.fruits = ['🍎', '🍌', '🍇', '🍊', '🍋', '🍒', '🍓', '🍑', '🍍', '🥥', '🥝', '🥭'];
        this.boardSize = 6;
        this.totalCells = this.boardSize * this.boardSize;
        this.fruitsPerType = 3;
        
        // 序列倒计时器
        this.sequenceTimer = null;
        
        // 存储所有轮次的目标序列
        this.allTargetSequences = [];
        
        this.gameState = {
            level: 1,
            targetSequence: [],
            board: [],
            activeCells: [],
            selectedForVerification: [],
            matchedCells: [],
            currentTargetIndex: 0,
            isPlaying: false,
            isPaused: false,
            isSequenceVisible: false,
            startTime: 0,
            currentTime: 0,
            errors: 0,
            countdown: 60,
            timerInterval: null,
            verificationTimer: null,
            countdownTimer: null,
            verificationStartTime: 0
        };
        
        // 自定义模式设置
        this.customSettings = {
            enabled: false,
            boardSize: 6,
            sequenceTime: 8,
            levelTimes: [60, 75, 90, 120],
            fruitTime: 8,
            failureBehavior: 'current-level'
        };
        
        this.levelTargetCounts = [2, 4, 6, 8];
        
        this.init();
    }
    
    init() {
        this.createBoard();
        this.bindEvents();
        this.bindCustomModeEvents();
        this.bindTutorialEvents();
        this.updateUI();
    }
    
    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.tutorialBtn.addEventListener('click', () => this.showTutorial());
        this.orientationBtn.addEventListener('click', () => this.toggleLandscapeMode());
    }
    
    bindCustomModeEvents() {
        this.customModeBtn.addEventListener('click', () => {
            this.customModal.style.display = 'block';
        });
        
        this.closeModalBtn.addEventListener('click', () => {
            this.customModal.style.display = 'none';
        });
        
        this.backBtn.addEventListener('click', () => {
            this.resetToMainGame();
            this.customModal.style.display = 'none';
        });
        
        this.startCustomBtn.addEventListener('click', () => {
            this.loadCustomSettings();
            this.customModal.style.display = 'none';
            this.startCustomGame();
        });
        
        window.addEventListener('click', (e) => {
            if (e.target == this.customModal) {
                this.customModal.style.display = 'none';
            }
        });
    }
    
    bindTutorialEvents() {
        // 关闭教程模态框按钮
        this.closeTutorialBtn.addEventListener('click', () => {
            this.tutorialModal.style.display = 'none';
        });
        
        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            if (e.target == this.tutorialModal) {
                this.tutorialModal.style.display = 'none';
            }
        });
    }
    
    showTutorial() {
        this.tutorialModal.style.display = 'block';
    }
    
    toggleLandscapeMode() {
        this.isLandscapeMode = !this.isLandscapeMode;
        const gameContainer = document.querySelector('.game-container');
        const body = document.body;
        
        if (this.isLandscapeMode) {
            gameContainer.classList.add('landscape');
            body.classList.add('landscape-mode');
            this.orientationBtn.textContent = '竖屏模式';
            this.showMessage('已切换到横屏模式', 'info');
        } else {
            gameContainer.classList.remove('landscape');
            body.classList.remove('landscape-mode');
            this.orientationBtn.textContent = '横屏模式';
            this.showMessage('已切换到竖屏模式', 'info');
        }
    }
    
    loadCustomSettings() {
        this.customSettings.enabled = true;
        this.customSettings.boardSize = parseInt(this.boardSizeSelect.value);
        this.customSettings.sequenceTime = parseInt(this.sequenceTimeInput.value);
        this.customSettings.levelTimes = [
            parseInt(this.level1TimeInput.value),
            parseInt(this.level2TimeInput.value),
            parseInt(this.level3TimeInput.value),
            parseInt(this.level4TimeInput.value)
        ];
        this.customSettings.fruitTime = parseInt(this.fruitTimeInput.value);
        this.customSettings.failureBehavior = this.failureBehaviorSelect.value;
    }
    
    startCustomGame() {
        this.resetGameState(true);
        this.boardSize = this.customSettings.boardSize;
        this.totalCells = this.boardSize * this.boardSize;
        
        // 重新计算每种水果的数量
        this.fruitsPerType = Math.floor(this.totalCells / this.fruits.length);
        if (this.totalCells % this.fruits.length > 0) {
            this.fruitsPerType++;
        }
        
        this.createBoard();
        this.predictAllTargetSequences();
        this.generateBoardWithRequiredFruits();
        this.resetBoardState();
        this.loadLevelTargetSequence();
        this.showTargetSequence();
        this.gameState.isPlaying = true;
        this.updateUI();
    }
    
    resetToMainGame() {
        this.customSettings.enabled = false;
        this.boardSize = 6;
        this.totalCells = this.boardSize * this.boardSize;
        this.fruitsPerType = 3;
        
        this.resetGameState(true);
        this.createBoard();
        this.updateUI();
        this.showMessage('已返回主游戏模式', 'info');
    }
    
    createBoard() {
        this.gameBoard.innerHTML = '';
        
        // 设置游戏板的网格布局
        this.gameBoard.style.gridTemplateColumns = `repeat(${this.boardSize}, 1fr)`;
        this.gameBoard.style.gridTemplateRows = `repeat(${this.boardSize}, 1fr)`;
        
        for (let i = 0; i < this.totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            
            const fruitArea = document.createElement('div');
            fruitArea.className = 'fruit-area';
            
            const buttonArea = document.createElement('div');
            buttonArea.className = 'button-area';
            
            const viewBtn = document.createElement('button');
            viewBtn.className = 'view-btn';
            viewBtn.textContent = '查看';
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleViewClick(i);
            });
            
            const verifyBtn = document.createElement('button');
            verifyBtn.className = 'verify-btn';
            verifyBtn.textContent = '验证';
            verifyBtn.disabled = true;
            verifyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleVerifyClick(i);
            });
            
            buttonArea.appendChild(viewBtn);
            buttonArea.appendChild(verifyBtn);
            
            cell.appendChild(fruitArea);
            cell.appendChild(buttonArea);
            
            this.gameBoard.appendChild(cell);
        }
    }
    
    startGame() {
        if (this.gameState.isPlaying && !this.gameState.isPaused) {
            return;
        }
        
        if (this.gameState.isPaused) {
            this.resumeGame();
            return;
        }
        
        this.resetGameState(true);
        this.predictAllTargetSequences();
        this.generateBoardWithRequiredFruits();
        this.resetBoardState();
        this.loadLevelTargetSequence();
        this.showTargetSequence();
        this.gameState.isPlaying = true;
        this.updateUI();
    }
    
    resetGame() {
        if (this.customSettings.enabled) {
            this.startCustomGame();
        } else {
            this.resetGameState(true);
            this.createBoard();
            this.predictAllTargetSequences();
            this.generateBoardWithRequiredFruits();
            this.updateUI();
            this.showMessage('游戏已重置', 'info');
        }
    }
    
    resetGameState(fullReset = false) {
        clearInterval(this.gameState.timerInterval);
        clearTimeout(this.gameState.verificationTimer);
        clearInterval(this.gameState.countdownTimer);
        
        // 清除序列倒计时器
        if (this.sequenceTimer) {
            clearInterval(this.sequenceTimer);
            this.sequenceTimer = null;
        }
        
        const level = fullReset ? 1 : this.gameState.level;
        let countdown = 60;
        
        if (this.customSettings.enabled) {
            countdown = this.customSettings.levelTimes[level - 1] || 60;
        }
        
        // 保存当前棋盘（如果不是完全重置）
        const currentBoard = fullReset ? [] : this.gameState.board;
        
        this.gameState = {
            level: level,
            targetSequence: [],
            board: currentBoard,
            activeCells: [],
            selectedForVerification: [],
            matchedCells: [],
            currentTargetIndex: 0,
            isPlaying: false,
            isPaused: false,
            isSequenceVisible: false,
            startTime: 0,
            currentTime: 0,
            errors: fullReset ? 0 : this.gameState.errors,
            countdown: countdown,
            timerInterval: null,
            verificationTimer: null,
            countdownTimer: null,
            verificationStartTime: 0
        };
        
        // 完全重置时清空所有目标序列
        if (fullReset) {
            this.allTargetSequences = [];
        }
        
        this.sequenceContainer.innerHTML = '';
        this.countdownElement.textContent = countdown;
        this.countdownContainer.classList.remove('warning');
        this.hideMessage();
    }
    
    // 预测所有轮次的目标序列
    predictAllTargetSequences() {
        this.allTargetSequences = [];
        
        for (let level = 1; level <= this.levelTargetCounts.length; level++) {
            const targetCount = this.levelTargetCounts[level - 1] || 8;
            const sequence = [];
            const usedFruits = new Set();
            
            for (let i = 0; i < targetCount; i++) {
                let randomFruit;
                // 确保不会重复使用相同的水果
                do {
                    randomFruit = this.fruits[Math.floor(Math.random() * this.fruits.length)];
                } while (usedFruits.has(randomFruit));
                
                sequence.push(randomFruit);
                usedFruits.add(randomFruit);
            }
            
            this.allTargetSequences.push(sequence);
        }
    }
    
    // 生成包含所有需要水果的棋盘
    generateBoardWithRequiredFruits() {
        // 确保每种水果的数量都是3个
        const board = [];
        this.fruits.forEach(fruit => {
            for (let i = 0; i < 3; i++) {
                board.push(fruit);
            }
        });
        
        // 如果格子数量超过水果总数，用随机水果填充
        while (board.length < this.totalCells) {
            const randomFruit = this.fruits[Math.floor(Math.random() * this.fruits.length)];
            board.push(randomFruit);
        }
        
        this.shuffleArray(board);
        this.gameState.board = board;
    }
    
    // 加载当前轮次的目标序列
    loadLevelTargetSequence() {
        const levelIndex = this.gameState.level - 1;
        if (levelIndex < this.allTargetSequences.length) {
            this.gameState.targetSequence = this.allTargetSequences[levelIndex];
        } else {
            // 如果没有预生成的序列，生成一个新的
            this.generateTargetSequence();
        }
    }
    
    generateBoard() {
        const board = [];
        
        for (let i = 0; i < this.fruits.length; i++) {
            for (let j = 0; j < this.fruitsPerType; j++) {
                board.push(this.fruits[i]);
            }
        }
        
        this.shuffleArray(board);
        this.gameState.board = board.slice(0, this.totalCells);
    }
    
    generateTargetSequence() {
        const targetCount = this.levelTargetCounts[this.gameState.level - 1] || 8;
        const sequence = [];
        
        // 从当前棋盘上收集所有唯一的水果类型
        const availableFruits = [...new Set(this.gameState.board)];
        
        for (let i = 0; i < targetCount; i++) {
            // 从可用水果中随机选择
            const randomFruit = availableFruits[Math.floor(Math.random() * availableFruits.length)];
            sequence.push(randomFruit);
        }
        
        this.gameState.targetSequence = sequence;
    }
    
    showTargetSequence() {
        this.sequenceContainer.innerHTML = '';
        this.gameState.isSequenceVisible = true;
        
        const targetSequenceElement = document.getElementById('target-sequence');
        const sequenceTimerElement = document.getElementById('sequence-timer');
        targetSequenceElement.classList.add('highlight');
        
        this.gameState.targetSequence.forEach((fruit, index) => {
            setTimeout(() => {
                const fruitElement = document.createElement('div');
                fruitElement.className = 'target-fruit fade-in';
                fruitElement.textContent = fruit;
                this.sequenceContainer.appendChild(fruitElement);
            }, index * 300);
        });
        
        this.showMessage('记住目标序列！', 'info');
        
        const sequenceTime = this.customSettings.enabled ? this.customSettings.sequenceTime : 5;
        let countdown = sequenceTime;
        sequenceTimerElement.textContent = countdown;
        
        // 清除之前的序列倒计时器
        if (this.sequenceTimer) {
            clearInterval(this.sequenceTimer);
        }
        
        // 存储为实例变量
        this.sequenceTimer = setInterval(() => {
            countdown--;
            sequenceTimerElement.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(this.sequenceTimer);
                this.sequenceTimer = null;
            }
        }, 1000);
        
        setTimeout(() => {
            targetSequenceElement.classList.remove('highlight');
        }, 2000);
        
        setTimeout(() => {
            this.hideTargetSequence();
            this.startGameplay();
        }, sequenceTime * 1000);
    }
    
    hideTargetSequence() {
        this.sequenceContainer.innerHTML = '';
        const sequenceTimerElement = document.getElementById('sequence-timer');
        const sequenceTime = this.customSettings.enabled ? this.customSettings.sequenceTime : 5;
        sequenceTimerElement.textContent = sequenceTime;
        this.gameState.isSequenceVisible = false;
        this.showMessage('开始寻找水果！', 'info');
    }
    
    startGameplay() {
        this.startCountdown();
    }
    
    startCountdown() {
        // 清除之前的倒计时器
        clearInterval(this.gameState.countdownTimer);
        
        if (this.gameState.countdown === 0) {
            if (this.customSettings.enabled) {
                this.gameState.countdown = this.customSettings.levelTimes[this.gameState.level - 1] || 60;
            } else {
                this.gameState.countdown = 60;
            }
        }
        
        this.countdownElement.textContent = this.gameState.countdown;
        this.countdownContainer.classList.remove('warning');
        
        if (this.gameState.countdown <= 10) {
            this.countdownContainer.classList.add('warning');
        }
        
        this.gameState.countdownTimer = setInterval(() => {
            this.gameState.countdown--;
            this.countdownElement.textContent = this.gameState.countdown;
            
            if (this.gameState.countdown <= 10) {
                this.countdownContainer.classList.add('warning');
                if (this.gameState.countdown === 10) {
                    this.playWarningSound();
                }
            }
            
            if (this.gameState.countdown <= 0) {
                clearInterval(this.gameState.countdownTimer);
                this.handleFailure();
            }
        }, 1000);
    }
    
    playWarningSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAD');
            audio.play();
        } catch (e) {
            console.log('无法播放警告音效:', e);
        }
    }
    
    handleViewClick(index) {
        if (!this.gameState.isPlaying || this.gameState.isPaused || this.gameState.isSequenceVisible) {
            return;
        }
        
        if (this.gameState.matchedCells.includes(index)) {
            return;
        }
        
        this.revealCell(index);
        this.gameState.activeCells.push(index);
        
        const verifyBtn = this.gameBoard.children[index].querySelector('.verify-btn');
        verifyBtn.disabled = false;
        verifyBtn.classList.add('active');
        
        const fruitTime = this.customSettings.enabled ? this.customSettings.fruitTime * 1000 : 2500;
        
        setTimeout(() => {
            this.hideCell(index);
            this.gameState.activeCells = this.gameState.activeCells.filter(i => i !== index);
            
            const verifyBtn = this.gameBoard.children[index].querySelector('.verify-btn');
            verifyBtn.disabled = true;
            verifyBtn.classList.remove('active');
        }, fruitTime);
    }
    
    handleVerifyClick(index) {
        if (!this.gameState.isPlaying || this.gameState.isPaused || this.gameState.isSequenceVisible) {
            return;
        }
        
        if (!this.gameState.activeCells.includes(index)) {
            this.handleFailure();
            return;
        }
        
        if (this.gameState.matchedCells.includes(index)) {
            return;
        }
        
        const fruit = this.gameState.board[index];
        const currentTarget = this.gameState.targetSequence[this.gameState.currentTargetIndex];
        
        if (fruit !== currentTarget) {
            this.handleFailure();
            return;
        }
        
        this.gameState.selectedForVerification.push(index);
        
        if (this.gameState.selectedForVerification.length === 1) {
            this.gameState.verificationStartTime = Date.now();
            this.gameState.verificationTimer = setTimeout(() => {
                this.gameState.selectedForVerification = [];
                this.showMessage('验证超时，请重新开始', 'error');
            }, 1000);
        } else if (this.gameState.selectedForVerification.length === 2) {
            clearTimeout(this.gameState.verificationTimer);
            this.processVerification();
        }
    }
    
    processVerification() {
        const [firstIndex, secondIndex] = this.gameState.selectedForVerification;
        
        if (this.gameState.board[firstIndex] === this.gameState.board[secondIndex]) {
            this.markCellsAsMatched(firstIndex, secondIndex);
            this.gameState.matchedCells.push(firstIndex, secondIndex);
            this.gameState.selectedForVerification = [];
            this.gameState.currentTargetIndex++;
            
            this.showMessage('验证成功！', 'success');
            
            if (this.gameState.currentTargetIndex >= this.gameState.targetSequence.length) {
                this.completeLevel();
            }
        } else {
            this.handleFailure();
        }
    }
    
    handleFailure() {
        if (this.customSettings.enabled && this.customSettings.failureBehavior === 'current-level') {
            this.showMessage('错误！从当前轮重新开始', 'error');
            setTimeout(() => {
                this.resetGameState(false);
                // 不重新生成棋盘，保持当前棋盘不变
                this.loadLevelTargetSequence();
                this.resetBoardState();
                this.showTargetSequence();
                this.gameState.isPlaying = true;
                this.updateUI();
            }, 2000);
        } else {
            this.showMessage('闯关失败！从第一轮重新开始', 'error');
            setTimeout(() => {
                this.resetGameState(true);
                this.createBoard();
                this.predictAllTargetSequences();
                this.generateBoardWithRequiredFruits();
                this.loadLevelTargetSequence();
                this.resetBoardState();
                this.showTargetSequence();
                this.gameState.isPlaying = true;
                this.updateUI();
            }, 2000);
        }
    }
    
    revealCell(index) {
        const cell = this.gameBoard.children[index];
        const fruitArea = cell.querySelector('.fruit-area');
        fruitArea.textContent = this.gameState.board[index];
        cell.classList.add('lit', 'fade-in');
    }
    
    hideCell(index) {
        const cell = this.gameBoard.children[index];
        const fruitArea = cell.querySelector('.fruit-area');
        fruitArea.textContent = '';
        cell.classList.remove('lit', 'fade-in');
    }
    
    markCellsAsMatched(...indices) {
        indices.forEach(index => {
            const cell = this.gameBoard.children[index];
            cell.classList.add('matched');
            cell.style.pointerEvents = 'none';
            
            const viewBtn = cell.querySelector('.view-btn');
            const verifyBtn = cell.querySelector('.verify-btn');
            viewBtn.disabled = true;
            verifyBtn.disabled = true;
        });
    }
    
    completeLevel() {
        clearInterval(this.gameState.countdownTimer);
        
        if (this.gameState.level >= this.levelTargetCounts.length) {
            this.showCompletionEffect('游戏完成！');
            this.gameState.isPlaying = false;
        } else {
            this.showCompletionEffect(`第 ${this.gameState.level} 轮完成！`);
            
            setTimeout(() => {
                this.gameState.level++;
                this.resetGameState();
                // 不重新生成棋盘，保持当前棋盘不变
                this.loadLevelTargetSequence();
                this.resetBoardState();
                this.showTargetSequence();
                this.gameState.isPlaying = true;
                this.updateUI();
            }, 3000);
        }
    }
    
    showCompletionEffect(message) {
        // 创建庆祝动画元素
        const celebrationElement = document.createElement('div');
        celebrationElement.className = 'celebration';
        celebrationElement.innerHTML = `
            <div class="confetti-container" id="confetti-container"></div>
            <div class="celebration-message">${message}</div>
            <div class="celebration-text">太棒了！</div>
        `;
        
        document.body.appendChild(celebrationElement);
        
        // 添加动画效果
        this.createConfetti();
        
        // 3秒后移除庆祝元素
        setTimeout(() => {
            celebrationElement.remove();
        }, 3000);
        
        // 播放庆祝音效
        this.playCelebrationSound();
    }
    
    createConfetti() {
        const confettiContainer = document.getElementById('confetti-container');
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confettiContainer.appendChild(confetti);
        }
    }
    
    playCelebrationSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAD');
            audio.play();
        } catch (e) {
            console.log('无法播放庆祝音效:', e);
        }
    }
    
    resetBoardState() {
        for (let i = 0; i < this.totalCells; i++) {
            const cell = this.gameBoard.children[i];
            const fruitArea = cell.querySelector('.fruit-area');
            const viewBtn = cell.querySelector('.view-btn');
            const verifyBtn = cell.querySelector('.verify-btn');
            
            cell.classList.remove('matched', 'lit', 'fade-in');
            fruitArea.textContent = '';
            viewBtn.disabled = false;
            verifyBtn.disabled = true;
            verifyBtn.classList.remove('active');
            cell.style.pointerEvents = 'auto';
        }
    }
    
    togglePause() {
        if (!this.gameState.isPlaying) {
            return;
        }
        
        this.gameState.isPaused = !this.gameState.isPaused;
        
        if (this.gameState.isPaused) {
            clearInterval(this.gameState.countdownTimer);
            this.pauseBtn.textContent = '继续';
            this.showMessage('游戏已暂停', 'info');
        } else {
            this.resumeGame();
        }
    }
    
    resumeGame() {
        this.gameState.isPaused = false;
        this.pauseBtn.textContent = '暂停';
        
        this.startCountdown();
        this.showMessage('游戏继续', 'info');
    }
    
    updateUI() {
        this.levelElement.textContent = this.gameState.level;
        const targetCount = this.levelTargetCounts[this.gameState.level - 1] || 8;
        this.targetCountElement.textContent = targetCount;
        
        if (this.gameState.isPlaying) {
            this.startBtn.textContent = '开始游戏';
        }
    }
    
    showMessage(text, type = 'info') {
        this.messageElement.textContent = text;
        this.messageElement.className = `game-message message-${type}`;
    }
    
    hideMessage() {
        this.messageElement.textContent = '';
        this.messageElement.className = 'game-message';
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new FruitMemoryGame();
});