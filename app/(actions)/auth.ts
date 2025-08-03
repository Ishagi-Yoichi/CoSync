import { SignupFormSchema,FormState } from "@/lib/definitions";
import { error } from "console";

export async function signup(state:FormState ,formData: FormData) {
    //field validification
    const validatedFields = SignupFormSchema.safeParse({
        name: formData.get('name'),
        email:formData.get('email'),
        password: formData.get('password')
    })
    //if any form fields are invalid, return early
    if(!validatedFields.success){
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }
    //call db to create a user
    //const user = await prisma.user.create({})
}