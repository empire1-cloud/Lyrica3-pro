// Shim: @emergentbase packages are optional visual-edit tooling — not available in CI.
// This declaration prevents TypeScript/jsconfig errors if any stray import exists.
declare module '@emergentbase/*';
