import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase'; // 💎 Tu conexión vital

export default function SignUpScreen() {
  const router = useRouter();
  
  // Estados del formulario
  const [rol, setRol] = useState<'cliente' | 'profesionista'>('cliente');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [speciality, setSpeciality] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleRegistro = async () => {
    console.log("🔴 1. BOTÓN PRESIONADO. Validando campos...");

    if (!username || !fullName || !email || !password) {
      console.log("❌ ERROR: Faltan campos básicos obligatorios.");
      Alert.alert('Aviso', 'Por favor llena todos los campos básicos.');
      return;
    }
    if (password.length < 6) {
      console.log("❌ ERROR: Contraseña muy corta.");
      Alert.alert('Aviso', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexCorreo.test(email)) {
      console.log("❌ ERROR: Formato de correo inválido.");
      Alert.alert('Aviso', 'Por favor ingresa un correo válido (ejemplo@correo.com).');
      return;
    }

    if (rol === 'profesionista' && !speciality) {
      console.log("❌ ERROR: Falta especialidad del profesionista.");
      Alert.alert('Aviso', 'Ingresa tu especialidad.');
      return;
    }

    console.log("🟡 2. Datos completos. Iniciando carga a Supabase...");
    setCargando(true);

    try {
      console.log("🟡 3. Intentando guardar en la Bóveda de Auth...");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) {
        console.log("❌ ERROR DE AUTH DE SUPABASE:", authError.message);
        throw authError;
      }

      console.log("🟢 4. Usuario guardado en Auth. Guardando perfil en la tabla:", rol);

      if (rol === 'cliente') {
        const { error: dbError } = await supabase
          .from('users')
          .insert([
            {
              username: username,
              full_name: fullName,
              email: email,
              phone: phone || null, // Por si lo dejas vacío
              password_hash: 'PROTEGIDO_POR_AUTH'
            }
          ]);

        if (dbError) {
          console.log("❌ ERROR AL INSERTAR EN LA TABLA USERS:", dbError.message);
          throw dbError;
        }

        console.log("✅ 5. REGISTRO EXITOSO. Redirigiendo al cliente...");
        router.replace('/(cliente)');

      } else {
        const { error: dbError } = await supabase
          .from('professionals')
          .insert([
            {
              username: username,
              full_name: fullName,
              email: email,
              phone: phone || null,
              speciality: speciality,
              password_hash: 'PROTEGIDO_POR_AUTH'
            }
          ]);

        if (dbError) {
          console.log("❌ ERROR AL INSERTAR EN LA TABLA PROFESSIONALS:", dbError.message);
          throw dbError;
        }

        console.log("✅ 5. REGISTRO EXITOSO. Redirigiendo al profesionista...");
        router.replace('/(profesionista)');
      }

    } catch (error: any) {
      console.error("❌ ERROR FATAL CAPTURADO:", error);
      Alert.alert('Hubo un error', error.message || 'Fallo en la conexión.');
    } finally {
      setCargando(false);
      console.log("🏁 6. Proceso de registro finalizado.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Únete a ProFinder</Text>

        {/* Selector de Rol */}
        <View style={styles.roleContainer}>
          <TouchableOpacity 
            style={[styles.roleButton, rol === 'cliente' && styles.roleActive]}
            onPress={() => setRol('cliente')}
            disabled={cargando}
          >
            <Text style={rol === 'cliente' ? styles.textActive : styles.textInactive}>Soy Cliente</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.roleButton, rol === 'profesionista' && styles.roleActive]}
            onPress={() => setRol('profesionista')}
            disabled={cargando}
          >
            <Text style={rol === 'profesionista' ? styles.textActive : styles.textInactive}>Soy Profesionista</Text>
          </TouchableOpacity>
        </View>

        {/* Campos obligatorios para ambos */}
        <TextInput style={styles.input} placeholder="Nombre completo" value={fullName} onChangeText={setFullName} editable={!cargando} />
        <TextInput style={styles.input} placeholder="Nombre de usuario (Username)" value={username} onChangeText={setUsername} autoCapitalize="none" editable={!cargando} />
        <TextInput style={styles.input} placeholder="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!cargando} />
        <TextInput style={styles.input} placeholder="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={!cargando} />
        <TextInput style={styles.input} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry editable={!cargando} />

        {/* Campo condicional solo para Profesionistas */}
        {rol === 'profesionista' && (
          <TextInput 
            style={[styles.input, styles.specialInput]} 
            placeholder="¿Cuál es tu especialidad? (Ej. Plomero, Electricista)" 
            value={speciality} 
            onChangeText={setSpeciality} 
            editable={!cargando}
          />
        )}
        
        <View style={styles.buttonContainer}>
          <Button 
            title={cargando ? "Registrando..." : `Registrar como ${rol}`} 
            onPress={handleRegistro} 
            disabled={cargando}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, backgroundColor: '#fff' },
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 15, borderRadius: 5, backgroundColor: '#f9f9f9' },
  specialInput: { borderColor: '#007bff', backgroundColor: '#eef6ff' },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  roleButton: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#ccc', alignItems: 'center', marginHorizontal: 5, borderRadius: 5 },
  roleActive: { backgroundColor: '#007bff', borderColor: '#007bff' },
  textActive: { color: '#fff', fontWeight: 'bold' },
  textInactive: { color: '#333' },
  buttonContainer: { marginTop: 10 }
});