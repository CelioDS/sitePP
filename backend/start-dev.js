process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

console.log("⚠️ NODE_TLS_REJECT_UNAUTHORIZED=0 ativo apenas para teste local");

await import("./index.js");