import React from 'react';
import { Eye, EyeOff, RefreshCw, AlertCircle, CheckCircle, AlertTriangle, X } from 'lucide-react';

export function LoginScreen({
  loginUser,
  setLoginUser,
  loginPass,
  setLoginPass,
  showPassword,
  setShowPassword,
  rememberMe,
  setRememberMe,
  loading,
  statusMsg,
  setStatusMsg,
  handleLogin,
  forgotPasswordMode,
  setForgotPasswordMode,
  fpStep,
  setFpStep,
  fpUser,
  setFpUser,
  fpNewPass,
  setFpNewPass,
  resetTokenStatus,
  handleSendResetLink,
  handleChangePassword,
}) {
  const Message = () =>
    statusMsg ? (
      <div
        className={`p-3 mb-4 rounded-lg text-sm flex items-center gap-2 ${
          statusMsg.type === "error"
            ? "bg-red-100 text-red-800"
            : statusMsg.type === "warning"
              ? "bg-yellow-100 text-yellow-800"
              : statusMsg.type === "info"
                ? "bg-sky-100 text-sky-800"
                : "bg-green-100 text-green-800"
          }`}
      >
        {statusMsg.type === "error" && <AlertCircle className="w-4 h-4" />}
        {statusMsg.type === "warning" && <AlertTriangle className="w-4 h-4" />}
        {statusMsg.type === "success" && <CheckCircle className="w-4 h-4" />}
        {statusMsg.type === "info" && <RefreshCw className="w-4 h-4" />}
        <span>{statusMsg.text}</span>
        <button onClick={() => setStatusMsg(null)} className="ml-auto">
          <X className="w-4 h-4" />
        </button>
      </div>
    ) : null;

  if (!forgotPasswordMode) {
    return (
      <div className="min-h-screen bg-white flex items-start justify-start p-6">
        <div className="w-full max-w-md mx-auto">
          <div className="flex justify-center mb-6 mt-6">
            <img src="/download.png" alt="Logo" className="h-24 object-contain" />
          </div>
          <h2 className="text-center text-2xl font-bold text-red-800 mb-4">Faculty Portal</h2>

          <Message />

          <div className="space-y-4">
            <div>
              <input
                type="text"
                className="w-full p-4 border rounded-xl text-sm"
                placeholder="Username"
                value={loginUser}
                onChange={e => setLoginUser(e.target.value.toLowerCase())}
              />
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full p-4 border rounded-xl text-sm"
                placeholder="Password"
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3 text-slate-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
                <span className="text-slate-600">Remember Me</span>
              </label>
              <button
                onClick={() => { setForgotPasswordMode(true); setStatusMsg(null); setFpStep(1); }}
                className="text-red-700 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-red-800 text-white py-4 rounded-xl font-bold mt-3"
            >
              {loading ? 'Verifying...' : 'LOGIN'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-blue-600">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Reset Password</h2>
        <Message />

        {fpStep === 1 && (
          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-500">Enter Username</label>
            <input
              type="text"
              className="w-full p-3 border rounded-lg"
              placeholder="username"
              value={fpUser}
              onChange={e => setFpUser(e.target.value.toLowerCase())}
            />
            <button
              onClick={handleSendResetLink}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700"
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </div>
        )}

        {fpStep === 2 && (
          <div className="space-y-4">
            {resetTokenStatus === "checking" && (
              <p className="text-sm text-slate-500 mb-4">Verifying reset link...</p>
            )}
            {resetTokenStatus === "invalid" && (
              <p className="text-red-600 font-semibold mb-4">
                This reset link is invalid or expired.
              </p>
            )}
            {resetTokenStatus === "valid" && (
              <>
                <label className="block text-sm font-bold text-slate-500">Enter New Password</label>
                <input
                  type="password"
                  className="w-full p-3 border rounded-lg"
                  placeholder="New password (min 8 chars)"
                  value={fpNewPass}
                  onChange={e => setFpNewPass(e.target.value)}
                />
                <button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </>
            )}
          </div>
        )}

        <button
          onClick={() => { setForgotPasswordMode(false); setFpStep(1); setStatusMsg(null); }}
          className="w-full mt-3 border border-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-50"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
