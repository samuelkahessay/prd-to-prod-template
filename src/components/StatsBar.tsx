import { getStats } from '@/lib/github'
import styles from './StatsBar.module.css'

export default async function StatsBar() {
  const stats = await getStats()

  return (
    <section className={styles.bar}>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.label}>PRs Merged</span>
          <span className={styles.value}>{stats.prsMerged}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}>Deploys</span>
          <span className={styles.value}>{stats.deploys}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}>Self-Heals</span>
          <span className={styles.value}>{stats.selfHeals}</span>
        </div>
      </div>
    </section>
  )
}
