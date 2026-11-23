/*\
title: $:/prod/markdown.js
type: application/javascript
module-type: library

Self-contained Markdown <-> TiddlyWiki wikitext converter with YAML-style front matter.
No external dependencies. Pure functions so it can be unit tested in node.
\*/
(function(){
"use strict";

var NEXT = "<!-- prod:next -->";

function rep(s,n){ var r=""; while(n-- > 0) r+=s; return r; }
function norm(t){ return String(t==null?"":t).replace(/\r\n?/g,"\n"); }

/* ---------- inline code protection ---------- */
function protect(s,store){
	return s.replace(/`([^`\n]+)`/g,function(m){ store.push(m); return "\u0001"+(store.length-1)+"\u0002"; });
}
function restore(s,store){
	return s.replace(/\u0001(\d+)\u0002/g,function(m,i){ return store[+i]; });
}

/* ---------- wikitext -> markdown ---------- */
function inlineToMd(s){
	var store=[]; s=protect(s,store);
	s=s.replace(/\[img\[(?:([^\]|]*)\|)?([^\]]+)\]\]/g,function(m,alt,url){ return "!["+(alt||"")+"]("+url+")"; });
	s=s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g,function(m,text,target){
		return /^(?:[a-z][a-z0-9+.-]*:\/\/|mailto:|#|\/)/i.test(target) ? "["+text+"]("+target+")" : "[["+target+"|"+text+"]]";
	});
	s=s.replace(/\{\{([^{}|]+)\}\}/g,"![[$1]]");
	s=s.replace(/''(.+?)''/g,"**$1**");
	s=s.replace(/(^|[\s(>])\/\/(.+?)\/\/(?=[\s).,;:!?<]|$)/g,"$1*$2*");
	s=s.replace(/__(.+?)__/g,"<u>$1</u>");
	s=s.replace(/\^\^(.+?)\^\^/g,"<sup>$1</sup>").replace(/,,(.+?),,/g,"<sub>$1</sub>");
	s=s.replace(/@@(?:[^@\n]*?:[^@\n]*?;)?(.*?)@@/g,"$1");
	return restore(s,store);
}
function splitRow(l){
	l=l.replace(/^\|/,"").replace(/\|[a-z]?\s*$/,"");
	return l.split("|");
}
function wikiToMd(text){
	var lines=norm(text).split("\n"), out=[], inCode=false, i, l, m;
	for(i=0;i<lines.length;i++){
		l=lines[i];
		if(/^```/.test(l)){ inCode=!inCode; out.push(l); continue; }
		if(inCode){ out.push(l); continue; }
		if(/^<<<\s*$/.test(l)){
			i++;
			while(i<lines.length && !/^<<<(\s.*)?$/.test(lines[i])){ out.push("> "+inlineToMd(lines[i])); i++; }
			continue;
		}
		if(/^\|.*\|[a-z]?\s*$/.test(l)){
			var rows=[], hdr=false;
			while(i<lines.length && /^\|.*\|[a-z]?\s*$/.test(lines[i])){
				if(/\|h\s*$/.test(lines[i]) || /^\|!/.test(lines[i])) hdr=true;
				if(!/\|c\s*$/.test(lines[i])) rows.push(splitRow(lines[i]).map(function(c){ return inlineToMd(c.replace(/^!/,"").trim()); }));
				i++;
			}
			i--;
			var n=rows[0].length;
			out.push("| "+rows[0].join(" | ")+" |");
			out.push("| "+rep("--- | ",n).trim());
			rows.slice(1).forEach(function(r){ out.push("| "+r.join(" | ")+" |"); });
			continue;
		}
		if((m=/^(!{1,6})\s*(.*)$/.exec(l))){ out.push(rep("#",m[1].length)+" "+inlineToMd(m[2])); continue; }
		if((m=/^([*#]+)\s+(.*)$/.exec(l))){
			var d=m[1].length, ord=m[1].charAt(d-1)==="#";
			out.push(rep("  ",d-1)+(ord?"1. ":"- ")+inlineToMd(m[2])); continue;
		}
		if(/^---+\s*$/.test(l)){ out.push("---"); continue; }
		if((m=/^(>+\s?)(.*)$/.exec(l))){ out.push(m[1]+inlineToMd(m[2])); continue; }
		out.push(inlineToMd(l));
	}
	return out.join("\n");
}

/* ---------- markdown -> wikitext ---------- */
function inlineToWiki(s){
	var store=[]; s=protect(s,store);
	s=s.replace(/<(https?:\/\/[^>\s]+)>/g,"$1");
	s=s.replace(/!\[\[([^\]]+)\]\]/g,"{{$1}}");
	s=s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,function(m,alt,url){ return "[img["+(alt?alt+"|":"")+url+"]]"; });
	s=s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g,function(m,target,alias){
		return /^(?:[a-z][a-z0-9+.-]*:\/\/|mailto:|#|\/)/i.test(target) ? m : "[["+alias+"|"+target+"]]";
	});
	s=s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,function(m,text,url){ return "[["+text+"|"+url+"]]"; });
	s=s.replace(/\*\*(.+?)\*\*/g,"''$1''").replace(/(^|[^\w])__(.+?)__(?=[^\w]|$)/g,"$1''$2''");
	s=s.replace(/(^|[^\w*])\*(?!\s)(.+?)\*(?=[^\w*]|$)/g,"$1//$2//").replace(/(^|[^\w])_(?!\s)(.+?)_(?=[^\w]|$)/g,"$1//$2//");
	s=s.replace(/<u>(.*?)<\/u>/g,"__$1__").replace(/<sup>(.*?)<\/sup>/g,"^^$1^^").replace(/<sub>(.*?)<\/sub>/g,",,$1,,");
	return restore(s,store);
}
var SEP=/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;
function mdRow(l){ return l.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(function(c){ return c.trim(); }); }
function mdToWiki(md){
	var lines=norm(md).split("\n"), out=[], inCode=false, stack=[], after=false, i, l, m;
	function blank(){ return !out.length || out[out.length-1].trim()===""; }
	function start(){ if(!blank()) out.push(""); }
	function isList(x){ return /^[*#]+ /.test(x); }
	function flow(){ if(after && !blank()) out.push(""); after=false; }
	for(i=0;i<lines.length;i++){
		l=lines[i];
		if(/^\s*```/.test(l)){
			if(!inCode){ start(); out.push(l.trim()); inCode=true; }
			else { out.push("```"); inCode=false; after=true; }
			stack=[]; continue;
		}
		if(inCode){ out.push(l); continue; }
		if(l.trim()===""){ out.push(""); after=false; continue; }
		if(l.indexOf("|")>=0 && i+1<lines.length && SEP.test(lines[i+1]) && /\|/.test(lines[i+1])){
			start(); flow();
			out.push("|"+mdRow(l).map(function(c){ return "!"+inlineToWiki(c); }).join("|")+"|h");
			i+=2;
			while(i<lines.length && lines[i].indexOf("|")>=0 && lines[i].trim()!==""){
				out.push("|"+mdRow(lines[i]).map(inlineToWiki).join("|")+"|"); i++;
			}
			i--; stack=[]; after=true; continue;
		}
		if((m=/^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(l)) && !/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)){
			var ind=m[1].replace(/\t/g,"    ").length, ch=/\d/.test(m[2])?"#":"*";
			if(!isList(out[out.length-1]||"")) start();
			flow();
			while(stack.length && stack[stack.length-1].ind>ind) stack.pop();
			if(stack.length && stack[stack.length-1].ind===ind) stack[stack.length-1].ch=ch; else stack.push({ind:ind,ch:ch});
			out.push(stack.map(function(x){ return x.ch; }).join("")+" "+inlineToWiki(m[3])); continue;
		}
		var wasList=isList(out[out.length-1]||"");
		if(l.trim()!=="") stack=[];
		if((m=/^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(l))){ start(); out.push(rep("!",m[1].length)+" "+inlineToWiki(m[2])); after=false; continue; }
		if(/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)){ start(); out.push("---"); continue; }
		if(/^>/.test(l)){ if(!/^>/.test(out[out.length-1]||"")) start(); out.push(inlineToWiki(l)); continue; }
		if(wasList) out.push("");
		flow();
		out.push(inlineToWiki(l.replace(/^\s+/,"")));
	}
	return out.join("\n");
}

