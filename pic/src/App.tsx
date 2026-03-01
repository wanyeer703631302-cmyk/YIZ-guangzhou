import './App.css';
import Hero from './sections/Hero';

function App() {
  return (
    <div className="relative bg-black">
      {/* Grain overlay */}
      <div className="grain-overlay" />
      
      {/* Main content */}
      <main className="relative">
        <Hero />
      </main>
    </div>
  );
}

export default App;
