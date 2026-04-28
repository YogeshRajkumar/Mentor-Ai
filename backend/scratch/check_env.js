import fs from 'fs';
const content = fs.readFileSync('.env', 'utf8');
for (let i = 0; i < content.length; i++) {
  console.log(`${content[i]} : ${content.charCodeAt(i)}`);
}
