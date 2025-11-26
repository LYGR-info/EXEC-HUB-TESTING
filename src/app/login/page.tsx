'use client';

import { Button } from '@/components/ui/button';
import { useAuth, initiateAnonymousSignIn, initiateGoogleSignIn } from '@/firebase';
import { Briefcase, LogIn } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';

export default function LoginPage() {
  const auth = useAuth();

  const handleAnonymousSignIn = () => {
    initiateAnonymousSignIn(auth);
  };

  const handleGoogleSignIn = () => {
    initiateGoogleSignIn(auth);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
           <Briefcase className="h-16 w-16 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-headline">
            Executive Hub
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your central hub for top-tier management.
          </p>
        </div>
        <div className="flex flex-col items-center space-y-4">
          <Button onClick={handleGoogleSignIn} size="lg" className="w-full max-w-xs">
            <FaGoogle className="mr-2 h-5 w-5" />
            Sign In with Google
          </Button>
          <Button onClick={handleAnonymousSignIn} size="lg" variant="outline" className="w-full max-w-xs">
            <LogIn className="mr-2 h-5 w-5" />
            Sign In Anonymously
          </Button>
        </div>
        <p className="px-8 text-center text-sm text-muted-foreground">
          Sign in with Google to sync your calendar and contacts. Anonymous sign-in provides temporary access.
        </p>
      </div>
    </div>
  );
}
