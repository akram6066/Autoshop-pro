"use client";

import { EyeToggleButton } from "./EyeToggleButton";

interface Props {
  showPassword: boolean;
  oldPassword: string;
  password: string;
  confirmPassword: string;
  isPwdPending: boolean;
  isResetPending: boolean;
  mounted: boolean;
  fieldErrors: {
    oldPassword?: string;
    password?: string;
    confirmPassword?: string;
  };
  onShowPasswordToggle: () => void;
  onOldPasswordChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
}

export function ChangePasswordSection({
  showPassword,
  oldPassword,
  password,
  confirmPassword,
  isPwdPending,
  isResetPending,
  mounted,
  fieldErrors,
  onShowPasswordToggle,
  onOldPasswordChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onForgotPassword,
}: Props) {
  return (
    <div>
      <h3
        className="text-sm font-semibold mb-3"
        style={{ color: "var(--color-ink-primary)" }}
      >
        Change Password
      </h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label
              className="block text-sm font-medium"
              style={{ color: "var(--color-ink-primary)" }}
            >
              Current Password
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              disabled={isResetPending}
              className="text-xs hover:underline"
              style={{ color: "var(--color-brand-600)" }}
            >
              {isResetPending ? "Sending link…" : "Forgot password?"}
            </button>
          </div>
          <div style={{ position: "relative" }}>
            <input
              className="input"
              type={showPassword ? "text" : "password"}
              value={oldPassword}
              onChange={(e) => {
                onOldPasswordChange(e.target.value);
              }}
              placeholder="Enter current password"
              style={{
                paddingRight: 44,
                ...(fieldErrors.oldPassword
                  ? { borderColor: "var(--color-danger)" }
                  : {}),
              }}
            />
            <EyeToggleButton
              show={showPassword}
              onToggle={onShowPasswordToggle}
              label={showPassword ? "Hide password" : "Show password"}
            />
          </div>
          {fieldErrors.oldPassword && (
            <p
              className="text-xs mt-1"
              style={{ color: "var(--color-danger)" }}
            >
              {fieldErrors.oldPassword}
            </p>
          )}
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--color-ink-primary)" }}
          >
            New Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              className="input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                onPasswordChange(e.target.value);
              }}
              placeholder="At least 8 characters"
              style={{
                paddingRight: 44,
                ...(fieldErrors.password
                  ? { borderColor: "var(--color-danger)" }
                  : {}),
              }}
            />
            <EyeToggleButton
              show={showPassword}
              onToggle={onShowPasswordToggle}
            />
          </div>
          {fieldErrors.password && (
            <p
              className="text-xs mt-1"
              style={{ color: "var(--color-danger)" }}
            >
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--color-ink-primary)" }}
          >
            Confirm New Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              className="input"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                onConfirmPasswordChange(e.target.value);
              }}
              placeholder="Confirm password"
              style={{
                paddingRight: 44,
                ...(fieldErrors.confirmPassword
                  ? { borderColor: "var(--color-danger)" }
                  : {}),
              }}
            />
            <EyeToggleButton
              show={showPassword}
              onToggle={onShowPasswordToggle}
              label={showPassword ? "Hide password" : "Show password"}
            />
          </div>
          {fieldErrors.confirmPassword && (
            <p
              className="text-xs mt-1"
              style={{ color: "var(--color-danger)" }}
            >
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        <div>
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={!mounted || isPwdPending || !password}
          >
            {isPwdPending ? "Updating…" : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
