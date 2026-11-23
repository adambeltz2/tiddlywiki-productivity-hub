/*\
title: $:/prod/io.js
type: application/javascript
module-type: startup

Markdown export/import for the Productivity Hub, built on $:/prod/markdown.js (no plugins).
Messages: tm-prod-export-preview, tm-prod-export-download (param = "all" | project title),
          tm-prod-export-tiddler (param = tiddler title), tm-prod-import-paste
\*/
(function(){
"use strict";
exports.name="prod-io";
exports.platforms=["browser"];
exports.before=["render"];
exports.synchronous=true;

var MD=require("$:/prod/markdown.js");
var PALETTE=["#4c6ef5","#12b886","#f59f00","#e64980","#7950f2","#15aabf","#fd7e14","#40c057"];
var wiki=$tw.wiki;
function pad(n){ return (n<10?"0":"")+n; }
function isoNow(){ var d=new Date(); return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
function isoOf(d){ return d instanceof Date ? d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()) : ""; }
function opt(tid,field,def){ var t=wiki.getTiddler(tid); var v=t&&t.fields[field]; return v==null||v===""?def:v; }
function kindOf(t){ var g=t.fields.tags||[]; return g.indexOf("Project")>=0?"project":g.indexOf("Task")>=0?"task":g.indexOf("Note")>=0?"note":null; }
function slug(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"export"; }

/* ----- export ----- */
function docFor(t){
	var k=kindOf(t), f=t.fields, fields={}, skip=["Task","Note","Project",f.project];
	["project","status","priority","due","repeat","focus","pinned","completed","color"].forEach(function(n){ if(f[n]) fields[n]=f[n]; });
	if(f.created) fields.created=isoOf(f.created);
	return MD.renderDoc({title:f.title,kind:k,tags:(f.tags||[]).filter(function(x){ return skip.indexOf(x)<0; }),fields:fields,body:f.text||""});
}
function collect(scope,o){
	var titles=[];
	function add(t){ if(titles.indexOf(t.fields.title)<0) titles.push(t.fields.title); }
	var projects=[], tasks=[], notes=[];
	wiki.each(function(t){
		if(t.fields["draft.of"]) return;
		var k=kindOf(t); if(!k) return;
		if(k==="project") projects.push(t); else if(k==="task") tasks.push(t); else notes.push(t);
	});
	var all=scope==="all";
	projects.filter(function(p){ return all||p.fields.title===scope; }).forEach(add);
	if(o.tasks) tasks.filter(function(t){ return (all||t.fields.project===scope||(t.fields.tags||[]).indexOf(scope)>=0)&&(o.done||t.fields.status!=="done"); }).forEach(add);
	if(o.notes) notes.filter(function(t){ return all||t.fields.project===scope||(t.fields.tags||[]).indexOf(scope)>=0; }).forEach(add);
	return titles.map(function(x){ return wiki.getTiddler(x); });
}
function exportOptions(){
	var S="$:/state/prod/export";
	return {tasks:opt(S,"tasks","yes")!=="no",notes:opt(S,"notes","yes")!=="no",done:opt(S,"done","yes")!=="no"};
}
function buildExport(scope){
	var items=collect(scope,exportOptions());
	return {text:MD.bundle(items.map(docFor)),count:items.length};
}
function download(filename,text){
	var blob=new Blob([text],{type:"text/markdown;charset=utf-8"}), a=document.createElement("a");
	a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click();
	setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(a.href); },500);
}
function setInfo(msg,text){
	wiki.addTiddler(new $tw.Tiddler({title:"$:/temp/prod/export",text:text||"",info:msg}));
}

