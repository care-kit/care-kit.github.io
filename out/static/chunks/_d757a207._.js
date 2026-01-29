(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/lib/firebase.ts [app-client] (ecmascript, async loader)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v((parentImport) => {
    return Promise.resolve().then(() => {
        return parentImport("[project]/src/lib/firebase.ts [app-client] (ecmascript)");
    });
});
}}),
"[project]/node_modules/firebase/firestore/dist/esm/index.esm.js [app-client] (ecmascript, async loader)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "static/chunks/node_modules_firebase_firestore_dist_esm_index_esm_6da06cb6.js",
  "static/chunks/node_modules_firebase_firestore_dist_esm_index_esm_01e081c2.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/node_modules/firebase/firestore/dist/esm/index.esm.js [app-client] (ecmascript)");
    });
});
}}),
}]);