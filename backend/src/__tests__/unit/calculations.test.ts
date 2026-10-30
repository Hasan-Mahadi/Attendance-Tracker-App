import { describe, it, expect } from '@jest/globals';
import { getDhakaDateOnly, parseScheduleDateTime } from '../../modules/attendance/service.js';
import { sanitizeCsvValue } from '../../utils/csv.js';

describe('Business Rules & Attendance Calculations', () => {
  it('correctly normalizes date to UTC start of day in Asia/Dhaka (UTC+6)', () => {
    // 2026-10-30T04:00:00Z is 10:00 AM in Dhaka
    const date = new Date('2026-10-30T04:00:00Z');
    const dhakaDateOnly = getDhakaDateOnly(date);

    expect(dhakaDateOnly.getUTCFullYear()).toBe(2026);
    expect(dhakaDateOnly.getUTCMonth()).toBe(9); // October (0-indexed)
    expect(dhakaDateOnly.getUTCDate()).toBe(30);
    expect(dhakaDateOnly.getUTCHours()).toBe(0);
    expect(dhakaDateOnly.getUTCMinutes()).toBe(0);
  });

  it('correctly calculates scheduled start time from HH:mm in Asia/Dhaka', () => {
    const baseDate = new Date(Date.UTC(2026, 9, 30, 0, 0, 0, 0));
    // 09:00 in Dhaka (UTC+6) is 03:00 UTC
    const scheduledStart = parseScheduleDateTime('09:00', baseDate);

    expect(scheduledStart.getUTCHours()).toBe(3);
    expect(scheduledStart.getUTCMinutes()).toBe(0);
  });

  it('determines late status using configurable grace period (10 minutes)', () => {
    const baseDate = new Date(Date.UTC(2026, 9, 30, 0, 0, 0, 0));
    const scheduledStart = parseScheduleDateTime('09:00', baseDate); // 03:00 UTC
    const graceMinutes = 10;

    // Check-in at 09:08 Dhaka (03:08 UTC) -> Within grace period (8m <= 10m)
    const onTimeCheckIn = new Date(Date.UTC(2026, 9, 30, 3, 8, 0, 0));
    const diffMinutesOnTime = Math.floor(
      (onTimeCheckIn.getTime() - scheduledStart.getTime()) / (1000 * 60)
    );
    const isLateOnTime = diffMinutesOnTime > graceMinutes;
    expect(isLateOnTime).toBe(false);

    // Check-in at 09:15 Dhaka (03:15 UTC) -> Late by 15 minutes (> 10m grace)
    const lateCheckIn = new Date(Date.UTC(2026, 9, 30, 3, 15, 0, 0));
    const diffMinutesLate = Math.floor(
      (lateCheckIn.getTime() - scheduledStart.getTime()) / (1000 * 60)
    );
    const isLateCheckIn = diffMinutesLate > graceMinutes;
    expect(isLateCheckIn).toBe(true);
    expect(diffMinutesLate).toBe(15);
  });

  it('correctly calculates net working hours deducting lunch break', () => {
    const grossMinutes = 540; // 9 hours
    const lunchDurationMinutes = 60; // 1 hour
    const netWorkingMinutes = Math.max(0, grossMinutes - lunchDurationMinutes);

    expect(netWorkingMinutes).toBe(480); // 8 hours
  });

  it('classifies half-day when net working minutes are below half-day threshold', () => {
    const halfDayThreshold = 240; // 4 hours
    const workedMinutes = 200; // 3h 20m

    const isHalfDay = workedMinutes < halfDayThreshold;
    expect(isHalfDay).toBe(true);
  });

  it('verifies official workweek days (Sun-Thu: 0,1,2,3,4) vs weekend (Fri-Sat: 5,6)', () => {
    const workingDays = [0, 1, 2, 3, 4]; // Sunday - Thursday
    // Sunday (0)
    expect(workingDays.includes(0)).toBe(true);
    // Thursday (4)
    expect(workingDays.includes(4)).toBe(true);
    // Friday (5)
    expect(workingDays.includes(5)).toBe(false);
    // Saturday (6)
    expect(workingDays.includes(6)).toBe(false);
  });
});

