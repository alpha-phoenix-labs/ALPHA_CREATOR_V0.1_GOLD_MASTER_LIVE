import { AlphaCreatorApp } from "@/components/dashboard/alpha-creator-app";

export default async function RoutePage({ params }: { params: Promise<{ route: string }> }) {
  const { route } = await params;
  return <AlphaCreatorApp initialRoute={route} />;
}

