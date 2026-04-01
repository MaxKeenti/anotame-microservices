"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Link from "next/link";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ username, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Anotame<span className="text-primary">.</span>
          </h1>
          <CardTitle>Inicia sesión en tu cuenta</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ingresa tus credenciales para acceder
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Usuario"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Iniciando..." : "Iniciar Sesión"}
            </Button>

            <div className="text-center text-sm">
              <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                &larr; Volver al Inicio
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
