
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function checkPublic() {
  const { db } = await import("./src/lib/db/index");
  const { projects } = await import("./src/lib/db/schema");


  // Check public projects
  const publicProjects = await db.select().from(projects);
  console.log("Public Projects:", publicProjects.length);
  console.log(JSON.stringify(publicProjects, null, 2));

  process.exit(0);
}

checkPublic();
