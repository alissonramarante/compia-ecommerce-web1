import type { Bandeira } from "@/lib/card";
import { CreditCard } from "lucide-react";

interface CardBrandIconProps {
  bandeira: Bandeira;
  className?: string;
}

export function CardBrandIcon({ bandeira, className }: CardBrandIconProps) {
  const base = "shrink-0 " + (className ?? "size-8");

  switch (bandeira) {
    case "visa":
      return (
        <svg viewBox="0 0 48 32" className={base} role="img" aria-label="Visa">
          <rect width="48" height="32" rx="4" fill="#1A1F71" />
          <text
            x="24"
            y="21"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontStyle="italic"
            fontWeight="700"
            fontSize="13"
            fill="#ffffff"
          >
            VISA
          </text>
        </svg>
      );

    case "mastercard":
      return (
        <svg viewBox="0 0 48 32" className={base} role="img" aria-label="Mastercard">
          <rect width="48" height="32" rx="4" fill="#16161d" />
          <circle cx="20" cy="16" r="9" fill="#EB001B" />
          <circle cx="29" cy="16" r="9" fill="#F79E1B" fillOpacity="0.9" />
        </svg>
      );

    case "amex":
      return (
        <svg viewBox="0 0 48 32" className={base} role="img" aria-label="American Express">
          <rect width="48" height="32" rx="4" fill="#2E77BC" />
          <text
            x="24"
            y="20"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontWeight="700"
            fontSize="10"
            fill="#ffffff"
          >
            AMEX
          </text>
        </svg>
      );

    case "elo":
      return (
        <svg viewBox="0 0 48 32" className={base} role="img" aria-label="Elo">
          <rect width="48" height="32" rx="4" fill="#000000" />
          <circle cx="17" cy="16" r="7" fill="#FFD400" />
          <circle cx="24" cy="16" r="7" fill="#00A4E0" fillOpacity="0.9" />
          <circle cx="31" cy="16" r="7" fill="#EF4123" fillOpacity="0.85" />
        </svg>
      );

    case "hipercard":
      return (
        <svg viewBox="0 0 48 32" className={base} role="img" aria-label="Hipercard">
          <rect width="48" height="32" rx="4" fill="#822124" />
          <text
            x="24"
            y="20"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontWeight="700"
            fontSize="9"
            fill="#ffffff"
          >
            HIPER
          </text>
        </svg>
      );

    case "diners":
      return (
        <svg viewBox="0 0 48 32" className={base} role="img" aria-label="Diners Club">
          <rect width="48" height="32" rx="4" fill="#0079BE" />
          <circle cx="24" cy="16" r="9" fill="#ffffff" />
          <circle cx="24" cy="16" r="5" fill="#0079BE" />
        </svg>
      );

    case "discover":
      return (
        <svg viewBox="0 0 48 32" className={base} role="img" aria-label="Discover">
          <rect width="48" height="32" rx="4" fill="#1B1B1B" />
          <circle cx="34" cy="16" r="7" fill="#FF6000" />
          <text
            x="20"
            y="20"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontWeight="700"
            fontSize="8"
            fill="#ffffff"
          >
            DISC
          </text>
        </svg>
      );

    default:
      return (
        <div
          className={`${base} flex items-center justify-center rounded bg-muted text-muted-foreground`}
        >
          <CreditCard className="size-4" />
        </div>
      );
  }
}
