import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useApp } from "../context/app-context";
import { supabase } from "../../lib/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { toast } from "sonner";
import { ArrowLeft, Key } from "lucide-react";

export function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const { users, currentUser } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = users.find(
      (u) => u.email === identifier || u.username === identifier,
    );

    if (!user?.email) {
      toast.error("Email or username not found");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(user.email);

    if (error) {
      console.error(error);
      toast.error("Unable to send password reset email. Please try again.");
      return;
    }

    toast.success(
      "Password reset email sent. Check your inbox and follow the instructions to reset your password.",
    );
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-amber-500 flex items-center justify-center">
              <Key className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email or username to receive a password reset email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or Username</Label>
              <Input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="Enter your email or username"
              />
            </div>
            <Button type="submit" className="w-full">
              Send reset email
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}