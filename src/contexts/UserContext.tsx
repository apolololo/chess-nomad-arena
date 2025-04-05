
import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateUsername } from '@/lib/names';

interface UserContextType {
  username: string;
  setUsername: (name: string) => void;
  rating: number;
  updateRating: (newRating: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string>('');
  const [rating, setRating] = useState<number>(1200);

  useEffect(() => {
    // Charger le nom d'utilisateur du localStorage ou en générer un nouveau
    const storedUsername = localStorage.getItem('chessUsername');
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      const newUsername = generateUsername();
      setUsername(newUsername);
      localStorage.setItem('chessUsername', newUsername);
    }

    // Charger le classement du localStorage ou utiliser la valeur par défaut
    const storedRating = localStorage.getItem('chessRating');
    if (storedRating) {
      setRating(parseInt(storedRating, 10));
    } else {
      localStorage.setItem('chessRating', rating.toString());
    }
  }, []);

  const updateRating = (newRating: number) => {
    setRating(newRating);
    localStorage.setItem('chessRating', newRating.toString());
  };

  // Mettre à jour le localStorage quand le nom d'utilisateur change
  useEffect(() => {
    if (username) {
      localStorage.setItem('chessUsername', username);
    }
  }, [username]);

  return (
    <UserContext.Provider value={{ username, setUsername, rating, updateRating }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
