import * as fs from 'fs'
import * as path from 'path'

type BlogMeta = {
  postDate: string
  updateDate?: string
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

updateBlogMeta()
