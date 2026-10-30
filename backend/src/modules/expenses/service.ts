import mongoose from 'mongoose';
import {
  ExpenseCategory,
  ExpenseRecord,
  PayrollPeriod,
  AuditLog,
} from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { ExpenseApprovalStatuses } from '../../config/constants.js';

export class ExpenseService {
  static async getCategories() {
    return ExpenseCategory.find({ isActive: true }).sort({ order: 1 });
  }

  static async createCategory(data: { name: string; code?: string; description?: string }, userId: string) {
    const code = (data.code || data.name).toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 15);
    const category = await ExpenseCategory.create({
      name: data.name.trim(),
      code,
      description: data.description?.trim(),
      isActive: true,
    });

    await AuditLog.create({
      userId,
      action: 'EXPENSE_CATEGORY_CREATE',
      resource: 'ExpenseCategory',
      resourceId: category._id.toString(),
      newData: { name: category.name, code: category.code },
    });

    return category;
  }

  static async createExpense(data: {
    date: string;
    category: string;
    title: string;
    description?: string;
    amount: number; // in BDT, convert to paisa
    paymentMethod: string;
    vendor?: string;
    receiptUrl?: string;
    notes?: string;
    userId: string;
  }) {
    let categoryId = data.category;
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      let cat = await ExpenseCategory.findOne({ name: new RegExp(`^${data.category.trim()}$`, 'i') });
      if (!cat) {
        cat = await ExpenseCategory.create({
          name: data.category.trim(),
          code: data.category.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 15),
          isActive: true,
        });
      }
      categoryId = cat._id.toString();
    }

    const expense = await ExpenseRecord.create({
      date: new Date(data.date),
      category: categoryId,
      title: data.title.trim(),
      description: data.description,
      amount: Math.round(data.amount * 100), // convert BDT to paisa
      paymentMethod: data.paymentMethod,
      vendor: data.vendor,
      receiptUrl: data.receiptUrl,
      enteredBy: data.userId,
      approvalStatus: ExpenseApprovalStatuses.APPROVED, // auto-approve admin/finance entries
      approvedBy: data.userId,
      approvedAt: new Date(),
      notes: data.notes,
    });

    await AuditLog.create({
      userId: data.userId,
      action: 'EXPENSE_CREATE',
      resource: 'ExpenseRecord',
      resourceId: expense._id.toString(),
      newData: { title: expense.title, amount: expense.amount },
    });

    return expense;
  }

  static async getExpenses(params: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (params.category) query.category = params.category;
    if (params.status) query.approvalStatus = params.status;

    if (params.startDate && params.endDate) {
      query.date = { $gte: new Date(params.startDate), $lte: new Date(params.endDate) };
    } else if (params.month && params.year) {
      const start = new Date(Date.UTC(Number(params.year), Number(params.month) - 1, 1));
      const end = new Date(Date.UTC(Number(params.year), Number(params.month), 0, 23, 59, 59));
      query.date = { $gte: start, $lte: end };
    } else if (params.year) {
      const start = new Date(Date.UTC(Number(params.year), 0, 1));
      const end = new Date(Date.UTC(Number(params.year), 11, 31, 23, 59, 59));
      query.date = { $gte: start, $lte: end };
    }

    const [items, totalItems] = await Promise.all([
      ExpenseRecord.find(query)
        .populate('category', 'name code')
        .populate('enteredBy', 'email')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ExpenseRecord.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
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
   * Financial overview comparing expenses, payroll, and bonus liabilities
   */
  static async getFinancialSummary(month: number, year: number) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    // Expenses in month
    const expenses = await ExpenseRecord.find({
      date: { $gte: start, $lte: end },
      approvalStatus: ExpenseApprovalStatuses.APPROVED,
    }).populate('category');

    let totalOfficeExpensesPaisa = 0;
    const categoryBreakdown: Record<string, number> = {};

    for (const exp of expenses) {
      totalOfficeExpensesPaisa += exp.amount;
      const catName = (exp.category as any)?.name || 'Other';
      categoryBreakdown[catName] = (categoryBreakdown[catName] || 0) + exp.amount;
    }

    // Finalized payroll for month
    const payrollPeriod = await PayrollPeriod.findOne({ month, year });
    const totalPayrollPaisa = payrollPeriod ? payrollPeriod.totalNetPayable : 0;
    const totalBonusPaisa = payrollPeriod ? payrollPeriod.totalBonuses : 0;

    const totalMonthlyExpenditurePaisa = totalOfficeExpensesPaisa + totalPayrollPaisa;

    // Year-to-date calculation
    const ytdStart = new Date(Date.UTC(year, 0, 1));
    const ytdExpenses = await ExpenseRecord.find({
      date: { $gte: ytdStart, $lte: end },
      approvalStatus: ExpenseApprovalStatuses.APPROVED,
    });
    const totalYtdExpensesPaisa = ytdExpenses.reduce((sum, e) => sum + e.amount, 0);

    const ytdPayrollPeriods = await PayrollPeriod.find({
      year,
      month: { $lte: month },
    });
    const totalYtdPayrollPaisa = ytdPayrollPeriods.reduce((sum, p) => sum + p.totalNetPayable, 0);

    return {
      month,
      year,
      monthly: {
        officeExpensesPaisa: totalOfficeExpensesPaisa,
        payrollPaisa: totalPayrollPaisa,
        bonusPaisa: totalBonusPaisa,
        totalExpenditurePaisa: totalMonthlyExpenditurePaisa,
        categoryBreakdown,
      },
      yearToDate: {
        totalOfficeExpensesPaisa: totalYtdExpensesPaisa,
        totalPayrollPaisa: totalYtdPayrollPaisa,
        totalExpenditurePaisa: totalYtdExpensesPaisa + totalYtdPayrollPaisa,
      },
    };
  }
}
