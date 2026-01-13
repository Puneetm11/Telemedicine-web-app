import "dotenv/config"
import { sql } from "../lib/db"
import { hashPassword } from "../lib/auth"

interface DoctorData {
  firstName: string
  lastName: string
  email: string
  phone: string
  specialization: string
  licenseNumber: string
  experienceYears: number
  bio: string
  consultationFee: number
  rating: number
  totalReviews: number
  isVerified: boolean
  availableDays: string[]
  availableHoursStart: string
  availableHoursEnd: string
}

const doctors: DoctorData[] = [
  {
    firstName: "Rajesh",
    lastName: "Kumar",
    email: "rajesh.kumar@mediconnect.in",
    phone: "+91-9876543210",
    specialization: "Cardiology",
    licenseNumber: "MCI-2020-12345",
    experienceYears: 15,
    bio: "Senior cardiologist with expertise in interventional cardiology and cardiac rehabilitation. Trained at AIIMS Delhi.",
    consultationFee: 1500,
    rating: 4.8,
    totalReviews: 234,
    isVerified: true,
    availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    availableHoursStart: "09:00",
    availableHoursEnd: "18:00",
  },
  {
    firstName: "Priya",
    lastName: "Sharma",
    email: "priya.sharma@mediconnect.in",
    phone: "+91-9876543211",
    specialization: "Dermatology",
    licenseNumber: "MCI-2018-23456",
    experienceYears: 12,
    bio: "Expert dermatologist specializing in cosmetic dermatology, acne treatment, and skin cancer detection. MD from PGIMER Chandigarh.",
    consultationFee: 1200,
    rating: 4.7,
    totalReviews: 189,
    isVerified: true,
    availableDays: ["monday", "wednesday", "friday", "saturday"],
    availableHoursStart: "10:00",
    availableHoursEnd: "19:00",
  },
  {
    firstName: "Amit",
    lastName: "Patel",
    email: "amit.patel@mediconnect.in",
    phone: "+91-9876543212",
    specialization: "Neurology",
    licenseNumber: "MCI-2019-34567",
    experienceYears: 18,
    bio: "Renowned neurologist with expertise in stroke management, epilepsy, and movement disorders. Fellow of Indian Academy of Neurology.",
    consultationFee: 2000,
    rating: 4.9,
    totalReviews: 312,
    isVerified: true,
    availableDays: ["tuesday", "wednesday", "thursday", "friday"],
    availableHoursStart: "09:00",
    availableHoursEnd: "17:00",
  },
  {
    firstName: "Anjali",
    lastName: "Reddy",
    email: "anjali.reddy@mediconnect.in",
    phone: "+91-9876543213",
    specialization: "Pediatrics",
    licenseNumber: "MCI-2021-45678",
    experienceYears: 10,
    bio: "Pediatrician specializing in child development, vaccination, and adolescent health. Passionate about preventive care for children.",
    consultationFee: 1000,
    rating: 4.6,
    totalReviews: 156,
    isVerified: true,
    availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    availableHoursStart: "09:00",
    availableHoursEnd: "18:00",
  },
  {
    firstName: "Vikram",
    lastName: "Singh",
    email: "vikram.singh@mediconnect.in",
    phone: "+91-9876543214",
    specialization: "Orthopedics",
    licenseNumber: "MCI-2017-56789",
    experienceYears: 20,
    bio: "Orthopedic surgeon with expertise in joint replacement, sports medicine, and trauma surgery. MBBS, MS Orthopedics from AIIMS.",
    consultationFee: 1800,
    rating: 4.8,
    totalReviews: 278,
    isVerified: true,
    availableDays: ["monday", "tuesday", "thursday", "friday"],
    availableHoursStart: "10:00",
    availableHoursEnd: "18:00",
  },
  {
    firstName: "Deepika",
    lastName: "Nair",
    email: "deepika.nair@mediconnect.in",
    phone: "+91-9876543215",
    specialization: "Psychiatry",
    licenseNumber: "MCI-2020-67890",
    experienceYears: 14,
    bio: "Psychiatrist specializing in anxiety disorders, depression, and cognitive behavioral therapy. MD Psychiatry from NIMHANS Bangalore.",
    consultationFee: 1500,
    rating: 4.7,
    totalReviews: 201,
    isVerified: true,
    availableDays: ["monday", "wednesday", "friday", "saturday"],
    availableHoursStart: "11:00",
    availableHoursEnd: "19:00",
  },
  {
    firstName: "Rahul",
    lastName: "Mehta",
    email: "rahul.mehta@mediconnect.in",
    phone: "+91-9876543216",
    specialization: "Gynecology",
    licenseNumber: "MCI-2019-78901",
    experienceYears: 16,
    bio: "Gynecologist and obstetrician with expertise in high-risk pregnancies, infertility treatment, and minimally invasive surgery.",
    consultationFee: 1300,
    rating: 4.9,
    totalReviews: 267,
    isVerified: true,
    availableDays: ["tuesday", "wednesday", "thursday", "friday", "saturday"],
    availableHoursStart: "09:00",
    availableHoursEnd: "17:00",
  },
  {
    firstName: "Sneha",
    lastName: "Desai",
    email: "sneha.desai@mediconnect.in",
    phone: "+91-9876543217",
    specialization: "Ophthalmology",
    licenseNumber: "MCI-2021-89012",
    experienceYears: 11,
    bio: "Ophthalmologist specializing in cataract surgery, retinal diseases, and pediatric ophthalmology. MS Ophthalmology from Sankara Eye Care.",
    consultationFee: 1400,
    rating: 4.6,
    totalReviews: 178,
    isVerified: true,
    availableDays: ["monday", "tuesday", "thursday", "friday"],
    availableHoursStart: "09:00",
    availableHoursEnd: "18:00",
  },
  {
    firstName: "Karthik",
    lastName: "Iyer",
    email: "karthik.iyer@mediconnect.in",
    phone: "+91-9876543218",
    specialization: "ENT",
    licenseNumber: "MCI-2018-90123",
    experienceYears: 13,
    bio: "ENT specialist with expertise in sinus surgery, hearing disorders, and voice therapy. MS ENT from Christian Medical College Vellore.",
    consultationFee: 1100,
    rating: 4.5,
    totalReviews: 145,
    isVerified: true,
    availableDays: ["monday", "wednesday", "friday", "saturday"],
    availableHoursStart: "10:00",
    availableHoursEnd: "19:00",
  },
  {
    firstName: "Meera",
    lastName: "Joshi",
    email: "meera.joshi@mediconnect.in",
    phone: "+91-9876543219",
    specialization: "Dentistry",
    licenseNumber: "DCI-2020-01234",
    experienceYears: 9,
    bio: "Dental surgeon specializing in cosmetic dentistry, orthodontics, and oral surgery. BDS, MDS from Manipal College of Dental Sciences.",
    consultationFee: 800,
    rating: 4.4,
    totalReviews: 132,
    isVerified: true,
    availableDays: ["tuesday", "wednesday", "thursday", "friday", "saturday"],
    availableHoursStart: "09:00",
    availableHoursEnd: "17:00",
  },
  {
    firstName: "Arjun",
    lastName: "Malhotra",
    email: "arjun.malhotra@mediconnect.in",
    phone: "+91-9876543220",
    specialization: "Oncology",
    licenseNumber: "MCI-2017-12340",
    experienceYears: 17,
    bio: "Medical oncologist specializing in breast cancer, lung cancer, and hematological malignancies. DM Oncology from Tata Memorial Hospital.",
    consultationFee: 2500,
    rating: 4.9,
    totalReviews: 289,
    isVerified: true,
    availableDays: ["monday", "tuesday", "wednesday", "thursday"],
    availableHoursStart: "09:00",
    availableHoursEnd: "17:00",
  },
  {
    firstName: "Swati",
    lastName: "Gupta",
    email: "swati.gupta@mediconnect.in",
    phone: "+91-9876543221",
    specialization: "General Practice",
    licenseNumber: "MCI-2022-23451",
    experienceYears: 8,
    bio: "Family physician providing comprehensive primary care for all age groups. Focus on preventive medicine and chronic disease management.",
    consultationFee: 600,
    rating: 4.3,
    totalReviews: 98,
    isVerified: true,
    availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    availableHoursStart: "08:00",
    availableHoursEnd: "20:00",
  },
]

