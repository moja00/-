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
  importDataFromJSON,
  getItemMasterList,
  saveItemMasterList,
  saveItemToMaster,
  deleteItemFromMaster,
  getItemMasterUsageMap,
  recordItemMasterUsage,
  getClientMasterList,
  saveClientMasterList,
  saveClientToMaster,
  deleteClientFromMaster,
  getClientMasterUsageMap,
  recordClientMasterUsage,
  findClientByName,
  getUserPriceHistoryForItem,
  recordUserPrice,
  getExpenseList,
  saveExpense,
  deleteExpense,
  getAttendanceList,
  saveAttendance,
  getTodayAttendance,
  clockInToday,
  clockOutToday,
  deleteAttendance,
  updateDocPaymentStatus,
  initMastersPersistence,
  initInventoryFromServer,
  getInventoryList,
  saveInventoryItem,
  deleteInventoryItem,
  adjustStock,
  syncInventoryWithItemsMaster,
  getPurchaseMappings,
  savePurchaseMapping,
  findInventoryMatchForPurchase,
  saveNewProductAndInventory,
  cancelDocIssue
} from './storage.js';

import {
  ACCOUNT_CATEGORIES,
  calculateProfitAndLoss,
  generateJournalEntries,
  exportJournalsToCSV,
  normalizeInvoiceDoc
} from './accounting-state.js';

import {
  getTodayDateString,
  getCurrentTimeString,
  calculateWorkDuration,
  formatMinutesToHours,
  calculateMonthlyAttendance,
  exportAttendanceToCSV
} from './attendance-state.js';

import {
  compressReceiptImage,
  analyzeReceiptImage,
  parseReceiptText,
  buildLearnedPayeeIndex
} from './receipt-parser.js';

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
