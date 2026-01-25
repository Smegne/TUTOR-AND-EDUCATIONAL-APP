"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  BookOpen,
  Target,
  Shield,
  TrendingUp,
  Users,
  Award,
  CheckCircle2,
  Star,
  Menu,
  X,
  Sparkles,
  Zap,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">ጥናት ቤት</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => scrollToSection("features")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("testimonials")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Testimonials
              </button>
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-secondary hover:bg-secondary/90">Get Started</Button>
              </Link>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-border py-4 space-y-3 bg-background/95 backdrop-blur-lg">
              <button
                onClick={() => scrollToSection("features")}
                className="block w-full text-left px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="block w-full text-left px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("testimonials")}
                className="block w-full text-left px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                Testimonials
              </button>
              <div className="px-4 pt-2 space-y-2">
                <Link href="/auth/login" className="block">
                  <Button variant="ghost" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup" className="block">
                  <Button className="w-full bg-secondary hover:bg-secondary/90">Get Started</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      <section className="relative overflow-hidden py-20 lg:py-32 min-h-[90vh] flex items-center">
        {/* Animated gradient background */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-background animate-gradient"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        />

        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-secondary/20 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-40 right-20 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/3 w-16 h-16 bg-accent/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div
              className={`space-y-8 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-medium backdrop-blur-sm border border-secondary/20 hover:scale-105 transition-transform duration-300">
                <Sparkles className="h-4 w-4 animate-pulse" />
                Trusted by 500+ Tutors and Parents
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-balance leading-tight">
                Build Better{" "}
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient">
                  Study Habits
                </span>{" "}
                for Primary Students
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground text-pretty leading-relaxed">
                A safe, private learning platform designed for Grade 5-8 students. Real tutor guidance, transparent
                parent monitoring, and motivating progress tracking—all in one child-friendly environment.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/auth/signup">
                  <Button
                    size="lg"
                    className="bg-secondary hover:bg-secondary/90 h-14 px-10 text-lg font-semibold rounded-2xl hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-secondary/50"
                  >
                    Start Free Trial
                    <Zap className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-10 text-lg font-semibold rounded-2xl hover:scale-105 transition-all duration-300 backdrop-blur-sm bg-transparent"
                  onClick={() => scrollToSection("how-it-works")}
                >
                  See How It Works
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                {[
                  { icon: Shield, text: "100% Safe" },
                  { icon: Clock, text: "24/7 Access" },
                  { icon: CheckCircle2, text: "Real Tutors" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 group">
                    <item.icon className="h-5 w-5 text-secondary group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-sm font-medium text-muted-foreground">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Animated stats */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                {[
                  { value: "+", label: "Active Tutors" },
                  { value: "+", label: "Happy Students" },
                  { value: "%", label: "Success Rate" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="text-center p-4 bg-card/50 backdrop-blur-sm rounded-xl border border-border hover:border-secondary/50 transition-all duration-300 hover:scale-105"
                  >
                    <div className="text-2xl md:text-3xl font-bold text-secondary">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`relative transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}
            >
              <div className="aspect-square relative">
                {/* Glowing border effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/50 via-secondary/50 to-accent/50 rounded-3xl blur-2xl opacity-50 animate-pulse" />

                <img
                  src="/happy-student-learning-with-tablet-in-colorful-edu.jpg"
                  alt="Student Learning"
                  className="relative rounded-3xl shadow-2xl object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                />

                {/* Floating stats card */}
                <div className="absolute -bottom-6 -left-6 bg-card/90 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-border max-w-xs hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-secondary animate-pulse" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">95% Completion</p>
                      <p className="text-xs text-muted-foreground">This week</p>
                    </div>
                  </div>
                </div>

                {/* Achievement badge */}
                <div className="absolute -top-4 -right-4 bg-gradient-to-br from-primary to-secondary p-4 rounded-2xl shadow-xl animate-bounce">
                  <Award className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-block px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-4">
              ✨ Powerful Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Everything Your Child Needs to Succeed</h2>
            <p className="text-lg text-muted-foreground text-pretty">
              A complete learning ecosystem designed around safety, motivation, and real educational progress.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: "Clear Daily Tasks",
                description:
                  "Simple, structured daily learning activities created by real tutors. No distractions, just focused learning.",
                gradient: "from-secondary/20 to-secondary/5",
              },
              {
                icon: Shield,
                title: "100% Child-Safe",
                description:
                  "No social feeds, no ads, no strangers. A completely secure and private learning environment.",
                gradient: "from-primary/20 to-primary/5",
              },
              {
                icon: TrendingUp,
                title: "Progress Tracking",
                description:
                  "Visual progress bars, study streaks, and achievement badges that motivate without pressure.",
                gradient: "from-accent/20 to-accent/5",
              },
              {
                icon: Users,
                title: "Parent Transparency",
                description:
                  "Clear, calm dashboards showing your child's daily and weekly learning progress at a glance.",
                gradient: "from-secondary/20 to-primary/5",
              },
              {
                icon: BookOpen,
                title: "Real Tutor Guidance",
                description:
                  "Tasks created and monitored by qualified tutors who adjust content based on your child's needs.",
                gradient: "from-primary/20 to-secondary/5",
              },
              {
                icon: Award,
                title: "Positive Motivation",
                description: "Ethical gamification that encourages consistency without creating unhealthy competition.",
                gradient: "from-accent/20 to-primary/5",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="border-2 hover:border-secondary/50 transition-all duration-500 group hover:scale-105 hover:shadow-xl hover:shadow-secondary/10 backdrop-blur-sm"
                style={{
                  animationDelay: `${index * 100}ms`,
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(20px)",
                  transition: `all 0.6s ease-out ${index * 100}ms`,
                }}
              >
                <CardContent className="p-6 relative overflow-hidden">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />

                  <div className="relative">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <feature.icon className="h-7 w-7 text-secondary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">How ጥናት ቤት Works</h2>
            <p className="text-lg text-muted-foreground text-pretty">
              Three simple roles working together to build better study habits
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                role: "For Students",
                steps: [
                  "Log in with a simple, child-safe interface",
                  "View daily tasks assigned by your tutor",
                  "Complete activities at your own pace",
                  "Track your progress and earn badges",
                ],
                color: "from-secondary to-secondary/70",
              },
              {
                role: "For Tutors",
                steps: [
                  "Create customized learning tasks",
                  "Assign tasks to individual students",
                  "Monitor real-time progress and performance",
                  "Adjust difficulty based on student needs",
                ],
                color: "from-primary to-primary/70",
              },
              {
                role: "For Parents",
                steps: [
                  "View your child's daily learning status",
                  "Review weekly progress summaries",
                  "Receive alerts for missed or completed tasks",
                  "Support your child's learning journey",
                ],
                color: "from-secondary/80 to-primary/80",
              },
            ].map((item, index) => (
              <Card key={index} className="border-2 relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color}`} />
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-6 text-balance">{item.role}</h3>
                  <ul className="space-y-4">
                    {item.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-semibold text-secondary">{stepIndex + 1}</span>
                        </div>
                        <span className="text-muted-foreground leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Trusted by Parents and Educators</h2>
            <p className="text-lg text-muted-foreground text-pretty">
              See how ጥናት ቤት is transforming study habits for primary students
            </p>
          </div>

         
        </div>
      </section>

      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-background animate-gradient" />

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-2 border-secondary/20 bg-gradient-to-br from-card/80 to-card backdrop-blur-xl overflow-hidden relative group hover:scale-[1.02] transition-transform duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <CardContent className="p-12 md:p-16 text-center relative">
              <div className="inline-block px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-6">
                🚀 Get Started Today
              </div>

              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
                Ready to Transform Your Child's Learning?
              </h2>

              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty">
                Join hundreds of families building better study habits with ጥናት ቤት. Start your free trial today.
              </p>

              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button
                    size="lg"
                    className="bg-secondary hover:bg-secondary/90 h-14 px-10 text-lg font-semibold rounded-2xl hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-secondary/50"
                  >
                    Start Free Trial
                    <Sparkles className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-10 text-lg font-semibold rounded-2xl hover:scale-105 transition-all duration-300 backdrop-blur-sm bg-transparent"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center justify-center gap-8 mt-10 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-secondary" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-secondary" />
                  14-day free trial
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-secondary" />
                  Cancel anytime
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">ጥናት ቤት</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Safe, private learning for primary students. Built with care for children's education.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button
                    onClick={() => scrollToSection("features")}
                    className="hover:text-foreground transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("how-it-works")}
                    className="hover:text-foreground transition-colors"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("testimonials")}
                    className="hover:text-foreground transition-colors"
                  >
                    Testimonials
                  </button>
                </li>
              </ul>
            </div>
            {/* <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-foreground transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/help" className="hover:text-foreground transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-foreground transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground transition-colors">
                    Get in Touch
                  </Link>
                </li>
              </ul>
            </div> */}
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 ጥናት ቤት. All rights reserved. Built for better learning outcomes.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
