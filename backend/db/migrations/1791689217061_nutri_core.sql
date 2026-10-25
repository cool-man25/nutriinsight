CREATE TABLE IF NOT EXISTS nutri_profiles (
  id text PRIMARY KEY,
  name text NOT NULL,
  height_cm integer NOT NULL,
  weight_kg real NOT NULL,
  age integer NOT NULL,
  gender text NOT NULL,
  activity_level text NOT NULL,
  goal text NOT NULL,
  allergies text NOT NULL DEFAULT '',
  preferences text NOT NULL DEFAULT '',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nutri_meals (
  id text PRIMARY KEY,
  profile_id text NOT NULL,
  meal_type text NOT NULL,
  name text NOT NULL,
  eat_date text NOT NULL,
  eat_time text NOT NULL,
  photo_url text,
  foods jsonb NOT NULL DEFAULT '[]'::jsonb,
  calories real NOT NULL DEFAULT 0,
  protein real NOT NULL DEFAULT 0,
  carbs real NOT NULL DEFAULT 0,
  fat real NOT NULL DEFAULT 0,
  fiber real NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nutri_meals_profile_date_idx ON nutri_meals (profile_id, eat_date);
