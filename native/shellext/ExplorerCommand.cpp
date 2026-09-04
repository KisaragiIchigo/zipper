#include "ExplorerCommand.h"

#include <pathcch.h>
#include <shlwapi.h>
#include <algorithm>

// {C8C609B0-DF39-49D5-B1FB-3FBED19D3B54}
const CLSID CLSID_ZipperExplorerCommand = {
    0xC8C609B0, 0xDF39, 0x49D5, {0xB1, 0xFB, 0x3F, 0xBE, 0xD1, 0x9D, 0x3B, 0x54}};

namespace zipper {

const std::vector<CommandSpec>& ExtractCommands() {
    static const std::vector<CommandSpec> commands = {
        {L"Zipper で開く", L""},
        {L"ここに解凍する", L"--extract-here"},
        {L"フォルダに分けて解凍する", L"--extract-to-folder"},
        {L"解凍先を選んで解凍する", L"--extract"}};
    return commands;
}

const std::vector<CommandSpec>& CompressCommands() {
    // 「1 つずつ」は対象ごとに別々の書庫を作る。1 つしか選ばれていなければ出さない
    static const std::vector<CommandSpec> commands = {
        {L"ZIP に圧縮する", L"--compress-zip", false},
        {L"1 つずつ ZIP に圧縮する", L"--compress-zip-each", true},
        {L"7Z に圧縮する", L"--compress-7z", false},
        {L"1 つずつ 7Z に圧縮する", L"--compress-7z-each", true},
        {L"設定して圧縮する", L"--compress", false}};
    return commands;
}

bool IsArchivePath(const std::wstring& path) {
    // src/shared/archiveFormats.ts の SHELL_EXTENSIONS と同じ並びを保つ。
    // 分割書庫は先頭の巻を開けば全体が読まれるため .001 も書庫として扱う
    static const wchar_t* kExtensions[] = {
        L".zip",  L".zipx", L".7z",  L".rar",   L".lzh", L".lha", L".arj", L".cab",
        L".zst",  L".tar",  L".gz",  L".tgz",   L".bz2", L".tbz", L".xz",  L".txz",
        L".z",    L".iso",  L".dmg", L".hfs",   L".vhd", L".vmdk", L".wim", L".jar",
        L".apk",  L".nupkg", L".epub", L".deb", L".rpm", L".cpio", L".xar", L".chm",
        L".msi",  L".001"};

    const wchar_t* extension = PathFindExtensionW(path.c_str());
    if (extension == nullptr || *extension == L'\0') return false;

    for (const wchar_t* candidate : kExtensions) {
        if (_wcsicmp(extension, candidate) == 0) return true;
    }
    return false;
}

std::wstring ResolveApplicationPath() {
    // この DLL は <インストール先>\resources\shell に置かれる。2 つ上が本体の場所
    wchar_t modulePath[MAX_PATH] = {};
    HMODULE self = nullptr;

    if (GetModuleHandleExW(
            GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS | GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT,
            reinterpret_cast<LPCWSTR>(&ResolveApplicationPath), &self) == 0) {
        return {};
    }
    if (GetModuleFileNameW(self, modulePath, MAX_PATH) == 0) return {};

    // ZipperShell.dll → shell → resources と辿って本体の置き場へ戻る
    for (int level = 0; level < 3; ++level) {
        if (FAILED(PathCchRemoveFileSpec(modulePath, MAX_PATH))) return {};
    }
    if (FAILED(PathCchAppend(modulePath, MAX_PATH, L"Zipper.exe"))) return {};

    return PathFileExistsW(modulePath) ? std::wstring(modulePath) : std::wstring();
}

namespace {

// コマンドラインの上限に触れないよう、一度に渡す量を抑える
constexpr size_t kCommandLineLimit = 30000;

void StartProcess(const std::wstring& commandLine) {
    STARTUPINFOW startup = {};
    startup.cb = sizeof(startup);
    PROCESS_INFORMATION process = {};

    std::wstring mutableLine = commandLine;
    if (CreateProcessW(nullptr, mutableLine.data(), nullptr, nullptr, FALSE, 0, nullptr, nullptr,
                       &startup, &process)) {
        CloseHandle(process.hThread);
        CloseHandle(process.hProcess);
    }
}

}  // namespace

HRESULT LaunchApplication(const wchar_t* flag, IShellItemArray* items) {
    const std::wstring application = ResolveApplicationPath();
    if (application.empty() || items == nullptr) return E_FAIL;

    DWORD count = 0;
    if (FAILED(items->GetCount(&count)) || count == 0) return E_FAIL;

    const std::wstring prefix =
        L"\"" + application + L"\"" + (flag != nullptr && *flag != L'\0' ? L" " + std::wstring(flag) : L"");

    std::wstring line = prefix;
    for (DWORD index = 0; index < count; ++index) {
        IShellItem* item = nullptr;
        if (FAILED(items->GetItemAt(index, &item)) || item == nullptr) continue;

        LPWSTR path = nullptr;
        if (SUCCEEDED(item->GetDisplayName(SIGDN_FILESYSPATH, &path)) && path != nullptr) {
            const std::wstring argument = L" \"" + std::wstring(path) + L"\"";

            // 上限に達したらそこまでで起こし、残りは次の起動へ回す
            if (line.size() + argument.size() > kCommandLineLimit && line != prefix) {
                StartProcess(line);
                line = prefix;
            }
            line += argument;
            CoTaskMemFree(path);
        }
        item->Release();
    }

    if (line != prefix) StartProcess(line);
    return S_OK;
}

}  // namespace zipper

