import styles from './Nav.module.css'

const TEMPLATE_URL = 'https://github.com/samuelkahessay/prd-to-prod-template/generate'
const REPO_URL = 'https://github.com/samuelkahessay/prd-to-prod-template'

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <div className={styles.left}>
        <span className={styles.logo}>SK</span>
        <span className={styles.separator} />
        <span className={styles.name}>prd-to-prod</span>
      </div>
      <div className={styles.right}>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={styles.link}>
          GitHub
        </a>
        <a href={TEMPLATE_URL} target="_blank" rel="noopener noreferrer" className={styles.cta}>
          Use Template
        </a>
      </div>
    </nav>
  )
}
