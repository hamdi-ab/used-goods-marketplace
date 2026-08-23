import type { ReactNode } from "react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-[#DBEAFE] to-[#EFF6FF]">
      {children}
    </div>
  )
}
