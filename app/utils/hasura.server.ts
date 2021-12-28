import { GraphQLClient, gql } from "graphql-request";

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || "";
const GRAPHQL_ADMIN_SECRET = process.env.GRAPHQL_ADMIN_SECRET || "";

if (!GRAPHQL_ENDPOINT || !GRAPHQL_ADMIN_SECRET) {
  throw new Error("GRAPHQL_ENDPOINT & GRAPHQL_ADMIN_SECRET must be set");
}

let hasuraClient: GraphQLClient | undefined;
function getHasuraClient(userId: string) {
  if (!hasuraClient) {
    hasuraClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
      headers: {
        "x-hasura-admin-secret": GRAPHQL_ADMIN_SECRET,
        "x-hasura-role": "user",
      },
    });
  }

  hasuraClient.setHeader("x-hasura-user-id", userId);

  return hasuraClient;
}

const hasuraAdminClient: GraphQLClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    "x-hasura-admin-secret": GRAPHQL_ADMIN_SECRET,
  },
});

type User = {
  id: string;
  username: string;
  password_hash: string;
};

export async function getUserById(id: string): Promise<User | null> {
  const { user_by_pk } = await hasuraAdminClient.request(
    gql`
      query GetUserByPk($id: uuid!) {
        user_by_pk(id: $id) {
          id
          username
          password_hash
        }
      }
    `,
    { id }
  );

  if (!user_by_pk) {
    throw new Error("Invalid user id");
  }

  return user_by_pk;
}

export async function getUserByUsername(
  username: string
): Promise<User | null> {
  const { user } = await hasuraAdminClient.request(
    gql`
      query GetUserByUsername($username: String!) {
        user(where: { username: { _eq: $username } }) {
          id
          username
          password_hash
        }
      }
    `,
    { username }
  );

  if (!user || !user.length) {
    return null;
  }

  return user[0];
}

export async function createUser(
  username: string,
  password_hash: string
): Promise<User> {
  const { insert_user_one } = await hasuraAdminClient.request(
    gql`
      mutation CreateUser($object: user_insert_input!) {
        insert_user_one(object: $object) {
          id
          username
          password_hash
        }
      }
    `,
    {
      object: {
        password_hash,
        username,
      },
    }
  );

  return insert_user_one;
}

export { getHasuraClient, hasuraAdminClient };
export type { User };
