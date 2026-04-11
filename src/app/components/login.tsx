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
  const { currentUser, setCurrentUser } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const userInput = emailOrUsername.trim();
    const passwordInput = password.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInput);

    const { data: userData, error: userError } = isEmail
      ? await supabase.from("users").select("*").ilike("email", userInput).maybeSingle()
      : await supabase.from("users").select("*").eq("username", userInput).maybeSingle();

    console.debug("Login query result:", { isEmail, userInput, passwordInput, userData, userError });

    if (userError) {
      console.error("Login lookup error:", userError);
      toast.error(`Login error: ${userError.message}`);
      return;
    }

    if (!userData) {
      toast.error("Invalid email or password");
      return;
    }

    const user = userData;

    if (user.password !== passwordInput) {
      toast.error("Invalid email or password");
      return;
    }

    const loggedInUser = {
      id: user.id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    setCurrentUser(loggedInUser);
    console.log("Login successful, currentUser set:", loggedInUser);
    toast.success(`Welcome back, ${loggedInUser.name}!`);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-amber-500 flex items-center justify-center">
              <Egg className="h-8 w-8 text-white" />
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
          <div className="mt-4 text-center">
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
