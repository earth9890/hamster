'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-graphite-950 px-4">
      <div className="text-center max-w-md">
        <h2 className="text-4xl font-display font-bold text-gradient mb-4">
          Oops! Something went wrong
        </h2>
        <p className="text-gray-400 mb-8">
          We encountered an unexpected error. Don&apos;t worry, we&apos;re working on it.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="btn-primary"
          >
            Try Again
          </button>
          <Link href="/landing" className="btn-secondary">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
