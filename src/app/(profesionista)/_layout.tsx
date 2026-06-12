import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem, DrawerItemList, DrawerToggleButton } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '../../lib/supabase';


// armamos el menu a nuestra medida para poder meterle el boton al final
function MenuPersonalizado(props: DrawerContentComponentProps) {
  const router = useRouter();

  const salirDeLaCuenta = async () => {
    // le decimos a la base de datos que cierre la sesion de forma segura
    await supabase.auth.signOut();
    
    // lo sacamos de la zona del profesionista y lo mandamos al inicio
    router.replace('/(auth)/sign-in');
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.contenedorMenu}>
        <View>
          {/* esto respeta e imprime las pantallas normales que configures en el drawer */}
          <DrawerItemList {...props} />
        </View>

        <View>
          <View style={styles.separador} />
          <DrawerItem 
            label="Cerrar Sesión" 
            onPress={salirDeLaCuenta}
            labelStyle={styles.textoSalir}
          />
        </View>
      </View>
    </DrawerContentScrollView>
  );
}

export default function ProfesionistaLayout() {
  const router = useRouter();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        // le avisamos que no use el menu por defecto, sino el que acabamos de armar arriba
        drawerContent={(props) => <MenuPersonalizado {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: '#5c4b8a' },
          headerTintColor: '#fff',
          drawerActiveTintColor: '#5c4b8a',
          drawerPosition: 'right',
          headerTitle: '',
          drawerStyle: {
            width: 250, 
          },
          headerLeft: () => (
            <View style={styles.contenedorIzquierdo}>
              <Text style={styles.textoLogo}>ProFinder</Text>
            </View>
          ),
          headerRight: () => (
            <View style={styles.contenedorDerecho}>
              <TouchableOpacity onPress={() => router.push('/perfil')}>
                <Image 
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} 
                  style={styles.fotoPerfil} 
                />
              </TouchableOpacity>
              <DrawerToggleButton tintColor="#fff" />
            </View>
          ),
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: 'Inicio',
          }}
        />
        <Drawer.Screen
          name="perfil/index"
          options={{
            drawerLabel: 'Mi Perfil',
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  contenedorMenu: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  separador: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
    marginHorizontal: 15,
  },
  textoSalir: {
    color: '#d9534f',
    fontWeight: 'bold',
  },
  contenedorIzquierdo: {
    marginLeft: 15,
  },
  textoLogo: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  contenedorDerecho: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 5,
  },
  fotoPerfil: {
    width: 32,
    height: 32,
    borderRadius: 16, 
    borderWidth: 1.5,
    borderColor: '#ffffff',
    marginRight: 5, 
  }
});