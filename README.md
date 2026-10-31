# Sakura no Uta — MAO English translation

[Website and installation instructions](https://mao-tls.github.io/sakura-no-uta/) · [Bilingual reader](https://mao-tls.github.io/sakura-no-uta/script/) · [Downloads](https://github.com/MAO-TLs/sakura-no-uta/releases) · [Report an issue](https://github.com/MAO-TLs/sakura-no-uta/issues)

English patch for the Japanese Re:Graphic 10th Anniversary edition, Ver1.0.0. A legally acquired copy is required. No base game is included.

## Repository

This repository owns the release website, bilingual reader, release assets and issue tracker. `public/` is deployed directly to GitHub Pages at the existing `/sakura-no-uta/` URL. Run `npm test` before publishing.

The reader contains 285 scripts and 65,164 passages. Tests check every script checksum, Japanese/English pair, search entry, English ruby exclusion, navigation, assets and shared typography. Editorial source material and private working notes are not included.

## Migration

On November 1, 2026, Sakura was separated from the MAO homepage repository. The first four commits import the original public snapshots for v1.0.0–v1.0.3; each commit identifies its source revision, and each release tag points to its matching snapshot. The following migration commit makes the site self-contained without changing the manuscript or patch binaries.

All four release ZIPs and checksum files are byte-identical to the original releases. The old homepage releases remain available to preserve existing download links and historical download counts; future releases belong here. When counting downloads, include those legacy assets as well as this repository.

## Credits

Project Lead: MAO  
Translator: GPT-6 Astra  
Special Thanks: gambs