// ---------------------------------------------------------------- SubCommand

SubCommand::SubCommand(const zipper::CommandSpec& spec, IShellItemArray* items) : spec_(spec) {
    if (items != nullptr) {
        items_ = items;
        items_->AddRef();
    }
}

SubCommand::~SubCommand() {
    if (items_ != nullptr) items_->Release();
}

IFACEMETHODIMP SubCommand::QueryInterface(REFIID riid, void** ppv) {
    if (ppv == nullptr) return E_POINTER;

    if (riid == IID_IUnknown || riid == IID_IExplorerCommand) {
        *ppv = static_cast<IExplorerCommand*>(this);
        AddRef();
        return S_OK;
    }
    *ppv = nullptr;
    return E_NOINTERFACE;
}

IFACEMETHODIMP SubCommand::GetTitle(IShellItemArray*, LPWSTR* name) {
    return SHStrDupW(spec_.title, name);
}

IFACEMETHODIMP SubCommand::GetIcon(IShellItemArray*, LPWSTR* icon) {
    const std::wstring application = zipper::ResolveApplicationPath();
    if (application.empty()) return E_NOTIMPL;
    return SHStrDupW((application + L",0").c_str(), icon);
}

IFACEMETHODIMP SubCommand::GetToolTip(IShellItemArray*, LPWSTR*) { return E_NOTIMPL; }

IFACEMETHODIMP SubCommand::GetCanonicalName(GUID* guid) {
    if (guid == nullptr) return E_POINTER;
    *guid = GUID_NULL;
    return S_OK;
}

IFACEMETHODIMP SubCommand::GetState(IShellItemArray* items, BOOL, EXPCMDSTATE* state) {
    if (state == nullptr) return E_POINTER;

    // 対象ごとに分ける操作は、2 つ以上選ばれていなければ意味がないので伏せる
    if (spec_.multipleOnly) {
        IShellItemArray* target = items != nullptr ? items : items_;
        DWORD count = 0;
        if (target == nullptr || FAILED(target->GetCount(&count)) || count < 2) {
            *state = ECS_HIDDEN;
            return S_OK;
        }
    }

    *state = ECS_ENABLED;
    return S_OK;
}

IFACEMETHODIMP SubCommand::Invoke(IShellItemArray* items, IBindCtx*) {
    // 押された時点の選択物が渡る。無ければ組み立て時のものを使う
    return zipper::LaunchApplication(spec_.flag, items != nullptr ? items : items_);
}

IFACEMETHODIMP SubCommand::GetFlags(EXPCMDFLAGS* flags) {
    if (flags == nullptr) return E_POINTER;
    *flags = ECF_DEFAULT;
    return S_OK;
}

IFACEMETHODIMP SubCommand::EnumSubCommands(IEnumExplorerCommand**) { return E_NOTIMPL; }

// ----------------------------------------------------------- CommandEnumerator

CommandEnumerator::CommandEnumerator(const std::vector<zipper::CommandSpec>& specs,
                                     IShellItemArray* items)
    : specs_(specs) {
    if (items != nullptr) {
        items_ = items;
        items_->AddRef();
    }
}

CommandEnumerator::~CommandEnumerator() {
    if (items_ != nullptr) items_->Release();
}

IFACEMETHODIMP CommandEnumerator::QueryInterface(REFIID riid, void** ppv) {
    if (ppv == nullptr) return E_POINTER;

    if (riid == IID_IUnknown || riid == IID_IEnumExplorerCommand) {
        *ppv = static_cast<IEnumExplorerCommand*>(this);
        AddRef();
        return S_OK;
    }
    *ppv = nullptr;
    return E_NOINTERFACE;
}

