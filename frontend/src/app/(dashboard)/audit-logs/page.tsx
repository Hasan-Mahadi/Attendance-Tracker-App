'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Pagination } from '../../../components/ui/Pagination';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { formatDate } from '../../../lib/utils';
import api from '../../../lib/api';
import {
  Shield,
  Eye,
  ArrowRight,
  User,
  Clock,
  Laptop,
  CheckCircle2,
  FileText,
  Activity,
  History,
  Layers,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AuditLogItem {
  _id: string;
  userId?: {
    _id: string;
    email: string;
    role: string;
    employeeId?: {
      firstName: string;
      lastName: string;
      employeeCode: string;
      designation?: string;
    };
  };
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  previousData?: Record<string, any>;
  newData?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const { user, isSuperAdmin, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !isSuperAdmin) {
      router.push('/unauthorized');
    }
  }, [isSuperAdmin, isAuthLoading, router]);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/audit-logs', { params: { page: currentPage, limit: 15 } });
      setLogs(res.data.data || []);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAuditLogs();
    }
  }, [currentPage, isSuperAdmin]);

  if (!isSuperAdmin) return null;

  // Helper to extract actor's full name / username
  const getActorName = (log: AuditLogItem): string => {
    const emp = log.userId?.employeeId;
    if (emp?.firstName || emp?.lastName) {
      return `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
    }
    if (log.userId?.email) {
      return log.userId.email.split('@')[0];
    }
    if (log.userEmail) {
      return log.userEmail.split('@')[0];
    }
    return 'System Core';
  };

  // Helper to extract employee code or identifier
  const getActorCode = (log: AuditLogItem): string => {
    return log.userId?.employeeId?.employeeCode || (log.userId?.role ? log.userId.role.toUpperCase() : 'SYS');
  };

  // Helper for human-friendly action badge colors
  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('REGISTER')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('UPDATE') || action.includes('CORRECTION') || action.includes('EDIT')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (action.includes('DELETE') || action.includes('REMOVE') || action.includes('LOCK')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('FINALIZE') || action.includes('APPROVE')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  // Inline smart change summary
  const getInlineSummary = (log: AuditLogItem) => {
    const prev = log.previousData;
    const curr = log.newData;

    if (log.action.includes('SALARY')) {
      const prevSalary = prev?.baseSalary !== undefined ? `৳${Number(prev.baseSalary).toLocaleString()}` : null;
      const newSalary = curr?.baseSalary !== undefined ? `৳${Number(curr.baseSalary).toLocaleString()}` : null;
      if (prevSalary && newSalary) {
        return (
          <span className="flex items-center gap-1.5 text-xs">
            <span className="line-through text-slate-400">{prevSalary}</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span className="font-semibold text-emerald-600">{newSalary}</span>
          </span>
        );
      }
      if (newSalary) {
        return <span className="font-semibold text-emerald-600">Base: {newSalary}</span>;
      }
    }

    if (curr?.status) {
      return (
        <span className="text-xs">
          Status: <span className="font-semibold text-slate-700">{curr.status}</span>
        </span>
      );
    }

    if (curr?.employeeCode) {
      return (
        <span className="text-xs text-slate-600">
          Target: <span className="font-mono font-medium">{curr.employeeCode}</span>
        </span>
      );
    }

    if (curr && Object.keys(curr).length > 0) {
      const keys = Object.keys(curr).filter((k) => !['_id', '__v', 'updatedAt'].includes(k));
      return (
        <span className="text-xs text-slate-500">
          Updated: {keys.slice(0, 3).join(', ')} {keys.length > 3 ? '...' : ''}
        </span>
      );
    }

    return <span className="text-xs text-slate-400">Activity record</span>;
  };

  // Helper to render JSON objects cleanly as key-value cards
  const renderDataView = (data?: Record<string, any>, isPrevious = false) => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center text-xs text-slate-400">
          {isPrevious ? 'No previous record (Initial Creation)' : 'No modified fields recorded'}
        </div>
      );
    }

    const filteredKeys = Object.keys(data).filter((k) => !['_id', '__v'].includes(k));

    return (
      <div className="space-y-2">
        {filteredKeys.map((key) => {
          const val = data[key];
          let displayVal = '';
          if (val === null || val === undefined) {
            displayVal = '—';
          } else if (typeof val === 'object') {
            displayVal = JSON.stringify(val);
          } else {
            displayVal = String(val);
          }

          return (
            <div
              key={key}
              className={`flex items-start justify-between p-2.5 rounded-lg border text-xs font-mono transition-colors ${
                isPrevious
                  ? 'bg-rose-50/60 border-rose-100 text-rose-950'
                  : 'bg-emerald-50/60 border-emerald-100 text-emerald-950'
              }`}
            >
              <span className="font-semibold text-slate-600 font-sans mr-2 shrink-0">{key}:</span>
              <span className="break-all text-right font-medium">{displayVal}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <MainLayout>
      {/* Page Title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" /> System Security & Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic ledger tracking all administrative actions, employee modifications, salary updates, and payroll locks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchAuditLogs()} isLoading={isLoading}>
            Refresh Ledger
          </Button>
        </div>
      </div>

      {/* Audit Logs Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4 text-slate-500" />
              Administrative Activity Trail
            </CardTitle>
            <span className="text-xs text-slate-400 font-mono">
              Total Recorded Events: {pagination?.totalItems || logs.length}
            </span>
          </div>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Changed By (User)</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Summary / Changes</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                  <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  No audit logs recorded yet
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const actorName = getActorName(log);
                const actorCode = getActorCode(log);
                const actorEmail = log.userId?.email || log.userEmail || '—';

                return (
                  <TableRow key={log._id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Timestamp */}
                    <TableCell className="font-mono text-xs text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(log.createdAt, 'MMM dd, yyyy hh:mm:ss a')}
                      </div>
                    </TableCell>

                    {/* Actor (Who Made The Change) */}
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 text-sm">{actorName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {actorCode}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">{actorEmail}</span>
                      </div>
                    </TableCell>

                    {/* Action */}
                    <TableCell>
                      <span
                        className={`font-mono text-xs font-semibold px-2 py-0.5 rounded border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </TableCell>

                    {/* Resource */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800 text-xs">{log.resource}</span>
                        {log.resourceId && (
                          <span className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                            ID: {log.resourceId}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Inline Changes Summary */}
                    <TableCell className="max-w-xs">{getInlineSummary(log)}</TableCell>

                    {/* View Details Button */}
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedLog(log);
                          setIsDetailModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Diff
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
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

      {/* Comparison & Details Modal */}
      {selectedLog && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedLog(null);
          }}
          title="Audit Trail: Change Comparison & Details"
          description={`Action: ${selectedLog.action} on ${selectedLog.resource}`}
          size="xl"
        >
          <div className="space-y-6 pt-2">
            {/* Metadata Summary Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Performed By</span>
                <span className="font-semibold text-slate-900 text-sm block">
                  {getActorName(selectedLog)}
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {selectedLog.userId?.email || selectedLog.userEmail || 'System'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Date & Exact Time</span>
                <span className="font-medium text-slate-800 block">
                  {formatDate(selectedLog.createdAt, 'MMMM dd, yyyy')}
                </span>
                <span className="font-mono text-slate-500 text-[11px]">
                  {formatDate(selectedLog.createdAt, 'hh:mm:ss a (zzzz)')}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Target Resource</span>
                <span className="font-semibold text-blue-600 block">{selectedLog.resource}</span>
                {selectedLog.resourceId && (
                  <span className="font-mono text-slate-500 text-[11px] block truncate">
                    Ref ID: {selectedLog.resourceId}
                  </span>
                )}
              </div>
            </div>

            {/* Before vs After Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Previous Data (Before) */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/20 p-4">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-rose-200/80">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    Previous Data (পূর্বের তথ্য)
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                    BEFORE
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto pr-1">
                  {renderDataView(selectedLog.previousData, true)}
                </div>
              </div>

              {/* New Data (After) */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/20 p-4">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-200/80">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    Updated Data (বর্তমান/নতুন তথ্য)
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                    AFTER
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto pr-1">
                  {renderDataView(selectedLog.newData, false)}
                </div>
              </div>
            </div>

            {/* Device & Network Origin */}
            {(selectedLog.ipAddress || selectedLog.userAgent) && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-500 text-[11px] flex flex-col sm:flex-row gap-3 justify-between items-start">
                <div className="flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-600">IP:</span>{' '}
                  <span className="font-mono">{selectedLog.ipAddress || '127.0.0.1'}</span>
                </div>
                {selectedLog.userAgent && (
                  <div className="truncate max-w-md text-slate-400 font-mono">
                    User-Agent: {selectedLog.userAgent}
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedLog(null);
                }}
              >
                Close Audit Record
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}
