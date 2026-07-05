// Registered as the very first import of app/_layout.tsx so it installs
// before anything else can throw. In release builds there is no red box —
// an uncaught JS error otherwise kills the process with a bare native
// "keeps stopping" dialog and no diagnostics. This intercepts that and
// routes fatal errors to a visible CrashScreen instead.

type CrashListener = (error: Error, isFatal: boolean) => void;

let listener: CrashListener | null = null;

export function onCrash(cb: CrashListener) {
  listener = cb;
}

export function installCrashReporter() {
  const g = globalThis as any;
  const defaultHandler = g.ErrorUtils?.getGlobalHandler?.();

  g.ErrorUtils?.setGlobalHandler((error: Error, isFatal: boolean) => {
    console.error("[crashReporter] uncaught error", isFatal, error);
    if (listener) {
      listener(error, isFatal);
    } else {
      defaultHandler?.(error, isFatal);
    }
  });
}
