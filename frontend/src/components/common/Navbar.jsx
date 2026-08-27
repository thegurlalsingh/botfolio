// Navbar: sticky navigation bar with scroll-aware visibility, hide-on-scroll-down, and a login CTA.
import { useEffect, useState } from 'react';
import Button from '../common/Button.jsx';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [prevScrollY, setPrevScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      setVisible(current < prevScrollY || current < 100);
      setPrevScrollY(current);
      setIsScrolled(current > 80);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollY]);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${visible ? 'translate-y-0' : '-translate-y-full'} ${isScrolled ? 'py-3 bg-indigo-950/80 backdrop-blur-xl border-b border-white shadow-xl shadow-white' : 'py-5 bg-transparent backdrop-blur-none shadow-none'}`}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold tracking-tight transition-colors duration-300 ${isScrolled ? 'text-white' : 'text-white'} hover:text-purple-300`}>
            <a href="/">BotFolio</a>
          </h1>
          <ul className="hidden items-center gap-10 md:flex">
            <li>
              <a href="/about-us" className="text-gray-300 hover:text-white transition-colors font-medium duration-200">
                About Us
              </a>
            </li>
            <li>
              <a href="/pricing" className="text-gray-300 hover:text-white transition-colors font-medium duration-200">
                Pricing
              </a>
            </li>
            <li>
              <a href="/contact" className="text-gray-300 hover:text-white transition-colors font-medium duration-200">
                Contact
              </a>
            </li>
          </ul>
          <Button variant="primary" className="bg-indigo-600 hover:bg-indigo-500 hidden md:block">
            <a href='/login'>Get Started</a>
          </Button>
          <button className="md:hidden text-white hover:text-white transition-colors">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;