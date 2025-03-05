// fruit.js

// デバッグモード
const DEBUG = {
  enabled: true,
  drawCount: 0,
  maxLogs: 1,
  lastDrawTime: 0,
  minLogInterval: 1000,
  logDrawing: function(info) {
    if (!this.enabled) return;
    
    const now = Date.now();
    if (now - this.lastDrawTime < this.minLogInterval) return;
    
    if (this.drawCount < this.maxLogs) {
      this.drawCount++;
      this.lastDrawTime = now;
      console.log(`[${info.name}] Drawing:`, JSON.stringify({
        drawType: info.drawType,
        position: info.position
      }));
    }
  }
};

// フルーツの種類ごとに定義
const FRUITS = [
  {
    name: 'Cherry',
    rank: 1,
    scoreValue: 10,
    radius: 30,
    color: '#FF5252',
    innerColor: '#FF8A80',
    imagePath: './icon/HARUKI.jpg'
  },
  {
    name: 'Strawberry',
    rank: 2,
    scoreValue: 20,
    radius: 35,
    color: '#FF7043',
    innerColor: '#FFAB91',
    imagePath: './icon/あささん.jpg'
  },
  {
    name: 'Grape',
    rank: 3,
    scoreValue: 30,
    radius: 40,
    color: '#9575CD',
    innerColor: '#B39DDB',
    imagePath: './icon/エセ.jpg'
  },
  {
    name: 'Orange',
    rank: 4,
    scoreValue: 40,
    radius: 60, // 45から60に拡大
    color: '#FFA726',
    innerColor: '#FFCC80',
    imagePath: './icon/たぬ吉.jpg'
  },
  {
    name: 'Apple',
    rank: 5,
    scoreValue: 50,
    radius: 70, // 50から70に拡大
    color: '#66BB6A',
    innerColor: '#A5D6A7',
    imagePath: './icon/みゆき.jpg'
  },
  {
    name: 'Pineapple',
    rank: 6,
    scoreValue: 100,
    radius: 85, // 70から85に拡大
    color: '#26A69A',
    innerColor: '#80CBC4',
    imagePath: './icon/ユニコ.jpg'
  },
  {
    name: 'Watermelon',
    rank: 7,
    scoreValue: 200,
    radius: 100, // 85から100に拡大
    color: '#42A5F5',
    innerColor: '#90CAF9',
    imagePath: './icon/ヨーフ.jpg'
  }
];

// フルーツの生成
function createRandomFruit(canvasWidth) {
  const randomIndex = Math.floor(Math.random() * 3);
  const fruitData = FRUITS[randomIndex];
  const fruit = {
    name: fruitData.name,
    rank: fruitData.rank,
    scoreValue: fruitData.scoreValue,
    x: canvasWidth / 2,
    y: fruitData.radius + 10,
    radius: fruitData.radius,
    color: fruitData.color,
    innerColor: fruitData.innerColor,
    image: loadImage(fruitData.imagePath),
    speed: 0,
    isFalling: false,
    vx: 0,
    vy: 0,
    mass: fruitData.radius * fruitData.radius * 0.01,
    restitution: 0.3,
    friction: 0.05
  };

  return fruit;
}

// フルーツを配列に追加
function settleFruit(fruit, fruitsArray) {
  fruitsArray.push(fruit);
}

