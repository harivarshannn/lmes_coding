-- This script runs automatically on the first boot of the Postgres container.
-- It creates the separate database and user required by the Judge0 sandbox engine.

CREATE DATABASE judge0;
CREATE USER judge0 WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE judge0 TO judge0;

-- Connect to the judge0 database to apply schema grants
\c judge0;
GRANT ALL ON SCHEMA public TO judge0;
ALTER DATABASE judge0 OWNER TO judge0;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO judge0;
