"use client";

import { OfferModal } from "@/components/onboarding/offer-modal";
import type { PlanType } from "@/components/app/local-profile";

export function UpgradeModal({
  open,
  userName,
  onChoose,
  onClose,
}: {
  open: boolean;
  userName: string;
  onChoose: (plan: PlanType) => void;
  onClose: () => void;
}) {
  return (
    <OfferModal
      open={open}
      userName={userName}
      onAccept={() => onChoose("plus")}
      onDecline={onClose}
    />
  );
}

