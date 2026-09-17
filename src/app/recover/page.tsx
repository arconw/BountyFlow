import { accountCapabilities } from "@/server/auth/capabilities";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
export default function Page() {
  return (
    <Suspense>
      <AuthForm capabilities={accountCapabilities()} mode="recover" />
    </Suspense>
  );
}
