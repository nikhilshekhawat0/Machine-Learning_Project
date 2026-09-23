import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket, Calendar, MapPin, XCircle, Eye } from 'lucide-react';
import { bookingService, eventService, venueService } from '../services/api';
import { Booking, Event } from '../services/database';
import { useAppSelector, useAppDispatch, addToast } from '../store';
import { format } from 'date-fns';

export default function MyBookings() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector(s => s.auth);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    const userBookings = bookingService.getByUser(user.id);
    const enriched = userBookings.map(b => ({
      ...b,
      event: eventService.getById(b.event),
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setBookings(enriched);
    setLoading(false);
  }, [isAuthenticated, user, navigate]);

  const handleCancel = (bookingId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      bookingService.cancel(bookingId, user.id);
      dispatch(addToast({ message: 'Booking cancelled successfully', type: 'success' }));
      const userBookings = bookingService.getByUser(user.id);
      const enriched = userBookings.map(b => ({
        ...b,
        event: eventService.getById(b.event),
      })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(enriched);
    } catch (err: any) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="text-center py-16">
          <Ticket className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No bookings yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Start exploring events and book your first ticket!</p>
          <Link to="/events" className="mt-4 inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => {
            const venue = venueService.getById(booking.venue);
            return (
              <div key={booking.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row gap-4">
                  {booking.event && (
                    <img src={booking.event.poster} alt={booking.event.title} className="w-full sm:w-24 h-24 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{booking.event?.title || 'Event'}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ref: {booking.bookingReference}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                        booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                        booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{booking.event ? format(new Date(booking.event.eventDate), 'MMM dd, yyyy') : 'TBA'}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{venue?.name || 'TBA'}</span>
                      <span>Seats: {booking.seats.join(', ')}</span>
                      <span className="font-medium text-indigo-600">${booking.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {booking.status === 'CONFIRMED' && (
                        <Link to={`/ticket/${booking.id}`} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50">
                          <Eye className="h-4 w-4" /> View Ticket
                        </Link>
                      )}
                      {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
                        <button onClick={() => handleCancel(booking.id)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50">
                          <XCircle className="h-4 w-4" /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
