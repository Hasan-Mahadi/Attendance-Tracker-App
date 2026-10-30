'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { formatCurrency } from '../../../lib/utils';
import api from '../../../lib/api';
import {
  Building,
  Clock,
  Calendar,
  Receipt,
  Award,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Save,
  Check,
  AlertTriangle,
} from 'lucide-react';

const WEEKDAYS = [
  { day: 0, label: 'Sun', full: 'Sunday' },
  { day: 1, label: 'Mon', full: 'Monday' },
  { day: 2, label: 'Tue', full: 'Tuesday' },
  { day: 3, label: 'Wed', full: 'Wednesday' },
  { day: 4, label: 'Thu', full: 'Thursday' },
  { day: 5, label: 'Fri', full: 'Friday' },
  { day: 6, label: 'Sat', full: 'Saturday' },
];

export default function SettingsPage() {
  const { user, isSuperAdmin } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'attendance' | 'leave' | 'expenses' | 'performance' | 'company'>('attendance');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ─── Company Settings State ───────────────────────────────────────
  const [companySettings, setCompanySettings] = useState({
    companyName: 'AIExpertsBD',
    timezone: 'Asia/Dhaka',
    currency: 'BDT',
    currencySymbol: '৳',
    contactEmail: 'contact@aiexpertsbd.com',
    contactPhone: '+880 1700-000000',
    address: 'Dhaka, Bangladesh',
    website: 'https://aiexpertsbd.com',
  });

  // ─── Attendance Policy & Schedule State ───────────────────────────
  const [attendancePolicy, setAttendancePolicy] = useState<any>({
    _id: '',
    name: 'Standard Attendance Policy',
    lateGraceMinutes: 10,
    halfDayThresholdMinutes: 240,
    minimumWorkingMinutes: 480,
    earlyDepartureThresholdMinutes: 15,
    requireCheckout: true,
    allowAdminCorrection: true,
  });

  const [workSchedule, setWorkSchedule] = useState<any>({
    _id: '',
    name: 'Standard Scheduled Shift',
    startTime: '09:00',
    endTime: '18:00',
    workingDays: [0, 1, 2, 3, 4], // Sun-Thu
    lunchStartTime: '13:00',
    lunchEndTime: '14:00',
    lunchDurationMinutes: 60,
  });

  // ─── Leave Policies & Categories State ────────────────────────────
  const [leavePolicies, setLeavePolicies] = useState<any[]>([]);
  const [leaveCategories, setLeaveCategories] = useState<any[]>([]);
  const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);
  const [showEditPolicyModal, setShowEditPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);

  const [newLeaveForm, setNewLeaveForm] = useState({
    name: '',
    code: '',
    description: '',
    isPaid: true,
    annualAllocation: 10,
    monthlyAccrual: 0,
    maxCarryForward: 0,
    allowHalfDay: true,
    minNoticeDays: 0,
  });

  // ─── Expense Categories State ─────────────────────────────────────
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [showAddExpenseCatModal, setShowAddExpenseCatModal] = useState(false);
  const [showEditExpenseCatModal, setShowEditExpenseCatModal] = useState(false);
  const [editingExpenseCat, setEditingExpenseCat] = useState<any>(null);
  const [newExpenseCatForm, setNewExpenseCatForm] = useState({
    name: '',
    code: '',
    description: '',
  });

  // ─── Performance Policy State ────────────────────────────────────
  const [performancePolicy, setPerformancePolicy] = useState<any>({
    _id: '',
    name: 'Standard Attendance Bonus Policy',
    bonusAmountBDT: 2000,
    bonusAmount: 200000,
    maxLateDays: 2,
    lateGraceMinutes: 10,
    minAttendancePercentage: 90,
    maxAbsentDays: 0,
    halfDayCountsAs: 0.5,
  });

  // ─── Fetch All Settings ──────────────────────────────────────────
  const fetchAllSettings = async () => {
    setIsLoading(true);
    try {
      const [compRes, attRes, schedRes, leavePolRes, leaveCatRes, expCatRes, perfRes] =
        await Promise.all([
          api.get('/settings/company'),
          api.get('/settings/attendance-policies'),
          api.get('/settings/schedules'),
          api.get('/settings/leave-policies'),
          api.get('/settings/leave-categories'),
          api.get('/settings/expense-categories'),
          api.get('/settings/performance-policy'),
        ]);

      if (compRes.data.data) setCompanySettings(compRes.data.data);
      if (attRes.data.data?.length > 0) setAttendancePolicy(attRes.data.data[0]);
      if (schedRes.data.data?.length > 0) setWorkSchedule(schedRes.data.data[0]);
      if (leavePolRes.data.data) setLeavePolicies(leavePolRes.data.data);
      if (leaveCatRes.data.data) setLeaveCategories(leaveCatRes.data.data);
      if (expCatRes.data.data) setExpenseCategories(expCatRes.data.data);
      if (perfRes.data.data) {
        setPerformancePolicy({
          ...perfRes.data.data,
          bonusAmountBDT: Math.round((perfRes.data.data.bonusAmount || 0) / 100),
        });
      }
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchAllSettings();
  }, [user]);

  // ─── Save Handlers ───────────────────────────────────────────────

  // 1. Save Attendance & Shift Rules
  const handleSaveAttendanceRules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    setIsSaving(true);
    try {
      const promises: Promise<any>[] = [];

      if (attendancePolicy._id) {
        promises.push(
          api.put(`/settings/attendance-policies/${attendancePolicy._id}`, {
            lateGraceMinutes: Number(attendancePolicy.lateGraceMinutes),
            halfDayThresholdMinutes: Number(attendancePolicy.halfDayThresholdMinutes),
            minimumWorkingMinutes: Number(attendancePolicy.minimumWorkingMinutes),
            earlyDepartureThresholdMinutes: Number(attendancePolicy.earlyDepartureThresholdMinutes),
          })
        );
      }

      if (workSchedule._id) {
        promises.push(
          api.put(`/settings/schedules/${workSchedule._id}`, {
            startTime: workSchedule.startTime,
            endTime: workSchedule.endTime,
            workingDays: workSchedule.workingDays,
            lunchStartTime: workSchedule.lunchStartTime,
            lunchEndTime: workSchedule.lunchEndTime,
            lunchDurationMinutes: Number(workSchedule.lunchDurationMinutes || 60),
          })
        );
      }

      await Promise.all(promises);
      toast.success('Attendance and Shift rules updated successfully');
      fetchAllSettings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update attendance rules');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleWorkingDay = (dayIndex: number) => {
    if (!isSuperAdmin) return;
    const currentDays = [...(workSchedule.workingDays || [])];
    const exists = currentDays.includes(dayIndex);
    const updatedDays = exists
      ? currentDays.filter((d) => d !== dayIndex)
      : [...currentDays, dayIndex].sort();
    setWorkSchedule({ ...workSchedule, workingDays: updatedDays });
  };

  // 2. Save Performance Bonus Settings
  const handleSavePerformance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    setIsSaving(true);
    try {
      const bonusPaisa = Math.round(Number(performancePolicy.bonusAmountBDT || 0) * 100);
      await api.put(`/settings/performance-policy/${performancePolicy._id}`, {
        bonusAmount: bonusPaisa,
        maxLateDays: Number(performancePolicy.maxLateDays),
        minAttendancePercentage: Number(performancePolicy.minAttendancePercentage),
        maxAbsentDays: Number(performancePolicy.maxAbsentDays),
        halfDayCountsAs: Number(performancePolicy.halfDayCountsAs),
      });
      toast.success('Performance bonus criteria updated successfully');
      fetchAllSettings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update bonus criteria');
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Save Company Profile
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    setIsSaving(true);
    try {
      await api.put('/settings/company', companySettings);
      toast.success('Company profile updated successfully');
      fetchAllSettings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update company settings');
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Create New Leave Category + Policy
  const handleCreateLeaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    setIsSaving(true);
    try {
      await api.post('/settings/leave-categories', {
        ...newLeaveForm,
        annualAllocation: Number(newLeaveForm.annualAllocation),
        monthlyAccrual: Number(newLeaveForm.monthlyAccrual),
        maxCarryForward: Number(newLeaveForm.maxCarryForward),
      });
      toast.success('New leave type and policy created');
      setShowAddLeaveModal(false);
      setNewLeaveForm({
        name: '',
        code: '',
        description: '',
        isPaid: true,
        annualAllocation: 10,
        monthlyAccrual: 0,
        maxCarryForward: 0,
        allowHalfDay: true,
        minNoticeDays: 0,
      });
      fetchAllSettings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create leave type');
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Update Leave Policy
  const handleUpdatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin || !editingPolicy) return;
    setIsSaving(true);
    try {
      const res = await api.put(`/settings/leave-policies/${editingPolicy._id}`, {
        annualAllocation: Number(editingPolicy.annualAllocation),
        monthlyAccrual: Number(editingPolicy.monthlyAccrual),
        maxCarryForward: Number(editingPolicy.maxCarryForward),
        allowHalfDay: editingPolicy.allowHalfDay,
        minNoticeDays: Number(editingPolicy.minNoticeDays || 0),
        affectsSalary: editingPolicy.affectsSalary,
      });

      const updatedPolicy = res.data?.data;
      if (updatedPolicy) {
        setLeavePolicies((prev) =>
          prev.map((p) => (p._id === updatedPolicy._id ? updatedPolicy : p))
        );
      }

      toast.success('Leave policy updated');
      setShowEditPolicyModal(false);
      setEditingPolicy(null);
      await fetchAllSettings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update leave policy');
    } finally {
      setIsSaving(false);
    }
  };

  // 6. Delete / Deactivate Leave Category
  const handleDeleteLeaveCategory = async (catId: string, catName: string) => {
    if (!isSuperAdmin) return;
    if (!confirm(`Are you sure you want to deactivate the "${catName}" leave category?`)) return;
    try {
      await api.delete(`/settings/leave-categories/${catId}`);
      setLeavePolicies((prev) => prev.filter((p) => p.leaveCategory?._id !== catId));
      toast.success(`Leave category "${catName}" deactivated`);
      await fetchAllSettings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to deactivate leave category');
    }
  };

  // 7. Create New Expense Category
  const handleCreateExpenseCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    setIsSaving(true);
    try {
      const res = await api.post('/settings/expense-categories', {
        ...newExpenseCatForm,
        code: (newExpenseCatForm.code || newExpenseCatForm.name).toUpperCase().replace(/[^A-Z0-9]/g, '_'),
      });
      const newCat = res.data?.data;
      if (newCat) {
        setExpenseCategories((prev) => [...prev, newCat]);
      }
      toast.success('New expense category added');
      setShowAddExpenseCatModal(false);
      setNewExpenseCatForm({ name: '', code: '', description: '' });
      await fetchAllSettings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add expense category');
    } finally {
      setIsSaving(false);
    }
  };

  // 8. Update Expense Category
  const handleUpdateExpenseCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin || !editingExpenseCat) return;
    setIsSaving(true);
    try {
      const res = await api.put(`/settings/expense-categories/${editingExpenseCat._id}`, {
        name: editingExpenseCat.name,
        code: editingExpenseCat.code?.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
        description: editingExpenseCat.description,
        isActive: editingExpenseCat.isActive,
      });
      const updatedCat = res.data?.data;
      if (updatedCat) {
        setExpenseCategories((prev) =>
          prev.map((c) => (c._id === updatedCat._id ? updatedCat : c))
        );
      }
      toast.success('Expense category updated');
      setShowEditExpenseCatModal(false);
      setEditingExpenseCat(null);
      await fetchAllSettings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update category');
    } finally {
      setIsSaving(false);
    }
  };

  // 9. Deactivate Expense Category
  const handleDeleteExpenseCategory = async (catId: string, catName: string) => {
    if (!isSuperAdmin) return;
    if (!confirm(`Are you sure you want to deactivate the "${catName}" expense category?`)) return;
    try {
      await api.delete(`/settings/expense-categories/${catId}`);
      setExpenseCategories((prev) => prev.filter((c) => c._id !== catId));
      toast.success(`Category "${catName}" deactivated`);
      await fetchAllSettings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to deactivate category');
    }
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#C95742]">System & Policy Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure shift timings, attendance thresholds, customizable leave policies, expense categories, and bonus criteria
          </p>
        </div>
        {!isSuperAdmin && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Read-only view. Only Super Admins can update system policies.</span>
          </div>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'border-[#C95742] text-[#C95742]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" /> Attendance & Shift Rules
        </button>

        <button
          onClick={() => setActiveTab('leave')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'leave'
              ? 'border-[#C95742] text-[#C95742]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" /> Leave Policies & Types
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'expenses'
              ? 'border-[#C95742] text-[#C95742]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" /> Expense Categories
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'performance'
              ? 'border-[#C95742] text-[#C95742]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" /> Performance & Bonus
        </button>

        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'company'
              ? 'border-[#C95742] text-[#C95742]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4" /> Company Profile
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: ATTENDANCE & SHIFT RULES
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'attendance' && (
        <form onSubmit={handleSaveAttendanceRules} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Shift Timings & Workweek Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#C95742]" /> Standard Scheduled Shift & Workweek
                </CardTitle>
                <CardDescription>Configure scheduled office hours and official working days</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Official Workweek Selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Official Workweek Days
                  </label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {WEEKDAYS.map((w) => {
                      const isSelected = workSchedule.workingDays?.includes(w.day);
                      return (
                        <button
                          key={w.day}
                          type="button"
                          onClick={() => toggleWorkingDay(w.day)}
                          disabled={!isSuperAdmin}
                          className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-[#C95742] text-white border-[#C95742] shadow-sm shadow-[#C95742]/20'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                          } ${!isSuperAdmin ? 'cursor-not-allowed opacity-80' : ''}`}
                          title={w.full}
                        >
                          <span>{w.label}</span>
                          <span className="text-[10px] mt-0.5 opacity-80">
                            {isSelected ? 'Work' : 'Off'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Standard Workweek: Sunday – Thursday (Sun-Thu). Friday & Saturday are official weekends.
                  </p>
                </div>

                {/* Shift Hours */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <Input
                    label="Shift Start Time"
                    type="time"
                    value={workSchedule.startTime || '09:00'}
                    onChange={(e) => setWorkSchedule({ ...workSchedule, startTime: e.target.value })}
                    disabled={!isSuperAdmin}
                    helperText="Standard: 09:00 AM"
                    required
                  />
                  <Input
                    label="Shift End Time"
                    type="time"
                    value={workSchedule.endTime || '18:00'}
                    onChange={(e) => setWorkSchedule({ ...workSchedule, endTime: e.target.value })}
                    disabled={!isSuperAdmin}
                    helperText="Standard: 06:00 PM (9h gross)"
                    required
                  />
                </div>

                {/* Lunch Break Window */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Standard Lunch Break Window
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="Lunch Start"
                      type="time"
                      value={workSchedule.lunchStartTime || '13:00'}
                      onChange={(e) =>
                        setWorkSchedule({ ...workSchedule, lunchStartTime: e.target.value })
                      }
                      disabled={!isSuperAdmin}
                      helperText="Default: 01:00 PM"
                    />
                    <Input
                      label="Lunch End"
                      type="time"
                      value={workSchedule.lunchEndTime || '14:00'}
                      onChange={(e) =>
                        setWorkSchedule({ ...workSchedule, lunchEndTime: e.target.value })
                      }
                      disabled={!isSuperAdmin}
                      helperText="Default: 02:00 PM"
                    />
                    <Input
                      label="Duration (Mins)"
                      type="number"
                      value={workSchedule.lunchDurationMinutes || 60}
                      onChange={(e) =>
                        setWorkSchedule({
                          ...workSchedule,
                          lunchDurationMinutes: Number(e.target.value),
                        })
                      }
                      disabled={!isSuperAdmin}
                      helperText="Default: 60 mins"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Thresholds & Grace Periods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Attendance Thresholds & Policies
                </CardTitle>
                <CardDescription>Late arrival allowances, full-day minimums, and half-day thresholds</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Late Arrival Grace Period (Minutes)"
                  type="number"
                  min="0"
                  max="60"
                  value={attendancePolicy.lateGraceMinutes}
                  onChange={(e) =>
                    setAttendancePolicy({
                      ...attendancePolicy,
                      lateGraceMinutes: Number(e.target.value),
                    })
                  }
                  disabled={!isSuperAdmin}
                  helperText="Arrival within this buffer after shift start will NOT be flagged as Late (Default: 10 mins)"
                  required
                />

                <Input
                  label="Minimum Full-Day Working Duration (Minutes)"
                  type="number"
                  min="60"
                  step="30"
                  value={attendancePolicy.minimumWorkingMinutes}
                  onChange={(e) =>
                    setAttendancePolicy({
                      ...attendancePolicy,
                      minimumWorkingMinutes: Number(e.target.value),
                    })
                  }
                  disabled={!isSuperAdmin}
                  helperText={`Current: ${attendancePolicy.minimumWorkingMinutes / 60} Hours (${attendancePolicy.minimumWorkingMinutes} mins). Must work this duration to count as Full Day.`}
                  required
                />

                <Input
                  label="Half-Day Working Threshold (Minutes)"
                  type="number"
                  min="60"
                  step="30"
                  value={attendancePolicy.halfDayThresholdMinutes}
                  onChange={(e) =>
                    setAttendancePolicy({
                      ...attendancePolicy,
                      halfDayThresholdMinutes: Number(e.target.value),
                    })
                  }
                  disabled={!isSuperAdmin}
                  helperText={`Current: ${attendancePolicy.halfDayThresholdMinutes / 60} Hours (${attendancePolicy.halfDayThresholdMinutes} mins). Net hours below this qualify as Half-Day or Absent.`}
                  required
                />

                <Input
                  label="Early Departure Threshold (Minutes)"
                  type="number"
                  min="0"
                  value={attendancePolicy.earlyDepartureThresholdMinutes}
                  onChange={(e) =>
                    setAttendancePolicy({
                      ...attendancePolicy,
                      earlyDepartureThresholdMinutes: Number(e.target.value),
                    })
                  }
                  disabled={!isSuperAdmin}
                  helperText="Departures before shift end beyond this buffer are marked as Early Departure (Default: 15 mins)"
                  required
                />

                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-800 flex items-start gap-2 mt-4">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    All calculations strictly observe Asia/Dhaka time boundaries (UTC+6) and automatic lunch deduction.
                  </span>
                </div>
              </CardContent>
              {isSuperAdmin && (
                <CardFooter>
                  <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                    Save Attendance & Shift Rules
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: LEAVE POLICIES & CATEGORIES
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'leave' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Customizable Leave Policies & Quotas</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage leave types, annual quotas, accrual rules, carry-forward limits, and paid/unpaid conditions
              </p>
            </div>
            {isSuperAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddLeaveModal(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add New Leave Type
              </Button>
            )}
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Annual Allocation</TableHead>
                  <TableHead>Monthly Accrual</TableHead>
                  <TableHead>Max Carry Forward</TableHead>
                  <TableHead>Half-Day Allowed</TableHead>
                  <TableHead>Status</TableHead>
                  {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {leavePolicies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                      No leave policies configured
                    </TableCell>
                  </TableRow>
                ) : (
                  leavePolicies.map((pol) => {
                    const cat = pol.leaveCategory || {};
                    return (
                      <TableRow key={pol._id}>
                        <TableCell>
                          <div className="font-semibold text-slate-900">{cat.name || pol.name}</div>
                          {cat.description && (
                            <div className="text-xs text-slate-500 max-w-xs truncate">{cat.description}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {cat.code || '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={cat.isPaid ? 'success' : 'warning'}>
                            {cat.isPaid ? 'Paid Leave' : 'Unpaid Leave'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-slate-900">
                          {pol.annualAllocation} days/yr
                        </TableCell>
                        <TableCell>{pol.monthlyAccrual ? `${pol.monthlyAccrual} days` : 'None'}</TableCell>
                        <TableCell>
                          {pol.maxCarryForward ? `${pol.maxCarryForward} days` : '0 (Expires)'}
                        </TableCell>
                        <TableCell>
                          {pol.allowHalfDay ? (
                            <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Allowed
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">Full-Day Only</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={pol.isActive ? 'primary' : 'default'}>
                            {pol.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingPolicy(pol);
                                  setShowEditPolicyModal(true);
                                }}
                                leftIcon={<Edit2 className="w-3 h-3" />}
                              >
                                Edit
                              </Button>
                              {cat._id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteLeaveCategory(cat._id, cat.name)}
                                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: EXPENSE CATEGORIES
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Custom Office Expense Categories</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize operational expense categories used for recording bills, office supplies, and invoices
              </p>
            </div>
            {isSuperAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddExpenseCatModal(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Category
              </Button>
            )}
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Code Identifier</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                      No expense categories found
                    </TableCell>
                  </TableRow>
                ) : (
                  expenseCategories.map((cat) => (
                    <TableRow key={cat._id}>
                      <TableCell className="font-semibold text-slate-900">{cat.name}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {cat.code}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs">
                        {cat.description || 'General office operational cost'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cat.isActive ? 'success' : 'default'}>
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      {isSuperAdmin && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingExpenseCat(cat);
                                setShowEditExpenseCatModal(true);
                              }}
                              leftIcon={<Edit2 className="w-3 h-3" />}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExpenseCategory(cat._id, cat.name)}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: PERFORMANCE & BONUS SETTINGS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'performance' && (
        <form onSubmit={handleSavePerformance} className="space-y-6">
          {/* Live Preview Card */}
          <div className="bg-gradient-to-r from-[#C95742] via-[#B84E3A] to-[#973F2F] text-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-white/90" />
              <div>
                <h2 className="text-lg font-bold">Monthly Attendance Performance Bonus</h2>
                <p className="text-xs text-white/80 mt-0.5">
                  Configured reward for consistent punctuality and dedication
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/20">
                <p className="text-[10px] uppercase font-bold text-white/80 tracking-wider">
                  Bonus Amount
                </p>
                <p className="text-xl font-black mt-1">
                  ৳{Number(performancePolicy.bonusAmountBDT || 2000).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/20">
                <p className="text-[10px] uppercase font-bold text-white/80 tracking-wider">
                  Max Allowed Late Days
                </p>
                <p className="text-xl font-black mt-1">≤ {performancePolicy.maxLateDays ?? 2} days</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/20">
                <p className="text-[10px] uppercase font-bold text-white/80 tracking-wider">
                  Min Attendance Rate
                </p>
                <p className="text-xl font-black mt-1">≥ {performancePolicy.minAttendancePercentage ?? 90}%</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/20">
                <p className="text-[10px] uppercase font-bold text-white/80 tracking-wider">
                  Unexcused Absences
                </p>
                <p className="text-xl font-black mt-1">{performancePolicy.maxAbsentDays ?? 0} allowed</p>
              </div>
            </div>
          </div>

          {/* Form to Customize */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" /> Configure Bonus Criteria & Amounts
              </CardTitle>
              <CardDescription>
                Define thresholds and monthly reward payouts. Staff meeting all criteria will automatically receive this bonus.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Bonus Amount (BDT ৳)"
                  type="number"
                  min="0"
                  step="100"
                  value={performancePolicy.bonusAmountBDT}
                  onChange={(e) =>
                    setPerformancePolicy({
                      ...performancePolicy,
                      bonusAmountBDT: Number(e.target.value),
                    })
                  }
                  disabled={!isSuperAdmin}
                  helperText="Configured reward amount paid via monthly payroll (Default: ৳2,000.00)"
                  required
                />

                <Input
                  label="Max Allowed Late Days (Per Month)"
                  type="number"
                  min="0"
                  max="31"
                  value={performancePolicy.maxLateDays}
                  onChange={(e) =>
                    setPerformancePolicy({
                      ...performancePolicy,
                      maxLateDays: Number(e.target.value),
                    })
                  }
                  disabled={!isSuperAdmin}
                  helperText="Maximum number of late arrivals tolerated before disqualification (Default: ≤ 2 days)"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Minimum Attendance Rate (%)"
                  type="number"
                  min="50"
                  max="100"
                  value={performancePolicy.minAttendancePercentage}
                  onChange={(e) =>
                    setPerformancePolicy({
                      ...performancePolicy,
                      minAttendancePercentage: Number(e.target.value),
                    })
                  }
                  disabled={!isSuperAdmin}
                  helperText="Required monthly attendance percentage (Default: ≥ 90%)"
                  required
                />

                <Input
                  label="Max Unexcused Absent Days"
                  type="number"
                  min="0"
                  max="10"
                  value={performancePolicy.maxAbsentDays}
                  onChange={(e) =>
                    setPerformancePolicy({
                      ...performancePolicy,
                      maxAbsentDays: Number(e.target.value),
                    })
                  }
                  disabled={!isSuperAdmin}
                  helperText="Maximum allowed unexcused absent days (Default: 0)"
                  required
                />

                <Input
                  label="Half-Day Penalty Weight"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={performancePolicy.halfDayCountsAs}
                  onChange={(e) =>
                    setPerformancePolicy({
                      ...performancePolicy,
                      halfDayCountsAs: Number(e.target.value),
                    })
                  }
                  disabled={!isSuperAdmin}
                  helperText="Weight factor for half-day working (Default: 0.5)"
                  required
                />
              </div>
            </CardContent>
            {isSuperAdmin && (
              <CardFooter>
                <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                  Save Performance Bonus Settings
                </Button>
              </CardFooter>
            )}
          </Card>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: COMPANY PROFILE
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompany}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" /> Company Profile & Legal Identity
              </CardTitle>
              <CardDescription>
                Company registration details, operating timezone, and base currency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Company Name"
                value={companySettings.companyName}
                onChange={(e) =>
                  setCompanySettings({ ...companySettings, companyName: e.target.value })
                }
                disabled={!isSuperAdmin}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Official Contact Email"
                  type="email"
                  value={companySettings.contactEmail}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, contactEmail: e.target.value })
                  }
                  disabled={!isSuperAdmin}
                />
                <Input
                  label="Contact Phone"
                  value={companySettings.contactPhone}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, contactPhone: e.target.value })
                  }
                  disabled={!isSuperAdmin}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Operating Timezone"
                  value={companySettings.timezone}
                  disabled
                  helperText="Fixed system timezone: Asia/Dhaka (UTC+6)"
                />
                <Input
                  label="Company Currency"
                  value={`${companySettings.currency} (${companySettings.currencySymbol})`}
                  disabled
                  helperText="Fixed system currency: Bangladeshi Taka (৳)"
                />
              </div>

              <Input
                label="Registered Office Address"
                value={companySettings.address}
                onChange={(e) =>
                  setCompanySettings({ ...companySettings, address: e.target.value })
                }
                disabled={!isSuperAdmin}
              />

              <Input
                label="Company Website"
                value={companySettings.website || ''}
                onChange={(e) =>
                  setCompanySettings({ ...companySettings, website: e.target.value })
                }
                disabled={!isSuperAdmin}
              />
            </CardContent>
            {isSuperAdmin && (
              <CardFooter>
                <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                  Save Company Profile
                </Button>
              </CardFooter>
            )}
          </Card>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODALS
      ───────────────────────────────────────────────────────────── */}

      {/* 1. Add New Leave Type Modal */}
      <Modal
        isOpen={showAddLeaveModal}
        onClose={() => setShowAddLeaveModal(false)}
        title="Create New Leave Type & Policy"
        description="Add a customizable leave category with annual quotas and carry-forward rules"
      >
        <form onSubmit={handleCreateLeaveType} className="space-y-4">
          <Input
            label="Leave Type Name"
            placeholder="e.g. Parental Leave, Study Leave"
            value={newLeaveForm.name}
            onChange={(e) => setNewLeaveForm({ ...newLeaveForm, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Short Code"
              placeholder="e.g. PL, SL"
              value={newLeaveForm.code}
              onChange={(e) => setNewLeaveForm({ ...newLeaveForm, code: e.target.value.toUpperCase() })}
              required
            />
            <Select
              label="Compensation Type"
              value={newLeaveForm.isPaid ? 'true' : 'false'}
              onChange={(e) =>
                setNewLeaveForm({ ...newLeaveForm, isPaid: e.target.value === 'true' })
              }
              options={[
                { label: 'Paid Leave', value: 'true' },
                { label: 'Unpaid Leave (Affects Salary)', value: 'false' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Annual Allocation (Days)"
              type="number"
              min="0"
              value={newLeaveForm.annualAllocation}
              onChange={(e) =>
                setNewLeaveForm({ ...newLeaveForm, annualAllocation: Number(e.target.value) })
              }
              required
            />
            <Input
              label="Max Carry Forward (Days)"
              type="number"
              min="0"
              value={newLeaveForm.maxCarryForward}
              onChange={(e) =>
                setNewLeaveForm({ ...newLeaveForm, maxCarryForward: Number(e.target.value) })
              }
              helperText="Days carried to next year (0 = expires)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Allow Half-Day Requests"
              value={newLeaveForm.allowHalfDay ? 'true' : 'false'}
              onChange={(e) =>
                setNewLeaveForm({ ...newLeaveForm, allowHalfDay: e.target.value === 'true' })
              }
              options={[
                { label: 'Yes, Allow Half-Day', value: 'true' },
                { label: 'No, Full-Day Only', value: 'false' },
              ]}
            />
            <Input
              label="Minimum Notice (Days)"
              type="number"
              min="0"
              value={newLeaveForm.minNoticeDays}
              onChange={(e) =>
                setNewLeaveForm({ ...newLeaveForm, minNoticeDays: Number(e.target.value) })
              }
              helperText="Days advance notice required"
            />
          </div>

          <Input
            label="Description / Guidelines"
            placeholder="Optional purpose and eligibility notes"
            value={newLeaveForm.description}
            onChange={(e) => setNewLeaveForm({ ...newLeaveForm, description: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setShowAddLeaveModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              Create Leave Policy
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Edit Leave Policy Modal */}
      <Modal
        isOpen={showEditPolicyModal}
        onClose={() => setShowEditPolicyModal(false)}
        title={`Edit Policy: ${editingPolicy?.leaveCategory?.name || editingPolicy?.name || ''}`}
        description="Adjust quotas, accrual, and carry-forward allocations"
      >
        {editingPolicy && (
          <form onSubmit={handleUpdatePolicy} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Annual Allocation (Days)"
                type="number"
                min="0"
                value={editingPolicy.annualAllocation}
                onChange={(e) =>
                  setEditingPolicy({ ...editingPolicy, annualAllocation: Number(e.target.value) })
                }
                required
              />
              <Input
                label="Max Carry Forward (Days)"
                type="number"
                min="0"
                value={editingPolicy.maxCarryForward || 0}
                onChange={(e) =>
                  setEditingPolicy({ ...editingPolicy, maxCarryForward: Number(e.target.value) })
                }
                helperText="0 = expires annually"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Allow Half-Day Requests"
                value={editingPolicy.allowHalfDay ? 'true' : 'false'}
                onChange={(e) =>
                  setEditingPolicy({ ...editingPolicy, allowHalfDay: e.target.value === 'true' })
                }
                options={[
                  { label: 'Yes, Allow Half-Day', value: 'true' },
                  { label: 'No, Full-Day Only', value: 'false' },
                ]}
              />
              <Input
                label="Minimum Notice (Days)"
                type="number"
                min="0"
                value={editingPolicy.minNoticeDays || 0}
                onChange={(e) =>
                  setEditingPolicy({ ...editingPolicy, minNoticeDays: Number(e.target.value) })
                }
              />
            </div>

            <Select
              label="Salary Impact"
              value={editingPolicy.affectsSalary ? 'true' : 'false'}
              onChange={(e) =>
                setEditingPolicy({ ...editingPolicy, affectsSalary: e.target.value === 'true' })
              }
              options={[
                { label: 'Paid Leave (No salary deduction)', value: 'false' },
                { label: 'Unpaid Leave (Deducts daily rate from payroll)', value: 'true' },
              ]}
            />

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="outline" onClick={() => setShowEditPolicyModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* 3. Add Expense Category Modal */}
      <Modal
        isOpen={showAddExpenseCatModal}
        onClose={() => setShowAddExpenseCatModal(false)}
        title="Add Expense Category"
        description="Create a new category for tagging office operational expenses"
      >
        <form onSubmit={handleCreateExpenseCategory} className="space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g. Refreshments, Legal & Compliance"
            value={newExpenseCatForm.name}
            onChange={(e) => setNewExpenseCatForm({ ...newExpenseCatForm, name: e.target.value })}
            required
          />

          <Input
            label="Category Code (Uppercase)"
            placeholder="e.g. REFRESHMENTS, LEGAL"
            value={newExpenseCatForm.code}
            onChange={(e) =>
              setNewExpenseCatForm({
                ...newExpenseCatForm,
                code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
              })
            }
            helperText="Auto-generated if left blank"
          />

          <Input
            label="Description"
            placeholder="Brief purpose of this expense type"
            value={newExpenseCatForm.description}
            onChange={(e) =>
              setNewExpenseCatForm({ ...newExpenseCatForm, description: e.target.value })
            }
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setShowAddExpenseCatModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              Add Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Edit Expense Category Modal */}
      <Modal
        isOpen={showEditExpenseCatModal}
        onClose={() => setShowEditExpenseCatModal(false)}
        title={`Edit Category: ${editingExpenseCat?.name || ''}`}
        description="Update category name, code, or active status"
      >
        {editingExpenseCat && (
          <form onSubmit={handleUpdateExpenseCategory} className="space-y-4">
            <Input
              label="Category Name"
              value={editingExpenseCat.name}
              onChange={(e) =>
                setEditingExpenseCat({ ...editingExpenseCat, name: e.target.value })
              }
              required
            />

            <Input
              label="Code"
              value={editingExpenseCat.code}
              onChange={(e) =>
                setEditingExpenseCat({
                  ...editingExpenseCat,
                  code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
                })
              }
              required
            />

            <Input
              label="Description"
              value={editingExpenseCat.description || ''}
              onChange={(e) =>
                setEditingExpenseCat({ ...editingExpenseCat, description: e.target.value })
              }
            />

            <Select
              label="Status"
              value={editingExpenseCat.isActive ? 'true' : 'false'}
              onChange={(e) =>
                setEditingExpenseCat({ ...editingExpenseCat, isActive: e.target.value === 'true' })
              }
              options={[
                { label: 'Active', value: 'true' },
                { label: 'Inactive', value: 'false' },
              ]}
            />

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="outline" onClick={() => setShowEditExpenseCatModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </MainLayout>
  );
}
