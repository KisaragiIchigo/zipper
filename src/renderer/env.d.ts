import type { ZipperApi } from '@shared/types'

declare global {
  interface Window {
    zipper: ZipperApi
  }
}
