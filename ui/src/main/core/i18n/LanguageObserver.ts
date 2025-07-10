class LanguageObserver {
  private listeners: Array<(language: string) => void>

  constructor() {
    this.listeners = []
  }

  subscribe(listener) {
    this.listeners.push(listener)
    return () => this.unsubscribe(listener)
  }

  unsubscribe(listener) {
    this.listeners = this.listeners.filter((l) => l !== listener)
  }

  notify(language) {
    for (const listener of this.listeners) {
      listener(language)
    }
  }
}

const languageObserver = new LanguageObserver()
export default languageObserver
