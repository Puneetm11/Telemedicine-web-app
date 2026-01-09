import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Pill, Download, Calendar } from "lucide-react"
import { format } from "date-fns"

interface PrescriptionItem {
  id: string
  medicationName: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
  quantity: number
}

interface Prescription {
  id: string
  diagnosis: string
  notes: string
  validUntil: string
  isActive: boolean
  createdAt: string
  doctorFirstName: string
  doctorLastName: string
  doctorAvatar: string
  specialization: string
  items: PrescriptionItem[]
}

async function getPrescriptions(userId: string) {
  const prescriptions = await sql`
    SELECT 
      p.id, p.diagnosis, p.notes, p.valid_until as "validUntil", 
      p.is_active as "isActive", p.created_at as "createdAt",
      u.first_name as "doctorFirstName", u.last_name as "doctorLastName", 
      u.avatar_url as "doctorAvatar",
      dp.specialization
    FROM prescriptions p
    JOIN users u ON p.doctor_id = u.id
    LEFT JOIN doctor_profiles dp ON u.id = dp.user_id
    WHERE p.patient_id = ${userId}
    ORDER BY p.created_at DESC
  `

  // Fetch items for each prescription
  for (const prescription of prescriptions) {
    const items = await sql`
      SELECT 
        id, medication_name as "medicationName", dosage, frequency,
        duration, instructions, quantity
      FROM prescription_items
      WHERE prescription_id = ${prescription.id}
    `
    prescription.items = items
  }

  return prescriptions as Prescription[]
}

export default async function PatientPrescriptionsPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const prescriptions = await getPrescriptions(user.id)

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Prescriptions" subtitle="View your digital prescriptions and medications" />

      <div className="p-6 space-y-6">
        {prescriptions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Pill className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No prescriptions yet</p>
              <p className="text-sm text-muted-foreground">Your prescriptions will appear here after consultations</p>
            </CardContent>
          </Card>
        ) : (
          prescriptions.map((prescription) => (
            <Card key={prescription.id}>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={prescription.doctorAvatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {prescription.doctorFirstName[0]}
                        {prescription.doctorLastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        Dr. {prescription.doctorFirstName} {prescription.doctorLastName}
                      </CardTitle>
                      <CardDescription>{prescription.specialization}</CardDescription>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(prescription.createdAt), "MMMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={prescription.isActive ? "default" : "secondary"}
                      className={prescription.isActive ? "bg-success text-success-foreground" : ""}
                    >
                      {prescription.isActive ? "Active" : "Expired"}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {prescription.diagnosis && (
                  <div>
                    <p className="text-sm font-medium">Diagnosis</p>
                    <p className="text-muted-foreground">{prescription.diagnosis}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium mb-3">Medications</p>
                  <div className="space-y-3">
                    {prescription.items.map((item) => (
                      <div key={item.id} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{item.medicationName}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.dosage} - {item.frequency}
                            </p>
                          </div>
                          <Badge variant="outline">{item.duration}</Badge>
                        </div>
                        {item.instructions && <p className="mt-2 text-sm text-muted-foreground">{item.instructions}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                {prescription.notes && (
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm font-medium">Doctor&apos;s Notes</p>
                    <p className="text-sm text-muted-foreground">{prescription.notes}</p>
                  </div>
                )}

                {prescription.validUntil && (
                  <p className="text-xs text-muted-foreground">
                    Valid until: {format(new Date(prescription.validUntil), "MMMM d, yyyy")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
