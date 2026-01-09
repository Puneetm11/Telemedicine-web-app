import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, DollarSign, TrendingUp, Stethoscope, Activity } from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"

async function getMonthlyStats() {
  const months = []
  for (let i = 5; i >= 0; i--) {
    const date = subMonths(new Date(), i)
    const start = startOfMonth(date).toISOString()
    const end = endOfMonth(date).toISOString()

    const [users] = await sql`
      SELECT COUNT(*) as count FROM users 
      WHERE created_at BETWEEN ${start} AND ${end}
    `
    const [appointments] = await sql`
      SELECT COUNT(*) as count FROM appointments 
      WHERE created_at BETWEEN ${start} AND ${end}
    `
    const [revenue] = await sql`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments 
      WHERE status = 'completed' AND created_at BETWEEN ${start} AND ${end}
    `

    months.push({
      month: format(date, "MMM"),
      users: Number(users.count),
      appointments: Number(appointments.count),
      revenue: Number(revenue.total),
    })
  }
  return months
}

async function getTopDoctors() {
  return sql`
    SELECT 
      u.first_name as "firstName", u.last_name as "lastName",
      dp.specialization, dp.rating, dp.total_reviews as "totalReviews",
      COUNT(a.id) as "appointmentCount",
      COALESCE(SUM(p.amount), 0) as "totalEarnings"
    FROM users u
    JOIN doctor_profiles dp ON u.id = dp.user_id
    LEFT JOIN appointments a ON u.id = a.doctor_id
    LEFT JOIN payments p ON a.id = p.appointment_id AND p.status = 'completed'
    WHERE u.role = 'doctor'
    GROUP BY u.id, u.first_name, u.last_name, dp.specialization, dp.rating, dp.total_reviews
    ORDER BY "appointmentCount" DESC
    LIMIT 5
  `
}

async function getSpecializationStats() {
  return sql`
    SELECT 
      dp.specialization,
      COUNT(DISTINCT dp.user_id) as "doctorCount",
      COUNT(a.id) as "appointmentCount"
    FROM doctor_profiles dp
    LEFT JOIN appointments a ON dp.user_id = a.doctor_id
    GROUP BY dp.specialization
    ORDER BY "appointmentCount" DESC
    LIMIT 8
  `
}

export default async function AdminAnalyticsPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const monthlyStats = await getMonthlyStats()
  const topDoctors = await getTopDoctors()
  const specializationStats = await getSpecializationStats()

  // Calculate totals
  const totalUsers = monthlyStats.reduce((sum, m) => sum + m.users, 0)
  const totalAppointments = monthlyStats.reduce((sum, m) => sum + m.appointments, 0)
  const totalRevenue = monthlyStats.reduce((sum, m) => sum + m.revenue, 0)

  // Calculate growth (last month vs previous month)
  const lastMonth = monthlyStats[monthlyStats.length - 1]
  const prevMonth = monthlyStats[monthlyStats.length - 2]
  const userGrowth = prevMonth.users > 0 ? ((lastMonth.users - prevMonth.users) / prevMonth.users) * 100 : 0
  const appointmentGrowth =
    prevMonth.appointments > 0 ? ((lastMonth.appointments - prevMonth.appointments) / prevMonth.appointments) * 100 : 0
  const revenueGrowth = prevMonth.revenue > 0 ? ((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100 : 0

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Analytics" subtitle="Platform performance metrics" />

      <div className="p-6 space-y-6">
        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="New Users (6mo)"
            value={totalUsers}
            icon={<Users className="h-6 w-6" />}
            trend={userGrowth !== 0 ? { value: Math.round(userGrowth), isPositive: userGrowth > 0 } : undefined}
          />
          <StatsCard
            title="Appointments (6mo)"
            value={totalAppointments}
            icon={<Calendar className="h-6 w-6" />}
            trend={
              appointmentGrowth !== 0
                ? { value: Math.round(appointmentGrowth), isPositive: appointmentGrowth > 0 }
                : undefined
            }
          />
          <StatsCard
            title="Revenue (6mo)"
            value={`$${totalRevenue.toFixed(0)}`}
            icon={<DollarSign className="h-6 w-6" />}
            trend={
              revenueGrowth !== 0 ? { value: Math.round(revenueGrowth), isPositive: revenueGrowth > 0 } : undefined
            }
          />
          <StatsCard
            title="Avg. per Month"
            value={`$${(totalRevenue / 6).toFixed(0)}`}
            icon={<TrendingUp className="h-6 w-6" />}
          />
        </div>

        {/* Monthly Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Breakdown</CardTitle>
            <CardDescription>Performance over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-4">
              {monthlyStats.map((month) => (
                <div key={month.month} className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-2">{month.month}</p>
                  <p className="text-2xl font-bold text-primary">{month.appointments}</p>
                  <p className="text-xs text-muted-foreground">appointments</p>
                  <p className="text-sm font-medium mt-2">${month.revenue}</p>
                  <p className="text-xs text-muted-foreground">revenue</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Doctors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Doctors</CardTitle>
              <CardDescription>Based on appointment volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topDoctors.map((doctor: Record<string, unknown>, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">
                          Dr. {doctor.firstName as string} {doctor.lastName as string}
                        </p>
                        <p className="text-sm text-muted-foreground">{doctor.specialization as string}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{doctor.appointmentCount as number} appointments</p>
                      <p className="text-sm text-muted-foreground">${doctor.totalEarnings as number} earned</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Specialization Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Specialization Distribution</CardTitle>
              <CardDescription>Doctors and appointments by specialty</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {specializationStats.map((spec: Record<string, unknown>, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Stethoscope className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{spec.specialization as string}</p>
                        <p className="text-sm text-muted-foreground">{spec.doctorCount as number} doctors</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{spec.appointmentCount as number}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
