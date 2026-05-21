'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function PassengerDetailsPage() {
  const router = useRouter();
  const { 
    selectedSchedule, 
    selectedSeats, 
    passengerDetails, 
    contactEmail: storeEmail, 
    contactPhone: storePhone, 
    setPassengerDetails, 
    setContactInfo 
  } = useBookingStore();
  const [loading, setLoading] = useState(false);

  // Simple state for passengers based on selected seats length
  const [passengers, setPassengers] = useState(() => {
    if (passengerDetails && passengerDetails.length === selectedSeats.length) {
      return passengerDetails;
    }
    return selectedSeats.map(seat => ({ seat, name: '', icPassport: '', age: '' }));
  });
  
  const [contactEmail, setContactEmail] = useState(storeEmail || '');
  const [contactPhone, setContactPhone] = useState(storePhone || '');

  useEffect(() => {
    if (!selectedSchedule || selectedSeats.length === 0) {
      router.push('/search');
    }
  }, [selectedSchedule, selectedSeats, router]);

  useEffect(() => {
    if (passengerDetails && passengerDetails.length === selectedSeats.length) {
      setPassengers(passengerDetails);
    }
  }, [selectedSeats, passengerDetails]);

  if (!selectedSchedule) return null;

  const handlePassengerChange = (index: number, field: string, value: string) => {
    const newPassengers = [...passengers];
    newPassengers[index] = { ...newPassengers[index], [field]: value };
    setPassengers(newPassengers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Save to the Zustand store so they are preserved
    setPassengerDetails(passengers);
    setContactInfo(contactEmail, contactPhone);
    
    setTimeout(() => {
      toast.success('Details saved successfully');
      router.push('/booking/checkout');
    }, 800);
  };

  const totalPrice = selectedSeats.length * selectedSchedule.price;

  return (
    <div className="flex-1 bg-secondary/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <Link href="/booking/seats" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Seat Selection
          </Link>
          <h1 className="text-3xl font-bold mt-4">Passenger Details</h1>
          <p className="text-muted-foreground mt-1">Please enter the details for all passengers.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Form Area */}
          <div className="flex-1 space-y-6">
            <form id="details-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Contact Info */}
              <Card className="border-none shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="bg-white border-b">
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                  <p className="text-sm text-muted-foreground">Your e-ticket will be sent to this email.</p>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                      <Input 
                        id="email" 
                        type="email" 
                        required 
                        placeholder="john@example.com"
                        value={contactEmail}
                        onChange={e => setContactEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                      <Input 
                        id="phone" 
                        type="tel" 
                        required 
                        placeholder="+60 12 345 6789"
                        value={contactPhone}
                        onChange={e => setContactPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Passengers Info */}
              {passengers.map((passenger, index) => (
                <Card key={passenger.seat} className="border-none shadow-sm rounded-xl overflow-hidden">
                  <CardHeader className="bg-white border-b flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Passenger {index + 1}</CardTitle>
                    </div>
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                      Seat {passenger.seat}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Full Name (as per IC/Passport) <span className="text-red-500">*</span></Label>
                        <Input 
                          required 
                          placeholder="Full Name"
                          value={passenger.name}
                          onChange={e => handlePassengerChange(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>IC / Passport Number <span className="text-red-500">*</span></Label>
                        <Input 
                          required 
                          placeholder="e.g. 900101-14-5123"
                          value={passenger.icPassport}
                          onChange={e => handlePassengerChange(index, 'icPassport', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Age</Label>
                        <Input 
                          type="number"
                          placeholder="e.g. 28"
                          value={passenger.age}
                          onChange={e => handlePassengerChange(index, 'age', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </form>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="w-full lg:w-96 shrink-0">
            <div className="sticky top-24">
              <Card className="border-none shadow-md rounded-2xl overflow-hidden">
                <div className="bg-primary p-6 text-white">
                  <h3 className="font-semibold text-lg mb-2">Journey Summary</h3>
                  <div className="flex justify-between text-sm text-blue-100">
                    <span>{selectedSchedule.operator}</span>
                    <span>{selectedSchedule.departureTime}</span>
                  </div>
                </div>
                
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pb-4 border-b">
                    <CheckCircle2 className="h-4 w-4 text-green-500" /> Seats Selected: {selectedSeats.join(', ')}
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-bold text-lg">Total Amount</span>
                    <span className="font-bold text-2xl text-primary">RM {totalPrice.toFixed(2)}</span>
                  </div>

                  <Button 
                    type="submit"
                    form="details-form"
                    className="w-full mt-4 h-12 text-lg rounded-xl"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Proceed to Payment'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
