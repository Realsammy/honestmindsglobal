import { useContext } from 'react';
import { ThriftContext } from '../contexts/ThriftContext';

export function useThrift() {
  const context = useContext(ThriftContext);
  if (!context) {
    throw new Error('useThrift must be used within a ThriftProvider');
  }
  return context;
}