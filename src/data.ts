/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Course, Trimmer, TrimmerShift, Reservation } from './types';

export const COURSES: Course[] = [
  {
    id: 'self',
    name: 'セルフシャンプーコース',
    durationMin: 45,
    price: 2000,
    description: 'プロ仕様の設備・シャンプーを自由に使って、飼い主様ご自身で愛犬を気持ちよく洗えるお得なコース。',
    features: [
      'プロ用ドッグバス・ドライヤー完備',
      '各種高品質オーガニックシャンプー使い放題',
      'エプロン・タオルの無料貸出あり',
      '同席不要（飼い主様が洗うため、常に一緒です）'
    ]
  },
  {
    id: 'trimmer',
    name: 'トリマーお任せコース (要同席)',
    durationMin: 60,
    price: 6500,
    description: 'プロのトリマーが爪切りから足裏カット、シャンプーまで優しく丁寧に施術します。※安心安全のため、飼い主様の常時同席が必要です。',
    features: [
      'プロトリマーによる丁寧なヒアリング＆施術',
      '爪切り・耳掃除・肛門腺絞り・足裏足回りカット込み',
      '低刺激シャンプー＆保湿トリートメント仕上げ',
      '【重要】施術中、飼い主様のブース内常時同席（必須）'
    ]
  }
];

export const MOCK_TRIMMERS: Trimmer[] = [
  {
    id: 't1',
    name: '佐藤 さくら',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120&h=120',
    skills: ['小型犬・中型犬得意', 'オールシザー仕上げ', 'ネコちゃん応相談']
  },
  {
    id: 't2',
    name: '田中 翔太',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120',
    skills: ['大型犬得意', 'スピードトリミング', '皮膚トラブルケア']
  },
  {
    id: 't3',
    name: '渡辺 美咲',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120&h=120',
    skills: ['デザインカット', 'パピー(子犬)対応', 'ハーブパック施術']
  }
];

// Generate default shifts for today and tomorrow
const todayStr = new Date().toISOString().split('T')[0];
const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

export const INITIAL_SHIFTS: TrimmerShift[] = [
  // Today's shifts
  { id: 's1', trimmerId: 't1', workDate: todayStr, startTime: '10:00', endTime: '11:00', isAssigned: true },
  { id: 's2', trimmerId: 't1', workDate: todayStr, startTime: '11:00', endTime: '12:00', isAssigned: false },
  { id: 's3', trimmerId: 't1', workDate: todayStr, startTime: '14:00', endTime: '15:00', isAssigned: false },
  { id: 's4', trimmerId: 't1', workDate: todayStr, startTime: '15:00', endTime: '16:00', isAssigned: false },

  { id: 's5', trimmerId: 't2', workDate: todayStr, startTime: '10:00', endTime: '11:00', isAssigned: true },
  { id: 's6', trimmerId: 't2', workDate: todayStr, startTime: '13:00', endTime: '14:00', isAssigned: true },
  { id: 's7', trimmerId: 't2', workDate: todayStr, startTime: '14:00', endTime: '15:00', isAssigned: false },
  { id: 's8', trimmerId: 't2', workDate: todayStr, startTime: '16:00', endTime: '17:00', isAssigned: false },

  { id: 's9', trimmerId: 't3', workDate: todayStr, startTime: '11:00', endTime: '12:00', isAssigned: false },
  { id: 's10', trimmerId: 't3', workDate: todayStr, startTime: '13:00', endTime: '14:00', isAssigned: false },
  { id: 's11', trimmerId: 't3', workDate: todayStr, startTime: '15:00', endTime: '16:00', isAssigned: true },
  { id: 's12', trimmerId: 't3', workDate: todayStr, startTime: '17:00', endTime: '18:00', isAssigned: false },

  // Tomorrow's shifts
  { id: 's13', trimmerId: 't1', workDate: tomorrowStr, startTime: '10:00', endTime: '11:00', isAssigned: false },
  { id: 's14', trimmerId: 't1', workDate: tomorrowStr, startTime: '11:00', endTime: '12:00', isAssigned: false },
  { id: 's15', trimmerId: 't1', workDate: tomorrowStr, startTime: '13:00', endTime: '14:00', isAssigned: false },
  
  { id: 's16', trimmerId: 't2', workDate: tomorrowStr, startTime: '11:00', endTime: '12:00', isAssigned: false },
  { id: 's17', trimmerId: 't2', workDate: tomorrowStr, startTime: '14:00', endTime: '15:00', isAssigned: false },
  { id: 's18', trimmerId: 't2', workDate: tomorrowStr, startTime: '15:00', endTime: '16:00', isAssigned: false },

  { id: 's19', trimmerId: 't3', workDate: tomorrowStr, startTime: '10:00', endTime: '11:00', isAssigned: false },
  { id: 's20', trimmerId: 't3', workDate: tomorrowStr, startTime: '13:00', endTime: '14:00', isAssigned: false },
  { id: 's21', trimmerId: 't3', workDate: tomorrowStr, startTime: '16:00', endTime: '17:00', isAssigned: false },
];

