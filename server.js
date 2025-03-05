const express = require('express');
const path = require('path');
const app = express();

// 静的ファイルを提供するディレクトリを設定
app.use(express.static('src'));

// ルートパスへのアクセスをindex.htmlにリダイレクト
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// ポート設定（Herokuは環境変数PORTを使用）
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});