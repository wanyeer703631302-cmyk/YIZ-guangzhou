import { useEffect, useState } from 'react';

// 图片库 - 20张图片，每屏4张，共5屏
const imageGroups = [
  ['/hero-left.jpg', '/hero-right.jpg', '/project-01.jpg', '/project-02.jpg'],
  ['/project-03.jpg', '/project-04.jpg', '/project-05.jpg', '/project-06.jpg'],
  ['/project-07.jpg', '/project-08.jpg', '/hero-left.jpg', '/hero-right.jpg'],
  ['/project-01.jpg', '/project-03.jpg', '/project-05.jpg', '/project-07.jpg'],
  ['/project-02.jpg', '/project-04.jpg', '/project-06.jpg', '/project-08.jpg'],
];

const Hero = () => {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [splitX, setSplitX] = useState(50);
  const [splitY, setSplitY] = useState(50);

  // Update time and date
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const dateStr = now.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      setCurrentTime(timeStr);
      setCurrentDate(dateStr.toUpperCase());
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Mouse follow cross split effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setSplitX(Math.max(15, Math.min(85, x)));
      setSplitY(Math.max(15, Math.min(85, y)));
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative">
      {/* Fixed top info bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 text-white text-sm font-body tracking-wider pointer-events-none mix-blend-difference">
        <span className="opacity-80">{currentDate}</span>
        <span className="opacity-80">{currentTime}</span>
      </div>

      {/* Fixed Cross Grid Overlay - 全局十字分割线 */}
      <div className="fixed inset-0 z-40 pointer-events-none">
        {/* 水平分割线 */}
        <div
          className="absolute left-0 right-0 transition-all duration-75 ease-out"
          style={{ 
            top: `${splitY}%`,
            transform: 'translateY(-50%)'
          }}
        >
          <div className="w-full h-px bg-white/60" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-0.5 bg-white/40 blur-sm" />
        </div>

        {/* 垂直分割线 */}
        <div
          className="absolute top-0 bottom-0 transition-all duration-75 ease-out"
          style={{ 
            left: `${splitX}%`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="h-full w-px bg-white/60" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-32 bg-white/40 blur-sm" />
        </div>

        {/* 中心发光点 */}
        <div
          className="absolute transition-all duration-75 ease-out"
          style={{ 
            left: `${splitX}%`,
            top: `${splitY}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="w-6 h-6 bg-white rounded-full blur-lg" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full" />
        </div>
      </div>

      {/* Full Screen Sections - 全屏瀑布流 */}
      {imageGroups.map((group, groupIndex) => (
        <section
          key={groupIndex}
          className="relative h-screen w-full overflow-hidden snap-start"
        >
          {/* 第一象限 - 左上 */}
          <div 
            className="absolute overflow-hidden"
            style={{ 
              left: 0, 
              top: 0, 
              width: `${splitX}%`, 
              height: `${splitY}%` 
            }}
          >
            <img
              src={group[0]}
              alt={`Screen ${groupIndex + 1} - 1`}
              className="w-full h-full object-cover"
            />
          </div>

          {/* 第二象限 - 右上 */}
          <div 
            className="absolute overflow-hidden"
            style={{ 
              right: 0, 
              top: 0, 
              width: `${100 - splitX}%`, 
              height: `${splitY}%` 
            }}
          >
            <img
              src={group[1]}
              alt={`Screen ${groupIndex + 1} - 2`}
              className="w-full h-full object-cover"
            />
          </div>

          {/* 第三象限 - 左下 */}
          <div 
            className="absolute overflow-hidden"
            style={{ 
              left: 0, 
              bottom: 0, 
              width: `${splitX}%`, 
              height: `${100 - splitY}%` 
            }}
          >
            <img
              src={group[2]}
              alt={`Screen ${groupIndex + 1} - 3`}
              className="w-full h-full object-cover"
            />
          </div>

          {/* 第四象限 - 右下 */}
          <div 
            className="absolute overflow-hidden"
            style={{ 
              right: 0, 
              bottom: 0, 
              width: `${100 - splitX}%`, 
              height: `${100 - splitY}%` 
            }}
          >
            <img
              src={group[3]}
              alt={`Screen ${groupIndex + 1} - 4`}
              className="w-full h-full object-cover"
            />
          </div>

          {/* 标题 - 只在第一屏显示 */}
          {groupIndex === 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
              <h1 className="font-display font-black text-white text-[12vw] leading-none tracking-tighter mix-blend-difference text-center">
                <span className="block">MARCO</span>
                <span className="block">FORMENTINI</span>
              </h1>
            </div>
          )}

          {/* 页码指示器 */}
          <div className="absolute bottom-8 right-8 z-30 font-body text-white/60 text-sm">
            {groupIndex + 1} / {imageGroups.length}
          </div>
        </section>
      ))}

      {/* Bio Section - 最后一屏 */}
      <section className="relative h-screen w-full bg-black flex items-center justify-center snap-start">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display font-bold text-white text-4xl mb-8">ABOUT</h2>
          <p className="font-body text-white/80 text-lg leading-relaxed mb-8">
            Marco Formentini was born in Marche (IT) region in 1992. Coming from a family with a 
            background in shoemaking and designing, he focused his studies on footwear design by 
            attending the Istituto Marangoni in Milan in 2015. His experience in the industry began 
            in 2009, gaining valuable insights working for prestigious shoemaking companies in Marche. 
            In 2018, he left Italy to further advance his career in the international footwear sector. 
            Currently, he lives in Amsterdam and works as a freelance footwear designer.
          </p>
          <div className="flex justify-center gap-8">
            <a
              href="mailto:info@marco-formentini.com"
              className="font-body text-white underline-animation"
            >
              Contact
            </a>
            <a
              href="https://www.instagram.com/marcoeformentini/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-white underline-animation"
            >
              Instagram
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
