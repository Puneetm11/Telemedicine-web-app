import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, MessageSquare, FileText, Shield, Clock, Stethoscope, Heart } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">MediConnect</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-balance">
            Healthcare at Your Fingertips
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Connect with qualified healthcare professionals, manage appointments, access medical records, and receive
            prescriptions - all from the comfort of your home.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start Your Health Journey
              </Button>
            </Link>
            <Link href="/register?role=doctor">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                Join as a Doctor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">Everything You Need for Better Health</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-0 bg-accent/50">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Easy Scheduling</h3>
              <p className="text-sm text-muted-foreground">
                Book appointments with specialists in just a few clicks. View available slots and choose what works for
                you.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-accent/50">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Secure Messaging</h3>
              <p className="text-sm text-muted-foreground">
                Communicate directly with your healthcare providers through our encrypted messaging system.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-accent/50">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Digital Records</h3>
              <p className="text-sm text-muted-foreground">
                Store and access your medical reports, prescriptions, and health history in one secure place.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-accent/50">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">E-Prescriptions</h3>
              <p className="text-sm text-muted-foreground">
                Receive digital prescriptions from your doctor and track your medications effortlessly.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-accent/50">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Privacy First</h3>
              <p className="text-sm text-muted-foreground">
                Your health data is protected with industry-standard encryption and security measures.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-accent/50">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">24/7 Access</h3>
              <p className="text-sm text-muted-foreground">
                Access your health information anytime, anywhere. Your medical data is always available.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 text-center md:grid-cols-3">
            <div>
              <div className="mb-2 text-4xl font-bold">10,000+</div>
              <div className="text-primary-foreground/80">Registered Patients</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold">500+</div>
              <div className="text-primary-foreground/80">Verified Doctors</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold">50,000+</div>
              <div className="text-primary-foreground/80">Consultations Completed</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Take Control of Your Health?</h2>
          <p className="mb-8 text-muted-foreground">
            Join thousands of patients who trust MediConnect for their healthcare needs.
          </p>
          <Link href="/register">
            <Button size="lg">Create Free Account</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Heart className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold">MediConnect</span>
              </Link>
              <p className="text-sm text-muted-foreground">Making healthcare accessible to everyone, everywhere.</p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">For Patients</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/register" className="hover:text-foreground">
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-foreground">
                    Find a Doctor
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-foreground">
                    Book Appointment
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">For Doctors</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/register?role=doctor" className="hover:text-foreground">
                    Join Network
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-foreground">
                    Doctor Portal
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} MediConnect. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
