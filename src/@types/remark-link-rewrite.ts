// ./node_modules/remark-link-rewrite/src/index.js

declare module 'remark-link-rewrite' {
  export interface RemarkLinkRewriteOptions {
    replacer: (url: string) => string | Promise<string>
  }

  /**
   * Rewrite the URL in a Markdown node.
   * @param options
   * @returns {function(*): Promise<*>}
   */
  function RemarkLinkRewrite(
    options: RemarkLinkRewriteOptions,
  ): (tree: any) => Promise<any>
  export default RemarkLinkRewrite
}
