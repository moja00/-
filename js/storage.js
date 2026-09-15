/**
 * storage.js
 * LocalStorage管理、自社プロファイル永続化、書類履歴、JSON入出力
 */

const KEYS = {
  ACTIVE_DOC: 'quickdoc_active_doc',
  HISTORY: 'quickdoc_history_list',
  ISSUER_PROFILE: 'quickdoc_issuer_profile',
  CLIENT_HISTORY: 'quickdoc_client_history'
};

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
    // ついでに自社情報もプロファイルに保存
    if (doc.issuer) {
      saveIssuerProfile(doc.issuer);
    }
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
 * 全データをJSON形式でダウンロード（バックアップ）
 */
export function exportDataAsJSON() {
  const backupData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    activeDoc: loadActiveDoc(),
    issuerProfile: loadIssuerProfile(),
    history: getHistoryList()
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `BillCraft_Backup_${dateStr}.json`;
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
    return { success: true, activeDoc: data.activeDoc || null };
  } catch (e) {
    console.error('JSON Import error:', e);
    return { success: false, error: e.message };
  }
}
