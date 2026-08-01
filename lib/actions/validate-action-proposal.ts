import { actionProposalDraftSchema, type ActionProposalDraft } from "@/lib/actions/action-proposal";
import { toolRegistry, type ToolName } from "@/lib/tools/tool-registry";

export type ValidatedActionProposal = {
    toolName: ToolName;
    arguments: unknown;
    rationale: string;
    requiresApproval: true;
}

export function validateActionProposal(
    rawProposal: unknown
): ValidatedActionProposal {
    const proposal = actionProposalDraftSchema.parse(rawProposal);

    if(!(proposal.toolName in toolRegistry)) {
        throw new Error(`Unknown tool name: ${proposal.toolName}`);
    }

    const toolName = proposal.toolName as ToolName;
    const tool = toolRegistry[toolName];
    
    const validatedArguments = tool.argumentsSchema.parse(proposal.arguments);

    return {
        toolName,
        arguments: validatedArguments,
        rationale: proposal.rationale,
        requiresApproval: tool.requiresApproval,
    };
}