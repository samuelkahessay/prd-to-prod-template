import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <AuthGuard>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Studio is authenticated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              GitHub access is ready. Pipeline dashboards and actions can now use
              your token.
            </p>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
