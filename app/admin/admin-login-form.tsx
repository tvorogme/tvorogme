"use client";

import type { AdminAuthStatus } from "@/lib/admin-config-shared";
import Link from "next/link";
import { useState, type FormEvent } from "react";

type AdminLoginFormProps = {
  readonly authStatus: AdminAuthStatus;
};

export function AdminLoginForm({ authStatus }: AdminLoginFormProps) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      body: JSON.stringify({
        password: String(formData.get("password") ?? ""),
        username: String(formData.get("username") ?? ""),
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });

    setIsSubmitting(false);

    if (response.ok) {
      window.location.reload();
      return;
    }

    setError(
      response.status === 503
        ? "Admin login is not configured on the server."
        : "The username or password did not match.",
    );
  }

  return (
    <section className="adminLoginPanel" aria-labelledby="admin-login-title">
      <div className="adminPanelHeader">
        <span>admin://tvorog.me</span>
        <Link href="/">back</Link>
      </div>
      <div className="adminLoginBody">
        <h1 id="admin-login-title">tvorog.me Admin</h1>
        <p>
          Login protects quest project assignment and Codex stream settings for
          LoreLog.
        </p>

        {!authStatus.configured ? (
          <p className="adminError" role="alert">
            Set the admin password and session secret environment variables.
          </p>
        ) : null}

        {authStatus.usesDevDefault ? (
          <p className="adminHint">Dev access: admin / admin</p>
        ) : null}

        <form className="adminLoginForm" onSubmit={handleSubmit}>
          <label>
            <span>Username</span>
            <input
              autoComplete="username"
              defaultValue={authStatus.usesDevDefault ? "admin" : ""}
              name="username"
              required
              type="text"
            />
          </label>
          <label>
            <span>Password</span>
            <input
              autoComplete="current-password"
              defaultValue={authStatus.usesDevDefault ? "admin" : ""}
              name="password"
              required
              type="password"
            />
          </label>
          {error ? (
            <p className="adminError" role="alert">
              {error}
            </p>
          ) : null}
          <button disabled={isSubmitting || !authStatus.configured} type="submit">
            {isSubmitting ? "checking..." : "sign in"}
          </button>
        </form>
      </div>
    </section>
  );
}
