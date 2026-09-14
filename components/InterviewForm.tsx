"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const interviewFormSchema = z.object({
  role: z.string().trim().min(2, "Enter a valid job role"),
  level: z.string().trim().min(1, "Select an experience level"),
  techstack: z.string().trim().min(1, "Enter at least one technology"),
  amount: z.coerce.number().int().min(1).max(10),
  type: z.enum(["technical", "behavioral", "mixed"]),
});

type InterviewFormInput = z.input<typeof interviewFormSchema>;
type InterviewFormValues = z.output<typeof interviewFormSchema>;

const InterviewForm = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InterviewFormInput, undefined, InterviewFormValues>({
    resolver: zodResolver(interviewFormSchema),
    defaultValues: {
      role: "",
      level: "junior",
      techstack: "",
      amount: 5,
      type: "mixed",
    },
  });

  const onSubmit = async (values: InterviewFormValues) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/vapi/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to create interview");
      }

      if (!data.interviewId) {
        throw new Error("The server did not return an interview ID");
      }

      router.push(`/interview/${data.interviewId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const errors = form.formState.errors;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="form mx-auto flex w-full max-w-xl flex-col gap-5"
    >
      <div>
        <label htmlFor="role">Job role</label>
        <Input id="role" placeholder="Frontend Developer" {...form.register("role")} />
        {errors.role && <p className="text-destructive">{errors.role.message}</p>}
      </div>

      <div>
        <label htmlFor="level">Experience level</label>
        <select id="level" {...form.register("level")} className="input">
          <option value="junior">Junior</option>
          <option value="mid-level">Mid-level</option>
          <option value="senior">Senior</option>
        </select>
        {errors.level && <p className="text-destructive">{errors.level.message}</p>}
      </div>

      <div>
        <label htmlFor="techstack">Tech stack</label>
        <Input
          id="techstack"
          placeholder="React, TypeScript, Next.js"
          {...form.register("techstack")}
        />
        {errors.techstack && <p className="text-destructive">{errors.techstack.message}</p>}
      </div>

      <div>
        <label htmlFor="amount">Number of questions</label>
        <Input
          id="amount"
          type="number"
          min={1}
          max={10}
          {...form.register("amount", { valueAsNumber: true })}
        />
        {errors.amount && <p className="text-destructive">{errors.amount.message}</p>}
      </div>

      <div>
        <label htmlFor="type">Interview type</label>
        <select id="type" {...form.register("type")} className="input">
          <option value="technical">Technical</option>
          <option value="behavioral">Behavioral</option>
          <option value="mixed">Mixed</option>
        </select>
      </div>

      <Button type="submit" disabled={isSubmitting} className="btn-primary">
        {isSubmitting ? "Preparing interview..." : "Create interview"}
      </Button>
    </form>
  );
};

export default InterviewForm;
