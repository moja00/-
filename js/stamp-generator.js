/**
 * stamp-generator.js
 * Canvasを使用した本格的な電子角印（社印）の自動描画ジェネレーター
 */

/**
 * 社名・屋号から本格的な角印スタンプ画像を生成する
 * @param {string} companyName 会社名・屋号
 * @param {object} options オプション（サイズ、色、之印付与など）
 * @returns {string} Base64 DataURL (image/png)
 */
export function generateCompanyStamp(companyName = '', options = {}) {
  const size = options.size || 240;
  const color = options.color || '#dc2626'; // 朱色
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, size, size);

  let rawName = companyName.trim() || '社印';
  // 余計な「株式会社」「有限会社」「合同会社」等を取り除くか、整える
  // 例: 「株式会社クラフト」->「株式会社」「クラフト之印」のように配置
  // 角印らしく末尾に「之印」または「印」を補う
  let text = rawName;
  if (!text.endsWith('之印') && !text.endsWith('印')) {
    text = text + '之印';
  }

  // 枠線の描画（伝統的な角丸二重枠）
  const padding = size * 0.08;
  const outerSize = size - padding * 2;
  const radius = size * 0.08;

  ctx.save();
  // 外枠
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.038;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  drawRoundedRect(ctx, padding, padding, outerSize, outerSize, radius);
  ctx.stroke();

  // 内枠（二重線）
  const innerPad = padding + size * 0.024;
  const innerSize = outerSize - size * 0.048;
  ctx.lineWidth = size * 0.012;
  drawRoundedRect(ctx, innerPad, innerPad, innerSize, innerSize, radius * 0.7);
  ctx.stroke();

  // 縦書き文字の配置
  // 日本の角印は通常、右列から左列へと縦書きで配置されます（例: 2列または3列）
  const chars = Array.from(text);
  const totalChars = chars.length;

  // 列数を決定（文字数に応じて2列〜4列）
  let colCount = 2;
  if (totalChars > 12) {
    colCount = 4;
  } else if (totalChars > 6) {
    colCount = 3;
  }

  const charsPerCol = Math.ceil(totalChars / colCount);
  const columns = [];
  for (let i = 0; i < colCount; i++) {
    const colChars = chars.slice(i * charsPerCol, (i + 1) * charsPerCol);
    if (colChars.length > 0) {
      columns.push(colChars);
    }
  }

  // 伝統的に右から左へ読むため、配列を反転して右側から描画
  const renderColumns = [...columns].reverse();

  // フォント設定（行書体・明朝体・セリフ体など古典的な重厚感）
  const fontSize = Math.floor(innerSize / (charsPerCol * 1.18));
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${fontSize}px "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif`;

  const colWidth = innerSize / renderColumns.length;

  renderColumns.forEach((col, cIdx) => {
    const x = innerPad + cIdx * colWidth + colWidth / 2;
    const rowHeight = innerSize / col.length;

    col.forEach((char, rIdx) => {
      const y = innerPad + rIdx * rowHeight + rowHeight / 2;
      ctx.fillText(char, x, y);
    });
  });

  // わずかなリアルさ（手押し感）のノイズ・インク擦れを付加
  addInkTexture(ctx, size, color);

  ctx.restore();

  return canvas.toDataURL('image/png');
}

/**
 * 角丸四角形パスを描画
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * インク擦れ・アナログ感を表現する微小なノイズ
 */
function addInkTexture(ctx, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  // わずかにランダムな小さな斑点
  for (let i = 0; i < 35; i++) {
    const nx = size * 0.1 + Math.random() * (size * 0.8);
    const ny = size * 0.1 + Math.random() * (size * 0.8);
    const nr = Math.random() * 1.2;
    ctx.globalAlpha = 0.12 + Math.random() * 0.15;
    ctx.beginPath();
    ctx.arc(nx, ny, nr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
