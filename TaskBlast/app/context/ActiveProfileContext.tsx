import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, firestore } from "../../server/firebase";

const ACTIVE_CHILD_PROFILE_KEY = "activeChildProfile";

type ProfileType = "parent" | "child";

interface ActiveProfileContextType {
  isLoading: boolean;
  profileType: ProfileType;
  activeChildUsername: string | null;
  childDocId: string | null;
  childAccountType: "managed" | "independent" | null;
  parentAccountType: "managed" | "independent" | null;
  parentMangerialPinSet: boolean;
  refreshProfile: () => Promise<void>;
  setActiveChildProfile: (username: string) => Promise<void>;
  clearActiveChildProfile: () => Promise<void>;
  getProfilePathSegments: (...segments: string[]) => string[];
  getProfileDocRef: (...segments: string[]) => ReturnType<typeof doc>;
  getProfileCollectionRef: (...segments: string[]) => ReturnType<typeof collection>;
  getParentDocRef: (...segments: string[]) => ReturnType<typeof doc>;
  getChildDocRef: (...segments: string[]) => ReturnType<typeof doc> | null;
}

const ActiveProfileContext = createContext<
  ActiveProfileContextType | undefined
>(undefined);

export function ActiveProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [activeChildUsername, setActiveChildUsernameState] = useState<
    string | null
  >(null);
  const [childDocId, setChildDocId] = useState<string | null>(null);
  const [childAccountType, setChildAccountType] = useState<"managed" | "independent" | null>(null);
  const [parentAccountType, setParentAccountType] = useState<"managed" | "independent" | null>(null);
  const [parentMangerialPinSet, setParentMangerialPinSet] = useState(false);

  const refreshProfile = useCallback(async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setActiveChildUsernameState(null);
      setChildDocId(null);
      setChildAccountType(null);
      setParentAccountType(null);
      setParentMangerialPinSet(false);
      setParentMangerialPinSet(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const parentDoc = await getDoc(doc(firestore, "users", currentUser.uid));
      const parentData = parentDoc.data();
      setParentAccountType(parentData?.accountType ?? null);
      setParentMangerialPinSet(!!parentData?.managerialPin);

      const storedChildUsername = await AsyncStorage.getItem(
        ACTIVE_CHILD_PROFILE_KEY,
      );

      if (!storedChildUsername) {
        setActiveChildUsernameState(null);
        setChildDocId(null);
        setChildAccountType(null);
        return;
      }

      const normalizedUsername = storedChildUsername.trim().toLowerCase();
      const childrenRef = collection(
        firestore,
        "users",
        currentUser.uid,
        "children",
      );
      const childQuery = query(
        childrenRef,
        where("username", "==", normalizedUsername),
      );
      const childSnapshot = await getDocs(childQuery);

      if (childSnapshot.empty) {
        await AsyncStorage.removeItem(ACTIVE_CHILD_PROFILE_KEY);
        setActiveChildUsernameState(null);
        setChildDocId(null);
        setChildAccountType(null);
        return;
      }

      const childData = childSnapshot.docs[0].data();
      setActiveChildUsernameState(normalizedUsername);
      setChildDocId(childSnapshot.docs[0].id);
      setChildAccountType(childData.accountType ?? null);
    } catch (error) {
      console.error("Failed to refresh active profile", error);
      setActiveChildUsernameState(null);
      setChildDocId(null);
      setChildAccountType(null);
      setParentAccountType(null);
      setParentMangerialPinSet(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async () => {
      await refreshProfile();
    });

    return unsubscribe;
  }, [refreshProfile]);

  const setActiveChildProfile = useCallback(
    async (username: string) => {
      const normalizedUsername = username.trim().toLowerCase();
      await AsyncStorage.setItem(ACTIVE_CHILD_PROFILE_KEY, normalizedUsername);
      await refreshProfile();
    },
    [refreshProfile],
  );

  const clearActiveChildProfile = useCallback(async () => {
    await AsyncStorage.removeItem(ACTIVE_CHILD_PROFILE_KEY);
    await refreshProfile();
  }, [refreshProfile]);

  const getProfilePathSegments = useCallback(
    (...segments: string[]) => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No authenticated user");
      }

      if (activeChildUsername && !childDocId) {
        throw new Error("Active child profile is still resolving");
      }

      const baseSegments =
        childDocId && activeChildUsername
          ? ["users", currentUser.uid, "children", childDocId]
          : ["users", currentUser.uid];

      return [...baseSegments, ...segments];
    },
    [activeChildUsername, childDocId],
  );

  const getProfileDocRef = useCallback(
    (...segments: string[]) => {
      const path = getProfilePathSegments(...segments) as [
        string,
        string,
        ...string[],
      ];
      return doc(firestore, path[0], path[1], ...path.slice(2));
    },
    [getProfilePathSegments],
  );

  const getProfileCollectionRef = useCallback(
    (...segments: string[]) => {
      const path = getProfilePathSegments(...segments) as [
        string,
        ...string[],
      ];
      return collection(firestore, path[0], ...path.slice(1));
    },
    [getProfilePathSegments],
  );

  const getParentDocRef = useCallback((...segments: string[]) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No authenticated user");
    }

    return doc(firestore, "users", currentUser.uid, ...segments);
  }, []);

  const getChildDocRef = useCallback(
    (...segments: string[]) => {
      const currentUser = auth.currentUser;
      if (!currentUser || !childDocId) {
        return null;
      }

      return doc(
        firestore,
        "users",
        currentUser.uid,
        "children",
        childDocId,
        ...segments,
      );
    },
    [childDocId],
  );

  const value = useMemo(
    () => ({
      isLoading,
      profileType: childDocId && activeChildUsername ? ("child" as const) : ("parent" as const),
      activeChildUsername,
      childDocId,
      childAccountType,
      parentAccountType,
      parentMangerialPinSet,
      refreshProfile,
      setActiveChildProfile,
      clearActiveChildProfile,
      getProfilePathSegments,
      getProfileDocRef,
      getProfileCollectionRef,
      getParentDocRef,
      getChildDocRef,
    }),
    [
      isLoading,
      childDocId,
      childAccountType,
      parentAccountType,
      parentMangerialPinSet,
      activeChildUsername,
      refreshProfile,
      setActiveChildProfile,
      clearActiveChildProfile,
      getProfilePathSegments,
      getProfileDocRef,
      getProfileCollectionRef,
      getParentDocRef,
      getChildDocRef,
    ],
  );

  return (
    <ActiveProfileContext.Provider value={value}>
      {children}
    </ActiveProfileContext.Provider>
  );
}

export function useActiveProfile() {
  const context = useContext(ActiveProfileContext);
  if (!context) {
    throw new Error("useActiveProfile must be used within ActiveProfileProvider");
  }
  return context;
}
