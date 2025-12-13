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
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Anotame<span className="text-primary">.</span>
          </h1>
          <CardTitle>Create an account</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your details to get started
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="First Name" 
                name="firstName"
                placeholder="John" 
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <Input 
                label="Last Name" 
                name="lastName"
                placeholder="Doe" 
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <Input 
              label="Email" 
              name="email"
              type="email"
              placeholder="john@example.com" 
              value={formData.email}
              onChange={handleChange}
              required
            />

            <Input 
              label="Username" 
              name="username"
              placeholder="johndoe" 
              value={formData.username}
              onChange={handleChange}
              required
            />

            <Input 
              label="Password" 
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
              {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>
            
            <div className="text-center text-sm pt-2">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="text-primary font-medium hover:underline transition-colors">
                Sign in
              </Link>
            </div>
            
             <div className="text-center text-sm">
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  &larr; Back to Home
                </Link>
             </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
