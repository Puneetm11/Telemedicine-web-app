"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Calendar, Clock, Video, X, Loader2 } from "lucide-react"
import { format, isPast, isToday } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

interface Appointment {
  id: string
  scheduledAt: string
  durationMinutes: number
  status: string
  type: string
  symptoms?: string
  notes?: string
  meetingLink?: string
  doctorId: string
  doctorFirstName: string
  doctorLastName: string
  doctorAvatar?: string
  specialization: string
  consultationFee: number
}

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/appointments")
      const data = await response.json()
      if (data.success) {
        setAppointments(data.data)
      }
    } catch (error) {
      console.error("Error fetching appointments:", error)
      toast.error("Failed to load appointments")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelId) return
    setCancelling(true)

    try {
      const response = await fetch(`/api/appointments/${cancelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success("Appointment cancelled")
        fetchAppointments()
      } else {
        toast.error(data.error || "Failed to cancel appointment")
      }
    } catch {
      toast.error("Failed to cancel appointment")
    } finally {
      setCancelling(false)
      setCancelId(null)
    }
  }

  const upcomingAppointments = appointments.filter(
    (a) => !isPast(new Date(a.scheduledAt)) && a.status !== "cancelled" && a.status !== "completed",
  )
  const pastAppointments = appointments.filter(
    (a) => isPast(new Date(a.scheduledAt)) || a.status === "completed" || a.status === "cancelled",
  )

  const getStatusBadge = (status: string, scheduledAt: string) => {
    if (status === "cancelled") {
      return <Badge variant="destructive">Cancelled</Badge>
    }
    if (status === "completed") {
      return <Badge variant="secondary">Completed</Badge>
    }
    if (status === "confirmed") {
      if (isToday(new Date(scheduledAt))) {
        return <Badge className="bg-success text-success-foreground">Today</Badge>
      }
      return <Badge className="bg-success text-success-foreground">Confirmed</Badge>
    }
    return <Badge variant="secondary">Pending</Badge>
  }

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const scheduledDate = new Date(appointment.scheduledAt)
    const canCancel = !isPast(scheduledDate) && appointment.status !== "cancelled" && appointment.status !== "completed"
    const canJoin = isToday(scheduledDate) && appointment.status === "confirmed"

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={appointment.doctorAvatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {appointment.doctorFirstName[0]}
                  {appointment.doctorLastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">
                  Dr. {appointment.doctorFirstName} {appointment.doctorLastName}
                </h3>
                <p className="text-sm text-muted-foreground">{appointment.specialization}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(scheduledDate, "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {format(scheduledDate, "h:mm a")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {getStatusBadge(appointment.status, appointment.scheduledAt)}
              <div className="flex gap-2">
                {canJoin && (
                  <Button size="sm" className="gap-1">
                    <Video className="h-4 w-4" />
                    Join Call
                  </Button>
                )}
                {canCancel && (
                  <Button size="sm" variant="outline" onClick={() => setCancelId(appointment.id)}>
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>

          {appointment.symptoms && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Symptoms:</span> {appointment.symptoms}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="My Appointments" subtitle="View and manage your appointments" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="My Appointments" subtitle="View and manage your appointments" />

      <div className="p-6">
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcomingAppointments.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastAppointments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingAppointments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No upcoming appointments</p>
                  <Link href="/patient/doctors">
                    <Button variant="link" className="mt-2">
                      Book an appointment
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              upcomingAppointments.map((apt) => <AppointmentCard key={apt.id} appointment={apt} />)
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastAppointments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No past appointments</p>
                </CardContent>
              </Card>
            ) : (
              pastAppointments.map((apt) => <AppointmentCard key={apt.id} appointment={apt} />)
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
