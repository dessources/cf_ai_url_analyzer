import validateURL from "@/lib/validateURL";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  //get url
  const params = req.nextUrl.searchParams;

  console.log(params);
  const url = params.get("url");

  if (url) {
    //validate url

    if (validateURL(url)) {
      console.log("Getting to ceating woorkflow");
      const c = await getCloudflareContext({ async: true });

      const workflow = await c.env.URL_ANALYZER_WORKFLOW.create({
        id: crypto.randomUUID(),
        params: {
          url,
        },
      });

      console.log("workflow created");

      return NextResponse.json(
        {
          id: workflow.id,
          message: `Analysis started for: ${url}`,
        },
        {
          status: 200,
        },
      );
    }

    return NextResponse.json(
      {
        message: " Invalid URL provided",
      },
      {
        status: 400,
      },
    );
  }
}
