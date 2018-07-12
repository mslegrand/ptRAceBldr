ace.define("ace/snippets/ptr",["require","exports","module"],function(e,t,n){"use strict";t.snippetText="snippet #!\n	#!/usr/bin/env Rscript\n\n# includes\nsnippet lib\n	library(${1:package})\nsnippet req\n	require(${1:package})\nsnippet source\n	source('${1:file}')\n\n# conditionals\nsnippet if\n	if (${1:condition}) {\n		${2:code}\n	}\nsnippet el\n	else {\n		${1:code}\n	}\nsnippet ei\n	else if (${1:condition}) {\n		${2:code}\n	}\n\n# basicShapes\nsnippet cir\n	circle(\n		cxy=${1:center},\n		r=${2:radius},\n		fill=${3:fill}\n	)\nsnippet ell\n	ellipse(\n		cxy=${1:center},\n		rxy=${2:radii},\n		fill=${3:fill}\n	)\nsnippet rect\n	rect(\n		xy=${1:upper_left},\n		wh=${2:width_height},\n		fill=${3:fill}\n	)\n\n# functions\nsnippet fun\n	${1:name} = function (${2:variables}) {\n		${3:code}\n	}\nsnippet ret\n	return(${1:code})\n\n# dataframes, lists, etc\nsnippet df\n	${1:name}[${2:rows}, ${3:cols}]\nsnippet c\n	c(${1:items})\nsnippet li\n	list(${1:items})\nsnippet mat\n	matrix(${1:data}, nrow=${2:rows}, ncol=${3:cols})\n\n# apply functions\nsnippet apply\n	apply(${1:array}, ${2:margin}, ${3:function})\nsnippet lapply\n	lapply(${1:list}, ${2:function})\nsnippet sapply\n	lapply(${1:list}, ${2:function})\nsnippet vapply\n	vapply(${1:list}, ${2:function}, ${3:type})\nsnippet mapply\n	mapply(${1:function}, ${2:...})\nsnippet tapply\n	tapply(${1:vector}, ${2:index}, ${3:function})\nsnippet rapply\n	rapply(${1:list}, ${2:function})\n\n# plyr functions\nsnippet dd\n	ddply(${1:frame}, ${2:variables}, ${3:function})\nsnippet dl\n	dlply(${1:frame}, ${2:variables}, ${3:function})\nsnippet da\n	daply(${1:frame}, ${2:variables}, ${3:function})\nsnippet d_\n	d_ply(${1:frame}, ${2:variables}, ${3:function})\n\nsnippet ad\n	adply(${1:array}, ${2:margin}, ${3:function})\nsnippet al\n	alply(${1:array}, ${2:margin}, ${3:function})\nsnippet aa\n	aaply(${1:array}, ${2:margin}, ${3:function})\nsnippet a_\n	a_ply(${1:array}, ${2:margin}, ${3:function})\n\nsnippet ld\n	ldply(${1:list}, ${2:function})\nsnippet ll\n	llply(${1:list}, ${2:function})\nsnippet la\n	laply(${1:list}, ${2:function})\nsnippet l_\n	l_ply(${1:list}, ${2:function})\n\nsnippet md\n	mdply(${1:matrix}, ${2:function})\nsnippet ml\n	mlply(${1:matrix}, ${2:function})\nsnippet ma\n	maply(${1:matrix}, ${2:function})\nsnippet m_\n	m_ply(${1:matrix}, ${2:function})\n\n",t.scope="ptr"})