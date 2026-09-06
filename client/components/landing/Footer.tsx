import Link from "next/link";
import { Cpu } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border/80 pt-16 pb-8">
      <div className="container mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          
          <div className="col-span-2 lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
                <Cpu className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-foreground">
                Labhya Compute
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs leading-relaxed">
              Peer-to-peer GPU marketplace for AI builders, researchers, and developers. Rent high-performance compute on demand.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-3 text-foreground text-sm uppercase tracking-wider text-[11px]">Product</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
              <li><Link href="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
              <li><Link href="/marketplace" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link href="/login" className="hover:text-foreground transition-colors">Sessions</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-3 text-foreground text-sm uppercase tracking-wider text-[11px]">Company</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
              <li><span className="text-muted-foreground/60 cursor-not-allowed">About</span></li>
              <li><Link href="/register/host" className="hover:text-foreground transition-colors">Become a Host</Link></li>
              <li><span className="text-muted-foreground/60 cursor-not-allowed">Contact</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-3 text-foreground text-sm uppercase tracking-wider text-[11px]">Account</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
              <li><Link href="/login" className="hover:text-foreground transition-colors">Login</Link></li>
              <li><Link href="/register" className="hover:text-foreground transition-colors">Register</Link></li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-border/60 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {currentYear} Labhya Compute. All rights reserved.</p>
          <div className="flex space-x-6">
            <span className="hover:text-foreground transition-colors cursor-not-allowed opacity-60">Terms of Service</span>
            <span className="hover:text-foreground transition-colors cursor-not-allowed opacity-60">Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
