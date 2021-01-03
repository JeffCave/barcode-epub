#!/bin/bash

book="thoreau.LifeWoods";

rm -rf encoded/*;
mkdir -p encoded;
cp "./www/book/${book}.epub" "./encoded";
pushd encoded;
    mkdir "${book}";
    unzip -d "${book}" "${book}.epub";
    rm "${book}.epub";
    zip -r9 pkg.zip "${book}/*";
    cat pkg.zip |
        sha512sum -b |
        cut -d ' ' -f 1 |
        xxd -r -p > pkg.sha
    zip -s 64k -O bundle.zip pkg.zip;
    ls bundle.z* |
        xargs -p 2 -I {} bwip-js datamatrix "$(cat {})" {}.png;
    ls -I "*.png" | xargs -r -I {} rm -rf {} ;
popd;
