# Zipper

Windows 11 の佇まいに馴染む多形式アーカイバです。Electron + React + TypeScript で構築し、解凍エンジンには同梱した 7-Zip を使用します。

## 機能ハイライト

- 📦 **多形式の解凍**: 同梱 7-Zip により ZIP / 7Z / RAR / TAR / GZ / BZ2 / XZ / ZST / LZH / CAB / ARJ / ISO / DMG / VHD / VMDK / WIM / DEB / RPM / CHM / MSI など、7-Zip が読める形式の一覧と展開に対応します
- 🈶 **ファイル名の文字化け対策**: 7-Zip 自身の判定を第一としつつ、それが読み違えた場合のみ ZIP の生バイト列から cp932 / cp949 / cp936 / cp950 を推定して補正します。macOS で作られた書庫の分解された濁点（NFD）も合成形へ揃えるため、「か゛」のように離れて表示されることがありません。展開後のファイル名も一覧の表示に揃えます
- 👁 **その場で中身を確認**: ダブルクリックで関連付けたアプリへ渡し、Space キーではアプリ内で画像とテキストを表示します。書庫を丸ごと展開する必要はありません
- 🗂 **フォルダ階層**: 書庫の中のフォルダをたどれます
- 🪟 **1 書庫 1 ウィンドウ**: 書庫を開くたびに新しいウィンドウが開きます。2 つ目以降は少しずつずらして開くため、下のウィンドウが隠れません
- 🔁 **多重起動**: アプリを何度でも立ち上げられます。2 つ目以降は既存のプロセスがウィンドウを増やすため、常駐が二重になりません
- 🔎 **絞り込み**: 数万件の書庫でも、名前の一部で目的のファイルへたどり着けます
- 🗜️ **書庫の作成**: ZIP / 7Z / TAR / GZIP / BZIP2 / XZ を作成できます。圧縮レベル、パスワード、分割サイズを指定でき、ZIP の暗号化は既定で AES-256 を使います。7Z は自己解凍形式（.exe）にもできます
- 🧺 **対象ごとに分けて圧縮**: 複数を選んだときに、1 つの書庫へ束ねるか、対象ごとに別々の書庫を作るかを選べます。フォルダをまとめて選べば、フォルダの数だけ書庫が並びます。右クリックの「1 つずつ ZIP に圧縮する」からも同じことができます。名前が重なる対象には連番を付けるため、既にある書庫へ中身が紛れ込むことはありません
- 🧵 **TAR の自動中継**: GZIP / BZIP2 / XZ は 1 つのファイルしか包めないため、複数を選んだ場合はいったん TAR にまとめてから詰めます。取り出すときも中の TAR を続けて開くため、二重になっていることを意識せずに扱えます
- 🚫 **除外フィルタ**: `.DS_Store` や `Thumbs.db`、`__MACOSX` のように環境の都合で紛れ込むファイルを、圧縮と解凍の両方で自動的に外します。対象は設定画面から編集できます
- ✏️ **書庫の書き換え**: ZIP と 7Z に対して、ファイルの追加と取り除きができます
- 🛡 **整合性の確認**: 中身を読み直して、壊れているファイルを特定します
- 📊 **進み具合の表示**: 展開や圧縮の間は、全体の進み具合、いま処理しているファイル、経過時間と残りの見込みを示します
- 📋 **解凍の記録**: 右クリックから解凍したときは専用の窓に記録が残ります。記録は書庫ごとにまとまっており、書庫名の行を押すと中のファイル一覧が開きます。失敗した書庫は理由とともに残り、終わっても自動では閉じません
- ♻️ **上書きの確認**: 展開先に同名のファイルがある場合、上書き・既存を残す・両方残すから選べます。右クリックからまとめて解凍したときも、最初にぶつかった時点で一度だけ確認し、選んだ扱いを残りの書庫にも使います
- 🔤 **コードページの手動切り替え**: 自動判定が外れた場合、ステータスバーから文字コードを選び直せます
- 🔑 **暗号化書庫への対応**: パスワードが必要な書庫を検出して入力を促し、ヘッダ暗号化された書庫も開けます。右クリックからまとめて解凍した場合も、鍵の掛かっていた書庫について後からパスワードを尋ね直します
- 🧯 **鍵違いで書きかけを残さない**: 中身だけを暗号化した書庫は一覧が鍵なしで読めるため、取り出す段になって初めて鍵が要ると分かります。そこで展開を始める前に鍵を確かめ、違っていれば展開先へ何も書きません。0 バイトのファイルが散らかることがなく、その場でパスワードを入力し直してそのまま続けられます
- 🧩 **エクスプローラー連携**: 右クリックに「Zipper」を追加します。書庫では「ここに解凍する」「フォルダに分けて解凍する」など、ファイルやフォルダでは「ZIP に圧縮する」「1 つずつ ZIP に圧縮する」「7Z に圧縮する」などをサブメニューにまとめます。Windows 11 の新しい右クリックメニューには COM シェル拡張（`IExplorerCommand`）で直接載り、押してすぐ見える位置に現れます。Windows 10 向けのレジストリ方式は設定画面から登録と解除ができ、管理者権限は不要です
- 🖱️ **アプリ内の右クリック**: 一覧の行から、開く・中身を見る・展開・取り除き・パスのコピーができます
- 🖱️ **ドラッグ＆ドロップと関連付け**: ウィンドウへ書庫を落とすか、起動時の引数として渡すとそのまま開きます。複数まとめて落とすと、それぞれ別のウィンドウで開きます
- 📤 **エクスプローラーへの引き出し**: 一覧の行をエクスプローラーやデスクトップへ引きずると、そのままそこへ取り出せます。展開先を選ぶ手順はいりません
- ⌨️ **キーボード操作**: 矢印で行を移り、Enter で開き、Space で中身を見て、Backspace で上のフォルダへ戻ります
- 🪟 **Windows 11 ネイティブの操作感**: キャプションボタンは OS 純正（Window Controls Overlay）を使うため、最大化ボタンのスナップレイアウトがそのまま機能します
- 🎨 **ライト / ダークの自動追従**: OS のテーマ設定に追従し、タイトルバーの配色も同時に切り替わります。ウィンドウの位置と大きさ、外観の選択は次回の起動時に復元されます
- ⚡ **大量エントリへの耐性**: 一覧は見えている範囲だけを描くため、2 万件を超える書庫でも操作が重くなりません
- 🔄 **自動更新**: GitHub の Releases を見て新しい版を知らせます。取得と再起動は確認のうえで行い、勝手に入れ替わることはありません。起動時に確認するかどうかは設定画面から変更できます
- 📁 **作業フォルダー**: 解凍先や保存先を選ぶダイアログが最初に開く場所を決めておけます。決めていない場合は、解こうとしている書庫や、圧縮しようとしている対象と同じ場所から開きます。別の場所へ出したいときだけ、そのつど選び直してください
- 🔒 **厳格なセキュリティ既定**: contextIsolation と sandbox を有効化し、Renderer からの要求はすべて Zod で検証します。外部 CDN は CSP で遮断しています

