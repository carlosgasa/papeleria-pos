import { useState, useEffect } from 'react';
import { getCurrentUser, onAuthChange } from '../../core/firebase/authService';
import { AuthUser } from '../../core/firebase/authService';

/**
 * Hook para gestionar autenticación.
 * En Android, sería un ViewModel con LiveData observando Auth.
 */

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const currentUser = getCurrentUser();
    return currentUser ? {
      uid: currentUser.uid,
      email: currentUser.email,
    } : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Suscribirse a cambios de autenticación
    // onAuthChange se llama inmediatamente con el estado actual
    const unsubscribe = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
};
