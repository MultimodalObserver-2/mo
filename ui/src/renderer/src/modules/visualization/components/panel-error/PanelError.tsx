import { Trans } from "react-i18next"

export default function PanelError({ pluginId }: { readonly pluginId: string }) {
  return (
    <p>
      <Trans
        i18nKey="components.panelError.pluginNotLoaded"
        ns="visualization"
        values={{ pluginId }}
        components={{ strong: <strong /> }}
      />
    </p>
  )
}