## アーキテクチャ概要

```text
zipper/
├─ electron.vite.config.ts     … Main / Preload / Renderer の3ビルド定義
├─ electron-builder.yml        … 配布パッケージ定義。7-Zip を asar 外へ配置
├─ tailwind.config.ts          … CSS 変数を参照する形でデザイントークンを定義
├─ postcss.config.js           … Tailwind と Autoprefixer の適用
├─ project_style.json          … 色・フォント・質感の単一情報源
├─ changelogs.json             … 変更履歴
├─ build/
│  ├─ icon.ico / icon.png      … 生成されたアプリアイコン
│  └─ installer.nsh            … インストール時のシェル統合と MSIX 登録
├─ native/
│  └─ shellext/                … Windows 11 の右クリック一段目に載せる COM シェル拡張
│     ├─ ExplorerCommand.h/.cpp … IExplorerCommand の実装。書庫かどうかで項目を出し分け
│     ├─ dllmain.cpp           … クラスファクトリと DLL の入口
│     ├─ ZipperShell.def       … 公開するエクスポートの定義
│     └─ build.bat             … MSVC でのビルド
├─ packaging/
│  ├─ AppxManifest.xml         … COM 登録のためのスパースパッケージ定義
│  ├─ make-package.ps1         … MSIX の作成と署名
│  ├─ install-package.ps1      … 証明書の登録とパッケージの導入
│  └─ uninstall-package.ps1    … パッケージの取り外し
├─ scripts/
│  ├─ fetch-7zip.mjs           … 公式 MSI から 7z.exe / 7z.dll / 7z.sfx を取得
│  ├─ make-icon.mjs            … アクセント色からアイコンを描き起こす
│  ├─ release.mjs              … 公開のオーケストレータ。版の決定から Releases まで
│  └─ release/
│     ├─ version.mjs           … package.json のバージョンの読み書き
│     ├─ config.mjs            … 配信先と、上げるファイルの決定
│     ├─ gitCredential.mjs     … Windows の資格情報の読み出しと解除
│     ├─ tokens.mjs            … 環境変数に置かれたトークンの洗い出し
│     ├─ chooseAccount.mjs     … 公開に使うアカウントの選択
│     ├─ buildInstaller.mjs    … 配布物が揃っていなければ作る
│     ├─ git.mjs               … コミットと push
│     ├─ pushSources.mjs       … ソースの送信
│     └─ github.mjs            … Releases の作成とアセットの添付
├─ resources/
│  └─ 7zip/                    … 同梱する 7-Zip の実体（取得後に配置）
└─ src/
   ├─ main/                    … Electron Main プロセス。OS 操作と重い処理を担当
   │  ├─ index.ts              … 起動オーケストレータ。多重起動の集約と終了時の後始末
   │  ├─ settings/
   │  │  ├─ schema.ts          … 設定の形と既定値（Zod で検証）
   │  │  └─ store.ts           … 設定の読み書き。書き出しはまとめて後追い
   │  ├─ window/
   │  │  ├─ windowManager.ts       … 窓の生成と、起動要求の窓への割り当て
   │  │  ├─ createMainWindow.ts    … BrowserWindow 生成とセキュリティ設定
   │  │  ├─ windowState.ts         … 位置と大きさの保存・復元。画面外への配置を防ぐ
   │  │  ├─ titleBarOverlay.ts     … OS 純正キャプションボタンの配色
   │  │  └─ launchIntent.ts        … 起動引数の解釈と、複数起動の集約
   │  ├─ ipc/
   │  │  ├─ registerIpcHandlers.ts … ハンドラ登録のオーケストレータ
   │  │  ├─ schemas.ts             … Zod による IPC 境界の検証
   │  │  ├─ themeIpc.ts            … テーマ状態の取得・変更・通知
   │  │  ├─ sevenZipIpc.ts         … 解凍エンジンの可用性確認
   │  │  ├─ shellIpc.ts            … シェル統合の登録・解除、場所を開く操作
   │  │  ├─ updateIpc.ts           … 更新の確認・取得・適用の受け口
   │  │  ├─ preferencesIpc.ts      … 除外・作業フォルダ・更新確認などの読み書き
   │  │  ├─ windowIpc.ts           … 書庫を新しい窓で開く要求の受け口
   │  │  └─ archive/               … 書庫まわりの IPC
   │  │     ├─ index.ts            … 登録のオーケストレータ
   │  │     ├─ listIpc.ts          … 一覧・起動要求の引き取り・衝突確認
   │  │     ├─ dialogIpc.ts        … ファイルとフォルダの選択ダイアログ
   │  │     ├─ taskIpc.ts          … 時間のかかる作業の登録をまとめる
   │  │     └─ task/
   │  │        ├─ runner.ts        … 中断と進捗の一元管理
   │  │        ├─ extractIpc.ts    … 展開
   │  │        ├─ createIpc.ts     … 圧縮と自己解凍
   │  │        ├─ testIpc.ts       … 整合性の確認
   │  │        ├─ modifyIpc.ts     … 追加と取り除き
   │  │        └─ viewIpc.ts       … 1 件を開く・その場で読む・引きずり出す
   │  ├─ sevenzip/             … 解凍エンジン層
   │  │  ├─ resolveBinary.ts   … 7z.exe と 7z.sfx のパス解決
   │  │  ├─ runSevenZip.ts     … 7z.exe 起動ラッパー。UTF-8 出力・進捗・中断
   │  │  ├─ parseVersion.ts    … バナー行からのバージョン抽出（純粋関数）
   │  │  ├─ parseListing.ts    … l -slt 出力の構造化（純粋関数）
   │  │  ├─ parseTaskOutput.ts … 進み具合・件数・ファイル名の抽出（純粋関数）
   │  │  ├─ progressReporter.ts … 断片的な出力から状態を組み立てる
   │  │  ├─ parseTestOutput.ts … 壊れている項目の抽出（純粋関数）
   │  │  ├─ classifyFailure.ts … 失敗理由の判別（純粋関数）
   │  │  ├─ ArchiveFailure.ts  … 種類つきの失敗を表す例外
   │  │  ├─ applyRenames.ts    … 展開後のファイル名を一覧の表示に揃える
   │  │  ├─ listArchive.ts     … 一覧取得のオーケストレータ
   │  │  ├─ listing/
   │  │  │  ├─ toEntry.ts      … 出力 1 件分を表示用の形へ（純粋関数）
   │  │  │  └─ resolveNames.ts … ファイル名の読み方の決定
   │  │  ├─ scaleProgress.ts   … 進み具合を全体の一部分へ押し込める（純粋関数）
   │  │  ├─ extractArchive.ts  … 展開のオーケストレータ
   │  │  ├─ extractBatch.ts    … 複数の書庫を順に取り出す。1 つ失敗しても続行
   │  │  ├─ extract/
   │  │  │  ├─ extractOne.ts   … 書庫 1 つ分。中が TAR だけなら続けて開く
   │  │  │  └─ unwrapTar.ts    … 中の TAR を開き直して片付ける
   │  │  ├─ verifyPassword.ts  … 展開前の鍵の確認。書き出さずに 1 件だけ読む
   │  │  ├─ volumeSets.ts      … 分割書庫の巻を先頭へ読み替え、重複を除く
   │  │  ├─ createArchive.ts   … 圧縮のオーケストレータ
   │  │  ├─ createBatch.ts     … 対象ごとに別々の書庫を作る。1 つ失敗しても続行
   │  │  ├─ create/
   │  │  │  ├─ buildCreateArgs.ts … 形式ごとの 7-Zip 引数の組み立て（純粋関数）
   │  │  │  ├─ archiveNameFor.ts … 対象 1 つ分の書庫名の決定
   │  │  │  ├─ runCreate.ts    … 7-Zip を 1 回走らせる
   │  │  │  └─ createViaTar.ts … 単一ファイル形式のための TAR 中継
   │  │  ├─ createSelfExtracting.ts … 実行部と書庫を結合して exe を作る
   │  │  ├─ modifyArchive.ts   … 既存の書庫への追加と取り除き
   │  │  ├─ testArchive.ts     … 中身を読み直して壊れを調べる
   │  │  ├─ tempWorkspace.ts   … 一時的に取り出したファイルの置き場と後片付け
   │  │  ├─ dragOut.ts         … 引きずり出すために選択を一時領域へ書き出す
   │  │  ├─ openEntry.ts       … 1 件を取り出して関連付けアプリへ渡す
   │  │  ├─ previewEntry.ts    … 1 件をその場で読む
   │  │  └─ probe.ts           … 実行可能性の確認
   │  ├─ encoding/             … 文字コードの推定
   │  │  ├─ scoreDecoded.ts    … デコード結果の自然さの採点（純粋関数）
   │  │  ├─ detectFilenameEncoding.ts … ファイル名のコードページ推定
   │  │  └─ decodeText.ts      … テキストの中身を読む
   │  ├─ updater/
   │  │  └─ updateService.ts   … 最新版の確認・取得・適用
   │  ├─ shell/                … エクスプローラー連携
   │  │  ├─ applyIntegration.ts … 登録と解除。設定画面とインストーラの共通の入口
   │  │  ├─ registry.ts        … .reg の取り込みとキーの存在確認
   │  │  ├─ notifyShell.ts     … 関連付けの変更をエクスプローラーへ知らせる
   │  │  └─ buildRegistryScript.ts … 登録・解除する .reg の組み立て（純粋関数）
   │  └─ zip/
   │     └─ readZipFilenames.ts … セントラルディレクトリから生バイト列を取得
   ├─ preload/
   │  └─ index.ts              … contextBridge による型安全な API 公開
   ├─ renderer/                … Electron Renderer プロセス。描画と操作に専念
   │  ├─ index.html            … Content-Security-Policy の定義
   │  ├─ main.tsx              … React ルートの生成
   │  ├─ App.tsx               … 起動モードによる画面の振り分け
   │  ├─ env.d.ts              … window.zipper の型宣言
   │  ├─ app/                  … App が呼ぶ各段
   │  │  ├─ MainApp.tsx        … 一覧を持つ通常の画面のオーケストレータ
   │  │  ├─ ProgressApp.tsx    … 解凍だけで起こされたときの画面
   │  │  ├─ progress/
   │  │  │  ├─ ProgressSummary.tsx … 終わったあとの結果の見出し
   │  │  │  ├─ ProgressActions.tsx … 中止・場所を開く・閉じる
   │  │  │  └─ useLockedArchives.ts … 鍵の掛かっていた書庫を拾って聞き直す
   │  │  ├─ useLaunchIntent.ts … 起動要求の受け取りと振り分け
   │  │  ├─ useDirectoryNavigation.ts … 書庫の中のフォルダをたどる
   │  │  ├─ useSelection.ts    … 一覧の選択状態
   │  │  ├─ useEntryOpener.ts  … 1 件を関連付けアプリで開く
   │  │  ├─ useLockedAction.ts … 鍵待ちで止まった操作を預かり、入力後にやり直す
   │  │  ├─ useRowMenu.ts      … 行に対する操作をまとめる
   │  │  ├─ useShellLaunch.ts  … シェルからの要求を操作へ結び付ける
   │  │  ├─ resolvePasswordPrompt.ts … 鍵を尋ねる場面を 1 つに畳む（純粋関数）
   │  │  ├─ buildExtractRequest.ts … 選択から展開要求を組み立てる（純粋関数）
   │  │  ├─ resolveVisibleEntries.ts … 絞り込みと階層から表示行を決める（純粋関数）
   │  │  ├─ buildTaskView.ts   … 進行状況を表示の形へ（純粋関数）
   │  │  ├─ ArchiveContent.tsx … 書庫の状態による本体の出し分け
   │  │  ├─ DialogStack.tsx    … 前面に重なる問いかけの集約
   │  │  └─ DropOverlay.tsx    … ドロップ受け入れの目印
   │  ├─ styles/
   │  │  └─ globals.css        … Fluent カラートークンの CSS 変数とベーススタイル
   │  ├─ hooks/
   │  │  ├─ archive/
   │  │  │  └─ archiveState.ts … 書庫 1 つ分の状態と読み込み
   │  │  ├─ useArchive.ts      … この窓が受け持つ書庫 1 つ分の状態
   │  │  ├─ useDragOut.ts      … 選択をエクスプローラーへ引き渡す
   │  │  ├─ useExtract.ts      … 展開の進行と結果
   │  │  ├─ useCompress.ts     … 圧縮の設定と進行
   │  │  ├─ compress/
   │  │  │  ├─ archiveName.ts  … 保存名の既定値を決める（純粋関数）
   │  │  │  └─ buildCreateRequest.ts … 形式ごとに効く指定だけを残す（純粋関数）
   │  │  ├─ useVerify.ts       … 整合性の確認
   │  │  ├─ useModifyArchive.ts … 書庫への追加と取り除き
   │  │  ├─ usePreview.ts      … その場での中身の表示
   │  │  ├─ useVirtualRows.ts  … 固定行高の一覧を仮想化する
   │  │  ├─ useShellIntegration.ts … シェル統合の状態と登録操作
   │  │  ├─ useUpdater.ts      … 最新版との差の見張り
   │  │  ├─ useSevenZipProbe.ts … 解凍エンジンの可用性取得
   │  │  ├─ usePreferences.ts  … 設定の読み書き
   │  │  ├─ useTheme.ts        … テーマ状態の購読と dark クラスの反映
   │  │  └─ useFileDrop.ts     … ウィンドウへのドロップ受付
   │  ├─ lib/
   │  │  ├─ cn.ts              … クラス名の結合と競合解決
   │  │  ├─ format.ts          … サイズ・日時・圧縮率の整形
   │  │  ├─ pathUtils.ts       … パスの分解と組み立て（純粋関数）
   │  │  ├─ sortEntries.ts     … 一覧の並べ替え（純粋関数）
   │  │  ├─ filterEntries.ts   … 名前による絞り込み（純粋関数）
   │  │  ├─ buildDirectoryView.ts … フォルダ階層の組み立て（純粋関数）
   │  │  └─ taskView.ts        … 進行状況の共通表現と失敗時の文言
   │  └─ components/
   │     ├─ TitleBar/          … アプリ名・テーマ切替・設定への入口
   │     ├─ Toolbar/           … 開く・圧縮・追加・取り除き・確認・絞り込み
   │     ├─ Breadcrumb/        … いま見ているフォルダの位置と戻り道
   │     ├─ SearchBox/         … 名前による絞り込みの入力
   │     ├─ ExtractMenu/       … 展開先の選択（定型と自由指定）
   │     ├─ ArchiveTable/      … ファイル一覧
   │     │  ├─ index.tsx       … 並べ替えと仮想化のオーケストレータ
   │     │  ├─ columns.ts      … 列と行高の定義
   │     │  ├─ TableHeader.tsx … 見出しと並べ替えの操作
   │     │  ├─ TableRow.tsx    … 1 行の描画
   │     │  └─ useRowSelection.ts … クリックとキーによる選択・移動
   │     ├─ CompressDialog/    … 圧縮の指定
   │     │  ├─ index.tsx       … 組み立てのオーケストレータ
   │     │  ├─ fields.ts       … 選択肢と入力欄の見た目
   │     │  ├─ SourceList.tsx  … 対象の一覧と出し入れ
   │     │  ├─ SettingsGrid.tsx … 形式・レベル・パスワード・分割・自己解凍
   │     │  └─ EncryptionPanel.tsx … 暗号化方式の指定
   │     ├─ PreviewDialog/     … 画像とテキストのその場表示
   │     ├─ UpdateBanner/      … 新しい版の知らせと適用の合図
   │     ├─ TaskProgressDialog/ … 進行中の詳細
   │     │  ├─ index.tsx       … 一覧の上に重ねるダイアログ
   │     │  ├─ TaskProgressPanel.tsx … 見出しと記録と中止をまとめた中身
   │     │  ├─ TaskProgressHeader.tsx … 割合・対象・経過時間・処理中のファイル
   │     │  ├─ ArchiveLogView.tsx … 書庫ごとにたたんだ記録
   │     │  ├─ useArchiveLog.ts … 記録を書庫ごとにまとめる
   │     │  └─ useTicker.ts    … 経過時間のための時刻の刻み
   │     ├─ TaskBar/           … 終わった作業の結果の通知
   │     ├─ StatusBar/         … 解凍エンジンと書庫の状態表示
   │     ├─ EncodingMenu/      … 文字コードの手動切り替え
   │     ├─ PasswordDialog/    … 暗号化書庫のパスワード入力
   │     ├─ ConflictDialog/    … 同名ファイルがある場合の扱いの確認
   │     ├─ ConfirmDialog/     … 元に戻せない操作の確認
   │     ├─ SettingsDialog/    … シェル統合・詳細・更新の設定
   │     │  ├─ index.tsx       … 各セクションの組み立て
   │     │  ├─ ShellSection.tsx … 右クリックの 2 つの入口の状態
   │     │  ├─ PreferencesSection.tsx … 除外・作業フォルダ・更新確認・ツールチップ
   │     │  └─ UpdateSection.tsx … 最新版との差と適用
   │     ├─ FailureNotice/     … 書庫を開けなかった理由の表示
   │     ├─ ThemeToggle/       … 外観切替のフライアウトメニュー
   │     ├─ EmptyState/        … 書庫未読込時の待機画面
   │     └─ ui/
   │        └─ IconButton/     … Fluent の Subtle button
   └─ shared/                  … Main / Renderer が共有する定義
      ├─ ipc.ts                … IPC チャンネル名
      ├─ codepages.ts          … コードページの表示名
      ├─ archiveFormats.ts     … 対応拡張子の一覧と、圧縮形式ごとの性質表
      ├─ archiveNames.ts       … 巻と拡張子を落としてフォルダ名の土台を作る
      └─ types.ts              … ドメイン型と公開 API の型
```

