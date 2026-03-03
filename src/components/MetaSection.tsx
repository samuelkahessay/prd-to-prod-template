import styles from './MetaSection.module.css'
import ScrollReveal from './ScrollReveal'

export default function MetaSection() {
  return (
    <section className={styles.section}>
      <div className="content">
        <ScrollReveal>
          <p className={styles.eyebrow}>This page was built by the pipeline</p>
        </ScrollReveal>
        <ScrollReveal delay={55}>
          <p className={styles.description}>
            This site is a Next.js app deployed on Vercel. It was implemented by
            repo-assist, reviewed by pr-review-agent, and deployed on merge. The
            pipeline&apos;s first customer is itself.
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
