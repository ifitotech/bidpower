-- BidPower — Connections: a supplier has people.
-- The table supplier_contacts already exists (supplier → contacts). This migration only makes it safe to use as the
-- contractor's address book: valid emails, no duplicate contact per supplier, at most one default contact.
-- A contact is an address-book entry: nothing is sent and nothing is shared until a request is sent to it.

DO $$ BEGIN
  ALTER TABLE supplier_contacts ADD CONSTRAINT supplier_contacts_email_format
    CHECK (email IS NULL OR (char_length(email) <= 200 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_supplier_contacts_email ON supplier_contacts(supplier_id, lower(email)) WHERE email IS NOT NULL AND is_active;
CREATE UNIQUE INDEX IF NOT EXISTS uq_supplier_contacts_default ON supplier_contacts(supplier_id) WHERE is_default_quote_contact AND is_active;
