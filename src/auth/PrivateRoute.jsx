
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function PrivateRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-4 text-center">Carregando...</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
