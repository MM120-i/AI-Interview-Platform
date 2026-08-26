"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Form } from "@/components/ui/form";
import Link from "next/link";
import { toast } from "sonner";
import FormField from "./FormField";
import { useRouter } from "next/navigation";

const AuthFormSchema = (type: FormType) => {
  return z.object({
    name: type === "sign-up" ? z.string().min(3) : z.string().optional(),
    email: z.email(),
    password: z.string().min(3),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
  const formSchema = AuthFormSchema(type);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    try {
      if (type === "sign-up") {
        toast.success("Account created successfully. Please Sign In");
        router.push("/sign-in");
      } else {
        toast.success("Sign in successfully");
        router.push("/");
      }
    } catch (error) {
      console.error(error);
      toast.error(`There was an error ${error}`);
    }
  };

  const isSignIn = type === "sign-in";

  return (
    <div className="card-border lg:min-w-141.5">
      <div className="card flex flex-col gap-6 px-10 py-14">
        <div className="flex flex-row justify-center gap-2">
          <Image
            src={"/logo.svg"}
            alt="logo"
            height={32}
            width={38}
            style={{ width: "auto", height: "auto" }}
            unoptimized
          />
          <h2 className="text-primary-100">PrepPilot</h2>
        </div>
        <h3>Practice Job interviews with AI</h3>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="form mt-4 w-full space-y-6">
            {!isSignIn && (
              <FormField
                control={form.control}
                name={"name"}
                label="Name"
                placeholder="Your Name"
              />
            )}

            <FormField
              control={form.control}
              name={"email"}
              label="Email"
              placeholder="Your Email Address"
              type="email"
            />

            <FormField
              control={form.control}
              name={"password"}
              label="Password"
              placeholder="Your password"
              type="password"
            />

            <Button type="submit" className={"btn"}>
              {isSignIn ? "Sign in" : "Create an Account"}
            </Button>
          </form>
        </Form>

        <p className="text-center">{isSignIn ? "No Account yet?" : "Have an account already?"}</p>
        <Link
          href={!isSignIn ? "/sign-in" : "/sign-up"}
          className="text-user-primary ml-1 font-bold"
        >
          {!isSignIn ? "Sign in" : "Sign up"}
        </Link>
      </div>
    </div>
  );
};

export default AuthForm;
