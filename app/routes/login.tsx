import { ActionFunction, HeadersFunction, MetaFunction } from "remix";
import { useActionData, Form } from "remix";
import { login, createUserSession, register } from "~/utils/session.server";
import { getUserByUsername } from "~/utils/hasura.server";
import {
  LockClosedIcon,
  XCircleIcon,
  ExclamationIcon,
} from "@heroicons/react/solid";

export let meta: MetaFunction = () => {
  return {
    title: "Remix Hasura Fly | Login",
    description: "Login to authenticate with Hasura!",
  };
};

export let headers: HeadersFunction = () => {
  return {
    "Cache-Control": `public, max-age=${60 * 10}, s-maxage=${
      60 * 60 * 24 * 30
    }`,
  };
};

function validateUsername(username: unknown) {
  if (typeof username !== "string" || username.length < 3) {
    return `Usernames must be at least 3 characters long`;
  }
}

function validatePassword(password: unknown) {
  if (typeof password !== "string" || password.length < 6) {
    return `Passwords must be at least 6 characters long`;
  }
}

type ActionData = {
  formError?: string;
  fieldErrors?: { username: string | undefined; password: string | undefined };
  fields?: { loginType: string; username: string; password: string };
};

export let action: ActionFunction = async ({
  request,
}): Promise<Response | ActionData> => {
  let { loginType, username, password } = Object.fromEntries(
    await request.formData()
  );
  if (
    typeof loginType !== "string" ||
    typeof username !== "string" ||
    typeof password !== "string"
  ) {
    return { formError: `Form not submitted correctly.` };
  }

  let fields = { loginType, username, password };
  let fieldErrors = {
    username: validateUsername(username),
    password: validatePassword(password),
  };
  if (Object.values(fieldErrors).some(Boolean)) return { fieldErrors, fields };

  switch (loginType) {
    case "login": {
      const user = await login({ username, password });
      if (!user) {
        return {
          fields,
          formError: `Username/Password combination is incorrect`,
        };
      }
      return createUserSession(user.id, "/profile");
    }
    case "register": {
      let userExists = await getUserByUsername(username);
      if (userExists) {
        return {
          fields,
          formError: `User with username ${username} already exists`,
        };
      }
      const user = await register({ username, password });
      if (!user) {
        return {
          fields,
          formError: `Something went wrong trying to create a new user.`,
        };
      }
      return createUserSession(user.id, "/profile");
    }
    default: {
      return { fields, formError: `Login type invalid` };
    }
  }
};

export default function Login() {
  const actionData = useActionData<ActionData | undefined>();

  return (
    <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <Form
          method="post"
          aria-describedby={
            actionData?.formError ? "form-error-message" : undefined
          }
          className="mt-8 space-y-6"
        >
          <fieldset>
            <legend className="sr-only">Login or Register?</legend>
            <div className="space-y-4 justify-center sm:flex sm:items-center sm:space-y-0 sm:space-x-10">
              <div className="flex items-center">
                <input
                  type="radio"
                  name="loginType"
                  value="login"
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                  defaultChecked={
                    !actionData?.fields?.loginType ||
                    actionData?.fields?.loginType === "login"
                  }
                />
                <label className="ml-3 block text-sm font-medium text-gray-700">
                  Login
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  name="loginType"
                  value="register"
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                  defaultChecked={actionData?.fields?.loginType === "register"}
                />
                <label className="ml-3 block text-sm font-medium text-gray-700">
                  Register
                </label>
              </div>
            </div>
          </fieldset>

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username-input" className="sr-only">
                Username
              </label>
              <input
                type="text"
                id="username-input"
                name="username"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                defaultValue={actionData?.fields?.username}
                placeholder="Username"
                aria-invalid={Boolean(actionData?.fieldErrors?.username)}
                aria-describedby={
                  actionData?.fieldErrors?.username
                    ? "username-error"
                    : undefined
                }
              />
            </div>
            <div>
              <label htmlFor="password-input" className="sr-only">
                Password
              </label>
              <input
                id="password-input"
                name="password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                defaultValue={actionData?.fields?.password}
                type="password"
                placeholder="Password"
                aria-invalid={Boolean(actionData?.fieldErrors?.password)}
                aria-describedby={
                  actionData?.fieldErrors?.password
                    ? "password-error"
                    : undefined
                }
              />
            </div>
          </div>

          {actionData?.fieldErrors ? (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircleIcon
                    className="h-5 w-5 text-red-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    There are errors with your submission
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul role="list" className="list-disc pl-5 space-y-1">
                      {actionData.fieldErrors.username ? (
                        <li>{actionData.fieldErrors.username}</li>
                      ) : null}
                      {actionData.fieldErrors.password ? (
                        <li>{actionData.fieldErrors.password}</li>
                      ) : null}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {actionData?.formError ? (
            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationIcon
                    className="h-5 w-5 text-yellow-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Login error
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>{actionData.formError}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <button
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <LockClosedIcon
                className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400"
                aria-hidden="true"
              />
            </span>
            Sign in
          </button>
        </Form>
      </div>
    </div>
  );
}
