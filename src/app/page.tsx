import { ThemeProvider } from "@/components/theme-provider";
import UrlAnalyzer from "@/components/url-analyzer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <UrlAnalyzer />
    </div>
  );
}
