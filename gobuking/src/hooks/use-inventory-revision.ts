'use client';
import { useEffect, useState } from 'react';
export function useInventoryRevision() {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('gobuking:inventory-changed', refresh);
    window.addEventListener('focus', refresh);
    const timer = setInterval(refresh, 30000);
    return () => {
      window.removeEventListener('gobuking:inventory-changed', refresh);
      window.removeEventListener('focus', refresh);
      clearInterval(timer);
    };
  }, []);
  return revision;
}
