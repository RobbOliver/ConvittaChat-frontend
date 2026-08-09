import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getToken } from '../lib/authToken';
import { connectSocket } from '../lib/socket';

export function RequireAuth() {
  const token = getToken();

  useEffect(() => {
    if (token) connectSocket();
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
