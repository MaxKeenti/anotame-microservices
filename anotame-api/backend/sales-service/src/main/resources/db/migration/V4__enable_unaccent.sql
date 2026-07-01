-- V4: Enable the unaccent extension so customer search can match names
-- regardless of diacritics (e.g. "monica" matches "Mónica" and vice versa).
CREATE EXTENSION IF NOT EXISTS unaccent;
