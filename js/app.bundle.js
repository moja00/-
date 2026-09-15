/**
 * app.bundle.js
 * BillCraft - 納品書・請求書 かんたん発行アプリ
 * 外部依存なし・単体動作保証（file:// 直開き & http:// サーバー両対応）
 */

(function () {
  'use strict';

  // ==========================================================================
  // 定数・帳票設定
  // ==========================================================================
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
      dueLabel: '検収期日',
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
      primary: '#3b5bdb',
      primaryLight: '#eef2ff',
      primaryDark: '#2b44af',
      accent: '#4c6ef5'
    },
    navy: {
      primary: '#1e293b',
      primaryLight: '#f1f5f9',
      primaryDark: '#0f172a',
      accent: '#334155'
    },
    emerald: {
      primary: '#0f766e',
      primaryLight: '#f0fdfa',
      primaryDark: '#115e59',
      accent: '#14b8a6'
    },
    crimson: {
      primary: '#881337',
      primaryLight: '#fff1f2',
      primaryDark: '#4c0519',
      accent: '#e11d48'
    },
    slate: {
      primary: '#374151',
      primaryLight: '#f3f4f6',
      primaryDark: '#1f2937',
      accent: '#4b5563'
    }
  };

  const STORAGE_KEYS = {
    ACTIVE_DOC: 'quickdoc_active_doc',
    HISTORY: 'quickdoc_history_list',
    ISSUER_PROFILE: 'quickdoc_issuer_profile'
  };

  // サンプルデータ
  const SAMPLE_DOCS = {
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
          taxRate: 10
        },
        {
          id: 'sample_item_2',
          name: 'フロントエンド実装・レスポンシブWebコーディング',
          quantity: 1,
          unit: '式',
          unitPrice: 280000,
          taxRate: 10
        },
        {
          id: 'sample_item_3',
          name: 'CMS導入・管理画面カスタマイズ',
          quantity: 1,
          unit: '式',
          unitPrice: 180000,
          taxRate: 10
        },
        {
          id: 'sample_item_4',
          name: '月額クラウドサーバー運用保守（2026年9月度）',
          quantity: 1,
          unit: '月',
          unitPrice: 40000,
          taxRate: 10
        },
        {
          id: 'sample_item_5',
          name: 'プロジェクト管理用参考書籍・資材（軽減税率対象）',
          quantity: 2,
          unit: '冊',
          unitPrice: 4200,
          taxRate: 8
        }
      ],
      taxFractionRule: 'floor',
      notes: '・お振込手数料は貴社にてご負担いただけますようお願い申し上げます。\n・ご請求内容に関するご質問は、担当（support@nexus-studio.example.com）までご連絡ください。',
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
        name: '株式会社オフィスサプライ東京',
        invoiceNumber: 'T1012345678901',
        zip: '101-0041',
        address: '東京都千代田区神田須田町2-15-3',
        tel: '03-3250-1122',
        email: 'order@officesupply.example.jp',
        bankInfo: '三井住友銀行 神田支店\n当座 5544332\nカ）オフィスサプライトウキョウ',
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
          taxRate: 10
        },
        {
          id: 'del_item_2',
          name: 'エルゴノミック メッシュチェア（ハイバック）',
          quantity: 5,
          unit: '脚',
          unitPrice: 62000,
          taxRate: 10
        },
        {
          id: 'del_item_3',
          name: '来客用ドリップコーヒー＆緑茶セット（軽減税率対象）',
          quantity: 4,
          unit: '箱',
          unitPrice: 3800,
          taxRate: 8
        }
      ],
      taxFractionRule: 'floor',
      notes: '・納品物をご確認の上、受領印をいただけますようお願い申し上げます。\n・初期不良等の交換対応は納品日より14日以内にご連絡ください。',
      themeColor: 'emerald'
    }
  };

  // ==========================================================================
  // 計算・フォーマット関数
  // ==========================================================================
  function generateDocNumber(docType = 'invoice') {
    const prefix = DOC_TYPES[docType]?.prefix || 'DOC-';
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = String(Math.floor(100 + Math.random() * 900));
    return `${prefix}${y}${m}${d}-${rand}`;
  }

  function getDefaultDates() {
    const now = new Date();
    const issue = now.toISOString().split('T')[0];
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const due = nextMonth.toISOString().split('T')[0];
    return { issue, due };
  }

  function createEmptyInvoice(docType = 'invoice') {
    const dates = getDefaultDates();
    return {
      id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      docType: docType,
      docNumber: generateDocNumber(docType),
      issueDate: dates.issue,
      dueDate: dates.due,
      title: '業務委託料',
      client: {
        name: '株式会社サンプル',
        honorific: '御中',
        zip: '100-0001',
        address: '東京都千代田区千代田1-1',
        contactPerson: ''
      },
      issuer: {
        name: 'スタジオ・クラフト',
        invoiceNumber: 'T1234567890123',
        zip: '150-0002',
        address: '東京都渋谷区渋谷2-2-2',
        tel: '03-1234-5678',
        email: 'info@craft.example.com',
        bankInfo: 'みずほ銀行 渋谷支店\n普通 1234567\n口座名義: カ）スタジオクラフト',
        stampDataUrl: '',
        showStamp: true
      },
      items: [
        {
          id: 'item_1',
          name: '基本業務一式',
          quantity: 1,
          unit: '式',
          unitPrice: 100000,
          taxRate: 10
        }
      ],
      taxFractionRule: 'floor',
      notes: 'お振込手数料は貴社にてご負担くださいますようお願い申し上げます。',
      themeColor: 'indigo'
    };
  }

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
      return Math.floor(val);
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

  function formatCurrency(amount) {
    const num = Number(amount) || 0;
    return '¥' + num.toLocaleString('ja-JP');
  }

  function formatJapaneseDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`;
    }
    return dateStr;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================================================
  // 角印（電子印鑑）自動生成
  // ==========================================================================
  function generateCompanyStamp(companyName = '', options = {}) {
    const size = options.size || 240;
    const color = options.color || '#dc2626';
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, size, size);

    let text = (companyName.trim() || '社印');
    if (!text.endsWith('之印') && !text.endsWith('印')) {
      text = text + '之印';
    }

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

    // 内枠
    const innerPad = padding + size * 0.024;
    const innerSize = outerSize - size * 0.048;
    ctx.lineWidth = size * 0.012;
    drawRoundedRect(ctx, innerPad, innerPad, innerSize, innerSize, radius * 0.7);
    ctx.stroke();

    // 縦書き配置（右から左へ）
    const chars = Array.from(text);
    const totalChars = chars.length;

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
      if (colChars.length > 0) columns.push(colChars);
    }
    const renderColumns = [...columns].reverse();

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

    // アナログ感ノイズ
    for (let i = 0; i < 30; i++) {
      const nx = size * 0.1 + Math.random() * (size * 0.8);
      const ny = size * 0.1 + Math.random() * (size * 0.8);
      ctx.globalAlpha = 0.12 + Math.random() * 0.15;
      ctx.beginPath();
      ctx.arc(nx, ny, Math.random() * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    return canvas.toDataURL('image/png');
  }

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

  // ==========================================================================
  // ストレージ管理
  // ==========================================================================
  function saveActiveDoc(doc) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_DOC, JSON.stringify(doc));
    } catch (e) {
      console.error(e);
    }
  }

  function loadActiveDoc() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_DOC);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveIssuerProfile(issuer) {
    try {
      localStorage.setItem(STORAGE_KEYS.ISSUER_PROFILE, JSON.stringify(issuer));
    } catch (e) {}
  }

  function loadIssuerProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ISSUER_PROFILE);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function getHistoryList() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveDocToHistory(doc) {
    try {
      const list = getHistoryList();
      const existingIndex = list.findIndex(item => item.id === doc.id);
      const summaryItem = {
        id: doc.id,
        docType: doc.docType,
        docNumber: doc.docNumber,
        title: doc.title,
        clientName: doc.client?.name || '名称未設定',
        issueDate: doc.issueDate,
        dueDate: doc.dueDate,
        updatedAt: new Date().toISOString(),
        fullDoc: doc
      };

      if (existingIndex >= 0) {
        list[existingIndex] = summaryItem;
      } else {
        list.unshift(summaryItem);
      }

      if (list.length > 50) list.length = 50;

      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(list));
      if (doc.issuer) saveIssuerProfile(doc.issuer);
      return true;
    } catch (e) {
      return false;
    }
  }

  function deleteDocFromHistory(id) {
    try {
      const list = getHistoryList().filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  function exportDataAsJSON() {
    const backupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      activeDoc: loadActiveDoc(),
      issuerProfile: loadIssuerProfile(),
      history: getHistoryList()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BillCraft_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importDataFromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') throw new Error('形式が不正です');
      if (data.issuerProfile) localStorage.setItem(STORAGE_KEYS.ISSUER_PROFILE, JSON.stringify(data.issuerProfile));
      if (data.history) localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
      if (data.activeDoc) localStorage.setItem(STORAGE_KEYS.ACTIVE_DOC, JSON.stringify(data.activeDoc));
      return { success: true, activeDoc: data.activeDoc || null };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // ==========================================================================
  // アプリケーション状態 & DOM参照
  // ==========================================================================
  let currentDoc = null;
  let DOM = {};

  function cacheDom() {
    DOM = {
      docTypeBtns: document.querySelectorAll('.doc-type-btn'),
      tabBtns: document.querySelectorAll('.editor-tab-btn'),
      tabPanes: document.querySelectorAll('.tab-pane'),
      itemCountBadge: document.getElementById('itemCountBadge'),

      inputDocNumber: document.getElementById('inputDocNumber'),
      btnRegenDocNumber: document.getElementById('btnRegenDocNumber'),
      labelIssueDate: document.getElementById('labelIssueDate'),
      inputIssueDate: document.getElementById('inputIssueDate'),
      labelDueDate: document.getElementById('labelDueDate'),
      inputDueDate: document.getElementById('inputDueDate'),
      inputTitle: document.getElementById('inputTitle'),

      inputClientName: document.getElementById('inputClientName'),
      inputClientHonorific: document.getElementById('inputClientHonorific'),
      inputClientZip: document.getElementById('inputClientZip'),
      inputClientAddress: document.getElementById('inputClientAddress'),
      inputClientContact: document.getElementById('inputClientContact'),

      itemsContainer: document.getElementById('itemsContainer'),
      btnAddItem: document.getElementById('btnAddItem'),
      selectFractionRule: document.getElementById('selectFractionRule'),

      inputIssuerName: document.getElementById('inputIssuerName'),
      inputIssuerInvoiceNo: document.getElementById('inputIssuerInvoiceNo'),
      inputIssuerZip: document.getElementById('inputIssuerZip'),
      inputIssuerTel: document.getElementById('inputIssuerTel'),
      inputIssuerAddress: document.getElementById('inputIssuerAddress'),
      inputIssuerEmail: document.getElementById('inputIssuerEmail'),
      inputBankInfo: document.getElementById('inputBankInfo'),
      inputNotes: document.getElementById('inputNotes'),
      btnInsertTemplateNote: document.getElementById('btnInsertTemplateNote'),

      checkShowStamp: document.getElementById('checkShowStamp'),
      btnAutoGenerateStamp: document.getElementById('btnAutoGenerateStamp'),
      fileStampUpload: document.getElementById('fileStampUpload'),
      stampPreviewThumb: document.getElementById('stampPreviewThumb'),

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

      btnPrint: document.getElementById('btnPrint'),
      btnSaveHistory: document.getElementById('btnSaveHistory'),
      colorDotBtns: document.querySelectorAll('.color-dot-btn'),

      btnNewDoc: document.getElementById('btnNewDoc'),
      btnLoadSample: document.getElementById('btnLoadSample'),
      btnOpenHistory: document.getElementById('btnOpenHistory'),
      btnOpenBackup: document.getElementById('btnOpenBackup'),

      historyModal: document.getElementById('historyModal'),
      btnCloseHistoryModal: document.getElementById('btnCloseHistoryModal'),
      btnCloseHistoryModal2: document.getElementById('btnCloseHistoryModal2'),
      historyListContainer: document.getElementById('historyListContainer'),

      backupModal: document.getElementById('backupModal'),
      btnCloseBackupModal: document.getElementById('btnCloseBackupModal'),
      btnCloseBackupModal2: document.getElementById('btnCloseBackupModal2'),
      btnExportJSON: document.getElementById('btnExportJSON'),
      fileImportJSON: document.getElementById('fileImportJSON'),

      toastContainer: document.getElementById('toastContainer')
    };
  }

  // ==========================================================================
  // レンダリング & イベント初期化
  // ==========================================================================
  function initApp() {
    cacheDom();

    const saved = loadActiveDoc();
    if (saved) {
      currentDoc = saved;
    } else {
      currentDoc = JSON.parse(JSON.stringify(SAMPLE_DOCS.invoice));
      const profile = loadIssuerProfile();
      if (profile) currentDoc.issuer = { ...currentDoc.issuer, ...profile };
    }

    if (!currentDoc.issuer.stampDataUrl && currentDoc.issuer.name) {
      currentDoc.issuer.stampDataUrl = generateCompanyStamp(currentDoc.issuer.name);
    }

    populateFormFromDoc();
    updateThemeColor(currentDoc.themeColor || 'indigo');
    renderAll();
    setupEventListeners();
  }

  function populateFormFromDoc() {
    DOM.docTypeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === currentDoc.docType);
    });

    DOM.inputDocNumber.value = currentDoc.docNumber || '';
    DOM.inputIssueDate.value = currentDoc.issueDate || '';
    DOM.inputDueDate.value = currentDoc.dueDate || '';
    DOM.inputTitle.value = currentDoc.title || '';

    DOM.inputClientName.value = currentDoc.client?.name || '';
    DOM.inputClientHonorific.value = currentDoc.client?.honorific || '御中';
    DOM.inputClientZip.value = currentDoc.client?.zip || '';
    DOM.inputClientAddress.value = currentDoc.client?.address || '';
    DOM.inputClientContact.value = currentDoc.client?.contactPerson || '';

    DOM.inputIssuerName.value = currentDoc.issuer?.name || '';
    DOM.inputIssuerInvoiceNo.value = currentDoc.issuer?.invoiceNumber || '';
    DOM.inputIssuerZip.value = currentDoc.issuer?.zip || '';
    DOM.inputIssuerTel.value = currentDoc.issuer?.tel || '';
    DOM.inputIssuerAddress.value = currentDoc.issuer?.address || '';
    DOM.inputIssuerEmail.value = currentDoc.issuer?.email || '';
    DOM.inputBankInfo.value = currentDoc.issuer?.bankInfo || '';
    DOM.inputNotes.value = currentDoc.notes || '';

    DOM.checkShowStamp.checked = currentDoc.issuer?.showStamp !== false;
    updateStampThumbnail(currentDoc.issuer?.stampDataUrl);
    DOM.selectFractionRule.value = currentDoc.taxFractionRule || 'floor';

    renderItemInputCards();
  }

  function renderAll() {
    const meta = DOC_TYPES[currentDoc.docType] || DOC_TYPES.invoice;

    DOM.labelIssueDate.textContent = meta.dateLabel;
    DOM.labelDueDate.textContent = meta.dueLabel;

    let spacedTitle = meta.badge;
    if (spacedTitle.length === 3) {
      spacedTitle = spacedTitle[0] + ' ' + spacedTitle[1] + ' ' + spacedTitle[2];
    } else if (spacedTitle.length === 4) {
      spacedTitle = spacedTitle[0] + ' ' + spacedTitle[1] + ' ' + spacedTitle[2] + ' ' + spacedTitle[3];
    }
    DOM.sheetDocTitle.textContent = spacedTitle;
    DOM.sheetDocSubject.textContent = currentDoc.title || '';

    DOM.sheetDocNumber.textContent = currentDoc.docNumber || '';
    DOM.sheetLabelIssueDate.textContent = meta.dateLabel;
    DOM.sheetIssueDate.textContent = formatJapaneseDate(currentDoc.issueDate);

    if (currentDoc.docType === 'receipt') {
      DOM.sheetRowDueDate.style.display = 'none';
    } else {
      DOM.sheetRowDueDate.style.display = 'table-row';
      DOM.sheetLabelDueDate.textContent = meta.dueLabel;
      DOM.sheetDueDate.textContent = formatJapaneseDate(currentDoc.dueDate);
    }

    DOM.sheetClientName.textContent = currentDoc.client?.name || '　　　　　　　　';
    DOM.sheetClientHonorific.textContent = currentDoc.client?.honorific || '';
    DOM.sheetClientZip.textContent = currentDoc.client?.zip ? `〒${currentDoc.client.zip}` : '';
    DOM.sheetClientAddress.textContent = currentDoc.client?.address || '';
    DOM.sheetClientContact.textContent = currentDoc.client?.contactPerson || '';

    if (currentDoc.docType === 'invoice') {
      DOM.sheetLeadMessage.textContent = '下記の通り、御請求申し上げます。';
    } else if (currentDoc.docType === 'delivery') {
      DOM.sheetLeadMessage.textContent = '下記の通り、納品申し上げます。';
    } else if (currentDoc.docType === 'estimate') {
      DOM.sheetLeadMessage.textContent = '下記の通り、御見積申し上げます。';
    } else if (currentDoc.docType === 'receipt') {
      DOM.sheetLeadMessage.textContent = '上記の金額を正に領収いたしました。';
    }

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
    DOM.sheetIssuerEmail.textContent = currentDoc.issuer?.email ? `Email: ${currentDoc.issuer.email}` : '';

    if (currentDoc.issuer?.showStamp && currentDoc.issuer?.stampDataUrl) {
      DOM.sheetStampWrapper.style.display = 'block';
      DOM.sheetStampImg.src = currentDoc.issuer.stampDataUrl;
    } else {
      DOM.sheetStampWrapper.style.display = 'none';
    }

    const totals = calculateTotals(currentDoc.items, currentDoc.taxFractionRule);

    DOM.sheetAmountBannerLabel.textContent = `${meta.amountLabel}（税込）`;
    DOM.sheetBannerGrandTotal.textContent = formatCurrency(totals.grandTotal);
    DOM.sheetBannerTaxTotal.textContent = `(内消費税等 ${formatCurrency(totals.taxTotal)})`;

    renderSheetItemsTable(currentDoc.items);

    DOM.sheetSubtotalWithoutTax.textContent = formatCurrency(totals.subtotalWithoutTax);
    DOM.sheetTaxTotal.textContent = formatCurrency(totals.taxTotal);
    DOM.sheetGrandTotalLabel.textContent = `${meta.amountLabel} (税込)`;
    DOM.sheetGrandTotal.textContent = formatCurrency(totals.grandTotal);

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

    DOM.itemCountBadge.textContent = currentDoc.items.length;
    saveActiveDoc(currentDoc);
  }

  function renderSheetItemsTable(items = []) {
    DOM.sheetItemsTableBody.innerHTML = '';

    if (items.length === 0) {
      const emptyTr = document.createElement('tr');
      emptyTr.innerHTML = `<td colspan="7" style="text-align: center; color: #94a3b8; padding: 24px;">明細がありません。「行を追加」ボタンから追加してください。</td>`;
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

      tr.innerHTML = `
        <td class="td-num">${index + 1}</td>
        <td class="td-item-name">${escapeHtml(item.name || '')}</td>
        <td class="td-right">${qty ? qty.toLocaleString('ja-JP') : ''}</td>
        <td style="text-align: center;">${escapeHtml(item.unit || '')}</td>
        <td class="td-right">${formatCurrency(price)}</td>
        <td class="td-right" style="font-weight: 600;">${formatCurrency(lineTotal)}</td>
        <td style="text-align: center;">${taxBadge}</td>
      `;
      DOM.sheetItemsTableBody.appendChild(tr);
    });
  }

  function renderItemInputCards() {
    DOM.itemsContainer.innerHTML = '';

    currentDoc.items.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'item-card';
      card.dataset.itemId = item.id;

      card.innerHTML = `
        <div class="item-card-header">
          <span class="item-index-badge">明細 #${index + 1}</span>
          <div class="item-actions">
            <button type="button" class="btn-icon-danger btn-delete-item" title="この行を削除">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </div>
        <div class="form-group" style="margin-bottom: 8px;">
          <input type="text" class="form-input item-input-name" placeholder="品名・摘要・項目名" value="${escapeHtml(item.name || '')}">
        </div>
        <div class="item-grid">
          <div>
            <label class="form-label" style="font-size: 0.725rem;">数量</label>
            <input type="number" class="form-input item-input-qty" value="${item.quantity !== undefined ? item.quantity : 1}" min="0" step="any">
          </div>
          <div>
            <label class="form-label" style="font-size: 0.725rem;">単位</label>
            <input type="text" class="form-input item-input-unit" placeholder="式" value="${escapeHtml(item.unit || '')}">
          </div>
          <div>
            <label class="form-label" style="font-size: 0.725rem;">単価 (税抜)</label>
            <input type="number" class="form-input item-input-price" value="${item.unitPrice !== undefined ? item.unitPrice : 0}" min="0">
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
            <div class="item-line-total" style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); padding: 8px 0; text-align: right;">
              ${formatCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
            </div>
          </div>
        </div>
      `;

      card.querySelector('.btn-delete-item').addEventListener('click', () => {
        currentDoc.items.splice(index, 1);
        renderItemInputCards();
        renderAll();
      });

      const inputName = card.querySelector('.item-input-name');
      const inputQty = card.querySelector('.item-input-qty');
      const inputUnit = card.querySelector('.item-input-unit');
      const inputPrice = card.querySelector('.item-input-price');
      const selectTax = card.querySelector('.item-select-tax');
      const displayTotal = card.querySelector('.item-line-total');

      const handleItemChange = () => {
        item.name = inputName.value;
        item.quantity = Number(inputQty.value) || 0;
        item.unit = inputUnit.value;
        item.unitPrice = Number(inputPrice.value) || 0;
        item.taxRate = Number(selectTax.value);

        displayTotal.textContent = formatCurrency(item.quantity * item.unitPrice);
        renderAll();
      };

      inputName.addEventListener('input', handleItemChange);
      inputQty.addEventListener('input', handleItemChange);
      inputUnit.addEventListener('input', handleItemChange);
      inputPrice.addEventListener('input', handleItemChange);
      selectTax.addEventListener('change', handleItemChange);

      DOM.itemsContainer.appendChild(card);
    });
  }

  function setupEventListeners() {
    DOM.docTypeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        currentDoc.docType = type;
        DOM.docTypeBtns.forEach(b => b.classList.toggle('active', b === btn));
        currentDoc.docNumber = generateDocNumber(type);
        DOM.inputDocNumber.value = currentDoc.docNumber;
        renderAll();
        showToast(`「${DOC_TYPES[type].label}」に切り替えました`);
      });
    });

    DOM.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.tab;
        DOM.tabBtns.forEach(b => b.classList.toggle('active', b === btn));
        DOM.tabPanes.forEach(p => {
          p.style.display = (p.id === targetId) ? 'block' : 'none';
        });
      });
    });

    DOM.btnRegenDocNumber.addEventListener('click', () => {
      currentDoc.docNumber = generateDocNumber(currentDoc.docType);
      DOM.inputDocNumber.value = currentDoc.docNumber;
      renderAll();
      showToast('新しい書類番号を採番しました');
    });

    const bindInput = (el, setter) => {
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
    DOM.inputClientHonorific.addEventListener('change', e => {
      currentDoc.client.honorific = e.target.value;
      renderAll();
    });
    bindInput(DOM.inputClientZip, val => currentDoc.client.zip = val);
    bindInput(DOM.inputClientAddress, val => currentDoc.client.address = val);
    bindInput(DOM.inputClientContact, val => currentDoc.client.contactPerson = val);

    bindInput(DOM.inputIssuerName, val => currentDoc.issuer.name = val);
    bindInput(DOM.inputIssuerInvoiceNo, val => currentDoc.issuer.invoiceNumber = val);
    bindInput(DOM.inputIssuerZip, val => currentDoc.issuer.zip = val);
    bindInput(DOM.inputIssuerTel, val => currentDoc.issuer.tel = val);
    bindInput(DOM.inputIssuerAddress, val => currentDoc.issuer.address = val);
    bindInput(DOM.inputIssuerEmail, val => currentDoc.issuer.email = val);
    bindInput(DOM.inputBankInfo, val => currentDoc.issuer.bankInfo = val);
    bindInput(DOM.inputNotes, val => currentDoc.notes = val);

    DOM.selectFractionRule.addEventListener('change', e => {
      currentDoc.taxFractionRule = e.target.value;
      renderAll();
    });

    DOM.btnAddItem.addEventListener('click', () => {
      currentDoc.items.push({
        id: 'item_' + Date.now(),
        name: '',
        quantity: 1,
        unit: '式',
        unitPrice: 0,
        taxRate: 10
      });
      renderItemInputCards();
      renderAll();
    });

    DOM.btnInsertTemplateNote.addEventListener('click', () => {
      const defaultNotes = 'お振込手数料は貴社にてご負担くださいますようお願い申し上げます。\nご不明な点がございましたらお気軽にお問い合わせください。';
      DOM.inputNotes.value = defaultNotes;
      currentDoc.notes = defaultNotes;
      renderAll();
      showToast('備考欄に定型文を挿入しました');
    });

    DOM.checkShowStamp.addEventListener('change', e => {
      currentDoc.issuer.showStamp = e.target.checked;
      renderAll();
    });

    DOM.btnAutoGenerateStamp.addEventListener('click', () => {
      const name = currentDoc.issuer?.name?.trim() || '社印';
      const stampUrl = generateCompanyStamp(name);
      currentDoc.issuer.stampDataUrl = stampUrl;
      currentDoc.issuer.showStamp = true;
      DOM.checkShowStamp.checked = true;
      updateStampThumbnail(stampUrl);
      renderAll();
      showToast(`「${name}」の角印スタンプを生成しました！`, 'success');
    });

    DOM.fileStampUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        currentDoc.issuer.stampDataUrl = dataUrl;
        currentDoc.issuer.showStamp = true;
        DOM.checkShowStamp.checked = true;
        updateStampThumbnail(dataUrl);
        renderAll();
        showToast('印鑑画像をアップロードしました', 'success');
      };
      reader.readAsDataURL(file);
    });

    DOM.colorDotBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        updateThemeColor(color);
        currentDoc.themeColor = color;
        renderAll();
      });
    });

    DOM.btnPrint.addEventListener('click', () => {
      window.print();
    });

    DOM.btnSaveHistory.addEventListener('click', () => {
      const success = saveDocToHistory(currentDoc);
      if (success) {
        showToast('作成履歴に保存しました！', 'success');
      }
    });

    DOM.btnNewDoc.addEventListener('click', () => {
      if (confirm('新しく白紙の書類を作成しますか？')) {
        const profile = currentDoc.issuer;
        currentDoc = createEmptyInvoice('invoice');
        if (profile) currentDoc.issuer = profile;
        populateFormFromDoc();
        renderAll();
        showToast('新しい書類を作成しました');
      }
    });

    DOM.btnLoadSample.addEventListener('click', () => {
      const targetType = currentDoc.docType === 'delivery' ? 'delivery' : 'invoice';
      const sample = SAMPLE_DOCS[targetType] || SAMPLE_DOCS.invoice;
      currentDoc = JSON.parse(JSON.stringify(sample));
      currentDoc.issuer.stampDataUrl = generateCompanyStamp(currentDoc.issuer.name);
      populateFormFromDoc();
      updateThemeColor(currentDoc.themeColor || 'indigo');
      renderAll();
      showToast('サンプルデータを読み込みました');
    });

    DOM.btnOpenHistory.addEventListener('click', openHistoryModal);
    DOM.btnCloseHistoryModal.addEventListener('click', closeHistoryModal);
    DOM.btnCloseHistoryModal2.addEventListener('click', closeHistoryModal);
    DOM.historyModal.addEventListener('click', (e) => {
      if (e.target === DOM.historyModal) closeHistoryModal();
    });

    DOM.btnOpenBackup.addEventListener('click', openBackupModal);
    DOM.btnCloseBackupModal.addEventListener('click', closeBackupModal);
    DOM.btnCloseBackupModal2.addEventListener('click', closeBackupModal);
    DOM.backupModal.addEventListener('click', (e) => {
      if (e.target === DOM.backupModal) closeBackupModal();
    });

    DOM.btnExportJSON.addEventListener('click', () => {
      exportDataAsJSON();
      showToast('バックアップJSONをダウンロードしました', 'success');
    });

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

  function updateStampThumbnail(dataUrl) {
    if (dataUrl) {
      DOM.stampPreviewThumb.innerHTML = `<img src="${dataUrl}" style="width: 100%; height: 100%; object-fit: contain;">`;
    } else {
      DOM.stampPreviewThumb.innerHTML = `<span style="font-size: 0.7rem; color: var(--text-muted);">プレビュー</span>`;
    }
  }

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
        `;
        card.innerHTML = `
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="background: var(--theme-primary-light); color: var(--theme-primary-dark); font-weight: 700; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px;">
                ${typeMeta.label}
              </span>
              <span style="font-weight: 700; font-size: 0.9rem;">${escapeHtml(item.clientName)}</span>
              <span style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(item.docNumber)}</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">
              件名: ${escapeHtml(item.title || '無題')} / 発行日: ${item.issueDate || '-'}
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-outline-primary btn-sm btn-load-doc">読み込む</button>
            <button type="button" class="btn-icon-danger btn-delete-doc" title="削除">✕</button>
          </div>
        `;

        card.querySelector('.btn-load-doc').addEventListener('click', () => {
          if (item.fullDoc) {
            currentDoc = item.fullDoc;
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
            openHistoryModal();
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

  // 起動
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
