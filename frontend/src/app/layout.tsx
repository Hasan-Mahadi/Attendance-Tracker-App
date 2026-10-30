import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '../hooks/useAuth';
import { ToastProvider } from '../hooks/useToast';

export const metadata: Metadata = {
  title: 'AIExpertsBD - Attendance & Workforce Management',
  description:
    'Private enterprise workforce attendance, leave, payroll, performance, and expense management system for AIExpertsBD.',
  icons: {
    icon: '/logo-placeholder.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased font-sans">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
