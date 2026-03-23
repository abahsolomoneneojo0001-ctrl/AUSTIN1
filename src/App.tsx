/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import LoginView from './views/LoginView';
import AppLayout from './components/AppLayout';
import AdminView from './views/AdminView';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<{email: string, role: string, name: string, uid: string} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result on page load
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const firebaseUser = result.user;
          // Create user doc if it doesn't exist
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL || '',
              role: 'user',
              stats: {
                totalWorkouts: 0,
                totalMinutes: 0,
                caloriesBurned: 0
              },
              connectedApps: {
                appleHealth: false,
                googleFit: false
              },
              createdAt: serverTimestamp()
            });
          }
        }
      } catch (error) {
        console.error("Error handling redirect result:", error);
      }
    };

    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? 'User signed in' : 'User signed out');
      if (firebaseUser) {
        console.log('Firebase user:', firebaseUser.uid, firebaseUser.email);
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          console.log('User doc exists:', userDoc.exists());
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('User data:', userData);
            setUser({
              email: userData.email || firebaseUser.email || '',
              role: userData.role || 'user',
              name: userData.name || firebaseUser.displayName || 'User',
              uid: firebaseUser.uid
            });
          } else {
            // Fallback if doc doesn't exist yet
            console.log('Using fallback user data');
            setUser({
              email: firebaseUser.email || '',
              role: 'user',
              name: firebaseUser.displayName || 'User',
              uid: firebaseUser.uid
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    console.log('App: showing loading spinner');
    return (
      <div className="min-h-[100dvh] bg-ff-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-ff-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    console.log('App: showing login view');
    return <LoginView />;
  }

  if (user.role === 'admin') {
    console.log('App: showing admin view');
    return <AdminView onLogout={() => auth.signOut()} />;
  }

  console.log('App: showing app layout for user:', user.name, user.uid);
  return <AppLayout onLogout={() => auth.signOut()} userName={user.name} userId={user.uid} />;
}
