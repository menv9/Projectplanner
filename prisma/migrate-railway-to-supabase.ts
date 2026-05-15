import { PrismaClient } from "@prisma/client";

const railway = new PrismaClient({
  datasources: { db: { url: "postgresql://postgres:PpYcpjBPxYbODxyHQPOoVeSdhqBhkGrf@trolley.proxy.rlwy.net:27010/railway" } }
});

const supabase = new PrismaClient({
  datasources: { db: { url: "postgresql://postgres.shiyrkifedvzzuofqumg:gp3ikFKkpmUTGNv0@aws-0-eu-west-1.pooler.supabase.com:5432/postgres" } }
});

async function main() {
  console.log("Reading from Railway...");

  const [users, teams, teamMembers, projects, priorities, statuses, categories, tasks, notifications] =
    await Promise.all([
      railway.user.findMany(),
      railway.team.findMany(),
      railway.teamMember.findMany(),
      railway.project.findMany(),
      railway.priority.findMany(),
      railway.status.findMany(),
      railway.category.findMany(),
      railway.task.findMany(),
      railway.notification.findMany(),
    ]);

  console.log(`Users: ${users.length}, Teams: ${teams.length}, Projects: ${projects.length}, Tasks: ${tasks.length}`);
  console.log("Writing to Supabase...");

  // Insert in FK order
  if (users.length) await supabase.user.createMany({ data: users, skipDuplicates: true });
  console.log("✓ Users");

  if (teams.length) await supabase.team.createMany({ data: teams, skipDuplicates: true });
  console.log("✓ Teams");

  if (teamMembers.length) await supabase.teamMember.createMany({ data: teamMembers, skipDuplicates: true });
  console.log("✓ TeamMembers");

  if (projects.length) await supabase.project.createMany({ data: projects, skipDuplicates: true });
  console.log("✓ Projects");

  if (priorities.length) await supabase.priority.createMany({ data: priorities, skipDuplicates: true });
  console.log("✓ Priorities");

  if (statuses.length) await supabase.status.createMany({ data: statuses, skipDuplicates: true });
  console.log("✓ Statuses");

  if (categories.length) await supabase.category.createMany({ data: categories, skipDuplicates: true });
  console.log("✓ Categories");

  if (tasks.length) await supabase.task.createMany({ data: tasks, skipDuplicates: true });
  console.log("✓ Tasks");

  if (notifications.length) await supabase.notification.createMany({ data: notifications, skipDuplicates: true });
  console.log("✓ Notifications");

  console.log("Done! All data migrated.");
}

main()
  .catch(console.error)
  .finally(async () => {
    await railway.$disconnect();
    await supabase.$disconnect();
  });
