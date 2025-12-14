"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createCustomer } from "@/services/sales/customers";
import { CustomerDto } from "@/types/dtos";
import { useAuth } from "@/context/AuthContext";

interface CustomerFormProps {
  onSuccess: (customer: CustomerDto) => void;
  onCancel: () => void;
}

export function CustomerForm({ onSuccess, onCancel }: CustomerFormProps) {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const payload: CustomerDto = {
        firstName,
        lastName,
        email,
        phoneNumber: phone
      };

      const result = await createCustomer(payload, token || undefined);
      if (result) {
        onSuccess(result);
      } else {
        setError("Failed to create customer. Please check if email/phone already exists.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-100 rounded-md">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
         <Input 
            label="First Name" 
            placeholder="Jane" 
            required 
            value={firstName} 
            onChange={(e) => setFirstName(e.target.value)} 
         />
         <Input 
            label="Last Name" 
            placeholder="Doe" 
            required 
            value={lastName} 
            onChange={(e) => setLastName(e.target.value)} 
         />
      </div>

      <Input 
         label="Phone Number" 
         placeholder="555-0123" 
         required 
         value={phone} 
         onChange={(e) => setPhone(e.target.value)} 
      />

      <Input 
         label="Email" 
         type="email" 
         placeholder="jane@example.com" 
         value={email} 
         onChange={(e) => setEmail(e.target.value)} 
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Create Customer"}
        </Button>
      </div>
    </form>
  );
}
