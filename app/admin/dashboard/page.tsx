import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Stethoscope, Calendar, DollarSign, TrendingUp, Activity } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"

async function getAdminStats() {
  const now = new Date()
  const monthStart = startOfMonth(now).toISOString()
  const monthEnd = endOfMonth(now).toISOString()
  const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString()
  const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString()
  const today = now.toISOString().split("T")[0]

  const [totalUsers] = await sql`SELECT COUNT(*) as count FROM users WHERE role = 'patient'`
  const [totalDoctors] = await sql`SELECT COUNT(*) as count FROM users WHERE role = 'doctor'`
  const [totalAppointments] = await sql`SELECT COUNT(*) as count FROM appointments`
  const [todayAppointments] = await sql`SELECT COUNT(*) as count FROM appointments WHERE DATE(scheduled_at) = ${today}`

  const [revenue] = await sql`
    SELECT COALESCE(SUM(amount), 0) as total FROM payments 
    WHERE status = 'completed' AND created_at BETWEEN ${monthStart} AND ${monthEnd}
  `
  const [lastMonthRevenue] = await sql`
    SELECT COALESCE(SUM(amount), 0) as total FROM payments 
    WHERE status = 'completed' AND created_at BETWEEN ${lastMonthStart} AND ${lastMonthEnd}
  `

  const thisMonthRev = Number(revenue.total)
  const lastMonthRev = Number(lastMonthRevenue.total)
  const growth = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : 0

  return {
    totalUsers: Number(totalUsers.count),
    totalDoctors: Number(totalDoctors.count),
    totalAppointments: Number(totalAppointments.count),
    todayAppointments: Number(todayAppointments.count),
    monthlyRevenue: thisMonthRev,
    revenueGrowth: growth,
  }
}

async function getRecentUsers() {
  return sql`
    SELECT id, first_name as "firstName", last_name as "lastName", email, role, created_at as "createdAt"
    FROM users
    ORDER BY created_at DESC
    LIMIT 5
  `
}

async function getRecentAppointments() {
  return sql`
    SELECT 
      a.id, a.scheduled_at as "scheduledAt", a.status,
      p.first_name as "patientFirstName", p.last_name as "patientLastName",
      d.first_name as "doctorFirstName", d.last_name as "doctorLastName"
    FROM appointments a
    JOIN users p ON a.patient_id = p.id
    JOIN users d ON a.doctor_id = d.id
    ORDER BY a.created_at DESC
    LIMIT 5
  `
}

async function getAppointmentsByStatus() {
  return sql`
    SELECT status, COUNT(*) as count
    FROM appointments
    GROUP BY status
  `
}

export default async function AdminDashboard() {
  const user = await getCurrentUser()
  if (!user) return null

  const stats = await getAdminStats()
  const recentUsers = await getRecentUsers()
  const recentAppointments = await getRecentAppointments()
  const appointmentsByStatus = await getAppointmentsByStatus()

  const statusCounts: Record<string, number> = {}
  for (const row of appointmentsByStatus) {
    statusCounts[row.status as string] = Number(row.count)
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Admin Dashboard" subtitle="Platform overview and management" />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatsCard title="Total Patients" value={stats.totalUsers} icon={<Users className="h-6 w-6" />} />
          <StatsCard title="Total Doctors" value={stats.totalDoctors} icon={<Stethoscope className="h-6 w-6" />} />
          <StatsCard
            title="Total Appointments"
            value={stats.totalAppointments}
            icon={<Calendar className="h-6 w-6" />}
          />
          <StatsCard
            title="Today's Appointments"
            value={stats.todayAppointments}
            icon={<Activity className="h-6 w-6" />}
          />
          <StatsCard
            title="Monthly Revenue"
            value={`$${stats.monthlyRevenue.toFixed(0)}`}
            icon={<DollarSign className="h-6 w-6" />}
            trend={
              stats.revenueGrowth !== 0
                ? { value: Math.round(stats.revenueGrowth), isPositive: stats.revenueGrowth > 0 }
                : undefined
            }
          />
          <StatsCard
            title="Growth"
            value={`${stats.revenueGrowth >= 0 ? "+" : ""}${stats.revenueGrowth.toFixed(1)}%`}
            icon={<TrendingUp className="h-6 w-6" />}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Appointment Status */}
          <Card>
            <CardHeader>
              <CardTitle>Appointments by Status</CardTitle>
              <CardDescription>Current appointment distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{statusCounts.pending || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-success/10">
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                  <p className="text-2xl font-bold text-success">{statusCounts.confirmed || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-primary">{statusCounts.completed || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10">
                  <p className="text-sm text-muted-foreground">Cancelled</p>
                  <p className="text-2xl font-bold text-destructive">{statusCounts.cancelled || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Registrations</CardTitle>
              <CardDescription>Newly registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsers.map((u: Record<string, unknown>) => (
                  <div key={u.id as string} className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(u.firstName as string)[0]}
                        {(u.lastName as string)[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {u.firstName as string} {u.lastName as string}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{u.email as string}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={(u.role as string) === "doctor" ? "default" : "secondary"} className="capitalize">
                        {u.role as string}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(u.createdAt as string), "MMM d")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
            <CardDescription>Latest appointment activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAppointments.map((apt: Record<string, unknown>) => (
                <div key={apt.id as string} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(apt.patientFirstName as string)[0]}
                        {(apt.patientLastName as string)[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {apt.patientFirstName as string} {apt.patientLastName as string}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        with Dr. {apt.doctorFirstName as string} {apt.doctorLastName as string}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{format(new Date(apt.scheduledAt as string), "MMM d, yyyy")}</p>
                    <Badge
                      variant={(apt.status as string) === "confirmed" ? "default" : "secondary"}
                      className={
                        (apt.status as string) === "confirmed"
                          ? "bg-success text-success-foreground"
                          : (apt.status as string) === "cancelled"
                            ? "bg-destructive text-white"
                            : ""
                      }
                    >
                      {apt.status as string}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
