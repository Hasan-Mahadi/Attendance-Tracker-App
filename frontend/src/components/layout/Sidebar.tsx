'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  Clock,
  Calendar,
  Users,
  Wallet,
  TrendingUp,
  BarChart3,
  Receipt,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ('super_admin' | 'hr_admin' | 'employee')[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Attendance',
    href: '/attendance',
    icon: Clock,
  },
  {
    title: 'Leave Management',
    href: '/leave',
    icon: Calendar,
  },
  {
    title: 'People',
    href: '/employees',
    icon: Users,
    roles: ['super_admin', 'hr_admin'],
  },
  {
    title: 'Salary & Payroll',
    href: '/payroll',
    icon: Wallet,
  },
  {
    title: 'Performance',
    href: '/performance',
    icon: TrendingUp,
  },
  {
    title: 'Statistics & Reports',
    href: '/reports',
    icon: BarChart3,
  },
  {
    title: 'Office Expenses',
    href: '/expenses',
    icon: Receipt,
    roles: ['super_admin', 'hr_admin'],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['super_admin', 'hr_admin'],
  },
  {
    title: 'Audit Logs',
    href: '/audit-logs',
    icon: Shield,
    roles: ['super_admin'],
  },
];

export function Sidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const userRole = user?.role || 'employee';

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  return (
    <aside className="w-64 bg-[#151925] text-slate-300 flex flex-col h-full border-r border-[#222736] select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-[#222736]">
        <img src="/logo-placeholder.svg" alt="AIExpertsBD" className="w-8 h-8 rounded-lg shrink-0" />
        <div className="overflow-hidden">
          <h1 className="font-bold text-white text-base leading-tight tracking-tight">AIExpertsBD</h1>
          <p className="text-[10px] uppercase font-bold tracking-wider text-[#C95742]">Attendance Tracker</p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Main Menu
        </div>
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors group relative',
                isActive
                  ? 'bg-[#C95742] text-white shadow-sm shadow-[#C95742]/20'
                  : 'text-slate-400 hover:text-white hover:bg-[#1D2333]'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                )}
              />
              <span className="flex-1 truncate">{item.title}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
            </Link>
          );
        })}
      </div>

      {/* User Card & Logout Footer */}
      <div className="p-3 border-t border-[#222736] bg-[#11141E]">
        <div className="flex items-center gap-3 p-2 rounded-xl">
          <Avatar
            name={
              user?.employee
                ? `${user.employee.firstName} ${user.employee.lastName}`
                : user?.email || 'User'
            }
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {user?.employee
                ? `${user.employee.firstName} ${user.employee.lastName}`
                : user?.email}
            </p>
            <p className="text-[11px] text-slate-400 truncate capitalize">
              {user?.employee?.designation || user?.role?.replace(/_/g, ' ')}
            </p>
          </div>
          <button
            onClick={() => logout()}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-[#1D2333] rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
