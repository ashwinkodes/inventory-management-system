import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { api } from "@/lib/api";

interface Club {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface ClubContextType {
  clubs: Club[];
  activeClub: Club | null;
  setActiveClub: (club: Club) => void;
  loading: boolean;
}

const ClubContext = createContext<ClubContextType | null>(null);

export function ClubProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [activeClub, setActiveClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Club[]>("/clubs")
      .then((allClubs) => {
        setClubs(allClubs);
        // Auto-select first club the user belongs to
        if (user && allClubs.length > 0) {
          const userClub = allClubs.find((c) => user.clubIds.includes(c.id));
          setActiveClub(userClub || allClubs[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <ClubContext.Provider value={{ clubs, activeClub, setActiveClub, loading }}>
      {children}
    </ClubContext.Provider>
  );
}

export function useClub() {
  const ctx = useContext(ClubContext);
  if (!ctx) throw new Error("useClub must be used within ClubProvider");
  return ctx;
}
