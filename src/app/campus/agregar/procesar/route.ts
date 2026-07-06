import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import {
  campusGateOk,
  AI_SYSTEM_PROMPT,
  readFichaMeta,
  applyNumber,
  localNextNumber,
  fichaPath,
} from "@/lib/campus-add";

export const runtime = "nodejs";

const MODEL = "claude-sonnet-5";

const schema = z.object({
  transcript: z.string().trim().min(40, "El transcript es muy corto.").max(20000, "El transcript excede 20,000 caracteres."),
  title: z.string().trim().max(200).optional(),
  tema: z.string().trim().max(80).optional(),
});

export async function POST(req: Request) {
  // Candado: sin cookie de gate valida no se llama a la API de IA.
  if (!(await campusGateOk())) {
    return Response.json({ ok: false, error: "no_autorizado" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ ok: false, error: "falta_anthropic_key" }, { status: 500 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." }, { status: 400 });
  }

  const { transcript, title, tema } = parsed.data;

  const hints: string[] = [];
  if (title) hints.push(`Título fijado por el usuario (úsalo tal cual): ${title}`);
  if (tema) hints.push(`Tema fijado por el usuario (úsalo tal cual): ${tema}`);
  const userMessage = [
    hints.length ? hints.join("\n") + "\n" : "",
    "Transcript crudo del video:\n\n",
    transcript,
  ].join("");

  let markdown: string;
  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: AI_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
    markdown = msg.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
  } catch (err) {
    console.error("campus/procesar: fallo la IA", err);
    return Response.json({ ok: false, error: "fallo_ia" }, { status: 502 });
  }

  if (!markdown.startsWith("---")) {
    return Response.json({ ok: false, error: "salida_invalida" }, { status: 502 });
  }

  // Numero tentativo (local) para que el preview sea consistente. Se recalcula
  // contra GitHub al guardar.
  const meta = readFichaMeta(markdown);
  const num = localNextNumber(meta.tema || tema || "");
  markdown = applyNumber(markdown, num);

  const finalMeta = readFichaMeta(markdown);
  return Response.json({
    ok: true,
    markdown,
    tema: finalMeta.tema,
    title: finalMeta.title,
    path: fichaPath(finalMeta.tema, finalMeta.title, num),
  });
}
