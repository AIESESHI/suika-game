// main.js

// ゲーム状態管理
const gameState = {
    fruits: [],
    currentFruit: null,
    nextFruit: null,
    currentScore: 0,
    highScore: 0,
    isGameOver: false,
    isPaused: false,
    lastFrameTime: 0,
    deltaTime: 0,
    gameTime: 0,
    debug: true
};

// UI要素の取得
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const retryBtn = document.getElementById('retryBtn');
const currentScoreElement = document.getElementById('currentScore');
const highScoreElement = document.getElementById('highScore');
const gameContainer = document.getElementById('gameContainer');

// ゲーム設定
const GAME_CONFIG = {
    FPS: 60,
    FRAME_TIME: 1000 / 60,
    MIN_FRUIT_INTERVAL: 500,
    GRAVITY: 0.5,
    MAX_FRUIT_SPEED: 15,
    MOVEMENT_SPEED: 5,
    BOUNDARY_LINE_Y: 150,
    PHYSICS: {
        GRAVITY: 0.5,
        FRICTION: 0.05,
        RESTITUTION: 0.3
    }
};

// デバッグログ
function debugLog(message) {
    if (gameState.debug) {
        console.log(`[DEBUG] ${message}`);
    }
}

// ゲーム初期化
function initGame() {
    loadHighScore();
    createEventListeners();
    resetGame();
    requestAnimationFrame(gameLoop);
    debugLog('ゲームを初期化しました');
}

// ハイスコアの読み込み
function loadHighScore() {
    const storedScore = localStorage.getItem('highScore');
    if (storedScore) {
        gameState.highScore = parseInt(storedScore, 10);
        highScoreElement.textContent = gameState.highScore;
    }
}

// イベントリスナーの設定
function createEventListeners() {
    // マウス移動
    canvas.addEventListener('mousemove', handleMouseMove);
    
    // クリック操作
    canvas.addEventListener('mousedown', handleClick);
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleClick();
    });

    // キーボード操作
    window.addEventListener('keydown', (e) => {
        if (gameState.isGameOver) return;
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                debugLog('スペースキーが押されました');
                handleClick();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (gameState.currentFruit && !gameState.currentFruit.isFalling) {
                    gameState.currentFruit.x = Math.max(
                        gameState.currentFruit.radius,
                        gameState.currentFruit.x - GAME_CONFIG.MOVEMENT_SPEED
                    );
                }
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (gameState.currentFruit && !gameState.currentFruit.isFalling) {
                    gameState.currentFruit.x = Math.min(
                        canvas.width - gameState.currentFruit.radius,
                        gameState.currentFruit.x + GAME_CONFIG.MOVEMENT_SPEED
                    );
                }
                break;
        }
    });

    // リトライボタン
    retryBtn.addEventListener('click', resetGame);
}

// マウス移動ハンドラ
function handleMouseMove(e) {
    if (gameState.isGameOver || !gameState.currentFruit || gameState.currentFruit.isFalling) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    gameState.currentFruit.x = Math.max(
        gameState.currentFruit.radius,
        Math.min(canvas.width - gameState.currentFruit.radius, x)
    );

    debugLog(`フルーツを移動: x=${Math.round(gameState.currentFruit.x)}`);
}

// クリック処理
function handleClick() {
    if (gameState.isGameOver || !gameState.currentFruit || gameState.currentFruit.isFalling) return;
    
    gameState.currentFruit.isFalling = true;
    gameState.currentFruit.vy = 1; // 初速を与える
    debugLog(`フルーツを落下させます: ${gameState.currentFruit.name} at (${Math.round(gameState.currentFruit.x)}, ${Math.round(gameState.currentFruit.y)})`);
}

// ゲームループ
function gameLoop(currentTime) {
    if (!gameState.lastFrameTime) {
        gameState.lastFrameTime = currentTime;
    }

    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / GAME_CONFIG.FRAME_TIME;
    gameState.lastFrameTime = currentTime;

    if (gameState.deltaTime > 2) {
        gameState.deltaTime = 2;
    }

    update();
    render();
    resetDebugCounters();
    requestAnimationFrame(gameLoop);
}

// ゲーム状態の更新
function update() {
    if (gameState.isGameOver || gameState.isPaused) return;

    // 新しいフルーツの生成
    if (!gameState.currentFruit) {
        if (gameState.nextFruit) {
            gameState.currentFruit = gameState.nextFruit;
            gameState.nextFruit = null;
        } else {
            gameState.currentFruit = createRandomFruit(canvas.width);
        }
        
        if (!gameState.nextFruit) {
            gameState.nextFruit = createRandomFruit(canvas.width);
        }

        debugLog(`新しいフルーツを生成: ${gameState.currentFruit.name}`);
    }

    // フルーツの物理演算
    if (gameState.currentFruit && gameState.currentFruit.isFalling) {
        applyPhysics(gameState.currentFruit);

        // 衝突判定
        if (checkCollision()) {
            debugLog(`フルーツが衝突: ${gameState.currentFruit.name}`);
            settleFruit(gameState.currentFruit, gameState.fruits);
            gameState.currentFruit = null;
        }
    }

    // 既存のフルーツに物理演算を適用
    gameState.fruits.forEach(fruit => {
        applyPhysics(fruit);
    });

    // フルーツ同士の衝突解決
    resolveCollisions();

    // 合体判定
    checkCombineFruits();

    // ゲームオーバー判定
    checkGameOver();
}

