import React from "react";

interface DagimLogoProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

export default function DagimLogo({
  width = 200,
  height = 200,
  className = "",
}: DagimLogoProps) {
  return (
    <div
      className={`overflow-hidden rounded-full ${className}`}
      style={{ width, height }}
    >
      <img
        src="/images/logo/dagim-logo-cropped.png"
        alt="Dagim Gebeya"
        className="h-full w-full object-cover"
      />
    </div>
  );
}
