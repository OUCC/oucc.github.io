/**
 * 指定されたファクトリ関数を遅延評価するラッパー関数を生成する。
 *
 * ラッパー関数はファクトリ関数を実行しその結果を返す。ただし、実際にファクトリ関数を実行するのは最初の呼び出し時のみ。
 * 2回目以降の呼び出しでは、最初の呼び出し時に生成された結果を返す。
 *
 * 2回目以降の呼び出し時点で最初の呼び出しが完了していない場合は、完了するまで待機する。
 *
 * @param factory 遅延評価するファクトリ関数
 * @returns ラッパー関数
 */
export function lazy<T>(factory: () => Promise<T>): () => Promise<T> {
  let promise: Promise<T> | undefined

  return () => {
    if (promise === undefined) {
      promise = factory()
    }

    return promise
  }
}
