"use client";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Home() {
  const tasks = useQuery(api.projects.get);
  const createProject = useMutation(api.projects.create);
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {tasks?.map(({ _id, name }) => <div key={_id}>{name}</div>)}
    </main>
  ); 
}