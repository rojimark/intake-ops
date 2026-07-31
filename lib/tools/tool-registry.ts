import { createTaskContract } from "@/lib/tools/create-task";
import { AddEventNoteContract } from "@/lib/tools/add-event-note";

export const toolRegistry = {
    createTask: createTaskContract,
    addEventNote: AddEventNoteContract,
}

export type ToolName = keyof typeof toolRegistry;