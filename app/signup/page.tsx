'use client'
import { Geist } from 'next/font/google';
import {signup} from '@/app/(actions)/auth'
import { useActionState } from 'react';
const geist = Geist({ subsets: ['latin'] });
const res = await fetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(FormData),
    headers: { 'Content-Type': 'application/json' },
  });
  
export default function SignUp() {
    const [state, action , pending] = useActionState(signup,undefined)
    return <form action={action}>
    <div className="h-screen flex justify-center flex-col">
        <div className="flex justify-center">
        <a href="#" className="block max-w-sm p-6 bg-pink-50 border border-pink-200 rounded-2xl shadow">
                <div>
                    <div className="px-10">
                        <div className={`text-3xl font-bold ${geist.className}`}>
                            SignUp
                        </div>
                    </div>
                    <div className="pt-2">
                        <label className='pt-10'>UserName:
                        <input id="name" placeholder="Nikunj Tiwari"  /><br/>
                        {state?.errors?.name && <p>{state.errors.name}</p>}
                        </label>
                        <label>Password:
                        <input id="password" type={"password"} placeholder="Nik22@" />
                        {state?.errors?.password && (
                             <div>
                                <p>Password must:</p>
                                <ul>
                                    {state.errors.password.map((error) => (
                                    <li key={error}>- {error}</li>
                                    ))}
                                </ul>
                                </div>
                        )} </label><br/>
                        <label>Email: <input id="email" placeholder='nik22@yahoo.com' type="email"/> </label>
                        <button type="button" className={` ${geist.className} mt-8 w-full text-white bg-pink-500 focus:ring-4 focus:ring-gray-300 font-medium rounded-3xl text-sm px-5 py-2.5 me-2 mb-2`}>Sign Up</button>
                    </div>
                </div>
            </a>
        </div>
    </div>
    </form>
}

interface LabelledInputType {
    label: string;
    placeholder: string;
    type?: string;
}

function LabelledInput({ label, placeholder, type }: LabelledInputType) {
    return <div>
        <label className={` ${geist.className} block mb-2 text-sm text-black font-semibold pt-4`}>{label}</label>
        <input type={type || "text"} id="first_name" className={` ${geist.className} bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`} placeholder={placeholder} required />
    </div>
}