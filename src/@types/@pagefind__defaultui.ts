// node_modules/@pagefind/default-ui/ui.js

declare module '@pagefind/default-ui' {
  class PagefindUI {
    constructor(opts: {
      element?: string | HTMLElement
      bundlePath?: string
      pageSize?: number
      resetStyles?: boolean
      showImages?: boolean
      showSubResults?: boolean
      excerptLength?: number
      processResult?: any
      processTerm?: any
      showEmptyFilters?: boolean
      debounceTimeoutMs?: number
      mergeIndex?: any
      translations?: any
      autofocus?: boolean
      sort?: any
    })

    triggerSearch(term: any): void

    triggerFilters(filters: Record<string, string>): void

    destory(): void
  }
}
