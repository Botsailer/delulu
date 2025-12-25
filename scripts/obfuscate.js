// Obfuscation script for production build
// This obfuscates main process JS files to prevent reverse engineering

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import JavaScriptObfuscator from 'javascript-obfuscator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const buildDir = join(rootDir, 'build-temp');

// Files to obfuscate
const filesToObfuscate = [
  'main.js',
  'preload.js',
  'api-handler.js',
  'manga-handler.js'
];

// Obfuscation options - Electron-compatible (no selfDefending/debugProtection)
const obfuscatorOptions = {
  compact: true,
  controlFlowFlattening: false, // Disabled - can break async/await in Electron
  deadCodeInjection: false,
  debugProtection: false, // MUST be false for Electron!
  disableConsoleOutput: false, // Keep false to avoid issues
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: false,
  renameGlobals: false,
  selfDefending: false, // MUST be false for Electron!
  simplify: true,
  splitStrings: false,
  stringArray: true,
  stringArrayCallsTransform: false, // Can cause issues
  stringArrayEncoding: ['none'], // No encoding for speed
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 1,
  stringArrayWrappersChainedCalls: false,
  stringArrayWrappersType: 'variable',
  stringArrayThreshold: 0.75,
  transformObjectKeys: false,
  unicodeEscapeSequence: false,
  target: 'node' // Important for Electron main process
};

// Create build directory
if (!existsSync(buildDir)) {
  mkdirSync(buildDir, { recursive: true });
}

// Copy and create assets directory
const assetsDir = join(buildDir, 'assets');
if (!existsSync(assetsDir)) {
  mkdirSync(assetsDir, { recursive: true });
}

// Copy assets
const srcAssetsDir = join(rootDir, 'assets');
if (existsSync(srcAssetsDir)) {
  const copyDir = (src, dest) => {
    if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
    const entries = readdirSync(src);
    for (const entry of entries) {
      const srcPath = join(src, entry);
      const destPath = join(dest, entry);
      if (statSync(srcPath).isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        copyFileSync(srcPath, destPath);
      }
    }
  };
  copyDir(srcAssetsDir, assetsDir);
  console.log('✓ Copied assets');
}

// Obfuscate each file
console.log('\n🔐 Obfuscating JavaScript files...\n');

for (const file of filesToObfuscate) {
  const inputPath = join(rootDir, file);
  const outputPath = join(buildDir, file);
  
  if (!existsSync(inputPath)) {
    console.log(`⚠ Skipping ${file} (not found)`);
    continue;
  }
  
  try {
    const code = readFileSync(inputPath, 'utf8');
    
    // Obfuscate
    const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, obfuscatorOptions);
    
    // Write obfuscated file
    writeFileSync(outputPath, obfuscatedCode.getObfuscatedCode());
    
    const originalSize = (code.length / 1024).toFixed(2);
    const obfuscatedSize = (obfuscatedCode.getObfuscatedCode().length / 1024).toFixed(2);
    
    console.log(`✓ ${file}: ${originalSize}KB → ${obfuscatedSize}KB`);
  } catch (error) {
    console.error(`✗ Error obfuscating ${file}:`, error.message);
    process.exit(1);
  }
}

// Copy package.json (modified for production)
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));

// Remove dev dependencies, scripts, and build config from production package.json
delete packageJson.devDependencies;
delete packageJson.build; // Remove build config - it should only be in root package.json
packageJson.scripts = {
  start: 'electron .'
};

writeFileSync(join(buildDir, 'package.json'), JSON.stringify(packageJson, null, 2));
console.log('✓ Created production package.json');

// Copy renderer dist if it exists
const rendererDist = join(rootDir, 'renderer', 'dist');
const buildRendererDist = join(buildDir, 'renderer', 'dist');
if (existsSync(rendererDist)) {
  const copyDir = (src, dest) => {
    if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
    const entries = readdirSync(src);
    for (const entry of entries) {
      const srcPath = join(src, entry);
      const destPath = join(dest, entry);
      if (statSync(srcPath).isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        copyFileSync(srcPath, destPath);
      }
    }
  };
  copyDir(rendererDist, buildRendererDist);
  console.log('✓ Copied renderer dist');
}

console.log('\n✅ Obfuscation complete! Files in:', buildDir);
console.log('\n📦 Now run: npm run build:linux or npm run build:win');
