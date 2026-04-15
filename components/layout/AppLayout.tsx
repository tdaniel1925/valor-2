"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import NotificationCenter from "./NotificationCenter";
import QuickActions from "./QuickActions";
import OrganizationSwitcher from "./OrganizationSwitcher";
import Chatbot from "./Chatbot";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

interface NavSection {
  name?: string;
  items: NavItem[];
  roles?: string[];
}

// Main navigation sections
const mainNavigation: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: "Profile",
    href: "/profile",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

// Business section
const businessNavigation: NavItem[] = [
  {
    name: "Cases",
    href: "/cases",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    name: "Quotes",
    href: "/quotes",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    children: [
      {
        name: "Income Focused",
        href: "/quotes/income-focused/new",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ),
      },
      {
        name: "Death Benefit Focused",
        href: "/quotes/death-benefit/new",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ),
      },
      {
        name: "Term Life",
        href: "/quotes/term-life/new",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ),
      },
      {
        name: "Annuity Quote",
        href: "/quotes/annuity-quote/new",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ),
      },
      {
        name: "Inforce Policy Review",
        href: "/quotes/inforce-review/new",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ),
      },
      {
        name: "Disability Insurance",
        href: "/quotes/disability/new",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ),
      },
      {
        name: "Long Term Care",
        href: "/quotes/long-term-care/new",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ),
      },
    ],
  },
  {
    name: "Illustrations",
    href: "/illustrations/compare",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    children: [
      {
        name: "Compare",
        href: "/illustrations/compare",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
      {
        name: "WinFlex",
        href: "/integrations/winflex",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        ),
      },
      {
        name: "Term Quoting",
        href: "/integrations/ipipeline/lifepipe",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        ),
      },
    ],
  },
  {
    name: "Submissions",
    href: "/cases",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    children: [
      {
        name: "iGo - Life Insurance eApplications",
        href: "/integrations/ipipeline/igo",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        ),
      },
      {
        name: "FormsPipe - Insurance Forms",
        href: "/integrations/ipipeline/formspipe",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        ),
      },
      {
        name: "Firelight",
        href: "https://firelight.com",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        ),
      },
    ],
  },
  {
    name: "Contracts",
    href: "/contracts",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    children: [
      {
        name: "SureLC",
        href: "https://accounts.surancebay.com/oauth/authorize?redirect_uri=https:%2F%2Fsurelc.surancebay.com%2Fproducer%2Foauth%3FreturnUrl%3D%252Fprofile%252Fcontact-info%253FgaId%253D41%2526gaId%253D41%2526branch%253DValor%252520Financial%252520%25252F%252520Danielle%252520Resch%2526branchVisible%253Dtrue%2526branchEditable%253Dfalse%2526branchRequired%253Dfalse%2526autoAdd%253Dfalse%2526cc%253Dbilld%25403mark.com%2526bcc%253Dmanagement%2540valorfinancialspecialists.com%2526requestMethod%253DGET&gaId=41&client_id=surecrmweb&response_type=code",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        ),
      },
      {
        name: "Current Contracts",
        href: "/contracts",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
    ],
  },
  {
    name: "Commissions",
    href: "/commissions",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: "Underwriting",
    href: "/underwriting-guidelines",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    children: [
      {
        name: "Underwriting Guidelines",
        href: "/underwriting-guidelines",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        name: "Catalog",
        href: "/catalog",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
      },
      {
        name: "IntelliSheets",
        href: "/intellisheets",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        ),
      },
      {
        name: "XRAE",
        href: "/integrations/xrae",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ),
      },
    ],
  },
];

// Applications section
const applicationsNavigation: NavItem[] = [];

