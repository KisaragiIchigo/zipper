#pragma once

#include <windows.h>
#include <shobjidl_core.h>
#include <string>
#include <vector>

// このメニューを表す COM の識別子。マニフェストの Clsid と一致させること
// {C8C609B0-DF39-49D5-B1FB-3FBED19D3B54}
extern const CLSID CLSID_ZipperExplorerCommand;

namespace zipper {

// 子の項目 1 つ分。flag が空なら引数なしで起動する
struct CommandSpec {
    const wchar_t* title;
    const wchar_t* flag;
};

// 選択されたものが書庫かどうかで、出す項目を変える
const std::vector<CommandSpec>& ExtractCommands();
const std::vector<CommandSpec>& CompressCommands();

// 拡張子が書庫のものか。分割書庫の先頭（.001）も含む
bool IsArchivePath(const std::wstring& path);

// この DLL と同じ配布物に置かれた Zipper.exe を探す
std::wstring ResolveApplicationPath();

// 選択されたものをすべて引数にして Zipper.exe を起動する
HRESULT LaunchApplication(const wchar_t* flag, IShellItemArray* items);

}  // namespace zipper

// 参照カウントだけを持つ土台。ATL に頼らず素の COM として組む
class RefCounted {
public:
    virtual ~RefCounted() = default;

protected:
    ULONG AddRefImpl() { return InterlockedIncrement(&refs_); }

    ULONG ReleaseImpl() {
        const ULONG remaining = InterlockedDecrement(&refs_);
        if (remaining == 0) delete this;
        return remaining;
    }

private:
    LONG refs_ = 1;
};

// 実際に押される項目。押すと Zipper.exe を引数付きで起こす
class SubCommand : public IExplorerCommand, public RefCounted {
public:
    SubCommand(const zipper::CommandSpec& spec, IShellItemArray* items);

    IFACEMETHODIMP QueryInterface(REFIID riid, void** ppv) override;
    IFACEMETHODIMP_(ULONG) AddRef() override { return AddRefImpl(); }
    IFACEMETHODIMP_(ULONG) Release() override { return ReleaseImpl(); }

    IFACEMETHODIMP GetTitle(IShellItemArray* items, LPWSTR* name) override;
    IFACEMETHODIMP GetIcon(IShellItemArray* items, LPWSTR* icon) override;
    IFACEMETHODIMP GetToolTip(IShellItemArray* items, LPWSTR* tip) override;
    IFACEMETHODIMP GetCanonicalName(GUID* guid) override;
    IFACEMETHODIMP GetState(IShellItemArray* items, BOOL okToBeSlow, EXPCMDSTATE* state) override;
    IFACEMETHODIMP Invoke(IShellItemArray* items, IBindCtx* ctx) override;
    IFACEMETHODIMP GetFlags(EXPCMDFLAGS* flags) override;
    IFACEMETHODIMP EnumSubCommands(IEnumExplorerCommand** commands) override;

private:
    ~SubCommand() override;

    zipper::CommandSpec spec_;
    IShellItemArray* items_ = nullptr;
};

// 子の並びを返す入れ物
class CommandEnumerator : public IEnumExplorerCommand, public RefCounted {
public:
    CommandEnumerator(const std::vector<zipper::CommandSpec>& specs, IShellItemArray* items);

    IFACEMETHODIMP QueryInterface(REFIID riid, void** ppv) override;
    IFACEMETHODIMP_(ULONG) AddRef() override { return AddRefImpl(); }
    IFACEMETHODIMP_(ULONG) Release() override { return ReleaseImpl(); }

    IFACEMETHODIMP Next(ULONG count, IExplorerCommand** commands, ULONG* fetched) override;
    IFACEMETHODIMP Skip(ULONG count) override;
    IFACEMETHODIMP Reset() override;
    IFACEMETHODIMP Clone(IEnumExplorerCommand** result) override;

private:
    ~CommandEnumerator() override;

    std::vector<zipper::CommandSpec> specs_;
    IShellItemArray* items_ = nullptr;
    size_t position_ = 0;
};

// 右クリックに現れる 1 段目。押すと子が開く
class RootCommand : public IExplorerCommand, public RefCounted {
public:
    RootCommand() = default;

    IFACEMETHODIMP QueryInterface(REFIID riid, void** ppv) override;
    IFACEMETHODIMP_(ULONG) AddRef() override { return AddRefImpl(); }
    IFACEMETHODIMP_(ULONG) Release() override { return ReleaseImpl(); }

    IFACEMETHODIMP GetTitle(IShellItemArray* items, LPWSTR* name) override;
    IFACEMETHODIMP GetIcon(IShellItemArray* items, LPWSTR* icon) override;
    IFACEMETHODIMP GetToolTip(IShellItemArray* items, LPWSTR* tip) override;
    IFACEMETHODIMP GetCanonicalName(GUID* guid) override;
    IFACEMETHODIMP GetState(IShellItemArray* items, BOOL okToBeSlow, EXPCMDSTATE* state) override;
    IFACEMETHODIMP Invoke(IShellItemArray* items, IBindCtx* ctx) override;
    IFACEMETHODIMP GetFlags(EXPCMDFLAGS* flags) override;
    IFACEMETHODIMP EnumSubCommands(IEnumExplorerCommand** commands) override;

private:
    ~RootCommand() override;

    // GetTitle で渡された選択物を控え、子を組み立てるときに使う
    IShellItemArray* items_ = nullptr;
};
