import { createContext, useContext, useState } from 'react';
import { getAuth, setAuth } from './api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [auth, setState] = useState(getAuth());
  const save = (a) => { setAuth(a); setState(a); };
  return <Ctx.Provider value={{ user: auth?.user, login: save, logout: () => save(null) }}>{children}</Ctx.Provider>;
}
