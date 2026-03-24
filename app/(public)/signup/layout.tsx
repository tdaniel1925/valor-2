// Force dynamic rendering for all signup pages
export const dynamic = "force-dynamic";

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
