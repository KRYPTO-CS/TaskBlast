import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../server/firebase";
import {
  getFirestore,
  collection,
  doc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export interface ActiveProfileResult {
  activeChildProfile: string | null;
  childDocId: string | null;
}

interface ActiveProfileContextType extends ActiveProfileResult {
  isChildActive: boolean;
  isLoading: boolean;
  refresh: () => Promise<ActiveProfileResult>;
  getProfileDocRef: () => ReturnType<typeof doc>;
  getTasksCollectionRef: () => ReturnType<typeof collection>;
  getTaskDocRef: (taskId: string) => ReturnType<typeof doc>;
}

const ActiveProfileContext = createContext<ActiveProfileContextType | undefined>(undefined);

export function ActiveProfileProvider({ children }: { children: React.ReactNode }) {
  const [activeChildProfile, setActiveChildProfile] = useState<string | null>(null);
  const [childDocId, setChildDocId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async (): Promise<ActiveProfileResult> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setActiveChildProfile(null);
      setChildDocId(null);
      setIsLoading(false);
      return { activeChildProfile: null, childDocId: null };
    }

    const activeChild = await AsyncStorage.getItem("activeChildProfile");
    setActiveChildProfile(activeChild);

    let resolvedChildDocId: string | null = null;
    if (activeChild) {
      const db = getFirestore();
      const childrenRef = collection(db, "users", currentUser.uid, "children");
      const childQuery = query(childrenRef, where("username", "==", activeChild));
      const childSnapshot = await getDocs(childQuery);
      resolvedChildDocId = childSnapshot.empty ? null : childSnapshot.docs[0].id;
    }

    setChildDocId(resolvedChildDocId);
    setIsLoading(false);
    return { activeChildProfile: activeChild, childDocId: resolvedChildDocId };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        refresh();
      } else {
        setActiveChildProfile(null);
        setChildDocId(null);
        setIsLoading(false);
      }
    });
    return unsubscribe;
  }, [refresh]);

  const getProfileDocRef = useCallback(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No authenticated user");
    const db = getFirestore();
    if (childDocId) {
      return doc(db, "users", currentUser.uid, "children", childDocId);
    }
    return doc(db, "users", currentUser.uid);
  }, [childDocId]);

  const getTasksCollectionRef = useCallback(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No authenticated user");
    const db = getFirestore();
    if (childDocId) {
      return collection(db, "users", currentUser.uid, "children", childDocId, "tasks");
    }
    return collection(db, "users", currentUser.uid, "tasks");
  }, [childDocId]);

  const getTaskDocRef = useCallback((taskId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No authenticated user");
    const db = getFirestore();
    if (childDocId) {
      return doc(db, "users", currentUser.uid, "children", childDocId, "tasks", taskId);
    }
    return doc(db, "users", currentUser.uid, "tasks", taskId);
  }, [childDocId]);

  return (
    <ActiveProfileContext.Provider
      value={{
        activeChildProfile,
        childDocId,
        isChildActive: activeChildProfile !== null,
        isLoading,
        refresh,
        getProfileDocRef,
        getTasksCollectionRef,
        getTaskDocRef,
      }}
    >
      {children}
    </ActiveProfileContext.Provider>
  );
}

export function useActiveProfile() {
  const context = useContext(ActiveProfileContext);
  if (!context) throw new Error("useActiveProfile must be used within ActiveProfileProvider");
  return context;
}
