import type { ReactNode } from 'react';

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white px-6 py-4 shadow-lg">{children}</div>
  );
}

export function CardContent({ children }: { children: ReactNode }) {
  return <div className="mt-2">{children}</div>;
}
