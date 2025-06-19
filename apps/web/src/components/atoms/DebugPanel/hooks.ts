import type { DebugPanelProps } from './types'

export function useDebugPanel({
  onTimeChange,
  onUpdateLighting,
}: Pick<DebugPanelProps, 'onTimeChange' | 'onUpdateLighting'>): {
  handleTimeChange: (time: number | null) => void
  handlePWADebugShow: (expanded: boolean) => void
  handlePWADebugHide: () => void
} {
  const handleTimeChange = (time: number | null): void => {
    onTimeChange(time)
    onUpdateLighting()
  }

  const handlePWADebugShow = (expanded: boolean): void => {
    const event = new CustomEvent('pwa-debug-show', {
      detail: { expanded },
    })
    window.dispatchEvent(event)
  }

  const handlePWADebugHide = (): void => {
    const event = new CustomEvent('pwa-debug-hide')
    window.dispatchEvent(event)
  }

  return {
    handleTimeChange,
    handlePWADebugShow,
    handlePWADebugHide,
  }
}
