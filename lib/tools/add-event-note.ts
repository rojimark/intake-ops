import { z } from "zod";
import type { ToolContract } from "@/lib/tools/tool-contract";

export const addEventNoteInputSchema = z.object({
    note: z.string().trim().min(1),
});

export const addEventNoteOutputSchema = z.object({
    noteId: z.string(),
    createdAt: z.iso.datetime(),
});

export const AddEventNoteContract: ToolContract<
    "addEventNote",
    AddEventnoteInput,
    AddEventNoteOutput
> = {
    name: "addEventNote",
    description: "Add an internal note to a reviewed client feedback event",
    argumentsSchema: addEventNoteInputSchema,
    resultSchema: addEventNoteOutputSchema,
    requiresApproval: true,
};

export type AddEventnoteInput = z.infer<typeof addEventNoteInputSchema>;
export type AddEventNoteOutput = z.infer<typeof addEventNoteOutputSchema>;