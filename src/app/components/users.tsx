import { useEffect, useState } from "react";
import { useApp } from "../context/app-context";
import { supabase } from "../../lib/supabase";
import { User, UserRole } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Shield, Eye, EyeOff } from "lucide-react";
import { Badge } from "./ui/badge";

export function Users() {
  const { users, setUsers, currentUser } = useApp();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "Staff" as UserRole,
  });

  const isAdmin = currentUser?.role === "Admin";
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadUsersFromSupabase = async () => {
    setLoadingUsers(true);
    setFetchError(null);

    const { data, error } = await supabase.from("users").select("*");

    if (error) {
      console.error("Unable to load users:", error);
      setFetchError(error.message);
      setLoadingUsers(false);
      return;
    }

    if (data) {
      const mappedUsers: User[] = data.map((user: any) => ({
        id: user.id.toString(),
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      }));
      setUsers(mappedUsers);
    }

    setLoadingUsers(false);
  };

  useEffect(() => {
    if (isAdmin && users.length === 0) {
      void loadUsersFromSupabase();
    }
  }, [isAdmin, users.length]);

  if (!isAdmin) {
    return (
      <div className="p-8">
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-500">
              You need Admin privileges to manage users.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (users.some((u) => u.username === formData.username)) {
      toast.error("Username already exists");
      return;
    }

    if (users.some((u) => u.email === formData.email)) {
      toast.error("Email already exists");
      return;
    }

    const { data: emailData, error: emailError } = await supabase
      .from("users")
      .select("id")
      .eq("email", formData.email)
      .limit(1);

    if (emailError) {
      console.error(emailError);
      toast.error("Failed to check email. Please try again.");
      return;
    }

    if (emailData && emailData.length > 0) {
      toast.error("Email already exists");
      return;
    }

    const { data: usernameData, error: usernameError } = await supabase
      .from("users")
      .select("id")
      .eq("username", formData.username)
      .limit(1);

    if (usernameError) {
      console.error(usernameError);
      toast.error("Failed to check username. Please try again.");
      return;
    }

    if (usernameData && usernameData.length > 0) {
      toast.error("Username already exists");
      return;
    }

    const { data, error } = await supabase.from("users").insert([{
      username: formData.username,
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    }]).select();

    if (error || !data || data.length === 0) {
      console.error(error);
      toast.error(`Failed to create user account: ${error?.message || 'Unknown error'}`);
      return;
    }

    const newUser: User = {
      id: data[0].id.toString(),
      name: formData.name,
      username: formData.username,
      email: formData.email,
      role: formData.role,
    };

    setUsers([...users, newUser]);
    toast.success("User added successfully");
    setIsAddDialogOpen(false);
    setFormData({ name: "", username: "", email: "", password: "", role: "Staff" });
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;

    if (users.some((u) => u.username === formData.username && u.id !== editingUser.id)) {
      toast.error("Username already exists");
      return;
    }

    if (users.some((u) => u.email === formData.email && u.id !== editingUser.id)) {
      toast.error("Email already exists");
      return;
    }

    const updateData: any = {
      name: formData.name,
      username: formData.username,
      email: formData.email,
      role: formData.role,
    };

    // Only update password if a new one is provided
    if (formData.password.trim()) {
      updateData.password = formData.password;
    }

    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", parseInt(editingUser.id, 10));

    if (error) {
      console.error(error);
      toast.error("Failed to update user");
      return;
    }

    const updatedUsers = users.map((u) =>
      u.id === editingUser.id
        ? {
            ...u,
            name: formData.name,
            username: formData.username,
            email: formData.email,
            role: formData.role,
          }
        : u
    );

    setUsers(updatedUsers);
    toast.success("User updated successfully");
    setIsEditDialogOpen(false);
    setEditingUser(null);
    setFormData({ name: "", username: "", email: "", password: "", role: "Staff" });
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    if (confirm("Are you sure you want to delete this user?")) {
      // Delete from users table
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", parseInt(userId, 10));

      if (error) {
        console.error(error);
        toast.error("Failed to delete user");
        return;
      }

      setUsers(users.filter((u) => u.id !== userId));
      toast.success("User deleted successfully");
    }
  };

  const openEditDialog = async (user: User) => {
    setEditingUser(user);
    
    // Fetch current password from database
    const { data, error } = await supabase
      .from("users")
      .select("password")
      .eq("id", parseInt(user.id, 10))
      .single();

    if (error) {
      console.error("Failed to fetch user password:", error);
      toast.error("Failed to load user data");
      return;
    }

    setFormData({
      name: user.name,
      username: user.username,
      email: user.email || "",
      password: data.password,
      role: user.role,
    });
    setShowPassword(false); // Reset password visibility
    setIsEditDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "Admin":
        return "default";
      case "Staff":
        return "bg-blue-500 text-white hover:bg-blue-600";
      case "Cashier":
        return "bg-green-500 text-white hover:bg-green-600";
    }
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Users</h1>
          <p className="text-gray-500">Manage system users and roles</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account for the system.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                  placeholder="johndoe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: UserRole) =>
                    setFormData({ ...formData, role: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="Cashier">Cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Add User
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[600px] overflow-y-auto">
            {loadingUsers ? (
              <div className="p-8 text-center text-sm text-gray-500">
                Loading users...
              </div>
            ) : fetchError ? (
              <div className="p-8 text-center text-sm text-red-500">
                Failed to load users: {fetchError}
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No users found. Please add a user or check your database permissions.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name}
                        {user.id === currentUser?.id && (
                          <Badge variant="outline" className="ml-2">
                            You
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.id === currentUser?.id}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditingUser(null);
          setShowPassword(false);
          setFormData({ name: "", username: "", email: "", password: "", role: "Staff" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user account information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Password</Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  className={`pr-10 ${showPassword ? "opacity-75" : ""}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent ${showPassword ? "opacity-60" : ""}`}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 opacity-60" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) =>
                  setFormData({ ...formData, role: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                  <SelectItem value="Cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingUser(null);
                  setShowPassword(false);
                  setFormData({ name: "", username: "", email: "", password: "", role: "Staff" });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}