## データフロー

```text
[ユーザー操作]
      │
      ▼
Renderer (React)
      │  window.zipper.*  ← contextBridge で公開された型付き API
      ▼
Preload (ipcRenderer.invoke)
      │
      ▼
Main (ipcMain.handle)
      │  Zod でペイロードを検証
      ▼
sevenzip 層 ─── spawn ──▶ 7z.exe（-sccUTF-8 で UTF-8 出力に固定）
      │                        │
      │◀──── stdout / stderr ──┘
      ▼
結果を Renderer へ返却し、React が描画
```

テーマ変更は OS 側の変更もアプリ側の変更も Main の `nativeTheme` に集約し、`theme:changed` として Renderer へ通知します。Renderer は受け取った値を `html` の `dark` クラスへ反映するだけに徹します。

## 主要技術

| カテゴリ | 採用技術 |
| --- | --- |
| デスクトップ基盤 | Electron 44 |
| ビルド | electron-vite 5 / Vite 7 |
| UI | React 19 + TypeScript 5.9 |
| スタイリング | Tailwind CSS v3 |
| UI プリミティブ | Radix UI |
| アニメーション | Framer Motion（LazyMotion + m モジュール） |
| アイコン | lucide-react |
| 入力検証 | Zod 4 |
| 解凍エンジン | 7-Zip（7z.exe / 7z.dll を同梱） |
| 文字コード変換 | iconv-lite |
| 配布 | electron-builder（NSIS） |

