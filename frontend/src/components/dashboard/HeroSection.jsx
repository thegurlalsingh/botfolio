// HeroSection: hero section displaying the product tagline and description on the landing page.
const HeroSection = () => {
  return (
    <div className='min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 md:py-24'>
      <h1 className='text-white text-7xl font-extrabold text-center tracking-tight'>Your own</h1>
      <h1 className='text-white text-7xl font-extrabold text-center tracking-tight'>AI Interview Assistant</h1>
      <p className='text-white mt-2 text-xl md:text-2xl leading-relaxed'>Product for testing your skills and coding</p>
    </div>
  );
};

export default HeroSection;
