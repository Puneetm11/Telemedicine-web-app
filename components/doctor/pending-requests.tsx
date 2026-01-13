"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, XCircle, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface PendingAppointment {
  id: string
  scheduledAt: string
  status: string
  symptoms?: string
  patientFirstName: string
  patientLastName: string
  patientAvatar?: string
  patientId: string
}

interface PendingRequestsProps {
  appointments: PendingAppointment[]
}

export function PendingRequests({ appointments }: PendingRequestsProps) {
  const router = useRouter()
  const [processing, setProcessing] = useState<string | null>(null)

  const handleConfirm = async (appointmentId: string) => {
    setProcessing(appointmentId)
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/confirm`, {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Appointment confirmed successfully")
        router.refresh()
      } else {
        toast.error(data.error || "Failed to confirm appointment")
      }
    } catch (error) {
      toast.error("Failed to confirm appointment")
    } finally {
      setProcessing(null)
    }
  }

  const handleCancel = async (appointmentId: string) => {
    setProcessing(appointmentId)
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Appointment cancelled successfully")
        router.refresh()
      } else {
        toast.error(data.error || "Failed to cancel appointment")
      }
    } catch (error) {
      toast.error("Failed to cancel appointment")
    } finally {
      setProcessing(null)
    }
  }

  const handleStartChat = async (patientId: string, patientName: string) => {
    try {
      // Create or get conversation - pass patientId as user ID
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patientId }),
      })

      if (response.ok) {
        const conversation = await response.json()
        router.push(`/doctor/messages`)
        // Refresh to show the new conversation
        setTimeout(() => router.refresh(), 500)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to start conversation")
      }
    } catch (error) {
      toast.error("Failed to start conversation")
    }
  }

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">All caught up!</p>
        <p className="text-sm text-muted-foreground">No pending requests</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {appointments.map((apt) => (
        <div key={apt.id} className="flex items-center gap-4 p-3 rounded-lg border">
          <Avatar>
            <AvatarImage src={apt.patientAvatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {apt.patientFirstName[0]}
              {apt.patientLastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {apt.patientFirstName} {apt.patientLastName}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(apt.scheduledAt), "MMM d 'at' h:mm a")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-success hover:text-success"
              onClick={() => handleConfirm(apt.id)}
              disabled={processing === apt.id}
              title="Confirm appointment"
            >
              <CheckCircle className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-primary hover:text-primary"
              onClick={() => handleStartChat(apt.patientId, `${apt.patientFirstName} ${apt.patientLastName}`)}
              title="Start chat"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => handleCancel(apt.id)}
              disabled={processing === apt.id}
              title="Cancel appointment"
            >
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

