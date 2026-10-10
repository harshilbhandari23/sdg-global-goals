const R = window.React;
function make(type, props, key) {
  const { children, ...rest } = props || {};
  if (key !== undefined) rest.key = key;
  return children === undefined ? R.createElement(type, rest) : R.createElement(type, rest, children);
}
export const jsx = make, jsxs = make, Fragment = R.Fragment;
