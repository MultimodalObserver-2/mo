import panelRegistry from "@renderer/core/store/panelRegistry"
import { Panel } from "../panel"
import styles from "./app-shell.module.css"

interface AppShellProps {
  readonly children?: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <main className={styles.main}>
      {children}
      <Panel>
        {panelRegistry.getItems().map((item) => {
          return <item.render key={item.id} />
        })}
      </Panel>
    </main>
  )
}
