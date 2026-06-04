/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView } from 'motion/react';
import { 
  Heart, 
  Calendar, 
  MapPin, 
  Mail, 
  Gift, 
  Clock, 
  Utensils, 
  Navigation,
  Menu,
  X,
  Music,
  Camera,
  Infinity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// --- Variants for Cinematic Reveals ---

const fadeInUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] }
  }
};

// --- Components ---

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setScrolled(latest > 50);
    });
  }, [scrollY]);

  const menuItems = [
    { label: 'Bienvenida', href: '#welcome' },
    { label: 'Nuestra Historia', href: '#history' },
    { label: 'El Día', href: '#theday' },
    { label: 'El Lugar', href: '#thevenue' },
    { label: 'Regalos', href: '#gifts' },
    { label: 'RSVP', href: '#rsvp' }
  ];

  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 px-6 py-4 flex justify-between items-center ${
          scrolled ? 'bg-brand-cream/80 backdrop-blur-xl border-b border-brand-sage/5 py-3' : 'bg-transparent'
        }`}
      >
        <button 
          onClick={() => setIsOpen(true)}
          className={`hover:scale-110 transition-transform ${scrolled ? 'text-brand-sage' : 'text-brand-sage'}`}
          id="menu-toggle"
        >
          <Menu size={28} strokeWidth={1.5} />
        </button>
        
        <motion.h1 
          className={`font-serif italic text-xl md:text-2xl tracking-[0.2em] uppercase transition-colors duration-700 ${
            scrolled ? 'text-brand-sage' : 'text-brand-sage drop-shadow-sm'
          }`}
        >
          J & V
        </motion.h1>
        
        <div className="w-8" />
      </motion.nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-brand-sage flex flex-col items-center justify-center p-8"
          >
            <button 
              onClick={() => setIsOpen(false)} 
              className="absolute top-8 right-8 text-brand-cream/50 hover:text-brand-cream transition-colors"
            >
              <X size={32} strokeWidth={1} />
            </button>
            
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center gap-8"
            >
              {menuItems.map((item) => (
                <motion.a 
                  key={item.label}
                  variants={fadeInUp}
                  href={item.href} 
                  onClick={() => setIsOpen(false)} 
                  className="font-serif text-4xl md:text-6xl text-brand-cream hover:text-brand-gold transition-colors italic relative group"
                >
                  {item.label}
                  <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-brand-gold transition-all duration-500 group-hover:w-full" />
                </motion.a>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const SectionHeader = ({ title, subtitle, centered = true }: { title: string, subtitle?: string, centered?: boolean }) => (
  <motion.div 
    variants={fadeInUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    className={`${centered ? 'text-center' : 'text-left'} mb-20 space-y-4`}
  >
    {subtitle && (
      <motion.p 
        initial={{ opacity: 0, letterSpacing: '0.2em' }}
        whileInView={{ opacity: 0.6, letterSpacing: '0.4em' }}
        transition={{ duration: 1.5 }}
        className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-brand-sage font-black"
      >
        {subtitle}
      </motion.p>
    )}
    <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-brand-charcoal italic">{title}</h2>
    <div className={`w-12 h-[1px] bg-brand-gold/20 mt-6 ${centered ? 'mx-auto' : 'mx-0'}`} />
  </motion.div>
);

const Countdown = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const targetDate = new Date('2026-08-28T15:00:00').getTime();
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      if (distance < 0) {
        clearInterval(timer);
        return;
      }
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const items = [
    { label: 'Días', value: timeLeft.days },
    { label: 'Horas', value: timeLeft.hours },
    { label: 'Mins', value: timeLeft.mins },
    { label: 'Segs', value: timeLeft.secs }
  ];

  return (
    <div className="flex justify-center gap-6 md:gap-12 max-w-4xl mx-auto py-10">
      {items.map((item, idx) => (
        <motion.div 
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="flex flex-col items-center"
        >
          <span className="font-serif text-4xl md:text-5xl text-brand-sage leading-none">{item.value}</span>
          <span className="text-[9px] tracking-[0.2em] uppercase font-bold text-brand-charcoal/40 mt-3">{item.label}</span>
        </motion.div>
      ))}
    </div>
  );
};

const Gallery = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [groomPhotoIndex, setGroomPhotoIndex] = useState(0);
  const [bridePhotoIndex, setBridePhotoIndex] = useState(0);

  const images = [
    "/images/1.jpeg", "/images/2.jpeg", "/images/3.jpeg", "/images/4.jpeg",
    "/images/5.jpeg", "/images/6.jpeg", "/images/7.jpeg",
    "/images/novio.jpg", "/images/novio-1.jpg", "/images/novio-2.jpg", "/images/novio-3.jpg", "/images/novio-4.jpg",
    "/images/novia.jpg", "/images/novia-1.jpg", "/images/novia-2.jpg", "/images/novia-3.jpg", "/images/novia-4.jpg"
  ];

  const groomPhotos = [
    "/images/novio.jpg",
    "/images/novio-1.jpg",
    "/images/novio-2.jpg",
    "/images/novio-3.jpg",
    "/images/novio-4.jpg"
  ];

  const bridePhotos = [
    "/images/novia.jpg",
    "/images/novia-1.jpg",
    "/images/novia-2.jpg",
    "/images/novia-3.jpg",
    "/images/novia-4.jpg"
  ];

  const heartCells = [
    { r: 0, c: 1, i: 0 }, { r: 0, c: 3, i: 1 },
    { r: 1, c: 0, i: 2 }, { r: 1, c: 1, i: 3 }, { r: 1, c: 2, i: 4 }, { r: 1, c: 3, i: 5 }, { r: 1, c: 4, i: 6 },
    { r: 2, c: 0, i: 0 }, { r: 2, c: 1, i: 1 }, { r: 2, c: 2, i: 2 }, { r: 2, c: 3, i: 3 }, { r: 2, c: 4, i: 4 },
    { r: 3, c: 1, i: 5 }, { r: 3, c: 2, i: 6 }, { r: 3, c: 3, i: 0 },
    { r: 4, c: 2, i: 1 }
  ];

  return (
    <section id="history" className="py-16 md:py-28 px-6 max-w-6xl mx-auto text-center relative">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative"
      >
        {/* Triquetra Knot representing the Cord of Three Strands */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 0.8, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="flex justify-center mb-6 text-brand-gold"
        >
          <svg width="40" height="40" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" className="animate-[pulse_4s_ease-in-out_infinite]">
            <path d="M 50,15 C 50,15 15,65 50,85 C 85,65 50,15 50,15 Z" />
            <path d="M 20,68 C 20,68 80,68 50,17 C 20,68 20,68 20,68 Z" />
            <circle cx="50" cy="57" r="22" stroke="currentColor" strokeDasharray="3 3" />
          </svg>
        </motion.div>

        <div className="mb-12 space-y-4 max-w-xl mx-auto">
          <h4 className="text-[10px] md:text-xs uppercase tracking-[0.6em] font-black text-brand-sage/40">Nuestra Historia</h4>
          <h3 className="font-serif italic text-3xl md:text-5xl text-brand-charcoal leading-none">Nuestros Momentos</h3>
          <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] font-bold text-brand-gold/60 italic">Agosto 28 . 2026</p>
          <p className="text-sm md:text-base text-brand-charcoal/50 font-light italic leading-relaxed pt-2">
            "Cada instante compartido nos ha traído hasta aquí. Aquí les compartimos un pedacito de nuestra historia a través de nuestros ojos."
          </p>
        </div>

        {/* Desktop Connection threads linking Novia (left) and Novio (right) to the center (God) */}
        <div className="absolute inset-0 pointer-events-none hidden md:block z-0">
          <svg className="w-full h-full" viewBox="0 0 1000 600" fill="none">
            {/* Cords from Novia (Left) to Center */}
            <motion.path
              d="M 150,335 Q 320,255 500,305"
              stroke="#c5a059"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.2 }}
              className="opacity-80"
            />
            <motion.path
              d="M 150,340 Q 320,260 500,310"
              stroke="#1b4d3e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.3 }}
              className="opacity-55"
            />
            <motion.path
              d="M 150,345 Q 320,265 500,315"
              stroke="#dfd5c6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.4 }}
              className="opacity-70"
            />

            {/* Cords from Novio (Right) to Center */}
            <motion.path
              d="M 850,305 Q 680,245 500,305"
              stroke="#c5a059"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.2 }}
              className="opacity-80"
            />
            <motion.path
              d="M 850,310 Q 680,250 500,310"
              stroke="#1b4d3e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.3 }}
              className="opacity-55"
            />
            <motion.path
              d="M 850,315 Q 680,255 500,315"
              stroke="#dfd5c6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.4 }}
              className="opacity-70"
            />
          </svg>
        </div>

        {/* Mobile Connection threads linking Novia (bottom-left) and Novio (bottom-right) to the center (God) */}
        <div className="absolute inset-0 pointer-events-none block md:hidden z-0">
          <svg className="w-full h-full" viewBox="0 0 320 650" fill="none">
            {/* Cords from Novia (Bottom Left) to Center */}
            <motion.path
              d="M 72,550 C 72,440 137,397 157,297"
              stroke="#c5a059"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="3 3"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.2 }}
              className="opacity-80"
            />
            <motion.path
              d="M 75,550 C 75,440 140,400 160,300"
              stroke="#1b4d3e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="3 3"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.3 }}
              className="opacity-55"
            />
            <motion.path
              d="M 78,550 C 78,440 143,403 163,303"
              stroke="#dfd5c6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="3 3"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.4 }}
              className="opacity-70"
            />

            {/* Cords from Novio (Bottom Right) to Center */}
            <motion.path
              d="M 242,550 C 242,440 177,397 157,297"
              stroke="#c5a059"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="3 3"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.2 }}
              className="opacity-80"
            />
            <motion.path
              d="M 245,550 C 245,440 180,400 160,300"
              stroke="#1b4d3e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="3 3"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.3 }}
              className="opacity-55"
            />
            <motion.path
              d="M 248,550 C 248,440 183,403 163,303"
              stroke="#dfd5c6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="3 3"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.4 }}
              className="opacity-70"
            />
          </svg>
        </div>

        {/* Left Floating Polaroid Stack (Desktop) */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-4 lg:left-12 top-[60%] -translate-y-1/2 z-10 w-36 lg:w-44 hidden md:block select-none"
        >
          {/* Back Card Decoration 2 */}
          <div className="absolute inset-0 bg-white p-3 pb-6 rounded-2xl shadow-sm border border-brand-sage/5 rotate-[4deg] translate-y-1 translate-x-[4px]" />
          
          {/* Back Card Decoration 1 */}
          <div className="absolute inset-0 bg-white p-3 pb-6 rounded-2xl shadow-md border border-brand-sage/5 rotate-[-2deg] translate-y-0.5 translate-x-[-2px]" />

          {/* Top Active Card */}
          <motion.div
            onClick={(e) => {
              e.stopPropagation();
              setBridePhotoIndex(prev => (prev + 1) % bridePhotos.length);
            }}
            whileHover={{ scale: 1.03, rotate: -8 }}
            whileTap={{ scale: 0.97 }}
            className="relative bg-white p-3 pb-6 rounded-2xl shadow-[0_15px_35px_rgba(27,77,62,0.08)] border border-brand-sage/5 cursor-pointer transition-all duration-300 select-none rotate-[-6deg]"
          >
            <div className="aspect-[4/5] w-full rounded-lg overflow-hidden bg-brand-cream/50 mb-3 relative">
              <AnimatePresence mode="wait">
                <motion.img
                  key={bridePhotoIndex}
                  src={bridePhotos[bridePhotoIndex]}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full object-cover grayscale-[0.1]"
                  alt=""
                />
              </AnimatePresence>

              {/* Photo Indicator Badge */}
              <div className="absolute bottom-2 right-2 bg-brand-charcoal/70 backdrop-blur-md text-white text-[9px] px-2 py-0.5 rounded-full font-sans tracking-wider">
                {bridePhotoIndex + 1}/{bridePhotos.length}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-serif italic text-xs text-brand-sage/60 block text-center">
                {bridePhotoIndex === 0 ? "La Novia" : "Juan & Vale"}
              </span>
              <span className="text-[8px] uppercase tracking-widest font-black text-brand-gold mt-1">
                Toca para pasar
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Floating Polaroid Stack (Desktop) */}
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute right-4 lg:left-auto lg:right-12 top-[55%] -translate-y-1/2 z-10 w-36 lg:w-44 hidden md:block select-none"
        >
          {/* Back Card Decoration 2 */}
          <div className="absolute inset-0 bg-white p-3 pb-6 rounded-2xl shadow-sm border border-brand-sage/5 rotate-[-4deg] translate-y-1 translate-x-[-4px]" />
          
          {/* Back Card Decoration 1 */}
          <div className="absolute inset-0 bg-white p-3 pb-6 rounded-2xl shadow-md border border-brand-sage/5 rotate-[2deg] translate-y-0.5 translate-x-[2px]" />

          {/* Top Active Card */}
          <motion.div
            onClick={(e) => {
              e.stopPropagation();
              setGroomPhotoIndex(prev => (prev + 1) % groomPhotos.length);
            }}
            whileHover={{ scale: 1.03, rotate: 8 }}
            whileTap={{ scale: 0.97 }}
            className="relative bg-white p-3 pb-6 rounded-2xl shadow-[0_15px_35px_rgba(27,77,62,0.08)] border border-brand-sage/5 cursor-pointer transition-all duration-300 select-none rotate-[6deg]"
          >
            <div className="aspect-[4/5] w-full rounded-lg overflow-hidden bg-brand-cream/50 mb-3 relative">
              <AnimatePresence mode="wait">
                <motion.img
                  key={groomPhotoIndex}
                  src={groomPhotos[groomPhotoIndex]}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full object-cover grayscale-[0.1]"
                  alt=""
                />
              </AnimatePresence>

              {/* Photo Indicator Badge */}
              <div className="absolute bottom-2 right-2 bg-brand-charcoal/70 backdrop-blur-md text-white text-[9px] px-2 py-0.5 rounded-full font-sans tracking-wider">
                {groomPhotoIndex + 1}/{groomPhotos.length}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-serif italic text-xs text-brand-sage/60 block text-center">
                {groomPhotoIndex === 0 ? "El Novio" : "Juan & Vale"}
              </span>
              <span className="text-[8px] uppercase tracking-widest font-black text-brand-gold mt-1">
                Toca para pasar
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Background SVG Botanical Wreath */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] pointer-events-none opacity-[0.06] text-brand-sage hidden md:block z-0">
          <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full animate-[spin_120s_linear_infinite]">
            {/* Left wreath branch */}
            <path d="M 100,180 C 45,180 20,135 20,100 C 20,65 45,20 90,22" />
            {/* Right wreath branch */}
            <path d="M 100,180 C 155,180 180,135 180,100 C 180,65 155,20 110,22" />
            {/* Left leaves */}
            <path d="M 30,140 C 25,135 22,125 28,122 C 34,119 38,130 30,140 Z" fill="currentColor" />
            <path d="M 21,115 C 15,112 14,102 21,99 C 28,96 30,106 21,115 Z" fill="currentColor" />
            <path d="M 22,90 C 17,85 18,75 25,73 C 32,71 32,82 22,90 Z" fill="currentColor" />
            <path d="M 32,65 C 28,60 31,50 38,50 C 45,50 43,60 32,65 Z" fill="currentColor" />
            <path d="M 50,45 C 47,38 52,30 59,32 C 66,34 62,44 50,45 Z" fill="currentColor" />
            <path d="M 72,30 C 72,23 78,17 84,21 C 90,25 83,34 72,30 Z" fill="currentColor" />
            {/* Right leaves */}
            <path d="M 170,140 C 175,135 178,125 172,122 C 166,119 162,130 170,140 Z" fill="currentColor" />
            <path d="M 179,115 C 185,112 186,102 179,99 C 172,96 170,106 179,115 Z" fill="currentColor" />
            <path d="M 178,90 C 183,85 182,75 175,73 C 168,71 168,82 178,90 Z" fill="currentColor" />
            <path d="M 168,65 C 172,60 169,50 162,50 C 155,50 157,60 168,65 Z" fill="currentColor" />
            <path d="M 150,45 C 153,38 148,30 141,32 C 134,34 138,44 150,45 Z" fill="currentColor" />
            <path d="M 128,30 C 128,23 122,17 116,21 C 110,25 117,34 128,30 Z" fill="currentColor" />
            {/* Top details */}
            <circle cx="100" cy="20" r="2.5" className="fill-brand-gold" />
          </svg>
        </div>

        <div className="bg-white/85 backdrop-blur-md p-6 md:p-8 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.02)] border border-brand-sage/5 relative overflow-hidden max-w-[450px] mx-auto z-10">
          <div className="absolute inset-0 bg-paper-texture opacity-10 pointer-events-none" />
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] opacity-30 pointer-events-none z-0 mix-blend-multiply">
            <img src="/images/heart-bg.png" className="w-full h-full object-contain blur-[2px]" alt="" />
          </div>

          <div className="relative z-10 grid grid-cols-5 grid-rows-5 gap-1 aspect-square">
            {heartCells.map((cell, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.02 }}
                onClick={() => setSelectedIndex(cell.i)}
                style={{ gridRow: cell.r + 1, gridColumn: cell.c + 1 }}
                className="relative cursor-pointer group rounded-md overflow-hidden shadow-sm border border-white/50"
              >
                <img 
                  src={images[cell.i]} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  alt="" 
                />
                {/* Gold Triquetra Overlay for the center cell (representing God as the center of their union) */}
                {cell.r === 2 && cell.c === 2 && (
                  <div className="absolute inset-0 bg-brand-gold/15 flex flex-col items-center justify-center pointer-events-none z-20">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#c5a059" strokeWidth="1.5" className="w-8 h-8 drop-shadow-[0_0_4px_rgba(197,160,89,0.8)] animate-[pulse_3s_ease-in-out_infinite]">
                      <path d="M 12,5 C 10.2,8.4 9,10.2 12,13.2 C 15,10.2 13.8,8.4 12,5 Z" />
                      <path d="M 12,5 C 10.2,8.4 9,10.2 12,13.2 C 15,10.2 13.8,8.4 12,5 Z" transform="rotate(120, 12, 10.5)" />
                      <path d="M 12,5 C 10.2,8.4 9,10.2 12,13.2 C 15,10.2 13.8,8.4 12,5 Z" transform="rotate(240, 12, 10.5)" />
                      <circle cx="12" cy="10.5" r="4.5" stroke="#c5a059" strokeWidth="0.8" strokeDasharray="1 1" />
                    </svg>
                    <span className="text-[7px] uppercase tracking-[0.2em] text-brand-cream font-bold mt-0.5 select-none drop-shadow-md">Dios</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile Row for Polaroids */}
        <div className="flex flex-row justify-center items-stretch gap-6 mt-12 md:hidden">
          {/* Mobile Left Polaroid Stack */}
          <div className="w-32 relative select-none">
            {/* Back Card Decoration */}
            <div className="absolute inset-0 bg-white rounded-xl shadow-sm border border-brand-sage/5 rotate-[-2deg] translate-y-0.5 translate-x-[-2px]" />
            
            {/* Active Card */}
            <motion.div
              onClick={() => setBridePhotoIndex(prev => (prev + 1) % bridePhotos.length)}
              whileTap={{ scale: 0.95 }}
              className="relative bg-white p-2.5 pb-4 rounded-xl shadow-md border border-brand-sage/5 cursor-pointer rotate-[2deg]"
            >
              <div className="aspect-[4/5] w-full rounded-lg overflow-hidden bg-brand-cream/50 mb-2 relative">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={bridePhotoIndex}
                    src={bridePhotos[bridePhotoIndex]}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full object-cover grayscale-[0.1]"
                    alt=""
                  />
                </AnimatePresence>
                <div className="absolute bottom-1 right-1 bg-brand-charcoal/70 backdrop-blur-md text-white text-[8px] px-1 py-0.2 rounded font-sans tracking-wide">
                  {bridePhotoIndex + 1}/{bridePhotos.length}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-serif italic text-[10px] text-brand-sage/60 block text-center">
                  {bridePhotoIndex === 0 ? "La Novia" : "Juan & Vale"}
                </span>
                <span className="text-[7px] uppercase tracking-widest font-black text-brand-gold mt-0.5">
                  Toca
                </span>
              </div>
            </motion.div>
          </div>

          {/* Mobile Right Polaroid Stack */}
          <div className="w-32 relative select-none">
            {/* Back Card Decoration */}
            <div className="absolute inset-0 bg-white rounded-xl shadow-sm border border-brand-sage/5 rotate-[2deg] translate-y-0.5 translate-x-[2px]" />
            
            {/* Active Card */}
            <motion.div
              onClick={() => setGroomPhotoIndex(prev => (prev + 1) % groomPhotos.length)}
              whileTap={{ scale: 0.95 }}
              className="relative bg-white p-2.5 pb-4 rounded-xl shadow-md border border-brand-sage/5 cursor-pointer rotate-[-2deg]"
            >
              <div className="aspect-[4/5] w-full rounded-lg overflow-hidden bg-brand-cream/50 mb-2 relative">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={groomPhotoIndex}
                    src={groomPhotos[groomPhotoIndex]}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full object-cover grayscale-[0.1]"
                    alt=""
                  />
                </AnimatePresence>
                <div className="absolute bottom-1 right-1 bg-brand-charcoal/70 backdrop-blur-md text-white text-[8px] px-1 py-0.2 rounded font-sans tracking-wide">
                  {groomPhotoIndex + 1}/{groomPhotos.length}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-serif italic text-[10px] text-brand-sage/60 block text-center">
                  {groomPhotoIndex === 0 ? "El Novio" : "Juan & Vale"}
                </span>
                <span className="text-[7px] uppercase tracking-widest font-black text-brand-gold mt-0.5">
                  Toca
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Cord of Three Strands Explanation Card - Clean & Simple */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="mt-16 max-w-md mx-auto bg-white/70 backdrop-blur-md p-6 md:p-8 rounded-[2rem] border border-brand-sage/10 shadow-[0_15px_35px_rgba(27,77,62,0.05)] space-y-3 relative overflow-hidden text-center z-10"
        >
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent" />
          
          <div className="flex items-center justify-center gap-3 text-brand-gold">
            <div className="h-[1px] w-6 bg-brand-gold/30" />
            <span className="font-serif italic text-xs tracking-widest font-bold">El Cordón de Tres Dobleces</span>
            <div className="h-[1px] w-6 bg-brand-gold/30" />
          </div>

          <p className="font-serif italic text-base md:text-lg text-brand-sage leading-relaxed px-2">
            "Cordón de tres dobleces no se rompe pronto."
          </p>

          <div className="space-y-1">
            <p className="text-[9px] tracking-[0.3em] uppercase text-brand-gold font-black">Eclesiastés 4:12</p>
            <p className="text-[11px] text-brand-charcoal/50 leading-relaxed font-light max-w-xs mx-auto pt-1">
              Dios en el centro uniendo al Novio (Juan) y a la Novia (Vale) en un lazo de amor inquebrantable, fuerte y eterno.
            </p>
          </div>
        </motion.div>
      </motion.div>

      {selectedIndex !== null && (
        <LightBox 
          images={images} 
          currentIndex={selectedIndex} 
          onClose={() => setSelectedIndex(null)} 
          onNext={() => setSelectedIndex(prev => prev !== null ? (prev + 1) % images.length : null)}
          onPrev={() => setSelectedIndex(prev => prev !== null ? (prev - 1 + images.length) % images.length : null)}
        />
      )}
    </section>
  );
};

const EditorialDetails = () => {
  return (
    <section id="details" className="bg-brand-cream py-20 px-6 relative overflow-hidden">
      {/* Torn Edge transition from previous section */}
      <div className="absolute top-0 left-0 w-full h-16 z-20 pointer-events-none">
        <img 
          src="/images/torn-edge.png" 
          className="w-full h-full object-cover" 
          alt="" 
          style={{ filter: 'brightness(0) saturate(100%) invert(98%) sepia(5%) saturate(302%) hue-rotate(346deg) brightness(101%) contrast(97%)' }} 
        />
      </div>

      <div className="max-w-4xl mx-auto space-y-32">
        {/* The Wedding Day Header */}
        <div className="flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
          <div className="w-full md:w-1/2 relative">
            <div className="absolute -inset-4 border border-brand-sage/20 rounded-2xl -rotate-3" />
            <img 
              src="/images/3.jpeg" 
              className="w-full aspect-[4/5] object-cover rounded-2xl shadow-xl relative z-10 grayscale-[0.2]" 
              alt="Moment" 
            />
            <div className="absolute -bottom-6 -right-6 w-32 h-32 opacity-20">
              <img src="/images/heart-bg.png" className="w-full h-full object-contain" alt="" />
            </div>
          </div>
          <div className="w-full md:w-1/2 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h4 className="text-xs uppercase tracking-[0.5em] text-brand-sage font-black">SAVE THE DATE</h4>
              <h2 className="font-serif text-6xl md:text-8xl leading-none text-brand-charcoal">The Wedding Day</h2>
            </motion.div>
            <div className="space-y-6">
              <p className="text-brand-charcoal/60 leading-relaxed font-light text-lg italic">
                "Cada uno de ustedes ha sido parte fundamental de nuestra historia. Queremos agradecerles de corazón por su amor y apoyo constante, y por acompañarnos a celebrar el día más feliz de nuestras vidas."
              </p>
              <div className="flex justify-center md:justify-start items-center gap-4 text-brand-sage">
                <div className="h-[1px] w-12 bg-brand-sage/30" />
                <span className="font-serif text-2xl italic">Juan & Vale</span>
              </div>
            </div>
          </div>
        </div>

        {/* Where & When Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-32">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl font-serif italic text-brand-gold">01.</span>
                <h3 className="text-2xl font-serif uppercase tracking-widest text-brand-charcoal">Cuándo</h3>
              </div>
              <div className="pl-12 space-y-2">
                <p className="text-xl text-brand-charcoal font-medium">Viernes, 28 de Agosto</p>
                <p className="text-brand-charcoal/60 font-light">Llegada: 2:30 p.m.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl font-serif italic text-brand-gold">02.</span>
                <h3 className="text-2xl font-serif uppercase tracking-widest text-brand-charcoal">Código de Vestimenta</h3>
              </div>
              <div className="pl-12 space-y-2">
                <p className="text-xl text-brand-charcoal font-medium">Gala / Formal</p>
                <p className="text-brand-charcoal/60 font-light">Queremos compartir contigo de etiqueta formal para celebrar juntos.</p>
              </div>
            </div>
          </motion.div>

          <div className="relative">
            <div className="absolute -inset-4 bg-brand-sage/5 rounded-3xl rotate-2" />
            <img 
              src="/images/4.jpeg" 
              className="w-full aspect-square object-cover rounded-3xl shadow-lg relative z-10" 
              alt="Ceremony" 
            />
          </div>
        </div>
      </div>

      {/* Another torn paper divider */}
      <div className="absolute bottom-0 left-0 w-full h-16 z-20 pointer-events-none rotate-180">
        <img 
          src="/images/torn-edge.png" 
          className="w-full h-full object-cover" 
          alt="" 
          style={{ filter: 'brightness(0) saturate(100%) invert(98%) sepia(5%) saturate(302%) hue-rotate(346deg) brightness(101%) contrast(97%)' }} 
        />
      </div>
    </section>
  );
};

const FloatingElement = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <motion.div 
    animate={{ 
      y: [0, -20, 0],
      rotate: [0, 2, -2, 0]
    }}
    transition={{ 
      duration: 6, 
      repeat: Infinity, 
      ease: "easeInOut" 
    }}
    className={className}
  >
    {children}
  </motion.div>
);

const MusicPlayer = ({ autoPlayTrigger }: { autoPlayTrigger?: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    if (autoPlayTrigger && audioRef.current && !isPlaying) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.log("Autoplay blocked or failed:", err);
      });
    }
  }, [autoPlayTrigger]);

  return (
    <div className="fixed top-8 right-6 z-50">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleMusic}
        className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-500 ${
          isPlaying 
            ? 'bg-brand-sage text-brand-cream border-brand-sage shadow-lg shadow-brand-sage/20' 
            : 'bg-white/40 text-brand-sage border-white/40'
        }`}
      >
        {isPlaying ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <Music size={20} />
          </motion.div>
        ) : (
          <Music size={20} />
        )}
      </motion.button>
      <audio 
        ref={audioRef} 
        src="/images/jaunvale (online-audio-converter.com) (1).mp3" 
        loop 
      />
    </div>
  );
};

