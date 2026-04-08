type Response = {
  message: string;
  data: string;
};

export default async function analyzeURL(url: string): Promise<Response> {
  console.log("calling the API");
  try {
    const response = await fetch(
      `http://localhost:8787/api/analyze?url=${url}`,
      {
        method: "GET",
      },
    );

    if (!response.ok) throw new Error(`API Error:  ${response.status}`);

    const resJSON = await response.json();

    console.log("The response from api route: ", resJSON);

    return resJSON as Response;
  } catch {
    console.log("error fetching");
  }

  return {
    message: "error fetching",
    data: "",
  };
}
