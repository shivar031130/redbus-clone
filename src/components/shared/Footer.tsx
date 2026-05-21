import Link from 'next/link';
import { Bus } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-primary p-2 rounded-lg">
                <Bus className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground tracking-tight">BusSphere</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Premium modern bus ticket booking for Malaysia. Simple, fast, and reliable.
            </p>
            <div className="flex gap-4 pt-2">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">FB</Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">TW</Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">IG</Link>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Bookings</h3>
            <ul className="space-y-3">
              <li><Link href="/search" className="text-sm text-muted-foreground hover:text-primary transition-colors">Find Tickets</Link></li>
              <li><Link href="/popular" className="text-sm text-muted-foreground hover:text-primary transition-colors">Popular Routes</Link></li>
              <li><Link href="/promotions" className="text-sm text-muted-foreground hover:text-primary transition-colors">Promotions</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="/operator-join" className="text-sm text-muted-foreground hover:text-primary transition-colors">Partner with Us</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              <li><Link href="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} BusSphere Malaysia. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span className="text-sm text-muted-foreground">Mock Payment Sandbox Mode</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
