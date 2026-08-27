// MainPage: landing page that composes the Navbar, animated mesh background, and hero section.
import Navbar from '../components/common/Navbar.jsx';
import MeshGradientBackground from '../components/dashboard/MeshAnimation.jsx';
import HeroSection from '../components/dashboard/HeroSection.jsx';

const MainPage = () => {
  return (
    <div>
      <Navbar />
      <MeshGradientBackground />
      <HeroSection />
    </div>
  );
};

export default MainPage;
