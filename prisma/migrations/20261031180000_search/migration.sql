-- Full-text zoeken op titel + omschrijving. 'simple' werkt voor Engels en Arabisch.
CREATE INDEX "Deal_search_idx" ON "Deal"
  USING GIN (to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("description", '')));
