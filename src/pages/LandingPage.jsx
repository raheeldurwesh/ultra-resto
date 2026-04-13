// src/pages/LandingPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import hero1 from '../assets/hero1.png'
import hero2 from '../assets/hero2.png'
import hero3 from '../assets/hero3.png'

const IMAGES = [hero1, hero2, hero3]

export default function LandingPage() {
  const navigate = useNavigate()
  const [activeSlide, setActiveSlide] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % IMAGES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const ROLES = [
    { id: 'superadmin', name: 'Super Admin', icon: '🛡️', desc: 'Platform Management', accent: 'amber' },
    { id: 'admin',      name: 'Restaurant Admin', icon: '⚙️', desc: 'Menu & Staff Control', accent: 'amber' },
    { id: 'waiter',     name: 'Waiter Dashboard', icon: '👨‍🍳', desc: 'Order Tracking', accent: 'amber' },
  ]

  return (
    <div className="min-h-screen bg-base font-body text-bright overflow-x-hidden">
      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 z-50 w-full glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display italic text-amber text-2xl tracking-tight">TableServe</span>
          </div>
          <div className="flex md:hidden items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-amber p-2 transition-transform active:scale-90"
              aria-label="Toggle Menu"
            >
              <div className="space-y-1.5">
                <span className={`block w-6 h-0.5 bg-amber transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block w-6 h-0.5 bg-amber transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-4 h-0.5 bg-amber ml-auto transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2 w-6' : ''}`} />
              </div>
            </button>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-mid">
            <a href="#home" className="hover:text-amber transition-colors">Home</a>
            <a href="#how-it-works" className="hover:text-amber transition-colors">How It Works</a>
            <a href="#about" className="hover:text-amber transition-colors">About Us</a>
            <a href="#contact" className="hover:text-amber transition-colors">Contact</a>
            <button 
              onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-amber py-2 px-6"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`md:hidden absolute top-16 left-0 w-full glass border-b border-border/50 overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-96 py-6 opacity-100' : 'max-h-0 py-0 opacity-0'}`}>
          <div className="flex flex-col items-center gap-6 text-base font-semibold text-mid">
            <a 
              href="#home" 
              onClick={() => setIsMenuOpen(false)}
              className="hover:text-amber transition-colors"
            >
              Home
            </a>
            <a 
              href="#how-it-works" 
              onClick={() => setIsMenuOpen(false)}
              className="hover:text-amber transition-colors"
            >
              How It Works
            </a>
            <a 
              href="#about" 
              onClick={() => setIsMenuOpen(false)}
              className="hover:text-amber transition-colors"
            >
              About Us
            </a>
            <a 
              href="#contact" 
              onClick={() => setIsMenuOpen(false)}
              className="hover:text-amber transition-colors"
            >
              Contact
            </a>
            <button 
              onClick={() => {
                setIsMenuOpen(false)
                document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="btn-amber py-2.5 px-10 w-[80%]"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Carousel ──────────────────────────────────────────── */}
      <section id="home" className="relative h-[85vh] w-full overflow-hidden">
        <div className="carousel-container h-full">
          <div 
            className="carousel-track h-full" 
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {IMAGES.map((img, i) => (
              <div key={i} className="carousel-slide h-full relative">
                <img src={img} alt={`Slide ${i}`} className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-base via-base/20 to-transparent" />
              </div>
            ))}
          </div>
        </div>

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10">
          <h1 className="text-3xl sm:text-4xl md:text-7xl font-display font-bold mb-6 animate-slide-up bg-gradient-to-r from-amber to-amber-dim bg-clip-text text-transparent italic leading-[1.1]">
            Modernizing Your <br /> Dining Experience
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-mid max-w-sm sm:max-w-2xl mb-10 animate-slide-up [animation-delay:200ms]">
            TableServe is the all-in-one SaaS platform for visionary restaurant owners. 
            Automate orders, manage staff, and delight your guests with ease.
          </p>
          <div className="flex gap-4 animate-slide-up [animation-delay:400ms]">
            <button 
              onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-amber text-lg py-4 px-10 shadow-lg shadow-amber/20"
            >
              Get Started Now
            </button>
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-20">
          {IMAGES.map((_, i) => (
            <button 
              key={i} 
              onClick={() => setActiveSlide(i)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${activeSlide === i ? 'bg-amber w-8' : 'bg-mid/30'}`}
            />
          ))}
        </div>
      </section>

      {/* ── How It Works Section ───────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 relative">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-amber/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="section-title text-4xl mb-4">The TableServe Journey</h2>
            <p className="text-mid max-w-lg mx-auto italic">Four simple steps to transform your restaurant operations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Scan & Enter', desc: 'Customers scan the QR code to access your branded menu instantly.', icon: '📱' },
              { step: '02', title: 'Digital Orders', desc: 'Guests browse categories and place orders directly from their phones.', icon: '🛒' },
              { step: '03', title: 'Instant Sync', desc: 'Orders appear on the Waiter board immediately via cloud sync.', icon: '⚡' },
              { step: '04', title: 'Live Growth', desc: 'Admins track every sale and update configurations in real-time.', icon: '📈' },
            ].map((s, i) => (
              <div key={i} className="group relative pt-8 animate-fade-in" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="absolute top-0 left-0 text-7xl font-display font-black text-amber/5 group-hover:text-amber/10 transition-colors pointer-events-none">
                  {s.step}
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber/10 flex items-center justify-center text-3xl group-hover:bg-amber/20 transition-all group-hover:scale-110">
                    {s.icon}
                  </div>
                  <h3 className="text-xl font-display font-bold text-bright">{s.title}</h3>
                  <p className="text-mid text-sm leading-relaxed">{s.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-[60px] -right-4 w-8 h-[2px] bg-gradient-to-r from-amber/20 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Login/Roles Section ────────────────────────────────────── */}
      <section id="login-section" className="py-24 px-6 bg-surface/30">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="section-title text-4xl mb-4">Choose Your Portal</h2>
          <p className="text-mid mb-16 max-w-lg mx-auto italic">Select your role to access your personalized dashboard.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ROLES.map((r, i) => (
              <div 
                key={r.id}
                onClick={() => navigate(`/login/${r.id}`)}
                className="group glass-card p-6 sm:p-10 rounded-3xl cursor-pointer hover:border-amber/40 transition-all active:scale-[0.98] animate-scale-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-20 h-20 rounded-2xl bg-amber/10 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform">
                  {r.icon}
                </div>
                <h3 className="text-2xl font-display font-semibold mb-2">{r.name}</h3>
                <p className="text-mid text-sm mb-8">{r.desc}</p>
                <div className="flex items-center justify-center gap-2 text-amber font-bold text-sm uppercase tracking-widest">
                  Sign In <span>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Section ─────────────────────────────────────────── */}
      <section id="about" className="py-24 px-6 bg-base">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <h2 className="section-title text-4xl">Built for Scale,<br />Designed for People</h2>
            <div className="space-y-4 text-mid leading-relaxed italic">
              <p>
                TableServe was founded by <strong>Raheel Durwesh</strong> with a singular mission: to bridge the gap between human hospitality and digital efficiency.
              </p>
              <p>
                We believe that technology should fade into the background, leaving only the warmth of a great meal and the precision of a well-run business.
              </p>
              <p>
                Whether you are a local café or a multi-city franchise, TableServe grows with you.
              </p>
            </div>
          </div>
          <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden border-2 border-amber/20 shadow-2xl rotate-3">
             <img src={hero2} alt="Raheel Durwesh" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* ── Contact Section ───────────────────────────────────────── */}
      <section id="contact" className="py-24 px-6 bg-surface/50 relative overflow-hidden">
        {/* Contact Background Glow */}
        <div className="absolute -bottom-40 -left-20 w-96 h-96 bg-amber/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto">
          <div className="glass-card rounded-3xl sm:rounded-[40px] p-6 sm:p-12 overflow-hidden relative">
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16">
              <div>
                <h2 className="section-title text-4xl mb-6">Let's Connect</h2>
                <p className="text-mid mb-10 text-lg">
                  Have questions or need a custom solution? Reach out directly to our founder.
                </p>
                
                <div className="space-y-8">
                  <a 
                    href="https://wa.me/919359300613" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-5 group/item cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-amber/10 flex items-center justify-center text-xl group-hover/item:bg-amber/20 transition-colors">📱</div>
                    <div>
                      <p className="text-xs text-amber font-bold uppercase tracking-widest">WhatsApp</p>
                      <p className="text-bright font-semibold group-hover/item:text-amber transition-colors">+91 93593 00613</p>
                    </div>
                  </a>
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-amber/10 flex items-center justify-center text-xl">📸</div>
                    <div>
                      <p className="text-xs text-amber font-bold uppercase tracking-widest">Instagram</p>
                      <a href="https://www.instagram.com/raheeldurwesh" target="_blank" rel="noopener noreferrer" className="text-bright font-semibold hover:text-amber transition-colors">
                        @raheeldurwesh
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <form className="space-y-4" onSubmit={e => e.preventDefault()}>
                <input className="input h-14" placeholder="Your Name" />
                <input className="input h-14" placeholder="Email Address" />
                <textarea className="input min-h-[140px]" placeholder="How can we help?" />
                <button className="btn-amber w-full py-4 text-base shadow-xl">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="py-12 px-6 border-t border-border bg-base text-center">
        <p className="font-display italic text-amber text-2xl mb-4">TableServe</p>
        <p className="text-faint text-sm mb-6">© 2026 TableServe POS Systems. All rights reserved.</p>
        <div className="flex justify-center gap-6 text-faint text-xs uppercase tracking-widest">
           <a href="#home" className="hover:text-amber">Home</a>
           <a href="#about" className="hover:text-amber">About</a>
           <a href="#contact" className="hover:text-amber">Contact</a>
        </div>
      </footer>
    </div>
  )
}
