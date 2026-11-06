import { promises as fs } from "fs"
import path from "path"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const FILE = path.join(process.cwd(), "data", "admin-config.json")

const DEFAULTS = {
  sources: { weibo: true, baidu: true },
  bannedWords: "全网第一\n国家级\n永久有效\n最好\n绝对\n100%\n万能\n史上最低\n第一品牌",
  modelName: "deepseek-chat",
  accountName: "好物研究所Lab",
}

type Config = typeof DEFAULTS

function sanitize(input: unknown): Config {
  const record = input && typeof input === "object" ? (input as Record<string, unknown>) : {}
  const sources = record.sources && typeof record.sources === "object" ? (record.sources as Record<string, unknown>) : {}
  const banned = typeof record.bannedWords === "string" ? record.bannedWords.slice(0, 2000) : DEFAULTS.bannedWords
  const model = typeof record.modelName === "string" ? record.modelName.trim().slice(0, 80) : ""
  const account = typeof record.accountName === "string" ? record.accountName.trim().slice(0, 40) : ""
  return {
    sources: {
      weibo: sources.weibo !== false,
      baidu: sources.baidu !== false,
    },
    bannedWords: banned,
    modelName: model || DEFAULTS.modelName,
    accountName: account || DEFAULTS.accountName,
  }
}

async function readStored(): Promise<Config | null> {
  try {
    const raw = await fs.readFile(FILE, "utf8")
    return sanitize(JSON.parse(raw))
  } catch {
    return null
  }
}

async function writeStored(config: Config) {
  await fs.mkdir(path.dirname(FILE), { recursive: true })
  await fs.writeFile(FILE, JSON.stringify(config, null, 2))
}

function payload(config: Config, persisted: boolean) {
  return NextResponse.json({ source: "server", persisted, config })
}

export async function GET() {
  const stored = await readStored()
  return payload(stored ?? DEFAULTS, stored !== null)
}

export async function PUT(request: Request) {
  const config = sanitize(await request.json().catch(() => null))
  await writeStored(config)
  return payload(config, true)
}

export async function DELETE() {
  await fs.rm(FILE, { force: true })
  return payload(DEFAULTS, false)
}
