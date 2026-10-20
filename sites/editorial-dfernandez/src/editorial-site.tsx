"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent } from "react";
import { ArrowUpRight, ArrowDown, ChevronLeft, ChevronRight, Rotate3D, Play, Pause, X, Menu, MapPin, Phone, Check, Maximize2, MoveUpRight, MessageCircle, MousePointer2, RotateCcw, VolumeX, Sun, Moon, Navigation } from "lucide-react";
import styles from "./editorial.module.css";
import { useGlassDialog } from "./use-glass-dialog";

const asset = (file: string) => `/editorial/${file}`;
const whatsapp = "https://wa.me/51916227046";
const location = "-13.13684362522656,-74.23237880290648";
const mapDirections = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`;
const themeStorageKey = "dfernandez-theme";
const books = [
  { key: "A", name: "Atenas", title: "Razonamiento verbal", level: "6.º de primaria", color: "#224974" },
  { key: "C", name: "Colegio Center", title: "Historia universal", level: "4.º de secundaria", color: "#cfae44" },
  { key: "M", name: "María Romero", title: "Comunicación II", level: "3.º de primaria", color: "#254529" },
  { key: "T", name: "Diego Thompson", title: "Razonamiento matemático", level: "6.º de primaria", color: "#28633d" },
  { key: "V", name: "Von Neumann", title: "Texto institucional", level: "Edición para el colegio", color: "#b55224" },
];
const clips = [
  { slug: "atenas", name: "Atenas", detail: "Razonamiento verbal", duration: "0:11" },
  { slug: "center", name: "Colegio Center", detail: "Historia universal", duration: "0:10" },
  { slug: "maria-romero", name: "María Romero", detail: "Comunicación", duration: "0:14" },
  { slug: "diego-thompson", name: "Diego Thompson", detail: "Nuestros textos por dentro", duration: "0:12" },
  { slug: "diego-thompson-2", name: "Diego Thompson", detail: "Una mirada a los detalles", duration: "0:11" },
  { slug: "editorial", name: "D’Fernandez", detail: "Nuestra identidad editorial", duration: "0:10" },
];
const finishes = [
  { name: "Espiral plástico", short: "Flexible y práctico.", text: "Una opción ligera para cuadernos de trabajo que se abren y se usan todos los días.", kind: "plastic" },
  { name: "Espiral metálico", short: "Firme en cada vuelta.", text: "Una encuadernación resistente, con apertura cómoda para escribir y trabajar en clase.", kind: "metal" },
  { name: "Encolado", short: "Todo permanece unido.", text: "Un lomo continuo y páginas bien sujetas: una presentación limpia, pensada para durar.", kind: "glued" },
];

function Book({ index, className = "", binding = "glued", decorative = false }: { index: number; className?: string; binding?: string; decorative?: boolean }) {
  const book = books[index % books.length];
  return <div className={`${styles.book} ${className}`} style={{ "--spine-color": book.color } as CSSProperties} aria-hidden={decorative || undefined}>
    <div className={styles.bookFront}><img src={asset(`${book.key}-front.webp`)} alt={decorative ? "" : `Portada de ${book.title}, ${book.name}`} width="459" height="650" draggable="false" />
      {binding !== "glued" && <span className={`${styles.rings} ${binding === "metal" ? styles.metal : ""}`} aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} />)}</span>}
    </div>
    <div className={styles.bookBack}><img src={asset(`${book.key}-back.webp`)} alt={decorative ? "" : `Contraportada de ${book.name}`} width="459" height="650" draggable="false" /></div>
    <div className={styles.bookSpine}><span>{book.title}</span><b>D’FERNANDEZ</b></div>
    <div className={styles.bookPages} /><div className={styles.bookTop} /><div className={styles.bookBottom} />
  </div>;
}

function MotionVideo({ slug, paused, className }: { slug: string; paused: boolean; className?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = (visible: boolean) => {
      if (visible && !paused && !reduce.matches && document.visibilityState === "visible") void el.play().catch(() => {});
      else el.pause();
    };
    let visible = false;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(visible); }, { threshold: 0.2 });
    const sync = () => update(visible);
    observer.observe(el);
    document.addEventListener("visibilitychange", sync);
    reduce.addEventListener("change", sync);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", sync); reduce.removeEventListener("change", sync); el.pause(); };
  }, [slug, paused]);
  return <video ref={video} key={slug} className={className} src={asset(`${slug}-silent.mp4`)} poster={asset(`${slug}-poster.jpg`)} muted loop playsInline preload="none" aria-label={`Video de ${clips.find(c => c.slug === slug)?.name ?? "la editorial"}`} />;
}

export default function EditorialSite() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const dragging = useRef<{ x: number; y: number; rotation: number } | null>(null);
  const suppressBookClick = useRef(false);
  const menuPanel = useRef<HTMLElement>(null);
  const videoStage = useRef<HTMLDivElement>(null);
  const quoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeBook, setActiveBook] = useState(0);
  const [rotation, setRotation] = useState(-24);
  const [spinning, setSpinning] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [paused, setPaused] = useState(false);
  const [activeClip, setActiveClip] = useState(0);
  const [modalClip, setModalClip] = useState<number | null>(null);
  const [bookOpen, setBookOpen] = useState(false);
  const [inspectorBinding, setInspectorBinding] = useState("glued");
  const [activeSection, setActiveSection] = useState("inicio");
  const [finish, setFinish] = useState(2);
  const [ink, setInk] = useState("A color");
  const [institution, setInstitution] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [course, setCourse] = useState("");
  const [formError, setFormError] = useState("");
  const selected = books[activeBook];
  const videoDialog = useGlassDialog(modalClip !== null, () => setModalClip(null), paused);
  const bookDialog = useGlassDialog(bookOpen, () => setBookOpen(false), paused);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => {
      let saved: string | null = null;
      try { saved = window.localStorage.getItem(themeStorageKey); } catch { /* The theme still works when storage is unavailable. */ }
      setTheme(saved === "dark" || saved === "light" ? saved : preference.matches ? "dark" : "light");
    };
    const storageChanged = (event: StorageEvent) => { if (event.key === themeStorageKey || event.key === null) syncTheme(); };
    syncTheme();
    preference.addEventListener("change", syncTheme);
    window.addEventListener("storage", storageChanged);
    return () => { preference.removeEventListener("change", syncTheme); window.removeEventListener("storage", storageChanged); };
  }, []);

  useEffect(() => {
    const els = root.current?.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) { entry.target.setAttribute("data-seen", "true"); observer.unobserve(entry.target); }
    }, { threshold: 0.08 });
    els?.forEach(el => observer.observe(el));
    return () => { observer.disconnect(); if (quoteTimer.current) clearTimeout(quoteTimer.current); };
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const scroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const height = document.documentElement.scrollHeight - window.innerHeight;
        root.current?.style.setProperty("--reading-progress", String(height > 0 ? window.scrollY / height : 0));
        if (root.current) root.current.dataset.scrolled = String(window.scrollY > 24);
        if (!paused && !reduce.matches) {
          stage.current?.style.setProperty("--scroll-turn", `${Math.min(window.scrollY / 70, 8)}deg`);
          stage.current?.style.setProperty("--scroll-lift", `${Math.min(window.scrollY / 14, 26)}px`);
        }
        frame = 0;
      });
    };
    window.addEventListener("scroll", scroll, { passive: true });
    scroll();
    return () => { window.removeEventListener("scroll", scroll); cancelAnimationFrame(frame); };
  }, [paused]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setActiveSection(visible[0].target.id);
    }, { rootMargin: "-15% 0px -55% 0px", threshold: [0, 0.1, 0.5] });
    root.current?.querySelectorAll("main > section[id]").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const frame = videoStage.current;
    if (!frame || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const move = frame.animate([
      { opacity: 0.25, transform: "translateX(22px) rotateY(-7deg) scale(.985)" },
      { opacity: 1, transform: "translateX(0) rotateY(0deg) scale(1)" },
    ], { duration: 340, easing: "cubic-bezier(.16,1,.3,1)" });
    return () => move.cancel();
  }, [activeClip, paused]);

  function moveStage(event: PointerEvent<HTMLDivElement>) {
    if (paused || dragging.current || !window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--pointer-x", `${((event.clientX - rect.left) / rect.width - 0.5) * 7}deg`);
    event.currentTarget.style.setProperty("--pointer-y", `${(0.5 - (event.clientY - rect.top) / rect.height) * 5}deg`);
  }

  function dragBook(event: PointerEvent<HTMLElement>) {
    if (!dragging.current) return;
    if (Math.hypot(event.clientX - dragging.current.x, event.clientY - dragging.current.y) > 6) suppressBookClick.current = true;
    const value = dragging.current.rotation + (event.clientX - dragging.current.x) * 0.7;
    setRotation(Math.max(-180, Math.min(180, value)));
  }

  function startDrag(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    dragging.current = { x: event.clientX, y: event.clientY, rotation };
    suppressBookClick.current = false;
    setSpinning(false);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function chooseBook(index: number) { setActiveBook((index + books.length) % books.length); setRotation(-24); setSpinning(false); }
  function openBook(index: number, binding = "glued") {
    if (index !== activeBook) chooseBook(index);
    setInspectorBinding(binding);
    setBookOpen(true);
  }
  function closeMenu() { menuPanel.current?.hidePopover(); }
  function changeTheme(value: "light" | "dark") {
    setTheme(value);
    try { window.localStorage.setItem(themeStorageKey, value); } catch { /* Keep the selected appearance for this visit. */ }
  }
  function submitQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const count = Number(quantity);
    if (!institution.trim()) { setFormError("Escribe el nombre de tu institución."); return; }
    if (!Number.isInteger(count) || count < 1) { setFormError("Ingresa una cantidad válida de ejemplares."); return; }
    setFormError("");
    const message = `Hola, Editorial D’Fernandez. Quisiera una cotización para mi institución.\n\nInstitución: ${institution.trim()}\nCantidad: ${count} ejemplares\nImpresión: ${ink}\nEncuadernación: ${finishes[finish].name}${course.trim() ? `\nGrado, curso o detalles: ${course.trim()}` : ""}\n\n¿Podrían orientarme con una propuesta y el plazo de entrega?`;
    window.open(`${whatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return <div ref={root} className={styles.site} data-paused={paused} data-theme={theme}>
    <a className={styles.skipLink} href="#inicio">Ir al contenido</a>
    <div className={styles.readingProgress} aria-hidden="true" />
    <header className={styles.header}>
      <a href="#inicio" className={styles.logo} aria-label="Editorial D’Fernandez, inicio"><img src={asset("logo.webp")} alt="D’Fernandez · Grupo Editorial" width="290" height="96" /></a>
      <button type="button" className={styles.themeToggle} onClick={() => changeTheme(theme === "light" ? "dark" : "light")} aria-label={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"} aria-pressed={theme === "dark"} title={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}>{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}<span>{theme === "light" ? "Modo oscuro" : "Modo claro"}</span></button>
    </header>
    <button id="editorial-menu-toggle" type="button" className={styles.sideMenuButton} popoverTarget="editorial-navigation" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen} aria-controls="editorial-navigation">{menuOpen ? <X size={19} /> : <Menu size={19} />}<span>Menú</span></button>
    <nav ref={menuPanel} id="editorial-navigation" className={styles.sidePanel} popover="auto" aria-label="Navegación principal" onToggle={event => setMenuOpen(event.currentTarget.matches(":popover-open"))}>
      <div className={styles.sidePanelHeader}><a href="#inicio" onClick={closeMenu} aria-label="Editorial D’Fernandez, inicio"><img src={asset("logo.webp")} alt="D’Fernandez · Grupo Editorial" width="215" height="72" /></a><button type="button" popoverTarget="editorial-navigation" popoverTargetAction="hide" aria-label="Cerrar navegación"><X size={19} /></button></div>
      <a href="#textos" aria-current={activeSection === "textos" ? "location" : undefined} onClick={closeMenu}>Nuestros textos <ArrowUpRight size={17} /></a>
      <a href="#acabados" aria-current={activeSection === "acabados" ? "location" : undefined} onClick={closeMenu}>Acabados <ArrowUpRight size={17} /></a>
      <a href="#nosotros" aria-current={activeSection === "nosotros" ? "location" : undefined} onClick={closeMenu}>La editorial <ArrowUpRight size={17} /></a>
      <a href="#contacto" aria-current={activeSection === "contacto" ? "location" : undefined} onClick={closeMenu}>Contacto <ArrowUpRight size={17} /></a>
      <div className={styles.themePicker} role="group" aria-label="Apariencia de la página"><span>Apariencia</span><div><button type="button" onClick={() => changeTheme("light")} aria-pressed={theme === "light"}><Sun size={15} />Claro</button><button type="button" onClick={() => changeTheme("dark")} aria-pressed={theme === "dark"}><Moon size={15} />Oscuro</button></div></div>
      <a href="#cotizar" className={styles.primaryButton} onClick={closeMenu}>Cotizar para mi institución <ArrowUpRight size={17} /></a>
    </nav>

    <main>
      <section className={styles.hero} id="inicio" aria-labelledby="hero-heading">
        <div className={styles.heroCopy}>
          <h1 id="hero-heading" data-reveal>Textos con<br />tu identidad.</h1>
          <p className={styles.heroDescription} data-reveal>Textos escolares personalizados con <strong>el logo de tu institución</strong> y contenidos adaptados a <strong>tu currícula.</strong></p>
          <a href="#cotizar" className={styles.primaryButton} data-reveal>Cotizar para mi institución <ArrowUpRight size={20} /></a>
          <p className={styles.institutionNotice} data-reveal><strong>Venta exclusiva para instituciones educativas.</strong><span>No realizamos venta individual de ejemplares.</span></p>
          <div className={styles.heroFoot} data-reveal><MapPin size={17} /><span>Hechos en Ayacucho. Pensados para aprender.</span></div>
        </div>
        <div className={styles.heroVisual} ref={stage} onPointerMove={moveStage} onPointerLeave={event => { event.currentTarget.style.setProperty("--pointer-x", "0deg"); event.currentTarget.style.setProperty("--pointer-y", "0deg"); }}>
          <div className={styles.glassLayers} aria-hidden="true"><i /><i /><i /></div>
          <div className={styles.heroScene}>
            <div className={styles.sideBookLeft}><Book index={(activeBook + 2) % books.length} decorative /></div>
            <div className={styles.sideBookRight}><Book index={(activeBook + 1) % books.length} decorative /></div>
            <div className={`${styles.mainBookWrap} ${spinning && !paused ? styles.spinning : ""}`} style={{ "--user-turn": `${rotation}deg` } as CSSProperties}>
              <div key={selected.key} className={styles.bookSwap}><Book index={activeBook} decorative /></div>
            </div>
          </div>
          <button type="button" className={`${styles.bookTarget} ${styles.bookTargetLeft}`} onClick={() => openBook((activeBook + 2) % books.length)} aria-label={`Ver ${books[(activeBook + 2) % books.length].name} en 3D`} aria-haspopup="dialog" />
          <button type="button" className={`${styles.bookTarget} ${styles.bookTargetRight}`} onClick={() => openBook((activeBook + 1) % books.length)} aria-label={`Ver ${books[(activeBook + 1) % books.length].name} en 3D`} aria-haspopup="dialog" />
          <button type="button" className={`${styles.bookTarget} ${styles.bookTargetMain}`} onPointerDown={startDrag} onPointerMove={dragBook} onPointerUp={() => { dragging.current = null; }} onPointerCancel={() => { dragging.current = null; suppressBookClick.current = false; }} onClick={event => { if (event.detail === 0 || !suppressBookClick.current) openBook(activeBook); suppressBookClick.current = false; }} aria-label={`Ver ${selected.name} en 3D`} aria-haspopup="dialog" />
          <button className={styles.rotateButton} onClick={() => openBook(activeBook)} aria-haspopup="dialog"><Maximize2 size={17} />Explorar en 3D</button>
          <span className={styles.dragHint}><MousePointer2 size={14} />Pulsa un libro o arrastra</span>
          <div className={styles.bookCaption} aria-live="polite"><div><strong>{selected.name}</strong><span>{selected.title} · {selected.level || "Edición institucional"}</span></div><div className={styles.arrows}><button onClick={() => chooseBook(activeBook - 1)} aria-label="Libro anterior"><ChevronLeft size={20} /></button><button onClick={() => chooseBook(activeBook + 1)} aria-label="Libro siguiente"><ChevronRight size={20} /></button></div></div>
          <label className={styles.turnControl}><span>Gira el libro</span><input type="range" min="-180" max="180" step="1" value={rotation} aria-label="Ángulo de giro del libro" onChange={e => { setRotation(Number(e.target.value)); setSpinning(false); }} /><span>360°</span></label>
        </div>
      </section>

      <div className={styles.introBand}><p>Tu logo. Tu currícula.<br /><strong>Nuestra pasión por imprimirlo bien.</strong></p><a href="#textos">Conoce nuestro trabajo <ArrowDown size={19} /></a></div>

      <section id="textos" className={styles.workSection} aria-labelledby="work-heading">
        <div className={styles.sectionHeading}><h2 id="work-heading" data-reveal>La calidad se ve.</h2><p data-reveal>Portadas, interiores y acabados.<br />Nuestros trabajos, en movimiento.</p></div>
        <div className={styles.videoExperience}>
          <div className={styles.videoStage} data-reveal>
            <div className={styles.videoFloat} ref={videoStage}><div className={styles.videoFrame} onPointerMove={event => {
              if (paused || !window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
              const rect = event.currentTarget.getBoundingClientRect();
              event.currentTarget.style.setProperty("--video-tilt-x", `${(0.5 - (event.clientY - rect.top) / rect.height) * 6}deg`);
              event.currentTarget.style.setProperty("--video-tilt-y", `${((event.clientX - rect.left) / rect.width - 0.5) * 6}deg`);
            }} onPointerLeave={event => { event.currentTarget.style.setProperty("--video-tilt-x", "0deg"); event.currentTarget.style.setProperty("--video-tilt-y", "0deg"); }}><MotionVideo slug={clips[activeClip].slug} paused={paused || modalClip !== null || bookOpen} className={styles.galleryVideo} /><button className={styles.soundButton} onClick={() => setModalClip(activeClip)} aria-label={`Ampliar video de ${clips[activeClip].name}`}><Maximize2 size={18} /><span>Ampliar video</span><MoveUpRight size={17} /></button></div></div>
            
          </div>
          <div className={styles.videoIndex}><p className={styles.galleryIntro} data-reveal>Una buena impresión<br />habla por sí sola.</p><div className={styles.clipList} role="group" aria-label="Selecciona uno de nuestros seis videos">{clips.map((clip, i) => <button key={clip.slug} className={`${styles.clipButton} ${activeClip === i ? styles.clipActive : ""}`} onClick={() => setActiveClip(i)} aria-pressed={activeClip === i} data-reveal><img src={asset(`${clip.slug}-poster.jpg`)} alt="" width="52" height="68" loading="lazy" /><span><strong>{clip.name}</strong><span>{clip.detail}</span></span><span className={styles.clipDuration}>{clip.duration}</span><span className={styles.clipPlay}>{activeClip === i ? <span className={styles.equalizer}><i /><i /><i /></span> : <Play size={15} />}</span></button>)}</div></div>
        </div>
      </section>

      <section id="acabados" className={styles.finishSection} aria-labelledby="finish-heading">
        <div className={styles.sectionHeading}><h2 id="finish-heading" data-reveal>Hechos para durar.</h2><p data-reveal>Cada institución es distinta.<br />El acabado también puede serlo.</p></div>
        <div className={styles.finishExperience}>
          <div className={`${styles.finishVisual} ${ink === "Blanco y negro" ? styles.monochrome : ""}`} data-reveal><button type="button" className={styles.finishBook} onClick={() => openBook(0, finishes[finish].kind)} aria-label="Ver muestra de Atenas en 3D" aria-haspopup="dialog"><Book index={0} binding={finishes[finish].kind} decorative /></button><span>Una muestra. Muchas posibilidades.</span></div>
          <div className={styles.finishCopy}>
            <div className={styles.inkToggle} role="group" aria-label="Tipo de impresión">{["A color", "Blanco y negro"].map(value => <button key={value} onClick={() => setInk(value)} aria-pressed={ink === value} className={ink === value ? styles.inkActive : ""}>{value}</button>)}</div>
            <h3 data-reveal>Elige cómo se siente.</h3><p data-reveal>Impresión láser con textos nítidos y gráficos definidos. Encuadernación a la medida del uso en el aula.</p>
            <div className={styles.finishOptions} role="group" aria-label="Tipo de encuadernación">{finishes.map((item, i) => <button key={item.kind} onClick={() => setFinish(i)} aria-pressed={finish === i} className={finish === i ? styles.finishSelected : ""}><span><strong>{item.name}</strong><span>{item.short}</span></span><span className={styles.choiceCircle}>{finish === i && <Check size={16} />}</span></button>)}</div>
            <p className={styles.finishDetail} aria-live="polite">{finishes[finish].text}</p><a href="#cotizar" className={styles.textLink}>Cotizar con este acabado <ArrowUpRight size={19} /></a>
          </div>
        </div>
        <div className={styles.materials}>
          <div className={styles.materialPhoto} data-reveal><img src={asset("binding-detail.webp")} alt="Detalle ilustrativo de las páginas y el lomo de un texto encolado" width="1536" height="1024" loading="lazy" /></div>
          <div className={styles.materialStatement} data-reveal><h3>Nitidez en<br />cada página.</h3><p>Desde una página en blanco y negro hasta una edición a todo color. Cuidamos la impresión y la unión de cada texto para acompañar el ritmo de las clases.</p><span>Impresión láser · Blanco y negro · Color</span></div>
        </div>
      </section>

      <section id="nosotros" className={styles.storySection} aria-labelledby="story-heading">
        <div className={styles.storySticky}><h2 id="story-heading" data-reveal>De tu idea<br />al aula.</h2><p data-reveal>Somos Editorial D’Fernandez. Desde Ayacucho, elaboramos textos escolares para instituciones que buscan una presentación a la altura de sus contenidos.</p><img src={asset("mascot.webp")} alt="La mascota de Editorial D’Fernandez: un libro que acompaña el aprendizaje" width="260" height="260" loading="lazy" /></div>
        <div className={styles.storySteps}>
          <article data-reveal><h3>Todo empieza<br />con tu institución.</h3><p>Cuéntanos qué textos necesitas, para qué grados y cuántos ejemplares. Te orientamos para definir tu pedido.</p></article>
          <article data-reveal><h3>Tu identidad,<br />en cada página.</h3><p>Personalizamos portadas e interiores con el logo y la identidad de tu institución. Adecuamos nuestra propuesta de contenidos y materiales educativos a tu currícula.</p></article>
          <article data-reveal><h3>Listos para<br />el aula.</h3><p>Coordinamos los detalles de producción y entrega según tu proyecto. Atención directa, desde el primer mensaje.</p></article>
        </div>
      </section>

      <section id="cotizar" className={styles.quoteSection} aria-labelledby="quote-heading">
        <div className={styles.quoteIntro}><h2 id="quote-heading" data-reveal>Tu próximo libro<br />empieza aquí.</h2><p data-reveal>Cuéntanos qué necesita tu institución.<br />Preparemos juntos una propuesta a medida.</p><p className={styles.institutionNotice} data-reveal><strong>Venta exclusiva para instituciones educativas.</strong><span>No realizamos venta individual de ejemplares.</span></p><a href="tel:+51916227046"><Phone size={19} />916 227 046 <ArrowUpRight size={18} /></a></div>
        <form className={styles.quoteForm} onSubmit={submitQuote}>
          <label htmlFor="institution">Nombre de tu institución<input id="institution" name="institution" placeholder="Colegio, academia o institución" autoComplete="organization" value={institution} onChange={e => setInstitution(e.target.value)} required maxLength={150} /></label>
          <div className={styles.formRow}><label htmlFor="quantity">Cantidad de ejemplares<input id="quantity" name="quantity" type="number" inputMode="numeric" min="1" step="1" max="1000000" value={quantity} onChange={e => setQuantity(e.target.value)} required /></label><label htmlFor="printing">Impresión<select id="printing" value={ink} onChange={e => setInk(e.target.value)}><option>A color</option><option>Blanco y negro</option></select></label></div>
          <label htmlFor="binding">Encuadernación<select id="binding" value={finish} onChange={e => setFinish(Number(e.target.value))}>{finishes.map((item, i) => <option value={i} key={item.kind}>{item.name}</option>)}</select></label>
          <label htmlFor="details">Grado, curso o detalles <span>(opcional)</span><textarea id="details" name="details" placeholder="Cuéntanos un poco más sobre tu proyecto…" rows={2} maxLength={1200} value={course} onChange={e => setCourse(e.target.value)} /></label>
          {formError && <p role="alert">{formError}</p>}
          <button type="submit" className={styles.primaryButton}>Solicitar cotización por WhatsApp <ArrowUpRight size={20} /></button><p className={styles.formNote}>Se abrirá WhatsApp con tu consulta. Tú decides cuándo enviarla.</p>
        </form>
      </section>

      <section id="contacto" className={styles.contactSection} aria-labelledby="contact-heading">
        <div className={styles.contactHeading}><div><h2 id="contact-heading" data-reveal>Nos vemos en Ayacucho.</h2><p>Asoc. Los Artesanos, Mz. C, lote 01<br />Ayacucho, Perú</p></div><a className={styles.contactPhone} href={`${whatsapp}?text=${encodeURIComponent("Hola, quisiera información sobre los textos escolares de Editorial D’Fernandez.")}`} target="_blank" rel="noreferrer"><span>Hablemos de tus textos</span>916 227 046 <ArrowUpRight /></a></div>
        <div className={styles.locationMap}>
          <iframe src={`https://www.google.com/maps?q=${encodeURIComponent(location)}&z=17&output=embed`} title="Ubicación de Editorial D’Fernandez en Ayacucho" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
          <div className={styles.mapCaption}><div><MapPin size={21} /><span><strong>Editorial D’Fernandez</strong><span>Asoc. Los Artesanos · Mz. C, lote 01</span></span></div><a href={mapDirections} target="_blank" rel="noreferrer"><Navigation size={16} />Cómo llegar <ArrowUpRight size={17} /></a></div>
        </div>
      </section>
    </main>

    <footer className={styles.footer}><a href="#inicio" className={styles.footerBrand} aria-label="Editorial D’Fernandez, volver al inicio"><img src={asset("logo.webp")} alt="D’Fernandez · Grupo Editorial" width="600" height="200" loading="lazy" /></a><div className={styles.footerBottom}><p>© {new Date().getFullYear()} Editorial D’Fernandez. Ayacucho, Perú.</p><span>Imprimimos lo que enseñas.</span><button onClick={() => { setPaused(!paused); setSpinning(false); }} aria-pressed={paused}>{paused ? <Play size={14} /> : <Pause size={14} />}{paused ? "Activar movimiento" : "Pausar movimiento"}</button><a href="#inicio">Volver arriba <ArrowUpRight size={15} /></a></div></footer>
    <a href="#cotizar" className={styles.floatingContact} aria-label="Solicitar cotización"><MessageCircle size={23} /></a>

    <dialog ref={videoDialog.ref} className={`${styles.glassDialog} ${styles.videoDialog}`} onCancel={event => { event.preventDefault(); videoDialog.requestClose(); }} onClose={() => setModalClip(null)} onClick={event => { if (event.target === event.currentTarget) videoDialog.requestClose(); }} onKeyDown={event => { if (event.target instanceof HTMLVideoElement) return; if (event.key === "ArrowRight") setModalClip(index => index === null ? 0 : (index + 1) % clips.length); if (event.key === "ArrowLeft") setModalClip(index => index === null ? 0 : (index + clips.length - 1) % clips.length); }} aria-labelledby="video-dialog-title">
      <div className={styles.dialogHeader}><div><h2 id="video-dialog-title">{modalClip !== null ? clips[modalClip].name : "Nuestros trabajos"}</h2><span><VolumeX size={13} />Video sin audio</span></div><button onClick={videoDialog.requestClose} aria-label="Cerrar video"><X size={22} /></button></div>
      {modalClip !== null && <video key={clips[modalClip].slug} src={asset(`${clips[modalClip].slug}-silent.mp4`)} poster={asset(`${clips[modalClip].slug}-poster.jpg`)} controls autoPlay muted playsInline preload="metadata" aria-label={`Video ampliado de ${clips[modalClip].name}`} />}
      <div className={styles.dialogVideoNav}><button onClick={() => setModalClip(index => index === null ? 0 : (index + clips.length - 1) % clips.length)} aria-label="Video anterior"><ChevronLeft size={18} /></button><p>{modalClip !== null ? clips[modalClip].detail : "Nuestros textos"}</p><button onClick={() => setModalClip(index => index === null ? 0 : (index + 1) % clips.length)} aria-label="Video siguiente"><ChevronRight size={18} /></button></div>
    </dialog>

    <dialog ref={bookDialog.ref} className={`${styles.glassDialog} ${styles.bookDialog}`} onCancel={event => { event.preventDefault(); bookDialog.requestClose(); }} onClose={() => { setBookOpen(false); setSpinning(false); }} onClick={event => { if (event.target === event.currentTarget) bookDialog.requestClose(); }} aria-labelledby="book-dialog-title">
      <div className={styles.dialogHeader}><div><h2 id="book-dialog-title">Una muestra, de cerca.</h2><span>Explora nuestras producciones editoriales</span></div><button onClick={bookDialog.requestClose} aria-label="Cerrar muestra"><X size={22} /></button></div>
      <div className={styles.bookDialogBody}>
        <div className={styles.inspectorStage}><div className={`${styles.inspectorBook} ${spinning ? styles.inspectorSpinning : ""}`} style={{ "--user-turn": `${rotation}deg` } as CSSProperties} onPointerDown={startDrag} onPointerMove={dragBook} onPointerUp={() => { dragging.current = null; }} onPointerCancel={() => { dragging.current = null; suppressBookClick.current = false; }}><div key={selected.key} className={styles.bookSwap}><Book index={activeBook} binding={inspectorBinding} /></div></div></div>
        <div className={styles.inspectorDetails}><p className={styles.inspectorInstitution} aria-live="polite">{selected.name}</p><h3>{selected.title}</h3><p>{selected.level || "Edición institucional"}</p><p className={styles.inspectorNote}>Tu logo en portadas e interiores. Nuestra propuesta educativa, adaptada a la currícula de tu institución.</p>
          <div className={styles.viewControls}><button onClick={() => { setRotation(-24); setSpinning(false); }}><RotateCcw size={14} />Portada</button><button onClick={() => { setRotation(156); setSpinning(false); }}>Reverso</button><button onClick={() => setSpinning(!spinning)} aria-pressed={spinning}><Rotate3D size={16} />{spinning ? "Detener" : "Giro 360°"}</button></div>
          <label className={styles.inspectorRange}>Gira la muestra<input type="range" min="-180" max="180" value={rotation} aria-label="Giro de la muestra ampliada" onChange={event => { setRotation(Number(event.target.value)); setSpinning(false); }} /></label>
          <div className={styles.inspectorNavigation}><button onClick={() => chooseBook(activeBook - 1)} aria-label="Muestra anterior"><ChevronLeft size={18} /></button><span>Explora los cinco textos</span><button onClick={() => chooseBook(activeBook + 1)} aria-label="Muestra siguiente"><ChevronRight size={18} /></button></div>
          <button className={styles.primaryButton} onClick={() => { bookDialog.requestClose(); if (quoteTimer.current) clearTimeout(quoteTimer.current); quoteTimer.current = setTimeout(() => document.getElementById("cotizar")?.scrollIntoView({ behavior: paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }), 180); }}>Cotizar para mi institución <ArrowUpRight size={18} /></button>
        </div>
      </div>
    </dialog>
  </div>;
}
