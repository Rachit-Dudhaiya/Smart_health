const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let files = [];
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            if (f !== '.git' && f !== 'node_modules') {
                files = files.concat(walkDir(dirPath));
            }
        } else if (f.endsWith('.html')) {
            files.push(dirPath);
        }
    });
    return files;
}

const htmlFiles = walkDir(__dirname);
const newVersion = Date.now();

htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content.replace(/styles\.css\?v=\d+/g, `styles.css?v=${newVersion}`);
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`Updated ${file}`);
    }
});
console.log('Done.');
