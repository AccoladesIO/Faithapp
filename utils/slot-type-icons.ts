import { Mic, Music, HandHeart, HandCoins, Megaphone, Star, HelpCircle, Coffee, LucideIcon } from "lucide-react";

export const SLOT_TYPE_LABELS: Record<string, string> = {
    SPEAKER: "Speaker", WORSHIP: "Worship", PRAYER: "Prayer", OFFERING: "Offering",
    ANNOUNCEMENT: "Announcement", DEDICATION: "Dedication", OTHER: "Other", BREAK: "Break",
};

// Matches Faithapp-admin's SLOT_TYPE_CONFIG icon choices (slot-type-config.tsx)
// so a slot type looks the same across both apps.
export const SLOT_TYPE_ICONS: Record<string, LucideIcon> = {
    SPEAKER: Mic, WORSHIP: Music, PRAYER: HandHeart, OFFERING: HandCoins,
    ANNOUNCEMENT: Megaphone, DEDICATION: Star, OTHER: HelpCircle, BREAK: Coffee,
};
