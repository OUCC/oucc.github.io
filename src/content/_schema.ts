// JSON Schema 用定義
// こちらを更新した際は npm run json-schema も動かす

import type { TagCategory } from './config'

export interface AuthorSchema {
  name: string
  description?: string
  github?: string
  image?: string
}

export interface TagSchema {
  name: string
  description?: string
  category: TagCategory
  image?: string
  fullSizeImage?: boolean
  links?: {
    url: string
    text: string
  }[]
}
