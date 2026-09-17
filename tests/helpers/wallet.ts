import type { Page } from "@playwright/test";

export async function injectLocalWallet(page: Page, accountIndex = 3) {
  const response = await fetch("http://127.0.0.1:8545", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_accounts",
      params: [],
    }),
  });
  const { result: accounts } = (await response.json()) as { result: string[] };
  await page.exposeBinding(
    "localWalletRpc",
    async (_, request: { method: string; params?: unknown[] }) => {
      const result = await fetch("http://127.0.0.1:8545", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, ...request }),
      });
      const body = await result.json();
      if (body.error) throw new Error(body.error.message);
      return body.result;
    },
  );
  await page.addInitScript(
    ({ accounts, accountIndex }) => {
      type State = Window & {
        localWalletRpc: (request: {
          method: string;
          params?: unknown[];
        }) => Promise<unknown>;
        ethereum: unknown;
        setWalletAccount: (index: number) => void;
        rejectWalletRequest: boolean;
        setWalletChain: (id: string) => void;
      };
      const state = window as unknown as State;
      let account = accounts[accountIndex];
      let chainId = "0x7a69";
      const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
      const emit = (event: string, value: unknown) =>
        listeners.get(event)?.forEach((listener) => listener(value));
      state.setWalletAccount = (index) => {
        account = accounts[index];
        emit("accountsChanged", [account]);
      };
      state.setWalletChain = (id) => {
        chainId = id;
        emit("chainChanged", id);
      };
      state.ethereum = {
        isMetaMask: true,
        on: (event: string, callback: (...args: unknown[]) => void) => {
          if (!listeners.has(event)) listeners.set(event, new Set());
          listeners.get(event)!.add(callback);
        },
        removeListener: (
          event: string,
          callback: (...args: unknown[]) => void,
        ) => listeners.get(event)?.delete(callback),
        request: async (request: { method: string; params?: unknown[] }) => {
          if (
            state.rejectWalletRequest &&
            [
              "eth_requestAccounts",
              "personal_sign",
              "eth_sendTransaction",
            ].includes(request.method)
          ) {
            state.rejectWalletRequest = false;
            throw Object.assign(new Error("User rejected request"), {
              code: 4001,
            });
          }
          if (["eth_accounts", "eth_requestAccounts"].includes(request.method))
            return [account];
          if (request.method === "eth_chainId") return chainId;
          if (request.method === "wallet_switchEthereumChain") {
            state.setWalletChain(
              (request.params?.[0] as { chainId: string }).chainId,
            );
            return null;
          }
          if (request.method === "wallet_requestPermissions")
            return [{ parentCapability: "eth_accounts" }];
          if (request.method === "wallet_getPermissions")
            return [{ parentCapability: "eth_accounts" }];
          if (request.method === "wallet_revokePermissions") return null;
          return state.localWalletRpc(request);
        },
      };
    },
    { accounts, accountIndex },
  );
  return accounts;
}
