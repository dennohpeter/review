'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Button } from '@/app/components/ui/Button'
import { Input } from '@/app/components/ui/Input'
import { ConfirmModal } from '@/app/components/ui/ConfirmModal'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/app/components/ui/Card'
import { Badge } from '@/app/components/ui/Badge'
import { ReviewerUser, UserRole } from '@/app/types'
import { Mail, Plus, ArrowLeft, Users, Shield, Trash2 } from 'lucide-react'
import { useAuth } from '@/app/hooks'
import { UserAvatar } from '@/app/components/ui/UserAvatar'

interface InviteUserProps {
  onNavigate: (page: string) => void
}

export function InviteUser({ onNavigate }: InviteUserProps) {
  const { user } = useAuth()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<UserRole>('reviewer')

  const [users, setUsers] = useState<ReviewerUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [userToDelete, setUserToDelete] = useState<ReviewerUser | null>(null)

  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const openDeleteModal = (target: ReviewerUser) => {
    if (target.id === user?.id) return
    setUserToDelete(target)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    setDeletingUserId(userToDelete.id)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userToDelete.id,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to delete user')
      }

      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id))
      setSuccessMsg(`Deleted ${userToDelete.email}`)
      setTimeout(() => setSuccessMsg(''), 3000)
      setUserToDelete(null)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setDeletingUserId(null)
    }
  }
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/admin/users')
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to load users')
      }

      const users: ReviewerUser[] = json.users ?? []

      const allUsers: ReviewerUser[] = [
        ...(user
          ? [
              {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role as UserRole,
                avatar: user.avatar,
              },
            ]
          : []),
        ...users.filter((u) => u.id !== user?.id),
      ]

      setUsers(allUsers)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoadingUsers(false)
    }
  }, [user])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleInvite = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email.trim() || !name.trim()) return

    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          role,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to invite user')
      }

      setSuccessMsg(`User created for ${email.trim().toLowerCase()}`)
      setEmail('')
      setName('')
      setRole('reviewer')

      await loadUsers()
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to invite user')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => onNavigate('dashboard')}
          className="pl-0"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Team Management</h1>
          <p className="text-zinc-600">
            Create and manage users who can access the platform.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New User
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleInvite} className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="jane@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">
                    Role
                  </label>

                  <div className="flex bg-zinc-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setRole('reviewer')}
                      className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${
                        role === 'reviewer'
                          ? 'bg-white shadow-sm text-zinc-900'
                          : 'text-zinc-500 hover:text-zinc-700'
                      }`}
                    >
                      Reviewer
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${
                        role === 'admin'
                          ? 'bg-white shadow-sm text-zinc-900'
                          : 'text-zinc-500 hover:text-zinc-700'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" isLoading={submitting}>
                  Create User
                </Button>

                {successMsg && (
                  <p className="text-sm text-emerald-600 text-center bg-emerald-50 p-2 rounded-md">
                    {successMsg}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Users</CardTitle>
            </CardHeader>

            <div className="divide-y divide-zinc-100">
              {loadingUsers ? (
                <div className="p-6 text-sm text-zinc-500">
                  Loading users...
                </div>
              ) : users.length === 0 ? (
                <div className="p-6 text-sm text-zinc-500">No users found.</div>
              ) : (
                users.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar id={u.id} name={u.name} />

                      <div>
                        <div className="font-medium text-zinc-900 flex items-center gap-2">
                          {u.name}
                          {u.id === user?.id && (
                            <span className="text-xs text-zinc-400">(You)</span>
                          )}
                        </div>

                        <div className="text-sm text-zinc-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {u.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant={u.role === 'admin' ? 'default' : 'outline'}
                          className={
                            u.role === 'admin'
                              ? 'bg-zinc-200 text-zinc-800'
                              : ''
                          }
                        >
                          <span className="inline-flex items-center gap-1">
                            {u.role === 'admin' ? (
                              <Shield className="h-3 w-3" />
                            ) : (
                              <Users className="h-3 w-3" />
                            )}
                            {u.role}
                          </span>
                        </Badge>

                        <span className="text-xs text-emerald-600">Active</span>
                      </div>

                      {u.id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-zinc-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete user"
                          onClick={() => openDeleteModal(u)}
                          isLoading={deletingUserId === u.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <ConfirmModal
        open={!!userToDelete}
        title="Delete user?"
        description="This action cannot be undone."
        confirmText="Delete User"
        cancelText="Cancel"
        danger
        loading={deletingUserId === userToDelete?.id}
        onCancel={() => setUserToDelete(null)}
        onConfirm={confirmDeleteUser}
      >
        {userToDelete && (
          <>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="font-medium text-zinc-900">
                {userToDelete.name}
              </div>
              <div className="mt-1 text-sm text-zinc-500">
                {userToDelete.email}
              </div>
              <div className="mt-2">
                <Badge
                  variant={
                    userToDelete.role === 'admin' ? 'default' : 'outline'
                  }
                  className={userToDelete.role === 'admin' ? 'bg-zinc-800' : ''}
                >
                  {userToDelete.role}
                </Badge>
              </div>
            </div>

            <p className="mt-4 text-sm text-zinc-600">
              Deleting this user will remove their account access. Assigned
              tasks may become unassigned depending on your database
              constraints.
            </p>
          </>
        )}
      </ConfirmModal>
    </div>
  )
}
