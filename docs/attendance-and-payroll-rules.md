# Attendance & Payroll Business Logic — AIExpertsBD

## 1. Operating Timezone & Day Boundaries

- **Official Company Timezone**: `Asia/Dhaka` (UTC+6).
- **Date Normalization**: All attendance records and calendar events represent Dhaka calendar dates. When an employee checks in at `2026-10-30 09:12:00` Dhaka time (`03:12:00` UTC), the record's date is normalized to `2026-10-30T00:00:00.000Z` UTC.

---

## 2. Shift & Punctuality Engine

### Work Schedule
- **Official Workweek**: Sunday to Thursday (Sun-Thu). Friday and Saturday are configured as weekly off days.
- **Scheduled Hours**: `09:00 AM` to `06:00 PM` (9 hours gross duration).
- **Lunch Break**: `01:00 PM` to `02:00 PM` (60 minutes).

### Punctuality & Grace Period Logic
- **Late Grace Period**: Configurable (default: **10 minutes**).
- **Threshold**:
  $$\text{Arrival Deadline} = \text{Scheduled Start Time} + \text{Grace Period} = 09:10\text{ AM}$$
- **Evaluations**:
  - Check-in $\le 09:10\text{ AM}$: Classified as `PRESENT`, $\text{Late Minutes} = 0$.
    Notification: *"Thank you for checking in on time. Have a productive day!"*
  - Check-in $> 09:10\text{ AM}$: Classified as `LATE`, $\text{Late Minutes} = \text{Actual Check-in} - \text{Scheduled Start Time}$.
    Notification: *"Your check-in was recorded. You are 15 minutes late today."*

### Working Hours & Half-Day Rules
- **Gross Duration**: $\text{Actual Check-out} - \text{Actual Check-in}$
- **Net Working Duration**: $\text{Gross Duration} - \text{Lunch Duration}$
- **Full-Day Standard**: 480 minutes (8 net hours).
- **Half-Day Threshold**: Configurable (default: **240 minutes** = 4 hours).
  - If an employee checks out with $< 240$ net working minutes without an approved full-day leave, the status is classified as `HALF_DAY`.

---

## 3. Salary & Payroll Calculation Engine

### Divisor Standard
- **Configurable Divisor**: Default is **30** (configurable to actual calendar days in month or working days).
- **Daily Rate Calculation**:
  $$\text{Daily Rate} = \frac{\text{Base Monthly Salary}}{\text{Configured Divisor}}$$
  *Example*: For a Base Salary of ৳20,000 with a divisor of 30:
  $$\text{Daily Rate} = \frac{20000}{30} = ৳666.67\ (66,667\text{ paisa})$$

### Deductions Breakdown
1. **Unpaid Absence Deductions**:
   $$\text{Absence Deduction} = \text{Unexcused Absent Days} \times \text{Daily Rate}$$
2. **Half-Day Absence Deductions**:
   $$\text{Half-Day Deduction} = \text{Half Days} \times (\text{Daily Rate} \times \text{HalfDayDeductionRate})$$
   *(Default Half-Day multiplier is 0.5)*
3. **No Duplicate Deductions**:
   Approved paid leave days (`ON_LEAVE`), official holidays (`HOLIDAY`), and weekly offs (`WEEKLY_OFF`) never incur absence deductions. A half-day absence never incurs both an absence deduction and a half-day deduction simultaneously.

### Final Net Payable Formula
$$\begin{aligned}
\text{Gross Earnings} &= \text{Base Salary} + \text{Performance Bonus} + \text{Other Earnings} \\
\text{Total Deductions} &= \text{Absence Deductions} + \text{Half-Day Deductions} + \text{Unpaid Leave Deductions} \\
\text{Net Payable} &= \text{Gross Earnings} - \text{Total Deductions} \pm \text{Approved Adjustments}
\end{aligned}$$

---

## 4. Attendance Performance Bonus Policy

- **Configured Monthly Bonus**: ৳2,000 (200,000 paisa).
- **Eligibility Criteria**:
  1. Maximum allowed late days $\le 2$ days.
  2. Attendance completion rate $\ge 90\%$.
  3. Unexcused absence count $= 0$.
- **Disbursement**: When an employee satisfies all three criteria, the bonus is automatically populated during monthly payroll preview and added to gross earnings upon finalization.
