export type AuthMethod = 'gh-cli' | 'env' | 'pat';

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
}

export interface AuthState {
  token: string;
  method: AuthMethod;
  user: GitHubUser;
  scopes: string[];
  missingScopes: string[];
}

export type PublicAuthState = Omit<AuthState, 'token'>;

export interface ResolvedAuthToken {
  token: string;
  method: AuthMethod;
}
