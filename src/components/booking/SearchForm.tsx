'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar as CalendarIcon, Users, Search, Clock as ClockIcon, ChevronDown, ArrowRightLeft, X } from 'lucide-react';
import { useBookingStore } from '@/lib/store';
import { toast } from 'sonner';

const MALAYSIAN_HUBS = [
  { value: 'Kuala Lumpur', label: 'Kuala Lumpur (TBS)' },
  { value: 'Penang', label: 'Penang (Sungai Nibong)' },
  { value: 'Johor Bahru', label: 'Johor Bahru (Larkin)' },
  { value: 'Ipoh', label: 'Ipoh (Amanjaya)' },
  { value: 'Melaka', label: 'Melaka (Melaka Sentral)' },
  { value: 'Alor Setar', label: 'Alor Setar (Shahab Perdana)' },
  { value: 'Kuantan', label: 'Kuantan (Sentral)' },
  { value: 'Kuala Terengganu', label: 'Terengganu (MBKT)' },
  { value: 'Kota Bharu', label: 'Kota Bharu (Tesco)' },
  { value: 'Seremban', label: 'Seremban (Terminal 1)' },
  { value: 'Shah Alam', label: 'Shah Alam (Sec 17)' },
  { value: 'Kuching', label: 'Kuching (Sentosa)' },
  { value: 'Kota Kinabalu', label: 'Kota Kinabalu (Inanam)' },
];

