"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, CheckCircle, XCircle, Star, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Doctor {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl?: string
  specialization: string
  licenseNumber: string
  experienceYears: number
  consultationFee: number
  rating: number
  totalReviews: number
  isVerified: boolean
  isActive: boolean
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchDoctors()
  }, [search])

  const fetchDoctors = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)

      const response = await fetch(`/api/admin/doctors?${params}`)
      const data = await response.json()
      if (data.success) {
        setDoctors(data.data)
      }
    } catch (error) {
      console.error("Error fetching doctors:", error)
      toast.error("Failed to load doctors")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (doctorId: string, verify: boolean) => {
    setProcessing(doctorId)
    try {
      const response = await fetch(`/api/admin/doctors/${doctorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: verify }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`Doctor ${verify ? "verified" : "unverified"}`)
        fetchDoctors()
      } else {
        toast.error(data.error || "Failed to update doctor")
      }
    } catch {
      toast.error("Failed to update doctor")
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Doctor Management" subtitle="Verify and manage doctors" />

      <div className="p-6 space-y-6">
        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or specialization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Doctors List */}
        <Card>
          <CardHeader>
            <CardTitle>Doctors</CardTitle>
            <CardDescription>{doctors.length} doctors registered</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : doctors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No doctors found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {doctors.map((doctor) => (
                  <div key={doctor.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={doctor.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {doctor.firstName[0]}
                          {doctor.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            Dr. {doctor.firstName} {doctor.lastName}
                          </p>
                          {doctor.isVerified ? (
                            <Badge className="bg-success text-success-foreground">Verified</Badge>
                          ) : (
                            <Badge variant="outline" className="border-warning text-warning">
                              Pending
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Star className="h-3 w-3 fill-warning text-warning" />
                          <span className="text-xs">
                            {doctor.rating?.toFixed(1) || "0.0"} ({doctor.totalReviews || 0} reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden md:block text-right text-sm">
                        <p className="text-muted-foreground">License: {doctor.licenseNumber}</p>
                        <p className="text-muted-foreground">{doctor.experienceYears} years exp.</p>
                        <p className="font-medium">${doctor.consultationFee}/session</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={processing === doctor.id}>
                            {processing === doctor.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {doctor.isVerified ? (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleVerify(doctor.id, false)}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Revoke Verification
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleVerify(doctor.id, true)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Verify Doctor
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
