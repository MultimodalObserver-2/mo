export default function PanelError({ pluginId }: { readonly pluginId: string }) {
  return (
    <p>
      The plugin with id <strong>{pluginId}</strong> is not loaded or does not exist. Please ensure
      the plugin is installed and loaded correctly.
    </p>
  )
}
