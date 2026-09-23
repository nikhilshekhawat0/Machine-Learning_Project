import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Ticket, Menu, X, User, LogOut, LayoutDashboard, Moon, Sun } from 'lucide-react';
import { useAppDispatch, useAppSelector, logout, toggleDarkMode } from '../store';

export function Navbar() {
  const { user, isAuthenticated } = useAppSelector(s => s.auth);
  const { darkMode } = useAppSelector(s => s.ui);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setMobileOpen(false);
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/events', label: 'Events' },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Ticket className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">TicketFlow</span>
            </Link>
            <div className="hidden md:flex ml-10 gap-6">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated && (
                <>
                  <Link to="/my-bookings" className={`text-sm font-medium ${location.pathname === '/my-bookings' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600'}`}>
                    My Bookings
                  </Link>
                  {user?.role === 'ADMIN' && (
                    <Link to="/admin" className={`text-sm font-medium ${location.pathname.startsWith('/admin') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600'}`}>
                      Admin
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => dispatch(toggleDarkMode())} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {isAuthenticated ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                    <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <User className="h-4 w-4" /> Profile
                    </Link>
                    {user?.role === 'ADMIN' && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                      </Link>
                    )}
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600">
                  Login
                </Link>
                <Link to="/register" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                  Register
                </Link>
              </div>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-4 px-4">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className="block py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600">
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <>
              <Link to="/my-bookings" onClick={() => setMobileOpen(false)} className="block py-2 text-gray-700 dark:text-gray-300">My Bookings</Link>
              {user?.role === 'ADMIN' && <Link to="/admin" onClick={() => setMobileOpen(false)} className="block py-2 text-gray-700 dark:text-gray-300">Admin</Link>}
              <button onClick={handleLogout} className="block py-2 text-red-600 text-left">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block py-2 text-gray-700 dark:text-gray-300">Login</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="block py-2 text-indigo-600 font-medium">Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Ticket className="h-6 w-6 text-indigo-600" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">TicketFlow</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Your premium ticket booking platform. Discover events, book seats, and enjoy experiences.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/events" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600">Browse Events</Link>
              <Link to="/my-bookings" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600">My Bookings</Link>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Demo Accounts</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>Admin: admin@example.com</p>
              <p>User: john@example.com</p>
              <p>Password: Password123!</p>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500">
          © 2026 TicketFlow. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { darkMode } = useAppSelector(s => s.ui);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
