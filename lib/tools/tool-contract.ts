import { z } from "zod";

export type ToolContract<
    TName extends string,
    TArguments,
    TResult
> = {
    name: TName;
    description: string,
    argumentsSchema: z.ZodType<TArguments>;
    resultSchema: z.ZodType<TResult>;
    requiresApproval: true;
};