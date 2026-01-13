"use client"

import { useState, useEffect, useRef } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Message {
  id: number
  content: string
  sender_id: number
  sender_name: string
  sender_role: string
  is_read: boolean
  created_at: string
}

interface ChatWindowProps {
  conversationId: string
  otherUserName: string
  currentUserId: string
  onBack?: () => void
}

export function ChatWindow({ conversationId, otherUserName, currentUserId, onBack }: ChatWindowProps) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: messages = [], mutate: mutateMessages } = useSWR<Message[]>(
    `/api/conversations/${conversationId}/messages`,
    fetcher,
    { refreshInterval: 3000 },
  )

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!message.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      })

      if (res.ok) {
        const newMessage = await res.json()
        mutateMessages([...messages, newMessage], false)
        setMessage("")
      }
    } catch (error) {
      console.error("Send message error:", error)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) {
      return "Today"
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  // Group messages by date
  const groupedMessages = messages.reduce(
    (groups, msg) => {
      const date = formatDate(msg.created_at)
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(msg)
      return groups
    },
    {} as Record<string, Message[]>,
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Avatar>
          <AvatarFallback className="bg-primary/10 text-primary">
            {otherUserName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{otherUserName}</p>
          <p className="text-xs text-muted-foreground">Online</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-6">
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex justify-center mb-4">
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">{date}</span>
              </div>
              <div className="space-y-3">
                {msgs.map((msg) => {
                  const isOwn = msg.sender_id === currentUserId
                  return (
                    <div key={msg.id} className={cn("flex gap-2", isOwn ? "justify-end" : "justify-start")}>
                      {!isOwn && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-muted">
                            {msg.sender_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2",
                          isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
                        )}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={cn("text-xs mt-1", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}
                        >
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-card">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!message.trim() || sending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
