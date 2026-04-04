import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="p-6 w-full max-w-md">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          redirectUrl="/"
        />
      </div>
    </div>
  );
}