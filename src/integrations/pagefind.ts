/**
 * Original Source: https://github.com/shishkin/astro-pagefind/blob/main/packages/astro-pagefind/src/pagefind.ts
 *
 * MIT License
 *
 * Copyright 2022 Sergey Shishkin <sergey@shishkin.org>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import type { AstroIntegration } from 'astro'
import { fileURLToPath } from 'node:url'
import { execSync } from 'child_process'
import sirv from 'sirv'

export default function pagefind(): AstroIntegration {
  let outDir: string
  return {
    name: 'pagefind',
    hooks: {
      'astro:config:setup': ({ config, logger }) => {
        if (config.output === 'server') {
          logger.warn(
            'Output type `server` does not produce static *.html pages in its output and thus will not work with astro-pagefind integration.',
          )
          return
        }

        if (config.adapter?.name.startsWith('@astrojs/vercel')) {
          outDir = fileURLToPath(new URL('.vercel/output/static/', config.root))
        } else if (config.adapter?.name === '@astrojs/cloudflare') {
          outDir = fileURLToPath(
            new URL(config.base?.replace(/^\//, ''), config.outDir),
          )
        } else {
          outDir = fileURLToPath(config.outDir)
        }
      },
      'astro:server:setup': ({ server, logger }) => {
        if (!outDir) {
          logger.warn(
            "astro-pagefind couldn't reliably determine the output directory. Search assets will not be served.",
          )
          return
        }

        const serve = sirv(outDir, {
          dev: true,
          etag: true,
        })
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/blog/articles/pagefind/')) {
            serve(req, res, next)
          } else {
            next()
          }
        })
      },
      'astro:build:done': ({ logger }) => {
        if (!outDir) {
          logger.warn(
            "astro-pagefind couldn't reliably determine the output directory. Search index will not be built.",
          )
          return
        }

        const cmd = `npx pagefind --site "${outDir}/blog/articles"`
        execSync(cmd, {
          stdio: [process.stdin, process.stdout, process.stderr],
        })
      },
    },
  }
}
