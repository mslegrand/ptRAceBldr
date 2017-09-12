#!/bin/bash

sourceDir="./TrestleTech/ace/build/src-min-noconflict/"
targetDir="../pointR/inst/App/www/Acejs/"
mode="mode-ptr.js"
worker="worker-ptr.js"
snippet="snippets/ptr.js"


cp $sourceDir$mode $targetDir$mode
cp $sourceDir$worker $targetDir$worker
cp $sourceDir$snippet $targetDir$snippet

echo "done"