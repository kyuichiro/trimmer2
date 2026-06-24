/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { User, Scissors, ShieldAlert, RefreshCw, Layers } from 'lucide-react';
import { Reservation } from '../types';

interface RoleSwitcherProps {
  currentRole: 'owner' | 'trimmer' | 'admin';
  onChangeRole: (role: 'owner' | 'trimmer' | 'admin') => void;
  reservations: Reservation[];
  onResetData: () => void;
}

export default function RoleSwitcher({
  currentRole,
  onChangeRole,
  reservations,
  onResetData
}: RoleSwitcherProps) {
  const activeBookingsCount = reservations.filter(r => r.status === 'in_progress').length;
  const alertCount = reservations.filter(r => r.status === 'aborted').length;

  return (
    <div className="bg-stone-900 text-stone-100 shadow-md border-b border-stone-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand logo & Description */}
        <div className="flex items-center space-x-3">
          <div className="bg-amber-100 p-2 rounded-xl text-stone-900 shadow-sm flex items-center justify-center">
            <Scissors className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-sans font-extrabold tracking-tight text-lg text-white">K・DogSpa</span>
              <span className="bg-amber-600/20 text-amber-400 text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 font-medium">予約システム(仮)</span>
            </div>
            <p className="text-xs text-stone-400">トリマーお任せコース・飼い主同席同意 開発用シミュレーター</p>
          </div>
        </div>

        {/* Role Select Buttons */}
        <div className="flex flex-wrap items-center bg-stone-800 p-1 rounded-xl border border-stone-700 gap-1">
          <button
            onClick={() => onChangeRole('owner')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              currentRole === 'owner'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-300 hover:bg-stone-700/50 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>飼い主 予約画面</span>
          </button>
          
          <button
            onClick={() => onChangeRole('trimmer')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 relative ${
              currentRole === 'trimmer'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-300 hover:bg-stone-700/50 hover:text-white'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>トリマー用 現場端末</span>
            {activeBookingsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[9px] text-white items-center justify-center font-bold">
                  {activeBookingsCount}
                </span>
              </span>
            )}
          </button>

          <button
            onClick={() => onChangeRole('admin')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 relative ${
              currentRole === 'admin'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-300 hover:bg-stone-700/50 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>管理者 本部画面</span>
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] text-white items-center justify-center font-bold">
                  {alertCount}
                </span>
              </span>
            )}
          </button>
        </div>

        {/* Global Simulation Actions */}
        <div className="flex items-center space-x-3 justify-end">
          <div className="hidden sm:flex flex-col text-right text-[10px] text-stone-400">
            <span>施術中: <strong className="text-emerald-400">{activeBookingsCount}件</strong></span>
            {alertCount > 0 && (
              <span className="flex items-center space-x-1 justify-end text-red-400 font-bold">
                <ShieldAlert className="w-3 h-3" />
                <span>強制中断: {alertCount}件</span>
              </span>
            )}
          </div>
          <button
            onClick={onResetData}
            title="シミュレーションデータをリセット"
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-stone-800 text-stone-300 hover:bg-stone-700 text-xs rounded-lg border border-stone-700 transition duration-150 font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">データ初期化</span>
          </button>
        </div>
      </div>
    </div>
  );
}