export function SearchForm() {
  const router = useRouter();
  const { setSearchQuery } = useBookingStore();
  const [origin, setOrigin] = useState('Kuala Lumpur');
  const [destination, setDestination] = useState('Penang');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];
  
  const [date, setDate] = useState(defaultDateStr);
  const [returnDate, setReturnDate] = useState(''); // Empty by default (One-way)
  const [timeSlot, setTimeSlot] = useState('any');
  const [passengers, setPassengers] = useState(1);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !date) return;

    if (origin === destination) {
      toast.error("Origin and Destination cannot be the same location!");
      return;
    }

    if (returnDate && new Date(returnDate) < new Date(date)) {
      toast.error("Return date cannot be before departure date!");
      return;
    }

    setSearchQuery({
      origin,
      destination,
      date: new Date(date),
      passengers,
      // Optional: Add returnDate to your store if your store supports it
      // returnDate: returnDate ? new Date(returnDate) : undefined 
    });

    // Build URL query carefully
    let queryUrl = `/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${date}&passengers=${passengers}&timeSlot=${timeSlot}`;
    if (returnDate) {
      queryUrl += `&returnDate=${returnDate}`;
    }

    router.push(queryUrl);
  };

  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  return (
    <form 
      onSubmit={handleSearch} 
      className="w-full bg-white dark:bg-zinc-950 p-2 md:p-2.5 rounded-2xl shadow-2xl shadow-black/5 border border-zinc-100 dark:border-zinc-800"
    >
      <div className="flex flex-col lg:flex-row w-full bg-zinc-50 dark:bg-zinc-900/50 rounded-xl overflow-hidden items-stretch">
        
        {/* Origin */}
        <div className="relative flex-1 group cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors p-3 md:px-5 md:py-4 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800">
          <label htmlFor="origin" className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400 block mb-1 cursor-pointer">
            From
          </label>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <select
              id="origin"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              required
              className="w-full bg-transparent border-none p-0 text-base md:text-lg font-semibold text-zinc-900 dark:text-zinc-100 focus:ring-0 appearance-none cursor-pointer outline-none truncate"
            >
              {MALAYSIAN_HUBS.map(hub => (
                <option key={hub.value} value={hub.value}>{hub.label}</option>
              ))}
            </select>
          </div>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Swap Button (Absolute center between From/To on Desktop) */}
          <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 items-center justify-center">
            <button 
              type="button"
              onClick={handleSwap}
              className="h-8 w-8 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-center text-zinc-500 hover:text-primary hover:scale-110 transition-all focus:outline-none"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Destination */}
        <div className="relative flex-1 group cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors p-3 md:px-5 md:py-4 lg:pl-8 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800">
          <label htmlFor="destination" className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400 block mb-1 cursor-pointer">
            To
          </label>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <select
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              className="w-full bg-transparent border-none p-0 text-base md:text-lg font-semibold text-zinc-900 dark:text-zinc-100 focus:ring-0 appearance-none cursor-pointer outline-none truncate"
            >
              {MALAYSIAN_HUBS.map(hub => (
                <option key={hub.value} value={hub.value}>{hub.label}</option>
              ))}
            </select>
          </div>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Depart Date */}
        <div className="relative flex-1 group cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors p-3 md:px-5 md:py-4 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800">
          <label htmlFor="date" className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400 block mb-1 cursor-pointer">
            Depart
          </label>
          <div className="flex items-center gap-2 relative">
            <CalendarIcon className="h-4 w-4 text-zinc-400 shrink-0" />
            <input 
              id="date" 
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                // If return date is now before the new depart date, reset return date
                if (returnDate && new Date(returnDate) < new Date(e.target.value)) {
                  setReturnDate('');
                }
              }}
              required
              className="w-full bg-transparent border-none p-0 text-base md:text-lg font-semibold text-zinc-900 dark:text-zinc-100 focus:ring-0 appearance-none cursor-pointer outline-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0"
            />
          </div>
        </div>

        {/* Return Date (Optional) */}
        <div className="relative flex-1 group cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors p-3 md:px-5 md:py-4 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800">
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="returnDate" className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400 cursor-pointer">
              Return
            </label>
            {returnDate && (
              <button 
                type="button" 
                onClick={(e) => { e.preventDefault(); setReturnDate(''); }}
                className="text-[9px] font-bold uppercase tracking-widest text-primary hover:text-primary/70 flex items-center"
              >
                Clear <X className="h-3 w-3 ml-0.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 relative">
            <CalendarIcon className="h-4 w-4 text-zinc-400 shrink-0" />
            <div className="relative w-full">
              {!returnDate && (
                <div className="absolute inset-0 flex items-center text-base md:text-lg font-semibold text-zinc-400 dark:text-zinc-500 pointer-events-none">
                  + Add date
                </div>
              )}
              <input 
                id="returnDate" 
                type="date"
                min={date} // Return date cannot be before depart date
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className={`w-full bg-transparent border-none p-0 text-base md:text-lg font-semibold text-zinc-900 dark:text-zinc-100 focus:ring-0 appearance-none cursor-pointer outline-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 ${!returnDate ? 'text-transparent dark:text-transparent' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* Time Slot */}
        <div className="relative flex-[0.8] group cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors p-3 md:px-5 md:py-4 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800">
          <label htmlFor="timeSlot" className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400 block mb-1 cursor-pointer">
            Time
          </label>
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-zinc-400 shrink-0" />
            <select
              id="timeSlot"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              required
              className="w-full bg-transparent border-none p-0 text-base md:text-lg font-semibold text-zinc-900 dark:text-zinc-100 focus:ring-0 appearance-none cursor-pointer outline-none truncate"
            >
              <option value="any">Any Time</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </div>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Passengers */}
        <div className="relative flex-[0.6] group cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors p-3 md:px-4 md:py-4 border-b lg:border-b-0 border-zinc-200 dark:border-zinc-800">
          <label htmlFor="passengers" className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400 block mb-1 cursor-pointer">
            Pax
          </label>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-400 shrink-0" />
            <select
              id="passengers"
              value={passengers}
              onChange={(e) => setPassengers(parseInt(e.target.value))}
              required
              className="w-full bg-transparent border-none p-0 text-base md:text-lg font-semibold text-zinc-900 dark:text-zinc-100 focus:ring-0 appearance-none cursor-pointer outline-none"
            >
              {[1, 2, 3, 4, 5, 6].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Submit Button Block */}
        <div className="p-2 lg:pl-0 flex flex-col justify-center min-w-[160px] bg-white dark:bg-zinc-950">
          <Button 
            type="submit" 
            className="w-full h-full min-h-[56px] bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg hover:shadow-primary/25 transition-all duration-300 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest group"
          >
            <Search className="h-4 w-4 group-hover:scale-110 transition-transform" />
            Search
          </Button>
        </div>

      </div>
    </form>
  );
}