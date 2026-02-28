import { ReactNode } from "react";

export const metadata = {
  title: "SmartOffice Intelligence | Valor Financial",
  description: "AI-powered insights for your book of business",
};

export default function SmartOfficeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <a href="/" className="text-gray-500 hover:text-gray-700">
              Home
            </a>
            <span className="text-gray-400">/</span>
            <span className="font-medium text-gray-900">SmartOffice</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
