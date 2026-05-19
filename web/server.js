const express = require('express');
const path = require('path');

const app = express();
const PORT = 8520;

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'preview.html'));
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║     施工日志系统 - Web 预览端                             ║
╠═══════════════════════════════════════════════════════════╣
║  预览地址: http://localhost:${PORT}/preview.html              ║
╠═══════════════════════════════════════════════════════════╣
║  说明: 此为模拟预览界面，真实数据需通过后端 API 获取      ║
║  后端地址: http://localhost:8519                          ║
╚═══════════════════════════════════════════════════════════╝
`);
});
