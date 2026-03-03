import styles from './Pipeline.module.css'
import PipelineCanvas from './PipelineCanvas'

export default function Pipeline() {
  return (
    <section className={styles.pipeline}>
      <PipelineCanvas className={styles.canvas} />
    </section>
  )
}
