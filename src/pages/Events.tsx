import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Calendar, MapPin, X, SlidersHorizontal } from 'lucide-react';
import { eventService } from '../services/api';
import { Event } from '../services/database';
import { format } from 'date-fns';

export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'All';
  const city = searchParams.get('city') || 'All';
  const sortBy = searchParams.get('sort') || 'date_asc';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const [localSearch, setLocalSearch] = useState(search);
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    setCategories(eventService.getCategories());
    setCities(eventService.getCities());
  }, []);

  useEffect(() => {
    const result = eventService.getAll({
      search,
      category: category !== 'All' ? category : undefined,
      city: city !== 'All' ? city : undefined,
      sortBy,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page,
      limit: 9,
    });
    setEvents(result.events);
    setTotal(result.total);
    setTotalPages(result.totalPages);
  }, [search, category, city, sortBy, minPrice, maxPrice, page]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('search', localSearch);
  };

  const clearFilters = () => {
    setSearchParams({});
    setLocalSearch('');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Browse Events</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Find and book tickets for amazing events</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
            Search
          </button>
        </form>
        <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category</label>
              <select value={category} onChange={(e) => updateFilter('category', e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                <option value="All">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">City</label>
              <select value={city} onChange={(e) => updateFilter('city', e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                <option value="All">All Cities</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Sort By</label>
              <select value={sortBy} onChange={(e) => updateFilter('sort', e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                <option value="date_asc">Date (Nearest)</option>
                <option value="date_desc">Date (Farthest)</option>
                <option value="price_asc">Price (Low to High)</option>
                <option value="price_desc">Price (High to Low)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Min Price</label>
              <input type="number" placeholder="$0" value={minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Max Price</label>
              <input type="number" placeholder="$999" value={maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600">
              <X className="h-4 w-4" /> Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Showing {events.length} of {total} events
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="text-center py-16">
          <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No events found</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <Link key={event.id} to={`/events/${event.id}`} className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700">
              <div className="relative h-48 overflow-hidden">
                <img src={event.poster} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 dark:bg-gray-900/90 rounded-md text-xs font-medium text-indigo-600">
                  {event.category}
                </div>
                <div className="absolute bottom-3 left-3 px-2 py-1 bg-indigo-600/90 rounded-md text-xs font-medium text-white">
                  ${event.ticketPrice}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {event.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{event.description}</p>
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{format(new Date(event.eventDate), 'MMM dd')}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{event.availableSeats} seats</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                p === page ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
