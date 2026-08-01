import { z } from "zod";
import type { ToolContract } from "@/lib/tools/tool-contract";

export const createTaskInputSchema = z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1).optional(),
    priority: z.enum(["low", "medium", "high"],)
});

export const CreateTaskResultSchema = z.object({
    taskId: z.string(),
    status: z.literal("created"),
    createdAt: z.iso.datetime(),
});

export type CreateTaskArguments = z.infer<typeof createTaskInputSchema>;
export type CreateTaskResult = z.infer<typeof CreateTaskResultSchema>;

export const createTaskContract: ToolContract<
    "createTask",
    CreateTaskArguments,
    CreateTaskResult
> = {
    name: "createTask",
    description: "Create an internal task for work identified from a reviewed feedback event.",
    argumentsSchema: createTaskInputSchema,
    resultSchema: CreateTaskResultSchema,
    requiresApproval: true,
};