"use client";

import { Suspense } from "react";
import LoginForm from "./components/LoginForm";

export default function LoginPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
