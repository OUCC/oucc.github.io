export const disableScroll = () => {
  document.addEventListener('touchmove', cancelEvent, { passive: false })
  document.addEventListener('wheel', cancelEvent, { passive: false })
}

export const enableScroll = () => {
  document.removeEventListener('touchmove', cancelEvent)
  document.removeEventListener('wheel', cancelEvent)
}

const cancelEvent = (e: Event) => {
  e.preventDefault()
}
