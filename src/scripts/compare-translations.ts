import fs from 'fs';
import path from 'path';

const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));
const pt = JSON.parse(fs.readFileSync('messages/pt.json', 'utf8'));

function getKeys(obj, prefix = '') {
  return Object.keys(obj).reduce((res, el) => {
    if (Array.isArray(obj[el])) {
      res.push(prefix + el);
    } else if (typeof obj[el] === 'object' && obj[el] !== null) {
      res.push(...getKeys(obj[el], prefix + el + '.'));
    } else {
      res.push(prefix + el);
    }
    return res;
  }, []);
}

const enKeys = getKeys(en);
const ptKeys = getKeys(pt);

const missingInPt = enKeys.filter(k => !ptKeys.includes(k));
const missingInEn = ptKeys.filter(k => !enKeys.includes(k));

console.log('Missing in PT:', missingInPt);
console.log('Missing in EN:', missingInEn);

// Check if any PT values are still in English (heuristic: contains common English words)
const englishWords = ['the', 'and', 'with', 'for', 'your', 'build', 'infrastructure', 'ready'];
const ptValuesInEnglish = [];

function checkValues(enObj, ptObj, path = '') {
  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;
    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      if (ptObj[key]) {
        checkValues(enObj[key], ptObj[key], currentPath);
      }
    } else {
      if (ptObj[key]) {
        const enVal = String(enObj[key]).toLowerCase();
        const ptVal = String(ptObj[key]).toLowerCase();
        if (enVal === ptVal && enVal.split(' ').some(w => englishWords.includes(w))) {
           ptValuesInEnglish.push({ path: currentPath, value: ptObj[key] });
        }
      }
    }
  }
}

checkValues(en, pt);
console.log('PT values that look English:', ptValuesInEnglish);
