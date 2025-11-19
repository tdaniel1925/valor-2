"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";

interface Organization {
  id: string;
  name: string;
  type: string;
  status: string;
  parentId?: string;
  children?: Organization[];
  _count?: {
    members: number;
    contracts: number;
  };
}

interface OrganizationTreeProps {
  organizations: Organization[];
  onSelectOrganization?: (org: Organization) => void;
  onEditOrganization?: (org: Organization) => void;
}

function buildTree(organizations: Organization[]): Organization[] {
  const orgMap = new Map<string, Organization>();
  const roots: Organization[] = [];

  // Create a map of all organizations
  organizations.forEach((org) => {
    orgMap.set(org.id, { ...org, children: [] });
  });

  // Build the tree structure
  organizations.forEach((org) => {
    const node = orgMap.get(org.id)!;
    if (org.parentId) {
      const parent = orgMap.get(org.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function TreeNode({
  org,
  level = 0,
  onSelect,
  onEdit,
}: {
  org: Organization;
  level?: number;
  onSelect?: (org: Organization) => void;
  onEdit?: (org: Organization) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const hasChildren = org.children && org.children.length > 0;

  return (
    <div className="select-none">
      <div
        className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-lg cursor-pointer group"
        style={{ paddingLeft: `${level * 24 + 12}px` }}
        onClick={() => onSelect?.(org)}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ) : (
          <div className="w-4 h-4 flex-shrink-0" />
        )}

        {/* Organization Icon */}
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
          <svg
            className="w-4 h-4 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>

        {/* Organization Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{org.name}</span>
            <Badge variant="info" className="text-xs">
              {org.type}
            </Badge>
            <Badge
              variant={org.status === "ACTIVE" ? "success" : "default"}
              className="text-xs"
            >
              {org.status}
            </Badge>
          </div>
          {org._count && (
            <div className="text-xs text-gray-500 mt-0.5">
              {org._count.members} members • {org._count.contracts} contracts
            </div>
          )}
        </div>

        {/* Edit Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(org);
          }}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
        >
          Edit
        </button>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {org.children!.map((child) => (
            <TreeNode
              key={child.id}
              org={child}
              level={level + 1}
              onSelect={onSelect}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrganizationTree({
  organizations,
  onSelectOrganization,
  onEditOrganization,
}: OrganizationTreeProps) {
  const tree = buildTree(organizations);

  if (tree.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No organizations found</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tree.map((org) => (
        <TreeNode
          key={org.id}
          org={org}
          onSelect={onSelectOrganization}
          onEdit={onEditOrganization}
        />
      ))}
    </div>
  );
}
