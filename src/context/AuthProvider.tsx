import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

// 1. Creamos el "Gafete" que tendrá la información del usuario
type AuthContextType = {
  session: Session | null;
  user: any | null;
};

const AuthContext = createContext<AuthContextType>({ session: null, user: null });

// 2. Creamos al Guardia de Seguridad (AuthProvider)
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Al abrir la app, revisa si hay una sesión guardada
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Se queda vigilando por si el usuario entra o cierra sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Le pasa la información a toda la aplicación (children)
  return (
    <AuthContext.Provider value={{ session, user: session?.user || null }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Un pequeño atajo para usar la sesión en otras pantallas
export const useAuth = () => useContext(AuthContext);