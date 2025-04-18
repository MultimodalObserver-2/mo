import Projects from "@renderer/modules/organization/components/projects/Projects"
import styles from "./home.module.css"

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.playground}></section>
      <section className={styles.panel}>
        <Projects />
      </section>
    </main>
  )
}
