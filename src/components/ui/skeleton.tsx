import React from "react";

export function Skeleton({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted/60 ${className ?? ""}`}
      style={style}
      {...props}
    />
  );
}
