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
      const itemData = requestBody.event?.data?.new;

      if (!itemData) {
        return new Response("Invalid request", { status: 500 });
      }

      hasuraAdminClient.request(INSERT_ITEM_LOG, {
        object: { item_json: itemData },
      });

      return new Response(null, { status: 200 });
    }

    return new Response("Request method not supported", { status: 400 });
  } catch (err) {
    console.log("err: ", err);
    return new Response(JSON.stringify(err), { status: 500 });
  }
};

function validateRequest(request: Request) {
  return request.headers.get("api-secret") === process.env.API_SECRET;
}
