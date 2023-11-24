import * as fs from 'fs'
import * as path from 'path'

const ok = validateExistingFiles()
if (!ok) process.exit(1)
updateBlogMeta()

type BlogMeta = {
  postDate: string
  updateDate?: string
}

function validateExistingFiles() {
  let ok = true
  for (const file of process.argv.slice(2)) {
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      console.log(`\u001b[31m[ERROR]\tThe file was not found: ${file}\u001b[m`)
      ok = false
    }
  }
  return ok
}

/**
 * blog meta のファイルの日付を更新します
 */
function updateBlogMeta() {
  for (const { dir, name } of process.argv
    .slice(2)
    .map(path.parse)
    .filter(
      (parsedPath) =>
        parsedPath.dir === 'src/content/blogs' && parsedPath.ext === '.md',
    )) {
    const blogMetaPath = path.resolve(dir, `./blog-meta/${name}.json`)

    let meta: BlogMeta | null = null
    if (fs.existsSync(blogMetaPath)) {
      meta = JSON.parse(
        fs.readFileSync(blogMetaPath, { encoding: 'utf-8' }),
      ) as BlogMeta

      meta.updateDate = new Date().toISOString()
    } else {
      meta = {
        postDate: new Date().toISOString(),
      }
    }

    fs.writeFileSync(blogMetaPath, JSON.stringify(meta, undefined, 2))

    console.log(`[INFO]\tUpdate blog meta: ${blogMetaPath}`)
  }
}
