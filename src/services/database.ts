import { v4 as uuidv4 } from 'uuid';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'USER' | 'ADMIN';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Seat {
  seatId: string;
  row: string;
  number: number;
  type: 'REGULAR' | 'VIP' | 'PREMIUM';
  price: number;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED';
  heldBy?: string;
  heldUntil?: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  capacity: number;
  seatLayout: Seat[];
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  poster: string;
  venue: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  ticketPrice: number;
  totalSeats: number;
  availableSeats: number;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  bookingReference: string;
  user: string;
  event: string;
  venue: string;
  seats: string[];
  quantity: number;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  booking: string;
  provider: string;
  providerPaymentId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  createdAt: string;
}

// Database class using localStorage
class Database {
  private getCollection<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private setCollection<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Users
  getUsers(): User[] { return this.getCollection<User>('tf_users'); }
  saveUsers(users: User[]): void { this.setCollection('tf_users', users); }
  getUserById(id: string): User | undefined { return this.getUsers().find(u => u.id === id); }
  getUserByEmail(email: string): User | undefined { return this.getUsers().find(u => u.email === email); }

  // Venues
  getVenues(): Venue[] { return this.getCollection<Venue>('tf_venues'); }
  saveVenues(venues: Venue[]): void { this.setCollection('tf_venues', venues); }
  getVenueById(id: string): Venue | undefined { return this.getVenues().find(v => v.id === id); }

  // Events
  getEvents(): Event[] { return this.getCollection<Event>('tf_events'); }
  saveEvents(events: Event[]): void { this.setCollection('tf_events', events); }
  getEventById(id: string): Event | undefined { return this.getEvents().find(e => e.id === id); }

  // Bookings
  getBookings(): Booking[] { return this.getCollection<Booking>('tf_bookings'); }
  saveBookings(bookings: Booking[]): void { this.setCollection('tf_bookings', bookings); }
  getBookingById(id: string): Booking | undefined { return this.getBookings().find(b => b.id === id); }

  // Payments
  getPayments(): Payment[] { return this.getCollection<Payment>('tf_payments'); }
  savePayments(payments: Payment[]): void { this.setCollection('tf_payments', payments); }

  // Initialize seed data
  seed(): void {
    if (localStorage.getItem('tf_seeded')) return;

    const now = new Date().toISOString();

    // Admin user
    const adminUser: User = {
      id: uuidv4(),
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'ChangeMe123!',
      role: 'ADMIN',
      createdAt: now,
      updatedAt: now,
    };

    const demoUser: User = {
      id: uuidv4(),
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      role: 'USER',
      createdAt: now,
      updatedAt: now,
    };

    const demoUser2: User = {
      id: uuidv4(),
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'Password123!',
      role: 'USER',
      createdAt: now,
      updatedAt: now,
    };

    this.saveUsers([adminUser, demoUser, demoUser2]);

    // Venues
    const generateSeats = (rows: number, cols: number, basePrice: number): Seat[] => {
      const seats: Seat[] = [];
      const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let r = 0; r < rows; r++) {
        for (let c = 1; c <= cols; c++) {
          const row = rowLetters[r];
          let type: 'REGULAR' | 'VIP' | 'PREMIUM' = 'REGULAR';
          let price = basePrice;
          if (r < 2) { type = 'PREMIUM'; price = basePrice * 2; }
          else if (r < 4) { type = 'VIP'; price = basePrice * 1.5; }
          seats.push({
            seatId: `${row}${c}`,
            row,
            number: c,
            type,
            price,
            status: 'AVAILABLE',
          });
        }
      }
      return seats;
    };

    const venue1: Venue = {
      id: uuidv4(),
      name: 'Grand Arena',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      capacity: 200,
      seatLayout: generateSeats(10, 20, 25),
      createdAt: now,
    };

    const venue2: Venue = {
      id: uuidv4(),
      name: 'Sunset Amphitheater',
      address: '456 Ocean Blvd',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      capacity: 150,
      seatLayout: generateSeats(8, 18, 30),
      createdAt: now,
    };

