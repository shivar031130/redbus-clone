'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Clock, ArrowRight, Ticket, QrCode } from 'lucide-react';
import Link from 'next/link';

export default function ClientDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here is an overview of your trips.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-primary text-white">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
            <Ticket className="h-8 w-8 mb-4 opacity-80" />
            <div className="text-4xl font-bold mb-1">1</div>
            <div className="text-rose-100 font-medium">Upcoming Trip</div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm md:col-span-2 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-accent"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              Next Journey
              <span className="text-xs font-semibold bg-accent/20 text-accent-foreground px-2 py-1 rounded-full">CONFIRMED</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row justify-between gap-6 mt-4">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 text-center font-bold text-lg text-primary">08:00</div>
                  <div className="w-2 h-2 rounded-full bg-primary ring-4 ring-primary/20 shrink-0"></div>
                  <div className="flex-1 text-sm font-medium">Kuala Lumpur (TBS)</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 text-center font-bold text-lg text-primary">13:00</div>
                  <div className="w-2 h-2 rounded-full bg-border shrink-0"></div>
                  <div className="flex-1 text-sm font-medium">Penang (Sungai Nibong)</div>
                </div>
              </div>
              
              <div className="flex flex-col items-start sm:items-end justify-between border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-6 border-dashed">
                <div className="text-sm space-y-1 mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> Tomorrow</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Ticket className="h-4 w-4" /> Seat 12A, 12B</div>
                </div>
                <Button className="w-full sm:w-auto" variant="outline">
                  <QrCode className="mr-2 h-4 w-4" /> View Ticket
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold pt-4">Recent Bookings</h2>
      <Card className="border-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Booking Ref</th>
                <th className="px-6 py-4 font-medium">Route</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-secondary/20 transition-colors">
                <td className="px-6 py-4 font-mono font-medium">BSM-991204</td>
                <td className="px-6 py-4 flex items-center gap-2">
                  KL <ArrowRight className="h-3 w-3 text-muted-foreground" /> Penang
                </td>
                <td className="px-6 py-4 text-muted-foreground">Tomorrow</td>
                <td className="px-6 py-4">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">Confirmed</span>
                </td>
                <td className="px-6 py-4">
                  <Link href="/history" className="text-primary hover:underline font-medium">Details</Link>
                </td>
              </tr>
              <tr className="hover:bg-secondary/20 transition-colors">
                <td className="px-6 py-4 font-mono font-medium">BSM-442199</td>
                <td className="px-6 py-4 flex items-center gap-2">
                  JB <ArrowRight className="h-3 w-3 text-muted-foreground" /> KL
                </td>
                <td className="px-6 py-4 text-muted-foreground">12 Jan 2026</td>
                <td className="px-6 py-4">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">Completed</span>
                </td>
                <td className="px-6 py-4">
                  <Link href="/history" className="text-primary hover:underline font-medium">Details</Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
