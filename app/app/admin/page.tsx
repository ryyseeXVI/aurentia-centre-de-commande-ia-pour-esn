"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Loader2,
  Pencil,
  Plus,
  Shield,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  role: string;
  status: string;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

interface Consultant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string | null;
  statut: string;
  taux_journalier_cout: number;
  date_embauche: string;
}

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newOrgDialogOpen, setNewOrgDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editFormData, setEditFormData] = useState({
    role: "",
  });

  const [newOrgFormData, setNewOrgFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (!authLoading && profile?.role !== "ADMIN") {
      router.push("/app");
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
    }
  }, [user, profile, authLoading, router, toast]);

  useEffect(() => {
    if (profile?.role === "ADMIN") {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all users
      const usersRes = await fetch("/api/admin/users");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      // Fetch all organizations
      const orgsRes = await fetch("/api/organizations");
      if (orgsRes.ok) {
        const orgsData = await orgsRes.json();
        setOrganizations(orgsData.organizations || []);
      }

      // Fetch all consultants
      const consultantsRes = await fetch("/api/admin/consultants");
      if (consultantsRes.ok) {
        const consultantsData = await consultantsRes.json();
        setConsultants(consultantsData.consultants || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditFormData({ role: user.role });
    setEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleCreateOrganization = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrgFormData),
      });

      if (!response.ok) {
        throw new Error("Failed to create organization");
      }

      toast({
        title: "Success",
        description: "Organization created successfully",
      });

      setNewOrgDialogOpen(false);
      setNewOrgFormData({ name: "", slug: "", description: "" });
      fetchData();
    } catch (error) {
      console.error("Error creating organization:", error);
      toast({
        title: "Error",
        description: "Failed to create organization",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-64 w-full max-w-4xl" />
      </div>
    );
  }

  if (profile?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage users, organizations, and consultants
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="organizations">
            <Building2 className="mr-2 h-4 w-4" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="consultants">
            <UserCog className="mr-2 h-4 w-4" />
            Consultants
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="border-l-4 border-l-chart-1">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-chart-1/10 rounded-lg">
                  <Users className="h-5 w-5 text-chart-1" />
                </div>
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage user accounts, roles, and permissions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {users.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-accent/50">
                        <TableCell className="font-medium">
                          {user.prenom} {user.nom}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.status === "online" ? "default" : "secondary"
                            }
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditUser(user)}
                              className="hover:bg-primary hover:text-primary-foreground"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(user.id)}
                              className="hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto h-16 w-16 rounded-full bg-chart-1/10 flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-chart-1" />
                  </div>
                  <p className="text-sm font-medium mb-1">No users found</p>
                  <p className="text-xs text-muted-foreground">
                    Users will appear here once registered
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organizations Tab */}
        <TabsContent value="organizations">
          <Card className="border-l-4 border-l-chart-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-chart-2/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <CardTitle>Client Organizations</CardTitle>
                  <CardDescription>
                    Manage client companies and their information
                  </CardDescription>
                </div>
              </div>
              <Dialog open={newOrgDialogOpen} onOpenChange={setNewOrgDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Organization
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Organization</DialogTitle>
                    <DialogDescription>
                      Add a new client company to the system
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Organization Name</Label>
                      <Input
                        id="name"
                        value={newOrgFormData.name}
                        onChange={(e) =>
                          setNewOrgFormData({
                            ...newOrgFormData,
                            name: e.target.value,
                          })
                        }
                        placeholder="Acme Corporation"
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        value={newOrgFormData.slug}
                        onChange={(e) =>
                          setNewOrgFormData({
                            ...newOrgFormData,
                            slug: e.target.value,
                          })
                        }
                        placeholder="acme-corp"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={newOrgFormData.description}
                        onChange={(e) =>
                          setNewOrgFormData({
                            ...newOrgFormData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Technology company"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreateOrganization}
                      disabled={saving || !newOrgFormData.name}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {organizations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((org) => (
                      <TableRow key={org.id} className="hover:bg-accent/50">
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">{org.slug}</TableCell>
                        <TableCell className="text-muted-foreground">{org.description || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(org.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto h-16 w-16 rounded-full bg-chart-2/10 flex items-center justify-center mb-4">
                    <Building2 className="h-8 w-8 text-chart-2" />
                  </div>
                  <p className="text-sm font-medium mb-1">No organizations yet</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Create your first client organization
                  </p>
                  <Button onClick={() => setNewOrgDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Organization
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consultants Tab */}
        <TabsContent value="consultants">
          <Card className="border-l-4 border-l-chart-3">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-chart-3/10 rounded-lg">
                  <UserCog className="h-5 w-5 text-chart-3" />
                </div>
                <div>
                  <CardTitle>Consultant Management</CardTitle>
                  <CardDescription>
                    View and manage all consultants in the ESN
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {consultants.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Daily Rate</TableHead>
                      <TableHead>Hire Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consultants.map((consultant) => (
                      <TableRow key={consultant.id} className="hover:bg-accent/50">
                        <TableCell className="font-medium">
                          {consultant.prenom} {consultant.nom}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{consultant.email}</TableCell>
                        <TableCell className="text-muted-foreground">{consultant.role || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              consultant.statut === "actif"
                                ? "default"
                                : "secondary"
                            }
                            className="capitalize"
                          >
                            {consultant.statut}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          €{consultant.taux_journalier_cout}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(consultant.date_embauche).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto h-16 w-16 rounded-full bg-chart-3/10 flex items-center justify-center mb-4">
                    <UserCog className="h-8 w-8 text-chart-3" />
                  </div>
                  <p className="text-sm font-medium mb-1">No consultants found</p>
                  <p className="text-xs text-muted-foreground">
                    Consultants will appear here once added to the system
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user role and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, role: value })
                }
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="CONSULTANT">Consultant</SelectItem>
                  <SelectItem value="CLIENT">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveUser} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