async function seedDoctors() {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error("❌ Error: DATABASE_URL environment variable is not set!")
    console.error("Please create a .env file in the project root with your DATABASE_URL")
    process.exit(1)
  }

  console.log("Starting to seed Indian doctors...")
  
  const defaultPassword = "doctor123" // Default password for all seeded doctors
  const passwordHash = await hashPassword(defaultPassword)

  for (const doctor of doctors) {
    try {
      // Check if doctor already exists
      const existing = await sql`
        SELECT id FROM users WHERE email = ${doctor.email}
      `
      
      if (existing.length > 0) {
        console.log(`Doctor ${doctor.firstName} ${doctor.lastName} already exists, skipping...`)
        continue
      }

      // Insert user
      const [user] = await sql`
        INSERT INTO users (
          email, password_hash, role, first_name, last_name, phone, is_active, email_verified
        )
        VALUES (
          ${doctor.email}, 
          ${passwordHash}, 
          'doctor', 
          ${doctor.firstName}, 
          ${doctor.lastName}, 
          ${doctor.phone},
          true,
          true
        )
        RETURNING id
      `

      // Insert doctor profile
      await sql`
        INSERT INTO doctor_profiles (
          user_id,
          specialization,
          license_number,
          experience_years,
          bio,
          consultation_fee,
          available_days,
          available_hours_start,
          available_hours_end,
          rating,
          total_reviews,
          is_verified
        )
        VALUES (
          ${user.id},
          ${doctor.specialization},
          ${doctor.licenseNumber},
          ${doctor.experienceYears},
          ${doctor.bio},
          ${doctor.consultationFee},
          ${doctor.availableDays},
          ${doctor.availableHoursStart},
          ${doctor.availableHoursEnd},
          ${doctor.rating},
          ${doctor.totalReviews},
          ${doctor.isVerified}
        )
      `

      console.log(`✓ Added doctor: Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialization})`)
    } catch (error) {
      console.error(`✗ Error adding doctor ${doctor.firstName} ${doctor.lastName}:`, error)
    }
  }

  console.log("\nSeeding completed!")
  console.log(`\nDefault password for all seeded doctors: ${defaultPassword}`)
  console.log("You can log in with any doctor's email and this password.")
}

// Run the seed function
seedDoctors()
  .then(() => {
    console.log("Done!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exit(1)
  })