## 開発

### セットアップ

```bash
npm install
npm run fetch:7zip
```

`fetch:7zip` は 7-Zip 公式サイトから最新の x64 版 MSI を取得し、`msiexec /a` で展開して `resources/7zip/` に `7z.exe`、`7z.dll`、`7z.sfx` を配置します。管理者権限は不要です。このステップを実行しない場合、アプリは起動しますが解凍機能は利用できません。

### ダブルクリックで実行できるファイル

コマンドを打たずに扱えるよう、用途ごとに 3 つ用意しています。いずれも初回に必要な準備を自動で行います。

| ファイル | 内容 |
| --- | --- |
| `起動.bat` | 開発モードでアプリを起動します。依存パッケージ、7-Zip、アイコンが無ければ先に用意します |
| `InstallerMake.bat` | 型検査からパッケージングまで通して実行し、`release/` にインストーラを出力します |
| `GithubPush.bat` | バージョンを決め、インストーラを作り、ソースを push し、Releases へ公開します |

`GithubPush.bat` は `scripts/release.mjs` を呼び出します（`npm run release` でも同じです）。入力を求めるのは最初の 2 つだけで、あとは公開まで通します。

1. **バージョン** — いまの値を表示します。変えたい場合だけ入力してください。据え置きなら、そのまま Enter を押してください。
2. **アカウント** — 公開に使うアカウントを選びます。git が push のときに使う Windows の資格情報を最初の候補として表示し、環境変数のトークンと並べます。環境変数は `GH_TOKEN` と `GITHUB_TOKEN` のほか、`GH_TOKEN_SUB` のように後ろへ名前を付けたものも拾いますので、複数のアカウントを使い分ける場合も既定の `GH_TOKEN` を変えずに増やせます。候補にはそれぞれの持ち主と、公開先へ書き込めるかどうかを表示します。別のアカウントへ切り替えたい場合は `s` を選ぶと、覚えている資格情報を解除して選択画面を開きます。
3. **インストーラ** — そのバージョンの配布物が `release/` に揃っていればそのまま使い、無ければここで作ります。バージョンを上げた直後は名前が変わるため、必ず作り直しになります。型検査からパッケージングまで通すため、数分かかります。
4. **ソース** — コミットしていない変更があれば一覧で示したうえで、バージョンをメッセージにしてコミットします。そのまま、送っていないコミットを `main` へ送ります。
5. **Releases** — インストーラに加えて `latest.yml` と `.blockmap` も送ります。`latest.yml` はアプリが更新を見つけるための目録で、これが無いと配布済みのアプリが新しい版に気づけません。すでに同じ名前のものが上がっていれば差し替えます。

