/**
 * 展開を続けるかの問いに、利用者が「やめる」と答えたことを表す。
 *
 * 書庫が壊れているといった失敗とは区別する。まとめて取り出している途中なら、
 * 残りの書庫も処理しない。
 */
export class ExtractCancelled extends Error {
  constructor() {
    super('展開は取り消されました')
    this.name = 'ExtractCancelled'
  }
}
