import React from 'react';
import { AlertTriangle, ArrowLeft, ShieldCheck, UserPlus, Users } from 'lucide-react';

const DEPARTMENT_OPTIONS = ['CSE', 'CSM', 'CSD', 'CSC', 'ECE', 'EEE', 'MECH', 'CIVIL'];

export function ManageUsersScreen({
  appUser,
  newUserFirstName,
  setNewUserFirstName,
  newUserLastName,
  setNewUserLastName,
  newUserUser,
  setNewUserUser,
  newUserEmail,
  setNewUserEmail,
  newUserDept,
  setNewUserDept,
  newUserDesignation,
  setNewUserDesignation,
  newUserPass,
  setNewUserPass,
  newUserConfirmPass,
  setNewUserConfirmPass,
  loading,
  manageUsersTab,
  setManageUsersTab,
  allowedDesignationOptions,
  availableDepartmentOptions,
  visibleManagedUsers,
  handleToggleUserStatus,
  handleRemoveUser,
  handleCreateStaff,
  setView,
}) {
  const role = (appUser?.role || '').toLowerCase();
  const isAdmin = role === 'admin';
  const isHod = role === 'hod';
  const hideDepartmentField = ['Dean', 'Principal'].includes(newUserDesignation);
  const showPasswordLengthError = Boolean(newUserPass) && newUserPass.length < 8;
  const showPasswordMismatchError = Boolean(newUserConfirmPass) && newUserPass !== newUserConfirmPass;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setView('home')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-red-200 hover:text-red-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <ShieldCheck className="h-5 w-5 text-red-700" />
              User Management
            </h2>
          </div>
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setManageUsersTab('create')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                manageUsersTab === 'create' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add User
              </span>
            </button>
            <button
              type="button"
              onClick={() => setManageUsersTab('list')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                manageUsersTab === 'list' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4" />
                User List
              </span>
            </button>
          </div>
        </div>

        {manageUsersTab === 'create' ? (
          <div className="mt-5 space-y-4">
            {allowedDesignationOptions.length === 0 ? (
              <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                <AlertTriangle className="mt-0.5 h-5 w-5" />
                <span>You do not have permission to create users.</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input type="text" className="w-full rounded-lg border p-3" value={newUserFirstName} onChange={e => setNewUserFirstName(e.target.value)} placeholder="First Name" />
                  <input type="text" className="w-full rounded-lg border p-3" value={newUserLastName} onChange={e => setNewUserLastName(e.target.value)} placeholder="Last Name" />
                </div>

                <input type="text" className="w-full rounded-lg border p-3" value={newUserUser} onChange={e => setNewUserUser(e.target.value.toLowerCase())} placeholder="Username" />
                <input type="email" className="w-full rounded-lg border p-3" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="Email" />

                <div className={`grid grid-cols-1 gap-3 ${hideDepartmentField ? '' : 'sm:grid-cols-2'}`}>
                  {!hideDepartmentField && (
                    <select
                      className="w-full rounded-lg border p-3 disabled:bg-slate-100 disabled:text-slate-500"
                      value={newUserDept}
                      onChange={e => setNewUserDept(e.target.value)}
                      disabled={isHod}
                    >
                      {(availableDepartmentOptions?.length ? availableDepartmentOptions : DEPARTMENT_OPTIONS).map((department) => (
                        <option key={department} value={department}>{department}</option>
                      ))}
                    </select>
                  )}
                  <select
                    className="w-full rounded-lg border p-3"
                    value={newUserDesignation}
                    onChange={e => setNewUserDesignation(e.target.value)}
                  >
                    {allowedDesignationOptions.map((designation) => (
                      <option key={designation} value={designation}>{designation}</option>
                    ))}
                  </select>
                </div>

                {isHod && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    HOD can create faculty accounts only for the {appUser?.department} branch.
                  </div>
                )}

                <div>
                  <input
                    type="password"
                    className={`w-full rounded-lg border p-3 ${showPasswordLengthError ? 'border-red-400' : ''}`}
                    value={newUserPass}
                    onChange={e => setNewUserPass(e.target.value)}
                    placeholder="Password (min 8 chars)"
                  />
                  {showPasswordLengthError && (
                    <p className="mt-1 text-sm text-red-600">
                      Password must be at least 8 characters.
                    </p>
                  )}
                </div>

                <div>
                  <input
                    type="password"
                    className={`w-full rounded-lg border p-3 ${showPasswordMismatchError ? 'border-red-400' : ''}`}
                    value={newUserConfirmPass}
                    onChange={e => setNewUserConfirmPass(e.target.value)}
                    placeholder="Confirm Password"
                  />
                  {showPasswordMismatchError && (
                    <p className="mt-1 text-sm text-red-600">
                      Confirm password does not match.
                    </p>
                  )}
                </div>

                <button onClick={handleCreateStaff} disabled={loading} className="w-full rounded-lg bg-green-600 py-3 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70">
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="mt-5">
            <div className="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Showing {visibleManagedUsers.length} users
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleManagedUsers.map((user) => {
                const isActive = user?.active !== false && (user?.status || 'active').toLowerCase() !== 'inactive';
                const isCurrentUser = user?.id === appUser?.id;

                return (
                  <div key={user.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                    <div className="flex items-center gap-3 p-4">
                      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-2xl font-bold text-red-700">
                        {user?.photo ? (
                          <img
                            src={user.photo}
                            alt={user.name || user.username}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span>{(user?.name || user?.username || 'U').trim().charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-bold text-slate-900">{user?.name || 'Unnamed User'}</div>
                        <div className="text-sm text-slate-600">{user?.username || 'No username'}</div>
                        <div className="text-sm text-slate-500">
                          {(user?.department || 'N/A').toUpperCase()} . {(user?.designation || user?.role || 'User')}
                        </div>
                        <div className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2 border-t border-slate-200 bg-white p-4 text-sm">
                      <div className="break-all"><span className="text-slate-400">Email:</span> {user?.email || 'N/A'}</div>
                      <div><span className="text-slate-400">Created By:</span> {user?.createdBy || 'N/A'}</div>
                      {isCurrentUser && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                          This is your current account.
                        </div>
                      )}

                      {isAdmin && !isCurrentUser && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(user)}
                            className={`rounded-lg px-3 py-2 font-medium text-white transition ${
                              isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveUser(user)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-medium text-red-700 transition hover:border-red-300 hover:bg-red-100"
                          >
                            Remove User
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {visibleManagedUsers.length === 0 && (
              <p className="mt-4 text-sm text-slate-500">
                No users found for your access level.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
