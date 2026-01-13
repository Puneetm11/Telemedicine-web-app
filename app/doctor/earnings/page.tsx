import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, Calendar, CreditCard } from "lucide-react"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from "date-fns"

async function getEarningsStats(doctorId: string) {
  const now = new Date()
  const monthStart = startOfMonth(now).toISOString()
  const monthEnd = endOfMonth(now).toISOString()
  const weekStart = startOfWeek(now).toISOString()
  const weekEnd = endOfWeek(now).toISOString()
  const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString()
  const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString()

  const [total] = await sql`
    SELECT COALESCE(SUM(amount), 0) as total FROM payments 
    WHERE doctor_id = ${doctorId} AND status = 'completed'
  `
  const [monthly] = await sql`
    SELECT COALESCE(SUM(amount), 0) as total FROM payments 
    WHERE doctor_id = ${doctorId} AND status = 'completed'
    AND created_at BETWEEN ${monthStart} AND ${monthEnd}
  `
  const [weekly] = await sql`
    SELECT COALESCE(SUM(amount), 0) as total FROM payments 
    WHERE doctor_id = ${doctorId} AND status = 'completed'
    AND created_at BETWEEN ${weekStart} AND ${weekEnd}
  `
  const [lastMonth] = await sql`
    SELECT COALESCE(SUM(amount), 0) as total FROM payments 
    WHERE doctor_id = ${doctorId} AND status = 'completed'
    AND created_at BETWEEN ${lastMonthStart} AND ${lastMonthEnd}
  `
  const [pending] = await sql`
    SELECT COALESCE(SUM(amount), 0) as total FROM payments 
    WHERE doctor_id = ${doctorId} AND status = 'pending'
  `

  const lastMonthTotal = Number(lastMonth.total)
  const thisMonthTotal = Number(monthly.total)
  const growth = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0

  return {
    totalEarnings: Number(total.total),
    monthlyEarnings: thisMonthTotal,
    weeklyEarnings: Number(weekly.total),
    pendingPayments: Number(pending.total),
    growthRate: growth,
  }
}

async function getRecentPayments(doctorId: string) {
  return sql`
    SELECT 
      p.id, p.amount, p.currency, p.status, p.created_at as "createdAt",
      u.first_name as "patientFirstName", u.last_name as "patientLastName"
    FROM payments p
    JOIN users u ON p.patient_id = u.id
    WHERE p.doctor_id = ${doctorId}
    ORDER BY p.created_at DESC
    LIMIT 20
  `
}

export default async function DoctorEarningsPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const stats = await getEarningsStats(user.id)
  const payments = await getRecentPayments(user.id)

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Earnings" subtitle="Track your income and payments" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Earnings"
            value={`₹${stats.totalEarnings.toFixed(2)}`}
            icon={<DollarSign className="h-6 w-6" />}
          />
          <StatsCard
            title="This Month"
            value={`₹${stats.monthlyEarnings.toFixed(2)}`}
            icon={<Calendar className="h-6 w-6" />}
            trend={
              stats.growthRate !== 0
                ? { value: Math.round(stats.growthRate), isPositive: stats.growthRate > 0 }
                : undefined
            }
          />
          <StatsCard
            title="This Week"
            value={`₹${stats.weeklyEarnings.toFixed(2)}`}
            icon={<TrendingUp className="h-6 w-6" />}
          />
          <StatsCard
            title="Pending"
            value={`₹${stats.pendingPayments.toFixed(2)}`}
            icon={<CreditCard className="h-6 w-6" />}
          />
        </div>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Your payment history</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No payments yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment: Record<string, unknown>) => (
                  <div key={payment.id as string} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">
                        {payment.patientFirstName as string} {payment.patientLastName as string}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.createdAt as string), "MMMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-semibold">
                        ₹{(payment.amount as number).toFixed(2)} {payment.currency as string}
                      </p>
                      <Badge
                        variant={(payment.status as string) === "completed" ? "default" : "secondary"}
                        className={
                          (payment.status as string) === "completed" ? "bg-success text-success-foreground" : ""
                        }
                      >
                        {payment.status as string}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
