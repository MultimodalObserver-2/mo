import { ConfigProvider } from "../components/configurations-panel/ConfigurationsPanel"

export interface ConfigProviderState {
  id: string
  order?: number
  configProvider: ConfigProvider
}

class ConfigProviderRegistry {
  private providers: ConfigProviderState[] = []

  register(provider: ConfigProviderState): void {
    const filtered = this.providers.filter((p) => p.id !== provider.id)
    this.providers = [...filtered, provider].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  unregister(id: string): void {
    this.providers = this.providers.filter((p) => p.id !== id)
  }

  registerMany(newProviders: ConfigProviderState[]): void {
    newProviders.forEach((provider) => {
      const filtered = this.providers.filter((p) => p.id !== provider.id)
      this.providers = [...filtered, provider].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    })
  }

  getProviders(): ConfigProviderState[] {
    return this.providers
  }

  getConfigProviders(): ConfigProvider[] {
    return this.providers.map((p) => p.configProvider)
  }
}

const configProviderRegistry = new ConfigProviderRegistry()
export default configProviderRegistry
