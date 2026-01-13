"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Star, Calendar, Clock, CheckCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Doctor {
  id: string
  firstName: string
  lastName: string
  avatarUrl?: string
  specialization: string
  experienceYears: number
  consultationFee: number
  bio?: string
  rating: number
  totalReviews: number
  isVerified: boolean
  availableDays: string[]
}

const specializations = [
  "All Specializations",
  "General Practice",
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "Psychiatry",
  "Gynecology",
  "Ophthalmology",
]

export default function FindDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [specialization, setSpecialization] = useState("")
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [booking, setBooking] = useState({
    date: "",
    time: "",
    symptoms: "",
  })
  const [isBooking, setIsBooking] = useState(false)

  const fetchDoctors = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (specialization && specialization !== "All Specializations") {
        params.append("specialization", specialization)
      }

      const response = await fetch(`/api/doctors?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()

      if (data.success && Array.isArray(data.data)) {
        setDoctors(data.data)
      } else {
        console.error("Unexpected API response:", data)
        setDoctors([])
        if (data.error) {
          toast.error(data.error || "Failed to load doctors")
        }
      }
    } catch (error) {
      console.error("Error fetching doctors:", error)
      toast.error("Failed to load doctors")
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDoctors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, specialization])

  const handleBook = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setBooking({ date: "", time: "", symptoms: "" })
    setBookingOpen(true)
  }

  const handleSubmitBooking = async () => {
    if (!selectedDoctor || !booking.date || !booking.time) {
      toast.error("Please select a date and time")
      return
    }

    setIsBooking(true)
    try {
      const scheduledAt = new Date(`${booking.date}T${booking.time}`)

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          scheduledAt: scheduledAt.toISOString(),
          symptoms: booking.symptoms,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Appointment booked successfully!")
        setBookingOpen(false)
      } else {
        toast.error(data.error || "Failed to book appointment")
      }
    } catch {
      toast.error("Failed to book appointment")
    } finally {
      setIsBooking(false)
    }
  }

  // Generate time slots
  const timeSlots = []
  for (let hour = 9; hour <= 17; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, "0")}:00`)
    if (hour < 17) {
      timeSlots.push(`${hour.toString().padStart(2, "0")}:30`)
    }
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Find Doctors" subtitle="Browse and book appointments with our specialists" />

      <div className="p-6 space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or specialty..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={specialization} onValueChange={setSpecialization}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Specialization" />
                </SelectTrigger>
                <SelectContent>
                  {specializations.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(search || specialization) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("")
                    setSpecialization("")
                  }}
                >
                  Show All Doctors
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Doctors List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : doctors.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No doctors found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search criteria</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => (
              <Card
                key={doctor.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleBook(doctor)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={doctor.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {doctor.firstName[0]}
                        {doctor.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg truncate">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </CardTitle>
                        {doctor.isVerified && <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />}
                      </div>
                      <CardDescription>{doctor.specialization}</CardDescription>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span className="text-sm font-medium">
                          {typeof doctor.rating === "number" ? doctor.rating.toFixed(1) : (Number(doctor.rating) || 0).toFixed(1)}
                        </span>
                        <span className="text-sm text-muted-foreground">({doctor.totalReviews || 0} reviews)</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {doctor.bio ||
                      `Experienced ${doctor.specialization.toLowerCase()} specialist with ${doctor.experienceYears} years of practice.`}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{doctor.experienceYears} years exp.</span>
                    </div>
                    <Badge variant="secondary">₹{doctor.consultationFee}/session</Badge>
                  </div>
                  <Button className="w-full" onClick={(e) => { e.stopPropagation(); handleBook(doctor); }}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Book Appointment
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Booking Dialog */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              {selectedDoctor && (
                <span>
                  Schedule a consultation with Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Select Date</Label>
              <Input
                id="date"
                type="date"
                value={booking.date}
                onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Select Time</Label>
              <Select value={booking.time} onValueChange={(value) => setBooking({ ...booking, time: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="symptoms">Describe your symptoms (optional)</Label>
              <Textarea
                id="symptoms"
                placeholder="Briefly describe your symptoms or reason for visit..."
                value={booking.symptoms}
                onChange={(e) => setBooking({ ...booking, symptoms: e.target.value })}
                rows={3}
              />
            </div>

            {selectedDoctor && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium">Consultation Fee</p>
                <p className="text-2xl font-bold">₹{selectedDoctor.consultationFee}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitBooking} disabled={isBooking}>
              {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
