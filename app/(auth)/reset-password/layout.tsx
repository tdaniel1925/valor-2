// Force dynamic rendering for reset-password pages
export const dynamic = "force-dynamic";

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
