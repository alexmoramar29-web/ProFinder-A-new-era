import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AdminDashboardScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    usuarios: 0,
    profesionistas: 0,
    citas: 0,
  });

  const loadStats = async () => {
    setLoading(true);
    try {
      // Obtener conteos de forma eficiente
      const { count: countUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: countProfs } = await supabase.from('professionals').select('*', { count: 'exact', head: true });
      const { count: countCitas } = await supabase.from('appointments').select('*', { count: 'exact', head: true });
      
      setStats({
        usuarios: countUsers || 0,
        profesionistas: countProfs || 0,
        citas: countCitas || 0,
      });
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const getStyles = () => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background?.app || colors.neutral[50],
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
      backgroundColor: colors.background?.card || colors.neutral[0],
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    backButton: {
      padding: 5,
    },
    content: {
      padding: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 20,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    card: {
      width: '48%',
      backgroundColor: colors.background?.card || colors.neutral[0],
      borderRadius: 16,
      padding: 20,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: colors.border.default,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    cardFull: {
      width: '100%',
    },
    iconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0eaff',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    statNumber: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 5,
    },
    statLabel: {
      fontSize: 14,
      color: colors.primary[700],
      fontWeight: '500',
    },
    refreshText: {
      color: colors.text.primary,
      textAlign: 'center',
      marginTop: 20,
      opacity: 0.5,
      fontSize: 12,
    }
  });

  const styles = getStyles();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(cliente)')}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Panel Admin</Text>
        <TouchableOpacity style={styles.backButton} onPress={loadStats}>
          <Ionicons name="refresh" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadStats} tintColor={colors.primary[700]} />}
      >
        <Text style={styles.title}>Resumen de la Plataforma</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary[700]} style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.grid}>
            <View style={styles.card}>
              <View style={styles.iconContainer}>
                <Ionicons name="people" size={24} color={colors.primary[700]} />
              </View>
              <Text style={styles.statNumber}>{stats.usuarios}</Text>
              <Text style={styles.statLabel}>Usuarios Totales</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.iconContainer}>
                <Ionicons name="briefcase" size={24} color={colors.primary[700]} />
              </View>
              <Text style={styles.statNumber}>{stats.profesionistas}</Text>
              <Text style={styles.statLabel}>Profesionistas</Text>
            </View>

            <View style={[styles.card, styles.cardFull]}>
              <View style={styles.iconContainer}>
                <Ionicons name="calendar" size={24} color={colors.primary[700]} />
              </View>
              <Text style={styles.statNumber}>{stats.citas}</Text>
              <Text style={styles.statLabel}>Citas Agendadas</Text>
            </View>
          </View>
        )}
        
        <Text style={styles.refreshText}>La información se obtiene en tiempo real desde Supabase</Text>
      </ScrollView>
    </View>
  );
}