送るかどうかは尋ねません。この画面は公開するために開くものなので、毎回確かめる意味がないためです。やめたい場合は、アカウントを選ぶところまでで画面を閉じてください。バージョンを書き換えたあとで閉じた場合は、`package.json` が新しい値のまま残ります。

`GithubPush.bat` 自体はリポジトリに含めません（`.gitignore` で除外しています）。公開先は `electron-builder.yml` の `publish` に書かれたリポジトリです。

### コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバーと Electron を起動します |
| `npm run typecheck` | Main 側と Renderer 側の型検査を実行します |
| `npm run build` | 本番用のバンドルを `out/` へ出力します |
| `npm run make:icon` | アプリアイコンを `build/` へ生成します |
| `npm run start` | ビルド済みのアプリを起動します |
| `npm run build:win` | 型検査とビルドを行い、NSIS インストーラを `release/` へ出力します |

### エクスプローラーの右クリックについて

設定画面から登録すると、右クリックに `Zipper` の項目が加わります。中身はサブメニューになっています。

| 対象 | 項目 |
| --- | --- |
| 書庫ファイル | Zipper で開く / ここに解凍する / フォルダに分けて解凍する / 解凍先を選んで解凍する |
| ファイル・フォルダ | ZIP に圧縮する / 1 つずつ ZIP に圧縮する / 7Z に圧縮する / 1 つずつ 7Z に圧縮する / 設定して圧縮する |

