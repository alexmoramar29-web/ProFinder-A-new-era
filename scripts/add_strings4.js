const fs = require('fs');
const fileEs = 'src/locales/es/translation.json';
const es = JSON.parse(fs.readFileSync(fileEs, 'utf8'));

const missing = {
  'min8caracteres': 'Mínimo 8 caracteres',
  'repiteNuevaClave': 'Repite tu nueva clave'
};

Object.keys(missing).forEach(k => {
  if (!es[k]) es[k] = missing[k];
});
fs.writeFileSync(fileEs, JSON.stringify(es, null, 2));

const fileEn = 'src/locales/en/translation.json';
const en = JSON.parse(fs.readFileSync(fileEn, 'utf8'));
Object.keys(missing).forEach(k => {
  if (!en[k]) en[k] = missing[k]; // will be translated
});
fs.writeFileSync(fileEn, JSON.stringify(en, null, 2));
