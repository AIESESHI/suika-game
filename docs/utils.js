// utils.js

// 物理パラメータ
const PHYSICS_CONFIG = {
    GRAVITY: 0.5,
    FRICTION: 0.05,
    RESTITUTION: 0.3,
    MAX_SPEED: 15
};

// フルーツ同士の衝突判定
function checkFruitCollision(fruit1, fruit2) {
    const dx = fruit1.x - fruit2.x;
    const dy = fruit1.y - fruit2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < fruit1.radius + fruit2.radius;
}

// フルーツと地面の衝突判定
function checkGroundCollision(fruit, canvasHeight) {
    return fruit.y + fruit.radius >= canvasHeight;
}

// フルーツと壁の衝突判定
function checkWallCollision(fruit, canvasWidth) {
    return fruit.x - fruit.radius <= 0 || fruit.x + fruit.radius >= canvasWidth;
}

// 物理演算の適用
function applyPhysics(fruit, delta, boundaries) {
    if (!fruit.isFalling) return;

    // 重力
    fruit.vy += PHYSICS_CONFIG.GRAVITY * delta;
    fruit.vy = Math.min(fruit.vy, PHYSICS_CONFIG.MAX_SPEED);
    
    // 速度の適用
    fruit.x += fruit.vx * delta;
    fruit.y += fruit.vy * delta;
    
    // 壁との衝突
    if (fruit.x - fruit.radius < 0) {
        fruit.x = fruit.radius;
        fruit.vx = -fruit.vx * PHYSICS_CONFIG.RESTITUTION;
    } else if (fruit.x + fruit.radius > boundaries.width) {
        fruit.x = boundaries.width - fruit.radius;
        fruit.vx = -fruit.vx * PHYSICS_CONFIG.RESTITUTION;
    }
    
    // 床との衝突
    if (fruit.y + fruit.radius > boundaries.height) {
        fruit.y = boundaries.height - fruit.radius;
        fruit.vy = -fruit.vy * PHYSICS_CONFIG.RESTITUTION;
        fruit.vx *= (1 - PHYSICS_CONFIG.FRICTION);
        
        if (Math.abs(fruit.vy) < 0.1) {
            fruit.vy = 0;
        }
    }
}

// ローカルストレージの操作
const storage = {
    save: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage save error:', e);
            return false;
        }
    },
    
    load: (key, defaultValue = null) => {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (e) {
            console.error('Storage load error:', e);
            return defaultValue;
        }
    }
};