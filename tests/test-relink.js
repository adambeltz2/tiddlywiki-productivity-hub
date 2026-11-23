const {relinkText:r}=require("../source/tiddlers/relink.js"); const assert=require("assert");
const t=`a [[Old Name]] b [[the thing|Old Name]] c {{Old Name}} d {{Old Name!!x}} e <$link to="Old Name">x</$link> f \`[[Old Name]]\` g [[Old Name 2]] h [[Other|Old Name2]]
\`\`\`
[[Old Name]]
\`\`\``;
const o=r(t,"Old Name","New: Name");
console.log(o);
assert(o.includes("[[New: Name]]")&&o.includes("[[the thing|New: Name]]")&&o.includes("{{New: Name}}")&&o.includes("{{New: Name!!x}}")&&o.includes('to="New: Name"'));
assert(o.includes("`[[Old Name]]`")&&o.includes("[[Old Name 2]]")&&o.includes("[[Other|Old Name2]]")&&o.includes("```\n[[Old Name]]\n```"));
assert.strictEqual(r("x [[A|B]]","A","C"),"x [[A|B]]"); console.log("relink ok");
