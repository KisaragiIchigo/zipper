import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { createInterface } from 'node:readline'
import { buildInstaller, hasInstaller } from './release/buildInstaller.mjs'
import { chooseAccount } from './release/chooseAccount.mjs'
import { formatSize, resolveConfig } from './release/config.mjs'
import { isRepository } from './release/git.mjs'
import { createRelease, deleteAsset, findRelease, uploadAsset } from './release/github.mjs'
import { pushSources } from './release/pushSources.mjs'
import { isValidVersion, readVersion, writeVersion } from './release/version.mjs'

const rl = createInterface({ input: process.stdin, output: process.stdout })

// 画面を閉じられたときや、入力が尽きたときは空の答えとして扱う。
// 閉じたあとに question を呼ぶと例外になるため、状態を覚えておく
let closed = false
rl.on('close', () => {
  closed = true
})

const ask = (question) =>
  new Promise((resolve) => {
    if (closed) {
      resolve('')
      return
    }
    rl.question(question, resolve)
    rl.once('close', () => resolve(''))
  })

function line(text = '') {
  console.log(text)
}

/** 公開するバージョンを決める。変えるとインストーラの名前も変わる */
async function decideVersion() {
  const current = readVersion()
  line('いまのバージョン: ' + current)

  const typed = (await ask('新しいバージョン（未入力なら据え置き）: ')).trim().replace(/^v/i, '')
  if (typed === '' || typed === current) return { version: current, changed: false }

  if (!isValidVersion(typed)) {
    line('「' + typed + '」は形式が違います。0.1.1 のように入力してください。')
    return null
  }

  writeVersion(typed)
  line('バージョンを ' + current + ' から ' + typed + ' に変えました。')
  return { version: typed, changed: true }
}

/** 区切り文字。ソース上のエスケープを読み違えないよう、正規表現には書かない */
const BACKSLASH = String.fromCharCode(92)

/**
 * 以前の版が付けていた名前。
 *
 * パスの区切りを落とし損ねたまま上げていたため、GitHub 側では release.latest.yml の形で残っている。
 * この名前のままだと更新側が latest.yml を見つけられないので、見かけたら外す。
 */
function legacyName(path) {
  return path.split(BACKSLASH).join('.').split('/').join('.')
}

/** すでに同じものが上がっていれば外してから添える */
async function putAsset(account, config, release, file) {
  // 区切りは basename に任せる。自前で分けると Windows のバックスラッシュを取りこぼす
  const name = basename(file.path)
  const obsolete = [name, legacyName(file.path)]

  for (const asset of release.assets ?? []) {
    if (!obsolete.includes(asset.name)) continue
    line('  外します: ' + asset.name)
    await deleteAsset(account.token, config.owner, config.repo, asset.id)
  }

  line('  送っています: ' + name + '（' + formatSize(file.size) + '）')
  await uploadAsset(account.token, config.owner, config.repo, release.id, name, readFileSync(file.path))
}

/** できあがっているインストーラを Releases へ添える */
async function publishRelease(config, account) {
  const missing = config.files.filter((file) => !file.exists)
  if (missing.length > 0) {
    line('[エラー] 次のものが見つからないため、公開できません:')
    for (const file of missing) line('  ' + file.label + ': ' + file.path)
    return false
  }

  for (const file of config.files) {
    line('  ' + file.label + ': ' + file.path + '（' + formatSize(file.size) + '）')
  }
  line()

  let release = await findRelease(account.token, config.owner, config.repo, config.tag)
  if (release === null) {
    line('リリース ' + config.tag + ' を作成しています...')
    release = await createRelease(
      account.token,
      config.owner,
      config.repo,
      config.tag,
      'Zipper ' + config.tag,
      'Zipper ' + config.tag + ' のインストーラです。アプリ内の更新でも取得できます。'
    )
  } else {
    line('同じタグのリリースが既にあります。ファイルを差し替えます。')
  }

  for (const file of config.files) await putAsset(account, config, release, file)

  line()
  line('公開しました: ' + release.html_url)
  return true
}

async function main() {
  line('==========================================')
  line('  Zipper | GitHub へ反映します')
  line('==========================================')
  line()

  if (!isRepository()) {
    line('[エラー] ここは git の管理下にありません。')
    return 1
  }

  const decided = await decideVersion()
  if (decided === null) return 1
  line()

  const first = resolveConfig()
  const account = await chooseAccount(first.owner, first.repo, ask, line)
  if (account === null) {
    line('やめておきます。')
    return 1
  }
  if (!account.writable) {
    line()
    line('[エラー] ' + account.login + ' では ' + first.owner + '/' + first.repo + ' へ書き込めません。')
    line('        リポジトリの持ち主のアカウントを選ぶか、共同作業者として追加してください。')
    return 1
  }
  line()
  line(account.login + ' として進めます。')
  line()

  // ここから先は尋ねない。作って、送って、公開するまで通す
  line('--- インストーラ ---')
  if (hasInstaller(first)) {
    line('できあがっているものを使います。')
  } else {
    buildInstaller(line)
  }
  line()

  line('--- ソース ---')
  pushSources(first, account, line, decided.version)

  line('--- Releases ---')
  // インストーラを作った直後は、ファイルの有無と大きさを取り直す必要がある
  const done = await publishRelease(resolveConfig(), account)
  return done ? 0 : 1
}

main()
  .then((code) => {
    rl.close()
    process.exitCode = code
  })
  .catch((error) => {
    console.error()
    console.error('[エラー] ' + error.message)
    rl.close()
    process.exitCode = 1
  })
