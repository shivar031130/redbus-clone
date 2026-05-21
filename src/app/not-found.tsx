import Link from 'next/link';
import { Bus, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      {/* Animated Bus */}
      <div className="relative mb-8">
        <div className="text-[120px] leading-none select-none animate-bounce">🚌</div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-4 bg-slate-200 rounded-full blur-sm opacity-60" />
      </div>

      <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-semibold mb-6">
        <Bus className="h-4 w-4" />
        404 — Page Not Found
      </div>

      <h1 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight">
        Wrong stop!
      </h1>
      <p className="text-xl text-slate-500 max-w-md mb-10 leading-relaxed">
        The page you're looking for has departed or doesn't exist. Let's get you back on track.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <Search className="h-4 w-4" />
          Find a Route
        </Link>
      </div>

      <div className="mt-16 text-sm text-slate-400">
        Need help?{' '}
        <Link href="/contact" className="text-primary hover:underline font-medium">
          Contact Support
        </Link>
      </div>
    </div>
  );
}
