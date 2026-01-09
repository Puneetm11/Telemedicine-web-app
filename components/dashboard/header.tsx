"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"

interface HeaderProps {
  title: string
  subtitle?: string
}

export function DashboardHeader({ title, subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="w-64 pl-9" />
        </div>

        <NotificationDropdown />
      </div>
    </header>
  )
}
