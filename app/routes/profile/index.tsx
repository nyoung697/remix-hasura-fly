import { useLoaderData, Form } from "remix";
import type { LoaderFunction } from "remix";
import { gql } from "graphql-request";
import { getUser } from "~/utils/session.server";
import { User, getHasuraClient } from "~/utils/hasura.server";

const GET_USER_ITEMS = gql`
  query GetItems {
    item {
      id
      name
    }
  }
`;

type Item = {
  id: number;
  name: string;
};
type LoaderData = {
  user: User;
  items: Array<Item>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request);

  if (user) {
    const { item } = await getHasuraClient(user.id).request(GET_USER_ITEMS);

    return {
      user,
      items: item,
    };
  }
};

export default function ProfileRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <p>
          Welcome,{" "}
          <span className="text-red-500 font-bold">{data?.user?.username}</span>
        </p>

        <fieldset className="space-y-5">
          <legend className="sr-only">Items</legend>

          {data.items.map((item) => (
            <div key={item.id} className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id={item.id.toString()}
                  aria-describedby="comments-description"
                  name={item.id.toString()}
                  type="checkbox"
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label
                  htmlFor={item.id.toString()}
                  className="font-medium text-gray-700"
                >
                  {item.name}
                </label>
              </div>
            </div>
          ))}
        </fieldset>

        <Form action="/logout" method="post" className="mt-6">
          <button
            type="submit"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Logout
          </button>
        </Form>
      </div>
    </div>
  );
}
