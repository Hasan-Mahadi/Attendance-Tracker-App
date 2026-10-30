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
import { formatDate } from '../../../lib/utils';
import api from '../../../lib/api';
import { Calendar, Plus, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function LeavePage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [categories, setCategories] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'admin'>('my');

  // Submit Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review Modal (Admin)
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRequestToReview, setSelectedRequestToReview] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');
  const [reviewNotes, setReviewNotes] = useState('');

  const fetchLeaveData = async () => {
    try {
      const [catRes, balRes, myReqRes] = await Promise.all([
        api.get('/leave/categories'),
        api.get('/leave/balances/my'),
        api.get('/leave/requests/my'),
      ]);
      setCategories(catRes.data.data || []);
      setBalances(balRes.data.data || []);
      setMyRequests(myReqRes.data.data || []);

      if (catRes.data.data?.length > 0) {
        setSelectedCategory(catRes.data.data[0]._id);
      }

      if (isAdmin) {
        const adminReqRes = await api.get('/leave/requests');
        setAllRequests(adminReqRes.data.data || []);
      }
    } catch {
      toast.error('Failed to load leave records');
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchLeaveData();
  }, [user, isAdmin]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !leaveReason.trim()) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/leave/requests', {
        leaveCategoryId: selectedCategory,
        startDate,
        endDate,
        isHalfDay,
        reason: leaveReason,
      });
      toast.success('Leave request submitted successfully');
      setShowApplyModal(false);
      setLeaveReason('');
      fetchLeaveData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) return;
    try {
      await api.post(`/leave/requests/${id}/cancel`, { reason: 'User requested cancellation' });
      toast.success('Leave request cancelled');
      fetchLeaveData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    }
  };

  const handleReviewRequest = async () => {
    try {
      await api.patch(`/leave/requests/${selectedRequestToReview._id}/review`, {
        action: reviewAction,
        reviewNotes,
      });
      toast.success(`Leave request ${reviewAction}`);
      setShowReviewModal(false);
      fetchLeaveData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#C95742]">Leave Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit time-off requests, track balances, and review approvals
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowApplyModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Request Leave
        </Button>
      </div>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {balances.map((b) => (
          <Card key={b._id} className="p-4 hover:border-[#C95742]/40 transition-all">
            <p className="text-xs font-semibold text-slate-500 truncate">
              {b.leaveCategory?.name || 'Leave'}
            </p>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl font-bold text-[#C95742]">{b.balance}</span>
              <span className="text-xs text-slate-400">/ {b.allocated} days</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
              Used: {b.used}d • Pending: {b.pending}d
            </p>
          </Card>
        ))}
      </div>

      {/* Tab Switcher if Admin */}
      {isAdmin && (
        <div className="flex border-b border-slate-200 mb-6 gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('my')}
            className={`pb-3 transition relative ${
              activeTab === 'my'
                ? 'text-[#C95742] border-b-2 border-[#C95742]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            My Leave Requests
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`pb-3 transition relative ${
              activeTab === 'admin'
                ? 'text-[#C95742] border-b-2 border-[#C95742]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Leave Approvals Queue
          </button>
        </div>
      )}

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'admin' ? 'Company Leave Approval Queue' : 'My Leave Request History'}
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              {activeTab === 'admin' && <TableHead>Employee</TableHead>}
              <TableHead>Category</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(activeTab === 'admin' ? allRequests : myRequests).length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={activeTab === 'admin' ? 8 : 7}
                  className="text-center py-8 text-slate-400"
                >
                  No leave requests found
                </TableCell>
              </TableRow>
            ) : (
              (activeTab === 'admin' ? allRequests : myRequests).map((req) => (
                <TableRow key={req._id}>
                  {activeTab === 'admin' && (
                    <TableCell>
                      <div className="font-semibold text-slate-900">
                        {req.employee?.firstName} {req.employee?.lastName}
                      </div>
                      <div className="text-xs text-slate-500">{req.employee?.employeeCode}</div>
                    </TableCell>
                  )}
                  <TableCell className="font-semibold text-slate-800">
                    {req.leaveCategory?.name || 'Leave'}
                  </TableCell>
                  <TableCell>{formatDate(req.startDate)}</TableCell>
                  <TableCell>{formatDate(req.endDate)}</TableCell>
                  <TableCell className="font-bold text-blue-600">{req.totalDays} day(s)</TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-slate-600">
                    {req.reason}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={req.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {activeTab === 'admin' && req.status === 'pending' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequestToReview(req);
                          setReviewNotes('');
                          setShowReviewModal(true);
                        }}
                      >
                        Review
                      </Button>
                    ) : activeTab === 'my' && (req.status === 'pending' || req.status === 'approved') ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelRequest(req._id)}
                        className="text-rose-600 hover:text-rose-700"
                      >
                        Cancel
                      </Button>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Submit Leave Request"
        description="Select category, dates, and provide justification"
      >
        <form onSubmit={handleApplyLeave} className="space-y-4">
          <Select
            label="Leave Category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={categories.map((c) => ({
              label: `${c.name} (${c.isPaid ? 'Paid' : 'Unpaid'})`,
              value: c._id,
            }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="halfDayCheckbox"
              checked={isHalfDay}
              onChange={(e) => setIsHalfDay(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <label htmlFor="halfDayCheckbox" className="text-xs font-medium text-slate-700">
              This is a Half-Day Leave (0.5 day deduction)
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason for Absence
            </label>
            <textarea
              rows={3}
              required
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Please provide details for HR records..."
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowApplyModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Admin Review Leave Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Review Employee Leave Request"
        description="Record decision and optional notes"
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
            <p>
              <strong className="text-slate-700">Employee:</strong>{' '}
              {selectedRequestToReview?.employee?.firstName}{' '}
              {selectedRequestToReview?.employee?.lastName} (
              {selectedRequestToReview?.employee?.employeeCode})
            </p>
            <p>
              <strong className="text-slate-700">Category:</strong>{' '}
              {selectedRequestToReview?.leaveCategory?.name}
            </p>
            <p>
              <strong className="text-slate-700">Dates:</strong>{' '}
              {formatDate(selectedRequestToReview?.startDate)} to{' '}
              {formatDate(selectedRequestToReview?.endDate)} ({selectedRequestToReview?.totalDays}{' '}
              days)
            </p>
            <p>
              <strong className="text-slate-700">Reason:</strong>{' '}
              {selectedRequestToReview?.reason}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-800">
              <input
                type="radio"
                name="reviewAction"
                checked={reviewAction === 'approved'}
                onChange={() => setReviewAction('approved')}
                className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              Approve Request
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-800">
              <input
                type="radio"
                name="reviewAction"
                checked={reviewAction === 'rejected'}
                onChange={() => setReviewAction('rejected')}
                className="text-rose-600 focus:ring-rose-500 h-4 w-4"
              />
              Reject Request
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Review Notes (Optional)
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Approved. Have a good break."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setShowReviewModal(false)}>
              Cancel
            </Button>
            <Button
              variant={reviewAction === 'approved' ? 'success' : 'danger'}
              size="sm"
              onClick={handleReviewRequest}
            >
              {reviewAction === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
