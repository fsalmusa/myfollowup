-- =====================================================================
-- MyFollowUp — Seed Sample Data
-- Run AFTER migration.sql. Creates 6 groups x 10 customers (60 total)
-- with realistic Malaysian names/phones and varied expiry dates.
--
-- NOTE: All dates are relative to CURRENT_DATE so status logic is testable.
-- =====================================================================

-- ---------------------------------------------------------------------
-- GROUPS
-- ---------------------------------------------------------------------
insert into public.groups (name, description) values
  ('Ahmad', 'Customer dari iklan Facebook'),
  ('Zaitun', 'Customer dari TikTok'),
  ('Ali', 'Customer dari Instagram'),
  ('Siti', 'Customer dari referral kawan'),
  ('Mei', 'Customer dari WhatsApp group'),
  ('Rizal', 'Customer dari Google Ads');

-- ---------------------------------------------------------------------
-- CUSTOMERS
-- (group name -> completed count out of 10; 0 = all PENDING)
-- ---------------------------------------------------------------------
do $$
declare
  g record;
  c record;
  first_names text[] := array[
    'Ahmad','Muhammad','Nur','Siti','Aisyah','Zainab','Fatimah','Ali','Omar','Hassan',
    'Hussein','Aminah','Khadijah','Maryam','Yusuf','Ibrahim','Ismail','Hafiz','Farah','Nadia',
    'Aiman','Syafiq','Amir','Daniel','Izzah','Lina','Wan','Hakim','Rizal','Mei',
    'Sarah','Melissa','Johan','Arif','Syafiqah','Aqilah','Farid','Zaki','Rahman','Salim',
    'Fauzi','Kamal','Nordin','Roslan','Adam','Idris','Sofea','Balqis','Wei','Ling',
    'Chong','Tan','Raj','Devi','Kumar','Suresh','Anita','Priya'
  ];
  last_names text[] := array[
    'bin Abdullah','binti Hassan','bin Ismail','binti Omar','bin Yusof','binti Ali',
    'bin Zainal','binti Rahman','bin Salleh','binti Ahmad','Lee','Wong','Lim','Tan',
    'Naidu','Krishnan','A/L Muthu','A/P Devi','bin Rahim','binti Karim','bin Osman'
  ];
  phone_prefix text[] := array['012','013','014','016','017','018','019','011'];
  expiry_offsets int[] := array[-12,-4,2,5,15,30,60,90,180,365];
  completed_by_group jsonb := '{"Ahmad":10,"Zaitun":7,"Ali":5,"Siti":8,"Mei":3,"Rizal":0}';
  gi int := 0;
  k int;
  grp_id bigint;
  cust_name text;
  cust_phone text;
  cust_email text;
  fam_email text;
  expiry date;
  subscribe date;
  completed int;
  fustat text;
  lastfu timestamptz;
begin
  for g in select id, name from public.groups order by id loop
    completed := coalesce((completed_by_group ->> g.name)::int, 0);
    for k in 0..9 loop
      cust_name  := first_names[(gi * 7 + 3) % array_length(first_names,1) + 1]
                 || ' ' || last_names[(gi * 5 + 1) % array_length(last_names,1) + 1];
      cust_phone := phone_prefix[gi % array_length(phone_prefix,1) + 1]
                 || lpad((1000000 + gi * 137)::text, 7, '0');
      expiry     := current_date + expiry_offsets[k % array_length(expiry_offsets,1) + 1];
      subscribe  := expiry - 365;
      fustat     := case when k < completed then 'COMPLETED' else 'PENDING' end;
      lastfu     := case when k < completed then now() - (gi % 25 || ' days')::interval else null end;

      cust_email := lower(regexp_replace(cust_name, '[^a-zA-Z]', '', 'g')) || gi || '@gmail.com';
      fam_email  := 'family.' || lower(regexp_replace(cust_name, '[^a-zA-Z]', '', 'g')) || '@yahoo.com';

      insert into public.customers
        (group_id, name, phone, email_subscribe, email_family, subscribe_date, expiry_date, follow_up_status, last_follow_up_at)
      values
        (g.id, cust_name, cust_phone, cust_email, fam_email,
         to_char(subscribe,'YYYY-MM-DD'), to_char(expiry,'YYYY-MM-DD'), fustat, lastfu);

      gi := gi + 1;
    end loop;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- FOLLOW-UP HISTORY (for completed customers — feeds the calendar)
-- ---------------------------------------------------------------------
insert into public.follow_up_history (customer_id, action, note, created_at)
select id, 'FOLLOW_UP', 'Follow up melalui WhatsApp', coalesce(last_follow_up_at, now())
from public.customers
where follow_up_status = 'COMPLETED';

-- ---------------------------------------------------------------------
-- VERIFY
-- ---------------------------------------------------------------------
select
  (select count(*) from public.groups) as groups,
  (select count(*) from public.customers) as customers,
  (select count(*) from public.follow_up_history) as history_entries;
