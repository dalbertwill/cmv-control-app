export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500">
      <div className="rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-4xl font-extrabold text-gray-900">CMV Control App</h1>
        <p className="text-lg text-gray-600">Tailwind funcionando! 🎉</p>
        <button className="mt-6 rounded-md bg-green-500 px-6 py-2 font-semibold text-white shadow transition hover:bg-green-600">
          Testar Botão
        </button>
      </div>
    </main>
  );
}
