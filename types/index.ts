// MediConnect Type Definitions

export type UserRole = "patient" | "doctor" | "admin"
export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled"
export type ReportType = "lab_report" | "prescription" | "imaging" | "other"
export type MessageType = "text" | "image" | "file"
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded"

export interface User {
  id: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
  phone?: string
  avatarUrl?: string
  isActive: boolean
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PatientProfile {
  id: string
  userId: string
  dateOfBirth?: Date
  gender?: string
  bloodType?: string
  allergies?: string[]
  chronicConditions?: string[]
  emergencyContactName?: string
  emergencyContactPhone?: string
  address?: string
  insuranceProvider?: string
  insuranceNumber?: string
}

export interface DoctorProfile {
  id: string
  userId: string
  specialization: string
  licenseNumber: string
  experienceYears: number
  bio?: string
  consultationFee: number
  availableDays: string[]
  availableHoursStart: string
  availableHoursEnd: string
  rating: number
  totalReviews: number
  isVerified: boolean
}

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  scheduledAt: Date
  durationMinutes: number
  status: AppointmentStatus
  type: string
  symptoms?: string
  notes?: string
  meetingLink?: string
  createdAt: Date
  patient?: User
  doctor?: User & { doctorProfile?: DoctorProfile }
}

export interface MedicalReport {
  id: string
  patientId: string
  uploadedBy: string
  title: string
  description?: string
  reportType: ReportType
  fileUrl: string
  fileName?: string
  fileSize?: number
  reportDate: Date
  isSharedWithDoctors: boolean
  createdAt: Date
}

export interface Prescription {
  id: string
  appointmentId?: string
  patientId: string
  doctorId: string
  diagnosis?: string
  notes?: string
  validUntil?: Date
  isActive: boolean
  createdAt: Date
  items?: PrescriptionItem[]
  doctor?: User & { doctorProfile?: DoctorProfile }
}

export interface PrescriptionItem {
  id: string
  prescriptionId: string
  medicationName: string
  dosage?: string
  frequency?: string
  duration?: string
  instructions?: string
  quantity: number
}

export interface Conversation {
  id: string
  patientId: string
  doctorId: string
  lastMessageAt: Date
  createdAt: Date
  patient?: User
  doctor?: User & { doctorProfile?: DoctorProfile }
  lastMessage?: Message
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  messageType: MessageType
  fileUrl?: string
  isRead: boolean
  createdAt: Date
  sender?: User
}

export interface Payment {
  id: string
  appointmentId?: string
  patientId: string
  doctorId: string
  amount: number
  currency: string
  status: PaymentStatus
  paymentMethod?: string
  transactionId?: string
  paidAt?: Date
  createdAt: Date
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: string
  isRead: boolean
  actionUrl?: string
  createdAt: Date
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Auth types
export interface AuthUser extends User {
  patientProfile?: PatientProfile
  doctorProfile?: DoctorProfile
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData extends LoginCredentials {
  firstName: string
  lastName: string
  role: UserRole
  phone?: string
}

// Dashboard stats
export interface PatientStats {
  upcomingAppointments: number
  totalReports: number
  activePrescriptions: number
  unreadMessages: number
}

export interface DoctorStats {
  todayAppointments: number
  totalPatients: number
  pendingAppointments: number
  unreadMessages: number
  monthlyEarnings: number
}

export interface AdminStats {
  totalUsers: number
  totalDoctors: number
  totalPatients: number
  totalAppointments: number
  totalRevenue: number
  appointmentsToday: number
}
