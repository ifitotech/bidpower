// Purchase Order status machine
// Enforces valid transitions according to business rules

import type { POStatus } from "@/types/database";

/** Valid transitions from each status */
// Mirrored by trg_enforce_po_rules() in the database, which is what actually enforces it.
export const PO_TRANSITIONS: Record<POStatus, POStatus[]> = {
  open: ["pending_document", "cancelled"],
  pending_approval: ["approved", "rejected", "cancelled"],
  rejected: ["pending_approval", "cancelled"],
  approved: ["sent", "received", "cancelled"],
  sent: ["received", "cancelled"],
  received: ["pending_document", "document_uploaded"],
  pending_document: [
    "document_uploaded",
    "exception_requested",
    "cancelled",
  ],
  document_uploaded: ["pending_review", "completed", "cancelled"],
  pending_review: ["completed", "pending_document", "cancelled"],
  completed: [], // terminal
  cancelled: [], // terminal
  exception_requested: [
    "exception_approved",
    "exception_rejected",
    "pending_document",
  ],
  exception_approved: ["cancelled"], // does NOT complete the PO
  exception_rejected: ["pending_document", "cancelled"],
};

export function canTransition(from: POStatus, to: POStatus): boolean {
  return PO_TRANSITIONS[from]?.includes(to) ?? false;
}

export function requiresDocument(status: POStatus): boolean {
  return status === "pending_document" || status === "open";
}

export function isTerminal(status: POStatus): boolean {
  return status === "completed" || status === "cancelled";
}

/** Translation key per status (see the poSt* entries of the dictionaries). */
export const PO_STATUS_KEYS: Record<POStatus, string> = {
  open: "poStOpen",
  pending_approval: "poStPendingApproval",
  approved: "poStApproved",
  rejected: "poStRejected",
  sent: "poStSent",
  received: "poStReceived",
  pending_document: "poStPendingDocument",
  document_uploaded: "poStDocumentUploaded",
  pending_review: "poStPendingReview",
  completed: "poStCompleted",
  cancelled: "poStCancelled",
  exception_requested: "poStExceptionRequested",
  exception_approved: "poStExceptionApproved",
  exception_rejected: "poStExceptionRejected",
};

/** Statuses in which the receipt / invoice / packing slip can be uploaded. */
export const PO_UPLOAD_STATUSES: POStatus[] = ["received", "pending_document", "pending_review"];

export const PO_STATUS_COLORS: Record<
  POStatus,
  "default" | "success" | "warning" | "danger" | "info"
> = {
  open: "warning",
  pending_approval: "warning",
  approved: "info",
  rejected: "danger",
  sent: "info",
  received: "warning",
  pending_document: "danger",
  document_uploaded: "info",
  pending_review: "info",
  completed: "success",
  cancelled: "default",
  exception_requested: "warning",
  exception_approved: "default",
  exception_rejected: "danger",
};
