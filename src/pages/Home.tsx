import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Search, ArrowRight, Star, Users, Ticket } from 'lucide-react';
import { eventService } from '../services/api';
import { Event } from '../services/database';
import { format } from 'date-fns';

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const result = eventService.getAll({ limit: 6 });
    setEvents(result.events);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/events?search=${encodeURIComponent(searchQuery)}`;
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
              Discover Amazing Events
            </h1>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-10">
              Book tickets for concerts, conferences, comedy shows, and more. Your next unforgettable experience is just a click away.
            </p>
            <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
              <button type="submit" className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors">
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Ticket, label: 'Events', value: '100+' },
              { icon: Users, label: 'Happy Customers', value: '50K+' },
              { icon: MapPin, label: 'Venues', value: '25+' },
              { icon: Star, label: 'Rating', value: '4.9' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-4">
                <stat.icon className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Featured Events</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Don't miss out on these upcoming events</p>
            </div>
            <Link to="/events" className="hidden sm:flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link to="/events" className="inline-flex items-center gap-1 text-indigo-600 font-medium">
              View All Events <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-indigo-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Ready to Experience Something Amazing?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Join thousands of event-goers who trust TicketFlow for their ticket booking needs.</p>
          <Link to="/events" className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
            Browse Events <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  return (
    <Link to={`/events/${event.id}`} className="group block bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700">
      <div className="relative h-48 overflow-hidden">
        <img src={event.poster} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 dark:bg-gray-900/90 rounded-md text-xs font-medium text-indigo-600">
          {event.category}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1">
          {event.title}
        </h3>
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="h-4 w-4" />
          <span>{format(new Date(event.eventDate), 'MMM dd, yyyy')}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <MapPin className="h-4 w-4" />
          <span>{event.startTime}</span>
        </div>
        <div className="mt-3 flex justify-between items-center">
          <span className="text-lg font-bold text-indigo-600">${event.ticketPrice}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{event.availableSeats} seats left</span>
        </div>
      </div>
    </Link>
  );
}
