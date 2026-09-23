import React, { useEffect, useState } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, MapPin, Ticket, Users, DollarSign, TrendingUp, Plus, Trash2, Edit, Eye } from 'lucide-react';
import { adminService, eventService, venueService, bookingService } from '../services/api';
import { useAppSelector, useAppDispatch, addToast } from '../store';
import { format } from 'date-fns';

export function AdminLayout() {
  const { user, isAuthenticated } = useAppSelector(s => s.auth);
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    navigate('/login');
    return null;
  }

  const links = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/events', label: 'Events', icon: Calendar },
    { to: '/admin/venues', label: 'Venues', icon: MapPin },
    { to: '/admin/bookings', label: 'Bookings', icon: Ticket },
    { to: '/admin/users', label: 'Users', icon: Users },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="lg:w-56 shrink-0">
          <nav className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2 space-y-1">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    setStats(adminService.getDashboard());
  }, []);

  if (!stats) return <div className="animate-pulse h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />;

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Events', value: stats.totalEvents, icon: Calendar, color: 'bg-green-500' },
    { label: 'Total Bookings', value: stats.totalBookings, icon: Ticket, color: 'bg-purple-500' },
    { label: 'Revenue', value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign, color: 'bg-indigo-500' },
    { label: 'Confirmed', value: stats.confirmedBookings, icon: TrendingUp, color: 'bg-emerald-500' },
    { label: 'Cancelled', value: stats.cancelledBookings, icon: Ticket, color: 'bg-red-500' },
    { label: 'Upcoming Events', value: stats.upcomingEvents, icon: Calendar, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminEvents() {
  const dispatch = useAppDispatch();
  const [events, setEvents] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'Music', poster: '', venue: '', eventDate: '', startTime: '19:00', endTime: '22:00', ticketPrice: 0, status: 'UPCOMING' as const });

  const venues = venueService.getAll();

  const loadEvents = () => {
    const result = eventService.getAll({});
    setEvents(result.events);
  };

  useEffect(() => { loadEvents(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        eventService.update(editId, form as any);
        dispatch(addToast({ message: 'Event updated', type: 'success' }));
      } else {
        eventService.create({ ...form, createdBy: '', poster: form.poster || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop' });
        dispatch(addToast({ message: 'Event created', type: 'success' }));
      }
      setShowForm(false);
      setEditId(null);
      setForm({ title: '', description: '', category: 'Music', poster: '', venue: '', eventDate: '', startTime: '19:00', endTime: '22:00', ticketPrice: 0, status: 'UPCOMING' });
      loadEvents();
    } catch (err: any) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    }
  };

  const handleEdit = (event: any) => {
    setForm({
      title: event.title,
      description: event.description,
      category: event.category,
      poster: event.poster,
      venue: event.venue,
      eventDate: event.eventDate.split('T')[0],
      startTime: event.startTime,
      endTime: event.endTime,
      ticketPrice: event.ticketPrice,
      status: event.status,
    });
    setEditId(event.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this event?')) return;
    eventService.delete(id);
    dispatch(addToast({ message: 'Event deleted', type: 'success' }));
    loadEvents();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Events</h1>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); }} className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus className="h-4 w-4" /> Add Event
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                <option>Music</option><option>Conference</option><option>Comedy</option><option>Theater</option><option>Sports</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Venue</label>
              <select value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                <option value="">Select venue</option>
                {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <input type="date" value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
              <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
              <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ticket Price ($)</label>
              <input type="number" value={form.ticketPrice} onChange={e => setForm({ ...form, ticketPrice: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                <option>UPCOMING</option><option>ONGOING</option><option>COMPLETED</option><option>CANCELLED</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Poster URL</label>
            <input type="url" value={form.poster} onChange={e => setForm({ ...form, poster: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
              {editId ? 'Update Event' : 'Create Event'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-medium">Event</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-medium">Date</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-medium">Price</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-medium">Status</th>
                <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {events.map(event => (
                <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={event.poster} alt="" className="w-10 h-10 rounded object-cover" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{event.title}</p>
                        <p className="text-xs text-gray-500">{event.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{format(new Date(event.eventDate), 'MMM dd, yyyy')}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">${event.ticketPrice}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      event.status === 'UPCOMING' ? 'bg-green-100 text-green-700' :
                      event.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{event.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEdit(event)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(event.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AdminVenues() {
  const dispatch = useAppDispatch();
  const [venues, setVenues] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', city: '', state: '', country: '', capacity: 0 });

  const loadVenues = () => setVenues(venueService.getAll());
  useEffect(() => { loadVenues(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Generate seat layout
      const rows = 6, cols = 10;
      const rowLetters = 'ABCDEF';
      const seatLayout = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 1; c <= cols; c++) {
          let type: 'REGULAR' | 'VIP' | 'PREMIUM' = 'REGULAR';
          let price = 25;
          if (r < 2) { type = 'PREMIUM'; price = 50; }
          else if (r < 4) { type = 'VIP'; price = 37.5; }
          seatLayout.push({ seatId: `${rowLetters[r]}${c}`, row: rowLetters[r], number: c, type, price, status: 'AVAILABLE' as const });
        }
      }
      venueService.create({ ...form, seatLayout, capacity: rows * cols });
      dispatch(addToast({ message: 'Venue created', type: 'success' }));
      setShowForm(false);
      setForm({ name: '', address: '', city: '', state: '', country: '', capacity: 0 });
      loadVenues();
    } catch (err: any) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this venue?')) return;
    venueService.delete(id);
    dispatch(addToast({ message: 'Venue deleted', type: 'success' }));
    loadVenues();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Venues</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus className="h-4 w-4" /> Add Venue
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
              <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
              <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
              <input type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
              <input type="text" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Create Venue</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {venues.map(venue => (
          <div key={venue.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{venue.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{venue.address}, {venue.city}</p>
                <p className="text-sm text-gray-500 mt-1">{venue.seatLayout.length} seats • {venue.capacity} capacity</p>
              </div>
              <button onClick={() => handleDelete(venue.id)} className="p-1.5 text-gray-500 hover:text-red-600 rounded">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminBookings() {
  const bookings = bookingService.getAll();
  const enriched = bookings.map(b => ({ ...b, event: eventService.getById(b.event) }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">All Bookings</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-medium">Reference</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-medium">Event</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-medium">Seats</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-medium">Amount</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-medium">Status</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {enriched.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No bookings yet</td></tr>
              ) : enriched.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 font-mono text-indigo-600">{b.bookingReference}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{b.event?.title || 'Unknown'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{b.seats.join(', ')}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">${b.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                      b.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      b.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                      b.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{b.paymentStatus}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AdminUsers() {
  const dispatch = useAppDispatch();
  const [users, setUsers] = useState<any[]>([]);

  const loadUsers = () => setUsers(adminService.getUsers());
  useEffect(() => { loadUsers(); }, []);

  const handleDelete = (id: string) => {
    if (!confirm('Delete this user?')) return;
    adminService.deleteUser(id);
    dispatch(addToast({ message: 'User deleted', type: 'success' }));
    loadUsers();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Manage Users</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-medium">Name</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-medium">Email</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-medium">Role</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-medium">Joined</th>
                <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{u.name.charAt(0)}</span>
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{format(new Date(u.createdAt), 'MMM dd, yyyy')}</td>
                  <td className="px-4 py-3 text-right">
                    {u.role !== 'ADMIN' && (
                      <button onClick={() => handleDelete(u.id)} className="p-1.5 text-gray-500 hover:text-red-600 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
