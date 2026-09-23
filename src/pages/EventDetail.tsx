import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, ArrowLeft, Ticket, Info } from 'lucide-react';
import { eventService, seatService, venueService } from '../services/api';
import { Event, Seat, Venue } from '../services/database';
import { useAppSelector, useAppDispatch, addToast } from '../store';
import { format } from 'date-fns';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector(s => s.auth);

  const [event, setEvent] = useState<Event | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [holding, setHolding] = useState(false);

  useEffect(() => {
    if (id) {
      const ev = eventService.getById(id);
      if (ev) {
        setEvent(ev);
        const venueData = venueService.getById(ev.venue);
        setVenue(venueData || null);
        const seatData = seatService.getSeats(id);
        setSeats(seatData);
      }
      setLoading(false);
    }
  }, [id]);

  const refreshSeats = useCallback(() => {
    if (id) {
      const seatData = seatService.getSeats(id);
      setSeats(seatData);
    }
  }, [id]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'BOOKED') return;
    if (seat.status === 'HELD' && seat.heldBy !== user?.id) return;

    setSelectedSeats(prev => {
      if (prev.includes(seat.seatId)) {
        return prev.filter(s => s !== seat.seatId);
      }
      if (prev.length >= 10) {
        dispatch(addToast({ message: 'Maximum 10 seats per booking', type: 'error' }));
        return prev;
      }
      return [...prev, seat.seatId];
    });
  };

  const handleHoldSeats = async () => {
    if (!isAuthenticated) {
      dispatch(addToast({ message: 'Please login to book tickets', type: 'info' }));
      navigate('/login');
      return;
    }
    if (selectedSeats.length === 0) {
      dispatch(addToast({ message: 'Please select at least one seat', type: 'error' }));
      return;
    }

    setHolding(true);
    try {
      seatService.holdSeats(id!, selectedSeats, user!.id);
      dispatch(addToast({ message: 'Seats held successfully! Proceed to checkout.', type: 'success' }));
      refreshSeats();
      // Navigate to checkout with held seats
      navigate(`/checkout?event=${id}&seats=${selectedSeats.join(',')}`);
    } catch (err: any) {
      dispatch(addToast({ message: err.message, type: 'error' }));
      refreshSeats();
    } finally {
      setHolding(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event not found</h2>
        <Link to="/events" className="mt-4 inline-block text-indigo-600 hover:underline">Back to events</Link>
      </div>
    );
  }

  const selectedSeatData = seats.filter(s => selectedSeats.includes(s.seatId));
  const totalAmount = selectedSeatData.reduce((sum, s) => sum + s.price, 0);

  // Group seats by row
  const rows: Record<string, Seat[]> = {};
  seats.forEach(s => {
    if (!rows[s.row]) rows[s.row] = [];
    rows[s.row].push(s);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-indigo-600 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <img src={event.poster} alt={event.title} className="w-full h-64 object-cover" />
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-medium rounded mb-2">
                    {event.category}
                  </span>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{event.title}</h1>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  event.status === 'UPCOMING' ? 'bg-green-100 text-green-700' :
                  event.status === 'ONGOING' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {event.status}
                </span>
              </div>
              <p className="mt-3 text-gray-600 dark:text-gray-400">{event.description}</p>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  {format(new Date(event.eventDate), 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  {event.startTime} - {event.endTime}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4 text-indigo-600" />
                  {venue?.city || 'TBA'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="h-4 w-4 text-indigo-600" />
                  {event.availableSeats} available
                </div>
              </div>
            </div>
          </div>

          {/* Seat Map */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Your Seats</h2>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-orange-100 dark:bg-orange-900 border border-orange-300 dark:border-orange-700" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Held</span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <div className="w-6 h-6 rounded bg-purple-100 dark:bg-purple-900 border border-purple-300" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Premium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900 border border-blue-300" />
                <span className="text-xs text-gray-600 dark:text-gray-400">VIP</span>
              </div>
            </div>

            {/* Stage */}
            <div className="mb-6 mx-auto max-w-md">
              <div className="bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-200 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-900 rounded-t-xl py-3 text-center text-sm font-medium text-indigo-700 dark:text-indigo-300">
                🎭 STAGE
              </div>
            </div>

            {/* Seat Grid */}
            <div className="overflow-x-auto pb-4">
              <div className="min-w-fit mx-auto">
                {Object.entries(rows).map(([row, rowSeats]) => (
                  <div key={row} className="flex items-center gap-1 mb-1">
                    <span className="w-6 text-xs text-gray-500 font-mono text-center">{row}</span>
                    {rowSeats.sort((a, b) => a.number - b.number).map(seat => {
                      const isSelected = selectedSeats.includes(seat.seatId);
                      const isBooked = seat.status === 'BOOKED';
                      const isHeld = seat.status === 'HELD' && seat.heldBy !== user?.id;
                      const isHeldByMe = seat.status === 'HELD' && seat.heldBy === user?.id;

                      let className = 'w-7 h-7 rounded text-[9px] font-medium flex items-center justify-center cursor-pointer transition-all ';
                      if (isBooked) className += 'bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 text-red-400 cursor-not-allowed';
                      else if (isHeld) className += 'bg-orange-100 dark:bg-orange-900/50 border border-orange-300 dark:border-orange-700 text-orange-400 cursor-not-allowed';
                      else if (isSelected || isHeldByMe) className += 'bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-300 scale-110';
                      else if (seat.type === 'PREMIUM') className += 'bg-purple-50 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:scale-110';
                      else if (seat.type === 'VIP') className += 'bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:scale-110';
                      else className += 'bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/50 hover:scale-110';

                      return (
                        <button
                          key={seat.seatId}
                          onClick={() => handleSeatClick(seat)}
                          disabled={isBooked || isHeld}
                          className={className}
                          title={`${seat.seatId} - ${seat.type} - $${seat.price}`}
                        >
                          {seat.number}
                        </button>
                      );
                    })}
                    <span className="w-6 text-xs text-gray-500 font-mono text-center">{row}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Info className="h-4 w-4" />
              <span>Seats are held for 10 minutes. Complete your booking before the timer expires.</span>
            </div>
          </div>
        </div>

        {/* Sidebar - Booking Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 sticky top-20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Booking Summary</h3>
            
            {selectedSeats.length === 0 ? (
              <div className="text-center py-8">
                <Ticket className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Select seats from the map to proceed</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {selectedSeatData.map(seat => (
                    <div key={seat.seatId} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700 dark:text-gray-300">
                        Seat {seat.seatId} <span className="text-xs text-gray-500">({seat.type})</span>
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">${seat.price}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal ({selectedSeats.length} seats)</span>
                    <span className="text-gray-900 dark:text-white">${totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Tax (10%)</span>
                    <span className="text-gray-900 dark:text-white">${(totalAmount * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-indigo-600">${(totalAmount * 1.1).toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handleHoldSeats}
                  disabled={holding}
                  className="mt-4 w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {holding ? 'Holding Seats...' : 'Proceed to Checkout'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
