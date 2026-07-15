const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'pricing', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

for (let i = 330; i <= 360; i++) {
  const line = lines[i];
  if (line !== undefined) {
    console.log(`Line ${i + 1}: ${JSON.stringify(line)}`);
  }
}
