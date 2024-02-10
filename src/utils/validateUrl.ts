/**
 * oucc.orgに向けたURLの末尾に/をつけます
 */
export function getFormatUrl(base: string = import.meta.env.SITE) {
  /** 対象のURL */
  const pattern = new RegExp(`^(${base.replaceAll('.', '\\.')}|/)`)

  return function formatUrl(path: string | URL): string {
    if (path instanceof URL) return formatUrl(path.href)

    if (!path.match(pattern)) return path

    const [url, hash] = path.split('#')

    if (url!.endsWith('/')) return path
    // ファイル拡張子
    if (url!.match(/\.(a-zA-Z0-9)+$/)) return path

    return hash ? `${url}/#${hash}` : url + '/'
  }
}
