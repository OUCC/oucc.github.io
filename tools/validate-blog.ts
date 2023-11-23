import * as path from 'path'

/**
 * 変更されたファイルが許可されているものに含まれているか判定します
 *
 * 許可されているファイルは以下のとおりです。
 * - src/content/blogs/*.md (blogs, tags, authors 以外)
 * - src/content/authors/*.json
 * - src/content/blog-metas/*.json (blogs, tags, authors 以外)
 * - src/content/tags/*.json
 */
function validateBlog() {
  let ok = true

  for (const arg of process.argv.slice(2)) {
    const parsedPath = path.parse(arg)
    if (parsedPath.dir === 'src/content/blogs' && parsedPath.ext === '.md') {
      if (!['blogs', 'tags', 'authors'].includes(parsedPath.name)) continue
    } else if (
      [
        'src/content/authors',
        'src/content/blog-metas',
        'src/content/tags',
      ].includes(parsedPath.dir) &&
      parsedPath.ext === '.json'
    ) {
      continue
    } else if (
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

process.exit(validateBlog() ? 0 : 1)
