const fs = require('fs');
const fileEn = 'src/locales/en/translation.json';
const en = JSON.parse(fs.readFileSync(fileEn, 'utf8'));

const translations = {
  'errContrasenaDebil': 'Weak password: Must be at least 8 characters.',
  'errContrasenaNoCoincide': 'Passwords do not match: Enter exactly the same in both boxes.',
  'errDocsIncompletos': 'Incomplete documents: Upload the PDF files of your ID and Certificate.',
  'errAceptaTerminos': 'You must accept the Terms and Conditions and Privacy Notice to continue.',
  'msgGuardandoDocs': 'Saving documents in the secure vault...',
  'msgCreandoGafete': 'Creating your official badge...',
  'errCorreoExiste': 'That email already exists.',
  'errCuentaLimite': 'We could not create the account. It is highly likely this email is already registered, or you have exceeded the test registration limit (3 per hour). Try a different email.',
  'msgCuentaCreadaDirecto': 'Account successfully created. Logging in...',
  'msgCuentaCreadaCorreo': 'Account created. Check your email (including SPAM) and click the verification link.',
  'errInesperado': 'Unexpected error.',
  'min8caracteres': 'Minimum 8 characters',
  'repiteNuevaClave': 'Repeat your new password'
};

Object.keys(translations).forEach(k => {
  en[k] = translations[k];
});

fs.writeFileSync(fileEn, JSON.stringify(en, null, 2));
console.log('Fixed English translations');
