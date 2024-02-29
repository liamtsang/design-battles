import {
  Context,
  Hono,
  HTTPException,
} from "https://deno.land/x/hono@v4.0.7/mod.ts";
import { uid } from "https://deno.land/x/usid/mod.ts";
import { Category, Match, Room } from "../utils/types.ts";
import { verifySession } from "../utils/auth.ts";

const app = new Hono();
let rooms: Room[] = [];

app.get("/", async (c: Context) => {
  if (await verifySession(c) === undefined) {
    throw new HTTPException(401, { message: "Invalid Token" });
  }

  // Check if category header value is provided and is of valid Category type
  if (
    !categoryHeaderValue ||
    !(categoryHeaderValue in Category)
  ) {
    throw new HTTPException(401, { message: "Missing user information" });
  }
  // Parse category header value to Category type
  const category: Category = categoryHeaderValue as Category;

  // Remove empty rooms
  rooms = rooms.filter((room) => room.users.length > 0);

  // Check for rooms with available space and suitable Elo range
  const suitableRoom = rooms.find(
    (room) =>
      category == room.category &&
      room.users.length < 2 &&
      Math.abs(room.hostElo - userElo) < 100,
  );

  if (suitableRoom) {
    suitableRoom.users.push(userUUID);
    suitableRoom.status = "playing";
    if (suitableRoom.users.length === 2) {
      // Create match KV
      const __matchID = uid(6);
      await createMatch(suitableRoom, __matchID);
      suitableRoom.users = [];
      return new Response("", {
        status: 307,
        headers: { Location: `/match/${__matchID}` },
      });
    } else {
      return c.text(`You have joined room: ${suitableRoom.roomID}`);
    }
  } else {
    // Create a new room
    const newRoom: Room = {
      roomID: rooms.length + 1,
      category: category,
      hostElo: userElo,
      users: [userUUID],
      status: "waiting", // Set initial status to waiting
    };
    rooms.push(newRoom);
    return c.text(`You have created and joined room: ${newRoom.roomID}`);
  }
});

async function createMatch(room: Room, __matchID: string) {
  // TODO:
  // Add matches to user schema
  // Maybe make it easier to sort by match date?

  const kv = await Deno.openKv();
  const match: Match = {
    id: __matchID,
    category: room.category,
    ongoing: true,
    users: room.users,
    files: null,
    winner: null,
  };
  await kv.set(["matches", __matchID], match);
}

export default app;
