import { Effect, Layer, ManagedRuntime } from "effect";

import { AppLive, CatalogLive, LibraryLive } from "~/infrastructure/app-layer";

export const makeAppRuntimes = () => {
  // The same memo map lets combined and library-only requests share one pool.
  const memoMap = Effect.runSync(Layer.makeMemoMap);
  const library = ManagedRuntime.make(LibraryLive, memoMap);
  const catalog = ManagedRuntime.make(CatalogLive, memoMap);
  const app = ManagedRuntime.make(AppLive, memoMap);
  return {
    library,
    catalog,
    app,
    dispose: async () => {
      await Promise.all([app.dispose(), library.dispose(), catalog.dispose()]);
    },
  };
};

type AppRuntimes = ReturnType<typeof makeAppRuntimes>;
const processState = globalThis as typeof globalThis & {
  checkpointRuntimes?: AppRuntimes;
  checkpointCleanupRegistered?: boolean;
};

export const getAppRuntimes = () => {
  if (!processState.checkpointCleanupRegistered) {
    processState.checkpointCleanupRegistered = true;
    process.once("beforeExit", () => {
      void disposeAppRuntimes().catch((error: unknown) => {
        console.error("Runtime cleanup failed", error);
      });
    });
  }
  return (processState.checkpointRuntimes ??= makeAppRuntimes());
};

// Called by an embedding server after requests drain, or explicitly by tests/tools.
export const disposeAppRuntimes = async () => {
  const runtimes = processState.checkpointRuntimes;
  processState.checkpointRuntimes = undefined;
  await runtimes?.dispose();
};
