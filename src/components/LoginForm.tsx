
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface LoginFormProps {
  onLogin: (credentials: {
    serverName: string;
    bearerToken: string;
    rememberMe: boolean;
  }) => void;
}

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [serverName, setServerName] = useState('');
  const [bearerToken, setBearerToken] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serverName.trim() || !bearerToken.trim()) {
      return;
    }

    setIsLoading(true);
    
    // Simulate API validation delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onLogin({
      serverName: serverName.trim(),
      bearerToken: bearerToken.trim(),
      rememberMe
    });
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Map Alert System</CardTitle>
          <CardDescription>
            Enter your server credentials to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serverName">Server Name</Label>
              <Input
                id="serverName"
                type="text"
                placeholder="comapeo.example"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bearerToken">Bearer Token</Label>
              <Input
                id="bearerToken"
                type="password"
                placeholder="Enter your bearer token"
                value={bearerToken}
                onChange={(e) => setBearerToken(e.target.value)}
                required
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label htmlFor="rememberMe" className="text-sm">
                Remember me
              </Label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !serverName.trim() || !bearerToken.trim()}
            >
              {isLoading ? 'Connecting...' : 'Connect'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
