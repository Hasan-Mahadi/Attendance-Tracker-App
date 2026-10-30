'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { formatCurrency } from '../../../lib/utils';
import api from '../../../lib/api';
import { TrendingUp, Award, AlertTriangle, CheckCircle2, Play } from 'lucide-react';

export default function PerformancePage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [policy, setPolicy] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [myPerformance, setMyPerformance] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const fetchPerformance = async () => {
    try {
      const [polRes, myRes] = await Promise.all([
        api.get('/performance/policy'),
        api.get('/performance/my', { params: { year: selectedYear } }),
      ]);
      setPolicy(polRes.data.data);
      setMyPerformance(myRes.data.data || []);

      if (isAdmin) {
        const overRes = await api.get('/performance/overview', {
          params: { month: selectedMonth, year: selectedYear },
        });
        setOverview(overRes.data.data);
      }
    } catch {
      toast.error('Failed to load performance data');
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchPerformance();
  }, [user, isAdmin, selectedMonth, selectedYear]);

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    try {
      await api.post('/performance/evaluate', {
        month: selectedMonth,
        year: selectedYear,
      });
      toast.success('Performance evaluations computed for all staff');
      fetchPerformance();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to compute evaluations');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#C95742]">Performance & Attendance Bonus</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent attendance bonus criteria, punctuality leaderboards, and monthly scores
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleRunEvaluation}
            isLoading={isEvaluating}
            leftIcon={<Play className="w-4 h-4" />}
          >
            Compute Monthly Evaluations
          </Button>
        )}
      </div>

      {/* Bonus Policy Rules Card */}
      <div className="bg-gradient-to-r from-[#C95742] via-[#BA4D39] to-[#973F2F] text-white p-6 rounded-2xl shadow-md mb-8">
        <div className="flex items-center gap-3">
          <Award className="w-8 h-8 text-emerald-200" />
          <div>
            <h2 className="text-lg font-bold">Monthly Attendance Performance Bonus</h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              Configured reward for consistent punctuality and dedication
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/20">
            <p className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">
              Bonus Amount
            </p>
            <p className="text-xl font-black mt-1">
              {formatCurrency(policy?.bonusAmount || 200000)}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/20">
            <p className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">
              Max Allowed Late Days
            </p>
            <p className="text-xl font-black mt-1">≤ {policy?.maxLateDays ?? 2} days</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/20">
            <p className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">
              Min Attendance Rate
            </p>
            <p className="text-xl font-black mt-1">≥ {policy?.minAttendancePercentage ?? 90}%</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/20">
            <p className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">
              Unexcused Absences
            </p>
            <p className="text-xl font-black mt-1">{policy?.maxAbsentDays ?? 0} allowed</p>
          </div>
        </div>
      </div>

      {/* Admin Performance Overview */}
      {isAdmin && overview && (
        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Company-wide Bonus Eligibility: Month {selectedMonth}/{selectedYear}
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-36">
                <Select
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
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Eligible Employees"
              value={`${overview.totalEligible} / ${overview.totalEmployees}`}
              subtitle="Met punctuality & attendance goals"
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            />
            <StatCard
              title="Total Bonus Liability"
              value={formatCurrency(overview.totalBonusPaisa)}
              subtitle="To be disbursed in payroll"
              icon={<Award className="w-4 h-4 text-blue-600" />}
            />
            <StatCard
              title="Eligibility Ratio"
              value={
                overview.totalEmployees > 0
                  ? `${Math.round((overview.totalEligible / overview.totalEmployees) * 100)}%`
                  : '0%'
              }
              subtitle="Company punctuality metric"
              icon={<TrendingUp className="w-4 h-4 text-indigo-600" />}
            />
          </div>

          {/* Evaluations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Staff Performance & Eligibility Leaderboard</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Late Days</TableHead>
                  <TableHead>Late Mins</TableHead>
                  <TableHead>Absences</TableHead>
                  <TableHead>Attendance Rate</TableHead>
                  <TableHead>Bonus Status</TableHead>
                  <TableHead>Notes / Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.evaluations?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-slate-400">
                      No evaluations computed yet for this month
                    </TableCell>
                  </TableRow>
                ) : (
                  overview.evaluations.map((ev: any) => (
                    <TableRow key={ev._id}>
                      <TableCell>
                        <div className="font-semibold text-slate-900">
                          {ev.employee?.firstName} {ev.employee?.lastName}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {ev.employee?.employeeCode} • {ev.employee?.department?.name || ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${
                            ev.lateDays > (policy?.maxLateDays || 2) ? 'text-rose-600' : 'text-slate-800'
                          }`}
                        >
                          {ev.lateDays} days
                        </span>
                      </TableCell>
                      <TableCell>{ev.totalLateMinutes || 0}m</TableCell>
                      <TableCell>{ev.absentDays || 0} days</TableCell>
                      <TableCell className="font-bold text-slate-800">
                        {ev.attendancePercentage}%
                      </TableCell>
                      <TableCell>
                        {ev.isEligible ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Eligible ({formatCurrency(ev.bonusAmount)})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                            Ineligible
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                        {ev.ineligibilityReasons?.join('; ') || 'Punctuality criteria satisfied'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Employee Personal History */}
      <Card>
        <CardHeader>
          <CardTitle>My Annual Performance History ({selectedYear})</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Late Days</TableHead>
              <TableHead>Absences</TableHead>
              <TableHead>Attendance Rate</TableHead>
              <TableHead>Bonus Earned</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myPerformance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-slate-400">
                  No monthly performance scores recorded yet
                </TableCell>
              </TableRow>
            ) : (
              myPerformance.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="font-semibold text-slate-900">
                    Month {p.month}/{p.year}
                  </TableCell>
                  <TableCell>{p.lateDays} days</TableCell>
                  <TableCell>{p.absentDays} days</TableCell>
                  <TableCell className="font-bold text-slate-800">{p.attendancePercentage}%</TableCell>
                  <TableCell className="font-bold text-emerald-600">
                    {p.isEligible ? formatCurrency(p.bonusAmount) : '৳0.00'}
                  </TableCell>
                  <TableCell>
                    {p.isEligible ? (
                      <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Earned
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Criteria not met</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </MainLayout>
  );
}
