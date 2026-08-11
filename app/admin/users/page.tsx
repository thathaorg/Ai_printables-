"use client";

import { useEffect, useState } from "react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", plan: "", isAdmin: false });
  const [createForm, setCreateForm] = useState({ email: "", name: "" });

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch("/admin/users/api");
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  }

  async function createUser() {
    const res = await fetch("/admin/users/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    if (res.ok) {
      setCreateForm({ email: "", name: "" });
      fetchUsers();
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this user?")) return;
    await fetch(`/admin/users/api/${id}`, { method: "DELETE" });
    fetchUsers();
  }

  async function saveUser(id: string) {
    const res = await fetch(`/admin/users/api/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      setEditingUserId(null);
      fetchUsers();
    }
  }

  function startEditing(user: any) {
    setEditingUserId(user.id);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      plan: user.plan || "FREE",
      isAdmin: user.isAdmin || false,
    });
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <p className="p-6">Loading users...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Manage Users</h1>

      {/* Create user form */}
      <div className="space-x-2">
        <input
          type="text"
          placeholder="Name"
          value={createForm.name}
          onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="email"
          placeholder="Email"
          value={createForm.email}
          onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
          className="border p-2 rounded"
        />
        <button
          onClick={createUser}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add User
        </button>
      </div>

      {/* Users list */}
      <table className="w-full border mt-4">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Plan</th>
            <th className="p-2 border">Admin</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-4 text-center">
                No users found
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.id} className="border-t">
                {editingUserId === u.id ? (
                  <>
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="border p-1 rounded w-full"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="border p-1 rounded w-full"
                      />
                    </td>
                    <td className="p-2 border">
                      <select
                        value={editForm.plan}
                        onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                        className="border p-1 rounded w-full"
                      >
                        <option value="FREE">FREE</option>
                        <option value="PREMIUM">PREMIUM</option>
                      </select>
                    </td>
                    <td className="p-2 border text-center">
                      <input
                        type="checkbox"
                        checked={editForm.isAdmin}
                        onChange={(e) => setEditForm({ ...editForm, isAdmin: e.target.checked })}
                      />
                    </td>
                    <td className="p-2 border space-x-2">
                      <button
                        onClick={() => saveUser(u.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingUserId(null)}
                        className="bg-gray-300 text-black px-3 py-1 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2 border">{u.name || "—"}</td>
                    <td className="p-2 border">{u.email}</td>
                    <td className="p-2 border">{u.plan}</td>
                    <td className="p-2 border text-center">{u.isAdmin ? "✅" : "❌"}</td>
                    <td className="p-2 border space-x-3">
                      <button
                        onClick={() => startEditing(u)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
