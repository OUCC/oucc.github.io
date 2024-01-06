// ./node_modules/remark-link-card/index.js

declare module 'remark-link-card' {
  /** https://github.com/gladevise/remark-link-card?tab=readme-ov-file#api */
  export interface RemarkLinkCardOptions {
    /**
     * Cache image for [`next/image`](https://nextjs.org/docs/api-reference/next/image) (`bool`, default:`false`)
     *
     * Automatically save open graph images and favicon images to `process.cwd()/public/remark-link-card/`.
     *
     * Automatically insert the path to images starting with `/remark-link-card/` in the src attribute of img tags.
     */
    cache?: boolean
    /**
     * Display only hostname of target URL (`bool`, default: `false`)
     */
    shortenUrl?: boolean
  }

  const rlc: (options?: RemarkLinkCardOptions) => (tree: any) => Promise<any>
  export default rlc
}