// 物理演算の適用
function applyPhysics(fruit) {
    if (!fruit.isFalling) return;

    // 重力
    fruit.vy += GAME_CONFIG.PHYSICS.GRAVITY * gameState.deltaTime;
    fruit.vy = Math.min(fruit.vy, GAME_CONFIG.MAX_FRUIT_SPEED);
    
    // 位置の更新
    fruit.x += fruit.vx * gameState.deltaTime;
    fruit.y += fruit.vy * gameState.deltaTime;
    
    // 壁との衝突
    if (fruit.x - fruit.radius < 0) {
        fruit.x = fruit.radius;
        fruit.vx = -fruit.vx * GAME_CONFIG.PHYSICS.RESTITUTION;
    } else if (fruit.x + fruit.radius > canvas.width) {
        fruit.x = canvas.width - fruit.radius;
        fruit.vx = -fruit.vx * GAME_CONFIG.PHYSICS.RESTITUTION;
    }
    
    // 床との衝突
    if (fruit.y + fruit.radius > canvas.height) {
        fruit.y = canvas.height - fruit.radius;
        fruit.vy = -fruit.vy * GAME_CONFIG.PHYSICS.RESTITUTION;
        fruit.vx *= (1 - GAME_CONFIG.PHYSICS.FRICTION);
        
        if (Math.abs(fruit.vy) < 0.1) {
            fruit.vy = 0;
        }
    }
}

// フルーツ同士の衝突解決
function resolveCollisions() {
    const allFruits = [...gameState.fruits];
    if (gameState.currentFruit && gameState.currentFruit.isFalling) {
        allFruits.push(gameState.currentFruit);
    }
    
    for (let i = 0; i < allFruits.length; i++) {
        for (let j = i + 1; j < allFruits.length; j++) {
            const f1 = allFruits[i];
            const f2 = allFruits[j];
            
            const dx = f2.x - f1.x;
            const dy = f2.y - f1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = f1.radius + f2.radius;
            
            if (distance < minDistance) {
                const overlap = minDistance - distance;
                const angle = Math.atan2(dy, dx);
                
                const totalMass = f1.mass + f2.mass;
                const f1Ratio = f2.mass / totalMass;
                const f2Ratio = f1.mass / totalMass;
                
                f1.x -= Math.cos(angle) * overlap * f1Ratio;
                f1.y -= Math.sin(angle) * overlap * f1Ratio;
                f2.x += Math.cos(angle) * overlap * f2Ratio;
                f2.y += Math.sin(angle) * overlap * f2Ratio;
                
                const nx = dx / distance;
                const ny = dy / distance;
                const p = 2 * (f1.vx * nx + f1.vy * ny - f2.vx * nx - f2.vy * ny) / totalMass;
                
                f1.vx -= p * f2.mass * nx * GAME_CONFIG.PHYSICS.RESTITUTION;
                f1.vy -= p * f2.mass * ny * GAME_CONFIG.PHYSICS.RESTITUTION;
                f2.vx += p * f1.mass * nx * GAME_CONFIG.PHYSICS.RESTITUTION;
                f2.vy += p * f1.mass * ny * GAME_CONFIG.PHYSICS.RESTITUTION;
            }
        }
    }
}

// 衝突判定
function checkCollision() {
    if (!gameState.currentFruit) return false;
    
    const fruit = gameState.currentFruit;
    
    // 地面との衝突
    if (fruit.y + fruit.radius >= canvas.height) {
        return true;
    }

    // 他のフルーツとの衝突
    for (const other of gameState.fruits) {
        const dx = fruit.x - other.x;
        const dy = fruit.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < fruit.radius + other.radius) {
            return true;
        }
    }

    return false;
}

// フルーツの合体判定
function checkCombineFruits() {
    for (let i = 0; i < gameState.fruits.length; i++) {
        for (let j = i + 1; j < gameState.fruits.length; j++) {
            const f1 = gameState.fruits[i];
            const f2 = gameState.fruits[j];

            if (f1.rank === f2.rank) {
                const dx = f1.x - f2.x;
                const dy = f1.y - f2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < f1.radius + f2.radius) {
                    combineFruits(f1, f2);
                    return;
                }
            }
        }
    }
}

