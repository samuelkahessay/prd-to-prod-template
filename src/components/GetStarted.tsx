import styles from './GetStarted.module.css'
import ScrollReveal from './ScrollReveal'

const TEMPLATE_URL = 'https://github.com/samuelkahessay/prd-to-prod-template/generate'

export default function GetStarted() {
  return (
    <section className={styles.section}>
      <div className="content">
        <ScrollReveal>
          <h2 className={styles.title}>Start building.</h2>
        </ScrollReveal>
        <ScrollReveal delay={55}>
          <a href={TEMPLATE_URL} target="_blank" rel="noopener noreferrer" className={styles.cta}>
            Use this template &rarr;
          </a>
        </ScrollReveal>
      </div>
    </section>
  )
}
