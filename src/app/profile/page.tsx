import { accountProfile, accountSecurity } from "@/server/data/profile";
import { requirePageAccount } from "@/server/auth/page-account";
import { AccountProfile } from "@/components/profile/account-profile";
import { WalletSettings } from "@/components/profile/wallet-settings";
import { AppearanceSettings } from "@/components/profile/appearance-settings";
import { Text } from "@/i18n/text";

export default async function ProfilePage() {
  const current = await requirePageAccount();
  const [profile, security] = await Promise.all([
    accountProfile(),
    accountSecurity(),
  ]);
  return (
    <div className="profile-page">
      <div className="profile-intro">
        <h1>
          <Text id="account_settings" />
        </h1>
        <p>
          <Text id="your_profile_wallet_and_preferences_in_one_place" />
        </p>
      </div>
      <div className="profile-layout">
        <AccountProfile
          key={current.user.id}
          profile={profile}
          security={security}
        />
        <div className="settings-aside">
          <WalletSettings />
          <AppearanceSettings />
        </div>
      </div>
    </div>
  );
}
