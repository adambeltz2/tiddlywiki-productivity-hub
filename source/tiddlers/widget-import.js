/*\
title: $:/prod/widget-import.js
type: application/javascript
module-type: widget

<$prod-import/> renders a drop zone / file picker that imports .md files.
\*/
(function(){
"use strict";
var Widget=require("$:/core/modules/widgets/widget.js").widget;
var W=function(parseTreeNode,options){ this.initialise(parseTreeNode,options); };
W.prototype=new Widget();
W.prototype.render=function(parent,next){
	this.parentDomNode=parent; this.computeAttributes(); this.execute();
	var box=this.document.createElement("label"), self=this;
	box.className="prod-drop";
	box.innerHTML="<strong>Drop .md files here</strong><span>or click to choose (multiple files and exported bundles work)</span>";
	var input=this.document.createElement("input");
	input.type="file"; input.multiple=true; input.accept=".md,.markdown,.txt,text/markdown,text/plain";
	box.appendChild(input);
	function handle(list){
		var files=Array.prototype.slice.call(list), out=[], left=files.length;
		if(!left) return;
		files.forEach(function(f,i){
			var r=new FileReader();
			r.onload=function(){ out[i]={name:f.name,text:String(r.result)}; if(--left===0) require("$:/prod/io.js").importFiles(out); };
			r.onerror=function(){ out[i]={name:f.name,text:""}; if(--left===0) require("$:/prod/io.js").importFiles(out); };
			r.readAsText(f);
		});
	}
	input.addEventListener("change",function(){ handle(input.files); input.value=""; });
	box.addEventListener("dragover",function(e){ e.preventDefault(); box.classList.add("is-over"); });
	box.addEventListener("dragleave",function(){ box.classList.remove("is-over"); });
	box.addEventListener("drop",function(e){ e.preventDefault(); box.classList.remove("is-over"); if(e.dataTransfer) handle(e.dataTransfer.files); });
	parent.insertBefore(box,next); this.domNodes.push(box);
};
W.prototype.refresh=function(){ return false; };
exports["prod-import"]=W;
})();
