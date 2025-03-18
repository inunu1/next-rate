// /components/Navbar.tsx
import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Shogi Dojo</h1>
        <div className="flex space-x-4">
          <Link href="/" className="hover:text-gray-400">Home</Link>
          <Link href="/about" className="hover:text-gray-400">About</Link>
          <Link href="/players" className="hover:text-gray-400">Players</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
