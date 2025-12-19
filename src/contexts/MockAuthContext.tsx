import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const MockAuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export const useMockAuth = () => useContext(MockAuthContext);

// Mock user for testing
const mockUser: User = {
  id: 'mock-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: { username: 'testuser' },
  aud: 'authenticated',
  confirmation_sent_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  email_confirmed_at: new Date().toISOString(),
  phone_confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  role: 'authenticated',
  updated_at: new Date().toISOString()
};

export const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Mock sign in:', email);
    // Simulate successful login
    setUser(mockUser);
    setSession({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      expires_at: Date.now() + 3600000,
      token_type: 'bearer',
      user: mockUser
    });
  };

  const signUp = async (email: string, password: string, username: string) => {
    console.log('Mock sign up:', email, username);
    // Simulate successful signup
    setUser(mockUser);
    setSession({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      expires_at: Date.now() + 3600000,
      token_type: 'bearer',
      user: mockUser
    });
  };

  const signOut = async () => {
    console.log('Mock sign out');
    setUser(null);
    setSession(null);
  };

  return (
    <MockAuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </MockAuthContext.Provider>
  );
};