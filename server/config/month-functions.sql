-- Function to get existing month or create a new one if it doesn't exist
CREATE OR REPLACE FUNCTION get_or_create_month(
  client_id UUID,
  month_number INT,
  year_number INT,
  created_by_id UUID,
  custom_name TEXT DEFAULT NULL
) 
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  existing_month_id UUID;
  new_month_id UUID;
  month_name TEXT;
BEGIN
  -- Check if month already exists
  SELECT id INTO existing_month_id
  FROM months
  WHERE client_id = $1 AND month = $2 AND year = $3
  LIMIT 1;
  
  -- If it exists, return the ID
  IF existing_month_id IS NOT NULL THEN
    RETURN existing_month_id;
  END IF;
  
  -- Determine name: use custom if provided, otherwise generate automatically
  IF custom_name IS NOT NULL AND custom_name <> '' THEN
    month_name := custom_name;
  ELSE
    month_name := TO_CHAR(TO_DATE(month_number::text, 'MM'), 'Month') || ' ' || year_number;
  END IF;
  
  -- Create a new month
  INSERT INTO months (
    name, 
    month, 
    year, 
    client_id, 
    created_by,
    created_at
  ) VALUES (
    month_name,
    month_number,
    year_number,
    client_id,
    created_by_id,
    NOW()
  )
  RETURNING id INTO new_month_id;
  
  RETURN new_month_id;
END;
$$;
