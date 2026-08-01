import {z} from "zod";
import { createTaskInputSchema } from "@/lib/tools/create-task";
import { addEventNoteInputSchema } from "@/lib/tools/add-event-note";

const createTaskProposalSchema = z.object({
    toolName: z.literal("createTask"),
    arguments: createTaskInputSchema,
    rationale: z.string().trim().min(1),
});

const addEventNoteProposalSchema = z.object({
    toolName: z.literal("addEventNote"),
    argumets: addEventNoteInputSchema,
    rationale: z.string().trim().min(1),
});

export const actionProposalsResponseSchema = z.object({
    proposals: z.array(
        z.discriminatedUnion("toolName", [
            createTaskProposalSchema,
            addEventNoteProposalSchema
        ])
    )
});

export type ActionProposalsResponse = z.infer<typeof actionProposalsResponseSchema>;