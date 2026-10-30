'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import api from '../../../lib/api';
import { BarChart3, Download, TrendingUp } from 'lucide-react';

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function ReportsPage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [yearlyData, setYearlyData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const [mRes, yRes] = await Promise.all([
        api.get('/reports/attendance/monthly', {
          params: { month: selectedMonth, year: selectedYear },
        }),
        api.get('/reports/attendance/yearly', {
          params: { year: selectedYear },
        }),
      ]);
      setMonthlyData(mRes.data.data || []);
      setYearlyData(yRes.data.data || []);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchReports();
  }, [user, selectedMonth, selectedYear]);

  const handleExportCsv = async () => {
    try {
      const res = await api.get('/reports/attendance/export/csv', {
        params: { month: selectedMonth, year: selectedYear },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-report-${selectedYear}-${selectedMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report exported to CSV');
    } catch {
      toast.error('Export failed');
    }
  };

  // Prepare chart data for yearly trends
  const chartData = yearlyData.map((y) => ({
    name: monthNames[y.month - 1],
    present: y.totalPresent,
    late: y.totalLate,
    absent: y.totalAbsent,
    leave: y.totalLeave,
  }));

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Statistics & Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Attendance completion percentages, monthly working hours, and annual workforce trends
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Monthly CSV
          </Button>
        )}
      </div>

      {/* Filter bar */}
      <Card className="mb-6">
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <div className="w-40">
            <Select
              label="Select Month"
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
              label="Select Year"
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

      {/* Yearly Trend Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Annual Attendance & Absence Trends ({selectedYear})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '0.75rem',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="present" fill="#2563EB" name="Days Present" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" fill="#F59E0B" name="Late Arrivals" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" fill="#EF4444" name="Absences" radius={[4, 4, 0, 0]} />
                <Bar dataKey="leave" fill="#0EA5E9" name="Approved Leaves" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Monthly Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Detailed Employee Attendance Summary: Month {selectedMonth}/{selectedYear}
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Present</TableHead>
              <TableHead>Late Days (Mins)</TableHead>
              <TableHead>Absences</TableHead>
              <TableHead>Leaves</TableHead>
              <TableHead>Net Hours</TableHead>
              <TableHead>Completion Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthlyData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                  No attendance records found for this month
                </TableCell>
              </TableRow>
            ) : (
              monthlyData.map((r) => (
                <TableRow key={r.employee.id}>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{r.employee.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{r.employee.employeeCode}</div>
                  </TableCell>
                  <TableCell>{r.employee.department || '—'}</TableCell>
                  <TableCell className="font-semibold text-emerald-700">{r.presentDays} days</TableCell>
                  <TableCell>
                    {r.lateDays > 0 ? (
                      <span className="text-amber-600 font-medium">
                        {r.lateDays}d ({r.totalLateMinutes}m)
                      </span>
                    ) : (
                      '0'
                    )}
                  </TableCell>
                  <TableCell>
                    {r.absentDays > 0 ? (
                      <span className="text-rose-600 font-medium">{r.absentDays} days</span>
                    ) : (
                      '0'
                    )}
                  </TableCell>
                  <TableCell>{r.leaveDays} days</TableCell>
                  <TableCell className="font-semibold text-slate-800">
                    {r.workingHoursFormatted}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, r.completionRate)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-800">{r.completionRate}%</span>
                    </div>
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
