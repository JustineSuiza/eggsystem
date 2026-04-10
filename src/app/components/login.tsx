import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useApp } from "../context/app-context";
import { supabase } from "../../lib/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { toast } from "sonner";
import { Egg } from "lucide-react";

export function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const { users, setCurrentUser, currentUser } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = users.find(
      (u) => u.email === emailOrUsername || u.username === emailOrUsername,
    );

    if (!user) {
      toast.error("Invalid email or password");
      return;
    }

    if (!user.email) {
      toast.error("No email found for this account. Please use a Supabase-backed account.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (error || !data.session) {
      console.error(error);
      toast.error("Invalid email or password");
      return;
    }

    setCurrentUser(user);
    toast.success(`Welcome back, ${user.name}!`);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-amber-500 flex items-center justify-center overflow-hidden">
              <img
                src="/egg-logo_535345-3522.avif"
                alt="Egg Logo"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <CardTitle className="text-2xl">Egg Inventory System</CardTitle>
          <CardDescription>
            Enter your credentials to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailOrUsername">Email or Username</Label>
              <Input
                id="emailOrUsername"
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end mb-4">
              <Link to="/forgot-password" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                Forgot Password?
              </Link>
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-amber-600 hover:text-amber-700 font-medium">
                Create Account
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
