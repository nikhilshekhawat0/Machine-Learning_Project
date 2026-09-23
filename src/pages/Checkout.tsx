import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CreditCard, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { eventService, bookingService, paymentService, venueService } from '../services/api';
import { Event, Booking } from '../services/database';
import { useAppSelector, useAppDispatch, addToast } from '../store';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector(s => s.auth);

  const eventId = searchParams.get('event');
  const seatIds = searchParams.get('seats')?.split(',').filter(Boolean) || [];

  const [event, setEvent] = useState<Event | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'review' | 'payment' | 'confirmed'>('review');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (eventId) {
      const ev = eventService.getById(eventId);
      if (ev) setEvent(ev);
    }
  }, [eventId, isAuthenticated, navigate]);

  const handleCreateBooking = () => {
    if (!eventId || !user || seatIds.length === 0) return;
    try {
      const b = bookingService.create(eventId, seatIds, user.id);
      setBooking(b);
      setStep('payment');
    } catch (err: any) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    }
  };

  const handlePayment = () => {
    if (!booking) return;
    if (!cardNumber || !cardExpiry || !cardCvc) {
      dispatch(addToast({ message: 'Please fill in all payment details', type: 'error' }));
      return;
    }

    setProcessing(true);
    setTimeout(() => {
      try {
        const confirmed = paymentService.processPayment(booking.id);
        setBooking(confirmed);
        setStep('confirmed');
        dispatch(addToast({ message: 'Booking confirmed! 🎉', type: 'success' }));
      } catch (err: any) {
        dispatch(addToast({ message: err.message, type: 'error' }));
      } finally {
        setProcessing(false);
      }
    }, 2000);
  };

  if (!event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Event not found</h2>
        <button onClick={() => navigate('/events')} className="mt-4 text-indigo-600 hover:underline">Browse events</button>
      </div>
    );
  }

  const venue = venueService.getById(event.venue);
  const selectedSeats = venue?.seatLayout.filter(s => seatIds.includes(s.seatId)) || [];
  const subtotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {['Review', 'Payment', 'Confirmed'].map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 ${
              (step === 'review' && i === 0) || (step === 'payment' && i <= 1) || (step === 'confirmed' && i <= 2)
                ? 'text-indigo-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                (step === 'review' && i === 0) || (step === 'payment' && i <= 1) || (step === 'confirmed' && i <= 2)
                  ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>
                {i + 1}
              </div>
              <span className="text-sm font-medium hidden sm:block">{s}</span>
            </div>
            {i < 2 && <div className="w-12 sm:w-20 h-0.5 bg-gray-200 dark:bg-gray-700 mx-2" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step: Review */}
      {step === 'review' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Order Review</h2>
          
          <div className="flex gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <img src={event.poster} alt={event.title} className="w-20 h-20 rounded-lg object-cover" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{event.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{venue?.name}, {venue?.city}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{event.startTime}</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm">Selected Seats:</h4>
            {selectedSeats.map(seat => (
              <div key={seat.seatId} className="flex justify-between text-sm py-1">
                <span className="text-gray-600 dark:text-gray-400">
                  {seat.seatId} ({seat.type}) - Row {seat.row}
                </span>
                <span className="text-gray-900 dark:text-white">${seat.price.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tax (10%)</span>
              <span className="text-gray-900 dark:text-white">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
              <span className="text-gray-900 dark:text-white">Total</span>
              <span className="text-indigo-600">${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCreateBooking}
            className="mt-6 w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Continue to Payment
          </button>
        </div>
      )}

      {/* Step: Payment */}
      {step === 'payment' && booking && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-green-600" /> Secure Payment
          </h2>

          <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Amount to pay</span>
              <span className="text-xl font-bold text-indigo-600">${total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Booking Ref: {booking.bookingReference}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card Number</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  placeholder="4242 4242 4242 4242"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry</label>
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value.slice(0, 5))}
                  placeholder="MM/YY"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CVC</label>
                <input
                  type="text"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="123"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-xs text-yellow-700 dark:text-yellow-400">
            <p>🔒 This is a mock payment. Use any card number to proceed.</p>
          </div>

          <button
            onClick={handlePayment}
            disabled={processing}
            className="mt-6 w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" /> Pay ${total.toFixed(2)}
              </>
            )}
          </button>
        </div>
      )}

      {/* Step: Confirmed */}
      {step === 'confirmed' && booking && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Your tickets have been booked successfully.</p>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Reference</p>
                <p className="font-medium text-gray-900 dark:text-white">{booking.bookingReference}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Event</p>
                <p className="font-medium text-gray-900 dark:text-white">{event.title}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Seats</p>
                <p className="font-medium text-gray-900 dark:text-white">{booking.seats.join(', ')}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Amount</p>
                <p className="font-medium text-indigo-600">${booking.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(`/ticket/${booking.id}`)}
              className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
            >
              View Ticket
            </button>
            <button
              onClick={() => navigate('/my-bookings')}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              My Bookings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
