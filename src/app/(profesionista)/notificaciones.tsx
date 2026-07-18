import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../theme/Colors';
import { Radius, Shadow, Spacing } from '../../theme/Spacing';
import { Typography } from '../../theme/Typography';
import { useNotifications } from '../../context/NotificationContext';
import NavbarProfesionista from '../../components/NavbarProfesionista';

export default function NotificacionesProfesionistaScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationPress = async (id: string, type: string, related_id?: string) => {
    await markAsRead(id);
    if (type === 'chat' && related_id) {
      router.push(`/(profesionista)/chat/${related_id}`);
    } else if (type === 'appointment_new') {
      router.push(`/(profesionista)/calendario`);
    } else if (type === 'review') {
      router.push(`/(profesionista)/reseñas`);
    }
  };

  const formatearFecha = (fechaString: string) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString() + ' ' + fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'chat': return <Ionicons name="chatbubbles" size={24} color={Colors.primary[600]} />;
      case 'appointment_new': return <Ionicons name="calendar" size={24} color={Colors.warning.main} />;
      case 'review': return <Ionicons name="star" size={24} color={Colors.warning.main} />;
      default: return <Ionicons name="notifications" size={24} color={Colors.primary[600]} />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral[50] }}>
      <NavbarProfesionista />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.btnAtras}>
              <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.titulo}>Notificaciones {unreadCount > 0 && `(${unreadCount})`}</Text>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllAsRead}>
                <Text style={styles.marcarLeidas}>Marcar todas como leídas</Text>
              </TouchableOpacity>
            )}
          </View>

          {notifications.length === 0 ? (
            <View style={styles.vacio}>
              <Ionicons name="notifications-off-outline" size={64} color={Colors.text.disabled} />
              <Text style={styles.textoVacio}>No tienes notificaciones por el momento.</Text>
            </View>
          ) : (
            notifications.map((notif) => (
              <TouchableOpacity
                key={notif.id}
                style={[styles.tarjeta, !notif.is_read && styles.tarjetaNoLeida]}
                onPress={() => handleNotificationPress(notif.id, notif.type, notif.related_id)}
              >
                <View style={styles.iconoBox}>
                  {getIcon(notif.type)}
                </View>
                <View style={styles.contenidoBox}>
                  <Text style={styles.textoContenido}>{notif.content}</Text>
                  <Text style={styles.textoFecha}>{formatearFecha(notif.created_at)}</Text>
                </View>
                {!notif.is_read && <View style={styles.puntoRojo} />}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingBottom: Spacing[10] },
  container: { padding: Spacing[5], maxWidth: 800, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[6], gap: Spacing[3] },
  btnAtras: { padding: Spacing[2] },
  titulo: { ...Typography.styles.h2, color: Colors.text.primary, fontWeight: 'bold', flex: 1 },
  marcarLeidas: { ...Typography.styles.caption, color: Colors.primary[600], fontWeight: 'bold' },
  vacio: { alignItems: 'center', marginTop: Spacing[10] },
  textoVacio: { ...Typography.styles.body, color: Colors.text.secondary, marginTop: Spacing[4] },
  tarjeta: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: Spacing[4], borderRadius: Radius.md, marginBottom: Spacing[3], borderWidth: 1, borderColor: Colors.border.default, ...Shadow.sm },
  tarjetaNoLeida: { backgroundColor: Colors.primary[50], borderColor: Colors.primary[200] },
  iconoBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary[100], justifyContent: 'center', alignItems: 'center', marginRight: Spacing[4] },
  contenidoBox: { flex: 1 },
  textoContenido: { ...Typography.styles.body, color: Colors.text.primary, fontWeight: '600', marginBottom: Spacing[1] },
  textoFecha: { ...Typography.styles.caption, color: Colors.text.secondary },
  puntoRojo: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.error.main, marginLeft: Spacing[3] }
});
