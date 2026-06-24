/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Scissors, 
  User, 
  Smartphone, 
  UserCheck, 
  ShieldAlert, 
  Clock, 
  Phone,
  Mail,
  PlusCircle
} from 'lucide-react';
import { Reservation, Trimmer, ReservationStatus, TrimmerShift } from '../types';
import { MOCK_TRIMMERS } from '../data';

interface TrimmerTerminalProps {
  reservations: Reservation[];
  onUpdateReservationStatus: (resId: string, status: ReservationStatus, confirmedAt?: string) => void;
  onAddLog: (message: string, type: 'info' | 'warning' | 'error' | 'success', details?: string) => void;
  shifts: TrimmerShift[];
  onAddReservation: (res: Reservation) => void;
}

export default function TrimmerTerminal({
  reservations,
  onUpdateReservationStatus,
  onAddLog,
  shifts,
  onAddReservation
}: TrimmerTerminalProps) {
  const [selectedTrimmerId, setSelectedTrimmerId] = useState<string>('t1');
  const [confirmModalData, setConfirmModalData] = useState<{ resId: string; type: 'start' | 'abort' } | null>(null);

  const currentTrimmer = MOCK_TRIMMERS.find(t => t.id === selectedTrimmerId)!;
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter reservations for this trimmer on today
  const trimmerReservations = reservations.filter(
    res => res.trimmerId === selectedTrimmerId && res.date === todayStr
  ).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  // Handle Action click
  const handleStartProcessClick = (resId: string) => {
    setConfirmModalData({ resId, type: 'start' });
  };

  const handleAbortProcessClick = (resId: string) => {
    setConfirmModalData({ resId, type: 'abort' });
  };

  const handleCompleteProcess = (resId: string) => {
    onUpdateReservationStatus(resId, 'completed');
    const res = reservations.find(r => r.id === resId);
    onAddLog(
      `施術完了: ${res?.ownerName}様のワンちゃん「${res?.dogName}」のトリミング施術を正常完了しました。`,
      'success',
      `トリマー: ${currentTrimmer.name} | ステータス: 完了`
    );
  };

  // Modal Confirm handlers
  const handleModalConfirm = () => {
    if (!confirmModalData) return;

    const { resId, type } = confirmModalData;
    const res = reservations.find(r => r.id === resId);

    if (type === 'start') {
      const nowStr = new Date().toISOString();
      onUpdateReservationStatus(resId, 'in_progress', nowStr);
      onAddLog(
        `施術開始: ${res?.ownerName}様 同席の目視確認を完了し、施術を開始しました。`,
        'info',
        `トリマー: ${currentTrimmer.name} | 目視確認完了時間: ${new Date(nowStr).toLocaleString()}`
      );
    } else if (type === 'abort') {
      onUpdateReservationStatus(resId, 'aborted');
      // Abort logs & sends simulated headquarter alert email
      onAddLog(
        `🚨緊急異常検知: ${res?.ownerName}様の施術を【飼い主様の無断離脱】のため強制中断しました。`,
        'error',
        `緊急連絡先 ${res?.emergencyContact} へ確認連絡、および本部(管理者)宛に自動警告メールを即時発信しました。`
      );
    }

    setConfirmModalData(null);
  };

  // Quick simulation helper: Add a mock reserved booking for the active trimmer
  const handleAddMockBooking = () => {
    // Find a free slot for today that has this trimmer shift or let's just make one at 14:00
    const randomNames = ['加藤 英介', '中村 舞', '小林 健太', '木村 美優'];
    const randomDogs = ['コタロウ', 'モカ', 'マロン', 'ルイ'];
    const randomBreeds = ['トイ・プードル', '柴犬', 'ポメラニアン', 'チワワ'];
    
    const index = Math.floor(Math.random() * 4);
    const mockRes: Reservation = {
      id: `res-mock-${Date.now()}`,
      courseType: 'trimmer',
      trimmerId: selectedTrimmerId,
      attendanceAgreedAt: new Date().toISOString(),
      emergencyContact: '090-8765-4321',
      ownerName: randomNames[index],
      dogName: randomDogs[index],
      dogBreed: randomBreeds[index],
      dogSize: 'small',
      date: todayStr,
      timeSlot: '14:00',
      status: 'reserved',
      createdAt: new Date().toISOString(),
      price: 6500
    };

    onAddReservation(mockRes);
    onAddLog(
      `デモ用データ作成: トリマー「${currentTrimmer.name}」宛のテスト予約を追加しました。`,
      'info',
      `飼い主: ${mockRes.ownerName} | ペット: ${mockRes.dogName}`
    );
  };

  // Render Status Badge
  const renderStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'reserved':
        return <span className="bg-blue-100 text-blue-800 text-[11px] px-2.5 py-1 rounded-full font-bold">予約済</span>;
      case 'in_progress':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2.5 py-1 rounded-full font-bold flex items-center space-x-1 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>施術中</span>
          </span>
        );
      case 'completed':
        return <span className="bg-stone-100 text-stone-600 text-[11px] px-2.5 py-1 rounded-full font-medium">完了</span>;
      case 'aborted':
        return <span className="bg-red-100 text-red-800 text-[11px] px-2.5 py-1 rounded-full font-extrabold flex items-center space-x-1"><ShieldAlert className="w-3 h-3 text-red-600" /> <span>強制中断</span></span>;
    }
  };

  return (
    <div className="bg-stone-100 min-h-[calc(100vh-70px)] py-8 px-4 flex justify-center">
      
      {/* Tablet Shell Layout */}
      <div className="w-full max-w-md bg-stone-50 rounded-[32px] border-[10px] border-stone-800 shadow-2xl overflow-hidden flex flex-col relative" style={{ height: '760px' }}>
        
        {/* Device Status Bar */}
        <div className="bg-stone-900 text-stone-400 px-6 py-2 flex justify-between items-center text-[11px] border-b border-stone-800">
          <span className="font-mono flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-stone-500" />
            <span>K-DogSpa Staff Mobile</span>
          </span>
          <span className="font-mono">12:30 PM (本日)</span>
        </div>

        {/* Trimmer Identity Header Selector */}
        <div className="bg-white p-4 border-b border-stone-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={currentTrimmer.avatar} 
              alt={currentTrimmer.name} 
              className="w-11 h-11 rounded-full object-cover border-2 border-amber-500 shadow-sm" 
            />
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-bold text-stone-900 text-sm">{currentTrimmer.name}</span>
                <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded-full font-semibold">トリマー</span>
              </div>
              <p className="text-[10px] text-stone-500">シフト: {todayStr} (本日出勤)</p>
            </div>
          </div>

          <select
            value={selectedTrimmerId}
            onChange={(e) => setSelectedTrimmerId(e.target.value)}
            className="text-xs bg-stone-100 text-stone-800 border border-stone-300 rounded-lg px-2 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {MOCK_TRIMMERS.map(t => (
              <option key={t.id} value={t.id}>{t.name} (端末ログイン)</option>
            ))}
          </select>
        </div>

        {/* Scrollable Schedule Panel */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>本日の担当スケジュール ({trimmerReservations.length}件)</span>
            </h3>
            
            <button
              onClick={handleAddMockBooking}
              className="flex items-center space-x-1 text-xs text-amber-700 font-bold hover:text-amber-800 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>テスト予約追加</span>
            </button>
          </div>

          {trimmerReservations.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-stone-200 flex flex-col items-center justify-center h-64">
              <Scissors className="w-10 h-10 text-stone-300 mb-2" />
              <p className="text-sm font-bold text-stone-700">本日担当の予約はありません</p>
              <p className="text-xs text-stone-400 mt-1 max-w-xs leading-relaxed">
                新規予約が入るか、右上の「テスト予約追加」ボタンを押すと、当日施術フローをデモできます。
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {trimmerReservations.map(res => (
                <div 
                  key={res.id} 
                  className={`bg-white rounded-2xl p-4 border transition-shadow duration-200 shadow-sm flex flex-col justify-between ${
                    res.status === 'in_progress' 
                      ? 'border-emerald-500 ring-2 ring-emerald-50' 
                      : res.status === 'aborted'
                        ? 'border-red-200 bg-red-50/20'
                        : 'border-stone-200'
                  }`}
                >
                  {/* Row 1: Time & Status */}
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="font-mono text-sm font-extrabold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-600" />
                      <span>{res.timeSlot}</span>
                    </span>
                    {renderStatusBadge(res.status)}
                  </div>

                  {/* Row 2: Customer details */}
                  <div className="space-y-1.5 mb-4">
                    <div className="text-sm font-bold text-stone-900">
                      🐶 {res.dogName} ちゃん <span className="text-xs font-normal text-stone-500">({res.dogBreed})</span>
                    </div>
                    <div className="text-xs text-stone-600 flex items-center space-x-4">
                      <span>飼い主様: <strong>{res.ownerName} 様</strong></span>
                      <span className="bg-stone-100 text-stone-600 text-[10px] px-1.5 py-0.5 rounded">
                        サイズ: {res.dogSize === 'small' ? '小型' : res.dogSize === 'medium' ? '中型' : '大型'}
                      </span>
                    </div>

                    {/* Consented details & Contact */}
                    {res.courseType === 'trimmer' && (
                      <div className="bg-stone-50 rounded-lg p-2.5 border border-stone-100 space-y-1 mt-2 text-[11px] text-stone-600">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-stone-500">同席同意日時:</span>
                          <span className="font-mono text-emerald-600 font-bold">
                            ✓ {res.attendanceAgreedAt ? new Date(res.attendanceAgreedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '同意済'}
                          </span>
                        </div>
                        {res.attendanceConfirmedAt && (
                          <div className="flex justify-between text-[10px]">
                            <span className="text-stone-500">同席確認完了:</span>
                            <span className="font-mono text-stone-700">
                              {new Date(res.attendanceConfirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                        <div className="border-t border-dashed border-stone-200 pt-1 mt-1 space-y-0.5">
                          <div className="flex items-center gap-1 text-[10px] text-amber-800 font-bold">
                            <Phone className="w-3 h-3 text-stone-400" />
                            <span>当日緊急連絡先: {res.emergencyContact}</span>
                          </div>
                          {res.emergencyEmail && (
                            <div className="flex items-center gap-1 text-[9px] text-stone-500 font-normal">
                              <Mail className="w-2.5 h-2.5 text-stone-400" />
                              <span className="truncate" title={res.emergencyEmail}>{res.emergencyEmail}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons depending on status */}
                  <div className="border-t border-stone-100 pt-3">
                    {res.status === 'reserved' && (
                      <button
                        onClick={() => handleStartProcessClick(res.id)}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1 transition shadow-sm cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>飼い主の同席を確認し、施術を開始する</span>
                      </button>
                    )}

                    {res.status === 'in_progress' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleAbortProcessClick(res.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1 transition cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>飼い主離脱(中断)</span>
                        </button>
                        <button
                          onClick={() => handleCompleteProcess(res.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1 transition shadow-sm cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>施術完了</span>
                        </button>
                      </div>
                    )}

                    {res.status === 'completed' && (
                      <div className="text-center text-[11px] text-emerald-600 font-medium py-1">
                        ✓ 施術は無事に完了しました。お疲れ様でした！
                      </div>
                    )}

                    {res.status === 'aborted' && (
                      <div className="bg-red-50 text-red-700 p-2 rounded-lg text-[10px] leading-relaxed border border-red-100">
                        <strong>強制中断済み</strong>
                        <p className="mt-0.5">飼い主が離脱したため施術を停止しました。本部管理画面にアラートログが記録されています。</p>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interactive Double-Check / Alert Dialog (Simulates the rule: OKでステータス変更) */}
        <AnimatePresence>
          {confirmModalData && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/60 z-50 flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl border border-stone-200"
              >
                {confirmModalData.type === 'start' ? (
                  <>
                    <div className="w-11 h-11 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mb-3">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-stone-900 mb-1.5">最終目視確認</h4>
                    <p className="text-xs text-stone-600 leading-relaxed mb-4">
                      「<strong>飼い主様が目の前に同席していること</strong>」を目視確認しましたか？
                    </p>
                    <p className="text-[10px] text-red-600 bg-red-50 p-2 rounded border border-red-100 leading-relaxed mb-4">
                      ⚠️ 安全確保のため、飼い主様の不在時に施術を開始することはできません。
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-11 h-11 bg-red-100 text-red-700 rounded-full flex items-center justify-center mb-3">
                      <AlertTriangle className="w-6 h-6 animate-bounce" />
                    </div>
                    <h4 className="text-sm font-bold text-red-900 mb-1.5">飼い主離脱による施術中断</h4>
                    <p className="text-xs text-stone-600 leading-relaxed mb-4">
                      飼い主様がブース内におらず、連絡も取れないため<strong>施術を強制中断</strong>しますか？
                    </p>
                    <div className="text-[10px] text-stone-500 space-y-1 bg-stone-100 p-2 rounded leading-relaxed mb-4">
                      <div className="flex items-center gap-1 font-bold text-stone-700"><Mail className="w-3 h-3" /> 本部送信アラート自動メール</div>
                      <p>宛先: 運営管理者様</p>
                      <p>件名: 【緊急アラート】施術中の飼い主離脱検知</p>
                    </div>
                  </>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => setConfirmModalData(null)}
                    className="flex-1 border border-stone-200 text-stone-600 py-2 rounded-xl text-xs font-semibold hover:bg-stone-50 transition"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleModalConfirm}
                    className={`flex-1 text-white py-2 rounded-xl text-xs font-bold transition shadow ${
                      confirmModalData.type === 'start' 
                        ? 'bg-amber-600 hover:bg-amber-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    はい、実行します
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
