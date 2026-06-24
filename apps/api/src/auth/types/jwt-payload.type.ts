import { GlobalRole } from "src/generated/prisma/enums";


export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: GlobalRole;
}