// フルーツの描画
function drawFruit(ctx, fruit) {
  if (!fruit) return;

  const drawInfo = {
    name: fruit.name,
    drawType: 'image',
    position: `(${Math.round(fruit.x)}, ${Math.round(fruit.y)})`
  };

  // 画像が読み込まれているか確認
  if (fruit.image && fruit.image.complete && fruit.image.naturalWidth !== 0) {
    // 画像を描画
    ctx.save();
    ctx.beginPath();
    ctx.arc(fruit.x, fruit.y, fruit.radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(
      fruit.image,
      fruit.x - fruit.radius,
      fruit.y - fruit.radius,
      fruit.radius * 2,
      fruit.radius * 2
    );
    ctx.restore();
    
    // 縁取り
    ctx.beginPath();
    ctx.arc(fruit.x, fruit.y, fruit.radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    // 画像が読み込まれていない場合は形状で代用
    drawInfo.drawType = 'shape';
    drawFruitShape(ctx, fruit);
  }

  DEBUG.logDrawing(drawInfo);
}

// フルーツの形状を描画
function drawFruitShape(ctx, fruit) {
  // メインの円を描画
  ctx.beginPath();
  ctx.arc(fruit.x, fruit.y, fruit.radius, 0, Math.PI * 2);
  ctx.fillStyle = fruit.color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 内部の模様を描画
  drawInnerPattern(ctx, fruit);
}

// フルーツの内部パターンを描画
function drawInnerPattern(ctx, fruit) {
  const { x, y, radius, innerColor } = fruit;
  ctx.save();
  ctx.globalAlpha = 0.5;
  
  switch (fruit.rank) {
    case 1: // Cherry - 1つの小さな円
      drawInnerCircle(ctx, x, y, radius * 0.3, innerColor);
      break;
    
    case 2: // Strawberry - 複数の小さな点
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        const distance = radius * 0.5;
        const cx = x + Math.cos(angle) * distance;
        const cy = y + Math.sin(angle) * distance;
        drawInnerCircle(ctx, cx, cy, radius * 0.1, innerColor);
      }
      break;
    
    case 3: // Grape - 複数の円が集まったパターン
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i;
        const distance = radius * 0.4;
        const cx = x + Math.cos(angle) * distance;
        const cy = y + Math.sin(angle) * distance;
        drawInnerCircle(ctx, cx, cy, radius * 0.25, innerColor);
      }
      drawInnerCircle(ctx, x, y, radius * 0.25, innerColor);
      break;
    
    case 4: // Orange - 放射状のパターン
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
          x + Math.cos(angle) * radius * 0.8,
          y + Math.sin(angle) * radius * 0.8
        );
        ctx.strokeStyle = innerColor;
        ctx.lineWidth = radius * 0.1;
        ctx.stroke();
      }
      drawInnerCircle(ctx, x, y, radius * 0.3, innerColor);
      break;
    
    case 5: // Apple - 葉っぱのような形
      drawInnerCircle(ctx, x, y, radius * 0.4, innerColor);
      // 葉っぱ
      ctx.beginPath();
      ctx.ellipse(
        x, y - radius * 0.7,
        radius * 0.15, radius * 0.3,
        0, 0, Math.PI * 2
      );
      ctx.fillStyle = '#4CAF50';
      ctx.fill();
      break;
    
    case 6: // Pineapple - 格子状のパターン
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i + Math.PI / 6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
          x + Math.cos(angle) * radius * 0.9,
          y + Math.sin(angle) * radius * 0.9
        );
        ctx.strokeStyle = innerColor;
        ctx.lineWidth = radius * 0.1;
        ctx.stroke();
      }
      
      for (let i = 0; i < 3; i++) {
        const distance = radius * (0.3 + i * 0.25);
        ctx.beginPath();
        ctx.arc(x, y, distance, 0, Math.PI * 2);
        ctx.strokeStyle = innerColor;
        ctx.lineWidth = radius * 0.05;
        ctx.stroke();
      }
      break;
    
    case 7: // Watermelon - スイカの模様
      // 縞模様
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x - radius, y + i * radius * 0.2);
        ctx.lineTo(x + radius, y + i * radius * 0.2);
        ctx.strokeStyle = innerColor;
        ctx.lineWidth = radius * 0.1;
        ctx.stroke();
      }
      
      // 種
      ctx.fillStyle = '#000';
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        const distance = radius * 0.5;
        const cx = x + Math.cos(angle) * distance;
        const cy = y + Math.sin(angle) * distance;
        ctx.beginPath();
        ctx.ellipse(
          cx, cy,
          radius * 0.06, radius * 0.12,
          angle, 0, Math.PI * 2
        );
        ctx.fill();
      }
      break;
  }
  
  ctx.restore();
}

// 内部の円を描画するヘルパー関数
function drawInnerCircle(ctx, x, y, radius, color) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

// 画像の読み込み
function loadImage(src) {
  const img = new Image();
  img.src = src;
  img.onerror = (e) => {
    console.error(`[${src}] 画像読み込み失敗:`, e);
  };
  return img;
}

// フレーム開始時にデバッグカウンターをリセット
function resetDebugCounters() {
  DEBUG.drawCount = 0;
}

// グローバルスコープに公開
window.resetDebugCounters = resetDebugCounters;