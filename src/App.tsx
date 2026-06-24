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
  ChevronRight,
  Home,
  Sparkles,
  Play,
  Pause,
  ExternalLink
} from 'lucide-react';
import { allGuests, familyGroups } from './constants/guests';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

// --- Helpers for Name Normalization and Matching ---
const globalNormalizeName = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

const getEquivalents = (word: string): string[] => {
  const normalized = word.toLowerCase().trim();
  if (!normalized) return [];
  const list = [normalized];
  
  const mappings: Record<string, string[]> = {
    // Daniel / Daniela -> Dani
    'daniel': ['dani'],
    'daniela': ['dani'],
    'dani': ['daniel', 'daniela'],
    
    // Sebastián -> Sebas / Seba
    'sebastian': ['sebas', 'seba'],
    'sebas': ['sebastian'],
    'seba': ['sebastian'],
    
    // Felipe -> Pipe
    'felipe': ['pipe'],
    'pipe': ['felipe'],
    
    // Gabriela / Gabriel -> Gaby
    'gabriela': ['gaby'],
    'gabriel': ['gaby'],
    'gaby': ['gabriela', 'gabriel'],
    
    // Natalia -> Nata
    'natalia': ['nata'],
    'nata': ['natalia'],
    
    // Alejandro / Alejandra -> Ale / Alex
    'alejandra': ['ale', 'alex'],
    'alejandro': ['ale', 'alex'],
    'alex': ['alejandro', 'alejandra', 'ale'],
    'ale': ['alejandra', 'alejandro', 'alex'],
    
    // Camila / Camilo -> Cami
    'camila': ['cami'],
    'camilo': ['cami'],
    'cami': ['camila', 'camilo'],
    
    // Santiago -> Santi
    'santiago': ['santi'],
    'santi': ['santiago'],
    
    // Sofía -> Sofi
    'sofia': ['sofi'],
    'sofi': ['sofia'],
    
    // Antonia / Antonio / Antonella -> Anto
    'antonia': ['anto'],
    'antonio': ['anto'],
    'antonella': ['anto'],
    'anto': ['antonia', 'antonio', 'antonella'],
    
    // Mireya -> Yeya
    'mireya': ['yeya'],
    'yeya': ['mireya'],
    
    // Blanca -> Blanquita
    'blanca': ['blanquita'],
    'blanquita': ['blanca'],
    
    // Olga -> Olguita
    'olga': ['olguita'],
    'olguita': ['olga'],
    
    // Carlos -> Charlie
    'carlos': ['charlie'],
    'charlie': ['carlos'],
    
    // Nicolás -> Nico
    'nicolas': ['nico'],
    'nico': ['nicolas'],
    
    // Eduardo -> Lalo
    'eduardo': ['lalo'],
    'lalo': ['eduardo'],
    
    // Fernando / Fernanda -> Fer
    'fernando': ['fer'],
    'fernanda': ['fer'],
    'fer': ['fernando', 'fernanda'],
    
    // Liliana / Lilia -> Lili
    'liliana': ['lili'],
    'lilia': ['lili'],
    'lili': ['liliana', 'lilia'],
    
    // Valeria / Valentina -> Vale
    'valeria': ['vale'],
    'valentina': ['vale'],
    'vale': ['valeria', 'valentina'],
    
    // Gustavo -> Tavo
    'gustavo': ['tavo'],
    'tavo': ['gustavo'],
    
    // José -> Pepe
    'jose': ['pepe'],
    'pepe': ['jose'],
    
    // Juan Pablo -> Juanpa
    'juanpa': ['juan pablo'],
    'juan pablo': ['juanpa'],
    
    // Juan Sebastián -> Juanse
    'juanse': ['juan sebastian'],
    'juan sebastian': ['juanse'],
    
    // Francisco -> Paco / Pancho
    'francisco': ['paco', 'pancho'],
    'paco': ['francisco'],
    'pancho': ['francisco']
  };
  
  if (mappings[normalized]) {
    list.push(...mappings[normalized]);
  }
  return list;
};

const getFamilyDisplayName = (guestName: string): string => {
  if (!guestName) return '';
  const iNorm = globalNormalizeName(guestName);
  
  // Find matching family group
  const matchedGroup = familyGroups.find(group => {
    return group.some(member => {
      let gNorm = globalNormalizeName(member);
      gNorm = gNorm.replace(/\s*\(.*?\)\s*/g, '').replace(/^(tia|tio|abuelita)\s+/g, '').trim();
      const inputWords = iNorm.split(' ');
      const guestWords = gNorm.split(' ');
      return guestWords.every(gw => inputWords.some(iw => iw === gw || iw.includes(gw) || gw.includes(iw)));
    });
  });

  if (matchedGroup) {
    // Clean names (remove nicknames in parenthesis)
    const cleanNames = matchedGroup.map(n => n.replace(/\s*\(.*?\)\s*/g, '').trim());
    if (cleanNames.length === 0) return '';
    if (cleanNames.length === 1) return cleanNames[0];
    if (cleanNames.length === 2) return `${cleanNames[0]} y ${cleanNames[1]}`;
    return `${cleanNames.slice(0, -1).join(', ')} y ${cleanNames[cleanNames.length - 1]}`;
  }

  return guestName;
};

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

// Clip-path curtain reveal (bottom to top)
const curtainReveal = {
  hidden: { clipPath: 'inset(100% 0% 0% 0%)', opacity: 0 },
  visible: {
    clipPath: 'inset(0% 0% 0% 0%)',
    opacity: 1,
    transition: { duration: 1.1, ease: [0.76, 0, 0.24, 1] }
  }
};

// 3D perspective card entry
const perspective3D = {
  hidden: { opacity: 0, rotateY: 12, rotateX: 4, scale: 0.96, y: 40 },
  visible: {
    opacity: 1,
    rotateY: 0,
    rotateX: 0,
    scale: 1,
    y: 0,
    transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] }
  }
};

// Text line stagger (each line slides in individually)
const lineStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.18, delayChildren: 0.1 }
  }
};
const lineItem = {
  hidden: { opacity: 0, y: 22, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
  }
};

// Character-by-character split text component
const SplitText = ({ text, className, charClassName, staggerDelay = 0.04 }: {
  text: string;
  className?: string;
  charClassName?: string;
  staggerDelay?: number;
}) => {
  const chars = text.split('');
  return (
    <motion.span
      className={className}
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: staggerDelay, delayChildren: 0.05 } }
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      aria-label={text}
    >
      {chars.map((char, i) => (
        <motion.span
          key={i}
          className={charClassName}
          style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : 'normal' }}
          variants={{
            hidden: { opacity: 0, y: 18, filter: 'blur(6px)', rotateX: -25 },
            visible: {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              rotateX: 0,
              transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] }
            }
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
};

