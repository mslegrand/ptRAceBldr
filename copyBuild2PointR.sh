#!/bin/bash

sourceDir="./TrestleTech/ace-1.3.0/build/src-min-noconflict/"
targetDir="../ptR-ioSlides/pointR/inst/App/www/Acejs/"

mode1="mode-ptr.js"
mode2="mode-ptrrmd.js"
mode3="mode-dnippets.js"
worker1="worker-ptr.js"
snippet1="snippets/ptr.js"
snippet2="snippets/ptrrmd.js"
snippet3="snippets/dnippets.js"

cp $sourceDir$mode1 $targetDir$mode1
cp $sourceDir$worker1 $targetDir$worker1
cp $sourceDir$snippet1 $targetDir$snippet1
cp $sourceDir$mode2 $targetDir$mode2
cp $sourceDir$snippet2 $targetDir$snippet2
cp $sourceDir$mode3 $targetDir$mode3
cp $sourceDir$snippet3 $targetDir$snippet3

echo "done"