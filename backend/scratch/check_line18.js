import fs from 'fs';
const content = fs.readFileSync('controllers/aiController.js', 'utf8');
const lines = content.split('\n');
const line18 = lines[17]; // 0-indexed
console.log(line18);
for (let i = 0; i < line18.length; i++) {
  console.log(`${line18[i]} : ${line18.charCodeAt(i)}`);
}
