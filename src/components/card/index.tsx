import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className }: CardProps) => {
  return (
    <div
      className={`rounded-[8px] bg-white px-2 py-1 shadow-md md:rounded-xl md:px-4 md:py-2 ${className || ''}`}
    >
      {children}
    </div>
  );
};

export function CardContent({ children }: { children: ReactNode }) {
  return <div className="mt-2">{children}</div>;
}
