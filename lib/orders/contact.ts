import { z } from "zod";

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your name (at least 2 characters).")
    .max(120, "Name is too long."),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  phone: z
    .string()
    .trim()
    .max(30, "Phone number is too long.")
    .regex(/^[0-9+()\-\s.]*$/, "Phone number contains invalid characters.")
    .optional()
    .or(z.literal("")),
  subject: z
    .string()
    .trim()
    .min(2, "Enter a subject.")
    .max(200, "Subject is too long."),
  message: z
    .string()
    .trim()
    .min(5, "Enter a message (at least 5 characters).")
    .max(5000, "Message is too long."),
});

export type ContactInput = z.infer<typeof contactSchema>;
