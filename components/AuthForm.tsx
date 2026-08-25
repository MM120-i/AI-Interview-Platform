"use client";

import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";



const formSchema = z.object({

});

const AuthForm = ({ type }: { type: FormType }) => {
  return (
    <div>
      AuthForm - {type}
    </div>
  )
}

export default AuthForm
