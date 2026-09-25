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
  ATTENDANCE: 'quickdoc_attendance'
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

/**
 * 現在編集中の帳票を保存
 */
export function saveActiveDoc(doc) {
  try {
    localStorage.setItem(KEYS.ACTIVE_DOC, JSON.stringify(doc));
  } catch (e) {
    console.error('Failed to save active doc to localStorage:', e);
  }
}

/**
 * 現在編集中の帳票を取得
 */
export function loadActiveDoc() {
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
export function saveIssuerProfile(issuer) {
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
export function loadIssuerProfile() {
  try {
    const raw = localStorage.getItem(KEYS.ISSUER_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to load issuer profile:', e);
    return null;
  }
}

/**
 * 書類履歴一覧を取得
 */
export function getHistoryList() {
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
export function saveDocToHistory(doc) {
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
export function deleteDocFromHistory(id) {
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
export function getDocFromHistory(id) {
  const list = getHistoryList();
  const found = list.find(item => item.id === id);
  return found ? found.fullDoc : null;
}

/**
 * 書類履歴から商品マスタの使用回数マップを算出
 * @returns {Record<string, number>}
 */
export function getItemMasterUsageMap() {
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

export async function fetchServerMasterItems() {
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

export async function saveServerMasterItems(items) {
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

export async function fetchServerMasterClients() {
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

export async function saveServerMasterClients(clients) {
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

export async function fetchServerIssuerProfile() {
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

export async function saveServerIssuerProfile(issuer) {
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

/**
 * 商品マスタ一覧を取得（デフォルトで頻度の多い順にソート）
 * @param {boolean} sortByFrequency 使用頻度の多い順にソートするかどうか
 */
export function getItemMasterList(sortByFrequency = true) {
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
export function saveItemMasterList(list) {
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
export function recordItemMasterUsage(itemId, itemName) {
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
export function saveItemToMaster(item) {
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
export function deleteItemFromMaster(id) {
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
export function getClientMasterUsageMap() {
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
export function getClientMasterList(sortByFrequency = true) {
  try {
    const raw = localStorage.getItem(KEYS.CLIENT_MASTER);
    let list = [];
    if (!raw) {
      saveClientMasterList(DEFAULT_CLIENT_MASTER);
      list = [...DEFAULT_CLIENT_MASTER];
    } else {
      list = JSON.parse(raw);
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
export function saveClientMasterList(list) {
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
export function rescueMastersFromHistory() {
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
export async function syncMastersWithServer() {
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

      const mergedClients = Array.from(clientMap.values());
      localStorage.setItem(KEYS.CLIENT_MASTER, JSON.stringify(mergedClients));
      await saveServerMasterClients(mergedClients);
      console.log(`[マスタ同期完了] 取引先マスタ: 全 ${mergedClients.length} 件をサーバー・ローカルで完全同期しました`);
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
        name: 'スタジオ・ネクサス合同会社',
        invoiceNumber: 'T9012345678901',
        zip: '150-0043',
        address: '東京都渋谷区道玄坂1丁目20-8 渋谷インフォスタワー 7F',
        tel: '03-6800-9988',
        fax: '',
        email: 'billing@nexus-studio.example.com',
        stampDataUrl: '',
        showStamp: true
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

    return true;
  } catch (e) {
    console.warn('Sync masters with server failed (offline mode):', e);
    return false;
  }
}

/**
 * 伝票データから商品マスタ・取引先マスタへ自動蓄積（作成するほどマスタが自動成長）
 */
export function autoRegisterMastersFromDoc(doc) {
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
export async function initMastersPersistence() {
  // 1. 過去伝票からの救済マイグレーションを即時実行
  const rescueResult = rescueMastersFromHistory();
  // 2. サーバー（PCディスク）との双方向同期を安全に実行
  await syncMastersWithServer();
  return rescueResult;
}

/**
 * 取引先マスタに取引先を追加（または上書き）
 */
export function saveClientToMaster(client) {
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
export function deleteClientFromMaster(id) {
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
export function recordClientMasterUsage(clientId, clientName) {
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
export function findClientByName(name) {
  if (!name) return null;
  const list = getClientMasterList(false);
  const clean = name.trim().toLowerCase();
  return list.find(c => (c.name || '').trim().toLowerCase() === clean) ||
         list.find(c => (c.name || '').toLowerCase().includes(clean)) || null;
}


/**
 * 品名ごとのユーザー価格履歴マップを取得
 */
export function getUserPriceHistoryMap() {
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
export function recordUserPrice(itemName, price) {
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
export function getUserPriceHistoryForItem(itemName = '') {
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
export function getDiscountReasons() {
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
export function saveDiscountReasons(list) {
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
export function recordDiscountReason(name) {
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
export function updateDocPaymentStatus(docId, status = 'paid', paidDate = '', note = '') {
  try {
    const list = getHistoryList();
    const item = list.find(d => d.id === docId);
    if (item && item.fullDoc) {
      item.fullDoc.paymentStatus = status;
      item.fullDoc.paidDate = paidDate || (status === 'paid' ? new Date().toISOString().split('T')[0] : '');
      if (note) item.fullDoc.paymentNote = note;
      item.updatedAt = new Date().toISOString();
      localStorage.setItem(KEYS.HISTORY, JSON.stringify(list));
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to update payment status:', e);
    return false;
  }
}

// ==========================================================================
// 経費・仕入データ管理
// ==========================================================================

/**
 * 経費・仕入一覧を取得
 */
export function getExpenseList() {
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
export function saveExpense(expense) {
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
export function deleteExpense(id) {
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
export function getAttendanceList() {
  try {
    const raw = localStorage.getItem(KEYS.ATTENDANCE);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to get attendance list:', e);
    return [];
  }
}

/**
 * 勤怠データを保存
 */
export function saveAttendance(attendance) {
  try {
    const list = getAttendanceList();
    const id = attendance.id || ('att_' + attendance.date);
    const existingIndex = list.findIndex(a => a.id === id || a.date === attendance.date);
    const record = {
      id,
      date: attendance.date,
      clockIn: attendance.clockIn || '',
      clockOut: attendance.clockOut || '',
      note: attendance.note || '',
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...record };
    } else {
      list.unshift(record);
    }

    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(list));
    return record;
  } catch (e) {
    console.error('Failed to save attendance:', e);
    return null;
  }
}

/**
 * 本日の勤怠打刻を取得
 */
export function getTodayAttendance() {
  const today = new Date().toISOString().split('T')[0];
  const list = getAttendanceList();
  return list.find(a => a.date === today) || null;
}

/**
 * 本日の出勤打刻
 */
export function clockInToday(timeStr = '', note = '') {
  const today = new Date().toISOString().split('T')[0];
  const curTime = timeStr || new Date().toTimeString().substring(0, 5);
  const current = getTodayAttendance() || { date: today };
  current.clockIn = curTime;
  if (note) current.note = note;
  return saveAttendance(current);
}

/**
 * 本日の退勤打刻
 */
export function clockOutToday(timeStr = '', note = '') {
  const today = new Date().toISOString().split('T')[0];
  const curTime = timeStr || new Date().toTimeString().substring(0, 5);
  const current = getTodayAttendance() || { date: today };
  current.clockOut = curTime;
  if (note) current.note = note;
  return saveAttendance(current);
}

/**
 * 勤怠記録を削除
 */
export function deleteAttendance(id) {
  try {
    const list = getAttendanceList().filter(a => a.id !== id);
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error('Failed to delete attendance:', e);
    return false;
  }
}

// ==========================================================================
// バックアップ（エクスポート / インポート）
// ==========================================================================

/**
 * 全データをJSON形式でダウンロード（バックアップ）
 */
export function exportDataAsJSON() {
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
    attendance: getAttendanceList()
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
export function importDataFromJSON(jsonString) {
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
    return { success: true, activeDoc: data.activeDoc || null };
  } catch (e) {
    console.error('JSON Import error:', e);
    return { success: false, error: e.message };
  }
}
