import bcrypt from "bcrypt";
import { createCookieSessionStorage, redirect } from "remix";
import { getUserById, getUserByUsername, createUser } from "./hasura.server";

type LoginForm = {
  username: string;
  password: string;
};

export async function register({ username, password }: LoginForm) {
  let passwordHash = await bcrypt.hash(password, 10);

  try {
    return await createUser(username, passwordHash);
  } catch (err) {
    return null;
  }
}

export async function login({ username, password }: LoginForm) {
  const user = await getUserByUsername(username);
  if (!user) return null;
  const isCorrectPassword = await bcrypt.compare(password, user.password_hash);
  if (!isCorrectPassword) return null;
  return user;
}

let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

let { getSession, commitSession, destroySession } = createCookieSessionStorage({
  cookie: {
    name: "RemixHasuraSession",
    secure: true,
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

export function getUserSession(request: Request) {
  return getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request) {
  let session = await getUserSession(request);
  let userId = session.get("userId");
  if (!userId || typeof userId !== "string") throw redirect("/login");
  return userId;
}

export async function getUser(request: Request) {
  let userId = await getUserId(request);
  if (typeof userId !== "string") return null;

  try {
    const user = await getUserById(userId);
    return user;
  } catch {
    throw logout(request);
  }
}

export async function logout(request: Request) {
  let session = await getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: { "Set-Cookie": await destroySession(session) },
  });
}

export async function createUserSession(userId: string, redirectTo: string) {
  let session = await getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}
