import {
  collection,
  CollectionReference,
  DocumentData,
  addDoc,
  getDoc,
  getDocs,
  doc,
  deleteDoc,
  query,
  updateDoc,
  Timestamp,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from './init';

/**
 * Servicio genérico CRUD para Firestore.
 * En Android/Room, estos serían métodos DAO.
 * Aquí usamos Firestore directamente con helpers genéricos.
 * 
 * NOTA IMPORTANTE PARA ANDROID/KOTLIN DEV:
 * - Firestore es como Room pero en la nube
 * - getCollectionRef = @Query("SELECT * FROM table")
 * - addDoc = @Insert
 * - updateDoc = @Update
 * - deleteDoc = @Delete
 * - onSnapshot = Flow<List<T>> listener en tiempo real
 * - writeBatch = transacción atómica
 */

// Obtener referencia a una colección bajo el usuario actual
export const getCollectionRef = <T extends DocumentData>(
  userId: string,
  collectionName: string
): CollectionReference<T> => {
  return collection(db, 'users', userId, collectionName) as CollectionReference<T>;
};

// Crear documento
export const createDocument = async <T extends DocumentData>(
  userId: string,
  collectionName: string,
  data: T
): Promise<string> => {
  const collectionRef = getCollectionRef(userId, collectionName);
  const docRef = await addDoc(collectionRef, {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

// Obtener documento por ID
export const getDocument = async <T extends DocumentData>(
  userId: string,
  collectionName: string,
  docId: string
): Promise<T | null> => {
  const docRef = doc(db, 'users', userId, collectionName, docId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as T) : null;
};

// Obtener todos los documentos
export const getAllDocuments = async <T extends DocumentData>(
  userId: string,
  collectionName: string
): Promise<T[]> => {
  const collectionRef = getCollectionRef(userId, collectionName);
  const snapshot = await getDocs(collectionRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as unknown as T));
};

// Ejecutar query personalizado
export const queryDocuments = async <T extends DocumentData>(
  userId: string,
  collectionName: string,
  ...queryConstraints: any[]
): Promise<T[]> => {
  const collectionRef = getCollectionRef(userId, collectionName);
  const q = query(collectionRef, ...queryConstraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as unknown as T));
};

// Actualizar documento
export const updateDocument = async <T extends Partial<DocumentData>>(
  userId: string,
  collectionName: string,
  docId: string,
  data: T
): Promise<void> => {
  const docRef = doc(db, 'users', userId, collectionName, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

// Eliminar documento
export const deleteDocument = async (
  userId: string,
  collectionName: string,
  docId: string
): Promise<void> => {
  const docRef = doc(db, 'users', userId, collectionName, docId);
  await deleteDoc(docRef);
};

// Listener en tiempo real para una colección
// Similar a Flow<List<T>> en Room + Coroutines
export const onCollectionSnapshot = <T extends DocumentData>(
  userId: string,
  collectionName: string,
  callback: (docs: T[]) => void,
  errorCallback?: (error: Error) => void
) => {
  const collectionRef = getCollectionRef(userId, collectionName);
  
  return onSnapshot(collectionRef, (snapshot) => {
    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as unknown as T));
    callback(docs);
  }, (error) => {
    errorCallback?.(error as Error);
  });
};

// Listener en tiempo real para un documento
export const onDocumentSnapshot = <T extends DocumentData>(
  userId: string,
  collectionName: string,
  docId: string,
  callback: (doc: T | null) => void,
  errorCallback?: (error: Error) => void
) => {
  const docRef = doc(db, 'users', userId, collectionName, docId);
  
  return onSnapshot(docRef, (snapshot) => {
    const data = snapshot.exists()
      ? ({ id: snapshot.id, ...snapshot.data() } as unknown as T)
      : null;
    callback(data);
  }, (error) => {
    errorCallback?.(error as Error);
  });
};

// Transacción por lotes (batch write)
// Útil para actualizar múltiples documentos atomicamente
export const batchWrite = async (
  operations: Array<{
    type: 'set' | 'update' | 'delete';
    path: string;
    data?: any;
  }>
): Promise<void> => {
  const batch = writeBatch(db);
  
  for (const op of operations) {
    const docRef = doc(db, op.path);
    
    if (op.type === 'set') {
      batch.set(docRef, op.data || {});
    } else if (op.type === 'update') {
      batch.update(docRef, {
        ...op.data,
        updatedAt: Timestamp.now(),
      });
    } else if (op.type === 'delete') {
      batch.delete(docRef);
    }
  }
  
  await batch.commit();
};
