import { FlatProvider } from "./FlatProvider";

export default async function FlatLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ flatId: string }>;
}) {
  const { flatId } = await params;
  return <FlatProvider flatId={flatId}>{children}</FlatProvider>;
}
