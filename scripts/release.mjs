import { readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
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

/** 公開するバージョンを決める。変えた場合はインストーラを作り直す必要がある */
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

/** すでに同じ名前で上がっているものを外してから添える */
async function putAsset(account, config, release, file) {
  const name = file.path.split(/[\/]/).pop()
  const existing = (release.assets ?? []).find((asset) => asset.name === name)
  if (existing !== undefined) {
    line('  差し替えます: ' + name)
    await deleteAsset(account.token, config.owner, config.repo, existing.id)
  }

  line('  送っています: ' + name + '（' + formatSize(file.size) + '）')
  await uploadAsset(account.token, config.owner, config.repo, release.id, name, readFileSync(file.path))
}

/** できあがっているインストーラを Releases へ添える */
async function publishRelease(config, account) {
  const missing = config.files.filter((file) => !file.exists)
  if (missing.length > 0) {
    line('Releases への公開は行いません。次のものがありません:')
    for (const file of missing) line('  ' + file.label + ': ' + file.path)
    line('InstallerMake.bat で作ってから、もう一度実行してください。')
    return
  }

  for (const file of config.files) {
    line('  ' + file.label + ': ' + file.path + '（' + formatSize(file.size) + '）')
  }
  const go = (await ask(config.tag + ' として公開しますか? y を入力: ')).trim().toLowerCase()
  if (go !== 'y' && go !== 'yes') {
    line('公開せずに終わります。')
    return
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

  line('--- ソース ---')
  await pushSources(first, account, ask, line)

  line('--- Releases ---')
  // バージョンを変えた場合、参照するインストーラの名前も変わる
  await publishRelease(resolveConfig(), account)

  if (decided.changed) {
    line()
    line('バージョンを変えたので、配布物はまだ古いままかもしれません。')
    line('InstallerMake.bat で作り直してから、もう一度この画面を開いてください。')
  }
  return 0
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
