import { db, User, Event, Venue, Booking, Payment, Seat } from './database';
import { v4 as uuidv4 } from 'uuid';

// Auth Service
export const authService = {
  register(name: string, email: string, password: string): { user: Omit<User, 'password'>; token: string } {
    const existing = db.getUserByEmail(email);
    if (existing) throw new Error('Email already registered');
    if (password.length < 6) throw new Error('Password must be at least 6 characters');

    const user: User = {
      id: uuidv4(),
      name,
      email,
      password,
      role: 'USER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const users = db.getUsers();
    users.push(user);
    db.saveUsers(users);

    const token = btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 86400000 }));
    localStorage.setItem('tf_auth_token', token);
    localStorage.setItem('tf_current_user', JSON.stringify({ ...user, password: undefined }));

    const { password: _, ...safeUser } = user;
    return { user: safeUser as Omit<User, 'password'>, token };
  },

  login(email: string, password: string): { user: Omit<User, 'password'>; token: string } {
    const user = db.getUserByEmail(email);
    if (!user) throw new Error('Invalid email or password');
    if (user.password !== password) throw new Error('Invalid email or password');

    const token = btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 86400000 }));
    localStorage.setItem('tf_auth_token', token);
    localStorage.setItem('tf_current_user', JSON.stringify({ ...user, password: undefined }));

    const { password: _, ...safeUser } = user;
    return { user: safeUser as Omit<User, 'password'>, token };
  },

  logout(): void {
    localStorage.removeItem('tf_auth_token');
    localStorage.removeItem('tf_current_user');
  },

  getCurrentUser(): Omit<User, 'password'> | null {
    const token = localStorage.getItem('tf_auth_token');
    if (!token) return null;
    try {
      const decoded = JSON.parse(atob(token));
      if (decoded.exp < Date.now()) {
        this.logout();
        return null;
      }
      const userData = localStorage.getItem('tf_current_user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      this.logout();
      return null;
    }
  },

  updateProfile(userId: string, data: Partial<Pick<User, 'name' | 'avatar'>>): Omit<User, 'password'> {
    const users = db.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found');
    users[idx] = { ...users[idx], ...data, updatedAt: new Date().toISOString() };
    db.saveUsers(users);
    const { password: _, ...safeUser } = users[idx];
    localStorage.setItem('tf_current_user', JSON.stringify(safeUser));
    return safeUser as Omit<User, 'password'>;
  },

  changePassword(userId: string, oldPassword: string, newPassword: string): void {
    const users = db.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found');
    if (users[idx].password !== oldPassword) throw new Error('Current password is incorrect');
    if (newPassword.length < 6) throw new Error('New password must be at least 6 characters');
    users[idx].password = newPassword;
    users[idx].updatedAt = new Date().toISOString();
    db.saveUsers(users);
  },
};

