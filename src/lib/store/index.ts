import { create } from 'zustand';

export type UserRole = 'admin' | 'client' | 'operator' | null;

interface AuthState {
  user: any | null; // Will type properly with Supabase User
  role: UserRole;
  isLoading: boolean;
  setUser: (user: any, role: UserRole) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  isLoading: true,
  setUser: (user, role) => set({ user, role, isLoading: false }),
  clearUser: () => set({ user: null, role: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));

interface BookingState {
  searchQuery: {
    origin: string;
    destination: string;
    date: Date | null;
    passengers: number;
  } | null;
  selectedSchedule: any | null;
  selectedSeats: string[];
  passengerDetails: { seat: string; name: string; icPassport: string; age: string }[];
  contactEmail: string;
  contactPhone: string;
  setSearchQuery: (query: any) => void;
  setSelectedSchedule: (schedule: any) => void;
  toggleSeat: (seatNumber: string) => void;
  setSelectedSeats: (seatNumbers: string[]) => void;
  setPassengerDetails: (details: { seat: string; name: string; icPassport: string; age: string }[]) => void;
  setContactInfo: (email: string, phone: string) => void;
  clearBooking: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  searchQuery: null,
  selectedSchedule: null,
  selectedSeats: [],
  passengerDetails: [],
  contactEmail: '',
  contactPhone: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedSchedule: (schedule) => set((state) => {
    const sameSchedule = state.selectedSchedule?.id && schedule?.id && state.selectedSchedule.id === schedule.id;
    return {
      selectedSchedule: schedule,
      selectedSeats: sameSchedule ? state.selectedSeats : [],
      passengerDetails: sameSchedule ? state.passengerDetails : [],
      contactEmail: sameSchedule ? state.contactEmail : '',
      contactPhone: sameSchedule ? state.contactPhone : '',
    };
  }),
  toggleSeat: (seatNumber) => set((state) => ({
    selectedSeats: state.selectedSeats.includes(seatNumber)
      ? state.selectedSeats.filter(s => s !== seatNumber)
      : [...state.selectedSeats, seatNumber]
  })),
  setSelectedSeats: (seatNumbers) => set({ selectedSeats: seatNumbers }),
  setPassengerDetails: (details) => set({ passengerDetails: details }),
  setContactInfo: (email, phone) => set({ contactEmail: email, contactPhone: phone }),
  clearBooking: () => set({ searchQuery: null, selectedSchedule: null, selectedSeats: [], passengerDetails: [], contactEmail: '', contactPhone: '' }),
}));
