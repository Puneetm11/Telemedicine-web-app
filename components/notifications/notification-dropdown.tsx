"use client"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Calendar, MessageSquare, FileText, CreditCard, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Notification {
  id: number
  type: string
  title: string
  message: string
  is_read: boolean
  related_id: number | null
  related_type: string | null
  created_at: string
}

export function NotificationDropdown() {
  const { data, mutate } = useSWR<{ notifications: Notification[]; unreadCount: number }>(
    "/api/notifications",
    fetcher,
    { refreshInterval: 30000 },
  )

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  const handleMarkRead = async (id: number) => {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" })
    mutate()
  }

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" })
    mutate()
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-4 w-4" />
      case "message":
        return <MessageSquare className="h-4 w-4" />
      case "prescription":
        return <FileText className="h-4 w-4" />
      case "payment":
        return <CreditCard className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const formatTime = (date: string) => {
    const now = new Date()
    const d = new Date(date)
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return d.toLocaleDateString()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs" onClick={handleMarkAllRead}>
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">No notifications yet</div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn("flex items-start gap-3 p-3 cursor-pointer", !notification.is_read && "bg-primary/5")}
                onClick={() => handleMarkRead(notification.id)}
              >
                <div
                  className={cn("p-2 rounded-full", notification.is_read ? "bg-muted" : "bg-primary/10 text-primary")}
                >
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm truncate", !notification.is_read && "font-medium")}>{notification.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatTime(notification.created_at)}</p>
                </div>
                {!notification.is_read && <div className="h-2 w-2 rounded-full bg-primary mt-1" />}
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
