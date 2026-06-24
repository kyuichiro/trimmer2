/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  CheckCircle, 
  Info, 
  Terminal, 
  Bell, 
  ChevronUp, 
  ChevronDown, 
  Sparkles,
  Scissors
} from 'lucide-react';
import { Reservation, TrimmerShift, SystemLog, ReservationStatus } from './types';
import { INITIAL_RESERVATIONS, INITIAL_SHIFTS, MOCK_TRIMMERS } from './data';
import RoleSwitcher from './components/RoleSwitcher';
import OwnerBookingFlow from './components/OwnerBookingFlow';
import TrimmerTerminal from './components/TrimmerTerminal';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  // Role State
  const [currentRole, setCurrentRole] = useState<'owner' | 'trimmer' | 'admin'>(() => {
    const saved = localStorage.getItem('kdog_role');
    return (saved as any) || 'owner';
  });

  // Database States
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem('kdog_reservations');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_RESERVATIONS;
  });

  const [shifts, setShifts] = useState<TrimmerShift[]>(() => {
    const saved = localStorage.getItem('kdog_shifts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_SHIFTS;
  });

  const [logs, setLogs] = useState<SystemLog[]>(() => {
    const saved = localStorage.getItem('kdog_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { 
        id: 'log-init-1', 
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), 
        type: 'info', 
        message: 'K・DogSpa予約システム デモ環境が起動しました。' 
      },
      { 
        id: 'log-init-2', 
        timestamp: new Date(Date.now() - 3600000).toISOString(), 
        type: 'success', 
        message: '初期データロード完了：マスタートリマー3名、規定シフトがインポートされました。' 
      }
    ];
  });

  // Feed/Ticker Collapsible state
  const [isFeedExpanded, setIsFeedExpanded] = useState<boolean>(true);
  const [showToast, setShowToast] = useState<{ message: string; type: 'info' | 'warning' | 'error' | 'success' } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('kdog_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('kdog_reservations', JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem('kdog_shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem('kdog_logs', JSON.stringify(logs));
  }, [logs]);

  // Helper: Trigger visual toast
  const triggerToast = (message: string, type: 'info' | 'warning' | 'error' | 'success') => {
    setShowToast({ message, type });
    setTimeout(() => {
      setShowToast(null);
    }, 4500);
  };

  // Log handler
  const handleAddLog = (message: string, type: 'info' | 'warning' | 'error' | 'success', details?: string) => {
    const newLog: SystemLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      details
    };
    setLogs(prev => [newLog, ...prev]);
    triggerToast(message, type);
  };

  // Add Reservation
  const handleAddReservation = (newRes: Reservation) => {
    setReservations(prev => [newRes, ...prev]);
    
    // Log booking creation
    const courseLabel = newRes.courseType === 'trimmer' ? 'トリマーお任せコース' : 'セルフシャンプーコース';
    const safetyNote = newRes.courseType === 'trimmer' 
      ? ` | 【同席必須同意】緊急連絡先: ${newRes.emergencyContact}` 
      : '';
    
    handleAddLog(
      `新規予約成立: ${newRes.ownerName}様（ワンちゃん: ${newRes.dogName}・${newRes.dogBreed}）`,
      'success',
      `日時: ${newRes.date} ${newRes.timeSlot} | コース: ${courseLabel}${safetyNote}`
    );
  };

  // Update shift assignment
  const handleUpdateShiftAssignment = (shiftId: string, assigned: boolean) => {
    setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, isAssigned: assigned } : s));
  };

  // Create Shift
  const handleAddShift = (newShift: TrimmerShift) => {
    setShifts(prev => [...prev, newShift]);
    const trimmerName = MOCK_TRIMMERS.find(t => t.id === newShift.trimmerId)?.name || newShift.trimmerId;
    handleAddLog(
      `シフト追加: トリマー「${trimmerName}」の勤務枠を登録しました。`,
      'info',
      `日付: ${newShift.workDate} | 時間: ${newShift.startTime} 〜 ${newShift.endTime}`
    );
  };

  // Delete Shift
  const handleDeleteShift = (shiftId: string) => {
    const shiftToDelete = shifts.find(s => s.id === shiftId);
    if (!shiftToDelete) return;

    if (shiftToDelete.isAssigned) {
      alert('予約が割り当てられているシフトは削除できません。');
      return;
    }

    setShifts(prev => prev.filter(s => s.id !== shiftId));
    const trimmerName = MOCK_TRIMMERS.find(t => t.id === shiftToDelete.trimmerId)?.name || shiftToDelete.trimmerId;
    handleAddLog(
      `シフト削除: トリマー「${trimmerName}」の勤務枠を削除しました。`,
      'warning',
      `対象枠: ${shiftToDelete.workDate} ${shiftToDelete.startTime}`
    );
  };

  // Update Reservation status (e.g. from Trimmer Terminal)
  const handleUpdateReservationStatus = (resId: string, status: ReservationStatus, confirmedAt?: string) => {
    setReservations(prev => prev.map(res => {
      if (res.id === resId) {
        const updated: Reservation = { ...res, status };
        if (confirmedAt) {
          updated.attendanceConfirmedAt = confirmedAt;
        }
        return updated;
      }
      return res;
    }));

    // If reservation is aborted (anomaly flow), free up the trimmer shift for that slot so they can take another appointment!
    if (status === 'aborted') {
      const targetRes = reservations.find(r => r.id === resId);
      if (targetRes && targetRes.trimmerId) {
        const matchingShift = shifts.find(
          s => s.trimmerId === targetRes.trimmerId && 
               s.workDate === targetRes.date && 
               s.startTime === targetRes.timeSlot
        );
        if (matchingShift) {
          handleUpdateShiftAssignment(matchingShift.id, false);
          handleAddLog(
            `シフト復旧: 強制中断された予約のトリマー枠（${targetRes.date} ${targetRes.timeSlot}）を再開放しました。`,
            'info',
            `トリマー: ${MOCK_TRIMMERS.find(t => t.id === targetRes.trimmerId)?.name}`
          );
        }
      }
    }
  };

  // Reset simulation to initial template states
  const handleResetData = () => {
    if (window.confirm('すべての予約履歴、シフト登録、ログを初期状態に戻しますか？')) {
      localStorage.removeItem('kdog_reservations');
      localStorage.removeItem('kdog_shifts');
      localStorage.removeItem('kdog_logs');
      setReservations(INITIAL_RESERVATIONS);
      setShifts(INITIAL_SHIFTS);
      setLogs([
        { 
          id: `log-reset-${Date.now()}`, 
          timestamp: new Date().toISOString(), 
          type: 'success', 
          message: 'シミュレーションデータが工場出荷状態にリセットされました。' 
        }
      ]);
      triggerToast('データを初期化しました', 'success');
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="font-sans min-h-screen bg-stone-50 flex flex-col justify-between">
      
      {/* Top Role Selector */}
      <RoleSwitcher
        currentRole={currentRole}
        onChangeRole={setCurrentRole}
        reservations={reservations}
        onResetData={handleResetData}
      />

      {/* Main Container */}
      <main className="flex-grow pb-24">
        <AnimatePresence mode="wait">
          {currentRole === 'owner' && (
            <motion.div
              key="owner-flow"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <OwnerBookingFlow
                shifts={shifts}
                reservations={reservations}
                onAddReservation={handleAddReservation}
                onUpdateShiftAssignment={handleUpdateShiftAssignment}
              />
            </motion.div>
          )}

          {currentRole === 'trimmer' && (
            <motion.div
              key="trimmer-terminal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <TrimmerTerminal
                reservations={reservations}
                onUpdateReservationStatus={handleUpdateReservationStatus}
                onAddLog={handleAddLog}
                shifts={shifts}
                onAddReservation={handleAddReservation}
              />
            </motion.div>
          )}

          {currentRole === 'admin' && (
            <motion.div
              key="admin-dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <AdminDashboard
                shifts={shifts}
                reservations={reservations}
                logs={logs}
                onAddShift={handleAddShift}
                onDeleteShift={handleDeleteShift}
                onClearLogs={handleClearLogs}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating System-Wide Realtime Event Feed (The Ticker) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-stone-900 border-t border-stone-800 shadow-2xl text-stone-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Ticker Header */}
          <div 
            onClick={() => setIsFeedExpanded(!isFeedExpanded)}
            className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-stone-800/60 select-none transition"
          >
            <div className="flex items-center space-x-2 text-xs font-bold text-stone-200">
              <Terminal className="w-4 h-4 text-amber-500" />
              <span>リアルタイム警告 ＆ 動作通知フィード</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-[10px] text-stone-400 font-mono hidden sm:inline">クリックしてログを拡大/縮小</span>
              {isFeedExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </div>
          </div>

          {/* Ticker Expandable Content */}
          <AnimatePresence>
            {isFeedExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 110, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-y-auto pb-3 font-mono text-[10px] space-y-1.5 border-t border-stone-800/80 pt-2.5"
              >
                {logs.length === 0 ? (
                  <p className="text-stone-500 text-center py-4">アクティビティログはありません</p>
                ) : (
                  logs.slice(0, 10).map(log => (
                    <div key={log.id} className="flex items-start space-x-2 px-2 hover:bg-stone-800/30 py-0.5 rounded transition">
                      <span className="text-stone-500 shrink-0">
                        [{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                      </span>
                      
                      <span className={`font-bold shrink-0 ${
                        log.type === 'error' ? 'text-red-500' :
                        log.type === 'warning' ? 'text-amber-500' :
                        log.type === 'success' ? 'text-emerald-500' : 'text-blue-400'
                      }`}>
                        [{log.type.toUpperCase()}]
                      </span>

                      <div className="flex-1 min-w-0">
                        <span className="text-stone-200 font-medium block truncate sm:inline sm:mr-2">{log.message}</span>
                        {log.details && (
                          <span className="text-stone-400 text-[9px] block sm:inline italic">({log.details})</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Toast Notification HUD */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-36 right-6 z-50 max-w-sm w-full bg-stone-900 border border-stone-800 text-white rounded-xl shadow-2xl p-4 overflow-hidden"
          >
            <div className="flex items-start space-x-3">
              <div className={`p-1.5 rounded-lg shrink-0 ${
                showToast.type === 'error' ? 'bg-red-500/10 text-red-500' :
                showToast.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                showToast.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
              }`}>
                {showToast.type === 'error' && <ShieldAlert className="w-5 h-5 text-red-500" />}
                {showToast.type === 'warning' && <ShieldAlert className="w-5 h-5 text-amber-500" />}
                {showToast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                {showToast.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-bold text-stone-200">
                  {showToast.type === 'error' ? '⚠️ セキュリティ警告' :
                   showToast.type === 'success' ? '✓ 処理成功' : '💡 システム通知'}
                </span>
                <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">{showToast.message}</p>
              </div>
            </div>
            
            {/* Visual timer line */}
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 4.5, ease: 'linear' }}
              className={`absolute bottom-0 left-0 h-1 ${
                showToast.type === 'error' ? 'bg-red-500' :
                showToast.type === 'warning' ? 'bg-amber-500' :
                showToast.type === 'success' ? 'bg-emerald-500' : 'bg-amber-600'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
