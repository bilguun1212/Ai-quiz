import { UserButton as ClerkUserButton } from "@clerk/nextjs";

export function UserButton() {
  return (
    <div className="flex items-center gap-4">

      <ClerkUserButton />
    </div>
  );
}