// フルーツの合体処理
function combineFruits(f1, f2) {
    const newRank = f1.rank + 1;
    if (newRank > FRUITS.length) return;

    debugLog(`フルーツが合体: ${f1.name} + ${f2.name} -> ${FRUITS[newRank - 1].name}`);

    // スコア加算
    updateScore(FRUITS[newRank - 1].scoreValue);

    // 新しいフルーツを生成
    const newFruit = {
        ...FRUITS[newRank - 1],
        x: (f1.x + f2.x) / 2,
        y: (f1.y + f2.y) / 2,
        vx: (f1.vx + f2.vx) / 2,
        vy: (f1.vy + f2.vy) / 2,
        isFalling: true,
        mass: FRUITS[newRank - 1].radius * FRUITS[newRank - 1].radius * 0.01,
        image: loadImage(FRUITS[newRank - 1].imagePath)
    };

    // 古いフルーツを削除して新しいフルーツを追加
    gameState.fruits = gameState.fruits.filter(f => f !== f1 && f !== f2);
    gameState.fruits.push(newFruit);

    // 合体エフェクト
    createCombineEffect(newFruit.x, newFruit.y, newFruit.radius);
}

// 合体エフェクト
function createCombineEffect(x, y, radius) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.restore();
}

// スコア更新
function updateScore(points) {
    gameState.currentScore += points;
    currentScoreElement.textContent = gameState.currentScore;
    
    // スコア更新アニメーション
    currentScoreElement.classList.remove('score-updated');
    void currentScoreElement.offsetWidth;
    currentScoreElement.classList.add('score-updated');

    // ハイスコア更新
    if (gameState.currentScore > gameState.highScore) {
        gameState.highScore = gameState.currentScore;
        highScoreElement.textContent = gameState.highScore;
        localStorage.setItem('highScore', gameState.highScore);
        debugLog(`ハイスコア更新: ${gameState.highScore}`);
    }
}

// 描画処理
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景のグリッド
    drawGrid();

    // 境界線
    drawBoundaryLine();

    // 全フルーツの描画
    gameState.fruits.forEach(fruit => {
        drawFruit(ctx, fruit);
    });

    // 現在のフルーツを描画
    if (gameState.currentFruit) {
        drawFruit(ctx, gameState.currentFruit);
    }

    // 次のフルーツのプレビュー
    if (gameState.nextFruit && !gameState.isGameOver) {
        drawNextFruitPreview();
    }

    // ゲームオーバー表示
    if (gameState.isGameOver) {
        drawGameOver();
    }
}

// グリッド描画
function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // 縦線
    for (let x = 0; x <= canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // 横線
    for (let y = 0; y <= canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    ctx.restore();
}

// 境界線の描画
function drawBoundaryLine() {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, GAME_CONFIG.BOUNDARY_LINE_Y);
    ctx.lineTo(canvas.width, GAME_CONFIG.BOUNDARY_LINE_Y);
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

// 次のフルーツのプレビュー
function drawNextFruitPreview() {
    if (!gameState.nextFruit) return;

    const previewX = canvas.width - 50;
    const previewY = 50;
    const previewScale = 0.5;
    
    ctx.save();
    ctx.globalAlpha = 0.7;
    
    // プレビュー背景
    ctx.beginPath();
    ctx.arc(previewX, previewY, gameState.nextFruit.radius * previewScale + 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    
    // プレビューフルーツ
    const previewFruit = {
        ...gameState.nextFruit,
        x: previewX,
        y: previewY,
        radius: gameState.nextFruit.radius * previewScale
    };
    
    drawFruit(ctx, previewFruit);
    
    ctx.restore();
}

// ゲームオーバー表示
function drawGameOver() {
    ctx.save();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);
    
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${gameState.currentScore}`, canvas.width / 2, canvas.height / 2 + 10);
    
    ctx.restore();
}

// ゲームオーバー処理
function checkGameOver() {
    for (const fruit of gameState.fruits) {
        if (fruit.y - fruit.radius < GAME_CONFIG.BOUNDARY_LINE_Y) {
            gameOver();
            return;
        }
    }
}

function gameOver() {
    gameState.isGameOver = true;
    gameContainer.classList.add('game-over');
    retryBtn.classList.add('visible');
    debugLog('ゲームオーバー');
}

// ゲームリセット
function resetGame() {
    gameState.fruits = [];
    gameState.currentFruit = null;
    gameState.nextFruit = null;
    gameState.currentScore = 0;
    gameState.isGameOver = false;
    gameState.isPaused = false;
    
    currentScoreElement.textContent = '0';
    gameContainer.classList.remove('game-over');
    retryBtn.classList.remove('visible');
    
    debugLog('ゲームをリセットしました');
}

// ゲーム開始
initGame();