/* ---------- front matter ---------- */
function scalar(v){
	v=v.trim();
	if(/^".*"$/.test(v)){ try{ return JSON.parse(v); }catch(e){ return v.slice(1,-1); } }
	if(/^'.*'$/.test(v)) return v.slice(1,-1).replace(/''/g,"'");
	return v;
}
function parseFrontMatter(text){
	text=norm(text);
	var m=/^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/.exec(text);
	if(!m) return {meta:{},body:text,hasFM:false};
	var meta={}, key=null;
	m[1].split("\n").forEach(function(line){
		var kv=/^([A-Za-z0-9_.-]+):\s*(.*)$/.exec(line), li=/^\s+-\s+(.*)$/.exec(line);
		if(kv){
			key=kv[1].toLowerCase(); var v=kv[2];
			if(/^\[.*\]$/.test(v.trim())){ meta[key]=v.trim().slice(1,-1).split(",").map(scalar).filter(function(x){return x!=="";}); }
			else if(v.trim()===""){ meta[key]=[]; }
			else meta[key]=scalar(v);
		} else if(li && key){
			if(!Array.isArray(meta[key])) meta[key]=[];
			meta[key].push(scalar(li[1]));
		}
	});
	return {meta:meta,body:text.slice(m[0].length),hasFM:true};
}
function yamlVal(v){
	v=String(v);
	return (v==="" || /^[\s\-?:,\[\]{}#&*!|>'"%@`]|[:#]\s|\s$|\n/.test(v) || /:$/.test(v)) ? JSON.stringify(v) : v;
}
function renderFrontMatter(meta,order){
	var keys=(order||[]).filter(function(k){ return meta[k]!=null && meta[k]!=="" && !(Array.isArray(meta[k])&&!meta[k].length); });
	var lines=["---"];
	keys.forEach(function(k){
		var v=meta[k];
		lines.push(k+": "+(Array.isArray(v)?"["+v.map(yamlVal).join(", ")+"]":yamlVal(v)));
	});
	lines.push("---");
	return lines.join("\n");
}

/* ---------- documents ---------- */
var FM_ORDER=["title","type","project","status","priority","due","repeat","focus","pinned","completed","color","created","tags"];
var ISO=/^\d{4}-\d{2}-\d{2}$/;

function renderDoc(d){
	var meta={title:d.title,type:d.kind,tags:d.tags||[]};
	Object.keys(d.fields||{}).forEach(function(k){ meta[k]=d.fields[k]; });
	var body=wikiToMd(d.body||"").replace(/^\n+|\s+$/g,"");
	return renderFrontMatter(meta,FM_ORDER)+"\n\n# "+d.title+"\n"+(body?"\n"+body+"\n":"");
}
function splitBundle(text){
	return norm(text).split(/\n*<!--\s*prod:next\s*-->\n*/).filter(function(x){ return x.trim()!==""; });
}
function bundle(docs){ return docs.join("\n"+NEXT+"\n\n"); }

var CHECK=/^\s*[-*+]\s+\[([ xX])\]\s+(.*)$/;
function extractChecklist(md){
	var tasks=[], keep=[], inCode=false;
	norm(md).split("\n").forEach(function(l){
		if(/^\s*```/.test(l)) inCode=!inCode;
		var m=!inCode && CHECK.exec(l);
		if(!m){ keep.push(l); return; }
		var t=m[2], due="";
		t=t.replace(/(?:📅|\bdue:?)\s*(\d{4}-\d{2}-\d{2})/i,function(x,d){ due=d; return ""; })
		   .replace(/\s*\(\s*\)\s*/g," ").replace(/\s{2,}/g," ").trim();
		if(t) tasks.push({title:t,done:m[1]!==" ",due:due});
	});
	return {tasks:tasks,body:keep.join("\n")};
}

/* parse one markdown document -> normalized doc description (body already converted to wikitext) */
function parseDoc(text,filename,opts){
	opts=opts||{};
	var fm=parseFrontMatter(text), meta=fm.meta, md=fm.body.replace(/^\n+/,""), title=meta.title;
	var h1=/^#\s+(.+?)\s*#*\s*(?:\n|$)/.exec(md);
	if(h1 && (!title || h1[1].trim()===title)){ title=title||h1[1].trim(); md=md.slice(h1[0].length).replace(/^\n+/,""); }
	if(!title && filename) title=filename.replace(/^.*[\\\/]/,"").replace(/\.(md|markdown|txt)$/i,"");
	var tasks=[];
	if(opts.checklist){ var ex=extractChecklist(md); tasks=ex.tasks; md=ex.body; }
	var kind=String(meta.type||"").toLowerCase();
	if(kind!=="task" && kind!=="note" && kind!=="project"){
		kind=(meta.due||meta.status||meta.priority||meta.repeat)?"task":"note";
	}
	var tags=Array.isArray(meta.tags)?meta.tags:(meta.tags?String(meta.tags).split(/[,\s]+/):[]);
	var fields={};
	["project","status","priority","due","repeat","focus","pinned","completed","color","created"].forEach(function(k){
		if(meta[k]!=null && meta[k]!=="") fields[k]=String(meta[k]);
	});
	if(fields.due && !ISO.test(fields.due)) delete fields.due;
	if(fields.completed && !ISO.test(fields.completed)) delete fields.completed;
	if(fields.created && !ISO.test(fields.created)) delete fields.created;
	if(fields.priority && !/^[123]$/.test(fields.priority)){
		var pm={high:"1",urgent:"1",medium:"2",normal:"2",low:"3"}[fields.priority.toLowerCase()];
		if(pm) fields.priority=pm; else delete fields.priority;
	}
	if(fields.status){
		fields.status=fields.status.toLowerCase().replace(/[\s_]+/g,"-");
		var sm={"to-do":"todo","in-progress":"doing",progress:"doing",wait:"waiting",blocked:"waiting",complete:"done",completed:"done",closed:"done",open:"todo"};
		if(sm[fields.status]) fields.status=sm[fields.status];
		if(["todo","doing","waiting","done","active","on-hold","archived"].indexOf(fields.status)<0) delete fields.status;
	}
	return {kind:kind,title:(title||"").trim(),tags:tags,fields:fields,body:mdToWiki(md).replace(/\s+$/,""),tasks:tasks};
}

var api={
	wikiToMd:wikiToMd, mdToWiki:mdToWiki, parseFrontMatter:parseFrontMatter, renderFrontMatter:renderFrontMatter,
	renderDoc:renderDoc, parseDoc:parseDoc, splitBundle:splitBundle, bundle:bundle, extractChecklist:extractChecklist, NEXT:NEXT
};
if(typeof exports!=="undefined") for(var k in api) exports[k]=api[k];
})();
