import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
};

export function Button({
  variant = "secondary",
  fullWidth,
  className = "",
  ...props
}: Props) {
  return (
    <button
      className={`button button-${variant} ${fullWidth ? "full-width" : ""} ${className}`}
      {...props}
    />
  );
}