    const venue3: Venue = {
      id: uuidv4(),
      name: 'Royal Concert Hall',
      address: '789 Music Ave',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      capacity: 120,
      seatLayout: generateSeats(6, 20, 35),
      createdAt: now,
    };

    this.saveVenues([venue1, venue2, venue3]);

    // Events
    const futureDate = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString();
    };

    const events: Event[] = [
      {
        id: uuidv4(),
        title: 'Rock Festival 2026',
        description: 'The biggest rock festival of the year featuring top bands from around the world. Experience electrifying performances, incredible light shows, and unforgettable music.',
        category: 'Music',
        poster: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop',
        venue: venue1.id,
        eventDate: futureDate(14),
        startTime: '19:00',
        endTime: '23:00',
        ticketPrice: 75,
        totalSeats: 200,
        availableSeats: 200,
        status: 'UPCOMING',
        createdBy: adminUser.id,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        title: 'Jazz Night Live',
        description: 'An intimate evening of smooth jazz featuring legendary musicians. Enjoy world-class performances in an elegant setting.',
        category: 'Music',
        poster: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&h=400&fit=crop',
        venue: venue3.id,
        eventDate: futureDate(7),
        startTime: '20:00',
        endTime: '23:00',
        ticketPrice: 55,
        totalSeats: 120,
        availableSeats: 120,
        status: 'UPCOMING',
        createdBy: adminUser.id,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        title: 'Tech Conference 2026',
        description: 'Join industry leaders and innovators for a day of cutting-edge talks, workshops, and networking. Learn about AI, blockchain, and the future of tech.',
        category: 'Conference',
        poster: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop',
        venue: venue1.id,
        eventDate: futureDate(30),
        startTime: '09:00',
        endTime: '18:00',
        ticketPrice: 150,
        totalSeats: 200,
        availableSeats: 200,
        status: 'UPCOMING',
        createdBy: adminUser.id,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        title: 'Stand-Up Comedy Night',
        description: 'Get ready to laugh! Top comedians bring their best material for an evening of non-stop entertainment and hilarious performances.',
        category: 'Comedy',
        poster: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=600&h=400&fit=crop',
        venue: venue2.id,
        eventDate: futureDate(5),
        startTime: '20:00',
        endTime: '22:30',
        ticketPrice: 40,
        totalSeats: 150,
        availableSeats: 150,
        status: 'UPCOMING',
        createdBy: adminUser.id,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        title: 'Shakespeare in the Park',
        description: 'Experience the magic of Shakespeare performed live under the stars. A timeless classic brought to life by talented actors.',
        category: 'Theater',
        poster: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&h=400&fit=crop',
        venue: venue2.id,
        eventDate: futureDate(21),
        startTime: '19:30',
        endTime: '22:00',
        ticketPrice: 45,
        totalSeats: 150,
        availableSeats: 150,
        status: 'UPCOMING',
        createdBy: adminUser.id,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        title: 'Electronic Dance Marathon',
        description: 'Dance the night away at the ultimate EDM experience. World-renowned DJs, stunning visuals, and an atmosphere like no other.',
        category: 'Music',
        poster: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=400&fit=crop',
        venue: venue1.id,
        eventDate: futureDate(10),
        startTime: '21:00',
        endTime: '04:00',
        ticketPrice: 65,
        totalSeats: 200,
        availableSeats: 200,
        status: 'UPCOMING',
        createdBy: adminUser.id,
        createdAt: now,
        updatedAt: now,
      },
    ];

    this.saveEvents(events);
    this.saveBookings([]);
    this.savePayments([]);
    localStorage.setItem('tf_seeded', 'true');
    localStorage.setItem('tf_admin_id', adminUser.id);
  }

  reset(): void {
    localStorage.removeItem('tf_seeded');
    localStorage.removeItem('tf_users');
    localStorage.removeItem('tf_venues');
    localStorage.removeItem('tf_events');
    localStorage.removeItem('tf_bookings');
    localStorage.removeItem('tf_payments');
    localStorage.removeItem('tf_auth_token');
    localStorage.removeItem('tf_current_user');
    this.seed();
  }
}

export const db = new Database();
