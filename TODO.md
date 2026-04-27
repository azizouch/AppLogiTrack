# TODO: Prevent Bon Paiement Creation for Current Day Colis Livre

## Plan
- [x] 1. Understand the codebase and identify relevant files
- [x] 2. Update `database/supabase_functions/generate_daily_paiement_bons.sql` to use `< CURRENT_DATE` instead of `= CURRENT_DATE`
- [x] 3. Create `database/supabase_functions/generate_daily_paiement_bon_for_livreur.sql` with the same fixed logic
- [x] 4. Verify all changes are consistent

## Details
- Colis with status `Livré` must NOT be included in a bon paiement on the same day they were delivered.
- They should only become eligible starting at `00:00:00` of the next day.
- This is achieved by changing the date filter from `date_mise_a_jour::date = CURRENT_DATE` to `date_mise_a_jour::date < CURRENT_DATE`.

