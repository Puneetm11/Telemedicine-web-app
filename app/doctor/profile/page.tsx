"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Camera, Star } from "lucide-react"
import { toast } from "sonner"

interface DoctorProfile {
  specialization: string
  licenseNumber: string
  experienceYears: number
  bio: string
  consultationFee: number
  availableDays: string[]
  availableHoursStart: string
  availableHoursEnd: string
  rating: number
  totalReviews: number
  isVerified: boolean
}

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatarUrl?: string
}

const specializations = [
  "General Practice",
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "Psychiatry",
  "Gynecology",
  "Ophthalmology",
  "ENT",
  "Dentistry",
  "Oncology",
]

const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

export default function DoctorProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<DoctorProfile | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/auth/me")
      const data = await response.json()
      if (data.success) {
        setUser(data.data.user)
        setProfile(data.data.user.doctorProfile || {})
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/doctor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: user?.firstName,
          lastName: user?.lastName,
          phone: user?.phone,
          ...profile,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success("Profile updated successfully")
      } else {
        toast.error(data.error || "Failed to update profile")
      }
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const toggleDay = (day: string) => {
    if (!profile) return
    const days = profile.availableDays || []
    if (days.includes(day)) {
      setProfile({ ...profile, availableDays: days.filter((d) => d !== day) })
    } else {
      setProfile({ ...profile, availableDays: [...days, day] })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="My Profile" subtitle="Manage your professional profile" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!user || !profile) return null

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()

  return (
    <div className="min-h-screen">
      <DashboardHeader title="My Profile" subtitle="Manage your professional profile" />

      <div className="p-6 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">{initials}</AvatarFallback>
                  </Avatar>
                  <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 h-8 w-8 rounded-full">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    Dr. {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-muted-foreground">{profile.specialization}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="font-medium">{(Number(profile.rating) || 0).toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({profile.totalReviews || 0} reviews)</span>
                    {profile.isVerified && <Badge className="bg-success text-success-foreground ml-2">Verified</Badge>}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList>
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="professional">Professional</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={user.firstName}
                      onChange={(e) => setUser({ ...user, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={user.lastName}
                      onChange={(e) => setUser({ ...user, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={user.email} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={user.phone || ""}
                      onChange={(e) => setUser({ ...user, phone: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="professional">
            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
                <CardDescription>Your medical credentials and expertise</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Select
                      value={profile.specialization}
                      onValueChange={(value) => setProfile({ ...profile, specialization: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        {specializations.map((spec) => (
                          <SelectItem key={spec} value={spec}>
                            {spec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license">License Number</Label>
                    <Input
                      id="license"
                      value={profile.licenseNumber}
                      onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={profile.experienceYears}
                      onChange={(e) => setProfile({ ...profile, experienceYears: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fee">Consultation Fee (₹)</Label>
                    <Input
                      id="fee"
                      type="number"
                      value={profile.consultationFee}
                      onChange={(e) => setProfile({ ...profile, consultationFee: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio || ""}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    rows={4}
                    placeholder="Tell patients about your experience, approach, and expertise..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Availability Schedule</CardTitle>
                <CardDescription>Set your available days and hours for consultations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Available Days</Label>
                  <div className="flex flex-wrap gap-4">
                    {daysOfWeek.map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={day}
                          checked={(profile.availableDays || []).includes(day)}
                          onCheckedChange={() => toggleDay(day)}
                        />
                        <label htmlFor={day} className="text-sm font-medium capitalize cursor-pointer">
                          {day}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={profile.availableHoursStart || "09:00"}
                      onChange={(e) => setProfile({ ...profile, availableHoursStart: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={profile.availableHoursEnd || "17:00"}
                      onChange={(e) => setProfile({ ...profile, availableHoursEnd: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
