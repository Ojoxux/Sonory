declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config' | 'consent' | 'js' | 'set',
      targetId: string | Date,
      parameters?: Record<string, any>,
    ) => void
  }
}

export {}
