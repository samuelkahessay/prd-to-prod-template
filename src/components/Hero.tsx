import styles from './Hero.module.css'
import HeroCanvas from './HeroCanvas'

const TEMPLATE_URL = 'https://github.com/samuelkahessay/prd-to-prod-template/generate'
const REPO_URL = 'https://github.com/samuelkahessay/prd-to-prod-template'

export default function Hero() {
  return (
    <section className={styles.hero}>
      <HeroCanvas className={styles.canvas} />
      <div className={styles.content}>
        <p className={styles.eyebrow}>Autonomous Software Pipeline</p>
        <h1 className={styles.title}>
          From requirement
          <br />
          to production.
        </h1>
        <p className={styles.subtitle}>
          Drop a PRD. The pipeline decomposes, implements, reviews, merges, and
          deploys. If CI breaks, it fixes itself.
        </p>
        <div className={styles.buttons}>
          <a href={TEMPLATE_URL} target="_blank" rel="noopener noreferrer" className={styles.btn}>
            Use this template
          </a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={styles.btnGhost}>
            View on GitHub
          </a>
        </div>
      </div>
    </section>
  )
}
