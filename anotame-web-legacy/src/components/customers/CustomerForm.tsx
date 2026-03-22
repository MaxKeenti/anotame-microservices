"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createCustomer, updateCustomer } from "@/services/sales/customers";
import { CustomerDto } from "@/types/dtos";
import { useAuth } from "@/context/AuthContext";

interface CustomerFormProps {
  initialData?: CustomerDto;
  onSuccess: (customer: CustomerDto) => void;
  onCancel: () => void;
}

export function CustomerForm({ initialData, onSuccess, onCancel }: CustomerFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(initialData?.firstName || "");
  const [lastName, setLastName] = useState(initialData?.lastName || "");
  const [phone, setPhone] = useState(initialData?.phoneNumber || "");
  const [email, setEmail] = useState(initialData?.email || "");

  // Update state if initialData changes (e.g. modal re-open with different customer)
  useEffect(() => {
    if (initialData) {
      setFirstName(initialData.firstName);
      setLastName(initialData.lastName);
      setPhone(initialData.phoneNumber);
      setEmail(initialData.email);
    } else {
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const payload: CustomerDto = {
        id: initialData?.id,
        firstName,
        lastName,
        email,
        phoneNumber: phone
      };

      let result;
      if (initialData?.id) {
        result = await updateCustomer(initialData.id, payload);
      } else {
        result = await createCustomer(payload);
      }

      if (result) {
        onSuccess(result);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-destructive-text bg-destructive-muted rounded-md">
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
          {isLoading ? "Saving..." : (initialData ? "Update Customer" : "Create Customer")}
        </Button>
      </div>
    </form>
  );
}
