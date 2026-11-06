import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Shield,
  Mail,
  CheckCircle2,
  Trash2,
  UserPlus,
  ShieldAlert,
  X,
} from 'lucide-react';
import { TeamMember } from '../../types';
import { AppState, storageService } from '../../services/storage';

interface TeamPageProps {
  state: AppState;
}

export const TeamPage: React.FC<TeamPageProps> = ({ state }) => {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('Collection Specialist');

  const permissionsMatrix = [
    { permission: 'View Financial Dashboard & Reports', Admin: true, 'Finance Manager': true, 'Collection Specialist': true, Auditor: true },
    { permission: 'Create & Edit Invoices', Admin: true, 'Finance Manager': true, 'Collection Specialist': true, Auditor: false },
    { permission: 'Record & Reconcile Payments', Admin: true, 'Finance Manager': true, 'Collection Specialist': false, Auditor: false },
    { permission: 'Dispatch Automated WhatsApp/Email Reminders', Admin: true, 'Finance Manager': true, 'Collection Specialist': true, Auditor: false },
    { permission: 'Delete Accounts & Modify Integrations', Admin: true, 'Finance Manager': false, 'Collection Specialist': false, Auditor: false },
  ];

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    storageService.addTeamMember({
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      assignedCustomersCount: 0,
      assignedInvoicesCount: 0,
      recoveryRate: 0,
      status: 'Active',
    });

    setInviteName('');
    setInviteEmail('');
    setIsInviteOpen(false);
  };

  const handleDeleteMember = (id: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      storageService.deleteTeamMember(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Team Management & RBAC</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage finance collectors, role-based access permissions, and debtor assignments
          </p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="py-2 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
        >
          <UserPlus size={16} />
          <span>Invite Team Member</span>
        </button>
      </div>

      {/* Team Member Table */}
      <div className="bg-white rounded-2xl border border-[#e8e9f5] shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Active Finance Personnel</h3>
          <span className="text-xs text-slate-400 font-medium">
            {state.teamMembers.length} Members Enrolled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9fe] border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3 text-center">Assigned Debtors</th>
                <th className="py-3 px-3 text-center">Recovery Rate</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.teamMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No team members enrolled yet. Click "Invite Team Member" to add collaborators.
                  </td>
                </tr>
              ) : (
                state.teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-xs">
                        {member.name.charAt(0)}
                      </div>
                      <span className="font-extrabold text-slate-900">{member.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{member.email}</td>
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-[11px]">
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                    {member.assignedCustomersCount} accounts ({member.assignedInvoicesCount} invoices)
                  </td>
                  <td className="py-3.5 px-3 text-center font-black text-emerald-600">
                    {member.recoveryRate}%
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {member.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {member.role !== 'Admin' && (
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role-Based Permissions Matrix */}
      <div className="bg-white rounded-2xl border border-[#e8e9f5] shadow-2xs p-6">
        <div className="mb-4">
          <h3 className="font-bold text-slate-900 text-sm">Role-Based Access Control (RBAC) Matrix</h3>
          <p className="text-xs text-slate-500">
            Enforce separation of duties for finance audits and payment reconciliations
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9fe] border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="py-3 px-4">Permission Scope</th>
                <th className="py-3 px-3 text-center">Admin</th>
                <th className="py-3 px-3 text-center">Finance Manager</th>
                <th className="py-3 px-3 text-center">Collection Specialist</th>
                <th className="py-3 px-3 text-center">Auditor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionsMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-800">{row.permission}</td>
                  <td className="py-3 px-3 text-center">
                    {row.Admin ? (
                      <CheckCircle2 size={16} className="text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row['Finance Manager'] ? (
                      <CheckCircle2 size={16} className="text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row['Collection Specialist'] ? (
                      <CheckCircle2 size={16} className="text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.Auditor ? (
                      <CheckCircle2 size={16} className="text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-slate-900 text-base">Invite Personnel</h3>
              <button onClick={() => setIsInviteOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Neha Roy"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="neha.roy@company.com"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role & Permissions</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none"
                >
                  <option value="Finance Manager">Finance Manager</option>
                  <option value="Collection Specialist">Collection Specialist</option>
                  <option value="Auditor">Auditor (Read Only)</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4f46e5] text-white text-xs font-bold shadow-sm"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
