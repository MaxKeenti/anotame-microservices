"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface CredentialsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CredentialsModal({ isOpen, onClose }: CredentialsModalProps) {
    const { user, changeCredentials } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        currentPassword: "",
        newUsername: user?.username || "",
        newPassword: "",
        confirmPassword: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
        setSuccess("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!formData.currentPassword) {
            setError("Current password is required");
            return;
        }

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        setLoading(true);
        try {
            await changeCredentials({
                currentPassword: formData.currentPassword,
                newUsername: formData.newUsername !== user?.username ? formData.newUsername : undefined,
                newPassword: formData.newPassword || undefined
            });
            setSuccess("Credentials updated successfully!");
            setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
            // Optional: Close modal after success
            // setTimeout(onClose, 2000);
        } catch (e: any) {
            setError(e.message || "Failed to update credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Update Credentials"
            description="Enter your current password to make changes."
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}
                {success && <div className="p-3 text-sm text-primary bg-primary/10 rounded-md">{success}</div>}

                <div className="space-y-2">
                    <label className="text-sm font-medium">Username</label>
                    <Input
                        name="newUsername"
                        value={formData.newUsername}
                        onChange={handleChange}
                        placeholder="Username"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Current Password <span className="text-destructive">*</span></label>
                    <Input
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        placeholder="Current Password"
                        required
                    />
                </div>

                <hr className="border-border my-4" />
                <p className="text-xs text-muted-foreground">Leave blank to keep current password.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">New Password</label>
                        <Input
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            placeholder="New Password"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Confirm Password</label>
                        <Input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm New Password"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Updating..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
