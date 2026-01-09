import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, FileText, Pill, MessageSquare, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

async function getPatientStats(userId: string) {
  const [appointments] = await sql`
    SELECT COUNT(*) as count FROM appointments 
    WHERE patient_id = ${userId} AND scheduled_at > NOW() AND status != 'cancelled'
  `
  const [reports] = await sql`
    SELECT COUNT(*) as count FROM medical_reports WHERE patient_id = ${userId}
  `
  const [prescriptions] = await sql`
    SELECT COUNT(*) as count FROM prescriptions 
    WHERE patient_id = ${userId} AND is_active = true
  `
  const [messages] = await sql`
    SELECT COUNT(*) as count FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE c.patient_id = ${userId} AND m.is_read = false AND m.sender_id != ${userId}
  `

  return {
    upcomingAppointments: Number(appointments.count),
    totalReports: Number(reports.count),
    activePrescriptions: Number(prescriptions.count),
    unreadMessages: Number(messages.count),
  }
}

async function getUpcomingAppointments(userId: string) {
  return sql`
    SELECT 
      a.id, a.scheduled_at as "scheduledAt", a.status, a.type,
      u.first_name as "doctorFirstName", u.last_name as "doctorLastName", u.avatar_url as "doctorAvatar",
      dp.specialization
    FROM appointments a
    JOIN users u ON a.doctor_id = u.id
    LEFT JOIN doctor_profiles dp ON u.id = dp.user_id
    WHERE a.patient_id = ${userId} AND a.scheduled_at > NOW() AND a.status != 'cancelled'
    ORDER BY a.scheduled_at ASC
    LIMIT 5
  `
}

async function getRecentPrescriptions(userId: string) {
  return sql`
    SELECT 
      p.id, p.diagnosis, p.created_at as "createdAt",
      u.first_name as "doctorFirstName", u.last_name as "doctorLastName"
    FROM prescriptions p
    JOIN users u ON p.doctor_id = u.id
    WHERE p.patient_id = ${userId} AND p.is_active = true
    ORDER BY p.created_at DESC
    LIMIT 3
  `
}

export default async function PatientDashboard() {
  const user = await getCurrentUser()
  if (!user) return null

  const stats = await getPatientStats(user.id)
  const upcomingAppointments = await getUpcomingAppointments(user.id)
  const recentPrescriptions = await getRecentPrescriptions(user.id)

  return (
    <div className="min-h-screen">
      <DashboardHeader title={`Welcome back, ${user.firstName}`} subtitle="Here's your health overview" />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Upcoming Appointments"
            value={stats.upcomingAppointments}
            icon={<Calendar className="h-6 w-6" />}
          />
          <StatsCard title="Medical Reports" value={stats.totalReports} icon={<FileText className="h-6 w-6" />} />
          <StatsCard
            title="Active Prescriptions"
            value={stats.activePrescriptions}
            icon={<Pill className="h-6 w-6" />}
          />
          <StatsCard
            title="Unread Messages"
            value={stats.unreadMessages}
            icon={<MessageSquare className="h-6 w-6" />}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Appointments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Your scheduled consultations</CardDescription>
              </div>
              <Link href="/patient/appointments">
                <Button variant="ghost" size="sm" className="gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No upcoming appointments</p>
                  <Link href="/patient/doctors">
                    <Button variant="link" className="mt-2">
                      Book an appointment
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((apt: Record<string, unknown>) => (
                    <div key={apt.id as string} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                      <Avatar>
                        <AvatarImage src={(apt.doctorAvatar as string) || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {(apt.doctorFirstName as string)[0]}
                          {(apt.doctorLastName as string)[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          Dr. {apt.doctorFirstName as string} {apt.doctorLastName as string}
                        </p>
                        <p className="text-sm text-muted-foreground">{apt.specialization as string}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {format(new Date(apt.scheduledAt as string), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(apt.scheduledAt as string), "h:mm a")}
                        </p>
                      </div>
                      <Badge
                        variant={apt.status === "confirmed" ? "default" : "secondary"}
                        className={apt.status === "confirmed" ? "bg-success text-success-foreground" : ""}
                      >
                        {apt.status as string}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Prescriptions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active Prescriptions</CardTitle>
                <CardDescription>Your current medications</CardDescription>
              </div>
              <Link href="/patient/prescriptions">
                <Button variant="ghost" size="sm" className="gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentPrescriptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Pill className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No active prescriptions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentPrescriptions.map((rx: Record<string, unknown>) => (
                    <div key={rx.id as string} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{rx.diagnosis as string}</p>
                        <Badge variant="outline" className="text-success border-success">
                          Active
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Prescribed by Dr. {rx.doctorFirstName as string} {rx.doctorLastName as string}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(rx.createdAt as string), "MMMM d, yyyy")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you can do</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/patient/doctors">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 bg-transparent">
                  <Calendar className="h-6 w-6" />
                  <span>Book Appointment</span>
                </Button>
              </Link>
              <Link href="/patient/reports">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 bg-transparent">
                  <FileText className="h-6 w-6" />
                  <span>Upload Report</span>
                </Button>
              </Link>
              <Link href="/patient/messages">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 bg-transparent">
                  <MessageSquare className="h-6 w-6" />
                  <span>Send Message</span>
                </Button>
              </Link>
              <Link href="/patient/prescriptions">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 bg-transparent">
                  <Pill className="h-6 w-6" />
                  <span>View Prescriptions</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
