import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Calendar, MessageSquare, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface Patient {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl?: string
  totalAppointments: number
  lastAppointment?: string
}

async function getPatients(doctorId: string) {
  return sql`
    SELECT 
      u.id, u.first_name as "firstName", u.last_name as "lastName", 
      u.email, u.avatar_url as "avatarUrl",
      COUNT(a.id) as "totalAppointments",
      MAX(a.scheduled_at) as "lastAppointment"
    FROM users u
    JOIN appointments a ON u.id = a.patient_id
    WHERE a.doctor_id = ${doctorId}
    GROUP BY u.id, u.first_name, u.last_name, u.email, u.avatar_url
    ORDER BY MAX(a.scheduled_at) DESC
  ` as Promise<Patient[]>
}

export default async function DoctorPatientsPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const patients = await getPatients(user.id)

  return (
    <div className="min-h-screen">
      <DashboardHeader title="My Patients" subtitle="View and manage your patient list" />

      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient List</CardTitle>
            <CardDescription>{patients.length} patients in total</CardDescription>
          </CardHeader>
          <CardContent>
            {patients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No patients yet</p>
                <p className="text-sm text-muted-foreground">
                  Patients will appear here after they book appointments with you
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={patient.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {patient.firstName[0]}
                        {patient.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{patient.email}</p>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{patient.totalAppointments} visits</span>
                      </div>
                      {patient.lastAppointment && (
                        <span>Last visit: {format(new Date(patient.lastAppointment), "MMM d, yyyy")}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/doctor/messages?patient=${patient.id}`}>
                        <Button variant="ghost" size="icon">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/doctor/patients/${patient.id}`}>
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
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
