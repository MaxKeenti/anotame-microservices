"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function NewOrderPage() {
  const [items, setItems] = useState<any[]>([{ id: 1, garment: "", service: "", price: 0 }]);

  // Mock addition of items
  const addItem = () => {
    setItems([...items, { id: items.length + 1, garment: "", service: "", price: 0 }]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">New Order</h1>
        <p className="text-muted-foreground">Create a new ticket for a customer.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Customer & Items */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Section 1: Customer */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <Input label="Search Phone" placeholder="55 1234 5678" />
                 <Button variant="outline" className="mt-6 w-full">Check</Button>
              </div>
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-semibold">Or New Customer</p>
                <div className="grid grid-cols-2 gap-4">
                   <Input label="First Name" placeholder="Jane" />
                   <Input label="Last Name" placeholder="Doe" />
                </div>
                <div className="mt-4">
                   <Input label="Note / Preferences" placeholder="e.g. Likes heavy starch" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Order Items</CardTitle>
              <Button size="sm" variant="secondary" onClick={addItem}>+ Add Item</Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {items.map((item, idx) => (
                <div key={item.id} className="p-4 rounded-lg bg-secondary/30 border border-border space-y-4 relative group">
                  <div className="absolute top-2 right-2 text-xs font-bold text-muted-foreground bg-secondary px-2 py-1 rounded">
                    #{idx + 1}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-sm font-medium">Garment Type</label>
                       <select className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                          <option>Select...</option>
                          <option>Pants</option>
                          <option>Shirt</option>
                          <option>Jacket</option>
                          <option>Dress</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium">Service</label>
                       <select className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                          <option>Select...</option>
                          <option>Hemming ($50)</option>
                          <option>Zipper ($80)</option>
                          <option>Patch ($30)</option>
                       </select>
                    </div>
                  </div>
                  <Input label="Item Notes" placeholder="Specific instructions for this item..." />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Summary */}
        <div className="md:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                   <span className="text-muted-foreground">Items</span>
                   <span>{items.length}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-muted-foreground">Subtotal</span>
                   <span>$0.00</span>
                </div>
                <div className="border-t border-border my-2"></div>
                <div className="flex justify-between font-bold text-lg">
                   <span>Total</span>
                   <span className="text-primary">$0.00</span>
                </div>
              </div>
              
              <div className="space-y-2">
                 <label className="text-sm font-medium">Promised Date</label>
                 <input type="date" className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </div>

              <Button className="w-full" size="lg">Create Order</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
