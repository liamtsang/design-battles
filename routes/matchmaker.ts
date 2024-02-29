import {
  Context,
  Hono,
  HTTPException,
} from "https://deno.land/x/hono@v4.0.7/mod.ts";
import { uid } from "https://deno.land/x/usid/mod.ts";
import { Category, Match, Room, User } from "../utils/types.ts";
import { verifySession } from "../utils/auth.ts";
import { getUser } from "../utils/user.ts";

const app = new Hono();
let rooms: Room[] = [];

app.get("/", async (c: Context) => {
  if (await verifySession(c) === undefined) {
    throw new HTTPException(401, { message: "Invalid Token" });
  }

  const categoryHeaderValue = c.req.query("c");
  const userArr = await getUser(c);
  const user = userArr[1] as User;
  const userId = userArr[0] as string;

  if (!categoryHeaderValue || !(categoryHeaderValue in Category)) {
    throw new HTTPException(401, { message: "Missing game category." });
  }
  const category: Category = categoryHeaderValue as Category;

  rooms = rooms.filter((room) => room.users.length > 0);

  const suitableRoom: Room = rooms.find(
    (room) =>
      category == room.category &&
      room.users.length < 2 &&
      Math.abs(room.hostElo - user.rank.elo) < 400,
  ) as Room;

  const searchResponse = await searchForRoom(
    suitableRoom,
    category,
    user,
    userId,
  );

  // What to do with response? Set up the room and set up websockets
  // Ideally this would look like a match search page like league so it would be all done server side until both players connect

  // Setup websockets middleware
  // Read websockets middleware & redirect
  // Close websockets
});

async function searchForRoom(
  suitableRoom: Room,
  category: Category,
  user: User,
  userId: string,
) {
  if (suitableRoom) {
    suitableRoom.users.push(userId);
    suitableRoom.status = "playing";
    if (suitableRoom.users.length === 2) {
      const __matchID = uid(6);
      await createMatch(suitableRoom, __matchID);
      suitableRoom.users = [];
      return { response: "match", value: __matchID }; // 2 Players and new match return
    } else return { response: "error", value: "Suitableroom error" }; // Error return
  } else {
    const newRoom: Room = {
      roomID: rooms.length + 1,
      category: category,
      hostElo: user.rank.elo,
      users: [userId],
      status: "waiting",
    };
    rooms.push(newRoom);
    console.log(rooms);
    return { response: "room", value: newRoom.roomID }; // New room return
  }
}

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
