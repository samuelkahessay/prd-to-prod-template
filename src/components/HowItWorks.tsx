import styles from './HowItWorks.module.css'
import ScrollReveal from './ScrollReveal'

const STEPS = [
  {
    number: '01',
    title: 'DROP A PRD',
    description:
      'Write what you want built. The decomposer agent breaks it into scoped, implementable issues\u2009\u2014\u2009each one a unit of work.',
  },
  {
    number: '02',
    title: 'WATCH IT BUILD',
    description:
      'repo-assist picks up each issue, reads the codebase, writes code, and opens PRs. The review agent checks the work against your acceptance criteria.',
  },
  {
    number: '03',
    title: 'IT FIXES ITSELF',
    description:
      'CI breaks on main? A repair issue opens automatically. The agent reads the failure logs, pushes a fix, and the loop closes. Zero human intervention.',
  },
]

export default function HowItWorks() {
  return (
    <section className={styles.section}>
      <div className="content">
        <div className={styles.steps}>
          {STEPS.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 55}>
              <div className={styles.step}>
                <span className={styles.number}>{step.number}</span>
                <div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.description}>{step.description}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
