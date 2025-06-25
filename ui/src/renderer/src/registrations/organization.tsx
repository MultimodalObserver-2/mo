import captureConfigProvider from "@renderer/modules/capture/components/capture-sources/captureSourceConfigs"
import configProviderRegistry from "@renderer/modules/organization/store/configProviderRegistry"
import playbackConfigProvider from "@renderer/modules/visualization/components/playback-views-configs/playbackViewsConfigs"

export function registerConfigProviders() {
  configProviderRegistry.registerMany([
    {
      id: "capture-sources",
      order: 1,
      configProvider: captureConfigProvider
    },
    {
      id: "playback-views",
      order: 2,
      configProvider: playbackConfigProvider
    }
  ])
}
