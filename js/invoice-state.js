/**
 * invoice-state.js
 * 帳票データ構造、インボイス制度準拠の税金計算、フォーマットユーティリティ
 */

export const DOC_TYPES = {
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

export const THEME_COLORS = {
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
export function generateDocNumber(docType = 'invoice') {
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
export function getDefaultDates() {
  const now = new Date();
  const issue = now.toISOString().split('T')[0];

  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const due = nextMonth.toISOString().split('T')[0];

  return { issue, due };
}

/**
 * 初期帳票データモデル作成
 */
export function createEmptyInvoice(docType = 'invoice') {
  const dates = getDefaultDates();
  return {
    id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    docType: docType,
    docNumber: generateDocNumber(docType),
    issueDate: dates.issue,
    dueDate: dates.due,
    title: 'Webサイト制作および運用保守業務',
    client: {
      name: '株式会社サンプル',
      honorific: '御中',
      zip: '100-0001',
      address: '東京都千代田区千代田1-1',
      contactPerson: ''
    },
    issuer: {
      name: 'デザインスタジオ・クラフト',
      invoiceNumber: 'T1234567890123',
      zip: '150-0002',
      address: '東京都渋谷区渋谷2-2-2 クラフトビル 4F',
      tel: '03-1234-5678',
      email: 'info@craft-design.example.jp',
      bankInfo: 'みずほ銀行 渋谷支店\n普通 1234567\n口座名義：カ）クラフトデザイン',
      stampDataUrl: '',
      showStamp: true
    },
    items: [
      {
        id: 'item_1',
        name: 'ホームページUI/UXリニューアルデザイン一式',
        quantity: 1,
        unit: '式',
        unitPrice: 280000,
        taxRate: 10
      },
      {
        id: 'item_2',
        name: 'フロントエンド実装・レスポンシブコーディング',
        quantity: 1,
        unit: '式',
        unitPrice: 150000,
        taxRate: 10
      },
      {
        id: 'item_3',
        name: '参考技術書籍・資材費（軽減税率対象）',
        quantity: 2,
        unit: '冊',
        unitPrice: 3500,
        taxRate: 8
      }
    ],
    taxFractionRule: 'floor', // 'floor' | 'round' | 'ceil'
    notes: 'お振込手数料は貴社にてご負担くださいますようお願い申し上げます。\nご不明な点がございましたらお気軽にお問い合わせください。',
    themeColor: 'indigo',
    updatedAt: new Date().toISOString()
  };
}

/**
 * インボイス制度対応の税金・小計計算
 * 日本の適格請求書等保存方式のルール:
 * 「税率ごとに合算した税抜合計額に対して、消費税率を乗じて端数処理を行う」
 */
export function calculateTotals(items = [], fractionRule = 'floor') {
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
 * 通貨フォーマット (¥1,234,567)
 */
export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return '¥' + num.toLocaleString('ja-JP');
}

/**
 * 日本語日付フォーマット (2026年9月15日)
 */
export function formatJapaneseDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`;
  }
  return dateStr;
}
