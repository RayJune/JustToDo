!function(){var n=Handlebars.template;(Handlebars.templates=Handlebars.templates||{}).li=n({1:function(n,l,a,e,t){var s;return'  <li class="aphorism">'+n.escapeExpression((s=null!=(s=a.sentence||(null!=l?l.sentence:l))?s:a.helperMissing,"function"==typeof s?s.call(null!=l?l:n.nullContext||{},{name:"sentence",hash:{},data:t}):s))+"</li>\n"},3:function(n,l,a,e,t){var s;return null!=(s=a.each.call(null!=l?l:n.nullContext||{},null!=l?l.listItems:l,{name:"each",hash:{},fn:n.program(4,t,0),inverse:n.noop,data:t}))?s:""},4:function(n,l,a,e,t){var s;return null!=(s=a.if.call(null!=l?l:n.nullContext||{},null!=l?l.finished:l,{name:"if",hash:{},fn:n.program(5,t,0),inverse:n.program(7,t,0),data:t}))?s:""},5:function(n,l,a,e,t){var s,i=null!=l?l:n.nullContext||{},u=a.helperMissing,r=n.escapeExpression;return'      <li class="finished" data-id='+r((s=null!=(s=a.id||(null!=l?l.id:l))?s:u,"function"==typeof s?s.call(i,{name:"id",hash:{},data:t}):s))+">\n        "+r((s=null!=(s=a.date||(null!=l?l.date:l))?s:u,"function"==typeof s?s.call(i,{name:"date",hash:{},data:t}):s))+" : \n        <span>"+r((s=null!=(s=a.event||(null!=l?l.event:l))?s:u,"function"==typeof s?s.call(i,{name:"event",hash:{},data:t}):s))+'</span>\n        <span class="close">×</span>\n      </li>\n'},7:function(n,l,a,e,t){var s,i=null!=l?l:n.nullContext||{},u=a.helperMissing,r=n.escapeExpression;return"      <li data-id="+r((s=null!=(s=a.id||(null!=l?l.id:l))?s:u,"function"==typeof s?s.call(i,{name:"id",hash:{},data:t}):s))+">\n        "+r((s=null!=(s=a.date||(null!=l?l.date:l))?s:u,"function"==typeof s?s.call(i,{name:"date",hash:{},data:t}):s))+" : \n        <span>"+r((s=null!=(s=a.event||(null!=l?l.event:l))?s:u,"function"==typeof s?s.call(i,{name:"event",hash:{},data:t}):s))+'</span>\n        <span class="close">×</span>\n      </li>\n'},compiler:[7,">= 4.0.0"],main:function(n,l,a,e,t){var s;return null!=(s=a.if.call(null!=l?l:n.nullContext||{},null!=l?l.sentence:l,{name:"if",hash:{},fn:n.program(1,t,0),inverse:n.program(3,t,0),data:t}))?s:""},useData:!0})}();