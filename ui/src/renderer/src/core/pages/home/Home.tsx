import styles from "./home.module.css"
import Panel from "@renderer/core/components/panel/Panel"
import panelRegistry from "@renderer/core/store/panelRegistry"
import CaptureButton from "@renderer/modules/capture/components/capture-actions/CaptureActions"
import CaptureHeader from "@renderer/modules/capture/components/capture-header/CaptureHeader"
import PlaybackDock from "@renderer/modules/visualization/components/playback-dock/PlaybackDock"

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.workspace}>
        <section className={styles["workspace-header"]}>
          <CaptureHeader />
        </section>
        <section className={styles["workspace-body"]}>
          <PlaybackDock />
        </section>
        <section className={styles["workspace-footer"]}>
          <CaptureButton />
        </section>
      </div>
      <Panel>
        {panelRegistry.getItems().map((item) => {
          return <item.render key={item.id} />
        })}
      </Panel>
    </main>
  )
}
