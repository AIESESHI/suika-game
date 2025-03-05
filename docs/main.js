// main.js

// ゲームの状態管理
let currentFruit = null;
let fruits = [];
let currentScore = 0;
let highScore = 0;
let isGameOver = false;
let lastFrameTime = 0;
let gameLoopId = null;

// キャンバスの設定
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const retryBtn = document.getElementById('retryBtn');
const currentScoreElement = document.getElementById('currentScore');
const highScoreElement = document.getElementById('highScore');

// ゲームの初期化
function initGame() {
    console.log('[DEBUG] ゲームを初期化しました');
    loadHighScore();
    setupEventListeners();
    resetGame();
    gameLoop();
}

// ハイスコアの読み込み
function loadHighScore() {
    highScore = storage.load('highScore', 0);
    highScoreElement.textContent = highScore;
}

// イベントリスナーの設定
function setupEventListeners() {
    // キーボード操作
    document.addEventListener('keydown', handleKeyPress);
    
    // マウス操作
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    
    // タッチ操作
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // リトライボタン
    retryBtn.addEventListener('click', resetGame);
}

// キー操作の処理
function handleKeyPress(e) {
    if (isGameOver) return;
    
    switch (e.code) {
        case 'ArrowLeft':
            moveCurrentFruit('left');
            break;
        case 'ArrowRight':
            moveCurrentFruit('right');
            break;
        case 'Space':
            if (currentFruit && !currentFruit.isFalling) {
                dropCurrentFruit();
            }
            break;
    }
}

// マウス操作の処理
function handleMouseMove(e) {
    if (isGameOver || !currentFruit || currentFruit.isFalling) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    currentFruit.x = Math.max(currentFruit.radius, 
                             Math.min(canvas.width - currentFruit.radius, x));
}

function handleClick() {
    if (currentFruit && !currentFruit.isFalling) {
        dropCurrentFruit();
    }
}

// タッチ操作の処理
function handleTouchMove(e) {
    e.preventDefault();
    if (isGameOver || !currentFruit || currentFruit.isFalling) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    currentFruit.x = Math.max(currentFruit.radius, 
                             Math.min(canvas.width - currentFruit.radius, x));
}

function handleTouchEnd() {
    if (currentFruit && !currentFruit.isFalling) {
        dropCurrentFruit();
    }
}

// フルーツの移動
function moveCurrentFruit(direction) {
    if (!currentFruit || currentFruit.isFalling) return;
    
    const moveSpeed = 20;
    const newX = direction === 'left' 
        ? currentFruit.x - moveSpeed 
        : currentFruit.x + moveSpeed;
        
    currentFruit.x = Math.max(currentFruit.radius, 
                             Math.min(canvas.width - currentFruit.radius, newX));
}

// フルーツを落とす
function dropCurrentFruit() {
    if (!currentFruit || currentFruit.isFalling) return;
    currentFruit.isFalling = true;
}

// ゲームのリセット
function resetGame() {
    console.log('[DEBUG] ゲームをリセットしました');
    fruits = [];
    currentFruit = null;
    currentScore = 0;
    isGameOver = false;
    currentScoreElement.textContent = '0';
    retryBtn.style.display = 'none';
    document.querySelector('.game-over-overlay').style.display = 'none';
}

// 新しいフルーツの生成
function createNewFruit() {
    const newFruit = createRandomFruit(canvas.width);
    console.log('[DEBUG] 新しいフルーツを生成:', newFruit.name);
    currentFruit = newFruit;
}

// フルーツの落下と衝突判定
function updateFruits(delta) {
    // 落下中のフルーツの更新
    if (currentFruit) {
        if (currentFruit.isFalling) {
            applyPhysics(currentFruit, delta, { width: canvas.width, height: canvas.height });
            
            // 他のフルーツとの衝突判定
            for (const fruit of fruits) {
                if (checkFruitCollision(currentFruit, fruit)) {
                    settleFruit(currentFruit, fruits);
                    currentFruit = null;
                    break;
                }
            }
            
            // 地面との衝突判定
            if (currentFruit && checkGroundCollision(currentFruit, canvas.height)) {
                settleFruit(currentFruit, fruits);
                currentFruit = null;
            }
        }
    } else {
        createNewFruit();
    }
    
    // フルーツの合体判定
    checkCombinations();
    
    // ゲームオーバー判定
    if (!isGameOver) {
        for (const fruit of fruits) {
            if (fruit.y - fruit.radius <= 0) {
                gameOver();
                break;
            }
        }
    }
}

// フルーツの合体チェック
function checkCombinations() {
    let combined;
    do {
        combined = false;
        for (let i = 0; i < fruits.length; i++) {
            for (let j = i + 1; j < fruits.length; j++) {
                const fruit1 = fruits[i];
                const fruit2 = fruits[j];
                
                if (fruit1.rank === fruit2.rank && checkFruitCollision(fruit1, fruit2)) {
                    // 同じランクのフルーツが接触
                    if (fruit1.rank < FRUITS.length) {
                        // 新しいフルーツを生成
                        const newFruitData = FRUITS[fruit1.rank];
                        const newFruit = {
                            ...createRandomFruit(canvas.width),
                            x: (fruit1.x + fruit2.x) / 2,
                            y: (fruit1.y + fruit2.y) / 2,
                            rank: newFruitData.rank,
                            radius: newFruitData.radius,
                            color: newFruitData.color,
                            innerColor: newFruitData.innerColor,
                            image: loadImage(newFruitData.imagePath),
                        };
                        
                        // スコア加算
                        updateScore(newFruitData.scoreValue);
                        
                        // 古いフルーツを削除し、新しいフルーツを追加
                        fruits = fruits.filter((f, index) => index !== i && index !== j);
                        fruits.push(newFruit);
                        combined = true;
                        break;
                    }
                }
            }
            if (combined) break;
        }
    } while (combined);
}

// スコアの更新
function updateScore(points) {
    currentScore += points;
    currentScoreElement.textContent = currentScore;
    
    if (currentScore > highScore) {
        highScore = currentScore;
        highScoreElement.textContent = highScore;
        storage.save('highScore', highScore);
    }
}

// ゲームオーバー処理
function gameOver() {
    isGameOver = true;
    document.querySelector('.game-over-overlay').style.display = 'flex';
    retryBtn.style.display = 'block';
}

// ゲームループ
function gameLoop(timestamp) {
    // デルタタイム（前フレームからの経過時間）の計算
    if (!lastFrameTime) lastFrameTime = timestamp;
    const delta = (timestamp - lastFrameTime) / 16; // 60FPSを基準に正規化
    lastFrameTime = timestamp;
    
    // 画面クリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // フルーツの更新
    if (!isGameOver) {
        updateFruits(delta);
    }
    
    // フルーツの描画
    fruits.forEach(fruit => drawFruit(ctx, fruit));
    if (currentFruit) {
        drawFruit(ctx, currentFruit);
    }
    
    // 次のフレームをリクエスト
    gameLoopId = requestAnimationFrame(gameLoop);
}

// ゲーム開始
initGame();