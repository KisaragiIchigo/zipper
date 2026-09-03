/**
 * 7-Zip のバナー行からバージョンを取り出す。
 * 例: "7-Zip 24.09 (x64) : Copyright (c) 1999-2024 Igor Pavlov : 2024-11-29"
 * 例: "7-Zip (a) 23.01 (x64) : Copyright (c) 1999-2023 Igor Pavlov"
 */
export function parseSevenZipVersion(banner: string): string | null {
  const match = /^7-Zip(?:\s*\(\w+\))?\s+(\d+\.\d+(?:\.\d+)?)/m.exec(banner)
  return match?.[1] ?? null
}
