/** 対象のURL */
const pattern = new RegExp(
  `^(${import.meta.env.SITE.replaceAll('.', '\\.')}|/)`,
)

/**
 * oucc.orgに向けたURLの末尾に/をつけます
 */
export function formatUrl(path: string | URL): string {
  if (path instanceof URL) return formatUrl(path.href)

  if (!path.match(pattern)) return path

  const [url, hash] = path.split('#')

  if (url!.endsWith('/')) return path
  return hash ? `${url}/#${hash}` : url + '/'
}

/**
 * oucc.orgに向けたURLの末尾に/がない場合、例外を発生させます
 * @throws {Error} - URLが条件を満たさない場合に発生する例外
 */
export function validateUrl(path: string): void {
  if (!path.match(pattern)) return

  const [url] = path.split('#')

  if (url!.endsWith('/')) return

  throw new Error(`URLの末尾には/が必要です。 url:${url}`)
}
