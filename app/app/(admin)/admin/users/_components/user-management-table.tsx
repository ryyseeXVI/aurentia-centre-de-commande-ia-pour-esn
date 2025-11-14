"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Pencil, Trash2, Users, Circle } from "lucide-react";
import { DataTableToolbar } from "@/app/app/(admin)/admin/_components/data-table-toolbar";
import { DataTablePagination } from "@/app/app/(admin)/admin/_components/data-table-pagination";
import { BulkActionsToolbar } from "@/app/app/(admin)/admin/_components/bulk-actions-toolbar";
import { EmptyState } from "@/app/app/(admin)/admin/_components/empty-state";
import { DeleteConfirmationDialog } from "@/app/app/(admin)/admin/_components/delete-confirmation-dialog";
import { UserFormDialog } from "./user-form-dialog";
import { BulkUpdateRoleDialog } from "./bulk-update-role-dialog";

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "CONSULTANT" | "CLIENT";
  status: "online" | "offline" | "away";
  phone: string | null;
  organization_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  last_seen: string | null;
}

/**
 * Calculate user's online status based on last_seen timestamp
 */
function calculateOnlineStatus(lastSeen: string | null): "online" | "away" | "offline" {
  if (!lastSeen) return "offline";

  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const minutesAgo = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);

  // Online: active within last 5 minutes
  if (minutesAgo < 5) return "online";

  // Away: active within last 30 minutes
  if (minutesAgo < 30) return "away";

  // Offline: inactive for more than 30 minutes
  return "offline";
}

interface Organization {
  id: string;
  name: string;
}

interface UserManagementTableProps {
  initialUsers: User[];
  organizations: Organization[];
}

export function UserManagementTable({
  initialUsers,
  organizations,
}: UserManagementTableProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Dialog states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkRoleDialog, setShowBulkRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter and search
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchLower = search.toLowerCase();
      return (
        user.email.toLowerCase().includes(searchLower) ||
        user.nom.toLowerCase().includes(searchLower) ||
        user.prenom.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower)
      );
    });
  }, [users, search]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedUserIds.length === paginatedUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(paginatedUsers.map((u) => u.id));
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Edit user
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };

  const handleUpdateSuccess = () => {
    toast.success("User updated successfully");
    router.refresh();
    setShowEditDialog(false);
    setSelectedUser(null);
  };

  // Delete user
  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }

      toast.success("User deleted successfully");
      router.refresh();
      setShowDeleteDialog(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "bulk_delete",
          user_ids: selectedUserIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete users");
      }

      const result = await response.json();
      toast.success(`${result.deleted} users deleted successfully`);
      setSelectedUserIds([]);
      router.refresh();
      setShowBulkDeleteDialog(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk update role
  const handleBulkRoleUpdate = async (role: string) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "bulk_update_roles",
          user_ids: selectedUserIds,
          role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update roles");
      }

      const result = await response.json();
      toast.success(`${result.updated} users updated to ${role}`);
      setSelectedUserIds([]);
      router.refresh();
      setShowBulkRoleDialog(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "OWNER":
        return "destructive";
      case "ADMIN":
        return "destructive";
      case "MANAGER":
        return "default";
      case "CONSULTANT":
        return "secondary";
      case "CLIENT":
        return "outline";
      default:
        return "default";
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-500";
      case "away":
        return "text-yellow-500";
      case "offline":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  if (users.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No users found"
        description="Users will appear here once they sign up"
      />
    );
  }

  return (
    <div className="space-y-4">
      <DataTableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        placeholder="Search users by name, email, or role..."
      />

      {selectedUserIds.length > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedUserIds.length}
          onClearSelection={() => setSelectedUserIds([])}
          onDelete={() => setShowBulkDeleteDialog(true)}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkRoleDialog(true)}
          >
            Change Role
          </Button>
        </BulkActionsToolbar>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    paginatedUsers.length > 0 &&
                    selectedUserIds.length === paginatedUsers.length
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No users match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => {
                const org = organizations.find((o) => o.id === user.organization_id);
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUserIds.includes(user.id)}
                        onCheckedChange={() => toggleSelectUser(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Circle className={`h-2 w-2 fill-current ${getStatusColor(calculateOnlineStatus(user.last_seen))}`} />
                        <div>
                          <div className="font-medium">
                            {user.prenom} {user.nom}
                          </div>
                          {user.phone && (
                            <div className="text-xs text-muted-foreground">
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize text-sm">
                      {calculateOnlineStatus(user.last_seen)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {org ? org.name : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {filteredUsers.length > pageSize && (
        <DataTablePagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredUsers.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Edit User Dialog */}
      {selectedUser && (
        <UserFormDialog
          user={selectedUser}
          organizations={organizations}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {/* Delete User Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        title="Delete User"
        description="Are you sure you want to delete this user? This will remove all their data and cannot be undone."
        itemName={selectedUser ? `${selectedUser.prenom} ${selectedUser.nom} (${selectedUser.email})` : ""}
        isDeleting={isDeleting}
      />

      {/* Bulk Delete Dialog */}
      <DeleteConfirmationDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        onConfirm={handleBulkDelete}
        title="Delete Multiple Users"
        description={`Are you sure you want to delete ${selectedUserIds.length} users? This will remove all their data and cannot be undone.`}
        isDeleting={isDeleting}
      />

      {/* Bulk Update Role Dialog */}
      <BulkUpdateRoleDialog
        open={showBulkRoleDialog}
        onOpenChange={setShowBulkRoleDialog}
        onConfirm={handleBulkRoleUpdate}
        selectedCount={selectedUserIds.length}
      />
    </div>
  );
}
