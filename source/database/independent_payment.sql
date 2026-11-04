-- Payment records and application decisions are independent. Existing values are preserved.
alter table public.training_applicants drop constraint if exists training_applicants_check;
