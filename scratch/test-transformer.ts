import { transformToSlack, transformToDiscord } from "../src/lib/integrations/transformer";

const mockEvents = [
  {
    event: "project.created",
    payload: {
      name: "Alpha Project",
      actorName: "Bernardo",
      details: "High priority project for the Q2 roadmap."
    }
  },
  {
    event: "project.deleted",
    payload: {
      name: "Old Beta",
      actorName: "System"
    }
  },
  {
    event: "member.invited",
    payload: {
      email: "newuser@example.com",
      role: "Editor",
      actorName: "Bernardo"
    }
  },
  {
    event: "role.updated",
    payload: {
      targetName: "Alice Smith",
      newRole: "Admin",
      actorName: "Bernardo"
    }
  },
  {
    event: "member.removed",
    payload: {
      targetName: "John Doe",
      actorName: "Admin"
    }
  }
];

console.log("=== SLACK TRANSFORMATIONS ===");
mockEvents.forEach(({ event, payload }) => {
  console.log(`\n--- Event: ${event} ---`);
  console.log(JSON.stringify(transformToSlack(event, payload), null, 2));
});

console.log("\n\n=== DISCORD TRANSFORMATIONS ===");
mockEvents.forEach(({ event, payload }) => {
  console.log(`\n--- Event: ${event} ---`);
  console.log(JSON.stringify(transformToDiscord(event, payload), null, 2));
});
