#!/usr/bin/env node

/*
 * Render does not provide an interactive database shell on every plan.
 * This bootstrap creates the tables the app expects before the web server
 * starts. If the dictionary tables are empty, it also imports a PostgreSQL
 * dump so a fresh Render database is playable without an interactive shell.
 */

const Fs = require("fs");
const Http = require("http");
const Https = require("https");
const Os = require("os");
const Path = require("path");
const Readline = require("readline");
const Zlib = require("zlib");

let Pool;

try {
	Pool = require("pg").Pool;
} catch (err) {
	Pool = require("../Server/lib/node_modules/pg").Pool;
}

const DATABASE_URL = process.env.DATABASE_URL;
const ROOT = Path.resolve(__dirname, "..");
const LOCAL_DB_SQL = Path.join(ROOT, "db.sql");
const DEFAULT_DB_SQL_URL = "https://raw.githubusercontent.com/JJoriping/KKuTu/master/db.sql";
const DEFAULT_JMDICT_URL = "http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz";
const KOREAN_WIKI_BASE = "https://kkukowiki.kr/w/%EB%A7%8C%ED%99%94/%EC%95%A0%EB%8B%88%EB%A9%94%EC%9D%B4%EC%85%98/%EA%B8%80%EC%9E%90%EB%B3%84_%EB%8B%A8%EC%96%B4_%EB%AA%A9%EB%A1%9D/";
const HF_MAL_CSV = "https://huggingface.co/datasets/lyfesan/myanimelist-top-anime-dataset/resolve/main/mal_top_anime_dataset.csv";
const TMP_DB_SQL = Path.join(Os.tmpdir(), "kkutu-db.sql");
const TMP_JMDICT = Path.join(Os.tmpdir(), "JMdict_e.gz");
const BATCH_ROWS = 500;

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

const IMPORT_TABLES = {
	kkutu_ko: true,
	kkutu_en: true,
	kkutu_ja: true,
	kkutu_cw_ko: true,
	kkutu_cw_en: true,
	kkutu_cw_ja: true,
	kkutu_manner_ko: true,
	kkutu_manner_en: true,
	kkutu_manner_ja: true,
	kkutu_injeong: true,
	kkutu_shop: true,
	kkutu_shop_desc: true
};
const PRIMARY_KEY_TABLES = {
	kkutu_ko: true,
	kkutu_en: true,
	kkutu_ja: true,
	kkutu_manner_ko: true,
	kkutu_manner_en: true,
	kkutu_manner_ja: true,
	kkutu_injeong: true,
	kkutu_shop: true,
	kkutu_shop_desc: true
};
const JA_ID = /^[ぁ-ゖ一-龯々〆〇ー]+$/;
const JA_READING = /^[ぁ-ゖー]+$/;
const KOREAN_INDEX = [ "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ" ];
const KOREAN_MANUAL_POPULAR = [
	"귀멸의칼날", "주술회전", "스파이패밀리", "최애의아이", "체인소맨", "도쿄구울",
	"약속의네버랜드", "봇치더록", "블루록", "장송의프리렌", "리코리스리코일",
	"기동전사건담수성의마녀", "던전밥", "괴수팔호", "지옥락", "마슐",
	"메이드인어비스", "바이올렛에버가든", "사이버펑크엣지러너", "사카모토데이즈",
	"패배히로인이너무많아", "야한이야기라는개념이존재하지않는지루한세계",
	"비스크돌은사랑을한다", "내마음의위험한녀석", "마법소녀마도카마기카",
	"빙과", "코노스바", "전생했더니슬라임이었던건에대하여", "무직전생",
	"소녀종말여행", "하이카드", "샹그릴라프론티어", "언데드언럭",
	"괴롭히지말아요나가토로양", "어서오세요실력지상주의교실에",
	"카구야님은고백받고싶어", "아픈건싫으니까방어력에올인하려고합니다",
	"어떤과학의초전자포", "어떤마술의금서목록", "러브라이브", "러브라이브선샤인",
	"데이트어라이브", "중이병이라도사랑이하고싶어", "나만이없는거리",
	"강철의연금술사브라더후드", "헌터헌터", "클라나드", "슈타인즈게이트",
	"소드아트온라인", "페이트제로", "페이트스테이나이트", "페이트그랜드오더",
	"유유백서", "에반게리온", "카우보이비밥", "사무라이참프루",
	"코드기어스반역의를르슈", "바람의검심", "마기", "노게임노라이프",
	"어쨌든귀여워", "슬라임을잡으면서삼백년모르는사이에레벨맥스가되었습니다",
	"그비스크돌은사랑을한다", "오버로드", "유녀전기", "리제로",
	"데스노트", "도쿄리벤저스", "쟈히님은기죽지않아", "천국대마경",
	"체인솔저", "언어의정원", "너의이름은", "날씨의아이", "스즈메의문단속"
];

