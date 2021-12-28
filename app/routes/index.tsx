import { Link } from "remix";

export default function Index() {
  return (
    <div>
      <h1 className="text-red-500">Welcome to Remix with Hasura</h1>
      <Link to="/profile" className="text-blue-400 hover:underline">
        Profile
      </Link>
    </div>
  );
}
