import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Ticket, Calendar, Clock, MapPin, Download, Printer, QrCode } from 'lucide-react';
import { bookingService, eventService, venueService } from '../services/api';
import { Booking, Event, Venue } from '../services/database';
import { useAppSelector } from '../store';
import { format } from 'date-fns';

export default function TicketView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector(s => s.auth);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);

  useEffect(() => {
    if (id) {
      const b = bookingService.getById(id);
      if (b) {
        setBooking(b);
        const e = eventService.getById(b.event);
        setEvent(e || null);
        if (e) {
          const v = venueService.getById(e.venue);
          setVenue(v || null);
        }
      }
    }
  }, [id]);

  if (!booking || !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ticket not found</h2>
        <button onClick={() => navigate('/my-bookings')} className="mt-4 text-indigo-600 hover:underline">My Bookings</button>
      </div>
    );
  }

  const seats = venue?.seatLayout.filter(s => booking.seats.includes(s.seatId)) || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Ticket</h1>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </div>

      {/* Ticket Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg" id="ticket-card">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Ticket className="h-6 w-6" />
            <span className="text-sm font-medium opacity-80">E-TICKET</span>
          </div>
          <h2 className="text-2xl font-bold">{event.title}</h2>
          <p className="text-indigo-200 text-sm mt-1">{venue?.name}, {venue?.city}</p>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Date</p>
              <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                <Calendar className="h-4 w-4 text-indigo-600" />
                {format(new Date(event.eventDate), 'MMM dd, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Time</p>
              <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                <Clock className="h-4 w-4 text-indigo-600" />
                {event.startTime} - {event.endTime}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Venue</p>
              <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                <MapPin className="h-4 w-4 text-indigo-600" />
                {venue?.name}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Booking Ref</p>
              <p className="font-mono font-bold text-indigo-600">{booking.bookingReference}</p>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Attendee</p>
                <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Email</p>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Seats</p>
                <p className="font-medium text-gray-900 dark:text-white">{booking.seats.join(', ')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Amount Paid</p>
                <p className="font-bold text-indigo-600">${booking.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* QR Code Placeholder */}
          <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-2">
                <div className="grid grid-cols-5 gap-1 p-2">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className={`w-4 h-4 rounded-sm ${Math.random() > 0.4 ? 'bg-gray-900 dark:bg-white' : 'bg-transparent'}`} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Scan at entry</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Ticket #{booking.id.slice(0, 8).toUpperCase()} • Generated by TicketFlow
          </p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button onClick={() => navigate('/my-bookings')} className="text-indigo-600 hover:underline text-sm">
          ← Back to My Bookings
        </button>
      </div>
    </div>
  );
}
