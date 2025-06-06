import { ReactNode } from 'react';
import AuthLayout from '../../layouts/AuthLayout';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: AuthLayoutProps) {
  return <AuthLayout>{children}</AuthLayout>;
} 
