import { rm } from "node:fs/promises";
export default async function teardown() {
  const database = process.env.OCS_BROWSER_TEST_DATABASE;
  if (database)
    await Promise.all(
      ["", "-wal", "-shm"].map((suffix) =>
        rm(database + suffix, { force: true }),
      ),
    );
}
