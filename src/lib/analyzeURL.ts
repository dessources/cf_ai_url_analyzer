export default async function analyzeURL(url: string) {
  try {
    const response = await fetch(
      `http://localhost:8787/api/analyze?url=${url}`,
      {
        method: "GET",
      },
    );

    if (!response.ok) throw new Error(`API Error:  ${response.status}`);

    const resJSON = response.json();

    resJSON.then((data) => console.log(data));
  } catch {
    console.log("error fetching");
  }
}