const pool = new Pool({
	connectionString: DATABASE_URL,
	ssl: { rejectUnauthorized: false }
});

function flag(name){
	return /^(1|true|yes|on)$/i.test(String(process.env[name] || ""));
}
function quoteIdent(name){
	return `"${String(name).replace(/"/g, '""')}"`;
}
function parseUrlList(value){
	return String(value || "")
		.split(",")
		.map(function(item){ return item.trim(); })
		.filter(Boolean);
}
function fileLooksUsable(file){
	try {
		const stat = Fs.statSync(file);
		if(stat.size < 1024) return false;
		const fd = Fs.openSync(file, "r");
		const buf = Buffer.alloc(Math.min(128, stat.size));
		Fs.readSync(fd, buf, 0, buf.length, 0);
		Fs.closeSync(fd);
		return !buf.toString("utf8").startsWith("version https://git-lfs.github.com/spec/");
	} catch (err) {
		return false;
	}
}
function sourceList(){
	const seen = {};
	const out = [];
	const local = { type: "file", value: LOCAL_DB_SQL, label: "local db.sql" };
	const urls = parseUrlList(process.env.DB_SQL_URL || process.env.WORD_DB_URL);
	
	if(fileLooksUsable(LOCAL_DB_SQL)) out.push(local);
	urls.push(DEFAULT_DB_SQL_URL);
	urls.forEach(function(url){
		if(seen[url]) return;
		seen[url] = true;
		out.push({ type: "url", value: url, label: url });
	});
	return out;
}
function shouldImportTable(table, counts){
	return IMPORT_TABLES[table] && (!counts[table] || counts[table] == 0);
}
function unquoteIdent(raw){
	raw = String(raw || "").trim();
	if(raw[0] == '"' && raw[raw.length - 1] == '"') return raw.slice(1, -1).replace(/""/g, '"');
	return raw.toLowerCase();
}
function tableName(raw){
	const parts = String(raw || "").split(".");
	return unquoteIdent(parts[parts.length - 1]);
}
function parseCopyColumns(raw){
	const out = [];
	let cur = "";
	let quoted = false;
	let i;
	let ch;
	
	for(i=0; i<raw.length; i++){
		ch = raw[i];
		if(ch == '"'){
			cur += ch;
			if(quoted && raw[i + 1] == '"'){
				cur += raw[++i];
			}else{
				quoted = !quoted;
			}
		}else if(ch == "," && !quoted){
			out.push(unquoteIdent(cur));
			cur = "";
		}else{
			cur += ch;
		}
	}
	if(cur.trim()) out.push(unquoteIdent(cur));
	return out;
}
function copyHeader(line){
	const match = line.match(/^COPY\s+([^\s(]+)\s+\((.*)\)\s+FROM\s+stdin;$/);
	
	if(!match) return null;
	return {
		table: tableName(match[1]),
		columns: parseCopyColumns(match[2])
	};
}
function decodeCopyValue(value){
	let out = "";
	let i;
	let ch;
	let next;
	
	if(value == "\\N") return null;
	for(i=0; i<value.length; i++){
		ch = value[i];
		if(ch != "\\"){
			out += ch;
			continue;
		}
		next = value[++i];
		switch(next){
			case "b": out += "\b"; break;
			case "f": out += "\f"; break;
			case "n": out += "\n"; break;
			case "r": out += "\r"; break;
			case "t": out += "\t"; break;
			case "v": out += "\v"; break;
			case "\\": out += "\\"; break;
			default:
				if(next !== undefined) out += next;
		}
	}
	return out;
}
function inferColumnType(table, column){
	if(table.indexOf("kkutu_manner_") == 0) return "boolean";
	if(column == "hit" || column == "flag") return "integer";
	if(column == "createdAt") return "bigint";
	if(column == "options") return "jsonb";
	if(column == "_id") return "varchar(256)";
	if(column == "reading" || column == "surface") return "varchar(256)";
	return "text";
}
async function ensureColumns(table, columns){
	const res = await pool.query(
		"SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1",
		[ table ]
	);
	const existing = {};
	
	res.rows.forEach(function(row){ existing[row.column_name] = true; });
	for(const column of columns){
		if(existing[column]) continue;
		await pool.query(
			`ALTER TABLE ${quoteIdent(table)} ADD COLUMN IF NOT EXISTS ${quoteIdent(column)} ${inferColumnType(table, column)}`
		);
		existing[column] = true;
	}
}
async function flushRows(state){
	const rows = state.rows;
	const values = [];
	const placeholders = [];
	let i;
	let j;
	let base;
	let conflict = "";
	
	if(!rows.length) return;
	for(i=0; i<rows.length; i++){
		base = values.length;
		placeholders.push("(" + state.columns.map(function(_, idx){ return "$" + (base + idx + 1); }).join(", ") + ")");
		for(j=0; j<state.columns.length; j++) values.push(rows[i][j]);
	}
	if(PRIMARY_KEY_TABLES[state.table] && state.columns.indexOf("_id") != -1) conflict = " ON CONFLICT (_id) DO NOTHING";
	await pool.query(
		`INSERT INTO ${quoteIdent(state.table)} (${state.columns.map(quoteIdent).join(", ")}) VALUES ${placeholders.join(", ")}${conflict}`,
		values
	);
	state.imported += rows.length;
	state.rows = [];
	if(state.imported % 10000 < BATCH_ROWS){
		console.log(`[init-db] Imported ${state.imported} rows into ${state.table}...`);
	}
}
async function importCopyDump(file, counts){
	const stream = Fs.createReadStream(file, { encoding: "utf8" });
	const rl = Readline.createInterface({ input: stream, crlfDelay: Infinity });
	const summary = {};
	let state = null;
	let skipping = false;
	let header;
	let values;
	
	for await (const line of rl){
		if(state || skipping){
			if(line == "\\."){
				if(state){
					await flushRows(state);
					summary[state.table] = (summary[state.table] || 0) + state.imported;
					counts[state.table] = (counts[state.table] || 0) + state.imported;
				}
				state = null;
				skipping = false;
				continue;
			}
			if(skipping) continue;
			values = line.split("\t").map(decodeCopyValue);
			if(values.length == state.columns.length){
				state.rows.push(values);
				if(state.rows.length >= BATCH_ROWS) await flushRows(state);
			}
			continue;
		}
		header = copyHeader(line);
		if(!header) continue;
		if(!shouldImportTable(header.table, counts)){
			skipping = true;
			continue;
		}
		await ensureColumns(header.table, header.columns);
		console.log(`[init-db] Importing ${header.table} from ${Path.basename(file)}...`);
		state = {
			table: header.table,
			columns: header.columns,
			rows: [],
			imported: 0
		};
	}
	return summary;
}
function requestModule(url){
	return /^https:/i.test(url) ? Https : Http;
}
function downloadFile(url, target, redirects){
	redirects = redirects || 0;
	return new Promise(function(resolve, reject){
		const req = requestModule(url).get(url, function(res){
			if(res.statusCode >= 300 && res.statusCode < 400 && res.headers.location){
				res.resume();
				if(redirects > 5) return reject(new Error("Too many redirects while downloading " + url));
				return resolve(downloadFile(new URL(res.headers.location, url).toString(), target, redirects + 1));
			}
			if(res.statusCode != 200){
				res.resume();
				return reject(new Error(`Download failed for ${url}: HTTP ${res.statusCode}`));
			}
			const out = Fs.createWriteStream(target);
			res.pipe(out);
			out.on("finish", function(){ out.close(resolve); });
			out.on("error", reject);
		});
		req.on("error", reject);
		req.setTimeout(120000, function(){
			req.destroy(new Error("Download timed out: " + url));
		});
	});
}
function fetchText(url, maxBytes){
	maxBytes = maxBytes || 32 * 1024 * 1024;
	return new Promise(function(resolve, reject){
		const req = requestModule(url).get(url, {
			headers: { "User-Agent": "KKuTu Render Bootstrap/1.0" }
		}, function(res){
			const chunks = [];
			let length = 0;
			
			if(res.statusCode >= 300 && res.statusCode < 400 && res.headers.location){
				res.resume();
				return resolve(fetchText(new URL(res.headers.location, url).toString(), maxBytes));
			}
			if(res.statusCode != 200){
				res.resume();
				return reject(new Error(`Download failed for ${url}: HTTP ${res.statusCode}`));
			}
			res.on("data", function(chunk){
				length += chunk.length;
				if(length > maxBytes){
					req.destroy(new Error("Response is too large: " + url));
					return;
				}
				chunks.push(chunk);
			});
			res.on("end", function(){
				resolve(Buffer.concat(chunks).toString("utf8"));
			});
		});
		req.on("error", reject);
		req.setTimeout(120000, function(){
			req.destroy(new Error("Download timed out: " + url));
		});
	});
}
async function importSource(source, counts){
	const file = source.type == "file" ? source.value : TMP_DB_SQL;
	
	if(source.type == "url"){
		console.log("[init-db] Downloading dictionary dump: " + source.label);
		await downloadFile(source.value, file);
		if(!fileLooksUsable(file)) throw new Error("Downloaded dump is not a usable SQL file: " + source.label);
	}
	return importCopyDump(file, counts);
}
async function tableCounts(){
	const counts = {};
	
	for(const table of Object.keys(IMPORT_TABLES)){
		try {
			const res = await pool.query(`SELECT COUNT(*)::int AS count FROM ${quoteIdent(table)}`);
			counts[table] = Number(res.rows[0].count) || 0;
		} catch (err) {
			counts[table] = 0;
		}
	}
	return counts;
}
function needsDumpImport(counts){
	return !counts.kkutu_ko || !counts.kkutu_en || !counts.kkutu_shop || !counts.kkutu_shop_desc || !counts.kkutu_ja;
}
function toHiragana(text){
	return (text || "").normalize("NFKC").replace(/[ァ-ヶ]/g, function(ch){
		return String.fromCharCode(ch.charCodeAt(0) - 0x60);
	});
}
function normalizeJaWord(text){
	return toHiragana(text)
		.replace(/[ 　\t\r\n・･=＝\-‐‑‒–—―、。,.，．/／()（）［］\[\]{}｛｝<>＜＞「」『』【】"'＂＇]/g, "")
		.replace(/[^ぁ-ゖ一-龯々〆〇ー]/g, "");
}
function normalizeJaReading(text){
	return toHiragana(text)
		.replace(/[ 　\t\r\n・･=＝\-‐‑‒–—―、。,.，．/／()（）［］\[\]{}｛｝<>＜＞「」『』【】"'＂＇:：;；!?！？…~〜*＊#＃]/g, "")
		.replace(/[^ぁ-ゖー]/g, "");
}
function normalizeKorean(text){
	return String(text || "").normalize("NFKC").replace(/[^가-힣]/g, "");
}
function xmlText(text){
	return (text || "")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'");
}
function tagAll(xml, tag){
	const out = [];
	const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "g");
	let match;
	
	while((match = re.exec(xml))) out.push(xmlText(match[1].trim()));
	return out;
}
function entityAll(xml, tag){
	const out = [];
	const re = new RegExp(`<${tag}(?:\\s[^>]*)?>&([^;]+);<\\/${tag}>`, "g");
	let match;
	
	while((match = re.exec(xml))) out.push(match[1]);
	return out;
}
function unique(list){
	const seen = {};
	return list.filter(function(item){
		if(!item || seen[item]) return false;
		seen[item] = true;
		return true;
	});
}
function priorityHit(pris){
	let hit = 1000;
	
	pris.forEach(function(pri){
		const nf = pri.match(/^nf(\d\d)$/);
		if(nf) hit += Math.max(0, 520 - Number(nf[1]) * 10);
		else if(/^(news1|ichi1|spec1|gai1)$/.test(pri)) hit += 700;
		else if(/^(news2|ichi2|spec2|gai2)$/.test(pri)) hit += 350;
	});
	return hit;
}
function senseMean(entry){
	const senses = [];
	const re = /<sense>([\s\S]*?)<\/sense>/g;
	let match;
	let glosses;
	
	while((match = re.exec(entry))){
		glosses = tagAll(match[1], "gloss").slice(0, 4);
		if(glosses.length) senses.push(glosses.join("; "));
	}
	return senses.slice(0, 8).map(function(item, i){
		return `＂${i + 1}＂ ${item} `;
	}).join(" ");
}
function jaRowsFromEntry(entry){
	const rows = new Map();
	const readings = unique(tagAll(entry, "reb").map(normalizeJaWord)).filter(function(reading){
		return reading.length >= 2 && JA_READING.test(reading);
	});
	const kanji = unique(tagAll(entry, "keb"));
	const forms = unique(kanji.concat(readings));
	const pos = unique(entityAll(entry, "pos"));
	const pri = tagAll(entry, "ke_pri").concat(tagAll(entry, "re_pri"));
	const hit = priorityHit(pri);
	const type = pos.length ? pos.join(",") : "n";
	const baseMean = senseMean(entry);
	const formText = forms.slice(0, 8).join("; ");
	const mean = `＂1＂ [表記: ${formText}; 読み: ${readings.slice(0, 4).join("; ")}] ${baseMean.replace(/^＂1＂\s*/, "")}`;
	
	function add(id, reading, surface){
		if(rows.has(id)) return;
		rows.set(id, [ id, type, mean, hit, null, 0, reading, surface ]);
	}
	if(!readings.length) return [];
	readings.forEach(function(reading){ add(reading, reading, reading); });
	kanji.forEach(function(form){
		const id = normalizeJaWord(form);
		if(id.length < 2 || !JA_ID.test(id)) return;
		add(id, readings[0], form);
	});
	return Array.from(rows.values());
}
async function importJmdict(counts){
	const columns = [ "_id", "type", "mean", "hit", "theme", "flag", "reading", "surface" ];
	const source = process.env.JMDICT_URL || DEFAULT_JMDICT_URL;
	const streamRows = { table: "kkutu_ja", columns: columns, rows: [], imported: 0 };
	let buffer = "";
	let start;
	let end;
	let entry;
	let rows;
	let i;
	
	if(flag("SKIP_JA_SEED")) return;
	if(counts.kkutu_ja > 0) return;
	console.log("[init-db] Downloading JMdict for Japanese seed: " + source);
	await downloadFile(source, TMP_JMDICT);
	await ensureColumns("kkutu_ja", columns);
	await new Promise(function(resolve, reject){
		const input = Fs.createReadStream(TMP_JMDICT).pipe(Zlib.createGunzip());
		
		input.setEncoding("utf8");
		input.on("data", async function(chunk){
			input.pause();
			try {
				buffer += chunk;
				while((end = buffer.indexOf("</entry>")) != -1){
					start = buffer.indexOf("<entry>");
					if(start == -1 || start > end){
						buffer = buffer.slice(end + 8);
						continue;
					}
					entry = buffer.slice(start, end + 8);
					buffer = buffer.slice(end + 8);
					rows = jaRowsFromEntry(entry);
					for(i=0; i<rows.length; i++){
						streamRows.rows.push(rows[i]);
						if(streamRows.rows.length >= BATCH_ROWS) await flushRows(streamRows);
					}
				}
				if(buffer.length > 1024 * 1024 && buffer.indexOf("<entry>") == -1) buffer = "";
				input.resume();
			} catch (err) {
				input.destroy(err);
			}
		});
		input.on("end", resolve);
		input.on("error", reject);
	});
	await flushRows(streamRows);
	counts.kkutu_ja = (counts.kkutu_ja || 0) + streamRows.imported;
	console.log(`[init-db] Imported ${streamRows.imported} JMdict rows into kkutu_ja.`);
}
function parseCsvRows(text){
	const rows = [];
	let row = [];
	let field = "";
	let quoted = false;
	let i;
	let ch;
	
	for(i=0; i<text.length; i++){
		ch = text[i];
		if(quoted){
			if(ch == '"' && text[i + 1] == '"'){
				field += '"';
				i++;
			}else if(ch == '"'){
				quoted = false;
			}else{
				field += ch;
			}
		}else if(ch == '"'){
			quoted = true;
		}else if(ch == ","){
			row.push(field);
			field = "";
		}else if(ch == "\n"){
			row.push(field);
			rows.push(row);
			row = [];
			field = "";
		}else if(ch != "\r"){
			field += ch;
		}
	}
	if(field || row.length){
		row.push(field);
		rows.push(row);
	}
	return rows;
}
async function insertSeedRows(table, columns, rows){
	const state = {
		table: table,
		columns: columns,
		rows: [],
		imported: 0
	};
	
	if(!rows.length) return 0;
	await ensureColumns(table, columns);
	for(const row of rows){
		state.rows.push(row);
		if(state.rows.length >= BATCH_ROWS) await flushRows(state);
	}
	await flushRows(state);
	return state.imported;
}
async function janSeedCount(table){
	const res = await pool.query(
		`SELECT COUNT(*)::int AS count FROM ${quoteIdent(table)} WHERE type LIKE '%INJEONG%' AND COALESCE(theme, '') ~ '(^|,)JAN(,|$)'`
	);
	return Number(res.rows[0].count) || 0;
}
function extractKoreanWikiTitles(raw){
	const words = {};
	const re = /\[\[([^\[\]\n]+)\]\]/g;
	let match;
	let word;
	
	while((match = re.exec(raw))){
		word = match[1].split("|", 1)[0].split("#", 1)[0].trim();
		if(word.indexOf(":") != -1) continue;
		word = normalizeKorean(word);
		if(word.length >= 2) words[word] = true;
	}
	return words;
}
async function seedKoreanAnimeWords(){
	const words = {};
	const rows = [];
	let text;
	let url;
	
	for(const index of KOREAN_INDEX){
		url = KOREAN_WIKI_BASE + encodeURIComponent(index) + "?action=raw";
		try {
			text = await fetchText(url, 8 * 1024 * 1024);
			Object.assign(words, extractKoreanWikiTitles(text));
		} catch (err) {
			console.warn("[init-db] Korean anime wiki seed skipped for " + index + ": " + err.message);
		}
	}
	KOREAN_MANUAL_POPULAR.forEach(function(title){
		const word = normalizeKorean(title);
		if(word.length >= 2) words[word] = true;
	});
	Object.keys(words).sort().forEach(function(word){
		rows.push([ word, "INJEONG", "＂1＂［1］（1）", 0, 2, "JAN" ]);
	});
	console.log(`[init-db] Seeding ${rows.length} Korean anime injeong words...`);
	return insertSeedRows("kkutu_ko", [ "_id", "type", "mean", "hit", "flag", "theme" ], rows);
}
async function seedJapaneseAnimeWords(){
	const text = await fetchText(process.env.ANIME_CSV_URL || HF_MAL_CSV, 32 * 1024 * 1024);
	const csv = parseCsvRows(text);
	const headers = csv.shift() || [];
	const jIndex = headers.indexOf("Japanese");
	const words = {};
	const rows = [];
	let title;
	let id;
	let reading;
	let mean;
	
	if(jIndex == -1) throw new Error("Japanese column was not found in anime CSV.");
	csv.forEach(function(row){
		title = (row[jIndex] || "").trim();
		if(!title) return;
		id = normalizeJaWord(title);
		reading = normalizeJaReading(title);
		if(id.length < 2 || reading.length < 2) return;
		if(!JA_READING.test(reading)) return;
		if(!words[id]) words[id] = [ reading, id ];
		if(!words[reading]) words[reading] = [ reading, reading ];
	});
	Object.keys(words).sort().forEach(function(word){
		reading = words[word][0];
		title = words[word][1];
		mean = `＂1＂ [表記: ${title}; 読み: ${reading}] popular anime title (MAL/HuggingFace)`;
		rows.push([ word, "INJEONG", mean, 0, "JAN", 2, reading, title ]);
	});
	console.log(`[init-db] Seeding ${rows.length} Japanese anime injeong words...`);
	return insertSeedRows("kkutu_ja", [ "_id", "type", "mean", "hit", "theme", "flag", "reading", "surface" ], rows);
}
async function seedAnimeWords(){
	let count;
	
	if(flag("SKIP_ANIME_SEED")) return;
	try {
		count = await janSeedCount("kkutu_ko");
		if(count > 0){
			console.log("[init-db] Korean anime injeong seed already exists; skipping.");
		}else{
			await seedKoreanAnimeWords();
		}
	} catch (err) {
		console.warn("[init-db] Korean anime injeong seed failed: " + (err.stack || err.toString()));
	}
	try {
		count = await janSeedCount("kkutu_ja");
		if(count > 0){
			console.log("[init-db] Japanese anime injeong seed already exists; skipping.");
		}else{
			await seedJapaneseAnimeWords();
		}
	} catch (err) {
		console.warn("[init-db] Japanese anime injeong seed failed: " + (err.stack || err.toString()));
	}
}

(async function(){
	try {
		await pool.query(TABLE_SQL);
		console.log("[init-db] PostgreSQL tables are ready.");
		if(!flag("SKIP_DB_IMPORT")){
			const counts = await tableCounts();
			
			if(needsDumpImport(counts)){
				for(const source of sourceList()){
					await importSource(source, counts);
					if(!needsDumpImport(counts)) break;
				}
				await importJmdict(counts);
			}else{
				console.log("[init-db] Dictionary tables already contain data; skipping import.");
			}
			await seedAnimeWords();
		}
	} catch (err) {
		console.error("[init-db] Failed to bootstrap PostgreSQL:");
		console.error(err.stack || err.toString());
		process.exitCode = 1;
	} finally {
		await pool.end();
	}
})();
