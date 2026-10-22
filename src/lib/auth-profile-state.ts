// Server profile data only. Requires the users write restrictions in migration 039.
export function hasVerifiedIdentity(profile: {
  realname_verified?: boolean; di?: string | null; verified_at?: string | null;
} | null): boolean {
  return profile?.realname_verified === true && !!profile.di && !!profile.verified_at;
}

export function identityRequired(): boolean {
  return process.env.NEXT_PUBLIC_DANAL_REQUIRED === 'true';
}

// A confirmed status/DI alone is insufficient to persist a verified identity.
export function verifiedIdentity(verification: { name?: string | null; phone?: string | null } | null) {
  const name = verification?.name?.trim();
  const phone = verification?.phone?.replace(/[^0-9]/g, '');
  return name && phone && /^01[016789][0-9]{7,8}$/.test(phone) ? { name, phone } : null;
}

export function profileState(profile: Parameters<typeof hasVerifiedIdentity>[0]) {
  return {
    // Existing rows have no trustworthy completion marker. null means unknown,
    // not completed; do not use editable user_metadata.profile_completed.
    needsProfileCompletion: profile ? null : true,
    needsIdentityVerification: identityRequired() && !hasVerifiedIdentity(profile),
  };
}
