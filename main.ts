// news-image-20261119 entry (Node 22, standard library only): the front page is
// the entry.png beside this file, and the program copies it to /output/entry.png.
// After copying, it reads the output back and verifies the PNG signature, the
// IHDR chunk, the dimensions (1024x1024) and the size (<=1 MiB), then prints a
// confirmation line with the output sha256. No network; both runs write the
// same bytes.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const outPath = join(outDir, 'entry.png');
copyFileSync(new URL('./entry.png', import.meta.url), outPath);

const buf = readFileSync(outPath);
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error('output is not a PNG');
if (buf.length < 33 || buf.toString('ascii', 12, 16) !== 'IHDR') throw new Error('output has no IHDR chunk');
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);
if (width !== 1024 || height !== 1024) throw new Error(`unexpected dimensions ${width}x${height}, expected 1024x1024`);
const size = statSync(outPath).size;
if (size > 1024 * 1024) throw new Error(`output ${size} bytes exceeds 1 MiB`);
const sha256 = createHash('sha256').update(buf).digest('hex');
// The output must be byte-identical to the source image: compare against the
// entry.png beside this file, so a partial or stale copy cannot slip through.
const srcBuf = readFileSync(new URL('./entry.png', import.meta.url));
const srcSha256 = createHash('sha256').update(srcBuf).digest('hex');
if (sha256 !== srcSha256) throw new Error(`output sha256 ${sha256} does not match source ${srcSha256}`);
console.log(`verified ${outPath}: PNG ${width}x${height}, ${size} bytes, sha256 ${sha256}`);
