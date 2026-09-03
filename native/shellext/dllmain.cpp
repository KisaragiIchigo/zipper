#include "ExplorerCommand.h"

#include <new>

namespace {

// この DLL が抱えているオブジェクトの数。0 になるまで解放させない
LONG g_objectCount = 0;

class ClassFactory : public IClassFactory {
public:
    IFACEMETHODIMP QueryInterface(REFIID riid, void** ppv) override {
        if (ppv == nullptr) return E_POINTER;

        if (riid == IID_IUnknown || riid == IID_IClassFactory) {
            *ppv = static_cast<IClassFactory*>(this);
            AddRef();
            return S_OK;
        }
        *ppv = nullptr;
        return E_NOINTERFACE;
    }

    IFACEMETHODIMP_(ULONG) AddRef() override { return InterlockedIncrement(&refs_); }

    IFACEMETHODIMP_(ULONG) Release() override {
        const ULONG remaining = InterlockedDecrement(&refs_);
        if (remaining == 0) delete this;
        return remaining;
    }

    IFACEMETHODIMP CreateInstance(IUnknown* outer, REFIID riid, void** ppv) override {
        if (ppv == nullptr) return E_POINTER;
        *ppv = nullptr;
        // 集約は使わない
        if (outer != nullptr) return CLASS_E_NOAGGREGATION;

        RootCommand* command = new (std::nothrow) RootCommand();
        if (command == nullptr) return E_OUTOFMEMORY;

        const HRESULT result = command->QueryInterface(riid, ppv);
        command->Release();
        return result;
    }

    IFACEMETHODIMP LockServer(BOOL lock) override {
        if (lock) InterlockedIncrement(&g_objectCount);
        else InterlockedDecrement(&g_objectCount);
        return S_OK;
    }

private:
    LONG refs_ = 1;
};

}  // namespace

BOOL APIENTRY DllMain(HMODULE module, DWORD reason, LPVOID) {
    if (reason == DLL_PROCESS_ATTACH) DisableThreadLibraryCalls(module);
    return TRUE;
}

STDAPI DllGetClassObject(REFCLSID rclsid, REFIID riid, void** ppv) {
    if (ppv == nullptr) return E_POINTER;
    *ppv = nullptr;

    if (rclsid != CLSID_ZipperExplorerCommand) return CLASS_E_CLASSNOTAVAILABLE;

    ClassFactory* factory = new (std::nothrow) ClassFactory();
    if (factory == nullptr) return E_OUTOFMEMORY;

    const HRESULT result = factory->QueryInterface(riid, ppv);
    factory->Release();
    return result;
}

STDAPI DllCanUnloadNow() { return g_objectCount == 0 ? S_OK : S_FALSE; }
