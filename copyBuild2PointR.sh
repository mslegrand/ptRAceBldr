#!/bin/bash

sourceDir="./TrestleTech/ace-1.3.0/build/src-min-noconflict/"
targetDir="../ptR-ace31/pointR/inst/App/www/Acejs/"

mode1="mode-ptr.js"
mode2="mode-ptrrmd.js"
worker1="worker-ptr.js"
snippet1="snippets/ptr.js"
snippet2="snippets/ptrrmd.js"

cp $sourceDir$mode1 $targetDir$mode1
cp $sourceDir$worker1 $targetDir$worker1
cp $sourceDir$snippet1 $targetDir$snippet1
cp $sourceDir$mode2 $targetDir$mode2
cp $sourceDir$snippet2 $targetDir$snippet2

echo "done"