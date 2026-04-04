import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="p-6 w-full max-w-md">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          redirectUrl="/"
        />
      </div>
    </div>
  );
}