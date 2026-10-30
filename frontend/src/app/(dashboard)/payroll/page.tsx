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
import { Select } from '../../../components/ui/Select';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { formatCurrency, formatDate } from '../../../lib/utils';
import api from '../../../lib/api';
import { Wallet, Calculator, Lock, Eye, Download, Printer } from 'lucide-react';

export default function PayrollPage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'my' | 'process'>('my');
  const [myPayslips, setMyPayslips] = useState<any[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [showPayslipModal, setShowPayslipModal] = useState(false);

  // Admin Processing
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const fetchMyPayslips = async () => {
    try {
      const res = await api.get('/payroll/my-payslips');
      setMyPayslips(res.data.data || []);
    } catch {
      toast.error('Failed to load payslips');
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchMyPayslips();
  }, [user]);

  const handleRunPreview = async () => {
    setIsCalculating(true);
    try {
      const res = await api.post('/payroll/preview', {
        month: selectedMonth,
        year: selectedYear,
      });
      setPreviewResult(res.data.data);
      toast.success('Payroll preview calculated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to calculate payroll preview');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleFinalizePayroll = async () => {
    setIsFinalizing(true);
    try {
      await api.post('/payroll/finalize', {
        month: selectedMonth,
        year: selectedYear,
      });
      toast.success(`Payroll for ${selectedMonth}/${selectedYear} finalized and locked permanently!`);
      setShowFinalizeConfirm(false);
      handleRunPreview();
      fetchMyPayslips();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Finalization failed');
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleViewPayslip = async (payslipId: string) => {
    try {
      const res = await api.get(`/payroll/records/${payslipId}`);
      setSelectedPayslip(res.data.data);
      setShowPayslipModal(true);
    } catch {
      toast.error('Failed to load payslip details');
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Salary & Payroll Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent policy-driven payroll calculations, itemized deductions, and frozen payslips
          </p>
        </div>
      </div>

      {/* Admin Tab Switcher */}
      {isAdmin && (
        <div className="flex border-b border-slate-200 mb-6 gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('my')}
            className={`pb-3 transition relative ${
              activeTab === 'my'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            My Payslips
          </button>
          <button
            onClick={() => setActiveTab('process')}
            className={`pb-3 transition relative ${
              activeTab === 'process'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Process & Finalize Payroll
          </button>
        </div>
      )}

      {/* Employee Payslip View */}
      {(!isAdmin || activeTab === 'my') && (
        <Card>
          <CardHeader>
            <CardTitle>My Official Payslips</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payroll Period</TableHead>
                <TableHead>Base Salary</TableHead>
                <TableHead>Days Worked</TableHead>
                <TableHead>Absences & Deductions</TableHead>
                <TableHead>Performance Bonus</TableHead>
                <TableHead>Net Payable</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myPayslips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                    No finalized payslips available yet
                  </TableCell>
                </TableRow>
              ) : (
                myPayslips.map((ps) => (
                  <TableRow key={ps._id}>
                    <TableCell className="font-semibold text-slate-900">
                      {ps.payrollPeriod?.month}/{ps.payrollPeriod?.year}
                    </TableCell>
                    <TableCell>{formatCurrency(ps.baseSalary)}</TableCell>
                    <TableCell>{ps.daysPresent} days</TableCell>
                    <TableCell className="text-rose-600 font-medium">
                      -{formatCurrency(ps.totalDeductions)}
                    </TableCell>
                    <TableCell className="text-emerald-600 font-medium">
                      +{formatCurrency(ps.performanceBonus)}
                    </TableCell>
                    <TableCell className="text-base font-bold text-blue-600">
                      {formatCurrency(ps.netPayable)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ps.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPayslip(ps._id)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        View Slip
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Admin Payroll Processing View */}
      {isAdmin && activeTab === 'process' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <Card>
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
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
                <Button
                  variant="primary"
                  className="mt-5"
                  onClick={handleRunPreview}
                  isLoading={isCalculating}
                  leftIcon={<Calculator className="w-4 h-4" />}
                >
                  Calculate Preview
                </Button>
              </div>

              {previewResult && (
                <div className="flex items-center gap-3 mt-5 sm:mt-0">
                  <Button
                    variant="success"
                    onClick={() => setShowFinalizeConfirm(true)}
                    leftIcon={<Lock className="w-4 h-4" />}
                  >
                    Finalize & Freeze Payroll
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Totals Summary */}
          {previewResult && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard
                  title="Total Gross Earnings"
                  value={formatCurrency(previewResult.totals.totalGrossEarnings)}
                  subtitle={`${previewResult.totals.employeeCount} Active Staff`}
                  icon={<Wallet className="w-4 h-4 text-blue-600" />}
                />
                <StatCard
                  title="Total Deductions"
                  value={formatCurrency(previewResult.totals.totalDeductions)}
                  subtitle="Absences, half days, unpaid leaves"
                  icon={<Calculator className="w-4 h-4 text-rose-600" />}
                />
                <StatCard
                  title="Performance Bonuses"
                  value={formatCurrency(previewResult.totals.totalBonuses)}
                  subtitle="Earned attendance bonuses"
                  icon={<Wallet className="w-4 h-4 text-emerald-600" />}
                />
                <StatCard
                  title="Total Net Payable"
                  value={formatCurrency(previewResult.totals.totalNetPayable)}
                  subtitle="Final company liability"
                  icon={<Wallet className="w-4 h-4 text-indigo-600" />}
                />
              </div>

              {/* Preview Table */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Payroll Calculation Breakdown: Month {selectedMonth}/{selectedYear}
                  </CardTitle>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead>Worked / Absent</TableHead>
                      <TableHead>Late Days</TableHead>
                      <TableHead>Absence Deductions</TableHead>
                      <TableHead>Bonus</TableHead>
                      <TableHead>Net Payable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewResult.records.map((rec: any) => (
                      <TableRow key={rec.employee._id}>
                        <TableCell>
                          <div className="font-semibold text-slate-900">
                            {rec.employee.firstName} {rec.employee.lastName}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {rec.employee.employeeCode} • {rec.employee.department?.name || ''}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(rec.baseSalary)}</TableCell>
                        <TableCell>
                          <span className="text-emerald-700 font-medium">{rec.daysPresent} present</span>{' '}
                          / <span className="text-rose-600 font-medium">{rec.daysAbsent} absent</span>
                          {rec.halfDays > 0 && ` / ${rec.halfDays} half-day`}
                        </TableCell>
                        <TableCell>
                          {rec.lateDays > 0 ? (
                            <span className="text-amber-600 font-semibold">{rec.lateDays} days</span>
                          ) : (
                            '0'
                          )}
                        </TableCell>
                        <TableCell className="text-rose-600 font-medium">
                          -{formatCurrency(rec.totalDeductions)}
                        </TableCell>
                        <TableCell className="text-emerald-600 font-medium">
                          {rec.performanceBonus > 0 ? `+${formatCurrency(rec.performanceBonus)}` : '—'}
                        </TableCell>
                        <TableCell className="text-base font-bold text-blue-600">
                          {formatCurrency(rec.netPayable)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Detailed Itemized Payslip Modal */}
      <Modal
        isOpen={showPayslipModal}
        onClose={() => setShowPayslipModal(false)}
        title="Official Payslip"
        size="lg"
      >
        {selectedPayslip && (
          <div className="p-2 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <img src="/logo-placeholder.svg" alt="AIExpertsBD" className="w-10 h-10 rounded-lg" />
                <div>
                  <h3 className="font-bold text-lg text-slate-900 leading-tight">AIExpertsBD</h3>
                  <p className="text-xs text-slate-500">Dhaka, Bangladesh • contact@aiexpertsbd.com</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Payroll Month</p>
                <p className="text-base font-extrabold text-blue-600">
                  {selectedPayslip.payrollPeriod?.month}/{selectedPayslip.payrollPeriod?.year}
                </p>
              </div>
            </div>

            {/* Employee info */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-slate-500">Employee Name:</p>
                <p className="font-bold text-slate-900 text-sm">
                  {selectedPayslip.employee?.firstName} {selectedPayslip.employee?.lastName}
                </p>
                <p className="text-slate-500 mt-2">Employee ID:</p>
                <p className="font-mono font-semibold text-slate-800">
                  {selectedPayslip.employee?.employeeCode}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Designation:</p>
                <p className="font-semibold text-slate-900">
                  {selectedPayslip.employee?.designation || 'Staff'}
                </p>
                <p className="text-slate-500 mt-2">Department:</p>
                <p className="font-semibold text-slate-800">
                  {selectedPayslip.employee?.department?.name || 'General'}
                </p>
              </div>
            </div>

            {/* Earnings & Deductions Breakdown */}
            <div className="grid grid-cols-2 gap-6">
              {/* Earnings */}
              <div className="border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Earnings
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Base Monthly Salary</span>
                    <span className="font-semibold">{formatCurrency(selectedPayslip.baseSalary)}</span>
                  </div>
                  {selectedPayslip.performanceBonus > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Performance Bonus</span>
                      <span className="font-semibold">
                        +{formatCurrency(selectedPayslip.performanceBonus)}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900">
                    <span>Total Gross Earnings</span>
                    <span>{formatCurrency(selectedPayslip.grossEarnings)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Deductions
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-rose-600">
                    <span>Absence ({selectedPayslip.daysAbsent} days)</span>
                    <span className="font-semibold">
                      -{formatCurrency(selectedPayslip.absentDeductions)}
                    </span>
                  </div>
                  {selectedPayslip.halfDayDeductions > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Half-Day Deductions</span>
                      <span className="font-semibold">
                        -{formatCurrency(selectedPayslip.halfDayDeductions)}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-rose-600">
                    <span>Total Deductions</span>
                    <span>-{formatCurrency(selectedPayslip.totalDeductions)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Amount Highlight */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Net Amount Payable (BDT)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Direct Bank Transfer / Company Payroll Disbursement
                </p>
              </div>
              <div className="text-2xl font-black text-blue-700">
                {formatCurrency(selectedPayslip.netPayable)}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Slip
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowPayslipModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Finalize Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showFinalizeConfirm}
        onClose={() => setShowFinalizeConfirm(false)}
        onConfirm={handleFinalizePayroll}
        title="Finalize & Lock Historical Payroll?"
        message={`This will permanently freeze salary profiles, attendance records, and deductions for ${selectedMonth}/${selectedYear}. Finalized payroll is historically immutable and cannot be silently overwritten.`}
        confirmText="Finalize Payroll"
        isLoading={isFinalizing}
      />
    </MainLayout>
  );
}
