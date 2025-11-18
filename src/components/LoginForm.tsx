import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LoginFormProps {
  onLogin: (credentials: {
    serverName: string;
    bearerToken: string;
    rememberMe: boolean;
  }) => Promise<void>;
  error?: string | null;
}

export const LoginForm = ({ onLogin, error }: LoginFormProps) => {
  const { t } = useTranslation();
  const [serverName, setServerName] = useState("");
  const [bearerToken, setBearerToken] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!serverName.trim() || !bearerToken.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      await onLogin({
        serverName: serverName.trim(),
        bearerToken: bearerToken.trim(),
        rememberMe,
      });
    } catch (err) {
      // Error is handled by parent component
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t("auth.title")}
          </CardTitle>
          <CardDescription>{t("auth.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serverName">{t("auth.serverName")}</Label>
              <Input
                id="serverName"
                type="text"
                placeholder={t("auth.serverNamePlaceholder")}
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bearerToken">{t("auth.bearerToken")}</Label>
              <Input
                id="bearerToken"
                type="password"
                placeholder={t("auth.bearerTokenPlaceholder")}
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
                {t("auth.rememberMe")}
              </Label>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !serverName.trim() || !bearerToken.trim()}
            >
              {isLoading ? t("auth.connecting") : t("auth.connect")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
