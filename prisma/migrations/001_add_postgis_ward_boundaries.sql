-- BaiteConnect — PostGIS spatial migration v2
-- Run: psql $DIRECT_URL -f prisma/migrations/001_add_postgis_ward_boundaries.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE wards ADD COLUMN IF NOT EXISTS ward_boundary geometry(Polygon, 4326);
CREATE INDEX IF NOT EXISTS wards_boundary_gist ON wards USING GIST (ward_boundary);
ALTER TABLE wards ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE wards ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);

-- North Imenti
UPDATE wards SET ward_boundary = ST_GeomFromText('POLYGON((37.570 -0.010, 37.750 -0.010, 37.750 0.200, 37.570 0.200, 37.570 -0.010))', 4326) WHERE sub_county = 'North Imenti';
-- South Imenti
UPDATE wards SET ward_boundary = ST_GeomFromText('POLYGON((37.540 -0.060, 37.740 -0.060, 37.740 0.120, 37.540 0.120, 37.540 -0.060))', 4326) WHERE sub_county = 'South Imenti';
-- Central Imenti
UPDATE wards SET ward_boundary = ST_GeomFromText('POLYGON((37.560 0.000, 37.720 0.000, 37.720 0.180, 37.560 0.180, 37.560 0.000))', 4326) WHERE sub_county = 'Central Imenti';
-- Buuri
UPDATE wards SET ward_boundary = ST_GeomFromText('POLYGON((36.980 0.120, 37.280 0.120, 37.280 0.360, 36.980 0.360, 36.980 0.120))', 4326) WHERE sub_county = 'Buuri';
-- Tigania East
UPDATE wards SET ward_boundary = ST_GeomFromText('POLYGON((37.760 0.080, 38.080 0.080, 38.080 0.400, 37.760 0.400, 37.760 0.080))', 4326) WHERE sub_county = 'Tigania East';
-- Tigania West
UPDATE wards SET ward_boundary = ST_GeomFromText('POLYGON((37.520 0.160, 37.840 0.160, 37.840 0.440, 37.520 0.440, 37.520 0.160))', 4326) WHERE sub_county = 'Tigania West';
-- Igembe South
UPDATE wards SET ward_boundary = ST_GeomFromText('POLYGON((37.820 0.260, 38.140 0.260, 38.140 0.540, 37.820 0.540, 37.820 0.260))', 4326) WHERE sub_county = 'Igembe South';
-- Igembe Central
UPDATE wards SET ward_boundary = ST_GeomFromText('POLYGON((37.880 0.400, 38.160 0.400, 38.160 0.660, 37.880 0.660, 37.880 0.400))', 4326) WHERE sub_county = 'Igembe Central';
-- Igembe North
UPDATE wards SET ward_boundary = ST_GeomFromText('POLYGON((37.900 0.540, 38.200 0.540, 38.200 0.780, 37.900 0.780, 37.900 0.540))', 4326) WHERE sub_county = 'Igembe North';

COMMIT;

SELECT sub_county, COUNT(*) AS ward_count, COUNT(ward_boundary) AS has_boundary
FROM wards GROUP BY sub_county ORDER BY sub_county;
