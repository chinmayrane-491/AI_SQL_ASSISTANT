
import { z } from "zod";

export const explanationSchema = z.object({
    answer: z.string().describe(
        "A simple, direct answer to the user's original question based only on the returned data."
    ),

    keyInsights: z.array(z.string()).describe(
        "Important observations supported by the returned data."
    ),

    dataSummary: z.string().describe(
        "A short summary of what the returned records contain."
    ),

    limitations: z.array(z.string()).describe(
        "Important limitations, missing information, or caveats. Return an empty array when there are none."
    ),
});
