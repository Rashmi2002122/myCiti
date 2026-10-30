import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, ShieldAlert, UserX, UserCheck, AlertCircle,
  Phone, Mail, Store, User, RefreshCw, X
} from 'lucide-react';
import {
  fetchAdminUsers,
  suspendAdminUser,
  unsuspendAdminUser
} from '../services/api';

export default function AdminUsersManager({ token, currentUserId }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // ALL | USER | CLIENT | ADMIN
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVE | SUSPENDED

  // Action state
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [confirmSuspendUser, setConfirmSuspendUser] = useState(null);

  const loadUsers = useCallback(async (query = '') => {
    if (!token) return;
    try {
      setIsLoading(true);
      setError('');
      const data = await fetchAdminUsers(token, query);
      const list = data.content || (Array.isArray(data) ? data : []);
      setUsers(list);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load user accounts.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setDebouncedSearchQuery('');
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadUsers(debouncedSearchQuery);
  }, [loadUsers, debouncedSearchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setDebouncedSearchQuery(searchQuery.trim());
  };

  const handleToggleSuspend = async (targetUser) => {
    if (!token) return;
    try {
      setActionLoadingId(targetUser.id);
      setActionError('');

      if (targetUser.status === 'SUSPENDED') {
        await unsuspendAdminUser(token, targetUser.id);
      } else {
        await suspendAdminUser(token, targetUser.id);
      }

      setConfirmSuspendUser(null);
      await loadUsers(searchQuery);
    } catch (err) {
      setActionError(err.message || 'Failed to update user status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="space-y-2.5">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name, email, or phone..."
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-city-blue shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Role Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {['ALL', 'USER', 'CLIENT', 'ADMIN'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`min-h-[32px] px-3 rounded-full text-xs font-bold transition-all ${
                  roleFilter === r
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {r === 'ALL' ? 'All Roles' : r}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            {['ALL', 'ACTIVE', 'SUSPENDED'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`min-h-[32px] px-2.5 rounded-full text-[11px] font-bold transition-all ${
                  statusFilter === s
                    ? 'bg-city-blue text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {s === 'ALL' ? 'All' : s === 'ACTIVE' ? 'Active' : 'Suspended'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {error && (
        <div className="p-4 text-center text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/30 rounded-2xl">
          {error}
        </div>
      )}

      {/* User Count & Refresh */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Showing <strong>{filteredUsers.length}</strong> of {users.length} users
        </span>
        <button
          type="button"
          onClick={() => loadUsers(searchQuery)}
          className="flex items-center gap-1 text-city-blue font-bold hover:underline cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <div className="w-6 h-6 border-2 border-city-blue border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
          <User className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
            No matching users found
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Try adjusting your search terms or role filters.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredUsers.map((u) => {
            const isSelf = currentUserId && String(u.id) === String(currentUserId);
            const isAdminRole = u.role === 'ADMIN';
            const isSuspended = u.status === 'SUSPENDED';

            return (
              <div
                key={u.id}
                className={`p-3.5 bg-white dark:bg-slate-900 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                  isSuspended
                    ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20'
                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                }`}
              >
                {/* User Info */}
                <div className="flex items-center gap-3 min-w-0">
                  {u.pictureUrl ? (
                    <img
                      src={u.pictureUrl}
                      alt={u.name || 'User'}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                        {u.name || 'Anonymous User'}
                      </span>
                      {isSelf && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          You
                        </span>
                      )}
                      {/* Role Pill */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        u.role === 'ADMIN'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : u.role === 'CLIENT'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                      {/* Status Pill */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isSuspended
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </span>
                      {u.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span>+91 {u.phone}</span>
                        </span>
                      )}
                    </div>

                    {/* Client Details */}
                    {u.role === 'CLIENT' && (u.businessName || u.clientType) && (
                      <div className="flex items-center gap-1.5 text-[11px] text-purple-700 dark:text-purple-300 font-semibold pt-0.5">
                        <Store className="w-3 h-3 flex-shrink-0" />
                        <span>{u.businessName || u.clientType}</span>
                        {u.clientType && <span className="text-slate-400">({u.clientType})</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  {isAdminRole || isSelf ? (
                    <span className="text-[11px] font-semibold text-slate-400 italic px-2">
                      Protected
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={actionLoadingId === u.id}
                      onClick={() => {
                        if (isSuspended) {
                          handleToggleSuspend(u);
                        } else {
                          setConfirmSuspendUser(u);
                        }
                      }}
                      className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50 ${
                        isSuspended
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs'
                          : 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-900/60'
                      }`}
                    >
                      {actionLoadingId === u.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : isSuspended ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Unsuspend</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-3.5 h-3.5" />
                          <span>Suspend</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Suspend Confirmation Dialog */}
      {confirmSuspendUser && (
        <div className="fixed inset-0 z-[4000] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto shadow-md">
              <ShieldAlert className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Suspend User Account?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Are you sure you want to suspend <strong>{confirmSuspendUser.name || confirmSuspendUser.email}</strong>? They will be prevented from signing in and managing listings.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSuspendUser(null)}
                className="flex-1 min-h-[42px] rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleSuspend(confirmSuspendUser)}
                className="flex-1 min-h-[42px] rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Yes, Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
