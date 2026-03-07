// Nitro bundles server/api handlers using h3 v2 (our direct dep), but internally
// registers them through h3 v1 (nitropack's dep). h3 v1 warns when it sees a
// handler without its __is_handler__ marker, which h3 v2 doesn't set.
// Suppress only that specific message — everything functions correctly.
export default defineNitroPlugin(() => {
  const _warn = console.warn.bind(console)
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('[h3] Implicit event handler')) return
    _warn(...args)
  }
})