/* ----- import ----- */
function uniqueTitle(base){
	if(!wiki.tiddlerExists(base)) return base;
	var i=2; while(wiki.tiddlerExists(base+" ("+i+")")) i++;
	return base+" ("+i+")";
}
function twDate(iso){ return iso.replace(/-/g,"")+"000000000"; }
function ensureProject(name,res,color){
	if(!name) return;
	var t=wiki.getTiddler(name);
	if(t){ return; }
	var n=0; wiki.each(function(x){ if((x.fields.tags||[]).indexOf("Project")>=0) n++; });
	wiki.addTiddler(new $tw.Tiddler(wiki.getCreationFields(),wiki.getModificationFields(),{title:name,tags:["Project"],status:"active",color:color||PALETTE[n%PALETTE.length],text:""}));
	res.projects.push(name);
}
function importDocs(files,o){
	var res={created:[],skipped:[],projects:[],tasks:0,notes:0,projectsImported:0,errors:[]};
	var texts=[];
	files.forEach(function(f){ MD.splitBundle(f.text).forEach(function(part){ texts.push({name:f.name,text:part}); }); });
	texts.forEach(function(item,idx){
		var d;
		try{ d=MD.parseDoc(item.text,texts.length===1||MD.splitBundle(item.text).length===1?item.name:"",{checklist:o.checklist}); }
		catch(e){ res.errors.push(item.name+": "+e.message); return; }
		if(!d.title) d.title="Imported note "+isoNow()+(idx?" "+(idx+1):"");
		var project=d.fields.project||(d.kind==="project"?"":o.project||"");
		if(project&&d.kind!=="project") ensureProject(project,res);
		var title=d.title, exists=wiki.tiddlerExists(title);
		if(exists&&o.conflict==="skip"){ res.skipped.push(title); return; }
		if(exists&&o.conflict!=="overwrite") title=uniqueTitle(title);
		var fields={title:title,text:d.body};
		var tags=d.tags.filter(function(x){ return ["Task","Note","Project"].indexOf(x)<0; });
		var kindTag=d.kind==="project"?"Project":d.kind==="task"?"Task":"Note";
		tags.unshift(kindTag);
		if(project&&d.kind!=="project"&&tags.indexOf(project)<0) tags.push(project);
		fields.tags=tags;
		Object.keys(d.fields).forEach(function(k){ if(k==="created") return; fields[k]=d.fields[k]; });
		if(project&&d.kind!=="project") fields.project=project; else if(d.kind==="project") delete fields.project;
		if(d.kind==="task"){ if(!fields.status) fields.status="todo"; if(!fields.priority) fields.priority="2"; if(fields.status==="done"&&!fields.completed) fields.completed=isoNow(); }
		if(d.kind==="project"){ if(!fields.status) fields.status="active"; if(!fields.color){ var n=0; wiki.each(function(x){ if((x.fields.tags||[]).indexOf("Project")>=0) n++; }); fields.color=PALETTE[n%PALETTE.length]; } }
		var base=wiki.getCreationFields();
		if(d.fields.created) base=$tw.utils.extend({},base,{created:$tw.utils.parseDate(twDate(d.fields.created))||base.created});
		wiki.addTiddler(new $tw.Tiddler(base,wiki.getModificationFields(),fields));
		res.created.push({title:title,kind:d.kind});
		if(d.kind==="task") res.tasks++; else if(d.kind==="note") res.notes++; else res.projectsImported++;
		d.tasks.forEach(function(tk){
			var tt=uniqueTitle(tk.title), tf={title:tt,tags:["Task"],status:tk.done?"done":"todo",priority:"2",text:""};
			if(tk.due) tf.due=tk.due;
			if(tk.done) tf.completed=isoNow();
			if(project){ tf.project=project; tf.tags.push(project); }
			wiki.addTiddler(new $tw.Tiddler(wiki.getCreationFields(),wiki.getModificationFields(),tf));
			res.created.push({title:tt,kind:"task"}); res.tasks++;
		});
	});
	return res;
}
function importOptions(){
	var S="$:/state/prod/import";
	return {project:opt(S,"project",""),conflict:opt(S,"conflict","rename"),checklist:opt(S,"checklist","no")==="yes"};
}
function summarise(res){
	var lines=[];
	lines.push("Imported ''"+res.created.length+"'' item(s): "+res.projectsImported+" project(s), "+res.tasks+" task(s), "+res.notes+" note(s).");
	if(res.projects.length) lines.push("\nNew projects created automatically: "+res.projects.map(function(p){ return "[["+p+"]]"; }).join(", ")+".");
	if(res.skipped.length) lines.push("\nSkipped (already exist): "+res.skipped.map(function(p){ return "[["+p+"]]"; }).join(", ")+".");
	if(res.errors.length) lines.push("\n@@color:#d64545;Errors:@@\n"+res.errors.map(function(e){ return "* <$text text="+JSON.stringify(e)+"/>"; }).join("\n"));
	if(res.created.length) lines.push("\n"+res.created.slice(0,100).map(function(c){ return "* [["+c.title+"]] //("+c.kind+")//"; }).join("\n"));
	wiki.addTiddler(new $tw.Tiddler({title:"$:/temp/prod/import-result",text:lines.join("\n")}));
}
exports.importFiles=function(files){ var r=importDocs(files,importOptions()); summarise(r); return r; };

exports.startup=function(){
	var rw=$tw.rootWidget;
	rw.addEventListener("tm-prod-export-preview",function(e){
		var r=buildExport(e.param||"all");
		setInfo(r.count+" item(s) exported",r.text);
	});
	rw.addEventListener("tm-prod-export-download",function(e){
		var scope=e.param||"all", r=buildExport(scope);
		setInfo(r.count+" item(s) exported",r.text);
		download(slug(scope==="all"?"productivity-hub":scope)+"-"+isoNow()+".md",r.text);
	});
	rw.addEventListener("tm-prod-export-tiddler",function(e){
		var t=wiki.getTiddler(e.param); if(!t||!kindOf(t)) return;
		download(slug(t.fields.title)+".md",docFor(t));
	});
	rw.addEventListener("tm-prod-import-paste",function(){
		var text=wiki.getTiddlerText("$:/state/prod/import/paste","");
		if(!text.trim()) return;
		exports.importFiles([{name:"pasted.md",text:text}]);
	});
};
})();
