const fs = require('fs');
const fileEs = 'src/locales/es/translation.json';
const es = JSON.parse(fs.readFileSync(fileEs, 'utf8'));

const missing = {
  'errContrasenaDebil': 'Contraseña débil: Debe tener mínimo 8 caracteres.',
  'errContrasenaNoCoincide': 'Las contraseñas no coinciden: Escribe exactamente lo mismo en ambas cajas.',
  'errDocsIncompletos': 'Documentos incompletos: Sube los archivos PDF de tu INE, Cédula y Certificado.',
  'errAceptaTerminos': 'Debes aceptar los Términos y Condiciones y el Aviso de Privacidad para continuar.',
  'msgGuardandoDocs': 'Guardando documentos en la bodega segura...',
  'msgCreandoGafete': 'Creando tu gafete oficial...',
  'errCorreoExiste': 'Ese correo ya existe.',
  'errCuentaLimite': 'No pudimos crear la cuenta. Es muy probable que este correo ya esté registrado en el sistema, o hayas excedido el límite de registros de prueba (3 por hora). Intenta con un correo diferente.',
  'msgCuentaCreadaDirecto': 'Cuenta creada exitosamente. Ingresando...',
  'msgCuentaCreadaCorreo': 'Cuenta creada. Revisa tu correo (incluyendo SPAM) y dale clic al enlace de verificación.',
  'errInesperado': 'Error inesperado.'
};

Object.keys(missing).forEach(k => {
  if (!es[k]) es[k] = missing[k];
});
fs.writeFileSync(fileEs, JSON.stringify(es, null, 2));

const fileEn = 'src/locales/en/translation.json';
const en = JSON.parse(fs.readFileSync(fileEn, 'utf8'));
Object.keys(missing).forEach(k => {
  if (!en[k]) en[k] = missing[k]; // temporary fallback to es
});
fs.writeFileSync(fileEn, JSON.stringify(en, null, 2));
