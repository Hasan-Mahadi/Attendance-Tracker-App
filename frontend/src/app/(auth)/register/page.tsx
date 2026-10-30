'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { KeyRound, Lock, User, Eye, EyeOff } from 'lucide-react';

const registerSchema = z
  .object({
    employeeCode: z.string().min(1, 'Employee ID is required'),
    invitationCode: z.string().min(1, 'Invitation code is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerAuth } = useAuth();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await registerAuth(data.employeeCode, data.invitationCode, data.password);
      toast.success('Account activated successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Activation failed. Check your Employee ID and invitation code.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Activate Employee Account</h2>
        <p className="text-xs text-slate-500 mt-1">
          Enter the Employee ID and invitation code issued by your HR administrator
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Assigned Employee ID"
          placeholder="e.g. AIE-003"
          leftIcon={<User className="w-4 h-4" />}
          error={errors.employeeCode?.message}
          {...register('employeeCode')}
        />

        <Input
          label="One-Time Invitation Code"
          placeholder="e.g. 7F3A92B0"
          leftIcon={<KeyRound className="w-4 h-4" />}
          error={errors.invitationCode?.message}
          {...register('invitationCode')}
        />

        <Input
          label="New Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="At least 8 chars, 1 uppercase, 1 number"
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Re-enter password"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
          Activate Account
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-600">
          Already activated?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
