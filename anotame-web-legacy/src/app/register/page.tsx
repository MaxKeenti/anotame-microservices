"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const { register, isLoading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: ""
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register(formData);
    } catch (err) {
      // Error logging is handled in context, but we show user feedback here
      setError("Registration failed. Please check your inputs.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Anotame<span className="text-primary">.</span>
          </h1>
          <CardTitle>Crear una cuenta</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ingresa tus datos para comenzar
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive-muted text-destructive-text p-3 rounded-md text-sm text-center">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre"
                name="firstName"
                placeholder="Juan"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <Input
                label="Apellido"
                name="lastName"
                placeholder="Pérez"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              label="Correo Electrónico"
              name="email"
              type="email"
              placeholder="juan@ejemplo.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <Input
              label="Usuario"
              name="username"
              placeholder="juanperez"
              value={formData.username}
              onChange={handleChange}
              required
            />

            <Input
              label="Contraseña"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Creando Cuenta..." : "Registrarse"}
            </Button>

            <div className="text-center text-sm pt-2">
              <span className="text-muted-foreground">¿Ya tienes una cuenta? </span>
              <Link href="/login" className="text-primary font-medium hover:underline transition-colors">
                Inicia Sesión
              </Link>
            </div>

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
