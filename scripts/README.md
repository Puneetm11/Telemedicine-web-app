# Database Seed Scripts

## Seed Indian Doctors

This script adds fake Indian doctors with different specializations and fake reviews to the database.

### Usage

Run the following command from the project root:

```bash
npm run seed:doctors
```

Or using npx directly:

```bash
npx tsx scripts/002-seed-indian-doctors.ts
```

### What it does

- Creates 12 Indian doctors with different specializations:
  - Cardiology
  - Dermatology
  - Neurology
  - Pediatrics
  - Orthopedics
  - Psychiatry
  - Gynecology
  - Ophthalmology
  - ENT
  - Dentistry
  - Oncology
  - General Practice

- Each doctor includes:
  - Indian name (first and last name)
  - Email address
  - Phone number (Indian format)
  - Specialization
  - License number
  - Years of experience
  - Professional bio
  - Consultation fee (in rupees)
  - Rating (between 4.3 and 4.9)
  - Total reviews (between 98 and 312)
  - Verification status (all verified)
  - Available days and hours

### Default Credentials

All seeded doctors use the same default password:
- **Password**: `doctor123`

You can log in with any doctor's email address and this password.

### Example Doctor Emails

- `rajesh.kumar@mediconnect.in`
- `priya.sharma@mediconnect.in`
- `amit.patel@mediconnect.in`
- `anjali.reddy@mediconnect.in`
- ... and 8 more

### Notes

- The script checks if a doctor already exists before inserting, so it's safe to run multiple times
- If a doctor with the same email already exists, it will be skipped
- Make sure your `DATABASE_URL` environment variable is set correctly

