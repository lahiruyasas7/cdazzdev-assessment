export type ProjectRole = "MANAGER" | "MEMBER";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  myRole: ProjectRole;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}
