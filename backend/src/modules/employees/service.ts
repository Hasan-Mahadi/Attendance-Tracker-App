import crypto from 'crypto';
import mongoose from 'mongoose';
import {
  Employee,
  User,
  EmployeeInvitation,
  SalaryProfile,
  Department,
  WorkSchedule,
  AuditLog,
  IEmployee,
} from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { PaginationMeta } from '../../utils/ApiResponse.js';
import { sanitizeCsvValue } from '../../utils/csv.js';
import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  CreateInvitationInput,
  UpdateSalaryInput,
} from './validators.js';
import { Roles, EmploymentStatuses } from '../../config/constants.js';

export class EmployeeService {
  /**
   * Create employee profile and optional initial salary profile
   */
  static async createEmployee(
    input: CreateEmployeeInput,
    adminUserId: string
  ): Promise<IEmployee> {
    const existing = await Employee.findOne({
      $or: [
        { employeeCode: input.employeeCode.toUpperCase() },
        { email: input.email.toLowerCase() },
      ],
    });

    if (existing) {
      if (existing.employeeCode === input.employeeCode.toUpperCase()) {
        throw ApiError.conflict(`Employee ID ${input.employeeCode} already exists`);
      }
      throw ApiError.conflict(`Email ${input.email} is already in use`);
    }

    const employee = new Employee({
      employeeCode: input.employeeCode.toUpperCase(),
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email.toLowerCase(),
      phone: input.phone,
      department: input.department,
      designation: input.designation,
      joiningDate: input.joiningDate,
      employmentType: input.employmentType,
      employmentStatus: EmploymentStatuses.ACTIVE,
      reportingManager: input.reportingManager || undefined,
      workSchedule: input.workSchedule || undefined,
      attendancePolicy: input.attendancePolicy || undefined,
      leavePolicy: input.leavePolicy || undefined,
    });

    await employee.save();

    // If initial salary is provided, create SalaryProfile (stored as integer paisa: BDT * 100)
    if (input.baseSalary !== undefined && input.baseSalary >= 0) {
      await SalaryProfile.create({
        employee: employee._id,
        baseSalary: Math.round(input.baseSalary * 100),
        effectiveFrom: input.joiningDate,
        isActive: true,
        createdBy: adminUserId,
      });
    }

    // Audit log
    await AuditLog.create({
      userId: adminUserId,
      action: 'EMPLOYEE_CREATE',
      resource: 'Employee',
      resourceId: employee._id.toString(),
      newData: {
        employeeCode: employee.employeeCode,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
      },
    });

    return employee;
  }