const LightBox = ({ 
  images, 
  currentIndex, 
  onClose,
  onNext,
  onPrev
}: { 
  images: string[], 
  currentIndex: number | null, 
  onClose: () => void,
  onNext: () => void,
  onPrev: () => void
}) => (
  <AnimatePresence>
    {currentIndex !== null && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-brand-charcoal/95 backdrop-blur-md flex items-center justify-center p-4 cursor-default"
        onClick={onClose}
      >
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2"
          onClick={onClose}
        >
          <X size={32} strokeWidth={1.5} />
        </motion.button>

        {/* Navigation Arrows */}
        <div className="absolute inset-x-4 md:inset-x-8 flex justify-between pointer-events-none">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="pointer-events-auto w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
          >
            <ChevronLeft size={32} strokeWidth={1} />
          </motion.button>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="pointer-events-auto w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
            onClick={(e) => { e.stopPropagation(); onNext(); }}
          >
            <ChevronRight size={32} strokeWidth={1} />
          </motion.button>
        </div>

        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.95, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.95, x: -50 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="max-w-4xl max-h-[85vh] flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={images[currentIndex]}
            className="w-full h-full object-contain rounded-lg shadow-2xl"
          />
        </motion.div>

        {/* Counter */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-xs tracking-[0.3em] font-black uppercase">
          {currentIndex + 1} / {images.length}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const RSVPModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setTimeout(() => setStatus('success'), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-brand-sage/40 backdrop-blur-md flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="bg-brand-cream w-full max-w-xl rounded-[3rem] shadow-2xl p-8 md:p-12 relative overflow-hidden"
          >
            <button onClick={onClose} className="absolute top-8 right-8 text-brand-sage/40 hover:text-brand-sage transition-colors">
              <X size={28} />
            </button>

            {status === 'success' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-6"
              >
                <div className="w-20 h-20 bg-brand-sage/10 text-brand-sage rounded-full flex items-center justify-center mx-auto">
                  <Heart fill="currentColor" size={32} />
                </div>
                <h3 className="font-serif text-4xl text-brand-charcoal italic">¡Gracias por confirmar!</h3>
                <p className="text-brand-charcoal/60">Nos hace muy felices saber que estarás con nosotros.</p>
                <button 
                  onClick={onClose}
                  className="mt-8 px-12 py-4 bg-brand-sage text-brand-cream rounded-full text-xs tracking-widest font-black uppercase"
                >
                  Cerrar
                </button>
              </motion.div>
            ) : (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h3 className="font-serif text-5xl text-brand-charcoal italic">Confirmar Asistencia</h3>
                  <p className="text-brand-charcoal/40 uppercase tracking-[0.2em] text-[10px] font-black">Tu presencia es nuestro mejor regalo</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-brand-sage/60 ml-4">Nombre Completo</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ej. Juan Pérez" 
                      className="w-full bg-white border border-brand-sage/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-brand-sage/20 transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-black text-brand-sage/60 ml-4">¿Asistirás?</label>
                      <select className="w-full bg-white border border-brand-sage/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-brand-sage/20 appearance-none text-brand-charcoal">
                        <option>Sí, asistiré</option>
                        <option>No podré asistir</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-black text-brand-sage/60 ml-4">Personas</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="5"
                        defaultValue="1"
                        className="w-full bg-white border border-brand-sage/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-brand-sage/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-brand-sage/60 ml-4">Mensaje (Opcional)</label>
                    <textarea 
                      placeholder="¿Alguna restricción alimentaria o mensaje especial?" 
                      rows={3}
                      className="w-full bg-white border border-brand-sage/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-brand-sage/20 transition-all resize-none"
                    />
                  </div>

                  <button 
                    disabled={status === 'sending'}
                    type="submit"
                    className="w-full py-6 bg-brand-sage text-brand-cream rounded-2xl text-xs tracking-[0.3em] font-black uppercase shadow-xl hover:shadow-brand-sage/20 transition-all disabled:opacity-50"
                  >
                    {status === 'sending' ? 'Enviando...' : 'Confirmar ahora'}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Hero = () => {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0.3, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0.3, 0.5], [1, 1.1]);
  const heroTextY = useTransform(scrollYProgress, [0.3, 0.5], [0, 100]);

  return (
    <section id="welcome" className="relative h-[85vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden bg-brand-sage">
      <motion.div 
        style={{ scale: heroScale }}
        className="absolute inset-0 z-0"
      >
        <img 
          src="/images/2.jpeg" 
          alt="Juan & Vale"
          className="w-full h-full object-cover brightness-[0.7] contrast-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
      </motion.div>
      
      {/* Torn Edge at Bottom */}
      <div className="absolute -bottom-1 left-0 w-full h-16 md:h-24 z-20 pointer-events-none rotate-180">
        <img 
          src="/images/torn-edge.png" 
          className="w-full h-full object-cover" 
          alt="" 
          style={{ filter: 'brightness(0) saturate(100%) invert(98%) sepia(5%) saturate(302%) hue-rotate(346deg) brightness(101%) contrast(97%)' }} 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="relative z-10 space-y-6"
      >
        <span className="text-[10px] md:text-xs tracking-[0.6em] uppercase text-white/80 font-black">Nos Casamos</span>
        <h2 className="font-serif text-white text-6xl md:text-8xl leading-tight italic drop-shadow-2xl">Juan & Vale</h2>
        <div className="w-12 h-[1px] bg-brand-gold mx-auto" />
        <p className="text-white/90 text-lg md:text-xl tracking-[0.2em] font-light uppercase">Agosto 28 . 2026</p>
      </motion.div>
    </section>
  );
};

// --- Invitation Envelope Component ---

const InvitationEnvelope = ({ onOpen, onStartMusic }: { onOpen: () => void, onStartMusic: () => void }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleOpen = () => {
    setIsAnimating(true);
    onStartMusic(); // play music immediately on click!
    setTimeout(() => {
      onOpen(); // unmount envelope after animation completes
    }, 1050); // matches slide duration
  };

  return (
    <div className="fixed inset-0 z-[100] flex overflow-hidden w-screen h-screen select-none">
      {/* LEFT HALF DOOR */}
      <motion.div
        animate={isAnimating ? { x: '-100%' } : { x: 0 }}
        transition={{ duration: 1.0, ease: [0.76, 0, 0.24, 1] }}
        className="w-1/2 h-full bg-linen-texture relative flex justify-end items-center overflow-hidden border-r border-brand-gold/10"
      >
        {/* Soft lighting highlight on the envelope */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/5 pointer-events-none" />
        
        {/* Background Gold Leaf Outline Left */}
        <div className="absolute -left-12 -bottom-12 w-72 h-72 text-brand-gold/15 pointer-events-none select-none rotate-[45deg] opacity-75">
          <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.8" className="w-full h-full">
            <path d="M 20,180 C 40,140 80,100 120,80 C 140,70 180,60 200,60" />
            <path d="M 60,140 Q 50,110 30,120" />
            <path d="M 60,140 Q 80,120 70,95" />
            <path d="M 90,110 Q 80,80 60,90" />
            <path d="M 90,110 Q 110,90 100,65" />
            <path d="M 120,80 Q 110,50 90,60" />
            <path d="M 120,80 Q 140,60 130,35" />
            {/* Leaves */}
            <path d="M 30,120 C 20,115 15,100 25,95 C 35,90 40,105 30,120 Z" fill="currentColor" className="opacity-[0.03]" />
            <path d="M 70,95 C 60,90 55,75 65,70 C 75,65 80,80 70,95 Z" fill="currentColor" className="opacity-[0.03]" />
            <path d="M 60,90 C 50,85 45,70 55,65 C 65,60 70,75 60,90 Z" fill="currentColor" className="opacity-[0.03]" />
            <path d="M 100,65 C 90,60 85,45 95,40 C 105,35 110,50 100,65 Z" fill="currentColor" className="opacity-[0.03]" />
          </svg>
        </div>

        {/* Left half of the heart watermark */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-[0.02]">
          <Heart size={600} strokeWidth={0.2} className="text-brand-cream" />
        </div>

        {/* Silk Ribbon Left Half */}
        <div 
          className="absolute right-0 top-[50%] w-3.5 h-[35vh] bg-[#a87e35] origin-top rotate-[4deg] z-20 pointer-events-none rounded-b-sm"
          style={{
            boxShadow: '-3px 5px 12px rgba(0,0,0,0.3)',
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.15) 100%)'
          }}
        />

        {/* LEFT HALF OF INVITATION CARD (Responsive size) */}
        <div 
          className="w-[42vw] max-w-[215px] h-[65vh] max-h-[430px] min-h-[350px] bg-[#fbf9f8] rounded-l-[2rem] border-y border-l border-brand-gold/20 shadow-2xl relative flex flex-col justify-between items-end p-5 md:p-6 pr-12 xs:pr-14 sm:pr-16 md:pr-20 overflow-hidden"
          style={{
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")',
            boxShadow: '-15px 30px 50px rgba(0, 0, 0, 0.25), inset 12px 0 24px rgba(27,77,62,0.02)'
          }}
        >
          {/* Double Gold Line Border Left Half */}
          <div className="absolute inset-y-3 left-3 right-0 border-y border-l border-brand-gold/15 rounded-l-[1.8rem] pointer-events-none" />
          <div className="absolute inset-y-4 left-4 right-0 border-y border-l border-brand-gold/5 rounded-l-[1.7rem] pointer-events-none" />

          {/* Top-Left Botanical corner flourish */}
          <svg className="absolute top-5 left-5 w-10 h-10 text-brand-gold/30 pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M 12,12 Q 40,20 50,50" />
            <path d="M 22,15 Q 18,30 30,26 Z" fill="currentColor" className="opacity-10" />
            <path d="M 32,18 Q 36,6 46,14 Z" fill="currentColor" className="opacity-10" />
          </svg>

          {/* Bottom-Left Botanical corner flourish */}
          <svg className="absolute bottom-5 left-5 w-10 h-10 text-brand-gold/30 pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M 12,88 Q 40,80 50,50" />
            <path d="M 22,85 Q 18,70 30,74 Z" fill="currentColor" className="opacity-10" />
            <path d="M 32,82 Q 36,94 46,86 Z" fill="currentColor" className="opacity-10" />
          </svg>

          {/* Top details Left Half */}
          <div className="text-brand-gold pt-4 flex flex-col items-end gap-1 w-full text-right z-10">
            <Heart size={14} strokeWidth={1} className="fill-brand-gold/10 mr-1" />
            <span className="text-[7px] md:text-[8px] tracking-[0.3em] uppercase font-bold text-brand-gold/80 block">Save the</span>
          </div>

          {/* Left half text */}
          <div className="text-right py-2 my-auto select-none pointer-events-none z-10 w-full flex flex-col items-end">
            <span className="text-[7px] md:text-[9px] tracking-[0.3em] uppercase font-bold text-brand-sage/55 block mb-1">Nuestra</span>
            <h1 className="font-serif italic text-3xl xs:text-4xl sm:text-5xl font-medium text-brand-charcoal leading-none pr-1">
              Juan
            </h1>
            <p className="font-script text-2xl xs:text-3xl text-brand-sage mt-2 pr-1 leading-none">
              Te invitamos a ser
            </p>
          </div>

          {/* Bottom details Left Half */}
          <div className="pb-4 w-full text-right z-10">
            <p className="text-[8px] md:text-[10px] tracking-[0.25em] uppercase text-brand-gold font-bold">28 de Agosto</p>
            <p className="text-[7px] md:text-[8px] tracking-[0.15em] uppercase text-brand-charcoal/40 font-bold">Subachoque</p>
          </div>
        </div>
      </motion.div>

      {/* RIGHT HALF DOOR */}
      <motion.div
        animate={isAnimating ? { x: '100%' } : { x: 0 }}
        transition={{ duration: 1.0, ease: [0.76, 0, 0.24, 1] }}
        className="w-1/2 h-full bg-linen-texture relative flex justify-start items-center overflow-hidden border-l border-brand-gold/10"
      >
        {/* Soft lighting highlight on the envelope */}
        <div className="absolute inset-0 bg-gradient-to-tl from-black/40 via-transparent to-white/5 pointer-events-none" />

        {/* Background Gold Leaf Outline Right */}
        <div className="absolute -right-12 -top-12 w-72 h-72 text-brand-gold/15 pointer-events-none select-none rotate-[225deg] opacity-75">
          <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.8" className="w-full h-full">
            <path d="M 20,180 C 40,140 80,100 120,80 C 140,70 180,60 200,60" />
            <path d="M 60,140 Q 50,110 30,120" />
            <path d="M 60,140 Q 80,120 70,95" />
            <path d="M 90,110 Q 80,80 60,90" />
            <path d="M 90,110 Q 110,90 100,65" />
            <path d="M 120,80 Q 110,50 90,60" />
            <path d="M 120,80 Q 140,60 130,35" />
            {/* Leaves */}
            <path d="M 30,120 C 20,115 15,100 25,95 C 35,90 40,105 30,120 Z" fill="currentColor" className="opacity-[0.03]" />
            <path d="M 70,95 C 60,90 55,75 65,70 C 75,65 80,80 70,95 Z" fill="currentColor" className="opacity-[0.03]" />
            <path d="M 60,90 C 50,85 45,70 55,65 C 65,60 70,75 60,90 Z" fill="currentColor" className="opacity-[0.03]" />
            <path d="M 100,65 C 90,60 85,45 95,40 C 105,35 110,50 100,65 Z" fill="currentColor" className="opacity-[0.03]" />
          </svg>
        </div>
        
        {/* Right half of the heart watermark */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none opacity-[0.02]">
          <Heart size={600} strokeWidth={0.2} className="text-brand-cream" />
        </div>

        {/* Silk Ribbon Right Half */}
        <div 
          className="absolute left-0 top-[50%] w-3.5 h-[38vh] bg-[#96702d] origin-top rotate-[-6deg] z-20 pointer-events-none rounded-b-sm"
          style={{
            boxShadow: '3px 5px 12px rgba(0,0,0,0.3)',
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.15) 100%)'
          }}
        />

        {/* RIGHT HALF OF INVITATION CARD (Responsive size) */}
        <div 
          className="w-[42vw] max-w-[215px] h-[65vh] max-h-[430px] min-h-[350px] bg-[#fbf9f8] rounded-r-[2rem] border-y border-r border-brand-gold/20 shadow-2xl relative flex flex-col justify-between items-start p-5 md:p-6 pl-12 xs:pl-14 sm:pl-16 md:pl-20 overflow-hidden"
          style={{
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")',
            boxShadow: '15px 30px 50px rgba(0, 0, 0, 0.25), inset -12px 0 24px rgba(27,77,62,0.02)'
          }}
        >
          {/* Double Gold Line Border Right Half */}
          <div className="absolute inset-y-3 left-0 right-3 border-y border-r border-brand-gold/15 rounded-r-[1.8rem] pointer-events-none" />
          <div className="absolute inset-y-4 left-0 right-4 border-y border-r border-brand-gold/5 rounded-r-[1.7rem] pointer-events-none" />

          {/* Top-Right Botanical corner flourish */}
          <svg className="absolute top-5 right-5 w-10 h-10 text-brand-gold/30 pointer-events-none rotate-90" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M 12,12 Q 40,20 50,50" />
            <path d="M 22,15 Q 18,30 30,26 Z" fill="currentColor" className="opacity-10" />
            <path d="M 32,18 Q 36,6 46,14 Z" fill="currentColor" className="opacity-10" />
          </svg>

          {/* Bottom-Right Botanical corner flourish */}
          <svg className="absolute bottom-5 right-5 w-10 h-10 text-brand-gold/30 pointer-events-none -rotate-90" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M 12,12 Q 40,20 50,50" />
            <path d="M 22,15 Q 18,30 30,26 Z" fill="currentColor" className="opacity-10" />
            <path d="M 32,18 Q 36,6 46,14 Z" fill="currentColor" className="opacity-10" />
          </svg>

          {/* Top details Right Half */}
          <div className="text-brand-gold pt-4 flex flex-col items-start gap-1 w-full text-left z-10">
            <div className="h-[14px]" /> {/* placeholder to balance heart */}
            <span className="text-[7px] md:text-[8px] tracking-[0.3em] uppercase font-bold text-brand-gold/80 block mt-[15px]">Date</span>
          </div>

          {/* Right half text */}
          <div className="text-left py-2 my-auto select-none pointer-events-none z-10 w-full flex flex-col items-start">
            <span className="text-[7px] md:text-[9px] tracking-[0.3em] uppercase font-bold text-brand-sage/55 block mb-1">Invitación</span>
            <h1 className="font-serif italic text-3xl xs:text-4xl sm:text-5xl font-medium text-brand-charcoal leading-none pl-1">
              & Vale
            </h1>
            <p className="font-script text-2xl xs:text-3xl text-brand-sage mt-2 pl-1 leading-none">
              parte de nuestro día
            </p>
          </div>

          {/* Bottom details Right Half */}
          <div className="pb-4 w-full text-left z-10">
            <p className="text-[8px] md:text-[10px] tracking-[0.25em] uppercase text-brand-gold font-bold">Año 2026</p>
            <p className="text-[7px] md:text-[8px] tracking-[0.15em] uppercase text-brand-charcoal/40 font-bold">Colombia</p>
          </div>
        </div>
      </motion.div>

      {/* CENTRAL PULSING REALISTIC 3D WAX SEAL (Irregular shape, deep shadows, embossed center) */}
      <AnimatePresence>
        {!isAnimating && (
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ 
              scale: 0.8, 
              opacity: 0,
              transition: { duration: 0.35, ease: "easeIn" } 
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
          >
            <motion.button
              whileHover={{ scale: 1.06, rotate: 1 }}
              whileTap={{ scale: 0.94 }}
              onClick={handleOpen}
              className="relative w-22 h-22 cursor-pointer flex items-center justify-center group select-none border border-[#8a6421]/20"
              style={{
                borderRadius: '47% 53% 50% 50% / 51% 48% 52% 49%', // Irregular organic stamp edges
                background: 'radial-gradient(circle at 35% 35%, #e8c682 0%, #b88e3d 40%, #87601c 95%)',
                boxShadow: `
                  0 12px 30px rgba(0, 0, 0, 0.4), 
                  0 4px 6px rgba(0, 0, 0, 0.2), 
                  inset 0 3px 6px rgba(255, 255, 255, 0.4), 
                  inset 0 -5px 12px rgba(0, 0, 0, 0.35)
                `
              }}
            >
              {/* Soft pulse ring around seal */}
              <span 
                className="absolute -inset-3 animate-ping opacity-35 pointer-events-none" 
                style={{
                  borderRadius: '47% 53% 50% 50% / 51% 48% 52% 49%',
                  border: '1px solid #b88e3d'
                }}
              />
              
              {/* Outer Lip Ridge Detail */}
              <div 
                className="absolute inset-1.5 opacity-30 border border-black/10 pointer-events-none"
                style={{ borderRadius: '47% 53% 50% 50% / 51% 48% 52% 49%' }}
              />

              {/* Embossed Inner Recessed Seal Center */}
              <div 
                className="absolute w-15 h-15 rounded-full flex flex-col items-center justify-center"
                style={{
                  background: 'radial-gradient(circle, #cc9f4c 0%, #a37527 100%)',
                  boxShadow: 'inset 0 3px 6px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(255, 255, 255, 0.15)'
                }}
              >
                {/* Embossed Heart Symbol */}
                <Heart 
                  size={16} 
                  className="fill-white/20 text-white animate-[pulse_2.2s_ease-in-out_infinite]" 
                  strokeWidth={1.5} 
                  style={{
                    filter: 'drop-shadow(0 -1.5px 1px rgba(0,0,0,0.45)) drop-shadow(0 1px 1px rgba(255,255,255,0.2))'
                  }}
                />
                
                {/* Embossed "Abrir" text */}
                <span 
                  className="font-serif italic text-[10px] tracking-widest font-black text-white mt-1 uppercase"
                  style={{
                    filter: 'drop-shadow(0 -1px 0.8px rgba(0,0,0,0.5)) drop-shadow(0 0.8px 0.8px rgba(255,255,255,0.25))'
                  }}
                >
                  Abrir
                </span>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [isRSVPOpen, setIsRSVPOpen] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [startMusic, setStartMusic] = useState(false);

  useEffect(() => {
    if (!isOpened) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpened]);

  return (
    <div className="min-h-screen bg-brand-cream font-sans selection:bg-brand-sage/20 overflow-x-hidden">
      <AnimatePresence>
        {!isOpened && (
          <InvitationEnvelope 
            onOpen={() => setIsOpened(true)} 
            onStartMusic={() => setStartMusic(true)} 
          />
        )}
      </AnimatePresence>

      <Navbar />
      
      <main>
        {/* Nuestra Historia (Collage) - Now First */}
        <Gallery />

        {/* Vertical Editorial Details (The Wedding Day, When & Where) */}
        <EditorialDetails />

        {/* Countdown Section */}
        <section className="py-24 bg-brand-cream relative">
          <div className="max-w-7xl mx-auto px-6">
            <SectionHeader title="Faltan" subtitle="La Cuenta Regresiva" />
            <Countdown />
          </div>
        </section>

        {/* Itinerary / Timeline Section */}
        <section id="theday" className="py-32 bg-paper-texture px-6 relative overflow-hidden">
          {/* Background SVG Botanicals */}
          <div className="absolute top-10 -left-10 w-64 h-64 text-brand-sage/5 pointer-events-none select-none hidden md:block">
            <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
              <path d="M 20,180 C 40,140 80,100 120,80 C 140,70 180,60 200,60" />
              <path d="M 60,140 Q 50,110 30,120" />
              <path d="M 60,140 Q 80,120 70,95" />
              <path d="M 90,110 Q 80,80 60,90" />
              <path d="M 90,110 Q 110,90 100,65" />
              <path d="M 120,80 Q 110,50 90,60" />
              <path d="M 120,80 Q 140,60 130,35" />
              {/* Leaves */}
              <path d="M 30,120 C 20,115 15,100 25,95 C 35,90 40,105 30,120 Z" fill="currentColor" opacity="0.8" />
              <path d="M 70,95 C 60,90 55,75 65,70 C 75,65 80,80 70,95 Z" fill="currentColor" opacity="0.8" />
              <path d="M 60,90 C 50,85 45,70 55,65 C 65,60 70,75 60,90 Z" fill="currentColor" opacity="0.8" />
              <path d="M 100,65 C 90,60 85,45 95,40 C 105,35 110,50 100,65 Z" fill="currentColor" opacity="0.8" />
              <path d="M 90,60 C 80,55 75,40 85,35 C 95,30 100,45 90,60 Z" fill="currentColor" opacity="0.8" />
              <path d="M 130,35 C 120,30 115,15 125,10 C 135,5 140,20 130,35 Z" fill="currentColor" opacity="0.8" />
            </svg>
          </div>
          <div className="absolute bottom-10 -right-10 w-64 h-64 text-brand-sage/5 pointer-events-none select-none hidden md:block rotate-180">
            <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
              <path d="M 20,180 C 40,140 80,100 120,80 C 140,70 180,60 200,60" />
              <path d="M 60,140 Q 50,110 30,120" />
              <path d="M 60,140 Q 80,120 70,95" />
              <path d="M 90,110 Q 80,80 60,90" />
              <path d="M 90,110 Q 110,90 100,65" />
              <path d="M 120,80 Q 110,50 90,60" />
              <path d="M 120,80 Q 140,60 130,35" />
              {/* Leaves */}
              <path d="M 30,120 C 20,115 15,100 25,95 C 35,90 40,105 30,120 Z" fill="currentColor" opacity="0.8" />
              <path d="M 70,95 C 60,90 55,75 65,70 C 75,65 80,80 70,95 Z" fill="currentColor" opacity="0.8" />
              <path d="M 60,90 C 50,85 45,70 55,65 C 65,60 70,75 60,90 Z" fill="currentColor" opacity="0.8" />
              <path d="M 100,65 C 90,60 85,45 95,40 C 105,35 110,50 100,65 Z" fill="currentColor" opacity="0.8" />
              <path d="M 90,60 C 80,55 75,40 85,35 C 95,30 100,45 90,60 Z" fill="currentColor" opacity="0.8" />
              <path d="M 130,35 C 120,30 115,15 125,10 C 135,5 140,20 130,35 Z" fill="currentColor" opacity="0.8" />
            </svg>
          </div>

          <div className="max-w-4xl mx-auto text-center space-y-24 relative z-10">
            <div className="space-y-4">
              <span className="text-[10px] tracking-[0.5em] uppercase font-black text-brand-sage/50">Cronograma</span>
              <h3 className="font-serif text-5xl md:text-6xl text-brand-charcoal italic">Nuestro Día</h3>
              <div className="w-12 h-[1px] bg-brand-gold/30 mx-auto mt-4" />
            </div>

            <div className="relative space-y-12 md:space-y-16">
              {/* Central Vertical Line (dashed) */}
              <div className="absolute left-1/2 top-8 bottom-8 w-[1px] border-l border-dashed border-brand-sage/35 -translate-x-1/2" />

              {[
                { 
                  time: '14:30 hs', 
                  title: 'Toma de lugar', 
                  description: 'Sean bienvenidos a la hacienda para comenzar a vivir este gran día juntos.', 
                  icon: MapPin 
                },
                { 
                  time: '15:00 hs', 
                  title: 'Ceremonia', 
                  description: 'El momento de unir nuestras vidas para siempre rodeados de su cariño.', 
                  icon: Heart 
                },
                { 
                  time: '16:30 hs', 
                  title: 'Brindis', 
                  description: 'Brindemos por el amor, la amistad y los hermosos momentos que están por venir.', 
                  icon: Utensils 
                },
                { 
                  time: '18:00 hs', 
                  title: 'Cena', 
                  description: 'Una cena especial pensada para compartir risas, anécdotas y buena compañía.', 
                  icon: Utensils 
                },
                { 
                  time: '19:30 hs', 
                  title: 'Fiesta', 
                  description: '¡A bailar y celebrar! La fiesta comienza y la felicidad se comparte en la pista.', 
                  icon: Music 
                }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: idx * 0.1 }}
                  className={`relative z-10 flex flex-col md:flex-row items-center w-full`}
                >
                  {/* Left Column (Card for Even index, Empty space for Odd index) */}
                  <div className={`order-2 md:order-1 w-full md:w-1/2 flex justify-center md:justify-end px-4 md:px-8 ${
                    idx % 2 === 0 ? '' : 'hidden md:flex opacity-0 pointer-events-none'
                  }`}>
                    {idx % 2 === 0 && (
                      <div className="w-full max-w-sm bg-white/85 backdrop-blur-sm p-6 md:p-8 rounded-[2rem] border border-brand-sage/10 shadow-[0_10px_30px_rgba(27,77,62,0.02)] hover:shadow-[0_20px_40px_rgba(27,77,62,0.06)] hover:border-brand-sage/20 hover:-translate-y-1 transition-all duration-300 text-center md:text-right space-y-2 group">
                        <span className="text-[10px] tracking-widest font-black text-brand-gold uppercase block">{item.time}</span>
                        <h4 className="font-serif text-2xl text-brand-charcoal italic group-hover:text-brand-sage transition-colors">{item.title}</h4>
                        <p className="text-xs md:text-sm text-brand-charcoal/65 leading-relaxed font-light">{item.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Center Column (Icon Emblem) */}
                  <div className="order-1 md:order-2 relative my-4 md:my-0 flex items-center justify-center z-20">
                    <div className="w-16 h-16 rounded-full border border-brand-gold/30 p-[3px] bg-brand-cream shadow-sm">
                      <div className="w-full h-full rounded-full bg-brand-sage/5 border border-brand-sage/10 flex items-center justify-center text-brand-sage">
                        <item.icon size={22} strokeWidth={1.5} className="text-brand-sage" />
                      </div>
                    </div>
                  </div>

                  {/* Right Column (Empty space for Even index, Card for Odd index) */}
                  <div className={`order-2 md:order-3 w-full md:w-1/2 flex justify-center md:justify-start px-4 md:px-8 ${
                    idx % 2 !== 0 ? '' : 'hidden md:flex opacity-0 pointer-events-none'
                  }`}>
                    {idx % 2 !== 0 && (
                      <div className="w-full max-w-sm bg-white/85 backdrop-blur-sm p-6 md:p-8 rounded-[2rem] border border-brand-sage/10 shadow-[0_10px_30px_rgba(27,77,62,0.02)] hover:shadow-[0_20px_40px_rgba(27,77,62,0.06)] hover:border-brand-sage/20 hover:-translate-y-1 transition-all duration-300 text-center md:text-left space-y-2 group">
                        <span className="text-[10px] tracking-widest font-black text-brand-gold uppercase block">{item.time}</span>
                        <h4 className="font-serif text-2xl text-brand-charcoal italic group-hover:text-brand-sage transition-colors">{item.title}</h4>
                        <p className="text-xs md:text-sm text-brand-charcoal/65 leading-relaxed font-light">{item.description}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Second Torn Transition - Elegant Typography Banner */}
        <section className="relative h-[55vh] min-h-[350px] flex items-center justify-center overflow-hidden bg-brand-sage text-center px-6">
          {/* Top Torn Edge */}
          <div className="absolute top-0 left-0 w-full h-16 z-20 pointer-events-none">
            <img 
              src="/images/torn-edge.png" 
              className="w-full h-full object-cover fill-brand-cream" 
              alt="" 
              style={{ filter: 'brightness(0) saturate(100%) invert(98%) sepia(5%) saturate(302%) hue-rotate(346deg) brightness(101%) contrast(97%)' }} 
            />
          </div>

          {/* Textured background overlay */}
          <div className="absolute inset-0 bg-paper-texture opacity-[0.06] mix-blend-overlay pointer-events-none" />

          {/* Gold Decorative Circles/Leaves */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
            <Heart size={400} strokeWidth={0.5} className="text-brand-gold" />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-2xl mx-auto space-y-8 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="flex items-center gap-4 text-brand-gold"
            >
              <div className="h-[1px] w-8 bg-brand-gold/30" />
              <Heart size={24} className="fill-brand-gold/20" strokeWidth={1.5} />
              <div className="h-[1px] w-8 bg-brand-gold/30" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif italic text-2xl md:text-3xl text-brand-cream leading-relaxed max-w-xl px-4"
            >
              "Por encima de todo, vístanse de amor, que es el vínculo perfecto."
            </motion.p>

            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.7 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="text-[9px] md:text-[10px] tracking-[0.4em] uppercase text-brand-gold font-black"
            >
              Colosenses 3:14
            </motion.span>
          </div>

          {/* Bottom Torn Edge */}
          <div className="absolute -bottom-1 left-0 w-full h-16 z-20 pointer-events-none rotate-180">
            <img 
              src="/images/torn-edge.png" 
              className="w-full h-full object-cover fill-brand-cream" 
              alt="" 
              style={{ filter: 'brightness(0) saturate(100%) invert(98%) sepia(5%) saturate(302%) hue-rotate(346deg) brightness(101%) contrast(97%)' }} 
            />
          </div>
        </section>

        {/* Social / Instagram Section */}
        <section className="py-24 bg-brand-cream px-6 text-center space-y-12">
          <div className="space-y-4">
            <Camera className="mx-auto text-brand-gold" size={32} strokeWidth={1} />
            <h3 className="font-serif text-4xl text-brand-charcoal italic">Instagram</h3>
            <p className="text-brand-charcoal/60 font-light italic max-w-sm mx-auto">
              No nos queremos perder de nada, por favor etiqueta y comparte el instagram de la boda para que podamos revivir momentos.
            </p>
            <motion.a 
              href="#"
              className="inline-block px-10 py-4 bg-brand-sage text-brand-cream text-[10px] tracking-[0.3em] font-black uppercase rounded-full shadow-lg"
            >
              @NuestraBoda
            </motion.a>
          </div>

          <div className="pt-20 space-y-6">
            <Music className="mx-auto text-brand-gold" size={32} strokeWidth={1} />
            <h3 className="font-serif text-4xl text-brand-charcoal italic">Playlist</h3>
            <p className="text-brand-charcoal/60 font-light italic max-w-sm mx-auto">
              La fiesta la haces vos, ayúdanos con la música, recomendándonos una canción que no puede faltar.
            </p>
            <motion.a 
              href="#"
              className="inline-block px-10 py-4 bg-brand-sage text-brand-cream text-[10px] tracking-[0.3em] font-black uppercase rounded-full shadow-lg"
            >
              Añadir Canción
            </motion.a>
          </div>
        </section>

        {/* Venue Section */}
        <section id="thevenue" className="py-32 px-6 max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-20 lg:gap-32">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5 }}
              className="w-full lg:w-1/2 space-y-10"
            >
              <div className="space-y-4">
                <span className="text-xs tracking-[0.5em] uppercase font-black text-brand-gold">El Destino</span>
                <h3 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[0.9] text-brand-charcoal italic">Hacienda<br/>La Victoria</h3>
              </div>
              
              <p className="text-2xl text-brand-charcoal/60 leading-relaxed font-light italic">
                Un rincón mágico en Subachoque donde la naturaleza y la elegancia se funden para crear el escenario perfecto de nuestro gran día.
              </p>
              
              <motion.a 
                href="https://www.google.com/maps/search/Hacienda+La+Victoria+Subachoque"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-12 py-7 bg-brand-sage text-brand-cream text-[10px] tracking-[0.4em] uppercase font-black rounded-2xl shadow-2xl flex items-center justify-center gap-6 group relative overflow-hidden w-fit"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <Navigation size={18} />
                Ver Ubicación
              </motion.a>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
              className="w-full lg:w-1/2 aspect-[4/5] relative overflow-hidden rounded-[3rem] shadow-[-30px_50px_100px_rgba(27,77,62,0.15)]"
            >
              <img 
                src="/images/5.jpeg" 
                alt="Hacienda" 
                className="w-full h-full object-cover scale-110 hover:scale-100 transition-transform duration-2000" 
              />
              <div className="absolute bottom-12 left-12 bg-white/90 backdrop-blur-2xl px-10 py-6 rounded-[2rem] border border-white/50">
                <span className="text-xs tracking-[0.4em] uppercase font-black text-brand-gold italic">Subachoque, Colombia</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Gifts Section */}
        <section id="gifts" className="py-32 bg-brand-cream px-6 relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
            <SectionHeader title="Regalos" subtitle="Un Detalle" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="space-y-10"
            >
              <div className="w-24 h-24 bg-brand-sage/5 rounded-full flex items-center justify-center mx-auto text-brand-gold">
                <Gift size={40} strokeWidth={1} />
              </div>
              <p className="text-xl md:text-2xl text-brand-charcoal/60 font-light italic max-w-2xl mx-auto leading-relaxed">
                Su presencia es nuestro mejor regalo, pero si desean tener un detalle con nosotros, 
                contaremos con "Lluvia de Sobres" el día de nuestra boda.
              </p>
            </motion.div>
          </div>
          <div className="absolute -bottom-20 -right-20 text-brand-sage/5 pointer-events-none">
            <Heart size={400} strokeWidth={0.5} />
          </div>
        </section>

        {/* RSVP Section */}
        <section id="rsvp" className="py-40 md:py-60 bg-brand-sage px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-paper-texture opacity-5 mix-blend-overlay" />
          <FloatingElement className="absolute -top-20 -left-20 text-brand-gold/10 pointer-events-none">
            <Infinity size={400} strokeWidth={0.5} />
          </FloatingElement>

          <div className="max-w-4xl mx-auto space-y-12 relative z-10 text-center">
            <motion.h3 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-brand-cream text-5xl md:text-7xl lg:text-8xl leading-[0.9] italic"
            >
              ¿Nos<br/><span className="pl-12 text-brand-gold">Acompañan?</span>
            </motion.h3>
            
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.7 }}
              transition={{ delay: 0.5 }}
              className="text-lg md:text-2xl text-brand-cream font-light max-w-xl mx-auto italic leading-relaxed"
            >
              Estamos listos para decir "Sí" y queremos que seas parte de este nuevo comienzo. 
              Por favor confirma antes del 1 de Agosto.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="pt-8"
            >
              <button 
                onClick={() => setIsRSVPOpen(true)}
                className="px-16 py-6 md:px-24 md:py-8 bg-brand-cream text-brand-sage text-[9px] md:text-[10px] tracking-[0.4em] font-black rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 transition-all group overflow-hidden relative"
              >
                <span className="relative z-10 uppercase">Confirmar Asistencia</span>
                <div className="absolute inset-0 bg-brand-gold/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500" />
              </button>
            </motion.div>
          </div>
          <RSVPModal isOpen={isRSVPOpen} onClose={() => setIsRSVPOpen(false)} />
          <MusicPlayer autoPlayTrigger={startMusic} />
        </section>
      </main>

      {/* Modern Footer Nav for Mobile */}
      <motion.footer 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 left-6 right-6 z-50 md:hidden"
      >
        <div className="bg-brand-cream/80 backdrop-blur-2xl border border-white/50 rounded-full px-8 py-4 shadow-2xl flex justify-between items-center">
          {[
            { icon: Heart, href: '#history' },
            { icon: MapPin, href: '#thevenue' },
            { icon: Mail, href: '#rsvp' }
          ].map((item) => (
            <a key={item.href} href={item.href} className="text-brand-sage/60 hover:text-brand-sage transition-colors p-2">
              <item.icon size={22} strokeWidth={1.5} />
            </a>
          ))}
        </div>
      </motion.footer>
    </div>
  );
}
