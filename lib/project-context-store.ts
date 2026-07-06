import { prisma } from "@/lib/prisma";
import { type ProjectContext } from "@/lib/schema";

export const DEFAULT_PROJECT_CONTEXT_ID = "default-project-context";

function toProjectContext(projectContext: {
  id: string;
  projectName: string;
  clientName: string;
  approvedScope: string;
  outOfScope: string | null;
  constraints: string | null;
  deadline: Date | null;
  budgetNotes: string | null;
  communicationTone: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ProjectContext {
  return {
    id: projectContext.id,
    projectName: projectContext.projectName,
    clientName: projectContext.clientName,
    approvedScope: projectContext.approvedScope,
    outOfScope: projectContext.outOfScope,
    constraints: projectContext.constraints,
    deadline: projectContext.deadline?.toISOString() ?? null,
    budgetNotes: projectContext.budgetNotes,
    communicationTone: projectContext.communicationTone,
    createdAt: projectContext.createdAt.toISOString(),
    updatedAt: projectContext.updatedAt.toISOString(),
  };
}

export async function getDefaultProjectContext(): Promise<ProjectContext> {
  const projectContext = await prisma.projectContext.upsert({
    where: {
      id: DEFAULT_PROJECT_CONTEXT_ID,
    },
    update: {},
    create: {
      id: DEFAULT_PROJECT_CONTEXT_ID,
      projectName: "Website Redesign Phase 1",
      clientName: "Acme Client",
      approvedScope: [
        "Homepage layout updates",
        "Hero copy adjustments",
        "CTA styling",
        "Basic responsive fixes",
        "Content polish for existing pages",
      ].join("\n"),
      outOfScope: [
        "CSV exports",
        "Reporting dashboards",
        "Team permissions",
        "Payment integration",
        "New authentication flows",
        "New admin modules",
      ].join("\n"),
      constraints: [
        "The team must preserve the existing launch timeline.",
        "Any new module-level feature requires review before commitment.",
      ].join("\n"),
      deadline: new Date("2026-07-10T17:00:00.000Z"),
      budgetNotes:
        "Budget is fixed for Phase 1. Additional features may require a change request.",
      communicationTone:
        "Professional, calm, clear, and non-committal until feasibility is reviewed.",
    },
  });

  return toProjectContext(projectContext);
}