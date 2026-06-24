/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  ShieldAlert, 
  Scissors, 
  UserCheck, 
  Check, 
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { Course, Trimmer, TrimmerShift, Reservation, CourseType } from '../types';
import { COURSES, MOCK_TRIMMERS, DOG_BREEDS, TIME_SLOTS } from '../data';

interface OwnerBookingFlowProps {
  shifts: TrimmerShift[];
  reservations: Reservation[];
  onAddReservation: (newRes: Reservation) => void;
  onUpdateShiftAssignment: (shiftId: string, assigned: boolean) => void;
}

export default function OwnerBookingFlow({
  shifts,
  reservations,
  onAddReservation,
  onUpdateShiftAssignment
}: OwnerBookingFlowProps) {
  // Step: 1 = Course & Pet, 2 = DateTime & Trimmer, 3 = Consent, 4 = Payment/Lock, 5 = Finished
  const [step, setStep] = useState<number>(1);
  const [selectedCourse, setSelectedCourse] = useState<CourseType>('trimmer');
  
  // Pet info
  const [dogName, setDogName] = useState<string>('モコ');
  const [dogBreed, setDogBreed] = useState<string>('トイ・プードル');
  const [ownerName, setOwnerName] = useState<string>('鈴木 拓也');

  // Date/Time/Trimmer
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedTrimmerId, setSelectedTrimmerId] = useState<string>('any'); // 'any' or specific trimmerId
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');

  // Consent checkboxes & Emergency number & Email
  const [agreed1, setAgreed1] = useState<boolean>(false);
  const [agreed2, setAgreed2] = useState<boolean>(false);
  const [emergencyPhone, setEmergencyPhone] = useState<string>('');
  const [emergencyEmail, setEmergencyEmail] = useState<string>('');

  // Lock timer variables
  const [lockTimeRemaining, setLockTimeRemaining] = useState<number>(900); // 15 mins in seconds
  const [isLockExpired, setIsLockExpired] = useState<boolean>(false);

  // Suggested contact info mimicking logged-in user
  const mockMemberPhone = '090-4819-2038';
  const mockMemberEmail = 'test@testmail.com';

  // Tick lock timer down once we reach Step 4 (Payment)
  useEffect(() => {
    let timer: any;
    if (step === 4 && lockTimeRemaining > 0) {
      timer = setInterval(() => {
        setLockTimeRemaining(prev => {
          if (prev <= 1) {
            setIsLockExpired(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Reset timer if we go back
      setLockTimeRemaining(900);
      setIsLockExpired(false);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step]);

  // Format countdown
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Check how many slots are occupied (max 2 booths per slot)
  const getBoothReservationsCount = (date: string, slot: string) => {
    return reservations.filter(r => r.date === date && r.timeSlot === slot && r.status !== 'aborted').length;
  };

  // Determine which time slots are available based on course selection (AND logic for trimmer shifts)
  const isSlotAvailable = (slot: string) => {
    const boothCount = getBoothReservationsCount(selectedDate, slot);
    if (boothCount >= 2) return false; // Booth is fully booked (limit 2 for simulation)

    if (selectedCourse === 'self') {
      return true; // Self course only needs booth
    }

    // Trimmer course: Requires both booth AND an unassigned trimmer shift (AND logic)
    if (selectedTrimmerId === 'any') {
      // Any trimmer: is there at least one available shift for this date/time?
      return shifts.some(
        shift => 
          shift.workDate === selectedDate && 
          shift.startTime === slot && 
          !shift.isAssigned
      );
    } else {
      // Specific trimmer: does this trimmer have an unassigned shift for this date/time?
      return shifts.some(
        shift => 
          shift.workDate === selectedDate && 
          shift.startTime === slot && 
          shift.trimmerId === selectedTrimmerId && 
          !shift.isAssigned
      );
    }
  };

  // Find matching shift for chosen slot and trimmer
  const findMatchingShift = (date: string, slot: string, trimmerId: string): TrimmerShift | undefined => {
    if (trimmerId === 'any') {
      return shifts.find(
        shift => 
          shift.workDate === date && 
          shift.startTime === slot && 
          !shift.isAssigned
      );
    } else {
      return shifts.find(
        shift => 
          shift.workDate === date && 
          shift.startTime === slot && 
          shift.trimmerId === trimmerId && 
          !shift.isAssigned
      );
    }
  };

  // Form validations
  const isStep1Valid = dogName.trim() !== '' && ownerName.trim() !== '';
  const isStep2Valid = selectedTimeSlot !== '';
  const isStep3Valid = selectedCourse === 'self' || (
    agreed1 && 
    agreed2 && 
    emergencyPhone.trim().length >= 10 && 
    emergencyEmail.trim() !== '' && 
    emergencyEmail.includes('@')
  );

  // Handler: Move to Step 3 (Consent for Trimmer, or skip directly to Step 4 for Self)
  const handleGoToConsent = () => {
    if (selectedCourse === 'self') {
      // Self shampoo doesn't require constant presence consent
      setStep(4);
    } else {
      setStep(3);
    }
  };

  // Handler: Complete Booking
  const handleCompleteBooking = () => {
    if (isLockExpired) {
      alert('予約の仮押さえ期限が切れました。最初からやり直してください。');
      setStep(1);
      return;
    }

    let assignedTrimmerId: string | undefined = undefined;
    let matchingShift: TrimmerShift | undefined = undefined;

    if (selectedCourse === 'trimmer') {
      matchingShift = findMatchingShift(selectedDate, selectedTimeSlot, selectedTrimmerId);
      if (!matchingShift) {
        alert('指定の枠でトリマーが確保できませんでした。');
        return;
      }
      assignedTrimmerId = matchingShift.trimmerId;
    }

    const price = selectedCourse === 'trimmer' ? 6500 : 2000;
    
    const newRes: Reservation = {
      id: `res-${Date.now()}`,
      courseType: selectedCourse,
      trimmerId: assignedTrimmerId,
      attendanceAgreedAt: selectedCourse === 'trimmer' ? new Date().toISOString() : undefined,
      emergencyContact: selectedCourse === 'trimmer' ? emergencyPhone : undefined,
      emergencyEmail: selectedCourse === 'trimmer' ? emergencyEmail : undefined,
      ownerName,
      dogName,
      dogBreed,
      dogSize: (DOG_BREEDS.find(b => b.name === dogBreed)?.size as 'small' | 'medium' | 'large') || 'small',
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      status: 'reserved',
      createdAt: new Date().toISOString(),
      price
    };

    // Update shift as assigned if trimmer course
    if (matchingShift) {
      onUpdateShiftAssignment(matchingShift.id, true);
    }

    onAddReservation(newRes);
    setStep(5);
  };

  // Helper to suggest phone and email
  const handleSuggestContact = () => {
    setEmergencyPhone(mockMemberPhone);
    setEmergencyEmail(mockMemberEmail);
  };

  const selectedTrimmerObj = MOCK_TRIMMERS.find(t => t.id === selectedTrimmerId);
  const activeCourse = COURSES.find(c => c.id === selectedCourse)!;

  return (
    <div className="bg-stone-50 py-8 min-h-[calc(100vh-70px)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center max-w-lg mx-auto relative">
            {[
              { label: 'コース・犬種', s: 1 },
              { label: '日時・指名', s: 2 },
              { label: selectedCourse === 'trimmer' ? '同席同意' : '省略', s: 3, disabled: selectedCourse === 'self' },
              { label: '確認・決済', s: 4 },
              { label: '完了', s: 5 }
            ].map((node, idx) => (
              <React.Fragment key={node.s}>
                {idx > 0 && (
                  <div className={`h-1 flex-1 mx-2 rounded-full ${step > node.s - 1 ? 'bg-amber-600' : 'bg-stone-200'}`} />
                )}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all duration-300 ${
                    step === node.s 
                      ? 'bg-amber-600 border-amber-600 text-white ring-4 ring-amber-100' 
                      : step > node.s 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : node.disabled 
                          ? 'bg-stone-100 border-stone-200 text-stone-300 line-through' 
                          : 'bg-white border-stone-300 text-stone-500'
                  }`}>
                    {step > node.s ? <Check className="w-4 h-4" /> : node.s}
                  </div>
                  <span className={`text-[10px] mt-1 font-medium whitespace-nowrap ${
                    step === node.s ? 'text-amber-700 font-bold' : node.disabled ? 'text-stone-300' : 'text-stone-500'
                  }`}>
                    {node.label}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Wizard Main Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          
          <AnimatePresence mode="wait">
            
            {/* Step 1: Course & Pet Selection */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 md:p-8"
              >
                <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center space-x-2 border-b border-stone-100 pb-4">
                  <span className="bg-amber-100 text-amber-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                  <span>ご希望のコースとペット情報を入力してください</span>
                </h2>

                {/* Course Selection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {COURSES.map(course => (
                    <div
                      key={course.id}
                      onClick={() => setSelectedCourse(course.id)}
                      className={`cursor-pointer rounded-xl border-2 p-5 transition-all duration-200 relative flex flex-col justify-between ${
                        selectedCourse === course.id
                          ? 'border-amber-600 bg-amber-50/40 shadow-sm'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      {selectedCourse === course.id && (
                        <div className="absolute top-4 right-4 bg-amber-600 text-white p-1 rounded-full">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                            course.id === 'trimmer' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-stone-100 text-stone-700'
                          }`}>
                            {course.id === 'trimmer' ? 'プロトリマー施術' : 'セルフシャンプー'}
                          </span>
                          {course.id === 'trimmer' && (
                            <span className="bg-red-50 text-red-700 text-[9px] px-1.5 py-0.5 rounded border border-red-200 font-bold flex items-center space-x-0.5">
                              <ShieldAlert className="w-2.5 h-2.5" />
                              <span>飼い主常時同席必須</span>
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-stone-900">{course.name}</h3>
                        <p className="text-xs text-stone-500 mt-2 mb-4 leading-relaxed">{course.description}</p>
                        
                        <div className="space-y-1.5 mb-4 border-t border-dashed border-stone-200 pt-3">
                          {course.features.map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-start space-x-1.5 text-xs text-stone-600">
                              <span className="text-amber-600 mt-0.5">✓</span>
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-2 border-t border-stone-100 flex justify-between items-baseline">
                        <span className="text-xs text-stone-400">目安時間: {course.durationMin}分</span>
                        <span className="text-lg font-extrabold text-amber-800">¥{course.price.toLocaleString()}<span className="text-xs font-normal text-stone-500"> (税込)</span></span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pet details Form */}
                <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                  <h3 className="font-bold text-stone-800 text-sm mb-4">飼い主様＆ワンちゃん情報</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">飼い主様 氏名 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="山田 太郎"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">ワンちゃんのお名前 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={dogName}
                        onChange={(e) => setDogName(e.target.value)}
                        placeholder="チョコ"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">犬種 <span className="text-red-500">*</span></label>
                      <select
                        value={dogBreed}
                        onChange={(e) => setDogBreed(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-stone-900"
                      >
                        {DOG_BREEDS.map(breed => (
                          <option key={breed.name} value={breed.name}>
                            {breed.name} ({breed.size === 'small' ? '小型' : breed.size === 'medium' ? '中型' : '大型'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-8 flex justify-end">
                  <button
                    disabled={!isStep1Valid}
                    onClick={() => setStep(2)}
                    className={`flex items-center space-x-1.5 px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition duration-150 ${
                      isStep1Valid 
                        ? 'bg-amber-600 text-white hover:bg-amber-700 cursor-pointer' 
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    <span>予約枠の選択へ進む</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: DateTime & Trimmer Shift Selection (AND Condition logic) */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 md:p-8"
              >
                <h2 className="text-xl font-bold text-stone-900 mb-2 flex items-center space-x-2 border-b border-stone-100 pb-4">
                  <span className="bg-amber-100 text-amber-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                  <span>ご希望の日時をお選びください</span>
                </h2>

                {/* Info block explaining logic */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mb-6 text-xs text-stone-600 flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-800 block mb-1">
                      {selectedCourse === 'trimmer' ? '【トリマーお任せコースの予約可能枠表示ロジック】' : '【セルフシャンプーコースの予約可能枠表示ロジック】'}
                    </span>
                    {selectedCourse === 'trimmer' ? (
                      <p className="leading-relaxed">
                        「ブースの空き(同時2組上限)」と「トリマーの勤務シフト（出勤中かつ未予約）」の<strong className="text-amber-800 font-bold bg-amber-50 px-1 rounded border border-amber-200">AND条件</strong>が揃った時間帯のみが表示されています。担当トリマーを指定するか、指名なし(空いているトリマーを自動アサイン)を選択できます。
                      </p>
                    ) : (
                      <p className="leading-relaxed">
                        飼い主様ご自身で施術するためトリマーのシフトは不要です。単純に「ブースの空き状況(同時2組上限)」のみをもとに予約枠を表示しています。
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Date & Trimmer select */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-stone-500" />
                        <span>日付を選択</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => { setSelectedDate(todayStr); setSelectedTimeSlot(''); }}
                          className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition ${
                            selectedDate === todayStr
                              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                              : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          本日 ({todayStr.slice(5)})
                        </button>
                        <button
                          type="button"
                          onClick={() => { setSelectedDate(tomorrowStr); setSelectedTimeSlot(''); }}
                          className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition ${
                            selectedDate === tomorrowStr
                              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                              : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          明日 ({tomorrowStr.slice(5)})
                        </button>
                      </div>
                    </div>

                    {selectedCourse === 'trimmer' && (
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center space-x-1">
                          <Scissors className="w-3.5 h-3.5 text-stone-500" />
                          <span>担当トリマーを選択</span>
                        </label>
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => { setSelectedTrimmerId('any'); setSelectedTimeSlot(''); }}
                            className={`w-full py-2 px-3 text-left text-xs font-medium rounded-lg border flex items-center justify-between transition ${
                              selectedTrimmerId === 'any'
                                ? 'bg-amber-50 text-amber-800 border-amber-600 font-bold'
                                : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            <span>指名なし (トリマー自動割当)</span>
                            <span className="text-[10px] text-amber-600 font-normal">予約が取りやすい</span>
                          </button>
                          
                          {MOCK_TRIMMERS.map(trimmer => {
                            // Check if they have shifts for the selected date
                            const hasShiftOnDate = shifts.some(s => s.trimmerId === trimmer.id && s.workDate === selectedDate);
                            return (
                              <button
                                key={trimmer.id}
                                type="button"
                                onClick={() => { setSelectedTrimmerId(trimmer.id); setSelectedTimeSlot(''); }}
                                className={`w-full p-2 text-left text-xs font-medium rounded-lg border flex items-center space-x-3 transition ${
                                  selectedTrimmerId === trimmer.id
                                    ? 'bg-amber-50 text-amber-800 border-amber-600 font-bold'
                                    : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                                }`}
                              >
                                <img src={trimmer.avatar} alt={trimmer.name} className="w-8 h-8 rounded-full object-cover border border-stone-200" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="block truncate">{trimmer.name}</span>
                                    {!hasShiftOnDate && <span className="text-[9px] text-stone-400 font-normal">本日休み</span>}
                                  </div>
                                  <span className="text-[9px] text-stone-500 font-normal truncate block">{trimmer.skills[0]}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Columns (spanning 2): Available Time Slots Grid */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      空き時間枠を選択してください
                    </label>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {TIME_SLOTS.map(slot => {
                        const available = isSlotAvailable(slot);
                        const isSelected = selectedTimeSlot === slot;
                        
                        // Count reservations for visual guide
                        const bookingsCount = getBoothReservationsCount(selectedDate, slot);

                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={!available}
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`py-3 px-2 rounded-xl text-xs font-medium border text-center flex flex-col items-center justify-center transition-all relative ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-100'
                                : available
                                  ? 'bg-white text-stone-800 border-stone-200 hover:border-amber-400 hover:bg-amber-50/20 cursor-pointer'
                                  : 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed'
                            }`}
                          >
                            <span className="font-mono text-sm font-bold">{slot}</span>
                            <span className={`text-[9px] mt-1 ${
                              isSelected 
                                ? 'text-amber-100' 
                                : available 
                                  ? 'text-emerald-600' 
                                  : 'text-stone-400'
                            }`}>
                              {available ? (bookingsCount === 1 ? '残り1枠' : '空きあり') : '満室 / 休'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedCourse === 'trimmer' && selectedTimeSlot && (
                      <div className="mt-4 p-3 bg-amber-50/30 rounded-lg border border-amber-100 text-xs text-stone-700">
                        <span className="font-bold text-amber-800">割当詳細:</span>{' '}
                        {selectedTrimmerId === 'any' ? (
                          <span>
                            「{selectedDate} {selectedTimeSlot}」で、シフトが空いているトリマー（
                            <strong>
                              {findMatchingShift(selectedDate, selectedTimeSlot, 'any')
                                ? MOCK_TRIMMERS.find(t => t.id === findMatchingShift(selectedDate, selectedTimeSlot, 'any')?.trimmerId)?.name
                                : '未定'}
                            </strong>
                            ）が自動アサインされます。
                          </span>
                        ) : (
                          <span>
                            「{selectedDate} {selectedTimeSlot}」で、指名トリマー <strong>{selectedTrimmerObj?.name}</strong> が施術を担当します。
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-8 flex justify-between border-t border-stone-100 pt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center space-x-1 px-4 py-2 border border-stone-200 rounded-lg text-sm font-semibold text-stone-600 hover:bg-stone-50 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>戻る</span>
                  </button>

                  <button
                    disabled={!isStep2Valid}
                    onClick={handleGoToConsent}
                    className={`flex items-center space-x-1.5 px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition duration-150 ${
                      isStep2Valid 
                        ? 'bg-amber-600 text-white hover:bg-amber-700 cursor-pointer' 
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    <span>{selectedCourse === 'trimmer' ? '同意手続きへ進む' : '確認画面へ進む'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Consent pop-up / screen (ONLY for Trimmer course) */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-6 md:p-8"
              >
                <div className="max-w-2xl mx-auto">
                  
                  {/* Warning Header */}
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-5 mb-6">
                    <div className="flex space-x-3">
                      <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-sm text-red-900">
                          本コースは、施術中の【飼い主様の常時同席】が必須条件となります
                        </h3>
                        <p className="text-xs text-red-700 mt-1.5 leading-relaxed">
                          ワンちゃんの安全確保および施術中のトラブル防止のため、トリミングブース内でお待ちいただく必要がございます。施術中、無断でブースを離脱された場合、安全のため直ちに施術を中断いたします。その際、返金は行われませんので予めご了承ください。
                        </p>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-stone-900 font-bold text-sm mb-4">同席確認に関する同意</h3>
                  
                  <div className="space-y-4 bg-stone-50 p-6 rounded-xl border border-stone-200 mb-6">
                    {/* Checkbox 1 */}
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreed1}
                        onChange={(e) => setAgreed1(e.target.checked)}
                        className="mt-1 h-4 w-4 text-amber-600 border-stone-300 rounded focus:ring-amber-500 bg-white"
                      />
                      <span className="text-xs font-medium text-stone-700 select-none leading-relaxed">
                        私は、施術中にブース内から離脱しないことに同意します。<span className="text-red-500 font-bold">(必須)</span>
                      </span>
                    </label>

                    {/* Checkbox 2 */}
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreed2}
                        onChange={(e) => setAgreed2(e.target.checked)}
                        className="mt-1 h-4 w-4 text-amber-600 border-stone-300 rounded focus:ring-amber-500 bg-white"
                      />
                      <span className="text-xs font-medium text-stone-700 select-none leading-relaxed">
                        万が一、無断で離脱された場合、安全のため施術を中断し、返金も行われないことに同意します。<span className="text-red-500 font-bold">(必須)</span>
                      </span>
                    </label>

                    {/* Emergency Telephone */}
                    <div className="border-t border-stone-200 pt-4 mt-2">
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        当日、施術中に連絡が取れる緊急連絡先（携帯電話番号） <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          required
                          value={emergencyPhone}
                          onChange={(e) => setEmergencyPhone(e.target.value)}
                          placeholder="090-0000-0000"
                          className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSuggestContact}
                          className="bg-stone-200 text-stone-700 hover:bg-stone-300 px-3 py-2 text-xs font-medium rounded-lg transition shrink-0"
                        >
                          会員情報からコピー
                        </button>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1">※会員登録時の連絡先: {mockMemberPhone}</p>
                    </div>

                    {/* Emergency Email */}
                    <div className="border-t border-stone-200 pt-4">
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        当日、施術中に連絡が取れるメールアドレス <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          required
                          value={emergencyEmail}
                          onChange={(e) => setEmergencyEmail(e.target.value)}
                          placeholder="test@testmail.com"
                          className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSuggestContact}
                          className="bg-stone-200 text-stone-700 hover:bg-stone-300 px-3 py-2 text-xs font-medium rounded-lg transition shrink-0"
                        >
                          会員情報からコピー
                        </button>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1">※会員登録時のメールアドレス: {mockMemberEmail}</p>
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="flex justify-between border-t border-stone-100 pt-6">
                    <button
                      onClick={() => setStep(2)}
                      className="flex items-center space-x-1 px-4 py-2 border border-stone-200 rounded-lg text-sm font-semibold text-stone-600 hover:bg-stone-50 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>戻る</span>
                    </button>

                    <button
                      disabled={!isStep3Valid}
                      onClick={() => setStep(4)}
                      className={`flex items-center space-x-1.5 px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition duration-150 ${
                        isStep3Valid 
                          ? 'bg-amber-600 text-white hover:bg-amber-700 cursor-pointer' 
                          : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      <span>決済画面へ進む</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </motion.div>
            )}

            {/* Step 4: Payment Simulation & 15-Minute Temporary Lock */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 md:p-8"
              >
                <div className="max-w-xl mx-auto">
                  <h2 className="text-xl font-bold text-stone-900 mb-2 text-center">
                    ご予約内容の最終確認と決済
                  </h2>
                  <p className="text-xs text-stone-500 text-center mb-6">
                    内容をご確認の上、テスト決済を行ってください。
                  </p>

                  {/* 15-Minute Lock Visual Alert (Interactive feature) */}
                  <div className={`border p-4 rounded-xl mb-6 transition-colors duration-300 ${
                    isLockExpired 
                      ? 'bg-red-50 border-red-300 text-red-800' 
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    <div className="flex space-x-3 items-start">
                      <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${isLockExpired ? 'text-red-600' : 'text-amber-600'}`} />
                      <div>
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-xs">枠仮押さえ（コンカレンシー制御）:</span>
                          <span className="font-mono text-sm font-extrabold text-amber-800 bg-white border border-amber-200 px-2 py-0.5 rounded-md shadow-sm">
                            {formatTime(lockTimeRemaining)}
                          </span>
                        </div>
                        <p className="text-[11px] mt-1 text-stone-600">
                          {isLockExpired ? (
                            <span className="text-red-600 font-bold">【期限切れ】仮押さえ時間を過ぎました。再度予約枠を選び直してください。</span>
                          ) : (
                            <span>他のユーザーとの重複を防ぐため、このご予約枠を<strong>15分間仮ロック</strong>しています。上記制限時間内にお支払いを完了させてください。</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary Details */}
                  <div className="bg-stone-50 p-5 rounded-xl border border-stone-200 mb-6 space-y-3 text-sm text-stone-700">
                    <div className="flex justify-between pb-2 border-b border-stone-200">
                      <span className="font-bold text-stone-800">コース:</span>
                      <span className="font-bold text-stone-900">{activeCourse.name}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-stone-200">
                      <span className="font-bold text-stone-800">飼い主名 / ペット名:</span>
                      <span>{ownerName} 様 / {dogName} ちゃん ({dogBreed})</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-stone-200">
                      <span className="font-bold text-stone-800">日時:</span>
                      <span className="font-semibold text-stone-900">{selectedDate} {selectedTimeSlot}</span>
                    </div>
                    {selectedCourse === 'trimmer' && (
                      <>
                        <div className="flex justify-between pb-2 border-b border-stone-200">
                          <span className="font-bold text-stone-800">担当トリマー:</span>
                          <span>
                            {selectedTrimmerId === 'any' 
                              ? `指名なし（${findMatchingShift(selectedDate, selectedTimeSlot, 'any')
                                ? MOCK_TRIMMERS.find(t => t.id === findMatchingShift(selectedDate, selectedTimeSlot, 'any')?.trimmerId)?.name
                                : '未定'} がアサインされます）`
                              : selectedTrimmerObj?.name
                            }
                          </span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-stone-200 text-xs">
                          <span className="font-bold text-red-700 flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>常時同席同意状況:</span>
                          </span>
                          <span className="text-emerald-600 font-bold">✓ 同意済み</span>
                        </div>
                        <div className="flex justify-between text-xs pb-1 border-b border-stone-100">
                          <span className="font-bold text-stone-800">当日緊急連絡先:</span>
                          <span className="font-mono">{emergencyPhone}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-stone-800">連絡用メールアドレス:</span>
                          <span className="font-mono">{emergencyEmail}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between pt-2 border-t border-stone-300 font-bold text-stone-900">
                      <span>お支払金額 (合計):</span>
                      <span className="text-lg text-amber-800 font-extrabold">¥{activeCourse.price.toLocaleString()} (税込)</span>
                    </div>
                  </div>

                  {/* Payment Card Form Simulation */}
                  <div className="bg-white p-4 rounded-xl border border-stone-200 mb-6">
                    <span className="block text-xs font-bold text-stone-700 mb-2">クレジットカード決済 (テスト用デモ)</span>
                    <div className="space-y-3">
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                        <input
                          type="text"
                          disabled={isLockExpired}
                          defaultValue="4111 1111 1111 1111"
                          placeholder="カード番号"
                          className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm bg-stone-50 text-stone-500 font-mono focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          disabled={isLockExpired}
                          defaultValue="12 / 29"
                          placeholder="有効期限"
                          className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-stone-50 text-stone-500 font-mono text-center focus:outline-none"
                        />
                        <input
                          type="password"
                          disabled={isLockExpired}
                          defaultValue="***"
                          placeholder="CVC"
                          className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-stone-50 text-stone-500 font-mono text-center focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="flex justify-between border-t border-stone-100 pt-6">
                    <button
                      onClick={() => {
                        if (selectedCourse === 'self') {
                          setStep(2);
                        } else {
                          setStep(3);
                        }
                      }}
                      className="flex items-center space-x-1 px-4 py-2 border border-stone-200 rounded-lg text-sm font-semibold text-stone-600 hover:bg-stone-50 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>戻る</span>
                    </button>

                    <button
                      disabled={isLockExpired}
                      onClick={handleCompleteBooking}
                      className={`flex-1 ml-4 flex items-center justify-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white shadow-md transition-all ${
                        isLockExpired 
                          ? 'bg-stone-300 text-stone-400 cursor-not-allowed' 
                          : 'bg-amber-600 hover:bg-amber-700 cursor-pointer'
                      }`}
                    >
                      <span>決済して予約を確定する</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Complete Animation */}
            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center"
              >
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-stone-900 mb-2">
                    ご予約が完了しました！
                  </h2>
                  <p className="text-sm text-stone-600 mb-6 leading-relaxed">
                    K・DogSpaへのお申込みありがとうございます。
                    {selectedCourse === 'trimmer' && (
                      <span className="block font-semibold text-amber-800 mt-2">
                        ※当日は、ご予約時間の10分前に「飼い主様＆ワンちゃん」同時にご入店ください。施術中は常時同席が必要となります。
                      </span>
                    )}
                  </p>

                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs text-left mb-6 space-y-2 text-stone-600">
                    <div><strong className="text-stone-800">予約番号:</strong> KD-{Math.floor(Math.random() * 90000) + 10000}</div>
                    <div><strong className="text-stone-800">コース:</strong> {activeCourse.name}</div>
                    <div><strong className="text-stone-800">日時:</strong> {selectedDate} {selectedTimeSlot}</div>
                    {selectedCourse === 'trimmer' && (
                      <>
                        <div><strong className="text-stone-800">緊急連絡先:</strong> {emergencyPhone}</div>
                        <div><strong className="text-stone-800">メールアドレス:</strong> {emergencyEmail}</div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      // Reset to step 1 and clear inputs
                      setStep(1);
                      setDogName('');
                      setOwnerName('');
                      setSelectedTimeSlot('');
                      setAgreed1(false);
                      setAgreed2(false);
                      setEmergencyPhone('');
                      setEmergencyEmail('');
                    }}
                    className="w-full bg-stone-800 text-white font-semibold py-2.5 rounded-lg hover:bg-stone-950 transition text-sm shadow"
                  >
                    別の予約を入れる / トップへ
                  </button>
                  
                  <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-[11px] leading-relaxed">
                    💡 <strong>シミュレーター機能:</strong> 上部のタブを <strong>「トリマー用 現場端末」</strong> または <strong>「管理者 本部画面」</strong> に切り替えると、今追加した予約レコードがリアルタイムに反映されているのを確認できます！
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
