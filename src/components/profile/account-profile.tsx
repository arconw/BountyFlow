import type { Profile } from "@/lib/profile-schema";
import { ProfileForm } from "./profile-form";
import { SecuritySettings } from "@/components/auth/security-settings";
export function AccountProfile({
  profile,
  security,
}: {
  profile: Profile;
  security: { hasPassword: boolean; google: boolean };
}) {
  return (
    <div className="account-sections">
      <ProfileForm initial={profile} />
      <SecuritySettings info={security} />
    </div>
  );
}
