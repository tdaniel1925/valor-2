// Force dynamic rendering for goals pages
export const dynamic = "force-dynamic";

export default function GoalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