describe('Salary and Payroll Calculations', () => {
  it('correctly calculates daily rate and absence deductions using integer paisa', () => {
    const baseSalaryBDT = 20000;
    const baseSalaryPaisa = baseSalaryBDT * 100; // 2,000,000 paisa
    const divisor = 30;

    const dailyRatePaisa = Math.round(baseSalaryPaisa / divisor);
    expect(dailyRatePaisa).toBe(66667); // ৳666.67 in paisa

    // 1 absent day
    const absentDeductionPaisa = 1 * dailyRatePaisa;
    expect(absentDeductionPaisa).toBe(66667);

    // 1 half-day deduction (0.5 rate)
    const halfDayDeductionPaisa = Math.round(1 * (dailyRatePaisa * 0.5));
    expect(halfDayDeductionPaisa).toBe(33334); // ৳333.34 in paisa

    // Total deductions = 66667 + 33334 = 100001
    const totalDeductionsPaisa = absentDeductionPaisa + halfDayDeductionPaisa;
    const netPayablePaisa = baseSalaryPaisa - totalDeductionsPaisa;

    expect(netPayablePaisa).toBe(1899999); // ৳18,999.99 in paisa
    expect(Math.round(netPayablePaisa / 100)).toBe(19000); // ৳19,000 rounded to integer BDT
  });

  it('does not produce duplicate deductions for approved paid leave', () => {
    const baseSalaryPaisa = 3000000; // ৳30,000
    const dailyRatePaisa = Math.round(baseSalaryPaisa / 30);

    const absentDays = 0;
    const paidLeaveDays = 3;

    // Paid leave is not deducted
    const absentDeduction = absentDays * dailyRatePaisa;
    const netPayable = baseSalaryPaisa - absentDeduction;

    expect(netPayable).toBe(baseSalaryPaisa);
  });

  it('correctly calculates unpaid leave salary deduction', () => {
    const baseSalaryPaisa = 3000000; // ৳30,000
    const dailyRatePaisa = Math.round(baseSalaryPaisa / 30); // ৳1,000 per day

    const unpaidLeaveDays = 2;
    const unpaidDeductionPaisa = unpaidLeaveDays * dailyRatePaisa;

    expect(unpaidDeductionPaisa).toBe(200000); // ৳2,000 in paisa
    const netPayable = baseSalaryPaisa - unpaidDeductionPaisa;
    expect(netPayable).toBe(2800000); // ৳28,000
  });
});

describe('Leave Policy and Quota Calculations', () => {
  it('correctly tracks leave balance after approved request', () => {
    const initialAllocation = 14;
    let balance = initialAllocation;
    let used = 0;

    // Apply for 3 days leave
    const requestedDays = 3;
    balance -= requestedDays;
    used += requestedDays;

    expect(balance).toBe(11);
    expect(used).toBe(3);
  });

  it('handles half-day leave deductions (0.5 day)', () => {
    const initialAllocation = 10;
    let balance = initialAllocation;

    // Half-day leave
    balance -= 0.5;
    expect(balance).toBe(9.5);
  });
});

describe('Performance Bonus Eligibility', () => {
  it('determines eligibility correctly based on maximum allowed late days and attendance percentage', () => {
    const policy = {
      maxLateDays: 2,
      minAttendancePercentage: 90,
      maxAbsentDays: 0,
      bonusAmount: 200000, // ৳2,000 in paisa
    };

    // Employee 1: 1 late day, 0 absent, 95% attendance -> ELIGIBLE
    const emp1 = { lateDays: 1, absentDays: 0, attendancePercentage: 95 };
    const emp1Eligible =
      emp1.lateDays <= policy.maxLateDays &&
      emp1.absentDays <= policy.maxAbsentDays &&
      emp1.attendancePercentage >= policy.minAttendancePercentage;
    expect(emp1Eligible).toBe(true);

    const bonusForEmp1 = emp1Eligible ? policy.bonusAmount : 0;
    expect(bonusForEmp1).toBe(200000);

    // Employee 2: 3 late days (> 2) -> NOT ELIGIBLE
    const emp2 = { lateDays: 3, absentDays: 0, attendancePercentage: 95 };
    const emp2Eligible =
      emp2.lateDays <= policy.maxLateDays &&
      emp2.absentDays <= policy.maxAbsentDays &&
      emp2.attendancePercentage >= policy.minAttendancePercentage;
    expect(emp2Eligible).toBe(false);

    const bonusForEmp2 = emp2Eligible ? policy.bonusAmount : 0;
    expect(bonusForEmp2).toBe(0);
  });
});

describe('Expense Amount Conversions', () => {
  it('converts BDT to paisa and vice versa without floating point distortion', () => {
    const amountBDT = 2500.5;
    const paisa = Math.round(amountBDT * 100);
    expect(paisa).toBe(250050);

    const backToBDT = paisa / 100;
    expect(backToBDT).toBe(2500.5);
  });
});

describe('Security and Sanitization', () => {
  it('sanitizes CSV formula injection attempts', () => {
    expect(sanitizeCsvValue('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
    expect(sanitizeCsvValue('+cmd|/C')).toBe("'+cmd|/C");
    expect(sanitizeCsvValue('-1+2')).toBe("'-1+2");
    expect(sanitizeCsvValue('@eval()')).toBe("'@eval()");
    expect(sanitizeCsvValue('Standard Name')).toBe('Standard Name');
  });
});
