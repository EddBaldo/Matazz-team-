import { login } from "./actions";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <form
        action={login}
        className="w-full max-w-sm space-y-5 bg-white p-8 rounded-3xl"
      >
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            Team Matazz
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Inserisci la password condivisa per accedere.
          </p>
        </div>
        <input
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          placeholder="Password"
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            Password errata.
          </p>
        )}
        <button
          type="submit"
          className="w-full py-2.5 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
        >
          Entra
        </button>
      </form>
    </main>
  );
}
