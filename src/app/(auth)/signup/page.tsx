"use client";

import { Suspense } from "react";
import SignupForm from "./components/SignupForm";

export default function SignupPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <Suspense>
        <SignupForm />
      </Suspense>
    </div>
  );
}
