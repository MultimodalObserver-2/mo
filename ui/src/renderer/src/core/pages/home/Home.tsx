import styles from "./home.module.css"
import Panel from "@renderer/core/components/panel/Panel"
import CaptureButton from "@renderer/modules/capture/components/capture-actions/CaptureActions"
import CaptureHeader from "@renderer/modules/capture/components/capture-header/CaptureHeader"
import { useSelector } from "react-redux"
import { selectPanelItems } from "@renderer/core/store/panelRegistry"

export default function Home() {
  const panelItems = useSelector(selectPanelItems)
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
        {panelItems.map((item) => {
          return <item.render key={item.id} />
        })}
      </Panel>
    </main>
  )
}
