/*\
title: $:/prod/relink.js
type: application/javascript
module-type: startup

Own implementation of "update backlinks when a tiddler is renamed".
When a draft is saved under a new title, every wikitext reference to the old title
([[old]], [[text|old]], {{old}}, {{old!!field}}, <$link to="old">, tiddler="old")
is rewritten, as is the "project" field of tasks/notes.
Links inside code blocks and `inline code` are left alone.
\*/
(function(){
"use strict";
exports.name="prod-relink";
exports.platforms=["browser"];
exports.after=["startup"];
exports.synchronous=true;

function esc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"); }

function relinkText(text,oldT,newT){
	if(!text||text.indexOf(oldT)<0) return text;
	var safeLink=newT.indexOf("]")<0&&newT.indexOf("|")<0, o=esc(oldT);
	var qT=newT.replace(/"/g,"&quot;"), safeQ=newT.indexOf('"')<0;
	// split into protected (code) and plain segments
	var parts=text.split(/(```[\s\S]*?```|`[^`\n]+`|\$\$\$[\s\S]*?\$\$\$)/g);
	return parts.map(function(seg,i){
		if(i%2===1) return seg;
		if(safeLink){
			seg=seg.replace(new RegExp("\\[\\[("+"[^\\]|]*\\|)?"+o+"\\]\\]","g"),function(m,pre){ return "[["+(pre||"")+newT+"]]"; });
			seg=seg.replace(new RegExp("\\{\\{"+o+"(?=\\}\\}|!!|##|\\|\\|)","g"),"{{"+newT);
			seg=seg.replace(new RegExp("\\{\\{([^{}|]*\\|)"+o+"(?=\\}\\})","g"),function(m,pre){ return "{{"+pre+newT; });
			seg=seg.replace(new RegExp("(\\{\\{[^{}]*\\|\\|)"+o+"(?=\\}\\})","g"),function(m,pre){ return pre+newT; });
		}
		if(safeQ){
			seg=seg.replace(new RegExp("((?:\\bto|\\btiddler|\\btemplate)\\s*=\\s*\")"+o+"\"","g"),function(m,pre){ return pre+qT+'"'; });
		}
		return seg;
	}).join("");
}
exports.relinkText=relinkText;

exports.startup=function(){
	var wiki=$tw.wiki;
	$tw.hooks.addHook("th-saving-tiddler",function(newTiddler,draft){
		var oldT=draft&&draft.fields&&draft.fields["draft.of"], newT=newTiddler.fields.title;
		if(!oldT||oldT===newT||!wiki.tiddlerExists(oldT)) return newTiddler;
		var self=newTiddler.fields.text;
		wiki.each(function(t,title){
			if(title===oldT||title===newT||t.fields["draft.of"]) return;
			var f={}, changed=false, type=t.fields.type;
			if(!type||type==="text/vnd.tiddlywiki"){
				var nt=relinkText(t.fields.text,oldT,newT);
				if(nt!==t.fields.text){ f.text=nt; changed=true; }
			}
			if(t.fields.project===oldT){ f.project=newT; changed=true; }
			if(changed) wiki.addTiddler(new $tw.Tiddler(t,f));
		});
		var st=relinkText(self,oldT,newT);
		if(st!==self) newTiddler=new $tw.Tiddler(newTiddler,{text:st});
		return newTiddler;
	});
};
})();
