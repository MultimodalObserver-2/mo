import Projects from "@renderer/modules/organization/components/projects/Projects"
import styles from "./home.module.css"
import Panel from "@renderer/core/components/panel/Panel"

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.workspace}></section>
      <Panel>
        <Projects />
      </Panel>
    </main>
  )
}
