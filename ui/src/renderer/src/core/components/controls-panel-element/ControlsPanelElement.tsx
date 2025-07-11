import { useTranslation } from "react-i18next"
import styles from "./controls.module.css"
import panelControlsRegistry from "@renderer/core/store/panelControlsRegistry"
import { ElementHeader, ElementList, ElementTitle, PanelElement } from "../panel"

export default function ControlsPanelElement() {
  const { t } = useTranslation("core", { keyPrefix: "components.controlsPanelElement" })
  return (
    <PanelElement className={styles.panel}>
      <ElementHeader>
        <ElementTitle>{t("controls")}</ElementTitle>
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
