import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import { Login, Register } from './pages/Auth';
import Checkout from './pages/Checkout';
import MyBookings from './pages/MyBookings';
import TicketView from './pages/Ticket';
import Profile from './pages/Profile';
import { AdminLayout, AdminDashboard, AdminEvents, AdminVenues, AdminBookings, AdminUsers } from './pages/Admin';
import { useAppSelector, useAppDispatch, removeToast } from './store';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { db } from './services/database';

// Initialize database
db.seed();

function ToastContainer() {
  const { toasts } = useAppSelector(s => s.ui);
  const dispatch = useAppDispatch();

  useEffect(() => {
    toasts.forEach(toast => {
      const timer = setTimeout(() => dispatch(removeToast(toast.id)), 4000);
      return () => clearTimeout(timer);
    });
  }, [toasts, dispatch]);

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-slide-in ${
            toast.type === 'success' ? 'bg-green-50 dark:bg-green-900/80 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200' :
            toast.type === 'error' ? 'bg-red-50 dark:bg-red-900/80 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200' :
            'bg-blue-50 dark:bg-blue-900/80 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200'
          }`}
        >
          {toast.type === 'success' && <CheckCircle className="h-5 w-5 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="h-5 w-5 shrink-0" />}
          {toast.type === 'info' && <Info className="h-5 w-5 shrink-0" />}
          <p className="text-sm font-medium flex-1">{toast.message}</p>
          <button onClick={() => dispatch(removeToast(toast.id))} className="shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, user } = useAppSelector(s => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (adminOnly && user?.role !== 'ADMIN') return <Navigate to="/" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/ticket/:id" element={<ProtectedRoute><TicketView /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="venues" element={<AdminVenues />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
          <Route path="*" element={
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
              <p className="text-gray-600 dark:text-gray-400">Page not found</p>
              <a href="/" className="mt-4 inline-block text-indigo-600 hover:underline">Go Home</a>
            </div>
          } />
        </Routes>
      </Layout>
      <ToastContainer />
    </BrowserRouter>
  );
}
