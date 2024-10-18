import { DocumentManager } from "@y-sweet/sdk";

const manager = new DocumentManager(process.env.Y_SWEET_CONNECTION_STRING || "");

export async function POST(req: Request) {
  const { docId } = await req.json();
  const clientToken = await manager.getOrCreateDocAndToken(docId);
  return Response.json(clientToken);
}
