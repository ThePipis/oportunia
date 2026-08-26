# Google Places API (New) Cost Governance & Free Tier Rules

1. Always use minimal explicit X-Goog-FieldMask (never use '*').
2. Never execute N+1 Place Details loops over search results. Request all needed fields in a single searchText call.
3. Keep Place Details on-demand only and exclude expensive Atmosphere fields (reviews, photos) by default.
4. Leverage local SQLite caching before querying external APIs.
5. Use debouncing (400ms+) on frontend user inputs.
6. Use multi-account fallback to keep usage below free tier thresholds per GCP project.
