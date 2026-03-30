export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  color: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  { id: "pepe", name: "Pepe Del Castano", initials: "PC", color: "bg-blue-500" },
  { id: "alex", name: "Alex Gabriel", initials: "AG", color: "bg-emerald-500" },
];

const STORAGE_KEY = "melow_current_user";

export function getCurrentUser(): TeamMember | null {
  if (typeof window === "undefined") return null;
  const id = localStorage.getItem(STORAGE_KEY);
  return TEAM_MEMBERS.find((m) => m.id === id) || null;
}

export function setCurrentUser(id: string): void {
  localStorage.setItem(STORAGE_KEY, id);
}

export function getMemberByName(name: string): TeamMember | undefined {
  return TEAM_MEMBERS.find(
    (m) => m.name.toLowerCase() === name.toLowerCase() || m.id === name
  );
}
