-- Schedule automatic daily creation of paiement bons after day close.
-- Runs every day at 00:05 (Africa/Casablanca project timezone expected).

DO $$
BEGIN
  -- Remove old job with same name if it exists, then recreate cleanly.
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-daily-paiement-bons') THEN
    PERFORM cron.unschedule((SELECT jobid FROM cron.job WHERE jobname = 'generate-daily-paiement-bons' LIMIT 1));
  END IF;

  PERFORM cron.schedule(
    'generate-daily-paiement-bons',
    '5 0 * * *',
    'SELECT public.generate_daily_paiement_bons();'
  );
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'pg_cron is not enabled in this environment. Enable pg_cron then re-run this migration.';
END
$$;
