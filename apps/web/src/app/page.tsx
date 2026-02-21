import Link from 'next/link';
import { Button } from '@zapticket/ui';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold">ZapTicket</h1>
        <p className="text-xl text-muted-foreground">Open-source help desk and ticketing system</p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline">Get Started</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