// Gold scroll-progress bar (fixed, full width at top)
const ScrollProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      style={{
        scaleX,
        transformOrigin: 'left',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: 'linear-gradient(90deg, #c5a059 0%, #e8c97a 50%, #c5a059 100%)',
        zIndex: 999,
        boxShadow: '0 0 8px rgba(197,160,89,0.6)',
        pointerEvents: 'none',
      }}
    />
  );
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
    { label: 'El Lugar', href: '#thevenue' },
    { label: 'Regalos', href: '#gifts' },
    { label: 'RSVP', href: '#rsvp' }
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 px-6 py-4 flex justify-between items-center ${scrolled ? 'bg-brand-cream/80 backdrop-blur-xl border-b border-brand-sage/5 py-3' : 'bg-transparent'
          }`}
      >
        <button
          onClick={() => setIsOpen(true)}
          className={`hover:scale-110 transition-transform ${scrolled ? 'text-brand-sage' : 'text-brand-sage'}`}
          id="menu-toggle"
        >
          <Menu size={28} strokeWidth={1.5} />
        </button>

        {/* Title removed */}

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
    <div
      className="relative w-full max-w-[340px] aspect-[5/7] rounded-[2rem] border border-brand-gold/25 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] mx-auto bg-white"
      style={{
        backgroundImage: 'url("/images/conteo regresivo.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 flex flex-col justify-center items-center">
        <motion.span
          initial={{ opacity: 0, letterSpacing: '0.2em' }}
          whileInView={{ opacity: 1, letterSpacing: '0.5em' }}
          transition={{ duration: 1.2 }}
          className="text-[10px] tracking-[0.5em] uppercase font-black text-brand-sage/70 block mb-6"
        >
          ✦ Faltan ✦
        </motion.span>

        <div className="grid grid-cols-4 gap-2 w-full px-2 max-w-[250px]">
          {items.map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col items-center justify-center"
            >
              <span 
                className="font-serif text-4xl md:text-5xl text-brand-sage leading-none font-bold"
                style={{ textShadow: '0 2px 10px rgba(255, 255, 255, 0.95), 0 1px 4px rgba(255, 255, 255, 0.9)' }}
              >
                {item.value}
              </span>
              <span 
                className="text-[9px] tracking-[0.1em] uppercase font-black text-brand-charcoal/60 mt-2"
                style={{ textShadow: '0 2px 6px rgba(255, 255, 255, 0.95)' }}
              >
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
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

        <motion.div
          className="mb-12 space-y-4 max-w-xl mx-auto"
          variants={lineStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.h4 variants={lineItem} className="text-[10px] md:text-xs uppercase tracking-[0.6em] font-black text-brand-sage/40">Nuestra Historia</motion.h4>
          <div style={{ perspective: 800 }}>
            <SplitText
              text="Nuestros Momentos"
              className="font-serif italic text-3xl md:text-5xl text-brand-charcoal leading-none block"
            />
          </div>
          <motion.p variants={lineItem} className="text-[10px] md:text-xs uppercase tracking-[0.4em] font-bold text-brand-gold/60 italic">Agosto 28 . 2026</motion.p>
          <motion.p variants={lineItem} className="text-sm md:text-base text-brand-charcoal/50 font-light italic leading-relaxed pt-2">
            "Cada instante compartido nos ha traído hasta aquí. Aquí les compartimos un pedacito de nuestra historia a través de nuestros ojos."
          </motion.p>
        </motion.div>

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
  const [progress, setProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { scrollY } = useScroll();

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setIsScrolled(latest > 100);
    });
  }, [scrollY]);

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

  // Unlock audio on first user interaction and autoplay when triggered
  useEffect(() => {
    if (autoPlayTrigger && audioRef.current) {
      const audio = audioRef.current;
      const tryPlay = () => {
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.log("Autoplay blocked or failed:", err);
        });
      };
      // If audio is ready, play immediately; otherwise wait for canplay
      if (audio.readyState >= 2) {
        tryPlay();
      } else {
        audio.addEventListener('canplay', tryPlay, { once: true });
      }
    }
  }, [autoPlayTrigger]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration || 1;
      setProgress((current / duration) * 100);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const bounds = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const percent = x / bounds.width;
      audioRef.current.currentTime = percent * audioRef.current.duration;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`fixed z-50 flex items-center bg-brand-cream/80 backdrop-blur-xl border border-brand-sage/20 rounded-full shadow-lg transition-all duration-500 overflow-hidden ${isScrolled ? 'top-4 right-4 p-1' : 'top-4 right-4 p-2 pr-4 gap-3'
        }`}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleMusic}
        className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 ${isPlaying
          ? 'bg-brand-sage text-white shadow-md'
          : 'bg-white/50 text-brand-sage border border-brand-sage/20'
          }`}
      >
        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
      </motion.button>

      <AnimatePresence>
        {!isScrolled && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 140, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex flex-col gap-1 shrink-0 overflow-hidden"
          >
            <div className="flex justify-between items-center text-[8px] tracking-widest uppercase font-bold text-brand-charcoal/60 w-full">
              <div className="overflow-hidden w-[85%] relative" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
                <motion.div
                  animate={{ x: ["-50%", "0%"] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="flex w-max"
                >
                  <span className="px-4">Lo que soñé - Juan & Vale</span>
                  <span className="px-4">Lo que soñé - Juan & Vale</span>
                </motion.div>
              </div>
              <div className="w-[15%] flex justify-end">
                {isPlaying ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                    <Music size={8} className="text-brand-sage shrink-0" />
                  </motion.div>
                ) : (
                  <Music size={8} className="text-brand-charcoal/40 shrink-0" />
                )}
              </div>
            </div>
            <div
              className="h-1 bg-brand-sage/10 rounded-full overflow-hidden cursor-pointer relative shrink-0 w-full"
              onClick={handleSeek}
            >
              <motion.div
                className="absolute top-0 left-0 h-full bg-brand-sage"
                style={{ width: `${progress}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio
        ref={audioRef}
        src="/images/jaunvale (online-audio-converter.com) (1).mp3"
        loop
        onTimeUpdate={handleTimeUpdate}
      />
    </motion.div>
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

const RSVPModal = ({ isOpen, onClose, guestName }: { isOpen: boolean, onClose: () => void, guestName: string }) => {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [name, setName] = useState('');
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});
  const [existingConfirmations, setExistingConfirmations] = useState<Record<string, { attending: boolean, submittedBy: string }>>({});
  const [confirmedNames, setConfirmedNames] = useState<string[]>([]);
  const [loadingRSVPs, setLoadingRSVPs] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+57');

  const countryCodes = [
    { code: '+57', flag: '🇨🇴', name: 'COL' },
    { code: '+1', flag: '🇺🇸', name: 'USA' },
    { code: '+52', flag: '🇲🇽', name: 'MEX' },
    { code: '+34', flag: '🇪🇸', name: 'ESP' },
    { code: '+58', flag: '🇻🇪', name: 'VEN' },
    { code: '+593', flag: '🇪🇨', name: 'ECU' },
    { code: '+51', flag: '🇵🇪', name: 'PER' },
    { code: '+54', flag: '🇦🇷', name: 'ARG' },
    { code: '+56', flag: '🇨🇱', name: 'CHL' },
    { code: '+507', flag: '🇵🇦', name: 'PAN' },
    { code: '+55', flag: '🇧🇷', name: 'BRA' },
    { code: '+44', flag: '🇬🇧', name: 'GBR' },
    { code: '+33', flag: '🇫🇷', name: 'FRA' },
    { code: '+49', flag: '🇩🇪', name: 'DEU' },
  ];

  const fullPhone = `${countryCode} ${phone.trim()}`;

  const normalizeName = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  };

  const formatNamesList = (names: string[]) => {
    const cleanNames = names.map(n => n.replace(/\s*\(.*?\)\s*/g, '').trim());
    if (cleanNames.length === 0) return '';
    if (cleanNames.length === 1) return cleanNames[0];
    if (cleanNames.length === 2) return `${cleanNames[0]} y ${cleanNames[1]}`;
    return `${cleanNames.slice(0, -1).join(', ')} y ${cleanNames[cleanNames.length - 1]}`;
  };

  useEffect(() => {
    if (isOpen && guestName) {
      setName(guestName);

      const iNorm = normalizeName(guestName);
      const matchedGroup = familyGroups.find(group => {
        return group.some(member => {
          let gNorm = normalizeName(member);
          gNorm = gNorm.replace(/\s*\(.*?\)\s*/g, '').replace(/^(tia|tio|abuelita)\s+/g, '').trim();
          const inputWords = iNorm.split(' ');
          const guestWords = gNorm.split(' ');
          return guestWords.every(gw => inputWords.some(iw => iw === gw || iw.includes(gw) || gw.includes(iw)));
        });
      });

      if (matchedGroup) {
        setFamilyMembers(matchedGroup);
        const initialMap: Record<string, boolean> = {};
        matchedGroup.forEach(member => {
          initialMap[member] = true;
        });
        setAttendanceMap(initialMap);
      } else {
        setFamilyMembers([guestName]);
        setAttendanceMap({ [guestName]: true });
      }
    }
  }, [guestName, isOpen]);

  useEffect(() => {
    if (isOpen && familyMembers.length > 0) {
      setLoadingRSVPs(true);
      const fetchRSVPs = async () => {
        try {
          const q = query(collection(db, 'rsvps'), where('name', 'in', familyMembers));
          const querySnapshot = await getDocs(q);
          const confirmations: Record<string, { attending: boolean, submittedBy: string }> = {};
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            confirmations[data.name] = {
              attending: data.attending,
              submittedBy: data.submittedBy || data.name
            };
          });
          setExistingConfirmations(confirmations);
        } catch (err) {
          console.error("Error fetching existing RSVPs:", err);
        } finally {
          setLoadingRSVPs(false);
        }
      };
      fetchRSVPs();
    }
  }, [isOpen, familyMembers]);

  const handleToggleAttendance = (member: string, isAttending: boolean) => {
    setAttendanceMap(prev => ({
      ...prev,
      [member]: isAttending
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const unconfirmedMembers = familyMembers.filter(member => !existingConfirmations[member]);
    if (unconfirmedMembers.length === 0) {
      setErrorMsg('Todos los miembros ya han confirmado su asistencia.');
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('Por favor ingresa tu número de celular.');
      return;
    }

    setConfirmedNames(unconfirmedMembers);
    setStatus('sending');

    try {
      const promises = unconfirmedMembers.map(member => {
        return addDoc(collection(db, 'rsvps'), {
          name: member.trim(),
          attending: attendanceMap[member] ?? true,
          familyGroup: familyMembers.join(', '),
          submittedBy: guestName.trim(),
          phone: fullPhone,
          submittedAt: serverTimestamp(),
        });
      });

      await Promise.all(promises);

      // Sincronización en segundo plano con Google Sheets
      const WEBHOOK_URL = (import.meta as any).env.VITE_GOOGLE_SHEETS_WEBHOOK_URL;
      if (WEBHOOK_URL) {
        unconfirmedMembers.forEach(member => {
          const payload = {
            name: member.trim(),
            attending: attendanceMap[member] ?? true,
            familyGroup: familyMembers.join(', '),
            submittedBy: guestName.trim(),
          };
          // Usar GET con query params para evitar problemas de CORS con Google Apps Script
          const params = new URLSearchParams({
            name: payload.name,
            attending: String(payload.attending),
            familyGroup: payload.familyGroup,
            submittedBy: payload.submittedBy,
            phone: fullPhone.replace('+', ''), // Remove the "+" sign to prevent Google Sheets from parsing it as a formula
          });
          fetch(`${WEBHOOK_URL}?${params.toString()}`, {
            method: 'GET',
            mode: 'no-cors',
          }).catch(err => console.error("Error sending RSVP to Google Sheets:", err));
        });
      }

      setStatus('success');
    } catch (err: any) {
      console.error("Error saving RSVP to Firebase:", err);
      setStatus('idle');
      setErrorMsg('Ocurrió un error al enviar tu confirmación. Por favor intenta de nuevo.');
    }
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
            className="bg-brand-cream w-full max-w-xl rounded-[2rem] sm:rounded-[3rem] shadow-2xl p-6 sm:p-8 md:p-12 relative overflow-hidden"
          >
            <button onClick={onClose} className="absolute top-4 right-4 sm:top-8 sm:right-8 text-brand-sage/40 hover:text-brand-sage transition-colors">
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
                {confirmedNames.length > 0 && (
                  <p className="font-serif text-2xl text-brand-sage italic px-4">
                    {formatNamesList(confirmedNames)}
                  </p>
                )}
                <p className="text-brand-charcoal/60 px-4">
                  {confirmedNames.some(m => attendanceMap[m])
                    ? (confirmedNames.length > 1 ? 'Nos hace muy felices saber que estarán con nosotros.' : 'Nos hace muy felices saber que estarás con nosotros.')
                    : (confirmedNames.length > 1 ? 'Lamentamos que no puedan acompañarnos, gracias por avisarnos.' : 'Lamentamos que no puedas acompañarnos, gracias por avisarnos.')}
                </p>
                <button
                  onClick={onClose}
                  className="mt-8 px-12 py-4 bg-brand-sage text-brand-cream rounded-full text-xs tracking-widest font-black uppercase cursor-pointer"
                >
                  Cerrar
                </button>
              </motion.div>
            ) : (
              <div className="space-y-8">

                <div className="text-center space-y-2">
                  <h3 className="font-serif text-5xl text-brand-charcoal italic">Confirmar asistencia</h3>
                  <p className="text-brand-charcoal/40 uppercase tracking-[0.2em] text-[10px] font-black">
                    {familyMembers.length > 1 ? 'Confirma por tu grupo familiar' : 'Tu presencia es nuestro mejor regalo'}
                  </p>
                  <p className="text-brand-gold text-[10px] tracking-[0.15em] uppercase font-bold">
                    Por favor confirma antes del 15 de Julio
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {loadingRSVPs ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                      <span className="text-2xl animate-spin">⚽</span>
                      <p className="text-xs text-brand-charcoal/50 tracking-wider font-bold uppercase">Cargando estado de asistencia...</p>
                    </div>
                  ) : (
                    <>
                      {familyMembers.length > 0 && (
                        <div className="space-y-3 max-h-[38vh] overflow-y-auto pr-2 hide-scrollbar">
                          {familyMembers.map((member) => {
                            const hasConfirmed = !!existingConfirmations[member];
                            const conf = existingConfirmations[member];

                            const subByNorm = conf ? normalizeName(conf.submittedBy) : '';
                            const memberNorm = normalizeName(member);
                            const guestNorm = normalizeName(guestName);

                            const isOwnConfirmation = conf && (
                              subByNorm === memberNorm ||
                              subByNorm === guestNorm
                            );

                            return (
                              <div
                                key={member}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-brand-charcoal/5 rounded-2xl gap-3 border border-brand-sage/5"
                              >
                                <div className="flex flex-col">
                                  <span className="font-serif text-[17px] text-brand-charcoal italic px-1 font-medium">
                                    {member}
                                  </span>
                                  {hasConfirmed && (
                                    <span className={`text-[11px] font-sans font-bold px-1 mt-0.5 ${conf.attending ? 'text-brand-sage' : 'text-brand-wine'}`}>
                                      {conf.attending ? '✓ Asistirá' : '✗ No asistirá'}
                                    </span>
                                  )}
                                </div>

                                {hasConfirmed ? (
                                  <div className="bg-brand-sage/10 text-brand-sage border border-brand-sage/10 rounded-xl px-4 py-2 text-xs font-bold text-center font-sans tracking-wide self-start sm:self-center">
                                    {isOwnConfirmation ? 'Ya confirmaste' : `${conf.submittedBy} confirmó por ti`}
                                  </div>
                                ) : (
                                  <div className="flex gap-2 w-full sm:w-auto">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleAttendance(member, true)}
                                      className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-[10px] tracking-widest font-black uppercase transition-all duration-300 cursor-pointer ${attendanceMap[member]
                                          ? 'bg-brand-sage text-brand-cream shadow-md shadow-brand-sage/10 scale-[1.03]'
                                          : 'bg-brand-charcoal/5 text-brand-charcoal/40 hover:bg-brand-charcoal/10'
                                        }`}
                                    >
                                      Sí
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleAttendance(member, false)}
                                      className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-[10px] tracking-widest font-black uppercase transition-all duration-300 cursor-pointer ${!attendanceMap[member]
                                          ? 'bg-brand-wine text-brand-cream shadow-md shadow-brand-wine/10 scale-[1.03]'
                                          : 'bg-brand-charcoal/5 text-brand-charcoal/40 hover:bg-brand-charcoal/10'
                                        }`}
                                    >
                                      No
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {familyMembers.some(m => !existingConfirmations[m]) && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-[0.2em] font-black text-brand-charcoal/50 px-1">
                            Número de celular <span className="text-brand-wine">*</span>
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={countryCode}
                              onChange={(e) => setCountryCode(e.target.value)}
                              className="bg-brand-charcoal/5 border border-brand-sage/10 rounded-2xl px-3 py-4 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-sage/20 transition-all font-sans text-sm appearance-none cursor-pointer min-w-[100px]"
                            >
                              {countryCodes.map(c => (
                                <option key={c.code} value={c.code}>
                                  {c.flag} {c.code}
                                </option>
                              ))}
                            </select>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value.replace(/[^0-9\s-]/g, ''))} // Sanitize to allow only numbers, spaces, and hyphens
                              placeholder="300 123 4567"
                              required
                              className="flex-1 bg-brand-charcoal/5 border border-brand-sage/10 rounded-2xl px-5 py-4 text-brand-charcoal placeholder:text-brand-charcoal/25 focus:outline-none focus:ring-2 focus:ring-brand-sage/20 transition-all font-sans text-sm"
                            />
                          </div>
                        </div>
                      )}

                      {familyMembers.some(m => !existingConfirmations[m]) ? (
                        <button
                          disabled={status === 'sending'}
                          type="submit"
                          className="w-full py-6 bg-brand-sage text-brand-cream rounded-2xl text-xs tracking-[0.3em] font-black uppercase shadow-xl hover:shadow-brand-sage/20 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {status === 'sending' ? 'Enviando...' : 'Confirmar ahora'}
                        </button>
                      ) : (
                        <div className="space-y-4 pt-2">
                          <p className="text-[12px] text-center font-sans tracking-wide text-brand-charcoal/60 bg-brand-sage/5 p-4 rounded-xl border border-brand-sage/10 font-medium">
                            Toda tu familia ya ha confirmado su asistencia. ¡Muchas gracias!
                          </p>
                          <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-5 bg-brand-sage text-brand-cream rounded-2xl text-xs tracking-[0.3em] font-black uppercase shadow-xl hover:shadow-brand-sage/20 transition-all cursor-pointer"
                          >
                            Cerrar
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  <AnimatePresence>
                    {errorMsg && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-red-500/90 text-xs text-center font-medium bg-red-50 p-4 rounded-xl border border-red-100"
                      >
                        {errorMsg}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const SongModal = ({ isOpen, onClose, guestName }: { isOpen: boolean, onClose: () => void, guestName: string }) => {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [song, setSong] = useState('');
  const [artist, setArtist] = useState('');
  const [suggestedBy, setSuggestedBy] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSuggestedBy(guestName || '');
      setSong('');
      setArtist('');
      setStatus('idle');
      setErrorMsg('');
    }
  }, [isOpen, guestName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!song.trim() || !artist.trim()) {
      setErrorMsg('Por favor completa los campos obligatorios.');
      return;
    }

    setStatus('sending');

    try {
      await addDoc(collection(db, 'songs'), {
        title: song.trim(),
        artist: artist.trim(),
        suggestedBy: suggestedBy.trim() || 'Anónimo',
        submittedAt: serverTimestamp(),
      });

      const WEBHOOK_URL = (import.meta as any).env.VITE_GOOGLE_SHEETS_WEBHOOK_URL;
      if (WEBHOOK_URL) {
        const params = new URLSearchParams({
          type: 'song',
          song: song.trim(),
          artist: artist.trim(),
          suggestedBy: suggestedBy.trim() || 'Anónimo',
        });

        fetch(`${WEBHOOK_URL}?${params.toString()}`, {
          method: 'GET',
          mode: 'no-cors',
        }).catch(err => console.error("Error sending song to Google Sheets:", err));
      }

      setStatus('success');
    } catch (err: any) {
      console.error("Error saving song suggestion:", err);
      setStatus('idle');
      setErrorMsg('Ocurrió un error al enviar tu sugerencia. Por favor intenta de nuevo.');
    }
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
            className="bg-brand-cream w-full max-w-md rounded-[2rem] sm:rounded-[3rem] shadow-2xl p-6 sm:p-8 md:p-12 relative overflow-hidden"
          >
            <button onClick={onClose} className="absolute top-4 right-4 sm:top-8 sm:right-8 text-brand-sage/40 hover:text-brand-sage transition-colors">
              <X size={28} />
            </button>

            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10 space-y-6"
              >
                <div className="w-20 h-20 bg-brand-sage/10 text-brand-sage rounded-full flex items-center justify-center mx-auto">
                  <Music fill="currentColor" size={32} />
                </div>
                <h3 className="font-serif text-4xl text-brand-charcoal italic">¡Canción Añadida!</h3>
                <p className="text-brand-charcoal/60 px-4">
                  Tu sugerencia de <strong>{song}</strong> - <em>{artist}</em> ha sido agregada a la lista. ¡Gracias por ayudarnos a armar la fiesta!
                </p>
                <button
                  onClick={onClose}
                  className="mt-8 px-12 py-4 bg-brand-sage text-brand-cream rounded-full text-xs tracking-widest font-black uppercase cursor-pointer"
                >
                  Cerrar
                </button>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="font-serif text-4xl text-brand-charcoal italic">Sugerir Canción</h3>
                  <p className="text-brand-charcoal/40 uppercase tracking-[0.2em] text-[10px] font-black">
                    ¡Ayúdanos con la música para la fiesta!
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-black text-brand-charcoal/50 px-1">
                      Nombre de la Canción <span className="text-brand-wine">*</span>
                    </label>
                    <input
                      type="text"
                      value={song}
                      onChange={(e) => setSong(e.target.value)}
                      placeholder="Ej: Lo que soñé"
                      required
                      className="w-full bg-brand-charcoal/5 border border-brand-sage/10 rounded-2xl px-5 py-4 text-brand-charcoal placeholder:text-brand-charcoal/25 focus:outline-none focus:ring-2 focus:ring-brand-sage/20 transition-all font-sans text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-black text-brand-charcoal/50 px-1">
                      Artista / Banda <span className="text-brand-wine">*</span>
                    </label>
                    <input
                      type="text"
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      placeholder="Ej: Juan & Vale"
                      required
                      className="w-full bg-brand-charcoal/5 border border-brand-sage/10 rounded-2xl px-5 py-4 text-brand-charcoal placeholder:text-brand-charcoal/25 focus:outline-none focus:ring-2 focus:ring-brand-sage/20 transition-all font-sans text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-black text-brand-charcoal/50 px-1">
                      Tu Nombre (Opcional)
                    </label>
                    <input
                      type="text"
                      value={suggestedBy}
                      onChange={(e) => setSuggestedBy(e.target.value)}
                      placeholder="Ej: Tu nombre"
                      className="w-full bg-brand-charcoal/5 border border-brand-sage/10 rounded-2xl px-5 py-4 text-brand-charcoal placeholder:text-brand-charcoal/25 focus:outline-none focus:ring-2 focus:ring-brand-sage/20 transition-all font-sans text-sm"
                    />
                  </div>

                  <button
                    disabled={status === 'sending'}
                    type="submit"
                    className="w-full py-6 bg-brand-sage text-brand-cream rounded-2xl text-xs tracking-[0.3em] font-black uppercase shadow-xl hover:shadow-brand-sage/20 transition-all disabled:opacity-50 cursor-pointer pt-4"
                  >
                    {status === 'sending' ? 'Enviando...' : 'Sugerir canción'}
                  </button>

                  <AnimatePresence>
                    {errorMsg && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-red-500/90 text-xs text-center font-medium bg-red-50 p-4 rounded-xl border border-red-100 mt-2"
                      >
                        {errorMsg}
                      </motion.div>
                    )}
                  </AnimatePresence>
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
  return (
    <section
      id="welcome"
      className="relative w-full max-w-[340px] aspect-[5/7] rounded-[2rem] border border-brand-gold/25 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col justify-between items-center text-center px-6 pt-12 pb-10 overflow-hidden mx-auto bg-transparent mt-20 sm:mt-28"
      style={{
        backgroundImage: 'url("/images/card_hero_illustration.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Floating gold dust particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-brand-gold/25 pointer-events-none"
          style={{
            width: Math.random() * 5 + 3,
            height: Math.random() * 5 + 3,
            left: `${10 + i * 15}%`,
            top: `${15 + (i % 3) * 20}%`,
          }}
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 3.5 + i, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Top Text Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 space-y-3 mt-4"
      >
        <span className="text-[10px] tracking-[0.6em] uppercase text-brand-gold font-bold">Nos Casamos</span>
        <div className="w-16 h-[1px] bg-brand-gold/40 mx-auto" />
      </motion.div>

      {/* Middle Empty Spacer to prevent text overlap with the central couple illustration */}
      <div className="h-32" />

      {/* Bottom Text Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 space-y-2 mb-4"
      >
        <p className="text-brand-sage text-sm tracking-[0.25em] font-black uppercase">
          Agosto 28 . 2026
        </p>
        <p className="text-brand-charcoal/45 text-[9px] tracking-[0.2em] uppercase font-black">
          Subachoque, Colombia
        </p>
      </motion.div>
    </section>
  );
};

// --- Invitation Envelope Component ---

const InvitationEnvelope = ({ onOpen, onStartMusic, guestName, onNameSubmit }: { onOpen: () => void, onStartMusic: () => void, guestName: string, onNameSubmit: (name: string) => void }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [localName, setLocalName] = useState(guestName || '');
  const [validationStatus, setValidationStatus] = useState<'idle' | 'verifying' | 'error' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [matchedGuests, setMatchedGuests] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (guestName) setLocalName(guestName);
  }, [guestName]);

  const closeModal = () => {
    setIsModalOpen(false);
    setValidationStatus('idle');
    setErrorMsg('');
    setMatchedGuests([]);
  };

  const normalizeName = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  };

  const isMatch = (guest: string, input: string) => {
    const iNorm = normalizeName(input);
    if (!iNorm) return false;

    // Replace parentheses with spaces so nickname words are matched
    const gNorm = normalizeName(guest).replace(/[()]/g, ' ');

    const inputWords = iNorm.split(/\s+/).filter(Boolean);
    const guestWords = gNorm.split(/\s+/).filter(Boolean);

    if (inputWords.length === 0) return false;

    return inputWords.every(iw => {
      const iwEquivalents = getEquivalents(iw);
      return guestWords.some(gw => {
        const gwEquivalents = getEquivalents(gw);
        return iwEquivalents.some(ie => {
          return gwEquivalents.some(ge => ge === ie || ge.startsWith(ie) || ie.startsWith(ge));
        });
      });
    });
  };

  const proceedWithGuest = (selectedGuest: string) => {
    setValidationStatus('verifying');
    setMatchedGuests([]);
    setLocalName(selectedGuest);
    setErrorMsg('');

    // Unlock audio context synchronously within user gesture so mobile browsers allow autoplay
    try {
      const unlockAudio = new Audio('/images/jaunvale (online-audio-converter.com) (1).mp3');
      unlockAudio.volume = 0;
      unlockAudio.play().then(() => {
        unlockAudio.pause();
        unlockAudio.src = '';
      }).catch(() => {});
    } catch (_) {}

    // Simulate database check / roulette animation
    setTimeout(() => {
      setValidationStatus('success');
      setTimeout(() => {
        onNameSubmit(selectedGuest.trim());
        setIsAnimating(true);
        onStartMusic();
        setTimeout(() => { onOpen(); }, 1100);
      }, 1000);
    }, 4800); // 4.8 seconds of "verifying" animation (3 full cycles)
  };

  const handleOpenClick = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!localName.trim() || validationStatus === 'verifying') return;

    setErrorMsg('');
    const matches = allGuests.filter(guest => isMatch(guest, localName));

    if (matches.length === 0) {
      setValidationStatus('error');
      setErrorMsg(`Acceso denegado: No encontramos "${localName.trim()}" en la lista oficial.`);
      return;
    }

    if (matches.length === 1) {
      proceedWithGuest(matches[0]);
    } else {
      setMatchedGuests(matches);
      setValidationStatus('idle');
    }
  };


  // CardInner: renders the full card at responsive dimensions.
  // Same component placed in BOTH doors. Each door clips to its half via overflow:hidden.
  const CardInner = () => (
    <div style={{
      width: 'var(--card-w)',
      height: 'var(--card-h)',
      position: 'relative',
      borderRadius: 14,
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <img
        src="/images/save_the_date_card.jpg"
        alt="Invitación"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
        }}
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden w-screen h-screen select-none bg-brand-charcoal"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.55]"
        style={{ backgroundImage: 'url("/images/welcome_flatlay.jpg")', pointerEvents: 'none' }}
      />

      {/* Subtle vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.22)', pointerEvents: 'none', zIndex: 1 }} />

      {/* Dark overlay backdrop to highlight the verification animation */}
      <AnimatePresence>
        {validationStatus === 'verifying' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px] z-40 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* -- LEFT DOOR --
          Overflow:hidden clips the card at the door's right edge (= screen center).
          Card is positioned so its center lands exactly at the screen center:
            right = -(card_width/2) -> card center = door_right_edge = 50vw.
          The door shows only the LEFT HALF of the card.
      */}
      <motion.div
        animate={isAnimating ? { x: '-100%' } : { x: 0 }}
        transition={{ duration: 1.05, ease: [0.76, 0, 0.24, 1] }}
        onClick={() => {
          if (!isAnimating && !isModalOpen) {
            setIsModalOpen(true);
          }
        }}
        style={{
          position: 'absolute',
          top: 0, bottom: 0, left: 0,
          width: '50%',
          overflow: 'hidden',
          cursor: (!isAnimating && !isModalOpen) ? 'pointer' : 'default',
        }}
      >
        <div style={{
          position: 'absolute',
          right: 'calc(-1 * var(--card-w) / 2)',
          top: '50%',
          marginTop: 'calc(-1 * var(--card-h) / 2)',
          boxShadow: '-15px 20px 45px rgba(27, 45, 37, 0.15)',
          borderRadius: 14,
        }}>
          <CardInner />
        </div>
      </motion.div>

      {/* -- RIGHT DOOR --
          Same logic: left = -(card_width/2) so card center = door_left_edge = 50vw.
          The door shows only the RIGHT HALF of the card.
      */}
      <motion.div
        animate={isAnimating ? { x: '100%' } : { x: 0 }}
        transition={{ duration: 1.05, ease: [0.76, 0, 0.24, 1] }}
        onClick={() => {
          if (!isAnimating && !isModalOpen) {
            setIsModalOpen(true);
          }
        }}
        style={{
          position: 'absolute',
          top: 0, bottom: 0, right: 0,
          width: '50%',
          overflow: 'hidden',
          cursor: (!isAnimating && !isModalOpen) ? 'pointer' : 'default',
        }}
      >
        <div style={{
          position: 'absolute',
          left: 'calc(-1 * var(--card-w) / 2)',
          top: '50%',
          marginTop: 'calc(-1 * var(--card-h) / 2)',
          boxShadow: '15px 20px 45px rgba(27, 45, 37, 0.15)',
          borderRadius: 14,
        }}>
          <CardInner />
        </div>
      </motion.div>

      {/* Floating helper button to guide the user */}
      {!isAnimating && !isModalOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40"
        >
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-3.5 bg-brand-sage hover:bg-brand-sage/95 border border-brand-gold/45 text-white text-[10px] tracking-[0.25em] font-black uppercase rounded-full shadow-[0_10px_30px_rgba(27,77,62,0.3)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
          >
            Abrir invitación
          </button>
        </motion.div>
      )}

      {/* Name Input to Open Modal */}
      <AnimatePresence>
        {isModalOpen && !isAnimating && (
          <div className="absolute inset-0 z-50 flex items-center justify-center px-4 bg-black/45 backdrop-blur-[2px]">
            {/* Click outside to close */}
            <div
              className="absolute inset-0"
              onClick={() => {
                if (validationStatus !== 'verifying') {
                  closeModal();
                }
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-[310px] bg-brand-sage/95 backdrop-blur-xl border border-brand-gold/25 rounded-[2rem] p-5 shadow-2xl z-10 flex flex-col items-center gap-4 text-center"
            >
              {/* Close Button */}
              {validationStatus !== 'verifying' && (
                <button
                  type="button"
                  onClick={closeModal}
                  className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              )}

              <form onSubmit={handleOpenClick} className="w-full flex flex-col items-center gap-4">
                <AnimatePresence>
                  {validationStatus === 'verifying' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.8 }}
                      animate={{ opacity: 1, height: 140, scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      className="flex justify-center items-end h-[140px] w-full overflow-hidden mb-2 relative"
                    >
                      <style>{`
                        @keyframes ball-shoot {
                          0% {
                            left: 18%;
                            bottom: 18px;
                            transform: rotate(0deg) scale(0.85, 1.25);
                          }
                          5% {
                            transform: rotate(36deg) scale(1, 1);
                          }
                          17.5% {
                            bottom: 80px;
                            transform: rotate(126deg) scale(1.2);
                          }
                          35% {
                            left: 70%;
                            bottom: 55px;
                            transform: rotate(252deg) scale(0.85, 1.25);
                          }
                          40% {
                            left: 62%;
                            bottom: 42px;
                            transform: rotate(288deg) scale(1.1, 0.9);
                          }
                          55% {
                            left: 44%;
                            bottom: 32px;
                            transform: rotate(396deg) scale(1.05);
                          }
                          70% {
                            left: 22%;
                            bottom: 12px;
                            transform: rotate(504deg) scale(0.9, 1.1);
                          }
                          85%, 100% {
                            left: 18%;
                            bottom: 18px;
                            transform: rotate(612deg) scale(1, 1);
                          }
                        }
                        @keyframes shadow-shoot {
                          0% {
                            left: 18%;
                            transform: scale(0.5);
                            opacity: 0.65;
                          }
                          17.5% {
                            transform: scale(1.1);
                            opacity: 0.15;
                          }
                          35% {
                            left: 70%;
                            transform: scale(0.7);
                            opacity: 0.5;
                          }
                          55% {
                            transform: scale(1.0);
                            opacity: 0.25;
                          }
                          70% {
                            left: 22%;
                            transform: scale(0.4);
                            opacity: 0.75;
                          }
                          85%, 100% {
                            left: 18%;
                            transform: scale(0.5);
                            opacity: 0.65;
                          }
                        }
                        @keyframes woman-kick {
                          0%, 100% {
                            transform: rotate(35deg);
                          }
                          5% {
                            transform: rotate(15deg);
                          }
                          15%, 85% {
                            transform: rotate(0deg);
                          }
                          92% {
                            transform: rotate(-25deg);
                          }
                        }
                        @keyframes woman-body {
                          0%, 100% {
                            transform: rotate(6deg) translateY(1.5px);
                          }
                          15%, 85% {
                            transform: rotate(0deg) translateY(0);
                          }
                          92% {
                            transform: rotate(-3deg) translateY(-1px);
                          }
                        }
                        @keyframes man-save {
                          0%, 15%, 70%, 100% {
                            transform: translate(0, 0) rotate(0deg);
                          }
                          20% {
                            transform: translate(-3px, 2px) rotate(-3deg);
                          }
                          35% {
                            transform: translate(8px, -12px) rotate(15deg);
                          }
                          40% {
                            transform: translate(9px, -10px) rotate(10deg);
                          }
                          55% {
                            transform: translate(3px, 2px) rotate(0deg);
                          }
                        }
                        @keyframes impact-left {
                          0%, 100% {
                            transform: scale(1.4);
                            opacity: 0.8;
                          }
                          15%, 85% {
                            transform: scale(0);
                            opacity: 0;
                          }
                        }
                        @keyframes impact-right {
                          0%, 25%, 45%, 100% {
                            transform: scale(0);
                            opacity: 0;
                          }
                          35% {
                            transform: scale(1.4);
                            opacity: 0.8;
                          }
                        }
                        @keyframes grass-left {
                          0%, 100% {
                            transform: translate(0, 0) scale(0);
                            opacity: 0;
                          }
                          1%, 10% {
                            transform: translate(-12px, -18px) rotate(45deg) scale(1.2);
                            opacity: 0.95;
                          }
                          30% {
                            transform: translate(-24px, 8px) rotate(120deg) scale(0.6);
                            opacity: 0;
                          }
                        }
                        @keyframes spin-bounce {
                          0%, 100% {
                            transform: translateY(0) rotate(0deg);
                          }
                          50% {
                            transform: translateY(-6px) rotate(180deg);
                          }
                        }
                        .animate-ball-shoot {
                          animation: ball-shoot 2.0s infinite ease-in-out;
                        }
                        .animate-shadow-shoot {
                          animation: shadow-shoot 2.0s infinite ease-in-out;
                        }
                        .animate-woman-kick {
                          animation: woman-kick 2.0s infinite ease-in-out;
                          transform-origin: 29px 58px;
                        }
                        .animate-woman-body {
                          animation: woman-body 2.0s infinite ease-in-out;
                          transform-origin: 25px 52px;
                        }
                        .animate-man-save {
                          animation: man-save 2.0s infinite ease-in-out;
                          transform-origin: 35px 74px;
                        }
                        .animate-impact-left {
                          animation: impact-left 2.0s infinite ease-out;
                        }
                        .animate-impact-right {
                          animation: impact-right 2.0s infinite ease-out;
                        }
                        .animate-grass-left {
                          animation: grass-left 2.0s infinite ease-out;
                        }
                        .animate-spin-bounce {
                          animation: spin-bounce 0.8s infinite ease-in-out;
                        }
                      `}</style>

                      {/* 3D Soccer Pitch Floor */}
                      <div
                        className="absolute bottom-2 inset-x-4 h-10 rounded-2xl border border-white/10 bg-gradient-to-t from-emerald-950 via-emerald-800 to-green-700 shadow-2xl z-0"
                        style={{
                          transform: 'perspective(250px) rotateX(50deg)',
                          transformOrigin: 'bottom',
                          boxShadow: '0 20px 40px rgba(10,30,22,0.6), inset 0 2px 8px rgba(255,255,255,0.2)'
                        }}
                      >
                        {/* Perspective field markings */}
                        <div className="absolute inset-x-3 bottom-1.5 h-[2px] bg-white/40" />
                        <div className="absolute inset-x-6 bottom-4.5 h-[1.5px] bg-white/20" />
                        <div className="absolute inset-x-9 bottom-7 h-[1px] bg-white/15" />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[2px] h-full bg-white/30" />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-2 w-8 h-8 rounded-full border border-white/25" />
                        <div className="absolute left-3 bottom-0 w-6 h-5 border-t border-r border-white/25" />
                        <div className="absolute right-3 bottom-0 w-6 h-5 border-t border-l border-white/25" />
                      </div>

                      {/* 3D Goalpost (Arco de fútbol) behind Juan */}
                      <div className="absolute right-1 bottom-1 w-20 h-20 pointer-events-none z-0">
                        <svg viewBox="0 0 80 80" className="w-full h-full opacity-80">
                          <defs>
                            <linearGradient id="post-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#ffffff" />
                              <stop offset="60%" stopColor="#e1e1e1" />
                              <stop offset="100%" stopColor="#9a9a9a" />
                            </linearGradient>
                          </defs>
                          {/* Net supporting frames */}
                          <path d="M 15,22 L 30,35 L 30,78" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                          <path d="M 65,22 L 80,35 L 80,78" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                          <path d="M 30,35 L 80,35" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

                          {/* Net mesh diagonal lines */}
                          <path d="M 15,22 L 30,35 M 15,35 L 30,48 M 15,48 L 30,61 M 15,61 L 30,74 M 65,22 L 80,35 M 65,35 L 80,48 M 65,48 L 80,61 M 65,61 L 80,74" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />

                          {/* Back Net grid lines */}
                          <line x1="30" y1="42" x2="80" y2="42" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" />
                          <line x1="30" y1="52" x2="80" y2="52" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" />
                          <line x1="30" y1="62" x2="80" y2="62" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" />
                          <line x1="30" y1="72" x2="80" y2="72" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" />
                          <line x1="40" y1="35" x2="40" y2="78" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6" />
                          <line x1="50" y1="35" x2="50" y2="78" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6" />
                          <line x1="60" y1="35" x2="60" y2="78" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6" />
                          <line x1="70" y1="35" x2="70" y2="78" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6" />

                          {/* Front Goal Frame (Posts & Crossbar) */}
                          <path d="M 15,78 L 15,22 L 65,22 L 65,78" fill="none" stroke="url(#post-grad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          {/* Goal line white mark */}
                          <line x1="10" y1="78" x2="70" y2="78" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                        </svg>
                      </div>

                      <div className="relative w-full max-w-[240px] h-28 flex items-end justify-between select-none pb-1 px-1 z-10">

                        {/* Left Player (Woman / Vale) */}
                        <div className="relative z-10 w-14 h-24">
                          <svg viewBox="0 0 60 100" className="w-14 h-24 filter drop-shadow-md">
                            <defs>
                              <radialGradient id="3d-skin-vale" cx="35%" cy="30%" r="65%">
                                <stop offset="0%" stopColor="#fff5f0" />
                                <stop offset="50%" stopColor="#fdd1be" />
                                <stop offset="100%" stopColor="#e09d82" />
                              </radialGradient>
                              <linearGradient id="3d-hair-vale" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#7c533c" />
                                <stop offset="40%" stopColor="#4d2c18" />
                                <stop offset="100%" stopColor="#211005" />
                              </linearGradient>
                              <linearGradient id="3d-jersey-yellow" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ffe640" />
                                <stop offset="30%" stopColor="#ffd116" />
                                <stop offset="70%" stopColor="#e6b400" />
                                <stop offset="100%" stopColor="#b38600" />
                              </linearGradient>
                              <linearGradient id="3d-dress-white" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="35%" stopColor="#f7f6f2" />
                                <stop offset="75%" stopColor="#dedcd3" />
                                <stop offset="100%" stopColor="#c4c1b4" />
                              </linearGradient>
                              <linearGradient id="veil-grad" x1="100%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                                <stop offset="60%" stopColor="rgba(255,255,255,0.5)" />
                                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                              </linearGradient>
                              <linearGradient id="3d-socks-white" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="40%" stopColor="#f5f5f5" />
                                <stop offset="80%" stopColor="#d9d9d9" />
                                <stop offset="100%" stopColor="#b3b3b3" />
                              </linearGradient>
                              <linearGradient id="3d-cleats-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#fff5cc" />
                                <stop offset="30%" stopColor="#e6c229" />
                                <stop offset="70%" stopColor="#b89114" />
                                <stop offset="100%" stopColor="#7a5c05" />
                              </linearGradient>
                            </defs>

                            {/* Ponytail Back (layered behind body) */}
                            <path d="M 18,14 C 13,11 7,16 5,23 C 4,28 8,32 12,28 C 15,25 18,20 18,14 Z" fill="url(#3d-hair-vale)" stroke="#1b4d3e" strokeWidth="0.8" />

                            {/* Flowing Bride Veil */}
                            <path d="M 12,14 Q 3,18 0,35 Q 5,38 10,24" fill="url(#veil-grad)" stroke="#ffffff" strokeWidth="0.4" opacity="0.85" />
                            <path d="M 17,13 C 16,11 19,11 18,13 Z" fill="url(#3d-cleats-gold)" />

                            {/* Left Leg (Standing, emerges from dress) */}
                            <path d="M 20,70 L 21,90 C 21,90 23,90 23.5,88 L 22,70 Z" fill="url(#3d-socks-white)" stroke="#1b4d3e" strokeWidth="0.8" />
                            {/* Sock bands */}
                            <path d="M 19.8,77 L 22.8,77" stroke="#fcd116" strokeWidth="1.2" />
                            <path d="M 20.0,79 L 23.0,79" stroke="#003893" strokeWidth="1" />
                            {/* Cleat */}
                            <path d="M 21,90 C 21,90 17,92 16,95 C 15,97 18,98 23,98 C 24,97 24,94 23,90 Z" fill="url(#3d-cleats-gold)" stroke="#1b4d3e" strokeWidth="0.8" />
                            <path d="M 15.8,96.5 L 23.2,96.5" stroke="#121212" strokeWidth="1.2" strokeLinecap="round" />
                            <line x1="17" y1="97" x2="17" y2="99" stroke="#c5a059" strokeWidth="1.2" />
                            <line x1="21" y1="97" x2="21" y2="99" stroke="#c5a059" strokeWidth="1.2" />

                            {/* Kicking Leg (Right) - Animated */}
                            <g className="animate-woman-kick">
                              <path d="M 27,60 L 31,74 C 32,74 33,73 31,60 Z" fill="url(#3d-skin-vale)" stroke="#1b4d3e" strokeWidth="0.8" />
                              <circle cx="31" cy="74" r="2.5" fill="url(#3d-skin-vale)" />
                              <path d="M 29.5,74 L 33,88 C 34.5,88 35.5,86 32.5,74 Z" fill="url(#3d-socks-white)" stroke="#1b4d3e" strokeWidth="0.8" />
                              <path d="M 30.2,77 L 33.2,77" stroke="#fcd116" strokeWidth="1.2" />
                              <path d="M 30.6,79 L 33.6,79" stroke="#003893" strokeWidth="1" />
                              <path d="M 33,88 C 33,88 34,94 37,95 C 39,96 39,93 36,89 Z" fill="url(#3d-cleats-gold)" stroke="#1b4d3e" strokeWidth="0.8" />
                              <path d="M 32.8,93.5 L 37.2,94.5" stroke="#121212" strokeWidth="1.2" strokeLinecap="round" />
                              <line x1="35" y1="94" x2="36" y2="96" stroke="#c5a059" strokeWidth="1.2" />
                              <line x1="38" y1="93" x2="39" y2="95" stroke="#c5a059" strokeWidth="1.2" />
                            </g>

                            {/* Body group (reactive animation) */}
                            <g className="animate-woman-body">
                              {/* Torso & Jersey */}
                              <path d="M 18,30 C 18,30 25,28 32,30 L 33,52 C 33,52 26,55 17,52 Z" fill="url(#3d-jersey-yellow)" stroke="#1b4d3e" strokeWidth="1" />
                              {/* Jersey details */}
                              <path d="M 19,30 C 19,30 25,36 32,38 L 32.5,44 C 32.5,44 25,42 17.5,36 Z" fill="#003893" />
                              <path d="M 19.5,33 C 19.5,33 25,38 32,40 L 32.5,42 C 32.5,42 25,40 17.8,35 Z" fill="#ce1126" />

                              {/* Head & Face (Profile facing right) */}
                              <rect x="22" y="23" width="5" height="7" rx="2" fill="url(#3d-skin-vale)" stroke="#1b4d3e" strokeWidth="0.8" />
                              <path d="M 18,18 C 18,11 25,9 31,11 C 33.5,11.8 35.5,13.5 35.5,16.5 C 35.5,17.2 36.8,17.8 36.5,18.5 C 36.2,19.2 34.8,19.5 34.8,20.2 C 34.8,21.2 33,22.2 31.5,23.2 C 29,24.8 25,25 22,24 C 19,23 18,21 18,18 Z" fill="url(#3d-skin-vale)" stroke="#1b4d3e" strokeWidth="1" />
                              {/* Face details */}
                              <path d="M 18.5,14 C 18.5,10 25,8 33,13 C 33,16 31,17 25,17 C 19,17 18.5,16 18.5,14 Z" fill="url(#3d-hair-vale)" stroke="#1b4d3e" strokeWidth="0.5" />
                              <circle cx="31" cy="16" r="1" fill="#121212" /> {/* Eye */}
                              <path d="M 31.5,19 Q 32.5,20.5 31.5,21" fill="none" stroke="#ce1126" strokeWidth="0.8" strokeLinecap="round" /> {/* Mouth */}

                              {/* Left Arm (Background) */}
                              <path d="M 15,31 C 12,33 10,40 13,44 L 15,43" fill="url(#3d-jersey-yellow)" stroke="#1b4d3e" strokeWidth="0.8" />
                              <circle cx="13" cy="46" r="3" fill="url(#3d-skin-vale)" stroke="#1b4d3e" strokeWidth="0.8" />

                              {/* Right Arm (Foreground) */}
                              <path d="M 29,31 Q 38,32 40,41 Q 38,45 35,45 Q 33,40 29,33 Z" fill="url(#3d-jersey-yellow)" stroke="#1b4d3e" strokeWidth="0.8" />
                              <path d="M 40,41 L 43,51 Q 44,53 41,53 L 37,45 Z" fill="url(#3d-skin-vale)" stroke="#1b4d3e" strokeWidth="0.8" />
                              <circle cx="42" cy="54" r="3.5" fill="url(#3d-skin-vale)" stroke="#1b4d3e" strokeWidth="0.8" />
                            </g>

                            {/* Puffed White Wedding Dress Skirt (layered over legs) */}
                            <path d="M 16,50 C 11,58 5,72 3,82 C 14,85 26,85 35,82 C 34,68 31,56 25,50 Z" fill="url(#3d-dress-white)" stroke="#1b4d3e" strokeWidth="0.8" />
                            {/* Dress folds details */}
                            <path d="M 11,57 Q 7,70 5,81" fill="none" stroke="#dedcd3" strokeWidth="0.8" />
                            <path d="M 19,53 Q 18,68 19,83" fill="none" stroke="#dedcd3" strokeWidth="0.8" />
                            <path d="M 28,52 Q 28,69 31,81" fill="none" stroke="#dedcd3" strokeWidth="0.8" />
                          </svg>
                        </div>

                        {/* Right Player (Man / Juan / Goalkeeper) */}
                        <div className="relative z-10 w-14 h-24">
                          <svg viewBox="0 0 60 100" className="w-14 h-24 filter drop-shadow-md animate-man-save">
                            <defs>
                              <radialGradient id="3d-skin-juan" cx="35%" cy="30%" r="65%">
                                <stop offset="0%" stopColor="#b5856b" />
                                <stop offset="50%" stopColor="#7c543e" />
                                <stop offset="100%" stopColor="#4f2f1e" />
                              </radialGradient>
                              <linearGradient id="3d-hair-juan" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#4a3b32" />
                                <stop offset="50%" stopColor="#2d1f18" />
                                <stop offset="100%" stopColor="#120a05" />
                              </linearGradient>
                              <linearGradient id="3d-suit-black" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3a3a3a" />
                                <stop offset="40%" stopColor="#222222" />
                                <stop offset="80%" stopColor="#121212" />
                                <stop offset="100%" stopColor="#050505" />
                              </linearGradient>
                            </defs>

                            {/* Left Leg (Goalkeeper Stance - Long Suit Pants) */}
                            <path d="M 28,52 L 23,76 L 27,76 L 32,52 Z" fill="url(#3d-suit-black)" stroke="#121212" strokeWidth="0.8" />
                            <path d="M 23,76 L 20,90 L 25,90 L 27,76 Z" fill="url(#3d-suit-black)" stroke="#121212" strokeWidth="0.8" />
                            {/* Left Shoe (Formal Black Leather) */}
                            <path d="M 20,90 C 20,90 16,92 15,95 C 14,97 17,98 22,98 C 23,97 25,94 25,90 Z" fill="#121212" stroke="#000000" strokeWidth="0.8" />
                            <path d="M 14.8,96.5 L 22.2,96.5" stroke="#3a3a3a" strokeWidth="1.2" />

                            {/* Right Leg (Goalkeeper Stance - Standing/Knee bent) */}
                            <path d="M 37,52 L 39,76 L 43,76 L 42,52 Z" fill="url(#3d-suit-black)" stroke="#121212" strokeWidth="0.8" />
                            <path d="M 39,76 L 41,90 C 41,90 43,90 43.5,88 L 43,76 Z" fill="url(#3d-suit-black)" stroke="#121212" strokeWidth="0.8" />
                            {/* Right Shoe (Formal Black Leather) */}
                            <path d="M 41,90 C 41,90 37,92 36,95 C 35,97 38,98 43,98 C 44,97 44,94 43,90 Z" fill="#121212" stroke="#000000" strokeWidth="0.8" />
                            <path d="M 35.8,96.5 L 43.2,96.5" stroke="#3a3a3a" strokeWidth="1.2" />

                            {/* Body group (reactive animation) */}
                            <g className="animate-man-body">
                              {/* Colombia Jersey visible in the center */}
                              <path d="M 28,30 C 28,30 35,28 42,30 L 43,52 L 27,52 Z" fill="url(#3d-jersey-yellow)" stroke="#1b4d3e" strokeWidth="1" />
                              <path d="M 29,30 C 29,30 35,36 41,38 L 41.5,44 C 41.5,44 35,42 28.5,36 Z" fill="#003893" />
                              <path d="M 29.5,33 C 29.5,33 35,38 41,40 L 41.5,42 C 41.5,42 35,40 28.8,35 Z" fill="#ce1126" />

                              {/* Bowtie on the collar */}
                              <path d="M 32.5,29 L 37.5,31 L 37.5,29 L 32.5,31 Z" fill="#121212" />
                              <circle cx="35" cy="30" r="1.5" fill="#121212" />

                              {/* Open Suit Jacket Lapels */}
                              <path d="M 28,30 L 33,45 L 27,52 L 27,30 Z" fill="url(#3d-suit-black)" stroke="#121212" strokeWidth="0.8" />
                              <path d="M 42,30 L 37,45 L 43,52 L 43,30 Z" fill="url(#3d-suit-black)" stroke="#121212" strokeWidth="0.8" />

                              {/* Head & Face (Profile facing left) */}
                              <rect x="33" y="23" width="5" height="7" rx="2" fill="url(#3d-skin-juan)" stroke="#1b4d3e" strokeWidth="0.8" />
                              <path d="M 42,18 C 42,11 35,9 29,11 C 26.5,11.8 24.5,13.5 24.5,16.5 C 24.5,17.2 23.2,17.8 23.5,18.5 C 23.8,19.2 25.2,19.5 25.2,20.2 C 25.2,21.2 27,22.2 28.5,23.2 C 31,24.8 35,25 38,24 C 41,23 42,21 42,18 Z" fill="url(#3d-skin-juan)" stroke="#1b4d3e" strokeWidth="1" />

                              {/* Hair details (Curly/Crespo) */}
                              <path d="M 29,11 Q 29.5,8.5 31.5,9 Q 33,7.5 35,8.5 Q 36.5,7 38.5,8.5 Q 40.5,8 42,10.5 Q 43,12 42,14.5 Q 40,16.5 38.5,17 C 36,17 34,18 31,17 C 28.5,17 26.5,15 29,11 Z" fill="url(#3d-hair-juan)" stroke="#1b4d3e" strokeWidth="0.5" />
                              <path d="M 38,17 C 38,21 35,23 32,23 C 29,23 27,21 27,17" stroke="url(#3d-hair-juan)" strokeWidth="2.5" fill="none" strokeLinecap="round" />

                              {/* Curly texture overlays */}
                              <path d="M 30.5,11 A 1.2,1.2 0 1,0 32,12.5" fill="none" stroke="#120a05" strokeWidth="0.7" strokeLinecap="round" />
                              <path d="M 33.5,10.5 A 1.2,1.2 0 1,0 35,12" fill="none" stroke="#120a05" strokeWidth="0.7" strokeLinecap="round" />
                              <path d="M 36.5,10 A 1.2,1.2 0 1,0 38,12" fill="none" stroke="#120a05" strokeWidth="0.7" strokeLinecap="round" />
                              <path d="M 39.5,11 A 1.2,1.2 0 1,0 41,13" fill="none" stroke="#120a05" strokeWidth="0.7" strokeLinecap="round" />
                              <path d="M 32,13.5 A 1.2,1.2 0 1,0 33.5,15" fill="none" stroke="#120a05" strokeWidth="0.7" strokeLinecap="round" />
                              <path d="M 35,13.5 A 1.2,1.2 0 1,0 36.5,15" fill="none" stroke="#120a05" strokeWidth="0.7" strokeLinecap="round" />
                              <path d="M 38,13.5 A 1.2,1.2 0 1,0 39.5,15.5" fill="none" stroke="#120a05" strokeWidth="0.7" strokeLinecap="round" />
                              <circle cx="29" cy="16" r="1" fill="#121212" /> {/* Eye */}
                              <path d="M 28.5,19 Q 27.5,20.5 28.5,21" fill="none" stroke="#ce1126" strokeWidth="0.8" strokeLinecap="round" /> {/* Mouth */}

                              {/* Left Arm (Foreground - extended goalkeeper gloves) */}
                              <path d="M 31,31 Q 22,32 20,41 Q 22,45 25,45 Q 27,40 31,33 Z" fill="url(#3d-suit-black)" stroke="#121212" strokeWidth="0.8" />
                              {/* White Goalie Glove */}
                              <circle cx="15" cy="43" r="4" fill="#ffffff" stroke="#121212" strokeWidth="0.8" />
                              <path d="M 12,41 L 15,45" stroke="#003893" strokeWidth="1" />

                              {/* Right Arm (Background - extended goalie gloves) */}
                              <path d="M 42,31 Q 53,32 56,41 Q 53,45 50,45 Q 47,40 42,33 Z" fill="url(#3d-suit-black)" stroke="#121212" strokeWidth="0.8" />
                              {/* White Goalie Glove */}
                              <circle cx="58" cy="43" r="4" fill="#ffffff" stroke="#121212" strokeWidth="0.8" />
                              <path d="M 61,41 L 58,45" stroke="#003893" strokeWidth="1" />
                            </g>

                            {/* Suit Pants center details */}
                            <path d="M 27,52 L 35,55 L 43,52 L 42,60 L 32,60 Z" fill="url(#3d-suit-black)" stroke="#121212" strokeWidth="0.8" />
                          </svg>
                        </div>

                        {/* Left Impact Ring (Vale's shot) */}
                        <div
                          className="absolute w-8 h-8 rounded-full border-2 border-brand-gold bg-brand-gold/25 animate-impact-left z-0 pointer-events-none"
                          style={{ left: "calc(18% - 12px)", bottom: 18 }}
                        />

                        {/* Right Impact Ring (Juan's save) */}
                        <div
                          className="absolute w-8 h-8 rounded-full border-2 border-brand-gold bg-brand-gold/25 animate-impact-right z-0 pointer-events-none"
                          style={{ left: "calc(70% - 12px)", bottom: 64 }}
                        />

                        {/* Grass kick-up particles on kick */}
                        <svg viewBox="0 0 10 10" className="absolute w-4 h-4 animate-grass-left pointer-events-none z-10" style={{ left: '16%', bottom: '26px' }}>
                          <path d="M 5,10 Q 1,3 3,0 Q 6,3 5,10 Z" fill="#a7f3d0" />
                          <path d="M 5,10 Q 9,5 8,2 Q 6,6 5,10 Z" fill="#34d399" />
                        </svg>

                        {/* 3D Ball Drop Shadow on the pitch */}
                        <div
                          className="absolute bottom-1 w-7 h-1.5 rounded-full bg-black/40 blur-[1px] animate-shadow-shoot z-0"
                        />

                        {/* 3D Soccer Ball */}
                        <div className="absolute animate-ball-shoot z-20">
                          <svg viewBox="0 0 32 32" className="w-7 h-7 filter drop-shadow-lg">
                            <defs>
                              <radialGradient id="ball-base" cx="35%" cy="35%" r="65%">
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="60%" stopColor="#eae5dd" />
                                <stop offset="90%" stopColor="#b8ae9c" />
                                <stop offset="100%" stopColor="#8c7f6b" />
                              </radialGradient>
                              <radialGradient id="ball-gloss" cx="30%" cy="30%" r="50%">
                                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.85)" />
                                <stop offset="40%" stopColor="rgba(255, 255, 255, 0.3)" />
                                <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                              </radialGradient>
                            </defs>

                            {/* Ball Sphere Base */}
                            <circle cx="16" cy="16" r="15" fill="url(#ball-base)" stroke="#1b4d3e" strokeWidth="1.2" />

                            {/* Pentagon panels warped in 3D perspective */}
                            <path d="M 16,11 L 20.5,14 L 19,19 L 13,19 L 11.5,14 Z" fill="#1b4d3e" opacity="0.95" stroke="#1b4d3e" strokeWidth="0.5" strokeLinejoin="round" />

                            {/* Curved seam lines projecting out to outer edge */}
                            <path d="M 16,11 Q 16,6 16,1" fill="none" stroke="#1b4d3e" strokeWidth="1.2" />
                            <path d="M 20.5,14 Q 25,12.5 29.5,11" fill="none" stroke="#1b4d3e" strokeWidth="1.2" />
                            <path d="M 19,19 Q 22,23.5 25,28" fill="none" stroke="#1b4d3e" strokeWidth="1.2" />
                            <path d="M 13,19 Q 10,23.5 7,28" fill="none" stroke="#1b4d3e" strokeWidth="1.2" />
                            <path d="M 11.5,14 Q 7,12.5 2.5,11" fill="none" stroke="#1b4d3e" strokeWidth="1.2" />

                            {/* Outer seam lines defining adjacent patches */}
                            <path d="M 16,1 Q 23,2.5 29.5,11" fill="none" stroke="#1b4d3e" strokeWidth="0.8" opacity="0.75" />
                            <path d="M 29.5,11 Q 28.5,20.5 25,28" fill="none" stroke="#1b4d3e" strokeWidth="0.8" opacity="0.75" />
                            <path d="M 25,28 Q 16,29.5 7,28" fill="none" stroke="#1b4d3e" strokeWidth="0.8" opacity="0.75" />
                            <path d="M 7,28 Q 3.5,20.5 2.5,11" fill="none" stroke="#1b4d3e" strokeWidth="0.8" opacity="0.75" />
                            <path d="M 2.5,11 Q 9,2.5 16,1" fill="none" stroke="#1b4d3e" strokeWidth="0.8" opacity="0.75" />

                            {/* Shadowed sections at the edge patches */}
                            <path d="M 16,1 L 13.5,4.5 L 16.5,7 L 19.5,4.5 Z" fill="#1b4d3e" opacity="0.7" />
                            <path d="M 29.5,11 L 26,10 L 24,13 L 26.5,15.5 Z" fill="#1b4d3e" opacity="0.7" />
                            <path d="M 25,28 L 22,25.5 L 18,26.5 L 18.5,29.5 Z" fill="#1b4d3e" opacity="0.7" />
                            <path d="M 7,28 L 10,25.5 L 14,26.5 L 13.5,29.5 Z" fill="#1b4d3e" opacity="0.7" />
                            <path d="M 2.5,11 L 6,10 L 8,13 L 5.5,15.5 Z" fill="#1b4d3e" opacity="0.7" />

                            {/* Glossy Overlay Highlight */}
                            <circle cx="16" cy="16" r="15" fill="url(#ball-gloss)" stroke="none" pointerEvents="none" />
                          </svg>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {matchedGuests.length > 0 ? (
                    <motion.div
                      key="selector"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="w-full flex flex-col gap-2"
                    >
                      <div className="text-center mb-1">
                        <p className="text-brand-cream/90 text-xs font-medium">Encontramos varios invitados con ese nombre.</p>
                        <p className="text-brand-gold text-[10px] tracking-wider uppercase font-black mt-1">¿Quién eres tú?</p>
                      </div>

                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 hide-scrollbar w-full">
                        {matchedGuests.map((guest) => (
                          <button
                            key={guest}
                            type="button"
                            onClick={() => proceedWithGuest(guest)}
                            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-gold/40 text-brand-cream font-serif italic text-sm py-3 px-4 rounded-xl text-center transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                          >
                            {guest}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setMatchedGuests([]);
                          setLocalName('');
                          setValidationStatus('idle');
                        }}
                        className="text-[10px] text-brand-gold/80 hover:text-brand-gold hover:underline cursor-pointer mt-2 text-center tracking-wider font-bold uppercase"
                      >
                        Volver a buscar
                      </button>
                    </motion.div>

                  ) : (
                    <motion.div
                      key="input-fields"
                      initial={{ opacity: 0, y: -15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="w-full flex flex-col items-center gap-3.5"
                    >
                      <input
                        type="text"
                        placeholder="Ingresa tu nombre para abrir..."
                        value={localName}
                        onChange={(e) => { setLocalName(e.target.value); setValidationStatus('idle'); setErrorMsg(''); }}
                        disabled={validationStatus === 'verifying' || validationStatus === 'success'}
                        className="w-full bg-black/40 backdrop-blur-md border border-white/20 text-white placeholder-white/50 px-5 py-3.5 rounded-full text-center text-xs font-medium focus:outline-none focus:ring-2 focus:ring-white/40 transition-all shadow-xl disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={!localName.trim() || validationStatus === 'verifying' || validationStatus === 'success'}
                        className={`px-6 py-2.5 text-white rounded-full text-[9px] tracking-[0.2em] uppercase font-black transition-all shadow-lg flex items-center justify-center gap-2
                          ${validationStatus === 'success' ? 'bg-brand-gold border border-brand-gold' : 'bg-brand-sage hover:shadow-brand-sage/50 border border-transparent'}
                          ${(validationStatus === 'verifying' || validationStatus === 'success' || !localName.trim()) ? 'opacity-80 cursor-default' : 'hover:-translate-y-0.5'}
                        `}
                      >
                        {validationStatus === 'verifying' ? (
                          <>
                            <span
                              style={{ display: "inline-block", transformOrigin: "center" }}
                              className="text-xs leading-none drop-shadow-md animate-spin-bounce"
                            >
                              ⚽
                            </span>
                            Revisando el VAR...
                          </>
                        ) : validationStatus === 'success' ? (
                          '¡Convocado Oficial!'
                        ) : (
                          'Abrir Invitación'
                        )}
                      </button>

                      <AnimatePresence>
                        {validationStatus === 'error' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-white text-[9px] uppercase tracking-widest text-center font-bold bg-red-500/80 px-3 py-2 rounded-xl backdrop-blur-md shadow-2xl mt-1 border border-red-400/50 w-full"
                          >
                            {errorMsg}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Photo Carousel Component ---
const carouselImages = [
  "/images/carousel_1.jpg",
  "/images/carousel_2.jpg",
  "/images/carousel_3.jpg",
  "/images/carousel_4.jpg",
  "/images/carousel_5.jpg",
  "/images/carousel_6.jpg",
  "/images/carousel_7.jpg",
  "/images/carousel_8.jpg",
  "/images/carousel_9.jpg",
  "/images/carousel_10.jpg",
  "/images/carousel_11.jpg",
  "/images/carousel_12.jpg"
];

const PhotoCarousel = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % carouselImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % carouselImages.length);
  };

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  return (
    <section className="py-6 bg-transparent px-6 relative overflow-hidden">
      {/* Carousel Card Container (Phone size on PC, full responsive on mobile) */}
      <div className="relative w-full max-w-[340px] aspect-[5/7] rounded-[2rem] border border-brand-gold/25 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] mx-auto bg-white">
        
        {/* Top Torn Edge */}
        <div className="absolute top-0 left-0 w-full h-8 z-20 pointer-events-none">
          <img
            src="/images/torn-edge.png"
            className="w-full h-full object-cover"
            alt=""
            style={{ filter: 'brightness(0) saturate(100%) invert(98%) sepia(5%) saturate(302%) hue-rotate(346deg) brightness(101%) contrast(97%)' }}
          />
        </div>

        {/* Carousel Container */}
        <div className="absolute inset-0 z-0 w-full h-full bg-brand-charcoal">
          <AnimatePresence initial={false}>
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden"
            >
              {/* Blurred background copy */}
              <img
                src={carouselImages[index]}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-35 pointer-events-none brightness-75"
              />
              
              {/* Sharp, uncropped foreground image */}
              <img
                src={carouselImages[index]}
                alt="Moment"
                className="w-full h-full object-cover relative z-10 brightness-[0.9] contrast-[1.02]"
              />
              
              {/* Dark subtle overlay for depth */}
              <div className="absolute inset-0 bg-black/5 z-20 pointer-events-none" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Arrows */}
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-10 flex justify-between items-center pointer-events-none">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePrev}
            className="pointer-events-auto w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleNext}
            className="pointer-events-auto w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            <ChevronRight size={18} strokeWidth={1.5} />
          </motion.button>
        </div>

        {/* Indicators / Progress bar */}
        <div className="absolute bottom-8 left-0 right-0 z-10 flex justify-center gap-1.5 pointer-events-none">
          {carouselImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setIndex(idx)}
              className={`pointer-events-auto w-1.5 h-1.5 rounded-full transition-all duration-500 cursor-pointer ${idx === index ? 'bg-white scale-125 w-4' : 'bg-white/40'
                }`}
            />
          ))}
        </div>

        {/* Bottom Torn Edge */}
        <div className="absolute -bottom-1 left-0 w-full h-8 z-20 pointer-events-none rotate-180">
          <img
            src="/images/torn-edge.png"
            className="w-full h-full object-cover"
            alt=""
            style={{ filter: 'brightness(0) saturate(100%) invert(98%) sepia(5%) saturate(302%) hue-rotate(346deg) brightness(101%) contrast(97%)' }}
          />
        </div>
      </div>
    </section>
  );
};

// --- Dress Code Modal Component ---
const DressCodeModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-brand-charcoal/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={onClose}
        >
          {/* Close Button */}
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 z-[110]"
            onClick={onClose}
          >
            <X size={32} strokeWidth={1.5} />
          </motion.button>

          {/* Modal Card Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative max-w-[550px] w-full flex flex-col items-center gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-h-[75vh] aspect-[5/7] rounded-[2rem] md:rounded-[3rem] border border-brand-gold/30 overflow-hidden shadow-2xl bg-white">
              <img
                src="/images/codigo_vestimenta.png"
                alt="Código de Vestimenta Completo"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Pinterest Inspiration Link */}
            <motion.a
              href="https://pin.it/3yICblsqK"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white/95 backdrop-blur-sm text-brand-charcoal border border-brand-gold/20 shadow-lg hover:shadow-xl hover:bg-white hover:border-brand-gold/40 transition-all duration-300 group"
              onClick={(e) => e.stopPropagation()}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#E60023] flex-shrink-0" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
              </svg>
              <span className="text-[11px] tracking-[0.15em] uppercase font-bold">Inspiración en Pinterest</span>
              <ExternalLink size={14} className="text-brand-sage/50 group-hover:text-brand-sage transition-colors" />
            </motion.a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Main App ---

export default function App() {
  const [isRSVPOpen, setIsRSVPOpen] = useState(false);
  const [isSongOpen, setIsSongOpen] = useState(false);
  const [isDressCodeOpen, setIsDressCodeOpen] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [startMusic, setStartMusic] = useState(false);
  const [guestName, setGuestName] = useState('');
  const resolvedGuestName = getFamilyDisplayName(guestName);
  const isPluralInvitation = resolvedGuestName
    ? (resolvedGuestName.toLowerCase().includes(' y ') ||
       resolvedGuestName.toLowerCase().includes(' e ') ||
       resolvedGuestName.toLowerCase().includes('familia') ||
       resolvedGuestName.toLowerCase().includes('&'))
    : false;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const guestParam = urlParams.get('to') || urlParams.get('to ');
    if (guestParam) {
      setGuestName(guestParam.replace(/\+/g, ' '));
    }
  }, []);

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
    <div className="relative min-h-screen font-sans selection:bg-brand-sage/20 overflow-x-hidden">
      {/* Smooth fixed background for Safari on iOS / iPhone */}
      <div 
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/images/card_text_base.png")',
        }}
      />
      <AnimatePresence>
        {!isOpened && (
          <InvitationEnvelope
            onOpen={() => setIsOpened(true)}
            onStartMusic={() => setStartMusic(true)}
            guestName={guestName}
            onNameSubmit={(name) => setGuestName(name)}
          />
        )}
      </AnimatePresence>

      <Navbar />
      <ScrollProgressBar />
      <MusicPlayer autoPlayTrigger={startMusic} />

      <main>
        {/* Hero Welcome Section */}
        <Hero />

        {/* Invitation Message Section */}
        <motion.section
          variants={lineStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="py-12 px-6 max-w-[430px] mx-auto text-center space-y-4 relative z-10"
        >
          <motion.div variants={lineItem} className="flex items-center justify-center gap-3 opacity-30 text-brand-sage">
            <svg width="24" height="10" viewBox="0 0 24 10" fill="none" stroke="currentColor" strokeWidth="0.8">
              <path d="M0,5 C4,1 8,9 12,5 C16,1 20,9 24,5"/>
            </svg>
            <svg width="8" height="8" viewBox="0 0 8 8" className="text-brand-gold/60"><path d="M4 0 L5 3 L8 4 L5 5 L4 8 L3 5 L0 4 L3 3 Z" fill="currentColor"/></svg>
            <svg width="24" height="10" viewBox="0 0 24 10" fill="none" stroke="currentColor" strokeWidth="0.8" className="scale-x-[-1]">
              <path d="M0,5 C4,1 8,9 12,5 C16,1 20,9 24,5"/>
            </svg>
          </motion.div>

          <div className="space-y-4">
            {resolvedGuestName && (
              <motion.div variants={lineItem} className="space-y-1">
                <div style={{ perspective: 600 }}>
                  <SplitText
                    text={resolvedGuestName}
                    className="font-serif text-3xl text-brand-charcoal italic font-medium block"
                    staggerDelay={0.06}
                  />
                </div>
                <motion.div
                  className="w-12 h-[1px] bg-brand-gold/25 mx-auto mt-2"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  style={{ originX: 0.5 }}
                />
              </motion.div>
            )}
            <motion.p variants={lineItem} className="text-brand-charcoal/70 leading-relaxed font-light text-[15px] italic px-4">
              {isPluralInvitation
                ? "Nuestra historia da un nuevo paso y no imaginamos hacerlo sin ustedes. Los invitamos a celebrar nuestra boda y acompañarnos en uno de los días más felices de nuestras vidas."
                : "Nuestra historia da un nuevo paso y no imaginamos hacerlo sin ti. Te invitamos a celebrar nuestra boda y acompañarnos en uno de los días más felices de nuestras vidas."
              }
            </motion.p>
          </div>
        </motion.section>

        {/* Countdown Section — Botanical Edition */}
        <section className="pt-4 pb-16 bg-transparent relative text-center overflow-hidden">

          {/* Floating gold dust particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-brand-gold/25 pointer-events-none"
              style={{
                width: Math.random() * 6 + 3,
                height: Math.random() * 6 + 3,
                left: `${5 + i * 8}%`,
                top: `${10 + (i % 4) * 22}%`,
              }}
              animate={{ y: [0, -18, 0], opacity: [0.2, 0.7, 0.2] }}
              transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
            />
          ))}

          {/* Left botanical branch */}
          <div className="absolute left-0 top-0 h-full w-40 pointer-events-none opacity-[0.12] text-brand-sage hidden md:block">
            <svg viewBox="0 0 120 600" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-full h-full">
              <path d="M 60,600 C 55,480 40,400 50,300 C 60,200 45,120 55,0" strokeLinecap="round" />
              {/* Left leaves */}
              <path d="M 52,500 C 20,490 5,460 20,445 C 35,430 55,460 52,500 Z" fill="currentColor" opacity="0.6" />
              <path d="M 48,420 C 10,405 -5,370 15,355 C 35,340 52,380 48,420 Z" fill="currentColor" opacity="0.6" />
              <path d="M 54,340 C 15,325 5,290 28,278 C 50,266 58,310 54,340 Z" fill="currentColor" opacity="0.5" />
              <path d="M 50,260 C 18,245 8,210 32,200 C 56,190 55,235 50,260 Z" fill="currentColor" opacity="0.5" />
              <path d="M 56,180 C 22,165 14,130 40,122 C 66,114 60,160 56,180 Z" fill="currentColor" opacity="0.4" />
              <path d="M 52,100 C 24,86 18,52 44,46 C 70,40 58,80 52,100 Z" fill="currentColor" opacity="0.4" />
              {/* Right leaves */}
              <path d="M 56,470 C 90,452 106,420 90,408 C 74,396 55,435 56,470 Z" fill="currentColor" opacity="0.5" />
              <path d="M 53,390 C 85,372 100,340 84,328 C 68,316 52,357 53,390 Z" fill="currentColor" opacity="0.5" />
              <path d="M 57,310 C 88,294 102,260 86,250 C 70,240 55,278 57,310 Z" fill="currentColor" opacity="0.4" />
              <path d="M 52,230 C 82,212 96,180 80,170 C 64,160 50,200 52,230 Z" fill="currentColor" opacity="0.4" />
            </svg>
          </div>

          {/* Right botanical branch */}
          <div className="absolute right-0 top-0 h-full w-40 pointer-events-none opacity-[0.12] text-brand-sage hidden md:block">
            <svg viewBox="0 0 120 600" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-full h-full">
              <path d="M 60,600 C 65,480 80,400 70,300 C 60,200 75,120 65,0" strokeLinecap="round" />
              <path d="M 68,500 C 100,490 115,460 100,445 C 85,430 65,460 68,500 Z" fill="currentColor" opacity="0.6" />
              <path d="M 72,420 C 110,405 125,370 105,355 C 85,340 68,380 72,420 Z" fill="currentColor" opacity="0.6" />
              <path d="M 66,340 C 105,325 115,290 92,278 C 70,266 62,310 66,340 Z" fill="currentColor" opacity="0.5" />
              <path d="M 70,260 C 102,245 112,210 88,200 C 64,190 65,235 70,260 Z" fill="currentColor" opacity="0.5" />
              <path d="M 64,180 C 98,165 106,130 80,122 C 54,114 60,160 64,180 Z" fill="currentColor" opacity="0.4" />
              <path d="M 68,100 C 96,86 102,52 76,46 C 50,40 62,80 68,100 Z" fill="currentColor" opacity="0.4" />
              <path d="M 64,470 C 30,452 14,420 30,408 C 46,396 65,435 64,470 Z" fill="currentColor" opacity="0.5" />
              <path d="M 67,390 C 35,372 20,340 36,328 C 52,316 68,357 67,390 Z" fill="currentColor" opacity="0.5" />
              <path d="M 63,310 C 32,294 18,260 34,250 C 50,240 65,278 63,310 Z" fill="currentColor" opacity="0.4" />
            </svg>
          </div>

          {/* Top floral ornament removed to reduce vertical space */}

          <div className="max-w-sm mx-auto px-6 relative z-10">
            <Countdown />
          </div>

          {/* Bottom decorative wave */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
            <svg viewBox="0 0 1200 60" fill="none" className="w-full">
              <path d="M0,30 C200,60 400,0 600,30 C800,60 1000,0 1200,30 L1200,60 L0,60 Z" fill="rgba(197,160,89,0.04)" />
            </svg>
          </div>
        </section>

        {/* Transition Header Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="py-12 px-6 max-w-[430px] mx-auto text-center space-y-4 relative z-10"
        >
          <div className="flex items-center justify-center gap-3 opacity-30 text-brand-sage">
            <svg width="24" height="10" viewBox="0 0 24 10" fill="none" stroke="currentColor" strokeWidth="0.8">
              <path d="M0,5 C4,1 8,9 12,5 C16,1 20,9 24,5"/>
            </svg>
            <svg width="8" height="8" viewBox="0 0 8 8" className="text-brand-gold/60"><path d="M4 0 L5 3 L8 4 L5 5 L4 8 L3 5 L0 4 L3 3 Z" fill="currentColor"/></svg>
            <svg width="24" height="10" viewBox="0 0 24 10" fill="none" stroke="currentColor" strokeWidth="0.8" className="scale-x-[-1]">
              <path d="M0,5 C4,1 8,9 12,5 C16,1 20,9 24,5"/>
            </svg>
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] md:text-xs uppercase tracking-[0.5em] font-bold text-brand-gold/80">Detalles del Evento</h4>
            <p className="text-brand-charcoal/70 leading-relaxed font-light text-[15px] italic px-4">
              Para que disfrutes al máximo cada instante junto a nosotros, ten en cuenta la siguiente información de interés:
            </p>
          </div>
        </motion.section>

        {/* Location / Event Details Section — Botanical Cards */}
        <section id="thevenue" className="pt-4 pb-24 bg-transparent relative text-center overflow-hidden">

          {/* Subtle gold watercolor blobs */}
          <div className="absolute top-10 left-1/4 w-64 h-64 rounded-full bg-brand-gold/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-20 right-1/4 w-64 h-64 rounded-full bg-brand-sage/5 blur-3xl pointer-events-none" />

          <div className="max-w-sm mx-auto px-6 relative z-10">
            {/* Hacienda Video Card with Location Info */}
            <motion.div
              variants={perspective3D}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              style={{ perspective: 1000 }}
              className="relative w-full max-w-[340px] aspect-[5/7] rounded-[2rem] border border-brand-gold/25 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] mx-auto bg-white"
            >
              {/* Background Image */}
              <img
                src="/images/salon_garden_card_bg.png"
                alt="Salón Garden Fondo"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />

              {/* Content Overlay */}
              <div className="absolute inset-0 z-10 flex flex-col">
                {/* Top Half: Empty space to let the doors show clearly */}
                <div className="h-[42%] md:h-[46%]" />

                {/* Bottom Half: Info overlay on the marble background */}
                <div className="flex-1 p-4 md:p-6 flex flex-col justify-center items-center text-center space-y-3 md:space-y-4">
                  {/* Title */}
                  <div className="space-y-1">
                    <span className="text-[10px] tracking-[0.25em] uppercase text-brand-sage font-bold block">Ubicación</span>
                    <h3 className="font-serif text-brand-charcoal text-2.5xl md:text-3xl italic font-bold">Salón Garden</h3>
                    <p className="text-brand-charcoal/70 font-light text-xs italic">Hacienda La Victoria, Subachoque</p>
                  </div>

                  <div className="w-12 h-[1px] bg-brand-gold/50 mx-auto" />

                  {/* Event Description */}
                  <p className="text-[9px] tracking-[0.18em] uppercase font-black text-brand-sage leading-relaxed">
                    Ceremonia, Recepción y Fiesta
                  </p>

                  {/* Maps Button */}
                  <div className="w-full pt-1 flex justify-center">
                    <motion.a
                      href="https://www.google.com/maps/search/Hacienda+La+Victoria+Subachoque"
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-[180px] py-3 bg-brand-sage hover:bg-brand-sage/95 border border-brand-gold/45 text-white text-[9px] tracking-[0.2em] font-black uppercase rounded-full shadow-md flex justify-center items-center gap-2 cursor-pointer transition-all duration-300"
                    >
                      Cómo llegar
                    </motion.a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Botanical divider */}
          <motion.div
            className="flex items-center justify-center gap-4 mt-16 mb-4 opacity-25 text-brand-sage"
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 0.25, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.svg
              width="80" height="20" viewBox="0 0 80 20" fill="none" stroke="currentColor" strokeWidth="1"
              initial={{ x: -20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.1 }}
            >
              <path d="M0,10 C20,10 20,2 40,2 C60,2 60,18 80,18" />
              <path d="M20,8 C20,4 26,2 28,6" />
              <path d="M55,14 C55,18 62,18 62,14" />
            </motion.svg>
            <motion.svg
              width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-brand-gold/60"
              initial={{ scale: 0, rotate: -45 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.25, type: 'spring', stiffness: 200 }}
            >
              <path d="M10,0 L12,7 L19,8 L14,13 L15,20 L10,17 L5,20 L6,13 L1,8 L8,7 Z" fill="currentColor" opacity="0.5" />
            </motion.svg>
            <motion.svg
              width="80" height="20" viewBox="0 0 80 20" fill="none" stroke="currentColor" strokeWidth="1" className="scale-x-[-1]"
              initial={{ x: 20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.1 }}
            >
              <path d="M0,10 C20,10 20,2 40,2 C60,2 60,18 80,18" />
              <path d="M20,8 C20,4 26,2 28,6" />
              <path d="M55,14 C55,18 62,18 62,14" />
            </motion.svg>
          </motion.div>

          {/* Dress Code Section */}
          <div className="max-w-sm mx-auto px-6 mt-8 relative z-10 flex flex-col items-center gap-5">
            <motion.div
              variants={perspective3D}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              style={{ perspective: 1000 }}
              onClick={() => setIsDressCodeOpen(true)}
              className="relative w-full max-w-[340px] aspect-[5/7] rounded-[2rem] border border-brand-gold/25 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] mx-auto bg-white cursor-pointer group"
            >
              {/* Image */}
              <img
                src="/images/codigo_vestimenta.png"
                alt="Código de Vestimenta"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Subtle hover overlay indicator */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur-sm text-brand-charcoal text-[9px] tracking-widest uppercase font-bold px-4 py-2.5 rounded-full shadow-md transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  Ver en detalle
                </div>
              </div>
            </motion.div>

            {/* Pinterest Inspiration Link */}
            <motion.a
              href="https://pin.it/3yICblsqK"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm text-brand-charcoal border border-brand-gold/20 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_25px_rgba(0,0,0,0.08)] hover:bg-white hover:border-brand-gold/40 transition-all duration-300 group"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#E60023] flex-shrink-0" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
              </svg>
              <span className="text-[10px] tracking-[0.15em] uppercase font-bold">Inspiración</span>
              <ExternalLink size={13} className="text-brand-sage/40 group-hover:text-brand-sage/70 transition-colors" />
            </motion.a>
          </div>

        </section>




        {/* Photo Carousel Header */}
        <section className="bg-transparent text-center pt-12 pb-8 space-y-3">
          <motion.span
            initial={{ opacity: 0, letterSpacing: '0.2em' }}
            whileInView={{ opacity: 0.6, letterSpacing: '0.5em' }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="text-[10px] tracking-[0.5em] uppercase font-black text-brand-sage/60 block"
          >Recuerdos</motion.span>
          <div style={{ perspective: 800 }}>
            <SplitText
              text="Nuestra historia en fotos"
              className="font-serif text-4xl text-brand-charcoal italic block"
              staggerDelay={0.035}
            />
          </div>
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="w-12 h-[1px] bg-brand-gold/30 mx-auto mt-4 origin-center"
          />
        </section>

        {/* Photo Carousel Section */}
        <PhotoCarousel />

        {/* Social & Details Section */}
        <section className="py-20 bg-transparent px-6 text-center space-y-20">
          {/* Instagram */}
          <motion.div
            className="max-w-md mx-auto space-y-6"
            variants={lineStagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.div
              variants={lineItem}
              style={{ perspective: 400 }}
            >
              <Camera className="mx-auto text-brand-sage/80" size={28} strokeWidth={1} />
            </motion.div>
            <motion.div variants={lineItem} style={{ perspective: 600 }}>
              <SplitText text="Instagram" className="font-serif text-4xl text-brand-charcoal italic block" staggerDelay={0.06} />
            </motion.div>
            <motion.p variants={lineItem} className="text-brand-charcoal/65 font-light text-xs max-w-xs mx-auto leading-relaxed">
              No nos queremos perder de nada. Por favor, comparte tus fotos y videos usando nuestro hashtag para que podamos revivir cada momento.
            </motion.p>
            <motion.a
              href="https://www.instagram.com/explore/tags/bodajuanyvale"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block px-10 py-3.5 bg-brand-sage text-white text-[10px] tracking-[0.3em] font-black uppercase rounded-full shadow-lg hover:shadow-brand-sage/25 transition-all"
            >
              #bodajuanyvale
            </motion.a>
          </motion.div>

          {/* Playlist */}
          <motion.div
            className="max-w-md mx-auto space-y-6"
            variants={lineStagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.div
              variants={lineItem}
              style={{ perspective: 400 }}
            >
              <Music className="mx-auto text-brand-sage/80" size={28} strokeWidth={1} />
            </motion.div>
            <motion.div variants={lineItem} style={{ perspective: 600 }}>
              <SplitText text="Playlist" className="font-serif text-4xl text-brand-charcoal italic block" staggerDelay={0.08} />
            </motion.div>
            <motion.p variants={lineItem} className="text-brand-charcoal/65 font-light text-xs max-w-xs mx-auto leading-relaxed">
              La fiesta la haces tú. Ayúdanos con la música recomendándonos una canción que no puede faltar.
            </motion.p>
            <motion.button
              onClick={() => setIsSongOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block px-10 py-3.5 bg-brand-sage text-white text-[10px] tracking-[0.3em] font-black uppercase rounded-full shadow-lg hover:shadow-brand-sage/25 transition-all cursor-pointer"
            >
              Añadir Canción
            </motion.button>
          </motion.div>
        </section>

        {/* Gifts Section */}
        <section id="gifts" className="py-16 bg-transparent px-6 relative overflow-hidden text-center">
          <motion.div
            variants={perspective3D}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            style={{ perspective: 1000 }}
            className="relative w-full max-w-[340px] aspect-[5/7] rounded-[2rem] border border-brand-gold/25 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] mx-auto bg-white"
          >
            {/* Background Image */}
            <img
              src="/images/card_gifts_bg.png"
              alt="Regalos Fondo"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />

            {/* Content Overlay */}
            <div className="absolute inset-0 z-10 p-6 flex flex-col justify-center items-center text-center space-y-6">
              <div className="space-y-1 pt-4">
                <span className="text-[9px] tracking-[0.4em] uppercase font-bold text-brand-sage">Un Detalle</span>
                <h3 className="font-serif text-3.5xl text-brand-charcoal italic font-medium">Regalos</h3>
              </div>

              <div className="w-8 h-[1px] bg-brand-gold/40" />

              <div className="space-y-4 max-w-[220px] mx-auto">
                <div className="w-12 h-12 bg-brand-sage/5 rounded-full flex items-center justify-center mx-auto text-brand-sage">
                  <Mail size={22} strokeWidth={1.5} />
                </div>
                <p className="text-[12.5px] text-brand-charcoal/90 font-light italic leading-relaxed">
                  Su presencia es nuestro mejor regalo, pero si desean tener un detalle con nosotros,
                  contaremos con "Lluvia de sobres" el día de nuestra boda.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Message Card & Photo */}
        <section className="py-20 bg-transparent text-center space-y-8">
          <div className="max-w-md mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 25, filter: 'blur(6px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="flex items-center justify-center gap-3 mb-4 opacity-30 text-brand-sage"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                style={{ originX: 0.5 }}
              >
                <svg width="30" height="14" viewBox="0 0 30 14" fill="none" stroke="currentColor" strokeWidth="0.8">
                  <path d="M0,7 C5,2 10,12 15,7 C20,2 25,12 30,7" />
                </svg>
                <svg width="10" height="10" viewBox="0 0 10 10" className="text-brand-gold/60"><path d="M5 0 L6.2 3.8 L10 5 L6.2 6.2 L5 10 L3.8 6.2 L0 5 L3.8 3.8 Z" fill="currentColor" /></svg>
                <svg width="30" height="14" viewBox="0 0 30 14" fill="none" stroke="currentColor" strokeWidth="0.8" className="scale-x-[-1]">
                  <path d="M0,7 C5,2 10,12 15,7 C20,2 25,12 30,7" />
                </svg>
              </motion.div>
              <p className="text-brand-charcoal/60 leading-relaxed font-light text-base italic px-4">
                "Cada uno de ustedes ha sido parte fundamental de nuestra historia. Queremos agradecerles de corazón por su amor y apoyo constante."
              </p>
              <motion.div
                className="flex justify-center items-center gap-4 text-brand-sage/70 mt-5"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.4 }}
              >
                <div className="h-[1px] w-12 bg-brand-sage/20" />
                <span className="font-serif text-2xl italic">Juan &amp; Vale</span>
                <div className="h-[1px] w-12 bg-brand-sage/20" />
              </motion.div>
            </motion.div>

            <motion.div
              className="relative pt-10 max-w-xs mx-auto"
              initial={{ opacity: 0, scale: 0.93, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="absolute -inset-4 border border-brand-sage/10 rounded-[2rem] -rotate-2" />
              <div className="absolute -inset-2 border border-brand-gold/8 rounded-[2rem] rotate-1" />
              <img
                src="/images/3.jpeg"
                className="w-full aspect-[4/5] object-cover rounded-[2rem] shadow-xl relative z-10"
                alt="Moment"
              />
            </motion.div>
          </div>
        </section>

        {/* RSVP Section */}
        <section id="rsvp" className="pt-20 pb-36 bg-transparent px-6 relative overflow-hidden text-center">
          <motion.div
            variants={perspective3D}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            style={{ perspective: 1000 }}
            className="relative w-full max-w-[340px] aspect-[5/7] rounded-[2rem] border border-brand-gold/25 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] mx-auto bg-white"
          >
            {/* Background Image */}
            <img
              src="/images/card_rsvp_bg.png"
              alt="Confirmación de Asistencia Fondo"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />

            {/* Content Overlay */}
            <div className="absolute inset-0 z-10 p-6 flex flex-col justify-center items-center text-center space-y-6">
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="font-serif text-brand-charcoal text-3.5xl md:text-4xl leading-none italic font-medium pt-4"
              >
                {isPluralInvitation ? "¿Nos acompañan?" : "¿Nos acompañas?"}
              </motion.h3>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.75 }}
                transition={{ delay: 0.3, duration: 1 }}
                className="text-[12px] text-brand-charcoal/90 font-light max-w-[190px] mx-auto italic leading-relaxed"
              >
                {isPluralInvitation
                  ? 'Estamos listos para decir "Sí" y queremos que sean parte de este nuevo comienzo. Por favor confirmen antes del 15 de Julio.'
                  : 'Estamos listos para decir "Sí" y queremos que seas parte de este nuevo comienzo. Por favor confirma antes del 15 de Julio.'
                }
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 1 }}
                className="pt-2"
              >
                <button
                  onClick={() => setIsRSVPOpen(true)}
                  className="px-6 py-3.5 bg-brand-sage text-white text-[8px] tracking-[0.25em] font-black rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all uppercase border border-brand-gold/20 hover:shadow-brand-sage/20 cursor-pointer"
                >
                  Confirmar asistencia
                </button>
              </motion.div>
            </div>
          </motion.div>
          <RSVPModal isOpen={isRSVPOpen} onClose={() => setIsRSVPOpen(false)} guestName={guestName} />
          <SongModal isOpen={isSongOpen} onClose={() => setIsSongOpen(false)} guestName={guestName} />
          <DressCodeModal isOpen={isDressCodeOpen} onClose={() => setIsDressCodeOpen(false)} />
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

