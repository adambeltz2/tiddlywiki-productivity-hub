/*\
title: $:/prod/sync.js
type: application/javascript
module-type: startup

Keeps tasks and notes tagged with their project automatically.
 - the "project" field is the source of truth: setting/changing it adds/moves the project tag
 - adding a project tag by hand fills the project field; removing it clears the field
 - notes that link to a project ([[Project]]) are tagged with that project when saved
\*/
(function(){
"use strict";
exports.name="prod-sync";
exports.platforms=["browser"];
exports.after=["startup"];
exports.synchronous=true;
exports.startup=function(){
	var wiki=$tw.wiki, snap=Object.create(null);
	function tagsOf(t){ return (t.fields.tags||[]).slice(); }
	function isKind(t){ var g=t.fields.tags||[]; return g.indexOf("Task")>=0||g.indexOf("Note")>=0; }
	function isNote(t){ return (t.fields.tags||[]).indexOf("Note")>=0; }
	function isProject(title){ var t=wiki.getTiddler(title); return !!t&&(t.fields.tags||[]).indexOf("Project")>=0; }
	function take(title,project,tags,text){ snap[title]={project:project||"",tags:tags.slice(),text:text||""}; }
	wiki.each(function(t,title){ if(isKind(t)&&!t.fields["draft.of"]) take(title,t.fields.project,tagsOf(t),t.fields.text); });
	wiki.addEventListener("change",function(changes){
		Object.keys(changes).forEach(function(title){
			if(changes[title].deleted){ delete snap[title]; return; }
			var t=wiki.getTiddler(title);
			if(!t||t.fields["draft.of"]) return;
			if(!isKind(t)){ delete snap[title]; return; }
			var prev=snap[title], p=t.fields.project||"", tags=tagsOf(t), text=t.fields.text||"";
			if(prev){
				if(prev.project!==p){
					if(prev.project) tags=tags.filter(function(x){ return x!==prev.project; });
					if(p&&isProject(p)&&tags.indexOf(p)<0) tags.push(p);
				} else if(p&&isProject(p)&&tags.indexOf(p)<0){
					if(prev.tags.indexOf(p)>=0) p=""; else tags.push(p);
				}
			} else if(p&&isProject(p)&&tags.indexOf(p)<0) tags.push(p);
			if(p&&!isProject(p)&&tags.filter(isProject).length&&tags.indexOf(p)<0) p=tags.filter(isProject)[0];
			if(!p){ var pt=tags.filter(isProject)[0]; if(pt) p=pt; }
			if((!prev||prev.text!==text)&&isNote(t)){
				wiki.getTiddlerLinks(title).forEach(function(l){ if(isProject(l)&&tags.indexOf(l)<0) tags.push(l); });
				if(!p){ var pt2=tags.filter(isProject)[0]; if(pt2) p=pt2; }
			}
			take(title,p,tags,text);
			if(p!==(t.fields.project||"")||tags.join("\n")!==tagsOf(t).join("\n")){
				var f=$tw.utils.extend({},t.fields,{tags:tags});
				if(p) f.project=p; else delete f.project;
				wiki.addTiddler(new $tw.Tiddler(f));
			}
		});
	});
};
})();