// Event Service
export const eventService = {
  getAll(filters?: { search?: string; category?: string; city?: string; minPrice?: number; maxPrice?: number; sortBy?: string; page?: number; limit?: number }): { events: Event[]; total: number; page: number; totalPages: number } {
    let events = db.getEvents();
    const venues = db.getVenues();

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      events = events.filter(e => e.title.toLowerCase().includes(s) || e.description.toLowerCase().includes(s));
    }
    if (filters?.category && filters.category !== 'All') {
      events = events.filter(e => e.category === filters.category);
    }
    if (filters?.city && filters.city !== 'All') {
      const venueIds = venues.filter(v => v.city === filters.city).map(v => v.id);
      events = events.filter(e => venueIds.includes(e.venue));
    }
    if (filters?.minPrice) {
      events = events.filter(e => e.ticketPrice >= filters.minPrice!);
    }
    if (filters?.maxPrice) {
      events = events.filter(e => e.ticketPrice <= filters.maxPrice!);
    }

    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'date_asc': events.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()); break;
        case 'date_desc': events.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()); break;
        case 'price_asc': events.sort((a, b) => a.ticketPrice - b.ticketPrice); break;
        case 'price_desc': events.sort((a, b) => b.ticketPrice - a.ticketPrice); break;
        default: break;
      }
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 12;
    const total = events.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = events.slice((page - 1) * limit, page * limit);

    return { events: paginated, total, page, totalPages };
  },

  getById(id: string): Event | undefined {
    return db.getEventById(id);
  },

  create(data: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'availableSeats' | 'totalSeats'> & { venue: string }): Event {
    const venue = db.getVenueById(data.venue);
    if (!venue) throw new Error('Venue not found');

    const event: Event = {
      ...data,
      id: uuidv4(),
      totalSeats: venue.seatLayout.length,
      availableSeats: venue.seatLayout.filter(s => s.status === 'AVAILABLE').length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const events = db.getEvents();
    events.push(event);
    db.saveEvents(events);
    return event;
  },

  update(id: string, data: Partial<Event>): Event {
    const events = db.getEvents();
    const idx = events.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('Event not found');
    events[idx] = { ...events[idx], ...data, updatedAt: new Date().toISOString() };
    db.saveEvents(events);
    return events[idx];
  },

  delete(id: string): void {
    const events = db.getEvents().filter(e => e.id !== id);
    db.saveEvents(events);
  },

  getCategories(): string[] {
    const events = db.getEvents();
    return [...new Set(events.map(e => e.category))];
  },

  getCities(): string[] {
    const venues = db.getVenues();
    return [...new Set(venues.map(v => v.city))];
  },
};

// Venue Service
export const venueService = {
  getAll(): Venue[] { return db.getVenues(); },
  getById(id: string): Venue | undefined { return db.getVenueById(id); },
  create(data: Omit<Venue, 'id' | 'createdAt'>): Venue {
    const venue: Venue = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    const venues = db.getVenues();
    venues.push(venue);
    db.saveVenues(venues);
    return venue;
  },
  update(id: string, data: Partial<Venue>): Venue {
    const venues = db.getVenues();
    const idx = venues.findIndex(v => v.id === id);
    if (idx === -1) throw new Error('Venue not found');
    venues[idx] = { ...venues[idx], ...data };
    db.saveVenues(venues);
    return venues[idx];
  },
  delete(id: string): void {
    db.saveVenues(db.getVenues().filter(v => v.id !== id));
  },
};

