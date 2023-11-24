import * as path from 'path'

process.exit(validateBlog() ? 0 : 1)

/**
 * 変更されたファイルが許可されているものに含まれているか判定します
 *
 * 許可されているファイルは以下のとおりです。
 * - src/content/blogs/*.md (blogs, tags, authors 以外)
 * - src/content/blogs/ より一階層下にある画像
 * - src/content/authors/*.json
 * - src/content/blog-metas/*.json (blogs, tags, authors 以外)
 * - src/content/tags/*.json
 * - src/assets/icons/blog/*.svg
 */
function validateBlog() {
  let ok = true

  for (const arg of process.argv.slice(2)) {
    const parsedPath = path.parse(arg)

    if (parsedPath.dir === 'src/content/blogs') {
      // ブログ本体
      if (
        parsedPath.ext === '.md' &&
        !['blogs', 'tags', 'authors'].includes(parsedPath.name)
      )
        continue
    } else if (parsedPath.dir === 'src/content/blog-metas') {
      // ブログのメタ情報
      if (
        parsedPath.ext === '.json' &&
        !['blogs', 'tags', 'authors'].includes(parsedPath.name)
      )
        continue
    } else if (parsedPath.dir.startsWith('src/content/blogs/')) {
      // 画像
      if (
        [
          '.jpg',
          '.jpeg',
          '.jfif',
          '.pjpeg',
          '.pjp',
          '.png',
          '.svg',
          '.webp',
          '.gif',
          '.avif',
          '.apng',
        ].includes(parsedPath.ext)
      )
        continue
    } else if (
      // ブログの著者・タグ
      ['src/content/authors', 'src/content/tags'].includes(parsedPath.dir) &&
      parsedPath.ext === '.json'
    ) {
      continue
    } else if (
      // ブログのアイコン
      parsedPath.dir === 'src/assets/icons/blog' &&
      parsedPath.ext === '.svg'
    ) {
      continue
    }

    console.log(
      `\u001b[31m[ERROR]\tYou are not allowed to change the file: ${arg}\u001b[m`,
    )
    ok = false
  }

  return ok
}
