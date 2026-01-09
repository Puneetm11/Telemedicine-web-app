"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, Video, CheckCircle, XCircle, FileText, Loader2 } from "lucide-react"
import { format, isPast, isToday, isFuture } from "date-fns"
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
  patientId: string
  patientFirstName: string
  patientLastName: string
  patientAvatar?: string
}

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [actionType, setActionType] = useState<"confirm" | "cancel" | "complete" | null>(null)
  const [notes, setNotes] = useState("")
  const [processing, setProcessing] = useState(false)

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

  const handleAction = async () => {
    if (!selectedAppointment || !actionType) return
    setProcessing(true)

    try {
      const statusMap = {
        confirm: "confirmed",
        cancel: "cancelled",
        complete: "completed",
      }

      const response = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusMap[actionType],
          notes: notes || undefined,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success(
          `Appointment ${actionType === "confirm" ? "confirmed" : actionType === "cancel" ? "cancelled" : "completed"}`,
        )
        fetchAppointments()
      } else {
        toast.error(data.error || "Failed to update appointment")
      }
    } catch {
      toast.error("Failed to update appointment")
    } finally {
      setProcessing(false)
      setSelectedAppointment(null)
      setActionType(null)
      setNotes("")
    }
  }

  const openDialog = (appointment: Appointment, type: "confirm" | "cancel" | "complete") => {
    setSelectedAppointment(appointment)
    setActionType(type)
    setNotes("")
  }

  const todayAppointments = appointments.filter((a) => isToday(new Date(a.scheduledAt)) && a.status !== "cancelled")
  const upcomingAppointments = appointments.filter(
    (a) => isFuture(new Date(a.scheduledAt)) && !isToday(new Date(a.scheduledAt)) && a.status !== "cancelled",
  )
  const pastAppointments = appointments.filter(
    (a) =>
      (isPast(new Date(a.scheduledAt)) && !isToday(new Date(a.scheduledAt))) ||
      a.status === "completed" ||
      a.status === "cancelled",
  )
  const pendingAppointments = appointments.filter((a) => a.status === "pending")

  const getStatusBadge = (status: string, scheduledAt: string) => {
    if (status === "cancelled") return <Badge variant="destructive">Cancelled</Badge>
    if (status === "completed") return <Badge variant="secondary">Completed</Badge>
    if (status === "confirmed") {
      if (isToday(new Date(scheduledAt))) {
        return <Badge className="bg-success text-success-foreground">Today</Badge>
      }
      return <Badge className="bg-success text-success-foreground">Confirmed</Badge>
    }
    return (
      <Badge variant="outline" className="border-warning text-warning">
        Pending
      </Badge>
    )
  }

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const scheduledDate = new Date(appointment.scheduledAt)
    const canConfirm = appointment.status === "pending"
    const canCancel = !isPast(scheduledDate) && appointment.status !== "cancelled" && appointment.status !== "completed"
    const canComplete = isToday(scheduledDate) && appointment.status === "confirmed"
    const canJoin = isToday(scheduledDate) && appointment.status === "confirmed"

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={appointment.patientAvatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {appointment.patientFirstName[0]}
                  {appointment.patientLastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">
                  {appointment.patientFirstName} {appointment.patientLastName}
                </h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
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
              <div className="flex flex-wrap gap-2 justify-end">
                {canConfirm && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-success border-success hover:bg-success hover:text-success-foreground bg-transparent"
                    onClick={() => openDialog(appointment, "confirm")}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Confirm
                  </Button>
                )}
                {canJoin && (
                  <Button size="sm" className="gap-1">
                    <Video className="h-4 w-4" />
                    Start Call
                  </Button>
                )}
                {canComplete && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 bg-transparent"
                    onClick={() => openDialog(appointment, "complete")}
                  >
                    <FileText className="h-4 w-4" />
                    Complete
                  </Button>
                )}
                {canCancel && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-destructive border-destructive hover:bg-destructive hover:text-white bg-transparent"
                    onClick={() => openDialog(appointment, "cancel")}
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel
                  </Button>
                )}
                <Link href={`/doctor/patients/${appointment.patientId}`}>
                  <Button size="sm" variant="ghost">
                    View Patient
                  </Button>
                </Link>
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
        <DashboardHeader title="Appointments" subtitle="Manage your schedule" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Appointments" subtitle="Manage your schedule" />

      <div className="p-6">
        <Tabs defaultValue="today" className="space-y-6">
          <TabsList>
            <TabsTrigger value="today">Today ({todayAppointments.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingAppointments.length})
              {pendingAppointments.length > 0 && <span className="ml-2 h-2 w-2 rounded-full bg-warning inline-block" />}
            </TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({upcomingAppointments.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastAppointments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            {todayAppointments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No appointments scheduled for today</p>
                </CardContent>
              </Card>
            ) : (
              todayAppointments.map((apt) => <AppointmentCard key={apt.id} appointment={apt} />)
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingAppointments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No pending requests</p>
                </CardContent>
              </Card>
            ) : (
              pendingAppointments.map((apt) => <AppointmentCard key={apt.id} appointment={apt} />)
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingAppointments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No upcoming appointments</p>
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

      {/* Action Dialog */}
      <Dialog open={!!selectedAppointment && !!actionType} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "confirm" && "Confirm Appointment"}
              {actionType === "cancel" && "Cancel Appointment"}
              {actionType === "complete" && "Complete Appointment"}
            </DialogTitle>
            <DialogDescription>
              {selectedAppointment && (
                <span>
                  Appointment with {selectedAppointment.patientFirstName} {selectedAppointment.patientLastName} on{" "}
                  {format(new Date(selectedAppointment.scheduledAt), "MMMM d, yyyy 'at' h:mm a")}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder={actionType === "complete" ? "Add consultation notes..." : "Add a note for the patient..."}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAppointment(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              variant={actionType === "cancel" ? "destructive" : "default"}
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === "confirm" && "Confirm"}
              {actionType === "cancel" && "Cancel Appointment"}
              {actionType === "complete" && "Mark Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
