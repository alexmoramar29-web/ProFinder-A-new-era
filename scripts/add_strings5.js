const fs = require('fs');

const missing = {
  "citasCompletadasMes": "Citas Completadas",
  "vsMesAnteriorCitas": "+5% vs mes anterior",
  "rendimientoCitas": "Rendimiento de Citas",
  "historialCitas": "Historial de citas completadas por mes",
  "operacionCompletada": "Operación completada.",
  "citaAceptada": "Cita aceptada.",
  "citaRechazada": "Cita rechazada.",
  "trabajoMarcadoEnCurso": "Trabajo marcado en curso.",
  "trabajoFinalizado": "Trabajo finalizado.",
  "citaCancelada": "Cita cancelada.",
  "cambioInesperadoTitulo": "Cambio Inesperado",
  "cambioInesperadoMensaje": "Esta cita está programada para más tarde. ¿Ocurrió un cambio inesperado y el cliente ya está listo para empezar?",
  "siEmpezarAhora": "Sí, empezar ahora",
  "atencionTitulo": "Atención",
  "yaTienesTrabajoEnCurso": "Ya tienes un trabajo EN CURSO. ¿Estás seguro de que quieres empezar este también sin finalizar el anterior?",
  "empezarDeTodosModos": "Empezar de todos modos",
  "gestionDeCitas": "Gestión de Citas",
  "pendientes": "Pendientes",
  "proximosTrabajos": "Próximos Trabajos",
  "historial": "Historial",
  "noCitasPendientes": "No tienes citas pendientes por revisar.",
  "noCitasProximas": "No tienes trabajos próximos agendados.",
  "noCitasFinalizadas": "No tienes trabajos finalizados.",
  "clienteAnonimo": "Cliente Anónimo",
  "enCursoBadge": "EN CURSO",
  "finalizadoBadge": "FINALIZADO",
  "notasDelCliente": "Notas del cliente:",
  "aceptarCita": "Aceptar Cita",
  "cancelar": "Cancelar",
  "empezarTrabajo": "Empezar Trabajo",
  "finalizarTrabajo": "Finalizar Trabajo",
  "misResenas": "Mis Reseñas",
  "descubreOpiniones": "Descubre lo que tus clientes opinan de tus servicios.",
  "basadoEn": "Basado en",
  "resenaUnica": "reseña",
  "resenasMultiples": "reseñas",
  "noTienesResenas": "Aún no tienes reseñas. ¡Sigue ofreciendo un gran servicio!",
  "servicio": "Servicio",
  "sinComentarios": "Sin comentarios."
};

const missingEn = {
  "citasCompletadasMes": "Completed Appointments",
  "vsMesAnteriorCitas": "+5% vs previous month",
  "rendimientoCitas": "Appointment Performance",
  "historialCitas": "Completed appointments history by month",
  "operacionCompletada": "Operation completed.",
  "citaAceptada": "Appointment accepted.",
  "citaRechazada": "Appointment rejected.",
  "trabajoMarcadoEnCurso": "Work marked in progress.",
  "trabajoFinalizado": "Work finished.",
  "citaCancelada": "Appointment canceled.",
  "cambioInesperadoTitulo": "Unexpected Change",
  "cambioInesperadoMensaje": "This appointment is scheduled for later. Did an unexpected change occur and the client is ready to start?",
  "siEmpezarAhora": "Yes, start now",
  "atencionTitulo": "Attention",
  "yaTienesTrabajoEnCurso": "You already have a work IN PROGRESS. Are you sure you want to start this one without finishing the previous one?",
  "empezarDeTodosModos": "Start anyway",
  "gestionDeCitas": "Appointment Management",
  "pendientes": "Pending",
  "proximosTrabajos": "Upcoming Work",
  "historial": "History",
  "noCitasPendientes": "You have no pending appointments to review.",
  "noCitasProximas": "You have no upcoming work scheduled.",
  "noCitasFinalizadas": "You have no finished work.",
  "clienteAnonimo": "Anonymous Client",
  "enCursoBadge": "IN PROGRESS",
  "finalizadoBadge": "FINISHED",
  "notasDelCliente": "Client notes:",
  "aceptarCita": "Accept Appointment",
  "cancelar": "Cancel",
  "empezarTrabajo": "Start Work",
  "finalizarTrabajo": "Finish Work",
  "misResenas": "My Reviews",
  "descubreOpiniones": "Discover what your clients think about your services.",
  "basadoEn": "Based on",
  "resenaUnica": "review",
  "resenasMultiples": "reviews",
  "noTienesResenas": "You don't have reviews yet. Keep providing a great service!",
  "servicio": "Service",
  "sinComentarios": "No comments."
};

const fileEs = 'src/locales/es/translation.json';
const es = JSON.parse(fs.readFileSync(fileEs, 'utf8'));
Object.keys(missing).forEach(k => { if (!es[k]) es[k] = missing[k]; });
fs.writeFileSync(fileEs, JSON.stringify(es, null, 2));

const fileEn = 'src/locales/en/translation.json';
const en = JSON.parse(fs.readFileSync(fileEn, 'utf8'));
Object.keys(missingEn).forEach(k => { if (!en[k]) en[k] = missingEn[k]; });
fs.writeFileSync(fileEn, JSON.stringify(en, null, 2));

console.log('Translations added successfully.');
