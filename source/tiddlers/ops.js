/*\
title: $:/prod/ops.js
type: application/javascript
module-type: filteroperator

Date helpers for the Productivity Hub. Dates are stored as ISO YYYY-MM-DD strings.
\*/
(function(){
"use strict";
function pad(n){ return (n<10?"0":"")+n; }
function iso(d){ return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
function parse(s){
	var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s||"").trim());
	if(!m) return null;
	var d=new Date(+m[1],+m[2]-1,+m[3]);
	return isNaN(d) ? null : d;
}
function num(d){ return Math.round(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5); }
function today(){ return new Date(); }
function addDays(d,n){ return new Date(d.getFullYear(),d.getMonth(),d.getDate()+n); }
function addMonths(d,n){
	var y=d.getFullYear(), m=d.getMonth()+n, last=new Date(y,m+1,0).getDate();
	return new Date(y,m,Math.min(d.getDate(),last));
}
function op(o,i){ var x=o.operands&&o.operands[i]; if(x==null) x=(i===0?o.operand:""); return typeof x==="object"?x.text:String(x==null?"":x); }
function each(source,fn){ var out=[]; source(function(t,title){ var r=fn(t,title); if(r!==undefined&&r!==null&&r!=="") out.push(r); }); return out; }

exports.today=function(){ return [iso(today())]; };
exports.daysto=function(source){
	var t=num(today());
	return each(source,function(x,title){ var d=parse(title); return d?String(num(d)-t):undefined; });
};
exports.daysin=function(source,operator){
	var f=operator.suffix||"due", lo=op(operator,0), hi=op(operator,1), neg=operator.prefix==="!", t=num(today());
	lo=lo===""?-Infinity:parseInt(lo,10); hi=hi===""?Infinity:parseInt(hi,10);
	var out=[];
	source(function(tid,title){
		var d=tid&&parse(tid.fields[f]), ok=false;
		if(d){ var n=num(d)-t; ok=n>=lo&&n<=hi; }
		if(ok!==neg) out.push(title);
	});
	return out;
};
exports.isoadd=function(source,operator){
	var m=/^([+-]?\d+)([dwm]?)$/.exec(op(operator,0).trim());
	return each(source,function(x,title){
		var d=parse(title); if(!d||!m) return undefined;
		var n=parseInt(m[1],10), u=m[2]||"d";
		return iso(u==="m"?addMonths(d,n):addDays(d,u==="w"?n*7:n));
	});
};
exports.isonext=function(source,operator){
	var r=op(operator,0).trim().toLowerCase(), t=num(today());
	function step(d){
		switch(r){
			case "daily": return addDays(d,1);
			case "weekdays": d=addDays(d,1); while(d.getDay()===0||d.getDay()===6) d=addDays(d,1); return d;
			case "weekly": return addDays(d,7);
			case "biweekly": return addDays(d,14);
			case "monthly": return addMonths(d,1);
			case "yearly": return addMonths(d,12);
		}
		return null;
	}
	return each(source,function(x,title){
		var d=parse(title), n=step(d||new Date()); if(!d||!n) return undefined;
		var guard=0; while(num(n)<t && guard++<4000) n=step(n);
		return iso(n);
	});
};
exports.isotw=function(source){
	return each(source,function(x,title){ var d=parse(title); return d?title.replace(/-/g,"")+"000000000":undefined; });
};
function weekStart(wiki){ var v=parseInt(wiki.getTiddlerText("$:/config/prod/weekstart","1"),10); return isNaN(v)?1:v; }
exports.calfirst=function(source,operator){
	var off=parseInt(op(operator,0)||"0",10)||0, t=today();
	return [iso(new Date(t.getFullYear(),t.getMonth()+off,1))];
};
exports.calgrid=function(source,operator,options){
	var off=parseInt(op(operator,0)||"0",10)||0, t=today();
	var first=new Date(t.getFullYear(),t.getMonth()+off,1), ws=weekStart(options.wiki);
	var back=(first.getDay()-ws+7)%7, start=addDays(first,-back), out=[], i;
	for(i=0;i<42;i++) out.push(iso(addDays(start,i)));
	return out;
};
})();
