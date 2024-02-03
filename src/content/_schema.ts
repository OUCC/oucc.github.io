// JSON Schema 用定義
// こちらを更新した際は npm run json-schema も動かす

export interface AuthorSchema {
  name: string
  description?: string
  github?: string
  image?: string
}

export interface TagSchema {
  name: string
  description?: string
  category: 'tech' | 'club' | 'other'
  image?: string
  fullSizeImage?: boolean
  links?: {
    url: string
    text: string
  }[]
}