  /**
   * Get paginated employees list with filtering and search
   */
  static async getEmployees(params: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    status?: string;
    designation?: string;
  }): Promise<{ items: any[]; pagination: PaginationMeta }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 10));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (params.department) {
      query.department = params.department;
    }

    if (params.status) {
      query.employmentStatus = params.status;
    }

    if (params.designation) {
      query.designation = { $regex: params.designation, $options: 'i' };
    }

    if (params.search) {
      const searchRegex = { $regex: params.search, $options: 'i' };
      query.$or = [
        { employeeCode: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { designation: searchRegex },
      ];
    }

    const [items, totalItems, defaultSchedule] = await Promise.all([
      Employee.find(query)
        .populate('department', 'name')
        .populate('reportingManager', 'firstName lastName employeeCode')
        .populate('workSchedule', 'name startTime endTime workingDays')
        .sort({ employeeCode: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Employee.countDocuments(query),
      WorkSchedule.findOne({ isDefault: true, isActive: true })
        .select('name startTime endTime workingDays')
        .lean(),
    ]);

    // Attach user account registration status
    const employeeIds = items.map((e) => e._id);
    const users = await User.find({ employeeId: { $in: employeeIds } })
      .select('employeeId role isActive lastLogin')
      .lean();

    const userMap = new Map(users.map((u) => [u.employeeId.toString(), u]));

    const enrichedItems = items.map((emp) => ({
      ...emp,
      workSchedule: emp.workSchedule || defaultSchedule || {
        name: 'Standard Shift',
        startTime: '09:00',
        endTime: '18:00',
        workingDays: [0, 1, 2, 3, 4],
      },
      account: userMap.get(emp._id.toString()) || null,
    }));

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: enrichedItems,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get employee by ID with authorization checks
   */
  static async getEmployeeById(
    employeeId: string,
    requestingUser: { id: string; employeeId: string; role: string }
  ) {
    // If not admin/hr, can only view own profile
    if (
      requestingUser.role !== Roles.SUPER_ADMIN &&
      requestingUser.role !== Roles.HR_ADMIN &&
      requestingUser.employeeId !== employeeId
    ) {
      throw ApiError.forbidden('You can only view your own profile');
    }

    const employee = await Employee.findById(employeeId)
      .populate('department')
      .populate('reportingManager', 'firstName lastName employeeCode email')
      .populate('workSchedule')
      .populate('attendancePolicy')
      .populate('leavePolicy');

    if (!employee) {
      throw ApiError.notFound('Employee not found');
    }

    const user = await User.findOne({ employeeId: employee._id }).select(
      'role isActive lastLogin createdAt'
    );

    // If authorized, get salary profile
    let currentSalary = null;
    if (
      requestingUser.role === Roles.SUPER_ADMIN ||
      requestingUser.role === Roles.HR_ADMIN ||
      requestingUser.employeeId === employeeId
    ) {
      const salaryProfile = await SalaryProfile.findOne({
        employee: employee._id,
        isActive: true,
      }).sort({ effectiveFrom: -1 });

      if (salaryProfile) {
        currentSalary = {
          baseSalary: salaryProfile.baseSalary / 100, // convert paisa to BDT
          effectiveFrom: salaryProfile.effectiveFrom,
        };
      }
    }

    return {
      ...employee.toObject(),
      account: user,
      currentSalary,
    };
  }

  /**
   * Update employee profile
   */
  static async updateEmployee(
    employeeId: string,
    input: UpdateEmployeeInput,
    adminUserId: string
  ) {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw ApiError.notFound('Employee not found');
    }

    const previousData = employee.toObject();

    if (input.email && input.email.toLowerCase() !== employee.email) {
      const exists = await Employee.findOne({
        email: input.email.toLowerCase(),
        _id: { $ne: employee._id },
      });
      if (exists) {
        throw ApiError.conflict('Email is already in use by another employee');
      }
      employee.email = input.email.toLowerCase();
      // Update User email as well
      await User.updateOne({ employeeId: employee._id }, { email: input.email.toLowerCase() });
    }

    if (input.firstName !== undefined) employee.firstName = input.firstName;
    if (input.lastName !== undefined) employee.lastName = input.lastName;
    if (input.phone !== undefined) employee.phone = input.phone;
    if (input.department !== undefined) employee.department = new mongoose.Types.ObjectId(input.department);
    if (input.designation !== undefined) employee.designation = input.designation;
    if (input.joiningDate !== undefined) employee.joiningDate = input.joiningDate;
    if (input.employmentType !== undefined) employee.employmentType = input.employmentType;
    if (input.employmentStatus !== undefined) {
      employee.employmentStatus = input.employmentStatus;
      // If employee is suspended or terminated, deactivate user login
      if (
        input.employmentStatus === EmploymentStatuses.SUSPENDED ||
        input.employmentStatus === EmploymentStatuses.TERMINATED
      ) {
        await User.updateOne({ employeeId: employee._id }, { isActive: false });
      } else if (input.employmentStatus === EmploymentStatuses.ACTIVE) {
        await User.updateOne({ employeeId: employee._id }, { isActive: true });
      }
    }
    if (input.reportingManager !== undefined) {
      employee.reportingManager = input.reportingManager
        ? new mongoose.Types.ObjectId(input.reportingManager)
        : undefined;
    }
    if (input.workSchedule !== undefined) {
      employee.workSchedule = input.workSchedule
        ? new mongoose.Types.ObjectId(input.workSchedule)
        : undefined;
    }
    if (input.attendancePolicy !== undefined) {
      employee.attendancePolicy = input.attendancePolicy
        ? new mongoose.Types.ObjectId(input.attendancePolicy)
        : undefined;
    }
    if (input.leavePolicy !== undefined) {
      employee.leavePolicy = input.leavePolicy
        ? new mongoose.Types.ObjectId(input.leavePolicy)
        : undefined;
    }
    if (input.profileImage !== undefined) {
      employee.profileImage = input.profileImage;
    }

    await employee.save();

    await AuditLog.create({
      userId: adminUserId,
      action: 'EMPLOYEE_UPDATE',
      resource: 'Employee',
      resourceId: employee._id.toString(),
      previousData,
      newData: employee.toObject(),
    });

    return employee;
  }

  /**
   * Generate registration invitation code for an Employee
   */
  static async createInvitation(input: CreateInvitationInput, adminUserId: string) {
    const employee = await Employee.findById(input.employeeId);
    if (!employee) {
      throw ApiError.notFound('Employee not found');
    }

    if (employee.employmentStatus !== EmploymentStatuses.ACTIVE) {
      throw ApiError.badRequest('Cannot create invitation for inactive employee');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ employeeId: employee._id });
    if (existingUser) {
      throw ApiError.conflict('An active account already exists for this employee');
    }

    // Expire any existing unused invitations
    await EmployeeInvitation.updateMany(
      { employeeId: employee._id, isUsed: false },
      { isUsed: true, usedAt: new Date() }
    );

    // Generate random readable invitation code (e.g. 10 chars uppercase + numbers)
    const rawCode = crypto.randomBytes(5).toString('hex').toUpperCase();

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (input.expiresInHours || 72));

    const invitation = await EmployeeInvitation.create({
      employeeId: employee._id,
      invitationCode: rawCode,
      email: employee.email,
      createdBy: adminUserId,
      expiresAt,
      isUsed: false,
    });

    await AuditLog.create({
      userId: adminUserId,
      action: 'EMPLOYEE_INVITATION_CREATE',
      resource: 'EmployeeInvitation',
      resourceId: invitation._id.toString(),
      newData: {
        employeeCode: employee.employeeCode,
        email: employee.email,
        expiresAt,
      },
    });

    return {
      employeeId: employee._id,
      employeeCode: employee.employeeCode,
      email: employee.email,
      invitationCode: rawCode,
      expiresAt,
    };
  }

  /**
   * Update or set salary profile
   */
  static async updateSalary(
    employeeId: string,
    input: UpdateSalaryInput,
    adminUserId: string
  ) {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw ApiError.notFound('Employee not found');
    }

    const currentProfile = await SalaryProfile.findOne({
      employee: employee._id,
      isActive: true,
    }).lean();

    const previousSalary = currentProfile ? currentProfile.baseSalary / 100 : undefined;

    // Deactivate previous active profiles with effectiveFrom <= new effectiveFrom
    await SalaryProfile.updateMany(
      { employee: employee._id, isActive: true },
      { isActive: false, effectiveTo: input.effectiveFrom }
    );

    const newProfile = await SalaryProfile.create({
      employee: employee._id,
      baseSalary: Math.round(input.baseSalary * 100), // convert BDT to paisa
      effectiveFrom: input.effectiveFrom,
      isActive: true,
      notes: input.notes,
      createdBy: adminUserId,
    });

    await AuditLog.create({
      userId: adminUserId,
      action: 'SALARY_PROFILE_UPDATE',
      resource: 'SalaryProfile',
      resourceId: newProfile._id.toString(),
      previousData: {
        employeeCode: employee.employeeCode,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        baseSalary: previousSalary,
        effectiveFrom: currentProfile?.effectiveFrom,
      },
      newData: {
        employeeCode: employee.employeeCode,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        baseSalary: input.baseSalary,
        effectiveFrom: input.effectiveFrom,
        notes: input.notes,
      },
    });

    return {
      baseSalary: newProfile.baseSalary / 100,
      effectiveFrom: newProfile.effectiveFrom,
      isActive: newProfile.isActive,
    };
  }

  /**
   * Export employees to CSV with injection sanitization
   */
  static async exportCsv(): Promise<string> {
    const employees = await Employee.find()
      .populate('department', 'name')
      .populate('reportingManager', 'employeeCode firstName lastName')
      .sort({ employeeCode: 1 })
      .lean();

    const headers = [
      'Employee ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Department',
      'Designation',
      'Joining Date',
      'Employment Type',
      'Status',
    ];

    const rows = employees.map((emp) => [
      sanitizeCsvValue(emp.employeeCode),
      sanitizeCsvValue(emp.firstName),
      sanitizeCsvValue(emp.lastName),
      sanitizeCsvValue(emp.email),
      sanitizeCsvValue(emp.phone || ''),
      sanitizeCsvValue((emp.department as any)?.name || ''),
      sanitizeCsvValue(emp.designation || ''),
      sanitizeCsvValue(emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : ''),
      sanitizeCsvValue(emp.employmentType),
      sanitizeCsvValue(emp.employmentStatus),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
