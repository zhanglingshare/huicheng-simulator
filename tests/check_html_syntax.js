// 语法检查：提取 HTML 内所有内联 <script> 块，用 new Function 做解析（不执行）
const fs = require('fs');
for (const f of ['windtunnel.html', 'future.html', 'fun.html', 'index.html']) {
  const html = fs.readFileSync(f, 'utf8');
  const blocks = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  let ok = true;
  blocks.forEach((code, i) => {
    try { new Function(code); }
    catch (e) { ok = false; console.log(`✗ ${f} 第${i + 1}个script块 语法错误: ${e.message}`); }
  });
  console.log(`${ok ? '✓' : '✗'} ${f} 共${blocks.length}个内联script块：${ok ? '语法通过' : '存在语法错误'}`);
}
