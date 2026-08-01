import { z } from "zod";
import { toolRegistry } from "@/lib/tools/tool-registry";

export function getAiToolDefinitions() {
    return Object.values(toolRegistry).map((tool) => {
        const proposalInputSchema = z.object({
            arguments: tool.argumentsSchema,
            rationale: z.string().trim().min(1),
        });

        return {
            type: "function" as const,
            name: tool.name,
            description: tool.description,
            parameters: z.toJSONSchema(proposalInputSchema),
            strict: true,
        };
    });
}