'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { formatCurrency, formatDate, formatTime } from '../lib/utils';
import api from '../lib/api';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Wallet,
  TrendingUp,
  Users,
  Building,
  Receipt,
  ArrowRight,
  Coffee,
  Shield,
  Activity,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [adminData, setAdminData] = useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      if (isAdmin) {
        const res = await api.get('/dashboard/admin');
        setAdminData(res.data.data);
      }
      // Both admin and employee can also get personal attendance
      const empRes = await api.get('/dashboard/employee');
      setEmployeeData(empRes.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchDashboard();
  }, [user, isAdmin]);

  const handleCheckIn = async () => {
    setIsActionLoading(true);
    try {
      const res = await api.post('/attendance/check-in');
      toast.success(res.data.message || 'Checked in successfully!');
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setIsActionLoading(true);
    try {
      const res = await api.post('/attendance/check-out');
      toast.success(res.data.message || 'Checked out successfully!');
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLunchOut = async () => {
    setIsActionLoading(true);
    try {
      const res = await api.post('/attendance/lunch-out');
      toast.success(res.data.message || 'Lunch started');
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lunch action failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLunchIn = async () => {
    setIsActionLoading(true);
    try {
      const res = await api.post('/attendance/lunch-in');
      toast.success(res.data.message || 'Lunch completed');
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lunch action failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const todayRecord = employeeData?.todayAttendance;
  const isCheckedIn = !!todayRecord?.actualCheckInTime;
  const isCheckedOut = !!todayRecord?.actualCheckOutTime;
  const isLunchOut = !!todayRecord?.lunchOutTime && !todayRecord?.lunchInTime;

  return (
    <MainLayout>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 text-white mb-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-blue-200 bg-blue-900/40 px-2.5 py-1 rounded-full border border-blue-400/20">
            AIExpertsBD Workforce Portal
          </span>
          <h1 className="text-2xl font-bold mt-2">
            Welcome back, {user?.employee?.firstName || user?.email?.split('@')[0]}!
          </h1>
          <p className="text-xs text-blue-100 mt-1">
            Standard Shift: 09:00 AM - 06:00 PM (10 min grace period) • Asia/Dhaka Timezone
          </p>
        </div>

        {/* Quick Check-in/out interactive controller in header */}
        <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/20 flex items-center gap-3">
          {!isCheckedIn ? (
            <Button
              variant="success"
              onClick={handleCheckIn}
              isLoading={isActionLoading}
              leftIcon={<Clock className="w-4 h-4" />}
            >
              Check In Now
            </Button>
          ) : !isCheckedOut ? (
            <div className="flex items-center gap-2">
              {!isLunchOut ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLunchOut}
                  isLoading={isActionLoading}
                  leftIcon={<Coffee className="w-3.5 h-3.5" />}
                >
                  Lunch Out
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleLunchIn}
                  isLoading={isActionLoading}
                  leftIcon={<Coffee className="w-3.5 h-3.5" />}
                >
                  Lunch In
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={handleCheckOut}
                isLoading={isActionLoading}
                leftIcon={<Clock className="w-3.5 h-3.5" />}
              >
                Check Out
              </Button>
            </div>
          ) : (
            <div className="text-xs font-semibold text-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              Day Completed ({Math.floor((todayRecord?.netWorkingMinutes || 0) / 60)}h{' '}
              {(todayRecord?.netWorkingMinutes || 0) % 60}m)
            </div>
          )}
        </div>
      </div>

      {/* Admin Headcount Overview (if Super Admin or HR Admin) */}
      {isAdmin && adminData && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" /> Company Overview (Today)
            </h2>
            <Link href="/attendance" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All Logs <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              title="Active Staff"
              value={adminData.headcount.totalEmployees}
              icon={<Users className="w-4 h-4" />}
            />
            <StatCard
              title="Present Today"
              value={adminData.headcount.presentToday}
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            />
            <StatCard
              title="Late Arrivals"
              value={adminData.headcount.lateToday}
              icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
            />
            <StatCard
              title="Absents"
              value={adminData.headcount.absentToday}
              icon={<Clock className="w-4 h-4 text-rose-600" />}
            />
            <StatCard
              title="On Leave"
              value={adminData.headcount.onLeaveToday}
              icon={<Calendar className="w-4 h-4 text-sky-600" />}
            />
            <StatCard
              title="Pending Leaves"
              value={adminData.headcount.pendingLeaveRequests}
              icon={<Calendar className="w-4 h-4 text-indigo-600" />}
            />
          </div>

          {/* Admin Finance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <StatCard
              title="Current Payroll Status"
              value={adminData.finance.payrollStatus}
              subtitle={`Total: ${formatCurrency(adminData.finance.monthlyPayrollPaisa)}`}
              icon={<Wallet className="w-4 h-4 text-emerald-600" />}
            />
            <StatCard
              title="Monthly Office Expenses"
              value={formatCurrency(adminData.finance.monthlyOfficeExpensesPaisa)}
              subtitle="Current Calendar Month"
              icon={<Receipt className="w-4 h-4 text-blue-600" />}
            />
            <StatCard
              title="YTD Total Company Expenditure"
              value={formatCurrency(adminData.finance.ytdTotalExpenditurePaisa)}
              subtitle="Payroll + Office Expenses"
              icon={<TrendingUp className="w-4 h-4 text-indigo-600" />}
            />
          </div>
        </div>
      )}

      {/* Employee Personal Attendance Stats */}
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-blue-600" /> My Monthly Attendance & Earnings
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Days Present"
            value={employeeData?.monthSummary?.daysPresent || 0}
            subtitle={`Total worked: ${employeeData?.monthSummary?.workedHoursFormatted || '0h 0m'}`}
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          />
          <StatCard
            title="Late Days"
            value={employeeData?.monthSummary?.daysLate || 0}
            subtitle={`Total late: ${employeeData?.monthSummary?.totalLateMinutes || 0} minutes`}
            icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
          />
          <StatCard
            title="Estimated Net Salary"
            value={formatCurrency(employeeData?.salary?.estimatedPayablePaisa || 0)}
            subtitle={`Base: ${formatCurrency(employeeData?.salary?.baseSalaryPaisa || 0)}`}
            icon={<Wallet className="w-4 h-4 text-blue-600" />}
          />
          <StatCard
            title="Performance Bonus"
            value={
              employeeData?.performanceBonus?.isEligible
                ? formatCurrency(employeeData.performanceBonus.bonusAmountPaisa)
                : 'Ineligible'
            }
            subtitle={
              employeeData?.performanceBonus?.isEligible
                ? 'On track for attendance bonus'
                : employeeData?.performanceBonus?.ineligibilityReasons?.[0] || 'Criteria not met'
            }
            icon={<TrendingUp className="w-4 h-4 text-indigo-600" />}
          />
        </div>
      </div>

      {/* Tables Row: Recent Attendance & Leave Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Attendance Records (2 cols) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent Attendance History</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Your last 7 recorded work sessions</p>
              </div>
              <Link href="/attendance">
                <Button variant="outline" size="sm">
                  Full Calendar
                </Button>
              </Link>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Net Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeData?.recentAttendance?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-slate-400">
                      No attendance history recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  employeeData?.recentAttendance?.map((rec: any) => (
                    <TableRow key={rec._id}>
                      <TableCell className="font-medium text-slate-900">
                        {formatDate(rec.date)}
                      </TableCell>
                      <TableCell>{formatTime(rec.actualCheckInTime)}</TableCell>
                      <TableCell>{formatTime(rec.actualCheckOutTime)}</TableCell>
                      <TableCell>
                        {rec.netWorkingMinutes > 0
                          ? `${Math.floor(rec.netWorkingMinutes / 60)}h ${rec.netWorkingMinutes % 60}m`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={rec.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Leave Balances Summary (1 col) */}
        <div>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Leave Balances</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Current year allocation</p>
              </div>
              <Link href="/leave">
                <Button variant="outline" size="sm">
                  Apply Leave
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {employeeData?.leaveBalances?.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No balances configured</p>
              ) : (
                employeeData?.leaveBalances?.map((b: any) => (
                  <div
                    key={b._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {b.leaveCategory?.name || 'Leave'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Used: {b.used}d • Pending: {b.pending}d
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold text-blue-600">{b.balance}</span>
                      <span className="text-xs text-slate-500"> / {b.allocated} days</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
