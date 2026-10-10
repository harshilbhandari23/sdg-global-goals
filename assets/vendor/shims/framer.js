/* Minimal stand-in for the "framer" package so the exported hero modules run on a plain page. */
export const addPropertyControls = () => {};
export const ControlType = new Proxy({}, { get: (_, k) => String(k) });
export const useIsStaticRenderer = () => false;
export const RenderTarget = { current: () => "PREVIEW" };
