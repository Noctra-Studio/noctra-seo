export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

export const stagger = (delayChildren = 0.08) => ({
  hidden: {},
  visible: { transition: { staggerChildren: delayChildren } },
});

export const slideRight = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

// Usage:
// const ref = useRef(null);
// const inView = useInView(ref, { once: true, margin: '-80px' });
// <motion.div ref={ref} variants={fadeUp} initial="hidden" animate={inView ? "visible" : "hidden"}>