複数の書庫をまとめて選んでも、順に取り出します。分割書庫は先頭の巻（.001 や .part1.rar）を選べば全体が読まれます。途中で 1 つが壊れていても、残りは続けて処理します。

「ここに解凍する」と「ZIP に圧縮する」は確認を挟まず、対象と同じ場所へ書き出します。

「ZIP に圧縮する」は選んだものをまとめて 1 つの書庫にします。「1 つずつ ZIP に圧縮する」は対象ごとに別々の書庫を作るため、フォルダをまとめて選べばフォルダの数だけ書庫が並びます。どちらも対象と同じ場所へ書き出します。

Windows 11 では、これらは右クリックの「その他のオプションを表示」の中に入ります。登録した直後に現れない場合がありますが、変更をエクスプローラーへ通知しているため、通常はそのまま反映されます。反映されない場合はエクスプローラーを再起動してください。

インストーラを実行すると、この登録は自動で行われます。アンインストール時には自動で解除されます。設定画面からはいつでも登録し直したり、解除したりできます。

開発モードで登録すると Electron 本体が登録されるため、項目は現れても正しく動きません。インストールした Zipper から登録してください。

### 自動更新のしくみ

アプリは起動から数秒後に、GitHub の Releases を一度だけ確認します。新しい版があれば画面上部で知らせますが、取得も再起動も利用者が選ぶまで行いません。設定画面からはいつでも手動で確認できます。

更新の判定には Releases に置かれた `latest.yml` を使います。`InstallerMake.bat` で作り、`GithubPush.bat` で送るところまでが一続きになっています。開発モードでは配布物としての体裁が無いため、確認は行いません。

### ライセンス上の注意

同梱する 7-Zip は LGPL ですが、RAR の展開部分のみ unRAR ライセンスの制限を受けます。RAR アーカイブの**作成**機能には使用できません（展開は制限の対象外です）。配布物には `resources/7zip/License.txt` を必ず含めてください。

### 対象プラットフォーム

Windows 専用です。解凍エンジンのパス解決とシェル統合が Windows 固有の実装になっています。
