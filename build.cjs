const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    if (element === 'node_modules' || element === '.git' || element === 'dist') return;
    const srcPath = path.join(from, element);
    const destPath = path.join(to, element);
    const stat = fs.lstatSync(srcPath);
    if (stat.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    } else if (stat.isDirectory()) {
      copyFolderSync(srcPath, destPath);
    }
  });
}

// 1. Ensure dist folder exists
if (!fs.existsSync('dist')) fs.mkdirSync('dist', { recursive: true });

// 2. Copy index.html
if (fs.existsSync('index.html')) fs.copyFileSync('index.html', 'dist/index.html');

// 3. Copy manifest.json and sw.js
if (fs.existsSync('manifest.json')) fs.copyFileSync('manifest.json', 'dist/manifest.json');
if (fs.existsSync('sw.js')) fs.copyFileSync('sw.js', 'dist/sw.js');

// 4. Copy assets & public folders
if (fs.existsSync('assets')) copyFolderSync('assets', 'dist/assets');
if (fs.existsSync('public')) copyFolderSync('public', 'dist/public');
if (fs.existsSync('public/assets')) copyFolderSync('public/assets', 'dist/assets');

console.log('Static PWA dist build generated successfully!');
