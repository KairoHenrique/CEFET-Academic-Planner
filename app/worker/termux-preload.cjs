// Hack Termux: Fakes process.platform to 'linux' so that Playwright and other native modules don't crash when they see 'android'.
Object.defineProperty(process, 'platform', { get: () => 'linux' });
