export default function validateURL(url: string) {
  let parsedURL;

  try {
    parsedURL = URL.parse(url);

    if (!parsedURL) return false;
    console.log(parsedURL.protocol);
    if (!["http:", "https:"].includes(parsedURL.protocol)) {
      return false;
    }
    if (parsedURL.href.length > 4096) return false;
  } catch {
    return false;
  }

  return true;
}
