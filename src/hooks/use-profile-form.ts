"use client";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { profileSchema, type Profile } from "@/lib/profile-schema";
import { saveProfile } from "@/server/actions/profile";
export function useProfileForm(initial: Profile) {
  const [draft, setDraft] = useState<Profile | null>(null);
  const revision = useRef(0);
  const profile = draft ?? initial;
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    revision.current++;
    setDraft((current) => ({ ...(current ?? initial), [key]: value }));
    setResult(null);
  }
  function save(event: FormEvent) {
    event.preventDefault();
    const parsed = profileSchema.safeParse(profile);
    if (!parsed.success) {
      setResult(
        parsed.error.issues[0].path[0] === "website"
          ? "enter_a_valid_http_or_https_website_address"
          : parsed.error.issues[0].path[0] === "skills"
            ? "invalid_skills"
            : "enter_a_display_name",
      );
      return;
    }
    const submittedRevision = revision.current;
    startTransition(async () => {
      try {
        const saved = await saveProfile(parsed.data);
        if (submittedRevision === revision.current) {
          if (!saved.error) setDraft(null);
          setResult(
            saved.error ? "profile_save_failed" : "profile_saved_account",
          );
        }
      } catch {
        setResult("profile_save_failed");
      }
    });
  }
  return { profile, result, update, save, pending };
}
