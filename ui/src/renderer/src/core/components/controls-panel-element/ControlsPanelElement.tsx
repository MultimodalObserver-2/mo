import styles from "./controls.module.css"
import panelControlsRegistry from "@renderer/core/store/panelControlsRegistry"
import { ElementHeader, ElementList, ElementTitle, PanelElement } from "../panel"

export default function ControlsPanelElement() {
  return (
    <PanelElement className={styles.panel}>
      <ElementHeader>
        <ElementTitle>Controls</ElementTitle>
      </ElementHeader>
      <ElementList>
        {panelControlsRegistry.getControls().map((control) => {
          const ControlComponent = control.render
          return <ControlComponent key={control.id} />
        })}
      </ElementList>
    </PanelElement>
  )
}
