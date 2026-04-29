-- Add recipient mailing address columns directly on letters.
-- Required so users can fulfill physical and physical_photo letter delivery types.
-- The legacy `recipients` table is bypassed by the newer "blank slot" cart flow
-- (recipient_id is left NULL there), so storing the address inline keeps the
-- editor/API simple and consistent with how recipient_name + recipient_email
-- are already stored on the row.

ALTER TABLE letters ADD COLUMN IF NOT EXISTS address_line1 text;
ALTER TABLE letters ADD COLUMN IF NOT EXISTS address_line2 text;
ALTER TABLE letters ADD COLUMN IF NOT EXISTS city          text;
ALTER TABLE letters ADD COLUMN IF NOT EXISTS state         text;
ALTER TABLE letters ADD COLUMN IF NOT EXISTS postal_code   text;
ALTER TABLE letters ADD COLUMN IF NOT EXISTS country       text;

NOTIFY pgrst, 'reload schema';
