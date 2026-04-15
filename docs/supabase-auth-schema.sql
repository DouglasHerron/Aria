-- NextAuth / Auth.js schema for @auth/supabase-adapter v1
-- Run this in the Supabase SQL Editor before enabling the adapter.
-- Reference: https://authjs.dev/getting-started/adapters/supabase

create extension if not exists "uuid-ossp";

create table users (
  id              uuid not null default uuid_generate_v4(),
  name            text,
  email           text,
  "emailVerified" timestamptz,
  image           text,
  primary key (id)
);

create table accounts (
  id                   uuid not null default uuid_generate_v4(),
  "userId"             uuid not null references users(id) on delete cascade,
  type                 text not null,
  provider             text not null,
  "providerAccountId"  text not null,
  refresh_token        text,
  access_token         text,
  expires_at           bigint,
  token_type           text,
  scope                text,
  id_token             text,
  session_state        text,
  primary key (id)
);

create table sessions (
  id              uuid not null default uuid_generate_v4(),
  "sessionToken"  text not null unique,
  "userId"        uuid not null references users(id) on delete cascade,
  expires         timestamptz not null,
  primary key (id)
);

create table verification_tokens (
  identifier  text not null,
  expires     timestamptz not null,
  token       text not null,
  primary key (token)
);
