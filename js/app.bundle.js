/**
 * app.bundle.js
 * BillCraft ERP - 納品・請求 ＋ 財務会計・入金消込・経費OCR・勤怠管理（タイムカード）
 * 外部依存なし・単体動作保証（file:// 直開き & http:// サーバー両対応）
 */

(function () {
  'use strict';

  // ==========================================================================
  // 定数・サンプルデータ
  // ==========================================================================
/**
 * sample-data.js
 * 動作確認用および初期状態用のリアルな日本語ビジネスサンプルデータ
 */
const SAMPLE_DOCUMENTS = {
  invoice: {
    id: 'sample_inv_001',
    docType: 'invoice',
    docNumber: 'INV-202609-082',
    issueDate: '2026-09-15',
    dueDate: '2026-10-31',
    title: 'コーポレートサイトリニューアル及び運用保守（8月分）',
    client: {
      name: 'アークス・テクノロジー株式会社',
      honorific: '御中',
      zip: '107-0062',
      address: '東京都港区南青山3-5-1 青山タワープレイス 12F',
      contactPerson: 'デジタル推進部 田中 健一 様'
    },
    issuer: {
      name: 'スタジオ・ネクサス合同会社',
      invoiceNumber: 'T9012345678901',
      zip: '150-0043',
      address: '東京都渋谷区道玄坂1丁目20-8 渋谷インフォスタワー 7F',
      tel: '03-6800-9988',
      fax: '',
      email: 'billing@nexus-studio.example.com',
      bankInfo: '三菱UFJ銀行 渋谷支店 (店番: 135)\n普通預金 0987654\n口座名義: ド）スタジオネクサス',
      stampDataUrl: '',
      showStamp: true
    },
    items: [
      {
        id: 'sample_item_1',
        name: 'Webサイトリニューアル UI/UX設計・Figmaデザイン作成',
        quantity: 1,
        unit: '式',
        unitPrice: 350000,
        taxRate: 10,
        note: '第1期フェーズ'
      },
      {
        id: 'sample_item_2',
        name: 'フロントエンド実装・レスポンシブWebコーディング',
        quantity: 1,
        unit: '式',
        unitPrice: 280000,
        taxRate: 10,
        note: 'HTML5/Tailwind/JS'
      },
      {
        id: 'sample_item_3',
        name: 'CMS（WordPress/Headless）導入・管理画面カスタマイズ',
        quantity: 1,
        unit: '式',
        unitPrice: 180000,
        taxRate: 10,
        note: 'カスタム投稿3種'
      },
      {
        id: 'sample_item_4',
        name: '月額クラウドサーバー運用保守（2026年9月度）',
        quantity: 1,
        unit: '月',
        unitPrice: 40000,
        taxRate: 10,
        note: '24時間監視含む'
      },
      {
        id: 'sample_item_5',
        name: 'プロジェクト管理用資材・リファレンス書籍（軽減税率対象）',
        quantity: 2,
        unit: '冊',
        unitPrice: 4200,
        taxRate: 8,
        note: '公式ガイド本'
      }
    ],
    taxFractionRule: 'floor',
    notes: '・お振込手数料は貴社にてご負担いただけますようお願い申し上げます。\n・ご請求内容に関するご質問やお支払期日のご相談は、担当（support@nexus-studio.example.com）までご連絡ください。',
    themeColor: 'indigo'
  },
  delivery: {
    id: 'sample_del_001',
    docType: 'delivery',
    docNumber: 'DEL-202609-015',
    issueDate: '2026-09-15',
    dueDate: '2026-09-22',
    title: 'オフィス備品およびPC周辺機器の納品',
    client: {
      name: 'グローバル・イノベーション株式会社',
      honorific: '御中',
      zip: '100-0005',
      address: '東京都千代田区丸の内1-2-1 丸の内ビルディング 18F',
      contactPerson: '総務部 佐藤 翔太 様'
    },
    issuer: {
      name: 'スタジオ・ネクサス合同会社',
      invoiceNumber: 'T9012345678901',
      zip: '150-0043',
      address: '東京都渋谷区道玄坂1丁目20-8 渋谷インフォスタワー 7F',
      tel: '03-6800-9988',
      fax: '',
      email: 'billing@nexus-studio.example.com',
      bankInfo: '',
      stampDataUrl: '',
      showStamp: true
    },
    items: [
      {
        id: 'del_item_1',
        name: '27インチ 4Kモニター（USB-C給電対応）',
        quantity: 5,
        unit: '台',
        unitPrice: 48000,
        taxRate: 10,
        note: '型番: MON-4K-27'
      },
      {
        id: 'del_item_2',
        name: 'エルゴノミック メッシュチェア（ハイバック）',
        quantity: 5,
        unit: '脚',
        unitPrice: 62000,
        taxRate: 10,
        note: 'ブラック / 肘掛付'
      },
      {
        id: 'del_item_3',
        name: '来客用ドリップコーヒー＆緑茶セット（軽減税率対象）',
        quantity: 4,
        unit: '箱',
        unitPrice: 3800,
        taxRate: 8,
        note: '賞味期限: 12ヶ月'
      }
    ],
    taxFractionRule: 'floor',
    notes: '・納品物をご確認の上、受領印をいただけますようお願い申し上げます。\n・初期不良等の交換対応は納品日より14日以内にご連絡ください。',
    themeColor: 'emerald'
  }
};

  // ==========================================================================
  // 電子印鑑（角印）ジェネレーター
  // ==========================================================================
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
function generateCompanyStamp(companyName = '', options = {}) {
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

  // ==========================================================================
  // 請求計算・状態管理ロジック
  // ==========================================================================
/**
 * invoice-state.js
 * 帳票データ構造、インボイス制度準拠の税金計算、フォーマットユーティリティ
 */
const DOC_TYPES = {
  invoice: {
    key: 'invoice',
    label: '請求書',
    badge: '御請求書',
    prefix: 'INV-',
    dateLabel: '請求日',
    dueLabel: 'お支払期日',
    amountLabel: '御請求金額'
  },
  delivery: {
    key: 'delivery',
    label: '納品書',
    badge: '納品書',
    prefix: 'DEL-',
    dateLabel: '納品日',
    dueLabel: '受領期日',
    amountLabel: '合計金額'
  },
  estimate: {
    key: 'estimate',
    label: '見積書',
    badge: '御見積書',
    prefix: 'EST-',
    dateLabel: '見積日',
    dueLabel: '有効期限',
    amountLabel: '御見積金額'
  },
  receipt: {
    key: 'receipt',
    label: '領収書',
    badge: '領収証',
    prefix: 'REC-',
    dateLabel: '領収日',
    dueLabel: '但し書き',
    amountLabel: '領収金額'
  }
};
const THEME_COLORS = {
  indigo: {
    name: 'モダンインディゴ',
    primary: '#3b5bdb',
    primaryLight: '#eef2ff',
    primaryDark: '#2b44af',
    accent: '#4c6ef5'
  },
  navy: {
    name: 'クラシックネイビー',
    primary: '#1e293b',
    primaryLight: '#f1f5f9',
    primaryDark: '#0f172a',
    accent: '#334155'
  },
  emerald: {
    name: 'フォレストエメラルド',
    primary: '#0f766e',
    primaryLight: '#f0fdfa',
    primaryDark: '#115e59',
    accent: '#14b8a6'
  },
  crimson: {
    name: 'ディープワイン',
    primary: '#881337',
    primaryLight: '#fff1f2',
    primaryDark: '#4c0519',
    accent: '#e11d48'
  },
  slate: {
    name: 'スレートチャコール',
    primary: '#374151',
    primaryLight: '#f3f4f6',
    primaryDark: '#1f2937',
    accent: '#4b5563'
  }
};

/**
 * 書類番号を自動生成（例: INV-20260915-001）
 */
function generateDocNumber(docType = 'invoice') {
  const prefix = DOC_TYPES[docType]?.prefix || 'DOC-';
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(100 + Math.random() * 900));
  return `${prefix}${y}${m}${d}-${rand}`;
}

/**
 * 日付のデフォルト値（本日、30日後）
 */
function getDefaultDates() {
  const now = new Date();
  const issue = now.toISOString().split('T')[0];

  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const due = nextMonth.toISOString().split('T')[0];

  return { issue, due };
}

/**
 * 初期帳票データモデル作成
 */
function createEmptyInvoice(docType = 'invoice') {
  const dates = getDefaultDates();
  return {
    id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    docType: docType,
    docNumber: generateDocNumber(docType),
    issueDate: dates.issue,
    dueDate: dates.due,
    title: '', // 件名は空白
    client: {
      name: '', // 取引先名は空白
      honorific: '御中',
      zip: '',
      address: '',
      contactPerson: ''
    },
    issuer: {
      name: '株式会社アルバワークス',
      invoiceNumber: 'T2070001004966',
      zip: '379-2144',
      address: '群馬県前橋市下川町63-7',
      tel: '027-289-0367',
      fax: '027-289-0368',
      email: '',
      bankInfo: '高崎信用金庫\n前橋南支店\n普通　012 2182393\nカ)　アルバワークス',
      stampDataUrl: '',
      showStamp: true
    },
    items: [], // 明細は空白
    taxFractionRule: 'floor', // 'floor' | 'round' | 'ceil'
    notes: 'お振込手数料は貴社にてご負担くださいますようお願い申し上げます。\nご不明な点がございましたらお気軽にお問い合わせください。',
    themeColor: 'indigo',
    isIssued: false,
    isCancelled: false,
    issuedAt: null,
    updatedAt: new Date().toISOString()
  };
}

/**
 * インボイス制度対応の税金・小計計算
 * 日本の適格請求書等保存方式のルール:
 * 「税率ごとに合算した税抜合計額に対して、消費税率を乗じて端数処理を行う」
 */
function calculateTotals(items = [], fractionRule = 'floor') {
  let subtotal10 = 0;
  let subtotal8 = 0;
  let subtotal0 = 0;

  items.forEach(item => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const lineTotal = Math.round(qty * price);
    const rate = Number(item.taxRate);

    if (rate === 10) {
      subtotal10 += lineTotal;
    } else if (rate === 8) {
      subtotal8 += lineTotal;
    } else {
      subtotal0 += lineTotal;
    }
  });

  const roundFn = (val) => {
    if (fractionRule === 'ceil') return Math.ceil(val);
    if (fractionRule === 'round') return Math.round(val);
    return Math.floor(val); // default floor
  };

  const tax10 = roundFn(subtotal10 * 0.10);
  const tax8 = roundFn(subtotal8 * 0.08);
  const taxTotal = tax10 + tax8;

  const subtotalWithoutTax = subtotal10 + subtotal8 + subtotal0;
  const grandTotal = subtotalWithoutTax + taxTotal;

  return {
    subtotal10,
    tax10,
    subtotal8,
    tax8,
    subtotal0,
    subtotalWithoutTax,
    taxTotal,
    grandTotal
  };
}

/**
 * 販売店仕切り価格の自動計算
 * 条件1: 販売店利益 ＝ 税込み仕切り価格 × 20%
 * 条件2: 税抜きユーザー価格 ＝ 税抜き仕切り価格 ＋ 販売店利益
 * 
 * 連立方程式:
 *   税抜きユーザー価格 ＝ (税込み仕切り価格 ÷ (1 + 税率)) ＋ (税込み仕切り価格 × 0.20)
 *   税抜きユーザー価格 ＝ 税込み仕切り価格 × ( (1 ÷ (1 + 税率)) ＋ 0.20 )
 *   したがって:
 *   税込み仕切り価格 ＝ 税抜きユーザー価格 ÷ ( (1 ÷ (1 + 税率)) ＋ 0.20 )
 *   ＝ ユーザー税込価格 ÷ ( 1 ＋ 0.20 × (1 + 税率) )
 * 
 * @param {number} userPriceInc ユーザー税込価格
 * @param {number} taxRate 消費税率 (10 | 8 | 0)
 * @param {object} discount 割引き設定 { type: 'none'|'percent'|'amount', value: number, reason: string }
 * @returns {object} 計算結果詳細
 */
function calculateWholesalePrice(userPriceInc = 0, taxRate = 10, discount = { type: 'none', value: 0, reason: '' }) {
  const baseInc = Math.max(0, Number(userPriceInc) || 0);
  const rateMultiplier = 1 + (Number(taxRate) || 0) / 100;

  // 1. ユーザー価格に対する割引き計算
  let discountAmountInc = 0;
  if (discount.type === 'percent' && discount.value > 0) {
    discountAmountInc = Math.round(baseInc * (Math.min(100, Math.max(0, Number(discount.value))) / 100));
  } else if (discount.type === 'amount' && discount.value > 0) {
    discountAmountInc = Math.min(baseInc, Math.round(Number(discount.value)));
  }

  // 割引き後のユーザー税込価格
  const finalUserPriceInc = Math.max(0, baseInc - discountAmountInc);

  // 2. 税抜きユーザー価格
  const finalUserPriceEx = Math.round(finalUserPriceInc / rateMultiplier);

  // 3. 税込み仕切り価格の逆算
  // 式: 税抜きユーザー価格 = 税抜き仕切り + 利益 = W_inc / rateMultiplier + 0.20 * W_inc
  const denominator = (1 / rateMultiplier) + 0.20;
  const wholesalePriceInc = finalUserPriceEx > 0 ? Math.round(finalUserPriceEx / denominator) : 0;

  // 4. 販売店利益（税込み仕切り価格の20%）
  const retailerProfit = Math.round(wholesalePriceInc * 0.20);

  // 5. 帳票の税抜き仕切り単価（税抜きユーザー価格 − 販売店利益）
  // これにより「税抜き仕切り ＋ 販売店利益 ＝ 税抜きユーザー」が端数も含めて1円の狂いなく成立
  const wholesaleUnitPriceEx = Math.max(0, finalUserPriceEx - retailerProfit);

  // 参考: 割引き前の仕切り単価
  const baseUserPriceEx = Math.round(baseInc / rateMultiplier);
  const baseWholesalePriceInc = baseUserPriceEx > 0 ? Math.round(baseUserPriceEx / denominator) : 0;
  const baseRetailerProfit = Math.round(baseWholesalePriceInc * 0.20);
  const baseWholesaleUnitPriceEx = Math.max(0, baseUserPriceEx - baseRetailerProfit);
  const discountWholesaleAmountEx = Math.max(0, baseWholesaleUnitPriceEx - wholesaleUnitPriceEx);

  return {
    baseUserPriceInc: baseInc,
    discountAmountInc,
    finalUserPriceInc,
    finalUserPriceEx,
    wholesalePriceInc,
    wholesaleUnitPriceEx,
    wholesaleUnitPrice: wholesaleUnitPriceEx,
    retailerProfit,
    profit: retailerProfit,
    baseWholesaleUnitPriceEx,
    discountWholesaleAmountEx,
    discountReason: discount.reason || ''
  };
}

/**
 * 通貨フォーマット (¥1,234,567 / -¥5,000)
 */
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  if (num < 0) {
    return '-¥' + Math.abs(num).toLocaleString('ja-JP');
  }
  return '¥' + num.toLocaleString('ja-JP');
}

/**
 * 日本語日付フォーマット (2026年9月15日)
 */
function formatJapaneseDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`;
  }
  return dateStr;
}

  // ==========================================================================
  // 財務会計・損益計算・自動仕訳ロジック
  // ==========================================================================
/**
 * accounting-state.js
 * 財務会計・損益計算・自動仕訳・税理士用CSV出力エンジン
 */

// 標準的な日本の青色申告・法人勘定科目リスト
const ACCOUNT_CATEGORIES = [
  { code: '501', name: '仕入高', group: 'cost', taxType: 'taxable', description: '商品・原材料の仕入れ' },
  { code: '502', name: '外注加工費', group: 'cost', taxType: 'taxable', description: '外部委託・加工・業務委託費' },
  { code: '601', name: '旅費交通費', group: 'expense', taxType: 'taxable', description: '電車、タクシー、ガソリン、宿泊費' },
  { code: '602', name: '通信費', group: 'expense', taxType: 'taxable', description: '携帯電話、インターネット、切手・郵送' },
  { code: '603', name: '消耗品費', group: 'expense', taxType: 'taxable', description: '文具、事務用品、10万円未満の備品' },
  { code: '604', name: '接待交際費', group: 'expense', taxType: 'taxable', description: '取引先との飲食、慶弔見舞金、贈答品' },
  { code: '605', name: '地代家賃', group: 'expense', taxType: 'exempt', description: '事務所・店舗・駐車場代' },
  { code: '606', name: '水道光熱費', group: 'expense', taxType: 'taxable', description: '電気、ガス、水道料金' },
  { code: '607', name: '支払手数料', group: 'expense', taxType: 'taxable', description: '振込手数料、各種決済・仲介手数料' },
  { code: '608', name: '車両費', group: 'expense', taxType: 'taxable', description: '社用車の車検、保険、整備、高速代' },
  { code: '609', name: '広告宣伝費', group: 'expense', taxType: 'taxable', description: 'WEB広告、チラシ、看板、名刺作成' },
  { code: '610', name: '新聞図書費', group: 'expense', taxType: 'taxable', description: '書籍、新聞、専門誌、情報サービス' },
  { code: '611', name: '福利厚生費', group: 'expense', taxType: 'taxable', description: '従業員の健康診断、慶弔費、飲料・軽食' },
  { code: '612', name: '租税公課', group: 'expense', taxType: 'exempt', description: '印紙税、固定資産税、自動車税、登録免許税' },
  { code: '613', name: '保険料', group: 'expense', taxType: 'exempt', description: '損害保険、火災保険、賠償責任保険' },
  { code: '614', name: '修繕費', group: 'expense', taxType: 'taxable', description: '建物・設備・PC等の修理・メンテナンス' },
  { code: '699', name: '雑費', group: 'expense', taxType: 'taxable', description: '他の科目に当てはまらない少額出費' }
];

/**
 * 伝票データ（summaryItemまたはfullDoc）から正確な明細と情報を正規化抽出
 * @param {object} raw 伝票データ
 * @returns {object} 正規化された伝票情報
 */
function normalizeInvoiceDoc(raw) {
  if (!raw) return null;
  const doc = raw.fullDoc || raw;
  const items = Array.isArray(doc.items) ? doc.items : (Array.isArray(raw.items) ? raw.items : []);
  const docType = doc.docType || raw.docType || 'invoice';
  const issueDate = doc.issueDate || raw.issueDate || '';
  const dueDate = doc.dueDate || raw.dueDate || '';
  const docNumber = doc.docNumber || raw.docNumber || '';
  const clientName = (doc.client && doc.client.name) ? doc.client.name : (raw.clientName || '名称未設定');
  const isPaid = !!(doc.isPaid || raw.isPaid || doc.paymentStatus === 'paid' || raw.paymentStatus === 'paid');
  const paidDate = doc.paidDate || raw.paidDate || '';
  const taxFractionRule = doc.taxFractionRule || raw.taxFractionRule || 'floor';
  const id = doc.id || raw.id || `doc_${Date.now()}`;
  const isCancelled = !!(doc.isCancelled || raw.isCancelled);
  // 明示的に false または取消済の場合は false。未指定の古い履歴データは互換性維持
  const isIssued = isCancelled ? false : (doc.isIssued !== undefined ? !!doc.isIssued : (raw.isIssued !== undefined ? !!raw.isIssued : true));

  // 金額・税金の計算
  let subtotal = 0;
  let tax10 = 0;
  let tax8 = 0;
  let costTotal = 0;

  items.forEach(it => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.unitPrice) || 0;
    const lineTotal = qty * price;
    const taxRate = Number(it.taxRate !== undefined ? it.taxRate : 10);

    subtotal += lineTotal;
    if (taxRate === 10) {
      tax10 += Math.floor(lineTotal * 0.10);
    } else if (taxRate === 8) {
      tax8 += Math.floor(lineTotal * 0.08);
    }

    if (it.costPrice) {
      costTotal += qty * Number(it.costPrice);
    }
  });

  const taxTotal = tax10 + tax8;
  const grandTotal = subtotal + taxTotal;

  return {
    id,
    docType,
    issueDate,
    dueDate,
    docNumber,
    clientName,
    items,
    isPaid,
    paymentStatus: isPaid ? 'paid' : 'unpaid',
    paidDate,
    taxFractionRule,
    isIssued,
    isCancelled,
    subtotal,
    tax10,
    tax8,
    taxTotal,
    grandTotal,
    costTotal,
    rawDoc: doc
  };
}

/**
 * 期間内の損益計算書（P/L）および経営KPIを集計
 * @param {Array} invoices 請求書リスト (fullDocまたはsummaryItem)
 * @param {Array} expenses 経費リスト
 * @param {string} targetMonth 'YYYY-MM' または 'all'
 * @returns {object} P/L詳細・粗利益・純利益・未回収残高
 */
function calculateProfitAndLoss(invoices = [], expenses = [], targetMonth = 'all') {
  // 引数が文字列1つの場合（targetMonthのみ渡された場合）のフォールバック
  if (typeof invoices === 'string') {
    targetMonth = invoices || 'all';
    invoices = [];
    expenses = [];
  }
  if (!Array.isArray(invoices)) invoices = [];
  if (!Array.isArray(expenses)) expenses = [];
  if (!targetMonth) targetMonth = 'all';

  let totalSales = 0; // 総売上高（税抜）
  let totalSalesTax = 0; // 売上消費税
  let totalSalesInc = 0; // 総売上高（税込）
  let totalWholesaleCost = 0; // 請求書ベースの原価（仕切り原価）
  let unpaidSalesInc = 0; // 未回収売掛金（税込）
  let paidSalesInc = 0; // 回収済み売上（税込）

  // 1. 伝票（請求書・納品書・領収書）からの売上集計
  invoices.forEach(rawInv => {
    const inv = normalizeInvoiceDoc(rawInv);
    if (!inv) return;

    // 見積書（estimate）は確定売上ではないため除外
    if (inv.docType === 'estimate') return;

    // 確定発行されていない伝票・確定取消された伝票は除外
    if (!inv.isIssued || inv.isCancelled) return;

    const issueDate = inv.issueDate || '';
    if (targetMonth !== 'all' && !issueDate.startsWith(targetMonth)) {
      return;
    }

    totalSales += inv.subtotal;
    totalSalesTax += inv.taxTotal;
    totalSalesInc += inv.grandTotal;
    totalWholesaleCost += inv.costTotal;

    // 入金ステータス（未入金／入金済）
    if (inv.isPaid) {
      paidSalesInc += inv.grandTotal;
    } else {
      unpaidSalesInc += inv.grandTotal;
    }
  });

  // 2. 経費・仕入の集計
  let totalPurchaseCost = 0; // 仕入高（原価）
  let totalOperatingExpenses = 0; // 販管費（経費計）
  let totalExpenseTax = 0; // 経費消費税
  const expenseByCategory = {};

  expenses.forEach(exp => {
    if (!exp) return;
    const date = exp.date || '';
    if (targetMonth !== 'all' && !date.startsWith(targetMonth)) {
      return;
    }

    const amount = Number(exp.amount) || 0;
    const taxRate = Number(exp.taxRate !== undefined ? exp.taxRate : 10);
    const taxAmount = Math.round(amount * (taxRate / 100));
    const isCost = exp.category === '仕入高' || exp.category === '外注加工費' || exp.isCost;

    if (isCost) {
      totalPurchaseCost += amount;
    } else {
      totalOperatingExpenses += amount;
    }

    totalExpenseTax += taxAmount;

    // 科目別集計
    const cat = exp.category || '雑費';
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + amount;
  });

  // 3. 利益計算
  const totalCostOfGoodsSold = totalPurchaseCost + totalWholesaleCost; // 売上原価計
  const grossProfit = totalSales - totalCostOfGoodsSold; // 売上総利益（粗利）
  const grossProfitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0; // 粗利率
  const operatingProfit = grossProfit - totalOperatingExpenses; // 営業利益（純利益）
  const operatingProfitMargin = totalSales > 0 ? (operatingProfit / totalSales) * 100 : 0; // 営業利益率

  return {
    targetMonth,
    totalSales,
    totalSalesTax,
    totalSalesInc,
    unpaidSalesInc,
    paidSalesInc,
    collectionRate: totalSalesInc > 0 ? (paidSalesInc / totalSalesInc) * 100 : 100,
    totalCostOfGoodsSold,
    totalPurchaseCost,
    grossProfit,
    grossProfitMargin,
    totalOperatingExpenses,
    totalExpenseTax,
    operatingProfit,
    operatingProfitMargin,
    expenseByCategory
  };
}

/**
 * 請求書や経費から複式簿記の仕訳リストを自動生成
 * @param {Array} invoices 請求書リスト
 * @param {Array} expenses 経費リスト
 * @returns {Array<object>} 仕訳帳データ
 */
function generateJournalEntries(invoices = [], expenses = []) {
  if (typeof invoices === 'string') {
    invoices = [];
    expenses = [];
  }
  if (!Array.isArray(invoices)) invoices = [];
  if (!Array.isArray(expenses)) expenses = [];

  const journals = [];

  // 1. 伝票発行（売上計上）
  invoices.forEach(rawInv => {
    const inv = normalizeInvoiceDoc(rawInv);
    if (!inv || inv.docType === 'estimate') return; // 見積書は除外
    if (!inv.isIssued || inv.isCancelled) return; // 確定発行されていない伝票・確定取消された伝票は仕訳から除外

    const date = inv.issueDate || new Date().toISOString().split('T')[0];
    const client = inv.clientName || '取引先';
    const docNo = inv.docNumber || '';
    const totalInc = inv.grandTotal;
    if (totalInc <= 0) return;

    // 領収書の場合は即時現金回収: （借）現金 / （貸）売上高
    if (inv.docType === 'receipt') {
      journals.push({
        id: `jnl_rcpt_${inv.id}`,
        date,
        debitAccount: '現金',
        debitAmount: totalInc,
        creditAccount: '売上高',
        creditAmount: totalInc,
        description: `領収書売上（現金回収）: ${client} (${docNo})`,
        docId: inv.id,
        type: 'receipt'
      });
      return;
    }

    // 請求書・納品書の売上計上仕訳: （借）売掛金 / （貸）売上高
    journals.push({
      id: `jnl_inv_${inv.id}`,
      date,
      debitAccount: '売掛金',
      debitAmount: totalInc,
      creditAccount: '売上高',
      creditAmount: totalInc,
      description: `売上計上: ${client} (${docNo})`,
      docId: inv.id,
      type: 'sales'
    });

    // 入金済みの場合の仕訳: （借）普通預金 / （貸）売掛金
    if (inv.isPaid) {
      journals.push({
        id: `jnl_pay_${inv.id}`,
        date: inv.paidDate || inv.dueDate || date,
        debitAccount: '普通預金',
        debitAmount: totalInc,
        creditAccount: '売掛金',
        creditAmount: totalInc,
        description: `売掛金回収（消込済）: ${client} (${docNo})`,
        docId: inv.id,
        type: 'receipt'
      });
    }
  });

  // 2. 経費・仕入の仕訳
  expenses.forEach(exp => {
    if (!exp) return;
    const date = exp.date || new Date().toISOString().split('T')[0];
    const amount = Number(exp.amount) || 0;
    const taxRate = Number(exp.taxRate !== undefined ? exp.taxRate : 10);
    const amountInc = Math.round(amount * (1 + taxRate / 100));
    const payee = exp.payee ? ` (${exp.payee})` : '';

    journals.push({
      id: `jnl_exp_${exp.id}`,
      date,
      debitAccount: exp.category || '雑費',
      debitAmount: amountInc,
      creditAccount: exp.paymentMethod || '普通預金',
      creditAmount: amountInc,
      description: `${exp.category}: ${exp.note || ''}${payee}`.trim(),
      expenseId: exp.id,
      type: 'expense'
    });
  });

  // 日付順（昇順）にソート
  journals.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  return journals;
}

/**
 * 税理士・主要会計ソフト（弥生会計、freee、マネーフォワード）対応の汎用仕訳CSVを出力
 * @param {Array} journals 仕訳リスト
 * @returns {string} CSV文字列 (Shift_JIS互換ヘッダー付き)
 */
function exportJournalsToCSV(journals = []) {
  const headers = [
    '取引No',
    '取引日',
    '借方勘定科目',
    '借方金額(税込)',
    '貸方勘定科目',
    '貸方金額(税込)',
    '摘要',
    '税区分',
    '種別'
  ];

  const rows = journals.map((j, idx) => [
    idx + 1,
    j.date,
    `"${j.debitAccount}"`,
    j.debitAmount,
    `"${j.creditAccount}"`,
    j.creditAmount,
    `"${(j.description || '').replace(/"/g, '""')}"`,
    '課税仕入・売上10%',
    j.type
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  return csvContent;
}

  // ==========================================================================
  // 勤怠管理・タイムカード（休憩1時間自動控除）ロジック
  // ==========================================================================
/**
 * attendance-state.js
 * 勤怠管理・タイムカード（休憩1時間自動控除）・月次集計・CSV出力エンジン
 */

/**
 * 本日の日付文字列 (YYYY-MM-DD)
 */
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 現在の時刻文字列 (HH:MM)
 */
function getCurrentTimeString() {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 2つの時刻（HH:MM）の差分分数（minutes）を計算
 */
function calculateMinutesDiff(startHHMM, endHHMM) {
  if (!startHHMM || !endHHMM) return 0;
  const [sH, sM] = startHHMM.split(':').map(Number);
  const [eH, eM] = endHHMM.split(':').map(Number);
  const startMin = sH * 60 + sM;
  const endMin = eH * 60 + eM;
  return Math.max(0, endMin - startMin);
}

/**
 * 分数を「〇時間〇分」形式でフォーマット
 */
function formatMinutesToHours(minutes = 0) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h === 0) return `${min}分`;
  if (min === 0) return `${h}時間`;
  return `${h}時間${min}分`;
}

/**
 * 勤務時間の計算（休憩1時間［60分］を自動控除）
 * @param {string} clockIn '09:00'
 * @param {string} clockOut '18:00'
 * @returns {object} { totalMinutes, breakMinutes: 60, workMinutes, overtimeMinutes }
 */
function calculateWorkDuration(clockIn, clockOut) {
  if (!clockIn || !clockOut) {
    return {
      totalMinutes: 0,
      breakMinutes: 0,
      workMinutes: 0,
      overtimeMinutes: 0
    };
  }

  const totalMinutes = calculateMinutesDiff(clockIn, clockOut);
  // 休憩入力なしで1時間（60分）自動控除（※総滞在時間が60分以下の場合は実時間）
  const breakMinutes = totalMinutes > 60 ? 60 : 0;
  const workMinutes = Math.max(0, totalMinutes - breakMinutes);

  // 所定8時間（480分）を超える分を残業時間として算出
  const overtimeMinutes = Math.max(0, workMinutes - 480);

  return {
    totalMinutes,
    breakMinutes,
    workMinutes,
    overtimeMinutes
  };
}

/**
 * 月別の勤怠集計（出勤日数、総勤務時間、総残業時間）
 * @param {Array} attendanceList 全打刻リスト
 * @param {string} targetMonth 'YYYY-MM'
 * @returns {object}
 */
function calculateMonthlyAttendance(attendanceList = [], targetMonth = '') {
  // 第1引数が文字列（年月）の場合のフォールバック
  let list = attendanceList;
  let ym = targetMonth;
  if (typeof attendanceList === 'string') {
    ym = attendanceList;
    list = typeof getAttendanceList === 'function' ? getAttendanceList() : [];
  }
  if (!Array.isArray(list)) {
    list = [];
  }
  const currentYM = ym || getTodayDateString().substring(0, 7);
  const filtered = list.filter(att => att && (att.date || '').startsWith(currentYM));

  let workDays = 0;
  let totalWorkMinutes = 0;
  let totalOvertimeMinutes = 0;

  filtered.forEach(att => {
    if (att.clockIn && att.clockOut) {
      workDays += 1;
      const res = calculateWorkDuration(att.clockIn, att.clockOut);
      totalWorkMinutes += res.workMinutes;
      totalOvertimeMinutes += res.overtimeMinutes;
    } else if (att.clockIn || att.clockOut) {
      workDays += 1; // 出勤中または退勤のみ
    }
  });

  return {
    targetMonth: currentYM,
    records: filtered.sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    workDays,
    totalWorkMinutes,
    totalWorkHoursText: formatMinutesToHours(totalWorkMinutes),
    totalOvertimeMinutes,
    totalOvertimeHoursText: formatMinutesToHours(totalOvertimeMinutes)
  };
}

/**
 * 勤怠データのCSVエクスポート
 */
function exportAttendanceToCSV(attendanceList = [], targetMonth = '') {
  let list = attendanceList;
  let ym = targetMonth;
  if (typeof attendanceList === 'string') {
    ym = attendanceList;
    list = typeof getAttendanceList === 'function' ? getAttendanceList() : [];
  }
  if (!Array.isArray(list) || list.length === 0) {
    list = typeof getAttendanceList === 'function' ? getAttendanceList() : [];
  }
  const currentYM = ym || getTodayDateString().substring(0, 7);
  const filtered = list
    .filter(att => att && (att.date || '').startsWith(currentYM))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const headers = ['日付', '出勤時刻', '退勤時刻', '自動休憩(分)', '実働時間', '実労働(分)', '残業(分)', '備考'];
  const rows = filtered.map(att => {
    const calc = calculateWorkDuration(att.clockIn, att.clockOut);
    return [
      att.date,
      att.clockIn || '',
      att.clockOut || '',
      calc.breakMinutes,
      `"${formatMinutesToHours(calc.workMinutes)}"`,
      calc.workMinutes,
      calc.overtimeMinutes,
      `"${(att.note || '').replace(/"/g, '""')}"`
    ];
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
}

/**
 * 分数を「H : M」形式のオブジェクトに変換
 */
function formatMinutesToHM(minutes = 0) {
  if (!minutes || minutes <= 0) return { h: '', m: '', text: '' };
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return {
    h: String(h),
    m: String(m).padStart(2, '0'),
    text: `${h} : ${String(m).padStart(2, '0')}`
  };
}

/**
 * 時刻文字列（HH:MM）を「H : M」形式に分解
 */
function splitTimeToHM(timeStr = '') {
  if (!timeStr || !timeStr.includes(':')) return { h: '', m: '', text: '' };
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  return {
    h: isNaN(h) ? '' : String(h),
    m: isNaN(m) ? '' : String(m).padStart(2, '0'),
    text: isNaN(h) ? '' : `${h} : ${String(m).padStart(2, '0')}`
  };
}

const WEEKDAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

/**
 * 指定年月の月次出勤簿カレンダー全日（1日〜末日）データを生成
 * @param {Array} attendanceList 全打刻データ
 * @param {number} year 西暦年（例: 2026）
 * @param {number} month 月（1〜12）
 * @returns {object} { year, month, days: [], summary: {} }
 */
function generateMonthlyCalendarSheet(attendanceList = [], year, month) {
  const y = parseInt(year, 10) || new Date().getFullYear();
  const m = parseInt(month, 10) || (new Date().getMonth() + 1);
  const ymStr = `${y}-${String(m).padStart(2, '0')}`;

  // 月の日数を取得（翌月の0日目 = 当月末日）
  const daysInMonth = new Date(y, m, 0).getDate();

  // 当月の打刻データを日付キーのMapに変換
  const attMap = new Map();
  (attendanceList || []).forEach(att => {
    if (att && att.date && att.date.startsWith(ymStr)) {
      attMap.set(att.date, att);
    }
  });

  const days = [];
  let totalWorkDays = 0;
  let totalWorkMinutes = 0;
  let totalRegularMinutes = 0;
  let totalOvertimeMinutes = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = String(d).padStart(2, '0');
    const fullDate = `${ymStr}-${dayStr}`;
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = dateObj.getDay(); // 0=日, 6=土
    const weekdayName = WEEKDAY_NAMES[dayOfWeek];
    const isSaturday = dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;
    const isWeekend = isSaturday || isSunday;

    const record = attMap.get(fullDate) || null;
    const clockIn = record ? (record.clockIn || '') : '';
    const clockOut = record ? (record.clockOut || '') : '';
    const note = record ? (record.note || '') : '';

    let workMinutes = 0;
    let regularMinutes = 0; // 所定内（最大8時間 = 480分）
    let overtimeMinutes = 0; // 時間外（残業）
    let breakMinutes = 0;

    if (clockIn && clockOut) {
      totalWorkDays += 1;
      const duration = calculateWorkDuration(clockIn, clockOut);
      workMinutes = duration.workMinutes;
      breakMinutes = duration.breakMinutes;
      // 所定内（上限8時間）と時間外
      regularMinutes = Math.min(480, workMinutes);
      overtimeMinutes = duration.overtimeMinutes;

      totalWorkMinutes += workMinutes;
      totalRegularMinutes += regularMinutes;
      totalOvertimeMinutes += overtimeMinutes;
    } else if (clockIn) {
      totalWorkDays += 1;
    }

    days.push({
      day: d,
      date: fullDate,
      weekday: weekdayName,
      isWeekend,
      isSaturday,
      isSunday,
      recordId: record ? record.id : null,
      clockIn,
      clockOut,
      clockInParts: splitTimeToHM(clockIn),
      clockOutParts: splitTimeToHM(clockOut),
      breakMinutes,
      workMinutes,
      regularMinutes,
      regularParts: formatMinutesToHM(regularMinutes),
      overtimeMinutes,
      overtimeParts: formatMinutesToHM(overtimeMinutes),
      note
    });
  }

  return {
    year: y,
    month: m,
    ymStr,
    days,
    summary: {
      daysInMonth,
      workDays: totalWorkDays,
      totalWorkMinutes,
      totalRegularMinutes,
      totalOvertimeMinutes,
      totalWorkHoursText: formatMinutesToHours(totalWorkMinutes),
      totalRegularHoursText: formatMinutesToHours(totalRegularMinutes),
      totalOvertimeHoursText: formatMinutesToHours(totalOvertimeMinutes)
    }
  };
}

  // ==========================================================================
  // レシート・領収書画像解析エンジン
  // ==========================================================================
/**
 * receipt-parser.js
 * レシート・領収書画像解析 ＆ 自動入力エンジン
 * 画像圧縮、OCRテキスト抽出、正規表現パターンによる日付・金額・店名・科目自動抽出
 */

/**
 * アップロードされた画像をブラウザCanvasで適切なサイズに圧縮（長辺1200px、JPEG 0.85）
 * @param {File} file 画像ファイル
 * @returns {Promise<string>} Base64 DataURL
 */
function compressReceiptImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('ファイルが指定されていません'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
        return resolve(dataUrl);
      }

      const img = new Image();
      img.onload = () => {
        try {
          const maxDimension = 2000;
          let width = img.width || 800;
          let height = img.height || 600;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
            resolve(compressedDataUrl);
          } else {
            resolve(dataUrl);
          }
        } catch (err) {
          console.warn('Canvas compression error, using raw DataURL:', err);
          resolve(dataUrl);
        }
      };
      img.onerror = () => {
        // 画像デコードに失敗してもDataURLとしてそのまま渡す
        resolve(dataUrl);
      };
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
    reader.readAsDataURL(file);
  });
}

/**
 * OCR認識率向上のための画像前処理（グレースケール・高コントラスト化）
 * 薄い感熱紙レシートや影のある画像でも、文字をクッキリ浮き彫りにする
 * @param {string} dataUrl 画像Base64
 * @returns {Promise<string>} 前処理済みBase64 DataURL
 */
function preprocessImageForOcr(dataUrl) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      return resolve(dataUrl);
    }
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // グレースケール変換 ＋ ガンマ・コントラスト強調
        // 感熱紙の背景グレーを白く飛ばし、薄い黒文字を濃くする
        for (let i = 0; i < data.length; i += 4) {
          // 輝度計算 (Rec. 601)
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          // コントラストストレッチ（128を中心に拡大）
          let val = (gray - 120) * 1.5 + 120;
          if (val > 240) val = 255; // 明るい背景は真っ白に
          else if (val < 70) val = 0; // 暗い文字は真っ黒に
          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } catch (e) {
        console.warn('Image preprocessing failed:', e);
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * 過去の経費登録履歴から「支払先 ⇔ 勘定科目」の学習辞書を作成
 * @param {Array} expenseHistory 過去の経費オブジェクト配列
 * @returns {Array<{ payee: string, category: string, count: number }>}
 */
function buildLearnedPayeeIndex(expenseHistory = []) {
  if (!Array.isArray(expenseHistory) || expenseHistory.length === 0) {
    return [];
  }

  // 支払先ごとに集計
  const payeeMap = {};
  expenseHistory.forEach(exp => {
    const p = (exp.payee || '').trim();
    if (!p) return;
    if (!payeeMap[p]) {
      payeeMap[p] = { payee: p, counts: {}, total: 0 };
    }
    payeeMap[p].total += 1;
    const cat = exp.category || '消耗品費';
    payeeMap[p].counts[cat] = (payeeMap[p].counts[cat] || 0) + 1;
  });

  // 最も多く使われた勘定科目を紐付けて出現頻度順にソート
  return Object.values(payeeMap).map(item => {
    let topCategory = '消耗品費';
    let maxCount = -1;
    for (const [cat, cnt] of Object.entries(item.counts)) {
      if (cnt > maxCount) {
        maxCount = cnt;
        topCategory = cat;
      }
    }
    return {
      payee: item.payee,
      category: topCategory,
      count: item.total
    };
  }).sort((a, b) => b.count - a.count);
}

/**
 * レシートテキストから日付・金額・店名・勘定科目を自動抽出
 * 過去の経費履歴（学習辞書）と照合して、使えば使うほど精度が向上するハイブリッド推論
 * @param {string} rawText OCR等で得られた生テキスト
 * @param {Array} expenseHistory 過去の経費登録履歴
 * @returns {object} 解析結果 { date, amount, payee, category, taxRate, confidence, learned }
 */
function parseReceiptText(rawText = '', expenseHistory = []) {
  const result = {
    date: '',
    amount: 0,
    payee: '',
    category: '消耗品費',
    taxRate: 10,
    invoiceNumber: '',
    rawText: rawText,
    isLearnedMatch: false
  };

  if (!rawText || !rawText.trim()) {
    result.date = new Date().toISOString().split('T')[0];
    return result;
  }

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const normalizedRaw = rawText.replace(/[\s\t\r\n]+/g, '').toLowerCase();

  // 1. 日付の検出
  // 2020年代西暦 (例: 2026年9月25日, 2026/09/25, 2026.09.25, 2026-09-25)
  const fullYearMatch = rawText.match(/202[4-9][年\/\-.\s][0-1]?[0-9][月\/\-.\s][0-3]?[0-9]/);
  if (fullYearMatch) {
    const dStr = fullYearMatch[0].replace(/[年月]/g, '-').replace(/日/g, '').replace(/[\/.\s]/g, '-');
    const parts = dStr.split('-').filter(Boolean);
    if (parts.length === 3) {
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      result.date = `${y}-${m}-${d}`;
    }
  }

  // 西暦2桁または和暦 (例: 26/09/25, R8.9.25, 令和8年9月25日)
  if (!result.date) {
    const shortYearMatch = rawText.match(/(?:R|令|令和)?\s*([6-9]|[0-9]{2})[年\/\-.][0-1]?[0-9][月\/\-.][0-3]?[0-9]/);
    if (shortYearMatch) {
      const parts = shortYearMatch[0].replace(/(?:R|令|令和)/, '').replace(/[年月]/g, '-').replace(/日/g, '').replace(/[\/.]/g, '-').split('-').filter(Boolean);
      if (parts.length === 3) {
        let y = Number(parts[0]);
        if (y < 20) y = 2018 + y; // 令和 (R1=2019, R8=2026)
        else if (y < 100) y = 2000 + y; // 26 -> 2026
        const m = parts[1].padStart(2, '0');
        const d = parts[2].padStart(2, '0');
        result.date = `${y}-${m}-${d}`;
      }
    }
  }

  if (!result.date) {
    result.date = new Date().toISOString().split('T')[0];
  }

  // 2. 金額の検出
  let detectedAmount = 0;

  // A. 合計キーワード近傍からの優先検出
  const priorityPatterns = [
    /(?:合計|ご請求|お買上[げ額]?|お会計|支払金額|領収金額|合\s*計|合言十|Total|TOTAL|Amount|Cash)[\s:：]*[¥￥Y\\]?\s*([0-9,]+)/i,
    /(?:合計|ご請求|領収金額)[\s\S]{0,15}?[¥￥Y\\]\s*([0-9,]+)/i,
    /(?:小計|お預[りかり]|税込)[\s:：]*[¥￥Y\\]?\s*([0-9,]+)/i,
    /[¥￥\\]\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{2,7})/,
    /([0-9]{1,3}(?:,[0-9]{3})+)\s*(?:円|税込)?/
  ];

  for (const pattern of priorityPatterns) {
    const match = rawText.match(pattern);
    if (match && match[1]) {
      const cleanNum = Number(match[1].replace(/,/g, ''));
      if (cleanNum > 0 && cleanNum < 5000000) {
        detectedAmount = cleanNum;
        break;
      }
    }
  }

  // B. キーワードで見つからない場合、レシート中の妥当な最大数値を推定
  if (!detectedAmount) {
    const allNumbers = [];
    const numMatches = rawText.matchAll(/([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,7})/g);
    for (const m of numMatches) {
      const n = Number(m[1].replace(/,/g, ''));
      // 年号(2024-2027)や電話番号、郵便番号を除外
      if (n >= 100 && n <= 1000000 && n !== 2024 && n !== 2025 && n !== 2026 && n !== 2027) {
        allNumbers.push(n);
      }
    }
    if (allNumbers.length > 0) {
      detectedAmount = Math.max(...allNumbers);
    }
  }

  result.amount = detectedAmount;

  // 2.5 インボイス登録番号の検出 (T+13桁)
  let detectedInvoiceNumber = '';
  const invoiceMatch = rawText.match(/(?:登録番号|インボイス|No\.?)?[\s:：]*([tT][0-9]{13})\b/);
  if (invoiceMatch && invoiceMatch[1]) {
    detectedInvoiceNumber = invoiceMatch[1].toUpperCase();
  } else {
    const numOnlyMatch = rawText.match(/(?:登録番号|事業者番号)[\s:：]*([0-9]{13})\b/);
    if (numOnlyMatch && numOnlyMatch[1]) {
      detectedInvoiceNumber = `T${numOnlyMatch[1]}`;
    }
  }
  result.invoiceNumber = detectedInvoiceNumber;

  // 3. 【最優先】過去の登録履歴（学習辞書）とのマッチング
  // ユーザーが一度登録した支払先と勘定科目を最優先で自動特定（使えば使うほど精度が向上！）
  const learnedList = buildLearnedPayeeIndex(expenseHistory);
  for (const item of learnedList) {
    const pName = item.payee.trim();
    if (!pName || pName.length < 2) continue;
    const cleanP = pName.replace(/[\s\t\r\n\(\)（）株式会社有限会社]/g, '').toLowerCase();

    // OCR生テキストまたは正規化テキストに過去の店名が含まれているか判定
    if (cleanP.length >= 2 && (normalizedRaw.includes(cleanP) || rawText.includes(pName))) {
      result.payee = item.payee;
      result.category = item.category;
      result.isLearnedMatch = true;
      break;
    }
  }

  // 4. 定番チェーン店・主要サービスのパターンマッチング（学習辞書で見つからない場合のフォールバック）
  if (!result.payee) {
    const KNOWN_MERCHANTS = [
      { pattern: /セブン[\-ー]?イレブン|7[\-ー]?eleven/i, name: 'セブン-イレブン', category: '消耗品費' },
      { pattern: /ローソン|lawson/i, name: 'ローソン', category: '消耗品費' },
      { pattern: /ファミリーマート|ファミマ|family[\s\-]?mart/i, name: 'ファミリーマート', category: '消耗品費' },
      { pattern: /ミニストップ|ministop/i, name: 'ミニストップ', category: '消耗品費' },
      { pattern: /出光|idemitsu|アポロステーション|apollostation/i, name: '出光興産', category: '旅費交通費' },
      { pattern: /eneos|エネオス/i, name: 'ENEOS', category: '旅費交通費' },
      { pattern: /コスモ石油|cosmo/i, name: 'コスモ石油', category: '旅費交通費' },
      { pattern: /キグナス|kygnus/i, name: 'キグナス石油', category: '旅費交通費' },
      { pattern: /タクシー|taxi|交通|日本交通|kmタクシー|第一交通/i, name: 'タクシー代', category: '旅費交通費' },
      { pattern: /jr[東日本|西日本|東海|九州|北海道]?|東日本旅客鉄道|西日本旅客鉄道/i, name: 'JR乗車券・特急券', category: '旅費交通費' },
      { pattern: /東京メトロ|地下鉄|私鉄/i, name: '地下鉄・私鉄電車代', category: '旅費交通費' },
      { pattern: /タイムズ|times|三井のリパーク|コインパーキング|駐車場/i, name: '駐車場代（パーキング）', category: '旅費交通費' },
      { pattern: /高速道路|nexco|首都高|阪神高速|etc/i, name: '高速道路料金', category: '車両費' },
      { pattern: /アスクル|askul/i, name: 'アスクル', category: '消耗品費' },
      { pattern: /amazon|アマゾン/i, name: 'Amazon', category: '消耗品費' },
      { pattern: /モノタロウ|monotaro/i, name: 'モノタロウ', category: '消耗品費' },
      { pattern: /ヨドバシ|yodobashi/i, name: 'ヨドバシカメラ', category: '消耗品費' },
      { pattern: /ビックカメラ|bic\s*camera/i, name: 'ビックカメラ', category: '消耗品費' },
      { pattern: /ダイソー|daiso|セリア|seria|キャンドゥ/i, name: '100円均一ショップ', category: '消耗品費' },
      { pattern: /カインズ|cainz|コーナン|コメリ|ビバホーム|ジョイフル本田|ロイヤルホームセンター/i, name: 'ホームセンター資材・備品', category: '消耗品費' },
      { pattern: /スターバックス|starbucks|スタバ/i, name: 'スターバックス', category: '接待交際費' },
      { pattern: /ドトール|doutor|タリーズ|コメダ珈琲|ベローチェ/i, name: 'カフェ・喫茶代', category: '接待交際費' },
      { pattern: /マクドナルド|ガスト|サイゼリヤ|すき家|吉野家|松屋|大戸屋|やよい軒/i, name: '飲食・会食代', category: '接待交際費' },
      { pattern: /日本郵便|郵便局|ゆうパック|レターパック/i, name: '郵便局', category: '通信費' },
      { pattern: /ヤマト運輸|クロネコヤマト|佐川急便/i, name: '宅配便・運送代', category: '通信費' }
    ];

    for (const m of KNOWN_MERCHANTS) {
      if (m.pattern.test(rawText)) {
        result.payee = m.name;
        result.category = m.category;
        break;
      }
    }
  }

  // 5. 特定店名に一致しない場合、レシートの先頭数行から店名を推定
  if (!result.payee && lines.length > 0) {
    for (let i = 0; i < Math.min(6, lines.length); i++) {
      const line = lines[i];
      if (!/^\d{2,4}-\d{2,4}-\d{4}/.test(line) &&
          !/^\d{4}[\/\-.]/.test(line) &&
          !/^(領収書|レシート|RECEIPT|お会計|取扱|登録番号|インボイス|No\.|TEL|電話)/i.test(line)) {
        if (line.length >= 2 && line.length <= 25) {
          result.payee = line;
          break;
        }
      }
    }
  }

  // 6. 勘定科目の自動推定（店名で未定の場合のテキスト全体スキャン）
  if (result.category === '消耗品費') {
    const lowerText = rawText.toLowerCase();
    if (/ガソリン|給油|軽油|レギュラー|ハイオク|駐車|パーキング|電車|切符|運賃|バス|suica|pasmo|icoca/.test(lowerText)) {
      result.category = '旅費交通費';
    } else if (/高速|etc|車検|オイル交換|タイヤ|洗車/.test(lowerText)) {
      result.category = '車両費';
    } else if (/ntt|kddi|ソフトバンク|docomo|ドコモ|郵便|切手|ヤマト|佐川|インターネット|wifi|プロバイダ/.test(lowerText)) {
      result.category = '通信費';
    } else if (/居酒屋|会食|料理|酒|ビール|寿司|焼肉|レストラン|カフェ|宴会/.test(lowerText)) {
      result.category = '接待交際費';
    } else if (/仕入|卸|材料|原材料|パーツ|部品|木材|鋼材|建材/.test(lowerText)) {
      result.category = '仕入高';
    } else if (/書籍|専門書|雑誌|新聞|講読/.test(lowerText)) {
      result.category = '新聞図書費';
    } else if (/電気代|水道代|ガス代|東京電力|関西電力|東京ガス/.test(lowerText)) {
      result.category = '水道光熱費';
    }
  }

  // 7. 軽減税率（8%）判定
  if (/軽減|軽\s*[8８]%|飲食料品|テイクアウト|お持ち帰り/.test(rawText)) {
    result.taxRate = 8;
  }

  return result;
}

/**
 * 画像からテキスト認識（Tesseract.js / TextDetector / スマートフォールバック）
 * @param {string|File} dataUrlOrFile 画像Base64 または File
 * @param {Function} onProgress 進捗コールバック
 * @param {Array} expenseHistory 過去の経費登録履歴（使えば使うほど精度が向上する学習辞書）
 * @returns {Promise<object>} 解析結果
 */
async function analyzeReceiptImage(dataUrlOrFile, onProgress = null, expenseHistory = []) {
  let dataUrl = dataUrlOrFile;
  let fileName = '';

  if (dataUrlOrFile instanceof Blob || (dataUrlOrFile && typeof dataUrlOrFile === 'object' && dataUrlOrFile.name)) {
    fileName = dataUrlOrFile.name || '';
    try {
      dataUrl = await compressReceiptImage(dataUrlOrFile);
    } catch (_) {
      dataUrl = '';
    }
  }

  // ========================================================================
  // 0. ローカルサーバー経由の Gemini 1.5 Flash Vision OCR（超高精度・最優先）
  // コードにはAPIキーを一切書かず、ローカルサーバー（.env）経由で安全に通信
  // ========================================================================
  if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http') && dataUrl) {
    try {
      if (onProgress) onProgress('✨ Google Gemini AIで超高精度解析中...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);

      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl, fileName }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const geminiResult = await res.json();
        if (geminiResult && !geminiResult.error && (geminiResult.amount || geminiResult.payee)) {
          return {
            date: geminiResult.date || new Date().toISOString().split('T')[0],
            amount: Number(geminiResult.amount) || 0,
            payee: geminiResult.payee || '',
            category: geminiResult.category || '消耗品費',
            taxRate: Number(geminiResult.taxRate) || 10,
            invoiceNumber: geminiResult.invoiceNumber || '',
            note: geminiResult.note || '',
            engine: geminiResult.engine || 'gemini-flash',
            receiptDataUrl: typeof dataUrl === 'string' ? dataUrl : ''
          };
        } else if (geminiResult && geminiResult.error) {
          console.warn('Gemini API returned error:', geminiResult.error);
          if (typeof window !== 'undefined') {
            window.lastGeminiError = geminiResult.error;
          }
        }
      }
    } catch (e) {
      console.log('Gemini API proxy unavailable or not configured, falling back to local OCR engine:', e);
    }
  }

  // ========================================================================
  // ローカルOCRパイプライン（Tesseract.js + 学習辞書フォールバック）
  // ========================================================================
  let ocrInputUrl = dataUrl;
  try {
    if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
      ocrInputUrl = await preprocessImageForOcr(dataUrl);
    }
  } catch (e) {
    ocrInputUrl = dataUrl;
  }

  let extractedRawText = '';

  // 1. ブラウザネイティブの TextDetector API（最速）
  if (typeof window !== 'undefined' && 'TextDetector' in window && typeof ocrInputUrl === 'string' && ocrInputUrl.startsWith('data:')) {
    try {
      if (onProgress) onProgress('ネイティブOCRで解析中...');
      const detector = new window.TextDetector();
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = ocrInputUrl;
      });
      const detectedTexts = await detector.detect(img);
      extractedRawText = detectedTexts.map(t => t.rawValue).join('\n');
    } catch (e) {
      console.warn('TextDetector failed, trying next method:', e);
    }
  }

  // 2. Tesseract.js（ブラウザ内Wasm OCRエンジン）
  if (!extractedRawText && typeof window !== 'undefined' && window.Tesseract && typeof ocrInputUrl === 'string' && ocrInputUrl.startsWith('data:')) {
    try {
      if (onProgress) onProgress('AI文字認識エンジンで解析中...');
      const ocrPromise = (async () => {
        const ret = await window.Tesseract.recognize(ocrInputUrl, 'eng+jpn', {
          logger: m => {
            if (onProgress && m.status === 'recognizing text' && m.progress) {
              onProgress(`文字認識中... ${Math.round(m.progress * 100)}%`);
            }
          }
        });
        return ret?.data?.text || '';
      })();

      // 最大10秒でタイムアウトして安全にフォールバック
      const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(''), 10000));
      extractedRawText = await Promise.race([ocrPromise, timeoutPromise]);
    } catch (err) {
      console.warn('Tesseract OCR error:', err);
    }
  }

  // 3. テキストからレシート情報を抽出（過去の登録履歴から自動学習）
  const parsed = parseReceiptText(extractedRawText, expenseHistory);
  parsed.receiptDataUrl = typeof dataUrl === 'string' ? dataUrl : '';

  // 4. ファイル名からのスマート補完（OCRで漏れた場合の補助）
  if (fileName) {
    const fnDate = fileName.match(/202[4-9][\-_]?[0-1][0-9][\-_]?[0-3][0-9]/);
    if (fnDate && (!parsed.date || parsed.date === new Date().toISOString().split('T')[0])) {
      const clean = fnDate[0].replace(/[\-_]/g, '');
      parsed.date = `${clean.substr(0,4)}-${clean.substr(4,2)}-${clean.substr(6,2)}`;
    }
    const fnAmount = fileName.match(/([0-9]{2,7})(?:円|yen)/i);
    if (fnAmount && (!parsed.amount || parsed.amount === 0)) {
      parsed.amount = Number(fnAmount[1]);
    }
    const fnPayee = fileName.match(/(セブン|ローソン|ファミマ|出光|eneos|jr|アスクル|amazon|ビックカメラ|ヨドバシ|タクシー)/i);
    if (fnPayee && !parsed.payee) {
      parsed.payee = fnPayee[0];
    }
  }

  return parsed;
}

  // ==========================================================================
  // ストレージ管理（商品マスタ・経費・勤怠・入金管理）
  // ==========================================================================
/**
 * storage.js
 * LocalStorage管理、自社プロファイル永続化、書類履歴、JSON入出力
 */

const KEYS = {
  ACTIVE_DOC: 'quickdoc_active_doc',
  HISTORY: 'quickdoc_history_list',
  ISSUER_PROFILE: 'quickdoc_issuer_profile',
  CLIENT_HISTORY: 'quickdoc_client_history',
  CLIENT_MASTER: 'quickdoc_client_master',
  ITEM_MASTER: 'quickdoc_item_master',
  DISCOUNT_REASONS: 'quickdoc_discount_reasons',
  USER_PRICE_HISTORY: 'quickdoc_user_price_history',
  EXPENSES: 'quickdoc_expenses',
  ATTENDANCE: 'quickdoc_attendance',
  ATTENDANCE_EMPLOYEE: 'billcraft_attendance_employee',
  INVENTORY: 'billcraft_inventory_master',
  PURCHASE_MAPPINGS: 'billcraft_purchase_mappings'
};

const DEFAULT_ITEMS_MASTER = [
  {
    id: 'item_mst_1',
    name: '製品基本セット（一式）',
    unitPrice: 83333,
    userPrice: 110000,
    unit: '式',
    taxRate: 10,
    note: '標準構成一式',
    usageCount: 10
  },
  {
    id: 'item_mst_2',
    name: 'システム導入・初期設定作業費',
    unitPrice: 37879,
    userPrice: 50000,
    unit: '回',
    taxRate: 10,
    note: '現地作業含む',
    usageCount: 7
  },
  {
    id: 'item_mst_3',
    name: '月額保守サポート（1ヶ月）',
    unitPrice: 15152,
    userPrice: 20000,
    unit: '月',
    taxRate: 10,
    note: 'リモート対応',
    usageCount: 5
  },
  {
    id: 'item_mst_4',
    name: '交換用消耗部品セット',
    unitPrice: 7576,
    userPrice: 10000,
    unit: '組',
    taxRate: 10,
    note: '型番: SP-01',
    usageCount: 2
  }
];

const DEFAULT_CLIENT_MASTER = [
  {
    id: 'client_mst_1',
    name: '株式会社サンプル',
    code: 'C001',
    honorific: '御中',
    zip: '100-0001',
    address: '東京都千代田区千代田1-1',
    contactPerson: '総務部 田中 様',
    tel: '03-1111-2222',
    email: 'tanaka@sample.example.jp',
    invoiceNumber: '',
    category: 'customer',
    closingDay: '末日',
    paymentTerms: '翌月末',
    note: '基本取引先。請求書は郵送およびPDF送付',
    usageCount: 12,
    createdAt: new Date().toISOString()
  },
  {
    id: 'client_mst_2',
    name: '株式会社テクノロジー',
    code: 'C002',
    honorific: '御中',
    zip: '108-0075',
    address: '東京都港区港南2-15-1',
    contactPerson: 'IT推進室 鈴木 様',
    tel: '03-3333-4444',
    email: 'suzuki@tech.example.jp',
    invoiceNumber: 'T2010001099887',
    category: 'customer',
    closingDay: '20日',
    paymentTerms: '当月末',
    note: 'システム開発関連プロジェクト',
    usageCount: 8,
    createdAt: new Date().toISOString()
  },
  {
    id: 'client_mst_3',
    name: 'サンプル石油株式会社',
    code: 'V001',
    honorific: '御中',
    zip: '100-0002',
    address: '東京都千代田区皇居外苑1-1',
    contactPerson: '',
    tel: '03-0000-0001',
    email: '',
    invoiceNumber: 'T1000000000001',
    category: 'vendor',
    closingDay: '都度',
    paymentTerms: '即時（法人カード）',
    note: '社用車ガソリン給油',
    usageCount: 5,
    createdAt: new Date().toISOString()
  },
  {
    id: 'client_mst_4',
    name: 'サンプル運送株式会社',
    code: 'V002',
    honorific: '御中',
    zip: '100-0003',
    address: '東京都千代田区霞が関1-1',
    contactPerson: '',
    tel: '03-0000-0002',
    email: '',
    invoiceNumber: 'T1000000000002',
    category: 'vendor',
    closingDay: '都度',
    paymentTerms: '即時決済',
    note: '書類・資材配送便',
    usageCount: 4,
    createdAt: new Date().toISOString()
  },
  {
    id: 'client_mst_5',
    name: 'サンプルパーキング株式会社',
    code: 'V003',
    honorific: '御中',
    zip: '100-0004',
    address: '東京都千代田区永田町1-1',
    contactPerson: '',
    tel: '03-0000-0003',
    email: '',
    invoiceNumber: 'T1000000000003',
    category: 'vendor',
    closingDay: '都度',
    paymentTerms: '現地精算',
    note: 'コインパーキング利用',
    usageCount: 3,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_DISCOUNT_REASONS = [
  { name: '出精値引き', count: 5 },
  { name: '特別キャンペーン値引き', count: 4 },
  { name: '初回お取引値引き', count: 3 },
  { name: 'まとめ買いボリューム値引き', count: 2 },
  { name: '端数値引き', count: 1 }
];
const DEFAULT_INVENTORY = [
  {
    id: 'inv_1',
    itemId: 'item_mst_1',
    name: '製品基本セット（一式）',
    sku: 'PRD-001',
    currentStock: 25,
    safetyStock: 5,
    unit: '式',
    unitCost: 50000,
    unitPrice: 83333,
    location: '本社倉庫 A-1',
    lastInDate: '2026-09-25',
    note: '主力構成商品',
    history: [
      { id: 'log_init_1', date: '2026-09-25', type: 'in', qty: 25, reason: '初期棚卸在庫登録', currentStock: 25, timestamp: new Date().toISOString() }
    ]
  },
  {
    id: 'inv_2',
    itemId: 'item_mst_4',
    name: '交換用消耗部品セット',
    sku: 'SP-01',
    currentStock: 12,
    safetyStock: 3,
    unit: '組',
    unitCost: 4500,
    unitPrice: 7576,
    location: 'パーツ保管棚 B-2',
    lastInDate: '2026-09-20',
    note: '定期補充対象部品',
    history: [
      { id: 'log_init_2', date: '2026-09-20', type: 'in', qty: 12, reason: '仕入入庫', currentStock: 12, timestamp: new Date().toISOString() }
    ]
  }
];
const DEFAULT_PURCHASE_MAPPINGS = {
  "消耗部品まとめ": "inv_2",
  "交換パーツ一式": "inv_2",
  "基本パーツセット": "inv_1"
};

/**
 * 現在編集中の帳票を保存
 */
function saveActiveDoc(doc) {
  try {
    localStorage.setItem(KEYS.ACTIVE_DOC, JSON.stringify(doc));
  } catch (e) {
    console.error('Failed to save active doc to localStorage:', e);
  }
}

/**
 * 現在編集中の帳票を取得
 */
function loadActiveDoc() {
  try {
    const raw = localStorage.getItem(KEYS.ACTIVE_DOC);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to load active doc:', e);
    return null;
  }
}

/**
 * 自社プロファイルを保存（次回作成時に自動反映）
 */
function saveIssuerProfile(issuer) {
  try {
    localStorage.setItem(KEYS.ISSUER_PROFILE, JSON.stringify(issuer));
    // サーバーファイル（data/issuer_profile.json）にも即時保存
    saveServerIssuerProfile(issuer).catch(e => {
      console.warn('Server issuer profile save failed:', e);
    });
  } catch (e) {
    console.error('Failed to save issuer profile:', e);
  }
}

/**
 * 自社プロファイルを取得
 */
function loadIssuerProfile() {
  try {
    const raw = localStorage.getItem(KEYS.ISSUER_PROFILE);
    const profile = raw ? JSON.parse(raw) : {};

    // 振込先情報および自社情報の消失防止フォールバック（サーバーの正真データと完全連動）
    if (!profile.bankInfo || profile.bankInfo.trim() === '') {
      profile.bankInfo = '高崎信用金庫\n前橋南支店\n普通　012 2182393\nカ)　アルバワークス';
    }
    if (!profile.name || profile.name.trim() === '' || profile.name === 'スタジオ・ネクサス合同会社') {
      profile.name = '株式会社アルバワークス';
      profile.invoiceNumber = 'T2070001004966';
      profile.zip = '379-2144';
      profile.address = '群馬県前橋市下川町63-7';
      profile.tel = '027-289-0367';
      profile.fax = '027-289-0368';
    }

    return profile;
  } catch (e) {
    console.error('Failed to load issuer profile:', e);
    return {
      name: '株式会社アルバワークス',
      invoiceNumber: 'T2070001004966',
      zip: '379-2144',
      address: '群馬県前橋市下川町63-7',
      tel: '027-289-0367',
      fax: '027-289-0368',
      bankInfo: '高崎信用金庫\n前橋南支店\n普通　012 2182393\nカ)　アルバワークス'
    };
  }
}

/**
 * 書類履歴一覧を取得
 */
function getHistoryList() {
  try {
    const raw = localStorage.getItem(KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to get history list:', e);
    return [];
  }
}

/**
 * 書類を履歴に保存（新規追加または上書き）
 */
function saveDocToHistory(doc) {
  try {
    const list = getHistoryList();
    const existingIndex = list.findIndex(item => item.id === doc.id);
    
    // 金額・税金の計算
    let subtotal = 0;
    let taxTotal = 0;
    if (Array.isArray(doc.items)) {
      doc.items.forEach(it => {
        const qty = Number(it.quantity) || 0;
        const price = Number(it.unitPrice) || 0;
        const lineTotal = qty * price;
        const rate = Number(it.taxRate !== undefined ? it.taxRate : 10);
        subtotal += lineTotal;
        taxTotal += Math.floor(lineTotal * (rate / 100));
      });
    }
    const grandTotal = subtotal + taxTotal;
    const isPaid = !!(doc.isPaid || doc.paymentStatus === 'paid');

    const summaryItem = {
      id: doc.id,
      docType: doc.docType || 'invoice',
      docNumber: doc.docNumber || '',
      title: doc.title || '',
      clientName: doc.client?.name || '名称未設定',
      client: doc.client || { name: '名称未設定' },
      issueDate: doc.issueDate || '',
      dueDate: doc.dueDate || '',
      items: doc.items || [],
      subtotal,
      taxTotal,
      grandTotal,
      isPaid,
      paymentStatus: isPaid ? 'paid' : 'unpaid',
      paidDate: doc.paidDate || (isPaid ? new Date().toISOString().split('T')[0] : ''),
      isIssued: !!doc.isIssued,
      isCancelled: !!doc.isCancelled,
      issuedAt: doc.issuedAt || (doc.isIssued ? new Date().toISOString() : null),
      updatedAt: new Date().toISOString(),
      fullDoc: doc
    };

    if (existingIndex >= 0) {
      list[existingIndex] = summaryItem;
    } else {
      list.unshift(summaryItem);
    }

    // 最大50件まで保存
    if (list.length > 50) {
      list.length = 50;
    }

    localStorage.setItem(KEYS.HISTORY, JSON.stringify(list));
    // 自社情報もプロファイルに保存
    if (doc.issuer) {
      saveIssuerProfile(doc.issuer);
    }
    // 伝票に含まれる商品や取引先を自動でマスタへ登録・蓄積
    autoRegisterMastersFromDoc(doc);
    return true;
  } catch (e) {
    console.error('Failed to save doc to history:', e);
    return false;
  }
}

/**
 * 履歴から書類を削除
 */
function deleteDocFromHistory(id) {
  try {
    const list = getHistoryList().filter(item => item.id !== id);
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error('Failed to delete doc from history:', e);
    return false;
  }
}

/**
 * 履歴から特定の書類を取得
 */
function getDocFromHistory(id) {
  const list = getHistoryList();
  const found = list.find(item => item.id === id);
  return found ? found.fullDoc : null;
}

/**
 * 書類履歴から商品マスタの使用回数マップを算出
 * @returns {Record<string, number>}
 */
function getItemMasterUsageMap() {
  const usageMap = {};
  const docHistory = getHistoryList();
  docHistory.forEach(docSummary => {
    const doc = docSummary.fullDoc;
    if (doc && Array.isArray(doc.items)) {
      doc.items.forEach(it => {
        const name = (it.name || '').trim();
        if (name) {
          usageMap[name] = (usageMap[name] || 0) + 1;
        }
      });
    }
  });
  return usageMap;
}

// ==========================================================================
// サーバー通信・マスタ永続化APIヘルパー
// ==========================================================================
async function fetchServerMasterItems() {
  try {
    const res = await fetch('/api/master/items', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    // オフラインまたは静的ファイル起動時
  }
  return null;
}
async function saveServerMasterItems(items) {
  try {
    const res = await fetch('/api/master/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items)
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}
async function fetchServerMasterClients() {
  try {
    const res = await fetch('/api/master/clients', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    // オフラインまたは静的ファイル起動時
  }
  return null;
}
async function saveServerMasterClients(clients) {
  try {
    const res = await fetch('/api/master/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clients)
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}
async function fetchServerIssuerProfile() {
  try {
    const res = await fetch('/api/issuer', { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // オフラインまたは静的起動時
  }
  return null;
}
async function saveServerIssuerProfile(issuer) {
  try {
    const res = await fetch('/api/issuer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issuer)
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}
async function fetchServerAttendance() {
  try {
    const res = await fetch('/api/attendance', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    // オフラインまたは静的起動時
  }
  return null;
}
async function saveServerAttendance(attendanceList) {
  try {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attendanceList)
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}
async function fetchServerAttendanceEmployee() {
  try {
    const res = await fetch('/api/attendance/employee', { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // オフラインまたは静的起動時
  }
  return null;
}
async function saveServerAttendanceEmployee(empInfo) {
  try {
    const res = await fetch('/api/attendance/employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(empInfo)
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}
async function deleteServerAttendanceRecord(date = '', id = '') {
  try {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (id) params.set('id', id);
    const res = await fetch(`/api/attendance?${params.toString()}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

/**
 * 商品マスタ一覧を取得（デフォルトで頻度の多い順にソート）
 * @param {boolean} sortByFrequency 使用頻度の多い順にソートするかどうか
 */
function getItemMasterList(sortByFrequency = true) {
  try {
    const raw = localStorage.getItem(KEYS.ITEM_MASTER);
    let list = [];
    if (!raw) {
      saveItemMasterList(DEFAULT_ITEMS_MASTER);
      list = [...DEFAULT_ITEMS_MASTER];
    } else {
      list = JSON.parse(raw);
    }

    if (sortByFrequency) {
      const historyUsage = getItemMasterUsageMap();
      list.sort((a, b) => {
        const countA = (Number(a.usageCount) || 0) + (historyUsage[(a.name || '').trim()] || 0);
        const countB = (Number(b.usageCount) || 0) + (historyUsage[(b.name || '').trim()] || 0);
        if (countB !== countA) return countB - countA;
        return (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '');
      });
    }
    return list;
  } catch (e) {
    console.error('Failed to get item master list:', e);
    return [...DEFAULT_ITEMS_MASTER];
  }
}

/**
 * 商品マスタ一覧を保存（LocalStorageとサーバーファイル data/items_master.json の両方に永続化）
 */
function saveItemMasterList(list) {
  try {
    localStorage.setItem(KEYS.ITEM_MASTER, JSON.stringify(list));
    // サーバーファイルにも即時非同期保存（二度と消えないようにする）
    saveServerMasterItems(list).catch(err => {
      console.warn('Server item master save failed:', err);
    });
    return true;
  } catch (e) {
    console.error('Failed to save item master list:', e);
    return false;
  }
}

/**
 * 商品マスタの使用回数を記録（伝票へ追加時等）
 */
function recordItemMasterUsage(itemId, itemName) {
  try {
    const list = getItemMasterList(false);
    const target = list.find(i => (itemId && i.id === itemId) || (itemName && (i.name || '').trim() === itemName.trim()));
    if (target) {
      target.usageCount = (Number(target.usageCount) || 0) + 1;
      target.lastUsedAt = new Date().toISOString();
      saveItemMasterList(list);
    }
  } catch (e) {
    console.error('Failed to record item master usage:', e);
  }
}

/**
 * 商品マスタに商品を追加（または上書き）
 */
function saveItemToMaster(item) {
  try {
    const list = getItemMasterList(false);
    const cleanName = (item.name || '').trim();
    if (!cleanName) return null;

    // IDまたは品名で既存商品を特定
    const existingIndex = list.findIndex(i => (item.id && i.id === item.id) || ((i.name || '').trim() === cleanName));
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      list[existingIndex] = {
        ...list[existingIndex],
        ...item,
        name: cleanName,
        unitPrice: Number(item.unitPrice !== undefined ? item.unitPrice : list[existingIndex].unitPrice) || 0,
        userPrice: Number(item.userPrice !== undefined ? item.userPrice : list[existingIndex].userPrice) || 0,
        unit: item.unit || list[existingIndex].unit || '式',
        taxRate: item.taxRate !== undefined ? Number(item.taxRate) : (list[existingIndex].taxRate ?? 10),
        note: item.note !== undefined ? item.note : (list[existingIndex].note || ''),
        updatedAt: now
      };
    } else {
      const newItem = {
        id: item.id || ('prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
        name: cleanName,
        unitPrice: Number(item.unitPrice) || 0,
        userPrice: Number(item.userPrice !== undefined ? item.userPrice : item.unitPrice) || 0,
        unit: item.unit || '式',
        taxRate: item.taxRate !== undefined ? Number(item.taxRate) : 10,
        note: item.note || '',
        usageCount: Number(item.usageCount) || 0,
        createdAt: now,
        updatedAt: now
      };
      list.unshift(newItem);
    }
    saveItemMasterList(list);
    return true;
  } catch (e) {
    console.error('Failed to save item to master:', e);
    return false;
  }
}

/**
 * 商品マスタから商品を削除
 */
function deleteItemFromMaster(id) {
  try {
    const list = getItemMasterList(false).filter(i => i.id !== id);
    saveItemMasterList(list);
    return true;
  } catch (e) {
    console.error('Failed to delete item from master:', e);
    return false;
  }
}

// ==========================================================================
// 取引先マスタ管理
// ==========================================================================

/**
 * 過去の書類履歴および経費履歴から取引先ごとの登場頻度マップを集計
 */
function getClientMasterUsageMap() {
  const usageMap = {};
  try {
    const docHistory = getHistoryList();
    docHistory.forEach(docSummary => {
      const name = (docSummary.clientName || '').trim();
      if (name && name !== '名称未設定') {
        usageMap[name] = (usageMap[name] || 0) + 1;
      }
    });

    const expenses = getExpenseList();
    expenses.forEach(exp => {
      const payee = (exp.payee || '').trim();
      if (payee) {
        usageMap[payee] = (usageMap[payee] || 0) + 1;
      }
    });
  } catch (e) {
    console.error('Failed to get client master usage map:', e);
  }
  return usageMap;
}

/**
 * 取引先マスタ一覧を取得（デフォルトで利用頻度順にソート）
 * @param {boolean} sortByFrequency 
 */
function getClientMasterList(sortByFrequency = true) {
  try {
    const raw = localStorage.getItem(KEYS.CLIENT_MASTER);
    let list = [];
    if (!raw) {
      saveClientMasterList(DEFAULT_CLIENT_MASTER);
      list = [...DEFAULT_CLIENT_MASTER];
    } else {
      list = JSON.parse(raw);
    }

    if (list && Array.isArray(list)) {
      const hasDetailedTimes = list.some(c => c.name && c.name.includes('高崎郵便局駐車場'));
      if (hasDetailedTimes) {
        const filtered = list.filter(c => !(c.name === 'タイムズ２４株式会社' || c.id === 'client_mst_5'));
        if (filtered.length !== list.length) {
          list = filtered;
          localStorage.setItem(KEYS.CLIENT_MASTER, JSON.stringify(list));
        }
      }
    }

    if (sortByFrequency) {
      const historyUsage = getClientMasterUsageMap();
      list.sort((a, b) => {
        const countA = (Number(a.usageCount) || 0) + (historyUsage[(a.name || '').trim()] || 0);
        const countB = (Number(b.usageCount) || 0) + (historyUsage[(b.name || '').trim()] || 0);
        if (countB !== countA) return countB - countA;
        return (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '');
      });
    }
    return list;
  } catch (e) {
    console.error('Failed to get client master list:', e);
    return [...DEFAULT_CLIENT_MASTER];
  }
}

/**
 * 取引先マスタ一覧を保存（LocalStorageとサーバーファイル data/clients_master.json の両方に永続化）
 */
function saveClientMasterList(list) {
  try {
    localStorage.setItem(KEYS.CLIENT_MASTER, JSON.stringify(list));
    // サーバーファイルにも即時非同期保存（二度と消えないようにする）
    saveServerMasterClients(list).catch(err => {
      console.warn('Server client master save failed:', err);
    });
    return true;
  } catch (e) {
    console.error('Failed to save client master list:', e);
    return false;
  }
}

/**
 * 過去の書類履歴や作成中の伝票、経費データから消失した商品や取引先を自動救済・復元
 * @returns {{rescuedItems: number, rescuedClients: number}}
 */
function rescueMastersFromHistory() {
  let rescuedItems = 0;
  let rescuedClients = 0;

  try {
    const history = getHistoryList();
    const activeDoc = loadActiveDoc();
    const allDocs = [...history.map(h => h.fullDoc).filter(Boolean)];
    if (activeDoc) allDocs.push(activeDoc);

    // 1. 商品マスタの自動救済
    const currentItems = getItemMasterList(false);
    const existingItemNames = new Set(currentItems.map(i => (i.name || '').trim().toLowerCase()));
    const itemsToAdd = [];

    allDocs.forEach(doc => {
      if (Array.isArray(doc.items)) {
        doc.items.forEach(it => {
          const name = (it.name || '').trim();
          if (name && !existingItemNames.has(name.toLowerCase())) {
            existingItemNames.add(name.toLowerCase());
            const newItem = {
              id: 'rescued_item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              name: name,
              unitPrice: Number(it.unitPrice) || 0,
              userPrice: Number(it.userPrice !== undefined ? it.userPrice : it.unitPrice) || 0,
              unit: it.unit || '式',
              taxRate: it.taxRate !== undefined ? Number(it.taxRate) : 10,
              note: it.note ? String(it.note) : '過去伝票より自動復元',
              usageCount: 1,
              createdAt: doc.updatedAt || doc.issueDate || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              rescued: true
            };
            itemsToAdd.push(newItem);
            rescuedItems++;
          }
        });
      }
    });

    if (itemsToAdd.length > 0) {
      const mergedItems = [...itemsToAdd, ...currentItems];
      saveItemMasterList(mergedItems);
      console.log(`[マスタ救済復元] 過去の伝票履歴から ${itemsToAdd.length} 件の商品マスタを自動復元しました！`, itemsToAdd.map(i => i.name));
    }

    // 2. 取引先マスタの自動救済
    const currentClients = getClientMasterList(false);
    const existingClientNames = new Set(currentClients.map(c => (c.name || '').trim().toLowerCase()));
    const clientsToAdd = [];

    allDocs.forEach(doc => {
      const c = doc.client;
      if (c && c.name) {
        const name = c.name.trim();
        if (name && name !== '名称未設定' && !existingClientNames.has(name.toLowerCase())) {
          existingClientNames.add(name.toLowerCase());
          const newClient = {
            id: 'rescued_client_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            name: name,
            code: c.code || '',
            honorific: c.honorific || '御中',
            zip: c.zip || '',
            address: c.address || '',
            contactPerson: c.contactPerson || '',
            tel: c.tel || '',
            email: c.email || '',
            invoiceNumber: c.invoiceNumber || '',
            category: 'customer',
            closingDay: c.closingDay || '末日',
            paymentTerms: c.paymentTerms || '翌月末',
            note: '過去伝票より自動復元',
            usageCount: 1,
            createdAt: doc.updatedAt || doc.issueDate || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            rescued: true
          };
          clientsToAdd.push(newClient);
          rescuedClients++;
        }
      }
    });

    // 経費（支払先）からも取引先（vendor）を救済
    try {
      const expenses = getExpenseList();
      expenses.forEach(exp => {
        const payee = (exp.payee || '').trim();
        if (payee && !existingClientNames.has(payee.toLowerCase())) {
          existingClientNames.add(payee.toLowerCase());
          const newVendor = {
            id: 'rescued_vendor_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            name: payee,
            code: '',
            honorific: '御中',
            zip: '',
            address: '',
            contactPerson: '',
            tel: '',
            email: '',
            invoiceNumber: exp.invoiceNumber || '',
            category: 'vendor',
            closingDay: '都度',
            paymentTerms: '即時精算',
            note: '過去経費より自動復元',
            usageCount: 1,
            createdAt: exp.date || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            rescued: true
          };
          clientsToAdd.push(newVendor);
          rescuedClients++;
        }
      });
    } catch (e) {
      // 経費リスト取得エラー時はスキップ
    }

    if (clientsToAdd.length > 0) {
      const mergedClients = [...clientsToAdd, ...currentClients];
      saveClientMasterList(mergedClients);
      console.log(`[マスタ救済復元] 過去の履歴から ${clientsToAdd.length} 件の取引先マスタを自動復元しました！`, clientsToAdd.map(c => c.name));
    }

    // 3. 自社プロファイル・振込先情報の同期確認
    const currentProfile = loadIssuerProfile() || {};
    if (!currentProfile.bankInfo || currentProfile.bankInfo.trim() === '') {
      fetchServerIssuerProfile().then(srvProfile => {
        if (srvProfile && srvProfile.bankInfo && srvProfile.bankInfo.trim() !== '') {
          currentProfile.bankInfo = srvProfile.bankInfo;
          saveIssuerProfile(currentProfile);
          console.log('[自社プロファイル救済] 振込先情報をサーバーファイルから復元・同期しました');
        }
      }).catch(() => {});
    }

    // バックアップにあった商品（DP-MS スプレッダー, DP-AC アクセサリーキット）も安全に追加
    const backupSpecialItems = [
      { name: 'DP-MS　スプレッダー', unitPrice: 73025, userPrice: 98000, unit: '個' },
      { name: 'DP-AC　アクセサリーキット', unitPrice: 149031, userPrice: 200000, unit: 'セット' }
    ];
    backupSpecialItems.forEach(bItem => {
      if (!existingItemNames.has(bItem.name.toLowerCase())) {
        existingItemNames.add(bItem.name.toLowerCase());
        saveItemToMaster({
          name: bItem.name,
          unitPrice: bItem.unitPrice,
          userPrice: bItem.userPrice,
          unit: bItem.unit,
          taxRate: 10,
          note: 'バックアップより自動復元'
        });
        rescuedItems++;
      }
    });

  } catch (e) {
    console.error('Failed to rescue masters from history:', e);
  }

  return { rescuedItems, rescuedClients };
}

/**
 * サーバーファイル（data/items_master.json, data/clients_master.json）とローカルマスタを双方向同期
 */
async function syncMastersWithServer() {
  try {
    // 1. 商品マスタの同期
    const serverItems = await fetchServerMasterItems();
    if (serverItems && Array.isArray(serverItems)) {
      const localItems = getItemMasterList(false);
      const itemMap = new Map();

      // サーバーデータをベースにマッピング
      serverItems.forEach(i => {
        const key = (i.name || '').trim().toLowerCase();
        if (key) itemMap.set(key, i);
      });

      // ローカルデータをマージ（ローカルに新しく追加されたアイテムもサーバーに反映）
      localItems.forEach(i => {
        const key = (i.name || '').trim().toLowerCase();
        if (key) {
          if (!itemMap.has(key)) {
            itemMap.set(key, i);
          } else {
            // 両方にある場合、更新日時が新しい方を優先
            const existing = itemMap.get(key);
            const timeA = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
            const timeB = new Date(i.updatedAt || i.createdAt || 0).getTime();
            if (timeB > timeA) {
              itemMap.set(key, { ...existing, ...i });
            }
          }
        }
      });

      const mergedItems = Array.from(itemMap.values());
      // LocalStorageを更新
      localStorage.setItem(KEYS.ITEM_MASTER, JSON.stringify(mergedItems));
      // サーバーにも完全体として永続化
      await saveServerMasterItems(mergedItems);
      console.log(`[マスタ同期完了] 商品マスタ: 全 ${mergedItems.length} 件をサーバー・ローカルで完全同期しました`);
    } else {
      // サーバー上にまだファイルがない場合、ローカルの内容をサーバーへ書き込み
      const localItems = getItemMasterList(false);
      await saveServerMasterItems(localItems);
    }

    // 2. 取引先マスタの同期
    const serverClients = await fetchServerMasterClients();
    if (serverClients && Array.isArray(serverClients)) {
      const localClients = getClientMasterList(false);
      const clientMap = new Map();

      serverClients.forEach(c => {
        const key = (c.name || '').trim().toLowerCase();
        if (key) clientMap.set(key, c);
      });

      localClients.forEach(c => {
        const key = (c.name || '').trim().toLowerCase();
        if (key) {
          if (!clientMap.has(key)) {
            clientMap.set(key, c);
          } else {
            const existing = clientMap.get(key);
            const timeA = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
            const timeB = new Date(c.updatedAt || c.createdAt || 0).getTime();
            if (timeB > timeA) {
              clientMap.set(key, { ...existing, ...c });
            }
          }
        }
      });

      // タイムズの重複統合（経費との1対1対応を完全に維持）
      const mergedList = Array.from(clientMap.values());
      const hasDetailedTimes = mergedList.some(c => c.name && c.name.includes('高崎郵便局駐車場'));
      const finalClients = hasDetailedTimes 
        ? mergedList.filter(c => !(c.name === 'タイムズ２４株式会社' || c.id === 'client_mst_5'))
        : mergedList;

      localStorage.setItem(KEYS.CLIENT_MASTER, JSON.stringify(finalClients));
      await saveServerMasterClients(finalClients);
      console.log(`[マスタ同期完了] 取引先マスタ: 全 ${finalClients.length} 件をサーバー・ローカルで完全同期しました`);
    } else {
      const localClients = getClientMasterList(false);
      await saveServerMasterClients(localClients);
    }

    // 3. 自社プロファイル（振込先情報）の同期
    try {
      const serverIssuer = await fetchServerIssuerProfile();
      const localIssuer = loadIssuerProfile() || {};
      
      let finalBankInfo = '';
      if (serverIssuer && serverIssuer.bankInfo && serverIssuer.bankInfo.trim() !== '') {
        finalBankInfo = serverIssuer.bankInfo;
      } else if (localIssuer && localIssuer.bankInfo && localIssuer.bankInfo.trim() !== '') {
        finalBankInfo = localIssuer.bankInfo;
      }

      const defaultTemplateIssuer = {
        name: '株式会社アルバワークス',
        invoiceNumber: 'T2070001004966',
        zip: '379-2144',
        address: '群馬県前橋市下川町63-7',
        tel: '027-289-0367',
        fax: '027-289-0368',
        email: '',
        stampDataUrl: '',
        showStamp: true,
        bankInfo: '高崎信用金庫\n前橋南支店\n普通　012 2182393\nカ)　アルバワークス'
      };

      const mergedIssuer = {
        ...defaultTemplateIssuer,
        ...localIssuer,
        ...(serverIssuer || {})
      };
      if (finalBankInfo) {
        mergedIssuer.bankInfo = finalBankInfo;
      }

      localStorage.setItem(KEYS.ISSUER_PROFILE, JSON.stringify(mergedIssuer));
      await saveServerIssuerProfile(mergedIssuer);
      console.log(`[マスタ同期完了] 自社プロファイル（振込先情報含む）をサーバー・ローカルで完全同期しました`);
    } catch (issuerErr) {
      console.warn('Sync issuer profile error:', issuerErr);
    }

    // 4. 勤怠打刻データ（data/attendance/attendance.json）の1対1整合性同期
    try {
      const serverAttendance = await fetchServerAttendance();
      if (serverAttendance && Array.isArray(serverAttendance)) {
        // サーバーファイルを真実のマスター（Source of Truth）として1対1同期
        // サーバー上で削除されたレコードはローカルからも消去され、不整合や古いデータの復活を完全防止
        serverAttendance.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(serverAttendance));
        console.log(`[勤怠同期完了] 勤怠データ: 全 ${serverAttendance.length} 件をサーバー・ローカル間で1対1完全同期しました`);
      } else {
        const localAttendance = getAttendanceList();
        if (localAttendance.length > 0) {
          await saveServerAttendance(localAttendance);
        }
      }
    } catch (attErr) {
      console.warn('Sync attendance error:', attErr);
    }

    // 5. 勤怠社員情報（data/attendance_employee.json）の双方向同期
    try {
      const serverEmp = await fetchServerAttendanceEmployee();
      const localEmp = getAttendanceEmployee();

      let finalEmp = { empNo: '1111', empName: '宮崎真輔' };
      if (serverEmp && serverEmp.empName && serverEmp.empName !== '山田 一郎') {
        finalEmp = { ...serverEmp };
      } else if (localEmp && localEmp.empName && localEmp.empName !== '山田 一郎') {
        finalEmp = { ...localEmp };
      }

      localStorage.setItem(KEYS.ATTENDANCE_EMPLOYEE, JSON.stringify(finalEmp));
      await saveServerAttendanceEmployee(finalEmp);
      console.log(`[勤怠同期完了] 勤怠社員情報（氏名: ${finalEmp.empName}）をサーバー・ローカルで同期しました`);
    } catch (empErr) {
      console.warn('Sync attendance employee error:', empErr);
    }

    return true;
  } catch (e) {
    console.warn('Sync masters with server failed (offline mode):', e);
    return false;
  }
}

/**
 * 伝票データから商品マスタ・取引先マスタへ自動蓄積（作成するほどマスタが自動成長）
 */
function autoRegisterMastersFromDoc(doc) {
  if (!doc) return;
  try {
    // 取引先の自動マスタ登録
    if (doc.client && doc.client.name && doc.client.name.trim() && doc.client.name.trim() !== '名称未設定') {
      saveClientToMaster({
        name: doc.client.name.trim(),
        code: doc.client.code || '',
        honorific: doc.client.honorific || '御中',
        zip: doc.client.zip || '',
        address: doc.client.address || '',
        contactPerson: doc.client.contactPerson || '',
        tel: doc.client.tel || '',
        email: doc.client.email || '',
        invoiceNumber: doc.client.invoiceNumber || '',
        category: 'customer'
      });
    }

    // 商品明細の自動マスタ登録
    if (Array.isArray(doc.items)) {
      doc.items.forEach(it => {
        const name = (it.name || '').trim();
        if (name) {
          saveItemToMaster({
            name: name,
            unitPrice: Number(it.unitPrice) || 0,
            userPrice: Number(it.userPrice !== undefined ? it.userPrice : it.unitPrice) || 0,
            unit: it.unit || '式',
            taxRate: it.taxRate !== undefined ? Number(it.taxRate) : 10,
            note: it.note || ''
          });
        }
      });
    }
  } catch (e) {
    console.error('Failed to auto register masters from doc:', e);
  }
}

/**
 * アプリ起動時のマスタ永続化＆自動復元統合初期化
 */
async function initMastersPersistence() {
  // 1. 過去伝票からの救済マイグレーションを即時実行
  const rescueResult = rescueMastersFromHistory();
  // 2. サーバー（PCディスク）との双方向同期を安全に実行
  await syncMastersWithServer();
  return rescueResult;
}

/**
 * 取引先マスタに取引先を追加（または上書き）
 */
function saveClientToMaster(client) {
  try {
    const list = getClientMasterList(false);
    const id = client.id || ('client_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6));
    const cleanName = (client.name || '').trim();
    if (!cleanName) return null;

    const existingIndex = list.findIndex(c => c.id === id || (c.name && c.name.trim() === cleanName));
    const now = new Date().toISOString();

    const clientRecord = {
      id: existingIndex >= 0 ? list[existingIndex].id : id,
      name: cleanName,
      code: client.code ? String(client.code).trim() : (existingIndex >= 0 ? list[existingIndex].code : ''),
      honorific: client.honorific !== undefined ? client.honorific : '御中',
      zip: client.zip ? String(client.zip).trim() : '',
      address: client.address ? String(client.address).trim() : '',
      contactPerson: client.contactPerson ? String(client.contactPerson).trim() : '',
      tel: client.tel ? String(client.tel).trim() : '',
      email: client.email ? String(client.email).trim() : '',
      invoiceNumber: client.invoiceNumber ? String(client.invoiceNumber).trim().toUpperCase() : '',
      category: client.category || 'customer', // 'customer' | 'vendor' | 'both'
      closingDay: client.closingDay ? String(client.closingDay).trim() : '末日',
      paymentTerms: client.paymentTerms ? String(client.paymentTerms).trim() : '翌月末',
      note: client.note ? String(client.note).trim() : '',
      usageCount: existingIndex >= 0 ? (Number(list[existingIndex].usageCount) || 0) : 0,
      createdAt: existingIndex >= 0 ? (list[existingIndex].createdAt || now) : now,
      updatedAt: now
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...clientRecord };
    } else {
      list.unshift(clientRecord);
    }

    saveClientMasterList(list);
    return clientRecord;
  } catch (e) {
    console.error('Failed to save client to master:', e);
    return null;
  }
}

/**
 * 取引先マスタから取引先を削除
 */
function deleteClientFromMaster(id) {
  try {
    const list = getClientMasterList(false).filter(c => c.id !== id);
    saveClientMasterList(list);
    return true;
  } catch (e) {
    console.error('Failed to delete client from master:', e);
    return false;
  }
}

/**
 * 取引先マスタの使用実績を記録
 */
function recordClientMasterUsage(clientId, clientName) {
  try {
    const list = getClientMasterList(false);
    const target = list.find(c => (clientId && c.id === clientId) || (clientName && (c.name || '').trim() === clientName.trim()));
    if (target) {
      target.usageCount = (Number(target.usageCount) || 0) + 1;
      target.lastUsedAt = new Date().toISOString();
      saveClientMasterList(list);
    }
  } catch (e) {
    console.error('Failed to record client master usage:', e);
  }
}

/**
 * 名前で取引先マスタを検索（完全一致または部分一致）
 */
function findClientByName(name) {
  if (!name) return null;
  const list = getClientMasterList(false);
  const clean = name.trim().toLowerCase();
  return list.find(c => (c.name || '').trim().toLowerCase() === clean) ||
         list.find(c => (c.name || '').toLowerCase().includes(clean)) || null;
}


/**
 * 品名ごとのユーザー価格履歴マップを取得
 */
function getUserPriceHistoryMap() {
  try {
    const raw = localStorage.getItem(KEYS.USER_PRICE_HISTORY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to get user price history map:', e);
    return {};
  }
}

/**
 * ユーザー価格の使用実績を記録
 */
function recordUserPrice(itemName, price) {
  if (!itemName || !price || Number(price) <= 0) return;
  const cleanName = itemName.trim();
  const numPrice = Number(price);
  try {
    const map = getUserPriceHistoryMap();
    if (!map[cleanName]) {
      map[cleanName] = [];
    }
    const existing = map[cleanName].find(p => p.price === numPrice);
    if (existing) {
      existing.count = (existing.count || 1) + 1;
      existing.lastUsed = new Date().toISOString();
    } else {
      map[cleanName].push({
        price: numPrice,
        count: 1,
        lastUsed: new Date().toISOString()
      });
    }
    map[cleanName].sort((a, b) => b.count - a.count);
    if (map[cleanName].length > 20) {
      map[cleanName].length = 20;
    }
    localStorage.setItem(KEYS.USER_PRICE_HISTORY, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to record user price:', e);
  }
}

/**
 * 特定の品名における過去のユーザー価格履歴を頻度の多い順で取得
 * 過去の書類履歴（getHistoryList）や商品マスタからも集約して統合！
 * @param {string} itemName 品名
 * @returns {Array<{price: number, count: number, label: string}>} 頻度の多い順
 */
function getUserPriceHistoryForItem(itemName = '') {
  const cleanName = (itemName || '').trim().toLowerCase();
  const priceCountMap = new Map(); // price => count

  // 1. 専用履歴マップから取得
  const map = getUserPriceHistoryMap();
  for (const [name, list] of Object.entries(map)) {
    const n = name.trim().toLowerCase();
    const isMatch = !cleanName || n === cleanName || n.includes(cleanName) || cleanName.includes(n);
    if (isMatch && Array.isArray(list)) {
      list.forEach(item => {
        const p = Number(item.price);
        if (p > 0) {
          priceCountMap.set(p, (priceCountMap.get(p) || 0) + (item.count || 1));
        }
      });
    }
  }

  // 2. 過去の書類履歴（getHistoryList）から集約
  const docHistory = getHistoryList();
  docHistory.forEach(docSummary => {
    const doc = docSummary.fullDoc;
    if (doc && Array.isArray(doc.items)) {
      doc.items.forEach(it => {
        const itName = (it.name || '').trim().toLowerCase();
        const isMatch = !cleanName || itName === cleanName || itName.includes(cleanName) || cleanName.includes(itName);
        if (isMatch) {
          const up = Number(it.userPrice);
          if (up > 0) {
            priceCountMap.set(up, (priceCountMap.get(up) || 0) + 1);
          }
        }
      });
    }
  });

  // 3. 商品マスタからも集約
  const masterList = getItemMasterList(false);
  masterList.forEach(m => {
    const mName = (m.name || '').trim().toLowerCase();
    const isMatch = !cleanName || mName === cleanName || mName.includes(cleanName) || cleanName.includes(mName);
    if (isMatch) {
      const up = Number(m.userPrice);
      if (up > 0) {
        priceCountMap.set(up, (priceCountMap.get(up) || 0) + 1);
      }
    }
  });

  // 配列に変換して頻度の多い順（count desc）でソート
  const results = [];
  for (const [price, count] of priceCountMap.entries()) {
    results.push({
      price,
      count,
      label: `¥${price.toLocaleString('ja-JP')} (${count}回)`
    });
  }

  results.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.price - a.price; // 頻度が同一なら価格降順
  });

  return results;
}

/**
 * 割引き名目一覧を使用頻度順（降順）で取得
 */
function getDiscountReasons() {
  try {
    const raw = localStorage.getItem(KEYS.DISCOUNT_REASONS);
    if (!raw) {
      saveDiscountReasons(DEFAULT_DISCOUNT_REASONS);
      return [...DEFAULT_DISCOUNT_REASONS];
    }
    const list = JSON.parse(raw);
    return list.sort((a, b) => (b.count || 0) - (a.count || 0));
  } catch (e) {
    console.error('Failed to get discount reasons:', e);
    return [...DEFAULT_DISCOUNT_REASONS];
  }
}

/**
 * 割引き名目一覧を保存
 */
function saveDiscountReasons(list) {
  try {
    localStorage.setItem(KEYS.DISCOUNT_REASONS, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error('Failed to save discount reasons:', e);
    return false;
  }
}

/**
 * 割引き名目の使用を記録（使用頻度カウント+1、頻度順自動並び替え）
 */
function recordDiscountReason(name) {
  if (!name || !name.trim()) return;
  const trimmed = name.trim();
  try {
    const list = getDiscountReasons();
    const existing = list.find(item => item.name === trimmed);
    if (existing) {
      existing.count = (existing.count || 0) + 1;
      existing.lastUsedAt = new Date().toISOString();
    } else {
      list.push({
        name: trimmed,
        count: 1,
        lastUsedAt: new Date().toISOString()
      });
    }
    list.sort((a, b) => (b.count || 0) - (a.count || 0));
    saveDiscountReasons(list);
  } catch (e) {
    console.error('Failed to record discount reason:', e);
  }
}

/**
 * 全データをJSON形式でダウンロード（バックアップ）
 */
/**
 * 請求書の入金ステータスを更新（入金消込）
 * @param {string} docId 書類ID
 * @param {'unpaid'|'paid'} status 入金ステータス
 * @param {string} paidDate 入金日 (YYYY-MM-DD)
 * @param {string} note 入金メモ
 */
function updateDocPaymentStatus(docId, status = 'paid', paidDate = '', note = '') {
  try {
    const list = getHistoryList();
    const item = list.find(d => d.id === docId);
    if (!item) return false;

    const isPaidBool = (status === 'paid' || status === true);
    const resolvedStatus = isPaidBool ? 'paid' : 'unpaid';
    const resolvedPaidDate = paidDate || (isPaidBool ? new Date().toISOString().split('T')[0] : '');

    item.isPaid = isPaidBool;
    item.paymentStatus = resolvedStatus;
    item.paidDate = resolvedPaidDate;
    item.updatedAt = new Date().toISOString();

    if (item.fullDoc) {
      item.fullDoc.isPaid = isPaidBool;
      item.fullDoc.paymentStatus = resolvedStatus;
      item.fullDoc.paidDate = resolvedPaidDate;
      if (note) item.fullDoc.paymentNote = note;
    }

    localStorage.setItem(KEYS.HISTORY, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error('Failed to update payment status:', e);
    return false;
  }
}

/**
 * 書類の確定発行を取り消し（未確定・下書き状態に戻す）
 * @param {string} docId 書類ID
 * @returns {boolean} 成功可否
 */
function cancelDocIssue(docId) {
  try {
    const list = getHistoryList();
    const item = list.find(d => d.id === docId);
    if (!item) return false;

    item.isIssued = false;
    item.issuedAt = null;
    item.isCancelled = true;
    item.updatedAt = new Date().toISOString();

    if (item.fullDoc) {
      item.fullDoc.isIssued = false;
      item.fullDoc.issuedAt = null;
      item.fullDoc.isCancelled = true;
      item.fullDoc.updatedAt = item.updatedAt;
    }

    localStorage.setItem(KEYS.HISTORY, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error('Failed to cancel doc issue:', e);
    return false;
  }
}

// ==========================================================================
// 経費・仕入データ管理
// ==========================================================================

/**
 * 経費・仕入一覧を取得
 */
function getExpenseList() {
  try {
    const raw = localStorage.getItem(KEYS.EXPENSES);
    if (!raw) return [];
    const list = JSON.parse(raw);
    let modified = false;
    list.forEach(e => {
      // receiptImage と receiptDataUrl の相互補完
      if (!e.receiptImage && e.receiptDataUrl) {
        e.receiptImage = e.receiptDataUrl;
      } else if (!e.receiptDataUrl && e.receiptImage) {
        e.receiptDataUrl = e.receiptImage;
      }

    });
    if (modified) {
      localStorage.setItem(KEYS.EXPENSES, JSON.stringify(list));
    }
    return list;
  } catch (e) {
    console.error('Failed to get expense list:', e);
    return [];
  }
}

/**
 * 経費・仕入データを保存（新規追加または更新）
 * @param {object} expense { id, date, category, amount, taxRate, payee, invoiceNumber, note, receiptImage, receiptDataUrl, isCost }
 */
function saveExpense(expense) {
  try {
    const list = getExpenseList();
    const id = expense.id || ('exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6));
    const receiptImg = expense.receiptImage || expense.receiptDataUrl || '';
    const newExp = {
      id,
      date: expense.date || new Date().toISOString().split('T')[0],
      category: expense.category || '雑費',
      amount: Number(expense.amount) || 0,
      taxRate: expense.taxRate !== undefined ? Number(expense.taxRate) : 10,
      payee: expense.payee || '',
      invoiceNumber: expense.invoiceNumber ? String(expense.invoiceNumber).trim().toUpperCase() : '',
      note: expense.note || '',
      receiptImage: receiptImg,
      receiptDataUrl: receiptImg,
      isCost: !!expense.isCost,
      paymentMethod: expense.paymentMethod || '普通預金',
      updatedAt: new Date().toISOString()
    };

    const existingIndex = list.findIndex(e => e.id === id);
    if (existingIndex >= 0) {
      list[existingIndex] = newExp;
    } else {
      list.unshift(newExp);
    }

    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(list));
    return newExp;
  } catch (e) {
    console.error('Failed to save expense:', e);
    return null;
  }
}

/**
 * 経費・仕入データを削除
 */
function deleteExpense(id) {
  try {
    const list = getExpenseList().filter(e => e.id !== id);
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error('Failed to delete expense:', e);
    return false;
  }
}

// ==========================================================================
// 勤怠・タイムカード管理（休憩1時間自動控除）
// ==========================================================================

/**
 * 勤怠打刻一覧を取得
 */
function getAttendanceList() {
  try {
    const raw = localStorage.getItem(KEYS.ATTENDANCE);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to get attendance list:', e);
    return [];
  }
}

/**
 * ローカル基準の日付文字列 (YYYY-MM-DD) を取得
 */
function getLocalDateStr(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 勤怠データを保存
 */
function saveAttendance(attendance) {
  try {
    const list = getAttendanceList();
    const id = attendance.id || ('att_' + attendance.date);
    const existingIndex = list.findIndex(a => a.id === id || a.date === attendance.date);
    const existing = existingIndex >= 0 ? list[existingIndex] : null;

    const record = {
      id: (existing && existing.id) ? existing.id : id,
      date: attendance.date,
      clockIn: (attendance.clockIn !== undefined && attendance.clockIn !== null)
        ? attendance.clockIn
        : (existing ? (existing.clockIn || '') : ''),
      clockOut: (attendance.clockOut !== undefined && attendance.clockOut !== null)
        ? attendance.clockOut
        : (existing ? (existing.clockOut || '') : ''),
      note: (attendance.note !== undefined && attendance.note !== null)
        ? attendance.note
        : (existing ? (existing.note || '') : ''),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      list[existingIndex] = record;
    } else {
      list.unshift(record);
    }

    list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(list));
    // サーバー（data/attendance.json）へ即座に非同期保存
    saveServerAttendance(list).catch(() => {});
    return record;
  } catch (e) {
    console.error('Failed to save attendance:', e);
    return null;
  }
}

/**
 * 本日の勤怠打刻を取得
 */
function getTodayAttendance() {
  const today = getLocalDateStr();
  const list = getAttendanceList();
  return list.find(a => a.date === today) || null;
}

/**
 * 本日の出勤打刻
 */
function clockInToday(timeStr = '', note = '') {
  const today = getLocalDateStr();
  const curTime = timeStr || new Date().toTimeString().substring(0, 5);
  const existing = getTodayAttendance();
  const data = {
    date: today,
    clockIn: curTime
  };
  if (existing && existing.clockOut) {
    data.clockOut = existing.clockOut;
  }
  if (note) {
    data.note = note;
  } else if (existing && existing.note) {
    data.note = existing.note;
  }
  return saveAttendance(data);
}

/**
 * 本日の退勤打刻
 */
function clockOutToday(timeStr = '', note = '') {
  const today = getLocalDateStr();
  const curTime = timeStr || new Date().toTimeString().substring(0, 5);
  const existing = getTodayAttendance();
  const data = {
    date: today,
    clockOut: curTime
  };
  if (existing && existing.clockIn) {
    data.clockIn = existing.clockIn;
  }
  if (note) {
    data.note = note;
  } else if (existing && existing.note) {
    data.note = existing.note;
  }
  return saveAttendance(data);
}

/**
 * 勤怠記録を削除（IDまたは日付文字列のどちらが渡されても確実に削除し、サーバーファイルも即時削除・同期）
 */
function deleteAttendance(idOrDate) {
  try {
    const list = getAttendanceList().filter(a => a.id !== idOrDate && a.date !== idOrDate);
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(list));
    // サーバー（data/attendance/attendance.json）側からも即時削除して1対1整合性を維持
    deleteServerAttendanceRecord(idOrDate, idOrDate).catch(() => {});
    saveServerAttendance(list).catch(() => {});
    return true;
  } catch (e) {
    console.error('Failed to delete attendance:', e);
    return false;
  }
}

/**
 * 出勤簿用 社員情報（社員番号・氏名）を取得（デフォルト: 宮崎真輔）
 */
function getAttendanceEmployee() {
  try {
    const raw = localStorage.getItem(KEYS.ATTENDANCE_EMPLOYEE);
    let data = raw ? JSON.parse(raw) : null;
    if (!data) {
      data = { empNo: '1111', empName: '宮崎真輔' };
      localStorage.setItem(KEYS.ATTENDANCE_EMPLOYEE, JSON.stringify(data));
      return data;
    }
    // 旧デフォルト「山田 一郎」または未設定の場合は「宮崎真輔」に自動更新
    if (!data.empName || data.empName === '山田 一郎') {
      data.empName = '宮崎真輔';
      localStorage.setItem(KEYS.ATTENDANCE_EMPLOYEE, JSON.stringify(data));
    }
    return data;
  } catch (e) {
    return { empNo: '1111', empName: '宮崎真輔' };
  }
}

/**
 * 出勤簿用 社員情報（社員番号・氏名）を保存
 */
function saveAttendanceEmployee(info) {
  try {
    const current = getAttendanceEmployee();
    const updated = {
      empNo: info.empNo !== undefined ? String(info.empNo).trim() : current.empNo,
      empName: info.empName !== undefined ? String(info.empName).trim() : current.empName
    };
    localStorage.setItem(KEYS.ATTENDANCE_EMPLOYEE, JSON.stringify(updated));
    // サーバー（data/attendance_employee.json）へ即座に非同期保存
    saveServerAttendanceEmployee(updated).catch(() => {});
    return updated;
  } catch (e) {
    console.error('Failed to save attendance employee:', e);
    return null;
  }
}

// ==========================================================================
// バックアップ（エクスポート / インポート）
// ==========================================================================

/**
 * 全データをJSON形式でダウンロード（バックアップ）
 */
function exportDataAsJSON() {
  const backupData = {
    version: '2.0',
    exportDate: new Date().toISOString(),
    activeDoc: loadActiveDoc(),
    issuerProfile: loadIssuerProfile(),
    history: getHistoryList(),
    itemMaster: getItemMasterList(false),
    clientMaster: getClientMasterList(false),
    discountReasons: getDiscountReasons(),
    userPriceHistory: getUserPriceHistoryMap(),
    expenses: getExpenseList(),
    attendance: getAttendanceList(),
    inventory: getInventoryList(),
    purchaseMappings: getPurchaseMappings()
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `BillCraft_ERP_Backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * JSONファイルからデータを復元
 */
function importDataFromJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') {
      throw new Error('不正なJSONフォーマットです');
    }

    if (data.issuerProfile) {
      localStorage.setItem(KEYS.ISSUER_PROFILE, JSON.stringify(data.issuerProfile));
    }
    if (data.history && Array.isArray(data.history)) {
      localStorage.setItem(KEYS.HISTORY, JSON.stringify(data.history));
    }
    if (data.activeDoc) {
      localStorage.setItem(KEYS.ACTIVE_DOC, JSON.stringify(data.activeDoc));
    }
    if (data.itemMaster && Array.isArray(data.itemMaster)) {
      localStorage.setItem(KEYS.ITEM_MASTER, JSON.stringify(data.itemMaster));
    }
    if (data.clientMaster && Array.isArray(data.clientMaster)) {
      localStorage.setItem(KEYS.CLIENT_MASTER, JSON.stringify(data.clientMaster));
    }
    if (data.discountReasons && Array.isArray(data.discountReasons)) {
      localStorage.setItem(KEYS.DISCOUNT_REASONS, JSON.stringify(data.discountReasons));
    }
    if (data.userPriceHistory && typeof data.userPriceHistory === 'object') {
      localStorage.setItem(KEYS.USER_PRICE_HISTORY, JSON.stringify(data.userPriceHistory));
    }
    if (data.expenses && Array.isArray(data.expenses)) {
      localStorage.setItem(KEYS.EXPENSES, JSON.stringify(data.expenses));
    }
    if (data.attendance && Array.isArray(data.attendance)) {
      localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(data.attendance));
    }
    if (data.inventory && Array.isArray(data.inventory)) {
      localStorage.setItem(KEYS.INVENTORY, JSON.stringify(data.inventory));
      saveServerInventory(data.inventory).catch(() => {});
    }
    if (data.purchaseMappings && typeof data.purchaseMappings === 'object') {
      localStorage.setItem(KEYS.PURCHASE_MAPPINGS, JSON.stringify(data.purchaseMappings));
      saveServerPurchaseMappings(data.purchaseMappings).catch(() => {});
    }
    return { success: true, activeDoc: data.activeDoc || null };
  } catch (e) {
    console.error('JSON Import error:', e);
    return { success: false, error: e.message };
  }
}

// ==========================================================================
// 在庫マスタ ＆ 仕入マッピング 管理
// ==========================================================================

/**
 * サーバーから在庫マスタを取得
 */
async function fetchServerInventory() {
  try {
    const res = await fetch('/api/inventory');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        localStorage.setItem(KEYS.INVENTORY, JSON.stringify(data));
        return data;
      }
    }
  } catch (e) {
    console.warn('サーバーからの在庫マスタ取得スキップ:', e);
  }
  return null;
}

/**
 * サーバーへ在庫マスタを保存
 */
async function saveServerInventory(inventoryList) {
  try {
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inventoryList)
    });
  } catch (e) {
    console.warn('サーバーへの在庫マスタ保存失敗:', e);
  }
}

/**
 * サーバーから仕入マッピング辞書を取得
 */
async function fetchServerPurchaseMappings() {
  try {
    const res = await fetch('/api/purchase-mappings');
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        localStorage.setItem(KEYS.PURCHASE_MAPPINGS, JSON.stringify(data));
        return data;
      }
    }
  } catch (e) {
    console.warn('サーバーからの仕入マッピング取得スキップ:', e);
  }
  return null;
}

/**
 * サーバーへ仕入マッピング辞書を保存
 */
async function saveServerPurchaseMappings(mappings) {
  try {
    await fetch('/api/purchase-mappings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mappings)
    });
  } catch (e) {
    console.warn('サーバーへの仕入マッピング保存失敗:', e);
  }
}

/**
 * 起動時にサーバーと在庫データを同期
 */
async function initInventoryFromServer() {
  await Promise.all([
    fetchServerInventory(),
    fetchServerPurchaseMappings()
  ]);
}

/**
 * 在庫マスタ一覧を取得（商品マスタと自動連携・同期）
 */
function getInventoryList() {
  try {
    let list = [];
    const raw = localStorage.getItem(KEYS.INVENTORY);
    if (!raw) {
      list = [...DEFAULT_INVENTORY];
    } else {
      const parsed = JSON.parse(raw);
      list = Array.isArray(parsed) ? parsed : [...DEFAULT_INVENTORY];
    }

    // 商品マスタ（itemMaster）の商品がすべて在庫リストに含まれるよう自動同期
    let itemMaster = [];
    try {
      const rawItems = localStorage.getItem(KEYS.ITEM_MASTER);
      itemMaster = rawItems ? JSON.parse(rawItems) : [];
    } catch (e) {}

    let modified = false;
    itemMaster.forEach(prod => {
      // itemId または name でマッチング
      const existing = list.find(inv => inv.itemId === prod.id || (inv.name && inv.name.trim() === prod.name.trim()));
      if (existing) {
        if (!existing.itemId) {
          existing.itemId = prod.id;
          modified = true;
        }
        if (!existing.unitPrice && prod.unitPrice) {
          existing.unitPrice = prod.unitPrice;
          modified = true;
        }
      } else {
        // 商品マスタにあるが在庫リストにない商品を自動追加（初期在庫0）
        list.push({
          id: `inv_${prod.id}`,
          itemId: prod.id,
          name: prod.name,
          sku: prod.sku || '',
          currentStock: 0,
          safetyStock: 5,
          unit: prod.unit || '個',
          unitCost: prod.unitPrice ? Math.round(prod.unitPrice * 0.6) : 0,
          unitPrice: prod.unitPrice || 0,
          location: '本社倉庫',
          lastInDate: '',
          note: prod.note || '',
          history: [{
            id: `log_init_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            date: new Date().toISOString().split('T')[0],
            type: 'in',
            qty: 0,
            reason: '商品マスタ連携により初期登録',
            currentStock: 0,
            timestamp: new Date().toISOString()
          }]
        });
        modified = true;
      }
    });

    if (modified) {
      localStorage.setItem(KEYS.INVENTORY, JSON.stringify(list));
      saveServerInventory(list).catch(() => {});
    }

    return list;
  } catch (e) {
    return DEFAULT_INVENTORY;
  }
}

/**
 * 新規品目を商品マスタと在庫マスタの両方に一括自動登録
 * @param {object} data - { name, sku, unit, unitCost, unitPrice, initialStock, safetyStock, note }
 * @returns {{ product: object, inventory: object }}
 */
function saveNewProductAndInventory(data) {
  const name = (data.name || '').trim();
  if (!name) return null;

  // 1. 商品マスタ（itemMaster）へ保存
  const product = saveItemToMaster({
    name: name,
    sku: data.sku || '',
    unitPrice: Number(data.unitCost) > 0 ? Number(data.unitCost) : (Number(data.unitPrice) || 0),
    userPrice: Number(data.unitPrice) > 0 ? Number(data.unitPrice) : Math.round(Number(data.unitCost || 0) * 1.3),
    unit: data.unit || '個',
    taxRate: Number(data.taxRate) || 10,
    note: data.note || '仕入画面から新規登録'
  });

  // 2. 在庫マスタ（inventory）へ保存（初期在庫数を反映）
  const initialStock = Number(data.initialStock) >= 0 ? Number(data.initialStock) : 0;
  const inventory = saveInventoryItem({
    id: `inv_${product.id}`,
    itemId: product.id,
    name: product.name,
    sku: product.sku || data.sku || '',
    currentStock: initialStock,
    safetyStock: Number(data.safetyStock) >= 0 ? Number(data.safetyStock) : 5,
    unit: product.unit || '個',
    unitCost: Number(data.unitCost) || 0,
    unitPrice: Number(data.unitPrice) || product.unitPrice || 0,
    location: data.location || '本社倉庫',
    note: product.note || '',
    history: initialStock > 0 ? [{
      id: `log_init_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'in',
      qty: initialStock,
      reason: '新規品目登録時入庫',
      currentStock: initialStock,
      timestamp: new Date().toISOString()
    }] : []
  });

  return { product, inventory };
}

/**
 * 在庫品目を保存（追加または更新）
 */
function saveInventoryItem(item) {
  try {
    const list = getInventoryList();
    const id = item.id || `inv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const nowStr = new Date().toISOString().split('T')[0];
    
    const existingIndex = list.findIndex(i => i.id === id || (item.itemId && i.itemId === item.itemId));
    const updatedItem = {
      id,
      itemId: item.itemId || (existingIndex >= 0 ? list[existingIndex].itemId : ''),
      name: (item.name || '').trim(),
      sku: (item.sku || '').trim(),
      currentStock: Number(item.currentStock) || 0,
      safetyStock: Number(item.safetyStock) >= 0 ? Number(item.safetyStock) : 0,
      unit: (item.unit || '個').trim(),
      unitCost: Number(item.unitCost) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      location: (item.location || '').trim(),
      lastInDate: item.lastInDate || (existingIndex >= 0 ? list[existingIndex].lastInDate : nowStr),
      note: (item.note || '').trim(),
      history: Array.isArray(item.history) ? item.history : (existingIndex >= 0 ? (list[existingIndex].history || []) : [])
    };

    if (existingIndex >= 0) {
      list[existingIndex] = updatedItem;
    } else {
      if (!updatedItem.history.length) {
        updatedItem.history.push({
          id: `log_${Date.now()}`,
          date: nowStr,
          type: 'in',
          qty: updatedItem.currentStock,
          reason: '初期登録',
          currentStock: updatedItem.currentStock,
          timestamp: new Date().toISOString()
        });
      }
      list.push(updatedItem);
    }

    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(list));
    saveServerInventory(list).catch(() => {});
    return updatedItem;
  } catch (e) {
    console.error('Failed to save inventory item:', e);
    return null;
  }
}

/**
 * 在庫品目を削除
 */
function deleteInventoryItem(id) {
  try {
    const list = getInventoryList();
    const filtered = list.filter(i => i.id !== id);
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(filtered));
    saveServerInventory(filtered).catch(() => {});
    return true;
  } catch (e) {
    console.error('Failed to delete inventory item:', e);
    return false;
  }
}

/**
 * 在庫の数量調整・入出庫を記録
 * @param {string} id - 在庫品目ID
 * @param {number} deltaQty - 変動数量（入庫は正、出庫は負。isDirectSetなら設定後の在庫数）
 * @param {string} reason - 理由（仕入入庫、納品出庫、棚卸調整など）
 * @param {object} [metadata] - 伝票ID、取引先、単価などの付加情報
 * @param {boolean} [isDirectSet] - trueの場合、deltaQtyを新しい在庫実数として直接設定
 */
function adjustStock(id, deltaQty, reason = '', metadata = {}, isDirectSet = false) {
  try {
    const list = getInventoryList();
    const item = list.find(i => i.id === id || i.itemId === id || (i.name && i.name.trim() === String(id).trim()));
    if (!item) {
      console.warn(`在庫品目が見つかりません: ${id}`);
      return null;
    }

    const prevStock = Number(item.currentStock) || 0;
    let newStock = prevStock;
    let actualDelta = Number(deltaQty) || 0;

    if (isDirectSet) {
      newStock = Math.max(0, actualDelta);
      actualDelta = newStock - prevStock;
    } else {
      newStock = Math.max(0, prevStock + actualDelta);
    }

    const nowStr = new Date().toISOString().split('T')[0];
    const logType = actualDelta >= 0 ? 'in' : 'out';

    if (!Array.isArray(item.history)) {
      item.history = [];
    }

    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      date: metadata.date || nowStr,
      type: isDirectSet ? 'adjust' : logType,
      qty: Math.abs(actualDelta),
      delta: actualDelta,
      reason: reason || (actualDelta >= 0 ? '入庫' : '出庫'),
      currentStock: newStock,
      sourceRef: metadata.sourceRef || '',
      payee: metadata.payee || '',
      unitCost: metadata.unitCost !== undefined ? Number(metadata.unitCost) : item.unitCost,
      timestamp: new Date().toISOString()
    };

    item.history.unshift(logEntry); // 最新順
    item.currentStock = newStock;
    if (actualDelta > 0) {
      item.lastInDate = metadata.date || nowStr;
      if (metadata.unitCost && Number(metadata.unitCost) > 0) {
        item.unitCost = Number(metadata.unitCost);
      }
    }

    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(list));
    saveServerInventory(list).catch(() => {});
    return { item, logEntry };
  } catch (e) {
    console.error('Failed to adjust stock:', e);
    return null;
  }
}

/**
 * 商品マスタ（ItemMaster）から未登録の商品を在庫マスタにインポート
 */
function syncInventoryWithItemsMaster() {
  const invList = getInventoryList();
  const rawItemMaster = localStorage.getItem(KEYS.ITEM_MASTER);
  let itemMaster = [];
  try {
    itemMaster = rawItemMaster ? JSON.parse(rawItemMaster) : [];
  } catch (e) {}

  let addedCount = 0;
  itemMaster.forEach(item => {
    // 既存の在庫品目に同名または同itemIdがあるかチェック
    const exists = invList.some(inv => inv.itemId === item.id || inv.name === item.name);
    if (!exists) {
      invList.push({
        id: `inv_sync_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        itemId: item.id,
        name: item.name,
        sku: item.sku || `SKU-${item.id.replace('item_mst_', '')}`,
        currentStock: 0,
        safetyStock: 5,
        unit: item.unit || '個',
        unitCost: item.unitPrice ? Math.round(item.unitPrice * 0.6) : 0,
        unitPrice: item.unitPrice || 0,
        location: '倉庫未割当',
        lastInDate: '',
        note: `商品マスタ連携品目: ${item.note || ''}`,
        history: [{
          id: `log_init_${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'adjust',
          qty: 0,
          reason: '商品マスタ連携により初期登録',
          currentStock: 0,
          timestamp: new Date().toISOString()
        }]
      });
      addedCount++;
    }
  });

  if (addedCount > 0) {
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(invList));
    saveServerInventory(invList).catch(() => {});
  }
  return { addedCount, total: invList.length };
}

/**
 * 仕入名目マッピング辞書を取得
 */
function getPurchaseMappings() {
  try {
    const raw = localStorage.getItem(KEYS.PURCHASE_MAPPINGS);
    if (!raw) {
      localStorage.setItem(KEYS.PURCHASE_MAPPINGS, JSON.stringify(DEFAULT_PURCHASE_MAPPINGS));
      saveServerPurchaseMappings(DEFAULT_PURCHASE_MAPPINGS).catch(() => {});
      return { ...DEFAULT_PURCHASE_MAPPINGS };
    }
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object') ? parsed : { ...DEFAULT_PURCHASE_MAPPINGS };
  } catch (e) {
    return { ...DEFAULT_PURCHASE_MAPPINGS };
  }
}

/**
 * 仕入名目と在庫商品IDのマッピングを保存・学習
 * @param {string} rawName - レシート・伝票上の名目または仕入先名
 * @param {string} inventoryId - 対応する在庫品目ID
 */
function savePurchaseMapping(rawName, inventoryId) {
  if (!rawName || !inventoryId) return;
  const key = String(rawName).trim();
  if (!key) return;
  
  try {
    const mappings = getPurchaseMappings();
    mappings[key] = inventoryId;
    localStorage.setItem(KEYS.PURCHASE_MAPPINGS, JSON.stringify(mappings));
    saveServerPurchaseMappings(mappings).catch(() => {});
  } catch (e) {
    console.error('Failed to save purchase mapping:', e);
  }
}

/**
 * 仕入名目（品名や仕入先）から在庫品目を推測・検索
 * @param {string} rawName - レシート上の記載名目
 * @returns {{ inventoryId: string, item: object, matchType: 'exact' | 'fuzzy' | 'none' } | null}
 */
function findInventoryMatchForPurchase(rawName) {
  if (!rawName) return null;
  const query = String(rawName).trim();
  if (!query) return null;

  const mappings = getPurchaseMappings();
  const invList = getInventoryList();

  // 1. マッピング辞書の完全一致
  if (mappings[query]) {
    const matched = invList.find(i => i.id === mappings[query]);
    if (matched) {
      return { inventoryId: matched.id, item: matched, matchType: 'exact' };
    }
  }

  // 2. マッピング辞書の部分一致
  const cleanStr = (s) => (s || '').toLowerCase()
    .replace(/[（(【\[].*?[）)】\]]/g, '') // 括弧とその中身を削除
    .replace(/[\s\-_・、。/]/g, '');      // 記号や空白を除去

  const queryLower = query.toLowerCase();
  const queryClean = cleanStr(query);

  for (const [mapKey, invId] of Object.entries(mappings)) {
    const mapKeyLower = mapKey.toLowerCase();
    const mapKeyClean = cleanStr(mapKey);
    if (
      queryLower.includes(mapKeyLower) || mapKeyLower.includes(queryLower) ||
      (queryClean.length >= 2 && (queryClean.includes(mapKeyClean) || mapKeyClean.includes(queryClean)))
    ) {
      const matched = invList.find(i => i.id === invId);
      if (matched) {
        return { inventoryId: matched.id, item: matched, matchType: 'fuzzy' };
      }
    }
  }

  // 3. 在庫マスタ品名・SKUとの直接部分一致（カッコ除去クリーン名も含む）
  for (const inv of invList) {
    const invNameLower = (inv.name || '').toLowerCase();
    const invNameClean = cleanStr(inv.name);
    const invSkuLower = (inv.sku || '').toLowerCase();

    if (invNameLower && (queryLower.includes(invNameLower) || invNameLower.includes(queryLower))) {
      return { inventoryId: inv.id, item: inv, matchType: 'fuzzy' };
    }
    if (invNameClean && invNameClean.length >= 2 && (queryClean.includes(invNameClean) || invNameClean.includes(queryClean))) {
      return { inventoryId: inv.id, item: inv, matchType: 'fuzzy' };
    }
    if (invSkuLower && (queryLower.includes(invSkuLower) || invSkuLower.includes(queryLower))) {
      return { inventoryId: inv.id, item: inv, matchType: 'fuzzy' };
    }
  }

  return { inventoryId: '', item: null, matchType: 'none' };
}

  // ==========================================================================
  // アプリケーションUI制御ロジック
  // ==========================================================================
/**
 * app.js
 * BillCraft メインコントローラー
 * イベントハンドリング、リアルタイムUI更新、プレビュー同期
 */















// ==========================================================================
// アプリケーション状態
// ==========================================================================
let currentDoc = null;

// ==========================================================================
// DOM要素参照
// ==========================================================================
const DOM = {
  // 書類種別
  docTypeBtns: document.querySelectorAll('.doc-type-btn'),
  
  // タブ
  tabBtns: document.querySelectorAll('.editor-tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  itemCountBadge: document.getElementById('itemCountBadge'),

  // 基本情報入力
  inputDocNumber: document.getElementById('inputDocNumber'),
  btnRegenDocNumber: document.getElementById('btnRegenDocNumber'),
  labelIssueDate: document.getElementById('labelIssueDate'),
  inputIssueDate: document.getElementById('inputIssueDate'),
  labelDueDate: document.getElementById('labelDueDate'),
  inputDueDate: document.getElementById('inputDueDate'),
  inputTitle: document.getElementById('inputTitle'),

  // 取引先入力
  inputClientName: document.getElementById('inputClientName'),
  inputClientHonorific: document.getElementById('inputClientHonorific'),
  inputClientZip: document.getElementById('inputClientZip'),
  inputClientAddress: document.getElementById('inputClientAddress'),
  inputClientContact: document.getElementById('inputClientContact'),

  // 明細入力
  itemsContainer: document.getElementById('itemsContainer'),
  btnAddItem: document.getElementById('btnAddItem'),
  selectFractionRule: document.getElementById('selectFractionRule'),

  // 自社情報入力
  inputIssuerName: document.getElementById('inputIssuerName'),
  inputIssuerInvoiceNo: document.getElementById('inputIssuerInvoiceNo'),
  inputIssuerZip: document.getElementById('inputIssuerZip'),
  inputIssuerTel: document.getElementById('inputIssuerTel'),
  inputIssuerFax: document.getElementById('inputIssuerFax'),
  inputIssuerAddress: document.getElementById('inputIssuerAddress'),
  inputIssuerEmail: document.getElementById('inputIssuerEmail'),
  inputBankInfo: document.getElementById('inputBankInfo'),
  inputNotes: document.getElementById('inputNotes'),
  btnInsertTemplateNote: document.getElementById('btnInsertTemplateNote'),

  // 印鑑関連
  checkShowStamp: document.getElementById('checkShowStamp'),
  btnAutoGenerateStamp: document.getElementById('btnAutoGenerateStamp'),
  fileStampUpload: document.getElementById('fileStampUpload'),
  stampPreviewThumb: document.getElementById('stampPreviewThumb'),

  // プレビュー側要素
  sheetDocTitle: document.getElementById('sheetDocTitle'),
  sheetDocSubject: document.getElementById('sheetDocSubject'),
  sheetDocNumber: document.getElementById('sheetDocNumber'),
  sheetLabelIssueDate: document.getElementById('sheetLabelIssueDate'),
  sheetIssueDate: document.getElementById('sheetIssueDate'),
  sheetRowDueDate: document.getElementById('sheetRowDueDate'),
  sheetLabelDueDate: document.getElementById('sheetLabelDueDate'),
  sheetDueDate: document.getElementById('sheetDueDate'),
  sheetClientName: document.getElementById('sheetClientName'),
  sheetClientHonorific: document.getElementById('sheetClientHonorific'),
  sheetClientZip: document.getElementById('sheetClientZip'),
  sheetClientAddress: document.getElementById('sheetClientAddress'),
  sheetClientContact: document.getElementById('sheetClientContact'),
  sheetLeadMessage: document.getElementById('sheetLeadMessage'),
  
  sheetIssuerName: document.getElementById('sheetIssuerName'),
  sheetIssuerInvoiceNo: document.getElementById('sheetIssuerInvoiceNo'),
  sheetIssuerZip: document.getElementById('sheetIssuerZip'),
  sheetIssuerAddress: document.getElementById('sheetIssuerAddress'),
  sheetIssuerTel: document.getElementById('sheetIssuerTel'),
  sheetIssuerFax: document.getElementById('sheetIssuerFax'),
  sheetIssuerEmail: document.getElementById('sheetIssuerEmail'),
  sheetStampWrapper: document.getElementById('sheetStampWrapper'),
  sheetStampImg: document.getElementById('sheetStampImg'),

  sheetAmountBannerLabel: document.getElementById('sheetAmountBannerLabel'),
  sheetBannerGrandTotal: document.getElementById('sheetBannerGrandTotal'),
  sheetBannerTaxTotal: document.getElementById('sheetBannerTaxTotal'),
  sheetItemsTableBody: document.getElementById('sheetItemsTableBody'),

  sheetBankCard: document.getElementById('sheetBankCard'),
  sheetBankInfo: document.getElementById('sheetBankInfo'),
  sheetNotesCard: document.getElementById('sheetNotesCard'),
  sheetNotes: document.getElementById('sheetNotes'),

  sheetSubtotalWithoutTax: document.getElementById('sheetSubtotalWithoutTax'),
  sheetTaxTotal: document.getElementById('sheetTaxTotal'),
  sheetGrandTotalLabel: document.getElementById('sheetGrandTotalLabel'),
  sheetGrandTotal: document.getElementById('sheetGrandTotal'),
  sheetSubtotal10: document.getElementById('sheetSubtotal10'),
  sheetTax10: document.getElementById('sheetTax10'),
  sheetSubtotal8: document.getElementById('sheetSubtotal8'),
  sheetTax8: document.getElementById('sheetTax8'),
  sheetRowTax0: document.getElementById('sheetRowTax0'),
  sheetSubtotal0: document.getElementById('sheetSubtotal0'),

  // アクションバー
  btnIssueDoc: document.getElementById('btnIssueDoc'),
  btnCancelIssueDoc: document.getElementById('btnCancelIssueDoc'),
  sidebarIssuedBanner: document.getElementById('sidebarIssuedBanner'),
  btnSidebarCancelIssue: document.getElementById('btnSidebarCancelIssue'),
  badgeAccountingSyncStatus: document.getElementById('badgeAccountingSyncStatus'),
  btnPrint: document.getElementById('btnPrint'),
  btnSaveHistory: document.getElementById('btnSaveHistory'),
  colorDotBtns: document.querySelectorAll('.color-dot-btn'),

  // ヘッダーボタン
  btnNewDoc: document.getElementById('btnNewDoc'),
  btnLoadSample: document.getElementById('btnLoadSample'),
  btnOpenHistory: document.getElementById('btnOpenHistory'),
  btnOpenBackup: document.getElementById('btnOpenBackup'),

  // モーダル
  historyModal: document.getElementById('historyModal'),
  btnCloseHistoryModal: document.getElementById('btnCloseHistoryModal'),
  btnCloseHistoryModal2: document.getElementById('btnCloseHistoryModal2'),
  historyListContainer: document.getElementById('historyListContainer'),

  backupModal: document.getElementById('backupModal'),
  btnCloseBackupModal: document.getElementById('btnCloseBackupModal'),
  btnCloseBackupModal2: document.getElementById('btnCloseBackupModal2'),
  btnExportJSON: document.getElementById('btnExportJSON'),
  fileImportJSON: document.getElementById('fileImportJSON'),
  toastContainer: document.getElementById('toastContainer'),

  // 商品マスタ関連
  btnOpenItemMaster: document.getElementById('btnOpenItemMaster'),
  btnOpenItemSelectModal: document.getElementById('btnOpenItemSelectModal'),
  itemMasterModal: document.getElementById('itemMasterModal'),
  btnCloseItemMasterModal: document.getElementById('btnCloseItemMasterModal'),
  btnCloseItemMasterModal2: document.getElementById('btnCloseItemMasterModal2'),
  inputSearchItemMaster: document.getElementById('inputSearchItemMaster'),
  btnToggleNewItemForm: document.getElementById('btnToggleNewItemForm'),
  itemMasterFormContainer: document.getElementById('itemMasterFormContainer'),
  itemMasterFormTitle: document.getElementById('itemMasterFormTitle'),
  itemMasterEditId: document.getElementById('itemMasterEditId'),
  itemMasterInputName: document.getElementById('itemMasterInputName'),
  calcInputUserPriceInc: document.getElementById('calcInputUserPriceInc'),
  calcDisplayUnitPrice: document.getElementById('calcDisplayUnitPrice'),
  calcDisplayWholesaleInc: document.getElementById('calcDisplayWholesaleInc'),
  calcDisplayProfit: document.getElementById('calcDisplayProfit'),
  calcModeWholesale: document.getElementById('calcModeWholesale'),
  calcModeStandard: document.getElementById('calcModeStandard'),
  calcPreviewSubInfo: document.getElementById('calcPreviewSubInfo'),
  btnApplyCalcPrice: document.getElementById('btnApplyCalcPrice'),
  itemMasterInputPrice: document.getElementById('itemMasterInputPrice'),
  itemMasterInputUnit: document.getElementById('itemMasterInputUnit'),
  itemMasterSelectTax: document.getElementById('itemMasterSelectTax'),
  itemMasterInputNote: document.getElementById('itemMasterInputNote'),
  btnCancelItemMasterForm: document.getElementById('btnCancelItemMasterForm'),
  btnSaveItemMasterForm: document.getElementById('btnSaveItemMasterForm'),
  itemMasterListContainer: document.getElementById('itemMasterListContainer'),

  // 取引先マスタ関連
  btnOpenClientMaster: document.getElementById('btnOpenClientMaster'),
  btnSelectClientFromMaster: document.getElementById('btnSelectClientFromMaster'),
  clientMasterDatalist: document.getElementById('clientMasterDatalist'),
  clientMasterModal: document.getElementById('clientMasterModal'),
  btnCloseClientMasterModal: document.getElementById('btnCloseClientMasterModal'),
  btnCloseClientMasterModal2: document.getElementById('btnCloseClientMasterModal2'),
  inputSearchClientMaster: document.getElementById('inputSearchClientMaster'),
  clientFilterBtns: document.querySelectorAll('.client-filter-btn'),
  btnToggleNewClientForm: document.getElementById('btnToggleNewClientForm'),
  clientMasterFormContainer: document.getElementById('clientMasterFormContainer'),
  clientMasterFormTitle: document.getElementById('clientMasterFormTitle'),
  clientMasterEditId: document.getElementById('clientMasterEditId'),
  clientMasterInputName: document.getElementById('clientMasterInputName'),
  clientMasterInputHonorific: document.getElementById('clientMasterInputHonorific'),
  clientMasterSelectCategory: document.getElementById('clientMasterSelectCategory'),
  clientMasterInputZip: document.getElementById('clientMasterInputZip'),
  clientMasterInputAddress: document.getElementById('clientMasterInputAddress'),
  clientMasterInputContact: document.getElementById('clientMasterInputContact'),
  clientMasterInputTel: document.getElementById('clientMasterInputTel'),
  clientMasterInputEmail: document.getElementById('clientMasterInputEmail'),
  clientMasterInputInvoiceNum: document.getElementById('clientMasterInputInvoiceNum'),
  clientMasterInputClosingDay: document.getElementById('clientMasterInputClosingDay'),
  clientMasterInputPaymentTerms: document.getElementById('clientMasterInputPaymentTerms'),
  clientMasterInputNote: document.getElementById('clientMasterInputNote'),
  clientMasterListContainer: document.getElementById('clientMasterListContainer'),

  // 在庫マスタ
  inventoryMasterModal: document.getElementById('inventoryMasterModal'),
  btnOpenInventoryMaster: document.getElementById('btnOpenInventoryMaster'),
  btnPortalOpenInventoryMaster: document.getElementById('btnPortalOpenInventoryMaster'),
  btnCloseInventoryMasterModal: document.getElementById('btnCloseInventoryMasterModal'),
  btnCloseInventoryMasterModal2: document.getElementById('btnCloseInventoryMasterModal2'),
  inputSearchInventory: document.getElementById('inputSearchInventory'),
  selectInventoryFilter: document.getElementById('selectInventoryFilter'),
  btnSyncInventoryWithItems: document.getElementById('btnSyncInventoryWithItems'),
  btnToggleNewInventoryForm: document.getElementById('btnToggleNewInventoryForm'),
  inventoryFormContainer: document.getElementById('inventoryFormContainer'),
  inventoryFormTitle: document.getElementById('inventoryFormTitle'),
  inventoryEditId: document.getElementById('inventoryEditId'),
  inventoryItemId: document.getElementById('inventoryItemId'),
  invInputName: document.getElementById('invInputName'),
  invInputSku: document.getElementById('invInputSku'),
  invInputCurrentStock: document.getElementById('invInputCurrentStock'),
  invInputSafetyStock: document.getElementById('invInputSafetyStock'),
  invInputUnit: document.getElementById('invInputUnit'),
  invInputUnitCost: document.getElementById('invInputUnitCost'),
  invInputUnitPrice: document.getElementById('invInputUnitPrice'),
  invInputLocation: document.getElementById('invInputLocation'),
  invInputNote: document.getElementById('invInputNote'),
  btnCancelInventoryForm: document.getElementById('btnCancelInventoryForm'),
  btnSaveInventoryItem: document.getElementById('btnSaveInventoryItem'),
  inventoryTableContainer: document.getElementById('inventoryTableContainer'),
  inventorySummaryStatus: document.getElementById('inventorySummaryStatus'),

  // 在庫入出庫調整モーダル
  inventoryAdjustModal: document.getElementById('inventoryAdjustModal'),
  adjustModalItemName: document.getElementById('adjustModalItemName'),
  btnCloseAdjustModal: document.getElementById('btnCloseAdjustModal'),
  adjustInventoryId: document.getElementById('adjustInventoryId'),
  adjustCurrentStockVal: document.getElementById('adjustCurrentStockVal'),
  adjustCurrentStockUnit: document.getElementById('adjustCurrentStockUnit'),
  labelAdjustTypeIn: document.getElementById('labelAdjustTypeIn'),
  labelAdjustTypeOut: document.getElementById('labelAdjustTypeOut'),
  labelAdjustTypeSet: document.getElementById('labelAdjustTypeSet'),
  adjustInputQty: document.getElementById('adjustInputQty'),
  adjustInputReason: document.getElementById('adjustInputReason'),
  adjustSimulationBox: document.getElementById('adjustSimulationBox'),
  adjustSimulatedStockVal: document.getElementById('adjustSimulatedStockVal'),
  btnCancelAdjust: document.getElementById('btnCancelAdjust'),
  btnConfirmAdjust: document.getElementById('btnConfirmAdjust'),

  // 在庫履歴モーダル
  inventoryHistoryModal: document.getElementById('inventoryHistoryModal'),
  historyModalItemName: document.getElementById('historyModalItemName'),
  historyModalItemSku: document.getElementById('historyModalItemSku'),
  btnCloseInventoryHistoryModal: document.getElementById('btnCloseInventoryHistoryModal'),
  btnCloseInventoryHistoryModal2: document.getElementById('btnCloseInventoryHistoryModal2'),
  inventoryHistoryTableContainer: document.getElementById('inventoryHistoryTableContainer'),

  // クイック新規品目追加モーダル（商品マスタ＆在庫マスタ同時登録）
  quickNewItemModal: document.getElementById('quickNewItemModal'),
  btnCloseQuickNewItemModal: document.getElementById('btnCloseQuickNewItemModal'),
  quickInputItemName: document.getElementById('quickInputItemName'),
  quickInputItemSku: document.getElementById('quickInputItemSku'),
  quickInputItemUnit: document.getElementById('quickInputItemUnit'),
  quickInputItemUnitCost: document.getElementById('quickInputItemUnitCost'),
  quickInputItemUnitPrice: document.getElementById('quickInputItemUnitPrice'),
  quickInputItemSafetyStock: document.getElementById('quickInputItemSafetyStock'),
  quickInputItemNote: document.getElementById('quickInputItemNote'),
  btnCancelQuickNewItem: document.getElementById('btnCancelQuickNewItem'),
  btnConfirmQuickNewItem: document.getElementById('btnConfirmQuickNewItem'),

  // 値引き関連
  btnOpenDiscountModal: document.getElementById('btnOpenDiscountModal'),
  discountModal: document.getElementById('discountModal'),
  btnCloseDiscountModal: document.getElementById('btnCloseDiscountModal'),
  btnCloseDiscountModal2: document.getElementById('btnCloseDiscountModal2'),
  discountInputReason: document.getElementById('discountInputReason'),
  discountReasonTagsContainer: document.getElementById('discountReasonTagsContainer'),
  discountBaseUserPriceInc: document.getElementById('discountBaseUserPriceInc'),
  discountSelectType: document.getElementById('discountSelectType'),
  discountInputValue: document.getElementById('discountInputValue'),
  discountSelectTaxRate: document.getElementById('discountSelectTaxRate'),
  displayUserDiscountAmount: document.getElementById('displayUserDiscountAmount'),
  displayWholesaleDiscountUnitPrice: document.getElementById('displayWholesaleDiscountUnitPrice'),
  btnAddDiscountToItems: document.getElementById('btnAddDiscountToItems'),

  // 請求書詳細・直接編集モーダル（財務会計連携）
  invoiceQuickEditModal: document.getElementById('invoiceQuickEditModal'),
  btnCloseIqeModal: document.getElementById('btnCloseIqeModal'),
  btnCancelIqeModal: document.getElementById('btnCancelIqeModal'),
  btnSaveIqeModal: document.getElementById('btnSaveIqeModal'),
  btnIqeCancelIssue: document.getElementById('btnIqeCancelIssue'),
  btnIqeOpenInEditor: document.getElementById('btnIqeOpenInEditor'),
  btnIqeAddItem: document.getElementById('btnIqeAddItem'),
  iqeModalTitle: document.getElementById('iqeModalTitle'),
  iqeDocNumberSub: document.getElementById('iqeDocNumberSub'),
  iqeStatusBadge: document.getElementById('iqeStatusBadge'),
  iqeDocId: document.getElementById('iqeDocId'),
  iqeDocType: document.getElementById('iqeDocType'),
  iqeIssueDate: document.getElementById('iqeIssueDate'),
  iqeDueDate: document.getElementById('iqeDueDate'),
  iqePaymentStatus: document.getElementById('iqePaymentStatus'),
  iqeClientName: document.getElementById('iqeClientName'),
  iqeTitle: document.getElementById('iqeTitle'),
  iqeItemsTableBody: document.getElementById('iqeItemsTableBody'),
  iqeNotes: document.getElementById('iqeNotes'),
  iqeSubtotal: document.getElementById('iqeSubtotal'),
  iqeTaxTotal: document.getElementById('iqeTaxTotal'),
  iqeGrandTotal: document.getElementById('iqeGrandTotal'),

  // 会計・収支ダッシュボード
  btnOpenAccounting: document.getElementById('btnOpenAccounting'),
  accountingViewScreen: document.getElementById('accountingViewScreen'),
  accountingModal: document.getElementById('accountingViewScreen') || document.getElementById('accountingModal'),
  btnCloseAccountingModal: document.getElementById('btnCloseAccountingModal'),
  btnCloseAccountingModal2: document.getElementById('btnCloseAccountingModal2'),
  expensesViewScreen: document.getElementById('expensesViewScreen'),
  btnCloseExpensesScreen: document.getElementById('btnCloseExpensesScreen'),
  accTabBtns: document.querySelectorAll('.acc-tab-btn'),
  accPanes: document.querySelectorAll('.acc-pane'),
  accSelectMonth: document.getElementById('accSelectMonth'),
  kpiTotalSales: document.getElementById('kpiTotalSales'),
  kpiTotalSalesInc: document.getElementById('kpiTotalSalesInc'),
  kpiGrossProfit: document.getElementById('kpiGrossProfit'),
  kpiGrossMargin: document.getElementById('kpiGrossMargin'),
  kpiTotalExpenses: document.getElementById('kpiTotalExpenses'),
  kpiExpenseItemsCount: document.getElementById('kpiExpenseItemsCount'),
  kpiOperatingProfit: document.getElementById('kpiOperatingProfit'),
  kpiOperatingMargin: document.getElementById('kpiOperatingMargin'),
  kpiUnpaidSales: document.getElementById('kpiUnpaidSales'),
  kpiCollectionRate: document.getElementById('kpiCollectionRate'),
  accMonthlyChart: document.getElementById('accMonthlyChart'),
  accExpenseCategoryList: document.getElementById('accExpenseCategoryList'),
  accSalesTableBody: document.getElementById('accSalesTableBody'),
  btnFilterAllInvoices: document.getElementById('btnFilterAllInvoices'),
  btnFilterUnpaidInvoices: document.getElementById('btnFilterUnpaidInvoices'),
  btnFilterPaidInvoices: document.getElementById('btnFilterPaidInvoices'),
  receiptDropZone: document.getElementById('receiptDropZone'),
  receiptFileInput: document.getElementById('receiptFileInput'),
  receiptImagePreviewContainer: document.getElementById('receiptImagePreviewContainer'),
  receiptImagePreview: document.getElementById('receiptImagePreview'),
  receiptImageScrollBox: document.getElementById('receiptImageScrollBox'),
  btnZoomReceiptImage: document.getElementById('btnZoomReceiptImage'),
  btnClearReceiptImage: document.getElementById('btnClearReceiptImage'),
  receiptZoomModal: document.getElementById('receiptZoomModal'),
  receiptZoomImage: document.getElementById('receiptZoomImage'),
  btnCloseReceiptZoom: document.getElementById('btnCloseReceiptZoom'),
  btnDownloadReceiptZoom: document.getElementById('btnDownloadReceiptZoom'),
  receiptZoomMetaDate: document.getElementById('receiptZoomMetaDate'),
  receiptZoomMetaPayee: document.getElementById('receiptZoomMetaPayee'),
  receiptZoomMetaAmount: document.getElementById('receiptZoomMetaAmount'),
  receiptZoomMetaInvoice: document.getElementById('receiptZoomMetaInvoice'),
  receiptOcrStatus: document.getElementById('receiptOcrStatus'),
  receiptOcrStatusText: document.getElementById('receiptOcrStatusText'),
  geminiOcrBadge: document.getElementById('geminiOcrBadge'),
  formExpenseInput: document.getElementById('formExpenseInput'),
  expenseEditId: document.getElementById('expenseEditId'),
  expenseInputDate: document.getElementById('expenseInputDate'),
  expenseSelectCategory: document.getElementById('expenseSelectCategory'),
  expenseInputAmount: document.getElementById('expenseInputAmount'),
  expenseSelectTax: document.getElementById('expenseSelectTax'),
  expenseInputPayee: document.getElementById('expenseInputPayee'),
  expenseInputInvoiceNum: document.getElementById('expenseInputInvoiceNum'),
  expenseInputNote: document.getElementById('expenseInputNote'),
  btnResetExpenseForm: document.getElementById('btnResetExpenseForm'),
  btnSaveExpense: document.getElementById('btnSaveExpense'),
  radioExpenseTypeExpense: document.getElementById('radioExpenseTypeExpense'),
  radioExpenseTypePurchase: document.getElementById('radioExpenseTypePurchase'),
  labelExpenseTypeExpense: document.getElementById('labelExpenseTypeExpense'),
  labelExpenseTypePurchase: document.getElementById('labelExpenseTypePurchase'),
  expenseInventoryPanel: document.getElementById('expenseInventoryPanel'),
  expensePurchaseMatchBadge: document.getElementById('expensePurchaseMatchBadge'),
  expenseSelectInventoryItem: document.getElementById('expenseSelectInventoryItem'),
  btnQuickCreateInventory: document.getElementById('btnQuickCreateInventory'),
  expenseInputInQty: document.getElementById('expenseInputInQty'),
  expenseInventoryUnitDisp: document.getElementById('expenseInventoryUnitDisp'),
  expenseStockPreviewBox: document.getElementById('expenseStockPreviewBox'),
  expenseCurrentStockDisp: document.getElementById('expenseCurrentStockDisp'),
  expenseAfterStockDisp: document.getElementById('expenseAfterStockDisp'),
  expenseStockDeltaDisp: document.getElementById('expenseStockDeltaDisp'),
  expenseCheckSaveMapping: document.getElementById('expenseCheckSaveMapping'),
  expenseDispRawPayee: document.getElementById('expenseDispRawPayee'),
  expenseListTotalAmount: document.getElementById('expenseListTotalAmount'),
  expenseTableBody: document.getElementById('expenseTableBody'),
  btnExportJournalCSV: document.getElementById('btnExportJournalCSV'),
  accJournalTableBody: document.getElementById('accJournalTableBody'),

  // 勤怠打刻（タイムカード）
  btnOpenAttendance: document.getElementById('btnOpenAttendance'),
  attendanceViewScreen: document.getElementById('attendanceViewScreen'),
  attendanceModal: document.getElementById('attendanceViewScreen') || document.getElementById('attendanceModal'),
  btnCloseAttendanceModal: document.getElementById('btnCloseAttendanceModal'),
  btnCloseAttendanceModal2: document.getElementById('btnCloseAttendanceModal2'),
  attendanceLiveDate: document.getElementById('attendanceLiveDate'),
  attendanceLiveTime: document.getElementById('attendanceLiveTime'),
  attendanceTodayStatusText: document.getElementById('attendanceTodayStatusText'),
  btnClockIn: document.getElementById('btnClockIn'),
  displayClockInTime: document.getElementById('displayClockInTime'),
  btnClockOut: document.getElementById('btnClockOut'),
  displayClockOutTime: document.getElementById('displayClockOutTime'),
  summaryWorkDays: document.getElementById('summaryWorkDays'),
  summaryTotalWorkHours: document.getElementById('summaryTotalWorkHours'),
  summaryTotalOvertime: document.getElementById('summaryTotalOvertime'),
  btnExportAttendanceCSV: document.getElementById('btnExportAttendanceCSV'),
  attendanceTableBody: document.getElementById('attendanceTableBody'),

  // 勤怠・打刻漏れ手動入力フォーム
  btnOpenAttendanceSheetModal: document.getElementById('btnOpenAttendanceSheetModal'),
  attendanceManualFormCard: document.getElementById('attendanceManualFormCard'),
  attendanceManualFormTitle: document.getElementById('attendanceManualFormTitle'),
  btnToggleManualAttendanceForm: document.getElementById('btnToggleManualAttendanceForm'),
  btnCloseAttendanceManualForm: document.getElementById('btnCloseAttendanceManualForm'),
  btnCancelAttendanceManual: document.getElementById('btnCancelAttendanceManual'),
  btnSaveAttendanceManual: document.getElementById('btnSaveAttendanceManual'),
  inputManualAttId: document.getElementById('inputManualAttId'),
  inputManualAttDate: document.getElementById('inputManualAttDate'),
  inputManualAttClockIn: document.getElementById('inputManualAttClockIn'),
  inputManualAttClockOut: document.getElementById('inputManualAttClockOut'),
  inputManualAttNote: document.getElementById('inputManualAttNote'),

  // 出勤簿A4帳票モーダル
  attendanceSheetModal: document.getElementById('attendanceSheetModal'),
  btnCloseAttendanceSheetModal: document.getElementById('btnCloseAttendanceSheetModal'),
  btnCloseAttendanceSheetModal2: document.getElementById('btnCloseAttendanceSheetModal2'),
  btnPrevSheetMonth: document.getElementById('btnPrevSheetMonth'),
  btnNextSheetMonth: document.getElementById('btnNextSheetMonth'),
  sheetMonthSelector: document.getElementById('sheetMonthSelector'),
  btnPrintAttendanceSheet: document.getElementById('btnPrintAttendanceSheet'),
  dispSheetYear: document.getElementById('dispSheetYear'),
  dispSheetMonth: document.getElementById('dispSheetMonth'),
  inputSheetEmpNo: document.getElementById('inputSheetEmpNo'),
  inputSheetEmpName: document.getElementById('inputSheetEmpName'),
  attCalendarTableBody: document.getElementById('attCalendarTableBody'),
  dispSheetSummaryDays: document.getElementById('dispSheetSummaryDays'),
  dispSheetSummaryRegular: document.getElementById('dispSheetSummaryRegular'),
  dispSheetSummaryOvertime: document.getElementById('dispSheetSummaryOvertime'),
  dispSheetSummaryTotal: document.getElementById('dispSheetSummaryTotal'),

  // 統合業務ポータルMENU ＆ アプリスイッチャー
  portalMenuScreen: document.getElementById('portalMenuScreen'),
  portalLiveDate: document.getElementById('portalLiveDate'),
  portalLiveTime: document.getElementById('portalLiveTime'),
  dispPortalCompanyName: document.getElementById('dispPortalCompanyName'),
  appSwitcherNav: document.getElementById('appSwitcherNav'),
  appLayoutInvoice: document.getElementById('appLayoutInvoice')
};

// ==========================================================================
// 初期化
// ==========================================================================
function initApp() {
  // 保存されたアクティブドキュメントがあるか確認
  const saved = loadActiveDoc();
  const profile = loadIssuerProfile();

  if (saved) {
    currentDoc = saved;
    if (profile && profile.name && (!currentDoc.issuer || !currentDoc.issuer.name)) {
      currentDoc.issuer = { ...currentDoc.issuer, ...profile };
    }
  } else {
    // 保存データがなければ白紙の新規書類を設定（件名・取引先・明細は空白）
    currentDoc = createEmptyInvoice('invoice');
    if (profile && profile.name) {
      currentDoc.issuer = { ...currentDoc.issuer, ...profile };
    }
  }

  // 振込先情報の消失防止・保存プロファイルからの復元
  if (!currentDoc.issuer) currentDoc.issuer = {};
  if ((!currentDoc.issuer.bankInfo || currentDoc.issuer.bankInfo.trim() === '') && profile && profile.bankInfo) {
    currentDoc.issuer.bankInfo = profile.bankInfo;
  }

  // 印鑑が未生成の場合は自動生成
  if (!currentDoc.issuer.stampDataUrl && currentDoc.issuer.name) {
    currentDoc.issuer.stampDataUrl = generateCompanyStamp(currentDoc.issuer.name);
  }

  // UIへ反映
  populateFormFromDoc();
  updateThemeColor(currentDoc.themeColor || 'indigo');
  renderAll();

  // イベントリスナーを接続
  setupEventListeners();

  // 取引先マスタのオートコンプリートリストを初期化
  updateClientMasterDatalist();

  // マスタの自動救済・復元 ＆ サーバーファイル（data/）永続化同期
  initMastersPersistence().then(result => {
    updateClientMasterDatalist();
    updateAttendanceUI(); // サーバーから同期された勤怠情報をUIに反映

    // サーバーファイル（data/company/issuer_profile.json）から最新の振込先情報を確実に復元・反映
    const syncedProfile = loadIssuerProfile();
    if (syncedProfile && syncedProfile.bankInfo) {
      if (!currentDoc.issuer) currentDoc.issuer = {};
      if (!currentDoc.issuer.bankInfo || currentDoc.issuer.bankInfo.trim() === '') {
        currentDoc.issuer.bankInfo = syncedProfile.bankInfo;
      }
      if (DOM.inputBankInfo && !DOM.inputBankInfo.value) {
        DOM.inputBankInfo.value = currentDoc.issuer.bankInfo;
      }
      renderAll();
    }

    if (result && (result.rescuedItems > 0 || result.rescuedClients > 0)) {
      const msgs = [];
      if (result.rescuedItems > 0) msgs.push(`商品マスタ: ${result.rescuedItems}件`);
      if (result.rescuedClients > 0) msgs.push(`取引先マスタ: ${result.rescuedClients}件`);
      showToast(`過去伝票から【${msgs.join('、')}】を自動復元・保存しました！`, 'success');
    }
  }).catch(e => {
    console.warn('Init masters persistence warning:', e);
  });

  // 在庫マスタ ＆ 仕入マッピングのサーバー同期
  initInventoryFromServer().then(() => {
    populateExpenseInventoryDropdown();
  }).catch(e => {
    console.warn('Init inventory persistence warning:', e);
  });

  // 起動時はポータルMENUを表示（初回起動時）
  switchAppView('portal');
  updatePortalInfo();
}

// ==========================================================================
// 統合業務ポータル・各専用画面切替ロジック (AlbaCraft ERP)
// ポップアップ（モーダル）ではなく独立した広大な専用ワークスペースとして切替
// ==========================================================================
let currentAppView = 'portal';

function switchAppView(viewName) {
  currentAppView = viewName || 'portal';

  // 1. スイッチャーボタンのactive状態を更新
  const switchBtns = document.querySelectorAll('.app-switch-btn');
  switchBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.app === currentAppView);
  });

  // 2. 全ての専用フル画面から active を除去（ポップアップの重ね合わせを完全排除）
  const allScreens = document.querySelectorAll('.app-view-screen');
  allScreens.forEach(screen => {
    screen.classList.remove('active');
  });

  // 3. 補助モーダル（出勤簿A4帳票、履歴、マスタなど）も画面切り替え時は閉じる
  if (DOM.attendanceSheetModal) DOM.attendanceSheetModal.classList.remove('active');
  if (DOM.historyModal) DOM.historyModal.classList.remove('active');
  if (DOM.itemMasterModal) DOM.itemMasterModal.classList.remove('active');
  if (DOM.clientMasterModal) DOM.clientMasterModal.classList.remove('active');
  if (DOM.inventoryMasterModal) DOM.inventoryMasterModal.style.display = 'none';
  if (DOM.inventoryAdjustModal) DOM.inventoryAdjustModal.style.display = 'none';
  if (DOM.inventoryHistoryModal) DOM.inventoryHistoryModal.style.display = 'none';
  if (DOM.backupModal) DOM.backupModal.classList.remove('active');
  if (DOM.receiptZoomModal) DOM.receiptZoomModal.classList.remove('active');
  document.body.style.overflow = '';

  // 4. 対象の専用画面をアクティブ化し、必要なデータ描画・初期化を行う
  switch (currentAppView) {
    case 'portal':
      if (DOM.portalMenuScreen) {
        DOM.portalMenuScreen.classList.add('active');
        updatePortalInfo();
      }
      break;

    case 'invoice':
      // 納品・請求書専用画面（エディタ＋A4プレビューの左右分割レイアウト）
      if (DOM.appLayoutInvoice) {
        DOM.appLayoutInvoice.classList.add('active');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;

    case 'accounting':
      // 財務会計専用画面（収支・P/L・入金消込・仕訳帳）
      if (DOM.accountingViewScreen) {
        DOM.accountingViewScreen.classList.add('active');
      } else if (DOM.accountingModal) {
        DOM.accountingModal.classList.add('active');
      }
      initAccountingMonthSelector();
      switchAccountingTab('acc-tab-dashboard');
      break;

    case 'expenses':
      // 経費読み込み専用画面（AI OCRレシート解析 ＆ 経費登録・明細管理）
      if (DOM.expensesViewScreen) {
        DOM.expensesViewScreen.classList.add('active');
      }
      populateExpenseInventoryDropdown();
      renderAccountingExpenses();
      break;

    case 'attendance':
      // 勤怠管理・退勤打刻専用画面（打刻パネル ＆ タイムカード履歴）
      if (DOM.attendanceViewScreen) {
        DOM.attendanceViewScreen.classList.add('active');
      } else if (DOM.attendanceModal) {
        DOM.attendanceModal.classList.add('active');
      }
      openAttendanceModal();
      break;
  }
}

window.switchAppView = switchAppView;

function updatePortalInfo() {
  // 会社名の反映
  const profile = loadIssuerProfile();
  if (DOM.dispPortalCompanyName) {
    DOM.dispPortalCompanyName.textContent = (profile && profile.name) ? profile.name : '株式会社アルバワークス';
  }

  // リアルタイム時計の更新
  const now = new Date();
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const dayStr = days[now.getDay()];
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  if (DOM.portalLiveDate) {
    DOM.portalLiveDate.textContent = `${y}年${m}月${d}日 (${dayStr})`;
  }
  if (DOM.portalLiveTime) {
    DOM.portalLiveTime.textContent = `${hh}:${mm}:${ss}`;
  }
}

// 毎秒ポータル時計を更新
setInterval(() => {
  if (currentAppView === 'portal') {
    updatePortalInfo();
  }
}, 1000);

// ==========================================================================
// フォームへのデータ設定
// ==========================================================================
function populateFormFromDoc() {
  // 書類種別ボタングループの選択状態
  DOM.docTypeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === currentDoc.docType);
  });

  // 基本情報
  DOM.inputDocNumber.value = currentDoc.docNumber || '';
  DOM.inputIssueDate.value = currentDoc.issueDate || '';
  DOM.inputDueDate.value = currentDoc.dueDate || '';
  DOM.inputTitle.value = currentDoc.title || '';

  // 取引先
  DOM.inputClientName.value = currentDoc.client?.name || '';
  DOM.inputClientHonorific.value = currentDoc.client?.honorific || '御中';
  DOM.inputClientZip.value = currentDoc.client?.zip || '';
  DOM.inputClientAddress.value = currentDoc.client?.address || '';
  DOM.inputClientContact.value = currentDoc.client?.contactPerson || '';

  // 自社情報
  DOM.inputIssuerName.value = currentDoc.issuer?.name || '';
  DOM.inputIssuerInvoiceNo.value = currentDoc.issuer?.invoiceNumber || '';
  DOM.inputIssuerZip.value = currentDoc.issuer?.zip || '';
  DOM.inputIssuerTel.value = currentDoc.issuer?.tel || '';
  DOM.inputIssuerFax.value = currentDoc.issuer?.fax || '';
  DOM.inputIssuerAddress.value = currentDoc.issuer?.address || '';
  DOM.inputIssuerEmail.value = currentDoc.issuer?.email || '';
  DOM.inputBankInfo.value = currentDoc.issuer?.bankInfo || '';
  DOM.inputNotes.value = currentDoc.notes || '';

  // 印鑑
  DOM.checkShowStamp.checked = currentDoc.issuer?.showStamp !== false;
  updateStampThumbnail(currentDoc.issuer?.stampDataUrl);

  // 端数処理
  DOM.selectFractionRule.value = currentDoc.taxFractionRule || 'floor';

  // 明細行の入力カード再構築
  renderItemInputCards();
}

// ==========================================================================
// 全体レンダリング（プレビュー更新 & 計算）
// ==========================================================================
function renderAll() {
  const meta = DOC_TYPES[currentDoc.docType] || DOC_TYPES.invoice;

  // ラベル文言の更新
  DOM.labelIssueDate.textContent = meta.dateLabel;
  DOM.labelDueDate.textContent = meta.dueLabel;

  // シートタイトル（文字間隔を空けて格式高く）
  let spacedTitle = meta.badge;
  if (spacedTitle.length === 3) {
    spacedTitle = spacedTitle[0] + ' ' + spacedTitle[1] + ' ' + spacedTitle[2];
  } else if (spacedTitle.length === 4) {
    spacedTitle = spacedTitle[0] + ' ' + spacedTitle[1] + ' ' + spacedTitle[2] + ' ' + spacedTitle[3];
  }
  DOM.sheetDocTitle.textContent = spacedTitle;
  DOM.sheetDocSubject.textContent = currentDoc.title || '';

  // メタ情報
  DOM.sheetDocNumber.textContent = currentDoc.docNumber || '';
  DOM.sheetLabelIssueDate.textContent = meta.dateLabel;
  DOM.sheetIssueDate.textContent = formatJapaneseDate(currentDoc.issueDate);
  
  // 期日（領収書の場合は不要または但し書きとして扱う）
  if (currentDoc.docType === 'receipt') {
    DOM.sheetRowDueDate.style.display = 'none';
  } else {
    DOM.sheetRowDueDate.style.display = 'table-row';
    DOM.sheetLabelDueDate.textContent = meta.dueLabel;
    DOM.sheetDueDate.textContent = formatJapaneseDate(currentDoc.dueDate);
  }

  // 取引先
  DOM.sheetClientName.textContent = currentDoc.client?.name || '　　　　　　　　';
  DOM.sheetClientHonorific.textContent = currentDoc.client?.honorific || '';
  DOM.sheetClientZip.textContent = currentDoc.client?.zip ? `〒${currentDoc.client.zip}` : '';
  DOM.sheetClientAddress.textContent = currentDoc.client?.address || '';
  DOM.sheetClientContact.textContent = currentDoc.client?.contactPerson || '';

  // リードメッセージ
  if (currentDoc.docType === 'invoice') {
    DOM.sheetLeadMessage.textContent = '下記の通り、御請求申し上げます。';
  } else if (currentDoc.docType === 'delivery') {
    DOM.sheetLeadMessage.textContent = '下記の通り、納品申し上げます。';
  } else if (currentDoc.docType === 'estimate') {
    DOM.sheetLeadMessage.textContent = '下記の通り、御見積申し上げます。';
  } else if (currentDoc.docType === 'receipt') {
    DOM.sheetLeadMessage.textContent = '上記の金額を正に領収いたしました。';
  }

  // 自社情報
  DOM.sheetIssuerName.textContent = currentDoc.issuer?.name || '';
  if (currentDoc.issuer?.invoiceNumber) {
    DOM.sheetIssuerInvoiceNo.style.display = 'inline-block';
    DOM.sheetIssuerInvoiceNo.textContent = `登録番号: ${currentDoc.issuer.invoiceNumber}`;
  } else {
    DOM.sheetIssuerInvoiceNo.style.display = 'none';
  }
  DOM.sheetIssuerZip.textContent = currentDoc.issuer?.zip ? `〒${currentDoc.issuer.zip}` : '';
  DOM.sheetIssuerAddress.textContent = currentDoc.issuer?.address || '';
  DOM.sheetIssuerTel.textContent = currentDoc.issuer?.tel ? `TEL: ${currentDoc.issuer.tel}` : '';
  if (currentDoc.issuer?.fax) {
    DOM.sheetIssuerFax.style.display = 'block';
    DOM.sheetIssuerFax.textContent = `FAX: ${currentDoc.issuer.fax}`;
  } else {
    DOM.sheetIssuerFax.style.display = 'none';
  }
  DOM.sheetIssuerEmail.textContent = currentDoc.issuer?.email ? `Email: ${currentDoc.issuer.email}` : '';

  // 印鑑
  if (currentDoc.issuer?.showStamp && currentDoc.issuer?.stampDataUrl) {
    DOM.sheetStampWrapper.style.display = 'block';
    DOM.sheetStampImg.src = currentDoc.issuer.stampDataUrl;
  } else {
    DOM.sheetStampWrapper.style.display = 'none';
  }

  // 計算実行
  const totals = calculateTotals(currentDoc.items, currentDoc.taxFractionRule);

  // 金額バナー
  DOM.sheetAmountBannerLabel.textContent = `${meta.amountLabel}（税込）`;
  DOM.sheetBannerGrandTotal.textContent = formatCurrency(totals.grandTotal);
  DOM.sheetBannerTaxTotal.textContent = `(内消費税等 ${formatCurrency(totals.taxTotal)})`;

  // 明細テーブルのレンダリング
  renderSheetItemsTable(currentDoc.items);

  // 下部集計表
  DOM.sheetSubtotalWithoutTax.textContent = formatCurrency(totals.subtotalWithoutTax);
  DOM.sheetTaxTotal.textContent = formatCurrency(totals.taxTotal);
  DOM.sheetGrandTotalLabel.textContent = `${meta.amountLabel} (税込)`;
  DOM.sheetGrandTotal.textContent = formatCurrency(totals.grandTotal);

  // 税率別内訳
  DOM.sheetSubtotal10.textContent = formatCurrency(totals.subtotal10);
  DOM.sheetTax10.textContent = formatCurrency(totals.tax10);
  DOM.sheetSubtotal8.textContent = formatCurrency(totals.subtotal8);
  DOM.sheetTax8.textContent = formatCurrency(totals.tax8);

  if (totals.subtotal0 > 0) {
    DOM.sheetRowTax0.style.display = 'table-row';
    DOM.sheetSubtotal0.textContent = formatCurrency(totals.subtotal0);
  } else {
    DOM.sheetRowTax0.style.display = 'none';
  }

  // 振込先・備考カード
  if (currentDoc.issuer?.bankInfo && currentDoc.docType !== 'delivery' && currentDoc.docType !== 'receipt') {
    DOM.sheetBankCard.style.display = 'block';
    DOM.sheetBankInfo.textContent = currentDoc.issuer.bankInfo;
  } else {
    DOM.sheetBankCard.style.display = 'none';
  }

  if (currentDoc.notes) {
    DOM.sheetNotesCard.style.display = 'block';
    DOM.sheetNotes.textContent = currentDoc.notes;
  } else {
    DOM.sheetNotesCard.style.display = 'none';
  }

  // 確定発行状態とツールバーボタン・財務会計連携バッジの更新
  const isDocIssued = !!(currentDoc.isIssued && !currentDoc.isCancelled);

  if (DOM.btnCancelIssueDoc) {
    DOM.btnCancelIssueDoc.style.display = isDocIssued ? 'inline-flex' : 'none';
  }
  if (DOM.sidebarIssuedBanner) {
    DOM.sidebarIssuedBanner.style.display = isDocIssued ? 'flex' : 'none';
  }

  if (DOM.btnIssueDoc) {
    if (isDocIssued) {
      DOM.btnIssueDoc.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        確定更新（財務反映中）
      `;
      DOM.btnIssueDoc.title = '現在の内容で確定発行を更新し、財務会計へ再反映します';
    } else {
      DOM.btnIssueDoc.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        確定発行（財務会計反映）
      `;
      DOM.btnIssueDoc.title = '書類を確定発行し、財務会計（売上高・売掛金消込・仕訳帳）へ即座に反映します';
    }
  }

  if (DOM.badgeAccountingSyncStatus) {
    if (isDocIssued) {
      DOM.badgeAccountingSyncStatus.style.background = 'rgba(16, 185, 129, 0.2)';
      DOM.badgeAccountingSyncStatus.style.color = '#34d399';
      DOM.badgeAccountingSyncStatus.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      DOM.badgeAccountingSyncStatus.innerHTML = `<span style="font-size: 8px;">●</span> 財務会計連動済（確定発行）`;
    } else {
      DOM.badgeAccountingSyncStatus.style.background = 'rgba(148, 163, 184, 0.15)';
      DOM.badgeAccountingSyncStatus.style.color = '#94a3b8';
      DOM.badgeAccountingSyncStatus.style.borderColor = 'rgba(148, 163, 184, 0.3)';
      DOM.badgeAccountingSyncStatus.innerHTML = `<span style="font-size: 8px;">●</span> 財務会計連動（編集中・下書き）`;
    }
  }

  // LocalStorageに常時保存
  saveActiveDoc(currentDoc);
}

/**
 * 納品書・請求書・領収書の確定発行 ＆ 財務会計への即時同期
 * @param {object} options { isPrint: boolean, isExplicitIssue: boolean }
 */
function issueAndSyncAccountingDocument(options = {}) {
  const { isPrint = false, isExplicitIssue = true } = options;

  // 1. 発行フラグ・日時の設定
  currentDoc.isIssued = true;
  currentDoc.isCancelled = false;
  currentDoc.issuedAt = currentDoc.issuedAt || new Date().toISOString();
  if (!currentDoc.paymentStatus) {
    currentDoc.paymentStatus = (currentDoc.docType === 'receipt') ? 'paid' : 'unpaid';
  }
  if (currentDoc.isPaid === undefined) {
    currentDoc.isPaid = (currentDoc.docType === 'receipt');
  }

  // 2. 明細内の全商品のユーザー価格およびマスタ使用頻度を記録
  if (currentDoc && Array.isArray(currentDoc.items)) {
    currentDoc.items.forEach(it => {
      if (it.name) {
        if (it.userPrice && Number(it.userPrice) > 0) {
          recordUserPrice(it.name, Number(it.userPrice));
        }
        recordItemMasterUsage(null, it.name);
      }
    });
  }

  // 3. 取引先マスタへの自動登録・利用実績記録
  if (currentDoc.client && currentDoc.client.name && currentDoc.client.name.trim()) {
    saveClientToMaster({
      name: currentDoc.client.name,
      honorific: currentDoc.client.honorific,
      zip: currentDoc.client.zip,
      address: currentDoc.client.address,
      contactPerson: currentDoc.client.contactPerson,
      paymentTerms: currentDoc.paymentTerms || '',
      category: 'customer'
    });
    recordClientMasterUsage(null, currentDoc.client.name);
    updateClientMasterDatalist();
  }

  // 4. 書類履歴へ保存（財務会計への即時データ投入）
  const success = saveDocToHistory(currentDoc);
  if (!success) {
    showToast('書類の保存に失敗しました', 'danger');
    return false;
  }

  // 5. 財務会計ダッシュボード・売上消込・仕訳帳を即時再計算・同期
  initAccountingMonthSelector();
  const currentMonth = DOM.accSelectMonth ? DOM.accSelectMonth.value : '';
  renderAccountingDashboard(currentMonth);
  renderAccountingSales(currentSalesFilter);
  renderAccountingJournals();

  // 6. UI表示の更新
  renderAll();

  const typeLabel = (DOC_TYPES[currentDoc.docType] || DOC_TYPES.invoice).label;
  if (isExplicitIssue) {
    showToast(`「${typeLabel}」を確定発行し、財務会計（売上・売掛金消込・仕訳帳）へ即時反映しました！`, 'success');
  } else {
    showToast(`作成履歴に保存し、財務会計（売上高・仕訳帳）へ反映しました！`, 'success');
  }

  // 7. 印刷が指定されている場合は印刷ダイアログを起動
  if (isPrint) {
    setTimeout(() => {
      window.print();
    }, 200);
  }

  return true;
}

window.issueAndSyncAccountingDocument = issueAndSyncAccountingDocument;

/**
 * 編集中書類の確定発行を取り消し（未確定・下書きに戻す）
 */
function cancelCurrentDocIssue() {
  const typeLabel = (DOC_TYPES[currentDoc.docType] || DOC_TYPES.invoice).label;
  const docNo = currentDoc.docNumber || 'この書類';

  const confirmMsg = `「${typeLabel} (${docNo})」の確定発行を取り消しますか？\n\n【取り消しの効果】\n・財務会計（売上高・売掛金消込・仕訳帳）から即座に除外されます。\n・書類データは削除されず、修正可能な「下書き」状態に戻ります。`;
  
  if (!confirm(confirmMsg)) {
    return false;
  }

  currentDoc.isIssued = false;
  currentDoc.isCancelled = true;
  currentDoc.issuedAt = null;

  // 書類履歴内の該当書類も取消状態に更新
  if (currentDoc.id) {
    cancelDocIssue(currentDoc.id);
  }

  // LocalStorageに保存
  saveActiveDoc(currentDoc);

  // 財務会計ダッシュボード・売上消込・仕訳帳を即時再計算・同期
  initAccountingMonthSelector();
  const currentMonth = DOM.accSelectMonth ? DOM.accSelectMonth.value : '';
  renderAccountingDashboard(currentMonth);
  renderAccountingSales(currentSalesFilter);
  renderAccountingJournals();

  // UI表示の更新
  renderAll();

  showToast(`「${typeLabel}」の確定発行を取り消しました。財務会計から自動除外され、下書きに戻りました。`, 'warning');
  return true;
}

window.cancelCurrentDocIssue = cancelCurrentDocIssue;

// ==========================================================================
// プレビュー用明細テーブルのレンダリング
// ==========================================================================
function renderSheetItemsTable(items = []) {
  DOM.sheetItemsTableBody.innerHTML = '';

  if (items.length === 0) {
    const emptyTr = document.createElement('tr');
    emptyTr.innerHTML = `<td colspan="8" style="text-align: center; color: #94a3b8; padding: 24px;">明細がありません。「行を追加」ボタンから追加してください。</td>`;
    DOM.sheetItemsTableBody.appendChild(emptyTr);
    return;
  }

  items.forEach((item, index) => {
    const tr = document.createElement('tr');
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const lineTotal = Math.round(qty * price);
    const rate = Number(item.taxRate);

    let taxBadge = '';
    if (rate === 8) {
      taxBadge = '<span class="tax-badge-pill tax-badge-reduced">※8%軽</span>';
    } else if (rate === 0) {
      taxBadge = '<span class="tax-badge-pill" style="background:#e2e8f0; color:#475569;">非課税</span>';
    } else {
      taxBadge = '<span class="tax-badge-pill" style="color:#64748b;">10%</span>';
    }

    // 各明細の参考ユーザー価格の算出（手動設定値または仕切りから逆算）
    // 各明細の参考ユーザー価格の算出（手動設定値または仕切りから逆算）
    let userPriceInc = Number(item.userPrice) || 0;
    if (!userPriceInc && price > 0) {
      // 逆算：税抜き仕切り ＋ 販売店利益(税込仕切り×20%) ＝ 税抜きユーザー価格
      const wholesaleInc = Math.round(price * (1 + rate / 100));
      const profit = Math.round(wholesaleInc * 0.20);
      const userEx = price + profit;
      userPriceInc = Math.round(userEx * (1 + rate / 100));
    }

    let userPriceBadge = '';
    if (userPriceInc > 0 && price >= 0) {
      userPriceBadge = `<span class="sheet-user-ref-price">（ユーザー参考: ${formatCurrency(userPriceInc)}）</span>`;
    }

    // 品目欄に一緒に表示する摘要（割引き理由や補足・内訳等）
    let descText = (item.description || '').trim();
    if (!descText && (item.discountReason || (item.discount && item.discount.reason))) {
      descText = item.discountReason || (item.discount && item.discount.reason);
    }
    const descHtml = descText
      ? `<div class="sheet-item-subnote">${escapeHtml(descText)}</div>`
      : '';

    tr.innerHTML = `
      <td class="td-num">${index + 1}</td>
      <td class="td-item-name">
        <div style="font-weight: 600; line-height: 1.35;">${escapeHtml(item.name || '')}</div>
        ${descHtml}
        ${userPriceBadge}
      </td>
      <td class="td-right">${qty ? qty.toLocaleString('ja-JP') : ''}</td>
      <td style="text-align: center;">${escapeHtml(item.unit || '')}</td>
      <td class="td-price">${formatCurrency(price)}</td>
      <td class="td-right" style="font-weight: 700; font-size: 0.95rem;">${formatCurrency(lineTotal)}</td>
      <td style="text-align: center;">${taxBadge}</td>
      <td class="td-item-note">${escapeHtml(item.note || '')}</td>
    `;
    DOM.sheetItemsTableBody.appendChild(tr);
  });
}

// ==========================================================================
// エディタ用明細入力カードのレンダリング
// ==========================================================================
function renderItemInputCards() {
  DOM.itemsContainer.innerHTML = '';

  currentDoc.items.forEach((item, index) => {
    const isDiscount = Number(item.unitPrice) < 0;
    const card = document.createElement('div');
    card.className = isDiscount ? 'item-card is-discount' : 'item-card';
    card.dataset.itemId = item.id;

    // 想定ユーザー価格および利益の参考値計算
    const calcRefValues = () => {
      const curTax = Number(item.taxRate !== undefined ? item.taxRate : 10);
      const curPrice = Number(item.unitPrice) || 0;
      let refUserInc = Number(item.userPrice) || 0;
      let refProfit = 0;
      let refWholesaleInc = 0;

      if (refUserInc > 0) {
        const res = calculateWholesalePrice(refUserInc, curTax);
        refUserInc = res.finalUserPriceInc;
        refProfit = res.retailerProfit;
        refWholesaleInc = res.wholesalePriceInc;
      } else if (curPrice > 0) {
        refWholesaleInc = Math.round(curPrice * (1 + curTax / 100));
        refProfit = Math.round(refWholesaleInc * 0.20);
        const userEx = curPrice + refProfit; // 税抜きユーザー ＝ 税抜き仕切り ＋ 販売店利益
        refUserInc = Math.round(userEx * (1 + curTax / 100));
      }
      return { refUserInc, refProfit, refWholesaleInc };
    };

    const initialRefs = calcRefValues();

    // その商品の過去の入力履歴（頻度の多い順）を取得
    const userPriceHistories = getUserPriceHistoryForItem(item.name || '');
    const historyOptionsHtml = userPriceHistories.map(h => 
      `<option value="${h.price}">${formatCurrency(h.price)} (${h.count}回)</option>`
    ).join('');

    card.innerHTML = `
      <div class="item-card-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="item-index-badge">明細 #${index + 1}</span>
          ${isDiscount ? '<span class="badge" style="background:#fee2e2; color:#b91c1c; font-size:0.7rem; font-weight:700; padding:2px 6px; border-radius:4px;">値引き行</span>' : ''}
        </div>
        <div class="item-actions" style="display: flex; align-items: center; gap: 6px;">
          ${!isDiscount ? `
            <button type="button" class="btn-save-to-master" title="この商品を商品マスタに登録">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              マスタ登録
            </button>
          ` : ''}
          <button type="button" class="btn-icon-danger btn-delete-item" title="この行を削除">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      </div>

      <!-- 品名 ＆ 摘要（割引きや仕様等の補足を品目欄に一緒に表示） -->
      <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px;">
        <div>
          <input type="text" class="form-input item-input-name" placeholder="品名・項目名（例: DP-5000 ベーシックセット など）" value="${escapeHtml(item.name || '')}" style="font-weight: 600; font-size: 0.95rem;">
        </div>
        <div style="position: relative;">
          <input type="text" class="form-input item-input-description" placeholder="📝 摘要（例: 出精値引き、特別割引き、仕様・対象期間 等 ※品名欄に一緒に印字されます）" value="${escapeHtml(item.description || item.discountReason || '')}" style="font-size: 0.825rem; background: #f8fafc; border-color: #cbd5e1; color: #334155; padding-left: 28px;">
          <span style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 13px; opacity: 0.65; pointer-events: none;">📝</span>
        </div>
      </div>

      <!-- 💡 各明細内で完結する ユーザー価格アシストパネル -->
      ${!isDiscount ? `
        <div class="item-discount-panel">
          <div class="item-discount-panel-header">
            <div class="item-discount-panel-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <span>仕切り価格アシスト（販売店利益20%ルール）</span>
            </div>
            <span style="font-size: 0.7rem; color: #64748b;">税抜きユーザー ＝ 税抜き仕切り ＋ 利益 (税込仕切り × 20%)</span>
          </div>

          <div style="max-width: 360px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
              <label class="form-label" style="font-size: 0.725rem; margin: 0;">ユーザー税込定価 (円)</label>
              <span class="user-price-history-info" style="font-size: 0.68rem; color: #64748b;">
                ${userPriceHistories.length > 0 ? `過去履歴 ${userPriceHistories.length}件 (上下キー/▲▼で切替)` : '過去履歴なし'}
              </span>
            </div>
            
            <div class="user-price-control-group">
              <input type="number" class="item-input-user-price" placeholder="例: 110000" value="${item.userPrice || ''}" min="0">
              
              <!-- 上下スピンボタン（その商品の過去の入力履歴を頻度の多い順に参照） -->
              <div class="user-price-spin-btns">
                <button type="button" class="btn-spin-up" title="過去履歴（頻度順）の前へ [↑キー]">▲</button>
                <button type="button" class="btn-spin-down" title="過去履歴（頻度順）の次へ [↓キー]">▼</button>
              </div>

              <!-- 頻度順ドロップダウンセレクト（直接一覧から選ぶことも可能） -->
              <select class="item-select-price-history" title="過去の入力履歴から選択（頻度の多い順）">
                <option value="">履歴▼</option>
                ${historyOptionsHtml}
              </select>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- メイン入力グリッド（単価(税抜)を特大表示） -->
      <div class="item-grid">
        <div>
          <label class="form-label" style="font-size: 0.725rem;">数量</label>
          <input type="number" class="form-input item-input-qty" value="${item.quantity !== undefined ? item.quantity : 1}" step="any">
        </div>
        <div>
          <label class="form-label" style="font-size: 0.725rem;">単位</label>
          <input type="text" class="form-input item-input-unit" placeholder="式" value="${escapeHtml(item.unit || '')}">
        </div>
        <div>
          <label class="item-label-price-large">
            <span>単価 (税抜)</span>
            <span style="font-size: 0.68rem; color: var(--primary); font-weight: 600;">★</span>
          </label>
          <input type="number" class="form-input item-input-price item-input-price-large" value="${item.unitPrice !== undefined ? item.unitPrice : 0}" placeholder="0">
        </div>
        <div>
          <label class="form-label" style="font-size: 0.725rem;">税率</label>
          <select class="form-select item-select-tax">
            <option value="10" ${item.taxRate === 10 ? 'selected' : ''}>10% (標準)</option>
            <option value="8" ${item.taxRate === 8 ? 'selected' : ''}>8% (軽減税率)</option>
            <option value="0" ${item.taxRate === 0 ? 'selected' : ''}>0% (非課税)</option>
          </select>
        </div>
        <div>
          <label class="form-label" style="font-size: 0.725rem;">小計</label>
          <div class="item-line-total" style="font-size: 1.05rem; font-weight: 700; color: ${isDiscount ? 'var(--danger)' : 'var(--text-primary)'}; padding: 8px 0; text-align: right;">
            ${formatCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
          </div>
        </div>
      </div>

      <!-- ユーザー参考価格プレビューバー -->
      <div class="item-user-price-preview-bar">
        <div>
          <span style="color: #64748b;">👤 ユーザー価格（税込参考）:</span>
          <strong class="item-user-price-badge">${formatCurrency(initialRefs.refUserInc)}</strong>
        </div>
        <div>
          <span class="item-profit-badge">販売店利益 (20%): ${formatCurrency(initialRefs.refProfit)}</span>
          <span style="font-size: 0.7rem; color: #64748b; margin-left: 6px;">(税込仕切り: ${formatCurrency(initialRefs.refWholesaleInc)})</span>
        </div>
      </div>

      <!-- 備考（シリアル番号、管理番号等 ※右端の備考列に印字） -->
      <div class="form-group" style="margin-top: 8px; margin-bottom: 0;">
        <div style="position: relative;">
          <input type="text" class="form-input item-input-note" placeholder="🏷️ 備考・シリアルNo.（例: S/N: 2026-0045、製造番号 等 ※備考列に印字されます）" value="${escapeHtml(item.note || '')}" style="font-size: 0.775rem; background: #ffffff; color: #475569; padding-left: 28px;">
          <span style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 13px; opacity: 0.65; pointer-events: none;">🏷️</span>
        </div>
      </div>
    `;

    // 削除ボタンイベント
    card.querySelector('.btn-delete-item').addEventListener('click', () => {
      currentDoc.items.splice(index, 1);
      renderItemInputCards();
      renderAll();
    });

    // マスタ登録ボタンイベント
    const btnSaveMaster = card.querySelector('.btn-save-to-master');
    if (btnSaveMaster) {
      btnSaveMaster.addEventListener('click', () => {
        if (!item.name || !item.name.trim()) {
          showToast('品名を入力してください', 'info');
          return;
        }
        saveItemToMaster({
          name: item.name.trim(),
          unit: item.unit || '式',
          unitPrice: Math.abs(Number(item.unitPrice) || 0),
          userPrice: Number(item.userPrice) || 0,
          taxRate: item.taxRate !== undefined ? Number(item.taxRate) : 10,
          note: item.note || ''
        });
        showToast(`「${item.name}」を商品マスタに保存しました`, 'success');
      });
    }

    // 入力要素
    const inputName = card.querySelector('.item-input-name');
    const inputDescription = card.querySelector('.item-input-description');
    const inputQty = card.querySelector('.item-input-qty');
    const inputUnit = card.querySelector('.item-input-unit');
    const inputPrice = card.querySelector('.item-input-price');
    const selectTax = card.querySelector('.item-select-tax');
    const inputNote = card.querySelector('.item-input-note');
    const displayTotal = card.querySelector('.item-line-total');

    // ユーザー価格要素（通常明細のみ）
    const inputUserPrice = card.querySelector('.item-input-user-price');
    const btnSpinUp = card.querySelector('.btn-spin-up');
    const btnSpinDown = card.querySelector('.btn-spin-down');
    const selectPriceHistory = card.querySelector('.item-select-price-history');
    const historyInfo = card.querySelector('.user-price-history-info');
    const previewUserPrice = card.querySelector('.item-user-price-badge');
    const previewProfit = card.querySelector('.item-profit-badge');

    // 参考価格バーの更新
    const updatePreviewBar = () => {
      const refs = calcRefValues();
      if (previewUserPrice) previewUserPrice.textContent = formatCurrency(refs.refUserInc);
      if (previewProfit) previewProfit.textContent = `販売店利益 (20%): ${formatCurrency(refs.refProfit)}`;
    };

    // 履歴ドロップダウンおよび件数表示の最新化
    const refreshPriceHistories = () => {
      const currentName = (inputName ? inputName.value : item.name) || '';
      const list = getUserPriceHistoryForItem(currentName);
      if (selectPriceHistory) {
        selectPriceHistory.innerHTML = '<option value="">履歴▼</option>' + list.map(h => 
          `<option value="${h.price}">${formatCurrency(h.price)} (${h.count}回)</option>`
        ).join('');
      }
      if (historyInfo) {
        historyInfo.textContent = list.length > 0 ? `過去履歴 ${list.length}件 (上下キー/▲▼で切替)` : '過去履歴なし';
      }
      return list;
    };

    // 頻度順履歴のインデックス遷移関数 (delta: -1 で前へ、+1 で次へ)
    const stepPriceHistory = (delta) => {
      const list = refreshPriceHistories();
      if (!list || list.length === 0) {
        showToast('この商品の過去価格履歴はまだありません', 'info');
        return;
      }
      const curVal = Number(inputUserPrice.value) || 0;
      let curIdx = list.findIndex(h => h.price === curVal);

      let nextIdx = 0;
      if (curIdx === -1) {
        nextIdx = 0; // 最初は最も頻度の多い1位から開始
      } else {
        nextIdx = curIdx + delta;
        if (nextIdx < 0) nextIdx = list.length - 1;
        if (nextIdx >= list.length) nextIdx = 0;
      }

      const targetPrice = list[nextIdx].price;
      inputUserPrice.value = targetPrice;
      if (selectPriceHistory) selectPriceHistory.value = targetPrice;
      handleUserPriceChange();
      showToast(`履歴を反映 (${nextIdx + 1}/${list.length}位): ${formatCurrency(targetPrice)} (使用${list[nextIdx].count}回)`, 'info');
    };

    if (btnSpinUp) {
      btnSpinUp.addEventListener('click', (e) => {
        e.preventDefault();
        stepPriceHistory(-1);
      });
    }

    if (btnSpinDown) {
      btnSpinDown.addEventListener('click', (e) => {
        e.preventDefault();
        stepPriceHistory(1);
      });
    }

    if (selectPriceHistory) {
      selectPriceHistory.addEventListener('change', () => {
        const val = Number(selectPriceHistory.value);
        if (val > 0) {
          inputUserPrice.value = val;
          handleUserPriceChange();
          showToast(`履歴から選択: ${formatCurrency(val)}`, 'info');
        }
      });
    }

    // ユーザー税込定価変更時の自動仕切り単価計算＆反映
    const handleUserPriceChange = () => {
      if (!inputUserPrice) return;
      const uPrice = Number(inputUserPrice.value) || 0;
      const taxRate = Number(selectTax.value);

      item.userPrice = uPrice;

      if (uPrice > 0) {
        // 販売店利益20%ルールに基づいて税抜仕切り単価を自動逆算
        const res = calculateWholesalePrice(uPrice, taxRate);
        item.unitPrice = res.wholesaleUnitPriceEx;
        inputPrice.value = res.wholesaleUnitPriceEx;

        // 品名があればユーザー価格履歴に記録
        if (item.name) {
          recordUserPrice(item.name, uPrice);
        }
      }

      updatePreviewBar();
      displayTotal.textContent = formatCurrency((Number(inputQty.value) || 0) * (Number(item.unitPrice) || 0));
      renderAll();
    };

    if (inputUserPrice) {
      inputUserPrice.addEventListener('input', handleUserPriceChange);
      // 上下キー（ArrowUp / ArrowDown）で過去履歴（頻度順）を切り替え
      inputUserPrice.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          stepPriceHistory(-1);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          stepPriceHistory(1);
        }
      });
    }

    // 基本項目の変更イベント
    const handleItemChange = () => {
      item.name = inputName.value;
      if (inputDescription) item.description = inputDescription.value;
      item.quantity = Number(inputQty.value) || 0;
      item.unit = inputUnit.value;
      item.unitPrice = Number(inputPrice.value) || 0;
      item.taxRate = Number(selectTax.value);
      if (inputNote) item.note = inputNote.value;

      displayTotal.textContent = formatCurrency(item.quantity * item.unitPrice);
      updatePreviewBar();
      refreshPriceHistories();
      renderAll();
    };

    inputName.addEventListener('input', handleItemChange);
    if (inputDescription) inputDescription.addEventListener('input', handleItemChange);
    inputQty.addEventListener('input', handleItemChange);
    inputUnit.addEventListener('input', handleItemChange);
    inputPrice.addEventListener('input', handleItemChange);
    selectTax.addEventListener('change', () => {
      if (inputUserPrice && Number(inputUserPrice.value) > 0) {
        handleUserPriceChange();
      } else {
        handleItemChange();
      }
    });
    if (inputNote) inputNote.addEventListener('input', handleItemChange);

    DOM.itemsContainer.appendChild(card);
  });
}

// ==========================================================================
// イベントリスナー初期化
// ==========================================================================
function setupEventListeners() {
  // 書類種別の切り替え
  DOM.docTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      currentDoc.docType = type;
      DOM.docTypeBtns.forEach(b => b.classList.toggle('active', b === btn));
      // 書類番号をその種別のプレフィックスで再採番
      currentDoc.docNumber = generateDocNumber(type);
      DOM.inputDocNumber.value = currentDoc.docNumber;
      renderAll();
      showToast(`「${DOC_TYPES[type].label}」に切り替えました`);
    });
  });

  // エディタタブ切り替え
  DOM.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;
      DOM.tabBtns.forEach(b => b.classList.toggle('active', b === btn));
      DOM.tabPanes.forEach(p => {
        p.style.display = (p.id === targetId) ? 'block' : 'none';
      });
    });
  });

  // 書類番号の再採番
  if (DOM.btnRegenDocNumber) {
    DOM.btnRegenDocNumber.addEventListener('click', () => {
      currentDoc.docNumber = generateDocNumber(currentDoc.docType);
      if (DOM.inputDocNumber) DOM.inputDocNumber.value = currentDoc.docNumber;
      renderAll();
      showToast('新しい書類番号を採番しました');
    });
  }

  // 入力フォームの同期
  const bindInput = (el, setter) => {
    if (!el) return;
    el.addEventListener('input', (e) => {
      setter(e.target.value);
      renderAll();
    });
  };

  bindInput(DOM.inputDocNumber, val => currentDoc.docNumber = val);
  bindInput(DOM.inputIssueDate, val => currentDoc.issueDate = val);
  bindInput(DOM.inputDueDate, val => currentDoc.dueDate = val);
  bindInput(DOM.inputTitle, val => currentDoc.title = val);

  bindInput(DOM.inputClientName, val => currentDoc.client.name = val);
  if (DOM.inputClientHonorific) {
    DOM.inputClientHonorific.addEventListener('change', e => {
      currentDoc.client.honorific = e.target.value;
      renderAll();
    });
  }
  bindInput(DOM.inputClientZip, val => currentDoc.client.zip = val);
  bindInput(DOM.inputClientAddress, val => currentDoc.client.address = val);
  bindInput(DOM.inputClientContact, val => currentDoc.client.contactPerson = val);

  bindInput(DOM.inputIssuerName, val => currentDoc.issuer.name = val);
  bindInput(DOM.inputIssuerInvoiceNo, val => currentDoc.issuer.invoiceNumber = val);
  bindInput(DOM.inputIssuerZip, val => currentDoc.issuer.zip = val);
  bindInput(DOM.inputIssuerTel, val => currentDoc.issuer.tel = val);
  bindInput(DOM.inputIssuerFax, val => currentDoc.issuer.fax = val);
  bindInput(DOM.inputIssuerAddress, val => currentDoc.issuer.address = val);
  bindInput(DOM.inputIssuerEmail, val => currentDoc.issuer.email = val);
  bindInput(DOM.inputBankInfo, val => {
    if (!currentDoc.issuer) currentDoc.issuer = {};
    currentDoc.issuer.bankInfo = val;
    saveIssuerProfile({
      ...loadIssuerProfile(),
      ...currentDoc.issuer,
      bankInfo: val
    });
  });
  bindInput(DOM.inputNotes, val => currentDoc.notes = val);

  // 端数処理設定
  if (DOM.selectFractionRule) {
    DOM.selectFractionRule.addEventListener('change', e => {
      currentDoc.taxFractionRule = e.target.value;
      renderAll();
    });
  }

  // 明細追加ボタン
  if (DOM.btnAddItem) {
    DOM.btnAddItem.addEventListener('click', () => {
      currentDoc.items.push({
        id: 'item_' + Date.now(),
        name: '',
        quantity: 1,
        unit: '式',
        unitPrice: 0,
        taxRate: 10,
        note: ''
      });
      renderItemInputCards();
      renderAll();
    });
  }

  // 定型文挿入ボタン
  if (DOM.btnInsertTemplateNote) {
    DOM.btnInsertTemplateNote.addEventListener('click', () => {
      const defaultNotes = 'お振込手数料は貴社にてご負担くださいますようお願い申し上げます。\nご不明な点がございましたらお気軽にお問い合わせください。';
      if (DOM.inputNotes) DOM.inputNotes.value = defaultNotes;
      currentDoc.notes = defaultNotes;
      renderAll();
      showToast('備考欄に定型文を挿入しました');
    });
  }

  // 印鑑の表示トグル
  if (DOM.checkShowStamp) {
    DOM.checkShowStamp.addEventListener('change', e => {
      currentDoc.issuer.showStamp = e.target.checked;
      renderAll();
    });
  }

  // 印鑑自動生成
  if (DOM.btnAutoGenerateStamp) {
    DOM.btnAutoGenerateStamp.addEventListener('click', () => {
      const name = currentDoc.issuer?.name?.trim() || '社印';
      const stampUrl = generateCompanyStamp(name);
      currentDoc.issuer.stampDataUrl = stampUrl;
      currentDoc.issuer.showStamp = true;
      if (DOM.checkShowStamp) DOM.checkShowStamp.checked = true;
      updateStampThumbnail(stampUrl);
      renderAll();
      showToast(`「${name}」の角印スタンプを生成しました！`, 'success');
    });
  }

  // 印鑑画像アップロード
  if (DOM.fileStampUpload) {
    DOM.fileStampUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        currentDoc.issuer.stampDataUrl = dataUrl;
        currentDoc.issuer.showStamp = true;
        if (DOM.checkShowStamp) DOM.checkShowStamp.checked = true;
        updateStampThumbnail(dataUrl);
        renderAll();
        showToast('印鑑画像をアップロードしました', 'success');
      };
      reader.readAsDataURL(file);
    });
  }

  // テーマカラー変更
  if (DOM.colorDotBtns) {
    DOM.colorDotBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        updateThemeColor(color);
        currentDoc.themeColor = color;
        renderAll();
      });
    });
  }

  // 確定発行（財務会計へ反映）
  if (DOM.btnIssueDoc) {
    DOM.btnIssueDoc.addEventListener('click', () => {
      issueAndSyncAccountingDocument({ isPrint: false, isExplicitIssue: true });
    });
  }

  // 確定取消（下書きに戻す・財務会計から除外）
  if (DOM.btnCancelIssueDoc) {
    DOM.btnCancelIssueDoc.addEventListener('click', () => {
      cancelCurrentDocIssue();
    });
  }
  if (DOM.btnSidebarCancelIssue) {
    DOM.btnSidebarCancelIssue.addEventListener('click', () => {
      cancelCurrentDocIssue();
    });
  }

  // 印刷・PDF保存（同時に財務会計にも即時反映）
  if (DOM.btnPrint) {
    DOM.btnPrint.addEventListener('click', () => {
      issueAndSyncAccountingDocument({ isPrint: true, isExplicitIssue: true });
    });
  }

  // 履歴に保存（財務会計にも即時反映）
  if (DOM.btnSaveHistory) {
    DOM.btnSaveHistory.addEventListener('click', () => {
      issueAndSyncAccountingDocument({ isPrint: false, isExplicitIssue: false });
    });
  }

  // 新規作成
  if (DOM.btnNewDoc) {
    DOM.btnNewDoc.addEventListener('click', () => {
      if (confirm('新しく白紙の書類を作成しますか？\n（件名・取引先・明細がクリアされます）')) {
        const profile = loadIssuerProfile() || currentDoc.issuer; // 自社情報はプロファイルから確実に引き継ぐ
        const targetType = currentDoc?.docType || 'invoice';
        currentDoc = createEmptyInvoice(targetType);
        if (profile) {
          currentDoc.issuer = { ...profile };
        }
        saveActiveDoc(currentDoc);
        populateFormFromDoc();
        renderAll();
        showToast('白紙の新規書類を作成しました（件名・取引先・明細は空白です）');
      }
    });
  }

  // サンプル読込（存在する場合のみ登録）
  if (DOM.btnLoadSample) {
    DOM.btnLoadSample.addEventListener('click', () => {
      const targetType = currentDoc.docType === 'delivery' ? 'delivery' : 'invoice';
      const sample = SAMPLE_DOCUMENTS[targetType] || SAMPLE_DOCUMENTS.invoice;
      currentDoc = JSON.parse(JSON.stringify(sample));
      currentDoc.issuer.stampDataUrl = generateCompanyStamp(currentDoc.issuer.name);
      populateFormFromDoc();
      updateThemeColor(currentDoc.themeColor || 'indigo');
      renderAll();
      showToast('サンプルデータを読み込みました');
    });
  }

  // 履歴モーダル制御
  if (DOM.btnOpenHistory) {
    DOM.btnOpenHistory.addEventListener('click', openHistoryModal);
  }
  if (DOM.btnCloseHistoryModal) {
    DOM.btnCloseHistoryModal.addEventListener('click', closeHistoryModal);
  }
  if (DOM.btnCloseHistoryModal2) {
    DOM.btnCloseHistoryModal2.addEventListener('click', closeHistoryModal);
  }
  if (DOM.historyModal) {
    DOM.historyModal.addEventListener('click', (e) => {
      if (e.target === DOM.historyModal) closeHistoryModal();
    });
  }

  // バックアップモーダル制御
  if (DOM.btnOpenBackup) {
    DOM.btnOpenBackup.addEventListener('click', openBackupModal);
  }
  if (DOM.btnCloseBackupModal) {
    DOM.btnCloseBackupModal.addEventListener('click', closeBackupModal);
  }
  if (DOM.btnCloseBackupModal2) {
    DOM.btnCloseBackupModal2.addEventListener('click', closeBackupModal);
  }
  if (DOM.backupModal) {
    DOM.backupModal.addEventListener('click', (e) => {
      if (e.target === DOM.backupModal) closeBackupModal();
    });
  }

  // JSONエクスポート
  if (DOM.btnExportJSON) {
    DOM.btnExportJSON.addEventListener('click', () => {
      exportDataAsJSON();
      showToast('バックアップJSONをダウンロードしました', 'success');
    });
  }

  // JSONインポート
  if (DOM.fileImportJSON) {
    DOM.fileImportJSON.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = importDataFromJSON(event.target.result);
        if (result.success) {
          if (result.activeDoc) {
            currentDoc = result.activeDoc;
            populateFormFromDoc();
            renderAll();
          }
          closeBackupModal();
          showToast('データを正常に復元しました！', 'success');
        } else {
          alert('読み込みに失敗しました: ' + result.error);
        }
      };
      reader.readAsText(file);
    });
  }

  // 商品マスタモーダル制御
  if (DOM.btnOpenItemMaster) {
    DOM.btnOpenItemMaster.addEventListener('click', openItemMasterModal);
  }
  if (DOM.btnOpenItemSelectModal) {
    DOM.btnOpenItemSelectModal.addEventListener('click', openItemMasterModal);
  }
  if (DOM.btnCloseItemMasterModal) {
    DOM.btnCloseItemMasterModal.addEventListener('click', closeItemMasterModal);
  }
  if (DOM.btnCloseItemMasterModal2) {
    DOM.btnCloseItemMasterModal2.addEventListener('click', closeItemMasterModal);
  }
  if (DOM.itemMasterModal) {
    DOM.itemMasterModal.addEventListener('click', (e) => {
      if (e.target === DOM.itemMasterModal) closeItemMasterModal();
    });
  }

  if (DOM.inputSearchItemMaster) {
    DOM.inputSearchItemMaster.addEventListener('input', () => {
      renderItemMasterList(DOM.inputSearchItemMaster.value);
    });
  }

  if (DOM.btnToggleNewItemForm) {
    DOM.btnToggleNewItemForm.addEventListener('click', () => {
      toggleItemMasterForm();
    });
  }

  if (DOM.btnCancelItemMasterForm) {
    DOM.btnCancelItemMasterForm.addEventListener('click', () => {
      resetItemMasterForm();
    });
  }

  // 商品マスタ内の仕切り価格・税抜単価自動計算アシスト
  if (DOM.calcInputUserPriceInc) {
    DOM.calcInputUserPriceInc.addEventListener('input', () => updateMasterCalculator(true));
  }
  if (DOM.itemMasterSelectTax) {
    DOM.itemMasterSelectTax.addEventListener('change', () => {
      if (DOM.calcInputUserPriceInc && DOM.calcInputUserPriceInc.value.trim() !== '') {
        updateMasterCalculator(true);
      }
    });
  }
  if (DOM.calcModeWholesale) {
    DOM.calcModeWholesale.addEventListener('change', () => updateMasterCalculator(true));
  }
  if (DOM.calcModeStandard) {
    DOM.calcModeStandard.addEventListener('change', () => updateMasterCalculator(true));
  }
  if (DOM.btnApplyCalcPrice) {
    DOM.btnApplyCalcPrice.addEventListener('click', applyMasterCalculatedPrice);
  }

  // 商品マスタ保存
  if (DOM.btnSaveItemMasterForm) {
    DOM.btnSaveItemMasterForm.addEventListener('click', handleSaveItemMaster);
  }

  // 取引先マスタ制御
  if (DOM.btnOpenClientMaster) {
    DOM.btnOpenClientMaster.addEventListener('click', () => openClientMasterModal('customer'));
  }
  if (DOM.btnSelectClientFromMaster) {
    DOM.btnSelectClientFromMaster.addEventListener('click', () => openClientMasterModal('customer'));
  }
  if (DOM.btnCloseClientMasterModal) {
    DOM.btnCloseClientMasterModal.addEventListener('click', closeClientMasterModal);
  }
  if (DOM.btnCloseClientMasterModal2) {
    DOM.btnCloseClientMasterModal2.addEventListener('click', closeClientMasterModal);
  }
  if (DOM.clientMasterModal) {
    DOM.clientMasterModal.addEventListener('click', (e) => {
      if (e.target === DOM.clientMasterModal) closeClientMasterModal();
    });
  }
  if (DOM.inputSearchClientMaster) {
    DOM.inputSearchClientMaster.addEventListener('input', () => {
      renderClientMasterList(currentClientFilter, DOM.inputSearchClientMaster.value);
    });
  }
  if (DOM.clientFilterBtns) {
    DOM.clientFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.clientFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentClientFilter = btn.dataset.filter || 'all';
        renderClientMasterList(currentClientFilter, DOM.inputSearchClientMaster?.value || '');
      });
    });
  }
  if (DOM.btnToggleNewClientForm) {
    DOM.btnToggleNewClientForm.addEventListener('click', () => toggleNewClientForm());
  }
  if (DOM.btnCancelClientMasterForm) {
    DOM.btnCancelClientMasterForm.addEventListener('click', resetClientMasterForm);
  }
  if (DOM.btnSaveClientMasterForm) {
    DOM.btnSaveClientMasterForm.addEventListener('click', handleSaveClientMaster);
  }
  if (DOM.inputClientName) {
    DOM.inputClientName.addEventListener('change', handleClientNameAutocomplete);
  }
  if (DOM.expenseInputPayee) {
    DOM.expenseInputPayee.addEventListener('change', () => {
      const val = DOM.expenseInputPayee.value.trim();
      if (!val) return;
      const matched = findClientByName(val);
      if (matched && matched.invoiceNumber && DOM.expenseInputInvoiceNum && !DOM.expenseInputInvoiceNum.value) {
        DOM.expenseInputInvoiceNum.value = matched.invoiceNumber;
        showToast(`マスタから「${matched.name}」のインボイス番号を自動反映しました`, 'info');
      }
    });
  }

  // 在庫マスタモーダル制御
  if (DOM.btnOpenInventoryMaster) {
    DOM.btnOpenInventoryMaster.addEventListener('click', openInventoryMasterModal);
  }
  if (DOM.btnPortalOpenInventoryMaster) {
    DOM.btnPortalOpenInventoryMaster.addEventListener('click', openInventoryMasterModal);
  }
  if (DOM.btnCloseInventoryMasterModal) {
    DOM.btnCloseInventoryMasterModal.addEventListener('click', closeInventoryMasterModal);
  }
  if (DOM.btnCloseInventoryMasterModal2) {
    DOM.btnCloseInventoryMasterModal2.addEventListener('click', closeInventoryMasterModal);
  }
  if (DOM.inventoryMasterModal) {
    DOM.inventoryMasterModal.addEventListener('click', (e) => {
      if (e.target === DOM.inventoryMasterModal) closeInventoryMasterModal();
    });
  }
  if (DOM.inputSearchInventory) {
    DOM.inputSearchInventory.addEventListener('input', () => {
      renderInventoryTable();
    });
  }
  if (DOM.selectInventoryFilter) {
    DOM.selectInventoryFilter.addEventListener('change', () => {
      renderInventoryTable();
    });
  }
  if (DOM.btnToggleNewInventoryForm) {
    DOM.btnToggleNewInventoryForm.addEventListener('click', () => {
      toggleInventoryForm(false);
    });
  }
  if (DOM.btnCancelInventoryForm) {
    DOM.btnCancelInventoryForm.addEventListener('click', resetInventoryForm);
  }
  if (DOM.btnSaveInventoryItem) {
    DOM.btnSaveInventoryItem.addEventListener('click', saveInventoryItemHandler);
  }
  if (DOM.btnSyncInventoryWithItems) {
    DOM.btnSyncInventoryWithItems.addEventListener('click', () => {
      const res = syncInventoryWithItemsMaster();
      renderInventoryTable();
      populateExpenseInventoryDropdown();
      if (res.addedCount > 0) {
        showToast(`商品マスタから ${res.addedCount}件 の商品を在庫品目として取り込みました！`, 'success');
      } else {
        showToast('商品マスタの商品はすべて在庫マスタに連携済みです。', 'info');
      }
    });
  }

  // クイック入出庫調整モーダル制御
  if (DOM.btnCloseAdjustModal) {
    DOM.btnCloseAdjustModal.addEventListener('click', closeInventoryAdjustModal);
  }
  if (DOM.btnCancelAdjust) {
    DOM.btnCancelAdjust.addEventListener('click', closeInventoryAdjustModal);
  }
  if (DOM.btnConfirmAdjust) {
    DOM.btnConfirmAdjust.addEventListener('click', confirmAdjustHandler);
  }
  if (DOM.adjustInputQty) {
    DOM.adjustInputQty.addEventListener('input', updateAdjustSimulation);
  }
  const adjustRadios = document.getElementsByName('adjustActionType');
  adjustRadios.forEach(r => {
    r.addEventListener('change', updateAdjustSimulation);
  });

  // 在庫履歴モーダル制御
  if (DOM.btnCloseInventoryHistoryModal) {
    DOM.btnCloseInventoryHistoryModal.addEventListener('click', closeInventoryHistoryModal);
  }
  if (DOM.btnCloseInventoryHistoryModal2) {
    DOM.btnCloseInventoryHistoryModal2.addEventListener('click', closeInventoryHistoryModal);
  }

  // 経費・仕入切り替えトグル＆在庫連動の初期化
  initExpensePurchaseToggle();

  // 値引きモーダル制御
  if (DOM.btnOpenDiscountModal) {
    DOM.btnOpenDiscountModal.addEventListener('click', openDiscountModal);
  }
  if (DOM.btnCloseDiscountModal) {
    DOM.btnCloseDiscountModal.addEventListener('click', closeDiscountModal);
  }
  if (DOM.btnCloseDiscountModal2) {
    DOM.btnCloseDiscountModal2.addEventListener('click', closeDiscountModal);
  }
  if (DOM.discountModal) {
    DOM.discountModal.addEventListener('click', (e) => {
      if (e.target === DOM.discountModal) closeDiscountModal();
    });
  }

  // 値引き計算アシスト
  if (DOM.discountBaseUserPriceInc) {
    DOM.discountBaseUserPriceInc.addEventListener('input', updateDiscountCalculator);
  }
  if (DOM.discountSelectType) {
    DOM.discountSelectType.addEventListener('change', () => {
      const type = DOM.discountSelectType.value;
      if (type === 'percent') {
        DOM.discountInputValue.placeholder = '例: 10 (%)';
      } else if (type === 'amount') {
        DOM.discountInputValue.placeholder = '例: 5000 (円)';
      } else {
        DOM.discountInputValue.placeholder = '例: 3000 (税抜仕切り直接指定)';
      }
      updateDiscountCalculator();
    });
  }
  if (DOM.discountInputValue) {
    DOM.discountInputValue.addEventListener('input', updateDiscountCalculator);
  }
  if (DOM.discountSelectTaxRate) {
    DOM.discountSelectTaxRate.addEventListener('change', updateDiscountCalculator);
  }

  // 値引き行の明細追加
  if (DOM.btnAddDiscountToItems) {
    DOM.btnAddDiscountToItems.addEventListener('click', handleAddDiscountToItems);
  }

  // 会計・収支ダッシュボード画面制御
  if (DOM.btnOpenAccounting) {
    DOM.btnOpenAccounting.addEventListener('click', openAccountingModal);
  }
  if (DOM.btnCloseAccountingModal) {
    DOM.btnCloseAccountingModal.addEventListener('click', closeAccountingModal);
  }
  if (DOM.btnCloseAccountingModal2) {
    DOM.btnCloseAccountingModal2.addEventListener('click', closeAccountingModal);
  }

  // 会計タブ切り替え
  if (DOM.accTabBtns) {
    DOM.accTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        switchAccountingTab(tab);
      });
    });
  }

  // 会計期間（月）切り替え
  if (DOM.accSelectMonth) {
    DOM.accSelectMonth.addEventListener('change', () => {
      renderAccountingDashboard(DOM.accSelectMonth.value);
      renderAccountingJournals();
    });
  }

  // 売上消込フィルター
  if (DOM.btnFilterAllInvoices) {
    DOM.btnFilterAllInvoices.addEventListener('click', () => filterSalesTable('all'));
  }
  if (DOM.btnFilterUnpaidInvoices) {
    DOM.btnFilterUnpaidInvoices.addEventListener('click', () => filterSalesTable('unpaid'));
  }
  if (DOM.btnFilterPaidInvoices) {
    DOM.btnFilterPaidInvoices.addEventListener('click', () => filterSalesTable('paid'));
  }

  // 請求書詳細・直接編集モーダル制御
  if (DOM.btnCloseIqeModal) {
    DOM.btnCloseIqeModal.addEventListener('click', closeInvoiceQuickEditModal);
  }
  if (DOM.btnCancelIqeModal) {
    DOM.btnCancelIqeModal.addEventListener('click', closeInvoiceQuickEditModal);
  }
  if (DOM.btnSaveIqeModal) {
    DOM.btnSaveIqeModal.addEventListener('click', saveInvoiceQuickEditHandler);
  }
  if (DOM.btnIqeAddItem) {
    DOM.btnIqeAddItem.addEventListener('click', () => {
      currentIqeItems.push({
        id: 'item_' + Date.now(),
        name: '',
        quantity: 1,
        unit: '個',
        unitPrice: 0,
        taxRate: 10,
        note: ''
      });
      renderIqeItemsTable();
    });
  }
  if (DOM.btnIqeCancelIssue) {
    DOM.btnIqeCancelIssue.addEventListener('click', () => {
      if (!currentIqeDoc) return;
      const docId = DOM.iqeDocId ? DOM.iqeDocId.value : currentIqeDoc.id;
      const docNo = currentIqeDoc.docNumber || 'この書類';
      if (!confirm(`伝票「${docNo}」の確定発行を取り消しますか？\n\n【取り消しの効果】\n・売上消込台帳・P/Lダッシュボード・仕訳帳から即座に除外されます。\n・書類データは削除されず、下書き状態に戻ります。`)) {
        return;
      }
      cancelDocIssue(docId);
      if (currentDoc && currentDoc.id === docId) {
        currentDoc.isIssued = false;
        currentDoc.isCancelled = true;
        currentDoc.issuedAt = null;
        saveActiveDoc(currentDoc);
        renderAll();
      }
      initAccountingMonthSelector();
      renderAccountingSales(currentSalesFilter);
      renderAccountingDashboard(DOM.accSelectMonth ? DOM.accSelectMonth.value : '');
      renderAccountingJournals();
      closeInvoiceQuickEditModal();
      showToast(`伝票「${docNo}」の確定発行を取り消しました（財務会計から除外されました）`, 'warning');
    });
  }
  if (DOM.btnIqeOpenInEditor) {
    DOM.btnIqeOpenInEditor.addEventListener('click', () => {
      if (!currentIqeDoc) return;
      const docId = DOM.iqeDocId ? DOM.iqeDocId.value : currentIqeDoc.id;
      const full = getDocFromHistory(docId) || currentIqeDoc;
      currentDoc = JSON.parse(JSON.stringify(full));
      saveActiveDoc(currentDoc);
      populateFormFromDoc();
      updateThemeColor(currentDoc.themeColor || 'indigo');
      renderAll();
      closeInvoiceQuickEditModal();
      switchAppView('invoice');
      showToast(`伝票「${currentDoc.docNumber || ''}」を納品請求書エディタで開きました`, 'success');
    });
  }
  if (DOM.invoiceQuickEditModal) {
    DOM.invoiceQuickEditModal.addEventListener('click', (e) => {
      if (e.target === DOM.invoiceQuickEditModal) closeInvoiceQuickEditModal();
    });
  }

  // レシート画像アップロード・ドラッグ＆ドロップ
  initReceiptUploadHandlers();

  // 経費フォーム制御
  if (DOM.formExpenseInput) {
    DOM.formExpenseInput.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSaveExpense();
    });
  }
  if (DOM.btnSaveExpense) {
    DOM.btnSaveExpense.addEventListener('click', handleSaveExpense);
  }
  if (DOM.btnResetExpenseForm) {
    DOM.btnResetExpenseForm.addEventListener('click', resetExpenseForm);
  }
  if (DOM.btnClearReceiptImage) {
    DOM.btnClearReceiptImage.addEventListener('click', clearReceiptImage);
  }

  // レシート画像 拡大モーダル制御
  if (DOM.btnZoomReceiptImage) {
    DOM.btnZoomReceiptImage.addEventListener('click', () => {
      if (currentReceiptDataUrl) openReceiptZoom(currentReceiptDataUrl);
    });
  }
  if (DOM.receiptImageScrollBox) {
    DOM.receiptImageScrollBox.addEventListener('click', () => {
      if (currentReceiptDataUrl) openReceiptZoom(currentReceiptDataUrl);
    });
  }
  if (DOM.btnCloseReceiptZoom) {
    DOM.btnCloseReceiptZoom.addEventListener('click', closeReceiptZoom);
  }
  if (DOM.receiptZoomModal) {
    DOM.receiptZoomModal.addEventListener('click', (e) => {
      if (e.target === DOM.receiptZoomModal) closeReceiptZoom();
    });
  }

  // ウィンドウへのファイル誤ドロップによるブラウザ遷移を防止
  window.addEventListener('dragover', (e) => e.preventDefault(), false);
  window.addEventListener('drop', (e) => e.preventDefault(), false);

  // 仕訳CSVエクスポート
  if (DOM.btnExportJournalCSV) {
    DOM.btnExportJournalCSV.addEventListener('click', handleExportJournalCSV);
  }

  // 勤怠打刻（タイムカード）画面制御
  if (DOM.btnOpenAttendance) {
    DOM.btnOpenAttendance.addEventListener('click', openAttendanceModal);
  }
  if (DOM.btnCloseAttendanceModal) {
    DOM.btnCloseAttendanceModal.addEventListener('click', closeAttendanceModal);
  }
  if (DOM.btnCloseAttendanceModal2) {
    DOM.btnCloseAttendanceModal2.addEventListener('click', closeAttendanceModal);
  }

  // 出勤・退勤打刻ボタン
  if (DOM.btnClockIn) {
    DOM.btnClockIn.addEventListener('click', handleClockIn);
  }
  if (DOM.btnClockOut) {
    DOM.btnClockOut.addEventListener('click', handleClockOut);
  }

  // 勤怠CSVエクスポート
  if (DOM.btnExportAttendanceCSV) {
    DOM.btnExportAttendanceCSV.addEventListener('click', () => {
      exportAttendanceToCSV(getAttendanceList(), currentSheetYM);
      showToast('勤怠集計CSVをダウンロードしました！', 'success');
    });
  }

  // 打刻漏れ手動入力フォーム制御
  if (DOM.btnToggleManualAttendanceForm) {
    DOM.btnToggleManualAttendanceForm.addEventListener('click', () => toggleManualAttendanceForm());
  }
  if (DOM.btnCloseAttendanceManualForm) {
    DOM.btnCloseAttendanceManualForm.addEventListener('click', () => toggleManualAttendanceForm(false));
  }
  if (DOM.btnCancelAttendanceManual) {
    DOM.btnCancelAttendanceManual.addEventListener('click', () => toggleManualAttendanceForm(false));
  }
  if (DOM.btnSaveAttendanceManual) {
    DOM.btnSaveAttendanceManual.addEventListener('click', handleSaveManualAttendance);
  }

  // 出勤簿（A4帳票）モーダル制御
  if (DOM.btnOpenAttendanceSheetModal) {
    DOM.btnOpenAttendanceSheetModal.addEventListener('click', () => openAttendanceSheetModal());
  }
  const btnOpenAttendanceSheetScreen = document.getElementById('btnOpenAttendanceSheetScreen');
  if (btnOpenAttendanceSheetScreen) {
    btnOpenAttendanceSheetScreen.addEventListener('click', () => openAttendanceSheetModal());
  }
  if (DOM.btnCloseAttendanceSheetModal) {
    DOM.btnCloseAttendanceSheetModal.addEventListener('click', closeAttendanceSheetModal);
  }
  if (DOM.btnCloseAttendanceSheetModal2) {
    DOM.btnCloseAttendanceSheetModal2.addEventListener('click', closeAttendanceSheetModal);
  }
  if (DOM.attendanceSheetModal) {
    DOM.attendanceSheetModal.addEventListener('click', (e) => {
      if (e.target === DOM.attendanceSheetModal) closeAttendanceSheetModal();
    });
  }
  if (DOM.btnPrevSheetMonth) {
    DOM.btnPrevSheetMonth.addEventListener('click', () => changeSheetMonth(-1));
  }
  if (DOM.btnNextSheetMonth) {
    DOM.btnNextSheetMonth.addEventListener('click', () => changeSheetMonth(1));
  }
  if (DOM.sheetMonthSelector) {
    DOM.sheetMonthSelector.addEventListener('change', (e) => {
      if (e.target.value) {
        currentSheetYM = e.target.value;
        renderAttendanceCalendarSheet(currentSheetYM);
      }
    });
  }
  if (DOM.btnPrintAttendanceSheet) {
    DOM.btnPrintAttendanceSheet.addEventListener('click', handlePrintAttendanceSheet);
  }

  // 社員番号・氏名の編集保存
  if (DOM.inputSheetEmpNo) {
    DOM.inputSheetEmpNo.addEventListener('change', () => {
      saveAttendanceEmployee({ empNo: DOM.inputSheetEmpNo.value });
    });
  }
  if (DOM.inputSheetEmpName) {
    DOM.inputSheetEmpName.addEventListener('change', () => {
      saveAttendanceEmployee({ empName: DOM.inputSheetEmpName.value });
    });
  }
}

// ==========================================================================
// テーマカラー更新
// ==========================================================================
function updateThemeColor(colorKey) {
  const theme = THEME_COLORS[colorKey] || THEME_COLORS.indigo;
  const root = document.documentElement;

  root.style.setProperty('--theme-primary', theme.primary);
  root.style.setProperty('--theme-primary-light', theme.primaryLight);
  root.style.setProperty('--theme-primary-dark', theme.primaryDark);
  root.style.setProperty('--theme-accent', theme.accent);

  DOM.colorDotBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === colorKey);
  });
}

// ==========================================================================
// 印鑑サムネイル更新
// ==========================================================================
function updateStampThumbnail(dataUrl) {
  if (dataUrl) {
    DOM.stampPreviewThumb.innerHTML = `<img src="${dataUrl}" style="width: 100%; height: 100%; object-fit: contain;">`;
  } else {
    DOM.stampPreviewThumb.innerHTML = `<span style="font-size: 0.7rem; color: var(--text-muted);">プレビュー</span>`;
  }
}

// ==========================================================================
// 履歴モーダル表示
// ==========================================================================
function openHistoryModal() {
  const list = getHistoryList();
  DOM.historyListContainer.innerHTML = '';

  if (list.length === 0) {
    DOM.historyListContainer.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 40px 0;">
        <p>保存された履歴はありません。</p>
        <p style="font-size: 0.8rem; margin-top: 6px;">編集画面の「履歴に保存」ボタンを押すとここに記録されます。</p>
      </div>
    `;
  } else {
    list.forEach(item => {
      const typeMeta = DOC_TYPES[item.docType] || DOC_TYPES.invoice;
      const isIssued = !!(item.isIssued && !item.isCancelled);
      const card = document.createElement('div');
      card.style.cssText = `
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #ffffff;
        transition: background 0.15s;
      `;

      const statusBadge = isIssued
        ? `<span style="background: #dcfce7; color: #166534; font-weight: 700; font-size: 0.725rem; padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;" title="財務会計（売上・売掛金消込・仕訳帳）に反映中"><span style="font-size: 7px;">●</span> 確定発行済</span>`
        : `<span style="background: #f1f5f9; color: #64748b; font-weight: 600; font-size: 0.725rem; padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;" title="未確定（下書き）のため財務会計には未反映です"><span style="font-size: 7px;">●</span> 下書き</span>`;

      const cancelIssueBtnHtml = isIssued
        ? `<button type="button" class="btn btn-outline-danger btn-sm btn-cancel-issue" style="color: #ef4444; border-color: #fca5a5; font-size: 0.775rem; padding: 4px 9px;" title="確定発行を取り消し、財務会計から除外して下書きに戻します">確定取消</button>`
        : '';

      card.innerHTML = `
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
            <span style="background: var(--theme-primary-light); color: var(--theme-primary-dark); font-weight: 700; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px;">
              ${typeMeta.label}
            </span>
            ${statusBadge}
            <span style="font-weight: 700; font-size: 0.9rem;">${escapeHtml(item.clientName)}</span>
            <span style="font-size: 0.8rem; color: var(--text-muted); font-family: monospace;">${escapeHtml(item.docNumber)}</span>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">
            件名: ${escapeHtml(item.title || '無題')} / 発行日: ${item.issueDate || '-'} / 金額: <strong>${formatCurrency(item.grandTotal || 0)}</strong>
          </div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          ${cancelIssueBtnHtml}
          <button type="button" class="btn btn-outline-primary btn-sm btn-load-doc">読み込む</button>
          <button type="button" class="btn-icon-danger btn-delete-doc" title="削除">✕</button>
        </div>
      `;

      // 確定取消ボタンのイベント
      const cancelBtn = card.querySelector('.btn-cancel-issue');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const docNo = item.docNumber || 'この書類';
          if (confirm(`「${typeMeta.label} (${docNo})」の確定発行を取り消しますか？\n\n【取り消しの効果】\n・財務会計（売上高・売掛金消込・仕訳帳）から即座に除外されます。\n・書類データは削除されず、下書き状態に戻ります。`)) {
            cancelDocIssue(item.id);

            // もし現在編集中書類が同一なら currentDoc も同期
            if (currentDoc && currentDoc.id === item.id) {
              currentDoc.isIssued = false;
              currentDoc.isCancelled = true;
              currentDoc.issuedAt = null;
              saveActiveDoc(currentDoc);
              renderAll();
            }

            // 財務会計を再同期
            initAccountingMonthSelector();
            const currentMonth = DOM.accSelectMonth ? DOM.accSelectMonth.value : '';
            renderAccountingDashboard(currentMonth);
            renderAccountingSales(currentSalesFilter);
            renderAccountingJournals();

            openHistoryModal(); // 履歴一覧を再描画
            showToast(`「${typeMeta.label}」の確定発行を取り消しました（財務会計から除外されました）`, 'warning');
          }
        });
      }

      card.querySelector('.btn-load-doc').addEventListener('click', () => {
        const full = getDocFromHistory(item.id);
        if (full) {
          currentDoc = full;
          populateFormFromDoc();
          updateThemeColor(currentDoc.themeColor || 'indigo');
          renderAll();
          closeHistoryModal();
          showToast(`「${item.clientName}」の書類を読み込みました`);
        }
      });

      card.querySelector('.btn-delete-doc').addEventListener('click', () => {
        if (confirm(`「${item.docNumber}」の履歴を削除しますか？`)) {
          deleteDocFromHistory(item.id);
          // 財務会計も再同期
          initAccountingMonthSelector();
          const currentMonth = DOM.accSelectMonth ? DOM.accSelectMonth.value : '';
          renderAccountingDashboard(currentMonth);
          renderAccountingSales(currentSalesFilter);
          renderAccountingJournals();
          openHistoryModal(); // 再描画
          showToast('履歴から削除しました');
        }
      });

      DOM.historyListContainer.appendChild(card);
    });
  }

  DOM.historyModal.classList.add('active');
}

function closeHistoryModal() {
  DOM.historyModal.classList.remove('active');
}

function openBackupModal() {
  DOM.backupModal.classList.add('active');
}

function closeBackupModal() {
  DOM.backupModal.classList.remove('active');
}

// ==========================================================================
// 商品マスタ管理 ＆ 販売店仕切り価格自動計算
// ==========================================================================
function openItemMasterModal() {
  DOM.itemMasterModal.classList.add('active');
  DOM.inputSearchItemMaster.value = '';
  resetItemMasterForm();
  renderItemMasterList();
}

function closeItemMasterModal() {
  DOM.itemMasterModal.classList.remove('active');
}

function toggleItemMasterForm(show) {
  const isHidden = DOM.itemMasterFormContainer.style.display === 'none';
  const willShow = (typeof show === 'boolean') ? show : isHidden;
  DOM.itemMasterFormContainer.style.display = willShow ? 'block' : 'none';
  DOM.btnToggleNewItemForm.style.display = willShow ? 'none' : 'inline-flex';
  if (willShow) {
    DOM.itemMasterInputName.focus();
  }
}

function resetItemMasterForm() {
  DOM.itemMasterEditId.value = '';
  DOM.itemMasterFormTitle.textContent = '新規商品の登録';
  DOM.itemMasterInputName.value = '';
  DOM.calcInputUserPriceInc.value = '';
  DOM.itemMasterInputPrice.value = '';
  DOM.itemMasterInputUnit.value = '式';
  DOM.itemMasterSelectTax.value = '10';
  DOM.itemMasterInputNote.value = '';
  updateMasterCalculator(false);
  toggleItemMasterForm(false);
}

function updateMasterCalculator(autoApply = true) {
  const userPriceInc = Number(DOM.calcInputUserPriceInc.value) || 0;
  const taxRate = Number(DOM.itemMasterSelectTax.value) || 10;
  const isWholesaleMode = DOM.calcModeWholesale ? DOM.calcModeWholesale.checked : true;

  let calculatedUnitPrice = 0;
  let wholesalePriceInc = 0;
  let profit = 0;

  if (isWholesaleMode) {
    // 1. 販売店仕切り価格の自動計算（販売店利益20%ルール）
    const res = calculateWholesalePrice(userPriceInc, taxRate);
    calculatedUnitPrice = res.wholesaleUnitPrice;
    wholesalePriceInc = res.wholesalePriceInc;
    profit = res.profit;

    if (DOM.calcDisplayUnitPrice) DOM.calcDisplayUnitPrice.textContent = formatCurrency(calculatedUnitPrice);
    if (DOM.calcPreviewSubInfo) {
      DOM.calcPreviewSubInfo.innerHTML = `(税込仕切り: <span id="calcDisplayWholesaleInc">${formatCurrency(wholesalePriceInc)}</span> / 販売店利益: <span id="calcDisplayProfit" style="color: #059669; font-weight: 600;">${formatCurrency(profit)}</span>)`;
    }
  } else {
    // 2. 通常税抜（単純除算: ユーザー税込 ÷ (1 + 税率)）
    const rateMultiplier = 1 + taxRate / 100;
    calculatedUnitPrice = userPriceInc > 0 ? Math.round(userPriceInc / rateMultiplier) : 0;
    const taxAmount = Math.max(0, userPriceInc - calculatedUnitPrice);

    if (DOM.calcDisplayUnitPrice) DOM.calcDisplayUnitPrice.textContent = formatCurrency(calculatedUnitPrice);
    if (DOM.calcPreviewSubInfo) {
      DOM.calcPreviewSubInfo.innerHTML = `(消費税額: <span>${formatCurrency(taxAmount)}</span> / 税抜定価)`;
    }
  }

  // ユーザー税込定価が入力されている場合、自動的に税抜き単価欄（itemMasterInputPrice）に即座に入力・反映
  if (autoApply && DOM.calcInputUserPriceInc.value.trim() !== '') {
    DOM.itemMasterInputPrice.value = calculatedUnitPrice > 0 ? calculatedUnitPrice : '';
  }

  return { calculatedUnitPrice, wholesalePriceInc, profit, userPriceInc, taxRate };
}

function applyMasterCalculatedPrice() {
  const userPriceInc = Number(DOM.calcInputUserPriceInc.value) || 0;
  if (userPriceInc <= 0) {
    showToast('ユーザー税込価格を入力してください', 'info');
    DOM.calcInputUserPriceInc.focus();
    return;
  }
  const res = updateMasterCalculator(true);
  showToast(`帳票の税抜単価に ${formatCurrency(res.calculatedUnitPrice)} を反映しました！`, 'success');
}

function handleSaveItemMaster() {
  const name = DOM.itemMasterInputName.value.trim();
  if (!name) {
    alert('品名・項目名を入力してください。');
    DOM.itemMasterInputName.focus();
    return;
  }

  const priceVal = DOM.itemMasterInputPrice.value;
  if (priceVal === '' || isNaN(Number(priceVal))) {
    alert('帳票の単価（税抜）を入力してください。');
    DOM.itemMasterInputPrice.focus();
    return;
  }

  const itemData = {
    name: name,
    unitPrice: Math.abs(Number(priceVal)),
    userPrice: Number(DOM.calcInputUserPriceInc.value) || 0,
    unit: DOM.itemMasterInputUnit.value.trim() || '式',
    taxRate: Number(DOM.itemMasterSelectTax.value) || 10,
    note: DOM.itemMasterInputNote.value.trim()
  };

  const editId = DOM.itemMasterEditId.value;
  if (editId) {
    itemData.id = editId;
  }

  saveItemToMaster(itemData);
  resetItemMasterForm();
  renderItemMasterList(DOM.inputSearchItemMaster.value);
  showToast(`商品「${name}」をマスタに保存しました！`, 'success');
}

function renderItemMasterList(searchQuery = '') {
  // 頻度の多い順にソートされた商品マスタを取得
  const allItems = getItemMasterList(true);
  const q = (searchQuery || '').trim().toLowerCase();

  const filtered = q
    ? allItems.filter(item => 
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.note && item.note.toLowerCase().includes(q))
      )
    : allItems;

  DOM.itemMasterListContainer.innerHTML = '';

  if (filtered.length === 0) {
    DOM.itemMasterListContainer.innerHTML = `
      <div style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 0.85rem;">
        ${q ? '検索条件に一致する商品は見つかりませんでした。' : '登録された商品がありません。「新規商品を登録」ボタンから登録してください。'}
      </div>
    `;
    return;
  }

  const usageMap = getItemMasterUsageMap();

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'master-item-card';

    // 販売店利益・税込仕切り参考計算（利益＝税込仕切り×20%、税抜ユーザー＝税抜仕切り＋利益）
    const taxRate = item.taxRate !== undefined ? item.taxRate : 10;
    const wholesaleInc = Math.round(item.unitPrice * (1 + taxRate / 100));
    const profit = Math.round(wholesaleInc * 0.20);
    const estUserEx = item.unitPrice + profit;
    const estUserPriceInc = item.userPrice || Math.round(estUserEx * (1 + taxRate / 100));

    // 使用回数の集計（マスタ記録値 ＋ 過去の書類履歴での登場回数）
    const totalUsage = (Number(item.usageCount) || 0) + (usageMap[(item.name || '').trim()] || 0);

    card.innerHTML = `
      <div class="master-item-info">
        <div class="master-item-header">
          <span class="master-item-name">${escapeHtml(item.name)}</span>
          <div style="display: flex; gap: 4px; align-items: center;">
            <span class="master-usage-badge" title="使用頻度">★ 頻度: ${totalUsage}回</span>
            <span class="badge" style="background: #f1f5f9; color: #475569; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px;">
              ${escapeHtml(item.unit || '式')} / 税率${taxRate}%
            </span>
          </div>
        </div>
        ${item.note ? `<div class="master-item-note">${escapeHtml(item.note)}</div>` : ''}
        <div class="master-item-meta" style="margin-top: 3px;">
          仕切り税込: ${formatCurrency(wholesaleInc)}
          <span style="color: #64748b; margin-left: 8px;">(想定ユーザー税込: 約${formatCurrency(estUserPriceInc)})</span>
        </div>
      </div>
      <div class="master-item-pricing">
        <div class="master-item-price">${formatCurrency(item.unitPrice)}</div>
        <div class="master-item-meta">税抜単価</div>
      </div>
      <div class="master-item-actions">
        <button type="button" class="btn btn-primary btn-sm btn-add-master-to-doc" title="この商品を伝票の明細に追加" style="padding: 4px 10px; font-size: 0.775rem;">
          ＋明細に追加
        </button>
        <button type="button" class="btn btn-secondary btn-sm btn-edit-master-item" title="編集" style="padding: 4px 8px; font-size: 0.75rem;">
          編集
        </button>
        <button type="button" class="btn-icon-danger btn-delete-master-item" title="マスタから削除" style="font-size: 0.9rem; padding: 4px;">
          ✕
        </button>
      </div>
    `;

    // 伝票へ追加（過去伝票やマスタから完全に独立したコピーオブジェクトとして追加）
    card.querySelector('.btn-add-master-to-doc').addEventListener('click', () => {
      // マスタの使用回数を記録
      recordItemMasterUsage(item.id, item.name);

      currentDoc.items.push({
        id: 'item_' + Date.now() + Math.random().toString(36).substr(2, 4),
        name: item.name,
        quantity: 1,
        unit: item.unit || '式',
        unitPrice: item.unitPrice,
        userPrice: estUserPriceInc,
        taxRate: item.taxRate !== undefined ? item.taxRate : 10,
        note: item.note || ''
      });
      renderItemInputCards();
      renderAll();
      closeItemMasterModal();
      showToast(`「${item.name}」を明細に追加しました！`, 'success');
    });

    // 編集
    card.querySelector('.btn-edit-master-item').addEventListener('click', () => {
      toggleItemMasterForm(true);
      DOM.itemMasterFormTitle.textContent = `商品の編集: ${item.name}`;
      DOM.itemMasterEditId.value = item.id;
      DOM.itemMasterInputName.value = item.name;
      DOM.itemMasterInputPrice.value = item.unitPrice;
      DOM.itemMasterInputUnit.value = item.unit || '式';
      DOM.itemMasterSelectTax.value = String(item.taxRate !== undefined ? item.taxRate : 10);
      DOM.itemMasterInputNote.value = item.note || '';
      DOM.calcInputUserPriceInc.value = estUserPriceInc;
      updateMasterCalculator(false);
      DOM.itemMasterInputName.focus();
    });

    // 削除
    card.querySelector('.btn-delete-master-item').addEventListener('click', () => {
      if (confirm(`商品マスタから「${item.name}」を削除しますか？\n※既存の作成済み伝票の明細には影響しません。`)) {
        deleteItemFromMaster(item.id);
        renderItemMasterList(DOM.inputSearchItemMaster.value);
        showToast('商品マスタから削除しました');
      }
    });

    DOM.itemMasterListContainer.appendChild(card);
  });
}

// ==========================================================================
// 取引先マスタ コントローラー
// ==========================================================================
let currentClientFilter = 'customer';

function openClientMasterModal(defaultFilter = 'customer') {
  currentClientFilter = defaultFilter;
  if (DOM.clientFilterBtns) {
    DOM.clientFilterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === currentClientFilter);
    });
  }
  if (DOM.inputSearchClientMaster) DOM.inputSearchClientMaster.value = '';
  resetClientMasterForm();
  renderClientMasterList(currentClientFilter, '');
  if (DOM.clientMasterModal) DOM.clientMasterModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeClientMasterModal() {
  if (DOM.clientMasterModal) DOM.clientMasterModal.classList.remove('active');
  document.body.style.overflow = '';
  updateClientMasterDatalist();
}

function toggleNewClientForm(show = null) {
  if (!DOM.clientMasterFormContainer) return;
  const isCurrentlyHidden = DOM.clientMasterFormContainer.style.display === 'none';
  const shouldShow = show !== null ? show : isCurrentlyHidden;

  DOM.clientMasterFormContainer.style.display = shouldShow ? 'block' : 'none';
  if (DOM.btnToggleNewClientForm) {
    DOM.btnToggleNewClientForm.innerHTML = shouldShow
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> フォームを閉じる`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 新規取引先を登録`;
  }
  if (shouldShow && DOM.clientMasterInputName) {
    DOM.clientMasterInputName.focus();
  }
}

function resetClientMasterForm() {
  if (DOM.clientMasterEditId) DOM.clientMasterEditId.value = '';
  if (DOM.clientMasterFormTitle) DOM.clientMasterFormTitle.textContent = '新規取引先の登録';
  if (DOM.clientMasterInputName) DOM.clientMasterInputName.value = '';
  if (DOM.clientMasterInputHonorific) DOM.clientMasterInputHonorific.value = '御中';
  if (DOM.clientMasterSelectCategory) DOM.clientMasterSelectCategory.value = 'customer';
  if (DOM.clientMasterInputZip) DOM.clientMasterInputZip.value = '';
  if (DOM.clientMasterInputAddress) DOM.clientMasterInputAddress.value = '';
  if (DOM.clientMasterInputContact) DOM.clientMasterInputContact.value = '';
  if (DOM.clientMasterInputTel) DOM.clientMasterInputTel.value = '';
  if (DOM.clientMasterInputEmail) DOM.clientMasterInputEmail.value = '';
  if (DOM.clientMasterInputInvoiceNum) DOM.clientMasterInputInvoiceNum.value = '';
  if (DOM.clientMasterInputClosingDay) DOM.clientMasterInputClosingDay.value = '';
  if (DOM.clientMasterInputPaymentTerms) DOM.clientMasterInputPaymentTerms.value = '';
  if (DOM.clientMasterInputNote) DOM.clientMasterInputNote.value = '';
  if (DOM.btnSaveClientMasterForm) DOM.btnSaveClientMasterForm.textContent = 'マスタに保存';
  toggleNewClientForm(false);
}

function handleSaveClientMaster() {
  const name = DOM.clientMasterInputName ? DOM.clientMasterInputName.value.trim() : '';
  if (!name) {
    alert('取引先 会社名 / 屋号を入力してください。');
    if (DOM.clientMasterInputName) DOM.clientMasterInputName.focus();
    return;
  }

  const clientData = {
    id: DOM.clientMasterEditId ? DOM.clientMasterEditId.value || undefined : undefined,
    name,
    honorific: DOM.clientMasterInputHonorific ? DOM.clientMasterInputHonorific.value : '御中',
    category: DOM.clientMasterSelectCategory ? DOM.clientMasterSelectCategory.value : 'customer',
    zip: DOM.clientMasterInputZip ? DOM.clientMasterInputZip.value.trim() : '',
    address: DOM.clientMasterInputAddress ? DOM.clientMasterInputAddress.value.trim() : '',
    contactPerson: DOM.clientMasterInputContact ? DOM.clientMasterInputContact.value.trim() : '',
    tel: DOM.clientMasterInputTel ? DOM.clientMasterInputTel.value.trim() : '',
    email: DOM.clientMasterInputEmail ? DOM.clientMasterInputEmail.value.trim() : '',
    invoiceNumber: DOM.clientMasterInputInvoiceNum ? DOM.clientMasterInputInvoiceNum.value.trim() : '',
    closingDay: DOM.clientMasterInputClosingDay ? DOM.clientMasterInputClosingDay.value.trim() : '',
    paymentTerms: DOM.clientMasterInputPaymentTerms ? DOM.clientMasterInputPaymentTerms.value.trim() : '',
    note: DOM.clientMasterInputNote ? DOM.clientMasterInputNote.value.trim() : ''
  };

  saveClientToMaster(clientData);
  resetClientMasterForm();
  renderClientMasterList(currentClientFilter, DOM.inputSearchClientMaster ? DOM.inputSearchClientMaster.value : '');
  updateClientMasterDatalist();
  showToast(`取引先「${name}」をマスタに保存しました！`, 'success');
}

function renderClientMasterList(filter = 'all', searchQuery = '') {
  if (!DOM.clientMasterListContainer) return;
  const allClients = getClientMasterList(true);
  const q = (searchQuery || '').trim().toLowerCase();

  let filtered = allClients;
  if (filter === 'customer') {
    filtered = filtered.filter(c => c.category === 'customer' || c.category === 'both');
  } else if (filter === 'vendor') {
    filtered = filtered.filter(c => c.category === 'vendor' || c.category === 'both');
  }

  if (q) {
    filtered = filtered.filter(c => 
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
      (c.invoiceNumber && c.invoiceNumber.toLowerCase().includes(q)) ||
      (c.note && c.note.toLowerCase().includes(q))
    );
  }

  DOM.clientMasterListContainer.innerHTML = '';

  if (filtered.length === 0) {
    DOM.clientMasterListContainer.innerHTML = `
      <div style="text-align: center; padding: 36px 20px; color: var(--text-muted); font-size: 0.85rem;">
        ${q ? '検索条件に一致する取引先は見つかりませんでした。' : '登録された取引先がありません。「新規取引先を登録」から追加してください。'}
      </div>
    `;
    return;
  }

  const usageMap = getClientMasterUsageMap();

  filtered.forEach(client => {
    const card = document.createElement('div');
    card.className = 'master-client-card';
    card.style.cssText = `
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    `;

    const totalUsage = (Number(client.usageCount) || 0) + (usageMap[(client.name || '').trim()] || 0);
    
    // 区分バッジ
    let catBadge = '';
    if (client.category === 'vendor') {
      catBadge = `<span style="font-size: 11px; font-weight: 700; background: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 4px;">仕入・支払先</span>`;
    } else if (client.category === 'both') {
      catBadge = `<span style="font-size: 11px; font-weight: 700; background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px;">得意先・仕入先</span>`;
    } else {
      catBadge = `<span style="font-size: 11px; font-weight: 700; background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 4px;">得意先 (売上)</span>`;
    }

    const invoiceBadge = client.invoiceNumber
      ? `<span style="font-size: 11px; font-family: monospace; background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-weight: 600;">🏷️ ${escapeHtml(client.invoiceNumber)}</span>`
      : '';

    card.innerHTML = `
      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;">
          <strong style="font-size: 1rem; color: #1e293b;">${escapeHtml(client.name)}</strong>
          <span style="font-size: 0.85rem; color: #64748b;">${escapeHtml(client.honorific || '御中')}</span>
          ${catBadge}
          ${invoiceBadge}
          <span style="font-size: 11px; color: #94a3b8; margin-left: auto;">実績: ${totalUsage}回</span>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.775rem; color: #64748b; line-height: 1.5;">
          ${client.zip || client.address ? `<span>📍 ${escapeHtml(client.zip ? `〒${client.zip} ` : '')}${escapeHtml(client.address || '')}</span>` : ''}
          ${client.contactPerson ? `<span>👤 担当: ${escapeHtml(client.contactPerson)}</span>` : ''}
          ${client.tel ? `<span>📞 ${escapeHtml(client.tel)}</span>` : ''}
          ${client.email ? `<span>✉️ ${escapeHtml(client.email)}</span>` : ''}
          ${client.closingDay || client.paymentTerms ? `<span style="color: #0284c7;">⏱ ${escapeHtml(client.closingDay ? `${client.closingDay}締` : '')}${escapeHtml(client.paymentTerms ? ` / ${client.paymentTerms}` : '')}</span>` : ''}
        </div>

        ${client.note ? `<div style="font-size: 0.725rem; color: #94a3b8; margin-top: 4px; border-left: 2px solid #cbd5e1; padding-left: 6px;">${escapeHtml(client.note)}</div>` : ''}
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-end; flex-shrink: 0;">
        <button type="button" class="btn btn-primary btn-sm btn-apply-client" style="padding: 4px 12px; font-size: 0.775rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;" title="この取引先を書類の宛先に反映">
          📄 伝票に反映
        </button>
        <div style="display: flex; gap: 4px;">
          <button type="button" class="btn btn-outline btn-xs btn-edit-client" style="font-size: 0.7rem; padding: 2px 8px;">編集</button>
          <button type="button" class="btn btn-outline btn-xs btn-danger btn-delete-client" style="font-size: 0.7rem; padding: 2px 8px;">削除</button>
        </div>
      </div>
    `;

    // 伝票へ反映
    card.querySelector('.btn-apply-client').addEventListener('click', () => {
      applyClientToDocument(client);
    });

    // 編集
    card.querySelector('.btn-edit-client').addEventListener('click', () => {
      editClientMaster(client);
    });

    // 削除
    card.querySelector('.btn-delete-client').addEventListener('click', () => {
      deleteClientMaster(client.id, client.name);
    });

    DOM.clientMasterListContainer.appendChild(card);
  });
}

function applyClientToDocument(client) {
  if (!client) return;

  // 帳票オブジェクトに反映
  currentDoc.client.name = client.name || '';
  currentDoc.client.honorific = client.honorific !== undefined ? client.honorific : '御中';
  currentDoc.client.zip = client.zip || '';
  currentDoc.client.address = client.address || '';
  currentDoc.client.contactPerson = client.contactPerson || '';

  // 入力フォームに反映
  if (DOM.inputClientName) DOM.inputClientName.value = client.name || '';
  if (DOM.inputClientHonorific) DOM.inputClientHonorific.value = client.honorific !== undefined ? client.honorific : '御中';
  if (DOM.inputClientZip) DOM.inputClientZip.value = client.zip || '';
  if (DOM.inputClientAddress) DOM.inputClientAddress.value = client.address || '';
  if (DOM.inputClientContact) DOM.inputClientContact.value = client.contactPerson || '';

  // 支払条件などの補足
  if (client.paymentTerms && !currentDoc.paymentTerms) {
    currentDoc.paymentTerms = client.paymentTerms;
    if (DOM.inputPaymentTerms) DOM.inputPaymentTerms.value = client.paymentTerms;
  }

  // 使用回数の記録
  recordClientMasterUsage(client.id, client.name);

  // プレビューと帳票状態を更新
  renderAll();
  saveActiveDoc(currentDoc);

  closeClientMasterModal();
  showToast(`取引先「${client.name}」を伝票宛先に反映しました！`, 'success');
}

function editClientMaster(client) {
  if (!client) return;
  toggleNewClientForm(true);

  if (DOM.clientMasterEditId) DOM.clientMasterEditId.value = client.id;
  if (DOM.clientMasterFormTitle) DOM.clientMasterFormTitle.textContent = `取引先の編集: ${client.name}`;
  if (DOM.clientMasterInputName) DOM.clientMasterInputName.value = client.name || '';
  if (DOM.clientMasterInputHonorific) DOM.clientMasterInputHonorific.value = client.honorific !== undefined ? client.honorific : '御中';
  if (DOM.clientMasterSelectCategory) DOM.clientMasterSelectCategory.value = client.category || 'customer';
  if (DOM.clientMasterInputZip) DOM.clientMasterInputZip.value = client.zip || '';
  if (DOM.clientMasterInputAddress) DOM.clientMasterInputAddress.value = client.address || '';
  if (DOM.clientMasterInputContact) DOM.clientMasterInputContact.value = client.contactPerson || '';
  if (DOM.clientMasterInputTel) DOM.clientMasterInputTel.value = client.tel || '';
  if (DOM.clientMasterInputEmail) DOM.clientMasterInputEmail.value = client.email || '';
  if (DOM.clientMasterInputInvoiceNum) DOM.clientMasterInputInvoiceNum.value = client.invoiceNumber || '';
  if (DOM.clientMasterInputClosingDay) DOM.clientMasterInputClosingDay.value = client.closingDay || '';
  if (DOM.clientMasterInputPaymentTerms) DOM.clientMasterInputPaymentTerms.value = client.paymentTerms || '';
  if (DOM.clientMasterInputNote) DOM.clientMasterInputNote.value = client.note || '';
  if (DOM.btnSaveClientMasterForm) DOM.btnSaveClientMasterForm.textContent = '更新内容を保存';

  DOM.clientMasterFormContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function deleteClientMaster(id, name) {
  if (confirm(`取引先「${name}」をマスタから削除しますか？\n（過去に作成した書類や経費データには影響しません）`)) {
    deleteClientFromMaster(id);
    renderClientMasterList(currentClientFilter, DOM.inputSearchClientMaster ? DOM.inputSearchClientMaster.value : '');
    updateClientMasterDatalist();
    showToast(`取引先「${name}」をマスタから削除しました`);
  }
}

/**
 * 書類入力欄のdatalistを更新
 */
function updateClientMasterDatalist() {
  if (!DOM.clientMasterDatalist) return;
  const clients = getClientMasterList(true);
  DOM.clientMasterDatalist.innerHTML = clients
    .map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.address ? ` (${c.address})` : '')}</option>`)
    .join('');
}

/**
 * 会社名手入力時のマスタ自動補完
 */
function handleClientNameAutocomplete() {
  const inputVal = DOM.inputClientName ? DOM.inputClientName.value.trim() : '';
  if (!inputVal) return;

  const matched = findClientByName(inputVal);
  if (matched && matched.name.toLowerCase() === inputVal.toLowerCase()) {
    // 一致した場合、他のフィールドを自動補完
    if (matched.honorific !== undefined) {
      DOM.inputClientHonorific.value = matched.honorific;
      currentDoc.client.honorific = matched.honorific;
    }
    if (matched.zip) {
      DOM.inputClientZip.value = matched.zip;
      currentDoc.client.zip = matched.zip;
    }
    if (matched.address) {
      DOM.inputClientAddress.value = matched.address;
      currentDoc.client.address = matched.address;
    }
    if (matched.contactPerson) {
      DOM.inputClientContact.value = matched.contactPerson;
      currentDoc.client.contactPerson = matched.contactPerson;
    }
    recordClientMasterUsage(matched.id, matched.name);
    renderAll();
    saveActiveDoc(currentDoc);
    showToast(`取引先マスタから「${matched.name}」の情報を自動反映しました`, 'info');
  }
}

// ==========================================================================
// 在庫マスタ ＆ 入出庫台帳 コントローラー
// ==========================================================================

let currentInventoryFilter = 'all';

function openInventoryMasterModal() {
  if (!DOM.inventoryMasterModal) return;
  DOM.inventoryMasterModal.classList.add('active');
  DOM.inventoryMasterModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  resetInventoryForm();
  renderInventoryTable();
}

function closeInventoryMasterModal() {
  if (!DOM.inventoryMasterModal) return;
  DOM.inventoryMasterModal.classList.remove('active');
  DOM.inventoryMasterModal.style.display = 'none';
  document.body.style.overflow = '';
}

function resetInventoryForm() {
  if (!DOM.inventoryFormContainer) return;
  DOM.inventoryFormContainer.style.display = 'none';
  if (DOM.inventoryEditId) DOM.inventoryEditId.value = '';
  if (DOM.inventoryItemId) DOM.inventoryItemId.value = '';
  if (DOM.invInputName) DOM.invInputName.value = '';
  if (DOM.invInputSku) DOM.invInputSku.value = '';
  if (DOM.invInputCurrentStock) DOM.invInputCurrentStock.value = '0';
  if (DOM.invInputSafetyStock) DOM.invInputSafetyStock.value = '5';
  if (DOM.invInputUnit) DOM.invInputUnit.value = '個';
  if (DOM.invInputUnitCost) DOM.invInputUnitCost.value = '';
  if (DOM.invInputUnitPrice) DOM.invInputUnitPrice.value = '';
  if (DOM.invInputLocation) DOM.invInputLocation.value = '';
  if (DOM.invInputNote) DOM.invInputNote.value = '';
  if (DOM.inventoryFormTitle) DOM.inventoryFormTitle.textContent = '新規在庫品目の登録';
  if (DOM.btnSaveInventoryItem) DOM.btnSaveInventoryItem.textContent = '在庫品目を保存';
}

function toggleInventoryForm(isEdit = false, item = null) {
  if (!DOM.inventoryFormContainer) return;
  const isHidden = DOM.inventoryFormContainer.style.display === 'none';
  if (!isEdit && !isHidden) {
    resetInventoryForm();
    return;
  }

  DOM.inventoryFormContainer.style.display = 'block';

  if (isEdit && item) {
    if (DOM.inventoryFormTitle) DOM.inventoryFormTitle.textContent = `在庫品目の編集: ${item.name}`;
    if (DOM.inventoryEditId) DOM.inventoryEditId.value = item.id;
    if (DOM.inventoryItemId) DOM.inventoryItemId.value = item.itemId || '';
    if (DOM.invInputName) DOM.invInputName.value = item.name || '';
    if (DOM.invInputSku) DOM.invInputSku.value = item.sku || '';
    if (DOM.invInputCurrentStock) DOM.invInputCurrentStock.value = item.currentStock !== undefined ? item.currentStock : 0;
    if (DOM.invInputSafetyStock) DOM.invInputSafetyStock.value = item.safetyStock !== undefined ? item.safetyStock : 5;
    if (DOM.invInputUnit) DOM.invInputUnit.value = item.unit || '個';
    if (DOM.invInputUnitCost) DOM.invInputUnitCost.value = item.unitCost || '';
    if (DOM.invInputUnitPrice) DOM.invInputUnitPrice.value = item.unitPrice || '';
    if (DOM.invInputLocation) DOM.invInputLocation.value = item.location || '';
    if (DOM.invInputNote) DOM.invInputNote.value = item.note || '';
    if (DOM.btnSaveInventoryItem) DOM.btnSaveInventoryItem.textContent = '変更内容を更新';
  } else {
    resetInventoryForm();
    DOM.inventoryFormContainer.style.display = 'block';
  }
}

function saveInventoryItemHandler() {
  const name = DOM.invInputName ? DOM.invInputName.value.trim() : '';
  if (!name) {
    alert('品名を入力してください。');
    if (DOM.invInputName) DOM.invInputName.focus();
    return;
  }

  const currentStock = DOM.invInputCurrentStock ? Math.max(0, parseInt(DOM.invInputCurrentStock.value, 10) || 0) : 0;
  const safetyStock = DOM.invInputSafetyStock ? Math.max(0, parseInt(DOM.invInputSafetyStock.value, 10) || 0) : 0;
  const unit = DOM.invInputUnit ? DOM.invInputUnit.value.trim() || '個' : '個';
  const unitCost = DOM.invInputUnitCost ? Math.max(0, parseInt(DOM.invInputUnitCost.value, 10) || 0) : 0;
  const unitPrice = DOM.invInputUnitPrice ? Math.max(0, parseInt(DOM.invInputUnitPrice.value, 10) || 0) : 0;
  const sku = DOM.invInputSku ? DOM.invInputSku.value.trim() : '';
  const location = DOM.invInputLocation ? DOM.invInputLocation.value.trim() : '';
  const note = DOM.invInputNote ? DOM.invInputNote.value.trim() : '';
  const editId = DOM.inventoryEditId ? DOM.inventoryEditId.value : '';
  const itemId = DOM.inventoryItemId ? DOM.inventoryItemId.value : '';

  // 新規登録時は商品マスタにも自動保存して連動
  if (!editId) {
    const allProducts = getItemMasterList(false);
    const existingProd = allProducts.find(p => p.name.trim() === name);
    if (!existingProd) {
      const newProd = saveItemToMaster({
        name,
        sku,
        unit,
        unitPrice: unitCost > 0 ? unitCost : unitPrice,
        userPrice: unitPrice > 0 ? unitPrice : Math.round(unitCost * 1.3),
        note: note || '在庫マスタから登録'
      });
      renderItemMasterList();
    }
  }

  const itemData = {
    id: editId || undefined,
    itemId: itemId || undefined,
    name,
    sku,
    currentStock,
    safetyStock,
    unit,
    unitCost,
    unitPrice,
    location,
    note
  };

  const saved = saveInventoryItem(itemData);
  if (saved) {
    showToast(`品目「${name}」を商品マスタおよび在庫台帳に保存しました！`, 'success');
    resetInventoryForm();
    renderInventoryTable();
    populateExpenseInventoryDropdown();
  }
}

function renderInventoryTable() {
  if (!DOM.inventoryTableContainer) return;
  const list = getInventoryList();
  const q = DOM.inputSearchInventory ? DOM.inputSearchInventory.value.trim().toLowerCase() : '';
  const filter = DOM.selectInventoryFilter ? DOM.selectInventoryFilter.value : currentInventoryFilter;

  let filtered = list;
  if (q) {
    filtered = filtered.filter(item => 
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.sku && item.sku.toLowerCase().includes(q)) ||
      (item.location && item.location.toLowerCase().includes(q)) ||
      (item.note && item.note.toLowerCase().includes(q))
    );
  }

  let lowCount = 0;
  list.forEach(i => {
    if (i.currentStock <= i.safetyStock) lowCount++;
  });

  if (filter === 'low') {
    filtered = filtered.filter(i => i.currentStock <= i.safetyStock);
  } else if (filter === 'zero') {
    filtered = filtered.filter(i => i.currentStock <= 0);
  }

  if (DOM.inventorySummaryStatus) {
    DOM.inventorySummaryStatus.textContent = `在庫品目総数: ${list.length}件 (⚠️ 安全在庫割れアラート: ${lowCount}件)`;
  }

  if (filtered.length === 0) {
    DOM.inventoryTableContainer.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: #64748b; font-size: 0.85rem;">
        ${q ? '該当する在庫品目が見つかりませんでした。' : '在庫品目が登録されていません。「＋ 新規在庫品目を追加」から登録してください。'}
      </div>
    `;
    return;
  }

  let html = `
    <table class="inv-table">
      <thead>
        <tr>
          <th style="min-width: 180px;">品名 / SKU</th>
          <th style="text-align: right; min-width: 90px;">現在庫</th>
          <th style="min-width: 80px; text-align: center;">状態</th>
          <th style="min-width: 50px;">単位</th>
          <th style="text-align: right; min-width: 90px;">仕入原価</th>
          <th style="min-width: 100px;">保管場所</th>
          <th style="min-width: 90px;">最終入庫</th>
          <th style="text-align: center; min-width: 190px;">入出庫・操作</th>
        </tr>
      </thead>
      <tbody>
  `;

  filtered.forEach(item => {
    const isZero = item.currentStock <= 0;
    const isLow = !isZero && item.currentStock <= item.safetyStock;

    let statusBadge = '<span class="stock-val-pill stock-safe">正常</span>';
    if (isZero) {
      statusBadge = '<span class="stock-val-pill stock-danger">❌ 在庫切</span>';
    } else if (isLow) {
      statusBadge = '<span class="stock-val-pill stock-warn">⚠️ 僅少</span>';
    }

    const formattedCost = item.unitCost ? `¥${Number(item.unitCost).toLocaleString()}` : '-';
    const skuDisp = item.sku ? `<span style="font-size: 0.725rem; color: #64748b; font-family: monospace; display: block;">SKU: ${escapeHtml(item.sku)}</span>` : '';

    html += `
      <tr data-id="${item.id}">
        <td>
          <div style="font-weight: 600; color: #0f172a;">${escapeHtml(item.name)}</div>
          ${skuDisp}
        </td>
        <td style="text-align: right;">
          <span style="font-size: 1.05rem; font-weight: 700; color: ${isZero ? '#dc2626' : (isLow ? '#d97706' : '#059669')};">
            ${Number(item.currentStock).toLocaleString()}
          </span>
          <span style="font-size: 0.725rem; color: #64748b; display: block;">適正: ${Number(item.safetyStock).toLocaleString()}</span>
        </td>
        <td style="text-align: center;">${statusBadge}</td>
        <td>${escapeHtml(item.unit || '個')}</td>
        <td style="text-align: right; font-family: monospace;">${formattedCost}</td>
        <td><span style="font-size: 0.8rem; color: #475569;">${escapeHtml(item.location || '-')}</span></td>
        <td style="font-size: 0.75rem; color: #64748b;">${escapeHtml(item.lastInDate || '-')}</td>
        <td style="text-align: center;">
          <div class="inv-action-btn-group" style="justify-content: center;">
            <button type="button" class="btn-inv-action btn-inv-in" onclick="window.invOpenAdjust('${item.id}', 'in')" title="仕入・受入 入庫">
              ➕入庫
            </button>
            <button type="button" class="btn-inv-action btn-inv-out" onclick="window.invOpenAdjust('${item.id}', 'out')" title="納品・使用 出庫">
              ➖出庫
            </button>
            <button type="button" class="btn-inv-action" onclick="window.invOpenAdjust('${item.id}', 'set')" title="実地棚卸による実数設定">
              📝棚卸
            </button>
            <button type="button" class="btn-inv-action" onclick="window.invOpenHistory('${item.id}')" title="入出庫履歴ログの閲覧">
              📜履歴
            </button>
            <button type="button" class="btn-inv-action" onclick="window.invEditItem('${item.id}')" title="品目情報の編集">
              ✏️
            </button>
            <button type="button" class="btn-inv-action" style="color: #dc2626;" onclick="window.invDeleteItem('${item.id}', '${escapeHtml(item.name)}')" title="品目の削除">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  DOM.inventoryTableContainer.innerHTML = html;
}

window.invOpenAdjust = function(id, defaultType = 'in') {
  const list = getInventoryList();
  const item = list.find(i => i.id === id || i.itemId === id);
  if (!item) return;
  openInventoryAdjustModal(item, defaultType);
};

window.invOpenHistory = function(id) {
  const list = getInventoryList();
  const item = list.find(i => i.id === id || i.itemId === id);
  if (!item) return;
  openInventoryHistoryModal(item);
};

window.invEditItem = function(id) {
  const list = getInventoryList();
  const item = list.find(i => i.id === id || i.itemId === id);
  if (!item) return;
  toggleInventoryForm(true, item);
  if (DOM.inventoryFormContainer) {
    DOM.inventoryFormContainer.scrollIntoView({ behavior: 'smooth' });
  }
};

window.invDeleteItem = function(id, name) {
  if (confirm(`在庫品目「${name}」を削除しますか？\n（過去の伝票や経費データには影響しません）`)) {
    deleteInventoryItem(id);
    renderInventoryTable();
    populateExpenseInventoryDropdown();
    showToast(`在庫品目「${name}」を削除しました。`);
  }
};

let currentAdjustItem = null;

function openInventoryAdjustModal(item, actionType = 'in') {
  if (!DOM.inventoryAdjustModal) return;
  currentAdjustItem = item;
  DOM.adjustInventoryId.value = item.id;
  DOM.adjustModalItemName.textContent = `入出庫調整: ${item.name}`;
  DOM.adjustCurrentStockVal.textContent = Number(item.currentStock).toLocaleString();
  DOM.adjustCurrentStockUnit.textContent = item.unit || '個';
  DOM.adjustInputQty.value = '1';
  DOM.adjustInputReason.value = actionType === 'in' ? '仕入受入' : (actionType === 'out' ? '出荷納品' : '実地棚卸差異調整');

  const radios = document.getElementsByName('adjustActionType');
  radios.forEach(r => {
    r.checked = (r.value === actionType);
  });

  updateAdjustSimulation();
  DOM.inventoryAdjustModal.classList.add('active');
  DOM.inventoryAdjustModal.style.display = 'flex';
}

function closeInventoryAdjustModal() {
  if (!DOM.inventoryAdjustModal) return;
  DOM.inventoryAdjustModal.classList.remove('active');
  DOM.inventoryAdjustModal.style.display = 'none';
  currentAdjustItem = null;
}

function updateAdjustSimulation() {
  if (!currentAdjustItem) return;
  const current = Number(currentAdjustItem.currentStock) || 0;
  const qty = parseInt(DOM.adjustInputQty.value, 10) || 0;
  const radios = document.getElementsByName('adjustActionType');
  let type = 'in';
  radios.forEach(r => { if (r.checked) type = r.value; });

  let simulated = current;
  if (type === 'in') {
    simulated = current + qty;
    if (DOM.labelAdjustQtyTitle) DOM.labelAdjustQtyTitle.textContent = '入庫数量 *';
  } else if (type === 'out') {
    simulated = Math.max(0, current - qty);
    if (DOM.labelAdjustQtyTitle) DOM.labelAdjustQtyTitle.textContent = '出庫数量 *';
  } else {
    simulated = Math.max(0, qty);
    if (DOM.labelAdjustQtyTitle) DOM.labelAdjustQtyTitle.textContent = '実地棚卸実数 *';
  }

  if (DOM.adjustSimulatedStockVal) {
    const diff = simulated - current;
    const diffText = diff >= 0 ? `+${diff}` : `${diff}`;
    DOM.adjustSimulatedStockVal.textContent = `${simulated.toLocaleString()} ${currentAdjustItem.unit || '個'} (${diffText})`;
  }
}

function confirmAdjustHandler() {
  if (!currentAdjustItem) return;
  const id = DOM.adjustInventoryId.value;
  const qty = parseInt(DOM.adjustInputQty.value, 10) || 0;
  if (qty <= 0) {
    alert('有効な数量（1以上）を入力してください。');
    return;
  }

  const radios = document.getElementsByName('adjustActionType');
  let type = 'in';
  radios.forEach(r => { if (r.checked) type = r.value; });

  const reason = (DOM.adjustInputReason ? DOM.adjustInputReason.value.trim() : '') || (type === 'in' ? '入庫' : (type === 'out' ? '出庫' : '棚卸調整'));

  let delta = qty;
  let isDirectSet = false;
  if (type === 'out') {
    delta = -qty;
  } else if (type === 'set') {
    delta = qty;
    isDirectSet = true;
  }

  const result = adjustStock(id, delta, reason, {}, isDirectSet);
  if (result) {
    showToast(`在庫を更新しました（現在庫: ${result.item.currentStock} ${result.item.unit || '個'}）`, 'success');
    closeInventoryAdjustModal();
    renderInventoryTable();
    populateExpenseInventoryDropdown();
  }
}

function openInventoryHistoryModal(item) {
  if (!DOM.inventoryHistoryModal) return;
  DOM.historyModalItemName.textContent = `入出庫履歴: ${item.name}`;
  DOM.historyModalItemSku.textContent = item.sku ? `SKU: ${item.sku} | 保管場所: ${item.location || '未設定'}` : '';

  const logs = Array.isArray(item.history) ? item.history : [];
  if (logs.length === 0) {
    DOM.inventoryHistoryTableContainer.innerHTML = `
      <div style="text-align: center; padding: 30px; color: #64748b;">入出庫の記録はありません。</div>
    `;
  } else {
    let html = `
      <table class="inv-table" style="font-size: 0.8rem;">
        <thead>
          <tr>
            <th>処理日</th>
            <th>種別</th>
            <th style="text-align: right;">変動数量</th>
            <th style="text-align: right;">処理後在庫</th>
            <th>理由 / 摘要</th>
            <th>取引先 / 相手先</th>
          </tr>
        </thead>
        <tbody>
    `;

    logs.forEach(log => {
      let typeBadge = '';
      if (log.type === 'in') {
        typeBadge = '<span style="color: #059669; font-weight: 700; background: #ecfdf5; padding: 2px 6px; border-radius: 4px;">➕ 入庫</span>';
      } else if (log.type === 'out') {
        typeBadge = '<span style="color: #ea580c; font-weight: 700; background: #fff7ed; padding: 2px 6px; border-radius: 4px;">➖ 出庫</span>';
      } else {
        typeBadge = '<span style="color: #475569; font-weight: 700; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">📝 調整</span>';
      }

      const deltaDisp = log.delta !== undefined ? (log.delta >= 0 ? `+${log.delta}` : `${log.delta}`) : (log.type === 'out' ? `-${log.qty}` : `+${log.qty}`);

      html += `
        <tr>
          <td style="white-space: nowrap;">${escapeHtml(log.date || '-')}</td>
          <td>${typeBadge}</td>
          <td style="text-align: right; font-weight: 700;">${deltaDisp}</td>
          <td style="text-align: right; font-weight: 700; color: #0f172a;">${Number(log.currentStock).toLocaleString()}</td>
          <td>${escapeHtml(log.reason || '-')}</td>
          <td>${escapeHtml(log.payee || log.sourceRef || '-')}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    DOM.inventoryHistoryTableContainer.innerHTML = html;
  }

  DOM.inventoryHistoryModal.classList.add('active');
  DOM.inventoryHistoryModal.style.display = 'flex';
}

function closeInventoryHistoryModal() {
  if (!DOM.inventoryHistoryModal) return;
  DOM.inventoryHistoryModal.classList.remove('active');
  DOM.inventoryHistoryModal.style.display = 'none';
}

// ==========================================================================
// クイック新規品目モーダル（商品マスタ＆在庫マスタ同時自動登録）
// ==========================================================================
function openQuickNewItemModal(suggestName = '', suggestCost = 0) {
  if (!DOM.quickNewItemModal) return;
  if (DOM.quickInputItemName) DOM.quickInputItemName.value = suggestName;
  if (DOM.quickInputItemSku) DOM.quickInputItemSku.value = '';
  if (DOM.quickInputItemUnit) DOM.quickInputItemUnit.value = '個';
  if (DOM.quickInputItemUnitCost) DOM.quickInputItemUnitCost.value = suggestCost ? String(suggestCost) : '';
  if (DOM.quickInputItemUnitPrice) DOM.quickInputItemUnitPrice.value = suggestCost ? String(Math.round(suggestCost * 1.3)) : '';
  if (DOM.quickInputItemSafetyStock) DOM.quickInputItemSafetyStock.value = '5';
  if (DOM.quickInputItemNote) DOM.quickInputItemNote.value = '';
  
  DOM.quickNewItemModal.classList.add('active');
  DOM.quickNewItemModal.style.display = 'flex';
  if (DOM.quickInputItemName) {
    setTimeout(() => DOM.quickInputItemName.focus(), 50);
  }
}

function closeQuickNewItemModal() {
  if (!DOM.quickNewItemModal) return;
  DOM.quickNewItemModal.classList.remove('active');
  DOM.quickNewItemModal.style.display = 'none';
}

function confirmQuickNewItemHandler() {
  const name = DOM.quickInputItemName ? DOM.quickInputItemName.value.trim() : '';
  if (!name) {
    alert('品名を入力してください。');
    if (DOM.quickInputItemName) DOM.quickInputItemName.focus();
    return;
  }

  const sku = DOM.quickInputItemSku ? DOM.quickInputItemSku.value.trim() : '';
  const unit = DOM.quickInputItemUnit ? DOM.quickInputItemUnit.value.trim() || '個' : '個';
  const unitCost = DOM.quickInputItemUnitCost ? Math.max(0, parseInt(DOM.quickInputItemUnitCost.value, 10) || 0) : 0;
  const unitPrice = DOM.quickInputItemUnitPrice ? Math.max(0, parseInt(DOM.quickInputItemUnitPrice.value, 10) || 0) : 0;
  const safetyStock = DOM.quickInputItemSafetyStock ? Math.max(0, parseInt(DOM.quickInputItemSafetyStock.value, 10) || 0) : 5;
  const note = DOM.quickInputItemNote ? DOM.quickInputItemNote.value.trim() : '';

  const result = saveNewProductAndInventory({
    name,
    sku,
    unit,
    unitCost,
    unitPrice,
    initialStock: 0,
    safetyStock,
    note
  });

  if (result) {
    closeQuickNewItemModal();
    renderItemMasterList();
    renderInventoryTable();
    populateExpenseInventoryDropdown(result.product.id);
    showToast(`品目「${name}」を商品マスタおよび在庫台帳に登録しました！`, 'success');
  }
}

// ==========================================================================
// 経費・仕入切り替え ＆ 在庫連動 コントローラー
// ==========================================================================

function initExpensePurchaseToggle() {
  if (!DOM.radioExpenseTypeExpense || !DOM.radioExpenseTypePurchase) return;

  DOM.radioExpenseTypeExpense.addEventListener('change', () => {
    switchExpenseEntryType('expense');
  });

  DOM.radioExpenseTypePurchase.addEventListener('change', () => {
    switchExpenseEntryType('purchase');
  });

  if (DOM.labelExpenseTypeExpense) {
    DOM.labelExpenseTypeExpense.addEventListener('click', () => {
      DOM.radioExpenseTypeExpense.checked = true;
      switchExpenseEntryType('expense');
    });
  }

  if (DOM.labelExpenseTypePurchase) {
    DOM.labelExpenseTypePurchase.addEventListener('click', () => {
      DOM.radioExpenseTypePurchase.checked = true;
      switchExpenseEntryType('purchase');
    });
  }

  if (DOM.expenseSelectInventoryItem) {
    DOM.expenseSelectInventoryItem.addEventListener('change', () => {
      updateExpenseStockPreview();
    });
  }

  if (DOM.expenseInputInQty) {
    DOM.expenseInputInQty.addEventListener('input', () => {
      updateExpenseStockPreview();
    });
  }

  if (DOM.expenseInputPayee) {
    DOM.expenseInputPayee.addEventListener('input', () => {
      checkAndSuggestInventoryMatch();
    });
  }
  if (DOM.expenseInputNote) {
    DOM.expenseInputNote.addEventListener('input', () => {
      checkAndSuggestInventoryMatch();
    });
  }

  // 「＋新規品目」ボタン（仕入画面から直接商品マスタ＆在庫へ同時登録）
  if (DOM.btnQuickCreateInventory) {
    DOM.btnQuickCreateInventory.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const suggestName = (DOM.expenseInputNote?.value || DOM.expenseInputPayee?.value || '').trim();
      let suggestCost = 0;
      if (DOM.expenseInputAmount) {
        const amt = parseInt(DOM.expenseInputAmount.value, 10) || 0;
        const qty = parseInt(DOM.expenseInputInQty?.value, 10) || 1;
        suggestCost = Math.round(amt / qty);
      }
      openQuickNewItemModal(suggestName, suggestCost);
    });
  }

  // クイック新規品目モーダル制御
  if (DOM.btnCloseQuickNewItemModal) {
    DOM.btnCloseQuickNewItemModal.addEventListener('click', closeQuickNewItemModal);
  }
  if (DOM.btnCancelQuickNewItem) {
    DOM.btnCancelQuickNewItem.addEventListener('click', closeQuickNewItemModal);
  }
  if (DOM.btnConfirmQuickNewItem) {
    DOM.btnConfirmQuickNewItem.addEventListener('click', confirmQuickNewItemHandler);
  }
  if (DOM.quickNewItemModal) {
    DOM.quickNewItemModal.addEventListener('click', (e) => {
      if (e.target === DOM.quickNewItemModal) closeQuickNewItemModal();
    });
  }
}

function switchExpenseEntryType(type) {
  const isPurchase = (type === 'purchase');

  if (DOM.radioExpenseTypeExpense) DOM.radioExpenseTypeExpense.checked = !isPurchase;
  if (DOM.radioExpenseTypePurchase) DOM.radioExpenseTypePurchase.checked = isPurchase;

  if (DOM.labelExpenseTypeExpense) {
    if (!isPurchase) DOM.labelExpenseTypeExpense.classList.add('active');
    else DOM.labelExpenseTypeExpense.classList.remove('active');
  }
  if (DOM.labelExpenseTypePurchase) {
    if (isPurchase) DOM.labelExpenseTypePurchase.classList.add('active');
    else DOM.labelExpenseTypePurchase.classList.remove('active');
  }

  if (DOM.expenseInventoryPanel) {
    DOM.expenseInventoryPanel.style.display = isPurchase ? 'block' : 'none';
  }

  if (DOM.btnSaveExpense) {
    DOM.btnSaveExpense.textContent = isPurchase ? '📦 仕入れ＆在庫入庫を確定' : '💼 経費として登録';
  }

  if (isPurchase) {
    if (DOM.expenseSelectCategory) {
      DOM.expenseSelectCategory.value = '仕入高';
    }
    // 商品マスタを参照してドロップダウンを生成
    populateExpenseInventoryDropdown();
    checkAndSuggestInventoryMatch();
  }
}

/**
 * 経費仕入れ画面の入庫対象在庫ドロップダウン
 * ユーザー指定要件：「入庫対象の在庫品目は商品マスタを参照して下さい」
 */
function populateExpenseInventoryDropdown(selectedId = '') {
  if (!DOM.expenseSelectInventoryItem) return;
  // 商品マスタ（itemMaster）を直接参照
  const products = getItemMasterList(true);
  const invList = getInventoryList();

  let html = '<option value="">-- 商品マスタから選択してください --</option>';
  products.forEach(prod => {
    // 該当商品の現在庫数を検索
    const inv = invList.find(i => i.itemId === prod.id || (i.name && i.name.trim() === prod.name.trim()));
    const stock = inv ? Number(inv.currentStock) || 0 : 0;
    const unit = (inv && inv.unit) || prod.unit || '個';
    const isSelected = selectedId && (prod.id === selectedId || (inv && inv.id === selectedId));
    html += `<option value="${prod.id}" ${isSelected ? 'selected' : ''}>📦 ${escapeHtml(prod.name)} (現在庫: ${stock}${unit})</option>`;
  });

  DOM.expenseSelectInventoryItem.innerHTML = html;
  updateExpenseStockPreview();
}

function checkAndSuggestInventoryMatch() {
  if (!DOM.radioExpenseTypePurchase || !DOM.radioExpenseTypePurchase.checked) return;

  const payee = DOM.expenseInputPayee ? DOM.expenseInputPayee.value.trim() : '';
  const note = DOM.expenseInputNote ? DOM.expenseInputNote.value.trim() : '';
  const searchTarget = payee || note;

  if (DOM.expenseDispRawPayee) {
    DOM.expenseDispRawPayee.textContent = searchTarget || '店名・品名未入力';
  }

  if (!searchTarget) {
    if (DOM.expensePurchaseMatchBadge) DOM.expensePurchaseMatchBadge.style.display = 'none';
    return;
  }

  let matched = findInventoryMatchForPurchase(note);
  if (!matched || matched.matchType === 'none') {
    matched = findInventoryMatchForPurchase(payee);
  }

  if (matched && matched.item) {
    // 商品マスタIDまたは在庫IDを選択
    const targetValue = matched.item.itemId || matched.item.id;
    if (DOM.expenseSelectInventoryItem) {
      DOM.expenseSelectInventoryItem.value = targetValue;
      if (!DOM.expenseSelectInventoryItem.value && matched.item.id) {
        DOM.expenseSelectInventoryItem.value = matched.item.id;
      }
    }
    if (DOM.expensePurchaseMatchBadge) {
      DOM.expensePurchaseMatchBadge.style.display = 'inline-block';
      DOM.expensePurchaseMatchBadge.textContent = matched.matchType === 'exact' 
        ? `💡 学習辞書から推測: ${matched.item.name}` 
        : `💡 キーワードから推測: ${matched.item.name}`;
    }
    updateExpenseStockPreview();
  } else {
    if (DOM.expensePurchaseMatchBadge) {
      DOM.expensePurchaseMatchBadge.style.display = 'none';
    }
  }
}

function updateExpenseStockPreview() {
  if (!DOM.expenseSelectInventoryItem) return;
  const selectedProdId = DOM.expenseSelectInventoryItem.value;
  const inQty = DOM.expenseInputInQty ? Math.max(1, parseInt(DOM.expenseInputInQty.value, 10) || 1) : 1;

  const products = getItemMasterList(false);
  const prod = products.find(p => p.id === selectedProdId);
  const invList = getInventoryList();
  const inv = invList.find(i => i.itemId === selectedProdId || (prod && i.name && i.name.trim() === prod.name.trim()));

  if (!prod && !inv) {
    if (DOM.expenseCurrentStockDisp) DOM.expenseCurrentStockDisp.textContent = '--';
    if (DOM.expenseAfterStockDisp) DOM.expenseAfterStockDisp.textContent = '--';
    if (DOM.expenseStockDeltaDisp) DOM.expenseStockDeltaDisp.textContent = `+${inQty}`;
    if (DOM.expenseInventoryUnitDisp) DOM.expenseInventoryUnitDisp.textContent = '個';
    return;
  }

  const current = inv ? Number(inv.currentStock) || 0 : 0;
  const unit = (inv && inv.unit) || (prod && prod.unit) || '個';
  const after = current + inQty;

  if (DOM.expenseCurrentStockDisp) DOM.expenseCurrentStockDisp.textContent = `${current.toLocaleString()} ${unit}`;
  if (DOM.expenseAfterStockDisp) DOM.expenseAfterStockDisp.textContent = `${after.toLocaleString()} ${unit}`;
  if (DOM.expenseStockDeltaDisp) DOM.expenseStockDeltaDisp.textContent = `+${inQty} ${unit}`;
  if (DOM.expenseInventoryUnitDisp) DOM.expenseInventoryUnitDisp.textContent = unit;
}


// ==========================================================================
// 値引きモーダル制御 ＆ ユーザー価格基準計算
// ==========================================================================
function openDiscountModal() {
  DOM.discountModal.classList.add('active');
  renderDiscountReasonTags();
  
  // 初期値設定
  const topReasons = getDiscountReasons();
  DOM.discountInputReason.value = topReasons.length > 0 ? topReasons[0].name : '出精値引き';
  DOM.discountBaseUserPriceInc.value = '';
  DOM.discountSelectType.value = 'percent';
  DOM.discountInputValue.value = '10';
  DOM.discountInputValue.placeholder = '例: 10 (%)';
  DOM.discountSelectTaxRate.value = '10';
  
  updateDiscountCalculator();
}

function closeDiscountModal() {
  DOM.discountModal.classList.remove('active');
}

function renderDiscountReasonTags() {
  const reasons = getDiscountReasons();
  DOM.discountReasonTagsContainer.innerHTML = '';
  
  reasons.forEach(r => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'reason-tag-btn';
    btn.innerHTML = `${escapeHtml(r.name)} <span class="tag-count">${r.count}</span>`;
    btn.title = `使用回数: ${r.count}回（クリックで名目にセット）`;
    btn.addEventListener('click', () => {
      DOM.discountInputReason.value = r.name;
    });
    DOM.discountReasonTagsContainer.appendChild(btn);
  });
}

function updateDiscountCalculator() {
  const baseUserInc = Number(DOM.discountBaseUserPriceInc.value) || 0;
  const discType = DOM.discountSelectType.value;
  const discVal = Number(DOM.discountInputValue.value) || 0;
  const taxRate = Number(DOM.discountSelectTaxRate.value) || 10;

  let userDiscountAmount = 0;
  let wholesaleDiscountUnitPrice = 0;

  if (discType === 'direct') {
    // 帳票仕切り単価（税抜）を直接指定する場合
    wholesaleDiscountUnitPrice = discVal;
    userDiscountAmount = 0;
    DOM.displayUserDiscountAmount.textContent = '（仕切り税抜を直接指定）';
  } else {
    // ユーザー価格を元に算出
    if (baseUserInc > 0) {
      if (discType === 'percent') {
        userDiscountAmount = Math.round(baseUserInc * (discVal / 100));
      } else {
        userDiscountAmount = discVal;
      }
      userDiscountAmount = Math.min(baseUserInc, Math.max(0, userDiscountAmount));
      DOM.displayUserDiscountAmount.textContent = formatCurrency(userDiscountAmount);

      // 値引き前ユーザー価格での税抜仕切り
      const w1 = calculateWholesalePrice(baseUserInc, taxRate, { type: 'none', value: 0 }).wholesaleUnitPrice;
      // 値引き後ユーザー価格での税抜仕切り
      const discountedUserInc = Math.max(0, baseUserInc - userDiscountAmount);
      const w2 = calculateWholesalePrice(discountedUserInc, taxRate, { type: 'none', value: 0 }).wholesaleUnitPrice;
      
      wholesaleDiscountUnitPrice = Math.max(0, w1 - w2);
    } else {
      DOM.displayUserDiscountAmount.textContent = '¥0';
      wholesaleDiscountUnitPrice = 0;
    }
  }

  DOM.displayWholesaleDiscountUnitPrice.textContent = formatCurrency(-wholesaleDiscountUnitPrice);
  return { userDiscountAmount, wholesaleDiscountUnitPrice };
}

function handleAddDiscountToItems() {
  const reason = DOM.discountInputReason.value.trim() || '特別値引き';
  const taxRate = Number(DOM.discountSelectTaxRate.value) || 10;
  const { wholesaleDiscountUnitPrice } = updateDiscountCalculator();

  if (wholesaleDiscountUnitPrice <= 0) {
    alert('値引き額が0円です。基準ユーザー税込価格と値引き率/金額、または直接指定の金額を入力してください。');
    return;
  }

  // 名目の使用履歴を記録（使用頻度順を更新）
  recordDiscountReason(reason);

  // マイナス単価の明細行を追加（完全な独立オブジェクト）
  currentDoc.items.push({
    id: 'item_' + Date.now() + Math.random().toString(36).substr(2, 4),
    name: reason,
    quantity: 1,
    unit: '式',
    unitPrice: -Math.abs(wholesaleDiscountUnitPrice),
    taxRate: taxRate,
    note: DOM.discountSelectType.value !== 'direct' ? 'ユーザー価格基準の値引き' : ''
  });

  renderItemInputCards();
  renderAll();
  closeDiscountModal();
  showToast(`値引き行「${reason}」(${formatCurrency(-wholesaleDiscountUnitPrice)}) を明細に追加しました！`, 'success');
}

// ==========================================================================
// 会計・収支ダッシュボード コントローラー
// ==========================================================================
let currentSalesFilter = 'all';
let currentReceiptDataUrl = null;
let attendanceClockInterval = null;

function openAccountingModal() {
  switchAppView('accounting');
}

function closeAccountingModal() {
  switchAppView('portal');
}

window.openAccountingModal = openAccountingModal;
window.closeAccountingModal = closeAccountingModal;
window.switchAccountingTab = switchAccountingTab;

function switchAccountingTab(tabKey) {
  let fullId = tabKey || 'acc-tab-dashboard';
  if (!fullId.startsWith('acc-tab-')) {
    fullId = `acc-tab-${fullId}`;
  }

  const tabBtns = (DOM.accTabBtns && DOM.accTabBtns.length > 0) ? DOM.accTabBtns : document.querySelectorAll('.acc-tab-btn');
  const panes = (DOM.accPanes && DOM.accPanes.length > 0) ? DOM.accPanes : document.querySelectorAll('.acc-pane');

  tabBtns.forEach(b => {
    b.classList.toggle('active', b.dataset.tab === fullId);
  });
  panes.forEach(p => {
    const isActive = (p.id === fullId);
    p.classList.toggle('active', isActive);
    p.style.display = isActive ? 'block' : 'none';
  });

  const month = DOM.accSelectMonth ? DOM.accSelectMonth.value : '';
  if (fullId === 'acc-tab-dashboard') {
    renderAccountingDashboard(month);
  } else if (fullId === 'acc-tab-sales') {
    renderAccountingSales(currentSalesFilter);
  } else if (fullId === 'acc-tab-expenses') {
    renderAccountingExpenses();
  } else if (fullId === 'acc-tab-journals') {
    renderAccountingJournals();
  }
}

function initAccountingMonthSelector() {
  if (!DOM.accSelectMonth) return;
  const history = getHistoryList();
  const expenses = getExpenseList();
  const monthsSet = new Set();

  history.forEach(doc => {
    if (doc.issueDate && doc.issueDate.length >= 7) {
      monthsSet.add(doc.issueDate.substring(0, 7));
    }
  });
  expenses.forEach(exp => {
    if (exp.date && exp.date.length >= 7) {
      monthsSet.add(exp.date.substring(0, 7));
    }
  });

  const currentYearMonth = getTodayDateString().substring(0, 7);
  monthsSet.add(currentYearMonth);

  const sortedMonths = Array.from(monthsSet).sort().reverse();
  const prevValue = DOM.accSelectMonth.value;

  let html = `<option value="">全期間（累計）</option>`;
  sortedMonths.forEach(m => {
    const [y, mm] = m.split('-');
    const label = `${y}年${Number(mm)}月`;
    const selected = (prevValue ? prevValue === m : m === currentYearMonth) ? 'selected' : '';
    html += `<option value="${m}" ${selected}>${label}</option>`;
  });
  DOM.accSelectMonth.innerHTML = html;
}

function renderAccountingDashboard(targetMonth = '') {
  const invoices = getHistoryList();
  const expenses = getExpenseList();
  const pnl = calculateProfitAndLoss(invoices, expenses, targetMonth || 'all');

  // KPI表示更新
  if (DOM.kpiTotalSales) DOM.kpiTotalSales.textContent = formatCurrency(pnl.totalSales);
  if (DOM.kpiTotalSalesInc) DOM.kpiTotalSalesInc.textContent = `(税込 ${formatCurrency(pnl.totalSalesInc)})`;
  if (DOM.kpiGrossProfit) DOM.kpiGrossProfit.textContent = formatCurrency(pnl.grossProfit);
  if (DOM.kpiGrossMargin) DOM.kpiGrossMargin.textContent = `粗利率: ${(pnl.grossProfitMargin || 0).toFixed(1)}%`;
  if (DOM.kpiTotalExpenses) DOM.kpiTotalExpenses.textContent = formatCurrency(pnl.totalOperatingExpenses || 0);

  const monthExpenseCount = expenses.filter(e => !targetMonth || (e.date && e.date.startsWith(targetMonth))).length;
  if (DOM.kpiExpenseItemsCount) DOM.kpiExpenseItemsCount.textContent = `${monthExpenseCount}件の経費支出`;

  if (DOM.kpiOperatingProfit) {
    DOM.kpiOperatingProfit.textContent = formatCurrency(pnl.operatingProfit);
    DOM.kpiOperatingProfit.style.color = pnl.operatingProfit >= 0 ? '#059669' : '#e11d48';
  }
  if (DOM.kpiOperatingMargin) DOM.kpiOperatingMargin.textContent = `純利益率: ${(pnl.operatingProfitMargin || 0).toFixed(1)}%`;
  if (DOM.kpiUnpaidSales) DOM.kpiUnpaidSales.textContent = formatCurrency(pnl.unpaidSalesInc || 0);
  if (DOM.kpiCollectionRate) DOM.kpiCollectionRate.textContent = `回収率: ${(pnl.collectionRate || 0).toFixed(1)}%`;

  // 科目別経費内訳の描画
  renderExpenseCategoryBreakdown(pnl);

  // 月別推移グラフの描画
  renderMonthlyBarChart();
}

function renderExpenseCategoryBreakdown(pnl) {
  if (!DOM.accExpenseCategoryList) return;
  const categories = Object.entries(pnl.expenseByCategory || {})
    .filter(([_, amt]) => amt > 0)
    .sort((a, b) => b[1] - a[1]);

  if (categories.length === 0) {
    DOM.accExpenseCategoryList.innerHTML = `<div style="text-align: center; color: var(--slate-400); padding: 24px;">この期間の経費データはありません</div>`;
    return;
  }

  const totalExp = pnl.totalOperatingExpenses || 1;
  let html = '';
  categories.forEach(([catName, amount]) => {
    const percent = totalExp > 0 ? ((amount / totalExp) * 100).toFixed(1) : 0;
    html += `
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
          <span style="font-weight: 600; color: var(--slate-700);">${escapeHtml(catName)}</span>
          <span style="font-weight: 700; color: var(--slate-900); font-family: monospace;">${formatCurrency(amount)} <span style="font-size: 11px; color: var(--slate-500); font-weight: normal;">(${percent}%)</span></span>
        </div>
        <div style="background: var(--slate-100); height: 8px; border-radius: 9999px; overflow: hidden;">
          <div style="background: var(--indigo-600); width: ${percent}%; height: 100%; border-radius: 9999px; transition: width 0.3s ease;"></div>
        </div>
      </div>
    `;
  });
  DOM.accExpenseCategoryList.innerHTML = html;
}

function renderMonthlyBarChart() {
  const canvas = DOM.accMonthlyChart;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const invoices = getHistoryList();
  const expenses = getExpenseList();

  // 直近6ヶ月の月キーを生成
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push(mStr);
  }

  // 各月の損益を計算
  const data = months.map(m => {
    const p = calculateProfitAndLoss(invoices, expenses, m);
    const [_, mm] = m.split('-');
    return {
      label: `${Number(mm)}月`,
      sales: p.totalSales,
      expenses: p.totalOperatingExpenses,
      profit: p.operatingProfit
    };
  });

  // Retina対応の高解像度スケーリング
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 600;
  const height = 220;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  // 最大値を計算
  let maxVal = 500000;
  data.forEach(d => {
    if (d.sales > maxVal) maxVal = d.sales;
    if (d.expenses > maxVal) maxVal = d.expenses;
  });
  maxVal = Math.ceil((maxVal * 1.15) / 100000) * 100000;

  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // グリッド線とY軸ラベル
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#64748b';
  ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'right';

  const gridCount = 4;
  for (let i = 0; i <= gridCount; i++) {
    const val = (maxVal / gridCount) * i;
    const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();

    const label = val >= 10000 ? `${(val / 10000).toFixed(0)}万` : `${val}`;
    ctx.fillText(label, paddingLeft - 8, y + 3);
  }

  // 棒の安全な描画関数（roundRect非対応ブラウザ対策）
  function drawBar(x, y, w, h, fillStyle) {
    if (h <= 0) return;
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, [3, 3, 0, 0]);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, w, h);
    }
  }

  // 棒グラフの描画
  const groupWidth = chartWidth / data.length;
  const barWidth = Math.min(16, groupWidth / 3.5);

  data.forEach((d, idx) => {
    const groupX = paddingLeft + idx * groupWidth + (groupWidth - (barWidth * 3 + 6)) / 2;

    // 売上バー（インディゴ）
    const salesH = Math.max(0, (d.sales / maxVal) * chartHeight);
    const salesY = paddingTop + chartHeight - salesH;
    drawBar(groupX, salesY, barWidth, salesH, '#6366f1');

    // 経費バー（アンバー）
    const expH = Math.max(0, (d.expenses / maxVal) * chartHeight);
    const expY = paddingTop + chartHeight - expH;
    drawBar(groupX + barWidth + 3, expY, barWidth, expH, '#f59e0b');

    // 営業利益バー（エメラルド / ローズ）
    const profitH = Math.abs((d.profit / maxVal) * chartHeight);
    const profitY = d.profit >= 0 ? paddingTop + chartHeight - profitH : paddingTop + chartHeight;
    drawBar(groupX + (barWidth + 3) * 2, profitY, barWidth, profitH, d.profit >= 0 ? '#10b981' : '#f43f5e');

    // X軸ラベル
    ctx.fillStyle = '#475569';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, paddingLeft + idx * groupWidth + groupWidth / 2, height - 12);
  });
}

function filterSalesTable(filter) {
  currentSalesFilter = filter;
  if (DOM.btnFilterAllInvoices) DOM.btnFilterAllInvoices.classList.toggle('active', filter === 'all');
  if (DOM.btnFilterUnpaidInvoices) DOM.btnFilterUnpaidInvoices.classList.toggle('active', filter === 'unpaid');
  if (DOM.btnFilterPaidInvoices) DOM.btnFilterPaidInvoices.classList.toggle('active', filter === 'paid');
  renderAccountingSales(filter);
}

function renderAccountingSales(filter = 'all') {
  if (!DOM.accSalesTableBody) return;
  const history = getHistoryList();
  
  // 見積書以外の確定発行伝票（請求書、納品書、領収書）を正規化
  let invoices = history
    .map(raw => normalizeInvoiceDoc(raw))
    .filter(doc => doc && doc.docType !== 'estimate' && doc.isIssued && !doc.isCancelled);

  if (filter === 'unpaid') {
    invoices = invoices.filter(doc => !doc.isPaid);
  } else if (filter === 'paid') {
    invoices = invoices.filter(doc => !!doc.isPaid);
  }

  if (invoices.length === 0) {
    DOM.accSalesTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--slate-400); padding: 36px 16px;">
          <p style="margin: 0; font-size: 0.9rem;">対象の確定発行伝票はありません。</p>
          <p style="margin: 6px 0 0 0; font-size: 0.775rem;">納品・請求書画面で「確定発行」を行うとここに自動反映されます。</p>
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  invoices.forEach(doc => {
    const isPaid = !!doc.isPaid;
    const grandTotal = doc.grandTotal;
    const meta = DOC_TYPES[doc.docType] || DOC_TYPES.invoice;

    const statusBadge = isPaid
      ? `<span class="badge" style="background: #dcfce7; color: #166534; font-weight: 600;">✓ 入金済</span>`
      : `<span class="badge" style="background: #fef3c7; color: #92400e; font-weight: 600;">⏳ 未入金</span>`;

    const toggleBtn = isPaid
      ? `<button type="button" class="btn btn-outline btn-xs" style="color: #64748b; font-size: 11px; padding: 3px 8px;" onclick="window.__toggleInvoicePayment('${doc.id}', false)">未入金に戻す</button>`
      : `<button type="button" class="btn btn-success btn-xs" style="background: #10b981; color: white; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 4px; box-shadow: 0 1px 3px rgba(16,185,129,0.3);" onclick="window.__toggleInvoicePayment('${doc.id}', true)">✓ 消込（入金済）</button>`;

    html += `
      <tr>
        <td style="font-family: monospace; font-weight: 600;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="badge" style="font-size: 10px; padding: 2px 5px; background: #e0e7ff; color: #3730a3;">${meta.label}</span>
            <a href="javascript:void(0)" onclick="window.__openInvoiceQuickEdit('${doc.id}')" style="color: #4338ca; font-weight: 700; text-decoration: underline; cursor: pointer;" title="クリックして請求書内容を確認・直接編集">${escapeHtml(doc.docNumber || '-')}</a>
          </div>
        </td>
        <td>${escapeHtml(doc.issueDate || '-')}</td>
        <td style="font-weight: 600; color: var(--slate-800); cursor: pointer;" onclick="window.__openInvoiceQuickEdit('${doc.id}')" title="クリックして請求書内容を確認・直接編集">
          <span style="color: #1e293b; text-decoration: underline;">${escapeHtml(doc.clientName || '名称未設定')}</span>
        </td>
        <td style="text-align: right; font-weight: 700; font-family: monospace; color: var(--indigo-700); font-size: 0.9rem;">${formatCurrency(grandTotal)}</td>
        <td>${escapeHtml(doc.dueDate || '-')}</td>
        <td style="text-align: center;">${statusBadge}</td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 4px; justify-content: center; align-items: center; flex-wrap: wrap;">
            <button type="button" class="btn btn-outline btn-xs" style="color: #4338ca; border-color: #c7d2fe; font-size: 11px; padding: 3px 7px;" title="請求書内容の確認・直接編集" onclick="window.__openInvoiceQuickEdit('${doc.id}')">👁 詳細・編集</button>
            ${toggleBtn}
            <button type="button" class="btn btn-outline-danger btn-xs" style="color: #ef4444; border-color: #fca5a5; font-size: 11px; padding: 3px 6px;" title="確定発行を取り消し、売上消込・仕訳帳・P/Lから除外して下書きに戻します" onclick="window.__cancelInvoiceIssue('${doc.id}', '${escapeHtml(doc.docNumber || '')}')">確定取消</button>
          </div>
        </td>
      </tr>
    `;
  });
  DOM.accSalesTableBody.innerHTML = html;
}

window.__toggleInvoicePayment = function(id, newStatus) {
  const success = updateDocPaymentStatus(id, newStatus);
  if (success) {
    showToast(newStatus ? '入金消込を完了しました！仕訳帳にも自動連動されます。' : '未入金ステータスに戻しました。', 'success');
    renderAccountingSales(currentSalesFilter);
    renderAccountingDashboard(DOM.accSelectMonth ? DOM.accSelectMonth.value : '');
    renderAccountingJournals();
  }
};

window.__cancelInvoiceIssue = function(id, docNumber = '') {
  const label = docNumber ? `伝票「${docNumber}」` : 'この書類';
  if (!confirm(`${label}の確定発行を取り消しますか？\n\n【取り消しの効果】\n・売上消込台帳・P/Lダッシュボード・仕訳帳から即座に除外されます。\n・書類データは削除されず、下書き状態に戻ります。`)) {
    return;
  }

  const success = cancelDocIssue(id);
  if (success) {
    if (currentDoc && currentDoc.id === id) {
      currentDoc.isIssued = false;
      currentDoc.isCancelled = true;
      currentDoc.issuedAt = null;
      saveActiveDoc(currentDoc);
      renderAll();
    }
    initAccountingMonthSelector();
    renderAccountingSales(currentSalesFilter);
    renderAccountingDashboard(DOM.accSelectMonth ? DOM.accSelectMonth.value : '');
    renderAccountingJournals();
    showToast(`${label}の確定発行を取り消しました（財務会計から除外されました）`, 'warning');
  } else {
    showToast('確定発行の取り消しに失敗しました', 'danger');
  }
};

// ==========================================================================
// 請求書詳細・クイック直接編集コントローラー（財務会計連携・1対1完全同期）
// ==========================================================================
let currentIqeDoc = null;
let currentIqeItems = [];

function openInvoiceQuickEdit(docId) {
  if (!DOM.invoiceQuickEditModal) return;

  const full = getDocFromHistory(docId);
  const list = getHistoryList();
  const summary = list.find(d => d.id === docId);

  if (!full && !summary) {
    showToast('伝票データが見つかりません', 'danger');
    return;
  }

  currentIqeDoc = full ? JSON.parse(JSON.stringify(full)) : JSON.parse(JSON.stringify(summary.fullDoc || summary));
  if (!currentIqeDoc.items || !Array.isArray(currentIqeDoc.items)) {
    currentIqeDoc.items = [];
  }
  currentIqeItems = JSON.parse(JSON.stringify(currentIqeDoc.items));

  // モーダルヘッダー
  const docNo = currentIqeDoc.docNumber || summary?.docNumber || '番号なし';
  const meta = DOC_TYPES[currentIqeDoc.docType] || DOC_TYPES.invoice;
  if (DOM.iqeModalTitle) DOM.iqeModalTitle.textContent = `${meta.label} 詳細・直接編集`;
  if (DOM.iqeDocNumberSub) DOM.iqeDocNumberSub.textContent = `伝票番号: ${docNo}`;

  const isIssued = !!(currentIqeDoc.isIssued && !currentIqeDoc.isCancelled);
  if (DOM.iqeStatusBadge) {
    DOM.iqeStatusBadge.textContent = isIssued ? '確定発行済（財務会計連動中）' : '下書き（未確定）';
    DOM.iqeStatusBadge.style.background = isIssued ? '#dcfce7' : '#f1f5f9';
    DOM.iqeStatusBadge.style.color = isIssued ? '#166534' : '#64748b';
  }

  // フォーム初期値
  if (DOM.iqeDocId) DOM.iqeDocId.value = docId;
  if (DOM.iqeDocType) DOM.iqeDocType.value = currentIqeDoc.docType || 'invoice';
  if (DOM.iqeIssueDate) DOM.iqeIssueDate.value = currentIqeDoc.issueDate || '';
  if (DOM.iqeDueDate) DOM.iqeDueDate.value = currentIqeDoc.dueDate || '';
  if (DOM.iqePaymentStatus) DOM.iqePaymentStatus.value = (currentIqeDoc.isPaid || currentIqeDoc.paymentStatus === 'paid') ? 'paid' : 'unpaid';
  if (DOM.iqeClientName) DOM.iqeClientName.value = currentIqeDoc.client?.name || summary?.clientName || '';
  if (DOM.iqeTitle) DOM.iqeTitle.value = currentIqeDoc.title || '';
  if (DOM.iqeNotes) DOM.iqeNotes.value = currentIqeDoc.notes || '';

  // 明細テーブルの描画
  renderIqeItemsTable();

  // モーダル表示
  DOM.invoiceQuickEditModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

window.__openInvoiceQuickEdit = openInvoiceQuickEdit;

function closeInvoiceQuickEditModal() {
  if (!DOM.invoiceQuickEditModal) return;
  DOM.invoiceQuickEditModal.classList.remove('active');
  document.body.style.overflow = '';
  currentIqeDoc = null;
  currentIqeItems = [];
}

function renderIqeItemsTable() {
  if (!DOM.iqeItemsTableBody) return;
  DOM.iqeItemsTableBody.innerHTML = '';

  if (currentIqeItems.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="7" style="text-align: center; color: #94a3b8; padding: 20px;">明細がありません。「＋ 行を追加」ボタンで追加してください。</td>`;
    DOM.iqeItemsTableBody.appendChild(tr);
    recalcIqeTotals();
    return;
  }

  currentIqeItems.forEach((it, idx) => {
    const tr = document.createElement('tr');
    const lineTotal = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);

    tr.innerHTML = `
      <td>
        <input type="text" class="form-input iqe-item-name" value="${escapeHtml(it.name || '')}" style="font-size: 0.8rem; padding: 4px 6px;" placeholder="品名・項目">
      </td>
      <td>
        <input type="number" class="form-input iqe-item-qty" value="${it.quantity !== undefined ? it.quantity : 1}" style="font-size: 0.8rem; padding: 4px 6px; text-align: right;" min="0" step="any">
      </td>
      <td>
        <input type="text" class="form-input iqe-item-unit" value="${escapeHtml(it.unit || '個')}" style="font-size: 0.8rem; padding: 4px 6px; text-align: center;">
      </td>
      <td>
        <input type="number" class="form-input iqe-item-price" value="${it.unitPrice !== undefined ? it.unitPrice : 0}" style="font-size: 0.8rem; padding: 4px 6px; text-align: right;" min="0">
      </td>
      <td>
        <select class="form-select iqe-item-rate" style="font-size: 0.8rem; padding: 4px 4px; text-align: center;">
          <option value="10" ${Number(it.taxRate) === 10 ? 'selected' : ''}>10%</option>
          <option value="8" ${Number(it.taxRate) === 8 ? 'selected' : ''}>8% (軽減)</option>
          <option value="0" ${Number(it.taxRate) === 0 ? 'selected' : ''}>0% (非課税)</option>
        </select>
      </td>
      <td style="text-align: right; font-family: monospace; font-weight: 600; color: #1e293b; padding-right: 8px;">
        ${formatCurrency(lineTotal)}
      </td>
      <td style="text-align: center;">
        <button type="button" class="btn-icon-danger iqe-btn-del" style="font-size: 0.9rem;" title="行を削除">✕</button>
      </td>
    `;

    // 入力イベントで即時再計算
    const nameInput = tr.querySelector('.iqe-item-name');
    const qtyInput = tr.querySelector('.iqe-item-qty');
    const unitInput = tr.querySelector('.iqe-item-unit');
    const priceInput = tr.querySelector('.iqe-item-price');
    const rateSelect = tr.querySelector('.iqe-item-rate');
    const delBtn = tr.querySelector('.iqe-btn-del');

    nameInput.addEventListener('input', e => { it.name = e.target.value; });
    qtyInput.addEventListener('input', e => {
      it.quantity = Number(e.target.value) || 0;
      recalcIqeTotals();
    });
    unitInput.addEventListener('input', e => { it.unit = e.target.value; });
    priceInput.addEventListener('input', e => {
      it.unitPrice = Number(e.target.value) || 0;
      recalcIqeTotals();
    });
    rateSelect.addEventListener('change', e => {
      it.taxRate = Number(e.target.value);
      recalcIqeTotals();
    });
    delBtn.addEventListener('click', () => {
      currentIqeItems.splice(idx, 1);
      renderIqeItemsTable();
    });

    DOM.iqeItemsTableBody.appendChild(tr);
  });

  recalcIqeTotals();
}

function recalcIqeTotals() {
  let subtotal = 0;
  let taxTotal = 0;

  currentIqeItems.forEach(it => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.unitPrice) || 0;
    const lineTotal = qty * price;
    const rate = Number(it.taxRate !== undefined ? it.taxRate : 10);
    subtotal += lineTotal;
    taxTotal += Math.floor(lineTotal * (rate / 100));
  });

  const grandTotal = subtotal + taxTotal;

  if (DOM.iqeSubtotal) DOM.iqeSubtotal.textContent = formatCurrency(subtotal);
  if (DOM.iqeTaxTotal) DOM.iqeTaxTotal.textContent = formatCurrency(taxTotal);
  if (DOM.iqeGrandTotal) DOM.iqeGrandTotal.textContent = formatCurrency(grandTotal);
}

function saveInvoiceQuickEditHandler() {
  if (!currentIqeDoc) return;
  const docId = DOM.iqeDocId ? DOM.iqeDocId.value : currentIqeDoc.id;
  if (!docId) return;

  const docType = DOM.iqeDocType ? DOM.iqeDocType.value : currentIqeDoc.docType;
  const issueDate = DOM.iqeIssueDate ? DOM.iqeIssueDate.value : currentIqeDoc.issueDate;
  const dueDate = DOM.iqeDueDate ? DOM.iqeDueDate.value : currentIqeDoc.dueDate;
  const paymentStatus = DOM.iqePaymentStatus ? DOM.iqePaymentStatus.value : 'unpaid';
  const isPaid = (paymentStatus === 'paid');
  const clientName = DOM.iqeClientName ? DOM.iqeClientName.value.trim() : (currentIqeDoc.client?.name || '');
  const title = DOM.iqeTitle ? DOM.iqeTitle.value.trim() : currentIqeDoc.title;
  const notes = DOM.iqeNotes ? DOM.iqeNotes.value : currentIqeDoc.notes;

  // 1. currentIqeDoc を完全更新
  currentIqeDoc.docType = docType;
  currentIqeDoc.issueDate = issueDate;
  currentIqeDoc.dueDate = dueDate;
  currentIqeDoc.paymentStatus = paymentStatus;
  currentIqeDoc.isPaid = isPaid;
  if (isPaid && !currentIqeDoc.paidDate) {
    currentIqeDoc.paidDate = new Date().toISOString().split('T')[0];
  } else if (!isPaid) {
    currentIqeDoc.paidDate = '';
  }
  if (!currentIqeDoc.client) currentIqeDoc.client = {};
  currentIqeDoc.client.name = clientName;
  currentIqeDoc.title = title;
  currentIqeDoc.notes = notes;
  currentIqeDoc.items = currentIqeItems;
  currentIqeDoc.updatedAt = new Date().toISOString();

  // 2. 書類履歴（KEYS.HISTORY）に1対1で完全保存
  saveDocToHistory(currentIqeDoc);

  // 3. もし現在納品請求書エディタで開いている書類と同じIDなら、currentDoc も1対1で同期！
  if (currentDoc && currentDoc.id === docId) {
    currentDoc = JSON.parse(JSON.stringify(currentIqeDoc));
    saveActiveDoc(currentDoc);
    populateFormFromDoc();
    updateThemeColor(currentDoc.themeColor || 'indigo');
    renderAll();
  }

  // 4. 財務会計（P/L損益計算書・売上消込台帳・仕訳帳）を即時再計算・再同期！
  initAccountingMonthSelector();
  const currentMonth = DOM.accSelectMonth ? DOM.accSelectMonth.value : '';
  renderAccountingDashboard(currentMonth);
  renderAccountingSales(currentSalesFilter);
  renderAccountingJournals();

  // 5. モーダルを閉じて成功トーストを表示
  closeInvoiceQuickEditModal();
  showToast(`伝票内容を保存し、納品請求書・売上消込台帳・損益計算・仕訳帳すべてに1対1で変更を反映しました！`, 'success');
}

// ==========================================================================
// 経費・レシート画像OCR コントローラー
// ==========================================================================
function initReceiptUploadHandlers() {
  const dropZone = DOM.receiptDropZone;
  const fileInput = DOM.receiptFileInput;
  if (!dropZone || !fileInput) return;

  // ローカルサーバーの Gemini API 連携状態をチェック
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.protocol.startsWith('http')) {
      fetch('/api/status')
        .then(res => res.json())
        .then(status => {
          if (status && status.hasGeminiKey && DOM.geminiOcrBadge) {
            DOM.geminiOcrBadge.style.display = 'inline-block';
            const remaining = status.rateLimit ? status.rateLimit.dailyRemaining : '200';
            DOM.geminiOcrBadge.textContent = `✨ Gemini AI 連携中（本日無料枠 残り${remaining}回）`;
            DOM.geminiOcrBadge.style.background = 'linear-gradient(135deg, #e0e7ff, #ede9fe)';
            DOM.geminiOcrBadge.style.color = '#4338ca';
            DOM.geminiOcrBadge.title = `Google Gemini AI (Flash) による超高精度OCRが有効です。無料枠セーフティガード（上限1日200回/残り${remaining}回）により安全に保護されています。`;
          }
        })
        .catch(() => {});
    } else if (DOM.geminiOcrBadge) {
      // file:/// で直接開いている場合
      DOM.geminiOcrBadge.style.display = 'inline-block';
      DOM.geminiOcrBadge.textContent = '⚠️ start.command で起動するとGemini有効';
      DOM.geminiOcrBadge.style.background = '#fef3c7';
      DOM.geminiOcrBadge.style.color = '#92400e';
      DOM.geminiOcrBadge.style.borderColor = '#fde68a';
      DOM.geminiOcrBadge.title = 'フォルダ内の start.command をダブルクリックして開くと、Gemini API による高精度OCRが利用できます';
    }
  }

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleReceiptFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleReceiptFile(e.target.files[0]);
    }
  });
}

async function handleReceiptFile(file) {
  if (!file) return;

  // 拡張子またはMIMEタイプで判定
  const isImage = (file.type && file.type.startsWith('image/')) ||
    /\.(jpe?g|png|webp|gif|heic|bmp|tiff)$/i.test(file.name || '');

  if (!isImage) {
    alert('画像ファイル（JPEG, PNG, WEBP等）を選択してください。');
    return;
  }

  showToast('レシート画像を読み込んでいます...', 'info');

  try {
    const compressedDataUrl = await compressReceiptImage(file);
    currentReceiptDataUrl = compressedDataUrl;

    if (DOM.receiptImagePreview) {
      DOM.receiptImagePreview.src = compressedDataUrl;
    }
    if (DOM.receiptImagePreviewContainer) {
      DOM.receiptImagePreviewContainer.style.display = 'block';
    }

    // ドロップゾーンのテキストを読込済みに更新
    const dropZoneText = DOM.receiptDropZone ? DOM.receiptDropZone.querySelector('span') : null;
    if (dropZoneText) {
      dropZoneText.textContent = `✓ 写真をセットしました: ${file.name || 'レシート'}`;
      dropZoneText.style.color = '#059669';
    }

    // OCRステータス表示
    if (DOM.receiptOcrStatus) {
      DOM.receiptOcrStatus.style.display = 'flex';
      if (DOM.receiptOcrStatusText) DOM.receiptOcrStatusText.textContent = 'レシートの文字・金額を解析中...';
    }

    const onProgress = (msg) => {
      if (DOM.receiptOcrStatusText) DOM.receiptOcrStatusText.textContent = msg;
    };

    // 過去の経費登録履歴（使えば使うほど精度が向上する学習辞書）を取得して渡す
    const expenseHistory = typeof getExpenseList === 'function' ? getExpenseList() : [];
    const parsed = await analyzeReceiptImage(file, onProgress, expenseHistory);

    if (DOM.receiptOcrStatus) {
      DOM.receiptOcrStatus.style.display = 'none';
    }

    if (parsed) {
      if (parsed.date && DOM.expenseInputDate) DOM.expenseInputDate.value = parsed.date;
      if (parsed.amount && DOM.expenseInputAmount) DOM.expenseInputAmount.value = parsed.amount;
      if (parsed.payee && DOM.expenseInputPayee) DOM.expenseInputPayee.value = parsed.payee;
      if (parsed.category && DOM.expenseSelectCategory) DOM.expenseSelectCategory.value = parsed.category;
      if (parsed.taxRate && DOM.expenseSelectTax) DOM.expenseSelectTax.value = String(parsed.taxRate);

      // インボイス登録番号の自動セット
      if (parsed.invoiceNumber && DOM.expenseInputInvoiceNum) {
        DOM.expenseInputInvoiceNum.value = parsed.invoiceNumber;
      }

      // 摘要・メモのセット
      if (parsed.note && DOM.expenseInputNote && !DOM.expenseInputNote.value) {
        DOM.expenseInputNote.value = parsed.note;
      }

      // 仕入名目・店名からの在庫商品推測を更新
      checkAndSuggestInventoryMatch();

      if (window.lastGeminiError) {
        if (window.lastGeminiError.includes('429') || window.lastGeminiError.includes('quota') || window.lastGeminiError.includes('無料枠')) {
          showToast('⏳ Google AI無料枠の1分間制限に達しています。約1分後に再試行するか、数値を手動入力してください。', 'warning');
        } else {
          showToast(`⚠️ AI解析エラー: ${window.lastGeminiError}`, 'warning');
        }
        window.lastGeminiError = null;
      } else if (parsed.engine && parsed.engine.startsWith('gemini')) {
        const invInfo = parsed.invoiceNumber ? ` / インボイス: ${parsed.invoiceNumber}` : '';
        const amtInfo = parsed.amount ? `金額: ¥${parsed.amount.toLocaleString()}` : '';
        showToast(`✨ Gemini AI解析完了！ ${amtInfo}${invInfo}`, 'success');
      } else if (parsed.isLearnedMatch) {
        showToast(`🧠 過去の登録実績から「${parsed.payee} (${parsed.category})」を自動特定しました！`, 'success');
      } else if (parsed.amount > 0 || parsed.payee) {
        showToast('レシートから金額や店名を自動読込しました！内容を確認して登録してください。', 'success');
      } else {
        showToast('写真をセットしました！金額と内容を確認して登録してください。', 'info');
      }
    } else {
      showToast('写真をセットしました！金額と内容を入力して登録してください。', 'info');
    }

    // 入力欄にフォーカス
    if (DOM.expenseInputAmount && !DOM.expenseInputAmount.value) {
      DOM.expenseInputAmount.focus();
    }
  } catch (err) {
    console.error('Receipt process error:', err);
    if (DOM.receiptOcrStatus) {
      DOM.receiptOcrStatus.style.display = 'none';
    }
    showToast('画像の読み込みに失敗しました。手動で入力してください。', 'warning');
  }
}

/**
 * レシート画像を大画面モーダルで全体拡大表示（電子帳簿保存法スキャナ保存対応）
 */
function openReceiptZoom(imgSrc, meta = null) {
  const modal = DOM.receiptZoomModal || document.getElementById('receiptZoomModal');
  const img = DOM.receiptZoomImage || document.getElementById('receiptZoomImage');
  if (!imgSrc || !modal || !img) {
    console.warn('Cannot open receipt zoom modal: elements missing', { imgSrc, modal, img });
    return;
  }
  img.src = imgSrc;

  // ダウンロードリンクの設定
  const btnDownload = DOM.btnDownloadReceiptZoom || document.getElementById('btnDownloadReceiptZoom');
  if (btnDownload) {
    btnDownload.href = imgSrc;
    const downloadName = meta && meta.date
      ? `領収書_${meta.date}_${(meta.payee || '経費').replace(/[\s\/\\:*?"<>|]/g, '_')}.jpg`
      : '領収書原本.jpg';
    btnDownload.download = downloadName;
  }

  // 電子帳簿保存法メタ情報バナーの更新
  const metaDate = DOM.receiptZoomMetaDate || document.getElementById('receiptZoomMetaDate');
  const metaPayee = DOM.receiptZoomMetaPayee || document.getElementById('receiptZoomMetaPayee');
  const metaAmount = DOM.receiptZoomMetaAmount || document.getElementById('receiptZoomMetaAmount');
  const metaInvoice = DOM.receiptZoomMetaInvoice || document.getElementById('receiptZoomMetaInvoice');

  if (meta) {
    if (metaDate) metaDate.textContent = `📅 取引日: ${meta.date || '-'}`;
    if (metaPayee) metaPayee.textContent = `🏢 取引先: ${meta.payee || '-'}`;
    if (metaAmount) metaAmount.textContent = `💴 金額: ${formatCurrency(meta.amount || 0)}`;
    if (metaInvoice) {
      metaInvoice.textContent = meta.invoiceNumber
        ? `🏷️ インボイス: ${meta.invoiceNumber}`
        : '🏷️ インボイス: 未登録/非対象';
    }
  } else {
    // フォーム入力中の画像の場合
    if (metaDate) metaDate.textContent = `📅 取引日: ${DOM.expenseInputDate?.value || '-'}`;
    if (metaPayee) metaPayee.textContent = `🏢 取引先: ${DOM.expenseInputPayee?.value || '-'}`;
    if (metaAmount) metaAmount.textContent = `💴 金額: ${formatCurrency(DOM.expenseInputAmount?.value || 0)}`;
    if (metaInvoice) {
      metaInvoice.textContent = DOM.expenseInputInvoiceNum?.value
        ? `🏷️ インボイス: ${DOM.expenseInputInvoiceNum.value}`
        : '🏷️ インボイス: 未登録/非対象';
    }
  }

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeReceiptZoom() {
  const modal = DOM.receiptZoomModal || document.getElementById('receiptZoomModal');
  const img = DOM.receiptZoomImage || document.getElementById('receiptZoomImage');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
  if (img) img.src = '';
}

// ESCキーで拡大モーダルを閉じる
document.addEventListener('keydown', (e) => {
  const modal = DOM.receiptZoomModal || document.getElementById('receiptZoomModal');
  if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
    closeReceiptZoom();
  }
});

function clearReceiptImage() {
  currentReceiptDataUrl = null;
  if (DOM.receiptFileInput) DOM.receiptFileInput.value = '';
  if (DOM.receiptImagePreview) DOM.receiptImagePreview.src = '';
  if (DOM.receiptImagePreviewContainer) DOM.receiptImagePreviewContainer.style.display = 'none';
  if (DOM.receiptOcrStatus) DOM.receiptOcrStatus.style.display = 'none';
  const dropZoneText = DOM.receiptDropZone ? DOM.receiptDropZone.querySelector('span') : null;
  if (dropZoneText) {
    dropZoneText.textContent = 'レシート写真を選択 または ドラッグ';
    dropZoneText.style.color = '#334155';
  }
}

function resetExpenseForm() {
  if (DOM.expenseEditId) DOM.expenseEditId.value = '';
  if (DOM.expenseInputDate) DOM.expenseInputDate.value = getTodayDateString();
  if (DOM.expenseSelectCategory) DOM.expenseSelectCategory.value = '消耗品費';
  if (DOM.expenseInputAmount) DOM.expenseInputAmount.value = '';
  if (DOM.expenseSelectTax) DOM.expenseSelectTax.value = '10';
  if (DOM.expenseInputPayee) DOM.expenseInputPayee.value = '';
  if (DOM.expenseInputInvoiceNum) DOM.expenseInputInvoiceNum.value = '';
  if (DOM.expenseInputNote) DOM.expenseInputNote.value = '';
  if (DOM.expenseInputInQty) DOM.expenseInputInQty.value = '1';
  clearReceiptImage();
  switchExpenseEntryType('expense'); // デフォルトは経費として読み込み・登録
}

function handleSaveExpense() {
  const date = DOM.expenseInputDate.value;
  const amount = Number(DOM.expenseInputAmount.value);
  const category = DOM.expenseSelectCategory.value;
  const taxRate = Number(DOM.expenseSelectTax.value) || 10;
  const payee = DOM.expenseInputPayee.value.trim();
  const invoiceNumber = DOM.expenseInputInvoiceNum ? DOM.expenseInputInvoiceNum.value.trim() : '';
  const note = DOM.expenseInputNote.value.trim();
  const id = DOM.expenseEditId.value || undefined;

  if (!date) {
    alert('日付を入力してください。');
    return;
  }
  if (!amount || amount <= 0) {
    alert('有効な金額（1円以上）を入力してください。');
    return;
  }

  const isPurchase = DOM.radioExpenseTypePurchase && DOM.radioExpenseTypePurchase.checked;
  let linkedInventoryId = '';
  let linkedInventoryQty = 1;

  if (isPurchase) {
    linkedInventoryId = DOM.expenseSelectInventoryItem ? DOM.expenseSelectInventoryItem.value : '';
    linkedInventoryQty = DOM.expenseInputInQty ? Math.max(1, parseInt(DOM.expenseInputInQty.value, 10) || 1) : 1;

    if (!linkedInventoryId) {
      alert('仕入れ入庫を行う対象の在庫品目を選択してください。\n（該当する品目がない場合は「＋新規品目」から在庫マスタに登録できます）');
      if (DOM.expenseSelectInventoryItem) DOM.expenseSelectInventoryItem.focus();
      return;
    }
  }

  const expenseItem = {
    id,
    date,
    category: isPurchase ? '仕入高' : category,
    amount,
    taxRate,
    payee,
    invoiceNumber,
    note,
    isCost: isPurchase, // 損益計算書の売上原価へ算入
    isPurchase: isPurchase,
    linkedInventoryId: isPurchase ? linkedInventoryId : undefined,
    linkedInventoryQty: isPurchase ? linkedInventoryQty : undefined,
    receiptImage: currentReceiptDataUrl || undefined
  };

  const savedExp = saveExpense(expenseItem);

  // 仕入れ入庫連動：在庫マスタの数量を加算し、入庫ログを記録
  if (isPurchase && linkedInventoryId && linkedInventoryQty > 0) {
    const rawMatchTarget = payee || note || '仕入伝票';
    const unitCost = Math.round(amount / linkedInventoryQty);

    adjustStock(linkedInventoryId, linkedInventoryQty, `仕入入庫: ${payee || '仕入先未指定'}`, {
      sourceRef: savedExp ? savedExp.id : '',
      payee: payee,
      unitCost: unitCost,
      date: date
    });

    // 仕入名目と在庫商品のマッピングを学習辞書に保存
    if (DOM.expenseCheckSaveMapping && DOM.expenseCheckSaveMapping.checked && rawMatchTarget) {
      savePurchaseMapping(rawMatchTarget, linkedInventoryId);
    }
    renderInventoryTable();
  }

  // サーバー稼働時は data/receipts に原本写真を安全保管（経費データと1対1対応を保証）
  if (savedExp && typeof fetch !== 'undefined') {
    if (currentReceiptDataUrl && currentReceiptDataUrl.startsWith('data:image/')) {
      fetch('/api/save-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: savedExp.id, image: currentReceiptDataUrl })
      }).then(res => res.json()).then(data => {
        if (data && data.url) {
          savedExp.receiptImage = data.url;
          savedExp.receiptDataUrl = data.url;
        }
        syncReceiptStorageWithExpenses();
      }).catch(e => console.warn('Receipt server storage sync skipped:', e));
    } else if (!currentReceiptDataUrl && id) {
      // 編集時に写真を解除して保存された場合、サーバー側のファイルも削除
      fetch('/api/delete-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id })
      }).then(() => syncReceiptStorageWithExpenses()).catch(e => console.warn('Receipt delete skipped:', e));
    } else {
      syncReceiptStorageWithExpenses();
    }
  }

  resetExpenseForm();
  renderAccountingExpenses();
  renderAccountingDashboard(DOM.accSelectMonth ? DOM.accSelectMonth.value : '');
  renderAccountingJournals();
  initAccountingMonthSelector();
  
  if (isPurchase) {
    showToast(`仕入データを登録し、在庫を +${linkedInventoryQty} 反映しました！`, 'success');
  } else {
    showToast(id ? '経費データを更新しました！' : '経費と領収書写真を保存しました（電帳法対応）！', 'success');
  }
}

let isReceiptStorageSynced = false;

/**
 * 登録済み経費と data/receipts/ の写真の1対1対応を同期（孤立ファイルの自動クリーンアップ）
 */
function syncReceiptStorageWithExpenses() {
  if (typeof fetch === 'undefined') return;
  try {
    const expenses = getExpenseList();
    const activeIds = [];
    expenses.forEach(e => {
      if (e.id) activeIds.push(e.id);
      const img = e.receiptImage || e.receiptDataUrl || '';
      if (img.startsWith('/api/receipt/')) {
        const urlId = img.split('/api/receipt/')[1].split('?')[0].trim();
        if (urlId) activeIds.push(urlId);
      }
    });

    fetch('/api/sync-receipts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeIds, keepSamples: true })
    }).then(res => res.json()).then(data => {
      if (data && data.deletedCount > 0) {
        console.log(`[領収書写真1対1同期] 孤立した古い写真 ${data.deletedCount} 件を自動削除・クリーンアップしました:`, data.deletedFiles);
      }
    }).catch(e => console.warn('Receipt sync error:', e));
  } catch (err) {
    console.warn('syncReceiptStorageWithExpenses error:', err);
  }
}

function renderAccountingExpenses() {
  if (!DOM.expenseTableBody) return;

  // 初回表示時にサーバー上の孤立写真を自動クリーンアップして1対1整合性を確保
  if (!isReceiptStorageSynced) {
    isReceiptStorageSynced = true;
    syncReceiptStorageWithExpenses();
  }

  const expenses = getExpenseList();

  const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  if (DOM.expenseListTotalAmount) {
    DOM.expenseListTotalAmount.textContent = `合計: ${formatCurrency(total)}`;
  }

  if (expenses.length === 0) {
    DOM.expenseTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--slate-400); padding: 32px;">登録された経費はありません。レシート画像をアップロードするか手入力してください。</td></tr>`;
    return;
  }

  let html = '';
  expenses.forEach(exp => {
    const catName = ACCOUNT_CATEGORIES[exp.category]?.name || exp.category;
    const receiptImg = exp.receiptImage || exp.receiptDataUrl || '';
    const hasReceipt = !!receiptImg;
    const receiptBadge = hasReceipt
      ? `<div style="display: flex; flex-direction: column; align-items: center; gap: 3px;">
           <button type="button" class="btn btn-outline btn-xs" style="background: #eef2ff; color: #4338ca; border-color: #c7d2fe; font-weight: 700; padding: 4px 10px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" onclick="window.__previewExpenseReceipt('${exp.id}')">
             🔍 写真を見る
           </button>
           <span style="font-size: 9px; color: #059669; font-weight: 600; display: inline-flex; align-items: center; gap: 2px;">✓ 電帳法保存</span>
         </div>`
      : `<span style="color: var(--slate-400); font-size: 11px;">なし</span>`;

    html += `
      <tr>
        <td>${escapeHtml(exp.date)}</td>
        <td><span class="badge badge-primary">${escapeHtml(catName)}</span></td>
        <td>
          <div style="font-weight: 600; color: var(--slate-800);">${escapeHtml(exp.payee || '-')}</div>
          ${exp.note ? `<div style="font-size: 11px; color: var(--slate-500); margin-top: 2px;">${escapeHtml(exp.note)}</div>` : ''}
        </td>
        <td style="text-align: right; font-weight: 700; font-family: monospace;">${formatCurrency(exp.amount)}</td>
        <td style="text-align: center; font-size: 11px;">${exp.taxRate}%</td>
        <td style="text-align: center;">${receiptBadge}</td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 4px; justify-content: center;">
            <button class="btn btn-outline btn-xs" onclick="window.__editExpense('${exp.id}')">編集</button>
            <button class="btn btn-outline btn-xs btn-danger" onclick="window.__deleteExpense('${exp.id}')">削除</button>
          </div>
        </td>
      </tr>
    `;
  });
  if (DOM.expenseTableBody) {
    DOM.expenseTableBody.innerHTML = html;
  }

  // 財務会計タブ内の経費一覧サマリー台帳も描画
  const accSummaryBody = document.getElementById('accExpensesSummaryTableBody');
  if (accSummaryBody) {
    if (expenses.length === 0) {
      accSummaryBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--slate-400); padding: 32px;">登録された経費はありません。「AIレシート読み込み・経費登録画面を開く」からレシートを解析・登録できます。</td></tr>`;
    } else {
      let sumHtml = '';
      expenses.forEach(exp => {
        const catName = ACCOUNT_CATEGORIES[exp.category]?.name || exp.category;
        const receiptImg = exp.receiptImage || exp.receiptDataUrl || '';
        const hasReceipt = !!receiptImg;
        const receiptBadge = hasReceipt
          ? `<button type="button" class="btn btn-outline btn-xs" style="background: #eef2ff; color: #4338ca; border-color: #c7d2fe; font-weight: 700; padding: 2px 8px; border-radius: 4px; cursor: pointer;" onclick="window.__previewExpenseReceipt('${exp.id}')">🔍 写真</button>`
          : `<span style="color: var(--slate-400); font-size: 11px;">なし</span>`;
        sumHtml += `
          <tr>
            <td style="padding: 8px 12px;">${escapeHtml(exp.date)}</td>
            <td style="padding: 8px 12px; font-weight: 600; color: #1e293b;">${escapeHtml(exp.payee || '-')}</td>
            <td style="padding: 8px 12px;"><span class="badge" style="background: #eff6ff; color: #1d4ed8; font-size: 11px;">${escapeHtml(catName)}</span></td>
            <td style="padding: 8px 12px; text-align: right; font-weight: 700; font-family: monospace;">${formatCurrency(exp.amount)}</td>
            <td style="padding: 8px 12px; font-family: monospace; font-size: 11px; color: #64748b;">${escapeHtml(exp.invoiceNumber || '-')}</td>
            <td style="padding: 8px 12px; text-align: center;">${receiptBadge}</td>
          </tr>
        `;
      });
      accSummaryBody.innerHTML = sumHtml;
    }
  }
}

window.__editExpense = function(id) {
  const expenses = getExpenseList();
  const target = expenses.find(e => e.id === id);
  if (!target) return;

  DOM.expenseEditId.value = target.id;
  DOM.expenseInputDate.value = target.date || getTodayDateString();
  DOM.expenseSelectCategory.value = target.category || 'supplies';
  DOM.expenseInputAmount.value = target.amount || '';
  DOM.expenseSelectTax.value = String(target.taxRate || 10);
  DOM.expenseInputPayee.value = target.payee || '';
  if (DOM.expenseInputInvoiceNum) DOM.expenseInputInvoiceNum.value = target.invoiceNumber || '';
  DOM.expenseInputNote.value = target.note || '';

  const rImg = target.receiptImage || target.receiptDataUrl || '';
  if (rImg) {
    currentReceiptDataUrl = rImg;
    DOM.receiptImagePreview.src = rImg;
    DOM.receiptImagePreviewContainer.style.display = 'block';
  } else {
    clearReceiptImage();
  }

  DOM.btnSaveExpense.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> 経費を更新する`;

  DOM.formExpenseInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

window.__deleteExpense = function(id) {
  if (confirm('この経費データを削除しますか？\n※ 保存されている領収書写真もデータフォルダから完全に削除されます。')) {
    const expenses = getExpenseList();
    const target = expenses.find(e => e.id === id);
    const receiptUrl = target ? (target.receiptImage || target.receiptDataUrl || '') : '';

    deleteExpense(id);

    // サーバー上の写真ファイルも連動削除して1対1対応を完全に維持
    if (typeof fetch !== 'undefined') {
      fetch('/api/delete-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, receiptUrl: receiptUrl })
      }).then(() => {
        syncReceiptStorageWithExpenses();
      }).catch(e => console.warn('Failed to delete receipt photo from server:', e));
    }

    renderAccountingExpenses();
    renderAccountingDashboard(DOM.accSelectMonth ? DOM.accSelectMonth.value : '');
    renderAccountingJournals();
    showToast('経費データと領収書写真を削除しました');
  }
};

window.__previewExpenseReceipt = function(id) {
  const expenses = getExpenseList();
  const target = expenses.find(e => e.id === id);
  if (!target) {
    showToast('経費データが見つかりません', 'error');
    return;
  }
  const rImg = target.receiptImage || target.receiptDataUrl || '';
  if (!rImg) {
    showToast('この経費には領収書写真が登録されていません', 'info');
    return;
  }
  openReceiptZoom(rImg, target);
};

// ==========================================================================
// 複式簿記仕訳帳 コントローラー
// ==========================================================================
function renderAccountingJournals() {
  if (!DOM.accJournalTableBody) return;
  const month = DOM.accSelectMonth ? DOM.accSelectMonth.value : '';
  const invoices = getHistoryList();
  const expenses = getExpenseList();
  let entries = generateJournalEntries(invoices, expenses);

  if (month) {
    entries = entries.filter(e => e.date && e.date.startsWith(month));
  }

  if (entries.length === 0) {
    DOM.accJournalTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--slate-400); padding: 32px;">仕訳データはありません</td></tr>`;
    return;
  }

  let html = '';
  entries.forEach(e => {
    let typeBadge = '<span class="badge" style="background:#e0e7ff; color:#3730a3;">売上</span>';
    if (e.type === 'receipt') {
      typeBadge = '<span class="badge" style="background:#dcfce7; color:#166534;">入金</span>';
    } else if (e.type === 'expense') {
      typeBadge = '<span class="badge" style="background:#fef3c7; color:#92400e;">経費</span>';
    }

    html += `
      <tr>
        <td>${escapeHtml(e.date)}</td>
        <td style="font-weight: 600; color: var(--slate-800);">${escapeHtml(e.debitAccount)}</td>
        <td style="text-align: right; font-family: monospace; font-weight: 700;">${formatCurrency(e.debitAmount)}</td>
        <td style="font-weight: 600; color: var(--slate-800);">${escapeHtml(e.creditAccount)}</td>
        <td style="text-align: right; font-family: monospace; font-weight: 700;">${formatCurrency(e.creditAmount)}</td>
        <td style="color: var(--slate-600); font-size: 12px;">${escapeHtml(e.description)}</td>
        <td style="text-align: center;">${typeBadge}</td>
      </tr>
    `;
  });
  DOM.accJournalTableBody.innerHTML = html;
}

function handleExportJournalCSV() {
  const month = DOM.accSelectMonth ? DOM.accSelectMonth.value : '';
  const invoices = getHistoryList();
  const expenses = getExpenseList();
  let entries = generateJournalEntries(invoices, expenses);

  if (month) {
    entries = entries.filter(e => e.date && e.date.startsWith(month));
  }

  if (entries.length === 0) {
    alert('出力対象の仕訳データがありません。');
    return;
  }

  const csvContent = exportJournalsToCSV(entries);
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `仕訳帳_${month || '全期間'}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('仕訳帳CSVをダウンロードしました！', 'success');
}

// ==========================================================================
// 勤怠打刻（タイムカード） コントローラー
// ==========================================================================
function openAttendanceModal() {
  if (currentAppView !== 'attendance') {
    switchAppView('attendance');
    return;
  }
  updateAttendanceLiveClock();
  if (attendanceClockInterval) clearInterval(attendanceClockInterval);
  attendanceClockInterval = setInterval(updateAttendanceLiveClock, 1000);
  updateAttendanceUI();
}

function closeAttendanceModal() {
  if (attendanceClockInterval) {
    clearInterval(attendanceClockInterval);
    attendanceClockInterval = null;
  }
  switchAppView('portal');
}

window.openAttendanceModal = openAttendanceModal;
window.closeAttendanceModal = closeAttendanceModal;

function updateAttendanceLiveClock() {
  const now = new Date();
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const dayStr = days[now.getDay()];

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  if (DOM.attendanceLiveDate) {
    DOM.attendanceLiveDate.textContent = `${y}年${m}月${d}日 (${dayStr})`;
  }
  if (DOM.attendanceLiveTime) {
    DOM.attendanceLiveTime.textContent = `${hh}:${mm}:${ss}`;
  }
}

function updateAttendanceUI() {
  const todayRec = getTodayAttendance();

  // 本日のステータス表示
  let statusText = '未出勤';
  let statusColor = 'var(--slate-500)';

  if (todayRec) {
    if (todayRec.clockIn && !todayRec.clockOut) {
      statusText = '勤務中（休憩1h自動控除）';
      statusColor = 'var(--indigo-600)';
    } else if (todayRec.clockIn && todayRec.clockOut) {
      statusText = '退勤済（本日業務終了）';
      statusColor = 'var(--emerald-600)';
    }
  }

  if (DOM.attendanceTodayStatusText) {
    DOM.attendanceTodayStatusText.textContent = statusText;
    DOM.attendanceTodayStatusText.style.color = statusColor;
  }

  // 出勤ボタン
  if (DOM.btnClockIn) {
    if (todayRec && todayRec.clockIn) {
      DOM.btnClockIn.disabled = true;
      DOM.btnClockIn.style.opacity = '0.6';
    } else {
      DOM.btnClockIn.disabled = false;
      DOM.btnClockIn.style.opacity = '1';
    }
  }
  if (DOM.displayClockInTime) {
    DOM.displayClockInTime.textContent = todayRec && todayRec.clockIn ? `打刻: ${todayRec.clockIn}` : '未打刻';
  }

  // 退勤ボタン
  if (DOM.btnClockOut) {
    if (todayRec && todayRec.clockOut) {
      DOM.btnClockOut.disabled = true;
      DOM.btnClockOut.style.opacity = '0.6';
      DOM.btnClockOut.title = '本日の退勤打刻は完了しています';
    } else {
      DOM.btnClockOut.disabled = false;
      DOM.btnClockOut.style.opacity = '1';
      DOM.btnClockOut.title = '';
    }
  }
  if (DOM.displayClockOutTime) {
    DOM.displayClockOutTime.textContent = todayRec && todayRec.clockOut ? `打刻: ${todayRec.clockOut}` : '未打刻';
  }

  // 月間サマリー更新
  const currentMonth = getTodayDateString().substring(0, 7);
  const summary = calculateMonthlyAttendance(getAttendanceList(), currentMonth);

  if (DOM.summaryWorkDays) {
    DOM.summaryWorkDays.textContent = `${summary.workDays}日`;
  }
  if (DOM.summaryTotalWorkHours) {
    DOM.summaryTotalWorkHours.textContent = formatMinutesToHours(summary.totalWorkMinutes);
  }
  if (DOM.summaryTotalOvertime) {
    DOM.summaryTotalOvertime.textContent = formatMinutesToHours(summary.totalOvertimeMinutes);
  }

  // 履歴テーブル更新
  renderAttendanceHistoryTable();
}

function handleClockIn() {
  const rec = clockInToday();
  showToast(`出勤打刻しました（${rec.clockIn}）`, 'success');
  updateAttendanceUI();
}

function handleClockOut() {
  const todayRec = getTodayAttendance();
  if (!todayRec || !todayRec.clockIn) {
    if (!confirm('本日の出勤打刻がまだされていません。退勤時刻のみ打刻しますか？\n（出勤時刻は後から「打刻修正」で追加・変更できます）')) {
      return;
    }
  }
  const rec = clockOutToday();
  showToast(`退勤打刻しました（${rec.clockOut}）。お疲れ様でした！`, 'success');
  updateAttendanceUI();
}

function renderAttendanceHistoryTable() {
  if (!DOM.attendanceTableBody) return;
  const list = getAttendanceList();

  if (list.length === 0) {
    DOM.attendanceTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--slate-400); padding: 24px;">打刻履歴はありません</td></tr>`;
    return;
  }

  const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));

  let html = '';
  sorted.forEach(item => {
    const duration = calculateWorkDuration(item.clockIn, item.clockOut);
    const workHours = item.clockIn && item.clockOut ? formatMinutesToHours(duration.workMinutes) : '-';
    const overtimeHours = item.clockIn && item.clockOut && duration.overtimeMinutes > 0 ? formatMinutesToHours(duration.overtimeMinutes) : '-';

    html += `
      <tr>
        <td style="font-weight: 600;">${escapeHtml(item.date)}</td>
        <td style="font-family: monospace;">${escapeHtml(item.clockIn || '-')}</td>
        <td style="font-family: monospace;">${escapeHtml(item.clockOut || '-')}</td>
        <td style="color: var(--slate-500); font-size: 12px;">1時間（自動）</td>
        <td style="font-weight: 700; color: var(--indigo-700); font-family: monospace;">${workHours}</td>
        <td style="font-weight: 600; color: ${duration.overtimeMinutes > 0 ? '#e11d48' : 'var(--slate-500)'}; font-family: monospace;">${overtimeHours}</td>
        <td style="text-align: center; white-space: nowrap;">
          <button type="button" class="btn btn-secondary btn-xs" style="margin-right: 4px; padding: 2px 6px;" onclick="window.__editAttendanceRecord('${item.date}')">修正</button>
          <button type="button" class="btn btn-outline btn-xs btn-danger" style="padding: 2px 6px;" onclick="window.__deleteAttendanceRecord('${item.date}', '${item.id || ''}')">削除</button>
        </td>
      </tr>
    `;
  });
  DOM.attendanceTableBody.innerHTML = html;
}

window.__deleteAttendanceRecord = async function(date, id = '') {
  if (confirm(`${date} の打刻データを削除しますか？`)) {
    if (id) deleteAttendance(id);
    deleteAttendance(date);
    updateAttendanceUI();
    if (DOM.attendanceSheetModal && DOM.attendanceSheetModal.classList.contains('active')) {
      renderAttendanceCalendarSheet(currentSheetYM);
    }
    showToast(`${date} の打刻データを削除しました（ファイル同期完了）`, 'success');
  }
};

// ==========================================================================
// 打刻漏れ手動入力・修正フォーム制御
// ==========================================================================
function toggleManualAttendanceForm(show = null, dateToEdit = '') {
  if (!DOM.attendanceManualFormCard) return;
  const isHidden = DOM.attendanceManualFormCard.style.display === 'none';
  const shouldShow = show !== null ? show : isHidden;

  if (shouldShow) {
    DOM.attendanceManualFormCard.style.display = 'block';
    if (dateToEdit) {
      // 既存レコードの修正
      const list = getAttendanceList();
      const rec = list.find(a => a.date === dateToEdit);
      if (DOM.attendanceManualFormTitle) DOM.attendanceManualFormTitle.textContent = `✏️ 打刻修正: ${dateToEdit}`;
      if (DOM.inputManualAttDate) {
        DOM.inputManualAttDate.value = dateToEdit;
        DOM.inputManualAttDate.readOnly = true;
      }
      if (DOM.inputManualAttClockIn) DOM.inputManualAttClockIn.value = rec ? (rec.clockIn || '') : '';
      if (DOM.inputManualAttClockOut) DOM.inputManualAttClockOut.value = rec ? (rec.clockOut || '') : '';
      if (DOM.inputManualAttNote) DOM.inputManualAttNote.value = rec ? (rec.note || '') : '';
      if (DOM.inputManualAttId) DOM.inputManualAttId.value = rec ? (rec.id || '') : '';
    } else {
      // 新規入力（打刻漏れ追加）
      if (DOM.attendanceManualFormTitle) DOM.attendanceManualFormTitle.textContent = '✏️ 打刻漏れ修正・過去の勤怠入力';
      if (DOM.inputManualAttDate) {
        DOM.inputManualAttDate.value = getTodayDateString();
        DOM.inputManualAttDate.readOnly = false;
      }
      if (DOM.inputManualAttClockIn) DOM.inputManualAttClockIn.value = '09:00';
      if (DOM.inputManualAttClockOut) DOM.inputManualAttClockOut.value = '18:00';
      if (DOM.inputManualAttNote) DOM.inputManualAttNote.value = '';
      if (DOM.inputManualAttId) DOM.inputManualAttId.value = '';
    }
    if (DOM.inputManualAttClockIn) DOM.inputManualAttClockIn.focus();
  } else {
    DOM.attendanceManualFormCard.style.display = 'none';
  }
}

window.__editAttendanceRecord = function(date) {
  toggleManualAttendanceForm(true, date);
};

function handleSaveManualAttendance() {
  const date = DOM.inputManualAttDate?.value;
  const clockIn = DOM.inputManualAttClockIn?.value || '';
  const clockOut = DOM.inputManualAttClockOut?.value || '';
  const note = DOM.inputManualAttNote?.value || '';

  if (!date) {
    alert('勤務日を選択してください。');
    return;
  }
  if (!clockIn) {
    alert('出勤（始業）時刻を入力してください。');
    return;
  }

  const savedRec = saveAttendance({
    id: DOM.inputManualAttId?.value || ('att_' + date),
    date,
    clockIn,
    clockOut,
    note
  });

  if (savedRec) {
    showToast(`${date} の勤怠データを保存しました！`, 'success');
    toggleManualAttendanceForm(false);
    updateAttendanceUI();
    // もし出勤簿モーダルが開いていればそちらも再描画
    if (DOM.attendanceSheetModal && DOM.attendanceSheetModal.classList.contains('active')) {
      renderAttendanceCalendarSheet(currentSheetYM);
    }
  }
}

// ==========================================================================
// 出勤簿（A4帳票）モーダル制御
// ==========================================================================
let currentSheetYM = getTodayDateString().substring(0, 7);

function openAttendanceSheetModal(targetYM = '') {
  currentSheetYM = targetYM || currentSheetYM || getTodayDateString().substring(0, 7);
  if (DOM.sheetMonthSelector) {
    DOM.sheetMonthSelector.value = currentSheetYM;
  }
  
  // 社員番号・氏名の初期反映
  const emp = getAttendanceEmployee();
  if (DOM.inputSheetEmpNo) DOM.inputSheetEmpNo.value = emp.empNo || '1111';
  if (DOM.inputSheetEmpName) DOM.inputSheetEmpName.value = emp.empName || '宮崎真輔';

  renderAttendanceCalendarSheet(currentSheetYM);

  if (DOM.attendanceSheetModal) {
    DOM.attendanceSheetModal.classList.add('active');
  }
  document.body.style.overflow = 'hidden';
}

function closeAttendanceSheetModal() {
  if (DOM.attendanceSheetModal) {
    DOM.attendanceSheetModal.classList.remove('active');
  }
  document.body.style.overflow = '';
}

function changeSheetMonth(diff) {
  const [yStr, mStr] = currentSheetYM.split('-');
  let y = parseInt(yStr, 10);
  let m = parseInt(mStr, 10) + diff;
  if (m < 1) {
    m = 12;
    y -= 1;
  } else if (m > 12) {
    m = 1;
    y += 1;
  }
  currentSheetYM = `${y}-${String(m).padStart(2, '0')}`;
  if (DOM.sheetMonthSelector) {
    DOM.sheetMonthSelector.value = currentSheetYM;
  }
  renderAttendanceCalendarSheet(currentSheetYM);
}

function renderAttendanceCalendarSheet(ymStr) {
  if (!ymStr) return;
  const [yearStr, monthStr] = ymStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (DOM.dispSheetYear) DOM.dispSheetYear.textContent = String(year);
  if (DOM.dispSheetMonth) DOM.dispSheetMonth.textContent = String(month);

  const sheetData = generateMonthlyCalendarSheet(getAttendanceList(), year, month);
  if (!DOM.attCalendarTableBody) return;

  let html = '';
  sheetData.days.forEach(day => {
    let rowClass = '';
    if (day.isWeekend) {
      rowClass = day.isSaturday ? 'att-weekend-tr att-saturday-tr' : 'att-weekend-tr att-sunday-tr';
    }

    const inText = day.clockInParts.text || (day.isWeekend ? '' : ':');
    const outText = day.clockOutParts.text || (day.isWeekend ? '' : ':');
    const regText = day.regularParts.text || (day.isWeekend ? '' : ':');
    const otText = day.overtimeParts.text || (day.isWeekend ? '' : ':');

    html += `
      <tr class="${rowClass}" data-date="${day.date}" title="クリックしてこの日の勤怠を修正・入力">
        <td style="text-align: center; font-weight: 600;">${day.day}</td>
        <td style="text-align: center; font-weight: 600;">${day.weekday}</td>
        <td class="att-time-cell" onclick="window.__quickEditAttendanceDate('${day.date}')">${escapeHtml(inText)}</td>
        <td class="att-time-cell" onclick="window.__quickEditAttendanceDate('${day.date}')">${escapeHtml(outText)}</td>
        <td class="att-time-cell" onclick="window.__quickEditAttendanceDate('${day.date}')">${escapeHtml(regText)}</td>
        <td class="att-time-cell" onclick="window.__quickEditAttendanceDate('${day.date}')">${escapeHtml(otText)}</td>
        <td class="att-note-cell" onclick="window.__quickEditAttendanceDate('${day.date}')">${escapeHtml(day.note)}</td>
      </tr>
    `;
  });

  DOM.attCalendarTableBody.innerHTML = html;

  // サマリー合計更新
  if (DOM.dispSheetSummaryDays) DOM.dispSheetSummaryDays.textContent = String(sheetData.summary.workDays);
  if (DOM.dispSheetSummaryRegular) DOM.dispSheetSummaryRegular.textContent = formatMinutesToHM(sheetData.summary.totalRegularMinutes).text || '0 : 00';
  if (DOM.dispSheetSummaryOvertime) DOM.dispSheetSummaryOvertime.textContent = formatMinutesToHM(sheetData.summary.totalOvertimeMinutes).text || '0 : 00';
  if (DOM.dispSheetSummaryTotal) {
    DOM.dispSheetSummaryTotal.textContent = `総実働: ${sheetData.summary.totalWorkHoursText}`;
  }
}

window.__quickEditAttendanceDate = function(date) {
  // 出勤簿の行クリックで打刻漏れ修正フォームを呼出
  toggleManualAttendanceForm(true, date);
  // 勤怠モーダルが見えるように前面へスクロール
  if (DOM.attendanceManualFormCard) {
    DOM.attendanceManualFormCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

function handlePrintAttendanceSheet() {
  document.body.classList.add('printing-attendance-sheet');
  window.onafterprint = function() {
    document.body.classList.remove('printing-attendance-sheet');
  };
  window.print();
  setTimeout(() => {
    document.body.classList.remove('printing-attendance-sheet');
  }, 1000);
}

// ==========================================================================
// ユーティリティ
// ==========================================================================
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    <span>${message}</span>
  `;
  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3200);
}

// アプリ起動
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

})();
