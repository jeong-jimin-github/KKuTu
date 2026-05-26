#!/usr/bin/env node

/*
 * Render does not provide an interactive database shell on every plan.
 * This bootstrap creates the tables the app expects before the web server
 * starts. It intentionally does not import the large dictionary dump.
 */

let Pool;

try {
	Pool = require("pg").Pool;
} catch (err) {
	Pool = require("../Server/lib/node_modules/pg").Pool;
}

const DATABASE_URL = process.env.DATABASE_URL;

if(!DATABASE_URL){
	console.log("[init-db] DATABASE_URL is not set; skipping PostgreSQL bootstrap.");
	process.exit(0);
}

const TABLE_SQL = `
CREATE TABLE IF NOT EXISTS kkutu_ko (
	_id varchar(256) PRIMARY KEY,
	type text,
	mean text,
	hit integer DEFAULT 0 NOT NULL,
	theme text,
	flag integer
);

CREATE TABLE IF NOT EXISTS kkutu_en (
	_id varchar(256) PRIMARY KEY,
	type text,
	mean text,
	hit integer DEFAULT 0 NOT NULL,
	theme text,
	flag integer
);

CREATE TABLE IF NOT EXISTS kkutu_ja (
	_id varchar(256) PRIMARY KEY,
	type text,
	mean text,
	hit integer DEFAULT 0 NOT NULL,
	theme text,
	flag integer,
	reading varchar(256),
	surface varchar(256)
);

CREATE TABLE IF NOT EXISTS kkutu_cw_ko (
	_id varchar(256),
	map text,
	data text
);

CREATE TABLE IF NOT EXISTS kkutu_cw_en (
	_id varchar(256),
	map text,
	data text
);

CREATE TABLE IF NOT EXISTS kkutu_cw_ja (
	_id varchar(256),
	map text,
	data text
);

CREATE TABLE IF NOT EXISTS kkutu_manner_ko (
	_id varchar(256) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS kkutu_manner_en (
	_id varchar(256) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS kkutu_manner_ja (
	_id varchar(256) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS kkutu_injeong (
	_id varchar(256) PRIMARY KEY,
	theme text,
	"createdAt" bigint,
	writer text
);

CREATE TABLE IF NOT EXISTS kkutu_shop (
	_id varchar(256) PRIMARY KEY,
	"group" text,
	title text,
	cost text,
	term text,
	"desc" text,
	hit integer DEFAULT 0 NOT NULL,
	options jsonb,
	"updatedAt" text
);

CREATE TABLE IF NOT EXISTS kkutu_shop_desc (
	_id varchar(256) PRIMARY KEY,
	"name_ko_KR" text,
	"desc_ko_KR" text,
	"name_en_US" text,
	"desc_en_US" text,
	"name_ja_JP" text,
	"desc_ja_JP" text
);

CREATE TABLE IF NOT EXISTS "session" (
	_id varchar(256) PRIMARY KEY,
	profile jsonb,
	"createdAt" bigint
);

CREATE TABLE IF NOT EXISTS users (
	_id varchar(256) PRIMARY KEY,
	password text,
	money integer DEFAULT 0 NOT NULL,
	kkutu jsonb,
	box jsonb,
	equip jsonb,
	exordial text,
	server text DEFAULT '',
	"lastLogin" bigint,
	black text,
	"blockedUntil" bigint DEFAULT 0,
	friends jsonb,
	birthday text
);

CREATE TABLE IF NOT EXISTS ip_block (
	_id varchar(256) PRIMARY KEY,
	"reasonBlocked" text,
	"ipBlockedUntil" bigint DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_users_server ON users(server);
CREATE INDEX IF NOT EXISTS idx_session_profile_id ON "session" ((profile->>'id'));
CREATE INDEX IF NOT EXISTS idx_kkutu_ko_hit ON kkutu_ko(hit);
CREATE INDEX IF NOT EXISTS idx_kkutu_en_hit ON kkutu_en(hit);
CREATE INDEX IF NOT EXISTS idx_kkutu_ja_hit ON kkutu_ja(hit);
`;

const pool = new Pool({
	connectionString: DATABASE_URL,
	ssl: { rejectUnauthorized: false }
});

(async function(){
	try {
		await pool.query(TABLE_SQL);
		console.log("[init-db] PostgreSQL tables are ready.");
	} catch (err) {
		console.error("[init-db] Failed to bootstrap PostgreSQL:");
		console.error(err.stack || err.toString());
		process.exitCode = 1;
	} finally {
		await pool.end();
	}
})();
