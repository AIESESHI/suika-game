// utils.js

/**
 * 数学的なユーティリティ
 */
const MathUtils = {
    // 2点間の距離を計算
    distance: (x1, y1, x2, y2) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    // 値を指定範囲内に制限
    clamp: (value, min, max) => {
        return Math.max(min, Math.min(max, value));
    },

    // 2つの円の交差を判定
    circlesIntersect: (c1, c2) => {
        const dist = MathUtils.distance(c1.x, c1.y, c2.x, c2.y);
        return dist < (c1.radius + c2.radius);
    },

    // ランダムな値を生成
    random: (min, max) => {
        return Math.random() * (max - min) + min;
    },

    // 角度をラジアンに変換
    degToRad: (degrees) => {
        return degrees * Math.PI / 180;
    }
};

/**
 * アニメーション用ユーティリティ
 */
const AnimationUtils = {
    // イージング関数
    easeOutBounce: (t) => {
        const n1 = 7.5625;
        const d1 = 2.75;

        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    },

    // 線形補間
    lerp: (start, end, t) => {
        return start + (end - start) * t;
    },

    // スプリングアニメーション用の値を計算
    spring: (current, target, velocity, stiffness = 0.1, damping = 0.8) => {
        const acceleration = (target - current) * stiffness;
        velocity = velocity * damping + acceleration;
        return {
            value: current + velocity,
            velocity: velocity
        };
    }
};

/**
 * 画像処理ユーティリティ
 */
const ImageUtils = {
    // 画像をプリロード
    preloadImage: (src) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    },

    // 画像を円形にクリップ
    drawCircularImage: (ctx, img, x, y, radius) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        const size = radius * 2;
        ctx.drawImage(img, x - radius, y - radius, size, size);
        
        ctx.restore();
    }
};

/**
 * デバッグユーティリティ
 */
const DebugUtils = {
    // フレームレート計測
    fps: {
        frames: 0,
        lastTime: performance.now(),
        value: 0,
        
        update() {
            this.frames++;
            const currentTime = performance.now();
            const elapsed = currentTime - this.lastTime;
            
            if (elapsed >= 1000) {
                this.value = Math.round((this.frames * 1000) / elapsed);
                this.frames = 0;
                this.lastTime = currentTime;
            }
            return this.value;
        }
    },

    // パフォーマンスモニタリング
    performance: {
        times: [],
        
        start() {
            this.startTime = performance.now();
        },
        
        end() {
            const endTime = performance.now();
            const duration = endTime - this.startTime;
            this.times.push(duration);
            
            if (this.times.length > 60) {
                this.times.shift();
            }
            
            return {
                current: duration,
                average: this.times.reduce((a, b) => a + b, 0) / this.times.length
            };
        }
    }
};

// 衝突判定ユーティリティ
const CollisionUtils = {
    // 点と円の衝突判定
    pointCircle: (px, py, circle) => {
        return MathUtils.distance(px, py, circle.x, circle.y) <= circle.radius;
    },

    // 円と円の衝突解決（位置の調整）
    resolveCircleCollision: (c1, c2) => {
        const dist = MathUtils.distance(c1.x, c1.y, c2.x, c2.y);
        if (dist >= c1.radius + c2.radius) return;

        const angle = Math.atan2(c2.y - c1.y, c2.x - c1.x);
        const minDist = c1.radius + c2.radius;
        const overlap = minDist - dist;

        // 重なりを解消する方向と距離を計算
        const moveX = Math.cos(angle) * overlap / 2;
        const moveY = Math.sin(angle) * overlap / 2;

        // 両方の円を均等に移動
        c1.x -= moveX;
        c1.y -= moveY;
        c2.x += moveX;
        c2.y += moveY;

        // 速度の交換（オプション）
        if (c1.speed && c2.speed) {
            const tempSpeed = c1.speed;
            c1.speed = c2.speed;
            c2.speed = tempSpeed;
        }
    }
};

// グローバルスコープにエクスポート
Object.assign(window, {
    MathUtils,
    AnimationUtils,
    ImageUtils,
    DebugUtils,
    CollisionUtils
});