// Seat Service
export const seatService = {
  getSeats(eventId: string): Seat[] {
    const event = db.getEventById(eventId);
    if (!event) throw new Error('Event not found');
    const venue = db.getVenueById(event.venue);
    if (!venue) throw new Error('Venue not found');
    
    // Check for expired holds
    const now = new Date().toISOString();
    let seats = [...venue.seatLayout];
    let changed = false;
    seats = seats.map(s => {
      if (s.status === 'HELD' && s.heldUntil && s.heldUntil < now) {
        changed = true;
        return { ...s, status: 'AVAILABLE' as const, heldBy: undefined, heldUntil: undefined };
      }
      return s;
    });
    if (changed) {
      venue.seatLayout = seats;
      const venues = db.getVenues();
      const idx = venues.findIndex(v => v.id === venue.id);
      venues[idx] = venue;
      db.saveVenues(venues);
    }
    return seats;
  },

  holdSeats(eventId: string, seatIds: string[], userId: string): Seat[] {
    const event = db.getEventById(eventId);
    if (!event) throw new Error('Event not found');
    const venue = db.getVenueById(event.venue);
    if (!venue) throw new Error('Venue not found');

    const now = new Date();
    const heldUntil = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
    const nowStr = now.toISOString();

    let seats = [...venue.seatLayout];
    
    // Expire old holds first
    seats = seats.map(s => {
      if (s.status === 'HELD' && s.heldUntil && s.heldUntil < nowStr) {
        return { ...s, status: 'AVAILABLE' as const, heldBy: undefined, heldUntil: undefined };
      }
      return s;
    });

    // Validate all seats are available
    for (const seatId of seatIds) {
      const seat = seats.find(s => s.seatId === seatId);
      if (!seat) throw new Error(`Seat ${seatId} not found`);
      if (seat.status === 'BOOKED') throw new Error(`Seat ${seatId} is already booked`);
      if (seat.status === 'HELD') throw new Error(`Seat ${seatId} is already held by another user`);
    }

    // Hold seats atomically
    seats = seats.map(s => {
      if (seatIds.includes(s.seatId)) {
        return { ...s, status: 'HELD' as const, heldBy: userId, heldUntil };
      }
      return s;
    });

    venue.seatLayout = seats;
    const venues = db.getVenues();
    const idx = venues.findIndex(v => v.id === venue.id);
    venues[idx] = venue;
    db.saveVenues(venues);

    return seats.filter(s => seatIds.includes(s.seatId));
  },

  releaseHold(eventId: string, seatIds: string[], userId: string): void {
    const event = db.getEventById(eventId);
    if (!event) return;
    const venue = db.getVenueById(event.venue);
    if (!venue) return;

    venue.seatLayout = venue.seatLayout.map(s => {
      if (seatIds.includes(s.seatId) && s.heldBy === userId) {
        return { ...s, status: 'AVAILABLE' as const, heldBy: undefined, heldUntil: undefined };
      }
      return s;
    });

    const venues = db.getVenues();
    const idx = venues.findIndex(v => v.id === venue.id);
    venues[idx] = venue;
    db.saveVenues(venues);
  },
};

