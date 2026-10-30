'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { Menu, Bell, Check, Calendar } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import api from '../../lib/api';

const routeTitles: Record<string, string> = {
  '/': 'Dashboard Overview',
  '/attendance': 'Attendance Records & Time Tracking',
  '/leave': 'Leave Management & Balances',
  '/employees': 'People & Employee Directory',
  '/payroll': 'Salary & Payroll Processing',
  '/performance': 'Performance & Attendance Bonus',
  '/reports': 'Workforce Reports & Analytics',
  '/expenses': 'Office Expense Tracking',
  '/settings': 'Company & Policy Settings',
  '/audit-logs': 'System Security & Audit Trail',
};

export function Topbar({ onToggleMobile }: { onToggleMobile: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Current date in Asia/Dhaka
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Dhaka',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    setCurrentDateStr(new Intl.DateTimeFormat('en-US', options).format(new Date()));

    // Fetch notifications
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        const res = await api.get('/notifications');
        if (res.data?.data) {
          setNotifications(res.data.data.notifications || []);
          setUnreadCount(res.data.data.unreadCount || 0);
        }
      } catch {
        // quiet
      }
    };

    fetchNotifications();
  }, [user]);

  const title = routeTitles[pathname] || 'Attendance Tracker';

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // quiet
    }
  };

  return (
    <header className="h-16 bg-[#151925] border-b border-[#222736] px-6 flex items-center justify-between z-20 shrink-0 text-white">
      {/* Left side: Hamburger button + Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-[#1D2333] rounded-lg transition"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base font-bold text-white leading-tight">{title}</h2>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-bold text-[#C95742]">AIExpertsBD</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {currentDateStr || 'Today'} (Asia/Dhaka)
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Notifications & Profile */}
      <div className="flex items-center gap-3">
        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-400 hover:text-white hover:bg-[#1D2333] rounded-full relative transition"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#C95742] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#151925] border border-[#222736] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 text-white">
              <div className="flex items-center justify-between pb-3 border-b border-[#222736]">
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-[#C95742] hover:text-[#DC6E59] font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="py-2 max-h-64 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No notifications yet</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-2.5 rounded-xl text-xs transition ${
                        n.isRead ? 'bg-[#1D2333]/60 text-slate-400' : 'bg-[#C95742]/15 text-white border border-[#C95742]/30 font-medium'
                      }`}
                    >
                      <div className="font-semibold text-white">{n.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Mini */}
        <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-[#222736]">
          <Avatar
            name={
              user?.employee
                ? `${user.employee.firstName} ${user.employee.lastName}`
                : user?.email || 'User'
            }
            size="sm"
          />
          <div className="text-left text-xs">
            <span className="font-semibold text-white block leading-tight">
              {user?.employee
                ? `${user.employee.firstName} ${user.employee.lastName}`
                : user?.email}
            </span>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              {user?.role?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
