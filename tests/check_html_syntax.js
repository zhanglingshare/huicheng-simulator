// 语法检查：自动扫描仓库根目录全部 .html，提取内联 <script> 块用 new Function 解析（不执行）
// 页面清单不再写死——新增页面自动纳入，避免质量门漏页
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const files = fs.readdirSync(root).filter(f => f.endsWith('.html')).sort();

let bad = 0;
for (const f of files) {
  const html = fs.readFileSync(path.join(root, f), 'utf8');
  const blocks = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  let ok = true;
  blocks.forEach((code, i) => {
    try { new Function(code); }
    catch (e) { ok = false; bad++; console.log(`✗ ${f} 第${i + 1}个script块 语法错误: ${e.message}`); }
  });
  console.log(`${ok ? '✓' : '✗'} ${f} 共${blocks.length}个内联script块：${ok ? '语法通过' : '存在语法错误'}`);
}
console.log(`\n共检查 ${files.length} 个页面，语法错误 ${bad} 处`);
process.exit(bad ? 1 : 0);
