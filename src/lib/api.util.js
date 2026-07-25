// `export { default } from` (not `import` + `export default Default`) because this
// shim sits inside an import cycle: the engine's hooks-server → lib/services/auth.js
// → $pano/lib/api.util → @panomc/sdk/core/js/api.util → $lib/Store.js → back here.
// `export default <identifier>` is an expression evaluated once while the SDK module
// is still in-flight, so it would snapshot an uninitialized binding and publish
// `undefined` forever. A re-export is an indirect binding resolved at link time and
// read on access, so it survives the cycle.
export * from '@panomc/sdk/core/js/api.util';
export { default } from '@panomc/sdk/core/js/api.util';
