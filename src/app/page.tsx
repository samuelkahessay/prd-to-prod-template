import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import Pipeline from '@/components/Pipeline'
import HowItWorks from '@/components/HowItWorks'
import MetaSection from '@/components/MetaSection'
import StatsBar from '@/components/StatsBar'
import GetStarted from '@/components/GetStarted'
import Footer from '@/components/Footer'
import MagneticCursor from '@/components/MagneticCursor'

export default function Home() {
  return (
    <>
      <MagneticCursor />
      <Nav />
      <main>
        <Hero />
        <Pipeline />
        <HowItWorks />
        <MetaSection />
        <StatsBar />
        <GetStarted />
        <Footer />
      </main>
    </>
  )
}
