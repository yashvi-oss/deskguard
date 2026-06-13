import { useState, useEffect } from 'react';
import { User } from '../types';
import { getUser, getToken } from '../utils/storage';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = getToken();
    const storedUser = getUser();

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse stored user');
      }
    }

    setLoading(false);
  }, []);

  return { user, isAuthenticated, loading };
};
