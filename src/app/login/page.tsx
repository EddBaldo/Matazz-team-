import { login } from "./actions";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-4 text-neutral-800">
      <form
        action={login}
        className="w-full max-w-sm space-y-4 bg-white p-6 rounded-lg border border-neutral-200"
      >
        <div>
          <h1 className="text-xl font-medium text-neutral-900">Matazz Staff</h1>
          <p className="text-sm text-neutral-700 mt-1">
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
          className="w-full px-3 py-2 border border-neutral-300 rounded text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        {error && <p className="text-sm text-red-700">Password errata.</p>}
        <button
          type="submit"
          className="w-full py-2 bg-amber-600 text-white font-medium rounded hover:bg-amber-700"
        >
          Entra
        </button>
      </form>
    </main>
  );
}
