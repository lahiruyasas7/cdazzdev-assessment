// Mirrors apps/api/src/auth/dto/auth-response.dto.ts's GlobalRole values.
export type GlobalRole = "ADMIN" | "MANAGER" | "MEMBER";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: GlobalRole;
  createdAt: string; // ISO string over the wire, not a Date instance
}

// Matches AuthResponseDto from the API exactly.
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// The shape OUR OWN Route Handlers return to the browser — notably
// WITHOUT accessToken/refreshToken, since those are set as httpOnly
// cookies on this same response, never exposed in the JSON body the
// client-side JS can read.
export interface AuthSessionResponse {
  user: AuthUser;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  path: string;
  timestamp: string;
}

// Matches RefreshResponseDto from the API exactly.
export interface RefreshResponseDto {
  accessToken: string;
}
