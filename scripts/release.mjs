import { readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { resolveConfig, formatSize } from './release/config.mjs'
import { chooseAccount } from './release/chooseAccount.mjs'
import { createRelease, deleteAsset, findRelease, uploadAsset } from './release/github.mjs'

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

/** すでに同じ名前で上がっているものを外してから添える */
async function putAsset(account, config, release, file) {
  const name = file.path.split(/[\/]/).pop()
  const existing = (release.assets ?? []).find((asset) => asset.name === name)
  if (existing !== undefined) {
    line('  差し替えます: ' + name)
    await deleteAsset(account.token, config.owner, config.repo, existing.id)
  }

  line('  送っています: ' + name + '（' + formatSize(file.size) + '）')
  await uploadAsset(
    account.token,
    config.owner,
    config.repo,
    release.id,
    name,
    readFileSync(file.path)
  )
}

async function main() {
  line('==========================================')
  line('  Zipper | Releases へ公開します')
  line('==========================================')
  line()
  line('このファイルはソースコードを push しません。')
  line('ビルド済みのインストーラを Releases へ置くだけです。')
  line()

  const config = resolveConfig()
  line('配信先: ' + config.owner + '/' + config.repo)
  line('バージョン: ' + config.tag)
  line()

  const missing = config.files.filter((file) => !file.exists)
  if (missing.length > 0) {
    for (const file of missing) line('[エラー] ' + file.label + 'がありません: ' + file.path)
    line()
    line('先に InstallerMake.bat を実行して、配布物を作ってください。')
    return 1
  }

  for (const file of config.files) {
    line('  ' + file.label + ': ' + file.path + '（' + formatSize(file.size) + '）')
  }
  line()

  const account = await chooseAccount(config.owner, config.repo, ask, line)
  if (account === null) {
    line('公開せずに終わります。')
    return 1
  }

  if (!account.writable) {
    line()
    line('[エラー] ' + account.login + ' では ' + config.owner + '/' + config.repo + ' へ書き込めません。')
    line('        リポジトリの持ち主のトークンを使うか、このアカウントを共同作業者に追加してください。')
    return 1
  }

  line()
  line(account.login + ' として ' + config.tag + ' を公開します。')
  const go = (await ask('進めますか? y を入力: ')).trim().toLowerCase()
  if (go !== 'y' && go !== 'yes') {
    line('公開せずに終わります。')
    return 1
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
  line('==========================================')
  line('  完了しました')
  line('==========================================')
  line(release.html_url)
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
