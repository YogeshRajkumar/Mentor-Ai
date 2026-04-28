import fs from 'fs';
const content = fs.readFileSync('controllers/aiController.js', 'utf8');
const lines = content.split('\n');
const line203 = lines[202]; // 0-indexed
console.log(line203);
for (let i = 0; i < line203.length; i++) {
  console.log(`${line203[i]} : ${line203.charCodeAt(i)}`);
}
