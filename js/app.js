/**
 * app.js
 * BillCraft メインコントローラー
 * イベントハンドリング、リアルタイムUI更新、プレビュー同期
 */

import {
  DOC_TYPES,
  THEME_COLORS,
  generateDocNumber,
  createEmptyInvoice,
  calculateTotals,
  formatCurrency,
  formatJapaneseDate
} from './invoice-state.js';

import { generateCompanyStamp } from './stamp-generator.js';

import {
  saveActiveDoc,
  loadActiveDoc,
  saveIssuerProfile,
  loadIssuerProfile,
  getHistoryList,
  saveDocToHistory,
  deleteDocFromHistory,
  getDocFromHistory,
  exportDataAsJSON,
  importDataFromJSON
} from './storage.js';

import { SAMPLE_DOCUMENTS } from './sample-data.js';

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

  toastContainer: document.getElementById('toastContainer')
};

// ==========================================================================
// 初期化
// ==========================================================================
function initApp() {
  // 保存されたアクティブドキュメントがあるか確認
  const saved = loadActiveDoc();
  if (saved) {
    currentDoc = saved;
  } else {
    // なければ初期サンプルデータを設定
    currentDoc = JSON.parse(JSON.stringify(SAMPLE_DOCUMENTS.invoice));
    // 自社プロファイルがあれば上書き適用
    const profile = loadIssuerProfile();
    if (profile) {
      currentDoc.issuer = { ...currentDoc.issuer, ...profile };
    }
  }

  // 印鑑が未生成なら自社名から自動生成
  if (!currentDoc.issuer.stampDataUrl && currentDoc.issuer.name) {
    currentDoc.issuer.stampDataUrl = generateCompanyStamp(currentDoc.issuer.name);
  }

  // UIへ反映
  populateFormFromDoc();
  updateThemeColor(currentDoc.themeColor || 'indigo');
  renderAll();

  // イベントリスナーを接続
  setupEventListeners();

  showToast('BillCraft へようこそ！帳票の作成・印刷が可能です。', 'info');
}

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

  // 明細数バッジ
  DOM.itemCountBadge.textContent = currentDoc.items.length;

  // LocalStorageに常時保存
  saveActiveDoc(currentDoc);
}

// ==========================================================================
// プレビュー用明細テーブルのレンダリング
// ==========================================================================
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

// ==========================================================================
// エディタ用明細入力カードのレンダリング
// ==========================================================================
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

    // 削除ボタンイベント
    card.querySelector('.btn-delete-item').addEventListener('click', () => {
      currentDoc.items.splice(index, 1);
      renderItemInputCards();
      renderAll();
    });

    // 各入力変更イベント
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
  DOM.btnRegenDocNumber.addEventListener('click', () => {
    currentDoc.docNumber = generateDocNumber(currentDoc.docType);
    DOM.inputDocNumber.value = currentDoc.docNumber;
    renderAll();
    showToast('新しい書類番号を採番しました');
  });

  // 入力フォームの同期
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

  // 端数処理設定
  DOM.selectFractionRule.addEventListener('change', e => {
    currentDoc.taxFractionRule = e.target.value;
    renderAll();
  });

  // 明細追加ボタン
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

  // 定型文挿入ボタン
  DOM.btnInsertTemplateNote.addEventListener('click', () => {
    const defaultNotes = 'お振込手数料は貴社にてご負担くださいますようお願い申し上げます。\nご不明な点がございましたらお気軽にお問い合わせください。';
    DOM.inputNotes.value = defaultNotes;
    currentDoc.notes = defaultNotes;
    renderAll();
    showToast('備考欄に定型文を挿入しました');
  });

  // 印鑑の表示トグル
  DOM.checkShowStamp.addEventListener('change', e => {
    currentDoc.issuer.showStamp = e.target.checked;
    renderAll();
  });

  // 印鑑自動生成
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

  // 印鑑画像アップロード
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

  // テーマカラー変更
  DOM.colorDotBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.dataset.color;
      updateThemeColor(color);
      currentDoc.themeColor = color;
      renderAll();
    });
  });

  // 印刷・PDF保存
  DOM.btnPrint.addEventListener('click', () => {
    window.print();
  });

  // 履歴に保存
  DOM.btnSaveHistory.addEventListener('click', () => {
    const success = saveDocToHistory(currentDoc);
    if (success) {
      showToast('作成履歴に保存しました！', 'success');
    }
  });

  // 新規作成
  DOM.btnNewDoc.addEventListener('click', () => {
    if (confirm('新しく白紙の書類を作成しますか？（現在の内容は履歴からいつでも呼び出せます）')) {
      const profile = currentDoc.issuer; // 自社情報は引き継ぐ
      currentDoc = createEmptyInvoice('invoice');
      if (profile) {
        currentDoc.issuer = profile;
      }
      populateFormFromDoc();
      renderAll();
      showToast('新しい書類を作成しました');
    }
  });

  // サンプル読込
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

  // 履歴モーダル制御
  DOM.btnOpenHistory.addEventListener('click', openHistoryModal);
  DOM.btnCloseHistoryModal.addEventListener('click', closeHistoryModal);
  DOM.btnCloseHistoryModal2.addEventListener('click', closeHistoryModal);
  DOM.historyModal.addEventListener('click', (e) => {
    if (e.target === DOM.historyModal) closeHistoryModal();
  });

  // バックアップモーダル制御
  DOM.btnOpenBackup.addEventListener('click', openBackupModal);
  DOM.btnCloseBackupModal.addEventListener('click', closeBackupModal);
  DOM.btnCloseBackupModal2.addEventListener('click', closeBackupModal);
  DOM.backupModal.addEventListener('click', (e) => {
    if (e.target === DOM.backupModal) closeBackupModal();
  });

  // JSONエクスポート
  DOM.btnExportJSON.addEventListener('click', () => {
    exportDataAsJSON();
    showToast('バックアップJSONをダウンロードしました', 'success');
  });

  // JSONインポート
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
window.addEventListener('DOMContentLoaded', initApp);
