import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className }: CardProps) => {
  return (
    <div
      className={`rounded-[10px] bg-white p-2 shadow-lg md:rounded-2xl md:p-4 ${className || ''}`}
    >
      {children}
    </div>
  );
};

export function CardContent({ children }: { children: ReactNode }) {
  return <div className="mt-2">{children}</div>;
}
