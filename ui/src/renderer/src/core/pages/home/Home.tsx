import Projects from "@renderer/modules/organization/components/projects/Projects"
import styles from "./home.module.css"
import Panel from "@renderer/core/components/panel/Panel"
import Participants from "@renderer/modules/organization/components/participants/Participants"
import Protocols from "@renderer/modules/organization/components/protocols/Protocols"
import CaptureSources from "@renderer/modules/capture/components/capture-sources/CaptureSources"
import CaptureButton from "@renderer/modules/capture/components/capture-actions/CaptureActions"
import Sessions from "@renderer/modules/capture/components/sessions/Sessions"
import CaptureHeader from "@renderer/modules/capture/components/capture-header/CaptureHeader"


export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.workspace}>
        <section className={styles["workspace-header"]}>
          <CaptureHeader />
        </section>
        <section className={styles["workspace-body"]}></section>
        <section className={styles["workspace-footer"]}>
          <CaptureButton />
        </section>
      </div>
      <Panel>
        <Projects />
        <Participants />
        <Sessions />
        <Protocols />
        <CaptureSources />
      </Panel>
    </main>
  )
}
