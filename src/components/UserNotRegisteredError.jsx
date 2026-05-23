import React from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function UserNotRegisteredError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 text-center">
      <h1 className="text-2xl font-heading font-bold">Account Not Found</h1>
      <p className="text-muted-foreground max-w-md">
        Your account is not registered in this app. Please contact the administrator to get access.
      </p>
      <Button variant="outline" onClick={() => base44.auth.logout()}>
        Sign Out
      </Button>
    </div>
  );
}