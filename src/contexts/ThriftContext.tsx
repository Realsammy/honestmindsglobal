import React, { createContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { Thrift, Transaction } from '../types';

interface ThriftContextType {
  thrifts: Thrift[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  makeContribution: (thriftId: string, amount: number) => Promise<void>;
  refreshThrifts: () => Promise<void>;
  createThrift: (options: { referral_id?: string }) => Promise<{ id: string; thrift_referral_id: string }>;
}

export const ThriftContext = createContext<ThriftContextType | undefined>(undefined);

export function ThriftProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [thrifts, setThrifts] = useState<Thrift[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThrifts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch thrifts and transactions in parallel
      const [thriftsResponse, transactionsResponse] = await Promise.all([
        supabase
          .from('thrifts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (thriftsResponse.error) throw thriftsResponse.error;
      if (transactionsResponse.error) throw transactionsResponse.error;

      setThrifts(thriftsResponse.data || []);
      setTransactions(transactionsResponse.data || []);
    } catch (err) {
      console.error('Error fetching thrifts:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThrifts();

    if (!user) return;

    // Set up real-time subscription
    const subscription = supabase
      .channel('thrifts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'thrifts',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchThrifts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const makeContribution = async (thriftId: string, amount: number) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase.rpc('make_contribution', {
        p_thrift_id: thriftId,
        p_amount: amount,
      });

      if (error) throw error;

      await fetchThrifts();
    } catch (err) {
      console.error('Error making contribution:', err);
      throw err;
    }
  };

  const refreshThrifts = async () => {
    await fetchThrifts();
  };

  const createThrift = async (options: { referral_id?: string }) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase.rpc('create_thrift', {
        p_user_id: user.id,
        p_referral_id: options.referral_id
      });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }
      if (!data) throw new Error('No data returned from create_thrift');
      await fetchThrifts();
      return { id: data.thrift_id, thrift_referral_id: data.thrift_referral_id };
    } catch (err) {
      console.error('Error creating thrift:', err);
      throw err;
    }
  };

  return (
    <ThriftContext.Provider
      value={{
        thrifts,
        transactions,
        loading,
        error,
        makeContribution,
        refreshThrifts,
        createThrift,
      }}
    >
      {children}
    </ThriftContext.Provider>
  );
}

export function useThrift() {
  const context = React.useContext(ThriftContext);
  if (context === undefined) {
    throw new Error('useThrift must be used within a ThriftProvider');
  }
  return context;
}
