'use client'

import React, { useState } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { Button } from '@/app/components/ui/Button'
import { Input } from '@/app/components/ui/Input'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/app/components/ui/Card'
import { Badge } from '@/app/components/ui/Badge'
import { UserRole } from '@/app/types'
import { Mail, Plus, Trash2, ArrowLeft } from 'lucide-react'

interface InviteUserProps {
  onNavigate: (page: string) => void
}

export function InviteUser({ onNavigate }: InviteUserProps) {
  const { invitedUsers, inviteUser, removeUser, user } = useAuth()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<UserRole>('reviewer')
  const [successMsg, setSuccessMsg] = useState('')

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !name) return

    inviteUser(email, name, role)
    setEmail('')
    setName('')
    setSuccessMsg(`Invitation sent to ${email}`)
    setTimeout(() => setSuccessMsg(''), 3000)
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
            Invite and manage users who can access the platform.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Invite Form */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Invite New User
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

                <Button type="submit" className="w-full">
                  Send Invite
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

        {/* User List */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active & Invited Users</CardTitle>
            </CardHeader>

            <div className="divide-y divide-zinc-100">
              {invitedUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 font-medium">
                      {u.name.charAt(0)}
                    </div>

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
                        className={u.role === 'admin' ? 'bg-zinc-800' : ''}
                      >
                        {u.role}
                      </Badge>

                      <span
                        className={`text-xs ${
                          u.status === 'active'
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {u.status === 'active' ? 'Active' : 'Invite Pending'}
                      </span>
                    </div>

                    {u.id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => removeUser(u.id)}
                        title="Remove User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
