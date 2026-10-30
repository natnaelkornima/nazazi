import * as React from "react";
import { cn } from "@/lib/utils";

export interface GoogleIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  fill?: boolean;
  weight?: number;
  grade?: number;
  size?: number;
  className?: string;
}

export function GoogleIcon({
  name,
  fill = false,
  weight = 400,
  grade = 0,
  size,
  className,
  style,
  ...props
}: GoogleIconProps) {
  return (
    <span
      className={cn(
        "material-symbols-outlined select-none inline-flex items-center justify-center leading-none",
        className
      )}
      style={{
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${size || 24}`,
        fontSize: size ? `${size}px` : undefined,
        width: size ? `${size}px` : undefined,
        height: size ? `${size}px` : undefined,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    >
      {name}
    </span>
  );
}

export default GoogleIcon;
