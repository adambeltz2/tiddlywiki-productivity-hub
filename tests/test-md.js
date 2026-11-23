const md=require("../source/tiddlers/markdown.js"); const assert=require("assert");
let n=0; const t=(name,f)=>{try{f();n++;console.log("ok  ",name)}catch(e){console.log("FAIL",name,"\n",e.message);process.exitCode=1}};
const W=`! Title
Some ''bold'' and //italic// and ~~gone~~ with [[Project X]] and [[a link|https://x.com]] and [[alias|Other Note]] and \`''code''\`.
* one
** nested
*# ordered under bullet
* two
# first
# second
> quote
---
|!H1|!H2|
|a|b|
\`\`\`js
let a = ''x'';
\`\`\``;
const m=md.wikiToMd(W); console.log(m);
t("heading",()=>assert(/^# Title/.test(m)));
t("bold/italic",()=>assert(m.includes("**bold**")&&m.includes("*italic*")));
t("code protected",()=>assert(m.includes("`''code''`")&&m.includes("let a = ''x'';")));
t("links",()=>assert(m.includes("[a link](https://x.com)")&&m.includes("[[Other Note|alias]]")&&m.includes("[[Project X]]")));
t("lists",()=>assert(m.includes("- one\n  - nested")&&m.includes("1. first")));
t("table",()=>assert(m.includes("| H1 | H2 |\n| --- | --- |\n| a | b |")));
const back=md.mdToWiki(m); console.log(back);
t("roundtrip bold",()=>assert(back.includes("''bold''")&&back.includes("//italic//")));
t("roundtrip links",()=>assert(back.includes("[[a link|https://x.com]]")&&back.includes("[[alias|Other Note]]")&&back.includes("[[Project X]]")));
t("roundtrip lists",()=>assert(/^\* one\n\*\* nested\n\*# ordered/m.test(back)||/^\* one\n\*\* nested/m.test(back)));
t("roundtrip table",()=>assert(back.includes("|!H1|!H2|h\n|a|b|")));
t("roundtrip fence",()=>assert(back.includes("```js\nlet a = ''x'';\n```")));
t("snake_case untouched",()=>assert.strictEqual(md.mdToWiki("use my_var_name here"),"use my_var_name here"));
t("url // untouched",()=>assert.strictEqual(md.wikiToMd("see http://a.com/x//y ok"),"see http://a.com/x//y ok"));
const doc=md.renderDoc({title:"Fix: bug",kind:"task",tags:["a b","c"],fields:{project:"Web",due:"2026-12-01",priority:"1",status:"todo"},body:"Do ''it''\n* x"});
console.log(doc);
const p=md.parseDoc(doc);
t("doc title",()=>assert.strictEqual(p.title,"Fix: bug"));
t("doc kind/fields",()=>assert(p.kind==="task"&&p.fields.project==="Web"&&p.fields.due==="2026-12-01"&&p.fields.priority==="1"));
t("doc tags",()=>assert.deepStrictEqual(p.tags,["a b","c"]));
t("doc body",()=>assert.strictEqual(p.body,"Do ''it''\n\n* x"));
const ext=md.parseDoc("# Plan\n\n- [ ] Write spec 📅 2026-12-02\n- [x] Done thing\ntext\n","plan.md",{checklist:true});
t("checklist",()=>assert(ext.tasks.length===2&&ext.tasks[0].due==="2026-12-02"&&ext.tasks[1].done&&ext.body==="text"));
const plain=md.parseDoc("Hello **world**\n","my-file.md");
t("filename title",()=>assert(plain.title==="my-file"&&plain.kind==="note"));
const b=md.splitBundle(md.bundle([doc,md.renderDoc({title:"N",kind:"note",tags:[],fields:{},body:"hi"})]));
t("bundle",()=>assert.strictEqual(b.length,2));
const fm=md.parseFrontMatter("---\ntitle: X\ntags:\n  - a\n  - b\nstatus: 'In Progress'\n---\nbody");
t("yaml list",()=>assert.deepStrictEqual(fm.meta.tags,["a","b"]));
t("status alias",()=>assert.strictEqual(md.parseDoc("---\nstatus: In Progress\ndue: 2026-01-01\n---\nx","a.md").fields.status,"doing"));
const blk=md.mdToWiki("Intro line\n- a\n- b\nafter list\n1. x\n```bash\ncmd\n```\ntext after\n# Head\npara\n| h |\n| --- |\n| c |\nend");
t("list interrupts paragraph",()=>assert(/Intro line\n\n\* a\n\* b\n\nafter list/.test(blk)));
t("fence interrupts paragraph",()=>assert(/# x\n\n```bash\ncmd\n```\n\ntext after/.test(blk)));
t("heading and table spacing",()=>assert(/! Head\npara\n\n\|!h\|h\n\|c\|\n\nend/.test(blk)));
t("indented continuation trimmed",()=>assert.strictEqual(md.mdToWiki("1. one\n\n   continued text"),"# one\n\ncontinued text"));
console.log(n,"passed");
