/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  Scissors, 
  Users, 
  AlertOctagon, 
  Search, 
  CheckCircle, 
  UserPlus, 
  FileSpreadsheet, 
  Trash2,
  Plus,
  MailWarning
} from 'lucide-react';
import { Reservation, TrimmerShift, Trimmer, SystemLog } from '../types';
import { MOCK_TRIMMERS, TIME_SLOTS } from '../data';

interface AdminDashboardProps {
  shifts: TrimmerShift[];
  reservations: Reservation[];
  logs: SystemLog[];
  onAddShift: (newShift: TrimmerShift) => void;
  onDeleteShift: (shiftId: string) => void;
  onClearLogs: () => void;
}

export default function AdminDashboard({
  shifts,
  reservations,
  logs,
  onAddShift,
  onDeleteShift,
  onClearLogs
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'shifts' | 'reservations' | 'logs'>('reservations');
  
  // Shift creation form states
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [newShiftTrimmer, setNewShiftTrimmer] = useState<string>('t1');
  const [newShiftDate, setNewShiftDate] = useState<string>(todayStr);
  const [newShiftTime, setNewShiftTime] = useState<string>('12:00');

  // Search filter
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Handle shift submission
  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if shift already exists
    const duplicate = shifts.some(
      s => s.trimmerId === newShiftTrimmer && s.workDate === newShiftDate && s.startTime === newShiftTime
    );

    if (duplicate) {
      alert('このトリマーは既に同じ時間帯にシフトが登録されています。');
      return;
    }

    // End time is simply start time + 1hr
    const hour = parseInt(newShiftTime.split(':')[0]);
    const nextHour = hour + 1;
    const newShiftEndTime = `${nextHour.toString().padStart(2, '0')}:00`;

    const newShift: TrimmerShift = {
      id: `shift-${Date.now()}`,
      trimmerId: newShiftTrimmer,
      workDate: newShiftDate,
      startTime: newShiftTime,
      endTime: newShiftEndTime,
      isAssigned: false
    };

    onAddShift(newShift);
  };

  const getTrimmerName = (id?: string) => {
    if (!id) return '-';
    return MOCK_TRIMMERS.find(t => t.id === id)?.name || id;
  };

  // Filter reservations based on search
  const filteredReservations = reservations.filter(res => {
    const text = `${res.ownerName} ${res.dogName} ${res.dogBreed} ${getTrimmerName(res.trimmerId)}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="bg-stone-50 min-h-[calc(100vh-70px)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 border-b border-stone-200 pb-6 gap-4">
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center space-x-2">
              <Users className="w-6 h-6 text-amber-700" />
              <span>本部管理システム (K・DogSpa)</span>
            </h1>
            <p className="text-sm text-stone-500">トリマーの勤務シフト、および飼い主同席同意ログ・異常検知アラートを統括管理します。</p>
          </div>

          {/* Quick Stats Banner */}
          <div className="flex items-center space-x-4">
            <div className="bg-white px-4 py-2 rounded-xl border border-stone-200 shadow-sm text-center">
              <span className="text-[10px] text-stone-400 block font-bold uppercase tracking-wider">総予約件数</span>
              <strong className="text-lg text-stone-900 font-extrabold">{reservations.length}件</strong>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-stone-200 shadow-sm text-center">
              <span className="text-[10px] text-stone-400 block font-bold uppercase tracking-wider">登録シフト数</span>
              <strong className="text-lg text-amber-700 font-extrabold">{shifts.length}枠</strong>
            </div>
            <div className="bg-red-50 px-4 py-2 rounded-xl border border-red-200 shadow-sm text-center">
              <span className="text-[10px] text-red-500 block font-bold uppercase tracking-wider">同席離脱警告</span>
              <strong className="text-lg text-red-700 font-black">{reservations.filter(r => r.status === 'aborted').length}件</strong>
            </div>
          </div>
        </div>

        {/* Inner Navigation Tabs */}
        <div className="flex border-b border-stone-200 mb-6 gap-2">
          {[
            { id: 'reservations', label: '予約台帳 & 同席ログ追跡', icon: FileSpreadsheet },
            { id: 'shifts', label: 'トリマー出勤シフト管理', icon: Calendar },
            { id: 'logs', label: 'セキュリティ警告ログ', icon: AlertOctagon, badge: logs.filter(l => l.type === 'error').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition duration-150 ${
                activeTab === tab.id
                  ? 'border-amber-600 text-amber-800 bg-amber-50/20'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="ml-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab contents */}
        <div>
          {/* Tab 1: Reservations Ledger with exact details from spec */}
          {activeTab === 'reservations' && (
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
              
              {/* Header search filter */}
              <div className="p-4 border-b border-stone-100 bg-stone-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="飼い主名、ペット名、トリマー名で検索..."
                    className="w-full pl-9 pr-4 py-1.5 text-xs border border-stone-300 rounded-lg bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="text-[11px] text-stone-500">
                  ※ 施術中の「常時同席同意」および「当日目視確認」のエビデンス日時を記録・管理しています。
                </div>
              </div>

              {/* Grid ledger */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100 text-stone-600 font-bold border-b border-stone-200">
                      <th className="p-4">予約日時</th>
                      <th className="p-4">コース</th>
                      <th className="p-4">飼い主 / 犬種</th>
                      <th className="p-4">担当トリマー</th>
                      <th className="p-4 bg-amber-50/40 text-amber-900 border-x border-amber-100">① 同席同意日時</th>
                      <th className="p-4 bg-amber-50/40 text-amber-900 border-r border-amber-100">② 当日同席確認完了時間</th>
                      <th className="p-4">緊急連絡先</th>
                      <th className="p-4">ステータス</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredReservations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-stone-400 font-medium">
                          該当する予約レコードが見つかりません。
                        </td>
                      </tr>
                    ) : (
                      filteredReservations.map(res => (
                        <tr key={res.id} className="hover:bg-stone-50/50 transition">
                          <td className="p-4 whitespace-nowrap">
                            <div className="font-bold text-stone-900">{res.date}</div>
                            <div className="font-mono text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-stone-400" />
                              <span>{res.timeSlot}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md whitespace-nowrap ${
                              res.courseType === 'trimmer' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-stone-100 text-stone-600'
                            }`}>
                              {res.courseType === 'trimmer' ? 'トリマーお任せ' : 'セルフシャンプー'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-stone-950">{res.ownerName} 様</div>
                            <div className="text-[10px] text-stone-500 mt-0.5">🐶 {res.dogName} ({res.dogBreed})</div>
                          </td>
                          <td className="p-4 font-medium text-stone-800">
                            {res.courseType === 'trimmer' ? (
                              <div className="flex items-center space-x-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                <span>{getTrimmerName(res.trimmerId)}</span>
                              </div>
                            ) : (
                              <span className="text-stone-400">不要 (セルフ)</span>
                            )}
                          </td>
                          {/* Agreed datetime - core spec requirement */}
                          <td className="p-4 bg-amber-50/20 border-x border-amber-100/50">
                            {res.attendanceAgreedAt ? (
                              <div className="flex flex-col">
                                <span className="text-emerald-700 font-bold flex items-center gap-0.5 text-[10px]">
                                  <CheckCircle className="w-3 h-3" /> 同意済
                                </span>
                                <span className="font-mono text-[10px] text-stone-500 mt-0.5">
                                  {new Date(res.attendanceAgreedAt).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                              </div>
                            ) : (
                              <span className="text-stone-400">-</span>
                            )}
                          </td>
                          {/* Confirmed datetime - core spec requirement */}
                          <td className="p-4 bg-amber-50/20 border-r border-amber-100/50">
                            {res.attendanceConfirmedAt ? (
                              <div className="flex flex-col">
                                <span className="text-emerald-700 font-bold flex items-center gap-0.5 text-[10px]">
                                  <CheckCircle className="w-3 h-3" /> 確認完了
                                </span>
                                <span className="font-mono text-[10px] text-stone-600 mt-0.5 font-bold">
                                  {new Date(res.attendanceConfirmedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                              </div>
                            ) : res.status === 'aborted' ? (
                              <span className="text-red-600 font-bold text-[10px]">⚠️ 途中離脱により中断</span>
                            ) : res.courseType === 'trimmer' ? (
                              <span className="text-stone-400 text-[10px]">未確認 (施術前)</span>
                            ) : (
                              <span className="text-stone-400">-</span>
                            )}
                          </td>
                          <td className="p-4 text-stone-700">
                            <div className="font-mono font-semibold whitespace-nowrap">
                              {res.emergencyContact || <span className="text-stone-300">-</span>}
                            </div>
                            {res.emergencyEmail && (
                              <div className="text-[10px] text-stone-500 font-normal mt-0.5 max-w-[150px] truncate" title={res.emergencyEmail}>
                                {res.emergencyEmail}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                              res.status === 'reserved'
                                ? 'bg-blue-100 text-blue-800'
                                : res.status === 'in_progress'
                                  ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                                  : res.status === 'completed'
                                    ? 'bg-stone-100 text-stone-500'
                                    : 'bg-red-100 text-red-800'
                            }`}>
                              {res.status === 'reserved' && '予約済'}
                              {res.status === 'in_progress' && '施術中'}
                              {res.status === 'completed' && '完了'}
                              {res.status === 'aborted' && '強制中断'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Trimmer Shift Registration Manager */}
          {activeTab === 'shifts' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Register New Shift Form */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                <h3 className="font-bold text-stone-900 text-sm mb-4 flex items-center space-x-1.5">
                  <UserPlus className="w-4 h-4 text-amber-700" />
                  <span>シフト新規登録・割当</span>
                </h3>

                <form onSubmit={handleCreateShift} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">対象トリマー</label>
                    <select
                      value={newShiftTrimmer}
                      onChange={(e) => setNewShiftTrimmer(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      {MOCK_TRIMMERS.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">勤務日</label>
                    <select
                      value={newShiftDate}
                      onChange={(e) => setNewShiftDate(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value={todayStr}>本日 ({todayStr})</option>
                      <option value={tomorrowStr}>明日 ({tomorrowStr})</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">開始時間（1時間スロット）</label>
                    <select
                      value={newShiftTime}
                      onChange={(e) => setNewShiftTime(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      {TIME_SLOTS.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-stone-900 hover:bg-black text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1 transition shadow cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>シフトを追加登録する</span>
                  </button>
                </form>

                <div className="mt-4 p-3 bg-amber-50 text-amber-800 rounded-lg text-[10px] leading-relaxed border border-amber-100">
                  💡 <strong>即時反映デモ:</strong> ここに登録されたシフトは、<strong>「飼い主 予約画面」</strong> のトリマー予約可能枠カレンダーに即座に反映され、予約可能となります。
                </div>
              </div>

              {/* Right Columns: Shift schedule Board */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                  <span className="text-xs font-bold text-stone-700">登録済みシフトスケジュール</span>
                  <span className="text-[10px] text-stone-400">※ 予約割当済み枠は削除できません</span>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[todayStr, tomorrowStr].map(dateStr => {
                      const dateShifts = shifts.filter(s => s.workDate === dateStr);
                      return (
                        <div key={dateStr} className="border border-stone-150 rounded-xl p-3 bg-stone-50/50">
                          <span className="block text-xs font-bold text-stone-800 mb-2 border-b border-stone-200 pb-1 flex items-center justify-between">
                            <span>📅 {dateStr === todayStr ? '本日' : '明日'} ({dateStr})</span>
                            <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded-full font-medium">
                              {dateShifts.length}枠
                            </span>
                          </span>

                          {dateShifts.length === 0 ? (
                            <p className="text-[11px] text-stone-400 py-4 text-center">登録されているシフトはありません</p>
                          ) : (
                            <div className="space-y-1.5">
                              {dateShifts
                                .sort((a,b) => a.startTime.localeCompare(b.startTime) || a.trimmerId.localeCompare(b.trimmerId))
                                .map(shift => {
                                  const trimmer = MOCK_TRIMMERS.find(t => t.id === shift.trimmerId);
                                  return (
                                    <div key={shift.id} className="bg-white p-2 rounded-lg border border-stone-200 flex items-center justify-between text-[11px]">
                                      <div className="flex items-center space-x-2">
                                        <img src={trimmer?.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                                        <span className="font-semibold text-stone-800">{trimmer?.name}</span>
                                        <span className="font-mono text-stone-500">({shift.startTime} - {shift.endTime})</span>
                                      </div>
                                      <div className="flex items-center space-x-1.5">
                                        {shift.isAssigned ? (
                                          <span className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-extrabold whitespace-nowrap">
                                            予約割当済
                                          </span>
                                        ) : (
                                          <>
                                            <span className="bg-amber-50 text-amber-700 text-[9px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                                              空枠
                                            </span>
                                            <button
                                              onClick={() => onDeleteShift(shift.id)}
                                              className="text-stone-300 hover:text-red-500 p-0.5 rounded transition"
                                              title="シフトを削除"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Tab 3: Security & Notification Log console */}
          {activeTab === 'logs' && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                <div className="flex items-center space-x-1.5">
                  <AlertOctagon className="w-4 h-4 text-red-600 animate-pulse" />
                  <span className="text-xs font-bold text-stone-800">本部セキュリティ警告 ＆ 通知ログ</span>
                </div>
                <button
                  onClick={onClearLogs}
                  className="text-xs text-stone-500 hover:text-stone-800 transition"
                >
                  ログをクリア
                </button>
              </div>

              <div className="p-4 space-y-2 max-h-[480px] overflow-y-auto font-mono text-[11px]">
                {logs.length === 0 ? (
                  <p className="text-center text-stone-400 py-8">現在ログはありません</p>
                ) : (
                  logs.map(log => (
                    <div 
                      key={log.id} 
                      className={`p-3 rounded-lg border flex flex-col gap-1 transition ${
                        log.type === 'error' 
                          ? 'bg-red-50/50 border-red-200 text-red-900' 
                          : log.type === 'warning' 
                            ? 'bg-amber-50/50 border-amber-200 text-amber-900' 
                            : log.type === 'success'
                              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                              : 'bg-stone-50 border-stone-200 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-stone-500">
                        <span className="font-bold flex items-center gap-1">
                          {log.type === 'error' && <MailWarning className="w-3.5 h-3.5 text-red-600 animate-bounce" />}
                          <span>[{log.type.toUpperCase()}]</span>
                        </span>
                        <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                      <p className="font-semibold leading-relaxed">{log.message}</p>
                      {log.details && (
                        <div className="bg-white/80 p-1.5 rounded border border-stone-200/50 mt-1 text-[10px] text-stone-600 whitespace-pre-wrap">
                          {log.details}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
