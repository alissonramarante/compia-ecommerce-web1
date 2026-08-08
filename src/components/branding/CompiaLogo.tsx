import { Link } from "react-router-dom";
import logo from "@/assets/compia-logo-2.png";
import { cn } from "@/lib/utils";

interface CompiaLogoProps {
  className?: string;
  asLink?: boolean;
  priority?: boolean;
}

export function CompiaLogo({
  className,
  asLink = true,
  priority,
}: CompiaLogoProps) {
  const img = (
    <img
      src={logo}
      alt="CompIA"
      width={886}
      height={659}
      loading={priority ? "eager" : "lazy"}
      className={cn("h-10 w-auto object-contain", className)}
    />
  );

  if (!asLink) return img;

  return (
    <Link
      to="/"
      aria-label="COMPIA — página inicial"
      className="inline-flex shrink-0"
    >
      {img}
    </Link>
  );
}
