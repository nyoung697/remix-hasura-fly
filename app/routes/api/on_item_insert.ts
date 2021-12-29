import type { ActionFunction } from "remix";
import { hasuraAdminClient } from "~/utils/hasura.server";
import { gql } from "graphql-request";

const INSERT_ITEM_LOG = gql`
  mutation InsertItemLog($object: item_insert_log_insert_input!) {
    insert_item_insert_log_one(object: $object) {
      id
    }
  }
`;

export const action: ActionFunction = async ({ request }) => {
  if (!validateRequest(request)) {
    return new Response(null, { status: 401 });
  }

  try {
    if (request.method === "POST") {
      /* handle "POST" */
      const requestBody = await request.json();

      hasuraAdminClient.request(INSERT_ITEM_LOG, {
        object: { item_json: requestBody?.event?.data?.new },
      });
    }

    return new Response(null, { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify(err), { status: 400 });
  }
};

function validateRequest(request: Request) {
  return request.headers.get("api-secret") === process.env.API_SECRET;
}
