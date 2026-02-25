const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");
const htmlPath = path.join(distDir, "ui.html");
const jsPath = path.join(distDir, "ui.js");

let html = fs.readFileSync(htmlPath, "utf8");
let js = fs.readFileSync(jsPath, "utf8");

// Embutir o JS como base64 para que NUNCA apareça </script> no HTML (evita quebra no document.write do Figma)
const base64 = Buffer.from(js, "utf8").toString("base64");
const loader = [
  "<script type=\"module\">",
  "(function(){",
  "  var d=document,s=atob(\"" + base64 + "\");",
  "  var e=d.createElement(\"script\");",
  "  e.type=\"module\";",
  "  e.textContent=s;",
  "  d.head.appendChild(e);",
  "})();",
  "</script>",
].join("");

const scriptTagRegex = /<script[^>]*src="[^"]*ui\.js"[^>]*\s*><\/script>/;
html = html.replace(scriptTagRegex, loader);

fs.writeFileSync(htmlPath, html, "utf8");
console.log("Inlined ui.js into ui.html (base64)");
