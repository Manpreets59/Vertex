import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ProjectIdLayout } from "@/features/projects/components/project-id-layout";

import { Id } from "../../../../convex/_generated/dataModel";

const Layout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>
}) => {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const { projectId } = await params;

  return (
    <ProjectIdLayout
      projectId={projectId as Id<"projects">}
    >
      {children}
    </ProjectIdLayout>
  );
}
 
export default Layout;