IFACEMETHODIMP CommandEnumerator::Next(ULONG count, IExplorerCommand** commands, ULONG* fetched) {
    if (commands == nullptr) return E_POINTER;

    ULONG produced = 0;
    while (produced < count && position_ < specs_.size()) {
        commands[produced] = new (std::nothrow) SubCommand(specs_[position_], items_);
        if (commands[produced] == nullptr) return E_OUTOFMEMORY;
        ++produced;
        ++position_;
    }

    if (fetched != nullptr) *fetched = produced;
    return produced == count ? S_OK : S_FALSE;
}

IFACEMETHODIMP CommandEnumerator::Skip(ULONG count) {
    position_ = std::min(position_ + count, specs_.size());
    return S_OK;
}

IFACEMETHODIMP CommandEnumerator::Reset() {
    position_ = 0;
    return S_OK;
}

IFACEMETHODIMP CommandEnumerator::Clone(IEnumExplorerCommand** result) {
    if (result == nullptr) return E_POINTER;
    *result = new (std::nothrow) CommandEnumerator(specs_, items_);
    return *result != nullptr ? S_OK : E_OUTOFMEMORY;
}

// --------------------------------------------------------------- RootCommand

RootCommand::~RootCommand() {
    if (items_ != nullptr) items_->Release();
}

IFACEMETHODIMP RootCommand::QueryInterface(REFIID riid, void** ppv) {
    if (ppv == nullptr) return E_POINTER;

    if (riid == IID_IUnknown || riid == IID_IExplorerCommand) {
        *ppv = static_cast<IExplorerCommand*>(this);
        AddRef();
        return S_OK;
    }
    *ppv = nullptr;
    return E_NOINTERFACE;
}

IFACEMETHODIMP RootCommand::GetTitle(IShellItemArray* items, LPWSTR* name) {
    // 子を組み立てるのは EnumSubCommands だが、そこには選択物が渡らない。ここで控える
    if (items != nullptr) {
        if (items_ != nullptr) items_->Release();
        items_ = items;
        items_->AddRef();
    }
    return SHStrDupW(L"Zipper", name);
}

IFACEMETHODIMP RootCommand::GetIcon(IShellItemArray*, LPWSTR* icon) {
    const std::wstring application = zipper::ResolveApplicationPath();
    if (application.empty()) return E_NOTIMPL;
    return SHStrDupW((application + L",0").c_str(), icon);
}

IFACEMETHODIMP RootCommand::GetToolTip(IShellItemArray*, LPWSTR*) { return E_NOTIMPL; }

IFACEMETHODIMP RootCommand::GetCanonicalName(GUID* guid) {
    if (guid == nullptr) return E_POINTER;
    *guid = GUID_NULL;
    return S_OK;
}

IFACEMETHODIMP RootCommand::GetState(IShellItemArray* items, BOOL, EXPCMDSTATE* state) {
    if (state == nullptr) return E_POINTER;

    if (items != nullptr) {
        if (items_ != nullptr) items_->Release();
        items_ = items;
        items_->AddRef();
    }

    // 本体が見つからない配置では出しても押せないため隠す
    *state = zipper::ResolveApplicationPath().empty() ? ECS_HIDDEN : ECS_ENABLED;
    return S_OK;
}

IFACEMETHODIMP RootCommand::Invoke(IShellItemArray*, IBindCtx*) {
    // 1 段目は入口。押しても何もせず、子が開くのに任せる
    return S_OK;
}

IFACEMETHODIMP RootCommand::GetFlags(EXPCMDFLAGS* flags) {
    if (flags == nullptr) return E_POINTER;
    *flags = ECF_HASSUBCOMMANDS;
    return S_OK;
}

IFACEMETHODIMP RootCommand::EnumSubCommands(IEnumExplorerCommand** commands) {
    if (commands == nullptr) return E_POINTER;

    // 先頭が書庫なら解凍の一覧、それ以外は圧縮の一覧を出す
    bool archive = false;
    if (items_ != nullptr) {
        IShellItem* first = nullptr;
        if (SUCCEEDED(items_->GetItemAt(0, &first)) && first != nullptr) {
            LPWSTR path = nullptr;
            if (SUCCEEDED(first->GetDisplayName(SIGDN_FILESYSPATH, &path)) && path != nullptr) {
                archive = zipper::IsArchivePath(path);
                CoTaskMemFree(path);
            }
            first->Release();
        }
    }

    const std::vector<zipper::CommandSpec>& specs =
        archive ? zipper::ExtractCommands() : zipper::CompressCommands();

    *commands = new (std::nothrow) CommandEnumerator(specs, items_);
    return *commands != nullptr ? S_OK : E_OUTOFMEMORY;
}