// Reports section (ADMIN, MANAGER, EXECUTIVE)
const reportsNavigation: NavItem[] = [
  {
    name: "Reports Hub",
    href: "/reports",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

// Learning & Support section
const learningNavigation: NavItem[] = [
  {
    name: "Training",
    href: "/training",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    children: [
      {
        name: "Video Library",
        href: "/video-library",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
    ],
  },
];

// Administration section (ADMIN only)
const adminNavigation: NavItem[] = [
  {
    name: "Users",
    href: "/admin/users",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    name: "Organizations",
    href: "/admin/organizations",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    name: "Contracts Admin",
    href: "/admin/contracts",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    name: "Roles & Permissions",
    href: "/admin/roles",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    name: "Integrations",
    href: "/admin/integrations",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    ),
  },
  {
    name: "Audit Logs",
    href: "/admin/audit-logs",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
];

interface AppLayoutProps {
  children: React.ReactNode;
  user?: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export default function AppLayout({ children, user }: AppLayoutProps) {
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    smartoffice: false,
    quotes: false,
    illustrations: false,
    submissions: false,
    underwriting: false,
    contracts: false,
    training: false,
    business: true,
    applications: true,
    reports: true,
    admin: true,
  });

  // Load dark mode, sidebar state, zoom level, and expanded sections from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
    if (savedMode) {
      document.documentElement.classList.add('dark');
    }

    const savedCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    setSidebarCollapsed(savedCollapsed);

    // Load zoom level
    const savedZoom = localStorage.getItem('zoomLevel');
    if (savedZoom) {
      const zoom = parseInt(savedZoom);
      setZoomLevel(zoom);
      document.documentElement.style.fontSize = `${zoom}%`;
    } else {
      // Set default smaller zoom for more content
      setZoomLevel(85);
      document.documentElement.style.fontSize = '85%';
      localStorage.setItem('zoomLevel', '85');
    }

    // Load expanded sections state
    const savedSections = localStorage.getItem('expandedSections');
    if (savedSections) {
      try {
        setExpandedSections(JSON.parse(savedSections));
      } catch (e) {
        console.error('Failed to parse saved sections:', e);
      }
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', (!darkMode).toString());
  };

  // Zoom controls
  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 10, 150);
    setZoomLevel(newZoom);
    document.documentElement.style.fontSize = `${newZoom}%`;
    localStorage.setItem('zoomLevel', newZoom.toString());
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 10, 60);
    setZoomLevel(newZoom);
    document.documentElement.style.fontSize = `${newZoom}%`;
    localStorage.setItem('zoomLevel', newZoom.toString());
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
    document.documentElement.style.fontSize = '100%';
    localStorage.setItem('zoomLevel', '100');
  };

  // Toggle sidebar collapse
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState.toString());
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSections = {
        ...prev,
        [section]: !prev[section],
      };
      // Save to localStorage
      localStorage.setItem('expandedSections', JSON.stringify(newSections));
      return newSections;
    });
  };

  // Close mobile menu when navigating
  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  // Render navigation item with optional children
  const renderNavItem = (item: NavItem, isChild = false) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections[item.name.toLowerCase().replace(/\s+/g, '')];
    const isExternalLink = item.href.startsWith('http://') || item.href.startsWith('https://');

    // For collapsed sidebar, don't render children and show only icon with tooltip
    if (sidebarCollapsed && !isChild) {
      const LinkComponent = isExternalLink ? 'a' : Link;
      const linkProps = isExternalLink
        ? { href: item.href, target: "_blank", rel: "noopener noreferrer" }
        : { href: item.href };

      return (
        <LinkComponent
          key={item.name}
          {...linkProps}
          className={cn(
            "flex items-center justify-center p-3 rounded-lg transition-colors group relative",
            isActive
              ? darkMode
                ? "bg-blue-900/30 text-blue-400"
                : "bg-blue-50 text-blue-600"
              : darkMode
              ? "text-gray-300 hover:bg-gray-700 hover:text-white"
              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          )}
          title={item.name}
        >
          {item.icon}
          {/* Tooltip */}
          <span className={cn(
            "absolute left-full ml-2 px-2 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50",
            darkMode ? "bg-gray-700 text-white" : "bg-gray-900 text-white"
          )}>
            {item.name}
          </span>
        </LinkComponent>
      );
    }

    return (
      <div key={item.name}>
        {hasChildren ? (
          <>
            <button
              onClick={() => toggleSection(item.name.toLowerCase().replace(/\s+/g, ''))}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? darkMode
                    ? "bg-blue-900/30 text-blue-400"
                    : "bg-blue-50 text-blue-600"
                  : darkMode
                  ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.name}</span>
              </div>
              <svg
                className={cn(
                  "w-4 h-4 transition-transform",
                  isExpanded ? "transform rotate-180" : ""
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isExpanded && (
              <div className="ml-6 mt-1 space-y-1">
                {item.children?.map((child) => renderNavItem(child, true))}
              </div>
            )}
          </>
        ) : isExternalLink ? (
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isChild && "text-sm",
              darkMode
                ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            {item.icon}
            <span>{item.name}</span>
          </a>
        ) : (
          <Link
            href={item.href}
            onClick={handleNavClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isChild && "text-sm",
              isActive
                ? darkMode
                  ? "bg-blue-900/30 text-blue-400"
                  : "bg-blue-50 text-blue-600"
                : darkMode
                ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        )}
      </div>
    );
  };

  return (
    <div className={cn("min-h-screen flex", darkMode ? "bg-gray-900" : "bg-gray-50")}>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6 text-gray-900 dark:text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile drawer overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            className={cn(
              "lg:hidden fixed inset-y-0 left-0 w-72 z-50 transform transition-transform duration-300 ease-in-out",
              darkMode ? "bg-gray-800" : "bg-white"
            )}
          >
            <div className="flex flex-col h-full">
              {/* Mobile drawer header */}
              <div className={cn(
                "flex items-center justify-between h-16 px-6 border-b",
                darkMode ? "border-gray-700" : "border-gray-200"
              )}>
                <Link href="/dashboard" className="flex items-center gap-2" onClick={handleNavClick}>
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">V</span>
                  </div>
                  <span className={cn("font-bold", darkMode ? "text-white" : "text-gray-900")}>
                    Valor
                  </span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mobile drawer navigation */}
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {/* Main Section */}
                {mainNavigation.map((item) => renderNavItem(item))}

                {/* Business Section */}
                <div className={cn("pt-4 mt-4 border-t", darkMode ? "border-gray-700" : "border-gray-200")}>
                  <div className="px-3 mb-2">
                    <p className={cn(
                      "text-xs font-semibold uppercase tracking-wider",
                      darkMode ? "text-gray-500" : "text-gray-400"
                    )}>
                      Business
                    </p>
                  </div>
                  {businessNavigation.map((item) => renderNavItem(item))}
                </div>

                {/* Applications Section */}
                <div className={cn("pt-4 mt-4 border-t", darkMode ? "border-gray-700" : "border-gray-200")}>
                  <div className="px-3 mb-2">
                    <p className={cn(
                      "text-xs font-semibold uppercase tracking-wider",
                      darkMode ? "text-gray-500" : "text-gray-400"
                    )}>
                      Applications
                    </p>
                  </div>
                  {applicationsNavigation.map((item) => renderNavItem(item))}
                </div>

                {/* Reports Section (ADMIN, MANAGER, EXECUTIVE) */}
                <div className={cn("pt-4 mt-4 border-t", darkMode ? "border-gray-700" : "border-gray-200")}>
                  <div className="px-3 mb-2">
                    <p className={cn(
                      "text-xs font-semibold uppercase tracking-wider",
                      darkMode ? "text-gray-500" : "text-gray-400"
                    )}>
                      Reports
                    </p>
                  </div>
                  {reportsNavigation.map((item) => renderNavItem(item))}
                </div>

                {/* Administration Section (ADMIN only) */}
                <div className={cn("pt-4 mt-4 border-t", darkMode ? "border-gray-700" : "border-gray-200")}>
                  <div className="px-3 mb-2">
                    <p className={cn(
                      "text-xs font-semibold uppercase tracking-wider",
                      darkMode ? "text-gray-500" : "text-gray-400"
                    )}>
                      Administration
                    </p>
                  </div>
                  {adminNavigation.map((item) => renderNavItem(item))}
                </div>

                {/* Learning & Support Section */}
                <div className={cn("pt-4 mt-4 border-t", darkMode ? "border-gray-700" : "border-gray-200")}>
                  <div className="px-3 mb-2">
                    <p className={cn(
                      "text-xs font-semibold uppercase tracking-wider",
                      darkMode ? "text-gray-500" : "text-gray-400"
                    )}>
                      Learning & Support
                    </p>
                  </div>
                  {learningNavigation.map((item) => renderNavItem(item))}
                  <Link
                    href="/resources"
                    onClick={handleNavClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      pathname.startsWith('/resources')
                        ? darkMode
                          ? "bg-blue-900/30 text-blue-400"
                          : "bg-blue-50 text-blue-600"
                        : darkMode
                        ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    Resources
                  </Link>
                  <Link
                    href="/help"
                    onClick={handleNavClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      pathname.startsWith('/help')
                        ? darkMode
                          ? "bg-blue-900/30 text-blue-400"
                          : "bg-blue-50 text-blue-600"
                        : darkMode
                        ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Help Center
                  </Link>
                  <Link
                    href="/knowledge-base"
                    onClick={handleNavClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      pathname.startsWith('/knowledge-base')
                        ? darkMode
                          ? "bg-blue-900/30 text-blue-400"
                          : "bg-blue-50 text-blue-600"
                        : darkMode
                        ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Knowledge Base
                  </Link>
                  <Link
                    href="/community"
                    onClick={handleNavClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      pathname.startsWith('/community')
                        ? darkMode
                          ? "bg-blue-900/30 text-blue-400"
                          : "bg-blue-50 text-blue-600"
                        : darkMode
                        ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Community
                  </Link>
                </div>
              </nav>

              {/* Mobile drawer user section */}
              <div className={cn(
                "flex-shrink-0 border-t p-4",
                darkMode ? "border-gray-700" : "border-gray-200"
              )}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    darkMode ? "bg-blue-900/30" : "bg-blue-100"
                  )}>
                    <span className={cn(
                      "font-semibold text-sm",
                      darkMode ? "text-blue-400" : "text-blue-600"
                    )}>
                      {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      darkMode ? "text-white" : "text-gray-900"
                    )}>
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email}
                    </p>
                    <form action="/auth/signout" method="post">
                      <button
                        type="submit"
                        className={cn(
                          "text-xs",
                          darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        Sign out
                      </button>
                    </form>
                  </div>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors min-h-[44px]",
                    darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  )}
                >
                  {darkMode ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Light Mode
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      Dark Mode
                    </>
                  )}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Desktop Sidebar - hide on mobile */}
      <aside className="hidden lg:flex lg:flex-shrink-0">
        <div className={cn(
          "flex flex-col border-r transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64",
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          {/* Logo */}
          <div className={cn(
            "flex items-center h-16 border-b",
            sidebarCollapsed ? "justify-center px-2" : "justify-between px-6",
            darkMode ? "border-gray-700" : "border-gray-200"
          )}>
            {!sidebarCollapsed && (
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <span className={cn("font-bold", darkMode ? "text-white" : "text-gray-900")}>
                  Valor
                </span>
              </Link>
            )}
            {sidebarCollapsed && (
              <Link href="/dashboard" className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
              </Link>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={toggleDarkMode}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"
                )}
                aria-label="Toggle dark mode"
                title="Toggle dark mode"
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {/* Main Section */}
            {mainNavigation.map((item) => renderNavItem(item))}

            {/* Business Section */}
            <div className={cn("pt-4 mt-4 border-t", darkMode ? "border-gray-700" : "border-gray-200")}>
              {!sidebarCollapsed && (
                <div className="px-3 mb-2">
                  <p className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    darkMode ? "text-gray-500" : "text-gray-400"
                  )}>
                    Business
                  </p>
                </div>
              )}
              {businessNavigation.map((item) => renderNavItem(item))}
            </div>

            {/* Applications Section */}
            <div className={cn("pt-4 mt-4 border-t", darkMode ? "border-gray-700" : "border-gray-200")}>
              {!sidebarCollapsed && (
                <div className="px-3 mb-2">
                  <p className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    darkMode ? "text-gray-500" : "text-gray-400"
                  )}>
                    Applications
                  </p>
                </div>
              )}
              {applicationsNavigation.map((item) => renderNavItem(item))}
            </div>

            {/* Reports Section (ADMIN, MANAGER, EXECUTIVE) */}
            <div className={cn("pt-4 mt-4 border-t", darkMode ? "border-gray-700" : "border-gray-200")}>
              {!sidebarCollapsed && (
                <div className="px-3 mb-2">
                  <p className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    darkMode ? "text-gray-500" : "text-gray-400"
                  )}>
                    Reports
                  </p>
                </div>
              )}
              {reportsNavigation.map((item) => renderNavItem(item))}
            </div>

            {/* Administration Section (ADMIN only) */}
            <div className={cn("pt-4 mt-4 border-t", darkMode ? "border-gray-700" : "border-gray-200")}>
              {!sidebarCollapsed && (
                <div className="px-3 mb-2">
                  <p className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    darkMode ? "text-gray-500" : "text-gray-400"
                  )}>
                    Administration
                  </p>
                </div>
              )}
              {adminNavigation.map((item) => renderNavItem(item))}
            </div>

            {/* Learning & Support Section */}
            <div className={cn("pt-4 mt-4 border-t", darkMode ? "border-gray-700" : "border-gray-200")}>
              {!sidebarCollapsed && (
                <div className="px-3 mb-2">
                  <p className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    darkMode ? "text-gray-500" : "text-gray-400"
                  )}>
                    Learning & Support
                  </p>
                </div>
              )}
              {learningNavigation.map((item) => renderNavItem(item))}
              <Link
                href="/resources"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname.startsWith('/resources')
                    ? darkMode
                      ? "bg-blue-900/30 text-blue-400"
                      : "bg-blue-50 text-blue-600"
                    : darkMode
                    ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Resources
              </Link>
              <Link
                href="/help"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname.startsWith('/help')
                    ? darkMode
                      ? "bg-blue-900/30 text-blue-400"
                      : "bg-blue-50 text-blue-600"
                    : darkMode
                    ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Help Center
              </Link>
              <Link
                href="/knowledge-base"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname.startsWith('/knowledge-base')
                    ? darkMode
                      ? "bg-blue-900/30 text-blue-400"
                      : "bg-blue-50 text-blue-600"
                    : darkMode
                    ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Knowledge Base
              </Link>
              <Link
                href="/community"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname.startsWith('/community')
                    ? darkMode
                      ? "bg-blue-900/30 text-blue-400"
                      : "bg-blue-50 text-blue-600"
                    : darkMode
                    ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Community
              </Link>
            </div>
          </nav>

          {/* Toggle Sidebar Button */}
          <div className={cn(
            "flex-shrink-0 border-t p-2",
            darkMode ? "border-gray-700" : "border-gray-200"
          )}>
            <button
              onClick={toggleSidebar}
              className={cn(
                "w-full flex items-center justify-center p-2 rounded-lg transition-colors",
                darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"
              )}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="ml-2 text-sm">Collapse</span>
                </>
              )}
            </button>
          </div>

          {/* User Section */}
          <div className={cn(
            "flex-shrink-0 border-t p-4",
            darkMode ? "border-gray-700" : "border-gray-200"
          )}>
            {sidebarCollapsed ? (
              <div className="flex justify-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  darkMode ? "bg-blue-900/30" : "bg-blue-100"
                )}>
                  <span className={cn(
                    "font-semibold text-sm",
                    darkMode ? "text-blue-400" : "text-blue-600"
                  )}>
                    {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  darkMode ? "bg-blue-900/30" : "bg-blue-100"
                )}>
                  <span className={cn(
                    "font-semibold text-sm",
                    darkMode ? "text-blue-400" : "text-blue-600"
                  )}>
                    {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    darkMode ? "text-white" : "text-gray-900"
                  )}>
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email}
                  </p>
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className={cn(
                        "text-xs",
                        darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Top header bar for desktop - aligned with sidebar header height */}
        <div className={cn(
          "hidden lg:flex items-center h-16 border-b px-6",
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <div className="flex items-center justify-between gap-4 w-full">
            <OrganizationSwitcher />
            <div className="flex items-center gap-3">
              {/* Zoom Controls */}
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg border",
                darkMode ? "border-gray-600 bg-gray-700/50" : "border-gray-200 bg-gray-50"
              )}>
                <button
                  onClick={handleZoomOut}
                  className={cn(
                    "p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors",
                    darkMode ? "text-gray-300" : "text-gray-600"
                  )}
                  title="Zoom Out"
                  aria-label="Zoom Out"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <button
                  onClick={handleZoomReset}
                  className={cn(
                    "px-2 py-1 text-xs font-medium rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-w-[3rem] text-center",
                    darkMode ? "text-gray-300" : "text-gray-700"
                  )}
                  title="Reset Zoom"
                  aria-label="Reset Zoom"
                >
                  {zoomLevel}%
                </button>
                <button
                  onClick={handleZoomIn}
                  className={cn(
                    "p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors",
                    darkMode ? "text-gray-300" : "text-gray-600"
                  )}
                  title="Zoom In"
                  aria-label="Zoom In"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              <QuickActions />
              <NotificationCenter />
            </div>
          </div>
        </div>

        {/* Main content - add padding bottom on mobile for bottom nav */}
        <main className={cn(
          "flex-1 overflow-y-auto pb-16 lg:pb-0",
          darkMode ? "bg-gray-900" : "bg-gray-50"
        )}>
          {children}
        </main>

        {/* Bottom mobile navigation bar */}
        <nav className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t safe-bottom",
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <div className="grid grid-cols-5 h-16">
            <Link
              href="/dashboard"
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px]",
                pathname === "/dashboard"
                  ? darkMode
                    ? "text-blue-400"
                    : "text-blue-600"
                  : darkMode
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs font-medium">Home</span>
            </Link>
            <Link
              href="/cases"
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px]",
                pathname.startsWith("/cases")
                  ? darkMode
                    ? "text-blue-400"
                    : "text-blue-600"
                  : darkMode
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-medium">Cases</span>
            </Link>
            <Link
              href="/quotes"
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px]",
                pathname.startsWith("/quotes")
                  ? darkMode
                    ? "text-blue-400"
                    : "text-blue-600"
                  : darkMode
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-xs font-medium">Quotes</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px]",
                darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-900"
              )}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-xs font-medium">Menu</span>
            </button>
            <Link
              href="/profile"
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px]",
                pathname.startsWith("/profile")
                  ? darkMode
                    ? "text-blue-400"
                    : "text-blue-600"
                  : darkMode
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs font-medium">Profile</span>
            </Link>
          </div>
        </nav>

        {/* Chatbot Widget */}
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 lg:bottom-6">
          <Chatbot darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
}
