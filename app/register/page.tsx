import { RegisterForm } from "@/components/auth/register-form"
import Link from "next/link"
import { Heart } from "lucide-react"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Heart className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold">MediConnect</span>
      </Link>
      <RegisterForm />
    </div>
  )
}
