import type { ReactNode } from "react"
import { AuthCard } from "@/components/auth/auth-card"

interface AuthLayoutProps {
  variant?: "A" | "B"
  title: string
  description: string
  footer?: ReactNode
  children: ReactNode
}

export function PrototypeAuthLayout({
  title,
  description,
  footer,
  children,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <AuthCard title={title} description={description} footer={footer}>
        {children}
      </AuthCard>
    </div>
  )
}
