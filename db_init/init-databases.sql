-- This script runs automatically on the first boot of the Postgres container.
-- It creates the separate database and user required by the Judge0 sandbox engine.

CREATE DATABASE judge0;
CREATE USER judge0 WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE judge0 TO judge0;
