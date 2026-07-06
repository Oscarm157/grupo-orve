import { z } from "zod";
import {
  campusGateOk,
  readFichaMeta,
  applyNumber,
  folderForTema,
  fichaPath,
  CAMPUS_REPO,
  CAMPUS_BRANCH,
} from "@/lib/campus-add";

export const runtime = "nodejs";

const schema = z.object({
  markdown: z.string().trim().min(40).max(30000),
});

const GH_API = "https://api.github.com";

function ghHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/** Correlativo autoritativo: lista la carpeta del tema en el repo y toma el mayor
 *  prefijo NN + 1. Carpeta inexistente (tema nuevo) => 1. */
async function nextNumberFromRepo(folder: string, token: string): Promise<number> {
  const url = `${GH_API}/repos/${CAMPUS_REPO}/contents/content/campus/${encodeURIComponent(folder)}?ref=${CAMPUS_BRANCH}`;
  const res = await fetch(url, { headers: ghHeaders(token) });
  if (res.status === 404) return 1;
  if (!res.ok) throw new Error(`github list ${res.status}`);
  const items = (await res.json()) as Array<{ name: string; type: string }>;
  let max = 0;
  for (const it of items) {
    if (it.type !== "file") continue;
    const m = it.name.match(/^(\d+)-/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max + 1;
}

export async function POST(req: Request) {
  // Candado: sin cookie de gate valida no se escribe nada al repo.
  if (!(await campusGateOk())) {
    return Response.json({ ok: false, error: "no_autorizado" }, { status: 401 });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return Response.json({ ok: false, error: "falta_github_token" }, { status: 500 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." }, { status: 400 });
  }

  const { tema, title } = readFichaMeta(parsed.data.markdown);
  if (!tema || !title) {
    return Response.json({ ok: false, error: "faltan_tema_o_titulo" }, { status: 400 });
  }

  const folder = folderForTema(tema);

  let num: number;
  try {
    num = await nextNumberFromRepo(folder, token);
  } catch (err) {
    console.error("campus/guardar: no se pudo listar la carpeta", err);
    return Response.json({ ok: false, error: "fallo_github_listar" }, { status: 502 });
  }

  const markdown = applyNumber(parsed.data.markdown, num);
  const filePath = fichaPath(tema, title, num);
  const nn = String(num).padStart(2, "0");

  const putUrl = `${GH_API}/repos/${CAMPUS_REPO}/contents/${filePath}`;
  const res = await fetch(putUrl, {
    method: "PUT",
    headers: { ...ghHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `campus: agrega ficha ${nn} ${title} (${tema})`,
      content: Buffer.from(markdown, "utf8").toString("base64"),
      branch: CAMPUS_BRANCH,
    }),
  });

  if (res.status === 422) {
    // El path ya existe (colision de correlativo/slug).
    return Response.json({ ok: false, error: "ya_existe" }, { status: 409 });
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("campus/guardar: PUT fallo", res.status, detail);
    return Response.json({ ok: false, error: "fallo_github_commit" }, { status: 502 });
  }

  const data = (await res.json()) as { commit?: { html_url?: string } };
  return Response.json({
    ok: true,
    path: filePath,
    commitUrl: data.commit?.html_url ?? null,
  });
}
