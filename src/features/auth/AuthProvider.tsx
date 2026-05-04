'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import type { User } from 'firebase/auth';

import { listenAuthState } from '@/lib/auth/auth';
import { getAppUser } from '@/lib/firestore/users';
import type { AppUser } from '@/types/models';

type AuthContextValue = {
    firebaseUser: User | null;
    appUser: AppUser | null;
    loading: boolean;
    isAuthenticated: boolean;
    refreshAppUser: (userId?: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
    children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
    const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
    const [appUser, setAppUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshAppUser = useCallback(
        async (userId?: string) => {
            const targetUserId = userId ?? firebaseUser?.uid;

            if (!targetUserId) {
                setAppUser(null);
                return;
            }

            const fetchedAppUser = await getAppUser(targetUserId);
            setAppUser(fetchedAppUser);
        },
        [firebaseUser],
    );

    useEffect(() => {
        const unsubscribe = listenAuthState(async (user) => {
            setFirebaseUser(user);

            if (!user) {
                setAppUser(null);
                setLoading(false);
                return;
            }

            const fetchedAppUser = await getAppUser(user.uid);
            setAppUser(fetchedAppUser);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            firebaseUser,
            appUser,
            loading,
            isAuthenticated: Boolean(firebaseUser && appUser),
            refreshAppUser,
        }),
        [firebaseUser, appUser, loading, refreshAppUser],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within AuthProvider.');
    }

    return context;
}
