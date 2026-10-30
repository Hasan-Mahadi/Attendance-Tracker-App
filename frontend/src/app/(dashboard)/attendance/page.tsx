'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Pagination } from '../../../components/ui/Pagination';
import { formatDate, formatTime } from '../../../lib/utils';
import api from '../../../lib/api';
import { Clock, Download, Plus, Filter, AlertTriangle } from 'lucide-react';

export default function AttendancePage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'my' | 'company'>('my');
  const [records, setRecords] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedStatus, setSelectedStatus] = useState('');

  // Correction Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState<any>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctedCheckIn, setCorrectedCheckIn] = useState('');
  const [correctedCheckOut, setCorrectedCheckOut] = useState('');

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'company' && isAdmin) {
        const params: any = {
          page: currentPage,
          month: selectedMonth,
          year: selectedYear,
        };
        if (selectedStatus) params.status = selectedStatus;

        const res = await api.get('/attendance', { params });
        setRecords(res.data.data);
        setPagination(res.data.pagination);
      } else {
        const res = await api.get('/attendance/my', {
          params: { month: selectedMonth, year: selectedYear },
        });
        setRecords(res.data.data || []);
        setPagination(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch attendance');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchRecords();
  }, [user, activeTab, selectedMonth, selectedYear, selectedStatus, currentPage]);

  const handleExportCsv = async () => {
    try {
      const res = await api.get('/reports/attendance/export/csv', {
        params: { month: selectedMonth, year: selectedYear },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-${selectedYear}-${selectedMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Attendance CSV downloaded');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  const handleOpenCorrection = (rec: any) => {
    setSelectedRecordForCorrection(rec);
    setCorrectedCheckIn(rec.actualCheckInTime ? new Date(rec.actualCheckInTime).toISOString().slice(0, 16) : '');
    setCorrectedCheckOut(rec.actualCheckOutTime ? new Date(rec.actualCheckOutTime).toISOString().slice(0, 16) : '');
    setCorrectionReason('');
    setShowCorrectionModal(true);
  };

  const handleSubmitCorrection = async () => {
    if (!correctionReason.trim()) {
      toast.error('Please specify a reason for attendance correction');
      return;
    }

    try {
      await api.post('/attendance/corrections', {
        attendanceRecordId: selectedRecordForCorrection._id,
        correctedData: {
          actualCheckInTime: correctedCheckIn ? new Date(correctedCheckIn) : undefined,
          actualCheckOutTime: correctedCheckOut ? new Date(correctedCheckOut) : undefined,
        },
        reason: correctionReason,
      });
      toast.success('Correction request submitted to HR');
      setShowCorrectionModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Correction submission failed');
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#C95742]">Attendance Records</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View daily work logs, late arrivals, lunch breaks, and net working duration
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs (My Attendance vs Company Logs for Admin) */}
      {isAdmin && (
        <div className="flex border-b border-slate-200 mb-6 gap-6 text-sm font-semibold">
          <button
            onClick={() => {
              setActiveTab('my');
              setCurrentPage(1);
            }}
            className={`pb-3 transition relative ${
              activeTab === 'my'
                ? 'text-[#C95742] border-b-2 border-[#C95742]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            My Attendance
          </button>
          <button
            onClick={() => {
              setActiveTab('company');
              setCurrentPage(1);
            }}
            className={`pb-3 transition relative ${
              activeTab === 'company'
                ? 'text-[#C95742] border-b-2 border-[#C95742]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Company-wide Attendance
          </button>
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

          {activeTab === 'company' && (
            <div className="w-44">
              <Select
                label="Status Filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[
                  { label: 'All Statuses', value: '' },
                  { label: 'Present', value: 'present' },
                  { label: 'Late', value: 'late' },
                  { label: 'Absent', value: 'absent' },
                  { label: 'On Leave', value: 'on_leave' },
                  { label: 'Half Day', value: 'half_day' },
                ]}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              {activeTab === 'company' && <TableHead>Employee</TableHead>}
              <TableHead>Date</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Late (Mins)</TableHead>
              <TableHead>Lunch Break</TableHead>
              <TableHead>Net Hours</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={activeTab === 'company' ? 9 : 8}
                  className="text-center py-8 text-slate-400"
                >
                  No attendance records found for this period
                </TableCell>
              </TableRow>
            ) : (
              records.map((rec: any) => (
                <TableRow key={rec._id}>
                  {activeTab === 'company' && (
                    <TableCell>
                      <div className="font-semibold text-slate-900">
                        {rec.employee?.firstName} {rec.employee?.lastName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {rec.employee?.employeeCode} • {rec.employee?.department?.name || ''}
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="font-medium text-slate-900">{formatDate(rec.date)}</TableCell>
                  <TableCell>{formatTime(rec.actualCheckInTime)}</TableCell>
                  <TableCell>{formatTime(rec.actualCheckOutTime)}</TableCell>
                  <TableCell>
                    {rec.lateMinutes > 0 ? (
                      <span className="text-amber-600 font-semibold">{rec.lateMinutes}m</span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    {rec.lunchDurationMinutes > 0 ? `${rec.lunchDurationMinutes}m` : '—'}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800">
                    {rec.netWorkingMinutes > 0
                      ? `${Math.floor(rec.netWorkingMinutes / 60)}h ${rec.netWorkingMinutes % 60}m`
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={rec.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenCorrection(rec)}
                    >
                      Request Correction
                    </Button>
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

      {/* Attendance Correction Modal */}
      <Modal
        isOpen={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        title="Request Attendance Correction"
        description="Submit accurate timings with justification for HR approval"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Attendance Date
            </label>
            <p className="text-sm font-semibold text-slate-900">
              {formatDate(selectedRecordForCorrection?.date)}
            </p>
          </div>

          <Input
            label="Corrected Check-in Time"
            type="datetime-local"
            value={correctedCheckIn}
            onChange={(e) => setCorrectedCheckIn(e.target.value)}
          />

          <Input
            label="Corrected Check-out Time"
            type="datetime-local"
            value={correctedCheckOut}
            onChange={(e) => setCorrectedCheckOut(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason / Justification
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Card scanner malfunction, client meeting outside office, etc."
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setShowCorrectionModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmitCorrection}>
              Submit Request
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
