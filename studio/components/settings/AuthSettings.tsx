'use client';

import { useAuthStatus } from '@/lib/queries/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TokenInput } from '@/components/auth/TokenInput';
import { CheckCircle2, AlertCircle, User } from 'lucide-react';
import type { PublicAuthState } from '@/lib/auth/types';

function getAuthMethodLabel(method: string): string {
  switch (method) {
    case 'gh-cli':
      return 'GitHub CLI';
    case 'env':
      return 'Environment Variable (.env)';
    case 'pat':
      return 'Browser Token (PAT)';
    default:
      return method;
  }
}

function ScopeStatus({ missingScopes }: { missingScopes: string[] }) {
  const hasAllScopes = missingScopes.length === 0;
  
  return (
    <div className="flex items-center gap-2">
      {hasAllScopes ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-600">All required scopes present</span>
        </>
      ) : (
        <>
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-600">
            Missing scopes: {missingScopes.join(', ')}
          </span>
        </>
      )}
    </div>
  );
}

function AuthInfo({ auth }: { auth: PublicAuthState }) {
  const isPat = auth.method === 'pat';
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {auth.user.avatar_url ? (
          <img 
            src={auth.user.avatar_url} 
            alt={auth.user.login}
            className="h-10 w-10 rounded-full"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <User className="h-5 w-5" />
          </div>
        )}
        <div>
          <p className="font-medium">{auth.user.login}</p>
          {auth.user.name ? (
            <p className="text-sm text-muted-foreground">{auth.user.name}</p>
          ) : null}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Auth Method</span>
          <Badge variant="outline">{getAuthMethodLabel(auth.method)}</Badge>
        </div>
        
        <ScopeStatus missingScopes={auth.missingScopes} />
      </div>
      
      {isPat ? (
        <div className="border-t pt-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Update your token below:
          </p>
          <TokenInput
            onAuthenticated={() => {
              window.location.reload();
            }}
          />
        </div>
      ) : (
        <div className="rounded-md bg-muted p-3 text-sm">
          Authenticated via {getAuthMethodLabel(auth.method)}
        </div>
      )}
    </div>
  );
}

export function AuthSettings() {
  const { data, isLoading, error } = useAuthStatus();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>Loading authentication status...</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  if (error || !data?.authenticated || !data.user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connect GitHub</CardTitle>
          <CardDescription>
            Studio tries GitHub CLI first, then GITHUB_TOKEN, then a Personal Access Token.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TokenInput
            onAuthenticated={() => {
              window.location.reload();
            }}
          />
        </CardContent>
      </Card>
    );
  }
  
  const auth: PublicAuthState = {
    method: data.method as 'gh-cli' | 'env' | 'pat',
    user: {
      id: 0,
      login: data.user.login,
      name: data.user.name,
      avatar_url: data.user.avatar_url,
      html_url: `https://github.com/${data.user.login}`,
    },
    scopes: [],
    missingScopes: data.warnings || [],
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication</CardTitle>
        <CardDescription>Your GitHub authentication status</CardDescription>
      </CardHeader>
      <CardContent>
        <AuthInfo auth={auth} />
      </CardContent>
    </Card>
  );
}