export const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 'res-101',
    courseType: 'trimmer',
    trimmerId: 't1',
    attendanceAgreedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    attendanceConfirmedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    emergencyContact: '090-1234-5678',
    ownerName: '山田 太郎',
    dogName: 'チョコ',
    dogBreed: 'トイ・プードル',
    dogSize: 'small',
    date: todayStr,
    timeSlot: '10:00',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    price: 6500
  },
  {
    id: 'res-102',
    courseType: 'trimmer',
    trimmerId: 't2',
    attendanceAgreedAt: new Date(Date.now() - 3600000 * 1.8).toISOString(),
    attendanceConfirmedAt: new Date(Date.now() - 3600000 * 1.2).toISOString(),
    emergencyContact: '080-9876-5432',
    ownerName: '鈴木 花子',
    dogName: 'レオン',
    dogBreed: 'ミニチュア・ダックス',
    dogSize: 'small',
    date: todayStr,
    timeSlot: '10:00',
    status: 'in_progress', // In progress right now
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    price: 6500
  },
  {
    id: 'res-103',
    courseType: 'trimmer',
    trimmerId: 't2',
    attendanceAgreedAt: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    emergencyContact: '070-5555-4444',
    ownerName: '高橋 健二',
    dogName: 'ハチ',
    dogBreed: '秋田犬',
    dogSize: 'large',
    date: todayStr,
    timeSlot: '13:00',
    status: 'reserved', // Scheduled for later
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    price: 6500
  },
  {
    id: 'res-104',
    courseType: 'trimmer',
    trimmerId: 't3',
    attendanceAgreedAt: new Date(Date.now() - 3600000 * 0.2).toISOString(),
    emergencyContact: '090-8888-9999',
    ownerName: '佐藤 洋子',
    dogName: 'ココ',
    dogBreed: 'ポメラニアン',
    dogSize: 'small',
    date: todayStr,
    timeSlot: '15:00',
    status: 'reserved',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    price: 6500
  },
  {
    id: 'res-105',
    courseType: 'self',
    emergencyContact: '090-7777-6666',
    ownerName: '渡辺 一郎',
    dogName: 'マメ',
    dogBreed: '柴犬',
    dogSize: 'medium',
    date: todayStr,
    timeSlot: '11:00',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    price: 2000
  }
];

export const DOG_BREEDS = [
  { name: 'トイ・プードル', size: 'small' },
  { name: 'チワワ', size: 'small' },
  { name: 'ミニチュア・ダックスフンド', size: 'small' },
  { name: 'ポメラニアン', size: 'small' },
  { name: 'ヨークシャー・テリア', size: 'small' },
  { name: '柴犬', size: 'medium' },
  { name: 'フレンチ・ブルドッグ', size: 'medium' },
  { name: 'ビーグル', size: 'medium' },
  { name: 'コーギー', size: 'medium' },
  { name: 'ゴールデン・レトリバー', size: 'large' },
  { name: 'ラブラドール・レトリバー', size: 'large' },
  { name: 'ハスキー', size: 'large' },
  { name: '秋田犬', size: 'large' },
];

export const TIME_SLOTS = [
  '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];
