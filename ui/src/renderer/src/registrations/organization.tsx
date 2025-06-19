import captureConfigProvider from "@renderer/modules/capture/components/capture-sources/captureSourceConfigs"
import { registerConfigProviders } from "@renderer/modules/organization/store/configProvidersSlice"
import playbackConfigProvider from "@renderer/modules/visualization/components/playback-views/playbackViewsConfigs"
import store from "@renderer/store"

store.dispatch(
  registerConfigProviders([
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
)
