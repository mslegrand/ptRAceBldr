
# Highlighters, SyntaxValidators, Code Completors for pointR


This is a rather specialized collection of files and scripts that together
are used to create 

- mode-ptr.js
- worker-ptr.js

After creations, they are copied to pointR/inst/App/www/Acejs for use
by the pointR application.


Included here is 

- the version of shinyAce used by TrestleTech
- the source for 
        - ptr.js
        - ptr_completions.js
        - ptr_hightlight_rules.js
        - ptr_worker.js
        - ptrparse.js
        - mode-ptr.js
        - worker-ptr.js
        - ptR.peg
        - parseTail.js    
- scripts to build the above.

ptR.peg source for pegjs: Used for creating parser to check syntax for the ACE editor

This is a rather specialized collection of scripts, designed solely to create a parser
to be called by a worker for the ptr-mode in the ACE editor. The steps involved here
are

## The set up

Below this directory should be the 
- *./TrestleTech/ace*  
    - the  current version of ace used by the TrestleTech package 
- *./TrestleTech/ace/lib/ace/mode/ptr.js*
- *./TrestleTech/ace/lib/ace/mode/ptr_completions.js*
- *./TrestleTech/ace/lib/ace/mode/ptr_highlight_rules.js*
- *./TrestleTech/ace/lib/ace/mode/behaviour/ptrstyle.js*
- *./TrestleTech/ace/lib/ace/mode/folding/ptrstyle.js*
- *./TrestleTech/ace/lib/ace/mode/ptr_worker.js*
- *./TrestleTech/ace/lib/ace/mode/ptr/ptrparse.js* 
    - The output of pegjs and merging with parseTail.js
- *./TrestleTech/ace/lib/ace/snippets/ptr.js*
- *./TrestleTech/ace/lib/ace/snippets/ptr.snippets*
A copy of the above files are kept in the mode and snippets directories for reference

These file can be copied to the target as follows:

- cp -r  ./mode/* ./TrestleTech/ace/lib/ace/mode/
- cp -r  ./snippets/* ./TrestleTech/ace/lib/ace/snippets/


## The Process (Revised)

0. May want to backup ptR.peg, ptrparse.js, parseTail.js just in case
1. Make appropriate changes to
    + ptR.peg
        + may need to use buildSvgrParseList to accomplish this
    + parseTail.js (optional)
2. Compile 
```
    pegjs -o ptrparse.js ptR.peg
```
3. Merge parseTail.js into ptrparse.js and place results in TrestleTech/Ace
```
./makePtrParse.r
```
4. CompileAce
```
./compileAce.sh
```
5. Copy build to pointR project
```
./copyBuild2PointR.sh
```
