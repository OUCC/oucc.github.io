// https://qiita.com/kgtkr/items/b9820df6bcab72aea8b6
export const unreachable = (value?: never): never => {
  throw new Error(`Reached unreachable code: ${value}`)
}
