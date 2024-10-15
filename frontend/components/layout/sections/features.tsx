import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { icons } from "lucide-react";

interface FeaturesProps {
  icon: string;
  title: string;
  description: string;
}

const featureList: FeaturesProps[] = [
  {
    icon: "PictureInPicture",
    title: "LLM-powered Stock Suggestions",
    description:
      "Get personalized stock suggestions and insights using an ensemble of FinanceLLM, Qwen2-VL-7B-Instruct, and FinBERT, tailored to your portfolio.",

  },
  {
    icon: "UserCheck",
    title: "Personal Finance Advisor",
    description:
      "Receive expert financial advice from a specialized LLM agent that factors in your experience, goals, and offers multilingual support.",
  },
  {
    icon: "Goal",
    title: "GenAI Product Comparisons",
    description:
      "Leverage our 'Market Analyst' LLM to compare and analyze products using stock data parsing capabilities.",
  },
  {
    icon: "Newspaper",
    title: "Investor Sentiment Analysis",
    description:
      "Track real-time news and AI-driven sentiment analysis for your preferred investments and portfolios.",
  },
  {
    icon: "LineChart",
    title: "Interactive RAG Graph Analysis",
    description:
      "Upload stock graphs and use drift-aware, RAG-based models to forecast strategies with advanced financial backtesting.",
  },
  {
    icon: "MousePointerClick",
    title: "RAG-based AI Extraction",
    description:
      "Analyze SEC filings and reports with our AI system, extracting critical data for informed business decisions.",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="container py-24 sm:py-32">
      <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
        Features
      </h2>

      <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
        What Makes Us Different
      </h2>

      <h3 className="md:w-1/2 mx-auto text-xl text-center text-muted-foreground mb-8">
        Lorem ipsum dolor, sit amet consectetur adipisicing elit. Voluptatem
        fugiat, odit similique quasi sint reiciendis quidem iure veritatis optio
        facere tenetur.
      </h3>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {featureList.map(({ icon, title, description }) => (
          <div key={title}>
            <Card className="h-full bg-background border-0 shadow-none">
              <CardHeader className="flex justify-center items-center">
                <div className="bg-primary/20 p-2 rounded-full ring-8 ring-primary/10 mb-4">
                  <Icon
                    name={icon as keyof typeof icons}
                    size={24}
                    color="hsl(var(--primary))"
                    className="text-primary"
                  />
                </div>

                <CardTitle>{title}</CardTitle>
              </CardHeader>

              <CardContent className="text-muted-foreground text-center">
                {description}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </section>
  );
};