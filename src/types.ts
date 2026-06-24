/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CourseType = 'self' | 'trimmer';

export interface Course {
  id: CourseType;
  name: string;
  durationMin: number;
  price: number;
  description: string;
  features: string[];
}

export interface Trimmer {
  id: string;
  name: string;
  status: 'active' | 'inactive'; // 1: 有効, 0: 無効
  avatar: string;
  skills: string[];
}

export interface TrimmerShift {
  id: string;
  trimmerId: string;
  workDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  isAssigned: boolean;
}

export type ReservationStatus = 
  | 'reserved'        // 予約済
  | 'in_progress'     // 施術中
  | 'completed'       // 完了
  | 'aborted';        // 強制中断 (飼い主離脱)

export interface Reservation {
  id: string;
  courseType: CourseType;
  trimmerId?: string; // Nullable for self course
  attendanceAgreedAt?: string; // Nullable, datetime string
  attendanceConfirmedAt?: string; // Nullable, datetime string
  emergencyContact?: string; // Nullable
  emergencyEmail?: string; // Nullable
  
  // Basic info
  ownerName: string;
  dogName: string;
  dogBreed: string;
  dogSize: 'small' | 'medium' | 'large';
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:MM
  status: ReservationStatus;
  createdAt: string;
  price: number;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: string;
}
