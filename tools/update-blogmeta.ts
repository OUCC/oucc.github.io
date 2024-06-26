import * as fs from 'fs'
import * as path from 'path'

type FileStatus =
  | [status: 'A' | 'C' | 'D' | 'M' | 'T', path: string]
  | [status: `R${number}`, fromPath: string, toPath: string]

type BlogMeta = {
  postDate: string
  updateDate?: string
}
const gitDiffs = validateArgs(chunkArray(process.argv.slice(2)))
if (gitDiffs === null) process.exit(1)
updateBlogMeta(gitDiffs)

function validateArgs(gitDiffs: string[][]): FileStatus[] | null {
  let ok = true
  function validateFile(path: string) {
    if (!fs.existsSync(path) || !fs.statSync(path).isFile()) {
      console.log(`\u001b[31m[ERROR]\tThe file was not found: ${path}\u001b[m`)
      ok = false
      return false
    }
    return true
  }

  const result: FileStatus[] = []

  for (const status of gitDiffs) {
    if (status.length != 2 && status.length != 3) {
      console.log(
        `\u001b[31m[ERROR]\tArgument is invalid format.\n Please set results of \`git diff --name-status\`. \u001b[m`,
      )
      ok = false
      continue
    }

    if (status.length === 2) {
      if (!['A', 'C', 'D', 'M', 'T'].includes(status[0]!)) {
        console.log(
          `\u001b[33m[WARNING]\tThe status does not supported: ${status[0]}\t${status[1]}\u001b[m`,
        )
        continue
      }

      if (status[0] === 'D' || validateFile(status[1]!)) {
        result.push(status as ['A' | 'C' | 'D' | 'M' | 'T', string])
      }
    } else if (status.length === 3) {
      if (
        status[0]!.startsWith('R') &&
        Number.isInteger(Number(status[0]!.slice(1)))
      ) {
        if (validateFile(status[2]!)) {
          result.push(status as [`R${number}`, string, string])
        }
      } else
        console.log(
          `\u001b[33m[WARNING]\tThe status does not supported: ${status[0]}\t${status[1]}\u001b[m`,
        )
    }
  }
  return ok ? result : null
}

/**
 * blog meta のファイルの日付を更新します
 */
function updateBlogMeta(gitDiffs: readonly FileStatus[]) {
  // 重複削除
  const updatedNames = Array.from(
    new Set(
      gitDiffs
        .map(([status, filePath, toPath]) =>
          toPath === undefined
            ? ([status, path.parse(filePath)] as const)
            : ([status, path.parse(toPath)] as const),
        )
        .filter(predicateTargetFiles)
        .map(
          ([_, { dir, name, ext }]) =>
            ext === '.md' || ext === '.mdx'
              ? name.toLowerCase()
              : dir
                  .slice('src/content/blogs/'.length)
                  .split('/')[0]!
                  .toLowerCase(), // 画像ファイルのとき
        ),
    ),
  )

  const updatedMetas = gitDiffs
    .map(([status, filePath, toPath]) => [status, toPath ?? filePath] as const)
    .filter(([status, filePath]) => {
      const { dir, ext } = path.parse(filePath)
      return (
        status !== 'D' && dir === 'src/content/blog-metas' && ext === '.json'
      )
    })

  for (const updatedName of updatedNames) {
    const blogMetaPath = `src/content/blog-metas/${updatedName}.json`

    let meta: BlogMeta | null = null
    if (fs.existsSync(blogMetaPath)) {
      meta = JSON.parse(
        fs.readFileSync(blogMetaPath, { encoding: 'utf-8' }),
      ) as BlogMeta

      if (updatedMetas.every(([_, filePath]) => filePath !== blogMetaPath))
        meta.updateDate = new Date().toISOString()
      else {
        // 今回のPRで既に更新済み

        if (meta.updateDate) meta.updateDate = new Date().toISOString()
        else meta.postDate = new Date().toISOString()
      }
    } else {
      meta = {
        postDate: new Date().toISOString(),
      }
    }

    fs.writeFileSync(blogMetaPath, JSON.stringify(meta, undefined, 2) + '\n')

    console.log(`[INFO]\tUpdate blog meta: ${blogMetaPath}`)
  }
}

function predicateTargetFiles([status, file]: readonly [
  'A' | 'C' | 'D' | 'M' | 'T' | `R${number}`,
  path.ParsedPath,
]): boolean {
  // markdown
  if (
    (['A', 'C', 'M', 'T'].includes(status) || status.startsWith('R')) &&
    file.dir === 'src/content/blogs' &&
    (file.ext === '.md' || file.ext === '.mdx')
  )
    return true

  // 画像
  if (
    (['A', 'C', 'D', 'M', 'T'].includes(status) || status.startsWith('R')) &&
    file.dir.startsWith('src/content/blogs/') &&
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
    ].includes(file.ext)
  )
    return true

  return false
}

function chunkArray(array: string[]) {
  const result: string[][] = []
  let tempArray: string[] = []

  for (const val of array) {
    if (val.startsWith('src/content')) {
      // ファイルの変更は src/content しか許可されていない
      tempArray.push(val)
    } else {
      if (tempArray.length > 0) result.push(tempArray)
      tempArray = [val]
    }
  }
  if (tempArray.length > 0) result.push(tempArray)

  return result
}
