#!/bin/bash
# $ bash build.sh containerdir googleanalyticsacc

SRCDIR="$( cd "$( dirname "$0" )" && pwd )"
OUTDIR="$1/morphine"
OUTZIP="$OUTDIR.zip"
GA=$2

rm -rf $OUTDIR $OUTZIP
cp -R $SRCDIR $OUTDIR
cd $OUTDIR

rm build.sh
rm -rf .git

sed -i '' -e "s/##GA##/$GA/" js/background.js

find . -path '*/.*' -prune -o -type f -print | zip $OUTZIP -@