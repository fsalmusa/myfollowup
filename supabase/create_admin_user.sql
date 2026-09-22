-- =====================================================================
-- MyFollowUp — Create Admin User (Supabase Auth)
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- This creates ONE admin user that can log in to the CRM.
-- Uses Supabase's own auth functions so the password is hashed correctly.
-- =====================================================================

-- Ensure pgcrypto is available (for crypt + gen_salt)
create extension if not exists pgcrypto;

-- Change these if you want a different email / password:
--   - Email is your LOGIN username.
--   - Password must be at least 6 characters.
do $$
declare
  admin_email text := 'fsal.empire@gmail.com';
  admin_password text := 'Ay@m123';
  new_user_id uuid;
begin
  -- Check if user already exists
  if exists (select 1 from auth.users where email = admin_email) then
    raise notice 'User % already exists — skipping creation.', admin_email;
  else
    -- Create the auth user (password auto-hashed by Supabase)
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      admin_email,
      crypt(admin_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    returning id into new_user_id;

    -- Link identity
    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      new_user_id,
      format('{"sub":"%s","email":"%s"}', new_user_id, admin_email)::jsonb,
      'email',
      now(),
      now(),
      now()
    );

    raise notice '✅ Admin user created: % (password: %)', admin_email, admin_password;
  end if;
end;
$$;
