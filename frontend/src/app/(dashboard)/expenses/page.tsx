'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Pagination } from '../../../components/ui/Pagination';
import { formatCurrency, formatDate } from '../../../lib/utils';
import api from '../../../lib/api';
import { Receipt, Plus, DollarSign, CreditCard } from 'lucide-react';

export default function ExpensesPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Record Expense Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [newExpense, setNewExpense] = useState({
    title: '',
    category: '',
    amount: 1000,
    paymentMethod: 'bank_transfer',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    description: '',
    notes: '',
  });

  const fetchExpensesData = async () => {
    try {
      const [expRes, catRes, sumRes] = await Promise.all([
        api.get('/expenses', {
          params: { page: currentPage, month: selectedMonth, year: selectedYear },
        }),
        api.get('/expenses/categories'),
        api.get('/expenses/summary', {
          params: { month: selectedMonth, year: selectedYear },
        }),
      ]);
      setExpenses(expRes.data.data);
      setPagination(expRes.data.pagination);
      setCategories(catRes.data.data || []);
      setSummary(sumRes.data.data);

      if (!newExpense.category && catRes.data.data?.length > 0) {
        setNewExpense((prev) => ({ ...prev, category: catRes.data.data[0]._id }));
      }
    } catch {
      toast.error('Failed to load expense records');
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchExpensesData();
  }, [user, currentPage, selectedMonth, selectedYear]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalCategory =
        newExpense.category === '__new__' ? customCategoryName.trim() : newExpense.category;

      if (!finalCategory) {
        toast.error('Please specify an expense category');
        return;
      }

      await api.post('/expenses', {
        ...newExpense,
        category: finalCategory,
        amount: Number(newExpense.amount),
      });
      toast.success('Office expense recorded');
      setShowAddModal(false);
      setCustomCategoryName('');
      setNewExpense({
        title: '',
        category: categories[0]?._id || '',
        amount: 1000,
        paymentMethod: 'bank_transfer',
        date: new Date().toISOString().split('T')[0],
        vendor: '',
        description: '',
        notes: '',
      });
      fetchExpensesData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record expense');
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#C95742]">Office Expenses & Financials</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage company overhead, rent, utility bills, software subscriptions, and expenditure reports
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Record Expense
        </Button>
      </div>

      {/* Financial Overview Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Monthly Office Expenses"
            value={formatCurrency(summary.monthly.officeExpensesPaisa)}
            subtitle={`Month ${selectedMonth}/${selectedYear}`}
            icon={<Receipt className="w-4 h-4 text-blue-600" />}
          />
          <StatCard
            title="Monthly Payroll Total"
            value={formatCurrency(summary.monthly.payrollPaisa)}
            subtitle="Staff Salaries & Bonuses"
            icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
          />
          <StatCard
            title="Total Monthly Expenditure"
            value={formatCurrency(summary.monthly.totalExpenditurePaisa)}
            subtitle="Payroll + Office Operations"
            icon={<CreditCard className="w-4 h-4 text-indigo-600" />}
          />
          <StatCard
            title="Year-to-Date Total"
            value={formatCurrency(summary.yearToDate.totalExpenditurePaisa)}
            subtitle={`Full Calendar Year ${selectedYear}`}
            icon={<CreditCard className="w-4 h-4 text-slate-700" />}
          />
        </div>
      )}

      {/* Filter Bar */}
      <Card className="mb-6">
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <div className="w-40">
            <Select
              label="Month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              options={[
                { label: 'January', value: 1 },
                { label: 'February', value: 2 },
                { label: 'March', value: 3 },
                { label: 'April', value: 4 },
                { label: 'May', value: 5 },
                { label: 'June', value: 6 },
                { label: 'July', value: 7 },
                { label: 'August', value: 8 },
                { label: 'September', value: 9 },
                { label: 'October', value: 10 },
                { label: 'November', value: 11 },
                { label: 'December', value: 12 },
              ]}
            />
          </div>

          <div className="w-32">
            <Select
              label="Year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              options={[
                { label: '2024', value: 2024 },
                { label: '2025', value: 2025 },
                { label: '2026', value: 2026 },
                { label: '2027', value: 2027 },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expenditure Records</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Vendor / Payee</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                  No expenses recorded for this month
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((exp) => (
                <TableRow key={exp._id}>
                  <TableCell className="font-medium text-slate-900">{formatDate(exp.date)}</TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{exp.title}</div>
                    {exp.description && (
                      <div className="text-xs text-slate-500 max-w-xs truncate">{exp.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {exp.category?.name || 'General'}
                    </span>
                  </TableCell>
                  <TableCell>{exp.vendor || '—'}</TableCell>
                  <TableCell className="capitalize text-xs text-slate-600">
                    {exp.paymentMethod?.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">{formatCurrency(exp.amount)}</TableCell>
                  <TableCell>
                    <StatusBadge status={exp.approvalStatus} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={(p) => setCurrentPage(p)}
          />
        )}
      </Card>

      {/* Record Expense Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Record New Office Expense"
        description="Add operational costs, bills, and office invoices with receipts"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <Input
            label="Expense Title"
            placeholder="e.g. October Internet Fiber Bill"
            value={newExpense.title}
            onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Expense Category"
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
              options={[
                ...categories.map((c) => ({ label: c.name, value: c._id })),
                { label: '+ Add Custom Category...', value: '__new__' },
              ]}
              required
            />
            <Input
              label="Amount in BDT (৳)"
              type="number"
              placeholder="5000"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
              required
            />
          </div>

          {newExpense.category === '__new__' && (
            <Input
              label="New Custom Category Name"
              placeholder="e.g. Server Infrastructure, Office Refreshments"
              value={customCategoryName}
              onChange={(e) => setCustomCategoryName(e.target.value)}
              helperText="This custom category will be created and saved automatically"
              required
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Expense Date"
              type="date"
              value={newExpense.date}
              onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
              required
            />
            <Select
              label="Payment Method"
              value={newExpense.paymentMethod}
              onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
              options={[
                { label: 'Bank Transfer', value: 'bank_transfer' },
                { label: 'Company Card', value: 'card' },
                { label: 'Petty Cash', value: 'cash' },
                { label: 'Online Gateway', value: 'online' },
                { label: 'Check', value: 'check' },
              ]}
            />
          </div>

          <Input
            label="Vendor / Payee"
            placeholder="e.g. AmberIT / Summit Communications"
            value={newExpense.vendor}
            onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Invoice Notes
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional billing details..."
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
