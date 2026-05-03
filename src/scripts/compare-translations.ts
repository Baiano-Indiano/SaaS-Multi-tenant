import fs from 'fs';

const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8')) as Record<string, unknown>;
const pt = JSON.parse(fs.readFileSync('messages/pt.json', 'utf8')) as Record<string, unknown>;

function getKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.keys(obj).reduce((res: string[], el) => {
    const value = obj[el];
    if (Array.isArray(value)) {
      res.push(prefix + el);
    } else if (typeof value === 'object' && value !== null) {
      res.push(...getKeys(value as Record<string, unknown>, prefix + el + '.'));
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
const ptValuesInEnglish: { path: string; value: string }[] = [];

function checkValues(enObj: Record<string, unknown>, ptObj: Record<string, unknown>, path = '') {
  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;
    const enValRaw = enObj[key];
    const ptValRaw = ptObj[key];

    if (typeof enValRaw === 'object' && enValRaw !== null && !Array.isArray(enValRaw)) {
      if (ptValRaw && typeof ptValRaw === 'object' && !Array.isArray(ptValRaw)) {
        checkValues(enValRaw as Record<string, unknown>, ptValRaw as Record<string, unknown>, currentPath);
      }
    } else {
      if (ptValRaw) {
        const enVal = String(enValRaw).toLowerCase();
        const ptVal = String(ptValRaw).toLowerCase();
        if (enVal === ptVal && enVal.split(' ').some(w => englishWords.includes(w))) {
           ptValuesInEnglish.push({ path: currentPath, value: String(ptValRaw) });
        }
      }
    }
  }
}

checkValues(en, pt);
console.log('PT values that look English:', ptValuesInEnglish);
