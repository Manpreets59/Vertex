import { ShieldAlertIcon } from "lucide-react";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { OutletBoundary } from "next/dist/lib/framework/boundary-components";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
export const UnauthenticatedView = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="w-full max-w-lg bg-muted">
        <Item variant="outline">
          <ItemMedia>
            <ShieldAlertIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Unauthorized Access</ItemTitle>
            <ItemDescription>
              You are not authorized to access this resource. Please log in to
              continue.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <SignInButton>
                <Button variant={"outline"} size={"sm"}>
                    Sign in
                </Button>
            </SignInButton>
          </ItemActions>
        </Item>
      </div>
    </div>
  );
};
