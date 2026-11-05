import { UserButton } from "@clerk/nextjs";
export function UserIconButton() {
  return (
    <UserButton
      appearance={{
        elements: {
          userButtonTrigger: {
            width: "44px",
            height: "44px",
            backgroundColor: "transparent",
            boxShadow: "none",
            "&:focus": {
              boxShadow: "none",
            },
            "&:hover": {
              backgroundColor: "transparent",
            },
          },
          userButtonAvatarBox: {
            width: "32px",
            height: "32px",
            backgroundColor: "transparent",
          },
          userButtonAvatarImage: {
            content: "url('./person.svg')",
          },
        },
      }}
    />
  );
}
