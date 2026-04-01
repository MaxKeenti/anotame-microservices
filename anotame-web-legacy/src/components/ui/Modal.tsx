"use client";

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  description?: string;
}

export function Modal({ isOpen, onClose, title, children, footer, description }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-50 w-full max-w-lg">
        <Card className="shadow-lg border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{title}</CardTitle>
              <button
                onClick={onClose}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              >
                <span className="sr-only">Cerrar</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 18 18" />
                </svg>
              </button>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </CardHeader>
          <CardContent>
            {children}
          </CardContent>
          {footer && (
            <CardFooter className="flex justify-end gap-2">
              {footer}
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
