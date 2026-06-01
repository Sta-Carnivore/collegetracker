import { C } from '@/lib/atlas'
import Nav from '@/components/landing/Nav'
import Hero from '@/components/landing/Hero'
import ProblemStrip from '@/components/landing/ProblemStrip'
import FeatureJourney from '@/components/landing/FeatureJourney'
import TrackerSection from '@/components/landing/TrackerSection'
import PlannerSection from '@/components/landing/PlannerSection'
import BioSection from '@/components/landing/BioSection'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.ink, fontFamily: 'var(--font-sans)' }}>
      <Nav />
      <Hero />
      <ProblemStrip />
      <FeatureJourney />
      <TrackerSection />
      <PlannerSection />
      <BioSection />
      <FinalCTA />
      <Footer />
    </div>
  )
}
