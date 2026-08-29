import { MongoClient, type Collection } from "mongodb";
import type { ChatLogRequest } from "@/lib/types/api";

const DEFAULT_DATABASE = "lifeguardian";
const COLLECTION = "chat_messages";

export interface ChatMessageDocument {
  sessionId: string;
  language: string;
  kind: ChatLogRequest["kind"];
  userText: string;
  assistantText: string;
  focus: string | null;
  question: string | null;
  topicKey: string | null;
  risks: NonNullable<ChatLogRequest["risks"]>;
  riskMoves: NonNullable<ChatLogRequest["riskMoves"]>;
  createdAt: Date;
}

/**
 * Netlify may run each request in a fresh invocation but reuses warm ones, so
 * the client (and its connection pool) is cached on the module scope. Creating
 * a MongoClient per request exhausts Atlas connection limits quickly.
 */
let clientPromise: Promise<MongoClient> | undefined;

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

function getClient(uri: string): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      maxPoolSize: 5,
    })
      .connect()
      .catch((error: unknown) => {
        // Let the next request retry instead of caching a rejected promise.
        clientPromise = undefined;
        throw error;
      });
  }
  return clientPromise;
}

async function getCollection(uri: string): Promise<Collection<ChatMessageDocument>> {
  const client = await getClient(uri);
  const database = client.db(process.env.MONGODB_DB || DEFAULT_DATABASE);
  return database.collection<ChatMessageDocument>(COLLECTION);
}

/**
 * Writes one conversation turn to Atlas. Returns false on any failure — the
 * caller treats this as fire-and-forget and must not surface it.
 */
export async function storeChatTurn(payload: ChatLogRequest): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return false;

  try {
    const collection = await getCollection(uri);
    await collection.insertOne({
      sessionId: payload.sessionId,
      language: payload.language ?? "en",
      kind: payload.kind,
      userText: payload.userText,
      assistantText: payload.assistantText ?? "",
      focus: payload.action?.focus ?? null,
      question: payload.action?.question ?? null,
      topicKey: payload.action?.topicKey ?? null,
      risks: payload.risks ?? [],
      riskMoves: payload.riskMoves ?? [],
      createdAt: new Date(),
    });
    return true;
  } catch {
    return false;
  }
}
