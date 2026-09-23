import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LandingPage } from "@/features/projects/components/landing-page";
import { ProjectsView } from "@/features/projects/components/projects-view";

const Home = async () => {
  const { userId } = await auth();
  
  if (userId) {
    return <ProjectsView />;
  }
  
  return <LandingPage />;
};

export default Home;