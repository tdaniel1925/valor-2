import { prisma } from "@/lib/db/prisma";

/**
 * Case Workflow Management
 * Handles case status transitions, validations, and lifecycle management
 */

// Define valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["PENDING_REQUIREMENTS", "IN_UNDERWRITING", "WITHDRAWN"],
  PENDING_REQUIREMENTS: ["SUBMITTED", "WITHDRAWN"],
  IN_UNDERWRITING: ["APPROVED", "DECLINED", "POSTPONED"],
  APPROVED: ["ISSUED"],
  ISSUED: ["INFORCE", "LAPSED"],
  DECLINED: [],
  POSTPONED: ["SUBMITTED"],
  WITHDRAWN: [],
  INFORCE: ["LAPSED", "SURRENDERED"],
  LAPSED: ["INFORCE"],
  SURRENDERED: [],
};

export interface CaseTransitionInput {
  caseId: string;
  newStatus: string;
  userId: string;
  notes?: string;
  metadata?: any;
}

export interface CaseTransitionResult {
  success: boolean;
  case: any;
  transition: any;
  error?: string;
}

/**
 * Validate if a status transition is allowed
 */
export function isValidTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

/**
 * Transition a case to a new status with validation
 */
export async function transitionCaseStatus(
  input: CaseTransitionInput
): Promise<CaseTransitionResult> {
  const { caseId, newStatus, userId, notes, metadata } = input;

  // Get current case
  const currentCase = await prisma.case.findUnique({
    where: { id: caseId },
  });

  if (!currentCase) {
    return {
      success: false,
      case: null,
      transition: null,
      error: "Case not found",
    };
  }

  // Validate transition
  if (!isValidTransition(currentCase.status, newStatus)) {
    return {
      success: false,
      case: currentCase,
      transition: null,
      error: `Invalid transition from ${currentCase.status} to ${newStatus}`,
    };
  }

  // Update case status
  const updatedCase = await prisma.case.update({
    where: { id: caseId },
    data: {
      status: newStatus as any,
      statusNotes: notes,
      // Set dates based on status
      ...(newStatus === "SUBMITTED" && { submittedAt: new Date() }),
      ...(newStatus === "APPROVED" && { approvedAt: new Date() }),
      ...(newStatus === "ISSUED" && { issuedAt: new Date() }),
    },
  });

  // Create audit log entry
  const transition = await prisma.auditLog.create({
    data: {
      userId,
      action: "CASE_STATUS_CHANGE",
      entityType: "CASE",
      entityId: caseId,
      changes: JSON.stringify({
        from: currentCase.status,
        to: newStatus,
        notes,
        metadata,
      }),
    },
  });

  // Create notification for case owner if different from user making change
  if (currentCase.userId !== userId) {
    await prisma.notification.create({
      data: {
        userId: currentCase.userId,
        type: "CASE_UPDATE",
        title: "Case Status Updated",
        message: `Your case for ${currentCase.clientName} has been updated to ${newStatus}`,
        link: `/cases/${caseId}`,
      },
    });
  }

  return {
    success: true,
    case: updatedCase,
    transition,
  };
}

/**
 * Add a requirement to a case
 */
export async function addCaseRequirement(
  caseId: string,
  requirement: {
    type: string;
    description: string;
    dueDate?: Date;
    assignedTo?: string;
  }
) {
  const currentCase = await prisma.case.findUnique({
    where: { id: caseId },
  });

  if (!currentCase) {
    throw new Error("Case not found");
  }

  // Add requirement to pendingRequirements JSON field
  const pendingRequirements = (currentCase.pendingRequirements as any[]) || [];
  pendingRequirements.push({
    id: crypto.randomUUID(),
    ...requirement,
    status: "PENDING",
    createdAt: new Date(),
  });

  return await prisma.case.update({
    where: { id: caseId },
    data: {
      pendingRequirements,
      status: "PENDING_REQUIREMENTS",
    },
  });
}

/**
 * Complete a requirement
 */
export async function completeRequirement(
  caseId: string,
  requirementId: string,
  completedBy: string,
  notes?: string
) {
  const currentCase = await prisma.case.findUnique({
    where: { id: caseId },
  });

  if (!currentCase) {
    throw new Error("Case not found");
  }

  const pendingRequirements = (currentCase.pendingRequirements as any[]) || [];
  const updatedRequirements = pendingRequirements.map((req) =>
    req.id === requirementId
      ? {
          ...req,
          status: "COMPLETED",
          completedAt: new Date(),
          completedBy,
          notes,
        }
      : req
  );

  // Check if all requirements are completed
  const allCompleted = updatedRequirements.every(
    (req) => req.status === "COMPLETED"
  );

  return await prisma.case.update({
    where: { id: caseId },
    data: {
      pendingRequirements: updatedRequirements,
      // If all requirements completed, move back to SUBMITTED
      ...(allCompleted && { status: "SUBMITTED" }),
    },
  });
}

/**
 * Add a note to a case
 */
export async function addCaseNote(
  caseId: string,
  content: string,
  createdBy: string,
  isInternal: boolean = false
) {
  return await prisma.caseNote.create({
    data: {
      caseId,
      content,
      createdBy,
      isInternal,
    },
  });
}

/**
 * Get case history (all transitions and notes)
 */
export async function getCaseHistory(caseId: string) {
  const [transitions, notes] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        entityType: "CASE",
        entityId: caseId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.caseNote.findMany({
      where: { caseId },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return {
    transitions,
    notes,
  };
}

/**
 * Bulk update case statuses
 */
export async function bulkTransitionCases(
  caseIds: string[],
  newStatus: string,
  userId: string,
  notes?: string
) {
  const results = [];

  for (const caseId of caseIds) {
    const result = await transitionCaseStatus({
      caseId,
      newStatus,
      userId,
      notes,
    });
    results.push(result);
  }

  return results;
}

/**
 * Get cases pending action
 */
export async function getCasesPendingAction(userId?: string) {
  const where: any = {
    status: {
      in: ["PENDING_REQUIREMENTS", "IN_UNDERWRITING"],
    },
  };

  if (userId) {
    where.userId = userId;
  }

  return await prisma.case.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      updatedAt: "asc",
    },
  });
}

/**
 * Get case statistics
 */
export async function getCaseStatistics(userId?: string) {
  const where: any = {};
  if (userId) {
    where.userId = userId;
  }

  const [totalCases, statusBreakdown, recentActivity] = await Promise.all([
    prisma.case.count({ where }),
    prisma.case.groupBy({
      by: ["status"],
      where,
      _count: true,
    }),
    prisma.case.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        clientName: true,
        status: true,
        updatedAt: true,
      },
    }),
  ]);

  return {
    totalCases,
    statusBreakdown,
    recentActivity,
  };
}
