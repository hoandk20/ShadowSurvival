import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'dist', 'mobile-web');
const vendorDir = path.join(outDir, 'vendor');

async function removeDir(target) {
    await fs.rm(target, { recursive: true, force: true });
}

async function ensureDir(target) {
    await fs.mkdir(target, { recursive: true });
}

async function copyRecursive(source, target) {
    await fs.cp(source, target, { recursive: true, force: true });
}

async function writeMobileIndex() {
    const indexPath = path.join(rootDir, 'index.html');
    const outIndexPath = path.join(outDir, 'index.html');
    const raw = await fs.readFile(indexPath, 'utf8');
    const rewritten = raw.replace(
        '<script src="https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js"></script>',
        '<script src="./vendor/phaser.min.js"></script>'
    );
    await fs.writeFile(outIndexPath, rewritten, 'utf8');
}

async function copyPhaserBundle() {
    const source = path.join(rootDir, 'node_modules', 'phaser', 'dist', 'phaser.min.js');
    const target = path.join(vendorDir, 'phaser.min.js');
    await ensureDir(vendorDir);
    await fs.copyFile(source, target);
}

async function main() {
    await removeDir(outDir);
    await ensureDir(outDir);
    await copyRecursive(path.join(rootDir, 'assets'), path.join(outDir, 'assets'));
    await copyRecursive(path.join(rootDir, 'config'), path.join(outDir, 'config'));
    await copyRecursive(path.join(rootDir, 'entities'), path.join(outDir, 'entities'));
    await copyRecursive(path.join(rootDir, 'scenes'), path.join(outDir, 'scenes'));
    await copyRecursive(path.join(rootDir, 'systems'), path.join(outDir, 'systems'));
    await copyRecursive(path.join(rootDir, 'utils'), path.join(outDir, 'utils'));
    await fs.copyFile(path.join(rootDir, 'main.js'), path.join(outDir, 'main.js'));
    await writeMobileIndex();
    await copyPhaserBundle();
    console.log(`Built mobile web bundle in ${outDir}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
