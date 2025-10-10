import { Link, useLocation } from "wouter";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DA</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800">Disha AI</h1>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/dashboard"
              className={`transition-colors ${
                location === '/dashboard'
                  ? 'text-primary'
                  : 'text-slate-600 hover:text-primary'
              }`}
              data-testid="link-dashboard"
            >
              Dashboard
            </Link>
            <Link
              href="/matches"
              className={`transition-colors ${
                location === '/matches'
                  ? 'text-primary'
                  : 'text-slate-600 hover:text-primary'
              }`}
              data-testid="link-matches"
            >
              Matches
            </Link>
            <Link
              href="/#opportunities"
              className="text-slate-600 hover:text-primary transition-colors"
              data-testid="link-opportunities"
            >
              Opportunities
            </Link>
            <Link
              href="/profile"
              className={`transition-colors ${
                location === '/profile'
                  ? 'text-primary'
                  : 'text-slate-600 hover:text-primary'
              }`}
              data-testid="link-profile"
            >
              Profile
            </Link>
            <Link
              href="/#guidance"
              className="text-slate-600 hover:text-primary transition-colors"
              data-testid="link-guidance"
            >
              Guidance
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" data-testid="button-notifications">
              <Bell className="w-5 h-5" />
            </Button>
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="rounded-full" data-testid="avatar-user">
                <User className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}