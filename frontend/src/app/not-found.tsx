'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '../components/ui/Button';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
      <p className="text-sm text-slate-500 mt-2 max-w-md">
        The requested URL was not found on the AIExpertsBD Attendance Tracker portal.
      </p>
      <div className="mt-6">
        <Link href="/">
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
