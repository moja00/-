/**
 * attendance-state.js
 * 勤怠管理・タイムカード（休憩1時間自動控除）・月次集計・CSV出力エンジン
 */

/**
 * 本日の日付文字列 (YYYY-MM-DD)
 */
export function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 現在の時刻文字列 (HH:MM)
 */
export function getCurrentTimeString() {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 2つの時刻（HH:MM）の差分分数（minutes）を計算
 */
export function calculateMinutesDiff(startHHMM, endHHMM) {
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
export function formatMinutesToHours(minutes = 0) {
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
export function calculateWorkDuration(clockIn, clockOut) {
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
export function calculateMonthlyAttendance(attendanceList = [], targetMonth = '') {
  const currentYM = targetMonth || getTodayDateString().substring(0, 7);
  const filtered = attendanceList.filter(att => att && (att.date || '').startsWith(currentYM));

  let workDays = 0;
  let totalWorkMinutes = 0;
  let totalOvertimeMinutes = 0;

  filtered.forEach(att => {
    if (att.clockIn && att.clockOut) {
      workDays += 1;
      const res = calculateWorkDuration(att.clockIn, att.clockOut);
      totalWorkMinutes += res.workMinutes;
      totalOvertimeMinutes += res.overtimeMinutes;
    } else if (att.clockIn) {
      workDays += 1; // 出勤中
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
export function exportAttendanceToCSV(attendanceList = [], targetMonth = '') {
  const currentYM = targetMonth || getTodayDateString().substring(0, 7);
  const filtered = attendanceList
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
