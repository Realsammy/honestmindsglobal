import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

export function useWallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchWallet = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setBalance(data?.balance || 0);
      } catch (err) {
        console.error('Error fetching wallet:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch wallet balance');
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();

    // Subscribe to wallet changes
    const subscription = supabase
      .channel('wallet_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Wallet updated:', payload);
          fetchWallet();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return { balance, loading, error };
}