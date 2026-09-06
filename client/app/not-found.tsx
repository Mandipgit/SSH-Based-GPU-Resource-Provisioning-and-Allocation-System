import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center space-y-6">
      <AlertCircle className="h-16 w-16 text-destructive" />
      <h2 className="text-3xl font-bold tracking-tight">404 - Page Not Found</h2>
      <p className="text-muted-foreground">The page you are looking for does not exist or has been moved.</p>
      <Link
        href="/"
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        Return Home
      </Link>
    </div>
  );
}
