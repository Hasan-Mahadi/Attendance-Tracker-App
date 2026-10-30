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
import { SearchInput } from '../../../components/ui/SearchInput';
import { Pagination } from '../../../components/ui/Pagination';
import { Avatar } from '../../../components/ui/Avatar';
import { formatDate } from '../../../lib/utils';
import api from '../../../lib/api';
import {
  UserPlus,
  KeyRound,
  Download,
  Edit,
  DollarSign,
  Copy,
  Check,
  Building,
  Clock,
} from 'lucide-react';

export default function EmployeesPage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Add Employee Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    joiningDate: new Date().toISOString().split('T')[0],
    baseSalary: 30000,
  });

  // Invitation Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedEmployeeForInvite, setSelectedEmployeeForInvite] = useState<any>(null);
  const [generatedInvite, setGeneratedInvite] = useState<any>(null);
  const [hasCopied, setHasCopied] = useState(false);

  // Salary Update Modal
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [selectedEmployeeForSalary, setSelectedEmployeeForSalary] = useState<any>(null);
  const [salaryInput, setSalaryInput] = useState({
    baseSalary: 0,
    effectiveFrom: new Date().toISOString().split('T')[0],
    notes: 'Annual increment',
  });

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const params: any = { page: currentPage };
      if (search) params.search = search;
      if (selectedDept) params.department = selectedDept;
      if (selectedStatus) params.status = selectedStatus;

      const [empRes, deptRes] = await Promise.all([
        api.get('/employees', { params }),
        api.get('/departments'),
      ]);
      setEmployees(empRes.data.data);
      setPagination(empRes.data.pagination);
      setDepartments(deptRes.data.data || []);

      if (!newEmployee.department && deptRes.data.data?.length > 0) {
        setNewEmployee((prev) => ({ ...prev, department: deptRes.data.data[0]._id }));
      }
    } catch {
      toast.error('Failed to load employees list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchEmployees();
  }, [user, currentPage, search, selectedDept, selectedStatus]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/employees', newEmployee);
      toast.success(`Employee ${newEmployee.employeeCode} created successfully!`);
      setShowAddModal(false);
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create employee');
    }
  };

  const handleGenerateInvite = async (emp: any) => {
    try {
      setSelectedEmployeeForInvite(emp);
      setGeneratedInvite(null);
      setHasCopied(false);
      const res = await api.post('/employees/invitations', { employeeId: emp._id });
      setGeneratedInvite(res.data.data);
      setShowInviteModal(true);
      toast.success('Registration invitation generated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate invitation');
    }
  };

  const handleCopyInviteCode = () => {
    if (generatedInvite?.invitationCode) {
      navigator.clipboard.writeText(generatedInvite.invitationCode);
      setHasCopied(true);
      toast.success('Invitation code copied to clipboard');
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  const handleOpenSalary = (emp: any) => {
    setSelectedEmployeeForSalary(emp);
    setSalaryInput({
      baseSalary: 30000,
      effectiveFrom: new Date().toISOString().split('T')[0],
      notes: 'Updated salary configuration',
    });
    setShowSalaryModal(true);
  };

  const handleUpdateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/employees/${selectedEmployeeForSalary._id}/salary`, {
        baseSalary: Number(salaryInput.baseSalary),
        effectiveFrom: salaryInput.effectiveFrom,
        notes: salaryInput.notes,
      });
      toast.success('Salary profile updated');
      setShowSalaryModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update salary');
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await api.get('/employees/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'aiexpertsbd-employees.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Employee directory exported');
    } catch {
      toast.error('Failed to export employees');
    }
  };

  const formatEmployeeWorkweek = (schedule?: any) => {
    if (!schedule) return { rangeText: 'Sunday – Thursday', shiftHours: '09:00 - 18:00' };
    const days: number[] = schedule.workingDays || [0, 1, 2, 3, 4];
    const sorted = [...days].sort((a: number, b: number) => a - b);

    let rangeText = 'Custom';
    if (sorted.length === 5 && sorted[0] === 0 && sorted[4] === 4) {
      rangeText = 'Sunday – Thursday';
    } else if (sorted.length === 6 && sorted[0] === 0 && sorted[5] === 5) {
      rangeText = 'Sunday – Friday';
    } else if (sorted.length === 6 && sorted.includes(6) && sorted.includes(4)) {
      rangeText = 'Saturday – Thursday';
    } else if (sorted.length === 5 && sorted[0] === 1 && sorted[4] === 5) {
      rangeText = 'Monday – Friday';
    } else if (sorted.length === 7) {
      rangeText = 'All 7 Days';
    } else {
      const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      rangeText = sorted.map((d: number) => dayLabels[d]).join(', ');
    }

    const shiftHours =
      schedule.startTime && schedule.endTime ? `${schedule.startTime} - ${schedule.endTime}` : '09:00 - 18:00';

    return { rangeText, shiftHours };
  };

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#C95742]">People / Employees</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage company employee IDs, departments, workweek schedules, and registration invitations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Directory
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Add Employee
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="mb-6">
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setCurrentPage(1);
              }}
              placeholder="Search by name, ID, email, or designation..."
            />
          </div>

          <div className="w-48">
            <Select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { label: 'All Departments', value: '' },
                ...departments.map((d) => ({ label: d.name, value: d._id })),
              ]}
            />
          </div>

          <div className="w-40">
            <Select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Active', value: 'active' },
                { label: 'Suspended', value: 'suspended' },
                { label: 'Terminated', value: 'terminated' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Workweek & Shift</TableHead>
              <TableHead>Joining Date</TableHead>
              <TableHead>Portal Status</TableHead>
              <TableHead>Employment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                  No employees found matching criteria
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => (
                <TableRow key={emp._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={`${emp.firstName} ${emp.lastName}`} size="sm" />
                      <div>
                        <div className="font-semibold text-slate-900">
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div className="text-xs text-[#C95742] font-mono font-medium">
                          {emp.employeeCode}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{emp.designation || '—'}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {emp.department?.name || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const { rangeText, shiftHours } = formatEmployeeWorkweek(emp.workSchedule);
                      return (
                        <div>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#C95742] bg-[#FDF6F4] px-2.5 py-0.5 rounded-full border border-[#F9D5CD]">
                            {rangeText}
                          </span>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {shiftHours}
                          </div>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>{formatDate(emp.joiningDate)}</TableCell>
                  <TableCell>
                    {emp.account ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" /> Registered
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        Unregistered
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={emp.employmentStatus} />
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {!emp.account && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateInvite(emp)}
                        title="Generate registration code"
                        leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                      >
                        Invite
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenSalary(emp)}
                      title="Configure base salary"
                      leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                    >
                      Salary
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

      {/* Add Employee Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Provision New Employee Profile"
        description="Creates official employee record and assigns unique Employee ID"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Employee ID"
              placeholder="e.g. AIE-004"
              value={newEmployee.employeeCode}
              onChange={(e) =>
                setNewEmployee({ ...newEmployee, employeeCode: e.target.value.toUpperCase() })
              }
              required
            />
            <Input
              label="First Name"
              placeholder="First name"
              value={newEmployee.firstName}
              onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              placeholder="Last name"
              value={newEmployee.lastName}
              onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Official Email"
              type="email"
              placeholder="employee@aiexpertsbd.com"
              value={newEmployee.email}
              onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              placeholder="+880 1..."
              value={newEmployee.phone}
              onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department"
              value={newEmployee.department}
              onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
              options={departments.map((d) => ({ label: d.name, value: d._id }))}
              required
            />
            <Input
              label="Designation"
              placeholder="e.g. Frontend Developer"
              value={newEmployee.designation}
              onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Joining Date"
              type="date"
              value={newEmployee.joiningDate}
              onChange={(e) => setNewEmployee({ ...newEmployee, joiningDate: e.target.value })}
              required
            />
            <Input
              label="Monthly Base Salary (BDT)"
              type="number"
              placeholder="35000"
              value={newEmployee.baseSalary}
              onChange={(e) =>
                setNewEmployee({ ...newEmployee, baseSalary: Number(e.target.value) })
              }
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Employee
            </Button>
          </div>
        </form>
      </Modal>

      {/* Invitation Code Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Employee Registration Invitation"
        description="Share this one-time code with the employee to complete account registration"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
            <p className="text-xs uppercase font-bold text-blue-600 tracking-wider">
              {selectedEmployeeForInvite?.employeeCode} • {selectedEmployeeForInvite?.firstName}{' '}
              {selectedEmployeeForInvite?.lastName}
            </p>
            <div className="my-3 flex items-center justify-center gap-3">
              <span className="text-3xl font-mono font-extrabold tracking-widest text-slate-900 bg-white px-5 py-2 rounded-xl border border-blue-200 shadow-inner">
                {generatedInvite?.invitationCode}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyInviteCode}
                leftIcon={hasCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              >
                {hasCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Expires on: {formatDate(generatedInvite?.expiresAt, 'MMM dd, yyyy hh:mm a')}
            </p>
          </div>

          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <strong>Registration Instructions:</strong>
            <ol className="list-decimal list-inside mt-1 space-y-1 text-slate-500">
              <li>Direct employee to the registration page (`/register`).</li>
              <li>Provide their Employee ID (`{selectedEmployeeForInvite?.employeeCode}`).</li>
              <li>Provide the one-time code above.</li>
              <li>The employee will set their password and immediately gain access.</li>
            </ol>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" size="sm" onClick={() => setShowInviteModal(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Salary Configuration Modal */}
      <Modal
        isOpen={showSalaryModal}
        onClose={() => setShowSalaryModal(false)}
        title={`Configure Salary: ${selectedEmployeeForSalary?.firstName} ${selectedEmployeeForSalary?.lastName}`}
        description="Updates base monthly salary and effective date with complete audit logging"
      >
        <form onSubmit={handleUpdateSalary} className="space-y-4">
          <Input
            label="Base Monthly Salary (BDT)"
            type="number"
            value={salaryInput.baseSalary}
            onChange={(e) =>
              setSalaryInput({ ...salaryInput, baseSalary: Number(e.target.value) })
            }
            required
          />

          <Input
            label="Effective From Date"
            type="date"
            value={salaryInput.effectiveFrom}
            onChange={(e) =>
              setSalaryInput({ ...salaryInput, effectiveFrom: e.target.value })
            }
            required
          />

          <Input
            label="Reason / Notes"
            value={salaryInput.notes}
            onChange={(e) => setSalaryInput({ ...salaryInput, notes: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSalaryModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Salary Profile
            </Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
