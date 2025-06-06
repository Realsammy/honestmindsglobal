import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './ui/Toast';
import Button from './ui/Button';

interface SignupFormProps {
  onSignupSuccess: () => void;
}

export default function SignupForm({ onSignupSuccess }: SignupFormProps) {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        type: 'error'
      });
      return;
    }

    try {
      setIsLoading(true);
      await signUp(formData.email, formData.password);
      toast({
        title: 'Success',
        description: 'Account created successfully! Please check your email to verify your account.',
        type: 'success'
      });
      onSignupSuccess();
    } catch (err: any) {
      console.error('Signup error:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to create account',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          required
          minLength={8}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          required
          minLength={8}
        />
      </div>

      <Button
        type="submit"
        isLoading={isLoading}
        className="w-full"
      >
        Create Account
      </Button>
    </form>
  );
}
