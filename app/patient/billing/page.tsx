import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard, Download, Receipt } from "lucide-react"
import { format } from "date-fns"

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  paymentMethod: string
  paidAt: string
  createdAt: string
  doctorFirstName: string
  doctorLastName: string
}

async function getPayments(userId: string) {
  return sql`
    SELECT 
      p.id, p.amount, p.currency, p.status, p.payment_method as "paymentMethod",
      p.paid_at as "paidAt", p.created_at as "createdAt",
      u.first_name as "doctorFirstName", u.last_name as "doctorLastName"
    FROM payments p
    JOIN users u ON p.doctor_id = u.id
    WHERE p.patient_id = ${userId}
    ORDER BY p.created_at DESC
  ` as Promise<Payment[]>
}

async function getPaymentStats(userId: string) {
  const [stats] = await sql`
    SELECT 
      COUNT(*) as total_payments,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_spent,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments
    FROM payments
    WHERE patient_id = ${userId}
  `
  return {
    totalPayments: Number(stats.total_payments),
    totalSpent: Number(stats.total_spent),
    pendingPayments: Number(stats.pending_payments),
  }
}

export default async function PatientBillingPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const payments = await getPayments(user.id)
  const stats = await getPaymentStats(user.id)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success text-success-foreground">Paid</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "refunded":
        return <Badge variant="outline">Refunded</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Billing History" subtitle="View your payment history and invoices" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">₹{stats.totalSpent.toFixed(2)}</p>
                </div>
                <CreditCard className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{stats.totalPayments}</p>
                </div>
                <Receipt className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                  <p className="text-2xl font-bold">{stats.pendingPayments}</p>
                </div>
                <CreditCard className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>All your transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No payment history</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col gap-4 p-4 rounded-lg border md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        Consultation with Dr. {payment.doctorFirstName} {payment.doctorLastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          ₹{payment.amount.toFixed(2)} {payment.currency}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{payment.paymentMethod || "Card"}</p>
                      </div>
                      {getStatusBadge(payment.status)}
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
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
