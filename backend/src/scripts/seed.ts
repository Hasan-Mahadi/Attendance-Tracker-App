import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import {
  User,
  Employee,
  Department,
  WorkSchedule,
  AttendancePolicy,
  LeaveCategory,
  LeavePolicy,
  LeaveBalance,
  LeaveLedgerEntry,
  PayrollPolicy,
  PerformancePolicy,
  ExpenseCategory,
  CompanySettings,
  SalaryProfile,
  AttendanceRecord,
} from '../models/index.js';
import {
  Roles,
  EmploymentTypes,
  EmploymentStatuses,
  RoundingMethods,
  AttendanceStatuses,
  ApprovalStatuses,
  LeaveLedgerTypes,
  DEFAULT_TIMEZONE,
  DEFAULT_CURRENCY,
  DEFAULT_CURRENCY_SYMBOL,
} from '../config/constants.js';
import { getDhakaDateOnly } from '../modules/attendance/service.js';

export async function seedDatabase() {
  logger.info('🌱 Starting database seeding for AIExpertsBD Attendance Tracker...');

  // 1. Company Settings
  let settings = await CompanySettings.findOne();
  if (!settings) {
    settings = await CompanySettings.create({
      companyName: 'AIExpertsBD',
      timezone: DEFAULT_TIMEZONE,
      currency: DEFAULT_CURRENCY,
      currencySymbol: DEFAULT_CURRENCY_SYMBOL,
      workweek: [0, 1, 2, 3, 4], // Sun-Thu (Bangladesh Standard)
      fiscalYearStartMonth: 1,
      contactEmail: 'contact@aiexpertsbd.com',
      contactPhone: '+880 1700-000000',
      address: 'Dhaka, Bangladesh',
      website: 'https://aiexpertsbd.com',
    });
    logger.info('✅ Company settings initialized');
  }

  // 2. Departments
  const departmentData = [
    { name: 'Engineering', description: 'Software Development & AI R&D' },
    { name: 'Product & Design', description: 'Product Management & UI/UX Design' },
    { name: 'Human Resources', description: 'Talent Acquisition & People Operations' },
    { name: 'Finance & Accounts', description: 'Financial Planning & Accounting' },
    { name: 'Sales & Marketing', description: 'Client Relations & Marketing' },
    { name: 'Operations', description: 'Office Administration & Support' },
  ];

  const departments: Record<string, any> = {};
  for (const dep of departmentData) {
    let d = await Department.findOne({ name: dep.name });
    if (!d) {
      d = await Department.create(dep);
    }
    departments[dep.name] = d;
  }
  logger.info(`✅ ${Object.keys(departments).length} departments configured`);

  // 3. Work Schedule
  let schedule = await WorkSchedule.findOne({ isDefault: true });
  if (!schedule) {
    schedule = await WorkSchedule.create({
      name: 'Standard Office Schedule (Sun-Thu)',
      startTime: '09:00',
      endTime: '18:00',
      workingDays: [0, 1, 2, 3, 4],
      lunchStartTime: '13:00',
      lunchEndTime: '14:00',
      lunchDurationMinutes: 60,
      isDefault: true,
      isActive: true,
    });
    logger.info('✅ Standard Work Schedule configured (09:00 - 18:00, Sun-Thu)');
  }

  // 4. Attendance Policy
  let attendancePolicy = await AttendancePolicy.findOne({ isDefault: true });
  if (!attendancePolicy) {
    attendancePolicy = await AttendancePolicy.create({
      name: 'Standard Attendance Policy',
      lateGraceMinutes: 10,
      halfDayThresholdMinutes: 240, // 4 hours
      minimumWorkingMinutes: 480, // 8 hours
      earlyDepartureThresholdMinutes: 15,
      requireCheckout: true,
      allowAdminCorrection: true,
      isDefault: true,
      isActive: true,
    });
    logger.info('✅ Standard Attendance Policy configured (10m grace period)');
  }

  // 5. Leave Categories
  const leaveCategoriesData = [
    { name: 'Casual Leave', code: 'CL', description: 'Short-term personal time off', isPaid: true, order: 1 },
    { name: 'Sick Leave', code: 'SL', description: 'Medical and health related absence', isPaid: true, order: 2 },
    { name: 'Annual / Earned Leave', code: 'AL', description: 'Earned paid annual leave', isPaid: true, order: 3 },
    { name: 'Emergency Leave', code: 'EL', description: 'Urgent family or medical emergency', isPaid: true, order: 4 },
    { name: 'Unpaid Leave', code: 'UL', description: 'Leave without pay', isPaid: false, order: 5 },
  ];

  const leaveCategories: Record<string, any> = {};
  for (const cat of leaveCategoriesData) {
    let c = await LeaveCategory.findOne({ code: cat.code });
    if (!c) {
      c = await LeaveCategory.create(cat);
    }
    leaveCategories[cat.code] = c;
  }
  logger.info('✅ Leave categories configured');

  // 6. Leave Policies
  const policiesConfig = [
    { category: 'CL', name: 'Casual Leave Policy', days: 10, isPaid: true, halfDay: true },
    { category: 'SL', name: 'Sick Leave Policy', days: 14, isPaid: true, halfDay: false },
    { category: 'AL', name: 'Annual Leave Policy', days: 15, isPaid: true, halfDay: true },
    { category: 'EL', name: 'Emergency Leave Policy', days: 5, isPaid: true, halfDay: true },
    { category: 'UL', name: 'Unpaid Leave Policy', days: 30, isPaid: false, halfDay: true },
  ];

  for (const p of policiesConfig) {
    const cat = leaveCategories[p.category];
    if (cat) {
      let pol = await LeavePolicy.findOne({ leaveCategory: cat._id });
      if (!pol) {
        await LeavePolicy.create({
          name: p.name,
          leaveCategory: cat._id,
          annualAllocation: p.days,
          monthlyAccrual: p.days / 12,
          maxCarryForward: p.category === 'AL' ? 5 : 0,
          allowHalfDay: p.halfDay,
          affectsSalary: !p.isPaid,
          requiresApproval: true,
          isDefault: true,
          isActive: true,
          effectiveFrom: new Date(),
        });
      }
    }
  }
  logger.info('✅ Leave policies configured');

  // 7. Payroll Policy
  let payrollPolicy = await PayrollPolicy.findOne({ isDefault: true });
  if (!payrollPolicy) {
    payrollPolicy = await PayrollPolicy.create({
      name: 'Standard 30-Day Payroll Policy',
      workingDayDivisor: 30,
      absentDeductionEnabled: true,
      halfDayDeductionRate: 0.5,
      unpaidLeaveDeductionEnabled: true,
      latePenaltyEnabled: false,
      maxGraceLateDaysPerMonth: 3,
      lateDeductionPerDayRate: 0.25,
      roundingMethod: RoundingMethods.ROUND,
      isDefault: true,
      isActive: true,
      effectiveFrom: new Date(),
    });
    logger.info('✅ Standard Payroll Policy configured');
  }

  // 8. Performance Policy
  let performancePolicy = await PerformancePolicy.findOne({ isDefault: true });
  if (!performancePolicy) {
    performancePolicy = await PerformancePolicy.create({
      name: 'Monthly Perfect Attendance Bonus Policy',
      maxLateDays: 2,
      lateGraceMinutes: 10,
      minAttendancePercentage: 90,
      maxAbsentDays: 0,
      halfDayCountsAs: 0.5,
      bonusAmount: 200000, // ৳2,000 in paisa
      isDefault: true,
      isActive: true,
      effectiveFrom: new Date(),
    });
    logger.info('✅ Performance Bonus Policy configured (৳2,000 bonus threshold)');
  }

  // 9. Expense Categories
  const expenseCategoriesData = [
    { name: 'Office Rent', code: 'RENT', order: 1 },
    { name: 'High-Speed Internet', code: 'INTERNET', order: 2 },
    { name: 'Electricity & Utilities', code: 'UTILITIES', order: 3 },
    { name: 'Office Snacks & Supplies', code: 'SUPPLIES', order: 4 },
    { name: 'Software & Cloud Subscriptions', code: 'SAAS', order: 5 },
    { name: 'Hardware & Equipment', code: 'EQUIPMENT', order: 6 },
    { name: 'Travel & Conveyance', code: 'TRAVEL', order: 7 },
    { name: 'Maintenance & Repairs', code: 'MAINTENANCE', order: 8 },
  ];

  for (const exp of expenseCategoriesData) {
    let ec = await ExpenseCategory.findOne({ code: exp.code });
    if (!ec) {
      await ExpenseCategory.create(exp);
    }
  }
  logger.info('✅ Expense categories configured');

  // 10. Bootstrap Super Admin
  const adminEmail = env.seed.adminEmail || 'admin@aiexpertsbd.com';
  const adminPassword = env.seed.adminPassword || 'Admin12345!';
  const adminEmployeeCode = env.seed.adminEmployeeCode || 'AIE-001';

  let adminEmployee = await Employee.findOne({ employeeCode: adminEmployeeCode });
  if (!adminEmployee) {
    adminEmployee = await Employee.create({
      employeeCode: adminEmployeeCode,
      firstName: 'System',
      lastName: 'SuperAdmin',
      email: adminEmail,
      phone: '+880 1700-000001',
      department: departments['Engineering']._id,
      designation: 'Chief Technology Officer',
      joiningDate: new Date('2023-01-01'),
      employmentType: EmploymentTypes.FULL_TIME,
      employmentStatus: EmploymentStatuses.ACTIVE,
      workSchedule: schedule._id,
      attendancePolicy: attendancePolicy._id,
    });

    await SalaryProfile.create({
      employee: adminEmployee._id,
      baseSalary: 10000000, // ৳100,000 in paisa
      effectiveFrom: new Date('2023-01-01'),
      isActive: true,
    });
  }

  let adminUser = await User.findOne({ employeeId: adminEmployee._id });
  if (!adminUser) {
    adminUser = new User({
      employeeId: adminEmployee._id,
      email: adminEmail,
      passwordHash: adminPassword,
      role: Roles.SUPER_ADMIN,
      isActive: true,
    });
    await adminUser.save();
    logger.info(`👑 Super Admin created: ${adminEmail} (Code: ${adminEmployeeCode})`);
  }

  // 11. Bootstrap HR Admin
  let hrEmployee = await Employee.findOne({ employeeCode: 'AIE-002' });
  if (!hrEmployee) {
    hrEmployee = await Employee.create({
      employeeCode: 'AIE-002',
      firstName: 'Farhana',
      lastName: 'Ahmed',
      email: 'hr@aiexpertsbd.com',
      phone: '+880 1700-000002',
      department: departments['Human Resources']._id,
      designation: 'HR Lead',
      joiningDate: new Date('2023-03-01'),
      employmentType: EmploymentTypes.FULL_TIME,
      employmentStatus: EmploymentStatuses.ACTIVE,
      workSchedule: schedule._id,
      attendancePolicy: attendancePolicy._id,
    });

    await SalaryProfile.create({
      employee: hrEmployee._id,
      baseSalary: 5000000, // ৳50,000 in paisa
      effectiveFrom: new Date('2023-03-01'),
      isActive: true,
    });

    const hrUser = new User({
      employeeId: hrEmployee._id,
      email: 'hr@aiexpertsbd.com',
      passwordHash: 'HrAdmin12345!',
      role: Roles.HR_ADMIN,
      isActive: true,
    });
    await hrUser.save();
    logger.info('👥 HR Admin created: hr@aiexpertsbd.com (Code: AIE-002)');
  }

  // 12. Bootstrap Demo Employee
  let demoEmp = await Employee.findOne({ employeeCode: 'AIE-003' });
  if (!demoEmp) {
    demoEmp = await Employee.create({
      employeeCode: 'AIE-003',
      firstName: 'Tanvir',
      lastName: 'Hossain',
      email: 'tanvir@aiexpertsbd.com',
      phone: '+880 1700-000003',
      department: departments['Engineering']._id,
      designation: 'Senior Full-Stack Engineer',
      joiningDate: new Date('2023-06-01'),
      employmentType: EmploymentTypes.FULL_TIME,
      employmentStatus: EmploymentStatuses.ACTIVE,
      workSchedule: schedule._id,
      attendancePolicy: attendancePolicy._id,
    });

    await SalaryProfile.create({
      employee: demoEmp._id,
      baseSalary: 4500000, // ৳45,000 in paisa
      effectiveFrom: new Date('2023-06-01'),
      isActive: true,
    });

    const empUser = new User({
      employeeId: demoEmp._id,
      email: 'tanvir@aiexpertsbd.com',
      passwordHash: 'Employee12345!',
      role: Roles.EMPLOYEE,
      isActive: true,
    });
    await empUser.save();
    logger.info('🧑‍💻 Employee created: tanvir@aiexpertsbd.com (Code: AIE-003)');
  }

  // Initialize leave balances for demo employees
  const currentYear = new Date().getFullYear();
  const allEmployees = [adminEmployee, hrEmployee, demoEmp];
  const policies = await LeavePolicy.find({ isActive: true }).populate('leaveCategory');

  for (const emp of allEmployees) {
    for (const policy of policies) {
      if (!policy.leaveCategory) continue;
      const exists = await LeaveBalance.findOne({
        employee: emp._id,
        leaveCategory: policy.leaveCategory._id,
        year: currentYear,
      });

      if (!exists) {
        await LeaveBalance.create({
          employee: emp._id,
          leaveCategory: policy.leaveCategory._id,
          year: currentYear,
          allocated: policy.annualAllocation,
          used: 0,
          pending: 0,
          carriedForward: 0,
          balance: policy.annualAllocation,
        });

        await LeaveLedgerEntry.create({
          employee: emp._id,
          leaveCategory: policy.leaveCategory._id,
          year: currentYear,
          type: LeaveLedgerTypes.ALLOCATION,
          amount: policy.annualAllocation,
          balanceAfter: policy.annualAllocation,
          description: `Initial ${currentYear} allocation`,
          createdBy: adminUser ? adminUser._id : emp._id,
        });
      }
    }
  }
  logger.info('✅ Initial leave balances and ledgers created for seed users');

  logger.info('🎉 Seeding completed successfully!');
}

// If executed directly from CLI
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  (async () => {
    try {
      await connectDatabase();
      await seedDatabase();
      await disconnectDatabase();
      process.exit(0);
    } catch (err) {
      logger.error('Seeding failed', { error: (err as Error).message });
      process.exit(1);
    }
  })();
}
