import type { ArchiveFailureKind } from '@shared/types'

/** 書庫を開けなかったことを、UI が分岐できる種類つきで伝える */
export class ArchiveFailure extends Error {
  constructor(readonly kind: ArchiveFailureKind) {
    super(kind)
    this.name = 'ArchiveFailure'
  }
}