// Booking Service
export const bookingService = {
  create(eventId: string, seatIds: string[], userId: string): Booking {
    const event = db.getEventById(eventId);
    if (!event) throw new Error('Event not found');
    const venue = db.getVenueById(event.venue);
    if (!venue) throw new Error('Venue not found');

    const seats = venue.seatLayout.filter(s => seatIds.includes(s.seatId));
    if (seats.length !== seatIds.length) throw new Error('Some seats are not available');
    
    // Verify all seats are held by this user
    for (const seat of seats) {
      if (seat.status !== 'HELD' || seat.heldBy !== userId) {
        throw new Error(`Seat ${seat.seatId} is not held by you`);
      }
    }

    const subtotal = seats.reduce((sum, s) => sum + s.price, 0);
    const tax = subtotal * 0.1;
    const discount = 0;
    const totalAmount = subtotal + tax - discount;

    const booking: Booking = {
      id: uuidv4(),
      bookingReference: `TF-${uuidv4().slice(0, 8).toUpperCase()}`,
      user: userId,
      event: eventId,
      venue: venue.id,
      seats: seatIds,
      quantity: seatIds.length,
      subtotal,
      tax,
      discount,
      totalAmount,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const bookings = db.getBookings();
    bookings.push(booking);
    db.saveBookings(bookings);

    return booking;
  },

  confirmPayment(bookingId: string, paymentId: string): Booking {
    const bookings = db.getBookings();
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx === -1) throw new Error('Booking not found');
    
    const booking = bookings[idx];
    if (booking.status === 'EXPIRED') throw new Error('Booking has expired');
    if (booking.paymentStatus === 'PAID') throw new Error('Booking already paid');

    // Mark seats as BOOKED
    const event = db.getEventById(booking.event);
    if (event) {
      const venue = db.getVenueById(event.venue);
      if (venue) {
        venue.seatLayout = venue.seatLayout.map(s => {
          if (booking.seats.includes(s.seatId)) {
            return { ...s, status: 'BOOKED' as const, heldBy: undefined, heldUntil: undefined };
          }
          return s;
        });
        const venues = db.getVenues();
        const vIdx = venues.findIndex(v => v.id === venue.id);
        venues[vIdx] = venue;
        db.saveVenues(venues);
      }

      // Update available seats
      const events = db.getEvents();
      const eIdx = events.findIndex(e => e.id === event.id);
      events[eIdx].availableSeats = Math.max(0, events[eIdx].availableSeats - booking.quantity);
      db.saveEvents(events);
    }

    bookings[idx].status = 'CONFIRMED';
    bookings[idx].paymentStatus = 'PAID';
    bookings[idx].updatedAt = new Date().toISOString();
    db.saveBookings(bookings);

    // Save payment record
    const payments = db.getPayments();
    payments.push({
      id: paymentId,
      booking: bookingId,
      provider: 'MockPaymentProvider',
      providerPaymentId: `PAY-${uuidv4().slice(0, 8)}`,
      amount: booking.totalAmount,
      currency: 'USD',
      status: 'SUCCESS',
      createdAt: new Date().toISOString(),
    });
    db.savePayments(payments);

    return bookings[idx];
  },

  cancel(bookingId: string, userId: string): Booking {
    const bookings = db.getBookings();
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx === -1) throw new Error('Booking not found');
    
    const booking = bookings[idx];
    if (booking.user !== userId) throw new Error('Unauthorized');
    if (booking.status === 'CANCELLED') throw new Error('Booking already cancelled');

    // Release seats
    const event = db.getEventById(booking.event);
    if (event) {
      const venue = db.getVenueById(event.venue);
      if (venue) {
        venue.seatLayout = venue.seatLayout.map(s => {
          if (booking.seats.includes(s.seatId)) {
            return { ...s, status: 'AVAILABLE' as const, heldBy: undefined, heldUntil: undefined };
          }
          return s;
        });
        const venues = db.getVenues();
        const vIdx = venues.findIndex(v => v.id === venue.id);
        venues[vIdx] = venue;
        db.saveVenues(venues);
      }

      const events = db.getEvents();
      const eIdx = events.findIndex(e => e.id === event.id);
      events[eIdx].availableSeats += booking.quantity;
      db.saveEvents(events);
    }

    bookings[idx].status = 'CANCELLED';
    bookings[idx].updatedAt = new Date().toISOString();
    db.saveBookings(bookings);
    return bookings[idx];
  },

  getByUser(userId: string): Booking[] {
    return db.getBookings().filter(b => b.user === userId);
  },

  getById(id: string): Booking | undefined {
    return db.getBookingById(id);
  },

  getAll(): Booking[] {
    return db.getBookings();
  },
};

// Payment Service (Mock)
export const paymentService = {
  createPayment(bookingId: string): { paymentId: string; status: string } {
    const booking = db.getBookingById(bookingId);
    if (!booking) throw new Error('Booking not found');
    const paymentId = uuidv4();
    return { paymentId, status: 'PENDING' };
  },

  verifyPayment(bookingId: string, paymentId: string): boolean {
    // Mock: always succeeds
    return true;
  },

  processPayment(bookingId: string): Booking {
    const paymentId = uuidv4();
    return bookingService.confirmPayment(bookingId, paymentId);
  },
};

// Admin Service
export const adminService = {
  getDashboard() {
    const users = db.getUsers();
    const events = db.getEvents();
    const bookings = db.getBookings();
    const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');
    const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');
    const revenue = confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const upcomingEvents = events.filter(e => e.status === 'UPCOMING');

    return {
      totalUsers: users.filter(u => u.role === 'USER').length,
      totalEvents: events.length,
      totalBookings: bookings.length,
      confirmedBookings: confirmedBookings.length,
      cancelledBookings: cancelledBookings.length,
      revenue,
      upcomingEvents: upcomingEvents.length,
    };
  },

  getUsers(): User[] {
    return db.getUsers();
  },

  deleteUser(id: string): void {
    db.saveUsers(db.getUsers().filter(u => u.id !== id));
  },
};
