const fs = require('fs');
const fileEs = 'src/locales/es/translation.json';
const es = JSON.parse(fs.readFileSync(fileEs, 'utf8'));

const missing = [
  'Citas', 'Chat', 'catCitas', 'catChat',
  '¿Cómo actualizo mi información de perfil?', 'Ve a la pestaña "Perfil" y selecciona el botón "Editar Perfil" para cambiar tu foto, nombre o número de teléfono.',
  '¿Cómo puedo solicitar una cita con un profesionista?', 'Busca al profesionista en la pantalla principal, entra a su perfil y en la sección "Agendar Cita" selecciona la fecha y hora que necesites.',
  '¿Dónde veo si mi cita fue aceptada?', 'En la pestaña de "Citas" puedes ver todas tus solicitudes. Si el profesionista acepta, pasará a la sección de "Próximos Trabajos".',
  '¿En qué momento puedo usar el chat?', 'El chat privado se habilita automáticamente en la pestaña "Chat" únicamente cuando el profesionista acepta tu solicitud de cita.',
  'Tengo un problema técnico, ¿qué hago?', 'Puedes contactarnos directamente desde los botones de WhatsApp o Correo en la parte superior de esta pantalla. Atendemos problemas técnicos las 24 horas.',
  'En el menú lateral, selecciona "Perfil" para actualizar tu foto, biografía y demás datos de contacto.',
  '¿Cómo agrego un nuevo servicio?', 'Ve a la pestaña "Servicios", pulsa el botón "+" y completa el formulario con el título, descripción y precio base.',
  '¿Cómo acepto o rechazo una solicitud de cita?', 'En la pestaña "Solicitudes" verás las citas pendientes. Abre los detalles de cada cliente y usa los botones de "Aceptar" o "Rechazar".',
  '¿Cómo indico que ya terminé un trabajo?', 'Entra al detalle de la cita aceptada en tu calendario y cambia su estado a "Finalizado".',
  '¿Cómo funciona el chat con el cliente?', 'Al aceptar una solicitud de cita, se abrirá un chat privado en la pestaña "Chat" para coordinar los últimos detalles.'
];

missing.forEach(k => { if (!es[k]) es[k] = k; });
fs.writeFileSync(fileEs, JSON.stringify(es, null, 2));

const fileEn = 'src/locales/en/translation.json';
const en = JSON.parse(fs.readFileSync(fileEn, 'utf8'));
missing.forEach(k => { if (!en[k]) en[k] = k; });
fs.writeFileSync(fileEn, JSON.stringify(en, null, 2));
