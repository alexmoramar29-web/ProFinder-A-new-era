import React, { createContext, useContext, useState } from 'react';

// canal de radio
const PerfilContext = createContext<any>(null);

// este es el amplificador que abrazará a tu menú y a tus pantallas
export const PerfilProvider = ({ children }: { children: React.ReactNode }) => {
  const [fotoGlobal, setFotoGlobal] = useState<string | null>(null);

  return (
    <PerfilContext.Provider value={{ fotoGlobal, setFotoGlobal }}>
      {children}
    </PerfilContext.Provider>
  );
};

// esta es la antena para que cualquier pantalla se pueda comunicar en real-time      
export const usePerfil = () => useContext(PerfilContext);