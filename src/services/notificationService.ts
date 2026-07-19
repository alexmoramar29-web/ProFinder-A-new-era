import { supabase } from '../lib/supabase';

// ============================================================
// Servicio de Notificaciones Push
// Genera notificaciones en la tabla 'notifications' de Supabase 
// cuando ocurren eventos importantes en la aplicación.
// ============================================================

type NotificationType = 
  | 'new_message'           // Nuevo mensaje en chat
  | 'new_appointment'       // Nueva cita agendada (para el profesionista)
  | 'appointment_accepted'  // Cita aceptada (para el cliente)
  | 'new_review'            // Nueva reseña (para el profesionista)
  | 'review_request';       // Solicitud de reseña (para el cliente)

interface NotificationPayload {
  recipientId: string;
  type: NotificationType;
  content: string;
  relatedId?: string;
}

/**
 * Crea una notificación en la base de datos de Supabase.
 * La NotificationContext ya escucha cambios en tiempo real en esta tabla,
 * así que la notificación aparecerá automáticamente en la app del destinatario.
 */
export async function crearNotificacion({ recipientId, type, content, relatedId }: NotificationPayload) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type,
        content,
        is_read: false,
        related_id: relatedId || null,
      });

    if (error) {
      console.log('Error creando notificación:', error.message);
    }
  } catch (e) {
    console.log('Error en crearNotificacion:', e);
  }
}

// ============================================================
// Funciones de conveniencia para cada tipo de evento
// ============================================================

/** Notificar al destinatario de un nuevo mensaje */
export async function notificarNuevoMensaje(recipientId: string, senderName: string, chatId?: string) {
  await crearNotificacion({
    recipientId,
    type: 'new_message',
    content: `${senderName} te envió un mensaje.`,
    relatedId: chatId,
  });
}

/** Notificar al profesionista de una nueva cita agendada */
export async function notificarNuevaCita(profId: string, clientName: string, fecha: string, appointmentId?: string) {
  await crearNotificacion({
    recipientId: profId,
    type: 'new_appointment',
    content: `${clientName} agendó una cita para el ${fecha}.`,
    relatedId: appointmentId,
  });
}

/** Notificar al cliente que su cita fue aceptada */
export async function notificarCitaAceptada(clientId: string, profName: string, fecha: string, appointmentId?: string) {
  await crearNotificacion({
    recipientId: clientId,
    type: 'appointment_accepted',
    content: `${profName} aceptó tu cita del ${fecha}.`,
    relatedId: appointmentId,
  });
}

/** Notificar al profesionista de una nueva reseña */
export async function notificarNuevaResena(profId: string, clientName: string, rating: number, reviewId?: string) {
  await crearNotificacion({
    recipientId: profId,
    type: 'new_review',
    content: `${clientName} te dejó una reseña de ${rating} ⭐.`,
    relatedId: reviewId,
  });
}

/** Notificar al cliente para que deje una reseña después de su cita */
export async function notificarSolicitudResena(clientId: string, profName: string, appointmentId?: string) {
  await crearNotificacion({
    recipientId: clientId,
    type: 'review_request',
    content: `¿Cómo te fue con ${profName}? Deja tu reseña.`,
    relatedId: appointmentId,
  });
}
