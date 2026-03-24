// Force dynamic rendering for all help pages
export const dynamic = "force-dynamic";

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
