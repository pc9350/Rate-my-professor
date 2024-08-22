export default function Navbar() {
    return (
      <nav className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center p-6">
        <div className="text-3xl font-bold text-white">ProfScore</div>
        <button className="px-6 py-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition duration-300">
          Login
        </button>
      </nav>
    );
  }